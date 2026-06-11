import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { trackCookieConsent } from "@/utils/analytics";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";

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
  const { localizedPath } = useLanguage();
  const t = useTranslations();
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
      className={`fixed bottom-0 left-0 right-0 z-[300] bg-background border-t border-border shadow-lg pb-safe transition-transform duration-200 ease-out ${
        animateIn ? "translate-y-0" : "translate-y-full"
      }`}
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
