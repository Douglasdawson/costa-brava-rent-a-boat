import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Euro } from "lucide-react";
import type { Boat } from "@shared/schema";
import type { Translations } from "@/lib/translations";
import type { Quote, Duration, Extra } from "./types";

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
  isLoading: boolean;
  calculateTotal: () => number | undefined;
  createQuote: () => Promise<boolean>;
  handlePayment: () => Promise<void>;
  t: Translations;
}

export function BookingStepPayment({
  selectedDate, selectedTime, duration, selectedBoat,
  availableBoats, quote, holdId, durations, extras,
  availableExtras, isLoading, calculateTotal,
  createQuote, handlePayment, t,
}: BookingStepPaymentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
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
                  {t.booking.quoteCreated} <strong>{t.booking.quoteTimeLimit}</strong>
                  {holdId && (
                    <span className="block text-xs mt-1">Hold ID: {holdId}</span>
                  )}
                </p>
              </div>

              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <input type="checkbox" id="terms" className="rounded" />
                <label htmlFor="terms">
                  {t.booking.iAcceptThe} <a href="#" className="text-primary hover:underline">{t.booking.termsAndConditions}</a> {t.booking.andThe} <a href="#" className="text-primary hover:underline">{t.booking.privacyPolicy}</a>
                </label>
              </div>

              <Button
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full py-3 text-lg font-medium"
                data-testid="button-pay-now"
              >
                {isLoading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <CreditCard className="w-5 h-5 mr-2" />
                )}
                {isLoading ? t.booking.processingPayment : `${t.booking.pay || 'Pagar'} ${calculateTotal()}€`}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                {t.booking.stripePaymentSecure}
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
