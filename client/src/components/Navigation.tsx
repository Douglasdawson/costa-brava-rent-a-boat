import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Calendar, Anchor } from "lucide-react";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  
  const handleLogin = () => {
    setIsLoggedIn(!isLoggedIn);
    console.log("Login toggled:", !isLoggedIn);
  };

  const navigationItems = [
    { label: "Inicio", href: "#home" },
    { label: "Flota", href: "#fleet" },
    { label: "Reservas", href: "#booking" },
    { label: "Contacto", href: "#contact" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2" data-testid="brand-logo">
            <Anchor className="w-8 h-8 text-primary" />
            <span className="font-heading font-bold text-xl text-gray-900">
              Costa Brava Rent a Boat
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-gray-700 hover:text-primary transition-colors font-medium"
                data-testid={`nav-link-${item.label.toLowerCase()}`}
              >
                {item.label}
              </a>
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
            <Button data-testid="button-book-now">
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
          <div className="md:hidden py-4 border-t border-gray-200 bg-white">
            <div className="flex flex-col space-y-2">
              {navigationItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-4 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                  data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </a>
              ))}
              <div className="px-4 py-2 border-t border-gray-200 mt-2 pt-4">
                <div className="flex flex-col space-y-2">
                  <Button 
                    variant="ghost" 
                    className="justify-start"
                    onClick={handleLogin}
                    data-testid="mobile-button-login"
                  >
                    <User className="w-4 h-4 mr-2" />
                    {isLoggedIn ? "CRM" : "Admin"}
                  </Button>
                  <Button 
                    className="justify-start"
                    data-testid="mobile-button-book"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
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