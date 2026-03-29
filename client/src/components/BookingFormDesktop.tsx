import { useState, useEffect, useRef } from "react";
import { CalendarIcon, Check, ClipboardList, Clock, Loader2, Star, Users, X } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import type { BookingWizardMobileProps } from "./BookingWizardMobile";
import { EXTRA_PACKS } from "@shared/boatData";
import BookingProgressBar from "@/components/BookingProgressBar";
import { ValueStack } from "@/components/booking-flow/ValueStack";
import { BookingTrustBanner } from "@/components/booking-flow/BookingTrustBanner";
import HoldCountdown from "@/components/HoldCountdown";
import PriceSummaryBar from "@/components/PriceSummaryBar";
import { trackWhatsAppClick } from "@/utils/analytics";
import { useLanguage } from "@/hooks/use-language";

// Slide animation variants
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

const LOCALE_MAP_DESKTOP: Record<string, string> = {
  es: 'es-ES', ca: 'ca-ES', en: 'en-GB', fr: 'fr-FR',
  de: 'de-DE', nl: 'nl-NL', it: 'it-IT', ru: 'ru-RU',
};

function formatBookingDateDesktop(dateStr: string, language: string): string {
  if (!dateStr) return '--';
  try {
    const date = new Date(dateStr + 'T12:00:00');
    const locale = LOCALE_MAP_DESKTOP[language] || 'es-ES';
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function BookingFormDesktop(props: BookingWizardMobileProps) {
  const {
    currentStep, onNext, onBack, onGoToStep,
    holdExpiresAt, holdExpired, onHoldExpired, onHoldVerify,
    licenseFilter, setLicenseFilter,
    selectedBoat, setSelectedBoat,
    selectedDate, setSelectedDate,
    selectedDuration, setSelectedDuration,
    preferredTime, setPreferredTime,
    numberOfPeople, setNumberOfPeople,
    firstName, setFirstName,
    lastName, setLastName,
    phonePrefix, setPhonePrefix,
    phoneNumber, setPhoneNumber,
    email, setEmail,
    showPrefixDropdown, setShowPrefixDropdown,
    prefixSearch, setPrefixSearch,
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
    showFieldError, getFieldError, handleBlur,
    t,
    boatExtras,
    selectedExtras,
    selectedPack,
    showExtras, setShowExtras,
    extrasInPack,
    totalExtrasPrice,
    handlePackSelect,
    handleExtraToggle,
    iconMap,
    calculatePackSavings,
    isSpanishLang,
    showCodeSection, setShowCodeSection,
    codeInput, setCodeInput,
    isValidatingCode,
    validatedCode,
    codeError,
    handleValidateCode,
    handleRemoveCode,
    getCodeDiscount,
    autoDiscount,
    nextSaturdayISO,
    language,
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
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      prevStepRef.current = currentStep;
    }
  }, [currentStep]);

  const durationOptions = getDurationOptions();
  const maxCapacity = getMaxCapacity();
  const price = getBookingPrice();
  const discount = getCodeDiscount();
  const autoDiscountAmount = autoDiscount?.type ? autoDiscount.amount : 0;
  const boatExtraNames = new Set(boatExtras.map(e => e.name));
  const availablePacks = EXTRA_PACKS.filter(pack =>
    pack.extras.every(name => boatExtraNames.has(name))
  );

  const inputBase = "w-full px-3 py-2.5 border-2 rounded-lg bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-foreground/30 focus:border-foreground focus:outline-none h-[46px] transition-colors";
  const inputError = "border-red-400";
  const inputNormal = "border-cta/40";

  // Endowment Effect: once a boat is selected, shift to possessive language
  const boatSelected = !!selectedBoatInfo;
  const stepLabels = [
    t.wizard.stepBoat,
    boatSelected ? (t.endowment?.yourTrip || t.wizard.stepTrip) : t.wizard.stepTrip,
    boatSelected ? (t.endowment?.yourExperience || t.wizard.stepExtras) : t.wizard.stepExtras,
    boatSelected ? (t.endowment?.confirmStep || t.wizard.stepYourData) : t.wizard.stepYourData,
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Step progress bar */}
      <div className="flex-shrink-0 px-8 pt-3 pb-2 border-b border-cta/20">
        <BookingProgressBar
          currentStep={currentStep}
          totalSteps={4}
          stepLabels={stepLabels}

        />
      </div>

      {/* Hold countdown timer — only visible on final step */}
      {holdExpiresAt && currentStep === 4 && (
        <div className="flex-shrink-0 px-6 pt-3">
          <HoldCountdown
            expiresAt={holdExpiresAt}
            onExpired={onHoldExpired}
            softExpiry
            onVerify={onHoldVerify}
          />
        </div>
      )}

      {/* Step content — scrollable */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto">
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
            <BookingTrustBanner
              t={t}
              stage={currentStep <= 2 ? "step1" : currentStep === 3 ? "step2" : "step3"}
            />
            {currentStep === 1 && (
              <Step1BoatDate
                licenseFilter={licenseFilter} setLicenseFilter={setLicenseFilter}
                selectedBoat={selectedBoat} setSelectedBoat={setSelectedBoat}
                filteredBoats={filteredBoats} isBoatsLoading={isBoatsLoading}
                preSelectedBoatId={preSelectedBoatId}
                showFieldError={showFieldError} getFieldError={getFieldError}
                t={t}
              />
            )}
            {currentStep === 2 && (
              <Step2Details
                selectedDate={selectedDate} setSelectedDate={setSelectedDate}
                getLocalISODate={getLocalISODate}
                showDatePicker={showDatePicker} setShowDatePicker={setShowDatePicker}
                nextSaturdayISO={nextSaturdayISO} language={language}
                selectedDuration={selectedDuration} setSelectedDuration={setSelectedDuration}
                preferredTime={preferredTime} setPreferredTime={setPreferredTime}
                numberOfPeople={numberOfPeople} setNumberOfPeople={setNumberOfPeople}
                durationOptions={durationOptions} maxCapacity={maxCapacity}
                selectedBoatInfo={selectedBoatInfo} timeSlots={timeSlots}
                unavailableTimeSlots={props.unavailableTimeSlots}
                selectedTimeMaxDuration={props.selectedTimeMaxDuration}
                showFieldError={showFieldError} getFieldError={getFieldError} handleBlur={handleBlur}
                t={t} inputBase={inputBase} inputError={inputError} inputNormal={inputNormal}
              />
            )}
            {currentStep === 3 && (
              <Step3Extras
                boatExtras={boatExtras} selectedExtras={selectedExtras}
                selectedPack={selectedPack} extrasInPack={extrasInPack}
                totalExtrasPrice={totalExtrasPrice}
                handlePackSelect={handlePackSelect} handleExtraToggle={handleExtraToggle}
                availablePacks={availablePacks} iconMap={iconMap}
                calculatePackSavings={calculatePackSavings}
                isSpanishLang={isSpanishLang} t={t}
              />
            )}
            {currentStep === 4 && (
              <Step4Contact
                firstName={firstName} setFirstName={setFirstName}
                lastName={lastName} setLastName={setLastName}
                phonePrefix={phonePrefix} setPhonePrefix={setPhonePrefix}
                phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber}
                email={email} setEmail={setEmail}
                showPrefixDropdown={showPrefixDropdown} setShowPrefixDropdown={setShowPrefixDropdown}
                prefixSearch={prefixSearch} setPrefixSearch={setPrefixSearch}
                prefixDropdownRef={prefixDropdownRef}
                filteredPrefixes={filteredPrefixes} selectedPrefixInfo={selectedPrefixInfo}
                showCodeSection={showCodeSection} setShowCodeSection={setShowCodeSection}
                codeInput={codeInput} setCodeInput={setCodeInput}
                isValidatingCode={isValidatingCode} validatedCode={validatedCode}
                codeError={codeError} handleValidateCode={handleValidateCode}
                handleRemoveCode={handleRemoveCode}
                price={price} totalExtrasPrice={totalExtrasPrice} discount={discount} autoDiscount={autoDiscount}
                selectedBoatInfo={selectedBoatInfo}
                selectedDate={selectedDate} selectedDuration={selectedDuration}
                preferredTime={preferredTime} numberOfPeople={numberOfPeople}
                selectedExtras={selectedExtras} selectedPack={selectedPack}
                extrasInPack={extrasInPack} language={props.language}
                onGoToStep={onGoToStep}
                showFieldError={showFieldError} getFieldError={getFieldError} handleBlur={handleBlur}
                t={t} inputBase={inputBase} inputError={inputError} inputNormal={inputNormal}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Price summary — visible from step 2 onwards when boat + duration selected */}
      {currentStep >= 2 && currentStep <= 3 && price !== null && selectedBoatInfo && selectedDuration && (
        <div className="flex-shrink-0 px-6 pb-1">
          <PriceSummaryBar
            boatName={selectedBoatInfo.name}
            duration={selectedDuration}
            basePrice={price}
            extrasPrice={totalExtrasPrice}
            discount={discount}
            discountLabel={validatedCode?.percentage ? `${validatedCode.code} (${validatedCode.percentage}%)` : undefined}
            autoDiscountAmount={props.autoDiscount?.type ? props.autoDiscount.amount : 0}
            autoDiscountLabel={props.autoDiscount?.type === 'early-bird' ? t.booking.earlyBirdDiscount : props.autoDiscount?.type === 'flash-deal' ? t.booking.flashDealDiscount : undefined}
            t={t}
            variant="desktop"
          />
        </div>
      )}

      {/* Navigation footer */}
      <div className="flex-shrink-0 border-t border-cta/20 px-6 py-3">
        <div className={`flex items-center ${currentStep > 1 ? "justify-between" : "justify-end"}`}>
          {currentStep > 1 && (
            <button
              onClick={onBack}
              className="text-foreground/60 hover:text-foreground transition-colors px-4 py-2.5 rounded-lg font-medium text-sm"
            >
              {t.booking.back}
            </button>
          )}
          {currentStep < 4 ? (
            <button
              onClick={onNext}
              className="bg-foreground text-white rounded-full px-8 py-2.5 font-medium text-sm hover:bg-foreground/90 transition-all btn-elevated"
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
              className="bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-full px-8 py-2.5 font-medium text-sm border-0 disabled:opacity-50 disabled:cursor-not-allowed btn-elevated"
            >
              {isSubmitting
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <SiWhatsapp className="w-4 h-4 mr-2" />
              }
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
  selectedBoat: string;
  setSelectedBoat: (v: string) => void;
  filteredBoats: BookingWizardMobileProps["filteredBoats"];
  isBoatsLoading: boolean;
  preSelectedBoatId?: string;
  showFieldError: (f: string) => boolean;
  getFieldError: (f: string) => string;
  t: BookingWizardMobileProps["t"];
}

function Step1BoatDate({
  licenseFilter, setLicenseFilter,
  selectedBoat, setSelectedBoat,
  filteredBoats, isBoatsLoading,
  preSelectedBoatId,
  showFieldError, getFieldError,
  t,
}: Step1Props) {
  return (
    <div className="space-y-5">
      {/* License filter */}
      {!preSelectedBoatId && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
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

      {/* Boat selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t.wizard.selectABoat}
          </p>
          {showFieldError('boat') && (
            <p className="text-xs text-red-500">{getFieldError('boat')}</p>
          )}
        </div>
        {isBoatsLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-2 p-3 rounded-lg border-2 border-cta/20">
                <div className="w-4 h-4 rounded-full bg-cta/30 flex-shrink-0" />
                <div className="flex-1 h-3 bg-cta/30 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredBoats.map((boat) => {
              const firstSeason = boat.pricing?.BAJA ?? (boat.pricing ? Object.values(boat.pricing)[0] : null);
              const minPrice = firstSeason?.prices
                ? Math.min(...(Object.values(firstSeason.prices) as number[]))
                : null;
              const isSelected = selectedBoat === boat.id;
              return (
                <button
                  key={boat.id}
                  type="button"
                  onClick={() => setSelectedBoat(boat.id)}
                  disabled={!!preSelectedBoatId && boat.id !== preSelectedBoatId}
                  className={`w-full flex items-center gap-2.5 p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected ? "border-foreground bg-foreground/5" : "border-cta/40 bg-background hover:border-cta"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "border-foreground bg-foreground" : "border-muted-foreground/30"
                  }`}>
                    {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{boat.name}</p>
                    {minPrice !== null && (
                      <p className="text-xs text-foreground font-medium">{t.boats.from} {minPrice}€</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{boat.capacity}p</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════
   STEP 2: Duration, Time & People
   ═══════════════════════════════════════════ */

interface Step2Props {
  selectedDate: string;
  setSelectedDate: (v: string) => void;
  getLocalISODate: () => string;
  showDatePicker: boolean;
  setShowDatePicker: (v: boolean) => void;
  nextSaturdayISO: string;
  language: string;
  selectedDuration: string;
  setSelectedDuration: (v: string) => void;
  preferredTime: string;
  setPreferredTime: (v: string) => void;
  numberOfPeople: string;
  setNumberOfPeople: (v: string) => void;
  durationOptions: { value: string; label: string; price?: number; disabled?: boolean; disabledReason?: string }[];
  maxCapacity: number;
  selectedBoatInfo: BookingWizardMobileProps["selectedBoatInfo"];
  timeSlots: string[];
  unavailableTimeSlots: Set<string>;
  selectedTimeMaxDuration: number | null;
  showFieldError: (f: string) => boolean;
  getFieldError: (f: string) => string;
  handleBlur: (f: string) => void;
  t: BookingWizardMobileProps["t"];
  inputBase: string;
  inputError: string;
  inputNormal: string;
}

function Step2Details({
  selectedDate, setSelectedDate,
  getLocalISODate, showDatePicker, setShowDatePicker,
  nextSaturdayISO, language,
  selectedDuration, setSelectedDuration,
  preferredTime, setPreferredTime,
  numberOfPeople, setNumberOfPeople,
  durationOptions, maxCapacity,
  selectedBoatInfo, timeSlots,
  unavailableTimeSlots, selectedTimeMaxDuration,
  showFieldError, getFieldError, handleBlur,
  t, inputBase, inputError, inputNormal,
}: Step2Props) {
  return (
    <div className="space-y-5">
      {/* Date */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          {t.wizard.date}
        </label>
        <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
          <PopoverTrigger asChild>
            <button
              type="button"
              onBlur={() => handleBlur('date')}
              aria-describedby={showFieldError('date') ? "error-desktop-date" : undefined}
              className={`${inputBase} flex items-center gap-2 ${showFieldError('date') ? inputError : inputNormal}`}
            >
              <CalendarIcon className="w-4 h-4 text-foreground flex-shrink-0" />
              {selectedDate
                ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
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
                  setSelectedDate(`${y}-${m}-${d}`);
                }
                setShowDatePicker(false);
              }}
              disabled={(date) => date < new Date(getLocalISODate() + 'T00:00:00')}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {showFieldError('date') && <p id="error-desktop-date" className="text-xs text-red-500 mt-1">{getFieldError('date')}</p>}
        {!selectedDate && nextSaturdayISO && (
          <p className="text-xs text-muted-foreground/60 mt-1.5">
            {t.wizard.suggestedDate}: {new Date(nextSaturdayISO + 'T12:00:00').toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        )}
      </div>

      {/* Time — shown before duration so maxDuration can filter durations */}
      <div>
        <label htmlFor="desktop-time" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          {t.wizard.departureTime}
        </label>
        <select
          id="desktop-time"
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value)}
          onBlur={() => handleBlur('time')}
          aria-required="true"
          aria-invalid={showFieldError('time') ? "true" : "false"}
          aria-describedby={showFieldError('time') ? "error-desktop-time" : undefined}
          className={`${inputBase} ${showFieldError('time') ? inputError : inputNormal}`}
        >
          <option value="">{t.wizard.selectTime}</option>
          {timeSlots.map((time) => {
            const isUnavailable = unavailableTimeSlots.has(time);
            return (
              <option key={time} value={time} disabled={isUnavailable}>
                {time}h{isUnavailable ? " - Reservado" : ""}
              </option>
            );
          })}
        </select>
        {showFieldError('time') && <p id="error-desktop-time" className="text-xs text-red-500 mt-1">{getFieldError('time')}</p>}
      </div>

      {/* Duration */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          {t.wizard.duration}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(() => {
            const enabledWithPrice = durationOptions.filter(o => !o.disabled && o.price);
            const bestValueId = enabledWithPrice.length > 1
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
              const priceText = parts.length > 1 && parts[parts.length - 1].includes('€') ? parts[parts.length - 1] : null;
              const labelText = priceText ? parts.slice(0, -1).join(' · ') : opt.label;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && setSelectedDuration(opt.value)}
                  title={isSeasonRestricted ? opt.disabledReason : undefined}
                  className={`py-3 px-2 rounded-lg border-2 text-center transition-all ${
                    isDisabled
                      ? "border-border bg-muted opacity-50 cursor-not-allowed"
                      : selectedDuration === opt.value
                      ? "border-foreground bg-foreground/5"
                      : "border-cta/40 bg-background hover:border-cta"
                  }`}
                >
                  {opt.value === "4h" && !isDisabled && (
                    <p className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-0.5">{t.wizard.mostPopular}</p>
                  )}
                  {opt.value === bestValueId && (
                    <p className="text-[9px] font-semibold text-green-700 bg-green-50 inline-block px-1.5 py-0.5 rounded-full mb-0.5">
                      {t.neuro?.bestValue || 'Mejor valor'}
                    </p>
                  )}
                  <p className={`text-sm font-semibold ${isDisabled ? "text-muted-foreground/60 line-through" : "text-foreground"}`}>{labelText}</p>
                  {isDisabled ? (
                    <p className="text-xs text-amber-600 font-medium">{opt.disabledReason || t.boats.notAvailable}</p>
                  ) : priceText ? (
                    <p className="text-xs font-bold text-foreground">{priceText}</p>
                  ) : null}
                  {opt.price && !isDisabled && (
                    <p className="text-[10px] text-muted-foreground/60">
                      {(opt.price / parseFloat(opt.value)).toFixed(0)}{t.neuro?.perHour || '/hora'} · {Math.ceil(opt.price / parseFloat(opt.value) / maxCapacity)}/{t.boats?.perPerson || 'pers.'}
                    </p>
                  )}
                </button>
              );
            });
          })()}
        </div>
        {showFieldError('duration') && <p id="error-desktop-duration" className="text-xs text-red-500 mt-1">{getFieldError('duration')}</p>}
      </div>

      {/* People */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          {t.wizard.numberOfPeople}
          {selectedBoatInfo && <span className="font-normal text-muted-foreground/70 ml-1">(max {maxCapacity})</span>}
        </label>
        <div className={`flex items-center justify-between border-2 rounded-lg bg-background px-4 py-2 ${
          showFieldError('people') ? 'border-red-400' : 'border-cta/40'
        }`}>
          <button
            type="button"
            onClick={() => {
              const c = parseInt(numberOfPeople || '0');
              if (c > 0) { setNumberOfPeople(String(c - 1)); handleBlur('people'); }
            }}
            disabled={!numberOfPeople || parseInt(numberOfPeople) <= 0}
            aria-label={t.a11y.decreasePeople}
            className="w-11 h-11 rounded-full border-2 border-cta/40 flex items-center justify-center font-bold text-muted-foreground disabled:opacity-30 hover:border-foreground hover:text-foreground transition-colors text-lg"
          >−</button>
          <span className="text-2xl font-bold text-foreground min-w-[2rem] text-center">
            {numberOfPeople || '0'}
          </span>
          <button
            type="button"
            onClick={() => {
              const c = parseInt(numberOfPeople || '0');
              if (c < maxCapacity) { setNumberOfPeople(String(c + 1)); handleBlur('people'); }
            }}
            disabled={!!numberOfPeople && parseInt(numberOfPeople) >= maxCapacity}
            aria-label={t.a11y.increasePeople}
            className="w-11 h-11 rounded-full border-2 border-cta/40 flex items-center justify-center font-bold text-muted-foreground disabled:opacity-30 hover:border-foreground hover:text-foreground transition-colors text-lg"
          >+</button>
        </div>
        {showFieldError('people') && <p id="error-desktop-people" className="text-xs text-red-500 mt-1">{getFieldError('people')}</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STEP 3: Extras & Packs
   ═══════════════════════════════════════════ */

interface Step3Props {
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
  t: BookingWizardMobileProps["t"];
}

function Step3Extras({
  boatExtras, selectedExtras, selectedPack, extrasInPack,
  totalExtrasPrice, handlePackSelect, handleExtraToggle,
  availablePacks, iconMap, calculatePackSavings,
  isSpanishLang, t,
}: Step3Props) {
  if (boatExtras.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">
          {isSpanishLang ? "No hay extras disponibles para este barco." : "No extras available for this boat."}
        </p>
        <p className="text-muted-foreground/60 text-xs mt-2">
          {isSpanishLang ? "Puedes continuar al siguiente paso." : "You can continue to the next step."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {t.endowment?.customizeExperience || t.booking.extrasSection.title}
        </p>
        {totalExtrasPrice > 0 && (
          <span className="text-sm text-foreground font-bold">+{totalExtrasPrice}€</span>
        )}
      </div>

      {/* Packs — grid 3 columns */}
      <div className="grid grid-cols-3 gap-2">
        {availablePacks.map((pack) => (
          <button
            key={pack.id}
            type="button"
            onClick={() => handlePackSelect(pack.id)}
            className={`flex flex-col items-center gap-2 p-5 rounded-lg border-2 text-center transition-all ${
              selectedPack === pack.id
                ? 'border-foreground bg-gradient-to-br from-cta/55 via-cta/25 to-foreground/15 shadow-md'
                : 'border-cta/50 bg-gradient-to-br from-cta/40 via-cta/20 to-cta/5 hover:border-cta hover:from-cta/50 hover:shadow-sm'
            }`}
          >
            <div className="flex-1 flex flex-col items-center gap-1.5">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {isSpanishLang ? pack.name : pack.nameEN}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                {pack.extras.join(', ')}
              </p>
            </div>
            <p className="text-base font-bold text-foreground">{pack.price}€</p>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-white text-xs font-semibold animate-savings-pulse">
              -{calculatePackSavings(pack.id).toFixed(2)}€ {t.booking.extrasSection.savings.toLowerCase()}
            </span>
          </button>
        ))}
      </div>

      {/* Individual extras — grid 3 columns */}
      <div className="grid grid-cols-3 gap-2">
        {boatExtras.map((extra) => {
          const Icon = iconMap[extra.icon] || iconMap['Package'];
          const inPack = extrasInPack.has(extra.name);
          const isSelected = selectedExtras.includes(extra.name);
          return (
            <button
              key={extra.name}
              type="button"
              onClick={() => handleExtraToggle(extra.name)}
              disabled={inPack}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-center transition-all ${
                inPack
                  ? 'border-foreground/20 bg-foreground/5 opacity-70 cursor-default'
                  : isSelected
                  ? 'border-foreground bg-foreground/5'
                  : 'border-cta/40 bg-background hover:border-cta'
              }`}
            >
              {Icon && <Icon className="w-7 h-7 text-foreground" />}
              <span className="text-xs font-medium text-foreground leading-tight">
                {extra.name}
              </span>
              {inPack ? (
                <span className="text-xs text-foreground font-semibold">
                  {t.booking.extrasSection.included.toLowerCase()}
                </span>
              ) : (
                <span className="text-sm font-bold text-foreground">
                  {extra.price}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STEP 4: Contact & Confirm
   ═══════════════════════════════════════════ */

interface Step4Props {
  firstName: string; setFirstName: (v: string) => void;
  lastName: string; setLastName: (v: string) => void;
  phonePrefix: string; setPhonePrefix: (v: string) => void;
  phoneNumber: string; setPhoneNumber: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  showPrefixDropdown: boolean; setShowPrefixDropdown: (v: boolean) => void;
  prefixSearch: string; setPrefixSearch: (v: string) => void;
  prefixDropdownRef: React.RefObject<HTMLDivElement>;
  filteredPrefixes: { code: string; flag: string; country: string }[];
  selectedPrefixInfo: { code: string; flag: string; country: string } | undefined;
  showCodeSection: boolean; setShowCodeSection: (v: boolean) => void;
  codeInput: string; setCodeInput: (v: string) => void;
  isValidatingCode: boolean;
  validatedCode: { type: string; code: string; value?: number; percentage?: number } | null;
  codeError: string;
  handleValidateCode: () => void;
  handleRemoveCode: () => void;
  price: number | null;
  totalExtrasPrice: number;
  discount: number;
  autoDiscount: { type: 'early-bird' | 'flash-deal' | null; percentage: number; amount: number } | null;
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
}

function Step4Contact({
  firstName, setFirstName, lastName, setLastName,
  phonePrefix, setPhonePrefix, phoneNumber, setPhoneNumber,
  email, setEmail,
  showPrefixDropdown, setShowPrefixDropdown,
  prefixSearch, setPrefixSearch, prefixDropdownRef,
  filteredPrefixes, selectedPrefixInfo,
  showCodeSection, setShowCodeSection,
  codeInput, setCodeInput, isValidatingCode,
  validatedCode, codeError, handleValidateCode, handleRemoveCode,
  price, totalExtrasPrice, discount, autoDiscount,
  selectedBoatInfo,
  selectedDate, selectedDuration, preferredTime, numberOfPeople,
  selectedExtras, selectedPack, extrasInPack,
  language, onGoToStep,
  showFieldError, getFieldError, handleBlur,
  t, inputBase, inputError, inputNormal,
}: Step4Props) {
  const { localizedPath } = useLanguage();
  const depositStr = selectedBoatInfo?.specifications?.deposit;
  const depositAmount = depositStr ? parseInt(depositStr.replace(/[^0-9]/g, '')) : null;
  const autoDiscountAmount = autoDiscount?.type ? autoDiscount.amount : 0;

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

  return (
    <div className="space-y-4">
      {/* Review summary card */}
      <div className="bg-cta/10 border border-cta/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-foreground/70" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t.reviewSummary?.title || 'Resumen de tu reserva'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(1)}
            className="text-xs font-medium text-foreground/70 hover:text-foreground transition-colors underline underline-offset-2"
          >
            {t.reviewSummary?.modify || 'Modificar'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <div className="flex justify-between col-span-2">
            <span className="text-muted-foreground">{t.booking.boat}</span>
            <span className="font-medium text-foreground">
              {selectedBoatInfo?.name || '--'}
            </span>
          </div>
          <div className="flex justify-between col-span-2">
            <span className="text-muted-foreground">{t.booking.date}</span>
            <span className="font-medium text-foreground">{formatBookingDateDesktop(selectedDate, language)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.booking.preferredTime}</span>
            <span className="font-medium text-foreground">{preferredTime}h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.booking.duration}</span>
            <span className="font-medium text-foreground">{selectedDuration}</span>
          </div>
          <div className="flex justify-between col-span-2">
            <span className="text-muted-foreground">{t.booking.people}</span>
            <span className="font-medium text-foreground">{numberOfPeople}</span>
          </div>
          {extrasDisplay.length > 0 && (
            <div className="flex justify-between col-span-2">
              <span className="text-muted-foreground">{t.booking.extras}</span>
              <span className="font-medium text-foreground text-right">{extrasDisplay.join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Personal data */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t.endowment?.confirmYourBooking || t.wizard.yourData}</p>
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="text" value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={() => handleBlur('firstName')}
                placeholder={t.wizard.firstName}
                autoComplete="given-name" maxLength={100}
                aria-required="true"
                aria-describedby={showFieldError('firstName') ? "error-desktop-firstname" : undefined}
                className={`${inputBase} ${showFieldError('firstName') ? inputError : inputNormal}`}
              />
              {showFieldError('firstName') && <p id="error-desktop-firstname" className="text-xs text-red-500 mt-0.5">{getFieldError('firstName')}</p>}
            </div>
            <div>
              <input
                type="text" value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onBlur={() => handleBlur('lastName')}
                placeholder={t.wizard.lastName}
                autoComplete="family-name" maxLength={100}
                aria-required="true"
                aria-describedby={showFieldError('lastName') ? "error-desktop-lastname" : undefined}
                className={`${inputBase} ${showFieldError('lastName') ? inputError : inputNormal}`}
              />
              {showFieldError('lastName') && <p id="error-desktop-lastname" className="text-xs text-red-500 mt-0.5">{getFieldError('lastName')}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative w-24 flex-shrink-0" ref={prefixDropdownRef}>
              <button
                type="button"
                tabIndex={0}
                onClick={() => setShowPrefixDropdown(!showPrefixDropdown)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setShowPrefixDropdown(false);
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowPrefixDropdown(!showPrefixDropdown); }
                }}
                aria-haspopup="listbox"
                aria-expanded={showPrefixDropdown}
                aria-label={`${t.a11y.phonePrefix}: ${phonePrefix}`}
                className={`${inputBase} ${inputNormal} flex items-center justify-center gap-2`}
              >
                <span className="text-sm">{selectedPrefixInfo?.flag}</span>
                <span className="truncate text-sm">{phonePrefix}</span>
              </button>
              {showPrefixDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-background border border-cta/40 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                  <div className="p-2 border-b sticky top-0 bg-background">
                    <input
                      type="text" value={prefixSearch}
                      onChange={(e) => setPrefixSearch(e.target.value)}
                      placeholder={t.wizard.searchCountry}
                      className="w-full p-2 border border-cta/40 rounded-lg text-sm bg-background text-foreground"
                    />
                  </div>
                  {filteredPrefixes.map((prefix) => (
                    <button
                      key={`${prefix.code}-${prefix.country}`}
                      type="button"
                      onClick={() => { setPhonePrefix(prefix.code); setShowPrefixDropdown(false); setPrefixSearch(""); }}
                      className="w-full p-2 hover:bg-cta/10 text-left flex items-center gap-2 text-sm bg-background"
                    >
                      <span>{prefix.flag}</span>
                      <span className="font-medium">{prefix.code}</span>
                      <span className="text-muted-foreground truncate">{prefix.country}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="tel" value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onBlur={() => handleBlur('phone')}
                placeholder={t.wizard.phone}
                autoComplete="tel" maxLength={15}
                aria-required="true"
                aria-describedby={showFieldError('phone') ? "error-desktop-phone" : undefined}
                className={`${inputBase} ${showFieldError('phone') ? inputError : inputNormal}`}
              />
              {showFieldError('phone') && <p id="error-desktop-phone" className="text-xs text-red-500 mt-0.5">{getFieldError('phone')}</p>}
            </div>
          </div>
          <div>
            <input
              type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder={t.wizard.email}
              autoComplete="email" maxLength={254}
              aria-required="true"
              aria-describedby={showFieldError('email') ? "error-desktop-email" : undefined}
              className={`${inputBase} ${showFieldError('email') ? inputError : inputNormal}`}
            />
            {showFieldError('email') && <p id="error-desktop-email" className="text-xs text-red-500 mt-0.5">{getFieldError('email')}</p>}
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
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t.codeValidation.haveCode}
          </p>
          <span className="text-muted-foreground/70 text-xs">{showCodeSection ? '\u25B2' : '\u25BC'}</span>
        </button>

        {showCodeSection && (
          <div className="space-y-2">
            {validatedCode ? (
              <div className="flex items-center justify-between bg-foreground/5 border border-foreground/20 rounded-lg p-2.5">
                <div>
                  <p className="text-xs font-bold text-foreground">{validatedCode.code}</p>
                  <p className="text-xs text-foreground">
                    {validatedCode.type === 'gift_card'
                      ? `-${discount}\u20AC`
                      : `-${validatedCode.percentage}% (-${discount}\u20AC)`}
                  </p>
                </div>
                <button
                  type="button" onClick={handleRemoveCode}
                  className="text-muted-foreground/70 hover:text-red-500 transition-colors p-2 -m-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={t.a11y.remove}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text" value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder={t.codeValidation.enterCode}
                  className={`flex-1 p-2.5 border-2 ${inputNormal} rounded-lg bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-foreground/30 focus:outline-none uppercase`}
                  maxLength={32}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleValidateCode(); } }}
                />
                <button
                  type="button" onClick={handleValidateCode}
                  disabled={isValidatingCode || !codeInput.trim()}
                  className="px-3 py-2.5 bg-foreground text-white text-xs font-semibold rounded-lg disabled:opacity-50 hover:bg-foreground/90 transition-colors flex-shrink-0"
                >
                  {isValidatingCode
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : t.codeValidation.validate}
                </button>
              </div>
            )}
            {codeError && <p className="text-xs text-red-500">{codeError}</p>}
          </div>
        )}
      </div>

      {/* Price summary */}
      {price !== null && (
        <div className="bg-cta/10 border border-cta/30 rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
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
            {autoDiscountAmount > 0 && autoDiscount?.type && (
              <div className="flex justify-between text-sm">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  autoDiscount.type === 'early-bird'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {autoDiscount.type === 'early-bird' ? t.booking.earlyBirdDiscount : t.booking.flashDealDiscount}
                </span>
                <span className="font-medium text-green-600">-{autoDiscountAmount}€</span>
              </div>
            )}
            {discount > 0 && validatedCode && (
              <div className="flex justify-between text-sm text-foreground">
                <span>{validatedCode.code}</span>
                <span>-{discount}€</span>
              </div>
            )}
            <div className="flex justify-between items-baseline border-t border-cta/30 pt-2 mt-2">
              <span className="text-sm font-bold text-foreground">{t.endowment?.yourPrice || 'Total'}</span>
              <span className="text-xl font-bold text-foreground">
                {price + totalExtrasPrice - discount - autoDiscountAmount}€
              </span>
            </div>
            {depositAmount && (
              <div className="flex justify-between text-sm mt-2 pt-2 border-t border-cta/20 border-dashed">
                <span className="text-muted-foreground/70">
                  {t.pricing?.depositLabel || 'Fianza'} ({t.pricing?.depositRefundable || 'reembolsable'})
                </span>
                <span className="font-medium text-muted-foreground">{depositAmount}€</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground/70 mt-2">{t.booking.priceConfirmedWhatsApp}</p>
          {depositAmount && (
            <p className="text-xs text-muted-foreground/50 mt-0.5">
              {t.pricing?.payAtPort || 'Se paga y devuelve en el puerto'}
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
        {t.booking.gdprPassive?.split('{privacyPolicy}')[0] || 'Al enviar esta solicitud, aceptas nuestra '}
        <a href={localizedPath("privacyPolicy")} target="_blank" rel="noopener noreferrer" className="text-foreground underline hover:text-foreground/80">
          {t.booking.gdprPrivacyLink}
        </a>
        {(t.booking.gdprPassive?.split('{privacyPolicy}')[1] || ' y ').split('{termsAndConditions}')[0]}
        <a href={localizedPath("condicionesGenerales")} target="_blank" rel="noopener noreferrer" className="text-foreground underline hover:text-foreground/80">
          {t.booking.gdprTermsLink}
        </a>
        {(t.booking.gdprPassive?.split('{privacyPolicy}')[1] || '').split('{termsAndConditions}')[1] || '.'}
      </p>
    </div>
  );
}
