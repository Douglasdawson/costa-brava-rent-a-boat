# Auditoría UI/UX — Homepage Móvil (375-390px)

## Instrucciones para el usuario
1. Abre Chrome en `http://localhost:5000/es/`
2. Abre DevTools (cmd+option+I)
3. Click en el icono de dispositivo (Toggle Device Toolbar) o cmd+shift+M
4. Selecciona "iPhone 14" (390x844) o "iPhone SE" (375x667)
5. Recarga la página (cmd+R) para que apliquen los breakpoints correctos
6. Espera carga completa (scroll abajo y vuelve arriba para activar lazy sections)
7. Toma screenshots de TODA la página scrolleando
8. Pega TODOS los screenshots en Claude junto con el prompt de abajo

---

## Prompt para Claude en Chrome

```
Eres un auditor UI/UX senior especializado en mobile-first design. Necesito una auditoría EXHAUSTIVA de esta homepage de alquiler de barcos vista en MÓVIL (390px de ancho, simulando iPhone 14).

CONTEXTO: Sitio de alquiler de barcos en Blanes, Costa Brava. Target: turistas europeos buscando desde su móvil. La versión desktop fue aprobada con 9.2/10 y la tablet con 7.8/10. El móvil es el dispositivo MÁS importante — más del 70% del tráfico turístico es mobile.

ESPECIFICACIONES DE DISEÑO:
- Fuente títulos: Clash Display (font-heading)
- Fuente body: Archivo (font-sans)
- Color CTA: azul celeste #A8C4DD
- Color texto: navy oscuro HSL 215 45% 20%
- Framework: TailwindCSS con breakpoints sm:640px, md:768px, lg:1024px
- Tamaño actual: 390px (NINGÚN breakpoint sm/md/lg activo — se usan las clases base)

ESTRUCTURA DE LA HOMEPAGE (14 secciones):
1. Navigation (sticky header + hamburger menu)
2. Hero (banner full-screen con CTAs)
3. Trust Strip (rating + testimonial corto)
4. "¿Primera vez en un barco?" (3 pasos en columna)
5. Fleet Section (catálogo de barcos, 1 columna)
6. Reviews Carousel (testimonios)
7. License Comparison (con vs sin licencia)
8. Features Section (beneficios + extras)
9. FAQ Preview (acordeón)
10. Final CTA ("¿Todavía pensándolo?")
11. Contact Section (info + mapa)
12. Gift Card Banner
13. Locations Section (destinos)
14. Footer

AUDITORÍA MOBILE — Para CADA sección evalúa:

### A. Layout Mobile (390px)
- ¿Todo el contenido cabe en 390px sin scroll horizontal?
- ¿Los grids colapsan a 1 columna donde corresponde?
- ¿Las cards ocupan el ancho completo o quedan flotando con márgenes excesivos?
- ¿Hay elementos que se desbordan o se cortan?

### B. Tipografía Mobile
- ¿Los H2 usan el tamaño base (text-2xl = 24px)? ¿Es suficiente o demasiado grande para 390px?
- ¿El texto body es legible sin zoom? (mínimo 14px, idealmente 16px)
- ¿La line-length es cómoda? (en 390px con padding, debería ser ~35-45 caracteres)
- ¿Hay textos que se truncan o hacen wrap incómodo?

### C. Touch Targets (CRÍTICO en mobile)
- ¿TODOS los botones tienen mínimo 44x44px?
- ¿Los links del menú hamburguesa tienen suficiente espacio entre ellos?
- ¿Los acordeones del FAQ son fáciles de tocar?
- ¿El botón "Reservar" en las fleet cards es suficientemente grande?
- ¿Hay elementos demasiado juntos que causen mis-taps?

### D. Hero Mobile
- ¿El H1 es legible y no demasiado grande para 390px?
- ¿Los 2 CTAs se ven bien? ¿Están en fila o en columna?
- ¿La imagen de fondo usa la versión mobile (hero-dive-mobile.webp)?
- ¿Hay suficiente contraste texto sobre imagen?
- ¿El contenido del hero cabe en el viewport sin scroll?
- ¿La trust bar inferior es legible a este ancho?

### E. Fleet Section Mobile (especial atención)
- ¿Las cards de barcos están en 1 columna?
- ¿Cada card muestra toda la info (foto, nombre, precio, specs, botones)?
- ¿El botón "Reservar" es prominente y fácil de tocar?
- ¿La sección es extremadamente larga con 8-9 barcos en 1 columna?
- ¿Los filtros son usables con el pulgar?
- ¿Los precios son legibles y prominentes?

### F. Scroll y Longitud
- ¿La página total es demasiado larga para mobile?
- ¿Hay secciones que podrían colapsarse o simplificarse en mobile?
- ¿El usuario puede encontrar el CTA principal sin scroll excesivo?
- ¿El "above the fold" comunica la propuesta de valor?

### G. Elementos Flotantes y Overlays
- ¿El botón flotante de WhatsApp tapa contenido o CTAs?
- ¿El sticky header ocupa demasiado espacio vertical?
- ¿El exit-intent modal / popup de descuento se ve bien en 390px?
- ¿El cookie banner (si aparece) es usable en mobile?

### H. Navegación Mobile
- ¿El menú hamburguesa se abre y cierra correctamente?
- ¿Los items del menú tienen suficiente padding vertical (mínimo 48px entre items)?
- ¿El selector de idioma es accesible desde el menú?
- ¿Hay forma de volver arriba fácilmente?

### I. Imágenes
- ¿Las imágenes de barcos se cargan rápido?
- ¿Los aspect ratios son correctos en 390px?
- ¿Hay imágenes que se ven pixeladas o distorsionadas?
- ¿Los placeholders de lazy loading son discretos?

### J. Ortografía
- ¿Se ven tildes correctas en TODO el texto visible?
- Reporta CUALQUIER palabra española sin tilde.

### K. Conversión Mobile
- ¿El flujo "ver barco → reservar" es intuitivo con el pulgar?
- ¿Los CTAs están en la "thumb zone" (parte inferior de la pantalla)?
- ¿El número de teléfono es clickeable (tel:)?
- ¿El WhatsApp flotante es fácil de alcanzar?
- ¿Hay demasiada fricción entre el interés y la acción?

FORMATO DE RESPUESTA:

Para cada sección (1-14), dame:
- Puntuación: X/10
- Problemas encontrados (🔴 Crítico, 🟡 Medio, 🟢 Menor)
- Sugerencia concreta para cada problema

Al final:
- Puntuación global mobile: X/10
- TOP 5 problemas más urgentes
- TOP 3 quick wins
- Comparativa: Desktop (9.2) vs Tablet (7.8) vs Mobile (X)
- Veredicto: APROBADO / NECESITA CORRECCIONES

El mobile es donde se gana o pierde el negocio. Sé especialmente exigente con touch targets, velocidad percibida y claridad del flujo de conversión.
```
