// Analytics event tracking utilities for Google Tag Manager + Meta Pixel + Google Ads
import type { UtmParams } from '@/hooks/useUtmCapture';
import { getStoredClickIds } from '@/hooks/useUtmCapture';
import { trackMetaInitiateCheckout, trackMetaPurchase, trackMetaContact } from './meta-pixel';
import { trackGoogleAdsConversion, pushEnhancedConversionData, trackGoogleAdsRemarketing } from './google-ads';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...params,
    });
  }
}

// Specific conversion events
export function trackBookingStarted(boatId: string, boatName: string, utm?: UtmParams) {
  trackEvent("booking_started", {
    boat_id: boatId,
    boat_name: boatName,
    ...(utm?.utm_source && { utm_source: utm.utm_source }),
    ...(utm?.utm_medium && { utm_medium: utm.utm_medium }),
    ...(utm?.utm_campaign && { utm_campaign: utm.utm_campaign }),
  });
  trackMetaInitiateCheckout(boatId, boatName, 0);

  trackGoogleAdsRemarketing({
    ecommPageType: 'cart',
    productId: boatId,
    productName: boatName,
  });
}

export function trackBookingCompleted(bookingId: string, amount: number, boatId: string) {
  const clickIds = getStoredClickIds();
  trackEvent("purchase", {
    transaction_id: bookingId,
    value: amount,
    currency: "EUR",
    boat_id: boatId,
    ...(clickIds.gclid && { gclid: clickIds.gclid }),
    ...(clickIds.fbclid && { fbclid: clickIds.fbclid }),
    ...(clickIds.msclkid && { msclkid: clickIds.msclkid }),
  });
  trackMetaPurchase(bookingId, amount, boatId);

  trackGoogleAdsConversion({
    conversionLabel: 'purchase',
    value: amount,
    currency: 'EUR',
    transactionId: bookingId,
  });
}

export function trackWhatsAppClick(source: string) {
  trackEvent("whatsapp_click", { source });
  trackMetaContact("whatsapp");
}

export function trackPhoneClick() {
  trackEvent("phone_click");
  trackMetaContact("phone");
}

export function trackBookingFormOpen(boatId?: string) {
  trackEvent("booking_form_open", { boat_id: boatId || "general" });
}

// Blog-specific analytics events (A1)
export function trackBlogView(slug: string, title: string, category: string) {
  trackEvent("blog_view", { blog_slug: slug, blog_title: title, blog_category: category });
}

export function trackBlogScroll(slug: string, percentage: 25 | 50 | 75 | 100) {
  trackEvent(`blog_scroll_${percentage}`, { blog_slug: slug, scroll_depth: percentage });
}

export function trackBlogCtaClick(slug: string, ctaType: string) {
  trackEvent("blog_cta_click", { blog_slug: slug, cta_type: ctaType });
}

export function trackBlogShare(slug: string, platform: string) {
  trackEvent("blog_share", { blog_slug: slug, share_platform: platform });
}

// Track booking with user data for Enhanced Conversions
// Push enhanced conversion data first (before conversion event) for better matching
export function trackBookingWithUserData(bookingId: string, amount: number, boatId: string, userData: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}) {
  pushEnhancedConversionData(userData);
  trackBookingCompleted(bookingId, amount, boatId);
}

// Server-side event forwarding to Meta Conversion API (CAPI)
// Sends events server-side for better attribution, bypassing ad blockers
export async function sendServerEvent(
  eventName: string,
  eventId: string,
  userData?: Record<string, string>,
  customData?: Record<string, unknown>,
) {
  try {
    await fetch("/api/meta-capi/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventId,
        sourceUrl: window.location.href,
        userData,
        customData,
      }),
    });
  } catch {
    // Silent failure - don't break user experience
  }
}
