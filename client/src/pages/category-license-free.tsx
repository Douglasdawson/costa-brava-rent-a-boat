import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Clock,
  CheckCircle,
  Anchor,
  Star,
  Gauge,
  Shield,
  Heart,
  Zap,
  Navigation as NavigationIcon,
  Waves,
  Sun,
  ChevronRight,
  FileText,
  ArrowLeftRight,
  Quote,
  Fuel
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RelatedContent from "@/components/RelatedContent";
import { SEO } from "@/components/SEO";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import { FAQSection } from "@/components/FAQSection";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLanguage } from "@/hooks/use-language";
import {
  getSEOConfig,
  generateHreflangLinks,
  generateCanonicalUrl,
  generateBreadcrumbSchema
} from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useTranslations } from "@/lib/translations";
import { BOAT_DATA, type BoatData } from "@shared/boatData";
import type { Boat } from "@shared/schema";
import { minPriceAcrossBoats } from "@shared/pricing";
import { useQuery } from "@tanstack/react-query";
import {
  BUSINESS_RATING_STR,
  BUSINESS_REVIEW_COUNT_STR,
} from "@shared/businessProfile";

function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} className={`transition-[opacity,transform,filter] duration-700 ${isVisible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-6 blur-[2px]"} ${className}`}>
      {children}
    </div>
  );
}

export default function CategoryLicenseFreePage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig('categoryLicenseFree', language);
  const hreflangLinks = generateHreflangLinks('categoryLicenseFree');
  const canonical = generateCanonicalUrl('categoryLicenseFree', language);

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
    openWhatsApp(message);
  };

  // License-free fleet: derived from /api/boats with a BOAT_DATA fallback so
  // SSR and first-paint never render an empty grid. Excursion Privada is
  // excluded because it's a captained service, not a self-service rental.
  const { data: apiBoats } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const liveUnlicensed = (apiBoats ?? []).filter(
    (b) => b.isActive && !b.requiresLicense && b.id !== "excursion-privada",
  );
  const fallbackUnlicensed = Object.values(BOAT_DATA).filter(
    (b) => b.subtitle.startsWith("Sin licencia") && b.id !== "excursion-privada",
  );
  const sourceBoats: Array<Boat | BoatData> =
    liveUnlicensed.length > 0 ? liveUnlicensed : fallbackUnlicensed;

  const licenseFreeBoats = sourceBoats.map((b) => {
    const specs = (b.specifications ?? {}) as { engine?: string; capacity?: string };
    const isDbBoat = "isActive" in b;
    const capacity = isDbBoat
      ? `${(b as Boat).capacity} personas`
      : (specs.capacity ?? "");
    const minPrice = minPriceAcrossBoats([b as { pricing?: unknown }], "1h", "BAJA");
    return {
      id: b.id,
      name: b.name,
      capacity,
      engine: specs.engine ?? "",
      features: (b.features ?? []).slice(0, 3),
      price: minPrice ? `Desde ${minPrice}\u20AC/h` : "",
    };
  });

  // Detailed comparison data from boatData.ts for the comparison table
  const comparisonBoats = [
    {
      id: "solar-450",
      data: BOAT_DATA["solar-450"],
    },
    {
      id: "remus-450",
      data: BOAT_DATA["remus-450"],
    },
    {
      id: "astec-400",
      data: BOAT_DATA["astec-400"],
    },
    {
      id: "astec-480",
      data: BOAT_DATA["astec-480"],
    },
  ];

  const clf = t.categoryLicenseFree!;

  // FAQ items for structured data and display
  const faqItems = [
    {
      question: clf.faqSpeedQuestion,
      answer: clf.faqSpeedAnswer,
    },
    {
      question: clf.faqChildrenQuestion,
      answer: clf.faqChildrenAnswer,
    },
    {
      question: clf.faqDistanceQuestion,
      answer: clf.faqDistanceAnswer,
    },
  ];

  // Best-for descriptions keyed by boat id
  const bestForMap: Record<string, string> = {
    "solar-450": clf.comparisonSolar450,
    "remus-450": clf.comparisonRemus450,
    "astec-400": clf.comparisonAstec400,
    "astec-480": clf.comparisonAstec480,
  };

  // Service schema for license-free boats
  const serviceSchema = {
    "@type": "Service",
    "name": "Alquiler de Barcos Sin Licencia en Costa Brava — Puerto de Blanes",
    "description": "Alquiler de embarcaciones sin licencia hasta 15 CV en Puerto de Blanes, Costa Brava. No requiere titulacion nautica. Barcos para 4-7 personas.",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Costa Brava Rent a Boat Blanes",
      "telephone": "+34611500372",
      "url": "https://www.costabravarentaboat.com/",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Puerto de Blanes",
        "addressLocality": "Blanes",
        "addressRegion": "Girona",
        "postalCode": "17300",
        "addressCountry": "ES"
      }
    },
    "serviceType": "Boat Rental",
    "areaServed": {
      "@type": "Place",
      "name": "Costa Brava, Cataluna"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": BUSINESS_RATING_STR,
      "reviewCount": BUSINESS_REVIEW_COUNT_STR,
      "bestRating": "5",
      "worstRating": "1"
    },
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "70",
      "highPrice": "95",
      "priceCurrency": "EUR",
      "offerCount": "4",
      "availability": "https://schema.org/InStock"
    }
  };

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.categoryLicenseFree, url: "/barcos-sin-licencia" }
  ]);

  // ItemList schema for category page (helps Google understand this is a product listing)
  const itemListSchema = {
    "@type": "ItemList",
    "name": "Barcos Sin Licencia en Costa Brava — Puerto de Blanes",
    "numberOfItems": licenseFreeBoats.length,
    "itemListElement": licenseFreeBoats.map((boat, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": boat.name,
      "url": `https://www.costabravarentaboat.com/barcos-sin-licencia`,
      "item": {
        "@type": "Product",
        "name": boat.name,
        "description": `Barco sin licencia ${boat.name}, ${boat.capacity}, motor ${boat.engine}`,
        "brand": { "@type": "Brand", "name": "Costa Brava Rent a Boat" },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": BUSINESS_RATING_STR,
          "reviewCount": BUSINESS_REVIEW_COUNT_STR,
          "bestRating": "5",
          "worstRating": "1"
        },
        "review": {
          "@type": "Review",
          "author": { "@type": "Person", "name": "Maria G." },
          "datePublished": "2025-08-15",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5",
            "bestRating": "5",
            "worstRating": "1"
          },
          "reviewBody": "Experiencia increible navegando por la Costa Brava sin necesidad de licencia. El barco estaba en perfecto estado y la atencion fue excelente."
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "EUR",
          "price": boat.price.replace(/[^\d]/g, ""),
          "availability": "https://schema.org/InStock",
          "seller": { "@type": "Organization", "name": "Costa Brava Rent a Boat Blanes" }
        }
      }
    }))
  };

  // FAQ schema for structured data
  const faqSchema = {
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  // Combine schemas using @graph
  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      serviceSchema,
      itemListSchema,
      breadcrumbSchema,
      faqSchema
    ]
  };

  // Testimonial data
  const testimonials = [
    {
      name: clf.testimonial1Name,
      text: clf.testimonial1Text,
      context: clf.testimonial1Context,
      rating: 5,
    },
    {
      name: clf.testimonial2Name,
      text: clf.testimonial2Text,
      context: clf.testimonial2Context,
      rating: 5,
    },
    {
      name: clf.testimonial3Name,
      text: clf.testimonial3Text,
      context: clf.testimonial3Context,
      rating: 5,
    },
    {
      name: clf.testimonial4Name,
      text: clf.testimonial4Text,
      context: clf.testimonial4Context,
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen">
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

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <Zap className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                {clf.heroTitle}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto leading-relaxed">
              {clf.heroDescription}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <CheckCircle className="w-4 h-4 mr-2" />
                {clf.badgeNoLicense}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Gauge className="w-4 h-4 mr-2" />
                {clf.badgePower}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Users className="w-4 h-4 mr-2" />
                {clf.badgeCapacity}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* What are License-Free Boats */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-3">
              <h2 className="flex items-center gap-3 text-2xl font-heading font-semibold mb-6">
                <Shield className="w-6 h-6 text-primary" />
                {clf.whatAreTitle}
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-3">{clf.freeNavigation}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {clf.freeNavigationDesc}
                  </p>

                  <h3 className="font-heading font-semibold text-lg mb-3">{clf.easyToHandle}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {clf.easyToHandleDesc}
                  </p>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-3">{clf.safeLimits}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {clf.safeLimitsDesc}
                  </p>

                  <h3 className="font-heading font-semibold text-lg mb-3">{clf.completeEquipment}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {clf.completeEquipmentDesc}
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <img
                src="/images/boats/astec-480/alquiler-barco-astec-480-rent-a-boat-costa-brava-blanes-navegando-costa.webp"
                alt="License-free boat navigating along the Costa Brava coast"
                className="w-full rounded-2xl object-cover aspect-[4/5]"
                loading="lazy"
                width={640}
                height={800}
              />
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Photo break */}
      <div className="w-full overflow-hidden">
        <img
          src="/images/blog/calas-costa-brava.jpg"
          alt="Crystal-clear coves of Costa Brava accessible by license-free boat"
          className="w-full h-[35vh] min-h-[250px] max-h-[400px] object-cover"
          loading="lazy"
          width={1920}
          height={600}
        />
      </div>

      {/* Section A: Legal Framework / Regulation */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl font-heading font-semibold mb-6">
            <FileText className="w-6 h-6 text-primary" />
            {clf.regulationTitle}
          </h2>
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {clf.regulationIntro}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {clf.regulationRequirements}
            </p>
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <div>
                <h3 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  {language === 'es' ? 'Lo que puedes hacer' : language === 'en' ? 'What you can do' : language === 'ca' ? 'El que pots fer' : language === 'fr' ? 'Ce que vous pouvez faire' : language === 'de' ? 'Was Sie tun konnen' : language === 'nl' ? 'Wat je kunt doen' : language === 'it' ? 'Cosa puoi fare' : 'Что можно делать'}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {clf.regulationAllowed}
                </p>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  {language === 'es' ? 'Limitaciones' : language === 'en' ? 'Limitations' : language === 'ca' ? 'Limitacions' : language === 'fr' ? 'Limitations' : language === 'de' ? 'Einschrankungen' : language === 'nl' ? 'Beperkingen' : language === 'it' ? 'Limitazioni' : 'Ограничения'}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {clf.regulationNotAllowed}
                </p>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <p className="text-foreground font-medium flex items-start gap-2">
                <Fuel className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                {clf.regulationFuelIncluded}
              </p>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Our License-Free Fleet */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl font-heading font-semibold mb-6">
            <Anchor className="w-6 h-6 text-primary" />
            {clf.fleetTitle}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {licenseFreeBoats.map((boat, index) => (
              <div key={index} className="bg-background rounded-2xl p-6 shadow-sm border">
                <h3 className="font-heading font-semibold text-xl mb-3">{boat.name}</h3>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-muted-foreground">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{boat.capacity}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Gauge className="w-4 h-4 mr-2" />
                    <span>{boat.engine}</span>
                  </div>
                  <div className="space-y-1">
                    {boat.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-muted-foreground">
                        <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-lg font-semibold text-primary mb-3">
                  {boat.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* Section B: Detailed Comparison Table */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl font-heading font-semibold mb-6">
            <ArrowLeftRight className="w-6 h-6 text-primary" />
            {clf.comparisonTitle}
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {clf.comparisonIntro}
          </p>
          <div className="rounded-2xl bg-background overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-semibold">{clf.comparisonBoatName}</th>
                    <th className="text-left p-3 font-semibold">{clf.comparisonCapacity}</th>
                    <th className="text-left p-3 font-semibold">{clf.comparisonEngine}</th>
                    <th className="text-left p-3 font-semibold">{clf.comparisonBestFor}</th>
                    <th className="text-right p-3 font-semibold">{clf.comparisonPriceLow}</th>
                    <th className="text-right p-3 font-semibold">{clf.comparisonPriceHigh}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonBoats.map((boat) => (
                    <tr key={boat.id} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{boat.data.name}</td>
                      <td className="p-3 text-muted-foreground">{boat.data.specifications.capacity}</td>
                      <td className="p-3 text-muted-foreground">{boat.data.specifications.engine}</td>
                      <td className="p-3 text-muted-foreground">{bestForMap[boat.id]}</td>
                      <td className="p-3 text-right font-semibold text-primary">
                        {boat.data.pricing.BAJA.prices["2h"]}{"\u20AC"}
                      </td>
                      <td className="p-3 text-right font-semibold text-primary">
                        {boat.data.pricing.ALTA.prices["2h"]}{"\u20AC"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Advantages */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl font-heading font-semibold mb-6">
            <Heart className="w-6 h-6 text-primary" />
            {clf.advantagesTitle}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-heading font-semibold text-lg mb-3">{clf.totalAccessibility}</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-primary mr-2" />
                  <span>{clf.noLicenseNeeded}</span>
                </li>
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-primary mr-2" />
                  <span>{clf.quickLearning}</span>
                </li>
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-primary mr-2" />
                  <span>{clf.lowerCost}</span>
                </li>
                <li className="flex items-center">
                  <Star className="w-4 h-4 text-primary mr-2" />
                  <span>{clf.perfectBeginners}</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg mb-3">{clf.guaranteedFun}</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Waves className="w-4 h-4 text-primary mr-2" />
                  <span>{clf.accessCoves}</span>
                </li>
                <li className="flex items-center">
                  <Sun className="w-4 h-4 text-primary mr-2" />
                  <span>{clf.idealFamilies}</span>
                </li>
                <li className="flex items-center">
                  <NavigationIcon className="w-4 h-4 text-primary mr-2" />
                  <span>{clf.safeCoastalNavigation}</span>
                </li>
                <li className="flex items-center">
                  <Clock className="w-4 h-4 text-primary mr-2" />
                  <span>{clf.immediateAvailability}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Section C: Testimonials */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl font-heading font-semibold mb-6">
            <Star className="w-6 h-6 text-primary" />
            {clf.testimonialsTitle}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-background/80 rounded-2xl p-6 border">
                <div className="flex items-start gap-3 mb-3">
                  <Quote className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <p className="text-foreground italic leading-relaxed">
                    {testimonial.text}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.context}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* Safety and Requirements */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl font-heading font-semibold mb-6">
            <Shield className="w-6 h-6 text-primary" />
            {clf.safetyTitle}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-heading font-semibold text-lg mb-3">{clf.minRequirements}</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-2" />
                  <span>{clf.minAge}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-2" />
                  <span>{clf.validId}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-2" />
                  <span>{clf.deposit}</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-2" />
                  <span>{clf.safetyBriefing}</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg mb-3">{clf.safetyIncluded}</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Shield className="w-4 h-4 text-primary mr-2" />
                  <span>{clf.lifeJackets}</span>
                </li>
                <li className="flex items-center">
                  <Shield className="w-4 h-4 text-primary mr-2" />
                  <span>{clf.fireExtinguisher}</span>
                </li>
                <li className="flex items-center">
                  <Shield className="w-4 h-4 text-primary mr-2" />
                  <span>{clf.vhfRadio}</span>
                </li>
                <li className="flex items-center">
                  <Shield className="w-4 h-4 text-primary mr-2" />
                  <span>{clf.civilLiability}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* FAQ Section */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl font-heading font-semibold mb-6">
            <FileText className="w-6 h-6 text-primary" />
            {language === 'es' ? 'Preguntas Frecuentes' : language === 'en' ? 'Frequently Asked Questions' : language === 'ca' ? 'Preguntes Frequents' : language === 'fr' ? 'Questions Frequentes' : language === 'de' ? 'Haufig Gestellte Fragen' : language === 'nl' ? 'Veelgestelde Vragen' : language === 'it' ? 'Domande Frequenti' : 'Часто задаваемые вопросы'}
          </h2>
          <FAQSection items={faqItems} />
        </div>
      </RevealSection>

      {/* Explore Destinations - Internal Linking */}
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="font-heading font-semibold text-lg mb-4">Navega desde Blanes con barco sin licencia</h3>
          <div className="flex flex-wrap gap-3">
            <a href={localizedPath("locationBlanes")} className="text-primary hover:underline flex items-center gap-1">
              <ChevronRight className="w-4 h-4" />
              Salida desde el Puerto de Blanes
            </a>
            <a href={localizedPath("locationLloret")} className="text-primary hover:underline flex items-center gap-1">
              <ChevronRight className="w-4 h-4" />
              Excursion sin licencia a Lloret de Mar
            </a>
            <a href={localizedPath("locationTossa")} className="text-primary hover:underline flex items-center gap-1">
              <ChevronRight className="w-4 h-4" />
              Ruta en barco hasta Tossa de Mar
            </a>
            <a href={localizedPath("pricing")} className="text-primary hover:underline flex items-center gap-1">
              <ChevronRight className="w-4 h-4" />
              Consulta precios por temporada
            </a>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 sm:py-20 bg-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-heading font-bold mb-4 text-white">
            {clf.ctaTitle}
          </h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto text-white/90 leading-relaxed">
            {clf.ctaDescription}
          </p>
          <Button
            onClick={handleBookingWhatsApp}
            size="lg"
            variant="secondary"
            className="text-primary hover:text-primary"
            data-testid="button-whatsapp-license-free"
          >
            {clf.ctaButton}
          </Button>
        </div>
      </div>

      <RelatedContent currentPage="categoryLicenseFree" />

      <Footer />
    </div>
  );
}
