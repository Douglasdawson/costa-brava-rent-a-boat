# Auditoría UI/UX v2 — Homepage Desktop (1440px+)

## Instrucciones para el usuario
1. Abre Chrome a pantalla completa (1440px+)
2. Navega a `http://localhost:5000/es/`
3. Espera carga completa (scroll abajo y vuelve arriba para activar lazy sections)
4. Toma screenshots de TODA la página (cmd+shift+3 por secciones, o extensión GoFullPage)
5. Pega TODOS los screenshots en Claude junto con el prompt de abajo

---

## Prompt para Claude en Chrome

```
Eres un auditor UI/UX senior. Acabo de aplicar correcciones a esta homepage de alquiler de barcos tras una primera auditoría. Necesito que verifiques que los cambios se aplicaron correctamente y detectes cualquier problema residual.

CONTEXTO: Sitio de alquiler de barcos en Blanes, Costa Brava. Target: turistas europeos medio-alto. Desktop 1440px+.

CAMBIOS QUE SE APLICARON (verifica cada uno):

1. HERO — H1 reducido de ~72px a ~56px max. ¿Se ve proporcionado? ¿Hay suficiente espacio para el subtítulo y precio?
2. HERO — Botón WhatsApp verde ELIMINADO. Solo deben quedar 2 CTAs (azul "Encuentra tu barco" + azul claro "Ver flota"). ¿Se ve limpio sin el botón verde?
3. HERO — Trust bar inferior: texto subido de 11px a 12px (text-xs). ¿Es legible?
4. TRUST STRIP (justo debajo del hero) — El texto ahora usa text-foreground/80 en vez de text-muted-foreground. ¿El contraste es suficiente? ¿Se lee bien el rating 4.8/5 y la cita testimonial?
5. H2 HEADINGS — TODOS los títulos de sección deben usar font-semibold (no bold, no medium, no light). Verifica en: "¿Primera vez en un barco?", "Elige tu barco", "¿Con o sin licencia?", "¿Por qué Costa Brava Rent a Boat?", "Preguntas frecuentes", "Contacto", "Regala una experiencia", y el CTA final. ¿Se ven uniformes?
6. BOTÓN "RESERVAR" en cards de flota — Ahora más grande (py-2.5 px-6 text-base, ~44px). ¿Se ve proporcionado dentro de las cards? ¿Es fácil de clickear?
7. PADDING VERTICAL — Las secciones License Comparison, FAQ, Contact y Final CTA tienen más padding. ¿El ritmo vertical entre secciones se siente más uniforme? ¿Hay alguna sección que todavía se siente apretada o con demasiado aire?
8. FINAL CTA ("¿Todavía pensándolo?") — Padding aumentado, botón más grande, texto trust más visible. ¿Se siente como un cierre de conversión impactante? ¿Las tildes están correctas en "¿Todavía pensándolo?" y "Cancelación gratuita"?
9. GIFT CARD BANNER — H2 cambiado de font-light a font-semibold. ¿Se ve con suficiente peso visual? ¿Es consistente con los demás H2?
10. TILDES — Revisa que NO haya palabras en español sin tilde visible. Especialmente: "cancelación", "mediterránea", "formación", "navegación", "excursión", "patrón". Si ves alguna palabra sin tilde, repórtala.

ADEMÁS, revisa estos puntos generales:

A. JERARQUÍA VISUAL — ¿Los H2 unificados crean un ritmo visual coherente al scrollear?
B. ESPACIADO — ¿El padding entre secciones se siente uniforme y profesional?
C. CONTRASTE — ¿Todos los textos sobre fondos de color son legibles?
D. HERO — Con el H1 más pequeño y sin WhatsApp, ¿el hero se siente más limpio y enfocado? ¿O se perdió algo importante?
E. FLEET CARDS — ¿El botón "Reservar" más grande mejora la apariencia de las cards? ¿Hay desalineaciones?
F. OVERLAYS — ¿El botón flotante de WhatsApp, cookie banner, y cualquier toast/popup están bien posicionados y no tapan contenido?

FORMATO DE RESPUESTA:

Para cada cambio (1-10):
- VERIFICADO / NO VERIFICADO / PARCIAL
- Observación breve

Para los puntos generales (A-F):
- OK / PROBLEMA
- Detalle si hay problema

Al final:
- Lista de problemas residuales (si los hay), ordenados por severidad
- Puntuación actualizada: X/10
- Veredicto: LISTO PARA TABLET / NECESITA MÁS CORRECCIONES
```
