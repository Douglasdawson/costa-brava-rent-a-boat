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
          Resumen y pago
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
                {quote.selectedExtras && quote.selectedExtras.length > 0 && (
                  <div className="flex justify-between">
                    <span>Extras: {quote.selectedExtras.join(', ')}</span>
                    <span>{quote.extrasPrice}€</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Depósito</span>
                  <span>{quote.deposit}€</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal</span>
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
                    Temporada {quote.season} {quote.duration} {quote.numberOfPeople} personas
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
                  *Precio estimado. El precio final se calculará con las tarifas de temporada.
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
                {isLoading ? "Creando cotización..." : "Obtener Cotización"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Obtén el precio final con tarifas de temporada y crea una reserva temporal de 30 minutos.
              </p>
            </>
          ) : (
            <>
              <div className="bg-primary/5 p-3 rounded-lg">
                <p className="text-sm text-primary">
                  Cotización creada. Tienes <strong>30 minutos</strong> para completar el pago.
                  {holdId && (
                    <span className="block text-xs mt-1">Hold ID: {holdId}</span>
                  )}
                </p>
              </div>

              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <input type="checkbox" id="terms" className="rounded" />
                <label htmlFor="terms">
                  Acepto los <a href="#" className="text-primary hover:underline">{t.booking.termsAndConditions}</a> y la <a href="#" className="text-primary hover:underline">{t.booking.privacyPolicy}</a>
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
                {isLoading ? "Procesando pago..." : `${t.booking.pay || 'Pagar'} ${calculateTotal()}€`}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Pago seguro procesado por Stripe.
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
