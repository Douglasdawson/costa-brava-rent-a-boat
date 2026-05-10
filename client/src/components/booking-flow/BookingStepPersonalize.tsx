import { useState, useRef, useCallback } from "react";
import { parseMadridLocal } from "@/lib/madridTz";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Minus, ArrowLeft, TrendingUp } from "lucide-react";
import { trackAddShippingInfo, trackGenerateLead } from "@/utils/analytics";
import type { Translations } from "@/lib/translations";
import type { PhonePrefix } from "@/utils/phone-prefixes";
import type { Boat } from "@shared/schema";
import type { Extra, CustomerData } from "./types";
import { usePricingOverrideForDate } from "./usePricingOverrideForDate";

interface BookingStepPersonalizeProps {
  // Extras
  availableExtras: Extra[];
  extras: Record<string, number>;
  updateExtra: (extraId: string, increment: boolean) => void;
  // Customer
  customerData: CustomerData;
  setCustomerData: React.Dispatch<React.SetStateAction<CustomerData>>;
  maxCapacity: number;
  phonePrefixSearch: string;
  setPhonePrefixSearch: (search: string) => void;
  showPhonePrefixDropdown: boolean;
  setShowPhonePrefixDropdown: (show: boolean) => void;
  filteredPhoneCountries: PhonePrefix[];
  nationalitySearch: string;
  setNationalitySearch: (search: string) => void;
  showNationalityDropdown: boolean;
  setShowNationalityDropdown: (show: boolean) => void;
  filteredNationalities: string[];
  // Boat info for analytics
  boatId: string;
  boatName: string;
  boatPrice: number;
  boat?: Boat;
  duration?: string;
  selectedDate?: string;
  selectedTime?: string;
  // Navigation
  setStep: (step: number) => void;
  onBack?: () => void;
  t: Translations;
}

export function BookingStepPersonalize({
  availableExtras,
  extras,
  updateExtra,
  customerData,
  setCustomerData,
  maxCapacity,
  phonePrefixSearch,
  setPhonePrefixSearch,
  showPhonePrefixDropdown,
  setShowPhonePrefixDropdown,
  filteredPhoneCountries,
  nationalitySearch,
  setNationalitySearch,
  showNationalityDropdown,
  setShowNationalityDropdown,
  filteredNationalities,
  boatId,
  boatName,
  boatPrice,
  boat,
  duration,
  selectedDate,
  selectedTime,
  setStep,
  onBack,
  t,
}: BookingStepPersonalizeProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [phonePrefixActiveIndex, setPhonePrefixActiveIndex] = useState(-1);
  const [nationalityActiveIndex, setNationalityActiveIndex] = useState(-1);
  const pricingOverride = usePricingOverrideForDate(boatId, selectedDate);

  const phonePrefixListRef = useRef<HTMLDivElement>(null);
  const nationalityListRef = useRef<HTMLDivElement>(null);

  const errors = {
    customerName: !customerData.customerName && touched.customerName,
    customerSurname: !customerData.customerSurname && touched.customerSurname,
    customerPhone: !customerData.customerPhone && touched.customerPhone,
    customerNationality: !customerData.customerNationality && touched.customerNationality,
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const isFormValid =
    customerData.customerName &&
    customerData.customerSurname &&
    customerData.customerPhone &&
    customerData.customerNationality &&
    customerData.numberOfPeople >= 1;

  const errorBorderClass = "border-red-400 focus:ring-red-400 focus:border-red-400";
  const normalBorderClass = "border-primary/20 focus:ring-primary focus:border-primary";

  const visiblePrefixes = filteredPhoneCountries.slice(0, 8);
  const visibleNationalities = filteredNationalities.slice(0, 10);

  const handlePhonePrefixKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showPhonePrefixDropdown || visiblePrefixes.length === 0) {
        if (e.key === "ArrowDown") {
          setShowPhonePrefixDropdown(true);
          setPhonePrefixActiveIndex(0);
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setPhonePrefixActiveIndex(prev => (prev < visiblePrefixes.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setPhonePrefixActiveIndex(prev => (prev > 0 ? prev - 1 : visiblePrefixes.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (phonePrefixActiveIndex >= 0 && phonePrefixActiveIndex < visiblePrefixes.length) {
            const country = visiblePrefixes[phonePrefixActiveIndex];
            setCustomerData(prev => ({ ...prev, phonePrefix: country.code }));
            setPhonePrefixSearch("");
            setShowPhonePrefixDropdown(false);
            setPhonePrefixActiveIndex(-1);
          }
          break;
        case "Escape":
          e.preventDefault();
          setShowPhonePrefixDropdown(false);
          setPhonePrefixActiveIndex(-1);
          break;
      }
    },
    [
      showPhonePrefixDropdown,
      visiblePrefixes,
      phonePrefixActiveIndex,
      setCustomerData,
      setPhonePrefixSearch,
      setShowPhonePrefixDropdown,
    ]
  );

  const handleNationalityKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showNationalityDropdown || visibleNationalities.length === 0) {
        if (e.key === "ArrowDown") {
          setShowNationalityDropdown(true);
          setNationalityActiveIndex(0);
          e.preventDefault();
        }
        if (e.key === "Escape") {
          setShowNationalityDropdown(false);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setNationalityActiveIndex(prev =>
            prev < visibleNationalities.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setNationalityActiveIndex(prev =>
            prev > 0 ? prev - 1 : visibleNationalities.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (nationalityActiveIndex >= 0 && nationalityActiveIndex < visibleNationalities.length) {
            const nationality = visibleNationalities[nationalityActiveIndex];
            setCustomerData(prev => ({ ...prev, customerNationality: nationality }));
            setNationalitySearch("");
            setShowNationalityDropdown(false);
            setNationalityActiveIndex(-1);
          }
          break;
        case "Escape":
          e.preventDefault();
          setShowNationalityDropdown(false);
          setNationalityActiveIndex(-1);
          break;
      }
    },
    [
      showNationalityDropdown,
      visibleNationalities,
      nationalityActiveIndex,
      setCustomerData,
      setNationalitySearch,
      setShowNationalityDropdown,
    ]
  );

  return (
    <div className="space-y-10 sm:space-y-12">
      {pricingOverride.hasOverride && (
        <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg bg-foreground/[0.04] text-foreground text-[13px] leading-snug">
          <TrendingUp className="w-4 h-4 mt-0.5 shrink-0 text-foreground/70" />
          <span>
            <strong className="font-semibold">
              {t.booking.specialRateTitle ?? "Tarifa especial para esta fecha"}:
            </strong>{" "}
            {t.booking.specialRateBody ?? "precio adaptado por demanda"}
            {pricingOverride.percentChange && pricingOverride.percentChange !== 0
              ? ` (${pricingOverride.percentChange > 0 ? "+" : ""}${pricingOverride.percentChange}%)`
              : ""}
            {pricingOverride.overrideLabel ? `: ${pricingOverride.overrideLabel}` : ""}.{" "}
            {t.booking.specialRateFooter ?? "El total final del siguiente paso ya lo incluye."}
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 sm:gap-y-12">
        {/* Extras section */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="font-heading text-[15px] font-semibold text-foreground tracking-tight">
              {t.booking.extras}
            </h3>
            <span className="text-[12px] text-muted-foreground">{t.booking.optional}</span>
          </div>
          <div className="space-y-2">
            {availableExtras.map(extra => {
              const count = extras[extra.id] || 0;
              const isActive = count > 0;
              return (
                <div
                  key={extra.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl transition-colors ${
                    isActive
                      ? "bg-foreground/[0.04] ring-1 ring-foreground/20"
                      : "ring-1 ring-border"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-[14px] leading-tight">
                      {extra.name}
                    </h4>
                    <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-1">
                      {extra.description}
                    </p>
                    <p className="text-[12px] font-semibold text-foreground mt-0.5 tabular-nums">
                      {extra.price}€
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => updateExtra(extra.id, false)}
                      disabled={count === 0}
                      aria-label={`- ${extra.name}`}
                      className="h-9 w-9 rounded-full inline-flex items-center justify-center bg-foreground/[0.04] text-foreground hover:bg-foreground/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      data-testid={`button-decrease-${extra.id}`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span
                      className="w-6 text-center font-semibold text-[14px] tabular-nums"
                      aria-live="polite"
                    >
                      {count}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateExtra(extra.id, true)}
                      aria-label={`+ ${extra.name}`}
                      className="h-9 w-9 rounded-full inline-flex items-center justify-center bg-foreground/[0.04] text-foreground hover:bg-foreground/[0.08] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      data-testid={`button-increase-${extra.id}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Customer data section */}
        <section>
          <h3 className="font-heading text-[15px] font-semibold text-foreground tracking-tight mb-3">
            {t.booking.customerData}
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="customerName"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  {t.booking.firstName} *
                </label>
                <input
                  id="customerName"
                  type="text"
                  required
                  aria-required="true"
                  aria-invalid={!!errors.customerName}
                  aria-describedby={errors.customerName ? "customerName-error" : undefined}
                  value={customerData.customerName}
                  onChange={e =>
                    setCustomerData(prev => ({ ...prev, customerName: e.target.value }))
                  }
                  onBlur={() => handleBlur("customerName")}
                  className={`w-full p-2.5 border rounded-lg focus:ring-2 text-foreground text-sm ${errors.customerName ? errorBorderClass : normalBorderClass}`}
                  placeholder="Ana"
                  data-testid="input-customer-name"
                />
                {errors.customerName && (
                  <p id="customerName-error" role="alert" className="text-red-500 text-xs mt-1">
                    {t.validation.required}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="customerSurname"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  {t.booking.lastName} *
                </label>
                <input
                  id="customerSurname"
                  type="text"
                  required
                  aria-required="true"
                  aria-invalid={!!errors.customerSurname}
                  aria-describedby={errors.customerSurname ? "customerSurname-error" : undefined}
                  value={customerData.customerSurname}
                  onChange={e =>
                    setCustomerData(prev => ({ ...prev, customerSurname: e.target.value }))
                  }
                  onBlur={() => handleBlur("customerSurname")}
                  className={`w-full p-2.5 border rounded-lg focus:ring-2 text-foreground text-sm ${errors.customerSurname ? errorBorderClass : normalBorderClass}`}
                  placeholder="Garcia Lopez"
                  data-testid="input-customer-surname"
                />
                {errors.customerSurname && (
                  <p id="customerSurname-error" role="alert" className="text-red-500 text-xs mt-1">
                    {t.validation.required}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="customerEmail"
                className="block text-sm font-medium text-foreground mb-1"
              >
                {t.booking.emailLabel} ({t.booking.optional})
              </label>
              <input
                id="customerEmail"
                type="email"
                value={customerData.customerEmail}
                onChange={e =>
                  setCustomerData(prev => ({ ...prev, customerEmail: e.target.value }))
                }
                className="w-full p-2.5 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground text-sm"
                placeholder="ana@example.com"
                data-testid="input-customer-email"
              />
            </div>

            <div>
              <label
                htmlFor="customerPhone"
                className="block text-sm font-medium text-foreground mb-1"
              >
                {t.booking.phone} *
              </label>
              <div className="flex gap-2">
                <div className="relative w-24 flex-shrink-0">
                  <input
                    type="text"
                    role="combobox"
                    aria-expanded={showPhonePrefixDropdown}
                    aria-haspopup="listbox"
                    aria-controls="phonePrefix-listbox"
                    aria-activedescendant={
                      phonePrefixActiveIndex >= 0
                        ? `phonePrefix-option-${phonePrefixActiveIndex}`
                        : undefined
                    }
                    aria-label={t.booking.phone + " prefix"}
                    value={phonePrefixSearch || customerData.phonePrefix}
                    onChange={e => {
                      setPhonePrefixSearch(e.target.value);
                      setShowPhonePrefixDropdown(true);
                      setPhonePrefixActiveIndex(-1);
                    }}
                    onFocus={() => setShowPhonePrefixDropdown(true)}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowPhonePrefixDropdown(false);
                        setPhonePrefixActiveIndex(-1);
                      }, 200);
                    }}
                    onKeyDown={handlePhonePrefixKeyDown}
                    placeholder="+34"
                    className="w-full p-2.5 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-base text-foreground"
                    data-testid="input-phone-prefix-search"
                  />
                  {showPhonePrefixDropdown && visiblePrefixes.length > 0 && (
                    <div
                      ref={phonePrefixListRef}
                      id="phonePrefix-listbox"
                      role="listbox"
                      aria-label="Phone prefix"
                      className="absolute z-10 left-0 w-full max-w-xs max-h-48 overflow-y-auto bg-background border border-primary/20 rounded-lg shadow-lg mt-1"
                    >
                      {visiblePrefixes.map((country, index) => (
                        <button
                          key={country.code}
                          id={`phonePrefix-option-${index}`}
                          type="button"
                          role="option"
                          aria-selected={phonePrefixActiveIndex === index}
                          onClick={() => {
                            setCustomerData(prev => ({ ...prev, phonePrefix: country.code }));
                            setPhonePrefixSearch("");
                            setShowPhonePrefixDropdown(false);
                            setPhonePrefixActiveIndex(-1);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-primary/5 focus:bg-primary/5 text-sm border-b last:border-b-0 text-foreground transition-colors ${phonePrefixActiveIndex === index ? "bg-primary/10" : ""}`}
                          data-testid={`option-prefix-${country.code}`}
                        >
                          <span className="font-mono">{country.code}</span> {country.country}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    id="customerPhone"
                    type="tel"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.customerPhone}
                    aria-describedby={errors.customerPhone ? "customerPhone-error" : undefined}
                    value={customerData.customerPhone}
                    onChange={e =>
                      setCustomerData(prev => ({ ...prev, customerPhone: e.target.value }))
                    }
                    onBlur={() => handleBlur("customerPhone")}
                    className={`w-full p-2.5 border rounded-lg focus:ring-2 text-foreground text-sm ${errors.customerPhone ? errorBorderClass : normalBorderClass}`}
                    placeholder="600 000 000"
                    data-testid="input-customer-phone"
                  />
                </div>
              </div>
              {errors.customerPhone && (
                <p id="customerPhone-error" role="alert" className="text-red-500 text-xs mt-1">
                  {t.validation.required}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="customerNationality"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  {t.booking.nationality} *
                </label>
                <div className="relative">
                  <input
                    id="customerNationality"
                    type="text"
                    required
                    role="combobox"
                    aria-required="true"
                    aria-invalid={!!errors.customerNationality}
                    aria-describedby={
                      errors.customerNationality ? "customerNationality-error" : undefined
                    }
                    aria-expanded={showNationalityDropdown}
                    aria-haspopup="listbox"
                    aria-controls="nationality-listbox"
                    aria-activedescendant={
                      nationalityActiveIndex >= 0
                        ? `nationality-option-${nationalityActiveIndex}`
                        : undefined
                    }
                    value={nationalitySearch || customerData.customerNationality}
                    onChange={e => {
                      const value = e.target.value;
                      setNationalitySearch(value);
                      setShowNationalityDropdown(true);
                      setNationalityActiveIndex(-1);
                      setCustomerData(prev => ({ ...prev, customerNationality: value }));
                    }}
                    onBlur={() => {
                      if (nationalitySearch) {
                        setCustomerData(prev => ({
                          ...prev,
                          customerNationality: nationalitySearch,
                        }));
                        setNationalitySearch("");
                      }
                      setShowNationalityDropdown(false);
                      setNationalityActiveIndex(-1);
                      handleBlur("customerNationality");
                    }}
                    onFocus={() => setShowNationalityDropdown(true)}
                    onKeyDown={handleNationalityKeyDown}
                    placeholder={t.booking.searchNationality}
                    className={`w-full p-2.5 border rounded-lg focus:ring-2 text-foreground text-sm ${errors.customerNationality ? errorBorderClass : normalBorderClass}`}
                    data-testid="input-nationality-search"
                  />
                  {showNationalityDropdown && visibleNationalities.length > 0 && (
                    <div
                      ref={nationalityListRef}
                      id="nationality-listbox"
                      role="listbox"
                      aria-label={t.booking.nationality}
                      className="absolute z-10 w-full max-h-48 overflow-y-auto bg-background border border-primary/20 rounded-lg shadow-lg mt-1"
                    >
                      {visibleNationalities.map((nationality, index) => (
                        <button
                          key={nationality}
                          id={`nationality-option-${index}`}
                          type="button"
                          role="option"
                          aria-selected={nationalityActiveIndex === index}
                          onMouseDown={e => {
                            e.preventDefault();
                            setCustomerData(prev => ({
                              ...prev,
                              customerNationality: nationality,
                            }));
                            setNationalitySearch("");
                            setShowNationalityDropdown(false);
                            setNationalityActiveIndex(-1);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-primary/5 focus:bg-primary/5 border-b last:border-b-0 text-foreground text-sm transition-colors ${nationalityActiveIndex === index ? "bg-primary/10" : ""}`}
                          data-testid={`option-nationality-${nationality.toLowerCase()}`}
                        >
                          {nationality}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.customerNationality && (
                  <p
                    id="customerNationality-error"
                    role="alert"
                    className="text-red-500 text-xs mt-1"
                  >
                    {t.validation.required}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="numberOfPeople"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  {t.booking.numberOfPeople} *
                </label>
                <Select
                  value={customerData.numberOfPeople.toString()}
                  onValueChange={value =>
                    setCustomerData(prev => ({ ...prev, numberOfPeople: parseInt(value) }))
                  }
                >
                  <SelectTrigger aria-required="true">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: maxCapacity }, (_, i) => i + 1).map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? t.booking.person : t.booking.people}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 z-10 -mx-5 sm:-mx-8 -mb-6 px-5 sm:px-8 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] bg-background/95 backdrop-blur-md border-t border-border/60">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label={t.booking.back}
              className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-full text-foreground/70 hover:text-foreground hover:bg-foreground/[0.04] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="button-back-step"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <Button
            onClick={() => {
              const durationHours = duration
                ? parseInt(duration.replace("h", ""), 10) || null
                : null;
              const startTime =
                selectedDate && selectedTime
                  ? parseMadridLocal(`${selectedDate}T${selectedTime}:00`)
                  : null;
              trackAddShippingInfo(
                {
                  id: boatId,
                  name: boatName,
                  specifications: boat?.specifications,
                  requiresLicense: boat?.requiresLicense,
                },
                boatPrice,
                {
                  durationHours,
                  startTime,
                  numberOfPeople: customerData.numberOfPeople,
                }
              );
              trackGenerateLead(boatId, boatName, boatPrice);
              setStep(3);
            }}
            disabled={!isFormValid}
            className="flex-1 h-12 rounded-full text-[15px] font-semibold disabled:opacity-40"
            data-testid="button-continue-payment"
          >
            {t.booking.continueToPayment}
          </Button>
        </div>
      </div>
    </div>
  );
}
