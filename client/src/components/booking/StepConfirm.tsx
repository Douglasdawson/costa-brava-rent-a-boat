import { useState } from "react";
import {
  ArrowRight,
  CalendarIcon,
  ChevronDown,
  Clock,
  Fuel,
  Gift,
  Loader2,
  Pencil,
  Ship,
  Sparkles,
  Tag,
  Users,
  X,
} from "lucide-react";
import { EXTRA_PACKS, boatIncludesFuel } from "@shared/boatData";
import { joinFullName } from "@/lib/fullName";
import { cn } from "@/lib/utils";
import { formatBookingDate } from "@/utils/intl-helpers";
import { flagEmojiToIso2 } from "@/utils/phone-prefixes";
import CountryFlag from "@/components/booking/CountryFlag";
import GdprConsentText from "@/components/booking/GdprConsentText";
import LicenseStatusPill from "@/components/booking/LicenseStatusPill";
import SlotConflictBanner from "@/components/SlotConflictBanner";
import { ValueStack } from "@/components/ValueStack";
import type { BookingWizardMobileProps } from "@/components/BookingWizardMobile";

const FOCUS =
  "focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none";
const FIELD =
  "h-12 w-full rounded-full border border-transparent bg-muted/60 px-5 text-base text-foreground transition-colors placeholder:text-muted-foreground/70 focus:border-cta focus:outline-none focus:ring-2 focus:ring-cta/30";
const FIELD_ERROR = "border-destructive ring-2 ring-destructive/30";

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: React.ReactNode;
  hint?: string;
  error?: string | false;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-baseline gap-2 px-1 text-sm font-medium text-muted-foreground"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p id={`error-${id}`} className="mt-1.5 px-1 text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`hint-${id}`} className="mt-1.5 px-1 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** "12:00 → 20:00 (8h)": start time and duration fused; falls back to the raw values if malformed. */
function scheduleLabel(preferredTime: string, selectedDuration: string): string {
  if (!preferredTime && !selectedDuration) return "--";
  if (!preferredTime || !selectedDuration) {
    return [preferredTime ? `${preferredTime}h` : "", selectedDuration].filter(Boolean).join(" · ");
  }
  const hours = parseFloat(selectedDuration.replace(/[^0-9.]/g, ""));
  const [startH, startM = 0] = preferredTime.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(startH))
    return `${preferredTime}h · ${selectedDuration}`;
  const end = Math.round(startH * 60 + (startM || 0) + hours * 60);
  const endTime = `${String(Math.floor(end / 60) % 24).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
  return `${preferredTime} → ${endTime} (${selectedDuration})`;
}

/**
 * Step 6, "Confirmar" (desktop and mobile share it): the contact form comes first because it is what blocks
 * sending, then the summary and the total. Two columns on desktop; one on phones, where this is the only step
 * that scrolls (form + summary + total cannot fit a phone screen).
 */
export default function StepConfirm(props: BookingWizardMobileProps) {
  const {
    t,
    language,
    selectedBoatInfo,
    selectedDate,
    selectedDuration,
    preferredTime,
    numberOfPeople,
    selectedExtras,
    selectedPack,
    extrasInPack,
    totalExtrasPrice,
    weatherGuarantee,
    reducedDeposit,
    reducedDepositAmount,
    coverages,
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
    getBookingPrice,
    getCodeDiscount,
    showFieldError,
    getFieldError,
    handleBlur,
    onGoToStep,
    slotConflict,
    onPickAlternativeSlot,
    onChangeDateFromConflict,
    isAvailabilityLoading,
    licenseVerifier,
  } = props;

  const [codePanelId] = useState("confirm-code-panel");
  const price = getBookingPrice();
  const discount = getCodeDiscount();
  const total = price !== null ? price + totalExtrasPrice - discount : null;
  const coveragesStep = (props.totalSteps ?? 6) - 1;

  const depositStr = selectedBoatInfo?.specifications?.deposit;
  const standardDeposit = depositStr ? parseInt(depositStr.replace(/[^0-9]/g, "")) : null;
  // With the cover contracted, show the deposit actually taken.
  const depositAmount = reducedDeposit ? reducedDepositAmount : standardDeposit;
  const depositCover = coverages?.find(c => c.key === "deposit");

  const extrasDisplay: string[] = [];
  if (selectedPack) {
    const pack = EXTRA_PACKS.find(p => p.id === selectedPack);
    if (pack) extrasDisplay.push(pack.name);
  }
  extrasDisplay.push(...selectedExtras.filter(e => !extrasInPack.has(e)));
  // Coverages are part of the total, so they must be named in the summary too.
  if (weatherGuarantee) extrasDisplay.push(t.booking.coverages.weatherName);
  if (reducedDeposit) extrasDisplay.push(t.booking.coverages.depositName);

  const fuelIncluded = selectedBoatInfo
    ? boatIncludesFuel(selectedBoatInfo.id, selectedBoatInfo.requiresLicense)
    : true;

  const summaryRows: Array<{ icon: typeof Ship; label: string; value: string }> = [
    { icon: Ship, label: t.booking.boat, value: selectedBoatInfo?.name || "--" },
    { icon: CalendarIcon, label: t.booking.date, value: formatBookingDate(selectedDate, language) },
    {
      icon: Clock,
      label: t.reviewSummary?.schedule || "Horario",
      value: scheduleLabel(preferredTime, selectedDuration),
    },
    { icon: Users, label: t.booking.people, value: numberOfPeople },
    ...(extrasDisplay.length > 0
      ? [{ icon: Sparkles, label: t.booking.extras, value: extrasDisplay.join(", ") }]
      : []),
  ];

  const nameError = showFieldError("firstName") && getFieldError("firstName");
  const phoneError = showFieldError("phone") && getFieldError("phone");
  const emailError = showFieldError("email") && getFieldError("email");

  return (
    <div className="space-y-5 md:space-y-6">
      <header className="text-center">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl">
          {t.endowment?.confirmYourBooking || t.wizard.yourData}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground text-balance">
          {t.wizard.confirmViaWhatsApp}
        </p>
      </header>

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

      <div className="grid gap-5 md:grid-cols-2 md:items-start md:gap-6">
        {/* Column 1: who is asking, and the discount code. */}
        <div className="space-y-5">
          <section aria-label={t.wizard.yourData} className="space-y-3.5">
            <Field id="confirm-fullname" label={t.wizard.fullName} error={nameError}>
              <input
                type="text"
                id="confirm-fullname"
                value={joinFullName(firstName, lastName)}
                onChange={e => onFullNameChange(e.target.value)}
                onBlur={() => handleBlur("firstName")}
                autoComplete="name"
                maxLength={200}
                aria-required="true"
                aria-invalid={nameError ? "true" : "false"}
                aria-describedby={nameError ? "error-confirm-fullname" : undefined}
                className={cn(FIELD, nameError && FIELD_ERROR)}
              />
            </Field>

            <Field id="confirm-phone" label={t.wizard.phone} error={phoneError}>
              <div className="flex gap-2">
                <div className="relative shrink-0" ref={prefixDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowPrefixDropdown(!showPrefixDropdown)}
                    onKeyDown={e => {
                      if (e.key === "Escape") setShowPrefixDropdown(false);
                    }}
                    aria-haspopup="listbox"
                    aria-expanded={showPrefixDropdown}
                    aria-label={`${t.a11y.phonePrefix}: ${phonePrefix}`}
                    className={cn(
                      "flex h-12 items-center gap-2 rounded-full bg-muted/60 pl-4 pr-3 text-base font-medium text-foreground transition-colors hover:bg-muted",
                      FOCUS
                    )}
                  >
                    {selectedPrefixInfo && (
                      <CountryFlag
                        iso2={flagEmojiToIso2(selectedPrefixInfo.flag)}
                        emoji={selectedPrefixInfo.flag}
                      />
                    )}
                    <span>{phonePrefix}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </button>
                  {showPrefixDropdown && (
                    <div className="absolute left-0 top-full z-50 mt-2 max-h-64 w-72 max-w-[calc(100vw-3rem)] overflow-y-auto rounded-2xl border border-border bg-popover p-2 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
                      <input
                        type="text"
                        value={prefixSearch}
                        onChange={e => setPrefixSearch(e.target.value)}
                        placeholder={t.wizard.searchCountry}
                        className="sticky top-0 mb-1 h-11 w-full rounded-full border border-border bg-background px-4 text-base text-foreground focus:border-cta focus:outline-none"
                      />
                      {filteredPrefixes.map(prefix => (
                        <button
                          key={`${prefix.code}-${prefix.country}`}
                          type="button"
                          onClick={() => {
                            setPhonePrefix(prefix.code);
                            setShowPrefixDropdown(false);
                            setPrefixSearch("");
                          }}
                          className="flex min-h-11 w-full items-center gap-2.5 rounded-full px-3 text-left text-sm hover:bg-muted"
                        >
                          <CountryFlag iso2={flagEmojiToIso2(prefix.flag)} emoji={prefix.flag} />
                          <span className="font-medium">{prefix.code}</span>
                          <span className="truncate text-muted-foreground">{prefix.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="tel"
                  id="confirm-phone"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  onBlur={() => handleBlur("phone")}
                  placeholder="612345678"
                  autoComplete="tel"
                  maxLength={15}
                  aria-required="true"
                  aria-invalid={phoneError ? "true" : "false"}
                  aria-describedby={phoneError ? "error-confirm-phone" : undefined}
                  className={cn(FIELD, "min-w-0 flex-1", phoneError && FIELD_ERROR)}
                />
              </div>
            </Field>

            <Field
              id="confirm-email"
              label={
                <>
                  <span>{t.wizard.email}</span>
                  <span className="text-xs font-normal opacity-70">({t.booking.optional})</span>
                </>
              }
              hint={t.wizard.emailHelper}
              error={emailError}
            >
              <input
                type="email"
                id="confirm-email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="email@example.com"
                autoComplete="email"
                maxLength={254}
                aria-required="false"
                aria-invalid={emailError ? "true" : "false"}
                aria-describedby={emailError ? "error-confirm-email" : "hint-confirm-email"}
                className={cn(FIELD, emailError && FIELD_ERROR)}
              />
            </Field>
          </section>

          {/* Discount / gift card code */}
          <section aria-label={t.codeValidation.haveCode}>
            <button
              type="button"
              onClick={() => setShowCodeSection(!showCodeSection)}
              aria-expanded={showCodeSection}
              aria-controls={codePanelId}
              className={cn(
                "flex min-h-12 w-full items-center justify-between gap-3 rounded-full border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:border-foreground/30",
                FOCUS
              )}
            >
              <span className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {t.codeValidation.haveCode}
                {validatedCode && (
                  <span className="rounded-full bg-success px-2 py-0.5 text-xs font-medium text-success-foreground">
                    {t.codeValidation.applied}
                  </span>
                )}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  showCodeSection && "rotate-180"
                )}
                aria-hidden="true"
              />
            </button>
            {showCodeSection && (
              <div id={codePanelId} className="mt-2.5 px-1">
                {!validatedCode ? (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={codeInput}
                        onChange={e => setCodeInput(e.target.value.toUpperCase())}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleValidateCode();
                          }
                        }}
                        placeholder={t.codeValidation.enterCode}
                        aria-label={t.codeValidation.enterCode}
                        maxLength={32}
                        disabled={isValidatingCode}
                        className={cn(FIELD, "min-w-0 flex-1 font-mono uppercase tracking-wider")}
                      />
                      <button
                        type="button"
                        onClick={handleValidateCode}
                        disabled={isValidatingCode || !codeInput.trim()}
                        className={cn(
                          "inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-cta px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-cta/90 disabled:opacity-50 dark:text-background",
                          FOCUS
                        )}
                      >
                        {isValidatingCode ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          t.codeValidation.apply
                        )}
                      </button>
                    </div>
                    {codeError && (
                      <p className="mt-1.5 px-1 text-xs text-destructive">{codeError}</p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-full bg-success/10 py-1.5 pl-4 pr-1.5">
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      {validatedCode.type === "gift_card" ? (
                        <Gift className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                      ) : (
                        <Tag className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                      )}
                      <span className="truncate font-mono font-semibold text-foreground">
                        {validatedCode.code}
                      </span>
                      <span className="shrink-0 font-semibold text-success">
                        {validatedCode.type === "gift_card"
                          ? `-${discount}€`
                          : validatedCode.type === "referral"
                            ? ""
                            : validatedCode.percentage
                              ? `-${validatedCode.percentage}%`
                              : ""}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCode}
                      aria-label={t.a11y.remove}
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground transition-colors hover:text-destructive",
                        FOCUS
                      )}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
                {/* A friend's code takes no money off: it explains what the customer gets. */}
                {validatedCode?.type === "referral" && (
                  <p className="mt-1.5 px-1 text-xs text-muted-foreground">
                    {t.codeValidation.referralPerk ?? t.codeValidation.validDiscount}
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Column 2: what is being requested, and what it costs. */}
        <div className="space-y-5">
          <section
            aria-label={t.reviewSummary?.title || "Resumen de tu reserva"}
            className="rounded-3xl border border-border p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <h3 className="text-sm font-semibold text-foreground">
                {t.reviewSummary?.title || "Resumen de tu reserva"}
              </h3>
              <button
                type="button"
                onClick={() => onGoToStep(1)}
                className={cn(
                  "inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted",
                  FOCUS
                )}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                {t.reviewSummary?.modifyShort || "Editar"}
              </button>
            </div>
            <ul className="space-y-2.5">
              {summaryRows.map(({ icon: Icon, label, value }) => (
                <li key={label} className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-muted-foreground first-letter:uppercase">
                      {label}
                    </span>
                    <span className="block text-sm font-semibold leading-snug text-foreground">
                      {value}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            {/* Explicit fuel signal: licensed boats do not include it, and the surprise at the port is what costs reviews. */}
            {selectedBoatInfo && (
              <p
                className={cn(
                  "mt-3.5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium",
                  fuelIncluded ? "bg-success/10 text-success" : "bg-popular/10 text-popular"
                )}
              >
                <Fuel className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {fuelIncluded
                  ? t.bookingWizard?.fuel?.included || "Combustible incluido"
                  : t.bookingWizard?.fuel?.notIncluded || "Combustible no incluido"}
              </p>
            )}
          </section>

          {total !== null && price !== null && (
            <section
              aria-label={t.endowment?.yourPrice || t.booking.estimatedTotal}
              className="rounded-3xl bg-cta p-5 text-primary-foreground dark:text-background"
            >
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="opacity-80">{t.booking.basePrice}</dt>
                  <dd className="tabular-nums">{price}&euro;</dd>
                </div>
                {totalExtrasPrice > 0 && (
                  <div className="flex justify-between gap-3">
                    <dt className="opacity-80">{t.booking.extrasSection.title}</dt>
                    <dd className="tabular-nums">+{totalExtrasPrice}&euro;</dd>
                  </div>
                )}
                {discount > 0 && validatedCode && (
                  <div className="flex justify-between gap-3">
                    <dt className="opacity-80">{validatedCode.code}</dt>
                    <dd className="tabular-nums">-{discount}&euro;</dd>
                  </div>
                )}
              </dl>
              <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-current/20 pt-3">
                <span className="text-sm font-medium">{t.endowment?.yourPrice || "Total"}</span>
                <span className="font-heading text-3xl font-semibold leading-none tabular-nums">
                  {total}&euro;
                </span>
              </div>
              {depositAmount && (
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-dashed border-current/20 pt-3 text-sm">
                  <span className="opacity-80">
                    {t.pricing?.depositLabel || "Fianza"} (
                    {t.pricing?.depositRefundable || "reembolsable"})
                  </span>
                  <span className="font-semibold tabular-nums">{depositAmount}&euro;</span>
                </div>
              )}
              {/* Last chance at the cover, offered where the deposit stops being abstract. Only the label is
                  translated: the two figures say the rest in any language. */}
              {!reducedDeposit && depositCover && reducedDepositAmount > 0 && (
                <button
                  type="button"
                  onClick={() => onGoToStep(coveragesStep)}
                  data-testid="final-reduce-deposit"
                  className="mt-3 flex min-h-11 w-full items-center justify-between gap-3 rounded-full bg-current/10 px-4 text-left text-xs transition-colors hover:bg-current/20 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none"
                >
                  <span className="font-medium">
                    {t.booking.coverages.depositName}: {reducedDepositAmount}&euro;
                  </span>
                  <span className="flex items-center gap-1 whitespace-nowrap font-bold">
                    +{depositCover.price}&euro;
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </button>
              )}
              <p className="mt-3 text-xs leading-snug opacity-80">
                {t.booking.priceConfirmedWhatsApp}
              </p>
              {depositAmount && (
                <p className="mt-0.5 text-xs leading-snug opacity-80">
                  {t.pricing?.payAtPort || "Se paga y devuelve en el puerto"}
                </p>
              )}
            </section>
          )}
        </div>
      </div>

      <ValueStack
        requiresLicense={!!selectedBoatInfo?.requiresLicense}
        isExcursion={selectedBoatInfo?.id === "excursion-privada"}
        t={t}
      />

      <GdprConsentText t={t} variant="desktop" />
    </div>
  );
}
