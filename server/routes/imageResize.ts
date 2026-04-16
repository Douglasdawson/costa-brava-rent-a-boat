import type { Express } from "express";
import rateLimit from "express-rate-limit";
import sharp from "sharp";
import path from "path";
import fs from "fs";

// Rate limit image resize to prevent CPU-intensive DoS
const imageResizeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 resizes per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many resize requests" },
});

const IMAGES_DIRS = [
  path.resolve(process.cwd(), "client/public/images/boats"),
  path.resolve(process.cwd(), "client/src/assets/real-photos"),
  path.resolve(process.cwd(), "client/src/assets/generated_images"),
];

// Map legacy DB filenames to SEO-friendly filenames in public/images/boats/
const PREFIX_TO_FILE: Array<[string, string]> = [
  ["SOLAR_450", "solar-450/alquiler-barco-solar-450-rent-a-boat-costa-brava-blanes-exterior-puerto.webp"],
  ["REMUS_450", "remus-450/alquiler-barco-remus-450-rent-a-boat-costa-brava-blanes-exterior-puerto.webp"],
  ["ASTEC_400", "astec-400/alquiler-barco-astec-400-rent-a-boat-costa-brava-blanes-exterior-puerto.webp"],
  ["ASTEC_480", "astec-480/alquiler-barco-astec-480-rent-a-boat-costa-brava-blanes-exterior-puerto.webp"],
  ["ASTEC_450", "astec-480/alquiler-barco-astec-480-rent-a-boat-costa-brava-blanes-exterior-puerto.webp"],
  ["MINGOLLA", "mingolla/alquiler-barco-mingolla-brava-19-rent-a-boat-costa-brava-blanes-exterior-puerto.webp"],
  ["TRIMARCHI", "trimarchi/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-exterior-puerto.webp"],
  ["PACIFIC_CRAFT", "pacific-craft/alquiler-barco-pacific-craft-625-rent-a-boat-costa-brava-blanes-exterior-puerto.webp"],
  // SEO filenames map to themselves
  ["alquiler-barco-", ""],
];

function resolveFilename(filename: string): string {
  const upper = filename.toUpperCase();
  for (const [prefix, file] of PREFIX_TO_FILE) {
    if (upper.startsWith(prefix.toUpperCase())) {
      return file || filename; // empty = already SEO name, use as-is
    }
  }
  return filename;
}

// Simple in-memory LRU-like cache
const cache = new Map<string, Buffer>();
const MAX_CACHE_ENTRIES = 500;

export function registerImageResizeRoutes(app: Express) {
  // Route outside /api/ — needs its own rate limiter
  app.get("/img/resize", imageResizeLimiter, async (req, res) => {
    const { file, w, q } = req.query;

    if (!file || typeof file !== "string") {
      return res.status(400).json({ error: "Missing file param" });
    }

    // Sanitize: decode and reject any path traversal attempts
    let decoded: string;
    try {
      decoded = decodeURIComponent(file);
    } catch {
      return res.status(400).json({ error: "Invalid filename" });
    }
    const sanitized = decoded.replace(/\.\./g, "").replace(/\\/g, "/");
    if (!sanitized || sanitized.startsWith(".") || sanitized.startsWith("/")) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const width = Math.min(Math.max(parseInt(w as string) || 800, 100), 2000);
    const quality = Math.min(Math.max(parseInt(q as string) || 80, 10), 100);

    const cacheKey = `${sanitized}:${width}:${quality}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      res.set("Content-Type", "image/webp");
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      return res.send(cached);
    }

    // Resolve DB filename (with hash) to actual photo filename
    const resolvedFilename = resolveFilename(sanitized);

    // Search in image directories — verify resolved path stays within allowed dirs
    let filePath = "";
    for (const dir of IMAGES_DIRS) {
      const candidate = path.resolve(dir, resolvedFilename);
      // Prevent path traversal: resolved path must be inside the allowed directory
      if (!candidate.startsWith(path.resolve(dir) + path.sep) && candidate !== path.resolve(dir)) {
        continue;
      }
      if (fs.existsSync(candidate)) {
        filePath = candidate;
        break;
      }
      // If file is an SEO filename (alquiler-barco-*), try to find it in a subdirectory
      // by extracting the boat model from the filename (e.g. pacific-craft-625 → pacific-craft/)
      if (!filePath && resolvedFilename.startsWith("alquiler-barco-")) {
        const baseName = path.basename(resolvedFilename);
        try {
          const subdirs = fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory());
          for (const subdir of subdirs) {
            const subCandidate = path.resolve(dir, subdir.name, baseName);
            if (fs.existsSync(subCandidate)) {
              filePath = subCandidate;
              break;
            }
          }
        } catch { /* dir doesn't exist or can't read */ }
        if (filePath) break;
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
