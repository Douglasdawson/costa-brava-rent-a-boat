import { useState } from "react";
import { Switch, Route, useSearch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { LanguageProvider } from "@/hooks/use-language";

// Import all components
import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import FeaturesSection from "./components/FeaturesSection";
import FleetSection from "./components/FleetSection";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";
import BookingFlow from "./components/BookingFlow";
import CRMDashboard from "./components/CRMDashboard";
import BoatDetailPage from "./components/BoatDetailPage";
import CondicionesGenerales from "./components/CondicionesGenerales";
import FAQPage from "@/pages/faq";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import TermsConditionsPage from "@/pages/terms-conditions";
import LocationBlanesPage from "@/pages/location-blanes";
import LocationLloretPage from "@/pages/location-lloret-de-mar";
import NotFound from "@/pages/not-found";
import { SEO } from "./components/SEO";
import { useLanguage } from "@/hooks/use-language";
import { 
  getSEOConfig, 
  generateHreflangLinks, 
  generateCanonicalUrl,
  generateLocalBusinessSchema,
  generateServiceSchema,
  generateBreadcrumbSchema
} from "@/utils/seo-config";

// Main Home Page Component
function HomePage() {
  const { language } = useLanguage();
  const seoConfig = getSEOConfig('home', language);
  const hreflangLinks = generateHreflangLinks('home');
  const canonical = generateCanonicalUrl('home', language);

  // Generate combined JSON-LD schemas for homepage
  const localBusinessSchema = generateLocalBusinessSchema(language);
  const serviceSchema = generateServiceSchema(language);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Inicio", url: "/" }
  ]);

  // Combine multiple schemas using @graph
  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      localBusinessSchema,
      serviceSchema,
      breadcrumbSchema
    ]
  };

  return (
    <div className="min-h-screen">
      <SEO 
        title={seoConfig.title}
        description={seoConfig.description}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={combinedJsonLd}
      />
      <Navigation />
      <Hero />
      <FleetSection />
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
  
  return <BookingFlow boatId={boatId} />;
}

function CRMDashboardPage() {
  return <CRMDashboard />;
}

function Solar450Page() {
  return <BoatDetailPage boatId="solar-450" />;
}

function Remus450Page() {
  return <BoatDetailPage boatId="remus-450" />;
}

function Astec400Page() {
  return <BoatDetailPage boatId="astec-400" />;
}

function Astec450Page() {
  return <BoatDetailPage boatId="astec-450" />;
}

function PacificCraft625Page() {
  return <BoatDetailPage boatId="pacific-craft-625" />;
}

function Trimarchi57SPage() {
  return <BoatDetailPage boatId="trimarchi-57s" />;
}

function MingollaBrava19Page() {
  return <BoatDetailPage boatId="mingolla-brava-19" />;
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

function LocationBlanesPageWrapper() {
  return <LocationBlanesPage />;
}

function LocationLloretPageWrapper() {
  return <LocationLloretPage />;
}

// Router Component
function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/booking" component={BookingFlowPage} />
      <Route path="/crm" component={CRMDashboardPage} />
      <Route path="/barco/solar-450" component={Solar450Page} />
      <Route path="/barco/remus-450" component={Remus450Page} />
      <Route path="/barco/astec-400" component={Astec400Page} />
      <Route path="/barco/astec-450" component={Astec450Page} />
      <Route path="/barco/pacific-craft-625" component={PacificCraft625Page} />
      <Route path="/barco/trimarchi-57s" component={Trimarchi57SPage} />
      <Route path="/barco/mingolla-brava-19" component={MingollaBrava19Page} />
      <Route path="/condiciones-generales" component={CondicionesGeneralesPage} />
      <Route path="/faq" component={FAQPageWrapper} />
      <Route path="/privacy-policy" component={PrivacyPolicyPageWrapper} />
      <Route path="/terms-conditions" component={TermsConditionsPageWrapper} />
      <Route path="/alquiler-barcos-blanes" component={LocationBlanesPageWrapper} />
      <Route path="/alquiler-barcos-lloret-de-mar" component={LocationLloretPageWrapper} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Demo Mode Toggle (for design preview)
function App() {
  const [demoMode, setDemoMode] = useState(false);
  
  const toggleDemo = () => {
    console.log("Demo mode toggled:", !demoMode);
    setDemoMode(!demoMode);
  };

  if (demoMode) {
    return (
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
          <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Costa Brava Rent a Boat Blanes - Vista Previa de Componentes
              </h1>
              <p className="text-gray-600 mb-4">
                Estos son los componentes individuales del sistema de reservas.
              </p>
              <Button onClick={toggleDemo} variant="outline" data-testid="button-exit-demo">
                Ver Aplicación Completa
              </Button>
            </div>
            
            <div className="space-y-12">
              <div className="bg-white rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Componente: Navegación</h2>
                <Navigation />
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Componente: Hero</h2>
                <div className="h-96 overflow-hidden">
                  <Hero />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4">Componente: CRM Dashboard</h2>
                <div className="h-96 overflow-hidden">
                  <CRMDashboard />
                </div>
              </div>
            </div>
          </div>
          <Toaster />
        </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
        <div className="fixed top-4 right-4 z-50">
          <Button 
            onClick={toggleDemo}
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm"
            data-testid="button-demo-mode"
          >
            Ver Componentes
          </Button>
        </div>
        <Toaster />
        <Router />
      </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
