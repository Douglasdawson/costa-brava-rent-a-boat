import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Save,
  MessageCircle,
  Calendar,
  Euro,
  TrendingUp,
  Clock,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { CrmCustomerData } from "./types";
import type { Booking } from "@shared/schema";
import { getStatusColor, getStatusLabel } from "./constants";

interface CustomerDetailResponse {
  customer: CrmCustomerData;
  bookings: Booking[];
}

interface CustomerDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
  adminToken: string;
  onOpenWhatsApp: (phone: string, name: string) => void;
}

function getSegmentBadgeLarge(segment: string) {
  switch (segment) {
    case "vip":
      return <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-sm px-3 py-1">VIP</Badge>;
    case "returning":
      return <Badge className="bg-green-100 text-green-800 border-green-300 text-sm px-3 py-1">Recurrente</Badge>;
    case "new":
    default:
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-sm px-3 py-1">Nuevo</Badge>;
  }
}

export function CustomerDetailModal({
  open,
  onOpenChange,
  customerId,
  adminToken,
  onOpenWhatsApp,
}: CustomerDetailModalProps) {
  const { toast } = useToast();
  const [editNotes, setEditNotes] = useState("");
  const [editDocumentId, setEditDocumentId] = useState("");
  const [editSegment, setEditSegment] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Fetch customer detail
  const { data, isLoading, error } = useQuery<CustomerDetailResponse>({
    queryKey: ["/api/admin/customers", customerId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) {
        throw new Error("Error fetching customer");
      }
      return response.json();
    },
    enabled: !!customerId && open,
  });

  // Update customer mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: "Error" }));
        throw new Error(err.message || "Error updating customer");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Cliente actualizado", description: "Los cambios se han guardado" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers", customerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      setIsEditing(false);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const customer = data?.customer;
  const customerBookings = data?.bookings || [];

  // Start editing
  const handleStartEdit = () => {
    if (!customer) return;
    setEditNotes(customer.notes || "");
    setEditDocumentId(customer.documentId || "");
    setEditSegment(customer.segment);
    setIsEditing(true);
  };

  // Save edits
  const handleSave = () => {
    updateMutation.mutate({
      notes: editNotes || null,
      documentId: editDocumentId || null,
      segment: editSegment,
    });
  };

  // Calculate stats
  const confirmedBookings = customerBookings.filter((b) => b.bookingStatus === "confirmed");
  const totalSpent = confirmedBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);
  const averageTicket = confirmedBookings.length > 0 ? totalSpent / confirmedBookings.length : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isLoading ? "Cargando..." : customer ? `${customer.name} ${customer.surname}` : "Cliente"}
          </SheetTitle>
          <SheetDescription>
            {customer ? (
              <span className="flex items-center gap-2">
                {getSegmentBadgeLarge(customer.segment)}
                <span className="text-sm">
                  {"\u20AC"}{parseFloat(customer.totalSpent).toFixed(2)} lifetime value
                </span>
              </span>
            ) : (
              "Perfil del cliente"
            )}
          </SheetDescription>
        </SheetHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-red-500">Error cargando datos del cliente</div>
        )}

        {customer && (
          <div className="space-y-6 mt-6">
            {/* Contact Info */}
            <div>
              <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-3">
                Datos de Contacto
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{customer.email || "Sin email"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Telefono</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500">Nacionalidad</p>
                  <p className="font-medium">{customer.nationality || "Sin especificar"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Documento</p>
                  <p className="font-medium">{customer.documentId || "Sin documento"}</p>
                </div>
              </div>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                  onClick={() => onOpenWhatsApp(customer.phone, customer.name)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div>
              <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-3">
                Estadisticas
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Euro className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Total Gastado</p>
                        <p className="font-bold">{"\u20AC"}{totalSpent.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Total Reservas</p>
                        <p className="font-bold">{customer.totalBookings}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Ticket Medio</p>
                        <p className="font-bold">{"\u20AC"}{averageTicket.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Primera Visita</p>
                        <p className="font-bold text-xs">
                          {customer.firstBookingDate
                            ? format(new Date(customer.firstBookingDate), "dd/MM/yyyy")
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Notes & Document Edit Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
                  Notas y Segmento
                </h3>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={handleStartEdit}>
                    Editar
                  </Button>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit-document">Documento ID</Label>
                    <Input
                      id="edit-document"
                      value={editDocumentId}
                      onChange={(e) => setEditDocumentId(e.target.value)}
                      placeholder="DNI, Pasaporte, NIE..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-segment">Segmento</Label>
                    <Select value={editSegment} onValueChange={setEditSegment}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Nuevo</SelectItem>
                        <SelectItem value="returning">Recurrente</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-notes">Notas</Label>
                    <Textarea
                      id="edit-notes"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Notas internas sobre el cliente..."
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Guardar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                      disabled={updateMutation.isPending}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm">
                  {customer.notes ? (
                    <p className="whitespace-pre-wrap bg-gray-50 rounded p-3">{customer.notes}</p>
                  ) : (
                    <p className="text-gray-400 italic">Sin notas</p>
                  )}
                </div>
              )}
            </div>

            {/* Booking History */}
            <div>
              <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-3">
                Historial de Reservas ({customerBookings.length})
              </h3>
              {customerBookings.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Sin reservas registradas</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Fecha</TableHead>
                        <TableHead className="text-xs">Barco</TableHead>
                        <TableHead className="text-xs">Horas</TableHead>
                        <TableHead className="text-xs">Importe</TableHead>
                        <TableHead className="text-xs">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="text-xs">
                            {format(new Date(booking.startTime), "dd/MM/yy")}
                          </TableCell>
                          <TableCell className="text-xs">{booking.boatId}</TableCell>
                          <TableCell className="text-xs">{booking.totalHours}h</TableCell>
                          <TableCell className="text-xs font-medium">
                            {"\u20AC"}{parseFloat(booking.totalAmount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                getStatusColor(booking.bookingStatus) as
                                  | "default"
                                  | "secondary"
                                  | "outline"
                                  | "destructive"
                              }
                              className="text-xs"
                            >
                              {getStatusLabel(booking.bookingStatus)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Meta info */}
            <div className="text-xs text-gray-400 border-t pt-3">
              <p>Creado: {format(new Date(customer.createdAt), "dd/MM/yyyy HH:mm")}</p>
              <p>Actualizado: {format(new Date(customer.updatedAt), "dd/MM/yyyy HH:mm")}</p>
              <p>ID: {customer.id}</p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
