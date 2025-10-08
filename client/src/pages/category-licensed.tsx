import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  Anchor, 
  Star,
  Gauge,
  Award,
  Heart,
  Zap,
  Navigation as NavigationIcon,
  Waves,
  Compass,
  Target,
  TrendingUp
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

export default function CategoryLicensedPage() {
  const { language } = useLanguage();
  const seoConfig = getSEOConfig('categoryLicensed', language);
  const hreflangLinks = generateHreflangLinks('categoryLicensed');
  const canonical = generateCanonicalUrl('categoryLicensed', language);

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage();
    openWhatsApp(message);
  };

  // Service schema for licensed boats
  const serviceSchema = {
    "@type": "Service",
    "name": "Alquiler de Barcos Con Licencia en Blanes",
    "description": "Alquiler de embarcaciones con licencia, potentes y avanzadas en Puerto de Blanes, Costa Brava. Requiere titulación náutica PER, PNB o superior.",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Costa Brava Rent a Boat Blanes",
      "telephone": "+34683172154",
      "url": "https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/",
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
      "name": "Costa Brava, Cataluña, Mediterráneo"
    },
    "offers": {
      "@type": "Offer",
      "description": "Alquiler barcos con licencia desde medio día hasta día completo",
      "priceCurrency": "EUR"
    }
  };

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Barcos con Licencia", url: "/barcos-con-licencia" }
  ]);

  // Combine schemas using @graph
  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      serviceSchema,
      breadcrumbSchema
    ]
  };

  // Licensed boats data
  const licensedBoats = [
    {
      name: "Astec 450",
      capacity: "6-7 personas",
      engine: "40 CV",
      features: ["GPS", "Sonda", "Radio VHF", "Bimini grande"],
      price: "Desde 220€",
      range: "Mayor autonomía"
    },
    {
      name: "Pacific Craft 625",
      capacity: "6-7 personas", 
      engine: "115 CV",
      features: ["Consola central", "GPS Garmin", "Ducha", "Nevera 40L"],
      price: "Desde 320€",
      range: "Navegación deportiva"
    },
    {
      name: "Trimarchi 57S",
      capacity: "6-7 personas",
      engine: "40 CV", 
      features: ["Solárium", "Mesa central", "Radio", "Toldo completo"],
      price: "Desde 240€",
      range: "Máximo confort"
    }
  ];

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
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <Award className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-gray-900">
                Barcos Con Licencia en Blanes
              </h1>
            </div>
            <p className="text-lg text-gray-600 mb-6 max-w-4xl mx-auto">
              Alquila embarcaciones potentes con licencia en Puerto de Blanes, Costa Brava. 
              Máxima libertad para navegación avanzada. Requiere titulación náutica PER, PNB o superior.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                <Award className="w-4 h-4 mr-2" />
                Requiere Licencia
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Gauge className="w-4 h-4 mr-2" />
                40-115 CV
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Users className="w-4 h-4 mr-2" />
                6-7 personas
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* What are Licensed Boats */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Award className="w-6 h-6 text-blue-500" />
                ¿Qué son los Barcos Con Licencia?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Navegación Avanzada</h3>
                  <p className="text-gray-700 mb-4">
                    Los barcos con licencia son embarcaciones de más de 15 CV de potencia 
                    que requieren titulación náutica oficial (PER, PNB o superior) para su manejo. 
                    Ofrecen mayor potencia, velocidad y capacidad de navegación.
                  </p>
                  
                  <h3 className="font-semibold text-lg mb-3">Mayor Libertad</h3>
                  <p className="text-gray-700">
                    Con estas embarcaciones puedes navegar sin limitación de distancia de la costa 
                    (según tu titulación), acceder a calas más lejanas y disfrutar de una 
                    experiencia de navegación más deportiva y emocionante.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Equipamiento Profesional</h3>
                  <p className="text-gray-700 mb-4">
                    Nuestros barcos con licencia incluyen equipamiento avanzado: GPS, 
                    sonda, radio VHF, mayor capacidad de combustible, 
                    mejores asientos y sistemas de navegación profesional.
                  </p>
                  
                  <h3 className="font-semibold text-lg mb-3">Rendimiento Superior</h3>
                  <p className="text-gray-700">
                    Mayor velocidad de crucero, mejor estabilidad en mar abierto, 
                    capacidad para transportar más personas cómodamente y 
                    autonomía para excursiones de día completo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Our Licensed Fleet */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Anchor className="w-6 h-6 text-primary" />
                Nuestra Flota Con Licencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {licensedBoats.map((boat, index) => (
                  <div key={index} className="bg-white rounded-lg p-6 shadow-sm border">
                    <h3 className="font-semibold text-xl mb-3">{boat.name}</h3>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{boat.capacity}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Gauge className="w-4 h-4 mr-2" />
                        <span>{boat.engine}</span>
                      </div>
                      <div className="flex items-center text-blue-600">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">{boat.range}</span>
                      </div>
                      <div className="space-y-1">
                        {boat.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center text-gray-600">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
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
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Heart className="w-6 h-6 text-primary" />
                Ventajas de los Barcos Con Licencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Rendimiento Superior</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Zap className="w-4 h-4 text-blue-600 mr-2" />
                      <span>Mayor velocidad y potencia</span>
                    </li>
                    <li className="flex items-center">
                      <Compass className="w-4 h-4 text-blue-600 mr-2" />
                      <span>Navegación sin límite de distancia</span>
                    </li>
                    <li className="flex items-center">
                      <Target className="w-4 h-4 text-blue-600 mr-2" />
                      <span>Acceso a calas más remotas</span>
                    </li>
                    <li className="flex items-center">
                      <Waves className="w-4 h-4 text-blue-600 mr-2" />
                      <span>Mejor comportamiento en mar abierto</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Experiencia Premium</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <NavigationIcon className="w-4 h-4 text-blue-600 mr-2" />
                      <span>Equipamiento de navegación avanzado</span>
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 text-blue-600 mr-2" />
                      <span>Mayor comodidad y espacio</span>
                    </li>
                    <li className="flex items-center">
                      <Clock className="w-4 h-4 text-blue-600 mr-2" />
                      <span>Mayor autonomía de combustible</span>
                    </li>
                    <li className="flex items-center">
                      <Award className="w-4 h-4 text-blue-600 mr-2" />
                      <span>Experiencia de navegación deportiva</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements and Documentation */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Award className="w-6 h-6 text-primary" />
                Requisitos y Titulaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Titulaciones Aceptadas</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span>PER (Patrón de Embarcaciones de Recreo)</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span>PNB (Patrón de Navegación Básica)</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span>Capitán de Yate</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span>ICC (Certificado Internacional)</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span>Licencias equivalentes UE</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Requisitos Adicionales</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span>Edad mínima: 18 años</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span>Documento de identidad válido</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span>Titulación náutica en vigor</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span>Fianza: 500€ (se devuelve)</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span>Briefing técnico incluido</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What You Can Do */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Compass className="w-6 h-6 text-primary" />
                Qué Puedes Hacer con Licencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Destinos Ampliados</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Target className="w-4 h-4 text-blue-600 mr-2" />
                      <span>Islas Medas (navegación avanzada)</span>
                    </li>
                    <li className="flex items-center">
                      <Target className="w-4 h-4 text-blue-600 mr-2" />
                      <span>Calas remotas de Begur</span>
                    </li>
                    <li className="flex items-center">
                      <Target className="w-4 h-4 text-blue-600 mr-2" />
                      <span>Cadaqués y Cap de Creus</span>
                    </li>
                    <li className="flex items-center">
                      <Target className="w-4 h-4 text-blue-600 mr-2" />
                      <span>Navegación nocturna (con PER)</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Actividades Especiales</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Waves className="w-4 h-4 text-blue-600 mr-2" />
                      <span>Pesca deportiva en mar abierto</span>
                    </li>
                    <li className="flex items-center">
                      <NavigationIcon className="w-4 h-4 text-blue-600 mr-2" />
                      <span>Excursiones de día completo</span>
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 text-blue-600 mr-2" />
                      <span>Navegación deportiva</span>
                    </li>
                    <li className="flex items-center">
                      <Compass className="w-4 h-4 text-blue-600 mr-2" />
                      <span>Travesías entre puertos</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="bg-primary text-white">
            <CardContent className="py-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                ¿Tienes Licencia y Buscas Aventura?
              </h2>
              <p className="text-lg mb-6 max-w-2xl mx-auto">
                Alquila un barco con licencia y experimenta la verdadera libertad de navegación. 
                Potencia, velocidad y acceso ilimitado a toda la Costa Brava.
              </p>
              <Button 
                onClick={handleBookingWhatsApp}
                size="lg"
                variant="secondary"
                className="text-primary hover:text-primary"
                data-testid="button-whatsapp-licensed"
              >
                Reservar Barco Con Licencia
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      <Footer />
    </div>
  );
}