import { useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import {
  CheckPanel,
  DefList,
  FaqSheet,
  H2,
  LeadFacts,
  NavyHero,
  PILL_LINK,
  Rise,
  Sheet,
  StepList,
} from "@/components/page-kit";
import Navigation from "@/components/Navigation";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import Footer from "@/components/Footer";
import FleetSection from "@/components/FleetSection";
import RelatedLocationsSection from "@/components/RelatedLocationsSection";
import RelatedContent from "@/components/RelatedContent";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import {
  getSEOConfig,
  generateHreflangLinks,
  generateCanonicalUrl,
  generateBreadcrumbSchema,
} from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { Link } from "wouter";
import { trackLocationPageView } from "@/utils/analytics";
import { BookingStickyBar } from "@/components/MobileStickyBar";
import { BOAT_DATA } from "@shared/boatData";
import { isCatalogBoatPubliclyListed } from "@shared/publicFleet";

export default function LocationCostaBravaPage() {
  const { language, localizedPath } = useLanguage();
  useEffect(() => {
    trackLocationPageView("costa-brava");
  }, []);
  const t = useTranslations();
  const seoConfig = getSEOConfig("locationCostaBrava", language);
  const hreflangLinks = generateHreflangLinks("locationCostaBrava");
  const canonical = generateCanonicalUrl("locationCostaBrava", language);

  const cb = t.locationPages.costaBrava;
  const s = cb?.sections;
  const faqT = cb?.faq;

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
    openWhatsApp(message);
  };

  // Location-specific schema
  const locationSchema = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: "Alquiler de Barcos en la Costa Brava",
    description:
      "Alquiler de barcos en la Costa Brava con Licencia de Navegación o con patrón. Salidas desde el Puerto de Blanes. Embarcaciones para hasta 7 personas.",
    geo: {
      "@type": "GeoCoordinates",
      latitude: 41.6667,
      longitude: 2.7833,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Carrer Esplanada del Port",
      addressLocality: "Blanes",
      addressRegion: "Girona",
      postalCode: "17300",
      addressCountry: "ES",
    },
    touristType: ["Family", "Adventure", "Beach"],
    availableLanguage: ["Spanish", "Catalan", "English", "French"],
    provider: {
      "@type": "LocalBusiness",
      name: "Costa Brava Rent a Boat Blanes",
      telephone: "+34611500372",
      url: "https://www.costabravarentaboat.com/",
    },
  };

  // Breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: "Alquiler Barcos Costa Brava", url: "/alquiler-barcos-costa-brava" },
  ]);

  // FAQ schema for AI search extraction — original 5 + 4 new
  const faqSchema = {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "¿Necesito licencia para alquilar un barco en la Costa Brava?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sí. Desde el 1 de octubre de 2026 (RD 1188/2025) para pilotar cualquier barco a motor de alquiler hace falta titulación. Basta la Licencia de Navegación, el titulín: curso de 1 día, sin examen. Si no la tienes, reserva la excursión privada con patrón: él pilota y tú disfrutas.",
        },
      },
      {
        "@type": "Question",
        name: "Cuanto cuesta alquilar un barco en la Costa Brava?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Los barcos con Licencia de Navegación van en packs de 2, 4 u 8 horas y la excursión privada con patrón sale de 2 a 4 horas; las tarifas por temporada están en la página de precios. El combustible se paga aparte.",
        },
      },
      {
        "@type": "Question",
        name: "Desde donde salen los barcos en la Costa Brava?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Todos nuestros barcos salen del Puerto de Blanes, situado en el corazon de la Costa Brava. Blanes esta a 70 minutos de Barcelona y 35 minutos de Girona.",
        },
      },
      {
        "@type": "Question",
        name: "Que puedo visitar en barco en la Costa Brava?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Desde Blanes puedes navegar a Cala Brava (15 min), Cala Sant Francesc (20 min), Lloret de Mar (30 min) y Tossa de Mar (45 min). Con barcos con licencia puedes llegar aun mas lejos por la costa.",
        },
      },
      {
        "@type": "Question",
        name: "¿Está incluida la gasolina en el precio?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. En ningún barco está incluido el combustible: se paga aparte según el consumo real. El precio sí incluye IVA, amarre, limpieza, seguro de responsabilidad civil y equipo de seguridad.",
        },
      },
      {
        "@type": "Question",
        name:
          faqT?.experienceQ ||
          "Necesito experiencia previa para alquilar un barco en la Costa Brava?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            faqT?.experienceA ||
            "No, no necesitas experiencia previa. Con la excursión privada con patrón no pilotas tú. Para llevar el timón basta la Licencia de Navegación (curso de 1 día, sin examen) y ser mayor de 18 años; antes de salir te explicamos cómo maniobrar, fondear y usar el equipo de seguridad. Nuestro personal estará disponible por teléfono durante toda tu navegación.",
        },
      },
      {
        "@type": "Question",
        name: faqT?.distanceQ || "¿Hasta dónde puedo navegar desde Blanes?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            faqT?.distanceA ||
            "Con la Licencia de Navegación, de día y cerca de la costa, llegas desde Blanes a Cala Brava (15 min), Cala Sant Francesc (20 min), Lloret de Mar (30 min), Cala Treumal y Tossa de Mar (30-45 min) y, en jornada completa, a Sant Feliu de Guíxols. Con la excursión privada con patrón haces la ruta sin titulación.",
        },
      },
      {
        "@type": "Question",
        name: faqT?.weatherQ || "Que pasa si hace mal tiempo el dia de mi reserva?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            faqT?.weatherA ||
            "La seguridad es nuestra prioridad. Si el mal tiempo impide salir, cambiamos la fecha sin coste o emitimos un bono de 12 meses; con la Garantia de mal tiempo contratada eliges entre nueva fecha o devolucion integra en dinero.",
        },
      },
      {
        "@type": "Question",
        name: faqT?.petsQ || "Puedo llevar mascotas en el barco?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            faqT?.petsA ||
            "Si, las mascotas son bienvenidas en todos nuestros barcos. Recomendamos traer agua fresca y proteccion solar para tu mascota.",
        },
      },
    ],
  };

  // Combine schemas
  // Publicly listed catalog (RD 1188/2025 hides licence-free boats from 2026-10-01).
  const LISTED_BOATS = Object.values(BOAT_DATA).filter(b => isCatalogBoatPubliclyListed(b));
  // Service schema with AggregateOffer for price-range rich snippets in SERP
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Boat rental",
    name: "Alquiler de barcos en la Costa Brava con Licencia de Navegación o con patrón",
    areaServed: {
      "@type": "Place",
      name: "Costa Brava, Catalonia, Spain",
    },
    provider: {
      "@type": "LocalBusiness",
      name: "Costa Brava Rent a Boat Blanes",
      telephone: "+34611500372",
      url: "https://www.costabravarentaboat.com/",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Carrer Esplanada del Port",
        addressLocality: "Blanes",
        addressRegion: "Girona",
        postalCode: "17300",
        addressCountry: "ES",
      },
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: String(
        Math.min(...LISTED_BOATS.flatMap(b => Object.values(b.pricing.BAJA.prices)))
      ),
      highPrice: "420",
      offerCount: String(LISTED_BOATS.length),
      availability: "https://schema.org/InStock",
      validFrom: `${new Date().getFullYear()}-04-01`,
      validThrough: `${new Date().getFullYear()}-10-31`,
      description:
        "Barcos con Licencia de Navegación (Mingolla Brava 19, Trimarchi 57S, Pacific Craft 625) y excursión privada con patrón. Combustible aparte.",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "300",
      bestRating: "5",
      worstRating: "1",
    },
  };

  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [locationSchema, breadcrumbSchema, faqSchema, serviceSchema],
  };

  // Departure ports data
  const departurePorts = [
    {
      name: "Blanes",
      description:
        "Nuestro puerto base. Punto de partida de todos los barcos. Aparcamiento gratuito, restaurantes y servicios nauticos.",
      href: localizedPath("locationBlanes"),
      highlight: true,
    },
    {
      name: "Lloret de Mar",
      description:
        "A solo 30 minutos en barco desde Blanes. Playas espectaculares y calas escondidas por el camino.",
      href: localizedPath("locationLloret"),
    },
    {
      name: "Tossa de Mar",
      description:
        "45 minutos de navegacion por la costa mas bonita del Mediterraneo. Vila Vella y calas cristalinas.",
      href: localizedPath("locationTossa"),
    },
    {
      name: "Barcelona",
      description:
        "A 70 minutos en coche desde Barcelona. La escapada perfecta para un dia de mar en la Costa Brava.",
      href: localizedPath("locationBarcelona"),
    },
  ];

  // Navigation routes data
  const routes = [
    {
      title: s?.routeBlanesLloret || "Blanes - Lloret de Mar: 15-30 min, fácil",
      description: s?.routeBlanesLloretDesc || "",
      difficulty: "easy" as const,
    },
    {
      title: s?.routeBlaneCalaBrava || "Blanes - Cala Brava: 15 min, fácil",
      description: s?.routeBlaneCalaBravaDesc || "",
      difficulty: "easy" as const,
    },
    {
      title: s?.routeBlanesTossa || "Blanes - Tossa de Mar: 30-45 min, media, con titulín o patrón",
      description: s?.routeBlanesTossaDesc || "",
      difficulty: "medium" as const,
    },
    {
      title:
        s?.routeBlaneSantFeliu ||
        "Blanes - Sant Feliu de Guixols: 1,5h, avanzada, licencia requerida",
      description: s?.routeBlaneSantFeliuDesc || "",
      difficulty: "advanced" as const,
    },
  ];

  // Coves data
  const coves = [
    { name: s?.calaBravaName || "Cala Brava", description: s?.calaBravaDesc || "" },
    {
      name: s?.calaSantFrancescName || "Cala Sant Francesc",
      description: s?.calaSantFrancescDesc || "",
    },
    { name: s?.calaTreumalName || "Cala Treumal", description: s?.calaTreumalDesc || "" },
    { name: s?.calaBBoadellaName || "Cala Boadella", description: s?.calaBBoadellaDesc || "" },
    {
      name: s?.platjaPalomeraName || "Platja de Sa Palomera",
      description: s?.platjaPalomeraDesc || "",
    },
  ];

  // Build FAQ items for FAQSection component from the schema
  const faqDisplayItems = faqSchema.mainEntity.map(faq => ({
    question: faq.name,
    answer: faq.acceptedAnswer.text,
  }));

  const introText =
    [s?.introP1, s?.introP2, s?.introP3].filter(Boolean).join(" ") ||
    "La Costa Brava es uno de los destinos nauticos mas espectaculares del Mediterraneo.";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        ogTitle={seoConfig.ogTitle}
        ogDescription={seoConfig.ogDescription}
        ogImage={seoConfig.image}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={combinedJsonLd}
      />
      <Navigation />
      <ReadingProgressBar />

      {/* HERO */}
      <NavyHero
        title={cb?.hero.title || "Alquiler de Barcos en la Costa Brava"}
        subtitle={
          cb?.hero.subtitle ||
          "Descubre las mejores calas y playas de la Costa Brava a bordo de nuestros barcos. Salidas desde el Puerto de Blanes, en el corazón de la costa catalana. Desde el 1 de octubre de 2026 alquilas con la Licencia de Navegación (curso de 1 día, sin examen) o sales con patrón."
        }
        facts={[
          cb?.hero.badgePort || "Puerto de Blanes",
          cb?.hero.badgeCapacity || "Hasta 7 personas",
          cb?.hero.badgeLicense || "Con titulín o con patrón",
        ]}
        next="muted"
      />

      {/* INTRODUCTION */}
      <Sheet tone="muted" next="background" aria-label={s?.whyChooseTitle}>
        <div className="container mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-[7fr_5fr] lg:gap-16">
          <Rise>
            <LeadFacts text={introText} />
          </Rise>
          <Rise delay={0.1}>
            <img
              src="/images/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-amigos-snorkel.webp"
              alt="Friends enjoying a boat day on the Costa Brava"
              className="aspect-[4/3] w-full rounded-2xl object-cover"
              loading="lazy"
              width={640}
              height={800}
            />
          </Rise>
        </div>
      </Sheet>

      {/* WHY CHOOSE COSTA BRAVA */}
      <Sheet tone="background" next="muted" aria-labelledby="cb-why-title">
        <div className="container mx-auto grid max-w-6xl items-start gap-10 px-4 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <h2 id="cb-why-title" className={H2}>
              {s?.whyChooseTitle || "Por que elegir la Costa Brava para alquilar un barco"}
            </h2>
          </Rise>
          <Rise delay={0.1}>
            <DefList
              items={[
                {
                  title: s?.covesTitle || "Calas y playas inaccesibles por tierra",
                  desc: s?.covesDesc || "",
                },
                {
                  title: s?.calmWatersTitle || "Aguas tranquilas y protegidas",
                  desc: s?.calmWatersDesc || "",
                },
                {
                  title: s?.accessibleTitle || "Accesible desde Barcelona y Girona",
                  desc: s?.accessibleDesc || "",
                },
                {
                  title: s?.allLevelsTitle || "Para todos los niveles",
                  desc: s?.allLevelsDesc || "",
                },
              ]}
            />
          </Rise>
        </div>
      </Sheet>

      {/* NAVIGATION GUIDE */}
      <Sheet tone="muted" next="background" aria-labelledby="cb-routes-title">
        <div className="container mx-auto grid max-w-6xl items-start gap-10 px-4 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <h2 id="cb-routes-title" className={H2}>
              {s?.navigationGuideTitle || "Guia de Navegacion por la Costa Brava"}
            </h2>
          </Rise>
          <Rise delay={0.1}>
            <ul className="overflow-hidden rounded-2xl border border-border bg-card">
              {routes.map((route, index) => (
                <li
                  key={index}
                  className="border-b border-border px-5 py-4 last:border-b-0 sm:px-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-heading text-base font-semibold leading-snug text-foreground text-balance">
                      {route.title}
                    </h3>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {route.difficulty === "easy"
                        ? "Facil"
                        : route.difficulty === "medium"
                          ? "Media"
                          : "Avanzada"}
                    </span>
                  </div>
                  {route.description && (
                    <p className="mt-1 text-base leading-relaxed text-muted-foreground text-pretty">
                      {route.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Rise>
        </div>
      </Sheet>

      {/* BOAT TYPES COMPARISON */}
      <Sheet tone="background" next="muted" aria-labelledby="cb-types-title">
        <div className="container mx-auto max-w-6xl px-4">
          <Rise>
            <h2 id="cb-types-title" className={H2}>
              {s?.boatTypesTitle || "Tipos de Barcos para la Costa Brava"}
            </h2>
          </Rise>
          <Rise delay={0.1} className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border-2 border-primary bg-card p-6 sm:p-8">
              <h3 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                {s?.noLicenseTitle || "Excursión con Patrón"}
              </h3>
              <CheckPanel
                className="mt-5"
                items={[
                  s?.noLicensePower || "Patrón profesional a bordo",
                  s?.noLicenseCapacity || "Hasta 6 personas a bordo",
                  s?.noLicenseNavigation || "No necesitas titulación",
                  s?.noLicenseFuel || "Combustible no incluido en ningún barco",
                  s?.noLicensePrice || "Salidas de 2 a 4 horas",
                ]}
              />
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
                {s?.noLicenseDesc || ""}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h3 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                {s?.licensedTitle || "Barcos Con Licencia"}
              </h3>
              <CheckPanel
                className="mt-5"
                items={[
                  s?.licensedPower || "De 80 CV a 115 CV",
                  s?.licensedCapacity || "Hasta 7 personas a bordo",
                  s?.licensedNavigation || "Navegacion en mar abierto sin limites",
                  s?.licensedFuel || "Combustible NO incluido (deposito aparte)",
                  s?.licensedPrice || "Packs de 2, 4 y 8 horas",
                ]}
              />
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
                {s?.licensedDesc || ""}
              </p>
            </div>
          </Rise>
        </div>
      </Sheet>

      {/* BEST COVES */}
      <Sheet tone="muted" next="background" aria-labelledby="cb-coves-title">
        <div className="container mx-auto grid max-w-6xl items-start gap-10 px-4 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <h2 id="cb-coves-title" className={H2}>
              {s?.bestCovesTitle || "Las Mejores Calas de la Costa Brava en Barco"}
            </h2>
            <img
              src="/images/mejores-calas-costa-brava-mingolla-brava-rent-a-boat.webp"
              alt="Boat anchored in a crystal-clear cove along the Costa Brava coast"
              className="mt-8 aspect-[4/3] w-full rounded-2xl object-cover"
              loading="lazy"
              width={1920}
              height={600}
            />
          </Rise>
          <Rise delay={0.1}>
            <StepList steps={coves.map(cove => ({ title: cove.name, text: cove.description }))} />
          </Rise>
        </div>
      </Sheet>

      {/* FLEET / PRICING: FleetSection paints its own background-coloured band */}
      <Sheet
        tone="background"
        next="muted"
        className="pb-0 sm:pb-0"
        aria-labelledby="cb-pricing-title"
      >
        <div className="container mx-auto max-w-6xl px-4">
          <Rise>
            <h2 id="cb-pricing-title" className={H2}>
              {s?.pricingTitle || "Precios Alquiler Barco Costa Brava 2026"}
            </h2>
            <p className="mt-4 max-w-2xl text-lg font-medium leading-snug text-foreground text-pretty">
              {s?.noLicenseFuel || "Combustible no incluido en ningún barco"}
            </p>
          </Rise>
        </div>
        <FleetSection />
      </Sheet>

      {/* DEPARTURE PORTS */}
      <Sheet tone="muted" next="background" aria-labelledby="cb-ports-title">
        <div className="container mx-auto grid max-w-6xl items-start gap-10 px-4 lg:grid-cols-[5fr_7fr] lg:gap-16">
          <Rise>
            <h2 id="cb-ports-title" className={H2}>
              Puertos de Salida y Destinos
            </h2>
          </Rise>
          <Rise delay={0.1}>
            <ul className="overflow-hidden rounded-2xl border border-border bg-card">
              {departurePorts.map(port => (
                <li key={port.name} className="border-b border-border last:border-b-0">
                  <Link
                    href={port.href}
                    className="group block px-5 py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cta sm:px-6 [@media(hover:hover)]:hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-heading text-base font-semibold text-foreground">
                        {port.name}
                      </h3>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none [@media(hover:hover)]:group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mt-1 text-base leading-relaxed text-muted-foreground text-pretty">
                      {port.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </Rise>
        </div>
      </Sheet>

      {/* FAQ: cards born folded, answers stay in the DOM */}
      <FaqSheet
        items={faqDisplayItems}
        idPrefix="cb-faq"
        tone="background"
        next="muted"
        title="Preguntas Frecuentes sobre Alquiler de Barcos en la Costa Brava"
      />

      {/* CROSS-LINKS */}
      <Sheet tone="muted" next="navy" className="py-10 sm:py-12" aria-label="Enlaces relacionados">
        <div className="container mx-auto flex max-w-6xl flex-wrap gap-3 px-4">
          <Link href={localizedPath("locationCostaBrava")} className={PILL_LINK}>
            {s?.crossLinkEnglish || "This page in English: Boat Rental Costa Brava"}
          </Link>
          <Link href={localizedPath("categoryLicenseFree")} className={PILL_LINK}>
            {t.locationPages.blanes.sections?.crossLinkLicenseFree}
          </Link>
          <Link href={localizedPath("categoryLicensed")} className={PILL_LINK}>
            Barcos con licencia
          </Link>
          <Link href={localizedPath("pricing")} className={PILL_LINK}>
            Precios y tarifas
          </Link>
        </div>
      </Sheet>

      {/* CTA */}
      <Sheet tone="navy" next="muted" aria-labelledby="cb-cta-title">
        <Rise className="container mx-auto max-w-3xl px-4 text-center">
          <h2 id="cb-cta-title" className={H2}>
            {s?.ctaTitle || "Reserva tu Barco en la Costa Brava"}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/85 text-pretty sm:text-lg dark:text-foreground/85">
            {s?.ctaDescription ||
              "Elige tu barco, fecha y horario: con el titulín o con patrón. Seguro y equipo de seguridad incluidos. Reserva por WhatsApp: te confirmamos en menos de 2 horas."}
          </p>
          <InteractiveHoverButton
            tone="light"
            onClick={handleBookingWhatsApp}
            className="mt-8 min-h-12 px-8 text-base"
            data-testid="button-book-costa-brava"
          >
            {s?.ctaButton || "Reservar por WhatsApp"}
          </InteractiveHoverButton>
        </Rise>
      </Sheet>

      <RelatedLocationsSection currentLocation="costa-brava" />

      <RelatedContent currentPage="locationCostaBrava" />

      <BookingStickyBar />
      <Footer />
    </div>
  );
}
