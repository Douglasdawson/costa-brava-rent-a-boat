import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Clock, 
  Camera, 
  Compass, 
  Waves,
  Heart,
  Star,
  ExternalLink
} from "lucide-react";
import { Link } from "wouter";
export default function DestinationsSection() {

  const destinations = [
    {
      id: "tossa",
      name: "Visita Tossa de Mar",
      url: "/alquiler-barcos-tossa-de-mar",
      description: "Villa medieval protegida por murallas. La joya histórica más bella de la Costa Brava.",
      duration: "1h navegando",
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
      description: "Embarcaciones hasta 15 CV que no requieren titulación náutica. Perfectos para principiantes y familias.",
      features: ["Hasta 15 CV", "4-7 personas", "Fácil manejo"],
      icon: Heart,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    }
  ];


  return (
    <section className="py-12 bg-white" id="destinations">
      <div className="container mx-auto px-4">
        
        {/* Destinations */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Destinos desde Blanes
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explora las ubicaciones más espectaculares de la Costa Brava desde nuestro puerto base en Blanes
            </p>
          </div>

          <div className="grid md:grid-cols-1 gap-8 max-w-md mx-auto">
            {destinations.map((destination) => {
              const IconComponent = destination.icon;
              return (
                <Link key={destination.id} href={destination.url} asChild>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader>
                      <div className={`w-16 h-16 ${destination.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                        <IconComponent className={`w-8 h-8 ${destination.color}`} />
                      </div>
                      <CardTitle className="text-xl text-center">{destination.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-4">
                        <Badge variant="outline" className="mb-3">
                          <Clock className="w-4 h-4 mr-2" />
                          {destination.duration}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {destination.description}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center mb-4">
                        {destination.highlights.map((highlight, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {highlight}
                          </span>
                        ))}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="group-hover:bg-primary group-hover:text-white transition-colors"
aria-label={`Ver detalles de ${destination.name}`}
                      >
                        Ver Detalles
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Categories */}
        <div>
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Tipos de Embarcación
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Elige el tipo de barco que mejor se adapte a tu experiencia y necesidades
            </p>
          </div>

          <div className="grid md:grid-cols-1 gap-8 max-w-md mx-auto">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Link key={category.id} href={category.url} asChild>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader>
                      <div className={`w-16 h-16 ${category.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                        <IconComponent className={`w-8 h-8 ${category.color}`} />
                      </div>
                      <CardTitle className="text-xl text-center">{category.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {category.description}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center mb-4">
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
aria-label={`Ver barcos de ${category.name}`}
                      >
                        Ver Barcos
                        <Waves className="w-4 h-4 ml-2" />
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