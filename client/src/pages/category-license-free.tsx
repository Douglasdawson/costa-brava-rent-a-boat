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
  Shield,
  Heart,
  Zap,
  Navigation as NavigationIcon,
  Waves,
  Sun
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

export default function CategoryLicenseFreePage() {
  const { language } = useLanguage();
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
      "url": "https://costa-brava-rent-a-boat-blanes.replit.app/",
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
    { name: "Inicio", url: "/" },
    { name: "Barcos sin Licencia", url: "/barcos-sin-licencia" }
  ]);

  // Combine schemas using @graph
  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      serviceSchema,
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
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <Zap className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-gray-900">
                Barcos Sin Licencia en Blanes
              </h1>
            </div>
            <p className="text-lg text-gray-600 mb-6 max-w-4xl mx-auto">
              Alquila embarcaciones sin licencia en Puerto de Blanes, Costa Brava. 
              Barcos hasta 15 CV que no requieren titulación náutica. ¡Navegación segura y fácil para todos!
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                Sin Licencia Necesaria
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Gauge className="w-4 h-4 mr-2" />
                Hasta 15 CV
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
          
          {/* What are License-Free Boats */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Shield className="w-6 h-6 text-green-500" />
                ¿Qué son los Barcos Sin Licencia?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Navegación Libre</h3>
                  <p className="text-gray-700 mb-4">
                    Los barcos sin licencia son embarcaciones de hasta 15 CV (11 kW) de potencia 
                    que pueden ser navegados sin necesidad de titulación náutica oficial. 
                    Son perfectos para quienes quieren disfrutar del mar sin complicaciones.
                  </p>
                  
                  <h3 className="font-semibold text-lg mb-3">Fácil de Manejar</h3>
                  <p className="text-gray-700">
                    Estas embarcaciones están diseñadas para ser intuitivas y seguras. 
                    Con controles simples y estabilidad garantizada, cualquier persona 
                    puede aprender a manejarlas en pocos minutos.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Limitaciones Seguras</h3>
                  <p className="text-gray-700 mb-4">
                    Por ley, solo pueden navegar hasta 2 millas náuticas de la costa 
                    y en aguas protegidas. Esto garantiza que siempre estarás en zona segura 
                    y con posibilidad de volver a puerto fácilmente.
                  </p>
                  
                  <h3 className="font-semibold text-lg mb-3">Equipamiento Completo</h3>
                  <p className="text-gray-700">
                    Todos nuestros barcos incluyen equipo de seguridad reglamentario, 
                    chalecos salvavidas, extintor, y extras como nevera, toldo solar, 
                    equipo de snorkel y radio.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Our License-Free Fleet */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Anchor className="w-6 h-6 text-primary" />
                Nuestra Flota Sin Licencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {licenseFreeBoats.map((boat, index) => (
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
                Ventajas de los Barcos Sin Licencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Accesibilidad Total</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Star className="w-4 h-4 text-green-600 mr-2" />
                      <span>No necesitas licencia ni titulación</span>
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 text-green-600 mr-2" />
                      <span>Aprendizaje rápido (15 minutos)</span>
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 text-green-600 mr-2" />
                      <span>Menor coste de alquiler</span>
                    </li>
                    <li className="flex items-center">
                      <Star className="w-4 h-4 text-green-600 mr-2" />
                      <span>Perfecto para principiantes</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Diversión Garantizada</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Waves className="w-4 h-4 text-green-600 mr-2" />
                      <span>Acceso a calas y playas desde el mar</span>
                    </li>
                    <li className="flex items-center">
                      <Sun className="w-4 h-4 text-green-600 mr-2" />
                      <span>Ideal para familias con niños</span>
                    </li>
                    <li className="flex items-center">
                      <NavigationIcon className="w-4 h-4 text-green-600 mr-2" />
                      <span>Navegación en zona segura costera</span>
                    </li>
                    <li className="flex items-center">
                      <Clock className="w-4 h-4 text-green-600 mr-2" />
                      <span>Disponibilidad inmediata</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety and Requirements */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Shield className="w-6 h-6 text-primary" />
                Seguridad y Requisitos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Requisitos Mínimos</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span>Edad mínima: 18 años (conductor)</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span>Documento de identidad válido</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span>Fianza: 300€ (se devuelve)</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span>Briefing de seguridad (15 min)</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Seguridad Incluida</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Shield className="w-4 h-4 text-green-600 mr-2" />
                      <span>Chalecos salvavidas para todos</span>
                    </li>
                    <li className="flex items-center">
                      <Shield className="w-4 h-4 text-green-600 mr-2" />
                      <span>Extintor y equipo de emergencia</span>
                    </li>
                    <li className="flex items-center">
                      <Shield className="w-4 h-4 text-green-600 mr-2" />
                      <span>Radio VHF para comunicación</span>
                    </li>
                    <li className="flex items-center">
                      <Shield className="w-4 h-4 text-green-600 mr-2" />
                      <span>Seguro de responsabilidad civil</span>
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
                ¿Listo para tu Primera Aventura Sin Licencia?
              </h2>
              <p className="text-lg mb-6 max-w-2xl mx-auto">
                Alquila un barco sin licencia y descubre la libertad de navegar 
                por la Costa Brava sin complicaciones. ¡Ideal para principiantes y familias!
              </p>
              <Button 
                onClick={handleBookingWhatsApp}
                size="lg"
                variant="secondary"
                className="text-primary hover:text-primary"
                data-testid="button-whatsapp-license-free"
              >
                Reservar Barco Sin Licencia
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      <Footer />
    </div>
  );
}