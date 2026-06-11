# Auditoría de optimización de carga — 2026-06-11

Build de producción fresco servido en local (`node dist/index.js`), medido con Lighthouse móvil (throttle 4x, mismas condiciones que `docs/perf/2026-04-21/REPORT.md`) + Playwright (network/LCP) + 3 agentes de código (bundle, media, servidor). Sucesora del sweep 2026-05-31 (que descartó virtualización/memo masivo: no se re-proponen).

## Estado actual vs abril

| Página | Perf abril | Perf hoy | LCP abril | LCP hoy | FCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| Home /es/ | 45 | **69** | 8,7s | **5,9s** | 2,9s | 210ms | 0 |
| Ficha solar-450 | 34 | **72** | 9,1s | **5,9s** | 2,9s | 130ms | 0 |

Los 3 fixes de abril están a medias: el preload del LCP (#1) SÍ está implementado y funciona (hero AVIF responsive en home, webp en fichas); el split de vendor-charts (#2-3) NO se materializó (ver C1). JS crítico de una home fría hoy: **~344 kb br** (+22 kb CSS). TTFB local 1-2ms (X-SEO-Cache HIT). La cascada de API es sana: todo post-paint, dedupe de react-query OK, nada bloquea el above-the-fold.

## Hallazgos

### Críticos (corrección, no solo velocidad)

**C1 — vendor-charts (recharts+d3, 94 kb br) se descarga en TODAS las páginas públicas.**
recharts solo se usa en 4 tabs del CRM (lazy), pero rollup colocó `clsx` y `use-sync-external-store` DENTRO de `vendor-charts`, así que el entry depende del chunk entero (modulepreload en index.html; LH mide 77 kb desperdiciados en cada carga). Era el fix #2 de abril y sigue pendiente.
Fix (1 línea): en `vite.config.ts` `manualChunks` (~L145), antes del case de recharts: `if (id.includes("node_modules/clsx") || id.includes("node_modules/use-sync-external-store")) return "vendor-react";` → −94 kb br en toda página pública.

**C2 — Assets fantasma se sirven como HTML con `immutable, max-age=1y`.**
`server/index.ts:631-639` aplica el header de inmutabilidad por PATRÓN de ruta (`/assets/*.js|css`) antes de saber si el fichero existe; si no existe, el catch-all SPA responde HTML con ese header → cualquier proxy/navegador queda envenenado 1 año con HTML donde esperaba JS (medido con curl). Combinado con C3 es una página rota cacheada.
Fix: responder 404 + `no-store` a `/assets/*` inexistentes (o mover el header al `setHeaders` de `express.static`, que solo corre con fichero real).

**C3 — El middleware de prerender sirve snapshots de builds viejos sin validar frescura.**
`dist/prerendered` (del build de ayer) referenciaba hashes que ya no existen: la home local se servía SIN CSS y SIN hidratar (33 errores de consola, app muerta). Además los snapshots están contaminados: capturados con el popup del Boat Club abierto, scroll-lock en el body y un `<video>` que ya no existe. En producción hoy no hay prerender (Chromium roto en el builder), pero esto es una bomba armada para el día que funcione.
Fix: (a) guard de frescura en `server/prerenderedMiddleware.ts` (si el entry JS del snapshot no existe en `dist/public/assets` → `next()`); (b) sanitizar `scripts/prerender.ts` (pre-sembrar localStorage de cookies/popup, quitar dialogs y el style del body antes del snapshot); (c) que `npm run build` invalide `dist/prerendered`; (d) nota: `main.tsx` usa `createRoot` y borra el fallback — si el prerender revive, valorar `hydrateRoot`.

### Alto impacto en primera carga

**A1 — Imágenes/fuentes/vídeo sin caché** (`server/index.ts:641`): el regex de max-age cubre png/jpg/svg pero NO `webp|avif|woff2|mp4` → `max-age=0` y revalidación de ~400 kb por visita (fonts 100 kb + imágenes). Fix: añadir las 4 extensiones al regex. 1 línea.

**A2 — es.ts entero viaja en el bundle principal** (~65 kb br, ~57% del main chunk): `lib/translations.ts:2` + `use-language.tsx:11` lo importan estático como fallback del deep-merge. Un alemán descarga main(con es muerto) + de(73 kb). Fix: cargar `es` por el mismo `langLoaders` dinámico y dejar un mini-fallback en el main. Toca el mecanismo de fallback: hacer con cuidado (el deep-merge protege claves faltantes).

**A3 — GTM + gtag: ~315 kb comprimidos y ~150 kb desperdiciados ANTES del consentimiento** (LH: 81+69 kb unused). Cargan async en head con Consent Mode denied. Fix: inyectar GTM en `requestIdleCallback`/primera interacción → −~300ms de main thread móvil. (También: sobra el `dns-prefetch` a js.stripe.com — no usamos Stripe.)

**A4 — framer-motion eager** (35 kb br, 31 kb unused medidos): `App.tsx` importa `motion/react` solo para MotionConfig + transiciones de ruta. Fix: `LazyMotion` con `domAnimation` async + componente `m`, o transiciones CSS → −25-30 kb br.

**A5 — Hero móvil AVIF 131 kb** (828×1484; objetivo ≤80 kb): re-encodar a q≈45 → ~65-75 kb. Es EL request del LCP móvil de la home. −60 kb.

**A6 — Archivo-Variable (72 kb) sin preload** → FOUT de todo el body text (solo se preloada Clash). Fix: 2º `<link rel="preload">` en `client/index.html`. Opcional: subset latin (~40 kb) — hoy va el charset completo. La cara italic no existe (el navegador sintetiza faux-italic donde se usa `italic`).

**A7 — Precache del service worker: 6,3 MB / 134 entradas** — incluye los 7 idiomas que el usuario no habla (~2,1 MB), CRMDashboard (552 kb), vendor-charts y blog-detail. Workbox lo descarga tras `load`, compitiendo con las imágenes below-fold en móvil. Fix: `globIgnores` en vite-plugin-pwa para `CRMDashboard-*`, `{ca,de,en,fr,it,nl,ru}-*`, `vendor-charts-*`, `blog-detail-*` → precache ~2,8 MB (el runtime caching ya cubre revisitas del idioma activo).

### Medio

- **M1 — Jet ski hub hero 352 kb** (webp 2560px, srcset sin candidato ~800w ni AVIF) → móvil descarga ≥1600w en una money page. Ídem scooters (380/252 kb).
- **M2 — 10 JPGs legacy (~2 MB total, 250-350 kb c/u) sin variante webp/avif** en activity-sunset, faq, about, gallery, routes, location-tossa/lloret, category-license-free, activity-fishing/families. Llevan lazy+width/height (no tocan LCP), pero son el grueso del peso total. Conversión a webp: −65%.
- **M3 — `/api/auth/user` se llama en páginas públicas** (sesión admin irrelevante para visitantes) y `cwv-beacon` se envía 2 veces por carga.

### Confirmado OK (no tocar)
Preloads de LCP (abril #1) funcionando; assets hasheados `immutable` + brotli precomprimido; HTML con ETag + s-maxage corto; `/api/boats` con max-age=60 + br; lucide tree-shaken; rutas lazy correctas (CRM, blog-detail, country-flag-icons, vendor-maps solo donde tocan); CLS 0 en ambas páginas; TTFB irrelevante; cascada API post-paint. HTTP/2 y honor de s-maxage dependen del proxy de Replit (fuera de nuestro control; nuestros headers ya son correctos).

## Plan propuesto (por ROI)

| Tanda | Items | Esfuerzo | Ganancia estimada |
|---|---|---|---|
| **P1 quick wins** | C1, C2, A1, A6, A3-dns | ~1h | −94 kb br JS/página, caché sano, FOUT fuera, sin envenenamiento |
| **P2 media** | A5, A7, M1 | ~1h | −60 kb LCP móvil, −3,5 MB SW, money pages ligeras |
| **P3 estructural** | A2, A4, A3-idle, C3 | 2-3h | −90-95 kb br más en main, −300ms TBT, prerender a prueba de bombas |
| **P4 backlog** | M2, M3, subset fonts | cuando toque | −1,3 MB peso total |

Proyección tras P1+P2+P3: JS crítico ~150-160 kb br (de 344), LCP móvil lab ~3,5-4s (de 5,9), score ~85-90. La validación final real debe hacerse con PageSpeed contra producción tras el siguiente Publish.

---

## Resultados de la ejecución (mismo día, P1-P4 completas)

| Métrica (Lighthouse móvil 4x, build prod local) | Antes | Después |
|---|---|---|
| Home: score / LCP / FCP / TBT / CLS | 69 / 5,9s / 2,9s / 210ms / 0 | **78 / 5,0s / 2,0s / 160ms / 0** |
| Ficha: score / LCP / FCP / TBT / CLS | 72 / 5,9s / 2,9s / 130ms / 0,09 | **76 / 5,1-5,6s / 2,0s / 140ms / 0** |
| JS crítico home fría (br) | ~344 kb | **~150 kb** (entry 115→49, vendor-charts y motion fuera, es.ts a chunk propio) |
| Hero móvil AVIF | 131 kb | **71 kb** (q48 desde el webp fuente) |
| Precache del service worker | 6,35 MB / 134 entradas | **3,06 MB / 124 entradas** |

Implementado: C1 (clsx/use-sync-external-store → vendor-react), C2 (404+no-store para /assets/* inexistentes), C3 (guard de frescura en prerenderedMiddleware + snapshots saneados — popup/scroll-lock/video — + `build` limpia dist/prerendered), A1 (cache 30d para webp/avif/woff2/mp4), A2 (TODOS los locales son chunks lazy; main.tsx descarga el bundle del idioma ANTES de montar React — el fallback SSR queda visible durante el fetch, swap atómico sin CLS; el server emite modulepreload por locale incluida es; el fallback castellano se carga en idle en mercados extranjeros), A3 (GTM inyectado en idle/primera interacción; dataLayer+Consent Mode inline intactos; fuera dns-prefetch de Stripe), A4 (framer-motion eliminado de App: MotionConfig movido al wizard lazy), A5, A6 (preload de Archivo), A7 (globIgnores: CRM/idiomas/charts/blog fuera del precache), M1 (jet ski hub con AVIF+800w; scooters con AVIF), M2 (6 JPGs legacy → WebP con `<picture>`, −0,4 MB), M3 (auth/user solo en área privada; cwv-beacon deduplicado).

No ejecutado: subset latin de las fuentes (requiere tooling de fonttools y pruebas de glifos; ganancia ~30 kb — backlog). El LCP restante (~5s lab) es ahora mayormente element render delay del H1 sobre la foto del hero en throttle 4x; el siguiente salto real vendría del prerender funcionando en producción (Chromium en el builder de Replit) — ya blindado para ello.

Validado: 8 locales renderizan (es/de/ru muestreados), wizard/fichas/precios operativos, vendor-charts y vendor-motion ausentes del grafo público, asset fantasma → 404 no-store, AVIF con cache 30d, tests 559/559 (3 fallos preexistentes), tsc/lint sin errores nuevos. Validación final en producción: PageSpeed tras el próximo Publish.
