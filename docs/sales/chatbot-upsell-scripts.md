# Scripts WhatsApp · Derivación a Excursión Privada

**Generado:** 2026-04-22 (corregido con datos reales de `shared/boatData.ts`)
**Objetivo:** Detectar perfiles premium en WhatsApp y derivar del alquiler estándar al producto "Excursión Privada con Capitán".
**Integración técnica:** `server/whatsapp/aiService.ts` (integrado commit `7bb79ef`, corregido tras este documento)

---

## 1. Producto real (source of truth: `shared/boatData.ts` → `excursion-privada`)

### "Excursión Privada con Capitán"

**Barco:** Pacific Craft 625 Open · 6,24 m · Yamaha 115cv 4T · hasta **7 personas**

| Duración | BAJA (Abr-Jun, Sep-Oct) | MEDIA (Julio) | ALTA (Agosto) |
|---|---|---|---|
| **2h** | 240 € | 260 € | 280 € |
| **3h** | 320 € | 340 € | 360 € |
| **4h** | 380 € | 400 € | 420 € |

**Incluye:** patrón profesional · amarre · limpieza · seguro embarcación y ocupantes · IVA
**NO incluye:** combustible (lo paga el cliente al final) · extras opcionales (snorkel 7,5€, paddle 25€, seascooter 60€, etc.)
**Fianza:** 500 €
**Capacidad:** hasta 7 personas

---

## 2. Triggers de detección

Cuando el bot detecte **≥1 señal fuerte** o **≥2 señales compuestas** debe proponer la Excursión Privada en lugar del alquiler por horas.

### Señales fuertes (cualquiera → derivar)

- "Aniversario" / "cumpleaños" / "luna de miel" / "pedida de mano" / "celebración"
- "Jubilación" / "despedida"
- "Team building" / "empresa" / "corporate"
- "Sin experiencia" / "nunca he llevado un barco" / "primera vez navegando"
- "No me apetece conducir" / "que alguien nos lleve"
- "Algo especial" / "quiero sorprender" / "quiero algo premium"

### Señales compuestas (≥2 → derivar)

- Grupo > 5 personas
- Viaje con niños pequeños (<8 años)
- Pareja sin experiencia náutica
- Procedencia de país premium: DE, CH, NL, NO, SE, AT, US, UK
- Pregunta "¿qué se puede hacer en el barco?"
- Pide itinerario cerrado

### Señales negativas (NO derivar)

- "Sé navegar" / "tengo licencia PER"
- "Solo una hora" / "una mañana corta"
- Pregunta explícita por el precio más económico
- Cliente local (Blanes/Lloret) — suele preferir alquiler simple

---

## 3. Árbol de decisión

```
Cliente abre chat
    │
    ├─► Bot saluda en su idioma
    │
    ▼
Pregunta calificación 1 (grupo y ocasión)
    │
    ├─► SEÑAL FUERTE → DERIVAR (Script A)
    ├─► SEÑAL NEGATIVA → Flow estándar
    └─► Neutral
        │
        ▼
        Pregunta calificación 2 (experiencia náutica)
            │
            ├─► "Sin experiencia" → DERIVAR (Script B)
            └─► Con experiencia
                │
                ▼
                Pregunta calificación 3 (expectativa)
                    │
                    ├─► "Algo especial" / VIP → DERIVAR (Script C)
                    └─► Flow estándar
```

---

## 4. Preguntas de calificación (4 idiomas)

### Pregunta 1 · Grupo y ocasión

**ES:**
> "Hola {name}! Encantado de ayudarte. Para recomendarte el mejor barco, cuéntame: ¿cuántos sois y hay alguna ocasión especial (aniversario, cumpleaños, vacaciones en familia)?"

**EN:**
> "Hi {name}! Happy to help. To suggest the best boat, tell me: how many of you are coming and is there any special occasion (anniversary, birthday, family holiday)?"

**DE:**
> "Hallo {name}! Gerne helfe ich Ihnen. Damit ich das passende Boot empfehlen kann: Wie viele Personen kommen und gibt es einen besonderen Anlass (Jubiläum, Geburtstag, Familienurlaub)?"

**FR:**
> "Bonjour {name} ! Je serai ravi de vous aider. Pour vous conseiller le meilleur bateau, dites-moi : combien êtes-vous et y a-t-il une occasion spéciale (anniversaire, fête, vacances en famille) ?"

### Pregunta 2 · Experiencia náutica

**ES:**
> "¿Alguien del grupo tiene licencia de navegación o experiencia llevando barcos? Esto me ayuda a proponerte la opción más cómoda."

**EN:**
> "Does anyone in your group have a boating license or experience driving a boat? This helps me suggest the most comfortable option for you."

**DE:**
> "Hat jemand in Ihrer Gruppe einen Bootsführerschein oder Erfahrung mit Booten? So kann ich Ihnen die komfortabelste Option vorschlagen."

**FR:**
> "Quelqu'un dans votre groupe a-t-il un permis bateau ou de l'expérience en navigation ? Cela m'aide à vous proposer l'option la plus confortable."

### Pregunta 3 · Expectativa

**ES:**
> "Última pregunta: ¿buscáis un alquiler por horas para ir a vuestro aire, o preferís una experiencia con patrón que os lleve a las mejores calas de la zona sin tener que preocuparos de nada?"

**EN:**
> "Last question: are you looking for an hourly rental to go on your own, or would you prefer an experience with a skipper who takes you to the best coves of the area so you don't have to worry about anything?"

**DE:**
> "Letzte Frage: Suchen Sie eine stundenweise Vermietung, um selbst zu fahren, oder bevorzugen Sie ein Erlebnis mit Skipper, der Sie zu den schönsten Buchten bringt — ganz ohne Sorgen?"

**FR:**
> "Dernière question : cherchez-vous une location à l'heure pour naviguer vous-mêmes, ou préférez-vous une expérience avec un skipper qui vous emmène dans les plus belles criques, sans avoir à vous soucier de rien ?"

---

## 5. Scripts de derivación (respuestas tipo bot)

### Script A · Ocasión especial detectada

**ES:**
> "¡Qué bien! Para una ocasión así **tenemos algo perfecto: nuestra Excursión Privada con Capitán**. Un barco (Pacific Craft 625, hasta 7 personas) con patrón profesional que os lleva a calas escondidas y cuevas marinas entre Blanes y Tossa de Mar. La ruta del día la eligen según viento y corrientes para daros la mejor experiencia.
>
> Tres duraciones según lo que busquéis:
> · **2h — desde 240 €** (paseo íntimo, calas cercanas)
> · **3h — desde 320 €** (ruta extendida con parada para nadar)
> · **4h — desde 380 €** (experiencia completa, más calas)
>
> Incluye patrón, amarre, seguro y limpieza. El combustible va aparte (se paga al final según lo usado).
>
> ¿Cuánto tiempo tenéis pensado y para qué fecha?"

**EN:**
> "Wonderful! For an occasion like that **we have something perfect: our Private Excursion with Skipper**. A boat (Pacific Craft 625, up to 7 people) with a professional skipper who takes you to hidden coves and sea caves between Blanes and Tossa de Mar. The route is chosen according to wind and currents for the best experience of the day.
>
> Three durations:
> · **2h — from €240** (intimate cruise, nearby coves)
> · **3h — from €320** (extended route with swim stop)
> · **4h — from €380** (full experience, more coves)
>
> Includes skipper, mooring, insurance and cleaning. Fuel is billed separately (paid at the end based on usage).
>
> How long were you thinking and for what date?"

**DE:**
> "Wie schön! Für einen solchen Anlass **haben wir das Richtige: unsere private Ausflugsfahrt mit Skipper**. Ein Boot (Pacific Craft 625, bis 7 Personen) mit einem professionellen Skipper, der Sie zu versteckten Buchten und Meereshöhlen zwischen Blanes und Tossa de Mar bringt. Die Route wird je nach Wind und Strömung ausgewählt.
>
> Drei Dauern:
> · **2h — ab 240 €** (intime Fahrt, nahe Buchten)
> · **3h — ab 320 €** (erweiterte Route mit Badestopp)
> · **4h — ab 380 €** (komplettes Erlebnis, mehr Buchten)
>
> Beinhaltet: Skipper, Liegeplatz, Versicherung, Reinigung. Kraftstoff wird separat am Ende je nach Verbrauch abgerechnet.
>
> Wie lange hatten Sie gedacht und für welches Datum?"

**FR:**
> "Parfait ! Pour une telle occasion **nous avons quelque chose d'idéal : notre Excursion Privée avec Skipper**. Un bateau (Pacific Craft 625, jusqu'à 7 personnes) avec un skipper professionnel qui vous emmène dans des criques cachées et des grottes marines entre Blanes et Tossa de Mar. L'itinéraire est choisi selon le vent et les courants.
>
> Trois durées :
> · **2h — dès 240 €** (balade intime, criques proches)
> · **3h — dès 320 €** (itinéraire étendu avec pause baignade)
> · **4h — dès 380 €** (expérience complète, plus de criques)
>
> Inclus : skipper, amarrage, assurance, nettoyage. Le carburant est facturé séparément à la fin selon la consommation.
>
> Combien de temps aviez-vous prévu et pour quelle date ?"

---

### Script B · Sin experiencia náutica

**ES:**
> "Entiendo perfectamente. Mucha gente nos pregunta lo mismo y **por eso tenemos la Excursión Privada con Capitán**: vais con un patrón profesional que lleva el barco, vosotros solo disfrutáis. Tres opciones según tiempo: **2h desde 240 €**, **3h desde 320 €**, **4h desde 380 €** — hasta 7 personas.
>
> Ventajas:
> · Cero estrés aprendiendo a manejar
> · Vais donde las condiciones son mejores ese día
> · El patrón os cuenta la zona en vuestro idioma
> · Ruta hasta calas a las que no llegan los barcos de alquiler sin licencia
>
> La alternativa del alquiler sin licencia también existe (15 min de formación y os vais solos, desde 75€/h con gasolina incluida), pero para vuestro perfil recomendaría la Excursión Privada. ¿Os encaja alguna duración?"

**EN:**
> "Totally understand. Many guests ask the same, and **that's why we have the Private Excursion with Skipper**: you go with a professional skipper who handles the boat, you just enjoy it. Three options depending on time: **2h from €240**, **3h from €320**, **4h from €380** — up to 7 people.
>
> What you get:
> · No stress learning to drive
> · You go where the conditions are best that day
> · The skipper tells you about the area in your language
> · Access to coves that license-free rentals can't reach
>
> The no-license rental alternative also exists (15 min training and you're on your own, from €75/h with fuel included), but for your profile I'd recommend the Private Excursion. Does any duration fit your plan?"

**DE:**
> "Völlig nachvollziehbar. Viele Gäste fragen dasselbe, **und genau dafür haben wir die private Ausflugsfahrt mit Skipper**: Sie fahren mit einem professionellen Skipper, Sie genießen nur. Drei Optionen je nach Zeit: **2h ab 240 €**, **3h ab 320 €**, **4h ab 380 €** — bis 7 Personen.
>
> Was Sie bekommen:
> · Kein Stress beim Bootfahren lernen
> · Sie fahren dorthin, wo die Bedingungen am besten sind
> · Der Skipper erklärt Ihnen die Region in Ihrer Sprache
> · Zugang zu Buchten, die führerscheinfreie Boote nicht erreichen
>
> Die führerscheinfreie Alternative gibt es auch (15 Min. Einweisung und Sie fahren allein, ab 75 €/Std. mit Benzin inklusive), aber für Ihr Profil würde ich die private Ausfahrt empfehlen. Passt eine der Dauern?"

**FR:**
> "Je comprends tout à fait. Beaucoup de clients nous posent la même question, **et c'est exactement pour ça qu'existe notre Excursion Privée avec Skipper** : vous partez avec un skipper professionnel, vous profitez simplement. Trois options selon le temps : **2h dès 240 €**, **3h dès 320 €**, **4h dès 380 €** — jusqu'à 7 personnes.
>
> Ce que vous obtenez :
> · Aucun stress à apprendre à piloter
> · Vous allez là où les conditions sont les meilleures
> · Le skipper commente la région dans votre langue
> · Accès à des criques inaccessibles aux locations sans permis
>
> L'alternative sans permis existe aussi (15 min de formation et vous partez seuls, dès 75 €/h avec essence incluse), mais pour votre profil je recommanderais l'Excursion Privée. Une durée vous convient-elle ?"

---

### Script C · Budget flexible / busca premium

**ES:**
> "Perfecto. La opción que mejor encaja es nuestra **Excursión Privada con Capitán**: día privado con patrón profesional, ruta curada por la costa entre Blanes y Tossa, calas escondidas y cuevas marinas. Pacific Craft 625, hasta 7 personas.
>
> Tres formatos:
> · **2h — 240 €** (BAJA · Abril-Junio y Septiembre-Octubre)
> · **3h — 320 €** (la más elegida: da tiempo a una parada larga para bañarse)
> · **4h — 380 €** (experiencia completa, ruta extendida)
>
> Todos incluyen patrón, amarre, seguro y limpieza. Combustible a parte según uso (~20-30 €/h de navegación real).
>
> ¿Qué grupo sois y qué fecha tenéis en mente?"

**EN, DE, FR:** Follow same structure with exact prices from the table above.

---

## 6. Guión anti-objeción "es caro"

**ES:**
> "Entiendo que 380€ a primera vista parece una inversión importante. Déjame ponerlo en contexto:
>
> · Para un grupo de 6 personas son **63€ por persona** por 4 horas de excursión privada
> · Incluye patrón profesional, amarre, seguro y limpieza — lo único aparte es el combustible (~20-30€/h de navegación)
> · No es el mismo producto que una excursión en grupo de 40 personas: con nosotros tenéis el barco entero para vosotros, el patrón os hace una ruta personalizada y paráis donde queráis
>
> Si aun así prefieres una opción más económica, tenemos alquiler sin licencia desde 75€/h (hasta 5 personas, gasolina incluida). Se conduce solo tras 15 min de formación. Es totalmente válido para un paseo corto — lo disfrutaréis igual, solo es una experiencia diferente.
>
> ¿Qué prefieres que explore?"

**EN:**
> "I get it — €380 feels significant at first glance. Let me put it in context:
>
> · For a group of 6 people, that's **€63 per person** for 4 hours of private excursion
> · Includes professional skipper, mooring, insurance and cleaning — only fuel is separate (~€20-30 per hour of navigation)
> · It's not the same as a group excursion with 40 people: with us you have the whole boat to yourselves, the skipper does a personalized route, and you stop where you want
>
> If you still prefer a more economical option, we have license-free rental from €75/h (up to 5 people, fuel included). Self-drive after 15 min training. Perfectly valid for a shorter ride — you'll enjoy it too, just a different experience.
>
> Which one should I look into?"

**DE:**
> "Ich verstehe — 380 € wirken auf den ersten Blick wie eine größere Investition. Lassen Sie mich das einordnen:
>
> · Bei einer Gruppe von 6 Personen sind das **63 € pro Person** für 4 Stunden private Ausfahrt
> · Beinhaltet professioneller Skipper, Liegeplatz, Versicherung und Reinigung — nur der Kraftstoff kommt separat dazu (ca. 20-30 €/Std. Fahrt)
> · Es ist nicht dasselbe wie eine Gruppenausfahrt mit 40 Personen: Bei uns haben Sie das Boot ganz für sich, der Skipper macht eine personalisierte Route, und Sie stoppen, wo Sie möchten
>
> Falls Sie dennoch eine günstigere Option bevorzugen: führerscheinfreie Vermietung ab 75 €/Std. (bis 5 Personen, Benzin inklusive). Selbst fahren nach 15 Min. Einweisung. Perfekt für eine kürzere Fahrt — auch ein schönes Erlebnis, nur anders.
>
> Welche Option soll ich für Sie prüfen?"

**FR:**
> "Je comprends — 380€ paraissent à première vue un investissement important. Laissez-moi remettre en contexte :
>
> · Pour un groupe de 6 personnes, cela fait **63€ par personne** pour 4 heures d'excursion privée
> · Inclus : skipper professionnel, amarrage, assurance et nettoyage — seul le carburant est à part (environ 20-30€/h de navigation)
> · Ce n'est pas comme une excursion en groupe de 40 personnes : avec nous vous avez le bateau entier pour vous, le skipper fait un itinéraire personnalisé et vous vous arrêtez où vous voulez
>
> Si vous préférez quand même une option plus économique, nous avons la location sans permis dès 75€/h (jusqu'à 5 personnes, essence incluse). Auto-pilotage après 15 min de formation. Parfait pour une sortie plus courte — vous en profiterez aussi, c'est simplement une expérience différente.
>
> Laquelle je vérifie pour vous ?"

---

## 7. Integración técnica (YA integrada en `aiService.ts`)

La integración está activa a nivel de código (commit `7bb79ef`, corregida con datos reales en commit pendiente tras este doc). Contiene:

1. **`PREMIUM_KEYWORDS`** — array multi-idioma con ~40 keywords detectadas en `detectIntent()`
2. **Nuevo intent `'premium_profile_detected'`** evaluado PRIMERO en `detectIntent()`
3. **`PRIVATE_EXCURSION_CONTEXT`** inyectado en el `systemPrompt` con:
   - Precios reales (2h/3h/4h por temporada)
   - Reglas CUANDO proponer y CUANDO NO
   - Guión anti-objeción con reframe por persona
   - Capacidad correcta (7 personas, no 8)

Estado: **código listo, chatbot no activado en producción todavía.**

---

## 8. Tests manuales recomendados (antes de activar producción)

Probar estas conversaciones simuladas en cada idioma:

1. **Caso aniversario DE:** "Hallo, wir sind zu zweit und feiern unseren 10. Hochzeitstag." → debe proponer Excursión Privada 3h/4h (240-420€)
2. **Caso sin experiencia EN:** "Hi, we're 4 people, never been on a boat before." → debe proponer Excursión Privada (Script B)
3. **Caso budget ES:** "Buscamos algo especial para el cumple de mi padre." → debe proponer Excursión Privada 4h (380-420€)
4. **Caso alquiler simple FR:** "Je loue un bateau 2h demain matin." → NO debe derivar, flow estándar
5. **Caso objeción precio:** tras propuesta responder "es caro" → debe aplicar reframe sin bajar el precio

Confirmar en cada uno:
- Precio correcto según boatData.ts
- No inventa duraciones de 6h/8h
- Menciona 7 personas (no 8)
- Menciona que combustible va aparte
- No inventa packs (aniversario/despedida/corporate) — ninguno existe en boatData.ts

---

## 9. Métricas a trackear (cuando se active)

| Métrica | Meta mes 1 | Meta mes 3 |
|---|---|---|
| % conversaciones con derivación premium | 10% | 15-20% |
| Tasa aceptación tras derivación | 20% | 30-40% |
| Ticket medio reservas derivadas | >280€ | >350€ |
| Razón más efectiva | — | Identificar top 2 |
| Detección falsos positivos (no-premium derivados) | <5% | <3% |

---

## Nota sobre packs inventados

La versión anterior de este documento (descartada) proponía "Pack Aniversario +60 €", "Pack Despedida +80 €", "Pack Corporate +150 €". **Ninguno existe en `boatData.ts`** y por tanto no los debe ofrecer el bot.

Si en el futuro se quieren lanzar, hay que:
1. Definir coste real (cava, decoración, fotógrafo, etc.)
2. Añadirlos como `extras` en `shared/boatData.ts` → bloque `excursion-privada`
3. Actualizar `PRIVATE_EXCURSION_CONTEXT` en `aiService.ts`
4. Lanzar como iniciativa de producto separada

Son una oportunidad REAL de upsell pero hoy **no existen operativamente**.
