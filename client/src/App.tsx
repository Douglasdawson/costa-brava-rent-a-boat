import { useState, useEffect, useRef, lazy, Suspense, Component } from "react";
import { Switch, Route, useSearch, useLocation, useParams, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider, useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import type { Language } from "@/hooks/use-language";
import { BookingModalProvider } from "@/hooks/useBookingModal";
import { useUtmCapture } from "@/hooks/useUtmCapture";
import { trackJsError } from "@/utils/analytics";
import { useJourneyState } from "@/hooks/useJourneyState";
import { isValidLang, resolveSlug } from "@shared/i18n-routes";
import type { PageKey } from "@shared/i18n-routes";

// Import critical components (above the fold)
import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import Footer from "./components/Footer";

// Lazy load below-fold homepage sections
const FleetSection = lazy(() => import("@/components/FleetSection"));
const NeverSailedSection = lazy(() => import("@/components/NeverSailedSection"));
const RangeFromBlanesSection = lazy(() => import("@/components/RangeFromBlanesSection"));
const GiftCardBanner = lazy(() => import("@/components/GiftCardBanner"));
const LicenseComparisonSection = lazy(() => import("@/components/LicenseComparisonSection"));
const ReviewsSection = lazy(() => import("@/components/ReviewsSection"));
const FeaturesSection = lazy(() => import("@/components/FeaturesSection"));
const HomepageLocationsSection = lazy(() => import("@/components/HomepageLocationsSection"));
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
const LocationMalgratPage = lazy(() => import("@/pages/location-malgrat-de-mar"));
const LocationSantaSusannaPage = lazy(() => import("@/pages/location-santa-susanna"));
const LocationCalellaPage = lazy(() => import("@/pages/location-calella"));
const LocationPinedaDeMarPage = lazy(() => import("@/pages/location-pineda-de-mar"));
const LocationPalafollsPage = lazy(() => import("@/pages/location-palafolls"));
const LocationTorderaPage = lazy(() => import("@/pages/location-tordera"));
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
const ActivitySnorkelPage = lazy(() => import("@/pages/activity-snorkel"));
const ActivityFamiliesPage = lazy(() => import("@/pages/activity-families"));
const ActivitySunsetPage = lazy(() => import("@/pages/activity-sunset"));
const ActivityFishingPage = lazy(() => import("@/pages/activity-fishing"));
const AboutPage = lazy(() => import("@/pages/about"));

const NotFound = lazy(() => import("@/pages/not-found"));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const AccessibilityDeclarationPage = lazy(() => import("@/pages/accessibility-declaration"));

import { ScrollToTop } from "./components/ScrollToTop";
import { RouteProgressBar } from "./components/RouteProgressBar";
import { usePrefetchCriticalRoutes } from "@/hooks/usePrefetch";
const WhatsAppFloatingButton = lazy(() => import("./components/WhatsAppFloatingButton"));
const CookieBanner = lazy(() => import("./components/CookieBanner"));
const ExitIntentModal = lazy(() => import("./components/ExitIntentModal").then(m => ({ default: m.ExitIntentModal })));
const SocialProofToast = lazy(() => import("./components/SocialProofToast").then(m => ({ default: m.SocialProofToast })));
const SeasonBanner = lazy(() => import("./components/SeasonBanner").then(m => ({ default: m.SeasonBanner })));
const ReturnVisitorBanner = lazy(() => import("./components/ReturnVisitorBanner").then(m => ({ default: m.ReturnVisitorBanner })));

const HomePageSEO = lazy(() => import("@/components/HomePageSEO"));

// SPA Virtual Pageview Tracking
function usePageViewTracking() {
  const [location] = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({
        event: 'virtual_page_view',
        page_location: window.location.href,
        page_path: location,
        page_title: document.title,
        user_language: document.documentElement.lang || 'es',
      });
    }

    if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).fbq) {
      ((window as unknown as Record<string, unknown>).fbq as (...args: unknown[]) => void)('track', 'PageView');
    }
  }, [location]);
}

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

function HomePage() {
  const t = useTranslations();
  usePrefetchCriticalRoutes();

  return (
    <div className="min-h-screen">
      <Suspense fallback={null}>
        <HomePageSEO />
      </Suspense>
      <Navigation />
      <main id="main-content">
        <Hero />
        {/* Compact trust strip — social proof visible immediately after hero */}
        <div className="bg-muted/50 border-y border-border py-3 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-foreground/80">
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <svg className="w-3.5 h-3.5 text-amber-400 fill-amber-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              4.8/5
            </span>
            <span className="text-border">|</span>
            <span>{t.hero.clients}</span>
            <span className="text-border">|</span>
            <span className="hidden sm:inline">&ldquo;{t.hero.testimonialQuote}&rdquo;</span>
            <span className="sm:hidden">&ldquo;{t.hero.testimonialQuoteShort}&rdquo;</span>
          </div>
        </div>
        <Suspense fallback={<div className="min-h-[400px] below-fold" />}>
          <RangeFromBlanesSection variant="home" />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] below-fold" />}>
          <NeverSailedSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] below-fold" />}>
          <FleetSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] below-fold" />}>
          <ReviewsSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] below-fold" />}>
          <LicenseComparisonSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] below-fold" />}>
          <FeaturesSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] below-fold" />}>
          <HomepageLocationsSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] below-fold" />}>
          <FAQPreview />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] below-fold" />}>
          <ContactSection />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px] below-fold" />}>
          <GiftCardBanner />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function BookingFlowPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const boatId = params.get('boat') || 'astec-480';
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
  const [, setLocation] = useLocation();
  const { localizedPath } = useLanguage();
  const setLocationRef = useRef(setLocation);
  useEffect(() => { setLocationRef.current = setLocation; });

  useEffect(() => {
    const authenticated = sessionStorage.getItem("adminAuthenticated");
    if (authenticated) {
      setIsAuthenticated(true);
    } else {
      setLocation(localizedPath("login"));
    }
  }, [setLocation, localizedPath]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/auth/refresh-token", {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          sessionStorage.clear();
          setLocationRef.current(localizedPath("login"));
        }
      } catch {
        // Silent failure on refresh
      }
    }, 50 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, localizedPath]);

  if (!isAuthenticated) {
    return null;
  }

  return <CRMDashboard adminToken="cookie" />;
}

function MainRouteFallback() {
  return (
    <div className="min-h-screen">
      <div className="h-16" />
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

function MinimalRouteFallback() {
  return <div className="min-h-screen" />;
}

// Static page component map for PageResolver
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PAGE_COMPONENTS: Record<string, React.LazyExoticComponent<any> | React.ComponentType<any>> = {
  locationBlanes: LocationBlanesPage,
  locationLloret: LocationLloretPage,
  locationTossa: LocationTossaPage,
  locationMalgrat: LocationMalgratPage,
  locationSantaSusanna: LocationSantaSusannaPage,
  locationCalella: LocationCalellaPage,
  locationPinedaDeMar: LocationPinedaDeMarPage,
  locationPalafolls: LocationPalafollsPage,
  locationTordera: LocationTorderaPage,
  locationBarcelona: LocationBarcelonaPage,
  locationCostaBrava: LocationCostaBravaPage,
  categoryLicenseFree: CategoryLicenseFreePage,
  categoryLicensed: CategoryLicensedPage,
  blog: BlogPage,
  faq: FAQPage,
  gallery: GalleryPage,
  routes: RoutesPage,
  destinations: RoutesPage,
  pricing: PricingPage,
  testimonials: TestimoniosPage,
  giftCards: GiftCardsPage,
  about: AboutPage,
  activitySnorkel: ActivitySnorkelPage,
  activityFamilies: ActivityFamiliesPage,
  activitySunset: ActivitySunsetPage,
  activityFishing: ActivityFishingPage,
  privacyPolicy: PrivacyPolicyPage,
  termsConditions: TermsConditionsPage,
  cookiesPolicy: CookiesPolicyPage,
  condicionesGenerales: CondicionesGenerales,
  accessibility: AccessibilityDeclarationPage,
  login: LoginPage,
  onboarding: OnboardingPage,
  myAccount: ClientDashboardPage,
  clientDashboard: ClientDashboardPage,
  booking: BookingFlowPage,
};

// Fallback group for Suspense based on page key
const MAIN_ROUTE_KEYS = new Set<string>([
  "pricing", "gallery", "categoryLicenseFree", "categoryLicensed",
  "giftCards", "testimonials", "booking",
]);

const MINIMAL_ROUTE_KEYS = new Set<string>([
  "login", "onboarding", "myAccount", "clientDashboard",
  "privacyPolicy", "termsConditions", "cookiesPolicy",
  "condicionesGenerales", "accessibility", "crm",
]);

function getFallback(pageKey: string) {
  if (MAIN_ROUTE_KEYS.has(pageKey)) return <MainRouteFallback />;
  if (MINIMAL_ROUTE_KEYS.has(pageKey)) return <MinimalRouteFallback />;
  return <SecondaryRouteFallback />;
}

// Resolves a static page slug to its component
function PageResolver() {
  const { localizedPath } = useLanguage();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  if (!slug) {
    return <Suspense fallback={<MinimalRouteFallback />}><NotFound /></Suspense>;
  }

  // Handle fleet-related slugs -> redirect to homepage #fleet anchor
  const fleetSlugs = ["barcos", "flota", "fleet", "flotte", "floot", "boten"];
  if (fleetSlugs.includes(slug)) {
    const homePath = localizedPath("home");
    window.location.href = homePath + "#fleet";
    return null;
  }

  // Handle booking-related slugs -> redirect to localized booking path
  const bookingSlugs = ["reservar", "reserva", "buchen", "boeken", "prenotare", "rezervirovat"];
  if (bookingSlugs.includes(slug)) {
    return <Redirect to={localizedPath("booking")} />;
  }

  const resolved = resolveSlug(slug);

  if (!resolved) {
    return <Suspense fallback={<MinimalRouteFallback />}><NotFound /></Suspense>;
  }

  // Dynamic routes should not be handled here -- they have explicit Route entries
  // But if someone navigates to e.g. /es/blog without a slug, it resolves to blogDetail or blog
  // For ambiguous slugs (blog, destinos), prefer the index page over the detail page
  const pageKey = resolved.pageKey as string;

  // CRM gets special treatment since it has a sub-path for tabs
  if (pageKey === "crm") {
    return <Suspense fallback={<MinimalRouteFallback />}><CRMDashboardPage /></Suspense>;
  }

  const PageComponent = PAGE_COMPONENTS[pageKey];

  if (!PageComponent) {
    return <Suspense fallback={<MinimalRouteFallback />}><NotFound /></Suspense>;
  }

  return <Suspense fallback={getFallback(pageKey)}><PageComponent /></Suspense>;
}

// Map from index page keys to their dynamic counterparts.
// resolveSlug may return the index page key when the slug is ambiguous (e.g. "blog").
const DYNAMIC_KEY_MAP: Record<string, PageKey> = {
  blog: "blogDetail",
  blogDetail: "blogDetail",
  destinations: "destinationDetail",
  destinationDetail: "destinationDetail",
  boatDetail: "boatDetail",
  cancel: "cancel",
};

function DynamicPageResolver() {
  const params = useParams<{ slug: string; param: string }>();
  const slug = params.slug;
  const dynamicParam = params.param;

  if (!slug || !dynamicParam) {
    return <Suspense fallback={<MinimalRouteFallback />}><NotFound /></Suspense>;
  }

  const resolved = resolveSlug(slug);

  if (!resolved) {
    return <Suspense fallback={<MinimalRouteFallback />}><NotFound /></Suspense>;
  }

  const dynamicKey = DYNAMIC_KEY_MAP[resolved.pageKey];

  if (!dynamicKey) {
    return <Suspense fallback={<MinimalRouteFallback />}><NotFound /></Suspense>;
  }

  if (dynamicKey === "boatDetail") {
    return <Suspense fallback={<MainRouteFallback />}><BoatDetailPage boatId={dynamicParam} /></Suspense>;
  }

  if (dynamicKey === "blogDetail") {
    return <Suspense fallback={<SecondaryRouteFallback />}><BlogDetailPage slug={dynamicParam} /></Suspense>;
  }

  if (dynamicKey === "destinationDetail") {
    return <Suspense fallback={<SecondaryRouteFallback />}><DestinationDetailPage slug={dynamicParam} /></Suspense>;
  }

  if (dynamicKey === "cancel") {
    return <Suspense fallback={<MinimalRouteFallback />}><CancelBookingPage token={dynamicParam} /></Suspense>;
  }

  return <Suspense fallback={<MinimalRouteFallback />}><NotFound /></Suspense>;
}

// Detects the user language from localStorage or browser for the root redirect
function detectLanguageForRedirect(): Language {
  const saved = localStorage.getItem('costa-brava-language');
  if (saved && isValidLang(saved)) return saved as Language;

  const browserLang = navigator.language || navigator.languages?.[0] || 'es';
  const langCode = browserLang.toLowerCase().split('-')[0];
  if (isValidLang(langCode)) return langCode as Language;
  return 'es';
}

function RootRedirect() {
  const lang = detectLanguageForRedirect();
  return <Redirect to={`/${lang}/`} />;
}

// Validates the :lang param and renders home or 404
function LangHome() {
  const params = useParams<{ lang: string }>();
  if (!params.lang || !isValidLang(params.lang)) {
    return <Suspense fallback={<MinimalRouteFallback />}><NotFound /></Suspense>;
  }
  return <HomePage />;
}

// CRM route handler with optional tab
function CRMRoute() {
  return <Suspense fallback={<MinimalRouteFallback />}><CRMDashboardPage /></Suspense>;
}

// Legacy redirect helpers for unprefixed paths in Markdown content & old links
function LegacyBoatRedirect() {
  const params = useParams<{ id: string }>();
  const { localizedPath } = useLanguage();
  return <Redirect to={localizedPath("boatDetail", params.id)} />;
}

function LegacyBlogRedirect() {
  const params = useParams<{ slug: string }>();
  const { localizedPath } = useLanguage();
  return <Redirect to={localizedPath("blogDetail", params.slug)} />;
}

function LegacyFleetRedirect() {
  const { localizedPath } = useLanguage();
  return <Redirect to={localizedPath("home") + "#fleet"} />;
}

function Router() {
  useUtmCapture();
  usePageViewTracking();
  return (
    <Switch>
      {/* Root: redirect to /:lang/ */}
      <Route path="/" component={RootRedirect} />

      {/* CRM routes — must come before /:lang to avoid being caught as a language slug */}
      <Route path="/crm/:tab?" component={CRMRoute} />
      <Route path="/:lang/crm/:tab?" component={CRMRoute} />

      {/* Legacy unprefixed routes — redirect to localized equivalents */}
      <Route path="/barco/:id" component={LegacyBoatRedirect} />
      <Route path="/blog/:slug" component={LegacyBlogRedirect} />
      <Route path="/barcos" component={LegacyFleetRedirect} />

      {/* /:lang/ home page */}
      <Route path="/:lang" component={LangHome} />

      {/* Dynamic routes: /:lang/:slug/:param */}
      <Route path="/:lang/:slug/:param" component={DynamicPageResolver} />

      {/* Static routes: /:lang/:slug */}
      <Route path="/:lang/:slug" component={PageResolver} />

      {/* 404 fallback */}
      <Route>
        {() => <Suspense fallback={<MinimalRouteFallback />}><NotFound /></Suspense>}
      </Route>
    </Switch>
  );
}

function App() {
  useJourneyState();

  useEffect(() => {
    const initDeferred = () => {
      import("./utils/web-vitals").then(({ initWebVitals }) => initWebVitals());

      const metaPixelId = document.querySelector('meta[name="fb-pixel-id"]')?.getAttribute("content");
      if (metaPixelId) {
        import("./utils/meta-pixel").then(({ initMetaPixel }) => initMetaPixel(metaPixelId));
      }
    };

    if ("requestIdleCallback" in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(initDeferred, { timeout: 5000 });
    } else {
      setTimeout(initDeferred, 3000);
    }
  }, []);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackJsError(
        event.message || 'Unknown error',
        event.filename || 'unknown',
        event.lineno || 0,
      );
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <BookingModalProvider>
            <TooltipProvider>
              <Toaster />
              <RouteProgressBar />
              <Router />
              <ScrollToTop />
              <Suspense fallback={null}>
                <ReturnVisitorBanner />
                <SeasonBanner />
                <WhatsAppFloatingButton />
                <CookieBanner />
                <ExitIntentModal />
                <SocialProofToast />
              </Suspense>
            </TooltipProvider>
          </BookingModalProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
