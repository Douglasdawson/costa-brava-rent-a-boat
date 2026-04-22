import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Check, ChevronDown, ChevronLeft, ChevronUp, Clock, Gift, Loader2, Package, Star, Tag, Users, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import type { Boat } from "@shared/schema";
import { EXTRA_PACKS } from "@shared/boatData";
import type { Translations } from "@/lib/translations";
import BookingProgressBar from "@/components/BookingProgressBar";
import { ValueStack } from "@/components/booking-flow/ValueStack";
import { BookingTrustBanner } from "@/components/booking-flow/BookingTrustBanner";
import HoldCountdown from "@/components/HoldCountdown";
import PriceSummaryBar from "@/components/PriceSummaryBar";
import { trackWhatsAppClick } from "@/utils/analytics";
import { translateExtraName } from "@/utils/extraNameTranslations";
import { useLanguage } from "@/hooks/use-language";

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
  selectedBoat: string; setSelectedBoat: (v: string) => void;
  selectedDate: string; setSelectedDate: (v: string) => void;
  selectedDuration: string; setSelectedDuration: (v: string) => void;
  preferredTime: string; setPreferredTime: (v: string) => void;
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
      // Scroll to top of the step content
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
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
      <div className="sticky top-0 z-10 bg-background px-3 py-1.5 border-b border-border">
        <BookingProgressBar
          currentStep={currentStep}
          totalSteps={4}
          stepLabels={[
            props.t.wizard.stepBoat,
            props.selectedBoatInfo ? (props.t.endowment?.yourTrip || props.t.wizard.stepTrip) : props.t.wizard.stepTrip,
            props.selectedBoatInfo ? (props.t.endowment?.confirmStep || props.t.wizard.stepYourData) : props.t.wizard.stepYourData,
            props.selectedBoatInfo ? (props.t.endowment?.confirmStep || props.t.wizard.stepConfirm) : props.t.wizard.stepConfirm,
          ]}

        />
      </div>
      {/* Hold countdown timer — only visible on final step */}
      {props.holdExpiresAt && currentStep === 4 && (
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
        <BookingTrustBanner
          t={props.t}
          stage={currentStep <= 2 ? "step1" : currentStep === 3 ? "step2" : "step3"}
        />
        <div
          className={`transition-all duration-150 ${animClass}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {displayStep === 1 && <Step1Boat {...props} />}
          {displayStep === 2 && <Step2Trip {...props} />}
          {displayStep === 3 && <Step3PersonalData {...props} />}
          {displayStep === 4 && <Step4Confirm {...props} />}
        </div>
      </div>
      {/* Price summary bar — visible on steps 2-3 once boat + duration selected */}
      {currentStep >= 2 && currentStep <= 3 && (() => {
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
        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              aria-label={`${props.t.a11y.goBackToStep} (${currentStep - 1} ${props.t.a11y.stepOf} 4)`}
              className="flex-1 py-5 text-sm font-semibold active:scale-95 transition-transform"
            >
              <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" />
              {props.t.booking.back}
            </Button>
          )}
          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={onNext}
              aria-label={`${props.t.a11y.continueToStep} (${currentStep + 1} ${props.t.a11y.stepOf} 4)`}
              className="flex-1 py-5 text-sm font-semibold active:scale-95 transition-transform"
            >
              {props.t.booking.next}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={async () => {
                setIsSubmitting(true);
                await handleBookingSearch();
                setIsSubmitting(false);
              }}
              disabled={isSubmitting || props.isValidatingCode}
              aria-label={props.t.a11y.submitBookingWhatsApp}
              aria-busy={isSubmitting || props.isValidatingCode}
              className="flex-1 py-5 text-sm font-semibold bg-[#25D366] hover:bg-[#1ebe5d] text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || props.isValidatingCode
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                : <SiWhatsapp className="w-4 h-4 mr-2" aria-hidden="true" />
              }
              {props.t.booking.sendBookingRequest}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Step1Boat({
  licenseFilter, setLicenseFilter,
  selectedBoat, setSelectedBoat,
  filteredBoats,
  isBoatsLoading,
  preSelectedBoatId,
  showFieldError, getFieldError,
  t,
}: BookingWizardMobileProps) {
  function handleBoatSelect(boatId: string) {
    setSelectedBoat(boatId);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">{t.wizard.chooseYourBoat}</h2>
        <p className="text-sm text-muted-foreground/60">{t.wizard.haveNauticalLicense}</p>
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
      <div>
        <label className="block text-sm font-semibold text-muted-foreground mb-2">
          {t.wizard.selectABoat}
        </label>
        <div role="radiogroup" aria-label={t.wizard.selectABoat} className="space-y-2">
          {isBoatsLoading && (
            // Skeleton loading while boats load from API
            <>
              {[1, 2, 3].map(i => (
                <div key={i} className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-border animate-pulse">
                  <div className="w-5 h-5 rounded-full bg-muted flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-1.5" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                  <div className="h-3 bg-muted rounded w-12" />
                </div>
              ))}
            </>
          )}
          {filteredBoats.map((boat) => {
            const firstSeason = boat.pricing?.BAJA ?? (boat.pricing ? Object.values(boat.pricing)[0] : null);
            const minPrice = firstSeason?.prices
              ? Math.min(...(Object.values(firstSeason.prices) as number[]))
              : null;
            return (
              <button
                key={boat.id}
                type="button"
                role="radio"
                aria-checked={selectedBoat === boat.id}
                onClick={() => handleBoatSelect(boat.id)}
                disabled={!!preSelectedBoatId && boat.id !== preSelectedBoatId}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all active:scale-[0.97] ${
                  selectedBoat === boat.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background"
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  selectedBoat === boat.id ? "border-primary bg-primary" : "border-border"
                }`}>
                  {selectedBoat === boat.id
                    ? <Check className="w-3 h-3 text-white" />
                    : null
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{boat.name}</p>
                  {minPrice !== null && (
                    <p className="text-xs text-primary font-medium">
                      {t.boats.from} {minPrice}€
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground/60 flex-shrink-0">
                  {boat.capacity} pers.
                </span>
              </button>
            );
          })}
        </div>
        {showFieldError('boat') && (
          <p className="text-xs text-red-500 mt-1">{getFieldError('boat')}</p>
        )}
      </div>
    </div>
  );
}

function Step2Trip({
  selectedDate, setSelectedDate,
  selectedDuration, setSelectedDuration,
  preferredTime, setPreferredTime,
  numberOfPeople, setNumberOfPeople,
  selectedBoatInfo,
  getDurationOptions, getMaxCapacity,
  getLocalISODate,
  timeSlots,
  unavailableTimeSlots,
  selectedTimeMaxDuration,
  showFieldError, getFieldError, handleBlur,
  t,
  nextSaturdayISO,
  language,
}: BookingWizardMobileProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const durationOptions = getDurationOptions();
  const maxCapacity = getMaxCapacity();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">
          {selectedBoatInfo
            ? (t.endowment?.yourTripIn || 'Tu viaje en {boat}').replace('{boat}', selectedBoatInfo.name)
            : t.wizard.yourTrip}
        </h2>
        <p className="text-sm text-muted-foreground/60">{t.wizard.howLongHowMany}</p>
      </div>
      {/* Date picker — moved from step 1 */}
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
                showFieldError('date') ? 'border-red-500 text-red-500' : 'border-border text-foreground'
              }`}
            >
              <CalendarIcon className="w-4 h-4 text-primary flex-shrink-0" />
              {selectedDate
                ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                : <span className="text-muted-foreground/60">{t.wizard.selectDate}</span>
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
        {showFieldError('date') && (
          <p className="text-xs text-red-500 mt-1">{getFieldError('date')}</p>
        )}
        {!selectedDate && nextSaturdayISO && (
          <p className="text-xs text-muted-foreground/60 mt-1.5">
            {t.wizard.suggestedDate}: {new Date(nextSaturdayISO + 'T12:00:00').toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        )}
      </div>
      {/* Time — shown before duration so maxDuration can filter durations */}
      <div id="field-time">
        <label htmlFor="wizard-time" className="block text-sm font-semibold text-muted-foreground mb-2">
          {t.wizard.departureTime}
        </label>
        <select
          id="wizard-time"
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value)}
          onBlur={() => handleBlur('time')}
          aria-required="true"
          aria-invalid={showFieldError('time') ? "true" : "false"}
          aria-describedby={showFieldError('time') ? "error-wizard-time" : undefined}
          className={`w-full p-3 border-2 rounded-xl text-foreground font-medium text-base focus:ring-2 focus:ring-primary focus:outline-none bg-background ${
            showFieldError('time') ? 'border-red-500' : 'border-border'
          }`}
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
        {showFieldError('time') && (
          <p id="error-wizard-time" className="text-xs text-red-500 mt-1">{getFieldError('time')}</p>
        )}
      </div>
      <div id="field-duration">
        <label className="block text-sm font-semibold text-muted-foreground mb-2">{t.wizard.duration}</label>
        <div className="space-y-2">
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
              const lastPart = parts[parts.length - 1];
              const hasPrice = parts.length > 1 && lastPart.includes('€');
              const labelText = hasPrice ? parts.slice(0, -1).join(' · ') : opt.label;
              const priceText = hasPrice ? lastPart : null;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && setSelectedDuration(opt.value)}
                  title={isSeasonRestricted ? opt.disabledReason : undefined}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all ${
                    isDisabled
                      ? "border-border bg-muted opacity-50 cursor-not-allowed"
                      : selectedDuration === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background"
                  }`}
                >
                  <span className="flex flex-col">
                    <span className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${isDisabled ? "text-muted-foreground/60 line-through" : "text-foreground"}`}>{labelText}</span>
                      {opt.value === "4h" && !isDisabled && (
                        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wide">{t.wizard.mostPopular}</span>
                      )}
                      {opt.value === bestValueId && (
                        <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                          {t.neuro?.bestValue || 'Mejor valor'}
                        </span>
                      )}
                    </span>
                    {opt.price && !isDisabled && (
                      <span className="text-[10px] text-muted-foreground/60 block">
                        {(opt.price / parseFloat(opt.value)).toFixed(0)}{t.neuro?.perHour || '/hora'} · {Math.ceil(opt.price / parseFloat(opt.value) / maxCapacity)}/{t.boats?.perPerson || 'pers.'}
                      </span>
                    )}
                  </span>
                  {isDisabled ? (
                    <span className="text-xs text-amber-600 font-medium">{opt.disabledReason || t.boats.notAvailable}</span>
                  ) : priceText ? (
                    <span className="text-xs font-bold text-primary">{priceText}</span>
                  ) : null}
                </button>
              );
            });
          })()}
        </div>
        {showFieldError('duration') && (
          <p className="text-xs text-red-500 mt-1">{getFieldError('duration')}</p>
        )}
      </div>
      <div id="field-people">
        <label className="block text-sm font-semibold text-muted-foreground mb-2">
          {t.wizard.numberOfPeople}
          {selectedBoatInfo && (
            <span className="font-normal text-muted-foreground/60 ml-1">(max. {maxCapacity})</span>
          )}
        </label>
        <div className={`flex items-center justify-between border-2 rounded-xl bg-background px-4 py-2 ${
          showFieldError('people') ? 'border-red-500' : 'border-border'
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
              if (current < maxCapacity) { setNumberOfPeople(String(current + 1)); handleBlur('people'); }
            }}
            disabled={!!numberOfPeople && parseInt(numberOfPeople) >= maxCapacity}
            className="w-11 h-11 rounded-full border-2 border-border flex items-center justify-center text-xl font-bold text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
            aria-label={t.a11y.increasePeople}
          >
            +
          </button>
        </div>
        {showFieldError('people') && (
          <p className="text-xs text-red-500 mt-1">{getFieldError('people')}</p>
        )}
      </div>
    </div>
  );
}

function Step3PersonalData({
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
  showFieldError, getFieldError, handleBlur,
  onNext,
  t,
}: BookingWizardMobileProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">{t.endowment?.confirmYourBooking || t.wizard.yourData}</h2>
        <p className="text-sm text-muted-foreground/60">{t.wizard.confirmViaWhatsApp}</p>
      </div>
      <div>
        <label htmlFor="wizard-firstname" className="block text-sm font-semibold text-muted-foreground mb-1">
          {t.wizard.firstName}
        </label>
        <input
          type="text"
          id="wizard-firstname"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          onBlur={() => handleBlur('firstName')}
          placeholder=""
          autoComplete="given-name"
          maxLength={100}
          aria-required="true"
          aria-invalid={showFieldError('firstName') ? "true" : "false"}
          aria-describedby={showFieldError('firstName') ? "error-wizard-firstname" : undefined}
          className={`w-full p-3 border-2 rounded-xl bg-background text-foreground font-medium text-base focus:ring-2 focus:ring-primary ${
            showFieldError('firstName') ? 'border-red-500' : 'border-border'
          }`}
        />
        {showFieldError('firstName') && (
          <p id="error-wizard-firstname" className="text-xs text-red-500 mt-1">{getFieldError('firstName')}</p>
        )}
      </div>
      <div>
        <label htmlFor="wizard-lastname" className="block text-sm font-semibold text-muted-foreground mb-1">
          {t.wizard.lastName}
        </label>
        <input
          type="text"
          id="wizard-lastname"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          onBlur={() => handleBlur('lastName')}
          placeholder=""
          autoComplete="family-name"
          maxLength={100}
          aria-required="true"
          aria-invalid={showFieldError('lastName') ? "true" : "false"}
          aria-describedby={showFieldError('lastName') ? "error-wizard-lastname" : undefined}
          className={`w-full p-3 border-2 rounded-xl bg-background text-foreground font-medium text-base focus:ring-2 focus:ring-primary ${
            showFieldError('lastName') ? 'border-red-500' : 'border-border'
          }`}
        />
        {showFieldError('lastName') && (
          <p id="error-wizard-lastname" className="text-xs text-red-500 mt-1">{getFieldError('lastName')}</p>
        )}
      </div>
      <div>
        <label htmlFor="wizard-phone" className="block text-sm font-semibold text-muted-foreground mb-1">
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
              className="w-full p-3 border-2 border-border bg-background rounded-xl text-foreground font-medium text-base flex items-center gap-1 overflow-hidden"
            >
              <span className="truncate">{selectedPrefixInfo?.flag} {phonePrefix}</span>
            </button>
            {showPrefixDropdown && (
              <div className="absolute top-full left-0 mt-1 w-72 max-w-[calc(100vw-2rem)] bg-background border border-border rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
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
                    <span className="text-muted-foreground/60 text-xs truncate">{prefix.country}</span>
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
            className={`flex-1 p-3 border-2 rounded-xl bg-background text-foreground font-medium text-base focus:ring-2 focus:ring-primary ${
              showFieldError('phone') ? 'border-red-500' : 'border-border'
            }`}
          />
        </div>
        {showFieldError('phone') && (
          <p id="error-wizard-phone" className="text-xs text-red-500 mt-1">{getFieldError('phone')}</p>
        )}
      </div>
      <div>
        <label htmlFor="wizard-email" className="block text-sm font-semibold text-muted-foreground mb-1">
          {t.wizard.email}
        </label>
        <input
          type="email"
          id="wizard-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => handleBlur('email')}
          onKeyDown={(e) => { if (e.key === 'Enter') onNext(); }}
          placeholder="email@example.com"
          autoComplete="email"
          maxLength={254}
          aria-required="true"
          aria-invalid={showFieldError('email') ? "true" : "false"}
          aria-describedby={showFieldError('email') ? "error-wizard-email" : undefined}
          className={`w-full p-3 border-2 rounded-xl bg-background text-foreground font-medium text-base focus:ring-2 focus:ring-primary ${
            showFieldError('email') ? 'border-red-500' : 'border-border'
          }`}
        />
        {showFieldError('email') && (
          <p id="error-wizard-email" className="text-xs text-red-500 mt-1">{getFieldError('email')}</p>
        )}
      </div>
    </div>
  );
}

const LOCALE_MAP: Record<string, string> = {
  es: 'es-ES', ca: 'ca-ES', en: 'en-GB', fr: 'fr-FR',
  de: 'de-DE', nl: 'nl-NL', it: 'it-IT', ru: 'ru-RU',
};

function formatBookingDate(dateStr: string, language: string): string {
  if (!dateStr) return '--';
  try {
    const date = new Date(dateStr + 'T12:00:00');
    const locale = LOCALE_MAP[language] || 'es-ES';
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function Step4Confirm({
  selectedBoatInfo, selectedDate, selectedDuration, preferredTime, numberOfPeople,
  firstName, lastName, onGoToStep,
  boatExtras, selectedExtras, selectedPack, showExtras, setShowExtras,
  extrasInPack, totalExtrasPrice, handlePackSelect, handleExtraToggle,
  showCodeSection, setShowCodeSection, codeInput, setCodeInput,
  isValidatingCode, validatedCode, codeError, handleValidateCode, handleRemoveCode,
  getCodeDiscount, getBookingPrice, autoDiscount,
  calculatePackSavings, iconMap,
  privacyConsent, setPrivacyConsent,
  t, isSpanishLang, language,
}: BookingWizardMobileProps) {
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
    <div className="space-y-5 pb-2">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">
          {selectedBoatInfo
            ? (t.endowment?.customizeExperience || t.booking.confirmTitle)
            : t.booking.confirmTitle}
        </h2>
        <p className="text-sm text-muted-foreground/60">{t.booking.confirmSubtitle}</p>
      </div>
      {/* Extras & Packs collapsible section */}
      {boatExtras.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowExtras(!showExtras)}
            aria-expanded={showExtras}
            aria-controls="extras-panel"
            className="w-full flex items-center justify-between p-4 text-sm font-semibold text-muted-foreground bg-muted"
          >
            <span className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              {t.endowment?.customizeExperience || t.booking.extrasSection.title}
              {(selectedExtras.length > 0 || selectedPack) && (
                <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                  {totalExtrasPrice}€
                </span>
              )}
            </span>
            {showExtras ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showExtras && (
            <div id="extras-panel" className="p-4 space-y-4 bg-background">
              {/* Packs */}
              <div>
                <p className="text-sm font-semibold text-muted-foreground/60 uppercase tracking-wide mb-2">{t.booking.extrasSection.packs}</p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handlePackSelect("")}
                    aria-pressed={!selectedPack}
                    className={`w-full p-3 rounded-xl border-2 text-left text-sm transition-all ${!selectedPack ? 'border-primary bg-primary/5' : 'border-border'}`}
                  >
                    {t.booking.extrasSection.noPack}
                  </button>
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
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComp className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold">{isSpanishLang ? pack.name : pack.nameEN}</span>
                            <span className="text-xs text-muted-foreground/60 font-normal">{pack.extras.join(', ')}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-primary">{pack.price}€</span>
                            {savings > 0 && (
                              <span className="block text-xs text-green-600">{t.booking.extrasSection.savings} {savings.toFixed(0)}€</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Individual extras */}
              <div>
                <p className="text-sm font-semibold text-muted-foreground/60 uppercase tracking-wide mb-2">{t.booking.extrasSection.individual}</p>
                <div className="grid grid-cols-1 gap-2">
                  {boatExtras.map((extra) => {
                    const isChecked = selectedExtras.includes(extra.name);
                    const isInPack = extrasInPack.has(extra.name);
                    const IconComp = iconMap[extra.icon] || Package;
                    return (
                      <button
                        key={extra.name}
                        type="button"
                        onClick={() => handleExtraToggle(extra.name)}
                        disabled={isInPack}
                        aria-pressed={isChecked || isInPack}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all ${
                          isInPack ? 'border-primary/40 bg-primary/10 opacity-75 cursor-not-allowed'
                          : isChecked ? 'border-primary bg-primary/5'
                          : 'border-border bg-background'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${(isChecked || isInPack) ? 'border-primary bg-primary' : 'border-border'}`}>
                          {(isChecked || isInPack) && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-muted-foreground truncate">{translateExtraName(extra.name, language)}</p>
                          <p className="text-xs text-muted-foreground/60">{isInPack ? t.booking.extrasSection.included : extra.price}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Booking summary card */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide">
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
          <span className="text-muted-foreground/60">{t.booking.boat}</span>
          <span className="font-semibold text-foreground">
            {selectedBoatInfo?.name || "--"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground/60">{t.booking.date}</span>
          <span className="font-semibold text-foreground">{formatBookingDate(selectedDate, language)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground/60">{t.booking.preferredTime}</span>
          <span className="font-semibold text-foreground">{preferredTime}h</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground/60">{t.booking.duration}</span>
          <span className="font-semibold text-foreground">{selectedDuration}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground/60">{t.booking.people}</span>
          <span className="font-semibold text-foreground">{numberOfPeople}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground/60">{t.booking.summaryClient}</span>
          <span className="font-semibold text-foreground">{firstName} {lastName}</span>
        </div>
        {basePrice !== null && (
          <div className="flex justify-between text-sm pt-2 border-t border-primary/20">
            <span className="text-muted-foreground/60">{t.booking.summaryBasePrice.replace(':', '').trim()}</span>
            <span className="font-bold text-primary text-base">{basePrice}€</span>
          </div>
        )}
        {autoDiscount?.type && autoDiscountAmount > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              autoDiscount.type === 'early-bird'
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'
            }`}>
              {autoDiscount.type === 'early-bird' ? t.booking.earlyBirdDiscount : t.booking.flashDealDiscount}
            </span>
            <span className="font-semibold text-green-600">-{autoDiscountAmount}€</span>
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
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">{t.codeValidation.applied}</span>
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
                {codeError && <p className="text-xs text-red-500">{codeError}</p>}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  {validatedCode.type === "gift_card" ? <Gift className="w-4 h-4 text-green-600" /> : <Tag className="w-4 h-4 text-green-600" />}
                  <div>
                    <p className="text-xs font-semibold text-green-700">
                      {validatedCode.type === "gift_card"
                        ? t.codeValidation.validGiftCard
                        : t.codeValidation.validDiscount}
                    </p>
                    <p className="text-xs text-muted-foreground/60 font-mono">{validatedCode.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-green-600">
                    {validatedCode.type === "gift_card" ? `-${discount}€` : `-${validatedCode.percentage}%`}
                  </span>
                  <button type="button" onClick={handleRemoveCode} className="text-muted-foreground/60 p-2 -m-1 min-w-[44px] min-h-[44px] flex items-center justify-center">
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
            <p className="text-sm opacity-60 mt-2">{t.booking.priceConfirmedWhatsApp}</p>
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
      <p className="text-xs text-muted-foreground/60 leading-relaxed text-center">
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
