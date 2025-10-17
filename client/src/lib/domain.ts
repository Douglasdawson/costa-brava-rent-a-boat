/**
 * Canonical domain configuration for SEO
 * This is the primary domain used for all canonical URLs and redirects
 */

// Canonical domain (always use in production)
export const CANONICAL_DOMAIN = 'costabravarentaboat.app';

// Get the base URL (always canonical domain for SEO)
export function getBaseUrl(): string {
  // Always use canonical domain for SEO consistency
  // This ensures canonical URLs, hreflang, and OG tags always point to production domain
  return `https://${CANONICAL_DOMAIN}`;
}

// Generate canonical URL for a given path
export function getCanonicalUrl(path: string): string {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

// Default Open Graph image
export function getDefaultOgImage(): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/assets/Mediterranean_coastal_hero_scene_8df465c2.png`;
}
