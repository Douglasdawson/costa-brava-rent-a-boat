import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { useLanguage } from "@/hooks/use-language";
import {
  getSEOConfig,
  generateHreflangLinks,
  generateCanonicalUrl,
  generateBreadcrumbSchema
} from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useTranslations } from "@/lib/translations";
import { BOAT_DATA } from "@shared/boatData";

export default function CategoryLicenseFreePage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig('categoryLicenseFree', language);
  const hreflangLinks = generateHreflangLinks('categoryLicenseFree');
  const canonical = generateCanonicalUrl('categoryLicenseFree', language);

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage();
    openWhatsApp(message);
  };

  // License-free boats data for fleet cards
  const licenseFreeBoats = [
    {
      name: "Solar 450",
      capacity: "4-5 personas",
      engine: "15 CV",
      features: ["Toldo", "Escalera", "Radio FM"],
      price: "Desde 160€"
    },
    {
      name: "Remus 450",
      capacity: "4-5 personas",
      engine: "15 CV",
      features: ["Bimini", "Nevera", "Radio Bluetooth"],
      price: "Desde 160€"
    },
    {
      name: "Astec 400",
      capacity: "4-5 personas",
      engine: "15 CV",
      features: ["Sombra", "Escalera", "Equipo snorkel"],
      price: "Desde 150€"
    }
  ];

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
    "name": "Alquiler de Barcos Sin Licencia en Blanes",
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
    "offers": {
      "@type": "Offer",
      "description": "Alquiler barcos sin licencia desde 4 horas hasta dia completo",
      "priceCurrency": "EUR"
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
    "name": "Barcos Sin Licencia en Blanes",
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
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
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

      {/* Main Content */}
      <div className="py-12 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* What are License-Free Boats */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Shield className="w-6 h-6 text-primary" />
                {clf.whatAreTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{clf.freeNavigation}</h3>
                  <p className="text-muted-foreground mb-4">
                    {clf.freeNavigationDesc}
                  </p>

                  <h3 className="font-semibold text-lg mb-3">{clf.easyToHandle}</h3>
                  <p className="text-muted-foreground">
                    {clf.easyToHandleDesc}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{clf.safeLimits}</h3>
                  <p className="text-muted-foreground mb-4">
                    {clf.safeLimitsDesc}
                  </p>

                  <h3 className="font-semibold text-lg mb-3">{clf.completeEquipment}</h3>
                  <p className="text-muted-foreground">
                    {clf.completeEquipmentDesc}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section A: Legal Framework / Regulation */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <FileText className="w-6 h-6 text-primary" />
                {clf.regulationTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {clf.regulationIntro}
                </p>
                <p className="text-muted-foreground">
                  {clf.regulationRequirements}
                </p>
                <div className="grid md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      {language === 'es' ? 'Lo que puedes hacer' : language === 'en' ? 'What you can do' : language === 'ca' ? 'El que pots fer' : language === 'fr' ? 'Ce que vous pouvez faire' : language === 'de' ? 'Was Sie tun konnen' : language === 'nl' ? 'Wat je kunt doen' : language === 'it' ? 'Cosa puoi fare' : 'Что можно делать'}
                    </h3>
                    <p className="text-muted-foreground">
                      {clf.regulationAllowed}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      {language === 'es' ? 'Limitaciones' : language === 'en' ? 'Limitations' : language === 'ca' ? 'Limitacions' : language === 'fr' ? 'Limitations' : language === 'de' ? 'Einschrankungen' : language === 'nl' ? 'Beperkingen' : language === 'it' ? 'Limitazioni' : 'Ограничения'}
                    </h3>
                    <p className="text-muted-foreground">
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
            </CardContent>
          </Card>

          {/* Our License-Free Fleet */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Anchor className="w-6 h-6 text-primary" />
                {clf.fleetTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {licenseFreeBoats.map((boat, index) => (
                  <div key={index} className="bg-background rounded-lg p-6 shadow-sm border">
                    <h3 className="font-semibold text-xl mb-3">{boat.name}</h3>
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
            </CardContent>
          </Card>

          {/* Section B: Detailed Comparison Table */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <ArrowLeftRight className="w-6 h-6 text-primary" />
                {clf.comparisonTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                {clf.comparisonIntro}
              </p>
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
            </CardContent>
          </Card>

          {/* Advantages */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Heart className="w-6 h-6 text-primary" />
                {clf.advantagesTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{clf.totalAccessibility}</h3>
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
                  <h3 className="font-semibold text-lg mb-3">{clf.guaranteedFun}</h3>
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
            </CardContent>
          </Card>

          {/* Section C: Testimonials */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Star className="w-6 h-6 text-primary" />
                {clf.testimonialsTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg p-6 border">
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
            </CardContent>
          </Card>

          {/* Safety and Requirements */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Shield className="w-6 h-6 text-primary" />
                {clf.safetyTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{clf.minRequirements}</h3>
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
                  <h3 className="font-semibold text-lg mb-3">{clf.safetyIncluded}</h3>
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
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <FileText className="w-6 h-6 text-primary" />
                {language === 'es' ? 'Preguntas Frecuentes' : language === 'en' ? 'Frequently Asked Questions' : language === 'ca' ? 'Preguntes Frequents' : language === 'fr' ? 'Questions Frequentes' : language === 'de' ? 'Haufig Gestellte Fragen' : language === 'nl' ? 'Veelgestelde Vragen' : language === 'it' ? 'Domande Frequenti' : 'Часто задаваемые вопросы'}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {faqItems.map((faq, index) => (
                  <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                    <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Explore Destinations - Internal Linking */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">Navega desde Blanes con barco sin licencia</h3>
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
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="bg-primary text-white">
            <CardContent className="py-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                {clf.ctaTitle}
              </h2>
              <p className="text-lg mb-6 max-w-2xl mx-auto">
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
            </CardContent>
          </Card>

        </div>
      </div>

      <RelatedContent currentPage="categoryLicenseFree" />

      <Footer />
    </div>
  );
}
