# Análisis SEO + Analytics — Costa Brava Rent a Boat

**Fecha del análisis:** 24 abril 2026
**Período analizado:** 25 marzo – 24 abril 2026 (últimos 30 días)
**Fuente:** Google Search Console + Google Analytics 4 (vía /crm/analytics)
**Contexto temporal:** 37 días para inicio de temporada alta (1 junio)

---

## 1. Estado actual — KPIs (30 días)

| Métrica | Valor | Benchmark industria turismo | Status |
|---|---|---|---|
| Clics orgánicos | 44 | — | bajo |
| Impresiones | 2.140 | — | OK |
| CTR medio | **2.06%** | 3-5% | **bajo (−1-3 pp)** |
| Posición media | 12.4 | <10 | borderline |
| Usuarios | 113 | — | OK |
| Sesiones | 183 | — | OK |
| Clics WhatsApp | 18 | — | — |
| Reservas iniciadas | 11 | — | — |
| Compras estimadas | 2 | — | bajo |
| **Tasa conversión global** | **1.09%** | 2-3% turismo náutico | **bajo (−50%)** |

### Embudo de conversión (visible en /crm/analytics)

```
183 Sesiones
     │ 94% abandono
     ▼
11 Reservas iniciadas   (6.0% de sesiones)
     │ 82% abandono
     ▼
2 Compras completadas   (1.09% global)
```

**Ratio orgánico vs. otros canales:** 44 clics orgánicos / 113 usuarios total = **38.9%**. El resto (61%) viene de tráfico directo, paid ads, referrals y social.

---

## 2. Hallazgos críticos

### A. Concentración extrema de clics en home (93%)

De los 44 clics orgánicos del mes, **41 (93%) fueron a la home `/`**. Las otras 86 páginas del sitio juntas capturaron solo 3 clics.

Diagnóstico: la estrategia "todo va a home" funciona a corto plazo pero no escala para capturar queries long-tail (localidad, tipo de barco, sin licencia, etc.). Las landing pages específicas están infrautilizadas.

### B. Multi-idioma con impresiones pero 0 clics

Páginas en EN, FR, DE, NL, IT, RU, CA acumulan **~280 impresiones sin ni un solo clic orgánico** en el período.

Destacados:
- `/nl/boot-zonder-vaarbewijs` — 50 imp, pos 14.9, 0 clicks
- `/fr/` — 40 imp, pos 15.0, 0 clicks
- `/en/` — 36 imp, pos 42.1 (posición baja)
- `/en/boat-rental-costa-brava` — 20 imp, pos **7.3**, 0 clicks ⚠️

**Señal fuerte:** posición 7 con 0 clicks = snippet (title + description) no convierte. Probable causa: meta text no optimizado para el idioma objetivo, o mal contextualizado para intent del usuario.

### C. Keywords en buena posición con 0 clics (oportunidad a CTR)

Lista de queries en top 10 sin ni un click:

| Keyword | Pos | Impresiones | Clics |
|---|---|---|---|
| alquiler barco sin licencia costa brava | 5.8 | 15 | 0 |
| alquiler de barcos en blanes | 5.2 | 14 | 0 |
| alquiler barcos blanes | 5.6 | 14 | 0 |
| alquiler barco sin licencia lloret de mar | 7.2 | 14 | 0 |
| alquiler barcos lloret de mar | 5.8 | 6 | 0 |
| alquiler de barcos blanes | 7.0 | 4 | 0 |
| alquiler barcos sin licencia costa brava | 8.7 | 3 | 0 |
| alquilar barco costa brava | 8.6 | 32 | 0 |

Ocho de las keywords más relevantes comercialmente están en página 1 (posiciones 5-9) y **no generan ni un solo clic**. El tráfico existe, solo falta convertir impresión en clic.

### D. Keyword de marca con volumen mínimo

"costa brava rent a boat blanes" aparece en pos 1.2 con solo **6 impresiones**. Significa que nadie te busca por tu nombre completo. Tu marca tiene poco awareness y la mayoría del tráfico es genérico (alquiler, barcos, etc.) con alta competencia.

### E. Ventana temporal crítica

37 días hasta el 1 de junio (inicio temporada alta). Cada optimización de SEO que se lance esta semana tiene **5-8 semanas de lead time** para indexar + subir posición + recibir el pico de búsquedas de temporada.

---

## 3. Top 10 acciones priorizadas

Priorizadas por impacto / esfuerzo. Coste estimado en horas, impacto cualitativo.

| # | Acción | Esfuerzo | Impacto | Urgencia |
|---|---|---|---|---|
| 1 | Optimizar meta title + description HOME ES | 1h | ALTO | pre-temporada |
| 2 | Rescribir meta `/es/barcos-sin-licencia` | 1h | ALTO | pre-temporada |
| 3 | Crear/mejorar landing `/es/alquiler-barcos-blanes` | 2-4h | ALTO | pre-temporada |
| 4 | Meta EN: `/en/boat-rental-costa-brava` + 2 más | 2h | MED-ALTO | pre-temporada |
| 5 | Optimizar NL (holandés) — `/nl/boot-zonder-vaarbewijs`, `/nl/boot-huren-tossa` | 3h | MED-ALTO | pre-temporada |
| 6 | CRO booking flow — reducir 94% abandono sesión → reserva iniciada | 4-8h | MUY ALTO | pre-temporada |
| 7 | Rebalancear "todo a home" → landing por localidad + crosslinking | 4-8h | ALTO | durante temporada |
| 8 | Activar urgencia CTA temporada en landing SEO (no solo admin) | 1h | MED | pre-temporada |
| 9 | Brand search awareness — outreach local + menciones | continuo | ALTO largo plazo | durante temporada |
| 10 | Backlinks portales turismo Costa Brava (task #24 en backlog) | continuo | ALTO largo plazo | durante temporada |

---

## 4. Detalles por acción

### 1. Meta title + description HOME ES (ROI más rápido)

**Situación:** home `/` recibe 1.740 impresiones, pos 10.5, CTR 2.36%. Está en borde de página 1-2.

**Fix:**
- Title actual probable: "Alquiler de Barcos Costa Brava | Sin Licencia desde 70€/h | Blanes"
- Test titles alternativos (A/B o secuencial):
  - "Alquiler Barcos Blanes · Sin Licencia · Desde 70€/h · 2026"
  - "Alquilar Barco en Blanes sin Licencia · 4.8★ · Calas Costa Brava"
  - Incluir señal de confianza (4.8★ · 310 reseñas) + urgencia (2026)

**Target:** CTR 2.36% → 3.5-4% = +25-35 clics/mes.

### 2. `/es/barcos-sin-licencia`

**Situación:** 24 impresiones, pos 15.8, 0 clics. Pero keyword "alquiler barco sin licencia costa brava" individualmente está en pos 5.8 con 15 imp y 0 clics.

**Posible causa:** la página aparece en SERP pero el snippet no habla de "costa brava" + "sin licencia" explícitamente. O compite con la home que absorbe el clic.

**Fix:**
- Re-escribir title para incluir "Costa Brava" y "Sin Licencia" junto
- Añadir schema FAQ con las 5-7 preguntas más comunes
- Revisar si hay keyword cannibalization con home

### 3. Landing `/es/alquiler-barcos-blanes`

**Situación:** 4 keywords apuntan aquí en pos 5-7 con 0 clics:
- "alquiler barco blanes" — 43 imp
- "alquilar barco blanes" — 22 imp
- "alquiler barcos blanes" — 14 imp
- "alquiler de barcos en blanes" — 14 imp

Total 93 impresiones para variantes de la keyword más importante comercialmente. Si la página existe, el snippet no convierte. Si no existe como landing dedicada, estás perdiendo clics al home.

**Fix:**
- Verificar existencia de la landing
- Si existe: auditar meta + contenido H1/H2 alineados con "alquiler barcos blanes"
- Si no existe: crear landing dedicada con copy CTA clara

### 6. CRO booking flow (el lever más grande)

**Situación:** de 183 sesiones, 11 inician reserva (6%), y solo 2 completan (estimado 1.09%).

El 94% de abandono entre sesión y reserva-iniciada es la **mayor palanca de valor** del sitio. Mejorar de 6% a 10% de sesión→reserva duplicaría conversiones.

**Hipótesis a testear:**
- Fricción en step 1 del booking (¿demasiados campos?)
- Confianza: ¿hay badges de seguro, reseñas, política de cancelación visibles antes de pedir datos?
- Pricing: ¿precio visible antes del formulario?
- Mobile UX: ¿el flujo funciona bien en 375px?

---

## 5. KPI targets 90 días

Assumption: aplicamos acciones 1-6 + 8 en pre-temporada, 7+9+10 durante temporada.

| Métrica | Baseline | Target 90d | Delta |
|---|---|---|---|
| Clics orgánicos/mes | 44 | 110-140 | +150-220% |
| CTR medio | 2.06% | 3.5% | +1.5 pp |
| Usuarios/mes | 113 | 250-300 | +120-165% |
| Reservas iniciadas/mes | 11 | 28-35 | +155-220% |
| Compras/mes (estimadas) | 2 | 7-10 | +250-400% |
| Tasa conversión global | 1.09% | 2.5% | +129% |

Nota: los targets son ambiciosos pero alcanzables dado que muchas keywords ya están en posiciones 5-9 sin monetizar — el margen de mejora por CTR es muy alto.

---

## 6. Sugerencias out-of-scope para próxima iteración

- **`/en/` home inglés está en pos 42.1** con 36 imp. Si quieres capturar turismo internacional de habla inglesa, esto necesita un diagnóstico técnico (puede ser un indexing issue, canonical mal, hreflang).
- **`/de/`, `/fr/`, `/nl/`** homes en pos 8-15 con impresiones aceptables pero 0 clicks. Patrón = meta text pobre en esos idiomas.
- **Dashboard recomendado:** el panel `/crm/analytics` actual es funcional pero mostraría más valor si el tab "Conversiones" incluyera atribución por keyword → booking. Hoy no se puede conectar qué keyword generó la reserva.

---

## 7. Limitaciones del análisis

- Datos de 30 días — no captura estacionalidad anual
- Sin acceso a GSC directo (solo snapshot cacheado cada 6h)
- `seo_rankings` stale desde 11-abril (task #70) — no hay data histórica fiable de movimiento posiciones
- Compras "completadas" son estimadas, no confirmadas contra DB de bookings

Para validar targets: cruzar este análisis con datos de bookings reales de DB en próxima iteración.
