import { ReactNode } from "react";
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
  BarChart3,
} from "lucide-react";

interface AdminLayoutProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
  adminRole: string;
  adminUsername: string;
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
];

export function AdminLayout({
  selectedTab,
  onTabChange,
  adminRole,
  adminUsername,
  onLogout,
  onExportCSV,
  onNewBooking,
  children,
}: AdminLayoutProps) {
  const tabs = [
    ...TAB_CONFIG,
    ...(adminRole === "admin" ? ADMIN_TABS : []),
    ...(adminUsername.toLowerCase() === "ivan" ? OWNER_TABS : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile optimized */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Anchor className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">CRM Costa Brava</h1>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                {adminUsername} ({adminRole === "admin" ? "Administrador" : "Empleado"})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:space-x-4">
            <Button variant="outline" onClick={onLogout} data-testid="button-logout" size="sm" className="sm:h-10">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Cerrar Sesion</span>
            </Button>
            <Button variant="outline" onClick={onExportCSV} data-testid="button-export-data" size="sm" className="hidden sm:flex sm:h-10">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={onNewBooking} data-testid="button-new-booking" size="sm" className="sm:h-10">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Nueva Reserva</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          </div>
        </div>

        {/* Navigation Tabs - Mobile optimized */}
        <div className="flex gap-2 sm:gap-4 mt-4 sm:mt-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 min-w-[44px] ${
                selectedTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-sm sm:text-base">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 sm:p-6">
        {children}
      </div>
    </div>
  );
}
