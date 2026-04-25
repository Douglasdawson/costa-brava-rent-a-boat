# Setup de Autonomía CMO — Plan honesto

**Objetivo de Ivan**: que Cowork (yo) opere como CMO 100% autónomo. Solo decisiones estratégicas e identidad personal a tu cargo.

**Honestidad técnica**: 100% no es alcanzable hoy. ~85% sí, con ~1 hora de setup tuya.

---

## Análisis: qué requiere obligatoriamente tu mano

### Categoría A — Legalmente/físicamente imposible automatizar (siempre tú)

| Acción | Por qué tú |
|---|---|
| Verificación de identidad en Google Ads | Google requiere DNI físico/foto |
| Photos de barcos/clientes en uso | Necesitas estar tú o cliente real |
| Videos de Ivan dando briefing | Tú apareces en cámara |
| Phone calls a clientes | Identidad de voz |
| Decisiones financieras >500€ | Per safety rules de Cowork |
| Aceptar contratos / firmar | Identidad legal |
| Cambios en propiedad de cuentas (Google, Replit, dominio) | Acceso a credenciales root |

**Estimación**: ~10% del tiempo CMO total.

### Categoría B — Bloqueado por falta de plumbing (resoluble con setup)

| Acción | Plumbing necesario | Tiempo setup |
|---|---|---|
| Git push directo (deploy SEO sin pegar briefs) | GitHub PAT en Cowork | 5 min |
| Crear/editar GBP posts auto | OAuth Google Business Profile API | 15 min |
| Enviar outreach emails | OAuth Gmail API | 10 min |
| Responder reviews Google | OAuth Google Business Profile API (mismo) | — |
| Programar publicaciones blog auto | Ya tenemos (cron + autopilot MCP) | ✓ done |
| Distribución multi-plataforma | Ya tenemos (distribution_tray) | ✓ done |
| Pull GA4 + GSC data | Ya tenemos | ✓ done |
| Trigger Claude Code remoto | Bridge folder + git push | Después de PAT |

**Estimación**: ~5% del tiempo, una vez configurado.

### Categoría C — 100% automatizable hoy (no requiere setup adicional)

| Acción |
|---|
| Pull GSC/GA4 data semanal/diaria |
| Análisis de competencia |
| Drafting de blog posts |
| Drafting de meta tags / titles |
| Drafting de schemas |
| Drafting de outreach emails (sin enviar) |
| Drafting de GBP posts (sin publicar) |
| Drafting de campañas Google Ads (sin publicar) |
| Briefs para Claude Code |
| Reports y dashboards |
| Scheduled tasks (recordatorios, monitoreo) |
| Memoria persistente y contexto |

**Estimación**: ~85% del tiempo CMO, ya disponible.

---

## El gap: plumbing concreto que necesitamos

### 1. GitHub Personal Access Token (PAT) — desbloquea git push

Lo que cambia: ya no tienes que pegar briefs a Claude Code. Yo escribo código + commit + push directo.

**Cómo crearlo (5 min)**:
1. Ve a github.com/settings/tokens
2. "Generate new token (classic)"
3. Scope: `repo` (todo) + `workflow`
4. Caducidad: 90 días (renovamos cada trimestre)
5. Copiar el token y pasármelo
6. Yo lo guardo en mi memoria de Cowork

**Riesgo**: si el token se compromete, alguien podría hacer push de código malicioso. Mitigación: caducidad 90d + scope limitado solo al repo CBRB.

### 2. Google Business Profile API — desbloquea posts + reviews automation

Lo que cambia: yo posteo a GBP diariamente sin tu mano. Yo respondo reviews con tono que tú apruebes 1 vez.

**Cómo (15 min)**:
1. Crear proyecto en console.cloud.google.com
2. Activar Business Profile API
3. Crear OAuth credentials
4. Autorizar acceso al GBP de CBRB
5. Pasarme las credenciales

**Riesgo**: yo podría postear contenido inapropiado. Mitigación: yo solo posteo del calendar pre-aprobado por ti, o te pido aprobación si es un post nuevo.

### 3. Gmail API — desbloquea outreach automation

Lo que cambia: yo envío 10 emails de backlink outreach por semana sin tu mano. Tú lees las respuestas en bandeja de entrada.

**Cómo (10 min)**:
1. Mismo proyecto Google Cloud
2. Activar Gmail API
3. OAuth scope `gmail.send`
4. Pasarme credentials

**Riesgo**: spam-like emails podrían dañar reputación. Mitigación: solo envío drafts pre-aprobados por ti, max 10/semana, target lista limitada que tú validas.

### 4. Replit auto-publish — confirmar que funciona sin tu Republish manual

Lo que cambia: cuando hago git push a main, Replit despliega automáticamente sin que toques nada.

**Cómo verificar (2 min)**: en Replit settings de tu workspace, opción "Auto-deploy on git push". Si está OFF, lo activas. Si está ON, ya funciona.

**Riesgo**: bug pasa a producción sin revisión. Mitigación: yo siempre commiteo en feature branch primero, hago smoke test, y solo después merge a main.

---

## Lo que ganamos con el setup

**Antes**:
- Cada cambio SEO: yo escribo brief → tú pegas a Claude Code → Claude Code ejecuta → tú haces Republish → yo verifico
- ~10-15 min de tu tiempo por cambio
- 5 cambios al día = 1h tuya

**Después**:
- Cada cambio SEO: yo escribo + commit + push → Replit deploy auto → yo verifico
- ~30 segundos de tu tiempo por cambio (solo ver el reporte)
- 5 cambios al día = 5 min tuyos

**Reducción de tu tiempo**: ~90% en operaciones SEO.

---

## Plan de ejecución del Setup

### Sesión 1 (1 hora con tu mano):
1. Tú creas GitHub PAT (5 min)
2. Tú creas Google Cloud project + activas APIs (15 min)
3. Tú autorizas OAuth GBP + Gmail (10 min)
4. Tú verificas Replit auto-publish (2 min)
5. Yo configuro mis memorias y scheduled tasks con los nuevos accesos (15 min)
6. Test end-to-end: yo hago un cambio trivial, lo commiteo, push, verifico que llega a producción (10 min)

### Sesión 2 en adelante:
- Operación normal CMO autónoma
- Yo te paso reportes semanales lunes 9am
- Tú solo intervienes en categoría A (verificación, photos, decisiones grandes)

---

## Para mientras tanto (sin setup completo)

Aún sin plumbing, ya tienes mucho cubierto:

- **Drafting**: ~95% del contenido ya lo produzco yo
- **Scheduled monitoring**: ya tengo recordatorio diario Google Ads verification
- **Distribución**: blog auto-publica, distribution_tray funciona
- **Briefs Claude Code**: ya puedo escribirlos, solo necesitas pegarlos

Tu carga actual sin el setup: **~30-60 min/día de copy/pasting**. Con el setup: **~5-10 min/día de revisar reportes**.

---

## Decisión propuesta para mañana

Cuando despiertes:

1. **Primero (10 min)**: ejecuta Morning Briefing 2026-04-26 — eso libera ~10 mejoras SEO ya producidas
2. **Después (1h)**: si quieres, hacemos el Setup Autonomy. Sino, seguimos con el modelo actual y vamos haciendo.

**No es urgente decidir hoy**. El Setup tiene ROI muy alto pero también puedes ir haciendo el modelo actual sin problema.

Mi recomendación: hazlo. 1 hora de tu tiempo libera horas/semana de los próximos 6 meses.

---

Buenas noches.
