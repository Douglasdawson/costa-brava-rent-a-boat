import { ExternalLink, CalendarCheck } from "lucide-react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { H2, Sheet, Rise, Feature, LeadText, PhotoHero, FaqSheet } from "@/components/activity-kit";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import RelatedContent from "@/components/RelatedContent";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { MobileStickyBar } from "@/components/MobileStickyBar";
import { generateHreflangLinks, generateCanonicalUrl, BASE_DOMAIN } from "@/utils/seo-config";
import { generateBreadcrumbSchema, generateFAQSchema } from "@/utils/seo-schemas";
import { COASTRENT_DOMAIN, COASTRENT_ORG_ID, coastrentUrl } from "@shared/coastrentLinks";

const NAVY_CTA =
  "inline-flex items-center justify-center gap-2 rounded-full bg-cta text-cta-foreground hover:bg-cta/90 font-semibold btn-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2";

/**
 * Bridge page for road scooter/motorbike rental in Lloret de Mar. The service
 * is operated by Coast Rent (sister business we openly recommend); the CTA
 * deep-links to their site in the visitor's language, with UTM so GA4 can tell
 * this bridge apart from the other surfaces (see shared/coastrentLinks.ts).
 */
export default function ScootersPage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const s = t.scootersPage;

  const hreflangLinks = generateHreflangLinks("scooters");
  const canonical = generateCanonicalUrl("scooters", language);
  const coastRentUrl = coastrentUrl("home", language, "bridge");

  const heroImage = "/images/scooters/alquiler-scooter-lloret-de-mar-costa-brava.webp";
  const heroImageMobile = "/images/scooters/alquiler-scooter-lloret-de-mar-costa-brava-mobile.webp";

  const jsonLd = [
    generateBreadcrumbSchema([
      { name: t.nav.home, url: generateCanonicalUrl("home", language) },
      { name: s?.navLabel || "Scooters", url: canonical },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${BASE_DOMAIN}/#service-scooters`,
      name: s?.hero?.title,
      serviceType: s?.navLabel,
      description: s?.seoDescription,
      url: canonical,
      image: `${BASE_DOMAIN}${heroImage}`,
      // Mismo @id que usa coastrent.es para su Organization: así el grafo enlaza la entidad
      // en vez de crear un "Coast Rent" flotante por cada página que lo cita.
      provider: {
        "@type": "LocalBusiness",
        "@id": COASTRENT_ORG_ID,
        name: "Coast Rent",
        url: COASTRENT_DOMAIN,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Lloret de Mar",
          addressRegion: "Girona",
          addressCountry: "ES",
        },
      },
      areaServed: { "@type": "Place", name: "Lloret de Mar, Costa Brava" },
    },
    generateFAQSchema((s?.faq || []).map(f => ({ question: f.q, answer: f.a }))),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={s?.seoTitle || s?.hero?.title || "Alquiler de scooters en Lloret de Mar"}
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
              srcSet="/images/scooters/alquiler-scooter-lloret-de-mar-costa-brava-mobile.avif"
            />
            <source media="(max-width: 640px)" srcSet={heroImageMobile} />
            <source
              type="image/avif"
              srcSet="/images/scooters/alquiler-scooter-lloret-de-mar-costa-brava.avif"
            />
            <img
              src={heroImage}
              alt={s?.hero?.title || "Alquiler de scooters en Lloret de Mar"}
              width={1920}
              height={1072}
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
              href={coastRentUrl}
              target="_blank"
              rel="noopener"
              className="min-h-12 w-full px-8 text-base sm:w-auto"
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

      {/* Vehicles */}
      <Sheet tone="muted" next="page">
        <Rise>
          <h2 className={H2}>{s?.vehiclesTitle}</h2>
          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {(s?.vehicles || []).map(v => (
              <Feature key={v.name} title={v.name} text={v.description} />
            ))}
          </div>
          <div className="mt-10">
            <InteractiveHoverButton
              tone="dark"
              href={coastRentUrl}
              target="_blank"
              rel="noopener"
              className="min-h-12 px-8 text-base"
            >
              {s?.cta}
            </InteractiveHoverButton>
            <p className="mt-2 text-xs text-muted-foreground">{s?.ctaNote}</p>
          </div>
        </Rise>
      </Sheet>

      {/* Combine sea + road */}
      <Sheet next="muted">
        <div className="grid gap-8 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <h2 className={H2}>{s?.combineTitle}</h2>
          </Rise>
          <Rise delay={0.1}>
            <LeadText
              text={s?.combineText}
              className="text-lg sm:text-xl [&>span:first-child]:text-xl"
            />
          </Rise>
        </div>
      </Sheet>

      {/* Operated by Coast Rent */}
      <Sheet tone="muted" next="page">
        <Rise className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="font-heading text-xl font-semibold tracking-tight text-balance sm:text-2xl">
            {s?.operatedByTitle}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">
            {s?.operatedByText}
          </p>
          <InteractiveHoverButton
            tone="dark"
            href={coastRentUrl}
            target="_blank"
            rel="noopener"
            className="mt-6 min-h-12 px-7 text-base"
          >
            coastrent.es
          </InteractiveHoverButton>
        </Rise>
      </Sheet>

      <FaqSheet idPrefix="scooters-faq" title={s?.faqTitle} items={s?.faq || []} next="muted" />

      {/* Sticky mobile CTA */}
      <MobileStickyBar>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 leading-tight">
            <CalendarCheck className="h-4 w-4 flex-shrink-0 text-success" />
            <p className="text-sm font-bold text-foreground">{s?.chips?.[0]}</p>
          </div>
          <a
            href={coastRentUrl}
            target="_blank"
            rel="noopener"
            className={`${NAVY_CTA} min-h-11 flex-shrink-0 px-6 text-sm`}
          >
            {s?.navLabel}
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </MobileStickyBar>

      <RelatedContent currentPage="scooters" />
      <Footer />
    </div>
  );
}
