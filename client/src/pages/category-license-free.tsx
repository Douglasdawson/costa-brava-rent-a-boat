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
  ChevronRight
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

export default function CategoryLicenseFreePage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig('categoryLicenseFree', language);
  const hreflangLinks = generateHreflangLinks('categoryLicenseFree');
  const canonical = generateCanonicalUrl('categoryLicenseFree', language);

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage();
    openWhatsApp(message);
  };

  // Service schema for license-free boats
  const serviceSchema = {
    "@type": "Service",
    "name": "Alquiler de Barcos Sin Licencia en Blanes",
    "description": "Alquiler de embarcaciones sin licencia hasta 15 CV en Puerto de Blanes, Costa Brava. No requiere titulación náutica. Barcos para 4-7 personas.",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Costa Brava Rent a Boat Blanes",
      "telephone": "+34611500372",
      "url": "https://costabravarentaboat.com/",
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
      "name": "Costa Brava, Cataluña"
    },
    "offers": {
      "@type": "Offer",
      "description": "Alquiler barcos sin licencia desde 4 horas hasta día completo",
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
      "url": `https://costabravarentaboat.com/barcos-sin-licencia`,
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

  // Combine schemas using @graph
  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      serviceSchema,
      itemListSchema,
      breadcrumbSchema
    ]
  };

  // License-free boats data
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

  const clf = t.categoryLicenseFree!;

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

          {/* Explore Destinations - Internal Linking */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">Navega desde Blanes con barco sin licencia</h3>
              <div className="flex flex-wrap gap-3">
                <a href="/alquiler-barcos-blanes" className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Salida desde el Puerto de Blanes
                </a>
                <a href="/alquiler-barcos-lloret-de-mar" className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Excursion sin licencia a Lloret de Mar
                </a>
                <a href="/alquiler-barcos-tossa-de-mar" className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Ruta en barco hasta Tossa de Mar
                </a>
                <a href="/precios" className="text-primary hover:underline flex items-center gap-1">
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