import sgMail from "@sendgrid/mail";
import type { Booking, Boat, BookingExtra } from "@shared/schema";

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
  reminderTitle: string;
  reminderSubtitle: string;
  tipsTitle: string;
  tips: string[];
  emergency: string;
  parking: string;
  parkingDesc: string;
  seeYouTomorrow: string;
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
  colBoat: string; colDate: string; colSchedule: string; colDuration: string;
  colPeople: string; colBase: string; colVat: string; colTotal: string;
  colHour: string; colHours: string;
  phone: string;
  emergencyCall: string;
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
    phone: "Teléfono",
    emergencyCall: "En caso de incidencia, llámanos al",
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
    phone: "Phone",
    emergencyCall: "In case of emergency, call us at",
  },
  fr: {
    bookingConfirmed: "Reservation confirmee",
    greeting: "Votre reservation a ete confirmee. Voici les details :",
    bookingDetails: "Details de votre reservation",
    meetingPoint: "Point de rendez-vous",
    meetingPointDesc: "Port de Blanes, Costa Brava, Gerone",
    arriveEarly: "Veuillez arriver <strong>15 minutes avant</strong> le depart.",
    contact: "Contact",
    thanks: "Merci de nous faire confiance. A bientot au port.",
    reminderTitle: "Rappel : votre reservation est demain",
    reminderSubtitle: "Rappel : votre location de bateau est <strong>demain</strong>. Voici les details :",
    tipsTitle: "Conseils pour votre experience",
    tips: ["Apportez de la creme solaire et des lunettes de soleil", "Portez des vetements confortables et des chaussures pouvant etre mouillees", "Apportez une serviette et des vetements de rechange", "Vous pouvez apporter de la nourriture et des boissons a bord", "Consultez les previsions meteo avant de partir"],
    emergency: "Numero d'urgence",
    parking: "Stationnement",
    parkingDesc: "Un parking est disponible pres du port de Blanes. En haute saison, nous recommandons d'arriver tot.",
    seeYouTomorrow: "Nous avons hate de vous voir demain. N'hesitez pas a nous contacter.",
    thankYouTitle: "Merci d'avoir navigue avec nous",
    thankYouIntro: "Nous esperons que vous avez apprecie votre experience a bord",
    reviewTitle: "Votre avis nous importe",
    reviewDesc: "Si vous avez apprecie l'experience, nous serions ravis que vous partagiez votre avis sur Google.",
    reviewButton: "Laisser un avis Google",
    discountTitle: "10% de reduction sur votre prochaine reservation",
    discountDesc: "Un cadeau exclusif pour vous",
    discountFooter: "Entrez ce code lors de votre prochaine reservation sur notre site.",
    bookAgain: "Reserver a nouveau",
    seeYouSoon: "Nous esperons vous revoir bientot sur la Costa Brava.",
    colBoat: "Bateau", colDate: "Date", colSchedule: "Horaire", colDuration: "Duree",
    colPeople: "Personnes", colBase: "Base imposable (HT)", colVat: "TVA (21%)", colTotal: "Total (TTC)",
    colHour: "heure", colHours: "heures",
    phone: "Téléphone",
    emergencyCall: "En cas d'incident, appelez-nous au",
  },
  de: {
    bookingConfirmed: "Buchung bestatigt",
    greeting: "Ihre Buchung wurde bestatigt. Hier sind die Details:",
    bookingDetails: "Ihre Buchungsdetails",
    meetingPoint: "Treffpunkt",
    meetingPointDesc: "Hafen von Blanes, Costa Brava, Girona",
    arriveEarly: "Bitte erscheinen Sie <strong>15 Minuten vor</strong> der Abfahrt.",
    contact: "Kontakt",
    thanks: "Vielen Dank fur Ihr Vertrauen. Wir sehen uns im Hafen.",
    reminderTitle: "Erinnerung: Ihre Buchung ist morgen",
    reminderSubtitle: "Erinnerung: Ihr Bootsverleih ist <strong>morgen</strong>. Hier sind die Details:",
    tipsTitle: "Tipps fur Ihr Erlebnis",
    tips: ["Sonnenschutz und Sonnenbrille mitbringen", "Bequeme Kleidung und Schuhe tragen, die nass werden konnen", "Handtuch und Wechselkleidung mitnehmen", "Essen und Getranke sind an Bord erlaubt", "Wettervorhersage vor der Abfahrt prufen"],
    emergency: "Notfallnummer",
    parking: "Parkmoglichkeiten",
    parkingDesc: "Parkplatze sind in der Nahe des Hafens von Blanes verfugbar. In der Hochsaison empfehlen wir fruh anzukommen.",
    seeYouTomorrow: "Wir freuen uns darauf, Sie morgen zu sehen. Kontaktieren Sie uns jederzeit.",
    thankYouTitle: "Danke, dass Sie mit uns gefahren sind",
    thankYouIntro: "Wir hoffen, dass Sie Ihre Zeit an Bord genossen haben",
    reviewTitle: "Ihre Meinung ist uns wichtig",
    reviewDesc: "Wenn Sie das Erlebnis genossen haben, wurden wir uns freuen, wenn Sie Ihre Bewertung auf Google teilen.",
    reviewButton: "Google-Bewertung hinterlassen",
    discountTitle: "10% Rabatt auf Ihre nachste Buchung",
    discountDesc: "Ein exklusives Geschenk fur Sie",
    discountFooter: "Geben Sie diesen Code bei Ihrer nachsten Buchung auf unserer Website ein.",
    bookAgain: "Erneut buchen",
    seeYouSoon: "Wir hoffen, Sie bald wieder an der Costa Brava zu sehen.",
    colBoat: "Boot", colDate: "Datum", colSchedule: "Zeitplan", colDuration: "Dauer",
    colPeople: "Personen", colBase: "Nettobetrag (ohne MwSt)", colVat: "MwSt (21%)", colTotal: "Gesamt (inkl. MwSt)",
    colHour: "Stunde", colHours: "Stunden",
    phone: "Telefon",
    emergencyCall: "Im Notfall rufen Sie uns an",
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
    tips: ["Neem zonnebrandcreme en een zonnebril mee", "Draag comfortabele kleding en schoenen die nat mogen worden", "Neem een handdoek en extra kleding mee", "Eten en drinken zijn aan boord toegestaan", "Controleer de weersvoorspelling voor vertrek"],
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
    phone: "Telefoon",
    emergencyCall: "In geval van een incident, bel ons op",
  },
  it: {
    bookingConfirmed: "Prenotazione confermata",
    greeting: "La sua prenotazione e stata confermata. Ecco i dettagli:",
    bookingDetails: "Dettagli della sua prenotazione",
    meetingPoint: "Punto di incontro",
    meetingPointDesc: "Porto di Blanes, Costa Brava, Girona",
    arriveEarly: "Si presenti <strong>15 minuti prima</strong> della partenza.",
    contact: "Contatto",
    thanks: "Grazie per la sua fiducia. A presto in porto.",
    reminderTitle: "Promemoria: la sua prenotazione e domani",
    reminderSubtitle: "Promemoria: il noleggio barca e <strong>domani</strong>.",
    tipsTitle: "Consigli per la sua esperienza",
    tips: ["Portare crema solare e occhiali da sole", "Indossare abiti comodi e scarpe che possono bagnarsi", "Portare un asciugamano e vestiti di ricambio", "E possibile portare cibo e bevande a bordo", "Controllare le previsioni meteo prima di partire"],
    emergency: "Numero di emergenza",
    parking: "Parcheggio",
    parkingDesc: "Parcheggio disponibile vicino al porto di Blanes. In alta stagione si consiglia di arrivare presto.",
    seeYouTomorrow: "Non vediamo l'ora di vederla domani.",
    thankYouTitle: "Grazie per aver navigato con noi",
    thankYouIntro: "Speriamo che abbia apprezzato la sua esperienza a bordo",
    reviewTitle: "La sua opinione e importante per noi",
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
    phone: "Telefono",
    emergencyCall: "In caso di incidente, chiamateci al",
  },
  ru: {
    bookingConfirmed: "Bronirovanie podtverzhdeno",
    greeting: "Vashe bronirovanie podtverzhdeno. Vot podrobnosti:",
    bookingDetails: "Detali vashego bronirovaniya",
    meetingPoint: "Mesto vstrechi",
    meetingPointDesc: "Port Blanesa, Kosta-Brava, Zhirona",
    arriveEarly: "Pozhaluysta, pribudte <strong>za 15 minut</strong> do otplytiya.",
    contact: "Kontakty",
    thanks: "Spasibo za doverie. Do vstrechi v portu.",
    reminderTitle: "Napominanie: vashe bronirovanie zavtra",
    reminderSubtitle: "Napominanie: vasha arenda lodki <strong>zavtra</strong>.",
    tipsTitle: "Sovety dlya vashego otdykha",
    tips: ["Vozmite solntsezashchitny krem i ochki", "Odente udobnuyu odezhdu i obuv, kotoraya mozhet namoknut", "Vozmite polotentse i smenu odezhdy", "Na bort mozhno brat edu i napitki", "Proverte prognoz pogody pered vyezdom"],
    emergency: "Nomer ekstrennoy svyazi",
    parking: "Parkovka",
    parkingDesc: "Parkovka dostupna ryadom s portom Blanesa. V vysokiy sezon rekomenduem priezhat zaranee.",
    seeYouTomorrow: "S neterpeniyem zhdem vstrechi zavtra.",
    thankYouTitle: "Spasibo, chto puteshestvovali s nami",
    thankYouIntro: "Nadeemsya, vam ponravilos na bortu",
    reviewTitle: "Vashe mnenie vazhno dlya nas",
    reviewDesc: "Yesli vam ponravilos, my budem rady otzuvu na Google.",
    reviewButton: "Ostavit otzuv v Google",
    discountTitle: "Skidka 10% na sleduyushchee bronirovanie",
    discountDesc: "Eksklyuzivnyy podarok dlya vas",
    discountFooter: "Vvedite etot kod pri sleduyushchem bronirovanii na nashem sayte.",
    bookAgain: "Zabronirovat snova",
    seeYouSoon: "Nadeemsya snova uvidet vas na Kosta-Brave.",
    colBoat: "Lodka", colDate: "Data", colSchedule: "Raspisanie", colDuration: "Dlitelnost",
    colPeople: "Chelovek", colBase: "Summa bez NDS", colVat: "NDS (21%)", colTotal: "Itogo (vklyuchaya NDS)",
    colHour: "chas", colHours: "chasov",
    phone: "Телефон",
    emergencyCall: "В случае инцидента позвоните нам по номеру",
  },
};

function getEmailStrings(language?: string | null): EmailStrings {
  const lang = (language || "es") as EmailLang;
  return EMAIL_STRINGS[lang] || EMAIL_STRINGS.es;
}

// Lazy initialization for SendGrid
let initialized = false;

function initSendGrid(): boolean {
  if (!initialized && process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    initialized = true;
  }
  return initialized;
}

function getFromEmail(): string {
  return process.env.SENDGRID_FROM_EMAIL || "costabravarentboat@gmail.com";
}

interface EmailResult {
  success: boolean;
  error?: string;
}

// Booking data enriched with boat info and extras for email templates
interface BookingEmailData {
  booking: Booking;
  boat: Boat;
  extras: BookingExtra[];
}

// ===== HTML EMAIL TEMPLATE HELPERS =====

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f7fa; font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding:28px 32px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700; letter-spacing:0.5px;">Costa Brava Rent a Boat</h1>
              <p style="margin:6px 0 0; color:#93c5fd; font-size:14px;">Puerto de Blanes, Costa Brava</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc; padding:24px 32px; border-top:1px solid #e2e8f0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0 0 8px; color:#475569; font-size:14px; font-weight:600;">Costa Brava Rent a Boat</p>
                    <p style="margin:0 0 4px; color:#64748b; font-size:13px;">Puerto de Blanes, Girona, Costa Brava</p>
                    <p style="margin:0 0 4px; color:#64748b; font-size:13px;">Tel: <a href="tel:+34611500372" style="color:#2563eb; text-decoration:none;">+34 611 500 372</a></p>
                    <p style="margin:0 0 12px; color:#64748b; font-size:13px;">Email: <a href="mailto:costabravarentboat@gmail.com" style="color:#2563eb; text-decoration:none;">costabravarentboat@gmail.com</a></p>
                    <p style="margin:0; color:#94a3b8; font-size:11px;">www.costabravarentaboat.app</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });
}

function bookingDetailsTable(data: BookingEmailData, strings: EmailStrings): string {
  const { booking, boat, extras } = data;

  const extrasHtml = extras.length > 0
    ? extras.map(e => `<tr>
        <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9;">Extra: ${e.extraName}</td>
        <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9; text-align:right;">${parseFloat(e.extraPrice).toFixed(2)} EUR</td>
      </tr>`).join("")
    : "";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border-radius:8px; overflow:hidden; margin:16px 0;">
    <tr>
      <td style="padding:10px 12px; color:#1e3a5f; font-size:14px; font-weight:600; border-bottom:1px solid #e2e8f0; background-color:#eff6ff;">${strings.colBoat}</td>
      <td style="padding:10px 12px; color:#1e3a5f; font-size:14px; font-weight:600; border-bottom:1px solid #e2e8f0; background-color:#eff6ff; text-align:right;">${boat.name}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9;">${strings.colDate}</td>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9; text-align:right;">${formatDate(booking.startTime)}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9;">${strings.colSchedule}</td>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9; text-align:right;">${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9;">${strings.colDuration}</td>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9; text-align:right;">${booking.totalHours} ${booking.totalHours > 1 ? strings.colHours : strings.colHour}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9;">${strings.colPeople}</td>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9; text-align:right;">${booking.numberOfPeople}</td>
    </tr>
    ${extrasHtml}
    <tr>
      <td style="padding:8px 12px; color:#475569; font-size:13px; border-bottom:1px solid #f1f5f9;">${strings.colBase}</td>
      <td style="padding:8px 12px; color:#475569; font-size:13px; border-bottom:1px solid #f1f5f9; text-align:right;">${(parseFloat(booking.totalAmount) / 1.21).toFixed(2)} EUR</td>
    </tr>
    <tr>
      <td style="padding:8px 12px; color:#475569; font-size:13px; border-bottom:1px solid #e2e8f0;">${strings.colVat}</td>
      <td style="padding:8px 12px; color:#475569; font-size:13px; border-bottom:1px solid #e2e8f0; text-align:right;">${(parseFloat(booking.totalAmount) - parseFloat(booking.totalAmount) / 1.21).toFixed(2)} EUR</td>
    </tr>
    <tr>
      <td style="padding:10px 12px; color:#1e3a5f; font-size:15px; font-weight:700; border-top:2px solid #2563eb;">${strings.colTotal}</td>
      <td style="padding:10px 12px; color:#1e3a5f; font-size:15px; font-weight:700; border-top:2px solid #2563eb; text-align:right;">${parseFloat(booking.totalAmount).toFixed(2)} EUR</td>
    </tr>
  </table>`;
}

// ===== EMAIL SENDING FUNCTIONS =====

/**
 * Send booking confirmation email after a booking is confirmed.
 */
export async function sendBookingConfirmation(data: BookingEmailData): Promise<EmailResult> {
  if (!initSendGrid()) {
    console.log("[Email] SendGrid not configured, skipping booking confirmation email");
    return { success: false, error: "SendGrid not configured" };
  }

  const { booking } = data;

  if (!booking.customerEmail) {
    return { success: false, error: "No customer email address" };
  }

  const strings = getEmailStrings(booking.language);

  const content = `
    <h2 style="margin:0 0 8px; color:#1e3a5f; font-size:20px;">${strings.bookingConfirmed}</h2>
    <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
      ${booking.customerName},<br>
      ${strings.greeting}
    </p>

    ${bookingDetailsTable(data, strings)}

    <div style="background-color:#eff6ff; border-left:4px solid #2563eb; border-radius:4px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 6px; color:#1e3a5f; font-size:14px; font-weight:600;">${strings.meetingPoint}</p>
      <p style="margin:0; color:#475569; font-size:14px;">${strings.meetingPointDesc}</p>
      <p style="margin:8px 0 0; color:#475569; font-size:13px;">${strings.arriveEarly}</p>
    </div>

    <div style="background-color:#f0fdf4; border-left:4px solid #22c55e; border-radius:4px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 6px; color:#166534; font-size:14px; font-weight:600;">${strings.contact}</p>
      <p style="margin:0; color:#475569; font-size:14px;">${strings.phone}: <a href="tel:+34611500372" style="color:#2563eb;">+34 611 500 372</a></p>
      <p style="margin:4px 0 0; color:#475569; font-size:14px;">Email: <a href="mailto:costabravarentboat@gmail.com" style="color:#2563eb;">costabravarentboat@gmail.com</a></p>
    </div>

    <p style="margin:20px 0 0; color:#475569; font-size:14px; line-height:1.5;">
      ${strings.thanks}
    </p>
  `;

  try {
    await sgMail.send({
      to: booking.customerEmail,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      subject: `${strings.bookingConfirmed} - ${data.boat.name} - ${formatDate(booking.startTime)}`,
      html: emailWrapper(content),
    });

    console.log(`[Email] Booking confirmation sent to ${booking.customerEmail} for booking ${booking.id}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Email] Error sending booking confirmation to ${booking.customerEmail}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Send booking reminder email 24h before the rental.
 */
export async function sendBookingReminder(data: BookingEmailData): Promise<EmailResult> {
  if (!initSendGrid()) {
    console.log("[Email] SendGrid not configured, skipping booking reminder email");
    return { success: false, error: "SendGrid not configured" };
  }

  const { booking } = data;

  if (!booking.customerEmail) {
    return { success: false, error: "No customer email address" };
  }

  const strings = getEmailStrings(booking.language);

  const content = `
    <h2 style="margin:0 0 8px; color:#1e3a5f; font-size:20px;">${strings.reminderTitle}</h2>
    <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
      ${booking.customerName},<br>
      ${strings.reminderSubtitle}
    </p>

    ${bookingDetailsTable(data, strings)}

    <div style="background-color:#eff6ff; border-left:4px solid #2563eb; border-radius:4px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 6px; color:#1e3a5f; font-size:14px; font-weight:600;">${strings.meetingPoint}</p>
      <p style="margin:0; color:#475569; font-size:14px;">${strings.meetingPointDesc}</p>
      <p style="margin:8px 0 0; color:#475569; font-size:13px;">${strings.arriveEarly}</p>
    </div>

    <div style="background-color:#fefce8; border-left:4px solid #eab308; border-radius:4px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 8px; color:#854d0e; font-size:14px; font-weight:600;">${strings.tipsTitle}</p>
      <ul style="margin:0; padding:0 0 0 18px; color:#475569; font-size:14px; line-height:1.8;">
        ${strings.tips.map(tip => `<li>${tip}</li>`).join("")}
      </ul>
    </div>

    <div style="background-color:#fef2f2; border-left:4px solid #ef4444; border-radius:4px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 6px; color:#991b1b; font-size:14px; font-weight:600;">${strings.emergency}</p>
      <p style="margin:0; color:#475569; font-size:14px;">${strings.emergencyCall}: <a href="tel:+34611500372" style="color:#2563eb; font-weight:600;">+34 611 500 372</a></p>
    </div>

    <div style="background-color:#f0fdf4; border-left:4px solid #22c55e; border-radius:4px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 6px; color:#166534; font-size:14px; font-weight:600;">${strings.parking}</p>
      <p style="margin:0; color:#475569; font-size:14px;">${strings.parkingDesc}</p>
    </div>

    <p style="margin:20px 0 0; color:#475569; font-size:14px; line-height:1.5;">
      ${strings.seeYouTomorrow}
    </p>
  `;

  try {
    await sgMail.send({
      to: booking.customerEmail,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      subject: `${strings.reminderTitle} - ${data.boat.name}`,
      html: emailWrapper(content),
    });

    console.log(`[Email] Booking reminder sent to ${booking.customerEmail} for booking ${booking.id}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Email] Error sending booking reminder to ${booking.customerEmail}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Send thank-you email 24h after the rental with Google Review link and discount code.
 * @param discountCode - The actual discount code stored in the database
 */
export async function sendThankYouEmail(data: BookingEmailData, discountCode: string): Promise<EmailResult> {
  if (!initSendGrid()) {
    console.log("[Email] SendGrid not configured, skipping thank-you email");
    return { success: false, error: "SendGrid not configured" };
  }

  const { booking } = data;

  if (!booking.customerEmail) {
    return { success: false, error: "No customer email address" };
  }

  const strings = getEmailStrings(booking.language);
  const googleReviewUrl = "https://search.google.com/local/writereview?placeid=ChIJrTRWOdA0uxIR_vCCNfbFNpE";

  const content = `
    <h2 style="margin:0 0 8px; color:#1e3a5f; font-size:20px;">${strings.thankYouTitle}</h2>
    <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
      ${booking.customerName},<br>
      ${strings.thankYouIntro} <strong>${data.boat.name}</strong>.
    </p>

    <!-- Google Review CTA -->
    <div style="background-color:#eff6ff; border-radius:8px; padding:24px; margin:20px 0; text-align:center;">
      <p style="margin:0 0 8px; color:#1e3a5f; font-size:16px; font-weight:600;">${strings.reviewTitle}</p>
      <p style="margin:0 0 16px; color:#475569; font-size:14px; line-height:1.5;">
        ${strings.reviewDesc}
      </p>
      <a href="${googleReviewUrl}" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:6px; font-size:15px; font-weight:600;">${strings.reviewButton}</a>
    </div>

    <!-- Discount Code -->
    <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); border-radius:8px; padding:24px; margin:20px 0; text-align:center;">
      <p style="margin:0 0 4px; color:#93c5fd; font-size:13px; text-transform:uppercase; letter-spacing:1px;">${strings.discountDesc}</p>
      <p style="margin:0 0 12px; color:#ffffff; font-size:18px; font-weight:700;">${strings.discountTitle}</p>
      <div style="background-color:rgba(255,255,255,0.15); border:2px dashed rgba(255,255,255,0.4); border-radius:6px; padding:12px; display:inline-block;">
        <span style="color:#ffffff; font-size:20px; font-weight:700; letter-spacing:2px;">${discountCode}</span>
      </div>
      <p style="margin:12px 0 0; color:#bfdbfe; font-size:12px;">${strings.discountFooter}</p>
    </div>

    <div style="text-align:center; margin:24px 0;">
      <a href="https://costabravarentaboat.app" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:6px; font-size:15px; font-weight:600;">${strings.bookAgain}</a>
    </div>

    <p style="margin:20px 0 0; color:#475569; font-size:14px; line-height:1.5; text-align:center;">
      ${strings.seeYouSoon}
    </p>
  `;

  try {
    await sgMail.send({
      to: booking.customerEmail,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      subject: `${strings.thankYouTitle}, ${booking.customerName}!`,
      html: emailWrapper(content),
    });

    console.log(`[Email] Thank-you email sent to ${booking.customerEmail} for booking ${booking.id} (discount: ${discountCode})`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Email] Error sending thank-you email to ${booking.customerEmail}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Send pre-season promotional email with a discount code.
 */
export async function sendPreSeasonEmail(
  customerEmail: string,
  customerName: string,
  discountCode: string
): Promise<EmailResult> {
  if (!initSendGrid()) {
    console.log("[Email] SendGrid not configured, skipping pre-season email");
    return { success: false, error: "SendGrid not configured" };
  }

  const content = `
    <h2 style="margin:0 0 8px; color:#1e3a5f; font-size:20px;">La temporada empieza en abril</h2>
    <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
      Hola ${customerName},<br>
      La Costa Brava te espera. La nueva temporada de alquiler de barcos comienza en abril
      y queremos que seas de los primeros en disfrutarla.
    </p>

    <div style="background-color:#eff6ff; border-radius:8px; padding:24px; margin:20px 0; text-align:center;">
      <p style="margin:0 0 12px; color:#1e3a5f; font-size:16px; font-weight:600;">Reserva con descuento exclusivo</p>
      <p style="margin:0 0 16px; color:#475569; font-size:14px; line-height:1.5;">
        Como cliente habitual, tienes un <strong>10% de descuento</strong> en tu proxima reserva.
      </p>
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); border-radius:6px; padding:16px; display:inline-block;">
        <span style="color:#ffffff; font-size:20px; font-weight:700; letter-spacing:2px;">${discountCode}</span>
      </div>
    </div>

    <div style="text-align:center; margin:24px 0;">
      <a href="https://costabravarentaboat.app" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:6px; font-size:16px; font-weight:600;">Reservar ahora</a>
    </div>

    <p style="margin:20px 0 0; color:#475569; font-size:14px; line-height:1.5; text-align:center;">
      No pierdas la oportunidad de vivir una experiencia unica en el Mediterraneo.
    </p>
  `;

  try {
    await sgMail.send({
      to: customerEmail,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      subject: "La temporada empieza pronto - 10% descuento para ti",
      html: emailWrapper(content),
    });

    console.log(`[Email] Pre-season email sent to ${customerEmail}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Email] Error sending pre-season email to ${customerEmail}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Send welcome email after new SaaS tenant registration.
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  companyName: string,
  trialEndsAt: Date
): Promise<EmailResult> {
  if (!initSendGrid()) {
    console.log("[Email] SendGrid not configured, skipping welcome email");
    return { success: false, error: "SendGrid not configured" };
  }

  const trialEnd = trialEndsAt.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  const safeName = firstName?.trim() || "usuario";

  const content = `
    <h2 style="margin:0 0 8px; color:#1e3a5f; font-size:20px;">Bienvenido/a a NauticFlow</h2>
    <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
      Hola ${safeName},<br>
      Tu cuenta para <strong>${companyName}</strong> ha sido creada correctamente. Empieza a gestionar tu flota desde el panel de administracion.
    </p>

    <div style="background-color:#eff6ff; border-left:4px solid #2563eb; border-radius:4px; padding:16px; margin:0 0 20px;">
      <p style="margin:0 0 6px; color:#1e3a5f; font-size:14px; font-weight:600;">Periodo de prueba gratuito</p>
      <p style="margin:0; color:#475569; font-size:14px; line-height:1.6;">
        Tienes acceso completo hasta el <strong>${trialEnd}</strong>. Sin tarjeta de credito requerida.
      </p>
    </div>

    <div style="text-align:center; margin:24px 0;">
      <a href="https://costabravarentaboat.app/crm" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:6px; font-size:15px; font-weight:600;">Ir a mi panel</a>
    </div>

    <p style="margin:0; color:#64748b; font-size:13px; line-height:1.6;">
      Si tienes cualquier duda, respondenos a este email o contactanos por WhatsApp.
    </p>
  `;

  try {
    await sgMail.send({
      to: email,
      from: { email: getFromEmail(), name: "NauticFlow" },
      subject: `Bienvenido/a a NauticFlow — Tu prueba gratuita ha comenzado`,
      html: emailWrapper(content),
    });

    console.log(`[Email] Welcome email sent to ${email}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Email] Error sending welcome email to ${email}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Send password reset email for SaaS authentication.
 */
export async function sendPasswordResetEmail(
  email: string,
  customerName: string,
  resetUrl: string
): Promise<EmailResult> {
  if (!initSendGrid()) {
    console.log("[Email] SendGrid not configured, skipping password reset email");
    return { success: false, error: "SendGrid not configured" };
  }

  const safeName = customerName?.trim() || "cliente";

  const content = `
    <h2 style="margin:0 0 8px; color:#1e3a5f; font-size:20px;">Restablecer contrasena</h2>
    <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
      Hola ${safeName},<br>
      Hemos recibido una solicitud para restablecer la contrasena de tu cuenta.
    </p>

    <div style="background-color:#eff6ff; border-left:4px solid #2563eb; border-radius:4px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 10px; color:#1e3a5f; font-size:14px; font-weight:600;">Accion requerida</p>
      <p style="margin:0; color:#475569; font-size:14px; line-height:1.6;">
        Haz clic en el siguiente boton para crear una nueva contrasena.
        Este enlace caduca en <strong>1 hora</strong>.
      </p>
    </div>

    <div style="text-align:center; margin:24px 0;">
      <a href="${resetUrl}" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:6px; font-size:15px; font-weight:600;">Restablecer contrasena</a>
    </div>

    <p style="margin:0; color:#64748b; font-size:13px; line-height:1.6;">
      Si no solicitaste este cambio, puedes ignorar este email. Tu contrasena actual seguira siendo valida.
    </p>
  `;

  try {
    await sgMail.send({
      to: email,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      subject: "Restablece tu contrasena",
      html: emailWrapper(content),
    });

    console.log(`[Email] Password reset email sent to ${email}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Email] Error sending password reset email to ${email}:`, message);
    return { success: false, error: message };
  }
}

// ===== CANCELATION EMAIL =====

interface CancelationEmailData {
  booking: Booking;
  refundAmount: number;
  refundPercentage: number;
}

/**
 * Send cancelation confirmation email to customer and notification to owner.
 */
export async function sendCancelationEmail(data: CancelationEmailData): Promise<EmailResult> {
  if (!data.booking.customerEmail) {
    return { success: false, error: "No customer email" };
  }

  if (!initSendGrid()) {
    console.log("[Email] SendGrid not configured, skipping cancelation email");
    return { success: false, error: "SendGrid not configured" };
  }

  const { booking, refundAmount, refundPercentage } = data;
  const appUrl = process.env.APP_URL || "https://costabravarentaboat.app";

  const refundBlock = refundAmount > 0
    ? `<p style="color:#16a34a; font-weight:bold;">Reembolso: ${refundAmount.toFixed(2)} EUR (${refundPercentage}%) — se procesará en los próximos días hábiles.</p>`
    : `<p style="color:#dc2626;">Sin reembolso según política de cancelación (menos de 24h de antelación).</p>`;

  const customerContent = `
    <h2 style="margin:0 0 16px; color:#1e3a5f; font-size:22px;">Reserva cancelada</h2>
    <p style="color:#475569; font-size:15px; margin:0 0 16px;">
      Hola ${booking.customerName}, hemos procesado la cancelación de tu reserva.
    </p>
    ${refundBlock}
    <p style="color:#64748b; font-size:13px; margin-top:24px;">
      Si tienes dudas, contactanos en <a href="mailto:costabravarentboat@gmail.com" style="color:#2563eb;">costabravarentboat@gmail.com</a> o al +34 611 500 372.
    </p>
    <p style="margin-top:16px;"><a href="${appUrl}" style="color:#2563eb; text-decoration:none;">Volver a costabravarentaboat.app</a></p>
  `;

  try {
    await sgMail.send({
      to: booking.customerEmail!,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      subject: `Cancelación confirmada — ${booking.customerName}`,
      html: emailWrapper(customerContent),
    });

    console.log(`[Email] Cancelation email sent to ${booking.customerEmail} for booking ${booking.id}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Email] Error sending cancelation email to ${booking.customerEmail}:`, message);
    return { success: false, error: message };
  }

  // Owner notification (fire-and-forget)
  const ownerEmail = process.env.OWNER_EMAIL || "costabravarentboat@gmail.com";
  const ownerContent = `
    <h2 style="color:#dc2626;">Cancelación de reserva</h2>
    <p>Cliente: <strong>${booking.customerName} ${booking.customerSurname}</strong></p>
    <p>Email: ${booking.customerEmail}</p>
    <p>Teléfono: ${booking.customerPhone}</p>
    <p>Fecha: ${new Date(booking.startTime).toLocaleDateString("es-ES")}</p>
    <p>Total: ${booking.totalAmount} EUR</p>
    ${refundAmount > 0 ? `<p style="color:#dc2626;">Reembolso a procesar: ${refundAmount.toFixed(2)} EUR (${refundPercentage}%)</p>` : "<p>Sin reembolso.</p>"}
  `;

  sgMail.send({
    to: ownerEmail,
    from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
    subject: `[CANCELACIÓN] ${booking.customerName} — ${new Date(booking.startTime).toLocaleDateString("es-ES")}`,
    html: emailWrapper(ownerContent),
  }).catch((err: unknown) => {
    console.error("[Email] Error sending cancelation owner notification:", err instanceof Error ? err.message : String(err));
  });

  return { success: true };
}
