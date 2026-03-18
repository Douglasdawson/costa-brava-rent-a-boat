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
      engagement_time_msec: 100,
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
  trackGoogleAdsConversion({ conversionLabel: 'whatsapp_click' });
}

export function trackPhoneClick() {
  trackEvent("phone_click");
  trackMetaContact("phone");
  trackGoogleAdsConversion({ conversionLabel: 'phone_click' });
}

export function trackGenerateLead(boatId: string, boatName: string, value: number) {
  trackEvent("generate_lead", {
    boat_id: boatId,
    boat_name: boatName,
    value: value,
    currency: "EUR",
  });
  trackGoogleAdsConversion({ conversionLabel: 'generate_lead', value, currency: 'EUR' });
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

// GA4 Ecommerce Data Layer helpers
function buildEcommerceItem(boatId: string, boatName: string, price: number) {
  return { item_id: boatId, item_name: boatName, item_category: 'boat_rental', price, quantity: 1, currency: 'EUR' };
}

export function trackViewItem(boatId: string, boatName: string, price: number) {
  if (typeof window === "undefined" || !window.dataLayer) return;
  window.dataLayer.push({ ecommerce: null }); // Clear previous ecommerce data
  window.dataLayer.push({
    event: 'view_item',
    ecommerce: {
      currency: 'EUR',
      value: price,
      items: [buildEcommerceItem(boatId, boatName, price)],
    },
  });
}

export function trackViewItemList(listId: string, listName: string, items: Array<{ id: string; name: string; price: number }>) {
  if (typeof window === "undefined" || !window.dataLayer) return;
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: 'view_item_list',
    ecommerce: {
      item_list_id: listId,
      item_list_name: listName,
      items: items.map((item, index) => ({ ...buildEcommerceItem(item.id, item.name, item.price), index })),
    },
  });
}

export function trackSelectItem(boatId: string, boatName: string, listName: string, index: number) {
  if (typeof window === "undefined" || !window.dataLayer) return;
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: 'select_item',
    ecommerce: {
      item_list_name: listName,
      items: [{ ...buildEcommerceItem(boatId, boatName, 0), index }],
    },
  });
}

export function trackBeginCheckout(boatId: string, boatName: string, price: number, utm?: UtmParams) {
  if (typeof window === "undefined" || !window.dataLayer) return;
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: 'begin_checkout',
    ecommerce: {
      currency: 'EUR',
      value: price,
      items: [buildEcommerceItem(boatId, boatName, price)],
    },
    ...(utm?.utm_source && { utm_source: utm.utm_source }),
    ...(utm?.utm_medium && { utm_medium: utm.utm_medium }),
    ...(utm?.utm_campaign && { utm_campaign: utm.utm_campaign }),
  });
}

export function trackAddShippingInfo(boatId: string, boatName: string) {
  if (typeof window === "undefined" || !window.dataLayer) return;
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: 'add_shipping_info',
    ecommerce: {
      items: [buildEcommerceItem(boatId, boatName, 0)],
    },
  });
}

export function trackPurchaseEcommerce(bookingId: string, amount: number, boatId: string, boatName: string) {
  if (typeof window === "undefined" || !window.dataLayer) return;
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: 'purchase',
    ecommerce: {
      transaction_id: bookingId,
      value: amount,
      currency: 'EUR',
      items: [buildEcommerceItem(boatId, boatName, amount)],
    },
  });
}

// Conversion events for business intelligence
export function trackLanguageChange(from: string, to: string) {
  trackEvent('language_change', { language_from: from, language_to: to });
}

export function trackNewsletterSignup(source: string) {
  trackEvent('newsletter_signup', { signup_source: source });
}

export function trackCookieConsent(choice: string) {
  trackEvent('cookie_consent', { consent_choice: choice });
}

export function trackExitIntentShown() {
  trackEvent('exit_intent_shown');
}

export function trackExitIntentCtaClick() {
  trackEvent('exit_intent_cta_click');
}

export function trackBoatQuizStart(source: string) {
  trackEvent('boat_quiz_start', { quiz_source: source });
}

export function trackBoatQuizComplete(result: string) {
  trackEvent('boat_quiz_complete', { quiz_result: result });
}

// Scroll depth tracking
export function trackScrollDepth(pageName: string, depth: 25 | 50 | 75 | 100) {
  trackEvent('scroll_depth', { page_name: pageName, scroll_percentage: depth });
}

// Client error tracking
export function trackJsError(message: string, source: string, line: number) {
  trackEvent('js_error', {
    error_message: message.substring(0, 150),
    error_source: source,
    error_line: line,
  });
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
