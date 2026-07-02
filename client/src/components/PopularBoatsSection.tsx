import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Ship } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { BOAT_DATA, boatDataRequiresLicense } from "@shared/boatData";
import { getBoatImage } from "@/utils/boatImages";
import type { Boat } from "@shared/schema";

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
  /** Optional CTA suffix used on each card. Defaults to the localized "Ver detalles →". */
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
  ctaLabel,
  bgClass = "bg-muted",
}: PopularBoatsSectionProps) {
  const { localizedPath } = useLanguage();
  const t = useTranslations();
  // Localized defaults so a non-Spanish visitor never sees Spanish badges/CTA
  // mixed into an otherwise translated page. Callers can still override.
  const effectiveCtaLabel = ctaLabel ?? `${t.boats.viewDetails} →`;

  // Live fleet: never recommend a boat the owner deactivated in the CRM.
  // While loading (or if the API fails) fall back to the static catalog so
  // SSR/first paint still shows cards.
  const { data: liveBoats } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const isLive = (boatId: string) =>
    !liveBoats || liveBoats.some((b) => b.id === boatId && b.isActive);

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
            .filter(({ boatId, boat }) => !!boat && isLive(boatId))
            .map(({ boatId, boat }) => {
              const lowestPrice = Math.min(...Object.values(boat.pricing.BAJA.prices));
              const isNoLicense = !boatDataRequiresLicense(boat);
              const label = badgeLabel ? badgeLabel(boatId) : isNoLicense ? t.booking.withoutLicense : t.booking.withLicense;
              const variant = badgeVariant ? badgeVariant(boatId) : isNoLicense ? "secondary" : "outline";
              return (
                <a
                  key={boat.id}
                  href={localizedPath("boatDetail", boat.id)}
                  className="block border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-background"
                  data-testid={`link-popular-boat-${boat.id}`}
                >
                  <img
                    src={getBoatImage(boat.image)}
                    alt={boat.name}
                    className="w-full aspect-[3/2] object-cover"
                    loading="lazy"
                    width={600}
                    height={400}
                  />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <h3 className="font-heading font-semibold text-lg">{boat.name}</h3>
                      <Badge variant={variant} className="text-xs shrink-0">
                        {label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{boat.subtitle}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-semibold text-sm">{t.boats.from} {lowestPrice} €</span>
                      <span className="text-sm text-primary hover:underline">{effectiveCtaLabel}</span>
                    </div>
                  </div>
                </a>
              );
            })}
        </div>
      </div>
    </RevealSection>
  );
}
