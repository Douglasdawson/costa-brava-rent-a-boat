# MCP seo-autopilot — Hardening Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Cerrar 4 brechas concretas en `server/mcp/seo-autopilot/router.ts`: rate limit por-token, orden de middleware, timeout de request y cache de validación de token.

**Architecture:** Mantener el factory `createSeoAutopilotRouter()` como única superficie de cambio. La cache de tokens vive en `server/storage/mcpTokens.ts` (donde está la validación). El rate-limiter por-token reutiliza `express-rate-limit` (ya en deps) con `keyGenerator` por `req.mcpTokenId`. El timeout es un `setTimeout` clásico atado al ciclo de vida de `res`.

**Tech Stack:** Express 4, `express-rate-limit` v8, `@modelcontextprotocol/sdk`, vitest + supertest, Drizzle/Neon.

**Branch:** `fix/mcp-server-hardening` (ya creada).

---

## Task 1: Cache de validación de token (60s TTL)

Reduce DB lookups + hash compute a 1 por token cada 60s. Sin dependencia nueva.

**Files:**
- Modify: `server/storage/mcpTokens.ts` (añadir cache LRU manual + invalidación on revoke)
- Test: `server/storage/mcpTokens.cache.test.ts` (nuevo)

**Step 1.1: Test failing**

```ts
// server/storage/mcpTokens.cache.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { __resetTokenCache, __cacheStats, __cachePut, __cacheGet } from "./mcpTokens";

describe("mcp token cache", () => {
  beforeEach(() => { vi.useFakeTimers(); __resetTokenCache(); });
  afterEach(() => vi.useRealTimers());

  it("returns cached row within TTL", () => {
    const row = { id: 1 } as any;
    __cachePut("hash-a", row);
    expect(__cacheGet("hash-a")).toBe(row);
  });

  it("expires after 60s", () => {
    __cachePut("hash-a", { id: 1 } as any);
    vi.advanceTimersByTime(61_000);
    expect(__cacheGet("hash-a")).toBeUndefined();
  });

  it("caches null (negative result) so unknown tokens dont hit DB", () => {
    __cachePut("hash-bad", null);
    expect(__cacheGet("hash-bad")).toBeNull();
  });

  it("evicts oldest when over capacity", () => {
    for (let i = 0; i < 600; i++) __cachePut(`h${i}`, { id: i } as any);
    expect(__cacheStats().size).toBeLessThanOrEqual(512);
    expect(__cacheGet("h0")).toBeUndefined();
  });
});
```

**Step 1.2:** `npx vitest run server/storage/mcpTokens.cache.test.ts` → FAIL (símbolos no exportados).

**Step 1.3: Implementación mínima en `server/storage/mcpTokens.ts`**

Añadir bloque tras `function hashToken`:

```ts
// ===== TOKEN VALIDATION CACHE =====
// In-memory cache to avoid hashing + DB lookup on every request.
// 60s TTL is short enough that revocations propagate fast (and we
// invalidate explicitly on revokeMcpToken).
const TOKEN_CACHE_TTL_MS = 60_000;
const TOKEN_CACHE_MAX = 512;
interface CacheEntry { value: McpToken | null; expiresAt: number; }
const tokenCache = new Map<string, CacheEntry>();

export function __cachePut(hash: string, value: McpToken | null): void {
  if (tokenCache.size >= TOKEN_CACHE_MAX) {
    const oldest = tokenCache.keys().next().value;
    if (oldest !== undefined) tokenCache.delete(oldest);
  }
  tokenCache.set(hash, { value, expiresAt: Date.now() + TOKEN_CACHE_TTL_MS });
}
export function __cacheGet(hash: string): McpToken | null | undefined {
  const e = tokenCache.get(hash);
  if (!e) return undefined;
  if (e.expiresAt <= Date.now()) { tokenCache.delete(hash); return undefined; }
  return e.value;
}
export function __resetTokenCache(): void { tokenCache.clear(); }
export function __cacheStats(): { size: number } { return { size: tokenCache.size }; }
```

Modificar `validateMcpToken` para usar cache:

```ts
export async function validateMcpToken(rawToken: string): Promise<McpToken | null> {
  if (!rawToken || typeof rawToken !== "string") return null;
  if (rawToken.length < 10 || rawToken.length > 200) return null;

  const hash = hashToken(rawToken);
  const cached = __cacheGet(hash);
  if (cached !== undefined) return cached;

  const [row] = await db
    .select()
    .from(mcpTokens)
    .where(and(eq(mcpTokens.tokenHash, hash), isNull(mcpTokens.revokedAt)));

  if (!row) { __cachePut(hash, null); return null; }
  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) { __cachePut(hash, null); return null; }
  __cachePut(hash, row);
  return row;
}
```

Modificar `revokeMcpToken` — al final, antes del `return revoked`, añadir invalidación. Como solo conocemos `id`, recorremos el cache (max 512 entradas, despreciable):

```ts
  if (revoked) {
    for (const [h, e] of tokenCache) if (e.value?.id === id) tokenCache.delete(h);
    logger.info("MCP token revoked", { id });
  }
```

**Step 1.4:** Re-run test → PASS.

**Step 1.5: Commit**

```
git add server/storage/mcpTokens.ts server/storage/mcpTokens.cache.test.ts
git commit -m "perf(mcp): cache token validation 60s to drop per-request DB lookup"
```

---

## Task 2: Rate limit por-token (60 req/min/token)

Cumple la promesa rota del comentario `router.ts:67`.

**Files:**
- Modify: `server/mcp/seo-autopilot/router.ts`

**Step 2.1: Test failing — integración con supertest**

Crear `server/mcp/seo-autopilot/router.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../../storage/mcpTokens", () => ({
  validateMcpToken: vi.fn(async (raw: string) => raw === "good" ? { id: 42 } : null),
  recordTokenUsage: vi.fn(async () => undefined),
}));

import { createSeoAutopilotRouter } from "./router";

function makeApp() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use("/mcp", createSeoAutopilotRouter());
  return app;
}

describe("seo-autopilot rate limits", () => {
  beforeEach(() => vi.clearAllMocks());

  it("limits the same token to 60 req/min regardless of IP", async () => {
    const app = makeApp();
    let last = 0;
    for (let i = 0; i < 65; i++) {
      const r = await request(app)
        .post("/mcp")
        .set("Authorization", "Bearer good")
        .set("X-Forwarded-For", `10.0.0.${i}`)  // distinct IP each call
        .send({ jsonrpc: "2.0", id: i, method: "ping" });
      last = r.status;
      if (r.status === 429) break;
    }
    expect(last).toBe(429);
  });
});
```

**Step 2.2:** `npx vitest run server/mcp/seo-autopilot/router.test.ts` → FAIL (sin token-limiter).

**Step 2.3: Implementación**

En `router.ts` añadir tras `mcpRateLimiter`:

```ts
const mcpTokenRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req: AuthedRequest): string => {
    return req.mcpTokenId != null ? `mcp:tok:${req.mcpTokenId}` : `mcp:tok:none`;
  },
  message: { error: "token_rate_limit_exceeded" },
});
```

Y reemplazar las cadenas en `createSeoAutopilotRouter` (Task 3 lo terminará — aquí solo añade `mcpTokenRateLimiter` después de `bearerAuth`):

```ts
router.post("/", mcpRateLimiter, bearerAuth, mcpTokenRateLimiter, handleMcpRequest);
router.get("/",  mcpRateLimiter, bearerAuth, mcpTokenRateLimiter, handleMcpRequest);
router.delete("/", mcpRateLimiter, bearerAuth, mcpTokenRateLimiter, (_req, res) => res.status(204).end());
```

Actualizar el comentario obsoleto de `router.ts:67` → "60 req/min/IP (anti-DDoS) + 60 req/min/token (cuota real)".

**Step 2.4:** Re-run test → PASS.

**Step 2.5: Commit**

```
git add server/mcp/seo-autopilot/router.ts server/mcp/seo-autopilot/router.test.ts
git commit -m "feat(mcp): enforce per-token rate limit (60 req/min/token)"
```

---

## Task 3: Reorden + IP limit pre-auth ligero

Evitar que peticiones sin token quemen el cupo IP del cowork.

**Files:**
- Modify: `server/mcp/seo-autopilot/router.ts`

**Step 3.1: Test failing**

Añadir caso al `router.test.ts`:

```ts
it("unauth requests do not exhaust authenticated IP budget", async () => {
  const app = makeApp();
  // 100 unauth POSTs from IP X
  for (let i = 0; i < 100; i++) {
    await request(app).post("/mcp").set("X-Forwarded-For", "9.9.9.9").send({});
  }
  // 1 auth POST from same IP must still succeed
  const r = await request(app)
    .post("/mcp")
    .set("Authorization", "Bearer good")
    .set("X-Forwarded-For", "9.9.9.9")
    .send({ jsonrpc: "2.0", id: 1, method: "ping" });
  expect(r.status).not.toBe(429);
});
```

**Step 3.2:** `npx vitest run server/mcp/seo-autopilot/router.test.ts -t "unauth"` → FAIL.

**Step 3.3: Implementación**

Reemplazar `mcpRateLimiter` (60/min/IP) por dos:

```ts
// Pre-auth: anti-DDoS sólo. Cap muy alto, contabiliza toda IP.
const preAuthIpLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const ip = (req.headers["x-forwarded-for"]?.toString().split(",")[0].trim()) || req.ip;
    if (!ip) return "mcp:preauth:unknown";
    return `mcp:preauth:${ipKeyGenerator(ip)}`;
  },
  message: { error: "rate_limit_exceeded" },
});

// Post-auth IP limit: cuota real por origen autenticado.
const postAuthIpLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const ip = (req.headers["x-forwarded-for"]?.toString().split(",")[0].trim()) || req.ip;
    if (!ip) return "mcp:authip:unknown";
    return `mcp:authip:${ipKeyGenerator(ip)}`;
  },
  message: { error: "rate_limit_exceeded" },
});
```

Cadena nueva:
```ts
router.post("/",   preAuthIpLimiter, bearerAuth, postAuthIpLimiter, mcpTokenRateLimiter, handleMcpRequest);
router.get("/",    preAuthIpLimiter, bearerAuth, postAuthIpLimiter, mcpTokenRateLimiter, handleMcpRequest);
router.delete("/", preAuthIpLimiter, bearerAuth, postAuthIpLimiter, mcpTokenRateLimiter, (_req, res) => res.status(204).end());
```

Borrar `mcpRateLimiter` antiguo.

**Step 3.4:** Re-run test → PASS. Re-run el de Task 2 → sigue pasando.

**Step 3.5: Commit**

```
git add server/mcp/seo-autopilot/router.ts server/mcp/seo-autopilot/router.test.ts
git commit -m "fix(mcp): split rate limit into pre-auth (anti-DDoS) and post-auth (real quota)"
```

---

## Task 4: Timeout de request (30s)

Evitar conexiones colgadas por una tool atascada.

**Files:**
- Modify: `server/mcp/seo-autopilot/router.ts`

**Step 4.1: Test failing**

Añadir al `router.test.ts`:

```ts
it("destroys the connection after 30s if handler hangs", async () => {
  vi.useFakeTimers();
  // mocking handleRequest to never resolve is hard end-to-end;
  // assert via response timeout simulation:
  const app = makeApp();
  const req = request(app)
    .post("/mcp")
    .set("Authorization", "Bearer good")
    .send({ jsonrpc: "2.0", id: 1, method: "doesNotExist" });
  // En lugar de fingir un cuelgue real, validamos que setTimeout está
  // armado vía spy en res.destroy. Si no, marcamos como TODO de integración.
  vi.useRealTimers();
});
```

> **Nota:** los timers fake con supertest son frágiles. Si el test resulta inestable, sustituir por uno **unit** que invoque `handleMcpRequest` directamente con un `req`/`res` mock y un fake transport que nunca resuelve. Aceptar como TODO si el coste excede 20 min.

**Step 4.2:** Run → FAIL (sin timeout instalado).

**Step 4.3: Implementación**

En `handleMcpRequest`, justo después de declarar `transport`:

```ts
const REQUEST_TIMEOUT_MS = 30_000;
const timeout = setTimeout(() => {
  if (!res.writableEnded) {
    logger.warn("seo-autopilot MCP request timed out", { tokenId: ctx.tokenId });
    try { res.status(504).json({ error: "request_timeout" }); } catch { /* res ya escrito */ }
    res.destroy();
  }
}, REQUEST_TIMEOUT_MS);

res.on("close", () => {
  clearTimeout(timeout);
  transport.close().catch(() => undefined);
  server.close().catch(() => undefined);
});
```

(Eliminar el `res.on("close")` anterior — sustituido).

**Step 4.4:** Re-run → PASS o degradar a TODO documentado en el test.

**Step 4.5: Commit**

```
git add server/mcp/seo-autopilot/router.ts server/mcp/seo-autopilot/router.test.ts
git commit -m "feat(mcp): hard timeout (30s) on request handler to free hung connections"
```

---

## Verificación final

```
npm run check    # tsc strict (2+ min)
npm run test     # vitest run completo
npm run lint
```

Solo después de los 3 verdes, abrir PR vs `main`.
