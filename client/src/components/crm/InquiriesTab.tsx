import { useState, useCallback, useEffect } from "react";
import { EmptyState } from "./shared/EmptyState";
import { ErrorState } from "./shared/ErrorState";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search,
  Eye,
  Phone,
  Mail,
  Clock,
  Users,
  Ship,
  StickyNote,
  CalendarDays,
  Timer,
  Tag,
  Gift,
  Globe,
  Monitor,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { WhatsappInquiry, Booking } from "@shared/schema";
import { PaginationControls } from "./shared/PaginationControls";
import type { PaginatedResponse } from "./types";
import { BookingDetailsModal } from "./BookingDetailsModal";
import { calculatePricingBreakdown, type Duration } from "@shared/pricing";
import { parseMadridLocal } from "@/lib/madridTz";

type PaginatedInquiriesResponse = PaginatedResponse<WhatsappInquiry>;

const ITEMS_PER_PAGE = 25;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-800" },
  contacted: { label: "Contactado", color: "bg-blue-100 text-blue-800" },
  converted: { label: "Convertido", color: "bg-emerald-100 text-emerald-800" },
  lost: { label: "Perdido", color: "bg-red-100 text-red-800" },
};

const VALID_DURATIONS: Duration[] = ["1h", "2h", "3h", "4h", "6h", "8h"];

// Builds the BookingDetailsModal prefill payload from a WhatsApp inquiry.
// Parses text date/time into ISO timestamps and pre-calculates pricing via the
// shared pricing helper so the admin only has to fill the customer nationality.
function buildPrefillFromInquiry(inq: WhatsappInquiry) {
  // Parse bookingDate (YYYY-MM-DD) + preferredTime (HH:MM, defaults to 10:00)
  const timeStr = (inq.preferredTime && /^\d{1,2}:\d{2}$/.test(inq.preferredTime))
    ? inq.preferredTime.padStart(5, "0")
    : "10:00";
  const startDate = parseMadridLocal(`${inq.bookingDate}T${timeStr}:00`);
  // If date parsing failed (invalid format), fall back to today at 10:00 Madrid
  const safeStart = isNaN(startDate.getTime())
    ? parseMadridLocal(new Date().toISOString().slice(0, 10) + "T10:00:00")
    : startDate;

  // Parse duration ("4h" → "4h" Duration; fallback to "2h")
  const rawDuration = (inq.duration || "").toLowerCase().trim();
  const duration: Duration = VALID_DURATIONS.includes(rawDuration as Duration)
    ? (rawDuration as Duration)
    : "2h";
  const totalHours = parseInt(duration.replace("h", ""), 10);
  const endDate = new Date(safeStart.getTime() + totalHours * 60 * 60 * 1000);

  // Pre-calculate pricing (may throw if boat id is unknown — fall back to zeros)
  let subtotal = "0";
  let extrasTotal = "0";
  let deposit = "0";
  let totalAmount = "0";
  try {
    const extras = Array.isArray(inq.extras) ? (inq.extras as string[]) : [];
    const packs = inq.packId ? [inq.packId] : [];
    const pricing = calculatePricingBreakdown(inq.boatId, safeStart, duration, extras, packs);
    subtotal = String(pricing.basePrice);
    extrasTotal = String(pricing.extrasPrice);
    deposit = String(pricing.deposit);
    totalAmount = String(pricing.subtotal); // base + extras (no deposit) as the charge
  } catch {
    // Unknown boat or pricing error — admin will enter manually
  }

  const receivedDate = inq.createdAt
    ? new Date(inq.createdAt).toLocaleDateString("es-ES")
    : "";
  const notes = `Convertido desde petición WhatsApp #${inq.id}${receivedDate ? ` recibida el ${receivedDate}` : ""}.`;

  return {
    boatId: inq.boatId,
    startTime: safeStart.toISOString(),
    endTime: endDate.toISOString(),
    totalHours,
    customerName: inq.firstName,
    customerSurname: inq.lastName,
    customerPhone: `${inq.phonePrefix}${inq.phoneNumber}`.replace(/\s+/g, ""),
    customerEmail: inq.email ?? "",
    numberOfPeople: inq.numberOfPeople,
    subtotal,
    extrasTotal,
    deposit,
    totalAmount,
    notes,
  };
}

interface InquiriesTabProps {
  adminToken: string;
  onOpenWhatsApp: (phone: string, name: string) => void;
}

export function InquiriesTab({ adminToken, onOpenWhatsApp }: InquiriesTabProps) {
  const { searchQuery, debouncedSearch, handleSearchChange } = useDebounceSearch(400);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [detailInquiry, setDetailInquiry] = useState<WhatsappInquiry | null>(null);
  const [deleteInquiryId, setDeleteInquiryId] = useState<string | null>(null);
  const [convertingInquiry, setConvertingInquiry] = useState<WhatsappInquiry | null>(null);

  const queryClient = useQueryClient();

  // Reset page on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const { data: response, isLoading, error } = useQuery<PaginatedInquiriesResponse>({
    queryKey: ['/api/admin/booking-inquiries', currentPage, debouncedSearch, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/booking-inquiries?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al cargar peticiones");
      return res.json();
    },
  });

  const updateInquiry = useCallback(async (id: string, data: { status?: string; notes?: string | null }) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/booking-inquiries/${id}`, {
        method: 'PATCH',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/booking-inquiries'] });
      }
    } finally {
      setUpdatingId(null);
    }
  }, [adminToken, queryClient]);

  // Intercept status changes: if the new status is "converted", open the booking
  // creation modal prefilled from the inquiry instead of PATCHing immediately.
  // The PATCH only fires after the booking is successfully created.
  const handleStatusChange = useCallback((inq: WhatsappInquiry, newStatus: string) => {
    if (newStatus === "converted") {
      if (inq.status === "converted") return; // no-op if already converted
      setConvertingInquiry(inq);
      return;
    }
    updateInquiry(inq.id, { status: newStatus });
  }, [updateInquiry]);

  const executeDeleteInquiry = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/booking-inquiries/${id}`, {
        method: 'DELETE',
        credentials: "include",
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/booking-inquiries'] });
      }
    } catch {
      // Silent fail
    }
  }, [adminToken, queryClient]);

  const inquiries = response?.data || [];
  const totalPages = response?.totalPages || 1;
  const total = response?.total || 0;

  const formatDate = (dateStr: string | Date): string => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy, HH:mm", { locale: es });
    } catch {
      return String(dateStr);
    }
  };

  const formatBookingDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading text-foreground">Peticiones de WhatsApp</h2>
          <p className="text-sm text-muted-foreground">{total} peticiones en total</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
              <Input
                placeholder="Buscar por nombre, email, teléfono, barco..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full md:w-48 h-10">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="contacted">Contactado</SelectItem>
                <SelectItem value="converted">Convertido</SelectItem>
                <SelectItem value="lost">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading / Error / Empty */}
      {isLoading && (
        <Card><CardContent className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent></Card>
      )}

      {error && (
        <ErrorState message="Error al cargar peticiones" />
      )}

      {!isLoading && !error && inquiries.length === 0 && (
        <Card><CardContent>
          <EmptyState
            icon={MessageSquare}
            title="No hay peticiones"
            description="Las peticiones de WhatsApp aparecerán aquí"
          />
        </CardContent></Card>
      )}

      {/* Desktop Table */}
      {!isLoading && !error && inquiries.length > 0 && (
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Barco</TableHead>
                  <TableHead>Reserva</TableHead>
                  <TableHead>Total est.</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((inq) => {
                  const statusConf = STATUS_CONFIG[inq.status] || STATUS_CONFIG.pending;
                  return (
                    <TableRow key={inq.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(inq.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{inq.firstName} {inq.lastName}</div>
                        {inq.language && <span className="text-xs text-muted-foreground/70 uppercase">{inq.language}</span>}
                      </TableCell>
                      <TableCell className="text-xs">
                        <a href={`tel:${inq.phonePrefix}${inq.phoneNumber}`} className="flex items-center gap-1 hover:text-blue-600 transition-colors"><Phone className="w-3 h-3" />{inq.phonePrefix} {inq.phoneNumber}</a>
                        {inq.email && <a href={`mailto:${inq.email}`} className="flex items-center gap-1 text-muted-foreground hover:text-blue-600 transition-colors"><Mail className="w-3 h-3" />{inq.email}</a>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm"><Ship className="w-3 h-3" />{inq.boatName}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{formatBookingDate(inq.bookingDate)}</div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />{inq.preferredTime || '-'} · {inq.duration}
                        </div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" />{inq.numberOfPeople} pers.
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {inq.estimatedTotal ? `\u20AC${inq.estimatedTotal}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={inq.status}
                          onValueChange={(v) => handleStatusChange(inq, v)}
                          disabled={updatingId === inq.id}
                        >
                          <SelectTrigger className="h-7 w-32 text-xs p-1">
                            <Badge className={`${statusConf.color} text-xs font-medium border-0`}>
                              {statusConf.label}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="contacted">Contactado</SelectItem>
                            <SelectItem value="converted">Convertido</SelectItem>
                            <SelectItem value="lost">Perdido</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setDetailInquiry(inq)}
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => onOpenWhatsApp(`${inq.phonePrefix}${inq.phoneNumber}`, `${inq.firstName} ${inq.lastName}`)}
                            title="Abrir WhatsApp"
                          >
                            <SiWhatsapp className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              if (editingNotes === inq.id) {
                                updateInquiry(inq.id, { notes: notesValue || null });
                                setEditingNotes(null);
                              } else {
                                setEditingNotes(inq.id);
                                setNotesValue(inq.notes || "");
                              }
                            }}
                            title="Notas"
                          >
                            <StickyNote className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setDeleteInquiryId(inq.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                        {editingNotes === inq.id && (
                          <div className="mt-2 flex gap-1">
                            <Input
                              value={notesValue}
                              onChange={(e) => setNotesValue(e.target.value)}
                              placeholder="Notas..."
                              className="h-7 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateInquiry(inq.id, { notes: notesValue || null });
                                  setEditingNotes(null);
                                }
                                if (e.key === 'Escape') setEditingNotes(null);
                              }}
                              autoFocus
                            />
                          </div>
                        )}
                        {!editingNotes && inq.notes && (
                          <div className="text-xs text-muted-foreground/70 mt-1 max-w-[150px] truncate" title={inq.notes}>
                            {inq.notes}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Mobile Cards */}
      {!isLoading && !error && inquiries.length > 0 && (
        <div className="md:hidden space-y-3">
          {inquiries.map((inq) => {
            const statusConf = STATUS_CONFIG[inq.status] || STATUS_CONFIG.pending;
            return (
              <Card key={inq.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{inq.firstName} {inq.lastName}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(inq.createdAt)}</div>
                    </div>
                    <Badge className={`${statusConf.color} text-xs border-0`}>
                      {statusConf.label}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><Ship className="w-3 h-3 inline mr-1" />{inq.boatName}</div>
                    <div><Clock className="w-3 h-3 inline mr-1" />{inq.preferredTime || '-'} · {inq.duration}</div>
                    <div>{formatBookingDate(inq.bookingDate)}</div>
                    <div><Users className="w-3 h-3 inline mr-1" />{inq.numberOfPeople} pers.</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <a href={`tel:${inq.phonePrefix}${inq.phoneNumber}`} className="block hover:text-blue-600 transition-colors"><Phone className="w-3 h-3 inline mr-1" />{inq.phonePrefix} {inq.phoneNumber}</a>
                    {inq.email && <a href={`mailto:${inq.email}`} className="block hover:text-blue-600 transition-colors"><Mail className="w-3 h-3 inline mr-1" />{inq.email}</a>}
                  </div>
                  {inq.estimatedTotal && (
                    <div className="text-sm font-semibold">{"\u20AC"}{inq.estimatedTotal}</div>
                  )}
                  <div className="flex items-center gap-2">
                    <Select value={inq.status} onValueChange={(v) => handleStatusChange(inq, v)}>
                      <SelectTrigger className="h-10 sm:h-8 text-xs flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="contacted">Contactado</SelectItem>
                        <SelectItem value="converted">Convertido</SelectItem>
                        <SelectItem value="lost">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => setDetailInquiry(inq)}
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => onOpenWhatsApp(`${inq.phonePrefix}${inq.phoneNumber}`, `${inq.firstName} ${inq.lastName}`)}
                      title="Abrir WhatsApp"
                    >
                      <SiWhatsapp className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => setDeleteInquiryId(inq.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        if (editingNotes === inq.id) {
                          updateInquiry(inq.id, { notes: notesValue || null });
                          setEditingNotes(null);
                        } else {
                          setEditingNotes(inq.id);
                          setNotesValue(inq.notes || "");
                        }
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {editingNotes === inq.id ? "Guardar notas" : inq.notes ? "Editar notas" : "Agregar notas"}
                    </button>
                    {editingNotes === inq.id && (
                      <Input
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        placeholder="Notas..."
                        className="h-8 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateInquiry(inq.id, { notes: notesValue || null });
                            setEditingNotes(null);
                          }
                          if (e.key === 'Escape') setEditingNotes(null);
                        }}
                        autoFocus
                      />
                    )}
                    {editingNotes !== inq.id && inq.notes && (
                      <div className="text-xs text-muted-foreground/70">{inq.notes}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!detailInquiry} onOpenChange={(open) => { if (!open) setDetailInquiry(null); }}>
        <DialogContent className="w-full h-[100dvh] md:h-auto md:max-h-[85vh] max-w-none md:max-w-lg rounded-none md:rounded-lg overflow-y-auto">
          {detailInquiry && (() => {
            const inq = detailInquiry;
            const statusConf = STATUS_CONFIG[inq.status] || STATUS_CONFIG.pending;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between pr-6">
                    <span>Detalle de Petición</span>
                    <Badge className={`${statusConf.color} text-xs border-0`}>{statusConf.label}</Badge>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Cliente */}
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <h4 className="font-medium text-xs text-foreground/80 uppercase tracking-wide">Cliente</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Nombre:</span> {inq.firstName} {inq.lastName}</div>
                      <div className="flex items-center gap-1"><Globe className="w-3 h-3 text-muted-foreground/70" />{inq.language?.toUpperCase()}</div>
                      <a href={`tel:${inq.phonePrefix}${inq.phoneNumber}`} className="flex items-center gap-1 hover:text-blue-600 transition-colors"><Phone className="w-3 h-3 text-muted-foreground/70" />{inq.phonePrefix} {inq.phoneNumber}</a>
                      {inq.email ? <a href={`mailto:${inq.email}`} className="flex items-center gap-1 hover:text-blue-600 transition-colors"><Mail className="w-3 h-3 text-muted-foreground/70" />{inq.email}</a> : <div className="flex items-center gap-1"><Mail className="w-3 h-3 text-muted-foreground/70" />-</div>}
                    </div>
                  </div>

                  {/* Reserva */}
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <h4 className="font-medium text-xs text-foreground/80 uppercase tracking-wide">Reserva</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1"><Ship className="w-3 h-3 text-muted-foreground/70" />{inq.boatName}</div>
                      <div className="flex items-center gap-1"><CalendarDays className="w-3 h-3 text-muted-foreground/70" />{formatBookingDate(inq.bookingDate)}</div>
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-muted-foreground/70" />{inq.preferredTime || '-'}</div>
                      <div className="flex items-center gap-1"><Timer className="w-3 h-3 text-muted-foreground/70" />{inq.duration}</div>
                      <div className="flex items-center gap-1"><Users className="w-3 h-3 text-muted-foreground/70" />{inq.numberOfPeople} personas</div>
                      <div className="flex items-center gap-1"><Monitor className="w-3 h-3 text-muted-foreground/70" />{inq.source}</div>
                    </div>
                  </div>

                  {/* Extras & Pack */}
                  {((inq.extras && (inq.extras as string[]).length > 0) || inq.packId) && (
                    <div className="bg-muted rounded-lg p-4 space-y-2">
                      <h4 className="font-medium text-xs text-foreground/80 uppercase tracking-wide">Extras y Packs</h4>
                      {inq.packId && (
                        <div className="flex items-center gap-1 text-sm"><Gift className="w-3 h-3 text-muted-foreground/70" />Pack: {inq.packId}</div>
                      )}
                      {inq.extras && (inq.extras as string[]).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {(inq.extras as string[]).map((extra) => (
                            <Badge key={extra} variant="outline" className="text-xs">{extra}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Precio y Código */}
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <h4 className="font-medium text-xs text-foreground/80 uppercase tracking-wide">Precio</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-lg font-bold tabular-nums">{inq.estimatedTotal ? `\u20AC${inq.estimatedTotal}` : 'No calculado'}</div>
                      {inq.couponCode && (
                        <div className="flex items-center gap-1"><Tag className="w-3 h-3 text-muted-foreground/70" />Código: {inq.couponCode}</div>
                      )}
                    </div>
                  </div>

                  {/* Notas */}
                  {inq.notes && (
                    <div className="bg-accent rounded-lg p-4 space-y-1">
                      <h4 className="font-medium text-xs text-accent-foreground uppercase tracking-wide">Notas</h4>
                      <p className="text-sm">{inq.notes}</p>
                    </div>
                  )}

                  {/* Fecha de creación */}
                  <div className="text-xs text-muted-foreground/70 text-right">
                    Recibido: {formatDate(inq.createdAt)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        onOpenWhatsApp(`${inq.phonePrefix}${inq.phoneNumber}`, `${inq.firstName} ${inq.lastName}`);
                        setDetailInquiry(null);
                      }}
                    >
                      <SiWhatsapp className="w-4 h-4 mr-2 text-green-600" />
                      Abrir WhatsApp
                    </Button>
                    <Select
                      value={inq.status}
                      onValueChange={(v) => {
                        handleStatusChange(inq, v);
                        if (v !== "converted") {
                          setDetailInquiry({ ...inq, status: v });
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="contacted">Contactado</SelectItem>
                        <SelectItem value="converted">Convertido</SelectItem>
                        <SelectItem value="lost">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <AlertDialog open={!!deleteInquiryId} onOpenChange={(open) => !open && setDeleteInquiryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar petición</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar esta petición? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { executeDeleteInquiry(deleteInquiryId!); setDeleteInquiryId(null); }}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Booking creation modal — opened when admin marks an inquiry as "convertido" */}
      {convertingInquiry && (
        <BookingDetailsModal
          open={!!convertingInquiry}
          onOpenChange={(open) => { if (!open) setConvertingInquiry(null); }}
          booking={null}
          isEditing={false}
          isCreating={true}
          prefillData={buildPrefillFromInquiry(convertingInquiry)}
          adminToken={adminToken}
          onEditStart={() => {}}
          onEditCancel={() => setConvertingInquiry(null)}
          onOpenWhatsApp={onOpenWhatsApp}
          onCreateSuccess={(_createdBooking: Booking) => {
            const inq = convertingInquiry;
            if (inq) {
              updateInquiry(inq.id, { status: "converted" });
              if (detailInquiry?.id === inq.id) {
                setDetailInquiry({ ...inq, status: "converted" });
              }
            }
            setConvertingInquiry(null);
          }}
        />
      )}
    </div>
  );
}
