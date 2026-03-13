// Analytics event tracking utilities for Google Tag Manager
import type { UtmParams } from '@/hooks/useUtmCapture';

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
}

export function trackBookingCompleted(bookingId: string, amount: number, boatId: string) {
  trackEvent("purchase", {
    transaction_id: bookingId,
    value: amount,
    currency: "EUR",
    boat_id: boatId,
  });
}

export function trackWhatsAppClick(source: string) {
  trackEvent("whatsapp_click", { source });
}

export function trackPhoneClick() {
  trackEvent("phone_click");
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
