import { useState, useEffect, lazy, Suspense } from "react";
import { Switch, Route, useSearch, useLocation, useRoute, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { LanguageProvider } from "@/hooks/use-language";

// Import critical components (above the fold)
import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import FeaturesSection from "./components/FeaturesSection";
import FleetSection from "./components/FleetSection";
import ReviewsSection from "./components/ReviewsSection";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";
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
const NotFound = lazy(() => import("@/pages/not-found"));
import { useLanguage } from "@/hooks/use-language";
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
      <Hero />
      <FleetSection />
      <ReviewsSection />
      <FeaturesSection />
      <ContactSection />
      <Footer />
    </div>
  );
}

// Wrapper components for router
function BookingFlowPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const boatId = params.get('boat') || 'astec-450'; // Default boat if none specified
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

function CondicionesGeneralesPage() {
  return <CondicionesGenerales />;
}

function FAQPageWrapper() {
  return <FAQPage />;
}

function PrivacyPolicyPageWrapper() {
  return <PrivacyPolicyPage />;
}

function TermsConditionsPageWrapper() {
  return <TermsConditionsPage />;
}

function CookiesPolicyPageWrapper() {
  return <CookiesPolicyPage />;
}

function LocationBlanesPageWrapper() {
  return <LocationBlanesPage />;
}

function LocationLloretPageWrapper() {
  return <LocationLloretPage />;
}

function LocationTossaPageWrapper() {
  return <LocationTossaPage />;
}

function CategoryLicenseFreePageWrapper() {
  return <CategoryLicenseFreePage />;
}

function CategoryLicensedPageWrapper() {
  return <CategoryLicensedPage />;
}

function TestimoniosPageWrapper() {
  return <TestimoniosPage />;
}

function BlogPageWrapper() {
  return <BlogPage />;
}

function BlogDetailPageWrapper() {
  return <BlogDetailPage />;
}

function DestinationDetailPageWrapper() {
  return <DestinationDetailPage />;
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
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/crm" component={CRMDashboardPage} />
        <Route path="/mi-cuenta" component={ClientDashboardPage} />
        <Route path="/client/dashboard" component={ClientDashboardPage} />
        <Route path="/barco/:id" component={BoatPage} />
        <Route path="/condiciones-generales" component={CondicionesGeneralesPage} />
        <Route path="/faq" component={FAQPageWrapper} />
        <Route path="/privacy-policy" component={PrivacyPolicyPageWrapper} />
        <Route path="/terms-conditions" component={TermsConditionsPageWrapper} />
        <Route path="/cookies-policy" component={CookiesPolicyPageWrapper} />
        <Route path="/alquiler-barcos-blanes" component={LocationBlanesPageWrapper} />
        <Route path="/alquiler-barcos-lloret-de-mar" component={LocationLloretPageWrapper} />
        <Route path="/alquiler-barcos-tossa-de-mar" component={LocationTossaPageWrapper} />
        <Route path="/destino/blanes">{() => <Redirect to="/alquiler-barcos-blanes" />}</Route>
        <Route path="/destino/lloret-de-mar">{() => <Redirect to="/alquiler-barcos-lloret-de-mar" />}</Route>
        <Route path="/destino/tossa-de-mar">{() => <Redirect to="/alquiler-barcos-tossa-de-mar" />}</Route>
        <Route path="/barcos-sin-licencia" component={CategoryLicenseFreePageWrapper} />
        <Route path="/barcos-con-licencia" component={CategoryLicensedPageWrapper} />
        <Route path="/categoria/sin-licencia">{() => <Redirect to="/barcos-sin-licencia" />}</Route>
        <Route path="/categoria/con-licencia">{() => <Redirect to="/barcos-con-licencia" />}</Route>
        <Route path="/testimonios" component={TestimoniosPageWrapper} />
        <Route path="/blog/:slug" component={BlogDetailPageWrapper} />
        <Route path="/blog" component={BlogPageWrapper} />
        <Route path="/destinos/:slug" component={DestinationDetailPageWrapper} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
