# Changelog - Costa Brava Rent a Boat

> Registro de cambios del producto. Para cambios SEO especificos, ver [CHANGELOG-SEO.md](../CHANGELOG-SEO.md).

---

## [Mayo 2026]

### SEO/GEO — Auditoria profunda + schema TouristTrip + IndexNow (2026-05-29)
- Auditoria de maxima exigencia de todo el sistema SEO/GEO: `docs/audits/2026-05-29-seo-geo-deep-audit.md`. Veredicto: infra A+, gap = activacion + contenido + batallas pendientes (no infraestructura). Scorecard por area, hallazgos por severidad, gap vs SEO Domination Program, roadmap en 6 fases
- Schema `TouristTrip` en `/rutas-maritimas`: nuevo `generateRoutesItemListSchema` (ItemList de 5 itinerarios con origen/waypoints, distancia, duracion, dificultad; nombre+descripcion localizados en los 8 idiomas desde `routesData.ts`) (`cd39e5a`)
- `INDEXNOW_KEY` configurado en Workspace + Deployment (clave publica servida via `/<key>.txt`, `server/routes/sitemaps.ts:185`). Activa indexacion instantanea Bing/Yandex en el proximo deploy
- Activacion: confirmada paridad de Secrets Replit (GA4/PSI/Google ya presentes). ValueSERP + Perplexity descartados (medicion de pago, no crecimiento). Traduccion i18n de ~1340 claves pendientes bloqueada por tope de API hasta 2026-06-01
- CLAUDE.md: corregida tabla de deuda i18n (tordera/palafolls/pineda ya migradas; pendiente real = props de `PopularBoatsSection`). Memoria: `project_seo_geo_audit_2026_05_29.md`

### Drift sweep — Politica de cancelacion + fleet count + capacidades + nav distance (2026-05-26 / 27)
- Politica de cancelacion unificada para toda la flota: una sola politica reemplaza dos variantes contradictorias que convivian (legacy "no reembolsable / 7d antelacion" + tier-based "100/50/0% segun horas"). Backend `cancelBookingByToken` ya no calcula tramos % (eran codigo fantasma porque la web no cobra online) (`83de9eb`)
- Fleet count 8 -> 9 propagado en SEO, blog, i18n, JSX, emails, KB chatbot post-Remus 450 II promotion 2026-05-25 (`f11764c`, `a5edd9a`, hereda `826215b`)
- Pacific Craft 625 capacidad 8 -> 7 (real per `boatData.ts`); Excursion Privada 10 -> 6; Mingolla Brava 19 sacada de respuesta "sin licencia" en FAQ (es con licencia) (`f11764c`)
- Horario apertura MCP business-server 10:00 -> 09:00 (consistente con resto del sitio); `totalOperatingHours` 10 -> 11 (`826215b`)
- `CondicionesGenerales.tsx` SIN LICENCIA: "una milla / 1.8 km" -> "2 millas nauticas / 3,7 km" (RD 875/2014 art. 6.2) (`cabecf4`)
- `CondicionesGenerales.tsx` CON LICENCIA: clausula "una milla" copy-pasted reemplazada por referencia a titulacion del patron + ZONA DE NAVEGACION (`28879d5`)
- Review count hardcoded "310" -> `${BUSINESS_REVIEW_COUNT_STR}` (canonical 323, vivo en `shared/businessProfile.ts`) en 7 metas SEO (`cabecf4`)
- 15 metas SEO residuales con "8 boats / barques / Boote / boten / barche / лодок" corregidas (CA/FR/DE/NL/IT/RU) — categorizadas en total fleet -> 9 vs. subset sin-licencia -> 5 segun calificador (`cabecf4`)
- Audit completo: `docs/audits/2026-05-27-drift-sweep.md`. Memorias nuevas para prevenir reintroduccion: `project_cancellation_policy.md`, `project_fleet_canonical_facts.md`, `project_nav_distance_2nm.md`, `project_drift_sweep_2026_05_27.md`

### Analytics — GA4 server-side Measurement Protocol (2026-05-27)
- Nuevo `server/lib/analyticsServer.ts`: helper GA4 MP v1, lee cookie `_ga` para continuidad de sesion con stream client-side
- Eventos disparados desde el server: `generate_lead` en `routes/inquiries.ts` + `booking_request_submitted` en `routes/bookings.ts` — fire-and-forget, no bloquean response
- Cierra brecha de reporting: BD tenia 79 inquiries + 28 bookings reales en mayo pero GA4 reportaba 0 (cookie consent denial + script blockers comen client-side events)
- Activacion: requiere `GA4_MEASUREMENT_ID` + `GA4_API_SECRET` en env de Replit; sin ellos hace no-op con warning unico al arrancar (`ae7edc0`)

### Pricing — Realineamiento Astec 400 + promocion Remus 450 II + UI sin badges (semana 25-26)
- Catalogo Astec 400 realineado a "Solar 450 × 0,95 floor 10€" en las 3 temporadas (`shared/boatData.ts:266-277`). Cambio mas notable: 8h BAJA pasa de 225€ a 200€ (9fe6dc2)
- Remus 450 II promovido de "barco fantasma" a operativo real: row insertada en tabla `boats` (display_order=3) + anadido a `CANONICAL_BOAT_IDS` del seed-ensure migration (b1ffb06). Confirmado como segundo casco fisico real, no duplicado de marketing
- Eliminado banner "Tarifa especial: …" del picker de duraciones en boat-detail y del wizard de reserva (25ea4e8). Strike-through del precio anterior limitado a descuentos reales — para surcharges era anti-patron de ecommerce
- 12 overrides activos en BD para junio + agosto 2026: Solar/Remus/Remus II findes 1-15 jun igualados a findes 16-30; Astec 480 con regla suave 15-30 jun (+10% L-V, +5% S-D); global +20% para 16-30 jun; agosto 1-15 ±5% para Solar/Remus/II
- Bug fix: Remus 450 II tenia ~25 referencias activas en blogs/SEO/redirects/chatbot/admin pero la tabla `boats` lo ignoraba intencionalmente. Decision binding tomada y documentada

### CRM Pricing — Tab "Precios" completo (semana 24)
- Sistema completo de overrides editable desde admin (a924673, 181bd89, b5b8869, a744afe)
- Plantillas guardadas por usuario con flujo "aplicar como override" (f999ac3)
- Preview de impacto en vivo dentro del modal (b5b8869)
- Conflicto de solapamiento warning en linea (a744afe)
- Vista calendario integrada con view toggle (34bacf4, 64006e3)
- Filtro estado + activate/desactivate masivo via checkboxes (01409ed, a1f2c81)
- Historial de cambios en panel colapsable (0076dc2)
- Fix: removida auto-descuento early-bird del booking flow publico (01795c4)

### Boat detail — Pricing sync + impeccable polish (semana 23-25)
- Calendario de disponibilidad conectado a precios live (no mas precios cacheados) (71b38e4)
- Trust + risk-reversal strip above-the-fold + top FAQ abierto (96a7b55)
- Related boats: misma categoria (sin↔sin, con↔con), no cross-sell (aa24682)
- Mobile: native OS date picker reemplaza bottom sheet custom (2ebd163, 48a28eb)
- Calendar palette migrada a tokens HSL + retire shadow at rest (9b6e000, 36ff045)
- Keyboard arrow nav en calendar + combined today/selected state (19a5a4a)
- Empty state branded + dual hint collapsed (7716bba, ba90b9f)
- Fix: mobile date trigger abre el iOS picker correctamente (8bf29a9)
- Fix: muestra todas las duraciones activas, no solo 1/2/4/8h (ba26e01)
- 4 componentes auxiliares pulidos (9eee39e)
- WCAG touch target en gallery dots + dedupe "included" items (540bba5)

### Booking wizard — Rewrite 5 steps + P1+P2 (semana 20-21)
- Wizard reescrito a 5 steps (nuevo paso "Mejora tu dia" para extras) (2b9dc5a)
- P1 + P2 quick wins: capacidad, skeleton, confirmacion SLA, errores, trust (4a60287)
- Code-validation con discriminated error codes: not_found / expired / consumed / cancelled / inactive (1fd23c2)
- Exit-intent WhatsApp nudge al cerrar modal (ea88909)
- sendBeacon + fetch keepalive fallback para persistir inquiry (efaa3f4)
- Revalidate slot en step 4 + inline alternatives banner (dfa3478)
- Restore banner al rehidratar de sessionStorage (948d960)
- I18n centralisation + strings hardcoded fuera + headings conversacionales (997812a)
- 2-column grid en mobile para boats / durations / extras (75da974, c78e499, 416e4db)
- Submit CTA renombrada: "Pedir por WhatsApp" (e92e917)
- Mensaje WhatsApp clarificado como solicitud de reserva (0508537)
- Eliminado minimo 2h en findes (mantiene minimo solo agosto) (07a9708)
- Step 5: redesign con icons + fused schedule + ambient fuel notice (f084b18)
- Trust banner ocultado en steps 3 y 4 (bc0ad30, b8aaf6e)
- WIP avance multi-feature (license verifier, multi-boat bookings, blog content) (567ec77)

### Verificador de licencia nautica — Feature completa (semana 21)
- Catalogo 8 paises curados con pre-fill por idioma UI (74c2907)
- PWA: service worker via vite-plugin-pwa (be76e25), maskable icons (a91fd6c), standalone-display detection + external-link hint (aca11d6), offline-aware WhatsApp CTA (2867597)
- SVG flags via country-flag-icons para Windows (ba95313)
- Geo-IP default country upgrade (9525a91)
- Keyboard nav + Escape en country picker (1068702)
- LN (Licencia de Navegacion) añadida al catalogo Espana — basta para los 3 barcos con licencia (dc4f3f3, 32b6646)
- Inland-only verdict reroutes al license-free path (f293d05)
- Traducido a 7 idiomas (74c2907)
- Hyper-optimize mobile-first + PWA (f103cc5)
- Doc fuente: `docs/features/2026-05-21-license-verifier.md` (7c77947)

### SEO AI Crawlers — Auditoria completa (semana 23-24)
- Auditoria full: llms.txt minimal+multilingual, productCatalog, ai-search, citation hub (d0a3033)
- Tier 2 + T3.3/T3.4: hybrid search, selective rate limit, citation A/B, WebSub (b4c8cbe)
- Tier 3 closeout: HF dataset script + Skill manifest + handoff (14003f9)
- Pivot Wikidata → OpenStreetMap + fix corrected QIDs/PIDs (8e308d4)
- SSR title + description para crawlers que no ejecutan JS (bac1865)
- Exempt /api/mcp/public de CSRF origin check (560593e)
- Refresh GA4/GSC exports + check in HF dataset build (ece443b)

### SEO long-tail — Rescate ranking (semana 17-21)
- Rich anchor texts en footer locations (Palanca 1) (1b967f4)
- Expand home internalLinks 2→5 location links (Palanca 2) (d7b8ecb)
- SEO-extractable hero + long-tail FAQs en category-license-free y location-blanes (Palanca 2.2) (003a13d, 8534a5a)
- 301 /barcos + differentiate locationCostaBrava ES (c479ba9)
- Rescate ranking license-free: HowTo schema + vs marketplaces section + anchor diversification (936aad3)

### Hero + home + boat polish (semana 4-23)
- "Reservar ahora" abre wizard directo (e8b656b)
- Trust strip con WhatsApp icon + "Respondemos en <2h" (6a82e73)
- Hero secondary CTA + trust badges via i18n (dd901c8)
- A11y fixes (touch targets, semantic nav, real aria-labels) (69984c4)
- Perf + visual hierarchy (b57620a)
- Migrate hardcoded Spanish a i18n (FleetSection + FAQPreview) (6e9e335)
- Editorial moment image + copy a cala oculta (1f0ac39)
- Pricing cards centradas en tablet+ (86eff1c)
- Boat reviews: comillas idiomaticas por idioma (4863ff9)
- Availability urgency: tier "popular boat" oculto cuando no hay scarcity (eea75da)

### Impeccable design audit — P0 a11y closeout (semana 3-4)
- Cross-cutting design audit + decisions 2026-05-03 (287237c)
- Wizards (BoatQuiz + booking): close P0 a11y findings — focus, ARIA, heading-order (9f470ad)
- Visual verification + Lighthouse baseline post-polish (42f7512). Mejora 90→96
- Fleet section: BoatCard refactor (Earned Depth + Sea Sells Itself + One Action) (d8e308f)
- AvailabilityUrgency real data only (b3d83f3)
- Boat detail: central card CTA demoted to outline (a953095), hardcoded Spanish migrado + em-dash strip en HoldCountdown (2e2d8a4)
- Pricing: One Action Rule + Intl currency + tabular-nums (c5ec823)
- Booking: Personalize step i18n special-rate banner + iOS auto-zoom fix (0610d8a)
- Quiz: t.boatQuiz i18n + a11y (942e29d), named scoring weights + empty-state safety (135002e)
- Style wizards: title case + drop uppercase + replace Tailwind defaults con semantic tokens (fc22f9b, 03665f0)

### CRM Bookings + Reviews (semana 21)
- Boton "Gracias + reseña" WhatsApp por reserva (3b80a4f)
- Infer WhatsApp review language from phone prefix (25841f7)
- Selector de idioma editable por fila en bookings (f9d82d0)
- Bump review count 310 → 323 (verificado en GBP 2026-05-21) (1ab5440)

### Click&Boat sync (semana 21-23)
- Analisis bookings 2025 + sync pending update (377f7d7)
- Astec 400 listing creado #207314 — manual pricing periods pending (10d5ffd)
- Price uplift + Jul/Ago weekend blocks + Astec 400 partial + Jun 1 instant-booking handoff (6967276)

---

## [Abril 2026]

### SEO Autopilot — MCP Server (semana 20)
- Servidor MCP HTTP montado en `/api/mcp/seo-autopilot` con autenticacion bearer token (e3f361c)
- Distribution tray + admin dashboard CRM (`AutopilotTab.tsx`)
- Storage `mcpTokens` + `seoAutopilot`
- Admin API `admin-mcp-tokens.ts` + `admin-seo-autopilot.ts`

### SEO Fase 1 — Quick wins (semana 17)
- Quick wins SEO: titulos, canonicals, redirects, tracking (0eb0f83)
- Localize blog posts + fix sunset STATIC_META key + mas redirects (f1596c3)
- Sync homepage titles en server STATIC_META con client seo-config (cbdede6)
- Phase 1 design doc + implementation plan + GSC baseline (23ec85a)

### SEO tecnico (semana 5-12)
- Meta titles/descriptions optimizadas para CTR (fb16be5, 4ea2c35)
- BreadcrumbList schema en 6 paginas que faltaban (c8bf351)
- FAQPage schema en home (server-side, 8 questions, defer GTM, hero sizes) (796047d, f92ad1f)
- Noindex para blog en idiomas low-traffic (ca, it, ru) (4cc93c9)
- Normalize non-www → www (9c6290e)
- Service-oriented titles para excursion privada en 8 idiomas (90d8c00)
- Auto-export GSC data a GSC-export.md tras cada sync (ef06e88)
- 3 auto-export markdown reports para equipo marketing (613ab87)
- Redirect language subdomains a canonical /:lang/ paths (6ebf5a2)
- Multi-language SEO + calendar layout + GSC sync fix (86aca85)
- Keyword cannibalization fix + strengthen internal linking (2e1d52a)

### Performance + a11y (semana 5-6)
- Remove react-icons + add Brotli + decouple review ratings (8e29a6e)
- Remove JS dependency para hero image visibility + preload heading font (0b00069)
- Remove dead code + unused fonts + compress blog images (8dbcc3c)
- Improve Unsplash image search con local context + variety (1d3cf3f)
- Hero: lowercase fetchpriority attr (silence React 18 warning) (913074c)
- A11y: role="img" en review stars container (aria-label valid) (9841559)
- A11y: footer info links explicit text color (WCAG AA contrast) (33e97a9)
- Improve server startup time + readiness for deployments (2f2cef3, c313d37)
- Fix deploy: prevent startup timeout via deferred redirect seeding (3ca589c)
- Fix infinite crash loop durante server shutdown (ed32a2e)

### Security hardening (semana 16)
- Auth, CSRF, headers + upgrade drizzle-orm (ed84d43)
- Allow same-origin API requests sin Origin header (2cac35e)
- Add IndexNow verification key (d25ab26)

### CRM mobile (semana 13-16)
- Auditoria mobile UX completa: 30 fixes en 14 archivos (dca745d)
- WhatsApp inquiry → calendar booking conversion (303066c)

### Refactors + Content
- LocationTemplate extraido de 3 location pages duplicadas (Tordera, Palafolls, Pineda) (4e81676)
- Slot props anadidos a LocationTemplate para extensibilidad (37d1ab6)
- Cancellation policy alignment con T&C + expand calas blog post (34d543e)
- Backlinks strategy doc + square logo (861c5d3)
- Fix wrong boat specs en seed articles (3b6e520)

### Docs
- Update PROJECT_CONTEXT, STATE, design_guidelines con current data (a1e63bb)
- Update CLAUDE.md con complete project structure + conventions (4e3d803)
- I18n: corregir errores de acento y ortografia en 8 idiomas (64db612)

---

## [Marzo 2026]

### Blog: Enlaces y Rediseno de Articulos
- Links internos en markdown usan navegacion SPA (sin recarga de pagina)
- Links externos abren en nueva pestana con `rel="noopener noreferrer"`
- Redireccion `/barcos` → `/#fleet` (seccion flota en homepage)
- Tipografia reducida de `prose-lg` a `prose` base (~16px)
- Headings del articulo con fuente Clash Display (`font-heading`)
- Color de enlaces alineado al CTA de la marca
- Tags movidos al header junto a autor/fecha
- Related posts con imagen featured y card clickable completa
- Fix scroll-to-top al navegar al blog desde el navbar
- Mayor padding superior en desktop para separar del navbar

### Auditoria de Calidad (8.3 → ~9.2/10)

#### Infraestructura (Oleada 1)
- Graceful shutdown con SIGTERM/SIGINT handlers, cierre de server + DB pool + cron jobs
- Request timeout middleware (30s general, 60s uploads)
- Request ID tracking (X-Request-Id header) para correlacion de logs
- Idempotencia de webhooks Stripe (dedup in-memory con TTL 24h)
- Statement timeout de 15s en PostgreSQL

#### Resiliencia y Observabilidad (Oleada 2)
- Circuit breaker (CLOSED/OPEN/HALF_OPEN) para SendGrid, Twilio, OpenAI, Meta API
- Retry queue con backoff exponencial para emails y WhatsApp
- Audit logs fire-and-forget en acciones destructivas del CRM
- Migracion de ~60 archivos server/ de console.log a logger estructurado

#### Accesibilidad + SEO (Oleada 3)
- aria-label en 25+ icon-only buttons con traducciones en 8 idiomas
- aria-describedby en todos los campos del BookingFormDesktop
- JSON-LD Event schema para temporada 2026

#### UX/UI + Rendimiento (Oleada 4)
- Dark mode toggle con persistencia en localStorage
- Print styles (@media print)
- prefers-reduced-motion support
- Social proof query optimizado de 2 queries a 1 INNER JOIN
- Validacion de capacidad de barcos en chatbot WhatsApp

#### Testing (Oleada 5) — 216 tests totales
- Tests de pricing (85), descuentos (14), disponibilidad (6), booking (25), gift cards (14)
- Tests API con supertest: availability (13), bookings (11), health (4), discounts (7)
- Tests frontend: booking-validation (16), SEO schemas (16), circuit breaker (5)
- README.md y docs/DEPLOYMENT.md creados

#### Code Quality (Oleada 6)
- Script de validacion de traducciones (972 claves x 8 idiomas)
- BookingFlow.tsx (1204 lineas) dividido en 10 modulos
- 10 errores de lint corregidos para CI verde
- Alias @/ en vitest.config.ts para tests de cliente

### Nuevas Funcionalidades
- Sistema de recorte de imagenes 4:3, filtros nativos en movil y normalizacion de aspect ratio (57d9dec)
- Auditoria UX completa: reestructuracion del wizard de reserva, mejoras en hero, autopublicacion de blog (d11b05b, 203a48a)
- Galerias de imagenes responsivas por barco (desktop/tablet/movil) (1b833bb)
- Sistema de newsletter, emails de agradecimiento mejorados y generador de contenido para Google Business Profile (99e7146)
- Gestion de blog integrada en el CRM con publicacion semanal automatica (fe3d71c, a55bd2d)
- Rediseno responsive del hero, wizard de reserva con fecha en paso 2, navbar flotante (20e11b0)
- Codigo de descuento BIENVENIDO10 con boton de copiar en popup de temporada (1fbff2e, bbbdce3)
- Rediseno completo UI/UX: hero, wizard de reserva, navbar y footer (72777c9, bbb7312)
- Fotos reales de barcos reemplazando imagenes generadas por IA, formato 4:3 (7730a4a, 67203af)
- Rediseno UX movil completo: nuevo branding, fotos reales, datos dinamicos y extras (ef4a61c)
- Optimizacion de conversion con principios psicologicos: escasez, autoridad, prueba social, reciprocidad (213b33e, 947c161, 84171ad)
- Notificaciones FOMO de prueba social con datos reales de reservas (2019313)
- Seguimiento de consultas WhatsApp con integracion Meta Cloud API (00cb76a)
- Soporte multi-idioma para paginas de blog con fallback por idioma (b169437)
- 7 herramientas MCP de blog autopilot y cron jobs de publicacion automatica (3e6b9de, ef6b18b)
- Panel de administracion CRM: rutas individuales por pestana, design system nuevo, funciones WhatsApp (de2a29e, 975ad39)
- Fases de mejora CRM admin: productividad, usabilidad, consistencia visual y polish (b8e697d, 50b77b4, 69782ad)

### Mejoras
- Rediseno del blog, mejoras en formulario de reserva y refinamientos de UI (f02c4d2)
- Simplificacion de pagina de login a autenticacion solo por PIN (9b2fc40)
- Icono SVG personalizado para extra de snorkel (f9a9a15)
- Transparencia de precios, navegacion fija, breadcrumbs y expansion de FAQ (7488cf0)
- Disponibilidad en tiempo real y fotos de barcos optimizadas (da571da)
- Optimizacion UX completa para todos los modelos de iPhone y accesibilidad (1f89e47)

### Correcciones
- Optimizacion movil completa para todas las rutas del CRM (7306392)
- Scroll reveal no se activaba en movil: anadido rootMargin y fallback de seguridad (4d74b35)
- Hook condicional y codigo muerto eliminado en auditoria (a7b412c)
- Calidad de imagen hero en anchos medios y margenes de navbar igualados (de131fa)
- Eliminado astec-450 deprecado de boatData, anadido endpoint de renombrado (326ebe5)
- Formato de deposito como string decimal para evitar error de validacion (9d0df06)
- Badge de combustible incluido aparecia en barcos con licencia por comparacion case-sensitive (6bdbc23)
- Acento en identificador PaginationControls rompia el build (e7b99df)
- Errores de tildes/acentos en espanol en toda la web y CRM (1be6e0d)
- Mapeo de imagenes de barcos con prefijos resiliente a re-subidas del admin (68ef4a4)
- Auditoria completa de schema CRM: validacion, cache, visibilidad admin-a-publico (5ad11c6)
- Truncar metaDescription y title para evitar desbordamiento de varchar en BD (db0f6b0)
- Bugs del CRM admin: consistencia, robustez y eliminacion de fricciones diarias (6e4e4fc, 69782ad)
- Errores de compilacion TypeScript preexistentes resueltos (66fe1e6)

### Optimizacion
- Optimizacion de imagenes, preloads corregidos, robots.txt actualizado (reduccion de ~5.9MB en payload) (487aa31)
- Aspect ratio 3:4 portrait para tarjetas de barcos en movil (ac3fa7f)
- Tooltips, spinners de mutacion y hover polish en CRM (f48077a)
- Estados de error, colores KPI, paginacion de galeria, tarjetas movil en CRM (bc0511c, 6b1652c)

### Mejoras Tecnicas
- Proteccion CSRF, correccion GDPR, splitting de auth y componentes (19d6a10)
- Correcciones criticas de seguridad y limpieza de auditoria (dee033e)
- Traducciones divididas en archivos por idioma (e39de60)
- Logger estructurado adoptado en rutas y servicios (c30ce6f)
- Descomposicion de storage.ts y splitting de admin.ts (afec4d9)
- Integridad de schema, SEO y limpieza general (f6a325a)
- Configuracion de servidor, middleware de errores, hooks y componentes de cliente (5ed2f80)
- Correccion de queries N+1, lookups en batch e indices nuevos (617f382)
- Correcciones criticas de seguridad en Fase 1 del refactoring (f490c19)

### SEO
- Optimizacion agresiva para busqueda IA: entity stacking, schemas full-page, expansion de llms.txt (3749fe9, a6ad487, 35dbbdc)
- Enriquecimiento de schemas: VideoObject, Event, Review, jerarquia geo, ofertas de urgencia (e2456fd)
- Renombrado de imagenes con nombres SEO descriptivos, alt texts corregidos, sitemaps y schemas enriquecidos (e4b1a3d, 8b54c4b)

---

## [Marzo 2026 - Primera semana]

### Nuevas Funcionalidades
- Design system mobile-first: touch targets de 44px, utilidades de safe area, viewport-fit (23565f2)
- Rediseno visual con assets reales, CTA coral, navegacion transparente, animaciones de scroll (3c73a6a)
- Design system editorial nautico: colores, tipografia, botones, tarjetas, badges (ba7994b)
- Decremento automatico de inventario de extras al confirmar reserva (b38cb66)
- Auto-completar reservas confirmadas cuando pasa la hora de fin (782b3c3)
- Knowledge base del chatbot seedeada en 8 idiomas (7144923)
- Validacion de capacidad en chatbot con mensaje util para grupos grandes (456bd99)
- Sesiones admin y token blacklist migrados de memoria a PostgreSQL (76d8c60)
- Endpoint /api/health comprobando BD, Stripe, SendGrid y Twilio (2c01130)
- Monitorizacion de errores con Sentry (activo cuando SENTRY_DSN esta configurado) (6b1835c)
- Logger JSON estructurado con niveles info/warn/error (3e1f1d1)
- Sistema de newsletter: tabla, endpoint y formulario en footer (0af748c, 4b796c5)
- Traduccion de paginas de ubicacion (hero) en 8 idiomas (267b31f)
- Captura de parametros UTM en sessionStorage para analytics (5fa07d5)
- Email de cancelacion con link en confirmacion de reserva (bf9bd07, 95d53bf)
- Pagina publica de cancelacion en /cancel/:token con politica de reembolso (a7c3637, 15ca3f4)
- Handoff a agente humano en chatbot: reenvio a WhatsApp del propietario (97eacfc)
- Confirmacion de reserva por WhatsApp en el idioma del cliente (2ade74f)
- Emails multilingues para confirmacion, recordatorio y agradecimiento en 7 idiomas (2ac0e5f)
- Campo de idioma anadido a reservas, establecido desde sesion del chatbot (52b3fcc)
- Codigo de descuento y desglose de precio itemizado en formulario de reserva desktop (4f6e010, 78dc1c8)

### Correcciones
- Mobile: touch targets en navegacion, hero WCAG, tarjetas de barcos, safe areas iOS, footer (80beced, 14138a9, 68c4340, 116dd2f, d00c260, c38158f)
- Formulario de reserva desktop: altura de inputs 44px, cabeceras legibles (c36e384)
- Auditoria SEO completa con i18n para los 8 idiomas (d25281b)
- Email: tildes en espanol restauradas en asunto y cuerpo (58e0b05, 16d19b8)
- Chatbot: eliminados triggers falsos de handoff, restaurados acentos (be7b750)
- Chatbot: respuestas fallback para NL, IT, RU en errores de IA (aa3c9d9)
- Seguridad: URLs de Stripe usando APP_URL del servidor, validacion HMAC de Twilio (7c5dbec, c92a772, 65447d4)
- i18n: nombres placeholder culturalmente especificos eliminados del wizard (ad95238)
- Performance: cache de getCodeDiscount, Set para filtrado de packs (6ce687a)

### Mejoras Tecnicas
- Color harmonization: sistema navy/coral en todo el CRM y paginas restantes (73420a9, a24ec3d, 92218f3, eda3e64)
- Pipeline CI/CD con GitHub Actions: lint, typecheck y tests (7227acc)
- Tests con Vitest para pricing.ts y deteccion de solapamiento de reservas (97ba853, 6b272ab, ff4c670)
- Eliminacion de 14 componentes wrapper innecesarios en App.tsx (dca0cec)
- Tipo AuthenticatedRequest creado, eliminados todos los casts (req as any) (ba8b809)
- Header HSTS via Helmet para HTTPS (7b4ef6d)

---

## [Febrero 2026]

### Nuevas Funcionalidades
- Arquitectura multi-tenant: tabla tenants, tenant_id en 22 tablas con indices y foreign keys (93a92b3)
- Sistema de autenticacion multi-tenant: tabla users con roles, JWT con tenantId, refresh tokens, 8 endpoints nuevos (29c989c)
- Onboarding wizard en 4 pasos con trial de 14 dias y email de bienvenida (dd74371)
- Dashboard multi-tenant: nombre del tenant dinamico, banner de trial, menus por rol (5006235)
- Panel de administracion de tenant: configuracion, gestion de usuarios, 5 endpoints (a88d406)
- Super Admin Panel: stats globales, gestion de tenants y estados (4f830f7)
- Formulario de reserva desktop reemplaza wizard movil en pantallas grandes (c3a7055)
- Mini-hero en detalle de barco y preview de FAQ en homepage (c855445)
- Google Tag Manager con container ID real GTM-WPSV63W (456946b)
- Imagenes responsive con sharp: srcSet y endpoint de resize (3f7d349)
- Skeleton loading y spinner de envio en wizard de reserva (7d02585)
- Sistema de gift cards y gestion de empleados restringida al propietario (645fffc)
- Exportar CSV, creacion manual de reservas e integracion WhatsApp en CRM (3c2a14b)
- Seccion de resenas en homepage (2daf2f7)
- Modularizacion del CRMDashboard y de rutas del servidor (630f50b, 6fa53b7)
- Dashboard con graficos Recharts y KPIs mejorados (c4f9a5a)
- Modulo de clientes CRM y sistema digital de check-in/check-out (dec0a33)
- Mantenimiento de flota, inventario de extras y reportes operativos (127a938)

### Correcciones
- 32 problemas de responsive corregidos en movil, tablet y desktop (f401eda)
- Mejoras UX movil en wizard de reserva (7ee7a9d)
- Error boundary, comprobacion de disponibilidad y validacion web (fb41ec1)
- Temporadas del chatbot: verificar isOperationalSeason en disponibilidad (73e8576)
- Precios estacionales reales en BookingFlow en vez de multiplicadores (48da9eb)
- Auto-scroll al date picker al seleccionar barco en wizard movil (4c58ec4)
- Vulnerabilidades de seguridad criticas y divulgacion de informacion en rutas API (bf689e1, 319f548, 467d643)
- Formulario de reserva: texto de input visible, traduccion de boton de pago (affa5c0, c09a53b)
- Hero responsive, galeria, rutas e integracion de autenticacion (3af9b78)
- UX del formulario de reserva y URLs de Replit en schemas JSON-LD (3f819ee)

### Mejoras Tecnicas
- Seguridad JWT, paginacion, modularizacion CRM y calendario visual (e275857)
- Seguridad: JWT auth, Helmet CSP, rate limiting, validacion Zod (dbdc4a5)

### Auditorias y Cumplimiento (Febrero 25)
- Auditoria de seguridad: PII en logs, headers, console.log, validacion ENV (ebb2983, 1e97d88)
- PIN admin redactado de documentacion commiteada (f703627)
- Auditoria legal completa: RGPD, ePrivacy, LSSI-CE, ODR, NIF real en footer (f6bb0f3, 81bfc97)
- Accesibilidad WCAG 2.1 AA: formularios, hero, aria-pressed, nav semantico, target size, links de footer (6a7ce9e, a91e066, fa54dec, 9a97bfb)
- SEO: hreflang RFC 5646, FAQ @id, blogPosting body, noindex CRM (b0f0c31)
- Problemas de performance accionables corregidos (c05d9d4)

---

## [Enero 2026]

### Nuevas Funcionalidades
- Chatbot WhatsApp con IA: integracion con Twilio, memoria conversacional y recuperacion de knowledge base (d65b28a, 78a2c2e)
- Integracion de OpenAI para respuestas inteligentes del chatbot (1054acc, 4ff0f32)
- Analytics del chatbot y seeding de knowledge base (f785671)
- Health check de WhatsApp con diagnosticos detallados (1b838f1)
- Reinicio de chat disponible en cualquier punto de la conversacion (d94f7e0)
- Confirmacion de mensajes WhatsApp para interacciones del chatbot (9c3f1f0)

---

## [Septiembre 2025]

### Nuevas Funcionalidades
- Web de alquiler de barcos completa: catalogo de flota, paginas de detalle, sistema de reservas (858d6f3 - d00c6ee)
- Selector de idioma para web y navegacion (f2b5ec1)
- Pagina de preguntas frecuentes (FAQ) (289a0e3)
- Pagina de condiciones generales de alquiler (1522323, 929a719)
- Pagina dedicada para cada barco: Solar 450, Remus 450, y mas (0567926, 63a8105, 141eb0f)
- Reservas via WhatsApp (8ddacd8)
- Input de telefono con busqueda de prefijo internacional (443f787)
- Mapa interactivo y enlace de ubicacion para contacto (f56fa91)
- Paginas de ubicacion: Lloret de Mar, Tossa de Mar (dc05745, b68df31)
- Paginas de categoria: barcos sin licencia y con licencia (4d3a094)
- Sistema de disponibilidad en tiempo real (f3c6c0a, 9dcf77b)
- Persistencia de datos en base de datos PostgreSQL (e1a9118)

### Mejoras
- Responsive general para todos los dispositivos (e8cb878)
- Optimizacion de carga de imagenes (1cb548e)
- Iconos de especificaciones de barcos y extras mejorados (12a0f01, 2f733f8, ef04318)
- Equipamiento incluido visible en pagina principal y detalle (1d053b6, 5abe795)
- Altavoces Bluetooth anadidos al equipamiento de todos los barcos (5abe795)
- Footer con mapa interactivo, parking y contacto directo (c373e23, 9b0f815, 1fb033c)
- Link a Google Reviews en seccion de caracteristicas (9d83e98)
- Logica de precios por hora corregida (2b25e8e, 77618a2)

### SEO (ver [CHANGELOG-SEO.md](../CHANGELOG-SEO.md) para detalles)
- Sistema SEO centralizado con metadata en 8 idiomas (034f2ee, 18acdf8)
- Robots.txt y sitemap.xml dinamicos (b729834)
- JSON-LD avanzado: LocalBusiness, Service, Product, BreadcrumbList, FAQPage (6d2772b, f4eaa5e)
- Hreflang, canonicals y Open Graph implementados en todas las paginas

---

## [Septiembre 2025 - Inicio]

### Lanzamiento Inicial
- Commit inicial del proyecto con componentes UI base y estructura del sistema de alquiler (858d6f3, 51b5198)
- Opciones de alquiler y precios configurados para la flota actual (b2a34d0)
- Imagenes de barcos actualizadas para mostrar la flota real (7492752)
