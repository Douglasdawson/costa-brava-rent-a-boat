# Auditoría UI/UX — Homepage Tablet (768px - 1024px)

## Instrucciones para el usuario
1. Abre Chrome en `http://localhost:5000/es/`
2. Abre DevTools (cmd+option+I)
3. Click en el icono de dispositivo (Toggle Device Toolbar) o cmd+shift+M
4. Selecciona "iPad" (768x1024) o pon dimensiones custom: 768x1024
5. Recarga la página (cmd+R) para que apliquen los breakpoints correctos
6. Espera carga completa (scroll abajo y vuelve arriba para activar lazy sections)
7. Toma screenshots de TODA la página scrolleando
8. Pega TODOS los screenshots en Claude junto con el prompt de abajo

---

## Prompt para Claude en Chrome

```
Eres un auditor UI/UX senior especializado en responsive design. Necesito una auditoría EXHAUSTIVA de esta homepage de alquiler de barcos vista en TABLET (768px de ancho, simulando iPad).

CONTEXTO: Sitio de alquiler de barcos en Blanes, Costa Brava. Target: turistas europeos. La versión desktop (1440px) ya fue auditada y aprobada con 9.2/10.

ESPECIFICACIONES DE DISEÑO:
- Fuente títulos: Clash Display (font-heading)
- Fuente body: Archivo (font-sans)
- Color CTA: azul celeste #A8C4DD
- Color texto: navy oscuro HSL 215 45% 20%
- Framework: TailwindCSS con breakpoints sm:640px, md:768px, lg:1024px
- Tamaño actual: 768px (breakpoint md: activo, lg: NO activo)

ESTRUCTURA DE LA HOMEPAGE (14 secciones):
1. Navigation (sticky header)
2. Hero (banner full-screen con CTAs)
3. Trust Strip (rating + testimonial)
4. "¿Primera vez en un barco?" (3 pasos)
5. Fleet Section (catálogo de barcos)
6. Reviews Carousel (testimonios)
7. License Comparison (con vs sin licencia)
8. Features Section (beneficios + extras)
9. FAQ Preview (acordeón)
10. Final CTA ("¿Todavía pensándolo?")
11. Contact Section (info + mapa)
12. Gift Card Banner
13. Locations Section (destinos)
14. Footer

AUDITORÍA TABLET — Para CADA sección evalúa:

### A. Adaptación de Layout (768px)
- ¿Los grids se adaptan correctamente? (ej: 3 columnas → 2 columnas?)
- ¿Las cards/items tienen tamaño adecuado para tablet?
- ¿Hay elementos que se salen del viewport o causan scroll horizontal?
- ¿Los contenedores respetan max-width y padding lateral?

### B. Tipografía Responsive
- ¿Los H2 usan el tamaño correcto para md: breakpoint? (esperado: text-3xl = 30px o text-4xl = 36px)
- ¿El texto body es legible sin zoom? (mínimo 14px, idealmente 16px)
- ¿Los textos largos tienen line-length cómodo? (no más de 80 caracteres por línea)
- ¿Hay textos que se cortan, desbordan o se solapan?

### C. Touch Targets
- ¿Todos los botones y links tienen mínimo 44x44px de área clickeable?
- ¿Los filtros, acordeones y elementos interactivos son fácilmente tocables?
- ¿Hay suficiente espacio entre elementos tocables para evitar mis-taps?

### D. Imágenes y Media
- ¿Las imágenes de barcos se ven nítidas y bien proporcionadas?
- ¿El hero image usa la versión desktop o mobile? ¿Se ve bien a 768px?
- ¿Los carruseles son navegables con gestos/touch?

### E. Navegación
- ¿El header muestra el menú hamburguesa o el menú completo?
- ¿El menú es usable en tablet?
- ¿El sticky header no ocupa demasiado espacio vertical?

### F. Fleet Section (especial atención)
- ¿Cuántas columnas tiene el grid de barcos? (esperado: 2 columnas)
- ¿Las cards de barcos muestran toda la info sin truncar?
- ¿El botón "Reservar" (44px) es proporcionado dentro de las cards?
- ¿La sección sigue siendo muy larga? ¿Cuántos viewports ocupa?

### G. Espaciado
- ¿El padding vertical entre secciones es proporcionado para tablet?
- ¿Hay secciones que se sienten demasiado "estiradas" horizontalmente?
- ¿Los márgenes laterales son adecuados? (no demasiado estrechos ni anchos)

### H. Elementos Flotantes
- ¿El botón WhatsApp flotante está bien posicionado para tablet?
- ¿El exit-intent modal se adapta al ancho de tablet?
- ¿Hay overlays que bloqueen contenido importante?

### I. Ortografía
- ¿Se ven tildes correctas en todo el texto visible? Reporta cualquier palabra española sin tilde.

### J. Problemas Específicos de Tablet
- ¿Hay elementos diseñados solo para desktop que se ven mal en tablet?
- ¿Hay elementos escondidos con sm:hidden o lg:hidden que deberían ser visibles?
- ¿La experiencia se siente como "desktop encogido" o como una adaptación pensada?

FORMATO DE RESPUESTA:

Para cada sección (1-14), dame:
- Puntuación: X/10
- Problemas encontrados (🔴 Crítico, 🟡 Medio, 🟢 Menor)
- Sugerencia concreta para cada problema

Al final:
- Puntuación global tablet: X/10
- TOP 5 problemas más urgentes
- TOP 3 quick wins
- Veredicto: LISTO PARA MÓVIL / NECESITA CORRECCIONES

Sé riguroso. El tablet es el dispositivo donde más problemas de layout aparecen porque queda "entre" desktop y móvil.
```
