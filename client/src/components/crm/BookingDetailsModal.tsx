import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Eye,
  Edit,
  X,
  Check,
  Save,
  MessageCircle,
  ClipboardCheck,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { Booking } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getStatusColor, getStatusLabel } from "./constants";
import { editBookingSchema, type EditBookingFormData, type CheckinData } from "./types";
import { CheckinForm } from "./CheckinForm";

interface BookingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  isEditing: boolean;
  isCreating: boolean;
  adminToken: string;
  onEditStart: () => void;
  onEditCancel: () => void;
  onOpenWhatsApp: (phone: string, name: string) => void;
}

export function BookingDetailsModal({
  open,
  onOpenChange,
  booking,
  isEditing,
  isCreating,
  adminToken,
  onEditStart,
  onEditCancel,
  onOpenWhatsApp,
}: BookingDetailsModalProps) {
  const { toast } = useToast();
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [checkinType, setCheckinType] = useState<"checkin" | "checkout">("checkin");

  // Fetch check-ins for this booking
  const { data: bookingCheckins, isLoading: checkinsLoading } = useQuery<CheckinData[]>({
    queryKey: ["/api/admin/checkins/booking", booking?.id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/checkins/booking/${booking!.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Error fetching checkins");
      return response.json();
    },
    enabled: !!booking && open && !isEditing && !isCreating,
  });

  const hasCheckin = bookingCheckins?.some((c) => c.type === "checkin") ?? false;
  const hasCheckout = bookingCheckins?.some((c) => c.type === "checkout") ?? false;
  const checkinRecord = bookingCheckins?.find((c) => c.type === "checkin");
  const checkoutRecord = bookingCheckins?.find((c) => c.type === "checkout");

  const editForm = useForm<EditBookingFormData>({
    resolver: zodResolver(editBookingSchema),
  });

  // Populate form when entering edit mode
  const populateForm = (b: Booking) => {
    editForm.reset({
      customerName: b.customerName,
      customerSurname: b.customerSurname,
      customerPhone: b.customerPhone,
      customerEmail: b.customerEmail || "",
      customerNationality: b.customerNationality,
      numberOfPeople: b.numberOfPeople,
      boatId: b.boatId,
      startTime: format(new Date(b.startTime), "yyyy-MM-dd'T'HH:mm"),
      endTime: format(new Date(b.endTime), "yyyy-MM-dd'T'HH:mm"),
      totalHours: b.totalHours,
      subtotal: b.subtotal,
      extrasTotal: b.extrasTotal,
      deposit: b.deposit,
      totalAmount: b.totalAmount,
      bookingStatus: b.bookingStatus as EditBookingFormData["bookingStatus"],
      paymentStatus: b.paymentStatus as EditBookingFormData["paymentStatus"],
      notes: b.notes || "",
    });
  };

  // Mutation for quick status updates
  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, updates }: { bookingId: string; updates: Record<string, string> }) => {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(errorData.message || 'Error actualizando reserva');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Exito",
        description: data.message || "Reserva actualizada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar la reserva",
      });
    }
  });

  // Mutation for full booking edit
  const editBookingMutation = useMutation({
    mutationFn: async ({ bookingId, data }: { bookingId: string; data: EditBookingFormData }) => {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar la reserva');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
      toast({
        title: "Reserva actualizada",
        description: "Los cambios se han guardado correctamente",
      });
      onOpenChange(false);
      onEditCancel();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar la reserva",
      });
    }
  });

  // Mutation for creating a new booking
  const createBookingMutation = useMutation({
    mutationFn: async (data: EditBookingFormData) => {
      const startDate = new Date(data.startTime);
      const endDate = new Date(data.endTime);
      const response = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          ...data,
          bookingDate: startDate.toISOString(),
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          source: 'admin',
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear la reserva');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
      toast({
        title: "Reserva creada",
        description: "La nueva reserva se ha creado correctamente",
      });
      onOpenChange(false);
      onEditCancel();
      editForm.reset();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo crear la reserva",
      });
    }
  });

  const handleEditSubmit = (data: EditBookingFormData) => {
    if (booking) {
      editBookingMutation.mutate({ bookingId: booking.id, data });
    }
  };

  const handleCreateSubmit = (data: EditBookingFormData) => {
    createBookingMutation.mutate(data);
  };

  const handleConfirm = () => {
    if (booking) {
      updateBookingMutation.mutate({
        bookingId: booking.id,
        updates: { bookingStatus: "confirmed", paymentStatus: "completed" }
      });
    }
  };

  const handleCancel = () => {
    if (booking && confirm("Estas seguro de que quieres cancelar esta reserva?")) {
      updateBookingMutation.mutate({
        bookingId: booking.id,
        updates: { bookingStatus: "cancelled" }
      });
    }
  };

  const handleEditClick = () => {
    if (booking) {
      populateForm(booking);
      onEditStart();
    }
  };

  const isPending = isCreating ? createBookingMutation.isPending : editBookingMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        onEditCancel();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? "Nueva Reserva" : isEditing ? "Editar Reserva" : "Detalles de la Reserva"}
          </DialogTitle>
          <DialogDescription>
            {isCreating ? "Crear reserva manualmente desde el CRM" : `ID: ${booking?.id}`}
          </DialogDescription>
        </DialogHeader>

        {/* View Mode */}
        {booking && !isEditing && (
          <div className="space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Informacion del Cliente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Nombre Completo</p>
                  <p className="font-medium">{booking.customerName} {booking.customerSurname}</p>
                </div>
                <div>
                  <p className="text-gray-600">Telefono</p>
                  <p className="font-medium">{booking.customerPhone}</p>
                </div>
                {booking.customerEmail && (
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium">{booking.customerEmail}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-600">Nacionalidad</p>
                  <p className="font-medium">{booking.customerNationality}</p>
                </div>
                <div>
                  <p className="text-gray-600">Numero de Personas</p>
                  <p className="font-medium">{booking.numberOfPeople}</p>
                </div>
              </div>
            </div>

            {/* Booking Info */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Detalles de la Reserva</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Barco</p>
                  <p className="font-medium">{booking.boatId}</p>
                </div>
                <div>
                  <p className="text-gray-600">Fecha de Inicio</p>
                  <p className="font-medium">{format(new Date(booking.startTime), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <div>
                  <p className="text-gray-600">Fecha de Fin</p>
                  <p className="font-medium">{format(new Date(booking.endTime), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <div>
                  <p className="text-gray-600">Duracion</p>
                  <p className="font-medium">{booking.totalHours} horas</p>
                </div>
                <div>
                  <p className="text-gray-600">Estado de Reserva</p>
                  <Badge variant={getStatusColor(booking.bookingStatus) as "default" | "secondary" | "outline" | "destructive"}>
                    {getStatusLabel(booking.bookingStatus)}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-600">Estado de Pago</p>
                  <Badge variant={booking.paymentStatus === 'completed' ? 'default' : 'outline'}>
                    {booking.paymentStatus === 'completed' ? 'Pagado' :
                     booking.paymentStatus === 'pending' ? 'Pendiente' :
                     booking.paymentStatus === 'failed' ? 'Fallido' : 'Reembolsado'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Informacion de Pago</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Subtotal</p>
                  <p className="font-medium">{"\u20AC"}{parseFloat(booking.subtotal).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Extras</p>
                  <p className="font-medium">{"\u20AC"}{parseFloat(booking.extrasTotal).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Deposito</p>
                  <p className="font-medium">{"\u20AC"}{parseFloat(booking.deposit).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total</p>
                  <p className="font-semibold text-lg">{"\u20AC"}{parseFloat(booking.totalAmount).toFixed(2)}</p>
                </div>
                {booking.stripePaymentIntentId && (
                  <div className="col-span-2">
                    <p className="text-gray-600">Stripe Payment Intent</p>
                    <p className="font-mono text-xs">{booking.stripePaymentIntentId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Info */}
            {(booking.notes || booking.couponCode) && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Informacion Adicional</h3>
                <div className="space-y-2 text-sm">
                  {booking.couponCode && (
                    <div>
                      <p className="text-gray-600">Codigo de Descuento</p>
                      <p className="font-medium">{booking.couponCode}</p>
                    </div>
                  )}
                  {booking.notes && (
                    <div>
                      <p className="text-gray-600">Notas</p>
                      <p className="font-medium">{booking.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Check-in / Check-out Section */}
            {(booking.bookingStatus === "confirmed") && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-3">Check-in / Check-out</h3>
                <div className="space-y-3">
                  {/* Status indicators */}
                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className={`w-4 h-4 ${hasCheckin ? "text-green-600" : "text-gray-300"}`} />
                      <span className={hasCheckin ? "text-green-700 font-medium" : "text-gray-400"}>
                        {hasCheckin
                          ? `Check-in: ${format(new Date(checkinRecord!.performedAt), "dd/MM/yy HH:mm")}`
                          : "Sin check-in"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClipboardList className={`w-4 h-4 ${hasCheckout ? "text-green-600" : "text-gray-300"}`} />
                      <span className={hasCheckout ? "text-green-700 font-medium" : "text-gray-400"}>
                        {hasCheckout
                          ? `Check-out: ${format(new Date(checkoutRecord!.performedAt), "dd/MM/yy HH:mm")}`
                          : "Sin check-out"}
                      </span>
                    </div>
                  </div>

                  {/* Checkin details if exists */}
                  {checkinRecord && (
                    <div className="bg-green-50 rounded-lg p-3 text-xs space-y-1">
                      <p><span className="font-medium">Combustible:</span> {checkinRecord.fuelLevel}</p>
                      <p><span className="font-medium">Estado:</span> {checkinRecord.condition}</p>
                      {checkinRecord.engineHours && (
                        <p><span className="font-medium">Horas motor:</span> {checkinRecord.engineHours}</p>
                      )}
                      {checkinRecord.notes && (
                        <p><span className="font-medium">Notas:</span> {checkinRecord.notes}</p>
                      )}
                      {checkinRecord.performedBy && (
                        <p><span className="font-medium">Realizado por:</span> {checkinRecord.performedBy}</p>
                      )}
                    </div>
                  )}

                  {/* Checkout details if exists */}
                  {checkoutRecord && (
                    <div className="bg-blue-50 rounded-lg p-3 text-xs space-y-1">
                      <p className="font-medium text-blue-700 mb-1">Check-out:</p>
                      <p><span className="font-medium">Combustible:</span> {checkoutRecord.fuelLevel}</p>
                      <p><span className="font-medium">Estado:</span> {checkoutRecord.condition}</p>
                      {checkoutRecord.engineHours && (
                        <p><span className="font-medium">Horas motor:</span> {checkoutRecord.engineHours}</p>
                      )}
                      {checkoutRecord.notes && (
                        <p><span className="font-medium">Notas:</span> {checkoutRecord.notes}</p>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {!hasCheckin && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setCheckinType("checkin");
                          setShowCheckinForm(true);
                        }}
                      >
                        <ClipboardCheck className="w-4 h-4 mr-2" />
                        Hacer Check-in
                      </Button>
                    )}
                    {hasCheckin && !hasCheckout && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCheckinType("checkout");
                          setShowCheckinForm(true);
                        }}
                      >
                        <ClipboardList className="w-4 h-4 mr-2" />
                        Hacer Check-out
                      </Button>
                    )}
                    {hasCheckin && hasCheckout && (
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        Proceso completado
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-3">Acciones</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                  onClick={() => onOpenWhatsApp(booking.customerPhone, booking.customerName)}
                  data-testid="button-whatsapp-booking"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                {booking.bookingStatus === 'pending_payment' && (
                  <Button
                    variant="default"
                    onClick={handleConfirm}
                    data-testid="button-confirm-booking"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Confirmar Reserva
                  </Button>
                )}
                {(booking.bookingStatus === 'confirmed' || booking.bookingStatus === 'pending_payment') && (
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    data-testid="button-cancel-booking"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar Reserva
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleEditClick}
                  data-testid="button-edit-booking"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>

            <div className="text-xs text-gray-500 border-t pt-4">
              <p>Creada: {format(new Date(booking.createdAt), 'dd/MM/yyyy HH:mm')}</p>
              <p>Fuente: {booking.source === 'web' ? 'Web' : 'Admin'}</p>
            </div>
          </div>
        )}

        {/* Edit / Create Form */}
        {(isCreating || (booking && isEditing)) && (
          <form onSubmit={editForm.handleSubmit(isCreating ? handleCreateSubmit : handleEditSubmit)} className="space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Informacion del Cliente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Nombre</Label>
                  <Input
                    id="customerName"
                    autoComplete="given-name"
                    {...editForm.register("customerName")}
                    data-testid="input-customer-name"
                  />
                  {editForm.formState.errors.customerName && (
                    <p className="text-red-500 text-xs mt-1">{editForm.formState.errors.customerName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="customerSurname">Apellidos</Label>
                  <Input
                    id="customerSurname"
                    autoComplete="family-name"
                    {...editForm.register("customerSurname")}
                    data-testid="input-customer-surname"
                  />
                  {editForm.formState.errors.customerSurname && (
                    <p className="text-red-500 text-xs mt-1">{editForm.formState.errors.customerSurname.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="customerPhone">Telefono</Label>
                  <Input
                    id="customerPhone"
                    autoComplete="tel"
                    {...editForm.register("customerPhone")}
                    data-testid="input-customer-phone"
                  />
                  {editForm.formState.errors.customerPhone && (
                    <p className="text-red-500 text-xs mt-1">{editForm.formState.errors.customerPhone.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email (opcional)</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    autoComplete="email"
                    {...editForm.register("customerEmail")}
                    data-testid="input-customer-email"
                  />
                </div>
                <div>
                  <Label htmlFor="customerNationality">Nacionalidad</Label>
                  <Input
                    id="customerNationality"
                    {...editForm.register("customerNationality")}
                    data-testid="input-customer-nationality"
                  />
                </div>
                <div>
                  <Label htmlFor="numberOfPeople">Numero de Personas</Label>
                  <Input
                    id="numberOfPeople"
                    type="number"
                    {...editForm.register("numberOfPeople")}
                    data-testid="input-number-people"
                  />
                </div>
              </div>
            </div>

            {/* Booking Info */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Detalles de la Reserva</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="boatId">Barco</Label>
                  <Input
                    id="boatId"
                    {...editForm.register("boatId")}
                    data-testid="input-boat-id"
                  />
                </div>
                <div>
                  <Label htmlFor="totalHours">Horas Totales</Label>
                  <Input
                    id="totalHours"
                    type="number"
                    {...editForm.register("totalHours")}
                    data-testid="input-total-hours"
                  />
                </div>
                <div>
                  <Label htmlFor="startTime">Fecha y Hora de Inicio</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    {...editForm.register("startTime")}
                    data-testid="input-start-time"
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">Fecha y Hora de Fin</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    {...editForm.register("endTime")}
                    data-testid="input-end-time"
                  />
                </div>
                <div>
                  <Label htmlFor="bookingStatus">Estado de Reserva</Label>
                  <Select
                    value={editForm.watch("bookingStatus")}
                    onValueChange={(value) => editForm.setValue("bookingStatus", value as EditBookingFormData["bookingStatus"])}
                  >
                    <SelectTrigger data-testid="select-booking-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="hold">En Espera</SelectItem>
                      <SelectItem value="pending_payment">Pendiente de Pago</SelectItem>
                      <SelectItem value="confirmed">Confirmada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paymentStatus">Estado de Pago</Label>
                  <Select
                    value={editForm.watch("paymentStatus")}
                    onValueChange={(value) => editForm.setValue("paymentStatus", value as EditBookingFormData["paymentStatus"])}
                  >
                    <SelectTrigger data-testid="select-payment-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="failed">Fallido</SelectItem>
                      <SelectItem value="refunded">Reembolsado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Informacion de Pago</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subtotal">Subtotal ({"\u20AC"})</Label>
                  <Input
                    id="subtotal"
                    {...editForm.register("subtotal")}
                    data-testid="input-subtotal"
                  />
                </div>
                <div>
                  <Label htmlFor="extrasTotal">Extras ({"\u20AC"})</Label>
                  <Input
                    id="extrasTotal"
                    {...editForm.register("extrasTotal")}
                    data-testid="input-extras-total"
                  />
                </div>
                <div>
                  <Label htmlFor="deposit">Deposito ({"\u20AC"})</Label>
                  <Input
                    id="deposit"
                    {...editForm.register("deposit")}
                    data-testid="input-deposit"
                  />
                </div>
                <div>
                  <Label htmlFor="totalAmount">Total ({"\u20AC"})</Label>
                  <Input
                    id="totalAmount"
                    {...editForm.register("totalAmount")}
                    data-testid="input-total-amount"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                {...editForm.register("notes")}
                rows={3}
                data-testid="input-notes"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-save-booking"
              >
                {isPending ? (
                  "Guardando..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isCreating ? "Crear Reserva" : "Guardar Cambios"}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onEditCancel}
                disabled={isPending}
                data-testid="button-cancel-edit"
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}

        <DialogFooter>
          {!isEditing && (
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close-modal">
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Checkin Form Dialog */}
      {booking && (
        <CheckinForm
          open={showCheckinForm}
          onOpenChange={setShowCheckinForm}
          bookingId={booking.id}
          boatId={booking.boatId}
          type={checkinType}
          adminToken={adminToken}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["/api/admin/checkins/booking", booking.id],
            });
          }}
        />
      )}
    </Dialog>
  );
}
