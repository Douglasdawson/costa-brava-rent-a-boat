import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Plus } from "lucide-react";
import { arrayMove } from "@dnd-kit/sortable";
import { DragEndEvent } from "@dnd-kit/core";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient } from "@/lib/queryClient";

import { boatSchema, type BoatFormData } from "./types";
import { BoatFormDialog } from "./fleet/BoatFormDialog";
import { BoatListTable, type BoatListItem } from "./fleet/BoatListTable";

interface FleetManagementProps {
  adminToken: string;
}

export function FleetManagement({ adminToken }: FleetManagementProps) {
  const [showBoatDialog, setShowBoatDialog] = useState(false);
  const [editingBoat, setEditingBoat] = useState<BoatListItem | null>(null);
  const [featuresText, setFeaturesText] = useState("");
  const [deactivateTarget, setDeactivateTarget] = useState<{ id: string; name: string } | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedIncluded, setSelectedIncluded] = useState<string[]>([]);
  const [orderedBoats, setOrderedBoats] = useState<BoatListItem[]>([]);
  const { toast } = useToast();

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
  const { data: boats, isLoading: boatsLoading } = useQuery<BoatListItem[]>({
    queryKey: ["/api/admin/boats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/boats", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error("Error al cargar la flota");
      return res.json();
    },
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
    mutationFn: async (newOrder: BoatListItem[]) => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/boats"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/boats"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/boats"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/boats"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/boats"] });
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

  const handleEditBoat = (boat: BoatListItem) => {
    setEditingBoat(boat);

    // Set textarea states for editing
    setFeaturesText((boat.features as string[])?.join("\n") || "");
    setSelectedEquipment((boat.equipment as string[]) || []);
    setSelectedIncluded((boat.included as string[]) || []);

    boatForm.reset({
      id: boat.id as string,
      name: boat.name as string,
      capacity: boat.capacity as number,
      requiresLicense: boat.requiresLicense as boolean,
      deposit: boat.deposit as string,
      isActive: boat.isActive as boolean,
      imageUrl: (boat.imageUrl as string) || "",
      imageGallery: (boat.imageGallery as string[]) || [],
      subtitle: (boat.subtitle as string) || "",
      description: (boat.description as string) || "",
      specifications: (boat.specifications as BoatFormData["specifications"]) || {
        model: "",
        length: "",
        beam: "",
        engine: "",
        fuel: "",
        capacity: "",
        deposit: "",
      },
      equipment: (boat.equipment as string[]) || [],
      included: (boat.included as string[]) || [],
      features: (boat.features as string[]) || [],
      pricing: (boat.pricing as BoatFormData["pricing"]) || {
        BAJA: { period: "", prices: {} },
        MEDIA: { period: "", prices: {} },
        ALTA: { period: "", prices: {} },
      },
      extras: (boat.extras as BoatFormData["extras"]) || [],
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
        <h2 className="text-xl sm:text-2xl font-bold font-heading">Gestion de Flota</h2>
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

      <BoatListTable
        boats={boats}
        orderedBoats={orderedBoats}
        loading={boatsLoading}
        onEdit={handleEditBoat}
        onDeactivate={(id, name) => setDeactivateTarget({ id, name })}
        onDragEnd={handleDragEnd}
        onImport={() => importBoatsMutation.mutate()}
        onAdd={() => setShowBoatDialog(true)}
        isImporting={importBoatsMutation.isPending}
      />

      <BoatFormDialog
        open={showBoatDialog}
        onOpenChange={setShowBoatDialog}
        editingBoat={editingBoat}
        form={boatForm}
        featuresText={featuresText}
        onFeaturesTextChange={setFeaturesText}
        selectedEquipment={selectedEquipment}
        onSelectedEquipmentChange={setSelectedEquipment}
        selectedIncluded={selectedIncluded}
        onSelectedIncludedChange={setSelectedIncluded}
        onSubmit={handleSubmit}
        onCancel={resetDialog}
        isSaving={createBoatMutation.isPending || updateBoatMutation.isPending}
      />

      <AlertDialog open={!!deactivateTarget} onOpenChange={(open) => !open && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar desactivacion</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de desactivar {deactivateTarget?.name}? El barco dejara de estar disponible para reservas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteBoatMutation.mutate(deactivateTarget!.id); setDeactivateTarget(null); }}>
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
