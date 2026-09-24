import type { ComponentType } from "react";
import { Fish, Snowflake, SquareParking, Star, Waves } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { translateExtraName } from "@/utils/extraNameTranslations";
import { BOAT_DATA, EXTRA_PACKS } from "@shared/boatData";

// One line-icon set (lucide), not the multicolour custom SVGs, so the list reads as one system.
const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  Snorkel: Fish,
  PaddleSurf: Waves,
  Nevera: Snowflake,
  Parking: SquareParking,
};

const toNumber = (price: string) => parseFloat(price.replace(",", ".").replace(/[^\d.]/g, "")) || 0;

// Same source the booking wizard charges from (BOAT_DATA), so the home can't
// drift from the real price again (it showed the cooler at 10 EUR vs 5 EUR).
// Extras are unique by name; if hulls ever price one differently, the cheapest wins.
const EXTRAS = Object.values(BOAT_DATA)
  .flatMap(b => b.extras ?? [])
  .reduce<{ name: string; price: string; icon: string }[]>((acc, e) => {
    const prev = acc.find(x => x.name === e.name);
    if (!prev) acc.push(e);
    else if (toNumber(e.price) < toNumber(prev.price)) Object.assign(prev, e);
    return acc;
  }, []);

export default function ExtrasSection() {
  const t = useTranslations();
  const { language } = useLanguage();
  const s = t.extrasSection;
  const eur = (n: number) =>
    new Intl.NumberFormat(language, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(n);

  return (
    <section id="extras" className="bg-background py-16 sm:py-24" aria-labelledby="extras-title">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-10 max-w-2xl sm:mb-12">
          <h2
            id="extras-title"
            className="font-heading text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl md:text-4xl"
          >
            {s.title}
          </h2>
          <p className="mt-3 text-base text-muted-foreground text-pretty sm:text-lg">
            {s.subtitle}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5 lg:gap-12">
          <ul
            role="list"
            className="divide-y divide-border border-y border-border lg:col-span-3 lg:self-start"
          >
            {EXTRAS.map(extra => {
              const Icon = ICONS[extra.icon] ?? Star;
              return (
                <li key={extra.name} className="flex items-center gap-4 py-4">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-5 w-5 text-foreground/80" aria-hidden="true" />
                  </span>
                  <span className="flex-1 font-medium text-foreground">
                    {translateExtraName(extra.name, language)}
                  </span>
                  <span className="font-heading font-semibold tabular-nums text-foreground">
                    {eur(toNumber(extra.price))}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="lg:col-span-2">
            <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground">
              {s.packsTitle}
            </h3>
            <div className="mt-4 space-y-3">
              {EXTRA_PACKS.map(pack => (
                <div key={pack.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-heading font-semibold text-foreground">
                      {translateExtraName(pack.name, language)}
                    </p>
                    <p className="font-heading text-xl font-semibold tabular-nums text-foreground">
                      {eur(pack.price)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pack.extras.map(n => translateExtraName(n, language)).join(" + ")}
                  </p>
                  <p className="mt-2 text-sm font-medium text-success">
                    {s.packSaving.replace("{price}", eur(pack.originalPrice))}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{t.boatDetail.extrasNote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
