import { Card, CardContent } from "@/components/ui/card";
import { Anchor, ArrowRight, Star, ThumbsUp } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useState } from "react";

interface BoatCardProps {
  id: string;
  name: string;
  image: string;
  imageSrcSet?: string;
  imageAlt: string;
  capacity: number;
  requiresLicense: boolean;
  description: string;
  basePrice: number;
  highSeasonPrice?: number;
  features: string[];
  available: boolean;
  enginePower?: string;
  isPopular?: boolean;
  isRecommended?: boolean;
  onBooking: (boatId: string) => void;
  onDetails: (boatId: string) => void;
}

export default function BoatCard({
  id,
  name,
  image,
  imageSrcSet,
  imageAlt,
  capacity,
  requiresLicense,
  description,
  basePrice,
  highSeasonPrice,
  features,
  available,
  enginePower,
  isPopular,
  isRecommended,
  onBooking: _onBooking,
  onDetails
}: BoatCardProps) {
  const t = useTranslations();
  const [imageError, setImageError] = useState(false);

  const handleDetails = () => {
    onDetails(id);
    setTimeout(() => window.scrollTo(0, 0), 50);
  };

  // Calculate savings percentage for price anchoring
  // Only show when high season price is >15% more expensive than current base price
  const savingsPercent = highSeasonPrice && highSeasonPrice > basePrice
    ? Math.round(((highSeasonPrice - basePrice) / highSeasonPrice) * 100)
    : 0;
  const showPriceAnchoring = savingsPercent > 15;

  return (
    <Card className={`overflow-hidden transition-all duration-200 ${
      isRecommended
        ? 'border-cta ring-1 ring-cta/30 shadow-md'
        : 'hover:border-cta/50'
    }`}>
      <a
        href={`/barco/${id}`}
        onClick={(e) => { e.preventDefault(); handleDetails(); }}
        className="relative block cursor-pointer group bg-muted focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none"
        data-testid={`image-${id}`}
        aria-label={`Ver detalles del barco ${name}`}
      >
        {imageError ? (
          <div className="w-full h-44 sm:h-52 lg:h-64 flex items-center justify-center">
            <Anchor className="w-12 h-12 text-muted-foreground/50" aria-hidden="true" />
          </div>
        ) : (
          <img
            src={image}
            srcSet={imageSrcSet || undefined}
            sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1279px) calc(50vw - 20px), calc(33vw - 24px)"
            alt={imageAlt}
            className="w-full h-44 sm:h-52 lg:h-64 object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        )}
        {isPopular && (
          <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
            <Star className="w-3 h-3 fill-white" />
            {t.boats.mostPopular}
          </div>
        )}
        {isRecommended && !isPopular && (
          <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 bg-cta text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
            <ThumbsUp className="w-3 h-3" />
            {t.recommendation?.recommendedForYou}
          </div>
        )}
        {isRecommended && isPopular && (
          <div className="absolute top-11 left-3 z-10 inline-flex items-center gap-1 bg-cta text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
            <ThumbsUp className="w-3 h-3" />
            {t.recommendation?.recommendedForYou}
          </div>
        )}
        <div className={`absolute ${isPopular && isRecommended ? 'top-[76px]' : isPopular || isRecommended ? 'top-11' : 'top-3'} left-3`}>
          <span className="bg-white/90 backdrop-blur-sm text-foreground text-sm font-medium rounded-full px-3 py-1">
            {requiresLicense ? t.boats.withLicense : t.boats.withoutLicense}
          </span>
        </div>
        {available ? (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-green-500/90 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {t.boats.available}
          </div>
        ) : (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-red-500/80 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {t.boats.occupied}
          </div>
        )}
      </a>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-heading font-medium text-lg text-foreground flex-1 mr-2">{name}</h3>
          <div className="text-right flex-shrink-0">
            <div className="text-sm text-muted-foreground">{t.boats.from}</div>
            <div className="flex items-baseline gap-1.5 justify-end">
              {showPriceAnchoring && (
                <span className="text-sm text-muted-foreground/70 line-through">
                  {highSeasonPrice}&euro;
                </span>
              )}
              <span className="text-cta font-medium text-lg">
                {basePrice}&euro;
              </span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              {showPriceAnchoring && (
                <span className="inline-flex items-center bg-green-100 text-green-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                  -{savingsPercent}%
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {Math.ceil(basePrice / capacity)}&euro;/{t.boats.perPerson}
              </span>
            </div>
          </div>
        </div>

        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{description}</p>

        <p className="text-xs xs:text-sm text-muted-foreground mb-3">
          {capacity} {t.boats.people}{enginePower ? ` | ${enginePower}` : ''}{` | ${requiresLicense ? t.boats.withLicense : t.boats.withoutLicense}`}
        </p>
      </CardContent>
      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
        <a
          href={`/barco/${id}`}
          onClick={(e) => { e.preventDefault(); handleDetails(); }}
          className="text-sm font-medium text-foreground hover:text-cta inline-flex items-center gap-1.5 transition-colors py-2 -my-1 focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none rounded"
          data-testid={`button-details-${id}`}
        >
          {t.boats.viewDetails} <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </Card>
  );
}
