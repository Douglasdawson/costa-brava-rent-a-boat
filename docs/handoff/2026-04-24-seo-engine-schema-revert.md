# Handoff — SEO Engine schema revert investigation

## Fecha: 2026-04-24
## Estado: PENDIENTE root-cause analysis

---

## Resumen en 3 líneas

- Los handlers `/api/admin/seo/dashboard` y `/api/admin/seo/alerts` (+ otros) devuelven **500** con sesión autenticada.
- Causa inmediata: el schema de las tablas `seo_*` en Neon **revirtió al estado LEGACY** (pre-`ef5b300`) después del Publish del deploy.
- Mecanismo de reversión: **DESCONOCIDO**. Descartados: drizzle-kit en el pipeline de Replit, desalineamiento de `shared/schema.ts`.

---

## Cronología del día

| Hora | Commit / Acción | Resultado |
|---|---|---|
| ~11:30 | `fa9f50e` — registra `/api/admin/seo/*` en Express | Endpoints montados, pero responden 500 porque DB tiene schema viejo |
| ~13:30 | Aplico manualmente `migrations/0001_sync_seo_engine_to_db.sql` vía `tsx` | DB sincronizada al schema NUEVO. 12 tablas DROP+CREATE (estaban vacías) + ADD COLUMN `language` en `seo_keywords` (175 rows backfilled a `'es'`) |
| ~13:47 | `ef5b300` — commit con la migración SQL + fix de deuda schema | Push OK |
| ~14:00 | Validación post-migración: 11/11 queries OK, INSERT smoke en `seo_alerts` OK, endpoints `/api/admin/seo/*` devuelven **401** sin auth (era 500) | Confirmado funcionando |
| ~14:15-14:30 | Crons empiezan a escribir tras sincronización: `seo_alerts` +9, `seo_health_checks` +16, `seo_keywords` +1 | Pipeline SEO Engine viva |
| ~14:45 | `0aeabdf` — label "SEO Engine (beta)" en nav CRM | Push OK |
| ~15:00 | Replit Deploy UI muestra validación de migraciones fallida: `ALTER seo_health_checks.checked_at SET NOT NULL` falla por 16 NULLs | Aplico UPDATE a mano para poblar NULLs |
| ~15:10 | Replit Deploy UI vuelve a mostrar prompt: "Is `period` column in seo_reports created or renamed?" | Aconsejo NO escoger ninguna opción destructiva |
| ~15:20 | Otra sesión de Claude (en Chrome) reporta deploy **completado** sin pedir decisiones — el prompt se fue solo | Deploy publicado con commit `0aeabdf` |
| ~15:35 | Verifico en live: el bundle `CRMDashboard-CW2iwgUh.js` contiene `"SEO Engine (beta)"` → código nuevo ESTÁ desplegado | OK |
| ~15:40 | Ivan observa en Chrome Network tab: `/api/admin/seo/dashboard` y `/alerts` devuelven **500** con auth | Contradicción con mi validación previa |
| ~15:50 | Investigación: ejecuto las queries del handler contra DB live → `column "title" does not exist`, `column "language" does not exist` | **DB revirtió a schema LEGACY** |

---

## Lo que SÍ sabemos (verificado fresco, 2026-04-24 ~16:00)

### 1. `shared/schema.ts` está correctamente alineado con el schema NUEVO

```ts
// seoKeywords (líneas ~1540-1551)
language: varchar("language", { length: 5 }).notNull()  ✅ NEW

// seoAlerts (líneas ~1749-1764)
title: text("title").notNull()                          ✅ NEW
status: text("status")                                  ✅ NEW
sentVia: text("sent_via")                               ✅ NEW
resolvedAt: timestamp("resolved_at", { withTimezone: true })  ✅ NEW
// NO tiene `resolved` (legacy)

// seoReports (líneas ~1766-1778)
periodStart: date("period_start").notNull()             ✅ NEW
periodEnd: date("period_end").notNull()                 ✅ NEW
summary: text("summary")                                ✅ NEW
sentVia: text("sent_via")                               ✅ NEW
// NO tiene `period` ni `insights` (legacy)

// seoExperiments (líneas ~1642-1662)
action, previousValue, newValue, executedAt, measureAt,
baselineMetrics, resultMetrics, learning, agentReasoning  ✅ NEW
// NO tiene variant_a/variant_b/metric/winner/lift/... (legacy)
```

**Conclusión**: schema.ts NO necesita cambios. Ya refleja el estado NUEVO esperado.

### 2. `server/routes/admin-seo.ts` (handlers) pide las columnas NEW

- `/dashboard`: `SELECT COUNT(*) FROM seo_alerts WHERE status = 'new'` y `INNER JOIN seo_rankings ON keyword_id = seo_keywords.id ORDER BY impressions DESC LIMIT 10` (implícitamente requiere `seo_keywords.language` para el select de todas las columnas)
- `/alerts`: `SELECT id, type, severity, title, message, data, status, sent_via, created_at, resolved_at FROM seo_alerts`

Ambos fallan porque la DB actual NO tiene `status`, `title`, `sent_via`, `resolved_at` ni `language`.

### 3. Replit NO ejecuta drizzle-kit en su pipeline de deploy

```toml
# .replit
[deployment]
build = ["npm", "run", "build"]   # → "vite build && esbuild server/index.ts ..."
run   = ["npm", "run", "start"]   # → "NODE_ENV=production node dist/index.js"
```

```json
# package.json scripts — no hay db:push, db:migrate, postinstall con drizzle,
# prebuild ni predeploy que mencionen drizzle-kit
"build":  "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
"start":  "NODE_ENV=production node dist/index.js",
```

```ts
# drizzle.config.ts — config estándar, sin hooks de deploy
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
});
```

Ni `npm run build` ni `npm run start` tocan la DB. Replit no invoca `drizzle-kit push` ni `drizzle-kit migrate` en su pipeline.

### 4. Journal de migraciones

```json
# migrations/meta/_journal.json
{
  "version": "7",
  "entries": [{"idx": 0, "tag": "0000_bitter_forgotten_one", ...}]
}
```

Solo contiene el baseline. Mi `0001_sync_seo_engine_to_db.sql` existe en el disk **pero NO está registrada en el journal** — drizzle-kit migrate la ignoraría si corriera.

### 5. Estado actual DB (verificado hoy ~16:00)

```
seo_keywords:    id, keyword, volume, intent, cluster, tracked, created_at
                 [ Falta: language ]
                 Count: 176 rows (datos preservados)

seo_alerts:      id, type, severity, message, data, created_at, resolved
                 [ Falta: title, status, sent_via, resolved_at ]
                 [ Sobra: resolved (legacy) ]

seo_reports:     id, type, data, created_at, period, insights
                 [ Falta: period_start, period_end, summary, sent_via ]
                 [ Sobra: period, insights (legacy) ]

seo_experiments: id, campaign_id, type, page, hypothesis, status,
                 created_at, variant_a, variant_b, metric, started_at,
                 ended_at, winner, lift, confidence, notes
                 [ Falta: action, previous_value, new_value, executed_at,
                          measure_at, baseline_metrics, result_metrics,
                          learning, agent_reasoning ]
                 [ Sobra: variant_a/b, metric, winner, lift, confidence, notes ]

Backup tables _bk_seo_*: NO EXISTEN (fueron borradas durante el proceso)
```

---

## Lo que NO sabemos

### El mecanismo exacto de reversión

Los datos están preservados (`seo_keywords` sigue con 176 rows, no 175 — la fila nueva que los crons metieron post-migración sigue ahí), pero el schema revirtió. Eso descarta:
- Restore desde backup `_bk_*` (hubiera quedado con 175 rows)
- Recreación de la tabla desde cero (los datos se habrían perdido)

Lo que se hizo fue un **ALTER masivo**: DROP COLUMN (language, title, status, sent_via, resolved_at, action, etc.) + ADD COLUMN (resolved, period, insights, variant_a, etc.) **preservando las rows**. Solo un sistema comparando contra un schema LEGACY y aplicando los diffs en orden inverso explica ese patrón.

### Candidatos para el culpable

1. **Replit Database "validation" del UI de Deploy** — Ivan vio prompts tipo "Is `period` renamed to X?" antes del deploy. Aunque dijo que no escogió ninguna opción, el prompt DESAPARECIÓ sin intervención (otra sesión Claude en Chrome lo reportó). Posibilidad: Replit aplicó el "default action" tras timeout, que es revertir al schema del snapshot interno.

2. **Otra sesión de Claude Code ejecutó `npm run db:push`** contra un `shared/schema.ts` que tenía temporalmente la versión LEGACY. No encontré evidencia en git log — todos los commits recientes tienen la versión NEW. Pero un push local sin commit no deja rastro en git.

3. **Replit Database auto-sync / rollback feature** — alguna característica de la plataforma que detectó "migration validation errors" y aplicó un rollback automático al estado previo (snapshot interno) para preservar disponibilidad.

4. **Snapshot interno de Replit con el schema LEGACY** — si Replit cachea un snapshot de schema cuando detecta un deploy y decide "promover" después del deploy, podría haber promovido el snapshot VIEJO sobre la DB actual.

Ninguno confirmado.

---

## Evidencia concreta

### Commits relevantes (en `origin/main`)

| Hash | Mensaje | Relevancia |
|---|---|---|
| `40a69e6` | feat(seo-engine): add 17 SEO knowledge base tables | Refactor original de schema.ts (40 días atrás). Cambió las columnas pero nunca se corrió `db:push`. |
| `fa9f50e` | fix(routes): register missing admin-seo routes in express app | Monta `/api/admin/seo/*` en Express. De 404 → 401/500. |
| `ef5b300` | fix(seo-engine): migrate prod DB schema to match shared/schema.ts (40-day drift) | **Incluye `migrations/0001_sync_seo_engine_to_db.sql`** — la migración que hay que re-aplicar. Ver `git show ef5b300 -- migrations/0001_sync_seo_engine_to_db.sql`. |
| `0aeabdf` | feat(crm): mark SEO Engine tab as beta in nav label | UX: añade "(beta)" al label. Deployado correctamente (bundle contiene el string). |
| `999ab21` | docs(mcp): fix autopilot MCP server URL in planning docs | Cosmético. |

### Operación manual DB que NO está en git

```sql
-- Aplicado ~15:00 el 2026-04-24 para desbloquear validación de deploy
UPDATE seo_health_checks SET checked_at = created_at WHERE checked_at IS NULL;
-- Resultado: 16 filas actualizadas. NULLs: 16 → 0.
-- Estado actual DESCONOCIDO (puede haber revertido junto con el resto del schema).
```

### Empirical smoke

```bash
# Con auth (cookie admin) en Chrome Network tab (Ivan):
GET /api/admin/seo/dashboard  → 500  (handler ejecuta query, falla en column)
GET /api/admin/seo/alerts     → 500  (idem)

# Sin auth (mi curl):
GET /api/admin/seo/dashboard  → 401  (middleware requireAdminSession)
# Mi curl NO reveló el bug porque no alcanzó el handler.
```

### Verificación de handler ejecutando queries contra DB live (mismos SQL que Drizzle generaría)

```
✓ SELECT COUNT(*) FROM seo_keywords               → 176
✓ SELECT COUNT(*) FROM seo_campaigns WHERE ...    → 0
✓ SELECT COUNT(*) FROM seo_experiments WHERE ...  → 0
✗ SELECT COUNT(*) FROM seo_alerts WHERE status='new'
    → ERROR: column "status" does not exist
✗ SELECT * FROM seo_rankings JOIN seo_keywords ...
    → ERROR: column seo_keywords.language does not exist
✗ SELECT title, status, sent_via, ... FROM seo_alerts
    → ERROR: column "title" does not exist
```

---

## Plan de ataque para sesión fresca (2026-04-25)

### Fase 1 — Identificar el mecanismo de reversión (1-2h de investigación)

1. **Revisar UI de Replit Database** (Workspace → Database en Replit):
   - Buscar una tab tipo "Migrations" o "Schema history"
   - Verificar si hay "migrations applied automatically" o similar
   - Revisar si existe un toggle "Auto-sync schema with deploy"

2. **Revisar logs del último Publish en Replit Deploy**:
   - Replit UI → Deployments → último "Published your App" → ver logs completos
   - Buscar evidencia de drizzle-kit / db:push / ALTER TABLE
   - Buscar cualquier step entre "Build complete" y "Deploy successful" que toque DB

3. **Grep de cualquier feature Replit-specific en el repo**:
   ```bash
   grep -rn "replit.*migrate\|replit.*database\|REPLIT_DB\|.replit" . \
     --include="*.ts" --include="*.toml" --include="*.json" | head
   ```

4. **Revisar cualquier workflow o integration configurada**:
   ```bash
   cat .replit | grep -A 5 "workflows\|integrations\|agent"
   ```

5. **Si todo lo anterior viene negativo, abrir ticket/ask a Replit support** con el caso concreto: "después de Publish, mi schema de DB revierte de X a Y sin que haya drizzle-kit en el pipeline".

### Fase 2 — Desactivar el mecanismo (si se identifica)

Varía según hallazgo de Fase 1. Posibles:
- Toggle off en Replit Database UI
- Env var
- Config en `.replit`
- Hook pre-/post-deploy a sobrescribir

### Fase 3 — Re-aplicar migración

```bash
# Desde el repo, con DATABASE_URL en .env
npx tsx <script-que-lee-migrations/0001_sync_seo_engine_to_db.sql-y-ejecuta>
# O equivalente con drizzle-kit si es seguro.
```

Después:
```bash
# Verificar
curl -s -o /dev/null -w "%{http_code}" \
  -b "<admin-session-cookie>" \
  https://www.costabravarentaboat.com/api/admin/seo/dashboard
# Esperado: 200
```

### Fase 4 — Verificar persistencia post-deploy

1. Hacer un Publish menor (ej. bump de un comentario) en Replit
2. Inmediatamente después del "Published your App", ejecutar las mismas queries de validación contra DB
3. Si las columnas NEW siguen existiendo → reversión resuelta
4. Si volvieron a LEGACY → Fase 1 no identificó el mecanismo correcto, volver a investigar

### Fase 5 — Commit del aprendizaje

Actualizar este `.md` con:
- Mecanismo identificado
- Cómo se desactivó
- Una línea de test/CI check para prevenir recurrencia (ej. post-deploy verificar que `SELECT column_name FROM information_schema.columns WHERE table_name='seo_alerts' AND column_name='status'` devuelve 1)

---

## Archivos relevantes (referencia rápida)

- `migrations/0001_sync_seo_engine_to_db.sql` — **la migración a re-aplicar** (270 líneas, atómica, idempotente con `IF NOT EXISTS`)
- `shared/schema.ts` líneas 1540-1798 — definiciones de las tablas `seo_*` (ya con versión NEW)
- `server/routes/admin-seo.ts` — 13 handlers que esperan columnas NEW
- `server/seo/collectors/*.ts`, `server/seo/monitor.ts`, `server/seo/executors/*.ts`, `server/seo/feedback/*.ts`, `server/seo/reports/weekly.ts`, `server/seo/reports/sem.ts`, `server/seo/validators/schema.ts` — writers que también usan columnas NEW
- `.replit`, `replit.nix`, `package.json`, `drizzle.config.ts` — **pipeline verificado limpio, no corren drizzle-kit en deploy**
- `migrations/meta/_journal.json` — journal drizzle-kit (solo `0000_bitter_forgotten_one`)

## Routine scheduled a tener en mente

`trig_01BF7rsGycp2NC4nGb8qVYta` corre el **2026-05-01 10:00 Europe/Madrid** para verificar post-deploy y borrar backups (`_bk_seo_*`) si todo OK. Los backups ya no existen (se borraron en la reversión), así que esa routine podría fallar o reportar "backups already gone". Considerar cancelarla o modificar su prompt después de que resolvamos la reversión.

## Hipótesis descartadas (no perseguir de nuevo)

- ❌ "schema.ts está desalineado" → FALSO, verificado que está correcto
- ❌ "drizzle-kit corre en el pipeline de Replit" → FALSO, ni `.replit` ni `package.json` lo invocan
- ❌ "Los writers usan field names legacy" → FALSO, 11/11 writers usan campos NEW (verificado en misión previa F0.3)
- ❌ "La migración 0001 nunca se aplicó" → FALSO, los commits y logs de sesión confirman que se aplicó y funcionó durante ~90 minutos

## Verificación post-fix (criterios de éxito)

1. Con sesión admin en Chrome: `curl -b "cookie" /api/admin/seo/dashboard` → **200** con JSON válido
2. Navegar `/crm/seo` → las 7 sub-pestañas cargan sin 500 en Network tab
3. Hacer un Publish trivial en Replit → verificar que el schema **persiste** (no revierte)
4. `SELECT column_name FROM information_schema.columns WHERE table_name='seo_alerts'` → debe incluir `title, status, sent_via, resolved_at`, NO `resolved`

Cuando los 4 criterios pasen, la misión cierra.
