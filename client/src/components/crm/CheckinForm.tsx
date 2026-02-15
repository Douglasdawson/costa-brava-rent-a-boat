import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/components/ui/dialog";
import { Loader2, Save } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SignatureCanvas } from "./SignatureCanvas";

interface CheckinFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  boatId: string;
  type: "checkin" | "checkout";
  adminToken: string;
  onSuccess?: () => void;
}

const CHECKIN_ITEMS = [
  "Chalecos salvavidas",
  "Extintor",
  "Botiquin",
  "Ancla y cadena",
  "Defensas",
  "Escalera de bano",
  "Toldo/bimini",
  "Motor OK",
  "Direccion OK",
  "Electronica OK",
];

const CHECKOUT_ITEMS = [
  "Estado casco OK",
  "Motor OK",
  "Equipo seguridad completo",
  "Extras devueltos",
  "Llaves devueltas",
  "Limpieza aceptable",
];

export function CheckinForm({
  open,
  onOpenChange,
  bookingId,
  boatId,
  type,
  adminToken,
  onSuccess,
}: CheckinFormProps) {
  const { toast } = useToast();
  const isCheckin = type === "checkin";
  const title = isCheckin ? "Check-in" : "Check-out";
  const checklistItems = isCheckin ? CHECKIN_ITEMS : CHECKOUT_ITEMS;

  // Form state
  const [fuelLevel, setFuelLevel] = useState<string>("full");
  const [condition, setCondition] = useState<string>("good");
  const [engineHours, setEngineHours] = useState("");
  const [notes, setNotes] = useState("");
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Array<{ item: string; checked: boolean }>>(
    checklistItems.map((item) => ({ item, checked: false }))
  );

  // Toggle checklist item
  const toggleChecklistItem = (index: number) => {
    setChecklist((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      )
    );
  };

  // Check all
  const checkAll = () => {
    setChecklist((prev) => prev.map((item) => ({ ...item, checked: true })));
  };

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const body = {
        bookingId,
        boatId,
        type,
        fuelLevel,
        condition,
        engineHours: engineHours || null,
        notes: notes || null,
        signatureUrl,
        checklist,
        photos: null,
      };

      const response = await fetch("/api/admin/checkins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: "Error" }));
        throw new Error(err.message || "Error creating checkin");
      }
      return response.json();
    },
    onSuccess: (data: { message: string }) => {
      toast({
        title: `${title} registrado`,
        description: data.message || `${title} guardado correctamente`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/checkins"] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar {title}</DialogTitle>
          <DialogDescription>
            Completa el formulario de {title.toLowerCase()} para esta reserva
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Fuel Level */}
          <div>
            <Label htmlFor="fuel-level">Nivel de Combustible</Label>
            <Select value={fuelLevel} onValueChange={setFuelLevel}>
              <SelectTrigger id="fuel-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full (Lleno)</SelectItem>
                <SelectItem value="3/4">3/4</SelectItem>
                <SelectItem value="1/2">1/2</SelectItem>
                <SelectItem value="1/4">1/4</SelectItem>
                <SelectItem value="empty">Vacio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Condition */}
          <div>
            <Label htmlFor="condition">Estado General</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger id="condition">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excelente</SelectItem>
                <SelectItem value="good">Bueno</SelectItem>
                <SelectItem value="fair">Regular</SelectItem>
                <SelectItem value="poor">Malo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Engine Hours */}
          <div>
            <Label htmlFor="engine-hours">Horas Motor (opcional)</Label>
            <Input
              id="engine-hours"
              type="number"
              step="0.1"
              value={engineHours}
              onChange={(e) => setEngineHours(e.target.value)}
              placeholder="Ej: 150.5"
            />
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Lista de Verificacion</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={checkAll}
                className="text-xs"
              >
                Marcar todos
              </Button>
            </div>
            <div className="space-y-2 bg-gray-50 rounded-lg p-3">
              {checklist.map((item, index) => (
                <div key={item.item} className="flex items-center space-x-3">
                  <Checkbox
                    id={`checklist-${index}`}
                    checked={item.checked}
                    onCheckedChange={() => toggleChecklistItem(index)}
                  />
                  <label
                    htmlFor={`checklist-${index}`}
                    className={`text-sm cursor-pointer select-none ${
                      item.checked ? "text-green-700 line-through" : "text-gray-700"
                    }`}
                  >
                    {item.item}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="checkin-notes">Observaciones (opcional)</Label>
            <Textarea
              id="checkin-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas u observaciones..."
              rows={3}
            />
          </div>

          {/* Signature */}
          <div>
            <Label>Firma del Cliente</Label>
            {signatureUrl ? (
              <div className="space-y-2">
                <div className="border rounded-lg p-2 bg-white">
                  <img
                    src={signatureUrl}
                    alt="Firma"
                    className="w-full h-24 object-contain"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSignatureUrl(null)}
                >
                  Cambiar Firma
                </Button>
              </div>
            ) : (
              <SignatureCanvas
                onSave={(dataUrl) => setSignatureUrl(dataUrl)}
                onClear={() => setSignatureUrl(null)}
                height={150}
              />
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar {title}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitMutation.isPending}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
