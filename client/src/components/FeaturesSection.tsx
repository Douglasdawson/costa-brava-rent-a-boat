import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  Fuel,
  Users,
  Clock,
  MapPin,
  Headphones,
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
      title: t.features.capacity.title,
      description: t.features.capacity.description,
      color: "text-purple-600"
    },
    {
      icon: Clock,
      title: t.features.flexibleHours.title,
      description: t.features.flexibleHours.description,
      color: "text-orange-600"
    },
    {
      icon: MapPin,
      title: t.features.location.title,
      description: t.features.location.description,
      color: "text-red-600"
    },
    {
      icon: Headphones,
      title: t.features.personalAttention.title,
      description: t.features.personalAttention.description,
      color: "text-primary"
    }
  ];

  const extras = [
    {
      name: t.features.extras.snorkel.name,
      image: snorkelImage,
      alt: "Equipo de snorkel incluido en alquiler de barcos en Blanes Costa Brava",
      price: "7,50€",
      description: t.features.extras.snorkel.description
    },
    {
      name: t.features.extras.paddle.name,
      image: paddleImage,
      alt: "Paddle surf disponible como extra en alquiler barcos Blanes Costa Brava",
      price: "25€",
      description: t.features.extras.paddle.description
    },
    {
      name: t.features.extras.cooler.name,
      image: coolerImage,
      alt: "Nevera con bebidas frías para excursión en barco Costa Brava Blanes",
      price: "10€",
      description: t.features.extras.cooler.description
    },
    {
      name: t.features.extras.privateTour.name,
      image: privateTourImage,
      alt: "Excursión privada con patrón en barco por Costa Brava desde Blanes",
      price: t.features.extras.privateTour.price,
      description: t.features.extras.privateTour.description
    },
    {
      name: t.features.extras.parking.name,
      image: parkingImage,
      alt: "Parking disponible cerca del puerto de Blanes para clientes",
      price: "10€/día",
      description: t.features.extras.parking.description
    }
  ];

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-white">
      <div className="container mx-auto px-3 sm:px-4">
        {/* Main Features */}
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <h2 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4">
            {t.features.whyUs}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-xl sm:max-w-2xl mx-auto px-2">
            {t.features.whyUsSub}
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
              {t.features.extrasTitle}
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              {t.features.extrasSub}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-8">
            {extras.map((extra, index) => (
              <Card key={index} className="overflow-hidden hover-elevate">
                <div className="flex flex-col">
                  <div className="w-full aspect-square">
                    <img
                      src={extra.image}
                      alt={extra.alt}
                      className="w-full h-full object-cover"
                      loading="lazy"
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
