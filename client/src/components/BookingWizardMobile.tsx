import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Check, ChevronDown, ChevronLeft, ChevronUp, Clock, Fuel, Gift, Loader2, Package, Star, Tag, Users, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import type { Boat } from "@shared/schema";
import { EXTRA_PACKS } from "@shared/boatData";
import { getBoatCatalogMinPrice, isBestValueSeasonForLongDuration } from "@shared/pricing";
import type { Translations } from "@/lib/translations";
import BookingProgressBar from "@/components/BookingProgressBar";
import { ValueStack } from "@/components/booking-flow/ValueStack";
import { BookingTrustBanner } from "@/components/booking-flow/BookingTrustBanner";
import HoldCountdown from "@/components/HoldCountdown";
import PriceSummaryBar from "@/components/PriceSummaryBar";
import SlotConflictBanner from "@/components/SlotConflictBanner";
import { trackWhatsAppClick } from "@/utils/analytics";
import { translateExtraName } from "@/utils/extraNameTranslations";
import { useLanguage } from "@/hooks/use-language";
import { useBoatPricingForDate } from "@/hooks/useBoatPricingForDate";
import { MultiBoatCombinations } from "@/components/booking-form/MultiBoatCombinations";
import LicenseVerifierPanelSkeleton from "@/components/booking/LicenseVerifierPanelSkeleton";
import LicenseStatusPill from "@/components/booking/LicenseStatusPill";

const LicenseVerifierPanel = lazy(() => import("@/components/booking/LicenseVerifierPanel"));
import { formatBookingDate as formatLocalisedDate, getLocaleForLanguage } from "@/utils/intl-helpers";

interface PhonePrefix {
  code: string;
  flag: string;
  country: string;
}

interface ValidatedCode {
  type: "gift_card" | "discount";
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
  firstName: string; setFirstName: (v: string) => void;
  lastName: string; setLastName: (v: string) => void;
  // P0.6: single full-name input — splits on first whitespace into first/last name.
  onFullNameChange: (v: string) => void;
  phonePrefix: string; setPhonePrefix: (v: string) => void;
  phoneNumber: string; setPhoneNumber: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  showPrefixDropdown: boolean; setShowPrefixDropdown: (v: boolean) => void;
  prefixSearch: string; setPrefixSearch: (v: string) => void;
  prefixDropdownRef: React.RefObject<HTMLDivElement>;
  filteredPrefixes: PhonePrefix[];
  selectedPrefixInfo: PhonePrefix | undefined;
  // Boat & schedule (steps 1+2)
  licenseFilter: "with" | "without";
  setLicenseFilter: (v: "with" | "without") => void;
  // Nautical license verifier (modal triggered when selecting "with licence")
  licenseVerifier: import("@/hooks/useLicenseVerifier").UseLicenseVerifierResult;
  selectedBoat: string; setSelectedBoat: (v: string) => void;
  selectedSecondaryBoat: string; setSelectedSecondaryBoat: (v: string) => void;
  selectedBoatIds: string[];
  isMultiBoat: boolean;
  selectedSecondaryBoatInfo: Boat | undefined;
  selectedDate: string; setSelectedDate: (v: string) => void;
  selectedDuration: string; setSelectedDuration: (v: string) => void;
  preferredTime: string; setPreferredTime: (v: string) => void;
  // Tracked setters — user-initiated changes only (auto-resets keep the plain setters).
  onDateSelectFromUser: (v: string) => void;
  onTimeSelectFromUser: (v: string) => void;
  onDurationSelectFromUser: (v: string) => void;
  numberOfPeople: string; setNumberOfPeople: (v: string) => void;
  filteredBoats: Boat[];
  isBoatsLoading: boolean;
  selectedBoatInfo: Boat | undefined;
  getDurationOptions: () => { value: string; label: string; price?: number; disabled?: boolean; disabledReason?: string }[];
  getMaxCapacity: () => number;
  getLocalISODate: () => string;
  preSelectedBoatId?: string;
  timeSlots: string[];
  // Availability (real-time slot data)
  unavailableTimeSlots: Set<string>;
  slotMaxDuration: Map<string, number>;
  selectedTimeMaxDuration: number | null;
  isAvailabilityLoading: boolean;
  // Extras (step 4)
  boatExtras: ExtraItem[];
  selectedExtras: string[];
  selectedPack: string | null;
  showExtras: boolean; setShowExtras: (v: boolean) => void;
  extrasInPack: Set<string>;
  totalExtrasPrice: number;
  handlePackSelect: (packId: string) => void;
  handleExtraToggle: (extraName: string) => void;
  // Discount code (step 4)
  showCodeSection: boolean; setShowCodeSection: (v: boolean) => void;
  codeInput: string; setCodeInput: (v: string) => void;
  isValidatingCode: boolean;
  validatedCode: ValidatedCode | null;
  codeError: string;
  handleValidateCode: () => void;
  handleRemoveCode: () => void;
  getCodeDiscount: () => number;
  // Price & submit
  getBookingPrice: () => number | null;
  autoDiscount: { type: 'early-bird' | 'flash-deal' | null; percentage: number; amount: number } | null;
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
  const { localizedPath } = useLanguage();
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
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
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
    <div className="flex flex-col h-full overflow-x-hidden" role="form" aria-label={props.t.a11y.bookingForm}>
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
        <div className={`px-6 pb-1.5 ${props.onClose ? '' : 'pt-1.5'}`}>
          <BookingProgressBar
            currentStep={currentStep}
            totalSteps={5}
            stepLabels={[
              props.t.bookingWizard?.steps?.whenWhoShort || props.t.bookingWizard?.steps?.whenWho || 'Cuándo',
              props.t.bookingWizard?.steps?.yourBoat || (props.selectedBoatInfo ? (props.t.endowment?.yourTrip || props.t.wizard.stepBoat) : props.t.wizard.stepBoat),
              props.t.bookingWizard?.steps?.departureDuration || (props.selectedBoatInfo ? (props.t.endowment?.yourTrip || props.t.wizard.stepTrip) : props.t.wizard.stepTrip),
              props.t.bookingWizard?.steps?.upgradeYourDay || 'Mejora tu día',
              props.t.bookingWizard?.steps?.yourDetails || (props.selectedBoatInfo ? (props.t.endowment?.confirmStep || props.t.wizard.stepConfirm) : props.t.wizard.stepConfirm),
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
      {props.holdExpiresAt && currentStep === 5 && (
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
        {/* Trust banner only on steps 1-2. Step 3 is the time/duration grid
            (banner adds visual noise) and step 4 is the submit moment
            (the inline reassurance "Te respondemos en menos de 2h" above
            the WhatsApp button already does that job, no need to repeat). */}
        {currentStep <= 2 && (
          <BookingTrustBanner t={props.t} stage="step1" />
        )}
        <div
          className={`transition-all duration-150 ${animClass}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {displayStep === 1 && <Step1WhenWho {...props} />}
          {displayStep === 2 && <Step2Boat {...props} />}
          {displayStep === 3 && <Step3Departure {...props} />}
          {displayStep === 4 && <Step4Extras {...props} />}
          {displayStep === 5 && <Step5Final {...props} />}
        </div>
      </div>
      {/* P1.1 (2026-05-20): price summary bar stays sticky through steps 2-5
          so the total is visible at the exact moment the user hits submit. */}
      {currentStep >= 2 && currentStep <= 5 && (() => {
        const price = props.getBookingPrice();
        if (!price || !props.selectedBoatInfo || !props.selectedDuration) return null;
        const discount = props.getCodeDiscount();
        return (
          <PriceSummaryBar
            boatName={props.selectedBoatInfo.name}
            duration={props.selectedDuration}
            basePrice={price}
            extrasPrice={props.totalExtrasPrice}
            discount={discount}
            discountLabel={props.validatedCode?.percentage ? `${props.validatedCode.code} (${props.validatedCode.percentage}%)` : undefined}
            autoDiscountAmount={props.autoDiscount?.type ? props.autoDiscount.amount : 0}
            autoDiscountLabel={props.autoDiscount?.type === 'early-bird' ? props.t.booking.earlyBirdDiscount : props.autoDiscount?.type === 'flash-deal' ? props.t.booking.flashDealDiscount : undefined}
            t={props.t}
            variant="mobile"
          />
        );
      })()}
      <div className="border-t border-border bg-background px-4 py-3">
        {currentStep === 5 && (
          <p className="text-[11px] text-muted-foreground text-center mb-1.5 px-2 leading-tight">
            {props.t.bookingWizard?.hints?.submitReassurance || 'Te respondemos en menos de 2 horas. Sin pago online, sin compromiso.'}
          </p>
        )}
        <div className="flex gap-3">
          {/* P0.8 (2026-05-19): on the final step the primary action (submit
              via WhatsApp) carries the row. Back becomes an icon-only ghost
              so the One Action Rule is honoured. Steps 1-4 keep the
              balanced Back + Next pair since the user is mid-navigation. */}
          {currentStep === 5 ? null : currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              aria-label={`${props.t.booking.back}: ${props.t.a11y.goBackToStep} (${currentStep - 1} ${props.t.a11y.stepOf} 5)`}
              className="flex-1 py-5 text-sm font-semibold active:scale-95 transition-transform"
            >
              <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" />
              {props.t.booking.back}
            </Button>
          )}
          {currentStep < 5 ? (
            <Button
              type="button"
              onClick={onNext}
              aria-label={`${props.t.booking.next}: ${props.t.a11y.continueToStep} (${currentStep + 1} ${props.t.a11y.stepOf} 5)`}
              className="flex-1 py-5 text-sm font-semibold active:scale-95 transition-transform"
            >
              {props.t.booking.next}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                aria-label={`${props.t.booking.back}: ${props.t.a11y.goBackToStep} (${currentStep - 1} ${props.t.a11y.stepOf} 5)`}
                className="flex-shrink-0 px-3 min-h-11 text-muted-foreground hover:text-foreground"
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
                className="flex-1 py-5 text-sm font-semibold bg-whatsapp hover:bg-whatsapp-hover text-foreground border-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || props.isValidatingCode
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  : <SiWhatsapp className="w-4 h-4 mr-2" aria-hidden="true" />
                }
                {props.t.booking.sendBookingRequest}
              </Button>
              <span role="status" aria-live="polite" className="sr-only">
                {(isSubmitting || props.isValidatingCode) ? (props.t.a11y.sendingBooking ?? "") : ""}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Step2Boat({
  licenseFilter, setLicenseFilter,
  licenseVerifier,
  selectedBoat, setSelectedBoat,
  selectedSecondaryBoat, setSelectedSecondaryBoat,
  filteredBoats,
  isBoatsLoading,
  preSelectedBoatId,
  selectedDate,
  numberOfPeople,
  showFieldError, getFieldError,
  t,
}: BookingWizardMobileProps) {
  function handleBoatSelect(boatId: string) {
    setSelectedBoat(boatId);
  }
  function handleComboSelect(primary: string, secondary: string) {
    setSelectedBoat(primary);
    setSelectedSecondaryBoat(secondary);
  }
  const peopleNum = parseInt(numberOfPeople || '1');
  const maxSingleCapacity = filteredBoats.reduce((max, b) => Math.max(max, b.capacity), 0);
  const needsMultiBoat = peopleNum > maxSingleCapacity && filteredBoats.length >= 2;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">
          {needsMultiBoat
            ? (t.bookingWizard?.multiBoat?.title || 'Vuestros barcos')
            : t.wizard.chooseYourBoat}
        </h2>
        <p className="text-sm text-muted-foreground">
          {needsMultiBoat
            ? (t.bookingWizard?.multiBoat?.subtitle || 'Para {n} personas necesitamos 2 barcos').replace('{n}', String(peopleNum))
            : t.wizard.haveNauticalLicense}
        </p>
      </div>
      {!preSelectedBoatId && (
        <fieldset className="border-0 p-0 m-0">
          <legend className="sr-only">{t.a11y.filterByLicense}</legend>
          <div role="radiogroup" aria-label={t.a11y.filterByLicense} className="flex gap-2">
            <button
              type="button"
              role="radio"
              aria-checked={licenseFilter === "without"}
              onClick={() => setLicenseFilter("without")}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                licenseFilter === "without"
                  ? "border-primary bg-primary text-white"
                  : "border-border text-muted-foreground"
              }`}
            >
              {t.wizard.withoutLicense}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={licenseFilter === "with"}
              onClick={() => setLicenseFilter("with")}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                licenseFilter === "with"
                  ? "border-primary bg-primary text-white"
                  : "border-border text-muted-foreground"
              }`}
            >
              {t.wizard.withLicense}
            </button>
          </div>
        </fieldset>
      )}
      {!preSelectedBoatId && licenseFilter === "with" && (
        <Suspense fallback={<LicenseVerifierPanelSkeleton />}>
          <LicenseVerifierPanel
            verifier={licenseVerifier}
            onSwitchToUnlicensed={() => {
              setLicenseFilter("without");
              setSelectedBoat("");
              licenseVerifier.dismiss();
            }}
          />
        </Suspense>
      )}
      {needsMultiBoat ? (
        <MultiBoatCombinations
          filteredBoats={filteredBoats}
          peopleNum={peopleNum}
          selectedDate={selectedDate}
          selectedBoat={selectedBoat}
          selectedSecondaryBoat={selectedSecondaryBoat}
          onSelect={handleComboSelect}
          t={t}
        />
      ) : (
      <div>
        <label className="block text-sm font-semibold text-muted-foreground mb-2">
          {t.wizard.selectABoat}
        </label>
        <div role="radiogroup" aria-label={t.wizard.selectABoat} className="grid grid-cols-2 gap-2">
          {isBoatsLoading && (
            // Skeleton loading while boats load from API
            <>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-3 rounded-xl border-2 border-border animate-pulse min-h-[88px] flex flex-col items-center justify-center gap-1.5">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-8 mt-1" />
                </div>
              ))}
            </>
          )}
          {filteredBoats.map((boat) => {
            const fitsCapacity = boat.capacity >= peopleNum;
            return (
              <BoatCardMobile
                key={boat.id}
                boat={boat}
                selected={selectedBoat === boat.id}
                fitsCapacity={fitsCapacity}
                selectedDate={selectedDate}
                onSelect={() => fitsCapacity && handleBoatSelect(boat.id)}
                t={t}
              />
            );
          })}
        </div>
        {showFieldError('boat') && (
          <p className="text-xs text-destructive mt-1">{getFieldError('boat')}</p>
        )}
      </div>
      )}
    </div>
  );
}

/**
 * Step 1: Cuándo y cuántos sois → date picker + people spinner.
 * The earliest the user commits to a date, so subsequent steps can show veracious prices.
 */
function Step1WhenWho({
  selectedDate,
  onDateSelectFromUser,
  numberOfPeople, setNumberOfPeople,
  getLocalISODate,
  showFieldError, getFieldError, handleBlur,
  t,
  nextSaturdayISO,
  language,
}: BookingWizardMobileProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const peopleCap = 12; // hard cap (max fleet capacity); narrowed to boat capacity in step 2

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">
          {t.bookingWizard?.steps?.whenWho || 'Cuándo y cuántos sois'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t.bookingWizard?.hints?.pricesNextStep || 'En el siguiente paso verás precios reales para tu fecha.'}
        </p>
        <p className="text-xs text-muted-foreground mt-1.5">
          {t.bookingWizard?.hints?.noOnlinePayment || 'Sin pago online — te confirmamos por WhatsApp'}
        </p>
      </div>
      <div id="field-date">
        <label className="block text-sm font-semibold text-muted-foreground mb-2">
          {t.wizard.date}
        </label>
        <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
          <PopoverTrigger asChild>
            <button
              type="button"
              onBlur={() => handleBlur('date')}
              className={`w-full flex items-center gap-2 p-3 border-2 rounded-xl bg-background text-left font-medium text-sm transition-all focus:ring-2 focus:ring-primary focus:outline-none ${
                showFieldError('date') ? 'border-destructive text-destructive' : 'border-border text-foreground'
              }`}
            >
              <CalendarIcon className="w-4 h-4 text-primary flex-shrink-0" />
              {selectedDate
                ? new Date(selectedDate + 'T00:00:00').toLocaleDateString(getLocaleForLanguage(language), { day: '2-digit', month: 'short', year: 'numeric' })
                : <span className="text-muted-foreground">{t.wizard.selectDate}</span>
              }
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate ? new Date(selectedDate + 'T00:00:00') : undefined}
              onSelect={(date) => {
                if (date) {
                  const y = date.getFullYear();
                  const m = String(date.getMonth() + 1).padStart(2, '0');
                  const d = String(date.getDate()).padStart(2, '0');
                  onDateSelectFromUser(`${y}-${m}-${d}`);
                }
                setShowDatePicker(false);
              }}
              disabled={(date) => date < new Date(getLocalISODate() + 'T00:00:00')}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {showFieldError('date') && (
          <p className="text-xs text-destructive mt-1">{getFieldError('date')}</p>
        )}
        {!selectedDate && nextSaturdayISO && (
          <p className="text-xs text-muted-foreground mt-1.5">
            {t.wizard.suggestedDate}: {new Date(nextSaturdayISO + 'T12:00:00').toLocaleDateString(getLocaleForLanguage(language), { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        )}
      </div>
      <div id="field-people">
        <label className="block text-sm font-semibold text-muted-foreground mb-2">
          {t.wizard.numberOfPeople}
        </label>
        <div className={`flex items-center justify-between border-2 rounded-xl bg-background px-4 py-2 ${
          showFieldError('people') ? 'border-destructive' : 'border-border'
        }`}>
          <button
            type="button"
            onClick={() => {
              const current = parseInt(numberOfPeople || '1');
              if (current > 1) { setNumberOfPeople(String(current - 1)); handleBlur('people'); }
            }}
            disabled={!numberOfPeople || parseInt(numberOfPeople) <= 1}
            className="w-11 h-11 rounded-full border-2 border-border flex items-center justify-center text-xl font-bold text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
            aria-label={t.a11y.decreasePeople}
          >
            −
          </button>
          <span className="text-2xl font-bold text-foreground min-w-[2rem] text-center">
            {numberOfPeople || '1'}
          </span>
          <button
            type="button"
            onClick={() => {
              const current = parseInt(numberOfPeople || '1');
              if (current < peopleCap) { setNumberOfPeople(String(current + 1)); handleBlur('people'); }
            }}
            disabled={!!numberOfPeople && parseInt(numberOfPeople) >= peopleCap}
            className="w-11 h-11 rounded-full border-2 border-border flex items-center justify-center text-xl font-bold text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
            aria-label={t.a11y.increasePeople}
          >
            +
          </button>
        </div>
        {showFieldError('people') && (
          <p className="text-xs text-destructive mt-1">{getFieldError('people')}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Boat card with real pricing for the selected date (hits /api/pricing/calendar via hook).
 * Capacity-disabled state for boats that can't fit the chosen group.
 */
function BoatCardMobile({
  boat,
  selected,
  fitsCapacity,
  selectedDate,
  onSelect,
  t,
}: {
  boat: Boat;
  selected: boolean;
  fitsCapacity: boolean;
  selectedDate: string;
  onSelect: () => void;
  t: Translations;
}) {
  // "desde X€" is the catalog floor — cheapest active price across every
  // season + duration combination the admin has configured. Independent
  // of selectedDate and any per-date override; that data only kicks in
  // once the user picks a duration on step 3.
  const displayPrice = getBoatCatalogMinPrice(boat.pricing);

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      disabled={!fitsCapacity}
      className={`relative flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 text-center transition-colors active:scale-[0.97] min-h-[96px] ${
        !fitsCapacity
          ? "border-border bg-muted opacity-50 cursor-not-allowed"
          : selected
          ? "border-primary bg-primary/5"
          : "border-border bg-background"
      }`}
    >
      {selected && (
        <span
          aria-hidden="true"
          className="absolute top-1.5 right-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary"
        >
          <Check className="w-2.5 h-2.5 text-white" />
        </span>
      )}
      <p className="font-semibold text-foreground text-sm leading-tight">{boat.name}</p>
      {displayPrice !== null && (
        <p className="text-xs text-primary font-medium">
          {t.boats.from} {displayPrice}€
        </p>
      )}
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
        <Users className="w-3.5 h-3.5" aria-hidden="true" />
        {boat.capacity}
      </span>
    </button>
  );
}

/**
 * Step 3: Salida y duración → preferred time + duration grid with override delta visible.
 * Date is set in step 1, so prices here are computed against the actual override.
 */
function Step3Departure({
  selectedBoat,
  selectedDate,
  selectedDuration,
  onDurationSelectFromUser,
  preferredTime,
  onTimeSelectFromUser,
  selectedBoatInfo,
  getDurationOptions, getMaxCapacity,
  timeSlots,
  unavailableTimeSlots,
  selectedTimeMaxDuration,
  isAvailabilityLoading,
  showFieldError, getFieldError, handleBlur,
  t,
}: BookingWizardMobileProps) {
  const durationOptions = getDurationOptions();
  const maxCapacity = getMaxCapacity();

  // Pricing override info for the selected boat+date (any duration share the same delta direction)
  const { hasOverride, overrideLabel } = useBoatPricingForDate({
    boatId: selectedBoat,
    date: selectedDate,
    duration: "4h",
    enabled: !!selectedBoat && !!selectedDate,
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">
          {t.bookingWizard?.steps?.departureDuration || 'Salida y duración'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {selectedBoatInfo
            ? (t.endowment?.yourTripIn || 'Tu viaje en {boat}').replace('{boat}', selectedBoatInfo.name)
            : t.wizard.howLongHowMany}
        </p>
      </div>
      <div id="field-time">
        <label htmlFor="wizard-time" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
          <span>{t.wizard.departureTime}</span>
          {isAvailabilityLoading && (
            <span className="inline-flex items-center gap-1 text-xs font-normal opacity-70">
              <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
              {t.bookingWizard?.slotConflict?.checking ?? "Comprobando disponibilidad…"}
            </span>
          )}
        </label>
        <select
          id="wizard-time"
          value={preferredTime}
          onChange={(e) => onTimeSelectFromUser(e.target.value)}
          onBlur={() => handleBlur('time')}
          aria-required="true"
          aria-busy={isAvailabilityLoading ? "true" : "false"}
          aria-invalid={showFieldError('time') ? "true" : "false"}
          aria-describedby={showFieldError('time') ? "error-wizard-time" : undefined}
          className={`w-full p-3 border-2 rounded-xl text-foreground font-medium text-base focus:ring-2 focus:ring-primary focus:outline-none bg-background ${
            showFieldError('time') ? 'border-destructive' : 'border-border'
          }`}
        >
          <option value="">{t.wizard.selectTime}</option>
          {timeSlots.map((time) => {
            const isUnavailable = unavailableTimeSlots.has(time);
            return (
              <option key={time} value={time} disabled={isUnavailable}>
                {time}{t.booking.timeSuffix ?? "h"}{isUnavailable ? (t.booking.timeSlotReservedSuffix ?? " · Reservado") : ""}
              </option>
            );
          })}
        </select>
        {showFieldError('time') && (
          <p id="error-wizard-time" className="text-xs text-destructive mt-1">{getFieldError('time')}</p>
        )}
      </div>
      <div id="field-duration">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-muted-foreground">{t.wizard.duration}</label>
          {hasOverride && overrideLabel && (
            <span className="text-xs font-medium text-popular bg-popular/10 px-2 py-0.5 rounded-full">
              {overrideLabel}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(() => {
            const enabledWithPrice = durationOptions.filter(o => !o.disabled && o.price);
            // Best-value badge only in true low season (Apr, May, Jun 1-15, Sep, Oct).
            // Outside that window we don't want to push 8h since shorter slots fill
            // on their own and turnover beats fewer/longer bookings.
            const dateObj = selectedDate ? new Date(selectedDate + 'T12:00:00') : null;
            const allowBestValue = isBestValueSeasonForLongDuration(dateObj);
            const bestValueId = allowBestValue && enabledWithPrice.length > 1
              ? enabledWithPrice.reduce((best, dur) => {
                  const bestPH = best.price! / parseFloat(best.value);
                  const durPH = dur.price! / parseFloat(dur.value);
                  return durPH < bestPH ? dur : best;
                }).value
              : null;
            return durationOptions.map((opt) => {
              const durationHours = parseInt(opt.value.replace("h", ""));
              const exceedsMax = selectedTimeMaxDuration !== null && durationHours > selectedTimeMaxDuration;
              const isSeasonRestricted = !!opt.disabled;
              const isDisabled = exceedsMax || isSeasonRestricted;
              const parts = opt.label.split(' - ');
              const lastPart = parts[parts.length - 1];
              const hasPrice = parts.length > 1 && lastPart.includes('€');
              const labelText = hasPrice ? parts.slice(0, -1).join(' · ') : opt.label;
              const priceText = hasPrice ? lastPart : null;
              // Split "4 horas · Media día" into headline + descriptor (same
              // approach as desktop, commit c5c9888) so the headline + price
              // stay on a single line in the narrower 2-col cards.
              const labelSegments = labelText.split(' · ');
              const durationLabel = labelSegments[0];
              const descriptor = labelSegments.length > 1 ? labelSegments.slice(1).join(' · ') : null;
              const isPopular = opt.value === "4h" && !isDisabled;
              const isBestValue = opt.value === bestValueId;
              const hasBadge = isPopular || isBestValue;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && onDurationSelectFromUser(opt.value)}
                  title={isSeasonRestricted ? opt.disabledReason : undefined}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 text-center transition-all min-h-[88px] ${
                    isDisabled
                      ? "border-border bg-muted opacity-50 cursor-not-allowed"
                      : selectedDuration === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background"
                  }`}
                >
                  {isBestValue && (
                    <span
                      aria-hidden="true"
                      className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-success bg-success/10 px-1.5 py-0.5 rounded-full whitespace-nowrap"
                    >
                      {t.neuro?.bestValue || 'Mejor valor'}
                    </span>
                  )}
                  {isPopular && !isBestValue && (
                    <span
                      aria-hidden="true"
                      className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {t.wizard.mostPopular}
                    </span>
                  )}
                  <div className={`flex items-baseline justify-center gap-2 ${hasBadge ? "mt-3" : ""}`}>
                    <span className={`text-sm font-semibold ${isDisabled ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {durationLabel}
                    </span>
                    {!isDisabled && priceText && (
                      <span className="text-sm font-bold text-primary">{priceText}</span>
                    )}
                  </div>
                  {descriptor && !isDisabled && (
                    <span className="text-xs text-muted-foreground -mt-0.5">{descriptor}</span>
                  )}
                  {isDisabled ? (
                    <span className="text-[11px] text-popular font-medium mt-1 block">
                      {opt.disabledReason || t.boats.notAvailable}
                    </span>
                  ) : opt.price ? (
                    <span className="text-[11px] text-muted-foreground mt-1 block">
                      {(opt.price / parseFloat(opt.value)).toFixed(0)}€{t.neuro?.perHour || '/hora'} · {Math.ceil(opt.price / parseFloat(opt.value) / maxCapacity)}€/{t.boats?.perPerson || 'pers.'}
                    </span>
                  ) : null}
                </button>
              );
            });
          })()}
        </div>
        {showFieldError('duration') && (
          <p className="text-xs text-destructive mt-1">{getFieldError('duration')}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Personal data form, rendered inside Step5Final. Kept as a separate section
 * to keep the final step's render readable.
 */
function PersonalDataSection({
  firstName,
  lastName,
  onFullNameChange,
  phonePrefix, setPhonePrefix,
  phoneNumber, setPhoneNumber,
  email, setEmail,
  showPrefixDropdown, setShowPrefixDropdown,
  prefixSearch, setPrefixSearch,
  prefixDropdownRef,
  filteredPrefixes,
  selectedPrefixInfo,
  showFieldError, getFieldError, handleBlur,
  t,
}: BookingWizardMobileProps) {
  const fullNameValue = firstName + (lastName ? ` ${lastName}` : "");
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-bold text-foreground">{t.wizard.yourData}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{t.wizard.confirmViaWhatsApp}</p>
      </div>
      <div>
        <label htmlFor="wizard-fullname" className="block text-sm font-semibold text-muted-foreground mb-0.5">
          {t.wizard.fullName}
        </label>
        <input
          type="text"
          id="wizard-fullname"
          value={fullNameValue}
          onChange={(e) => onFullNameChange(e.target.value)}
          onBlur={() => handleBlur('firstName')}
          placeholder=""
          autoComplete="name"
          maxLength={200}
          aria-required="true"
          aria-invalid={showFieldError('firstName') ? "true" : "false"}
          aria-describedby={showFieldError('firstName') ? "error-wizard-fullname" : undefined}
          className={`w-full px-3 py-2.5 border rounded-xl bg-background text-foreground font-medium text-base focus:ring-2 focus:ring-primary ${
            showFieldError('firstName') ? 'border-destructive' : 'border-border'
          }`}
        />
        {showFieldError('firstName') && (
          <p id="error-wizard-fullname" className="text-xs text-destructive mt-1">{getFieldError('firstName')}</p>
        )}
      </div>
      <div>
        <label htmlFor="wizard-phone" className="block text-sm font-semibold text-muted-foreground mb-0.5">
          {t.wizard.phone}
        </label>
        <div className="flex gap-2">
          <div className="relative w-24 flex-shrink-0" ref={prefixDropdownRef}>
            <button
              type="button"
              onClick={() => setShowPrefixDropdown(!showPrefixDropdown)}
              onKeyDown={(e) => { if (e.key === 'Escape') setShowPrefixDropdown(false); }}
              aria-haspopup="listbox"
              aria-expanded={showPrefixDropdown}
              aria-label={`${t.a11y.phonePrefix}: ${phonePrefix}`}
              className="w-full px-3 py-2.5 border border-border bg-background rounded-xl text-foreground font-medium text-base flex items-center gap-1 overflow-hidden"
            >
              <span className="truncate">{selectedPrefixInfo?.flag} {phonePrefix}</span>
            </button>
            {showPrefixDropdown && (
              <div className="absolute top-full left-0 mt-1 w-72 max-w-[calc(100vw-2rem)] bg-background border border-border rounded-xl shadow-sm z-50 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="p-2 border-b sticky top-0 bg-background">
                  <input
                    type="text"
                    value={prefixSearch}
                    onChange={(e) => setPrefixSearch(e.target.value)}
                    placeholder={t.wizard.searchCountry}
                    className="w-full p-2 border border-border rounded-lg text-base bg-background text-foreground"
                  />
                </div>
                {filteredPrefixes.map((prefix) => (
                  <button
                    key={`${prefix.code}-${prefix.country}`}
                    type="button"
                    onClick={() => {
                      setPhonePrefix(prefix.code);
                      setShowPrefixDropdown(false);
                      setPrefixSearch("");
                    }}
                    className="w-full p-2.5 hover:bg-muted text-left flex items-center gap-2 text-sm"
                  >
                    <span>{prefix.flag}</span>
                    <span className="font-medium">{prefix.code}</span>
                    <span className="text-muted-foreground text-xs truncate">{prefix.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="tel"
            id="wizard-phone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onBlur={() => handleBlur('phone')}
            placeholder="612345678"
            autoComplete="tel"
            maxLength={15}
            aria-required="true"
            aria-invalid={showFieldError('phone') ? "true" : "false"}
            aria-describedby={showFieldError('phone') ? "error-wizard-phone" : undefined}
            className={`flex-1 px-3 py-2.5 border rounded-xl bg-background text-foreground font-medium text-base focus:ring-2 focus:ring-primary ${
              showFieldError('phone') ? 'border-destructive' : 'border-border'
            }`}
          />
        </div>
        {showFieldError('phone') && (
          <p id="error-wizard-phone" className="text-xs text-destructive mt-1">{getFieldError('phone')}</p>
        )}
      </div>
      <div>
        <label htmlFor="wizard-email" className="flex items-baseline gap-2 text-sm font-semibold text-muted-foreground mb-0.5">
          <span>{t.wizard.email}</span>
          <span className="text-xs font-normal opacity-70">({t.booking.optional})</span>
        </label>
        <input
          type="email"
          id="wizard-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => handleBlur('email')}
          placeholder="email@example.com"
          autoComplete="email"
          maxLength={254}
          aria-required="false"
          aria-invalid={showFieldError('email') ? "true" : "false"}
          aria-describedby={showFieldError('email') ? "error-wizard-email" : "hint-wizard-email"}
          className={`w-full px-3 py-2.5 border rounded-xl bg-background text-foreground font-medium text-base focus:ring-2 focus:ring-primary ${
            showFieldError('email') ? 'border-destructive' : 'border-border'
          }`}
        />
        {showFieldError('email') ? (
          <p id="error-wizard-email" className="text-xs text-destructive mt-1">{getFieldError('email')}</p>
        ) : (
          <p id="hint-wizard-email" className="text-xs text-muted-foreground mt-1">{t.wizard.emailHelper}</p>
        )}
      </div>
    </div>
  );
}

// P1.7 (2026-05-20): locale map moved to client/src/utils/intl-helpers.ts.
// formatBookingDate aliases the shared helper so the local callsites keep
// reading naturally.
const formatBookingDate = formatLocalisedDate;

/**
 * Step 4 of 5 — Extras & Packs ("Mejora tu día"). Always-expanded panel
 * with the same packs + individual extras grids that used to live inside
 * Step5Final (collapsed by default). Moving them to their own step lets
 * the user see the upsell before reaching the final confirmation card.
 */
function Step4Extras(props: BookingWizardMobileProps) {
  const {
    boatExtras, selectedExtras, selectedPack,
    extrasInPack, totalExtrasPrice, handlePackSelect, handleExtraToggle,
    calculatePackSavings, iconMap,
    t, isSpanishLang, language,
  } = props;
  const boatExtraNames = new Set(boatExtras.map(e => e.name));
  const availablePacks = EXTRA_PACKS.filter(pack =>
    pack.extras.every(name => boatExtraNames.has(name))
  );

  return (
    <div className="space-y-5 pb-2">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">
          {t.bookingWizard?.steps?.upgradeYourDay || 'Mejora tu día'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t.booking.extrasSection.title}
        </p>
      </div>

      {/* Packs */}
      {availablePacks.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-2">{t.booking.extrasSection.packs}</p>
          <div className="grid grid-cols-2 gap-2">
            {availablePacks.map((pack) => {
              const isSelected = selectedPack === pack.id;
              const savings = calculatePackSavings(pack.id);
              const IconComp = iconMap[pack.icon] || Package;
              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => handlePackSelect(pack.id)}
                  aria-pressed={isSelected}
                  className={`relative flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 text-center transition-all min-h-[120px] ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}
                >
                  <IconComp className="w-5 h-5 text-primary" />
                  <span className="text-sm font-semibold leading-tight">{isSpanishLang ? pack.name : pack.nameEN}</span>
                  <span className="text-[11px] text-muted-foreground leading-tight">
                    {pack.extras.map(e => translateExtraName(e, language)).join(', ')}
                  </span>
                  <span className="text-sm font-bold text-primary mt-0.5">{pack.price}€</span>
                  {savings > 0 && (
                    <span className="text-[11px] font-semibold text-success">
                      −{savings.toFixed(0)}€ {t.booking.extrasSection.savings.toLowerCase()}
                    </span>
                  )}
                </button>
              );
            })}
            {/* "No pack" — last cell of the grid, peer-sized so it lives
                naturally inside the flow instead of headlining the section. */}
            <button
              type="button"
              onClick={() => handlePackSelect("")}
              aria-pressed={!selectedPack}
              className={`flex items-center justify-center p-3 rounded-xl border-2 text-center text-sm transition-all min-h-[120px] ${!selectedPack ? 'border-primary bg-primary/5 text-foreground font-medium' : 'border-border text-muted-foreground'}`}
            >
              {t.booking.extrasSection.noPack}
            </button>
          </div>
        </div>
      )}

      {/* Individual extras */}
      {boatExtras.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-2">{t.booking.extrasSection.individual}</p>
          <div className="grid grid-cols-2 gap-2">
            {boatExtras.map((extra) => {
              const isChecked = selectedExtras.includes(extra.name);
              const isInPack = extrasInPack.has(extra.name);
              return (
                <button
                  key={extra.name}
                  type="button"
                  onClick={() => handleExtraToggle(extra.name)}
                  disabled={isInPack}
                  aria-pressed={isChecked || isInPack}
                  className={`relative flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 text-center transition-all min-h-[80px] ${
                    isInPack ? 'border-primary/40 bg-primary/10 opacity-75 cursor-not-allowed'
                    : isChecked ? 'border-primary bg-primary/5'
                    : 'border-border bg-background'
                  }`}
                >
                  {(isChecked || isInPack) && (
                    <span aria-hidden="true" className="absolute top-1.5 right-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                  <p className="text-sm font-medium text-foreground leading-tight">{translateExtraName(extra.name, language)}</p>
                  <p className="text-[11px] text-muted-foreground">{isInPack ? t.booking.extrasSection.included : extra.price}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {totalExtrasPrice > 0 && (
        <p className="text-xs text-muted-foreground text-center italic">
          +{totalExtrasPrice}€ {t.booking.extrasSection.title.toLowerCase()}
        </p>
      )}
    </div>
  );
}

/**
 * Step 5 (final): personal data form + summary + RGPD.
 * Submit button lives in the wizard footer.
 */
function Step5Final(props: BookingWizardMobileProps) {
  const {
    selectedBoatInfo, selectedDate, selectedDuration, preferredTime, numberOfPeople,
    firstName, lastName, onGoToStep,
    boatExtras, selectedExtras, selectedPack, showExtras, setShowExtras,
    extrasInPack, totalExtrasPrice, handlePackSelect, handleExtraToggle,
    showCodeSection, setShowCodeSection, codeInput, setCodeInput,
    isValidatingCode, validatedCode, codeError, handleValidateCode, handleRemoveCode,
    getCodeDiscount, getBookingPrice, autoDiscount,
    calculatePackSavings, iconMap,
    t, isSpanishLang, language,
    slotConflict, onPickAlternativeSlot, onChangeDateFromConflict,
    isAvailabilityLoading,
  } = props;
  const { localizedPath } = useLanguage();
  const basePrice = getBookingPrice();
  const discount = getCodeDiscount();
  const autoDiscountAmount = autoDiscount?.type ? autoDiscount.amount : 0;
  const boatExtraNames = new Set(boatExtras.map(e => e.name));
  const availablePacks = EXTRA_PACKS.filter(pack =>
    pack.extras.every(name => boatExtraNames.has(name))
  );
  const total = basePrice !== null ? basePrice + totalExtrasPrice - discount - autoDiscountAmount : null;

  return (
    <div className="space-y-4 pb-2">
      {slotConflict && (
        <SlotConflictBanner
          preferredTime={preferredTime}
          alternatives={slotConflict.alternatives}
          isChecking={false}
          onPickAlternative={onPickAlternativeSlot}
          onChangeDate={onChangeDateFromConflict}
          t={t}
        />
      )}
      {!slotConflict && isAvailabilityLoading && preferredTime && (
        <SlotConflictBanner
          preferredTime={preferredTime}
          alternatives={[]}
          isChecking
          onPickAlternative={onPickAlternativeSlot}
          onChangeDate={onChangeDateFromConflict}
          t={t}
        />
      )}
      <PersonalDataSection {...props} />
      {props.licenseVerifier.state.status && (
        <LicenseStatusPill
          country={props.licenseVerifier.state.country}
          status={props.licenseVerifier.state.status}
          onChange={() => {
            props.licenseVerifier.resetStatus();
            props.licenseVerifier.undismiss();
            onGoToStep(2);
          }}
        />
      )}
      <div className="border-t border-border pt-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          {selectedBoatInfo
            ? (t.endowment?.customizeExperience || t.booking.confirmTitle)
            : t.booking.confirmTitle}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">{t.booking.confirmSubtitle}</p>
      </div>
      {/* Booking summary card */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-muted-foreground">
            {t.reviewSummary?.title || 'Resumen de tu reserva'}
          </p>
          <button
            type="button"
            onClick={() => onGoToStep(1)}
            className="text-xs font-medium text-primary/70 hover:text-primary transition-colors underline underline-offset-2"
          >
            {t.reviewSummary?.modify || 'Modificar'}
          </button>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t.booking.boat}</span>
          <span className="font-semibold text-foreground">
            {selectedBoatInfo?.name || "--"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t.booking.date}</span>
          <span className="font-semibold text-foreground">{formatBookingDate(selectedDate, language)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t.booking.preferredTime}</span>
          <span className="font-semibold text-foreground">{preferredTime}h</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t.booking.duration}</span>
          <span className="font-semibold text-foreground">{selectedDuration}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t.booking.people}</span>
          <span className="font-semibold text-foreground">{numberOfPeople}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t.booking.summaryClient}</span>
          <span className="font-semibold text-foreground">{firstName} {lastName}</span>
        </div>
        {basePrice !== null && (
          <div className="flex justify-between text-sm pt-2 border-t border-primary/20">
            <span className="text-muted-foreground">{t.booking.summaryBasePrice.replace(':', '').trim()}</span>
            <span className="font-bold text-primary text-base">{basePrice}€</span>
          </div>
        )}
        {/* P0.5 (2026-05-20): explicit fuel signal — license-free boats include
            fuel; licensed boats don't. Communicating this here prevents the
            post-booking surprise that drives 1-star reviews. */}
        {selectedBoatInfo && (
          <div className="flex items-center gap-1.5 text-xs">
            {selectedBoatInfo.requiresLicense ? (
              <>
                <Fuel className="w-3 h-3 text-popular flex-shrink-0" aria-hidden="true" />
                <span className="text-popular font-medium">
                  {t.bookingWizard?.fuel?.notIncluded || 'Combustible no incluido'}
                </span>
              </>
            ) : (
              <>
                <Fuel className="w-3 h-3 text-success flex-shrink-0" aria-hidden="true" />
                <span className="text-success font-medium">
                  {t.bookingWizard?.fuel?.included || 'Combustible incluido'}
                </span>
              </>
            )}
          </div>
        )}
        {autoDiscount?.type && autoDiscountAmount > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              autoDiscount.type === 'early-bird'
                ? 'bg-success/10 text-success'
                : 'bg-popular/10 text-popular'
            }`}>
              {autoDiscount.type === 'early-bird' ? t.booking.earlyBirdDiscount : t.booking.flashDealDiscount}
            </span>
            <span className="font-semibold text-success">-{autoDiscountAmount}€</span>
          </div>
        )}
      </div>
      {/* Discount / gift card code section */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowCodeSection(!showCodeSection)}
          aria-expanded={showCodeSection}
          aria-controls="code-panel"
          className="w-full flex items-center justify-between p-4 text-sm font-semibold text-muted-foreground bg-muted"
        >
          <span className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            {t.codeValidation.haveCode}
            {validatedCode && (
              <span className="bg-success/100 text-white text-xs px-2 py-0.5 rounded-full">{t.codeValidation.applied}</span>
            )}
          </span>
          {showCodeSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showCodeSection && (
          <div id="code-panel" className="p-4 bg-background">
            {!validatedCode ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder={t.codeValidation.enterCode}
                    className="flex-1 p-3 bg-background text-foreground border-2 border-border rounded-xl text-base font-mono uppercase tracking-wider"
                    disabled={isValidatingCode}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleValidateCode}
                    disabled={isValidatingCode || !codeInput.trim()}
                    className="px-4 py-3 h-auto"
                  >
                    {isValidatingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : t.codeValidation.apply}
                  </Button>
                </div>
                {codeError && <p className="text-xs text-destructive">{codeError}</p>}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-success/10 border border-success/20 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  {validatedCode.type === "gift_card" ? <Gift className="w-4 h-4 text-success" /> : <Tag className="w-4 h-4 text-success" />}
                  <div>
                    <p className="text-xs font-semibold text-success">
                      {validatedCode.type === "gift_card"
                        ? t.codeValidation.validGiftCard
                        : t.codeValidation.validDiscount}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{validatedCode.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-success">
                    {validatedCode.type === "gift_card" ? `-${discount}€` : `-${validatedCode.percentage}%`}
                  </span>
                  <button type="button" onClick={handleRemoveCode} className="text-muted-foreground p-2 -m-1 min-w-[44px] min-h-[44px] flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Total price card */}
      {total !== null && (() => {
        const depositStr = selectedBoatInfo?.specifications?.deposit;
        const depositAmount = depositStr ? parseInt(depositStr.replace(/[^0-9]/g, '')) : null;
        return (
          <div className="bg-primary rounded-xl p-4 text-white">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium opacity-90">{t.endowment?.yourPrice || t.booking.estimatedTotal}</span>
              <span className="text-2xl font-bold">{total}€</span>
            </div>
            {autoDiscountAmount > 0 && autoDiscount?.type && (
              <p className="text-sm opacity-75 mt-1">
                {autoDiscount.type === 'early-bird' ? t.booking.earlyBirdDiscount : t.booking.flashDealDiscount}: -{autoDiscountAmount}€
              </p>
            )}
            {discount > 0 && (
              <p className="text-sm opacity-75 mt-1">{t.booking.discountApplied}: -{discount}€</p>
            )}
            {depositAmount && (
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/20">
                <span className="text-sm opacity-70">
                  {t.pricing?.depositLabel || 'Fianza'} ({t.pricing?.depositRefundable || 'reembolsable'})
                </span>
                <span className="text-sm font-semibold opacity-80">{depositAmount}€</span>
              </div>
            )}
            <p className="text-sm opacity-80 mt-2">{t.booking.priceConfirmedWhatsApp}</p>
          </div>
        );
      })()}
      {/* Value stacking — what's included */}
      <ValueStack
        requiresLicense={!!selectedBoatInfo?.requiresLicense}
        isExcursion={selectedBoatInfo?.id === "excursion-privada"}
        t={t}
      />
      {/* RGPD passive consent notice */}
      <p className="text-xs text-muted-foreground leading-relaxed text-center">
        {t.booking.gdprPassive?.split('{privacyPolicy}')[0] || 'Al enviar esta solicitud, aceptas nuestra '}
        <a href={localizedPath("privacyPolicy")} target="_blank" rel="noopener noreferrer" className="text-primary underline">
          {t.booking.gdprPrivacyLink}
        </a>
        {(t.booking.gdprPassive?.split('{privacyPolicy}')[1] || ' y ').split('{termsAndConditions}')[0]}
        <a href={localizedPath("condicionesGenerales")} target="_blank" rel="noopener noreferrer" className="text-primary underline">
          {t.booking.gdprTermsLink}
        </a>
        {(t.booking.gdprPassive?.split('{privacyPolicy}')[1] || '').split('{termsAndConditions}')[1] || '.'}
      </p>
    </div>
  );
}
