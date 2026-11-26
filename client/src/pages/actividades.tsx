import { ExternalLink } from "lucide-react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import {
  H2,
  H3,
  Sheet,
  Rise,
  LeadText,
  PhotoHero,
  FaqSheet,
  PILL_SECONDARY,
} from "@/components/activity-kit";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import RelatedContent from "@/components/RelatedContent";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { generateHreflangLinks, generateCanonicalUrl, BASE_DOMAIN } from "@/utils/seo-config";
import { generateBreadcrumbSchema, generateFAQSchema } from "@/utils/seo-schemas";
import { MobileStickyBar } from "@/components/MobileStickyBar";
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
    generateFAQSchema((s?.faq || []).map(f => ({ question: f.q, answer: f.a }))),
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

      <PhotoHero
        minHeight="sm:min-h-[72svh]"
        media={
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
            />
          </picture>
        }
        title={s?.hero?.title}
        subtitle={s?.hero?.subtitle}
        actions={
          <div className="flex flex-col items-center">
            <InteractiveHoverButton
              tone="dark"
              href={blanesUrl}
              target="_blank"
              rel="noopener"
              className="min-h-12 w-full whitespace-nowrap px-8 text-base sm:w-auto"
            >
              {s?.cta}
            </InteractiveHoverButton>
            <p className="mt-2 text-xs text-white/70">{s?.ctaNote}</p>
          </div>
        }
        facts={s?.chips}
      />

      {/* Intro: one sentence as the point, the rest as detail */}
      {s?.intro && (
        <Sheet next="muted" className="py-12 sm:py-16">
          <Rise>
            <LeadText
              text={s.intro}
              className="mx-auto max-w-3xl text-center text-lg sm:text-xl [&>span:first-child]:text-xl sm:[&>span:first-child]:text-2xl"
            />
          </Rise>
        </Sheet>
      )}

      {/* After the boat: many, cheap, short, so a rate list */}
      <Sheet tone="muted" next="page">
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <h2 className={H2}>{s?.afterBoatTitle}</h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground text-pretty">
              {s?.afterBoatIntro}
            </p>
          </Rise>
          <Rise delay={0.1}>
            <ul className="overflow-hidden rounded-2xl border border-border bg-card">
              {afterBoat.map(key => {
                const copy = pickCopy(key);
                if (!copy) return null;
                return (
                  <li key={key} className="border-b border-border last:border-b-0">
                    <a
                      href={pickUrl(key)}
                      target="_blank"
                      rel="noopener"
                      className="group flex items-baseline justify-between gap-6 px-5 py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cta motion-reduce:transition-none sm:px-6 [@media(hover:hover)]:hover:bg-muted/60"
                    >
                      <span className="min-w-0">
                        <span className="font-heading text-base font-semibold text-foreground group-hover:underline">
                          {copy.name}
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                          {copy.note}
                        </span>
                      </span>
                      <span className="shrink-0 whitespace-nowrap text-right text-base font-semibold tabular-nums text-foreground">
                        {s?.priceFrom} {ACTIVITATUM_PICKS[key].priceEur}&euro;
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </Rise>
        </div>
      </Sheet>

      {/* Half-day plans: few and pricier, so they get the room */}
      <Sheet next="muted">
        <Rise>
          <h2 className={H2}>{s?.landDayTitle}</h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty">
            {s?.landDayIntro}
          </p>
        </Rise>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {landDay.map(key => {
            const copy = pickCopy(key);
            if (!copy) return null;
            return (
              <Rise key={key} className="flex">
                <article className="flex w-full flex-col justify-between gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
                  <div>
                    <h3 className="font-heading text-xl font-semibold tracking-tight text-balance sm:text-2xl">
                      {copy.name}
                    </h3>
                    <LeadText text={copy.note} className="mt-3" />
                  </div>
                  <a
                    href={pickUrl(key)}
                    target="_blank"
                    rel="noopener"
                    className={`${PILL_SECONDARY} self-start`}
                  >
                    {s?.priceFrom} {ACTIVITATUM_PICKS[key].priceEur}&euro;
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </article>
              </Rise>
            );
          })}
        </div>

        {rainyDay && pickCopy(rainyDay) && (
          <Rise className="mt-6">
            <p className="rounded-2xl bg-muted/60 p-5 text-base leading-relaxed text-muted-foreground sm:p-6">
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
          </Rise>
        )}
      </Sheet>

      {/* Who operates this */}
      <Sheet tone="muted" next="page">
        <Rise className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className={`${H3} text-xl sm:text-2xl`}>{s?.operatedByTitle}</h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">
            {s?.operatedByText}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <InteractiveHoverButton
              tone="dark"
              href={blanesUrl}
              target="_blank"
              rel="noopener"
              className="min-h-12 px-7 text-base"
            >
              {s?.cta}
            </InteractiveHoverButton>
            <a href={lloretUrl} target="_blank" rel="noopener" className={PILL_SECONDARY}>
              {s?.ctaSecondary}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </Rise>
      </Sheet>

      <FaqSheet idPrefix="activities-faq" title={s?.faqTitle} items={s?.faq || []} next="muted" />

      {/* Sticky mobile CTA */}
      <MobileStickyBar>
        <div className="flex items-center justify-between gap-3">
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
      </MobileStickyBar>

      <RelatedContent currentPage="activities" />
      <Footer />
    </div>
  );
}
