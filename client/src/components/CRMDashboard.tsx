import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Users, 
  Euro, 
  TrendingUp, 
  Clock, 
  Anchor,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  LogOut,
  Search,
  X,
  Check,
  Save,
  Umbrella,
  Sun,
  Ship,
  Compass,
  LifeBuoy,
  Music,
  Droplets,
  Fuel,
  Sparkles,
  Shield,
  GripVertical
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Booking } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { ImageGalleryUploader } from "@/components/ImageGalleryUploader";

interface CRMDashboardProps {
  adminToken: string;
}

// Validation schema for editing booking
const editBookingSchema = z.object({
  customerName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  customerSurname: z.string().min(2, "Los apellidos deben tener al menos 2 caracteres"),
  customerPhone: z.string().min(9, "El teléfono debe tener al menos 9 dígitos"),
  customerEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  customerNationality: z.string().min(1, "La nacionalidad es requerida"),
  numberOfPeople: z.coerce.number().min(1, "Debe ser al menos 1 persona"),
  boatId: z.string().min(1, "El barco es requerido"),
  startTime: z.string(),
  endTime: z.string(),
  totalHours: z.coerce.number().min(1, "Debe ser al menos 1 hora"),
  subtotal: z.string(),
  extrasTotal: z.string(),
  deposit: z.string(),
  totalAmount: z.string(),
  bookingStatus: z.enum(['draft', 'hold', 'pending_payment', 'confirmed', 'cancelled']),
  paymentStatus: z.enum(['pending', 'completed', 'failed', 'refunded']),
  notes: z.string().optional(),
});

type EditBookingFormData = z.infer<typeof editBookingSchema>;

// Validation schema for boat
const boatSchema = z.object({
  id: z.string().min(1, "El ID es requerido"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  capacity: z.coerce.number().min(1, "La capacidad debe ser al menos 1"),
  requiresLicense: z.boolean(),
  deposit: z.string().min(1, "El depósito es requerido"),
  isActive: z.boolean(),
  displayOrder: z.number().optional(),
  
  // Extended fields
  imageUrl: z.string().optional(),
  imageGallery: z.array(z.string()).optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  specifications: z.object({
    model: z.string(),
    length: z.string(),
    beam: z.string(),
    engine: z.string(),
    fuel: z.string(),
    capacity: z.string(),
    deposit: z.string(),
  }).optional(),
  equipment: z.array(z.string()).optional(),
  included: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  pricing: z.object({
    BAJA: z.object({
      period: z.string(),
      prices: z.record(z.number()),
    }),
    MEDIA: z.object({
      period: z.string(),
      prices: z.record(z.number()),
    }),
    ALTA: z.object({
      period: z.string(),
      prices: z.record(z.number()),
    }),
  }).optional(),
  extras: z.array(z.object({
    name: z.string(),
    price: z.string(),
    icon: z.string(),
  })).optional(),
});

type BoatFormData = z.infer<typeof boatSchema>;

// Equipment catalog with icons
const EQUIPMENT_OPTIONS = [
  { id: 'toldo-bimini', label: 'Toldo Bimini', icon: Umbrella },
  { id: 'solarium-proa-popa', label: 'Solárium proa y popa', icon: Sun },
  { id: 'escalera-bano', label: 'Escalera de baño', icon: Ship },
  { id: 'equipo-navegacion', label: 'Equipo de navegación', icon: Compass },
  { id: 'equipo-seguridad', label: 'Equipo de seguridad', icon: LifeBuoy },
  { id: 'equipo-musica', label: 'Equipo de música', icon: Music },
  { id: 'ducha-agua-dulce', label: 'Ducha de agua dulce', icon: Droplets },
];

// Included in price catalog with icons
const INCLUDED_OPTIONS = [
  { id: 'iva', label: 'IVA', icon: Euro },
  { id: 'carburante', label: 'Carburante', icon: Fuel },
  { id: 'amarre', label: 'Amarre', icon: Anchor },
  { id: 'limpieza', label: 'Limpieza', icon: Sparkles },
  { id: 'seguro', label: 'Seguro', icon: Shield },
  { id: 'patron', label: 'Patrón', icon: Users },
];

// Sortable row component for drag and drop
function SortableBoatRow({ boat, onEdit, onDelete }: { boat: any; onEdit: (boat: any) => void; onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: boat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? 'bg-gray-50' : ''}>
      <TableCell>
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      </TableCell>
      <TableCell className="font-medium">{boat.name}</TableCell>
      <TableCell>{boat.capacity} personas</TableCell>
      <TableCell>
        <Badge variant={boat.requiresLicense ? "default" : "secondary"}>
          {boat.requiresLicense ? "Requerida" : "No requerida"}
        </Badge>
      </TableCell>
      <TableCell>€{boat.deposit}</TableCell>
      <TableCell>
        <Badge variant={boat.isActive ? "default" : "secondary"}>
          {boat.isActive ? "Activo" : "Inactivo"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(boat)}
            data-testid={`button-edit-boat-${boat.id}`}
          >
            <Edit className="w-4 h-4" />
          </Button>
          {boat.isActive && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                if (confirm(`¿Estás seguro de desactivar ${boat.name}?`)) {
                  onDelete(boat.id);
                }
              }}
              data-testid={`button-delete-boat-${boat.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// Sortable boat card for mobile
function SortableBoatCard({ boat, onEdit, onDelete }: { boat: any; onEdit: (boat: any) => void; onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: boat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{boat.name}</h3>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(boat)}
                  data-testid={`button-edit-boat-${boat.id}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                {boat.isActive && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`¿Estás seguro de desactivar ${boat.name}?`)) {
                        onDelete(boat.id);
                      }
                    }}
                    data-testid={`button-delete-boat-${boat.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <Badge variant={boat.requiresLicense ? "default" : "secondary"} className="text-xs">
                {boat.requiresLicense ? "Licencia" : "Sin licencia"}
              </Badge>
              <Badge variant={boat.isActive ? "default" : "secondary"} className="text-xs">
                {boat.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Capacidad:</span>
                <span className="ml-1 font-medium">{boat.capacity} personas</span>
              </div>
              <div>
                <span className="text-gray-600">Depósito:</span>
                <span className="ml-1 font-medium">€{boat.deposit}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Fleet Management Component
function FleetManagement({ adminToken }: { adminToken: string }) {
  const [showBoatDialog, setShowBoatDialog] = useState(false);
  const [editingBoat, setEditingBoat] = useState<any | null>(null);
  const [featuresText, setFeaturesText] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedIncluded, setSelectedIncluded] = useState<string[]>([]);
  const [orderedBoats, setOrderedBoats] = useState<any[]>([]);
  const { toast } = useToast();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const boatForm = useForm<BoatFormData>({
    resolver: zodResolver(boatSchema),
    defaultValues: {
      id: "",
      name: "",
      capacity: 0,
      requiresLicense: false,
      deposit: "",
      isActive: true,
      imageUrl: "",
      imageGallery: [],
      subtitle: "",
      description: "",
      specifications: {
        model: "",
        length: "",
        beam: "",
        engine: "",
        fuel: "",
        capacity: "",
        deposit: "",
      },
      equipment: [],
      included: [],
      features: [],
      pricing: {
        BAJA: { period: "", prices: {} },
        MEDIA: { period: "", prices: {} },
        ALTA: { period: "", prices: {} },
      },
      extras: [],
    },
  });

  // Fetch all boats (including inactive)
  const { data: boats, isLoading: boatsLoading } = useQuery<any[]>({
    queryKey: ['/api/boats'],
  });

  // Initialize ordered boats when boats data changes
  useEffect(() => {
    if (boats) {
      const sorted = [...boats].sort((a, b) => 
        (a.displayOrder ?? 999) - (b.displayOrder ?? 999)
      );
      setOrderedBoats(sorted);
    }
  }, [boats]);

  // Reorder boats mutation
  const reorderBoatsMutation = useMutation({
    mutationFn: async (newOrder: any[]) => {
      const response = await fetch('/api/admin/boats/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          order: newOrder.map((boat, index) => ({
            id: boat.id,
            displayOrder: index
          }))
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al reordenar barcos');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/boats'] });
      toast({
        title: "Orden actualizado",
        description: "El orden de los barcos se ha guardado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedBoats((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Save to backend
        reorderBoatsMutation.mutate(newOrder);
        
        return newOrder;
      });
    }
  };

  // Create boat mutation
  const createBoatMutation = useMutation({
    mutationFn: async (data: BoatFormData) => {
      const response = await fetch('/api/admin/boats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear el barco');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/boats'] });
      toast({
        title: "Barco creado",
        description: "El barco se ha agregado correctamente",
      });
      setShowBoatDialog(false);
      boatForm.reset();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Update boat mutation
  const updateBoatMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BoatFormData> }) => {
      const response = await fetch(`/api/admin/boats/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar el barco');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/boats'] });
      toast({
        title: "Barco actualizado",
        description: "Los cambios se han guardado correctamente",
      });
      setShowBoatDialog(false);
      setEditingBoat(null);
      boatForm.reset();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Delete (deactivate) boat mutation
  const deleteBoatMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/boats/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar el barco');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/boats'] });
      toast({
        title: "Barco desactivado",
        description: "El barco ha sido desactivado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Import boats mutation
  const importBoatsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/init-boats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al importar barcos');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/boats'] });
      toast({
        title: "Barcos importados",
        description: `Se han importado ${data.created} de ${data.total} barcos correctamente`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleEditBoat = (boat: any) => {
    setEditingBoat(boat);
    
    // Set textarea states for editing
    setFeaturesText(boat.features?.join('\n') || '');
    setSelectedEquipment(boat.equipment || []);
    setSelectedIncluded(boat.included || []);
    
    boatForm.reset({
      id: boat.id,
      name: boat.name,
      capacity: boat.capacity,
      requiresLicense: boat.requiresLicense,
      deposit: boat.deposit,
      isActive: boat.isActive,
      imageUrl: boat.imageUrl || '',
      imageGallery: boat.imageGallery || [],
      subtitle: boat.subtitle || '',
      description: boat.description || '',
      specifications: boat.specifications || {
        model: "",
        length: "",
        beam: "",
        engine: "",
        fuel: "",
        capacity: "",
        deposit: "",
      },
      equipment: boat.equipment || [],
      included: boat.included || [],
      features: boat.features || [],
      pricing: boat.pricing || {
        BAJA: { period: '', prices: {} },
        MEDIA: { period: '', prices: {} },
        ALTA: { period: '', prices: {} },
      },
      extras: boat.extras || [],
    });
    setShowBoatDialog(true);
  };

  const handleSubmit = (data: BoatFormData) => {
    // Ensure specifications is properly formatted as an object
    const formattedData = {
      ...data,
      specifications: data.specifications || {
        model: "",
        length: "",
        beam: "",
        engine: "",
        fuel: "",
        capacity: "",
        deposit: "",
      },
      // Ensure equipment and included use the local state (in case form data is outdated)
      equipment: selectedEquipment,
      included: selectedIncluded,
    };
    
    // Sanitize deposit field - remove currency symbols for numeric field
    if (formattedData.deposit) {
      const depositStr = String(formattedData.deposit);
      const numericDeposit = depositStr.replace(/[€$,\s]/g, '');
      formattedData.deposit = numericDeposit || '0';
    }
    
    if (editingBoat) {
      updateBoatMutation.mutate({ id: formattedData.id, data: formattedData });
    } else {
      createBoatMutation.mutate(formattedData);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold">Gestión de Flota</h2>
        <Button
          onClick={() => {
            setEditingBoat(null);
            setFeaturesText("");
            setSelectedEquipment([]);
            setSelectedIncluded([]);
            boatForm.reset();
            setShowBoatDialog(true);
          }}
          data-testid="button-add-boat"
          size="sm"
          className="sm:h-10"
        >
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Agregar Barco</span>
          <span className="sm:hidden">Agregar</span>
        </Button>
      </div>

      {boatsLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Cargando flota...</p>
          </CardContent>
        </Card>
      ) : !boats || boats.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Anchor className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No hay barcos registrados</h3>
            <p className="text-gray-600 mb-4">Importa los 7 barcos de la flota o agrega uno manualmente</p>
            <div className="flex justify-center gap-4">
              <Button 
                onClick={() => importBoatsMutation.mutate()} 
                disabled={importBoatsMutation.isPending}
                data-testid="button-import-boats"
              >
                <Download className="w-4 h-4 mr-2" />
                {importBoatsMutation.isPending ? "Importando..." : "Importar Flota (7 barcos)"}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowBoatDialog(true)} 
                data-testid="button-add-first-boat"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Manualmente
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="hidden md:block">
            <CardHeader>
              <CardTitle>Barcos ({orderedBoats.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Capacidad</TableHead>
                      <TableHead>Licencia</TableHead>
                      <TableHead>Depósito</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableContext
                      items={orderedBoats.map(b => b.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {orderedBoats.map((boat: any) => (
                        <SortableBoatRow
                          key={boat.id}
                          boat={boat}
                          onEdit={handleEditBoat}
                          onDelete={(id) => deleteBoatMutation.mutate(id)}
                        />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
              </DndContext>
            </CardContent>
          </Card>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            <div className="text-sm font-medium text-gray-600 px-1">
              Barcos ({orderedBoats.length})
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedBoats.map(b => b.id)}
                strategy={verticalListSortingStrategy}
              >
                {orderedBoats.map((boat: any) => (
                  <SortableBoatCard
                    key={boat.id}
                    boat={boat}
                    onEdit={handleEditBoat}
                    onDelete={(id) => deleteBoatMutation.mutate(id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </>
      )}

      {/* Add/Edit Boat Dialog - Mobile fullscreen */}
      <Dialog open={showBoatDialog} onOpenChange={setShowBoatDialog}>
        <DialogContent className="
          w-full h-full
          md:w-auto md:h-auto
          md:max-w-4xl md:max-h-[90vh]
          overflow-y-auto 
          p-4 sm:p-6
          !left-0 !top-0 !translate-x-0 !translate-y-0
          md:!left-1/2 md:!top-1/2 md:!-translate-x-1/2 md:!-translate-y-1/2
        ">
          <DialogHeader>
            <DialogTitle>{editingBoat ? "Editar Barco" : "Agregar Barco"}</DialogTitle>
            <DialogDescription>Complete todos los campos del barco</DialogDescription>
          </DialogHeader>
          <form onSubmit={boatForm.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="id">ID del Barco *</Label>
                  <Input
                    id="id"
                    {...boatForm.register("id")}
                    placeholder="solar-450"
                    disabled={!!editingBoat}
                    data-testid="input-boat-id"
                  />
                  {boatForm.formState.errors.id && (
                    <p className="text-sm text-red-500">{boatForm.formState.errors.id.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    {...boatForm.register("name")}
                    placeholder="Solar 450"
                    data-testid="input-boat-name"
                  />
                  {boatForm.formState.errors.name && (
                    <p className="text-sm text-red-500">{boatForm.formState.errors.name.message}</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="subtitle">Subtítulo</Label>
                <Input
                  id="subtitle"
                  {...boatForm.register("subtitle")}
                  placeholder="¡Barco sin licencia para alquilar en Blanes!"
                  data-testid="input-boat-subtitle"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  {...boatForm.register("description")}
                  placeholder="Descripción detallada del barco..."
                  rows={4}
                  data-testid="input-boat-description"
                />
              </div>
            </div>

            {/* Imágenes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Imágenes</h3>
              <div>
                <Label htmlFor="imageUrl">URL Imagen Principal</Label>
                <Input
                  id="imageUrl"
                  {...boatForm.register("imageUrl")}
                  placeholder="https://ejemplo.com/barco.jpg"
                  data-testid="input-boat-image-url"
                />
              </div>
              <div>
                <Label>Galería de Imágenes</Label>
                <ImageGalleryUploader
                  images={boatForm.watch('imageGallery') || []}
                  onImagesChange={(images) => boatForm.setValue('imageGallery', images)}
                  maxImages={10}
                />
              </div>
            </div>

            {/* Características Principales */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Características Principales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity">Capacidad (personas) *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    {...boatForm.register("capacity")}
                    placeholder="6"
                    data-testid="input-boat-capacity"
                  />
                </div>
                <div>
                  <Label htmlFor="deposit">Depósito (€) *</Label>
                  <Input
                    id="deposit"
                    {...boatForm.register("deposit")}
                    placeholder="300.00"
                    data-testid="input-main-deposit"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <div className="flex items-center space-x-2">
                  <input
                    id="requiresLicense"
                    type="checkbox"
                    {...boatForm.register("requiresLicense")}
                    className="w-4 h-4"
                    data-testid="checkbox-requires-license"
                  />
                  <Label htmlFor="requiresLicense">Requiere licencia náutica</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id="isActive"
                    type="checkbox"
                    {...boatForm.register("isActive")}
                    className="w-4 h-4"
                    data-testid="checkbox-is-active"
                  />
                  <Label htmlFor="isActive">Barco activo</Label>
                </div>
              </div>
              <div>
                <Label>Características (una por línea)</Label>
                <Textarea
                  placeholder="Sin licencia requerida&#10;Hasta 5 personas&#10;Gasolina incluida"
                  rows={4}
                  value={featuresText}
                  onChange={(e) => {
                    setFeaturesText(e.target.value);
                    const features = e.target.value.split('\n').filter(f => f.trim());
                    boatForm.setValue('features', features);
                  }}
                  data-testid="input-boat-features"
                />
              </div>
            </div>

            {/* Especificaciones Técnicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Especificaciones Técnicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Modelo</Label>
                  <Input 
                    placeholder="Solar 450" 
                    {...boatForm.register('specifications.model')}
                    data-testid="input-boat-model"
                  />
                </div>
                <div>
                  <Label>Eslora</Label>
                  <Input 
                    placeholder="4,50m" 
                    {...boatForm.register('specifications.length')}
                    data-testid="input-boat-length"
                  />
                </div>
                <div>
                  <Label>Manga</Label>
                  <Input 
                    placeholder="1,50m" 
                    {...boatForm.register('specifications.beam')}
                    data-testid="input-boat-beam"
                  />
                </div>
                <div>
                  <Label>Motor</Label>
                  <Input 
                    placeholder="Mercury 15cv 4t" 
                    {...boatForm.register('specifications.engine')}
                    data-testid="input-boat-engine"
                  />
                </div>
                <div>
                  <Label>Combustible</Label>
                  <Input 
                    placeholder="Gasolina 30L" 
                    {...boatForm.register('specifications.fuel')}
                    data-testid="input-boat-fuel"
                  />
                </div>
                <div>
                  <Label>Capacidad</Label>
                  <Input 
                    placeholder="5 Personas" 
                    {...boatForm.register('specifications.capacity')}
                    data-testid="input-boat-capacity"
                  />
                </div>
                <div>
                  <Label>Fianza</Label>
                  <Input 
                    placeholder="300€" 
                    {...boatForm.register('specifications.deposit')}
                    data-testid="input-spec-fianza"
                  />
                </div>
              </div>
            </div>

            {/* Equipamiento */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Equipamiento e Incluido</h3>
              <div>
                <Label>Equipamiento</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {EQUIPMENT_OPTIONS.map((equipment) => {
                    const Icon = equipment.icon;
                    const isSelected = selectedEquipment.includes(equipment.label);
                    
                    return (
                      <div
                        key={equipment.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          const newEquipment = isSelected
                            ? selectedEquipment.filter(e => e !== equipment.label)
                            : [...selectedEquipment, equipment.label];
                          setSelectedEquipment(newEquipment);
                          boatForm.setValue('equipment', newEquipment);
                        }}
                        data-testid={`checkbox-equipment-${equipment.id}`}
                      >
                        <div className={`w-5 h-5 flex items-center justify-center border rounded ${
                          isSelected ? 'bg-primary border-primary' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-gray-600'}`} />
                        <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>
                          {equipment.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label>Incluido en el precio</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {INCLUDED_OPTIONS.map((item) => {
                    const Icon = item.icon;
                    const isSelected = selectedIncluded.includes(item.label);
                    
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          const newIncluded = isSelected
                            ? selectedIncluded.filter(i => i !== item.label)
                            : [...selectedIncluded, item.label];
                          setSelectedIncluded(newIncluded);
                          boatForm.setValue('included', newIncluded);
                        }}
                        data-testid={`checkbox-included-${item.id}`}
                      >
                        <div className={`w-5 h-5 flex items-center justify-center border rounded ${
                          isSelected ? 'bg-primary border-primary' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-gray-600'}`} />
                        <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Precios por Temporada */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Precios por Temporada</h3>
              
              {/* Temporada BAJA */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium">Temporada BAJA</h4>
                <Input 
                  placeholder="Periodo (ej: Abril-Junio, Septiembre-Cierre)"
                  onChange={(e) => boatForm.setValue('pricing.BAJA.period', e.target.value)}
                />
                <div className="grid grid-cols-3 gap-2">
                  {boatForm.watch('requiresLicense') ? (
                    <>
                      <div>
                        <Label className="text-xs">2h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.BAJA.prices.2h', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">4h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.BAJA.prices.4h', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">8h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.BAJA.prices.8h', parseFloat(e.target.value) || 0)} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-xs">1h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.BAJA.prices.1h', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">2h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.BAJA.prices.2h', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">3h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.BAJA.prices.3h', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">4h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.BAJA.prices.4h', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">6h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.BAJA.prices.6h', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">8h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.BAJA.prices.8h', parseFloat(e.target.value) || 0)} />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Temporada MEDIA */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium">Temporada MEDIA</h4>
                <Input 
                  placeholder="Periodo (ej: Julio)"
                  onChange={(e) => boatForm.setValue('pricing.MEDIA.period', e.target.value)}
                />
                <div className="grid grid-cols-3 gap-2">
                  {boatForm.watch('requiresLicense') ? (
                    <>
                      <div>
                        <Label className="text-xs">2h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.MEDIA.prices.2h', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">4h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.MEDIA.prices.4h', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">8h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.MEDIA.prices.8h', parseFloat(e.target.value) || 0)} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-xs">1h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.MEDIA.prices.1h', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">2h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.MEDIA.prices.2h', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">3h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.MEDIA.prices.3h', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">4h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.MEDIA.prices.4h', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">6h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.MEDIA.prices.6h', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">8h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.MEDIA.prices.8h', parseFloat(e.target.value) || 0)} />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Temporada ALTA */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium">Temporada ALTA</h4>
                <Input 
                  placeholder="Periodo (ej: Agosto)"
                  onChange={(e) => boatForm.setValue('pricing.ALTA.period', e.target.value)}
                />
                <div className="grid grid-cols-3 gap-2">
                  {boatForm.watch('requiresLicense') ? (
                    <>
                      <div>
                        <Label className="text-xs">2h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.ALTA.prices.2h', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">4h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.ALTA.prices.4h', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">8h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.ALTA.prices.8h', parseFloat(e.target.value) || 0)} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-xs">1h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.ALTA.prices.1h', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">2h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.ALTA.prices.2h', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">3h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.ALTA.prices.3h', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">4h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.ALTA.prices.4h', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">6h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.ALTA.prices.6h', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">8h</Label>
                        <Input type="number" placeholder="0" onChange={(e) => boatForm.setValue('pricing.ALTA.prices.8h', parseFloat(e.target.value) || 0)} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowBoatDialog(false);
                  setEditingBoat(null);
                  setFeaturesText("");
                  setSelectedEquipment([]);
                  setSelectedIncluded([]);
                  boatForm.reset();
                }}
                data-testid="button-cancel-boat"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createBoatMutation.isPending || updateBoatMutation.isPending}
                data-testid="button-save-boat"
              >
                {createBoatMutation.isPending || updateBoatMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CRMDashboard({ adminToken }: CRMDashboardProps) {
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [selectedTimeRange, setSelectedTimeRange] = useState("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Form for editing bookings
  const editForm = useForm<EditBookingFormData>({
    resolver: zodResolver(editBookingSchema),
  });

  // Fetch stats with authentication
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['/api/admin/stats', selectedTimeRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/stats?period=${selectedTimeRange}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      if (!response.ok) {
        let errorMessage = 'Error fetching stats';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        const error: any = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }
      return response.json();
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 401 - it means session expired
      if (error?.status === 401) return false;
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  });

  // Fetch all bookings
  const { data: bookingsData, isLoading: bookingsLoading, error: bookingsError } = useQuery({
    queryKey: ['/api/admin/bookings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/bookings', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      if (!response.ok) {
        let errorMessage = 'Error fetching bookings';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        const error: any = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }
      return response.json();
    },
    retry: (failureCount, error: any) => {
      if (error?.status === 401) return false;
      return failureCount < 2;
    },
  });

  // Fetch all customers
  const { data: customersData, isLoading: customersLoading, error: customersError } = useQuery({
    queryKey: ['/api/admin/customers'],
    queryFn: async () => {
      const response = await fetch('/api/admin/customers', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      if (!response.ok) {
        let errorMessage = 'Error fetching customers';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        const error: any = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }
      return response.json();
    },
    retry: (failureCount, error: any) => {
      if (error?.status === 401) return false;
      return failureCount < 2;
    },
  });

  // Handle authentication errors - logout if 401
  useEffect(() => {
    const error = statsError || bookingsError || customersError;
    if (error && (error as any)?.status === 401) {
      toast({
        variant: "destructive",
        title: "Sesión expirada",
        description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
      });
      // Delay logout slightly to ensure toast is shown
      setTimeout(handleLogout, 1000);
    }
  }, [statsError, bookingsError, customersError, toast]);

  // Show error toasts for non-auth errors
  useEffect(() => {
    if (statsError && (statsError as any)?.status !== 401) {
      toast({
        variant: "destructive",
        title: "Error cargando estadísticas",
        description: statsError.message || "No se pudieron cargar las estadísticas. Intenta recargar la página.",
      });
    }
  }, [statsError, toast]);

  useEffect(() => {
    if (bookingsError && (bookingsError as any)?.status !== 401) {
      toast({
        variant: "destructive",
        title: "Error cargando reservas",
        description: bookingsError.message || "No se pudieron cargar las reservas. Intenta recargar la página.",
      });
    }
  }, [bookingsError, toast]);

  useEffect(() => {
    if (customersError && (customersError as any)?.status !== 401) {
      toast({
        variant: "destructive",
        title: "Error cargando clientes",
        description: customersError.message || "No se pudieron cargar los clientes. Intenta recargar la página.",
      });
    }
  }, [customersError, toast]);

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    window.location.href = "/";
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "confirmed": return "default";
      case "pending_payment": return "secondary";
      case "hold": return "outline";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case "confirmed": return "Confirmada";
      case "pending_payment": return "Pendiente Pago";
      case "hold": return "En Espera";
      case "cancelled": return "Cancelada";
      case "draft": return "Borrador";
      default: return status;
    }
  };

  // Mutation para actualizar el estado de la reserva
  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, updates }: { bookingId: string; updates: any }) => {
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
        title: "Éxito",
        description: data.message || "Reserva actualizada correctamente",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setShowBookingDetails(false);
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
      setIsEditing(false);
      setShowBookingDetails(false);
      setSelectedBooking(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar la reserva",
      });
    }
  });

  const handleBookingAction = (action: string, bookingId: string) => {
    if (action === "view") {
      // Find the booking and open details modal
      const booking = bookingsData?.find((b: Booking) => b.id === bookingId);
      if (booking) {
        setSelectedBooking(booking);
        setShowBookingDetails(true);
        setIsEditing(false);
      }
    } else if (action === "edit") {
      // Find the booking and open edit mode
      const booking = bookingsData?.find((b: Booking) => b.id === bookingId);
      if (booking) {
        setSelectedBooking(booking);
        setShowBookingDetails(true);
        setIsEditing(true);
        // Populate form with booking data
        editForm.reset({
          customerName: booking.customerName,
          customerSurname: booking.customerSurname,
          customerPhone: booking.customerPhone,
          customerEmail: booking.customerEmail || "",
          customerNationality: booking.customerNationality,
          numberOfPeople: booking.numberOfPeople,
          boatId: booking.boatId,
          startTime: format(new Date(booking.startTime), "yyyy-MM-dd'T'HH:mm"),
          endTime: format(new Date(booking.endTime), "yyyy-MM-dd'T'HH:mm"),
          totalHours: booking.totalHours,
          subtotal: booking.subtotal,
          extrasTotal: booking.extrasTotal,
          deposit: booking.deposit,
          totalAmount: booking.totalAmount,
          bookingStatus: booking.bookingStatus as any,
          paymentStatus: booking.paymentStatus as any,
          notes: booking.notes || "",
        });
      }
    } else if (action === "confirm") {
      updateBookingMutation.mutate({
        bookingId,
        updates: {
          bookingStatus: "confirmed",
          paymentStatus: "completed"
        }
      });
    } else if (action === "cancel") {
      if (confirm("¿Estás seguro de que quieres cancelar esta reserva?")) {
        updateBookingMutation.mutate({
          bookingId,
          updates: {
            bookingStatus: "cancelled"
          }
        });
      }
    }
  };

  const handleEditSubmit = (data: EditBookingFormData) => {
    if (selectedBooking) {
      editBookingMutation.mutate({
        bookingId: selectedBooking.id,
        data
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    editForm.reset();
  };

  // Process bookings data
  const recentBookings = bookingsData?.slice(0, 10) || [];
  const upcomingBookings = bookingsData?.filter((b: any) => 
    new Date(b.startTime) > new Date() && 
    (b.bookingStatus === 'confirmed' || b.bookingStatus === 'pending_payment')
  ).slice(0, 10) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile optimized */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Anchor className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">CRM Costa Brava</h1>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Sistema de gestión de reservas</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:space-x-4">
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout" size="sm" className="sm:h-10">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </Button>
            <Button variant="outline" data-testid="button-export-data" size="sm" className="hidden sm:flex sm:h-10">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button data-testid="button-new-booking" size="sm" className="sm:h-10">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Nueva Reserva</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          </div>
        </div>

        {/* Navigation Tabs - Mobile optimized */}
        <div className="flex gap-2 sm:gap-4 mt-4 sm:mt-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          {[
            { id: "dashboard", label: "Dashboard", icon: TrendingUp },
            { id: "bookings", label: "Reservas", icon: Calendar },
            { id: "customers", label: "Clientes", icon: Users },
            { id: "fleet", label: "Flota", icon: Anchor },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
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

      <div className="p-6">
        {/* Dashboard Tab */}
        {selectedTab === "dashboard" && (
          <div className="space-y-6">
            {/* Time range selector */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Periodo:</span>
              {["today", "week", "month"].map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    selectedTimeRange === range
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 border hover:bg-gray-50'
                  }`}
                  data-testid={`filter-${range}`}
                >
                  {range === "today" ? "Hoy" : range === "week" ? "Semana" : "Mes"}
                </button>
              ))}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reservas</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : statsError ? "Error" : stats?.bookingsCount ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedTimeRange === "today" ? "Hoy" : selectedTimeRange === "week" ? "Esta semana" : "Este mes"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
                  <Euro className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : statsError ? "Error" : 
                      `€${(stats?.revenue ?? 0).toFixed(2)}`
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedTimeRange === "today" ? "Hoy" : selectedTimeRange === "week" ? "Esta semana" : "Este mes"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Barcos Disponibles</CardTitle>
                  <Anchor className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : statsError ? "Error" : 
                      `${stats?.availableBoats ?? 0}/${stats?.totalBoats ?? 0}`
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ahora mismo
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasa Ocupación</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? "..." : statsError ? "Error" : 
                      (stats?.totalBoats ?? 0) > 0 
                        ? `${Math.round((((stats?.totalBoats ?? 0) - (stats?.availableBoats ?? 0)) / (stats?.totalBoats ?? 1)) * 100)}%`
                        : "0%"
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ahora mismo
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Reservas Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="text-center py-8 text-gray-500">Cargando reservas...</div>
                ) : bookingsError ? (
                  <div className="text-center py-8 text-red-500">Error cargando reservas</div>
                ) : recentBookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No hay reservas recientes</div>
                ) : (
                  <div className="space-y-4">
                    {recentBookings.map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <p className="font-medium text-gray-900">
                                {booking.customerName} {booking.customerSurname}
                              </p>
                              <p className="text-sm text-gray-600">
                                {format(new Date(booking.bookingDate), 'dd/MM/yyyy')} - {booking.totalHours}h
                              </p>
                            </div>
                            <Badge variant={getStatusColor(booking.bookingStatus)}>
                              {getStatusLabel(booking.bookingStatus)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="font-semibold text-gray-900">€{booking.totalAmount}</span>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleBookingAction("view", booking.id)}
                              data-testid={`button-view-${booking.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleBookingAction("edit", booking.id)}
                              data-testid={`button-edit-${booking.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Próximas Reservas</CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="text-center py-8 text-gray-500">Cargando reservas...</div>
                ) : bookingsError ? (
                  <div className="text-center py-8 text-red-500">Error cargando reservas</div>
                ) : upcomingBookings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No hay reservas próximas</div>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <Clock className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {booking.customerName} {booking.customerSurname}
                              </p>
                              <p className="text-sm text-gray-600">
                                {format(new Date(booking.startTime), 'dd/MM/yyyy HH:mm')} - {booking.totalHours}h
                              </p>
                            </div>
                            <Badge variant={getStatusColor(booking.bookingStatus)}>
                              {getStatusLabel(booking.bookingStatus)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="font-semibold text-gray-900">€{booking.totalAmount}</span>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleBookingAction("view", booking.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bookings Tab */}
        {selectedTab === "bookings" && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por nombre, email, tel\u00e9fono..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-bookings"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[200px]" data-testid="select-status-filter">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="confirmed">Confirmada</SelectItem>
                      <SelectItem value="pending_payment">Pendiente Pago</SelectItem>
                      <SelectItem value="hold">En Espera</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                      <SelectItem value="draft">Borrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Bookings Table - Responsive */}
            {/* Desktop Table View */}
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle>Todas las Reservas</CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="text-center py-12 text-gray-500">Cargando reservas...</div>
                ) : bookingsError ? (
                  <div className="text-center py-12 text-red-500">Error cargando reservas</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Contacto</TableHead>
                          <TableHead>Barco</TableHead>
                          <TableHead>Horas</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Pago</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          let filteredBookings = bookingsData || [];
                          
                          // Filter by status
                          if (statusFilter !== "all") {
                            filteredBookings = filteredBookings.filter((b: Booking) => 
                              b.bookingStatus === statusFilter
                            );
                          }
                          
                          // Filter by search query
                          if (searchQuery) {
                            const query = searchQuery.toLowerCase();
                            filteredBookings = filteredBookings.filter((b: Booking) => 
                              b.customerName.toLowerCase().includes(query) ||
                              b.customerSurname.toLowerCase().includes(query) ||
                              b.customerEmail?.toLowerCase().includes(query) ||
                              b.customerPhone.toLowerCase().includes(query)
                            );
                          }
                          
                          if (filteredBookings.length === 0) {
                            return (
                              <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                  No se encontraron reservas con los filtros seleccionados
                                </TableCell>
                              </TableRow>
                            );
                          }
                          
                          return filteredBookings.map((booking: Booking) => (
                            <TableRow key={booking.id} data-testid={`row-booking-${booking.id}`}>
                              <TableCell className="font-medium">
                                {format(new Date(booking.startTime), 'dd/MM/yy HH:mm')}
                              </TableCell>
                              <TableCell>
                                {booking.customerName} {booking.customerSurname}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                <div>{booking.customerPhone}</div>
                                {booking.customerEmail && (
                                  <div className="text-xs">{booking.customerEmail}</div>
                                )}
                              </TableCell>
                              <TableCell>{booking.boatId}</TableCell>
                              <TableCell>{booking.totalHours}h</TableCell>
                              <TableCell className="font-semibold">
                                \u20ac{parseFloat(booking.totalAmount).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusColor(booking.bookingStatus)}>
                                  {getStatusLabel(booking.bookingStatus)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={booking.paymentStatus === 'completed' ? 'default' : 'outline'}>
                                  {booking.paymentStatus === 'completed' ? 'Pagado' : 
                                   booking.paymentStatus === 'pending' ? 'Pendiente' :
                                   booking.paymentStatus === 'failed' ? 'Fallido' : 'Reembolsado'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                      setShowBookingDetails(true);
                                    }}
                                    data-testid={`button-view-${booking.id}`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ));
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              <div className="text-sm font-medium text-gray-600 px-1">
                Todas las Reservas
              </div>
              {bookingsLoading ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    Cargando reservas...
                  </CardContent>
                </Card>
              ) : bookingsError ? (
                <Card>
                  <CardContent className="py-12 text-center text-red-500">
                    Error cargando reservas
                  </CardContent>
                </Card>
              ) : (() => {
                let filteredBookings = bookingsData || [];
                
                if (statusFilter !== "all") {
                  filteredBookings = filteredBookings.filter((b: Booking) => 
                    b.bookingStatus === statusFilter
                  );
                }
                
                if (searchQuery) {
                  const query = searchQuery.toLowerCase();
                  filteredBookings = filteredBookings.filter((b: Booking) => 
                    b.customerName.toLowerCase().includes(query) ||
                    b.customerSurname.toLowerCase().includes(query) ||
                    b.customerEmail?.toLowerCase().includes(query) ||
                    b.customerPhone.toLowerCase().includes(query)
                  );
                }

                if (filteredBookings.length === 0) {
                  return (
                    <Card>
                      <CardContent className="py-12 text-center text-gray-500">
                        No se encontraron reservas
                      </CardContent>
                    </Card>
                  );
                }

                return filteredBookings.map((booking: Booking) => (
                  <Card key={booking.id} data-testid={`card-booking-${booking.id}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base">
                            {booking.customerName} {booking.customerSurname}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {format(new Date(booking.startTime), 'dd/MM/yy HH:mm')} - {booking.totalHours}h
                          </p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Badge variant={getStatusColor(booking.bookingStatus)} className="text-xs">
                              {getStatusLabel(booking.bookingStatus)}
                            </Badge>
                            <Badge variant={booking.paymentStatus === 'completed' ? 'default' : 'outline'} className="text-xs">
                              {booking.paymentStatus === 'completed' ? 'Pagado' : 
                               booking.paymentStatus === 'pending' ? 'Pendiente' :
                               booking.paymentStatus === 'failed' ? 'Fallido' : 'Reembolsado'}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowBookingDetails(true);
                          }}
                          data-testid={`button-view-${booking.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3 mt-3">
                        <div>
                          <span className="text-gray-600">Barco:</span>
                          <span className="ml-1 font-medium">{booking.boatId}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-600">Total:</span>
                          <span className="ml-1 font-semibold text-base">
                            €{parseFloat(booking.totalAmount).toFixed(2)}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600 text-xs">{booking.customerPhone}</span>
                          {booking.customerEmail && (
                            <span className="text-gray-600 text-xs ml-2">{booking.customerEmail}</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {selectedTab === "customers" && (
          <div className="space-y-6">
            {/* Customers Table - Responsive */}
            {/* Desktop Table View */}
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle>Todos los Clientes</CardTitle>
                <p className="text-sm text-gray-600">
                  Lista de clientes únicos extraídos de las reservas
                </p>
              </CardHeader>
              <CardContent>
                {customersLoading ? (
                  <div className="text-center py-12 text-gray-500">Cargando clientes...</div>
                ) : customersError ? (
                  <div className="text-center py-12 text-red-500">Error cargando clientes</div>
                ) : !customersData || customersData.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No hay clientes registrados</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Contacto</TableHead>
                          <TableHead>Nacionalidad</TableHead>
                          <TableHead>Reservas</TableHead>
                          <TableHead>Gasto Total</TableHead>
                          <TableHead>Última Reserva</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customersData.map((customer: any, index: number) => (
                          <TableRow key={index} data-testid={`row-customer-${index}`}>
                            <TableCell className="font-medium">
                              {customer.customerName} {customer.customerSurname}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              <div>{customer.customerPhone}</div>
                              {customer.customerEmail && (
                                <div className="text-xs">{customer.customerEmail}</div>
                              )}
                            </TableCell>
                            <TableCell>{customer.customerNationality}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {customer.bookingsCount} {customer.bookingsCount === 1 ? 'reserva' : 'reservas'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold">
                              €{customer.totalSpent.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {format(new Date(customer.lastBookingDate), 'dd/MM/yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Show customer's bookings history
                                  toast({
                                    title: "Ver historial",
                                    description: `Historial de ${customer.customerName} estará disponible próximamente`,
                                  });
                                }}
                                data-testid={`button-view-customer-${index}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              <div className="text-sm font-medium text-gray-600 px-1">
                Todos los Clientes
              </div>
              {customersLoading ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    Cargando clientes...
                  </CardContent>
                </Card>
              ) : customersError ? (
                <Card>
                  <CardContent className="py-12 text-center text-red-500">
                    Error cargando clientes
                  </CardContent>
                </Card>
              ) : !customersData || customersData.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    No hay clientes registrados
                  </CardContent>
                </Card>
              ) : (
                customersData.map((customer: any, index: number) => (
                  <Card key={index} data-testid={`card-customer-${index}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base">
                            {customer.customerName} {customer.customerSurname}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{customer.customerNationality}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {customer.bookingsCount} {customer.bookingsCount === 1 ? 'reserva' : 'reservas'}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Ver historial",
                              description: `Historial de ${customer.customerName} estará disponible próximamente`,
                            });
                          }}
                          data-testid={`button-view-customer-${index}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3 mt-3">
                        <div>
                          <span className="text-gray-600">Gasto Total:</span>
                          <span className="ml-1 font-semibold">€{customer.totalSpent.toFixed(2)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-600">Última Reserva:</span>
                          <span className="ml-1 font-medium text-xs">
                            {format(new Date(customer.lastBookingDate), 'dd/MM/yy')}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600 text-xs">{customer.customerPhone}</span>
                          {customer.customerEmail && (
                            <span className="text-gray-600 text-xs ml-2">{customer.customerEmail}</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Customer Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {customersLoading ? "..." : customersError ? "Error" : customersData?.length ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clientes únicos registrados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mejor Cliente</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {customersLoading ? "..." : customersError ? "Error" : 
                      customersData && customersData.length > 0 
                        ? `${customersData[0].customerName} ${customersData[0].customerSurname}`
                        : "N/A"
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {customersData && customersData.length > 0 
                      ? `€${customersData[0].totalSpent.toFixed(2)} gastados`
                      : "Sin datos"
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Promedio por Cliente</CardTitle>
                  <Euro className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {customersLoading ? "..." : customersError ? "Error" : 
                      customersData && customersData.length > 0
                        ? `€${(customersData.reduce((sum: number, c: any) => sum + c.totalSpent, 0) / customersData.length).toFixed(2)}`
                        : "€0.00"
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Gasto promedio por cliente
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Fleet Tab */}
        {selectedTab === "fleet" && (
          <FleetManagement adminToken={adminToken} />
        )}
      </div>

      {/* Booking Details Modal */}
      <Dialog open={showBookingDetails} onOpenChange={setShowBookingDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Reserva" : "Detalles de la Reserva"}</DialogTitle>
            <DialogDescription>
              ID: {selectedBooking?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && !isEditing && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Informaci\u00f3n del Cliente</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Nombre Completo</p>
                    <p className="font-medium">{selectedBooking.customerName} {selectedBooking.customerSurname}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tel\u00e9fono</p>
                    <p className="font-medium">{selectedBooking.customerPhone}</p>
                  </div>
                  {selectedBooking.customerEmail && (
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="font-medium">{selectedBooking.customerEmail}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">Nacionalidad</p>
                    <p className="font-medium">{selectedBooking.customerNationality}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">N\u00famero de Personas</p>
                    <p className="font-medium">{selectedBooking.numberOfPeople}</p>
                  </div>
                </div>
              </div>

              {/* Booking Info */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Detalles de la Reserva</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Barco</p>
                    <p className="font-medium">{selectedBooking.boatId}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Fecha de Inicio</p>
                    <p className="font-medium">{format(new Date(selectedBooking.startTime), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Fecha de Fin</p>
                    <p className="font-medium">{format(new Date(selectedBooking.endTime), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Duraci\u00f3n</p>
                    <p className="font-medium">{selectedBooking.totalHours} horas</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Estado de Reserva</p>
                    <Badge variant={getStatusColor(selectedBooking.bookingStatus)}>
                      {getStatusLabel(selectedBooking.bookingStatus)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-gray-600">Estado de Pago</p>
                    <Badge variant={selectedBooking.paymentStatus === 'completed' ? 'default' : 'outline'}>
                      {selectedBooking.paymentStatus === 'completed' ? 'Pagado' : 
                       selectedBooking.paymentStatus === 'pending' ? 'Pendiente' :
                       selectedBooking.paymentStatus === 'failed' ? 'Fallido' : 'Reembolsado'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Informaci\u00f3n de Pago</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Subtotal</p>
                    <p className="font-medium">\u20ac{parseFloat(selectedBooking.subtotal).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Extras</p>
                    <p className="font-medium">\u20ac{parseFloat(selectedBooking.extrasTotal).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Dep\u00f3sito</p>
                    <p className="font-medium">\u20ac{parseFloat(selectedBooking.deposit).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total</p>
                    <p className="font-semibold text-lg">\u20ac{parseFloat(selectedBooking.totalAmount).toFixed(2)}</p>
                  </div>
                  {selectedBooking.stripePaymentIntentId && (
                    <div className="col-span-2">
                      <p className="text-gray-600">Stripe Payment Intent</p>
                      <p className="font-mono text-xs">{selectedBooking.stripePaymentIntentId}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              {(selectedBooking.notes || selectedBooking.couponCode) && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Informaci\u00f3n Adicional</h3>
                  <div className="space-y-2 text-sm">
                    {selectedBooking.couponCode && (
                      <div>
                        <p className="text-gray-600">C\u00f3digo de Descuento</p>
                        <p className="font-medium">{selectedBooking.couponCode}</p>
                      </div>
                    )}
                    {selectedBooking.notes && (
                      <div>
                        <p className="text-gray-600">Notas</p>
                        <p className="font-medium">{selectedBooking.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-3">Acciones</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedBooking.bookingStatus === 'pending_payment' && (
                    <Button
                      variant="default"
                      onClick={() => handleBookingAction("confirm", selectedBooking.id)}
                      data-testid="button-confirm-booking"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Confirmar Reserva
                    </Button>
                  )}
                  {(selectedBooking.bookingStatus === 'confirmed' || selectedBooking.bookingStatus === 'pending_payment') && (
                    <Button
                      variant="destructive"
                      onClick={() => handleBookingAction("cancel", selectedBooking.id)}
                      data-testid="button-cancel-booking"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar Reserva
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleBookingAction("edit", selectedBooking.id)}
                    data-testid="button-edit-booking"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-500 border-t pt-4">
                <p>Creada: {format(new Date(selectedBooking.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                <p>Fuente: {selectedBooking.source === 'web' ? 'Web' : 'Admin'}</p>
              </div>
            </div>
          )}

          {/* Edit Form */}
          {selectedBooking && isEditing && (
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Información del Cliente</h3>
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="customerPhone">Teléfono</Label>
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
                    <Label htmlFor="numberOfPeople">Número de Personas</Label>
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
                <div className="grid grid-cols-2 gap-4">
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
                      onValueChange={(value) => editForm.setValue("bookingStatus", value as any)}
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
                      onValueChange={(value) => editForm.setValue("paymentStatus", value as any)}
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
                <h3 className="font-semibold text-lg mb-3">Información de Pago</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subtotal">Subtotal (€)</Label>
                    <Input
                      id="subtotal"
                      {...editForm.register("subtotal")}
                      data-testid="input-subtotal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="extrasTotal">Extras (€)</Label>
                    <Input
                      id="extrasTotal"
                      {...editForm.register("extrasTotal")}
                      data-testid="input-extras-total"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deposit">Depósito (€)</Label>
                    <Input
                      id="deposit"
                      {...editForm.register("deposit")}
                      data-testid="input-deposit"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalAmount">Total (€)</Label>
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
                  disabled={editBookingMutation.isPending}
                  data-testid="button-save-booking"
                >
                  {editBookingMutation.isPending ? (
                    "Guardando..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={editBookingMutation.isPending}
                  data-testid="button-cancel-edit"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
          
          <DialogFooter>
            {!isEditing && (
              <Button variant="outline" onClick={() => setShowBookingDetails(false)} data-testid="button-close-modal">
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
