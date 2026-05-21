import { useEffect, useMemo, useRef, useState, useDeferredValue } from "react";
import {
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Info,
  Search,
  ChevronDown,
  Loader2,
  WifiOff,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { openWhatsApp } from "@/utils/whatsapp";
import { LICENSE_COUNTRIES, getCountryDisplayName, findCountry } from "@/utils/license-countries";
import {
  isEeeCountry,
  getLicensesForCountry,
  findLicense,
  getDefaultCountryForLanguage,
  type LicenseVerificationStatus,
  type SpanishLicenseLevel,
} from "@shared/nauticalLicenseRules";
import type { UseLicenseVerifierResult } from "@/hooks/useLicenseVerifier";

interface LicenseVerifierPanelProps {
  verifier: UseLicenseVerifierResult;
}

const SPANISH_LEVEL_LABEL: Record<SpanishLicenseLevel, string> = {
  navegacion: "LBN",
  pnb: "PNB",
  per: "PER",
  patron_yate: "Patrón de Yate",
  capitan_yate: "Capitán de Yate",
};

// Entry animation that respects prefers-reduced-motion. Reused across the
// filling form, the country picker dropdown, and the summary card. Slight
// overshoot easing gives the summary a satisfying confirm-feel.
const FADE_IN_TOP = "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-150";
const FADE_IN_TOP_BOUNCY = "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.34,1.56,0.64,1)]";
const COLOR_TRANSITION = "transition-[background-color,border-color,color] duration-150";
const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function tinyHaptic() {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try { navigator.vibrate(8); } catch { /* iOS Safari without Web Vibration */ }
  }
}

export default function LicenseVerifierPanel({ verifier }: LicenseVerifierPanelProps) {
  const { language } = useLanguage();
  const t = useTranslations();
  const tv = t.bookingWizard?.licenseVerifier;
  const isMobile = useIsMobile();

  const { state, setCountry, setLicenseCode, setHasIcc, verify, resetStatus, dismiss, undismiss } = verifier;
  const isEee = state.country ? isEeeCountry(state.country) : false;
  const isIccCode = state.licenseCode === "icc";

  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const deferredSearch = useDeferredValue(countrySearch);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (isEee && state.hasIcc !== null) setHasIcc(null);
  }, [isEee, state.hasIcc, setHasIcc]);

  useEffect(() => {
    if (isIccCode && state.hasIcc !== null) setHasIcc(null);
  }, [isIccCode, state.hasIcc, setHasIcc]);

  // Pre-fill country from active UI language on first mount, only if empty.
  useEffect(() => {
    if (!state.country) {
      const def = getDefaultCountryForLanguage(language);
      if (def) setCountry(def);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCountries = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return LICENSE_COUNTRIES;
    return LICENSE_COUNTRIES.filter((c) => {
      const haystack = `${c.iso2} ${getCountryDisplayName(c.iso2, language)} ${getCountryDisplayName(c.iso2, "en")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [deferredSearch, language]);

  const catalogue = useMemo(
    () => getLicensesForCountry(state.country),
    [state.country],
  );

  const needsIccQuestion = !!state.country && !isEee && !!state.licenseCode && !isIccCode;

  const canVerify = useMemo(() => {
    if (!state.country || !state.licenseCode) return false;
    if (needsIccQuestion && state.hasIcc === null) return false;
    return true;
  }, [state, needsIccQuestion]);

  const selectedCountry = state.country ? findCountry(state.country) : undefined;
  const selectedCountryName = state.country ? getCountryDisplayName(state.country, language) : "";

  function handleVerify() {
    if (!canVerify || isVerifying) return;
    setIsVerifying(true);
    // 250ms artificial latency: makes the verify feel like the system worked
    // for the customer instead of an instant snap. Long enough to register,
    // short enough to never feel slow.
    window.setTimeout(() => {
      verify();
      setIsVerifying(false);
      tinyHaptic();
    }, 250);
  }

  function handleChange() {
    resetStatus();
    undismiss();
  }

  function handleCountrySelect(iso2: string) {
    setCountry(iso2);
    setCountryOpen(false);
    setCountrySearch("");
  }

  /* ────────────── Summary view (collapsed) ────────────── */
  if (state.status !== null) {
    return (
      <SummaryView
        country={state.country}
        countryName={selectedCountryName}
        flag={selectedCountry?.flag ?? ""}
        status={state.status}
        spanishEquivalent={state.spanishEquivalent}
        licenseCode={state.licenseCode}
        onChange={handleChange}
      />
    );
  }

  /* ────────────── Filling view ────────────── */
  return (
    <section
      aria-label={tv?.panelEyebrow ?? "Verifica tu licencia"}
      className={`p-4 sm:p-5 rounded-2xl bg-card/40 space-y-6 ${FADE_IN_TOP}`}
    >
      {/* Eyebrow + helper */}
      <header className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-foreground/65">
          {tv?.panelEyebrow ?? "Verifica tu licencia · 30 s"}
        </p>
        <p className="text-sm text-foreground/75 leading-snug">
          {tv?.panelHelper ?? "Comprueba si tu título sirve para alquilar en España."}
        </p>
      </header>

      {/* Country picker */}
      <FieldSection label={tv?.countryLabel ?? "País que emitió tu licencia"}>
        <button
          type="button"
          onClick={() => setCountryOpen(true)}
          aria-expanded={countryOpen}
          aria-haspopup={isMobile ? "dialog" : "listbox"}
          className={[
            "flex w-full items-center justify-between gap-3 border border-input bg-background px-3.5 h-11 text-[15px] text-foreground hover:border-foreground/30 rounded-md active:scale-[0.99] transform-gpu",
            !isMobile && countryOpen ? "rounded-b-none border-b-0" : "",
            FOCUS_RING,
            COLOR_TRANSITION,
          ].join(" ")}
        >
          {selectedCountry ? (
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="text-lg leading-none" aria-hidden>{selectedCountry.flag}</span>
              <span className="truncate font-medium">{selectedCountryName}</span>
            </span>
          ) : (
            <span className="text-foreground/55 font-normal">
              {tv?.countryPlaceholder ?? "Selecciona un país"}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 shrink-0 text-foreground/55 ${countryOpen && !isMobile ? "rotate-180" : ""} ${COLOR_TRANSITION}`}
            aria-hidden
          />
        </button>

        {/* Mobile: bottom sheet. Desktop: inline expand. */}
        {isMobile ? (
          <CountrySheet
            open={countryOpen}
            onOpenChange={(v) => {
              setCountryOpen(v);
              if (!v) setCountrySearch("");
            }}
            countries={filteredCountries}
            search={countrySearch}
            onSearch={setCountrySearch}
            searchPlaceholder={tv?.countrySearchPlaceholder ?? "Buscar país..."}
            emptyText={tv?.countryNotFound ?? "No se encontraron países."}
            sheetTitle={tv?.countryLabel ?? "País que emitió tu licencia"}
            selected={state.country}
            language={language}
            onSelect={handleCountrySelect}
          />
        ) : (
          countryOpen && (
            <CountryListInline
              search={countrySearch}
              onSearch={setCountrySearch}
              searchPlaceholder={tv?.countrySearchPlaceholder ?? "Buscar país..."}
              emptyText={tv?.countryNotFound ?? "No se encontraron países."}
              countries={filteredCountries}
              selected={state.country}
              language={language}
              onSelect={handleCountrySelect}
            />
          )
        )}
      </FieldSection>

      {/* License chips */}
      {state.country && (
        <FieldSection label={tv?.licenseTypeLabel ?? "Tipo de licencia"}>
          <div
            role="radiogroup"
            aria-label={tv?.licenseTypeLabel ?? "Tipo de licencia"}
            className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${FADE_IN_TOP}`}
          >
            {catalogue.map((lic) => {
              const selected = state.licenseCode === lic.code;
              const equivLabel = lic.spanishEquivalent
                ? `≈ ${SPANISH_LEVEL_LABEL[lic.spanishEquivalent]}`
                : null;
              return (
                <button
                  key={lic.code}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setLicenseCode(lic.code)}
                  aria-label={equivLabel ? `${lic.label}, ${equivLabel}` : lic.label}
                  className={[
                    "text-left px-3.5 py-3 min-h-[68px] rounded-xl leading-snug active:scale-[0.98] transform-gpu",
                    selected
                      ? "bg-foreground text-white border border-foreground"
                      : "bg-background text-foreground/85 border border-border hover:border-foreground/25",
                    FOCUS_RING,
                    COLOR_TRANSITION,
                    "transition-transform",
                  ].join(" ")}
                >
                  <p className="text-[14px] font-medium line-clamp-2">{lic.label}</p>
                  {equivLabel && (
                    <p
                      className={[
                        "text-[11px] mt-0.5 uppercase tracking-[0.05em]",
                        selected ? "text-white/75" : "text-foreground/60",
                      ].join(" ")}
                    >
                      {equivLabel}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </FieldSection>
      )}

      {/* ICC question — non-EEE + non-ICC chip */}
      {needsIccQuestion && (
        <fieldset className={`m-0 p-0 border-0 space-y-2 ${FADE_IN_TOP}`}>
          <legend className="text-[11px] font-medium uppercase tracking-[0.08em] text-foreground/65">
            {tv?.hasIccLabel ?? "¿Tienes un ICC (International Certificate of Competence)?"}
          </legend>
          <div
            role="radiogroup"
            aria-label={tv?.hasIccLabel ?? "¿Tienes un ICC?"}
            className="grid grid-cols-2 gap-1 p-1 rounded-full border border-input bg-background"
          >
            <SegmentButton
              selected={state.hasIcc === true}
              onClick={() => setHasIcc(true)}
              label={tv?.hasIccYes ?? "Sí"}
            />
            <SegmentButton
              selected={state.hasIcc === false}
              onClick={() => setHasIcc(false)}
              label={tv?.hasIccNo ?? "No"}
            />
          </div>
        </fieldset>
      )}

      {/* Actions — sticky on mobile so Verify never falls below the fold */}
      <div className="sticky bottom-0 -mx-4 sm:-mx-5 px-4 sm:px-5 pb-safe pt-3 bg-card/85 backdrop-blur-sm flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 sm:bg-transparent sm:backdrop-blur-none sm:static sm:p-0 sm:mx-0 sm:pb-0">
        <button
          type="button"
          onClick={() => dismiss()}
          className={`text-sm text-foreground/65 hover:text-foreground underline-offset-4 hover:underline self-center sm:self-start min-h-11 inline-flex items-center -my-2.5 ${FOCUS_RING} ${COLOR_TRANSITION}`}
        >
          {tv?.skip ?? "Lo verifico más tarde"}
        </button>
        <Button
          type="button"
          onClick={handleVerify}
          disabled={!canVerify || isVerifying}
          className="rounded-full px-7 h-11 font-semibold transition-opacity duration-150"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden />
              {tv?.verify ?? "Verificar"}
            </>
          ) : (
            tv?.verify ?? "Verificar"
          )}
        </Button>
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] leading-relaxed text-foreground/65 pt-1 border-t border-border/60">
        {tv?.disclaimer ?? "Información orientativa basada en el Real Decreto 875/2014. La autorización final depende de la Capitanía Marítima."}{" "}
        <a
          href="https://www.boe.es/eli/es/rd/2014/10/10/875"
          target="_blank"
          rel="noopener noreferrer"
          className={`underline underline-offset-2 hover:text-foreground inline-block py-1.5 -my-1.5 ${FOCUS_RING} ${COLOR_TRANSITION}`}
        >
          {tv?.disclaimerLink ?? "Ver norma"}
        </a>
      </p>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
   Summary view
   ────────────────────────────────────────────────────────── */

function SummaryView({
  country,
  countryName,
  flag,
  status,
  spanishEquivalent,
  licenseCode,
  onChange,
}: {
  country: string;
  countryName: string;
  flag: string;
  status: LicenseVerificationStatus;
  spanishEquivalent: SpanishLicenseLevel | null;
  licenseCode: string;
  onChange: () => void;
}) {
  const t = useTranslations();
  const tv = t.bookingWizard?.licenseVerifier;
  const { language } = useLanguage();
  const online = useOnlineStatus();

  const theme = {
    valid: {
      Icon: CheckCircle2,
      iconColor: "text-[hsl(142_76%_30%)]",
      bgColor: "bg-[hsl(142_55%_96%)]",
      borderColor: "border-[hsl(142_45%_82%)]",
      short: tv?.pill?.valid ?? "Válida",
      tone: "positive" as const,
    },
    probably_valid: {
      Icon: ShieldCheck,
      iconColor: "text-[hsl(38_92%_36%)]",
      bgColor: "bg-[hsl(38_92%_96%)]",
      borderColor: "border-[hsl(38_70%_82%)]",
      short: tv?.pill?.probablyValid ?? "Probablemente válida",
      tone: "neutral" as const,
    },
    needs_icc: {
      Icon: Info,
      iconColor: "text-[hsl(38_92%_36%)]",
      bgColor: "bg-[hsl(38_92%_96%)]",
      borderColor: "border-[hsl(38_70%_82%)]",
      short: tv?.pill?.needsIcc ?? "Necesita ICC",
      tone: "neutral" as const,
    },
    insufficient: {
      Icon: AlertTriangle,
      iconColor: "text-[hsl(0_75%_42%)]",
      bgColor: "bg-[hsl(0_65%_96%)]",
      borderColor: "border-[hsl(0_50%_85%)]",
      short: tv?.pill?.insufficient ?? "Insuficiente",
      tone: "negative" as const,
    },
    not_recognized: {
      Icon: AlertTriangle,
      iconColor: "text-[hsl(0_75%_42%)]",
      bgColor: "bg-[hsl(0_65%_96%)]",
      borderColor: "border-[hsl(0_50%_85%)]",
      short: tv?.pill?.notRecognized ?? "No reconocida",
      tone: "negative" as const,
    },
    unknown: {
      Icon: Info,
      iconColor: "text-foreground/70",
      bgColor: "bg-card",
      borderColor: "border-border",
      short: tv?.pill?.unknown ?? "Sin verificar",
      tone: "neutral" as const,
    },
  } as const;

  const s = theme[status];
  const Icon = s.Icon;

  const lic = country && licenseCode ? findLicense(country, licenseCode) : undefined;
  const nativeLabel = lic?.label ?? "";

  const equivBlock = (() => {
    if (!spanishEquivalent) return null;
    const level = SPANISH_LEVEL_LABEL[spanishEquivalent];
    const template = tv?.equivalentTo ?? "Equivale a {level} en el sistema español";
    return template.replace("{level}", level);
  })();

  const fleetBlock = (() => {
    if (status === "valid" || status === "probably_valid") {
      return tv?.meetsFleet ?? "Válida para nuestra flota con licencia.";
    }
    if (status === "insufficient") {
      return tv?.insufficientForFleet ?? "Insuficiente para nuestra flota. Necesitas PER o superior.";
    }
    return null;
  })();

  function handleWhatsApp() {
    const msg = (tv?.whatsappTemplate ?? "Hola, tengo licencia náutica de {country} y quiero confirmar si sirve para alquilar.").replace(
      "{country}",
      countryName || getCountryDisplayName(country, language),
    );
    openWhatsApp(msg);
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="license-status-summary"
      className={`rounded-2xl border ${s.borderColor} ${s.bgColor} p-4 space-y-3 ${FADE_IN_TOP_BOUNCY}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${s.iconColor}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-foreground/70 truncate">
            {flag} {countryName}{nativeLabel ? ` · ${nativeLabel}` : ""}
          </p>
          <p className={`text-[14px] font-semibold leading-tight mt-0.5 ${s.iconColor}`}>
            {s.short}
          </p>
          {(equivBlock || fleetBlock) && (
            <p className="text-[13px] leading-relaxed text-foreground/75 mt-1.5">
              {equivBlock}
              {equivBlock && fleetBlock ? " · " : ""}
              {fleetBlock}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onChange}
          className={`text-[12px] font-medium text-foreground/65 hover:text-foreground underline-offset-2 hover:underline shrink-0 inline-flex items-center min-h-11 px-2 -my-2 ${FOCUS_RING} ${COLOR_TRANSITION}`}
        >
          {tv?.change ?? "Cambiar"}
        </button>
      </div>

      {s.tone === "negative" && (
        <div className="space-y-2">
          {!online && (
            <p
              role="status"
              aria-live="polite"
              className={`flex items-start gap-1.5 text-[12px] leading-snug text-foreground/70 ${FADE_IN_TOP}`}
            >
              <WifiOff className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
              <span>{tv?.offlineHint ?? "Sin conexión. WhatsApp se abrirá igualmente y enviará el mensaje cuando vuelvas online."}</span>
            </p>
          )}
          <button
            type="button"
            onClick={handleWhatsApp}
            className={`flex items-center justify-center gap-2 w-full h-11 rounded-full bg-[#25D366] hover:bg-[#1FB759] text-white text-sm font-semibold active:scale-[0.98] transform-gpu transition-transform ${FOCUS_RING} ${COLOR_TRANSITION}`}
          >
            <SiWhatsapp className="w-4 h-4" />
            {tv?.ctaWhatsApp ?? "Contactar por WhatsApp"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Shared helpers
   ────────────────────────────────────────────────────────── */

function FieldSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-foreground/65">
        {label}
      </p>
      {children}
    </div>
  );
}

function SegmentButton({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={[
        "h-11 rounded-full text-sm font-semibold active:scale-[0.97] transform-gpu",
        selected
          ? "bg-foreground text-white"
          : "bg-transparent text-foreground/70 hover:text-foreground",
        FOCUS_RING,
        COLOR_TRANSITION,
        "transition-transform",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────
   Country pickers — mobile (Sheet) + desktop (inline)
   ────────────────────────────────────────────────────────── */

interface CountryPickerSharedProps {
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder: string;
  emptyText: string;
  countries: typeof LICENSE_COUNTRIES;
  selected: string;
  language: string;
  onSelect: (iso2: string) => void;
}

function CountrySheet({
  open,
  onOpenChange,
  sheetTitle,
  ...props
}: CountryPickerSharedProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheetTitle: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="p-0 h-[85vh] rounded-t-2xl flex flex-col"
        aria-describedby={undefined}
      >
        <div className="px-4 pt-5 pb-3 border-b border-border bg-background sticky top-0 z-10">
          <SheetTitle className="text-[15px] font-semibold mb-3 pr-8">
            {sheetTitle}
          </SheetTitle>
          <SearchInput
            value={props.search}
            onChange={props.onSearch}
            placeholder={props.searchPlaceholder}
            autoFocus
          />
        </div>
        <CountryList
          {...props}
          virtualized
          // height fills the remaining sheet space
        />
      </SheetContent>
    </Sheet>
  );
}

function CountryListInline(props: CountryPickerSharedProps) {
  return (
    <div className={`rounded-b-md border border-t-input/70 border-input bg-background overflow-hidden ${FADE_IN_TOP}`}>
      <div className="px-3 h-11 border-b border-input/70 bg-card/40 flex items-center gap-2">
        <Search className="w-3.5 h-3.5 text-foreground/55 shrink-0" aria-hidden />
        <SearchInput
          value={props.search}
          onChange={props.onSearch}
          placeholder={props.searchPlaceholder}
          variant="inline"
          autoFocus
        />
      </div>
      <CountryList {...props} virtualized={false} />
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
  autoFocus,
  variant = "boxed",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  variant?: "boxed" | "inline";
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      const id = requestAnimationFrame(() => ref.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [autoFocus]);

  // iOS zoom prevention requires explicit 16px (text-base). text-sm = 14px
  // would trigger Safari's auto-zoom on focus.
  const cls =
    variant === "boxed"
      ? `flex items-center gap-2 w-full h-11 px-3 rounded-md border border-input bg-background ${FOCUS_RING}`
      : "flex-1 bg-transparent";

  if (variant === "boxed") {
    return (
      <div className={cls}>
        <Search className="w-4 h-4 text-foreground/55 shrink-0" aria-hidden />
        <input
          ref={ref}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-base placeholder:text-foreground/55 focus:outline-none"
          aria-label={placeholder}
        />
      </div>
    );
  }
  return (
    <input
      ref={ref}
      type="search"
      inputMode="search"
      enterKeyHint="search"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="flex-1 bg-transparent text-base placeholder:text-foreground/55 focus:outline-none h-11"
      aria-label={placeholder}
    />
  );
}

function CountryList({
  countries,
  selected,
  language,
  onSelect,
  emptyText,
  virtualized,
}: CountryPickerSharedProps & { virtualized: boolean }) {
  const parentRef = useRef<HTMLUListElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: countries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 6,
    enabled: virtualized,
  });

  if (countries.length === 0) {
    return <p className="px-3 py-6 text-center text-sm text-foreground/65">{emptyText}</p>;
  }

  if (!virtualized) {
    return (
      <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
        {countries.map((c) => (
          <CountryRow
            key={c.iso2}
            iso2={c.iso2}
            flag={c.flag}
            isSelected={c.iso2 === selected}
            label={getCountryDisplayName(c.iso2, language)}
            onSelect={onSelect}
          />
        ))}
      </ul>
    );
  }

  return (
    <ul
      ref={parentRef}
      role="listbox"
      className="flex-1 overflow-y-auto overscroll-contain"
      style={{ contain: "strict" }}
    >
      <li
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
        aria-hidden
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const c = countries[virtualRow.index];
          return (
            <div
              key={c.iso2}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <CountryRow
                iso2={c.iso2}
                flag={c.flag}
                isSelected={c.iso2 === selected}
                label={getCountryDisplayName(c.iso2, language)}
                onSelect={onSelect}
              />
            </div>
          );
        })}
      </li>
    </ul>
  );
}

function CountryRow({
  iso2,
  flag,
  isSelected,
  label,
  onSelect,
}: {
  iso2: string;
  flag: string;
  isSelected: boolean;
  label: string;
  onSelect: (iso2: string) => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={() => onSelect(iso2)}
      className={[
        "flex w-full items-center gap-2.5 px-4 py-3 text-left text-[15px] min-h-11 active:scale-[0.99] transform-gpu",
        isSelected
          ? "bg-cta/10 text-foreground font-medium"
          : "text-foreground/90 hover:bg-card/60",
        FOCUS_RING,
        COLOR_TRANSITION,
        "transition-transform",
      ].join(" ")}
    >
      <span className="text-lg leading-none" aria-hidden>{flag}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}
