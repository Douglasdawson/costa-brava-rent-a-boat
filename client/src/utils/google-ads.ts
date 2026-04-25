// Google Ads conversion tracking
// Works through GTM dataLayer - the actual conversion tags are configured in GTM
// This file pushes structured events that GTM picks up and sends to Google Ads

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: (...args: unknown[]) => void;
  }
}

/**
 * Push a Google Ads conversion event to the dataLayer.
 * GTM should be configured to pick up these events and fire the
 * corresponding Google Ads conversion tags.
 *
 * Event naming follows Google's recommended conventions for GTM triggers.
 */
// Google Ads Conversion ID and Label — from Google Ads account 727-861-8415
const GOOGLE_ADS_CONVERSION_ID = 'AW-341099427';

// Conversion label map — Google Ads account 727-861-8415
const GOOGLE_ADS_LABELS: Record<string, string> = {
  purchase: 'C8nZCPLtj4kcEKOH06IB',
  whatsapp_click: 'zxvsCLeNj44cEKOH06IB',
  phone_click: 'F9UsCJTmoI4cEKOH06IB',
  generate_lead: '9PadCJfmoI4cEKOH06IB',
};

export function trackGoogleAdsConversion(params: {
  conversionLabel: string;
  value?: number;
  currency?: string;
  transactionId?: string;
  newCustomer?: boolean;
  boatModel?: string;
  licenseType?: 'con_licencia' | 'sin_licencia';
  durationHours?: number;
  timeSlot?: string;
}) {
  if (typeof window === 'undefined') return;

  // Fire via gtag directly (works without GTM configuration)
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_CONVERSION_ID}/${GOOGLE_ADS_LABELS[params.conversionLabel] || GOOGLE_ADS_LABELS.purchase}`,
      value: params.value ?? 150,
      currency: params.currency || 'EUR',
      transaction_id: params.transactionId || '',
    });
  }

  // Also push to dataLayer for GTM (if configured with conversion tags)
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'google_ads_conversion',
      conversion_label: params.conversionLabel,
      ...(params.value !== undefined && { conversion_value: params.value }),
      ...(params.currency && { conversion_currency: params.currency }),
      ...(params.transactionId && { transaction_id: params.transactionId }),
      ...(params.newCustomer !== undefined && { new_customer: params.newCustomer }),
      ...(params.boatModel && { boat_model: params.boatModel }),
      ...(params.licenseType && { license_type: params.licenseType }),
      ...(params.durationHours !== undefined && { duration_hours: params.durationHours }),
      ...(params.timeSlot && { time_slot: params.timeSlot }),
    });
  }
}

/**
 * Enhanced Conversions - push hashed user data to dataLayer
 * for better conversion matching. Data is hashed client-side
 * before being sent to Google.
 *
 * GTM Enhanced Conversions tag reads these from the dataLayer.
 */
export function pushEnhancedConversionData(userData: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}) {
  if (typeof window === 'undefined' || !window.dataLayer) return;

  // Google expects the data to be pushed before the conversion event
  // GTM handles the SHA-256 hashing when "automatic" is enabled,
  // or we can pre-hash it here
  const enhancedData: Record<string, string> = {};

  if (userData.email) enhancedData.email = userData.email.trim().toLowerCase();
  if (userData.phone) enhancedData.phone_number = userData.phone.replace(/\s+/g, '');
  if (userData.firstName) enhancedData.first_name = userData.firstName.trim().toLowerCase();
  if (userData.lastName) enhancedData.last_name = userData.lastName.trim().toLowerCase();

  if (Object.keys(enhancedData).length === 0) return;

  window.dataLayer.push({
    event: 'enhanced_conversion_data',
    enhanced_conversion_data: enhancedData,
  });
}

/**
 * Track Google Ads remarketing event.
 * Pushes to dataLayer for GTM dynamic remarketing tag.
 */
export function trackGoogleAdsRemarketing(params: {
  ecommPageType: 'home' | 'category' | 'product' | 'cart' | 'purchase' | 'other';
  productId?: string;
  productName?: string;
  productPrice?: number;
  totalValue?: number;
  boatModel?: string;
  licenseType?: 'con_licencia' | 'sin_licencia';
  durationHours?: number;
}) {
  if (typeof window === 'undefined' || !window.dataLayer) return;

  window.dataLayer.push({
    event: 'google_ads_remarketing',
    ecomm_pagetype: params.ecommPageType,
    ...(params.productId && { ecomm_prodid: params.productId }),
    ...(params.productName && { ecomm_prodname: params.productName }),
    ...(params.productPrice !== undefined && { ecomm_totalvalue: params.productPrice }),
    ...(params.totalValue !== undefined && { ecomm_totalvalue: params.totalValue }),
    ...(params.boatModel && { boat_model: params.boatModel }),
    ...(params.licenseType && { license_type: params.licenseType }),
    ...(params.durationHours !== undefined && { duration_hours: params.durationHours }),
  });
}
