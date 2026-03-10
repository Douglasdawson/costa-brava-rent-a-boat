import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Clock, 
  Anchor, 
  Users, 
  Star,
  Navigation as NavigationIcon,
  Sun,
  Waves,
  Camera,
  Car,
  Ship,
  Music,
  Utensils
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RelatedLocationsSection from "@/components/RelatedLocationsSection";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { 
  getSEOConfig, 
  generateHreflangLinks, 
  generateCanonicalUrl,
  generateBreadcrumbSchema
} from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useTranslations } from "@/lib/translations";

export default function LocationLloretPage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig('locationLloret', language);
  const hreflangLinks = generateHreflangLinks('locationLloret');
  const canonical = generateCanonicalUrl('locationLloret', language);

  const s = t.locationPages.lloret.sections!;

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage();
    openWhatsApp(message);
  };

  // Location-specific schema for Lloret de Mar
  const locationSchema = {
    "@type": "TouristDestination",
    "name": "Excursiones en Barco a Lloret de Mar desde Blanes",
    "description": "Alquiler de barcos para visitar Lloret de Mar desde Puerto de Blanes. Embarcaciones sin licencia y con licencia para descubrir las playas de Lloret.",
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 41.7000,
      "longitude": 2.8500
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Playa de Lloret de Mar",
      "addressLocality": "Lloret de Mar",
      "addressRegion": "Girona",
      "postalCode": "17310",
      "addressCountry": "ES"
    },
    "touristType": ["Family", "Adventure", "Beach", "Party"],
    "availableLanguage": ["Spanish", "Catalan", "English", "French"],
    "provider": {
      "@type": "LocalBusiness",
      "name": "Costa Brava Rent a Boat Blanes",
      "telephone": "+34611500372",
      "url": "https://costabravarentaboat.com/"
    }
  };

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.locationLloret, url: "/alquiler-barcos-lloret-de-mar" }
  ]);

  // Combine schemas using @graph
  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      locationSchema,
      breadcrumbSchema
    ]
  };

  return (
    <div className="min-h-screen">
      <SEO 
        title={seoConfig.title}
        description={seoConfig.description}
        ogTitle={seoConfig.ogTitle}
        ogDescription={seoConfig.ogDescription}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={combinedJsonLd}
      />
      <Navigation />
      
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumbs 
            items={[
              { label: 'breadcrumbs.home', href: '/' },
              { label: 'breadcrumbs.locationLloret' }
            ]}
          />
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-teal-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <MapPin className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-gray-900">
                {t.locationPages.lloret.hero.title}
              </h1>
            </div>
            <p className="text-lg text-gray-600 mb-6 max-w-4xl mx-auto">
              {t.locationPages.lloret.hero.subtitle}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <Anchor className="w-4 h-4 mr-2" />
                {t.locationPages.lloret.hero.badgeFrom}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Clock className="w-4 h-4 mr-2" />
                {t.locationPages.lloret.hero.badgeTime}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Users className="w-4 h-4 mr-2" />
                {t.locationPages.lloret.hero.badgeCapacity}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Why Visit Lloret de Mar by Boat */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Star className="w-6 h-6 text-cta" />
                {s.whyLloretTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.uniquePerspective}</h3>
                  <p className="text-gray-700 mb-4">{s.uniquePerspectiveDesc}</p>

                  <h3 className="font-semibold text-lg mb-3">{s.spectacularBeaches}</h3>
                  <p className="text-gray-700">{s.spectacularBeachesDesc}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.vibrantAtmosphere}</h3>
                  <p className="text-gray-700 mb-4">{s.vibrantAtmosphereDesc}</p>

                  <h3 className="font-semibold text-lg mb-3">{s.easyAccess}</h3>
                  <p className="text-gray-700">{s.easyAccessDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Beaches and Spots in Lloret */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Waves className="w-6 h-6 text-primary" />
                {s.beachesTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.playaLloret}</h3>
                  <p className="text-gray-600 text-sm mb-2">{s.playaLloretSub}</p>
                  <p className="text-gray-700">{s.playaLloretDesc}</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sun className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.calaBoadella}</h3>
                  <p className="text-gray-600 text-sm mb-2">{s.calaBoadellaSub}</p>
                  <p className="text-gray-700">{s.calaBoadellaDesc}</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.santaCristina}</h3>
                  <p className="text-gray-600 text-sm mb-2">{s.santaCristinaSub}</p>
                  <p className="text-gray-700">{s.santaCristinaDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What to Do in Lloret */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Music className="w-6 h-6 text-primary" />
                {s.whatToDoTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.entertainment}</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Music className="w-4 h-4 text-primary mr-2" />
                      <span>{s.nightlife}</span>
                    </li>
                    <li className="flex items-center">
                      <Utensils className="w-4 h-4 text-primary mr-2" />
                      <span>{s.restaurantsSea}</span>
                    </li>
                    <li className="flex items-center">
                      <Waves className="w-4 h-4 text-primary mr-2" />
                      <span>{s.waterSports}</span>
                    </li>
                    <li className="flex items-center">
                      <Camera className="w-4 h-4 text-primary mr-2" />
                      <span>{s.santaClotildeMirador}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.pointsOfInterest}</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Star className="w-4 h-4 text-primary mr-2" />
                      <span>{s.mujerMarinera}</span>
                    </li>
                    <li className="flex items-center">
                      <NavigationIcon className="w-4 h-4 text-primary mr-2" />
                      <span>{s.castilloSantJoan}</span>
                    </li>
                    <li className="flex items-center">
                      <Car className="w-4 h-4 text-primary mr-2" />
                      <span>{s.jardinesSantaClotilde}</span>
                    </li>
                    <li className="flex items-center">
                      <Ship className="w-4 h-4 text-primary mr-2" />
                      <span>{s.sportsMarina}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Tips */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <NavigationIcon className="w-6 h-6 text-primary" />
                {s.navigationTipsTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.recommendedRoute}</h3>
                  <p className="text-gray-700 mb-4">{s.recommendedRouteDesc}</p>

                  <h3 className="font-semibold text-lg mb-3">{s.bestTimes}</h3>
                  <p className="text-gray-700">{s.bestTimesDesc}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.whereToAnchor}</h3>
                  <p className="text-gray-700 mb-4">{s.whereToAnchorDesc}</p>

                  <h3 className="font-semibold text-lg mb-3">{s.safety}</h3>
                  <p className="text-gray-700">{s.safetyDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="bg-primary text-white">
            <CardContent className="py-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                {s.ctaTitle}
              </h2>
              <p className="text-lg mb-6 max-w-2xl mx-auto">
                {s.ctaDescription}
              </p>
              <Button
                onClick={handleBookingWhatsApp}
                size="lg"
                variant="secondary"
                className="text-primary hover:text-primary"
                data-testid="button-whatsapp-lloret"
              >
                {s.ctaButton}
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      <RelatedLocationsSection currentLocation="lloret" />
      
      <Footer />
    </div>
  );
}