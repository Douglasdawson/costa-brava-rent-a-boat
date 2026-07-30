import { CheckCircle } from "lucide-react";
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
  // Sin licencia: fuel, insurance, safety, briefing, secure payment
  // Con licencia: insurance, safety, GPS & sonar, secure payment
  // Excursion privada: skipper, insurance, safety, secure payment
  //
  // El cambio de fecha gratis NO se lista aquí a propósito (jul-2026): anunciarlo
  // como incluido regala lo que la garantía de mal tiempo (10€) intenta vender, y
  // el cliente leía que ya lo tenía. La política sigue vigente y se explica en
  // /garantias y en condiciones generales.
  const items: string[] = [];

  if (isExcursion) {
    items.push(vs.professionalSkipper);
    items.push(vs.insurance);
    items.push(vs.safetyEquipment);
    items.push(vs.securePayment);
  } else if (requiresLicense) {
    items.push(vs.insurance);
    items.push(vs.safetyEquipment);
    items.push(vs.gpsAndSonar);
    items.push(vs.securePayment);
  } else {
    items.push(vs.fuelIncluded);
    items.push(vs.insurance);
    items.push(vs.safetyEquipment);
    items.push(vs.briefing);
    items.push(vs.securePayment);
  }

  return (
    <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-medium text-foreground mb-3">{vs.title}</h3>
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
