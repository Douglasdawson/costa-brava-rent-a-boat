import React, { memo, useCallback, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Anchor, Fuel, Star, ThumbsUp } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { boatIncludesFuel } from "@shared/boatData";

interface BoatCardProps {
  id: string;
  name: string;
  image: string;
  imageSrcSet?: string;
  imageTablet?: string;
  imageMobile?: string;
  imageAlt: string;
  capacity: number;
  requiresLicense: boolean;
  description: string;
  basePrice: number;
  features: string[];
  available: boolean;
  enginePower?: string;
  isPopular?: boolean;
  isRecommended?: boolean;
  /** Jet ski product: slot-based request modal, links to dedicated landing. */
  isJetSki?: boolean;
  /** Dedicated landing page href for jet ski products (image links here). */
  jetskiHref?: string;
  onBooking: (boatId: string) => void;
  onDetails: (boatId: string) => void;
}

/** Memoized boat image with picture element and error fallback */
const BoatCardImage = memo(function BoatCardImage({
  image,
  imageSrcSet,
  imageTablet,
  imageMobile,
  imageAlt,
  imageError,
  onImageError,
}: {
  image: string;
  imageSrcSet?: string;
  imageTablet?: string;
  imageMobile?: string;
  imageAlt: string;
  imageError: boolean;
  onImageError: () => void;
}) {
  if (imageError) {
    return (
      <div className="w-full aspect-[4/3] flex items-center justify-center">
        <Anchor className="w-12 h-12 text-muted-foreground/50" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/3] overflow-hidden boat-image-reveal">
      <picture>
        {imageMobile && (
          <source media="(max-width: 767px)" srcSet={imageMobile} type="image/webp" />
        )}
        {imageTablet && (
          <source media="(max-width: 1024px)" srcSet={imageTablet} type="image/webp" />
        )}
        <img
          src={image}
          srcSet={imageSrcSet || undefined}
          sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1279px) calc(50vw - 20px), calc(33vw - 24px)"
          alt={imageAlt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          decoding="async"
          onError={onImageError}
        />
      </picture>
    </div>
  );
});

/** Memoized pricing display — clean, no anchoring */
const BoatCardPricing = memo(function BoatCardPricing({
  basePrice,
  capacity,
  perPersonLabel,
  fromLabel,
  hidePerPerson,
}: {
  basePrice: number;
  capacity: number;
  perPersonLabel: string;
  fromLabel: string;
  hidePerPerson?: boolean;
}) {
  if (hidePerPerson) {
    return (
      <div className="text-right flex-shrink-0 space-y-0.5">
        <div className="text-sm text-muted-foreground">{fromLabel}</div>
        <div className="flex items-baseline justify-end">
          <span className="text-cta font-semibold text-xl">{basePrice}&euro;</span>
        </div>
      </div>
    );
  }
  return (
    <div className="text-right flex-shrink-0 space-y-0.5">
      <div className="text-sm text-muted-foreground">{fromLabel}</div>
      <div className="flex items-baseline gap-1.5 justify-end">
        <span className="text-cta font-semibold text-xl">
          {Math.ceil(basePrice / capacity)}&euro;
        </span>
        <span className="text-xs text-muted-foreground">/{perPersonLabel}</span>
      </div>
      <span className="text-xs text-muted-foreground">{basePrice}&euro; total</span>
    </div>
  );
});

function BoatCard({
  id,
  name,
  image,
  imageSrcSet,
  imageTablet,
  imageMobile,
  imageAlt,
  capacity,
  requiresLicense,
  description,
  basePrice,
  features,
  available,
  enginePower,
  isPopular,
  isRecommended,
  isJetSki,
  jetskiHref,
  onBooking,
  onDetails,
}: BoatCardProps) {
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  const [imageError, setImageError] = useState(false);
  const handleDetails = useCallback(() => {
    onDetails(id);
    setTimeout(() => window.scrollTo(0, 0), 50);
  }, [onDetails, id]);

  const handleImageError = useCallback(() => setImageError(true), []);

  const handleBooking = useCallback(() => onBooking(id), [onBooking, id]);

  const handleDetailsClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleDetails();
    },
    [handleDetails]
  );

  return (
    <Card
      className={`overflow-hidden boat-card-tilt ${
        isRecommended ? "border-2 border-cta" : "hover:border-cta/50 transition-colors"
      }`}
    >
      {(() => {
        const imageInner = (
          <>
            <BoatCardImage
              image={image}
              imageSrcSet={imageSrcSet}
              imageTablet={imageTablet}
              imageMobile={imageMobile}
              imageAlt={imageAlt}
              imageError={imageError}
              onImageError={handleImageError}
            />
            {isJetSki ? (
              <div className="absolute top-3 left-3 z-10">
                <div className="inline-flex items-center gap-1 bg-foreground text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                  {t.jetski?.badge || "Jet ski"}
                </div>
              </div>
            ) : (
              (isRecommended || isPopular) && (
                <div className="absolute top-3 left-3 z-10">
                  {isRecommended ? (
                    <div className="inline-flex items-center gap-1 bg-cta text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                      <ThumbsUp className="w-3 h-3" />
                      {t.recommendation?.recommendedForYou}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 bg-popular text-popular-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                      <Star className="w-3 h-3 fill-popular-foreground" />
                      {t.boats.mostPopular}
                    </div>
                  )}
                </div>
              )
            )}
          </>
        );
        // Jet ski products link to their dedicated landing page (like boats link
        // to their detail page); the "Solicitar" button below opens the modal.
        return isJetSki ? (
          <a
            href={jetskiHref || "#"}
            onClick={handleDetailsClick}
            className="relative block cursor-pointer group bg-muted focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none"
            data-testid={`image-${id}`}
            aria-label={`${name}`}
          >
            {imageInner}
          </a>
        ) : (
          <a
            href={localizedPath("boatDetail", id)}
            onClick={handleDetailsClick}
            className="relative block cursor-pointer group bg-muted focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none"
            data-testid={`image-${id}`}
            aria-label={`${t.a11y.viewBoatDetails} ${name}`}
          >
            {imageInner}
          </a>
        );
      })()}
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 mr-2">
            <h3 className="font-heading font-medium text-lg text-foreground">{name}</h3>
          </div>
          <BoatCardPricing
            basePrice={basePrice}
            capacity={capacity}
            perPersonLabel={t.boats.perPerson}
            fromLabel={isJetSki ? t.jetski?.fromLabel || t.boats.from : t.boats.from}
            hidePerPerson={isJetSki}
          />
        </div>

        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{description}</p>

        <p className="text-xs xs:text-sm text-muted-foreground mb-2 inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span>
            {capacity} {t.boats.people}
          </span>
          {enginePower && (
            <>
              <span aria-hidden="true">·</span>
              <span>{enginePower}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>{requiresLicense ? t.boats.withLicense : t.boats.withoutLicense}</span>
          {boatIncludesFuel(id, requiresLicense) && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-success font-medium">
                  <Fuel className="w-3 h-3" aria-hidden="true" />
                  {t.boatDetail.fuelIncluded}
                </span>
              </>
            )}
        </p>
      </CardContent>
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 flex items-center justify-end">
        <button
          onClick={handleBooking}
          className="bg-cta hover:bg-cta/90 text-primary-foreground text-base font-medium px-6 py-2.5 rounded-full focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none transition-colors cta-pulse cta-hover-lift"
          data-testid={`button-book-${id}`}
        >
          {isJetSki ? t.jetski?.requestCta || t.boats.book : t.boats.book}
        </button>
      </div>
    </Card>
  );
}

export default memo(BoatCard);
