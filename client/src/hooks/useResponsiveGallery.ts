import { useState, useEffect } from "react";

const MOBILE_QUERY = "(max-width: 767px)";
const TABLET_QUERY = "(min-width: 768px) and (max-width: 1024px)";

interface BoatGalleryData {
  imageGallery?: string[] | null;
  imageGalleryTablet?: string[] | null;
  imageGalleryMobile?: string[] | null;
  imageUrl?: string | null;
}

export function useResponsiveGallery(boat: BoatGalleryData | undefined | null): string[] {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(MOBILE_QUERY).matches : false
  );
  const [isTablet, setIsTablet] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(TABLET_QUERY).matches : false
  );

  useEffect(() => {
    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    const tabletQuery = window.matchMedia(TABLET_QUERY);

    const handleMobile = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    const handleTablet = (e: MediaQueryListEvent) => setIsTablet(e.matches);

    mobileQuery.addEventListener("change", handleMobile);
    tabletQuery.addEventListener("change", handleTablet);

    return () => {
      mobileQuery.removeEventListener("change", handleMobile);
      tabletQuery.removeEventListener("change", handleTablet);
    };
  }, []);

  if (!boat) return [];

  const desktop = boat.imageGallery?.length ? boat.imageGallery : (boat.imageUrl ? [boat.imageUrl] : []);
  const tablet = boat.imageGalleryTablet?.length ? boat.imageGalleryTablet : desktop;
  const mobile = boat.imageGalleryMobile?.length ? boat.imageGalleryMobile : tablet;

  if (isMobile) return mobile;
  if (isTablet) return tablet;
  return desktop;
}
