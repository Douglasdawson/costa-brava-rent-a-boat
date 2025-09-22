import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  jsonLd?: object;
}

export function SEO({ 
  title, 
  description, 
  canonical = "https://costa-brava-rent-a-boat-blanes.replit.app/",
  ogImage = "https://costa-brava-rent-a-boat-blanes.replit.app/assets/Mediterranean_coastal_hero_scene_8df465c2.png",
  ogType = "website",
  jsonLd 
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

    updateOGTag('og:title', title);
    updateOGTag('og:description', description);
    updateOGTag('og:image', absoluteOgImage);
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
    updateTwitterTag('title', title);
    updateTwitterTag('description', description);
    updateTwitterTag('image', absoluteOgImage);
    updateTwitterTag('url', canonical);

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
  }, [title, description, canonical, ogImage, ogType, jsonLd]);

  return null;
}