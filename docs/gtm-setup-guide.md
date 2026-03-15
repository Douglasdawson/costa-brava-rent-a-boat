# Google Tag Manager Setup Guide for Google Ads Conversion Tracking

This guide explains how to configure GTM (GTM-WPSV63W) to read the dataLayer events
pushed by the frontend code and fire the corresponding Google Ads tags.

## Prerequisites

- Access to Google Tag Manager container GTM-WPSV63W
- A Google Ads account with conversion actions created
- The CONVERSION_ID and CONVERSION_LABEL values from your Google Ads conversion setup

---

## 1. Create DataLayer Variables

In GTM, go to Variables > User-Defined Variables and create the following:

### DLV - conversion_label
- Type: Data Layer Variable
- Data Layer Variable Name: `conversion_label`

### DLV - conversion_value
- Type: Data Layer Variable
- Data Layer Variable Name: `conversion_value`

### DLV - conversion_currency
- Type: Data Layer Variable
- Data Layer Variable Name: `conversion_currency`

### DLV - transaction_id
- Type: Data Layer Variable
- Data Layer Variable Name: `transaction_id`

### DLV - new_customer
- Type: Data Layer Variable
- Data Layer Variable Name: `new_customer`

### DLV - enhanced_conversion_data
- Type: Data Layer Variable
- Data Layer Variable Name: `enhanced_conversion_data`

### DLV - ecomm_pagetype
- Type: Data Layer Variable
- Data Layer Variable Name: `ecomm_pagetype`

### DLV - ecomm_prodid
- Type: Data Layer Variable
- Data Layer Variable Name: `ecomm_prodid`

### DLV - ecomm_prodname
- Type: Data Layer Variable
- Data Layer Variable Name: `ecomm_prodname`

### DLV - ecomm_totalvalue
- Type: Data Layer Variable
- Data Layer Variable Name: `ecomm_totalvalue`

---

## 2. Create Triggers

### Trigger: Google Ads Conversion
- Type: Custom Event
- Event name: `google_ads_conversion`

### Trigger: Google Ads Remarketing
- Type: Custom Event
- Event name: `google_ads_remarketing`

### Trigger: Enhanced Conversion Data
- Type: Custom Event
- Event name: `enhanced_conversion_data`

---

## 3. Create Tags

### Tag: Google Ads Conversion Tracking

1. Go to Tags > New
2. Tag Type: Google Ads Conversion Tracking
3. Configuration:
   - Conversion ID: `AW-XXXXXXXXX` (from your Google Ads account)
   - Conversion Label: `{{DLV - conversion_label}}`
   - Conversion Value: `{{DLV - conversion_value}}`
   - Currency Code: `{{DLV - conversion_currency}}`
   - Transaction ID: `{{DLV - transaction_id}}`
4. Trigger: Google Ads Conversion
5. Consent: Require `ad_storage` consent

### Tag: Google Ads Conversion Linker

1. Tag Type: Conversion Linker
2. Trigger: All Pages
3. This tag enables cross-domain tracking and auto-tagging for Google Ads

### Tag: Google Ads Remarketing

1. Tag Type: Google Ads Remarketing
2. Configuration:
   - Conversion ID: `AW-XXXXXXXXX` (same as above)
   - Custom Parameters:
     - `ecomm_pagetype`: `{{DLV - ecomm_pagetype}}`
     - `ecomm_prodid`: `{{DLV - ecomm_prodid}}`
     - `ecomm_prodname`: `{{DLV - ecomm_prodname}}`
     - `ecomm_totalvalue`: `{{DLV - ecomm_totalvalue}}`
3. Trigger: Google Ads Remarketing
4. Consent: Require `ad_storage` consent

---

## 4. Enable Enhanced Conversions

Enhanced Conversions improve conversion measurement by sending hashed first-party
customer data (email, phone, name) alongside conversion events.

### Option A: Automatic (recommended)

1. In your Google Ads Conversion Tracking tag, check "Include user-provided data from your website"
2. Select "Data Layer" as the source
3. Map the fields:
   - Email: `enhanced_conversion_data.email`
   - Phone: `enhanced_conversion_data.phone_number`
   - First Name: `enhanced_conversion_data.first_name`
   - Last Name: `enhanced_conversion_data.last_name`
4. GTM will automatically hash the data with SHA-256 before sending

### Option B: Manual variable mapping

1. Create a User-Defined Variable of type "User-Provided Data"
2. Set data source to "Data Layer"
3. Map each field from `enhanced_conversion_data`:
   - `enhanced_conversion_data.email`
   - `enhanced_conversion_data.phone_number`
   - `enhanced_conversion_data.first_name`
   - `enhanced_conversion_data.last_name`
4. Reference this variable in your conversion tag under "User-Provided Data"

### How it works in the code

The frontend pushes an `enhanced_conversion_data` event to the dataLayer with
the user's PII (in plain text, lowercased and trimmed). GTM hashes this data
before sending it to Google Ads. The data is pushed *before* the conversion event
so it is available when the conversion tag fires.

---

## 5. Meta Pixel Tag (Alternative to Inline Script)

If you prefer managing the Meta Pixel through GTM instead of inline:

1. Tag Type: Custom HTML
2. HTML:
```html
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
```
3. Trigger: All Pages
4. Consent: Require `ad_storage` consent

For Meta conversion events, create additional Custom HTML tags that call
`fbq('track', 'Purchase', {...})` etc., triggered by the same dataLayer events.

---

## 6. Consent Mode Integration

All tags should respect Consent Mode v2, which is already implemented on the site.
By default, `ad_storage` is denied. Tags requiring ad storage will only fire after
the user grants consent.

In GTM:
1. Go to Admin > Container Settings
2. Enable "Consent Mode" under Additional Settings
3. For each Google Ads tag, set Required Consent: `ad_storage`
4. Google tags with consent mode will still send cookieless pings for modeling

---

## 7. DataLayer Events Summary

| Event Name | Description | Key Variables |
|---|---|---|
| `google_ads_conversion` | Fired on booking completion | `conversion_label`, `conversion_value`, `conversion_currency`, `transaction_id` |
| `google_ads_remarketing` | Fired on product views and cart | `ecomm_pagetype`, `ecomm_prodid`, `ecomm_prodname`, `ecomm_totalvalue` |
| `enhanced_conversion_data` | Pushed before conversion with user PII | `enhanced_conversion_data.email`, `.phone_number`, `.first_name`, `.last_name` |
| `booking_started` | User starts booking flow | `boat_id`, `boat_name` |
| `purchase` | Booking completed (GA4 event) | `transaction_id`, `value`, `currency`, `boat_id` |

---

## 8. Testing

1. Use GTM Preview mode to verify tags fire correctly
2. Check the dataLayer tab in Preview to see pushed events
3. Use Google Tag Assistant to verify conversion tags
4. In Google Ads, check the conversion status (may take up to 24h)
5. For Enhanced Conversions, check the diagnostics report in Google Ads

---

## Important Notes

- The CONVERSION_ID (`AW-XXXXXXXXX`) comes from your Google Ads account under
  Tools > Conversions > your conversion action > Tag setup
- The CONVERSION_LABEL is set dynamically by the frontend code (currently `purchase`)
  but can be overridden in GTM if needed
- Never hardcode Google Ads IDs in the frontend code; they belong in GTM configuration
- Enhanced Conversions data is sent in plain text to GTM which handles hashing
