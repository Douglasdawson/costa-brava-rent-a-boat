import React, { memo, useCallback, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Anchor, Star, ThumbsUp } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { boatIncludesFuel, isCaptainedBoat } from "@shared/boatData";

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
          width={400}
          height={300}
          onError={onImageError}
        />
      </picture>
    </div>
  );
});

/** Price block: total is the headline (what you pay), per-person is the second line. */
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
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground leading-none mb-1">{fromLabel}</div>
      <div className="font-heading font-semibold text-2xl leading-none tracking-tight text-foreground tabular-nums">
        {basePrice}&euro;
      </div>
      {!hidePerPerson && (
        <div className="mt-1.5 text-xs text-muted-foreground tabular-nums">
          <span className="font-medium text-foreground/80">
            {Math.ceil(basePrice / capacity)}&euro;
          </span>{" "}
          / {perPersonLabel}
        </div>
      )}
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

  const licenseLabel = isCaptainedBoat(id)
    ? t.nav.captained
    : requiresLicense
      ? t.boats.withLicense
      : t.boats.withoutLicense;
  const showFuel = boatIncludesFuel(id, requiresLicense);
  const detailsHref = isJetSki ? jetskiHref || "#" : localizedPath("boatDetail", id);

  return (
    <Card
      className={`group/card flex h-full flex-col overflow-hidden transition-colors ${
        isRecommended ? "border-2 border-cta" : "hover:border-cta/40"
      }`}
    >
      <a
        href={detailsHref}
        onClick={handleDetailsClick}
        className="relative block cursor-pointer group bg-muted focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none"
        data-testid={`image-${id}`}
        aria-label={isJetSki ? name : `${t.a11y.viewBoatDetails} ${name}`}
      >
        <BoatCardImage
          image={image}
          imageSrcSet={imageSrcSet}
          imageTablet={imageTablet}
          imageMobile={imageMobile}
          imageAlt={imageAlt}
          imageError={imageError}
          onImageError={handleImageError}
        />
        <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground">
            {isJetSki ? t.jetski?.badge || "Jet ski" : licenseLabel}
          </span>
          {!isJetSki && (isRecommended || isPopular) && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                isRecommended
                  ? "bg-cta text-primary-foreground dark:text-background"
                  : "bg-popular text-popular-foreground"
              }`}
            >
              {isRecommended ? (
                <ThumbsUp className="w-3 h-3" aria-hidden="true" />
              ) : (
                <Star className="w-3 h-3 fill-popular-foreground" aria-hidden="true" />
              )}
              {isRecommended ? t.recommendation?.recommendedForYou : t.boats.mostPopular}
            </span>
          )}
        </div>
      </a>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-heading font-semibold text-xl leading-tight tracking-tight text-foreground text-balance">
          {name}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-y-1 divide-x divide-border text-sm">
          <p className="pr-3.5 text-muted-foreground">
            <span className="font-heading text-lg font-semibold tabular-nums text-foreground">
              {capacity}
            </span>{" "}
            {t.boats.people}
          </p>
          {enginePower && <p className="px-3.5 font-medium text-foreground/80">{enginePower}</p>}
          {showFuel && (
            <p className="pl-3.5 font-medium text-success">{t.boatDetail.fuelIncluded}</p>
          )}
        </div>

        <p className="mt-3 mb-5 text-sm leading-relaxed text-muted-foreground">{description}</p>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-t border-border pt-4">
          <BoatCardPricing
            basePrice={basePrice}
            capacity={capacity}
            perPersonLabel={t.boats.perPerson}
            fromLabel={isJetSki ? t.jetski?.fromLabel || t.boats.from : t.boats.from}
            hidePerPerson={isJetSki}
          />
          <button
            onClick={handleBooking}
            className={`flex-shrink-0 rounded-full bg-cta px-6 py-2.5 min-h-11 text-base font-medium text-primary-foreground dark:text-background transition-colors hover:bg-cta/90 focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none ${
              isRecommended || isPopular ? "cta-pulse" : ""
            }`}
            data-testid={`button-book-${id}`}
          >
            {isJetSki ? t.jetski?.requestCta || t.boats.book : t.boats.book}
          </button>
        </div>
      </div>
    </Card>
  );
}

export default memo(BoatCard);
