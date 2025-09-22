import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Users, 
  Anchor, 
  Fuel, 
  Euro,
  Calendar,
  CheckCircle,
  Star,
  Navigation as NavigationIcon,
  Ruler,
  ArrowUpDown,
  Zap,
  Shield,
  Car,
  Refrigerator,
  Coffee,
  Eye,
  Activity,
  MessageSquare
} from "lucide-react";
import { openWhatsApp } from "@/utils/whatsapp";
import { BOAT_DATA } from "@shared/boatData";
import Navigation from "./Navigation";
import Footer from "./Footer";
import { SEO } from "./SEO";

interface BoatDetailPageProps {
  boatId?: string;
  onBack?: () => void;
}

export default function BoatDetailPage({ boatId = "solar-450", onBack }: BoatDetailPageProps) {
  const [selectedSeason, setSelectedSeason] = useState<"BAJA" | "MEDIA" | "ALTA">("BAJA");
  
  // Get boat data dynamically based on boatId
  const boatData = BOAT_DATA[boatId];
  
  if (!boatData) {
    return <div>Barco no encontrado</div>;
  }

  const handleReservation = () => {
    console.log(`Navigate to booking for ${boatData.name}`);
    const lowestPrice = Math.min(...Object.values(boatData.pricing.BAJA.prices));
    const message = `Hola! Me gustaría hacer una reserva del ${boatData.name} (desde ${lowestPrice}€, sin licencia requerida). He visto los precios por temporada en vuestra web. ¿Podrían confirmarme disponibilidad? ¡Muchas gracias!`;
    openWhatsApp(message);
  };

  const handleWhatsApp = () => {
    const message = `Hola, me interesa el ${boatData.name}. ¿Podrían darme más información?`;
    openWhatsApp(message);
  };

  // SEO data for this boat
  const lowestPrice = Math.min(...Object.values(boatData.pricing.BAJA.prices));
  const requiresLicense = boatData.subtitle.includes("Con Licencia");
  const capacity = parseInt(boatData.specifications.capacity.split(' ')[0]);
  
  const seoTitle = `Alquiler ${boatData.name} en Blanes - ${requiresLicense ? "con" : "sin"} licencia | Costa Brava Rent a Boat`;
  const seoDescription = `Alquila el ${boatData.name} en Blanes, Costa Brava. ${requiresLicense ? "Con licencia" : "Sin licencia"}, para ${capacity} personas, desde ${lowestPrice}€. Gasolina incluida, Puerto de Blanes.`;
  const canonical = `https://costa-brava-rent-a-boat-blanes.replit.app/barco/${boatId}`;
  
  // Product JSON-LD schema
  const absoluteImage = boatData.image.startsWith('http') ? boatData.image : 
    boatData.image.startsWith('/') ? `${window.location.origin}${boatData.image}` :
    `${window.location.origin}/${boatData.image}`;
    
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": boatData.name,
    "description": boatData.description,
    "image": absoluteImage,
    "brand": {
      "@type": "Organization",
      "name": "Costa Brava Rent a Boat Blanes"
    },
    "sku": boatId,
    "category": "Boat Rental",
    "offers": {
      "@type": "Offer",
      "price": lowestPrice.toString(),
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock",
      "url": canonical,
      "priceValidUntil": "2025-12-31",
      "seller": {
        "@type": "Organization",
        "name": "Costa Brava Rent a Boat Blanes"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "127"
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title={seoTitle}
        description={seoDescription}
        canonical={canonical}
        ogImage={boatData.image}
        ogType="product"
        jsonLd={productSchema}
      />
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 text-gray-600 hover:text-gray-900"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a la flota
          </Button>
        )}

        {/* Boat Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Alquiler {boatData.name} en Blanes - {boatData.subtitle.includes("Sin Licencia") ? "sin" : "con"} licencia | Costa Brava Rent a Boat
          </h1>
          <p className="text-lg text-gray-600">{boatData.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Image */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl overflow-hidden shadow-lg">
              <img 
                src={boatData.image} 
                alt={`Alquiler ${boatData.name} ${boatData.subtitle.includes("Sin Licencia") ? "sin licencia" : "con licencia"} en Blanes Costa Brava`}
                className="w-full h-96 object-cover"
                loading="lazy"
                data-testid="img-boat-main"
              />
            </div>

            {/* Key Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  Características Principales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {boatData.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {boatData.description}
                </p>
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-green-800 font-medium">¡Gasolina incluida!</p>
                </div>
              </CardContent>
            </Card>

            {/* Technical Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <NavigationIcon className="w-5 h-5 mr-2" />
                  Especificaciones Técnicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Anchor className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="font-medium">Modelo:</span>
                    </div>
                    <span>{boatData.specifications.model}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Ruler className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="font-medium">Eslora:</span>
                    </div>
                    <span>{boatData.specifications.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ArrowUpDown className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="font-medium">Manga:</span>
                    </div>
                    <span>{boatData.specifications.beam}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Zap className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="font-medium">Motor:</span>
                    </div>
                    <span>{boatData.specifications.engine}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Fuel className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="font-medium">Combustible:</span>
                    </div>
                    <span>{boatData.specifications.fuel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="font-medium">Capacidad:</span>
                    </div>
                    <span>{boatData.specifications.capacity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="font-medium">Fianza:</span>
                    </div>
                    <span>{boatData.specifications.deposit}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipment */}
            <Card>
              <CardHeader>
                <CardTitle>Equipamiento Incluido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {boatData.equipment.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pricing Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Euro className="w-5 h-5 mr-2 text-green-600" />
              Precios por Temporada
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Season Selector */}
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.keys(boatData.pricing).map((season) => (
                <Button
                  key={season}
                  variant={selectedSeason === season ? "default" : "outline"}
                  onClick={() => setSelectedSeason(season as "BAJA" | "MEDIA" | "ALTA")}
                  className="text-sm"
                  data-testid={`button-season-${season.toLowerCase()}`}
                >
                  {season}
                </Button>
              ))}
            </div>

            {/* Selected Season Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-2">Temporada {selectedSeason}</h4>
              <p className="text-sm text-gray-600 mb-4">{boatData.pricing[selectedSeason].period}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(boatData.pricing[selectedSeason].prices).map(([duration, price]) => (
                  <div key={duration} className="text-center p-3 bg-white rounded-lg border">
                    <div className="font-bold text-lg text-primary">{price}€</div>
                    <div className="text-sm text-gray-600">{duration}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p><strong>El precio incluye:</strong></p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {boatData.included.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                    <span className="text-xs">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Extras Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Extras Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {boatData.extras.map((extra, index) => {
                const getIcon = (iconName: string) => {
                  const iconMap: { [key: string]: any } = {
                    Car,
                    Refrigerator,
                    Coffee,
                    Eye,
                    Activity,
                    Zap
                  };
                  return iconMap[iconName] || Star;
                };
                
                const IconComponent = getIcon(extra.icon);
                
                return (
                  <div key={index} className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex justify-center mb-2">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <div className="font-medium text-sm">{extra.name}</div>
                    <div className="text-primary font-bold">{extra.price}</div>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Puedes añadir cualquiera de estos extras al completar tu reserva online o directamente en el puerto antes de zarpar.
            </p>
          </CardContent>
        </Card>

        {/* Booking Actions */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold text-gray-900">¿Listo para tu aventura?</h3>
              <p className="text-gray-600">Reserva ahora tu {boatData.name} y disfruta de las calas de la Costa Brava</p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={handleReservation}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3"
                  data-testid="button-make-reservation"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Reservar Ahora
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleWhatsApp}
                  data-testid="button-whatsapp-info"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Más información por WhatsApp
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información Importante</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 space-y-2">
              <p>• Sin necesidad de licencia náutica</p>
              <p>• Ideal para familias y grupos de hasta 5 personas</p>
              <p>• Perfecto para explorar las calas de la Costa Brava</p>
              <p>• Gasolina, seguro y equipo de seguridad incluidos</p>
              <p>• Fianza: {boatData.specifications.deposit}</p>
              <p>• <strong>Imprescindible:</strong> Acudir con documento de identidad o pasaporte</p>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Condiciones:</strong> Revisa{" "}
                <a href="#" className="underline">las condiciones generales del alquiler</a>{" "}
                antes de hacer tu reserva.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Location & Map Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Ubicación - Puerto de Blanes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-700">
                <p className="mb-2">
                  <strong>Costa Brava Rent a Boat</strong> se encuentra en el Puerto de Blanes, 
                  el punto de partida perfecto para explorar las calas más hermosas de la Costa Brava.
                </p>
                <p className="text-gray-600">
                  📍 Puerto de Blanes, 17300 Blanes, Girona
                </p>
              </div>
              
              {/* Embedded Google Map */}
              <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden border">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2973.8553686!2d2.7833!3d41.6667!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12a2b8c5c5c5c5c5%3A0x1234567890!2sPuerto%20de%20Blanes!5e0!3m2!1ses!2ses!4v1640995200000!5m2!1ses!2ses&q=Puerto+de+Blanes,+Costa+Brava+Rent+a+Boat"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación de Costa Brava Rent a Boat en Puerto de Blanes"
                  data-testid="map-location"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Cómo llegar:</h4>
                  <ul className="space-y-1">
                    <li>• Desde Barcelona: AP-7 hacia Girona, salida Blanes</li>
                    <li>• Desde Girona: N-II dirección Blanes</li>
                    <li>• Parking disponible en el puerto</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Servicios cercanos:</h4>
                  <ul className="space-y-1">
                    <li>• Restaurantes y chiringuitos</li>
                    <li>• Tiendas náuticas</li>
                    <li>• Estación de servicio marina</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}