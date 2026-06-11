import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import https from "https";
import http from "http";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { registerHealthRoutes } from "./routes/health";
import { setupVite, serveStatic, log } from "./vite";
import * as Sentry from "@sentry/node";
import { randomUUID } from "crypto";
import { config, isDev } from "./config";
import { SUPPORTED_LANGUAGES } from "../shared/seoConstants";
import { isValidLang } from "../shared/i18n-routes";
import { errorHandler, AppError } from "./middleware/errorHandler";
import { csrfProtection } from "./middleware/csrf";
import { aiBotLoggerMiddleware } from "./lib/aiBotLogger";
import { aiBotRateLimitMiddleware } from "./lib/aiBotRateLimit";
import { stopScheduler } from "./services/schedulerService";
import { startSeoWorker, stopSeoWorker } from "./seo/worker";
import { emailQueue, whatsappQueue } from "./lib/retryQueue";
import { pool } from "./db";

// Enable HTTP keep-alive globally for external API connections (Stripe, Twilio, OpenAI, etc.)
// Reduces TLS handshake overhead on repeated requests to the same hosts
https.globalAgent.maxSockets = 10;
(https.globalAgent as unknown as { keepAlive: boolean }).keepAlive = true;

// Extend Express Request with requestId
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

const app = express();

// Request ID tracking — assigns a unique ID to each request
app.use((req: Request, _res: Response, next: NextFunction) => {
  req.requestId = (req.headers["x-request-id"] as string) || randomUUID();
  _res.setHeader("X-Request-Id", req.requestId);
  next();
});

// Trust proxies so Express uses real client IP from X-Forwarded-For
// Set to 2 for Cloudflare + Replit proxy chain; was 1 before Cloudflare
// This must be set before any rate-limiting middleware
app.set('trust proxy', 2);

// ── Health check routes — registered FIRST, before CORS/rate-limiting ────────
// Deployment platforms (Cloud Run, Replit autoscale) probe these endpoints
// WITHOUT an Origin header. They must be reachable before any middleware runs.
registerHealthRoutes(app);

// Sentry error monitoring — only active when SENTRY_DSN is set
if (config.SENTRY_DSN) {
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: isDev ? "development" : "production",
    tracesSampleRate: isDev ? 1.0 : 0.2,
  });
}

// Cookie parser — required for HttpOnly admin auth cookies
app.use(cookieParser());

// AI bot visit logger — records every hit from GPTBot/ClaudeBot/PerplexityBot
// to the ai_bot_visits table. Fire-and-forget; never blocks the request.
// Mounted before the rate limiter so we still capture aggressive scrapers
// that get throttled (the 429 statusCode is also written to the table).
app.use(aiBotLoggerMiddleware);

// Selective per-tier rate limit for AI crawlers. Generous for OpenAI /
// Anthropic / Google-Extended / Perplexity (the engines that drive citations
// to us). Tight for Bytespider / Amazonbot / CCBot etc. Human traffic is
// passed through untouched. Allowlist for /robots.txt, /sitemap*.xml,
// /llms.txt, /openapi.json so discovery files are always reachable.
app.use(aiBotRateLimitMiddleware);

// Security headers (disabled in development — CSP blocks HTTP localhost)
if (!isDev) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Note: 'unsafe-inline' required by GTM; 'unsafe-eval' removed — monitor for issues
        scriptSrc: ["'self'", "'unsafe-inline'", "data:", "https://www.googletagmanager.com", "https://www.google-analytics.com", "https://googletagmanager.com", "https://js.stripe.com", "https://connect.facebook.net", "https://www.googleadservices.com", "https://googleads.g.doubleclick.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://storage.googleapis.com", "https://www.google-analytics.com", "https://region1.google-analytics.com", "https://www.googletagmanager.com", "https://api.stripe.com", "https://www.facebook.com", "https://connect.facebook.net", "https://www.googleadservices.com", "https://googleads.g.doubleclick.net", "https://www.google.com", "https://pagead2.googlesyndication.com", "wss:"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://www.googletagmanager.com", "https://www.facebook.com", "https://www.google.com"],
      }
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginEmbedderPolicy: false,
    xFrameOptions: { action: "deny" }, // Prevent clickjacking — no framing allowed
    hidePoweredBy: true, // Don't leak Express version
    strictTransportSecurity: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },
  }));
}

// Rate limiting. Skipped in development so HMR + reloads + screenshot tooling
// don't trip the 100 req / 15 min ceiling during normal dev workflow.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
  message: { message: "Demasiadas peticiones. Intenta de nuevo en unos minutos." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
  message: { message: "Demasiados intentos de login. Intenta de nuevo en 15 minutos." },
});

// Admin panel limiter (300 req / 15 min)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
  message: { message: "Demasiadas peticiones al panel de administración. Intenta de nuevo en unos minutos." },
});

// Quote endpoint: up to 20 quotes per minute
const quoteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes de cotización. Espera un momento antes de intentarlo de nuevo." },
});

// Payment endpoints: up to 10 per 15 min (prevent abuse)
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes de pago. Intenta de nuevo en unos minutos." },
});

// Data export/bulk endpoints — stricter rate limit (30 req / 15 min)
const dataExportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes de datos. Intenta de nuevo en unos minutos." },
});

app.use("/api/", generalLimiter);
app.use("/api/admin/", adminLimiter);
app.use("/api/admin/customers", dataExportLimiter);
app.use("/api/admin/customers/export", dataExportLimiter);
app.use("/api/admin/login", authLimiter);
app.use("/api/admin/login-user", authLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/quote", quoteLimiter);
app.use("/api/create-payment-intent", paymentLimiter);
app.use("/api/create-checkout-session", paymentLimiter);

// CORS — strict origin enforcement for API routes
// Webhooks (Stripe, Meta) are exempt because they are server-to-server with their own auth
const allowedOrigins = isDev
  ? ['http://localhost:5000', 'http://localhost:3000', 'http://localhost:4000', 'http://127.0.0.1:5000']
  : ['https://www.costabravarentaboat.com', 'https://costabravarentaboat.com'];

// Returns true when the origin should be allowed through CORS.
// In addition to explicit allowed origins, we allow all Replit-hosted domains
// so the app works both on the canonical domain and on *.replit.app preview URLs.
function isOriginAllowed(origin: string): boolean {
  if (allowedOrigins.includes(origin)) return true;
  // Replit preview / deployment domains
  if (
    origin.endsWith('.replit.app') ||
    origin.endsWith('.replit.dev') ||
    origin.endsWith('.kirk.replit.dev')
  ) return true;
  return false;
}

// NOTE: when mounted at '/api/', Express strips that prefix from req.path.
// So '/api/health' becomes '/health' inside this middleware. We include both
// forms to be safe, and also check req.originalUrl for absolute matching.
const corsExemptPaths = [
  '/api/stripe-webhook', '/stripe-webhook',
  '/api/meta-whatsapp/webhook', '/meta-whatsapp/webhook',
  '/api/health', '/health',
  '/api/health/live', '/health/live',
];

app.use('/api/', (req: Request, res: Response, next: NextFunction) => {
  // Skip CORS for webhook and health endpoints
  if (
    corsExemptPaths.some(p => req.path === p || req.path.startsWith(p + '/')) ||
    corsExemptPaths.some(p => req.originalUrl === p || req.originalUrl.startsWith(p + '/') || req.originalUrl.startsWith(p + '?'))
  ) {
    return next();
  }

  const origin = req.headers.origin as string | undefined;

  // No Origin header = same-origin request (browser omits Origin for same-origin GETs).
  // Let it through — CSRF protection middleware handles state-changing methods separately.
  if (!origin) {
    return next();
  }

  // Same-origin requests are always allowed: browsers attach an Origin header
  // to all POSTs (e.g. navigator.sendBeacon to /api/cwv-beacon), and rejecting
  // them when the dev server runs on a non-listed port (PORT=5181) produced
  // spurious 403s. Origin host matching the request Host is not a CORS case.
  let isSameOrigin = false;
  try {
    isSameOrigin = new URL(origin).host === req.headers.host;
  } catch {
    // malformed Origin header — fall through to the allowlist check
  }

  if (!isSameOrigin && !isOriginAllowed(origin)) {
    res.status(403).json({ message: 'Forbidden: origin not allowed' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-Slug, X-Session-Id');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Enable weak ETag for CDN-friendly caching (strong ETags can break with compression proxies)
app.set('etag', 'weak');

// Optimize JSON parsing — skip for Stripe webhook (needs raw body for signature verification)
// Meta WhatsApp webhook also needs raw body for X-Hub-Signature-256 verification
const rawBodyPaths = ['/api/stripe-webhook', '/api/meta-whatsapp/webhook'];
app.use((req: Request, res: Response, next: NextFunction) => {
  if (rawBodyPaths.includes(req.path)) {
    return next();
  }
  express.json({ limit: '1mb' })(req, res, next);
});
app.use((req: Request, res: Response, next: NextFunction) => {
  if (rawBodyPaths.includes(req.path)) {
    return next();
  }
  express.urlencoded({ extended: false, limit: '1mb' })(req, res, next);
});

app.use(compression({
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Always compress JSON API responses regardless of Content-Type detection
    if (req.path.startsWith('/api')) {
      return true;
    }
    // Ensure SVGs get compressed (they're XML text, highly compressible)
    const ct = String(res.getHeader('content-type') || '');
    if (ct.includes('image/svg+xml')) {
      return true;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024, // Only compress responses larger than 1KB
}));

// CSRF protection — validates Origin/Referer for cookie-based auth (state-changing requests)
app.use(csrfProtection);

// Canonical domain redirection middleware (SEO)
// Force all traffic to HTTPS www.costabravarentaboat.com
// Redirects non-www and .app domain to the canonical www domain.
app.use((req: Request, res: Response, next: NextFunction) => {
  const host = req.hostname;
  const canonicalDomain = 'www.costabravarentaboat.com';

  // Skip in development (localhost) and Replit preview/deployment domains
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.includes('.replit.dev') ||
    host.includes('.replit.app') ||
    host.includes('.kirk.replit.dev')
  ) {
    return next();
  }

  // Check if request is secure (handles trust proxy and X-Forwarded-Proto)
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

  const isCanonicalHost = host === canonicalDomain;

  // Language subdomain redirect: en.costabravarentaboat.com → www.../en/
  // Maps old Wix-era language subdomains to the canonical /:lang/ path structure
  const langSubdomainMatch = host.match(/^(en|fr|de|nl|it|ru|ca)\.costabravarentaboat\.com$/);
  if (langSubdomainMatch) {
    const lang = langSubdomainMatch[1];
    const path = req.originalUrl === '/' ? '' : req.originalUrl;
    const canonicalUrl = `https://${canonicalDomain}/${lang}${path}`;
    return res.redirect(301, canonicalUrl);
  }

  // Redirect if host is not canonical OR not HTTPS
  if (!isCanonicalHost || !isSecure) {
    const canonicalUrl = `https://${canonicalDomain}${req.originalUrl}`;
    return res.redirect(301, canonicalUrl);
  }

  next();
});

// Sensitive field names to redact from API response logs
const SENSITIVE_FIELDS = new Set(["email", "phone", "phoneNumber", "phonePrefix", "pin", "password", "passwordHash", "token", "refreshToken", "accessToken", "secret"]);

function redactSensitive(obj: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key)) {
      redacted[key] = "[REDACTED]";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      redacted[key] = redactSensitive(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `[${req.requestId?.slice(0, 8)}] ${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const safe = typeof capturedJsonResponse === "object" && capturedJsonResponse !== null
          ? redactSensitive(capturedJsonResponse as Record<string, unknown>)
          : capturedJsonResponse;
        logLine += ` :: ${JSON.stringify(safe)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Request timeout — prevent long-running requests from hanging
app.use((req: Request, res: Response, next: NextFunction) => {
  const isUpload = req.path.startsWith('/api/admin/gallery');
  const isWebhook = req.path === '/api/stripe-webhook' || req.path === '/api/meta-whatsapp/webhook';
  if (isWebhook) return next();
  const timeout = isUpload ? 60000 : 30000;
  req.setTimeout(timeout);
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ message: "Request timeout" });
    }
  }, timeout);
  res.on('finish', () => clearTimeout(timer));
  next();
});

(async () => {
  // ── STEP 1: Create HTTP server and start listening immediately ───────────────────
  // Health routes are already registered above (before CORS/rate-limiting).
  // The server is now accepting connections. /api/health returns 200 right away.
  // All other routes will be registered asynchronously below.
  const port = config.PORT;
  const httpServer = http.createServer(app);

  await new Promise<void>((resolve) => {
    httpServer.listen({ port, host: "0.0.0.0" }, () => {
      log(`serving on port ${port}`);
      resolve();
    });
  });

  // ── STEP 2.5: Idempotent analytics schema sync ───────────────────────────────────
  // Re-applies migrations/0007_unblock_analytics.sql on every boot. Safe to skip
  // on failure — core booking flow doesn't depend on analytics tables. Tracks
  // diagnostic data for the schema-revert investigation (see memory:
  // project_seo_engine_schema_revert.md).
  try {
    const { applyAnalyticsUnblock } = await import("./migrations/applyAnalyticsUnblock");
    const result = await applyAnalyticsUnblock(pool);
    if (result.applied) {
      log(`[migrations] analytics schema sync OK in ${result.durationMs}ms`);
    } else if (result.error === "lock-held-by-other-instance") {
      log(`[migrations] analytics schema sync skipped (another instance holds lock)`);
    } else {
      log(`[migrations] analytics schema sync FAILED: ${result.error}`);
    }
  } catch (err) {
    log(`[migrations] applyAnalyticsUnblock loader threw: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── STEP 2.6: Idempotent pricing_overrides schema sync ───────────────────────────
  // Re-applies migrations/0008_pricing_overrides.sql on every boot. Same root
  // cause as the analytics sync above: Replit Republish wipes tables added to
  // shared/schema.ts after the last full Publish. Without this, the dynamic
  // pricing CRM tab returns 500 after each redeploy until a manual SQL fix.
  try {
    const { applyPricingOverridesEnsure } = await import("./migrations/applyPricingOverridesEnsure");
    const result = await applyPricingOverridesEnsure(pool);
    if (result.applied) {
      log(`[migrations] pricing_overrides schema sync OK in ${result.durationMs}ms`);
    } else if (result.error === "lock-held-by-other-instance") {
      log(`[migrations] pricing_overrides schema sync skipped (another instance holds lock)`);
    } else {
      log(`[migrations] pricing_overrides schema sync FAILED: ${result.error}`);
    }
  } catch (err) {
    log(`[migrations] applyPricingOverridesEnsure loader threw: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── STEP 2.7: Idempotent seo_url_inspections schema sync ─────────────────────────
  // Re-applies migrations/0009_seo_url_inspections.sql on every boot. Same
  // Replit Republish bug as 2.6 — without this, /api/admin/seo/coverage and
  // /api/admin/seo/coverage/refresh return 500 after every redeploy.
  try {
    const { applySeoUrlInspectionsEnsure } = await import("./migrations/applySeoUrlInspectionsEnsure");
    const result = await applySeoUrlInspectionsEnsure(pool);
    if (result.applied) {
      log(`[migrations] seo_url_inspections schema sync OK in ${result.durationMs}ms`);
    } else if (result.error === "lock-held-by-other-instance") {
      log(`[migrations] seo_url_inspections schema sync skipped (another instance holds lock)`);
    } else {
      log(`[migrations] seo_url_inspections schema sync FAILED: ${result.error}`);
    }
  } catch (err) {
    log(`[migrations] applySeoUrlInspectionsEnsure loader threw: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── STEP 2.8: Idempotent ai_bot_visits schema sync ──────────────────────────────
  // Re-applies migrations/0010_ai_bot_visits.sql on every boot. Same Replit
  // Republish bug as 2.6 / 2.7 — without this, the aiBotLogger middleware
  // logs an insert error on every LLM crawler hit and /api/admin/seo/bot-visits
  // returns empty arrays until a manual db:push.
  try {
    const { applyAiBotVisitsEnsure } = await import("./migrations/applyAiBotVisitsEnsure");
    const result = await applyAiBotVisitsEnsure(pool);
    if (result.applied) {
      log(`[migrations] ai_bot_visits schema sync OK in ${result.durationMs}ms`);
    } else if (result.error === "lock-held-by-other-instance") {
      log(`[migrations] ai_bot_visits schema sync skipped (another instance holds lock)`);
    } else {
      log(`[migrations] ai_bot_visits schema sync FAILED: ${result.error}`);
    }
  } catch (err) {
    log(`[migrations] applyAiBotVisitsEnsure loader threw: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── STEP 2.8.1: ai_bot_visits self-test ─────────────────────────────────────────
  // After the schema sync, insert a probe row and clean it up. Confirms the
  // runtime db pool can write to the same table that just got migrated —
  // catches divergence between drizzle-kit / migration pool and runtime pool,
  // wrong DATABASE_URL, missing INSERT permission, etc. Output appears once
  // per boot in Replit logs as either:
  //   [boot] ai_bot_visits self-test OK in Xms
  //   [boot] ai_bot_visits self-test FAILED: <error + stack>
  try {
    const { selfTestAiBotVisits } = await import("./storage/aiBotVisits");
    const result = await selfTestAiBotVisits();
    if (result.ok) {
      log(`[boot] ai_bot_visits self-test OK in ${result.durationMs}ms`);
    } else {
      log(`[boot] ai_bot_visits self-test FAILED: ${result.error}`);
    }
  } catch (err) {
    log(`[boot] ai_bot_visits self-test loader threw: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── STEP 2.9: Idempotent boats canonical row seed ───────────────────────────────
  // Re-seeds any missing boat row from shared/boatData.ts on every boot.
  // Same Replit Republish pattern as 2.6/2.7/2.8, but for DML rather than DDL:
  // the boats table survives, individual canonical rows do not. Most recently
  // `excursion-privada` disappeared and the captained-trip option vanished from
  // the public fleet. ON CONFLICT DO NOTHING — never overwrites admin edits.
  try {
    const { applyBoatsSeedEnsure } = await import("./migrations/applyBoatsSeedEnsure");
    const result = await applyBoatsSeedEnsure(pool);
    if (result.applied) {
      log(`[migrations] boats seed ensure OK in ${result.durationMs}ms — inserted ${result.inserted} canonical row(s)`);
    } else if (result.error === "lock-held-by-other-instance") {
      log(`[migrations] boats seed ensure skipped (another instance holds lock)`);
    } else {
      log(`[migrations] boats seed ensure FAILED: ${result.error}`);
    }
  } catch (err) {
    log(`[migrations] applyBoatsSeedEnsure loader threw: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Auto-backfill analytics tables if empty (every Republish wipes them, see
  // project_seo_engine_schema_revert.md). Fire-and-forget — does not block
  // boot or registerRoutes. Single-instance via pg_advisory_lock so multiple
  // Autoscale workers don't all hammer the Google APIs in parallel.
  void (async () => {
    try {
      const { autoBackfillAnalytics } = await import("./migrations/autoBackfillAnalytics");
      const result = await autoBackfillAnalytics(pool);
      if (result.triggered) {
        log(`[auto-backfill] OK in ${result.durationMs}ms — gsc:${JSON.stringify(result.results?.gsc)} ga4Daily:${JSON.stringify(result.results?.ga4Daily)} ga4Conv:${JSON.stringify(result.results?.ga4Conversions)}`);
      } else {
        log(`[auto-backfill] skipped (${result.reason}) in ${result.durationMs}ms`);
      }
    } catch (err) {
      log(`[auto-backfill] threw: ${err instanceof Error ? err.message : String(err)}`);
    }
  })();

  // ── STEP 3: Full async initialization (server already responding) ────────────────
  // registerRoutes now: setupAuth is fire-and-forget, WhatsApp is fire-and-forget.
  // All synchronous route registrations happen immediately.
  await registerRoutes(app, httpServer);

  // Dynamic 301 redirects (managed via DB, seeded after listen)
  const { redirectMiddleware, seedLegacyRedirects } = await import("./seo/redirects");
  app.use(redirectMiddleware());

  // Root redirect — language-negotiated for humans, consolidated 301 for bots.
  //
  // GSC 2026-05-28: the bare root `/` and `/es/` cannibalized each other for head
  // terms ("alquiler barco costa brava" ranked at `/` pos 3.4 AND `/es/` pos 9.8).
  // To consolidate, crawlers must always see a permanent 301 to /es/ (our
  // x-default + primary market) so the root's authority collapses into /es/.
  //
  // BUT a blanket 301 to /es/ also pinned every *human* to Spanish: the client
  // reads language from the URL path before navigator.language, so a German
  // visitor entering the homepage stayed in Spanish (lost conversion in a target
  // market). Fix: negotiate Accept-Language for real browsers only. Bots keep the
  // 301 -> /es/ so SEO consolidation is untouched; humans get a 302 to their
  // language home. Respects an explicit cookie preference first.
  const { isCrawler } = await import("./seo/constants");
  app.get("/", (req, res) => {
    res.set("Vary", "Accept-Language, Cookie, User-Agent");

    // Preserve the query string on human redirects so paid-campaign attribution
    // (utm_*, gclid, fbclid, affiliate codes) survives the hop to /{lang}/.
    // Bots get a clean /es/ so the consolidated canonical stays parameter-free.
    const qIdx = req.url.indexOf("?");
    const qs = qIdx >= 0 ? req.url.slice(qIdx) : "";

    // 1. Explicit prior choice wins (set by the language selector / autodetect).
    const cookieLang = req.cookies?.["costa-brava-language"];
    if (typeof cookieLang === "string" && isValidLang(cookieLang)) {
      res.set("Cache-Control", "private, no-store");
      return res.redirect(302, `/${cookieLang}/${qs}`);
    }

    // 2. Crawlers (search + social + AI) always get the consolidated canonical.
    if (isCrawler(req.headers["user-agent"])) {
      res.set("Cache-Control", "public, max-age=86400");
      return res.redirect(301, "/es/");
    }

    // 3. Human, no preference: negotiate by Accept-Language (respects q-values).
    const best = req.acceptsLanguages([...SUPPORTED_LANGUAGES]);
    if (best && isValidLang(best) && best !== "es") {
      res.set("Cache-Control", "private, no-store");
      return res.redirect(302, `/${best}/${qs}`);
    }

    // 4. Spanish or no match -> x-default home.
    res.set("Cache-Control", "private, no-store");
    return res.redirect(301, `/es/${qs}`);
  });

  // 404 handler for unknown API routes
  app.all("/api/*", (_req: Request, res: Response) => {
    res.status(404).json({ message: "Endpoint no encontrado" });
  });

  // Sentry Express error handler — must be before our custom errorHandler
  if (config.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
  }

  // Global error handler (centralized in middleware/errorHandler.ts)
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, httpServer);
  } else {
    // Add Cache-Control + CDN headers for production static assets
    app.use((req, res, next) => {
      const p = req.path;

      // Vite-hashed assets in /assets/ — immutable, cache for 1 year (browser + CDN)
      if (p.startsWith('/assets/') && p.match(/\.(js|css|woff2?|ttf|eot|otf|svg|png|jpg|jpeg|gif|webp|avif|map)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('CDN-Cache-Control', 'public, s-maxage=31536000');
        res.setHeader('Vary', 'Accept-Encoding');
      }
      // Media + fonts outside /assets (images, hero video, woff2) — these
      // files only change when the asset itself is replaced; 30 days + SWR
      // (they were falling through with max-age=0: load audit 2026-06-11, A1)
      else if (p.match(/\.(webp|avif|woff2|mp4|jpeg|gif)$/) && !p.startsWith('/api')) {
        res.setHeader('Cache-Control', 'public, max-age=2592000, stale-while-revalidate=604800');
      }
      // Other static assets (favicon, robots.txt, manifest, etc.) — cache 1 day, revalidate
      else if (p.match(/\.(ico|txt|xml|json|webmanifest|png|jpg|svg)$/) && !p.startsWith('/api')) {
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      }
      // HTML files and SPA routes — short cache, CDN caches for 1 hour with stale-while-revalidate
      else if (p.match(/\.html$/) || p === '/') {
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
      }

      next();
    });

    serveStatic(app);
  }

  // ── STEP 4: Background tasks (after full initialization) ─────────────────────────
  seedLegacyRedirects().catch(err =>
    log(`Warning: failed to seed legacy redirects: ${err}`));
  startSeoWorker();

  // ── Graceful shutdown — guard against multiple calls ─────────────────────────────
  let shutdownCalled = false;
  const shutdown = () => {
    if (shutdownCalled) return;
    shutdownCalled = true;
    log("Shutting down gracefully...");
    httpServer.close(() => {
      stopScheduler();
      stopSeoWorker();
      emailQueue.stop();
      whatsappQueue.stop();
      pool.end().then(() => process.exit(0)).catch(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10000);
  };
  // Known non-fatal errors from @neondatabase/serverless that should not crash the server.
  // The package attempts to assign to ErrorEvent.message (read-only in some envs) when a
  // WebSocket connection drops. The connection is automatically retried by the pool.
  const isNeonWebSocketError = (err: unknown): boolean => {
    if (!(err instanceof TypeError)) return false;
    const msg = (err as TypeError).message || "";
    return (
      msg.includes("Cannot set property message of #<ErrorEvent>") ||
      msg.includes("reportStreamError") ||
      msg.includes("_handleErrorWhileConnecting")
    );
  };

  process.on("uncaughtException", (err) => {
    if (isNeonWebSocketError(err)) {
      log(`[DB] Neon WebSocket transient error (non-fatal, connection will retry): ${err.message}`);
      return;
    }
    log(`Uncaught exception — shutting down: ${err.message}\n${err.stack}`);
    shutdown();
  });

  process.on("unhandledRejection", (reason) => {
    if (isNeonWebSocketError(reason)) {
      log(`[DB] Neon WebSocket transient rejection (non-fatal, connection will retry)`);
      return;
    }
    log(`Unhandled rejection — shutting down: ${reason instanceof Error ? reason.message : String(reason)}`);
    shutdown();
  });

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
})();
