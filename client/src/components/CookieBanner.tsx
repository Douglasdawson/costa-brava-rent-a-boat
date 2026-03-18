import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { trackCookieConsent } from "@/utils/analytics";

function updateGTMConsent(granted: boolean) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    const consent = {
      analytics_storage: granted ? "granted" : "denied",
      ad_storage: granted ? "granted" : "denied",
      ad_user_data: granted ? "granted" : "denied",
      ad_personalization: granted ? "granted" : "denied",
    };
    window.gtag("consent", "update", consent as unknown);
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cookieConsent");
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("cookieConsent", "accepted");
    updateGTMConsent(true);
    trackCookieConsent('accepted');

    // Initialize Meta Pixel now that consent is granted
    const metaPixelId = document.querySelector('meta[name="fb-pixel-id"]')?.getAttribute('content');
    if (metaPixelId) {
      import('@/utils/meta-pixel').then(({ initMetaPixel }) => initMetaPixel(metaPixelId));
    }

    setVisible(false);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem("cookieConsent", "essential");
    updateGTMConsent(false);
    trackCookieConsent('essential');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Aviso de cookies"
      className="fixed bottom-0 left-0 right-0 z-[100] bg-background border-t border-border shadow-lg"
    >
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Cookie className="w-6 h-6 text-primary flex-shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
          <div className="flex-1 text-sm text-foreground">
            <p>
              Utilizamos cookies propias y de terceros (Google Analytics) para mejorar tu experiencia y analizar el tráfico web. Puedes aceptar todas las cookies o solo las esenciales.{" "}
              <a
                href="/cookies-policy"
                className="text-primary underline hover:text-primary/80"
              >
                Política de Cookies
              </a>
              {" · "}
              <a
                href="/privacy-policy"
                className="text-primary underline hover:text-primary/80"
              >
                Política de Privacidad
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
              Solo esenciales
            </Button>
            <Button
              size="sm"
              onClick={handleAcceptAll}
              className="flex-1 sm:flex-none text-xs"
            >
              Aceptar todas
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
