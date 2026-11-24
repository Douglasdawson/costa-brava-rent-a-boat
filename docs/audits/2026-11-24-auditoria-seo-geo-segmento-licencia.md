# Auditoría SEO + GEO del segmento "barcos con licencia" (24-nov-2026)

Alcance: estado de costabravarentaboat.com para posicionar el segmento que sobrevive al fin del "sin licencia" (RD 1188/2025, 1-oct-2026): 3 lanchas con licencia (Mingolla Brava 19, Trimarchi 57S, Pacific Craft 625), excursión privada con patrón y titulín (escuela hermana, sin venta activa).

Método: análisis estático del código (checkout en `fdd3a25`), verificación en producción con curl (UA Googlebot y GPTBot) y Playwright, datos de GSC, GA4 y GBP leídos en la UI sobre la sesión de Ivan (solo lectura, nada se guardó ni se solicitó), SERP y motores de IA consultados como turista. Detalle en bruto: scratchpad de la sesión (`fase1-consolas.md`, `fase2-runtime.md`, `fase3-serp-ia.md`).

Límites de esta auditoría (leer antes de citar cifras):
- Posiciones de SERP medidas con la sesión de Ivan (Google muestra la tarjeta de GSC y personaliza): tienden a salir mejores que las reales. **Manda GSC.**
- Firecrawl sin créditos hasta el 29-nov; Copilot pidió login; Bing, Click&Boat y SamBoat sin sesión.
- La fase de runtime lanzó 79 peticiones seguidas a `/api/blog/*` y provocó 429 en producción durante unos minutos. Por eso los LCP de 7-10 s de `/es/alquiler-barco-con-patron` no son fiables y 25 posts del blog quedaron sin leer. Repetir en frío.
- Un agente intentó leer GSC/GA4 por API con la service account del `.env`; el clasificador de permisos lo bloqueó. Todo lo de consolas sale de la UI.
- GSC en UI corta en 1.000 filas: las sumas por cluster son sobre esas filas.

---

## 1. Resumen ejecutivo

1. **El problema nº 1 no es técnico, es de asignación: Google sirve la HOME (`/es/`) y la raíz `/` para casi todas las consultas comerciales del segmento, no las landings.** "con licencia": 380 impr/90 d, 344 van a `/es/` (pos 24) y solo 22 a la categoría (pos 66). Las landings `/es/barcos-con-licencia` y `/es/alquiler-barco-con-patron` llevan 0 clics en 90 días (485 y 467 impresiones, pos 30 y 38). Solo el titulín está bien asignado (pos 8-13).
2. **La demanda del segmento con licencia es pequeña hoy** (cluster "con licencia": 157 impr del 1 al 22-nov) comparada con la que tenía "sin licencia" (4.432 impr y 29 clics en 28 d). Esa demanda no desaparece el 1-oct: se desplaza a "¿qué hago ahora?". Quien gane esa transición gana el segmento. Nadie local la ha cubierto y ningún competidor menciona el RD 1188/2025.
3. **Caída desde el 1-oct:** clics semanales de 121 (22-sep) a 18-26 (nov); posición media de 8,3 a 22,5; las impresiones se recuperan (~4.800/semana) pero la posición no. Total 28 d: 100 clics, 20,1 mil impr. GA4 1-oct a 23-nov: 507 sesiones, 0 `booking_request_submitted`, 3 `generate_lead`, 22 `whatsapp_click`.
4. **Indexación floja justo en lo que vende:** 418 URLs indexadas frente a 786 no indexadas (392 noindex, 148 descubiertas sin indexar, 85 rastreadas sin indexar, 82 soft 404). Las fichas de Mingolla y Pacific casi no existen para Google (0 impresiones); solo 4 URLs de fichas en sitemap (solo ES) y las otras 28 versiones, servidas indexables, no están en ningún sitemap. Cada ficha sirve 50-73 palabras de SSR.
5. **Hay afirmaciones falsas o prohibidas publicadas** en superficies que leen las IA (seguro "full", "PER o PNB", curso del titulín como pack propio, precios de excursión 240, 7 pax) y la ficha de Google Business Profile sigue ofreciendo "Alquiler de embarcaciones sin licencia" y publica una fecha de apertura de la escuela. Los motores de IA ya nos atribuyen cursos que no damos. Es lo más urgente por riesgo legal (art. 61.2 TRLGDCU y reglas del repo).
6. **Lo bueno:** ningún motor erró la fecha del 1-oct ni el RD; AI Mode, Perplexity y ChatGPT nos citan en las consultas de Blanes; el tráfico "AI Assistant" (25 sesiones) es el de mejor interacción (1 min 29 s); somos los únicos que publican precios de lanchas con licencia; title/description SSR de las 3 landings espejan el cliente en los 8 idiomas; las 3 landings y el pilar existen y están indexadas en es y en.

---

## 2. Baseline medido (GSC, 90 d = 25-ago a 22-nov; 28 d hasta 22-nov)

| Página | 28 d (clics·impr·pos) | 90 d |
|---|---|---|
| `/` (raíz, negocia idioma) | 33·3.038·2,8 | 610·22.434·4,0 |
| `/es/` | 5·7.324·25,0 | 97·19.713·20,8 |
| `/es/barcos-con-licencia` | 0·204·36,1 | 0·485·29,8 |
| `/en/boats-with-license` | 0·58·35,7 | 3·461·16,3 |
| `/es/alquiler-barco-con-patron` | 0·227·39,3 | 1·467·37,7 |
| `/es/licencia-navegacion-titulin` | 4·130·8,7 | 22·459·8,1 |
| `/es/alquiler-barcos-tossa-de-mar` | 1·423·21,4 | 5·835·18,1 |
| `/es/barcos-sin-licencia` | 0·506·30,1 | 31·2.899·16,0 |
| `/es/barco/trimarchi-57s` | 0·12·8,5 | 0·37·12,8 |
| `/es/barco/mingolla-brava-19`, `/es/barco/pacific-craft-625` | 0 impr | 0 impr |
| post `fin-alquiler-barcos-sin-licencia-2026` | n/d | 0·22·9,4 |
| **Total web** | **100·20,1 mil·21,5** | **1.270·71,9 mil·13,7** |

Las fichas con impresiones son las URLs antiguas `/barco-con-licencia-blanes-mingolla-brava-19` y `...-trimarchi-57-s` (31 y 35 impr, pos 9), hoy en 301.

Consultas y URL que sirve Google (90 d): "con licencia" 0·380 (home); "lancha" 0·718 (home, 492 impr, pos 20); "sin patrón" 0·472 (home y raíz); "con patrón" 0·262 (home 142; landing de patrón solo 19 impr, pos 52); "titulín" 0·154 (pilar, pos 13,5); "tossa" 14·2.380 (la raíz se lleva 6 clics). Otros idiomas: "führerschein" 4·76 (`/de/bootsfuehrerschein-kurs`), "permis" 13·909 (sobre todo "sans permis"). Top queries: "alquiler barcos con licencia" 233 impr pos 25; "alquiler lancha blanes" 187 pos 28; "alquiler barco blanes sin patron" 186 pos 25.

Tendencia semanal (clics · impr · pos): 22-sep 121·4.206·8,3 → 29-sep 43·3.120·14,7 → 13-oct 41·4.692·17,4 → 3-nov 18·5.099·22,7 → 17-nov (6 d) 26·4.790·22,5. Cluster con licencia: 65 impr (sep), 143 (oct), 157 (1-22 nov), 0 clics todo el periodo. Países: España 311 impr (pos 39), EE. UU. 8, Reino Unido 5. Dispositivo: móvil 241, ordenador 86.

**Contradicción de informes previos resuelta:** `/es/barcos-con-licencia` hizo de verdad 7 clics·368 impr·pos 9,0 (15-jul a 12-ago) y 3 clics·201 impr·pos 11,7 (14-ago a 10-sep). El "20 impr pos 37" del 13-sep mezcló ventanas: 36-37 es la posición de ahora. Es decir, la página **perdió** posición (de 9 a 36) en 3 meses; no es que nunca la tuviera. Hipótesis a contrastar: la rebuild de agosto y el pivote del 16-ago/13-sep, más canibalización con la home.

GA4 (1-oct a 23-nov): 507 sesiones (orgánico 187, directo 181, Organic Social 52, Meta pagado 44 con 6 s de interacción, AI Assistant 25, referral 17). Eventos: `generate_lead` 3, `booking_started` 3, `whatsapp_click` 22 (17 usuarios), `booking_confirmed` 2, `booking_abandoned` 49, `booking_request_submitted` 0. Key events configurados: barcos, barcos_sin_licencia, generate_lead y purchase; `booking_request_submitted` y `whatsapp_click` NO lo son.

GBP (4,8 · 435 reseñas): interacciones/mes jul 3.014, ago 3.266, sep 919, oct 180, nov 69; junio a noviembre: 514 llamadas, ~6 mil clics web, ~2 mil rutas.

Indexación (informe del 16-nov): categoría, patrón, titulín y Tossa en es y en están indexadas y Google acepta nuestro canonical. Mingolla es: rastreada sin indexar (9-ago); en/ca/fr/de/nl: "Google no reconoce esta URL". Pacific es: descubierta, nunca rastreada; en y de rastreadas sin indexar; fr sí indexada. Trimarchi: indexada en es, en, ca, it; de: soft 404.

---

## 3. Hallazgos (verificados en producción salvo que se indique)

### P0 (veracidad, riesgo legal o pérdida directa)

**P0-1. Google Business Profile publica cosas que ya no son ciertas o que el repo prohíbe.** (UI de GBP)
- Servicio vivo "Alquiler de embarcaciones sin licencia" ("hasta 5 m... desde el 1 de octubre se alquilan con la Licencia de Navegación", desde 85 €). Contradice la decisión del 24-sep de ocultar esa flota.
- La descripción y el servicio del curso dan "apertura prevista en abril de 2027" de la escuela. Regla del repo: ninguna fecha de apertura pública.
- Cancelación por mal tiempo: dice cambio de fecha o bono de 12 meses y omite la devolución íntegra (política de 6-nov). "más de 420 reseñas" ya es 435.
- Acción: Ivan (o con su ok explícito) corrige en GBP; es publicación externa.

**P0-2. Seguro, titulación y titulín mal afirmados en las superficies que leen las IA.**
- `client/public/llms-full.txt` (l. ~522, 606, 681, 696, 769): "fully insured / full insurance". Solo vale `INSURANCE_SCOPE_ES`; nunca "todo riesgo".
- `llms-full.txt` (l. ~567, 570, 632, 637-641): "Range: Unlimited" y "PER o PNB". `FLEET_MIN_LICENSE = "navegacion"`: basta la LN.
- Pack del titulín como producto propio: `client/src/i18n/es.ts` `navigationLicensePage` (L6167-6268, seoTitle "Curso de 1 día", L6177 chips), `aiCitationFacts.ts:72`, `llms*.txt` localizados ("Te organizamos el curso de 1 día", es l.5), `aiSearchIndex`, `blogSeed.ts:5140`. En EN: `shared/postEraMeta.ts:40,87,146,180,232,334,338` y `en.ts:65` ("Licence in 1 Day or Skipper").
- **Efecto medido:** AI Mode y Gemini ya dicen que "imparten/organizan cursos de un día". La escuela no está autorizada ni vende. (La frase "Te lo sacamos en 1 día" de la meta de la home que citó la fase 3 no la he localizado en el código: verificar.)
- Gemini y Perplexity generalizan "todo riesgo" y SOV como cobertura habitual: riesgo si se nos atribuye.

**P0-3. Anuncios sin licencia en marketplaces: SIN VERIFICAR.** Click&Boat concentra el 85 % de las reservas con licencia. Último estado conocido (6-ago): Solar 450, Remus 450 y Astec 480 online. Si siguen publicados tras el 1-oct, son tres anuncios de alquiler sin titulación. Hay que mirarlo hoy con la sesión de Ivan.

**P0-4. Fichas de barco: precio por hora falso y title que cambia al hidratar (32 fichas = 4 barcos x 8 idiomas).**
- `seoInjector.ts:2127-2133`: `UnitPriceSpecification` price 175 (Pacific 200, excursión 265) con `unitText hour` y `referenceQuantity 1 HUR`; 175 es la tarifa de 2 h. El cliente lo repite (`BoatDetailPage.tsx:221-223`, `seo-config.ts:238-243`, "desde {pricePerHour}€/h").
- Title curl "Alquiler Mingolla Brava 19 en Blanes | Desde 175€" frente a hidratado "Mingolla Brava 19 Blanes | 6 Personas desde 175€/h Costa Brava". En /fr/ y /de/ el hidratado sale en castellano y la description mezcla idiomas.
- `url` siempre `/es/barco/...`; `name` y `description` en castellano en los 8 idiomas; la excursión lleva `category "License-Free Boat Rental"` (resto de la era sin licencia); sin Breadcrumb ni FAQ (muertos por la regla espejo, `SEO.tsx:245`); "4.8★" a mano.

**P0-5. JSON-LD con precios que no existen.** `seoInjector.ts:3891`/`3873` (licensed: AggregateOffer 160-420, HowTo 160), `:3964`/`:3946` (patrón 240-420, la FAQ de la misma página dice 265/285/310), `:3390` (Tossa 160-420). Real: lanchas 175-460, excursión 265-460. Además `aggregateRating` 4,8/435 copiado a cada Service y a cada Product de `/api/ai-context` (10 veces): puede leerse como reseña de producto.

**P0-6. Tossa (423 impr/28 d, la query grande del segmento): title SSR distinto del hidratado** en es, en y fr (`STATIC_META` `seoInjector.ts:916`, `postEraMeta.ts:208-217`). En 7 idiomas dice "Excursion/Boat Trip", no "alquiler/rental". Cuerpo SSR ~120 palabras y, salvo en inglés, en castellano bajo título traducido. FAQ "aproximadamente 1 hora" frente a "30-45 min" del hero; "sin licencia" en presente ("límite legal sin licencia en Fenals", "excursión privada sin licencia"; `:3363-3409`).

**P0-7. `robots.txt`:** los 26 grupos de bots IA (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot...) solo tienen `Allow: /`. Por RFC 9309 ignoran el grupo `*`, así que pueden rastrear `/crm`, `/admin`, `/api/`, `/cancel/`, `/client/`. Solo 1 `Sitemap:` y no anuncia `llms.txt`. (`robots.ts:620-657`)

### P1 (frenan el posicionamiento)

**P1-1. Asignación de URL: home y raíz se comen la intención comercial.** Causas probables: la home lidera con "con licencia / titulín / patrón" en su meta y body (el pivote del 16-ago la convirtió en la landing de todo), las landings tienen hero sin foto ni CTA en móvil y casi nada de enlazado interno hacia ellas, y 0 enlaces internos en su SSR. Tarea: decidir qué intenciones son de la home y cuáles de cada landing y descargar la home de las del segmento (patrón, lancha, sin patrón).

**P1-2. Enlazado interno sin JS (lo que ven GPTBot/ClaudeBot/PerplexityBot): cero.** Las 64 URLs del segmento (8 idiomas x 8 páginas) tienen 0 enlaces internos y un único `<a>` (wa.me), salvo el titulín en es/en/ca (un enlace a la escuela). Sin nav ni footer en el SSR. La home enlaza `/barcos` (301 a `/es/barcos-sin-licencia`, "ya no los alquilamos") y ninguna ficha. Los 3 barcos solo se alcanzan hidratando.

**P1-3. Sitemap de fichas:** `sitemap-boats.xml` con 4 URLs solo `/es/`, hreflang solo `x-default`+`es-ES`, `lastmod` idéntico (2026-11-07 = deploy; la tabla `boats` no tiene `updated_at`). El SSR sirve las 28 restantes indexables con canonical propio y 9 hreflang recíprocos: tres señales incoherentes. Landings sin `lastmod` (solo 8 de 367 URLs de `sitemap-pages` lo tienen). La entrada de `excursion-privada` lleva un pie de imagen "...Sin licencia".

**P1-4. Fichas finas:** 50-73 palabras de SSR, sin descripción, specs, fianza, tabla de precios, FAQ ni enlaces. Compiten con SamBoat/Click&Boat por "Trimarchi 57S Blanes" y son justo las páginas que convierten.

**P1-5. Hero móvil de las dos landings:** `/es/barcos-con-licencia` y `/es/alquiler-barco-con-patron`: sin foto ni CTA sin scroll (H1 de 4 líneas / 139 px, solo botón flotante de WhatsApp); sin aceptar cookies el banner tapa desde y≈590; flota y precios a y≈4.300-4.660 (licensed) y ≈4.810-5.040 (patrón). Preload no usado de `hero-dive-mobile.avif` en licensed. `/es/precios`: H1 "2026" y título "2027", "Última actualización 3-sep-2026" (la fecha "31 de mayo" ya no está). Titulín: CTA principal "Conocer Escola Nàutica Blanes" (enlace externo a una escuela sin matrícula).

**P1-6. Duplicados indexables por idioma/ruta:** `/alquiler-barco-con-patron` y `/licencia-navegacion-titulin` sin prefijo dan 200 con canonical propio (las demás rutas sin prefijo sí hacen 301). Slug de un idioma bajo prefijo de otro dan 200: `/fr/alquiler-barcos-tossa-de-mar`, `/de/barco/excursion-privada`, `/fr/barco/trimarchi-57s`, `/ru/barco/pacific-craft-625`. Los `llms.txt` localizados enlazan esas URLs y `/{lang}/barcos` (404).

**P1-7. Soft 404 real:** `/es/barcos-con-licencia/loquesea` y `/es/barco` dan 200 `index,follow` con canonical a la home y title de la home (82 soft 404 en el informe de GSC).

**P1-8. Restos de la era vieja en redirects y enlaces:** `/excursion-barco-privado` y `/excursiones-privadas-con-patron-blanes` van a `/es/barcos-con-licencia` en vez de a patrón (`redirects.ts:239,250,269`). `solar-450`, `remus-450`, `remus-450-ii`, `astec-480` dan 301 a `/es/barco/...` y 200 `noindex` "Este barco ya no se alquila" en lugar de 301 a la categoría; `astec-400` acaba en 404; `/barco-mirimare-sunrise-7` va a `/es/categoria/sin-licencia` (404). ~27 enlaces a fichas retiradas en `blogSeed.ts` y `blogCrossLinkSeed.ts`. `blogAutopilot.ts:225,181-187` dice "PER o PNB" y deduce licencia y gasolina por regex: puede publicar posts falsos.

**P1-9. Capa GEO desactualizada:**
- `llms.txt` localizados (es/ca/fr/de/nl/it/ru) sin marcador de era: "## Barcos sin licencia (no requieren titulación)", "0 sin licencia", "Gasolina incluida en todos los barcos sin licencia"; no enlazan categoría ni patrón; `/en/llms.txt` da 404.
- Precios y capacidad de la excursión obsoletos ("From 240 EUR", "7 people", fianza 500, "from 150 EUR (Mingolla)", "Price range 175-420" en `llms-full.txt`; `agent.json` "from 240 EUR/2h"; `aiCitationFacts.ts`, `aiSearchIndex.ts`, `blogCrossLinkSeed.ts`; post en vivo `mayo-junio-mejor-momento-alquilar-barco-costa-brava` con tabla 240/320/380 y "precios reales"). Canon: 6 pax; 2 h 265/285/310, 3 h 350/375/395, 4 h 420/440/460; fianza 200. Extras inexistentes en `llms-full.txt:269-279`. `fleet[].pricePerHour` 133/100/88/88 en `/api/ai-context` no corresponde a ninguna tarifa.
- `/api/ai-context`: Event "2026 Operating Season" caducado y `validThrough 2026-10-31` con InStock en los 4 Products; `sameAs` con coastrent, activitatum y escuela (mezcla de entidades).
- `/feed-llms.json` (38 items, 32 con "sin licencia"); `/feed-llms` y `.txt` dan 404.
- Perplexity responde con caché vieja: flota de 8 barcos con Astec 480, Solar 450 y Remus "sin licencia desde 75-80 €/h", y convierte nuestros bloques de 2 h en "160/180/200/220 €/h" y la excursión en "240 €/h".

**P1-10. Medición rota para lo que importa:** `booking_request_submitted` no se ha disparado ni una vez (investigar si el servidor no manda el evento o si el wizard cambió de endpoint); no es key event; `whatsapp_click` tampoco; `whatsapp_inquiries` no guarda landing de origen; las reservas con licencia entran por Click&Boat, invisible para GA4 y CRM. Hoy no se puede saber qué página trae reservas. MCP `seo-autopilot` caído 8 semanas (token revocado).

**P1-11. Canibalización de blog:** 13 slugs con "sin-licencia" (33 URLs con traducciones) y 6 posts compiten por Tossa (`barco-tossa-de-mar-desde-blanes`, `excursion-barco-tossa-de-mar-desde-blanes`, `alquiler-barco-tossa-de-mar-desde-blanes`, `ruta-barco-blanes-tossa-mar` y dos de Cala Pola casi idénticos). De los 54 posts ES leídos, 41 mencionan "sin licencia" y 40 llevan marcador de era (el único sin él, `efoil-blanes-sin-licencia`, es legítimo). 47 de 79 posts solo en español. 25 posts sin leer por los 429.

### P2

- Tossa y Lloret finos (120-250 palabras SSR); 3 de 6 FAQ de Tossa en JSON-LD; H2, schemas y alts en castellano en `location-tossa-de-mar.tsx` y `location-lloret-de-mar.tsx`; Calella/Malgrat/Santa Susanna con `faqTitle` y schema en castellano; `category-licensed.tsx` "Desde X€" a mano; ternarios inline con acentos perdidos (de "Haufig...", fr "Frequentes").
- Breadcrumb/ItemList/@id sin prefijo de idioma (slugs ES) en los 8 idiomas; og* solo en ES en `STATIC_META` de licensed; `SEASON_YEAR` calculado al arrancar; "3 lanchas" fijo en title.
- Entidad: OSM y Wikidata vacíos; `foundingDate 2019` y `numberOfEmployees 6` sin respaldo; sin desambiguación frente a **costabravarentboat.com** (Platja d'Aro, nombre casi idéntico), que sale #2 en tres consultas clave y se nos mezcla en Gemini y AI Mode ("Qué es CBRB": errores en AI Mode, Perplexity y Gemini). ChatGPT enseñó "4,2" junto a CBRB en el mapa (sin verificar; la web y Gemini dicen 4,8).
- Apple Maps: comprobar que ya no tiene el teléfono heredado de Tripadvisor.
- Cabeceras: `cache-control public, max-age=0, s-maxage=3600, swr=86400` en HTML; sin X-Robots-Tag, sin 5xx, sin cadenas de más de 1 salto, hreflang recíproco con canonical dentro del set en las 64 URLs, Googlebot y GPTBot reciben lo mismo (sin cloaking).

### Descartado o matizado
- `/es/precios` ya no dice "31 de mayo".
- Tossa sí existe en los 8 idiomas (no solo es/en), pero con cuerpo en castellano salvo en inglés.
- El post del titulín (13-sep) NO usa presente sobre la escuela: dice "habrá una más: la nuestra... todavía no tiene matrícula abierta ni precio publicado". Lo que sí promete es la mecánica ("te lo organizamos") en otras superficies.
- `llms.txt` principal sí tiene marcador de era y enlaza las 3 landings.
- Ningún motor erró la fecha del 1-oct ni el RD 1188/2025 ni citó "abril 2027".

---

## 4. SERP y motores de IA

SERP (Google ES; posiciones de la sesión de Ivan, inflables). Nuestra URL casi siempre es la home, no la landing:

| Consulta | Top 3 | Nosotros |
|---|---|---|
| alquiler barco con licencia blanes | CBRB, SamBoat, Blanes Boats | #1 (home) |
| alquiler lancha blanes | Blanes Boats, CBRB, SamBoat | #2 |
| alquiler lancha costa brava | Palamós Boats, costabravarentboat.com, Click&Boat | #6 |
| alquiler barco sin patrón costa brava | Nautal /sin-licencia, costabravarentboat, Click&Boat /sin-licencia | #10 |
| alquiler barco con patrón blanes | SamBoat, Freedome, CBRB (home) | #3 |
| excursión barco privada blanes | BlueSail, Yumping, Tripadvisor | #6 |
| alquiler barco tossa de mar | SamBoat, costabravarentboat, CheckYeti | #6 |
| alquiler barco blanes | Blanes Boats, SamBoat, CBRB | #3 |
| titulín costa brava | escuelas de Palamós, Baix Empordà, Empuriabrava | #4 |
| sacarse el titulín en un día / qué barco con el titulín / sin licencia 2026 | Málaga (boatmalaga, rumbonorte, cenautica), oceanautic, atarcabos | **no aparecemos** |
| ca / de / fr | | #2 / #1 y #3 / #2 |
| en: licence blanes, hire costa brava / rent a boat blanes | | #1 y #1 / #6 con la página ES |

Contraste con GSC: "alquiler barco con licencia blanes" sale #1 en la sesión de Ivan y en GSC la home está en pos 24-25. **No fiarse del #1.** Los marketplaces ocupan 3-5 puestos del top 10 casi siempre y AI Overview aparece en casi todas (en las de Blanes ya nombra a CBRB).

Motores de IA (¿nos cita? / error):

| Pregunta | AI Mode | Perplexity | ChatGPT (gratis) | Gemini |
|---|---|---|---|---|
| Sin licencia 2027 | cita, ok | cita, ok | cita, ok | no cita, ok |
| Barcos con licencia y precios | cita, ok | cita, ERROR | cita #1, ok | nos mezcla con competidores |
| Titulín en 1 día | cita, ok | no | no | no |
| Tossa con titulín | sí | sí | **ERROR: "No"** | sí |
| Con patrón | cita | cita | cita #1 | abajo (BlueSail 1º) |
| Seguro | cita, ok | cita, "todo riesgo" genérico | no | no, "todo riesgo"/SOV genérico |
| Qué es CBRB | ERROR | ERROR | ok | ERROR |
| EN sin licencia | ok | ok | ok | no cita |

ChatGPT contamina con memoria (inventó una "semirrígida de 6,8 m"). Copilot bloqueado. Que ChatGPT diga que el titulín no permite ir a Tossa choca con nuestra tesis (la LN basta para la flota con licencia y Tossa queda a 30-45 min): **verificar la tesis contra RD 875/2014 y la tabla de atribuciones antes de reforzarla en contenido**; no decidirlo aquí.

---

## 5. Competencia

| Competidor | "Sin licencia" vivo | Cita RD 1188 | Precios con licencia publicados |
|---|---|---|---|
| Rent a Boat Blanes | SÍ, 5 barcos "sin titulación" desde 80 € | No | solo "desde 80" |
| Eric Boats | SÍ (filtro y 5 barcos de 15 CV) | No | web sin precios; terceros: medio día desde 200 €, patrón 280 €; **vende el curso del titulín a 170 €** |
| Blanes Boats | No lo dice | No | ninguno |
| BlueSail | solo con patrón | No | casi ninguno (fiestas desde 35 €/pax) |
| Rent Boats CB (Palamós) | Trimarchi 53S 15 CV a 170 € | No | 180-250 € (sin unidad) |
| costabravarentboat (Platja d'Aro) | No | No | desde 280 € (sin unidad) |
| Click&Boat | categoría sin licencia viva, desde 87 €/día | No | desde 138 €/día |
| SamBoat | Sí | No | licencia obligatoria desde 145 €/día |
| Nautal | Sí | No | desde 191 € |

Nadie menciona el RD 1188/2025 y solo nosotros publicamos precios de lanchas con licencia (175/2 h Mingolla y Trimarchi, desde 200/2 h Pacific, 265/2 h excursión, coincide con `boatData.ts`). Eric Boats ya vende titulín: la ventana para el nicho se estrecha.

---

## 6. Tabla intención de búsqueda -> página -> hueco

| Intención | Página hoy | Estado |
|---|---|---|
| alquiler barco / lancha con licencia Blanes | `/es/barcos-con-licencia` | Existe y está indexada pero Google sirve la home; pos 30-36, 0 clics |
| lancha sin patrón / por horas | categoría + `alquiler-barco-por-horas-costa-brava` | Go a la home; revisar cifras del post |
| barco con patrón / excursión privada | `/es/alquiler-barco-con-patron`, ficha excursión | Landing pos 38-52; hero sin foto/CTA; precios JSON-LD erróneos |
| titulín en un día / qué lancha llevo con el titulín | pilar + posts | Pilar pos 8-13 (único bien asignado); no aparecemos en "sacarse el titulín en un día" ni "qué barco con el titulín" (Málaga) |
| sin licencia 2026/2027, qué hacer ahora | `/es/barcos-sin-licencia` + 13 posts | La página más vista (2.899 impr/90 d, pos 16) y los posts se canibalizan; **hueco: "alternativas tras el fin del sin licencia"** |
| Tossa desde Blanes (licencia o patrón) | `/es/alquiler-barcos-tossa-de-mar` + 6 posts | pos 18-21, 2.380 impr; canibalizada, SSR distinto del cliente, cuerpo en castellano |
| licencia para extranjeros (boat licence Spain, Bootsführerschein) | pilar en 8 idiomas | Cubierto en parte; **hueco: landing de requisitos para extranjeros** |
| seguro del barco | FAQ de fichas | Contradicho por `llms-full.txt`; **hueco: página de seguro conforme a `INSURANCE_SCOPE_ES`** |
| catalán "lloguer amb llicència" | `/ca/vaixell-amb-llicencia` | CBRB #2 en SERP; FAQ i18n incompleta |
| comparar con Click&Boat/SamBoat | ninguna | Hueco (sin comparar precios, por art. 6.1.1) |
| desambiguación frente a costabravarentboat.com | ninguna | Hueco de entidad |

---

## 7. Backlog por olas (sin código tocado todavía)

**Ola 0, hoy (decisiones y comprobaciones de Ivan, 1-2 h)**
- Entrar en Click&Boat y SamBoat y despublicar o confirmar despublicados todos los anuncios sin licencia (P0-3). Criterio: lista de anuncios vivos de CBRB = solo los 3 con licencia (+ excursión).
- GBP (P0-1): quitar el servicio "Alquiler de embarcaciones sin licencia", quitar "abril de 2027", poner la política de cancelación vigente y "435 reseñas" o quitar la cifra. Criterio: la ficha no promete nada que el repo prohíba.
- Renovar el token del MCP `seo-autopilot` (CRM -> Autopilot -> tokens MCP) y reconectar sesión de Bing.
- Confirmar con quien corresponda la tesis legal "con la LN llevas la flota con licencia y llegas a Tossa" frente a la respuesta de ChatGPT.

**Ola 1, veracidad y riesgo legal (1 día de código, crítica)**
- Barrer seguro/"todo riesgo", "PER o PNB", "Range: Unlimited", pack del titulín, precios de excursión (240, 7 pax, fianza 500) en `llms-full.txt`, 7 `llms.txt`, `aiCitationFacts.ts`, `aiSearchIndex.ts`, `robots.ts` (agent.json, ai-context), `es.ts` `navigationLicensePage`, `postEraMeta.ts`, seeds de blog y post en vivo `mayo-junio-...`. Fuente única: `boatData.ts`, `pricing.ts`, `INSURANCE_SCOPE_ES`.
- Quitar "Curso de 1 día" / "Licence in 1 Day or Skipper" de titles y metas (`es.ts:6168`, `postEraMeta.ts`, `en.ts:65`) y sustituir por framing que no sugiera curso propio ("Titulín: qué es y qué lanchas puedes llevar").
- `robots.ts`: repetir los `Disallow` del grupo `*` en cada grupo de bot IA; añadir `Sitemap` de llms.
- Extender `shared/escolaNauticaLinks.test.ts` y/o añadir un test que escanee `blogSeed.ts`, `blogCrossLinkSeed.ts` y `llms*` contra las frases prohibidas.
- Criterio de hecho: `grep` de las frases prohibidas = 0 en repo y en producción (`curl` de los 10 ficheros), tests en verde.

**Ola 2, paridad SSR/cliente y JSON-LD (1-2 días)**
- Fichas: Product con `Offer` de 2 h bien etiquetado (no "por hora"), `url` por idioma, `name/description` localizados desde `boatDescriptions`, quitar "License-Free Boat Rental", `sku` y `additionalProperty`, `BUSINESS_RATING_STR`; mismo title SSR y cliente.
- Tossa: un único title/description por idioma (SSR = `seo-config`), "alquiler/rental" en el title, cuerpo SSR nativo en los 8 idiomas, FAQ 30-45 min, quitar "sin licencia" en presente.
- Precios en JSON-LD de licensed, patrón y Tossa derivados de `pricing.ts` (no 160/240/420); `aggregateRating` solo en el negocio, no en cada Service/Product; Event y `validThrough` 2027.
- Criterio: test que compara title SSR con `seo-config` por idioma; Rich Results Test sin avisos en las fichas.

**Ola 3, asignación de URL y enlazado interno (2-3 días, el mayor palanca SEO)**
- Descargar la home de las intenciones de patrón, lancha y sin patrón; reforzar las landings (hero con foto y CTA en móvil, precios arriba) y enlazar home -> landings -> fichas -> titulín con anchors exactos.
- `bodyFallback` con enlaces internos reales en licensed, patrón, titulín, Tossa y fichas (los bots sin JS no ven nada hoy); arreglar el de la home (`/barcos` 301).
- Sitemap: las 32 fichas con hreflang completo y `lastmod` real (añadir `updated_at` a `boats` o derivarlo de contenido); `lastmod` en landings.
- Fichas con 300+ palabras SSR: descripción, specs, fianza, tabla de precios, FAQ, "qué titulación necesitas", enlaces a categoría y titulín.
- Soft 404 a 404 real; redirects (`/excursion-barco-privado` a patrón; fichas retiradas a 301 a la categoría; quitar los 404 de mirimare y astec-400); unificar duplicados por idioma (301 al slug correcto).
- Criterio: en GSC las 3 landings pasan a ser la URL servida para "con licencia", "con patrón" y "lancha" a los 28 d (hoy 22, 19 y casi 0 impresiones); 0 soft 404 nuevos en el informe de páginas.

**Ola 4, contenido nuevo (la apuesta de 2027)**
1. Página "Fin del alquiler sin licencia: tus 3 alternativas" (titulín, lancha con licencia, excursión con patrón) con precios reales, que absorba el tráfico de `/es/barcos-sin-licencia` y consolide los 13 posts "sin licencia" con 301 y marca de era.
2. Guía "Qué lancha puedes llevar con el titulín" y "Cómo sacarte el titulín en un día": informativa, sin curso propio mientras la escuela no esté autorizada, con checklist de costes (sin cifras propias), RD 875/2014 y las 3 lanchas.
3. Blanes-Tossa con titulín (norma citada), consolidando los 6 posts de Tossa.
4. Requisitos para extranjeros (boat licence Spain) en en/de/fr/nl/it, con el verificador de licencia.
5. Seguro del alquiler conforme a `INSURANCE_SCOPE_ES`.
6. Desambiguación de marca ("no confundir con...") en GBP, schema (`alternateName`) y FAQ.
- Criterio: cada página con su intención, enlazada desde categoría y home, i18n en los 8 idiomas en el mismo commit (arrays a mano) y sin la lista de frases prohibidas.

**Ola 5, entidad y GEO**
- `sameAs` único en las tres superficies (`robots.ts`, `seoInjector.ts`, `seo-config.ts`), sin escuela ni marcas hermanas; OSM y Wikidata; `foundingDate` y empleados reales; revisar Apple Maps.
- `/feed-llms`, `ai-search`, IndexNow (solo URLs cambiadas, blog con prefijo de idioma); `llms.txt` por idioma incluido `/en/llms.txt`.
- Forzar re-rastreo y regenerar vectores de ai-search tras la Ola 1 para limpiar la caché de Perplexity.

**Ola 6, medición**
- Arreglar `booking_request_submitted` (por qué no dispara), marcar key events (`booking_request_submitted`, `whatsapp_click`), guardar landing de origen en `whatsapp_inquiries`, cruce con CRM, registro mensual de reservas de Click&Boat.
- Repetir GSC/GA4 cada lunes y guardarlos en `docs/` (los exports de la raíz llevan congelados desde el 30-sep).

## 8. KPIs propuestos (baseline = sección 2; revisar a 28 y 90 d)

| KPI | Baseline | Propuesta |
|---|---|---|
| URL servida para "con licencia" | home 344 de 380 impr | categoría > 60 % de las impresiones |
| `/es/barcos-con-licencia` posición | 36 (pos 9 en agosto) | < 15 |
| Impresiones cluster con licencia | 157 en 22 d | x3 a 90 d |
| Clics cluster con licencia | 0 | > 0 y creciendo semanal |
| Fichas con impresiones | 1 de 3 | las 3 en 8 idiomas |
| Indexación fichas (3 x 8) | 9 de 24 verificadas | 24 de 24 |
| `/es/alquiler-barco-con-patron` posición | 38 | < 20 |
| Frases prohibidas en repo y producción | decenas | 0 |
| Anuncios sin licencia en marketplaces | sin verificar | 0 |
| Leads trazables a landing | 0 | 100 % WhatsApp y formularios |

Los objetivos son propuestas, no promesas: la demanda de "con licencia" hoy es de cientos de impresiones, no de miles, y la ganancia grande está en capturar la transición desde "sin licencia".

## 9. Pendiente de Ivan
Click&Boat/SamBoat (Ola 0), GBP (Ola 0), token MCP, sesión de Bing, decisión legal sobre Tossa+LN, ficha GBP de la escuela (sigue sin decidir) y ok antes de reindexar en GSC (pendientes: home, titulín, post fin-alquiler, 9 URLs de jet ski/eFoil y las fichas).
