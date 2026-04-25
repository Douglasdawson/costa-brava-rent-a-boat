import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
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

  // State for mobile popover
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pt-safe">
      {/* Trial Banner */}
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
                : `Prueba gratuita: ${trialDaysLeft} ${trialDaysLeft === 1 ? "día" : "días"} restantes`}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className={`h-10 sm:h-7 text-xs ${
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

      {/* Header */}
      <div className="bg-card border-b border-border px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2 md:space-x-3">
            <Anchor className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            <div>
              <h1 className="text-lg md:text-2xl font-bold font-heading text-foreground">
                {tenantName || "Costa Brava Rent a Boat"}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground block truncate max-w-[120px] md:max-w-none">
                {adminUsername} · {adminRole === "owner" ? "Propietario" : adminRole === "admin" ? "Administrador" : "Empleado"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <kbd
              className="hidden md:inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground bg-muted rounded border border-border cursor-pointer select-none hover:bg-muted/80 transition-colors"
              onClick={() => {
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
              }}
              title="Buscar (Cmd+K)"
            >
              <span className="text-xs">&#8984;</span>K
            </kbd>
            <Button
              variant="outline"
              size="sm"
              className="md:hidden"
              onClick={() => {
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
              }}
              title="Buscar"
            >
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={onLogout} data-testid="button-logout" size="sm" className="md:h-10">
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Cerrar Sesión</span>
            </Button>
            <Button variant="outline" onClick={onExportCSV} data-testid="button-export-data" size="sm" className="md:h-10">
              <Download className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Exportar</span>
            </Button>
            <Button onClick={onNewBooking} data-testid="button-new-booking" size="sm" className="md:h-10">
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Nueva Reserva</span>
              <span className="md:hidden">Nueva</span>
            </Button>
          </div>
        </div>

        {/* Primary tabs row — Dashboard, Calendario, Reservas */}
        <div className="flex gap-1 md:gap-2 mt-4 md:mt-5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          {visiblePrimaryTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 min-w-[44px] min-h-[44px] ${
                selectedTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="w-4 h-4 md:w-4 md:h-4" />
              <span className="text-xs sm:text-sm">{tab.label}</span>
            </button>
          ))}

          {/* Mobile: "Mas" popover for overflow tabs */}
          {overflowTabs.length > 0 && (
            <div className="flex md:hidden flex-shrink-0">
              <Popover open={moreOpen} onOpenChange={setMoreOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={`flex items-center justify-center gap-1 px-3 py-2 font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 min-w-[44px] min-h-[44px] ${
                      !primaryTabIds.has(selectedTab)
                        ? 'bg-primary/20 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    data-testid="tab-more"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                    <span className="text-xs">
                      {!primaryTabIds.has(selectedTab)
                        ? overflowTabs.find(t => t.id === selectedTab)?.label || "Mas"
                        : "Mas"}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(256px,calc(100vw-2rem))] p-2" align="end">
                  <div className="flex flex-col gap-0.5">
                    {overflowTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          onTabChange(tab.id);
                          setMoreOpen(false);
                        }}
                        className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors w-full text-left min-h-[44px] ${
                          selectedTab === tab.id
                            ? 'bg-primary text-white'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                        data-testid={`tab-${tab.id}`}
                      >
                        <tab.icon className="w-4 h-4 flex-shrink-0" />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Desktop: "Mas" overflow popover */}
        {overflowTabs.length > 0 && (
          <div className="hidden md:flex mt-2">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap min-w-[44px] ${
                    !primaryTabIds.has(selectedTab)
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                  <span className="text-sm">
                    {!primaryTabIds.has(selectedTab)
                      ? overflowTabs.find(t => t.id === selectedTab)?.label || "Mas"
                      : "Mas"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="flex flex-col gap-0.5">
                  {overflowTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
                      className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors w-full text-left min-h-[44px] ${
                        selectedTab === tab.id
                          ? 'bg-primary text-white'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      data-testid={`tab-${tab.id}`}
                    >
                      <tab.icon className="w-4 h-4 flex-shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      <div className="p-2 sm:p-3 md:p-5 lg:p-6 pb-safe">
        {children}
      </div>
    </div>
  );
}
