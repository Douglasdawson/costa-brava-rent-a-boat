import { useState, useEffect } from "react";
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
import {
  Building2,
  Users,
  Plus,
  Edit,
  UserX,
  UserCheck,
  Save,
  Palette,
  Mail,
  Phone,
  MapPin,
  Image,
  Settings,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// ===== Types =====

interface TenantSettings {
  timezone?: string;
  currency?: string;
  languages?: string[];
}

interface TenantData {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  plan: string;
  status: string;
  settings: TenantSettings | null;
  trialEndsAt: string | null;
}

interface TeamMember {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface TenantAdminTabProps {
  adminToken: string;
}

type SubTab = "empresa" | "usuarios";

// ===== Main Component =====

export function TenantAdminTab({ adminToken }: TenantAdminTabProps) {
  const [subTab, setSubTab] = useState<SubTab>("empresa");
  const { toast } = useToast();

  const headers = {
    Authorization: `Bearer ${adminToken}`,
    "Content-Type": "application/json",
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-heading flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configuracion del Panel
        </h2>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setSubTab("empresa")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              subTab === "empresa"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Mi Empresa
          </button>
          <button
            onClick={() => setSubTab("usuarios")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              subTab === "usuarios"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            Usuarios
          </button>
        </div>
      </div>

      {subTab === "empresa" && (
        <CompanySettingsSection adminToken={adminToken} headers={headers} toast={toast} />
      )}
      {subTab === "usuarios" && (
        <TeamMembersSection adminToken={adminToken} headers={headers} toast={toast} />
      )}
    </div>
  );
}

// ===== Company Settings Section =====

function CompanySettingsSection({
  headers,
  toast,
}: {
  adminToken: string;
  headers: Record<string, string>;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [form, setForm] = useState<Partial<TenantData>>({});
  const [loaded, setLoaded] = useState(false);

  const { isLoading, data: tenantData } = useQuery<{ tenant: TenantData }>({
    queryKey: ["/api/tenant/settings"],
    queryFn: async () => {
      const res = await fetch("/api/tenant/settings", { headers });
      if (!res.ok) throw new Error("Error al cargar configuracion");
      return res.json();
    },
  });

  useEffect(() => {
    if (tenantData && !loaded) {
      setForm({
        name: tenantData.tenant.name,
        email: tenantData.tenant.email,
        phone: tenantData.tenant.phone,
        address: tenantData.tenant.address,
        logo: tenantData.tenant.logo,
        primaryColor: tenantData.tenant.primaryColor || "#0077B6",
        secondaryColor: tenantData.tenant.secondaryColor || "#00B4D8",
      });
      setLoaded(true);
    }
  }, [tenantData, loaded]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<TenantData>) => {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al guardar");
      }
      return res.json();
    },
    onSuccess: (data: { tenant: TenantData }) => {
      queryClient.setQueryData(["/api/tenant/settings"], data);
      // Update sessionStorage with new name
      sessionStorage.setItem("tenantName", data.tenant.name);
      toast({ title: "Configuracion guardada correctamente" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      logo: form.logo || null,
      primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor,
    });
  };

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="space-y-5">
      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Informacion de la empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="t-name">Nombre de empresa</Label>
              <Input
                id="t-name"
                value={form.name || ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Mi Empresa Nautica"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-email">
                <Mail className="w-3.5 h-3.5 inline mr-1" />
                Email de contacto
              </Label>
              <Input
                id="t-email"
                type="email"
                value={form.email || ""}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="info@miempresa.com"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="t-phone">
                <Phone className="w-3.5 h-3.5 inline mr-1" />
                Telefono
              </Label>
              <Input
                id="t-phone"
                type="tel"
                value={form.phone || ""}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+34 611 000 000"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-address">
                <MapPin className="w-3.5 h-3.5 inline mr-1" />
                Direccion / Puerto
              </Label>
              <Input
                id="t-address"
                value={form.address || ""}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Puerto de Blanes, Girona"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="t-logo">
              <Image className="w-3.5 h-3.5 inline mr-1" />
              URL del logo
            </Label>
            <Input
              id="t-logo"
              value={form.logo || ""}
              onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
              placeholder="https://miempresa.com/logo.png"
            />
            {form.logo && (
              <img
                src={form.logo}
                alt="Logo preview"
                className="h-12 mt-2 object-contain rounded border border-border p-1"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="t-primary">Color primario</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="t-primary-picker"
                  value={form.primaryColor || "#0077B6"}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  className="w-10 h-9 rounded border border-border cursor-pointer p-0.5"
                />
                <Input
                  id="t-primary"
                  value={form.primaryColor || ""}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  placeholder="#0077B6"
                  className="font-mono"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-secondary">Color secundario</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="t-secondary-picker"
                  value={form.secondaryColor || "#00B4D8"}
                  onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))}
                  className="w-10 h-9 rounded border border-border cursor-pointer p-0.5"
                />
                <Input
                  id="t-secondary"
                  value={form.secondaryColor || ""}
                  onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))}
                  placeholder="#00B4D8"
                  className="font-mono"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}

// ===== Team Members Section =====

function TeamMembersSection({
  headers,
  toast,
}: {
  adminToken: string;
  headers: Record<string, string>;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "employee" as "admin" | "employee",
  });

  const { data: members = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/tenant/users"],
    queryFn: async () => {
      const res = await fetch("/api/tenant/users", { headers });
      if (!res.ok) throw new Error("Error al cargar usuarios");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/tenant/users", {
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
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/users"] });
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
      const res = await fetch(`/api/tenant/users/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/users"] });
      setShowDialog(false);
      setEditingMember(null);
      resetForm();
      toast({ title: "Usuario actualizado" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/tenant/users/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/users"] });
      toast({ title: "Estado actualizado" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const resetForm = () => {
    setFormData({ email: "", password: "", firstName: "", lastName: "", role: "employee" });
  };

  const handleCreate = () => {
    setEditingMember(null);
    resetForm();
    setShowDialog(true);
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      email: member.email,
      password: "",
      firstName: member.firstName || "",
      lastName: member.lastName || "",
      role: member.role as "admin" | "employee",
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingMember) {
      updateMutation.mutate({
        id: editingMember.id,
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
        },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const roleLabel = (role: string) => {
    if (role === "owner") return "Propietario";
    if (role === "admin") return "Administrador";
    return "Empleado";
  };

  const roleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
    if (role === "owner") return "default";
    if (role === "admin") return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Gestiona los usuarios que tienen acceso al panel de tu empresa.
        </p>
        <Button onClick={handleCreate} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Anadir usuario
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ultimo acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {[member.firstName, member.lastName].filter(Boolean).join(" ") || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{member.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant(member.role)}>
                        {roleLabel(member.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.isActive ? "outline" : "destructive"}>
                        {member.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.lastLoginAt
                        ? new Date(member.lastLoginAt).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "Nunca"}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.role !== "owner" && (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(member)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                id: member.id,
                                isActive: !member.isActive,
                              })
                            }
                            title={member.isActive ? "Desactivar" : "Activar"}
                          >
                            {member.isActive ? (
                              <UserX className="w-4 h-4 text-red-500" />
                            ) : (
                              <UserCheck className="w-4 h-4 text-primary" />
                            )}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {members.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      Solo hay un usuario registrado. Añade miembros de tu equipo.
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
              {editingMember ? "Editar usuario" : "Anadir usuario"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="m-first">Nombre</Label>
                <Input
                  id="m-first"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Juan"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-last">Apellido</Label>
                <Input
                  id="m-last"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Garcia"
                />
              </div>
            </div>
            {!editingMember && (
              <div className="space-y-1.5">
                <Label htmlFor="m-email">Email</Label>
                <Input
                  id="m-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="juan@miempresa.com"
                />
              </div>
            )}
            {!editingMember && (
              <div className="space-y-1.5">
                <Label htmlFor="m-password">Contraseña temporal</Label>
                <Input
                  id="m-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min. 8 caracteres"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="m-role">Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as "admin" | "employee" })
                }
              >
                <SelectTrigger id="m-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Empleado — ve reservas y calendario</SelectItem>
                  <SelectItem value="admin">Administrador — acceso completo al panel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingMember ? "Guardar" : "Crear usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
