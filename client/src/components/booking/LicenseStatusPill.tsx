import { CheckCircle2, ShieldCheck, AlertTriangle, Info } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { getCountryDisplayName, findCountry } from "@/utils/license-countries";
import type { LicenseVerificationStatus } from "@shared/nauticalLicenseRules";

interface LicenseStatusPillProps {
  country: string;
  status: LicenseVerificationStatus;
  onChange: () => void;
}

const COLOR_TRANSITION = "transition-[background-color,border-color,color] duration-150";

export default function LicenseStatusPill({ country, status, onChange }: LicenseStatusPillProps) {
  const { language } = useLanguage();
  const t = useTranslations();
  const tv = t.bookingWizard?.licenseVerifier;

  const theme = {
    valid: {
      Icon: CheckCircle2,
      iconColor: "text-[hsl(142_76%_30%)]",
      bgColor: "bg-[hsl(142_55%_96%)]",
      borderColor: "border-[hsl(142_45%_82%)]",
      short: tv?.pill?.valid ?? "Válida",
    },
    probably_valid: {
      Icon: ShieldCheck,
      iconColor: "text-[hsl(38_92%_36%)]",
      bgColor: "bg-[hsl(38_92%_96%)]",
      borderColor: "border-[hsl(38_70%_82%)]",
      short: tv?.pill?.probablyValid ?? "Probablemente válida",
    },
    needs_icc: {
      Icon: Info,
      iconColor: "text-[hsl(38_92%_36%)]",
      bgColor: "bg-[hsl(38_92%_96%)]",
      borderColor: "border-[hsl(38_70%_82%)]",
      short: tv?.pill?.needsIcc ?? "Necesita ICC",
    },
    not_recognized: {
      Icon: AlertTriangle,
      iconColor: "text-[hsl(0_75%_42%)]",
      bgColor: "bg-[hsl(0_65%_96%)]",
      borderColor: "border-[hsl(0_50%_85%)]",
      short: tv?.pill?.notRecognized ?? "No reconocida",
    },
    insufficient: {
      Icon: AlertTriangle,
      iconColor: "text-[hsl(0_75%_42%)]",
      bgColor: "bg-[hsl(0_65%_96%)]",
      borderColor: "border-[hsl(0_50%_85%)]",
      short: tv?.pill?.insufficient ?? "Insuficiente",
    },
    unknown: {
      Icon: Info,
      iconColor: "text-foreground/70",
      bgColor: "bg-card",
      borderColor: "border-border",
      short: tv?.pill?.unknown ?? "Sin verificar",
    },
  } as const;

  const t1 = theme[status];
  const Icon = t1.Icon;
  const countryEntry = country ? findCountry(country) : undefined;
  const countryName = country ? getCountryDisplayName(country, language) : "";

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="license-status-pill"
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border ${t1.borderColor} ${t1.bgColor}`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${t1.iconColor}`} aria-hidden />
      <div className="min-w-0 flex-1">
        {countryName && (
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-foreground/70 truncate">
            {countryEntry?.flag} {countryName}
          </p>
        )}
        <p className={`text-[13px] font-semibold leading-tight ${t1.iconColor} truncate`}>
          {t1.short}
        </p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`text-[12px] font-medium text-foreground/70 hover:text-foreground underline-offset-2 hover:underline shrink-0 inline-flex items-center min-h-11 px-2 -my-2 ${COLOR_TRANSITION}`}
      >
        {tv?.change ?? "Cambiar"}
      </button>
    </div>
  );
}
