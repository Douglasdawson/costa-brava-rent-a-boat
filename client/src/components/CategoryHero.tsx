import { Star } from "lucide-react";
import { HeroImage } from "@/components/HeroImage";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { SHEET, TONE_BG, type Tone } from "@/components/page-kit";
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
  /** Colour of the band that follows: the sheet's rounded corners reveal it. */
  next?: Tone;
}

/**
 * Hero shared by the two category landings (self-drive licensed boats and the
 * captained excursion): photo sheet with rounded bottom corners, short H1, one-sentence
 * subtitle with the derived "from" price, booking CTA, sister-category link and the real
 * Google rating. No icon next to the H1, no chips or kickers.
 */
export default function CategoryHero({
  imageBasePath,
  imageAlt,
  title,
  subtitleTemplate,
  price,
  secondaryCta,
  testId,
  next = "background",
}: CategoryHeroProps) {
  const t = useTranslations();
  const { openBookingModal } = useBookingModal();

  return (
    <div className={TONE_BG[next]}>
      <section
        className={`relative isolate flex min-h-[100svh] w-full flex-col justify-end overflow-hidden ${SHEET} pt-28 sm:min-h-[36rem]`}
      >
        <HeroImage basePath={imageBasePath} alt={imageAlt} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 via-[80%] to-black/40" />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 sm:pb-14 lg:px-8">
          <h1 className="max-w-3xl text-balance font-heading text-display font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.35),0_4px_24px_rgba(0,0,0,0.4)]">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-base text-white/90 [text-shadow:0_1px_10px_rgba(0,0,0,0.45)] sm:text-lg">
            {subtitleTemplate.replace("{price}", String(price))}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <InteractiveHoverButton
              tone="light"
              onClick={() => openBookingModal()}
              className="min-h-12 w-full px-8 text-base sm:w-auto"
              data-testid={`button-${testId}-hero-book`}
            >
              {t.nav.bookNow}
            </InteractiveHoverButton>
            <a
              href={secondaryCta.href}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full border-2 border-white/70 bg-white/10 px-6 text-base font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 motion-reduce:transition-none sm:w-auto"
              data-testid={`link-${testId}-hero-sister`}
            >
              {secondaryCta.label}
            </a>
            <a
              href={GBP_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-white hover:underline underline-offset-2 sm:ml-2"
              data-testid={`link-${testId}-hero-rating`}
            >
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              {BUSINESS_RATING_STR}/5 · Google
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
