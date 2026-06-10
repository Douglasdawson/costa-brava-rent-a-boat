/**
 * Playwright-based prerender script for SEO.
 *
 * 1. Starts the production Express server on a random port
 * 2. Launches headless Chromium via Playwright
 * 3. Visits every route x language from the manifest
 * 4. Saves the fully-rendered HTML to dist/prerendered/
 * 5. Kills the server and reports stats
 *
 * Usage: tsx scripts/prerender.ts
 */

import { spawn, type ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import { chromium, type Browser, type BrowserContext } from "playwright";
import { TRANSLATED_STATIC_PATHS } from "../server/seo/translatedStaticPaths";
import { OCCASION_MATRIX_ENABLED, liveMatrixCombos } from "../shared/occasionMatrix";
import { matrixSlug, matrixPath, resolveMatrixSlug } from "../shared/occasionMatrixPage";
import { getLocalizedPath, resolveSlug, type LangCode } from "../shared/i18n-routes";

// ES paths of the launched matrix combos — used to skip them during prerender
// while the matrix is gated off (their routes return 404 until enabled).
const MATRIX_ES_PATHS = new Set(
  liveMatrixCombos().map((c) => `/${matrixSlug(c.occasion.id, c.locationKey, "es")}`),
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StaticRoute {
  path: string;
  langs: string[];
}

interface DynamicRouteConfig {
  apiEndpoint: string;
  pathTemplate: string;
  langs: string[];
}

interface Manifest {
  outputDir: string;
  routes: StaticRoute[];
  dynamicRoutes: Record<string, DynamicRouteConfig>;
  waitForSelector: string;
  networkIdleTimeout: number;
  concurrency: number;
}

interface RenderJob {
  url: string;
  filePath: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = path.resolve(import.meta.dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "scripts", "prerender-manifest.json");

function loadManifest(): Manifest {
  const raw = fs.readFileSync(MANIFEST_PATH, "utf-8");
  return JSON.parse(raw) as Manifest;
}

/**
 * Guarantee that every route declared indexable in TRANSLATED_STATIC_PATHS is
 * prerendered in (at least) every locale it's indexable in.
 *
 * The manifest is the human-curated base — it may prerender extra locales for
 * UX on pages that are noindex outside ES (e.g. /faq at es+en). This union is
 * the durable anti-drift guard: it prevents the silent regression where a route
 * is marked indexable in 8 languages (translatedStaticPaths.ts) but only listed
 * for 1-2 in the manifest, leaving JS-less AI crawlers an empty shell in the
 * other locales. Editing only one of the two files can no longer break it.
 */
function reconcileWithIndexableRoutes(manifest: Manifest): void {
  const byPath = new Map(manifest.routes.map((r) => [r.path, r]));
  for (const [routePath, indexableLangs] of Object.entries(TRANSLATED_STATIC_PATHS)) {
    // Skip matrix routes while the feature is gated off — they 404 until enabled.
    if (!OCCASION_MATRIX_ENABLED && MATRIX_ES_PATHS.has(routePath)) continue;
    const existing = byPath.get(routePath);
    if (!existing) {
      manifest.routes.push({ path: routePath, langs: [...indexableLangs] });
      console.warn(
        `  [reconcile] Added indexable route missing from manifest: ${routePath} [${indexableLangs.join(", ")}]`,
      );
      continue;
    }
    const missing = indexableLangs.filter((l) => !existing.langs.includes(l));
    if (missing.length > 0) {
      existing.langs.push(...missing);
      console.warn(
        `  [reconcile] Expanded ${routePath} with indexable locales: ${missing.join(", ")}`,
      );
    }
  }
}

function randomPort(): number {
  return 5100 + Math.floor(Math.random() * 900); // 5100-5999
}

/**
 * Resolve a manifest route (ES-canonical path, optionally with a dynamic
 * param segment like /barco/{slug}) to its CANONICAL localized URL and the
 * output file the server expects:
 *
 *   ("/", "de")                        → /de/            → {out}/de/index.html
 *   ("/alquiler-barcos-blanes", "de")  → /de/boot-mieten-blanes → {out}/de/boot-mieten-blanes.html
 *   ("/snorkel-blanes", "fr")          → /fr/snorkeling-blanes  → {out}/fr/snorkeling-blanes.html
 *   ("/barco/solar-450", "de")         → /de/boot/solar-450     → {out}/de/boot/solar-450.html
 *
 * This matches what prerenderedMiddleware serves (subdirectory format) AND
 * means Playwright visits the real canonical URL — the previous `?lang=`
 * scheme got 301-redirected by redirectMiddleware and saved files under a
 * legacy naming the server never reads, so prerender was dead in production.
 *
 * Returns null for paths that don't resolve to a known route (the job is
 * skipped with a warning instead of capturing a redirect or 404).
 */
function localizedRoute(
  outputDir: string,
  routePath: string,
  lang: string,
): { url: string; filePath: string; urlPath: string } | null {
  const l = lang as LangCode;
  if (routePath === "/") {
    return {
      urlPath: `/${l}/`,
      url: `/${l}/`,
      filePath: path.join(outputDir, l, "index.html"),
    };
  }
  const parts = routePath.replace(/^\//, "").split("/");
  const resolved = resolveSlug(parts[0]);
  let urlPath: string | null = null;
  if (resolved) {
    const param = parts[1];
    urlPath = getLocalizedPath(resolved.pageKey, l, param ? { slug: param } : undefined);
  } else if (parts.length === 1 && OCCASION_MATRIX_ENABLED) {
    const combo = resolveMatrixSlug(parts[0]);
    if (combo) urlPath = matrixPath(combo.occasion.id, combo.locationKey, l);
  }
  if (!urlPath) return null;
  return {
    urlPath,
    url: urlPath,
    filePath: path.join(outputDir, `${urlPath.replace(/^\//, "")}.html`),
  };
}

/** Wait until the server responds to GET /api/health (up to `timeoutMs`). */
async function waitForServer(baseUrl: string, timeoutMs = 30_000): Promise<void> {
  const start = Date.now();
  const interval = 500;

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) return;
    } catch {
      // server not ready yet
    }
    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error(`Server did not become ready within ${timeoutMs / 1000}s`);
}

/** Start the production server as a child process. */
function startServer(port: number): ChildProcess {
  const serverEntry = path.join(ROOT, "dist", "index.js");
  if (!fs.existsSync(serverEntry)) {
    throw new Error(
      `Production build not found at ${serverEntry}. Run "npm run build" first.`,
    );
  }

  const child = spawn("node", [serverEntry], {
    cwd: ROOT,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  // Forward server output with prefix for debugging
  child.stdout?.on("data", (data: Buffer) => {
    const lines = data.toString().trim().split("\n");
    for (const line of lines) {
      console.log(`  [server] ${line}`);
    }
  });

  child.stderr?.on("data", (data: Buffer) => {
    const lines = data.toString().trim().split("\n");
    for (const line of lines) {
      console.error(`  [server:err] ${line}`);
    }
  });

  return child;
}

/** Fetch slugs from a dynamic route API endpoint. */
async function fetchSlugs(
  baseUrl: string,
  config: DynamicRouteConfig,
): Promise<string[]> {
  try {
    const res = await fetch(`${baseUrl}${config.apiEndpoint}`);
    if (!res.ok) {
      console.warn(
        `  WARN: ${config.apiEndpoint} returned ${res.status}, skipping dynamic route`,
      );
      return [];
    }
    const data: unknown = await res.json();
    const items = Array.isArray(data) ? data : [];
    return items
      .map((item: Record<string, unknown>) => String(item.slug ?? ""))
      .filter(Boolean);
  } catch (err) {
    console.warn(
      `  WARN: Failed to fetch ${config.apiEndpoint}: ${err instanceof Error ? err.message : String(err)}`,
    );
    return [];
  }
}

// ---------------------------------------------------------------------------
// Core rendering
// ---------------------------------------------------------------------------

async function renderPage(
  context: BrowserContext,
  job: RenderJob,
  waitForSelector: string,
): Promise<boolean> {
  const page = await context.newPage();
  try {
    await page.goto(job.url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForSelector(waitForSelector, { timeout: 30_000 });

    // Wait for React to fully render content (lazy components, data fetching)
    await page.waitForTimeout(3000);

    const html = await page.content();

    // Ensure directory exists
    const dir = path.dirname(job.filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(job.filePath, html, "utf-8");

    return true;
  } catch (err) {
    console.error(
      `  FAIL: ${job.label} — ${err instanceof Error ? err.message : String(err)}`,
    );
    return false;
  } finally {
    await page.close();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Prerender: starting ===\n");

  const manifest = loadManifest();
  reconcileWithIndexableRoutes(manifest);
  const port = randomPort();
  const baseUrl = `http://localhost:${port}`;
  const outputDir = path.resolve(ROOT, manifest.outputDir);

  // Clean previous output
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  // 1. Start server
  console.log(`Starting production server on port ${port}...`);
  const serverProcess = startServer(port);

  let browser: Browser | undefined;

  try {
    await waitForServer(baseUrl);
    // Warm up the SPA shell + SEO cache before the first Playwright batch:
    // the very first renders (home pages) used to hit a cold server and time
    // out on waitForSelector while assets compiled/caches filled.
    await fetch(`${baseUrl}/es/`).catch(() => {});
    await fetch(`${baseUrl}/api/boats`).catch(() => {});
    console.log("Server is ready.\n");

    // 2. Build job list — static routes (canonical localized URLs, deduped:
    // manifest entries in different source languages can map to the same
    // localized page, e.g. /boat-rental-blanes[en] ≡ /alquiler-barcos-blanes[en])
    const jobs: RenderJob[] = [];
    const seenFiles = new Set<string>();

    const pushJob = (routePath: string, lang: string) => {
      const route = localizedRoute(outputDir, routePath, lang);
      if (!route) {
        console.warn(`  WARN: cannot localize ${routePath} [${lang}] — unknown slug, skipping`);
        return;
      }
      if (seenFiles.has(route.filePath)) return;
      seenFiles.add(route.filePath);
      jobs.push({
        url: `${baseUrl}${route.url}`,
        filePath: route.filePath,
        label: `${route.urlPath}`,
      });
    };

    for (const route of manifest.routes) {
      for (const lang of route.langs) {
        pushJob(route.path, lang);
      }
    }

    // 3. Build job list — dynamic routes
    for (const [name, config] of Object.entries(manifest.dynamicRoutes)) {
      console.log(`Fetching dynamic slugs for "${name}"...`);
      const slugs = await fetchSlugs(baseUrl, config);
      console.log(`  Found ${slugs.length} slugs for "${name}"`);

      for (const slug of slugs) {
        const routePath = config.pathTemplate.replace("{slug}", slug);
        for (const lang of config.langs) {
          pushJob(routePath, lang);
        }
      }
    }

    console.log(`\nTotal pages to prerender: ${jobs.length}\n`);

    // 4. Launch browser — try multiple Chromium paths
    const chromiumPaths = [
      process.env.PLAYWRIGHT_CHROMIUM_PATH,
      // Common Nix/Replit paths
      "/nix/store/chromium/bin/chromium",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/usr/bin/google-chrome",
    ].filter(Boolean) as string[];

    // First try Playwright's bundled Chromium (installed via npx playwright install)
    try {
      browser = await chromium.launch({ headless: true });
    } catch {
      // Try system-installed Chromium paths
      let launched = false;
      for (const execPath of chromiumPaths) {
        if (fs.existsSync(execPath)) {
          console.log(`  Using system Chromium: ${execPath}`);
          try {
            browser = await chromium.launch({ headless: true, executablePath: execPath });
            launched = true;
            break;
          } catch {
            continue;
          }
        }
      }

      if (!launched) {
        // Try `which chromium` as last resort
        const { execSync } = await import("child_process");
        try {
          const whichPath = execSync("which chromium 2>/dev/null || which chromium-browser 2>/dev/null || which google-chrome 2>/dev/null", { encoding: "utf-8" }).trim();
          if (whichPath) {
            console.log(`  Using Chromium found at: ${whichPath}`);
            browser = await chromium.launch({ headless: true, executablePath: whichPath });
            launched = true;
          }
        } catch {
          // No chromium found anywhere
        }
      }

      if (!launched) {
        console.warn("\nWARN: Chromium not available in this environment — skipping prerender.");
        console.warn("      Prerendered HTML will not be generated; the SPA fallback will be used.");
        console.warn("      Install Chromium or set PLAYWRIGHT_CHROMIUM_PATH to enable prerendering.\n");
        return;
      }
    }

    // 5. Render with concurrency limit
    const concurrency = manifest.concurrency;
    let succeeded = 0;
    let failed = 0;
    let processed = 0;
    const failedJobs: RenderJob[] = [];

    // Process jobs in batches of `concurrency`
    for (let i = 0; i < jobs.length; i += concurrency) {
      const batch = jobs.slice(i, i + concurrency);
      const results = await Promise.all(
        batch.map(async (job) => {
          const context = await browser!.newContext();
          try {
            const ok = await renderPage(context, job, manifest.waitForSelector);
            processed++;
            if (ok) {
              succeeded++;
              console.log(
                `  [${processed}/${jobs.length}] OK: ${job.label}`,
              );
            } else {
              failedJobs.push(job);
            }
            return ok;
          } finally {
            await context.close();
          }
        }),
      );
      // results used implicitly via succeeded/failed counters
      void results;
    }

    // 5b. One sequential retry pass for transient failures (cold-start
    // timeouts hit the very first batch — the home pages, of all things).
    for (const job of failedJobs) {
      const context = await browser!.newContext();
      try {
        const ok = await renderPage(context, job, manifest.waitForSelector);
        if (ok) {
          succeeded++;
          console.log(`  [retry] OK: ${job.label}`);
        } else {
          failed++;
        }
      } finally {
        await context.close();
      }
    }

    // 6. Report
    console.log("\n=== Prerender: complete ===");
    console.log(`  Total:     ${jobs.length}`);
    console.log(`  Succeeded: ${succeeded}`);
    console.log(`  Failed:    ${failed}`);
    console.log(`  Output:    ${outputDir}\n`);

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error(
      `\nFATAL: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exitCode = 1;
  } finally {
    // 7. Cleanup
    if (browser) {
      await browser.close().catch(() => {});
    }
    serverProcess.kill("SIGTERM");
    // Give the server a moment to shut down gracefully
    await new Promise((r) => setTimeout(r, 2000));
    if (!serverProcess.killed) {
      serverProcess.kill("SIGKILL");
    }
  }
}

main();
