import type { ComponentType } from "react";
import { Check, SquareParking, Star } from "lucide-react";
import { CoolerIcon, PaddleBoardIcon, SnorkelIcon } from "@/components/icons/ExtraIcons";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { translateExtraName } from "@/utils/extraNameTranslations";
import { BOAT_DATA, EXTRA_PACKS } from "@shared/boatData";

// One line-icon set (lucide + three matching custom glyphs for what lucide lacks), not the
// multicolour custom SVGs, so the list reads as one system and each icon matches its name.
const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  Snorkel: SnorkelIcon,
  PaddleSurf: PaddleBoardIcon,
  Nevera: CoolerIcon,
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

  // The pack that saves the most leads; the rest follow as quieter rows.
  const saving = (p: (typeof EXTRA_PACKS)[number]) => p.originalPrice - p.price;
  const [featured, ...others] = [...EXTRA_PACKS].sort((a, b) => saving(b) - saving(a));
  const priceOf = (name: string) => toNumber(EXTRAS.find(x => x.name === name)?.price ?? "0");
  const packName = (name: string) => translateExtraName(name, language);

  return (
    <div className="bg-muted/40">
      <section
        id="extras"
        className="rounded-b-2xl squircle-b bg-background py-16 sm:py-24"
        aria-labelledby="extras-title"
      >
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14 lg:max-w-5xl">
            <h2
              id="extras-title"
              className="font-heading text-h2 font-semibold tracking-tight text-foreground text-balance"
            >
              {s.title}
            </h2>
            <p className="mt-3 text-base text-muted-foreground text-pretty sm:text-lg">
              {s.subtitle}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
            {/* Individual extras: a price list, one row per extra, price flush right. */}
            <ul
              role="list"
              className="flex flex-col rounded-2xl border border-border bg-card px-5 sm:px-7 lg:col-span-5"
            >
              {EXTRAS.map(extra => {
                const Icon = ICONS[extra.icon] ?? Star;
                return (
                  <li
                    key={extra.name}
                    className="flex flex-1 items-center gap-4 border-b border-border py-5 last:border-b-0"
                  >
                    <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-5 w-5 text-foreground/80" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 text-lg font-medium text-foreground">
                      {translateExtraName(extra.name, language)}
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-px min-w-4 flex-1 border-t border-dashed border-foreground/25"
                    />
                    <span className="font-heading text-xl font-semibold tabular-nums text-foreground">
                      {eur(toNumber(extra.price))}
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* Packs: the best deal leads, the others sit beneath it. */}
            <div className="lg:col-span-7">
              <h3 className="sr-only">{s.packsTitle}</h3>
              {featured && (
                <article className="rounded-2xl bg-primary p-6 text-primary-foreground dark:bg-[hsl(215_45%_16%)] dark:text-foreground sm:p-8">
                  <div className="flex items-baseline justify-between gap-4">
                    <h4 className="font-heading text-2xl font-semibold tracking-tight">
                      {packName(featured.name)}
                    </h4>
                    <p className="font-heading text-5xl font-semibold leading-none tracking-tight tabular-nums">
                      {eur(featured.price)}
                    </p>
                  </div>
                  <ul
                    role="list"
                    className="mt-6 space-y-3 border-t border-primary-foreground/20 pt-6"
                  >
                    {featured.extras.map(n => (
                      <li key={n} className="flex items-center gap-3 text-base">
                        <Check
                          className="h-4 w-4 flex-shrink-0 text-primary-foreground/70"
                          aria-hidden="true"
                        />
                        <span className="flex-1">{packName(n)}</span>
                        <span className="tabular-nums text-primary-foreground/80">
                          {eur(priceOf(n))}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 border-t border-primary-foreground/20 pt-5 text-base font-medium">
                    {s.packSaving.replace("{price}", eur(featured.originalPrice))}
                  </p>
                </article>
              )}

              {others.map(pack => (
                <article
                  key={pack.id}
                  className="mt-4 rounded-2xl border border-border bg-card p-5 sm:px-8 sm:py-6"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h4 className="font-heading text-lg font-semibold tracking-tight text-foreground">
                      {packName(pack.name)}
                    </h4>
                    <p className="font-heading text-2xl font-semibold tabular-nums text-foreground">
                      {eur(pack.price)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pack.extras.map(packName).join(" + ")}
                  </p>
                  <p className="mt-2 text-sm font-medium text-success">
                    {s.packSaving.replace("{price}", eur(pack.originalPrice))}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <p className="mx-auto mt-8 max-w-2xl lg:max-w-none text-center text-sm text-muted-foreground text-pretty">
            {t.boatDetail.extrasNote}
          </p>
        </div>
      </section>
    </div>
  );
}
