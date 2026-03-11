import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Check, Download, Loader2 } from "lucide-react";
import { ImageGalleryUploader } from "@/components/ImageGalleryUploader";
import { EQUIPMENT_OPTIONS, INCLUDED_OPTIONS } from "../constants";
import type { BoatFormData } from "../types";
import type { BoatListItem } from "./BoatListTable";
import { PricingSeasonSection } from "./PricingSeasonSection";

interface BoatFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBoat: BoatListItem | null;
  form: UseFormReturn<BoatFormData>;
  featuresText: string;
  onFeaturesTextChange: (text: string) => void;
  selectedEquipment: string[];
  onSelectedEquipmentChange: (equipment: string[]) => void;
  selectedIncluded: string[];
  onSelectedIncludedChange: (included: string[]) => void;
  onSubmit: (data: BoatFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function BoatFormDialog({
  open,
  onOpenChange,
  editingBoat,
  form,
  featuresText,
  onFeaturesTextChange,
  selectedEquipment,
  onSelectedEquipmentChange,
  selectedIncluded,
  onSelectedIncludedChange,
  onSubmit,
  onCancel,
  isSaving,
}: BoatFormDialogProps) {
  const requiresLicense = form.watch("requiresLicense");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-3 sm:p-4 md:p-6">
        <DialogHeader>
          <DialogTitle>{editingBoat ? "Editar Barco" : "Agregar Barco"}</DialogTitle>
          <DialogDescription>Complete todos los campos del barco</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold font-heading">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="id">ID del Barco *</Label>
                <Input
                  id="id"
                  {...form.register("id")}
                  placeholder="solar-450"
                  disabled={!!editingBoat}
                  data-testid="input-boat-id"
                />
                {form.formState.errors.id && (
                  <p className="text-sm text-red-500">{form.formState.errors.id.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Solar 450"
                  data-testid="input-boat-name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="subtitle">Subtitulo</Label>
              <Input
                id="subtitle"
                {...form.register("subtitle")}
                placeholder="Barco sin licencia para alquilar en Blanes!"
                data-testid="input-boat-subtitle"
              />
            </div>

            <div>
              <Label htmlFor="description">Descripcion</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Descripcion detallada del barco..."
                rows={4}
                data-testid="input-boat-description"
              />
            </div>
          </div>

          {/* Imagenes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold font-heading">Imagenes</h3>
              {(form.watch("imageGallery") || []).length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const images = form.watch("imageGallery") || [];
                    const boatName = form.watch("name") || form.watch("id") || "barco";
                    images.forEach((url, i) => {
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `${boatName.replace(/\s+/g, "-").toLowerCase()}-${i + 1}`;
                      link.target = "_blank";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    });
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Descargar ({(form.watch("imageGallery") || []).length})
                </Button>
              )}
            </div>
            <div>
              <Label htmlFor="imageUrl">URL Imagen Principal (auto-sincronizada)</Label>
              <Input
                id="imageUrl"
                value={form.watch("imageUrl") || ""}
                placeholder="Se sincroniza automaticamente con la primera imagen de la galeria"
                data-testid="input-boat-image-url"
                readOnly
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                La primera imagen de la galeria se usa como imagen principal en el grid de inicio
              </p>
            </div>
            <div>
              <Label>Galeria de Imagenes</Label>
              <ImageGalleryUploader
                images={form.watch("imageGallery") || []}
                onImagesChange={images => {
                  form.setValue("imageGallery", images);
                  // Sync imageUrl with first image
                  if (images.length > 0) {
                    form.setValue("imageUrl", images[0]);
                  } else {
                    form.setValue("imageUrl", "");
                  }
                }}
                onMainImageChange={mainImageUrl => {
                  // Update imageUrl when main image changes
                  form.setValue("imageUrl", mainImageUrl || "");
                }}
                maxImages={10}
              />
            </div>
          </div>

          {/* Caracteristicas Principales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold font-heading">Caracteristicas Principales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacity">Capacidad (personas) *</Label>
                <Input
                  id="capacity"
                  type="number"
                  {...form.register("capacity")}
                  placeholder="6"
                  data-testid="input-boat-capacity"
                />
                {form.formState.errors.capacity && (
                  <p className="text-sm text-red-500">{form.formState.errors.capacity.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="deposit">Depósito ({"\u20AC"}) *</Label>
                <Input
                  id="deposit"
                  {...form.register("deposit")}
                  placeholder="300.00"
                  data-testid="input-main-deposit"
                />
                {form.formState.errors.deposit && (
                  <p className="text-sm text-red-500">{form.formState.errors.deposit.message}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 md:gap-6">
              <div className="p-2 -m-2 rounded">
                <div className="flex items-center space-x-2">
                  <input
                    id="requiresLicense"
                    type="checkbox"
                    {...form.register("requiresLicense")}
                    className="w-4 h-4"
                    data-testid="checkbox-requires-license"
                  />
                  <Label htmlFor="requiresLicense">Requiere licencia nautica</Label>
                </div>
              </div>
              <div className="p-2 -m-2 rounded">
                <div className="flex items-center space-x-2">
                  <input
                    id="isActive"
                    type="checkbox"
                    {...form.register("isActive")}
                    className="w-4 h-4"
                    data-testid="checkbox-is-active"
                  />
                  <Label htmlFor="isActive">Barco activo</Label>
                </div>
              </div>
            </div>
            <div>
              <Label>Caracteristicas (una por linea)</Label>
              <Textarea
                placeholder={"Sin licencia requerida\nHasta 5 personas\nGasolina incluida"}
                rows={4}
                value={featuresText}
                onChange={e => {
                  onFeaturesTextChange(e.target.value);
                  const features = e.target.value.split("\n").filter(f => f.trim());
                  form.setValue("features", features);
                }}
                data-testid="input-boat-features"
              />
            </div>
          </div>

          {/* Especificaciones Tecnicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold font-heading">Especificaciones Tecnicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Modelo</Label>
                <Input
                  placeholder="Solar 450"
                  {...form.register("specifications.model")}
                  data-testid="input-boat-model"
                />
              </div>
              <div>
                <Label>Eslora</Label>
                <Input
                  placeholder="4,50m"
                  {...form.register("specifications.length")}
                  data-testid="input-boat-length"
                />
              </div>
              <div>
                <Label>Manga</Label>
                <Input
                  placeholder="1,50m"
                  {...form.register("specifications.beam")}
                  data-testid="input-boat-beam"
                />
              </div>
              <div>
                <Label>Motor</Label>
                <Input
                  placeholder="Mercury 15cv 4t"
                  {...form.register("specifications.engine")}
                  data-testid="input-boat-engine"
                />
              </div>
              <div>
                <Label>Combustible</Label>
                <Input
                  placeholder="Gasolina 30L"
                  {...form.register("specifications.fuel")}
                  data-testid="input-boat-fuel"
                />
              </div>
              <div>
                <Label>Capacidad</Label>
                <Input
                  placeholder="5 Personas"
                  {...form.register("specifications.capacity")}
                  data-testid="input-boat-capacity"
                />
              </div>
              <div>
                <Label>Fianza</Label>
                <Input
                  placeholder="300"
                  {...form.register("specifications.deposit")}
                  data-testid="input-spec-fianza"
                />
              </div>
            </div>
          </div>

          {/* Equipamiento */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold font-heading">Equipamiento e Incluido</h3>
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
                        isSelected ? "bg-primary/10 border-primary" : "hover:bg-muted"
                      }`}
                      onClick={() => {
                        const newEquipment = isSelected
                          ? selectedEquipment.filter(e => e !== equipment.label)
                          : [...selectedEquipment, equipment.label];
                        onSelectedEquipmentChange(newEquipment);
                        form.setValue("equipment", newEquipment);
                      }}
                      data-testid={`checkbox-equipment-${equipment.id}`}
                    >
                      <div
                        className={`w-5 h-5 flex items-center justify-center border rounded ${
                          isSelected ? "bg-primary border-primary" : "border-border"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <Icon
                        className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
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
                        isSelected ? "bg-primary/10 border-primary" : "hover:bg-muted"
                      }`}
                      onClick={() => {
                        const newIncluded = isSelected
                          ? selectedIncluded.filter(i => i !== item.label)
                          : [...selectedIncluded, item.label];
                        onSelectedIncludedChange(newIncluded);
                        form.setValue("included", newIncluded);
                      }}
                      data-testid={`checkbox-included-${item.id}`}
                    >
                      <div
                        className={`w-5 h-5 flex items-center justify-center border rounded ${
                          isSelected ? "bg-primary border-primary" : "border-border"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <Icon
                        className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
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
            <h3 className="text-lg font-semibold font-heading">Precios por Temporada</h3>
            <PricingSeasonSection
              seasonKey="BAJA"
              seasonLabel="BAJA"
              periodPlaceholder="Periodo (ej: Abril-Junio, Septiembre-Cierre)"
              requiresLicense={requiresLicense}
              form={form}
            />
            <PricingSeasonSection
              seasonKey="MEDIA"
              seasonLabel="MEDIA"
              periodPlaceholder="Periodo (ej: Julio)"
              requiresLicense={requiresLicense}
              form={form}
            />
            <PricingSeasonSection
              seasonKey="ALTA"
              seasonLabel="ALTA"
              periodPlaceholder="Periodo (ej: Agosto)"
              requiresLicense={requiresLicense}
              form={form}
            />
          </div>

          {Object.keys(form.formState.errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <p className="font-medium">Corrige los siguientes errores:</p>
              <ul className="list-disc list-inside mt-1">
                {Object.entries(form.formState.errors).map(([field, error]) => (
                  <li key={field}>{field}: {(error as Record<string, unknown>)?.message as string || 'Campo invalido'}</li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              data-testid="button-cancel-boat"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              data-testid="button-save-boat"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
