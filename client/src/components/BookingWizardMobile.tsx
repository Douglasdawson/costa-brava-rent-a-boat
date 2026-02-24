import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Check, ChevronDown, ChevronLeft, ChevronUp, Gift, Loader2, Package, Tag, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { SiWhatsapp } from "react-icons/si";
import type { Boat } from "@shared/schema";
import { EXTRA_PACKS } from "@shared/boatData";
import type { Translations } from "@/lib/translations";

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
  getDurationOptions: () => { value: string; label: string }[];
  getMaxCapacity: () => number;
  getLocalISODate: () => string;
  preSelectedBoatId?: string;
  timeSlots: string[];
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
  handleBookingSearch: () => void;
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
}

function ProgressBar({ currentStep, t }: { currentStep: number; t: Translations }) {
  const stepLabels = [t.wizard.stepBoat, t.wizard.stepTrip, t.wizard.stepYourData, t.wizard.stepConfirm];
  return (
    <nav aria-label="Pasos del formulario de reserva">
      <ol className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        {stepLabels.map((label, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;
          return (
            <li key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isCompleted
                      ? "bg-primary text-white"
                      : isActive
                      ? "bg-primary text-white ring-4 ring-primary/20"
                      : "bg-gray-200 text-gray-500"
                  }`}
                  aria-label={`Paso ${stepNum}: ${label}${isCompleted ? " (completado)" : isActive ? " (actual)" : ""}`}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : stepNum}
                </div>
                <span
                  className={`text-[11px] mt-1 font-medium ${
                    isActive ? "text-primary" : "text-gray-500"
                  }`}
                  aria-hidden="true"
                >
                  {label}
                </span>
              </div>
              {idx < stepLabels.length - 1 && (
                <div
                  className={`h-0.5 w-8 mx-1 mb-4 transition-colors ${
                    isCompleted ? "bg-primary" : "bg-gray-200"
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default function BookingWizardMobile(props: BookingWizardMobileProps) {
  const { currentStep, onNext, onBack, handleBookingSearch } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [displayStep, setDisplayStep] = useState(currentStep);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const prevStepRef = useRef(currentStep);

  useEffect(() => {
    if (currentStep !== prevStepRef.current) {
      setDirection(currentStep > prevStepRef.current ? "forward" : "back");
      setAnimating(true);
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
    <div className="flex flex-col h-full" role="form" aria-label="Formulario de reserva">
      <ProgressBar currentStep={currentStep} t={props.t} />
      <div className="flex-1 overflow-y-auto px-4 py-4">
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
      <div className="border-t border-gray-100 bg-white px-4 py-3 flex gap-3">
        {currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            aria-label={`Volver al paso anterior (${currentStep - 1} de 4)`}
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
            aria-label={`Continuar al paso ${currentStep + 1} de 4`}
            className="flex-1 py-5 text-sm font-semibold active:scale-95 transition-transform"
          >
            {props.t.booking.next}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => {
              setIsSubmitting(true);
              handleBookingSearch();
              // Reset after WhatsApp opens (or validation fails)
              setTimeout(() => setIsSubmitting(false), 1200);
            }}
            disabled={isSubmitting || props.isValidatingCode}
            aria-label="Enviar solicitud de reserva por WhatsApp"
            className="flex-1 py-5 text-sm font-semibold bg-[#25D366] hover:bg-[#1ebe5d] text-white border-0"
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
  );
}

function Step1Boat({
  licenseFilter, setLicenseFilter,
  selectedBoat, setSelectedBoat,
  selectedDate, setSelectedDate,
  filteredBoats,
  isBoatsLoading,
  preSelectedBoatId,
  getLocalISODate,
  showFieldError, getFieldError, handleBlur,
  t,
}: BookingWizardMobileProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);

  function handleBoatSelect(boatId: string) {
    setSelectedBoat(boatId);
    setTimeout(() => dateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">{t.wizard.chooseYourBoat}</h2>
        <p className="text-sm text-gray-500">{t.wizard.haveNauticalLicense}</p>
      </div>
      {!preSelectedBoatId && (
        <div role="group" aria-label="Filtrar por licencia náutica" className="flex gap-2">
          <button
            type="button"
            role="radio"
            aria-checked={licenseFilter === "without"}
            onClick={() => setLicenseFilter("without")}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
              licenseFilter === "without"
                ? "border-primary bg-primary text-white"
                : "border-gray-200 text-gray-600"
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
                : "border-gray-200 text-gray-600"
            }`}
          >
            {t.wizard.withLicense}
          </button>
        </div>
      )}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {t.wizard.selectABoat}
        </label>
        <div role="radiogroup" aria-label={t.wizard.selectABoat} className="space-y-2">
          {isBoatsLoading && (
            // Skeleton loading while boats load from API
            <>
              {[1, 2, 3].map(i => (
                <div key={i} className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 animate-pulse">
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1.5" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-12" />
                </div>
              ))}
            </>
          )}
          {filteredBoats.map((boat) => {
            const firstSeason = boat.pricing ? Object.values(boat.pricing)[0] : null;
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
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  selectedBoat === boat.id ? "border-primary bg-primary" : "border-gray-300"
                }`}>
                  {selectedBoat === boat.id
                    ? <Check className="w-3 h-3 text-white" />
                    : null
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{boat.name}</p>
                  {minPrice !== null && (
                    <p className="text-xs text-primary font-medium">
                      {t.boats.from} {minPrice}€
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">
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
      <div ref={dateRef}>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {t.wizard.date}
        </label>
        <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
          <PopoverTrigger asChild>
            <button
              type="button"
              onBlur={() => handleBlur('date')}
              className={`w-full flex items-center gap-2 p-3 border-2 rounded-xl bg-white text-left font-medium text-sm transition-all focus:ring-2 focus:ring-primary focus:outline-none ${
                showFieldError('date') ? 'border-red-500 text-red-500' : 'border-gray-200 text-gray-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4 text-primary flex-shrink-0" />
              {selectedDate
                ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                : <span className="text-gray-400">{t.wizard.selectDate}</span>
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
      </div>
    </div>
  );
}

function Step2Trip({
  selectedDuration, setSelectedDuration,
  preferredTime, setPreferredTime,
  numberOfPeople, setNumberOfPeople,
  selectedBoatInfo,
  getDurationOptions, getMaxCapacity,
  timeSlots,
  showFieldError, getFieldError, handleBlur,
  t,
}: BookingWizardMobileProps) {
  const durationOptions = getDurationOptions();
  const maxCapacity = getMaxCapacity();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">{t.wizard.yourTrip}</h2>
        <p className="text-sm text-gray-500">{t.wizard.howLongHowMany}</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">{t.wizard.duration}</label>
        <div className="space-y-2">
          {durationOptions.map((opt) => {
            const parts = opt.label.split(' - ');
            const lastPart = parts[parts.length - 1];
            const hasPrice = parts.length > 1 && lastPart.includes('€');
            const labelText = hasPrice ? parts.slice(0, -1).join(' · ') : opt.label;
            const priceText = hasPrice ? lastPart : null;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedDuration(opt.value)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all ${
                  selectedDuration === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 bg-white"
                }`}
              >
                <span className="text-sm font-medium text-gray-900">{labelText}</span>
                {priceText && (
                  <span className="text-xs font-bold text-primary">{priceText}</span>
                )}
              </button>
            );
          })}
        </div>
        {showFieldError('duration') && (
          <p className="text-xs text-red-500 mt-1">{getFieldError('duration')}</p>
        )}
      </div>
      <div>
        <label htmlFor="wizard-time" className="block text-sm font-semibold text-gray-700 mb-2">
          {t.wizard.departureTime}
        </label>
        <select
          id="wizard-time"
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value)}
          onBlur={() => handleBlur('time')}
          className={`w-full p-3 border-2 rounded-xl text-gray-900 font-medium text-sm focus:ring-2 focus:ring-primary bg-white ${
            showFieldError('time') ? 'border-red-500' : 'border-gray-200'
          }`}
        >
          <option value="">{t.wizard.selectTime}</option>
          {timeSlots.map((time) => (
            <option key={time} value={time}>{time}h</option>
          ))}
        </select>
        {showFieldError('time') && (
          <p className="text-xs text-red-500 mt-1">{getFieldError('time')}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {t.wizard.numberOfPeople}
          {selectedBoatInfo && (
            <span className="font-normal text-gray-500 ml-1">(max. {maxCapacity})</span>
          )}
        </label>
        <div className={`flex items-center justify-between border-2 rounded-xl bg-white px-4 py-2 ${
          showFieldError('people') ? 'border-red-500' : 'border-gray-200'
        }`}>
          <button
            type="button"
            onClick={() => {
              const current = parseInt(numberOfPeople || '1');
              if (current > 1) { setNumberOfPeople(String(current - 1)); handleBlur('people'); }
            }}
            disabled={!numberOfPeople || parseInt(numberOfPeople) <= 1}
            className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-xl font-bold text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
            aria-label="Reducir número de personas"
          >
            −
          </button>
          <span className="text-2xl font-bold text-gray-900 min-w-[2rem] text-center">
            {numberOfPeople || '1'}
          </span>
          <button
            type="button"
            onClick={() => {
              const current = parseInt(numberOfPeople || '1');
              if (current < maxCapacity) { setNumberOfPeople(String(current + 1)); handleBlur('people'); }
            }}
            disabled={!!numberOfPeople && parseInt(numberOfPeople) >= maxCapacity}
            className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-xl font-bold text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
            aria-label="Aumentar número de personas"
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
        <h2 className="text-xl font-bold text-gray-900 mb-1">{t.wizard.yourData}</h2>
        <p className="text-sm text-gray-500">{t.wizard.confirmViaWhatsApp}</p>
      </div>
      <div>
        <label htmlFor="wizard-firstname" className="block text-sm font-semibold text-gray-700 mb-1">
          {t.wizard.firstName}
        </label>
        <input
          type="text"
          id="wizard-firstname"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          onBlur={() => handleBlur('firstName')}
          placeholder="Juan"
          autoComplete="given-name"
          className={`w-full p-3 border-2 rounded-xl bg-white text-gray-900 font-medium text-sm focus:ring-2 focus:ring-primary ${
            showFieldError('firstName') ? 'border-red-500' : 'border-gray-200'
          }`}
        />
        {showFieldError('firstName') && (
          <p className="text-xs text-red-500 mt-1">{getFieldError('firstName')}</p>
        )}
      </div>
      <div>
        <label htmlFor="wizard-lastname" className="block text-sm font-semibold text-gray-700 mb-1">
          {t.wizard.lastName}
        </label>
        <input
          type="text"
          id="wizard-lastname"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          onBlur={() => handleBlur('lastName')}
          placeholder="Garcia Lopez"
          autoComplete="family-name"
          className={`w-full p-3 border-2 rounded-xl bg-white text-gray-900 font-medium text-sm focus:ring-2 focus:ring-primary ${
            showFieldError('lastName') ? 'border-red-500' : 'border-gray-200'
          }`}
        />
        {showFieldError('lastName') && (
          <p className="text-xs text-red-500 mt-1">{getFieldError('lastName')}</p>
        )}
      </div>
      <div>
        <label htmlFor="wizard-phone" className="block text-sm font-semibold text-gray-700 mb-1">
          {t.wizard.phone}
        </label>
        <div className="flex gap-2">
          <div className="relative w-28 flex-shrink-0" ref={prefixDropdownRef}>
            <button
              type="button"
              onClick={() => setShowPrefixDropdown(!showPrefixDropdown)}
              className="w-full p-3 border-2 border-gray-200 bg-white rounded-xl text-gray-900 font-medium text-sm flex items-center gap-1"
            >
              <span>{selectedPrefixInfo?.flag} {phonePrefix}</span>
            </button>
            {showPrefixDropdown && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                <div className="p-2 border-b sticky top-0 bg-white">
                  <input
                    type="text"
                    value={prefixSearch}
                    onChange={(e) => setPrefixSearch(e.target.value)}
                    placeholder={t.wizard.searchCountry}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm"
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
                    className="w-full p-2.5 hover:bg-gray-50 text-left flex items-center gap-2 text-sm"
                  >
                    <span>{prefix.flag}</span>
                    <span className="font-medium">{prefix.code}</span>
                    <span className="text-gray-500 text-xs truncate">{prefix.country}</span>
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
            className={`flex-1 p-3 border-2 rounded-xl bg-white text-gray-900 font-medium text-sm focus:ring-2 focus:ring-primary ${
              showFieldError('phone') ? 'border-red-500' : 'border-gray-200'
            }`}
          />
        </div>
        {showFieldError('phone') && (
          <p className="text-xs text-red-500 mt-1">{getFieldError('phone')}</p>
        )}
      </div>
      <div>
        <label htmlFor="wizard-email" className="block text-sm font-semibold text-gray-700 mb-1">
          {t.wizard.email}
        </label>
        <input
          type="email"
          id="wizard-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => handleBlur('email')}
          onKeyDown={(e) => { if (e.key === 'Enter') onNext(); }}
          placeholder="tu@email.com"
          autoComplete="email"
          className={`w-full p-3 border-2 rounded-xl bg-white text-gray-900 font-medium text-sm focus:ring-2 focus:ring-primary ${
            showFieldError('email') ? 'border-red-500' : 'border-gray-200'
          }`}
        />
        {showFieldError('email') && (
          <p className="text-xs text-red-500 mt-1">{getFieldError('email')}</p>
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
  firstName, lastName,
  boatExtras, selectedExtras, selectedPack, showExtras, setShowExtras,
  extrasInPack, totalExtrasPrice, handlePackSelect, handleExtraToggle,
  showCodeSection, setShowCodeSection, codeInput, setCodeInput,
  isValidatingCode, validatedCode, codeError, handleValidateCode, handleRemoveCode,
  getCodeDiscount, getBookingPrice,
  calculatePackSavings, iconMap,
  t, isSpanishLang, language,
}: BookingWizardMobileProps) {
  const basePrice = getBookingPrice();
  const discount = getCodeDiscount();
  const boatExtraNames = new Set(boatExtras.map(e => e.name));
  const availablePacks = EXTRA_PACKS.filter(pack =>
    pack.extras.every(name => boatExtraNames.has(name))
  );
  const total = basePrice !== null ? basePrice + totalExtrasPrice - discount : null;

  return (
    <div className="space-y-5 pb-2">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">{t.booking.confirmTitle}</h2>
        <p className="text-sm text-gray-500">{t.booking.confirmSubtitle}</p>
      </div>
      {/* Booking summary card */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t.booking.boat}</span>
          <span className="font-semibold text-gray-900">{selectedBoatInfo?.name || "--"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t.booking.date}</span>
          <span className="font-semibold text-gray-900">{formatBookingDate(selectedDate, language)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t.booking.preferredTime}</span>
          <span className="font-semibold text-gray-900">{preferredTime}h</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t.booking.duration}</span>
          <span className="font-semibold text-gray-900">{selectedDuration}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t.booking.people}</span>
          <span className="font-semibold text-gray-900">{numberOfPeople}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t.booking.summaryClient}</span>
          <span className="font-semibold text-gray-900">{firstName} {lastName}</span>
        </div>
        {basePrice !== null && (
          <div className="flex justify-between text-sm pt-2 border-t border-primary/20">
            <span className="text-gray-500">{t.booking.summaryBasePrice.replace(':', '').trim()}</span>
            <span className="font-bold text-primary text-base">{basePrice}€</span>
          </div>
        )}
      </div>
      {/* Extras & Packs collapsible section */}
      {boatExtras.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowExtras(!showExtras)}
            className="w-full flex items-center justify-between p-4 text-sm font-semibold text-gray-800 bg-gray-50"
          >
            <span className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              {t.booking.extrasSection.title}
              {(selectedExtras.length > 0 || selectedPack) && (
                <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">
                  {totalExtrasPrice}€
                </span>
              )}
            </span>
            {showExtras ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showExtras && (
            <div className="p-4 space-y-4 bg-white">
              {/* Packs */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.booking.extrasSection.packs}</p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handlePackSelect("")}
                    className={`w-full p-3 rounded-xl border-2 text-left text-sm transition-all ${!selectedPack ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
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
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComp className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold">{isSpanishLang ? pack.name : pack.nameEN}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-primary">{pack.price}€</span>
                            {savings > 0 && (
                              <span className="block text-[10px] text-green-600">{t.booking.extrasSection.savings} {savings.toFixed(0)}€</span>
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
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.booking.extrasSection.individual}</p>
                <div className="grid grid-cols-2 gap-2">
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
                        className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all ${
                          isInPack ? 'border-primary/40 bg-primary/10 opacity-75 cursor-not-allowed'
                          : isChecked ? 'border-primary bg-primary/5'
                          : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${(isChecked || isInPack) ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                          {(isChecked || isInPack) && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{extra.name}</p>
                          <p className="text-[10px] text-gray-500">{isInPack ? t.booking.extrasSection.included : extra.price}</p>
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
      {/* Discount / gift card code section */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowCodeSection(!showCodeSection)}
          className="w-full flex items-center justify-between p-4 text-sm font-semibold text-gray-800 bg-gray-50"
        >
          <span className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            {t.codeValidation.haveCode}
            {validatedCode && (
              <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full">{t.codeValidation.applied}</span>
            )}
          </span>
          {showCodeSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showCodeSection && (
          <div className="p-4 bg-white">
            {!validatedCode ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder={t.codeValidation.enterCode}
                    className="flex-1 p-3 bg-white text-gray-900 border-2 border-gray-200 rounded-xl text-sm font-mono uppercase tracking-wider"
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
                    <p className="text-[11px] text-gray-500 font-mono">{validatedCode.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-green-600">
                    {validatedCode.type === "gift_card" ? `-${discount}€` : `-${validatedCode.percentage}%`}
                  </span>
                  <button type="button" onClick={handleRemoveCode} className="text-gray-400 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Total price card */}
      {total !== null && (
        <div className="bg-primary rounded-xl p-4 text-white">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium opacity-90">{t.booking.estimatedTotal}</span>
            <span className="text-2xl font-bold">{total}€</span>
          </div>
          {discount > 0 && (
            <p className="text-xs opacity-75 mt-1">{t.booking.discountApplied}: -{discount}€</p>
          )}
          <p className="text-xs opacity-60 mt-1">{t.booking.priceConfirmedWhatsApp}</p>
        </div>
      )}
    </div>
  );
}
