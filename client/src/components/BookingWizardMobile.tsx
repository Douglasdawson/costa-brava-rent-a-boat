import { useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, X } from "lucide-react";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import type { Boat } from "@shared/schema";

import type { Translations } from "@/lib/translations";
import BookingProgressBar from "@/components/BookingProgressBar";

import StepWhenWho from "@/components/booking/StepWhenWho";
import StepBoat from "@/components/booking/StepBoat";
import StepDeparture from "@/components/booking/StepDeparture";
import StepExtras from "@/components/booking/StepExtras";
import HoldCountdown from "@/components/HoldCountdown";
import PriceSummaryBar from "@/components/PriceSummaryBar";

import { useLanguage } from "@/hooks/use-language";
import StepCoverages from "@/components/booking/StepCoverages";
import StepConfirm from "@/components/booking/StepConfirm";

import { formatBookingDate as formatLocalisedDate } from "@/utils/intl-helpers";
import { translateBoatText } from "@shared/boatTextTranslations";

interface PhonePrefix {
  code: string;
  flag: string;
  country: string;
}

interface ValidatedCode {
  // "referral" = código de amigo del CRM: no descuenta, regala el Pack Premium.
  type: "gift_card" | "discount" | "referral";
  code: string;
  value?: number;
  percentage?: number;
}

interface ExtraItem {
  name: string;
  price: string;
  icon: string;
}

export interface BookingWizardMobileProps {
  // Navigation
  currentStep: number;
  totalSteps?: number;
  skipBoatStep?: boolean;
  onNext: () => void;
  onBack: () => void;
  onGoToStep: (step: number) => void;
  // Hold countdown
  holdExpiresAt: string | null;
  holdExpired: boolean;
  onHoldExpired: () => void;
  onHoldVerify: () => void;
  // Personal data (step 3)
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  // P0.6: single full-name input — splits on first whitespace into first/last name.
  onFullNameChange: (v: string) => void;
  phonePrefix: string;
  setPhonePrefix: (v: string) => void;
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  showPrefixDropdown: boolean;
  setShowPrefixDropdown: (v: boolean) => void;
  prefixSearch: string;
  setPrefixSearch: (v: string) => void;
  prefixDropdownRef: React.RefObject<HTMLDivElement>;
  filteredPrefixes: PhonePrefix[];
  selectedPrefixInfo: PhonePrefix | undefined;
  // Boat & schedule (steps 1+2)
  licenseFilter: "with" | "without";
  setLicenseFilter: (v: "with" | "without") => void;
  // Nautical license verifier (modal triggered when selecting "with licence")
  licenseVerifier: import("@/hooks/useLicenseVerifier").UseLicenseVerifierResult;
  selectedBoat: string;
  setSelectedBoat: (v: string) => void;
  selectedSecondaryBoat: string;
  setSelectedSecondaryBoat: (v: string) => void;
  selectedBoatIds: string[];
  isMultiBoat: boolean;
  selectedSecondaryBoatInfo: Boat | undefined;
  selectedDate: string;
  setSelectedDate: (v: string) => void;
  selectedDuration: string;
  setSelectedDuration: (v: string) => void;
  preferredTime: string;
  setPreferredTime: (v: string) => void;
  // Tracked setters — user-initiated changes only (auto-resets keep the plain setters).
  onDateSelectFromUser: (v: string) => void;
  onTimeSelectFromUser: (v: string) => void;
  onDurationSelectFromUser: (v: string) => void;
  numberOfPeople: string;
  setNumberOfPeople: (v: string) => void;
  filteredBoats: Boat[];
  isBoatsLoading: boolean;
  selectedBoatInfo: Boat | undefined;
  getDurationOptions: () => {
    value: string;
    label: string;
    price?: number;
    disabled?: boolean;
    disabledReason?: string;
  }[];
  getMaxCapacity: () => number;
  getLocalISODate: () => string;
  preSelectedBoatId?: string;
  timeSlots: string[];
  // Availability (real-time slot data)
  unavailableTimeSlots: Set<string>;
  tooShortTimeSlots: Set<string>;
  slotMaxDuration: Map<string, number>;
  selectedTimeMaxDuration: number | null;
  isAvailabilityLoading: boolean;
  // Extras (step 4)
  boatExtras: ExtraItem[];
  selectedExtras: string[];
  selectedPack: string | null;
  showExtras: boolean;
  setShowExtras: (v: boolean) => void;
  extrasInPack: Set<string>;
  totalExtrasPrice: number;
  /** Part of totalExtrasPrice that comes from the step 5 coverages. */
  coveragesPrice?: number;
  handlePackSelect: (packId: string) => void;
  handleExtraToggle: (extraName: string) => void;
  // Optional coverages (step 4), already resolved to the selected boat's tier
  // and translated, so mobile and desktop render identical copy and prices.
  coverages: Array<{
    key: string;
    name: string;
    desc: string;
    price: number;
    on: boolean;
    toggle: () => void;
  }>;
  weatherGuarantee: boolean;
  reducedDeposit: boolean;
  /** Deposit left once the reduced-deposit cover is contracted. */
  reducedDepositAmount: number;
  // Discount code (step 4)
  showCodeSection: boolean;
  setShowCodeSection: (v: boolean) => void;
  codeInput: string;
  setCodeInput: (v: string) => void;
  isValidatingCode: boolean;
  validatedCode: ValidatedCode | null;
  codeError: string;
  handleValidateCode: () => void;
  handleRemoveCode: () => void;
  getCodeDiscount: () => number;
  // Price & submit
  getBookingPrice: () => number | null;
  handleBookingSearch: () => Promise<void>;
  // Close the modal from inside the wizard (header X button).
  onClose?: () => void;
  // P1.10: sessionStorage restoration banner
  restoredFromStorage: boolean;
  onDismissRestoreBanner: (startOver: boolean) => void;
  // P1.9: slot conflict on step 4 (preferred time taken between selection
  // and submit). Banner offers nearby alternatives.
  slotConflict: {
    alternatives: { time: string; maxDuration: number }[];
    checkedAt: number;
  } | null;
  onPickAlternativeSlot: (time: string) => void;
  onChangeDateFromConflict: () => void;
  // RGPD consent
  privacyConsent: boolean;
  setPrivacyConsent: (v: boolean) => void;
  // Validation
  showFieldError: (field: string) => boolean;
  getFieldError: (field: string) => string;
  handleBlur: (field: string) => void;
  // i18n
  t: Translations;
  isSpanishLang: boolean;
  language: string;
  // Icon map
  iconMap: Record<string, React.ComponentType<{ className?: string }>>;
  calculatePackSavings: (packId: string) => number;
  // Smart defaults
  nextSaturdayISO: string;
}

export default function BookingWizardMobile(props: BookingWizardMobileProps) {
  const { currentStep, onNext, onBack, handleBookingSearch } = props;
  // Number of steps comes from the widget (single source of truth). Anything that
  // used to hardcode 5 ("last step") now reads this, so inserting a step never
  // leaves a stale literal behind.
  const totalSteps = props.totalSteps ?? 6;
  const isLastStep = currentStep === totalSteps;
  // Coverages step with nothing ticked: say out loud that skipping is fine.
  const onCoveragesStep = currentStep === totalSteps - 1;
  const noCoveragePicked = !props.coverages?.some(c => c.on);
  const nextLabel =
    onCoveragesStep && noCoveragePicked && props.t.booking.coverages.noneCta
      ? props.t.booking.coverages.noneCta
      : props.t.booking.next;
  const { language, localizedPath } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [displayStep, setDisplayStep] = useState(currentStep);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const prevStepRef = useRef(currentStep);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentStep !== prevStepRef.current) {
      setDirection(currentStep > prevStepRef.current ? "forward" : "back");
      setAnimating(true);
      // Scroll to top of the step content (instant — DESIGN.md bans layout animations)
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "instant" });
      const timer = setTimeout(() => {
        setDisplayStep(currentStep);
        setAnimating(false);
      }, 150);
      prevStepRef.current = currentStep;
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const animClass = animating
    ? direction === "forward"
      ? "opacity-0 translate-x-4"
      : "opacity-0 -translate-x-4"
    : "opacity-100 translate-x-0";

  return (
    <div
      className="flex flex-col h-full overflow-x-hidden"
      role="form"
      aria-label={props.t.a11y.bookingForm}
    >
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        {/* Row 1: close button only — separated from the progress bar so the
            5th step label can never be visually clipped by the X (WCAG 2.5.5
            requires a 44×44 target, which is too wide to share a row with
            5 step labels on a 390px viewport). */}
        {props.onClose && (
          <div className="flex justify-end px-2 pt-1.5">
            <button
              type="button"
              onClick={props.onClose}
              aria-label={props.t.booking.close ?? "Cerrar"}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-1"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}
        {/* Row 2: progress bar with extra horizontal breathing room so the
            connector lines stay short and the bar doesn't hug the edges. */}
        <div className={`px-6 pb-1.5 ${props.onClose ? "" : "pt-1.5"}`}>
          <BookingProgressBar
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepLabels={[
              props.t.bookingWizard?.steps?.whenWhoShort ||
                props.t.bookingWizard?.steps?.whenWho ||
                "Cuándo",
              props.t.bookingWizard?.steps?.yourBoat ||
                (props.selectedBoatInfo
                  ? props.t.endowment?.yourTrip || props.t.wizard.stepBoat
                  : props.t.wizard.stepBoat),
              props.t.bookingWizard?.steps?.departureDuration ||
                (props.selectedBoatInfo
                  ? props.t.endowment?.yourTrip || props.t.wizard.stepTrip
                  : props.t.wizard.stepTrip),
              props.t.bookingWizard?.steps?.upgradeYourDay || "Mejora tu día",
              props.t.bookingWizard?.steps?.coverages || "Garantías",
              props.t.bookingWizard?.steps?.yourDetails ||
                (props.selectedBoatInfo
                  ? props.t.endowment?.confirmStep || props.t.wizard.stepConfirm
                  : props.t.wizard.stepConfirm),
            ]}
          />
        </div>
      </div>
      {/* P1.10: sessionStorage restore banner — dismissable, optional reset */}
      {props.restoredFromStorage && (
        <div className="mx-3 mt-2 flex items-center gap-2 rounded-lg bg-cta/10 px-3 py-2 text-xs text-foreground">
          <span className="flex-1">
            {props.t.bookingWizard?.restoreBanner?.message ?? "Continuamos donde lo dejaste"}
          </span>
          <button
            type="button"
            onClick={() => props.onDismissRestoreBanner(true)}
            className="underline font-medium hover:text-primary"
          >
            {props.t.bookingWizard?.restoreBanner?.startOver ?? "Empezar nuevo"}
          </button>
          <button
            type="button"
            onClick={() => props.onDismissRestoreBanner(false)}
            aria-label={props.t.booking.close ?? "Cerrar"}
            className="ml-1 inline-flex w-6 h-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
      {/* Hold countdown timer — only visible on final step */}
      {props.holdExpiresAt && isLastStep && (
        <div className="px-4 pt-2">
          <HoldCountdown
            expiresAt={props.holdExpiresAt}
            onExpired={props.onHoldExpired}
            softExpiry
            onVerify={props.onHoldVerify}
          />
        </div>
      )}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
        <div
          className={`transition-all duration-150 ${animClass}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {displayStep === 1 && <Step1WhenWho {...props} />}
          {displayStep === 2 && <Step2Boat {...props} />}
          {displayStep === 3 && <Step3Departure {...props} />}
          {displayStep === 4 && <Step4Extras {...props} />}
          {displayStep === 5 && (
            <StepCoverages
              coverages={props.coverages}
              weatherPrice={props.coverages.find(c => c.key === "weather")?.price}
              t={props.t}
            />
          )}
          {displayStep === 6 && <StepConfirm {...props} />}
        </div>
      </div>
      {/* P1.1 (2026-05-20): price summary bar stays sticky through steps 2-5
          so the total is visible at the exact moment the user hits submit. */}
      {currentStep >= 2 &&
        currentStep <= totalSteps &&
        (() => {
          const price = props.getBookingPrice();
          if (!price || !props.selectedBoatInfo || !props.selectedDuration) return null;
          const discount = props.getCodeDiscount();
          return (
            <PriceSummaryBar
              boatName={translateBoatText(props.selectedBoatInfo.name, language)}
              duration={props.selectedDuration}
              basePrice={price}
              extrasPrice={props.totalExtrasPrice}
              coveragesPrice={props.coveragesPrice}
              coveragesLabel={props.t.booking.coverages.title}
              discount={discount}
              discountLabel={
                props.validatedCode?.percentage
                  ? `${props.validatedCode.code} (${props.validatedCode.percentage}%)`
                  : undefined
              }
              t={props.t}
              variant="mobile"
            />
          );
        })()}
      <div className="border-t border-border bg-background px-4 py-2.5">
        {isLastStep && (
          <p className="text-[11px] text-muted-foreground text-center mb-1.5 px-2 leading-tight">
            {props.t.bookingWizard?.hints?.submitReassurance ||
              "Te respondemos en menos de 2 horas. Sin pago online, sin compromiso."}
          </p>
        )}
        <div className="flex gap-3">
          {/* P0.8 (2026-05-19): on the final step the primary action (submit
              via WhatsApp) carries the row. Back becomes an icon-only ghost
              so the One Action Rule is honoured. Steps 1-4 keep the
              balanced Back + Next pair since the user is mid-navigation. */}
          {isLastStep
            ? null
            : currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  aria-label={`${props.t.booking.back}: ${props.t.a11y.goBackToStep} (${currentStep - 1} ${props.t.a11y.stepOf} ${totalSteps})`}
                  className="min-w-0 flex-1 px-3 text-sm font-semibold active:scale-95 transition-transform"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" />
                  {props.t.booking.back}
                </Button>
              )}
          {!isLastStep ? (
            <Button
              type="button"
              onClick={onNext}
              aria-label={`${nextLabel}: ${props.t.a11y.continueToStep} (${currentStep + 1} ${props.t.a11y.stepOf} ${totalSteps})`}
              className="min-w-0 flex-[1.6] truncate px-3 text-sm font-semibold active:scale-95 transition-transform"
            >
              {nextLabel}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                aria-label={`${props.t.booking.back}: ${props.t.a11y.goBackToStep} (${currentStep - 1} ${props.t.a11y.stepOf} ${totalSteps})`}
                className="flex-shrink-0 px-3 min-h-11 min-w-11 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  setIsSubmitting(true);
                  await handleBookingSearch();
                  setIsSubmitting(false);
                }}
                disabled={isSubmitting || props.isValidatingCode}
                className="flex-1 text-sm font-semibold bg-whatsapp hover:bg-whatsapp-hover text-foreground border-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || props.isValidatingCode ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                ) : (
                  <SiWhatsapp className="w-4 h-4 mr-2" aria-hidden="true" />
                )}
                {props.t.booking.sendBookingRequest}
              </Button>
              <span role="status" aria-live="polite" className="sr-only">
                {isSubmitting || props.isValidatingCode ? (props.t.a11y.sendingBooking ?? "") : ""}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Step2Boat(props: BookingWizardMobileProps) {
  return <StepBoat {...props} />;
}

/**
 * Step 1: Cuándo y cuántos sois → date picker + people spinner.
 * The earliest the user commits to a date, so subsequent steps can show veracious prices.
 */
function Step1WhenWho(props: BookingWizardMobileProps) {
  return (
    <StepWhenWho
      selectedDate={props.selectedDate}
      onDateSelectFromUser={props.onDateSelectFromUser}
      getLocalISODate={props.getLocalISODate}
      nextSaturdayISO={props.nextSaturdayISO}
      numberOfPeople={props.numberOfPeople}
      setNumberOfPeople={props.setNumberOfPeople}
      showFieldError={props.showFieldError}
      getFieldError={props.getFieldError}
      handleBlur={props.handleBlur}
      language={props.language}
      t={props.t}
    />
  );
}

function Step3Departure(props: BookingWizardMobileProps) {
  return (
    <StepDeparture
      {...props}
      durationOptions={props.getDurationOptions()}
      maxCapacity={props.getMaxCapacity()}
    />
  );
}

// P1.7 (2026-05-20): locale map moved to client/src/utils/intl-helpers.ts.
// formatBookingDate aliases the shared helper so the local callsites keep
// reading naturally.
const formatBookingDate = formatLocalisedDate;

// Pack savings label: whole euros as-is, fractions with one comma decimal
// ("2,5"). Mirrors the identical helper in BookingFormDesktop.tsx. Replaces
// the old toFixed(0) which rounded 2.5 up to 3 and overstated the saving.
function formatPackSavingsAmount(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(1).replace(".", ",");
}

function Step4Extras(props: BookingWizardMobileProps) {
  return <StepExtras {...props} />;
}
