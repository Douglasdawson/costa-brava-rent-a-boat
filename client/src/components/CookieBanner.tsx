import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { trackCookieConsent } from "@/utils/analytics";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { ROUTE_SLUGS } from "@shared/i18n-routes";

// On the booking wizard the bottom edge belongs to the "Next" CTA: a bottom
// banner sits on top of it and swallows the tap of anyone who ignores the
// notice. There the banner docks to the TOP edge (over the progress bar,
// which is informational) so the flow is never blocked.
const BOOKING_SLUGS = new Set<string>(Object.values(ROUTE_SLUGS.booking));

function updateGTMConsent(granted: boolean) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    const consent = {
      analytics_storage: granted ? "granted" : "denied",
      ad_storage: granted ? "granted" : "denied",
      ad_user_data: granted ? "granted" : "denied",
      ad_personalization: granted ? "granted" : "denied",
      functional_storage: "granted",
      security_storage: "granted",
    };
    window.gtag("consent", "update", consent as unknown);
  }
}

export default function CookieBanner() {
  const [location] = useLocation();
  const { localizedPath } = useLanguage();
  const t = useTranslations();
  const dockTop = location
    .split("/")
    .filter(Boolean)
    .some((segment) => BOOKING_SLUGS.has(segment));
  const cb = t.cookieBanner;
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cookieConsent");
    if (!stored) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimateIn(true)));
    }
  }, []);

  const dismiss = (action: () => void) => {
    setAnimateIn(false);
    setTimeout(() => {
      action();
      setVisible(false);
    }, 200);
  };

  const handleAcceptAll = () => dismiss(() => {
    localStorage.setItem("cookieConsent", "accepted");
    updateGTMConsent(true);
    trackCookieConsent('accepted');

    const metaPixelId = document.querySelector('meta[name="fb-pixel-id"]')?.getAttribute('content');
    if (metaPixelId) {
      import('@/utils/meta-pixel').then(({ initMetaPixel }) => initMetaPixel(metaPixelId));
    }
  });

  const handleEssentialOnly = () => dismiss(() => {
    localStorage.setItem("cookieConsent", "essential");
    updateGTMConsent(false);
    trackCookieConsent('essential');
  });

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={cb?.ariaLabel ?? "Aviso de cookies"}
      className={`fixed left-0 right-0 z-[300] bg-background shadow-lg transition-transform duration-200 ease-out ${
        dockTop ? "top-0 border-b border-border pt-safe" : "bottom-0 border-t border-border pb-safe"
      } ${animateIn ? "translate-y-0" : dockTop ? "-translate-y-full" : "translate-y-full"}`}
    >
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Cookie className="w-6 h-6 text-primary flex-shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
          <div className="flex-1 text-sm text-foreground">
            <p>
              {cb?.message ?? "Utilizamos cookies propias y de terceros (Google Analytics) para mejorar tu experiencia y analizar el tráfico web."}{" "}
              <a
                href={localizedPath("cookiesPolicy")}
                className="text-primary underline hover:text-primary/80 transition-colors"
              >
                {cb?.cookiesPolicy ?? "Política de Cookies"}
              </a>
              {" · "}
              <a
                href={localizedPath("privacyPolicy")}
                className="text-primary underline hover:text-primary/80 transition-colors"
              >
                {cb?.privacyPolicy ?? "Política de Privacidad"}
              </a>
            </p>
          </div>
          <div className="flex flex-row gap-2 flex-shrink-0 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEssentialOnly}
              className="flex-1 sm:flex-none text-xs"
            >
              {cb?.essentialOnly ?? "Solo esenciales"}
            </Button>
            <Button
              size="sm"
              onClick={handleAcceptAll}
              className="flex-1 sm:flex-none text-xs"
            >
              {cb?.acceptAll ?? "Aceptar todas"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
