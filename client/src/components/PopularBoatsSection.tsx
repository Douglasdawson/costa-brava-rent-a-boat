import { Badge } from "@/components/ui/badge";
import { Ship } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { BOAT_DATA } from "@shared/boatData";

interface PopularBoatsSectionProps {
  /** Section title (already localized by caller). */
  title: string;
  /** Optional intro paragraph (already localized). */
  description?: string;
  /** Boat IDs to render, in display order. Unknown IDs are silently skipped. */
  boatIds: string[];
  /** Resolves the badge label for each boat (e.g. "Sin licencia" / "Con LNB"). */
  badgeLabel?: (boatId: string) => string;
  /** Optional custom badge variant resolver. Defaults to outline. */
  badgeVariant?: (boatId: string) => "default" | "secondary" | "outline";
  /** Optional CTA suffix used on each card. Defaults to "Ver barco →". */
  ctaLabel?: string;
  /** Section background class. Defaults to "bg-muted". */
  bgClass?: string;
}

/**
 * Reusable section listing popular/relevant boats with internal links to their
 * detail pages. Exists primarily as an SEO crosslinking helper: each card uses
 * the boat name as anchor text on a link to /barco/{id}, so location landings
 * pass signal to boat detail pages without duplicating layout code.
 */
function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform,filter] duration-700 ${
        isVisible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-6 blur-[2px]"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function PopularBoatsSection({
  title,
  description,
  boatIds,
  badgeLabel,
  badgeVariant,
  ctaLabel = "Ver barco →",
  bgClass = "bg-muted",
}: PopularBoatsSectionProps) {
  const { localizedPath } = useLanguage();

  return (
    <RevealSection className={`py-16 sm:py-20 ${bgClass}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center gap-3 mb-6">
          <Ship className="w-6 h-6 text-primary" />
          {title}
        </h2>
        {description && (
          <p className="text-muted-foreground leading-relaxed mb-6">{description}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {boatIds
            .map((boatId) => ({ boatId, boat: BOAT_DATA[boatId] }))
            .filter(({ boat }) => !!boat)
            .map(({ boatId, boat }) => {
              const lowestPrice = Math.min(...Object.values(boat.pricing.BAJA.prices));
              const isNoLicense = boat.features.some((f) => f.toLowerCase().includes("sin licencia"));
              const label = badgeLabel ? badgeLabel(boatId) : isNoLicense ? "Sin licencia" : "Con licencia";
              const variant = badgeVariant ? badgeVariant(boatId) : isNoLicense ? "secondary" : "outline";
              return (
                <a
                  key={boat.id}
                  href={localizedPath("boatDetail", boat.id)}
                  className="block border rounded-lg p-4 hover:shadow-md transition-shadow bg-background"
                  data-testid={`link-popular-boat-${boat.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-heading font-semibold text-lg">{boat.name}</h3>
                    <Badge variant={variant} className="text-xs">
                      {label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{boat.subtitle}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-semibold text-sm">desde {lowestPrice} €</span>
                    <span className="text-sm text-primary hover:underline">{ctaLabel}</span>
                  </div>
                </a>
              );
            })}
        </div>
      </div>
    </RevealSection>
  );
}
