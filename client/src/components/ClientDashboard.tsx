import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Calendar, Ship, LogOut, Save } from "lucide-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const profileSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "Los apellidos son requeridos"),
  email: z.string().email("Email inválido"),
  phonePrefix: z.string().min(1, "El prefijo es requerido"),
  phoneNumber: z.string().min(9, "Número de teléfono inválido"),
  nationality: z.string().min(1, "La nacionalidad es requerida"),
  documentType: z.string().min(1, "El tipo de documento es requerido"),
  documentNumber: z.string().min(1, "El número de documento es requerido"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface Customer {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phonePrefix: string;
  phoneNumber: string;
  nationality: string;
  documentType: string;
  documentNumber: string;
  createdAt: string;
  updatedAt: string;
}

interface Booking {
  id: string;
  boatId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerSurname: string;
  customerPhone: string;
  customerEmail: string;
  numberOfPeople: number;
  totalHours: number;
  subtotal: string;
  extrasTotal: string;
  deposit: string;
  totalAmount: string;
  paymentStatus: string;
  bookingStatus: string;
  createdAt: string;
}

const DOCUMENT_TYPES = [
  { value: "passport", label: "Pasaporte" },
  { value: "dni", label: "DNI" },
  { value: "nie", label: "NIE" },
  { value: "other", label: "Otro" },
];

const NATIONALITIES = [
  { value: "ES", label: "España" },
  { value: "FR", label: "Francia" },
  { value: "DE", label: "Alemania" },
  { value: "IT", label: "Italia" },
  { value: "GB", label: "Reino Unido" },
  { value: "NL", label: "Países Bajos" },
  { value: "BE", label: "Bélgica" },
  { value: "PT", label: "Portugal" },
  { value: "US", label: "Estados Unidos" },
  { value: "CA", label: "Canadá" },
  { value: "other", label: "Otra" },
];

const PHONE_PREFIXES = [
  { value: "+34", label: "+34 (España)" },
  { value: "+33", label: "+33 (Francia)" },
  { value: "+49", label: "+49 (Alemania)" },
  { value: "+39", label: "+39 (Italia)" },
  { value: "+44", label: "+44 (Reino Unido)" },
  { value: "+31", label: "+31 (Países Bajos)" },
  { value: "+1", label: "+1 (USA/Canadá)" },
];

function ProfileTab() {
  const { toast } = useToast();
  const { data: profile, isLoading } = useQuery<Customer>({
    queryKey: ["/api/customer/profile"],
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phonePrefix: "+34",
      phoneNumber: "",
      nationality: "ES",
      documentType: "passport",
      documentNumber: "",
    },
  });

  // Reset form when profile data loads
  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phonePrefix: profile.phonePrefix,
        phoneNumber: profile.phoneNumber,
        nationality: profile.nationality,
        documentType: profile.documentType,
        documentNumber: profile.documentNumber,
      });
    }
  }, [profile, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return await apiRequest("/api/customer/profile", "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/profile"] });
      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido guardados correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-profile" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Perfil no encontrado</CardTitle>
          <CardDescription>No se pudo cargar tu perfil. Por favor, completa tus datos.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi Perfil</CardTitle>
        <CardDescription>Gestiona tu información personal</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="given-name" data-testid="input-firstName" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellidos</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="family-name" data-testid="input-lastName" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" autoComplete="email" readOnly disabled data-testid="input-email" className="bg-muted" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nacionalidad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-nationality">
                          <SelectValue placeholder="Selecciona tu nacionalidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NATIONALITIES.map((nationality) => (
                          <SelectItem key={nationality.value} value={nationality.value}>
                            {nationality.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phonePrefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prefijo telefónico</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-phonePrefix">
                          <SelectValue placeholder="Prefijo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PHONE_PREFIXES.map((prefix) => (
                          <SelectItem key={prefix.value} value={prefix.value}>
                            {prefix.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" autoComplete="tel" data-testid="input-phoneNumber" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de documento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-documentType">
                          <SelectValue placeholder="Tipo de documento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documentNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de documento</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-documentNumber" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                data-testid="button-save-profile"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function BookingsTab() {
  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/customer/bookings"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-bookings" />
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mis Reservas</CardTitle>
          <CardDescription>No tienes reservas todavía</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Cuando realices una reserva, aparecerá aquí.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mis Reservas</CardTitle>
          <CardDescription>Historial de tus reservas</CardDescription>
        </CardHeader>
      </Card>

      {bookings.map((booking) => (
        <Card key={booking.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">Reserva #{booking.id.slice(0, 8)}</CardTitle>
                <CardDescription>
                  {new Date(booking.bookingDate).toLocaleDateString()} -{" "}
                  {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{" "}
                  {booking.totalHours} horas
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{booking.totalAmount} €</div>
                <div
                  className={`text-sm ${
                    booking.bookingStatus === "confirmed"
                      ? "text-green-600"
                      : booking.bookingStatus === "cancelled"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {booking.bookingStatus}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Personas:</span> {booking.numberOfPeople}
              </div>
              <div>
                <span className="text-muted-foreground">Estado pago:</span> {booking.paymentStatus}
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Extras:</span> {booking.extrasTotal} €
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function NewBookingTab() {
  const [, navigate] = useLocation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva Reserva</CardTitle>
        <CardDescription>Realiza una nueva reserva de barco</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Para realizar una nueva reserva, serás redirigido a nuestra página de reservas.
          Tus datos se autocompletarán automáticamente.
        </p>
        <Button onClick={() => navigate("/booking")} className="w-full" data-testid="button-new-booking">
          <Ship className="mr-2 h-4 w-4" />
          Ir a Reservas
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ClientDashboard() {
  const { user, logout, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" data-testid="loader-dashboard" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="title-dashboard">Mi Cuenta</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" data-testid="tab-profile">
              <User className="mr-2 h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="bookings" data-testid="tab-bookings">
              <Calendar className="mr-2 h-4 w-4" />
              Mis Reservas
            </TabsTrigger>
            <TabsTrigger value="new-booking" data-testid="tab-new-booking">
              <Ship className="mr-2 h-4 w-4" />
              Nueva Reserva
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="bookings">
            <BookingsTab />
          </TabsContent>

          <TabsContent value="new-booking">
            <NewBookingTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
