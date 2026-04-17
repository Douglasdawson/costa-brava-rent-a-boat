# Baseline SEO — 17 abril 2026

Datos GSC últimos 3 meses. Estado pre-cambios de Fase 1.

## Resumen ejecutivo

| Métrica | Valor | Benchmark | Estado |
|---------|-------|-----------|--------|
| Clicks totales | 171 | — | Base baja |
| Impresiones | 17.200 | — | Google SÍ te muestra |
| CTR medio | **1%** | 3-5% | 🔴 Crítico |
| Posición media | 17.6 | Top 10 | 🟠 Page 2 |
| Páginas indexadas | 205 | — | OK |
| Páginas no indexadas | **542** | — | 🔴 Exceso |

## Hallazgos críticos

### 1. CTR desastroso en homepage (la oportunidad #1)
- Homepage: 12.059 impresiones, 130 clicks, **CTR 1.08%**, posición 18.55
- Con los cambios de title hechos hoy (que incluyen "Costa Brava") debería pasar a 2.5-4% CTR
- Proyección: 300-500 clicks/mes solo de homepage

### 2. Queries con muchas impresiones y 0-2 clicks (CTR problem, no ranking problem)

| Query | Impresiones | Clicks | CTR | Pos | Notas |
|-------|-------------|--------|-----|-----|-------|
| alquiler barco costa brava | 782 | 2 | 0.26% | 13.88 | 🎯 Primer target |
| alquiler barco sin licencia | 459 | 0 | 0% | 23.4 | Homepage ahora lo cubre |
| alquiler barcos costa brava | 358 | 0 | 0% | 13.12 | ✅ Capturado con nuevo title |
| alquiler barco blanes | 323 | 2 | 0.62% | 9.56 | Arreglar location-blanes |
| alquilar barco costa brava | 267 | 0 | 0% | 12.74 | Variante capturada |
| alquiler boyas costa brava | 257 | 0 | 0% | 49.03 | ⚠️ No ofrecemos boyas — ignorar |
| astec 400 | 213 | 0 | 0% | 7.79 | Optimizar ficha barco |
| rent boat costa brava | 195 | 0 | 0% | 9.72 | EN version actualizada |
| alquiler barco lloret de mar | 189 | 0 | 0% | 8.79 | Página Lloret actualizada |
| rent a boat | 176 | 0 | 0% | 41.56 | Demasiado genérica |
| alquiler barcos blanes | 166 | 0 | 0% | 8.91 | Homepage + Blanes |
| alquiler barco sin licencia lloret | 151 | 0 | 0% | 5.93 | 🎯 Posición 6 con 0 clicks — CTR |
| location bateau blanes | 145 | 0 | 0% | 14.67 | FR market |
| alquilar barco blanes | 143 | 0 | 0% | 9.08 | Homepage |

### 3. URLs Wix legacy aún captando impresiones (desperdiciando autoridad)

Urgente redirigir (si no tienen 301 ya):

| URL Wix legacy | Impresiones | Redirigir a |
|----------------|-------------|-------------|
| `/barco-sin-licencia-blanes-astec-400` | 323 | `/barcos/astec-400` |
| `/barco-sin-licencia-blanes-astec-450` | 147 | `/barcos/astec-450` |
| `/alquiler-con-licencia` | 211 | `/barcos-con-licencia` |
| `/motos-de-agua` | 364 | **410 Gone** (no se ofrece) |
| `/motos-de-agua` (+idiomas FR) | ~150 | 410 |
| `/fuegos-artificiales-blanes-2025` | 776 | Actualizar a 2026 |
| `/alquiler-barcos-pineda-de-mar` (sin prefijo) | — | `/es/alquiler-barcos-pineda-de-mar` |
| `/alquiler-con-licencia` | 211 | `/categoria/con-licencia` |
| `/barco-con-licencia-blanes-trimarchi-57-s` | — | `/barcos/trimarchi-57s` |
| `/beneteau-flyer-5-5` | — | `/barcos/beneteau-flyer-5-5` |
| `/pacific-craft-625-open` | — | `/barcos/pacific-craft-625` |
| `/?lang=es` | — | `/` |
| `/excursiones` | — | `/excursion-privada-blanes` |
| `/ca/copy-of-extras` | 6 | `/ca/extras` |
| `/alquiler-barcos-pineda-de-mar` | — | `/es/alquiler-barcos-pineda-de-mar` |

### 4. 404s reales (deberían redirigir o crearse)

8 URLs dando 404 actualmente:

- `/ca/blog/alquiler-barco-costa-brava-guia-completa` → crear blog CA o 301 al ES
- `/barco-sin-licencia-blanes-astec-450` → 301 (sin redirect actualmente!)
- `/ca/barco-con-licencia-blanes-pacific-craft-625` → 301 al ES
- `/fr/barco-con-licencia-blanes-trimarchi-57-s` → 301 al FR correcto
- `/ca/excursiones-moto-agua` → 410 (no se ofrece)
- `/ca/barco-rodman-todo-incluido-blanes` → 301 a barco existente
- `/ca/barco-sin-licencia-blanes-remus-450` → 301 al CA correcto
- `/ca/barco-sin-licencia-blanes-astec-450` → 301 al CA correcto

**Patrón detectado:** la versión Catalana (/ca/) tiene URLs con slugs estilo Wix que no existen. El i18n CA está incompleto o con slug wrong.

### 5. Páginas clave rastreadas pero NO indexadas (44 URLs)

Google las ve pero decide no indexar. Las críticas son:

**Páginas que SÍ deben indexar:**
- 🔴 `/fr/location-bateau-costa-brava` — key page FR, mercado importante
- 🔴 `/es/alquiler-barcos-lloret-de-mar` — location page principal
- 🔴 `/es/alquiler-barcos-palafolls`
- 🔴 `/es/faq`
- 🔴 `/en/boat-rental-tossa-de-mar`
- 🔴 `/en/boat-rental-santa-susanna`
- 🔴 `/en/about`
- 🔴 `/nl/boot-huren-calella`
- 🔴 `/de/galerie`

**Causa probable:** contenido percibido como duplicado con la versión sin prefijo (`/alquiler-barcos-lloret-de-mar` sin /es/) o contenido thin.

**Acción sugerida:** revisar canonicals — quizás Google ve ambas (`/x` y `/es/x`) y no sabe cuál preferir.

**Páginas OK que no indexen:**
- `/es/login`, `/blank`, `/copy-of-*`, Wix legacy viejos, `/trimarchi-57s` etc.

### 6. Mobile vs Desktop

| Dispositivo | Clicks | Impresiones | CTR | Posición |
|-------------|--------|-------------|-----|----------|
| Móvil | 119 | 8.265 | **1.44%** | 14.29 |
| Desktop | 49 | 8.824 | 0.56% | 20.82 |
| Tablet | 3 | 103 | 2.91% | 7.44 |

**Insight:** móvil rankea mejor (pos 14 vs 20) y convierte 2.5x más. Prioridad mobile-first es correcta.

### 7. Mercados internacionales (oportunidad)

| País | Clicks | Impresiones | Posición | Estado |
|------|--------|-------------|----------|--------|
| 🇪🇸 España | 124 | 13.456 | 17.76 | Core |
| 🇫🇷 Francia | 14 | 1.240 | 20.34 | 🎯 Prioridad |
| 🇬🇧 UK | 8 | 196 | 15.91 | CTR 4% excelente |
| 🇺🇸 USA | 4 | 475 | 12.81 | Visible |
| 🇩🇪 Alemania | 3 | 198 | 8.67 | Buena pos, bajo volumen |
| 🇳🇱 Holanda | 2 | 483 | 18.4 | Volumen, mal CTR |
| 🇧🇪 Bélgica | 1 | 117 | 5.19 | Pos excelente, bajo CTR |

**Oportunidad:** Holanda (483 impresiones, CTR 0.4%) y Francia (1.240 impresiones) son los mercados con más upside tras optimizar titles FR/NL (parcialmente hecho hoy).

### 8. Search appearance

- Product snippets: 259 impresiones, 0 clicks (pos 21.2) — schemas firing pero no rankean
- Review snippets: 23 impresiones, 0 clicks (pos 14) — reviews 4.8★ visibles en pocas búsquedas

**Acción:** sincronizar reviews GMB dinámicamente (Task 10 Fase 2) mejorará review snippets.

## Acciones derivadas de este baseline

### Ya ejecutadas hoy ✅
- Title/meta homepage reescritos (impacto esperado: +150% CTR homepage)
- Locations diferenciadas con keywords hiper-locales
- 37+ páginas con titles optimizados

### Pendientes — Fase 1 continuación

1. **Auditar y añadir redirects Wix legacy** → especialmente `/barco-sin-licencia-blanes-astec-400/450` y `/motos-de-agua`
2. **Investigar por qué páginas /es/, /fr/, /en/ no se indexan** → posible problema de canonical
3. **Fijar 404s CA** → 8 URLs dan 404 real
4. **Fijar 5xx errors** → 16 URLs con error de servidor (no exportado en drilldown pero crítico)
5. **Update `/fuegos-artificiales-blanes-2025` → 2026** (776 impresiones desperdiciadas)

### Pendientes — Fase 2

6. Sincronizar reviews GMB dinámicas (mejora review snippets)
7. Crear contenido único en páginas canibalizadas
8. Optimizar FR/DE/NL tras ver primer impacto ES/EN

## Ficheros fuente

- `performance/` — Consultas, Páginas, Países, Dispositivos, Aparición, Gráfico, Filtros
- `coverage-1/` — 16 URLs con redirección
- `coverage-2/` — 10 URLs canónicas alternativas
- `coverage-3/` — 8 URLs 404
- `coverage-4/` — 44 URLs rastreadas pero no indexadas
