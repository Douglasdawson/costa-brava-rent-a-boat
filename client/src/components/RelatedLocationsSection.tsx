import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, ExternalLink, Waves, Star, Anchor, Car, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";

interface RelatedLocationsSectionProps {
  currentLocation: string;
}

type RouteKey =
  | "locationCostaBrava"
  | "locationBlanes"
  | "locationLloret"
  | "locationTossa"
  | "locationMalgrat"
  | "locationSantaSusanna"
  | "locationCalella"
  | "locationPinedaDeMar"
  | "locationPalafolls"
  | "locationTordera";

const BOAT_DESTINATIONS: { id: string; route: RouteKey }[] = [
  { id: "costaBrava", route: "locationCostaBrava" },
  { id: "blanes", route: "locationBlanes" },
  { id: "lloret", route: "locationLloret" },
  { id: "tossa", route: "locationTossa" },
];

const CAR_TOWNS: { id: string; route: RouteKey }[] = [
  { id: "malgrat", route: "locationMalgrat" },
  { id: "santaSusanna", route: "locationSantaSusanna" },
  { id: "calella", route: "locationCalella" },
  { id: "pineda", route: "locationPinedaDeMar" },
  { id: "palafolls", route: "locationPalafolls" },
  { id: "tordera", route: "locationTordera" },
];

const LOCATION_ALIASES: { [key: string]: string } = {
  "costa-brava": "costaBrava",
  blanes: "blanes",
  lloret: "lloret",
  tossa: "tossa",
  malgrat: "malgrat",
  santaSusanna: "santaSusanna",
  calella: "calella",
  pineda: "pineda",
  palafolls: "palafolls",
  tordera: "tordera",
};

/**
 * Cross-links between location pages. Layout decision (impeccable sweep
 * P1.17): only the sailing destinations render as cards; the six car-access
 * towns collapse into a compact link list so the section stops being three
 * consecutive grids of identical icon cards (~6 mobile screens). All copy
 * lives in t.relatedLocations (was hardcoded Spanish before).
 */
export default function RelatedLocationsSection({ currentLocation }: RelatedLocationsSectionProps) {
  const { localizedPath } = useLanguage();
  const t = useTranslations();
  const rl = t.relatedLocations;
  if (!rl) return null;

  const current = LOCATION_ALIASES[currentLocation];
  const boatDestinations = BOAT_DESTINATIONS.filter(l => l.id !== current);
  const carTowns = CAR_TOWNS.filter(l => l.id !== current);

  return (
    <section className="py-12 bg-muted">
      <div className="container mx-auto px-4">
        {/* Sailing destinations: real content, card treatment */}
        {boatDestinations.length > 0 && (
          <div className="mb-12">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Anchor className="w-6 h-6 text-primary" aria-hidden="true" />
                <h2 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">
                  {rl.boatTitle}
                </h2>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{rl.boatIntro}</p>
            </div>
            <div
              className={`grid gap-6 ${
                boatDestinations.length <= 2
                  ? "md:grid-cols-2 max-w-3xl mx-auto"
                  : "md:grid-cols-3"
              }`}
            >
              {boatDestinations.map(location => {
                const info = rl.locations[location.id];
                if (!info) return null;
                return (
                  <Link key={location.id} href={localizedPath(location.route)} asChild>
                    <div className="bg-background border border-border rounded-2xl p-6 cursor-pointer group">
                      <Badge variant="outline" className="mb-3">
                        <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
                        {info.duration}
                      </Badge>
                      <h3 className="font-heading font-semibold text-lg mb-2">{info.name}</h3>
                      <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                        {info.description}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="[@media(hover:hover)]:group-hover:bg-primary [@media(hover:hover)]:group-hover:text-primary-foreground transition-colors"
                        data-testid={`link-related-${location.id}`}
                      >
                        {rl.viewDetails}
                        <ExternalLink className="w-3 h-3 ml-1" aria-hidden="true" />
                      </Button>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Car-access towns: compact link list, not another card grid */}
        {carTowns.length > 0 && (
          <div className="mb-12 max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Car className="w-5 h-5 text-primary" aria-hidden="true" />
                <h2 className="font-heading text-xl lg:text-2xl font-bold text-foreground">
                  {rl.carTitle}
                </h2>
              </div>
              <p className="text-muted-foreground">{rl.carIntro}</p>
            </div>
            <ul className="bg-background border border-border rounded-2xl divide-y divide-border overflow-hidden">
              {carTowns.map(town => {
                const info = rl.locations[town.id];
                if (!info) return null;
                return (
                  <li key={town.id}>
                    <Link
                      href={localizedPath(town.route)}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 min-h-11 hover:bg-muted/60 transition-colors"
                      data-testid={`link-related-${town.id}`}
                    >
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        <MapPin className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                        {info.name}
                      </span>
                      <span className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                        {info.duration}
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Boat categories */}
        <div>
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-3">
              {rl.categoriesTitle}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {rl.categoriesIntro}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {(
              [
                { id: "licenseFree", route: "categoryLicenseFree", Icon: Waves },
                { id: "licensed", route: "categoryLicensed", Icon: Star },
              ] as const
            ).map(({ id, route, Icon }) => {
              const info = rl.categories[id];
              if (!info) return null;
              return (
                <Link key={id} href={localizedPath(route)} asChild>
                  <div className="bg-background border border-border rounded-2xl p-6 cursor-pointer group text-center">
                    <Icon className="w-6 h-6 text-primary mx-auto mb-3" aria-hidden="true" />
                    <h3 className="font-heading font-semibold text-lg mb-2">{info.name}</h3>
                    <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
                      {info.description}
                    </p>
                    <div className="flex flex-wrap gap-1 justify-center mb-4">
                      {info.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-muted text-foreground px-2 py-1 rounded"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="[@media(hover:hover)]:group-hover:bg-primary [@media(hover:hover)]:group-hover:text-primary-foreground transition-colors"
                      data-testid={`link-related-category-${id}`}
                    >
                      {rl.viewBoats}
                      <Waves className="w-3 h-3 ml-1" aria-hidden="true" />
                    </Button>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
