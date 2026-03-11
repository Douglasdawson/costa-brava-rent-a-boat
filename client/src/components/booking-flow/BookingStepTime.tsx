import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import type { Duration, TimeSlot } from "./types";

interface BookingStepTimeProps {
  timeSlots: TimeSlot[];
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  duration: string;
  setDuration: (duration: string) => void;
  getAvailableDurations: (startTime: string) => Duration[];
  setStep: (step: number) => void;
}

export function BookingStepTime({
  timeSlots, selectedTime, setSelectedTime,
  duration, setDuration, getAvailableDurations, setStep,
}: BookingStepTimeProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Horario y duración
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h3 className="font-medium text-foreground mb-3 text-base">Horario de inicio</h3>
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
                  <Badge variant="secondary">Disponible</Badge>
                ) : (
                  <Badge variant="outline">Ocupado</Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {selectedTime && (
          <div className="mb-6">
            <h3 className="font-medium text-foreground mb-3 text-base">Duración</h3>
            <div className="grid grid-cols-2 gap-3">
              {getAvailableDurations(selectedTime).map((dur) => (
                <button
                  key={dur.id}
                  onClick={() => setDuration(dur.id)}
                  className={`p-3 border rounded-lg text-center hover-elevate ${
                    duration === dur.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-primary/20 hover:border-primary/20'
                  }`}
                  data-testid={`button-duration-${dur.id}`}
                >
                  <div className="font-medium">{dur.label}</div>
                  <div className="text-sm text-muted-foreground">{dur.price}€</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedTime && duration && (
          <div className="mt-6">
            <Button
              onClick={() => setStep(4)}
              className="w-full py-3"
              data-testid="button-continue-extras"
            >
              Continuar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
