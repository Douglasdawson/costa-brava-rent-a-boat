import { useState, useEffect } from "react";
import { ArrowRight, ExternalLink, CloudRain, Handshake } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import RelatedContent from "@/components/RelatedContent";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import {
  generateHreflangLinks,
  generateCanonicalUrl,
  BASE_DOMAIN,
} from "@/utils/seo-config";
import { generateBreadcrumbSchema, generateFAQSchema } from "@/utils/seo-schemas";
import {
  ACTIVITATUM_DOMAIN,
  ACTIVITATUM_PICKS,
  activitatumPicksBySlot,
  activitatumTopicUrl,
  activitatumUrl,
  type ActivitatumPick,
} from "@shared/activitatumLinks";

const NAVY_CTA =
  "inline-flex items-center justify-center gap-2 rounded-full bg-cta text-cta-foreground hover:bg-cta/90 font-semibold btn-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2";

/**
 * Bridge page for everything on the coast that is NOT a boat or a jet ski —
 * those two we rent ourselves. The activities are operated by local companies
 * and booked through Activitatum (sister agency, same owner).
 *
 * Layout note: the three sections are deliberately different shapes. The
 * after-the-boat ones are cheap, short and many, so they read as a price list;
 * the half-day plans are few and expensive, so they get room. Same grid for all
 * three would flatten the only thing a visitor is actually deciding between.
 */
export default function ActivitiesPage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const s = t.activitiesPage;

  const hreflangLinks = generateHreflangLinks("activities");
  const canonical = generateCanonicalUrl("activities", language);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const heroImage = "/images/locations/hero-lloret-de-mar.webp";
  const heroImageMobile = "/images/locations/hero-lloret-de-mar-mobile.webp";

  const blanesUrl = activitatumTopicUrl("blanes", language, "bridge");
  const lloretUrl = activitatumTopicUrl("lloret", language, "bridge");

  const pickUrl = (key: ActivitatumPick) =>
    activitatumUrl(ACTIVITATUM_PICKS[key].path, language, "bridge");
  const pickCopy = (key: ActivitatumPick) => s?.activities?.[key];

  const afterBoat = activitatumPicksBySlot("afterBoat");
  const landDay = activitatumPicksBySlot("landDay");
  const [rainyDay] = activitatumPicksBySlot("rainyDay");

  const jsonLd = [
    generateBreadcrumbSchema([
      { name: t.nav.home, url: generateCanonicalUrl("home", language) },
      { name: s?.navLabel || "Actividades", url: canonical },
    ]),
    generateFAQSchema((s?.faq || []).map((f) => ({ question: f.q, answer: f.a }))),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={s?.seoTitle || s?.hero?.title || "Actividades en Blanes y Lloret de Mar"}
        description={s?.seoDescription || s?.hero?.subtitle || ""}
        keywords={s?.navLabel}
        canonical={canonical}
        ogImage={`${BASE_DOMAIN}${heroImage}`}
        hreflang={hreflangLinks}
        jsonLd={jsonLd}
      />
      <Navigation />

      {/* HERO */}
      <section className="relative isolate flex min-h-[62vh] items-center overflow-hidden pb-16 pt-28">
        <picture>
          <source
            media="(max-width: 640px)"
            type="image/avif"
            srcSet="/images/locations/hero-lloret-de-mar-mobile.avif"
          />
          <source media="(max-width: 640px)" srcSet={heroImageMobile} />
          <source type="image/avif" srcSet="/images/locations/hero-lloret-de-mar.avif" />
          <img
            src={heroImage}
            alt={s?.hero?.title || "Costa Brava desde el aire"}
            width={1920}
            height={1080}
            decoding="async"
            draggable={false}
            className={`absolute inset-0 -z-10 h-full w-full object-cover will-change-transform transition-transform duration-[1200ms] ease-out ${mounted ? "scale-100" : "scale-[1.06]"}`}
          />
        </picture>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/45 to-black/65" />

        <div
          className={`mx-auto w-full max-w-3xl px-4 text-center text-white transition-all duration-700 ease-out sm:px-6 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          <h1 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight [text-shadow:0_2px_18px_hsl(215_45%_12%/0.5)] sm:text-5xl lg:text-6xl">
            {s?.hero?.title}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/90 [text-shadow:0_1px_10px_hsl(215_45%_12%/0.45)]">
            {s?.hero?.subtitle}
          </p>
          <div className="mt-8">
            <a
              href={blanesUrl}
              target="_blank"
              rel="noopener"
              className={`${NAVY_CTA} min-h-12 px-9 text-base`}
            >
              {s?.cta}
              <ExternalLink className="h-5 w-5" />
            </a>
            <p className="mt-2 text-xs text-white/70">{s?.ctaNote}</p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {(s?.chips || []).map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center rounded-full bg-black/25 px-3 py-1.5 text-sm text-white ring-1 ring-white/20"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* INTRO */}
      {s?.intro && (
        <section className="px-4 py-12 sm:px-6 lg:py-16">
          <p className="mx-auto max-w-2xl text-center text-lg text-muted-foreground">
            {s.intro}
          </p>
        </section>
      )}

      {/* AFTER THE BOAT — many, cheap, short: reads as a rate list, not as cards */}
      <section className="border-y border-border bg-muted/40 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {s?.afterBoatTitle}
          </h2>
          <p className="mt-3 max-w-prose leading-relaxed text-muted-foreground">
            {s?.afterBoatIntro}
          </p>

          <ul className="mt-8 divide-y divide-border">
            {afterBoat.map((key) => {
              const copy = pickCopy(key);
              if (!copy) return null;
              return (
                <li key={key}>
                  <a
                    href={pickUrl(key)}
                    target="_blank"
                    rel="noopener"
                    className="group flex items-baseline justify-between gap-6 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta"
                  >
                    <span className="min-w-0">
                      <span className="font-heading font-semibold text-foreground group-hover:underline">
                        {copy.name}
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                        {copy.note}
                      </span>
                    </span>
                    <span className="flex-shrink-0 whitespace-nowrap font-heading text-lg font-bold text-foreground">
                      {s?.priceFrom} {ACTIVITATUM_PICKS[key].priceEur}&euro;
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* HALF-DAY PLANS — few and pricier, so they get the room */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {s?.landDayTitle}
          </h2>
          <p className="mt-3 max-w-prose leading-relaxed text-muted-foreground">
            {s?.landDayIntro}
          </p>

          <div className="mt-10 space-y-10">
            {landDay.map((key) => {
              const copy = pickCopy(key);
              if (!copy) return null;
              return (
                <article key={key} className="border-l-2 border-cta pl-5 sm:pl-6">
                  <h3 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
                    {copy.name}
                  </h3>
                  <p className="mt-2 max-w-prose leading-relaxed text-muted-foreground">
                    {copy.note}
                  </p>
                  <a
                    href={pickUrl(key)}
                    target="_blank"
                    rel="noopener"
                    className="mt-3 inline-flex items-center gap-1.5 font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta"
                  >
                    {s?.priceFrom} {ACTIVITATUM_PICKS[key].priceEur}&euro;
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* RAINY DAY — one line, and it should look like one line */}
      {rainyDay && pickCopy(rainyDay) && (
        <section className="px-4 pb-16 sm:px-6">
          <div className="mx-auto flex max-w-3xl items-start gap-4 rounded-xl bg-muted/50 p-5 sm:p-6">
            <CloudRain className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
            <p className="leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">{s?.rainyDayTitle}: </span>
              {pickCopy(rainyDay)?.note}{" "}
              <a
                href={pickUrl(rainyDay)}
                target="_blank"
                rel="noopener"
                className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta"
              >
                {pickCopy(rainyDay)?.name}
              </a>
              .
            </p>
          </div>
        </section>
      )}

      {/* WHO OPERATES THIS */}
      <section className="bg-muted/40 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Handshake className="h-5 w-5 text-primary" />
            </span>
            <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
              {s?.operatedByTitle}
            </h2>
          </div>
          <p className="mt-4 leading-relaxed text-muted-foreground">{s?.operatedByText}</p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
            <a
              href={blanesUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
            >
              {s?.cta}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={lloretUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
            >
              {s?.ctaSecondary}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      {(s?.faq || []).length > 0 && (
        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              {s?.faqTitle}
            </h2>
            <dl className="mt-8 divide-y divide-border">
              {(s?.faq || []).map((f) => (
                <div key={f.q} className="py-5 first:pt-0 last:pb-0">
                  <dt className="font-heading font-semibold text-foreground">{f.q}</dt>
                  <dd className="mt-1.5 leading-relaxed text-muted-foreground">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-6px_24px_-8px_hsl(215_45%_20%/0.3)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <p className="text-sm font-bold leading-tight text-foreground">{s?.chips?.[0]}</p>
          <a
            href={blanesUrl}
            target="_blank"
            rel="noopener"
            className={`${NAVY_CTA} min-h-11 flex-shrink-0 px-6 text-sm`}
          >
            {s?.navLabel}
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
      <div className="h-20 lg:hidden" />

      <RelatedContent currentPage="activities" />
      <Footer />
    </div>
  );
}
