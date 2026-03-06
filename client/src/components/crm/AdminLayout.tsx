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
  BarChart3,
  AlertCircle,
  Zap,
  Settings,
  Globe,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react";

interface AdminLayoutProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
  adminRole: string;
  adminUsername: string;
  tenantName?: string | null;
  tenantStatus?: string | null;
  trialEndsAt?: string | null;
  onLogout: () => void;
  onExportCSV: () => void;
  onNewBooking: () => void;
  children: ReactNode;
}

const TAB_CONFIG = [
  { id: "dashboard", label: "Dashboard", icon: TrendingUp },
  { id: "calendar", label: "Calendario", icon: CalendarDays },
  { id: "bookings", label: "Reservas", icon: Calendar },
];

const ADMIN_TABS = [
  { id: "customers", label: "Clientes", icon: Users },
  { id: "inquiries", label: "Peticiones", icon: MessageSquare },
  { id: "fleet", label: "Flota", icon: Anchor },
  { id: "maintenance", label: "Mant.", icon: Wrench },
  { id: "inventory", label: "Inventario", icon: Package },
  { id: "reports", label: "Reportes", icon: BarChart3 },
  { id: "gallery", label: "Galeria", icon: Camera },
  { id: "giftcards", label: "Regalos", icon: Gift },
  { id: "discounts", label: "Descuentos", icon: Percent },
];

const OWNER_TABS = [
  { id: "employees", label: "Equipo", icon: Users },
  { id: "config", label: "Config", icon: Settings },
];

export function AdminLayout({
  selectedTab,
  onTabChange,
  adminRole,
  adminUsername,
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

  // Platform tab: only for legacy admin (no tenant = NauticFlow platform admin)
  const isPlatformAdmin = !tenantName && adminRole === "admin";

  const secondaryTabs = [
    ...(adminRole === "admin" || adminRole === "owner" ? ADMIN_TABS : []),
    ...(adminRole === "owner" ? OWNER_TABS : []),
    ...(isPlatformAdmin ? [{ id: "superadmin", label: "Platform", icon: Globe }] : []),
  ];

  // Build grouped secondary tabs for the new layout
  const secondaryGroups: { label: string; tabs: typeof ADMIN_TABS }[] = [];
  if (adminRole === "admin" || adminRole === "owner") {
    secondaryGroups.push({
      label: "CRM",
      tabs: [
        { id: "customers", label: "Clientes", icon: Users },
        { id: "inquiries", label: "Peticiones", icon: MessageSquare },
      ],
    });
    secondaryGroups.push({
      label: "Flota",
      tabs: [
        { id: "fleet", label: "Flota", icon: Anchor },
        { id: "maintenance", label: "Mant.", icon: Wrench },
        { id: "inventory", label: "Inventario", icon: Package },
      ],
    });
    secondaryGroups.push({
      label: "Negocio",
      tabs: [
        { id: "reports", label: "Reportes", icon: BarChart3 },
        { id: "gallery", label: "Galeria", icon: Camera },
        { id: "giftcards", label: "Regalos", icon: Gift },
        { id: "discounts", label: "Descuentos", icon: Percent },
      ],
    });
  }
  if (adminRole === "owner") {
    const ajustesTabs: typeof ADMIN_TABS = [
      { id: "employees", label: "Equipo", icon: Users },
      { id: "config", label: "Config", icon: Settings },
    ];
    if (isPlatformAdmin) {
      ajustesTabs.push({ id: "superadmin", label: "Platform", icon: Globe });
    }
    secondaryGroups.push({ label: "Ajustes", tabs: ajustesTabs });
  } else if (isPlatformAdmin) {
    secondaryGroups.push({
      label: "Ajustes",
      tabs: [{ id: "superadmin", label: "Platform", icon: Globe }],
    });
  }

  // State for mobile popover
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
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
            className={`h-7 text-xs ${
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
                {isPlatformAdmin ? "NauticFlow" : (tenantName || "NauticFlow CRM")}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                {adminUsername} · {isPlatformAdmin ? "Admin de Plataforma" : adminRole === "owner" ? "Propietario" : adminRole === "admin" ? "Administrador" : "Empleado"}
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
            <Button variant="outline" onClick={onLogout} data-testid="button-logout" size="sm" className="md:h-10">
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Cerrar Sesion</span>
            </Button>
            <Button variant="outline" onClick={onExportCSV} data-testid="button-export-data" size="sm" className="hidden md:flex md:h-10">
              <Download className="w-4 h-4 mr-2" />
              Exportar
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
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 min-w-[44px] ${
                selectedTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="w-4 h-4 md:w-4 md:h-4" />
              <span className="hidden md:inline text-sm">{tab.label}</span>
            </button>
          ))}

          {/* Mobile: "Mas" popover for secondary tabs */}
          {secondaryTabs.length > 0 && (
            <div className="flex md:hidden flex-shrink-0">
              <Popover open={moreOpen} onOpenChange={setMoreOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={`flex items-center justify-center gap-1 px-3 py-2 font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 min-w-[44px] ${
                      !TAB_CONFIG.some((t) => t.id === selectedTab)
                        ? 'bg-primary/20 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    data-testid="tab-more"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                    <span className="text-xs">Mas</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="end">
                  {secondaryGroups.map((group) => (
                    <div key={group.label} className="mb-2 last:mb-0">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-2 font-medium">
                        {group.label}
                      </span>
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        {group.tabs.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => {
                              onTabChange(tab.id);
                              setMoreOpen(false);
                            }}
                            className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors w-full text-left ${
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
                    </div>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Secondary tabs — desktop grouped layout */}
        {secondaryGroups.length > 0 && (
          <div className="hidden md:flex flex-wrap items-end gap-x-4 gap-y-1 mt-2">
            {secondaryGroups.map((group) => (
              <div key={group.label} className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-3 font-medium">
                  {group.label}
                </span>
                <div className="flex gap-1">
                  {group.tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 min-w-[44px] ${
                        selectedTab === tab.id
                          ? 'bg-primary text-white'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      data-testid={`tab-${tab.id}`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="text-xs md:text-sm">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 md:p-5 lg:p-6">
        {children}
      </div>
    </div>
  );
}
