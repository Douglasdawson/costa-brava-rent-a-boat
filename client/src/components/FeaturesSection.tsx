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
import { useTranslations } from "@/lib/translations";
import snorkelImage from "../assets/generated_images/Family_snorkeling_activity_scene_b0ab1783.webp";
import paddleImage from "../assets/generated_images/Paddle_surfing_couple_scene_cc635043.webp";
import coolerImage from "@assets/stock_images/cooler_with_ice_and__e74f58f1.jpg";
import privateTourImage from "@assets/stock_images/private_boat_tour_wi_507c646c.jpg";
import parkingImage from "@assets/stock_images/empty_parking_space__d7110dae.jpg";

export default function FeaturesSection() {
  const t = useTranslations();
  const features = [
    {
      icon: Shield,
      title: t.features.withoutLicense.title,
      description: t.features.withoutLicense.description,
      color: "text-green-600"
    },
    {
      icon: Fuel,
      title: t.features.includes.title, 
      description: t.features.includes.description,
      color: "text-blue-600"
    },
    {
      icon: Users,
      title: "Hasta 7 " + t.boats.people,
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
      price: "7,50€",
      description: "Equipo completo de snorkel para descubrir la vida marina"
    },
    {
      name: "Paddle Surf",
      image: paddleImage,
      price: "25€",
      description: "Tabla de paddle surf para explorar calas y costas"
    },
    {
      name: "Nevera con Bebidas",
      image: coolerImage,
      price: "10€",
      description: "Nevera con hielo y bebidas refrescantes para tu día en el mar"
    },
    {
      name: "Excursión Privada",
      image: privateTourImage,
      price: "Desde 180€",
      description: "Tour privado con patrón incluido para una experiencia exclusiva"
    },
    {
      name: "Parking",
      image: parkingImage,
      price: "10€/día",
      description: "Plaza de parking cerca del puerto para mayor comodidad"
    }
  ];

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-white">
      <div className="container mx-auto px-3 sm:px-4">
        {/* Main Features */}
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <h2 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4">
            ¿Por qué Costa Brava Rent a Boat Blanes?
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-xl sm:max-w-2xl mx-auto px-2">
            La empresa con la mayor oferta de horas y mayor flexibilidad horaria contratables en la zona.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12 lg:mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="hover-elevate border-0 shadow-sm">
              <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto mb-2 sm:mb-3 lg:mb-4 bg-gray-50 rounded-full flex items-center justify-center`}>
                  <feature.icon className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 ${feature.color}`} />
                </div>
                <h3 className="font-heading font-semibold text-base sm:text-lg text-gray-900 mb-1 sm:mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Extras Section */}
        <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
          <div className="text-center mb-4 sm:mb-6 lg:mb-8">
            <h3 className="font-heading text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4">
              Extras Disponibles
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              Completa tu experiencia con nuestros extras opcionales.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-8">
            {extras.map((extra, index) => (
              <Card key={index} className="overflow-hidden hover-elevate">
                <div className="flex flex-col">
                  <div className="w-full aspect-square">
                    <img 
                      src={extra.image} 
                      alt={extra.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 sm:p-4 md:p-6 flex flex-col justify-center">
                    <h4 className="font-heading font-semibold text-sm sm:text-base md:text-xl text-gray-900 mb-1 sm:mb-2">
                      {extra.name}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 md:mb-4">
                      {extra.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-base sm:text-xl md:text-2xl font-bold text-primary">
                        {extra.price}
                      </span>
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}