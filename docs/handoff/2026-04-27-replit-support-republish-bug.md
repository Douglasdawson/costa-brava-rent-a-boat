# Handoff — Replit Support ticket: Republish silently reverts git commits & drops DB tables

## Fecha apertura: 2026-04-27
## Estado: ESPERANDO respuesta de Replit (ya pasaron 2 vueltas: nuestro report → Quinn pide datos → nuestro reply con datos)
## Contacto Replit: Quinn (Replit Support)
## Canal: email a `support@replit.com`

---

## Resumen en 3 líneas

- Replit "Republish" escribe commits automáticos `Published your App` directamente en `origin/main` del repo de GitHub que **revierten código que añadimos después del último Publish manual completo**.
- El mismo mecanismo **dropea tablas de la base de datos Neon** que se añadieron después del snapshot.
- Tenemos hashes y session IDs reproducibles. Quinn confirmó que NO es comportamiento esperado y va a escalar a ingeniería en cuanto le pasemos un Private Join Link.

---

## Cronología

| Cuándo | Qué | Quién |
|---|---|---|
| 2026-04-21 a 2026-04-25 | **Primer incidente** — perdimos columnas de schema en seo_keywords, gsc_queries, ga4_daily_metrics, psi_measurements, serp_snapshots, war_room_suggestions, oauth_connections. Ver handoff `2026-04-24-seo-engine-schema-revert.md` | — |
| 2026-04-27 ~10:57 UTC | Replit deploy escribe commit `5c3d8c4` "Published your App" en origin/main que ELIMINA `server/migrations/applyPricingOverridesEnsure.ts` (-91) y modifica `server/index.ts` (-19) | Replit Deployment bot |
| 2026-04-27 ~10:57 UTC | Replit deploy escribe commit `9de0739` "Published your App" en la misma sesión, mismo efecto | Replit Deployment bot |
| 2026-04-27 ~11:35 | Iván compone email a support@replit.com con repro completo + hashes | Iván + Claude |
| 2026-04-27 ~12:00 | Quinn responde confirmando "definitely not expected behavior" y pide: Repl name, deployment type, Private Join Link | Quinn |
| 2026-04-27 ~14:15 | Iván pide a Claude conseguir esos 3 datos. Claude confirma 2/3 desde el repo + saca IDs forenses internos. Compone reply en Mail.app | Claude |
| 2026-04-27 ~14:15 | Reply pendiente de envío — Iván tiene que pegar el Private Join Link y pulsar Enviar | — |

---

## Datos clave para el ticket (no perder)

### Identidad del Repl

| Campo | Valor | Fuente |
|---|---|---|
| Repl name | `costa-brava-rent-a-boat-web` | `AUDITORIA_SEO_COSTA_BRAVA_2025.md` (URLs `*-ivanrd9.replit.app`) |
| Owner | `ivanrd9` | Mismo |
| Replit user ID | `47885418` | Email del autor en commits revert: `47885418-ivanrd9@users.noreply.replit.com` |
| Canonical workspace URL | `https://replit.com/@ivanrd9/costa-brava-rent-a-boat-web` | Derivado |
| Deploy preview URL | `https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/` | Verificado: 302 → /es/ |
| Production custom domain | `https://www.costabravarentaboat.com/` | `.env` `GSC_SITE_URL` |
| Deployment type | **Autoscale** | `.replit:10` `deploymentTarget = "autoscale"` |
| Workspace UUID | `39fcd5ec-f2f6-4ca2-bf3c-a4df4fe2d8e2` | Trailer `Replit-Commit-Screenshot-Url` |

### IDs forenses de los commits revert (oro para ingeniería de Replit)

**Commit `5c3d8c4`** (timestamp 2026-04-27 10:57:26 UTC):
```
Replit-Commit-Author:              Deployment
Replit-Commit-Session-Id:          759d5ff7-c11f-401c-8dea-f6174b4b067b
Replit-Commit-Checkpoint-Type:     full_checkpoint
Replit-Commit-Event-Id:            44c46d0e-15e9-4951-b736-58840a755100
Replit-Commit-Deployment-Build-Id: 70ea3edf-3f17-4a0c-9e1d-a8d98c477de2
```

**Commit `9de0739`** (timestamp 2026-04-26 21:47:57 UTC):
```
Replit-Commit-Author:              Deployment
Replit-Commit-Session-Id:          759d5ff7-c11f-401c-8dea-f6174b4b067b   (misma sesión)
Replit-Commit-Checkpoint-Type:     full_checkpoint
Replit-Commit-Event-Id:            89cc18e3-6264-433a-a19a-5bbfd8142c28
Replit-Commit-Deployment-Build-Id: 64b851c9-d6d7-4932-be8f-5a1bfcd4954d
```

**Screenshot URL adjunto (idéntico en ambos — sugiere snapshot único aplicado dos veces):**
```
https://storage.googleapis.com/screenshot-production-us-central1/39fcd5ec-f2f6-4ca2-bf3c-a4df4fe2d8e2/759d5ff7-c11f-401c-8dea-f6174b4b067b/vGidO8O
```

### Reproducir los hashes (si la rama queda limpia)

```bash
git log --all --pretty=fuller -- server/migrations/applyPricingOverridesEnsure.ts
git show 5c3d8c4 --stat
git show 9de0739 --stat
git log --format=fuller 5c3d8c4 9de0739 | grep "Replit-Commit"
```

---

## Hilo de emails

### 1. Email inicial enviado (asunto)

```
[Deployments] Republish silently reverts git commits and drops DB tables — reproducible with hashes
```

Cuerpo completo: ver memoria de la conversación previa o reconstruir desde el reply abajo.

### 2. Respuesta de Quinn (resumida)

> Hi Iván, thank you for contacting Replit Support! Thank you for this incredibly detailed bug report with reproducible evidence. The behavior you're describing — where Republish creates "Published your App" commits that revert your code changes and drop database tables — is definitely not expected behavior and needs immediate investigation.
>
> To help our engineering team investigate this critical issue, I need a few additional details:
> - **Repl name**: The exact name of your Replit project
> - **Deployment type**: Are you using Autoscale, Reserved VM, Scheduled, or Static deployment?
> - **Private Join Link**: Please share a Private Join Link to your project so our team can investigate. You can create one by clicking the 'Invite' button in your Repl and enabling 'Private Join Link'. If you don't see this option, you can share the URL of your app instead.
>
> Once I have these details, I'll escalate this immediately to our engineering team for investigation.
>
> Regards, Quinn

### 3. Reply compuesto en Mail.app (pendiente de enviar)

Asunto: `Re: [Deployments] Republish silently reverts git commits and drops DB tables — reproducible with hashes`

**Falta:** pegar el Private Join Link y pulsar Send. Generar el link desde:
1. `https://replit.com/@ivanrd9/costa-brava-rent-a-boat-web`
2. Botón **Invite** (esquina superior derecha)
3. Activar **Private Join Link** → copiar URL

**Tras cerrar el ticket:** volver a Invite → "Reset link" para invalidar.

Cuerpo del reply (referencia, ya está en Mail.app):

```
Hi Quinn,

Thanks for the fast response and for taking this seriously.

REQUESTED DETAILS

- Repl name: costa-brava-rent-a-boat-web
- Owner: ivanrd9
- Canonical workspace URL: https://replit.com/@ivanrd9/costa-brava-rent-a-boat-web
- Deploy preview URL: https://costa-brava-rent-a-boat-web-ivanrd9.replit.app/
- Production custom domain: https://www.costabravarentaboat.com/
- Deployment type: Autoscale (deploymentTarget = "autoscale" in .replit)
- Private Join Link: [PEGA AQUÍ]

EXTRA FORENSIC DATA THAT MAY SAVE YOUR ENGINEERS TIME
[bloque de hashes y trailers — ver tabla "IDs forenses" arriba]

ADDITIONAL CONTEXT THAT MAY MATTER

1. The repo is a GitHub mirror at github.com/Douglasdawson/costa-brava-rent-a-boat. The auto-revert
   commits land directly on origin/main there — not just inside Replit. Contradice la teoría del
   user en https://replit.discourse.group/t/deployment-commits/8506. Esa es la razón por la que
   el bug es destructivo: sobrescribe nuestro git history.

2. La DB es Neon Postgres EXTERNA (no Replit DB). Los schema drops del incidente anterior
   afectaron la Neon DB del DATABASE_URL. Worth checking si el deploy pipeline corre algún
   `drizzle migrate` / `push` contra la DB externa sin consentimiento.

3. La reproducción está MASCARADA en producción ahora porque corremos idempotent migration
   runners en cada boot. Engineering should look at deploy logs at the UTC timestamps above,
   no al estado actual de prod.

4. Si el Private Join Link no es suficiente, podemos añadir un email de ingeniero como
   collaborator con full edit access.

Thanks,
Iván
```

---

## Mitigaciones que YA tenemos en el repo (workarounds, no fixes)

Estas mitigaciones explican por qué el bug no rompe prod ahora mismo aunque vuelva a ocurrir. Documentarlo para que ingeniería de Replit entienda que la falta de síntomas en runtime ≠ ausencia del bug.

| Mitigación | Archivo | Qué hace |
|---|---|---|
| Idempotent migration runner para SEO Engine | `migrations/0007_unblock_analytics.sql` + boot hook en server | `CREATE TABLE IF NOT EXISTS` + `ADD COLUMN IF NOT EXISTS` para 7 tablas analytics. Re-aplica en cada arranque |
| Idempotent migration runner para pricing_overrides | `server/migrations/applyPricingOverridesEnsure.ts` | Tabla `pricing_overrides` + índices. Recreada en cada boot. **(Justo el archivo que el bug eliminó)** |
| Re-push tras cada revert detectado | manual / git workflow | Si vemos commits "Published your App" reverters, push al HEAD bueno. No automático |

**Lo que NO tenemos cubierto:**
- Detección automática de "Published your App" reverters → alert.
- Backup de archivos fuente que el bug podría borrar (si añade `client/`, `shared/`, etc.).
- Defensa contra DB drops si Neon no tiene PITR activado.

---

## Próximos pasos

1. **AHORA (Iván)**: pegar Private Join Link en Mail.app y enviar el reply a Quinn.
2. **Esperar** respuesta de Replit (Quinn dijo "I'll escalate this immediately"). SLA esperado: 24–72h.
3. **Si pasan 72h sin respuesta**: follow-up con el mismo asunto + post en `https://replit.discourse.group/c/bugs` referenciando el ticket interno y los hashes.
4. **Cuando llegue el verdict**:
   - Si **Replit confirma bug y lo arregla** → quitar workarounds idempotentes (o mantenerlos como defensa adicional, decisión de Iván).
   - Si **Replit dice "feature, no bug"** → cambiar deployment process: nunca más Republish, solo full Publish. Documentar.
   - Si **no responden** → escalar a redes (X `@ReplitSupport`) o cambiar de plataforma.
5. **Cleanup ticket cerrado**: invalidar Private Join Link en Replit (Invite → Reset link).

---

## Para una sesión nueva de Claude (cómo retomar este caso)

```bash
# Leer este doc:
cat docs/handoff/2026-04-27-replit-support-republish-bug.md

# Verificar si hay nuevos commits "Published your App":
git log --all --pretty=fuller --grep "Published your App" --since="2026-04-27"

# Ver qué eliminaron / re-añadieron los reverts originales:
git show 5c3d8c4 --stat
git show 9de0739 --stat

# Ver el archivo que el bug eliminó (debería existir, fue restaurado):
ls -la server/migrations/applyPricingOverridesEnsure.ts

# Confirmar deployment type:
grep deploymentTarget .replit

# El email de Quinn está pegado arriba en este doc (sección 2).
# El reply compuesto está pegado arriba en este doc (sección 3).
```

Memoria asociada: `reference_replit_support_case.md` en `~/.claude/projects/-Users-macbookpro-costa-brava-rent-a-boat/memory/`.
