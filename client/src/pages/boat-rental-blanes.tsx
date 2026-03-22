import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  Anchor,
  Users,
  Star,
  Navigation as NavigationIcon,
  Sun,
  Waves,
  Car,
  Ship,
  ChevronRight,
  Tag,
  Phone,
  Train,
  Shield,
  CheckCircle,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RelatedLocationsSection from "@/components/RelatedLocationsSection";
import RelatedContent from "@/components/RelatedContent";
import { SEO } from "@/components/SEO";
import { getSEOConfig, generateHreflangLinks, generateCanonicalUrl, generateBreadcrumbSchema } from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useLanguage } from "@/hooks/use-language";
import { BOAT_DATA } from "@shared/boatData";

export default function BoatRentalBlanesPage() {
  const { localizedPath } = useLanguage();
  const seoConfig = getSEOConfig('boatRentalBlanes', 'en');
  const hreflangLinks = [
    { lang: 'en-GB', url: 'https://costabravarentaboat.com/boat-rental-blanes' },
    { lang: 'es-ES', url: 'https://costabravarentaboat.com/alquiler-barcos-blanes' },
    { lang: 'x-default', url: 'https://costabravarentaboat.com/alquiler-barcos-blanes' },
  ];
  const canonical = generateCanonicalUrl('boatRentalBlanes', 'en');

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage();
    openWhatsApp(message);
  };

  // JSON-LD schemas combined in @graph
  const locationSchema = {
    "@type": "TouristDestination",
    "name": "Boat Rental in Blanes, Costa Brava, Spain",
    "description": "Rent boats with or without a license from Blanes Port on the Costa Brava. Choose from 8 boats for 4-12 people. Season runs April to October.",
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 41.6751,
      "longitude": 2.7934
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Puerto de Blanes",
      "addressLocality": "Blanes",
      "addressRegion": "Girona",
      "postalCode": "17300",
      "addressCountry": "ES"
    },
    "touristType": ["Family", "Adventure", "Beach", "Water Sports"],
    "availableLanguage": ["Spanish", "Catalan", "English", "French"],
    "provider": {
      "@type": "LocalBusiness",
      "name": "Costa Brava Rent a Boat Blanes",
      "telephone": "+34611500372",
      "url": "https://costabravarentaboat.com/"
    }
  };

  const faqSchema = {
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Do I need a boating license to rent a boat in Blanes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. Under Spanish maritime law, boats with engines of 15 HP or less do not require any boating license. We have 5 license-free boats for up to 5 people each. You must be at least 18 years old. We provide a 15-minute safety briefing before departure."
        }
      },
      {
        "@type": "Question",
        "name": "How much does it cost to rent a boat in Blanes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "License-free boats start from 70 EUR per hour in low season (April-June, September-October). In high season (August), prices start from 90 EUR per hour. Fuel, insurance, and safety equipment are included for license-free boats. Licensed boats start from 150 EUR for 2 hours, but fuel is not included."
        }
      },
      {
        "@type": "Question",
        "name": "What is the best time to rent a boat in Costa Brava?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The boating season runs from April to October. June and September offer the best balance of good weather, lower prices, and fewer crowds. August has the warmest water and longest days, but prices are at their peak. April and May are ideal for budget-conscious travellers who do not mind slightly cooler water."
        }
      },
      {
        "@type": "Question",
        "name": "Can I rent a boat the same day?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. We accept same-day bookings subject to availability. Contact us via WhatsApp at +34 611 500 372 to check availability for today. During peak season (July-August), we recommend booking at least 2-3 days in advance."
        }
      },
      {
        "@type": "Question",
        "name": "Is it safe to drive a boat without experience?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Our license-free boats have a maximum of 15 HP and are designed for coastal navigation close to shore. Before departure, we provide a 15-minute safety briefing covering boat operation, navigation rules, and the local coastline. Every boat includes life jackets, a safety kit, and emergency equipment. The waters around Blanes are sheltered and generally calm."
        }
      }
    ]
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Boat Rental Blanes", url: "/boat-rental-blanes" }
  ]);

  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [locationSchema, breadcrumbSchema, faqSchema]
  };

  return (
    <div className="min-h-screen">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        ogTitle={seoConfig.ogTitle}
        ogDescription={seoConfig.ogDescription}
        ogImage={seoConfig.image}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={combinedJsonLd}
      />
      <Navigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <MapPin className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                Boat Rental in Blanes — Costa Brava, Spain
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
              Blanes is the perfect departure point for exploring the Costa Brava coastline by boat.
              Located at the southern gateway of the Costa Brava, our port offers sheltered waters,
              easy access to stunning coves, and boats for every level of experience. Whether you hold
              a boating license or have never been on the water before, we have the right boat for you.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <Anchor className="w-4 h-4 mr-2" />
                Port of Blanes
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Users className="w-4 h-4 mr-2" />
                4-12 people
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Clock className="w-4 h-4 mr-2" />
                April - October
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section 1: Why Rent a Boat in Blanes? */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Star className="w-6 h-6 text-cta" />
                Why Rent a Boat in Blanes?
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Blanes sits at the very start of the Costa Brava, where the rugged cliffs and
                hidden coves begin. It is the most convenient base for boat rentals in the region,
                combining excellent infrastructure with direct access to some of the Mediterranean's
                most beautiful coastline.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Strategic Location</h3>
                  <p className="text-muted-foreground mb-4">
                    Blanes is just 70 kilometres north of Barcelona, making it easily reachable
                    in about 90 minutes by car or train. It is the southernmost town on the Costa
                    Brava, which means you get quick access to both the wild rocky coastline heading
                    north and the sandy beaches of the Maresme coast to the south. The town itself
                    has all the amenities you need: restaurants, supermarkets, and free parking right
                    next to the port.
                  </p>

                  <h3 className="font-semibold text-lg mb-3">Sheltered Port</h3>
                  <p className="text-muted-foreground">
                    Blanes Port is naturally protected by the headland of Sa Palomera, the iconic
                    rock formation that marks the beginning of the Costa Brava. This means departures
                    are safe and comfortable even on days with moderate wind. The harbour entrance is
                    wide and easy to navigate, making it ideal for first-time boaters who want a
                    stress-free start to their day on the water.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Pristine Coastline</h3>
                  <p className="text-muted-foreground mb-4">
                    From Blanes, you have direct access to some of the most unspoilt coastline in
                    the western Mediterranean. Within 15 to 45 minutes of sailing, you can reach
                    hidden coves with crystal-clear water, dramatic cliff formations, and underwater
                    caves that are only accessible by boat. The seabed around Blanes is rich with
                    Posidonia meadows, which support a diverse marine ecosystem perfect for snorkelling.
                  </p>

                  <h3 className="font-semibold text-lg mb-3">Perfect for All Levels</h3>
                  <p className="text-muted-foreground">
                    We operate 8 boats ranging from compact 4-person dinghies that require no license
                    to powerful 7-person vessels for experienced sailors. Five of our boats can be
                    driven by anyone aged 18 or over with no boating qualification at all. For those
                    who want to venture further along the coast, we offer licensed boats and even
                    private excursions with a professional skipper.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Our Fleet */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Anchor className="w-6 h-6 text-primary" />
                Our Fleet
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Choose from 8 well-maintained boats based at Blanes Port. Each vessel is inspected
                daily and equipped with all required safety gear. Whether you want a relaxed morning
                anchored in a quiet cove or an all-day coastal adventure, there is a boat to match
                your plans and budget.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(BOAT_DATA).map((boat) => {
                  const isNoLicense = boat.features.some(
                    (f) => f.toLowerCase().includes("sin licencia")
                  );
                  const lowestPrice = Math.min(
                    ...Object.values(boat.pricing.BAJA.prices)
                  );
                  return (
                    <a
                      key={boat.id}
                      href={`/barco/${boat.id}?lang=en`}
                      className="block border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{boat.name}</h3>
                        <Badge
                          variant={isNoLicense ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {isNoLicense ? "No license" : "License required"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {boat.specifications.capacity}
                        </span>
                        <span>{boat.specifications.engine}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-semibold">
                          From {lowestPrice} EUR
                        </span>
                        <span className="text-sm text-primary hover:underline">
                          View details
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: No License? No Problem */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Shield className="w-6 h-6 text-primary" />
                No Boating License? No Problem
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Spanish Regulations</h3>
                  <p className="text-muted-foreground mb-4">
                    Under Spanish maritime law, boats with engines of 15 horsepower or less do not
                    require any boating license or qualification. This regulation allows holidaymakers
                    to enjoy the sea safely without the cost and time of obtaining a nautical certificate.
                    Five of our eight boats fall into this category, each carrying up to 4 or 5 passengers.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    Before you set off, our team provides a comprehensive 15-minute safety briefing
                    covering how to operate the boat, basic navigation rules, the local coastline,
                    and what to do in an emergency. You must be at least 18 years old to captain
                    the boat, but passengers of all ages are welcome.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">What Is Included</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Fuel</span>
                        <span className="text-muted-foreground"> - included for all license-free boats. Licensed boats and private excursions do NOT include fuel.</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Insurance</span>
                        <span className="text-muted-foreground"> - full vessel and passenger insurance on every rental</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Safety equipment</span>
                        <span className="text-muted-foreground"> - life jackets for all passengers, emergency kit, fire extinguisher</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Bimini sun canopy</span>
                        <span className="text-muted-foreground"> - shade cover on all boats for sun protection</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Snorkel equipment</span>
                        <span className="text-muted-foreground"> - available to rent from 7.50 EUR per set</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Top Routes from Blanes */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <NavigationIcon className="w-6 h-6 text-primary" />
                Top Routes from Blanes
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Blanes is perfectly positioned for exploring the Costa Brava by sea. Here are the
                most popular destinations our customers visit, all accessible directly from Blanes Port.
              </p>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="border rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Waves className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Cala Brava</h3>
                      <span className="text-sm text-muted-foreground">15 minutes from port</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    A secluded cove nestled between rocky cliffs, ideal for snorkelling in clear,
                    shallow water. The underwater rock formations create natural pools teeming with
                    fish. Accessible by all our boats, including license-free vessels. Anchor in the
                    cove and spend a peaceful morning exploring the seabed.
                  </p>
                </div>

                <div className="border rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Ship className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Lloret de Mar</h3>
                      <span className="text-sm text-muted-foreground">30 minutes from port</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    The famous coastal village of Lloret de Mar is a popular stop for boat trippers.
                    Approaching from the sea gives you stunning views of the town, its beaches, and
                    the castle perched on the headland. Stop at one of the small coves along the way
                    for a swim before arriving at the main beach.
                  </p>
                </div>

                <div className="border rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Sun className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Tossa de Mar</h3>
                      <span className="text-sm text-muted-foreground">45 minutes (licensed boats only)</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    The crown jewel of the Costa Brava. Tossa de Mar's medieval walled old town
                    (Vila Vella) is a UNESCO-protected site visible from the sea. The journey up the
                    coast passes through spectacular cliff scenery with hidden caves. Due to the
                    distance, this route requires one of our licensed boats with greater range and
                    engine power.
                  </p>
                </div>

                <div className="border rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Waves className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Cala Sant Francesc</h3>
                      <span className="text-sm text-muted-foreground">20 minutes from port</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    One of the most beautiful coves near Blanes, with crystal-clear turquoise water
                    and a fine sandy bottom. Surrounded by pine-covered hills, this cove feels
                    completely secluded even though it is only a short boat ride from port. An
                    excellent choice for families with young children thanks to its calm, shallow
                    waters.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Pricing 2026 */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Tag className="w-6 h-6 text-cta" />
                Pricing 2026
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                All prices are per rental (not per person). Prices vary by season: low season
                runs from April to June and September to October, while high season covers August.
                July falls in between as mid-season.
              </p>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">Boat</th>
                      <th className="text-center p-3 font-semibold">Capacity</th>
                      <th className="text-center p-3 font-semibold">Low Season (2h)</th>
                      <th className="text-center p-3 font-semibold">High Season (2h)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(BOAT_DATA).map((boat) => (
                      <tr key={boat.id} className="border-b hover:bg-muted/30">
                        <td className="p-3">
                          <a href={`/barco/${boat.id}?lang=en`} className="text-primary hover:underline font-medium">
                            {boat.name}
                          </a>
                        </td>
                        <td className="p-3 text-center">{boat.specifications.capacity}</td>
                        <td className="p-3 text-center">
                          {boat.pricing.BAJA.prices["2h"]
                            ? `${boat.pricing.BAJA.prices["2h"]} EUR`
                            : "-"}
                        </td>
                        <td className="p-3 text-center">
                          {boat.pricing.ALTA.prices["2h"]
                            ? `${boat.pricing.ALTA.prices["2h"]} EUR`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Fuel is included for license-free boats only. Licensed boats and private excursions do not include fuel.
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Low season: April - June, September - October. Mid season: July. High season: August.
              </p>
              <a href={localizedPath("pricing")} className="text-primary hover:underline text-sm font-medium flex items-center gap-1">
                <ChevronRight className="w-4 h-4" />
                See full pricing details and all durations
              </a>
            </CardContent>
          </Card>

          {/* Section 6: How to Book */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Phone className="w-6 h-6 text-primary" />
                How to Book
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Booking a boat in Blanes is straightforward. We offer three convenient ways to
                reserve your trip, and we accept same-day bookings when boats are available.
              </p>
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="text-center border rounded-lg p-5">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-6 h-6 text-green-700" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">WhatsApp</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Send us a message on WhatsApp at <strong>+34 611 500 372</strong>. We typically
                    respond within 10 minutes during operating hours. Tell us your preferred date,
                    time, group size, and we will confirm availability instantly.
                  </p>
                </div>
                <div className="text-center border rounded-lg p-5">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Ship className="w-6 h-6 text-blue-700" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Online Booking</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Use our online booking form to select your boat, date, and duration. You will
                    receive instant confirmation. Pay securely online or at the port on the day of
                    your trip.
                  </p>
                </div>
                <div className="text-center border rounded-lg p-5">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-orange-700" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Same-Day Availability</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Decided on a boat trip at the last minute? We accept same-day bookings subject
                    to availability. Contact us via WhatsApp to check which boats are free today.
                    During peak season, advance booking is recommended.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 7: Getting to Blanes */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Car className="w-6 h-6 text-primary" />
                Getting to Blanes
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Blanes is well connected by road and rail. Here is how to reach us from the
                most common starting points.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">By Car</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Car className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <span><strong>From Barcelona Airport (El Prat):</strong> approximately 90 minutes via the C-32 and AP-7 motorways. Take exit 9 (Blanes) and follow signs to the port.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Car className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <span><strong>From Girona Airport:</strong> approximately 50 minutes south on the AP-7. Convenient for travellers arriving from Northern Europe on budget airlines.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Car className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <span><strong>From France (Perpignan):</strong> approximately 2 hours south via the AP-7 motorway. Cross the border at La Jonquera and continue south to Blanes.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Car className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <span><strong>Parking:</strong> free parking is available directly adjacent to Blanes Port.</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">By Train</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Train className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <span><strong>RENFE R1 line:</strong> the Rodalies commuter train runs from Barcelona Sants station to Blanes. The journey takes about 80 minutes. Trains run roughly every 30 minutes during the day.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Train className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <span><strong>Blanes station:</strong> is approximately 15 minutes on foot from the port, or a short taxi ride. The walk follows the seafront promenade through the town centre.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 8: FAQ */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Star className="w-6 h-6 text-cta" />
                Frequently Asked Questions
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Do I need a boating license to rent a boat in Blanes?</h3>
                  <p className="text-muted-foreground">
                    No. Under Spanish maritime law, boats with engines of 15 HP or less do not require
                    any boating license. We have 5 license-free boats for up to 5 people each. You must
                    be at least 18 years old. We provide a 15-minute safety briefing before departure.
                    If you want a more powerful boat to travel further along the coast, we also offer
                    licensed boats (requiring a PER or PNB certificate) and private excursions with a
                    professional skipper who handles all the navigation for you.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">How much does it cost to rent a boat in Blanes?</h3>
                  <p className="text-muted-foreground">
                    License-free boats start from 70 EUR per hour in low season (April-June,
                    September-October). In high season (August), prices start from 90 EUR per hour.
                    Fuel, insurance, and safety equipment are included for license-free boats. Licensed
                    boats start from 150 EUR for 2 hours, but fuel is not included. Longer rental
                    durations (2h, 3h, 4h, 6h, 8h) offer better value per hour. See our
                    <a href={localizedPath("pricing")} className="text-primary hover:underline ml-1">full pricing page</a> for
                    detailed rates.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">What is the best time to rent a boat in Costa Brava?</h3>
                  <p className="text-muted-foreground">
                    The boating season runs from April to October. June and September offer the best
                    balance of good weather, lower prices, and fewer crowds. August has the warmest
                    water and longest days, but prices are at their peak. April and May are ideal for
                    budget-conscious travellers who do not mind slightly cooler water. Sea conditions
                    are generally calmest in July and August.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Can I rent a boat the same day?</h3>
                  <p className="text-muted-foreground">
                    Yes. We accept same-day bookings subject to availability. Contact us via WhatsApp
                    at +34 611 500 372 to check availability for today. During peak season
                    (July-August), we recommend booking at least 2-3 days in advance to secure your
                    preferred boat and time slot.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Is it safe to drive a boat without experience?</h3>
                  <p className="text-muted-foreground">
                    Yes. Our license-free boats have a maximum of 15 HP and are designed for coastal
                    navigation close to shore. Before departure, we provide a 15-minute safety briefing
                    covering boat operation, navigation rules, and the local coastline. Every boat
                    includes life jackets, a safety kit, and emergency equipment. The waters around
                    Blanes are sheltered and generally calm, especially during the summer months. We are
                    also always reachable by phone if you need assistance while on the water.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 9: CTA */}
          <Card className="bg-primary text-white mb-8">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Book Your Boat Today</h2>
              <p className="text-lg mb-6 opacity-90">
                Ready to explore the Costa Brava from the water? Contact us on WhatsApp for
                instant availability, or browse our boats and book online. We are at Blanes Port,
                ready to welcome you aboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handleBookingWhatsApp}
                  data-testid="button-book-boat-rental-blanes"
                >
                  <Anchor className="w-5 h-5 mr-2" />
                  WhatsApp +34 611 500 372
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Section 10: Map */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-2xl font-semibold leading-none tracking-tight">Find Us at Blanes Port</h2>
            </CardHeader>
            <CardContent>
              <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden border">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d2980.1411982500704!2d2.7957177!3d41.6742939!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12bb172c94a8856f%3A0x9a2dfa936ef2e0a7!2sCosta%20Brava%20Rent%20a%20Boat%20-%20Blanes%20%7C%20Alquiler%20de%20Barcos%20Con%20y%20Sin%20Licencia!5e0!3m2!1sen!2ses!4v1758876869141!5m2!1sen!2ses"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location map - Blanes Port, Costa Brava"
                  data-testid="map-boat-rental-blanes"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                <a
                  href="https://maps.app.goo.gl/ma3qtsJbuFNhcr4bA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors cursor-pointer underline"
                  data-testid="link-boat-rental-blanes-maps"
                >
                  Costa Brava Rent a Boat - Blanes, Puerto de Blanes, 17300 Blanes, Girona, Spain
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Section 11: Cross-links */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">Explore more</h3>
              <div className="flex flex-wrap gap-3">
                <a href={localizedPath("locationBlanes")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Esta pagina en espanol (Spanish version)
                </a>
                <a href={localizedPath("categoryLicenseFree")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  License-free boats
                </a>
                <a href={localizedPath("categoryLicensed")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Licensed boats
                </a>
                <a href={localizedPath("pricing")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Prices and seasonal rates
                </a>
                <a href={localizedPath("locationLloret")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Boat trip to Lloret de Mar
                </a>
                <a href={localizedPath("locationTossa")} className="text-primary hover:underline flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Boat trip to Tossa de Mar
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <RelatedLocationsSection currentLocation="blanes" />
      <RelatedContent currentPage="boatRentalBlanes" />
      <Footer />
    </div>
  );
}
