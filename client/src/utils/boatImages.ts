// Client-side image mapping for boat data
// Uses real photos from real-photos directory

import solar450Image from "../assets/real-photos/solar-450.jpg";
import remus450Image from "../assets/real-photos/remus-450.jpg";
import astec400Image from "../assets/real-photos/astec-400.jpg";
import astec450Image from "../assets/real-photos/astec-450.jpg";
import mingollaImage from "../assets/real-photos/mingolla.jpg";
import trimarchiImage from "../assets/real-photos/trimarchi.jpg";
import pacificCraftImage from "../assets/real-photos/pacific-craft.jpg";

// Map string paths to imported images
export const BOAT_IMAGE_MAP: { [key: string]: string } = {
  "SOLAR_450_boat_photo_b70eb7e1.png": solar450Image,
  "REMUS_450_boat_photo_ec8b926c.png": remus450Image,
  "ASTEC_400_boat_photo_9dde16a8.png": astec400Image,
  "ASTEC_450_boat_photo_77fb7b13.png": astec450Image,
  "ASTEC_450_speedboat_photo_fc9de4ed.png": astec450Image,
  "MINGOLLA_BRAVA_19_boat_c0e4a5b5.png": mingollaImage,
  "Trimarchi_57S_luxury_boat_0ef0159a.png": trimarchiImage,
  "PACIFIC_CRAFT_625_boat_fbe4f4d0.png": pacificCraftImage,
};

// Helper function to resolve boat image path to actual imported image
export function getBoatImage(imagePath: string): string {
  // First, check if it's in the static map
  if (BOAT_IMAGE_MAP[imagePath]) {
    return BOAT_IMAGE_MAP[imagePath];
  }

  // If not in map and looks like a filename, construct Object Storage URL
  if (imagePath && !imagePath.startsWith('http') && !imagePath.startsWith('/')) {
    return `/objects/${imagePath}`;
  }

  // Otherwise return as-is (could be full URL or path already)
  return imagePath;
}

const SRCSET_WIDTHS = [400, 800, 1200] as const;

/**
 * Generates a srcSet string for responsive images via the server resize endpoint.
 * Only handles local static filenames (e.g. "SOLAR_450_boat_photo_b70eb7e1.png").
 * Returns empty string for external URLs or object-storage paths.
 */
export function getBoatImageSrcSet(imagePath: string): string {
  if (!imagePath || imagePath.startsWith("http") || imagePath.startsWith("/")) {
    return "";
  }
  // Normalize extension to .jpg (server files are now .jpg)
  const filename = imagePath.replace(/\.[^.]+$/, ".jpg");
  return SRCSET_WIDTHS
    .map((w) => `/img/resize?file=${encodeURIComponent(filename)}&w=${w} ${w}w`)
    .join(", ");
}
