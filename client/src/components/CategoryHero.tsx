import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroImage } from "@/components/HeroImage";
import { useBookingModal } from "@/hooks/bookingModalContext";
import { useTranslations } from "@/lib/translations";
import { BUSINESS_RATING_STR, GBP_PROFILE_URL } from "@shared/businessProfile";

interface CategoryHeroProps {
  /** Photo base path: `<base>.jpg|webp|avif` and `<base>-mobile.*`. */
  imageBasePath: string;
  imageAlt: string;
  title: string;
  /** One sentence with a "{price}" placeholder, filled from the live catalog. */
  subtitleTemplate: string;
  /** Cheapest 2 h price (EUR), derived by the caller from shared/pricing.ts. */
  price: number;
  /** Link to the sister category (licensed <-> captained). */
  secondaryCta: { href: string; label: string };
  testId: string;
}

/**
 * Hero shared by the two category landings (self-drive licensed boats and the
 * captained excursion): photo, short H1, one-sentence subtitle with the derived
 * "from" price, booking CTA, sister-category link and the real Google rating.
 * Follows the LocationTemplate hero so phone visitors see price and CTA in the
 * first viewport. No icon next to the H1, no chips or kickers.
 */
export default function CategoryHero({
  imageBasePath,
  imageAlt,
  title,
  subtitleTemplate,
  price,
  secondaryCta,
  testId,
}: CategoryHeroProps) {
  const t = useTranslations();
  const { openBookingModal } = useBookingModal();

  return (
    <section className="relative pt-20 sm:pt-24">
      <div className="relative flex min-h-[25rem] w-full flex-col justify-end overflow-hidden sm:min-h-[34rem]">
        <HeroImage basePath={imageBasePath} alt={imageAlt} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/65 via-[85%] to-black/35" />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-6 pt-16 sm:px-6 sm:pb-12 lg:px-8">
          <h1 className="max-w-3xl text-balance font-heading text-h1 font-bold text-white drop-shadow-lg">
            {title}
          </h1>
          <p className="mt-3 max-w-xl text-pretty text-base text-white/95 drop-shadow sm:text-lg">
            {subtitleTemplate.replace("{price}", String(price))}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1">
            <Button
              onClick={() => openBookingModal()}
              className="min-h-12 rounded-full bg-white px-7 font-semibold text-cta hover:bg-white/90"
              data-testid={`button-${testId}-hero-book`}
            >
              {t.nav.bookNow}
            </Button>
            <a
              href={GBP_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-white drop-shadow hover:underline underline-offset-2"
              data-testid={`link-${testId}-hero-rating`}
            >
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              {BUSINESS_RATING_STR}/5 · Google
            </a>
          </div>
          <a
            href={secondaryCta.href}
            className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-white underline decoration-white/60 underline-offset-4 hover:decoration-white"
            data-testid={`link-${testId}-hero-sister`}
          >
            {secondaryCta.label}
          </a>
        </div>
      </div>
    </section>
  );
}
