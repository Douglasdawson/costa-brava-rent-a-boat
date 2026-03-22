import { useEffect } from "react";
import { getCanonicalUrl, getDefaultOgImage, getBaseUrl } from "@/lib/domain";
import { useLanguage } from "@/hooks/use-language";
import { resolveSlug, getLocalizedPath, isValidLang } from "@shared/i18n-routes";
import type { PageKey } from "@shared/i18n-routes";
import { HREFLANG_CODES } from "@shared/seoConstants";

// Supported languages for auto-generating hreflang tags
const SUPPORTED_LANGS = ["es", "en", "ca", "fr", "de", "nl", "it", "ru"] as const;

// OG locale codes for each supported language
const OG_LOCALE_MAP: Record<string, string> = {
  es: "es_ES",
  en: "en_GB",
  fr: "fr_FR",
  de: "de_DE",
  nl: "nl_NL",
  it: "it_IT",
  ca: "ca_ES",
  ru: "ru_RU",
};

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  ogTitle?: string;
  ogDescription?: string;
  keywords?: string;
  jsonLd?: object;
  hreflang?: Array<{
    lang: string;
    url: string;
  }>;
}

export function SEO({
  title,
  description,
  canonical = getCanonicalUrl('/'),
  ogImage = getDefaultOgImage(),
  ogType = "website",
  ogTitle,
  ogDescription,
  keywords,
  jsonLd,
  hreflang
}: SEOProps) {
  const { language } = useLanguage();
  // Ensure absolute URLs for images
  const absoluteOgImage = ogImage.startsWith('http') ? ogImage :
    ogImage.startsWith('/') ? `${window.location.origin}${ogImage}` :
    `${window.location.origin}/${ogImage}`;
  useEffect(() => {
    // Update html lang attribute for SPA navigation
    document.documentElement.lang = language;

    // Update title
    document.title = title;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      const newMeta = document.createElement('meta');
      newMeta.name = 'description';
      newMeta.content = description;
      document.head.appendChild(newMeta);
    }

    // Update meta keywords (used by Bing and other search engines)
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute('content', keywords);
      } else {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        metaKeywords.setAttribute('content', keywords);
        document.head.appendChild(metaKeywords);
      }
    }

    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', canonical);
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', canonical);
      document.head.appendChild(canonicalLink);
    }

    // Update Open Graph tags
    const updateOGTag = (property: string, content: string) => {
      let ogTag = document.querySelector(`meta[property="${property}"]`);
      if (ogTag) {
        ogTag.setAttribute('content', content);
      } else {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', property);
        ogTag.setAttribute('content', content);
        document.head.appendChild(ogTag);
      }
    };

    // Detect MIME type from image URL extension
    function getImageMimeType(url: string): string {
      const lower = url.toLowerCase();
      if (lower.endsWith('.webp')) return 'image/webp';
      if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
      if (lower.endsWith('.avif')) return 'image/avif';
      if (lower.endsWith('.gif')) return 'image/gif';
      return 'image/png';
    }

    updateOGTag('og:title', ogTitle || title);
    updateOGTag('og:description', ogDescription || description);
    updateOGTag('og:image', absoluteOgImage);
    updateOGTag('og:image:secure_url', absoluteOgImage);
    updateOGTag('og:image:type', getImageMimeType(absoluteOgImage));
    updateOGTag('og:image:width', '1200');
    updateOGTag('og:image:height', '630');
    updateOGTag('og:image:alt', ogTitle || title);
    updateOGTag('og:type', ogType);
    updateOGTag('og:url', canonical);
    updateOGTag('og:site_name', 'Costa Brava Rent a Boat Blanes');

    // Update Twitter tags (using name attribute, not property)
    const updateTwitterTag = (name: string, content: string) => {
      let twitterTag = document.querySelector(`meta[name="twitter:${name}"]`);
      if (twitterTag) {
        twitterTag.setAttribute('content', content);
      } else {
        twitterTag = document.createElement('meta');
        twitterTag.setAttribute('name', `twitter:${name}`);
        twitterTag.setAttribute('content', content);
        document.head.appendChild(twitterTag);
      }
    };

    updateTwitterTag('card', 'summary_large_image');
    updateTwitterTag('site', '@costabravarentaboat');
    updateTwitterTag('creator', '@costabravarentaboat');
    updateTwitterTag('title', ogTitle || title);
    updateTwitterTag('description', ogDescription || description);
    updateTwitterTag('image', absoluteOgImage);
    updateTwitterTag('image:alt', ogTitle || title);
    updateTwitterTag('url', canonical);

    // Set og:locale for current language
    const currentLocale = OG_LOCALE_MAP[language] || "es_ES";
    updateOGTag('og:locale', currentLocale);

    // Clean up any legacy og:locale:alternate tags (not part of OG standard)
    document.querySelectorAll('meta[property="og:locale:alternate"]').forEach(tag => tag.remove());

    // Add hreflang tags — auto-generate from pathname if not explicitly provided
    // Skip if server already injected (server uses RFC 5646 codes with "-" e.g. "es-ES")
    const existingHreflangTags = document.querySelectorAll('link[rel="alternate"][hreflang]');
    const serverInjected = Array.from(existingHreflangTags).some(
      tag => tag.getAttribute('hreflang')?.includes('-')
    );

    if (!serverInjected) {
      existingHreflangTags.forEach(tag => tag.remove());

      // If explicit hreflang provided (e.g., blog detail with slugByLang), prefer it
      if (hreflang && hreflang.length > 0) {
        hreflang.forEach(({ lang, url }) => {
          const link = document.createElement('link');
          link.rel = 'alternate';
          link.hreflang = lang;
          link.href = url;
          document.head.appendChild(link);
        });
      } else {
        // Auto-generate hreflang from subdirectory URL structure
        const segments = window.location.pathname.split('/').filter(Boolean);
        const pathLang = segments[0] || '';
        const pathSlug = segments[1] || '';
        const dynamicParam = segments[2]; // for /es/blog/my-post or /es/barco/remus-450

        let resolvedPageKey: PageKey | null = null;
        if (pathSlug === '') {
          resolvedPageKey = 'home';
        } else {
          const resolved = resolveSlug(pathSlug);
          resolvedPageKey = resolved?.pageKey ?? null;
        }

        if (resolvedPageKey && isValidLang(pathLang)) {
          const baseUrl = getBaseUrl();

          // Generate hreflang for each supported language
          SUPPORTED_LANGS.forEach(lang => {
            let path = getLocalizedPath(resolvedPageKey as PageKey, lang);
            if (dynamicParam) path += `/${dynamicParam}`;

            const hreflangCode = HREFLANG_CODES[lang] || lang;
            const link = document.createElement('link');
            link.rel = 'alternate';
            link.hreflang = hreflangCode;
            link.href = `${baseUrl}${path}`;
            document.head.appendChild(link);
          });

          // x-default points to Spanish version
          let xDefaultPath = getLocalizedPath(resolvedPageKey as PageKey, 'es');
          if (dynamicParam) xDefaultPath += `/${dynamicParam}`;
          const xDefaultLink = document.createElement('link');
          xDefaultLink.rel = 'alternate';
          xDefaultLink.hreflang = 'x-default';
          xDefaultLink.href = `${baseUrl}${xDefaultPath}`;
          document.head.appendChild(xDefaultLink);
        }
      }
    }

    // Add JSON-LD if provided — skip if server already injected (avoid duplicate schemas)
    let jsonLdScript: HTMLScriptElement | null = null;
    if (jsonLd) {
      // Check if seoInjector already injected server-side JSON-LD (no data-seo-jsonld attribute)
      const serverInjectedJsonLd = document.querySelector('script[type="application/ld+json"]:not([data-seo-jsonld])');

      // Remove existing client-side JSON-LD
      const existingScript = document.querySelector('script[data-seo-jsonld]');
      if (existingScript) {
        existingScript.remove();
      }

      // Only inject client-side if server didn't already provide structured data
      if (!serverInjectedJsonLd) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.type = 'application/ld+json';
        jsonLdScript.setAttribute('data-seo-jsonld', 'true');
        jsonLdScript.textContent = JSON.stringify(jsonLd);
        document.head.appendChild(jsonLdScript);
      }
    }

    // Cleanup function
    return () => {
      if (jsonLdScript && document.head.contains(jsonLdScript)) {
        document.head.removeChild(jsonLdScript);
      }
    };
  }, [title, description, canonical, ogImage, ogType, ogTitle, ogDescription, keywords, jsonLd, hreflang, language]);

  return null;
}