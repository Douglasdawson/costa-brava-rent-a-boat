import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin, Anchor, Users, Ship, ChevronRight, Star,
  Sun, Waves, Navigation as NavigationIcon, Clock,
  Shield, Music, Fuel, CheckCircle2
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import FleetSection from "@/components/FleetSection";
import { SEO } from "@/components/SEO";
import { generateBreadcrumbSchema } from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { Link } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { BOAT_DATA } from "@shared/boatData";

// Static English-only landing page targeting "boat rental costa brava"
export default function BoatRentalCostaBravaPage() {
  const { localizedPath } = useLanguage();
  const handleBookingWhatsApp = () => {
    const message = createBookingMessage();
    openWhatsApp(message);
  };

  // Extract pricing from first sin-licencia boat for the pricing table
  const solarPricing = BOAT_DATA["solar-450"]?.pricing;

  // JSON-LD: TouristDestination
  const touristDestinationSchema = {
    "@type": "TouristDestination",
    "name": "Boat Rental Costa Brava",
    "description": "Rent a boat on the Costa Brava from Blanes port. No license required for boats up to 5 passengers. 9 boats available from 70 EUR per hour. Explore hidden coves, snorkel spots and medieval coastal villages.",
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
    "touristType": ["Family", "Adventure", "Beach", "Snorkeling"],
    "availableLanguage": ["Spanish", "Catalan", "English", "French", "German"],
    "containsPlace": [
      {
        "@type": "TouristAttraction",
        "name": "Cala Brava",
        "description": "Hidden cove 15 minutes by boat from Blanes. Crystal-clear waters, no road access."
      },
      {
        "@type": "TouristAttraction",
        "name": "Cala Sant Francesc",
        "description": "Sheltered bay 20 minutes from Blanes. Sandy beach surrounded by pine-covered cliffs."
      },
      {
        "@type": "TouristAttraction",
        "name": "Tossa de Mar",
        "description": "Medieval walled town 45 minutes by boat. UNESCO-recognized Vila Vella overlooking the sea."
      }
    ],
    "provider": {
      "@type": "LocalBusiness",
      "name": "Costa Brava Rent a Boat Blanes",
      "telephone": "+34611500372",
      "url": "https://www.costabravarentaboat.com/",
      "priceRange": "70-400 EUR",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "300",
        "bestRating": "5"
      }
    }
  };

  // JSON-LD: FAQPage
  const faqItems = [
    {
      question: "Can I rent a boat on the Costa Brava without a license?",
      answer: "Yes. Under Spanish maritime law, boats with engines up to 15 horsepower do not require a boating license. We offer 5 license-free boats for up to 5 passengers each. You must be at least 18 years old. We provide a 15-minute briefing before departure so you can navigate safely even with zero experience."
    },
    {
      question: "Where do the boats depart from?",
      answer: "All our boats depart from the Port of Blanes, located at the southern end of the Costa Brava. Blanes is 70 minutes from Barcelona and 35 minutes from Girona by motorway. There is free parking next to the port. The harbour is sheltered and easy to navigate, making it ideal for first-time boaters."
    },
    {
      question: "How far can I go with a license-free boat?",
      answer: "License-free boats can travel up to 2 nautical miles from the coast. From Blanes, this means you can reach Cala Brava (15 min), Cala Sant Francesc (20 min), Lloret de Mar (30 min), and Fenals Beach (35 min). For longer journeys to Tossa de Mar or beyond, you will need one of our licensed boats."
    },
    {
      question: "What is the best month to visit Costa Brava by boat?",
      answer: "June and September offer the best combination of warm weather, calm seas, and lower prices. Water temperatures reach 22-24 degrees Celsius and the coves are far less crowded than in July and August. July is also excellent, with longer daylight hours. August has the warmest water but higher demand and peak-season pricing."
    },
    {
      question: "Can I go to Tossa de Mar without a boating license?",
      answer: "Tossa de Mar is approximately 45 minutes from Blanes and requires travelling beyond the 2 nautical mile limit for license-free boats. You will need one of our licensed boats (Voraz 450, Voraz 500, or Quicksilver 555) to reach Tossa de Mar. If no one in your group holds a boating license, we can arrange a private skippered excursion."
    }
  ];

  const faqSchema = {
    "@type": "FAQPage",
    "mainEntity": faqItems.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  // JSON-LD: BreadcrumbList
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Boat Rental Costa Brava", url: "/boat-rental-costa-brava" }
  ]);

  // Combined JSON-LD
  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [touristDestinationSchema, faqSchema, breadcrumbSchema]
  };

  // Hreflang: en-GB self, es-ES to Spanish version
  const hreflangLinks = [
    { lang: "en-GB", url: "https://www.costabravarentaboat.com/boat-rental-costa-brava" },
    { lang: "es-ES", url: "https://www.costabravarentaboat.com/alquiler-barcos-costa-brava" },
    { lang: "x-default", url: "https://www.costabravarentaboat.com/boat-rental-costa-brava" }
  ];

  // Destinations organized by distance
  const destinations = [
    {
      category: "Near (no license needed)",
      places: [
        { name: "Cala Brava", time: "15 min", description: "A hidden rocky cove just north of Blanes harbour. No road access means you will often have it to yourself. The water is exceptionally clear, making it one of the best snorkelling spots on this stretch of coast. Anchor in the sheltered inlet and swim straight off the boat." },
        { name: "Cala Sant Francesc", time: "20 min", description: "A crescent of golden sand framed by pine-covered cliffs. This is the signature cove of the southern Costa Brava, regularly featured in travel guides. The bay is well protected from wind and swell, making it ideal for families with children. A small beach bar operates during summer." }
      ]
    },
    {
      category: "Medium distance (no license or licensed)",
      places: [
        { name: "Lloret de Mar", time: "30 min", description: "The coast between Blanes and Lloret is studded with small coves that are invisible from the road. Lloret's main beach offers restaurants, water sports and a lively promenade. On the way, you will pass Sa Caleta and Santa Cristina, two of the most photogenic beaches on the Costa Brava." },
        { name: "Fenals Beach", time: "35 min", description: "Just south of Lloret, Fenals is a quieter alternative with fine sand and calm, shallow water. The seabed here is part of a protected marine area, and the underwater visibility is outstanding. Ideal for a morning of snorkelling followed by lunch at one of the beachfront restaurants." }
      ]
    },
    {
      category: "Far (licensed boats only)",
      places: [
        { name: "Tossa de Mar", time: "45 min", description: "The crown jewel of the Costa Brava. The medieval walled town of Vila Vella rises directly from the sea, and the main beach sits in a wide bay beneath the fortress walls. The boat journey from Blanes follows a spectacular coastline of cliffs, caves and emerald water. This is the most popular full-day destination for our customers." },
        { name: "Sant Feliu de Guixols", time: "1.5 h", description: "A charming fishing town with a Benedictine monastery, a long seafront promenade, and some of the finest seafood restaurants on the coast. The journey from Blanes passes through the most dramatic section of the Costa Brava, with towering cliffs and secluded coves accessible only by boat." }
      ]
    }
  ];

  return (
    <div className="min-h-screen">
      <SEO
        title="Boat Rental Costa Brava | No License from 70 EUR/h - Blanes, Spain"
        description="Rent a boat on the Costa Brava from Blanes port. No license required. 9 boats for 4-12 people. Explore hidden coves, snorkel spots and medieval villages."
        canonical="https://www.costabravarentaboat.com/boat-rental-costa-brava"
        ogTitle="Boat Rental Costa Brava - From Blanes Port"
        ogDescription="Explore Spain's most beautiful coastline by boat. No license needed. From 70 EUR per hour."
        keywords="boat rental costa brava, rent a boat costa brava, boat hire spain no license"
        hreflang={hreflangLinks}
        jsonLd={combinedJsonLd}
      />
      <Navigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-emerald-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <Anchor className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                Boat Rental Costa Brava — Explore Spain's Most Beautiful Coastline
              </h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
              The Costa Brava stretches over 200 kilometres along the Mediterranean, from Blanes to the French border.
              Its name — literally "Wild Coast" — was coined by the journalist Ferran Agulló in 1908 to describe
              the dramatic cliffs, hidden coves and turquoise waters that have drawn travellers here for more than a century.
              Today, the best way to experience this coastline is from the water.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <MapPin className="w-4 h-4 mr-2" />
                Depart from Blanes
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Ship className="w-4 h-4 mr-2" />
                9 Boats Available
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Shield className="w-4 h-4 mr-2" />
                No License Options
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section 1: The Costa Brava by Boat */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Waves className="w-6 h-6 text-primary" />
                The Costa Brava by Boat
              </h2>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                  Much of the Costa Brava's beauty is invisible from the road. The coastline between Blanes and Tossa de Mar
                  is a continuous wall of sea cliffs broken by narrow inlets and pocket beaches that have no footpath access.
                  These hidden coves — known locally as <em>calas</em> — are the reason so many visitors choose to explore the
                  Costa Brava by boat rather than by car.
                </p>
                <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                  The marine environment here is remarkably rich. Posidonia seagrass meadows carpet the sandy seabed, supporting
                  shoals of bream, wrasse, and octopus. In the rocky areas, you will find sea urchins, starfish, and the occasional
                  moray eel peering from a crevice. The water clarity regularly exceeds 15 metres, making the Costa Brava one of the
                  best snorkelling destinations in the western Mediterranean.
                </p>
                <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                  Above the waterline, the landscape is equally striking. Stone pine forests grow right to the edge of the cliffs,
                  filling the air with resin on warm days. Medieval watchtowers dot the headlands — remnants of the coastal defence
                  system built to guard against Barbary pirates. And in the distance, the snow-capped Pyrenees frame the northern
                  horizon on clear mornings.
                </p>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Whether you want to spend an hour anchored in a quiet cove, a half-day exploring the coast to Lloret de Mar, or a
                  full day navigating to the walled town of Tossa de Mar, the Costa Brava delivers an experience that simply cannot be
                  replicated from the shore.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Departure from Blanes */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <MapPin className="w-6 h-6 text-primary" />
                Departure from Blanes
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                    All our boats depart from the <strong>Port of Blanes</strong>, a natural harbour at the southern gateway of the
                    Costa Brava. Blanes has been a working fishing port for over six centuries, and its sheltered basin provides calm
                    conditions for departure and return — even on days when the open sea is choppy.
                  </p>
                  <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                    The port is centrally located on the coast, giving you access to coves in both directions: north towards
                    Lloret de Mar and Tossa de Mar, or south towards the Maresme beaches. Free parking is available within a
                    two-minute walk of the mooring.
                  </p>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Getting here is straightforward. Blanes is <strong>70 minutes from Barcelona</strong> (via AP-7 motorway),
                    <strong> 35 minutes from Girona</strong>, and 25 minutes from Girona-Costa Brava airport. The town itself
                    has restaurants, supermarkets, and a seafront promenade for before or after your trip.
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">How to Find Us</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                        Puerto de Blanes, 17300 Blanes, Girona
                      </li>
                      <li className="flex items-start gap-2">
                        <Clock className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                        Open daily 9:00 - 20:00 (April - October)
                      </li>
                      <li className="flex items-start gap-2">
                        <NavigationIcon className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                        Free parking next to the port
                      </li>
                    </ul>
                  </div>
                  <Link href={localizedPath("locationBlanes")}>
                    <div className="border border-primary/30 rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                      <span className="text-primary font-medium inline-flex items-center">
                        Learn more about Blanes as a departure point <ChevronRight className="w-4 h-4 ml-1" />
                      </span>
                    </div>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Our Fleet */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Ship className="w-6 h-6 text-primary" />
                  Our Fleet
                </h2>
                <p className="text-muted-foreground mt-2">
                  Choose from 9 boats: 5 license-free (up to 5 passengers) and 4 licensed (up to 7 passengers).
                  All depart from Blanes port.
                </p>
              </CardHeader>
            </Card>
          </div>
          <FleetSection />

          {/* Section 4: Destinations You Can Reach */}
          <Card className="mb-8 mt-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <NavigationIcon className="w-6 h-6 text-primary" />
                Destinations You Can Reach
              </h2>
              <p className="text-muted-foreground mt-2">
                From Blanes, the entire southern Costa Brava is within reach. Here are the most popular destinations,
                organized by distance and the type of boat you will need.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {destinations.map((group) => (
                  <div key={group.category}>
                    <h3 className="font-semibold text-lg mb-4 text-foreground">{group.category}</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {group.places.map((place) => (
                        <div key={place.name} className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-foreground">{place.name}</h4>
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {place.time}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm">{place.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 5: No License Required in Spain */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Shield className="w-6 h-6 text-cta" />
                No License Required in Spain
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                    Spanish maritime regulations allow anyone aged 18 or over to operate a boat with an engine of up to
                    15 horsepower without holding a boating license. This is the legal framework that makes our license-free
                    fleet possible. You do not need any prior sailing experience, any special permit, or any certification.
                  </p>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Before your departure, our team provides a <strong>15-minute on-water briefing</strong> covering engine
                    operation, basic navigation rules, safety procedures, and recommended routes based on the day's weather
                    and sea conditions. By the end of the briefing, even first-time boaters feel confident and ready to explore.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">License-free boat rules</h3>
                  <ul className="space-y-3">
                    {[
                      "Maximum engine power: 15 HP (11.03 kW)",
                      "Maximum distance from coast: 2 nautical miles",
                      "Minimum age of the skipper: 18 years",
                      "No license, exam, or certificate required",
                      "Safety equipment provided on board",
                      "15-minute briefing included with every rental"
                    ].map((rule) => (
                      <li key={rule} className="flex items-start gap-2 text-muted-foreground">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 6: Pricing 2026 */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Star className="w-6 h-6 text-cta" />
                Pricing 2026
              </h2>
              <p className="text-muted-foreground mt-2">
                Prices vary by season. Low season (April-June, September-October) offers the best rates.
                Mid season is July. High season is August.
              </p>
            </CardHeader>
            <CardContent>
              {solarPricing && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 font-semibold">Duration</th>
                        <th className="text-center py-3 px-2 font-semibold">
                          <div>Low Season</div>
                          <div className="text-xs font-normal text-muted-foreground">Apr-Jun, Sep-Oct</div>
                        </th>
                        <th className="text-center py-3 px-2 font-semibold">
                          <div>Mid Season</div>
                          <div className="text-xs font-normal text-muted-foreground">July</div>
                        </th>
                        <th className="text-center py-3 px-2 font-semibold">
                          <div>High Season</div>
                          <div className="text-xs font-normal text-muted-foreground">August</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(solarPricing.BAJA.prices).map((duration) => (
                        <tr key={duration} className="border-b border-border/50">
                          <td className="py-3 px-2 font-medium">{duration}</td>
                          <td className="py-3 px-2 text-center">{solarPricing.BAJA.prices[duration]} EUR</td>
                          <td className="py-3 px-2 text-center">{solarPricing.MEDIA.prices[duration]} EUR</td>
                          <td className="py-3 px-2 text-center">{solarPricing.ALTA.prices[duration]} EUR</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-muted-foreground mt-3">
                    * Prices shown for the Solar 450 (license-free, 5 passengers). Other boats have different rates.
                    See individual boat pages for full pricing or visit our{" "}
                    <Link href={localizedPath("pricing")} className="text-primary underline">pricing page</Link>.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 7: What's Included */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                What's Included
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    icon: Fuel,
                    title: "Fuel (license-free boats only)",
                    description: "All license-free boats include a full tank of fuel. Licensed boats require fuel to be paid separately."
                  },
                  {
                    icon: Shield,
                    title: "Full insurance coverage",
                    description: "Comprehensive insurance for the boat and all passengers is included in every rental."
                  },
                  {
                    icon: CheckCircle2,
                    title: "Safety equipment",
                    description: "Life jackets for all passengers, fire extinguisher, first aid kit, and all legally required safety gear."
                  },
                  {
                    icon: Waves,
                    title: "Snorkel gear available",
                    description: "Masks and snorkels available to rent from 7.50 EUR per set. The Costa Brava waters are ideal for snorkelling."
                  },
                  {
                    icon: Music,
                    title: "Bluetooth speaker",
                    description: "Most boats are equipped with a waterproof Bluetooth speaker so you can enjoy your own music on board."
                  },
                  {
                    icon: Users,
                    title: "15-minute briefing",
                    description: "Every rental includes a hands-on briefing covering boat operation, navigation, and the best routes for the day."
                  }
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{item.title}</h3>
                      <p className="text-muted-foreground text-sm mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
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
                {faqItems.map((faq, index) => (
                  <div key={index} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="bg-primary text-white mb-8">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Book Your Boat on the Costa Brava</h2>
              <p className="text-lg mb-6 opacity-90">
                Choose your boat, pick a date, and head out to explore. Fuel, insurance, and a 15-minute briefing
                are included with every license-free rental. No hidden costs. Instant confirmation via WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handleBookingWhatsApp}
                  data-testid="button-book-costa-brava-en"
                >
                  <Anchor className="w-5 h-5 mr-2" />
                  Book via WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Map Section */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <MapPin className="w-6 h-6 text-primary" />
                Find Us
              </h2>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2979.5!2d2.7934!3d41.6751!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12bb1a0e8e0c44e7%3A0x4a0c5f3b3f5c6c5a!2sPuerto%20de%20Blanes!5e0!3m2!1sen!2ses!4v1"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Puerto de Blanes - Costa Brava Rent a Boat"
                />
              </div>
            </CardContent>
          </Card>

          {/* Cross-links */}
          <Card>
            <CardHeader>
              <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                <Sun className="w-6 h-6 text-cta" />
                Related Pages
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href={localizedPath("locationCostaBrava")}>
                  <div className="border border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                    <h3 className="font-semibold mb-1">Alquiler Barcos Costa Brava</h3>
                    <p className="text-muted-foreground text-sm">Esta pagina en espanol</p>
                    <span className="text-primary text-sm font-medium inline-flex items-center mt-2">
                      Ver en espanol <ChevronRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </Link>
                <Link href={localizedPath("locationBlanes")}>
                  <div className="border border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                    <h3 className="font-semibold mb-1">Boat Rental Blanes</h3>
                    <p className="text-muted-foreground text-sm">Detailed guide to Blanes port</p>
                    <span className="text-primary text-sm font-medium inline-flex items-center mt-2">
                      Read more <ChevronRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </Link>
                <Link href={localizedPath("categoryLicenseFree")}>
                  <div className="border border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                    <h3 className="font-semibold mb-1">License-Free Boats</h3>
                    <p className="text-muted-foreground text-sm">Our 5 no-license boats in detail</p>
                    <span className="text-primary text-sm font-medium inline-flex items-center mt-2">
                      View boats <ChevronRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      <Footer />
    </div>
  );
}
