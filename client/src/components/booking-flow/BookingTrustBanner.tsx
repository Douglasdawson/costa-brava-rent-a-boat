import { CheckCircle } from "lucide-react";
import type { Translations } from "@/lib/translations";

export function BookingTrustBanner({ t }: { t: Translations }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2.5 text-xs sm:text-sm text-green-700 dark:text-green-400 font-medium mb-4">
      <span className="inline-flex items-center gap-1">
        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
        {t.bookingTrust?.freeCancellation || 'Free cancellation 48h'}
      </span>
      <span className="inline-flex items-center gap-1">
        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
        {t.bookingTrust?.securePayment || 'Secure payment'}
      </span>
      <span className="inline-flex items-center gap-1">
        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
        {t.bookingTrust?.insuranceIncluded || 'Insurance included'}
      </span>
    </div>
  );
}
