import { CheckCircle, Lock, Star, MapPin, Users } from "lucide-react";
import type { Translations } from "@/lib/translations";

type TrustStage = "browse" | "step1" | "step2" | "step3";

interface BookingTrustBannerProps {
  t: Translations;
  stage?: TrustStage;
}

function getWeeklyBookingsEstimate(): number {
  const now = new Date();
  const month = now.getMonth();
  // Seasonal estimate: Apr-Jun ~12, Jul ~18, Aug ~25, Sep-Oct ~10
  if (month === 7) return 25; // August
  if (month === 6) return 18; // July
  if (month >= 3 && month <= 5) return 12; // Apr-Jun
  if (month === 8 || month === 9) return 10; // Sep-Oct
  return 5; // Off-season
}

export function BookingTrustBanner({ t, stage = "step1" }: BookingTrustBannerProps) {
  if (stage === "browse") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2.5 text-xs sm:text-sm text-green-700 dark:text-green-400 font-medium mb-4">
        <span className="inline-flex items-center gap-1">
          <Star className="w-3.5 h-3.5 flex-shrink-0 fill-amber-400 text-amber-400" />
          {t.trustEscalation?.googleRating || "4.8 en Google"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="w-3.5 h-3.5 flex-shrink-0" />
          {t.trustEscalation?.familiesThisSeason || "100+ familias esta temporada"}
        </span>
      </div>
    );
  }

  if (stage === "step1") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2.5 text-xs sm:text-sm text-green-700 dark:text-green-400 font-medium mb-4">
        <span className="inline-flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {t.bookingTrust?.freeCancellation || "Free cancellation 48h"}
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {t.bookingTrust?.securePayment || "Secure payment"}
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {t.bookingTrust?.insuranceIncluded || "Insurance included"}
        </span>
      </div>
    );
  }

  if (stage === "step2") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2.5 text-xs sm:text-sm text-green-700 dark:text-green-400 font-medium mb-4">
        <span className="inline-flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {t.bookingTrust?.freeCancellation || "Free cancellation 48h"}
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {t.bookingTrust?.securePayment || "Secure payment"}
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {t.bookingTrust?.insuranceIncluded || "Insurance included"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="w-3.5 h-3.5 flex-shrink-0" />
          {t.trustEscalation?.familiesThisSeason || "100+ familias esta temporada"}
        </span>
      </div>
    );
  }

  // stage === "step3" — maximum trust
  const weeklyCount = getWeeklyBookingsEstimate();
  const bookingsText = (t.trustEscalation?.bookingsThisWeek || "{count}+ reservas esta semana").replace("{count}", String(weeklyCount));

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2.5 text-xs sm:text-sm text-green-700 dark:text-green-400 font-medium mb-4">
      <span className="inline-flex items-center gap-1">
        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
        {t.bookingTrust?.freeCancellation || "Free cancellation 48h"}
      </span>
      <span className="inline-flex items-center gap-1">
        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
        {t.bookingTrust?.securePayment || "Secure payment"}
      </span>
      <span className="inline-flex items-center gap-1">
        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
        {t.trustEscalation?.fullInsurance || "Seguro completo"}
      </span>
      <span className="inline-flex items-center gap-1">
        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
        {bookingsText}
      </span>
      <span className="inline-flex items-center gap-1">
        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
        {t.trustEscalation?.officialPort || "Puerto oficial de Blanes"}
      </span>
    </div>
  );
}
