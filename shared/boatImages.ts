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
