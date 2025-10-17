/**
 * Canonical domain configuration for SEO
 * This is the primary domain used for all canonical URLs and redirects
 */

// Canonical domain (always use in production)
export const CANONICAL_DOMAIN = 'costabravarentaboat.app';

// Get the base URL based on environment
export function getBaseUrl(): string {
  // In development, use current origin
  if (import.meta.env.DEV) {
    return window.location.origin;
  }
  
  // In production, always use canonical domain
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
