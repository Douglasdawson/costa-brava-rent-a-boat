import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, UserCircle, Calendar, Sun, Moon } from "lucide-react";
import logoHorizontal from "@/assets/real-photos/logo-horizontal.png";
import logoIcon from "@/assets/real-photos/logo-icon.png";
import LogoCostaBravaSVG from "@/components/icons/LogoCostavaBravaSVG";
import { useLocation, Link } from "wouter";
import LanguageSelector from "./LanguageSelector";
import { useTranslations } from "@/lib/translations";
import { useAuth } from "@/hooks/useAuth";
import { useBookingModal } from "@/hooks/bookingModalContext";
import { trackBookingFormOpen } from "@/utils/analytics";
import { useTheme } from "@/hooks/use-theme";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentLocation, setLocation] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll(); // Check initial state
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const t = useTranslations();
  const { isAuthenticated } = useAuth();
  const { openBookingModal } = useBookingModal();
  const { theme, toggleTheme } = useTheme();

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
        window.scrollTo({ top: 0 });
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
    { label: "Destinos", href: "/rutas" },
    { label: "Blog", href: "/blog" },
  ];

  const isTransparent = currentLocation === "/" && !scrolled;

  const isNavItemActive = (href: string): boolean => {
    if (href === "/blog") return currentLocation === "/blog" || currentLocation.startsWith("/blog/");
    if (href === "/rutas") return currentLocation === "/rutas" || currentLocation.startsWith("/destinos/");
    return false;
  };

  return (
    <nav className="fixed top-3 left-3 right-3 z-50 bg-background/95 backdrop-blur-xl rounded-2xl border border-border shadow-md md:top-6 md:left-6 md:right-6 pt-safe">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:outline-none"
      >
        Saltar al contenido
      </a>
      <div className="px-4 lg:px-6">
        <div className="relative flex items-center justify-between h-12 lg:h-16">
          {/* Logo - Left */}
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); handleLogoClick(); }}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer p-0 z-10"
            data-testid="brand-logo"
            aria-label={t.a11y.goToHomePage}
          >
            <LogoCostaBravaSVG className="h-8 lg:h-10" />
          </a>

          {/* Desktop Navigation - Absolutely Centered */}
          <div className="hidden lg:flex items-center space-x-4 lg:space-x-6 absolute left-1/2 -translate-x-1/2">
            {navigationItems.map((item) => {
              const activeClass = isNavItemActive(item.href)
                ? "text-foreground font-semibold"
                : "text-foreground/70 font-medium";
              const baseClass = `hover:text-foreground transition-colors whitespace-nowrap rounded focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:ring-offset-2 focus-visible:outline-none ${activeClass}`;
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
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t.a11y.switchToLightMode : t.a11y.switchToDarkMode}
              className="text-foreground/70 hover:text-foreground hover:bg-muted"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <LanguageSelector variant="minimal" className="text-foreground/70 hover:text-foreground hover:bg-muted" />
            <Button
              onClick={() => handleNavigation("#booking", t.nav.bookNow)}
              data-testid="desktop-button-book"
              aria-label={t.a11y.bookBoatNow}
              className="bg-cta hover:bg-cta/90 text-white rounded-full px-6 py-2 text-sm font-medium btn-elevated cta-pulse focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none"
            >
              {t.nav.bookNow}
            </Button>
            {isAuthenticated && (
              <Button
                variant="ghost"
                onClick={handleMyAccountClick}
                data-testid="button-my-account"
                aria-label={t.a11y.accessMyAccount}
                className="text-foreground/70 hover:text-foreground hover:bg-muted"
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
              aria-label={isOpen ? t.a11y.closeNavMenu : t.a11y.openNavMenu}
              aria-expanded={isOpen}
              className="focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:outline-none"
            >
              {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </Button>
          </div>
        </div>

        {/* Mobile/tablet Navigation */}
        <nav
          aria-label={t.a11y.mobileNavMenu}
          aria-hidden={!isOpen}
          className={`lg:hidden border-t border-border bg-background overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? "max-h-[600px] opacity-100 py-3" : "max-h-0 opacity-0 py-0"}`}
        >
            <div className="grid grid-cols-1 gap-0">
              {navigationItems.map((item) => {
                const baseClass = "px-4 py-3.5 text-foreground hover:text-primary hover:bg-muted transition-colors w-full text-left font-medium block text-base rounded focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:outline-none";
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
            <div className="px-4 py-2 border-t border-border mt-1 pt-3">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  className="bg-cta hover:bg-cta/90 text-white rounded-full px-6 py-3 text-sm font-medium btn-elevated cta-pulse min-h-11 focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none"
                  onClick={handleMobileBooking}
                  data-testid="mobile-button-book"
                  aria-label={t.a11y.bookBoatNow}
                >
                  {t.nav.bookNow}
                </Button>
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    className="min-h-11 px-4"
                    onClick={handleMyAccountClick}
                    data-testid="mobile-button-my-account"
                    aria-label={t.a11y.accessMyAccount}
                  >
                    <UserCircle className="w-4 h-4 mr-2" />
                    {t.nav.myAccount}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? t.a11y.switchToLightMode : t.a11y.switchToDarkMode}
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
                <LanguageSelector variant="minimal" />
              </div>
            </div>
        </nav>
      </div>
    </nav>
  );
}