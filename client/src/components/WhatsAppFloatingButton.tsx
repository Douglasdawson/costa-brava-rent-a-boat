import { useCallback, useState } from "react";
import { useLocation } from "wouter";
import { ROUTE_SLUGS } from "@shared/i18n-routes";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import { trackWhatsAppClick } from "@/utils/analytics";
import { useTranslations } from "@/lib/translations";
import { useThrottledScroll } from "@/hooks/useThrottledScroll";

// Boat detail slugs across all 8 languages (/es/barco/, /en/boat/, ...)
const BOAT_DETAIL_SLUGS = new Set<string>(Object.values(ROUTE_SLUGS.boatDetail));

// BoatDetailPage shows its mobile sticky bottom CTA after 300px of scroll.
const STICKY_CTA_SCROLL_THRESHOLD = 300;

export default function WhatsAppFloatingButton() {
  const [location] = useLocation();
  const t = useTranslations();
  const [pastStickyCta, setPastStickyCta] = useState(false);

  const handleScroll = useCallback(
    (scrollY: number) => setPastStickyCta(scrollY > STICKY_CTA_SCROLL_THRESHOLD),
    []
  );
  useThrottledScroll(handleScroll);

  // Hide on admin/CRM pages
  if (location.startsWith("/admin") || location.startsWith("/crm")) {
    return null;
  }

  const isBoatDetailPage = location
    .split("/")
    .filter(Boolean)
    .some((segment) => BOAT_DETAIL_SLUGS.has(segment));

  // On boat detail pages the mobile sticky CTA already includes a WhatsApp
  // button, so hide the FAB on mobile while that bar is visible.
  const hiddenOnMobile = isBoatDetailPage && pastStickyCta;

  const whatsappMessage = encodeURIComponent(
    t.footer?.whatsappMessage || 'Hola, me interesa alquilar un barco'
  );

  return (
    <a
      href={`https://wa.me/34611500372?text=${whatsappMessage}`}
      target="_blank"
      rel="noopener noreferrer"
      title="WhatsApp"
      aria-label="Contactar por WhatsApp"
      onClick={() => trackWhatsAppClick("floating_button")}
      className={`fixed bottom-16 sm:bottom-6 right-4 z-50 mb-safe items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:outline-none bg-whatsapp ${
        hiddenOnMobile ? "hidden md:flex" : "flex"
      }`}
    >
      <SiWhatsapp className="w-7 h-7 md:w-8 md:h-8 text-white" />
    </a>
  );
}
