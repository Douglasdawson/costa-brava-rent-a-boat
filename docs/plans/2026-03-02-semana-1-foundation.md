# Semana 1 — Foundation: Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminar vulnerabilidades de seguridad críticas, añadir soporte multiidioma en emails y WhatsApp, y aplicar textos legales (RGPD) vía sistema de traducciones antes de la temporada 2026.

**Architecture:** Cambios en 3 capas: seguridad de servidor (Twilio HMAC, Stripe origin), datos (campo `language` en bookings), y presentación (emails multiidioma, textos RGPD traducidos, placeholders neutros).

**Tech Stack:** Express + TypeScript, Drizzle ORM, SendGrid, Twilio, React + Tailwind, sistema de traducciones propio en `client/src/lib/translations.ts`

---

## Task 1: Validar firma HMAC de Twilio en webhook WhatsApp

**Files:**
- Modify: `server/routes/whatsapp.ts`

**Contexto:** El endpoint `POST /api/whatsapp/webhook` acepta mensajes sin verificar que provienen de Twilio. Cualquiera puede enviar peticiones falsas.

**Step 1: Añadir middleware de validación HMAC**

El paquete `twilio` ya está instalado y exporta `validateRequest`. Modificar `server/routes/whatsapp.ts`:

```typescript
import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { requireAdminSession } from "./auth";
import twilio from "twilio";

function twilioSignatureMiddleware(req: Request, res: Response, next: NextFunction) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    // Twilio not configured — pass through (dev or disabled)
    return next();
  }

  const twilioSignature = req.headers["x-twilio-signature"] as string;
  if (!twilioSignature) {
    console.warn("[Webhook] Missing X-Twilio-Signature header");
    return res.status(403).send("Forbidden");
  }

  // Build the full URL that Twilio signed (must match exactly)
  const url =
    process.env.BASE_URL
      ? `${process.env.BASE_URL}/api/whatsapp/webhook`
      : `${req.protocol}://${req.get("host")}/api/whatsapp/webhook`;

  const isValid = twilio.validateRequest(authToken, twilioSignature, url, req.body as Record<string, string>);
  if (!isValid) {
    console.warn("[Webhook] Invalid Twilio signature — request rejected");
    return res.status(403).send("Forbidden");
  }

  next();
}

export async function registerWhatsAppRoutes(app: Express) {
  const { handleWhatsAppWebhook, handleWebhookValidation, handleStatusCallback } = await import(
    "../whatsapp/webhookHandler"
  );

  // Main webhook endpoint — HMAC validated
  app.post(
    "/api/whatsapp/webhook",
    express.urlencoded({ extended: false }),
    twilioSignatureMiddleware,
    handleWhatsAppWebhook,
  );

  // ... rest unchanged
```

**Step 2: Verificar que `BASE_URL` está definida en producción**

Comprobar que `.env` (o variables del hosting) incluye:
```
BASE_URL=https://costabravarentaboat.com
```
Si no existe, la URL se construye desde `req.protocol + host`, que puede diferir de la URL registrada en Twilio.

**Step 3: Verificar que no rompe el comportamiento en dev**

Cuando `TWILIO_AUTH_TOKEN` no está definido (dev local), el middleware hace pass-through. Correcto.

**Step 4: Commit**
```bash
git add server/routes/whatsapp.ts
git commit -m "fix(security): validate Twilio HMAC signature on WhatsApp webhook"
```

---

## Task 2: Corregir `success_url`/`cancel_url` de Stripe

**Files:**
- Modify: `server/routes/payments.ts:227`

**Contexto:** Hoy `create-checkout-session` usa `req.headers.origin` para construir las URLs de retorno. Un atacante podría enviar el header `Origin` apuntando a su propio dominio.

**Step 1: Leer el archivo payments.ts** (ya leído, línea 227)

**Step 2: Reemplazar `req.headers.origin` por origen fijo**

```typescript
// Antes (línea 226-228):
        success_url: `${req.headers.origin}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
        cancel_url: `${req.headers.origin}/booking?step=6&booking_id=${bookingId}`,

// Después:
        success_url: `${process.env.APP_URL || 'https://costabravarentaboat.com'}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
        cancel_url: `${process.env.APP_URL || 'https://costabravarentaboat.com'}/booking?step=6&booking_id=${bookingId}`,
```

**Step 3: Añadir `APP_URL` a `server/index.ts`** — ya tiene `BASE_URL` como opcional, añadir `APP_URL` a la lista de opcionales:

```typescript
// En server/index.ts, añadir APP_URL a OPTIONAL_ENV_VARS:
const OPTIONAL_ENV_VARS = ["STRIPE_SECRET_KEY", "SENDGRID_API_KEY", "OPENAI_API_KEY", "TWILIO_ACCOUNT_SID", "APP_URL"];
```

**Step 4: Commit**
```bash
git add server/routes/payments.ts server/index.ts
git commit -m "fix(security): use server-side APP_URL for Stripe success/cancel URLs"
```

---

## Task 3: Corregir lead scoring hardcodeado

**Files:**
- Modify: `server/whatsapp/aiService.ts:316`
- Modify: `server/whatsapp/chatMemoryService.ts`

**Contexto:** `const currentScore = 0;` ignora el score acumulado de conversaciones previas. El lead nunca sube de categoría.

**Step 1: Modificar `getOrCreateSession` para devolver el score actual**

En `chatMemoryService.ts`, la función `getOrCreateSession` devuelve `{ id, isNew, history }`. Cambiar para incluir `intentScore`:

```typescript
// En chatMemoryService.ts, línea 25 — cambiar el tipo de retorno:
export async function getOrCreateSession(
  phoneNumber: string,
  profileName?: string,
  language: string = 'es'
): Promise<{ id: string; isNew: boolean; history: Array<{ role: string; content: string }>; intentScore: number }> {
```

En el bloque `if (existingSession)` (línea ~48), añadir `intentScore`:
```typescript
      return { id: existingSession.id, isNew: false, history, intentScore: existingSession.intentScore };
```

En el bloque de creación de nueva sesión (línea ~52), añadir:
```typescript
    return { id: newSession.id, isNew: true, history: [], intentScore: 0 };
```

**Step 2: Usar el score real en `aiService.ts`**

```typescript
// Antes (línea 316):
    const currentScore = 0; // Would need to fetch from session

// Después:
    const currentScore = session.intentScore;
```

**Step 3: Commit**
```bash
git add server/whatsapp/chatMemoryService.ts server/whatsapp/aiService.ts
git commit -m "fix(chatbot): use persistent intentScore instead of hardcoded 0 for lead scoring"
```

---

## Task 4: Añadir fallback IA para NL, IT y RU

**Files:**
- Modify: `server/whatsapp/aiService.ts:330-342`

**Contexto:** El `fallbackResponses` tiene 5 idiomas (es, en, ca, fr, de). Faltan nl, it, ru.

**Step 1: Localizar el bloque**

```typescript
// aiService.ts línea 330-341 (actual):
    const fallbackResponses: Record<string, string> = {
      es: "Lo siento, estoy teniendo problemas tecnicos. ...",
      en: "Sorry, I'm having technical difficulties. ...",
      ca: "Ho sento, estic tenint problemes tecnics. ...",
      fr: "Desole, je rencontre des difficultes techniques. ...",
      de: "Entschuldigung, ich habe technische Schwierigkeiten. ...",
    };
```

**Step 2: Añadir los tres idiomas que faltan**

```typescript
    const fallbackResponses: Record<string, string> = {
      es: "Lo siento, estoy teniendo problemas tecnicos. Por favor, contacta directamente por WhatsApp al +34 611 500 372 o visita costabravarentaboat.com",
      en: "Sorry, I'm having technical difficulties. Please contact us directly via WhatsApp at +34 611 500 372 or visit costabravarentaboat.com",
      ca: "Ho sento, estic tenint problemes tecnics. Si us plau, contacta directament per WhatsApp al +34 611 500 372 o visita costabravarentaboat.com",
      fr: "Desole, je rencontre des difficultes techniques. Veuillez nous contacter directement via WhatsApp au +34 611 500 372 ou visitez costabravarentaboat.com",
      de: "Entschuldigung, ich habe technische Schwierigkeiten. Bitte kontaktieren Sie uns direkt uber WhatsApp unter +34 611 500 372 oder besuchen Sie costabravarentaboat.com",
      nl: "Sorry, ik heb technische problemen. Neem direct contact op via WhatsApp op +34 611 500 372 of bezoek costabravarentaboat.com",
      it: "Mi dispiace, sto avendo difficolta tecniche. Vi preghiamo di contattarci direttamente tramite WhatsApp al +34 611 500 372 o visitate costabravarentaboat.com",
      ru: "Izvinite, u menya tekhnicheskiye trudnosti. Svyazhites' s nami napryamuyu cherez WhatsApp po nomeru +34 611 500 372 ili posetite costabravarentaboat.com",
    };
```

**Step 3: Commit**
```bash
git add server/whatsapp/aiService.ts
git commit -m "fix(chatbot): add NL, IT, RU fallback responses for AI errors"
```

---

## Task 5: Añadir campo `language` a tabla `bookings`

**Files:**
- Modify: `shared/schema.ts`
- Run: `npm run db:push`

**Contexto:** Las reservas no almacenan el idioma del cliente. Necesario para enviar emails y WhatsApp en el idioma correcto.

**Step 1: Añadir columna en `shared/schema.ts`**

En la definición de `bookings` (línea ~298), añadir después de `notes`:

```typescript
  language: text("language").default("es"), // ISO 639-1: es, en, fr, de, nl, it, ru, ca
```

**Step 2: Actualizar `insertBookingSchema`**

En la extensión del schema (línea ~402), añadir:

```typescript
  language: z.string().max(5).optional().default("es"),
```

**Step 3: Ejecutar migración**
```bash
npm run db:push
```

**Step 4: Detectar idioma al crear booking**

El idioma se puede inferir del prefijo telefónico. La función `detectLanguageFromPhone` ya existe en `server/whatsapp/languageDetector.ts`. Usarla en el endpoint `POST /api/quote` (o en el flujo de confirmación de pago) para setear el campo `language` al crear el hold.

Localizar en `server/routes/bookings.ts` donde se crea el booking/hold (después de la línea 150 aproximadamente). Añadir antes de `storage.createBooking(...)`:

```typescript
// Detect language from phone prefix if phone is available
const { detectLanguageFromPhone } = await import("../whatsapp/languageDetector");
const customerLang = detectLanguageFromPhone(parsed.data.customerPhone || "") || "es";
const bookingData = { ...parsed.data, language: customerLang };
```

**Step 5: Commit**
```bash
git add shared/schema.ts server/routes/bookings.ts
git commit -m "feat(schema): add language field to bookings, detect from phone prefix"
```

---

## Task 6: Templates de email multiidioma (confirmación, recordatorio, thank-you)

**Files:**
- Modify: `server/services/emailService.ts`

**Contexto:** Todos los emails están en español. Clientes FR, DE, NL, IT, EN reciben emails en español.

**Enfoque:** Añadir un objeto `EMAIL_STRINGS` con los textos clave en ES/EN/FR/DE. El HTML wrapper y estilos no cambian. Solo cambian los textos.

**Step 1: Añadir interface y traducciones de email**

Al inicio de `emailService.ts`, después de los imports:

```typescript
type EmailLang = "es" | "en" | "fr" | "de" | "nl" | "it" | "ru";

interface EmailStrings {
  bookingConfirmed: string;
  greeting: string;
  bookingDetails: string;
  meetingPoint: string;
  meetingPointDesc: string;
  arriveEarly: string;
  contact: string;
  thanks: string;
  // Reminder
  reminderTitle: string;
  reminderSubtitle: string;
  tipsTitle: string;
  tips: string[];
  emergency: string;
  parking: string;
  parkingDesc: string;
  seeYouTomorrow: string;
  // Thank you
  thankYouTitle: string;
  thankYouIntro: string;
  reviewTitle: string;
  reviewDesc: string;
  reviewButton: string;
  discountTitle: string;
  discountDesc: string;
  discountFooter: string;
  bookAgain: string;
  seeYouSoon: string;
  // Table headers
  colBoat: string; colDate: string; colSchedule: string; colDuration: string;
  colPeople: string; colBase: string; colVat: string; colTotal: string;
  colHour: string; colHours: string;
}

const EMAIL_STRINGS: Record<EmailLang, EmailStrings> = {
  es: {
    bookingConfirmed: "Reserva confirmada",
    greeting: "Tu reserva ha sido confirmada. Aqui tienes los detalles:",
    bookingDetails: "Detalles de tu reserva",
    meetingPoint: "Punto de encuentro",
    meetingPointDesc: "Puerto de Blanes, Costa Brava, Girona",
    arriveEarly: "Presentate <strong>15 minutos antes</strong> de la hora de salida.",
    contact: "Contacto",
    thanks: "Gracias por confiar en nosotros. Nos vemos en el puerto.",
    reminderTitle: "Recordatorio: tu reserva es manana",
    reminderSubtitle: "Te recordamos que tu alquiler de barco es <strong>manana</strong>. Aqui tienes los detalles:",
    tipsTitle: "Consejos para tu experiencia",
    tips: ["Lleva proteccion solar y gafas de sol", "Viste ropa comoda y calzado que se pueda mojar", "Trae una toalla y ropa de repuesto", "Puedes traer comida y bebida a bordo", "Consulta la prevision meteorologica antes de salir"],
    emergency: "Numero de emergencia",
    parking: "Aparcamiento",
    parkingDesc: "Hay aparcamiento disponible cerca del puerto de Blanes. En temporada alta, recomendamos llegar con tiempo para encontrar plaza.",
    seeYouTomorrow: "Estamos deseando verte manana. Si tienes alguna pregunta, no dudes en contactarnos.",
    thankYouTitle: "Gracias por navegar con nosotros",
    thankYouIntro: "Esperamos que disfrutaras de tu experiencia a bordo",
    reviewTitle: "Tu opinion nos importa",
    reviewDesc: "Si disfrutaste de la experiencia, nos encantaria que compartieras tu opinion en Google.",
    reviewButton: "Dejar una resena en Google",
    discountTitle: "10% de descuento en tu proxima reserva",
    discountDesc: "Regalo exclusivo para ti",
    discountFooter: "Introduce este codigo al hacer tu proxima reserva en nuestra web.",
    bookAgain: "Reservar de nuevo",
    seeYouSoon: "Esperamos verte de nuevo pronto en la Costa Brava.",
    colBoat: "Barco", colDate: "Fecha", colSchedule: "Horario", colDuration: "Duracion",
    colPeople: "Personas", colBase: "Base imponible (sin IVA)", colVat: "IVA (21%)", colTotal: "Total (IVA incluido)",
    colHour: "hora", colHours: "horas",
  },
  en: {
    bookingConfirmed: "Booking confirmed",
    greeting: "Your booking has been confirmed. Here are the details:",
    bookingDetails: "Your booking details",
    meetingPoint: "Meeting point",
    meetingPointDesc: "Port of Blanes, Costa Brava, Girona",
    arriveEarly: "Please arrive <strong>15 minutes before</strong> departure.",
    contact: "Contact",
    thanks: "Thank you for choosing us. See you at the port.",
    reminderTitle: "Reminder: your booking is tomorrow",
    reminderSubtitle: "Just a reminder that your boat rental is <strong>tomorrow</strong>. Here are the details:",
    tipsTitle: "Tips for your experience",
    tips: ["Bring sunscreen and sunglasses", "Wear comfortable clothes and shoes that can get wet", "Bring a towel and a change of clothes", "You can bring food and drinks on board", "Check the weather forecast before you go"],
    emergency: "Emergency number",
    parking: "Parking",
    parkingDesc: "Parking is available near the port of Blanes. In high season we recommend arriving early to find a spot.",
    seeYouTomorrow: "We look forward to seeing you tomorrow. If you have any questions, don't hesitate to contact us.",
    thankYouTitle: "Thank you for sailing with us",
    thankYouIntro: "We hope you enjoyed your time on board",
    reviewTitle: "Your opinion matters to us",
    reviewDesc: "If you enjoyed the experience, we would love for you to share your review on Google.",
    reviewButton: "Leave a Google review",
    discountTitle: "10% off your next booking",
    discountDesc: "An exclusive gift for you",
    discountFooter: "Enter this code when making your next booking on our website.",
    bookAgain: "Book again",
    seeYouSoon: "We hope to see you again soon on the Costa Brava.",
    colBoat: "Boat", colDate: "Date", colSchedule: "Schedule", colDuration: "Duration",
    colPeople: "People", colBase: "Subtotal (excl. VAT)", colVat: "VAT (21%)", colTotal: "Total (incl. VAT)",
    colHour: "hour", colHours: "hours",
  },
  fr: {
    bookingConfirmed: "Réservation confirmée",
    greeting: "Votre réservation a été confirmée. Voici les détails :",
    bookingDetails: "Détails de votre réservation",
    meetingPoint: "Point de rendez-vous",
    meetingPointDesc: "Port de Blanes, Costa Brava, Gérone",
    arriveEarly: "Veuillez arriver <strong>15 minutes avant</strong> le départ.",
    contact: "Contact",
    thanks: "Merci de nous faire confiance. À bientôt au port.",
    reminderTitle: "Rappel : votre réservation est demain",
    reminderSubtitle: "Rappel : votre location de bateau est <strong>demain</strong>. Voici les détails :",
    tipsTitle: "Conseils pour votre expérience",
    tips: ["Apportez de la crème solaire et des lunettes de soleil", "Portez des vêtements confortables et des chaussures pouvant être mouillées", "Apportez une serviette et des vêtements de rechange", "Vous pouvez apporter de la nourriture et des boissons à bord", "Consultez les prévisions météo avant de partir"],
    emergency: "Numéro d'urgence",
    parking: "Stationnement",
    parkingDesc: "Un parking est disponible près du port de Blanes. En haute saison, nous recommandons d'arriver tôt.",
    seeYouTomorrow: "Nous avons hâte de vous voir demain. N'hésitez pas à nous contacter.",
    thankYouTitle: "Merci d'avoir navigué avec nous",
    thankYouIntro: "Nous espérons que vous avez apprécié votre expérience à bord",
    reviewTitle: "Votre avis nous importe",
    reviewDesc: "Si vous avez apprécié l'expérience, nous serions ravis que vous partagiez votre avis sur Google.",
    reviewButton: "Laisser un avis Google",
    discountTitle: "10% de réduction sur votre prochaine réservation",
    discountDesc: "Un cadeau exclusif pour vous",
    discountFooter: "Entrez ce code lors de votre prochaine réservation sur notre site.",
    bookAgain: "Réserver à nouveau",
    seeYouSoon: "Nous espérons vous revoir bientôt sur la Costa Brava.",
    colBoat: "Bateau", colDate: "Date", colSchedule: "Horaire", colDuration: "Durée",
    colPeople: "Personnes", colBase: "Base imposable (HT)", colVat: "TVA (21%)", colTotal: "Total (TTC)",
    colHour: "heure", colHours: "heures",
  },
  de: {
    bookingConfirmed: "Buchung bestätigt",
    greeting: "Ihre Buchung wurde bestätigt. Hier sind die Details:",
    bookingDetails: "Ihre Buchungsdetails",
    meetingPoint: "Treffpunkt",
    meetingPointDesc: "Hafen von Blanes, Costa Brava, Girona",
    arriveEarly: "Bitte erscheinen Sie <strong>15 Minuten vor</strong> der Abfahrt.",
    contact: "Kontakt",
    thanks: "Vielen Dank für Ihr Vertrauen. Wir sehen uns im Hafen.",
    reminderTitle: "Erinnerung: Ihre Buchung ist morgen",
    reminderSubtitle: "Erinnerung: Ihr Bootsverleih ist <strong>morgen</strong>. Hier sind die Details:",
    tipsTitle: "Tipps für Ihr Erlebnis",
    tips: ["Sonnenschutz und Sonnenbrille mitbringen", "Bequeme Kleidung und Schuhe tragen, die nass werden können", "Handtuch und Wechselkleidung mitnehmen", "Essen und Getränke sind an Bord erlaubt", "Wettervorhersage vor der Abfahrt prüfen"],
    emergency: "Notfallnummer",
    parking: "Parkmöglichkeiten",
    parkingDesc: "Parkplätze sind in der Nähe des Hafens von Blanes verfügbar. In der Hochsaison empfehlen wir früh anzukommen.",
    seeYouTomorrow: "Wir freuen uns darauf, Sie morgen zu sehen. Kontaktieren Sie uns jederzeit.",
    thankYouTitle: "Danke, dass Sie mit uns gefahren sind",
    thankYouIntro: "Wir hoffen, dass Sie Ihre Zeit an Bord genossen haben",
    reviewTitle: "Ihre Meinung ist uns wichtig",
    reviewDesc: "Wenn Sie das Erlebnis genossen haben, würden wir uns freuen, wenn Sie Ihre Bewertung auf Google teilen.",
    reviewButton: "Google-Bewertung hinterlassen",
    discountTitle: "10% Rabatt auf Ihre nächste Buchung",
    discountDesc: "Ein exklusives Geschenk für Sie",
    discountFooter: "Geben Sie diesen Code bei Ihrer nächsten Buchung auf unserer Website ein.",
    bookAgain: "Erneut buchen",
    seeYouSoon: "Wir hoffen, Sie bald wieder an der Costa Brava zu sehen.",
    colBoat: "Boot", colDate: "Datum", colSchedule: "Zeitplan", colDuration: "Dauer",
    colPeople: "Personen", colBase: "Nettobetrag (ohne MwSt)", colVat: "MwSt (21%)", colTotal: "Gesamt (inkl. MwSt)",
    colHour: "Stunde", colHours: "Stunden",
  },
  nl: {
    bookingConfirmed: "Boeking bevestigd",
    greeting: "Uw boeking is bevestigd. Hier zijn de details:",
    bookingDetails: "Uw boekingsdetails",
    meetingPoint: "Ontmoetingspunt",
    meetingPointDesc: "Haven van Blanes, Costa Brava, Girona",
    arriveEarly: "Kom <strong>15 minuten voor</strong> vertrek.",
    contact: "Contact",
    thanks: "Bedankt voor uw vertrouwen. Tot ziens in de haven.",
    reminderTitle: "Herinnering: uw boeking is morgen",
    reminderSubtitle: "Herinnering: uw boothuur is <strong>morgen</strong>.",
    tipsTitle: "Tips voor uw ervaring",
    tips: ["Neem zonnebrandcrème en een zonnebril mee", "Draag comfortabele kleding en schoenen die nat mogen worden", "Neem een handdoek en extra kleding mee", "Eten en drinken zijn aan boord toegestaan", "Controleer de weersvoorspelling voor vertrek"],
    emergency: "Noodnummer",
    parking: "Parkeren",
    parkingDesc: "Er is parkeergelegenheid bij de haven van Blanes. In het hoogseizoen raden wij aan vroeg aan te komen.",
    seeYouTomorrow: "We kijken ernaar uit u morgen te zien.",
    thankYouTitle: "Bedankt voor het varen met ons",
    thankYouIntro: "We hopen dat u heeft genoten van uw tijd aan boord",
    reviewTitle: "Uw mening is belangrijk voor ons",
    reviewDesc: "Als u de ervaring heeft genoten, zouden we het fijn vinden als u een review op Google achterlaat.",
    reviewButton: "Google-review achterlaten",
    discountTitle: "10% korting op uw volgende boeking",
    discountDesc: "Een exclusief cadeau voor u",
    discountFooter: "Voer deze code in bij uw volgende boeking op onze website.",
    bookAgain: "Opnieuw boeken",
    seeYouSoon: "We hopen u snel weer te zien aan de Costa Brava.",
    colBoat: "Boot", colDate: "Datum", colSchedule: "Tijdschema", colDuration: "Duur",
    colPeople: "Personen", colBase: "Subtotaal (excl. btw)", colVat: "btw (21%)", colTotal: "Totaal (incl. btw)",
    colHour: "uur", colHours: "uur",
  },
  it: {
    bookingConfirmed: "Prenotazione confermata",
    greeting: "La sua prenotazione è stata confermata. Ecco i dettagli:",
    bookingDetails: "Dettagli della sua prenotazione",
    meetingPoint: "Punto di incontro",
    meetingPointDesc: "Porto di Blanes, Costa Brava, Girona",
    arriveEarly: "Si presenti <strong>15 minuti prima</strong> della partenza.",
    contact: "Contatto",
    thanks: "Grazie per la sua fiducia. A presto in porto.",
    reminderTitle: "Promemoria: la sua prenotazione è domani",
    reminderSubtitle: "Promemoria: il noleggio barca è <strong>domani</strong>.",
    tipsTitle: "Consigli per la sua esperienza",
    tips: ["Portare crema solare e occhiali da sole", "Indossare abiti comodi e scarpe che possono bagnarsi", "Portare un asciugamano e vestiti di ricambio", "È possibile portare cibo e bevande a bordo", "Controllare le previsioni meteo prima di partire"],
    emergency: "Numero di emergenza",
    parking: "Parcheggio",
    parkingDesc: "Parcheggio disponibile vicino al porto di Blanes. In alta stagione si consiglia di arrivare presto.",
    seeYouTomorrow: "Non vediamo l'ora di vederla domani.",
    thankYouTitle: "Grazie per aver navigato con noi",
    thankYouIntro: "Speriamo che abbia apprezzato la sua esperienza a bordo",
    reviewTitle: "La sua opinione è importante per noi",
    reviewDesc: "Se ha apprezzato l'esperienza, ci farebbe piacere se condividesse la sua recensione su Google.",
    reviewButton: "Lascia una recensione su Google",
    discountTitle: "10% di sconto sulla prossima prenotazione",
    discountDesc: "Un regalo esclusivo per lei",
    discountFooter: "Inserisca questo codice alla prossima prenotazione sul nostro sito.",
    bookAgain: "Prenota di nuovo",
    seeYouSoon: "Speriamo di rivederla presto in Costa Brava.",
    colBoat: "Barca", colDate: "Data", colSchedule: "Orario", colDuration: "Durata",
    colPeople: "Persone", colBase: "Imponibile (IVA esclusa)", colVat: "IVA (21%)", colTotal: "Totale (IVA inclusa)",
    colHour: "ora", colHours: "ore",
  },
  ru: {
    bookingConfirmed: "Бронирование подтверждено",
    greeting: "Ваше бронирование подтверждено. Вот подробности:",
    bookingDetails: "Детали вашего бронирования",
    meetingPoint: "Место встречи",
    meetingPointDesc: "Порт Бланеса, Коста-Брава, Жирона",
    arriveEarly: "Пожалуйста, прибудьте <strong>за 15 минут</strong> до отплытия.",
    contact: "Контакты",
    thanks: "Спасибо за доверие. До встречи в порту.",
    reminderTitle: "Напоминание: ваше бронирование завтра",
    reminderSubtitle: "Напоминание: ваша аренда лодки <strong>завтра</strong>.",
    tipsTitle: "Советы для вашего отдыха",
    tips: ["Возьмите солнцезащитный крем и очки", "Оденьте удобную одежду и обувь, которая может намокнуть", "Возьмите полотенце и смену одежды", "На борт можно брать еду и напитки", "Проверьте прогноз погоды перед выездом"],
    emergency: "Номер экстренной связи",
    parking: "Парковка",
    parkingDesc: "Парковка доступна рядом с портом Бланеса. В высокий сезон рекомендуем приезжать заранее.",
    seeYouTomorrow: "С нетерпением ждём встречи завтра.",
    thankYouTitle: "Спасибо, что путешествовали с нами",
    thankYouIntro: "Надеемся, вам понравилось на борту",
    reviewTitle: "Ваше мнение важно для нас",
    reviewDesc: "Если вам понравилось, мы будем рады отзыву на Google.",
    reviewButton: "Оставить отзыв в Google",
    discountTitle: "Скидка 10% на следующее бронирование",
    discountDesc: "Эксклюзивный подарок для вас",
    discountFooter: "Введите этот код при следующем бронировании на нашем сайте.",
    bookAgain: "Забронировать снова",
    seeYouSoon: "Надеемся снова увидеть вас на Коста-Браве.",
    colBoat: "Лодка", colDate: "Дата", colSchedule: "Расписание", colDuration: "Длительность",
    colPeople: "Человек", colBase: "Сумма без НДС", colVat: "НДС (21%)", colTotal: "Итого (включая НДС)",
    colHour: "час", colHours: "часов",
  },
};

function getEmailStrings(language?: string | null): EmailStrings {
  const lang = (language || "es") as EmailLang;
  return EMAIL_STRINGS[lang] || EMAIL_STRINGS.es;
}
```

**Step 2: Actualizar `bookingDetailsTable` para usar strings traducidos**

La función `bookingDetailsTable` usa texto hardcodeado. Añadir parámetro `strings`:

```typescript
function bookingDetailsTable(data: BookingEmailData, strings: EmailStrings): string {
  const { booking, boat, extras } = data;
  // ... (misma lógica pero reemplazar literales)
  // Ejemplo: "Barco" → strings.colBoat, etc.
  // La tabla ya tiene las propiedades correctas
```

**Step 3: Actualizar `sendBookingConfirmation`, `sendBookingReminder`, `sendThankYouEmail`**

Cada función debe:
1. Leer `data.booking.language` para determinar el idioma
2. Obtener `const strings = getEmailStrings(data.booking.language)`
3. Usar `strings.bookingConfirmed` en el `subject`, `strings.greeting` en el body, etc.

Ejemplo para `sendBookingConfirmation`:

```typescript
export async function sendBookingConfirmation(data: BookingEmailData): Promise<EmailResult> {
  if (!initSendGrid()) { ... }

  const { booking } = data;
  if (!booking.customerEmail) { ... }

  const strings = getEmailStrings(booking.language);

  const content = `
    <h2 ...>${strings.bookingConfirmed}</h2>
    <p ...>
      ${strings.greeting.replace("Tu reserva", `${strings.greeting}`)}
      Hola ${booking.customerName},<br>
      ${strings.greeting}
    </p>
    ${bookingDetailsTable(data, strings)}
    ...
  `;

  await sgMail.send({
    ...
    subject: `${strings.bookingConfirmed} - ${data.boat.name} - ${formatDate(booking.startTime)}`,
    ...
  });
```

**Step 4: Commit**
```bash
git add server/services/emailService.ts
git commit -m "feat(email): multilingual templates for confirmation, reminder and thank-you (ES/EN/FR/DE/NL/IT/RU)"
```

---

## Task 7: WhatsApp de confirmación en idioma del cliente

**Files:**
- Modify: `server/routes/payments.ts` (función `trySendWhatsAppConfirmation`)

**Contexto:** El mensaje de confirmación por WhatsApp siempre se envía en español. Afecta a clientes FR, DE, NL, IT, EN.

**Step 1: Crear objeto de textos WhatsApp**

En `payments.ts`, añadir antes de la función `trySendWhatsAppConfirmation`:

```typescript
type WaLang = "es" | "en" | "fr" | "de" | "nl" | "it" | "ru";

const WA_CONFIRMATION: Record<WaLang, {
  greeting: string; confirmed: string; boat: string; date: string;
  time: string; duration: string; meetingPoint: string; arrive: string;
  questions: string;
}> = {
  es: { greeting: "Hola", confirmed: "Tu reserva ha sido confirmada.", boat: "Barco", date: "Fecha", time: "Hora de salida", duration: "Duracion", meetingPoint: "Punto de encuentro: Puerto de Blanes.", arrive: "Llega 15 minutos antes de la hora de salida.", questions: "Ante cualquier duda" },
  en: { greeting: "Hello", confirmed: "Your booking has been confirmed.", boat: "Boat", date: "Date", time: "Departure time", duration: "Duration", meetingPoint: "Meeting point: Port of Blanes.", arrive: "Please arrive 15 minutes before departure.", questions: "For any questions" },
  fr: { greeting: "Bonjour", confirmed: "Votre réservation a été confirmée.", boat: "Bateau", date: "Date", time: "Heure de départ", duration: "Durée", meetingPoint: "Point de rendez-vous : Port de Blanes.", arrive: "Veuillez arriver 15 minutes avant le départ.", questions: "Pour toute question" },
  de: { greeting: "Hallo", confirmed: "Ihre Buchung wurde bestätigt.", boat: "Boot", date: "Datum", time: "Abfahrtszeit", duration: "Dauer", meetingPoint: "Treffpunkt: Hafen von Blanes.", arrive: "Bitte erscheinen Sie 15 Minuten vor der Abfahrt.", questions: "Bei Fragen" },
  nl: { greeting: "Hallo", confirmed: "Uw boeking is bevestigd.", boat: "Boot", date: "Datum", time: "Vertrektijd", duration: "Duur", meetingPoint: "Ontmoetingspunt: Haven van Blanes.", arrive: "Kom 15 minuten voor vertrek.", questions: "Voor vragen" },
  it: { greeting: "Ciao", confirmed: "La sua prenotazione è stata confermata.", boat: "Barca", date: "Data", time: "Ora di partenza", duration: "Durata", meetingPoint: "Punto di incontro: Porto di Blanes.", arrive: "Si presenti 15 minuti prima della partenza.", questions: "Per qualsiasi domanda" },
  ru: { greeting: "Здравствуйте", confirmed: "Ваше бронирование подтверждено.", boat: "Лодка", date: "Дата", time: "Время отправления", duration: "Длительность", meetingPoint: "Место встречи: порт Бланеса.", arrive: "Прибудьте за 15 минут до отправления.", questions: "По вопросам" },
};
```

**Step 2: Usar idioma del booking en el mensaje**

```typescript
async function trySendWhatsAppConfirmation(booking: Booking, boat: Boat): Promise<void> {
  try {
    const { isTwilioConfigured, sendWhatsAppMessage } = await import("../whatsapp/twilioClient");
    if (!isTwilioConfigured() || !booking.customerPhone) return;

    const lang = ((booking as any).language || "es") as WaLang;
    const wa = WA_CONFIRMATION[lang] || WA_CONFIRMATION.es;

    const locale = lang === "es" ? "es-ES" : lang === "fr" ? "fr-FR" : lang === "de" ? "de-DE" : lang === "nl" ? "nl-NL" : lang === "it" ? "it-IT" : "en-GB";

    const date = booking.startTime.toLocaleDateString(locale, {
      weekday: "long", day: "numeric", month: "long",
      timeZone: "Europe/Madrid",
    });
    const time = booking.startTime.toLocaleTimeString(locale, {
      hour: "2-digit", minute: "2-digit",
      timeZone: "Europe/Madrid",
    });

    const message = [
      `${wa.greeting} ${booking.customerName}! ${wa.confirmed}`,
      ``,
      `${wa.boat}: ${boat.name}`,
      `${wa.date}: ${date}`,
      `${wa.time}: ${time}`,
      `${wa.duration}: ${booking.totalHours}h`,
      ``,
      wa.meetingPoint,
      wa.arrive,
      ``,
      `${wa.questions}: +34 611 500 372`,
      `Costa Brava Rent a Boat`,
    ].join("\n");

    await sendWhatsAppMessage(booking.customerPhone, message);
    await storage.updateBookingWhatsAppStatus(booking.id, true, undefined);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Payment] WhatsApp confirmation error for booking ${booking.id}:`, msg);
  }
}
```

**Step 3: Commit**
```bash
git add server/routes/payments.ts
git commit -m "feat(whatsapp): send booking confirmation in customer's language"
```

---

## Task 8: Texto RGPD vía sistema de traducciones

**Files:**
- Modify: `client/src/lib/translations.ts`
- Modify: `client/src/components/BookingFormDesktop.tsx`
- Modify: `client/src/components/BookingWizardMobile.tsx`

**Contexto:**
- `BookingFormDesktop.tsx:411-420` tiene texto RGPD hardcodeado en español.
- `BookingWizardMobile.tsx:975-984` tiene texto RGPD hardcodeado en español.

**Step 1: Añadir claves de RGPD a la interfaz `Translations` en `translations.ts`**

Localizar la sección `booking` en la interfaz (línea ~268):

```typescript
  booking: {
    // ... claves existentes ...
    gdprConsent: string;         // "He leído y acepto la {privacyPolicy} y los {termsAndConditions}"
    gdprPrivacyLink: string;     // "Política de Privacidad"
    gdprTermsLink: string;       // "Términos y Condiciones"
  };
```

**Step 2: Añadir los valores para todos los idiomas**

Hay 8 idiomas en `translations.ts`. Para cada entrada (líneas ~880 para ES, ~1460 EN, etc.) añadir al final del objeto `booking`:

```typescript
// ES (línea ~892, dentro de booking):
gdprConsent: 'He leído y acepto la {privacyPolicy} y los {termsAndConditions}',
gdprPrivacyLink: 'Política de Privacidad',
gdprTermsLink: 'Términos y Condiciones',

// EN:
gdprConsent: 'I have read and accept the {privacyPolicy} and the {termsAndConditions}',
gdprPrivacyLink: 'Privacy Policy',
gdprTermsLink: 'Terms and Conditions',

// FR:
gdprConsent: 'J\'ai lu et j\'accepte la {privacyPolicy} et les {termsAndConditions}',
gdprPrivacyLink: 'Politique de Confidentialité',
gdprTermsLink: 'Conditions Générales',

// DE:
gdprConsent: 'Ich habe gelesen und akzeptiere die {privacyPolicy} und die {termsAndConditions}',
gdprPrivacyLink: 'Datenschutzrichtlinie',
gdprTermsLink: 'Allgemeine Geschäftsbedingungen',

// NL:
gdprConsent: 'Ik heb de {privacyPolicy} en de {termsAndConditions} gelezen en ga akkoord',
gdprPrivacyLink: 'Privacybeleid',
gdprTermsLink: 'Algemene Voorwaarden',

// IT:
gdprConsent: 'Ho letto e accetto la {privacyPolicy} e i {termsAndConditions}',
gdprPrivacyLink: 'Politica sulla Privacy',
gdprTermsLink: 'Termini e Condizioni',

// RU:
gdprConsent: 'Я прочитал и принимаю {privacyPolicy} и {termsAndConditions}',
gdprPrivacyLink: 'Политику конфиденциальности',
gdprTermsLink: 'Условия использования',

// CA:
gdprConsent: 'He llegit i accepto la {privacyPolicy} i les {termsAndConditions}',
gdprPrivacyLink: 'Política de Privacitat',
gdprTermsLink: 'Termes i Condicions',
```

**Step 3: Usar las traducciones en `BookingFormDesktop.tsx`**

Reemplazar el bloque RGPD hardcodeado (líneas 401-421):

```tsx
{/* RGPD consent */}
<label className="flex items-start gap-3 cursor-pointer">
  <input
    type="checkbox"
    checked={privacyConsent}
    onChange={(e) => setPrivacyConsent(e.target.checked)}
    className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
    aria-required="true"
    id="desktop-privacy-consent"
  />
  <span className="text-xs text-gray-600">
    {t.booking.gdprConsent.split('{privacyPolicy}')[0]}
    <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">
      {t.booking.gdprPrivacyLink}
    </a>
    {t.booking.gdprConsent.split('{privacyPolicy}')[1].split('{termsAndConditions}')[0]}
    <a href="/terms-conditions" target="_blank" rel="noopener noreferrer" className="text-primary underline">
      {t.booking.gdprTermsLink}
    </a>
    {t.booking.gdprConsent.split('{termsAndConditions}')[1]}
  </span>
</label>
```

**Step 4: Usar las traducciones en `BookingWizardMobile.tsx`**

Localizar el bloque RGPD (línea ~965-984). Reemplazar el hardcoded español:

```tsx
{/* RGPD consent */}
<label className="flex items-start gap-2">
  <input
    type="checkbox"
    checked={privacyConsent}
    onChange={(e) => setPrivacyConsent(e.target.checked)}
    className="mt-0.5"
    id="wizard-privacy-consent"
  />
  <span className="text-xs text-gray-600" id="wizard-privacy-consent-label">
    {t.booking.gdprConsent.split('{privacyPolicy}')[0]}
    <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">
      {t.booking.gdprPrivacyLink}
    </a>
    {t.booking.gdprConsent.split('{privacyPolicy}')[1].split('{termsAndConditions}')[0]}
    <a href="/terms-conditions" target="_blank" rel="noopener noreferrer" className="text-primary underline">
      {t.booking.gdprTermsLink}
    </a>
    {t.booking.gdprConsent.split('{termsAndConditions}')[1]}
  </span>
</label>
```

**Step 5: Commit**
```bash
git add client/src/lib/translations.ts client/src/components/BookingFormDesktop.tsx client/src/components/BookingWizardMobile.tsx
git commit -m "feat(i18n): RGPD consent text via translation system in booking forms"
```

---

## Task 9: Etiqueta de temporada traducida en BookingFormWidget

**Files:**
- Modify: `client/src/components/BookingFormWidget.tsx`
- Modify: `client/src/lib/translations.ts`

**Contexto:** `getSeasonLabel()` (línea 492-497) devuelve "Alta (Agosto)" en español independientemente del idioma del usuario. El mensaje de WhatsApp también muestra la temporada en español para usuarios no-hispanos.

**Step 1: Añadir claves de temporada en la interfaz `Translations`**

En la interfaz, dentro de `booking`:

```typescript
  booking: {
    // ... claves existentes ...
    seasonHigh: string;   // "Alta (agosto)"
    seasonMid: string;    // "Media (julio)"
    seasonLow: string;    // "Baja (abr-jun, sep-oct)"
  };
```

**Step 2: Añadir valores para todos los idiomas**

```typescript
// ES:
seasonHigh: 'Alta (agosto)',
seasonMid: 'Media (julio)',
seasonLow: 'Baja (abr-jun, sep-oct)',

// EN:
seasonHigh: 'High (August)',
seasonMid: 'Mid (July)',
seasonLow: 'Low (Apr-Jun, Sep-Oct)',

// FR:
seasonHigh: 'Haute (août)',
seasonMid: 'Moyenne (juillet)',
seasonLow: 'Basse (avr-jun, sep-oct)',

// DE:
seasonHigh: 'Hochsaison (August)',
seasonMid: 'Mittelsaison (Juli)',
seasonLow: 'Nebensaison (Apr-Jun, Sep-Okt)',

// NL:
seasonHigh: 'Hoogseizoen (augustus)',
seasonMid: 'Middenseizoen (juli)',
seasonLow: 'Laagseizoen (apr-jun, sep-okt)',

// IT:
seasonHigh: 'Alta (agosto)',
seasonMid: 'Media (luglio)',
seasonLow: 'Bassa (apr-giu, set-ott)',

// RU:
seasonHigh: 'Высокий (август)',
seasonMid: 'Средний (июль)',
seasonLow: 'Низкий (апр-июн, сен-окт)',

// CA:
seasonHigh: 'Alta (agost)',
seasonMid: 'Mitja (juliol)',
seasonLow: 'Baixa (abr-jun, set-oct)',
```

**Step 3: Actualizar `getSeasonLabel()` en `BookingFormWidget.tsx`**

```typescript
  const getSeasonLabel = () => {
    const season = getCurrentSeason();
    if (season === "ALTA") return t.booking.seasonHigh;
    if (season === "MEDIA") return t.booking.seasonMid;
    return t.booking.seasonLow;
  };
```

**Step 4: Commit**
```bash
git add client/src/lib/translations.ts client/src/components/BookingFormWidget.tsx
git commit -m "feat(i18n): season labels translated in booking form (8 languages)"
```

---

## Task 10: Placeholders neutros en BookingWizardMobile

**Files:**
- Modify: `client/src/components/BookingWizardMobile.tsx`

**Contexto:** `BookingWizardMobile.tsx:572` usa `placeholder="Juan"` y `BookingWizardMobile.tsx:596` usa `placeholder="Garcia Lopez"` — nombres culturalmente específicos de España. Usuarios alemanes, franceses y rusos ven estos nombres como referencia.

**Step 1: Añadir claves de placeholder en translations**

En la interfaz, dentro de `wizard`:

```typescript
  wizard: {
    // ... claves existentes ...
    firstNamePlaceholder: string;   // "María"
    lastNamePlaceholder: string;    // "Apellidos"
    phonePlaceholder: string;       // "612 345 678"
    emailPlaceholder: string;       // "nombre@email.com"
  };
```

**Step 2: Añadir valores**

```typescript
// ES: firstNamePlaceholder: 'Nombre', lastNamePlaceholder: 'Apellidos'
// EN: firstNamePlaceholder: 'First name', lastNamePlaceholder: 'Last name'
// FR: firstNamePlaceholder: 'Prénom', lastNamePlaceholder: 'Nom de famille'
// DE: firstNamePlaceholder: 'Vorname', lastNamePlaceholder: 'Nachname'
// NL: firstNamePlaceholder: 'Voornaam', lastNamePlaceholder: 'Achternaam'
// IT: firstNamePlaceholder: 'Nome', lastNamePlaceholder: 'Cognome'
// RU: firstNamePlaceholder: 'Имя', lastNamePlaceholder: 'Фамилия'
// CA: firstNamePlaceholder: 'Nom', lastNamePlaceholder: 'Cognoms'
```

**Step 3: Sustituir en BookingWizardMobile.tsx**

```tsx
// Antes (línea 572):
placeholder="Juan"
// Después:
placeholder={t.wizard.firstNamePlaceholder}

// Antes (línea 596):
placeholder="Garcia Lopez"
// Después:
placeholder={t.wizard.lastNamePlaceholder}
```

**Step 4: Verificar que el formulario desktop usa `t.wizard.firstName` / `t.wizard.lastName`** (ya lo hace según el grep anterior — OK).

**Step 5: Commit**
```bash
git add client/src/lib/translations.ts client/src/components/BookingWizardMobile.tsx
git commit -m "fix(i18n): replace culturally-specific name placeholders with neutral translations"
```

---

## Verificación final de Semana 1

```bash
npm run check   # TypeScript sin errores
npm run dev     # App arranca, booking form visible, RGPD en idioma correcto
```

Probar manualmente:
1. Cambiar idioma a EN → verificar RGPD en inglés, placeholders en inglés, temporada en inglés
2. Cambiar idioma a DE → mismo check
3. Webhook WhatsApp: sin `TWILIO_AUTH_TOKEN` pasa; con clave inválida devuelve 403

---

## Semanas siguientes

Los planes de Semana 2, 3 y 4 se crearán como archivos separados cuando se complete Semana 1:
- `docs/plans/2026-03-02-semana-2-experience.md`
- `docs/plans/2026-03-02-semana-3-growth.md`
- `docs/plans/2026-03-02-semana-4-quality.md`
