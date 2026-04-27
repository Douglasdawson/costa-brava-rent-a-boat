import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, AlertTriangle, TrendingUp } from "lucide-react";
import type { Translations } from "@/lib/translations";
import type { Duration, TimeSlot } from "./types";
import { usePricingOverrideForDate } from "./usePricingOverrideForDate";

interface BookingStepTimeProps {
  timeSlots: TimeSlot[];
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  duration: string;
  setDuration: (duration: string) => void;
  getAvailableDurations: (startTime: string) => Duration[];
  setStep: (step: number) => void;
  selectedDate: string;
  selectedBoatId?: string | null;
  t: Translations;
}

export function BookingStepTime({
  timeSlots, selectedTime, setSelectedTime,
  duration, setDuration, getAvailableDurations, setStep,
  selectedDate, selectedBoatId, t,
}: BookingStepTimeProps) {
  const parsedDate = selectedDate ? new Date(selectedDate + "T12:00:00") : null;
  const isWeekendDay = parsedDate ? (parsedDate.getDay() === 0 || parsedDate.getDay() === 6) : false;
  const isAugust = parsedDate ? (parsedDate.getMonth() === 7) : false;
  const minDuration2h = isWeekendDay || isAugust;
  const pricingOverride = usePricingOverrideForDate(selectedBoatId, selectedDate);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          {t.booking.scheduleAndDuration}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isWeekendDay && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              <strong>{t.booking?.weekendSurchargeTitle || 'Weekend surcharge'}:</strong>{' '}
              {t.booking?.weekendSurcharge || 'A 15% surcharge applies on weekends.'}
            </span>
          </div>
        )}
        {minDuration2h && (
          <p className="text-xs text-muted-foreground mb-4">
            {t.booking?.minDuration2h || 'Minimum duration: 2 hours on weekends and high season.'}
          </p>
        )}
        {pricingOverride.hasOverride && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mb-4 text-sm text-foreground flex items-start gap-2">
            <TrendingUp className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <span>
              <strong>Tarifa especial:</strong> esta fecha tiene un precio adaptado por demanda
              {pricingOverride.percentChange && pricingOverride.percentChange !== 0
                ? ` (${pricingOverride.percentChange > 0 ? "+" : ""}${pricingOverride.percentChange}%)`
                : ""}
              {pricingOverride.overrideLabel ? ` — ${pricingOverride.overrideLabel}` : ""}.
              El total final que verás al confirmar incluye este ajuste.
            </span>
          </div>
        )}
        <div className="mb-6">
          <h3 className="font-medium text-foreground mb-3 text-base">{t.booking.startTime}</h3>
          <div className="space-y-2">
            {timeSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => {
                  setSelectedTime(slot.id);
                  const availableDurations = getAvailableDurations(slot.id);
                  const isDurationStillAvailable = availableDurations.some(d => d.id === duration);
                  if (!isDurationStillAvailable) {
                    setDuration("2h");
                  }
                }}
                disabled={!slot.available}
                className={`w-full p-3 border rounded-lg flex items-center justify-between hover-elevate ${
                  selectedTime === slot.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : !slot.available
                      ? 'border-primary/20 bg-primary/5 text-muted-foreground/70 cursor-not-allowed'
                      : 'border-primary/20 hover:border-primary hover:bg-primary/5'
                }`}
                data-testid={`button-timeslot-${slot.id}`}
              >
                <span className="font-medium">{slot.label}</span>
                {slot.available ? (
                  <Badge variant="secondary">{t.boats.available}</Badge>
                ) : (
                  <Badge variant="outline">{t.boats.occupied}</Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {selectedTime && (
          <div className="mb-6">
            <h3 className="font-medium text-foreground mb-3 text-base">{t.booking.duration}</h3>
            <Select value={duration} onValueChange={(value) => setDuration(value)}>
              <SelectTrigger data-testid="select-duration">
                <SelectValue placeholder={t.booking.selectDuration} />
              </SelectTrigger>
              <SelectContent>
                {getAvailableDurations(selectedTime).map((dur) => (
                  <SelectItem key={dur.id} value={dur.id}>
                    {dur.label} — {dur.price}€
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedTime && duration && (
          <div className="mt-6">
            <Button
              onClick={() => setStep(4)}
              className="w-full py-3"
              data-testid="button-continue-extras"
            >
              {t.booking.continue}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
