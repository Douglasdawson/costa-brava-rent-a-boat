import { useEffect } from "react";
import { getCanonicalUrl, getDefaultOgImage } from "@/lib/domain";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  ogTitle?: string;
  ogDescription?: string;
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
  jsonLd,
  hreflang
}: SEOProps) {
  // Ensure absolute URLs for images
  const absoluteOgImage = ogImage.startsWith('http') ? ogImage : 
    ogImage.startsWith('/') ? `${window.location.origin}${ogImage}` :
    `${window.location.origin}/${ogImage}`;
  useEffect(() => {
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

    updateOGTag('og:title', ogTitle || title);
    updateOGTag('og:description', ogDescription || description);
    updateOGTag('og:image', absoluteOgImage);
    updateOGTag('og:type', ogType);
    updateOGTag('og:url', canonical);
    updateOGTag('og:site_name', 'Costa Brava Rent a Boat Blanes');
    updateOGTag('og:image:alt', ogTitle || title);

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
    updateTwitterTag('title', ogTitle || title);
    updateTwitterTag('description', ogDescription || description);
    updateTwitterTag('image', absoluteOgImage);
    updateTwitterTag('url', canonical);

    // Add hreflang tags if provided
    if (hreflang && hreflang.length > 0) {
      // Remove existing hreflang tags
      const existingHreflangTags = document.querySelectorAll('link[hreflang]');
      existingHreflangTags.forEach(tag => tag.remove());
      
      // Add new hreflang tags
      hreflang.forEach(({ lang, url }) => {
        const hreflangLink = document.createElement('link');
        hreflangLink.rel = 'alternate';
        hreflangLink.hreflang = lang;
        hreflangLink.href = url;
        document.head.appendChild(hreflangLink);
      });
    }

    // Add JSON-LD if provided
    let jsonLdScript: HTMLScriptElement | null = null;
    if (jsonLd) {
      // Remove existing page-specific JSON-LD
      const existingScript = document.querySelector('script[data-seo-jsonld]');
      if (existingScript) {
        existingScript.remove();
      }

      jsonLdScript = document.createElement('script');
      jsonLdScript.type = 'application/ld+json';
      jsonLdScript.setAttribute('data-seo-jsonld', 'true');
      jsonLdScript.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(jsonLdScript);
    }

    // Cleanup function
    return () => {
      if (jsonLdScript && document.head.contains(jsonLdScript)) {
        document.head.removeChild(jsonLdScript);
      }
    };
  }, [title, description, canonical, ogImage, ogType, ogTitle, ogDescription, jsonLd, hreflang]);

  return null;
}