import { useState, useEffect, useRef } from "react";

import { Loader2, X } from "lucide-react";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import { Button } from "@/components/ui/button";
// MotionConfig lives here (not in App.tsx) so framer-motion stays out of the
// critical bundle — this component is lazy-loaded via the booking modal.
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import type { BookingWizardMobileProps } from "./BookingWizardMobile";
import { EXTRA_PACKS } from "@shared/boatData";

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

import { translateBoatText } from "@shared/boatTextTranslations";

// Slide animation variants — transform + opacity only. P1.17 (2026-05-20)
// removed `filter: blur(...)` because it's compositor-dependent in Safari and
// can jank on lower-end devices for no perceptual gain at this distance.
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

// Pack savings label: whole euros as-is, fractions with one comma decimal
// ("2,5"). Mirrors the identical helper in BookingWizardMobile.tsx.
function formatPackSavingsAmount(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(1).replace(".", ",");
}

export default function BookingFormDesktop(props: BookingWizardMobileProps) {
  const {
    currentStep,
    onNext,
    onBack,
    onGoToStep,
    holdExpiresAt,
    holdExpired,
    onHoldExpired,
    onHoldVerify,
    licenseFilter,
    setLicenseFilter,
    selectedBoat,
    setSelectedBoat,
    selectedDate,
    setSelectedDate,
    selectedDuration,
    setSelectedDuration,
    preferredTime,
    setPreferredTime,
    onDateSelectFromUser,
    onTimeSelectFromUser,
    onDurationSelectFromUser,
    numberOfPeople,
    setNumberOfPeople,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    onFullNameChange,
    phonePrefix,
    setPhonePrefix,
    phoneNumber,
    setPhoneNumber,
    email,
    setEmail,
    showPrefixDropdown,
    setShowPrefixDropdown,
    prefixSearch,
    setPrefixSearch,
    prefixDropdownRef,
    filteredPrefixes,
    selectedPrefixInfo,
    filteredBoats,
    isBoatsLoading,
    selectedBoatInfo,
    getDurationOptions,
    getMaxCapacity,
    getLocalISODate,
    preSelectedBoatId,
    timeSlots,
    getBookingPrice,
    handleBookingSearch,
    showFieldError,
    getFieldError,
    handleBlur,
    t,
    boatExtras,
    selectedExtras,
    selectedPack,
    showExtras,
    setShowExtras,
    extrasInPack,
    totalExtrasPrice,
    handlePackSelect,
    handleExtraToggle,
    iconMap,
    calculatePackSavings,
    isSpanishLang,
    showCodeSection,
    setShowCodeSection,
    codeInput,
    setCodeInput,
    isValidatingCode,
    validatedCode,
    codeError,
    handleValidateCode,
    handleRemoveCode,
    getCodeDiscount,
    nextSaturdayISO,
    language,
    restoredFromStorage,
    onDismissRestoreBanner,
    slotConflict,
    onPickAlternativeSlot,
    onChangeDateFromConflict,
    isAvailabilityLoading,
  } = props;

  const { localizedPath } = useLanguage();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Direction tracking for slide animation
  const [direction, setDirection] = useState(0);
  const prevStepRef = useRef(currentStep);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (currentStep !== prevStepRef.current) {
      setDirection(currentStep > prevStepRef.current ? 1 : -1);
      // P1.16 (2026-05-20): DESIGN.md bans layout-animated scroll. The
      // motion.div slideVariants already gives a directional cue; the
      // container reset must be instant to keep the perception clean and
      // to honour prefers-reduced-motion (instant ignores the OS setting
      // anyway — the user's still inside the modal viewport).
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "instant" });
      prevStepRef.current = currentStep;
    }
  }, [currentStep]);

  const durationOptions = getDurationOptions();
  const maxCapacity = getMaxCapacity();
  const price = getBookingPrice();
  const discount = getCodeDiscount();
  const boatExtraNames = new Set(boatExtras.map(e => e.name));
  const availablePacks = EXTRA_PACKS.filter(pack =>
    pack.extras.every(name => boatExtraNames.has(name))
  );

  const inputBase =
    "w-full px-3 py-2.5 border-2 rounded-lg bg-background text-foreground text-base font-medium focus:ring-2 focus:ring-foreground/30 focus:border-foreground focus:outline-none h-[46px] transition-colors";
  const inputError = "border-destructive";
  const inputNormal = "border-cta/40";

  // Step count comes from the widget; everything that means "last step" reads
  // isLastStep so inserting a step never leaves a stale literal behind.
  const totalSteps = props.totalSteps ?? 6;
  const isLastStep = currentStep === totalSteps;
  const onCoveragesStep = currentStep === totalSteps - 1;
  const noCoveragePicked = !props.coverages?.some(c => c.on);
  const nextLabel =
    onCoveragesStep && noCoveragePicked && t.booking.coverages.noneCta
      ? t.booking.coverages.noneCta
      : t.booking.next;
  // Step labels for the wizard (date first)
  const boatSelected = !!selectedBoatInfo;
  const stepLabels = [
    t.bookingWizard?.steps?.whenWho || "Cuándo",
    t.bookingWizard?.steps?.yourBoat || t.wizard.stepBoat,
    t.bookingWizard?.steps?.departureDuration ||
      (boatSelected ? t.endowment?.yourTrip || t.wizard.stepTrip : t.wizard.stepTrip),
    t.bookingWizard?.steps?.upgradeYourDay || "Mejora tu día",
    t.bookingWizard?.steps?.coverages || "Garantías",
    t.bookingWizard?.steps?.yourDetails ||
      (boatSelected ? t.endowment?.confirmStep || t.wizard.stepYourData : t.wizard.stepYourData),
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Step progress bar */}
      <div className="flex-shrink-0 px-8 pt-3 pb-2 border-b border-cta/20 flex items-center gap-3">
        <div className="flex-1 min-w-0 px-4">
          <BookingProgressBar
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepLabels={stepLabels}
          />
        </div>
        {props.onClose && (
          <button
            type="button"
            onClick={props.onClose}
            aria-label={t.booking.close ?? "Cerrar"}
            className="flex-shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-1"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Hold countdown timer — only visible on final step */}
      {holdExpiresAt && isLastStep && (
        <div className="flex-shrink-0 px-6 pt-3">
          <HoldCountdown
            expiresAt={holdExpiresAt}
            onExpired={onHoldExpired}
            softExpiry
            onVerify={onHoldVerify}
          />
        </div>
      )}

      {/* P1.10: sessionStorage restore banner */}
      {restoredFromStorage && (
        <div className="flex-shrink-0 mx-6 mt-2 flex items-center gap-2 rounded-lg bg-cta/10 px-3 py-2 text-xs text-foreground">
          <span className="flex-1">
            {t.bookingWizard?.restoreBanner?.message ?? "Continuamos donde lo dejaste"}
          </span>
          <button
            type="button"
            onClick={() => onDismissRestoreBanner(true)}
            className="underline font-medium hover:text-primary"
          >
            {t.bookingWizard?.restoreBanner?.startOver ?? "Empezar nuevo"}
          </button>
          <button
            type="button"
            onClick={() => onDismissRestoreBanner(false)}
            aria-label={t.booking.close ?? "Cerrar"}
            className="ml-1 inline-flex w-6 h-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Step content — scrollable */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto">
        <MotionConfig reducedMotion="user">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="px-6 py-5"
            >
              {currentStep === 1 && (
                <StepWhenWho
                  selectedDate={selectedDate}
                  onDateSelectFromUser={onDateSelectFromUser}
                  getLocalISODate={getLocalISODate}
                  nextSaturdayISO={nextSaturdayISO}
                  numberOfPeople={numberOfPeople}
                  setNumberOfPeople={setNumberOfPeople}
                  showFieldError={showFieldError}
                  getFieldError={getFieldError}
                  handleBlur={handleBlur}
                  language={language}
                  t={t}
                />
              )}
              {currentStep === 2 && (
                <StepBoat
                  language={language}
                  licenseFilter={licenseFilter}
                  setLicenseFilter={setLicenseFilter}
                  licenseVerifier={props.licenseVerifier}
                  selectedBoat={selectedBoat}
                  setSelectedBoat={setSelectedBoat}
                  selectedSecondaryBoat={props.selectedSecondaryBoat}
                  setSelectedSecondaryBoat={props.setSelectedSecondaryBoat}
                  filteredBoats={filteredBoats}
                  isBoatsLoading={isBoatsLoading}
                  preSelectedBoatId={preSelectedBoatId}
                  selectedDate={selectedDate}
                  numberOfPeople={numberOfPeople}
                  showFieldError={showFieldError}
                  getFieldError={getFieldError}
                  t={t}
                />
              )}
              {currentStep === 3 && (
                <StepDeparture
                  selectedDate={selectedDate}
                  selectedDuration={selectedDuration}
                  onDurationSelectFromUser={onDurationSelectFromUser}
                  preferredTime={preferredTime}
                  onTimeSelectFromUser={onTimeSelectFromUser}
                  durationOptions={durationOptions}
                  maxCapacity={maxCapacity}
                  selectedBoatInfo={selectedBoatInfo}
                  timeSlots={timeSlots}
                  unavailableTimeSlots={props.unavailableTimeSlots}
                  tooShortTimeSlots={props.tooShortTimeSlots}
                  slotMaxDuration={props.slotMaxDuration}
                  selectedTimeMaxDuration={props.selectedTimeMaxDuration}
                  isAvailabilityLoading={isAvailabilityLoading}
                  preSelectedBoatId={preSelectedBoatId}
                  onGoToStep={onGoToStep}
                  language={language}
                  showFieldError={showFieldError}
                  getFieldError={getFieldError}
                  handleBlur={handleBlur}
                  t={t}
                />
              )}
              {currentStep === 4 && (
                <StepExtras
                  t={t}
                  language={props.language}
                  isSpanishLang={isSpanishLang}
                  selectedExtras={selectedExtras}
                  selectedPack={selectedPack}
                  extrasInPack={extrasInPack}
                  boatExtras={boatExtras}
                  handlePackSelect={handlePackSelect}
                  handleExtraToggle={handleExtraToggle}
                  iconMap={iconMap}
                  calculatePackSavings={calculatePackSavings}
                  totalExtrasPrice={totalExtrasPrice}
                />
              )}
              {currentStep === 5 && (
                <StepCoverages
                  coverages={props.coverages}
                  weatherPrice={props.coverages.find(c => c.key === "weather")?.price}
                  t={t}
                />
              )}
              {currentStep === 6 && <StepConfirm {...props} />}
            </motion.div>
          </AnimatePresence>
        </MotionConfig>
      </div>

      {/* P1.1 (2026-05-20): price bar visible from step 2 through step 5
          so the total stays on screen when the user hits submit. */}
      {currentStep >= 2 &&
        currentStep <= totalSteps &&
        price !== null &&
        selectedBoatInfo &&
        selectedDuration && (
          <div className="flex-shrink-0 px-6 pb-1">
            <PriceSummaryBar
              boatName={translateBoatText(selectedBoatInfo.name, language)}
              duration={selectedDuration}
              basePrice={price}
              extrasPrice={totalExtrasPrice}
              coveragesPrice={props.coveragesPrice}
              coveragesLabel={t.booking.coverages.title}
              discount={discount}
              discountLabel={
                validatedCode?.percentage
                  ? `${validatedCode.code} (${validatedCode.percentage}%)`
                  : undefined
              }
              t={t}
              variant="desktop"
            />
          </div>
        )}

      {/* Navigation footer */}
      <div className="flex-shrink-0 border-t border-cta/20 px-6 py-3">
        {isLastStep && (
          <p className="text-xs text-muted-foreground text-center mb-2">
            {t.bookingWizard?.hints?.submitReassurance ||
              "Te respondemos en menos de 2 horas. Sin pago online, sin compromiso."}
          </p>
        )}
        <div className={`flex items-center ${currentStep > 1 ? "justify-between" : "justify-end"}`}>
          {currentStep > 1 && (
            <button
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground transition-colors px-4 min-h-11 rounded-lg font-medium text-sm"
            >
              {t.booking.back}
            </button>
          )}
          {!isLastStep ? (
            <button
              onClick={onNext}
              className="bg-foreground text-white rounded-full px-8 min-h-11 font-medium text-sm hover:bg-foreground/90 transition-all btn-elevated"
            >
              {nextLabel}
            </button>
          ) : (
            <Button
              type="button"
              onClick={async () => {
                setIsSubmitting(true);
                await handleBookingSearch();
                setIsSubmitting(false);
              }}
              disabled={isSubmitting}
              className="bg-whatsapp hover:bg-whatsapp/90 text-foreground rounded-full px-8 min-h-11 font-medium text-sm border-0 disabled:opacity-50 disabled:cursor-not-allowed btn-elevated"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <SiWhatsapp className="w-4 h-4 mr-2" />
              )}
              {t.booking.sendBookingRequest}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STEP 1: Boat & Date
   ═══════════════════════════════════════════ */

/* ═══════════════════════════════════════════
   STEP 2: Duration, Time & People
   ═══════════════════════════════════════════ */

/* ═══════════════════════════════════════════
   STEP 4: Extras & Packs ("Mejora tu día")
   ═══════════════════════════════════════════ */
