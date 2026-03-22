import type { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

const SUPPORTED_LANGS = ["es", "en", "ca", "fr", "de", "nl", "it", "ru"];

/**
 * Express middleware that serves prerendered HTML files when available.
 *
 * File naming conventions (checked in order):
 *
 *   New subdirectory format:
 *   /es/alquiler-barcos-blanes  => {dir}/es/alquiler-barcos-blanes.html
 *   /fr/location-bateau-blanes  => {dir}/fr/location-bateau-blanes.html
 *   /es/                        => {dir}/es/index.html
 *
 *   Legacy format (backward compat):
 *   /some/path                  => {dir}/some/path.html
 *   /some/path?lang=en          => {dir}/some/path__lang_en.html
 *   /                           => {dir}/index.html
 *   /?lang=fr                   => {dir}/index__lang_fr.html
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
      req.path.startsWith("/admin")
    ) {
      return next();
    }

    // Skip requests for static files (have file extensions)
    if (req.path.match(/\.\w+$/)) {
      return next();
    }

    const parsedUrl = new URL(req.originalUrl, "http://localhost");
    const pathname = parsedUrl.pathname;
    const lang = parsedUrl.searchParams.get("lang");

    // Build candidate file paths (try in order)
    const candidates: string[] = [];

    // 1. New subdirectory format: /es/slug -> es/slug.html, /es/ -> es/index.html
    const adjustedPath = pathname.endsWith("/")
      ? pathname + "index"
      : pathname;
    candidates.push(path.join(prerenderedDir, adjustedPath + ".html"));

    // 2. Legacy format with __lang_ suffix
    const routePath = pathname === "/" ? "/index" : pathname;
    const langSuffix =
      lang && SUPPORTED_LANGS.includes(lang) && lang !== "es"
        ? `__lang_${lang}`
        : "";
    const legacyPath = path.join(prerenderedDir, `${routePath}${langSuffix}.html`);
    if (!candidates.includes(legacyPath)) {
      candidates.push(legacyPath);
    }

    // 3. Fallback: check for __lang_en for English-only pages (no lang param)
    if (!lang) {
      const enFallback = path.join(prerenderedDir, `${routePath}__lang_en.html`);
      if (!candidates.includes(enFallback)) {
        candidates.push(enFallback);
      }
    }

    // Detect effective language for Content-Language header
    function detectLang(filePath: string): string {
      // Check subdirectory format first: prerenderedDir/es/...
      const relative = path.relative(prerenderedDir, filePath);
      const firstSegment = relative.split(path.sep)[0];
      if (SUPPORTED_LANGS.includes(firstSegment)) {
        return firstSegment;
      }
      // Check legacy __lang_ suffix
      const langMatch = filePath.match(/__lang_(\w+)\.html$/);
      if (langMatch && SUPPORTED_LANGS.includes(langMatch[1])) {
        return langMatch[1];
      }
      // Query param
      if (lang && SUPPORTED_LANGS.includes(lang)) {
        return lang;
      }
      return "es";
    }

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        const effectiveLang = detectLang(candidate);

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
