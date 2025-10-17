import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Menu, X, Anchor, UserCircle, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import LanguageSelector from "./LanguageSelector";
import { useTranslations } from "@/lib/translations";
import { useAuth } from "@/hooks/useAuth";
import BookingFormWidget from "./BookingFormWidget";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  const t = useTranslations();
  const { isAuthenticated } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);
  
  const handleMyAccountClick = () => {
    setIsOpen(false); // Close mobile menu if open
    setLocation("/client/dashboard");
  };

  const handleLoginClick = () => {
    setIsOpen(false); // Close mobile menu if open
    setLocation("/login");
  };

  const handleMobileBooking = () => {
    setIsOpen(false); // Close mobile menu
    setIsBookingModalOpen(true); // Open booking modal
  };

  const scrollToSection = (sectionId: string, maxAttempts = 10) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Use scrollIntoView which respects CSS scroll-margin-top
      // Wait for next frame to ensure mobile menu has fully closed
      requestAnimationFrame(() => {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      });
      return;
    }
    
    // If element not found and we have attempts left, try again
    if (maxAttempts > 0) {
      requestAnimationFrame(() => scrollToSection(sectionId, maxAttempts - 1));
    }
  };

  const handleLogoClick = () => {
    setIsOpen(false); // Close mobile menu if open
    setLocation("/");
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleNavigation = (href: string, label: string) => {
    console.log(`Navigating to: ${label} (${href})`);
    
    // Close mobile menu
    setIsOpen(false);
    
    if (href === "/") {
      // Navigate to homepage
      const currentPath = window.location.pathname;
      if (currentPath === "/") {
        // Already on homepage, scroll to top
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      } else {
        // Navigate to homepage
        setLocation("/");
      }
    } else if (href === "#booking") {
      // Open booking modal
      setIsBookingModalOpen(true);
    } else if (href === "/blog") {
      // Navigate to Blog page or scroll to top if already on Blog page
      const currentPath = window.location.pathname;
      if (currentPath === "/blog" || currentPath.startsWith("/blog/")) {
        // Already on Blog, scroll to top
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      } else {
        // Navigate to Blog page
        setLocation("/blog");
      }
    } else if (href === "#faq") {
      // Navigate to FAQ page or scroll to top if already on FAQ page
      const currentPath = window.location.pathname;
      if (currentPath === "/faq") {
        // Already on FAQ page, scroll to top
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      } else {
        // Navigate to FAQ page
        setLocation("/faq");
      }
    } else if (href.startsWith("#")) {
      // For anchor links, first navigate to homepage if not already there
      const sectionId = href.substring(1);
      const currentPath = window.location.pathname;
      
      if (currentPath !== "/") {
        // Navigate to homepage first, then scroll to section
        setLocation("/");
        // Use robust scroll after navigation
        setTimeout(() => scrollToSection(sectionId), 50);
      } else {
        // Already on homepage, just scroll to section
        scrollToSection(sectionId);
      }
    } else {
      // Regular navigation
      setLocation(href);
    }
  };

  const navigationItems = [
    { label: t.nav.home, href: "/" },
    { label: t.nav.fleet, href: "#fleet" },
    { label: "Blog", href: "/blog" },
    { label: t.nav.contact, href: "#contact" },
    { label: t.nav.faq, href: "#faq" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="relative flex items-center justify-between h-16">
          {/* Logo - Left */}
          <button 
            onClick={handleLogoClick}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0 z-10"
            data-testid="brand-logo"
            aria-label="Ir a la página principal de Costa Brava Rent a Boat Blanes"
          >
            <Anchor className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <span className="font-heading font-bold text-sm sm:text-lg lg:text-xl text-gray-900">
              <span className="md:hidden">Costa Brava Rent a Boat - Blanes</span>
              <span className="hidden md:inline xl:hidden">CBRB</span>
              <span className="hidden xl:inline">Costa Brava Rent a Boat Blanes</span>
            </span>
          </button>

          {/* Desktop Navigation - Absolutely Centered */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8 absolute left-1/2 -translate-x-1/2">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.href, item.label)}
                className="text-gray-700 hover:text-primary transition-colors font-medium cursor-pointer bg-transparent border-none whitespace-nowrap"
                data-testid={`nav-link-${item.label.toLowerCase()}`}
                aria-label={`Navegar a ${item.label}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-4 z-10">
            <LanguageSelector variant="minimal" />
            {!isAuthenticated && (
              <Button 
                variant="ghost" 
                onClick={handleLoginClick}
                data-testid="button-login"
                aria-label="Iniciar sesión en tu cuenta"
              >
                <UserCircle className="w-4 h-4 mr-2" />
                Login
              </Button>
            )}
            {isAuthenticated && (
              <Button 
                variant="ghost" 
                onClick={handleMyAccountClick}
                data-testid="button-my-account"
                aria-label="Acceder a mi cuenta de cliente"
              >
                <UserCircle className="w-4 h-4 mr-2" />
                Mi Cuenta
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              data-testid="button-mobile-menu"
              aria-label={isOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white/95 backdrop-blur-md">
            <div className="flex flex-col space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.href, item.label)}
                  className="px-4 py-3 text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors w-full text-left bg-transparent border-none cursor-pointer font-medium"
                  data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                  aria-label={`Navegar a ${item.label}`}
                >
                  {item.label}
                </button>
              ))}
              <div className="px-4 py-2 border-t border-gray-200 mt-2 pt-4">
                <div className="flex flex-col space-y-3">
                  <Button 
                    className="justify-start h-12 px-4"
                    onClick={handleMobileBooking}
                    data-testid="mobile-button-book"
                    aria-label="Reservar barco ahora"
                  >
                    <Calendar className="w-4 h-4 mr-3" />
                    Reservar Ahora
                  </Button>
                  {!isAuthenticated && (
                    <Button 
                      variant="ghost" 
                      className="justify-start h-12 px-4"
                      onClick={handleLoginClick}
                      data-testid="mobile-button-login"
                      aria-label="Iniciar sesión en tu cuenta"
                    >
                      <UserCircle className="w-4 h-4 mr-3" />
                      Login
                    </Button>
                  )}
                  {isAuthenticated && (
                    <Button 
                      variant="ghost" 
                      className="justify-start h-12 px-4"
                      onClick={handleMyAccountClick}
                      data-testid="mobile-button-my-account"
                      aria-label="Acceder a mi cuenta de cliente"
                    >
                      <UserCircle className="w-4 h-4 mr-3" />
                      Mi Cuenta
                    </Button>
                  )}
                  <div className="pt-2">
                    <LanguageSelector variant="minimal" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="!max-w-4xl !w-[95vw] !max-h-[85vh] overflow-y-auto p-3 sm:p-4 md:p-6 !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2">
          <DialogHeader className="space-y-1 py-4 sm:py-3">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
              {t.booking.title}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600 text-center">
              {t.booking.modalSubtitle}
            </DialogDescription>
          </DialogHeader>
          <BookingFormWidget hideHeader={true} />
        </DialogContent>
      </Dialog>
    </nav>
  );
}