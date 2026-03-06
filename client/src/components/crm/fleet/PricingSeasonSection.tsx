import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BoatFormData } from "../types";

interface PricingSeasonSectionProps {
  seasonKey: "BAJA" | "MEDIA" | "ALTA";
  seasonLabel: string;
  periodPlaceholder: string;
  requiresLicense: boolean;
  form: UseFormReturn<BoatFormData>;
}

const LICENSE_DURATIONS = ["2h", "4h", "8h"] as const;
const NO_LICENSE_DURATIONS = ["1h", "2h", "3h", "4h", "6h", "8h"] as const;

export function PricingSeasonSection({
  seasonKey,
  seasonLabel,
  periodPlaceholder,
  requiresLicense,
  form,
}: PricingSeasonSectionProps) {
  const durations = requiresLicense ? LICENSE_DURATIONS : NO_LICENSE_DURATIONS;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h4 className="font-medium">Temporada {seasonLabel}</h4>
      <Input
        placeholder={periodPlaceholder}
        onChange={e => form.setValue(`pricing.${seasonKey}.period`, e.target.value)}
      />
      <div className="grid grid-cols-3 gap-2">
        {durations.map(duration => (
          <div key={duration}>
            <Label className="text-xs">{duration}</Label>
            <Input
              type="number"
              placeholder="0"
              onChange={e =>
                form.setValue(
                  `pricing.${seasonKey}.prices.${duration}`,
                  parseFloat(e.target.value) || 0
                )
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
