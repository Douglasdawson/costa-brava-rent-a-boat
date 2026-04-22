# Auditoría Traducción DE · Costa Brava Rent a Boat

**Fecha:** 2026-04-22
**Archivo auditado:** `client/src/i18n/de.ts` (1662 líneas)
**Modo:** Revisión por hablante nativo alemán (Hochdeutsch estándar) con enfoque marketing turístico náutico
**Importancia:** Alemania es el mercado internacional #1 en Costa Brava — calidad DE = foso defendible vs. competencia

---

## Informe ejecutivo

**Calidad general: 6/10** — La traducción es funcional y comprensible, pero **tiene 3 problemas sistémicos** que la delatan como "traducida" en lugar de escrita por un nativo.

### Top 5 problemas más urgentes

1. **Mezcla caótica de Sie/du** sin patrón definido — el cliente alemán detecta esto al instante y pierde confianza profesional
2. **Title Case anglosajón generalizado** ("Wir Begleiten Dich", "Nachricht Senden") — en alemán **solo los sustantivos** van en mayúscula; esto marca la web como "traducción automática" a ojos de un nativo
3. **Calcos sintácticos del español** en frases hero y CTAs ("Ohne Führerschein, Kein Problem" en lugar del idiomático "Kein Führerschein? Kein Problem.")
4. **Keywords SEO alemanas principales no exploradas** — falta "führerscheinfrei" como término único, "Motorboot mieten", "Yachtcharter Blanes" — perdiendo visibilidad orgánica en búsquedas de alto volumen
5. **Terminología náutica mixta sin consistencia** — "Yachthafen" vs "Marinayachthafen" (palabra inventada) vs "Sporthafen"

**Estimación esfuerzo corrección profesional:** 6-10 horas de un traductor nativo DE (CAT tools + contexto del sitio). Coste aproximado: **300-450 €** (40-50 €/h).

**Impacto esperado tras corrección:**
- +15-20% CTR en anuncios Google Ads alemanes (texto más natural)
- +5-10% conversion rate en landing DE (confianza percibida)
- Mejor ranking orgánico para "Bootsverleih führerscheinfrei Blanes" (keyword core)

---

## Tabla detallada de hallazgos priorizados

### 🔴 PRIORIDAD ALTA — Errores visibles al instante

| Ubicación (línea) | Texto actual | Problema | Sugerencia | Categoría |
|---|---|---|---|---|
| `hero.subtitle` (17) | "Fahren Sie ohne Führerschein oder Erfahrung vom Hafen Blanes..." | Inicia con Sie | "Ganz ohne Führerschein oder Vorerfahrung: vom Hafen Blanes aus erreichen Sie..." — más fluido | Calco sintáctico |
| `hero.subtitleLine1` (18) | "Ohne Führerschein von Blanes bis Playa de Fenals (Lloret)." | Falta verbo, suena telegráfico | "Führerscheinfrei von Blanes bis Fenals (Lloret)." | Telegráfico |
| `fleet.helpText` (46) | "Nicht sicher welches? **Wir helfen dir** in unter 5 Minuten" | Usa **du** | "Nicht sicher welches? **Wir helfen Ihnen** in unter 5 Minuten" (o decidir du y cambiar todo el resto) | Inconsistencia Sie/du |
| `features.withoutLicense.title` (81) | "Ohne Führerschein, **K**ein Problem" | Coma innecesaria + Title Case + calco ES | "Kein Führerschein? Kein Problem." (más idiomático en DE) | Calco + puntuación |
| `features.withoutLicense.description` (82) | "**Erreiche** versteckte Buchten ohne Bootsführerschein" | **du** | "**Erreichen Sie** versteckte Buchten ohne Bootsführerschein" | Inconsistencia Sie/du |
| `features.whyUs` (112) | "Warum Costa Brava Rent a Boat **W**ählen?" | Título Case mal | "Warum Costa Brava Rent a Boat **w**ählen?" | Capitalización |
| `features.flexibleHours.title` (101) | "**Du Bestimmst** die Dauer" | Du + Title Case | "**Sie bestimmen** die Dauer" (formal) o "**Du bestimmst** die Dauer" (casual, coherente) | Inconsistencia + mayús |
| `features.personalAttention.title` (109) | "Wir Begleiten Dich" | Title Case + du | "Wir begleiten Sie" o "Wir begleiten dich" | Capitalización + coherencia |
| `features.location.title` (105) | "10 Min zu den Besten Buchten" | "Min" sin punto + "besten" (literal) + Title Case | "10 Min. zu den schönsten Buchten" | Puntuación + idiom |
| `contact.send` (150) | "Nachricht **S**enden" | Title Case | "Nachricht **s**enden" | Capitalización |
| `contact.viewDetails` (165) | "Details **A**nzeigen" | Title Case | "Details **a**nzeigen" | Capitalización |
| `contact.viewBoats` (166) | "Boote **A**nzeigen" | Title Case | "Boote **a**nzeigen" | Capitalización |
| `contact.discoverMore` (163) | "Mehr Optionen **E**ntdecken" | Title Case | "Mehr Optionen **e**ntdecken" | Capitalización |
| `contact.navLicensedTitle` (185) | "Boote **M**it Führerschein" | Title Case | "Boote **m**it Führerschein" | Capitalización |
| `footer.followUs` (199) | "Folgen Sie **U**ns" | Pronombre "uns" en mayúscula | "Folgen Sie **u**ns" | Capitalización |

### 🟡 PRIORIDAD MEDIA — Mejoras idiomáticas

| Ubicación | Texto actual | Problema | Sugerencia | Categoría |
|---|---|---|---|---|
| `hero.freeCancellation` (35) | "Kostenlose Umbuchung" | Ok pero genérico | "Kostenlos umbuchbar" (más CTA) | Copy |
| `hero.instantConfirmation` (36) | "Sofortige Bestätigung" | Correcto | "Bestätigung in Minuten" (más concreto) | Copy |
| `contact.mapSubtitle` (191) | "Einfacher Zugang und Parkplatz in der Nähe des **Marinayachthafens**" | **Marinayachthafen** no es alemán nativo | "...in der Nähe des **Yachthafens**" o "**Sporthafens**" | Terminología |
| `features.whyUsSub` (113) | "Benzin inklusive, keine Überraschungen..." | Correcto pero neutro | "Benzin inklusive und keine bösen Überraschungen..." (más humano) | Copy |
| `features.subtitle` (79) | "Alles was Sie für ein perfektes **Seeerlebnis** brauchen" | "Seeerlebnis" es feo ortográficamente | "...perfektes **See-Erlebnis**" o "**Erlebnis auf dem Meer**" | Ortografía |
| `contact.consultWhatsApp` (162) | "Schreib uns — Antwort in 5 Min" | "Schreib" (du) | "Schreiben Sie uns — Antwort in 5 Min." | Sie/du |
| `contact.navLloretTag3` (178) | "Nachtleben" | Ok como tag, pero muy breve | Añadir descripción si hay espacio | - |
| `contact.scheduleTime` (154) | "Saison: April - Oktober" | Hifen normal, mejor guión largo | "Saison: April – Oktober" (en-dash tipográficamente correcto en DE) | Tipografía |
| `booking.confirmSubtitle` (365) | "**Überprüfe** die Details. Bestätigung per WhatsApp..." | **du** en un contexto formal de pago | "**Überprüfen Sie** die Details..." | Sie/du |
| `booking.gdprPassive` (374) | "...akzeptieren Sie unsere {privacyPolicy}..." | Sie (correcto) | Consistente con el resto si se decide por Sie | - |

### 🟢 PRIORIDAD BAJA — Refinamientos

| Ubicación | Sugerencia |
|---|---|
| Todas las abreviaturas "Min" | Unificar a "Min." (alemán requiere punto) |
| Todas las "h" horas | Unificar a "Std." (abreviatura estándar en DE) o "Stunden" completo |
| Separadores miles | Verificar que precios usen formato alemán: **1.234,56 €** (no 1,234.56) |
| Fechas | En DE turístico: formato **DD.MM.YYYY** (no ISO) — revisar si algún placeholder lo usa |

---

## Decisión estratégica pendiente · Sie o du

Hay **dos escuelas** en marketing turístico alemán:

| Opción | Cuándo usarla | Ejemplos competencia |
|---|---|---|
| **Sie (formal)** | Segmento 40+ años, familias, clientela premium. Default seguro. | TUI, Sunshine Tours, Airbnb DE |
| **du (informal)** | Segmento joven <35, actividades/aventura, startups. | Outdooractive, GetYourGuide (mixto), Civitatis |

**Recomendación para Costa Brava Rent a Boat:** **Sie consistente**. Razón:
- Público mixto pero con peso familiar
- Alquiler de barco percibido como "premium" (no actividad cualquiera)
- Cliente alemán serio espera Sie en primer contacto
- Puedes romper a du en WhatsApp tras confirmar reserva (ganas cercanía cuando ya confían)

**Acción:** globalmente cambiar todos los `du`/`dich`/`dir`/`deine` a `Sie`/`Ihnen`/`Ihr`/`Ihre` en toda la web. Mantener du solo en el bot WhatsApp si se desea después de la reserva.

---

## Glosario terminología náutica DE recomendada

Unificar el uso de estos términos en toda la web:

| Español | DE recomendado | Alternativas aceptables | Evitar |
|---|---|---|---|
| Alquiler de barcos | **Bootsverleih** | Bootsvermietung | Bootsmiete (suena a transporte) |
| Sin licencia / Sin titulación | **Führerscheinfrei** | ohne Führerschein | Keine Lizenz (anglicismo) |
| Con licencia | **Mit Bootsführerschein** | Mit Führerschein | Lizenziert (feo en contexto DE) |
| Puerto (deportivo) | **Yachthafen** o **Sporthafen** | Hafen (ok genérico) | Marinayachthafen (palabra inventada) |
| Cala | **Bucht** | - | Kleine Bucht (muy descriptivo) |
| Excursión | **Ausflug** | Tour | Excursion (anglicismo) |
| Patrón / Capitán | **Skipper** | Kapitän (más formal) | Steuermann (pasado de moda) |
| Gasolina | **Benzin** o **Kraftstoff** | - | Sprit (muy informal) |
| Ruta náutica | **Seeroute** | Bootsroute | Route (genérico) |
| Snorkel | **Schnorchel** | Schnorcheln (verbo) | - |
| Reservar | **Buchen** | Reservieren | - |
| Valoración (stars) | **Bewertung** | - | Rating (anglicismo) |

---

## Keywords SEO alemanas prioritarias

**Que deberían aparecer más en títulos H1, meta descriptions y body:**

### Alto volumen (Google DE)

1. **Bootsverleih Blanes** — ya aparece en hero, ✓
2. **Boot mieten Costa Brava** — aparece en imageAlts, podría reforzarse en H1
3. **Führerscheinfrei** — keyword SUPER específica alemán, debería ser prominente
4. **Motorboot mieten** — NO aparece, debería añadirse
5. **Yachtcharter Costa Brava** — NO aparece, añadir para mercado premium

### Long-tail (menos volumen pero alta conversión)

6. **Boot ohne Führerschein mieten Spanien** — NO aparece, keyword money
7. **Bootsausflug Tossa de Mar** — NO aparece, valioso para ruta
8. **Privatcharter mit Skipper Costa Brava** — NO aparece, valioso para Fase 3 (excursión privada)
9. **Badebucht Blanes Boot** — NO aparece, long-tail específico
10. **Familienurlaub Boot Costa Brava** — NO aparece, valioso familiar

### Implementación sugerida

- Meta title DE home: "**Bootsverleih führerscheinfrei in Blanes** — Costa Brava · ab 70 €/Std."
- Meta description DE home: "Motorboot mieten direkt am Hafen von Blanes. Führerscheinfrei ab 70 €/Std. inkl. Benzin. Privatcharter mit Skipper zur Costa Brava. 8 Sprachen. Buchung in 2 Minuten."
- H1 DE home: "**Bootsverleih in Blanes** — führerscheinfrei oder mit Skipper"
- Landing DE dedicada: `/de/bootsverleih-blanes-fuehrerscheinfrei` (slug SEO-friendly)

---

## Recomendaciones de corrección priorizadas

### Sprint 1 (2-3h de trabajo nativo) — Impacto máximo

1. **Decidir Sie** (no du) y hacer **search-replace** coherente en todo el archivo
2. **Corregir Title Case** → minúsculas en verbos de CTAs y títulos donde corresponda (reglas DE)
3. **Reescribir los 5 textos hero** (líneas 16-40) con estilo nativo
4. **Fijar Bootsverleih** como keyword principal (no Bootsvermietung)

### Sprint 2 (3-4h) — Refinamiento

5. Añadir keywords SEO alemanas que faltan (Motorboot, Yachtcharter, Privatcharter)
6. Corregir todos los casos señalados en la tabla de Prioridad Media
7. Unificar terminología náutica con el glosario
8. Rescribir meta descriptions DE en `seo-config.ts` para aprovechar nuevas keywords

### Sprint 3 (2-3h) — Pulido

9. Crear **1 landing específica** `/de/bootsverleih-blanes-fuehrerscheinfrei`
10. Auditar FAQ DE para lenguaje nativo
11. Ajustar tipografía (en-dash, puntos abreviatura)

---

## Nota para el equipo

**Qué NO hacer:**
- Corregir todos los 1662 líneas de una tanda sin QA — romperás tipado o claves
- Dejar du/Sie mixto pensando "ya se entiende" — el cliente premium alemán lo nota al segundo pixel
- Traducir literalmente del ES al revisar (el problema actual) — el revisor DEBE ser nativo DE, no bilingüe ES-DE

**Qué SÍ hacer:**
- Contratar 1 nativo DE con experiencia en marketing digital (Fiverr ~50-60€/h o Upwork ~40-50€/h)
- Entregarle: este documento + archivo `de.ts` + home de la web en vivo
- Pedirle un **PR directo** (no un doc de sugerencias)
- Hacer QA: revisar que claves y estructura del objeto TypeScript no se rompan

---

## Próximos pasos sugeridos

- [ ] Decidir estrategia Sie vs. du (recomendado: Sie)
- [ ] Contratar nativo DE para Sprint 1 (~150-200€, 3h)
- [ ] Replicar auditoría para **NL** (mercado prioritario #2) — mismo patrón probable
- [ ] Replicar para **IT** y **RU** (prioridad menor)
- [ ] Medir impacto post-corrección en Google Search Console: clics desde búsquedas alemanas en 4 semanas post-deploy
