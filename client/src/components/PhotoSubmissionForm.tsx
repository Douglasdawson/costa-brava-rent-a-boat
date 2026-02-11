import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "@/lib/translations";
import type { Boat } from "@shared/schema";

interface PhotoSubmissionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function PhotoSubmissionForm({ open, onOpenChange, onSuccess }: PhotoSubmissionFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [caption, setCaption] = useState("");
  const [boatId, setBoatId] = useState("");
  const [tripDate, setTripDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const t = useTranslations();

  const { data: boats = [] } = useQuery<Boat[]>({
    queryKey: ["/api/boats"],
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Solo se permiten imagenes" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "La imagen no puede superar 10MB" });
      return;
    }

    setIsUploading(true);
    try {
      // Get upload URL
      const urlRes = await fetch("/api/gallery/upload-url", { method: "POST" });
      if (!urlRes.ok) throw new Error("Error getting upload URL");
      const { uploadURL } = await urlRes.json();

      // Upload the image
      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadRes.ok) throw new Error("Error uploading image");

      // Extract the path from the upload URL
      const url = new URL(uploadURL);
      setImageUrl(url.pathname);
      toast({ title: "Imagen subida correctamente" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast({ variant: "destructive", title: "Error subiendo imagen", description: message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      toast({ variant: "destructive", title: "El nombre es requerido" });
      return;
    }
    if (!imageUrl) {
      toast({ variant: "destructive", title: "Sube una foto primero" });
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedBoat = boats.find((b) => b.id === boatId);
      const res = await fetch("/api/gallery/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          caption: caption || null,
          customerName: customerName.trim(),
          boatName: selectedBoat?.name || null,
          boatId: boatId || null,
          tripDate: tripDate || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      toast({ title: "Foto enviada", description: "Sera revisada antes de publicarse." });
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast({ variant: "destructive", title: "Error", description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setCaption("");
    setBoatId("");
    setTripDate("");
    setImageUrl("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {t.gallery?.submitTitle || "Comparte tu foto"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Image upload */}
          <div className="space-y-2">
            <Label>{t.gallery?.photo || "Foto"}</Label>
            {imageUrl ? (
              <div className="relative">
                <img src={imageUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setImageUrl("")}
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">
                  {isUploading ? "Subiendo..." : "Haz clic para subir una imagen"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo-name">{t.gallery?.yourName || "Tu nombre"}</Label>
            <Input
              id="photo-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nombre y apellido"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo-caption">{t.gallery?.caption || "Descripcion (opcional)"}</Label>
            <Textarea
              id="photo-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Cuenta tu experiencia..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="photo-boat">{t.gallery?.boat || "Barco"}</Label>
              <select
                id="photo-boat"
                value={boatId}
                onChange={(e) => setBoatId(e.target.value)}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="">Seleccionar...</option>
                {boats.filter(b => b.isActive).map((boat) => (
                  <option key={boat.id} value={boat.id}>{boat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo-date">{t.gallery?.tripDate || "Fecha"}</Label>
              <Input
                id="photo-date"
                type="date"
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common?.cancel || "Cancelar"}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isUploading}>
            {isSubmitting ? "Enviando..." : (t.gallery?.submit || "Enviar foto")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
