import React, { memo, useCallback, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Anchor, ArrowRight, Clock, Fuel, Star, ThumbsUp } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { getBoatAverageRating } from "@/data/boatReviews";

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
  highSeasonPrice?: number;
  features: string[];
  available: boolean;
  enginePower?: string;
  isPopular?: boolean;
  isRecommended?: boolean;
  scarcityData?: { availableSlots: number; totalSlots: number };
  weeklyBookings?: number;
  bestFor?: string;
  emotionTag?: string;
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
    <div className="relative w-full aspect-[4/3] overflow-hidden">
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

/** Memoized pricing display with price anchoring */
const BoatCardPricing = memo(function BoatCardPricing({
  basePrice,
  highSeasonPrice,
  capacity,
  perPersonLabel,
  fromLabel,
  highSeasonLabel,
}: {
  basePrice: number;
  highSeasonPrice?: number;
  capacity: number;
  perPersonLabel: string;
  fromLabel: string;
  highSeasonLabel: string;
}) {
  const savingsPercent = highSeasonPrice && highSeasonPrice > basePrice
    ? Math.round(((highSeasonPrice - basePrice) / highSeasonPrice) * 100)
    : 0;
  const showPriceAnchoring = savingsPercent > 15;

  return (
    <div className="text-right flex-shrink-0 space-y-0.5">
      <div className="text-sm text-muted-foreground">{fromLabel}</div>
      <div className="flex items-baseline gap-1.5 justify-end">
        {showPriceAnchoring && (
          <span className="text-xs text-muted-foreground line-through">
            {Math.ceil((highSeasonPrice || 0) / capacity)}&euro;
          </span>
        )}
        <span className="text-cta font-semibold text-xl">
          {Math.ceil(basePrice / capacity)}&euro;
        </span>
        <span className="text-xs text-muted-foreground">
          /{perPersonLabel}
        </span>
      </div>
      <div className="flex items-center gap-2 justify-end">
        {showPriceAnchoring && (
          <span className="inline-flex items-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold px-1.5 py-0.5 rounded-full">
            -{savingsPercent}%
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          {basePrice}&euro; total
        </span>
      </div>
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
  highSeasonPrice,
  features,
  available,
  enginePower,
  isPopular,
  isRecommended,
  scarcityData,
  weeklyBookings,
  bestFor,
  emotionTag,
  onBooking,
  onDetails
}: BoatCardProps) {
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  const [imageError, setImageError] = useState(false);
  const ratingData = useMemo(() => getBoatAverageRating(id), [id]);

  const currentSeason = useMemo(() => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', month: 'numeric' }).formatToParts(new Date());
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '0');
    if (month === 7) return 'MEDIA';
    if (month === 8) return 'ALTA';
    if ((month >= 4 && month <= 6) || (month >= 9 && month <= 10)) return 'BAJA';
    return null;
  }, []);

  const handleDetails = useCallback(() => {
    onDetails(id);
    setTimeout(() => window.scrollTo(0, 0), 50);
  }, [onDetails, id]);

  const handleImageError = useCallback(() => setImageError(true), []);

  const handleBooking = useCallback(() => onBooking(id), [onBooking, id]);

  const handleDetailsClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDetails();
  }, [handleDetails]);

  return (
    <Card className={`overflow-hidden boat-card-tilt ${
      isRecommended
        ? 'border-cta ring-1 ring-cta/30 shadow-md'
        : 'hover:border-cta/50'
    }`}>
      <a
        href={localizedPath("boatDetail", id)}
        onClick={handleDetailsClick}
        className="relative block cursor-pointer group bg-muted focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none"
        data-testid={`image-${id}`}
        aria-label={`${t.a11y.viewBoatDetails} ${name}`}
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
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {isPopular && (
            <div className="inline-flex items-center gap-1 bg-amber-500 text-amber-950 text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
              <Star className="w-3 h-3 fill-amber-950" />
              {t.boats.mostPopular}
            </div>
          )}
          {isRecommended && (
            <div className="inline-flex items-center gap-1 bg-cta text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
              <ThumbsUp className="w-3 h-3" />
              {t.recommendation?.recommendedForYou}
            </div>
          )}
          <span className="bg-white/90 backdrop-blur-sm text-slate-800 text-sm font-medium rounded-full px-3 py-1 self-start">
            {requiresLicense ? t.boats.withLicense : t.boats.withoutLicense}
          </span>
          {bestFor && (
            <span className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 text-xs font-semibold rounded-full px-3 py-1 self-start">
              {bestFor}
            </span>
          )}
        </div>
        {!requiresLicense && (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-green-600/90 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            <Fuel className="w-3 h-3" />
            {t.boatDetail.fuelIncluded}
          </div>
        )}
      </a>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 mr-2">
            <h3 className="font-heading font-medium text-lg text-foreground">{name}</h3>
            {ratingData.count > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.round(ratingData.average)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-foreground">{ratingData.average}</span>
                <span className="text-xs text-muted-foreground">({ratingData.count})</span>
              </div>
            )}
            {emotionTag && (
              <p className="text-xs italic text-muted-foreground/80 mt-0.5">{emotionTag}</p>
            )}
          </div>
          <BoatCardPricing
            basePrice={basePrice}
            highSeasonPrice={highSeasonPrice}
            capacity={capacity}
            perPersonLabel={t.boats.perPerson}
            fromLabel={t.boats.from}
            highSeasonLabel={t.pricing?.highSeason || 'High season'}
          />
        </div>

        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{description}</p>

        <p className="text-xs xs:text-sm text-muted-foreground mb-2">
          {capacity} {t.boats.people}{enginePower ? ` | ${enginePower}` : ''}{` | ${requiresLicense ? t.boats.withLicense : t.boats.withoutLicense}`}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {!requiresLicense && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3" />
              {t.boats.popularDuration}
            </span>
          )}
          {currentSeason === 'BAJA' && (
            <span className="inline-flex items-center text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full font-medium">
              {t.boats.seasonPriceLow}
            </span>
          )}
          {currentSeason === 'MEDIA' && (
            <span className="inline-flex items-center text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full font-medium">
              {t.boats.seasonPriceMid}
            </span>
          )}
        </div>

        {scarcityData && (
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {scarcityData.availableSlots === 0 ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 urgency-dot-pulse" />
                <span className="text-red-600">{t.scarcity?.soldOutSaturday}</span>
              </>
            ) : scarcityData.availableSlots <= 3 ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 urgency-dot-pulse" />
                <span className="text-amber-600">
                  {t.scarcity?.onlyXSlots?.replace('{count}', String(scarcityData.availableSlots))}
                </span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-green-600">{t.scarcity?.availableSaturday}</span>
              </>
            )}
          </div>
        )}

        {weeklyBookings !== undefined && weeklyBookings >= 2 && (
          <p className="text-xs text-orange-600 font-medium mt-1">
            {t.boats.weeklyBookings?.replace('{count}', String(weeklyBookings))}
          </p>
        )}
      </CardContent>
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 flex items-center justify-between gap-2">
        <a
          href={localizedPath("boatDetail", id)}
          onClick={handleDetailsClick}
          className="details-link text-sm font-medium text-foreground hover:text-cta inline-flex items-center gap-1.5 transition-colors py-3 -my-1 focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none rounded"
          data-testid={`button-details-${id}`}
          aria-label={`${t.boats.viewDetails} — ${name}`}
        >
          {t.boats.viewDetails} <ArrowRight className="w-4 h-4 details-link-arrow" />
        </a>
        <button
          onClick={handleBooking}
          className="bg-cta hover:bg-cta/90 text-white text-base font-medium px-6 py-2.5 rounded-full focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none cta-pulse cta-hover-lift"
          data-testid={`button-book-${id}`}
        >
          {t.boats.book}
        </button>
      </div>
    </Card>
  );
}

export default memo(BoatCard);
