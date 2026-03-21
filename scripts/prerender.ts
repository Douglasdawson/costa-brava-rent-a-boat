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

function randomPort(): number {
  return 5100 + Math.floor(Math.random() * 900); // 5100-5999
}

/** Resolve the output file path for a given route + language. */
function resolveFilePath(outputDir: string, routePath: string, lang: string): string {
  // Root path => index
  const normalised = routePath === "/" ? "/index" : routePath;
  const langSuffix = lang !== "es" ? `__lang_${lang}` : "";
  return path.join(outputDir, `${normalised}${langSuffix}.html`);
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
    await page.goto(job.url, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForSelector(waitForSelector, { timeout: 10_000 });

    // Small extra wait to let lazy images / animations settle
    await page.waitForTimeout(500);

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
    console.log("Server is ready.\n");

    // 2. Build job list — static routes
    const jobs: RenderJob[] = [];

    for (const route of manifest.routes) {
      for (const lang of route.langs) {
        const langQuery = lang !== "es" ? `?lang=${lang}` : "";
        jobs.push({
          url: `${baseUrl}${route.path}${langQuery}`,
          filePath: resolveFilePath(outputDir, route.path, lang),
          label: `${route.path} [${lang}]`,
        });
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
          const langQuery = lang !== "es" ? `?lang=${lang}` : "";
          jobs.push({
            url: `${baseUrl}${routePath}${langQuery}`,
            filePath: resolveFilePath(outputDir, routePath, lang),
            label: `${routePath} [${lang}]`,
          });
        }
      }
    }

    console.log(`\nTotal pages to prerender: ${jobs.length}\n`);

    // 4. Launch browser
    browser = await chromium.launch({ headless: true });

    // 5. Render with concurrency limit
    const concurrency = manifest.concurrency;
    let succeeded = 0;
    let failed = 0;
    let processed = 0;

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
              failed++;
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
