import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { JETSKI_PRODUCTS } from "@shared/jetskiProducts";
import type { PageKey } from "@shared/i18n-routes";

// Same lookup as pages/jet-ski-blanes.tsx: the copy key is looked up per page,
// never inferred, so an unknown product falls back to its own catalogue name.
// Catalogue photos are 1600px wide; serve them through the same resize endpoint
// the fleet cards use (server/routes/imageResize.ts), so a 174px card doesn't
// download a 1600px file.
const BOATS_DIR = "/images/boats/";
const srcSetFor = (image: string) =>
  image.startsWith(BOATS_DIR)
    ? [400, 800, 1200]
        .map(
          w => `/img/resize?file=${encodeURIComponent(image.slice(BOATS_DIR.length))}&w=${w} ${w}w`
        )
        .join(", ")
    : undefined;

const COPY_KEY_BY_PAGE: Record<string, "circuito" | "excursion" | "efoil"> = {
  jetskiCircuito: "circuito",
  jetskiExcursion: "excursion",
  efoilBlanes: "efoil",
};

/**
 * Home: water activities (jet ski + eFoil) apart from the boat fleet. Data comes
 * from the canonical catalogue in shared/jetskiProducts.ts; each card links to
 * its own landing, where the request modal lives.
 */
export default function ActivitiesSection() {
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  const s = t.activitiesSection;
  const from = t.jetskiLanding?.fromLabel ?? t.jetski.fromLabel;

  const cards = JETSKI_PRODUCTS.map(p => {
    const copyKey = COPY_KEY_BY_PAGE[p.pageKey];
    const copy = copyKey ? t.jetskiLanding?.[copyKey] : undefined;
    return {
      id: p.id,
      isEfoil: copyKey === "efoil",
      href: localizedPath(p.pageKey as PageKey),
      image: p.image,
      alt: p.altText,
      title: copy?.navLabel || p.name,
      subtitle: copy?.hero?.subtitle || p.subtitle,
      minPrice: Math.min(...p.slots.map(slot => slot.price)),
    };
  });
  // Jet ski leads; the eFoil closes the row (full width at tablet, third column on desktop).
  const ordered = [...cards.filter(c => !c.isEfoil), ...cards.filter(c => c.isEfoil)];

  return (
    <div className="bg-primary dark:bg-[hsl(215_45%_16%)]">
      <section
        id="activities"
        className="squircle-b rounded-b-2xl bg-muted py-16 sm:py-24"
        aria-labelledby="activities-title"
      >
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
            <h2
              id="activities-title"
              className="font-heading text-h2 font-semibold tracking-tight text-foreground text-balance"
            >
              {s.title}
            </h2>
            <p className="mt-3 text-base text-muted-foreground text-pretty sm:text-lg">
              {s.subtitle}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {ordered.map(c => (
              <Link
                key={c.id}
                href={c.href}
                className={`group relative isolate flex min-h-[26rem] overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 lg:min-h-[32rem] ${
                  c.isEfoil ? "sm:col-span-2 lg:col-span-1" : ""
                }`}
              >
                <img
                  src={c.image}
                  alt={c.alt}
                  srcSet={srcSetFor(c.image)}
                  sizes={
                    c.isEfoil
                      ? "(min-width: 1024px) 33vw, 100vw"
                      : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  }
                  width={1600}
                  height={c.isEfoil ? 1100 : 1080}
                  loading="lazy"
                  decoding="async"
                  className={`absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.03] ${
                    c.isEfoil ? "object-[52%_10%]" : ""
                  }`}
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                {c.isEfoil && (
                  <span className="absolute left-5 top-5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-nav sm:left-6 sm:top-6">
                    {s.newBadge}
                  </span>
                )}

                <div className="mt-auto w-full p-6 text-white sm:p-7">
                  <h3 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                    {c.title}
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-white/85 text-pretty sm:text-base">
                    {c.subtitle}
                  </p>
                  <div className="mt-6 flex items-end justify-between gap-4 border-t border-white/25 pt-4">
                    <p className="leading-none">
                      <span className="block text-sm text-white/80">{from}</span>
                      <span className="mt-1.5 block font-heading text-3xl font-semibold tabular-nums">
                        {c.minPrice} €
                      </span>
                    </p>
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-foreground transition-colors motion-reduce:transition-none [@media(hover:hover)]:group-hover:bg-cta [@media(hover:hover)]:group-hover:text-cta-foreground"
                    >
                      <ArrowUpRight className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
