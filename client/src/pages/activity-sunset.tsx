import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sunset,
  Clock,
  Anchor,
  Users,
  Star,
  Heart,
  Camera,
  Wine,
  MapPin,
  ChevronRight,
  HelpCircle,
  MessageCircle,
  Calendar
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RelatedContent from "@/components/RelatedContent";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { getSEOConfig, generateHreflangLinks, generateCanonicalUrl, generateBreadcrumbSchema } from "@/utils/seo-config";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useTranslations } from "@/lib/translations";

// Icons paired by position to t.activitySunset.viewpoints.
const VIEWPOINT_ICONS = [MapPin, Camera, Star];

const faqsFallback: Array<{ question: string; answer: string }> = [];

export default function ActivitySunsetPage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const s = t.activitySunset!;
  const faqs = s.faqItems ?? faqsFallback;
  const sunsetTimes = s.sunsetTimes ?? [];
  const viewpoints = (s.viewpoints ?? []).map((vp, i) => ({
    ...vp,
    icon: VIEWPOINT_ICONS[i] ?? MapPin,
  }));
  const romanticIdeas = s.romanticIdeas ?? [];
  const seoConfig = getSEOConfig('activitySunset', language);
  const hreflangLinks = generateHreflangLinks('activitySunset');
  const canonical = generateCanonicalUrl('activitySunset', language);

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, t.whatsappMessages);
    openWhatsApp(message);
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: s.breadcrumbHome ?? "Inicio", url: "/" },
    { name: s.breadcrumbSunset ?? "Paseo en barco al atardecer", url: "/sunset-boat-trip-blanes" }
  ]);

  const faqSchema = {
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const touristTripSchema = {
    "@type": "TouristTrip",
    "@id": `${canonical}#tour`,
    "name": s.heroTitle,
    "description": s.heroDescription,
    "touristType": ["Romance", "Nature", "Couples"],
    "inLanguage": ["es-ES", "en-GB", "ca-ES", "fr-FR", "de-DE", "nl-NL", "it-IT", "ru-RU"],
    "provider": {
      "@type": "LocalBusiness",
      "@id": "https://www.costabravarentaboat.com/#organization",
      "name": "Costa Brava Rent a Boat",
    },
    "offers": [
      {
        "@type": "Offer",
        "name": "Pack atardecer 2h",
        "price": "115",
        "priceCurrency": "EUR",
        "priceValidUntil": "2026-10-31",
        "availability": "https://schema.org/InStock",
        "url": canonical,
        "description": s.ctaDescription,
      },
    ],
    "maximumAttendeeCapacity": 7,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [breadcrumbSchema, touristTripSchema, faqSchema]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        ogTitle={seoConfig.ogTitle}
        ogDescription={seoConfig.ogDescription}
        keywords={seoConfig.keywords}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={jsonLd}
      />
      <Navigation />

      <main className="pt-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-orange-50 to-rose-50 pt-8 pb-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <Sunset className="w-8 h-8 text-primary mr-4" />
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                  {s.heroTitle}
                </h1>
              </div>
              <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
                {s.heroDescription}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Badge variant="outline" className="text-primary border-primary">
                  <Sunset className="w-4 h-4 mr-2" />
                  {s.badgeGoldenHour}
                </Badge>
                <Badge variant="outline" className="text-primary border-primary">
                  <Clock className="w-4 h-4 mr-2" />
                  {s.badgeDuration}
                </Badge>
                <Badge variant="outline" className="text-primary border-primary">
                  <Heart className="w-4 h-4 mr-2" />
                  {s.badgeCouples}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="py-12 bg-muted">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Why a Sunset Trip */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Star className="w-6 h-6 text-cta" />
                  {s.whyTitle}
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">{s.whyGoldenHourTitle}</h3>
                    <p className="text-muted-foreground mb-4">{s.whyGoldenHourDesc}</p>
                    <h3 className="font-semibold text-lg mb-3">{s.whyPrivateTitle}</h3>
                    <p className="text-muted-foreground">{s.whyPrivateDesc}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3">{s.whyAffordableTitle}</h3>
                    <p className="text-muted-foreground mb-4">{s.whyAffordableDesc}</p>
                    <h3 className="font-semibold text-lg mb-3">{s.whyTemperatureTitle}</h3>
                    <p className="text-muted-foreground">{s.whyTemperatureDesc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Best Viewpoints */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Camera className="w-6 h-6 text-primary" />
                  {s.viewpointsTitle}
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {viewpoints.map((spot) => {
                    const Icon = spot.icon;
                    return (
                      <div key={spot.name} className="text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Icon className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{spot.name}</h3>
                        <p className="text-muted-foreground text-sm mb-2">{spot.distance}</p>
                        <p className="text-muted-foreground">{spot.description}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Sunset Times by Month */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Calendar className="w-6 h-6 text-primary" />
                  {s.sunsetTimesTitle}
                </h2>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 pr-4 font-semibold">{s.sunsetTimesTableMonth}</th>
                        <th className="py-3 pr-4 font-semibold">{s.sunsetTimesTableTime}</th>
                        <th className="py-3 font-semibold">{s.sunsetTimesTableDeparture}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sunsetTimes.map((row) => (
                        <tr key={row.month} className="border-b last:border-0">
                          <td className="py-3 pr-4 font-medium">{row.month}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{row.time}</td>
                          <td className="py-3 text-muted-foreground">{row.suggestion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-muted-foreground mt-4">{s.sunsetTimesNote}</p>
              </CardContent>
            </Card>

            {/* Romantic Ideas */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Wine className="w-6 h-6 text-primary" />
                  {s.romanticIdeasTitle}
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {romanticIdeas.map((idea) => (
                    <div key={idea.title} className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Heart className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{idea.title}</h3>
                        <p className="text-muted-foreground">{idea.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* What to Bring */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <Users className="w-6 h-6 text-primary" />
                  {s.whatToBringTitle}
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">{s.whatToBringEssentials}</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      {(s.whatToBringEssentialItems ?? []).map((item: string, i: number) => (
                        <li key={i} className="flex items-center">
                          <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">{s.whatToBringNice}</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      {(s.whatToBringNiceItems ?? []).map((item: string, i: number) => (
                        <li key={i} className="flex items-center">
                          <ChevronRight className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Internal Links */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4">{s.exploreMore}</h3>
                <div className="flex flex-wrap gap-3">
                  <a href={localizedPath("categoryLicenseFree")} className="text-primary hover:underline flex items-center gap-1">
                    <ChevronRight className="w-4 h-4" />
                    {s.linkNoLicense}
                  </a>
                  <a href={localizedPath("activitySnorkel")} className="text-primary hover:underline flex items-center gap-1">
                    <ChevronRight className="w-4 h-4" />
                    {s.linkSnorkel}
                  </a>
                  <a href={localizedPath("pricing")} className="text-primary hover:underline flex items-center gap-1">
                    <ChevronRight className="w-4 h-4" />
                    {s.linkPrices}
                  </a>
                  <a href={localizedPath("locationBlanes")} className="text-primary hover:underline flex items-center gap-1">
                    <ChevronRight className="w-4 h-4" />
                    {s.linkBlanes}
                  </a>
                  <a href={localizedPath("routes")} className="text-primary hover:underline flex items-center gap-1">
                    <ChevronRight className="w-4 h-4" />
                    {s.linkRoutes}
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card className="mb-8">
              <CardHeader>
                <h2 className="flex items-center gap-3 text-2xl font-semibold leading-none tracking-tight">
                  <HelpCircle className="w-6 h-6 text-primary" />
                  {s.faqTitle}
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {faqs.map((faq, index) => (
                    <div key={index}>
                      <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                      <p className="text-muted-foreground">{faq.answer}</p>
                      {index < faqs.length - 1 && <hr className="mt-6" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CTA Section */}
            <Card className="bg-primary text-white">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">{s.ctaTitle}</h2>
                <p className="text-lg mb-6 opacity-90">{s.ctaDescription}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={handleBookingWhatsApp}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {s.ctaWhatsApp}
                  </Button>
                  <a href={localizedPath("categoryLicenseFree")}>
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full">
                      <Anchor className="w-5 h-5 mr-2" />
                      {s.ctaViewBoats}
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <RelatedContent currentPage="activitySunset" />
      <Footer />
    </div>
  );
}
