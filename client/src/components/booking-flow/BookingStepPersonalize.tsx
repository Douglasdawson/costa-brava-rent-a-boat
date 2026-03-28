import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Users } from "lucide-react";
import { trackAddShippingInfo, trackGenerateLead } from "@/utils/analytics";
import type { Translations } from "@/lib/translations";
import type { PhonePrefix } from "@/utils/phone-prefixes";
import type { Extra, CustomerData } from "./types";
import { BookingTrustBanner } from "./BookingTrustBanner";

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
  // Navigation
  setStep: (step: number) => void;
  t: Translations;
}

export function BookingStepPersonalize({
  availableExtras, extras, updateExtra,
  customerData, setCustomerData, maxCapacity,
  phonePrefixSearch, setPhonePrefixSearch,
  showPhonePrefixDropdown, setShowPhonePrefixDropdown,
  filteredPhoneCountries,
  nationalitySearch, setNationalitySearch,
  showNationalityDropdown, setShowNationalityDropdown,
  filteredNationalities,
  boatId, boatName, boatPrice,
  setStep, t,
}: BookingStepPersonalizeProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [phonePrefixActiveIndex, setPhonePrefixActiveIndex] = useState(-1);
  const [nationalityActiveIndex, setNationalityActiveIndex] = useState(-1);

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

  const isFormValid = customerData.customerName &&
    customerData.customerSurname &&
    customerData.customerPhone &&
    customerData.customerNationality &&
    customerData.numberOfPeople >= 1;

  const errorBorderClass = "border-red-400 focus:ring-red-400 focus:border-red-400";
  const normalBorderClass = "border-primary/20 focus:ring-primary focus:border-primary";

  const visiblePrefixes = filteredPhoneCountries.slice(0, 8);
  const visibleNationalities = filteredNationalities.slice(0, 10);

  const handlePhonePrefixKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showPhonePrefixDropdown || visiblePrefixes.length === 0) {
      if (e.key === 'ArrowDown') {
        setShowPhonePrefixDropdown(true);
        setPhonePrefixActiveIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setPhonePrefixActiveIndex(prev =>
          prev < visiblePrefixes.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setPhonePrefixActiveIndex(prev =>
          prev > 0 ? prev - 1 : visiblePrefixes.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (phonePrefixActiveIndex >= 0 && phonePrefixActiveIndex < visiblePrefixes.length) {
          const country = visiblePrefixes[phonePrefixActiveIndex];
          setCustomerData(prev => ({...prev, phonePrefix: country.code}));
          setPhonePrefixSearch("");
          setShowPhonePrefixDropdown(false);
          setPhonePrefixActiveIndex(-1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowPhonePrefixDropdown(false);
        setPhonePrefixActiveIndex(-1);
        break;
    }
  }, [showPhonePrefixDropdown, visiblePrefixes, phonePrefixActiveIndex, setCustomerData, setPhonePrefixSearch, setShowPhonePrefixDropdown]);

  const handleNationalityKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showNationalityDropdown || visibleNationalities.length === 0) {
      if (e.key === 'ArrowDown') {
        setShowNationalityDropdown(true);
        setNationalityActiveIndex(0);
        e.preventDefault();
      }
      if (e.key === 'Escape') {
        setShowNationalityDropdown(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setNationalityActiveIndex(prev =>
          prev < visibleNationalities.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setNationalityActiveIndex(prev =>
          prev > 0 ? prev - 1 : visibleNationalities.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (nationalityActiveIndex >= 0 && nationalityActiveIndex < visibleNationalities.length) {
          const nationality = visibleNationalities[nationalityActiveIndex];
          setCustomerData(prev => ({...prev, customerNationality: nationality}));
          setNationalitySearch("");
          setShowNationalityDropdown(false);
          setNationalityActiveIndex(-1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowNationalityDropdown(false);
        setNationalityActiveIndex(-1);
        break;
    }
  }, [showNationalityDropdown, visibleNationalities, nationalityActiveIndex, setCustomerData, setNationalitySearch, setShowNationalityDropdown]);

  return (
    <div className="space-y-4">
      <BookingTrustBanner t={t} />
      {/* Desktop: side-by-side | Mobile: stacked */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Extras section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.booking.extras} ({t.booking.optional})</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {availableExtras.map((extra) => (
                <div key={extra.id} className="flex items-center justify-between p-3 border border-primary/20 rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-sm">{extra.name}</h4>
                    <p className="text-xs text-muted-foreground">{extra.description}</p>
                    <p className="text-xs font-medium text-primary">{extra.price}€</p>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateExtra(extra.id, false)}
                      data-testid={`button-decrease-${extra.id}`}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-6 text-center font-medium text-sm">
                      {extras[extra.id] || 0}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateExtra(extra.id, true)}
                      data-testid={`button-increase-${extra.id}`}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer data section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <Users className="w-4 h-4 mr-2" />
              {t.booking.customerData}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-foreground mb-1">
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
                    onChange={(e) => setCustomerData(prev => ({...prev, customerName: e.target.value}))}
                    onBlur={() => handleBlur('customerName')}
                    className={`w-full p-2.5 border rounded-lg focus:ring-2 text-foreground text-sm ${errors.customerName ? errorBorderClass : normalBorderClass}`}
                    placeholder="Ana"
                    data-testid="input-customer-name"
                  />
                  {errors.customerName && (
                    <p id="customerName-error" role="alert" className="text-red-500 text-xs mt-1">{t.validation.required}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="customerSurname" className="block text-sm font-medium text-foreground mb-1">
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
                    onChange={(e) => setCustomerData(prev => ({...prev, customerSurname: e.target.value}))}
                    onBlur={() => handleBlur('customerSurname')}
                    className={`w-full p-2.5 border rounded-lg focus:ring-2 text-foreground text-sm ${errors.customerSurname ? errorBorderClass : normalBorderClass}`}
                    placeholder="Garcia Lopez"
                    data-testid="input-customer-surname"
                  />
                  {errors.customerSurname && (
                    <p id="customerSurname-error" role="alert" className="text-red-500 text-xs mt-1">{t.validation.required}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="customerEmail" className="block text-sm font-medium text-foreground mb-1">
                  {t.booking.emailLabel} ({t.booking.optional})
                </label>
                <input
                  id="customerEmail"
                  type="email"
                  value={customerData.customerEmail}
                  onChange={(e) => setCustomerData(prev => ({...prev, customerEmail: e.target.value}))}
                  className="w-full p-2.5 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground text-sm"
                  placeholder="ana@example.com"
                  data-testid="input-customer-email"
                />
              </div>

              <div>
                <label htmlFor="customerPhone" className="block text-sm font-medium text-foreground mb-1">
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
                      aria-activedescendant={phonePrefixActiveIndex >= 0 ? `phonePrefix-option-${phonePrefixActiveIndex}` : undefined}
                      aria-label={t.booking.phone + " prefix"}
                      value={phonePrefixSearch || customerData.phonePrefix}
                      onChange={(e) => {
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
                      className="w-full p-2.5 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm text-foreground"
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
                              setCustomerData(prev => ({...prev, phonePrefix: country.code}));
                              setPhonePrefixSearch("");
                              setShowPhonePrefixDropdown(false);
                              setPhonePrefixActiveIndex(-1);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-primary/5 focus:bg-primary/5 text-sm border-b last:border-b-0 text-foreground ${phonePrefixActiveIndex === index ? "bg-primary/10" : ""}`}
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
                      onChange={(e) => setCustomerData(prev => ({...prev, customerPhone: e.target.value}))}
                      onBlur={() => handleBlur('customerPhone')}
                      className={`w-full p-2.5 border rounded-lg focus:ring-2 text-foreground text-sm ${errors.customerPhone ? errorBorderClass : normalBorderClass}`}
                      placeholder="600 000 000"
                      data-testid="input-customer-phone"
                    />
                  </div>
                </div>
                {errors.customerPhone && (
                  <p id="customerPhone-error" role="alert" className="text-red-500 text-xs mt-1">{t.validation.required}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="customerNationality" className="block text-sm font-medium text-foreground mb-1">
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
                      aria-describedby={errors.customerNationality ? "customerNationality-error" : undefined}
                      aria-expanded={showNationalityDropdown}
                      aria-haspopup="listbox"
                      aria-controls="nationality-listbox"
                      aria-activedescendant={nationalityActiveIndex >= 0 ? `nationality-option-${nationalityActiveIndex}` : undefined}
                      value={nationalitySearch || customerData.customerNationality}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNationalitySearch(value);
                        setShowNationalityDropdown(true);
                        setNationalityActiveIndex(-1);
                        setCustomerData(prev => ({...prev, customerNationality: value}));
                      }}
                      onBlur={() => {
                        if (nationalitySearch) {
                          setCustomerData(prev => ({...prev, customerNationality: nationalitySearch}));
                          setNationalitySearch("");
                        }
                        setShowNationalityDropdown(false);
                        setNationalityActiveIndex(-1);
                        handleBlur('customerNationality');
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
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setCustomerData(prev => ({...prev, customerNationality: nationality}));
                              setNationalitySearch("");
                              setShowNationalityDropdown(false);
                              setNationalityActiveIndex(-1);
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-primary/5 focus:bg-primary/5 border-b last:border-b-0 text-foreground text-sm ${nationalityActiveIndex === index ? "bg-primary/10" : ""}`}
                            data-testid={`option-nationality-${nationality.toLowerCase()}`}
                          >
                            {nationality}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.customerNationality && (
                    <p id="customerNationality-error" role="alert" className="text-red-500 text-xs mt-1">{t.validation.required}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="numberOfPeople" className="block text-sm font-medium text-foreground mb-1">
                    {t.booking.numberOfPeople} *
                  </label>
                  <Select value={customerData.numberOfPeople.toString()} onValueChange={(value) => setCustomerData(prev => ({...prev, numberOfPeople: parseInt(value)}))}>
                    <SelectTrigger aria-required="true">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: maxCapacity }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? t.booking.person : t.booking.people}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue to payment button */}
      <Button
        onClick={() => {
          trackAddShippingInfo(boatId, boatName);
          trackGenerateLead(boatId, boatName, boatPrice);
          setStep(3);
        }}
        disabled={!isFormValid}
        className="w-full py-3"
        data-testid="button-continue-payment"
      >
        {t.booking.continueToPayment}
      </Button>
    </div>
  );
}
