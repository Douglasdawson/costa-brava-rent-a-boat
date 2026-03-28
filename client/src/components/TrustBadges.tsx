import { Star, Shield, MapPin, Award } from "lucide-react";
import type { Translations } from "@/lib/translations";

interface TrustBadgesProps {
  t: Translations;
}

export function TrustBadges({ t }: TrustBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted border border-border px-2 py-1 rounded-full">
        <Star className="w-3 h-3 fill-amber-400 text-amber-400" aria-hidden="true" />
        {t.trustEscalation?.googleRating || "4.8 en Google"}
      </span>
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted border border-border px-2 py-1 rounded-full">
        <MapPin className="w-3 h-3 text-cta" aria-hidden="true" />
        {t.trustEscalation?.officialPort || "Puerto oficial de Blanes"}
      </span>
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted border border-border px-2 py-1 rounded-full">
        <Shield className="w-3 h-3 text-cta" aria-hidden="true" />
        {t.trustEscalation?.fullInsurance || "Seguro completo"}
      </span>
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted border border-border px-2 py-1 rounded-full">
        <Award className="w-3 h-3 text-cta" aria-hidden="true" />
        {t.trustEscalation?.yearsExperience || "5 anos de experiencia"}
      </span>
    </div>
  );
}
