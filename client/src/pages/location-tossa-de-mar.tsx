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
  Shield,
  Castle,
  Crown,
  Heart
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { 
  getSEOConfig, 
  generateHreflangLinks, 
  generateCanonicalUrl,
  generateBreadcrumbSchema
} from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";

export default function LocationTossaPage() {
  const { language } = useLanguage();
  const seoConfig = getSEOConfig('locationTossa', language);
  const hreflangLinks = generateHreflangLinks('locationTossa');
  const canonical = generateCanonicalUrl('locationTossa', language);

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
      "url": "https://costa-brava-rent-a-boat-blanes.replit.app/"
    }
  };

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Tossa de Mar", url: "/alquiler-barcos-tossa-de-mar" }
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
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={combinedJsonLd}
      />
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-emerald-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <Castle className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-gray-900">
                Excursiones en Barco a Tossa de Mar
              </h1>
            </div>
            <p className="text-lg text-gray-600 mb-6 max-w-4xl mx-auto">
              Descubre el pueblo medieval más bonito de la Costa Brava navegando desde el Puerto de Blanes. 
              1 hora de navegación hasta la famosa Vila Vella de Tossa de Mar.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <Anchor className="w-4 h-4 mr-2" />
                Desde Puerto de Blanes
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Clock className="w-4 h-4 mr-2" />
                1 hora navegando
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
          
          {/* Why Visit Tossa de Mar by Boat */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Crown className="w-6 h-6 text-yellow-500" />
                ¿Por qué visitar Tossa de Mar en barco?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">La Joya de la Costa Brava</h3>
                  <p className="text-gray-700 mb-4">
                    Tossa de Mar es considerado uno de los pueblos más bonitos de España. 
                    Su famosa Vila Vella (ciudad vieja) fortificada del siglo XII es única 
                    en toda la Costa Brava y ofrece unas vistas espectaculares desde el mar.
                  </p>
                  
                  <h3 className="font-semibold text-lg mb-3">Patrimonio Histórico</h3>
                  <p className="text-gray-700">
                    Las murallas medievales que rodean la Vila Vella son Monumento Histórico-Artístico Nacional. 
                    Desde el mar tendrás la mejor perspectiva de esta fortaleza del siglo XIII 
                    que protegía la costa de piratas y invasores.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Calas Paradisíacas</h3>
                  <p className="text-gray-700 mb-4">
                    Tossa cuenta con algunas de las calas más vírgenes y cristalinas de la Costa Brava: 
                    Cala Pola, Cala Bona, Cala d'es Codolar. Muchas solo accesibles desde el mar, 
                    perfectas para fondear y disfrutar en privado.
                  </p>
                  
                  <h3 className="font-semibold text-lg mb-3">Navegación Panorámica</h3>
                  <p className="text-gray-700">
                    1 hora navegando por la costa te permitirá ver acantilados, calas secretas, 
                    y la silueta de Tossa creciendo en el horizonte hasta revelar toda su majestuosidad. 
                    Una experiencia inolvidable.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Beaches and Historic Sites */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Shield className="w-6 h-6 text-primary" />
                Principales Atractivos de Tossa de Mar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Castle className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Vila Vella</h3>
                  <p className="text-gray-600 text-sm mb-2">Siglo XII - Patrimonio Nacional</p>
                  <p className="text-gray-700">Ciudad medieval fortificada con murallas, torres y calles empedradas. Vista espectacular desde el mar.</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Waves className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Playa Grande</h3>
                  <p className="text-gray-600 text-sm mb-2">Playa principal</p>
                  <p className="text-gray-700">Amplia playa de arena dorada protegida por las murallas medievales. Perfecta para fondear cerca.</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sun className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Calas Vírgenes</h3>
                  <p className="text-gray-600 text-sm mb-2">Solo accesibles por mar</p>
                  <p className="text-gray-700">Cala Pola, Cala Bona, Es Codolar. Aguas cristalinas y tranquilidad absoluta.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What to Do in Tossa */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Heart className="w-6 h-6 text-primary" />
                Qué Hacer en Tossa de Mar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Cultura e Historia</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Castle className="w-4 h-4 text-green-600 mr-2" />
                      <span>Recorrer la Vila Vella medieval</span>
                    </li>
                    <li className="flex items-center">
                      <Shield className="w-4 h-4 text-green-600 mr-2" />
                      <span>Subir a las murallas y torres</span>
                    </li>
                    <li className="flex items-center">
                      <Camera className="w-4 h-4 text-green-600 mr-2" />
                      <span>Museo Municipal</span>
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 text-green-600 mr-2" />
                      <span>Faro de Tossa</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Naturaleza y Relax</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Waves className="w-4 h-4 text-green-600 mr-2" />
                      <span>Bucear en aguas cristalinas</span>
                    </li>
                    <li className="flex items-center">
                      <Sun className="w-4 h-4 text-green-600 mr-2" />
                      <span>Fondear en calas secretas</span>
                    </li>
                    <li className="flex items-center">
                      <NavigationIcon className="w-4 h-4 text-green-600 mr-2" />
                      <span>Caminos de ronda costeros</span>
                    </li>
                    <li className="flex items-center">
                      <Camera className="w-4 h-4 text-green-600 mr-2" />
                      <span>Atardeceres desde el mar</span>
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
                Consejos de Navegación a Tossa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Ruta Recomendada</h3>
                  <p className="text-gray-700 mb-4">
                    Desde Puerto de Blanes, navega hacia el norte pasando por Lloret de Mar. 
                    Continúa bordeando la costa hasta avistar las torres medievales de Tossa. 
                    La silueta de la Vila Vella es inconfundible desde lejos.
                  </p>
                  
                  <h3 className="font-semibold text-lg mb-3">Mejor Época</h3>
                  <p className="text-gray-700">
                    Mayo a octubre. Los meses de junio y septiembre ofrecen el mejor equilibrio: 
                    buen tiempo, mar en calma y menos aglomeraciones. Evita agosto si buscas tranquilidad.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Zonas de Fondeo</h3>
                  <p className="text-gray-700 mb-4">
                    Playa Grande: zona habilitada para embarcaciones recreativas.
                    Cala Pola: fondeo libre en aguas cristalinas.
                    Es Codolar: cala virgen ideal para pasar el día.
                    Mantén distancia de las zonas de baño señalizadas.
                  </p>
                  
                  <h3 className="font-semibold text-lg mb-3">Navegación Segura</h3>
                  <p className="text-gray-700">
                    1 hora de navegación requiere planificación. Consulta el tiempo, lleva suficiente combustible 
                    y agua. Respeta las velocidades en zonas costeras y mantén la costa siempre a la vista.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="bg-primary text-white">
            <CardContent className="py-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                ¿Listo para Descubrir Tossa de Mar?
              </h2>
              <p className="text-lg mb-6 max-w-2xl mx-auto">
                Reserva tu barco desde Puerto de Blanes y vive la experiencia única 
                de llegar por mar al pueblo medieval más bonito de la Costa Brava.
              </p>
              <Button 
                onClick={handleBookingWhatsApp}
                size="lg"
                variant="secondary"
                className="text-primary hover:text-primary"
                data-testid="button-whatsapp-tossa"
              >
                Reservar Excursión a Tossa
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      <Footer />
    </div>
  );
}