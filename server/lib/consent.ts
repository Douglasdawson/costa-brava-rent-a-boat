import type { Request } from "express";

// Mirror of the browser's cookie-banner choice. CookieBanner writes a
// first-party `cookieConsent` cookie next to the localStorage key so the server
// can tell whether the visitor accepted analytics/advertising cookies.
// Anything other than "accepted" (rejected, missing, legacy) means NO consent:
// server-side events to Meta/GA4 must then not carry identifiers.
export function hasTrackingConsent(req: Request): boolean {
  return req.cookies?.cookieConsent === "accepted";
}
