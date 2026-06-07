import { useState, useEffect, useCallback, useRef } from "react";
import { Anchor, Clock, Users, CalendarCheck, ArrowRight, X } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { isMobileNavOpen, isAnyModalOpen } from "@/utils/overlay-guards";
import { lockScroll, unlockScroll } from "@/utils/scroll-lock";
import { trackEvent } from "@/utils/analytics";

const DISMISS_KEY = "boatClubPromoDismissed";
const SESSION_KEY = "boatClubPromoShown";
const SHOW_DELAY = 2500;
const RETRY_INTERVAL = 1500;
const MAX_ATTEMPTS = 12;
const BOAT_CLUB_URL = "https://costabravaboatclub.com/";

// Functional surfaces where an upsell popup would get in the way.
const EXCLUDED_SLUGS = ["crm", "login", "onboarding", "booking", "cancel"];

function isExcludedPage(): boolean {
  const segments = window.location.pathname.split("/").filter(Boolean);
  return segments.some((seg) => EXCLUDED_SLUGS.includes(seg));
}

/**
 * Centered cross-promotion modal for the sister business "Costa Brava Boat Club"
 * (separate site). Appears once per session after a short delay, remembers a
 * permanent dismissal via localStorage, and stays out of functional flows.
 */
export function BoatClubModal() {
  const t = useTranslations();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const close = useCallback((markPermanent: boolean) => {
    setShow(false);
    setDismissed(true);
    unlockScroll("boat-club-promo");
    if (markPermanent) {
      try {
        localStorage.setItem(DISMISS_KEY, "true");
      } catch {
        // localStorage unavailable — dismissal just won't persist
      }
    }
  }, []);

  const doShow = useCallback(() => {
    setShow(true);
    try {
      sessionStorage.setItem(SESSION_KEY, "true");
    } catch {
      // ignore
    }
    lockScroll("boat-club-promo");
    trackEvent("boat_club_promo_shown", {});
  }, []);

  // Show after a short delay, retrying while a cookie banner, mobile nav or
  // another modal is on screen, so the promo still appears once the view clears.
  useEffect(() => {
    if (dismissed) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "true") return;
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      // storage unavailable — fall through and show once
    }

    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;

    const attempt = () => {
      if (isExcludedPage()) return; // never show on functional flows
      const blocked = isMobileNavOpen() || isAnyModalOpen();
      if (!blocked) {
        doShow();
        return;
      }
      attempts += 1;
      if (attempts < MAX_ATTEMPTS) timer = setTimeout(attempt, RETRY_INTERVAL);
    };

    timer = setTimeout(attempt, SHOW_DELAY);
    return () => clearTimeout(timer);
  }, [dismissed, doShow]);

  // Guarantee scroll unlock if unmounted while open (client-side navigation).
  useEffect(() => () => unlockScroll("boat-club-promo"), []);

  // Close on Escape.
  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [show, close]);

  // Focus the close button on open, restore focus on close.
  useEffect(() => {
    if (show) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      const id = setTimeout(() => {
        modalRef.current?.querySelector("button")?.focus();
      }, 120);
      return () => clearTimeout(id);
    }
    previousFocusRef.current?.focus();
  }, [show]);

  // Trap Tab within the modal.
  useEffect(() => {
    if (!show) return;
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const modal = modalRef.current;
      if (!modal) return;
      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onTab);
    return () => document.removeEventListener("keydown", onTab);
  }, [show]);

  const c = t.boatClubPromo;
  const eyebrow = c?.eyebrow ?? "Otra forma de salir al mar";
  const title = c?.title ?? "Costa Brava Boat Club";
  const subtitle =
    c?.subtitle ??
    "Tu barco todo el año sin comprarlo. Cuota mensual, plazas limitadas por barco y reservas online cuando te apetezca navegar.";
  const perks = [
    { Icon: Clock, label: c?.perk1 ?? "Navega todo el año" },
    { Icon: Users, label: c?.perk2 ?? "Plazas limitadas por barco" },
    { Icon: CalendarCheck, label: c?.perk3 ?? "Reserva online desde tu panel" },
  ];
  const priceFrom = c?.priceFrom ?? "Desde";
  const priceAmount = c?.priceAmount ?? "200 €";
  const pricePer = c?.pricePer ?? "al mes";
  const cta = c?.cta ?? "Descubrir el club";
  const dismiss = c?.dismiss ?? "Ahora no";

  const handleCtaClick = () => {
    trackEvent("boat_club_promo_clicked", {});
    close(true);
  };

  if (!show) return null;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="boat-club-promo-title"
      onClick={() => close(true)}
    >
      <div className="bcm-scrim absolute inset-0 bg-foreground/60" />

      <div
        ref={modalRef}
        className="bcm-card relative w-full max-w-[440px] overflow-hidden rounded-[22px] bg-background shadow-[0_30px_80px_-20px_rgba(15,30,50,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Photo header — golden hour over the Costa Brava */}
        <div className="relative h-[208px] w-full overflow-hidden">
          {/* Short looping clip; falls back to the poster image until a video
              is dropped at /videos/boat-club-hero.* or for reduced-motion users. */}
          <video
            className="absolute inset-0 h-full w-full object-cover"
            poster="/images/blog/sunset-boat-trip-blanes-costa-brava.webp"
            autoPlay={!prefersReducedMotion}
            loop
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
          >
            <source src="/videos/boat-club-hero.mp4" type="video/mp4" />
          </video>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(20,30,52,0.50) 0%, rgba(31,48,68,0.05) 32%, rgba(31,48,68,0.05) 58%, rgba(20,20,52,0.66) 100%)",
            }}
          />

          <button
            onClick={() => close(true)}
            className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-foreground/45 text-white transition-colors hover:bg-foreground/65"
            aria-label={t.a11y?.close ?? "Cerrar"}
          >
            <X className="h-[18px] w-[18px]" />
          </button>

          {/* eyebrow over photo */}
          <div
            className="absolute left-7 right-7 top-5 flex items-center gap-2 text-white"
            style={{ textShadow: "0 1px 8px rgba(12,22,34,0.6)" }}
          >
            <Anchor className="h-[15px] w-[15px] shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.13em]">
              {eyebrow}
            </span>
          </div>

          {/* title over photo */}
          <h2
            id="boat-club-promo-title"
            className="absolute bottom-5 left-7 right-7 whitespace-nowrap font-heading font-semibold leading-[1.04] text-white drop-shadow-[0_2px_14px_rgba(12,22,34,0.55)]"
            style={{ fontSize: "clamp(20px, calc(8.4vw - 7px), 32px)" }}
          >
            {title}
          </h2>
        </div>

        <div className="px-7 pb-8 pt-6 sm:px-9">
          <p
            className="bcm-rise text-center text-[15px] leading-[1.6] text-muted-foreground"
            style={{ animationDelay: "0.1s" }}
          >
            {subtitle}
          </p>

          {/* advantages as chips */}
          <div
            className="bcm-rise mt-5 grid grid-cols-3 gap-2.5"
            style={{ animationDelay: "0.18s" }}
          >
            {perks.map(({ Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-2 py-3.5 text-center"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-ring/10 text-ring">
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <span className="text-[12px] font-medium leading-tight text-foreground [text-wrap:balance]">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* price */}
          <div
            className="bcm-rise mt-6 flex items-baseline justify-center gap-1.5"
            style={{ animationDelay: "0.26s" }}
          >
            <span className="text-[11.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {priceFrom}
            </span>
            <span className="font-heading text-[34px] font-semibold leading-none text-foreground">
              {priceAmount}
            </span>
            <span className="whitespace-nowrap text-[14px] font-medium text-muted-foreground">
              {pricePer}
            </span>
          </div>

          <a
            href={BOAT_CLUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleCtaClick}
            className="bcm-rise group mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-cta py-4 text-[16px] font-semibold text-white transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-10px_rgba(26,26,62,0.7)]"
            style={{ animationDelay: "0.32s" }}
          >
            {cta}
            <ArrowRight
              className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </a>

          <button
            onClick={() => close(true)}
            className="bcm-rise mt-3 w-full py-1.5 text-center text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            style={{ animationDelay: "0.36s" }}
          >
            {dismiss}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BoatClubModal;
