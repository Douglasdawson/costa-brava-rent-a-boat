// Client-side image mapping for boat data
// This file handles WebP imports which are not available on server-side builds

import solar450Image from "../assets/generated_images/SOLAR_450_boat_photo_b70eb7e1.webp";
import remus450Image from "../assets/generated_images/REMUS_450_boat_photo_ec8b926c.webp";
import astec400Image from "../assets/generated_images/ASTEC_400_boat_photo_9dde16a8.webp";
import astec450Image from "../assets/generated_images/ASTEC_450_speedboat_photo_fc9de4ed.webp";
import mingollaImage from "../assets/generated_images/MINGOLLA_BRAVA_19_boat_c0e4a5b5.webp";
import trimarchiImage from "../assets/generated_images/Trimarchi_57S_luxury_boat_0ef0159a.webp";
import pacificCraftImage from "../assets/generated_images/PACIFIC_CRAFT_625_boat_fbe4f4d0.webp";

// Map string paths to imported images
export const BOAT_IMAGE_MAP: { [key: string]: string } = {
  "SOLAR_450_boat_photo_b70eb7e1.png": solar450Image,
  "REMUS_450_boat_photo_ec8b926c.png": remus450Image,
  "ASTEC_400_boat_photo_9dde16a8.png": astec400Image,
  "ASTEC_450_speedboat_photo_fc9de4ed.png": astec450Image,
  "MINGOLLA_BRAVA_19_boat_c0e4a5b5.png": mingollaImage,
  "Trimarchi_57S_luxury_boat_0ef0159a.png": trimarchiImage,
  "PACIFIC_CRAFT_625_boat_fbe4f4d0.png": pacificCraftImage,
};

// Helper function to resolve boat image path to actual imported image
export function getBoatImage(imagePath: string): string {
  return BOAT_IMAGE_MAP[imagePath] || imagePath;
}