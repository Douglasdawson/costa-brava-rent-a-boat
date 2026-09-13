# Auditoría GEO/SEO del pivote: barcos con licencia + Escola Nàutica Blanes

Fecha: 13 de septiembre de 2026. Ventanas de datos: espejo GSC en Neon (`gsc_queries`) hasta el
10-sep, 28 d (14-ago → 10-sep) y 90 d (13-jun → 10-sep). SERP consultada el mismo día
(motor con localización aproximada; sirve para ver QUIÉN está delante, no la posición exacta).

## 0. Resumen ejecutivo

1. **El 1 de octubre de 2026 muere la oferta que trae el tráfico.** RD 1188/2025
   (BOE-A-2025-27010): desde esa fecha el arrendatario de cualquier barco a motor necesita título.
   El cluster "sin licencia" es hoy el 100 % del tráfico orgánico no de marca (370 clics / 11.439
   impresiones en 90 d). No se borra: **se convierte** en la puerta al titulín y a la escuela.
2. **Las páginas con licencia son invisibles.** `/es/barcos-con-licencia` tiene 20 impresiones a
   posición 37 en 28 d (objetivo del rebuild del 06-ago: 800); `/es/alquiler-barco-con-patron` 84
   a posición 40. La ficha del Trimarchi (29 impr, pos 9,8) rinde más que su categoría.
3. **Nadie de la zona posiciona el titulín** (104 impresiones en 28 d, 23 consultas, posición 13).
   La pillar de CBRB es 1ª para "titulín licencia navegación precio costa brava". Es el hueco.
4. **La escuela hereda un dominio con 20 años de historia ajena**: 49 URLs de la anterior
   "Escola Nàutica de Blanes" siguen indexadas y devuelven 404. Redirigirlas es la acción más
   barata y de mayor retorno del informe.
5. **El sistema de referidos ya existe en el repo de la escuela** (portal, Stripe, códigos,
   WhatsApp). Está apagado por un flag. Lo que cambia son las reglas, no el sistema.

## 1. Baseline (espejo GSC, cluster × ventana)

| Cluster | 28 d clics | 28 d impr | 28 d pos | 90 d clics | 90 d impr | 90 d pos |
|---|---:|---:|---:|---:|---:|---:|
| sin licencia (8 idiomas) | 69 | 2.946 | 9,8 | 370 | 11.439 | 8,6 |
| marca | 137 | 1.273 | 3,8 | 576 | 5.667 | 3,7 |
| tossa | 20 | 956 | 10,9 | 62 | 3.006 | 10,5 |
| con patrón / excursión | 1 | 308 | 19,3 | 9 | 1.169 | 12,8 |
| sin patrón | 0 | 270 | 11,8 | 13 | 1.139 | 11,0 |
| con licencia | 1 | 217 | 18,4 | 3 | 447 | 15,0 |
| lancha | 0 | 214 | 12,0 | 8 | 865 | 9,2 |
| titulín / licencia navegación / curso | 1 | 104 | 13,3 | 1 | 129 | 12,1 |
| **total sitio** | 630 | 26.669 | 11,8 | 2.749 | 104.425 | 8,6 |

Lectura: fuera de la marca, el único cluster con clics es "sin licencia". Todo lo que el pivote
necesita (lancha, sin patrón, con licencia, titulín) suma 2 clics en 28 días.

### Consultas del hueco titulín (28 d, todas sin clic salvo una)

| Impr | Pos | Consulta |
|---:|---:|---|
| 14 | 24,0 | alquiler barco titulin |
| 14 | 11,6 | titulin costa brava |
| 9 | 12,1 | boat licence spain |
| 9 | 26,2 | alquiler barcos con licencia de navegacion |
| 8 | 18,5 | bootsführerschein spanien |
| 7 | 5,1 | alquiler barco licencia navegacion |
| 6 | 5,2 | bootsführerschein in spanien machen |
| 6 | 10,2 | alquiler barco con titulin |

La intención española mezcla **alquiler con titulín** (comprador de CBRB) con **sacarse el
titulín** (alumno de la escuela). La alemana es formativa pura y no tiene destino en español.

### Consultas del comprador de lancha (28 d)

| Impr | Pos | Consulta |
|---:|---:|---|
| 150 | 10,6 | alquiler barco costa brava sin patrón |
| 86 | 14,5 | alquiler lancha costa brava |
| 60 | 28,4 | lloguer d'embarcació amb llicència |
| 56 | 21,5 | alquiler de barco con licencia básica |
| 45 | 13,9 | alquiler barco sin patron costa brava |
| 27 | 5,5 | alquiler barco blanes con licencia (1 clic) |
| 21 | 6,7 | alquiler lancha blanes |
| 19 | 4,7 | alquiler barco costa brava con licencia |

### Rebuild de `/es/barcos-con-licencia` (06-ago) frente a sus objetivos a 28 d

| Métrica | Objetivo | Real 28 d | Veredicto |
|---|---|---|---|
| Impresiones de la página | ≥ 800 | 20 (pos 37,2) | No cumplido |
| "alquiler lancha costa brava" | ≤ pos 7 | pos 14,5 (86 impr) | No cumplido |
| "alquiler barco tossa de mar" | ≤ pos 10 | pos 11,5 (102 impr) | Casi |
| Primer clic no de marca | 1 | 0 en la página | No cumplido |

Causa probable: la página no está en el menú (solo en el footer), el reparto anti-canibalización
manda "Tossa" a la página de ubicación y "sin patrón" compite con la home, y el cluster de
lancha lo absorben SamBoat y el post "alquiler-lancha-costa-brava-sin-licencia" (pos 60 hoy).

### Páginas del segmento (28 d)

| Impr | Clics | Pos | Página |
|---:|---:|---:|---|
| 913 | 16 | 12,0 | /es/barcos-sin-licencia |
| 84 | 0 | 40,0 | /es/alquiler-barco-con-patron |
| 68 | 1 | 15,4 | /en/boats-without-license |
| 59 | 0 | 18,5 | /en/boats-with-license |
| 56 | 0 | 60,1 | /es/blog/alquiler-lancha-costa-brava-sin-licencia |
| 29 | 0 | 9,8 | /barco-con-licencia-blanes-trimarchi-57-s |
| 23 | 1 | 9,5 | /de/bootsfuehrerschein-kurs |
| 22 | 0 | 18,4 | /es/licencia-navegacion-titulin |
| 20 | 0 | 37,2 | /es/barcos-con-licencia |
| 18 | 1 | 7,3 | /en/boat-license-course |

## 2. La SERP de hoy (quién está delante)

- **"alquiler barco con licencia blanes"**: CheckYeti, SamBoat, Click&Boat; después CBRB (ficha
  Trimarchi y home), Rent a Boat Blanes, Blanes Boats, EricBoats. Los marketplaces ganan por
  inventario agregado, no por mejor página.
- **"alquiler lancha blanes"**: SamBoat; el post de CBRB *sin licencia* (que morirá de sentido
  el 1-oct); Barcelona Blanes Boat Club; `/barcos` de CBRB con title "Sin Licencia · 75€/h"
  (precio viejo); Life Boat Costa Brava; Rent a Boat Blanes.
- **"alquiler barco tossa de mar sin patrón"**: Click&Boat, SamBoat, Borrow a Boat, Nautal,
  Barcorent (Tossa) y **costabravarentboat.com** (Platja d'Aro/Tossa, 12 barcos con licencia,
  nombre casi idéntico al nuestro).
- **"curso licencia de navegación blanes lloret girona"**: Lloret Gaceta (Cala Canyelles/PIKARO
  con Escuela Medinya, 180 €), academias.com, Selvamar (Blanes), Escola Nàutica Girona, **URLs
  antiguas de escolanauticablanes.com** (404 hoy), Escola Nàutica Lloret (150 €, 10 % si van dos).
- **"titulín licencia navegación precio curso un día costa brava"**: **1º CBRB**
  (`/es/licencia-navegacion-titulin`), Marinero a Bordo (99 €), Escola Port (110-130 €), ENCB
  Roses (199 €), Baix Empordà.

Marketplaces: Click&Boat es el 85 % del dinero del canal (comisión 21 %); SamBoat lista 27-28
barcos en Blanes. Contrato Click&Boat: art. 5.2 paridad (nunca más barato en la plataforma que en
la web), art. 5.5 no captar sus contactos, art. 6.1.1 no anunciar la web como más barata. El
copy nuevo no compara precios: dice "reserva directa, gasolina incluida, trato local".

## 3. Inventario de promesas "sin licencia" sin fecha (CBRB)

| Superficie | Volumen | Estado |
|---|---|---|
| `STATIC_META` de `server/seoInjector.ts` | 22 claves (home, categorías, 9 ubicaciones, /precios, jet ski) | promesa sin fecha |
| i18n `es.ts` / `en.ts` / `de.ts` | 322 / 212 / 195 menciones | mezcla de promesa y explicación |
| Blog (`server/seeds/blogSeed.ts`) | 4 posts que venden sin licencia; 3 posts de Tossa casi duplicados | promesa sin fecha |
| `shared/aiCitationFacts.ts` | 2 facts de jet ski sin fecha; el resto ya datado | parcial |
| `llms*.txt` | limpio, todo con fecha | ok |
| `Hero.tsx`, `LicenseComparisonSection.tsx` | ya gateados por `isLicenseFreeEraActive()` | ok |
| `/barcos-sin-licencia` | sin plan para el 1-oct: ni redirección ni copy post-era | promesa sin fecha |

Regla aplicada: se gatean **promesas** con `eraCopy(pre, post)`; las explicaciones ("hasta 5 m y
15 CV") se quedan. La URL de la categoría se conserva: es donde están las 2.946 impresiones.

## 4. Hallazgos técnicos CBRB

| Prioridad | Hallazgo | Archivo |
|---|---|---|
| P0 | `/barcos-sin-licencia` sin variante post-era (página, SSR y schema siguen vendiendo) | `server/seoInjector.ts:3477` |
| P0 | 22 claves de `STATIC_META` con copy sin fecha | `server/seoInjector.ts:351-1571` |
| P0 | El 1-oct hay que REDESPLEGAR aunque no cambie código (copy datado en runtime) | Coolify |
| P1 | Lanchas con licencia y con patrón fuera del menú (solo footer) | `client/src/components/Navigation.tsx:184-195` |
| P1 | `/alquiler-barco-con-patron` no exenta del thin-content guard: puede auto-noindexarse | `server/seo/thinContentGuard.ts:62-82` |
| P1 | Sin keywords de titulín/escuela en seguimiento | `server/seo/seed.ts:37` |
| P1 | 3 posts de Tossa canibalizándose | `blogSeed.ts:3039,3886,5043` |
| P2 | `/precios` fuera de `translatedStaticPaths` (noindex en 7 idiomas) | `server/seo/translatedStaticPaths.ts` |
| P2 | `/faq` sin `bodyFallback` (los bots sin JS no ven la respuesta del titulín) | `server/seoInjector.ts:2871` |
| P2 | `@id` de la organización distinto en seoInjector (`#organization`) y ai-context (`#org`) | `server/routes/robots.ts` |
| P2 | Códigos de descuento de un solo uso reutilizables (`useDiscountCode` nunca se llama) | `server/storage/promotions.ts:57` |

## 5. Escuela (escolanauticablanes.com)

**Estado**: 1 página pública + `/privacidad` + `/aviso-legal`; `EducationalOrganization` +
`FAQPage`; sin `sameAs`; robots abierto a todos los bots; `llms.txt`; GA4 `G-EKQNJGG40S`
vinculado a GSC `sc-domain:escolanauticablanes.com`; IndexNow. Enlaza a CBRB tres veces al
apex (301). Portal de alumno y panel construidos y apagados (`portal_activo=false`).

**Historial del dominio (Wayback)**: snapshots de 2003 a junio de 2025 de "Escola Nàutica de
Blanes" (WordPress en catalán con `/es/` y `/en/`). 49 rutas indexables con 200 en 2022-2025,
todas 404 hoy. Google aún las muestra para "escola nautica blanes" y "curso licencia navegación
blanes". Mapa de redirecciones aplicado en Fase 2.1 (cursos → página de curso; Lloret y Malgrat
→ locales; alquiler → CBRB; asesoría y formularios → 410; escuela/inglés → home).

**GSC de la escuela (propiedad `sc-domain`, 90 d hasta el 11-sep, leída con la service account
propietaria)**: 36 clics / 476 impresiones, posición media 15,9.

| Impr | Clics | Pos | Página |
|---:|---:|---:|---|
| 306 | 20 | 9,6 | https://www.escolanauticablanes.com/ (el **www** responde 200 sin redirigir: duplicado) |
| 149 | 11 | 23,2 | https://escolanauticablanes.com/ (canonical) |
| 124 | 5 | 22,5 | /en/ (heredada, 404) |
| 58 | 5 | 18,4 | /es/ (heredada, 404) |
| 15 | 1 | 8,5 | /cursos-de-navegacio/ (heredada, 404) |
| 12 | 0 | 8,6 | /es/escola-de-nautica-espanol/ (heredada, 404) |

Consultas con volumen: "escola nautica pnb" 32 impr (pos 19), "autoescola blanes" 29 (ruido de
marca), "escola llicencia nautica" 25 (pos 28), "licencia de navegacion girona" 14 (pos 17,7),
"nautica blanes" 11 (pos 1,8), "escola nautica blanes" 6 (pos 1, 3 clics). Lectura: el dominio
conserva señal para consultas de escuela y de PNB que la web nueva no atiende; las URLs
heredadas siguen recibiendo impresiones dos meses después de caer en 404. Acción: 301 de
`www` al apex y de las 49 rutas heredadas (Fase 2.1).

**Colisión de marca (decisión de Ivan, no técnica)**: la anterior dueña sigue activa en la misma
explanada del puerto con el Instagram @escolanauticablanes. Riesgo concreto: una ficha de Google
Business con el nombre pelado en Esplanada del Port se fusiona o se suspende como duplicada.
Recomendación: descriptor en la ficha ("Escola Nàutica Blanes · Costa Brava Rent a Boat") y no
crearla hasta decidirlo. Nombre registrado en la Generalitat: "ESCOLA NÁUTICA BLANES"
(FUE-2026-05476545, 7-sep-2026).

**Reparto de intención entre dominios** (regla del CLAUDE.md de la escuela, respetada): la
pillar "licencia de navegación Blanes" (qué es, qué te deja alquilar) es de CBRB; la escuela se
queda la intención de curso ("curso licencia de navegación", "sacarse el titulín en un día",
"escuela náutica blanes").

**Competencia de curso**: Lloret 150 €, Cala Canyelles 180 €, Roses 199 €, Barcelona 110-130 €,
Fuengirola 99 €. Media 163 €, mediana 150 €. Ninguna empresa de alquiler de la zona tiene
academia: ese es el hueco.

## 6. Programa de fidelización y referidos (reglas cerradas el 13-sep)

| Regla | Quién | Qué |
|---|---|---|
| R1 | Amigo invitado | 10 % del curso |
| R2 | Ex cliente de CBRB (alquiló sin licencia), por teléfono | 10 % del curso; no acumula con R1 |
| R3 | Alumno con licencia | vitalicio en barcos con licencia de CBRB: 10 % + 10 % por amigo que paga, tope 30 %; código personal ligado al teléfono, validado en el wizard, aplicado por el CRM al cerrar |
| R4 | Lista de espera | cada inscrito tiene código; el amigo se apunta con `?ref=`; se materializa al abrir en 2027 |
| R5 | Anti-abuso | sin autorreferido, un descuento por pedido, +10 por amigo (no por pedido), solo pedidos pagados |

Convive con el programa de referidos del CRM DAMAR (`CBRB-…`, 20 € por Bizum) y con el código de
cliente repetidor del email post-viaje. No se fusionan. El 10 % del curso sale del margen 50/50
con Alex: pactar antes de publicarlo.

## 7. Plan de medición a 28 días (desde el despliegue de la Fase 1)

- `/es/barcos-sin-licencia`: mantener ≥ 2.500 impr/28 d tras el cambio de copy (hoy 2.946).
- `/es/barcos-con-licencia` en el menú: ≥ 300 impr/28 d (hoy 20) y "alquiler lancha costa
  brava" ≤ pos 10 (hoy 14,5).
- Titulín: ≥ 300 impr/28 d en el cluster (hoy 104) y primer clic español.
- Escuela: primeras impresiones para "curso licencia de navegación blanes/girona"; las 49 URLs
  heredadas fuera del índice o redirigidas (`site:escolanauticablanes.com`).
- Handoff CBRB → escuela: leads de la lista de espera con `utm_source=cbrb`.
- Referidos: filas de `waitlist` con `referido_por_id`; peticiones de CBRB con código de alumno
  (`whatsapp_inquiries.couponCode`).

## 8. Ejecución (cerrada el 13-sep-2026)

### Costa Brava Rent a Boat
| Commit | Qué | Deploy |
|---|---|---|
| `73384ce` | El cluster sin licencia se convierte el 1-oct: `eraCopy()` en `shared/constants.ts`, mapa post-era `shared/postEraMeta.ts` compartido por SSR y cliente, claves `categoryLicenseFree.postEra*` en 8 idiomas, footer/CTA/fichas por era, menú con "Lanchas con licencia" y "Con patrón", captained exenta del thin-content guard, `/precios` indexable en 8 idiomas, `/faq` con cuerpo SSR (41 `h2`, antes vacío), `/api/ai-context` con la escuela y `@id` unificado, facts de jet ski datados, 9 keywords de titulín en seguimiento, bloque "Actualización (RD 1188/2025)" en los 4 posts, 2 duplicados de Tossa despublicados y 301, 3 posts nuevos | 1933, verde |
| `33df4de` | Código de alumno: `discount_codes.customer_phone` + `licensed_only` (migración al arrancar, sin drizzle-kit contra prod), `POST /api/crm/alumni-code` (`x-api-key`, comparación en tiempo constante, rate limit), `validatePromoCode(code, {phone, boatId})` con `phone_mismatch` y `not_applicable`, wizard manda teléfono y barco, etiqueta "código de descuento o de alumno" en 8 idiomas, bug de `useDiscountCode` cerrado, 17 tests | 1935, verde |

Verificado en producción: pre-era intacta hoy (title de la categoría sin cambios); 6 rutas clave 200;
las 2 URLs duplicadas de Tossa → 301; seed del blog aplicado (3 posts creados, 200 en `/es/blog/`);
IndexNow 200 en los 3 endpoints para 49 URL. Prueba autenticada del endpoint de alumnos: alta
`TESTENB01` al 10 % → subida al 20 % → `validate` sin teléfono y con teléfono ajeno
`phone_mismatch` → con teléfono correcto y Pacific Craft 625 `valid, 20 %` → con Remus 450 II
`not_applicable` → desactivado → `not_found`; sin key 401. tsc: solo los 4 errores
preexistentes; `i18n:validate` completo.

### Escola Nàutica Blanes
| Commit | Qué |
|---|---|
| `f3d052e` | 49 URLs heredadas → 301/410 (`REDIRECCIONES_LEGADO` en `shared/rutas.ts`, tabla de 57 casos en test); enlaces a CBRB con `www` |
| `0436789` | `sameAs` + `parentOrganization` → `…/#organization`; `www.` → apex 301 a nivel de host; `waitlist.utm_*` |
| `79fc65a` | Schema + `porcentajeCbrb` (10 por licencia, +10 por amigo pagado, tope 30) + `DESCUENTO_CLIENTE_CBRB` + `mensajeInvitacionLista` + backfill (366/366 filas con código) |
| `a15a320` | Alta en lista de espera con código, `?ref=` → `referido_por_id`, `/invitar/:codigo` sin login (wa.me, noindex, Disallow), email best-effort |
| `dd43e0a` | `descuentoPara` único (código → referidor de la fila → ex cliente por teléfono; sin acumular; el propio se rechaza); webhook enlaza alumno y fila; import dedup solo contra `crmdamar_import` |
| `6c24a10` | `server/lib/cbrb.ts` empuja `{codigo, telefono, percent}` al expedir licencia y al pagar un amigo; `cbrb_pendiente` + barrido cada 15 min; sección "Mi código" en el portal |
| `626ea6a` | `/curso-licencia-de-navegacion`, `/lloret-de-mar`, `/malgrat-de-mar`, `/preguntas` prerenderizadas con BreadcrumbList + FAQPage; 301 heredados apuntando a ellas; `llms.txt` |

Verificado en producción: `www` → apex 301; `/es/`, `/en/`, `/ca/` → `/`; cursos → página de curso;
alquiler → CBRB; asesoría 410; 4 páginas nuevas 200 con JSON-LD; sitemap con 7 URL; `/invitar/X`
con `noindex`; alta real con `?ref=` (fila 721: código, `referido_por_id=4`, `utm_source=cbrb`) y
borrada; portal sigue 404 (apagado). 84 tests. IndexNow 200 (15 URL). Indexación pedida en GSC
para la home y las 4 páginas nuevas.

### Pendiente de Ivan (una línea cada uno)
1. `CBRB_API_KEY` en Coolify para la escuela (mismo valor que `CRM_API_KEY` de CBRB): el clasificador de permisos me bloquea escribir secretos. Hasta entonces los envíos quedan en `cbrb_pendiente` y se reintentan solos.
2. Resend para la escuela (`RESEND_API_KEY`, `RESEND_FROM`, `OWNER_EMAIL`): sin ellas el correo "tu código" no sale; la pantalla y `/invitar` no dependen de él.
3. Redesplegar CBRB el 1 de octubre.
4. Pactar con Alex el 10 % del curso (sale del margen 50/50) y decidir la ficha de Google Business de la escuela.
