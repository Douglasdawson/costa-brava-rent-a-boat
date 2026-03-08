import type { Express } from "express";
import sharp from "sharp";
import path from "path";
import fs from "fs";

const IMAGES_DIRS = [
  path.resolve(process.cwd(), "client/src/assets/real-photos"),
  path.resolve(process.cwd(), "client/src/assets/generated_images"),
];

// Map legacy DB filenames (with hashes) to actual photo filenames
const FILENAME_ALIASES: Record<string, string> = {
  "SOLAR_450_boat_photo_b70eb7e1.jpg": "solar-450.jpg",
  "REMUS_450_boat_photo_ec8b926c.jpg": "remus-450.jpg",
  "ASTEC_400_boat_photo_9dde16a8.jpg": "astec-400.jpg",
  "ASTEC_450_boat_photo_77fb7b13.jpg": "astec-450.jpg",
  "ASTEC_450_speedboat_photo_fc9de4ed.jpg": "astec-450.jpg",
  "MINGOLLA_BRAVA_19_boat_c0e4a5b5.jpg": "mingolla.jpg",
  "Trimarchi_57S_luxury_boat_0ef0159a.jpg": "trimarchi.jpg",
  "PACIFIC_CRAFT_625_boat_fbe4f4d0.jpg": "pacific-craft.jpg",
};

// Simple in-memory LRU-like cache
const cache = new Map<string, Buffer>();
const MAX_CACHE_ENTRIES = 100;

export function registerImageResizeRoutes(app: Express) {
  // Route outside /api/ to bypass the general rate limiter
  app.get("/img/resize", async (req, res) => {
    const { file, w, q } = req.query;

    if (!file || typeof file !== "string") {
      return res.status(400).json({ error: "Missing file param" });
    }

    // Sanitize: reject path traversal, allow only plain filenames
    const filename = path.basename(file);
    if (!filename || filename !== file || filename.startsWith(".")) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const width = Math.min(Math.max(parseInt(w as string) || 800, 100), 2000);
    const quality = Math.min(Math.max(parseInt(q as string) || 80, 10), 100);

    const cacheKey = `${filename}:${width}:${quality}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      res.set("Content-Type", "image/webp");
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      return res.send(cached);
    }

    // Resolve alias if the filename matches a legacy DB name
    const resolvedFilename = FILENAME_ALIASES[filename] || filename;

    // Search in both real-photos and generated_images directories
    let filePath = "";
    for (const dir of IMAGES_DIRS) {
      const candidate = path.join(dir, resolvedFilename);
      if (fs.existsSync(candidate)) {
        filePath = candidate;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({ error: "Image not found" });
    }

    try {
      const resized = await sharp(filePath)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();

      // Evict oldest entry if cache is full
      if (cache.size >= MAX_CACHE_ENTRIES) {
        const firstKey = cache.keys().next().value;
        if (firstKey) cache.delete(firstKey);
      }
      cache.set(cacheKey, resized);

      res.set("Content-Type", "image/webp");
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      res.send(resized);
    } catch {
      res.status(500).json({ error: "Failed to process image" });
    }
  });
}
