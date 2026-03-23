import { isScrollLocked } from "./scroll-lock";

export function isMobileNavOpen(): boolean {
  const btn = document.querySelector<HTMLElement>('[data-testid="button-mobile-menu"]');
  return btn?.getAttribute("aria-expanded") === "true";
}

export function isAnyModalOpen(): boolean {
  return isScrollLocked();
}

export function isCookieBannerVisible(): boolean {
  return !localStorage.getItem("cookieConsent");
}
