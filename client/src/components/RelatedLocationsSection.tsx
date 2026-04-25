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
  Star,
  Anchor,
  Car
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/hooks/use-language";

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
  group: "boat" | "car";
}

interface RelatedLocationsSectionProps {
  currentLocation: string;
}

export default function RelatedLocationsSection({ currentLocation }: RelatedLocationsSectionProps) {
  const { localizedPath } = useLanguage();

  const allLocations: RelatedLocation[] = [
    {
      id: "costaBrava",
      name: "Alquiler Barcos Costa Brava",
      url: localizedPath("locationCostaBrava"),
      description: "Descubre toda la costa en barco. Rutas, calas y destinos desde el Puerto de Blanes en el corazon de la Costa Brava.",
      duration: "Region completa",
      highlights: ["Calas virginales", "Rutas guiadas", "8 barcos"],
      icon: Compass,
      color: "text-primary",
      bgColor: "bg-primary/5",
      group: "boat"
    },
    {
      id: "blanes",
      name: "Alquiler Barcos Blanes",
      url: localizedPath("locationBlanes"),
      description: "Puerto base de operaciones con todas las comodidades. Punto de partida perfecto para explorar toda la Costa Brava.",
      duration: "Base principal",
      highlights: ["Puerto seguro", "Parking gratuito", "Restaurantes"],
      icon: MapPin,
      color: "text-primary",
      bgColor: "bg-primary/5",
      group: "boat"
    },
    {
      id: "lloret",
      name: "Excursión a Lloret de Mar",
      url: localizedPath("locationLloret"),
      description: "Playas vibrantes y calas escondidas. Desde Blanes llegas en 25 minutos navegando por la costa.",
      duration: "25 min desde Blanes",
      highlights: ["Playas famosas", "Calas vírgenes", "Vida nocturna"],
      icon: Camera,
      color: "text-primary",
      bgColor: "bg-primary/5",
      group: "boat"
    },
    {
      id: "tossa",
      name: "Visita Tossa de Mar",
      url: localizedPath("locationTossa"),
      description: "Villa medieval protegida por murallas. La joya histórica más bella de la Costa Brava.",
      duration: "1h desde Blanes",
      highlights: ["Vila Vella", "Historia medieval", "Aguas cristalinas"],
      icon: Compass,
      color: "text-primary",
      bgColor: "bg-primary/5",
      group: "boat"
    },
    {
      id: "malgrat",
      name: "Barcos cerca de Malgrat de Mar",
      url: localizedPath("locationMalgrat"),
      description: "A solo 10 minutos en coche del Puerto de Blanes. El punto de alquiler náutico más cercano para turistas en Malgrat.",
      duration: "10 min en coche",
      highlights: ["Playa familiar", "Resort", "Cerca de Blanes"],
      icon: Car,
      color: "text-primary",
      bgColor: "bg-primary/5",
      group: "car"
    },
    {
      id: "santaSusanna",
      name: "Barcos cerca de Santa Susanna",
      url: localizedPath("locationSantaSusanna"),
      description: "Zona resort a 15 minutos del Puerto de Blanes. Combina tu estancia con una aventura náutica en la Costa Brava.",
      duration: "15 min en coche",
      highlights: ["Tranquilidad", "Resort", "Termas"],
      icon: Car,
      color: "text-primary",
      bgColor: "bg-primary/5",
      group: "car"
    },
    {
      id: "calella",
      name: "Barcos cerca de Calella",
      url: localizedPath("locationCalella"),
      description: "Desde Calella al Puerto de Blanes en 20 minutos. Playa Gran, casco antiguo y barcos esperándote.",
      duration: "20 min en coche",
      highlights: ["Playa Gran", "Casco antiguo", "Comercios"],
      icon: Car,
      color: "text-primary",
      bgColor: "bg-primary/5",
      group: "car"
    },
    {
      id: "pineda",
      name: "Barcos cerca de Pineda de Mar",
      url: localizedPath("locationPinedaDeMar"),
      description: "Desde Pineda de Mar al Puerto de Blanes en 18 minutos. Zona hotelera con acceso directo por tren o coche.",
      duration: "18 min en coche",
      highlights: ["Zona hotelera", "Tren RENFE R1", "Familias"],
      icon: Car,
      color: "text-primary",
      bgColor: "bg-primary/5",
      group: "car"
    },
    {
      id: "palafolls",
      name: "Barcos cerca de Palafolls",
      url: localizedPath("locationPalafolls"),
      description: "Desde los campings de Palafolls al Puerto de Blanes en 12 minutos. La excursion perfecta desde tu camping.",
      duration: "12 min en coche",
      highlights: ["Campings", "Muy cerca", "Naturaleza"],
      icon: Car,
      color: "text-primary",
      bgColor: "bg-primary/5",
      group: "car"
    },
    {
      id: "tordera",
      name: "Barcos cerca de Tordera",
      url: localizedPath("locationTordera"),
      description: "Desde Tordera al Puerto de Blanes en 15 minutos. Puerta de entrada a la Costa Brava con parking facil.",
      duration: "15 min en coche",
      highlights: ["Tren 8 min", "Parking facil", "Interior"],
      icon: Car,
      color: "text-primary",
      bgColor: "bg-primary/5",
      group: "car"
    }
  ];

  const categories = [
    {
      id: "license-free",
      name: "Barcos Sin Licencia",
      url: localizedPath("categoryLicenseFree"),
      description: "Embarcaciones hasta 15 CV perfectas para principiantes y familias.",
      features: ["Hasta 15 CV", "4-7 personas", "Fácil manejo"],
      icon: Waves,
      color: "text-primary",
      bgColor: "bg-primary/5"
    },
    {
      id: "licensed",
      name: "Barcos Con Licencia",
      url: localizedPath("categoryLicensed"),
      description: "Embarcaciones potentes para navegación avanzada con titulación.",
      features: ["40-115 CV", "Mayor velocidad", "Sin límite distancia"],
      icon: Star,
      color: "text-primary",
      bgColor: "bg-primary/5"
    }
  ];

  const locationMap: { [key: string]: string } = {
    'costa-brava': 'costaBrava',
    'blanes': 'blanes',
    'lloret': 'lloret',
    'tossa': 'tossa',
    'malgrat': 'malgrat',
    'santaSusanna': 'santaSusanna',
    'calella': 'calella',
    'pineda': 'pineda',
    'palafolls': 'palafolls',
    'tordera': 'tordera'
  };

  // Filter out current location
  const filteredLocations = allLocations.filter(location =>
    locationMap[currentLocation] !== location.id
  );

  const boatDestinations = filteredLocations.filter(l => l.group === "boat");
  const carDestinations = filteredLocations.filter(l => l.group === "car");

  const renderLocationCard = (location: RelatedLocation) => {
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
            <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
              {location.description}
            </p>
            <div className="flex flex-wrap gap-1 justify-center mb-3">
              {location.highlights.map((highlight, idx) => (
                <span key={idx} className="text-xs bg-muted text-foreground px-2 py-1 rounded">
                  {highlight}
                </span>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="[@media(hover:hover)]:group-hover:bg-primary [@media(hover:hover)]:group-hover:text-white transition-colors"
              data-testid={`link-related-${location.id}`}
            >
              Ver Detalles
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <section className="py-12 bg-muted">
      <div className="container mx-auto px-4">

        {/* Boat Destinations (North) */}
        {boatDestinations.length > 0 && (
          <div className="mb-12">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Anchor className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">
                  Destinos por Barco
                </h2>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Navega desde el Puerto de Blanes hacia el norte de la Costa Brava
              </p>
            </div>
            <div className={`grid ${boatDestinations.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' : boatDestinations.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : 'md:grid-cols-3'} gap-6`}>
              {boatDestinations.map(renderLocationCard)}
            </div>
          </div>
        )}

        {/* Nearby Towns (South) */}
        {carDestinations.length > 0 && (
          <div className="mb-12">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Car className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">
                  Pueblos Cercanos
                </h2>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Alojado en la costa del Maresme? Blanes está a pocos minutos
              </p>
            </div>
            <div className={`grid ${carDestinations.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' : carDestinations.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : 'md:grid-cols-3'} gap-6`}>
              {carDestinations.map(renderLocationCard)}
            </div>
          </div>
        )}

        {/* Categories */}
        <div>
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-4">
              Tipos de Embarcación
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
                      <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
                        {category.description}
                      </p>
                      <div className="flex flex-wrap gap-1 justify-center mb-3">
                        {category.features.map((feature, idx) => (
                          <span key={idx} className="text-xs bg-muted text-foreground px-2 py-1 rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="[@media(hover:hover)]:group-hover:bg-primary [@media(hover:hover)]:group-hover:text-white transition-colors"
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
