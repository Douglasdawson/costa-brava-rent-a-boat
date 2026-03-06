import { useState, useCallback, useRef, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
  Loader2,
  Send,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { WhatsappInquiry } from "@shared/schema";

interface PaginatedInquiriesResponse {
  data: WhatsappInquiry[];
  total: number;
  page: number;
  totalPages: number;
}

const ITEMS_PER_PAGE = 25;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-800" },
  contacted: { label: "Contactado", color: "bg-blue-100 text-blue-800" },
  converted: { label: "Convertido", color: "bg-green-100 text-green-800" },
  lost: { label: "Perdido", color: "bg-red-100 text-red-800" },
};

interface InquiriesTabProps {
  adminToken: string;
  onOpenWhatsApp: (phone: string, name: string) => void;
}

export function InquiriesTab({ adminToken, onOpenWhatsApp }: InquiriesTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [detailInquiry, setDetailInquiry] = useState<WhatsappInquiry | null>(null);
  const [sendingWhatsApp, setSendingWhatsApp] = useState<WhatsappInquiry | null>(null);
  const [whatsAppMessage, setWhatsAppMessage] = useState("");
  const [sendingInProgress, setSendingInProgress] = useState(false);
  const [sendResult, setSendResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  // Debounce search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery]);

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
        headers: { 'Authorization': `Bearer ${adminToken}` },
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
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

  const sendWhatsAppViaAPI = useCallback(async () => {
    if (!sendingWhatsApp || !whatsAppMessage.trim()) return;
    setSendingInProgress(true);
    setSendResult(null);
    try {
      const res = await fetch(`/api/admin/booking-inquiries/${sendingWhatsApp.id}/send-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ message: whatsAppMessage.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSendResult({ type: "success", message: "Mensaje enviado correctamente" });
        setWhatsAppMessage("");
        queryClient.invalidateQueries({ queryKey: ['/api/admin/booking-inquiries'] });
        setTimeout(() => {
          setSendingWhatsApp(null);
          setSendResult(null);
        }, 2000);
      } else {
        setSendResult({ type: "error", message: data.message || "Error al enviar" });
      }
    } catch {
      setSendResult({ type: "error", message: "Error de conexion" });
    } finally {
      setSendingInProgress(false);
    }
  }, [sendingWhatsApp, whatsAppMessage, adminToken, queryClient]);

  const deleteInquiry = useCallback(async (id: string) => {
    if (!confirm("¿Eliminar esta petición? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/admin/booking-inquiries/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` },
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
          <h2 className="text-xl font-heading font-bold text-foreground">Peticiones de WhatsApp</h2>
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
                placeholder="Buscar por nombre, email, telefono, barco..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Cargando peticiones...
        </CardContent></Card>
      )}

      {error && (
        <Card><CardContent className="py-12 text-center text-red-500">
          Error al cargar las peticiones
        </CardContent></Card>
      )}

      {!isLoading && !error && inquiries.length === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          No se encontraron peticiones
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
                        {inq.estimatedTotal ? `${inq.estimatedTotal}€` : '-'}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={inq.status}
                          onValueChange={(v) => updateInquiry(inq.id, { status: v })}
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
                            onClick={() => {
                              setSendingWhatsApp(inq);
                              setWhatsAppMessage("");
                              setSendResult(null);
                            }}
                            title="Enviar WhatsApp"
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
                            onClick={() => deleteInquiry(inq.id)}
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
                    <div className="text-sm font-semibold">{inq.estimatedTotal}€</div>
                  )}
                  <div className="flex items-center gap-2">
                    <Select value={inq.status} onValueChange={(v) => updateInquiry(inq.id, { status: v })}>
                      <SelectTrigger className="h-8 text-xs flex-1">
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
                      onClick={() => {
                        setSendingWhatsApp(inq);
                        setWhatsAppMessage("");
                        setSendResult(null);
                      }}
                    >
                      <SiWhatsapp className="w-4 h-4 text-green-600" />
                    </Button>
                  </div>
                  {inq.notes && <div className="text-xs text-muted-foreground/70">{inq.notes}</div>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!detailInquiry} onOpenChange={(open) => { if (!open) setDetailInquiry(null); }}>
        <DialogContent className="max-w-lg">
          {detailInquiry && (() => {
            const inq = detailInquiry;
            const statusConf = STATUS_CONFIG[inq.status] || STATUS_CONFIG.pending;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between pr-6">
                    <span>Detalle de Peticion</span>
                    <Badge className={`${statusConf.color} text-xs border-0`}>{statusConf.label}</Badge>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Cliente */}
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <h4 className="font-heading font-semibold text-sm text-foreground/80 uppercase tracking-wide">Cliente</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Nombre:</span> {inq.firstName} {inq.lastName}</div>
                      <div className="flex items-center gap-1"><Globe className="w-3 h-3 text-muted-foreground/70" />{inq.language?.toUpperCase()}</div>
                      <a href={`tel:${inq.phonePrefix}${inq.phoneNumber}`} className="flex items-center gap-1 hover:text-blue-600 transition-colors"><Phone className="w-3 h-3 text-muted-foreground/70" />{inq.phonePrefix} {inq.phoneNumber}</a>
                      {inq.email ? <a href={`mailto:${inq.email}`} className="flex items-center gap-1 hover:text-blue-600 transition-colors"><Mail className="w-3 h-3 text-muted-foreground/70" />{inq.email}</a> : <div className="flex items-center gap-1"><Mail className="w-3 h-3 text-muted-foreground/70" />-</div>}
                    </div>
                  </div>

                  {/* Reserva */}
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <h4 className="font-heading font-semibold text-sm text-foreground/80 uppercase tracking-wide">Reserva</h4>
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
                      <h4 className="font-heading font-semibold text-sm text-foreground/80 uppercase tracking-wide">Extras y Packs</h4>
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

                  {/* Precio y Codigo */}
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <h4 className="font-heading font-semibold text-sm text-foreground/80 uppercase tracking-wide">Precio</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-lg font-bold">{inq.estimatedTotal ? `${inq.estimatedTotal}€` : 'No calculado'}</div>
                      {inq.couponCode && (
                        <div className="flex items-center gap-1"><Tag className="w-3 h-3 text-muted-foreground/70" />Codigo: {inq.couponCode}</div>
                      )}
                    </div>
                  </div>

                  {/* Notas */}
                  {inq.notes && (
                    <div className="bg-accent rounded-lg p-4 space-y-1">
                      <h4 className="font-heading font-semibold text-sm text-accent-foreground uppercase tracking-wide">Notas</h4>
                      <p className="text-sm">{inq.notes}</p>
                    </div>
                  )}

                  {/* Fecha de creacion */}
                  <div className="text-xs text-muted-foreground/70 text-right">
                    Recibido: {formatDate(inq.createdAt)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setDetailInquiry(null);
                        setSendingWhatsApp(inq);
                        setWhatsAppMessage("");
                        setSendResult(null);
                      }}
                    >
                      <SiWhatsapp className="w-4 h-4 mr-2 text-green-600" />
                      Enviar WhatsApp
                    </Button>
                    <Select
                      value={inq.status}
                      onValueChange={(v) => {
                        updateInquiry(inq.id, { status: v });
                        setDetailInquiry({ ...inq, status: v });
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

      {/* WhatsApp Send Dialog */}
      <Dialog open={!!sendingWhatsApp} onOpenChange={(open) => { if (!open) { setSendingWhatsApp(null); setSendResult(null); } }}>
        <DialogContent className="max-w-md">
          {sendingWhatsApp && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <SiWhatsapp className="w-5 h-5 text-green-600" />
                  Enviar WhatsApp
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                  <div className="font-medium">{sendingWhatsApp.firstName} {sendingWhatsApp.lastName}</div>
                  <div className="text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {sendingWhatsApp.phonePrefix} {sendingWhatsApp.phoneNumber}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1">
                    <Ship className="w-3 h-3" />
                    {sendingWhatsApp.boatName} · {formatBookingDate(sendingWhatsApp.bookingDate)}
                  </div>
                </div>

                <div>
                  <Textarea
                    value={whatsAppMessage}
                    onChange={(e) => setWhatsAppMessage(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    rows={4}
                    className="resize-none"
                    disabled={sendingInProgress}
                  />
                </div>

                {sendResult && (
                  <div className={`flex items-center gap-2 text-sm p-2 rounded ${
                    sendResult.type === "success" ? "bg-green-50 text-green-700" : "bg-destructive/10 text-destructive"
                  }`}>
                    {sendResult.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {sendResult.message}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setSendingWhatsApp(null); setSendResult(null); }}
                    disabled={sendingInProgress}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={sendWhatsAppViaAPI}
                    disabled={sendingInProgress || !whatsAppMessage.trim()}
                  >
                    {sendingInProgress ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
                    ) : (
                      <><Send className="w-4 h-4 mr-2" />Enviar</>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-sm text-muted-foreground">
            Pagina {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(1)}>
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)}>
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
