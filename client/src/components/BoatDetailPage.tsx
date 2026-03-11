import React, { useState, useEffect, useRef, useMemo } from "react";
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
  MessageSquare,
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
import { openWhatsApp } from "@/utils/whatsapp";
import { getBoatImage, getBoatImageSrcSet, getBoatAltText } from "@/utils/boatImages";
import { useResponsiveGallery } from "@/hooks/useResponsiveGallery";
import Navigation from "./Navigation";
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
import { Breadcrumbs } from "./Breadcrumbs";
import { useTranslations } from "@/lib/translations";
import AvailabilityCalendar from "./AvailabilityCalendar";
import BoatReviewCarousel from "./BoatReviewCarousel";
import { getBoatReviews, getBoatAverageRating } from "@/data/boatReviews";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { BookingPrefillData } from "@/hooks/bookingModalContext";

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
  const { language } = useLanguage();
  const t = useTranslations();
  const seasonPeriods: Record<string, string> = {
    BAJA: t.boatDetail.periodLow,
    MEDIA: t.boatDetail.periodMid,
    ALTA: t.boatDetail.periodHigh,
  };

  // Reset image index when boat changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [boatId]);

  // Show/hide sticky CTA based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCTA(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Fetch boat data from API
  const { data: boats, isLoading, error } = useQuery<Boat[]>({
    queryKey: ['/api/boats']
  });

  const boatData = useMemo(() => boats?.find(boat => boat.id === boatId), [boats, boatId]);

  // Image gallery handling - uses responsive gallery with fallback chain (must be before early returns)
  const displayImages = useResponsiveGallery(boatData);

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
            <a href="/">
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
  const lowestPrice = boatData.pricing ? Math.min(...Object.values(boatData.pricing.BAJA.prices)) : 0;
  const requiresLicense = boatData.subtitle?.toLowerCase().includes("con licencia") ?? boatData.requiresLicense;
  const capacity = boatData.specifications ? parseInt(boatData.specifications.capacity?.split(' ')[0] || String(boatData.capacity)) : boatData.capacity;
  
  const dynamicSEOData = {
    boatName: boatData.name,
    capacity: capacity.toString(),
    license: requiresLicense ? "con licencia" : "sin licencia",
    pricePerHour: lowestPrice.toString()
  };
  
  const seoConfig = getSEOConfig('boatDetail', language, dynamicSEOData);
  const hreflangLinks = generateHreflangLinks('boatDetail', boatId);
  const canonical = generateCanonicalUrl('boatDetail', language, boatId);
  
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
    description: boatData.description,
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
  }

  // Generate breadcrumb schema with localized names
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.fleet, url: "/#fleet" },
    { name: boatData.name, url: `/barco/${boatId}` }
  ]);

  // Combine schemas using @graph
  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      enhancedProductSchema,
      breadcrumbSchema
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={seoConfig.title}
        description={seoConfig.description}
        canonical={canonical}
        hreflang={hreflangLinks}
        ogImage={getBoatImage(boatData.imageUrl || '')}
        ogType="product"
        jsonLd={combinedJsonLd}
      />
      <Navigation />
      
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
            className="absolute top-4 left-4 flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium bg-black/30 hover:bg-black/50 rounded-full px-3 py-1.5 transition-colors"
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
            {boatData.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <p className="text-white/80 text-sm sm:text-base">{boatData.subtitle}</p>
            {lowestPrice > 0 && (
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5">
                <span className="text-white/80 text-xs">{t.boats.from}</span>
                <span className="text-white font-bold text-lg">{lowestPrice}€</span>
              </div>
            )}
            <Button
              onClick={() => handleReservation()}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-5 h-11 text-xs font-semibold"
              data-testid="button-price-pill-reserve"
            >
              {t.hero.bookNow}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-6 sm:pt-8 pb-6 sm:pb-8">

        {/* Image and Description Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Left Column - Image Gallery Carousel */}
          <div className="bg-white rounded-xl overflow-hidden shadow-lg">
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
                className="w-full aspect-[3/4] sm:h-80 sm:aspect-auto md:h-96 object-cover cursor-zoom-in"
                width={800}
                height={600}
                loading="lazy"
                decoding="async"
                data-testid="img-boat-main"
                onClick={() => setLightboxOpen(true)}
              />
              {/* Zoom hint */}
              <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
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
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    data-testid="button-prev-image"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    data-testid="button-next-image"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}
              
              {/* Image counter */}
              {displayImages.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
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
          </div>

          {/* Right Column - Description */}
          <Card>
            <CardHeader>
              <CardTitle>{t.boatDetail.description}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80 leading-relaxed">
                {boatData.description}
              </p>
              {!requiresLicense && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                  <p className="text-foreground font-medium flex items-center gap-2">
                    <Fuel className="w-5 h-5" />
                    {t.boatDetail.fuelIncluded}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
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
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3"
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
                    const seasonNames: Record<string, string> = { BAJA: 'BAJA', MEDIA: 'MEDIA', ALTA: 'ALTA' };
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
                    {Object.entries(boatData.pricing[selectedSeason].prices).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([duration, price]) => {
                      const isRecommended = !requiresLicense && duration === "4h";
                      return (
                        <div key={duration} className={`relative text-center p-3 rounded-lg min-w-[120px] transition-all cursor-pointer ${isRecommended ? "bg-white border-2 border-primary shadow-md scale-105 hover:shadow-lg" : "bg-white border hover:bg-primary/5"}`}
                          style={isRecommended ? { boxShadow: "0 0 12px 2px rgba(168, 196, 221, 0.35)" } : undefined}
                        >
                          {isRecommended && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap tracking-wide shadow-sm">
                              Recomendado
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
                      <span className="text-xs">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Reviews Carousel */}
        <BoatReviewCarousel boatId={boatId} />

        {/* Availability Calendar */}
        <div className="mb-6 sm:mb-8">
          <AvailabilityCalendar
            boatId={boatId}
            onSlotSelect={(date, time) => handleReservation({ date, time })}
          />
        </div>

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
            <TabsContent value="caracteristicas" className="mt-0 p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {boatData.features?.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
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
            <TabsContent value="tecnico" className="mt-0 p-4 sm:p-6">
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
                    <span className="text-foreground font-medium">{boatData.specifications![key as keyof typeof boatData.specifications]}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Tab: Equipamiento */}
            <TabsContent value="equipamiento" className="mt-0 p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {boatData.equipment?.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                )) || <span className="text-sm text-muted-foreground">{t.boatDetail.noEquipment}</span>}
              </div>
            </TabsContent>

            {/* Tab: Extras */}
            <TabsContent value="extras" className="mt-0 p-4 sm:p-6">
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
                      <div className="font-medium text-sm text-foreground">{extra.name}</div>
                      <div className="text-primary font-bold text-sm mt-0.5">{extra.price}</div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-4">{t.boatDetail.extrasNote}</p>
            </TabsContent>

            {/* Tab: Información */}
            <TabsContent value="info" className="mt-0 p-4 sm:p-6">
              <div className="text-sm text-foreground/80 space-y-2 mb-4">
                <p>• <strong>{t.boatDetail.essentialDoc}</strong>{requiresLicense ? t.boatDetail.essentialDocLicense : ""}</p>
                <p>• {requiresLicense ? t.boatDetail.licenseRequired : t.boatDetail.noLicenseRequired}</p>
                <p>• {t.boatDetail.idealForGroups.replace('{capacity}', String(capacity))}</p>
                <p>• {t.boatDetail.perfectExplore}</p>
                <p>• {requiresLicense ? t.boatDetail.fuelNotIncluded : t.boatDetail.fuelInsuranceIncluded}</p>
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
                      setLocation("/terms-conditions");
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
                const relPrice = relBoat.pricing ? Math.min(...Object.values(relBoat.pricing.BAJA.prices)) : 0;
                const relCapacity = relBoat.specifications
                  ? parseInt(relBoat.specifications.capacity?.split(' ')[0] || String(relBoat.capacity))
                  : relBoat.capacity;
                return (
                  <a
                    key={relBoat.id}
                    href={`/barco/${relBoat.id}`}
                    className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-border"
                  >
                    <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
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

      <Footer />

      {/* Sticky CTA for mobile */}
      {showStickyCTA && !isBookingModalOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden pb-safe">
          <button
            onClick={() => handleReservation()}
            className="w-full bg-primary text-white py-4 px-6 font-semibold shadow-lg flex items-center justify-center gap-3"
          >
            <span>{t.hero.bookNow}</span>
            {lowestPrice > 0 && (
              <span className="bg-white/20 rounded-full px-3 py-0.5 text-sm font-bold">
                {t.boats.from} {lowestPrice}€
              </span>
            )}
          </button>
        </div>
      )}

      {/* Sticky pricing sidebar for desktop */}
      {showStickyCTA && !isBookingModalOpen && lowestPrice > 0 && (
        <div className="hidden lg:block fixed right-6 top-24 w-64 z-30 transition-all duration-300">
          <div className="bg-white rounded-xl shadow-xl border border-border p-4 space-y-3">
            <p className="font-bold text-foreground truncate">{boatData.name}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-muted-foreground">{t.boats.from}</span>
              <span className="text-2xl font-bold text-primary">{lowestPrice}€</span>
            </div>
            <Button
              onClick={() => handleReservation()}
              className="w-full bg-primary text-white py-2 text-sm font-semibold"
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              {t.hero.bookNow}
            </Button>
            <button
              onClick={handleWhatsApp}
              className="w-full text-xs text-primary hover:text-primary/80 flex items-center justify-center gap-1.5 py-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {t.contact?.whatsapp || "Consultar por WhatsApp"}
            </button>
          </div>
        </div>
      )}

      {/* Lightbox for gallery images */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 gap-0 bg-black/95 border-none [&>button]:hidden">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
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
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={prevImage}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
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