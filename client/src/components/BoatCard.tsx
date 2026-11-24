import React, { lazy, memo, Suspense, useCallback, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Anchor, Star, ThumbsUp } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { isCaptainedBoat } from "@shared/boatData";
import { trackEvent } from "@/utils/analytics";

// The quick view (Radix dialog + motion layout animation) is its own chunk; it is preloaded on hover/focus.
const loadQuickView = () => import("./BoatQuickView");
const BoatQuickView = lazy(loadQuickView);

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
      <div className="w-full aspect-[5/4] sm:aspect-[4/5] flex items-center justify-center">
        <Anchor className="w-12 h-12 text-muted-foreground/50" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[5/4] sm:aspect-[4/5] overflow-hidden boat-image-reveal">
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
          className="w-full h-full object-cover transition-[scale] duration-300 group-hover:[scale:1.03]"
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
export const BoatCardPricing = memo(function BoatCardPricing({
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
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickMounted, setQuickMounted] = useState(false);
  // Radix only restores focus to a <Trigger>; here the opener is a plain link, so remember it.
  const quickTrigger = useRef<HTMLElement | null>(null);
  const handleDetails = useCallback(() => {
    onDetails(id);
    setTimeout(() => window.scrollTo(0, 0), 50);
  }, [onDetails, id]);

  const handleImageError = useCallback(() => setImageError(true), []);

  const handleBooking = useCallback(() => onBooking(id), [onBooking, id]);

  const handleDetailsClick = useCallback(
    (e: React.MouseEvent) => {
      // Modified / non-primary clicks keep the browser default (new tab on the full boat page).
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      if (isJetSki) {
        handleDetails();
        return;
      }
      quickTrigger.current = e.currentTarget as HTMLElement;
      setQuickMounted(true);
      setQuickOpen(true);
      trackEvent("boat_quickview_open", { boat_id: id });
    },
    [handleDetails, isJetSki, id]
  );
  const preloadQuickView = useCallback(() => {
    if (!isJetSki) void loadQuickView();
  }, [isJetSki]);

  const licenseLabel = isCaptainedBoat(id)
    ? (t.nav.captained ?? t.boats.withoutLicense)
    : requiresLicense
      ? t.boats.navigationLicenseName
      : t.boats.withoutLicense;
  const detailsHref = isJetSki ? jetskiHref || "#" : localizedPath("boatDetail", id);

  return (
    <Card
      className={`group/card flex h-full flex-col overflow-hidden transition-colors ${
        isRecommended ? "border-2 border-cta" : "hover:border-cta/40"
      }`}
    >
      <div className="relative">
        <a
          href={detailsHref}
          onClick={handleDetailsClick}
          onPointerEnter={preloadQuickView}
          onFocus={preloadQuickView}
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
          <h3 className="absolute top-3 left-3 z-10 max-w-[calc(100%-1.5rem)] rounded-full bg-background px-3.5 py-1.5 font-heading text-base font-semibold leading-tight tracking-tight text-foreground">
            {name}
          </h3>
          {!isJetSki && (isRecommended || isPopular) && (
            <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-end gap-2">
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
            </div>
          )}
        </a>

        {/* Price + CTA live in the photo pill. Sibling of the link (a button inside an anchor is invalid). */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between gap-3">
          <div className="flex h-11 min-w-0 items-baseline gap-1.5 rounded-full bg-background px-4 leading-none">
            <span className="self-center text-xs text-muted-foreground">
              {isJetSki ? t.jetski?.fromLabel || t.boats.from : t.boats.from}
            </span>
            <span className="self-center font-heading text-xl font-semibold tracking-tight text-foreground tabular-nums">
              {basePrice}&euro;
            </span>
          </div>
          <button
            onClick={handleBooking}
            className={`flex-shrink-0 rounded-full bg-cta px-5 min-h-11 text-base font-medium text-primary-foreground dark:text-background transition-colors hover:bg-cta/90 focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none cta-pulse cta-pulse-light`}
            data-testid={`button-book-${id}`}
          >
            {isJetSki ? t.jetski?.requestCta || t.boats.book : t.boats.book}
          </button>
        </div>
      </div>

      {quickMounted && !isJetSki && (
        <Suspense fallback={null}>
          <BoatQuickView
            open={quickOpen}
            onOpenChange={setQuickOpen}
            id={id}
            name={name}
            image={image}
            imageSrcSet={imageSrcSet}
            imageAlt={imageAlt}
            capacity={capacity}
            requiresLicense={requiresLicense}
            licenseLabel={licenseLabel}
            description={description}
            basePrice={basePrice}
            features={features}
            enginePower={enginePower}
            detailsHref={detailsHref}
            returnFocusRef={quickTrigger}
            onBooking={onBooking}
            onDetails={onDetails}
          />
        </Suspense>
      )}
    </Card>
  );
}

export default memo(BoatCard);
