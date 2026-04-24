import { useLocation } from "wouter";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import { trackWhatsAppClick } from "@/utils/analytics";
import { useTranslations } from "@/lib/translations";

export default function WhatsAppFloatingButton() {
  const [location] = useLocation();
  const t = useTranslations();

  // Hide on admin/CRM pages
  if (location.startsWith("/admin") || location.startsWith("/crm")) {
    return null;
  }

  // On boat detail pages, raise the button above the sticky CTA bar (h-16)
  const isBoatDetailPage = location.startsWith("/barco/");

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
      className={`fixed right-4 z-50 items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:outline-none ${
        isBoatDetailPage ? "flex bottom-20 md:bottom-6 mb-safe" : "flex bottom-16 sm:bottom-6 mb-safe"
      }`}
      style={{ backgroundColor: "#25D366" }}
    >
      <SiWhatsapp className="w-7 h-7 md:w-8 md:h-8 text-white" />
    </a>
  );
}
