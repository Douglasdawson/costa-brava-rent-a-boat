# Catalogo de Tareas Programadas — SEO Autopilot

> Prompts listos para invocar via `mcp__scheduled-tasks__create_scheduled_task`.
> Cada tarea es autonoma y usa el MCP `seo-autopilot-mcp` (que se instalara en Fase 0).
> Hasta que el MCP este en produccion, las tareas funcionan en modo "draft + notificar al usuario" (guardan entregables en `distribucion-blog/` y `seo-reports/` sin publicar).

---

## 1. seo-monday-briefing
**Cron**: `0 8 * * 1` (lunes 08:00 local)
**Descripcion**: Briefing ejecutivo semanal — estado, victorias, drops, acciones recomendadas.

```prompt
Genera el briefing SEO semanal para Costa Brava Rent a Boat.

1. Llama a seo-autopilot-mcp:dashboard_summary() para obtener KPIs.
2. Llama a seo-autopilot-mcp:weekly_briefing() para obtener el delta semanal de rankings.
3. Identifica:
   - Top 5 victorias (keywords que han subido en pos o que entran a top 10).
   - Top 5 drops (keywords que han bajado >3 posiciones).
   - 3 oportunidades priorizadas (keywords posiciones 4-15 con volumen >200).
   - Alertas criticas (penalizaciones, errores 500, CWV degradado).
4. Genera un documento markdown en seo-reports/briefings/YYYY-MM-DD-briefing.md con:
   - Resumen ejecutivo (3 lineas)
   - Tabla de KPIs vs meta 90d
   - Victorias y drops
   - Plan de accion para la semana (max 5 items)
5. Notifica al usuario con el link al briefing.

Idioma de salida: espanol.
```

---

## 2. keyword-research (YA EXISTE — mantener)
**Cron**: `0 9 * * 3`
**Estado**: Activa. No recrear.

---

## 3. weekly-seo-rank-check (YA EXISTE — mantener)
**Cron**: `0 9 * * 1`
**Estado**: Activa. No recrear.

---

## 4. autopilot-blog-weekly
**Cron**: `0 10 * * 2,4` (martes y jueves 10:00)
**Descripcion**: Trigger 2x/semana del Blog Autopilot.

```prompt
Ejecuta el Blog Autopilot de Costa Brava Rent a Boat.

1. Llama a seo-autopilot-mcp:blog_generate() sin parametros para que elija el proximo post segun el queue.
2. Valida el borrador con los guardrails:
   - >= 900 palabras
   - >= 3 H2
   - >= 2 imagenes
   - keyword density >= 0.5% y <= 2.5%
   - 0 canibalizacion con articulos existentes
   - schema JSON-LD valido
3. Si pasa: publica y dispara indexnow. Si falla: reintenta 1 vez, si sigue fallando notifica al usuario.
4. Tras publicar, dispara automaticamente la tarea content-distribution-weekly en modo incremental para ese slug.
5. Registra el resultado en seo-reports/autopilot-log.md.

Presupuesto max por corrida: 3 EUR (Claude API). Si se excede, aborta.
```

---

## 5. content-distribution-weekly
**Cron**: `0 11 * * 3` (miercoles 11:00)
**Descripcion**: Distribuir posts nuevos a 11 plataformas.

```prompt
Distribuye los blog posts publicados esta semana a 11 plataformas.

1. Llama a seo-autopilot-mcp:list_blog_posts(publishedSince="7d") para obtener posts recientes.
2. Para cada post:
   a. Invoca la skill seo-content-distributor con el contenido del post.
   b. Guarda las 9 piezas generadas en distribucion-blog/<slug>/:
      - medium-article.md, linkedin-article.md, reddit-posts.md, quora-answers.md,
        google-business-post.txt, tripadvisor-post.md, foro-nautico-post.md,
        outreach-emails.md, resumen-distribucion.md
3. Publicacion automatica:
   a. Medium: llama a seo-autopilot-mcp:medium_publish(content)
   b. LinkedIn: llama a seo-autopilot-mcp:linkedin_publish(content)
   c. Google Business Profile: llama a seo-autopilot-mcp:gbp_publish(post)
4. Publicacion semi-manual (Reddit, Quora, foros, TripAdvisor):
   - Deja las piezas en la "Distribution tray" del dashboard CRM.
5. Outreach:
   a. Selecciona 25 targets del catalogo de outreach.
   b. Personaliza el email con datos del post y del target.
   c. Envia via seo-autopilot-mcp:outreach_send_batch()
6. Anade parametros UTM a todos los links segun la tabla definida en el plan.
7. Notifica resumen al usuario.
```

---

## 6. gbp-weekly-post
**Cron**: `0 10 * * 1` (lunes 10:00)
**Descripcion**: Publicar semanalmente en Google Business Profile.

```prompt
Publica un post semanal en el Google Business Profile de Costa Brava Rent a Boat.

1. Evalua el contexto de la semana:
   - Temporada actual (ver shared/pricing.ts)
   - Eventos locales en Blanes (festivales, mercados, conciertos)
   - Tiempo previsto proximos 7 dias (usar API meteo si disponible)
   - Post de blog mas reciente (si relevante)
2. Genera un post GBP (150-300 palabras) en espanol + traduccion EN:
   - Hook visual
   - Propuesta de valor (alquiler sin licencia, familia, amigos)
   - CTA claro con link a reserva con UTM gbp_weekly
   - Foto adecuada del catalogo
3. Publica via seo-autopilot-mcp:gbp_publish(post).
4. Guarda copia en seo-reports/gbp/YYYY-MM-DD.md.

Tono: cercano pero profesional. No emojis.
```

---

## 7. outreach-wave
**Cron**: `0 10 * * 1,4` (lunes y jueves 10:00)
**Descripcion**: Enviar 25 emails outreach cada ola.

```prompt
Ejecuta una ola de outreach de 25 emails.

1. Llama a seo-autopilot-mcp:outreach_queue() para obtener proximos 25 targets pendientes.
   Criterios del queue:
   - Sitio relevante (turismo Costa Brava, nautica, lifestyle espanol, viajes)
   - DR >= 25 (si dato disponible)
   - No contactados en ultimos 90 dias
   - Email descubierto y validado
2. Para cada target:
   a. Investiga con WebFetch: tipo de contenido, audience, angulo posible.
   b. Genera email personalizado usando plantilla de la skill sales:draft-outreach
      - Asunto < 60 caracteres
      - Cuerpo < 150 palabras
      - Valor primero (contenido propio util, stat, dato exclusivo)
      - Pregunta abierta al final
   c. Envia via seo-autopilot-mcp:outreach_send()
3. Marca targets como contactados y programa follow-up +5 dias habiles.
4. Guarda log en seo-reports/outreach/YYYY-MM-DD.md.

Idioma: es para targets .es/.cat, en para internacionales.
Presupuesto max por corrida: 2 EUR.
```

---

## 8. geo-citations-check
**Cron**: `0 15 * * 2` (martes 15:00)
**Descripcion**: Verificar y optimizar citas en IA (Perplexity, ChatGPT, Google AI).

```prompt
Revisa y optimiza las citaciones en motores de IA generativa.

1. Llama a seo-autopilot-mcp:geo_prompts_sweep() con 30 prompts predefinidos sobre:
   - "mejor alquiler barcos Blanes"
   - "alquilar barco sin licencia Costa Brava"
   - "boat rental Costa Brava recommendations"
   - "what to do Costa Brava boat"
   - ... (30 prompts totales definidos en server/seo/collectors/geo.ts)
2. Registra para cada prompt:
   - Engine (Perplexity / ChatGPT / Google AI Overview / Claude)
   - Si aparece citado costabravarentaboat.com
   - Fuentes competidoras citadas
3. Identifica 3 URLs propias que deberian citarse y no lo hacen.
4. Para cada una, llama a seo-autopilot-mcp:geo_optimize(url) para mejorar:
   - Anadir FAQ schema con preguntas que hace la gente a los LLMs
   - Anadir definiciones claras al inicio (Answer-first content)
   - Anadir tablas de datos comparativas (LLMs aman tablas)
   - Reforzar E-E-A-T con autor y fecha
5. Guarda reporte en seo-reports/geo/YYYY-MM-DD.md.

Presupuesto max: 1 EUR.
```

---

## 9. cannibalization-sweep
**Cron**: `0 3 * * 6` (sabado 3:00)
**Descripcion**: Detectar y proponer fixes de canibalizacion.

```prompt
Ejecuta sweep de canibalizacion.

1. Llama a seo-autopilot-mcp:technical_audit() filtrando por tipo "cannibalization".
2. Para cada caso detectado (2+ URLs propias rankeando por misma query):
   a. Si overlap semantico >= 70%: propone consolidar (merge + 301).
   b. Si overlap 40-70%: propone diferenciar contenidos.
   c. Si overlap <40%: marca como falso positivo y whitelist.
3. Genera plan de accion en seo-reports/cannibalization/YYYY-MM-DD.md con:
   - Tabla de casos
   - Accion propuesta por caso
   - Revenue estimado ganado (basado en seo_revenue)
4. Si configurado autoApprove: ejecuta consolidaciones seguras automaticamente.
   Si no: deja pendiente de aprobacion en el dashboard.

Presupuesto max: 0.5 EUR.
```

---

## 10. cwv-healthcheck
**Cron**: `0 5 * * *` (diario 5:00)
**Descripcion**: Core Web Vitals diario + rollback si degradacion.

```prompt
Ejecuta healthcheck de Core Web Vitals.

1. Llama a seo-autopilot-mcp:cwv_latest() para metricas del dia.
2. Compara con baseline (ultimos 7 dias):
   - LCP, INP, CLS, TTFB
3. Si alguna metrica de una URL crucial (top 20 por impresiones) se degrada >10%:
   a. Identifica ultimo deploy/cambio en esa URL via audit log.
   b. Alerta al usuario con detalle.
   c. Si autoRollback=true: ejecuta rollback del cambio.
4. Guarda dashboard de CWV en seo-reports/cwv/YYYY-MM-DD.json.

Esta tarea NO usa Claude API tokens (solo consulta DB).
```

---

## 11. competitor-watch
**Cron**: `0 7 * * 2,5` (martes y viernes 7:00)
**Descripcion**: Escanear 5 competidores.

```prompt
Escanea competidores de Costa Brava Rent a Boat.

Lista de competidores (en server/seo/collectors/competitors.ts):
- Competidor directo Costa Brava (a concretar con usuario)
- SamBoat (agregador)
- Click&Boat
- BlueSail Costa Brava
- Nauticasol Costa Brava

Para cada uno:
1. Llama a seo-autopilot-mcp:competitor_snapshot(url)
2. Detecta cambios desde ultimo scan:
   - Nuevo contenido publicado
   - Cambios en precios o flota
   - Cambios de posicion en keywords compartidas
   - Nuevos backlinks detectados
3. Genera 3 oportunidades accionables (keywords nuevas que ellos atacan y nosotros no, gaps de contenido, etc.).
4. Guarda en seo-reports/competitors/YYYY-MM-DD.md.
5. Si detecta cambio grave (pierden penalizacion, etc.), alerta al usuario.

Presupuesto max: 1 EUR.
```

---

## 12. reviews-request-wave
**Cron**: `0 18 * * 5` (viernes 18:00)
**Descripcion**: Solicitar reviews a reservas finalizadas esta semana.

```prompt
Solicita reviews a clientes con reserva finalizada esta semana.

1. Llama a seo-autopilot-mcp:bookings_completed(since="7d").
2. Filtra: solo reservas completadas (salida hecha), con email valido, sin review previa, idioma detectado.
3. Para cada cliente:
   a. Genera email personalizado en su idioma (plantilla en server/whatsapp/templates/review-request).
   b. Incluye:
      - Agradecimiento personal
      - Link directo a Google review (pre-rellenado si posible)
      - Link a TripAdvisor
      - Peticion de foto para UGC (con consentimiento)
   c. Envia via SendGrid.
4. Programa follow-up +7 dias si no review.
5. Log en seo-reports/reviews/YYYY-MM-DD.md.

Max 50 emails por corrida.
```

---

## 13. freshness-refresh
**Cron**: `0 4 1 * *` (mensual, dia 1 a las 4:00)
**Descripcion**: Refrescar 10 articulos decaying.

```prompt
Refresca 10 articulos del blog que muestran signos de decay.

1. Llama a seo-autopilot-mcp:blog_decay_candidates(limit=10).
   Criterios decay:
   - Publicado hace >6 meses
   - CTR cayendo >20% vs pico
   - Posicion cayendo >3 puestos vs hace 30 dias
   - Impresiones todavia decentes (>200/mes) — merece la pena refrescar
2. Para cada uno:
   a. Llama a seo-autopilot-mcp:blog_refresh(slug)
   b. El motor: actualiza datos del ano, anade nuevas secciones, reemplaza imagenes, refuerza schema, anade FAQ actualizada, dispara indexnow.
3. Guarda en seo-reports/freshness/YYYY-MM-DD.md.

Presupuesto max: 5 EUR.
```

---

## 14. seo-monthly-report
**Cron**: `0 9 1 * *` (mensual, dia 1 a las 9:00)
**Descripcion**: Reporte ejecutivo mensual en docx.

```prompt
Genera el reporte SEO mensual de Costa Brava Rent a Boat.

1. Recolecta datos del mes anterior:
   - seo_dashboard(): KPIs mes vs mes anterior
   - autopilot_history(): posts publicados, distribucion, coste
   - seo_campaigns(): progreso campanas activas
   - seo_experiments(): ganadores y learnings
   - seo_revenue(): revenue organico atribuido
   - seo_alerts(): alertas del mes
2. Invoca la skill docx para generar un Word profesional con:
   - Portada: mes, logo, KPIs destacados
   - Resumen ejecutivo (1 pagina)
   - Evolucion de rankings (tabla + tendencias)
   - Contenido publicado (listado con metricas)
   - Backlinks conseguidos
   - Alertas y resoluciones
   - Plan mes siguiente (top 5 prioridades)
3. Guarda en seo-reports/monthly/YYYY-MM.docx.
4. Envia por email al propietario.

Presupuesto max: 2 EUR.
```

---

## Tareas one-time de kickoff

### kickoff-1: seo-bootstrap-fase-0
**FireAt**: proximo dia laborable 9:00 local (crearlo al activar el plan)
**Descripcion**: Ejecutar Fase 0 completa (bootstrap).

```prompt
Ejecuta la Fase 0 del GOD_PLAN_SEO.md.

1. Verifica que el MCP seo-autopilot-mcp esta desplegado y accesible.
2. Verifica que existe el tab "SEO Autopilot" en el Admin CRM.
3. Crea las otras 13 tareas programadas (excepto las 2 ya existentes).
4. Ejecuta snapshot de baseline:
   - seo_dashboard() guardado como seo-reports/baseline-YYYY-MM-DD.json
   - Exporta keywords actuales a seo-reports/baseline-keywords.csv
5. Seed de las 60+ keywords del GOD_PLAN_SEO_keyword_map.xlsx en seoKeywords table.
6. Valida guardrails en staging con 1 post de prueba.
7. Genera informe "Fase 0 completada" en seo-reports/fase-0-report.md.

Si alguno de los pasos falla, notifica al usuario con detalle especifico.
```

### kickoff-2: seo-fase-1-audit-inicial
**FireAt**: T+2 dias
**Descripcion**: Auditoria tecnica exhaustiva previa a Fase 1.

```prompt
Ejecuta auditoria tecnica inicial para Fase 1 del GOD_PLAN_SEO.md.

1. Llama a seo-autopilot-mcp:technical_audit() completo.
2. Agrupa hallazgos por categoria:
   - Canibalizacion
   - Orphans
   - CWV issues
   - Schema missing / broken
   - Hreflang errors
   - Broken internal links
   - Low-CTR pages (CTR<2%, posicion 1-10)
   - Thin content (<500 palabras, alto rebote)
3. Genera plan de fixes priorizado por impacto estimado.
4. Para los fixes "safe" (no ambiguos): ejecutalos automaticamente.
5. Para los fixes que requieren aprobacion: los deja en el dashboard.
6. Guarda en seo-reports/fase-1-audit.md.
```

---

## Plantilla para crear una tarea

```js
mcp__scheduled-tasks__create_scheduled_task({
  taskId: "seo-monday-briefing",
  description: "Briefing SEO semanal — Costa Brava Rent a Boat",
  cronExpression: "0 8 * * 1",
  prompt: "<prompt de la tarea>",
  notifyOnCompletion: true
})
```

---

**Pendiente** para activar este catalogo: confirmar con el usuario que:
1. El MCP `seo-autopilot-mcp` se desarrollara y desplegara.
2. Los presupuestos indicados por tarea son aceptables.
3. Medium / LinkedIn / GBP tendran credenciales cargadas (tokens OAuth).
4. Las acciones "auto-publish" pueden ejecutarse sin aprobacion individual o requieren pre-aprobacion.
