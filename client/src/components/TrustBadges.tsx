import { Star, Shield, MapPin, Award } from "lucide-react";
import type { Translations } from "@/lib/translations";
import { GBP_PROFILE_URL } from "@shared/businessProfile";

interface TrustBadgesProps {
  t: Translations;
}

/**
 * Authority strip used on /garantias and inside the boat detail card.
 *
 * Laid out as an equal-width grid, not a flex-wrap row: the four claims carry
 * the same weight, and sized to their own text they made a ragged line that
 * left the container half empty. Two columns on phones, four from `sm`. Grid
 * items stretch by default, so a badge whose text wraps to two lines sets the
 * height for the whole row and they stay rectangles of one size.
 */
export function TrustBadges({ t }: TrustBadgesProps) {
  const badges = [
    {
      Icon: Star,
      iconClass: "fill-amber-400 text-amber-400",
      label: t.trustEscalation?.googleRating || "4.8 en Google",
      href: GBP_PROFILE_URL,
    },
    {
      Icon: MapPin,
      iconClass: "text-cta",
      label: t.trustEscalation?.officialPort || "Puerto oficial de Blanes",
    },
    {
      Icon: Shield,
      iconClass: "text-cta",
      label: t.trustEscalation?.fullInsurance || "Seguro completo",
    },
    {
      Icon: Award,
      iconClass: "text-cta",
      label: t.trustEscalation?.yearsExperience || "5 años de experiencia",
    },
  ];

  // `rounded-full` would read as a lozenge once the text wraps; at this size a
  // large radius keeps the pill feel and survives two lines.
  const base =
    "flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-muted px-3 py-2 text-center text-xs leading-snug text-muted-foreground";

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {badges.map(({ Icon, iconClass, label, href }) => {
        const content = (
          <>
            <Icon className={`h-3 w-3 shrink-0 ${iconClass}`} aria-hidden="true" />
            <span className="text-balance">{label}</span>
          </>
        );
        return href ? (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${base} transition-colors hover:border-foreground/40`}
          >
            {content}
          </a>
        ) : (
          <span key={label} className={base}>
            {content}
          </span>
        );
      })}
    </div>
  );
}
