import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { CalendarIcon, Check, ClipboardList, Clock, Fuel, Loader2, Pencil, Ship, Sparkles, Star, Users, X } from "lucide-react";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
// MotionConfig lives here (not in App.tsx) so framer-motion stays out of the
// critical bundle — this component is lazy-loaded via the booking modal.
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import type { Boat } from "@shared/schema";
import type { BookingWizardMobileProps } from "./BookingWizardMobile";
import { EXTRA_PACKS } from "@shared/boatData";
import { getBoatCatalogMinPrice, isBestValueSeasonForLongDuration } from "@shared/pricing";
import { useFleetAvailabilityForDate, type DayStatus } from "@/hooks/useFleetAvailabilityForDate";
import { PARTIAL_TONE, BOOKED_TONE } from "@/components/AvailabilityCalendar";
import { cn } from "@/lib/utils";
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
import { MultiBoatCombinations } from "@/components/booking-form/MultiBoatCombinations";
import LicenseVerifierPanelSkeleton from "@/components/booking/LicenseVerifierPanelSkeleton";
import LicenseStatusPill from "@/components/booking/LicenseStatusPill";
import CountryFlag from "@/components/booking/CountryFlag";
import { flagEmojiToIso2 } from "@/utils/phone-prefixes";

const LicenseVerifierPanel = lazy(() => import("@/components/booking/LicenseVerifierPanel"));
import { formatBookingDate as formatBookingDateDesktop, getLocaleForLanguage } from "@/utils/intl-helpers";

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

  // Step labels for the 5-step wizard (date first)
  const boatSelected = !!selectedBoatInfo;
  const stepLabels = [
    t.bookingWizard?.steps?.whenWho || 'Cuándo',
    t.bookingWizard?.steps?.yourBoat || t.wizard.stepBoat,
    t.bookingWizard?.steps?.departureDuration || (boatSelected ? (t.endowment?.yourTrip || t.wizard.stepTrip) : t.wizard.stepTrip),
    t.bookingWizard?.steps?.upgradeYourDay || 'Mejora tu día',
    t.bookingWizard?.steps?.yourDetails || (boatSelected ? (t.endowment?.confirmStep || t.wizard.stepYourData) : t.wizard.stepYourData),
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Step progress bar */}
      <div className="flex-shrink-0 px-8 pt-3 pb-2 border-b border-cta/20 flex items-center gap-3">
        <div className="flex-1 min-w-0 px-4">
          <BookingProgressBar currentStep={currentStep} totalSteps={5} stepLabels={stepLabels} />
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
      {holdExpiresAt && currentStep === 5 && (
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
            {/* Trust banner only on steps 1-2. Step 3 (time/duration grid)
                and step 4 (submit) don't need the pills — step 4 has its
                own inline "Te respondemos en <2h" reassurance above the
                WhatsApp button. */}
            {currentStep <= 2 && (
              <BookingTrustBanner t={t} stage="step1" />
            )}
            {currentStep === 1 && (
              <Step1WhenWhoDesktop
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                onDateSelectFromUser={onDateSelectFromUser}
                getLocalISODate={getLocalISODate}
                showDatePicker={showDatePicker}
                setShowDatePicker={setShowDatePicker}
                nextSaturdayISO={nextSaturdayISO}
                language={language}
                numberOfPeople={numberOfPeople}
                setNumberOfPeople={setNumberOfPeople}
                showFieldError={showFieldError}
                getFieldError={getFieldError}
                handleBlur={handleBlur}
                t={t}
                inputBase={inputBase}
                inputError={inputError}
                inputNormal={inputNormal}
              />
            )}
            {currentStep === 2 && (
              <Step1BoatDate
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
              <Step2Details
                selectedBoat={selectedBoat}
                selectedDate={selectedDate}
                selectedDuration={selectedDuration}
                setSelectedDuration={setSelectedDuration}
                onDurationSelectFromUser={onDurationSelectFromUser}
                preferredTime={preferredTime}
                setPreferredTime={setPreferredTime}
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
                inputBase={inputBase}
                inputError={inputError}
                inputNormal={inputNormal}
              />
            )}
            {currentStep === 4 && (
              <Step4ExtrasDesktop
                t={t}
                language={props.language}
                isSpanishLang={isSpanishLang}
                selectedExtras={selectedExtras}
                selectedPack={selectedPack}
                extrasInPack={extrasInPack}
                boatExtras={boatExtras}
                handlePackSelect={handlePackSelect}
                handleExtraToggle={handleExtraToggle}
                availablePacks={availablePacks}
                iconMap={iconMap}
                calculatePackSavings={calculatePackSavings}
                totalExtrasPrice={totalExtrasPrice}
              />
            )}
            {currentStep === 5 && (
              <Step5FinalDesktop
                slotConflict={slotConflict}
                onPickAlternativeSlot={onPickAlternativeSlot}
                onChangeDateFromConflict={onChangeDateFromConflict}
                isAvailabilityLoading={isAvailabilityLoading}
                firstName={firstName}
                setFirstName={setFirstName}
                lastName={lastName}
                setLastName={setLastName}
                onFullNameChange={onFullNameChange}
                phonePrefix={phonePrefix}
                setPhonePrefix={setPhonePrefix}
                phoneNumber={phoneNumber}
                setPhoneNumber={setPhoneNumber}
                email={email}
                setEmail={setEmail}
                showPrefixDropdown={showPrefixDropdown}
                setShowPrefixDropdown={setShowPrefixDropdown}
                prefixSearch={prefixSearch}
                setPrefixSearch={setPrefixSearch}
                prefixDropdownRef={prefixDropdownRef}
                filteredPrefixes={filteredPrefixes}
                selectedPrefixInfo={selectedPrefixInfo}
                showCodeSection={showCodeSection}
                setShowCodeSection={setShowCodeSection}
                codeInput={codeInput}
                setCodeInput={setCodeInput}
                isValidatingCode={isValidatingCode}
                validatedCode={validatedCode}
                codeError={codeError}
                handleValidateCode={handleValidateCode}
                handleRemoveCode={handleRemoveCode}
                price={price}
                totalExtrasPrice={totalExtrasPrice}
                discount={discount}
                selectedBoatInfo={selectedBoatInfo}
                selectedDate={selectedDate}
                selectedDuration={selectedDuration}
                preferredTime={preferredTime}
                numberOfPeople={numberOfPeople}
                selectedExtras={selectedExtras}
                selectedPack={selectedPack}
                extrasInPack={extrasInPack}
                language={props.language}
                onGoToStep={onGoToStep}
                showFieldError={showFieldError}
                getFieldError={getFieldError}
                handleBlur={handleBlur}
                t={t}
                inputBase={inputBase}
                inputError={inputError}
                inputNormal={inputNormal}
                licenseVerifier={props.licenseVerifier}
              />
            )}
          </motion.div>
        </AnimatePresence>
        </MotionConfig>
      </div>

      {/* P1.1 (2026-05-20): price bar visible from step 2 through step 5
          so the total stays on screen when the user hits submit. */}
      {currentStep >= 2 &&
        currentStep <= 5 &&
        price !== null &&
        selectedBoatInfo &&
        selectedDuration && (
          <div className="flex-shrink-0 px-6 pb-1">
            <PriceSummaryBar
              boatName={selectedBoatInfo.name}
              duration={selectedDuration}
              basePrice={price}
              extrasPrice={totalExtrasPrice}
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
        {currentStep === 5 && (
          <p className="text-xs text-muted-foreground text-center mb-2">
            {t.bookingWizard?.hints?.submitReassurance || 'Te respondemos en menos de 2 horas. Sin pago online, sin compromiso.'}
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
          {currentStep < 5 ? (
            <button
              onClick={onNext}
              className="bg-foreground text-white rounded-full px-8 min-h-11 font-medium text-sm hover:bg-foreground/90 transition-all btn-elevated"
            >
              {t.booking.next}
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
              className="bg-whatsapp hover:bg-whatsapp-hover text-foreground rounded-full px-8 min-h-11 font-medium text-sm border-0 disabled:opacity-50 disabled:cursor-not-allowed btn-elevated"
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

interface Step1Props {
  licenseFilter: "with" | "without";
  setLicenseFilter: (v: "with" | "without") => void;
  licenseVerifier: BookingWizardMobileProps["licenseVerifier"];
  selectedBoat: string;
  setSelectedBoat: (v: string) => void;
  selectedSecondaryBoat: string;
  setSelectedSecondaryBoat: (v: string) => void;
  filteredBoats: BookingWizardMobileProps["filteredBoats"];
  isBoatsLoading: boolean;
  preSelectedBoatId?: string;
  selectedDate: string;
  numberOfPeople: string;
  showFieldError: (f: string) => boolean;
  getFieldError: (f: string) => string;
  t: BookingWizardMobileProps["t"];
}

function Step1BoatDate({
  licenseFilter,
  setLicenseFilter,
  licenseVerifier,
  selectedBoat,
  setSelectedBoat,
  selectedSecondaryBoat,
  setSelectedSecondaryBoat,
  filteredBoats,
  isBoatsLoading,
  preSelectedBoatId,
  selectedDate,
  numberOfPeople,
  showFieldError,
  getFieldError,
  t,
}: Step1Props) {
  const peopleNum = parseInt(numberOfPeople || '1');
  const maxSingleCapacity = filteredBoats.reduce((max, b) => Math.max(max, b.capacity), 0);
  const needsMultiBoat = peopleNum > maxSingleCapacity && filteredBoats.length >= 2;
  // One request for the whole boat list — so a customer sees which boats are
  // already busy for their chosen date BEFORE picking one, instead of only
  // finding out two steps later that the hour picker is all "Reservado".
  const { boats: fleetAvailability } = useFleetAvailabilityForDate(selectedDate || undefined);
  const handleComboSelect = (primary: string, secondary: string) => {
    setSelectedBoat(primary);
    setSelectedSecondaryBoat(secondary);
  };
  return (
    <div className="space-y-5">
      {/* License filter */}
      {!preSelectedBoatId && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            {t.wizard.haveNauticalLicense}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLicenseFilter("without")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                licenseFilter === "without"
                  ? "border-foreground bg-foreground text-white"
                  : "border-cta/40 text-muted-foreground hover:border-cta"
              }`}
            >
              {t.wizard.withoutLicense}
            </button>
            <button
              type="button"
              onClick={() => setLicenseFilter("with")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                licenseFilter === "with"
                  ? "border-foreground bg-foreground text-white"
                  : "border-cta/40 text-muted-foreground hover:border-cta"
              }`}
            >
              {t.wizard.withLicense}
            </button>
          </div>
        </div>
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

      {/* Boat selection / multi-boat combinations */}
      {needsMultiBoat ? (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            {(t.bookingWizard?.multiBoat?.subtitle || 'Para {n} personas necesitamos 2 barcos').replace('{n}', String(peopleNum))}
          </p>
          <MultiBoatCombinations
            filteredBoats={filteredBoats}
            peopleNum={peopleNum}
            selectedDate={selectedDate}
            selectedBoat={selectedBoat}
            selectedSecondaryBoat={selectedSecondaryBoat}
            onSelect={handleComboSelect}
            t={t}
          />
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground">
              {t.wizard.selectABoat}
            </p>
            {showFieldError("boat") && (
              <p className="text-xs text-destructive">{getFieldError("boat")}</p>
            )}
          </div>
          {isBoatsLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="animate-pulse flex items-center gap-2 p-3 rounded-lg border-2 border-cta/20"
                >
                  <div className="w-4 h-4 rounded-full bg-cta/30 flex-shrink-0" />
                  <div className="flex-1 h-3 bg-cta/30 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div role="radiogroup" aria-label={t.wizard.selectABoat} className="grid grid-cols-2 gap-2">
              {filteredBoats.map(boat => (
                <BoatCardDesktop
                  key={boat.id}
                  boat={boat}
                  selected={selectedBoat === boat.id}
                  fitsCapacity={boat.capacity >= peopleNum}
                  selectedDate={selectedDate}
                  dayStatus={fleetAvailability?.[boat.id]?.status}
                  onSelect={() => setSelectedBoat(boat.id)}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Desktop boat card with real pricing for the selected date.
 */
function BoatCardDesktop({
  boat,
  selected,
  fitsCapacity,
  selectedDate,
  dayStatus,
  onSelect,
  t,
}: {
  boat: Boat;
  selected: boolean;
  fitsCapacity: boolean;
  selectedDate: string;
  dayStatus?: DayStatus;
  onSelect: () => void;
  t: Translations;
}) {
  // "desde X€" is the catalog floor — cheapest active price across every
  // season + duration combo the admin has configured for this boat. Not
  // tied to selectedDate or any per-date override.
  const displayPrice = getBoatCatalogMinPrice(boat.pricing);

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={fitsCapacity ? onSelect : undefined}
      disabled={!fitsCapacity}
      className={`w-full flex items-center gap-2.5 p-3 rounded-lg border-2 text-left transition-colors ${
        !fitsCapacity
          ? "border-cta/20 bg-muted opacity-50 cursor-not-allowed"
          : selected
          ? "border-foreground bg-foreground/5"
          : "border-cta/40 bg-background hover:border-cta"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          selected ? "border-foreground bg-foreground" : "border-muted-foreground/30"
        }`}
      >
        {selected && <Check className="w-2.5 h-2.5 text-background" aria-hidden="true" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm truncate">{boat.name}</p>
        {displayPrice !== null && (
          <p className="text-xs text-foreground font-medium">
            {t.boats.from} {displayPrice}€
          </p>
        )}
        {dayStatus && dayStatus !== "available" && (
          <span
            className={cn(
              "inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium border",
              dayStatus === "partial" ? PARTIAL_TONE : BOOKED_TONE
            )}
          >
            {dayStatus === "partial"
              ? t.bookingWizard?.boatStatus?.partial ?? "Pocas horas libres"
              : t.bookingWizard?.boatStatus?.booked ?? "Completo ese día"}
          </span>
        )}
      </div>
      <span className="flex-shrink-0 inline-flex items-center gap-1 text-sm text-foreground">
        <Users className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        {boat.capacity}
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════
   STEP 2: Duration, Time & People
   ═══════════════════════════════════════════ */

interface Step2Props {
  selectedBoat: string;
  selectedDate: string;
  selectedDuration: string;
  setSelectedDuration: (v: string) => void;
  onDurationSelectFromUser: (v: string) => void;
  preferredTime: string;
  setPreferredTime: (v: string) => void;
  onTimeSelectFromUser: (v: string) => void;
  durationOptions: {
    value: string;
    label: string;
    price?: number;
    disabled?: boolean;
    disabledReason?: string;
  }[];
  maxCapacity: number;
  selectedBoatInfo: BookingWizardMobileProps["selectedBoatInfo"];
  timeSlots: string[];
  unavailableTimeSlots: Set<string>;
  tooShortTimeSlots: Set<string>;
  slotMaxDuration: Map<string, number>;
  selectedTimeMaxDuration: number | null;
  isAvailabilityLoading: boolean;
  preSelectedBoatId?: string;
  onGoToStep: (step: number) => void;
  language: string;
  showFieldError: (f: string) => boolean;
  getFieldError: (f: string) => string;
  handleBlur: (f: string) => void;
  t: BookingWizardMobileProps["t"];
  inputBase: string;
  inputError: string;
  inputNormal: string;
}

function Step2Details({
  selectedBoat,
  selectedDate,
  selectedDuration,
  onDurationSelectFromUser,
  preferredTime,
  onTimeSelectFromUser,
  durationOptions,
  maxCapacity,
  selectedBoatInfo,
  timeSlots,
  unavailableTimeSlots,
  tooShortTimeSlots,
  slotMaxDuration,
  selectedTimeMaxDuration,
  isAvailabilityLoading,
  preSelectedBoatId,
  onGoToStep,
  language,
  showFieldError,
  getFieldError,
  handleBlur,
  t,
  inputBase,
  inputError,
  inputNormal,
}: Step2Props) {
  const noSlotsAvailable =
    !isAvailabilityLoading &&
    timeSlots.length > 0 &&
    timeSlots.every(time => unavailableTimeSlots.has(time) || tooShortTimeSlots.has(time));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-foreground mb-1">
          {t.bookingWizard?.steps?.departureDuration || 'Salida y duración'}
        </h2>
        <p className="text-xs text-muted-foreground">
          {selectedBoatInfo
            ? (t.endowment?.yourTripIn || 'Tu viaje en {boat}').replace('{boat}', selectedBoatInfo.name)
            : t.wizard.howLongHowMany}
        </p>
      </div>

      {noSlotsAvailable && (
        <div role="alert" className={cn("rounded-lg border p-3 text-sm", BOOKED_TONE)}>
          <p className="font-medium">
            {(t.bookingWizard?.hints?.boatNotAvailableForDate ?? "Sin disponibilidad para {date}. Mira otro día o cambia de barco.")
              .replace("{date}", formatBookingDateDesktop(selectedDate, language))}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onGoToStep(1)}
              className="text-xs font-semibold underline underline-offset-2"
            >
              {t.bookingWizard?.boatStatus?.changeDate ?? "Cambiar fecha"}
            </button>
            {!preSelectedBoatId && (
              <button
                type="button"
                onClick={() => onGoToStep(2)}
                className="text-xs font-semibold underline underline-offset-2"
              >
                {t.bookingWizard?.boatStatus?.seeOtherBoat ?? "Ver otro barco"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Time — shown before duration so maxDuration can filter durations */}
      <div>
        <label
          htmlFor="desktop-time"
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2"
        >
          <span>{t.wizard.departureTime}</span>
          {isAvailabilityLoading && (
            <span className="inline-flex items-center gap-1 text-[11px] font-normal opacity-70">
              <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
              {t.bookingWizard?.slotConflict?.checking ?? "Comprobando disponibilidad…"}
            </span>
          )}
        </label>
        <select
          id="desktop-time"
          value={preferredTime}
          onChange={e => onTimeSelectFromUser(e.target.value)}
          onBlur={() => handleBlur("time")}
          aria-required="true"
          aria-busy={isAvailabilityLoading ? "true" : "false"}
          aria-invalid={showFieldError("time") ? "true" : "false"}
          aria-describedby={showFieldError("time") ? "error-desktop-time" : undefined}
          className={`${inputBase} ${showFieldError("time") ? inputError : inputNormal}`}
        >
          <option value="">{t.wizard.selectTime}</option>
          {timeSlots.map(time => {
            const isUnavailable = unavailableTimeSlots.has(time);
            const isTooShort = !isUnavailable && tooShortTimeSlots.has(time);
            const maxDur = slotMaxDuration.get(time);
            const suffix = isUnavailable
              ? (t.booking.timeSlotReservedSuffix ?? " · Reservado")
              : isTooShort && maxDur != null
                ? (t.booking.timeSlotMaxDurationSuffix ?? " · solo {n}h").replace("{n}", String(maxDur))
                : "";
            return (
              <option key={time} value={time} disabled={isUnavailable || isTooShort}>
                {time}{t.booking.timeSuffix ?? "h"}{suffix}
              </option>
            );
          })}
        </select>
        {showFieldError("time") && (
          <p id="error-desktop-time" className="text-xs text-destructive mt-1">
            {getFieldError("time")}
          </p>
        )}
      </div>

      {/* Duration */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-muted-foreground">
            {t.wizard.duration}
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(() => {
            const enabledWithPrice = durationOptions.filter(o => !o.disabled && o.price);
            // Best-value badge gated to true low season (Apr, May, Jun 1-15,
            // Sep, Oct). In peak we don't want to push 8h since shorter slots
            // sell on their own and turnover wins.
            const dateObj = selectedDate ? new Date(selectedDate + 'T12:00:00') : null;
            const allowBestValue = isBestValueSeasonForLongDuration(dateObj);
            const bestValueId =
              allowBestValue && enabledWithPrice.length > 1
                ? enabledWithPrice.reduce((best, dur) => {
                    const bestPH = best.price! / parseFloat(best.value);
                    const durPH = dur.price! / parseFloat(dur.value);
                    return durPH < bestPH ? dur : best;
                  }).value
                : null;
            // Durations that don't fit (too long for the start time / real
            // availability) or are season-restricted are removed entirely —
            // we never show them struck-through as "No disponible".
            const bookableOptions = durationOptions.filter(opt => {
              const durationHours = parseInt(opt.value.replace("h", ""));
              const exceedsMax =
                selectedTimeMaxDuration !== null && durationHours > selectedTimeMaxDuration;
              return !exceedsMax && !opt.disabled;
            });
            return bookableOptions.map(opt => {
              const durationHours = parseInt(opt.value.replace("h", ""));
              const exceedsMax =
                selectedTimeMaxDuration !== null && durationHours > selectedTimeMaxDuration;
              const isSeasonRestricted = !!opt.disabled;
              const isDisabled = exceedsMax || isSeasonRestricted;
              const parts = opt.label.split(" - ");
              const priceText =
                parts.length > 1 && parts[parts.length - 1].includes("€")
                  ? parts[parts.length - 1]
                  : null;
              const labelText = priceText ? parts.slice(0, -1).join(" · ") : opt.label;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && onDurationSelectFromUser(opt.value)}
                  title={isSeasonRestricted ? opt.disabledReason : undefined}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                    isDisabled
                      ? "border-border bg-muted opacity-50 cursor-not-allowed"
                      : selectedDuration === opt.value
                        ? "border-cta bg-cta/5"
                        : "border-cta/40 bg-background hover:border-cta"
                  }`}
                >
                  {opt.value === "4h" && !isDisabled && (
                    <p aria-hidden="true" className="text-xs font-medium text-muted-foreground mb-0.5">
                      {t.wizard.mostPopular}
                    </p>
                  )}
                  {opt.value === bestValueId && (
                    <p aria-hidden="true" className="text-xs font-semibold text-success bg-success/10 inline-block px-1.5 py-0.5 rounded-full mb-0.5">
                      {t.neuro?.bestValue || "Mejor valor"}
                    </p>
                  )}
                  {(() => {
                    // Split "4 horas · Media día" into a tight headline
                    // ("4 horas" + "200€" on one row) and a smaller descriptor
                    // beneath ("Media día"). Keeps every card single-line wide
                    // regardless of how long the label gets.
                    const labelParts = labelText.split(" · ");
                    const durationLabel = labelParts[0];
                    const descriptor = labelParts.length > 1 ? labelParts.slice(1).join(" · ") : null;
                    return (
                      <>
                        <div className="flex items-baseline justify-center gap-2">
                          <p
                            className={`text-sm font-semibold ${isDisabled ? "text-muted-foreground line-through" : "text-foreground"}`}
                          >
                            {durationLabel}
                          </p>
                          {isDisabled ? (
                            <p className="text-xs text-popular font-medium">
                              {opt.disabledReason || t.boats.notAvailable}
                            </p>
                          ) : priceText ? (
                            <p className="text-sm font-bold text-foreground">{priceText}</p>
                          ) : null}
                        </div>
                        {descriptor && !isDisabled && (
                          <p className="text-xs text-muted-foreground -mt-0.5">{descriptor}</p>
                        )}
                      </>
                    );
                  })()}
                  {opt.price && !isDisabled && (
                    <p className="text-xs text-muted-foreground">
                      {(opt.price / parseFloat(opt.value)).toFixed(0)}€
                      {t.neuro?.perHour || "/hora"} ·{" "}
                      {Math.ceil(opt.price / parseFloat(opt.value) / maxCapacity)}€/
                      {t.boats?.perPerson || "pers."}
                    </p>
                  )}
                </button>
              );
            });
          })()}
        </div>
        {showFieldError("duration") && (
          <p id="error-desktop-duration" className="text-xs text-destructive mt-1">
            {getFieldError("duration")}
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STEP 1 (DESKTOP): When + Who (date + people)
   ═══════════════════════════════════════════ */

interface Step1WhenWhoProps {
  selectedDate: string;
  setSelectedDate: (v: string) => void;
  onDateSelectFromUser: (v: string) => void;
  getLocalISODate: () => string;
  showDatePicker: boolean;
  setShowDatePicker: (v: boolean) => void;
  nextSaturdayISO: string;
  language: string;
  numberOfPeople: string;
  setNumberOfPeople: (v: string) => void;
  showFieldError: (f: string) => boolean;
  getFieldError: (f: string) => string;
  handleBlur: (f: string) => void;
  t: BookingWizardMobileProps["t"];
  inputBase: string;
  inputError: string;
  inputNormal: string;
}

function Step1WhenWhoDesktop({
  selectedDate,
  onDateSelectFromUser,
  getLocalISODate,
  showDatePicker,
  setShowDatePicker,
  nextSaturdayISO,
  language,
  numberOfPeople,
  setNumberOfPeople,
  showFieldError,
  getFieldError,
  handleBlur,
  t,
  inputBase,
  inputError,
  inputNormal,
}: Step1WhenWhoProps) {
  const peopleCap = 12; // narrowed to boat capacity in step 2
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-foreground mb-1">
          {t.bookingWizard?.steps?.whenWho || 'Cuándo y cuántos sois'}
        </h2>
        <div className="flex flex-col gap-1.5 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-1.5 lg:gap-y-1 text-xs text-muted-foreground">
          <span>
            {t.bookingWizard?.hints?.pricesNextStep || 'En el siguiente paso verás precios reales para tu fecha.'}
          </span>
          <span className="hidden lg:inline text-muted-foreground/40" aria-hidden="true">·</span>
          <span>
            {t.bookingWizard?.hints?.noOnlinePayment || 'Sin pago online — te confirmamos por WhatsApp'}
          </span>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-2">
          {t.wizard.date}
        </label>
        <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
          <PopoverTrigger asChild>
            <button
              type="button"
              onBlur={() => handleBlur("date")}
              aria-describedby={showFieldError("date") ? "error-desktop-date" : undefined}
              className={`${inputBase} flex items-center gap-2 ${showFieldError("date") ? inputError : inputNormal}`}
            >
              <CalendarIcon className="w-4 h-4 text-foreground flex-shrink-0" />
              {selectedDate ? (
                new Date(selectedDate + "T00:00:00").toLocaleDateString(getLocaleForLanguage(language), {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              ) : (
                <span className="text-muted-foreground">{t.wizard.selectDate}</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate ? new Date(selectedDate + "T00:00:00") : undefined}
              onSelect={date => {
                if (date) {
                  const y = date.getFullYear();
                  const m = String(date.getMonth() + 1).padStart(2, "0");
                  const d = String(date.getDate()).padStart(2, "0");
                  onDateSelectFromUser(`${y}-${m}-${d}`);
                }
                setShowDatePicker(false);
              }}
              disabled={date => date < new Date(getLocalISODate() + "T00:00:00")}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {showFieldError("date") && (
          <p id="error-desktop-date" className="text-xs text-destructive mt-1">
            {getFieldError("date")}
          </p>
        )}
        {!selectedDate && nextSaturdayISO && (
          <p className="text-xs text-muted-foreground mt-1.5">
            {t.wizard.suggestedDate}:{" "}
            {new Date(nextSaturdayISO + "T12:00:00").toLocaleDateString(
              getLocaleForLanguage(language),
              { weekday: "long", day: "numeric", month: "long" }
            )}
          </p>
        )}
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-2">
          {t.wizard.numberOfPeople}
        </label>
        <div
          className={`flex items-center justify-between border-2 rounded-lg bg-background px-4 py-2 ${
            showFieldError("people") ? "border-destructive" : "border-cta/40"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              const c = parseInt(numberOfPeople || "1");
              if (c > 1) {
                setNumberOfPeople(String(c - 1));
                handleBlur("people");
              }
            }}
            disabled={!numberOfPeople || parseInt(numberOfPeople) <= 1}
            aria-label={t.a11y.decreasePeople}
            className="w-11 h-11 rounded-full border-2 border-cta/40 flex items-center justify-center font-bold text-muted-foreground disabled:opacity-30 hover:border-foreground hover:text-foreground transition-colors text-lg"
          >
            −
          </button>
          <span className="text-2xl font-bold text-foreground min-w-[2rem] text-center">
            {numberOfPeople || "1"}
          </span>
          <button
            type="button"
            onClick={() => {
              const c = parseInt(numberOfPeople || "1");
              if (c < peopleCap) {
                setNumberOfPeople(String(c + 1));
                handleBlur("people");
              }
            }}
            disabled={!!numberOfPeople && parseInt(numberOfPeople) >= peopleCap}
            aria-label={t.a11y.increasePeople}
            className="w-11 h-11 rounded-full border-2 border-cta/40 flex items-center justify-center font-bold text-muted-foreground disabled:opacity-30 hover:border-foreground hover:text-foreground transition-colors text-lg"
          >
            +
          </button>
        </div>
        {showFieldError("people") && (
          <p id="error-desktop-people" className="text-xs text-destructive mt-1">
            {getFieldError("people")}
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STEP 4: Extras & Packs ("Mejora tu día")
   ═══════════════════════════════════════════ */

interface Step4ExtrasProps {
  boatExtras: BookingWizardMobileProps["boatExtras"];
  selectedExtras: string[];
  selectedPack: string | null;
  extrasInPack: Set<string>;
  totalExtrasPrice: number;
  handlePackSelect: (packId: string) => void;
  handleExtraToggle: (extraName: string) => void;
  availablePacks: typeof EXTRA_PACKS;
  iconMap: BookingWizardMobileProps["iconMap"];
  calculatePackSavings: (packId: string) => number;
  isSpanishLang: boolean;
  language: string;
  t: BookingWizardMobileProps["t"];
}

function Step4ExtrasDesktop({
  boatExtras,
  selectedExtras,
  selectedPack,
  extrasInPack,
  totalExtrasPrice,
  handlePackSelect,
  handleExtraToggle,
  availablePacks,
  iconMap,
  calculatePackSavings,
  isSpanishLang,
  language,
  t,
}: Step4ExtrasProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-foreground mb-1">
          {t.bookingWizard?.steps?.upgradeYourDay || 'Mejora tu día'}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t.booking.extrasSection.title}
        </p>
      </div>

      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-muted-foreground">
          {t.booking.extrasSection.packs}
        </p>
        {totalExtrasPrice > 0 && (
          <span className="text-sm text-foreground font-bold">+{totalExtrasPrice}€</span>
        )}
      </div>

      {/* Packs — grid 2 columns */}
      <div className="grid grid-cols-2 gap-2">
        {availablePacks.map(pack => (
          <button
            key={pack.id}
            type="button"
            onClick={() => handlePackSelect(pack.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
              selectedPack === pack.id
                ? "border-cta bg-cta/5"
                : "border-cta/30 bg-card hover:border-cta hover:bg-cta/5"
            }`}
          >
            <div className="flex-1 flex flex-col items-center gap-1.5">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {isSpanishLang ? pack.name : pack.nameEN}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                {pack.extras.map(e => translateExtraName(e, language)).join(", ")}
              </p>
            </div>
            <p className="text-base font-bold text-foreground">{pack.price}€</p>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-popular text-popular-foreground text-xs font-semibold animate-savings-pulse">
              -{formatPackSavingsAmount(calculatePackSavings(pack.id))}€{" "}
              {t.booking.extrasSection.savings.toLowerCase()}
            </span>
          </button>
        ))}
      </div>

      {/* Individual extras — grid 2 columns */}
      <div className="grid grid-cols-2 gap-2">
        {boatExtras.map(extra => {
          const Icon = iconMap[extra.icon] || iconMap["Package"];
          const inPack = extrasInPack.has(extra.name);
          const isSelected = selectedExtras.includes(extra.name);
          return (
            <button
              key={extra.name}
              type="button"
              onClick={() => handleExtraToggle(extra.name)}
              disabled={inPack}
              className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                inPack
                  ? "border-foreground/20 bg-foreground/5 opacity-70 cursor-default"
                  : isSelected
                    ? "border-cta bg-cta/5"
                    : "border-cta/40 bg-background hover:border-cta"
              }`}
            >
              {Icon && <Icon className="w-7 h-7 text-foreground" />}
              <span className="text-xs font-medium text-foreground leading-tight">
                {translateExtraName(extra.name, language)}
              </span>
              {inPack ? (
                <span className="text-xs text-foreground font-semibold">
                  {t.booking.extrasSection.included.toLowerCase()}
                </span>
              ) : (
                <span className="text-sm font-bold text-foreground">{extra.price}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STEP 5: Contact & Confirm
   ═══════════════════════════════════════════ */

interface Step5Props {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
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
  filteredPrefixes: { code: string; flag: string; country: string }[];
  selectedPrefixInfo: { code: string; flag: string; country: string } | undefined;
  showCodeSection: boolean;
  setShowCodeSection: (v: boolean) => void;
  codeInput: string;
  setCodeInput: (v: string) => void;
  isValidatingCode: boolean;
  validatedCode: { type: string; code: string; value?: number; percentage?: number } | null;
  codeError: string;
  handleValidateCode: () => void;
  handleRemoveCode: () => void;
  price: number | null;
  totalExtrasPrice: number;
  discount: number;
  selectedBoatInfo: BookingWizardMobileProps["selectedBoatInfo"];
  selectedDate: string;
  selectedDuration: string;
  preferredTime: string;
  numberOfPeople: string;
  selectedExtras: string[];
  selectedPack: string | null;
  extrasInPack: Set<string>;
  language: string;
  onGoToStep: (step: number) => void;
  showFieldError: (f: string) => boolean;
  getFieldError: (f: string) => string;
  handleBlur: (f: string) => void;
  t: BookingWizardMobileProps["t"];
  inputBase: string;
  inputError: string;
  inputNormal: string;
  // P1.9: slot conflict on step 5 — pass-through to Step5FinalDesktop.
  slotConflict: BookingWizardMobileProps["slotConflict"];
  onPickAlternativeSlot: BookingWizardMobileProps["onPickAlternativeSlot"];
  onChangeDateFromConflict: BookingWizardMobileProps["onChangeDateFromConflict"];
  isAvailabilityLoading: BookingWizardMobileProps["isAvailabilityLoading"];
  licenseVerifier: BookingWizardMobileProps["licenseVerifier"];
}

function Step5Contact({
  firstName,
  lastName,
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
  showCodeSection,
  setShowCodeSection,
  codeInput,
  setCodeInput,
  isValidatingCode,
  validatedCode,
  codeError,
  handleValidateCode,
  handleRemoveCode,
  price,
  totalExtrasPrice,
  discount,
  selectedBoatInfo,
  selectedDate,
  selectedDuration,
  preferredTime,
  numberOfPeople,
  selectedExtras,
  selectedPack,
  extrasInPack,
  language,
  onGoToStep,
  showFieldError,
  getFieldError,
  handleBlur,
  t,
  inputBase,
  inputError,
  inputNormal,
}: Step5Props) {
  const { localizedPath } = useLanguage();
  const depositStr = selectedBoatInfo?.specifications?.deposit;
  const depositAmount = depositStr ? parseInt(depositStr.replace(/[^0-9]/g, "")) : null;

  // Build extras display text for review card
  const extrasDisplay = (() => {
    const parts: string[] = [];
    if (selectedPack) {
      const pack = EXTRA_PACKS.find(p => p.id === selectedPack);
      if (pack) parts.push(pack.name);
    }
    const nonPackExtras = selectedExtras.filter(e => !extrasInPack.has(e));
    parts.push(...nonPackExtras);
    return parts;
  })();

  // Schedule label: fuse preferredTime + selectedDuration into "12:00 → 20:00 (8h)".
  // Falls back to the raw values if either is missing or malformed.
  const scheduleDisplay = (() => {
    if (!preferredTime && !selectedDuration) return "--";
    if (!preferredTime || !selectedDuration) {
      return [preferredTime ? `${preferredTime}h` : "", selectedDuration].filter(Boolean).join(" · ");
    }
    const durationHours = parseFloat(selectedDuration.replace(/[^0-9.]/g, ""));
    const [startH, startM = 0] = preferredTime.split(":").map(Number);
    if (!Number.isFinite(durationHours) || !Number.isFinite(startH)) {
      return `${preferredTime}h · ${selectedDuration}`;
    }
    const endMinutesRaw = startH * 60 + (startM || 0) + durationHours * 60;
    const endMinutes = Math.round(endMinutesRaw);
    const endH = Math.floor(endMinutes / 60) % 24;
    const endM = endMinutes % 60;
    const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
    return `${preferredTime} → ${endTime} (${selectedDuration})`;
  })();

  return (
    <div className="space-y-4">
      {/* Review summary card */}
      <div className="bg-cta/10 border border-cta/30 rounded-xl p-4 lg:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t.reviewSummary?.title || "Resumen de tu reserva"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(1)}
            className="inline-flex items-center gap-1 px-2.5 py-1 border border-primary/30 rounded-full text-xs font-medium text-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
          >
            <Pencil className="w-3 h-3" aria-hidden="true" />
            {t.reviewSummary?.modifyShort || "Editar"}
          </button>
        </div>
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-6">
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              <span className="text-muted-foreground">{t.booking.boat}</span>
              <span className="ml-auto font-medium text-foreground text-right">{selectedBoatInfo?.name || "--"}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              <span className="text-muted-foreground">{t.booking.date}</span>
              <span className="ml-auto font-medium text-foreground text-right">
                {formatBookingDateDesktop(selectedDate, language)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              <span className="text-muted-foreground">{t.reviewSummary?.schedule || "Horario"}</span>
              <span className="ml-auto font-medium text-foreground text-right">{scheduleDisplay}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              <span className="text-muted-foreground">{t.booking.people}</span>
              <span className="ml-auto font-medium text-foreground text-right">{numberOfPeople}</span>
            </div>
          </div>
          <div className="space-y-2.5 text-sm mt-3 pt-3 border-t border-cta/30 lg:mt-0 lg:pt-0 lg:border-t-0">
            {extrasDisplay.length > 0 && (
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-muted-foreground">{t.booking.extras}</span>
                <span className="ml-auto font-medium text-foreground text-right">
                  {extrasDisplay.join(", ")}
                </span>
              </div>
            )}
            {/* P0.5 (2026-05-20): explicit fuel signal. Visible in the review so
                licensed-boat users don't get surprised by an off-quote fuel cost. */}
            {selectedBoatInfo && (
              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                  selectedBoatInfo.requiresLicense
                    ? "bg-popular/10 border border-popular/20 text-popular"
                    : "bg-success/10 border border-success/20 text-success"
                }`}
              >
                <Fuel className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                <span>
                  {selectedBoatInfo.requiresLicense
                    ? t.bookingWizard?.fuel?.notIncluded || "Combustible no incluido"
                    : t.bookingWizard?.fuel?.included || "Combustible incluido"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Personal data */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          {t.endowment?.confirmYourBooking || t.wizard.yourData}
        </p>
        <div className="space-y-2.5">
          <div>
            <input
              type="text"
              value={firstName + (lastName ? ` ${lastName}` : "")}
              onChange={e => onFullNameChange(e.target.value)}
              onBlur={() => handleBlur("firstName")}
              placeholder={t.wizard.fullName}
              autoComplete="name"
              maxLength={200}
              aria-required="true"
              aria-describedby={
                showFieldError("firstName") ? "error-desktop-fullname" : undefined
              }
              className={`${inputBase} ${showFieldError("firstName") ? inputError : inputNormal}`}
            />
            {showFieldError("firstName") && (
              <p id="error-desktop-fullname" className="text-xs text-destructive mt-0.5">
                {getFieldError("firstName")}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative w-24 flex-shrink-0" ref={prefixDropdownRef}>
              <button
                type="button"
                tabIndex={0}
                onClick={() => setShowPrefixDropdown(!showPrefixDropdown)}
                onKeyDown={e => {
                  if (e.key === "Escape") setShowPrefixDropdown(false);
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setShowPrefixDropdown(!showPrefixDropdown);
                  }
                }}
                aria-haspopup="listbox"
                aria-expanded={showPrefixDropdown}
                aria-label={`${t.a11y.phonePrefix}: ${phonePrefix}`}
                className={`${inputBase} ${inputNormal} flex items-center justify-center gap-2`}
              >
                {selectedPrefixInfo && (
                  <CountryFlag
                    iso2={flagEmojiToIso2(selectedPrefixInfo.flag)}
                    emoji={selectedPrefixInfo.flag}
                    emojiClassName="text-sm leading-none"
                  />
                )}
                <span className="truncate text-sm">{phonePrefix}</span>
              </button>
              {showPrefixDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-background border border-cta/40 rounded-xl shadow-sm z-50 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="p-2 border-b sticky top-0 bg-background">
                    <input
                      type="text"
                      value={prefixSearch}
                      onChange={e => setPrefixSearch(e.target.value)}
                      placeholder={t.wizard.searchCountry}
                      className="w-full p-2 border border-cta/40 rounded-lg text-sm bg-background text-foreground"
                    />
                  </div>
                  {filteredPrefixes.map(prefix => (
                    <button
                      key={`${prefix.code}-${prefix.country}`}
                      type="button"
                      onClick={() => {
                        setPhonePrefix(prefix.code);
                        setShowPrefixDropdown(false);
                        setPrefixSearch("");
                      }}
                      className="w-full p-2 hover:bg-cta/10 text-left flex items-center gap-2 text-sm bg-background"
                    >
                      <CountryFlag iso2={flagEmojiToIso2(prefix.flag)} emoji={prefix.flag} />
                      <span className="font-medium">{prefix.code}</span>
                      <span className="text-muted-foreground truncate">{prefix.country}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="tel"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                onBlur={() => handleBlur("phone")}
                placeholder={t.wizard.phone}
                autoComplete="tel"
                maxLength={15}
                aria-required="true"
                aria-describedby={showFieldError("phone") ? "error-desktop-phone" : undefined}
                className={`${inputBase} ${showFieldError("phone") ? inputError : inputNormal}`}
              />
              {showFieldError("phone") && (
                <p id="error-desktop-phone" className="text-xs text-destructive mt-0.5">
                  {getFieldError("phone")}
                </p>
              )}
            </div>
          </div>
          <div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => handleBlur("email")}
              placeholder={`${t.wizard.email} (${t.booking.optional})`}
              autoComplete="email"
              maxLength={254}
              aria-required="false"
              aria-describedby={showFieldError("email") ? "error-desktop-email" : "hint-desktop-email"}
              className={`${inputBase} ${showFieldError("email") ? inputError : inputNormal}`}
            />
            {showFieldError("email") ? (
              <p id="error-desktop-email" className="text-xs text-destructive mt-0.5">
                {getFieldError("email")}
              </p>
            ) : (
              <p id="hint-desktop-email" className="text-xs text-muted-foreground mt-0.5">
                {t.wizard.emailHelper}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Discount / Gift card code */}
      <div>
        <button
          type="button"
          onClick={() => setShowCodeSection(!showCodeSection)}
          className="flex items-center justify-between w-full mb-2"
        >
          <p className="text-xs font-semibold text-muted-foreground">
            {t.codeValidation.haveCode}
          </p>
          <span className="text-muted-foreground text-xs">
            {showCodeSection ? "\u25B2" : "\u25BC"}
          </span>
        </button>

        {showCodeSection && (
          <div className="space-y-2">
            {validatedCode ? (
              <div className="flex items-center justify-between bg-foreground/5 border border-foreground/20 rounded-lg p-2.5">
                <div>
                  <p className="text-xs font-bold text-foreground">{validatedCode.code}</p>
                  <p className="text-xs text-foreground">
                    {validatedCode.type === "gift_card"
                      ? `-${discount}\u20AC`
                      : `-${validatedCode.percentage}% (-${discount}\u20AC)`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCode}
                  className="text-muted-foreground hover:text-destructive transition-colors p-2 -m-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={t.a11y.remove}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value.toUpperCase())}
                  placeholder={t.codeValidation.enterCode}
                  className={`flex-1 p-2.5 border-2 ${inputNormal} rounded-lg bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-foreground/30 focus:outline-none uppercase`}
                  maxLength={32}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleValidateCode();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleValidateCode}
                  disabled={isValidatingCode || !codeInput.trim()}
                  className="px-3 py-2.5 bg-foreground text-white text-xs font-semibold rounded-lg disabled:opacity-50 hover:bg-foreground/90 transition-colors flex-shrink-0"
                >
                  {isValidatingCode ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t.codeValidation.validate
                  )}
                </button>
              </div>
            )}
            {codeError && <p className="text-xs text-destructive">{codeError}</p>}
          </div>
        )}
      </div>

      {/* Price summary */}
      {price !== null && (
        <div className="bg-cta/10 border border-cta/30 rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            {t.endowment?.yourPrice || t.booking.estimatedTotal}
          </p>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.booking.basePrice}</span>
              <span className="font-medium">{price}€</span>
            </div>
            {totalExtrasPrice > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.booking.extrasSection.title}</span>
                <span className="font-medium">+{totalExtrasPrice}€</span>
              </div>
            )}
            {discount > 0 && validatedCode && (
              <div className="flex justify-between text-sm text-foreground">
                <span>{validatedCode.code}</span>
                <span>-{discount}€</span>
              </div>
            )}
            <div className="flex justify-between items-baseline border-t border-cta/30 pt-2 mt-2">
              <span className="text-sm font-bold text-foreground">
                {t.endowment?.yourPrice || "Total"}
              </span>
              <span className="text-xl font-bold text-foreground">
                {price + totalExtrasPrice - discount}€
              </span>
            </div>
            {depositAmount && (
              <div className="flex justify-between text-sm mt-2 pt-2 border-t border-cta/20 border-dashed">
                <span className="text-muted-foreground">
                  {t.pricing?.depositLabel || "Fianza"} (
                  {t.pricing?.depositRefundable || "reembolsable"})
                </span>
                <span className="font-medium text-muted-foreground">{depositAmount}€</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t.booking.priceConfirmedWhatsApp}
          </p>
          {depositAmount && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.pricing?.payAtPort || "Se paga y devuelve en el puerto"}
            </p>
          )}
        </div>
      )}

      {/* Value stacking — what's included */}
      <ValueStack
        requiresLicense={!!selectedBoatInfo?.requiresLicense}
        isExcursion={selectedBoatInfo?.id === "excursion-privada"}
        t={t}
      />

      {/* RGPD passive consent notice */}
      <p className="text-xs text-muted-foreground leading-relaxed text-center">
        {t.booking.gdprPassive?.split("{privacyPolicy}")[0] ||
          "Al enviar esta solicitud, aceptas nuestra "}
        <a
          href={localizedPath("privacyPolicy")}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline hover:text-foreground/80"
        >
          {t.booking.gdprPrivacyLink}
        </a>
        {
          (t.booking.gdprPassive?.split("{privacyPolicy}")[1] || " y ").split(
            "{termsAndConditions}"
          )[0]
        }
        <a
          href={localizedPath("condicionesGenerales")}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline hover:text-foreground/80"
        >
          {t.booking.gdprTermsLink}
        </a>
        {(t.booking.gdprPassive?.split("{privacyPolicy}")[1] || "").split(
          "{termsAndConditions}"
        )[1] || "."}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STEP 5 (DESKTOP, FINAL): Personal data + Summary + RGPD
   Extras moved out to their own step (Step4ExtrasDesktop) — this step
   focuses the user on the contact form + summary right before submit.
   ═══════════════════════════════════════════ */

function Step5FinalDesktop(props: Step5Props) {
  const {
    slotConflict,
    onPickAlternativeSlot,
    onChangeDateFromConflict,
    isAvailabilityLoading,
    preferredTime,
    licenseVerifier,
    onGoToStep,
    t,
  } = props;
  return (
    <div className="space-y-6">
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
      {licenseVerifier.state.status && (
        <LicenseStatusPill
          country={licenseVerifier.state.country}
          status={licenseVerifier.state.status}
          onChange={() => {
            licenseVerifier.resetStatus();
            licenseVerifier.undismiss();
            onGoToStep(2);
          }}
        />
      )}
      <Step5Contact {...props} />
    </div>
  );
}
