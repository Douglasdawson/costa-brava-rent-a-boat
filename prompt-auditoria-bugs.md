# Auditoría Web Completa - Bugs y SEO a corregir en costabravarentaboat.com

Fecha: 23 de marzo de 2026

Se ha realizado una auditoría completa de la web en producción (costabravarentaboat.com) que incluye:
1. Revisión visual en diferentes tamaños de pantalla (desktop 1440px, tablet 768px, móvil 375px)
2. Análisis SEO del sitemap (680 URLs verificadas), canonical tags y hreflang
3. Verificación de alertas de Google Search Console

A continuación se listan todos los bugs encontrados organizados por prioridad. Por favor, corrígelos todos en orden de severidad.

---

## CRÍTICOS (7) — La web es inutilizable sin corregir estos

### BUG-001: /es/flota devuelve 404
- **Página**: https://www.costabravarentaboat.com/es/flota
- **Problema**: La página de la flota muestra "Página no encontrada". Es una de las páginas principales del menú.
- **Dónde mirar**: `client/src/App.tsx` (definición de rutas)
- **Fix**: Verificar que la ruta `/es/flota` (y sus equivalentes en otros idiomas) existe y apunta al componente correcto.

### BUG-002: /es/destinos devuelve 404
- **Página**: https://www.costabravarentaboat.com/es/destinos
- **Problema**: La página de destinos muestra "Página no encontrada".
- **Dónde mirar**: `client/src/App.tsx` (definición de rutas)
- **Fix**: Verificar que la ruta `/es/destinos` existe y apunta al componente correcto.

### BUG-003: /es/reservar devuelve 404
- **Página**: https://www.costabravarentaboat.com/es/reservar
- **Problema**: La página de reservas muestra "Página no encontrada". Esto impide que los clientes reserven.
- **Dónde mirar**: `client/src/App.tsx` (definición de rutas)
- **Fix**: Verificar que la ruta `/es/reservar` existe y apunta al componente correcto.

### BUG-004: Versión en inglés /en/ no carga
- **Página**: https://www.costabravarentaboat.com/en/
- **Problema**: La versión en inglés muestra un error de página. Puede ser un problema de JWT o de configuración de rutas i18n.
- **Dónde mirar**: `client/src/App.tsx`, configuración i18n, server routes
- **Fix**: Revisar que las rutas internacionalizadas están configuradas para todos los idiomas soportados.

### BUG-005: Menú hamburguesa se abre solo al cargar la página
- **Problema**: En TODAS las páginas, el menú de navegación (Sheet/Dialog de shadcn) aparece abierto automáticamente al cargar, incluso en pantallas grandes (1200px+). Esto tapa el contenido.
- **Dónde mirar**: Componente de navegación/header en `client/src/components/`
- **Fix**: El estado inicial del Sheet debe ser `open={false}`. Buscar el estado que controla la apertura del menú y asegurar que inicia en `false`.

### BUG-006: Menú abierto bloquea el scroll
- **Problema**: Cuando el menú está abierto (que es siempre, por el BUG-005), el body tiene `overflow: hidden`, lo que impide hacer scroll en la página.
- **Dónde mirar**: Componente Sheet de shadcn/ui o el componente de navegación
- **Fix**: Este se resuelve al arreglar BUG-005. El Sheet de shadcn normalmente gestiona el overflow, así que al arreglar el estado inicial se soluciona.

### BUG-007: El botón hamburguesa no cierra el menú
- **Problema**: Al hacer clic en el botón hamburguesa/X para cerrar el menú, este no se cierra.
- **Dónde mirar**: El handler `onClick` del botón toggle del menú
- **Fix**: Verificar que el `onOpenChange` del Sheet está conectado correctamente al estado.

---

## ALTOS (4) — Afectan significativamente la experiencia

### BUG-008: Imágenes de barcos no cargan en la homepage
- **Problema**: En la sección de barcos de la homepage, las imágenes no se muestran — aparecen grandes áreas grises donde deberían estar las fotos de los barcos.
- **Dónde mirar**: Componente BoatCard o similar en `client/src/components/`, las URLs de las imágenes
- **Fix**: Verificar que las URLs de las imágenes son correctas, que el lazy loading funciona, y que las imágenes existen en el servidor/CDN.

### BUG-009: Mapa de ubicación muestra imagen rota
- **Problema**: En la sección "Nos encontramos en el Puerto de Blanes", en vez de un mapa interactivo se muestra un icono de imagen rota.
- **Dónde mirar**: Componente de mapa en `client/src/components/`
- **Fix**: Verificar la API key de Google Maps o el iframe del mapa. Si usa una imagen estática, verificar la URL.

### BUG-010: Navegación no es responsive en desktop
- **Problema**: A 1196px de ancho (desktop completo), la web sigue mostrando el menú hamburguesa móvil en vez del menú horizontal de escritorio.
- **Dónde mirar**: Componente de navegación, clases responsive de Tailwind
- **Fix**: Ajustar el breakpoint del menú responsive. Probablemente necesita usar `lg:` (1024px) o `xl:` (1280px) para mostrar el menú horizontal.

### BUG-011: "Saltar al contenido" siempre visible
- **Problema**: El enlace de accesibilidad "Saltar al contenido" aparece siempre visible en la esquina superior izquierda en vez de estar oculto hasta que el usuario usa Tab.
- **Dónde mirar**: Componente SkipLink o similar
- **Fix**: Aplicar clases `sr-only focus:not-sr-only` o equivalente para que solo sea visible al recibir foco.

---

## MEDIOS (8) — Problemas visuales y de UX

### BUG-012: "Desde150€" sin espacio
- **Problema**: El texto muestra "Desde150€" sin espacio entre "Desde" y el precio.
- **Dónde mirar**: Componente de pricing en la homepage
- **Fix**: Añadir un espacio o usar elementos separados.

### BUG-013: Textos concatenados sin espacios
- **Problema**: "TemporadaAbril - OctubreHorarios flexibles" — las palabras están pegadas.
- **Dónde mirar**: Sección de información de contacto/detalles en la homepage
- **Fix**: Añadir espacios o separadores entre los campos.

### BUG-014: Formato de precios confuso
- **Problema**: Los precios se muestran como "100€80€ -20%16€/persona" todo junto, sin separación visual clara entre precio original, descuento y precio por persona.
- **Dónde mirar**: Componente BoatCard o PriceDisplay
- **Fix**: Separar visualmente: precio original tachado, precio nuevo en grande, descuento como badge, y precio por persona debajo.

### BUG-015: Links del footer pegados
- **Problema**: Los links legales del footer se muestran como "Términos y  Política dePolítica Accesibilidad" — todo junto sin separadores.
- **Dónde mirar**: Componente Footer en `client/src/components/`
- **Fix**: Revisar el layout flex/grid del footer y añadir separadores (pipes, puntos, o espaciado).

### BUG-016: Estrellas de reseñas vacías
- **Problema**: Las estrellas de valoración aparecen como contornos vacíos (☆) a pesar de que la valoración es 4.7/5.
- **Dónde mirar**: Componente StarRating o Reviews
- **Fix**: Verificar que el componente recibe el valor numérico y lo renderiza con estrellas rellenas (★).

### BUG-017: Categorías de blog duplicadas
- **Problema**: Existen dos categorías separadas: "Guías" (con tilde) y "Guias" (sin tilde).
- **Dónde mirar**: Base de datos o seed de categorías del blog
- **Fix**: Normalizar las categorías para que no haya duplicados por diferencia de acentos.

### BUG-018: "Seguro" duplicado en lo que incluye el precio
- **Problema**: En la página de detalle del barco, "El precio incluye" muestra "Seguro embarcación y ocupantes" Y "Seguro" como items separados.
- **Dónde mirar**: `shared/boatData.ts` o la base de datos (campo de features incluidas)
- **Fix**: Verificar si son dos conceptos distintos o un duplicado. Si es duplicado, eliminar uno.

### BUG-019: Popup de descuento se superpone con menú
- **Problema**: El popup de descuento BIENVENIDO10 aparece al mismo tiempo que el menú abierto, creando una superposición caótica de 3 capas (menú + popup + contenido).
- **Dónde mirar**: Componente de popup de descuento
- **Fix**: No mostrar el popup si hay otros overlays activos, o retrasar su aparición. Se resuelve parcialmente al arreglar BUG-005.

---

## BAJOS (3) — Detalles menores

### BUG-020: Falta símbolo © en el footer
- **Problema**: El copyright dice "2026 Costa Brava Rent a Boat" en vez de "© 2026 Costa Brava Rent a Boat".
- **Fix**: Añadir el carácter © antes del año.

### BUG-021: Reseñas del barco muy antiguas
- **Problema**: Las reseñas del Solar 450 son de 2020 (hace 6 años), lo que puede dar impresión de desactualización.
- **Fix**: Añadir reseñas más recientes o mostrar una mezcla de fechas.

### BUG-022: Texto SEO scrollable superpuesto con trust badges
- **Problema**: En el hero, hay un texto que hace scroll horizontal ("Alquiler de Barcos en Blanes | Con y Sin Licencia...") que se superpone con los trust badges (experiencia, seguro, clientes, Google).
- **Dónde mirar**: Sección hero, barra de trust badges
- **Fix**: Revisar z-index y posicionamiento para que no se superpongan.

---

## Orden de corrección recomendado

1. **Primero**: BUG-005/006/007 (menú de navegación) — desbloquea la visibilidad de toda la web
2. **Segundo**: BUG-001/002/003 (rutas 404) — restaura las páginas principales
3. **Tercero**: BUG-004 (versión inglesa) — restaura el acceso internacional
4. **Cuarto**: BUG-008/009/010/011 (imágenes, mapa, responsive, accesibilidad)
5. **Quinto**: BUG-012 a BUG-019 (problemas visuales medios)
6. **Último**: BUG-020/021/022 (detalles menores)

Después de cada corrección, ejecutar `npm run check` para verificar que no hay errores de TypeScript.

---

## PROBLEMAS SEO (Google Search Console)

Google Search Console ha reportado problemas de indexación. Se verificaron las 680 URLs del sitemap y se encontró lo siguiente:

### SEO-001: 5 páginas de destinos en español devuelven 404 (CRÍTICO)
- **URLs afectadas**:
  - `/es/destinos/sa-palomera`
  - `/es/destinos/cala-sant-francesc`
  - `/es/destinos/blanes-lloret`
  - `/es/destinos/blanes-tossa`
  - `/es/destinos/costa-brava-tour`
- **Problema**: Estas 5 URLs están en el sitemap de destinos pero devuelven 404. Las mismas páginas en los otros 7 idiomas (en, fr, de, it, nl, ru, ca) funcionan correctamente. El problema es solo en español.
- **Dónde mirar**: `server/routes.ts` (generación de sitemap de destinos) y `client/src/App.tsx` (rutas de destinos en español)
- **Fix**: Verificar que las rutas de destinos en español están correctamente definidas. Probablemente hay un bug en el routing que afecta solo al prefijo `/es/`.

### SEO-002: Páginas de destinos sin hreflang y con canonical incorrecto (CRÍTICO)
- **Problema**: Las 40 páginas de destinos (todos los idiomas) no tienen etiquetas `<link rel="alternate" hreflang="...">`. Además, su etiqueta `<link rel="canonical">` apunta a la homepage (`https://www.costabravarentaboat.com`) en lugar de a sí mismas.
- **Impacto**: Google interpreta estas páginas como duplicados de la homepage, por lo que no las indexa correctamente. Esto explica la alerta "Duplicada: Google ha elegido una versión canónica diferente".
- **Dónde mirar**: `client/src/utils/seo-config.ts` y el componente que inyecta las meta tags SEO en las páginas de destinos
- **Fix**:
  1. Añadir etiqueta canonical que apunte a la propia URL de cada página de destino
  2. Añadir etiquetas hreflang para los 8 idiomas en cada página de destino
  3. Asegurar que el componente SEO recibe la URL correcta de cada destino

### SEO-003: Slugs de blog sin traducir en otros idiomas (MEDIO)
- **Problema**: Los 40 artículos del blog usan el mismo slug en español para los 8 idiomas. Ejemplo: `/en/blog/alquiler-barco-sin-licencia-blanes-guia` (slug en español en la versión inglesa).
- **Impacto**: Perjudica el SEO en idiomas no españoles porque Google ve URLs en español para contenido que debería estar en otro idioma. También contribuye a la alerta "Duplicada: el usuario no ha indicado ninguna versión canónica" ya que las URLs son muy similares entre idiomas.
- **Nota**: Los canonical y hreflang del blog SÍ están bien configurados, así que el impacto es menor que SEO-002. Pero idealmente los slugs deberían traducirse.
- **Dónde mirar**: Base de datos (tabla de blog posts), `server/routes.ts` (generación de URLs del blog)
- **Fix a corto plazo**: Asegurar que cada artículo tiene un campo de slug traducido para cada idioma en la BD
- **Fix a largo plazo**: Implementar slugs traducidos en las rutas del blog

### SEO-004: Sitemap incluye URLs rotas (ALTO)
- **Problema**: El sitemap de destinos (`/sitemap-destinations.xml`) incluye las 5 URLs de destinos en español que devuelven 404 (SEO-001). Google las intenta indexar y reporta errores.
- **Dónde mirar**: `server/routes.ts` (generación del sitemap de destinos)
- **Fix**: Asegurar que el sitemap solo incluye URLs que realmente existen y devuelven 200.

---

## Orden de corrección recomendado (ACTUALIZADO)

1. **Primero**: BUG-005/006/007 (menú de navegación) — desbloquea la visibilidad de toda la web
2. **Segundo**: BUG-001/002/003 + SEO-001 (rutas 404) — restaura las páginas principales y destinos en español
3. **Tercero**: SEO-002 (canonical y hreflang de destinos) — corrige la alerta principal de Search Console
4. **Cuarto**: BUG-004 (versión inglesa) — restaura el acceso internacional
5. **Quinto**: SEO-004 (sitemap con URLs rotas) — se resuelve automáticamente al arreglar SEO-001
6. **Sexto**: BUG-008/009/010/011 (imágenes, mapa, responsive, accesibilidad)
7. **Séptimo**: BUG-012 a BUG-019 (problemas visuales medios)
8. **Octavo**: SEO-003 (slugs de blog traducidos) — mejora SEO a medio plazo
9. **Último**: BUG-020/021/022 (detalles menores)

Después de cada corrección, ejecutar `npm run check` para verificar que no hay errores de TypeScript. Una vez desplegados los cambios, solicitar una nueva indexación en Google Search Console.
