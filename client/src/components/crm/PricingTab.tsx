import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp } from "lucide-react";
import { PricingTemplatesPanel } from "./pricing/PricingTemplatesPanel";
import { PricingOverridesList } from "./pricing/PricingOverridesList";
import { PricingOverrideModal } from "./pricing/PricingOverrideModal";
import type { PricingOverride } from "./pricing/types";

interface PricingTabProps {
  adminToken: string;
}

export function PricingTab({ adminToken: _adminToken }: PricingTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOverride, setEditingOverride] = useState<PricingOverride | null>(null);

  const openCreate = () => {
    setEditingOverride(null);
    setModalOpen(true);
  };

  const openEdit = (override: PricingOverride) => {
    setEditingOverride(override);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Precios dinámicos
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mt-1">
            Define ajustes sobre la tarifa base para rangos de fechas concretos. Útil para semanas
            pico (la 1ª-2ª semana de agosto vende 1.7-2.5x más que la 2ª quincena), festivos, o
            promociones puntuales. Los ajustes se aplican antes de cualquier cupón de descuento.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo override
        </Button>
      </div>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Cómo funcionan</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>· El precio final = tarifa base × temporada × recargo finde × override × cupón</p>
          <p>· Solo un override puede aplicar por fecha+barco. Si hay varios, gana el más específico (un barco concreto antes que «todos»), luego mayor prioridad, luego más reciente.</p>
          <p>· Eliminar un override lo desactiva (las reservas pasadas conservan el precio que pagaron).</p>
          <p>· MVP: solo subidas. Las promociones a la baja llegarán en una próxima versión.</p>
        </CardContent>
      </Card>

      <PricingTemplatesPanel />

      <PricingOverridesList onEdit={openEdit} />

      <PricingOverrideModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        override={editingOverride}
      />
    </div>
  );
}
