import express, { type Express } from "express";
import fs, { existsSync } from "fs";
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

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".css": "text/css",
    ".html": "text/html",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".txt": "text/plain",
    ".xml": "application/xml",
  };
  return types[ext] || "application/octet-stream";
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve pre-compressed Brotli/gzip assets with CDN-ready cache headers
  app.use("/assets", (req, res, next) => {
    const acceptEncoding = req.headers["accept-encoding"] || "";
    const filePath = path.join(distPath, "assets", req.path);

    // CDN-ready cache headers for hashed assets (immutable, 1 year)
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    res.set("CDN-Cache-Control", "public, s-maxage=31536000");
    res.set("Vary", "Accept-Encoding");

    if (acceptEncoding.includes("br") && existsSync(filePath + ".br")) {
      req.url += ".br";
      res.set("Content-Encoding", "br");
      res.set("Content-Type", getContentType(req.path));
    } else if (acceptEncoding.includes("gzip") && existsSync(filePath + ".gz")) {
      req.url += ".gz";
      res.set("Content-Encoding", "gzip");
      res.set("Content-Type", getContentType(req.path));
    }
    next();
  });

  app.use(express.static(distPath, {
    etag: true,
    lastModified: true,
  }));

  // fall through to index.html with SSR-lite SEO meta injection
  app.use("*", (req, res) => {
    serveWithSEO(req, res, distPath);
  });
}
