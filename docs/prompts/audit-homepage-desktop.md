# Auditoría UI/UX - Homepage Desktop (1440px+)

## Instrucciones para el usuario
1. Abre Chrome en tu Mac a pantalla completa (1440px+)
2. Navega a la homepage en español: `http://localhost:5000/es/`
3. Espera a que cargue completamente (incluyendo lazy-loaded sections)
4. Toma screenshots de TODA la página scrolleando (cmd+shift+3 o usa la extensión GoFullPage)
5. Pega TODOS los screenshots en este chat junto con el prompt de abajo

---

## Prompt para Claude en Chrome

```
Eres un auditor experto en UI/UX con 15 años de experiencia en diseño web para negocios turísticos premium. Necesito una auditoría EXTREMADAMENTE minuciosa de esta homepage de alquiler de barcos en la Costa Brava.

CONTEXTO DEL NEGOCIO:
- Alquiler de barcos en Blanes, Costa Brava (España)
- Target: turistas europeos (familias, parejas, grupos) de poder adquisitivo medio-alto
- Temporada: abril - octubre
- Propuesta de valor: experiencia náutica accesible, barcos sin licencia + con licencia
- Competencia: empresas locales con webs mediocres — debemos transmitir profesionalismo y confianza

ESPECIFICACIONES DE DISEÑO:
- Fuente títulos: Clash Display (variable, 200-700)
- Fuente body: Archivo (variable, 100-900)
- Color CTA principal: azul celeste #A8C4DD / HSL 210 35% 76%
- Color texto principal: navy oscuro HSL 215 45% 20%
- Framework: TailwindCSS + shadcn/ui
- Tamaño de pantalla actual: Desktop 1440px+

ESTRUCTURA DE LA HOMEPAGE (14 secciones en orden):
1. Navigation (sticky header con logo, menú, selector idioma, theme toggle)
2. Hero (banner full-screen con imagen de fondo, headline, botones CTA)
3. Trust Strip (social proof: rating 4.8/5, número de clientes, cita testimonial)
4. "Never Sailed Before?" (sección educativa: 3 pasos con iconos)
5. Fleet Section (catálogo de barcos en grid con filtros y precios)
6. Reviews Carousel (testimonios de clientes con estrellas y banderas de país)
7. License Comparison (tabla comparativa: con licencia vs sin licencia)
8. Features Section (beneficios incluidos: snorkel, paddle surf, nevera, parking)
9. FAQ Preview (acordeón con 4-5 preguntas frecuentes)
10. Final CTA (banner oscuro de conversión con botón prominente)
11. Contact Section (teléfono, email, dirección, horarios, WhatsApp)
12. Gift Card Banner (banner promocional tarjetas regalo)
13. Locations Section (11 ubicaciones con iconos y links)
14. Footer (logo, contacto, newsletter, redes sociales, legal, badges)

AUDITORÍA REQUERIDA — Analiza CADA sección individualmente con este checklist:

### Para CADA una de las 14 secciones, evalúa:

**A. Jerarquía Visual**
- ¿Los tamaños de fuente crean una jerarquía clara (H1 > H2 > H3 > body)?
- ¿El peso tipográfico (bold/semibold/regular) refuerza la jerarquía?
- ¿Hay suficiente contraste entre títulos y texto secundario?
- ¿El espaciado vertical entre elementos es coherente?

**B. Espaciado y Ritmo**
- ¿El padding interno de la sección es adecuado (ni apretado ni excesivo)?
- ¿El margen entre esta sección y la anterior/siguiente es consistente?
- ¿Hay suficiente "aire" / breathing room entre elementos?
- ¿Los gaps entre cards/items son uniformes?

**C. Tipografía**
- ¿Se usa Clash Display para títulos y Archivo para body consistentemente?
- ¿El line-height es cómodo para lectura?
- ¿El tamaño del texto body es legible (mínimo 16px)?
- ¿Los textos largos tienen un ancho máximo razonable (60-75 caracteres por línea)?

**D. Colores y Contraste**
- ¿Los botones CTA en azul #A8C4DD son suficientemente visibles?
- ¿El texto sobre fondos de color cumple WCAG AA (ratio 4.5:1 mínimo)?
- ¿Hay inconsistencias de color entre secciones?
- ¿Los fondos alternos (claro/oscuro) crean buen ritmo visual?

**E. Componentes Interactivos**
- ¿Los botones tienen tamaño suficiente (mínimo 44px height)?
- ¿Se distinguen claramente los elementos clickeables de los no clickeables?
- ¿Los links tienen estilo visual diferenciado?
- ¿Los formularios (si hay) tienen labels claros?

**F. Imágenes y Media**
- ¿Las imágenes son nítidas y de buena calidad?
- ¿Los aspect ratios son correctos (no distorsionadas)?
- ¿Hay placeholders visibles durante lazy loading?
- ¿Las imágenes transmiten la experiencia correcta (mar, barcos, Costa Brava)?

**G. Alineación y Grid**
- ¿Los elementos están bien alineados en el grid?
- ¿El contenido respeta los márgenes laterales consistentemente?
- ¿Las cards/items tienen altura uniforme en la misma fila?
- ¿Hay desalineaciones visibles?

**H. Conversión y CTA**
- ¿Los CTAs principales son inmediatamente visibles sin buscarlos?
- ¿El copy de los botones es claro y orientado a la acción?
- ¿Hay demasiados CTAs compitiendo por atención?
- ¿El flujo visual guía naturalmente hacia la conversión?

**I. Overlays y Elementos Flotantes**
- ¿El botón flotante de WhatsApp está bien posicionado y no tapa contenido?
- ¿El cookie banner es discreto pero accesible?
- ¿Hay toasts/banners que interfieran con la experiencia?
- ¿Los modales (si aparecen) son apropiados?

**J. Coherencia General**
- ¿Esta sección se siente parte del mismo sitio que las demás?
- ¿El estilo visual es consistente con una marca premium turística?
- ¿Hay elementos que se sienten "genéricos de template"?
- ¿La sección aporta valor o podría eliminarse/fusionarse?

### Evaluación Global adicional:

**K. Flujo de la Página**
- ¿El orden de las 14 secciones tiene sentido narrativo?
- ¿La página es demasiado larga? ¿Hay secciones redundantes?
- ¿El usuario sabe en todo momento qué hacer (next action)?
- ¿El scroll se siente natural o hay "baches" visuales?

**L. Primera Impresión (Above the Fold)**
- ¿En los primeros 3 segundos se entiende qué ofrece el negocio?
- ¿El hero transmite emoción y deseo de reservar?
- ¿La propuesta de valor es clara e inmediata?
- ¿Los trust signals están bien posicionados?

**M. Performance Visual**
- ¿Se notan saltos de layout durante la carga (CLS)?
- ¿Hay secciones que aparecen vacías antes de cargar?
- ¿Las transiciones/animaciones son suaves o bruscas?

FORMATO DE RESPUESTA:

Para cada sección (1-14), dame:
- Puntuación: X/10
- Problemas encontrados (lista con severidad: 🔴 Crítico, 🟡 Medio, 🟢 Menor)
- Sugerencia de mejora concreta para cada problema

Al final:
- Puntuación global de la homepage: X/10
- TOP 10 problemas más urgentes (ordenados por impacto en conversión)
- TOP 5 quick wins (cambios pequeños, gran impacto)
- Secciones candidatas a eliminar o fusionar

Sé BRUTALMENTE honesto. No quiero halagos, quiero problemas. Cada pixel cuenta.
```
