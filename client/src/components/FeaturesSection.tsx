import { Card, CardContent } from "@/components/ui/card";
import { 
  Shield, 
  Fuel, 
  Users, 
  Clock, 
  MapPin, 
  Headphones,
  Star,
  CheckCircle 
} from "lucide-react";
import snorkelImage from "@assets/generated_images/Family_snorkeling_activity_scene_b0ab1783.png";
import paddleImage from "@assets/generated_images/Paddle_surfing_couple_scene_cc635043.png";

export default function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: "Sin Licencia Requerida",
      description: "La mayoría de nuestros barcos no requieren licencia náutica. Perfecto para principiantes y familias.",
      color: "text-green-600"
    },
    {
      icon: Fuel,
      title: "Combustible Incluido", 
      description: "Barcos sin licencia incluyen gasolina. Barcos con licencia, combustible aparte. Todo claramente indicado.",
      color: "text-blue-600"
    },
    {
      icon: Users,
      title: "Hasta 7 Personas",
      description: "Flota variada desde embarcaciones para 5 personas hasta barcos de lujo para 7.",
      color: "text-purple-600"
    },
    {
      icon: Clock,
      title: "Horarios Flexibles",
      description: "Alquiler desde 1 hora hasta jornadas completas de 8 horas. Tú decides.",
      color: "text-orange-600"
    },
    {
      icon: MapPin,
      title: "Ubicación Privilegiada",
      description: "Salida directa desde el puerto de Blanes, dónde empieza la Costa Brava.",
      color: "text-red-600"
    },
    {
      icon: Headphones,
      title: "Atención Personalizada",
      description: "Asesoramiento completo y soporte durante toda tu experiencia en el mar.",
      color: "text-primary"
    }
  ];

  const extras = [
    {
      name: "Snorkel",
      image: snorkelImage,
      price: "15€",
      description: "Equipo completo de snorkel para descubrir la vida marina"
    },
    {
      name: "Paddle Surf",
      image: paddleImage,
      price: "25€",
      description: "Tabla de paddle surf para explorar calas y costas"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Main Features */}
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ¿Por qué Costa Brava Rent a Boat Blanes?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            La empresa con la mayor oferta de horas y mayor flexibilidad horaria contratables en la zona.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="hover-elevate border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Extras Section */}
        <div className="bg-gray-50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h3 className="font-heading text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Extras Disponibles
            </h3>
            <p className="text-gray-600">
              Completa tu experiencia con nuestros extras opcionales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {extras.map((extra, index) => (
              <Card key={index} className="overflow-hidden hover-elevate">
                <div className="md:flex">
                  <div className="md:w-1/2">
                    <img 
                      src={extra.image} 
                      alt={extra.name}
                      className="w-full h-48 md:h-full object-cover"
                    />
                  </div>
                  <div className="md:w-1/2 p-6 flex flex-col justify-center">
                    <h4 className="font-heading font-semibold text-xl text-gray-900 mb-2">
                      {extra.name}
                    </h4>
                    <p className="text-gray-600 mb-4">
                      {extra.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        {extra.price}
                      </span>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 text-center border-dashed border-2 border-gray-300 bg-white/50">
              <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🧊</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Nevera con Bebidas Frías</h4>
              <p className="text-gray-600 text-sm mb-2">Nevera con hielo y bebidas refrescantes</p>
              <span className="text-lg font-bold text-primary">10€</span>
            </Card>

            <Card className="p-6 text-center border-dashed border-2 border-gray-300 bg-white/50 opacity-50">
              <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl text-gray-400">🚤</span>
              </div>
              <h4 className="font-semibold text-gray-500 mb-2">Excursión Privada</h4>
              <p className="text-gray-500 text-sm mb-2">Con patrón incluido</p>
              <span className="text-lg font-bold text-gray-500">Desde 180€</span>
            </Card>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="font-medium">4.8/5 valoración media</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium">+500 clientes satisfechos</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Totalmente asegurado</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="font-medium">5 años de experiencia</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}