import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Download,
  Edit,
  Trash2,
  Check,
  Anchor,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient } from "@/lib/queryClient";
import { ImageGalleryUploader } from "@/components/ImageGalleryUploader";

import { boatSchema, type BoatFormData } from "./types";
import { EQUIPMENT_OPTIONS, INCLUDED_OPTIONS } from "./constants";

interface FleetManagementProps {
  adminToken: string;
}

// Sortable row component for drag and drop
function SortableBoatRow({
  boat,
  onEdit,
  onDelete,
}: {
  boat: any;
  onEdit: (boat: any) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: boat.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? "bg-gray-50" : ""}>
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
function SortableBoatCard({
  boat,
  onEdit,
  onDelete,
}: {
  boat: any;
  onEdit: (boat: any) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: boat.id,
  });

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

export function FleetManagement({ adminToken }: FleetManagementProps) {
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
    queryKey: ["/api/boats"],
  });

  // Initialize ordered boats when boats data changes
  useEffect(() => {
    if (boats) {
      const sorted = [...boats].sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
      setOrderedBoats(sorted);
    }
  }, [boats]);

  // Reorder boats mutation
  const reorderBoatsMutation = useMutation({
    mutationFn: async (newOrder: any[]) => {
      const response = await fetch("/api/admin/boats/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          order: newOrder.map((boat, index) => ({
            id: boat.id,
            displayOrder: index,
          })),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al reordenar barcos");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boats"] });
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
      setOrderedBoats(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

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
      const response = await fetch("/api/admin/boats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al crear el barco");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boats"] });
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
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al actualizar el barco");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boats"] });
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
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al eliminar el barco");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boats"] });
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
      const response = await fetch("/api/admin/init-boats", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al importar barcos");
      }
      return response.json();
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["/api/boats"] });
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
    setFeaturesText(boat.features?.join("\n") || "");
    setSelectedEquipment(boat.equipment || []);
    setSelectedIncluded(boat.included || []);

    boatForm.reset({
      id: boat.id,
      name: boat.name,
      capacity: boat.capacity,
      requiresLicense: boat.requiresLicense,
      deposit: boat.deposit,
      isActive: boat.isActive,
      imageUrl: boat.imageUrl || "",
      imageGallery: boat.imageGallery || [],
      subtitle: boat.subtitle || "",
      description: boat.description || "",
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
        BAJA: { period: "", prices: {} },
        MEDIA: { period: "", prices: {} },
        ALTA: { period: "", prices: {} },
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
      const numericDeposit = depositStr.replace(/[€$,\s]/g, "");
      formattedData.deposit = numericDeposit || "0";
    }

    if (editingBoat) {
      updateBoatMutation.mutate({ id: formattedData.id, data: formattedData });
    } else {
      createBoatMutation.mutate(formattedData);
    }
  };

  const resetDialog = () => {
    setShowBoatDialog(false);
    setEditingBoat(null);
    setFeaturesText("");
    setSelectedEquipment([]);
    setSelectedIncluded([]);
    boatForm.reset();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold">Gestión de Flota</h2>
        <Button
          onClick={() => {
            resetDialog();
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
            <p className="text-gray-600 mb-4">
              Importa los 7 barcos de la flota o agrega uno manualmente
            </p>
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
                          onDelete={id => deleteBoatMutation.mutate(id)}
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
                    onDelete={id => deleteBoatMutation.mutate(id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </>
      )}

      {/* Add/Edit Boat Dialog - Mobile fullscreen */}
      <Dialog open={showBoatDialog} onOpenChange={setShowBoatDialog}>
        <DialogContent
          className="
          w-full h-full
          md:w-auto md:h-auto
          md:max-w-4xl md:max-h-[90vh]
          overflow-y-auto
          p-4 sm:p-6
          !left-0 !top-0 !translate-x-0 !translate-y-0
          md:!left-1/2 md:!top-1/2 md:!-translate-x-1/2 md:!-translate-y-1/2
        "
        >
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
                <Label htmlFor="imageUrl">URL Imagen Principal (auto-sincronizada)</Label>
                <Input
                  id="imageUrl"
                  value={boatForm.watch("imageUrl") || ""}
                  placeholder="Se sincroniza automáticamente con la primera imagen de la galería"
                  data-testid="input-boat-image-url"
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  La primera imagen de la galería se usa como imagen principal en el grid de inicio
                </p>
              </div>
              <div>
                <Label>Galería de Imágenes</Label>
                <ImageGalleryUploader
                  images={boatForm.watch("imageGallery") || []}
                  onImagesChange={images => {
                    boatForm.setValue("imageGallery", images);
                    // Sync imageUrl with first image
                    if (images.length > 0) {
                      boatForm.setValue("imageUrl", images[0]);
                    } else {
                      boatForm.setValue("imageUrl", "");
                    }
                  }}
                  onMainImageChange={mainImageUrl => {
                    // Update imageUrl when main image changes
                    boatForm.setValue("imageUrl", mainImageUrl || "");
                  }}
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
                  onChange={e => {
                    setFeaturesText(e.target.value);
                    const features = e.target.value.split("\n").filter(f => f.trim());
                    boatForm.setValue("features", features);
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
                    {...boatForm.register("specifications.model")}
                    data-testid="input-boat-model"
                  />
                </div>
                <div>
                  <Label>Eslora</Label>
                  <Input
                    placeholder="4,50m"
                    {...boatForm.register("specifications.length")}
                    data-testid="input-boat-length"
                  />
                </div>
                <div>
                  <Label>Manga</Label>
                  <Input
                    placeholder="1,50m"
                    {...boatForm.register("specifications.beam")}
                    data-testid="input-boat-beam"
                  />
                </div>
                <div>
                  <Label>Motor</Label>
                  <Input
                    placeholder="Mercury 15cv 4t"
                    {...boatForm.register("specifications.engine")}
                    data-testid="input-boat-engine"
                  />
                </div>
                <div>
                  <Label>Combustible</Label>
                  <Input
                    placeholder="Gasolina 30L"
                    {...boatForm.register("specifications.fuel")}
                    data-testid="input-boat-fuel"
                  />
                </div>
                <div>
                  <Label>Capacidad</Label>
                  <Input
                    placeholder="5 Personas"
                    {...boatForm.register("specifications.capacity")}
                    data-testid="input-boat-capacity"
                  />
                </div>
                <div>
                  <Label>Fianza</Label>
                  <Input
                    placeholder="300€"
                    {...boatForm.register("specifications.deposit")}
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
                  {EQUIPMENT_OPTIONS.map(equipment => {
                    const Icon = equipment.icon;
                    const isSelected = selectedEquipment.includes(equipment.label);

                    return (
                      <div
                        key={equipment.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/10 border-primary" : "hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          const newEquipment = isSelected
                            ? selectedEquipment.filter(e => e !== equipment.label)
                            : [...selectedEquipment, equipment.label];
                          setSelectedEquipment(newEquipment);
                          boatForm.setValue("equipment", newEquipment);
                        }}
                        data-testid={`checkbox-equipment-${equipment.id}`}
                      >
                        <div
                          className={`w-5 h-5 flex items-center justify-center border rounded ${
                            isSelected ? "bg-primary border-primary" : "border-gray-300"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <Icon
                          className={`w-5 h-5 ${isSelected ? "text-primary" : "text-gray-600"}`}
                        />
                        <span className={`text-sm ${isSelected ? "font-medium" : ""}`}>
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
                  {INCLUDED_OPTIONS.map(item => {
                    const Icon = item.icon;
                    const isSelected = selectedIncluded.includes(item.label);

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/10 border-primary" : "hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          const newIncluded = isSelected
                            ? selectedIncluded.filter(i => i !== item.label)
                            : [...selectedIncluded, item.label];
                          setSelectedIncluded(newIncluded);
                          boatForm.setValue("included", newIncluded);
                        }}
                        data-testid={`checkbox-included-${item.id}`}
                      >
                        <div
                          className={`w-5 h-5 flex items-center justify-center border rounded ${
                            isSelected ? "bg-primary border-primary" : "border-gray-300"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <Icon
                          className={`w-5 h-5 ${isSelected ? "text-primary" : "text-gray-600"}`}
                        />
                        <span className={`text-sm ${isSelected ? "font-medium" : ""}`}>
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
                  onChange={e => boatForm.setValue("pricing.BAJA.period", e.target.value)}
                />
                <div className="grid grid-cols-3 gap-2">
                  {boatForm.watch("requiresLicense") ? (
                    <>
                      <div>
                        <Label className="text-xs">2h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.BAJA.prices.2h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">4h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.BAJA.prices.4h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">8h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.BAJA.prices.8h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-xs">1h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.BAJA.prices.1h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">2h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.BAJA.prices.2h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">3h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.BAJA.prices.3h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">4h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.BAJA.prices.4h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">6h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.BAJA.prices.6h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">8h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.BAJA.prices.8h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
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
                  onChange={e => boatForm.setValue("pricing.MEDIA.period", e.target.value)}
                />
                <div className="grid grid-cols-3 gap-2">
                  {boatForm.watch("requiresLicense") ? (
                    <>
                      <div>
                        <Label className="text-xs">2h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.MEDIA.prices.2h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">4h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.MEDIA.prices.4h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">8h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.MEDIA.prices.8h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-xs">1h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.MEDIA.prices.1h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">2h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.MEDIA.prices.2h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">3h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.MEDIA.prices.3h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">4h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.MEDIA.prices.4h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">6h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.MEDIA.prices.6h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">8h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.MEDIA.prices.8h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
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
                  onChange={e => boatForm.setValue("pricing.ALTA.period", e.target.value)}
                />
                <div className="grid grid-cols-3 gap-2">
                  {boatForm.watch("requiresLicense") ? (
                    <>
                      <div>
                        <Label className="text-xs">2h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.ALTA.prices.2h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">4h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.ALTA.prices.4h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">8h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.ALTA.prices.8h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-xs">1h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.ALTA.prices.1h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">2h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.ALTA.prices.2h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">3h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.ALTA.prices.3h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">4h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.ALTA.prices.4h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">6h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.ALTA.prices.6h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">8h</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          onChange={e =>
                            boatForm.setValue(
                              "pricing.ALTA.prices.8h",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
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
                onClick={resetDialog}
                data-testid="button-cancel-boat"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createBoatMutation.isPending || updateBoatMutation.isPending}
                data-testid="button-save-boat"
              >
                {createBoatMutation.isPending || updateBoatMutation.isPending
                  ? "Guardando..."
                  : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
