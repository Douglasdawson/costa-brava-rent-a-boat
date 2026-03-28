import { Language, useLanguage } from '@/hooks/use-language';
import { es } from '../i18n/es';

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
    bookNow: string;
    myAccount: string;
  };
  
  // Hero Section
  hero: {
    title: string;
    subtitle: string;
    subtitleLine1: string;
    subtitleLine2: string;
    subtitleMobile: string;
    priceBadge: string;
    fuelBadge: string;
    bookNow: string;
    findYourBoat: string;
    viewFleet: string;
    trustText: string;
    whatsappContact: string;
    location: string;
    googleRating: string;
    clients: string;
    insured: string;
    experience: string;
    freeCancellation: string;
    instantConfirmation: string;
    marqueeText: string;
    askWhatsApp: string;
    testimonialQuote: string;
    testimonialQuoteShort: string;
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
    mostPopular: string;
    perPerson: string;
    popularDuration: string;
    seasonPriceLow: string;
    seasonPriceMid: string;
    weeklyBookings: string;
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
    capacity: {
      title: string;
      description: string;
    };
    flexibleHours: {
      title: string;
      description: string;
    };
    location: {
      title: string;
      description: string;
    };
    personalAttention: {
      title: string;
      description: string;
    };
    whyUs: string;
    whyUsSub: string;
    extrasTitle: string;
    extrasSub: string;
    extras: {
      snorkel: { name: string; description: string };
      paddle: { name: string; description: string };
      cooler: { name: string; description: string };
      privateTour: { name: string; description: string; price: string };
      parking: { name: string; description: string };
    };
  };

  // Never Sailed Section
  neverSailed: {
    title: string;
    subtitle: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    cta: string;
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
    emailLabel: string;
    emailResponse: string;
    locationLabel: string;
    locationCity: string;
    seasonLabel: string;
    seasonMonths: string;
    flexibleHours: string;
    consultWhatsApp: string;
    discoverMore: string;
    discoverMoreSub: string;
    viewDetails: string;
    viewBoats: string;
    navBlanesTitle: string;
    navBlanesBadge: string;
    navBlanesDesc: string;
    navBlanesTag1: string;
    navBlanesTag2: string;
    navBlanesTag3: string;
    navLloretTitle: string;
    navLloretBadge: string;
    navLloretDesc: string;
    navLloretTag1: string;
    navLloretTag2: string;
    navLloretTag3: string;
    navTossaTitle: string;
    navTossaBadge: string;
    navTossaDesc: string;
    navTossaTag1: string;
    navTossaTag2: string;
    navTossaTag3: string;
    navLicensedTitle: string;
    navLicensedDesc: string;
    navLicensedTag1: string;
    navLicensedTag2: string;
    navLicensedTag3: string;
    mapTitle: string;
    mapSubtitle: string;
    viewMap: string;
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
    information: string;
    blog: string;
    faqLabel: string;
    customerReviews: string;
    cookiesPolicy: string;
    destinations: string;
    gallery: string;
    accessibility: string;
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
    sendRequest: string;
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
    // New booking flow keys
    boatType: string;
    allBoats: string;
    optional: string;
    nationality: string;
    searchNationality: string;
    person: string;
    deposit: string;
    subtotal: string;
    season: string;
    getQuote: string;
    creatingQuote: string;
    quoteDescription: string;
    quoteCreated: string;
    quoteTimeLimit: string;
    processingPayment: string;
    estimatedPriceNote: string;
    scheduleAndDuration: string;
    startTime: string;
    iAcceptThe: string;
    andThe: string;
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
    needHelp: string;
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
    basePrice: string;
    discountApplied: string;
    earlyBirdDiscount: string;
    flashDealDiscount: string;
    priceConfirmedWhatsApp: string;
    gdprConsent: string;
    gdprPrivacyLink: string;
    gdprTermsLink: string;
    gdprPassive: string;
    errorGeneric: string;
    errorPayment: string;
    backToHome: string;
    // 3-step flow labels
    stepExperience: string;
    stepPersonalize: string;
    stepPay: string;
    chooseBoatFirst: string;
    chooseTimeFirst: string;
    // Pricing transparency
    weekendSurchargeTitle?: string;
    weekendSurcharge?: string;
    weekendSurchargeLabel?: string;
    minDuration2h?: string;
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
    fleet: string;
    locations: string;
    categories: string;
    legal: string;
    faq: string;
    categoryLicenseFree: string;
    categoryLicensed: string;
    locationBlanes: string;
    locationLloret: string;
    locationTossa: string;
    locationMalgrat: string;
    locationSantaSusanna: string;
    locationCalella: string;
    privacyPolicy: string;
    termsConditions: string;
  };

  // Related Boats
  relatedBoats: {
    title: string;
    viewDetails: string;
    from: string;
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
    introText: string;
    introFleetLink: string;
    introSuffix: string;
    lloretTitle: string;
    lloretDesc: string;
    tossaTitle: string;
    tossaDesc: string;
    pricesTitle: string;
    pricesDesc: string;
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
    periodLow: string;
    periodMid: string;
    periodHigh: string;
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
    whatToBringTitle: string;
    whatToBringItems: string[];
    whatToBringTip: string;
    imageAria: string;
  };

  // Booking Wizard Mobile
  wizard: {
    stepBoat: string;
    stepTrip: string;
    stepExtras: string;
    stepYourData: string;
    stepConfirm: string;
    estimatedTime: string;
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
    /** Tooltip: "Min. {duration} in August (peak season)" */
    durationMinPeakSeason: string;
    /** Tooltip: "Min. {duration} on weekends" */
    durationMinWeekend: string;
    /** Badge on 4h duration: "Most popular" */
    mostPopular: string;
    /** Suggestion text near calendar: "Next available Saturday" */
    suggestedDate: string;
  };

  // Inline validation messages
  validation: {
    required: string;
    invalidEmail: string;
    invalidPhone: string;
    futureDate: string;
    minPeople: string;
  };

  // Reviews Section
  reviews: {
    opinions: string;
    title: string;
    subtitle: string;
    viewAll: string;
    boatReviewsTitle: string;
    reviewCount: string;
  };

  // Destinations Section
  destinations: {
    fromBlanes: string;
    fromBlanesSub: string;
    boatTypes: string;
    boatTypesSub: string;
    viewDetails: string;
    viewBoats: string;
    tossaName: string;
    tossaDesc: string;
    tossaDuration: string;
    tossaH1: string;
    tossaH2: string;
    tossaH3: string;
    licenseFree: string;
    licenseFreeDesc: string;
    licenseFreeFeat1: string;
    licenseFreeFeat2: string;
    licenseFreeFeat3: string;
  };

  // Homepage Locations Section (SEO internal linking)
  homepageLocations: {
    sectionTitle: string;
    sectionSubtitle: string;
    sailTo: string;
    nearbyTowns: string;
    blanes: string;
    blanesDesc: string;
    costaBrava: string;
    costaBravaDesc: string;
    lloret: string;
    lloretDesc: string;
    tossa: string;
    tossaDesc: string;
    malgrat: string;
    malgratDesc: string;
    santaSusanna: string;
    santaSusannaDesc: string;
    calella: string;
    calellaDesc: string;
    pineda: string;
    pinedaDesc: string;
    palafolls: string;
    palafollsDesc: string;
    tordera: string;
    torderaDesc: string;
    barcelona: string;
    barcelonaDesc: string;
  };

  locationPages: {
    blanes: {
      hero: {
        title: string;
        subtitle: string;
        badgePort: string;
        badgeCapacity: string;
        badgeDuration: string;
      };
      sections?: {
        whyBlanesTitle: string;
        strategicLocation: string;
        strategicLocationDesc: string;
        safePorts: string;
        safePortsDesc: string;
        accessibleCoves: string;
        accessibleCovesDesc: string;
        allLevels: string;
        allLevelsDesc: string;
        destinationsTitle: string;
        calaBrava: string;
        calaBravaTime: string;
        calaBravaDesc: string;
        lloretDeMar: string;
        lloretTime: string;
        lloretDesc: string;
        calaSantFrancesc: string;
        calaSantFrancescTime: string;
        calaSantFrancescDesc: string;
        servicesTitle: string;
        portAmenities: string;
        freeParking: string;
        fuelStation: string;
        restaurants: string;
        nauticalShops: string;
        howToGet: string;
        fromBarcelona: string;
        fromGirona: string;
        fromFrance: string;
        publicTransport: string;
        ctaTitle: string;
        ctaDescription: string;
        ctaButton: string;
        mapTitle: string;
        // Section A: Fleet
        fleetTitle: string;
        fleetIntro: string;
        fleetNoLicense: string;
        fleetLicense: string;
        fleetFrom: string;
        fleetViewDetails: string;
        // Section B: Complete Guide
        guideTitle: string;
        guideRequirementsTitle: string;
        guideRequirementsText: string;
        guideSeasonTitle: string;
        guideSeasonText: string;
        guideIncludedTitle: string;
        guideIncludedText: string;
        guideBookingTitle: string;
        guideBookingText: string;
        // Section C: Pricing
        pricingTitle: string;
        pricingIntro: string;
        pricingSeasons: string;
        pricingBoatCol: string;
        pricingCapacityCol: string;
        pricingLowCol: string;
        pricingHighCol: string;
        pricingFuelNote: string;
        pricingFullDetails: string;
        // Section D: Experiences
        experiencesTitle: string;
        expSnorkelTitle: string;
        expSnorkelDesc: string;
        expSunsetTitle: string;
        expSunsetDesc: string;
        expTossaTitle: string;
        expTossaDesc: string;
        expFishingTitle: string;
        expFishingDesc: string;
      };
    };
    lloret: {
      hero: {
        title: string;
        subtitle: string;
        badgeFrom: string;
        badgeTime: string;
        badgeCapacity: string;
      };
      sections?: {
        whyLloretTitle: string;
        uniquePerspective: string;
        uniquePerspectiveDesc: string;
        spectacularBeaches: string;
        spectacularBeachesDesc: string;
        vibrantAtmosphere: string;
        vibrantAtmosphereDesc: string;
        easyAccess: string;
        easyAccessDesc: string;
        beachesTitle: string;
        playaLloret: string;
        playaLloretSub: string;
        playaLloretDesc: string;
        calaBoadella: string;
        calaBoadellaSub: string;
        calaBoadellaDesc: string;
        santaCristina: string;
        santaCristinaSub: string;
        santaCristinaDesc: string;
        whatToDoTitle: string;
        entertainment: string;
        nightlife: string;
        restaurantsSea: string;
        waterSports: string;
        santaClotildeMirador: string;
        pointsOfInterest: string;
        mujerMarinera: string;
        castilloSantJoan: string;
        jardinesSantaClotilde: string;
        sportsMarina: string;
        navigationTipsTitle: string;
        recommendedRoute: string;
        recommendedRouteDesc: string;
        bestTimes: string;
        bestTimesDesc: string;
        whereToAnchor: string;
        whereToAnchorDesc: string;
        safety: string;
        safetyDesc: string;
        ctaTitle: string;
        ctaDescription: string;
        ctaButton: string;
      };
    };
    tossa: {
      hero: {
        title: string;
        subtitle: string;
        badgeFrom: string;
        badgeTime: string;
        badgeCapacity: string;
      };
      sections?: {
        whyTossaTitle: string;
        jewelCostaBrava: string;
        jewelCostaBravaDesc: string;
        historicHeritage: string;
        historicHeritageDesc: string;
        paradisiacalCoves: string;
        paradisiacalCovesDesc: string;
        panoramicNavigation: string;
        panoramicNavigationDesc: string;
        attractionsTitle: string;
        vilaVella: string;
        vilaVellaSub: string;
        vilaVellaDesc: string;
        playaGrande: string;
        playaGrandeSub: string;
        playaGrandeDesc: string;
        virginCoves: string;
        virginCovesSub: string;
        virginCovesDesc: string;
        whatToDoTitle: string;
        cultureHistory: string;
        exploreVilaVella: string;
        climbWalls: string;
        municipalMuseum: string;
        tossaLighthouse: string;
        natureRelax: string;
        diveCrystalWaters: string;
        anchorSecretCoves: string;
        coastalPaths: string;
        sunsetFromSea: string;
        navigationTipsTitle: string;
        recommendedRoute: string;
        recommendedRouteDesc: string;
        bestSeason: string;
        bestSeasonDesc: string;
        anchoringZones: string;
        anchoringZonesDesc: string;
        safeNavigation: string;
        safeNavigationDesc: string;
        ctaTitle: string;
        ctaDescription: string;
        ctaButton: string;
      };
    };
    malgrat: {
      hero: {
        title: string;
        subtitle: string;
        badgeDistance: string;
        badgeTime: string;
        badgeBeach: string;
      };
      sections?: {
        whyRentTitle: string;
        closestPort: string;
        closestPortDesc: string;
        varietyBoats: string;
        varietyBoatsDesc: string;
        fuelIncluded: string;
        fuelIncludedDesc: string;
        noExperience: string;
        noExperienceDesc: string;
        townAttractionsTitle: string;
        attraction1: string;
        attraction1Desc: string;
        attraction2: string;
        attraction2Desc: string;
        attraction3: string;
        attraction3Desc: string;
        howToGetTitle: string;
        byCar: string;
        byCarDesc: string;
        byTaxi: string;
        byTaxiDesc: string;
        byPublicTransport: string;
        byPublicTransportDesc: string;
        parkingAtBlanes: string;
        parkingAtBlanesDesc: string;
        boatDestinationsTitle: string;
        boatDestinationsDesc: string;
        ctaTitle: string;
        ctaDescription: string;
        ctaButton: string;
      };
    };
    santaSusanna: {
      hero: {
        title: string;
        subtitle: string;
        badgeDistance: string;
        badgeTime: string;
        badgeBeach: string;
      };
      sections?: {
        whyRentTitle: string;
        closestPort: string;
        closestPortDesc: string;
        varietyBoats: string;
        varietyBoatsDesc: string;
        fuelIncluded: string;
        fuelIncludedDesc: string;
        noExperience: string;
        noExperienceDesc: string;
        townAttractionsTitle: string;
        attraction1: string;
        attraction1Desc: string;
        attraction2: string;
        attraction2Desc: string;
        attraction3: string;
        attraction3Desc: string;
        howToGetTitle: string;
        byCar: string;
        byCarDesc: string;
        byTaxi: string;
        byTaxiDesc: string;
        byPublicTransport: string;
        byPublicTransportDesc: string;
        parkingAtBlanes: string;
        parkingAtBlanesDesc: string;
        boatDestinationsTitle: string;
        boatDestinationsDesc: string;
        ctaTitle: string;
        ctaDescription: string;
        ctaButton: string;
      };
    };
    calella: {
      hero: {
        title: string;
        subtitle: string;
        badgeDistance: string;
        badgeTime: string;
        badgeBeach: string;
      };
      sections?: {
        whyRentTitle: string;
        closestPort: string;
        closestPortDesc: string;
        varietyBoats: string;
        varietyBoatsDesc: string;
        fuelIncluded: string;
        fuelIncludedDesc: string;
        noExperience: string;
        noExperienceDesc: string;
        townAttractionsTitle: string;
        attraction1: string;
        attraction1Desc: string;
        attraction2: string;
        attraction2Desc: string;
        attraction3: string;
        attraction3Desc: string;
        howToGetTitle: string;
        byCar: string;
        byCarDesc: string;
        byTaxi: string;
        byTaxiDesc: string;
        byPublicTransport: string;
        byPublicTransportDesc: string;
        parkingAtBlanes: string;
        parkingAtBlanesDesc: string;
        boatDestinationsTitle: string;
        boatDestinationsDesc: string;
        ctaTitle: string;
        ctaDescription: string;
        ctaButton: string;
      };
    };
    costaBrava?: {
      hero: {
        title: string;
        subtitle: string;
        badgePort: string;
        badgeCapacity: string;
        badgeLicense: string;
      };
      sections: {
        introP1: string;
        introP2: string;
        introP3: string;
        whyChooseTitle: string;
        covesTitle: string;
        covesDesc: string;
        calmWatersTitle: string;
        calmWatersDesc: string;
        accessibleTitle: string;
        accessibleDesc: string;
        allLevelsTitle: string;
        allLevelsDesc: string;
        navigationGuideTitle: string;
        routeBlanesLloret: string;
        routeBlanesLloretDesc: string;
        routeBlanesTossa: string;
        routeBlanesTossaDesc: string;
        routeBlaneSantFeliu: string;
        routeBlaneSantFeliuDesc: string;
        routeBlaneCalaBrava: string;
        routeBlaneCalaBravaDesc: string;
        boatTypesTitle: string;
        noLicenseTitle: string;
        noLicensePower: string;
        noLicenseCapacity: string;
        noLicenseNavigation: string;
        noLicenseFuel: string;
        noLicensePrice: string;
        noLicenseDesc: string;
        licensedTitle: string;
        licensedPower: string;
        licensedCapacity: string;
        licensedNavigation: string;
        licensedFuel: string;
        licensedPrice: string;
        licensedDesc: string;
        bestCovesTitle: string;
        calaBravaName: string;
        calaBravaDesc: string;
        calaSantFrancescName: string;
        calaSantFrancescDesc: string;
        calaTreumalName: string;
        calaTreumalDesc: string;
        calaBBoadellaName: string;
        calaBBoadellaDesc: string;
        platjaPalomeraName: string;
        platjaPalomeraDesc: string;
        pricingTitle: string;
        ctaTitle: string;
        ctaDescription: string;
        ctaButton: string;
        crossLinkEnglish: string;
      };
      faq: {
        experienceQ: string;
        experienceA: string;
        distanceQ: string;
        distanceA: string;
        weatherQ: string;
        weatherA: string;
        petsQ: string;
        petsA: string;
      };
    };
    newsletter: {
      title: string;
      subtitle: string;
      placeholder: string;
      button: string;
      success: string;
      error: string;
    };
  };

  // Category License-Free Page
  categoryLicenseFree?: {
    heroTitle: string;
    heroDescription: string;
    badgeNoLicense: string;
    badgePower: string;
    badgeCapacity: string;
    whatAreTitle: string;
    freeNavigation: string;
    freeNavigationDesc: string;
    easyToHandle: string;
    easyToHandleDesc: string;
    safeLimits: string;
    safeLimitsDesc: string;
    completeEquipment: string;
    completeEquipmentDesc: string;
    fleetTitle: string;
    advantagesTitle: string;
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
    safetyTitle: string;
    minRequirements: string;
    minAge: string;
    validId: string;
    deposit: string;
    safetyBriefing: string;
    safetyIncluded: string;
    lifeJackets: string;
    fireExtinguisher: string;
    vhfRadio: string;
    civilLiability: string;
    ctaTitle: string;
    ctaDescription: string;
    ctaButton: string;
    // Section A: Legal framework
    regulationTitle: string;
    regulationIntro: string;
    regulationRequirements: string;
    regulationAllowed: string;
    regulationNotAllowed: string;
    regulationFuelIncluded: string;
    // Section B: Detailed comparison
    comparisonTitle: string;
    comparisonIntro: string;
    comparisonBoatName: string;
    comparisonCapacity: string;
    comparisonEngine: string;
    comparisonBestFor: string;
    comparisonPriceLow: string;
    comparisonPriceHigh: string;
    comparisonSolar450: string;
    comparisonRemus450: string;
    comparisonAstec400: string;
    comparisonAstec480: string;
    // Section C: Testimonials
    testimonialsTitle: string;
    testimonial1Name: string;
    testimonial1Text: string;
    testimonial1Context: string;
    testimonial2Name: string;
    testimonial2Text: string;
    testimonial2Context: string;
    testimonial3Name: string;
    testimonial3Text: string;
    testimonial3Context: string;
    testimonial4Name: string;
    testimonial4Text: string;
    testimonial4Context: string;
    // FAQ additions
    faqSpeedQuestion: string;
    faqSpeedAnswer: string;
    faqChildrenQuestion: string;
    faqChildrenAnswer: string;
    faqDistanceQuestion: string;
    faqDistanceAnswer: string;
  };

  // Category Licensed Page
  categoryLicensed?: {
    heroTitle: string;
    heroDescription: string;
    badgeLicense: string;
    badgePower: string;
    badgeCapacity: string;
    whatAreTitle: string;
    advancedNavigation: string;
    advancedNavigationDesc: string;
    greaterFreedom: string;
    greaterFreedomDesc: string;
    professionalEquipment: string;
    professionalEquipmentDesc: string;
    superiorPerformance: string;
    superiorPerformanceDesc: string;
    fleetTitle: string;
    advantagesTitle: string;
    superiorPerformanceAdv: string;
    greaterSpeedPower: string;
    unlimitedDistance: string;
    remoteCoves: string;
    betterOpenSea: string;
    premiumExperience: string;
    advancedNavEquipment: string;
    greaterComfort: string;
    greaterFuelAutonomy: string;
    sportNavigation: string;
    requirementsTitle: string;
    acceptedLicenses: string;
    per: string;
    pnb: string;
    yachtCaptain: string;
    icc: string;
    euEquivalent: string;
    additionalRequirements: string;
    minAge: string;
    validId: string;
    validLicense: string;
    deposit: string;
    technicalBriefing: string;
    whatCanDoTitle: string;
    expandedDestinations: string;
    islasMedas: string;
    begurCoves: string;
    cadaques: string;
    nightNavigation: string;
    specialActivities: string;
    sportFishing: string;
    fullDayTrips: string;
    sportNav: string;
    portToPort: string;
    ctaTitle: string;
    ctaDescription: string;
    ctaButton: string;
  };

  // Blog Page
  blogPage?: {
    title: string;
    subtitle: string;
    breadcrumbHome: string;
    breadcrumbBlog: string;
    article: string;
    articles: string;
    inCategory: string;
    filterPlaceholder: string;
    allCategories: string;
    noArticles: string;
    errorTitle: string;
    errorDescription: string;
    retry: string;
    prevPage: string;
    nextPage: string;
    goToPage: string;
    featuredArticle: string;
    readMore: string;
    minRead: string;
    ctaBanner: string;
    ctaBannerButton: string;
  };

  // Blog Detail Page
  blogDetail?: {
    breadcrumbHome: string;
    breadcrumbBlog: string;
    backToBlog: string;
    relatedArticles: string;
    readMore: string;
    notFoundTitle: string;
    notFoundDescription: string;
    shareArticle: string;
    copyLink: string;
    linkCopied: string;
    share: string;
    minRead: string;
    previousArticle: string;
    nextArticle: string;
    newsletterTitle: string;
    newsletterSubtitle: string;
    newsletterPlaceholder: string;
    newsletterButton: string;
    newsletterSuccess: string;
    newsletterError: string;
    tableOfContents: string;
    ctaTitle: string;
    ctaSubtitle: string;
    ctaBookNow: string;
    ctaWhatsApp: string;
  };

  // Social Proof Strip (homepage)
  socialProof: {
    googleReviews: string;
    happyCustomers: string;
    since2020: string;
    freeCancellation: string;
  };

  // License Comparison Section (homepage)
  comparison: {
    title: string;
    subtitle: string;
    withoutLicense: string;
    withLicense: string;
    withoutLicenseDesc: string;
    withLicenseDesc: string;
    noLicenseNeeded: string;
    licenseRequired: string;
    noLicenseFeature1: string;
    noLicenseFeature2: string;
    noLicenseFeature3: string;
    noLicenseFeature4: string;
    licenseFeature1: string;
    licenseFeature2: string;
    licenseFeature3: string;
    licenseFeature4: string;
    fromPrice: string;
    // Fleet comparison table
    compare: string;
    tableCapacity: string;
    tableLicense: string;
    tableEngine: string;
    tableDuration: string;
    tablePriceFrom: string;
    tablePricePerPerson: string;
    tableRating: string;
    tableFuelIncluded: string;
    tableYes: string;
    tableNo: string;
    viewBoats: string;
    viewAll: string;
  };

  // Exit Intent Modal
  exitIntent?: {
    title: string;
    subtitle: string;
    useCode: string;
    validFirstBooking: string;
    bookNow: string;
    noThanks: string;
  };

  // Price Anchoring
  pricing?: {
    save: string;
    highSeason: string;
    depositLabel: string;
    depositRefundable: string;
    payAtPort: string;
  };

  // Price Summary (persistent during booking flow)
  priceSummary?: {
    base: string;
    extras: string;
    discount: string;
    total: string;
    seeDetails: string;
  };

  // Boat Recommendation
  recommendation?: {
    howManyPeople: string;
    people: string;
    recommendedForYou: string;
    bestFor: string;
    all: string;
    licenseFilter: string;
    withoutLicense: string;
    withLicense: string;
  };

  // Social Proof Toast (FOMO notification)
  socialProofToast?: {
    booked: string;
    forPeople: string;
    from: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
    recently: string;
  };

  // Review Summary (step 4 booking review card)
  reviewSummary?: {
    title: string;
    modify: string;
  };

  // Endowment Effect (possessive language after boat selection)
  endowment?: {
    yourTripIn: string;        // "Tu viaje en {boat}" — step 2 header with boat name
    customizeExperience: string; // "Personaliza tu experiencia" — step 3 header
    confirmYourBooking: string;  // "Confirma tu reserva" — step 4 header
    yourPrice: string;          // "Tu precio" — price summary label
    yourTrip: string;           // "Tu viaje" — progress bar step 2 label
    yourExperience: string;     // "Tu experiencia" — progress bar step 3 label
    confirmStep: string;        // "Confirmar" — progress bar step 4 label
    yourBoat: string;           // "Tu {boat}" — review summary boat name
  };

  // Reciprocity — free value before asking for booking
  reciprocity?: {
    captainTip: string;
    captainTipText: string;
    whatToBring: string;
    sunscreen: string;
    towels: string;
    waterSnacks: string;
    sunglasses: string;
    camera: string;
    freeGuideTitle: string;
    freeGuideSubtitle: string;
    sendFreeGuide: string;
    freeGuideSent: string;
  };

  // FAQ Preview (homepage accordion — 12 items)
  faqPreview?: {
    title: string;
    subtitle: string;
    viewAll: string;
    items: Array<{
      id: string;
      question: string;
      answer: string;
    }>;
  };

  // Booking Trust Strip (inside booking modal)
  bookingTrust?: {
    customers: string;
    rating: string;
    confirmation: string;
  };

  // Hold Countdown (booking form urgency timer)
  holdCountdown?: {
    reserved: string;
    expired: string;
    selectAnother: string;
    hurry: string;
    expiredSoft: string;
    verifyButton: string;
  };

  // Fleet Scarcity Badges
  scarcity?: {
    soldOutSaturday: string;
    onlyXSlots: string;
    availableSaturday: string;
  };

  // Season Urgency Banner
  seasonBanner?: {
    earlyBird: string;
    springPrices: string;
    bookBefore: string;
    daysLeft: string;
    lastDays: string;
    dontMissIt: string;
    viewBoats: string;
    bookNow: string;
    noThanks: string;
    limitedSpots: string;
    discountWithCode: string;
  };

  // Authority Badges & Trust Credentials
  authority?: {
    yearsExperience: string;
    fullInsurance: string;
    happyCustomers: string;
    fleetInsured: string;
    zeroIncidents: string;
    certifiedCaptains: string;
    officialPort: string;
    registeredBusiness: string;
    maritimeInsurance: string;
    gdprCompliant: string;
  };

  // Booking Confirmation (post-booking peak-end experience)
  confirmation?: {
    title: string;
    summary: string;
    checklist: string;
    checklistItems: string[];
    whatsNext: string;
    whatsNextSteps: string[];
    shareTitle: string;
    shareWhatsApp: string;
    copyLink: string;
    shareWhatsAppMessage: string;
    repeatBooking: string;
    saveDiscount: string;
    discountCode: string;
    linkCopied: string;
    close: string;
  };

  // Not Found Page
  notFound?: {
    title: string;
    description: string;
    backHome: string;
  };

  // Cancel Booking Page
  cancelBooking?: {
    tokenNotFound: string;
  };

  // Accessibility aria-labels
  a11y: {
    goToHomePage: string;
    bookBoatNow: string;
    accessMyAccount: string;
    openNavMenu: string;
    closeNavMenu: string;
    mobileNavMenu: string;
    switchToLightMode: string;
    switchToDarkMode: string;
    decreasePeople: string;
    increasePeople: string;
    remove: string;
    bookingForm: string;
    goBackToStep: string;
    continueToStep: string;
    submitBookingWhatsApp: string;
    filterByLicense: string;
    phonePrefix: string;
    scrollToTop: string;
    close: string;
    callPhone: string;
    sendEmail: string;
    viewOnMap: string;
    checkWhatsApp: string;
    viewBoatDetails: string;
    stepOf: string;
  };

  // Boat descriptions (keyed by boat ID)
  boatDescriptions?: Record<string, string>;
}
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

// Translation hook — loads current language lazily; falls back to Spanish for missing keys
export function useTranslations(): Translations {
  const { language, currentTranslation } = useLanguage();
  if (language === 'es') return currentTranslation as Translations;
  return deepMerge(currentTranslation as Record<string, any>, es as Record<string, any>) as Translations;
}