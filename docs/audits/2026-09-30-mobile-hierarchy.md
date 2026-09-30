# Auditoría de jerarquía UI/UX en móvil (2026-09-30)

- **Viewport:** 390x844 @2x, `mobile,touch` (chrome-devtools `emulate`), con `window.innerWidth === 390` comprobado en cada ruta.
- **Servidor:** dev local `http://localhost:5180`, con otra sesión editando en paralelo (fuentes, barra CTA fija, WhatsApp flotante y barra de ficha).
- **Método:** un script de medida por ruta (h1/h2, CTA sólidos en el primer viewport, elementos fixed/sticky, `elementFromPoint` a mitad de scroll, tap < 44 px, padding de `<section>` y desborde con `overflow-x` neutralizado en `html`, `body` y `#root`), más captura del primer viewport donde hacía falta juzgar la jerarquía. Criterio: impeccable / critique (jerarquía, ritmo, CTA, densidad).
- **Cookies:** la primera visita se midió con el banner de cookies visible (home). En el resto de rutas se aceptaron «Solo esenciales» antes de medir.
- **Fuera de hallazgo:** los bloques «sin licencia» que se apagan solos el 1-oct (`isLicenseFreeEraActive` / `isPubliclyListed`) se anotan pero no cuentan como hallazgo. **Excepción:** los textos que NO se apagan solos, que van en P1.

## Tabla resumen

«CTA fold» = botones de fondo sólido en 0-844 px, sin contar barras fijas. «Solapes» = pares de elementos fixed que se solapan a mitad de scroll. En todas las rutas, `elementFromPoint` sobre los botones de las barras inferiores devolvió el propio botón.

| Ruta | h1 px | CTA fold | Solapes fijos | Tap < 44 | Desborde | Nota principal |
|---|---|---|---|---|---|---|
| `/es/` | 28 | 1 («Reservar ahora» @598) | 0 (con banner de cookies: el banner tapa el FAB y «Volver arriba») | 36 | no | Hero con hueco muerto; flota de 5.036 px |
| `/es/alquiler-barcos-blanes` | 24 | 1 | 0 | 52 | no | **H1 recortado e invisible** |
| `/es/alquiler-barcos-calella` | 30.2 | 1 | 0 | 40 | no | Barcos a 4.430 px |
| `/es/barcos-con-licencia` | 30.2 | **0** | 0 | 38 | no | Sin foto ni CTA en el hero; flota a 4.391 px |
| `/es/alquiler-barco-con-patron` | 30.2 | **0** | 0 | 36 | no | Precios a 5.126 px |
| `/es/paseo-atardecer-barco-blanes` | 30.2 | **0** | 0 | 35 | no | Hero sin foto; copy «sin licencia» sin gate |
| `/es/circuito-jet-ski-blanes` | 36.5 | 1 (+ barra) | 0 | 35 | no | Página modelo (ver abajo) |
| `/es/alquiler-moto-de-agua-blanes` | 36.5 | 1 (ancla) | 0 | 38 | no | Hero 100svh sin precio |
| `/es/barco/remus-450-ii` | 30.2 | 1 | 0 | 36 | no | H1 parte el nombre del modelo |
| `/es/barco/pacific-craft-625` | 30.2 | 1 | 0 | 36 | no | Igual que la anterior |
| `/es/blog` | 36.5 | 0 (chip de filtro) | 0 | 52 | no | Metadatos del destacado aplastados |
| `/es/blog/alquilar-barco-costa-brava-octubre` | 30.2 (otra fuente) | 0 (solo «Enviar» del newsletter) | 0 | 53 | no | Ruido antes del artículo |
| `/es/precios` | 30.2 | **0** | 0 | 43 | no | Sin barra de reserva; fecha de actualización caducada |
| `/es/faq` | 30.2 | 0 (chip) | 0 | 35 | no | 900 px entre el H1 y la primera pregunta |
| `/es/garantias` | 36.5 | 0 (+ barra fija) | 0 | 37 | no | Correcta |
| `/es/licencia-navegacion-titulin` | 36.5 | 1 (externo) | 0 | 36 | no | CTA de la barra = «Titulín» (sustantivo) |
| `/es/tienda` | **44** | 0 | 0 | 38 | no | Productos a 1.639 px |
| `/es/tarjetas-regalo` | 30.2 | **0** | 0 | 36 | no | Selector de importe a 1.569 px |
| `/es/politica-privacidad` | 30.2 | n/a | 0 | 0 (fuera del footer) | no | Cuerpo de 14 px en gris |

**Desborde horizontal: 0 en las 19 rutas** (`scrollWidth === 390` con el `overflow-x` neutralizado).

---

## Hallazgos SISTÉMICOS

### Ya en curso (según el lead): solo se anotan

- **S-a · Escala de h1/h2 incoherente.** El h1 mide 24 / 28 / 30.2 / 36.5 / 44 px según la plantilla: `text-h1` frente a `text-display` frente a tamaños sueltos. Los h2 van a 20, 24, 28, 30 o 32 px.
- **S-b · Ritmo de sección sin sistema.** Hay paddings de 48/48, 64/64, 112/64, 112/80, 96/0, 32/0 y 0/56.
- **S-c · Barra CTA fija y FAB de WhatsApp.**
  - A mitad de scroll no se solapan: el FAB sube a y=692 cuando aparece la barra.
  - En reposo, el FAB (318,724, 56x56) tapa el borde derecho del texto corrido en todas las rutas: se ve en las capturas de Calella, `/es/barcos-con-licencia`, el blog y la tienda.
  - La barra no aparece en `/es/`, `/es/precios`, `/es/faq`, `/es/tarjetas-regalo`, `/es/alquiler-moto-de-agua-blanes` ni `/es/blog`. Las más graves son `/es/precios` y `/es/tarjetas-regalo`, que tienen intención de compra.
- **S-d · Barra de ficha de barco.** «Reservar · desde 85€» junto a un botón de WhatsApp: los dos CTA tienen el mismo peso.
- **S-e · Tap targets.**
  - Links del footer: 358x24, en todas las rutas.
  - Chips del blog: 38 px de alto.
  - Nombres de barco en la tabla de precios: 22-28 px.
  - Redes del autor en el post: 16 px.
  - Enlace «Ver barcos sin licencia» del hero: 19 px (este desaparece el 1-oct).
- **S-f · Word-spacing de Clash Display en mayúsculas.** Posiblemente dentro del trabajo de fuentes en curso.
  - El espacio mide 4,1 px a 28 px (0,15 em) y el `tracking-tight` le resta 0,7 px, así que queda en ~0,12 em.
  - En el h1 de la home, que va en MAYÚSCULAS, se lee «ALQUILERDE… CONTITULACIÓNEN». Pasa lo mismo en h2 como «Eligetuplanenelmar».
  - Arreglo: `word-spacing: 0.1em` en `.font-heading`, o quitar `uppercase` en `client/src/components/Hero.tsx` (clase del h1).

### Nuevos: P1

**S1 · El H1 queda RECORTADO en los heroes de ubicación hechos a mano.** Es el hallazgo más grave de la auditoría.
- **Causa:** el contenedor es `h-[55vh] min-h-[420px] overflow-hidden` con `items-end`. Si h1 + entradilla + chips + CTA miden más de 416 px, el contenido crece hacia arriba y el `overflow-hidden` corta el H1 por encima del borde de la foto (que empieza en y=80). El H1 es blanco y queda fuera de la foto, sobre fondo blanco o debajo de la nav flotante.
- **Medido:**

  | Página | h1 | Borde de recorte | Estado |
  |---|---|---|---|
  | Blanes | 52-84 | 80 | recortado |
  | Tossa | 55-263 | 80 | recortado |
  | Pineda | 8-112 | 80 | casi entero fuera |
  | Lloret | 102-241 | 80 | al límite (22 px de margen) |
  | Calella, Malgrat, Sta. Susanna | ok | 80 | ok (entradilla más corta) |

- **Código:**
  - `client/src/pages/location-blanes.tsx:143`
  - `client/src/pages/location-tossa-de-mar.tsx:203`
  - `client/src/pages/location-pineda-de-mar.tsx:144`
  - `client/src/pages/location-lloret-de-mar.tsx:189`
  - `client/src/pages/LocationTemplate.tsx:329`
- **Arreglo:** cambiar `h-[55vh]` por `min-h-[55vh]` (altura mínima, sin techo), quitar `overflow-hidden` del contenedor o pasarlo solo a la capa de imagen, y dejar que el contenido marque la altura con `pt-24 pb-12`. Además, recortar la entradilla de Blanes (361 caracteres, 9 líneas sobre la foto) a 1-2 frases y bajar el resto a la primera sección.

**S2 · Copy «sin licencia» que NO se apaga el 1-oct.** Mañana será falso en la página. La cifra se regenera con `isPubliclyListed`, pero la frase no.
- **`/es/alquiler-barcos-blanes`, hero** (`client/src/i18n/es.ts:1782`): «desde 85€/h, gasolina incluida. Sin licencia hasta 5 personas». El 1-oct los barcos con licencia salen desde 175 €/2 h y sin gasolina. Además, es justo el H1 que S1 deja invisible.
- **`/es/paseo-atardecer-barco-blanes`, hero** (`es.ts` `heroDescription`, pintado en `client/src/pages/activity-sunset.tsx:174`): «Sin licencia de navegación. Desde 85 €/hora.»
- **`/es/tarjetas-regalo`** (`es.ts:1407`): «válidas para cualquiera de nuestros {count} barcos, tanto sin licencia como con licencia». `{count}` bajará a 4, pero la frase seguirá prometiendo barcos sin licencia.
- **`/es/precios`**: los chips «Gasolina incluida (sin licencia)» y «8 embarcaciones disponibles» parecen estáticos. **Verificar.**
- **Fuera de las 19 rutas** (lo vi al buscar en el código): el fallback de `client/src/pages/activity-families.tsx:140` dice «Barcos sin licencia… Desde 85 EUR/hora».
- **Colaboración CMO:** hace falta la versión post-1-oct de estas cadenas en los 8 idiomas.

**S3 · Icono al lado del H1 en fila flex.**
- **Qué pasa:** en las plantillas de categoría y actividad, el h1 va en `flex items-center justify-center` junto a un icono `w-8 h-8 mr-4`. En 390 px el icono le roba 48 px al H1 y queda flotando a la izquierda, a media altura de un titular centrado de 3 a 5 líneas. En `/es/barcos-con-licencia` el H1 ocupa 5 líneas.
- **Dónde:** `category-licensed.tsx:167`, `category-captained.tsx:114`, `activity-sunset.tsx:168`, `activity-snorkel.tsx:144`, `activity-fishing.tsx:137`, `activity-families.tsx:134`, `alquiler-barcos-costa-brava.tsx:309`, `about.tsx:735`, `faq.tsx:260`, `location-palafolls.tsx:145`, `location-tordera.tsx:146`, `LocationTemplate.tsx:394`.
- **Arreglo:** el patrón ya existe en `category-license-free.tsx:354` (`hidden sm:block`). Aplicarlo en todas, o subir el icono encima del H1.

### Nuevos: P2

**S4 · Las landings de intención comercial no tienen foto ni CTA en el primer viewport.**
- **Páginas:** `/es/barcos-con-licencia`, `/es/alquiler-barco-con-patron`, `/es/paseo-atardecer-barco-blanes` y `/es/precios`. El hero es un degradado pálido con icono, H1, párrafo y chips.
- **Por qué importa:** contradice el principio de marca nº1 («the sea sells itself»). El «Reservar» solo existe en la barra fija, que no aparece hasta hacer scroll. A partir del 1-oct, `/es/barcos-con-licencia` es LA página de producto.
- **Referencia interna que ya funciona:** `/es/circuito-jet-ski-blanes` (foto, H1, una línea, «desde 65€», «Reservar» sólido y chips).
- **Arreglo:** replicar ese hero en `category-licensed.tsx`, `category-captained.tsx` y `activity-sunset.tsx`.

**S5 · El producto queda enterrado bajo texto SEO.** Tipo de contenido que hay antes de la primera card de barco o del primer precio:

| Ruta | Primera card o precio | Pantallas | Lo que va antes |
|---|---|---|---|
| `/es/barcos-con-licencia` | flota @4.391 | 5,2 | «Qué es una lancha con licencia», «La ruta», «Requisitos» |
| `/es/alquiler-barco-con-patron` | precios @5.126 | 6 | |
| `/es/alquiler-barcos-calella` | barcos @4.430 | 5,2 | |
| `/es/alquiler-barcos-blanes` | flota @2.012 | 2,4 | La guía completa va antes que los precios (@5.298) |

- **Arreglo:** subir un bloque «Elige tu lancha» (cards compactas con precio y horas) justo debajo del hero y mandar la explicación después. El texto sigue en el DOM y el SEO no pierde nada.

**S6 · Densidad de las cards de flota en móvil.**
- Home: 8 cards de ~540 px una debajo de otra, 5.036 px en total. El 1-oct bajará a ~2.200 px con 4 cards, pero sigue siendo una pantalla por barco.
- Además, la home repite flota en «Barcos populares» (Blanes @9.779).
- **Propuesta:** formato fila compacta en móvil (foto de 112 px, nombre, pax, precio y horas, chevron), o carrusel con snap y una card de 85 vw que asome la siguiente.

**S7 · Precio sin horas.** La regla de la casa es «solo precio + horas».
- Card de la home: «desde 19€ /persona» y «95€ total», sin decir de cuántas horas (se va con la era sin licencia).
- Ficha de barco: el bloque de precio del hero dice «desde 85€» y la barra «Reservar · desde 85€», también sin horas.
- Arreglo: «desde 85 € · 1 h» o «desde 175 € · 2 h».

---

## Hallazgos por página

### `/es/` (home)

- **P2 · Hero con hueco muerto y mensaje duplicado.** El H1 ocupa 4 líneas en mayúsculas.
  - Entre la entradilla (y≈260) y la franja de specs (y≈495) quedan unos 230 px de foto sin contenido. Eso empuja «Reservar ahora» hasta y=598.
  - «Rumbo libre hasta Tossa de Mar» aparece dos veces (entradilla y specs).
  - **Arreglo:** borrar la entradilla o la franja de specs y subir los CTA unos 150 px.
- **P2 · Banner de cookies en la primera visita.**
  - Mide 215 px (629-844) y tapa la mitad inferior de «Reservar ahora» (598-646), además del FAB y de «Volver arriba».
  - **Arreglo:** banner compacto de 2 líneas con los botones en fila (unos 120 px), o `bottom-sheet` con `max-h` que deje libre el CTA del hero.
- **P3 · Pill de cristal.** «Basta la Licencia de Navegación…» es una pill con `backdrop-blur` sobre la foto: glassmorphism decorativo. Mejor texto sobre el degradado.
- **P3 · Orden de secciones.** La moto de agua y el eFoil (@5.944) van antes que el titulín (@7.439). Desde el 1-oct el titulín es la condición de compra de la flota: debería ir justo después de la flota.
- **P3 · Reseñas incoherentes.** La home dice «433+ reseñas» (API viva) y las ubicaciones y fichas «421+», que salen de la constante `BUSINESS_REVIEW_COUNT` en `shared/businessProfile.ts:20`. Hay que unificar en la fuente viva.

### `/es/alquiler-barcos-blanes`

- **P1:** S1 (H1 invisible) y S2 (entradilla falsa desde mañana).
- **P2 · 16 h2 y 17.580 px de página.**
  - «Nuestra Flota» (@2.012) y «Barcos populares» (@9.779) repiten producto.
  - «Destinos por barco», «¿Te alojas cerca?», «Tipos de embarcación» y «¿Y el resto del día?» son bloques de enlaces internos que suman unos 2.500 px.
  - **Propuesta:** agruparlos en un solo acordeón de «Explora más».
- **P2 · La tabla de precios enlaza al Astec 400** (link @5.781), que está desactivado en la flota viva. **Verificar** si ese bloque filtra con `isPubliclyListed`.

### `/es/alquiler-barcos-calella`

- **P2:** S5. Para quien busca desde Calella, lo que busca es «20 min en coche, estos barcos, este precio». Hoy van primero «Por qué Blanes», «Qué ver en Calella» y «Cómo llegar», y los barcos no salen hasta 5 pantallas después.
- **P3:** los chips de actividades con precio («Flyfish 25€», «Banana boat 15€», «Paddle surf 20€») son badges de precio (22 px de alto) en un bloque de enlaces cruzados.

### `/es/barcos-con-licencia` (la página clave a partir de mañana)

- **P1:** S3 (icono Award junto a un H1 de 5 líneas).
- **P2:** S4 (sin foto ni CTA arriba) y S5 (flota a 5 pantallas).
- **P2 · El H1 es una frase entera.** «Alquiler de lanchas sin patrón en Blanes: llega pilotando hasta Tossa de Mar», con 3 chips debajo. Mejor un H1 corto como «Lanchas sin patrón en Blanes» y la promesa de Tossa en la entradilla.

### `/es/alquiler-barco-con-patron`

- **P1:** S3 (`category-captained.tsx:114`).
- **P2:** S4 y S5. Lo que decide aquí es el precio de la excursión, y «Precios» va en el 6º h2 (@5.126).
- **P2 · Orden.** El precio debería ir justo después de «Qué incluye» (@3.726), no después de «El barco».

### `/es/paseo-atardecer-barco-blanes`

- **P1:** S2 (hero «Sin licencia de navegación. Desde 85 €/hora.») y S3.
- **P2 · Hero sin foto de atardecer.** Es un degradado melocotón en una página que vende una luz. Es la página donde más falta una foto de toda la web.

### `/es/circuito-jet-ski-blanes`

- Es la **referencia de jerarquía** del sitio: foto, H1 de 2 líneas, una frase, precio grande, CTA sólido, 3 chips, y precios @1.333.
- **P3:** el CTA sale dos veces en el primer viewport (el del hero y el de la barra fija, que aparece desde el scroll 0). Arreglo: que la barra aparezca solo cuando el CTA del hero sale del viewport, con `IntersectionObserver`.

### `/es/alquiler-moto-de-agua-blanes`

- **P2 · Hero de 100svh sin precio ni prueba social.** La foto está velada en gris turbio y el único CTA, «Ver experiencias», es un ancla (`jet-ski-blanes.tsx:128-155`).
- **Arreglo:** hero de unos 70svh con «desde 65€» y las dos opciones (Circuito / Excursión) como botones directos.

### Fichas de barco (`/es/barco/remus-450-ii`, `/es/barco/pacific-craft-625`)

- **P2 · El H1 parte el nombre del modelo.** Se lee «Remus 450» y, en la línea siguiente, «II · Blanes, Costa Brava».
  - Es `components/BoatDetailPage.tsx:541-547`: el sufijo va en línea dentro del h1.
  - **Arreglo:** `{boatName}` en un `<span className="whitespace-nowrap">` (o `text-wrap: balance` con el nombre sin cortes) y el sufijo de ubicación como `<span className="block">` en su propia línea.
- **P2 · Las secciones no son headings.**
  - La página tiene solo 2 h2 («También te puede interesar» y la FAQ).
  - «Descripción» es un `CardTitle` (div de 24 px, `BoatDetailPage.tsx:735`).
  - «Tu día, tu precio» es un h3 de 16 px, al mismo tamaño que el cuerpo.
  - Resultado: jerarquía plana entre 12 y 16 px, sin anclas para lector de pantalla ni para Google.
  - **Arreglo:** h2 en Descripción, Precio y Características.
- **P2 · Las pestañas de características se salen de la pantalla.** El `TabsList` mide 1.037 px con `w-max` (`BoatDetailPage.tsx:794`). Solo se ve 1,5 de 5 pestañas y no hay pista de que se pueda deslizar. En móvil funcionaría mejor un acordeón (secciones apiladas y plegables) o un `Select`.
- **P3 · Foto repetida.** La del hero es la misma que la primera de la galería (@830). Usar otra foto en el hero, o poner la galería en el hero.
- **P3 · Pills centradas de ancho desigual.** Las 3 pills de confianza («4,8 · 421 reseñas», «Gasolina y seguro incluidos», «Si el mar no acompaña…») van apiladas y centradas con anchos distintos, y se ven desordenadas. Mejor una lista alineada a la izquierda con icono.

### `/es/blog`

- **P2 · Metadatos del post destacado aplastados** (`pages/blog.tsx:534`). Van en 3 columnas:
  - el autor («Iván — Costa Brava Rent a Boat») ocupa 3 líneas y **lleva un guion largo (em dash) que viene de la BD**;
  - «8 min de lectura» queda cortado por la flecha;
  - y el FAB tapa esa flecha.
  - **Arreglo:** apilar los metadatos en 2 líneas y quitar el em dash del autor en los datos.
- **P3:** los chips de filtro miden 38 px de alto, y la categoría «Sin-licencia» sale como slug crudo.

### `/es/blog/alquilar-barco-costa-brava-octubre`

- **P2 · Ruido antes del artículo.** El primer h2 del contenido está en @1.495. Antes van:
  - el byline con 5 redes de 16 px;
  - la fecha repetida (en el byline y otra vez debajo);
  - **7 chips con las keywords SEO en crudo** («alquilar barco costa brava octubre», «rd 1188/2025»…);
  - y el formulario de newsletter, colocado ANTES del contenido (`blog-detail.tsx:857`, comentario «E1: Inline Newsletter CTA (before content)»).
  - **Arreglo:** quitar los chips de tags de la cabecera, no repetir la fecha y mover el newsletter al 40 % del artículo o al final.
- **P2 · El H1 del post no usa la fuente de titulares** (`blog-detail.tsx:792`, `className="text-h1 font-bold tracking-tight"` sin `font-heading`). Es el único h1 del sitio en Archivo.

### `/es/precios`

- **P2 · La intención es «ver precios» y la tabla empieza en @1.642.** Antes van «¿Qué incluye el precio?» y el selector de temporadas. Arreglo: subir la tabla y dejar «Qué incluye» debajo.
- **P2 · Sin CTA de reserva en el primer viewport ni barra fija**, en la página de más intención del sitio.
- **P2 · «Última actualización: 31 de mayo de 2026»** (`pricing.tsx:271`). Los precios cambiaron el 2 y el 3 de septiembre: la fecha contradice la subida y resta confianza.
- **P3:** la tabla de precios no tiene un h2 propio. Solo hay h3 por barco.

### `/es/faq`

- **P2 · 900 px entre el H1 y la primera pregunta.**
  - El filtro lleva el h2 «Filtrar por categoría», que es una etiqueta de control, no una sección.
  - Son 8 chips a lo largo de 297 px.
  - Después viene **una foto de stock de 450 px** (cabos y winche de velero, que no son barcos de la casa; `faq.tsx:296`).
  - **Arreglo:** quitar la foto, convertir el filtro en un scroll horizontal de 1 fila y bajar ese h2 a `<p>` o `aria-label`.

### `/es/licencia-navegacion-titulin`

- **P2 · CTA principal del hero = «Conocer Escola Nàutica Blanes»**: enlace externo `target=_blank` a una escuela en prelanzamiento que todavía no vende.
- **P2 · La barra fija ofrece «Titulín»** (sustantivo, no acción) junto a «Curso de 1 día (6 horas)».
- **Propuesta:** para esta audiencia, el CTA útil es «Ver barcos con licencia», o «Avísame cuando abra la escuela» si se quiere captar. **Colaboración CMO:** decidir la acción.

### `/es/tienda`

- **P3 · Página editorial y bien resuelta.** Pero el H1 mide 44 px (el más grande del sitio) y el primer producto sale en @1.639, sin precio ni CTA en el primer viewport. Arreglo: una línea «Camiseta y tote desde X €» con «Ver la colección» debajo de la entradilla.

### `/es/tarjetas-regalo`

- **P1:** S2 (copy «tanto sin licencia como con licencia»).
- **P2 · Selector de importe @1.569.** Antes van dos pantallas de «¿Por qué regalar…?». Arreglo: subir los importes (50/100/150/200/300 €) justo debajo del H1 y dejar la argumentación después.

### `/es/politica-privacidad`

- **P3 · Legibilidad.** El cuerpo mide 14 px con line-height de 22,75 px, en gris `rgb(73,93,121)`, y los h3 también miden 14 px: los subapartados no se distinguen del texto. Subir el cuerpo a 16 px y dar a los h3 16 px/600.

### `/es/garantias`

- Correcta: H1 claro, 3 secciones y barra «Reservar y añadir coberturas». Sin hallazgos más allá de los sistémicos.

---

## Anotado, no hallazgo (se apaga solo el 1-oct)

- Home: 4 cards sin licencia al principio de la flota, filtro sticky «No necesitas licencia», la franja «¿Aún sin título? Hasta el 30 de septiembre…» con su enlace de 19 px, y el chip «Más popular».
- `/es/precios`: filas Astec 480, Solar, Remus y Remus II.
- Fichas sin licencia (Remus 450 II): se retiran de la venta.

## Colaboración

- **CTO:**
  - S1: cambio de clase en 5 archivos.
  - S3: `hidden sm:block` en 12 archivos.
  - H1 de la ficha (`BoatDetailPage.tsx:541`).
  - `font-heading` en `blog-detail.tsx:792`.
  - Pestañas → acordeón (`BoatDetailPage.tsx:794`).
  - Fecha de `pricing.tsx:271`.
  - Barra fija en `/es/precios` y `/es/tarjetas-regalo`.
- **CMO:**
  - Cadenas post-1-oct de S2, en 8 idiomas.
  - CTA de `/es/licencia-navegacion-titulin`.
  - H1 más corto en `/es/barcos-con-licencia`.
  - Recortar la entradilla de Blanes.

## Estado (30-sep-2026, mismo día)

Aplicado:
- Escala de titulares en `tailwind.config.ts`: `text-display` (36→60), `text-h1` (30→44) y `text-h2` (24→36).
  - Barrido de 251 h1 y h2.
  - La home conserva su `clamp`, ahora con `[word-spacing:0.18em]` y sin guionado automático.
- `MobileStickyBar` sustituye las 9 barras copiadas.
- `BookingStickyBar` (aparece pasado el hero) en ubicaciones, categorías con licencia y con patrón, actividades y `/precios`.
- WhatsApp y ScrollToTop suben por encima de la barra, con la variante `body:has([data-sticky-cta])`.
- Ritmo de sección: `py-14` y `py-16` pasan a `py-12 sm:py-16 lg:py-20` (28 secciones). La home no se ha tocado.
- Heroes de ubicación con `min-h` y contenido en flujo: el h1 ya no se recorta (P1-1).
- Icono junto al h1 oculto en móvil en 12 páginas (P1-3).
- Ficha de barco:
  - Reservar es el primario y WhatsApp queda como icono secundario.
  - «· Blanes» baja de línea en móvil.
  - Las pestañas hacen wrap.
  - Flechas de galería visibles en `pointer-coarse`.
- Blog:
  - El newsletter va después del artículo.
  - Chips de keywords ocultos en móvil.
  - h1 con `font-heading`.
  - Índice y enlaces del autor de 44px.
- FAQ: la foto de stock solo se muestra en `lg`.
- `/precios`: fecha de actualización corregida.
- Wizard: «Cambiar fecha» / «Ver otro barco» de 44px.

Pendiente (decisión de negocio o copy, no de UI):
- P1-2: las cadenas «sin licencia» que no dependen de la era siguen publicadas, en 8 idiomas:
  - hero de Blanes;
  - `heroDescription` de actividades;
  - tarjetas regalo;
  - fallback de `activity-families`.
- Hero con foto y CTA en categorías y actividades.
- CTA del titulín, que lleva a la escuela sin venta.
- Banner de cookies sobre «Reservar ahora» en la primera visita.
