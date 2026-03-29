# Auditoría UI/UX v2 — Homepage Móvil (390px) — Verificación

## Instrucciones para el usuario
1. Abre Chrome en `http://localhost:5000/es/`
2. Abre DevTools (cmd+option+I) → Toggle Device Toolbar (cmd+shift+M)
3. Selecciona "iPhone 14" (390x844)
4. Recarga la página (cmd+R)
5. Espera carga completa (scroll abajo y vuelve arriba)
6. Toma screenshots de TODA la página
7. Pega TODOS los screenshots en Claude junto con el prompt de abajo

---

## Prompt para Claude en Chrome

```
Eres un auditor UI/UX mobile. Acabo de aplicar correcciones a esta homepage de alquiler de barcos tras una auditoría mobile que dio 7.2/10. Necesito verificar que los cambios se aplicaron correctamente y detectar problemas residuales. Viewport: 390px (iPhone 14).

CAMBIOS APLICADOS (verifica cada uno):

1. HERO CTAs — Los 2 botones ahora deben apilarse VERTICALMENTE en mobile (flex-col) y ocupar el ancho completo. En desktop/tablet se muestran en fila (flex-row). Verifica:
   - ¿Los botones están uno encima del otro?
   - ¿Ambos ocupan el ancho completo disponible?
   - ¿No hay desbordamiento horizontal?
   - ¿El texto de cada botón es legible y centrado?

2. H1 HERO — El tamaño usa clamp(2rem, 5.5vw, 3.5rem). A 390px debería ser ~32px (2rem). Verifica:
   - ¿El H1 "ALQUILER DE BARCOS EN COSTA BRAVA — BLANES" es legible sin ser excesivo?
   - ¿Cabe bien en el viewport sin saltos de línea extraños?
   - ¿Hay espacio suficiente para subtítulo y CTAs debajo?

3. "Tú solo disfruta" — Corregido de "Tu" a "Tú" (con tilde). Verifica en la card de Excursión Privada en la sección de flota.

4. "50 €" — Corregido de "50EUR" a "50 €" (con espacio y símbolo). Verifica en el Gift Card Banner.

5. SCROLL TO TOP — Botón "Volver arriba" agrandado de 40px a 44px (w-11 h-11). Verifica que se ve y es tocable.

6. TRUST BAR DEL HERO — Los 4 items ("6+ años", "Seguro", "5000+ clientes", "Google 4.8") a 390px. ¿Se ven todos? ¿Se truncan? ¿Hay scroll horizontal?

ADEMÁS, revisa estos puntos generales mobile:

A. ABOVE THE FOLD — En los primeros 844px (1 pantalla de iPhone 14):
   - ¿Se entiende qué ofrece el negocio?
   - ¿Los CTAs son visibles y accesibles?
   - ¿La imagen de fondo se ve bien?

B. SCROLL HORIZONTAL — ¿Hay algún elemento que cause scroll horizontal en toda la página?

C. TOUCH TARGETS — ¿Todos los botones visibles cumplen mínimo 44x44px?

D. FLEET CARDS — ¿Las cards en 1 columna se ven bien? ¿El botón "Reservar" es prominente?

E. ORTOGRAFÍA — ¿Todas las tildes están correctas en el texto visible? Reporta cualquier error.

F. ELEMENTOS FLOTANTES — ¿WhatsApp flotante y "Volver arriba" están bien posicionados sin tapar contenido?

G. CONVERSIÓN — ¿El flujo visual guía al usuario hacia la reserva? ¿Hay fricciones obvias?

FORMATO DE RESPUESTA:

Para cada cambio (1-6):
- VERIFICADO / NO VERIFICADO / PARCIAL
- Observación breve

Para los puntos generales (A-G):
- OK / PROBLEMA
- Detalle si hay problema

Al final:
- Problemas residuales (si los hay)
- Puntuación actualizada mobile: X/10
- Comparativa: Desktop (9.2) vs Tablet (~8.5) vs Mobile (X)
- Veredicto: APROBADO / NECESITA MÁS CORRECCIONES
```
