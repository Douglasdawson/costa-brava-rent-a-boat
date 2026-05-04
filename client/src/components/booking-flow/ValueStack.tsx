import { CheckCircle, Gift } from "lucide-react";
import type { Translations } from "@/lib/translations";

interface ValueStackProps {
  requiresLicense: boolean;
  isExcursion: boolean;
  t: Translations;
}

export function ValueStack({ requiresLicense, isExcursion, t }: ValueStackProps) {
  const vs = t.valueStack;
  if (!vs) return null;

  // Build item list based on boat type
  // Sin licencia: fuel, insurance, safety, briefing, cancellation, secure payment
  // Con licencia: insurance, safety, GPS & sonar, cancellation, secure payment
  // Excursion privada: skipper, insurance, safety, cancellation, secure payment
  const items: string[] = [];

  if (isExcursion) {
    items.push(vs.professionalSkipper);
    items.push(vs.insurance);
    items.push(vs.safetyEquipment);
    items.push(vs.freeCancellation);
    items.push(vs.securePayment);
  } else if (requiresLicense) {
    items.push(vs.insurance);
    items.push(vs.safetyEquipment);
    items.push(vs.gpsAndSonar);
    items.push(vs.freeCancellation);
    items.push(vs.securePayment);
  } else {
    items.push(vs.fuelIncluded);
    items.push(vs.insurance);
    items.push(vs.safetyEquipment);
    items.push(vs.briefing);
    items.push(vs.freeCancellation);
    items.push(vs.securePayment);
  }

  return (
    <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Gift className="w-4 h-4 text-success" aria-hidden="true" />
        <h3 className="text-sm font-medium text-foreground">{vs.title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success flex-shrink-0" aria-hidden="true" />
            <span className="text-sm text-foreground">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
