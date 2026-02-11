import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      "url": "https://costabravarentaboat.app/"
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
                Excursiones en Barco a Lloret de Mar
              </h1>
            </div>
            <p className="text-lg text-gray-600 mb-6 max-w-4xl mx-auto">
              Descubre las famosas playas de Lloret de Mar navegando desde el Puerto de Blanes. 
              25 minutos de navegación hasta uno de los destinos más populares de la Costa Brava.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <Anchor className="w-4 h-4 mr-2" />
                Desde Puerto de Blanes
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Clock className="w-4 h-4 mr-2" />
                25 min navegando
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Users className="w-4 h-4 mr-2" />
                4-7 personas
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
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Star className="w-6 h-6 text-yellow-500" />
                ¿Por qué visitar Lloret de Mar en barco?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Perspectiva Única</h3>
                  <p className="text-gray-700 mb-4">
                    Ver Lloret de Mar desde el mar te ofrece una perspectiva completamente diferente. 
                    Contempla sus icónicos acantilados, calas escondidas y la famosa escultura de 
                    "La Mujer Marinera" desde el agua.
                  </p>
                  
                  <h3 className="font-semibold text-lg mb-3">Playas Espectaculares</h3>
                  <p className="text-gray-700">
                    Lloret cuenta con algunas de las mejores playas de la Costa Brava: 
                    Playa de Lloret, Cala Boadella, Santa Cristina y Cala Treumal. 
                    Cada una con su encanto especial.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Ambiente Vibrante</h3>
                  <p className="text-gray-700 mb-4">
                    Lloret de Mar es famoso por su ambiente animado, chiringuitos en la playa, 
                    restaurantes con vistas al mar y una amplia oferta de entretenimiento. 
                    Perfecto para diferentes tipos de visitantes.
                  </p>
                  
                  <h3 className="font-semibold text-lg mb-3">Fácil Acceso en Barco</h3>
                  <p className="text-gray-700">
                    Solo 25 minutos navegando desde Blanes hasta Lloret. Puedes fondear 
                    cerca de las playas principales o explorar las calas más apartadas 
                    antes de llegar al centro.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Beaches and Spots in Lloret */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Waves className="w-6 h-6 text-primary" />
                Principales Playas y Calas de Lloret de Mar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Playa de Lloret</h3>
                  <p className="text-gray-600 text-sm mb-2">Playa principal - 1,5 km</p>
                  <p className="text-gray-700">La playa principal de Lloret con todos los servicios, restaurantes y ambiente animado.</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sun className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Cala Boadella</h3>
                  <p className="text-gray-600 text-sm mb-2">Cala naturista</p>
                  <p className="text-gray-700">Cala tranquila y naturista al sur de Lloret, ideal para quienes buscan tranquilidad.</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Santa Cristina</h3>
                  <p className="text-gray-600 text-sm mb-2">Playa familiar</p>
                  <p className="text-gray-700">Hermosa playa familiar con hermitas y excelentes vistas. Menos masificada que la principal.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What to Do in Lloret */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Music className="w-6 h-6 text-primary" />
                Qué Hacer en Lloret de Mar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Entretenimiento y Ocio</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Music className="w-4 h-4 text-green-600 mr-2" />
                      <span>Discotecas y vida nocturna</span>
                    </li>
                    <li className="flex items-center">
                      <Utensils className="w-4 h-4 text-green-600 mr-2" />
                      <span>Restaurantes frente al mar</span>
                    </li>
                    <li className="flex items-center">
                      <Waves className="w-4 h-4 text-green-600 mr-2" />
                      <span>Deportes acuáticos</span>
                    </li>
                    <li className="flex items-center">
                      <Camera className="w-4 h-4 text-green-600 mr-2" />
                      <span>Mirador de Santa Clotilde</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Puntos de Interés</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Star className="w-4 h-4 text-green-600 mr-2" />
                      <span>Escultura "La Mujer Marinera"</span>
                    </li>
                    <li className="flex items-center">
                      <NavigationIcon className="w-4 h-4 text-green-600 mr-2" />
                      <span>Castillo de Sant Joan</span>
                    </li>
                    <li className="flex items-center">
                      <Car className="w-4 h-4 text-green-600 mr-2" />
                      <span>Jardines de Santa Clotilde</span>
                    </li>
                    <li className="flex items-center">
                      <Ship className="w-4 h-4 text-green-600 mr-2" />
                      <span>Puerto deportivo</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Tips */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <NavigationIcon className="w-6 h-6 text-primary" />
                Consejos de Navegación a Lloret
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Ruta Recomendada</h3>
                  <p className="text-gray-700 mb-4">
                    Desde Puerto de Blanes, dirígete hacia el norte siguiendo la costa. 
                    Pasarás por Cala Sant Francesc y S'Abanell antes de llegar a Lloret. 
                    Mantente siempre a la vista de la costa.
                  </p>
                  
                  <h3 className="font-semibold text-lg mb-3">Mejores Horarios</h3>
                  <p className="text-gray-700">
                    Por la mañana (9:00-12:00) para evitar multitudes. 
                    Por la tarde (16:00-19:00) para disfrutar del ambiente más animado. 
                    Evita los fines de semana en temporada alta si buscas tranquilidad.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Dónde Fondear</h3>
                  <p className="text-gray-700 mb-4">
                    Playa de Lloret: zona habilitada para embarcaciones recreativas (señalizada).
                    Cala Boadella: fondeo libre pero respetando a los bañistas.
                    Santa Cristina: fondeo en la zona sur de la playa.
                  </p>
                  
                  <h3 className="font-semibold text-lg mb-3">Seguridad</h3>
                  <p className="text-gray-700">
                    Lloret puede tener más tráfico marítimo. Mantén distancia de seguridad 
                    con otras embarcaciones. Respeta las zonas de baño y las boyas de señalización.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="bg-primary text-white">
            <CardContent className="py-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                ¿Listo para tu Excursión a Lloret de Mar?
              </h2>
              <p className="text-lg mb-6 max-w-2xl mx-auto">
                Reserva tu barco desde Puerto de Blanes y descubre las mejores playas 
                de Lloret de Mar con total libertad y comodidad.
              </p>
              <Button 
                onClick={handleBookingWhatsApp}
                size="lg"
                variant="secondary"
                className="text-primary hover:text-primary"
                data-testid="button-whatsapp-lloret"
              >
                Reservar Excursión a Lloret
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