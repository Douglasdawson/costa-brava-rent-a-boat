import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
import { Plus, Edit, UserX, UserCheck, Users } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface Employee {
  id: string;
  username: string;
  role: string;
  displayName: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

interface EmployeeManagementProps {
  adminToken: string;
}

export function EmployeeManagement({ adminToken }: EmployeeManagementProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    displayName: "",
    role: "employee",
  });
  const { toast } = useToast();

  const headers = {
    "Authorization": `Bearer ${adminToken}`,
    "Content-Type": "application/json",
  };

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/admin/employees"],
    queryFn: async () => {
      const res = await fetch("/api/admin/employees", { headers });
      if (!res.ok) throw new Error("Error fetching employees");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
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
      resetForm();
      toast({ title: "Empleado creado correctamente" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: "PATCH",
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
      toast({ title: "Empleado actualizado correctamente" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: "PATCH",
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
    setFormData({ username: "", password: "", displayName: "", role: "employee" });
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
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingEmployee) {
      const data: Record<string, unknown> = {
        displayName: formData.displayName,
        role: formData.role,
      };
      if (formData.password) data.password = formData.password;
      updateMutation.mutate({ id: editingEmployee.id, data });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Gestion de Empleados
        </h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Empleado
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center">Cargando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ultimo Acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.username}</TableCell>
                    <TableCell>{employee.displayName || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={employee.role === "admin" ? "default" : "secondary"}>
                        {employee.role === "admin" ? "Admin" : "Empleado"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.isActive ? "outline" : "destructive"}>
                        {employee.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {employee.lastLoginAt
                        ? new Date(employee.lastLoginAt).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Nunca"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(employee)}>
                          <Edit className="w-4 h-4" />
                        </Button>
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {employees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No hay empleados registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Editar Empleado" : "Nuevo Empleado"}
            </DialogTitle>
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
                {editingEmployee ? "Nueva Contraseña (dejar vacío para no cambiar)" : "Contraseña"}
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
