import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Package, Crown } from "lucide-react";
import SnorkelIcon from "@/components/icons/SnorkelIcon";
import SeascooterIcon from "@/components/icons/SeascooterIcon";
import ParkingIcon from "@/components/icons/ParkingIcon";
import PaddleSurfIcon from "@/components/icons/PaddleSurfIcon";
import NeveraIcon from "@/components/icons/NeveraIcon";
import BebidasIcon from "@/components/icons/BebidasIcon";
import { openWhatsApp } from "@/utils/whatsapp";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import {
  trackBookingStarted,
  trackWhatsAppClick,
  trackGenerateLead,
  trackBookingStepView,
  trackBookingStepComplete,
  trackBookingValidationError,
  trackBookingModalDismiss,
  trackBookingAbandoned,
  trackDateSelected,
  trackTimeSlotSelected,
  trackDurationSelected,
  trackExtrasChanged,
  trackCouponApplied,
  trackExitIntentShown,
  trackExitIntentCtaClick,
} from "@/utils/analytics";
import { getStoredUtm } from "@/hooks/useUtmCapture";
import { useLicenseVerifier } from "@/hooks/useLicenseVerifier";
import { BOAT_DATA, EXTRA_PACKS } from "@shared/boatData";
import { calculateExtrasPrice, calculatePackSavings, getAvailableDurationsForDate, filterActivePrices, type DurationOption, type Duration } from "@shared/pricing";
import { useBoatPricingAllDurations } from "@/hooks/useBoatPricingAllDurations";
import { useBoatPricingForDate } from "@/hooks/useBoatPricingForDate";
import BookingWizardMobile from "@/components/BookingWizardMobile";
import BookingFormDesktop from "@/components/BookingFormDesktop";
import { BookingConfirmation } from "@/components/BookingConfirmation";
import { useIsMobile } from "@/hooks/use-mobile";
import { PHONE_PREFIXES, filterPhonePrefixes, findPrefixByCode, getDefaultPhonePrefixForLanguage } from "@/utils/phone-prefixes";
import { validateEmail, validatePhone, validateRequired, validateBookingDate, getLocalISODate } from "@/utils/booking-validation";
import { OPERATING_START_HOUR, OPERATING_END_HOUR } from "@shared/constants";
import { isJetSkiProduct } from "@shared/jetskiProducts";

// Generated from shared operating hours so the dropdown can never include a
// slot the server doesn't know about (the server uses the same bounds to
// compute availability).
const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = OPERATING_START_HOUR; h <= OPERATING_END_HOUR - 1; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    if (h < OPERATING_END_HOUR - 1) slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
})();

/** Availability data returned by GET /api/availability */
export interface SlotAvailability {
  availableSlots: { time: string; maxDuration: number }[];
  unavailableSlots: string[];
}

/** P1.9: pick the N start slots whose time is closest to the requested
 *  preferredTime AND whose maxDuration covers the requested rental length.
 *  Symmetric distance (HH:MM minute-distance) keeps the suggestion balanced
 *  around the preferred hour (e.g. preferred 12:00 → suggest 11:30 + 12:30
 *  before 09:00). */
function pickClosestAlternatives(
  preferredTime: string,
  requiredDurationHours: number,
  availableSlots: { time: string; maxDuration: number }[],
  count: number,
): { time: string; maxDuration: number }[] {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const target = toMinutes(preferredTime);
  return [...availableSlots]
    .filter((s) => s.maxDuration >= requiredDurationHours)
    .sort(
      (a, b) =>
        Math.abs(toMinutes(a.time) - target) -
        Math.abs(toMinutes(b.time) - target),
    )
    .slice(0, count);
}

// Map icon name strings from boatData to Lucide icon components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  Crown,
  Nevera: NeveraIcon,
  Snowflake: NeveraIcon,
  Snorkel: SnorkelIcon,
  Eye: SnorkelIcon,
  Seascooter: SeascooterIcon,
  Zap: SeascooterIcon,
  Parking: ParkingIcon,
  CircleParking: ParkingIcon,
  PaddleSurf: PaddleSurfIcon,
  Waves: PaddleSurfIcon,
  Bebidas: BebidasIcon,
  Beer: BebidasIcon,
};

interface BookingFormWidgetProps {
  preSelectedBoatId?: string;
  prefillDate?: string;
  prefillTime?: string;
  prefillDuration?: string;
  prefillCoupon?: string;
  onClose?: () => void;
  hideHeader?: boolean;
}

// Step names used in GA4 funnel events. Keep in sync with the wizard UI.
const STEP_NAMES: Record<number, string> = {
  1: "when_who",
  2: "boat",
  3: "departure_duration",
  4: "extras",
  5: "your_details",
};

export default function BookingFormWidget({ preSelectedBoatId: rawPreSelectedBoatId, prefillDate, prefillTime, prefillDuration, prefillCoupon, onClose }: BookingFormWidgetProps) {
  // Safety net: jet skis use their own request modal (JetSkiRequestModal), never
  // this per-hour boat wizard. Ignore any jet ski id passed as a preselection so
  // it can't be carried into the wizard (the boat list already excludes them).
  const preSelectedBoatId = isJetSkiProduct(rawPreSelectedBoatId) ? undefined : rawPreSelectedBoatId;
  // Form state
  const [website, setWebsite] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  // P0.3 (2026-05-19): default prefix derived from the user's context, not
  // hardcoded +34. Priority: (1) previously-saved session value, (2) URL
  // language path (/de/, /fr/, ...), (3) browser navigator language, (4) +34.
  // The dropdown remains available for any user whose country doesn't match
  // their UI language.
  const [phonePrefix, setPhonePrefix] = useState<string>(() => {
    if (typeof window === "undefined") return "+34";
    try {
      const raw = window.sessionStorage.getItem("bookingFormState");
      if (raw) {
        const saved = JSON.parse(raw) as { phonePrefix?: string };
        if (saved.phonePrefix) return saved.phonePrefix;
      }
    } catch { /* fall through to language detection */ }
    const pathLang = window.location.pathname.match(/^\/([a-z]{2})(?:\/|$)/)?.[1];
    const lang = pathLang || (typeof navigator !== "undefined" ? navigator.language : "") || "es";
    return getDefaultPhonePrefixForLanguage(lang);
  });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [numberOfPeople, setNumberOfPeople] = useState("2");
  const [preferredTime, setPreferredTime] = useState(prefillTime || "10:00");
  const [showPrefixDropdown, setShowPrefixDropdown] = useState(false);
  const [prefixSearch, setPrefixSearch] = useState("");
  const [licenseFilter, setLicenseFilter] = useState<"with" | "without">("without");
  const licenseVerifier = useLicenseVerifier();
  const [selectedBoat, setSelectedBoat] = useState<string>(preSelectedBoatId || "");
  // Secondary boat for multi-boat bookings (groups too big for a single boat).
  // Empty string == single-boat flow (default).
  const [selectedSecondaryBoat, setSelectedSecondaryBoat] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(() => {
    if (prefillDate) return prefillDate;
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilSat = dayOfWeek === 6 ? 7 : (6 - dayOfWeek);
    const nextSat = new Date(today);
    nextSat.setDate(today.getDate() + daysUntilSat);
    const y = nextSat.getFullYear();
    const m = String(nextSat.getMonth() + 1).padStart(2, '0');
    const d = String(nextSat.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [selectedDuration, setSelectedDuration] = useState<string>(prefillDuration || "");

  // Extras & Packs state
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [showExtras, setShowExtras] = useState(false);

  // RGPD consent
  const [privacyConsent, setPrivacyConsent] = useState(false);

  // Gift card / discount code state
  const [showCodeSection, setShowCodeSection] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [validatedCode, setValidatedCode] = useState<{
    type: "gift_card" | "discount";
    code: string;
    value?: number;
    percentage?: number;
  } | null>(null);
  const [codeError, setCodeError] = useState("");

  // Track which fields the user has interacted with (blurred)
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Wizard step navigation (5 steps, reordered so date is first):
  //   1. When + Who    → date + people
  //   2. Boat          → boat selection (with real prices for the chosen date)
  //   3. Departure     → preferred time + duration (with pricing override delta visible)
  //   4. Extras        → packs + individual extras ("Mejora tu día")
  //   5. Personal data → contact form + summary + RGPD + WhatsApp submit
  const TOTAL_STEPS = 5;
  const [currentStep, setCurrentStep] = useState(1);
  const prevSeasonRef = useRef<string>("");

  // Skip the boat selection step when a boatId was deep-linked (from a boat detail CTA)
  const skipBoatStep = !!preSelectedBoatId;

  // Hold countdown: starts when user reaches the final step
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [holdExpired, setHoldExpired] = useState(false);

  // P1.10 (2026-05-20): surfaced when sessionStorage restored a non-trivial
  // state (currentStep > 1) so the user understands why fields are pre-filled.
  const [restoredFromStorage, setRestoredFromStorage] = useState(false);

  // P1.9 (2026-05-20): conflict detected when the preferred slot becomes
  // unavailable (or its max duration drops below the chosen duration) while
  // the user is on step 4. We surface alternatives instead of failing
  // silently or letting the WhatsApp submit go through against a stale slot.
  const [slotConflict, setSlotConflict] = useState<{
    alternatives: { time: string; maxDuration: number }[];
    checkedAt: number;
  } | null>(null);
  // Dedup: trackBookingValidationError(5, "slot_taken") fires once per detection.
  const slotConflictTrackedRef = useRef(false);

  const queryClient = useQueryClient();

  // Booking confirmation overlay
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    boatName: string;
    date: string;
    time: string;
    duration: string;
    people: number;
    price: number | null;
  } | null>(null);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    // Defer one tick: getFieldError (closure over current state) is declared
    // below in the component body. By deferring, the call happens post-render
    // when the latest closure is available, and we report each (step, field)
    // error only once per session.
    setTimeout(() => {
      if (!getFieldError(field)) return;
      const key = `${currentStep}:${field}`;
      if (validationReportedRef.current.has(key)) return;
      validationReportedRef.current.add(key);
      trackBookingValidationError(currentStep, field);
    }, 0);
  };

  // --- H2: sessionStorage persistence ---
  const STORAGE_KEY = "bookingFormState";
  const STORAGE_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes
  const hasRestoredRef = useRef(false);

  // --- Funnel instrumentation refs ---
  // Timestamps & flags that survive renders without triggering them.
  const modalOpenedAtRef = useRef<number>(Date.now());
  const stepStartedAtRef = useRef<number>(Date.now());
  const submittedRef = useRef<boolean>(false);
  // Dedup map: only fire trackBookingValidationError once per (step, field).
  const validationReportedRef = useRef<Set<string>>(new Set());
  // Refs that mirror state, used by the unmount cleanup to read the latest
  // values without making the cleanup depend on currentStep/selectedBoat
  // (which would re-run the cleanup on every change).
  const currentStepRefForUnmount = useRef<number>(1);
  const selectedBoatRefForUnmount = useRef<string>("");
  // P1.11: exit-intent nudge reads i18n strings and partial booking data at
  // unmount-time — kept in refs so the cleanup closure isn't stale after
  // language changes or state edits.
  const selectedDateRefForUnmount = useRef<string>("");
  const preferredTimeRefForUnmount = useRef<string>("");

  // Restore saved state on mount (only if < 30 minutes old)
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        timestamp: number;
        selectedBoat: string;
        selectedSecondaryBoat?: string;
        selectedDate: string;
        preferredTime: string;
        selectedDuration: string;
        currentStep: number;
        selectedExtras: string[];
        selectedPack: string | null;
        firstName: string;
        lastName: string;
        phonePrefix: string;
        phoneNumber: string;
        email: string;
        numberOfPeople: string;
        licenseFilter: "with" | "without";
        licenseVerifier?: {
          country?: string;
          licenseType?: string;
          hasIcc?: boolean | null;
          status?: string | null;
          dismissed?: boolean;
        };
      };
      // Discard if too old
      if (Date.now() - saved.timestamp > STORAGE_MAX_AGE_MS) {
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }
      // Only restore if there's no pre-selected boat overriding, and the saved state has meaningful data
      if (saved.selectedBoat && !preSelectedBoatId) setSelectedBoat(saved.selectedBoat);
      if (saved.selectedSecondaryBoat) setSelectedSecondaryBoat(saved.selectedSecondaryBoat);
      if (saved.selectedDate && !prefillDate) setSelectedDate(saved.selectedDate);
      if (saved.preferredTime && !prefillTime) setPreferredTime(saved.preferredTime);
      if (saved.selectedDuration && !prefillDuration) setSelectedDuration(saved.selectedDuration);
      if (saved.selectedExtras?.length) setSelectedExtras(saved.selectedExtras);
      if (saved.selectedPack) setSelectedPack(saved.selectedPack);
      if (saved.firstName) setFirstName(saved.firstName);
      if (saved.lastName) setLastName(saved.lastName);
      if (saved.phonePrefix) setPhonePrefix(saved.phonePrefix);
      if (saved.phoneNumber) setPhoneNumber(saved.phoneNumber);
      if (saved.email) setEmail(saved.email);
      if (saved.numberOfPeople && saved.numberOfPeople !== "0") setNumberOfPeople(saved.numberOfPeople);
      if (saved.licenseFilter) setLicenseFilter(saved.licenseFilter);
      if (saved.licenseVerifier) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        licenseVerifier.hydrate(saved.licenseVerifier as any);
      }
      // Restore step, capped to the wizard's total step count
      if (saved.currentStep > 1) {
        setCurrentStep(Math.min(saved.currentStep, 5));
        // P1.10: only surface the banner when the user already advanced past
        // step 1 — restoring just a date on step 1 is silent and not disruptive.
        setRestoredFromStorage(true);
      }
    } catch {
      // Silently ignore corrupted storage
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Save form state to sessionStorage whenever key fields change
  useEffect(() => {
    // Don't save until restoration has happened
    if (!hasRestoredRef.current) return;
    try {
      const stateToSave = {
        timestamp: Date.now(),
        selectedBoat,
        selectedSecondaryBoat,
        selectedDate,
        preferredTime,
        selectedDuration,
        currentStep,
        selectedExtras,
        selectedPack,
        firstName,
        lastName,
        phonePrefix,
        phoneNumber,
        email,
        numberOfPeople,
        licenseFilter,
        licenseVerifier: licenseVerifier.state,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Silently ignore (e.g. storage full)
    }
  }, [
    selectedBoat, selectedSecondaryBoat, selectedDate, preferredTime, selectedDuration, currentStep,
    selectedExtras, selectedPack, firstName, lastName, phonePrefix, phoneNumber,
    email, numberOfPeople, licenseFilter, licenseVerifier.state,
  ]);

  // Clear sessionStorage on successful booking completion
  const clearBookingStorage = useCallback(() => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  // P1.10: dismiss the restore banner. When `startOver` is true, also wipe
  // sessionStorage and reset every form field to its initial value so the
  // user actually gets a clean slate instead of staring at fields they
  // wanted to ditch.
  const dismissRestoreBanner = useCallback((startOver: boolean) => {
    setRestoredFromStorage(false);
    if (!startOver) return;
    clearBookingStorage();
    // Recompute the next-Saturday default so the date matches what the user
    // would see opening a fresh wizard.
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilSat = dayOfWeek === 6 ? 7 : (6 - dayOfWeek);
    const nextSat = new Date(today);
    nextSat.setDate(today.getDate() + daysUntilSat);
    const y = nextSat.getFullYear();
    const m = String(nextSat.getMonth() + 1).padStart(2, "0");
    const d = String(nextSat.getDate()).padStart(2, "0");
    setSelectedBoat(preSelectedBoatId || "");
    setSelectedSecondaryBoat("");
    setSelectedDate(prefillDate || `${y}-${m}-${d}`);
    setSelectedDuration(prefillDuration || "");
    setPreferredTime(prefillTime || "10:00");
    setNumberOfPeople("2");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhoneNumber("");
    setSelectedExtras([]);
    setSelectedPack(null);
    setShowExtras(false);
    setValidatedCode(null);
    setCodeInput("");
    setShowCodeSection(false);
    setLicenseFilter("without");
    setHoldExpiresAt(null);
    setHoldExpired(false);
    setCurrentStep(1);
    // Reset funnel dedup so the same field can re-report if it fails again.
    validationReportedRef.current = new Set();
    // Mark this fresh state as "new step started" for time-on-step tracking.
    stepStartedAtRef.current = Date.now();
  }, [clearBookingStorage, preSelectedBoatId, prefillDate, prefillTime, prefillDuration]);

  // --- Funnel instrumentation effects ---
  // Mirror the latest currentStep & selectedBoat into refs so the unmount
  // cleanup (deps: []) can read the values at the moment of dismissal.
  useEffect(() => { currentStepRefForUnmount.current = currentStep; }, [currentStep]);
  useEffect(() => { selectedBoatRefForUnmount.current = selectedBoat; }, [selectedBoat]);
  // P1.11: same pattern for the exit-intent toast.
  useEffect(() => { selectedDateRefForUnmount.current = selectedDate; }, [selectedDate]);
  useEffect(() => { preferredTimeRefForUnmount.current = preferredTime; }, [preferredTime]);

  // Fire booking_step_view on every step change (and on mount). Resets the
  // per-step timer so handleNextStep can emit booking_step_complete with the
  // real time the user spent on the step they're leaving.
  useEffect(() => {
    trackBookingStepView(
      currentStep,
      STEP_NAMES[currentStep] || `step_${currentStep}`,
      selectedBoat || undefined,
    );
    stepStartedAtRef.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const { toast } = useToast();
  const t = useTranslations();
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const isSpanishLang = language === 'es' || language === 'ca';
  const prefixDropdownRef = useRef<HTMLDivElement>(null);

  // P1.11: refs so the unmount cleanup picks up the LATEST i18n + toast
  // dispatcher, not the closure captured at mount (which would go stale on
  // language change).
  const tRef = useRef(t);
  const toastRef = useRef(toast);
  useEffect(() => { tRef.current = t; }, [t]);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  // On unmount: if the user closed the modal without completing the request,
  // fire booking_abandoned (step ≥ 2 only — step 1 dismissals are very noisy
  // and not actionable) plus booking_modal_dismiss with the total open time.
  // P1.11 also offers a one-shot exit-intent WhatsApp nudge in the same path.
  useEffect(() => {
    // Snapshot the open-at timestamp so the cleanup reads the mount-time value,
    // not the live ref (which never changes, but eslint can't prove that).
    const openedAt = modalOpenedAtRef.current;
    return () => {
      if (submittedRef.current) return;
      const step = currentStepRefForUnmount.current;
      const boat = selectedBoatRefForUnmount.current || undefined;
      const timeOpenMs = Date.now() - openedAt;
      if (step > 1) {
        trackBookingAbandoned(`step_${step}`, boat || "unknown");
      }
      trackBookingModalDismiss(step, timeOpenMs, boat);

      // P1.11: exit-intent nudge — one toast per session, only when the user
      // had reached step ≥ 2 (real intent, not a casual modal-open dismissal).
      // The toast lives outside the closed modal so we honour the
      // "no modal-on-modal" constraint from the audit.
      if (step < 2) return;
      let alreadyShown = false;
      try {
        alreadyShown = sessionStorage.getItem("cbrb_exitIntentNudgeShown") === "1";
      } catch { /* sessionStorage unavailable — show anyway */ }
      if (alreadyShown) return;
      try { sessionStorage.setItem("cbrb_exitIntentNudgeShown", "1"); } catch { /* noop */ }

      const tt = tRef.current;
      const copy = tt.bookingWizard?.exitIntent;
      const title = copy?.title ?? "Tu reserva sigue ahí";
      const description = copy?.description ?? "¿Te ayudamos a confirmar por WhatsApp?";
      const cta = copy?.cta ?? "Hablar por WhatsApp";
      const baseMessage = copy?.whatsappMessage ??
        "Hola, estaba a punto de reservar un barco en Blanes. ¿Me ayudas a confirmar disponibilidad?";

      // Light personalisation: append the date/time the user already chose so
      // the WhatsApp thread opens with concrete context for the operator.
      const date = selectedDateRefForUnmount.current;
      const time = preferredTimeRefForUnmount.current;
      const contextBits: string[] = [];
      if (date) contextBits.push(date);
      if (time) contextBits.push(time);
      const whatsappMessage = contextBits.length > 0
        ? `${baseMessage} (${contextBits.join(", ")})`
        : baseMessage;

      trackExitIntentShown();
      toastRef.current({
        title,
        description,
        action: (
          <ToastAction
            altText={cta}
            onClick={() => {
              trackExitIntentCtaClick();
              openWhatsApp(whatsappMessage);
            }}
            className="bg-whatsapp hover:bg-whatsapp-hover text-foreground border-0 min-h-9"
          >
            <SiWhatsapp className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
            {cta}
          </ToastAction>
        ),
      });
    };
  }, []);

  // Update boat when preSelectedBoatId changes
  useEffect(() => {
    if (preSelectedBoatId) {
      setSelectedBoat(preSelectedBoatId);
    }
  }, [preSelectedBoatId]);

  // Auto-apply prefilled coupon code (from exit intent modal)
  useEffect(() => {
    if (prefillCoupon && !validatedCode) {
      setCodeInput(prefillCoupon);
      setShowCodeSection(true);
      // Auto-validate after a short delay to let the form render
      const timer = setTimeout(() => {
        const code = prefillCoupon.trim().toUpperCase();
        fetch("/api/discounts/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.valid) {
              setValidatedCode({
                type: "discount",
                code,
                percentage: data.discountPercent,
              });
            }
          })
          .catch(() => {
            toast({
              title: t.booking.errors?.codeValidation.title ?? "Error al validar código",
              description: t.booking.errors?.codeValidation.description
                ?? "No se pudo verificar el código de descuento. Inténtalo de nuevo.",
              variant: "destructive",
            });
          });
      }, 300);
      return () => clearTimeout(timer);
    }
    // The toast / validatedCode references inside the setTimeout closure are
    // intentionally outside the deps array — we only want this effect to
    // re-run when the prefill coupon arrives, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillCoupon]);

  // Close prefix dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (prefixDropdownRef.current && !prefixDropdownRef.current.contains(event.target as Node)) {
        setShowPrefixDropdown(false);
      }
    };
    if (showPrefixDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPrefixDropdown]);

  // Filter prefixes by search (using shared helper)
  const filteredPrefixes = filterPhonePrefixes(PHONE_PREFIXES, prefixSearch);

  // Get selected prefix info (using shared helper)
  const selectedPrefixInfo = findPrefixByCode(phonePrefix);

  // Fetch all boats from API
  const { data: allBoats = [], isLoading: isBoatsLoading } = useQuery<Boat[]>({
    queryKey: ["/api/boats"],
  });

  // Fetch real-time slot availability when boat + date are selected
  const { data: slotAvailability, isLoading: isAvailabilityLoading } = useQuery<SlotAvailability>({
    queryKey: ["/api/availability", selectedBoat, selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/availability?boatId=${encodeURIComponent(selectedBoat)}&date=${encodeURIComponent(selectedDate)}`);
      if (!res.ok) throw new Error("Failed to fetch availability");
      return res.json();
    },
    enabled: !!selectedBoat && !!selectedDate,
    staleTime: 60_000, // matches server Cache-Control
    refetchOnWindowFocus: true,
  });

  // Build a set of unavailable time slots for quick lookup
  const unavailableTimeSlots = useMemo(() => {
    if (!slotAvailability) return new Set<string>();
    return new Set(slotAvailability.unavailableSlots);
  }, [slotAvailability]);

  // Build a map of time -> maxDuration for available slots
  const slotMaxDuration = useMemo(() => {
    const map = new Map<string, number>();
    if (slotAvailability) {
      for (const slot of slotAvailability.availableSlots) {
        map.set(slot.time, slot.maxDuration);
      }
    }
    return map;
  }, [slotAvailability]);

  // Get max duration for the currently selected time slot
  const selectedTimeMaxDuration = useMemo(() => {
    if (!preferredTime || !slotMaxDuration.has(preferredTime)) return null;
    return slotMaxDuration.get(preferredTime) ?? null;
  }, [preferredTime, slotMaxDuration]);

  // Slots that ARE free at the start time but whose maxDuration is shorter
  // than the user-picked duration. Marking them disabled prevents the case
  // where 08:00 looks free but the duration won't fit before the next
  // existing booking.
  const tooShortTimeSlots = useMemo(() => {
    const set = new Set<string>();
    if (!slotAvailability || !selectedDuration) return set;
    const durationHours = parseInt(selectedDuration.replace("h", ""), 10);
    if (!Number.isFinite(durationHours) || durationHours < 1) return set;
    for (const slot of slotAvailability.availableSlots) {
      if (slot.maxDuration < durationHours) set.add(slot.time);
    }
    return set;
  }, [slotAvailability, selectedDuration]);

  // Reset time if it becomes unavailable — but ONLY while the user is still
  // editing the time (steps 1-3). On step 4 we surface a SlotConflictBanner
  // with alternatives instead of silently wiping the selection (P1.9).
  useEffect(() => {
    if (
      preferredTime &&
      unavailableTimeSlots.has(preferredTime) &&
      currentStep < 4
    ) {
      setPreferredTime("");
    }
  }, [unavailableTimeSlots, preferredTime, currentStep]);

  // Reset duration if it exceeds maxDuration for the selected time slot —
  // same guard as above: keep the value on step 4 so SlotConflictBanner can
  // explain it instead of silently zeroing the duration.
  useEffect(() => {
    if (
      selectedDuration &&
      selectedTimeMaxDuration !== null &&
      currentStep < 4
    ) {
      const durationHours = parseInt(selectedDuration.replace("h", ""));
      if (durationHours > selectedTimeMaxDuration) {
        setSelectedDuration("");
      }
    }
  }, [selectedTimeMaxDuration, selectedDuration, currentStep]);

  // P1.9: force a fresh availability fetch when the user lands on step 5 so
  // the conflict-detection effect below works against the latest data, not
  // a 60s-stale cache.
  useEffect(() => {
    if (currentStep === 5 && selectedBoat && selectedDate) {
      void queryClient.invalidateQueries({
        queryKey: ["/api/availability", selectedBoat, selectedDate],
      });
    }
  }, [currentStep, selectedBoat, selectedDate, queryClient]);

  // P1.9: detect a slot conflict on step 5. Triggers whenever
  // slotAvailability changes (cache refresh, refetchOnWindowFocus,
  // queryClient.invalidate above). Clears itself when the user picks a
  // valid alternative.
  useEffect(() => {
    if (currentStep !== 5) {
      if (slotConflict) setSlotConflict(null);
      slotConflictTrackedRef.current = false;
      return;
    }
    if (!preferredTime || !selectedDuration || !slotAvailability) return;

    const requiredDurationHours = parseInt(
      selectedDuration.replace("h", ""),
      10,
    ) || 1;
    const isTaken = unavailableTimeSlots.has(preferredTime);
    const slotInfo = slotAvailability.availableSlots.find(
      (s) => s.time === preferredTime,
    );
    const insufficient = !!slotInfo && slotInfo.maxDuration < requiredDurationHours;

    if (isTaken || insufficient) {
      const alts = pickClosestAlternatives(
        preferredTime,
        requiredDurationHours,
        slotAvailability.availableSlots,
        3,
      );
      const altsKey = alts.map((a) => a.time).join(",");
      setSlotConflict((prev) =>
        prev && prev.alternatives.map((a) => a.time).join(",") === altsKey
          ? prev
          : { alternatives: alts, checkedAt: Date.now() },
      );
      if (!slotConflictTrackedRef.current) {
        slotConflictTrackedRef.current = true;
        trackBookingValidationError(5, "slot_taken");
      }
    } else {
      if (slotConflict) setSlotConflict(null);
      slotConflictTrackedRef.current = false;
    }
  }, [
    currentStep,
    preferredTime,
    selectedDuration,
    slotAvailability,
    unavailableTimeSlots,
    slotConflict,
  ]);

  // P1.9 handlers passed to SlotConflictBanner in the wizards.
  const handlePickAlternativeSlot = useCallback((time: string) => {
    setPreferredTime(time);
    setSlotConflict(null);
    slotConflictTrackedRef.current = false;
  }, []);

  const handleChangeDateFromConflict = useCallback(() => {
    setSlotConflict(null);
    slotConflictTrackedRef.current = false;
    setCurrentStep(1);
  }, []);

  // Filter boats based on license selection, then sort by displayOrder
  // (same logic used in FleetSection so the wizard list mirrors the home).
  const filteredBoats = allBoats
    // Jet ski products are not part of the per-hour pricing engine — they use
    // their own slot-request modal in the fleet section, never this wizard.
    .filter(boat => !isJetSkiProduct(boat.id))
    .filter(boat => {
      if (licenseFilter === "with") return !!boat.requiresLicense;
      if (licenseFilter === "without") return !boat.requiresLicense;
      return true;
    })
    .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));

  // Get selected boat info
  const selectedBoatInfo = allBoats.find(boat => boat.id === selectedBoat);

  // Update license filter based on pre-selected boat
  useEffect(() => {
    if (preSelectedBoatId && selectedBoatInfo) {
      setLicenseFilter(selectedBoatInfo.requiresLicense ? "with" : "without");
    }
  }, [preSelectedBoatId, selectedBoatInfo]);

  // Reset boat selection when license filter changes if current boat doesn't match filter
  useEffect(() => {
    if (selectedBoat && selectedBoatInfo && !preSelectedBoatId) {
      if (licenseFilter === "with" && !selectedBoatInfo.requiresLicense) {
        setSelectedBoat("");
      } else if (licenseFilter === "without" && !!selectedBoatInfo.requiresLicense) {
        setSelectedBoat("");
      }
    }
  }, [licenseFilter, selectedBoat, selectedBoatInfo, preSelectedBoatId]);

  // Helper function to get current season based on selected date
  const getCurrentSeason = () => {
    const date = selectedDate ? new Date(selectedDate) : new Date();
    const month = date.getMonth() + 1;
    if (month === 8) return "ALTA";
    if (month === 7) return "MEDIA";
    return "BAJA";
  };

  // Date-aware prices from the same engine the public pricing calendar uses
  // (`/api/pricing/calendar`): includes the weekend +15% surcharge and any active
  // pricing override. The static catalog prices on `selectedBoatInfo.pricing` ignore
  // both, which is why the wizard used to disagree with the calendar. We prefer these
  // figures everywhere a price is shown, falling back to the catalog until they load.
  const datePricing = useBoatPricingAllDurations(selectedBoat, selectedDate);
  // Secondary boat (multi-boat group bookings) — only the selected duration is needed.
  const secondaryDatePricing = useBoatPricingForDate({
    boatId: selectedSecondaryBoat || null,
    date: selectedDate || null,
    duration: (selectedDuration || "4h") as Duration,
    enabled: !!selectedSecondaryBoat && !!selectedDate && !!selectedDuration,
  });

  // Single source for the date-aware price of a duration. The duration grid
  // and getBookingPrice (sticky bar + confirm step) MUST resolve through this
  // same function: two parallel implementations let the grid and the total
  // disagree transiently while /api/pricing/calendar loads (impeccable P1.15).
  const resolvePriceForDuration = (durationKey: string): number | null => {
    if (!selectedBoatInfo || !selectedBoatInfo.pricing) return null;
    // Prefer the date-aware price (weekend surcharge + override) so every
    // surface matches the public pricing calendar. Fall back to the static
    // catalog price until the API response loads.
    const dateAware = datePricing.prices[durationKey as Duration];
    if (typeof dateAware === "number") return dateAware;
    const season = getCurrentSeason();
    return selectedBoatInfo.pricing[season]?.prices[durationKey] || null;
  };

  // Map duration keys to i18n labels
  const durationLabelMap: Record<string, string> = {
    "1h": t.booking.oneHour || "1 hora",
    "2h": t.booking.twoHours || "2 horas",
    "3h": t.booking.threeHours || "3 horas",
    "4h": t.booking.fourHours || "4 horas - Medio dia",
    "6h": t.booking.sixHours || "6 horas",
    "8h": t.booking.eightHours || "8 horas - Dia completo",
  };

  // Build the restriction tooltip for a disabled duration option
  const getRestrictionTooltip = (opt: DurationOption): string => {
    if (!opt.restrictionReason || !opt.minimumRequired) return '';
    const minLabel = durationLabelMap[opt.minimumRequired] || opt.minimumRequired;
    if (opt.restrictionReason === 'peakSeasonMinimum') {
      return t.wizard.durationMinPeakSeason.replace('{duration}', opt.minimumRequired);
    }
    return t.wizard.durationMinWeekend.replace('{duration}', opt.minimumRequired);
  };

  // Duration options based on boat, license, date, and season restrictions
  const getDurationOptions = (): { value: string; label: string; price?: number; disabled?: boolean; disabledReason?: string }[] => {
    const getPriceForDuration = resolvePriceForDuration;

    // Durations the admin has disabled (price 0 / null) for the current season must not be offered.
    const hasActivePriceForDuration = (durationKey: string) => {
      const p = getPriceForDuration(durationKey);
      return typeof p === 'number' && p > 0;
    };

    const formatLabel = (durationKey: string, baseLabel: string) => {
      const price = getPriceForDuration(durationKey);
      return price ? `${baseLabel} - ${price}€` : baseLabel;
    };

    // When we have both a boat and a date, use the shared date-aware filter
    if (selectedBoatInfo && selectedDate) {
      const date = new Date(selectedDate + 'T12:00:00');
      let durationAvailability: DurationOption[];
      try {
        durationAvailability = getAvailableDurationsForDate(selectedBoatInfo.id, date);
      } catch {
        // Outside operational season — fall back to showing all boat durations without restriction
        durationAvailability = [];
      }

      if (durationAvailability.length > 0) {
        return durationAvailability
          .filter((opt) => hasActivePriceForDuration(opt.duration))
          .map((opt) => {
            const baseLabel = durationLabelMap[opt.duration] || opt.duration;
            const label = formatLabel(opt.duration, baseLabel);
            if (!opt.available) {
              return {
                value: opt.duration,
                label: baseLabel,
                disabled: true,
                disabledReason: getRestrictionTooltip(opt),
              };
            }
            return { value: opt.duration, label, price: getPriceForDuration(opt.duration) ?? undefined };
          });
      }
    }

    // Fallback: no boat selected yet, or date not set — show generic options by license type
    if (!selectedBoatInfo) {
      if (licenseFilter === "with") {
        return [
          { value: "2h", label: t.booking.twoHours || "2 horas" },
          { value: "4h", label: t.booking.fourHours || "4 horas - Medio dia" },
          { value: "8h", label: t.booking.eightHours || "8 horas - Dia completo" },
        ];
      }
      return [
        { value: "1h", label: t.booking.oneHour || "1 hora" },
        { value: "2h", label: t.booking.twoHours || "2 horas" },
        { value: "3h", label: t.booking.threeHours || "3 horas" },
        { value: "4h", label: t.booking.fourHours || "4 horas - Medio dia" },
        { value: "6h", label: t.booking.sixHours || "6 horas" },
        { value: "8h", label: t.booking.eightHours || "8 horas - Dia completo" },
      ];
    }

    // Boat selected but no date — show boat-specific durations without restrictions
    const licensedDurations = ["2h", "4h", "8h"] as const;
    const unlicensedDurations = ["1h", "2h", "3h", "4h", "6h", "8h"] as const;
    const durationLabelsBoat: Record<string, string> = {
      "1h": t.booking.oneHour || "1 hora",
      "2h": t.booking.twoHours || "2 horas",
      "3h": t.booking.threeHours || "3 horas",
      "4h": t.booking.fourHours || "4 horas - Medio dia",
      "6h": t.booking.sixHours || "6 horas",
      "8h": t.booking.eightHours || "8 horas - Dia completo",
    };
    const catalog = selectedBoatInfo.requiresLicense ? licensedDurations : unlicensedDurations;
    return catalog
      .filter(hasActivePriceForDuration)
      .map((d) => ({
        value: d,
        label: formatLabel(d, durationLabelsBoat[d]),
        price: getPriceForDuration(d) ?? undefined,
      }));
  };

  // Reset duration when the season changes OR when selected duration becomes disabled due to date change
  useEffect(() => {
    const newSeason = getCurrentSeason();
    if (prevSeasonRef.current && prevSeasonRef.current !== newSeason) {
      // Season changed — reset and auto-select first available
      const options = getDurationOptions();
      const firstAvailable = options.find(opt => !opt.disabled);
      setSelectedDuration(firstAvailable?.value || "");
    } else if (selectedDuration) {
      // Same season but date may have changed (e.g., weekday -> weekend)
      const options = getDurationOptions();
      const currentOpt = options.find(opt => opt.value === selectedDuration);
      if (currentOpt?.disabled) {
        // Auto-select the nearest available duration (prefer next higher)
        const currentIdx = options.findIndex(opt => opt.value === selectedDuration);
        const nextAvailable = options.slice(currentIdx + 1).find(opt => !opt.disabled)
          || options.find(opt => !opt.disabled);
        setSelectedDuration(nextAvailable?.value || "");
      }
    }
    prevSeasonRef.current = newSeason;
  }, [selectedDate]);

  // Reset duration if it's no longer valid or disabled when boat or license changes
  // Also set smart default when no duration is selected: 4h for no-licence, 8h for licence
  useEffect(() => {
    const validOptions = getDurationOptions();
    if (selectedDuration) {
      const currentOpt = validOptions.find(opt => opt.value === selectedDuration);
      if (!currentOpt || currentOpt.disabled) {
        const firstAvailable = validOptions.find(opt => !opt.disabled);
        setSelectedDuration(firstAvailable?.value || "");
      }
    } else if (selectedBoatInfo) {
      const defaultDuration = selectedBoatInfo.requiresLicense ? "8h" : "4h";
      const defaultOpt = validOptions.find(opt => opt.value === defaultDuration && !opt.disabled);
      if (defaultOpt) {
        setSelectedDuration(defaultOpt.value);
      } else {
        const firstAvailable = validOptions.find(opt => !opt.disabled);
        setSelectedDuration(firstAvailable?.value || "");
      }
    }
  }, [selectedBoat, selectedBoatInfo, licenseFilter]);

  // Multi-boat helpers
  const selectedSecondaryBoatInfo = allBoats.find(boat => boat.id === selectedSecondaryBoat);
  const selectedBoatIds = useMemo(() => {
    const ids: string[] = [];
    if (selectedBoat) ids.push(selectedBoat);
    if (selectedSecondaryBoat && selectedSecondaryBoat !== selectedBoat) ids.push(selectedSecondaryBoat);
    return ids;
  }, [selectedBoat, selectedSecondaryBoat]);
  const isMultiBoat = selectedBoatIds.length >= 2;

  // Helper function to get price (single or combined for multi-boat)
  const getBookingPrice = () => {
    if (!selectedDuration) return null;
    // Same resolver as the duration grid — sticky bar, confirm step and the
    // step-3 options can never show different figures for one selection.
    const primary = resolvePriceForDuration(selectedDuration);
    if (primary === null) return null;
    if (!isMultiBoat || !selectedSecondaryBoatInfo?.pricing) return primary;
    const season = getCurrentSeason();
    const catalogSecondary = selectedSecondaryBoatInfo.pricing[season]?.prices[selectedDuration] || 0;
    const secondary = secondaryDatePricing.finalPrice ?? catalogSecondary;
    return primary + secondary;
  };

  // Get max capacity (sum of selected boats if multi-boat)
  const getMaxCapacity = () => {
    if (isMultiBoat && selectedBoatInfo && selectedSecondaryBoatInfo) {
      return selectedBoatInfo.capacity + selectedSecondaryBoatInfo.capacity;
    }
    if (selectedBoatInfo) return selectedBoatInfo.capacity;
    return licenseFilter === "with" ? 8 : 7;
  };

  // Smart default: auto-select 4h duration (most popular) when boat changes
  // Only applies when duration is not already set by user or session restore
  useEffect(() => {
    if (!selectedBoat) return;
    // Don't override if user already has a valid duration selected
    if (selectedDuration) {
      const options = getDurationOptions();
      const currentValid = options.find(opt => opt.value === selectedDuration && !opt.disabled);
      if (currentValid) return;
    }
    const options = getDurationOptions();
    // Prefer 4h if available, otherwise pick the middle available option
    const fourHour = options.find(opt => opt.value === "4h" && !opt.disabled);
    if (fourHour) {
      setSelectedDuration("4h");
    } else {
      const available = options.filter(opt => !opt.disabled);
      if (available.length > 0) {
        const middleIdx = Math.floor(available.length / 2);
        setSelectedDuration(available[middleIdx].value);
      }
    }
  }, [selectedBoat]);

  // Reset extras when boat changes
  useEffect(() => {
    setSelectedExtras([]);
    setSelectedPack(null);
  }, [selectedBoat]);

  // Clear the secondary boat when the primary boat changes or the group shrinks.
  // Without this, stale secondary selections survive cross-flow and break capacity checks.
  useEffect(() => {
    const people = parseInt(numberOfPeople || '1');
    const primaryCapacity = selectedBoatInfo?.capacity ?? 0;
    if (selectedSecondaryBoat && (people <= primaryCapacity || selectedSecondaryBoat === selectedBoat)) {
      setSelectedSecondaryBoat("");
    }
  }, [selectedBoat, selectedBoatInfo, numberOfPeople, selectedSecondaryBoat]);

  // Compute next available Saturday for suggestion text near calendar
  const nextSaturdayISO = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 6=Sat
    const daysUntilSat = dayOfWeek === 6 ? 7 : (6 - dayOfWeek);
    const nextSat = new Date(today);
    nextSat.setDate(today.getDate() + daysUntilSat);
    const y = nextSat.getFullYear();
    const m = String(nextSat.getMonth() + 1).padStart(2, '0');
    const d = String(nextSat.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Get the extras for the currently selected boat from BOAT_DATA
  const boatExtras = useMemo(() => {
    if (!selectedBoat || !BOAT_DATA[selectedBoat]) return [];
    return BOAT_DATA[selectedBoat].extras;
  }, [selectedBoat]);

  // Determine which extras are covered by the selected pack
  const extrasInPack = useMemo(() => {
    if (!selectedPack) return new Set<string>();
    const pack = EXTRA_PACKS.find(p => p.id === selectedPack);
    return new Set(pack?.extras || []);
  }, [selectedPack]);

  // Handle pack selection (radio-like behavior)
  const handlePackSelect = (packId: string) => {
    if (!packId) {
      if (selectedPack) trackExtrasChanged(`pack:${selectedPack}`, selectedPack, false);
      setSelectedPack(null);
      setSelectedExtras([]);
      return;
    }
    if (selectedPack === packId) {
      trackExtrasChanged(`pack:${packId}`, packId, false);
      setSelectedPack(null);
      setSelectedExtras([]);
    } else {
      if (selectedPack) trackExtrasChanged(`pack:${selectedPack}`, selectedPack, false);
      trackExtrasChanged(`pack:${packId}`, packId, true);
      setSelectedPack(packId);
      const pack = EXTRA_PACKS.find(p => p.id === packId);
      if (pack) {
        const nonPackExtras = selectedExtras.filter(e => !pack.extras.includes(e));
        setSelectedExtras([...pack.extras, ...nonPackExtras]);
      }
    }
  };

  // P1.22 (2026-05-20): smooth scrolling honours prefers-reduced-motion to
  // avoid motion sickness for users with that OS setting enabled.
  const scrollFieldIntoView = useCallback((domId: string, delayMs = 50) => {
    if (typeof window === "undefined") return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => {
      document.getElementById(domId)?.scrollIntoView({
        behavior: reduceMotion ? "instant" : "smooth",
        block: "center",
      });
    }, delayMs);
  }, []);

  // Single "full name" input → split on the first whitespace and feed both
  // state fields. Backend still receives firstName + lastName (DB columns are
  // NOT NULL but accept empty strings, so a one-word name lands as
  // firstName="Iván", lastName="" without breaking validation).
  const onFullNameChange = useCallback((value: string) => {
    const trimmed = value.trimStart();
    const firstSpace = trimmed.search(/\s/);
    if (firstSpace === -1) {
      setFirstName(trimmed);
      setLastName("");
    } else {
      setFirstName(trimmed.slice(0, firstSpace));
      setLastName(trimmed.slice(firstSpace + 1));
    }
  }, []);

  // Tracked setters: wrap state setters so user-initiated changes emit GA4
  // funnel events. Plain setters keep being used by auto-resets (e.g. the
  // season-driven duration adjustment in the useEffect chain).
  const onDateSelectFromUser = useCallback((date: string) => {
    setSelectedDate(date);
    if (date) trackDateSelected(date, selectedBoat || "unknown");
  }, [selectedBoat]);

  const onTimeSelectFromUser = useCallback((time: string) => {
    setPreferredTime(time);
    if (time) trackTimeSlotSelected(time, selectedBoat || "unknown");
  }, [selectedBoat]);

  const onDurationSelectFromUser = useCallback((duration: string) => {
    setSelectedDuration(duration);
    if (duration) trackDurationSelected(duration, selectedBoat || "unknown");
  }, [selectedBoat]);

  // Handle individual extra toggle
  const handleExtraToggle = (extraName: string) => {
    if (extrasInPack.has(extraName)) return;
    const wasIncluded = selectedExtras.includes(extraName);
    setSelectedExtras(prev =>
      prev.includes(extraName)
        ? prev.filter(e => e !== extraName)
        : [...prev, extraName]
    );
    trackExtrasChanged(extraName, extraName, !wasIncluded);
  };

  // Calculate total extras price (packs + individual)
  const totalExtrasPrice = useMemo(() => {
    if (!selectedBoat || !BOAT_DATA[selectedBoat]) return 0;
    const packs = selectedPack ? [selectedPack] : [];
    return calculateExtrasPrice(selectedBoat, selectedExtras, packs);
  }, [selectedBoat, selectedExtras, selectedPack]);

  // Inline validation (using shared validators from booking-validation.ts)
  const getFieldError = (field: string): string => {
    // P2.11: prefer the context-aware "addName / pickDate / …" copy when the
    // key exists in the locale; fall back to the generic `required` so other
    // forms keep working and new translations have a runway.
    const v = t.validation;
    switch (field) {
      case 'firstName':
        // P0.6 (2026-05-19): the form now uses a single "full name" input.
        // The first word lands in firstName, the rest in lastName. We only
        // require firstName here; lastName is accepted as "" for one-word names.
        return validateRequired(firstName) ? (v.addName ?? v.required) : '';
      case 'email': {
        // Email is optional: only fail validation if the user typed something
        // that isn't a valid address. Empty input is accepted.
        if (!email.trim()) return '';
        return validateEmail(email) === 'invalid' ? v.invalidEmail : '';
      }
      case 'phone': {
        const phoneErr = validatePhone(phoneNumber);
        if (phoneErr === 'required') return v.addPhone ?? v.required;
        if (phoneErr === 'invalid') return v.invalidPhone;
        return '';
      }
      case 'date': {
        const dateErr = validateBookingDate(selectedDate, getLocalISODate());
        if (dateErr === 'required') return v.pickDate ?? v.required;
        if (dateErr === 'past') return v.futureDate;
        return '';
      }
      case 'time':
        return !preferredTime ? (v.pickTime ?? v.required) : '';
      case 'duration':
        return !selectedDuration ? (v.pickDuration ?? v.required) : '';
      case 'boat':
        return !selectedBoat ? (v.pickBoat ?? v.required) : '';
      case 'people':
        if (!numberOfPeople) return v.addPeople ?? v.required;
        if (parseInt(numberOfPeople) < 1) return v.minPeople;
        return '';
      default:
        return '';
    }
  };

  const showFieldError = (field: string): boolean => {
    return !!touched[field] && !!getFieldError(field);
  };

  // Step validation
  //  Step 1: When + Who      → date + people (soft cap = 12, capacity validated again on step 2)
  //  Step 2: Boat            → boat selected + people within boat capacity (skipped on deep-link)
  //  Step 3: Departure       → preferredTime + duration
  //  Step 4: Personal data   → first/last name + phone + email
  const canAdvanceFromStep1 = (): boolean => {
    const n = parseInt(numberOfPeople);
    const dateOk = !!selectedDate && selectedDate >= getLocalISODate();
    const peopleOk = !!numberOfPeople && n >= 1 && n <= 12;
    return dateOk && peopleOk;
  };

  const canAdvanceFromStep2 = (): boolean => {
    if (!selectedBoat) return false;
    const n = parseInt(numberOfPeople);
    return !!numberOfPeople && n >= 1 && n <= getMaxCapacity();
  };

  const canAdvanceFromStep3 = (): boolean => {
    return !!preferredTime && !!selectedDuration;
  };

  // canAdvanceFromStep4 — extras step. No validation; the user can pass
  // without selecting anything.
  const canAdvanceFromStep4 = (): boolean => true;

  const canAdvanceFromStep5 = (): boolean => {
    // Email is optional. Accept empty; reject only non-empty invalid input.
    const emailOk = !email.trim() || validateEmail(email) === null;
    // Single full-name input → only firstName is required (one-word names OK).
    return (
      !validateRequired(firstName) &&
      !validatePhone(phoneNumber) &&
      emailOk
    );
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!canAdvanceFromStep1()) {
        setTouched(prev => ({ ...prev, date: true, people: true }));
        const n = parseInt(numberOfPeople);
        const firstInvalid = !selectedDate || selectedDate < getLocalISODate()
          ? 'field-date'
          : (!numberOfPeople || n < 1)
          ? 'field-people'
          : null;
        if (firstInvalid) scrollFieldIntoView(firstInvalid);
        return;
      }
      // Deep-link short-circuit: skip the boat step when a boat was pre-selected from a boat detail CTA
      if (skipBoatStep && selectedBoat) {
        trackBookingStepComplete(
          currentStep,
          STEP_NAMES[currentStep] || `step_${currentStep}`,
          Date.now() - stepStartedAtRef.current,
          selectedBoat || undefined,
        );
        setCurrentStep(3);
        return;
      }
    }
    if (currentStep === 2) {
      if (!canAdvanceFromStep2()) {
        setTouched(prev => ({ ...prev, boat: true, people: true }));
        return;
      }
    }
    if (currentStep === 3) {
      if (!canAdvanceFromStep3()) {
        setTouched(prev => ({ ...prev, time: true, duration: true }));
        const firstInvalid = !preferredTime ? 'field-time' : !selectedDuration ? 'field-duration' : null;
        if (firstInvalid) scrollFieldIntoView(firstInvalid);
        return;
      }
      // Start the hold countdown when the user leaves step 3 (time/duration
      // chosen). The countdown is rendered only on the final step (5),
      // giving the user time to add extras (step 4) and fill in personal
      // data (step 5) before the soft-expiry kicks in. Licensed boats only.
      if (!holdExpiresAt && selectedBoatInfo?.requiresLicense) {
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        setHoldExpiresAt(expiresAt);
        setHoldExpired(false);
      }
    }
    // Step 4 (extras) has no validation — the user can pass freely.
    // The personal-data validation moved to step 5 and is enforced by
    // handleBookingSearch (submit) so we don't gate the Next button here.
    // All step guards passed — emit step_complete and advance.
    trackBookingStepComplete(
      currentStep,
      STEP_NAMES[currentStep] || `step_${currentStep}`,
      Date.now() - stepStartedAtRef.current,
      selectedBoat || undefined,
    );
    setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => {
      // Going back from departure (3) with a deep-linked boat → jump to step 1, skipping the boat step
      if (prev === 3 && skipBoatStep) return 1;
      return Math.max(prev - 1, 1);
    });
  };

  // Helper functions to format date
  const formatDateSpanish = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  };

  const formatDateEnglish = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getSeasonLabel = () => {
    const season = getCurrentSeason();
    if (season === "ALTA") return t.boatDetail.seasonHigh;
    if (season === "MEDIA") return t.boatDetail.seasonMid;
    return t.boatDetail.seasonLow;
  };

  const buildExtrasText = (isSpanish: boolean) => {
    const parts: string[] = [];

    if (selectedPack) {
      const pack = EXTRA_PACKS.find(p => p.id === selectedPack);
      if (pack) {
        parts.push(`Pack: ${isSpanish ? pack.name : pack.nameEN} (${pack.price}€)`);
      }
    }

    const nonPackExtras = selectedExtras.filter(e => !extrasInPack.has(e));
    if (nonPackExtras.length > 0) {
      const boatExtras = selectedBoat && BOAT_DATA[selectedBoat] ? BOAT_DATA[selectedBoat].extras : [];
      nonPackExtras.forEach(extraName => {
        const extraData = boatExtras.find(e => e.name === extraName);
        const priceStr = extraData?.price ? ` (${extraData.price})` : '';
        parts.push(`· ${extraName}${priceStr}`);
      });
    }

    if (parts.length === 0) return '';
    return parts.join('\n');
  };

  const createWhatsAppBookingMessage = () => {
    const isSpanish = language === 'es' || language === 'ca';
    const price = getBookingPrice();
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const phone = `${phonePrefix} ${phoneNumber.trim()}`;
    const boatName = isMultiBoat && selectedSecondaryBoatInfo
      ? `${selectedBoatInfo?.name || selectedBoat} + ${selectedSecondaryBoatInfo.name}`
      : (selectedBoatInfo?.name || selectedBoat);
    const formattedDate = isSpanish ? formatDateSpanish(selectedDate) : formatDateEnglish(selectedDate);
    const capacity = selectedBoatInfo?.capacity || "?";
    const deposit = selectedBoatInfo?.specifications?.deposit || "?";

    const durationOption = getDurationOptions().find(opt => opt.value === selectedDuration);
    const durationText = durationOption?.label.split(' - ')[0] || selectedDuration;

    const extrasText = buildExtrasText(isSpanish);
    const extrasBlock = extrasText ? `\n${extrasText}\n${isSpanish ? 'Total extras' : 'Extras total'}: ${totalExtrasPrice}€` : '';

    const codeDiscount = getCodeDiscount();
    const totalPrice = price ? price + totalExtrasPrice - codeDiscount : null;

    const separator = '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄';

    let codeBlock = '';
    if (validatedCode) {
      if (validatedCode.type === 'gift_card') {
        codeBlock = isSpanish
          ? `\n\n🎁 *Tarjeta regalo*\n${separator}\nCodigo: ${validatedCode.code}\nValor: -${codeDiscount}€`
          : `\n\n🎁 *Gift card*\n${separator}\nCode: ${validatedCode.code}\nValue: -${codeDiscount}€`;
      } else if (validatedCode.type === 'discount') {
        codeBlock = isSpanish
          ? `\n\n🏷️ *Descuento*\n${separator}\nCodigo: ${validatedCode.code}\nDescuento: ${validatedCode.percentage}% (-${codeDiscount}€)`
          : `\n\n🏷️ *Discount*\n${separator}\nCode: ${validatedCode.code}\nDiscount: ${validatedCode.percentage}% (-${codeDiscount}€)`;
      }
    }

    if (isSpanish) {
      return `⛵ *NUEVA PETICIÓN DE RESERVA*

👤 *Datos del cliente*
${separator}
Nombre: ${fullName}
Tel: ${phone}
Email: ${email.trim()}

🚤 *Detalles de la reserva*
${separator}
Barco: ${boatName}
Fecha: ${formattedDate}
Hora: ${preferredTime}h
Duracion: ${durationText}
Nº de Personas: ${numberOfPeople}
Temporada: ${getSeasonLabel()}
Precio base: ${price ? price + '€' : 'Consultar'}${extrasBlock ? `\n\n🎒 *Extras*\n${separator}` + extrasBlock : ''}${codeBlock}
${totalPrice ? `\n💰 *TOTAL: ${totalPrice}€*` : ''}
Fianza: ${deposit}

Quedo a la espera de confirmacion. ¡Gracias!`;
    } else {
      return `⛵ *NEW BOOKING REQUEST*

👤 *Client details*
${separator}
Name: ${fullName}
Phone: ${phone}
Email: ${email.trim()}

🚤 *Booking details*
${separator}
Boat: ${boatName}
Date: ${formattedDate}
Time: ${preferredTime}h
Duration: ${durationText}
Nº of People: ${numberOfPeople}
Season: ${getSeasonLabel()}
Base price: ${price ? price + '€' : 'Ask'}${extrasBlock ? `\n\n🎒 *Extras*\n${separator}` + extrasBlock : ''}${codeBlock}
${totalPrice ? `\n💰 *TOTAL: ${totalPrice}€*` : ''}
Deposit: ${deposit}

Looking forward to confirmation. Thanks!`;
    }
  };

  const handleValidateCode = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;

    setIsValidatingCode(true);
    setCodeError("");
    let success = false;

    // P2.4 (2026-05-21): the backend now returns a discriminated `errorCode`
    // (not_found / expired / consumed / cancelled / inactive). We capture the
    // most specific code seen across both endpoints — "expired" beats
    // "not_found" because the latter just means "not this type", whereas the
    // former is the real reason the code is unusable.
    const cv = t.codeValidation;
    const codeToMessage = (errorCode?: string): string => {
      switch (errorCode) {
        case "not_found": return cv.notFound ?? cv.invalidCode;
        case "expired": return cv.expired ?? cv.invalidCode;
        case "consumed": return cv.consumed ?? cv.invalidCode;
        case "cancelled": return cv.cancelled ?? cv.invalidCode;
        case "inactive": return cv.inactive ?? cv.invalidCode;
        default: return cv.invalidCode;
      }
    };

    try {
      let mostSpecificError: string | undefined;
      const noteError = (errorCode?: string) => {
        if (!errorCode) return;
        // Specific failure (expired / consumed / cancelled / inactive) always
        // wins, regardless of which endpoint reported it first — the user
        // wants to know the real reason the code is unusable, not that the
        // first probe failed.
        if (errorCode !== "not_found") {
          mostSpecificError = errorCode;
        } else if (!mostSpecificError) {
          mostSpecificError = errorCode;
        }
      };

      const giftCardRes = await fetch("/api/gift-cards/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (giftCardRes.ok) {
        const data = await giftCardRes.json();
        setValidatedCode({
          type: "gift_card",
          code,
          value: data.remainingBalance || data.amount,
        });
        success = true;
        return;
      }
      try {
        const errBody = await giftCardRes.json();
        noteError(errBody?.errorCode);
      } catch { /* non-JSON body — fall through */ }

      const discountRes = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (discountRes.ok) {
        const data = await discountRes.json();
        if (data.valid) {
          setValidatedCode({
            type: "discount",
            code,
            percentage: data.discountPercent,
          });
          success = true;
          return;
        }
        noteError(data?.errorCode);
      }

      setCodeError(codeToMessage(mostSpecificError));
    } catch {
      setCodeError(cv.invalidCode);
    } finally {
      setIsValidatingCode(false);
      trackCouponApplied(code, success);
    }
  };

  const handleRemoveCode = () => {
    setValidatedCode(null);
    setCodeInput("");
    setCodeError("");
  };

  const getCodeDiscount = (): number => {
    if (!validatedCode) return 0;
    const basePrice = getBookingPrice() || 0;
    const total = basePrice + totalExtrasPrice;

    if (validatedCode.type === "gift_card" && validatedCode.value) {
      return Math.min(validatedCode.value, total);
    }
    if (validatedCode.type === "discount" && validatedCode.percentage) {
      return Math.round((basePrice * validatedCode.percentage) / 100);
    }
    return 0;
  };

  const handleBookingSearch = async (): Promise<void> => {
    setTouched({
      firstName: true,
      phone: true,
      email: true,
      date: true,
      time: true,
      boat: true,
      duration: true,
      people: true,
    });

    // P0.7 (2026-05-19): single-toast validation. Previously each missing
    // field fired its own toast with an early return, so a user with two
    // missing fields only saw the first. Now we aggregate, track each error
    // for the funnel, navigate to the earliest broken step, and surface ONE
    // toast — the per-field inline errors already mark the offending inputs.
    const errors: string[] = [];
    if (!selectedDate) errors.push("date");
    if (!selectedBoat) errors.push("boat");
    if (!preferredTime) errors.push("time");
    if (!selectedDuration) errors.push("duration");
    if (!numberOfPeople || parseInt(numberOfPeople) < 1) errors.push("people");
    if (!firstName.trim()) errors.push("firstName");
    if (!phoneNumber.trim() || validatePhone(phoneNumber) !== null) errors.push("phone");
    if (email.trim() && validateEmail(email) === "invalid") errors.push("email");

    if (errors.length > 0) {
      const stepByField: Record<string, number> = {
        date: 1, people: 1,
        boat: 2,
        time: 3, duration: 3,
        // step 4 (extras) has no validated fields
        firstName: 5, phone: 5, email: 5,
      };

      // Funnel: report each unique (step, field) failure once per session.
      errors.forEach(f => {
        const step = stepByField[f] ?? currentStep;
        const key = `${step}:${f}`;
        if (!validationReportedRef.current.has(key)) {
          validationReportedRef.current.add(key);
          trackBookingValidationError(step, f);
        }
      });

      // Defensive: if the earliest error belongs to a previous step, walk the
      // user back there (canAdvanceFromStepN should prevent this in practice).
      const earliestStep = errors.reduce(
        (min, f) => Math.min(min, stepByField[f] ?? currentStep),
        currentStep,
      );
      if (earliestStep < currentStep) {
        setCurrentStep(earliestStep);
      }

      toast({
        title: t.wizard.missingFieldsTitle,
        description: t.wizard.missingFieldsDesc,
        variant: "destructive",
      });

      // Scroll the first invalid field into view (respects reduced motion).
      const fieldDomIds: Record<string, string> = {
        date: "field-date",
        people: "field-people",
        time: "field-time",
        duration: "field-duration",
        firstName: "wizard-fullname",
        phone: "wizard-phone",
        email: "wizard-email",
      };
      const elId = fieldDomIds[errors[0]];
      if (elId) scrollFieldIntoView(elId, 80);
      return;
    }

    // P1.9: slot was taken (or its max duration dropped below the chosen
    // duration) between selection and submit. The SlotConflictBanner is
    // already visible above the summary — guide the user to it instead of
    // firing WhatsApp + sendBeacon against a stale slot.
    if (slotConflict) {
      toast({
        title:
          t.bookingWizard?.slotConflict?.toastTitle ?? "Elige una alternativa",
        description:
          t.bookingWizard?.slotConflict?.toastDesc ??
          "Tu horario preferido ya no está disponible.",
        variant: "destructive",
      });
      scrollFieldIntoView("slot-conflict-banner", 80);
      return;
    }

    // From this point the user has actually submitted — flag it so the unmount
    // cleanup does NOT also fire booking_abandoned / booking_modal_dismiss.
    submittedRef.current = true;

    trackBookingStarted(selectedBoat, selectedBoatInfo?.name || selectedBoat, getStoredUtm());
    trackGenerateLead(selectedBoat, selectedBoatInfo?.name || selectedBoat, selectedBoatInfo?.pricePerHour ? Number(selectedBoatInfo.pricePerHour) : 70);

    // Open WhatsApp immediately (must be synchronous with user click to avoid popup blocker)
    trackWhatsAppClick("booking_form");
    const message = createWhatsAppBookingMessage();
    openWhatsApp(message);

    // P1.8 (2026-05-20): persist the inquiry via sendBeacon. The previous
    // fire-and-forget fetch would silently lose records when the browser tore
    // down the request while the user was navigating to WhatsApp; sendBeacon
    // is purpose-built for "send on the way out" payloads and the browser
    // guarantees best-effort delivery. Fallback to fetch + keepalive when
    // sendBeacon refuses the payload (rare — usually only over the 64KB cap
    // or in environments without the API).
    try {
      const price = getBookingPrice();
      const codeDiscount = getCodeDiscount();
      const total = price ? price + totalExtrasPrice - codeDiscount : null;
      const inquiryPayload = JSON.stringify({
        website,
        boatId: selectedBoat,
        boatIds: selectedBoatIds,
        boatName: isMultiBoat && selectedSecondaryBoatInfo
          ? `${selectedBoatInfo?.name || selectedBoat} + ${selectedSecondaryBoatInfo.name}`
          : (selectedBoatInfo?.name || selectedBoat),
        bookingDate: selectedDate,
        preferredTime: preferredTime || null,
        duration: selectedDuration,
        numberOfPeople: parseInt(numberOfPeople) || 0,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phonePrefix,
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || null,
        extras: selectedExtras.length > 0 ? selectedExtras : [],
        packId: selectedPack || null,
        couponCode: validatedCode?.code || null,
        estimatedTotal: total ? total.toFixed(2) : null,
        language,
        source: isMobile ? 'mobile' : 'desktop',
        licenseCountry: licenseVerifier.state.country || null,
        licenseType: licenseVerifier.state.country && licenseVerifier.state.licenseCode
          ? `${licenseVerifier.state.country.toLowerCase()}:${licenseVerifier.state.licenseCode}`
          : null,
        hasIcc: licenseVerifier.state.hasIcc,
        licenseVerificationStatus: licenseVerifier.state.status,
        licenseSpanishEquivalent: licenseVerifier.state.spanishEquivalent,
      });
      const blob = new Blob([inquiryPayload], { type: 'application/json' });
      const queued = typeof navigator !== "undefined"
        && typeof navigator.sendBeacon === "function"
        && navigator.sendBeacon('/api/booking-inquiries', blob);
      if (!queued) {
        // Fallback: keepalive lets the request survive page unload.
        fetch('/api/booking-inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: inquiryPayload,
          keepalive: true,
        }).catch(() => {
          toast({
            title: t.booking.errors?.inquirySave.title ?? "Error al guardar la solicitud",
            description: t.booking.errors?.inquirySave.description
              ?? "Tu mensaje por WhatsApp salió bien, pero no pudimos registrarlo internamente.",
            variant: "destructive",
          });
        });
      }
    } catch {
      // WhatsApp was already opened — the user-facing flow is intact.
    }

    toast({
      title: t.booking.requestSent?.title
        ?? (isSpanishLang ? 'Solicitud enviada por WhatsApp' : 'Request sent via WhatsApp'),
      description: t.booking.requestSent?.description
        ?? (isSpanishLang
          ? 'Revisa WhatsApp para confirmar tu reserva con nosotros.'
          : 'Check WhatsApp to confirm your booking with us.'),
    });

    // Show the enhanced confirmation overlay (peak-end rule)
    const bookingPrice = getBookingPrice();
    const discount = getCodeDiscount();
    const finalPrice = bookingPrice ? bookingPrice + totalExtrasPrice - discount : null;
    setConfirmationData({
      boatName: selectedBoatInfo?.name || selectedBoat,
      date: selectedDate,
      time: preferredTime,
      duration: selectedDuration,
      people: parseInt(numberOfPeople) || 0,
      price: finalPrice,
    });
    setShowConfirmation(true);

    // Clear persisted form state on successful booking
    clearBookingStorage();

    setCurrentStep(1);
  };

  const handleHoldExpired = () => {
    setHoldExpired(true);
  };

  // Soft recovery: go back to step 1 and reset the hold timer so user can re-verify
  const handleHoldVerify = () => {
    setCurrentStep(1);
    setHoldExpiresAt(null);
    setHoldExpired(false);
  };

  const sharedProps = {
    currentStep,
    totalSteps: TOTAL_STEPS,
    skipBoatStep,
    onNext: handleNextStep,
    onBack: handlePrevStep,
    onGoToStep: setCurrentStep,
    holdExpiresAt,
    holdExpired,
    onHoldExpired: handleHoldExpired,
    onHoldVerify: handleHoldVerify,
    firstName, setFirstName,
    lastName, setLastName,
    onFullNameChange,
    phonePrefix, setPhonePrefix,
    phoneNumber, setPhoneNumber,
    email, setEmail,
    showPrefixDropdown, setShowPrefixDropdown,
    prefixSearch, setPrefixSearch,
    prefixDropdownRef,
    filteredPrefixes,
    selectedPrefixInfo,
    licenseFilter, setLicenseFilter,
    licenseVerifier,
    selectedBoat, setSelectedBoat,
    selectedSecondaryBoat, setSelectedSecondaryBoat,
    selectedBoatIds,
    isMultiBoat,
    selectedSecondaryBoatInfo,
    selectedDate, setSelectedDate,
    selectedDuration, setSelectedDuration,
    preferredTime, setPreferredTime,
    onDateSelectFromUser,
    onTimeSelectFromUser,
    onDurationSelectFromUser,
    numberOfPeople, setNumberOfPeople,
    filteredBoats,
    isBoatsLoading,
    selectedBoatInfo,
    getDurationOptions,
    getMaxCapacity,
    getLocalISODate,
    preSelectedBoatId,
    timeSlots: TIME_SLOTS,
    unavailableTimeSlots,
    tooShortTimeSlots,
    slotMaxDuration,
    selectedTimeMaxDuration,
    isAvailabilityLoading,
    boatExtras,
    selectedExtras,
    selectedPack,
    showExtras, setShowExtras,
    extrasInPack,
    totalExtrasPrice,
    handlePackSelect,
    handleExtraToggle,
    showCodeSection, setShowCodeSection,
    codeInput, setCodeInput,
    isValidatingCode,
    validatedCode,
    codeError,
    handleValidateCode,
    handleRemoveCode,
    getCodeDiscount,
    getBookingPrice,
    handleBookingSearch,
    onClose,
    restoredFromStorage,
    onDismissRestoreBanner: dismissRestoreBanner,
    slotConflict,
    onPickAlternativeSlot: handlePickAlternativeSlot,
    onChangeDateFromConflict: handleChangeDateFromConflict,
    privacyConsent, setPrivacyConsent,
    showFieldError,
    getFieldError,
    handleBlur,
    t,
    iconMap: ICON_MAP,
    calculatePackSavings,
    isSpanishLang,
    language,
    nextSaturdayISO,
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    setConfirmationData(null);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Honeypot anti-bot field */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      {isMobile ? (
        <BookingWizardMobile {...sharedProps} />
      ) : (
        <BookingFormDesktop {...sharedProps} />
      )}
      {showConfirmation && confirmationData && (
        <BookingConfirmation
          boatName={confirmationData.boatName}
          date={confirmationData.date}
          time={confirmationData.time}
          duration={confirmationData.duration}
          people={confirmationData.people}
          price={confirmationData.price}
          onClose={handleCloseConfirmation}
        />
      )}
    </>
  );
}
