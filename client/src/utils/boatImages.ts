// Client-side image mapping for boat data
// SEO-friendly filenames: alquiler-barco-{model}-blanes-{n}.webp

const BOAT_IMAGES: Record<string, string> = {
  "solar-450": "/images/boats/solar-450/alquiler-barco-solar-450-blanes-1.webp",
  "remus-450": "/images/boats/remus-450/alquiler-barco-remus-450-blanes-1.webp",
  "astec-400": "/images/boats/astec-400/alquiler-barco-astec-400-blanes-1.webp",
  "astec-480": "/images/boats/astec-480/alquiler-barco-astec-480-blanes-1.webp",
  "mingolla-brava-19": "/images/boats/mingolla/alquiler-barco-mingolla-brava-19-blanes-1.webp",
  "trimarchi-57s": "/images/boats/trimarchi/alquiler-barco-trimarchi-57s-blanes-1.webp",
  "pacific-craft-625": "/images/boats/pacific-craft/alquiler-barco-pacific-craft-625-blanes-1.webp",
};

// Legacy prefix mapping for DB-stored filenames (e.g. "SOLAR_450_boat_photo_xxx.webp")
const LEGACY_PREFIX_MAP: Array<{ pattern: string; boatId: string }> = [
  { pattern: "SOLAR_450", boatId: "solar-450" },
  { pattern: "REMUS_450", boatId: "remus-450" },
  { pattern: "ASTEC_400", boatId: "astec-400" },
  { pattern: "ASTEC_480", boatId: "astec-480" },
  { pattern: "ASTEC_450", boatId: "astec-480" },
  { pattern: "MINGOLLA", boatId: "mingolla-brava-19" },
  { pattern: "TRIMARCHI", boatId: "trimarchi-57s" },
  { pattern: "PACIFIC_CRAFT", boatId: "pacific-craft-625" },
];

// Helper function to resolve boat image path to actual imported image
export function getBoatImage(imagePath: string): string {
  if (!imagePath) return "/placeholder-boat.jpg";

  // Direct match by boat ID
  if (BOAT_IMAGES[imagePath]) return BOAT_IMAGES[imagePath];

  // Match legacy DB filenames by prefix (case-insensitive)
  const upper = imagePath.toUpperCase();
  for (const entry of LEGACY_PREFIX_MAP) {
    if (upper.startsWith(entry.pattern)) {
      return BOAT_IMAGES[entry.boatId] || "/placeholder-boat.jpg";
    }
  }

  // If not matched and looks like a filename, construct Object Storage URL
  if (!imagePath.startsWith("http") && !imagePath.startsWith("/")) {
    return `/objects/${imagePath}`;
  }

  // Otherwise return as-is (could be full URL or path already)
  return imagePath;
}

/**
 * Generate SEO-friendly alt text for a boat image.
 */
export function getBoatAltText(boatName: string, index?: number): string {
  const base = `Alquiler barco ${boatName} en Blanes, Costa Brava`;
  if (index !== undefined && index > 0) {
    return `${base} - foto ${index + 1}`;
  }
  return base;
}

// Map used by the server-side resize endpoint (needs actual filenames)
const IMAGE_PREFIX_TO_FILE: Record<string, string> = {
  SOLAR_450: "alquiler-barco-solar-450-blanes-1.webp",
  REMUS_450: "alquiler-barco-remus-450-blanes-1.webp",
  ASTEC_400: "alquiler-barco-astec-400-blanes-1.webp",
  ASTEC_480: "alquiler-barco-astec-480-blanes-1.webp",
  ASTEC_450: "alquiler-barco-astec-480-blanes-1.webp",
  MINGOLLA: "alquiler-barco-mingolla-brava-19-blanes-1.webp",
  TRIMARCHI: "alquiler-barco-trimarchi-57s-blanes-1.webp",
  PACIFIC_CRAFT: "alquiler-barco-pacific-craft-625-blanes-1.webp",
};

const SRCSET_WIDTHS = [400, 800, 1200] as const;

/**
 * Generates a srcSet string for responsive images via the server resize endpoint.
 */
export function getBoatImageSrcSet(imagePath: string): string {
  if (!imagePath || imagePath.startsWith("http") || imagePath.startsWith("/")) {
    return "";
  }

  // Find the actual file by prefix match
  const upper = imagePath.toUpperCase();
  let filename = "";
  for (const [prefix, file] of Object.entries(IMAGE_PREFIX_TO_FILE)) {
    if (upper.startsWith(prefix)) {
      filename = file;
      break;
    }
  }

  if (!filename) return "";

  return SRCSET_WIDTHS
    .map((w) => `/img/resize?file=${encodeURIComponent(filename)}&w=${w} ${w}w`)
    .join(", ");
}
