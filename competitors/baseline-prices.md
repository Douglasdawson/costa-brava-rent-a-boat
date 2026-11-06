# Baseline de precios y flota — competidores

> Primer scan: 2026-08-07. Última actualización incremental: 2026-10-06 (costabravarentboat copy "13 embarcaciones", 12 listadas).
> Este archivo es la referencia contra la que los watch
> posteriores comparan. Actualizar de forma incremental (no reescribir entero):
> cuando un precio/flota cambie, anotar el valor nuevo + fecha, conservando el viejo.
> Precios tal cual publicados en la web del competidor ("desde X€"); cuando el
> competidor no publica precio se marca "no publicado (motor de reserva/presupuesto)".

## CBRB (nosotros) — referencia interna
Fuente: `shared/boatData.ts`. Temporada BAJA (abr-jun, sep-oct) / MEDIA (jul) / ALTA (ago).

Sin licencia (Solar 450 / Remus 450, floor de la flota viva; gasolina incluida):
- 2h: 115 (BAJA) / 140 (MEDIA) / 160 (ALTA)
- 4h: 150 / 200 / 220
- 8h: 220 / 270 / 320
- Floor publicitario: 75 €/h (BAJA 1h)

Excursión Privada con Capitán (6 pax, no incluye gasolina):
- 2h: 240 (BAJA) / 260 / 280
- 4h: 380 (BAJA) / 400 / 420
- No hay opción "día completo" con patrón (máximo 4h)

AOV ≈ 162 €. Flota viva: 8 embarcaciones (4 sin licencia + 3 con licencia + 1 excursión). Puerto de Blanes.

**Corrección 2026-09-24**: las cifras de arriba estaban desfasadas respecto a `shared/boatData.ts`.
Valores vigentes leídos hoy (BAJA / MEDIA / ALTA, Solar 450 = Remus 450 = Remus 450 II):
- 1h: 85 / 95 / 110 · 2h: 135 / 155 / 175 · 4h: 180 / 220 / 240 · 8h: 240 / 295 / 350
- Astec 480: BAJA 1h 95 · 2h 165 · 4h 220 · 8h 295. Astec 400 (desactivado): BAJA 1h 80.
- Excursión Privada con patrón BAJA: 2h 265 · 3h 350 · 4h 420.
- Con licencia BAJA 2h/4h/8h: Mingolla 175/255/310 · Trimarchi 57S 175/265/320 · Pacific Craft 625 200/275/330.
- Ojo: el floor público lo calcula en vivo `fleetStatsCache` (puede incluir `pricing_overrides`); estas son tarifas de lista.
- **Desde el 1-oct-2026 (RD 1188/2025) la oferta "sin licencia" deja de ser legal para alquiler**; `isLicenseFreeEraActive()` apaga el copy datado ese día.

---

## 1. bluesailcostabrava.com — Blanes (content-led)
- **Base**: Puerto de Blanes (oficina Blanes + Lloret). Ubicaciones: Blanes, Lloret, Tossa, Barcelona, Platja d'Aro.
- **Modelo**: NO alquiler self-drive prominente. Empuja charter privado CON patrón + catamarán + party boat.
- **Precios**: no publicados (presupuesto/reserva) salvo excepción abajo. Traslado embarcaciones "desde 5 €/NM".
- **Update 2026-08-18**: primer precio público real detectado — **catamarán compartido 50 €/persona** (niños <12, -50%), en el post de blog "Cuánto cuesta una excursión en barco en la Costa Brava" (publicado 2026-03-31, no es cambio de esta semana). Barco privado con patrón sigue sin precio fijo.
- **Update 2026-08-18 — punto ciego de scan corregido**: el blog completo (`/blog/`) tiene **4 páginas, ~30-40 posts**, no solo el post "Fuegos de Blanes" destacado en el nav (que es lo único que se había revisado en los scans 08-07 a 08-14). Posts confirmados hoy (todos preexistentes, no nuevos de esta semana): "Cuánto cuesta una excursión..." (2026-03-31), "Qué hacer en Blanes", "Las mejores calas de la Costa Brava", "Barco privado vs catamarán", "Excursión en barco Costa Brava: qué incluye", "Preguntas frecuentes sobre excursiones", "Excursión en barco desde Blanes: guía completa 2026", "Qué hacer en Lloret de Mar", "Las mejores excursiones en barco en la Costa Brava", "Excursiones en barco Costa Brava: cuál elegir (guía 2026)", "Qué hacer en la Costa Brava: guía definitiva 2026". Pendiente auditar páginas 2-4 del archivo. A partir de ahora el checklist de contenido debe entrar siempre al archivo completo del blog, no solo al enlace del nav.
- **Flota/producto** (por capacidad citada):
  - Barcos privados con patrón: 11, 22 y 25 pax
  - Catamaranes: 80, 97, 115 y 143 pax (compartido y privado; party boat hasta 44 pax privado)
  - Producto estrella: "La Ruta del Contrabando" — excursión privada 3h Blanes→Tossa
- **Contenido**: blog activo. Post "Los Fuegos de Blanes 2026" (slug .../los-fuegos-de-blanes-2023, título actualizado a 2026). og:updated_time 2026-03-20.
- **Mensaje**: +25 años de experiencia; campamentos náuticos escolares; trabajos de síntesis del medio marino.
- **Tel**: +34 872 72 32 50 (Blanes) / +34 972 10 86 47 (Lloret) / WhatsApp +34 657 85 29 04.
- **Update 2026-09-29**: home ES og:updated sigue en 2026-03-20; EN en 2025-02-21. Sin precios nuevos. Copy de home: "tengas titulación o no, déjate llevar por uno de nuestros patrones" (producto con patrón, no depende del sin licencia). Sin posts nuevos detectados vía búsqueda.

## 2. rentboatscostabrava.com — Palamós (posicionamiento regional)
- **Base**: Port Marina de Palamós (NO Blanes; ~40 km norte, zona Palafrugell). Horario 09:00-18:00.
- **Claim SEO**: "la mayor flota de barcos sin licencia en la Costa Brava" (a verificar; en la grid solo 1 sin licencia visible).
- **Seguro incluido** en todos los alquileres. Trato directo sin intermediarios. Idiomas: es/ca/en/fr/nl.
- **Flota visible** (desde €, año, pax, eslora):
  - Calion 197 Leros — CON licencia — 190 € — 2024 — 7 px — 6.2 m
  - Trimarchi 53s — SIN licencia — 170 € — 2024 — 6 px — 5.3 m
  - Calion 730 — CON licencia — 250 € — 2024 — 8 px — 7.5 m
  - Trimarchi 57S — CON licencia — 180 € — 2024 — 7 px — 5.9 m
  - Remus 620 — CON licencia — 210 € — 2021 — 8 px — 6.2 m
- **Contenido**: página flota modificada 2026-06-30. Guía náutica + rutas Palamós. Landings SEO por localidad (Tossa, Begur, Llafranc, etc.).
  - **Update 2026-08-11**: la red de landings por localidad está ahora con URLs VIVAS en el footer (antes placeholders `#`): sin-licencia + con-licencia para Palamós, Sant Antoni de Calonge, Platja d'Aro, Calella de Palafrugell, Llafranc, Tamariu, Begur, S'Agaró, Sant Feliu de Guíxols y **Tossa de Mar**. Grid de flota y precios SIN cambios (mod. sigue 2026-06-30).
  - **Update 2026-08-14**: claim de flota precisado leyendo la página "Nosotros" (`article:modified_time` 2025-06-16, copy VIEJO no nuevo): declara "19 embarcaciones, 14 sin licencia". El grid reservable (`/barcos-de-alquiler-costa-brava/`) sigue mostrando solo **5 barcos** (misma discrepancia marketing-vs-grid). Precios de los 5 del grid SIN cambios. Satisfacción declarada: 75 % (grid) / 85 % (nosotros), inconsistencia interna.
- **Tel**: +34 608 909 409.
- **Update 2026-08-25**: grid de 5 barcos y precios confirmados idénticos carácter por carácter (170-250€). Sin cambios.
- **Update 2026-08-28**: grid y precios confirmados idénticos de nuevo (170-250€). `article:modified_time` sigue en 2026-06-30.
- **Update 2026-09-24**: grid (5 barcos) y precios idénticos (170-250€); mod. 2026-06-30. Sigue vendiendo "la mayor flota sin titulación" sin marco temporal a 6 días del RD 1188/2025.
- **Update 2026-09-29**: grid (5 barcos) y precios idénticos (170-250€); mod. 2026-06-30. Meta-description sigue con "la mayor flota sin titulación de la zona" a 2 días del RD. Footer de landings por localidad sigue vivo.

## 3. costabravarentboat.com — Platja d'Aro / Tossa / Llançà ⚠️ DEFENSIVO (1 letra de diferencia)
- **Base**: Club Nàutic Port d'Aro (Platja d'Aro) + Tossa de Mar + **Llançà (NUEVO 2026)**.
- **Modelo**: barcos grandes con y sin patrón + tours privados todo incluido (charters) para quien no tiene título. Hasta 21 px.
- **Flota (12 barcos), precio "desde"** (probable medio día/4h):
  - QuickSilver 605 Sundeck — 280 € — 7 px — 150 hp
  - Promotor 600 — 280 € — 8 px — 130 hp
  - QuickSilver 755 Sundeck — 380 € — 8 px — 225 hp
  - BSC 10 Elegance — 300 € — 10 px — 150 hp
  - Bombard 700 Sunrider — 300 € — 10 px — 200 hp
  - QuickSilver 805 Open — 470 € — 10 px — 250 hp
  - Promotor 800 — 470 € — 10 px — 300 hp
  - BSC 12 Elegance — 420 € — 12 px — 250 hp
  - QuickSilver 875 Sundeck — 610 € — 12 px — 2x250 hp
  - Zephyr 900 — 610 € — 12 px — 2x150 hp
  - Quer 35 — 810 € — 21 px — con patrón
  - Bellini Astor 36 — 2100 € — 11 px — 2x350 hp
- **Segmento**: grupos grandes / gama alta. Sin flota barata sin-licencia self-drive. Solapamiento con Blanes: solo marca (confusión) + Tossa.
- **Tel**: +34 669 008 529 (Silvia) / +34 695 662 794.
- **Update 2026-08-25**: 12 barcos y precios confirmados idénticos (280-2100€). Llançà sigue "novedad 2026". Sin blog. Sin cambios.
- **Update 2026-08-28**: 12 barcos y precios confirmados idénticos de nuevo (280-2100€). Llançà sigue "novedad 2026". Sin blog. Sin cambios.
- **Update 2026-09-24**: 12 barcos y precios idénticos (280-2100€). Nuevo dato visible: unidades por modelo (605 Sundeck x4, Promotor 600 x2, 755 Sundeck x3, resto x1 = 17 cascos). Sin blog. Sin cambios de precio.
- **Update 2026-09-29**: 12 barcos, 17 unidades, precios idénticos (280-2100€). Sin cambios.

## 4. blanesboats.com — Blanes (competidor geográfico directo, fuerte EN)
- **Base**: Pg. de Mestrança 116, 17300 Blanes (misma calle que CBRB, Passeig Mestrança). Idiomas ca/es/en/fr.
- **Modelo**: alquiler con y sin licencia + fishing charters (bottom fishing, jigging, trolling) + trips con capitán + rental toys.
- **Precios**: no publicados en la web (motor de reserva bookings.blanesboats.com).
- **Condiciones**: gasolina NO incluida en licenciados; licence-free Voraz "FUEL INCLUDED". Recargo 150 €/30 min por retraso. Seguro a terceros + cobertura física tripulación.
- **Flota** (pág. 1 de 2):
  - Sin licencia (fuel incluido): VORAZ 500 (x2, 6 px), VORAZ 450 (x4: 1/2/3/6, 5 px) — flota Voraz self-drive, solapa 1:1 con nuestra flota sin licencia
  - Con licencia: Jeanneau Cap Camarat 9.0 CC (11 px), Beneteau Flyer 7.7, Marion, Pacific Craft 670 Open, Jeanneau Cap Camarat 6.5 CC, 6.5 WA, Invictus FX 190 (7 px), Shiren 23 Open, AV 696
- **Tel/WhatsApp**: +34 690 222 118. Fuerte en TripAdvisor.
- **Update 2026-08-25**: página 1 de flota sin cambios. Meta-keywords sigue incluyendo "eric boats, eric boats blanes" (varias semanas consecutivas de persistencia).
- **Update 2026-08-28**: página 1 de flota confirmada idéntica (9 licenciados + Voraz 500 x2 + Voraz 450 unidades 1/6/2/3). "eric boats, eric boats blanes" sigue en meta-keywords.
- **Update 2026-09-24**: página 1 idéntica. "eric boats" sigue en meta-keywords (ahora sabemos que EricBoats es otro operador del mismo puerto: Blanes Boats está metiendo la marca del competidor en sus keywords). Condición de reserva visible: 50% de pago para confirmar.
- **Update 2026-09-29**: página 1 idéntica (9 con licencia + Voraz 500 x2 + Voraz 450 unidades 1/6/2/3, todas "NO LICENSE FUEL INCLUDED"). "eric boats" sigue en meta-keywords. Sin reacción al RD.

## 5. samboat.com/blanes — marketplace (baja precios, capta volumen)
- **Modelo**: marketplace de propietarios. 27-28 barcos sin licencia listados en Blanes (26 motor + 1 RIB).
- **Precios (USD, /día)**: desde $103,88 (Voraz 450 open, 5 px, 15 HP) hasta media $241,23/día. Floor sin-licencia ~$103-138.
  - Voraz 450 open (varias unidades, mismos barcos físicos que Blanes Boats): $103,88 / $126,96 / $138,50 según unidad
  - Voraz 500 open: desde $138,50 (6 px)
  - Astec 400 (Sant Andreu de Llavaneres, cerca): $115,42 con combustible + limpieza incluidos
- **Capacidad**: 4-7 px. Reseñas altas (patrón "Jose/Josep"). Pago online + fianza vía plataforma.
- **Nota**: precios en USD; a EUR el floor ≈ 95-125 €/día. Undercut estructural sobre tarifa/hora, pero son listings bare de propietario con comisión de plataforma.
- **Update 2026-08-11**: 27 → **28 listings** (26 motor + 1 RIB). Suelo $103,88 → **$104/día** (plano). Media $241,23 → **$243,81/día** (+1,1%). Astec 400 Sant Andreu de Llavaneres $115,42 → $115,55. Ningún cambio cruza el umbral del 10%.
- **Update 2026-08-14**: 28 listings (plano). Suelo real (listing más barato) **$103,81/día** (Voraz 450, unidades 186848/186847/186849/186841/122224) vs $104 (plano). Media **$243,37/día** vs $243,81 (plano). El titular meta "desde $138,41" es el "from" que fluctúa por disponibilidad, no el suelo real. Astec 400 SdLl $115,55 → $115,34 (plano). Ningún cambio cruza el 10%.
- **Update 2026-08-18**: 28 listings (plano). Suelo real **$104,34/día** (mismos listings Voraz 450: 122224/186848/186847/186841/186849) vs $103,81 (plano, +0,5%). Media **$244,61/día** vs $243,37 (plano, +0,5%). Titular meta hoy "desde $139,12" — mismo patrón de ruido ya documentado (el listing más caro sale primero en el orden de scraping del titular). Ningún cambio cruza el 10%.
- **Update 2026-08-25**: 28 listings (plano). Suelo real **$104,34/día** y media **$244,61/día** — idénticos a 08-18, primera vez sin el +0,5% de ruido habitual. Titular meta "desde $139,12" (idéntico). Astec 400 Sant Andreu de Llavaneres $115,34 → $115,93 (+0,5%, dentro de ruido). Ningún cambio cruza el 10%.
- **Update 2026-08-28**: página propia inconsistente en el recuento ("24 boats available in Blanes" en el cuerpo vs "26 motorboats + 1 RIB" = 27 en el desglose); se documenta la inconsistencia, no se puede confirmar 28 exacto hoy. Suelo real (listings individuales Voraz 450) **$104,81/día** vs $104,34 (+0,45%, dentro de ruido). Media declarada **$245,71/día** vs $244,61 (+0,45%). Titular meta hoy "desde $139,74" (ruido de scraping, no es el suelo real, mismo patrón documentado semanas anteriores). Astec 400 Sant Andreu de Llavaneres $115,93 → $116,45 (+0,45%, dentro de ruido). Ningún cambio cruza el 10%.
- **Update 2026-09-24** (URL `/boat-rental/blanes/without-license`): la página declara **24 listings** (22 motor + 2 RIB) vs 27-28 en agosto (-4, fin de temporada o cambio de URL de conteo; no concluyente). Suelo real Voraz 450 **$102,70/día** vs $104,81 (-2,0%). Media **$233,93/día** vs $245,71 (-4,8%). Titular meta "desde $171,17" (mismo ruido de titular). Astec 400 SdLl $114,11 (-2,0%). Ningún cambio cruza el 10%. Página general Blanes (todas las categorías): 206 barcos, "desde 120 €/día".
- **Update 2026-09-29**: 24 listings (22 motor + 2 RIB, plano). Suelo real Voraz 450 **$102,40/día** vs $102,70 (-0,3%). Media **$233,25/día** vs $233,93 (-0,3%). Titular meta "desde $170,67" (ruido). Astec 400 SdLl $113,78 (-0,3%). Ningún cambio cruza el 10%. Sigue listando sin licencia sin aviso del RD.

---

## Marketplaces recurrentes en SERP (candidatos a añadir a la lista)
Aparecen repetidamente en las SERP de "alquiler barco Blanes / Costa Brava":
Click&Boat, Nautal, Borrow A Boat, Boataround, Oceans Evasion, CheckYeti. **Click&Boat y Nautal**
aparecen >3 veces: candidatos a vigilancia de marketplace junto a SamBoat.

Operador local nuevo en el radar (2026-08-14): **EricBoats (ericboatsblanes.com)** — alquiler
en Blanes, aparece en SERP EN de "boat rental Blanes without license" y embebido en los
meta-keywords de Blanes Boats. 1ª detección; vigilar recurrencia (>3) antes de añadir a la lista.

**Update 2026-08-18**: 3ª+ detección consecutiva (meta-keywords de Blanes Boats de nuevo hoy +
SERP directo "EricBoats - Alquiler de embarcaciones en Blanes" + fichas en directorios
enrollbusiness.com y rent.boats). Se propone formalizar como 6º operador vigilado en el próximo
scan. Un snippet de búsqueda menciona "desde 80€" pero NO está verificado en el sitio (fetch
directo devolvió página vacía, probable renderizado JS pesado); pendiente visita con navegador.

**Update 2026-08-25**: 4º intento de fetch consecutivo (08-18, 08-25) sigue devolviendo página
vacía (renderizado JS). Propuesta de formalización sigue en pie pero bloqueada hasta poder
visitarlo con navegador (Claude in Chrome / computer-use) en una sesión interactiva.

**Update 2026-08-28**: 5º intento de fetch consecutivo, sigue vacío (JS). Sin cambios. Un
snippet de búsqueda repite "desde 80€" (mismo dato no verificado citado el 08-18) —
coincidencia con el floor publicado hoy por el nuevo hallazgo `rentaboatblanes.com` (ver abajo),
pero son operadores distintos (razón social y dominio diferentes); no asumir que son la misma
empresa sin visita directa.

---

## 6. rentaboatblanes.com — Blanes ⭐ NUEVO (1ª detección 2026-08-28), mismo puerto que CBRB
- **Base**: C/ Esplanada del Port, Blanes 17300 — mismo puerto que CBRB. Empresa "Boat Rental
  Blanes, S.L.", copyright de footer "2017" (no es una empresa nueva, solo nueva para este
  watch). Reservas vía FareHarbor. Idiomas es/ca/en/fr.
- **Flota** (5 barcos, todos sin licencia, gasolina incluida, todos "desde 80€"):
  - Estable 415 I — 5 pax
  - Estable 415 II — 5 pax
  - Estable 415 III — 5 pax
  - Marion 450 — 5 pax
  - Marion 500 — 4+2 pax
- **Precio**: "DESDE 80€" en las 5 fichas, franja horaria no especificada en la página de
  listado (pendiente visitar fichas individuales para extraer tabla completa por franja).
- **Contenido**: sitio básico, 5-6 páginas, sin blog. Meteo (Windguru/Meteocat) enlazado.
- **Tel/WhatsApp**: +34 601 909 910.
- **Por qué importa**: mismo puerto exacto que CBRB (no otra localidad), mismo segmento (sin
  licencia + gasolina incluida), floor a solo 5€ de nuestro floor publicitario de 75€/h. Es el
  competidor de precio más cercano geográfica y comercialmente detectado hasta ahora, más
  relevante que EricBoats o SamBoat en este eje. Propuesta: formalizar como 6º operador vigilado
  desde ya (datos completamente accesibles por fetch simple, sin el bloqueo JS de EricBoats).
- **Update 2026-09-24 — tabla de precios extraída** (ficha Estable 415 I; gasolina incluida, fianza 200€,
  + gastos de gestión si reserva web). Temporadas propias: BAJA = 1/6-30/6 y 1/9-30/9; ALTA = 1/7-31/8
  (no publican abril-mayo ni octubre).
  - BAJA: 2h 125 € · 4h 160 € · 6h 200 € · 8h 240 €
  - ALTA: 2h 130 € · 4h 180 € · 6h 230 € · 8h 275 €
  - El "desde 80€" del listado no aparece en la ficha (probable 1h no publicada o precio antiguo).
  - Tel. en web +34 601 909 910; un snippet de buscador da 636 71 80 16 (dato viejo, no verificado).
  - Horario 09-21h. Reserva: 40% de señal (snippet de su FAQ).
- **Update 2026-09-29**: listado idéntico (5 barcos, "DESDE 80€ / SIN TITULACIÓN", reserva vía FareHarbor). Sin aviso del RD.

---

## 7. ericboatsblanes.com — Blanes ⭐ desbloqueado 2026-09-24 (mismo puerto que CBRB)
- **Base**: Club de Vela Blanes, Esplanada del Port s/n. EricBoats, S.L. (también opera en Sitges:
  su Facebook es "ericboatssitges"). Tel +34 696 409 149 / +34 607 198 519. Idiomas es/ca/en/fr.
- **Flota (12)**: sin licencia — Remus 450, Voraz 450, Voraz 475, Cobra 480 sport (6+2 px), Voraz 500
  (6 px); con licencia — Flyer 5.5 Spacedeck (90hp), Cap Camarat 5.5 (115hp), Marsea CM100 (100cv),
  Key Largo 22 (150hp), Cap Camarat 650 (150hp), Sportdeck 6.6 (150hp, 10 px), Cobra RIB 700 (250hp, 12 px).
- **Precios Voraz 450** (gasolina incluida; ALTA = 1/7-31/8): BAJA 1h 80 · 2h 135 · 4h 180 · 8h 270;
  ALTA 1h 85 · 2h 150 · 4h 200 · 8h 295. Incluye nevera con hielo, snorkel y cañas.
- **Reserva**: por teléfono/formulario (sin pago online visible). Ficha modificada 2026-02-10.
- Home modificada 2024-11-13: no ha tocado copy por el RD 1188/2025.
- **Update 2026-09-29**: menú de flota idéntico (12). Home sigue con mod. 2024-11-13. Sin reacción al RD.

---
## Update 2026-10-02 (primer scan post-RD 1188/2025)
- Precios y flotas de los 7 operadores sin cambios >10 %. SamBoat sin licencia: suelo $101,68/día (-0,7 %), media $231,61, 24 listings.
- rentaboatblanes, Blanes Boats, EricBoats, SamBoat y rentboatscostabrava siguen publicando oferta "sin licencia" sin aviso del RD.
- rentboatscostabrava declara hoy "20 embarcaciones" (grid sigue en 5). BlueSail: sin posts nuevos (blog 4 páginas).

## Update 2026-10-09
- Sin cambios >10 % en precio o flota. RentBoatsCB 5 barcos 170-250 €; CostaBravaRentBoat 12 modelos 280-2100 € (ya sin claim "13 embarcaciones"); rentaboatblanes 5 barcos "desde 80 €"; BlueSail blog p.1 idéntico; Blanes Boats Voraz 450 sin licencia. SamBoat sin licencia: 24 listings, suelo hoy $167,79 (con filtro, no comparable con $101,68).
- Ninguno menciona el RD 1188/2025.

- **Update 2026-10-13**: RentBoatsCB (5 barcos, 170-250€), CostaBravaRentBoat (12 modelos, 280-2100€, 18 unidades listadas), BlueSail blog p.1 (mismos 10 posts), Blanes Boats portada (Voraz 450 x4 sin licencia) sin cambios. SamBoat sin licencia mostró $55,91 (media=suelo, "0 available listings"): dato no fiable, baseline $102,40 se mantiene.

- **Update 2026-10-20**: sin cambios >10 % en ningún operador (RentBoatsCB 5 barcos 170-250 €; CostaBravaRentBoat 12 modelos, 18 uds; BlueSail blog p.1 idéntico; Blanes Boats Voraz 450 x4). SamBoat $56,13 no fiable. Alerta RD 1188/2025 +1 (7).

## Update 2026-10-23
- Sin cambios de precio/flota en RentBoatsCB (170-250), CostaBravaRentBoat (280-2100), Blanes Boats (Voraz 450 x4 sin licencia). BlueSail blog p.1 idéntico (41 entradas). SamBoat no accesible/no comparable (baseline $102,40 se mantiene).
- **Update 2026-10-27**: rentboatscostabrava grid idéntico (170-250€) pero mod_time 2026-10-26. Resto sin cambios.

- **Update 2026-11-03**: sin cambios >10 % (RentBoatsCB 170-250; CostaBravaRentBoat 280-2100; rentaboatblanes 5 barcos desde 80). Blanes Boats Voraz 450 x5 (antes x4). BlueSail blog p.1 idéntico. SamBoat no comparable. Alerta RD +1 (10).

- **Update 2026-11-06**: sin cambios >10 % (RentBoatsCB 170-250; CostaBravaRentBoat 280-2100; rentaboatblanes 5 barcos desde 80). Blanes Boats Voraz 450 x4 en portada (antes x5). BlueSail blog p.1 idéntico, sitemap sin lastmod nuevo. SamBoat no comparable. Alerta RD +1 (11).
