// Media URL helpers for arbitrary DB-stored image fields (blog.featuredImage,
// destination.featuredImage, etc.). The legacy code prefixed bare filenames
// with "/object-storage/", which returns 404 in production — so social crawlers
// and the image sitemap got broken URLs. This helper treats a bare filename as
// unresolvable (returns null) and the caller skips the og:image / image tag.

/**
 * Normalize a raw media field to a path or absolute URL the server actually
 * serves. Returns null for bare filenames (legacy "object-storage" prefix
 * never resolved) so callers can skip the tag instead of emitting a 404.
 */
export function resolveMediaPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) return raw;
  return null;
}

/**
 * Resolve to a fully-qualified absolute URL. Returns null when the input
 * cannot be mapped to a real asset.
 */
export function resolveMediaAbsoluteUrl(
  raw: string | null | undefined,
  baseUrl: string,
): string | null {
  const resolved = resolveMediaPath(raw);
  if (!resolved) return null;
  return resolved.startsWith("http") ? resolved : `${baseUrl}${resolved}`;
}
