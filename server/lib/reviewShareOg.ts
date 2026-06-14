// Open Graph interstitial for the /resena vanity link.
//
// /resena 302-redirects humans straight to Google Reviews, but a bare 302 to an
// external domain gives social unfurlers (WhatsApp, Facebook, ...) nothing to
// build a link preview from. So when a crawler hits /resena we serve this tiny
// self-contained HTML with OG/Twitter tags instead of redirecting. Humans keep
// the 302 (see server/index.ts).
//
// The crawler can't know the customer's phone, so the language is carried in the
// URL (?l=es|en). The CRM builds that link from the phone prefix
// (reviewShareLangForPhone): +34 -> es, anything else -> en.

import {
  BUSINESS_DISPLAY_NAME,
  GOOGLE_REVIEW_URL,
} from "../../shared/businessProfile";
import { inferLanguageFromPhone } from "../../shared/languageInference";

const BASE_URL = process.env.BASE_URL || "https://www.costabravarentaboat.com";
const OG_IMAGE_URL = `${BASE_URL}/og-image.webp`;

export type ReviewShareLang = "es" | "en";

interface ShareCopy {
  title: string;
  description: string;
  imageAlt: string;
  locale: string;
}

// Binary es/en preview copy. No em dashes, no emojis (design system rules).
const COPY: Record<ReviewShareLang, ShareCopy> = {
  es: {
    title: "Deja tu reseña | Costa Brava Rent a Boat",
    description:
      "¿Disfrutaste tu salida en barco en Blanes? Cuéntanoslo en Google, te lleva menos de un minuto y ayuda a otros navegantes a elegir bien.",
    imageAlt: "Costa Brava Rent a Boat - Alquiler de barcos en Puerto de Blanes",
    locale: "es_ES",
  },
  en: {
    title: "Leave your review | Costa Brava Rent a Boat",
    description:
      "Enjoyed your boat trip in Blanes? Share it on Google. It takes less than a minute and helps other sailors choose well.",
    imageAlt: "Costa Brava Rent a Boat - Boat rental at Blanes Port",
    locale: "en_GB",
  },
};

/**
 * Normalize an arbitrary `?l=` value to a supported preview language. Accepts
 * `unknown` because Express types req.query values as string | ParsedQs |
 * arrays | undefined. Anything that isn't "en" defaults to "es".
 */
export function normalizeReviewShareLang(raw: unknown): ReviewShareLang {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "en" ? "en" : "es";
}

/** Binary preview language from a phone prefix: +34 -> es, otherwise en. */
export function reviewShareLangForPhone(
  phone: string | null | undefined,
): ReviewShareLang {
  return inferLanguageFromPhone(phone) === "es" ? "es" : "en";
}

/** Branded vanity link the CRM shares (humans 302 to Google, crawlers get OG). */
export function buildReviewShareUrl(lang: ReviewShareLang): string {
  return `${BASE_URL}/resena?l=${lang}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Minimal HTML document with OG/Twitter tags for crawlers. Includes a
 * meta-refresh + JS redirect + visible link as a fallback in case a human ever
 * lands here (e.g. a crawler that also renders, or a stale cache).
 */
export function buildReviewShareHtml(lang: ReviewShareLang): string {
  const copy = COPY[lang];
  const canonicalUrl = buildReviewShareUrl(lang);
  const title = escapeHtml(copy.title);
  const description = escapeHtml(copy.description);
  const imageAlt = escapeHtml(copy.imageAlt);
  const siteName = escapeHtml(BUSINESS_DISPLAY_NAME);
  // Redirect target for humans: the actual Google review destination.
  const redirectUrl = GOOGLE_REVIEW_URL;
  const redirectAttr = escapeHtml(redirectUrl);

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonicalUrl}">
<meta name="robots" content="noindex, follow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${siteName}">
<meta property="og:locale" content="${copy.locale}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:image" content="${OG_IMAGE_URL}">
<meta property="og:image:secure_url" content="${OG_IMAGE_URL}">
<meta property="og:image:type" content="image/webp">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${imageAlt}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${OG_IMAGE_URL}">
<meta http-equiv="refresh" content="0; url=${redirectAttr}">
<script>window.location.replace(${JSON.stringify(redirectUrl)});</script>
</head>
<body>
<p><a href="${redirectAttr}">${title}</a></p>
</body>
</html>`;
}
