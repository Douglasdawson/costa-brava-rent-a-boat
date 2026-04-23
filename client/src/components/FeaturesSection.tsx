import {
  Shield,
  ShieldCheck,
  Award,
  Anchor,
  Compass,
  ChevronRight,
} from "lucide-react";
import SnorkelIcon from "./icons/SnorkelIcon";
import PaddleSurfIcon from "./icons/PaddleSurfIcon";
import NeveraIcon from "./icons/NeveraIcon";
import ParkingIcon from "./icons/ParkingIcon";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { minPriceAcrossBoats } from "@shared/pricing";

export default function FeaturesSection() {
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  const { ref: revealRef, isVisible } = useScrollReveal();

  // Live price for "Excursión Privada" — falls back to the i18n label only before boats load.
  const { data: boats } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const excursionPrice = minPriceAcrossBoats(
    (boats || []).filter((b) => b.isActive && b.id === "excursion-privada"),
    "2h",
    "BAJA",
  );
  const privateTourPrice = excursionPrice
    ? `${t.boats?.from ?? "Desde"} ${excursionPrice}€`
    : t.features.extras.privateTour.price;

  const extras = [
    { icon: SnorkelIcon, name: t.features.extras.snorkel.name, price: "7,50\u20AC" },
    { icon: PaddleSurfIcon, name: t.features.extras.paddle.name, price: "25\u20AC" },
    { icon: NeveraIcon, name: t.features.extras.cooler.name, price: "10\u20AC" },
    { icon: Compass, name: t.features.extras.privateTour.name, price: privateTourPrice },
    { icon: ParkingIcon, name: t.features.extras.parking.name, price: t.features.extras.parking.price || "10\u20AC/d\u00EDa" },
  ];

  return (
    <section ref={revealRef} className={`py-16 sm:py-24 lg:py-32 bg-background transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
        {/* Main Features */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground tracking-tight text-center">
            {t.features.whyUs}
          </h2>
          <p className="text-base text-muted-foreground font-light text-center mt-3 max-w-2xl mx-auto">
            {t.features.whyUsSub}
          </p>
        </div>

        {/* Authority Trust Strip */}
        <div className="bg-muted/50 rounded-lg py-5 px-4 mb-8 sm:mb-12 lg:mb-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Shield className="w-4 h-4 flex-shrink-0 text-foreground/60" />
              <span className="text-xs sm:text-sm font-medium">{t.authority?.fleetInsured || 'Flota asegurada al 100%'}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 text-foreground/60" />
              <span className="text-xs sm:text-sm font-medium">{t.authority?.zeroIncidents || '0 incidentes de seguridad'}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Award className="w-4 h-4 flex-shrink-0 text-foreground/60" />
              <span className="text-xs sm:text-sm font-medium">{t.authority?.certifiedCaptains || 'Capitanes certificados'}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Anchor className="w-4 h-4 flex-shrink-0 text-foreground/60" />
              <span className="text-xs sm:text-sm font-medium">{t.authority?.officialPort || 'Puerto oficial de Blanes'}</span>
            </div>
          </div>
        </div>

        {/* Extras Section */}
        <div className="border-t border-border pt-8 sm:pt-12">
          <div className="text-center mb-6 sm:mb-8">
            <h3 className="font-heading text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
              {t.features.extrasTitle}
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {extras.map((extra, index) => (
              <div key={index} className="flex flex-col items-center text-center bg-muted/40 rounded-xl p-4 sm:p-5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-3">
                  <extra.icon className="w-9 h-9 sm:w-11 sm:h-11 text-foreground/70" />
                </div>
                <span className="text-sm text-muted-foreground leading-tight">{extra.name}</span>
                <span className="font-heading font-medium text-foreground mt-1">{extra.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Internal Links - Explore More */}
        <div className="border-t border-border pt-8 sm:pt-12 mt-8 sm:mt-12">
          <h3 className="font-heading text-lg sm:text-xl font-semibold text-foreground tracking-tight text-center mb-6">
            {t.features.exploreMore || 'Explora nuestros servicios'}
          </h3>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
            <a href={localizedPath("categoryLicenseFree")} className="text-primary hover:underline flex items-center gap-1 text-sm sm:text-base">
              <ChevronRight className="w-4 h-4" />
              {t.features.exploreLinks?.licenseFree || 'Barcos sin licencia'}
            </a>
            <a href={localizedPath("categoryLicensed")} className="text-primary hover:underline flex items-center gap-1 text-sm sm:text-base">
              <ChevronRight className="w-4 h-4" />
              {t.features.exploreLinks?.licensed || 'Barcos con licencia'}
            </a>
            <a href={localizedPath("pricing")} className="text-primary hover:underline flex items-center gap-1 text-sm sm:text-base">
              <ChevronRight className="w-4 h-4" />
              {t.features.exploreLinks?.pricing || 'Precios y tarifas'}
            </a>
            <a href={localizedPath("locationCostaBrava")} className="text-primary hover:underline flex items-center gap-1 text-sm sm:text-base">
              <ChevronRight className="w-4 h-4" />
              {t.features.exploreLinks?.costaBrava || 'Alquiler barcos Costa Brava'}
            </a>
            <a href={localizedPath("blog")} className="text-primary hover:underline flex items-center gap-1 text-sm sm:text-base">
              <ChevronRight className="w-4 h-4" />
              {t.features.exploreLinks?.blog || 'Blog de navegación'}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
