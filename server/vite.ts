import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { serveWithSEO, isValidSPARoute } from "./seoInjector";

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

  // Redirect old manifest path to new PWA-generated one
  app.get('/site.webmanifest', (_req, res) => {
    res.redirect(301, '/manifest.webmanifest');
  });

  // Force fresh HTML/SW/manifest — prevents stale Service Worker serving old cached HTML
  app.use((req, res, next) => {
    const noCachePaths = ['/', '/index.html', '/sw.js', '/registerSW.js', '/manifest.webmanifest'];
    if (noCachePaths.includes(req.path)) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    next();
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

  app.use(express.static(distPath, {
    etag: true,
    lastModified: true,
  }));

  // fall through to index.html with SSR-lite SEO meta injection
  app.use("*", (req, res) => {
    serveWithSEO(req, res, distPath);
  });
}
