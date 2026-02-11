import { Language, useLanguage } from '@/hooks/use-language';

export interface Translations {
  // Navigation
  nav: {
    home: string;
    fleet: string;
    booking: string;
    contact: string;
    faq: string;
    viewComponents: string;
  };
  
  // Hero Section
  hero: {
    title: string;
    subtitle: string;
    bookNow: string;
    viewFleet: string;
    trustText: string;
    whatsappContact: string;
    location: string;
  };
  
  // Fleet Section
  fleet: {
    title: string;
    subtitle: string;
    helpText: string;
    callButton: string;
  };

  // Boat Cards
  boats: {
    viewDetails: string;
    book: string;
    notAvailable: string;
    from: string;
    upTo: string;
    people: string;
    hours: string;
    hoursWithLicense: string;
    hoursTooltip: string;
    withLicense: string;
    withoutLicense: string;
    available: string;
    occupied: string;
    more: string;
  };
  
  // Features Section
  features: {
    title: string;
    subtitle: string;
    withoutLicense: {
      title: string;
      description: string;
    };
    withLicense: {
      title: string;
      description: string;
    };
    includes: {
      title: string;
      description: string;
    };
    security: {
      title: string;
      description: string;
    };
  };
  
  // Contact Section
  contact: {
    title: string;
    subtitle: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    send: string;
    whatsapp: string;
    location: string;
    schedule: string;
    scheduleTime: string;
  };
  
  // Footer
  footer: {
    company: string;
    description: string;
    quickLinks: string;
    contact: string;
    followUs: string;
    rights: string;
    terms: string;
    privacy: string;
    whatsappInfo: string;
    operatingSeason: string;
    callsAndWhatsapp: string;
    responseTime: string;
    location: string;
    region: string;
    services: string;
    hours: string;
    businessHours: string;
    flexibleHours: string;
    legal: string;
    call: string;
    cancelationPolicy: string;
    extrasSnorkel: string;
    extrasPaddle: string;
    extrasSeascooter: string;
    hourlyRental: string;
    portParking: string;
    whatsappMessage: string;
  };
  
  // Booking Flow
  booking: {
    title: string;
    modalSubtitle: string;
    selectBoat: string;
    dateTime: string;
    customerDetails: string;
    payment: string;
    confirmation: string;
    date: string;
    time: string;
    duration: string;
    extras: string;
    customerInfo: string;
    total: string;
    payNow: string;
    backToFleet: string;
    next: string;
    back: string;
    complete: string;
    // Validation messages
    dateRequired: string;
    dateRequiredDesc: string;
    boatRequired: string;
    boatRequiredDesc: string;
    durationRequired: string;
    durationRequiredDesc: string;
    connectionError: string;
    connectionErrorDesc: string;
    // Form elements
    verifying: string;
    verifyingShort: string;
    searchAvailability: string;
    searchShort: string;
    selectDuration: string;
    oneHour: string;
    twoHours: string;
    threeHours: string;
    fourHours: string;
    sixHours: string;
    eightHours: string;
    selectDate: string;
    selectYourBoat: string;
    continue: string;
    customerData: string;
    continueToPayment: string;
    stripePaymentSecure: string;
    // New booking translations
    extrasDetails: {
      parking: { name: string; description: string };
      cooler: { name: string; description: string };
      snorkel: { name: string; description: string };
      paddle: { name: string; description: string };
      seascooter: { name: string; description: string };
    };
    summaryTitle: string;
    summaryDate: string;
    summarySchedule: string;
    summaryBoat: string;
    summaryBasePrice: string;
    summaryTotal: string;
    close: string;
    pay: string;
    error: string;
    missingFields: string;
    missingPersonalData: string;
    boatNotFound: string;
    bookingError: string;
    paymentError: string;
    noPaymentSession: string;
    bookingCreated: string;
    redirectingPayment: string;
    acceptTerms: string;
    termsAndConditions: string;
    privacyPolicy: string;
    // BookingFormWidget labels
    firstName: string;
    lastName: string;
    phone: string;
    emailLabel: string;
    numberOfPeople: string;
    preferredTime: string;
    selectTime: string;
    boat: string;
    withLicense: string;
    withoutLicense: string;
    select: string;
    pricesUpdateByDate: string;
    sendBookingRequest: string;
    people: string;
    // BookingFormWidget validation
    firstNameRequired: string;
    firstNameRequiredDesc: string;
    lastNameRequired: string;
    lastNameRequiredDesc: string;
    phoneRequired: string;
    phoneRequiredDesc: string;
    emailRequired: string;
    emailRequiredDesc: string;
    emailInvalid: string;
    emailInvalidDesc: string;
    peopleRequired: string;
    peopleRequiredDesc: string;
    timeRequired: string;
    timeRequiredDesc: string;
  };
  
  // FAQ Page
  faq: {
    title: string;
    subtitle: string;
    askQuestion: string;
    bookNow: string;
    moreQuestions: string;
    
    // FAQ Sections
    pricing: {
      title: string;
      questions: {
        prices: string;
        howToBook: string;
        payment: string;
        cancellation: string;
      };
    };
    
    licenses: {
      title: string;
      questions: {
        withoutLicense: string;
        withLicense: string;
        minAge: string;
        experience: string;
      };
    };
    
    includes: {
      title: string;
      questions: {
        included: string;
        fuel: string;
        extras: string;
        bring: string;
      };
    };
    
    navigation: {
      title: string;
      questions: {
        zone: string;
        safety: string;
        weather: string;
        emergency: string;
      };
    };
    
    practical: {
      title: string;
      questions: {
        schedule: string;
        arrival: string;
        parking: string;
        luggage: string;
      };
    };
    
    season: {
      title: string;
      questions: {
        when: string;
        availability: string;
        advance: string;
      };
    };
  };
  
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    yes: string;
    no: string;
    close: string;
    cancel: string;
    confirm: string;
    save: string;
    edit: string;
    delete: string;
    search: string;
    filter: string;
    sort: string;
    showMore: string;
    showLess: string;
  };

  // Breadcrumbs
  breadcrumbs: {
    home: string;
    boats: string;
    locations: string;
    categories: string;
    legal: string;
    faq: string;
    categoryLicenseFree: string;
    categoryLicensed: string;
    locationBlanes: string;
    locationLloret: string;
    locationTossa: string;
    privacyPolicy: string;
    termsConditions: string;
  };

  // Availability Calendar
  availability: {
    title: string;
    available: string;
    partial: string;
    booked: string;
    offSeason: string;
    slotsFor: string;
    noSlots: string;
    selectDay: string;
  };

  // Gallery
  gallery: {
    title: string;
    subtitle: string;
    sharePhoto: string;
    noPhotos: string;
    submitTitle: string;
    photo: string;
    yourName: string;
    caption: string;
    boat: string;
    tripDate: string;
    submit: string;
  };

  // Routes
  routes: {
    title: string;
    subtitle: string;
    bookBoat: string;
  };
}

export const translations: Record<Language, Translations> = {
  es: {
    nav: {
      home: 'Inicio',
      fleet: 'Flota',
      booking: 'Reserva',
      contact: 'Contacto',
      faq: 'FAQ',
      viewComponents: 'Ver Componentes',
    },
    hero: {
      title: 'Alquiler de Barcos en Blanes, Costa Brava',
      subtitle: 'Descubre las mejores calas de la Costa Brava con nuestros barcos con y sin licencia. Salidas desde Puerto de Blanes.',
      bookNow: 'Reservar Ahora',
      viewFleet: 'Ver Flota',
      trustText: 'Sin compromiso • Precios transparentes',
      whatsappContact: 'WhatsApp +34 611 500 372',
      location: 'Ubicación',
    },
    
    fleet: {
      title: 'Nuestra flota de alquiler en Blanes',
      subtitle: 'Descubre nuestra flota de alquiler de barcos con licencia o sin licencia en Blanes, Costa Brava.',
      helpText: '¿Necesitas ayuda para elegir tu alquiler de barco en Blanes?',
      callButton: 'Llama al +34 611 500 372',
    },
    boats: {
      viewDetails: 'Ver detalles',
      book: 'Solicitar Reserva',
      notAvailable: 'No disponible',
      from: 'desde',
      upTo: 'Hasta',
      people: 'pax',
      hours: '1-8 horas',
      hoursWithLicense: '2-8h',
      hoursTooltip: 'Elige entre 2h, 4h, u 8h para alquilar nuestra {boatName}',
      withLicense: 'Con licencia',
      withoutLicense: 'Sin licencia',
      available: 'Disponible',
      occupied: 'Ocupado',
      more: 'más',
    },
    features: {
      title: 'Por qué elegir Costa Brava Rent a Boat',
      subtitle: 'Todo lo que necesitas para una experiencia perfecta en el mar',
      withoutLicense: {
        title: 'Barcos Con y Sin Licencia',
        description: 'Perfectos para principiantes. Fáciles de manejar y seguros.',
      },
      withLicense: {
        title: 'Barcos con Licencia',
        description: 'Embarcaciones más grandes y potentes para navegantes experimentados.',
      },
      includes: {
        title: 'Gasolina Incluida',
        description: 'Combistiboe incluido en nuestras embarcaciones sin licencia',
      },
      security: {
        title: 'Máxima Seguridad',
        description: 'Embarcaciones revisadas diariamente y equipo de seguridad homologado.',
      },
    },
    contact: {
      title: 'Contacta con Nosotros',
      subtitle: 'Estaremos encantados de ayudarte a planificar tu día perfecto en el mar',
      name: 'Nombre',
      email: 'Email',
      phone: 'Teléfono',
      message: 'Mensaje',
      send: 'Enviar Mensaje',
      whatsapp: 'WhatsApp',
      location: 'Puerto de Blanes, Girona',
      schedule: 'Horario',
      scheduleTime: 'Temporada: Abril - Octubre',
    },
    footer: {
      company: 'Costa Brava Rent a Boat - Blanes',
      description: 'Alquiler de barcos con y sin licencia en Blanes, Costa Brava.',
      quickLinks: 'Enlaces Rápidos',
      contact: 'Contacto',
      followUs: 'Síguenos',
      rights: 'Todos los derechos reservados.',
      terms: 'Términos y Condiciones',
      privacy: 'Política de Privacidad',
      whatsappInfo: 'Información por WhatsApp',
      operatingSeason: 'Temporada operativa: Abril - Octubre',
      callsAndWhatsapp: 'Llamadas y WhatsApp',
      responseTime: 'Respuesta en 24h',
      location: 'Puerto de Blanes',
      region: 'Girona, Costa Brava',
      services: 'Servicios',
      hours: 'Horarios',
      businessHours: '9:00 - 19:00 (Temporada alta)',
      flexibleHours: 'Horarios flexibles según disponibilidad',
      legal: 'Legal',
      call: 'Llamar',
      cancelationPolicy: 'Política de Cancelación',
      extrasSnorkel: 'Extras: Snorkel',
      extrasPaddle: 'Extras: Paddle Surf',
      extrasSeascooter: 'Extras: Seascooter',
      hourlyRental: 'Alquiler por horas',
      portParking: 'Parking dentro del puerto',
      whatsappMessage: 'Hola, me gustaría información sobre el alquiler de barcos',
    },
    booking: {
      title: '¡SOLICITA AQUÍ TU PETICIÓN!',
      modalSubtitle: 'Completa los datos para solicitar la reserva de tu barco',
      selectBoat: 'Seleccionar Barco',
      dateTime: 'Fecha y Hora',
      customerDetails: 'Datos del Cliente',
      payment: 'Pago',
      confirmation: 'Confirmación',
      date: 'Fecha',
      time: 'Hora',
      duration: 'Duración',
      extras: 'Extras',
      customerInfo: 'Información del Cliente',
      total: 'Total',
      payNow: 'Pagar Ahora',
      backToFleet: 'Volver a la Flota',
      next: 'Siguiente',
      back: 'Atrás',
      complete: 'Completar',
      // Validation messages  
      dateRequired: 'Fecha requerida',
      dateRequiredDesc: 'Por favor selecciona una fecha',
      boatRequired: 'Embarcación requerida', 
      boatRequiredDesc: 'Por favor selecciona una embarcación',
      durationRequired: 'Duración requerida',
      durationRequiredDesc: 'Por favor selecciona la duración',
      connectionError: 'Error de conexión',
      connectionErrorDesc: 'No se pudo conectar al servidor',
      // Form elements
      verifying: 'Verificando disponibilidad...',
      verifyingShort: 'Verificando...',
      searchAvailability: 'Buscar Disponibilidad',
      searchShort: 'Buscar',
      selectDuration: 'Seleccionar duración',
      oneHour: '1 hora',
      twoHours: '2 horas',
      threeHours: '3 horas',
      fourHours: '4 horas - Media día',
      sixHours: '6 horas',
      eightHours: '8 horas - Día completo',
      selectDate: 'Selecciona la fecha',
      selectYourBoat: 'Selecciona tu embarcación',
      continue: 'Continuar',
      customerData: 'Datos del cliente',
      continueToPayment: 'Continuar al pago',
      stripePaymentSecure: 'Pago seguro procesado por Stripe. Se aplicará una retención temporal de 15 minutos.',
      // Extras details
      extrasDetails: {
        parking: { name: 'Parking dentro del puerto', description: 'Parking dentro del puerto y delante del barco' },
        cooler: { name: 'Nevera', description: 'Nevera para mantener bebidas frías' },
        snorkel: { name: 'Equipo snorkel', description: 'Equipo completo de snorkel' },
        paddle: { name: 'Tabla de paddlesurf', description: 'Tabla de paddle surf' },
        seascooter: { name: 'Seascooter', description: 'Scooter acuático' }
      },
      // Summary
      summaryTitle: 'Resumen de la reserva',
      summaryDate: 'Fecha:',
      summarySchedule: 'Horario:',
      summaryBoat: 'Embarcación:',
      summaryBasePrice: 'Precio base:',
      summaryTotal: 'Total:',
      // Navigation & Actions  
      close: 'Cerrar',
      pay: 'Pagar',
      // Errors
      error: 'Error',
      missingFields: 'Por favor completa todos los campos requeridos.',
      missingPersonalData: 'Por favor completa todos los datos personales requeridos.',
      boatNotFound: 'Barco no encontrado',
      bookingError: 'Error al crear la reserva',
      paymentError: 'Error al procesar el pago',
      noPaymentSession: 'No se pudo crear la sesión de pago',
      // Success
      bookingCreated: 'Reserva creada',
      redirectingPayment: 'Redirigiendo a la pasarela de pago segura...',
      // Terms
      acceptTerms: 'Acepto los términos y condiciones y la política de privacidad',
      termsAndConditions: 'términos y condiciones',
      privacyPolicy: 'política de privacidad',
      // BookingFormWidget labels
      firstName: 'Nombre',
      lastName: 'Apellidos',
      phone: 'Teléfono',
      emailLabel: 'Email',
      numberOfPeople: 'Personas',
      preferredTime: 'Hora de inicio',
      selectTime: 'Seleccionar...',
      boat: 'Barco',
      withLicense: 'Con Licencia',
      withoutLicense: 'Sin Licencia',
      select: 'Seleccionar...',
      pricesUpdateByDate: 'Los precios se actualizan según la fecha',
      sendBookingRequest: 'ENVIAR PETICIÓN DE RESERVA',
      people: 'personas',
      // BookingFormWidget validation
      firstNameRequired: 'Campo requerido: Nombre',
      firstNameRequiredDesc: 'Por favor ingresa tu nombre',
      lastNameRequired: 'Campo requerido: Apellidos',
      lastNameRequiredDesc: 'Por favor ingresa tus apellidos',
      phoneRequired: 'Campo requerido: Teléfono',
      phoneRequiredDesc: 'Por favor ingresa tu número de teléfono',
      emailRequired: 'Campo requerido: Email',
      emailRequiredDesc: 'Por favor ingresa tu correo electrónico',
      emailInvalid: 'Email inválido',
      emailInvalidDesc: 'Por favor ingresa un email válido',
      peopleRequired: 'Campo requerido: Personas',
      peopleRequiredDesc: 'Por favor indica el número de personas',
      timeRequired: 'Campo requerido: Hora',
      timeRequiredDesc: 'Por favor selecciona una hora de inicio',
    },
    faq: {
      title: 'Preguntas Frecuentes',
      subtitle: 'Encuentra respuestas a todas tus dudas sobre el alquiler de barcos en Blanes, Costa Brava.',
      askQuestion: 'Hacer Pregunta',
      bookNow: 'Reservar Ahora',
      moreQuestions: '¿Más Preguntas?',
      pricing: {
        title: 'Reservas y Precios',
        questions: {
          prices: '¿Cuáles son los precios del alquiler?',
          howToBook: '¿Cómo puedo hacer una reserva?',
          payment: '¿Qué formas de pago aceptan?',
          cancellation: '¿Cuál es la política de cancelación?',
        },
      },
      licenses: {
        title: 'Licencias y Requisitos',
        questions: {
          withoutLicense: '¿Puedo alquilar sin tener licencia náutica?',
          withLicense: '¿Qué licencias aceptan para barcos grandes?',
          minAge: '¿Cuál es la edad mínima para alquilar?',
          experience: '¿Necesito experiencia previa navegando?',
        },
      },
      includes: {
        title: 'Qué Incluye el Alquiler',
        questions: {
          included: '¿Qué está incluido en el precio?',
          fuel: '¿Tengo que pagar combustible extra?',
          extras: '¿Qué extras puedo añadir?',
          bring: '¿Qué debo llevar yo?',
        },
      },
      navigation: {
        title: 'Navegación y Seguridad',
        questions: {
          zone: '¿Por dónde puedo navegar?',
          safety: '¿Qué medidas de seguridad tienen?',
          weather: '¿Qué pasa si hace mal tiempo?',
          emergency: '¿Qué hago en caso de emergencia?',
        },
      },
      practical: {
        title: 'Información Práctica',
        questions: {
          schedule: '¿Cuáles son los horarios disponibles?',
          arrival: '¿Cuándo debo llegar al puerto?',
          parking: '¿Hay parking disponible?',
          luggage: '¿Puedo dejar equipaje en el puerto?',
        },
      },
      season: {
        title: 'Temporada y Disponibilidad',
        questions: {
          when: '¿Cuándo está abierta la temporada?',
          availability: '¿Cómo puedo consultar disponibilidad?',
          advance: '¿Con qué antelación debo reservar?',
        },
      },
    },
    common: {
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      yes: 'Sí',
      no: 'No',
      close: 'Cerrar',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      save: 'Guardar',
      edit: 'Editar',
      delete: 'Eliminar',
      search: 'Buscar',
      filter: 'Filtrar',
      sort: 'Ordenar',
      showMore: 'Ver más',
      showLess: 'Ver menos',
    },
    breadcrumbs: {
      home: 'Inicio',
      boats: 'Barcos',
      locations: 'Ubicaciones',
      categories: 'Categorías',
      legal: 'Legal',
      faq: 'FAQ',
      categoryLicenseFree: 'Barcos Sin Licencia',
      categoryLicensed: 'Barcos Con Licencia',
      locationBlanes: 'Blanes',
      locationLloret: 'Lloret de Mar',
      locationTossa: 'Tossa de Mar',
      privacyPolicy: 'Política de Privacidad',
      termsConditions: 'Términos y Condiciones',
    },
    availability: {
      title: 'Disponibilidad',
      available: 'Disponible',
      partial: 'Parcial',
      booked: 'Ocupado',
      offSeason: 'Fuera de temporada',
      slotsFor: 'Horarios para',
      noSlots: 'No hay horarios disponibles para esta fecha',
      selectDay: 'Selecciona un día para ver los horarios disponibles',
    },
    gallery: {
      title: 'Galeria de Fotos',
      subtitle: 'Fotos de nuestros clientes disfrutando de la Costa Brava',
      sharePhoto: 'Comparte tu foto',
      noPhotos: 'Aun no hay fotos. Se el primero en compartir!',
      submitTitle: 'Comparte tu foto',
      photo: 'Foto',
      yourName: 'Tu nombre',
      caption: 'Descripcion (opcional)',
      boat: 'Barco',
      tripDate: 'Fecha',
      submit: 'Enviar foto',
    },
    routes: {
      title: 'Rutas Sugeridas',
      subtitle: 'Descubre las mejores rutas en barco desde el Puerto de Blanes',
      bookBoat: 'Reservar barco',
    },
  },

  ca: {
    nav: {
      home: 'Inici',
      fleet: 'Flota',
      booking: 'Reserva',
      contact: 'Contacte',
      faq: 'FAQ',
      viewComponents: 'Veure Components',
    },
    hero: {
      title: 'Lloguer de Barques a Blanes, Costa Brava',
      subtitle: 'Descobreix les millors cales de la Costa Brava amb les nostres barques amb i sense llicència. Sortides des del Port de Blanes.',
      bookNow: 'Reservar Ara',
      viewFleet: 'Veure Flota',
      trustText: 'Sense comproms • Confirmació immediata • Preus transparents',
      whatsappContact: 'WhatsApp +34 611 500 372',
      location: 'Ubicació',
    },
    
    fleet: {
      title: 'La nostra flota de lloguer a Blanes',
      subtitle: 'Descobreix la nostra flota de lloguer de vaixells amb llicència o sense llicència a Blanes, Costa Brava.',
      helpText: 'Necessites ajuda per triar el teu lloguer de vaixell a Blanes?',
      callButton: 'Truca al +34 611 500 372',
    },
    boats: {
      viewDetails: 'Veure detalls',
      book: 'Reservar',
      notAvailable: 'No disponible',
      from: 'des de',
      upTo: 'Fins a',
      people: 'pax',
      hours: '1-8 hores',
      hoursWithLicense: '2-8h',
      hoursTooltip: 'Tria entre 2h, 4h, o 8h per llogar la nostra {boatName}',
      withLicense: 'Amb llicència',
      withoutLicense: 'Sense llicència',
      available: 'Disponible',
      occupied: 'Ocupat',
      more: 'més',
    },
    features: {
      title: 'Per què triar Costa Brava Rent a Boat',
      subtitle: 'Tot el que necessites per a una experiència perfecta al mar',
      withoutLicense: {
        title: 'Barques sense Llicència',
        description: 'Perfectes per a principiants. Fàcils de manejar i segures.',
      },
      withLicense: {
        title: 'Barques amb Llicència',
        description: 'Embarcacions més grans i potents per a navegants experimentats.',
      },
      includes: {
        title: 'Tot Inclòs',
        description: 'Combustible, snorkel, paddle surf i equip de seguretat inclosos.',
      },
      security: {
        title: 'Màxima Seguretat',
        description: 'Embarcacions revisades diàriament i equip de seguretat homologat.',
      },
    },
    contact: {
      title: 'Contacta amb Nosaltres',
      subtitle: 'Estarem encantats d\'ajudar-te a planificar el teu dia perfecte al mar',
      name: 'Nom',
      email: 'Email',
      phone: 'Telèfon',
      message: 'Missatge',
      send: 'Enviar Missatge',
      whatsapp: 'WhatsApp',
      location: 'Port de Blanes, Girona',
      schedule: 'Horari',
      scheduleTime: 'Temporada: Abril - Octubre',
    },
    footer: {
      company: 'Costa Brava Rent a Boat - Blanes',
      description: 'Lloguer de barques amb i sense llicència a Blanes, Costa Brava.',
      quickLinks: 'Enllaços Ràpids',
      contact: 'Contacte',
      followUs: 'Segueix-nos',
      rights: 'Tots els drets reservats.',
      terms: 'Termes i Condicions',
      privacy: 'Política de Privacitat',
      whatsappInfo: 'Informació per WhatsApp',
      operatingSeason: 'Temporada operativa: Abril - Octubre',
      callsAndWhatsapp: 'Trucades i WhatsApp',
      responseTime: 'Resposta en 24h',
      location: 'Port de Blanes',
      region: 'Girona, Costa Brava',
      services: 'Serveis',
      hours: 'Horaris',
      businessHours: '9:00 - 19:00 (Temporada alta)',
      flexibleHours: 'Horaris flexibles segons disponibilitat',
      legal: 'Legal',
      call: 'Trucar',
      cancelationPolicy: 'Política de Cancel·lació',
      extrasSnorkel: 'Extres: Snorkel',
      extrasPaddle: 'Extres: Paddle Surf',
      extrasSeascooter: 'Extres: Seascooter',
      hourlyRental: 'Lloguer per hores',
      portParking: 'Aparcament dins del port',
      whatsappMessage: 'Hola, m\'agradaria informació sobre el lloguer de barques',
    },
    booking: {
      title: 'Sol·licita aquí la teva petició!',
      modalSubtitle: 'Completa les dades per sol·licitar la reserva de la teva barca',
      selectBoat: 'Seleccionar Barca',
      dateTime: 'Data i Hora',
      customerDetails: 'Dades del Client',
      payment: 'Pagament',
      confirmation: 'Confirmació',
      date: 'Data',
      time: 'Hora',
      duration: 'Durada',
      extras: 'Extres',
      customerInfo: 'Informació del Client',
      total: 'Total',
      payNow: 'Pagar Ara',
      backToFleet: 'Tornar a la Flota',
      next: 'Següent',
      back: 'Enrere',
      complete: 'Completar',
      firstName: 'Nom',
      lastName: 'Cognoms',
      phone: 'Telèfon',
      emailLabel: 'Email',
      numberOfPeople: 'Persones',
      preferredTime: 'Hora d\'inici',
      selectTime: 'Seleccionar...',
      boat: 'Barca',
      withLicense: 'Amb Llicència',
      withoutLicense: 'Sense Llicència',
      select: 'Seleccionar...',
      pricesUpdateByDate: 'Els preus s\'actualitzen segons la data',
      sendBookingRequest: 'ENVIAR PETICIÓ DE RESERVA',
      people: 'persones',
      firstNameRequired: 'Camp requerit: Nom',
      firstNameRequiredDesc: 'Si us plau, introdueix el teu nom',
      lastNameRequired: 'Camp requerit: Cognoms',
      lastNameRequiredDesc: 'Si us plau, introdueix els teus cognoms',
      phoneRequired: 'Camp requerit: Telèfon',
      phoneRequiredDesc: 'Si us plau, introdueix el teu número de telèfon',
      emailRequired: 'Camp requerit: Email',
      emailRequiredDesc: 'Si us plau, introdueix el teu correu electrònic',
      emailInvalid: 'Email invàlid',
      emailInvalidDesc: 'Si us plau, introdueix un email vàlid',
      peopleRequired: 'Camp requerit: Persones',
      peopleRequiredDesc: 'Si us plau, indica el nombre de persones',
      timeRequired: 'Camp requerit: Hora',
      timeRequiredDesc: 'Si us plau, selecciona una hora d\'inici',
    },
    faq: {
      title: 'Preguntes Freqüents',
      subtitle: 'Troba respostes a tots els teus dubtes sobre el lloguer de barques a Blanes, Costa Brava.',
      askQuestion: 'Fer Pregunta',
      bookNow: 'Reservar Ara',
      moreQuestions: 'Més Preguntes?',
      pricing: {
        title: 'Reserves i Preus',
        questions: {
          prices: 'Quins són els preus del lloguer?',
          howToBook: 'Com puc fer una reserva?',
          payment: 'Quines formes de pagament accepteu?',
          cancellation: 'Quina és la política de cancel·lació?',
        },
      },
      licenses: {
        title: 'Llicències i Requisits',
        questions: {
          withoutLicense: 'Puc llogar sense tenir llicència nàutica?',
          withLicense: 'Quines llicències accepteu per barques grans?',
          minAge: 'Quina és l\'edat mínima per llogar?',
          experience: 'Necessito experiència prèvia navegant?',
        },
      },
      includes: {
        title: 'Què Inclou el Lloguer',
        questions: {
          included: 'Què està inclòs en el preu?',
          fuel: 'He de pagar combustible extra?',
          extras: 'Quins extres puc afegir?',
          bring: 'Què he de portar jo?',
        },
      },
      navigation: {
        title: 'Navegació i Seguretat',
        questions: {
          zone: 'Per on puc navegar?',
          safety: 'Quines mesures de seguretat teniu?',
          weather: 'Què passa si fa mal temps?',
          emergency: 'Què faig en cas d\'emergència?',
        },
      },
      practical: {
        title: 'Informació Pràctica',
        questions: {
          schedule: 'Quins són els horaris disponibles?',
          arrival: 'Quan he d\'arribar al port?',
          parking: 'Hi ha pàrquing disponible?',
          luggage: 'Puc deixar equipatge al port?',
        },
      },
      season: {
        title: 'Temporada i Disponibilitat',
        questions: {
          when: 'Quan està oberta la temporada?',
          availability: 'Com puc consultar disponibilitat?',
          advance: 'Amb quina antelació he de reservar?',
        },
      },
    },
    common: {
      loading: 'Carregant...',
      error: 'Error',
      success: 'Èxit',
      yes: 'Sí',
      no: 'No',
      close: 'Tancar',
      cancel: 'Cancel·lar',
      confirm: 'Confirmar',
      save: 'Guardar',
      edit: 'Editar',
      delete: 'Eliminar',
      search: 'Cercar',
      filter: 'Filtrar',
      sort: 'Ordenar',
      showMore: 'Veure més',
      showLess: 'Veure menys',
    },
    breadcrumbs: {
      home: 'Inici',
      boats: 'Barques',
      locations: 'Ubicacions',
      categories: 'Categories',
      legal: 'Legal',
      faq: 'FAQ',
      categoryLicenseFree: 'Barques Sense Llicència',
      categoryLicensed: 'Barques Amb Llicència',
      locationBlanes: 'Blanes',
      locationLloret: 'Lloret de Mar',
      locationTossa: 'Tossa de Mar',
      privacyPolicy: 'Política de Privacitat',
      termsConditions: 'Termes i Condicions',
    },
    availability: {
      title: 'Disponibilitat',
      available: 'Disponible',
      partial: 'Parcial',
      booked: 'Ocupat',
      offSeason: 'Fora de temporada',
      slotsFor: 'Horaris per',
      noSlots: 'No hi ha horaris disponibles per aquesta data',
      selectDay: 'Selecciona un dia per veure els horaris disponibles',
    },
    gallery: {
      title: 'Galeria de Fotos',
      subtitle: 'Fotos dels nostres clients gaudint de la Costa Brava',
      sharePhoto: 'Comparteix la teva foto',
      noPhotos: 'Encara no hi ha fotos. Sigues el primer en compartir!',
      submitTitle: 'Comparteix la teva foto',
      photo: 'Foto',
      yourName: 'El teu nom',
      caption: 'Descripcio (opcional)',
      boat: 'Barca',
      tripDate: 'Data',
      submit: 'Enviar foto',
    },
    routes: {
      title: 'Rutes Suggerides',
      subtitle: 'Descobreix les millors rutes en barca des del Port de Blanes',
      bookBoat: 'Reservar barca',
    },
  },

  en: {
    nav: {
      home: 'Home',
      fleet: 'Fleet',
      booking: 'Booking',
      contact: 'Contact',
      faq: 'FAQ',
      viewComponents: 'View Components',
    },
    hero: {
      title: 'Boat Rental in Blanes, Costa Brava',
      subtitle: 'Discover the best coves of Costa Brava with our licensed and license-free boats. Departures from Blanes Port.',
      bookNow: 'Book Now',
      viewFleet: 'View Fleet',
      trustText: 'No commitment • Instant confirmation • Transparent prices',
      whatsappContact: 'WhatsApp +34 611 500 372',
      location: 'Location',
    },
    
    fleet: {
      title: 'Our rental fleet in Blanes',
      subtitle: 'Discover our rental fleet of licensed and license-free boats in Blanes, Costa Brava.',
      helpText: 'Need help choosing your boat rental in Blanes?',
      callButton: 'Call +34 611 500 372',
    },
    boats: {
      viewDetails: 'View details',
      book: 'Book',
      notAvailable: 'Not available',
      from: 'from',
      upTo: 'Up to',
      people: 'pax',
      hours: '1-8 hours',
      hoursWithLicense: '2-8h',
      hoursTooltip: 'Choose between 2h, 4h, or 8h to rent our {boatName}',
      withLicense: 'With license',
      withoutLicense: 'Without license',
      available: 'Available',
      occupied: 'Occupied',
      more: 'more',
    },
    features: {
      title: 'Why Choose Costa Brava Rent a Boat',
      subtitle: 'Everything you need for a perfect sea experience',
      withoutLicense: {
        title: 'License-Free Boats',
        description: 'Perfect for beginners. Easy to handle and safe.',
      },
      withLicense: {
        title: 'Licensed Boats',
        description: 'Larger and more powerful boats for experienced sailors.',
      },
      includes: {
        title: 'All Included',
        description: 'Fuel, snorkel, paddle surf and safety equipment included.',
      },
      security: {
        title: 'Maximum Safety',
        description: 'Daily inspected boats and certified safety equipment.',
      },
    },
    contact: {
      title: 'Contact Us',
      subtitle: 'We\'ll be happy to help you plan your perfect day at sea',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      message: 'Message',
      send: 'Send Message',
      whatsapp: 'WhatsApp',
      location: 'Blanes Port, Girona',
      schedule: 'Schedule',
      scheduleTime: 'Season: April - October',
    },
    footer: {
      company: 'Costa Brava Rent a Boat - Blanes',
      description: 'Licensed and license-free boat rental in Blanes, Costa Brava.',
      quickLinks: 'Quick Links',
      contact: 'Contact',
      followUs: 'Follow Us',
      rights: 'All rights reserved.',
      terms: 'Terms and Conditions',
      privacy: 'Privacy Policy',
      whatsappInfo: 'WhatsApp Information',
    },
    booking: {
      title: 'Request Your Booking!',
      modalSubtitle: 'Complete the details to request your boat booking',
      selectBoat: 'Select Boat',
      dateTime: 'Date & Time',
      customerDetails: 'Customer Details',
      payment: 'Payment',
      confirmation: 'Confirmation',
      date: 'Date',
      time: 'Time',
      duration: 'Duration',
      extras: 'Extras',
      customerInfo: 'Customer Information',
      total: 'Total',
      payNow: 'Pay Now',
      backToFleet: 'Back to Fleet',
      next: 'Next',
      back: 'Back',
      complete: 'Complete',
      selectDuration: 'Select duration',
      oneHour: '1 hour',
      twoHours: '2 hours', 
      threeHours: '3 hours',
      fourHours: '4 hours - Half day',
      sixHours: '6 hours',
      eightHours: '8 hours - Full day',
      searchAvailability: 'Check Availability',
      searchShort: 'Check',
      selectDate: 'Select the date',
      selectYourBoat: 'Select your boat',
      continue: 'Continue',
      customerData: 'Customer Data',
      continueToPayment: 'Continue to Payment',
      stripePaymentSecure: 'Secure payment processed by Stripe. A temporary 15-minute hold will be applied.',
      dateRequired: 'Date required',
      dateRequiredDesc: 'Please select a date',
      boatRequired: 'Boat required',
      boatRequiredDesc: 'Please select a boat',
      durationRequired: 'Duration required',
      durationRequiredDesc: 'Please select a duration',
      connectionError: 'Connection error',
      connectionErrorDesc: 'Could not connect to server',
      firstName: 'First Name',
      lastName: 'Last Name',
      phone: 'Phone',
      emailLabel: 'Email',
      numberOfPeople: 'People',
      preferredTime: 'Start Time',
      selectTime: 'Select...',
      boat: 'Boat',
      withLicense: 'With License',
      withoutLicense: 'Without License',
      select: 'Select...',
      pricesUpdateByDate: 'Prices update based on the selected date',
      sendBookingRequest: 'SEND BOOKING REQUEST',
      people: 'people',
      firstNameRequired: 'Required: First Name',
      firstNameRequiredDesc: 'Please enter your first name',
      lastNameRequired: 'Required: Last Name',
      lastNameRequiredDesc: 'Please enter your last name',
      phoneRequired: 'Required: Phone',
      phoneRequiredDesc: 'Please enter your phone number',
      emailRequired: 'Required: Email',
      emailRequiredDesc: 'Please enter your email address',
      emailInvalid: 'Invalid Email',
      emailInvalidDesc: 'Please enter a valid email address',
      peopleRequired: 'Required: People',
      peopleRequiredDesc: 'Please indicate the number of people',
      timeRequired: 'Required: Time',
      timeRequiredDesc: 'Please select a start time',
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: 'Find answers to all your questions about boat rental in Blanes, Costa Brava.',
      askQuestion: 'Ask Question',
      bookNow: 'Book Now',
      moreQuestions: 'More Questions?',
      pricing: {
        title: 'Bookings and Prices',
        questions: {
          prices: 'What are the rental prices?',
          howToBook: 'How can I make a booking?',
          payment: 'What payment methods do you accept?',
          cancellation: 'What is the cancellation policy?',
        },
      },
      licenses: {
        title: 'Licenses and Requirements',
        questions: {
          withoutLicense: 'Can I rent without a boating license?',
          withLicense: 'What licenses do you accept for large boats?',
          minAge: 'What is the minimum age to rent?',
          experience: 'Do I need previous sailing experience?',
        },
      },
      includes: {
        title: 'What\'s Included in the Rental',
        questions: {
          included: 'What is included in the price?',
          fuel: 'Do I have to pay extra fuel?',
          extras: 'What extras can I add?',
          bring: 'What should I bring?',
        },
      },
      navigation: {
        title: 'Navigation and Safety',
        questions: {
          zone: 'Where can I navigate?',
          safety: 'What safety measures do you have?',
          weather: 'What happens if the weather is bad?',
          emergency: 'What do I do in case of emergency?',
        },
      },
      practical: {
        title: 'Practical Information',
        questions: {
          schedule: 'What are the available schedules?',
          arrival: 'When should I arrive at the port?',
          parking: 'Is parking available?',
          luggage: 'Can I leave luggage at the port?',
        },
      },
      season: {
        title: 'Season and Availability',
        questions: {
          when: 'When is the season open?',
          availability: 'How can I check availability?',
          advance: 'How far in advance should I book?',
        },
      },
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      yes: 'Yes',
      no: 'No',
      close: 'Close',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      showMore: 'Show more',
      showLess: 'Show less',
    },
    breadcrumbs: {
      home: 'Home',
      boats: 'Boats',
      locations: 'Locations',
      categories: 'Categories',
      legal: 'Legal',
      faq: 'FAQ',
      categoryLicenseFree: 'License-Free Boats',
      categoryLicensed: 'Licensed Boats',
      locationBlanes: 'Blanes',
      locationLloret: 'Lloret de Mar',
      locationTossa: 'Tossa de Mar',
      privacyPolicy: 'Privacy Policy',
      termsConditions: 'Terms and Conditions',
    },
    availability: {
      title: 'Availability',
      available: 'Available',
      partial: 'Partial',
      booked: 'Booked',
      offSeason: 'Off season',
      slotsFor: 'Time slots for',
      noSlots: 'No time slots available for this date',
      selectDay: 'Select a day to see available time slots',
    },
    gallery: {
      title: 'Photo Gallery',
      subtitle: 'Photos from our customers enjoying the Costa Brava',
      sharePhoto: 'Share your photo',
      noPhotos: 'No photos yet. Be the first to share!',
      submitTitle: 'Share your photo',
      photo: 'Photo',
      yourName: 'Your name',
      caption: 'Description (optional)',
      boat: 'Boat',
      tripDate: 'Date',
      submit: 'Submit photo',
    },
    routes: {
      title: 'Suggested Routes',
      subtitle: 'Discover the best boat routes from Blanes Port',
      bookBoat: 'Book a boat',
    },
  },

  fr: {
    nav: {
      home: 'Accueil',
      fleet: 'Flotte',
      booking: 'Réservation',
      contact: 'Contact',
      faq: 'FAQ',
      viewComponents: 'Voir Composants',
    },
    hero: {
      title: 'Location de Bateaux à Blanes, Costa Brava',
      subtitle: 'Découvrez les plus belles criques de la Costa Brava avec nos bateaux avec et sans permis. Départ du Port de Blanes.',
      bookNow: 'Réserver Maintenant',
      viewFleet: 'Voir la Flotte',
      trustText: 'Sans engagement • Confirmation immédiate • Prix transparents',
      whatsappContact: 'WhatsApp +34 611 500 372',
      location: 'Emplacement',
    },
    
    fleet: {
      title: 'Notre flotte de location à Blanes',
      subtitle: 'Découvrez notre flotte de location de bateaux avec et sans permis à Blanes, Costa Brava.',
      helpText: 'Besoin d\'aide pour choisir votre location de bateau à Blanes?',
      callButton: 'Appelez le +34 611 500 372',
    },
    boats: {
      viewDetails: 'Voir détails',
      book: 'Réserver',
      notAvailable: 'Non disponible',
      from: 'à partir de',
      upTo: 'Jusqu\'à',
      people: 'pax',
      hours: '1-8 heures',
      hoursWithLicense: '2-8h',
      hoursTooltip: 'Choisissez entre 2h, 4h ou 8h pour louer notre {boatName}',
      withLicense: 'Avec permis',
      withoutLicense: 'Sans permis',
      available: 'Disponible',
      occupied: 'Occupé',
      more: 'plus',
    },
    features: {
      title: 'Pourquoi Choisir Costa Brava Rent a Boat',
      subtitle: 'Tout ce dont vous avez besoin pour une expérience parfaite en mer',
      withoutLicense: {
        title: 'Bateaux sans Permis',
        description: 'Parfaits pour les débutants. Faciles à manœuvrer et sûrs.',
      },
      withLicense: {
        title: 'Bateaux avec Permis',
        description: 'Embarcations plus grandes et puissantes pour navigateurs expérimentés.',
      },
      includes: {
        title: 'Tout Inclus',
        description: 'Carburant, tuba, paddle surf et équipement de sécurité inclus.',
      },
      security: {
        title: 'Sécurité Maximale',
        description: 'Bateaux inspectés quotidiennement et équipement de sécurité homologué.',
      },
    },
    contact: {
      title: 'Contactez-Nous',
      subtitle: 'Nous serons ravis de vous aider à planifier votre journée parfaite en mer',
      name: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      message: 'Message',
      send: 'Envoyer Message',
      whatsapp: 'WhatsApp',
      location: 'Port de Blanes, Girona',
      schedule: 'Horaires',
      scheduleTime: 'Saison: Avril - Octobre',
    },
    footer: {
      company: 'Costa Brava Rent a Boat - Blanes',
      description: 'Location de bateaux avec et sans permis à Blanes, Costa Brava.',
      quickLinks: 'Liens Rapides',
      contact: 'Contact',
      followUs: 'Suivez-Nous',
      rights: 'Tous droits réservés.',
      terms: 'Conditions Générales',
      privacy: 'Politique de Confidentialité',
      whatsappInfo: 'Information par WhatsApp',
    },
    booking: {
      title: 'Demandez votre réservation!',
      modalSubtitle: 'Complétez les détails pour demander la réservation de votre bateau',
      selectBoat: 'Sélectionner Bateau',
      dateTime: 'Date et Heure',
      customerDetails: 'Détails Client',
      payment: 'Paiement',
      confirmation: 'Confirmation',
      date: 'Date',
      time: 'Heure',
      duration: 'Durée',
      extras: 'Extras',
      customerInfo: 'Information Client',
      total: 'Total',
      payNow: 'Payer Maintenant',
      backToFleet: 'Retour à la Flotte',
      next: 'Suivant',
      back: 'Retour',
      complete: 'Terminer',
      firstName: 'Prénom',
      lastName: 'Nom de famille',
      phone: 'Téléphone',
      emailLabel: 'Email',
      numberOfPeople: 'Personnes',
      preferredTime: 'Heure de début',
      selectTime: 'Sélectionner...',
      boat: 'Bateau',
      withLicense: 'Avec Permis',
      withoutLicense: 'Sans Permis',
      select: 'Sélectionner...',
      pricesUpdateByDate: 'Les prix sont mis à jour selon la date',
      sendBookingRequest: 'ENVOYER DEMANDE DE RÉSERVATION',
      people: 'personnes',
      firstNameRequired: 'Champ requis: Prénom',
      firstNameRequiredDesc: 'Veuillez entrer votre prénom',
      lastNameRequired: 'Champ requis: Nom',
      lastNameRequiredDesc: 'Veuillez entrer votre nom de famille',
      phoneRequired: 'Champ requis: Téléphone',
      phoneRequiredDesc: 'Veuillez entrer votre numéro de téléphone',
      emailRequired: 'Champ requis: Email',
      emailRequiredDesc: 'Veuillez entrer votre email',
      emailInvalid: 'Email invalide',
      emailInvalidDesc: 'Veuillez entrer un email valide',
      peopleRequired: 'Champ requis: Personnes',
      peopleRequiredDesc: 'Veuillez indiquer le nombre de personnes',
      timeRequired: 'Champ requis: Heure',
      timeRequiredDesc: 'Veuillez sélectionner une heure de début',
    },
    faq: {
      title: 'Questions Fréquentes',
      subtitle: 'Trouvez des réponses à toutes vos questions sur la location de bateaux à Blanes, Costa Brava.',
      askQuestion: 'Poser une Question',
      bookNow: 'Réserver Maintenant',
      moreQuestions: 'Plus de Questions?',
      pricing: {
        title: 'Réservations et Prix',
        questions: {
          prices: 'Quels sont les prix de location?',
          howToBook: 'Comment puis-je faire une réservation?',
          payment: 'Quels moyens de paiement acceptez-vous?',
          cancellation: 'Quelle est la politique d\'annulation?',
        },
      },
      licenses: {
        title: 'Permis et Exigences',
        questions: {
          withoutLicense: 'Puis-je louer sans permis bateau?',
          withLicense: 'Quels permis acceptez-vous pour les grands bateaux?',
          minAge: 'Quel est l\'âge minimum pour louer?',
          experience: 'Ai-je besoin d\'expérience de navigation préalable?',
        },
      },
      includes: {
        title: 'Ce qui est Inclus dans la Location',
        questions: {
          included: 'Qu\'est-ce qui est inclus dans le prix?',
          fuel: 'Dois-je payer du carburant supplémentaire?',
          extras: 'Quels extras puis-je ajouter?',
          bring: 'Que dois-je apporter?',
        },
      },
      navigation: {
        title: 'Navigation et Sécurité',
        questions: {
          zone: 'Où puis-je naviguer?',
          safety: 'Quelles mesures de sécurité avez-vous?',
          weather: 'Que se passe-t-il s\'il fait mauvais temps?',
          emergency: 'Que faire en cas d\'urgence?',
        },
      },
      practical: {
        title: 'Information Pratique',
        questions: {
          schedule: 'Quels sont les horaires disponibles?',
          arrival: 'Quand dois-je arriver au port?',
          parking: 'Y a-t-il un parking disponible?',
          luggage: 'Puis-je laisser des bagages au port?',
        },
      },
      season: {
        title: 'Saison et Disponibilité',
        questions: {
          when: 'Quand la saison est-elle ouverte?',
          availability: 'Comment puis-je vérifier la disponibilité?',
          advance: 'Combien de temps à l\'avance dois-je réserver?',
        },
      },
    },
    common: {
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      yes: 'Oui',
      no: 'Non',
      close: 'Fermer',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      save: 'Sauvegarder',
      edit: 'Modifier',
      delete: 'Supprimer',
      search: 'Rechercher',
      filter: 'Filtrer',
      sort: 'Trier',
      showMore: 'Voir plus',
      showLess: 'Voir moins',
    },
    breadcrumbs: {
      home: 'Accueil',
      boats: 'Bateaux',
      locations: 'Emplacements',
      categories: 'Catégories',
      legal: 'Légal',
      faq: 'FAQ',
      categoryLicenseFree: 'Bateaux Sans Permis',
      categoryLicensed: 'Bateaux Avec Permis',
      locationBlanes: 'Blanes',
      locationLloret: 'Lloret de Mar',
      locationTossa: 'Tossa de Mar',
      privacyPolicy: 'Politique de Confidentialité',
      termsConditions: 'Conditions Générales',
    },
    availability: {
      title: 'Disponibilité',
      available: 'Disponible',
      partial: 'Partiel',
      booked: 'Réservé',
      offSeason: 'Hors saison',
      slotsFor: 'Horaires pour le',
      noSlots: 'Aucun créneau disponible pour cette date',
      selectDay: 'Sélectionnez un jour pour voir les créneaux disponibles',
    },
    gallery: {
      title: 'Galerie Photos',
      subtitle: 'Photos de nos clients profitant de la Costa Brava',
      sharePhoto: 'Partagez votre photo',
      noPhotos: 'Pas encore de photos. Soyez le premier a partager!',
      submitTitle: 'Partagez votre photo',
      photo: 'Photo',
      yourName: 'Votre nom',
      caption: 'Description (optionnel)',
      boat: 'Bateau',
      tripDate: 'Date',
      submit: 'Envoyer la photo',
    },
    routes: {
      title: 'Itineraires Suggeres',
      subtitle: 'Decouvrez les meilleures routes en bateau depuis le port de Blanes',
      bookBoat: 'Reserver un bateau',
    },
  },

  de: {
    nav: {
      home: 'Startseite',
      fleet: 'Flotte',
      booking: 'Buchung',
      contact: 'Kontakt',
      faq: 'FAQ',
      viewComponents: 'Komponenten Anzeigen',
    },
    hero: {
      title: 'Bootsverleih in Blanes, Costa Brava',
      subtitle: 'Entdecken Sie die schönsten Buchten der Costa Brava mit unseren Booten mit und ohne Führerschein. Abfahrt vom Hafen Blanes.',
      bookNow: 'Jetzt Buchen',
      viewFleet: 'Flotte Anzeigen',
    },
    
    fleet: {
      title: 'Unsere Mietflotte in Blanes',
      subtitle: 'Entdecken Sie unsere Mietflotte von Booten mit und ohne Führerschein in Blanes, Costa Brava.',
      helpText: 'Brauchen Sie Hilfe bei der Auswahl Ihrer Bootsvermietung in Blanes?',
      callButton: 'Anrufen +34 611 500 372',
    },
    boats: {
      viewDetails: 'Details anzeigen',
      book: 'Buchen',
      notAvailable: 'Nicht verfügbar',
      from: 'ab',
      upTo: 'Bis zu',
      people: 'Pers.',
      hours: '1-8 Stunden',
      hoursWithLicense: '2-8h',
      hoursTooltip: 'Wählen Sie zwischen 2h, 4h oder 8h, um unser {boatName} zu mieten',
      withLicense: 'Mit Führerschein',
      withoutLicense: 'Ohne Führerschein',
      available: 'Verfügbar',
      occupied: 'Besetzt',
      more: 'mehr',
    },
    features: {
      title: 'Warum Costa Brava Rent a Boat Wählen',
      subtitle: 'Alles was Sie für ein perfektes Seeerlebnis brauchen',
      withoutLicense: {
        title: 'Boote ohne Führerschein',
        description: 'Perfekt für Anfänger. Einfach zu handhaben und sicher.',
      },
      withLicense: {
        title: 'Boote mit Führerschein',
        description: 'Größere und kraftvollere Boote für erfahrene Seefahrer.',
      },
      includes: {
        title: 'Alles Inklusive',
        description: 'Kraftstoff, Schnorchel, Paddle Surf und Sicherheitsausrüstung inklusive.',
      },
      security: {
        title: 'Maximale Sicherheit',
        description: 'Täglich geprüfte Boote und zertifizierte Sicherheitsausrüstung.',
      },
    },
    contact: {
      title: 'Kontaktieren Sie Uns',
      subtitle: 'Wir helfen Ihnen gerne bei der Planung Ihres perfekten Tages auf See',
      name: 'Name',
      email: 'E-Mail',
      phone: 'Telefon',
      message: 'Nachricht',
      send: 'Nachricht Senden',
      whatsapp: 'WhatsApp',
      location: 'Hafen Blanes, Girona',
      schedule: 'Öffnungszeiten',
      scheduleTime: 'Saison: April - Oktober',
    },
    footer: {
      company: 'Costa Brava Rent a Boat - Blanes',
      description: 'Bootsverleih mit und ohne Führerschein in Blanes, Costa Brava.',
      quickLinks: 'Schnelllinks',
      contact: 'Kontakt',
      followUs: 'Folgen Sie Uns',
      rights: 'Alle Rechte vorbehalten.',
      terms: 'Geschäftsbedingungen',
      privacy: 'Datenschutzrichtlinie',
      whatsappInfo: 'Information über WhatsApp',
    },
    booking: {
      title: 'Fordern Sie Ihre Buchung an!',
      modalSubtitle: 'Füllen Sie die Details aus, um Ihre Bootsbuchung anzufordern',
      selectBoat: 'Boot Auswählen',
      dateTime: 'Datum & Uhrzeit',
      customerDetails: 'Kundendaten',
      payment: 'Zahlung',
      confirmation: 'Bestätigung',
      date: 'Datum',
      time: 'Uhrzeit',
      duration: 'Dauer',
      extras: 'Extras',
      customerInfo: 'Kundeninformation',
      total: 'Gesamt',
      payNow: 'Jetzt Bezahlen',
      backToFleet: 'Zurück zur Flotte',
      next: 'Weiter',
      back: 'Zurück',
      complete: 'Abschließen',
      firstName: 'Vorname',
      lastName: 'Nachname',
      phone: 'Telefon',
      emailLabel: 'E-Mail',
      numberOfPeople: 'Personen',
      preferredTime: 'Startzeit',
      selectTime: 'Auswählen...',
      boat: 'Boot',
      withLicense: 'Mit Lizenz',
      withoutLicense: 'Ohne Lizenz',
      select: 'Auswählen...',
      pricesUpdateByDate: 'Die Preise werden je nach Datum aktualisiert',
      sendBookingRequest: 'BUCHUNGSANFRAGE SENDEN',
      people: 'Personen',
      firstNameRequired: 'Pflichtfeld: Vorname',
      firstNameRequiredDesc: 'Bitte geben Sie Ihren Vornamen ein',
      lastNameRequired: 'Pflichtfeld: Nachname',
      lastNameRequiredDesc: 'Bitte geben Sie Ihren Nachnamen ein',
      phoneRequired: 'Pflichtfeld: Telefon',
      phoneRequiredDesc: 'Bitte geben Sie Ihre Telefonnummer ein',
      emailRequired: 'Pflichtfeld: E-Mail',
      emailRequiredDesc: 'Bitte geben Sie Ihre E-Mail-Adresse ein',
      emailInvalid: 'Ungültige E-Mail',
      emailInvalidDesc: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
      peopleRequired: 'Pflichtfeld: Personen',
      peopleRequiredDesc: 'Bitte geben Sie die Anzahl der Personen an',
      timeRequired: 'Pflichtfeld: Uhrzeit',
      timeRequiredDesc: 'Bitte wählen Sie eine Startzeit',
    },
    faq: {
      title: 'Häufig Gestellte Fragen',
      subtitle: 'Finden Sie Antworten auf alle Ihre Fragen zur Bootsvermietung in Blanes, Costa Brava.',
      askQuestion: 'Frage Stellen',
      bookNow: 'Jetzt Buchen',
      moreQuestions: 'Weitere Fragen?',
      pricing: {
        title: 'Buchungen und Preise',
        questions: {
          prices: 'Was sind die Mietpreise?',
          howToBook: 'Wie kann ich eine Buchung vornehmen?',
          payment: 'Welche Zahlungsmethoden akzeptieren Sie?',
          cancellation: 'Was ist die Stornierungsrichtlinie?',
        },
      },
      licenses: {
        title: 'Lizenzen und Anforderungen',
        questions: {
          withoutLicense: 'Kann ich ohne Bootsführerschein mieten?',
          withLicense: 'Welche Lizenzen akzeptieren Sie für große Boote?',
          minAge: 'Was ist das Mindestalter zum Mieten?',
          experience: 'Brauche ich vorherige Segelerfahrung?',
        },
      },
      includes: {
        title: 'Was ist in der Miete Enthalten',
        questions: {
          included: 'Was ist im Preis enthalten?',
          fuel: 'Muss ich extra Kraftstoff bezahlen?',
          extras: 'Welche Extras kann ich hinzufügen?',
          bring: 'Was sollte ich mitbringen?',
        },
      },
      navigation: {
        title: 'Navigation und Sicherheit',
        questions: {
          zone: 'Wo kann ich navigieren?',
          safety: 'Welche Sicherheitsmaßnahmen haben Sie?',
          weather: 'Was passiert bei schlechtem Wetter?',
          emergency: 'Was mache ich in einem Notfall?',
        },
      },
      practical: {
        title: 'Praktische Information',
        questions: {
          schedule: 'Was sind die verfügbaren Zeiten?',
          arrival: 'Wann sollte ich am Hafen ankommen?',
          parking: 'Ist Parking verfügbar?',
          luggage: 'Kann ich Gepäck am Hafen lassen?',
        },
      },
      season: {
        title: 'Saison und Verfügbarkeit',
        questions: {
          when: 'Wann ist die Saison geöffnet?',
          availability: 'Wie kann ich die Verfügbarkeit prüfen?',
          advance: 'Wie weit im Voraus sollte ich buchen?',
        },
      },
    },
    common: {
      loading: 'Laden...',
      error: 'Fehler',
      success: 'Erfolg',
      yes: 'Ja',
      no: 'Nein',
      close: 'Schließen',
      cancel: 'Abbrechen',
      confirm: 'Bestätigen',
      save: 'Speichern',
      edit: 'Bearbeiten',
      delete: 'Löschen',
      search: 'Suchen',
      filter: 'Filtern',
      sort: 'Sortieren',
      showMore: 'Mehr anzeigen',
      showLess: 'Weniger anzeigen',
    },
    breadcrumbs: {
      home: 'Startseite',
      boats: 'Boote',
      locations: 'Standorte',
      categories: 'Kategorien',
      legal: 'Rechtliches',
      faq: 'FAQ',
      categoryLicenseFree: 'Boote ohne Führerschein',
      categoryLicensed: 'Boote mit Führerschein',
      locationBlanes: 'Blanes',
      locationLloret: 'Lloret de Mar',
      locationTossa: 'Tossa de Mar',
      privacyPolicy: 'Datenschutz',
      termsConditions: 'Geschäftsbedingungen',
    },
    availability: {
      title: 'Verfügbarkeit',
      available: 'Verfügbar',
      partial: 'Teilweise',
      booked: 'Gebucht',
      offSeason: 'Nebensaison',
      slotsFor: 'Zeitfenster für',
      noSlots: 'Keine Zeitfenster für dieses Datum verfügbar',
      selectDay: 'Wählen Sie einen Tag, um verfügbare Zeitfenster zu sehen',
    },
    gallery: {
      title: 'Fotogalerie',
      subtitle: 'Fotos unserer Kunden an der Costa Brava',
      sharePhoto: 'Teilen Sie Ihr Foto',
      noPhotos: 'Noch keine Fotos. Seien Sie der Erste!',
      submitTitle: 'Teilen Sie Ihr Foto',
      photo: 'Foto',
      yourName: 'Ihr Name',
      caption: 'Beschreibung (optional)',
      boat: 'Boot',
      tripDate: 'Datum',
      submit: 'Foto senden',
    },
    routes: {
      title: 'Vorgeschlagene Routen',
      subtitle: 'Entdecken Sie die besten Bootsrouten ab dem Hafen von Blanes',
      bookBoat: 'Boot buchen',
    },
  },

  nl: {
    nav: {
      home: 'Home',
      fleet: 'Vloot',
      booking: 'Boeking',
      contact: 'Contact',
      faq: 'FAQ',
      viewComponents: 'Componenten Bekijken',
    },
    hero: {
      title: 'Bootverhuur in Blanes, Costa Brava',
      subtitle: 'Ontdek de mooiste baaien van Costa Brava met onze boten met en zonder vaarbewijs. Vertrek vanuit Haven van Blanes.',
      bookNow: 'Nu Boeken',
      viewFleet: 'Vloot Bekijken',
    },
    
    fleet: {
      title: 'Onze huurvloot in Blanes',
      subtitle: 'Ontdek onze huurvloot van boten met en zonder vergunning in Blanes, Costa Brava.',
      helpText: 'Heeft u hulp nodig bij het kiezen van uw bootverhuur in Blanes?',
      callButton: 'Bel +34 611 500 372',
    },
    boats: {
      viewDetails: 'Details bekijken',
      book: 'Boeken',
      notAvailable: 'Niet beschikbaar',
      from: 'vanaf',
      upTo: 'Tot',
      people: 'pers.',
      hours: '1-8 uren',
      hoursWithLicense: '2-8h',
      hoursTooltip: 'Kies tussen 2u, 4u of 8u om onze {boatName} te huren',
      withLicense: 'Met vaarbewijs',
      withoutLicense: 'Zonder vaarbewijs',
      available: 'Beschikbaar',
      occupied: 'Bezet',
      more: 'meer',
    },
    features: {
      title: 'Waarom Kiezen voor Costa Brava Rent a Boat',
      subtitle: 'Alles wat je nodig hebt voor een perfecte zee-ervaring',
      withoutLicense: {
        title: 'Boten zonder Vaarbewijs',
        description: 'Perfect voor beginners. Gemakkelijk te besturen en veilig.',
      },
      withLicense: {
        title: 'Boten met Vaarbewijs',
        description: 'Grotere en krachtigere boten voor ervaren zeilers.',
      },
      includes: {
        title: 'Alles Inbegrepen',
        description: 'Brandstof, snorkel, paddle surf en veiligheidsuitrusting inbegrepen.',
      },
      security: {
        title: 'Maximale Veiligheid',
        description: 'Dagelijks geïnspecteerde boten en gecertificeerde veiligheidsuitrusting.',
      },
    },
    contact: {
      title: 'Neem Contact Op',
      subtitle: 'We helpen je graag bij het plannen van je perfecte dag op zee',
      name: 'Naam',
      email: 'E-mail',
      phone: 'Telefoon',
      message: 'Bericht',
      send: 'Bericht Verzenden',
      whatsapp: 'WhatsApp',
      location: 'Haven Blanes, Girona',
      schedule: 'Openingstijden',
      scheduleTime: 'Seizoen: April - Oktober',
    },
    footer: {
      company: 'Costa Brava Rent a Boat - Blanes',
      description: 'Bootverhuur met en zonder vaarbewijs in Blanes, Costa Brava.',
      quickLinks: 'Snelle Links',
      contact: 'Contact',
      followUs: 'Volg Ons',
      rights: 'Alle rechten voorbehouden.',
      terms: 'Algemene Voorwaarden',
      privacy: 'Privacybeleid',
      whatsappInfo: 'Informatie via WhatsApp',
    },
    booking: {
      title: 'Vraag uw boeking aan!',
      modalSubtitle: 'Vul de gegevens in om uw bootboeking aan te vragen',
      selectBoat: 'Boot Selecteren',
      dateTime: 'Datum & Tijd',
      customerDetails: 'Klantgegevens',
      payment: 'Betaling',
      confirmation: 'Bevestiging',
      date: 'Datum',
      time: 'Tijd',
      duration: 'Duur',
      extras: 'Extra\'s',
      customerInfo: 'Klantinformatie',
      total: 'Totaal',
      payNow: 'Nu Betalen',
      backToFleet: 'Terug naar Vloot',
      next: 'Volgende',
      back: 'Terug',
      complete: 'Voltooien',
      firstName: 'Voornaam',
      lastName: 'Achternaam',
      phone: 'Telefoon',
      emailLabel: 'E-mail',
      numberOfPeople: 'Personen',
      preferredTime: 'Starttijd',
      selectTime: 'Selecteren...',
      boat: 'Boot',
      withLicense: 'Met Vaarbewijs',
      withoutLicense: 'Zonder Vaarbewijs',
      select: 'Selecteren...',
      pricesUpdateByDate: 'Prijzen worden bijgewerkt op basis van de datum',
      sendBookingRequest: 'BOEKINGSVERZOEK VERZENDEN',
      people: 'personen',
      firstNameRequired: 'Verplicht: Voornaam',
      firstNameRequiredDesc: 'Voer uw voornaam in',
      lastNameRequired: 'Verplicht: Achternaam',
      lastNameRequiredDesc: 'Voer uw achternaam in',
      phoneRequired: 'Verplicht: Telefoon',
      phoneRequiredDesc: 'Voer uw telefoonnummer in',
      emailRequired: 'Verplicht: E-mail',
      emailRequiredDesc: 'Voer uw e-mailadres in',
      emailInvalid: 'Ongeldig e-mail',
      emailInvalidDesc: 'Voer een geldig e-mailadres in',
      peopleRequired: 'Verplicht: Personen',
      peopleRequiredDesc: 'Geef het aantal personen aan',
      timeRequired: 'Verplicht: Tijd',
      timeRequiredDesc: 'Selecteer een starttijd',
    },
    faq: {
      title: 'Veelgestelde Vragen',
      subtitle: 'Vind antwoorden op al je vragen over bootverhuur in Blanes, Costa Brava.',
      askQuestion: 'Vraag Stellen',
      bookNow: 'Nu Boeken',
      moreQuestions: 'Meer Vragen?',
      pricing: {
        title: 'Boekingen en Prijzen',
        questions: {
          prices: 'Wat zijn de huurprijzen?',
          howToBook: 'Hoe kan ik een boeking maken?',
          payment: 'Welke betaalmethoden accepteren jullie?',
          cancellation: 'Wat is het annuleringsbeleid?',
        },
      },
      licenses: {
        title: 'Vergunningen en Vereisten',
        questions: {
          withoutLicense: 'Kan ik huren zonder vaarbewijs?',
          withLicense: 'Welke vergunningen accepteren jullie voor grote boten?',
          minAge: 'Wat is de minimumleeftijd om te huren?',
          experience: 'Heb ik eerdere zeilervaring nodig?',
        },
      },
      includes: {
        title: 'Wat is Inbegrepen in de Huur',
        questions: {
          included: 'Wat is inbegrepen in de prijs?',
          fuel: 'Moet ik extra brandstof betalen?',
          extras: 'Welke extra\'s kan ik toevoegen?',
          bring: 'Wat moet ik meenemen?',
        },
      },
      navigation: {
        title: 'Navigatie en Veiligheid',
        questions: {
          zone: 'Waar kan ik navigeren?',
          safety: 'Welke veiligheidsmaatregelen hebben jullie?',
          weather: 'Wat gebeurt er bij slecht weer?',
          emergency: 'Wat doe ik in geval van nood?',
        },
      },
      practical: {
        title: 'Praktische Informatie',
        questions: {
          schedule: 'Wat zijn de beschikbare tijden?',
          arrival: 'Wanneer moet ik bij de haven aankomen?',
          parking: 'Is er parking beschikbaar?',
          luggage: 'Kan ik bagage bij de haven achterlaten?',
        },
      },
      season: {
        title: 'Seizoen en Beschikbaarheid',
        questions: {
          when: 'Wanneer is het seizoen open?',
          availability: 'Hoe kan ik beschikbaarheid controleren?',
          advance: 'Hoe ver van tevoren moet ik boeken?',
        },
      },
    },
    common: {
      loading: 'Laden...',
      error: 'Fout',
      success: 'Succes',
      yes: 'Ja',
      no: 'Nee',
      close: 'Sluiten',
      cancel: 'Annuleren',
      confirm: 'Bevestigen',
      save: 'Opslaan',
      edit: 'Bewerken',
      delete: 'Verwijderen',
      search: 'Zoeken',
      filter: 'Filteren',
      sort: 'Sorteren',
      showMore: 'Meer tonen',
      showLess: 'Minder tonen',
    },
    breadcrumbs: {
      home: 'Home',
      boats: 'Boten',
      locations: 'Locaties',
      categories: 'Categorieën',
      legal: 'Juridisch',
      faq: 'FAQ',
      categoryLicenseFree: 'Boten zonder Vaarbewijs',
      categoryLicensed: 'Boten met Vaarbewijs',
      locationBlanes: 'Blanes',
      locationLloret: 'Lloret de Mar',
      locationTossa: 'Tossa de Mar',
      privacyPolicy: 'Privacybeleid',
      termsConditions: 'Algemene Voorwaarden',
    },
    availability: {
      title: 'Beschikbaarheid',
      available: 'Beschikbaar',
      partial: 'Gedeeltelijk',
      booked: 'Geboekt',
      offSeason: 'Buiten seizoen',
      slotsFor: 'Tijdsloten voor',
      noSlots: 'Geen tijdsloten beschikbaar voor deze datum',
      selectDay: 'Selecteer een dag om beschikbare tijdsloten te zien',
    },
    gallery: {
      title: 'Fotogalerij',
      subtitle: "Foto's van onze klanten die genieten van de Costa Brava",
      sharePhoto: 'Deel je foto',
      noPhotos: 'Nog geen fotos. Wees de eerste om te delen!',
      submitTitle: 'Deel je foto',
      photo: 'Foto',
      yourName: 'Je naam',
      caption: 'Beschrijving (optioneel)',
      boat: 'Boot',
      tripDate: 'Datum',
      submit: 'Foto versturen',
    },
    routes: {
      title: 'Voorgestelde Routes',
      subtitle: 'Ontdek de beste bootroutes vanuit de haven van Blanes',
      bookBoat: 'Boot boeken',
    },
  },

  it: {
    nav: {
      home: 'Home',
      fleet: 'Flotta',
      booking: 'Prenotazione',
      contact: 'Contatto',
      faq: 'FAQ',
      viewComponents: 'Visualizza Componenti',
    },
    hero: {
      title: 'Noleggio Barche a Blanes, Costa Brava',
      subtitle: 'Scopri le più belle calette della Costa Brava con le nostre barche con e senza patente. Partenze dal Porto di Blanes.',
      bookNow: 'Prenota Ora',
      viewFleet: 'Visualizza Flotta',
    },
    
    fleet: {
      title: 'La nostra flotta di noleggio a Blanes',
      subtitle: 'Scopri la nostra flotta di noleggio di barche con e senza patente a Blanes, Costa Brava.',
      helpText: 'Hai bisogno di aiuto per scegliere il tuo noleggio barche a Blanes?',
      callButton: 'Chiama +34 611 500 372',
    },
    boats: {
      viewDetails: 'Vedi dettagli',
      book: 'Prenota',
      notAvailable: 'Non disponibile',
      from: 'da',
      upTo: 'Fino a',
      people: 'pax',
      hours: '1-8 ore',
      hoursWithLicense: '2-8h',
      hoursTooltip: 'Scegli tra 2h, 4h o 8h per noleggiare la nostra {boatName}',
      withLicense: 'Con patente',
      withoutLicense: 'Senza patente',
      available: 'Disponibile',
      occupied: 'Occupato',
      more: 'altro',
    },
    features: {
      title: 'Perché Scegliere Costa Brava Rent a Boat',
      subtitle: 'Tutto ciò di cui hai bisogno per un\'esperienza perfetta in mare',
      withoutLicense: {
        title: 'Barche senza Patente',
        description: 'Perfette per principianti. Facili da manovrare e sicure.',
      },
      withLicense: {
        title: 'Barche con Patente',
        description: 'Imbarcazioni più grandi e potenti per navigatori esperti.',
      },
      includes: {
        title: 'Tutto Incluso',
        description: 'Carburante, snorkel, paddle surf e attrezzature di sicurezza inclusi.',
      },
      security: {
        title: 'Massima Sicurezza',
        description: 'Barche ispezionate quotidianamente e attrezzature di sicurezza certificate.',
      },
    },
    contact: {
      title: 'Contattaci',
      subtitle: 'Saremo felici di aiutarti a pianificare la tua giornata perfetta in mare',
      name: 'Nome',
      email: 'Email',
      phone: 'Telefono',
      message: 'Messaggio',
      send: 'Invia Messaggio',
      whatsapp: 'WhatsApp',
      location: 'Porto di Blanes, Girona',
      schedule: 'Orari',
      scheduleTime: 'Stagione: Aprile - Ottobre',
    },
    footer: {
      company: 'Costa Brava Rent a Boat - Blanes',
      description: 'Noleggio barche con e senza patente a Blanes, Costa Brava.',
      quickLinks: 'Link Veloci',
      contact: 'Contatto',
      followUs: 'Seguici',
      rights: 'Tutti i diritti riservati.',
      terms: 'Termini e Condizioni',
      privacy: 'Politica Privacy',
      whatsappInfo: 'Informazioni via WhatsApp',
    },
    booking: {
      title: 'Richiedi la tua prenotazione!',
      modalSubtitle: 'Completa i dettagli per richiedere la prenotazione della tua barca',
      selectBoat: 'Seleziona Barca',
      dateTime: 'Data e Ora',
      customerDetails: 'Dettagli Cliente',
      payment: 'Pagamento',
      confirmation: 'Conferma',
      date: 'Data',
      time: 'Ora',
      duration: 'Durata',
      extras: 'Extra',
      customerInfo: 'Informazioni Cliente',
      total: 'Totale',
      payNow: 'Paga Ora',
      backToFleet: 'Torna alla Flotta',
      next: 'Avanti',
      back: 'Indietro',
      complete: 'Completa',
      firstName: 'Nome',
      lastName: 'Cognome',
      phone: 'Telefono',
      emailLabel: 'Email',
      numberOfPeople: 'Persone',
      preferredTime: 'Ora di inizio',
      selectTime: 'Selezionare...',
      boat: 'Barca',
      withLicense: 'Con Licenza',
      withoutLicense: 'Senza Licenza',
      select: 'Selezionare...',
      pricesUpdateByDate: 'I prezzi si aggiornano in base alla data',
      sendBookingRequest: 'INVIA RICHIESTA DI PRENOTAZIONE',
      people: 'persone',
      firstNameRequired: 'Campo obbligatorio: Nome',
      firstNameRequiredDesc: 'Inserisci il tuo nome',
      lastNameRequired: 'Campo obbligatorio: Cognome',
      lastNameRequiredDesc: 'Inserisci il tuo cognome',
      phoneRequired: 'Campo obbligatorio: Telefono',
      phoneRequiredDesc: 'Inserisci il tuo numero di telefono',
      emailRequired: 'Campo obbligatorio: Email',
      emailRequiredDesc: 'Inserisci la tua email',
      emailInvalid: 'Email non valida',
      emailInvalidDesc: 'Inserisci un email valido',
      peopleRequired: 'Campo obbligatorio: Persone',
      peopleRequiredDesc: 'Indica il numero di persone',
      timeRequired: 'Campo obbligatorio: Ora',
      timeRequiredDesc: 'Seleziona un orario di inizio',
    },
    faq: {
      title: 'Domande Frequenti',
      subtitle: 'Trova risposte a tutte le tue domande sul noleggio barche a Blanes, Costa Brava.',
      askQuestion: 'Fai una Domanda',
      bookNow: 'Prenota Ora',
      moreQuestions: 'Altre Domande?',
      pricing: {
        title: 'Prenotazioni e Prezzi',
        questions: {
          prices: 'Quali sono i prezzi di noleggio?',
          howToBook: 'Come posso fare una prenotazione?',
          payment: 'Quali metodi di pagamento accettate?',
          cancellation: 'Qual è la politica di cancellazione?',
        },
      },
      licenses: {
        title: 'Patenti e Requisiti',
        questions: {
          withoutLicense: 'Posso noleggiare senza patente nautica?',
          withLicense: 'Quali patenti accettate per barche grandi?',
          minAge: 'Qual è l\'età minima per noleggiare?',
          experience: 'Ho bisogno di esperienza di navigazione precedente?',
        },
      },
      includes: {
        title: 'Cosa è Incluso nel Noleggio',
        questions: {
          included: 'Cosa è incluso nel prezzo?',
          fuel: 'Devo pagare carburante extra?',
          extras: 'Quali extra posso aggiungere?',
          bring: 'Cosa devo portare?',
        },
      },
      navigation: {
        title: 'Navigazione e Sicurezza',
        questions: {
          zone: 'Dove posso navigare?',
          safety: 'Quali misure di sicurezza avete?',
          weather: 'Cosa succede se fa brutto tempo?',
          emergency: 'Cosa faccio in caso di emergenza?',
        },
      },
      practical: {
        title: 'Informazioni Pratiche',
        questions: {
          schedule: 'Quali sono gli orari disponibili?',
          arrival: 'Quando devo arrivare al porto?',
          parking: 'C\'è parcheggio disponibile?',
          luggage: 'Posso lasciare bagagli al porto?',
        },
      },
      season: {
        title: 'Stagione e Disponibilità',
        questions: {
          when: 'Quando è aperta la stagione?',
          availability: 'Come posso controllare la disponibilità?',
          advance: 'Con quanto anticipo devo prenotare?',
        },
      },
    },
    common: {
      loading: 'Caricamento...',
      error: 'Errore',
      success: 'Successo',
      yes: 'Sì',
      no: 'No',
      close: 'Chiudi',
      cancel: 'Annulla',
      confirm: 'Conferma',
      save: 'Salva',
      edit: 'Modifica',
      delete: 'Elimina',
      search: 'Cerca',
      filter: 'Filtra',
      sort: 'Ordina',
      showMore: 'Mostra di più',
      showLess: 'Mostra di meno',
    },
    breadcrumbs: {
      home: 'Home',
      boats: 'Barche',
      locations: 'Posizioni',
      categories: 'Categorie',
      legal: 'Legale',
      faq: 'FAQ',
      categoryLicenseFree: 'Barche senza Patente',
      categoryLicensed: 'Barche con Patente',
      locationBlanes: 'Blanes',
      locationLloret: 'Lloret de Mar',
      locationTossa: 'Tossa de Mar',
      privacyPolicy: 'Privacy Policy',
      termsConditions: 'Termini e Condizioni',
    },
    availability: {
      title: 'Disponibilità',
      available: 'Disponibile',
      partial: 'Parziale',
      booked: 'Prenotato',
      offSeason: 'Fuori stagione',
      slotsFor: 'Orari per il',
      noSlots: 'Nessun orario disponibile per questa data',
      selectDay: 'Seleziona un giorno per vedere gli orari disponibili',
    },
    gallery: {
      title: 'Galleria Fotografica',
      subtitle: 'Foto dei nostri clienti che si godono la Costa Brava',
      sharePhoto: 'Condividi la tua foto',
      noPhotos: 'Nessuna foto ancora. Sii il primo a condividere!',
      submitTitle: 'Condividi la tua foto',
      photo: 'Foto',
      yourName: 'Il tuo nome',
      caption: 'Descrizione (opzionale)',
      boat: 'Barca',
      tripDate: 'Data',
      submit: 'Invia foto',
    },
    routes: {
      title: 'Percorsi Suggeriti',
      subtitle: 'Scopri i migliori percorsi in barca dal Porto di Blanes',
      bookBoat: 'Prenota barca',
    },
  },

  ru: {
    nav: {
      home: 'Главная',
      fleet: 'Флот',
      booking: 'Бронирование',
      contact: 'Контакты',
      faq: 'Часто задаваемые вопросы',
      viewComponents: 'Просмотр компонентов',
    },
    hero: {
      title: 'Аренда Лодок в Бланесе, Коста Брава',
      subtitle: 'Откройте для себя лучшие бухты Коста Брава с нашими лодками с лицензией и без лицензии. Отправление из порта Бланес.',
      bookNow: 'Забронировать Сейчас',
      viewFleet: 'Посмотреть Флот',
    },
    
    fleet: {
      title: 'Наш арендный флот в Бланесе',
      subtitle: 'Откройте для себя наш арендный флот лодок с лицензией и без лицензии в Бланесе, Коста-Брава.',
      helpText: 'Нужна помощь в выборе аренды лодки в Бланесе?',
      callButton: 'Звоните +34 611 500 372',
    },
    boats: {
      viewDetails: 'Подробности',
      book: 'Забронировать',
      notAvailable: 'Недоступно',
      from: 'от',
      upTo: 'До',
      people: 'чел.',
      hours: '1-8 часов',
      hoursWithLicense: '2-8h',
      hoursTooltip: 'Выберите между 2ч, 4ч или 8ч для аренды нашей {boatName}',
      withLicense: 'С лицензией',
      withoutLicense: 'Без лицензии',
      available: 'Доступно',
      occupied: 'Занято',
      more: 'еще',
    },
    features: {
      title: 'Почему Выбрать Costa Brava Rent a Boat',
      subtitle: 'Все что вам нужно для идеального морского отдыха',
      withoutLicense: {
        title: 'Лодки без Лицензии',
        description: 'Идеально для новичков. Легкие в управлении и безопасные.',
      },
      withLicense: {
        title: 'Лодки с Лицензией',
        description: 'Более крупные и мощные суда для опытных моряков.',
      },
      includes: {
        title: 'Все Включено',
        description: 'Топливо, снаряжение для сноркелинга, SUP и оборудование безопасности включены.',
      },
      security: {
        title: 'Максимальная Безопасность',
        description: 'Ежедневная проверка лодок и сертифицированное оборудование безопасности.',
      },
    },
    contact: {
      title: 'Свяжитесь с Нами',
      subtitle: 'Мы будем рады помочь вам спланировать идеальный день на море',
      name: 'Имя',
      email: 'Электронная почта',
      phone: 'Телефон',
      message: 'Сообщение',
      send: 'Отправить Сообщение',
      whatsapp: 'WhatsApp',
      location: 'Порт Бланес, Жирона',
      schedule: 'Расписание',
      scheduleTime: 'Сезон: Апрель - Октябрь',
    },
    footer: {
      company: 'Costa Brava Rent a Boat - Blanes',
      description: 'Аренда лодок с лицензией и без лицензии в Бланесе, Коста Брава.',
      quickLinks: 'Быстрые Ссылки',
      contact: 'Контакты',
      followUs: 'Подписывайтесь',
      rights: 'Все права защищены.',
      terms: 'Условия использования',
      privacy: 'Политика конфиденциальности',
      whatsappInfo: 'Информация через WhatsApp',
    },
    booking: {
      title: 'Запросите вашу бронь!',
      modalSubtitle: 'Заполните данные, чтобы запросить бронирование вашей лодки',
      selectBoat: 'Выбрать Лодку',
      dateTime: 'Дата и Время',
      customerDetails: 'Данные Клиента',
      payment: 'Оплата',
      confirmation: 'Подтверждение',
      date: 'Дата',
      time: 'Время',
      duration: 'Продолжительность',
      extras: 'Дополнительно',
      customerInfo: 'Информация о клиенте',
      total: 'Итого',
      payNow: 'Оплатить Сейчас',
      backToFleet: 'Вернуться к Флоту',
      next: 'Далее',
      back: 'Назад',
      complete: 'Завершить',
      firstName: 'Имя',
      lastName: 'Фамилия',
      phone: 'Телефон',
      emailLabel: 'Email',
      numberOfPeople: 'Количество',
      preferredTime: 'Время начала',
      selectTime: 'Выбрать...',
      boat: 'Лодка',
      withLicense: 'С лицензией',
      withoutLicense: 'Без лицензии',
      select: 'Выбрать...',
      pricesUpdateByDate: 'Цены обновляются в зависимости от даты',
      sendBookingRequest: 'ОТПРАВИТЬ ЗАПРОС НА БРОНИРОВАНИЕ',
      people: 'человек',
      firstNameRequired: 'Обязательное поле: Имя',
      firstNameRequiredDesc: 'Пожалуйста, введите ваше имя',
      lastNameRequired: 'Обязательное поле: Фамилия',
      lastNameRequiredDesc: 'Пожалуйста, введите вашу фамилию',
      phoneRequired: 'Обязательное поле: Телефон',
      phoneRequiredDesc: 'Пожалуйста, введите ваш номер телефона',
      emailRequired: 'Обязательное поле: Email',
      emailRequiredDesc: 'Пожалуйста, введите ваш email',
      emailInvalid: 'Неверный email',
      emailInvalidDesc: 'Пожалуйста, введите корректный email',
      peopleRequired: 'Обязательное поле: Количество',
      peopleRequiredDesc: 'Пожалуйста, укажите количество человек',
      timeRequired: 'Обязательное поле: Время',
      timeRequiredDesc: 'Пожалуйста, выберите время начала',
    },
    faq: {
      title: 'Часто Задаваемые Вопросы',
      subtitle: 'Найдите ответы на все ваши вопросы об аренде лодок в Бланесе, Коста Брава.',
      askQuestion: 'Задать Вопрос',
      bookNow: 'Забронировать Сейчас',
      moreQuestions: 'Еще Вопросы?',
      pricing: {
        title: 'Бронирование и Цены',
        questions: {
          prices: 'Какие цены на аренду?',
          howToBook: 'Как я могу забронировать?',
          payment: 'Какие способы оплаты вы принимаете?',
          cancellation: 'Какова политика отмены?',
        },
      },
      licenses: {
        title: 'Лицензии и Требования',
        questions: {
          withoutLicense: 'Могу ли я арендовать без лицензии на лодку?',
          withLicense: 'Какие лицензии вы принимаете для больших лодок?',
          minAge: 'Каков минимальный возраст для аренды?',
          experience: 'Нужен ли мне предыдущий опыт плавания?',
        },
      },
      includes: {
        title: 'Что Включено в Аренду',
        questions: {
          included: 'Что включено в цену?',
          fuel: 'Нужно ли доплачивать за топливо?',
          extras: 'Какие дополнения я могу добавить?',
          bring: 'Что мне нужно принести?',
        },
      },
      navigation: {
        title: 'Навигация и Безопасность',
        questions: {
          zone: 'Где я могу плавать?',
          safety: 'Какие меры безопасности у вас есть?',
          weather: 'Что происходит при плохой погоде?',
          emergency: 'Что делать в случае чрезвычайной ситуации?',
        },
      },
      practical: {
        title: 'Практическая Информация',
        questions: {
          schedule: 'Какие доступны расписания?',
          arrival: 'Когда мне следует прибыть в порт?',
          parking: 'Есть ли парковка?',
          luggage: 'Могу ли я оставить багаж в порту?',
        },
      },
      season: {
        title: 'Сезон и Доступность',
        questions: {
          when: 'Когда открыт сезон?',
          availability: 'Как я могу проверить доступность?',
          advance: 'За сколько времени нужно бронировать?',
        },
      },
    },
    common: {
      loading: 'Загрузка...',
      error: 'Ошибка',
      success: 'Успешно',
      yes: 'Да',
      no: 'Нет',
      close: 'Закрыть',
      cancel: 'Отменить',
      confirm: 'Подтвердить',
      save: 'Сохранить',
      edit: 'Редактировать',
      delete: 'Удалить',
      search: 'Поиск',
      filter: 'Фильтр',
      sort: 'Сортировать',
      showMore: 'Показать больше',
      showLess: 'Показать меньше',
    },
    breadcrumbs: {
      home: 'Главная',
      boats: 'Лодки',
      locations: 'Места',
      categories: 'Категории',
      legal: 'Правовая информация',
      faq: 'FAQ',
      categoryLicenseFree: 'Лодки без Лицензии',
      categoryLicensed: 'Лодки с Лицензией',
      locationBlanes: 'Бланес',
      locationLloret: 'Льорет-де-Мар',
      locationTossa: 'Тосса-де-Мар',
      privacyPolicy: 'Политика Конфиденциальности',
      termsConditions: 'Условия и Положения',
    },
    availability: {
      title: 'Доступность',
      available: 'Доступно',
      partial: 'Частично',
      booked: 'Забронировано',
      offSeason: 'Вне сезона',
      slotsFor: 'Время на',
      noSlots: 'Нет доступных временных слотов на эту дату',
      selectDay: 'Выберите день, чтобы увидеть доступные временные слоты',
    },
    gallery: {
      title: 'Фотогалерея',
      subtitle: 'Фотографии наших клиентов на Коста Брава',
      sharePhoto: 'Поделитесь фото',
      noPhotos: 'Пока нет фотографий. Будьте первым!',
      submitTitle: 'Поделитесь своим фото',
      photo: 'Фото',
      yourName: 'Ваше имя',
      caption: 'Описание (необязательно)',
      boat: 'Лодка',
      tripDate: 'Дата',
      submit: 'Отправить фото',
    },
    routes: {
      title: 'Рекомендуемые Маршруты',
      subtitle: 'Откройте лучшие лодочные маршруты из порта Бланес',
      bookBoat: 'Забронировать лодку',
    },
  },
};

// Translation hook
export function useTranslations() {
  const { language } = useLanguage();
  return translations[language];
}