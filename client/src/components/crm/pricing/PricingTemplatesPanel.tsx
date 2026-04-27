import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Sparkles } from "lucide-react";
import { TEMPLATE_DEFINITIONS, type TemplateId } from "./types";

export function PricingTemplatesPanel() {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [pendingId, setPendingId] = useState<TemplateId | null>(null);

  const applyMutation = useMutation({
    mutationFn: async (templateId: TemplateId) => {
      setPendingId(templateId);
      const res = await fetch(`/api/admin/pricing-overrides/templates/${templateId}/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Error aplicando plantilla");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing-overrides"] });
      toast({ title: "Plantilla aplicada", description: data.label });
      setPendingId(null);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
      setPendingId(null);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Plantillas rápidas
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Basadas en el análisis de 6 años de reservas (2020-2025). Aplica con un clic.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 max-w-xs">
          <Label htmlFor="year-select" className="whitespace-nowrap">Año:</Label>
          <Input
            id="year-select"
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value) || currentYear)}
            min={currentYear}
            max={currentYear + 5}
            className="w-24"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TEMPLATE_DEFINITIONS.map((tpl) => (
            <Card key={tpl.id} className="border-2 hover:border-primary/40 transition-colors">
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm leading-tight">{tpl.label}</h4>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {tpl.badge}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground min-h-[2.5rem]">
                  {tpl.description}
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={applyMutation.isPending}
                  onClick={() => applyMutation.mutate(tpl.id)}
                >
                  {pendingId === tpl.id ? (
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  ) : null}
                  Aplicar a {year}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
