import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { serveWithSEO, isValidSPARoute } from "./seoInjector";
import { prerenderedMiddleware } from "./prerenderedMiddleware";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      const parsedUrl = new URL(url, "http://localhost");
      const status = isValidSPARoute(parsedUrl.pathname) ? 200 : 404;
      res.status(status).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Redirect old manifest paths to current one (index.html references /manifest.json)
  app.get(['/site.webmanifest', '/manifest.webmanifest'], (_req, res) => {
    res.redirect(301, '/manifest.json');
  });

  // Force fresh HTML/SW/manifest — prevents stale Service Worker serving old cached HTML
  app.use((req, res, next) => {
    const noCachePaths = ['/', '/index.html', '/sw.js', '/registerSW.js', '/manifest.json'];
    if (noCachePaths.includes(req.path)) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    next();
  });

  // Serve pre-compressed Brotli assets when available (built by vite-plugin-compression)
  app.use("/assets", (req, res, next) => {
    const acceptEncoding = req.headers["accept-encoding"] || "";
    if (!acceptEncoding.includes("br")) return next();

    const brPath = path.join(distPath, "assets", req.path + ".br");
    if (!fs.existsSync(brPath)) return next();

    // Map extension to MIME type
    const ext = path.extname(req.path);
    const mimeTypes: Record<string, string> = {
      ".js": "application/javascript",
      ".css": "text/css",
      ".html": "text/html",
      ".json": "application/json",
      ".svg": "image/svg+xml",
    };
    const contentType = mimeTypes[ext];
    if (!contentType) return next();

    res.setHeader("Content-Encoding", "br");
    res.setHeader("Content-Type", contentType + "; charset=UTF-8");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("CDN-Cache-Control", "public, s-maxage=31536000");
    res.setHeader("Vary", "Accept-Encoding");
    res.sendFile(brPath);
  });

  // Hashed assets get immutable cache (1 year) — express.static handles MIME types reliably
  app.use("/assets", express.static(path.join(distPath, "assets"), {
    etag: true,
    lastModified: true,
    maxAge: "1y",
    immutable: true,
    setHeaders: (res) => {
      res.setHeader("CDN-Cache-Control", "public, s-maxage=31536000");
    },
  }));

  // Serve prerendered HTML when available (BEFORE express.static and SPA catch-all)
  const prerenderedDir = path.resolve(distPath, "..", "prerendered");
  if (fs.existsSync(prerenderedDir)) {
    app.use(prerenderedMiddleware(prerenderedDir));
  }

  app.use(express.static(distPath, {
    etag: true,
    lastModified: true,
  }));

  // fall through to index.html with SSR-lite SEO meta injection
  app.use("*", (req, res) => {
    serveWithSEO(req, res, distPath);
  });
}
