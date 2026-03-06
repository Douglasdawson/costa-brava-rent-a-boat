# Plan de Refactorizacion Completo

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Llevar el proyecto de un estado funcional pero con deuda tecnica significativa a una base de codigo segura, performante, mantenible y escalable.

**Architecture:** Refactorizacion incremental por fases, organizadas por impacto de negocio (seguridad > performance > mantenibilidad). Cada fase es independiente y deployable.

**Tech Stack:** TypeScript, React, Express, Drizzle ORM, PostgreSQL (Neon), Vite, TailwindCSS, shadcn/ui

---

## Fase 1: Seguridad Critica (P0)

**Objetivo:** Eliminar las 3 vulnerabilidades criticas detectadas en la auditoria de seguridad.

### Task 1.1: Proteger endpoint /objects/ con autenticacion

**Files:**
- Modify: `server/routes/admin.ts` (line ~637)

**Step 1:** Read the file and find the `/objects/:objectPath(*)` route handler.

**Step 2:** Add `requireAdminSession` middleware to the route:

```typescript
// Before:
app.get("/objects/:objectPath(*)", async (req, res) => {

// After:
app.get("/objects/:objectPath(*)", requireAdminSession, async (req, res) => {
```

**Step 3:** Add path traversal validation before serving the file:

```typescript
const objectPath = req.params.objectPath;
// Reject path traversal attempts
if (objectPath.includes('..') || objectPath.includes('\0')) {
  return res.status(400).json({ message: "Ruta no valida" });
}
```

**Step 4:** Verify the change compiles: `npx tsc --noEmit`

**Step 5:** Commit:
```bash
git add server/routes/admin.ts
git commit -m "security: protect /objects/ endpoint with auth + path traversal prevention"
```

---

### Task 1.2: Constant-time PIN comparison + persistent rate limiting

**Files:**
- Modify: `server/routes/auth.ts` (lines ~986-1019)

**Step 1:** Read the file and find the `/api/admin/login` endpoint.

**Step 2:** Replace string comparison with constant-time comparison:

```typescript
import crypto from "crypto";

// Before:
if (pin !== adminPin) {

// After:
const pinBuffer = Buffer.from(String(pin || '').padEnd(64, '\0'));
const adminPinBuffer = Buffer.from(String(adminPin).padEnd(64, '\0'));
if (!crypto.timingSafeEqual(pinBuffer, adminPinBuffer)) {
```

**Step 3:** Move the failed attempts tracking from in-memory Map to the database. Add a method to storage:

In `server/storage.ts`, add:
```typescript
async recordFailedLoginAttempt(ip: string): Promise<number> {
  // Use admin_sessions table or create simple query
  // Count attempts in last 15 minutes for this IP
}

async getFailedLoginAttempts(ip: string): Promise<number> {
  // Return count of failed attempts in last 15 minutes
}
```

**Step 4:** Update the rate limiting in the login handler to use storage instead of Map.

**Step 5:** Add JWT_SECRET length validation at startup:

```typescript
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("FATAL: JWT_SECRET must be at least 32 characters");
}
```

**Step 6:** Verify and commit:
```bash
git add server/routes/auth.ts server/storage.ts
git commit -m "security: constant-time PIN comparison + persistent rate limiting"
```

---

### Task 1.3: Rate limiting en endpoints publicos de escritura

**Files:**
- Modify: `server/routes/testimonials.ts`
- Modify: `server/routes/inquiries.ts`
- Modify: `server/routes/newsletter.ts`
- Modify: `server/routes/gallery.ts`

**Step 1:** Read each file.

**Step 2:** Add dedicated rate limiters to each public POST endpoint:

```typescript
import rateLimit from "express-rate-limit";

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 per hour per IP
  message: { message: "Demasiadas solicitudes. Intenta mas tarde." },
});

// Apply to each POST:
app.post("/api/testimonials", submitLimiter, async (req, res) => { ... });
app.post("/api/booking-inquiries", submitLimiter, async (req, res) => { ... });
app.post("/api/newsletter/subscribe", submitLimiter, async (req, res) => { ... });
```

**Step 3:** Verify and commit:
```bash
git add server/routes/testimonials.ts server/routes/inquiries.ts server/routes/newsletter.ts server/routes/gallery.ts
git commit -m "security: add rate limiting to public POST endpoints"
```

---

### Task 1.4: Sanitizar error responses en produccion

**Files:**
- Modify: `server/index.ts` (lines ~239-260)

**Step 1:** Read the file and find the global error handler.

**Step 2:** Ensure stack traces are never sent to clients, even in dev:

```typescript
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Error]", err.stack || err);

  // Never expose stack traces to client
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === "development"
    ? err.message
    : "Error interno del servidor";

  res.status(statusCode).json({ message });
});
```

**Step 3:** Verify and commit:
```bash
git add server/index.ts
git commit -m "security: sanitize error responses, never expose stack traces"
```

---

## Fase 2: Performance de Base de Datos (P0-P1)

**Objetivo:** Eliminar N+1 queries, mover logica de JS a SQL, anadir indexes faltantes.

### Task 2.1: Fix N+1 en decrementExtrasStock()

**Files:**
- Modify: `server/storage.ts` (lines ~2586-2624)

**Step 1:** Read the current implementation.

**Step 2:** Replace the loop-based approach with batch operations:

```typescript
async decrementExtrasStock(bookingId: string): Promise<void> {
  const extras = await db.select().from(bookingExtras)
    .where(eq(bookingExtras.bookingId, bookingId));

  if (extras.length === 0) return;

  // Batch lookup: get all inventory items matching extra names
  const extraNames = extras.map(e => e.extraName);
  const items = await db.select().from(inventoryItems)
    .where(inArray(inventoryItems.name, extraNames));

  const itemMap = new Map(items.map(i => [i.name, i]));

  // Batch updates using a transaction
  await db.transaction(async (tx) => {
    for (const extra of extras) {
      const item = itemMap.get(extra.extraName);
      if (!item || item.currentStock <= 0) continue;

      await tx.update(inventoryItems)
        .set({ currentStock: sql`current_stock - ${extra.quantity}` })
        .where(eq(inventoryItems.id, item.id));

      await tx.insert(inventoryMovements).values({
        itemId: item.id,
        bookingId,
        type: "out",
        quantity: extra.quantity,
        notes: `Reserva ${bookingId}`,
      });
    }
  });
}
```

**Step 3:** Import `inArray` from drizzle-orm if not already imported.

**Step 4:** Verify and commit:
```bash
git add server/storage.ts
git commit -m "perf: fix N+1 query in decrementExtrasStock with batch lookup"
```

---

### Task 2.2: Fix N+1 en syncAllCustomersFromBookings()

**Files:**
- Modify: `server/storage.ts` (lines ~2171-2259)

**Step 1:** Read the current implementation.

**Step 2:** Replace loop-based upsert with batch approach:

```typescript
async syncAllCustomersFromBookings(): Promise<{ created: number; updated: number }> {
  const allBookings = await db.select().from(bookings)
    .where(isNotNull(bookings.customerPhone));

  // Group bookings by phone
  const customerMap = new Map<string, typeof allBookings>();
  for (const booking of allBookings) {
    const phone = booking.customerPhone;
    if (!phone) continue;
    if (!customerMap.has(phone)) customerMap.set(phone, []);
    customerMap.get(phone)!.push(booking);
  }

  const phones = Array.from(customerMap.keys());
  if (phones.length === 0) return { created: 0, updated: 0 };

  // Batch fetch ALL existing CRM customers by phone
  const existingCustomers = await db.select().from(crmCustomers)
    .where(inArray(crmCustomers.phone, phones));
  const existingMap = new Map(existingCustomers.map(c => [c.phone, c]));

  let created = 0, updated = 0;

  await db.transaction(async (tx) => {
    for (const [phone, custBookings] of customerMap.entries()) {
      const existing = existingMap.get(phone);
      const latest = custBookings.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      const totalSpent = custBookings
        .filter(b => b.bookingStatus === "confirmed")
        .reduce((sum, b) => sum + parseFloat(b.totalAmount || "0"), 0);

      if (existing) {
        await tx.update(crmCustomers)
          .set({
            name: latest.customerName,
            surname: latest.customerSurname,
            email: latest.customerEmail || existing.email,
            totalBookings: custBookings.length,
            totalSpent: totalSpent.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(crmCustomers.id, existing.id));
        updated++;
      } else {
        await tx.insert(crmCustomers).values({
          name: latest.customerName,
          surname: latest.customerSurname,
          phone,
          email: latest.customerEmail,
          totalBookings: custBookings.length,
          totalSpent: totalSpent.toFixed(2),
        });
        created++;
      }
    }
  });

  return { created, updated };
}
```

**Step 3:** Verify and commit:
```bash
git add server/storage.ts
git commit -m "perf: fix N+1 query in syncAllCustomersFromBookings with batch fetch"
```

---

### Task 2.3: Mover getRevenueTrend() a SQL GROUP BY

**Files:**
- Modify: `server/storage.ts` (lines ~1269-1353)

**Step 1:** Read the current implementation that does in-memory date grouping.

**Step 2:** Replace with SQL-based aggregation:

```typescript
async getRevenueTrend(startDate: Date, endDate: Date, groupBy: "day" | "week" | "month"): Promise<Array<{ date: string; revenue: number; bookings: number }>> {
  const dateFormat = groupBy === "day" ? "YYYY-MM-DD"
    : groupBy === "week" ? "IYYY-IW"
    : "YYYY-MM";

  const results = await db.execute(sql`
    SELECT
      to_char(booking_date, ${dateFormat}) as period,
      COALESCE(SUM(CAST(total_amount AS NUMERIC)), 0) as revenue,
      COUNT(*) as bookings
    FROM bookings
    WHERE booking_date >= ${startDate}
      AND booking_date <= ${endDate}
      AND booking_status IN ('confirmed', 'completed')
    GROUP BY period
    ORDER BY period ASC
  `);

  return results.rows.map((row: any) => ({
    date: row.period,
    revenue: parseFloat(row.revenue),
    bookings: parseInt(row.bookings),
  }));
}
```

**Step 3:** Update the route handler in admin.ts if the return type changed.

**Step 4:** Verify and commit:
```bash
git add server/storage.ts server/routes/admin.ts
git commit -m "perf: move revenue trend aggregation from JS to SQL GROUP BY"
```

---

### Task 2.4: Anadir indexes faltantes

**Files:**
- Modify: `shared/schema.ts`

**Step 1:** Read the file and find existing index definitions.

**Step 2:** Add missing indexes:

```typescript
// On crmCustomers table - used in sync lookup
export const crmCustomerPhoneIdx = index("crm_customer_phone_idx").on(crmCustomers.phone);

// On inventoryItems table - used in decrementExtrasStock
export const inventoryItemNameIdx = index("inventory_item_name_idx").on(inventoryItems.name);

// On bookingExtras table - used in extras lookup by booking
export const bookingExtrasBookingIdx = index("booking_extras_booking_idx").on(bookingExtras.bookingId);

// On bookings table - for creation date sorting
export const bookingCreatedIdx = index("booking_created_idx").on(bookings.createdAt);

// On blogPosts table - for chronological queries
export const blogPublishedIdx = index("blog_published_idx").on(blogPosts.publishedAt);
```

**Step 3:** Run `npm run db:push` to apply indexes.

**Step 4:** Commit:
```bash
git add shared/schema.ts
git commit -m "perf: add missing database indexes for common query patterns"
```

---

## Fase 3: Refactoring del Storage Layer (P2)

**Objetivo:** Dividir el God Object storage.ts (2,741 lineas, 200+ metodos) en repositorios por dominio.

### Task 3.1: Crear estructura de repositorios

**Files:**
- Create: `server/storage/index.ts` (barrel export)
- Create: `server/storage/base.ts` (shared db instance)
- Move current: `server/storage.ts` -> keep as reference during migration

**Step 1:** Create the directory structure:

```
server/storage/
  index.ts        # Re-exports everything (backwards compatible)
  base.ts         # Shared db instance and helper types
  bookings.ts     # Booking CRUD + calendar + availability
  boats.ts        # Boat CRUD + fleet management
  customers.ts    # Customer + CRM customer methods
  analytics.ts    # Dashboard stats, revenue trends, reports
  auth.ts         # Users, tokens, sessions, admin users
  content.ts      # Blog, destinations, testimonials, newsletter
  inventory.ts    # Inventory items, movements, maintenance, documents
  promotions.ts   # Gift cards, discount codes
  tenants.ts      # Tenant CRUD + SaaS operations
  chatbot.ts      # Chatbot conversations, AI sessions, knowledge base
  gallery.ts      # Client photos
  inquiries.ts    # WhatsApp inquiries
```

**Step 2:** Create `server/storage/base.ts`:

```typescript
import { db } from "../db";
export { db };
export { eq, and, or, gte, lte, desc, asc, sql, isNull, isNotNull, inArray, like, count, sum } from "drizzle-orm";
export * from "@shared/schema";
```

**Step 3:** Create `server/storage/index.ts` that creates a unified storage object:

```typescript
import { BookingRepository } from "./bookings";
import { BoatRepository } from "./boats";
// ... other imports

class Storage {
  readonly bookings = new BookingRepository();
  readonly boats = new BoatRepository();
  // ... other repos

  // Proxy methods for backwards compatibility
  // (so existing code like storage.getBooking() still works)
  getBooking = this.bookings.getBooking.bind(this.bookings);
  createBooking = this.bookings.createBooking.bind(this.bookings);
  // ... etc
}

export const storage = new Storage();
```

**Step 4:** Commit the empty structure:
```bash
git add server/storage/
git commit -m "refactor: create storage repository structure"
```

---

### Task 3.2: Extraer BookingRepository (mayor, ~80 metodos)

**Files:**
- Create: `server/storage/bookings.ts`
- Modify: `server/storage.ts` (remove booking methods)
- Modify: `server/storage/index.ts` (add proxy methods)

**Step 1:** Read storage.ts and identify ALL booking-related methods:
- createBooking, getBooking, getBookingsByDate, getBookingsByBoatAndDateRange
- updateBooking, cancelBooking, getPaginatedBookings, getBookingsForCalendar
- checkAvailability, getBookingByToken, cancelBookingByToken
- decrementExtrasStock, getBookingExtras, etc.

**Step 2:** Move each method into BookingRepository class.

**Step 3:** Update index.ts with proxy methods for backwards compatibility.

**Step 4:** Search entire codebase for `storage.createBooking`, `storage.getBooking`, etc. to verify nothing breaks.

**Step 5:** Verify and commit:
```bash
git add server/storage/
git commit -m "refactor: extract BookingRepository from storage.ts"
```

### Task 3.3: Extraer AnalyticsRepository

**Files:**
- Create: `server/storage/analytics.ts`

Move: getDashboardStats, getDashboardStatsEnhanced, getRevenueTrend, getBoatsPerformance, getStatusDistribution, getFleetAvailability

### Task 3.4: Extraer AuthRepository

**Files:**
- Create: `server/storage/auth.ts`

Move: getUserById, createUser, updateUser, getAdminUser, createAdminUser, refreshTokens, password reset tokens, sessions, token blacklist

### Task 3.5: Extraer repositorios restantes

Create remaining repositories: boats, customers, content, inventory, promotions, tenants, chatbot, gallery, inquiries.

Each follows the same pattern as Task 3.2.

**Step final:** Delete the original `server/storage.ts` once all methods are migrated.

```bash
git commit -m "refactor: complete storage layer decomposition into domain repositories"
```

---

## Fase 4: Refactoring del Servidor (P1-P2)

**Objetivo:** Dividir admin.ts, centralizar error handling, centralizar config.

### Task 4.1: Crear server/config.ts centralizado

**Files:**
- Create: `server/config.ts`

```typescript
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  ADMIN_PIN: z.string().min(4),
  PORT: z.coerce.number().default(5000),
  SENTRY_DSN: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  META_WHATSAPP_TOKEN: z.string().optional(),
  META_WHATSAPP_PHONE_ID: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  GCS_BUCKET_NAME: z.string().optional(),
});

export const config = envSchema.parse(process.env);
export const isDev = config.NODE_ENV === "development";
export const isProd = config.NODE_ENV === "production";
```

Replace all scattered `process.env` accesses with `config.*` imports.

```bash
git commit -m "refactor: centralize environment config with Zod validation"
```

---

### Task 4.2: Crear middleware de error handling centralizado

**Files:**
- Create: `server/middleware/errorHandler.ts`

```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado") {
    super(404, message, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Datos invalidos") {
    super(400, message, "VALIDATION_ERROR");
  }
}

// Express error handler middleware
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message, code: err.code });
  }
  console.error("[Unhandled Error]", err);
  res.status(500).json({ message: "Error interno del servidor" });
}
```

Then progressively replace try/catch blocks in routes with `throw new NotFoundError()` etc.

```bash
git commit -m "refactor: centralized error handling middleware with typed errors"
```

---

### Task 4.3: Dividir admin.ts por dominio

**Files:**
- Modify: `server/routes/admin.ts` (1,105 lines -> ~200 lines coordinator)
- Create: `server/routes/admin-fleet.ts` (~300 lines)
- Create: `server/routes/admin-bookings.ts` (~200 lines)
- Create: `server/routes/admin-gallery.ts` (~150 lines)
- Create: `server/routes/admin-stats.ts` (~200 lines)
- Modify: `server/routes/index.ts` (register new route files)

**Step 1:** Read admin.ts and identify endpoint groups:
- Fleet: `/api/admin/boats/*` + `/api/admin/boat-reorder`
- Bookings: `/api/admin/bookings/*`
- Gallery: `/api/admin/gallery/*`
- Stats: `/api/admin/stats/*`
- Config: `/api/admin/config/*`

**Step 2:** Extract each group into its own file, keeping the same middleware and patterns.

**Step 3:** Update route registration in index.ts.

```bash
git commit -m "refactor: split admin.ts into domain-specific route files"
```

---

### Task 4.4: Adoptar logger.ts en todas las rutas

**Files:**
- Modify: `server/lib/logger.ts` (enhance if needed)
- Modify: All route files (replace console.error with logger)

Replace 155+ `console.error("[Module] Error:", ...)` with:
```typescript
import { logger } from "../lib/logger";
logger.error("[Module] Error", { error: err.message, endpoint: req.path });
```

```bash
git commit -m "refactor: adopt structured logger across all route handlers"
```

---

## Fase 5: Refactoring del Cliente (P2)

**Objetivo:** Extraer hooks compartidos, componentes reutilizables, y API client centralizado.

### Task 5.1: Crear custom hooks compartidos

**Files:**
- Create: `client/src/hooks/useDebounceSearch.ts`
- Create: `client/src/hooks/usePaginatedQuery.ts`
- Modify: `client/src/components/crm/BookingsTab.tsx`
- Modify: `client/src/components/crm/CustomersTab.tsx`
- Modify: `client/src/components/crm/InquiriesTab.tsx`

**useDebounceSearch.ts:**
```typescript
import { useState, useCallback, useRef } from "react";

export function useDebounceSearch(delay = 300) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, delay);
  }, [delay]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setDebouncedSearch("");
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { searchQuery, debouncedSearch, handleSearchChange, clearSearch };
}
```

**usePaginatedQuery.ts:**
```typescript
import { useState, useCallback } from "react";

export function usePaginatedQuery(defaultSortBy = "createdAt", defaultSortOrder: "asc" | "desc" = "desc") {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultSortOrder);

  const handleSort = useCallback((column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  }, [sortBy]);

  const resetPage = useCallback(() => setCurrentPage(1), []);

  return { currentPage, setCurrentPage, sortBy, sortOrder, handleSort, resetPage };
}
```

Then replace the duplicated state in BookingsTab, CustomersTab, InquiriesTab.

```bash
git commit -m "refactor: extract useDebounceSearch and usePaginatedQuery hooks"
```

---

### Task 5.2: Crear componentes CRM compartidos

**Files:**
- Create: `client/src/components/crm/shared/EmptyState.tsx`
- Create: `client/src/components/crm/shared/StatCard.tsx`
- Create: `client/src/components/crm/shared/SortableTableHead.tsx`
- Modify: 8+ CRM components to use them

**EmptyState.tsx:**
```typescript
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="w-12 h-12 text-muted-foreground/50 mb-4" />
      <p className="text-lg font-heading font-medium text-foreground mb-1">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
```

**StatCard.tsx:**
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
}

export function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium font-heading">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
```

Replace the 8+ duplicated card/empty patterns across CRM components.

```bash
git commit -m "refactor: extract EmptyState, StatCard, SortableTableHead shared components"
```

---

### Task 5.3: Crear API client centralizado

**Files:**
- Create: `client/src/lib/api.ts`
- Modify: CRM components (progressively replace hardcoded URLs)

```typescript
const BASE = "/api";
const ADMIN = `${BASE}/admin`;

export const API = {
  boats: `${BASE}/boats`,
  bookings: `${BASE}/bookings`,
  admin: {
    bookings: `${ADMIN}/bookings`,
    customers: `${ADMIN}/customers`,
    boats: `${ADMIN}/boats`,
    stats: {
      dashboard: `${ADMIN}/stats/dashboard`,
      revenue: `${ADMIN}/stats/revenue-trend`,
      boats: `${ADMIN}/stats/boats-performance`,
    },
    gallery: `${ADMIN}/gallery`,
    inquiries: `${ADMIN}/booking-inquiries`,
    inventory: `${ADMIN}/inventory`,
    maintenance: `${ADMIN}/maintenance`,
    discounts: `${ADMIN}/discounts`,
    giftcards: `${ADMIN}/giftcards`,
    employees: `${ADMIN}/employees`,
  },
} as const;

export function adminFetch(url: string, token: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
}
```

```bash
git commit -m "refactor: create centralized API client with typed endpoints"
```

---

### Task 5.4: Consolidar tipos en types.ts

**Files:**
- Modify: `client/src/components/crm/types.ts`
- Modify: `BookingsTab.tsx`, `InquiriesTab.tsx`, `DashboardTab.tsx` (remove local interfaces)

Add generic paginated response and move all inline types:

```typescript
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface MaintenanceLog { ... }
export interface BoatDocument { ... }
export interface InventoryItem { ... }
export interface InventoryMovement { ... }
```

```bash
git commit -m "refactor: consolidate CRM types into shared types.ts"
```

---

## Fase 6: Schema y Integridad de Datos (P1-P2)

**Objetivo:** Anadir FK constraints, unique constraints, y corregir inconsistencias.

### Task 6.1: Anadir FK constraints para tenantId

**Files:**
- Modify: `shared/schema.ts`

Add `.references(() => tenants.id)` to all tenantId columns across 22 tables.

**Nota:** Esto requiere que todos los registros existentes tengan un tenantId valido. Verificar primero con query de auditoria.

```bash
git commit -m "schema: add foreign key constraints for tenant isolation"
```

### Task 6.2: Anadir unique constraints

**Files:**
- Modify: `shared/schema.ts`

```typescript
// On crmCustomers: prevent duplicate customers per tenant
export const crmCustomerUniqueIdx = uniqueIndex("crm_customer_tenant_phone_idx")
  .on(crmCustomers.tenantId, crmCustomers.phone);
```

```bash
git commit -m "schema: add unique constraints to prevent duplicate records"
```

---

## Fase 7: SEO y Accesibilidad (P2)

### Task 7.1: Anadir FAQ schema a pagina /faq

**Files:**
- Modify: `client/src/pages/faq.tsx`

Add FAQPage JSON-LD schema with all questions/answers.

### Task 7.2: Anadir BlogPosting schema a /blog/:slug

**Files:**
- Modify: `client/src/pages/blog-detail.tsx`

Add BlogPosting JSON-LD with headline, datePublished, author, image.

### Task 7.3: Anadir aria-invalid y aria-describedby a formularios

**Files:**
- Modify: Form components with validation errors

### Task 7.4: Anadir skip-to-content link

**Files:**
- Modify: `client/src/components/Navigation.tsx`

```typescript
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute ...">
  Saltar al contenido
</a>
```

```bash
git commit -m "a11y+seo: FAQ schema, BlogPosting schema, form a11y, skip link"
```

---

## Fase 8: Limpieza y Deuda Tecnica (P3)

### Task 8.1: Eliminar dead code

**Files to delete:**
- `client/src/components/ElectricBorder.tsx`
- `client/src/pages/stepper-demo.tsx`
- `client/src/components/ui/chart.tsx.unused`

**Unused functions to remove from seo-schemas.ts:**
- `generateProductSchema()`
- `generateAggregateRatingSchema()`
- `generateReviewSchema()`
- `generateFAQPageSchema()`
- Duplicate `generateBreadcrumbSchema()` (keep the one in seo-config.ts)

### Task 8.2: Eliminar dependencias no usadas

```bash
npm uninstall react-icons sonner framer-motion tw-animate-css rollup-plugin-visualizer
```

Replace the 8 react-icons social media icons with lucide-react equivalents.

### Task 8.3: Fix type safety issues

Replace all `as unknown as` and `as any` with proper types:
- `server/routes/admin.ts`: 3 instances of `(req as unknown as Record<string, unknown>).adminUser`
  - Fix: Extend Express Request type with adminUser property
- `server/routes/sitemaps.ts`: 6 `as any` casts
  - Fix: Import proper types from schema
- `BookingFlow.tsx`: 8 `any` types
  - Fix: Use `Boat` type from schema

### Task 8.4: Remove debug console.log

- `client/src/components/BookingFlow.tsx:910` - Remove `console.log("Time selected:", slot.id)`

```bash
git commit -m "chore: remove dead code, unused deps, fix type safety, cleanup logs"
```

---

## Fase 9: Traducciones (P2 - Largo plazo)

**Objetivo:** Dividir translations.ts (7,940 lineas) en archivos por idioma con carga dinamica.

### Task 9.1: Crear estructura de archivos i18n

**Files:**
- Create: `client/src/i18n/es.json`
- Create: `client/src/i18n/en.json`
- Create: `client/src/i18n/fr.json`
- Create: `client/src/i18n/de.json`
- Create: `client/src/i18n/nl.json`
- Create: `client/src/i18n/it.json`
- Create: `client/src/i18n/ru.json`
- Create: `client/src/i18n/ca.json`
- Create: `client/src/i18n/loader.ts`

### Task 9.2: Crear loader con lazy import

```typescript
// client/src/i18n/loader.ts
const loaders: Record<string, () => Promise<Record<string, string>>> = {
  es: () => import("./es.json").then(m => m.default),
  en: () => import("./en.json").then(m => m.default),
  fr: () => import("./fr.json").then(m => m.default),
  // ...
};

export async function loadTranslations(lang: string) {
  const loader = loaders[lang] || loaders.es;
  return loader();
}
```

### Task 9.3: Migrar traducciones del monolito

Extract translations from `client/src/lib/translations.ts` into individual JSON files, organized by section (nav, hero, fleet, booking, faq, footer, etc.).

### Task 9.4: Actualizar use-language hook

Modify the language context to load translations dynamically instead of importing the full 7,940-line bundle.

```bash
git commit -m "refactor: split translations into per-language files with dynamic loading"
```

---

## Resumen de Fases

| Fase | Scope | Prioridad | Esfuerzo | Archivos |
|------|-------|-----------|----------|----------|
| 1 | Seguridad critica | P0 | 4h | 6 |
| 2 | Performance DB | P0-P1 | 4h | 3 |
| 3 | Storage layer | P2 | 8h | 15+ |
| 4 | Servidor (routes, errors, config) | P1-P2 | 6h | 25+ |
| 5 | Cliente (hooks, components, API) | P2 | 5h | 15+ |
| 6 | Schema integridad | P1-P2 | 2h | 1 |
| 7 | SEO + Accesibilidad | P2 | 3h | 5 |
| 8 | Limpieza y deuda tecnica | P3 | 3h | 10+ |
| 9 | Traducciones | P2 | 6h | 12+ |
| **Total** | | | **~41h** | **90+** |

---

## Orden de Ejecucion Recomendado

1. **Fase 1** (Seguridad) -> deploy inmediato
2. **Fase 2** (Performance DB) -> deploy
3. **Fase 6** (Schema) -> deploy con Fase 2
4. **Fase 4.1-4.2** (Config + Error handling) -> base para todo lo demas
5. **Fase 3** (Storage) -> mayor refactor, necesita tiempo
6. **Fase 4.3-4.4** (Routes + Logger) -> depende de Fase 3
7. **Fase 5** (Cliente) -> independiente, puede ir en paralelo
8. **Fase 7** (SEO + A11y) -> independiente
9. **Fase 8** (Limpieza) -> al final
10. **Fase 9** (Traducciones) -> al final, mayor esfuerzo
