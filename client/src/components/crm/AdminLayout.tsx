import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CalendarDays,
  Users,
  TrendingUp,
  Anchor,
  LogOut,
  Download,
  Plus,
  Camera,
  Gift,
  Percent,
  Wrench,
  Package,
  AlertCircle,
  Zap,
  Settings,
  MessageSquare,
  FileText,
  MoreHorizontal,
  Search,
  Menu,
  ChevronDown,
} from "lucide-react";

interface AdminLayoutProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
  adminRole: string;
  adminUsername: string;
  allowedTabs: string[] | null; // null = full access (owner)
  tenantName?: string | null;
  tenantStatus?: string | null;
  trialEndsAt?: string | null;
  onLogout: () => void;
  onExportCSV: () => void;
  onNewBooking: () => void;
  children: ReactNode;
}

const PRIMARY_TABS = [
  { id: "dashboard", label: "Dashboard", icon: TrendingUp },
  { id: "calendar", label: "Calendario", icon: CalendarDays },
  { id: "bookings", label: "Reservas", icon: Calendar },
  { id: "inquiries", label: "Peticiones", icon: MessageSquare },
  { id: "fleet", label: "Flota", icon: Anchor },
  { id: "analytics", label: "SEO", icon: Search },
  { id: "autopilot", label: "Autopilot", icon: Zap },
];

const OVERFLOW_TABS = [
  { id: "customers", label: "Clientes", icon: Users },
  { id: "maintenance", label: "Mantenimiento", icon: Wrench },
  { id: "inventory", label: "Inventario", icon: Package },
  { id: "gallery", label: "Galeria", icon: Camera },
  { id: "blog", label: "Blog", icon: FileText },
  { id: "giftcards", label: "Regalos", icon: Gift },
  { id: "discounts", label: "Descuentos", icon: Percent },
];

const OWNER_TABS = [
  { id: "employees", label: "Usuarios", icon: Users },
  { id: "config", label: "Config", icon: Settings },
];

export function AdminLayout({
  selectedTab,
  onTabChange,
  adminRole,
  adminUsername,
  allowedTabs,
  tenantName,
  tenantStatus,
  trialEndsAt,
  onLogout,
  onExportCSV,
  onNewBooking,
  children,
}: AdminLayoutProps) {
  // Prevent indexing of CRM pages
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  // Compute trial days remaining
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const showTrialBanner = tenantStatus === "trial" && trialDaysLeft !== null;

  // Owner always has full access; non-owner users have limited tabs
  const isOwner = adminRole === "owner";
  const hasFullAccess = isOwner || allowedTabs === null;

  // Helper to check if a tab should be visible for this user
  const canSeeTab = (tabId: string) => {
    if (hasFullAccess) return true;
    return allowedTabs?.includes(tabId) ?? false;
  };

  // Filter primary tabs by permissions
  const visiblePrimaryTabs = PRIMARY_TABS.filter(t => canSeeTab(t.id));

  const overflowTabs = [
    ...OVERFLOW_TABS.filter(t => canSeeTab(t.id)),
    ...(isOwner ? OWNER_TABS : []),
  ];

  const primaryTabIds = new Set(PRIMARY_TABS.map(t => t.id));

  // State for "Mas" accordion in sidebar
  const [moreOpen, setMoreOpen] = useState(() => {
    // Auto-open if selected tab is in overflow
    return !primaryTabIds.has(selectedTab);
  });

  // State for mobile sidebar overlay
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-open "Mas" accordion when an overflow tab is selected
  useEffect(() => {
    if (!primaryTabIds.has(selectedTab)) {
      setMoreOpen(true);
    }
  }, [selectedTab]);

  // Handle tab change on mobile: also close sidebar
  const handleMobileTabChange = (tabId: string) => {
    onTabChange(tabId);
    setMobileOpen(false);
  };

  // Shared sidebar nav content (used by both desktop and mobile)
  const renderSidebarNav = (onSelect: (tabId: string) => void) => (
    <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1" role="navigation" aria-label="Menu principal">
      <div role="menu">
      {visiblePrimaryTabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          role="menuitem"
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
            selectedTab === tab.id
              ? "bg-primary text-white"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          data-testid={`tab-${tab.id}`}
        >
          <tab.icon className="w-4 h-4 flex-shrink-0" />
          <span>{tab.label}</span>
        </button>
      ))}

      {/* Separator */}
      {overflowTabs.length > 0 && <div className="border-t border-border my-2" />}

      {/* "Mas" accordion */}
      {overflowTabs.length > 0 && (
        <>
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            role="menuitem"
            aria-expanded={moreOpen}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px]"
            data-testid="tab-more"
          >
            <span className="flex items-center gap-3">
              <MoreHorizontal className="w-4 h-4 flex-shrink-0" />
              <span>Mas</span>
            </span>
            <ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
          </button>
          <div className={`grid transition-all duration-150 ${moreOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
            <div className="overflow-hidden">
              <div className="ml-2 space-y-1" role="menu">
                {overflowTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => onSelect(tab.id)}
                    role="menuitem"
                    className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                      selectedTab === tab.id
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    data-testid={`tab-${tab.id}`}
                  >
                    <tab.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
      </div>
    </nav>
  );

  // Shared sidebar footer
  const renderSidebarFooter = () => (
    <div className="border-t border-border px-4 py-3 space-y-2">
      <div className="text-xs text-muted-foreground truncate">
        {adminUsername} · {adminRole === "owner" ? "Propietario" : adminRole === "admin" ? "Administrador" : "Empleado"}
      </div>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" className="flex-1 min-h-[44px] text-xs" onClick={onNewBooking} data-testid="button-new-booking">
          <Plus className="w-3 h-3 mr-1" />
          Nueva
        </Button>
        <Button variant="outline" size="sm" className="min-h-[44px] text-xs" onClick={onExportCSV} title="Exportar CSV" data-testid="button-export-data">
          <Download className="w-3 h-3" />
        </Button>
        <Button variant="outline" size="sm" className="min-h-[44px] text-xs" onClick={onLogout} title="Cerrar sesion" data-testid="button-logout">
          <LogOut className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pt-safe">
      {/* Trial Banner — spans full width above everything */}
      {showTrialBanner && (
        <div className={`px-4 py-2 text-sm flex items-center justify-between ${
          trialDaysLeft! <= 3
            ? "bg-destructive/10 border-b border-destructive/20 text-destructive"
            : "bg-accent border-b border-accent-foreground/20 text-accent-foreground"
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              {trialDaysLeft === 0
                ? "Tu periodo de prueba ha expirado"
                : `Prueba gratuita: ${trialDaysLeft} ${trialDaysLeft === 1 ? "dia" : "dias"} restantes`}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className={`min-h-[44px] sm:min-h-0 sm:h-7 text-xs ${
              trialDaysLeft! <= 3
                ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                : "border-accent-foreground/40 text-accent-foreground hover:bg-accent"
            }`}
          >
            <Zap className="w-3 h-3 mr-1" />
            Activar plan
          </Button>
        </div>
      )}

      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1 -ml-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <span className="font-semibold text-sm text-foreground truncate">
            {tenantName || "CBRB"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px]"
            onClick={() => {
              document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
            }}
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button size="sm" className="min-h-[44px]" onClick={onNewBooking}>
            <Plus className="w-4 h-4 mr-1" />
            <span>Nueva</span>
          </Button>
        </div>
      </div>

      {/* Mobile sidebar overlay — always mounted, animated via transform */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-200 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-foreground/20"
          onClick={() => setMobileOpen(false)}
        />
        {/* Sidebar */}
        <aside
          className={`absolute inset-y-0 left-0 w-64 bg-card border-r border-border flex flex-col transition-transform duration-200 will-change-transform ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Sidebar header */}
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Anchor className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm text-foreground truncate">
                {tenantName || "Costa Brava Rent a Boat"}
              </span>
            </div>
          </div>

          {/* Nav */}
          {renderSidebarNav(handleMobileTabChange)}

          {/* Footer */}
          {renderSidebarFooter()}
        </aside>
      </div>

      <div className="flex h-[calc(100vh-var(--trial-banner-h,0px))]">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:flex-col md:w-56 bg-card border-r border-border h-full sticky top-0 flex-shrink-0">
          {/* Sidebar header */}
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Anchor className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm text-foreground truncate">
                {tenantName || "Costa Brava Rent a Boat"}
              </span>
            </div>
            <kbd
              className="mt-2 inline-flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground bg-muted rounded border border-border cursor-pointer select-none hover:bg-muted/80 transition-colors"
              onClick={() => {
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
              }}
              title="Buscar (Cmd+K)"
            >
              <span className="text-xs">&#8984;</span>K
            </kbd>
          </div>

          {/* Nav */}
          {renderSidebarNav(onTabChange)}

          {/* Footer */}
          {renderSidebarFooter()}
        </aside>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-2 sm:p-3 md:p-5 lg:p-6 pb-safe">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
