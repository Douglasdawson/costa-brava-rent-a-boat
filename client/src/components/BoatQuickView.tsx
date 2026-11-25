import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, User, X } from "lucide-react";
import { boatIncludesFuel } from "@shared/boatData";
import { useTranslations } from "@/lib/translations";

export interface BoatQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: string;
  name: string;
  image: string;
  imageSrcSet?: string;
  imageAlt: string;
  capacity: number;
  requiresLicense: boolean;
  licenseLabel: string;
  description: string;
  basePrice: number;
  features: string[];
  enginePower?: string;
  detailsHref: string;
  /** Element to focus when the dialog closes (the card link that opened it). */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  onBooking: (boatId: string) => void;
  onDetails: (boatId: string) => void;
}

const MAX_FEATURES = 8;

// i18n spec labels are written as "Motor:"; here they label a tile, so the colon goes.
const stripColon = (label: string): string => label.replace(/:\s*$/, "");

/**
 * Quick view opened from a fleet card: photo + the data the card already has, with a real link to the full
 * boat page. Pattern from Watermelon's expandable-profile-card, rebuilt on Radix Dialog for focus trap, Escape,
 * scroll lock and aria-modal.
 */
export default function BoatQuickView({
  open,
  onOpenChange,
  id,
  name,
  image,
  imageSrcSet,
  imageAlt,
  capacity,
  requiresLicense,
  licenseLabel,
  description,
  basePrice,
  features,
  enginePower,
  detailsHref,
  returnFocusRef,
  onBooking,
  onDetails,
}: BoatQuickViewProps) {
  const t = useTranslations();
  const reduced = useReducedMotion();
  const showFuel = boatIncludesFuel(id, requiresLicense);
  const shownFeatures = features.slice(0, MAX_FEATURES);
  const fade = { duration: reduced ? 0 : 0.25 };

  const handleBooking = () => {
    onOpenChange(false);
    onBooking(id);
  };

  const handleDetails = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Modified clicks keep the browser default (new tab); a plain click goes through the router.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onOpenChange(false);
    onDetails(id);
    window.setTimeout(() => window.scrollTo(0, 0), 50);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fade}
              />
            </DialogPrimitive.Overlay>
            {/* inset + m-auto centres the box without CSS transforms, which would fight motion's layout animation */}
            <DialogPrimitive.Content
              asChild
              forceMount
              onOpenAutoFocus={e => {
                // Land on the dialog itself, not on the first button (which would show a focus ring on the CTA).
                e.preventDefault();
                (e.target as HTMLElement).focus({ preventScroll: true });
              }}
              onCloseAutoFocus={e => {
                e.preventDefault();
                returnFocusRef?.current?.focus();
              }}
            >
              <motion.div
                data-testid={`quickview-${id}`}
                className="fixed inset-3 z-50 m-auto flex h-fit max-h-[calc(100dvh-1.5rem)] max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground focus:outline-none md:inset-6 md:h-fit md:max-h-[calc(100dvh-3rem)] md:flex-row"
                initial={{ opacity: 0, y: reduced ? 0 : 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduced ? 0 : 8 }}
                transition={fade}
              >
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted md:aspect-[4/5] md:w-1/2">
                  <img
                    src={image}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-2xl"
                  />
                  <div className="absolute inset-0 flex items-center">
                    <img
                      src={image}
                      srcSet={imageSrcSet || undefined}
                      sizes="(min-width: 768px) 448px, 100vw"
                      alt={imageAlt}
                      width={800}
                      height={600}
                      className="h-auto w-full md:[mask-image:linear-gradient(to_bottom,transparent,black_14%,black_86%,transparent)]"
                    />
                  </div>
                </div>

                {/* flex-auto, not flex-1: iOS Safari resolves flex-1's 0% basis against this h-fit box and collapses the panel to 0px */}
                <div className="flex min-h-0 flex-auto flex-col bg-muted md:w-1/2">
                  <div className="min-h-0 flex-auto overflow-y-auto overscroll-contain rounded-b-2xl bg-card p-5 sm:p-6">
                    <p className="text-sm font-medium text-muted-foreground">{licenseLabel}</p>
                    <DialogPrimitive.Title className="mt-1 pr-12 font-heading text-2xl font-semibold leading-[1.1] tracking-tight text-foreground text-balance sm:text-3xl">
                      {name}
                    </DialogPrimitive.Title>

                    <dl className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-2">
                      <div className="rounded-xl bg-muted/60 px-3 py-2.5">
                        <dt className="text-xs text-muted-foreground">
                          {stripColon(t.boatDetail.specCapacity)}
                        </dt>
                        <dd className="mt-0.5 flex items-center gap-1.5 font-heading text-base font-semibold leading-tight text-foreground tabular-nums">
                          <User
                            className="h-[1.125rem] w-[1.125rem] text-muted-foreground"
                            aria-hidden="true"
                          />
                          {capacity}{" "}
                          <span className="text-sm font-medium text-muted-foreground">
                            {t.boats.people}
                          </span>
                        </dd>
                      </div>
                      {enginePower && (
                        <div className="rounded-xl bg-muted/60 px-3 py-2.5">
                          <dt className="text-xs text-muted-foreground">
                            {stripColon(t.boatDetail.specEngine)}
                          </dt>
                          <dd className="mt-0.5 font-heading text-base font-semibold leading-tight text-foreground">
                            {enginePower}
                          </dd>
                        </div>
                      )}
                      {showFuel && (
                        <div className="rounded-xl bg-muted/60 px-3 py-2.5">
                          <dt className="text-xs text-muted-foreground">
                            {stripColon(t.boatDetail.specFuel)}
                          </dt>
                          <dd className="mt-0.5 font-heading text-base font-semibold leading-tight text-success">
                            {t.boatDetail.fuelIncludedShort}
                          </dd>
                        </div>
                      )}
                    </dl>

                    <DialogPrimitive.Description className="mt-4 text-sm leading-relaxed text-foreground/80">
                      {description}
                    </DialogPrimitive.Description>

                    {shownFeatures.length > 0 && (
                      <section
                        className="mt-4 border-t border-border pt-4"
                        aria-label={t.boatDetail.equipmentIncluded}
                      >
                        <h3 className="text-sm font-semibold text-foreground">
                          {t.boatDetail.equipmentIncluded}
                        </h3>
                        <ul className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 text-sm leading-snug text-foreground/85">
                          {shownFeatures.map(feature => (
                            <li key={feature} className="flex items-start gap-2">
                              <Check
                                className="mt-0.5 h-4 w-4 shrink-0 text-success"
                                aria-hidden="true"
                              />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>

                  <div className="p-4 sm:px-6 sm:py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-muted-foreground">{t.boats.from}</span>
                        <span className="font-heading text-3xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
                          {basePrice}&euro;
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground tabular-nums">
                        <span className="font-medium text-foreground/80">
                          {Math.ceil(basePrice / capacity)}&euro;
                        </span>{" "}
                        / {t.boats.perPerson}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={handleBooking}
                        data-testid={`quickview-book-${id}`}
                        className="min-h-12 min-w-[9rem] flex-[1.4] rounded-full bg-cta px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-cta/90 focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none dark:text-background"
                      >
                        {t.boats.book}
                      </button>
                      <a
                        href={detailsHref}
                        onClick={handleDetails}
                        data-testid={`quickview-details-${id}`}
                        className="group/details inline-flex min-h-12 min-w-[8.5rem] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-background px-4 text-base font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        {t.boats.viewDetails}
                        <ArrowRight
                          className="h-4 w-4 transition-transform duration-200 group-hover/details:translate-x-0.5 motion-reduce:transition-none"
                          aria-hidden="true"
                        />
                      </a>
                    </div>
                  </div>
                </div>

                <DialogPrimitive.Close
                  aria-label={t.a11y.close}
                  className="absolute right-3 top-3 z-10 flex size-11 items-center justify-center rounded-full bg-background text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </DialogPrimitive.Close>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
