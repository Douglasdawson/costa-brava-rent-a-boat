// Canonical boat image resolution, shared between client and server.
// The DB / static catalog stores legacy filenames like "SOLAR_450_boat_photo_xxx.png";
// the real assets live under /images/boats/<boatId>/...webp. The server uses this
// same resolver when emitting og:image meta tags so that social previews (WhatsApp,
// Facebook, LinkedIn) resolve to the actual boat photo instead of a 404.

export const BOAT_IMAGES: Record<string, string> = {
  "solar-450": "/images/boats/solar-450/alquiler-barco-solar-450-rent-a-boat-costa-brava-blanes-exterior-puerto.webp",
  "remus-450": "/images/boats/remus-450/alquiler-barco-remus-450-rent-a-boat-costa-brava-blanes-exterior-puerto.webp",
  "astec-400": "/images/boats/astec-400/alquiler-barco-astec-400-rent-a-boat-costa-brava-blanes-exterior-puerto.webp",
  "astec-480": "/images/boats/astec-480/alquiler-barco-astec-480-rent-a-boat-costa-brava-blanes-exterior-puerto.webp",
  "mingolla-brava-19": "/images/boats/mingolla/alquiler-barco-mingolla-brava-19-rent-a-boat-costa-brava-blanes-exterior-puerto.webp",
  "trimarchi-57s": "/images/boats/trimarchi/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-exterior-puerto.webp",
  "pacific-craft-625": "/images/boats/pacific-craft/alquiler-barco-pacific-craft-625-rent-a-boat-costa-brava-blanes-exterior-puerto.webp",
  "excursion-privada": "/images/boats/pacific-craft/alquiler-barco-pacific-craft-625-rent-a-boat-costa-brava-blanes-exterior-puerto.webp",
  // Jet ski products resold from partner Jet Ski Blanes (see shared/jetskiProducts.ts).
  "jetski-circuito": "/images/boats/jetski-circuito/jet-ski-circuito-blanes-costa-brava.webp",
  "jetski-excursion-monitor": "/images/boats/jetski-excursion-monitor/jet-ski-excursion-monitor-blanes-tossa.webp",
};

export const BOAT_LEGACY_PREFIX_MAP: Array<{ pattern: string; boatId: string }> = [
  { pattern: "SOLAR_450", boatId: "solar-450" },
  { pattern: "REMUS_450", boatId: "remus-450" },
  { pattern: "ASTEC_400", boatId: "astec-400" },
  { pattern: "ASTEC_480", boatId: "astec-480" },
  { pattern: "ASTEC_450", boatId: "astec-480" },
  { pattern: "MINGOLLA", boatId: "mingolla-brava-19" },
  { pattern: "TRIMARCHI", boatId: "trimarchi-57s" },
  { pattern: "PACIFIC_CRAFT", boatId: "pacific-craft-625" },
];

export const BOAT_IMAGE_WIDTH = 800;
export const BOAT_IMAGE_HEIGHT = 598;

/**
 * Resolve a boat-image identifier (boat id, legacy DB filename, absolute URL, or path)
 * to a canonical `/images/boats/...webp` path. Returns null when the input cannot be
 * mapped — callers decide whether to fall back to a placeholder.
 */
export function resolveBoatImagePath(input: string | null | undefined): string | null {
  if (!input) return null;

  if (BOAT_IMAGES[input]) return BOAT_IMAGES[input];

  const upper = input.toUpperCase();
  for (const entry of BOAT_LEGACY_PREFIX_MAP) {
    if (upper.startsWith(entry.pattern)) {
      return BOAT_IMAGES[entry.boatId] ?? null;
    }
  }

  if (input.startsWith("http") || input.startsWith("/")) return input;

  return null;
}

// Extra photos per boat, in display order (the exterior shot first). The DB `imageGallery`
// column is empty for most boats, so the quick view falls back to these real files.
const GALLERY_FILES: Record<string, { dir: string; slug: string; shots: string[] }> = {
  "solar-450": { dir: "solar-450", slug: "solar-450", shots: ["exterior-puerto", "cubierta-proa", "puerto-blanes"] },
  "remus-450": { dir: "remus-450", slug: "remus-450", shots: ["exterior-puerto", "familia-navegando", "puerto-blanes"] },
  "astec-400": { dir: "astec-400", slug: "astec-400", shots: ["exterior-puerto", "exterior-costa", "proa-solarium", "lateral-blanes"] },
  "astec-480": { dir: "astec-480", slug: "astec-480", shots: ["exterior-puerto", "navegando-costa", "navegando-lateral", "amarrado-puerto"] },
  "mingolla-brava-19": { dir: "mingolla", slug: "mingolla-brava-19", shots: ["exterior-puerto", "solarium-proa", "lateral-navegando", "asiento-mesa", "popa-motor"] },
  "trimarchi-57s": { dir: "trimarchi", slug: "trimarchi-57s", shots: ["exterior-puerto", "proa-aperitivo", "pareja-navegando", "consola-timon", "popa-atardecer", "vista-completa-puerto"] },
  "pacific-craft-625": { dir: "pacific-craft", slug: "pacific-craft-625", shots: ["exterior-puerto", "proa-solarium-cala", "cala-agua-cristalina", "fondeado-bahia", "consola-timon-cala", "asientos-capitan"] },
};
GALLERY_FILES["excursion-privada"] = GALLERY_FILES["pacific-craft-625"];

/** Public paths of the boat's photos (empty when we only have the cover). */
export function getBoatGalleryPaths(boatId: string): string[] {
  const g = GALLERY_FILES[boatId];
  if (!g) return [];
  return g.shots.map(s => `/images/boats/${g.dir}/alquiler-barco-${g.slug}-rent-a-boat-costa-brava-blanes-${s}.webp`);
}
