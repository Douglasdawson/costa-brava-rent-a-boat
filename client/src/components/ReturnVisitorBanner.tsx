import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { X } from "lucide-react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
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
      className="fixed top-[calc(4.5rem+env(safe-area-inset-top,0px))] left-3 right-3 md:top-[5.5rem] md:left-0 md:right-0 md:mx-auto md:max-w-2xl lg:top-[6.5rem] z-40 rounded-2xl bg-primary text-primary-foreground shadow-lg dark:bg-[hsl(215_45%_16%)] dark:text-foreground animate-in slide-in-from-top-2 duration-300 motion-reduce:animate-none"
      role="region"
      aria-label={rt?.welcomeBack ?? "Welcome back"}
    >
      <div className="flex items-center gap-3 py-2.5 pl-5 pr-1.5">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-primary-foreground/75 dark:text-foreground/75">
            {rt?.welcomeBack ?? "Welcome back"}
          </p>
          <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-pretty">
            <span className="sm:hidden">{boat.name}</span>
            <span className="hidden sm:inline">{boatText}</span>
          </p>
        </div>
        <InteractiveHoverButton
          tone="light"
          href={boatDetailPath}
          onClick={handleClick}
          className="shrink-0 px-5"
        >
          {rt?.checkAvailability ?? "Check availability"}
        </InteractiveHoverButton>
        <button
          onClick={handleClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-primary-foreground/75 transition-colors hover:text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-foreground dark:text-foreground/75 dark:hover:text-foreground"
          aria-label={t.common?.close ?? "Close"}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default ReturnVisitorBanner;
