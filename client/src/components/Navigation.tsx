import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Calendar, Anchor, UserCircle } from "lucide-react";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useLocation } from "wouter";
import LanguageSelector from "./LanguageSelector";
import { useTranslations } from "@/lib/translations";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const t = useTranslations();
  const { isAuthenticated } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);
  
  const handleAdminClick = () => {
    setIsOpen(false); // Close mobile menu if open
    setLocation("/crm");
  };

  const handleMyAccountClick = () => {
    setIsOpen(false); // Close mobile menu if open
    setLocation("/client/dashboard");
  };

  const handleBooking = () => {
    const message = createBookingMessage();
    openWhatsApp(message);
  };

  const scrollToSection = (sectionId: string, maxAttempts = 10) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Calculate position with offset for fixed navbar (h-16 = 64px + extra padding)
      const navbarOffset = 80; // 64px navbar height + 16px extra padding
      const elementPosition = element.offsetTop - navbarOffset;
      
      window.scrollTo({
        top: elementPosition,
        behavior: "smooth"
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
    
    if (href === "#booking") {
      // Navigate to booking page
      setLocation("/booking");
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
    { label: t.nav.booking, href: "#booking" },
    { label: t.nav.contact, href: "#contact" },
    { label: t.nav.faq, href: "#faq" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button 
            onClick={handleLogoClick}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0"
            data-testid="brand-logo"
          >
            <Anchor className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <span className="font-heading font-bold text-sm sm:text-lg lg:text-xl text-gray-900">
              <span className="hidden lg:inline">Costa Brava Rent a Boat Blanes</span>
              <span className="lg:hidden">Costa Brava Rent a Boat - Blanes</span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.href, item.label)}
                className="text-gray-700 hover:text-primary transition-colors font-medium cursor-pointer bg-transparent border-none"
                data-testid={`nav-link-${item.label.toLowerCase()}`}
              >
                {item.label}
              </button>
            ))}
            <LanguageSelector variant="minimal" />
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              onClick={handleBooking}
              data-testid="button-book-now"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Reservar Ahora
            </Button>
            {isAuthenticated && (
              <Button 
                variant="ghost" 
                onClick={handleMyAccountClick}
                data-testid="button-my-account"
              >
                <UserCircle className="w-4 h-4 mr-2" />
                Mi Cuenta
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={handleAdminClick}
              data-testid="button-admin"
            >
              <User className="w-4 h-4 mr-2" />
              Admin
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              data-testid="button-mobile-menu"
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
                >
                  {item.label}
                </button>
              ))}
              <div className="px-4 py-2 border-t border-gray-200 mt-2 pt-4">
                <div className="flex flex-col space-y-3">
                  {isAuthenticated && (
                    <Button 
                      variant="ghost" 
                      className="justify-start h-12 px-4"
                      onClick={handleMyAccountClick}
                      data-testid="mobile-button-my-account"
                    >
                      <UserCircle className="w-4 h-4 mr-3" />
                      Mi Cuenta
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    className="justify-start h-12 px-4"
                    onClick={handleAdminClick}
                    data-testid="mobile-button-admin"
                  >
                    <User className="w-4 h-4 mr-3" />
                    Admin
                  </Button>
                  <Button 
                    className="justify-start h-12 px-4"
                    onClick={handleBooking}
                    data-testid="mobile-button-book"
                  >
                    <Calendar className="w-4 h-4 mr-3" />
                    Reservar Ahora
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}