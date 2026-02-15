import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Wrench,
  FileText,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MaintenanceTabProps {
  adminToken: string;
}

interface MaintenanceLog {
  id: string;
  boatId: string;
  type: string;
  description: string;
  cost: string | null;
  date: string;
  nextDueDate: string | null;
  status: string;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
}

interface BoatDocument {
  id: string;
  boatId: string;
  type: string;
  name: string;
  fileUrl: string | null;
  expiryDate: string | null;
  notes: string | null;
  createdAt: string;
}

interface Boat {
  id: string;
  name: string;
}

const TYPE_LABELS: Record<string, string> = {
  preventive: "Preventivo",
  corrective: "Correctivo",
  inspection: "Inspeccion",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Programado",
  in_progress: "En Progreso",
  completed: "Completado",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  registration: "Matricula",
  insurance: "Seguro",
  inspection: "ITV",
  license: "Licencia",
  other: "Otro",
};

function getExpiryBadge(expiryDate: string | null) {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return <Badge variant="destructive">Expirado</Badge>;
  }
  if (daysUntil <= 30) {
    return <Badge className="bg-yellow-100 text-yellow-800">Expira en {daysUntil}d</Badge>;
  }
  return <Badge className="bg-green-100 text-green-800">Vigente</Badge>;
}

export function MaintenanceTab({ adminToken }: MaintenanceTabProps) {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState("maintenance");
  const [filterBoat, setFilterBoat] = useState<string>("all");

  // Maintenance dialog
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceLog | null>(null);
  const [mForm, setMForm] = useState({
    boatId: "",
    type: "preventive" as string,
    description: "",
    cost: "",
    date: format(new Date(), "yyyy-MM-dd"),
    nextDueDate: "",
    status: "scheduled" as string,
    notes: "",
  });

  // Document dialog
  const [showDocDialog, setShowDocDialog] = useState(false);
  const [editingDoc, setEditingDoc] = useState<BoatDocument | null>(null);
  const [dForm, setDForm] = useState({
    boatId: "",
    type: "insurance" as string,
    name: "",
    fileUrl: "",
    expiryDate: "",
    notes: "",
  });

  const headers = { Authorization: `Bearer ${adminToken}` };

  // Queries
  const { data: boats = [] } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const { data: maintenanceLogs = [], isLoading: loadingMaint } = useQuery<MaintenanceLog[]>({
    queryKey: ["/api/admin/maintenance", filterBoat],
    queryFn: async () => {
      const params = filterBoat !== "all" ? `?boatId=${filterBoat}` : "";
      const res = await fetch(`/api/admin/maintenance${params}`, { headers });
      if (!res.ok) throw new Error("Error loading maintenance");
      return res.json();
    },
  });
  const { data: documents = [], isLoading: loadingDocs } = useQuery<BoatDocument[]>({
    queryKey: ["/api/admin/documents", filterBoat],
    queryFn: async () => {
      const params = filterBoat !== "all" ? `?boatId=${filterBoat}` : "";
      const res = await fetch(`/api/admin/documents${params}`, { headers });
      if (!res.ok) throw new Error("Error loading documents");
      return res.json();
    },
  });
  const { data: expiringDocs = [] } = useQuery<BoatDocument[]>({
    queryKey: ["/api/admin/documents/expiring"],
    queryFn: async () => {
      const res = await fetch("/api/admin/documents/expiring?days=30", { headers });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
  });

  // Maintenance mutations
  const createMaintMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/maintenance"] });
      setShowMaintenanceDialog(false);
      toast({ title: "Mantenimiento registrado" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const updateMaintMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/maintenance/${id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/maintenance"] });
      setShowMaintenanceDialog(false);
      setEditingMaintenance(null);
      toast({ title: "Mantenimiento actualizado" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const deleteMaintMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/maintenance/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/maintenance"] });
      toast({ title: "Mantenimiento eliminado" });
    },
  });

  // Document mutations
  const createDocMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      setShowDocDialog(false);
      toast({ title: "Documento registrado" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const updateDocMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/documents/${id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      setShowDocDialog(false);
      setEditingDoc(null);
      toast({ title: "Documento actualizado" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const deleteDocMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/documents/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      toast({ title: "Documento eliminado" });
    },
  });

  const boatName = (boatId: string) => boats.find(b => b.id === boatId)?.name || boatId;

  const handleMaintenanceSubmit = () => {
    const data = {
      boatId: mForm.boatId,
      type: mForm.type,
      description: mForm.description,
      cost: mForm.cost || null,
      date: new Date(mForm.date).toISOString(),
      nextDueDate: mForm.nextDueDate ? new Date(mForm.nextDueDate).toISOString() : null,
      status: mForm.status,
      notes: mForm.notes || null,
    };

    if (editingMaintenance) {
      updateMaintMutation.mutate({ id: editingMaintenance.id, data });
    } else {
      createMaintMutation.mutate(data);
    }
  };

  const handleDocSubmit = () => {
    const data = {
      boatId: dForm.boatId,
      type: dForm.type,
      name: dForm.name,
      fileUrl: dForm.fileUrl || null,
      expiryDate: dForm.expiryDate ? new Date(dForm.expiryDate).toISOString() : null,
      notes: dForm.notes || null,
    };

    if (editingDoc) {
      updateDocMutation.mutate({ id: editingDoc.id, data });
    } else {
      createDocMutation.mutate(data);
    }
  };

  const openEditMaintenance = (log: MaintenanceLog) => {
    setEditingMaintenance(log);
    setMForm({
      boatId: log.boatId,
      type: log.type,
      description: log.description,
      cost: log.cost || "",
      date: format(new Date(log.date), "yyyy-MM-dd"),
      nextDueDate: log.nextDueDate ? format(new Date(log.nextDueDate), "yyyy-MM-dd") : "",
      status: log.status,
      notes: log.notes || "",
    });
    setShowMaintenanceDialog(true);
  };

  const openEditDoc = (doc: BoatDocument) => {
    setEditingDoc(doc);
    setDForm({
      boatId: doc.boatId,
      type: doc.type,
      name: doc.name,
      fileUrl: doc.fileUrl || "",
      expiryDate: doc.expiryDate ? format(new Date(doc.expiryDate), "yyyy-MM-dd") : "",
      notes: doc.notes || "",
    });
    setShowDocDialog(true);
  };

  const resetMaintenanceForm = () => {
    setEditingMaintenance(null);
    setMForm({
      boatId: "",
      type: "preventive",
      description: "",
      cost: "",
      date: format(new Date(), "yyyy-MM-dd"),
      nextDueDate: "",
      status: "scheduled",
      notes: "",
    });
  };

  const resetDocForm = () => {
    setEditingDoc(null);
    setDForm({ boatId: "", type: "insurance", name: "", fileUrl: "", expiryDate: "", notes: "" });
  };

  // Alerts count
  const expiredDocs = documents.filter(d => {
    if (!d.expiryDate) return false;
    return new Date(d.expiryDate) < new Date();
  });
  const pendingMaint = maintenanceLogs.filter(l => l.status !== "completed");

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">Mantenimiento y Documentos</h2>
        <Select value={filterBoat} onValueChange={setFilterBoat}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por barco" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los barcos</SelectItem>
            {boats.map(b => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Alert Cards */}
      {(expiredDocs.length > 0 || expiringDocs.length > 0 || pendingMaint.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {expiredDocs.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">{expiredDocs.length} doc. expirados</p>
                  <p className="text-xs text-red-600">Requieren atencion inmediata</p>
                </div>
              </CardContent>
            </Card>
          )}
          {expiringDocs.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">{expiringDocs.length} doc. por expirar</p>
                  <p className="text-xs text-yellow-600">Proximos 30 dias</p>
                </div>
              </CardContent>
            </Card>
          )}
          {pendingMaint.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4 flex items-center gap-3">
                <Wrench className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">{pendingMaint.length} mant. pendientes</p>
                  <p className="text-xs text-blue-600">Programados o en progreso</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            <span className="hidden sm:inline">Mantenimiento</span>
            <span className="sm:hidden">Mant.</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Documentos</span>
          </TabsTrigger>
        </TabsList>

        {/* MAINTENANCE TAB */}
        <TabsContent value="maintenance" className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                resetMaintenanceForm();
                setShowMaintenanceDialog(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar Mantenimiento
            </Button>
          </div>

          {loadingMaint ? (
            <Card><CardContent className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></CardContent></Card>
          ) : maintenanceLogs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No hay registros de mantenimiento
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop table */}
              <Card className="hidden md:block">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Barco</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descripcion</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Coste</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenanceLogs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{boatName(log.boatId)}</TableCell>
                          <TableCell>{TYPE_LABELS[log.type] || log.type}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{log.description}</TableCell>
                          <TableCell>{format(new Date(log.date), "dd/MM/yyyy")}</TableCell>
                          <TableCell>{log.cost ? `${log.cost} EUR` : "-"}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[log.status] || ""}>
                              {STATUS_LABELS[log.status] || log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" onClick={() => openEditMaintenance(log)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm("Eliminar este registro?")) deleteMaintMutation.mutate(log.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {maintenanceLogs.map(log => (
                  <Card key={log.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{boatName(log.boatId)}</p>
                          <p className="text-sm text-gray-600">{TYPE_LABELS[log.type]}</p>
                        </div>
                        <Badge className={STATUS_COLORS[log.status] || ""}>
                          {STATUS_LABELS[log.status]}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{log.description}</p>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>{format(new Date(log.date), "dd/MM/yyyy")}</span>
                        <span>{log.cost ? `${log.cost} EUR` : ""}</span>
                      </div>
                      <div className="flex justify-end gap-1 mt-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditMaintenance(log)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Eliminar?")) deleteMaintMutation.mutate(log.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* DOCUMENTS TAB */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                resetDocForm();
                setShowDocDialog(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Documento
            </Button>
          </div>

          {loadingDocs ? (
            <Card><CardContent className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></CardContent></Card>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No hay documentos registrados
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop table */}
              <Card className="hidden md:block">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Barco</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map(doc => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{boatName(doc.boatId)}</TableCell>
                          <TableCell>{DOC_TYPE_LABELS[doc.type] || doc.type}</TableCell>
                          <TableCell>{doc.name}</TableCell>
                          <TableCell>
                            {doc.expiryDate ? format(new Date(doc.expiryDate), "dd/MM/yyyy") : "Sin vencimiento"}
                          </TableCell>
                          <TableCell>{getExpiryBadge(doc.expiryDate)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" onClick={() => openEditDoc(doc)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm("Eliminar este documento?")) deleteDocMutation.mutate(doc.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {documents.map(doc => (
                  <Card key={doc.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-gray-600">{boatName(doc.boatId)} - {DOC_TYPE_LABELS[doc.type]}</p>
                        </div>
                        {getExpiryBadge(doc.expiryDate)}
                      </div>
                      {doc.expiryDate && (
                        <p className="text-sm text-gray-500">
                          Vence: {format(new Date(doc.expiryDate), "dd/MM/yyyy")}
                        </p>
                      )}
                      <div className="flex justify-end gap-1 mt-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditDoc(doc)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Eliminar?")) deleteDocMutation.mutate(doc.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Maintenance Dialog */}
      <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMaintenance ? "Editar Mantenimiento" : "Registrar Mantenimiento"}</DialogTitle>
            <DialogDescription>Completa los datos del mantenimiento</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Barco *</Label>
              <Select value={mForm.boatId} onValueChange={v => setMForm(p => ({ ...p, boatId: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar barco" /></SelectTrigger>
                <SelectContent>
                  {boats.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo *</Label>
                <Select value={mForm.type} onValueChange={v => setMForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Preventivo</SelectItem>
                    <SelectItem value="corrective">Correctivo</SelectItem>
                    <SelectItem value="inspection">Inspeccion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={mForm.status} onValueChange={v => setMForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Programado</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descripcion *</Label>
              <Textarea
                value={mForm.description}
                onChange={e => setMForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Descripcion del mantenimiento..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={mForm.date}
                  onChange={e => setMForm(p => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Coste (EUR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={mForm.cost}
                  onChange={e => setMForm(p => ({ ...p, cost: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label>Proxima revision</Label>
              <Input
                type="date"
                value={mForm.nextDueDate}
                onChange={e => setMForm(p => ({ ...p, nextDueDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={mForm.notes}
                onChange={e => setMForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Observaciones adicionales..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMaintenanceDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleMaintenanceSubmit}
              disabled={!mForm.boatId || !mForm.description || createMaintMutation.isPending || updateMaintMutation.isPending}
            >
              {createMaintMutation.isPending || updateMaintMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" />Guardar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Dialog */}
      <Dialog open={showDocDialog} onOpenChange={setShowDocDialog}>
        <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDoc ? "Editar Documento" : "Agregar Documento"}</DialogTitle>
            <DialogDescription>Registra un documento del barco</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Barco *</Label>
              <Select value={dForm.boatId} onValueChange={v => setDForm(p => ({ ...p, boatId: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar barco" /></SelectTrigger>
                <SelectContent>
                  {boats.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo *</Label>
                <Select value={dForm.type} onValueChange={v => setDForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registration">Matricula</SelectItem>
                    <SelectItem value="insurance">Seguro</SelectItem>
                    <SelectItem value="inspection">ITV</SelectItem>
                    <SelectItem value="license">Licencia</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vencimiento</Label>
                <Input
                  type="date"
                  value={dForm.expiryDate}
                  onChange={e => setDForm(p => ({ ...p, expiryDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Nombre del documento *</Label>
              <Input
                value={dForm.name}
                onChange={e => setDForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Ej: Seguro RC 2025"
              />
            </div>
            <div>
              <Label>URL del archivo</Label>
              <Input
                value={dForm.fileUrl}
                onChange={e => setDForm(p => ({ ...p, fileUrl: e.target.value }))}
                placeholder="URL del PDF o imagen"
              />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={dForm.notes}
                onChange={e => setDForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Observaciones..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleDocSubmit}
              disabled={!dForm.boatId || !dForm.name || createDocMutation.isPending || updateDocMutation.isPending}
            >
              {createDocMutation.isPending || updateDocMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" />Guardar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
