import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Plus, Edit, UserX, UserCheck, Users, KeyRound, Shield } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { PaginationControls } from "./shared/PaginationControls";

const TAB_OPTIONS: { id: string; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "calendar", label: "Calendario" },
  { id: "bookings", label: "Reservas" },
  { id: "customers", label: "Clientes" },
  { id: "inquiries", label: "Consultas" },
  { id: "fleet", label: "Flota" },
  { id: "maintenance", label: "Mantenimiento" },
  { id: "inventory", label: "Inventario" },
  { id: "reports", label: "Informes" },
  { id: "gallery", label: "Galeria" },
  { id: "blog", label: "Blog" },
  { id: "giftcards", label: "Tarjetas regalo" },
  { id: "discounts", label: "Descuentos" },
];

interface Employee {
  id: string;
  username: string;
  role: string;
  displayName: string | null;
  isActive: boolean;
  hasPin: boolean;
  allowedTabs: string[] | null;
  createdAt: string;
  lastLoginAt: string | null;
}

interface EmployeeManagementProps {
  adminToken: string;
}

export function EmployeeManagement({ adminToken }: EmployeeManagementProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [showDialog, setShowDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    displayName: "",
    role: "employee",
    pin: "",
    allowedTabs: [] as string[],
  });
  const [pinError, setPinError] = useState("");
  const { toast } = useToast();

  const headers = {
    "Content-Type": "application/json",
  };

  const { data: dbEmployees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/admin/employees"],
    queryFn: async () => {
      const res = await fetch("/api/admin/employees", { credentials: "include" });
      if (!res.ok) throw new Error("Error fetching employees");
      return res.json();
    },
  });

  // Prepend Ivan (owner) as a virtual entry — his auth is via ADMIN_PIN env var
  const ownerEntry: Employee = {
    id: "owner",
    username: "ivan",
    role: "owner",
    displayName: "Ivan",
    isActive: true,
    hasPin: true,
    allowedTabs: null, // null = full access
    createdAt: "",
    lastLoginAt: null,
  };
  const employees = [ownerEntry, ...dbEmployees];

  // Pagination
  const totalPages = Math.max(1, Math.ceil(employees.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedEmployees = employees.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const body: Record<string, unknown> = {
        username: data.username,
        password: data.password,
        displayName: data.displayName,
        role: data.role,
        allowedTabs: data.allowedTabs,
      };
      if (data.pin) body.pin = data.pin;
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees"] });
      setShowDialog(false);
      resetForm();
      toast({ title: "Usuario creado correctamente" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees"] });
      setShowDialog(false);
      setEditingEmployee(null);
      resetForm();
      toast({ title: "Usuario actualizado correctamente" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Error updating employee");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees"] });
      toast({ title: "Estado actualizado" });
    },
  });

  const resetForm = () => {
    setFormData({ username: "", password: "", displayName: "", role: "employee", pin: "", allowedTabs: [] });
    setPinError("");
  };

  const handleCreate = () => {
    setEditingEmployee(null);
    resetForm();
    setShowDialog(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      username: employee.username,
      password: "",
      displayName: employee.displayName || "",
      role: employee.role,
      pin: "", // Don't show existing PIN
      allowedTabs: employee.allowedTabs || [],
    });
    setPinError("");
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (formData.pin && !/^\d{6}$/.test(formData.pin)) {
      setPinError("El PIN debe ser exactamente 6 digitos numericos");
      return;
    }
    setPinError("");

    if (editingEmployee) {
      const data: Record<string, unknown> = {
        displayName: formData.displayName,
        role: formData.role,
        allowedTabs: formData.allowedTabs,
      };
      if (formData.password) data.password = formData.password;
      if (formData.pin) data.pin = formData.pin;
      updateMutation.mutate({ id: editingEmployee.id, data });
    } else {
      createMutation.mutate(formData);
    }
  };

  const allTabsSelected = formData.allowedTabs.length === TAB_OPTIONS.length;

  const toggleAllTabs = () => {
    if (allTabsSelected) {
      setFormData({ ...formData, allowedTabs: [] });
    } else {
      setFormData({ ...formData, allowedTabs: TAB_OPTIONS.map(t => t.id) });
    }
  };

  const toggleTab = (tabId: string) => {
    const tabs = formData.allowedTabs.includes(tabId)
      ? formData.allowedTabs.filter(t => t !== tabId)
      : [...formData.allowedTabs, tabId];
    setFormData({ ...formData, allowedTabs: tabs });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-heading flex items-center gap-2">
          <Users className="w-5 h-5" />
          Gestion de Usuarios
        </h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ) : employees.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-heading font-medium text-foreground mb-1">No hay usuarios registrados</p>
              <p className="text-sm text-muted-foreground">Agrega usuarios para gestionar el acceso al CRM</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>PIN</TableHead>
                    <TableHead>Permisos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Ultimo Acceso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEmployees.map((employee) => {
                    const isOwnerRow = employee.id === "owner";
                    return (
                    <TableRow key={employee.id} className={isOwnerRow ? "bg-primary/5" : ""}>
                      <TableCell className="font-medium">{employee.username}</TableCell>
                      <TableCell>{employee.displayName || "-"}</TableCell>
                      <TableCell>
                        {isOwnerRow ? (
                          <Badge className="bg-amber-100 text-amber-800">Propietario</Badge>
                        ) : (
                          <Badge variant={employee.role === "admin" ? "default" : "secondary"}>
                            {employee.role === "admin" ? "Admin" : "Empleado"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {employee.hasPin ? (
                          <Badge className="bg-blue-100 text-blue-800">
                            <KeyRound className="w-3 h-3 mr-1" />
                            {isOwnerRow ? "Env" : "Asignado"}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sin PIN</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isOwnerRow || employee.allowedTabs === null ? (
                          <Badge variant="outline">
                            <Shield className="w-3 h-3 mr-1" />
                            Acceso total
                          </Badge>
                        ) : employee.allowedTabs && employee.allowedTabs.length > 0 ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="cursor-help">
                                <Shield className="w-3 h-3 mr-1" />
                                {employee.allowedTabs.length === TAB_OPTIONS.length
                                  ? "Todos"
                                  : `${employee.allowedTabs.length} tabs`}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              {employee.allowedTabs.map(t => TAB_OPTIONS.find(o => o.id === t)?.label || t).join(", ")}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground text-sm">Ninguno</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={employee.isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}>
                          {employee.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {employee.lastLoginAt
                          ? new Date(employee.lastLoginAt).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : isOwnerRow ? "-" : "Nunca"}
                      </TableCell>
                      <TableCell className="text-right">
                        {isOwnerRow ? (
                          <span className="text-xs text-muted-foreground">PIN en .env</span>
                        ) : (
                        <div className="flex justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(employee)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  toggleActiveMutation.mutate({
                                    id: employee.id,
                                    isActive: !employee.isActive,
                                  })
                                }
                              >
                                {employee.isActive ? (
                                  <UserX className="w-4 h-4 text-red-500" />
                                ) : (
                                  <UserCheck className="w-4 h-4 text-green-500" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{employee.isActive ? "Desactivar" : "Activar"}</TooltipContent>
                          </Tooltip>
                        </div>
                        )}
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile cards */}
          <div className="block md:hidden space-y-3">
            {paginatedEmployees.map((employee) => {
              const isOwnerRow = employee.id === "owner";
              return (
              <div key={employee.id} className={`bg-card border border-border rounded-lg p-4 space-y-2 ${isOwnerRow ? "border-amber-200 bg-primary/5" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold text-foreground">
                    {employee.displayName || employee.username}
                  </span>
                  <Badge className={employee.isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}>
                    {employee.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{employee.username}</span>
                  {isOwnerRow ? (
                    <Badge className="bg-amber-100 text-amber-800">Propietario</Badge>
                  ) : (
                    <Badge variant={employee.role === "admin" ? "default" : "secondary"}>
                      {employee.role === "admin" ? "Admin" : "Empleado"}
                    </Badge>
                  )}
                  {employee.hasPin && (
                    <Badge className="bg-blue-100 text-blue-800">
                      <KeyRound className="w-3 h-3 mr-1" />{isOwnerRow ? "Env" : "PIN"}
                    </Badge>
                  )}
                </div>
                {isOwnerRow || employee.allowedTabs === null ? (
                  <div className="text-xs text-muted-foreground">
                    <Badge variant="outline">
                      <Shield className="w-3 h-3 mr-1" />
                      Acceso total
                    </Badge>
                  </div>
                ) : employee.allowedTabs && employee.allowedTabs.length > 0 ? (
                  <div className="text-xs text-muted-foreground">
                    Acceso: {employee.allowedTabs.length === TAB_OPTIONS.length
                      ? "Todos los tabs"
                      : employee.allowedTabs.map(t => TAB_OPTIONS.find(o => o.id === t)?.label || t).join(", ")}
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {employee.lastLoginAt
                      ? new Date(employee.lastLoginAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : isOwnerRow ? "-" : "Nunca"}
                  </span>
                  {isOwnerRow ? (
                    <span className="text-xs text-muted-foreground">PIN en .env</span>
                  ) : (
                  <div className="flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(employee)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleActiveMutation.mutate({
                              id: employee.id,
                              isActive: !employee.isActive,
                            })
                          }
                        >
                          {employee.isActive ? (
                            <UserX className="w-4 h-4 text-red-500" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-green-500" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{employee.isActive ? "Desactivar" : "Activar"}</TooltipContent>
                    </Tooltip>
                  </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <PaginationControls
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
            <DialogDescription>
              {editingEmployee ? "Modifica los datos y permisos del usuario" : "Crea un usuario con acceso al CRM"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="emp-username">Usuario</Label>
              <Input
                id="emp-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={!!editingEmployee}
                placeholder="nombre_usuario"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-displayname">Nombre a Mostrar</Label>
              <Input
                id="emp-displayname"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Juan Garcia"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-password">
                {editingEmployee ? "Nueva Contrasena (dejar vacio para no cambiar)" : "Contrasena"}
              </Label>
              <Input
                id="emp-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min. 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-role">Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Empleado</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* PIN Section */}
            <div className="space-y-2">
              <Label htmlFor="emp-pin" className="flex items-center gap-1.5">
                <KeyRound className="w-4 h-4" />
                PIN de Acceso (6 digitos)
              </Label>
              <Input
                id="emp-pin"
                type="password"
                value={formData.pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setFormData({ ...formData, pin: val });
                  setPinError("");
                }}
                maxLength={6}
                placeholder={editingEmployee?.hasPin ? "Dejar vacio para no cambiar" : "123456"}
                autoComplete="off"
              />
              {pinError && <p className="text-sm text-destructive">{pinError}</p>}
              <p className="text-xs text-muted-foreground">
                El usuario podra iniciar sesion en el CRM con este PIN
              </p>
            </div>

            {/* Permissions Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  Permisos de acceso
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleAllTabs}
                >
                  {allTabsSelected ? "Quitar todos" : "Seleccionar todos"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 border rounded-lg p-3">
                {TAB_OPTIONS.map((tab) => (
                  <label
                    key={tab.id}
                    className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={formData.allowedTabs.includes(tab.id)}
                      onCheckedChange={() => toggleTab(tab.id)}
                    />
                    <span className="text-sm">{tab.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Solo los tabs seleccionados seran visibles para este usuario
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingEmployee ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
