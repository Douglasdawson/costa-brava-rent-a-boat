// WhatsApp Chatbot Translations - ES, EN, FR, CA, DE, NL, IT, RU

export type SupportedLanguage = "es" | "en" | "fr" | "ca" | "de" | "nl" | "it" | "ru";

export interface ChatbotTranslations {
  // Welcome & Menu
  welcome: string;
  welcomeBack: string;
  mainMenuTitle: string;
  mainMenuOptions: string[];
  unknownCommand: string;
  backToMenu: string;

  // Boats
  ourBoats: string;
  boatListHeader: string;
  boatDetails: string;
  selectBoatPrompt: string;
  noLicenseRequired: string;
  licenseRequired: string;
  capacity: string;
  fromPrice: string;
  boatNotFound: string;

  // Availability
  checkAvailabilityTitle: string;
  enterDatePrompt: string;
  invalidDateFormat: string;
  outOfSeason: string;
  availabilityResult: string;
  available: string;
  occupied: string;
  selectBoatForAvailability: string;
  noBoatsAvailable: string;
  allBoatsAvailable: string;

  // Booking Flow
  startBookingTitle: string;
  bookingDatePrompt: string;
  bookingBoatPrompt: string;
  bookingTimePrompt: string;
  bookingDurationPrompt: string;
  bookingPeoplePrompt: string;
  bookingExtrasPrompt: string;
  bookingContactNamePrompt: string;
  bookingContactEmailPrompt: string;
  bookingConfirmTitle: string;
  bookingConfirmDetails: string;
  bookingConfirmPrompt: string;
  bookingCreated: string;
  bookingNotification: string;
  bookingFailed: string;
  invalidPeopleCount: string;
  capacityExceeded: string;

  // Extras
  extrasTitle: string;
  extrasList: string[];
  noExtras: string;
  extrasSelected: string;

  // Prices
  pricesTitle: string;
  seasonLow: string;
  seasonMid: string;
  seasonHigh: string;
  depositRequired: string;
  fuelIncluded: string;
  fuelNotIncluded: string;

  // Agent
  agentHandoff: string;
  agentNotified: string;

  // General
  yes: string;
  no: string;
  confirm: string;
  cancel: string;
  thanks: string;
  goodbye: string;
  error: string;
  invalidOption: string;
  typeMenuToReturn: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, ChatbotTranslations> = {
  es: {
    // Welcome & Menu
    welcome:
      "¡Hola! 👋 Bienvenido a *Costa Brava Rent a Boat*\n\nSomos especialistas en alquiler de barcos en Blanes. ¿En qué podemos ayudarte?",
    welcomeBack: "¡Hola de nuevo! 👋 ¿En qué podemos ayudarte?",
    mainMenuTitle: "📋 *Menú Principal*",
    mainMenuOptions: [
      "1️⃣ Ver nuestros barcos",
      "2️⃣ Consultar disponibilidad",
      "3️⃣ Ver precios",
      "4️⃣ Hacer una reserva",
      "5️⃣ Hablar con un agente",
    ],
    unknownCommand:
      "No he entendido tu mensaje. Escribe *menú* para ver las opciones disponibles.",
    backToMenu: "\n\n_Escribe *menú* para volver al inicio_",

    // Boats
    ourBoats: "🚤 *Nuestra Flota*",
    boatListHeader:
      "Disponemos de barcos con y sin licencia para disfrutar de la Costa Brava:",
    boatDetails: "📋 *Detalles del Barco*",
    selectBoatPrompt: "\n_Responde con el número del barco para más info_",
    noLicenseRequired: "Sin licencia",
    licenseRequired: "Requiere licencia",
    capacity: "personas",
    fromPrice: "desde",
    boatNotFound: "❌ Barco no encontrado. Por favor, selecciona una opción válida.",

    // Availability
    checkAvailabilityTitle: "📅 *Consultar Disponibilidad*",
    enterDatePrompt:
      "¿Para qué fecha quieres consultar?\n\n_Escribe la fecha en formato DD/MM/AAAA (ej: 15/07/2026)_",
    invalidDateFormat:
      "❌ Formato de fecha incorrecto. Por favor usa DD/MM/AAAA (ej: 15/07/2026)",
    outOfSeason:
      "⚠️ Esa fecha está fuera de temporada. Operamos de *abril a octubre*.",
    availabilityResult: "📅 *Disponibilidad para {date}*",
    available: "✅ Disponible",
    occupied: "❌ Ocupado",
    selectBoatForAvailability: "\n_Responde con el número para reservar_",
    noBoatsAvailable:
      "😔 Lo sentimos, no hay barcos disponibles para esa fecha.",
    allBoatsAvailable: "🎉 ¡Todos los barcos están disponibles!",

    // Booking Flow
    startBookingTitle: "🎯 *Nueva Reserva*",
    bookingDatePrompt:
      "¡Perfecto! Vamos a crear tu reserva.\n\n¿Para qué fecha? _DD/MM/AAAA_",
    bookingBoatPrompt: "¿Qué barco te gustaría reservar?\n\n",
    bookingTimePrompt:
      "¿A qué hora quieres empezar?\n\n1️⃣ 10:00\n2️⃣ 11:00\n3️⃣ 12:00\n4️⃣ 13:00\n5️⃣ 14:00\n6️⃣ 15:00\n7️⃣ 16:00",
    bookingDurationPrompt:
      "¿Cuántas horas?\n\n1️⃣ 1 hora\n2️⃣ 2 horas\n3️⃣ 3 horas\n4️⃣ 4 horas\n5️⃣ 6 horas\n6️⃣ 8 horas (día completo)",
    bookingPeoplePrompt:
      "¿Cuántas personas seréis? _(máximo {max} para este barco)_",
    bookingExtrasPrompt:
      "¿Quieres añadir algún extra?\n\n1️⃣ Parking (10€)\n2️⃣ Nevera (5€)\n3️⃣ Snorkel (7,50€)\n4️⃣ Paddle Surf (25€)\n5️⃣ Seascooter (50€)\n0️⃣ Sin extras\n\n_Puedes seleccionar varios separados por coma (ej: 1,3,4)_",
    bookingContactNamePrompt: "¿Cuál es tu nombre completo?",
    bookingContactEmailPrompt:
      "¿Tu email? _(para enviarte la confirmación)_",
    bookingConfirmTitle: "📋 *Resumen de tu Reserva*",
    bookingConfirmDetails:
      "🚤 *Barco:* {boat}\n📅 *Fecha:* {date}\n⏰ *Hora:* {time} - {endTime}\n👥 *Personas:* {people}\n🎒 *Extras:* {extras}\n\n💰 *Total:* {total}€ _(+ {deposit}€ fianza)_",
    bookingConfirmPrompt:
      "\n¿Enviamos la solicitud de reserva al equipo?\n\n1️⃣ Sí, enviar solicitud\n2️⃣ No, cancelar",
    bookingCreated:
      "✅ *¡Solicitud de reserva recibida!*\n\nIvan verificará la disponibilidad y se pondrá en contacto contigo para confirmar tu reserva.",
    bookingNotification:
      "Recibirás la confirmación por WhatsApp una vez que tu reserva sea verificada.",
    bookingFailed:
      "😔 Lo sentimos, no hemos podido crear tu reserva. Es posible que el horario ya no esté disponible. Por favor, inténtalo de nuevo o escribe *agente* para contactarnos.",
    invalidPeopleCount:
      "❌ Por favor, introduce un número válido de personas.",
    capacityExceeded:
      "❌ El número de personas ({people}) excede la capacidad del barco ({max}).",

    // Extras
    extrasTitle: "🎒 *Extras Disponibles*",
    extrasList: [
      "🅿️ Parking dentro del puerto - 10€",
      "❄️ Nevera - 5€",
      "🤿 Equipo snorkel - 7,50€",
      "🏄 Paddle Surf - 25€",
      "⚡ Seascooter - 50€",
    ],
    noExtras: "Sin extras",
    extrasSelected: "Extras seleccionados: {extras}",

    // Prices
    pricesTitle: "💰 *Precios {boat}*",
    seasonLow: "🌸 *Temporada Baja* (Abr-Jun, Sep-Oct)",
    seasonMid: "☀️ *Temporada Media* (Julio)",
    seasonHigh: "🔥 *Temporada Alta* (Agosto)",
    depositRequired: "💳 Fianza: {deposit}€",
    fuelIncluded: "⛽ Gasolina incluida",
    fuelNotIncluded: "⛽ Gasolina NO incluida",

    // Agent
    agentHandoff:
      "👤 *Conectando con un agente*\n\nUn miembro de nuestro equipo se pondrá en contacto contigo lo antes posible.",
    agentNotified:
      "✅ Hemos notificado a nuestro equipo. Te responderemos pronto.",

    // General
    yes: "Sí",
    no: "No",
    confirm: "Confirmar",
    cancel: "Cancelar",
    thanks: "¡Gracias por contactar con Costa Brava Rent a Boat! 🚤",
    goodbye: "¡Hasta pronto! Si necesitas algo más, escríbenos. 👋",
    error:
      "😔 Ha ocurrido un error. Por favor, inténtalo de nuevo o escribe *agente* para hablar con nosotros.",
    invalidOption: "❌ Opción no válida. Por favor, selecciona una de las opciones mostradas.",
    typeMenuToReturn: "_Escribe *menú* para volver al inicio_",
  },

  en: {
    // Welcome & Menu
    welcome:
      "Hello! 👋 Welcome to *Costa Brava Rent a Boat*\n\nWe specialize in boat rentals in Blanes. How can we help you?",
    welcomeBack: "Hello again! 👋 How can we help you?",
    mainMenuTitle: "📋 *Main Menu*",
    mainMenuOptions: [
      "1️⃣ See our boats",
      "2️⃣ Check availability",
      "3️⃣ View prices",
      "4️⃣ Make a reservation",
      "5️⃣ Talk to an agent",
    ],
    unknownCommand:
      "I didn't understand your message. Type *menu* to see available options.",
    backToMenu: "\n\n_Type *menu* to go back_",

    // Boats
    ourBoats: "🚤 *Our Fleet*",
    boatListHeader:
      "We have boats with and without license to enjoy the Costa Brava:",
    boatDetails: "📋 *Boat Details*",
    selectBoatPrompt: "\n_Reply with the boat number for more info_",
    noLicenseRequired: "No license required",
    licenseRequired: "License required",
    capacity: "people",
    fromPrice: "from",
    boatNotFound: "❌ Boat not found. Please select a valid option.",

    // Availability
    checkAvailabilityTitle: "📅 *Check Availability*",
    enterDatePrompt:
      "What date would you like to check?\n\n_Enter date as DD/MM/YYYY (e.g., 15/07/2026)_",
    invalidDateFormat:
      "❌ Invalid date format. Please use DD/MM/YYYY (e.g., 15/07/2026)",
    outOfSeason:
      "⚠️ That date is out of season. We operate from *April to October*.",
    availabilityResult: "📅 *Availability for {date}*",
    available: "✅ Available",
    occupied: "❌ Occupied",
    selectBoatForAvailability: "\n_Reply with the number to book_",
    noBoatsAvailable:
      "😔 Sorry, no boats are available for that date.",
    allBoatsAvailable: "🎉 All boats are available!",

    // Booking Flow
    startBookingTitle: "🎯 *New Reservation*",
    bookingDatePrompt:
      "Perfect! Let's create your booking.\n\nWhat date? _DD/MM/YYYY_",
    bookingBoatPrompt: "Which boat would you like to reserve?\n\n",
    bookingTimePrompt:
      "What time do you want to start?\n\n1️⃣ 10:00\n2️⃣ 11:00\n3️⃣ 12:00\n4️⃣ 13:00\n5️⃣ 14:00\n6️⃣ 15:00\n7️⃣ 16:00",
    bookingDurationPrompt:
      "How many hours?\n\n1️⃣ 1 hour\n2️⃣ 2 hours\n3️⃣ 3 hours\n4️⃣ 4 hours\n5️⃣ 6 hours\n6️⃣ 8 hours (full day)",
    bookingPeoplePrompt:
      "How many people? _(maximum {max} for this boat)_",
    bookingExtrasPrompt:
      "Would you like to add any extras?\n\n1️⃣ Parking (€10)\n2️⃣ Cooler (€5)\n3️⃣ Snorkel (€7.50)\n4️⃣ Paddle Surf (€25)\n5️⃣ Seascooter (€50)\n0️⃣ No extras\n\n_You can select multiple separated by comma (e.g., 1,3,4)_",
    bookingContactNamePrompt: "What is your full name?",
    bookingContactEmailPrompt:
      "Your email? _(for the confirmation)_",
    bookingConfirmTitle: "📋 *Booking Summary*",
    bookingConfirmDetails:
      "🚤 *Boat:* {boat}\n📅 *Date:* {date}\n⏰ *Time:* {time} - {endTime}\n👥 *People:* {people}\n🎒 *Extras:* {extras}\n\n💰 *Total:* €{total} _(+ €{deposit} deposit)_",
    bookingConfirmPrompt:
      "\nSend booking request to the team?\n\n1️⃣ Yes, send request\n2️⃣ No, cancel",
    bookingCreated:
      "✅ *Booking request received!*\n\nIvan will verify availability and contact you shortly to confirm your booking.",
    bookingNotification:
      "You'll receive confirmation via WhatsApp once your booking is verified.",
    bookingFailed:
      "😔 Sorry, we couldn't create your booking. The time slot may no longer be available. Please try again or type *agent* to contact us.",
    invalidPeopleCount:
      "❌ Please enter a valid number of people.",
    capacityExceeded:
      "❌ The number of people ({people}) exceeds the boat capacity ({max}).",

    // Extras
    extrasTitle: "🎒 *Available Extras*",
    extrasList: [
      "🅿️ Port parking - €10",
      "❄️ Cooler - €5",
      "🤿 Snorkel equipment - €7.50",
      "🏄 Paddle Surf - €25",
      "⚡ Seascooter - €50",
    ],
    noExtras: "No extras",
    extrasSelected: "Selected extras: {extras}",

    // Prices
    pricesTitle: "💰 *Prices {boat}*",
    seasonLow: "🌸 *Low Season* (Apr-Jun, Sep-Oct)",
    seasonMid: "☀️ *Mid Season* (July)",
    seasonHigh: "🔥 *High Season* (August)",
    depositRequired: "💳 Deposit: €{deposit}",
    fuelIncluded: "⛽ Fuel included",
    fuelNotIncluded: "⛽ Fuel NOT included",

    // Agent
    agentHandoff:
      "👤 *Connecting to an agent*\n\nA team member will contact you as soon as possible.",
    agentNotified:
      "✅ We've notified our team. We'll respond soon.",

    // General
    yes: "Yes",
    no: "No",
    confirm: "Confirm",
    cancel: "Cancel",
    thanks: "Thank you for contacting Costa Brava Rent a Boat! 🚤",
    goodbye: "See you soon! If you need anything else, write to us. 👋",
    error:
      "😔 An error occurred. Please try again or type *agent* to talk to us.",
    invalidOption: "❌ Invalid option. Please select one of the options shown.",
    typeMenuToReturn: "_Type *menu* to go back_",
  },

  fr: {
    // Welcome & Menu
    welcome:
      "Bonjour! 👋 Bienvenue chez *Costa Brava Rent a Boat*\n\nNous sommes spécialisés dans la location de bateaux à Blanes. Comment pouvons-nous vous aider?",
    welcomeBack: "Bonjour à nouveau! 👋 Comment pouvons-nous vous aider?",
    mainMenuTitle: "📋 *Menu Principal*",
    mainMenuOptions: [
      "1️⃣ Voir nos bateaux",
      "2️⃣ Vérifier disponibilité",
      "3️⃣ Voir les prix",
      "4️⃣ Faire une réservation",
      "5️⃣ Parler à un agent",
    ],
    unknownCommand:
      "Je n'ai pas compris votre message. Tapez *menu* pour voir les options disponibles.",
    backToMenu: "\n\n_Tapez *menu* pour revenir_",

    // Boats
    ourBoats: "🚤 *Notre Flotte*",
    boatListHeader:
      "Nous avons des bateaux avec et sans permis pour profiter de la Costa Brava:",
    boatDetails: "📋 *Détails du Bateau*",
    selectBoatPrompt: "\n_Répondez avec le numéro du bateau pour plus d'infos_",
    noLicenseRequired: "Sans permis",
    licenseRequired: "Permis requis",
    capacity: "personnes",
    fromPrice: "à partir de",
    boatNotFound: "❌ Bateau non trouvé. Veuillez sélectionner une option valide.",

    // Availability
    checkAvailabilityTitle: "📅 *Vérifier Disponibilité*",
    enterDatePrompt:
      "Pour quelle date souhaitez-vous vérifier?\n\n_Entrez la date au format JJ/MM/AAAA (ex: 15/07/2026)_",
    invalidDateFormat:
      "❌ Format de date incorrect. Utilisez JJ/MM/AAAA (ex: 15/07/2026)",
    outOfSeason:
      "⚠️ Cette date est hors saison. Nous opérons d'*avril à octobre*.",
    availabilityResult: "📅 *Disponibilité pour {date}*",
    available: "✅ Disponible",
    occupied: "❌ Occupé",
    selectBoatForAvailability: "\n_Répondez avec le numéro pour réserver_",
    noBoatsAvailable:
      "😔 Désolé, aucun bateau n'est disponible pour cette date.",
    allBoatsAvailable: "🎉 Tous les bateaux sont disponibles!",

    // Booking Flow
    startBookingTitle: "🎯 *Nouvelle Réservation*",
    bookingDatePrompt:
      "Parfait! Créons votre réservation.\n\nQuelle date? _JJ/MM/AAAA_",
    bookingBoatPrompt: "Quel bateau souhaitez-vous réserver?\n\n",
    bookingTimePrompt:
      "À quelle heure voulez-vous commencer?\n\n1️⃣ 10:00\n2️⃣ 11:00\n3️⃣ 12:00\n4️⃣ 13:00\n5️⃣ 14:00\n6️⃣ 15:00\n7️⃣ 16:00",
    bookingDurationPrompt:
      "Combien d'heures?\n\n1️⃣ 1 heure\n2️⃣ 2 heures\n3️⃣ 3 heures\n4️⃣ 4 heures\n5️⃣ 6 heures\n6️⃣ 8 heures (journée complète)",
    bookingPeoplePrompt:
      "Combien de personnes? _(maximum {max} pour ce bateau)_",
    bookingExtrasPrompt:
      "Souhaitez-vous ajouter des extras?\n\n1️⃣ Parking (10€)\n2️⃣ Glacière (5€)\n3️⃣ Snorkel (7,50€)\n4️⃣ Paddle Surf (25€)\n5️⃣ Seascooter (50€)\n0️⃣ Sans extras\n\n_Vous pouvez en sélectionner plusieurs séparés par virgule (ex: 1,3,4)_",
    bookingContactNamePrompt: "Quel est votre nom complet?",
    bookingContactEmailPrompt:
      "Votre email? _(pour la confirmation)_",
    bookingConfirmTitle: "📋 *Résumé de Réservation*",
    bookingConfirmDetails:
      "🚤 *Bateau:* {boat}\n📅 *Date:* {date}\n⏰ *Heure:* {time} - {endTime}\n👥 *Personnes:* {people}\n🎒 *Extras:* {extras}\n\n💰 *Total:* {total}€ _(+ {deposit}€ caution)_",
    bookingConfirmPrompt:
      "\nEnvoyer la demande de réservation à l'équipe?\n\n1️⃣ Oui, envoyer la demande\n2️⃣ Non, annuler",
    bookingCreated:
      "✅ *Demande de réservation reçue!*\n\nIvan vérifiera la disponibilité et vous contactera sous peu pour confirmer votre réservation.",
    bookingNotification:
      "Vous recevrez la confirmation par WhatsApp une fois votre réservation vérifiée.",
    bookingFailed:
      "😔 Désolé, nous n'avons pas pu créer votre réservation. Le créneau horaire n'est peut-être plus disponible. Veuillez réessayer ou tapez *agent* pour nous contacter.",
    invalidPeopleCount:
      "❌ Veuillez entrer un nombre valide de personnes.",
    capacityExceeded:
      "❌ Le nombre de personnes ({people}) dépasse la capacité du bateau ({max}).",

    // Extras
    extrasTitle: "🎒 *Extras Disponibles*",
    extrasList: [
      "🅿️ Parking au port - 10€",
      "❄️ Glacière - 5€",
      "🤿 Équipement snorkel - 7,50€",
      "🏄 Paddle Surf - 25€",
      "⚡ Seascooter - 50€",
    ],
    noExtras: "Sans extras",
    extrasSelected: "Extras sélectionnés: {extras}",

    // Prices
    pricesTitle: "💰 *Prix {boat}*",
    seasonLow: "🌸 *Basse Saison* (Avr-Juin, Sep-Oct)",
    seasonMid: "☀️ *Moyenne Saison* (Juillet)",
    seasonHigh: "🔥 *Haute Saison* (Août)",
    depositRequired: "💳 Caution: {deposit}€",
    fuelIncluded: "⛽ Carburant inclus",
    fuelNotIncluded: "⛽ Carburant NON inclus",

    // Agent
    agentHandoff:
      "👤 *Connexion à un agent*\n\nUn membre de notre équipe vous contactera dès que possible.",
    agentNotified:
      "✅ Nous avons notifié notre équipe. Nous vous répondrons bientôt.",

    // General
    yes: "Oui",
    no: "Non",
    confirm: "Confirmer",
    cancel: "Annuler",
    thanks: "Merci d'avoir contacté Costa Brava Rent a Boat! 🚤",
    goodbye: "À bientôt! Si vous avez besoin d'autre chose, écrivez-nous. 👋",
    error:
      "😔 Une erreur s'est produite. Veuillez réessayer ou tapez *agent* pour nous parler.",
    invalidOption: "❌ Option invalide. Veuillez sélectionner une des options affichées.",
    typeMenuToReturn: "_Tapez *menu* pour revenir_",
  },

  ca: {
    // Welcome & Menu
    welcome:
      "Hola! 👋 Benvingut a *Costa Brava Rent a Boat*\n\nSom especialistes en lloguer de vaixells a Blanes. En què podem ajudar-te?",
    welcomeBack: "Hola de nou! 👋 En què podem ajudar-te?",
    mainMenuTitle: "📋 *Menú Principal*",
    mainMenuOptions: [
      "1️⃣ Veure els nostres vaixells",
      "2️⃣ Consultar disponibilitat",
      "3️⃣ Veure preus",
      "4️⃣ Fer una reserva",
      "5️⃣ Parlar amb un agent",
    ],
    unknownCommand:
      "No he entès el teu missatge. Escriu *menú* per veure les opcions disponibles.",
    backToMenu: "\n\n_Escriu *menú* per tornar a l'inici_",

    // Boats
    ourBoats: "🚤 *La Nostra Flota*",
    boatListHeader:
      "Disposem de vaixells amb i sense llicència per gaudir de la Costa Brava:",
    boatDetails: "📋 *Detalls del Vaixell*",
    selectBoatPrompt: "\n_Respon amb el número del vaixell per més info_",
    noLicenseRequired: "Sense llicència",
    licenseRequired: "Requereix llicència",
    capacity: "persones",
    fromPrice: "des de",
    boatNotFound: "❌ Vaixell no trobat. Si us plau, selecciona una opció vàlida.",

    // Availability
    checkAvailabilityTitle: "📅 *Consultar Disponibilitat*",
    enterDatePrompt:
      "Per a quina data vols consultar?\n\n_Escriu la data en format DD/MM/AAAA (ex: 15/07/2026)_",
    invalidDateFormat:
      "❌ Format de data incorrecte. Si us plau utilitza DD/MM/AAAA (ex: 15/07/2026)",
    outOfSeason:
      "⚠️ Aquesta data és fora de temporada. Operem d'*abril a octubre*.",
    availabilityResult: "📅 *Disponibilitat per {date}*",
    available: "✅ Disponible",
    occupied: "❌ Ocupat",
    selectBoatForAvailability: "\n_Respon amb el número per reservar_",
    noBoatsAvailable:
      "😔 Ho sentim, no hi ha vaixells disponibles per a aquesta data.",
    allBoatsAvailable: "🎉 Tots els vaixells estan disponibles!",

    // Booking Flow
    startBookingTitle: "🎯 *Nova Reserva*",
    bookingDatePrompt:
      "Perfecte! Creem la teva reserva.\n\nPer a quina data? _DD/MM/AAAA_",
    bookingBoatPrompt: "Quin vaixell t'agradaria reservar?\n\n",
    bookingTimePrompt:
      "A quina hora vols començar?\n\n1️⃣ 10:00\n2️⃣ 11:00\n3️⃣ 12:00\n4️⃣ 13:00\n5️⃣ 14:00\n6️⃣ 15:00\n7️⃣ 16:00",
    bookingDurationPrompt:
      "Quantes hores?\n\n1️⃣ 1 hora\n2️⃣ 2 hores\n3️⃣ 3 hores\n4️⃣ 4 hores\n5️⃣ 6 hores\n6️⃣ 8 hores (dia complet)",
    bookingPeoplePrompt:
      "Quantes persones sereu? _(màxim {max} per aquest vaixell)_",
    bookingExtrasPrompt:
      "Vols afegir algun extra?\n\n1️⃣ Parking (10€)\n2️⃣ Nevera (5€)\n3️⃣ Snorkel (7,50€)\n4️⃣ Paddle Surf (25€)\n5️⃣ Seascooter (50€)\n0️⃣ Sense extras\n\n_Pots seleccionar diversos separats per coma (ex: 1,3,4)_",
    bookingContactNamePrompt: "Quin és el teu nom complet?",
    bookingContactEmailPrompt:
      "El teu email? _(per enviar-te la confirmació)_",
    bookingConfirmTitle: "📋 *Resum de la Reserva*",
    bookingConfirmDetails:
      "🚤 *Vaixell:* {boat}\n📅 *Data:* {date}\n⏰ *Hora:* {time} - {endTime}\n👥 *Persones:* {people}\n🎒 *Extras:* {extras}\n\n💰 *Total:* {total}€ _(+ {deposit}€ fiança)_",
    bookingConfirmPrompt:
      "\nEnviem la sol·licitud de reserva a l'equip?\n\n1️⃣ Sí, enviar sol·licitud\n2️⃣ No, cancel·lar",
    bookingCreated:
      "✅ *Sol·licitud de reserva rebuda!*\n\nIvan verificarà la disponibilitat i es posarà en contacte amb tu per confirmar la teva reserva.",
    bookingNotification:
      "Rebràs la confirmació per WhatsApp un cop la teva reserva sigui verificada.",
    bookingFailed:
      "😔 Ho sentim, no hem pogut crear la teva reserva. Es possible que l'horari ja no estigui disponible. Si us plau, torna-ho a provar o escriu *agent* per contactar-nos.",
    invalidPeopleCount:
      "❌ Si us plau, introdueix un número vàlid de persones.",
    capacityExceeded:
      "❌ El nombre de persones ({people}) excedeix la capacitat del vaixell ({max}).",

    // Extras
    extrasTitle: "🎒 *Extras Disponibles*",
    extrasList: [
      "🅿️ Parking dins del port - 10€",
      "❄️ Nevera - 5€",
      "🤿 Equip snorkel - 7,50€",
      "🏄 Paddle Surf - 25€",
      "⚡ Seascooter - 50€",
    ],
    noExtras: "Sense extras",
    extrasSelected: "Extras seleccionats: {extras}",

    // Prices
    pricesTitle: "💰 *Preus {boat}*",
    seasonLow: "🌸 *Temporada Baixa* (Abr-Jun, Sep-Oct)",
    seasonMid: "☀️ *Temporada Mitjana* (Juliol)",
    seasonHigh: "🔥 *Temporada Alta* (Agost)",
    depositRequired: "💳 Fiança: {deposit}€",
    fuelIncluded: "⛽ Gasolina inclosa",
    fuelNotIncluded: "⛽ Gasolina NO inclosa",

    // Agent
    agentHandoff:
      "👤 *Connectant amb un agent*\n\nUn membre del nostre equip es posarà en contacte amb tu el més aviat possible.",
    agentNotified:
      "✅ Hem notificat al nostre equip. Et respondrem aviat.",

    // General
    yes: "Sí",
    no: "No",
    confirm: "Confirmar",
    cancel: "Cancel·lar",
    thanks: "Gràcies per contactar amb Costa Brava Rent a Boat! 🚤",
    goodbye: "Fins aviat! Si necessites res més, escriu-nos. 👋",
    error:
      "😔 Hi ha hagut un error. Si us plau, torna-ho a provar o escriu *agent* per parlar amb nosaltres.",
    invalidOption: "❌ Opció no vàlida. Si us plau, selecciona una de les opcions mostrades.",
    typeMenuToReturn: "_Escriu *menú* per tornar a l'inici_",
  },

  de: {
    // Welcome & Menu
    welcome:
      "Hallo! 👋 Willkommen bei *Costa Brava Rent a Boat*\n\nWir sind Spezialisten für Bootsvermietung in Blanes. Wie können wir Ihnen helfen?",
    welcomeBack: "Hallo nochmal! 👋 Wie können wir Ihnen helfen?",
    mainMenuTitle: "📋 *Hauptmenü*",
    mainMenuOptions: [
      "1️⃣ Unsere Boote ansehen",
      "2️⃣ Verfügbarkeit prüfen",
      "3️⃣ Preise ansehen",
      "4️⃣ Eine Reservierung machen",
      "5️⃣ Mit einem Mitarbeiter sprechen",
    ],
    unknownCommand:
      "Ich habe Ihre Nachricht nicht verstanden. Schreiben Sie *Menü*, um die verfügbaren Optionen zu sehen.",
    backToMenu: "\n\n_Schreiben Sie *Menü*, um zurückzukehren_",

    // Boats
    ourBoats: "🚤 *Unsere Flotte*",
    boatListHeader:
      "Wir haben Boote mit und ohne Führerschein, um die Costa Brava zu genießen:",
    boatDetails: "📋 *Boot-Details*",
    selectBoatPrompt: "\n_Antworten Sie mit der Bootnummer für mehr Infos_",
    noLicenseRequired: "Ohne Bootsführerschein",
    licenseRequired: "Bootsführerschein erforderlich",
    capacity: "Personen",
    fromPrice: "ab",
    boatNotFound: "❌ Boot nicht gefunden. Bitte wählen Sie eine gültige Option.",

    // Availability
    checkAvailabilityTitle: "📅 *Verfügbarkeit prüfen*",
    enterDatePrompt:
      "Für welches Datum möchten Sie prüfen?\n\n_Geben Sie das Datum im Format TT/MM/JJJJ ein (z.B. 15/07/2026)_",
    invalidDateFormat:
      "❌ Ungültiges Datumsformat. Bitte verwenden Sie TT/MM/JJJJ (z.B. 15/07/2026)",
    outOfSeason:
      "⚠️ Dieses Datum liegt außerhalb der Saison. Wir sind von *April bis Oktober* geöffnet.",
    availabilityResult: "📅 *Verfügbarkeit für {date}*",
    available: "✅ Verfügbar",
    occupied: "❌ Belegt",
    selectBoatForAvailability: "\n_Antworten Sie mit der Nummer, um zu buchen_",
    noBoatsAvailable:
      "😔 Leider sind für dieses Datum keine Boote verfügbar.",
    allBoatsAvailable: "🎉 Alle Boote sind verfügbar!",

    // Booking Flow
    startBookingTitle: "🎯 *Neue Reservierung*",
    bookingDatePrompt:
      "Perfekt! Erstellen wir Ihre Buchung.\n\nWelches Datum? _TT/MM/JJJJ_",
    bookingBoatPrompt: "Welches Boot möchten Sie reservieren?\n\n",
    bookingTimePrompt:
      "Um welche Uhrzeit möchten Sie starten?\n\n1️⃣ 10:00\n2️⃣ 11:00\n3️⃣ 12:00\n4️⃣ 13:00\n5️⃣ 14:00\n6️⃣ 15:00\n7️⃣ 16:00",
    bookingDurationPrompt:
      "Wie viele Stunden?\n\n1️⃣ 1 Stunde\n2️⃣ 2 Stunden\n3️⃣ 3 Stunden\n4️⃣ 4 Stunden\n5️⃣ 6 Stunden\n6️⃣ 8 Stunden (ganzer Tag)",
    bookingPeoplePrompt:
      "Wie viele Personen? _(maximal {max} für dieses Boot)_",
    bookingExtrasPrompt:
      "Möchten Sie Extras hinzufügen?\n\n1️⃣ Parkplatz (10€)\n2️⃣ Kühlbox (5€)\n3️⃣ Schnorchel (7,50€)\n4️⃣ Paddle Surf (25€)\n5️⃣ Seascooter (50€)\n0️⃣ Keine Extras\n\n_Sie können mehrere durch Komma getrennt auswählen (z.B. 1,3,4)_",
    bookingContactNamePrompt: "Wie ist Ihr vollständiger Name?",
    bookingContactEmailPrompt:
      "Ihre E-Mail? _(für die Bestätigung)_",
    bookingConfirmTitle: "📋 *Buchungsübersicht*",
    bookingConfirmDetails:
      "🚤 *Boot:* {boat}\n📅 *Datum:* {date}\n⏰ *Uhrzeit:* {time} - {endTime}\n👥 *Personen:* {people}\n🎒 *Extras:* {extras}\n\n💰 *Gesamt:* {total}€ _(+ {deposit}€ Kaution)_",
    bookingConfirmPrompt:
      "\nBuchungsanfrage an das Team senden?\n\n1️⃣ Ja, Anfrage senden\n2️⃣ Nein, abbrechen",
    bookingCreated:
      "✅ *Buchungsanfrage erhalten!*\n\nIvan wird die Verfügbarkeit prüfen und sich in Kürze bei Ihnen melden, um Ihre Buchung zu bestätigen.",
    bookingNotification:
      "Sie erhalten eine Bestätigung per WhatsApp, sobald Ihre Buchung verifiziert wurde.",
    bookingFailed:
      "😔 Leider konnten wir Ihre Buchung nicht erstellen. Der Zeitraum ist möglicherweise nicht mehr verfügbar. Bitte versuchen Sie es erneut oder schreiben Sie *Mitarbeiter*, um mit uns zu sprechen.",
    invalidPeopleCount:
      "❌ Bitte geben Sie eine gültige Personenanzahl ein.",
    capacityExceeded:
      "❌ Die Personenanzahl ({people}) übersteigt die Kapazität des Bootes ({max}).",

    // Extras
    extrasTitle: "🎒 *Verfügbare Extras*",
    extrasList: [
      "🅿️ Parkplatz im Hafen - 10€",
      "❄️ Kühlbox - 5€",
      "🤿 Schnorchelausrüstung - 7,50€",
      "🏄 Paddle Surf - 25€",
      "⚡ Seascooter - 50€",
    ],
    noExtras: "Keine Extras",
    extrasSelected: "Ausgewählte Extras: {extras}",

    // Prices
    pricesTitle: "💰 *Preise {boat}*",
    seasonLow: "🌸 *Nebensaison* (Apr-Jun, Sep-Okt)",
    seasonMid: "☀️ *Zwischensaison* (Juli)",
    seasonHigh: "🔥 *Hochsaison* (August)",
    depositRequired: "💳 Kaution: {deposit}€",
    fuelIncluded: "⛽ Treibstoff inklusive",
    fuelNotIncluded: "⛽ Treibstoff NICHT inklusive",

    // Agent
    agentHandoff:
      "👤 *Verbindung mit einem Mitarbeiter*\n\nEin Teammitglied wird sich so schnell wie möglich bei Ihnen melden.",
    agentNotified:
      "✅ Wir haben unser Team benachrichtigt. Wir antworten Ihnen in Kürze.",

    // General
    yes: "Ja",
    no: "Nein",
    confirm: "Bestätigen",
    cancel: "Abbrechen",
    thanks: "Vielen Dank, dass Sie Costa Brava Rent a Boat kontaktiert haben! 🚤",
    goodbye: "Bis bald! Wenn Sie noch etwas brauchen, schreiben Sie uns. 👋",
    error:
      "😔 Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder schreiben Sie *Mitarbeiter*, um mit uns zu sprechen.",
    invalidOption: "❌ Ungültige Option. Bitte wählen Sie eine der angezeigten Optionen.",
    typeMenuToReturn: "_Schreiben Sie *Menü*, um zurückzukehren_",
  },

  nl: {
    // Welcome & Menu
    welcome:
      "Hallo! 👋 Welkom bij *Costa Brava Rent a Boat*\n\nWij zijn gespecialiseerd in bootverhuur in Blanes. Hoe kunnen we u helpen?",
    welcomeBack: "Hallo nogmaals! 👋 Hoe kunnen we u helpen?",
    mainMenuTitle: "📋 *Hoofdmenu*",
    mainMenuOptions: [
      "1️⃣ Onze boten bekijken",
      "2️⃣ Beschikbaarheid controleren",
      "3️⃣ Prijzen bekijken",
      "4️⃣ Een reservering maken",
      "5️⃣ Met een medewerker spreken",
    ],
    unknownCommand:
      "Ik heb uw bericht niet begrepen. Typ *menu* om de beschikbare opties te zien.",
    backToMenu: "\n\n_Typ *menu* om terug te gaan_",

    // Boats
    ourBoats: "🚤 *Onze Vloot*",
    boatListHeader:
      "We hebben boten met en zonder vaarbewijs om van de Costa Brava te genieten:",
    boatDetails: "📋 *Bootdetails*",
    selectBoatPrompt: "\n_Antwoord met het bootnummer voor meer info_",
    noLicenseRequired: "Geen vaarbewijs nodig",
    licenseRequired: "Vaarbewijs vereist",
    capacity: "personen",
    fromPrice: "vanaf",
    boatNotFound: "❌ Boot niet gevonden. Selecteer een geldige optie.",

    // Availability
    checkAvailabilityTitle: "📅 *Beschikbaarheid controleren*",
    enterDatePrompt:
      "Voor welke datum wilt u controleren?\n\n_Voer de datum in als DD/MM/JJJJ (bijv. 15/07/2026)_",
    invalidDateFormat:
      "❌ Ongeldig datumformaat. Gebruik DD/MM/JJJJ (bijv. 15/07/2026)",
    outOfSeason:
      "⚠️ Die datum valt buiten het seizoen. We zijn geopend van *april tot oktober*.",
    availabilityResult: "📅 *Beschikbaarheid voor {date}*",
    available: "✅ Beschikbaar",
    occupied: "❌ Bezet",
    selectBoatForAvailability: "\n_Antwoord met het nummer om te boeken_",
    noBoatsAvailable:
      "😔 Sorry, er zijn geen boten beschikbaar voor die datum.",
    allBoatsAvailable: "🎉 Alle boten zijn beschikbaar!",

    // Booking Flow
    startBookingTitle: "🎯 *Nieuwe Reservering*",
    bookingDatePrompt:
      "Perfect! Laten we uw boeking aanmaken.\n\nWelke datum? _DD/MM/JJJJ_",
    bookingBoatPrompt: "Welke boot wilt u reserveren?\n\n",
    bookingTimePrompt:
      "Hoe laat wilt u beginnen?\n\n1️⃣ 10:00\n2️⃣ 11:00\n3️⃣ 12:00\n4️⃣ 13:00\n5️⃣ 14:00\n6️⃣ 15:00\n7️⃣ 16:00",
    bookingDurationPrompt:
      "Hoeveel uur?\n\n1️⃣ 1 uur\n2️⃣ 2 uur\n3️⃣ 3 uur\n4️⃣ 4 uur\n5️⃣ 6 uur\n6️⃣ 8 uur (hele dag)",
    bookingPeoplePrompt:
      "Hoeveel personen? _(maximaal {max} voor deze boot)_",
    bookingExtrasPrompt:
      "Wilt u extra's toevoegen?\n\n1️⃣ Parkeerplaats (€10)\n2️⃣ Koelbox (€5)\n3️⃣ Snorkel (€7,50)\n4️⃣ Paddle Surf (€25)\n5️⃣ Seascooter (€50)\n0️⃣ Geen extra's\n\n_U kunt meerdere selecteren, gescheiden door een komma (bijv. 1,3,4)_",
    bookingContactNamePrompt: "Wat is uw volledige naam?",
    bookingContactEmailPrompt:
      "Uw e-mail? _(voor de bevestiging)_",
    bookingConfirmTitle: "📋 *Boekingsoverzicht*",
    bookingConfirmDetails:
      "🚤 *Boot:* {boat}\n📅 *Datum:* {date}\n⏰ *Tijd:* {time} - {endTime}\n👥 *Personen:* {people}\n🎒 *Extra's:* {extras}\n\n💰 *Totaal:* €{total} _(+ €{deposit} borg)_",
    bookingConfirmPrompt:
      "\nBoekingsaanvraag naar het team sturen?\n\n1️⃣ Ja, aanvraag versturen\n2️⃣ Nee, annuleren",
    bookingCreated:
      "✅ *Boekingsaanvraag ontvangen!*\n\nIvan zal de beschikbaarheid controleren en neemt binnenkort contact met u op om uw boeking te bevestigen.",
    bookingNotification:
      "U ontvangt een bevestiging via WhatsApp zodra uw boeking is geverifieerd.",
    bookingFailed:
      "😔 Sorry, we konden uw boeking niet aanmaken. Het tijdslot is mogelijk niet meer beschikbaar. Probeer het opnieuw of typ *medewerker* om met ons te spreken.",
    invalidPeopleCount:
      "❌ Voer een geldig aantal personen in.",
    capacityExceeded:
      "❌ Het aantal personen ({people}) overschrijdt de capaciteit van de boot ({max}).",

    // Extras
    extrasTitle: "🎒 *Beschikbare Extra's*",
    extrasList: [
      "🅿️ Parkeerplaats in de haven - €10",
      "❄️ Koelbox - €5",
      "🤿 Snorkeluitrusting - €7,50",
      "🏄 Paddle Surf - €25",
      "⚡ Seascooter - €50",
    ],
    noExtras: "Geen extra's",
    extrasSelected: "Geselecteerde extra's: {extras}",

    // Prices
    pricesTitle: "💰 *Prijzen {boat}*",
    seasonLow: "🌸 *Laagseizoen* (Apr-Jun, Sep-Okt)",
    seasonMid: "☀️ *Tussenseizoen* (Juli)",
    seasonHigh: "🔥 *Hoogseizoen* (Augustus)",
    depositRequired: "💳 Borg: €{deposit}",
    fuelIncluded: "⛽ Brandstof inbegrepen",
    fuelNotIncluded: "⛽ Brandstof NIET inbegrepen",

    // Agent
    agentHandoff:
      "👤 *Verbinding met een medewerker*\n\nEen teamlid neemt zo snel mogelijk contact met u op.",
    agentNotified:
      "✅ We hebben ons team op de hoogte gebracht. We reageren snel.",

    // General
    yes: "Ja",
    no: "Nee",
    confirm: "Bevestigen",
    cancel: "Annuleren",
    thanks: "Bedankt voor het contacteren van Costa Brava Rent a Boat! 🚤",
    goodbye: "Tot ziens! Als u nog iets nodig heeft, neem contact met ons op. 👋",
    error:
      "😔 Er is een fout opgetreden. Probeer het opnieuw of typ *medewerker* om met ons te spreken.",
    invalidOption: "❌ Ongeldige optie. Selecteer een van de getoonde opties.",
    typeMenuToReturn: "_Typ *menu* om terug te gaan_",
  },

  it: {
    // Welcome & Menu
    welcome:
      "Ciao! 👋 Benvenuto su *Costa Brava Rent a Boat*\n\nSiamo specialisti nel noleggio barche a Blanes. Come possiamo aiutarti?",
    welcomeBack: "Ciao di nuovo! 👋 Come possiamo aiutarti?",
    mainMenuTitle: "📋 *Menu Principale*",
    mainMenuOptions: [
      "1️⃣ Vedere le nostre barche",
      "2️⃣ Verificare la disponibilità",
      "3️⃣ Vedere i prezzi",
      "4️⃣ Fare una prenotazione",
      "5️⃣ Parlare con un operatore",
    ],
    unknownCommand:
      "Non ho capito il tuo messaggio. Scrivi *menu* per vedere le opzioni disponibili.",
    backToMenu: "\n\n_Scrivi *menu* per tornare all'inizio_",

    // Boats
    ourBoats: "🚤 *La Nostra Flotta*",
    boatListHeader:
      "Disponiamo di barche con e senza patente per godersi la Costa Brava:",
    boatDetails: "📋 *Dettagli della Barca*",
    selectBoatPrompt: "\n_Rispondi con il numero della barca per maggiori info_",
    noLicenseRequired: "Senza patente nautica",
    licenseRequired: "Patente nautica richiesta",
    capacity: "persone",
    fromPrice: "da",
    boatNotFound: "❌ Barca non trovata. Seleziona un'opzione valida.",

    // Availability
    checkAvailabilityTitle: "📅 *Verifica Disponibilità*",
    enterDatePrompt:
      "Per quale data vuoi verificare?\n\n_Inserisci la data nel formato GG/MM/AAAA (es. 15/07/2026)_",
    invalidDateFormat:
      "❌ Formato data non valido. Usa GG/MM/AAAA (es. 15/07/2026)",
    outOfSeason:
      "⚠️ Quella data è fuori stagione. Siamo operativi da *aprile a ottobre*.",
    availabilityResult: "📅 *Disponibilità per {date}*",
    available: "✅ Disponibile",
    occupied: "❌ Occupato",
    selectBoatForAvailability: "\n_Rispondi con il numero per prenotare_",
    noBoatsAvailable:
      "😔 Ci dispiace, non ci sono barche disponibili per quella data.",
    allBoatsAvailable: "🎉 Tutte le barche sono disponibili!",

    // Booking Flow
    startBookingTitle: "🎯 *Nuova Prenotazione*",
    bookingDatePrompt:
      "Perfetto! Creiamo la tua prenotazione.\n\nPer quale data? _GG/MM/AAAA_",
    bookingBoatPrompt: "Quale barca vorresti prenotare?\n\n",
    bookingTimePrompt:
      "A che ora vuoi iniziare?\n\n1️⃣ 10:00\n2️⃣ 11:00\n3️⃣ 12:00\n4️⃣ 13:00\n5️⃣ 14:00\n6️⃣ 15:00\n7️⃣ 16:00",
    bookingDurationPrompt:
      "Quante ore?\n\n1️⃣ 1 ora\n2️⃣ 2 ore\n3️⃣ 3 ore\n4️⃣ 4 ore\n5️⃣ 6 ore\n6️⃣ 8 ore (giornata intera)",
    bookingPeoplePrompt:
      "Quante persone sarete? _(massimo {max} per questa barca)_",
    bookingExtrasPrompt:
      "Vuoi aggiungere degli extra?\n\n1️⃣ Parcheggio (10€)\n2️⃣ Borsa frigo (5€)\n3️⃣ Snorkel (7,50€)\n4️⃣ Paddle Surf (25€)\n5️⃣ Seascooter (50€)\n0️⃣ Nessun extra\n\n_Puoi selezionare più opzioni separate da virgola (es. 1,3,4)_",
    bookingContactNamePrompt: "Qual è il tuo nome completo?",
    bookingContactEmailPrompt:
      "La tua email? _(per inviarti la conferma)_",
    bookingConfirmTitle: "📋 *Riepilogo Prenotazione*",
    bookingConfirmDetails:
      "🚤 *Barca:* {boat}\n📅 *Data:* {date}\n⏰ *Orario:* {time} - {endTime}\n👥 *Persone:* {people}\n🎒 *Extra:* {extras}\n\n💰 *Totale:* {total}€ _(+ {deposit}€ cauzione)_",
    bookingConfirmPrompt:
      "\nInviare la richiesta di prenotazione al team?\n\n1️⃣ Sì, invia richiesta\n2️⃣ No, annulla",
    bookingCreated:
      "✅ *Richiesta di prenotazione ricevuta!*\n\nIvan verificherà la disponibilità e ti contatterà a breve per confermare la tua prenotazione.",
    bookingNotification:
      "Riceverai una conferma via WhatsApp non appena la tua prenotazione sarà verificata.",
    bookingFailed:
      "😔 Ci dispiace, non siamo riusciti a creare la tua prenotazione. La fascia oraria potrebbe non essere più disponibile. Riprova o scrivi *operatore* per parlare con noi.",
    invalidPeopleCount:
      "❌ Inserisci un numero valido di persone.",
    capacityExceeded:
      "❌ Il numero di persone ({people}) supera la capacità della barca ({max}).",

    // Extras
    extrasTitle: "🎒 *Extra Disponibili*",
    extrasList: [
      "🅿️ Parcheggio nel porto - 10€",
      "❄️ Borsa frigo - 5€",
      "🤿 Attrezzatura snorkel - 7,50€",
      "🏄 Paddle Surf - 25€",
      "⚡ Seascooter - 50€",
    ],
    noExtras: "Nessun extra",
    extrasSelected: "Extra selezionati: {extras}",

    // Prices
    pricesTitle: "💰 *Prezzi {boat}*",
    seasonLow: "🌸 *Bassa Stagione* (Apr-Giu, Set-Ott)",
    seasonMid: "☀️ *Media Stagione* (Luglio)",
    seasonHigh: "🔥 *Alta Stagione* (Agosto)",
    depositRequired: "💳 Cauzione: {deposit}€",
    fuelIncluded: "⛽ Carburante incluso",
    fuelNotIncluded: "⛽ Carburante NON incluso",

    // Agent
    agentHandoff:
      "👤 *Connessione con un operatore*\n\nUn membro del nostro team ti contatterà il prima possibile.",
    agentNotified:
      "✅ Abbiamo avvisato il nostro team. Ti risponderemo presto.",

    // General
    yes: "Sì",
    no: "No",
    confirm: "Conferma",
    cancel: "Annulla",
    thanks: "Grazie per aver contattato Costa Brava Rent a Boat! 🚤",
    goodbye: "A presto! Se hai bisogno di altro, scrivici. 👋",
    error:
      "😔 Si è verificato un errore. Riprova o scrivi *operatore* per parlare con noi.",
    invalidOption: "❌ Opzione non valida. Seleziona una delle opzioni mostrate.",
    typeMenuToReturn: "_Scrivi *menu* per tornare all'inizio_",
  },

  ru: {
    // Welcome & Menu
    welcome:
      "Здравствуйте! 👋 Добро пожаловать в *Costa Brava Rent a Boat*\n\nМы специализируемся на аренде лодок в Бланесе. Чем можем помочь?",
    welcomeBack: "Здравствуйте снова! 👋 Чем можем помочь?",
    mainMenuTitle: "📋 *Главное меню*",
    mainMenuOptions: [
      "1️⃣ Посмотреть наши лодки",
      "2️⃣ Проверить доступность",
      "3️⃣ Посмотреть цены",
      "4️⃣ Сделать бронирование",
      "5️⃣ Связаться с оператором",
    ],
    unknownCommand:
      "Я не понял ваше сообщение. Напишите *меню*, чтобы увидеть доступные опции.",
    backToMenu: "\n\n_Напишите *меню*, чтобы вернуться_",

    // Boats
    ourBoats: "🚤 *Наш флот*",
    boatListHeader:
      "У нас есть лодки с лицензией и без для отдыха на Коста Браве:",
    boatDetails: "📋 *Детали лодки*",
    selectBoatPrompt: "\n_Ответьте номером лодки для подробностей_",
    noLicenseRequired: "Без лицензии",
    licenseRequired: "Требуется лицензия",
    capacity: "человек",
    fromPrice: "от",
    boatNotFound: "❌ Лодка не найдена. Пожалуйста, выберите правильный вариант.",

    // Availability
    checkAvailabilityTitle: "📅 *Проверить доступность*",
    enterDatePrompt:
      "На какую дату хотите проверить?\n\n_Введите дату в формате ДД/ММ/ГГГГ (напр. 15/07/2026)_",
    invalidDateFormat:
      "❌ Неверный формат даты. Используйте ДД/ММ/ГГГГ (напр. 15/07/2026)",
    outOfSeason:
      "⚠️ Эта дата вне сезона. Мы работаем с *апреля по октябрь*.",
    availabilityResult: "📅 *Доступность на {date}*",
    available: "✅ Доступно",
    occupied: "❌ Занято",
    selectBoatForAvailability: "\n_Ответьте номером для бронирования_",
    noBoatsAvailable:
      "😔 К сожалению, на эту дату нет свободных лодок.",
    allBoatsAvailable: "🎉 Все лодки доступны!",

    // Booking Flow
    startBookingTitle: "🎯 *Новое бронирование*",
    bookingDatePrompt:
      "Отлично! Создадим ваше бронирование.\n\nНа какую дату? _ДД/ММ/ГГГГ_",
    bookingBoatPrompt: "Какую лодку вы хотите забронировать?\n\n",
    bookingTimePrompt:
      "Во сколько хотите начать?\n\n1️⃣ 10:00\n2️⃣ 11:00\n3️⃣ 12:00\n4️⃣ 13:00\n5️⃣ 14:00\n6️⃣ 15:00\n7️⃣ 16:00",
    bookingDurationPrompt:
      "Сколько часов?\n\n1️⃣ 1 час\n2️⃣ 2 часа\n3️⃣ 3 часа\n4️⃣ 4 часа\n5️⃣ 6 часов\n6️⃣ 8 часов (весь день)",
    bookingPeoplePrompt:
      "Сколько человек? _(максимум {max} для этой лодки)_",
    bookingExtrasPrompt:
      "Хотите добавить дополнения?\n\n1️⃣ Парковка (10€)\n2️⃣ Сумка-холодильник (5€)\n3️⃣ Снорклинг (7,50€)\n4️⃣ Paddle Surf (25€)\n5️⃣ Seascooter (50€)\n0️⃣ Без дополнений\n\n_Можно выбрать несколько через запятую (напр. 1,3,4)_",
    bookingContactNamePrompt: "Ваше полное имя?",
    bookingContactEmailPrompt:
      "Ваш email? _(для отправки подтверждения)_",
    bookingConfirmTitle: "📋 *Итого бронирования*",
    bookingConfirmDetails:
      "🚤 *Лодка:* {boat}\n📅 *Дата:* {date}\n⏰ *Время:* {time} - {endTime}\n👥 *Человек:* {people}\n🎒 *Дополнения:* {extras}\n\n💰 *Итого:* {total}€ _(+ {deposit}€ залог)_",
    bookingConfirmPrompt:
      "\nОтправить запрос на бронирование команде?\n\n1️⃣ Да, отправить запрос\n2️⃣ Нет, отменить",
    bookingCreated:
      "✅ *Запрос на бронирование получен!*\n\nИван проверит доступность и свяжется с вами в ближайшее время для подтверждения вашего бронирования.",
    bookingNotification:
      "Вы получите подтверждение через WhatsApp после проверки вашего бронирования.",
    bookingFailed:
      "😔 К сожалению, не удалось создать бронирование. Возможно, выбранное время уже недоступно. Попробуйте снова или напишите *оператор*, чтобы связаться с нами.",
    invalidPeopleCount:
      "❌ Пожалуйста, введите корректное количество человек.",
    capacityExceeded:
      "❌ Количество человек ({people}) превышает вместимость лодки ({max}).",

    // Extras
    extrasTitle: "🎒 *Доступные дополнения*",
    extrasList: [
      "🅿️ Парковка в порту - 10€",
      "❄️ Сумка-холодильник - 5€",
      "🤿 Снаряжение для снорклинга - 7,50€",
      "🏄 Paddle Surf - 25€",
      "⚡ Seascooter - 50€",
    ],
    noExtras: "Без дополнений",
    extrasSelected: "Выбранные дополнения: {extras}",

    // Prices
    pricesTitle: "💰 *Цены {boat}*",
    seasonLow: "🌸 *Низкий сезон* (Апр-Июн, Сен-Окт)",
    seasonMid: "☀️ *Средний сезон* (Июль)",
    seasonHigh: "🔥 *Высокий сезон* (Август)",
    depositRequired: "💳 Залог: {deposit}€",
    fuelIncluded: "⛽ Топливо включено",
    fuelNotIncluded: "⛽ Топливо НЕ включено",

    // Agent
    agentHandoff:
      "👤 *Соединяем с оператором*\n\nЧлен нашей команды свяжется с вами как можно скорее.",
    agentNotified:
      "✅ Мы уведомили нашу команду. Ответим вам в ближайшее время.",

    // General
    yes: "Да",
    no: "Нет",
    confirm: "Подтвердить",
    cancel: "Отменить",
    thanks: "Спасибо за обращение в Costa Brava Rent a Boat! 🚤",
    goodbye: "До скорой встречи! Если понадобится помощь, пишите нам. 👋",
    error:
      "😔 Произошла ошибка. Попробуйте снова или напишите *оператор*, чтобы связаться с нами.",
    invalidOption: "❌ Неверная опция. Пожалуйста, выберите один из показанных вариантов.",
    typeMenuToReturn: "_Напишите *меню*, чтобы вернуться_",
  },
};

/**
 * Get translation for a specific language
 */
export function getTranslation(language: SupportedLanguage): ChatbotTranslations {
  return TRANSLATIONS[language] || TRANSLATIONS.es;
}

/**
 * Replace placeholders in a translation string
 * e.g., "Hello {name}" with { name: "John" } => "Hello John"
 */
export function formatMessage(
  message: string,
  params: Record<string, string | number>
): string {
  let result = message;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  return result;
}
