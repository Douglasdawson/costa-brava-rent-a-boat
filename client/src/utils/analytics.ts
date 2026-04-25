// Analytics event tracking utilities for Google Tag Manager + Meta Pixel + Google Ads
import type { UtmParams } from '@/hooks/useUtmCapture';
import { getStoredClickIds } from '@/hooks/useUtmCapture';
import { trackMetaInitiateCheckout, trackMetaPurchase, trackMetaContact } from './meta-pixel';
import { trackGoogleAdsConversion, pushEnhancedConversionData, trackGoogleAdsRemarketing } from './google-ads';

const ANALYTICS_DEBUG = typeof window !== 'undefined' &&
  import.meta.env.DEV &&
  (new URLSearchParams(window.location?.search || '').has('gtm_debug') ||
   localStorage.getItem('analytics_debug') === 'true');

function debugLog(eventName: string, params?: Record<string, unknown>) {
  if (ANALYTICS_DEBUG) {
    console.log(`[GTM Debug] ${eventName}`, params || {});
  }
}

export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  debugLog(eventName, params);
  if (typeof window !== "undefined" && window.dataLayer) {
    const cleanParams = params
      ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
      : {};
    window.dataLayer.push({
      event: eventName,
      engagement_time_msec: 100,
      ...cleanParams,
    });
  }
}

// Specific conversion events
export function trackBookingStarted(boatId: string, boatName: string, utm?: UtmParams) {
  const eventId = generateEventId();
  trackEvent("booking_started", {
    boat_id: boatId,
    boat_name: boatName,
    event_id: eventId,
    ...(utm?.utm_source && { utm_source: utm.utm_source }),
    ...(utm?.utm_medium && { utm_medium: utm.utm_medium }),
    ...(utm?.utm_campaign && { utm_campaign: utm.utm_campaign }),
  });
  trackMetaInitiateCheckout(boatId, boatName, 0, eventId);

  trackGoogleAdsRemarketing({
    ecommPageType: 'cart',
    productId: boatId,
    productName: boatName,
  });
}

export interface BookingCompletedMeta {
  boatModel?: string | null;
  licenseType?: 'con_licencia' | 'sin_licencia' | null;
  durationHours?: number | null;
  timeSlot?: TimeSlot | null;
  numberOfPeople?: number | null;
}

export function trackBookingCompleted(
  bookingId: string,
  amount: number,
  boatId: string,
  meta?: BookingCompletedMeta,
) {
  const clickIds = getStoredClickIds();
  const eventId = generateEventId();
  trackEvent("purchase", {
    transaction_id: bookingId,
    value: amount,
    currency: "EUR",
    boat_id: boatId,
    event_id: eventId,
    ...(meta?.boatModel && { boat_model: meta.boatModel }),
    ...(meta?.licenseType && { license_type: meta.licenseType }),
    ...(meta?.durationHours != null && { duration_hours: meta.durationHours }),
    ...(meta?.timeSlot && { time_slot: meta.timeSlot }),
    ...(meta?.numberOfPeople != null && { number_of_people: meta.numberOfPeople }),
    ...(clickIds.gclid && { gclid: clickIds.gclid }),
    ...(clickIds.fbclid && { fbclid: clickIds.fbclid }),
    ...(clickIds.msclkid && { msclkid: clickIds.msclkid }),
  });
  trackMetaPurchase(bookingId, amount, boatId, eventId);

  trackGoogleAdsConversion({
    conversionLabel: 'purchase',
    value: amount,
    currency: 'EUR',
    transactionId: bookingId,
    ...(meta?.boatModel && { boatModel: meta.boatModel }),
    ...(meta?.licenseType && { licenseType: meta.licenseType }),
    ...(meta?.durationHours != null && { durationHours: meta.durationHours }),
    ...(meta?.timeSlot && { timeSlot: meta.timeSlot }),
  });
}

export function trackWhatsAppClick(source: string, utm?: UtmParams) {
  const eventId = generateEventId();
  const pagePath = typeof window !== 'undefined' ? window.location.pathname : '';
  const pageLanguage = pagePath.match(/^\/([a-z]{2})\//)?.[1] || 'es';

  trackEvent("whatsapp_click", {
    source,
    page_path: pagePath,
    page_language: pageLanguage,
    event_id: eventId,
    ...(utm?.utm_source && { utm_source: utm.utm_source }),
    ...(utm?.utm_medium && { utm_medium: utm.utm_medium }),
    ...(utm?.utm_campaign && { utm_campaign: utm.utm_campaign }),
  });
  trackMetaContact("whatsapp", eventId);
  trackGoogleAdsConversion({ conversionLabel: 'whatsapp_click' });
}

export function trackPhoneClick(utm?: UtmParams) {
  const eventId = generateEventId();
  trackEvent("phone_click", {
    event_id: eventId,
    ...(utm?.utm_source && { utm_source: utm.utm_source }),
    ...(utm?.utm_medium && { utm_medium: utm.utm_medium }),
    ...(utm?.utm_campaign && { utm_campaign: utm.utm_campaign }),
  });
  trackMetaContact("phone", eventId);
  trackGoogleAdsConversion({ conversionLabel: 'phone_click' });
}

export function trackGenerateLead(boatId: string, boatName: string, value: number, userData?: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}) {
  if (userData) pushEnhancedConversionData(userData);
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
}, meta?: BookingCompletedMeta) {
  pushEnhancedConversionData(userData);
  trackBookingCompleted(bookingId, amount, boatId, meta);
}

// GA4 Ecommerce Data Layer helpers
export type TimeSlot = 'morning' | 'afternoon' | 'full_day';

export interface BoatLike {
  id: string;
  name: string;
  specifications?: { model?: string | null } | null;
  requiresLicense?: boolean | null;
}

export interface BookingMeta {
  durationHours?: number | null;
  startTime?: Date | string | null;
  numberOfPeople?: number | null;
}

export function deriveTimeSlot(
  startTime: Date | string | null | undefined,
  totalHours: number | null | undefined,
): TimeSlot | null {
  if (!startTime || !totalHours) return null;
  const d = typeof startTime === 'string' ? new Date(startTime) : startTime;
  if (Number.isNaN(d.getTime())) return null;
  if (totalHours >= 8) return 'full_day';
  return d.getHours() < 14 ? 'morning' : 'afternoon';
}

export function deriveLicenseType(requiresLicense: boolean | null | undefined): 'con_licencia' | 'sin_licencia' {
  return requiresLicense ? 'con_licencia' : 'sin_licencia';
}

interface BuildItemOptions {
  price?: number;
  quantity?: number;
  index?: number;
  durationHours?: number | null;
  timeSlot?: TimeSlot | null;
}

function buildEcommerceItem(boat: BoatLike, options: BuildItemOptions = {}): Record<string, unknown> {
  const item: Record<string, unknown> = {
    item_id: boat.id,
    item_name: boat.name,
    item_category: 'boat_rental',
    price: options.price ?? 0,
    quantity: options.quantity ?? 1,
    currency: 'EUR',
  };
  if (boat.specifications?.model) item.item_brand = boat.specifications.model;
  if (boat.requiresLicense !== undefined && boat.requiresLicense !== null) {
    item.item_category2 = deriveLicenseType(boat.requiresLicense);
  }
  if (options.durationHours != null) item.item_variant = `${options.durationHours}h`;
  if (options.index != null) item.index = options.index;
  return item;
}

function eventLevelDims(boat: BoatLike, meta?: BookingMeta, timeSlot?: TimeSlot | null): Record<string, unknown> {
  const dims: Record<string, unknown> = {};
  if (boat.specifications?.model) dims.boat_model = boat.specifications.model;
  if (boat.requiresLicense !== undefined && boat.requiresLicense !== null) {
    dims.license_type = deriveLicenseType(boat.requiresLicense);
  }
  if (meta?.durationHours != null) dims.duration_hours = meta.durationHours;
  if (timeSlot) dims.time_slot = timeSlot;
  if (meta?.numberOfPeople != null) dims.number_of_people = meta.numberOfPeople;
  return dims;
}

export function trackViewItem(boat: BoatLike, price: number) {
  if (typeof window === "undefined" || !window.dataLayer) return;
  window.dataLayer.push({ ecommerce: null }); // Clear previous ecommerce data
  window.dataLayer.push({
    event: 'view_item',
    ecommerce: {
      currency: 'EUR',
      value: price,
      items: [buildEcommerceItem(boat, { price })],
      ...eventLevelDims(boat),
    },
  });
}

export function trackViewItemList(
  listId: string,
  listName: string,
  items: Array<BoatLike & { price: number }>,
) {
  if (typeof window === "undefined" || !window.dataLayer) return;
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: 'view_item_list',
    ecommerce: {
      item_list_id: listId,
      item_list_name: listName,
      items: items.map((item, index) => buildEcommerceItem(item, { price: item.price, index })),
    },
  });
}

export function trackSelectItem(boat: BoatLike, listName: string, index: number) {
  if (typeof window === "undefined" || !window.dataLayer) return;
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: 'select_item',
    ecommerce: {
      item_list_name: listName,
      items: [buildEcommerceItem(boat, { index })],
    },
  });
}

export function trackAddToCart(boat: BoatLike, price: number, meta?: BookingMeta) {
  if (typeof window === "undefined" || !window.dataLayer) return;
  const timeSlot = deriveTimeSlot(meta?.startTime ?? null, meta?.durationHours ?? null);
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: 'add_to_cart',
    ecommerce: {
      currency: 'EUR',
      value: price,
      items: [buildEcommerceItem(boat, { price, durationHours: meta?.durationHours, timeSlot })],
      ...eventLevelDims(boat, meta, timeSlot),
    },
  });
}

export function trackBeginCheckout(boat: BoatLike, price: number, utm?: UtmParams, meta?: BookingMeta) {
  if (typeof window === "undefined" || !window.dataLayer) return;
  const timeSlot = deriveTimeSlot(meta?.startTime ?? null, meta?.durationHours ?? null);
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: 'begin_checkout',
    ecommerce: {
      currency: 'EUR',
      value: price,
      items: [buildEcommerceItem(boat, { price, durationHours: meta?.durationHours, timeSlot })],
      ...eventLevelDims(boat, meta, timeSlot),
    },
    ...(utm?.utm_source && { utm_source: utm.utm_source }),
    ...(utm?.utm_medium && { utm_medium: utm.utm_medium }),
    ...(utm?.utm_campaign && { utm_campaign: utm.utm_campaign }),
  });
}

export function trackAddShippingInfo(boat: BoatLike, price: number, meta?: BookingMeta) {
  if (typeof window === "undefined" || !window.dataLayer) return;
  const timeSlot = deriveTimeSlot(meta?.startTime ?? null, meta?.durationHours ?? null);
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: 'add_shipping_info',
    ecommerce: {
      currency: 'EUR',
      value: price,
      items: [buildEcommerceItem(boat, { price, durationHours: meta?.durationHours, timeSlot })],
      ...eventLevelDims(boat, meta, timeSlot),
    },
  });
}

export function trackPurchaseEcommerce(transactionId: string, amount: number, boat: BoatLike, meta?: BookingMeta) {
  if (typeof window === "undefined" || !window.dataLayer) return;
  const timeSlot = deriveTimeSlot(meta?.startTime ?? null, meta?.durationHours ?? null);
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: 'purchase',
    ecommerce: {
      transaction_id: transactionId,
      value: amount,
      currency: 'EUR',
      items: [buildEcommerceItem(boat, { price: amount, durationHours: meta?.durationHours, timeSlot })],
      ...eventLevelDims(boat, meta, timeSlot),
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
let jsErrorCount = 0;
const JS_ERROR_MAX_PER_SESSION = 10;

export function trackJsError(message: string, source: string, line: number) {
  if (jsErrorCount >= JS_ERROR_MAX_PER_SESSION) return;
  jsErrorCount++;
  trackEvent('js_error', {
    error_message: message.substring(0, 150),
    error_source: source,
    error_line: line,
  });
}

// Booking funnel micro-events
export function trackDateSelected(date: string, boatId: string) {
  trackEvent('booking_date_selected', { selected_date: date, boat_id: boatId });
}
export function trackDurationSelected(duration: string, boatId: string) {
  trackEvent('booking_duration_selected', { duration, boat_id: boatId });
}
export function trackExtrasChanged(extraId: string, extraName: string, added: boolean) {
  trackEvent('booking_extras_changed', { extra_id: extraId, extra_name: extraName, action: added ? 'add' : 'remove' });
}
export function trackCouponApplied(couponCode: string, success: boolean) {
  trackEvent('coupon_applied', { coupon_code: couponCode, success });
}
export function trackTimeSlotSelected(time: string, boatId: string) {
  trackEvent('time_slot_selected', { selected_time: time, boat_id: boatId });
}
export function trackQuoteCreated(holdId: string, total: number, boatId: string) {
  trackEvent('quote_created', { hold_id: holdId, value: total, currency: 'EUR', boat_id: boatId });
}
export function trackBookingConfirmed(bookingId: string, boatName: string, date: string, amount: number) {
  trackEvent('booking_confirmed', { booking_id: bookingId, boat_name: boatName, booking_date: date, value: amount, currency: 'EUR' });
}
export function trackPaymentInitiated(amount: number, boatId: string) {
  trackEvent('payment_initiated', { value: amount, currency: 'EUR', boat_id: boatId });
}
export function trackBookingAbandoned(step: string, boatId: string) {
  trackEvent('booking_abandoned', { abandoned_step: step, boat_id: boatId });
}

// Engagement events
export function trackFaqExpanded(questionId: string) {
  trackEvent('faq_expanded', { question_id: questionId });
}
export function trackReviewCarouselScroll(direction: 'left' | 'right') {
  trackEvent('review_carousel_scroll', { direction });
}
export function trackSocialProofDismissed() {
  trackEvent('social_proof_dismissed');
}
export function trackGalleryViewed(boatId: string, photoIndex: number) {
  trackEvent('gallery_viewed', { boat_id: boatId, photo_index: photoIndex });
}
export function trackRouteSelected(routeId: string) {
  trackEvent('route_selected', { route_id: routeId });
}
export function trackGiftCardPurchase(amount: number, success: boolean) {
  trackEvent('gift_card_purchase', { value: amount, currency: 'EUR', success });
}
export function trackLocationPageView(locationId: string) {
  trackEvent('location_page_view', { location_id: locationId });
}
export function trackBoatClickedFromFleet(boatId: string, action: 'book' | 'details') {
  trackEvent('boat_clicked_fleet', { boat_id: boatId, click_action: action });
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
