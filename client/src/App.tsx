import { useState, useEffect, useRef, lazy, Suspense, Component } from "react";
import { Switch, Route, useSearch, useLocation, useRoute, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { LanguageProvider } from "@/hooks/use-language";
import { BookingModalProvider } from "@/hooks/useBookingModal";
import { useUtmCapture } from "@/hooks/useUtmCapture";

// Import critical components (above the fold)
import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import { SocialProofStrip } from "./components/SocialProofStrip";


// Lazy load below-fold homepage sections
const FleetSection = lazy(() => import("@/components/FleetSection"));
const NeverSailedSection = lazy(() => import("@/components/NeverSailedSection"));
const GiftCardBanner = lazy(() => import("@/components/GiftCardBanner"));
const LicenseComparisonSection = lazy(() => import("@/components/LicenseComparisonSection"));
const ReviewsSection = lazy(() => import("@/components/ReviewsSection"));
const FeaturesSection = lazy(() => import("@/components/FeaturesSection"));
const FAQPreview = lazy(() => import("@/components/FAQPreview"));
const ContactSection = lazy(() => import("@/components/ContactSection"));

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
const PricingPage = lazy(() => import("@/pages/pricing"));
const LocationBarcelonaPage = lazy(() => import("@/pages/location-barcelona"));
const LocationCostaBravaPage = lazy(() => import("@/pages/alquiler-barcos-costa-brava"));
const NotFound = lazy(() => import("@/pages/not-found"));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const AccessibilityDeclarationPage = lazy(() => import("@/pages/accessibility-declaration"));

import WhatsAppFloatingButton from "./components/WhatsAppFloatingButton";
import { ScrollToTop } from "./components/ScrollToTop";
import CookieBanner from "./components/CookieBanner";
import { ExitIntentModal } from "./components/ExitIntentModal";
import { SocialProofToast } from "./components/SocialProofToast";
import { SeasonBanner } from "./components/SeasonBanner";
import { RouteProgressBar } from "./components/RouteProgressBar";
import { usePrefetchCriticalRoutes } from "@/hooks/usePrefetch";
import { initWebVitals } from "@/utils/web-vitals";

// HomePageSEO lazy-loaded: seo-config.ts (100KB) deferred from main bundle
const HomePageSEO = lazy(() => import("@/components/HomePageSEO"));

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
          <h1 className="text-2xl font-bold text-foreground">Algo ha ido mal</h1>
          <p className="text-muted-foreground">Ha ocurrido un error inesperado. Por favor recarga la página.</p>
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
  usePrefetchCriticalRoutes();

  return (
    <div className="min-h-screen">
      <Suspense fallback={null}>
        <HomePageSEO />
      </Suspense>
      <Navigation />
      <main id="main-content">
        <Hero />
        <Suspense fallback={<div className="min-h-[400px]" />}>
          <FleetSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px]" />}>
          <NeverSailedSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px]" />}>
          <GiftCardBanner />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px]" />}>
          <LicenseComparisonSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px]" />}>
          <ReviewsSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px]" />}>
          <FeaturesSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px]" />}>
          <FAQPreview />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px]" />}>
          <ContactSection />
        </Suspense>
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

// Granular Suspense fallbacks per route priority group
// Main routes: minimal skeleton with nav spacer + pulse area (fast perceived load)
function MainRouteFallback() {
  return (
    <div className="min-h-screen">
      <div className="h-16" /> {/* nav spacer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-8 w-64 bg-muted animate-pulse rounded mb-6" />
        <div className="h-4 w-full bg-muted animate-pulse rounded mb-3" />
        <div className="h-4 w-3/4 bg-muted animate-pulse rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Secondary routes: text-heavy content skeleton
function SecondaryRouteFallback() {
  return (
    <div className="min-h-screen">
      <div className="h-16" />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-8" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
          <div className="h-4 w-4/6 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}

// Admin/legal routes: minimal placeholder
function MinimalRouteFallback() {
  return <div className="min-h-screen" />;
}

// Router Component — granular Suspense boundaries per route priority group
function Router() {
  useUtmCapture();
  return (
    <Switch>
      {/* Home page has its own internal Suspense boundaries for sections */}
      <Route path="/" component={HomePage} />

      {/* Main routes: fleet, pricing, gallery, boat details — fast skeleton */}
      <Route path="/precios">
        {() => <Suspense fallback={<MainRouteFallback />}><PricingPage /></Suspense>}
      </Route>
      <Route path="/galeria">
        {() => <Suspense fallback={<MainRouteFallback />}><GalleryPage /></Suspense>}
      </Route>
      <Route path="/barco/:id">
        {() => <Suspense fallback={<MainRouteFallback />}><BoatPage /></Suspense>}
      </Route>
      <Route path="/barcos-sin-licencia">
        {() => <Suspense fallback={<MainRouteFallback />}><CategoryLicenseFreePage /></Suspense>}
      </Route>
      <Route path="/barcos-con-licencia">
        {() => <Suspense fallback={<MainRouteFallback />}><CategoryLicensedPage /></Suspense>}
      </Route>
      <Route path="/tarjetas-regalo">
        {() => <Suspense fallback={<MainRouteFallback />}><GiftCardsPage /></Suspense>}
      </Route>
      <Route path="/testimonios">
        {() => <Suspense fallback={<MainRouteFallback />}><TestimoniosPage /></Suspense>}
      </Route>
      <Route path="/barcos">
        {() => {
          window.location.href = "/#fleet";
          return null;
        }}
      </Route>

      {/* Secondary routes: blog, FAQ, routes, destinations, locations — content skeleton */}
      <Route path="/blog/:slug">
        {() => <Suspense fallback={<SecondaryRouteFallback />}><BlogDetailPage /></Suspense>}
      </Route>
      <Route path="/blog">
        {() => <Suspense fallback={<SecondaryRouteFallback />}><BlogPage /></Suspense>}
      </Route>
      <Route path="/faq">
        {() => <Suspense fallback={<SecondaryRouteFallback />}><FAQPage /></Suspense>}
      </Route>
      <Route path="/rutas">
        {() => <Suspense fallback={<SecondaryRouteFallback />}><RoutesPage /></Suspense>}
      </Route>
      <Route path="/destinos/:slug">
        {() => <Suspense fallback={<SecondaryRouteFallback />}><DestinationDetailPage /></Suspense>}
      </Route>
      <Route path="/alquiler-barcos-blanes">
        {() => <Suspense fallback={<SecondaryRouteFallback />}><LocationBlanesPage /></Suspense>}
      </Route>
      <Route path="/alquiler-barcos-lloret-de-mar">
        {() => <Suspense fallback={<SecondaryRouteFallback />}><LocationLloretPage /></Suspense>}
      </Route>
      <Route path="/alquiler-barcos-tossa-de-mar">
        {() => <Suspense fallback={<SecondaryRouteFallback />}><LocationTossaPage /></Suspense>}
      </Route>
      <Route path="/alquiler-barcos-cerca-barcelona">
        {() => <Suspense fallback={<SecondaryRouteFallback />}><LocationBarcelonaPage /></Suspense>}
      </Route>
      <Route path="/alquiler-barcos-costa-brava">
        {() => <Suspense fallback={<SecondaryRouteFallback />}><LocationCostaBravaPage /></Suspense>}
      </Route>

      {/* Redirects — no Suspense needed (instant) */}
      <Route path="/destino/blanes">{() => <Redirect to="/alquiler-barcos-blanes" />}</Route>
      <Route path="/destino/lloret-de-mar">{() => <Redirect to="/alquiler-barcos-lloret-de-mar" />}</Route>
      <Route path="/destino/tossa-de-mar">{() => <Redirect to="/alquiler-barcos-tossa-de-mar" />}</Route>
      <Route path="/categoria/sin-licencia">{() => <Redirect to="/barcos-sin-licencia" />}</Route>
      <Route path="/categoria/con-licencia">{() => <Redirect to="/barcos-con-licencia" />}</Route>

      {/* Admin, auth, and legal routes — minimal fallback */}
      <Route path="/login">
        {() => <Suspense fallback={<MinimalRouteFallback />}><LoginPage /></Suspense>}
      </Route>
      <Route path="/onboarding">
        {() => <Suspense fallback={<MinimalRouteFallback />}><OnboardingPage /></Suspense>}
      </Route>
      <Route path="/crm/:tab?">
        {() => <Suspense fallback={<MinimalRouteFallback />}><CRMDashboardPage /></Suspense>}
      </Route>
      <Route path="/mi-cuenta">
        {() => <Suspense fallback={<MinimalRouteFallback />}><ClientDashboardPage /></Suspense>}
      </Route>
      <Route path="/client/dashboard">
        {() => <Suspense fallback={<MinimalRouteFallback />}><ClientDashboardPage /></Suspense>}
      </Route>
      <Route path="/cancel/:token">
        {() => <Suspense fallback={<MinimalRouteFallback />}><CancelBookingPage /></Suspense>}
      </Route>
      <Route path="/condiciones-generales">
        {() => <Suspense fallback={<MinimalRouteFallback />}><CondicionesGenerales /></Suspense>}
      </Route>
      <Route path="/privacy-policy">
        {() => <Suspense fallback={<MinimalRouteFallback />}><PrivacyPolicyPage /></Suspense>}
      </Route>
      <Route path="/terms-conditions">
        {() => <Suspense fallback={<MinimalRouteFallback />}><TermsConditionsPage /></Suspense>}
      </Route>
      <Route path="/cookies-policy">
        {() => <Suspense fallback={<MinimalRouteFallback />}><CookiesPolicyPage /></Suspense>}
      </Route>
      <Route path="/accesibilidad">
        {() => <Suspense fallback={<MinimalRouteFallback />}><AccessibilityDeclarationPage /></Suspense>}
      </Route>

      {/* 404 fallback */}
      <Route>
        {() => <Suspense fallback={<MinimalRouteFallback />}><NotFound /></Suspense>}
      </Route>
    </Switch>
  );
}

function App() {
  useEffect(() => {
    initWebVitals();

    // Initialize Meta Pixel if configured (pixel ID injected via meta tag)
    // Deferred via requestIdleCallback to avoid blocking LCP
    const metaPixelId = document.querySelector('meta[name="fb-pixel-id"]')?.getAttribute("content");
    if (metaPixelId) {
      const loadPixel = () => {
        import("./utils/meta-pixel").then(({ initMetaPixel }) => initMetaPixel(metaPixelId));
      };

      if ("requestIdleCallback" in window) {
        (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(loadPixel, { timeout: 5000 });
      } else {
        setTimeout(loadPixel, 3000);
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <BookingModalProvider>
            <TooltipProvider>
              <Toaster />
              <RouteProgressBar />
              <SeasonBanner />
              <Router />
              <WhatsAppFloatingButton />
              <ScrollToTop />
              <CookieBanner />
              <ExitIntentModal />
              <SocialProofToast />
            </TooltipProvider>
          </BookingModalProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
