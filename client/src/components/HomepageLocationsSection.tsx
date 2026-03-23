import { MapPin, Compass, Car, Anchor } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";

interface LocationItem {
  routeKey: string;
  icon: typeof MapPin;
  group: "base" | "boat" | "car";
}

const locations: LocationItem[] = [
  { routeKey: "locationBlanes", icon: MapPin, group: "base" },
  { routeKey: "locationCostaBrava", icon: Anchor, group: "boat" },
  { routeKey: "locationLloret", icon: Compass, group: "boat" },
  { routeKey: "locationTossa", icon: Compass, group: "boat" },
  { routeKey: "locationMalgrat", icon: Car, group: "car" },
  { routeKey: "locationSantaSusanna", icon: Car, group: "car" },
  { routeKey: "locationCalella", icon: Car, group: "car" },
  { routeKey: "locationPinedaDeMar", icon: Car, group: "car" },
  { routeKey: "locationPalafolls", icon: Car, group: "car" },
  { routeKey: "locationTordera", icon: Car, group: "car" },
  { routeKey: "locationBarcelona", icon: Car, group: "car" },
];

export default function HomepageLocationsSection() {
  const { localizedPath } = useLanguage();
  const t = useTranslations();
  const hl = t.homepageLocations;

  const base = locations.filter((l) => l.group === "base");
  const boat = locations.filter((l) => l.group === "boat");
  const car = locations.filter((l) => l.group === "car");

  const locationText: Record<string, { name: string; desc: string }> = {
    locationBlanes: { name: hl.blanes, desc: hl.blanesDesc },
    locationCostaBrava: { name: hl.costaBrava, desc: hl.costaBravaDesc },
    locationLloret: { name: hl.lloret, desc: hl.lloretDesc },
    locationTossa: { name: hl.tossa, desc: hl.tossaDesc },
    locationMalgrat: { name: hl.malgrat, desc: hl.malgratDesc },
    locationSantaSusanna: { name: hl.santaSusanna, desc: hl.santaSusannaDesc },
    locationCalella: { name: hl.calella, desc: hl.calellaDesc },
    locationPinedaDeMar: { name: hl.pineda, desc: hl.pinedaDesc },
    locationPalafolls: { name: hl.palafolls, desc: hl.palafollsDesc },
    locationTordera: { name: hl.tordera, desc: hl.torderaDesc },
    locationBarcelona: { name: hl.barcelona, desc: hl.barcelonaDesc },
  };

  const renderLink = (loc: LocationItem) => {
    const Icon = loc.icon;
    const text = locationText[loc.routeKey];
    return (
      <Link
        key={loc.routeKey}
        href={localizedPath(loc.routeKey)}
        className="group flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card hover:border-primary/30 hover:shadow-sm transition-all"
      >
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <span className="font-heading font-semibold text-sm text-foreground group-hover:text-primary transition-colors block">
            {text.name}
          </span>
          <span className="text-xs text-muted-foreground leading-snug block mt-0.5">
            {text.desc}
          </span>
        </div>
      </Link>
    );
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-3">
            {hl.sectionTitle}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {hl.sectionSubtitle}
          </p>
        </div>

        {/* Base - Blanes */}
        <div className="mb-8">
          <div className="max-w-lg mx-auto">
            {base.map(renderLink)}
          </div>
        </div>

        {/* Boat destinations */}
        <div className="mb-8">
          <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center justify-center gap-2">
            <Anchor className="w-4 h-4 text-primary" />
            {hl.sailTo}
          </h3>
          <div className="grid sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
            {boat.map(renderLink)}
          </div>
        </div>

        {/* Nearby towns */}
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center justify-center gap-2">
            <Car className="w-4 h-4 text-primary" />
            {hl.nearbyTowns}
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {car.map(renderLink)}
          </div>
        </div>
      </div>
    </section>
  );
}
