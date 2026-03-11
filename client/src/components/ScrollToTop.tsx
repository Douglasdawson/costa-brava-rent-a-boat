import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import { useTranslations } from "@/lib/translations";

export function ScrollToTop() {
  const t = useTranslations();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hide on admin pages
  if (typeof window !== "undefined" && (window.location.pathname.startsWith("/admin") || window.location.pathname.startsWith("/crm"))) {
    return null;
  }

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-24 right-4 md:bottom-8 md:right-6 z-40 mb-safe w-10 h-10 rounded-full bg-foreground/10 hover:bg-foreground/20 backdrop-blur-sm text-foreground/60 hover:text-foreground transition-all duration-300 flex items-center justify-center ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
      aria-label={t.a11y.scrollToTop}
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}
