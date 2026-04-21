# Especificacion — MCP Publico `seo-autopilot-mcp` + Dashboard CRM

> Este documento contiene la especificacion tecnica para que Claude Code en la web implemente:
> 1. Un nuevo MCP publico (HTTP + SSE con auth por token) que expone el motor SEO a Cowork.
> 2. Un nuevo tab "SEO Autopilot" en el panel admin CRM.
>
> Complementa `GOD_PLAN_SEO.md` secciones 7 y 8.

---

## Parte A — MCP publico `seo-autopilot-mcp`

### A.1 Ubicacion y scaffolding
```
server/mcp/
  seo-autopilot-server.ts       # nuevo — servidor MCP (HTTP+SSE)
  shared/
    seo-autopilot-helpers.ts    # utilidades compartidas
```

### A.2 Transport
Exponer mediante HTTP SSE en `/mcp/seo-autopilot` en el mismo server Express ya existente (`server/index.ts`), con endpoint dedicado:
- `GET /mcp/seo-autopilot/sse` — stream SSE
- `POST /mcp/seo-autopilot/rpc` — JSON-RPC message

### A.3 Autenticacion
- Bearer token: header `Authorization: Bearer <token>`
- Tokens almacenados en tabla nueva `mcpTokens`:
  ```sql
  id, name, tokenHash, createdAt, expiresAt, lastUsedAt, revoked
  ```
- Generacion desde el dashboard (boton "Generar token").
- Rotacion: al crear un nuevo token, marca el anterior con expiresAt = now+48h (gracia).
- Rate limit: 60 req/min/token (re-usar `express-rate-limit`).

### A.4 Tools expuestos
Cada tool devuelve `{ content: [{ type: "text", text: JSON }] }` segun estandar MCP.

**Categoria: Dashboard**
```ts
dashboard_summary() -> { kpis, alerts, recentRuns, revenue30d }
weekly_briefing() -> { winners, drops, opportunities, actions }
```

**Categoria: Contenido (wrap content-server + extensiones)**
```ts
blog_generate(cluster?: string, keyword?: string) -> { slug, wordCount, status }
blog_refresh(slug: string) -> { slug, changes, newScore }
blog_distribute(slug: string, platforms?: string[]) -> { generatedPieces, published, pending }
list_blog_posts(publishedSince?: string, status?: string) -> BlogPost[]
```

**Categoria: Tecnico**
```ts
technical_audit(types?: string[]) -> Issue[]
fix_cannibalization(cases: CaseId[], mode: "merge"|"differentiate") -> Result[]
fix_orphans(urls: string[]) -> { linksAdded }
cwv_latest() -> { urls: [{ url, lcp, inp, cls, ttfb }] }
```

**Categoria: Keywords**
```ts
keywords_add(keywords: Array<{keyword, cluster, language, tier, url}>) -> { inserted }
keywords_top_opportunities(limit?: number) -> Keyword[]
seo_keywords(cluster?, minPosition?, maxPosition?, limit?) -> Keyword[]
```

**Categoria: Outreach**
```ts
outreach_queue(limit?: number) -> Target[]
outreach_send(targetId: string, emailDraft: EmailDraft) -> { messageId, status }
outreach_send_batch(batch: OutreachItem[]) -> BatchResult
backlinks_audit(since?: string) -> { new, lost }
```

**Categoria: Local / GBP**
```ts
gbp_publish(post: GbpPost) -> { postId, url }
gbp_reviews_fetch(since?: string) -> Review[]
```

**Categoria: GEO (IA)**
```ts
geo_optimize(url: string) -> { changes, newScore }
geo_prompts_sweep(prompts?: string[]) -> Citation[]
geo_status() -> { perplexity, chatgpt, googleAi, claude }
```

**Categoria: Distribucion a plataformas**
```ts
medium_publish(article: MediumArticle) -> { url }
linkedin_publish(article: LinkedInArticle) -> { url }
```

**Categoria: Bookings / Reviews**
```ts
bookings_completed(since: string) -> Booking[]
review_request_send(bookingId: string) -> { sent }
```

**Categoria: Competencia**
```ts
competitor_snapshot(url: string) -> Snapshot
competitor_opportunities(since?: string) -> Opportunity[]
```

### A.5 Autoapprove flag
Variable de entorno `SEO_AUTOPILOT_AUTO_APPROVE` con valores:
- `off` — todo requiere aprobacion en dashboard
- `safe` — auto-aprueba acciones safe (internal links, schema fixes, freshness)
- `full` — auto-aprueba todo (solo para maduro)

### A.6 Audit log
Toda invocacion se escribe en `audit.ts` con: tool, params, tokenName, resultSize, durationMs, success.

### A.7 Registro en el registry de Cowork
Registrar el MCP en el registry publico o internamente. URL: `https://costabravarentaboat.com/mcp/seo-autopilot`

---

## Parte B — Dashboard "SEO Autopilot" en Admin CRM

### B.1 Arquitectura
- Nuevo tab en `AdminLayout.tsx` con icono de cohete.
- Pagina principal `SeoAutopilotTab.tsx` con sub-rutas via react-router o sub-tabs internas.
- Estado global via React Context para datos compartidos.

### B.2 Estructura de archivos
```
client/src/components/crm/
  SeoAutopilotTab.tsx                     # container
  seo-autopilot/
    Overview.tsx                          # KPIs + cards
    KeywordRadar.tsx                      # tabla + sparklines
    ContentPipeline.tsx                   # queue autopilot + historial
    DistributionTray.tsx                  # piezas pendientes de publicar
    OutreachPanel.tsx                     # emails + respuestas
    LocalPanel.tsx                        # GBP + reviews
    GeoPanel.tsx                          # citas IA
    ExperimentsPanel.tsx                  # A/B tests
    AlertsFeed.tsx                        # alertas + resolucion
    AuditLog.tsx                          # historial acciones autopilot
    TokenManager.tsx                      # gestion de tokens MCP
    shared/
      SparklineCell.tsx
      KpiCard.tsx
      StatusBadge.tsx
      ActionButton.tsx                    # con confirm modal
```

### B.3 Endpoints API nuevos
En `server/routes/admin-seo-autopilot.ts`:
```
GET    /api/admin/seo-autopilot/overview
GET    /api/admin/seo-autopilot/keywords?cluster=&lang=&pos=
GET    /api/admin/seo-autopilot/queue
GET    /api/admin/seo-autopilot/history
POST   /api/admin/seo-autopilot/distribute/:slug
GET    /api/admin/seo-autopilot/distribution-tray
POST   /api/admin/seo-autopilot/distribution-tray/:id/mark-published
GET    /api/admin/seo-autopilot/outreach
POST   /api/admin/seo-autopilot/outreach/send
GET    /api/admin/seo-autopilot/gbp
POST   /api/admin/seo-autopilot/gbp/publish
GET    /api/admin/seo-autopilot/geo
GET    /api/admin/seo-autopilot/experiments
POST   /api/admin/seo-autopilot/experiment/:id/conclude
GET    /api/admin/seo-autopilot/alerts
POST   /api/admin/seo-autopilot/alerts/:id/ack
GET    /api/admin/seo-autopilot/audit
GET    /api/admin/seo-autopilot/tokens
POST   /api/admin/seo-autopilot/tokens
DELETE /api/admin/seo-autopilot/tokens/:id
```

Todos con `requireAdminSession`.

Registrar en `server/routes/index.ts`:
```ts
import { registerSeoAutopilotRoutes } from "./admin-seo-autopilot";
registerSeoAutopilotRoutes(app, storage);
```

### B.4 Storage layer
Nuevo `server/storage/seoAutopilot.ts` con:
- `getOverviewData()`
- `getKeywordsFiltered(filters)`
- `getQueue()`
- `getDistributionTray()`, `markDistributionItem(id)`
- `getOutreachCampaigns()`, `sendOutreachEmail(data)`
- `getGeoStatus()`
- `getExperiments()`, `concludeExperiment(id)`
- `getAlerts()`, `ackAlert(id)`
- `getAuditLog(filters)`
- `createMcpToken(name)`, `listMcpTokens()`, `revokeMcpToken(id)`

### B.5 Schemas
Nueva tabla `mcpTokens` en `shared/schema.ts`:
```ts
export const mcpTokens = pgTable("mcp_tokens", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tokenHash: text("token_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  lastUsedAt: timestamp("last_used_at"),
  revoked: boolean("revoked").default(false),
});
```

Nueva tabla `distributionTray`:
```ts
export const distributionTray = pgTable("distribution_tray", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  platform: text("platform").notNull(),
  content: text("content").notNull(),
  status: text("status").default("pending"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### B.6 UX principles
- Todo accion destructiva tiene modal de confirmacion.
- Toda accion autopilot tiene badge "auto" vs "manual".
- Estados con color consistente: verde (ok), amarillo (atencion), rojo (critico), azul (info), gris (neutral).
- Mobile-first pero este dashboard es admin → prioridad desktop.
- Usar shadcn/ui componentes existentes.

### B.7 Integracion con i18n
El dashboard es para uso interno del propietario → solo en espanol (no multilang).

---

## Parte C — Plan de implementacion (Fase 0 detallada)

### C.1 Orden de tareas para Claude Code (en la web)

1. **Schema DB**
   - Anadir `mcpTokens` y `distributionTray` a `shared/schema.ts`
   - Ejecutar `npm run db:push`

2. **Storage layer**
   - Crear `server/storage/seoAutopilot.ts` con todas las funciones
   - Crear `server/storage/mcpTokens.ts`

3. **MCP server**
   - Crear `server/mcp/seo-autopilot-server.ts`
   - Integrar con Express en `server/index.ts` (ruta `/mcp/seo-autopilot/*`)
   - Middleware de auth con token
   - Implementar las ~25 tools (wrapping de MCPs internos + nuevas)

4. **Endpoints admin**
   - Crear `server/routes/admin-seo-autopilot.ts`
   - Registrar en `server/routes/index.ts`

5. **Frontend CRM**
   - Crear `client/src/components/crm/SeoAutopilotTab.tsx`
   - Crear todos los sub-componentes
   - Integrar en `AdminLayout.tsx`

6. **Tests**
   - Tests unitarios de storage
   - Tests de endpoint auth
   - Tests de MCP tools
   - Smoke test end-to-end

7. **Deploy**
   - Verify env vars: `SEO_MCP_TOKEN_SALT`, `SEO_AUTOPILOT_AUTO_APPROVE`, etc.
   - Deploy a staging
   - Primera ejecucion real en staging con 1 post de prueba
   - Deploy a produccion

### C.2 Checklist pre-activacion de crons
Antes de crear las 14 scheduled tasks en Cowork, verificar:
- [ ] MCP desplegado y accesible
- [ ] Token generado y guardado
- [ ] Cowork registra el MCP
- [ ] Primera invocacion end-to-end exitosa desde Cowork
- [ ] Dashboard muestra datos reales
- [ ] Budget guards probados (aborta si >limite)
- [ ] Rate limit probado
- [ ] Logs se escriben correctamente
- [ ] Notificaciones al usuario llegan

---

## Parte D — Riesgos tecnicos

| Riesgo | Mitigacion |
|--------|------------|
| Expose publico del MCP crea vector de ataque | Bearer token rotado + rate limit + IP allowlist opcional + audit log |
| Auto-publish a Medium/LinkedIn desencaja politicas | Flag auto-approve desactivado por defecto + usuario valida primeras publicaciones |
| Coste Claude API escala | `quotas.ts` con presupuesto diario/mensual + circuit breaker |
| Race conditions entre cron jobs | Locks via DB con `pg_advisory_lock` o tabla `jobLocks` |
| MCP SSE connection drops | Heartbeat + reconexion automatica + idempotency keys |
| Cambio breaking en content-server o seo-engine | Tests de integracion + versioning de tools |

---

## Parte E — KPIs del sistema

Para verificar que el sistema funciona:
- Tareas completadas/semana vs programadas (SLA 95%)
- Tiempo medio de cron (debe ser <5 min salvo blog generation y distribution)
- Errores del motor (alertar si >2/dia)
- Coste Claude API diario (alertar si >X EUR)
- Acciones auto vs manuales (metrics de autonomia)
- Latencia MCP (p95 <2s)
