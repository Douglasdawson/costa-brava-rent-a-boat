import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import type { Translations } from "@/lib/translations";

interface BookingStepDateProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  setStep: (step: number) => void;
  t: Translations;
}

export function BookingStepDate({ selectedDate, setSelectedDate, setStep, t }: BookingStepDateProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Calendar className="w-5 h-5 mr-2" />
          {t.booking.selectDate}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date())}
          className="w-full p-4 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-lg text-left text-foreground"
          data-testid="input-booking-date"
        />
        <div className="mt-6">
          <Button
            onClick={() => setStep(2)}
            disabled={!selectedDate}
            className="w-full py-3"
            data-testid="button-next-step"
          >
            Continuar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
