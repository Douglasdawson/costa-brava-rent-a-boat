import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
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
  ArrowLeftRight,
  Zap,
  Shield,
  CircleParking,
  Snowflake,
  Beer,
  Eye,
  Waves,
  MessageSquare
} from "lucide-react";
import { openWhatsApp } from "@/utils/whatsapp";
import { BOAT_DATA } from "@shared/boatData";
import { getBoatImage } from "@/utils/boatImages";
import Navigation from "./Navigation";
import Footer from "./Footer";
import { SEO } from "./SEO";

interface BoatDetailPageProps {
  boatId?: string;
  onBack?: () => void;
}

export default function BoatDetailPage({ boatId = "solar-450", onBack }: BoatDetailPageProps) {
  const [selectedSeason, setSelectedSeason] = useState<"BAJA" | "MEDIA" | "ALTA">("BAJA");
  const [, setLocation] = useLocation();
  
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
  const seoDescription = `Alquila el ${boatData.name} en Blanes, Costa Brava. ${requiresLicense ? "Con licencia" : "Sin licencia"}, para ${capacity} personas, desde ${lowestPrice}€. ${requiresLicense ? "Combustible no incluido" : "Gasolina incluida"}, Puerto de Blanes.`;
  const canonical = `https://costa-brava-rent-a-boat-blanes.replit.app/barco/${boatId}`;
  
  // Product JSON-LD schema
  const resolvedImage = getBoatImage(boatData.image);
  const absoluteImage = resolvedImage.startsWith('http') ? resolvedImage : 
    resolvedImage.startsWith('/') ? `${window.location.origin}${resolvedImage}` :
    `${window.location.origin}/${resolvedImage}`;
    
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
        ogImage={getBoatImage(boatData.image)}
        ogType="product"
        jsonLd={productSchema}
      />
      <Navigation />
      
      <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-6 sm:pb-8">
        {/* Back Button */}
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 text-gray-600 hover:text-gray-900 text-sm sm:text-base"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a la flota
          </Button>
        )}

        {/* Boat Title */}
        <div className="text-center mb-6 sm:mb-8 px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3">
            {boatData.name}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-2">{boatData.subtitle}</p>
          <Badge variant="outline" className="text-primary border-primary text-xs sm:text-sm">
            Alquiler en Blanes, Costa Brava
          </Badge>
        </div>

        {/* Image and Description Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Left Column - Image */}
          <div className="bg-white rounded-xl overflow-hidden shadow-lg">
            <img 
              src={getBoatImage(boatData.image)} 
              alt={`Alquiler ${boatData.name} ${boatData.subtitle.includes("Sin Licencia") ? "sin licencia" : "con licencia"} en Blanes Costa Brava`}
              className="w-full h-64 sm:h-80 md:h-96 object-cover"
              loading="lazy"
              data-testid="img-boat-main"
            />
          </div>

          {/* Right Column - Description */}
          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {boatData.description}
              </p>
              {!requiresLicense && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-green-800 font-medium">¡Gasolina incluida!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Key Features - Full Width */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-yellow-500" />
              Características Principales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {boatData.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Technical Specifications and Equipment - Full Width */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Technical Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base sm:text-lg">
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
                    <ArrowUpDown className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="font-medium">Eslora:</span>
                  </div>
                  <span>{boatData.specifications.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ArrowLeftRight className="w-4 h-4 mr-2 text-blue-600" />
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
              <CardTitle className="text-base sm:text-lg">Equipamiento Incluido</CardTitle>
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
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
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
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
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

            <div className="text-sm text-gray-600 text-center">
              <p className="mb-3"><strong>El precio incluye:</strong></p>
              <div className="flex flex-wrap justify-center items-center gap-4">
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
                    CircleParking,
                    Snowflake,
                    Beer,
                    Eye,
                    Waves,
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
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Información Importante</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 space-y-2">
              <p>• <strong>Imprescindible:</strong> Acudir con documento de identidad o pasaporte{requiresLicense ? " y licencia de navegacion original" : ""}</p>
              <p>• {requiresLicense ? "Licencia náutica requerida" : "Sin necesidad de licencia náutica"}</p>
              <p>• Ideal para familias y grupos de hasta {capacity} personas</p>
              <p>• Perfecto para explorar las calas de la Costa Brava</p>
              <p>• {requiresLicense ? "Combustible NO incluido, seguro y equipo de seguridad incluidos" : "Gasolina, seguro y equipo de seguridad incluidos"}</p>
              <p>• Fianza: {boatData.specifications.deposit}</p>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Condiciones:</strong> Revisa{" "}
                <button
                  onClick={() => {
                    const targetSection = requiresLicense ? "embarcaciones-con-licencia" : "embarcaciones-sin-licencia";
                    setLocation("/terms-conditions");
                    setTimeout(() => {
                      const element = document.getElementById(targetSection);
                      if (element) {
                        element.scrollIntoView({
                          behavior: "smooth",
                          block: "start"
                        });
                      }
                    }, 100);
                  }}
                  className="underline bg-transparent border-none p-0 text-blue-800 cursor-pointer hover:text-blue-600 transition-colors"
                  data-testid="link-terms-conditions"
                >
                  las condiciones generales del alquiler
                </button>{" "}
                antes de hacer tu reserva.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Location & Map Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Ubicación - Costa Brava Rent a Boat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-700">
                <p className="mb-2">
                  <strong>Costa Brava Rent a Boat - Blanes | Alquiler de Barcos Con y Sin Licencia</strong> se encuentra en el Puerto de Blanes, 
                  el punto de partida perfecto para explorar las calas más hermosas de la Costa Brava.
                </p>
                <p className="text-gray-600">
                  📍 <a 
                    href="https://maps.app.goo.gl/ma3qtsJbuFNhcr4bA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors cursor-pointer underline"
                    data-testid="link-location-maps"
                  >
                    Costa Brava Rent a Boat - Blanes, Puerto de Blanes, 17300 Blanes, Girona
                  </a>
                </p>
              </div>
              
              {/* Embedded Google Map */}
              <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden border">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d2980.1411982500704!2d2.7957177!3d41.6742939!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12bb172c94a8856f%3A0x9a2dfa936ef2e0a7!2sCosta%20Brava%20Rent%20a%20Boat%20-%20Blanes%20%7C%20Alquiler%20de%20Barcos%20Con%20y%20Sin%20Licencia!5e0!3m2!1ses!2ses!4v1758876869141!5m2!1ses!2ses"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación de Costa Brava Rent a Boat - Blanes | Alquiler de Barcos Con y Sin Licencia"
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