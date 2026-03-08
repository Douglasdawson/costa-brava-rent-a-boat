// Client-side image mapping for boat data
// Uses real photos from real-photos directory

import solar450Image from "../assets/real-photos/solar-450.jpg";
import remus450Image from "../assets/real-photos/remus-450.jpg";
import astec400Image from "../assets/real-photos/astec-400.jpg";
import astec450Image from "../assets/real-photos/astec-450.jpg";
import mingollaImage from "../assets/real-photos/mingolla.jpg";
import trimarchiImage from "../assets/real-photos/trimarchi.jpg";
import pacificCraftImage from "../assets/real-photos/pacific-craft.jpg";

// Map by boat identifier prefix (case-insensitive) to handle any hash suffix
// This is resilient to image re-uploads from the admin panel
const BOAT_IMAGE_BY_PREFIX: Array<{ pattern: string; image: string }> = [
  { pattern: "SOLAR_450", image: solar450Image },
  { pattern: "REMUS_450", image: remus450Image },
  { pattern: "ASTEC_400", image: astec400Image },
  { pattern: "ASTEC_450", image: astec450Image },
  { pattern: "MINGOLLA", image: mingollaImage },
  { pattern: "TRIMARCHI", image: trimarchiImage },
  { pattern: "PACIFIC_CRAFT", image: pacificCraftImage },
];

// Helper function to resolve boat image path to actual imported image
export function getBoatImage(imagePath: string): string {
  if (!imagePath) return "/placeholder-boat.jpg";

  // Match by prefix (case-insensitive) — handles any hash suffix
  const upper = imagePath.toUpperCase();
  for (const entry of BOAT_IMAGE_BY_PREFIX) {
    if (upper.startsWith(entry.pattern)) {
      return entry.image;
    }
  }

  // If not matched and looks like a filename, construct Object Storage URL
  if (!imagePath.startsWith("http") && !imagePath.startsWith("/")) {
    return `/objects/${imagePath}`;
  }

  // Otherwise return as-is (could be full URL or path already)
  return imagePath;
}

// Map used by the server-side resize endpoint (needs exact filenames)
const IMAGE_PREFIX_TO_FILE: Record<string, string> = {
  SOLAR_450: "solar-450.jpg",
  REMUS_450: "remus-450.jpg",
  ASTEC_400: "astec-400.jpg",
  ASTEC_450: "astec-450.jpg",
  MINGOLLA: "mingolla.jpg",
  TRIMARCHI: "trimarchi.jpg",
  PACIFIC_CRAFT: "pacific-craft.jpg",
};

const SRCSET_WIDTHS = [400, 800, 1200] as const;

/**
 * Generates a srcSet string for responsive images via the server resize endpoint.
 * Resolves DB filenames (with hashes) to actual photo filenames for the resize endpoint.
 * Returns empty string for external URLs or object-storage paths.
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
