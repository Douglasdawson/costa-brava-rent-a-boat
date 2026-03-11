import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as Sentry from "@sentry/node";
import { randomUUID } from "crypto";
import { config, isDev } from "./config";
import { errorHandler, AppError } from "./middleware/errorHandler";
import { csrfProtection } from "./middleware/csrf";
import { stopScheduler } from "./services/schedulerService";
import { pool } from "./db";

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

// Trust first proxy (Render/Nginx/etc.) so Express uses real client IP from X-Forwarded-For
// This must be set before any rate-limiting middleware
app.set('trust proxy', 1);

// Sentry error monitoring — only active when SENTRY_DSN is set
if (config.SENTRY_DSN) {
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: isDev ? "development" : "production",
    tracesSampleRate: isDev ? 1.0 : 0.2,
  });
}

// Security headers (disabled in development — CSP blocks HTTP localhost)
if (!isDev) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Note: 'unsafe-inline' required by GTM; 'unsafe-eval' removed — monitor for issues
        scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com", "https://www.google-analytics.com", "https://googletagmanager.com", "https://js.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://www.google-analytics.com", "https://region1.google-analytics.com", "https://www.googletagmanager.com", "https://api.stripe.com", "wss:"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://www.googletagmanager.com"],
      }
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginEmbedderPolicy: false,
    strictTransportSecurity: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },
  }));
}

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas peticiones. Intenta de nuevo en unos minutos." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos de login. Intenta de nuevo en 15 minutos." },
});

// Admin panel limiter (300 req / 15 min)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas peticiones al panel de administración. Intenta de nuevo en unos minutos." },
});

// Quote endpoint: up to 20 quotes per minute
const quoteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
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

// CORS — restrict API access to known origins
const allowedOrigins = isDev
  ? ['http://localhost:5000', 'http://localhost:3000', 'http://127.0.0.1:5000']
  : ['https://costabravarentaboat.com', 'https://www.costabravarentaboat.com', 'https://costabravarentaboat.app'];

app.use('/api/', (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin as string | undefined;
  const isAllowed = !origin
    || allowedOrigins.includes(origin)
    || (!isDev && origin.endsWith('.costabravarentaboat.com'))
    || (!isDev && origin.endsWith('.costabravarentaboat.app'));

  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-Slug, X-Session-Id');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Enable ETag for better caching (default is weak ETag)
app.set('etag', 'strong');

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
    return compression.filter(req, res);
  },
  level: 6,
}));

// CSRF protection — validates Origin/Referer for cookie-based auth (state-changing requests)
app.use(csrfProtection);

// Canonical domain redirection middleware (SEO)
// Force all traffic to HTTPS costabravarentaboat.com
// Redirects .app domain and www to the canonical .com domain.
app.use((req: Request, res: Response, next: NextFunction) => {
  const host = req.hostname;
  const canonicalDomain = 'costabravarentaboat.com';
  
  // Skip in development (localhost)
  if (host === 'localhost' || host === '127.0.0.1' || host.includes('.replit.dev')) {
    return next();
  }
  
  // Check if request is secure (handles trust proxy and X-Forwarded-Proto)
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  
  const isCanonicalHost = host === canonicalDomain;
  const targetHost = canonicalDomain;

  // Redirect if host is not canonical OR not HTTPS
  if (!isCanonicalHost || !isSecure) {
    const canonicalUrl = `https://${targetHost}${req.originalUrl}`;
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
  const server = await registerRoutes(app);

  // 301 redirects for legacy routes (SEO)
  const legacyRedirects: Record<string, string> = {
    "/destino/blanes": "/alquiler-barcos-blanes",
    "/destino/lloret-de-mar": "/alquiler-barcos-lloret-de-mar",
    "/destino/tossa-de-mar": "/alquiler-barcos-tossa-de-mar",
    "/categoria/sin-licencia": "/alquiler-barcos-sin-licencia",
    "/categoria/con-licencia": "/alquiler-barcos-con-licencia",
  };
  for (const [from, to] of Object.entries(legacyRedirects)) {
    app.get(from, (_req: Request, res: Response) => {
      res.redirect(301, to);
    });
  }

  // 404 handler for unknown API routes
  app.all("/api/*", (_req: Request, res: Response) => {
    res.status(404).json({ message: "Endpoint no encontrado" });
  });

  // Global error handler (centralized in middleware/errorHandler.ts)
  // Sentry capture for 5xx errors before passing to errorHandler
  app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    if (statusCode >= 500 && config.SENTRY_DSN) {
      Sentry.captureException(err);
    }
    next(err);
  });
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // Add Cache-Control headers for production static assets
    app.use((req, res, next) => {
      const path = req.path;
      
      // Static assets with content hash (immutable, long cache)
      if (path.match(/\.(js|css|woff2?|ttf|eot|otf|svg|png|jpg|jpeg|gif|webp|ico|map)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // HTML files (always revalidate)
      else if (path.match(/\.html$/) || path === '/') {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      }
      
      next();
    });
    
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = config.PORT;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    log("Shutting down gracefully...");
    server.close(() => {
      stopScheduler();
      pool.end().then(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10000);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
})();
