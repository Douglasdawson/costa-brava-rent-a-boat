# Semana 4 — Quality (Solidez Técnica) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Instalar monitoring, tests, CI y eliminar deuda técnica para que nada se rompa silenciosamente durante la temporada.

**Architecture:** 4 bloques independientes. Monitoring (Sentry + health check + logger) se integra en server/index.ts. Testing usa Vitest con mocks para storage. CI usa GitHub Actions. Deuda técnica crea `AuthenticatedRequest` type y migra sesiones a PostgreSQL.

**Tech Stack:** Vitest, @sentry/node, GitHub Actions, Drizzle ORM, Express, TypeScript

---

## Task 1: Structured Logger

**Files:**
- Create: `server/lib/logger.ts`

**Step 1: Create logger helper**

Create `server/lib/logger.ts`:

```typescript
type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context && { context }),
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => emit("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => emit("error", message, context),
};
```

**Step 2: Verify TypeScript**

```bash
npm run check
```

**Step 3: Commit**

```bash
git add server/lib/logger.ts
git commit -m "feat: add structured JSON logger with info/warn/error levels"
```

---

## Task 2: Sentry Integration

**Files:**
- Modify: `package.json` (add @sentry/node)
- Modify: `server/index.ts` (lines 1-10 for import, line 8 for init, line 210 for error handler)

**Step 1: Install Sentry**

```bash
npm install @sentry/node
```

**Step 2: Add Sentry init to `server/index.ts`**

At the top of `server/index.ts`, after the existing imports (line 6), add:

```typescript
import * as Sentry from "@sentry/node";
```

After `const isDev = process.env.NODE_ENV === "development";` (line 9), add:

```typescript
// Sentry error monitoring — only active when SENTRY_DSN is set
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: isDev ? "development" : "production",
    tracesSampleRate: isDev ? 1.0 : 0.2,
  });
}
```

**Step 3: Add Sentry to error handler**

In `server/index.ts`, find the error handler (line ~210):

```typescript
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    console.error("[Server] Unhandled error:", err.message || err);
    res.status(status).json({ message: "Error interno del servidor" });
  });
```

Replace with:

```typescript
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) {
      Sentry.captureException(err);
    }
    console.error("[Server] Unhandled error:", err.message || err);
    res.status(status).json({ message: "Error interno del servidor" });
  });
```

**Step 4: Verify TypeScript**

```bash
npm run check
```

**Step 5: Commit**

```bash
git add package.json package-lock.json server/index.ts
git commit -m "feat: integrate Sentry error monitoring (active when SENTRY_DSN is set)"
```

---

## Task 3: Health Check Endpoint

**Files:**
- Create: `server/routes/health.ts`
- Modify: `server/routes/index.ts` (add import + register)

**Step 1: Create health check route**

Create `server/routes/health.ts`:

```typescript
import type { Express } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";
import Stripe from "stripe";

export function registerHealthRoutes(app: Express) {
  app.get("/api/health", async (_req, res) => {
    const services: Record<string, { status: string; latencyMs?: number }> = {};

    // Check DB
    const dbStart = Date.now();
    try {
      await db.execute(sql`SELECT 1`);
      services.database = { status: "ok", latencyMs: Date.now() - dbStart };
    } catch {
      services.database = { status: "error", latencyMs: Date.now() - dbStart };
    }

    // Check Stripe
    const stripeStart = Date.now();
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        services.stripe = { status: "not_configured" };
      } else {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        await stripe.balance.retrieve();
        services.stripe = { status: "ok", latencyMs: Date.now() - stripeStart };
      }
    } catch {
      services.stripe = { status: "error", latencyMs: Date.now() - stripeStart };
    }

    // Check SendGrid (just verify env var presence — no free ping endpoint)
    services.sendgrid = {
      status: process.env.SENDGRID_API_KEY ? "configured" : "not_configured",
    };

    // Check Twilio
    services.twilio = {
      status: process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
        ? "configured"
        : "not_configured",
    };

    const allOk = Object.values(services).every(
      (s) => s.status === "ok" || s.status === "configured" || s.status === "not_configured"
    );

    res.status(allOk ? 200 : 503).json({
      status: allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      services,
    });
  });
}
```

**Step 2: Register in `server/routes/index.ts`**

Add import at line ~24 (after the newsletter import):

```typescript
import { registerHealthRoutes } from "./health";
```

Add registration after `registerNewsletterRoutes(app);` (line ~51):

```typescript
  registerHealthRoutes(app);
```

**Step 3: Verify TypeScript**

```bash
npm run check
```

**Step 4: Commit**

```bash
git add server/routes/health.ts server/routes/index.ts
git commit -m "feat: add /api/health endpoint checking DB, Stripe, SendGrid, Twilio"
```

---

## Task 4: AuthenticatedRequest Type

**Files:**
- Create: `server/types.ts`
- Modify: `server/routes/auth.ts` (lines 270-276, 296-298, 359-361, 368, 700, 741)
- Modify: `server/routes/tenant.ts` (lines 43, 57, 84, 112, 164)

**Step 1: Create server/types.ts**

Create `server/types.ts`:

```typescript
import type { Request } from "express";

// Legacy admin JWT payload (backward compat)
export interface AdminJwtPayload {
  userId: string;
  role: string;
  username: string;
  iat?: number;
  exp?: number;
}

// SaaS JWT payload with tenantId
export interface SaasJwtPayload {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Union type for any JWT payload
export type JwtPayload = AdminJwtPayload | SaasJwtPayload;

// Authenticated request with typed auth properties
export interface AuthenticatedRequest extends Request {
  adminUser?: AdminJwtPayload | SaasJwtPayload;
  saasUser?: SaasJwtPayload;
  tenantId?: string;
  authUser?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
}
```

**Step 2: Update auth.ts to use AuthenticatedRequest**

In `server/routes/auth.ts`:

1. Add import at top:
```typescript
import type { AuthenticatedRequest } from "../types";
```

2. Remove the local `AdminJwtPayload`, `SaasJwtPayload`, and `JwtPayload` type definitions (lines 66-85) and import them from `server/types.ts`:
```typescript
import type { AuthenticatedRequest, AdminJwtPayload, SaasJwtPayload, JwtPayload } from "../types";
```

3. Replace all `(req as any).tenantId = ...` with typed cast. In `requireAdminSession` (lines 270-276):

```typescript
      // Before:
      (req as any).tenantId = validated.user.tenantId;
      (req as any).saasUser = validated.token;
      (req as any).adminUser = validated.token;
      // After:
      const authReq = req as AuthenticatedRequest;
      authReq.tenantId = validated.user.tenantId;
      authReq.saasUser = validated.token;
      authReq.adminUser = validated.token;
```

4. Same pattern for line 276:
```typescript
      // Before:
      (req as any).adminUser = decoded;
      // After:
      (req as AuthenticatedRequest).adminUser = decoded;
```

5. In `requireSaasAuth` (lines 296-298):
```typescript
      // Before:
      (req as any).saasUser = validated.token;
      (req as any).tenantId = validated.user.tenantId;
      (req as any).authUser = validated.user;
      // After:
      const authReq = req as AuthenticatedRequest;
      authReq.saasUser = validated.token;
      authReq.tenantId = validated.user.tenantId;
      authReq.authUser = validated.user;
```

6. In `injectTenantId` (lines 359-361 and 368):
```typescript
      // Before:
      (req as any).tenantId = validated.user.tenantId;
      (req as any).saasUser = validated.token;
      (req as any).authUser = validated.user;
      // After:
      const authReq = req as AuthenticatedRequest;
      authReq.tenantId = validated.user.tenantId;
      authReq.saasUser = validated.token;
      authReq.authUser = validated.user;
```

And line 368:
```typescript
      // Before:
      (req as any).tenantId = tenantId;
      // After:
      (req as AuthenticatedRequest).tenantId = tenantId;
```

7. Lines 700 and 741:
```typescript
      // Before:
      const saasUser = (req as any).saasUser as SaasJwtPayload;
      // After:
      const saasUser = (req as AuthenticatedRequest).saasUser;
```

**Step 3: Update tenant.ts**

In `server/routes/tenant.ts`, add import and replace 5 occurrences:

```typescript
import type { AuthenticatedRequest } from "../types";
```

Lines 43, 57, 84, 112, 164:
```typescript
      // Before:
      const saasUser = (req as any).saasUser;
      // After:
      const saasUser = (req as AuthenticatedRequest).saasUser;
```

**Step 4: Verify TypeScript**

```bash
npm run check
```

Expected: 0 errors. All `(req as any)` should be gone.

**Step 5: Verify no more `(req as any)` in server/**

```bash
grep -r "(req as any)" server/
```

Expected: no output.

**Step 6: Commit**

```bash
git add server/types.ts server/routes/auth.ts server/routes/tenant.ts
git commit -m "refactor: create AuthenticatedRequest type, eliminate all (req as any) casts"
```

---

## Task 5: Sessions and Token Blacklist to PostgreSQL

**Files:**
- Modify: `shared/schema.ts` (add 2 tables)
- Modify: `server/storage.ts` (add 4 methods to IStorage + implementation)
- Modify: `server/routes/auth.ts` (replace Map/Set with storage calls)

**Step 1: Add tables to schema.ts**

At the end of `shared/schema.ts`, before the EOF, add:

```typescript
// Admin sessions (persisted across server restarts)
export const adminSessions = pgTable("admin_sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
  username: text("username").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

// Token blacklist (logged out before expiry)
export const tokenBlacklist = pgTable("token_blacklist", {
  token: text("token").primaryKey(),
  blacklistedAt: timestamp("blacklisted_at", { withTimezone: true }).notNull().default(sql`now()`),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
```

**Step 2: Push schema**

```bash
npm run db:push
```

**Step 3: Add methods to IStorage in storage.ts**

In the `IStorage` interface, add:

```typescript
  // Session management
  createAdminSession(token: string, userId: string, role: string, username: string, expiresAt: Date): Promise<void>;
  deleteAdminSession(token: string): Promise<void>;
  isTokenBlacklisted(token: string): Promise<boolean>;
  blacklistToken(token: string, expiresAt: Date): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;
```

**Step 4: Import new tables in storage.ts**

Add to the schema imports:

```typescript
  adminSessions,
  tokenBlacklist,
```

**Step 5: Implement in DatabaseStorage**

```typescript
  async createAdminSession(token: string, userId: string, role: string, username: string, expiresAt: Date): Promise<void> {
    await db.insert(adminSessions).values({ token, userId, role, username, expiresAt }).onConflictDoNothing();
  }

  async deleteAdminSession(token: string): Promise<void> {
    await db.delete(adminSessions).where(eq(adminSessions.token, token));
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const [result] = await db.select().from(tokenBlacklist).where(eq(tokenBlacklist.token, token)).limit(1);
    return !!result;
  }

  async blacklistToken(token: string, expiresAt: Date): Promise<void> {
    await db.insert(tokenBlacklist).values({ token, expiresAt }).onConflictDoNothing();
  }

  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    await db.delete(adminSessions).where(sql`${adminSessions.expiresAt} < ${now}`);
    await db.delete(tokenBlacklist).where(sql`${tokenBlacklist.expiresAt} < ${now}`);
  }
```

**Step 6: Update auth.ts to use storage instead of Map/Set**

In `server/routes/auth.ts`:

1. Remove in-memory stores (lines 97-100):
```typescript
// DELETE these lines:
const activeSessions = new Map<string, TokenMeta>();
const blacklistedTokens = new Set<string>();
```

2. Remove the `setInterval` cleanup (lines 103-120) and replace with:
```typescript
// Clean expired sessions and blacklisted tokens every hour
setInterval(async () => {
  try {
    await storage.cleanupExpiredSessions();
  } catch {
    // Silent cleanup failure
  }
}, 60 * 60 * 1000);
```

3. In `generateAdminToken` (line ~141), replace `activeSessions.set(...)` with:
```typescript
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  storage.createAdminSession(token, userId, role, username, expiresAt).catch(() => {});
```

4. In `getTokenData` (line ~172), replace `blacklistedTokens.has(token)` with an async approach. This function needs to become async:
```typescript
async function getTokenData(req: Request): Promise<JwtPayload | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.substring(7);
  if (await storage.isTokenBlacklisted(token)) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}
```

5. Update all callers of `getTokenData` to use `await`. These are in:
   - `requireSaasAuth` — already async, just add `await`
   - `requireAdminRole` — make async, add `await`
   - `requireSuperAdmin` — make async, add `await`
   - `requireOwner` — make async, add `await`
   - `validateSaasTokenData` — its caller already awaits, no change needed
   - `injectTenantId` — already async, just add `await`

6. In the logout endpoint, replace `blacklistedTokens.add(token)` and `activeSessions.delete(token)` with:
```typescript
    const decoded = jwt.decode(token) as JwtPayload | null;
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    await storage.blacklistToken(token, expiresAt);
    await storage.deleteAdminSession(token);
```

7. In `requireAdminSession`, replace `activeSessions.delete(token)` in the TokenExpiredError catch with:
```typescript
    storage.deleteAdminSession(token).catch(() => {});
```

**Step 7: Verify TypeScript**

```bash
npm run check
```

**Step 8: Commit**

```bash
git add shared/schema.ts server/storage.ts server/routes/auth.ts
git commit -m "feat: migrate admin sessions and token blacklist from memory to PostgreSQL"
```

---

## Task 6: Move Dev Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Move remotion, lighthouse, jsdom to devDependencies**

```bash
npm install --save-dev remotion @remotion/cli lighthouse jsdom
```

This automatically removes them from dependencies and adds them to devDependencies.

**Step 2: Verify the app still builds**

```bash
npm run check
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: move remotion, lighthouse, jsdom to devDependencies"
```

---

## Task 7: App.tsx Cleanup — Remove Unnecessary Wrappers

**Files:**
- Modify: `client/src/App.tsx` (lines 257-311, 335-357)

**Step 1: Remove all trivial wrappers**

In `client/src/App.tsx`, delete these wrapper functions (lines 257-311):

```typescript
// DELETE all of these:
function CondicionesGeneralesPage() { return <CondicionesGenerales />; }
function FAQPageWrapper() { return <FAQPage />; }
function PrivacyPolicyPageWrapper() { return <PrivacyPolicyPage />; }
function TermsConditionsPageWrapper() { return <TermsConditionsPage />; }
function CookiesPolicyPageWrapper() { return <CookiesPolicyPage />; }
function LocationBlanesPageWrapper() { return <LocationBlanesPage />; }
function LocationLloretPageWrapper() { return <LocationLloretPage />; }
function LocationTossaPageWrapper() { return <LocationTossaPage />; }
function CategoryLicenseFreePageWrapper() { return <CategoryLicenseFreePage />; }
function CategoryLicensedPageWrapper() { return <CategoryLicensedPage />; }
function TestimoniosPageWrapper() { return <TestimoniosPage />; }
function BlogPageWrapper() { return <BlogPage />; }
function BlogDetailPageWrapper() { return <BlogDetailPage />; }
function DestinationDetailPageWrapper() { return <DestinationDetailPage />; }
```

**Step 2: Update routes to use lazy components directly**

Replace the wrapper references in the Router switch:

```tsx
// Before:
<Route path="/condiciones-generales" component={CondicionesGeneralesPage} />
<Route path="/faq" component={FAQPageWrapper} />
// etc.

// After — use the lazy imported component directly:
<Route path="/condiciones-generales" component={CondicionesGenerales} />
<Route path="/faq" component={FAQPage} />
<Route path="/privacy-policy" component={PrivacyPolicyPage} />
<Route path="/terms-conditions" component={TermsConditionsPage} />
<Route path="/cookies-policy" component={CookiesPolicyPage} />
<Route path="/alquiler-barcos-blanes" component={LocationBlanesPage} />
<Route path="/alquiler-barcos-lloret-de-mar" component={LocationLloretPage} />
<Route path="/alquiler-barcos-tossa-de-mar" component={LocationTossaPage} />
<Route path="/barcos-sin-licencia" component={CategoryLicenseFreePage} />
<Route path="/barcos-con-licencia" component={CategoryLicensedPage} />
<Route path="/testimonios" component={TestimoniosPage} />
<Route path="/blog/:slug" component={BlogDetailPage} />
<Route path="/blog" component={BlogPage} />
<Route path="/destinos/:slug" component={DestinationDetailPage} />
```

**Step 3: Verify TypeScript**

```bash
npm run check
```

**Step 4: Commit**

```bash
git add client/src/App.tsx
git commit -m "refactor: remove 14 unnecessary wrapper components in App.tsx"
```

---

## Task 8: Vitest Setup

**Files:**
- Modify: `package.json` (add vitest, add test script)
- Create: `vitest.config.ts`

**Step 1: Install Vitest**

```bash
npm install --save-dev vitest
```

**Step 2: Create vitest.config.ts**

Create `vitest.config.ts` at project root:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", "dist"],
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
});
```

**Step 3: Add test script to package.json**

In `package.json`, add to scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Also update `check:all`:
```json
"check:all": "npm run check && npm run lint && npm run format:check && npm run test"
```

**Step 4: Verify config works**

```bash
npx vitest run
```

Expected: "No test files found" (not an error).

**Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: setup Vitest test runner with path aliases"
```

---

## Task 9: Tests for pricing.ts

**Files:**
- Create: `shared/pricing.test.ts`

**Step 1: Write pricing tests**

Create `shared/pricing.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  getSeason,
  isWeekend,
  isOperationalSeason,
  calculateBasePrice,
  calculateExtrasPrice,
  calculatePricingBreakdown,
  getDepositAmount,
  isValidDuration,
  getMinimumDuration,
  WEEKEND_SURCHARGE_FACTOR,
} from "./pricing";

describe("getSeason", () => {
  it("returns BAJA for April", () => {
    expect(getSeason(new Date("2026-04-15"))).toBe("BAJA");
  });

  it("returns BAJA for June", () => {
    expect(getSeason(new Date("2026-06-10"))).toBe("BAJA");
  });

  it("returns MEDIA for July", () => {
    expect(getSeason(new Date("2026-07-15"))).toBe("MEDIA");
  });

  it("returns ALTA for August", () => {
    expect(getSeason(new Date("2026-08-15"))).toBe("ALTA");
  });

  it("returns BAJA for September", () => {
    expect(getSeason(new Date("2026-09-20"))).toBe("BAJA");
  });

  it("returns BAJA for October", () => {
    expect(getSeason(new Date("2026-10-05"))).toBe("BAJA");
  });

  it("throws for dates outside operational season", () => {
    expect(() => getSeason(new Date("2026-01-15"))).toThrow("outside operational season");
    expect(() => getSeason(new Date("2026-11-15"))).toThrow("outside operational season");
    expect(() => getSeason(new Date("2026-12-25"))).toThrow("outside operational season");
  });
});

describe("isOperationalSeason", () => {
  it("returns true for April-October", () => {
    expect(isOperationalSeason(new Date("2026-04-01"))).toBe(true);
    expect(isOperationalSeason(new Date("2026-10-31"))).toBe(true);
  });

  it("returns false for November-March", () => {
    expect(isOperationalSeason(new Date("2026-01-15"))).toBe(false);
    expect(isOperationalSeason(new Date("2026-11-01"))).toBe(false);
    expect(isOperationalSeason(new Date("2026-03-15"))).toBe(false);
  });
});

describe("isWeekend", () => {
  it("returns true for Saturday", () => {
    // 2026-04-04 is a Saturday
    expect(isWeekend(new Date("2026-04-04T12:00:00"))).toBe(true);
  });

  it("returns true for Sunday", () => {
    // 2026-04-05 is a Sunday
    expect(isWeekend(new Date("2026-04-05T12:00:00"))).toBe(true);
  });

  it("returns false for weekdays", () => {
    // 2026-04-06 is a Monday
    expect(isWeekend(new Date("2026-04-06T12:00:00"))).toBe(false);
  });
});

describe("getMinimumDuration", () => {
  it("returns 2h for August dates", () => {
    expect(getMinimumDuration(new Date("2026-08-15"))).toBe("2h");
  });

  it("returns 2h for weekend dates", () => {
    expect(getMinimumDuration(new Date("2026-04-04T12:00:00"))).toBe("2h");
  });

  it("returns 1h for weekday non-August", () => {
    expect(getMinimumDuration(new Date("2026-04-06T12:00:00"))).toBe("1h");
  });
});

describe("calculateBasePrice", () => {
  it("returns correct price for solar-450 in BAJA 2h", () => {
    const price = calculateBasePrice("solar-450", new Date("2026-04-06T12:00:00"), "2h");
    expect(price).toBeGreaterThan(0);
    expect(typeof price).toBe("number");
  });

  it("applies weekend surcharge", () => {
    const weekday = calculateBasePrice("solar-450", new Date("2026-04-06T12:00:00"), "2h"); // Monday
    const weekend = calculateBasePrice("solar-450", new Date("2026-04-04T12:00:00"), "2h"); // Saturday
    expect(weekend).toBe(Math.round(weekday * WEEKEND_SURCHARGE_FACTOR));
  });

  it("throws for unknown boat", () => {
    expect(() => calculateBasePrice("nonexistent", new Date("2026-06-15"), "2h")).toThrow("not found");
  });

  it("throws for date outside season", () => {
    expect(() => calculateBasePrice("solar-450", new Date("2026-01-15"), "2h")).toThrow("outside operational season");
  });
});

describe("calculateExtrasPrice", () => {
  it("returns 0 for no extras", () => {
    expect(calculateExtrasPrice("solar-450", [])).toBe(0);
  });

  it("throws for unknown boat", () => {
    expect(() => calculateExtrasPrice("nonexistent", ["Snorkel"])).toThrow("not found");
  });
});

describe("calculatePricingBreakdown", () => {
  it("returns complete breakdown", () => {
    const breakdown = calculatePricingBreakdown("solar-450", new Date("2026-06-15"), "4h");
    expect(breakdown.boatId).toBe("solar-450");
    expect(breakdown.season).toBe("BAJA");
    expect(breakdown.basePrice).toBeGreaterThan(0);
    expect(breakdown.total).toBe(breakdown.subtotal + breakdown.deposit);
    expect(breakdown.subtotal).toBe(breakdown.basePrice + breakdown.extrasPrice);
  });
});

describe("getDepositAmount", () => {
  it("returns a positive number for valid boat", () => {
    const deposit = getDepositAmount("solar-450");
    expect(deposit).toBeGreaterThan(0);
  });

  it("throws for unknown boat", () => {
    expect(() => getDepositAmount("nonexistent")).toThrow("not found");
  });
});

describe("isValidDuration", () => {
  it("returns true for valid durations", () => {
    expect(isValidDuration("1h")).toBe(true);
    expect(isValidDuration("2h")).toBe(true);
    expect(isValidDuration("4h")).toBe(true);
    expect(isValidDuration("8h")).toBe(true);
  });

  it("returns false for invalid durations", () => {
    expect(isValidDuration("5h")).toBe(false);
    expect(isValidDuration("10m")).toBe(false);
    expect(isValidDuration("")).toBe(false);
  });
});
```

**Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

**Step 3: Commit**

```bash
git add shared/pricing.test.ts
git commit -m "test: add comprehensive tests for pricing.ts (seasons, prices, extras, breakdown)"
```

---

## Task 10: Tests for Availability / Booking Overlap

**Files:**
- Create: `server/services/availability.test.ts`

> Note: We need to check the availability logic first. It's likely in `server/routes/availability.ts` or `server/storage.ts`. The test will mock storage to test overlap detection.

**Step 1: Read availability logic**

Check `server/routes/availability.ts` for the overlap/conflict detection logic to understand what to test.

**Step 2: Write availability overlap tests**

Create `server/services/availability.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

// Test the overlap detection logic directly
// Two time ranges overlap if: startA < endB AND endA > startB

function hasTimeOverlap(
  startA: Date, endA: Date,
  startB: Date, endB: Date,
): boolean {
  return startA < endB && endA > startB;
}

describe("booking time overlap detection", () => {
  it("detects overlapping bookings", () => {
    const bookingA = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T14:00") };
    const bookingB = { start: new Date("2026-06-15T12:00"), end: new Date("2026-06-15T16:00") };
    expect(hasTimeOverlap(bookingA.start, bookingA.end, bookingB.start, bookingB.end)).toBe(true);
  });

  it("detects booking fully contained within another", () => {
    const bookingA = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T18:00") };
    const bookingB = { start: new Date("2026-06-15T12:00"), end: new Date("2026-06-15T14:00") };
    expect(hasTimeOverlap(bookingA.start, bookingA.end, bookingB.start, bookingB.end)).toBe(true);
  });

  it("allows adjacent bookings (no gap needed)", () => {
    const bookingA = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T14:00") };
    const bookingB = { start: new Date("2026-06-15T14:00"), end: new Date("2026-06-15T18:00") };
    expect(hasTimeOverlap(bookingA.start, bookingA.end, bookingB.start, bookingB.end)).toBe(false);
  });

  it("allows non-overlapping bookings", () => {
    const bookingA = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T12:00") };
    const bookingB = { start: new Date("2026-06-15T14:00"), end: new Date("2026-06-15T16:00") };
    expect(hasTimeOverlap(bookingA.start, bookingA.end, bookingB.start, bookingB.end)).toBe(false);
  });

  it("detects same start time as overlap", () => {
    const bookingA = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T12:00") };
    const bookingB = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T14:00") };
    expect(hasTimeOverlap(bookingA.start, bookingA.end, bookingB.start, bookingB.end)).toBe(true);
  });

  it("detects same time range as overlap", () => {
    const bookingA = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T14:00") };
    const bookingB = { start: new Date("2026-06-15T10:00"), end: new Date("2026-06-15T14:00") };
    expect(hasTimeOverlap(bookingA.start, bookingA.end, bookingB.start, bookingB.end)).toBe(true);
  });
});
```

**Step 3: Run tests**

```bash
npm test
```

Expected: all tests pass.

**Step 4: Commit**

```bash
git add server/services/availability.test.ts
git commit -m "test: add booking time overlap detection tests"
```

---

## Task 11: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create CI workflow**

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    name: Lint, Typecheck & Test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: TypeScript check
        run: npm run check

      - name: Run tests
        run: npm test
```

**Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for lint, typecheck and tests"
```

---

## Task 12: Knowledge Base — Seed 8 Languages

**Files:**
- Modify: `server/whatsapp/seedKnowledgeBase.ts`

**Step 1: Add translations for all 7 additional languages**

In `server/whatsapp/seedKnowledgeBase.ts`, after the existing `GENERAL_ES` array and before `seedKnowledgeBase()`, add translated entry arrays for CA, EN, FR, DE, NL, IT, RU. Each array follows the same structure as the ES arrays.

> Due to the size of 14 entries × 7 languages = 98 new entries, this task will add an `ALL_ENTRIES` map that pairs each language with its entries, then loops through all languages in `seedKnowledgeBase()`.

The function `seedKnowledgeBase()` (line 122) should be updated to:

```typescript
export async function seedKnowledgeBase(): Promise<void> {
  console.log("[Knowledge] Starting to seed knowledge base...");

  const entriesByLanguage: Record<string, typeof FAQS_ES> = {
    es: [...FAQS_ES, ...ROUTES_ES, ...GENERAL_ES],
    ca: [...FAQS_CA, ...ROUTES_CA, ...GENERAL_CA],
    en: [...FAQS_EN, ...ROUTES_EN, ...GENERAL_EN],
    fr: [...FAQS_FR, ...ROUTES_FR, ...GENERAL_FR],
    de: [...FAQS_DE, ...ROUTES_DE, ...GENERAL_DE],
    nl: [...FAQS_NL, ...ROUTES_NL, ...GENERAL_NL],
    it: [...FAQS_IT, ...ROUTES_IT, ...GENERAL_IT],
    ru: [...FAQS_RU, ...ROUTES_RU, ...GENERAL_RU],
  };

  let added = 0;
  let failed = 0;

  for (const [lang, entries] of Object.entries(entriesByLanguage)) {
    for (const entry of entries) {
      const success = await addKnowledgeEntry(
        entry.title,
        entry.content,
        entry.category,
        lang,
        entry.keywords,
        entry.priority
      );
      if (success) added++;
      else failed++;
    }
  }

  console.log(`[Knowledge] Seeding complete: ${added} added, ${failed} failed (8 languages)`);
}
```

The translated content should preserve the same structure (7 FAQ + 4 routes + 3 general = 14 per language), translated naturally to each language, keeping proper nouns (Blanes, Tossa, Costa Brava) unchanged and adapting keywords to each language.

**Step 2: Verify TypeScript**

```bash
npm run check
```

**Step 3: Commit**

```bash
git add server/whatsapp/seedKnowledgeBase.ts
git commit -m "feat: seed knowledge base in 8 languages (ES, CA, EN, FR, DE, NL, IT, RU)"
```

---

## Task 13: Chatbot Capacity Validation

**Files:**
- Modify: `server/whatsapp/functionCallingService.ts`

**Step 1: Read current functionCallingService.ts**

Find the `list_available_boats` function and the booking flow to understand where capacity validation should be added.

**Step 2: Add max capacity check**

In `list_available_boats()`, after filtering by `capacityMin`, add max capacity validation that returns a helpful message when no boats can accommodate the group size:

```typescript
// After existing capacity filter:
if (capacityMin && filteredBoats.length === 0) {
  return JSON.stringify({
    available: false,
    message: `No tenemos barcos disponibles para ${capacityMin} personas. Nuestra capacidad maxima es de 8 personas por barco. Para grupos mas grandes, podemos organizar varios barcos.`,
  });
}
```

**Step 3: Verify TypeScript**

```bash
npm run check
```

**Step 4: Commit**

```bash
git add server/whatsapp/functionCallingService.ts
git commit -m "feat: add capacity validation in chatbot with helpful message for large groups"
```

---

## Final Verification

```bash
npm run check && npm test
```

Expected: 0 TypeScript errors, all tests pass.

---

## Notas para el Implementador

1. **Task 5 (Sessions to PostgreSQL)** is the most complex task. The key change is making `getTokenData` async, which ripples through all middleware that calls it. Take extra care with the `await` chain.

2. **Task 12 (Knowledge Base 8 languages)** is large but mechanical. Each language gets 14 entries translated. Use the existing ES entries as template.

3. **Task 4 depends on Task 5**: The `AuthenticatedRequest` type must exist before the sessions migration. But they can be done in sequence within the same commit if preferred.

4. **CI (Task 11)** does not need a PostgreSQL service container since the tests in Tasks 9-10 are pure unit tests with no DB dependency.

5. **Order of execution**: Tasks 1-3 (monitoring) are independent. Task 4 before Task 5 (types before sessions). Tasks 6-7 (cleanup) independent. Tasks 8-10 (testing) sequential. Task 11 (CI) after tests exist. Tasks 12-13 (chatbot) independent.
