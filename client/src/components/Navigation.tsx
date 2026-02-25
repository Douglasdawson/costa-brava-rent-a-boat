import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Anchor, UserCircle, Calendar, Gift } from "lucide-react";
import { useLocation, Link } from "wouter";
import LanguageSelector from "./LanguageSelector";
import { useTranslations } from "@/lib/translations";
import { useAuth } from "@/hooks/useAuth";
import { useBookingModal } from "@/hooks/useBookingModal";
import { trackBookingFormOpen } from "@/utils/analytics";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocation, setLocation] = useLocation();
  const t = useTranslations();
  const { isAuthenticated } = useAuth();
  const { openBookingModal } = useBookingModal();

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
    trackBookingFormOpen();
    openBookingModal(); // Open booking modal
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
      trackBookingFormOpen();
      openBookingModal();
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
    { label: t.nav.giftCards, href: "/tarjetas-regalo" },
    { label: t.nav.contact, href: "#contact" },
    { label: t.nav.faq, href: "#faq" },
  ];

  const isNavItemActive = (href: string): boolean => {
    if (href === "/") return currentLocation === "/";
    if (href === "/blog") return currentLocation === "/blog" || currentLocation.startsWith("/blog/");
    if (href === "/tarjetas-regalo") return currentLocation === "/tarjetas-regalo";
    if (href === "#faq") return currentLocation === "/faq";
    return false;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="relative flex items-center justify-between h-16">
          {/* Logo - Left */}
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); handleLogoClick(); }}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer p-0 z-10"
            data-testid="brand-logo"
            aria-label="Ir a la página principal de Costa Brava Rent a Boat Blanes"
          >
            <Anchor className="w-6 h-6 sm:w-8 sm:h-8 text-primary" aria-hidden="true" />
            <span className="font-heading font-bold text-sm sm:text-lg lg:text-xl text-gray-900">
              <span className="md:hidden">Rent a Boat</span>
              <span className="hidden md:inline xl:hidden">Costa Brava Rent a Boat</span>
              <span className="hidden xl:inline">Costa Brava Rent a Boat Blanes</span>
            </span>
          </a>

          {/* Desktop Navigation - Absolutely Centered */}
          <div className="hidden lg:flex items-center space-x-4 lg:space-x-6 absolute left-1/2 -translate-x-1/2">
            {navigationItems.map((item) => {
              const activeClass = isNavItemActive(item.href) ? "text-primary font-semibold" : "text-gray-700 font-medium";
              const baseClass = `hover:text-primary transition-colors whitespace-nowrap ${activeClass}`;
              // Page routes: render as <a> so Googlebot can crawl them
              if (!item.href.startsWith("#")) {
                const href = item.href === "#faq" ? "/faq" : item.href;
                return (
                  <a
                    key={item.label}
                    href={href}
                    onClick={(e) => { e.preventDefault(); handleNavigation(item.href, item.label); }}
                    className={baseClass}
                    data-testid={`nav-link-${item.label.toLowerCase()}`}
                  >
                    {item.label}
                  </a>
                );
              }
              // Anchor links: keep as button
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.href, item.label)}
                  className={`cursor-pointer bg-transparent border-none ${baseClass}`}
                  data-testid={`nav-link-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Right side buttons */}
          <div className="hidden lg:flex items-center space-x-4 z-10">
            <LanguageSelector variant="minimal" />
            <Button
              onClick={() => handleNavigation("#booking", t.nav.bookNow)}
              data-testid="desktop-button-book"
              aria-label="Reservar barco ahora"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {t.nav.bookNow}
            </Button>
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
                {t.nav.myAccount}
              </Button>
            )}
          </div>

          {/* Mobile/tablet menu button */}
          <div className="lg:hidden">
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

        {/* Mobile/tablet Navigation */}
        <nav
          aria-label="Menú de navegación móvil"
          aria-hidden={!isOpen}
          className={`lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? "max-h-[600px] opacity-100 py-3" : "max-h-0 opacity-0 py-0"}`}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {navigationItems.map((item) => {
                const baseClass = "px-4 py-2.5 text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors w-full text-left font-medium block";
                if (!item.href.startsWith("#")) {
                  const href = item.href === "#faq" ? "/faq" : item.href;
                  return (
                    <a
                      key={item.label}
                      href={href}
                      onClick={(e) => { e.preventDefault(); handleNavigation(item.href, item.label); }}
                      className={baseClass}
                      data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                    >
                      {item.label}
                    </a>
                  );
                }
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavigation(item.href, item.label)}
                    className={`bg-transparent border-none cursor-pointer ${baseClass}`}
                    data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="px-4 py-2 border-t border-gray-200 mt-1 pt-3">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  className="h-10 px-5"
                  onClick={handleMobileBooking}
                  data-testid="mobile-button-book"
                  aria-label="Reservar barco ahora"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {t.nav.bookNow}
                </Button>
                {!isAuthenticated && (
                  <Button
                    variant="ghost"
                    className="h-10 px-4"
                    onClick={handleLoginClick}
                    data-testid="mobile-button-login"
                    aria-label="Iniciar sesión en tu cuenta"
                  >
                    <UserCircle className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                )}
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    className="h-10 px-4"
                    onClick={handleMyAccountClick}
                    data-testid="mobile-button-my-account"
                    aria-label="Acceder a mi cuenta de cliente"
                  >
                    <UserCircle className="w-4 h-4 mr-2" />
                    {t.nav.myAccount}
                  </Button>
                )}
                <LanguageSelector variant="minimal" />
              </div>
            </div>
        </nav>
      </div>
    </nav>
  );
}