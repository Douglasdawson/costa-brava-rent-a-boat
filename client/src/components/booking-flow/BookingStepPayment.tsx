import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Euro, User, Mail, Phone, Users } from "lucide-react";
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
  t: Translations;
}

export function BookingStepPayment({
  selectedDate, selectedTime, duration, selectedBoat,
  availableBoats, quote, holdId, durations, extras,
  availableExtras, customerData, isLoading, isProcessingPayment,
  calculateTotal, createQuote, handlePayment, t,
}: BookingStepPaymentProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { localizedPath } = useLanguage();

  return (
    <>
      <BookingTrustBanner t={t} stage="step3" />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Send className="w-5 h-5 mr-2" />
            {t.booking.summaryTitle}
          </CardTitle>
        </CardHeader>
      <CardContent>
        <div className="bg-primary/5 p-4 rounded-lg mb-6">
          <h3 className="font-medium text-foreground mb-3">{t.booking.summaryTitle}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{t.booking.summaryDate}</span>
              <span className="font-medium">{selectedDate}</span>
            </div>
            <div className="flex justify-between">
              <span>{t.booking.summarySchedule}</span>
              <span className="font-medium">{selectedTime} ({duration})</span>
            </div>
            <div className="flex justify-between">
              <span>{t.booking.summaryBoat}</span>
              <span className="font-medium">{availableBoats.find((b: Boat) => b.id === selectedBoat)?.name || 'N/A'}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between items-center">
              <span className="inline-flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-muted-foreground" />{t.booking.customerDetails}</span>
              <span className="font-medium">{customerData.customerName} {customerData.customerSurname}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{t.booking.emailLabel}</span>
              <span className="font-medium truncate max-w-[200px]">{customerData.customerEmail}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{t.booking.phone}</span>
              <span className="font-medium">{customerData.phonePrefix} {customerData.customerPhone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-muted-foreground" />{t.booking.people}</span>
              <span className="font-medium">{customerData.numberOfPeople}</span>
            </div>
            <hr className="my-2" />
            {quote ? (
              <>
                <div className="flex justify-between">
                  <span>{t.booking.summaryBasePrice} ({quote.season})</span>
                  <span>{quote.basePrice}€</span>
                </div>
                {(() => {
                  const parsedDate = selectedDate ? new Date(selectedDate + "T12:00:00") : null;
                  const isWeekendDay = parsedDate ? (parsedDate.getDay() === 0 || parsedDate.getDay() === 6) : false;
                  if (!isWeekendDay || !quote.basePrice) return null;
                  const priceBeforeSurcharge = Math.round(quote.basePrice / 1.15);
                  const surchargeAmount = quote.basePrice - priceBeforeSurcharge;
                  return (
                    <div className="flex justify-between text-amber-600 text-xs">
                      <span>{t.booking?.weekendSurchargeLabel || 'Weekend surcharge (15%)'}</span>
                      <span>+{surchargeAmount}€</span>
                    </div>
                  );
                })()}
                {quote.selectedExtras && quote.selectedExtras.length > 0 && (
                  <div className="flex justify-between">
                    <span>{t.booking.extras}: {quote.selectedExtras.join(', ')}</span>
                    <span>{quote.extrasPrice}€</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t.booking.deposit}</span>
                  <span>{quote.deposit}€</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.booking.subtotal}</span>
                  <span>{quote.subtotal}€</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-base">
                  <span>{t.booking.summaryTotal}</span>
                  <span className="flex items-center">
                    <Euro className="w-4 h-4 mr-1" />
                    {quote.total}
                  </span>
                </div>
                {quote.season && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {t.booking.season} {quote.season} {quote.duration} {quote.numberOfPeople} {t.booking.people}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>{t.booking.summaryBasePrice}</span>
                  <span>{durations.find(d => d.id === duration)?.price}€</span>
                </div>
                {Object.entries(extras).map(([id, quantity]) => {
                  const extra = availableExtras.find(e => e.id === id);
                  if (!quantity || !extra) return null;
                  return (
                    <div key={id} className="flex justify-between">
                      <span>{extra.name} x{quantity}:</span>
                      <span>{extra.price * quantity}€</span>
                    </div>
                  );
                })}
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-base">
                  <span>{t.booking.summaryTotal}</span>
                  <span className="flex items-center">
                    <Euro className="w-4 h-4 mr-1" />
                    {calculateTotal()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t.booking.estimatedPriceNote}
                </p>
              </>
            )}
          </div>
        </div>

        <ValueStack
          requiresLicense={availableBoats.find((b: Boat) => b.id === selectedBoat)?.requiresLicense ?? false}
          isExcursion={selectedBoat === "excursion-privada"}
          t={t}
        />

        <div className="space-y-4">
          {!quote ? (
            <>
              <Button
                onClick={createQuote}
                disabled={isLoading}
                className="w-full py-3 text-lg font-medium"
                data-testid="button-get-quote"
              >
                {isLoading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Euro className="w-5 h-5 mr-2" />
                )}
                {isLoading ? t.booking.creatingQuote : t.booking.getQuote}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {t.booking.quoteDescription}
              </p>
            </>
          ) : (
            <>
              <div className="bg-primary/5 p-3 rounded-lg">
                <p className="text-sm text-primary">
                  Cotización confirmada. <strong>Reservaremos tu plaza al recibir tu solicitud.</strong>
                </p>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg">
                <p className="text-sm text-amber-900">
                  <strong>Sin pago online.</strong> Te contactaremos en menos de 24h por WhatsApp o email para confirmar disponibilidad y coordinar el pago en persona.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  id="terms"
                  className="rounded"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <label htmlFor="terms">
                  {t.booking.iAcceptThe} <a href={localizedPath("termsConditions")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none rounded-sm">{t.booking.termsAndConditions}</a> {t.booking.andThe} <a href={localizedPath("privacyPolicy")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none rounded-sm">{t.booking.privacyPolicy}</a>
                </label>
              </div>

              <Button
                onClick={() => { trackPaymentInitiated(calculateTotal() ?? 0, selectedBoat); handlePayment(); }}
                disabled={isLoading || isProcessingPayment || !termsAccepted}
                className="w-full py-3 text-lg font-medium"
                data-testid="button-submit-request"
              >
                {(isLoading || isProcessingPayment) ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Send className="w-5 h-5 mr-2" />
                )}
                {(isLoading || isProcessingPayment) ? "Enviando solicitud..." : "Solicitar Reserva"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Es una solicitud, no un pago. Confirmaremos disponibilidad en menos de 24h.
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
    </>
  );
}
