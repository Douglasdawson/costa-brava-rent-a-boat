import { useLanguage } from "@/hooks/use-language";
import type { Translations } from "@/lib/translations";

/**
 * Passive RGPD consent line of the final wizard step, shared by the mobile and
 * desktop wizards (both used to carry their own copy of this markup, torn apart
 * with chained split() calls).
 *
 * Three documents, three different things — do not collapse them:
 *   privacyPolicy        → how the data is processed.
 *   condicionesGenerales → the rental contract clauses, mirror of what the client
 *                          signs in the CRM. This is what the booking is bound by.
 *   termsConditions      → the site's terms of contracting (booking process,
 *                          deposit, shop, jurisdiction). The only one translated
 *                          into all 8 locales, which is why it is linked too: the
 *                          contract text itself is Spanish-only.
 *
 * Splitting on a placeholder regex instead of nesting split()s lets each locale
 * put the three links in whatever order its grammar needs.
 */
const PLACEHOLDERS = /(\{privacyPolicy\}|\{termsAndConditions\}|\{siteTerms\})/;

const FALLBACK_ES =
  "Al enviar esta solicitud, aceptas nuestra {privacyPolicy}, las {termsAndConditions} y los {siteTerms}.";

const LINK_CLASS = {
  mobile: "text-primary underline",
  desktop: "text-foreground underline hover:text-foreground/80",
} as const;

interface GdprConsentTextProps {
  t: Translations;
  /** Accent token: the mobile wizard uses `primary`, the desktop one `foreground`. */
  variant?: "mobile" | "desktop";
}

export default function GdprConsentText({ t, variant = "mobile" }: GdprConsentTextProps) {
  const { localizedPath } = useLanguage();
  const linkClass = LINK_CLASS[variant];

  const targets: Record<string, { href: string; label: string }> = {
    "{privacyPolicy}": {
      href: localizedPath("privacyPolicy"),
      label: t.booking.gdprPrivacyLink,
    },
    "{termsAndConditions}": {
      href: localizedPath("condicionesGenerales"),
      label: t.booking.gdprTermsLink,
    },
    "{siteTerms}": {
      href: localizedPath("termsConditions"),
      label: t.booking.gdprSiteTermsLink ?? "Términos y Condiciones",
    },
  };

  const template = t.booking.gdprPassive || FALLBACK_ES;

  return (
    <p className="text-xs text-muted-foreground leading-relaxed text-center">
      {template.split(PLACEHOLDERS).map((chunk, i) => {
        const target = targets[chunk];
        if (!target) return chunk;
        return (
          <a
            key={`${chunk}-${i}`}
            href={target.href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {target.label}
          </a>
        );
      })}
    </p>
  );
}
