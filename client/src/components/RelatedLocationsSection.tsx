import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Clock, 
  Camera, 
  Compass, 
  ExternalLink,
  Waves,
  Star
} from "lucide-react";
import { Link } from "wouter";

interface RelatedLocation {
  id: string;
  name: string;
  url: string;
  description: string;
  duration: string;
  highlights: string[];
  icon: any;
  color: string;
  bgColor: string;
}

interface RelatedLocationsSectionProps {
  currentLocation: string;
}

export default function RelatedLocationsSection({ currentLocation }: RelatedLocationsSectionProps) {

  const allLocations: RelatedLocation[] = [
    {
      id: "blanes",
      name: "Alquiler Barcos Blanes",
      url: "/alquiler-barcos-blanes", 
      description: "Puerto base de operaciones con todas las comodidades. Punto de partida perfecto para explorar toda la Costa Brava.",
      duration: "Base principal",
      highlights: ["Puerto seguro", "Parking gratuito", "Restaurantes"],
      icon: MapPin,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      id: "lloret",
      name: "Excursión a Lloret de Mar",
      url: "/alquiler-barcos-lloret-de-mar",
      description: "Playas vibrantes y calas escondidas. Desde Blanes llegas en 25 minutos navegando por la costa.",
      duration: "25 min desde Blanes",
      highlights: ["Playas famosas", "Calas vírgenes", "Vida nocturna"],
      icon: Camera,
      color: "text-green-600", 
      bgColor: "bg-green-50"
    },
    {
      id: "tossa",
      name: "Visita Tossa de Mar",
      url: "/alquiler-barcos-tossa-de-mar",
      description: "Villa medieval protegida por murallas. La joya histórica más bella de la Costa Brava.",
      duration: "1h desde Blanes",
      highlights: ["Vila Vella", "Historia medieval", "Aguas cristalinas"],
      icon: Compass,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  const categories = [
    {
      id: "license-free",
      name: "Barcos Sin Licencia",
      url: "/barcos-sin-licencia",
      description: "Embarcaciones hasta 15 CV perfectas para principiantes y familias.",
      features: ["Hasta 15 CV", "4-7 personas", "Fácil manejo"],
      icon: Waves,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    {
      id: "licensed",
      name: "Barcos Con Licencia", 
      url: "/barcos-con-licencia",
      description: "Embarcaciones potentes para navegación avanzada con titulación.",
      features: ["40-115 CV", "Mayor velocidad", "Sin límite distancia"],
      icon: Star,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    }
  ];

  // Filter out current location from related locations
  const relatedLocations = allLocations.filter(location => {
    const locationMap: { [key: string]: string } = {
      'blanes': 'blanes',
      'lloret': 'lloret',
      'tossa': 'tossa'
    };
    return locationMap[currentLocation] !== location.id;
  });


  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        
        {/* Related Locations */}
        {relatedLocations.length > 0 && (
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="font-heading text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                Otros Destinos Costa Brava
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Descubre más ubicaciones espectaculares de la Costa Brava
              </p>
            </div>

            <div className={`grid ${relatedLocations.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' : 'md:grid-cols-2'} gap-6`}>
              {relatedLocations.map((location) => {
                const IconComponent = location.icon;
                return (
                  <Link key={location.id} href={location.url} asChild>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                      <CardHeader>
                        <div className={`w-12 h-12 ${location.bgColor} rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                          <IconComponent className={`w-6 h-6 ${location.color}`} />
                        </div>
                        <CardTitle className="text-lg text-center">{location.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <div className="mb-3">
                          <Badge variant="outline" className="mb-2">
                            <Clock className="w-3 h-3 mr-1" />
                            {location.duration}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                          {location.description}
                        </p>
                        <div className="flex flex-wrap gap-1 justify-center mb-3">
                          {location.highlights.map((highlight, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {highlight}
                            </span>
                          ))}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="group-hover:bg-primary group-hover:text-white transition-colors"
                          data-testid={`link-related-${location.id}`}
                        >
                          Ver Detalles
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Categories */}
        <div>
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              Tipos de Embarcación
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Encuentra el barco perfecto según tu experiencia
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Link key={category.id} href={category.url} asChild>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader>
                      <div className={`w-12 h-12 ${category.bgColor} rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                        <IconComponent className={`w-6 h-6 ${category.color}`} />
                      </div>
                      <CardTitle className="text-lg text-center">{category.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                        {category.description}
                      </p>
                      <div className="flex flex-wrap gap-1 justify-center mb-3">
                        {category.features.map((feature, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="group-hover:bg-primary group-hover:text-white transition-colors"
                        data-testid={`link-related-category-${category.id}`}
                      >
                        Ver Barcos
                        <Waves className="w-3 h-3 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}