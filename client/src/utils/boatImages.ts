// Client-side image mapping for boat data.
// Canonical resolution lives in @shared/boatImages so the server's SEO injector
// emits the same URLs in og:image as the client renders in <img>.

import { resolveBoatImagePath } from "@shared/boatImages";

// Helper function to resolve boat image path to actual imported image
export function getBoatImage(imagePath: string): string {
  const resolved = resolveBoatImagePath(imagePath);
  if (resolved) return resolved;

  // Filename-looking input that didn't match any known boat: legacy object-storage fallback
  if (imagePath && !imagePath.startsWith("http") && !imagePath.startsWith("/")) {
    return `/objects/${imagePath}`;
  }

  return "/placeholder-boat.jpg";
}

/**
 * Generate SEO-friendly alt text for a boat image.
 * Varies description by gallery position for better Google Images indexing.
 */
const GALLERY_DESCRIPTORS = [
  "vista principal exterior",
  "interior y equipamiento",
  "navegando en Costa Brava",
  "vista lateral en puerto de Blanes",
  "detalle de la cabina",
  "en el mar Mediterráneo",
  "vista panorámica",
  "equipamiento de navegación",
];

export function getBoatAltText(boatName: string, index?: number): string {
  const base = `Alquiler barco ${boatName} en Blanes, Costa Brava`;
  if (index === undefined || index === 0) {
    return `${base} - ${GALLERY_DESCRIPTORS[0]}`;
  }
  const descriptor = GALLERY_DESCRIPTORS[index % GALLERY_DESCRIPTORS.length];
  return `${base} - ${descriptor}`;
}

// Map used by the server-side resize endpoint (needs actual filenames)
const IMAGE_PREFIX_TO_FILE: Record<string, string> = {
  SOLAR_450: "alquiler-barco-solar-450-rent-a-boat-costa-brava-blanes-exterior-puerto.webp",
  REMUS_450: "alquiler-barco-remus-450-rent-a-boat-costa-brava-blanes-exterior-puerto.webp",
  ASTEC_400: "alquiler-barco-astec-400-rent-a-boat-costa-brava-blanes-exterior-puerto.webp",
  ASTEC_480: "alquiler-barco-astec-480-rent-a-boat-costa-brava-blanes-exterior-puerto.webp",
  ASTEC_450: "alquiler-barco-astec-480-rent-a-boat-costa-brava-blanes-exterior-puerto.webp",
  MINGOLLA: "alquiler-barco-mingolla-brava-19-rent-a-boat-costa-brava-blanes-exterior-puerto.webp",
  TRIMARCHI: "alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-exterior-puerto.webp",
  PACIFIC_CRAFT: "alquiler-barco-pacific-craft-625-rent-a-boat-costa-brava-blanes-exterior-puerto.webp",
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
