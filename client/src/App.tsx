import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

// Import all components
import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import FeaturesSection from "./components/FeaturesSection";
import FleetSection from "./components/FleetSection";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";
import BookingFlow from "./components/BookingFlow";
import CRMDashboard from "./components/CRMDashboard";
import NotFound from "@/pages/not-found";

// Main Home Page Component
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

// Wrapper components for router
function BookingFlowPage() {
  return <BookingFlow />;
}

function CRMDashboardPage() {
  return <CRMDashboard />;
}

// Router Component
function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/booking" component={BookingFlowPage} />
      <Route path="/crm" component={CRMDashboardPage} />
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
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

export default App;
