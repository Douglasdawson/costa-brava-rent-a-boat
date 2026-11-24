// Sitemap <lastmod> dates that cannot be derived from the DB (no `updated_at` on `boats`,
// static landings have no timestamp). Bump BY HAND when the content of that page changes:
// Google only trusts lastmod if it moves with real edits.

/** subir a mano al cambiar el contenido de las fichas de barco */
export const BOAT_PAGES_LASTMOD = "2026-11-24";

/** Landings del segmento con licencia: subir a mano al cambiar su contenido. */
export const LICENSED_LANDING_LASTMOD = "2026-11-24";
export const CAPTAINED_LANDING_LASTMOD = "2026-11-24";
export const TITULIN_PILLAR_LASTMOD = "2026-11-24";
export const TOSSA_LANDING_LASTMOD = "2026-11-24";
