import { CheckCircle, Star, MapPin } from "lucide-react";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import type { Translations } from "@/lib/translations";

type TrustStage = "browse" | "step1" | "step2" | "step3";

interface BookingTrustBannerProps {
  t: Translations;
  stage?: TrustStage;
}

export function BookingTrustBanner({ t, stage = "step1" }: BookingTrustBannerProps) {
  // El pilar "Cambio de fecha gratis*" se retiró en jul-2026: anunciarlo aquí
  // regalaba lo que la Garantía de mal tiempo (10€) vende tres pasos después, y
  // el cliente llegaba al upsell creyendo que ya lo tenía. La política sigue
  // vigente y explicada en /garantias, la FAQ y condiciones generales.
  const Footnote = null;

  if (stage === "browse") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-success/10 border border-success/20 rounded-lg px-4 py-2.5 text-xs sm:text-sm text-success font-medium mb-4">
        <span className="inline-flex items-center gap-1">
          <Star className="w-3.5 h-3.5 flex-shrink-0 fill-popular text-popular" aria-hidden="true" />
          {t.trustEscalation?.googleRating || "4.8 en Google"}
        </span>
        <span className="inline-flex items-center gap-1">
          <SiWhatsapp className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          {t.bookingTrust?.replyTime || "Reply in <2h on WhatsApp"}
        </span>
      </div>
    );
  }

  if (stage === "step1") {
    return (
      <>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-success/10 border border-success/20 rounded-lg px-4 py-2.5 text-xs sm:text-sm text-success font-medium mb-4">
          <span className="inline-flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {t.bookingTrust?.insuranceIncluded || "Insurance included"}
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {t.bookingTrust?.securePayment || "Secure booking"}
          </span>
          <span className="inline-flex items-center gap-1">
            <SiWhatsapp className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            {t.bookingTrust?.replyTime || "Reply in <2h on WhatsApp"}
          </span>
        </div>
        {Footnote}
      </>
    );
  }

  if (stage === "step2") {
    return (
      <>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-success/10 border border-success/20 rounded-lg px-4 py-2.5 text-xs sm:text-sm text-success font-medium mb-4">
          <span className="inline-flex items-center gap-1">
            <SiWhatsapp className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            {t.bookingTrust?.replyTime || "Reply in <2h on WhatsApp"}
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {t.bookingTrust?.insuranceIncluded || "Insurance included"}
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {t.bookingTrust?.securePayment || "Secure booking"}
          </span>
        </div>
        {Footnote}
      </>
    );
  }

  // stage === "step3" — maximum trust. Every claim here must be verifiable:
  // no invented booking counters (the old seasonal "estimate" was fabricated
  // urgency, removed in the impeccable sweep — P1.10).
  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-success/10 border border-success/20 rounded-lg px-4 py-2.5 text-xs sm:text-sm text-success font-medium mb-4">
        <span className="inline-flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {t.bookingTrust?.securePayment || "Secure booking"}
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {t.trustEscalation?.fullInsurance || "Seguro completo"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Star className="w-3.5 h-3.5 flex-shrink-0 fill-popular text-popular" aria-hidden="true" />
          {t.trustEscalation?.googleRating || "4.8 en Google"}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          {t.trustEscalation?.officialPort || "Puerto oficial de Blanes"}
        </span>
      </div>
      {Footnote}
    </>
  );
}
