// Client-side image mapping for boat data
// Uses AI-generated images with consistent Mediterranean perspective

import solar450Image from "../assets/generated_images/SOLAR_450_boat_photo_b70eb7e1.webp";
import remus450Image from "../assets/generated_images/REMUS_450_boat_photo_ec8b926c.webp";
import astec400Image from "../assets/generated_images/ASTEC_400_boat_photo_9dde16a8.webp";
import astec450Image from "../assets/generated_images/ASTEC_450_speedboat_photo_fc9de4ed.webp";
import mingollaImage from "../assets/generated_images/MINGOLLA_BRAVA_19_boat_c0e4a5b5.webp";
import trimarchiImage from "../assets/generated_images/Trimarchi_57S_luxury_boat_0ef0159a.webp";
import pacificCraftImage from "../assets/generated_images/PACIFIC_CRAFT_625_boat_fbe4f4d0.webp";

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

// Map used by the server-side resize endpoint (needs actual filenames)
const IMAGE_PREFIX_TO_FILE: Record<string, string> = {
  SOLAR_450: "SOLAR_450_boat_photo_b70eb7e1.webp",
  REMUS_450: "REMUS_450_boat_photo_ec8b926c.webp",
  ASTEC_400: "ASTEC_400_boat_photo_9dde16a8.webp",
  ASTEC_450: "ASTEC_450_speedboat_photo_fc9de4ed.webp",
  MINGOLLA: "MINGOLLA_BRAVA_19_boat_c0e4a5b5.webp",
  TRIMARCHI: "Trimarchi_57S_luxury_boat_0ef0159a.webp",
  PACIFIC_CRAFT: "PACIFIC_CRAFT_625_boat_fbe4f4d0.webp",
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
