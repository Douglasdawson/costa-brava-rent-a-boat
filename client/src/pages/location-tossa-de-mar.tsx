import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Anchor, 
  Users, 
  Star,
  Navigation as NavigationIcon,
  Sun,
  Waves,
  Camera,
  Shield,
  Castle,
  Crown,
  Heart
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

export default function LocationTossaPage() {
  const { language } = useLanguage();
  const t = useTranslations();
  const seoConfig = getSEOConfig('locationTossa', language);
  const hreflangLinks = generateHreflangLinks('locationTossa');
  const canonical = generateCanonicalUrl('locationTossa', language);

  const s = t.locationPages.tossa.sections!;

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage();
    openWhatsApp(message);
  };

  // Location-specific schema for Tossa de Mar
  const locationSchema = {
    "@type": "TouristDestination",
    "name": "Excursiones en Barco a Tossa de Mar desde Blanes",
    "description": "Alquiler de barcos para visitar Tossa de Mar desde Puerto de Blanes. Embarcaciones sin licencia y con licencia para descubrir la Vila Vella y calas de Tossa.",
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 41.7200,
      "longitude": 2.9313
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Playa de Tossa de Mar",
      "addressLocality": "Tossa de Mar",
      "addressRegion": "Girona",
      "postalCode": "17320",
      "addressCountry": "ES"
    },
    "touristType": ["Family", "Cultural", "Beach", "Historic"],
    "availableLanguage": ["Spanish", "Catalan", "English", "French"],
    "provider": {
      "@type": "LocalBusiness",
      "name": "Costa Brava Rent a Boat Blanes",
      "telephone": "+34611500372",
      "url": "https://costabravarentaboat.app/"
    }
  };

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.locationTossa, url: "/alquiler-barcos-tossa-de-mar" }
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
              { label: 'breadcrumbs.locationTossa' }
            ]}
          />
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-emerald-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <Castle className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-gray-900">
                {t.locationPages.tossa.hero.title}
              </h1>
            </div>
            <p className="text-lg text-gray-600 mb-6 max-w-4xl mx-auto">
              {t.locationPages.tossa.hero.subtitle}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <Anchor className="w-4 h-4 mr-2" />
                {t.locationPages.tossa.hero.badgeFrom}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Clock className="w-4 h-4 mr-2" />
                {t.locationPages.tossa.hero.badgeTime}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Users className="w-4 h-4 mr-2" />
                {t.locationPages.tossa.hero.badgeCapacity}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Why Visit Tossa de Mar by Boat */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Crown className="w-6 h-6 text-yellow-500" />
                {s.whyTossaTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.jewelCostaBrava}</h3>
                  <p className="text-gray-700 mb-4">{s.jewelCostaBravaDesc}</p>

                  <h3 className="font-semibold text-lg mb-3">{s.historicHeritage}</h3>
                  <p className="text-gray-700">{s.historicHeritageDesc}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.paradisiacalCoves}</h3>
                  <p className="text-gray-700 mb-4">{s.paradisiacalCovesDesc}</p>

                  <h3 className="font-semibold text-lg mb-3">{s.panoramicNavigation}</h3>
                  <p className="text-gray-700">{s.panoramicNavigationDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Beaches and Historic Sites */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Shield className="w-6 h-6 text-primary" />
                {s.attractionsTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Castle className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.vilaVella}</h3>
                  <p className="text-gray-600 text-sm mb-2">{s.vilaVellaSub}</p>
                  <p className="text-gray-700">{s.vilaVellaDesc}</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Waves className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.playaGrande}</h3>
                  <p className="text-gray-600 text-sm mb-2">{s.playaGrandeSub}</p>
                  <p className="text-gray-700">{s.playaGrandeDesc}</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sun className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.virginCoves}</h3>
                  <p className="text-gray-600 text-sm mb-2">{s.virginCovesSub}</p>
                  <p className="text-gray-700">{s.virginCovesDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What to Do in Tossa */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Heart className="w-6 h-6 text-primary" />
                {s.whatToDoTitle}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.cultureHistory}</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Castle className="w-4 h-4 text-green-600 mr-2" />
                      <span>{s.exploreVilaVella}</span>
                    </li>
                    <li className="flex items-center">
                      <Shield className="w-4 h-4 text-green-600 mr-2" />
                      <span>{s.climbWalls}</span>
                    </li>
                    <li className="flex items-center">
                      <Camera className="w-4 h-4 text-green-600 mr-2" />
                      <span>{s.municipalMuseum}</span>
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 text-green-600 mr-2" />
                      <span>{s.tossaLighthouse}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.natureRelax}</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Waves className="w-4 h-4 text-green-600 mr-2" />
                      <span>{s.diveCrystalWaters}</span>
                    </li>
                    <li className="flex items-center">
                      <Sun className="w-4 h-4 text-green-600 mr-2" />
                      <span>{s.anchorSecretCoves}</span>
                    </li>
                    <li className="flex items-center">
                      <NavigationIcon className="w-4 h-4 text-green-600 mr-2" />
                      <span>{s.coastalPaths}</span>
                    </li>
                    <li className="flex items-center">
                      <Camera className="w-4 h-4 text-green-600 mr-2" />
                      <span>{s.sunsetFromSea}</span>
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

                  <h3 className="font-semibold text-lg mb-3">{s.bestSeason}</h3>
                  <p className="text-gray-700">{s.bestSeasonDesc}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">{s.anchoringZones}</h3>
                  <p className="text-gray-700 mb-4">{s.anchoringZonesDesc}</p>

                  <h3 className="font-semibold text-lg mb-3">{s.safeNavigation}</h3>
                  <p className="text-gray-700">{s.safeNavigationDesc}</p>
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
                data-testid="button-whatsapp-tossa"
              >
                {s.ctaButton}
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      <RelatedLocationsSection currentLocation="tossa" />
      
      <Footer />
    </div>
  );
}