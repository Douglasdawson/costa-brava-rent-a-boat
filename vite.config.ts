import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import compression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

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
    // Only gzip — Replit's CDN handles brotli; dual compression doubles build time
    compression({ algorithm: "gzip", ext: ".gz", threshold: 1024 }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "robots.txt",
        "assets/logo-icon.png",
        "assets/logo-icon-512.png",
      ],
      manifest: {
        name: "Costa Brava Rent a Boat",
        short_name: "CB Boats",
        description: "Alquiler de barcos sin licencia en Blanes, Costa Brava",
        theme_color: "#1a2d40",
        background_color: "#f5f8fc",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/assets/logo-icon.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/assets/logo-icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/assets/logo-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Do not precache source maps
        globIgnores: ["**/*.map"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /\.(?:woff2?|ttf|otf|eot)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "font-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          // Split radix-ui: only Dialog + Tooltip load with homepage (nav/hero);
          // the rest load on demand when their components are rendered.
          "vendor-ui-core": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-tooltip",
          ],
          "vendor-ui-forms": [
            "@radix-ui/react-select",
            "@radix-ui/react-popover",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-label",
            "@radix-ui/react-slider",
            "@radix-ui/react-switch",
          ],
          "vendor-ui-nav": [
            "@radix-ui/react-tabs",
            "@radix-ui/react-accordion",
            "@radix-ui/react-dropdown-menu",
          ],
          "vendor-icons": ["lucide-react", "react-icons"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-charts": ["recharts"],
          "vendor-date": ["date-fns"],
          "vendor-stripe": ["@stripe/stripe-js"],
          "vendor-motion": ["framer-motion"],
          "vendor-form": ["react-hook-form", "@hookform/resolvers", "zod"],
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
