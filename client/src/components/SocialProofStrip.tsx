import { Star } from "lucide-react";
import { useTranslations } from "@/lib/translations";

export function SocialProofStrip() {
  const t = useTranslations();

  return (
    <div className="bg-background border-y border-border/50">
      <div className="container mx-auto px-4 py-4 sm:py-5">
        <div className="flex flex-wrap items-center justify-center gap-x-4 xs:gap-x-6 sm:gap-x-8 gap-y-2 xs:gap-y-3 text-xs xs:text-sm text-muted-foreground">
          {/* Google Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < 5 ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="font-medium text-foreground">4.8</span>
            <span>{t.socialProof.googleReviews}</span>
          </div>

          {/* Separator (hidden on mobile) */}
          <span className="hidden sm:inline text-border">|</span>

          {/* Customer count */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">+2.000</span>
            <span>{t.socialProof.happyCustomers}</span>
          </div>

          <span className="hidden sm:inline text-border">|</span>

          {/* Experience */}
          <div className="flex items-center gap-1.5">
            <span>{t.socialProof.since2020}</span>
          </div>

          <span className="hidden sm:inline text-border">|</span>

          {/* Free cancellation */}
          <div className="flex items-center gap-1.5">
            <span>{t.socialProof.freeCancellation}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
