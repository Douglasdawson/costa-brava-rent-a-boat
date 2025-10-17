import { lazy } from "react";
import { createBrowserRouter, createMemoryRouter, RouteObject } from "react-router-dom";

// Import critical components (above the fold)
import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import FeaturesSection from "./components/FeaturesSection";
import FleetSection from "./components/FleetSection";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";

// Lazy load non-critical components
const BoatDetailPage = lazy(() => import("./components/BoatDetailPage"));
const FAQPage = lazy(() => import("@/pages/faq"));
const PrivacyPolicyPage = lazy(() => import("@/pages/privacy-policy"));
const TermsConditionsPage = lazy(() => import("@/pages/terms-conditions"));
const CookiesPolicyPage = lazy(() => import("@/pages/cookies-policy"));
const LocationBlanesPage = lazy(() => import("@/pages/location-blanes"));
const LocationLloretPage = lazy(() => import("@/pages/location-lloret-de-mar"));
const LocationTossaPage = lazy(() => import("@/pages/location-tossa-de-mar"));
const CategoryLicenseFreePage = lazy(() => import("@/pages/category-license-free"));
const CategoryLicensedPage = lazy(() => import("@/pages/category-licensed"));
const BlogPage = lazy(() => import("@/pages/blog"));
const BlogDetailPage = lazy(() => import("@/pages/blog-detail"));
const DestinationDetailPage = lazy(() => import("@/pages/destination-detail"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Home page component
function HomePage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <FleetSection />
      <FeaturesSection />
      <ContactSection />
      <Footer />
    </div>
  );
}

// Route configuration (shared between client and server)
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/barco/:id",
    element: <BoatDetailPage />,
  },
  {
    path: "/faq",
    element: <FAQPage />,
  },
  {
    path: "/politica-privacidad",
    element: <PrivacyPolicyPage />,
  },
  {
    path: "/terminos-condiciones",
    element: <TermsConditionsPage />,
  },
  {
    path: "/politica-cookies",
    element: <CookiesPolicyPage />,
  },
  {
    path: "/blanes",
    element: <LocationBlanesPage />,
  },
  {
    path: "/lloret-de-mar",
    element: <LocationLloretPage />,
  },
  {
    path: "/tossa-de-mar",
    element: <LocationTossaPage />,
  },
  {
    path: "/barcos-sin-licencia",
    element: <CategoryLicenseFreePage />,
  },
  {
    path: "/barcos-con-licencia",
    element: <CategoryLicensedPage />,
  },
  {
    path: "/blog",
    element: <BlogPage />,
  },
  {
    path: "/blog/:slug",
    element: <BlogDetailPage />,
  },
  {
    path: "/destinos/:slug",
    element: <DestinationDetailPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

// Client-side router
export const router = import.meta.env.SSR
  ? createMemoryRouter(routes)
  : createBrowserRouter(routes);
