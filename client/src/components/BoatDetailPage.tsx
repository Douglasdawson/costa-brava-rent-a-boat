import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useBookingModal } from "@/hooks/bookingModalContext";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Users, 
  Anchor, 
  Fuel, 
  Euro,
  Calendar,
  CheckCircle,
  Star,
  Navigation as NavigationIcon,
ArrowUpDown,
  ArrowLeftRight,
  Zap,
  Shield,
  Eye,
  Waves,
  Heart,
  Sun,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import SnorkelIcon from "@/components/icons/SnorkelIcon";
import SeascooterIcon from "@/components/icons/SeascooterIcon";
import ParkingIcon from "@/components/icons/ParkingIcon";
import PaddleSurfIcon from "@/components/icons/PaddleSurfIcon";
import NeveraIcon from "@/components/icons/NeveraIcon";
import BebidasIcon from "@/components/icons/BebidasIcon";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import { openWhatsApp } from "@/utils/whatsapp";
import { getBoatImage, getBoatImageSrcSet, getBoatAltText } from "@/utils/boatImages";
import { useResponsiveGallery } from "@/hooks/useResponsiveGallery";
import { useThrottledScroll } from "@/hooks/useThrottledScroll";
import Navigation from "./Navigation";
import { ReadingProgressBar } from "./ReadingProgressBar";
import Footer from "./Footer";
import { SEO } from "./SEO";
import { useLanguage } from "@/hooks/use-language";
import { 
  getSEOConfig, 
  generateHreflangLinks, 
  generateCanonicalUrl,
  generateEnhancedProductSchema,
  generateBreadcrumbSchema
} from "@/utils/seo-config";
import type { Boat } from "@shared/schema";
import { filterActivePrices, getMinActivePrice } from "@shared/pricing";
import { buildBoatFaqItems, buildBoatFaqTitle, type BoatFaqText } from "@shared/boatFaqBuilder";
import { Breadcrumbs } from "./Breadcrumbs";
import { useTranslations } from "@/lib/translations";
import AvailabilityCalendar from "./AvailabilityCalendar";
import AvailabilityUrgency from "./AvailabilityUrgency";
import { LiveInterestIndicator } from "./LiveInterestIndicator";
import { TrustBadges } from "./TrustBadges";
import BoatReviewCarousel from "./BoatReviewCarousel";
import { getBoatReviews, getBoatAverageRating } from "@/data/boatReviews";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { BookingPrefillData } from "@/hooks/bookingModalContext";
import { trackGoogleAdsRemarketing } from "@/utils/google-ads";
import { trackMetaViewContent } from "@/utils/meta-pixel";
import { trackViewItem } from "@/utils/analytics";
import { useScrollDepthTracking } from "@/hooks/useScrollDepthTracking";
import { saveLastViewedBoat } from "@/hooks/useJourneyState";
import { translateExtraName } from "@/utils/extraNameTranslations";

// Translation map for boat data strings that come from the DB in Spanish
const boatTextTranslations: Record<string, Record<string, string>> = {
  // === Subtitles (9 unique) ===
  "Sin licencia · 5 personas · Para disfrutar del sol": {
    en: "No licence required · 5 people · For sun lovers",
    fr: "Sans permis · 5 personnes · Pour profiter du soleil",
    de: "Ohne Fuehrerschein · 5 Personen · Zum Sonnenbaden",
    nl: "Geen vaarbewijs · 5 personen · Voor zonliefhebbers",
    it: "Senza patente · 5 persone · Per gli amanti del sole",
    ru: "Bez licenzii · 5 chelovek · Dlya lyubitelej solnca",
    ca: "Sense llicencia · 5 persones · Per gaudir del sol",
  },
  "Sin licencia · 5 personas · El favorito de parejas y familias": {
    en: "No licence required · 5 people · Couples & families favourite",
    fr: "Sans permis · 5 personnes · Le prefere des couples et familles",
    de: "Ohne Fuehrerschein · 5 Personen · Liebling von Paaren und Familien",
    nl: "Geen vaarbewijs · 5 personen · Favoriet van koppels en gezinnen",
    it: "Senza patente · 5 persone · Il preferito di coppie e famiglie",
    ru: "Bez licenzii · 5 chelovek · Ljubimyj u par i semej",
    ca: "Sense llicencia · 5 persones · El favorit de parelles i families",
  },
  "Sin licencia · 5 personas · Disponibilidad extra": {
    en: "No licence required · 5 people · Extra availability",
    fr: "Sans permis · 5 personnes · Disponibilite supplementaire",
    de: "Ohne Fuehrerschein · 5 Personen · Zusaetzliche Verfuegbarkeit",
    nl: "Geen vaarbewijs · 5 personen · Extra beschikbaarheid",
    it: "Senza patente · 5 persone · Disponibilita extra",
    ru: "Bez licenzii · 5 chelovek · Dopolnitel'naya dostupnost'",
    ca: "Sense llicencia · 5 persones · Disponibilitat extra",
  },
  "Sin licencia · 4 personas · El mejor precio por persona": {
    en: "No licence required · 4 people · Best price per person",
    fr: "Sans permis · 4 personnes · Le meilleur prix par personne",
    de: "Ohne Fuehrerschein · 4 Personen · Bester Preis pro Person",
    nl: "Geen vaarbewijs · 4 personen · Beste prijs per persoon",
    it: "Senza patente · 4 persone · Il miglior prezzo a persona",
    ru: "Bez licenzii · 4 cheloveka · Luchshaya cena za cheloveka",
    ca: "Sense llicencia · 4 persones · El millor preu per persona",
  },
  "Sin licencia · 5 personas · Premium con bluetooth": {
    en: "No licence required · 5 people · Premium with bluetooth",
    fr: "Sans permis · 5 personnes · Premium avec bluetooth",
    de: "Ohne Fuehrerschein · 5 Personen · Premium mit Bluetooth",
    nl: "Geen vaarbewijs · 5 personen · Premium met bluetooth",
    it: "Senza patente · 5 persone · Premium con bluetooth",
    ru: "Bez licenzii · 5 chelovek · Premium s bluetooth",
    ca: "Sense llicencia · 5 persones · Premium amb bluetooth",
  },
  "Con licencia · 6 personas · Lloret en 15 min, Tossa en 30": {
    en: "Licence required · 6 people · Lloret in 15 min, Tossa in 30",
    fr: "Avec permis · 6 personnes · Lloret en 15 min, Tossa en 30",
    de: "Mit Fuehrerschein · 6 Personen · Lloret in 15 Min, Tossa in 30",
    nl: "Vaarbewijs vereist · 6 personen · Lloret in 15 min, Tossa in 30",
    it: "Con patente · 6 persone · Lloret in 15 min, Tossa in 30",
    ru: "S licenziej · 6 chelovek · Lloret za 15 min, Tossa za 30",
    ca: "Amb llicencia · 6 persones · Lloret en 15 min, Tossa en 30",
  },
  "Con licencia · 7 personas · Adrenalina para grupos": {
    en: "Licence required · 7 people · Adrenaline for groups",
    fr: "Avec permis · 7 personnes · Adrenaline pour les groupes",
    de: "Mit Fuehrerschein · 7 Personen · Adrenalin fuer Gruppen",
    nl: "Vaarbewijs vereist · 7 personen · Adrenaline voor groepen",
    it: "Con patente · 7 persone · Adrenalina per gruppi",
    ru: "S licenziej · 7 chelovek · Adrenalin dlya grupp",
    ca: "Amb llicencia · 7 persones · Adrenalina per a grups",
  },
  "Con licencia · 7 personas · La experiencia de lujo": {
    en: "Licence required · 7 people · The luxury experience",
    fr: "Avec permis · 7 personnes · L'experience de luxe",
    de: "Mit Fuehrerschein · 7 Personen · Das Luxus-Erlebnis",
    nl: "Vaarbewijs vereist · 7 personen · De luxe ervaring",
    it: "Con patente · 7 persone · L'esperienza di lusso",
    ru: "S licenziej · 7 chelovek · Roskoshnyj opyt",
    ca: "Amb llicencia · 7 persones · L'experiencia de luxe",
  },
  "Con patrón · 7 personas · Experiencia VIP": {
    en: "With skipper · 7 people · VIP experience",
    fr: "Avec skipper · 7 personnes · Experience VIP",
    de: "Mit Skipper · 7 Personen · VIP-Erlebnis",
    nl: "Met schipper · 7 personen · VIP-ervaring",
    it: "Con skipper · 7 persone · Esperienza VIP",
    ru: "S shkhiperom · 7 chelovek · VIP-opyt",
    ca: "Amb patro · 7 persones · Experiencia VIP",
  },

  // === Included items (6 unique) ===
  "IVA": {
    en: "VAT", fr: "TVA", de: "MwSt.", nl: "BTW", it: "IVA", ru: "NDS", ca: "IVA",
  },
  "Carburante": {
    en: "Fuel", fr: "Carburant", de: "Kraftstoff", nl: "Brandstof", it: "Carburante", ru: "Toplivo", ca: "Combustible",
  },
  "Amarre": {
    en: "Mooring", fr: "Amarrage", de: "Liegeplatz", nl: "Aanlegplaats", it: "Ormeggio", ru: "Shvartovka", ca: "Amarratge",
  },
  "Limpieza": {
    en: "Cleaning", fr: "Nettoyage", de: "Reinigung", nl: "Reiniging", it: "Pulizia", ru: "Uborka", ca: "Neteja",
  },
  "Seguro embarcación y ocupantes": {
    en: "Boat & passenger insurance", fr: "Assurance bateau et passagers", de: "Boot- & Insassenversicherung", nl: "Boot- & passagiersverzekering", it: "Assicurazione barca e passeggeri", ru: "Strakhovka lodki i passazhirov", ca: "Asseguranca embarcacio i ocupants",
  },
  "Patron profesional": {
    en: "Professional skipper", fr: "Skipper professionnel", de: "Professioneller Skipper", nl: "Professionele schipper", it: "Skipper professionale", ru: "Professional'nyj shkhiper", ca: "Patro professional",
  },

  // === Features (26 unique) ===
  "Sin licencia requerida": {
    en: "No licence required", fr: "Sans permis requis", de: "Kein Fuehrerschein erforderlich", nl: "Geen vaarbewijs vereist", it: "Nessuna patente richiesta", ru: "Licenziya ne trebuetsya", ca: "Sense llicencia requerida",
  },
  "Hasta 5 personas": {
    en: "Up to 5 people", fr: "Jusqu'a 5 personnes", de: "Bis zu 5 Personen", nl: "Tot 5 personen", it: "Fino a 5 persone", ru: "Do 5 chelovek", ca: "Fins a 5 persones",
  },
  "Gasolina incluida": {
    en: "Fuel included", fr: "Carburant inclus", de: "Kraftstoff inklusive", nl: "Brandstof inbegrepen", it: "Carburante incluso", ru: "Toplivo vklyucheno", ca: "Gasolina inclosa",
  },
  "Seguro incluido": {
    en: "Insurance included", fr: "Assurance incluse", de: "Versicherung inklusive", nl: "Verzekering inbegrepen", it: "Assicurazione inclusa", ru: "Strakhovka vklyuchena", ca: "Asseguranca inclosa",
  },
  "Equipo de seguridad": {
    en: "Safety equipment", fr: "Equipement de securite", de: "Sicherheitsausruestung", nl: "Veiligheidsuitrusting", it: "Equipaggiamento di sicurezza", ru: "Oborudovanie bezopasnosti", ca: "Equip de seguretat",
  },
  "Escalera de baño": {
    en: "Bathing ladder", fr: "Echelle de bain", de: "Badeleiter", nl: "Zwemladder", it: "Scaletta da bagno", ru: "Kupol'naya lestnica", ca: "Escala de bany",
  },
  "Hasta 4 personas": {
    en: "Up to 4 people", fr: "Jusqu'a 4 personnes", de: "Bis zu 4 Personen", nl: "Tot 4 personen", it: "Fino a 4 persone", ru: "Do 4 chelovek", ca: "Fins a 4 persones",
  },
  "Perfecta para parejas": {
    en: "Perfect for couples", fr: "Parfait pour les couples", de: "Perfekt fuer Paare", nl: "Perfect voor koppels", it: "Perfetta per coppie", ru: "Ideal'na dlya par", ca: "Perfecta per a parelles",
  },
  "Equipo de música": {
    en: "Sound system", fr: "Systeme audio", de: "Soundsystem", nl: "Geluidsinstallatie", it: "Impianto audio", ru: "Muzykal'naya sistema", ca: "Equip de musica",
  },
  "Más espaciosa": {
    en: "More spacious", fr: "Plus spacieux", de: "Geraeumiger", nl: "Ruimer", it: "Piu spaziosa", ru: "Bolee prostornaya", ca: "Mes espaiosa",
  },
  "Licencia Básica requerida": {
    en: "Basic licence required", fr: "Permis basique requis", de: "Basis-Fuehrerschein erforderlich", nl: "Basisvaarbewijs vereist", it: "Patente base richiesta", ru: "Trebuetsya bazovaya licenziya", ca: "Llicencia basica requerida",
  },
  "Hasta 6 personas": {
    en: "Up to 6 people", fr: "Jusqu'a 6 personnes", de: "Bis zu 6 Personen", nl: "Tot 6 personen", it: "Fino a 6 persone", ru: "Do 6 chelovek", ca: "Fins a 6 persones",
  },
  "GPS y sonda incluidos": {
    en: "GPS & fish finder included", fr: "GPS et sondeur inclus", de: "GPS & Echolot inklusive", nl: "GPS & dieptemeter inbegrepen", it: "GPS e ecoscandaglio inclusi", ru: "GPS i ehkholot vklyucheny", ca: "GPS i sonda inclosos",
  },
  "Ducha agua dulce": {
    en: "Freshwater shower", fr: "Douche eau douce", de: "Suesswasserdusche", nl: "Zoetwaterdouche", it: "Doccia acqua dolce", ru: "Dush s presnoj vodoj", ca: "Dutxa d'aigua dolca",
  },
  "Deportiva elegante": {
    en: "Sporty & elegant", fr: "Sportif et elegant", de: "Sportlich & elegant", nl: "Sportief & elegant", it: "Sportiva ed elegante", ru: "Sportivnaya i ehlegantnaya", ca: "Esportiva i elegant",
  },
  "Combustible NO incluido": {
    en: "Fuel NOT included", fr: "Carburant NON inclus", de: "Kraftstoff NICHT inklusive", nl: "Brandstof NIET inbegrepen", it: "Carburante NON incluso", ru: "Toplivo NE vklyucheno", ca: "Combustible NO inclos",
  },
  "Hasta 7 personas": {
    en: "Up to 7 people", fr: "Jusqu'a 7 personnes", de: "Bis zu 7 Personen", nl: "Tot 7 personen", it: "Fino a 7 persone", ru: "Do 7 chelovek", ca: "Fins a 7 persones",
  },
  "Ideal para velocidad": {
    en: "Ideal for speed", fr: "Ideal pour la vitesse", de: "Ideal fuer Geschwindigkeit", nl: "Ideaal voor snelheid", it: "Ideale per la velocita", ru: "Ideal'na dlya skorosti", ca: "Ideal per a velocitat",
  },
  "Mesa central": {
    en: "Central table", fr: "Table centrale", de: "Zentraler Tisch", nl: "Centrale tafel", it: "Tavolo centrale", ru: "Central'nyj stol", ca: "Taula central",
  },
  "Embarcación premium": {
    en: "Premium vessel", fr: "Embarcation premium", de: "Premium-Boot", nl: "Premiumvaartuig", it: "Imbarcazione premium", ru: "Premium sudno", ca: "Embarcacio premium",
  },
  "Mesa para comidas": {
    en: "Dining table", fr: "Table a manger", de: "Esstisch", nl: "Eettafel", it: "Tavolo da pranzo", ru: "Obedennyj stol", ca: "Taula per a menjar",
  },
  "Lujo y confort": {
    en: "Luxury & comfort", fr: "Luxe et confort", de: "Luxus & Komfort", nl: "Luxe & comfort", it: "Lusso e comfort", ru: "Roskosh' i komfort", ca: "Luxe i confort",
  },
  "No requiere licencia": {
    en: "No licence required", fr: "Sans permis", de: "Kein Fuehrerschein noetig", nl: "Geen vaarbewijs nodig", it: "Nessuna patente necessaria", ru: "Licenziya ne nuzhna", ca: "No requereix llicencia",
  },
  "Patron profesional incluido": {
    en: "Professional skipper included", fr: "Skipper professionnel inclus", de: "Professioneller Skipper inklusive", nl: "Professionele schipper inbegrepen", it: "Skipper professionale incluso", ru: "Professional'nyj shkhiper vklyuchen", ca: "Patro professional inclos",
  },
  "Calas escondidas y cuevas": {
    en: "Hidden coves & caves", fr: "Criques cachees et grottes", de: "Versteckte Buchten & Hoehlen", nl: "Verborgen baaien & grotten", it: "Calette nascoste e grotte", ru: "Skrytye bukhty i peshchery", ca: "Cales amagades i coves",
  },
  "Parada para nadar": {
    en: "Swimming stop", fr: "Arret baignade", de: "Badestopp", nl: "Zwemstop", it: "Sosta per nuotare", ru: "Ostanovka dlya plavaniya", ca: "Parada per nedar",
  },

  // === Equipment items (25 unique) ===
  "Toldo": {
    en: "Sunshade", fr: "Auvent", de: "Sonnenverdeck", nl: "Zonnetent", it: "Tendalino", ru: "Tent", ca: "Tendal",
  },
  "Arranque eléctrico": {
    en: "Electric start", fr: "Demarrage electrique", de: "Elektrostart", nl: "Elektrische start", it: "Avviamento elettrico", ru: "Ehlektricheskij zapusk", ca: "Arrencada electrica",
  },
  "Gran solárium de proa": {
    en: "Large bow sundeck", fr: "Grand solarium de proue", de: "Grosses Bug-Sonnendeck", nl: "Groot voordek zonnedek", it: "Ampio solarium di prua", ru: "Bol'shoj solyarij na nosu", ca: "Gran solarium de proa",
  },
  "Equipo de seguridad y salvamento": {
    en: "Safety & rescue equipment", fr: "Equipement de securite et sauvetage", de: "Sicherheits- & Rettungsausruestung", nl: "Veiligheids- & reddingsuitrusting", it: "Equipaggiamento di sicurezza e salvataggio", ru: "Oborudovanie bezopasnosti i spaseniya", ca: "Equip de seguretat i salvament",
  },
  "Toldo Bi Mini": {
    en: "Bimini top", fr: "Taud bimini", de: "Bimini-Verdeck", nl: "Bimini-kap", it: "Tendalino bimini", ru: "Tent bimini", ca: "Tendal bimini",
  },
  "Equipo de música bluetooth": {
    en: "Bluetooth sound system", fr: "Systeme audio bluetooth", de: "Bluetooth-Soundsystem", nl: "Bluetooth-geluidsinstallatie", it: "Impianto audio bluetooth", ru: "Bluetooth muzykal'naya sistema", ca: "Equip de musica bluetooth",
  },
  "Radio bluetooth": {
    en: "Bluetooth radio", fr: "Radio bluetooth", de: "Bluetooth-Radio", nl: "Bluetooth-radio", it: "Radio bluetooth", ru: "Bluetooth radio", ca: "Radio bluetooth",
  },
  "Altavoces": {
    en: "Speakers", fr: "Haut-parleurs", de: "Lautsprecher", nl: "Luidsprekers", it: "Altoparlanti", ru: "Dinamiki", ca: "Altaveus",
  },
  "Sonda": {
    en: "Fish finder", fr: "Sondeur", de: "Echolot", nl: "Dieptemeter", it: "Ecoscandaglio", ru: "Ehkholot", ca: "Sonda",
  },
  "GPS": {
    en: "GPS", fr: "GPS", de: "GPS", nl: "GPS", it: "GPS", ru: "GPS", ca: "GPS",
  },
  "Ducha": {
    en: "Shower", fr: "Douche", de: "Dusche", nl: "Douche", it: "Doccia", ru: "Dush", ca: "Dutxa",
  },
  "Toldo bimini": {
    en: "Bimini top", fr: "Taud bimini", de: "Bimini-Verdeck", nl: "Bimini-kap", it: "Tendalino bimini", ru: "Tent bimini", ca: "Tendal bimini",
  },
  "Nevera": {
    en: "Cooler", fr: "Glaciere", de: "Kuehlbox", nl: "Koelbox", it: "Frigo portatile", ru: "Kholodil'nik", ca: "Nevera",
  },
  "Arco de Inox para deportes acuáticos": {
    en: "Stainless steel arch for water sports", fr: "Arceau inox pour sports nautiques", de: "Edelstahlbuegel fuer Wassersport", nl: "RVS beugel voor watersporten", it: "Arco in acciaio inox per sport acquatici", ru: "Arka iz nerzhaveyushchej stali dlya vodnogo sporta", ca: "Arc d'inox per a esports aquatics",
  },
  "Solarium en proa y popa": {
    en: "Sundeck at bow & stern", fr: "Solarium proue et poupe", de: "Sonnendeck Bug & Heck", nl: "Zonnedek voor & achter", it: "Solarium a prua e poppa", ru: "Solyarij na nosu i korme", ca: "Solarium a proa i popa",
  },
  "Toldo bimini inox": {
    en: "Stainless steel bimini top", fr: "Taud bimini inox", de: "Edelstahl-Bimini-Verdeck", nl: "RVS bimini-kap", it: "Tendalino bimini inox", ru: "Tent bimini iz nerzhaveyushchej stali", ca: "Tendal bimini inox",
  },
  "Mesa en popa y/o proa": {
    en: "Table at stern and/or bow", fr: "Table en poupe et/ou proue", de: "Tisch am Heck und/oder Bug", nl: "Tafel op achter- en/of voordek", it: "Tavolo a poppa e/o prua", ru: "Stol na korme i/ili nosu", ca: "Taula a popa i/o proa",
  },
  "Ducha de agua dulce": {
    en: "Freshwater shower", fr: "Douche eau douce", de: "Suesswasserdusche", nl: "Zoetwaterdouche", it: "Doccia acqua dolce", ru: "Dush s presnoj vodoj", ca: "Dutxa d'aigua dolca",
  },
  "Mando electrónico": {
    en: "Electronic throttle", fr: "Commande electronique", de: "Elektronische Steuerung", nl: "Elektronische bediening", it: "Comando elettronico", ru: "Ehlektronnoe upravlenie", ca: "Comandament electronic",
  },
  "Bichero": {
    en: "Boat hook", fr: "Gaffe", de: "Bootshaken", nl: "Bootshaak", it: "Mezzo marinaio", ru: "Bagor", ca: "Bitxero",
  },
  "Cabos": {
    en: "Ropes", fr: "Cordages", de: "Leinen", nl: "Lijnen", it: "Cavi", ru: "Kanaty", ca: "Caps",
  },
  "Defensas": {
    en: "Fenders", fr: "Defenses", de: "Fender", nl: "Stootkussens", it: "Parabordi", ru: "Kendery", ca: "Defenses",
  },
  "Apta para deportes náuticos": {
    en: "Suitable for water sports", fr: "Adaptee aux sports nautiques", de: "Geeignet fuer Wassersport", nl: "Geschikt voor watersporten", it: "Adatta per sport acquatici", ru: "Podkhodit dlya vodnogo sporta", ca: "Apta per a esports nautics",
  },

  // Extras names live in a shared util (client/src/utils/extraNameTranslations.ts)
  // so the booking modal renders them the same way as this tab.

  // === Hardcoded UI strings ===
  "Ver galería de fotos de clientes": {
    en: "View customer photo gallery", fr: "Voir la galerie photos clients", de: "Kundenfotogalerie ansehen", nl: "Bekijk klantenfotogalerij", it: "Vedi galleria foto clienti", ru: "Smotret' galereyu foto klientov", ca: "Veure galeria de fotos de clients",
  },
  "Recomendado": {
    en: "Recommended", fr: "Recommande", de: "Empfohlen", nl: "Aanbevolen", it: "Consigliato", ru: "Rekomendovano", ca: "Recomanat",
  },
  "personas han visto este barco hoy": {
    en: "people viewed this boat today", fr: "personnes ont vu ce bateau aujourd'hui", de: "Personen haben dieses Boot heute angesehen", nl: "personen hebben deze boot vandaag bekeken", it: "persone hanno visto questa barca oggi", ru: "chelovek smotreli ehtu lodku segodnya", ca: "persones han vist aquest vaixell avui",
  },
};

/** Translate a Spanish boat text to the current language. Falls back to Spanish original. */
function translateBoatText(text: string, lang: string): string {
  if (lang === "es") return text;
  return boatTextTranslations[text]?.[lang] ?? text;
}

/**
 * Translate the free-form values that live in boatData.specifications
 * (capacity / fuel / engine). Exact-match translation doesn't work here
 * because numbers vary per boat ("4 Personas", "5 Personas", "Gasolina 30L",
 * "Gasolina 50L", "Parsun 40/15cv"...), so we pattern-replace just the
 * Spanish nouns/units and leave the numeric/brand parts intact.
 */
function translateBoatSpec(value: string, lang: string): string {
  if (lang === "es" || !value) return value;
  let out = value;
  out = out.replace(/(\d+)\s*Personas?/g, (_, n) => {
    const map: Record<string, string> = {
      en: `${n} people`, fr: `${n} personnes`, de: `${n} Personen`,
      nl: `${n} personen`, it: `${n} persone`, ru: `${n} человек`, ca: `${n} persones`,
    };
    return map[lang] ?? `${n} Personas`;
  });
  out = out.replace(/Gasolina\s+(\d+)\s*L/gi, (_, n) => {
    const map: Record<string, string> = {
      en: `Petrol ${n}L`, fr: `Essence ${n}L`, de: `Benzin ${n}L`,
      nl: `Benzine ${n}L`, it: `Benzina ${n}L`, ru: `Бензин ${n}L`, ca: `Gasolina ${n}L`,
    };
    return map[lang] ?? `Gasolina ${n}L`;
  });
  const hpMap: Record<string, string> = { en: "hp", de: "PS", nl: "pk", ru: "л.с." };
  if (hpMap[lang]) out = out.replace(/(\d+)cv/g, `$1${hpMap[lang]}`);
  return out;
}

interface BoatDetailPageProps {
  boatId?: string;
  onBack?: () => void;
}

export default function BoatDetailPage({ boatId = "solar-450", onBack }: BoatDetailPageProps) {
  const [selectedSeason, setSelectedSeason] = useState<"BAJA" | "MEDIA" | "ALTA">("BAJA");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { openBookingModal, isOpen: isBookingModalOpen } = useBookingModal();
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  useScrollDepthTracking('boat_detail');
  const seasonPeriods: Record<string, string> = {
    BAJA: t.boatDetail.periodLow,
    MEDIA: t.boatDetail.periodMid,
    ALTA: t.boatDetail.periodHigh,
  };

  // Reset image index when boat changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [boatId]);

  // Track boat views for session-aware exit intent
  useEffect(() => {
    try {
      const current = parseInt(sessionStorage.getItem("cbrb_boatsViewed") || "0", 10);
      sessionStorage.setItem("cbrb_boatsViewed", String(current + 1));
    } catch { /* sessionStorage unavailable */ }
  }, [boatId]);

  // Show/hide sticky CTA based on scroll position
  const handleStickyCTAScroll = useCallback((scrollY: number) => setShowStickyCTA(scrollY > 300), []);
  useThrottledScroll(handleStickyCTAScroll);
  
  // Fetch boat data from API
  const { data: boats, isLoading, error } = useQuery<Boat[]>({
    queryKey: ['/api/boats']
  });

  const boatData = useMemo(() => boats?.find(boat => boat.id === boatId), [boats, boatId]);

  // View counter - increments on each page load
  const { data: viewsData } = useQuery<{ views: number }>({
    queryKey: [`/api/boats/${boatId}/views`],
    staleTime: 60000,
  });

  // Image gallery handling - uses responsive gallery with fallback chain (must be before early returns)
  const displayImages = useResponsiveGallery(boatData);

  // Google Ads remarketing + Meta Pixel view tracking for product page
  useEffect(() => {
    if (boatData) {
      const pricing = boatData.pricing as Record<string, { prices: Record<string, number> }> | null;
      const price = pricing ? (getMinActivePrice(pricing.BAJA?.prices) ?? 0) : 0;
      const licenseType: 'con_licencia' | 'sin_licencia' = boatData.requiresLicense ? 'con_licencia' : 'sin_licencia';
      trackGoogleAdsRemarketing({
        ecommPageType: 'product',
        productId: boatId,
        productName: boatData.name,
        productPrice: price,
        ...(boatData.specifications?.model && { boatModel: boatData.specifications.model }),
        licenseType,
      });
      trackMetaViewContent(boatId, boatData.name, price);
      // GA4 ecommerce view_item
      trackViewItem({
        id: boatId,
        name: boatData.name,
        specifications: boatData.specifications,
        requiresLicense: boatData.requiresLicense,
      }, price);
    }
  }, [boatData, boatId]);

  // Save last viewed boat for return-visitor banner
  useEffect(() => {
    if (boatData) {
      saveLastViewedBoat(boatId, boatData.name);
    }
  }, [boatData, boatId]);

  // Related boats: same license type OR similar capacity (+-2), excluding current boat
  const relatedBoats = useMemo(() => {
    if (!boats || !boatData) return [];
    const currentCapacity = boatData.capacity;
    const currentRequiresLicense = boatData.requiresLicense;
    return boats
      .filter(b => b.id !== boatId)
      .filter(b => b.requiresLicense === currentRequiresLicense || Math.abs(b.capacity - currentCapacity) <= 2)
      .slice(0, 3);
  }, [boats, boatData, boatId]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="space-y-4 p-4 max-w-7xl mx-auto pt-24">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
          <div className="h-8 bg-muted animate-pulse rounded w-1/2 mt-4" />
          <div className="h-4 bg-muted animate-pulse rounded w-1/3 mt-2" />
        </div>
      </div>
    );
  }

  if (error || !boatData) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-lg mb-4">{t.boatDetail.notFound}</div>
            <a href={localizedPath("home")}>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.boatDetail.backToFleet}
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const handleReservation = (prefill?: BookingPrefillData) => {
    openBookingModal(boatId, prefill);
  };

  const handleWhatsApp = () => {
    const message = `Hola, me interesa el ${boatData.name}. ¿Podrían darme más información?`;
    openWhatsApp(message);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  // SEO data for this boat
  const lowestPrice = boatData.pricing ? (getMinActivePrice(boatData.pricing.BAJA?.prices) ?? 0) : 0;
  const requiresLicense = boatData.subtitle?.toLowerCase().includes("con licencia") ?? boatData.requiresLicense;
  const fuelNotIncluded = boatData.features?.some((f: string) => /combustible\s*no/i.test(f) || /fuel\s*not/i.test(f)) ?? false;
  const fuelIncluded = !requiresLicense && !fuelNotIncluded;
  const capacity = boatData.specifications ? parseInt(boatData.specifications.capacity?.split(' ')[0] || String(boatData.capacity)) : boatData.capacity;
  
  const licenseLabels: Record<string, [string, string]> = {
    es: ["con licencia", "sin licencia"],
    en: ["with license", "without license"],
    ca: ["amb llicència", "sense llicència"],
    fr: ["avec permis", "sans permis"],
    de: ["mit Lizenz", "ohne Lizenz"],
    nl: ["met vaarbewijs", "zonder vaarbewijs"],
    it: ["con patente", "senza patente"],
    ru: ["с лицензией", "без лицензии"],
  };
  const [withLic, withoutLic] = licenseLabels[language] || licenseLabels.es;
  const dynamicSEOData = {
    boatName: boatData.name,
    capacity: capacity.toString(),
    license: requiresLicense ? withLic : withoutLic,
    pricePerHour: lowestPrice.toString()
  };

  const seoPageKey = boatId === "excursion-privada" ? 'excursionDetail' : 'boatDetail';
  const seoConfig = getSEOConfig(seoPageKey, language, dynamicSEOData);
  const hreflangLinks = generateHreflangLinks(seoPageKey, boatId);
  const canonical = generateCanonicalUrl(seoPageKey, language, boatId);
  
  // Enhanced Product JSON-LD schema with breadcrumbs
  const makeAbsoluteUrl = (url: string): string => {
    const resolved = getBoatImage(url);
    if (resolved.startsWith('http')) return resolved;
    if (resolved.startsWith('/')) return `${window.location.origin}${resolved}`;
    return `${window.location.origin}/${resolved}`;
  };

  const absoluteImages = displayImages.map(makeAbsoluteUrl);

  // Adapt boat data for enhanced schema
  const adaptedBoatData = {
    id: boatId,
    name: boatData.name,
    description: t.boatDescriptions?.[boatId] || boatData.description,
    image: absoluteImages[0],
    brand: "Costa Brava Rent a Boat",
    power: parseInt(boatData.specifications?.engine?.match(/\d+/)?.[0] || "15"),
    capacity: capacity,
    pricePerHour: lowestPrice,
    year: new Date().getFullYear() - 2 // Assuming boats are ~2 years old
  };

  const baseProductSchema = generateEnhancedProductSchema(adaptedBoatData, language);

  // Add all gallery images and review data to enhanced schema
  const reviewData = getBoatReviews(boatId);
  const ratingData = getBoatAverageRating(boatId);

  const enhancedProductSchema: Record<string, unknown> = {
    ...baseProductSchema,
    image: absoluteImages,
  };

  // Always ensure aggregateRating is present (Google requires it for rich snippets)
  // Use per-boat data if available, otherwise keep the global 4.8/307 from base schema
  if (ratingData.count > 0) {
    enhancedProductSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: ratingData.average,
      reviewCount: ratingData.count,
      bestRating: 5,
      worstRating: 1,
    };
    enhancedProductSchema.review = reviewData.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      datePublished: `${r.date}-01`,
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: r.text,
    }));
  } else {
    // Fallback review when no per-boat reviews exist (required by Google for review rich snippet)
    enhancedProductSchema.review = {
      "@type": "Review",
      author: { "@type": "Person", name: "Maria G." },
      datePublished: "2025-08-15",
      reviewRating: {
        "@type": "Rating",
        ratingValue: 5,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: "Experiencia increible navegando por la Costa Brava. El barco estaba en perfecto estado y la atencion fue excelente.",
    };
  }

  // Generate breadcrumb schema with localized names
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.fleet, url: "/#fleet" },
    { name: boatData.name, url: `/barco/${boatId}` }
  ]);

  // FAQ (visible + FAQPage JSON-LD) — all answers derived from admin-edited
  // boat fields via shared/boatFaqBuilder. Questions + template phrasing live
  // in t.boatFaq / t.licenseTypes.
  const boatFaqText: BoatFaqText = {
    title: t.boatFaq!.title,
    q1: t.boatFaq!.q1,
    a1Intro: t.boatFaq!.a1Intro,
    a1PackItem: t.boatFaq!.a1PackItem,
    a1Empty: t.boatFaq!.a1Empty,
    q2: t.boatFaq!.q2,
    a2: t.boatFaq!.a2,
    audienceSmall: t.boatFaq!.audienceSmall,
    audienceMedium: t.boatFaq!.audienceMedium,
    audienceLarge: t.boatFaq!.audienceLarge,
    q3: t.boatFaq!.q3,
    a3None: t.boatFaq!.a3None,
    a3Licensed: t.boatFaq!.a3Licensed,
    a3Fallback: t.boatFaq!.a3Fallback,
    q4: t.boatFaq!.q4,
    a4Base: t.boatFaq!.a4Base,
    a4Empty: t.boatFaq!.a4Empty,
    a4FuelIncluded: t.boatFaq!.a4FuelIncluded,
    a4FuelNotIncluded: t.boatFaq!.a4FuelNotIncluded,
    q5: t.boatFaq!.q5,
    a5: t.boatFaq!.a5,
    licenseTypes: t.licenseTypes!,
  };
  const boatFaqItems = buildBoatFaqItems(
    {
      name: boatData.name,
      capacity,
      requiresLicense,
      licenseType: boatData.licenseType,
      pricing: boatData.pricing as { BAJA?: { prices?: Record<string, number | null | undefined> | null } | null } | null,
      included: boatData.included,
    },
    boatFaqText,
  );
  const boatFaqTitle = buildBoatFaqTitle({ name: boatData.name }, boatFaqText);
  const boatFaqSchema = {
    "@type": "FAQPage",
    mainEntity: boatFaqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  // Combine schemas using @graph
  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      enhancedProductSchema,
      breadcrumbSchema,
      boatFaqSchema
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        keywords={seoConfig.keywords}
        canonical={canonical}
        hreflang={hreflangLinks}
        ogImage={getBoatImage(boatData.imageUrl || '')}
        ogType="product"
        jsonLd={combinedJsonLd}
      />
      <Navigation />
      <ReadingProgressBar />

      {/* Spacer for fixed navbar */}
      <div className="pt-20 sm:pt-24" />

      {/* Mini-hero */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img
          src={getBoatImage(displayImages[0])}
          alt={getBoatAltText(boatData.name)}
          className="absolute inset-0 w-full h-full object-cover"
          width={1200}
          height={800}
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />

        {/* Back button overlay */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium bg-foreground/30 hover:bg-foreground/50 rounded-full px-3 py-1.5 transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.boatDetail.backToFleet}
          </button>
        )}

        {/* Hero content — bottom aligned */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-5 sm:pb-7">
          {/* License badge */}
          <div className="mb-2">
            <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
              requiresLicense
                ? "bg-primary/90 text-white"
                : "bg-primary/80 text-white"
            }`}>
              {requiresLicense ? t.boats.withLicense : t.boats.withoutLicense}
            </span>
          </div>
          <h1 className="font-heading font-bold text-white text-2xl sm:text-3xl md:text-4xl leading-tight mb-1">
            {boatData.name} <span className="font-normal text-white/80 text-lg sm:text-xl md:text-2xl">— Blanes, Costa Brava</span>
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <p className="text-white/80 text-sm sm:text-base">{translateBoatText(boatData.subtitle || '', language)}</p>
            {lowestPrice > 0 && (
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5">
                <span className="text-white/80 text-xs">{t.boats.from}</span>
                <span className="text-white font-bold text-lg">{lowestPrice}€</span>
              </div>
            )}
            <Button
              onClick={() => handleReservation()}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-5 h-11 text-xs font-semibold transition-colors"
              data-testid="button-price-pill-reserve"
            >
              {t.hero.bookNow}
            </Button>
          </div>
        </div>
      </div>

      {/* View counter - only shown when views > 3 */}
      {viewsData && viewsData.views > 3 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            {viewsData.views} {translateBoatText("personas han visto este barco hoy", language)}
          </p>
        </div>
      )}

      {/* Live interest indicator - shows when 2+ people viewing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2">
        <LiveInterestIndicator boatId={boatId} />
      </div>

      {/* TrustBadges moved inside description card below */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-6 sm:pb-8">

        {/* Image and Description Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Left Column - Image Gallery Carousel */}
          <div className="bg-background rounded-xl overflow-hidden shadow-lg">
            <div
              className="relative group"
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null || displayImages.length <= 1) return;
                const delta = touchStartX.current - e.changedTouches[0].clientX;
                if (Math.abs(delta) > 50) { if (delta > 0) { nextImage(); } else { prevImage(); } }
                touchStartX.current = null;
              }}
            >
              <img
                src={getBoatImage(displayImages[currentImageIndex])}
                srcSet={getBoatImageSrcSet(displayImages[currentImageIndex]) || undefined}
                sizes="(max-width: 767px) 100vw, 800px"
                alt={getBoatAltText(boatData.name, currentImageIndex)}
                className="w-full aspect-[4/3] object-cover cursor-zoom-in boat-image-reveal"
                width={800}
                height={600}
                loading="lazy"
                decoding="async"
                data-testid="img-boat-main"
                onClick={() => setLightboxOpen(true)}
              />
              {/* Zoom hint */}
              <div className="absolute top-2 left-2 bg-foreground/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <Eye className="w-3 h-3 inline mr-1" />
                {t.boatDetail.imageAria}
              </div>
              
              {/* Navigation arrows - only show if more than one image */}
              {displayImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
                    data-testid="button-prev-image"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
                    data-testid="button-next-image"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}
              
              {/* Image counter */}
              {displayImages.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-foreground/70 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {displayImages.length}
                </div>
              )}
            </div>
            
            {/* Thumbnails: dots on mobile, image strip on desktop */}
            {displayImages.length > 1 && (
              <div className="bg-muted px-4 py-3">
                {/* Mobile: dots */}
                <div className="flex justify-center gap-2 md:hidden">
                  {displayImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-3 rounded-full transition-all ${
                        index === currentImageIndex
                          ? 'bg-primary w-8'
                          : 'w-3 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                      aria-label={`${t.boatDetail.imageAria} ${index + 1}`}
                      data-testid={`button-thumbnail-${index}`}
                    />
                  ))}
                </div>
                {/* Desktop: image thumbnails */}
                <div className="hidden md:flex gap-2 overflow-x-auto">
                  {displayImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-transparent hover:border-muted-foreground/30 opacity-70 hover:opacity-100'
                      }`}
                      aria-label={`${t.boatDetail.imageAria} ${index + 1}`}
                      data-testid={`button-thumbnail-${index}`}
                    >
                      <img
                        src={getBoatImage(image)}
                        alt={getBoatAltText(boatData.name, index)}
                        className="w-full h-full object-cover"
                        width={200}
                        height={150}
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="px-4 py-2 text-center border-t border-border">
              <a href={localizedPath("gallery")} className="text-sm text-primary hover:underline">
                {translateBoatText("Ver galería de fotos de clientes", language)}
              </a>
            </div>
          </div>

          {/* Right Column - Description */}
          <Card>
            <CardHeader>
              <CardTitle>{t.boatDetail.description}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80 leading-relaxed">
                {t.boatDescriptions?.[boatId] || boatData.description}
              </p>
              {fuelIncluded && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                  <p className="text-foreground font-medium flex items-center gap-2">
                    <Fuel className="w-5 h-5" />
                    {t.boatDetail.fuelIncluded}
                  </p>
                </div>
              )}
              {/* Trust badges — authority signals */}
              <div className="mt-4">
                <TrustBadges t={t} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Availability urgency indicator */}
        <div className="mb-4">
          <AvailabilityUrgency boatId={boatId} />
        </div>

        {/* Booking Actions - CTA */}
        <Card className="mb-6 sm:mb-8">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold text-foreground">{t.boatDetail.readyForAdventure}</h3>
              <p className="text-muted-foreground">{t.boatDetail.bookNowCTA.replace('{boatName}', boatData.name)}</p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => handleReservation()}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3 transition-colors"
                  data-testid="button-make-reservation"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {t.hero.bookNow}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center md:justify-center">
              <Euro className="w-5 h-5 mr-2 text-primary" />
              {t.boatDetail.pricesBySeason}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Season Selector */}
            {boatData.pricing && (
              <>
                <div className="flex flex-wrap gap-2 mb-6 justify-center">
                  {(["BAJA", "MEDIA", "ALTA"] as const).filter(s => s in boatData.pricing!).map((season) => {
                    const seasonNames: Record<string, string> = { BAJA: t.boatDetail.seasonLow, MEDIA: t.boatDetail.seasonMid, ALTA: t.boatDetail.seasonHigh };
                    return (
                      <Button
                        key={season}
                        variant={selectedSeason === season ? "default" : "outline"}
                        onClick={() => setSelectedSeason(season as "BAJA" | "MEDIA" | "ALTA")}
                        className="text-sm"
                        data-testid={`button-season-${season.toLowerCase()}`}
                      >
                        {seasonNames[season] || season}
                      </Button>
                    );
                  })}
                </div>

                {/* Selected Season Details */}
                <div className="bg-muted rounded-lg p-4 mb-4 text-center">
                  <h4 className="font-medium mb-2">{{ BAJA: t.boatDetail.seasonLow, MEDIA: t.boatDetail.seasonMid, ALTA: t.boatDetail.seasonHigh }[selectedSeason]}</h4>
                  <p className="text-sm text-muted-foreground mb-4">{seasonPeriods[selectedSeason]}</p>
                  
                  <div className="flex flex-wrap justify-center gap-4">
                    {Object.entries(filterActivePrices(boatData.pricing[selectedSeason].prices)).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([duration, price]) => {
                      const isRecommended = !requiresLicense && duration === "4h";
                      return (
                        <div key={duration} className={`relative text-center p-3 rounded-lg min-w-[120px] transition-all cursor-pointer ${isRecommended ? "bg-background border-2 border-primary shadow-md scale-105 hover:shadow-lg ring-3 ring-cta/35" : "bg-background border hover:bg-primary/5"}`}
                        >
                          {isRecommended && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap tracking-wide shadow-sm">
                              {translateBoatText("Recomendado", language)}
                            </span>
                          )}
                          <div className={`font-bold ${isRecommended ? "text-xl text-primary" : "text-lg text-primary"}`}>{price}€</div>
                          <div className="text-sm text-muted-foreground">{duration}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {boatData.included && boatData.included.length > 0 && (
              <div className="text-sm text-muted-foreground text-left md:text-center">
                <p className="mb-3"><strong>{t.boatDetail.priceIncludes}</strong></p>
                <div className="flex flex-wrap justify-start md:justify-center items-center gap-4">
                  {boatData.included.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="w-3 h-3 text-primary mr-1" />
                      <span className="text-xs">{translateBoatText(item, language)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Availability Calendar */}
        <div className="mb-6 sm:mb-8">
          <AvailabilityCalendar
            boatId={boatId}
            onSlotSelect={(date, time) => handleReservation({ date, time })}
          />
        </div>

        {/* Customer Reviews Carousel */}
        <BoatReviewCarousel boatId={boatId} />

        {/* Tabbed detail sections */}
        <Card className="mb-8">
          <Tabs defaultValue="caracteristicas">
            <div className="border-b border-border px-4 pt-4 overflow-x-auto">
              <TabsList className="h-auto bg-transparent p-0 gap-1 w-max">
                <TabsTrigger
                  value="caracteristicas"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary px-4 pb-3 text-sm font-medium"
                >
                  <Star className="w-4 h-4 mr-1.5" />
                  {t.boatDetail.mainFeatures}
                </TabsTrigger>
                <TabsTrigger
                  value="tecnico"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary px-4 pb-3 text-sm font-medium"
                >
                  <NavigationIcon className="w-4 h-4 mr-1.5" />
                  {t.boatDetail.technicalSpecs}
                </TabsTrigger>
                <TabsTrigger
                  value="equipamiento"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary px-4 pb-3 text-sm font-medium"
                >
                  <Settings className="w-4 h-4 mr-1.5" />
                  {t.boatDetail.equipmentIncluded}
                </TabsTrigger>
                <TabsTrigger
                  value="extras"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary px-4 pb-3 text-sm font-medium"
                >
                  <Zap className="w-4 h-4 mr-1.5" />
                  {t.boatDetail.availableExtras}
                </TabsTrigger>
                <TabsTrigger
                  value="info"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary px-4 pb-3 text-sm font-medium"
                >
                  <Shield className="w-4 h-4 mr-1.5" />
                  {t.boatDetail.importantInfo}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab: Características */}
            <TabsContent value="caracteristicas" className="mt-0 p-4 sm:p-6 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {boatData.features?.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                    <span className="text-sm">{translateBoatText(feature, language)}</span>
                  </div>
                )) || <span className="text-sm text-muted-foreground">{t.boatDetail.noFeatures}</span>}
              </div>
              {!requiresLicense && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-semibold text-sm text-foreground/80 mb-4 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-primary" />
                    {t.boatDetail.licenseFreeAdvantages}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t.boatDetail.totalAccessibility}</p>
                      <div className="space-y-1.5">
                        {[t.boatDetail.noLicenseNeeded, t.boatDetail.quickLearning, t.boatDetail.lowerCost, t.boatDetail.perfectBeginners].map((item, i) => (
                          <div key={i} className="flex items-center">
                            <Star className="w-3 h-3 text-primary mr-2 flex-shrink-0" />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t.boatDetail.guaranteedFun}</p>
                      <div className="space-y-1.5">
                        {[
                          { icon: Waves, label: t.boatDetail.accessCoves },
                          { icon: Sun, label: t.boatDetail.idealFamilies },
                          { icon: NavigationIcon, label: t.boatDetail.safeCoastalNavigation },
                          { icon: Clock, label: t.boatDetail.immediateAvailability },
                        ].map(({ icon: Icon, label }, i) => (
                          <div key={i} className="flex items-center">
                            <Icon className="w-3 h-3 text-primary mr-2 flex-shrink-0" />
                            <span className="text-sm">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Tab: Ficha Técnica */}
            <TabsContent value="tecnico" className="mt-0 p-4 sm:p-6 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: "model", icon: Anchor, label: t.boatDetail.specModel },
                  { key: "length", icon: ArrowUpDown, label: t.boatDetail.specLength },
                  { key: "beam", icon: ArrowLeftRight, label: t.boatDetail.specBeam },
                  { key: "engine", icon: Zap, label: t.boatDetail.specEngine },
                  { key: "fuel", icon: Fuel, label: t.boatDetail.specFuel },
                  { key: "capacity", icon: Users, label: t.boatDetail.specCapacity },
                  { key: "deposit", icon: Shield, label: t.boatDetail.specDeposit },
                ].filter(({ key }) => boatData.specifications?.[key as keyof typeof boatData.specifications]).map(({ key, icon: Icon, label }) => (
                  <div key={key} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center">
                      <Icon className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
                      <span className="font-medium text-foreground/80">{label}</span>
                    </div>
                    <span className="text-foreground font-medium">{translateBoatSpec(boatData.specifications![key as keyof typeof boatData.specifications] ?? '', language)}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Tab: Equipamiento */}
            <TabsContent value="equipamiento" className="mt-0 p-4 sm:p-6 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {boatData.equipment?.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                    <span className="text-sm">{translateBoatText(item, language)}</span>
                  </div>
                )) || <span className="text-sm text-muted-foreground">{t.boatDetail.noEquipment}</span>}
              </div>
            </TabsContent>

            {/* Tab: Extras */}
            <TabsContent value="extras" className="mt-0 p-4 sm:p-6 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:duration-200">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {boatData.extras?.map((extra, index) => {
                  const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
                    Parking: ParkingIcon, CircleParking: ParkingIcon, PaddleSurf: PaddleSurfIcon, Waves: PaddleSurfIcon, Nevera: NeveraIcon, Snowflake: NeveraIcon, Bebidas: BebidasIcon, Beer: BebidasIcon, Snorkel: SnorkelIcon, Eye: SnorkelIcon, Seascooter: SeascooterIcon, Zap: SeascooterIcon
                  };
                  const IconComponent = iconMap[extra.icon] || Star;
                  return (
                    <div key={index} className="text-center p-4 border border-border rounded-xl hover:bg-muted transition-colors">
                      <div className="flex justify-center mb-2">
                        <IconComponent className="w-8 h-8 text-primary" />
                      </div>
                      <div className="font-medium text-sm text-foreground">{translateExtraName(extra.name, language)}</div>
                      <div className="text-primary font-bold text-sm mt-0.5">{extra.price}</div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-4">{t.boatDetail.extrasNote}</p>
            </TabsContent>

            {/* Tab: Información */}
            <TabsContent value="info" className="mt-0 p-4 sm:p-6 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:duration-200">
              <div className="text-sm text-foreground/80 space-y-2 mb-4">
                <p>• <strong>{t.boatDetail.essentialDoc}</strong>{requiresLicense ? t.boatDetail.essentialDocLicense : ""}</p>
                <p>• {requiresLicense ? t.boatDetail.licenseRequired : t.boatDetail.noLicenseRequired}</p>
                <p>• {t.boatDetail.idealForGroups.replace('{capacity}', String(capacity))}</p>
                <p>• {t.boatDetail.perfectExplore}</p>
                <p>• {fuelIncluded ? t.boatDetail.fuelInsuranceIncluded : t.boatDetail.fuelNotIncluded}</p>
                {boatData.specifications?.deposit && <p>• {t.boatDetail.specDeposit} {boatData.specifications.deposit}</p>}
              </div>
              {/* What to bring section */}
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="font-semibold text-sm text-foreground/80 mb-3 flex items-center gap-2">
                  <Sun className="w-4 h-4 text-primary" />
                  {t.boatDetail.whatToBringTitle}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {t.boatDetail.whatToBringItems.map((item, i) => (
                    <div key={i} className="flex items-start">
                      <CheckCircle className="w-3.5 h-3.5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground/80">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-primary font-medium bg-primary/5 rounded-lg p-3 flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {t.boatDetail.whatToBringTip}
                </p>
              </div>

              <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                <p className="text-foreground text-sm">
                  <strong>{t.boatDetail.conditions}</strong>{" "}
                  <button
                    onClick={() => {
                      const targetSection = requiresLicense ? "embarcaciones-con-licencia" : "embarcaciones-sin-licencia";
                      setLocation(localizedPath("termsConditions"));
                      setTimeout(() => {
                        const element = document.getElementById(targetSection);
                        if (element) {
                          window.scrollTo({ top: element.offsetTop - 100, behavior: "smooth" });
                        }
                      }, 100);
                    }}
                    className="underline bg-transparent border-none p-0 text-foreground cursor-pointer hover:text-primary transition-colors"
                    data-testid="link-terms-conditions"
                  >
                    {t.boatDetail.rentalConditions}
                  </button>{" "}
                  {t.boatDetail.beforeBooking}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

      </div>

      {/* Related Boats Section */}
      {relatedBoats.length > 0 && (
        <section className="bg-muted py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-foreground mb-6">
              {t.relatedBoats.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedBoats.map((relBoat) => {
                const relPrice = relBoat.pricing ? (getMinActivePrice(relBoat.pricing.BAJA?.prices) ?? 0) : 0;
                const relCapacity = relBoat.specifications
                  ? parseInt(relBoat.specifications.capacity?.split(' ')[0] || String(relBoat.capacity))
                  : relBoat.capacity;
                return (
                  <a
                    key={relBoat.id}
                    href={localizedPath("boatDetail", relBoat.id)}
                    className="group bg-background rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-border"
                  >
                    <div className="relative overflow-hidden boat-image-reveal" style={{ aspectRatio: '4/3' }}>
                      <img
                        src={relBoat.imageGallery?.find((img: string) => !img.includes('portrait')) || relBoat.imageGallery?.[0] || getBoatImage(relBoat.imageUrl || '')}
                        alt={getBoatAltText(relBoat.name)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        width={400}
                        height={300}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-heading font-semibold text-foreground mb-1">{relBoat.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {relCapacity} pax
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          relBoat.requiresLicense
                            ? 'bg-primary/10 text-primary'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {relBoat.requiresLicense ? t.boats.withLicense : t.boats.withoutLicense}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        {relPrice > 0 && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">{t.relatedBoats.from} </span>
                            <span className="font-bold text-primary">{relPrice}€</span>
                          </div>
                        )}
                        <span className="text-sm font-medium text-primary group-hover:underline">
                          {t.relatedBoats.viewDetails}
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section — items come from shared/boatFaqBuilder, derived from admin data */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h2 className="text-2xl font-heading font-bold text-foreground mb-6">
          {boatFaqTitle}
        </h2>
        <div className="space-y-4 max-w-3xl">
          {boatFaqItems.map((item, idx) => (
            <details key={idx} className="group border border-border rounded-lg">
              <summary className="flex items-center justify-between cursor-pointer p-4 font-medium">
                {item.question}
                <ChevronRight className="w-4 h-4 transition-transform duration-200 group-open:rotate-90" />
              </summary>
              <div className="px-4 pb-4 text-muted-foreground">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>

      <Footer />

      {/* Sticky CTA for mobile — always mounted, visibility via CSS to avoid CLS */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 md:hidden pb-safe transition-all duration-300 ${showStickyCTA && !isBookingModalOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"}`}
        aria-hidden={!showStickyCTA || isBookingModalOpen}
      >
        <div className="flex gap-2 px-3 py-2 bg-background border-t border-border shadow-lg">
          <button
            onClick={() => handleReservation()}
            tabIndex={showStickyCTA && !isBookingModalOpen ? 0 : -1}
            className="flex-1 bg-primary text-white py-3 px-4 font-semibold rounded-lg flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>{t.hero.bookNow} {lowestPrice > 0 ? `· ${t.boats.from} ${lowestPrice}€` : ""}</span>
          </button>
          <a
            href={`https://wa.me/34611500372?text=${encodeURIComponent(`Hola, me interesa el ${boatData.name}. ¿Podrían darme más información?`)}`}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={showStickyCTA && !isBookingModalOpen ? 0 : -1}
            className="flex-1 bg-[#25D366] text-white py-3 px-4 font-semibold rounded-lg flex items-center justify-center gap-2"
          >
            <SiWhatsapp className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Sticky pricing sidebar for desktop — always mounted, visibility via CSS */}
      {lowestPrice > 0 && (
        <div
          className={`hidden lg:block fixed right-6 top-24 w-64 z-30 transition-all duration-300 ${showStickyCTA && !isBookingModalOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"}`}
          aria-hidden={!showStickyCTA || isBookingModalOpen}
        >
          <div className="bg-background rounded-xl shadow-xl border border-border p-4 space-y-3">
            <p className="font-bold text-foreground truncate">{boatData.name}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-muted-foreground">{t.boats.from}</span>
              <span className="text-2xl font-bold text-primary">{lowestPrice}€</span>
            </div>
            {fuelIncluded && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Fuel className="w-3 h-3" />
                {translateBoatText("Gasolina incluida", language)}
              </p>
            )}
            <Button
              onClick={() => handleReservation()}
              tabIndex={showStickyCTA && !isBookingModalOpen ? 0 : -1}
              className="w-full bg-primary text-white py-2 text-sm font-semibold"
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              {t.hero.bookNow}
            </Button>
            <button
              onClick={handleWhatsApp}
              tabIndex={showStickyCTA && !isBookingModalOpen ? 0 : -1}
              className="w-full text-xs text-primary hover:text-primary/80 flex items-center justify-center gap-1.5 py-1 transition-colors"
            >
              <SiWhatsapp className="w-3.5 h-3.5 text-[#25D366]" />
              {t.contact?.whatsapp || "Consultar por WhatsApp"}
            </button>
          </div>
        </div>
      )}

      {/* Lightbox for gallery images */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 gap-0 bg-slate-950/95 border-none [&>button]:hidden">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white hover:bg-white/20 transition-colors"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close lightbox"
            >
              <X className="w-5 h-5" />
            </Button>
            <div className="flex items-center justify-center min-h-[50vh] max-h-[85vh]">
              <img
                src={getBoatImage(displayImages[currentImageIndex])}
                alt={getBoatAltText(boatData.name, currentImageIndex)}
                className="max-w-full max-h-[85vh] object-contain"
              />
            </div>
            {displayImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 transition-colors"
                  onClick={prevImage}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 transition-colors"
                  onClick={nextImage}
                  aria-label="Next image"
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}
            <div className="p-3 text-white/60 text-sm text-center">
              {currentImageIndex + 1} / {displayImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}