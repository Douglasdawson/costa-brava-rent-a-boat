import { useState, useEffect, useRef, lazy, Suspense, Component } from "react";
import { Switch, Route, useSearch, useLocation, useRoute, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { LanguageProvider } from "@/hooks/use-language";
import { BookingModalProvider } from "@/hooks/useBookingModal";
import { useUtmCapture } from "@/hooks/useUtmCapture";

// Import critical components (above the fold)
import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import FeaturesSection from "./components/FeaturesSection";
import FleetSection from "./components/FleetSection";
import ReviewsSection from "./components/ReviewsSection";
import GiftCardBanner from "./components/GiftCardBanner";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";
import FAQPreview from "./components/FAQPreview";
import { SEO } from "./components/SEO";

// Lazy load non-critical components
const BookingFlow = lazy(() => import("./components/BookingFlow"));
const CRMDashboard = lazy(() => import("./components/CRMDashboard"));
const BoatDetailPage = lazy(() => import("./components/BoatDetailPage"));
const CondicionesGenerales = lazy(() => import("./components/CondicionesGenerales"));
const FAQPage = lazy(() => import("@/pages/faq"));
const PrivacyPolicyPage = lazy(() => import("@/pages/privacy-policy"));
const TermsConditionsPage = lazy(() => import("@/pages/terms-conditions"));
const CookiesPolicyPage = lazy(() => import("@/pages/cookies-policy"));
const LocationBlanesPage = lazy(() => import("@/pages/location-blanes"));
const LocationLloretPage = lazy(() => import("@/pages/location-lloret-de-mar"));
const LocationTossaPage = lazy(() => import("@/pages/location-tossa-de-mar"));
const CategoryLicenseFreePage = lazy(() => import("@/pages/category-license-free"));
const CategoryLicensedPage = lazy(() => import("@/pages/category-licensed"));
const TestimoniosPage = lazy(() => import("@/pages/testimonios"));
const BlogPage = lazy(() => import("@/pages/blog"));
const BlogDetailPage = lazy(() => import("@/pages/blog-detail"));
const DestinationDetailPage = lazy(() => import("@/pages/destination-detail"));
const ClientDashboardPage = lazy(() => import("@/pages/ClientDashboardPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const GalleryPage = lazy(() => import("@/pages/gallery"));
const RoutesPage = lazy(() => import("@/pages/routes"));
const GiftCardsPage = lazy(() => import("@/pages/gift-cards"));
const CancelBookingPage = lazy(() => import("@/pages/CancelBookingPage"));
const NotFound = lazy(() => import("@/pages/not-found"));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const AccessibilityDeclarationPage = lazy(() => import("@/pages/accessibility-declaration"));
import { useLanguage } from "@/hooks/use-language";
import WhatsAppFloatingButton from "./components/WhatsAppFloatingButton";
import CookieBanner from "./components/CookieBanner";
import { usePrefetchCriticalRoutes } from "@/hooks/usePrefetch";
import { 
  getSEOConfig, 
  generateHreflangLinks, 
  generateCanonicalUrl,
  generateLocalBusinessSchema,
  generateServiceSchema,
  generateBreadcrumbSchema
} from "@/utils/seo-config";
import { generateItemListSchema } from "@/utils/seo-schemas";
import type { Boat } from "@shared/schema";

// Error Boundary — catches any unhandled render error and prevents a blank white screen
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Algo ha ido mal</h1>
          <p className="text-gray-500">Ha ocurrido un error inesperado. Por favor recarga la página.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Main Home Page Component
function HomePage() {
  const { language } = useLanguage();
  usePrefetchCriticalRoutes();
  const seoConfig = getSEOConfig('home', language);
  const hreflangLinks = generateHreflangLinks('home');
  const canonical = generateCanonicalUrl('home', language);

  // Fetch boats for ItemList schema
  const { data: boats } = useQuery<Boat[]>({
    queryKey: ['/api/boats']
  });

  // Generate combined JSON-LD schemas for homepage
  // Note: AggregateRating omitted until real review data is available
  const localBusinessSchema = generateLocalBusinessSchema(language);
  const serviceSchema = generateServiceSchema(language);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Inicio", url: "/" }
  ]);

  // Generate ItemList schema for fleet section (from API data)
  const activeBoats = (boats || []).filter(boat => boat.isActive);
  const fleetItems = activeBoats.map(boat => ({
    id: boat.id,
    name: boat.name
  }));
  const itemListSchema = generateItemListSchema(fleetItems);

  // Combine multiple schemas using @graph
  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      localBusinessSchema,
      serviceSchema,
      breadcrumbSchema,
      itemListSchema
    ]
  };

  return (
    <div className="min-h-screen">
      <SEO 
        title={seoConfig.title}
        description={seoConfig.description}
        ogTitle={seoConfig.ogTitle}
        ogDescription={seoConfig.ogDescription}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={combinedJsonLd}
      />
      <Navigation />
      <main id="main-content">
        <Hero />
        <FleetSection />
        <ReviewsSection />
        <GiftCardBanner />
        <FeaturesSection />
        <FAQPreview />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}

// Wrapper components for router
function BookingFlowPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const boatId = params.get('boat') || 'astec-480'; // Default boat if none specified
  const date = params.get('date') || '';
  const duration = params.get('duration') || '';
  const time = params.get('time') || '';
  const firstName = params.get('firstName') || '';
  const lastName = params.get('lastName') || '';
  const phonePrefix = params.get('phonePrefix') || '';
  const phoneNumber = params.get('phoneNumber') || '';
  const email = params.get('email') || '';
  
  return (
    <BookingFlow 
      boatId={boatId}
      initialDate={date}
      initialDuration={duration}
      initialTime={time}
      initialCustomerData={{
        firstName,
        lastName,
        phonePrefix,
        phoneNumber,
        email
      }}
    />
  );
}

function CRMDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const setLocationRef = useRef(setLocation);
  useEffect(() => { setLocationRef.current = setLocation; });

  // Check for existing session on mount
  useEffect(() => {
    const token = sessionStorage.getItem("adminToken");
    if (token) {
      setAdminToken(token);
      setIsAuthenticated(true);
    } else {
      // Redirect to unified login page if not authenticated
      setLocation("/login");
    }
  }, [setLocation]);

  // Auto-refresh token if we have a refresh token
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      const refreshToken = sessionStorage.getItem("refreshToken");
      if (!refreshToken) return;

      try {
        const response = await fetch("/api/auth/refresh-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (response.ok) {
          const data = await response.json();
          sessionStorage.setItem("adminToken", data.accessToken);
          sessionStorage.setItem("refreshToken", data.refreshToken);
          setAdminToken(data.accessToken);
        } else {
          // Refresh failed - session expired
          sessionStorage.clear();
          setLocationRef.current("/login");
        }
      } catch {
        // Silent failure on refresh
      }
    }, 50 * 60 * 1000); // Refresh every 50 minutes (token expires in 60)

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]); // setLocation is stable via ref — no interval thrashing

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return <CRMDashboard adminToken={adminToken!} />;
}

// Dynamic boat detail page wrapper
function BoatPage() {
  const [match, params] = useRoute("/barco/:id");
  const boatId = params?.id || "solar-450"; // Fallback to default
  return <BoatDetailPage boatId={boatId} />;
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

// Router Component
function Router() {
  useUtmCapture();
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/onboarding" component={OnboardingPage} />
        <Route path="/crm/:tab?" component={CRMDashboardPage} />
        <Route path="/mi-cuenta" component={ClientDashboardPage} />
        <Route path="/client/dashboard" component={ClientDashboardPage} />
        <Route path="/barco/:id" component={BoatPage} />
        <Route path="/condiciones-generales" component={CondicionesGenerales} />
        <Route path="/faq" component={FAQPage} />
        <Route path="/privacy-policy" component={PrivacyPolicyPage} />
        <Route path="/terms-conditions" component={TermsConditionsPage} />
        <Route path="/cookies-policy" component={CookiesPolicyPage} />
        <Route path="/accesibilidad" component={AccessibilityDeclarationPage} />
        <Route path="/alquiler-barcos-blanes" component={LocationBlanesPage} />
        <Route path="/alquiler-barcos-lloret-de-mar" component={LocationLloretPage} />
        <Route path="/alquiler-barcos-tossa-de-mar" component={LocationTossaPage} />
        <Route path="/destino/blanes">{() => <Redirect to="/alquiler-barcos-blanes" />}</Route>
        <Route path="/destino/lloret-de-mar">{() => <Redirect to="/alquiler-barcos-lloret-de-mar" />}</Route>
        <Route path="/destino/tossa-de-mar">{() => <Redirect to="/alquiler-barcos-tossa-de-mar" />}</Route>
        <Route path="/barcos-sin-licencia" component={CategoryLicenseFreePage} />
        <Route path="/barcos-con-licencia" component={CategoryLicensedPage} />
        <Route path="/categoria/sin-licencia">{() => <Redirect to="/barcos-sin-licencia" />}</Route>
        <Route path="/categoria/con-licencia">{() => <Redirect to="/barcos-con-licencia" />}</Route>
        <Route path="/galeria" component={GalleryPage} />
        <Route path="/rutas" component={RoutesPage} />
        <Route path="/tarjetas-regalo" component={GiftCardsPage} />
        <Route path="/testimonios" component={TestimoniosPage} />
        <Route path="/blog/:slug" component={BlogDetailPage} />
        <Route path="/blog" component={BlogPage} />
        <Route path="/destinos/:slug" component={DestinationDetailPage} />
        <Route path="/cancel/:token" component={CancelBookingPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <BookingModalProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
              <WhatsAppFloatingButton />
              <CookieBanner />
            </TooltipProvider>
          </BookingModalProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
