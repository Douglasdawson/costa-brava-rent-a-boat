import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import BookingFormWidget from "./BookingFormWidget";
import { useQuery } from "@tanstack/react-query";
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
  MessageSquare,
  Heart,
  Sun,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { openWhatsApp } from "@/utils/whatsapp";
import { getBoatImage } from "@/utils/boatImages";
import Navigation from "./Navigation";
import Footer from "./Footer";
import { SEO } from "./SEO";
import { useLanguage } from "@/hooks/use-language";
import { 
  getSEOConfig, 
  generateHreflangLinks, 
  generateCanonicalUrl,
  generateEnhancedProductSchema,
  generateBreadcrumbSchema
} from "@/utils/seo-config";
import type { Boat } from "@shared/schema";
import { Breadcrumbs } from "./Breadcrumbs";
import { useTranslations } from "@/lib/translations";
import AvailabilityCalendar from "./AvailabilityCalendar";

interface BoatDetailPageProps {
  boatId?: string;
  onBack?: () => void;
}

export default function BoatDetailPage({ boatId = "solar-450", onBack }: BoatDetailPageProps) {
  const [selectedSeason, setSelectedSeason] = useState<"BAJA" | "MEDIA" | "ALTA">("BAJA");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [, setLocation] = useLocation();
  
  // Reset image index when boat changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [boatId]);
  
  // Fetch boat data from API
  const { data: boats, isLoading, error } = useQuery<Boat[]>({
    queryKey: ['/api/boats']
  });

  const boatData = boats?.find(boat => boat.id === boatId);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Cargando...</div>
        </div>
      </div>
    );
  }

  if (error || !boatData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Barco no encontrado</div>
        </div>
      </div>
    );
  }

  const handleReservation = () => {
    setIsBookingModalOpen(true);
  };

  const handleWhatsApp = () => {
    const message = `Hola, me interesa el ${boatData.name}. ¿Podrían darme más información?`;
    openWhatsApp(message);
  };

  // Image gallery handling
  const displayImages = boatData.imageGallery && boatData.imageGallery.length > 0 
    ? boatData.imageGallery 
    : [boatData.imageUrl || ''];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  // SEO data for this boat
  const { language } = useLanguage();
  const t = useTranslations();
  const lowestPrice = boatData.pricing ? Math.min(...Object.values(boatData.pricing.BAJA.prices)) : 0;
  const requiresLicense = boatData.subtitle?.includes("Con Licencia") ?? boatData.requiresLicense;
  const capacity = boatData.specifications ? parseInt(boatData.specifications.capacity?.split(' ')[0] || String(boatData.capacity)) : boatData.capacity;
  
  const dynamicSEOData = {
    boatName: boatData.name,
    capacity: capacity.toString(),
    license: requiresLicense ? "con licencia" : "sin licencia",
    pricePerHour: lowestPrice.toString()
  };
  
  const seoConfig = getSEOConfig('boatDetail', language, dynamicSEOData);
  const hreflangLinks = generateHreflangLinks('boatDetail', boatId);
  const canonical = generateCanonicalUrl('boatDetail', language, boatId);
  
  // Enhanced Product JSON-LD schema with breadcrumbs
  const resolvedImage = getBoatImage(boatData.imageUrl || '');
  const absoluteImage = resolvedImage.startsWith('http') ? resolvedImage : 
    resolvedImage.startsWith('/') ? `${window.location.origin}${resolvedImage}` :
    `${window.location.origin}/${resolvedImage}`;

  // Adapt boat data for enhanced schema
  const adaptedBoatData = {
    id: boatId,
    name: boatData.name,
    description: boatData.description,
    image: absoluteImage,
    brand: "Costa Brava Rent a Boat",
    power: parseInt(boatData.specifications?.engine?.match(/\d+/)?.[0] || "15"),
    capacity: capacity,
    pricePerHour: lowestPrice,
    year: new Date().getFullYear() - 2 // Assuming boats are ~2 years old
  };

  const baseProductSchema = generateEnhancedProductSchema(adaptedBoatData, language);
  
  // Add image and aggregate rating to enhanced schema
  const enhancedProductSchema = {
    ...baseProductSchema,
    image: absoluteImage,
    aggregateRating: {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "127"
    }
  };

  // Generate breadcrumb schema with localized names
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.boats, url: "/#flota" },
    { name: boatData.name, url: `/barco/${boatId}` }
  ]);

  // Combine schemas using @graph
  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      enhancedProductSchema,
      breadcrumbSchema
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title={seoConfig.title}
        description={seoConfig.description}
        canonical={canonical}
        hreflang={hreflangLinks}
        ogImage={getBoatImage(boatData.imageUrl || '')}
        ogType="product"
        jsonLd={combinedJsonLd}
      />
      <Navigation />
      
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumbs 
            items={[
              { label: t.breadcrumbs.boats, href: '/#flota' },
              { label: boatData.name }
            ]}
          />
        </div>
      </div>
      
      <div className="container mx-auto px-4 pt-6 sm:pt-8 pb-6 sm:pb-8">
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
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-1">
            {boatData.name}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-2">{boatData.subtitle}</p>
        </div>

        {/* Image and Description Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Left Column - Image Gallery Carousel */}
          <div className="bg-white rounded-xl overflow-hidden shadow-lg">
            <div className="relative group">
              <img 
                src={getBoatImage(displayImages[currentImageIndex])} 
                alt={`Alquiler barco ${boatData.name} ${boatData.subtitle?.includes("Sin Licencia") ? "sin licencia" : "con licencia"} en Blanes Costa Brava 2026 - Imagen ${currentImageIndex + 1}`}
                className="w-full h-64 sm:h-80 md:h-96 object-cover"
                loading="lazy"
                data-testid="img-boat-main"
              />
              
              {/* Navigation arrows - only show if more than one image */}
              {displayImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    data-testid="button-prev-image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    data-testid="button-next-image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}
              
              {/* Image counter */}
              {displayImages.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {displayImages.length}
                </div>
              )}
            </div>
            
            {/* Thumbnail dots - only show if more than one image */}
            {displayImages.length > 1 && (
              <div className="flex justify-center gap-2 p-4 bg-gray-50">
                {displayImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex 
                        ? 'bg-primary w-8' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    data-testid={`button-thumbnail-${index}`}
                  />
                ))}
              </div>
            )}
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
                  <p className="text-green-800 font-medium flex items-center gap-2">
                    <Fuel className="w-5 h-5" />
                    ¡Gasolina incluida!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Booking Actions - CTA */}
        <Card className="mb-6 sm:mb-8">
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
                  Solicita tu petición de reserva
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center md:justify-center">
              <Euro className="w-5 h-5 mr-2 text-green-600" />
              Precios por Temporada
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Season Selector */}
            {boatData.pricing && (
              <>
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
                  
                  <div className="flex flex-wrap justify-center gap-4">
                    {Object.entries(boatData.pricing[selectedSeason].prices).map(([duration, price]) => (
                      <div key={duration} className="text-center p-3 bg-white rounded-lg border min-w-[120px] hover:bg-blue-50 transition-colors cursor-pointer">
                        <div className="font-bold text-lg text-primary">{price}€</div>
                        <div className="text-sm text-gray-600">{duration}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {boatData.included && boatData.included.length > 0 && (
              <div className="text-sm text-gray-600 text-left md:text-center">
                <p className="mb-3"><strong>El precio incluye:</strong></p>
                <div className="flex flex-wrap justify-start md:justify-center items-center gap-4">
                  {boatData.included.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                      <span className="text-xs">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Availability Calendar */}
        <div className="mb-6 sm:mb-8">
          <AvailabilityCalendar boatId={boatId} />
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
              {boatData.features?.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-sm">{feature}</span>
                </div>
              )) || <span className="text-sm text-gray-500">No hay características disponibles</span>}
            </div>
          </CardContent>
        </Card>

        {/* Technical Specifications, Equipment and Advantages */}
        <div className={`grid grid-cols-1 ${!requiresLicense ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6 sm:gap-8 mb-6 sm:mb-8`}>
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
                {boatData.specifications?.model && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Anchor className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="font-medium">Modelo:</span>
                    </div>
                    <span>{boatData.specifications.model}</span>
                  </div>
                )}
                {boatData.specifications?.length && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <ArrowUpDown className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="font-medium">Eslora:</span>
                    </div>
                    <span>{boatData.specifications.length}</span>
                  </div>
                )}
                {boatData.specifications?.beam && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <ArrowLeftRight className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="font-medium">Manga:</span>
                    </div>
                    <span>{boatData.specifications.beam}</span>
                  </div>
                )}
                {boatData.specifications?.engine && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Zap className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="font-medium">Motor:</span>
                    </div>
                    <span>{boatData.specifications.engine}</span>
                  </div>
                )}
                {boatData.specifications?.fuel && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Fuel className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="font-medium">Combustible:</span>
                    </div>
                    <span>{boatData.specifications.fuel}</span>
                  </div>
                )}
                {boatData.specifications?.capacity && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="font-medium">Capacidad:</span>
                    </div>
                    <span>{boatData.specifications.capacity}</span>
                  </div>
                )}
                {boatData.specifications?.deposit && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="font-medium">Fianza:</span>
                    </div>
                    <span>{boatData.specifications.deposit}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Equipment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Equipamiento Incluido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {boatData.equipment?.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span>{item}</span>
                  </div>
                )) || <span className="text-sm text-gray-500">No hay equipamiento disponible</span>}
              </div>
            </CardContent>
          </Card>

          {/* License-Free Advantages - Only for boats without license */}
          {!requiresLicense && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Heart className="w-5 h-5 mr-2 text-primary" />
                  Ventajas de los Barcos Sin Licencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Accesibilidad Total</h4>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-green-600 mr-2" />
                        <span className="text-sm">No necesitas licencia ni titulación</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-green-600 mr-2" />
                        <span className="text-sm">Aprendizaje rápido (15 minutos)</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-green-600 mr-2" />
                        <span className="text-sm">Menor coste de alquiler</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-green-600 mr-2" />
                        <span className="text-sm">Perfecto para principiantes</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Diversión Garantizada</h4>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Waves className="w-3 h-3 text-green-600 mr-2" />
                        <span className="text-sm">Acceso a calas y playas desde el mar</span>
                      </div>
                      <div className="flex items-center">
                        <Sun className="w-3 h-3 text-green-600 mr-2" />
                        <span className="text-sm">Ideal para familias con niños</span>
                      </div>
                      <div className="flex items-center">
                        <NavigationIcon className="w-3 h-3 text-green-600 mr-2" />
                        <span className="text-sm">Navegación en zona segura costera</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 text-green-600 mr-2" />
                        <span className="text-sm">Disponibilidad inmediata</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Extras Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="md:text-center">Extras Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {boatData.extras?.map((extra, index) => {
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
                  <div key={index} className="text-left md:text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex justify-start md:justify-center mb-2">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <div className="font-medium text-sm">{extra.name}</div>
                    <div className="text-primary font-bold">{extra.price}</div>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-gray-600 mt-4 text-left md:text-center">
              Puedes añadir cualquiera de estos extras al completar tu reserva online o directamente en el puerto antes de zarpar.
            </p>
          </CardContent>
        </Card>

        {/* Important Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Información Importante</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 space-y-2">
              <p>• <strong>Imprescindible:</strong> Acudir con documento de identidad o pasaporte en vigor{requiresLicense ? " y licencia de navegacion original" : ""}</p>
              <p>• {requiresLicense ? "Licencia náutica requerida" : "Sin necesidad de licencia náutica"}</p>
              <p>• Ideal para familias y grupos de hasta {capacity} personas</p>
              <p>• Perfecto para explorar las calas de la Costa Brava</p>
              <p>• {requiresLicense ? "Combustible NO incluido, seguro y equipo de seguridad incluidos" : "Gasolina, seguro y equipo de seguridad incluidos"}</p>
              {boatData.specifications?.deposit && <p>• Fianza: {boatData.specifications.deposit}</p>}
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
                        const elementPosition = element.offsetTop;
                        const offsetPosition = elementPosition - 100; // Subir 100px más
                        
                        window.scrollTo({
                          top: offsetPosition,
                          behavior: "smooth"
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

      </div>

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="
          !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2
          w-[95vw] sm:w-[90vw] md:w-full max-w-4xl 
          max-h-[85vh]
          overflow-y-auto 
          p-3 sm:p-4 md:p-6
          gap-0
        ">
          <BookingFormWidget 
            preSelectedBoatId={boatId}
            onClose={() => setIsBookingModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}