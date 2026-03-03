import {
  Shield,
  Fuel,
  MapPin,
} from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function FeaturesSection() {
  const t = useTranslations();
  const { ref: revealRef, isVisible } = useScrollReveal();
  const features = [
    {
      icon: Shield,
      title: t.features.withoutLicense.title,
      description: t.features.withoutLicense.description,
    },
    {
      icon: Fuel,
      title: t.features.includes.title,
      description: t.features.includes.description,
    },
    {
      icon: MapPin,
      title: t.features.location.title,
      description: t.features.location.description,
    },
  ];

  const extras = [
    { name: t.features.extras.snorkel.name, price: "7,50\u20AC" },
    { name: t.features.extras.paddle.name, price: "25\u20AC" },
    { name: t.features.extras.cooler.name, price: "10\u20AC" },
    { name: t.features.extras.privateTour.name, price: t.features.extras.privateTour.price },
    { name: t.features.extras.parking.name, price: "10\u20AC/d\u00EDa" },
  ];

  return (
    <section ref={revealRef} className={`py-16 sm:py-24 lg:py-32 bg-white transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="container mx-auto px-3 sm:px-4">
        {/* Main Features */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-light text-foreground tracking-tight text-center">
            {t.features.whyUs}
          </h2>
          <p className="text-base text-muted-foreground font-light text-center mt-3 max-w-2xl mx-auto">
            {t.features.whyUsSub}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12 lg:mb-16">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-8">
              <feature.icon className="w-8 h-8 text-muted-foreground stroke-[1.5] mx-auto" />
              <h3 className="font-medium text-foreground text-lg mt-4">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm mt-2">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Extras Section */}
        <div className="border-t border-border pt-8 sm:pt-12">
          <div className="text-center mb-6 sm:mb-8">
            <h3 className="font-heading text-xl sm:text-2xl font-light text-foreground tracking-tight">
              {t.features.extrasTitle}
            </h3>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            {extras.map((extra, index) => (
              <span key={index} className="inline-flex items-center gap-1.5">
                {extra.name} <span className="font-medium text-foreground">{extra.price}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
