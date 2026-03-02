import { useState } from "react";
import { CalendarIcon, Check, Loader2, X } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import type { BookingWizardMobileProps } from "./BookingWizardMobile";
import { EXTRA_PACKS } from "@shared/boatData";

export default function BookingFormDesktop(props: BookingWizardMobileProps) {
  const {
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
    privacyConsent, setPrivacyConsent,
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
  } = props;

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const durationOptions = getDurationOptions();
  const maxCapacity = getMaxCapacity();
  const price = getBookingPrice();
  const discount = getCodeDiscount();
  const boatExtraNames = new Set(boatExtras.map(e => e.name));
  const availablePacks = EXTRA_PACKS.filter(pack =>
    pack.extras.every(name => boatExtraNames.has(name))
  );

  const inputBase = "w-full p-2.5 border-2 rounded-lg bg-white text-gray-900 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none";
  const inputError = "border-red-400";
  const inputNormal = "border-gray-200";

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left column: boat selection ── */}
        <div className="w-[45%] border-r border-gray-100 flex flex-col overflow-hidden">
          {/* License filter */}
          {!preSelectedBoatId && (
            <div className="px-4 pt-4 pb-3 flex-shrink-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {t.wizard.haveNauticalLicense}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLicenseFilter("without")}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                    licenseFilter === "without"
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  {t.wizard.withoutLicense}
                </button>
                <button
                  type="button"
                  onClick={() => setLicenseFilter("with")}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                    licenseFilter === "with"
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  {t.wizard.withLicense}
                </button>
              </div>
            </div>
          )}

          {/* Boats list */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 sticky top-0 bg-white pt-1 pb-1">
              {t.wizard.selectABoat}
            </p>
            {isBoatsLoading && (
              <div className="space-y-1.5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex items-center gap-2 p-2.5 rounded-lg border-2 border-gray-100">
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 h-3 bg-gray-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            )}
            {filteredBoats.map((boat) => {
              const firstSeason = boat.pricing ? Object.values(boat.pricing)[0] : null;
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
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border-2 text-left transition-all ${
                    isSelected ? "border-primary bg-primary/5" : "border-gray-200 bg-white"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "border-primary bg-primary" : "border-gray-300"
                  }`}>
                    {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-xs truncate">{boat.name}</p>
                    {minPrice !== null && (
                      <p className="text-[10px] text-primary font-medium">{t.boats.from} {minPrice}€</p>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 flex-shrink-0">{boat.capacity}p</span>
                </button>
              );
            })}
            {showFieldError('boat') && (
              <p className="text-xs text-red-500">{getFieldError('boat')}</p>
            )}
          </div>
        </div>

        {/* ── Right column: details + personal data ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              {t.wizard.date}
            </label>
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  onBlur={() => handleBlur('date')}
                  className={`${inputBase} flex items-center gap-2 ${showFieldError('date') ? inputError : inputNormal}`}
                >
                  <CalendarIcon className="w-4 h-4 text-primary flex-shrink-0" />
                  {selectedDate
                    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                    : <span className="text-gray-500">{t.wizard.selectDate}</span>
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
            {showFieldError('date') && <p className="text-xs text-red-500 mt-1">{getFieldError('date')}</p>}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              {t.wizard.duration}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {durationOptions.map((opt) => {
                const parts = opt.label.split(' - ');
                const priceText = parts.length > 1 && parts[parts.length - 1].includes('€') ? parts[parts.length - 1] : null;
                const labelText = priceText ? parts.slice(0, -1).join(' · ') : opt.label;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedDuration(opt.value)}
                    className={`py-2 px-1.5 rounded-lg border-2 text-center transition-all ${
                      selectedDuration === opt.value ? "border-primary bg-primary/5" : "border-gray-200 bg-white"
                    }`}
                  >
                    <p className="text-xs font-semibold text-gray-900">{labelText}</p>
                    {priceText && <p className="text-[10px] font-bold text-primary">{priceText}</p>}
                  </button>
                );
              })}
            </div>
            {showFieldError('duration') && <p className="text-xs text-red-500 mt-1">{getFieldError('duration')}</p>}
          </div>

          {/* Time + People */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="desktop-time" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
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
                {timeSlots.map((time) => (
                  <option key={time} value={time}>{time}h</option>
                ))}
              </select>
              {showFieldError('time') && <p id="error-desktop-time" className="text-xs text-red-500 mt-1">{getFieldError('time')}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                {t.wizard.numberOfPeople}
                {selectedBoatInfo && <span className="font-normal text-gray-400 ml-1">(max {maxCapacity})</span>}
              </label>
              <div className={`flex items-center justify-between border-2 rounded-lg bg-white px-3 py-1 ${
                showFieldError('people') ? 'border-red-400' : 'border-gray-200'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    const c = parseInt(numberOfPeople || '1');
                    if (c > 1) { setNumberOfPeople(String(c - 1)); handleBlur('people'); }
                  }}
                  disabled={!numberOfPeople || parseInt(numberOfPeople) <= 1}
                  aria-label="Reducir número de personas"
                  className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center font-bold text-gray-600 disabled:opacity-30 hover:border-primary hover:text-primary transition-colors text-lg"
                >−</button>
                <span className="text-lg font-bold text-gray-900 min-w-[1.5rem] text-center">
                  {numberOfPeople || '2'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const c = parseInt(numberOfPeople || '1');
                    if (c < maxCapacity) { setNumberOfPeople(String(c + 1)); handleBlur('people'); }
                  }}
                  disabled={!!numberOfPeople && parseInt(numberOfPeople) >= maxCapacity}
                  aria-label="Aumentar número de personas"
                  className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center font-bold text-gray-600 disabled:opacity-30 hover:border-primary hover:text-primary transition-colors text-lg"
                >+</button>
              </div>
              {showFieldError('people') && <p className="text-xs text-red-500 mt-1">{getFieldError('people')}</p>}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Extras & Packs */}
          {boatExtras.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowExtras(!showExtras)}
                className="flex items-center justify-between w-full mb-2"
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {t.booking.extrasSection.title}
                </p>
                <span className="flex items-center gap-2 text-xs">
                  {totalExtrasPrice > 0 && (
                    <span className="text-primary font-bold">+{totalExtrasPrice}€</span>
                  )}
                  <span className="text-gray-400">{showExtras ? '\u25B2' : '\u25BC'}</span>
                </span>
              </button>

              {showExtras && (
                <div className="space-y-2">
                  {availablePacks.map((pack) => (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => handlePackSelect(pack.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg border-2 text-left transition-all ${
                        selectedPack === pack.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-900">
                          {isSpanishLang ? pack.name : pack.nameEN}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {pack.extras.join(', ')}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-xs font-bold text-primary">{pack.price}€</p>
                        <p className="text-[10px] text-green-600">
                          -{calculatePackSavings(pack.id)}€ {t.booking.extrasSection.savings.toLowerCase()}
                        </p>
                      </div>
                    </button>
                  ))}

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
                        className={`w-full flex items-center gap-2.5 p-2 rounded-lg border-2 text-left transition-all ${
                          inPack
                            ? 'border-primary/30 bg-primary/5 opacity-70 cursor-default'
                            : isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {Icon && <Icon className="w-4 h-4 text-primary flex-shrink-0" />}
                        <span className="flex-1 text-xs font-medium text-gray-900">
                          {extra.name}
                        </span>
                        {inPack ? (
                          <span className="text-[10px] text-primary font-semibold flex-shrink-0">
                            {t.booking.extrasSection.included.toLowerCase()}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-primary flex-shrink-0">
                            {extra.price}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Personal data */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.wizard.yourData}</p>
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => handleBlur('firstName')}
                    placeholder={t.wizard.firstName}
                    autoComplete="given-name"
                    maxLength={100}
                    aria-required="true"
                    aria-invalid={showFieldError('firstName') ? "true" : "false"}
                    aria-describedby={showFieldError('firstName') ? "error-firstName" : undefined}
                    className={`${inputBase} ${showFieldError('firstName') ? inputError : inputNormal}`}
                  />
                  {showFieldError('firstName') && <p id="error-firstName" className="text-xs text-red-500 mt-0.5">{getFieldError('firstName')}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => handleBlur('lastName')}
                    placeholder={t.wizard.lastName}
                    autoComplete="family-name"
                    maxLength={100}
                    aria-required="true"
                    aria-invalid={showFieldError('lastName') ? "true" : "false"}
                    aria-describedby={showFieldError('lastName') ? "error-lastName" : undefined}
                    className={`${inputBase} ${showFieldError('lastName') ? inputError : inputNormal}`}
                  />
                  {showFieldError('lastName') && <p id="error-lastName" className="text-xs text-red-500 mt-0.5">{getFieldError('lastName')}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative w-24 flex-shrink-0" ref={prefixDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowPrefixDropdown(!showPrefixDropdown)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setShowPrefixDropdown(false); }}
                    aria-haspopup="listbox"
                    aria-expanded={showPrefixDropdown}
                    aria-label={`Prefijo de teléfono: ${phonePrefix}`}
                    className={`${inputBase} ${inputNormal} flex items-center gap-1`}
                  >
                    <span className="truncate text-xs">{selectedPrefixInfo?.flag} {phonePrefix}</span>
                  </button>
                  {showPrefixDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                      <div className="p-2 border-b sticky top-0 bg-white">
                        <input
                          type="text"
                          value={prefixSearch}
                          onChange={(e) => setPrefixSearch(e.target.value)}
                          placeholder={t.wizard.searchCountry}
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      {filteredPrefixes.map((prefix) => (
                        <button
                          key={`${prefix.code}-${prefix.country}`}
                          type="button"
                          onClick={() => { setPhonePrefix(prefix.code); setShowPrefixDropdown(false); setPrefixSearch(""); }}
                          className="w-full p-2 hover:bg-gray-50 text-left flex items-center gap-2 text-xs"
                        >
                          <span>{prefix.flag}</span>
                          <span className="font-medium">{prefix.code}</span>
                          <span className="text-gray-500 truncate">{prefix.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    onBlur={() => handleBlur('phone')}
                    placeholder={t.wizard.phone}
                    autoComplete="tel"
                    maxLength={15}
                    aria-required="true"
                    aria-invalid={showFieldError('phone') ? "true" : "false"}
                    aria-describedby={showFieldError('phone') ? "error-phone" : undefined}
                    className={`${inputBase} ${showFieldError('phone') ? inputError : inputNormal}`}
                  />
                  {showFieldError('phone') && <p id="error-phone" className="text-xs text-red-500 mt-0.5">{getFieldError('phone')}</p>}
                </div>
              </div>
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder={t.wizard.email}
                  autoComplete="email"
                  maxLength={254}
                  aria-required="true"
                  aria-invalid={showFieldError('email') ? "true" : "false"}
                  aria-describedby={showFieldError('email') ? "error-email" : undefined}
                  className={`${inputBase} ${showFieldError('email') ? inputError : inputNormal}`}
                />
                {showFieldError('email') && <p id="error-email" className="text-xs text-red-500 mt-0.5">{getFieldError('email')}</p>}
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
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t.codeValidation.haveCode}
              </p>
              <span className="text-gray-400 text-xs">{showCodeSection ? '\u25B2' : '\u25BC'}</span>
            </button>

            {showCodeSection && (
              <div className="space-y-2">
                {validatedCode ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2.5">
                    <div>
                      <p className="text-xs font-bold text-green-800">{validatedCode.code}</p>
                      <p className="text-[10px] text-green-600">
                        {validatedCode.type === 'gift_card'
                          ? `-${discount}\u20AC`
                          : `-${validatedCode.percentage}% (-${discount}\u20AC)`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCode}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Eliminar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                      placeholder={t.codeValidation.enterCode}
                      className="flex-1 p-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none uppercase"
                      maxLength={32}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleValidateCode(); } }}
                    />
                    <button
                      type="button"
                      onClick={handleValidateCode}
                      disabled={isValidatingCode || !codeInput.trim()}
                      className="px-3 py-2.5 bg-primary text-white text-xs font-semibold rounded-lg disabled:opacity-50 hover:bg-primary/90 transition-colors flex-shrink-0"
                    >
                      {isValidatingCode
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : t.codeValidation.validate}
                    </button>
                  </div>
                )}
                {codeError && (
                  <p className="text-xs text-red-500">{codeError}</p>
                )}
              </div>
            )}
          </div>

          {/* Price summary + submit */}
          {price !== null && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {t.booking.estimatedTotal}
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">{t.booking.basePrice}</span>
                  <span className="font-medium">{price}\u20AC</span>
                </div>
                {totalExtrasPrice > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{t.booking.extrasSection.title}</span>
                    <span className="font-medium">+{totalExtrasPrice}\u20AC</span>
                  </div>
                )}
                {discount > 0 && validatedCode && (
                  <div className="flex justify-between text-xs text-green-700">
                    <span>{validatedCode.code}</span>
                    <span>-{discount}\u20AC</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline border-t border-primary/20 pt-1.5 mt-1">
                  <span className="text-sm font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-primary">
                    {price + totalExtrasPrice - discount}\u20AC
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{t.booking.priceConfirmedWhatsApp}</p>
            </div>
          )}

          {/* RGPD consent */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyConsent}
              onChange={(e) => setPrivacyConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
              aria-required="true"
              id="desktop-privacy-consent"
            />
            <span className="text-xs text-gray-600">
              {t.booking.gdprConsent.split('{privacyPolicy}')[0]}
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                {t.booking.gdprPrivacyLink}
              </a>
              {(t.booking.gdprConsent.split('{privacyPolicy}')[1] || '').split('{termsAndConditions}')[0]}
              <a href="/terms-conditions" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                {t.booking.gdprTermsLink}
              </a>
              {(t.booking.gdprConsent.split('{privacyPolicy}')[1] || '').split('{termsAndConditions}')[1] || ''}
            </span>
          </label>

          <Button
            type="button"
            onClick={async () => {
              setIsSubmitting(true);
              await handleBookingSearch();
              setIsSubmitting(false);
            }}
            disabled={isSubmitting || !privacyConsent}
            className="w-full py-5 text-sm font-semibold bg-[#25D366] hover:bg-[#1ebe5d] text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <SiWhatsapp className="w-4 h-4 mr-2" />
            }
            {t.booking.sendBookingRequest}
          </Button>

          {/* Bottom padding for scroll */}
          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}
