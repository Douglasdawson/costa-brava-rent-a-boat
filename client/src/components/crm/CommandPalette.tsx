import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  TrendingUp,
  CalendarDays,
  Calendar,
  Users,
  MessageSquare,
  Anchor,
  Wrench,
  Package,
  BarChart3,
  Camera,
  Gift,
  Percent,
  Settings,
  Plus,
  Download,
  LogOut,
  Search,
  FileText,
  UserCog,
} from "lucide-react";

interface CommandPaletteProps {
  onNavigate: (tab: string) => void;
  onNewBooking: () => void;
  onExportCSV: () => void;
  onLogout: () => void;
}

const NAVIGATION_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: TrendingUp, keywords: ["inicio", "resumen", "home"] },
  { id: "calendar", label: "Calendario", icon: CalendarDays, keywords: ["fecha", "dia", "agenda"] },
  { id: "bookings", label: "Reservas", icon: Calendar, keywords: ["booking", "alquiler", "rental"] },
  { id: "customers", label: "Clientes", icon: Users, keywords: ["cliente", "customer", "contacto"] },
  { id: "inquiries", label: "Peticiones", icon: MessageSquare, keywords: ["peticion", "consulta", "solicitud"] },
  { id: "fleet", label: "Flota", icon: Anchor, keywords: ["barco", "boat", "embarcacion"] },
  { id: "maintenance", label: "Mantenimiento", icon: Wrench, keywords: ["reparacion", "revision"] },
  { id: "inventory", label: "Inventario", icon: Package, keywords: ["stock", "material", "equipo"] },
  { id: "reports", label: "Reportes", icon: BarChart3, keywords: ["informe", "estadistica", "analytics"] },
  { id: "analytics", label: "SEO Analytics", icon: Search, keywords: ["seo", "analytics", "google", "busqueda", "trafico"] },
  { id: "seo", label: "SEO Engine", icon: Search, keywords: ["seo", "engine", "motor", "keywords", "competidores"] },
  { id: "gallery", label: "Galería", icon: Camera, keywords: ["foto", "imagen", "photo"] },
  { id: "blog", label: "Blog", icon: FileText, keywords: ["articulo", "post", "contenido", "publicacion"] },
  { id: "giftcards", label: "Tarjetas Regalo", icon: Gift, keywords: ["regalo", "gift", "voucher"] },
  { id: "discounts", label: "Descuentos", icon: Percent, keywords: ["descuento", "cupon", "oferta", "promocion"] },
  { id: "employees", label: "Usuarios", icon: UserCog, keywords: ["empleado", "usuario", "staff", "acceso"] },
  { id: "config", label: "Configuración", icon: Settings, keywords: ["ajustes", "settings", "preferencias"] },
];

export function CommandPalette({ onNavigate, onNewBooking, onExportCSV, onLogout }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar página o acción..." />
      <CommandList>
        <CommandEmpty>No se encontraron resultados.</CommandEmpty>

        <CommandGroup heading="Navegación">
          {NAVIGATION_ITEMS.map((item) => (
            <CommandItem
              key={item.id}
              value={`${item.label} ${item.keywords.join(" ")}`}
              onSelect={() => handleSelect(() => onNavigate(item.id))}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Acciones">
          <CommandItem
            value="Nueva Reserva crear booking"
            onSelect={() => handleSelect(onNewBooking)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Reserva
          </CommandItem>
          <CommandItem
            value="Exportar CSV descargar datos"
            onSelect={() => handleSelect(onExportCSV)}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </CommandItem>
          <CommandItem
            value="Cerrar Sesión logout salir"
            onSelect={() => handleSelect(onLogout)}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
