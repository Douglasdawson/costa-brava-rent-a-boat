# Scripts WhatsApp · Derivación a Excursión Privada Premium

**Generado:** 2026-04-22
**Objetivo:** Detectar perfiles premium en WhatsApp y derivar del alquiler estándar (70-80€/h) al producto "Excursión Privada Costa Brava" (480-880€).
**Integración técnica:** `server/whatsapp/aiService.ts` + `server/whatsapp/functionCallingService.ts`
**Impacto esperado:** Ticket medio +250-400% en conversaciones derivadas, con mayor satisfacción (servicio completo).

---

## 1. Producto de destino

### "Excursión Privada Costa Brava"

| Duración | Precio | Incluye |
|---|---|---|
| 4h | **480 €** | Patrón · 3 calas · Tossa · snorkel · fotografía · bebidas |
| 6h | **680 €** | Todo lo anterior + comida ligera a bordo |
| 8h | **880 €** | Día completo · ruta extendida · 4-5 calas · 2 paradas en pueblos |

Máx 6-8 personas · Atención en 8 idiomas · Reserva con 7 días de antelación.

**Upsells adicionales:**
- Aniversario/Luna de miel · +60 € · cava + decoración discreta
- Despedida soltero/a · +80 € · música + fotos grupales
- Corporate team-building · +150 € · logística empresa + briefing

---

## 2. Triggers de detección (el bot debe captar estos signos)

Cuando el bot detecte **≥2 señales** de la lista, debe proponer la Excursión Privada en lugar del alquiler estándar:

### Señales fuertes (cualquiera de estas → derivar inmediatamente)

- "Aniversario" / "cumpleaños" / "luna de miel" / "pedida de mano" / "celebración"
- "Jubilación" / "despedida"
- "Team building" / "empresa" / "corporate"
- "Sin experiencia" / "nunca he llevado un barco" / "primera vez navegando"
- "No me apetece conducir yo" / "que alguien nos lleve"
- "Budget flexible" / "el dinero no importa" / "lo que haga falta"
- "Quiero algo especial" / "quiero algo premium" / "quiero sorprender"

### Señales compuestas (≥2 de estas → derivar)

- Grupo > 5 personas mencionado
- Viaje con niños pequeños (<8 años)
- Pareja sin experiencia náutica
- Procedencia país premium: DE, CH, NL, NO, SE, AT, US, UK
- Pregunta "¿qué se puede hacer en el barco?" (busca experiencia, no vehículo)
- Menciona foto / recuerdo / vídeo
- Pregunta por gastronomía / comida a bordo
- Pide itinerario cerrado: "¿qué ruta hacemos?"

### Señales negativas (NO derivar, cliente busca alquiler simple)

- "Sé navegar" / "tengo licencia PER"
- "Solo una hora" / "una mañana corta"
- Pregunta explícita por precio por hora más bajo
- Busca adrenalina solo (jetski, moto acuática)
- Localos (vive en Blanes/Lloret) — suelen preferir alquiler simple

---

## 3. Árbol de decisión conversacional

```
Cliente abre chat
    │
    ├─► Bot saluda en su idioma
    │
    ▼
Bot: pregunta calificación 1 (grupo y ocasión)
    │
    ├─► Respuesta revela SEÑAL FUERTE
    │   └─► DERIVAR a Excursión Privada (script A)
    │
    ├─► Respuesta revela SEÑAL NEGATIVA
    │   └─► Flow alquiler estándar (no modificar)
    │
    └─► Respuesta neutral
        │
        ▼
        Bot: pregunta calificación 2 (experiencia náutica)
            │
            ├─► "Nunca he llevado" / "sin experiencia"
            │   └─► DERIVAR a Excursión Privada (script B)
            │
            └─► "Tengo experiencia" / "alquilé antes"
                │
                ▼
                Bot: pregunta calificación 3 (budget/expectativa)
                    │
                    ├─► "Algo especial" / "premium" / "budget flexible"
                    │   └─► DERIVAR a Excursión Privada (script C)
                    │
                    └─► Flow alquiler estándar
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

### Pregunta 3 · Budget / expectativa

**ES:**
> "Última pregunta: ¿buscáis un alquiler por horas para ir a vuestro aire, o preferís una experiencia cerrada con patrón que os lleve a las mejores calas y Tossa de Mar sin tener que preocuparos de nada?"

**EN:**
> "Last question: are you looking for an hourly rental to go on your own, or would you prefer a closed experience with a skipper who takes you to the best coves and Tossa de Mar so you don't have to worry about anything?"

**DE:**
> "Letzte Frage: Suchen Sie eine stundenweise Vermietung, um selbst zu fahren, oder bevorzugen Sie ein Komplett-Erlebnis mit Skipper, der Sie zu den schönsten Buchten und nach Tossa de Mar bringt — ganz ohne Sorgen?"

**FR:**
> "Dernière question : cherchez-vous une location à l'heure pour naviguer vous-mêmes, ou préférez-vous une expérience complète avec un skipper qui vous emmène dans les plus belles criques et à Tossa de Mar, sans avoir à vous soucier de rien ?"

---

## 5. Scripts de derivación (respuestas tipo bot)

### Script A · Ocasión especial detectada (aniversario, cumpleaños, etc.)

**ES:**
> "¡Qué bien! Para una ocasión así **tenemos algo perfecto: nuestra Excursión Privada Costa Brava**. Es un día privado en barco con un patrón profesional que os lleva a 3 calas cuidadosamente elegidas según el viento del día, parada de 45 minutos en Tossa de Mar para pasear por el castillo, snorkel incluido con equipamiento, bebidas frías a bordo, y **fotografías digitales del día enviadas en 48h** (perfecto como recuerdo).
>
> Es desde **480 €** por 4 horas para hasta 8 personas. Si queréis que sea más especial, podemos añadir un **paquete aniversario (+60€)** con botella de cava y una pequeña decoración.
>
> ¿Quieres que te cuente una ruta típica y preparamos disponibilidad?"

**EN:**
> "Wonderful! For an occasion like that **we have something perfect: our Costa Brava Private Excursion**. It's a private day on the boat with a professional skipper who takes you to 3 carefully chosen coves depending on the day's wind, a 45-minute stop in Tossa de Mar to walk up to the castle, snorkeling gear included, cold drinks on board, and **digital photos from the day sent within 48h** (perfect as a memory).
>
> From **€480** for 4 hours, up to 8 people. If you want to make it more special, we can add an **Anniversary Package (+€60)** with a bottle of cava and discreet decoration.
>
> Want me to tell you a typical route and check availability?"

**DE:**
> "Wie schön! Für einen solchen Anlass **haben wir das Richtige: unsere private Costa-Brava-Ausflugsfahrt**. Ein privater Tag an Bord mit einem professionellen Skipper, der Sie je nach Wind zu 3 sorgfältig ausgewählten Buchten bringt, mit einem 45-minütigen Stopp in Tossa de Mar zum Spaziergang zur Burg, Schnorchelausrüstung inklusive, kalten Getränken an Bord und **digitalen Fotos des Tages innerhalb von 48 Stunden** (als perfekte Erinnerung).
>
> Ab **480 €** für 4 Stunden für bis zu 8 Personen. Wenn Sie es besonders machen möchten, können wir das **Jubiläums-Paket (+60 €)** mit einer Flasche Cava und dezenter Dekoration hinzufügen.
>
> Möchten Sie eine typische Route hören und die Verfügbarkeit prüfen?"

**FR:**
> "Parfait ! Pour une telle occasion **nous avons quelque chose d'idéal : notre Excursion Privée Costa Brava**. Une journée privée à bord avec un skipper professionnel qui vous emmène dans 3 criques choisies selon le vent du jour, un arrêt de 45 minutes à Tossa de Mar pour monter au château, équipement de snorkeling inclus, boissons fraîches à bord, et **photos numériques envoyées sous 48h** (un souvenir parfait).
>
> À partir de **480 €** pour 4 heures, jusqu'à 8 personnes. Pour une touche supplémentaire, nous proposons un **Pack Anniversaire (+60€)** avec bouteille de cava et décoration discrète.
>
> Voulez-vous que je vous décrive un itinéraire type et qu'on vérifie la disponibilité ?"

---

### Script B · Sin experiencia náutica

**ES:**
> "Entiendo perfectamente. Mucha gente nos pregunta lo mismo y **por eso tenemos la Excursión Privada**: vais con un patrón profesional que lleva el barco todo el día, vosotros solo disfrutáis. Desde **480€ por 4 horas para hasta 8 personas**, incluye ruta por 3 calas + parada en Tossa de Mar + snorkel + fotografía.
>
> Ventajas:
> · Nada de estrés aprendiendo a manejar
> · Vais donde vayan las mejores condiciones ese día
> · El patrón os cuenta la zona en vuestro idioma
> · Fotos profesionales como recuerdo
>
> La alternativa del alquiler sin licencia también existe (15min de formación y os vais solos), pero la Excursión Privada es lo que recomendaría para vuestro perfil. ¿Quieres que os reserve una fecha?"

**EN:**
> "Totally understand. Many guests ask the same, and **that's why we have the Private Excursion**: you go with a professional skipper who handles the boat all day, you just enjoy it. From **€480 for 4 hours for up to 8 people**, includes a route through 3 coves + stop in Tossa de Mar + snorkeling + photography.
>
> What you get:
> · No stress learning to drive
> · You go where the conditions are best that day
> · The skipper tells you about the area in your language
> · Professional photos as a keepsake
>
> The no-license rental alternative exists (15 min of training and you're on your own), but the Private Excursion is what I'd recommend for your profile. Want me to check a date for you?"

**DE:**
> "Völlig nachvollziehbar. Viele Gäste fragen dasselbe, **und genau dafür haben wir die private Ausflugsfahrt**: Sie fahren mit einem professionellen Skipper, der sich den ganzen Tag um das Boot kümmert, Sie genießen nur. Ab **480 € für 4 Stunden für bis zu 8 Personen**, inklusive Route über 3 Buchten + Stopp in Tossa de Mar + Schnorcheln + Fotografie.
>
> Was Sie bekommen:
> · Kein Stress beim Bootfahren lernen
> · Sie fahren dorthin, wo die Bedingungen am besten sind
> · Der Skipper erklärt Ihnen die Region in Ihrer Sprache
> · Professionelle Fotos als Erinnerung
>
> Die führerscheinfreie Alternative gibt es auch (15 Min. Einweisung und Sie fahren allein), aber für Ihr Profil würde ich die private Ausfahrt empfehlen. Soll ich einen Termin prüfen?"

**FR:**
> "Je comprends tout à fait. Beaucoup de clients nous posent la même question, **et c'est exactement pour ça qu'existe notre Excursion Privée** : vous partez avec un skipper professionnel qui pilote le bateau toute la journée, vous profitez simplement. À partir de **480 € pour 4 heures jusqu'à 8 personnes**, avec une route par 3 criques + arrêt à Tossa de Mar + snorkeling + photos.
>
> Ce que vous obtenez :
> · Aucun stress à apprendre à piloter
> · Vous allez là où les conditions sont les meilleures
> · Le skipper commente la région dans votre langue
> · Photos professionnelles comme souvenir
>
> L'alternative sans permis existe aussi (15 min de formation et vous partez seuls), mais pour votre profil je recommanderais l'Excursion Privée. Voulez-vous que je vérifie une date ?"

---

### Script C · Budget flexible / busca premium

**ES:**
> "Perfecto. Entonces la opción que mejor encaja es nuestra **Excursión Privada Costa Brava**: día privado con patrón, ruta curada de 3 calas + Tossa de Mar, snorkel, fotografía y bebidas. Es un producto pensado exactamente para cuando no buscáis alquiler por horas, sino **un día memorable sin preocupaciones**.
>
> Tres formatos:
> · **4h — 480€** (media jornada, ideal para mañana o tarde)
> · **6h — 680€** (+comida ligera a bordo, la opción más elegida)
> · **8h — 880€** (día completo, 4-5 calas, 2 paradas en pueblos)
>
> Todos hasta 8 personas. ¿Qué grupo sois y qué fecha tenéis en mente?"

**EN:**
> "Perfect. Then the option that fits best is our **Costa Brava Private Excursion**: private day with a skipper, curated route of 3 coves + Tossa de Mar, snorkeling, photography, and drinks. It's a product designed exactly for when you're not looking for hourly rental but a **memorable worry-free day**.
>
> Three formats:
> · **4h — €480** (half-day, ideal for morning or afternoon)
> · **6h — €680** (+light meal on board, the most popular choice)
> · **8h — €880** (full day, 4-5 coves, 2 village stops)
>
> All up to 8 people. What's your group like and what date do you have in mind?"

**DE & FR:** Follow same structure, adapt pricing format (680 € · 880 €).

---

## 6. Guión anti-objeción "es caro"

Esta es la objeción más común. El bot debe responder con validación + reframe, no con descuento.

**ES:**
> "Entiendo que 480€ a primera vista parece una inversión importante. Déjame ponerlo en contexto:
>
> · Para un grupo de 6 personas son **80€ por persona** por un día entero en el mar
> · Incluye todo: patrón profesional, gasolina, equipamiento snorkel, bebidas, **y las fotos que os mandamos después** (tipo restaurante + excursión guiada, sale similar o más)
> · No es el mismo producto que el alquiler estándar. En el estándar alquilas un barco; con nosotros alquilas **un día organizado profesionalmente**.
>
> Si aun así prefieres opción más económica, tenemos el alquiler sin licencia desde 70€/h (hasta 5 personas, gasolina incluida). Es totalmente válido para un paseo corto por la zona — lo disfrutaréis igual, solo es una experiencia diferente.
>
> ¿Qué prefieres que explore?"

**EN:**
> "I get it — €480 feels like a significant investment at first glance. Let me put it in context:
>
> · For a group of 6 people, that's **€80 per person** for a full day at sea
> · It includes everything: professional skipper, fuel, snorkeling gear, drinks, **and the photos we send you afterwards** (compared to a restaurant + guided tour bundle, it's similar or less)
> · It's not the same product as the standard rental. With the standard you're renting a boat; with us you're renting a **professionally organized day**.
>
> If you still prefer a more economical option, we have license-free rental from €70/h (up to 5 people, fuel included). It's perfectly valid for a shorter ride in the area — you'll enjoy it too, just a different experience.
>
> Which one should I look into?"

**DE:**
> "Ich verstehe — 480 € wirken auf den ersten Blick wie eine größere Investition. Lassen Sie mich das einordnen:
>
> · Bei einer Gruppe von 6 Personen sind das **80 € pro Person** für einen ganzen Tag auf dem Meer
> · Alles inklusive: professioneller Skipper, Benzin, Schnorchelausrüstung, Getränke **und die Fotos, die wir Ihnen danach schicken** (verglichen mit Restaurant + geführter Ausflug kommt ähnlich oder günstiger heraus)
> · Es ist nicht dasselbe Produkt wie die Standard-Vermietung. Bei der Standard mieten Sie ein Boot; bei uns mieten Sie **einen professionell organisierten Tag**.
>
> Falls Sie dennoch eine günstigere Option bevorzugen: Führerscheinfreie Vermietung ab 70 €/Std. (bis 5 Personen, Benzin inklusive). Perfekt für eine kürzere Fahrt in der Umgebung — auch ein schönes Erlebnis, nur anders.
>
> Welche Option soll ich für Sie prüfen?"

**FR:**
> "Je comprends — 480€ paraissent à première vue un investissement important. Laissez-moi remettre en contexte :
>
> · Pour un groupe de 6 personnes, cela fait **80€ par personne** pour une journée entière en mer
> · Tout est inclus : skipper professionnel, essence, équipement snorkeling, boissons, **et les photos que nous vous envoyons après** (comparé à un restaurant + excursion guidée, c'est similaire ou moins)
> · Ce n'est pas le même produit que la location standard. En standard vous louez un bateau ; avec nous vous louez **une journée organisée professionnellement**.
>
> Si vous préférez quand même une option plus économique, nous avons la location sans permis dès 70€/h (jusqu'à 5 personnes, essence incluse). Parfait pour une sortie plus courte — vous en profiterez aussi, c'est simplement une expérience différente.
>
> Laquelle je vérifie pour vous ?"

---

## 7. Integración técnica sugerida

### 7.1 · Modificar `server/whatsapp/aiService.ts`

**A) Ampliar `detectIntent()` con nuevo intent `premium_signals`:**

```typescript
// server/whatsapp/aiService.ts (línea ~143)

function detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase();

  // NEW: Premium profile signals (add BEFORE other intents to catch first)
  const premiumKeywords = [
    // ES
    'aniversario', 'cumpleaños', 'luna de miel', 'pedida de mano',
    'celebración', 'sorprender', 'algo especial', 'jubilación',
    'nunca he llevado', 'sin experiencia', 'primera vez',
    'no me apetece conducir', 'empresa', 'team building',
    'presupuesto flexible',
    // EN
    'anniversary', 'birthday', 'honeymoon', 'proposal',
    'celebration', 'surprise', 'something special', 'retirement',
    'never driven', 'no experience', 'first time',
    'don\'t want to drive', 'company', 'team building',
    'budget flexible',
    // DE
    'jubiläum', 'geburtstag', 'flitterwochen', 'heiratsantrag',
    'feier', 'überraschen', 'etwas besonderes', 'ruhestand',
    'noch nie gefahren', 'keine erfahrung', 'zum ersten mal',
    'möchte nicht fahren', 'firma', 'team building',
    // FR
    'anniversaire', 'lune de miel', 'demande en mariage',
    'célébration', 'surprendre', 'quelque chose de spécial',
    'jamais piloté', 'sans expérience', 'première fois',
    'ne veux pas conduire', 'entreprise', 'team building',
  ];

  if (premiumKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'premium_profile_detected';
  }

  // ... rest of existing logic
}
```

**B) Ampliar el `systemPrompt` con instrucciones de derivación:**

```typescript
// server/whatsapp/aiService.ts (línea ~231)

const PRIVATE_EXCURSION_CONTEXT = `
PRODUCTO PREMIUM "EXCURSION PRIVADA COSTA BRAVA":
- 4h: 480€ | 6h: 680€ | 8h: 880€
- Incluye: patron profesional, 3 calas curadas, parada Tossa de Mar (45min), snorkel completo, bebidas, fotografia digital enviada en 48h
- Capacidad: hasta 8 personas
- Upsells: Pack Aniversario +60€, Despedida +80€, Corporate +150€

CUANDO PROPONER EXCURSION PRIVADA (en lugar de alquiler por horas):
1. Cliente menciona ocasion especial (aniversario, cumpleanos, luna de miel, jubilacion)
2. Cliente sin experiencia nautica ("nunca he llevado", "primera vez")
3. Cliente menciona budget flexible o busqueda premium
4. Grupo grande (>5 personas) con perfil familiar
5. Cliente corporativo o team-building

CUANDO NO PROPONER (mantener flow estandar):
- Cliente tiene licencia o menciona experiencia nautica
- Cliente busca alquiler por 1-2h corto
- Cliente pregunta explicitamente por precio minimo por hora

OBJECION "ES CARO":
- Validar la preocupacion
- Reframing: dividir por persona (480€ / 6 personas = 80€/pax por dia completo)
- Comparar con restaurante + excursion guiada agrupada
- Destacar fotografia como recuerdo duradero
- Ofrecer alternativa sin-licencia 70€/h sin presionar
`;

// En el systemPrompt principal, añadir:
const systemPrompt = `${BUSINESS_CONTEXT}

${boatsContext}

${PRIVATE_EXCURSION_CONTEXT}

${ragContext ? `\n${ragContext}\n` : ""}

IDIOMA_USUARIO: ${language} (${languageName})
...resto igual...
`;
```

### 7.2 · Opcional: Nueva función en `functionCallingService.ts`

Si quieres tracking estructurado, añade una función que el modelo pueda llamar:

```typescript
// server/whatsapp/functionCallingService.ts

{
  type: "function",
  function: {
    name: "suggest_private_excursion",
    description: "Call when the customer profile matches premium criteria (special occasion, no nautical experience, budget-flexible, or group >5 with family profile). This logs the suggestion and returns pricing details.",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          enum: ["special_occasion", "no_experience", "premium_budget", "large_group", "corporate"],
          description: "Primary reason for the suggestion"
        },
        hours: {
          type: "integer",
          enum: [4, 6, 8],
          description: "Recommended duration in hours"
        },
        language: {
          type: "string",
          description: "Customer language for the response"
        }
      },
      required: ["reason", "hours", "language"]
    }
  }
}
```

Handler en `aiService.ts`:

```typescript
case "suggest_private_excursion":
  // Log the derivation (for analytics)
  await storage.logChatEvent({
    sessionId: session.id,
    type: "premium_derivation",
    reason: parsedArgs.reason,
    suggestedHours: parsedArgs.hours,
    timestamp: new Date(),
  });

  // Return pricing + script to the model
  return {
    hours: parsedArgs.hours,
    price: { 4: 480, 6: 680, 8: 880 }[parsedArgs.hours],
    response: PREMIUM_SCRIPTS[parsedArgs.reason]?.[parsedArgs.language] ?? PREMIUM_SCRIPTS.default[parsedArgs.language],
  };
```

### 7.3 · Añadir al tracking de analytics

```typescript
// server/lib/analytics.ts (o donde centralices eventos)

export async function trackPremiumSuggestion(
  sessionId: string,
  reason: string,
  accepted: boolean,
) {
  await db.insert(chatEvents).values({
    sessionId,
    eventType: "premium_suggestion",
    metadata: { reason, accepted },
    createdAt: new Date(),
  });
}
```

Esto te permite medir en CRM Dashboard:
- % clientes derivados a Excursión Privada
- Tasa de aceptación tras derivación
- Razón más efectiva (aniversario vs. sin experiencia, etc.)

---

## 8. Checklist implementación

- [ ] **Fase 2** (ahora): añadir `premium_profile_detected` a `detectIntent()` con los keywords multi-idioma
- [ ] **Fase 2** (ahora): ampliar `systemPrompt` con `PRIVATE_EXCURSION_CONTEXT`
- [ ] **Fase 3** (cuando esté la landing /excursion-privada): añadir function calling `suggest_private_excursion`
- [ ] **Fase 3**: trackear eventos `premium_derivation` para medir ROI
- [ ] **Fase 3**: mostrar en CRM Dashboard el ratio de derivaciones por razón

---

## 9. Tests manuales recomendados

Antes de subir a producción, probar estas conversaciones simuladas en cada idioma:

1. **Caso aniversario DE:** "Hallo, wir sind zu zweit und feiern unseren 10. Hochzeitstag. Was empfehlen Sie?" → Bot debe proponer Excursión Privada + Pack Aniversario
2. **Caso sin experiencia EN:** "Hi, we're 4 people, never been on a boat before, what's easiest?" → Bot debe proponer Excursión Privada (Script B)
3. **Caso budget ES:** "Hola, buscamos algo especial para el cumple de mi padre, el dinero no es problema" → Bot debe proponer Excursión Privada 8h con Pack Aniversario
4. **Caso alquiler simple FR:** "Bonjour, je loue un bateau 2h demain matin, combien ça coute?" → Bot NO debe derivar, flow estándar
5. **Caso objeción precio:** después de propuesta responder "es caro" → Bot debe aplicar reframe sin bajar el precio

---

## 10. Métricas a trackear

| Métrica | Meta mes 1 | Meta mes 3 |
|---|---|---|
| % conversaciones con derivación premium | 10% | 15-20% |
| Tasa aceptación tras derivación | 20% | 30-40% |
| Ticket medio reservas vía derivación | >480€ | >550€ (con upsells) |
| Razón más efectiva | — | Identificar top 2 |
| Detección falsos positivos (clientes NO-premium derivados) | <5% | <3% |
