import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Ruler, Ship, ChevronRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import RouteMap from "@/components/RouteMap";
import { boatRoutes } from "@shared/routesData";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { getSEOConfig, generateCanonicalUrl } from "@/utils/seo-config";

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-800",
  moderate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
};

const difficultyLabels: Record<string, Record<string, string>> = {
  easy: { es: "Facil", ca: "Facil", en: "Easy", fr: "Facile", de: "Einfach", nl: "Makkelijk", it: "Facile", ru: "Легкий" },
  moderate: { es: "Moderada", ca: "Moderada", en: "Moderate", fr: "Modere", de: "Mittel", nl: "Gemiddeld", it: "Moderato", ru: "Средний" },
  advanced: { es: "Avanzada", ca: "Avancada", en: "Advanced", fr: "Avance", de: "Fortgeschritten", nl: "Gevorderd", it: "Avanzato", ru: "Продвинутый" },
};

export default function RoutesPage() {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const { language } = useLanguage();
  const t = useTranslations();

  const seoConfig = getSEOConfig("routes", language) || {
    title: "Rutas Sugeridas en Barco | Costa Brava Rent a Boat",
    description: "Descubre las mejores rutas en barco desde Blanes. Desde Sa Palomera hasta Tossa de Mar.",
  };
  const canonical = generateCanonicalUrl("routes", language);

  const handleRouteSelect = (id: string) => {
    setSelectedRouteId(selectedRouteId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO title={seoConfig.title} description={seoConfig.description} canonical={canonical} />
      <Navigation />

      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {t.routes?.title || "Rutas Sugeridas"}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t.routes?.subtitle || "Descubre las mejores rutas en barco desde el Puerto de Blanes"}
          </p>
        </div>

        {/* Map */}
        <div className="mb-8">
          <RouteMap
            routes={boatRoutes}
            selectedRouteId={selectedRouteId}
            onRouteSelect={handleRouteSelect}
          />
        </div>

        {/* Route Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boatRoutes.map((route) => {
            const desc = route.descriptions[language] || route.descriptions.es;
            const isSelected = route.id === selectedRouteId;

            return (
              <Card
                key={route.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? "ring-2 ring-primary shadow-lg" : ""
                }`}
                onClick={() => handleRouteSelect(route.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg" style={{ color: route.color }}>
                      {desc.name}
                    </h3>
                    <Badge className={difficultyColors[route.difficulty]}>
                      {difficultyLabels[route.difficulty]?.[language] || difficultyLabels[route.difficulty]?.es}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{desc.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Ruler className="w-4 h-4" />
                      {route.distance}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {route.estimatedTime}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {desc.highlights.map((highlight, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        {highlight}
                      </Badge>
                    ))}
                  </div>

                  {isSelected && (
                    <Button
                      className="w-full mt-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = "/#fleet";
                      }}
                    >
                      <Ship className="w-4 h-4 mr-2" />
                      {t.routes?.bookBoat || "Reservar barco"}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}
