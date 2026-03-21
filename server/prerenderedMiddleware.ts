import type { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

const SUPPORTED_LANGS = ["es", "en", "ca", "fr", "de", "nl", "it", "ru"];

/**
 * Express middleware that serves prerendered HTML files when available.
 *
 * File naming convention:
 *   /some/path        (es, default) => {dir}/some/path.html
 *   /some/path?lang=en              => {dir}/some/path__lang_en.html
 *   /                 (es)          => {dir}/index.html
 *   /?lang=fr                       => {dir}/index__lang_fr.html
 *
 * Falls through to next() when no prerendered file exists, allowing the
 * regular SPA catch-all (serveWithSEO) to handle the request.
 */
export function prerenderedMiddleware(prerenderedDir: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only serve GET requests
    if (req.method !== "GET") return next();

    // Skip paths that should never be prerendered
    if (
      req.path.startsWith("/api/") ||
      req.path.startsWith("/assets/") ||
      req.path.startsWith("/crm") ||
      req.path.startsWith("/admin") ||
      req.path.startsWith("/login")
    ) {
      return next();
    }

    // Skip requests for static files (have file extensions)
    if (req.path.match(/\.\w+$/)) {
      return next();
    }

    const parsedUrl = new URL(req.originalUrl, "http://localhost");
    const routePath = parsedUrl.pathname === "/" ? "/index" : parsedUrl.pathname;
    const lang = parsedUrl.searchParams.get("lang");

    // Build lang suffix: only for non-es supported languages
    const langSuffix =
      lang && SUPPORTED_LANGS.includes(lang) && lang !== "es"
        ? `__lang_${lang}`
        : "";

    const filePath = path.join(prerenderedDir, `${routePath}${langSuffix}.html`);

    // Try exact match first, then fallback to __lang_en for English-only pages
    const candidates = [filePath];
    if (!langSuffix) {
      // No lang param — also check if an English-only prerender exists
      candidates.push(path.join(prerenderedDir, `${routePath}__lang_en.html`));
    }

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        const effectiveLang =
          candidate.includes("__lang_en") ? "en" :
          lang && SUPPORTED_LANGS.includes(lang) ? lang : "es";

        res.set("Content-Type", "text/html; charset=utf-8");
        res.set("Content-Language", effectiveLang);
        res.set(
          "Cache-Control",
          "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
        );
        res.set("X-Prerendered", "true");

        return res.sendFile(path.resolve(candidate));
      }
    }

    next();
  };
}
