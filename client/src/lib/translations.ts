import { Language, useLanguage } from '@/hooks/use-language';

export interface Translations {
  // Navigation
  nav: {
    home: string;
    fleet: string;
    booking: string;
    contact: string;
    faq: string;
    giftCards: string;
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
    googleRating: string;
    clients: string;
    insured: string;
    experience: string;
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
    // Extras & Packs
    extrasSection: {
      title: string;
      packs: string;
      individual: string;
      included: string;
      savings: string;
      noPack: string;
      selected: string;
      packSelected: string;
    };
    // Step 4 wizard
    confirmTitle: string;
    confirmSubtitle: string;
    summaryClient: string;
    estimatedTotal: string;
    discountApplied: string;
    priceConfirmedWhatsApp: string;
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
    book: string;
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

  // Gift Card Banner (homepage)
  giftCardBanner: {
    title: string;
    subtitle: string;
    cta: string;
  };

  // Code Validation (booking form)
  codeValidation: {
    haveCode: string;
    enterCode: string;
    validate: string;
    validGiftCard: string;
    validDiscount: string;
    invalidCode: string;
    value: string;
    discount: string;
    applied: string;
    apply: string;
  };

  // Gift Cards
  giftCards: {
    title: string;
    subtitle: string;
    selectAmount: string;
    customAmount: string;
    details: string;
    yourName: string;
    yourEmail: string;
    yourNameRequired: string;
    yourEmailRequired: string;
    recipientInfo: string;
    recipientName: string;
    recipientEmail: string;
    recipientNameRequired: string;
    recipientEmailRequired: string;
    message: string;
    messagePlaceholder: string;
    total: string;
    validOneYear: string;
    allBoats: string;
    buy: string;
    processing: string;
    purchaseSuccess: string;
    purchaseSuccessDesc: string;
    code: string;
    forRecipient: string;
    backHome: string;
    buyAnother: string;
  };

  // Boat Detail Page
  boatDetail: {
    notFound: string;
    backToFleet: string;
    description: string;
    fuelIncluded: string;
    readyForAdventure: string;
    bookNowCTA: string;
    pricesBySeason: string;
    seasonLow: string;
    seasonMid: string;
    seasonHigh: string;
    priceIncludes: string;
    mainFeatures: string;
    noFeatures: string;
    technicalSpecs: string;
    specModel: string;
    specLength: string;
    specBeam: string;
    specEngine: string;
    specFuel: string;
    specCapacity: string;
    specDeposit: string;
    equipmentIncluded: string;
    noEquipment: string;
    licenseFreeAdvantages: string;
    totalAccessibility: string;
    noLicenseNeeded: string;
    quickLearning: string;
    lowerCost: string;
    perfectBeginners: string;
    guaranteedFun: string;
    accessCoves: string;
    idealFamilies: string;
    safeCoastalNavigation: string;
    immediateAvailability: string;
    availableExtras: string;
    extrasNote: string;
    importantInfo: string;
    essentialDoc: string;
    essentialDocLicense: string;
    licenseRequired: string;
    noLicenseRequired: string;
    idealForGroups: string;
    perfectExplore: string;
    fuelInsuranceIncluded: string;
    fuelNotIncluded: string;
    conditions: string;
    rentalConditions: string;
    beforeBooking: string;
    imageAria: string;
  };

  // Booking Wizard Mobile
  wizard: {
    stepBoat: string;
    stepTrip: string;
    stepYourData: string;
    stepConfirm: string;
    chooseYourBoat: string;
    haveNauticalLicense: string;
    withoutLicense: string;
    withLicense: string;
    selectABoat: string;
    selectDate: string;
    yourTrip: string;
    howLongHowMany: string;
    duration: string;
    departureTime: string;
    selectTime: string;
    numberOfPeople: string;
    maxCapacityError: string;
    yourData: string;
    confirmViaWhatsApp: string;
    firstName: string;
    lastName: string;
    phone: string;
    searchCountry: string;
    email: string;
    date: string;
  };

  // Inline validation messages
  validation: {
    required: string;
    invalidEmail: string;
    invalidPhone: string;
    futureDate: string;
    minPeople: string;
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
      giftCards: 'Tarjetas Regalo',
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
      googleRating: '4.8/5 en Google',
      clients: '+5000 clientes',
      insured: 'Asegurado',
      experience: '+5 años exp.',
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
      extrasSection: {
        title: 'Extras y Packs',
        packs: 'Packs con descuento',
        individual: 'Extras individuales',
        included: 'Incluye',
        savings: 'Ahorras',
        noPack: 'Sin pack',
        selected: 'seleccionados',
        packSelected: 'Pack seleccionado',
      },
      confirmTitle: 'Confirmar reserva',
      confirmSubtitle: 'Revisa los detalles y añade extras opcionales',
      summaryClient: 'Cliente',
      estimatedTotal: 'Total estimado',
      discountApplied: 'Descuento aplicado',
      priceConfirmedWhatsApp: 'El precio final se confirma por WhatsApp',
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
      book: 'Reservar',
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
    giftCardBanner: {
      title: 'Regala una experiencia unica en el mar',
      subtitle: 'Tarjetas regalo desde 50EUR. El regalo perfecto para cualquier ocasion.',
      cta: 'Comprar tarjeta regalo',
    },
    codeValidation: {
      haveCode: 'Tienes un codigo de regalo o descuento?',
      enterCode: 'Introduce tu codigo',
      validate: 'Validar',
      validGiftCard: 'Tarjeta regalo valida',
      validDiscount: 'Codigo de descuento valido',
      invalidCode: 'Codigo no valido o expirado',
      value: 'Valor',
      discount: 'Descuento',
      applied: 'Aplicado',
      apply: 'Aplicar',
    },
    giftCards: {
      title: 'Tarjetas Regalo',
      subtitle: 'Regala una experiencia nautica inolvidable en la Costa Brava',
      selectAmount: 'Selecciona importe',
      customAmount: 'Importe personalizado',
      details: 'Tus datos',
      yourName: 'Tu nombre',
      yourEmail: 'Tu email',
      yourNameRequired: 'Tu nombre es obligatorio',
      yourEmailRequired: 'Tu email es obligatorio',
      recipientInfo: 'Datos del destinatario',
      recipientName: 'Nombre del destinatario',
      recipientEmail: 'Email del destinatario',
      recipientNameRequired: 'El nombre del destinatario es obligatorio',
      recipientEmailRequired: 'El email del destinatario es obligatorio',
      message: 'Mensaje personal (opcional)',
      messagePlaceholder: 'Escribe un mensaje para el destinatario...',
      total: 'Total',
      validOneYear: 'Valida durante 1 ano',
      allBoats: 'Canjeable en todos los barcos',
      buy: 'Comprar tarjeta regalo',
      processing: 'Procesando...',
      purchaseSuccess: 'Compra realizada!',
      purchaseSuccessDesc: 'La tarjeta regalo ha sido creada correctamente',
      code: 'Codigo de la tarjeta',
      forRecipient: 'Para',
      backHome: 'Volver al inicio',
      buyAnother: 'Comprar otra',
    },
    boatDetail: {
      notFound: 'Barco no encontrado',
      backToFleet: 'Volver a la flota',
      description: 'Descripcion',
      fuelIncluded: 'Gasolina incluida!',
      readyForAdventure: 'Listo para tu aventura?',
      bookNowCTA: 'Reserva ahora tu {boatName} y disfruta de las calas de la Costa Brava',
      pricesBySeason: 'Precios por Temporada',
      seasonLow: 'Temporada BAJA',
      seasonMid: 'Temporada MEDIA',
      seasonHigh: 'Temporada ALTA',
      priceIncludes: 'El precio incluye:',
      mainFeatures: 'Caracteristicas Principales',
      noFeatures: 'No hay caracteristicas disponibles',
      technicalSpecs: 'Especificaciones Tecnicas',
      specModel: 'Modelo:',
      specLength: 'Eslora:',
      specBeam: 'Manga:',
      specEngine: 'Motor:',
      specFuel: 'Combustible:',
      specCapacity: 'Capacidad:',
      specDeposit: 'Fianza:',
      equipmentIncluded: 'Equipamiento Incluido',
      noEquipment: 'No hay equipamiento disponible',
      licenseFreeAdvantages: 'Ventajas de los Barcos Sin Licencia',
      totalAccessibility: 'Accesibilidad Total',
      noLicenseNeeded: 'No necesitas licencia ni titulacion',
      quickLearning: 'Aprendizaje rapido (15 minutos)',
      lowerCost: 'Menor coste de alquiler',
      perfectBeginners: 'Perfecto para principiantes',
      guaranteedFun: 'Diversion Garantizada',
      accessCoves: 'Acceso a calas y playas desde el mar',
      idealFamilies: 'Ideal para familias con ninos',
      safeCoastalNavigation: 'Navegacion en zona segura costera',
      immediateAvailability: 'Disponibilidad inmediata',
      availableExtras: 'Extras Disponibles',
      extrasNote: 'Puedes anadir cualquiera de estos extras al completar tu reserva online o directamente en el puerto antes de zarpar.',
      importantInfo: 'Informacion Importante',
      essentialDoc: 'Imprescindible: Acudir con documento de identidad o pasaporte en vigor',
      essentialDocLicense: ' y licencia de navegacion original',
      licenseRequired: 'Licencia nautica requerida',
      noLicenseRequired: 'Sin necesidad de licencia nautica',
      idealForGroups: 'Ideal para familias y grupos de hasta {capacity} personas',
      perfectExplore: 'Perfecto para explorar las calas de la Costa Brava',
      fuelInsuranceIncluded: 'Gasolina, seguro y equipo de seguridad incluidos',
      fuelNotIncluded: 'Combustible NO incluido, seguro y equipo de seguridad incluidos',
      conditions: 'Condiciones:',
      rentalConditions: 'las condiciones generales del alquiler',
      beforeBooking: 'antes de hacer tu reserva.',
      imageAria: 'Imagen',
    },
    wizard: {
      stepBoat: 'Barco',
      stepTrip: 'Excursion',
      stepYourData: 'Tus datos',
      stepConfirm: 'Confirmar',
      chooseYourBoat: 'Elige tu barco',
      haveNauticalLicense: 'Tienes licencia nautica?',
      withoutLicense: 'Sin licencia',
      withLicense: 'Con licencia',
      selectABoat: 'Selecciona un barco',
      selectDate: 'Seleccionar fecha',
      yourTrip: 'Tu excursion',
      howLongHowMany: 'Cuanto tiempo y cuantos sois?',
      duration: 'Duracion',
      departureTime: 'Hora de salida',
      selectTime: 'Selecciona hora',
      numberOfPeople: 'Numero de personas',
      maxCapacityError: 'Este barco tiene capacidad para {max} personas como maximo',
      yourData: 'Tus datos',
      confirmViaWhatsApp: 'Para confirmar tu reserva por WhatsApp',
      firstName: 'Nombre',
      lastName: 'Apellidos',
      phone: 'Telefono',
      searchCountry: 'Buscar pais...',
      email: 'Email',
      date: 'Fecha',
    },
    validation: {
      required: 'Este campo es obligatorio',
      invalidEmail: 'Email no valido',
      invalidPhone: 'Solo numeros',
      futureDate: 'Selecciona una fecha futura',
      minPeople: 'Minimo 1 persona',
    },
  },

  ca: {
    nav: {
      home: 'Inici',
      fleet: 'Flota',
      booking: 'Reserva',
      contact: 'Contacte',
      faq: 'FAQ',
      giftCards: 'Targetes Regal',
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
      googleRating: '4.8/5 a Google',
      clients: '+5000 clients',
      insured: 'Assegurat',
      experience: '+5 anys exp.',
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
      extrasSection: {
        title: 'Extres i Packs',
        packs: 'Packs amb descompte',
        individual: 'Extres individuals',
        included: 'Inclou',
        savings: 'Estalvies',
        noPack: 'Sense pack',
        selected: 'seleccionats',
        packSelected: 'Pack seleccionat',
      },
      confirmTitle: 'Confirmar reserva',
      confirmSubtitle: 'Revisa els detalls i afegeix opcionals',
      summaryClient: 'Client',
      estimatedTotal: 'Total estimat',
      discountApplied: 'Descompte aplicat',
      priceConfirmedWhatsApp: 'El preu final es confirma per WhatsApp',
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
      book: 'Reservar',
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
    giftCardBanner: {
      title: 'Regala una experiencia unica al mar',
      subtitle: 'Targetes regal des de 50EUR. El regal perfecte per a qualsevol ocasio.',
      cta: 'Comprar targeta regal',
    },
    codeValidation: {
      haveCode: 'Tens un codi de regal o descompte?',
      enterCode: 'Introdueix el teu codi',
      validate: 'Validar',
      validGiftCard: 'Targeta regal valida',
      validDiscount: 'Codi de descompte valid',
      invalidCode: 'Codi no valid o caducat',
      value: 'Valor',
      discount: 'Descompte',
      applied: 'Aplicat',
      apply: 'Aplicar',
    },
    giftCards: {
      title: 'Targetes Regal',
      subtitle: 'Regala una experiencia nautica inoblidable a la Costa Brava',
      selectAmount: 'Selecciona import',
      customAmount: 'Import personalitzat',
      details: 'Les teves dades',
      yourName: 'El teu nom',
      yourEmail: 'El teu email',
      yourNameRequired: 'El teu nom es obligatori',
      yourEmailRequired: 'El teu email es obligatori',
      recipientInfo: 'Dades del destinatari',
      recipientName: 'Nom del destinatari',
      recipientEmail: 'Email del destinatari',
      recipientNameRequired: 'El nom del destinatari es obligatori',
      recipientEmailRequired: 'L\'email del destinatari es obligatori',
      message: 'Missatge personal (opcional)',
      messagePlaceholder: 'Escriu un missatge per al destinatari...',
      total: 'Total',
      validOneYear: 'Valida durant 1 any',
      allBoats: 'Canviable en totes les barques',
      buy: 'Comprar targeta regal',
      processing: 'Processant...',
      purchaseSuccess: 'Compra realitzada!',
      purchaseSuccessDesc: 'La targeta regal s\'ha creat correctament',
      code: 'Codi de la targeta',
      forRecipient: 'Per a',
      backHome: 'Tornar a l\'inici',
      buyAnother: 'Comprar una altra',
    },
    boatDetail: {
      notFound: 'Embarcacio no trobada',
      backToFleet: 'Tornar a la flota',
      description: 'Descripcio',
      fuelIncluded: 'Gasolina inclosa!',
      readyForAdventure: 'Preparat per a la teva aventura?',
      bookNowCTA: 'Reserva ara el teu {boatName} i gaudeix de les cales de la Costa Brava',
      pricesBySeason: 'Preus per Temporada',
      seasonLow: 'Temporada BAIXA',
      seasonMid: 'Temporada MITJA',
      seasonHigh: 'Temporada ALTA',
      priceIncludes: 'El preu inclou:',
      mainFeatures: 'Caracteristiques Principals',
      noFeatures: 'No hi ha caracteristiques disponibles',
      technicalSpecs: 'Especificacions Tecniques',
      specModel: 'Model:',
      specLength: 'Eslora:',
      specBeam: 'Manega:',
      specEngine: 'Motor:',
      specFuel: 'Combustible:',
      specCapacity: 'Capacitat:',
      specDeposit: 'Fianca:',
      equipmentIncluded: 'Equipament Inclos',
      noEquipment: 'No hi ha equipament disponible',
      licenseFreeAdvantages: 'Avantatges dels Vaixells Sense Llicencia',
      totalAccessibility: 'Accessibilitat Total',
      noLicenseNeeded: 'No necessites llicencia ni titulacio',
      quickLearning: 'Aprenentatge rapid (15 minuts)',
      lowerCost: 'Menor cost de lloguer',
      perfectBeginners: 'Perfecte per a principiants',
      guaranteedFun: 'Diversio Garantida',
      accessCoves: 'Acces a cales i platges des del mar',
      idealFamilies: 'Ideal per a families amb nens',
      safeCoastalNavigation: 'Navegacio en zona segura costanera',
      immediateAvailability: 'Disponibilitat immediata',
      availableExtras: 'Extres Disponibles',
      extrasNote: 'Pots afegir qualsevol d\'aquests extres al completar la teva reserva online o directament al port abans de sortir.',
      importantInfo: 'Informacio Important',
      essentialDoc: 'Imprescindible: Acudir amb document d\'identitat o passaport en vigor',
      essentialDocLicense: ' i llicencia de navegacio original',
      licenseRequired: 'Llicencia nautica requerida',
      noLicenseRequired: 'Sense necessitat de llicencia nautica',
      idealForGroups: 'Ideal per a families i grups de fins a {capacity} persones',
      perfectExplore: 'Perfecte per explorar les cales de la Costa Brava',
      fuelInsuranceIncluded: 'Gasolina, asseguranca i equip de seguretat inclosos',
      fuelNotIncluded: 'Combustible NO inclos, asseguranca i equip de seguretat inclosos',
      conditions: 'Condicions:',
      rentalConditions: 'les condicions generals del lloguer',
      beforeBooking: 'abans de fer la teva reserva.',
      imageAria: 'Imatge',
    },
    wizard: {
      stepBoat: 'Vaixell',
      stepTrip: 'Excursio',
      stepYourData: 'Les teves dades',
      stepConfirm: 'Confirmar',
      chooseYourBoat: 'Tria el teu vaixell',
      haveNauticalLicense: 'Tens llicencia nautica?',
      withoutLicense: 'Sense llicencia',
      withLicense: 'Amb llicencia',
      selectABoat: 'Selecciona un vaixell',
      selectDate: 'Seleccionar data',
      yourTrip: 'La teva excursio',
      howLongHowMany: 'Quant temps i quants sou?',
      duration: 'Durada',
      departureTime: 'Hora de sortida',
      selectTime: 'Selecciona hora',
      numberOfPeople: 'Nombre de persones',
      maxCapacityError: 'Aquest vaixell te capacitat per a {max} persones com a maxim',
      yourData: 'Les teves dades',
      confirmViaWhatsApp: 'Per confirmar la teva reserva per WhatsApp',
      firstName: 'Nom',
      lastName: 'Cognoms',
      phone: 'Telefon',
      searchCountry: 'Cercar pais...',
      email: 'Email',
      date: 'Data',
    },
    validation: {
      required: 'Aquest camp es obligatori',
      invalidEmail: 'Email no valid',
      invalidPhone: 'Nomes numeros',
      futureDate: 'Selecciona una data futura',
      minPeople: 'Minim 1 persona',
    },
  },

  en: {
    nav: {
      home: 'Home',
      fleet: 'Fleet',
      booking: 'Booking',
      contact: 'Contact',
      faq: 'FAQ',
      giftCards: 'Gift Cards',
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
      googleRating: '4.8/5 on Google',
      clients: '+5000 clients',
      insured: 'Fully insured',
      experience: '+5 years exp.',
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
      extrasSection: {
        title: 'Extras & Packs',
        packs: 'Discounted Packs',
        individual: 'Individual Extras',
        included: 'Includes',
        savings: 'You save',
        noPack: 'No pack',
        selected: 'selected',
        packSelected: 'Pack selected',
      },
      confirmTitle: 'Confirm booking',
      confirmSubtitle: 'Review your details and add optional extras',
      summaryClient: 'Customer',
      estimatedTotal: 'Estimated total',
      discountApplied: 'Discount applied',
      priceConfirmedWhatsApp: 'Final price confirmed by WhatsApp',
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
      book: 'Book',
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
    giftCardBanner: {
      title: 'Give a unique experience on the sea',
      subtitle: 'Gift cards from 50EUR. The perfect gift for any occasion.',
      cta: 'Buy gift card',
    },
    codeValidation: {
      haveCode: 'Have a gift card or discount code?',
      enterCode: 'Enter your code',
      validate: 'Validate',
      validGiftCard: 'Valid gift card',
      validDiscount: 'Valid discount code',
      invalidCode: 'Invalid or expired code',
      value: 'Value',
      discount: 'Discount',
      applied: 'Applied',
      apply: 'Apply',
    },
    giftCards: {
      title: 'Gift Cards',
      subtitle: 'Give an unforgettable nautical experience on the Costa Brava',
      selectAmount: 'Select amount',
      customAmount: 'Custom amount',
      details: 'Your details',
      yourName: 'Your name',
      yourEmail: 'Your email',
      yourNameRequired: 'Your name is required',
      yourEmailRequired: 'Your email is required',
      recipientInfo: 'Recipient details',
      recipientName: 'Recipient name',
      recipientEmail: 'Recipient email',
      recipientNameRequired: 'Recipient name is required',
      recipientEmailRequired: 'Recipient email is required',
      message: 'Personal message (optional)',
      messagePlaceholder: 'Write a message for the recipient...',
      total: 'Total',
      validOneYear: 'Valid for 1 year',
      allBoats: 'Redeemable on all boats',
      buy: 'Buy gift card',
      processing: 'Processing...',
      purchaseSuccess: 'Purchase complete!',
      purchaseSuccessDesc: 'The gift card has been created successfully',
      code: 'Card code',
      forRecipient: 'For',
      backHome: 'Back to home',
      buyAnother: 'Buy another',
    },
    boatDetail: {
      notFound: 'Boat not found',
      backToFleet: 'Back to fleet',
      description: 'Description',
      fuelIncluded: 'Fuel included!',
      readyForAdventure: 'Ready for your adventure?',
      bookNowCTA: 'Book your {boatName} now and enjoy the coves of Costa Brava',
      pricesBySeason: 'Prices by Season',
      seasonLow: 'LOW Season',
      seasonMid: 'MID Season',
      seasonHigh: 'HIGH Season',
      priceIncludes: 'Price includes:',
      mainFeatures: 'Main Features',
      noFeatures: 'No features available',
      technicalSpecs: 'Technical Specifications',
      specModel: 'Model:',
      specLength: 'Length:',
      specBeam: 'Beam:',
      specEngine: 'Engine:',
      specFuel: 'Fuel:',
      specCapacity: 'Capacity:',
      specDeposit: 'Deposit:',
      equipmentIncluded: 'Equipment Included',
      noEquipment: 'No equipment available',
      licenseFreeAdvantages: 'License-Free Boat Advantages',
      totalAccessibility: 'Total Accessibility',
      noLicenseNeeded: 'No license or qualification needed',
      quickLearning: 'Quick learning (15 minutes)',
      lowerCost: 'Lower rental cost',
      perfectBeginners: 'Perfect for beginners',
      guaranteedFun: 'Guaranteed Fun',
      accessCoves: 'Access to coves and beaches from the sea',
      idealFamilies: 'Ideal for families with children',
      safeCoastalNavigation: 'Safe coastal navigation zone',
      immediateAvailability: 'Immediate availability',
      availableExtras: 'Available Extras',
      extrasNote: 'You can add any of these extras when completing your online booking or directly at the port before departure.',
      importantInfo: 'Important Information',
      essentialDoc: 'Essential: Bring a valid ID or passport',
      essentialDocLicense: ' and original navigation license',
      licenseRequired: 'Nautical license required',
      noLicenseRequired: 'No nautical license needed',
      idealForGroups: 'Ideal for families and groups of up to {capacity} people',
      perfectExplore: 'Perfect for exploring the coves of Costa Brava',
      fuelInsuranceIncluded: 'Fuel, insurance and safety equipment included',
      fuelNotIncluded: 'Fuel NOT included, insurance and safety equipment included',
      conditions: 'Conditions:',
      rentalConditions: 'the general rental conditions',
      beforeBooking: 'before making your booking.',
      imageAria: 'Image',
    },
    wizard: {
      stepBoat: 'Boat',
      stepTrip: 'Trip',
      stepYourData: 'Your info',
      stepConfirm: 'Confirm',
      chooseYourBoat: 'Choose your boat',
      haveNauticalLicense: 'Do you have a nautical license?',
      withoutLicense: 'Without license',
      withLicense: 'With license',
      selectABoat: 'Select a boat',
      selectDate: 'Select date',
      yourTrip: 'Your trip',
      howLongHowMany: 'How long and how many are you?',
      duration: 'Duration',
      departureTime: 'Departure time',
      selectTime: 'Select time',
      numberOfPeople: 'Number of people',
      maxCapacityError: 'This boat has a maximum capacity of {max} people',
      yourData: 'Your info',
      confirmViaWhatsApp: 'To confirm your booking via WhatsApp',
      firstName: 'First name',
      lastName: 'Last name',
      phone: 'Phone',
      searchCountry: 'Search country...',
      email: 'Email',
      date: 'Date',
    },
    validation: {
      required: 'This field is required',
      invalidEmail: 'Invalid email',
      invalidPhone: 'Numbers only',
      futureDate: 'Select a future date',
      minPeople: 'Minimum 1 person',
    },
  },

  fr: {
    nav: {
      home: 'Accueil',
      fleet: 'Flotte',
      booking: 'Réservation',
      contact: 'Contact',
      faq: 'FAQ',
      giftCards: 'Cartes Cadeaux',
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
      googleRating: '4.8/5 sur Google',
      clients: '+5000 clients',
      insured: 'Assuré',
      experience: '+5 ans exp.',
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
      extrasSection: {
        title: 'Extras et Packs',
        packs: 'Packs avec remise',
        individual: 'Extras individuels',
        included: 'Comprend',
        savings: 'Vous economisez',
        noPack: 'Sans pack',
        selected: 'selectionnes',
        packSelected: 'Pack selectionne',
      },
      confirmTitle: 'Confirmer la réservation',
      confirmSubtitle: 'Vérifiez les détails et ajoutez des extras optionnels',
      summaryClient: 'Client',
      estimatedTotal: 'Total estimé',
      discountApplied: 'Réduction appliquée',
      priceConfirmedWhatsApp: 'Le prix final est confirmé par WhatsApp',
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
      book: 'Réserver',
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
    giftCardBanner: {
      title: 'Offrez une experience unique en mer',
      subtitle: 'Cartes cadeaux a partir de 50EUR. Le cadeau parfait pour toute occasion.',
      cta: 'Acheter une carte cadeau',
    },
    codeValidation: {
      haveCode: 'Vous avez un code cadeau ou de reduction?',
      enterCode: 'Entrez votre code',
      validate: 'Valider',
      validGiftCard: 'Carte cadeau valide',
      validDiscount: 'Code de reduction valide',
      invalidCode: 'Code invalide ou expire',
      value: 'Valeur',
      discount: 'Reduction',
      applied: 'Applique',
      apply: 'Appliquer',
    },
    giftCards: {
      title: 'Cartes Cadeaux',
      subtitle: 'Offrez une experience nautique inoubliable sur la Costa Brava',
      selectAmount: 'Selectionner le montant',
      customAmount: 'Montant personnalise',
      details: 'Vos coordonnees',
      yourName: 'Votre nom',
      yourEmail: 'Votre email',
      yourNameRequired: 'Votre nom est obligatoire',
      yourEmailRequired: 'Votre email est obligatoire',
      recipientInfo: 'Coordonnees du destinataire',
      recipientName: 'Nom du destinataire',
      recipientEmail: 'Email du destinataire',
      recipientNameRequired: 'Le nom du destinataire est obligatoire',
      recipientEmailRequired: 'L\'email du destinataire est obligatoire',
      message: 'Message personnel (facultatif)',
      messagePlaceholder: 'Ecrivez un message pour le destinataire...',
      total: 'Total',
      validOneYear: 'Valable pendant 1 an',
      allBoats: 'Echangeable sur tous les bateaux',
      buy: 'Acheter une carte cadeau',
      processing: 'Traitement en cours...',
      purchaseSuccess: 'Achat effectue!',
      purchaseSuccessDesc: 'La carte cadeau a ete creee avec succes',
      code: 'Code de la carte',
      forRecipient: 'Pour',
      backHome: 'Retour a l\'accueil',
      buyAnother: 'Acheter une autre',
    },
    boatDetail: {
      notFound: 'Bateau introuvable',
      backToFleet: 'Retour a la flotte',
      description: 'Description',
      fuelIncluded: 'Carburant inclus !',
      readyForAdventure: 'Pret pour votre aventure ?',
      bookNowCTA: 'Reservez votre {boatName} maintenant et profitez des criques de la Costa Brava',
      pricesBySeason: 'Prix par Saison',
      seasonLow: 'Saison BASSE',
      seasonMid: 'Saison MOYENNE',
      seasonHigh: 'Saison HAUTE',
      priceIncludes: 'Le prix comprend :',
      mainFeatures: 'Caracteristiques Principales',
      noFeatures: 'Aucune caracteristique disponible',
      technicalSpecs: 'Specifications Techniques',
      specModel: 'Modele :',
      specLength: 'Longueur :',
      specBeam: 'Largeur :',
      specEngine: 'Moteur :',
      specFuel: 'Carburant :',
      specCapacity: 'Capacite :',
      specDeposit: 'Caution :',
      equipmentIncluded: 'Equipement Inclus',
      noEquipment: 'Aucun equipement disponible',
      licenseFreeAdvantages: 'Avantages des Bateaux Sans Permis',
      totalAccessibility: 'Accessibilite Totale',
      noLicenseNeeded: 'Pas besoin de permis ni de qualification',
      quickLearning: 'Apprentissage rapide (15 minutes)',
      lowerCost: 'Cout de location reduit',
      perfectBeginners: 'Parfait pour les debutants',
      guaranteedFun: 'Plaisir Garanti',
      accessCoves: 'Acces aux criques et plages depuis la mer',
      idealFamilies: 'Ideal pour les familles avec enfants',
      safeCoastalNavigation: 'Navigation en zone cotiere securisee',
      immediateAvailability: 'Disponibilite immediate',
      availableExtras: 'Extras Disponibles',
      extrasNote: 'Vous pouvez ajouter ces extras lors de votre reservation en ligne ou directement au port avant le depart.',
      importantInfo: 'Informations Importantes',
      essentialDoc: 'Indispensable : Se presenter avec une piece d\'identite ou un passeport en cours de validite',
      essentialDocLicense: ' et le permis de navigation original',
      licenseRequired: 'Permis nautique requis',
      noLicenseRequired: 'Pas besoin de permis nautique',
      idealForGroups: 'Ideal pour les familles et groupes jusqu\'a {capacity} personnes',
      perfectExplore: 'Parfait pour explorer les criques de la Costa Brava',
      fuelInsuranceIncluded: 'Carburant, assurance et equipement de securite inclus',
      fuelNotIncluded: 'Carburant NON inclus, assurance et equipement de securite inclus',
      conditions: 'Conditions :',
      rentalConditions: 'les conditions generales de location',
      beforeBooking: 'avant de faire votre reservation.',
      imageAria: 'Image',
    },
    wizard: {
      stepBoat: 'Bateau',
      stepTrip: 'Excursion',
      stepYourData: 'Vos donnees',
      stepConfirm: 'Confirmer',
      chooseYourBoat: 'Choisissez votre bateau',
      haveNauticalLicense: 'Avez-vous un permis nautique ?',
      withoutLicense: 'Sans permis',
      withLicense: 'Avec permis',
      selectABoat: 'Selectionnez un bateau',
      selectDate: 'Selectionner une date',
      yourTrip: 'Votre excursion',
      howLongHowMany: 'Combien de temps et combien etes-vous ?',
      duration: 'Duree',
      departureTime: 'Heure de depart',
      selectTime: 'Selectionner l\'heure',
      numberOfPeople: 'Nombre de personnes',
      maxCapacityError: 'Ce bateau a une capacite maximale de {max} personnes',
      yourData: 'Vos donnees',
      confirmViaWhatsApp: 'Pour confirmer votre reservation par WhatsApp',
      firstName: 'Prenom',
      lastName: 'Nom de famille',
      phone: 'Telephone',
      searchCountry: 'Rechercher un pays...',
      email: 'Email',
      date: 'Date',
    },
    validation: {
      required: 'Ce champ est obligatoire',
      invalidEmail: 'Email invalide',
      invalidPhone: 'Chiffres uniquement',
      futureDate: 'Selectionnez une date future',
      minPeople: 'Minimum 1 personne',
    },
  },

  de: {
    nav: {
      home: 'Startseite',
      fleet: 'Flotte',
      booking: 'Buchung',
      contact: 'Kontakt',
      faq: 'FAQ',
      giftCards: 'Geschenkkarten',
      viewComponents: 'Komponenten Anzeigen',
    },
    hero: {
      title: 'Bootsverleih in Blanes, Costa Brava',
      subtitle: 'Entdecken Sie die schönsten Buchten der Costa Brava mit unseren Booten mit und ohne Führerschein. Abfahrt vom Hafen Blanes.',
      bookNow: 'Jetzt Buchen',
      viewFleet: 'Flotte Anzeigen',
      trustText: 'Ohne Verpflichtung • Transparente Preise',
      whatsappContact: 'WhatsApp +34 611 500 372',
      location: 'Standort',
      googleRating: '4.8/5 auf Google',
      clients: '+5000 Kunden',
      insured: 'Versichert',
      experience: '+5 Jahre Erfahrung',
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
      extrasSection: {
        title: 'Extras & Pakete',
        packs: 'Rabattierte Pakete',
        individual: 'Einzelne Extras',
        included: 'Enthalt',
        savings: 'Sie sparen',
        noPack: 'Kein Paket',
        selected: 'ausgewahlt',
        packSelected: 'Paket ausgewahlt',
      },
      confirmTitle: 'Buchung bestätigen',
      confirmSubtitle: 'Details prüfen und optionale Extras hinzufügen',
      summaryClient: 'Kunde',
      estimatedTotal: 'Geschätzter Gesamtbetrag',
      discountApplied: 'Rabatt angewendet',
      priceConfirmedWhatsApp: 'Der endgültige Preis wird per WhatsApp bestätigt',
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
      book: 'Buchen',
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
    giftCardBanner: {
      title: 'Verschenken Sie ein einzigartiges Erlebnis auf dem Meer',
      subtitle: 'Geschenkkarten ab 50EUR. Das perfekte Geschenk fur jeden Anlass.',
      cta: 'Geschenkkarte kaufen',
    },
    codeValidation: {
      haveCode: 'Haben Sie einen Geschenk- oder Rabattcode?',
      enterCode: 'Code eingeben',
      validate: 'Prufen',
      validGiftCard: 'Gultige Geschenkkarte',
      validDiscount: 'Gultiger Rabattcode',
      invalidCode: 'Ungultiger oder abgelaufener Code',
      value: 'Wert',
      discount: 'Rabatt',
      applied: 'Angewendet',
      apply: 'Anwenden',
    },
    giftCards: {
      title: 'Geschenkkarten',
      subtitle: 'Verschenken Sie ein unvergessliches Erlebnis auf dem Meer an der Costa Brava',
      selectAmount: 'Betrag wahlen',
      customAmount: 'Individueller Betrag',
      details: 'Ihre Daten',
      yourName: 'Ihr Name',
      yourEmail: 'Ihre E-Mail',
      yourNameRequired: 'Ihr Name ist erforderlich',
      yourEmailRequired: 'Ihre E-Mail ist erforderlich',
      recipientInfo: 'Empfangerdaten',
      recipientName: 'Name des Empfangers',
      recipientEmail: 'E-Mail des Empfangers',
      recipientNameRequired: 'Der Name des Empfangers ist erforderlich',
      recipientEmailRequired: 'Die E-Mail des Empfangers ist erforderlich',
      message: 'Personliche Nachricht (optional)',
      messagePlaceholder: 'Schreiben Sie eine Nachricht fur den Empfanger...',
      total: 'Gesamt',
      validOneYear: '1 Jahr gultig',
      allBoats: 'Einlosbar fur alle Boote',
      buy: 'Geschenkkarte kaufen',
      processing: 'Wird verarbeitet...',
      purchaseSuccess: 'Kauf abgeschlossen!',
      purchaseSuccessDesc: 'Die Geschenkkarte wurde erfolgreich erstellt',
      code: 'Kartencode',
      forRecipient: 'Fur',
      backHome: 'Zuruck zur Startseite',
      buyAnother: 'Weitere kaufen',
    },
    boatDetail: {
      notFound: 'Boot nicht gefunden',
      backToFleet: 'Zuruck zur Flotte',
      description: 'Beschreibung',
      fuelIncluded: 'Kraftstoff inbegriffen!',
      readyForAdventure: 'Bereit fur dein Abenteuer?',
      bookNowCTA: 'Buche jetzt dein {boatName} und geniesse die Buchten der Costa Brava',
      pricesBySeason: 'Preise nach Saison',
      seasonLow: 'NIEDRIG-Saison',
      seasonMid: 'MITTEL-Saison',
      seasonHigh: 'HOCH-Saison',
      priceIncludes: 'Im Preis enthalten:',
      mainFeatures: 'Hauptmerkmale',
      noFeatures: 'Keine Merkmale verfugbar',
      technicalSpecs: 'Technische Spezifikationen',
      specModel: 'Modell:',
      specLength: 'Lange:',
      specBeam: 'Breite:',
      specEngine: 'Motor:',
      specFuel: 'Kraftstoff:',
      specCapacity: 'Kapazitat:',
      specDeposit: 'Kaution:',
      equipmentIncluded: 'Ausstattung Inbegriffen',
      noEquipment: 'Keine Ausstattung verfugbar',
      licenseFreeAdvantages: 'Vorteile von Booten ohne Fuhrerschein',
      totalAccessibility: 'Volle Zuganglichkeit',
      noLicenseNeeded: 'Kein Fuhrerschein oder Qualifikation erforderlich',
      quickLearning: 'Schnelles Lernen (15 Minuten)',
      lowerCost: 'Geringere Mietkosten',
      perfectBeginners: 'Perfekt fur Anfanger',
      guaranteedFun: 'Garantierter Spass',
      accessCoves: 'Zugang zu Buchten und Stranden vom Meer aus',
      idealFamilies: 'Ideal fur Familien mit Kindern',
      safeCoastalNavigation: 'Sichere Kustennavigationszone',
      immediateAvailability: 'Sofortige Verfugbarkeit',
      availableExtras: 'Verfugbare Extras',
      extrasNote: 'Sie konnen diese Extras bei der Online-Buchung oder direkt im Hafen vor der Abfahrt hinzufugen.',
      importantInfo: 'Wichtige Informationen',
      essentialDoc: 'Erforderlich: Gultigen Personalausweis oder Reisepass mitbringen',
      essentialDocLicense: ' und originalen Bootsfuhrerschein',
      licenseRequired: 'Bootsfuhrerschein erforderlich',
      noLicenseRequired: 'Kein Bootsfuhrerschein erforderlich',
      idealForGroups: 'Ideal fur Familien und Gruppen bis zu {capacity} Personen',
      perfectExplore: 'Perfekt um die Buchten der Costa Brava zu erkunden',
      fuelInsuranceIncluded: 'Kraftstoff, Versicherung und Sicherheitsausrustung inbegriffen',
      fuelNotIncluded: 'Kraftstoff NICHT inbegriffen, Versicherung und Sicherheitsausrustung inbegriffen',
      conditions: 'Bedingungen:',
      rentalConditions: 'die allgemeinen Mietbedingungen',
      beforeBooking: 'vor der Buchung.',
      imageAria: 'Bild',
    },
    wizard: {
      stepBoat: 'Boot',
      stepTrip: 'Ausflug',
      stepYourData: 'Ihre Daten',
      stepConfirm: 'Bestatigen',
      chooseYourBoat: 'Wahle dein Boot',
      haveNauticalLicense: 'Haben Sie einen Bootsfuhrerschein?',
      withoutLicense: 'Ohne Fuhrerschein',
      withLicense: 'Mit Fuhrerschein',
      selectABoat: 'Wahlen Sie ein Boot',
      selectDate: 'Datum wahlen',
      yourTrip: 'Dein Ausflug',
      howLongHowMany: 'Wie lange und wie viele seid ihr?',
      duration: 'Dauer',
      departureTime: 'Abfahrtszeit',
      selectTime: 'Zeit wahlen',
      numberOfPeople: 'Anzahl der Personen',
      maxCapacityError: 'Dieses Boot hat eine maximale Kapazitat von {max} Personen',
      yourData: 'Ihre Daten',
      confirmViaWhatsApp: 'Um Ihre Buchung per WhatsApp zu bestatigen',
      firstName: 'Vorname',
      lastName: 'Nachname',
      phone: 'Telefon',
      searchCountry: 'Land suchen...',
      email: 'E-Mail',
      date: 'Datum',
    },
    validation: {
      required: 'Dieses Feld ist erforderlich',
      invalidEmail: 'Ungultige E-Mail',
      invalidPhone: 'Nur Zahlen',
      futureDate: 'Wahlen Sie ein zukunftiges Datum',
      minPeople: 'Mindestens 1 Person',
    },
  },

  nl: {
    nav: {
      home: 'Home',
      fleet: 'Vloot',
      booking: 'Boeking',
      contact: 'Contact',
      faq: 'FAQ',
      giftCards: 'Cadeaukaarten',
      viewComponents: 'Componenten Bekijken',
    },
    hero: {
      title: 'Bootverhuur in Blanes, Costa Brava',
      subtitle: 'Ontdek de mooiste baaien van Costa Brava met onze boten met en zonder vaarbewijs. Vertrek vanuit Haven van Blanes.',
      bookNow: 'Nu Boeken',
      viewFleet: 'Vloot Bekijken',
      trustText: 'Geen verplichtingen • Transparante prijzen',
      whatsappContact: 'WhatsApp +34 611 500 372',
      location: 'Locatie',
      googleRating: '4.8/5 op Google',
      clients: '+5000 klanten',
      insured: 'Verzekerd',
      experience: '+5 jaar ervaring',
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
      extrasSection: {
        title: 'Extra\'s & Pakketten',
        packs: 'Pakketten met korting',
        individual: 'Individuele extra\'s',
        included: 'Bevat',
        savings: 'U bespaart',
        noPack: 'Geen pakket',
        selected: 'geselecteerd',
        packSelected: 'Pakket geselecteerd',
      },
      confirmTitle: 'Boeking bevestigen',
      confirmSubtitle: 'Controleer de details en voeg optionele extra\'s toe',
      summaryClient: 'Klant',
      estimatedTotal: 'Geschat totaal',
      discountApplied: 'Korting toegepast',
      priceConfirmedWhatsApp: 'De definitieve prijs wordt bevestigd via WhatsApp',
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
      book: 'Boeken',
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
    giftCardBanner: {
      title: 'Geef een unieke ervaring op zee',
      subtitle: 'Cadeaukaarten vanaf 50EUR. Het perfecte cadeau voor elke gelegenheid.',
      cta: 'Cadeaukaart kopen',
    },
    codeValidation: {
      haveCode: 'Heb je een cadeaukaart of kortingscode?',
      enterCode: 'Voer je code in',
      validate: 'Valideren',
      validGiftCard: 'Geldige cadeaukaart',
      validDiscount: 'Geldige kortingscode',
      invalidCode: 'Ongeldige of verlopen code',
      value: 'Waarde',
      discount: 'Korting',
      applied: 'Toegepast',
      apply: 'Toepassen',
    },
    giftCards: {
      title: 'Cadeaukaarten',
      subtitle: 'Geef een onvergetelijke nautische ervaring aan de Costa Brava',
      selectAmount: 'Selecteer bedrag',
      customAmount: 'Aangepast bedrag',
      details: 'Uw gegevens',
      yourName: 'Uw naam',
      yourEmail: 'Uw e-mail',
      yourNameRequired: 'Uw naam is verplicht',
      yourEmailRequired: 'Uw e-mail is verplicht',
      recipientInfo: 'Gegevens ontvanger',
      recipientName: 'Naam ontvanger',
      recipientEmail: 'E-mail ontvanger',
      recipientNameRequired: 'De naam van de ontvanger is verplicht',
      recipientEmailRequired: 'Het e-mailadres van de ontvanger is verplicht',
      message: 'Persoonlijk bericht (optioneel)',
      messagePlaceholder: 'Schrijf een bericht voor de ontvanger...',
      total: 'Totaal',
      validOneYear: '1 jaar geldig',
      allBoats: 'Inwisselbaar voor alle boten',
      buy: 'Cadeaukaart kopen',
      processing: 'Verwerken...',
      purchaseSuccess: 'Aankoop voltooid!',
      purchaseSuccessDesc: 'De cadeaukaart is succesvol aangemaakt',
      code: 'Kaartcode',
      forRecipient: 'Voor',
      backHome: 'Terug naar home',
      buyAnother: 'Nog een kopen',
    },
    boatDetail: {
      notFound: 'Boot niet gevonden',
      backToFleet: 'Terug naar vloot',
      description: 'Beschrijving',
      fuelIncluded: 'Brandstof inbegrepen!',
      readyForAdventure: 'Klaar voor jouw avontuur?',
      bookNowCTA: 'Boek nu je {boatName} en geniet van de baaien van de Costa Brava',
      pricesBySeason: 'Prijzen per Seizoen',
      seasonLow: 'LAAG Seizoen',
      seasonMid: 'MID Seizoen',
      seasonHigh: 'HOOG Seizoen',
      priceIncludes: 'Prijs is inclusief:',
      mainFeatures: 'Belangrijkste Kenmerken',
      noFeatures: 'Geen kenmerken beschikbaar',
      technicalSpecs: 'Technische Specificaties',
      specModel: 'Model:',
      specLength: 'Lengte:',
      specBeam: 'Breedte:',
      specEngine: 'Motor:',
      specFuel: 'Brandstof:',
      specCapacity: 'Capaciteit:',
      specDeposit: 'Borg:',
      equipmentIncluded: 'Uitrusting Inbegrepen',
      noEquipment: 'Geen uitrusting beschikbaar',
      licenseFreeAdvantages: 'Voordelen van Boten zonder Licentie',
      totalAccessibility: 'Volledige Toegankelijkheid',
      noLicenseNeeded: 'Geen licentie of kwalificatie nodig',
      quickLearning: 'Snel leren (15 minuten)',
      lowerCost: 'Lagere huurkosten',
      perfectBeginners: 'Perfect voor beginners',
      guaranteedFun: 'Gegarandeerd Plezier',
      accessCoves: 'Toegang tot baaien en stranden vanaf zee',
      idealFamilies: 'Ideaal voor gezinnen met kinderen',
      safeCoastalNavigation: 'Veilige kustnavigatiezone',
      immediateAvailability: 'Directe beschikbaarheid',
      availableExtras: 'Beschikbare Extra\'s',
      extrasNote: 'Je kunt deze extra\'s toevoegen bij het voltooien van je online boeking of direct in de haven voor vertrek.',
      importantInfo: 'Belangrijke Informatie',
      essentialDoc: 'Vereist: Neem een geldig identiteitsbewijs of paspoort mee',
      essentialDocLicense: ' en origineel vaarbewijs',
      licenseRequired: 'Vaarbewijs vereist',
      noLicenseRequired: 'Geen vaarbewijs nodig',
      idealForGroups: 'Ideaal voor gezinnen en groepen tot {capacity} personen',
      perfectExplore: 'Perfect om de baaien van de Costa Brava te verkennen',
      fuelInsuranceIncluded: 'Brandstof, verzekering en veiligheidsuitrusting inbegrepen',
      fuelNotIncluded: 'Brandstof NIET inbegrepen, verzekering en veiligheidsuitrusting inbegrepen',
      conditions: 'Voorwaarden:',
      rentalConditions: 'de algemene huurvoorwaarden',
      beforeBooking: 'voor het maken van uw boeking.',
      imageAria: 'Afbeelding',
    },
    wizard: {
      stepBoat: 'Boot',
      stepTrip: 'Uitstap',
      stepYourData: 'Uw gegevens',
      stepConfirm: 'Bevestigen',
      chooseYourBoat: 'Kies je boot',
      haveNauticalLicense: 'Heeft u een vaarbewijs?',
      withoutLicense: 'Zonder licentie',
      withLicense: 'Met licentie',
      selectABoat: 'Selecteer een boot',
      selectDate: 'Selecteer datum',
      yourTrip: 'Jouw uitstap',
      howLongHowMany: 'Hoe lang en met hoeveel zijn jullie?',
      duration: 'Duur',
      departureTime: 'Vertrektijd',
      selectTime: 'Selecteer tijd',
      numberOfPeople: 'Aantal personen',
      maxCapacityError: 'Deze boot heeft een maximale capaciteit van {max} personen',
      yourData: 'Uw gegevens',
      confirmViaWhatsApp: 'Om uw boeking via WhatsApp te bevestigen',
      firstName: 'Voornaam',
      lastName: 'Achternaam',
      phone: 'Telefoon',
      searchCountry: 'Zoek land...',
      email: 'E-mail',
      date: 'Datum',
    },
    validation: {
      required: 'Dit veld is verplicht',
      invalidEmail: 'Ongeldig e-mailadres',
      invalidPhone: 'Alleen cijfers',
      futureDate: 'Selecteer een toekomstige datum',
      minPeople: 'Minimaal 1 persoon',
    },
  },

  it: {
    nav: {
      home: 'Home',
      fleet: 'Flotta',
      booking: 'Prenotazione',
      contact: 'Contatto',
      faq: 'FAQ',
      giftCards: 'Carte Regalo',
      viewComponents: 'Visualizza Componenti',
    },
    hero: {
      title: 'Noleggio Barche a Blanes, Costa Brava',
      subtitle: 'Scopri le più belle calette della Costa Brava con le nostre barche con e senza patente. Partenze dal Porto di Blanes.',
      bookNow: 'Prenota Ora',
      viewFleet: 'Visualizza Flotta',
      trustText: 'Senza impegno • Prezzi trasparenti',
      whatsappContact: 'WhatsApp +34 611 500 372',
      location: 'Posizione',
      googleRating: '4.8/5 su Google',
      clients: '+5000 clienti',
      insured: 'Assicurato',
      experience: '+5 anni di esp.',
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
      extrasSection: {
        title: 'Extra e Pacchetti',
        packs: 'Pacchetti scontati',
        individual: 'Extra individuali',
        included: 'Include',
        savings: 'Risparmi',
        noPack: 'Senza pacchetto',
        selected: 'selezionati',
        packSelected: 'Pacchetto selezionato',
      },
      confirmTitle: 'Conferma prenotazione',
      confirmSubtitle: 'Controlla i dettagli e aggiungi extra opzionali',
      summaryClient: 'Cliente',
      estimatedTotal: 'Totale stimato',
      discountApplied: 'Sconto applicato',
      priceConfirmedWhatsApp: 'Il prezzo finale è confermato via WhatsApp',
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
      book: 'Prenota',
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
    giftCardBanner: {
      title: 'Regala un\'esperienza unica in mare',
      subtitle: 'Carte regalo da 50EUR. Il regalo perfetto per ogni occasione.',
      cta: 'Acquista carta regalo',
    },
    codeValidation: {
      haveCode: 'Hai un codice regalo o sconto?',
      enterCode: 'Inserisci il tuo codice',
      validate: 'Validare',
      validGiftCard: 'Carta regalo valida',
      validDiscount: 'Codice sconto valido',
      invalidCode: 'Codice non valido o scaduto',
      value: 'Valore',
      discount: 'Sconto',
      applied: 'Applicato',
      apply: 'Applica',
    },
    giftCards: {
      title: 'Carte Regalo',
      subtitle: 'Regala un\'esperienza nautica indimenticabile sulla Costa Brava',
      selectAmount: 'Seleziona importo',
      customAmount: 'Importo personalizzato',
      details: 'I tuoi dati',
      yourName: 'Il tuo nome',
      yourEmail: 'La tua email',
      yourNameRequired: 'Il tuo nome e obbligatorio',
      yourEmailRequired: 'La tua email e obbligatoria',
      recipientInfo: 'Dati del destinatario',
      recipientName: 'Nome del destinatario',
      recipientEmail: 'Email del destinatario',
      recipientNameRequired: 'Il nome del destinatario e obbligatorio',
      recipientEmailRequired: 'L\'email del destinatario e obbligatoria',
      message: 'Messaggio personale (facoltativo)',
      messagePlaceholder: 'Scrivi un messaggio per il destinatario...',
      total: 'Totale',
      validOneYear: 'Valida per 1 anno',
      allBoats: 'Utilizzabile su tutte le barche',
      buy: 'Acquista carta regalo',
      processing: 'Elaborazione...',
      purchaseSuccess: 'Acquisto completato!',
      purchaseSuccessDesc: 'La carta regalo e stata creata con successo',
      code: 'Codice della carta',
      forRecipient: 'Per',
      backHome: 'Torna alla home',
      buyAnother: 'Acquista un\'altra',
    },
    boatDetail: {
      notFound: 'Barca non trovata',
      backToFleet: 'Torna alla flotta',
      description: 'Descrizione',
      fuelIncluded: 'Carburante incluso!',
      readyForAdventure: 'Pronto per la tua avventura?',
      bookNowCTA: 'Prenota ora la tua {boatName} e goditi le calette della Costa Brava',
      pricesBySeason: 'Prezzi per Stagione',
      seasonLow: 'Stagione BASSA',
      seasonMid: 'Stagione MEDIA',
      seasonHigh: 'Stagione ALTA',
      priceIncludes: 'Il prezzo include:',
      mainFeatures: 'Caratteristiche Principali',
      noFeatures: 'Nessuna caratteristica disponibile',
      technicalSpecs: 'Specifiche Tecniche',
      specModel: 'Modello:',
      specLength: 'Lunghezza:',
      specBeam: 'Larghezza:',
      specEngine: 'Motore:',
      specFuel: 'Carburante:',
      specCapacity: 'Capacita:',
      specDeposit: 'Deposito:',
      equipmentIncluded: 'Attrezzatura Inclusa',
      noEquipment: 'Nessuna attrezzatura disponibile',
      licenseFreeAdvantages: 'Vantaggi delle Barche Senza Patente',
      totalAccessibility: 'Accessibilita Totale',
      noLicenseNeeded: 'Non servono patente ne qualifiche',
      quickLearning: 'Apprendimento rapido (15 minuti)',
      lowerCost: 'Costo di noleggio inferiore',
      perfectBeginners: 'Perfetto per principianti',
      guaranteedFun: 'Divertimento Garantito',
      accessCoves: 'Accesso a calette e spiagge dal mare',
      idealFamilies: 'Ideale per famiglie con bambini',
      safeCoastalNavigation: 'Navigazione in zona costiera sicura',
      immediateAvailability: 'Disponibilita immediata',
      availableExtras: 'Extra Disponibili',
      extrasNote: 'Puoi aggiungere questi extra al completamento della prenotazione online o direttamente al porto prima della partenza.',
      importantInfo: 'Informazioni Importanti',
      essentialDoc: 'Indispensabile: Presentarsi con documento d\'identita o passaporto in corso di validita',
      essentialDocLicense: ' e patente nautica originale',
      licenseRequired: 'Patente nautica richiesta',
      noLicenseRequired: 'Nessuna patente nautica necessaria',
      idealForGroups: 'Ideale per famiglie e gruppi fino a {capacity} persone',
      perfectExplore: 'Perfetto per esplorare le calette della Costa Brava',
      fuelInsuranceIncluded: 'Carburante, assicurazione e attrezzatura di sicurezza inclusi',
      fuelNotIncluded: 'Carburante NON incluso, assicurazione e attrezzatura di sicurezza inclusi',
      conditions: 'Condizioni:',
      rentalConditions: 'le condizioni generali di noleggio',
      beforeBooking: 'prima di effettuare la prenotazione.',
      imageAria: 'Immagine',
    },
    wizard: {
      stepBoat: 'Barca',
      stepTrip: 'Escursione',
      stepYourData: 'I tuoi dati',
      stepConfirm: 'Confermare',
      chooseYourBoat: 'Scegli la tua barca',
      haveNauticalLicense: 'Hai la patente nautica?',
      withoutLicense: 'Senza patente',
      withLicense: 'Con patente',
      selectABoat: 'Seleziona una barca',
      selectDate: 'Seleziona data',
      yourTrip: 'La tua escursione',
      howLongHowMany: 'Quanto tempo e quanti siete?',
      duration: 'Durata',
      departureTime: 'Ora di partenza',
      selectTime: 'Seleziona ora',
      numberOfPeople: 'Numero di persone',
      maxCapacityError: 'Questa barca ha una capacita massima di {max} persone',
      yourData: 'I tuoi dati',
      confirmViaWhatsApp: 'Per confermare la tua prenotazione via WhatsApp',
      firstName: 'Nome',
      lastName: 'Cognome',
      phone: 'Telefono',
      searchCountry: 'Cerca paese...',
      email: 'Email',
      date: 'Data',
    },
    validation: {
      required: 'Questo campo e obbligatorio',
      invalidEmail: 'Email non valida',
      invalidPhone: 'Solo numeri',
      futureDate: 'Seleziona una data futura',
      minPeople: 'Minimo 1 persona',
    },
  },

  ru: {
    nav: {
      home: 'Главная',
      fleet: 'Флот',
      booking: 'Бронирование',
      contact: 'Контакты',
      faq: 'Часто задаваемые вопросы',
      giftCards: 'Подарочные карты',
      viewComponents: 'Просмотр компонентов',
    },
    hero: {
      title: 'Аренда Лодок в Бланесе, Коста Брава',
      subtitle: 'Откройте для себя лучшие бухты Коста Брава с нашими лодками с лицензией и без лицензии. Отправление из порта Бланес.',
      bookNow: 'Забронировать Сейчас',
      viewFleet: 'Посмотреть Флот',
      trustText: 'Без обязательств • Прозрачные цены',
      whatsappContact: 'WhatsApp +34 611 500 372',
      location: 'Местоположение',
      googleRating: '4.8/5 в Google',
      clients: '+5000 клиентов',
      insured: 'Застрахован',
      experience: '+5 лет опыта',
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
      extrasSection: {
        title: 'Дополнения и Пакеты',
        packs: 'Пакеты со скидкой',
        individual: 'Отдельные дополнения',
        included: 'Включает',
        savings: 'Вы экономите',
        noPack: 'Без пакета',
        selected: 'выбрано',
        packSelected: 'Пакет выбран',
      },
      confirmTitle: 'Подтвердить бронирование',
      confirmSubtitle: 'Проверьте детали и добавьте дополнительные услуги',
      summaryClient: 'Клиент',
      estimatedTotal: 'Примерная сумма',
      discountApplied: 'Скидка применена',
      priceConfirmedWhatsApp: 'Окончательная цена подтверждается в WhatsApp',
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
      book: 'Забронировать',
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
    giftCardBanner: {
      title: 'Подарите уникальный опыт на море',
      subtitle: 'Подарочные карты от 50EUR. Идеальный подарок для любого случая.',
      cta: 'Купить подарочную карту',
    },
    codeValidation: {
      haveCode: 'Есть подарочная карта или код скидки?',
      enterCode: 'Введите ваш код',
      validate: 'Проверить',
      validGiftCard: 'Действительная подарочная карта',
      validDiscount: 'Действительный код скидки',
      invalidCode: 'Недействительный или просроченный код',
      value: 'Стоимость',
      discount: 'Скидка',
      applied: 'Применено',
      apply: 'Применить',
    },
    giftCards: {
      title: 'Подарочные карты',
      subtitle: 'Подарите незабываемый морской опыт на Коста-Браве',
      selectAmount: 'Выберите сумму',
      customAmount: 'Произвольная сумма',
      details: 'Ваши данные',
      yourName: 'Ваше имя',
      yourEmail: 'Ваш email',
      yourNameRequired: 'Ваше имя обязательно',
      yourEmailRequired: 'Ваш email обязателен',
      recipientInfo: 'Данные получателя',
      recipientName: 'Имя получателя',
      recipientEmail: 'Email получателя',
      recipientNameRequired: 'Имя получателя обязательно',
      recipientEmailRequired: 'Email получателя обязателен',
      message: 'Личное сообщение (необязательно)',
      messagePlaceholder: 'Напишите сообщение для получателя...',
      total: 'Итого',
      validOneYear: 'Действительна 1 год',
      allBoats: 'Можно использовать на всех лодках',
      buy: 'Купить подарочную карту',
      processing: 'Обработка...',
      purchaseSuccess: 'Покупка завершена!',
      purchaseSuccessDesc: 'Подарочная карта успешно создана',
      code: 'Код карты',
      forRecipient: 'Для',
      backHome: 'На главную',
      buyAnother: 'Купить ещё',
    },
    boatDetail: {
      notFound: 'Лодка не найдена',
      backToFleet: 'Вернуться к флоту',
      description: 'Описание',
      fuelIncluded: 'Топливо включено!',
      readyForAdventure: 'Готовы к приключению?',
      bookNowCTA: 'Забронируйте {boatName} сейчас и наслаждайтесь бухтами Коста Бравы',
      pricesBySeason: 'Цены по сезонам',
      seasonLow: 'НИЗКИЙ сезон',
      seasonMid: 'СРЕДНИЙ сезон',
      seasonHigh: 'ВЫСОКИЙ сезон',
      priceIncludes: 'В стоимость входит:',
      mainFeatures: 'Основные характеристики',
      noFeatures: 'Характеристики недоступны',
      technicalSpecs: 'Технические характеристики',
      specModel: 'Модель:',
      specLength: 'Длина:',
      specBeam: 'Ширина:',
      specEngine: 'Двигатель:',
      specFuel: 'Топливо:',
      specCapacity: 'Вместимость:',
      specDeposit: 'Залог:',
      equipmentIncluded: 'Оборудование включено',
      noEquipment: 'Оборудование недоступно',
      licenseFreeAdvantages: 'Преимущества лодок без лицензии',
      totalAccessibility: 'Полная доступность',
      noLicenseNeeded: 'Не нужна лицензия или квалификация',
      quickLearning: 'Быстрое обучение (15 минут)',
      lowerCost: 'Более низкая стоимость аренды',
      perfectBeginners: 'Идеально для начинающих',
      guaranteedFun: 'Гарантированное удовольствие',
      accessCoves: 'Доступ к бухтам и пляжам с моря',
      idealFamilies: 'Идеально для семей с детьми',
      safeCoastalNavigation: 'Безопасная прибрежная зона навигации',
      immediateAvailability: 'Немедленная доступность',
      availableExtras: 'Доступные дополнения',
      extrasNote: 'Вы можете добавить любые дополнения при оформлении онлайн-бронирования или непосредственно в порту перед отплытием.',
      importantInfo: 'Важная информация',
      essentialDoc: 'Обязательно: Иметь при себе действующее удостоверение личности или паспорт',
      essentialDocLicense: ' и оригинал лицензии на судовождение',
      licenseRequired: 'Требуется лицензия на судовождение',
      noLicenseRequired: 'Лицензия на судовождение не требуется',
      idealForGroups: 'Идеально для семей и групп до {capacity} человек',
      perfectExplore: 'Идеально для исследования бухт Коста Бравы',
      fuelInsuranceIncluded: 'Топливо, страховка и оборудование безопасности включены',
      fuelNotIncluded: 'Топливо НЕ включено, страховка и оборудование безопасности включены',
      conditions: 'Условия:',
      rentalConditions: 'общие условия аренды',
      beforeBooking: 'перед бронированием.',
      imageAria: 'Изображение',
    },
    wizard: {
      stepBoat: 'Лодка',
      stepTrip: 'Экскурсия',
      stepYourData: 'Ваши данные',
      stepConfirm: 'Подтвердить',
      chooseYourBoat: 'Выберите лодку',
      haveNauticalLicense: 'Есть ли у вас права?',
      withoutLicense: 'Без прав',
      withLicense: 'С правами',
      selectABoat: 'Выберите лодку',
      selectDate: 'Выберите дату',
      yourTrip: 'Ваша экскурсия',
      howLongHowMany: 'Сколько времени и сколько вас?',
      duration: 'Длительность',
      departureTime: 'Время отправления',
      selectTime: 'Выберите время',
      numberOfPeople: 'Количество людей',
      maxCapacityError: 'Эта лодка вмещает максимум {max} человек',
      yourData: 'Ваши данные',
      confirmViaWhatsApp: 'Для подтверждения бронирования через WhatsApp',
      firstName: 'Имя',
      lastName: 'Фамилия',
      phone: 'Телефон',
      searchCountry: 'Поиск страны...',
      email: 'Email',
      date: 'Дата',
    },
    validation: {
      required: 'Это поле обязательно',
      invalidEmail: 'Неверный email',
      invalidPhone: 'Только цифры',
      futureDate: 'Выберите будущую дату',
      minPeople: 'Минимум 1 человек',
    },
  },
};

// Deep merge helper: fills missing keys from fallback
function deepMerge(target: Record<string, any>, fallback: Record<string, any>): Record<string, any> {
  const result = { ...fallback, ...target };
  for (const key of Object.keys(fallback)) {
    if (
      typeof fallback[key] === 'object' &&
      fallback[key] !== null &&
      !Array.isArray(fallback[key]) &&
      typeof target[key] === 'object' &&
      target[key] !== null
    ) {
      result[key] = deepMerge(target[key], fallback[key]);
    }
  }
  return result;
}

// Translation hook — falls back to Spanish for missing keys
export function useTranslations(): Translations {
  const { language } = useLanguage();
  if (language === 'es') return translations.es;
  return deepMerge(translations[language] as Record<string, any>, translations.es as Record<string, any>) as Translations;
}