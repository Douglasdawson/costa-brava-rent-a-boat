import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, UserCircle, Calendar, Sun, Moon, ShoppingBag, ChevronDown } from "lucide-react";
import logoHorizontal from "@/assets/real-photos/logo-horizontal.png";
import logoIcon from "@/assets/real-photos/logo-icon.png";
import LogoCostaBravaSVG from "@/components/icons/LogoCostavaBravaSVG";
import { useLocation, Link } from "wouter";
import LanguageSelector from "./LanguageSelector";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { getSlugForPage } from "@shared/i18n-routes";
import { useAuth } from "@/hooks/useAuth";
import { useBookingModal } from "@/hooks/bookingModalContext";
import { trackBookingFormOpen } from "@/utils/analytics";
import { useTheme } from "@/hooks/use-theme";
import { lockScroll, unlockScroll } from "@/utils/scroll-lock";
import { useThrottledScroll } from "@/hooks/useThrottledScroll";

interface NavItem {
  label: string;
  href: string;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

interface NavigationProps {
  /** Shop cart: when onCartClick is set, a cart icon with badge renders in the header (used by /tienda only). */
  cartCount?: number;
  onCartClick?: () => void;
}

export default function Navigation({ cartCount = 0, onCartClick }: NavigationProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentLocation, setLocation] = useLocation();

  const handleScroll = useCallback((scrollY: number) => setScrolled(scrollY > 50), []);
  useThrottledScroll(handleScroll);
  const t = useTranslations();
  const { language, localizedPath } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { openBookingModal } = useBookingModal();
  const { theme, toggleTheme } = useTheme();

  const toggleMenu = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) lockScroll("mobile-nav");
    else unlockScroll("mobile-nav");
  };

  const closeMenu = () => {
    setIsOpen(false);
    unlockScroll("mobile-nav");
  };

  // Guarantee scroll unlock on unmount
  useEffect(() => {
    return () => unlockScroll("mobile-nav");
  }, []);

  // Close the mobile menu with Escape (keyboard parity with dialogs)
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        unlockScroll("mobile-nav");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const handleMyAccountClick = () => {
    closeMenu();
    setLocation(localizedPath("clientDashboard"));
  };

  const handleLoginClick = () => {
    closeMenu();
    setLocation(localizedPath("login"));
  };

  const handleMobileBooking = () => {
    closeMenu();
    trackBookingFormOpen();
    openBookingModal();
  };

  const scrollToSection = (sectionId: string, maxAttempts = 10) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Use scrollIntoView which respects CSS scroll-margin-top
      // Wait for next frame to ensure mobile menu has fully closed
      requestAnimationFrame(() => {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
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
    closeMenu();
    setLocation(localizedPath("home"));
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleNavigation = (href: string, label: string) => {
    closeMenu();

    const homePath = localizedPath("home");
    const blogPath = localizedPath("blog");
    const faqPath = localizedPath("faq");

    if (href === homePath) {
      // Navigate to homepage
      const currentPath = window.location.pathname;
      if (currentPath === `/${language}/` || currentPath === `/${language}`) {
        // Already on homepage, scroll to top
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } else {
        // Navigate to homepage
        setLocation(homePath);
      }
    } else if (href === "#booking") {
      // Open booking modal
      trackBookingFormOpen();
      openBookingModal();
    } else if (href === blogPath) {
      // Navigate to Blog page or scroll to top if already on Blog page
      const currentPath = window.location.pathname;
      if (currentPath.startsWith(`/${language}/blog`)) {
        // Already on Blog, scroll to top
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } else {
        // Navigate to Blog page
        setLocation(blogPath);
        window.scrollTo({ top: 0 });
      }
    } else if (href === faqPath) {
      // Navigate to FAQ page or scroll to top if already on FAQ page
      const currentPath = window.location.pathname;
      if (currentPath === faqPath) {
        // Already on FAQ page, scroll to top
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } else {
        // Navigate to FAQ page
        setLocation(faqPath);
      }
    } else if (href.startsWith("#")) {
      // For anchor links, first navigate to homepage if not already there
      const sectionId = href.substring(1);
      const currentPath = window.location.pathname;

      if (currentPath !== `/${language}/` && currentPath !== `/${language}`) {
        // Navigate to homepage first, then scroll to section
        setLocation(homePath);
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

  const nav = {
    home: { label: t.nav.home, href: localizedPath("home") },
    fleet: { label: t.nav.fleet, href: "#fleet" },
    // Pivote 2026 (RD 1188/2025): las dos categorías que se venden desde octubre salen del footer al menú.
    licensed: {
      label: t.nav.licensedBoats ?? "Lanchas con licencia",
      href: localizedPath("categoryLicensed"),
    },
    captained: { label: t.nav.captained ?? "Con patrón", href: localizedPath("categoryCaptained") },
    // Pivote 2026 (RD 1188/2025): el pilar del titulín entra en el menú principal.
    titulin: {
      label: t.navigationLicensePage?.navLabel ?? "Titulín",
      href: localizedPath("navigationLicense"),
    },
    jetski: { label: t.nav.jetski, href: localizedPath("jetskiHub") },
    scooters: { label: t.nav.scooters, href: localizedPath("scooters") },
    tienda: { label: t.nav.tienda, href: localizedPath("tienda") },
    routes: { label: t.footer.destinations, href: localizedPath("routes") },
    garantias: { label: t.garantiasPage.navLabel, href: localizedPath("garantias") },
    blog: { label: "Blog", href: localizedPath("blog") },
  };

  // 11 flat links overflowed the desktop bar below ~1450px (measured 2026-09-24) and made
  // the mobile menu a long scroll, so both use two disclosure groups. "Inicio" is the logo.
  const desktopItems: (NavItem | NavGroup)[] = [
    {
      id: "boats",
      label: t.nav.boats,
      items: [{ ...nav.fleet, label: t.nav.allFleet }, nav.licensed, nav.captained],
    },
    nav.titulin,
    nav.jetski,
    nav.routes,
    { id: "more", label: t.nav.more, items: [nav.scooters, nav.tienda, nav.garantias, nav.blog] },
  ];

  const [openGroup, setOpenGroup] = useState<string | null>(null);

  // Close the open desktop group on outside click / Escape.
  useEffect(() => {
    if (!openGroup) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.(`[data-nav-group="${openGroup}"]`)) setOpenGroup(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      document
        .querySelector<HTMLButtonElement>(`[data-nav-group="${openGroup}"] > button`)
        ?.focus();
      setOpenGroup(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openGroup]);

  const renderNavLink = (item: NavItem, className: string, testId: string, onDone?: () => void) => {
    const active = isNavItemActive(item.href);
    // Page routes: render as <a> so Googlebot can crawl them
    if (!item.href.startsWith("#")) {
      return (
        <a
          key={item.href}
          href={item.href}
          onClick={e => {
            e.preventDefault();
            onDone?.();
            handleNavigation(item.href, item.label);
          }}
          className={className}
          data-testid={testId}
          {...(active ? { "aria-current": "page" as const } : {})}
        >
          {item.label}
        </a>
      );
    }
    // Anchor links: keep as button
    return (
      <button
        key={item.href}
        onClick={() => {
          onDone?.();
          handleNavigation(item.href, item.label);
        }}
        className={`cursor-pointer bg-transparent border-none ${className}`}
        data-testid={testId}
      >
        {item.label}
      </button>
    );
  };

  const homePath = localizedPath("home");
  const isTransparent =
    (currentLocation === homePath || currentLocation === homePath.replace(/\/$/, "")) && !scrolled;

  const isNavItemActive = (href: string): boolean => {
    const path = window.location.pathname;
    if (href === localizedPath("home")) return path === `/${language}/` || path === `/${language}`;
    if (href === localizedPath("blog")) return path.startsWith(`/${language}/blog`);
    if (href === localizedPath("routes")) {
      const routesSlug = getSlugForPage("routes", language);
      const destSlug = getSlugForPage("destinations", language);
      return path.includes(routesSlug) || path.includes(destSlug);
    }
    if (href.startsWith("#")) return false;
    return path === href || path.startsWith(`${href}/`);
  };

  return (
    <nav className="fixed top-3 left-3 right-3 z-50 bg-background/95 backdrop-blur-xl rounded-2xl border border-border shadow-md md:top-6 md:left-6 md:right-6 pt-safe">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none"
      >
        {t.nav.skipToContent}
      </a>
      <div className="px-4 lg:px-6">
        {/* lg+: 1fr/auto/1fr grid so the nav links center on the BAR, not on
            the leftover space between the (narrower) logo and the (wider)
            right-side buttons. Tracks can't overlap, so the old flex safety
            against collisions is preserved. */}
        <div className="relative flex items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr] h-12 lg:h-16">
          {/* Logo - Left */}
          <a
            href={localizedPath("home")}
            onClick={e => {
              e.preventDefault();
              handleLogoClick();
            }}
            className="flex flex-shrink-0 items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer p-0 pointer-coarse:p-1.5 pointer-coarse:-m-1.5 z-10 lg:justify-self-start"
            data-testid="brand-logo"
            aria-label={t.a11y.goToHomePage}
          >
            <LogoCostaBravaSVG className="h-8 lg:h-10" />
          </a>

          {/* Desktop Navigation - center track of the grid (true bar center) */}
          <nav
            aria-label="Primary"
            className="hidden lg:flex min-w-0 items-center justify-center gap-x-3 xl:gap-x-6 px-4"
          >
            {desktopItems.map(entry => {
              const itemClass = (active: boolean) =>
                `text-sm xl:text-base pointer-coarse:py-3 hover:text-foreground transition-colors whitespace-nowrap rounded focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:outline-none ${active ? "text-foreground font-semibold" : "text-foreground/70 font-medium"}`;
              if (!("items" in entry)) {
                return renderNavLink(
                  entry,
                  itemClass(isNavItemActive(entry.href)),
                  `nav-link-${entry.label.toLowerCase()}`
                );
              }
              const isOpen = openGroup === entry.id;
              const panelId = `nav-group-${entry.id}`;
              return (
                // Links stay in the DOM while closed (hidden via CSS, not unmounted) so crawlers see them.
                <div
                  key={entry.id}
                  data-nav-group={entry.id}
                  className="group relative"
                  onMouseLeave={() => isOpen && setOpenGroup(null)}
                  onBlur={e => {
                    // Tabbing out of the group closes it (keyboard parity with the mouse).
                    if (isOpen && !e.currentTarget.contains(e.relatedTarget as Node | null))
                      setOpenGroup(null);
                  }}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenGroup(isOpen ? null : entry.id)}
                    className={`inline-flex items-center gap-1 cursor-pointer bg-transparent border-none ${itemClass(entry.items.some(i => isNavItemActive(i.href)))}`}
                    data-testid={`nav-group-${entry.id}`}
                  >
                    {entry.label}
                    <ChevronDown
                      className={`h-3.5 w-3.5 opacity-60 transition-transform duration-200 motion-reduce:transition-none [@media(hover:hover)]:group-hover:rotate-180 ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  {/* pt-3 bridges the gap so the pointer can travel from trigger to panel without closing it */}
                  <div
                    id={panelId}
                    className={`absolute left-1/2 top-full -translate-x-1/2 pt-3 transition-[opacity,visibility] duration-150 motion-reduce:transition-none ${isOpen ? "visible opacity-100" : "invisible opacity-0 [@media(hover:hover)]:group-hover:visible [@media(hover:hover)]:group-hover:opacity-100"}`}
                  >
                    <div className="min-w-52 rounded-xl border border-border bg-background p-1.5 shadow-md">
                      {entry.items.map(item => {
                        const active = isNavItemActive(item.href);
                        return renderNavLink(
                          item,
                          `flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm whitespace-nowrap transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:outline-none ${active ? "text-foreground font-semibold" : "text-foreground/80 font-medium"}`,
                          `nav-link-${item.label.toLowerCase()}`,
                          () => setOpenGroup(null)
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Right side buttons */}
          <div className="hidden lg:flex flex-shrink-0 items-center space-x-1.5 xl:space-x-3 z-10 lg:justify-self-end">
            <LanguageSelector
              variant="minimal"
              className="text-foreground/70 hover:text-foreground hover:bg-muted"
            />
            {onCartClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onCartClick}
                data-testid="desktop-button-cart"
                aria-label={t.shopPage.cart.title}
                className="relative text-foreground/70 hover:text-foreground hover:bg-muted"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cta px-1 text-[10px] font-bold text-cta-foreground">
                    {cartCount}
                  </span>
                )}
              </Button>
            )}
            <Button
              onClick={() => handleNavigation("#booking", t.nav.bookNow)}
              data-testid="desktop-button-book"
              aria-label={t.a11y.bookBoatNow}
              className="bg-cta hover:bg-cta/90 text-primary-foreground dark:text-background rounded-full px-6 py-2 text-sm font-medium btn-elevated cta-pulse focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none"
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
          <div className="lg:hidden flex items-center gap-1">
            {onCartClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onCartClick}
                data-testid="mobile-button-cart"
                aria-label={t.shopPage.cart.title}
                className="relative min-h-11 min-w-11"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cta px-1 text-[10px] font-bold text-cta-foreground">
                    {cartCount}
                  </span>
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              data-testid="button-mobile-menu"
              aria-label={isOpen ? t.a11y.closeNavMenu : t.a11y.openNavMenu}
              aria-expanded={isOpen}
              className="min-h-11 min-w-11 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile/tablet Navigation */}
        <nav
          aria-label={t.a11y.mobileNavMenu}
          aria-hidden={!isOpen}
          className={`lg:hidden transition-all duration-200 ease-in-out ${isOpen ? "max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain opacity-100 py-3 border-t border-border bg-background" : "max-h-0 overflow-hidden opacity-0 py-0"}`}
        >
          <div className="grid grid-cols-1 gap-0">
            {desktopItems.map(entry => {
              const linkClass =
                "px-4 py-3.5 text-foreground hover:text-primary hover:bg-muted transition-colors w-full text-left font-medium block text-base rounded focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none";
              if (!("items" in entry)) {
                return renderNavLink(entry, linkClass, `mobile-nav-${entry.label.toLowerCase()}`);
              }
              // Native <details>: no JS state, and closed links stay in the DOM for crawlers.
              return (
                <details
                  key={entry.id}
                  className="group"
                  data-testid={`mobile-nav-group-${entry.id}`}
                >
                  <summary
                    className={`${linkClass} flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
                  >
                    {entry.label}
                    <ChevronDown
                      className="h-4 w-4 opacity-60 transition-transform duration-200 motion-reduce:transition-none group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="pb-1">
                    {entry.items.map(item =>
                      renderNavLink(
                        item,
                        `${linkClass} pl-8 py-3 text-foreground/80`,
                        `mobile-nav-${item.label.toLowerCase()}`
                      )
                    )}
                  </div>
                </details>
              );
            })}
          </div>
          <div className="px-4 py-2 border-t border-border mt-1 pt-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                className="bg-cta hover:bg-cta/90 text-primary-foreground dark:text-background rounded-full px-6 py-3 text-sm font-medium btn-elevated cta-pulse min-h-11 focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none"
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
                aria-label={theme === "dark" ? t.a11y.switchToLightMode : t.a11y.switchToDarkMode}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <LanguageSelector variant="minimal" />
            </div>
          </div>
        </nav>
      </div>
    </nav>
  );
}
