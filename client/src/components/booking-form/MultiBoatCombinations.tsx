import type { Boat } from "@shared/schema";
import type { Translations } from "@/lib/translations";
import { Users } from "lucide-react";
import { getMinActivePrice } from "@shared/pricing";

interface MultiBoatCombinationsProps {
  filteredBoats: Boat[];
  peopleNum: number;
  selectedDate: string;
  selectedBoat: string;
  selectedSecondaryBoat: string;
  onSelect: (primary: string, secondary: string) => void;
  t: Translations;
}

interface Combo {
  primary: Boat;
  secondary: Boat;
  combinedCapacity: number;
  isRecommended: boolean;
}

function getCombinations(boats: Boat[], peopleNum: number): Combo[] {
  const combos: Combo[] = [];
  for (let i = 0; i < boats.length; i++) {
    for (let j = i + 1; j < boats.length; j++) {
      const a = boats[i];
      const b = boats[j];
      const cap = a.capacity + b.capacity;
      if (cap >= peopleNum) {
        combos.push({ primary: a, secondary: b, combinedCapacity: cap, isRecommended: false });
      }
    }
  }
  combos.sort((a, b) => a.combinedCapacity - b.combinedCapacity);
  if (combos.length > 0) combos[0].isRecommended = true;
  return combos;
}

function boatMinPrice(boat: Boat): number | null {
  if (!boat.pricing) return null;
  const season = boat.pricing.BAJA ?? Object.values(boat.pricing)[0];
  return getMinActivePrice(season?.prices) ?? null;
}

export function MultiBoatCombinations({
  filteredBoats,
  peopleNum,
  selectedBoat,
  selectedSecondaryBoat,
  onSelect,
  t,
}: MultiBoatCombinationsProps) {
  const combos = getCombinations(filteredBoats, peopleNum);
  const mb = t.bookingWizard?.multiBoat;

  if (combos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-3">
        {mb?.noCombinations || "No hay combinaciones disponibles para este grupo."}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {combos.map((combo) => {
        const isSelected =
          (selectedBoat === combo.primary.id && selectedSecondaryBoat === combo.secondary.id) ||
          (selectedBoat === combo.secondary.id && selectedSecondaryBoat === combo.primary.id);

        const priceA = boatMinPrice(combo.primary);
        const priceB = boatMinPrice(combo.secondary);
        const combinedMin = priceA != null && priceB != null ? priceA + priceB : null;

        return (
          <button
            key={`${combo.primary.id}-${combo.secondary.id}`}
            type="button"
            onClick={() => onSelect(combo.primary.id, combo.secondary.id)}
            className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border bg-background hover:border-primary/40"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {combo.primary.name}
                  </span>
                  <span className="text-muted-foreground text-xs">+</span>
                  <span className="text-sm font-semibold text-foreground truncate">
                    {combo.secondary.name}
                  </span>
                  {combo.isRecommended && (
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md shrink-0">
                      {mb?.recommended || "Recomendado"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    {(mb?.combinedCapacity || "{n}p en total").replace(
                      "{n}",
                      String(combo.combinedCapacity)
                    )}
                  </span>
                  {combinedMin != null && (
                    <span className="text-xs text-muted-foreground">
                      desde {combinedMin}€/h
                    </span>
                  )}
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                  isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                }`}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
