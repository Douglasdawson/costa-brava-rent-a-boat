import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import type { Extra } from "./types";

interface BookingStepExtrasProps {
  availableExtras: Extra[];
  extras: Record<string, number>;
  updateExtra: (extraId: string, increment: boolean) => void;
  setStep: (step: number) => void;
}

export function BookingStepExtras({ availableExtras, extras, updateExtra, setStep }: BookingStepExtrasProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Extras (opcional)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          {availableExtras.map((extra) => (
            <div key={extra.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-primary/20 rounded-lg gap-3">
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{extra.name}</h4>
                <p className="text-sm text-muted-foreground">{extra.description}</p>
                <p className="text-sm font-medium text-primary">{extra.price}€</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateExtra(extra.id, false)}
                  data-testid={`button-decrease-${extra.id}`}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-medium">
                  {extras[extra.id] || 0}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateExtra(extra.id, true)}
                  data-testid={`button-increase-${extra.id}`}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={() => setStep(5)}
          className="w-full py-3"
          data-testid="button-continue-customer-data"
        >
          Continuar
        </Button>
      </CardContent>
    </Card>
  );
}
