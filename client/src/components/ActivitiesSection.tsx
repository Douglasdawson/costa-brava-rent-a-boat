import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
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
  // Jet ski leads (the two big cards); eFoil sits below as a compact card.
  const efoil = cards.find(c => c.isEfoil);
  const jetskis = cards.filter(c => !c.isEfoil);

  return (
    <section
      id="activities"
      className="bg-muted/40 py-16 sm:py-24"
      aria-labelledby="activities-title"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-10 sm:mb-12">
          <h2
            id="activities-title"
            className="font-heading text-h2 font-semibold tracking-tight text-foreground"
          >
            {s.title}
          </h2>
          <p className="mt-3 text-base text-muted-foreground text-pretty sm:text-lg">
            {s.subtitle}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          {jetskis.map(c => (
            <Link
              key={c.id}
              href={c.href}
              className="group relative isolate flex min-h-[24rem] overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 lg:min-h-[28rem]"
            >
              <img
                src={c.image}
                alt={c.alt}
                srcSet={srcSetFor(c.image)}
                sizes="(min-width: 640px) 50vw, 100vw"
                width={1600}
                height={1080}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="mt-auto p-6 text-white sm:p-8">
                <h3 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                  {c.title}
                </h3>
                <p className="mt-2 max-w-md text-sm text-white/85 sm:text-base">{c.subtitle}</p>
                <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                  {from} {c.minPrice} €
                  <ArrowRight
                    className="h-4 w-4 transition-transform motion-reduce:transition-none [@media(hover:hover)]:group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </p>
              </div>
            </Link>
          ))}

          {efoil && (
            <Link
              href={efoil.href}
              className="group relative isolate flex min-h-[24rem] overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 sm:col-span-2 lg:min-h-[28rem]"
            >
              <img
                src={efoil.image}
                alt={efoil.alt}
                srcSet={srcSetFor(efoil.image)}
                sizes="100vw"
                width={1600}
                height={1100}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 -z-10 h-full w-full object-cover object-[52%_10%] transition-transform duration-700 ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="mt-auto p-6 text-white sm:p-8">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-foreground">
                  {s.newBadge}
                </span>
                <h3 className="mt-3 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                  {efoil.title}
                </h3>
                <p className="mt-2 max-w-md text-sm text-white/85 sm:text-base">{efoil.subtitle}</p>
                <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                  {from} {efoil.minPrice} €
                  <ArrowRight
                    className="h-4 w-4 transition-transform motion-reduce:transition-none [@media(hover:hover)]:group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
