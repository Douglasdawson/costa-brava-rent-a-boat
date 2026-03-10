import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Download,
  Edit,
  Trash2,
  Anchor,
  GripVertical,
  Loader2,
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Type for boat objects used in the list
export type BoatListItem = {
  id: string;
  name: string;
  capacity: number;
  requiresLicense: boolean;
  deposit: string;
  isActive: boolean;
  displayOrder?: number;
  [key: string]: unknown;
};

// Sortable row component for drag and drop (desktop)
function SortableBoatRow({
  boat,
  onEdit,
  onDelete,
}: {
  boat: BoatListItem;
  onEdit: (boat: BoatListItem) => void;
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
    <TableRow ref={setNodeRef} style={style} className={isDragging ? "bg-muted" : ""}>
      <TableCell>
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-muted-foreground/70" />
        </div>
      </TableCell>
      <TableCell className="font-medium">{boat.name}</TableCell>
      <TableCell>{boat.capacity} personas</TableCell>
      <TableCell>
        <Badge variant={boat.requiresLicense ? "default" : "secondary"}>
          {boat.requiresLicense ? "Requerida" : "No requerida"}
        </Badge>
      </TableCell>
      <TableCell>{"\u20AC"}{boat.deposit}</TableCell>
      <TableCell>
        <Badge className={boat.isActive ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}>
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
          <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(boat.id)}
              data-testid={`button-delete-boat-${boat.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
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
  boat: BoatListItem;
  onEdit: (boat: BoatListItem) => void;
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
            <GripVertical className="w-5 h-5 text-muted-foreground/70" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold font-heading text-lg">{boat.name}</h3>
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
                    onClick={() => onDelete(boat.id)}
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
              <Badge className={`text-xs ${boat.isActive ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
                {boat.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Capacidad:</span>
                <span className="ml-1 font-medium">{boat.capacity} personas</span>
              </div>
              <div>
                <span className="text-muted-foreground">Depósito:</span>
                <span className="ml-1 font-medium">{"\u20AC"}{boat.deposit}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface BoatListTableProps {
  boats: BoatListItem[] | undefined;
  orderedBoats: BoatListItem[];
  loading: boolean;
  onEdit: (boat: BoatListItem) => void;
  onDeactivate: (id: string, name: string) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onImport: () => void;
  onAdd: () => void;
  isImporting: boolean;
}

export function BoatListTable({
  boats,
  orderedBoats,
  loading,
  onEdit,
  onDeactivate,
  onDragEnd,
  onImport,
  onAdd,
  isImporting,
}: BoatListTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (!boats || boats.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Anchor className="w-12 h-12 mx-auto mb-4 text-muted-foreground/70" />
          <h3 className="text-lg font-semibold font-heading mb-2">No hay barcos registrados</h3>
          <p className="text-muted-foreground mb-4">
            Importa los 7 barcos de la flota o agrega uno manualmente
          </p>
          <div className="flex justify-center gap-4">
            <Button
              onClick={onImport}
              disabled={isImporting}
              data-testid="button-import-boats"
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isImporting ? "Importando..." : "Importar Flota (7 barcos)"}
            </Button>
            <Button
              variant="outline"
              onClick={onAdd}
              data-testid="button-add-first-boat"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Manualmente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleDelete = (id: string) => {
    const target = orderedBoats.find(b => b.id === id);
    onDeactivate(id, target?.name || id);
  };

  return (
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
            onDragEnd={onDragEnd}
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
                  {orderedBoats.map((boat) => (
                    <SortableBoatRow
                      key={boat.id}
                      boat={boat}
                      onEdit={onEdit}
                      onDelete={handleDelete}
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
        <div className="text-sm font-medium text-muted-foreground px-1">
          Barcos ({orderedBoats.length})
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={orderedBoats.map(b => b.id)}
            strategy={verticalListSortingStrategy}
          >
            {orderedBoats.map((boat) => (
              <SortableBoatCard
                key={boat.id}
                boat={boat}
                onEdit={onEdit}
                onDelete={handleDelete}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </>
  );
}
