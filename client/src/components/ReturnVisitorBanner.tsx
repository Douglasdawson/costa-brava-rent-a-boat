import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Repeat, X } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import {
  isReturnVisitor,
  getLastViewedBoat,
  isBannerDismissed,
  markBannerDismissed,
} from "@/hooks/useJourneyState";
import { trackEvent } from "@/utils/analytics";

export function ReturnVisitorBanner() {
  const [visible, setVisible] = useState(false);
  const [location] = useLocation();
  const { localizedPath } = useLanguage();
  const t = useTranslations();

  useEffect(() => {
    // Only show on homepage: path is /<lang> or /<lang>/
    const segments = location.replace(/\/$/, "").split("/").filter(Boolean);
    const isHomePage = segments.length <= 1;
    if (!isHomePage) return;

    if (isBannerDismissed()) return;
    if (!isReturnVisitor()) return;

    const boat = getLastViewedBoat();
    if (!boat) return;

    // Small delay so it doesn't flash immediately
    const timer = setTimeout(() => {
      setVisible(true);
      trackEvent("return_visitor_banner_shown", {
        boat_id: boat.id,
        boat_name: boat.name,
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [location]);

  if (!visible) return null;

  const boat = getLastViewedBoat();
  if (!boat) return null;

  const rt = t.returnVisitor;
  const boatText = rt?.stillThinking
    ? rt.stillThinking.replace("{boat}", boat.name)
    : `Still thinking about ${boat.name}?`;

  const handleClick = () => {
    trackEvent("return_visitor_banner_clicked", {
      boat_id: boat.id,
      boat_name: boat.name,
    });
    markBannerDismissed();
    setVisible(false);
  };

  const handleClose = () => {
    markBannerDismissed();
    setVisible(false);
  };

  const boatDetailPath = localizedPath("boatDetail", boat.id);

  return (
    <div
      className="fixed top-16 left-0 right-0 z-40 bg-indigo-50 dark:bg-indigo-950/30 border-b border-indigo-200 dark:border-indigo-800 animate-in slide-in-from-top-2 duration-300"
      role="banner"
      aria-label={rt?.welcomeBack ?? "Welcome back"}
    >
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Repeat
            className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0"
            aria-hidden="true"
          />
          <p className="text-sm text-indigo-900 dark:text-indigo-100 truncate">
            <span className="font-semibold">{rt?.welcomeBack ?? "Welcome back!"}</span>
            {" "}
            <span className="hidden sm:inline">{boatText}</span>
          </p>
          <a
            href={boatDetailPath}
            onClick={handleClick}
            className="bg-cta hover:bg-cta/90 text-white rounded-full px-4 py-1 text-sm font-medium whitespace-nowrap transition-colors shrink-0"
          >
            {rt?.checkAvailability ?? "Check availability"}
          </a>
        </div>
        <button
          onClick={handleClose}
          className="text-indigo-400 hover:text-indigo-600 dark:text-indigo-500 dark:hover:text-indigo-300 p-1 shrink-0 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default ReturnVisitorBanner;
