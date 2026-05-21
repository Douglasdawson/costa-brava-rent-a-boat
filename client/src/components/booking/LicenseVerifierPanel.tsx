import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Info,
  Search,
  ChevronDown,
} from "lucide-react";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { openWhatsApp } from "@/utils/whatsapp";
import { LICENSE_COUNTRIES, getCountryDisplayName, findCountry } from "@/utils/license-countries";
import {
  isEeeCountry,
  getLicensesForCountry,
  findLicense,
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

const FADE_IN_TOP = "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-150";
const COLOR_TRANSITION = "transition-[background-color,border-color,color] duration-150";

export default function LicenseVerifierPanel({ verifier }: LicenseVerifierPanelProps) {
  const { language } = useLanguage();
  const t = useTranslations();
  const tv = t.bookingWizard?.licenseVerifier;

  const { state, setCountry, setLicenseCode, setHasIcc, verify, resetStatus, dismiss, undismiss } = verifier;
  const isEee = state.country ? isEeeCountry(state.country) : false;
  const isIccCode = state.licenseCode === "icc";

  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  useEffect(() => {
    if (isEee && state.hasIcc !== null) setHasIcc(null);
  }, [isEee, state.hasIcc, setHasIcc]);

  useEffect(() => {
    if (isIccCode && state.hasIcc !== null) setHasIcc(null);
  }, [isIccCode, state.hasIcc, setHasIcc]);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return LICENSE_COUNTRIES;
    return LICENSE_COUNTRIES.filter((c) => {
      const haystack = `${c.iso2} ${getCountryDisplayName(c.iso2, language)} ${getCountryDisplayName(c.iso2, "en")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [countrySearch, language]);

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
    if (!canVerify) return;
    verify();
  }

  function handleChange() {
    resetStatus();
    undismiss();
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
          onClick={() => setCountryOpen((o) => !o)}
          aria-expanded={countryOpen}
          aria-haspopup="listbox"
          className={[
            "flex w-full items-center justify-between gap-3 border border-input bg-background px-3.5 h-11 text-[15px] text-foreground hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
            countryOpen ? "rounded-t-md border-b-0" : "rounded-md",
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
            className={`w-4 h-4 shrink-0 text-foreground/55 ${countryOpen ? "rotate-180" : ""} ${COLOR_TRANSITION}`}
            aria-hidden
          />
        </button>

        {countryOpen && (
          <CountryListInline
            search={countrySearch}
            onSearch={setCountrySearch}
            searchPlaceholder={tv?.countrySearchPlaceholder ?? "Buscar país..."}
            emptyText={tv?.countryNotFound ?? "No se encontraron países."}
            countries={filteredCountries}
            selected={state.country}
            language={language}
            onSelect={(iso2) => {
              setCountry(iso2);
              setCountryOpen(false);
              setCountrySearch("");
            }}
          />
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
                    "text-left px-3.5 py-3 min-h-[68px] rounded-xl leading-snug",
                    selected
                      ? "bg-foreground text-white border border-foreground"
                      : "bg-background text-foreground/85 border border-border hover:border-foreground/25",
                    COLOR_TRANSITION,
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

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          type="button"
          onClick={() => dismiss()}
          className={`text-sm text-foreground/65 hover:text-foreground underline-offset-4 hover:underline self-center sm:self-start min-h-11 inline-flex items-center -my-2.5 ${COLOR_TRANSITION}`}
        >
          {tv?.skip ?? "Lo verifico más tarde"}
        </button>
        <Button
          type="button"
          onClick={handleVerify}
          disabled={!canVerify}
          className="rounded-full px-7 h-11 font-semibold transition-opacity duration-150"
        >
          {tv?.verify ?? "Verificar"}
        </Button>
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] leading-relaxed text-foreground/65 pt-4 border-t border-border/60">
        {tv?.disclaimer ?? "Información orientativa basada en el Real Decreto 875/2014. La autorización final depende de la Capitanía Marítima."}{" "}
        <a
          href="https://www.boe.es/eli/es/rd/2014/10/10/875"
          target="_blank"
          rel="noopener noreferrer"
          className={`underline underline-offset-2 hover:text-foreground inline-block py-1.5 -my-1.5 ${COLOR_TRANSITION}`}
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
    const template = tv?.equivalentTo ?? "Equivale a {level} español";
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
      className={`rounded-2xl border ${s.borderColor} ${s.bgColor} p-4 space-y-3 ${FADE_IN_TOP}`}
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
          className={`text-[12px] font-medium text-foreground/65 hover:text-foreground underline-offset-2 hover:underline shrink-0 inline-flex items-center min-h-11 px-2 -my-2 ${COLOR_TRANSITION}`}
        >
          {tv?.change ?? "Cambiar"}
        </button>
      </div>

      {s.tone === "negative" && (
        <button
          type="button"
          onClick={handleWhatsApp}
          className={`flex items-center justify-center gap-2 w-full h-11 rounded-full bg-[#25D366] hover:bg-[#1FB759] text-white text-sm font-semibold ${COLOR_TRANSITION}`}
        >
          <SiWhatsapp className="w-4 h-4" />
          {tv?.ctaWhatsApp ?? "Contactar por WhatsApp"}
        </button>
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
        "h-11 rounded-full text-sm font-semibold",
        selected
          ? "bg-foreground text-white"
          : "bg-transparent text-foreground/70 hover:text-foreground",
        COLOR_TRANSITION,
      ].join(" ")}
    >
      {label}
    </button>
  );
}

interface CountryListInlineProps {
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder: string;
  emptyText: string;
  countries: typeof LICENSE_COUNTRIES;
  selected: string;
  language: string;
  onSelect: (iso2: string) => void;
}

function CountryListInline({
  search,
  onSearch,
  searchPlaceholder,
  emptyText,
  countries,
  selected,
  language,
  onSelect,
}: CountryListInlineProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className={`rounded-b-md border border-t-input/70 border-input bg-background overflow-hidden ${FADE_IN_TOP}`}>
      <div className="flex items-center gap-2 px-3 h-11 border-b border-input/70 bg-card/40">
        <Search className="w-3.5 h-3.5 text-foreground/55" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="flex-1 bg-transparent text-sm placeholder:text-foreground/55 focus:outline-none h-11"
        />
      </div>
      {countries.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-foreground/65">{emptyText}</p>
      ) : (
        <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
          {countries.map((c) => {
            const isSelected = c.iso2 === selected;
            return (
              <li key={c.iso2}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onSelect(c.iso2)}
                  className={[
                    "flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-[14px] min-h-11",
                    isSelected
                      ? "bg-cta/8 text-foreground font-medium"
                      : "text-foreground/85 hover:bg-card/60",
                    COLOR_TRANSITION,
                  ].join(" ")}
                >
                  <span className="text-base leading-none" aria-hidden>{c.flag}</span>
                  <span className="truncate">{getCountryDisplayName(c.iso2, language)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
