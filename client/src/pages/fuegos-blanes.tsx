import { CalendarCheck } from "lucide-react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import {
  H2,
  Sheet,
  Rise,
  Feature,
  LeadText,
  CheckPanel,
  PhotoHero,
  FaqSheet,
} from "@/components/activity-kit";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { MobileStickyBar } from "@/components/MobileStickyBar";
import { generateHreflangLinks, generateCanonicalUrl, BASE_DOMAIN } from "@/utils/seo-config";
import { generateBreadcrumbSchema, generateFAQSchema } from "@/utils/seo-schemas";

const NAVY_CTA =
  "inline-flex items-center justify-center gap-2 rounded-full bg-cta text-cta-foreground hover:bg-cta/90 font-semibold btn-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2";

const WHATSAPP_NUMBER = "34611500372";

/**
 * Temporary landing for the Blanes fireworks competition boat trip
 * (July 25-26). Reached from Instagram; not linked from the nav.
 */
export default function FuegosBlanesPage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const s = t.fuegosBlanesPage;

  const hreflangLinks = generateHreflangLinks("fuegosBlanes");
  const canonical = generateCanonicalUrl("fuegosBlanes", language);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(s?.whatsappMessage || "")}`;

  const heroImage = "/images/fuegos/fuegos-blanes-desde-el-mar.webp";

  const eventDates: Array<{ startDate: string; name?: string }> = [
    { startDate: "2026-07-25" },
    { startDate: "2026-07-26" },
  ];

  const jsonLd = [
    generateBreadcrumbSchema([
      { name: t.nav.home, url: generateCanonicalUrl("home", language) },
      { name: s?.navLabel || "Fuegos de Blanes", url: canonical },
    ]),
    ...eventDates.map(({ startDate }) => ({
      "@context": "https://schema.org",
      "@type": "Event",
      name: s?.hero?.title,
      description: s?.seoDescription,
      startDate,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      image: `${BASE_DOMAIN}${heroImage}`,
      url: canonical,
      location: {
        "@type": "Place",
        name: "Puerto de Blanes",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Blanes",
          addressRegion: "Girona",
          addressCountry: "ES",
        },
      },
      offers: {
        "@type": "Offer",
        price: "60",
        priceCurrency: "EUR",
        availability: "https://schema.org/LimitedAvailability",
        url: canonical,
      },
      organizer: {
        "@type": "LocalBusiness",
        name: "Costa Brava Rent a Boat - Blanes",
        url: BASE_DOMAIN,
      },
    })),
    generateFAQSchema((s?.faq || []).map(f => ({ question: f.q, answer: f.a }))),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={s?.seoTitle || s?.hero?.title || "Fuegos de Blanes desde el barco"}
        description={s?.seoDescription || s?.hero?.subtitle || ""}
        keywords={s?.navLabel}
        canonical={canonical}
        ogImage={`${BASE_DOMAIN}${heroImage}`}
        hreflang={hreflangLinks}
        jsonLd={jsonLd}
      />
      <Navigation />

      <PhotoHero
        minHeight="sm:min-h-[100svh]"
        mediaClassName="[&_img]:object-[center_62%]"
        media={
          <img
            src={heroImage}
            alt={s?.hero?.title || "Fuegos de Blanes desde el mar"}
            width={1080}
            height={1935}
            decoding="async"
            draggable={false}
          />
        }
        title={s?.hero?.title}
        subtitle={s?.hero?.subtitle}
        actions={
          <div className="flex flex-col items-center">
            <InteractiveHoverButton
              tone="dark"
              href={whatsappUrl}
              target="_blank"
              rel="noopener"
              className="min-h-12 w-full px-8 text-base sm:w-auto"
            >
              {s?.cta}
            </InteractiveHoverButton>
            <p className="mt-2 text-xs text-white/70">{s?.ctaNote}</p>
          </div>
        }
        facts={[s?.hero?.eyebrow, ...(s?.chips || [])]}
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

      {/* Price + includes */}
      <Sheet tone="muted" next="page">
        <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:items-center lg:gap-16">
          <Rise>
            <p className="font-heading text-6xl font-semibold tracking-tight text-foreground">
              {s?.priceLabel}
            </p>
            <p className="mt-2 text-base text-muted-foreground">{s?.priceMeta}</p>
            {s?.capacityNote && (
              <p className="mt-6 max-w-sm border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
                {s.capacityNote}
              </p>
            )}
          </Rise>
          <Rise delay={0.1}>
            <h2 className={`${H2} mb-6`}>{s?.includesTitle}</h2>
            <CheckPanel items={s?.includes || []} />
          </Rise>
        </div>
      </Sheet>

      {/* How it works */}
      <Sheet next="muted">
        <Rise>
          <h2 className={H2}>{s?.detailsTitle}</h2>
          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-3">
            {(s?.details || []).map(d => (
              <Feature key={d.name} title={d.name} text={d.description} />
            ))}
          </div>
        </Rise>
      </Sheet>

      {/* Program */}
      <Sheet tone="muted" next="page" containerClassName="max-w-3xl">
        <Rise>
          <h2 className={H2}>{s?.programTitle}</h2>
          <ul className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
            {(s?.program || []).map(p => (
              <li
                key={p.day}
                className="grid gap-1 border-b border-border px-5 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-8 sm:px-6"
              >
                <p className="font-heading text-base font-semibold text-foreground">{p.day}</p>
                <p className="text-base leading-relaxed text-muted-foreground">{p.pyro}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <InteractiveHoverButton
              tone="dark"
              href={whatsappUrl}
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

      <FaqSheet idPrefix="fuegos-faq" title={s?.faqTitle} items={s?.faq || []} next="footer" />

      {/* Sticky mobile CTA */}
      <MobileStickyBar>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 leading-tight">
            <CalendarCheck className="h-4 w-4 flex-shrink-0 text-success" />
            <p className="text-sm font-bold text-foreground">
              {s?.priceLabel} {s?.priceMeta}
            </p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener"
            className={`${NAVY_CTA} min-h-11 flex-shrink-0 px-6 text-sm`}
          >
            {s?.cta}
            <SiWhatsapp className="h-4 w-4" />
          </a>
        </div>
      </MobileStickyBar>

      <Footer />
    </div>
  );
}
