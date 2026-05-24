import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronUp,
  History,
  PlusCircle,
  Pencil,
  Trash2,
  RotateCcw,
  Layers,
  HelpCircle,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";

interface AuditLogEntry {
  id: string;
  userId: string | null;
  username: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string; // serialized
}

const ACTION_META: Record<
  string,
  { label: string; Icon: typeof PlusCircle; tone: "create" | "edit" | "deactivate" | "activate" | "template" | "default" }
> = {
  create: { label: "Creó override", Icon: PlusCircle, tone: "create" },
  update: { label: "Editó override", Icon: Pencil, tone: "edit" },
  deactivate: { label: "Desactivó override", Icon: Trash2, tone: "deactivate" },
  bulk_deactivate: { label: "Desactivó en lote", Icon: Trash2, tone: "deactivate" },
  bulk_activate: { label: "Reactivó en lote", Icon: RotateCcw, tone: "activate" },
  apply_template: { label: "Aplicó plantilla", Icon: Layers, tone: "template" },
};

const TONE_CLASSES: Record<string, string> = {
  create: "bg-success/10 text-success border-success/30",
  edit: "bg-muted text-foreground border-border",
  deactivate: "bg-destructive/10 text-destructive border-destructive/30",
  activate: "bg-success/10 text-success border-success/30",
  template: "bg-popular/10 text-foreground border-popular/30",
  default: "bg-muted text-muted-foreground border-border",
};

function summarize(entry: AuditLogEntry): string {
  const d = entry.details ?? {};
  switch (entry.action) {
    case "create":
      return typeof d.label === "string" ? d.label : "(sin nombre)";
    case "update": {
      const changes = Array.isArray(d.changes) ? (d.changes as string[]) : [];
      if (changes.length === 0) return "sin cambios detectados";
      if (changes.length <= 3) return `cambió ${changes.join(", ")}`;
      return `cambió ${changes.slice(0, 3).join(", ")} +${changes.length - 3}`;
    }
    case "deactivate":
      return "fila eliminada del listado activo";
    case "bulk_deactivate": {
      const got = typeof d.deactivatedCount === "number" ? d.deactivatedCount : 0;
      const asked = typeof d.requestedCount === "number" ? d.requestedCount : got;
      return got === asked ? `${got} overrides` : `${got} de ${asked} (resto ya inactivos)`;
    }
    case "bulk_activate": {
      const got = typeof d.activatedCount === "number" ? d.activatedCount : 0;
      const asked = typeof d.requestedCount === "number" ? d.requestedCount : got;
      return got === asked ? `${got} overrides` : `${got} de ${asked} (resto ya activos)`;
    }
    case "apply_template": {
      const tpl = typeof d.templateId === "string" ? d.templateId : "?";
      const year = typeof d.year === "number" ? d.year : "?";
      const count = typeof d.createdCount === "number" ? d.createdCount : 1;
      return `${tpl} (${year}) · ${count} ${count === 1 ? "override" : "overrides"}`;
    }
    default:
      return entry.action;
  }
}

export function PricingAuditPanel() {
  const [open, setOpen] = useState(false);

  const { data: entries = [], isLoading } = useQuery<AuditLogEntry[]>({
    queryKey: ["/api/admin/pricing-overrides/audit"],
    queryFn: async () => {
      const res = await fetch("/api/admin/pricing-overrides/audit?limit=50", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error cargando histórico");
      return res.json();
    },
    enabled: open, // lazy: only fetch when the user opens the panel
    refetchOnWindowFocus: false,
  });

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
        role="button"
        aria-expanded={open}
      >
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4" />
            Histórico de cambios
            <span className="text-xs font-normal text-muted-foreground">
              {open ? "(últimos 50)" : "(haz clic para abrir)"}
            </span>
          </CardTitle>
          {open ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {open && (
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2 text-center">
              No hay actividad registrada todavía.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {entries.map((entry) => {
                const meta = ACTION_META[entry.action] ?? {
                  label: entry.action,
                  Icon: HelpCircle,
                  tone: "default" as const,
                };
                const Icon = meta.Icon;
                const created = new Date(entry.createdAt);
                const relative = formatDistanceToNow(created, { locale: es, addSuffix: true });
                const absolute = format(created, "d MMM yyyy HH:mm", { locale: es });
                return (
                  <li
                    key={entry.id}
                    className="flex items-start gap-3 text-xs py-2 border-b last:border-b-0"
                  >
                    <Badge
                      variant="outline"
                      className={`shrink-0 gap-1 ${TONE_CLASSES[meta.tone]}`}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="hidden sm:inline">{meta.label}</span>
                    </Badge>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-foreground">
                        <span className="font-medium">{entry.username ?? "sistema"}</span>{" "}
                        <span className="text-muted-foreground sm:hidden">· {meta.label}</span>{" "}
                        <span className="text-muted-foreground">— {summarize(entry)}</span>
                      </p>
                    </div>
                    <time
                      className="shrink-0 text-muted-foreground tabular-nums"
                      dateTime={entry.createdAt}
                      title={absolute}
                    >
                      {relative}
                    </time>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      )}
    </Card>
  );
}
