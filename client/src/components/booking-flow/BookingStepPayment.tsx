import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, MessageCircle, User, Mail, Phone, Users } from "lucide-react";
import type { Boat } from "@shared/schema";
import type { Translations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import type { Quote, Duration, Extra, CustomerData } from "./types";
import { trackPaymentInitiated } from "@/utils/analytics";
import { BookingTrustBanner } from "./BookingTrustBanner";
import { ValueStack } from "./ValueStack";

interface BookingStepPaymentProps {
  selectedDate: string;
  selectedTime: string;
  duration: string;
  selectedBoat: string;
  availableBoats: Boat[];
  quote: Quote | null;
  holdId: string | null;
  durations: Duration[];
  extras: Record<string, number>;
  availableExtras: Extra[];
  customerData: CustomerData;
  isLoading: boolean;
  isProcessingPayment: boolean;
  calculateTotal: () => number | undefined;
  createQuote: () => Promise<boolean>;
  handlePayment: () => Promise<void>;
  onBack?: () => void;
  t: Translations;
}

export function BookingStepPayment({
  selectedDate, selectedTime, duration, selectedBoat,
  availableBoats, quote, durations, extras,
  availableExtras, customerData, isLoading, isProcessingPayment,
  calculateTotal, createQuote, handlePayment, onBack, t,
}: BookingStepPaymentProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { localizedPath } = useLanguage();
  const boat = availableBoats.find((b: Boat) => b.id === selectedBoat);
  const parsedDate = selectedDate ? new Date(selectedDate + "T12:00:00") : null;
  const isWeekendDay = parsedDate ? (parsedDate.getDay() === 0 || parsedDate.getDay() === 6) : false;

  return (
    <div className="space-y-10 sm:space-y-12">
      <BookingTrustBanner t={t} stage="step3" />

      {/* Summary section */}
      <section>
        <h3 className="font-heading text-[15px] font-semibold text-foreground tracking-tight mb-4">
          {t.booking.summaryTitle}
        </h3>

        {/* Booking details */}
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-5 pb-5 border-b border-border/60">
          <div>
            <dt className="text-[12px] uppercase tracking-wider text-muted-foreground font-medium">
              {t.booking.summaryDate}
            </dt>
            <dd className="text-[14px] text-foreground font-medium mt-0.5">{selectedDate}</dd>
          </div>
          <div>
            <dt className="text-[12px] uppercase tracking-wider text-muted-foreground font-medium">
              {t.booking.summarySchedule}
            </dt>
            <dd className="text-[14px] text-foreground font-medium mt-0.5 tabular-nums">
              {selectedTime} · {duration}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[12px] uppercase tracking-wider text-muted-foreground font-medium">
              {t.booking.summaryBoat}
            </dt>
            <dd className="text-[14px] text-foreground font-medium mt-0.5">{boat?.name || 'N/A'}</dd>
          </div>
        </dl>

        {/* Customer */}
        <div className="grid grid-cols-1 gap-2 mb-5 pb-5 border-b border-border/60 text-[13px]">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <User className="w-3.5 h-3.5" />
              {t.booking.customerDetails}
            </span>
            <span className="font-medium text-foreground truncate">
              {customerData.customerName} {customerData.customerSurname}
            </span>
          </div>
          {customerData.customerEmail && (
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Mail className="w-3.5 h-3.5" />
                {t.booking.emailLabel}
              </span>
              <span className="font-medium text-foreground truncate max-w-[60%]">{customerData.customerEmail}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Phone className="w-3.5 h-3.5" />
              {t.booking.phone}
            </span>
            <span className="font-medium text-foreground tabular-nums">{customerData.phonePrefix} {customerData.customerPhone}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              {t.booking.people}
            </span>
            <span className="font-medium text-foreground tabular-nums">{customerData.numberOfPeople}</span>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="space-y-2 text-[13px]">
          {quote ? (
            <>
              <div className="flex justify-between text-muted-foreground">
                <span>{t.booking.summaryBasePrice} ({quote.season})</span>
                <span className="tabular-nums">{quote.basePrice}€</span>
              </div>
              {isWeekendDay && quote.basePrice ? (() => {
                const priceBeforeSurcharge = Math.round(quote.basePrice / 1.15);
                const surchargeAmount = quote.basePrice - priceBeforeSurcharge;
                return (
                  <div className="flex justify-between text-amber-700 text-[12px]">
                    <span>{t.booking?.weekendSurchargeLabel || 'Recargo fin de semana (15%)'}</span>
                    <span className="tabular-nums">+{surchargeAmount}€</span>
                  </div>
                );
              })() : null}
              {quote.selectedExtras && quote.selectedExtras.length > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span className="truncate">{t.booking.extras}: {quote.selectedExtras.join(', ')}</span>
                  <span className="tabular-nums shrink-0">{quote.extrasPrice}€</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>{t.booking.deposit}</span>
                <span className="tabular-nums">{quote.deposit}€</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t.booking.subtotal}</span>
                <span className="tabular-nums">{quote.subtotal}€</span>
              </div>
              <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-border/60">
                <span className="font-heading text-[16px] font-semibold text-foreground">{t.booking.summaryTotal}</span>
                <span className="font-heading text-[20px] font-semibold text-foreground tabular-nums">
                  {quote.total}€
                </span>
              </div>
              {quote.season && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t.booking.season} {quote.season} · {quote.duration} · {quote.numberOfPeople} {t.booking.people}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-between text-muted-foreground">
                <span>{t.booking.summaryBasePrice}</span>
                <span className="tabular-nums">{durations.find(d => d.id === duration)?.price}€</span>
              </div>
              {Object.entries(extras).map(([id, quantity]) => {
                const extra = availableExtras.find(e => e.id === id);
                if (!quantity || !extra) return null;
                return (
                  <div key={id} className="flex justify-between text-muted-foreground">
                    <span className="truncate">{extra.name} × {quantity}</span>
                    <span className="tabular-nums shrink-0">{extra.price * quantity}€</span>
                  </div>
                );
              })}
              <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-border/60">
                <span className="font-heading text-[16px] font-semibold text-foreground">{t.booking.summaryTotal}</span>
                <span className="font-heading text-[20px] font-semibold text-foreground tabular-nums">
                  {calculateTotal()}€
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {t.booking.estimatedPriceNote}
              </p>
            </>
          )}
        </div>
      </section>

      <ValueStack
        requiresLicense={boat?.requiresLicense ?? false}
        isExcursion={selectedBoat === "excursion-privada"}
        t={t}
      />

      {/* Action zone */}
      {!quote ? (
        <section className="space-y-3">
          <Button
            onClick={createQuote}
            disabled={isLoading}
            className="w-full h-12 rounded-full text-[15px] font-semibold"
            data-testid="button-get-quote"
          >
            {isLoading ? (
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
            ) : null}
            {isLoading ? t.booking.creatingQuote : t.booking.getQuote}
          </Button>
          <p className="text-[12px] text-muted-foreground text-center px-4 leading-relaxed">
            {t.booking.quoteDescription}
          </p>
        </section>
      ) : (
        <section>
          {/* Single consolidated success panel */}
          <div className="rounded-2xl bg-foreground text-background p-5 mb-4">
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="flex-shrink-0 w-9 h-9 rounded-full bg-background/15 inline-flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-background" />
              </span>
              <div className="min-w-0">
                <h4 className="font-heading text-[15px] font-semibold mb-1.5 tracking-tight">
                  {t.booking?.quoteConfirmedTitle || 'Cotización lista'}
                </h4>
                <p className="text-[13px] leading-relaxed text-background/85">
                  {t.booking?.whatsappFlowBody || 'Te abrimos WhatsApp con la solicitud preparada. Pulsa Enviar y nos llega al momento. Confirmamos disponibilidad y coordinamos el pago en persona.'}
                </p>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-2.5 mb-4 cursor-pointer text-[13px] text-muted-foreground leading-relaxed">
            <input
              type="checkbox"
              id="terms"
              className="mt-0.5 h-4 w-4 rounded border-border accent-foreground flex-shrink-0"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <span>
              {t.booking.iAcceptThe}{' '}
              <a href={localizedPath("termsConditions")} target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-2 hover:no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-sm">
                {t.booking.termsAndConditions}
              </a>{' '}
              {t.booking.andThe}{' '}
              <a href={localizedPath("privacyPolicy")} target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-2 hover:no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-sm">
                {t.booking.privacyPolicy}
              </a>
            </span>
          </label>

          <Button
            onClick={() => { trackPaymentInitiated(calculateTotal() ?? 0, selectedBoat); handlePayment(); }}
            disabled={isLoading || isProcessingPayment || !termsAccepted}
            className="w-full h-12 rounded-full text-[15px] font-semibold disabled:opacity-40"
            data-testid="button-submit-request"
          >
            {(isLoading || isProcessingPayment) ? (
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {(isLoading || isProcessingPayment)
              ? (t.booking?.openingWhatsapp || 'Abriendo WhatsApp…')
              : (t.booking?.requestViaWhatsapp || 'Solicitar por WhatsApp')}
          </Button>

          <p className="text-[12px] text-muted-foreground text-center mt-3 px-4 leading-relaxed">
            {t.booking?.whatsappFooterNote || 'Solo tienes que pulsar Enviar. Sin compromiso hasta que confirmemos.'}
          </p>
        </section>
      )}

      {/* Sticky back footer (only when onBack provided) */}
      {onBack && (
        <div className="sticky bottom-0 z-10 -mx-5 sm:-mx-8 -mb-6 px-5 sm:px-8 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] bg-background/95 backdrop-blur-md border-t border-border/60">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 h-9 px-3 -ml-3 rounded-full text-[13px] font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/[0.04] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid="button-back-step"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.booking.back}
          </button>
        </div>
      )}
    </div>
  );
}
