import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import compression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
    // Pre-compress assets with Brotli at build time (10-20% smaller than gzip)
    compression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 1024,
    }),
    // Service worker (Workbox via vite-plugin-pwa).
    //
    // Strategy: precache the app shell + hashed chunks so the license verifier
    // (and the rest of the SPA) abre offline. Runtime caching SOLO para
    // assets estáticos pesados (fonts, imágenes). El API queda explícitamente
    // fuera — el modelo de inquiries necesita red garantizada y los GET de
    // precios/disponibilidad no deben servirse stale.
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      // Don't touch our manifest at /manifest.json — we maintain it manually.
      manifest: false,
      // Honor existing index.html link rel="manifest".
      includeManifestIcons: false,
      workbox: {
        globDirectory: "dist/public",
        globPatterns: [
          "**/*.{js,css,html,woff2}",
          "assets/**/*.{avif,webp,svg}",
        ],
        // Exclude server-injected HTML, sourcemaps, and the manifest itself
        // (manifest is served with no-cache so updates land immediately).
        globIgnores: [
          "**/sw.js",
          "**/registerSW.js",
          "**/workbox-*.js",
          "manifest.json",
          "**/*.map",
        ],
        // SPA fallback for offline navigation — but never hijack API, admin
        // sessions, sitemap, feed, or hashed assets.
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/admin\//,
          /^\/assets\//,
          /^\/sitemap.*\.xml$/,
          /^\/feed\.xml$/,
          /^\/robots\.txt$/,
          /^\/\.well-known\//,
          /^\/llms.*\.txt$/,
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        // 4 MB — our largest chunk (vendor-charts) is below this; raises the
        // default 2 MB cap so precache doesn't silently drop big chunks.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            // Self-hosted fonts (Clash Display + Archivo).
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && url.pathname.startsWith("/fonts/"),
            handler: "CacheFirst",
            options: {
              cacheName: "fonts",
              expiration: {
                maxEntries: 16,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Static images under /images and unhashed assets.
            urlPattern: ({ url, request, sameOrigin }) =>
              sameOrigin &&
              request.destination === "image" &&
              (url.pathname.startsWith("/images/") ||
                url.pathname === "/og-image.webp"),
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // Don't register the SW in dev — avoids confusing HMR + stale chunks.
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/scheduler/")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/@tanstack/")) {
            return "vendor-query";
          }
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) {
            return "vendor-charts";
          }
          if (id.includes("node_modules/framer-motion")) {
            return "vendor-motion";
          }
          if (id.includes("node_modules/date-fns")) {
            return "vendor-date";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }
          if (id.includes("node_modules/zod") || id.includes("node_modules/react-hook-form") || id.includes("node_modules/@hookform/")) {
            return "vendor-form";
          }
          if (id.includes("node_modules/@radix-ui/")) {
            return "vendor-ui";
          }
          if (id.includes("node_modules/@stripe/")) {
            return "vendor-stripe";
          }
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
