import { useState, useEffect, useId, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { UserCircle, Sun, Moon, ShoppingBag, ChevronDown } from "lucide-react";
import LogoCostaBravaSVG from "@/components/icons/LogoCostavaBravaSVG";
import { useLocation, Link } from "wouter";
import LanguageSelector from "./LanguageSelector";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { getSlugForPage } from "@shared/i18n-routes";
import { ACTIVITATUM_GUIDE_PATH, activitatumUrl } from "@shared/activitatumLinks";
import { openActiviframe } from "@/lib/activiframe";
import { useAuth } from "@/hooks/useAuth";
import { useBookingModal } from "@/hooks/bookingModalContext";
import { trackBookingFormOpen } from "@/utils/analytics";
import { useTheme } from "@/hooks/use-theme";
import { lockScroll, unlockScroll } from "@/utils/scroll-lock";

// Pill nav ported from talleres.red (components/nav.tsx). Tokens --nav-* live in index.css.
// Hysteresis: "scrolled" turns on past ON and off below OFF so the pill never flickers at the threshold.
const SCROLL_ON = 32;
const SCROLL_OFF = 12;
// After the pointer leaves, the pill waits before collapsing (450 ms x --nav-k 0.75, see index.css).
const COLLAPSE_GRACE_MS = 350;
const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta";
// Same easing/stagger as the talleres panel, expressed once.
const SOFT_EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    cb => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

// React 18 has no typed `inert` prop: pass it as a plain attribute.
const inertAttr = (on: boolean): Record<string, string> => (on ? { inert: "" } : {});

interface Highlight {
  x: number;
  width: number;
  visible: boolean;
  slide: boolean;
}

interface NavItem {
  label: string;
  href: string;
  /** Activitatum path: opens in the Activiframe overlay; href stays a real link as fallback. */
  embedPath?: string;
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
  const navRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const [scrolled, setScrolled] = useState(false);
  const [, setLocation] = useLocation();
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
    // Click/tap outside the navbar closes the menu
    const onPointerDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        unlockScroll("mobile-nav");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
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
    // Activitatum (sister OTA): our guide page, curated without our own boats/jet skis.
    activities: {
      label: t.nav.activities,
      href: activitatumUrl(ACTIVITATUM_GUIDE_PATH, language, "nav"),
      embedPath: ACTIVITATUM_GUIDE_PATH,
    },
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
    nav.activities,
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
    if (item.embedPath) {
      return (
        <a
          key={item.href}
          href={item.href}
          target="_blank"
          rel="noopener"
          onClick={e => {
            e.preventDefault();
            onDone?.();
            void openActiviframe(item.embedPath!, language, item.href);
          }}
          className={className}
          data-testid={testId}
        >
          {item.label}
        </a>
      );
    }
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

  // --- Pill behaviour (desktop collapse, sliding highlight) ---
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  // Fine pointer + desktop: the pill folds to logo + CTA after scrolling and reopens on hover / keyboard focus.
  const canCollapse = useMediaQuery("(min-width: 1024px) and (hover: hover)");
  const [hovered, setHovered] = useState(false);
  const [keyboardIn, setKeyboardIn] = useState(false);
  const leaveTimer = useRef<number | undefined>(undefined);
  const collapsed = canCollapse && scrolled && !hovered && !keyboardIn && !openGroup;
  // Natural width of the links block: the wrapper animates between it and 0 (a grid 0fr track does not
  // collapse an auto-width container, so the width is measured instead).
  const extrasRef = useRef<HTMLDivElement>(null);
  const [extrasWidth, setExtrasWidth] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<Highlight>({
    x: 0,
    width: 0,
    visible: false,
    slide: false,
  });

  useEffect(() => {
    const update = () =>
      setScrolled(prev => (prev ? window.scrollY > SCROLL_OFF : window.scrollY > SCROLL_ON));
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  useEffect(() => {
    const el = extrasRef.current;
    if (!el) return;
    const measure = () => setExtrasWidth(el.offsetWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Resizing past lg with the mobile panel open would leave the body scroll-locked.
  useEffect(() => {
    if (isDesktop && isOpen) closeMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop]);

  const enter = () => {
    window.clearTimeout(leaveTimer.current);
    setHovered(true);
  };
  const leave = () => {
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setHovered(false), COLLAPSE_GRACE_MS);
  };
  // Only keyboard focus counts: after a mouse click the focus stays on the link and must not pin the pill open.
  const focusIn = (e: React.FocusEvent<HTMLElement>) => {
    if (e.target.matches(":focus-visible")) setKeyboardIn(true);
  };
  const focusOut = (e: React.FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setKeyboardIn(false);
  };

  const showHighlight = (e: React.PointerEvent<HTMLElement> | React.FocusEvent<HTMLElement>) => {
    const { offsetLeft, offsetWidth } = e.currentTarget;
    setHighlight(prev => ({ x: offsetLeft, width: offsetWidth, visible: true, slide: prev.visible }));
  };
  const hideHighlight = () => setHighlight(prev => ({ ...prev, visible: false }));

  const topLinkClass = (active: boolean) =>
    `relative flex h-9 items-center gap-1 rounded-full px-3.5 text-sm leading-none whitespace-nowrap transition-colors duration-200 motion-reduce:transition-none hover:text-foreground ${FOCUS_RING} ${active ? "text-foreground" : "text-foreground/70"}`;
  const panelLinkClass = (active: boolean) =>
    `flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm whitespace-nowrap transition-colors hover:bg-foreground/[0.07] hover:text-foreground focus-visible:bg-foreground/[0.07] ${FOCUS_RING} ${active ? "text-foreground" : "text-foreground/75"}`;
  const mobileRowClass =
    `flex h-[52px] w-full items-center justify-between rounded-2xl px-3 text-left text-xl leading-none font-medium tracking-[-0.02em] text-foreground transition-colors duration-200 hover:bg-foreground/[0.06] ${FOCUS_RING}`;
  const mobileSubClass =
    `flex h-12 w-full items-center rounded-2xl pl-6 pr-3 text-left text-lg leading-none text-foreground/80 transition-colors duration-200 hover:bg-foreground/[0.06] hover:text-foreground ${FOCUS_RING}`;

  const cartButton = onCartClick && (
    <button
      type="button"
      onClick={onCartClick}
      data-testid={isDesktop ? "desktop-button-cart" : "mobile-button-cart"}
      aria-label={t.shopPage.cart.title}
      className={`relative flex size-11 cursor-pointer items-center justify-center rounded-full text-foreground/80 transition-colors duration-200 hover:bg-foreground/[0.07] hover:text-foreground ${FOCUS_RING}`}
    >
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      {cartCount > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cta px-1 text-[10px] font-bold text-primary-foreground dark:text-background">
          {cartCount}
        </span>
      )}
    </button>
  );

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-5 lg:pt-6">
      {/* Scrim behind the open mobile panel; pointerdown outside the pill closes it (effect above). */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 -z-10 bg-black/45 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none lg:hidden ${isOpen ? "pointer-events-auto opacity-100" : "opacity-0"}`}
      />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:pointer-events-auto focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none"
      >
        {t.nav.skipToContent}
      </a>
      <div
        ref={navRef}
        data-scrolled={scrolled || isOpen}
        data-collapsed={collapsed}
        onPointerEnter={enter}
        onPointerLeave={leave}
        onFocus={focusIn}
        onBlur={focusOut}
        className="group/pill pointer-events-auto w-full max-w-[420px] animate-appear rounded-[26px] bg-background text-foreground shadow-[0_10px_30px_-12px_rgb(0_0_0/0.28)] ring-1 ring-border transition-shadow duration-300 [--appear-y:-14px] motion-reduce:animate-none motion-reduce:transition-none data-[scrolled=true]:shadow-[0_18px_44px_-14px_rgb(0_0_0/0.4)] sm:max-w-[520px] lg:w-auto lg:max-w-none"
      >
        <nav aria-label="Primary" className="flex h-[52px] items-center pl-4 pr-1.5 lg:pl-5">
          <a
            href={localizedPath("home")}
            onClick={e => {
              e.preventDefault();
              handleLogoClick();
            }}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-full ${FOCUS_RING} motion-reduce:transition-none`}
            data-testid="brand-logo"
            aria-label={t.a11y.goToHomePage}
          >
            <LogoCostaBravaSVG className="h-9 w-auto text-foreground lg:h-10" />
          </a>

          {/* Desktop links + extras. Collapses by animating width to 0; overflow is clipped on X only so
              the dropdown panels can still hang below the pill. */}
          <div
            {...inertAttr(collapsed)}
            style={extrasWidth === null ? undefined : { width: collapsed ? 0 : extrasWidth }}
            className="hidden overflow-x-clip transition-[width] duration-[var(--nav-dur)] ease-[var(--nav-ease)] motion-reduce:transition-none group-data-[collapsed=true]/pill:delay-[var(--nav-close-delay)] lg:block"
          >
            <div ref={extrasRef} className="flex w-max items-center px-1 transition-opacity duration-[var(--nav-fade-in)] delay-[var(--nav-fade-in-delay)] ease-[var(--nav-ease)] motion-reduce:transition-none group-data-[collapsed=true]/pill:opacity-0 group-data-[collapsed=true]/pill:delay-0 group-data-[collapsed=true]/pill:duration-[var(--nav-fade-out)]">
              <ul
                onPointerLeave={hideHighlight}
                onBlur={e => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hideHighlight();
                }}
                className="relative ml-5 flex h-9 items-center lg:ml-6"
              >
                <li
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-y-0 left-0 rounded-full bg-foreground/[0.07] transition-[transform,width,opacity] duration-200 ease-out motion-reduce:transition-none ${highlight.visible ? "opacity-100" : "opacity-0"}`}
                  style={
                    {
                      width: highlight.width,
                      transform: `translateX(${highlight.x}px)`,
                      transitionProperty: highlight.slide ? undefined : "opacity",
                    } as CSSProperties
                  }
                />
                {desktopItems.map(entry => {
                  if (!("items" in entry)) {
                    return (
                      <li key={entry.href} onPointerEnter={showHighlight} onFocus={showHighlight}>
                        {renderNavLink(
                          entry,
                          topLinkClass(isNavItemActive(entry.href)),
                          `nav-link-${entry.label.toLowerCase()}`
                        )}
                      </li>
                    );
                  }
                  const open = openGroup === entry.id;
                  const groupActive = entry.items.some(i => isNavItemActive(i.href));
                  return (
                    // Links stay in the DOM while closed (hidden via CSS, not unmounted) so crawlers see them.
                    <li
                      key={entry.id}
                      data-nav-group={entry.id}
                      className="group relative"
                      onPointerEnter={showHighlight}
                      onFocus={showHighlight}
                      onMouseLeave={() => open && setOpenGroup(null)}
                      onBlur={e => {
                        // Tabbing out of the group closes it (keyboard parity with the mouse).
                        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null))
                          setOpenGroup(null);
                      }}
                    >
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={`nav-group-${entry.id}`}
                        onClick={() => setOpenGroup(open ? null : entry.id)}
                        className={`cursor-pointer border-none bg-transparent ${topLinkClass(groupActive)}`}
                        data-testid={`nav-group-${entry.id}`}
                      >
                        {entry.label}
                        <ChevronDown
                          className={`h-3.5 w-3.5 opacity-60 transition-transform duration-200 motion-reduce:transition-none [@media(hover:hover)]:group-hover:rotate-180 ${open ? "rotate-180" : ""}`}
                          aria-hidden="true"
                        />
                      </button>
                      {/* pt-3 bridges the gap so the pointer can travel from trigger to panel without closing it.
                          First group opens rightwards, last leftwards, so neither is cut by the X clip. */}
                      <div
                        id={`nav-group-${entry.id}`}
                        className={`absolute top-full pt-3 transition-[opacity,visibility] duration-150 motion-reduce:transition-none ${entry.id === "more" ? "right-0" : "left-0"} ${open ? "visible opacity-100" : "invisible opacity-0 [@media(hover:hover)]:group-hover:visible [@media(hover:hover)]:group-hover:opacity-100"}`}
                      >
                        <div className="min-w-52 rounded-2xl bg-background p-1.5 shadow-[0_18px_44px_-14px_rgb(0_0_0/0.4)] ring-1 ring-border">
                          {entry.items.map(item =>
                            renderNavLink(
                              item,
                              panelLinkClass(isNavItemActive(item.href)),
                              `nav-link-${item.label.toLowerCase()}`,
                              () => setOpenGroup(null)
                            )
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="ml-4 flex items-center gap-1 lg:ml-5">
                <LanguageSelector
                  variant="minimal"
                  className="text-foreground/70 hover:bg-foreground/[0.07] hover:text-foreground"
                />
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={handleMyAccountClick}
                    data-testid="button-my-account"
                    aria-label={t.a11y.accessMyAccount}
                    className={`flex h-9 cursor-pointer items-center gap-2 rounded-full px-3.5 text-sm leading-none whitespace-nowrap text-foreground/70 transition-colors duration-200 hover:text-foreground ${FOCUS_RING}`}
                  >
                    <UserCircle className="h-4 w-4" aria-hidden="true" />
                    {t.nav.myAccount}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Always visible: cart (shop only), booking CTA, mobile menu button */}
          <div className="ml-auto flex items-center gap-1 lg:ml-3">
            {cartButton}
            <button
              type="button"
              onClick={() => handleNavigation("#booking", t.nav.bookNow)}
              data-testid={isDesktop ? "desktop-button-book" : "mobile-button-book"}
              aria-label={t.a11y.bookBoatNow}
              className={`flex h-11 cursor-pointer items-center rounded-full bg-cta px-[18px] text-sm leading-none font-medium whitespace-nowrap text-primary-foreground transition-[background-color,scale] duration-200 hover:bg-cta/90 dark:text-background active:scale-[0.97] motion-reduce:transition-none ${FOCUS_RING}`}
            >
              {t.nav.bookNow}
            </button>
            <button
              type="button"
              onClick={toggleMenu}
              data-testid="button-mobile-menu"
              aria-label={isOpen ? t.a11y.closeNavMenu : t.a11y.openNavMenu}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className={`flex size-11 cursor-pointer items-center justify-center rounded-full bg-foreground/[0.07] transition-colors duration-200 hover:bg-foreground/[0.12] motion-reduce:transition-none lg:hidden ${FOCUS_RING}`}
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                aria-hidden="true"
                className="size-5"
              >
                <path
                  d="M4 7.5h12"
                  className={`origin-center transition-transform duration-300 [transform-box:fill-box] motion-reduce:transition-none ${isOpen ? "translate-y-[2.5px] rotate-45" : ""}`}
                />
                <path
                  d="M4 12.5h12"
                  className={`origin-center transition-transform duration-300 [transform-box:fill-box] motion-reduce:transition-none ${isOpen ? "-translate-y-[2.5px] -rotate-45" : ""}`}
                />
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile/tablet panel: grows inside the pill (grid rows 0fr -> 1fr, no JS height measuring). */}
        <nav
          id={panelId}
          aria-label={t.a11y.mobileNavMenu}
          aria-hidden={!isOpen}
          {...inertAttr(!isOpen)}
          className={`grid transition-[grid-template-rows] duration-[450ms] ${SOFT_EASE} motion-reduce:transition-none lg:hidden ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain px-2 pb-2 pt-1">
              {desktopItems.map((entry, index) => {
                const stagger: CSSProperties = { transitionDelay: isOpen ? `${60 + index * 45}ms` : "0ms" };
                const rowMotion = `transition-[opacity,transform] duration-500 ${SOFT_EASE} motion-reduce:transition-none ${isOpen ? "translate-y-0 opacity-100" : "translate-y-2.5 opacity-0"}`;
                if (!("items" in entry)) {
                  return (
                    <div key={entry.href} style={stagger} className={rowMotion}>
                      {renderNavLink(
                        entry,
                        `${mobileRowClass} !cursor-pointer`,
                        `mobile-nav-${entry.label.toLowerCase()}`
                      )}
                    </div>
                  );
                }
                // Native <details>: no JS state, and closed links stay in the DOM for crawlers.
                return (
                  <div key={entry.id} style={stagger} className={rowMotion}>
                    <details className="group" data-testid={`mobile-nav-group-${entry.id}`}>
                      <summary
                        className={`${mobileRowClass} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
                      >
                        {entry.label}
                        <ChevronDown
                          className="h-4 w-4 text-foreground/45 transition-transform duration-200 motion-reduce:transition-none group-open:rotate-180"
                          aria-hidden="true"
                        />
                      </summary>
                      <div className="pb-1">
                        {entry.items.map(item =>
                          renderNavLink(item, mobileSubClass, `mobile-nav-${item.label.toLowerCase()}`)
                        )}
                      </div>
                    </details>
                  </div>
                );
              })}
              <div className="mt-2 flex items-center gap-1 border-t border-border pt-2">
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={handleMyAccountClick}
                    data-testid="mobile-button-my-account"
                    aria-label={t.a11y.accessMyAccount}
                    className={`flex h-11 cursor-pointer items-center gap-2 rounded-full px-3 text-[15px] font-medium text-foreground/80 transition-colors hover:bg-foreground/[0.06] hover:text-foreground ${FOCUS_RING}`}
                  >
                    <UserCircle className="h-4 w-4" aria-hidden="true" />
                    {t.nav.myAccount}
                  </button>
                )}
                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label={theme === "dark" ? t.a11y.switchToLightMode : t.a11y.switchToDarkMode}
                    className={`flex size-11 cursor-pointer items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-foreground/[0.06] hover:text-foreground ${FOCUS_RING}`}
                  >
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </button>
                  <LanguageSelector
                    variant="minimal"
                    className="min-h-11 text-foreground/80 hover:bg-foreground/[0.06] hover:text-foreground"
                  />
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
