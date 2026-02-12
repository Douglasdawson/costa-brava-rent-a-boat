import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://www.google-analytics.com", "https://api.stripe.com", "wss:"],
      frameSrc: ["'self'", "https://js.stripe.com"],
    }
  },
  crossOriginEmbedderPolicy: false,
}));

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

app.use("/api/", generalLimiter);
app.use("/api/admin/login", authLimiter);
app.use("/api/admin/login-user", authLimiter);

// Trust proxy for correct protocol detection behind reverse proxies
app.set('trust proxy', 1);

// Enable ETag for better caching (default is weak ETag)
app.set('etag', 'strong');

// Optimize JSON parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

app.use(compression({
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
}));

// Canonical domain redirection middleware (SEO)
// Force all traffic to HTTPS costabravarentaboat.app
app.use((req: Request, res: Response, next: NextFunction) => {
  const host = req.hostname;
  const canonicalDomain = 'costabravarentaboat.app';
  
  // Skip in development (localhost)
  if (host === 'localhost' || host === '127.0.0.1' || host.includes('.replit.dev')) {
    return next();
  }
  
  // Check if request is secure (handles trust proxy and X-Forwarded-Proto)
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  
  // Redirect if not canonical domain OR not HTTPS
  if (host !== canonicalDomain || !isSecure) {
    const canonicalUrl = `https://${canonicalDomain}${req.originalUrl}`;
    return res.redirect(301, canonicalUrl);
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
  });

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
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
