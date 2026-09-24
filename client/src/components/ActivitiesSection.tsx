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
        .map(w => `/img/resize?file=${encodeURIComponent(image.slice(BOATS_DIR.length))}&w=${w} ${w}w`)
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
      featured: copyKey === "efoil",
      href: localizedPath(p.pageKey as PageKey),
      image: p.image,
      alt: p.altText,
      title: copy?.navLabel || p.name,
      subtitle: copy?.hero?.subtitle || p.subtitle,
      minPrice: Math.min(...p.slots.map(slot => slot.price)),
    };
  });
  const featured = cards.find(c => c.featured);
  const rest = cards.filter(c => !c.featured);

  return (
    <section
      id="activities"
      className="bg-muted/40 py-16 sm:py-24"
      aria-labelledby="activities-title"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-10 max-w-2xl sm:mb-12">
          <h2
            id="activities-title"
            className="font-heading text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl md:text-4xl"
          >
            {s.title}
          </h2>
          <p className="mt-3 text-base text-muted-foreground text-pretty sm:text-lg">
            {s.subtitle}
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 lg:grid-cols-5">
          {featured && (
            <Link
              href={featured.href}
              className="group relative isolate flex min-h-[22rem] overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 lg:col-span-3 lg:min-h-[26rem]"
            >
              <img
                src={featured.image}
                alt={featured.alt}
                srcSet={srcSetFor(featured.image)}
                sizes="(min-width: 1024px) 60vw, 100vw"
                width={1600}
                height={1100}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="mt-auto p-6 text-white sm:p-8">
                <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                  {s.newBadge}
                </span>
                <h3 className="mt-3 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                  {featured.title}
                </h3>
                <p className="mt-2 max-w-md text-sm text-white/85 sm:text-base">
                  {featured.subtitle}
                </p>
                <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                  {from} {featured.minPrice} €
                  <ArrowRight
                    className="h-4 w-4 transition-transform motion-reduce:transition-none [@media(hover:hover)]:group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </p>
              </div>
            </Link>
          )}

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:col-span-2 lg:grid-cols-1 lg:grid-rows-2">
            {rest.map(c => (
              <Link
                key={c.id}
                href={c.href}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card lg:flex-row transition-colors hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2"
              >
                <div className="aspect-[16/9] overflow-hidden lg:aspect-auto lg:w-2/5 lg:flex-shrink-0">
                  <img
                    src={c.image}
                    alt={c.alt}
                    srcSet={srcSetFor(c.image)}
                    sizes="(min-width: 1024px) 16vw, (min-width: 640px) 50vw, 100vw"
                    width={1600}
                    height={1080}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground">
                    {c.title}
                  </h3>
                  <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{c.subtitle}</p>
                  <p className="mt-auto inline-flex items-center gap-2 pt-3 text-sm font-semibold text-foreground">
                    {from} {c.minPrice} €
                    <ArrowRight
                      className="h-4 w-4 transition-transform motion-reduce:transition-none [@media(hover:hover)]:group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
