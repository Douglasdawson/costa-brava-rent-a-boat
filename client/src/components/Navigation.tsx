import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Calendar, Anchor } from "lucide-react";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { useLocation } from "wouter";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [, setLocation] = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);
  
  const handleLogin = () => {
    setIsLoggedIn(!isLoggedIn);
    console.log("Login toggled:", !isLoggedIn);
  };

  const handleBooking = () => {
    const message = createBookingMessage();
    openWhatsApp(message);
  };

  const scrollToSection = (sectionId: string, maxAttempts = 10) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      return;
    }
    
    // If element not found and we have attempts left, try again
    if (maxAttempts > 0) {
      requestAnimationFrame(() => scrollToSection(sectionId, maxAttempts - 1));
    }
  };

  const handleNavigation = (href: string, label: string) => {
    console.log(`Navigating to: ${label} (${href})`);
    
    // Close mobile menu
    setIsOpen(false);
    
    if (href === "#booking") {
      // Navigate to booking page
      setLocation("/booking");
    } else if (href === "#faq") {
      // FAQ doesn't exist, redirect to contact section on homepage
      const currentPath = window.location.pathname;
      if (currentPath !== "/") {
        setLocation("/");
        // Use robust scroll after navigation
        setTimeout(() => scrollToSection("contact"), 50);
      } else {
        scrollToSection("contact");
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
    { label: "Inicio", href: "/" },
    { label: "Flota", href: "#fleet" },
    { label: "Reserva", href: "#booking" },
    { label: "Contacto", href: "#contact" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2" data-testid="brand-logo">
            <Anchor className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <span className="font-heading font-bold text-sm sm:text-lg lg:text-xl text-gray-900">
              <span className="hidden lg:inline">Costa Brava Rent a Boat Blanes</span>
              <span className="lg:hidden">Costa Brava Rent a Boat - Blanes</span>
            </span>
          </div>

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
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={handleLogin}
              data-testid="button-login"
            >
              <User className="w-4 h-4 mr-2" />
              {isLoggedIn ? "CRM" : "Admin"}
            </Button>
            <Button 
              onClick={handleBooking}
              data-testid="button-book-now"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Reservar Ahora
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
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
                  <Button 
                    variant="ghost" 
                    className="justify-start h-12 px-4"
                    onClick={handleLogin}
                    data-testid="mobile-button-login"
                  >
                    <User className="w-4 h-4 mr-3" />
                    {isLoggedIn ? "CRM" : "Admin"}
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