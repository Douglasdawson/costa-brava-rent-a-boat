import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
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
import { Skeleton } from "@/components/ui/skeleton";

interface CompanyConfig {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  updatedAt: string | null;
}

interface TenantAdminTabProps {
  adminToken: string;
}

export function TenantAdminTab({ adminToken }: TenantAdminTabProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<CompanyConfig>>({});
  const [loaded, setLoaded] = useState(false);

  const headers = {
    "Content-Type": "application/json",
  };

  const { isLoading, data: config } = useQuery<CompanyConfig>({
    queryKey: ["/api/admin/company"],
    queryFn: async () => {
      const res = await fetch("/api/admin/company", { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar configuracion");
      return res.json();
    },
  });

  useEffect(() => {
    if (config && !loaded) {
      setForm({
        name: config.name,
        email: config.email,
        phone: config.phone,
        address: config.address,
        logo: config.logo,
        primaryColor: config.primaryColor || "#2B3E50",
        secondaryColor: config.secondaryColor || "#A8C4DD",
      });
      setLoaded(true);
    }
  }, [config, loaded]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<CompanyConfig>) => {
      const res = await fetch("/api/admin/company", {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al guardar");
      }
      return res.json();
    },
    onSuccess: (data: CompanyConfig) => {
      queryClient.setQueryData(["/api/admin/company"], data);
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
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          <h2 className="text-xl font-bold font-heading">Configuracion del Panel</h2>
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-heading flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Configuracion del Panel
      </h2>

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
              <Label htmlFor="c-name">Nombre de empresa</Label>
              <Input
                id="c-name"
                value={form.name || ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Costa Brava Rent a Boat"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-email">
                <Mail className="w-3.5 h-3.5 inline mr-1" />
                Email de contacto
              </Label>
              <Input
                id="c-email"
                type="email"
                value={form.email || ""}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="info@miempresa.com"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="c-phone">
                <Phone className="w-3.5 h-3.5 inline mr-1" />
                Telefono
              </Label>
              <Input
                id="c-phone"
                type="tel"
                value={form.phone || ""}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+34 611 000 000"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-address">
                <MapPin className="w-3.5 h-3.5 inline mr-1" />
                Direccion / Puerto
              </Label>
              <Input
                id="c-address"
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
            <Label htmlFor="c-logo">
              <Image className="w-3.5 h-3.5 inline mr-1" />
              URL del logo
            </Label>
            <Input
              id="c-logo"
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
              <Label htmlFor="c-primary">Color primario</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="c-primary-picker"
                  value={form.primaryColor || "#2B3E50"}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  className="w-10 h-9 rounded border border-border cursor-pointer p-0.5"
                />
                <Input
                  id="c-primary"
                  value={form.primaryColor || ""}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  placeholder="#2B3E50"
                  className="font-mono"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-secondary">Color secundario</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="c-secondary-picker"
                  value={form.secondaryColor || "#A8C4DD"}
                  onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))}
                  className="w-10 h-9 rounded border border-border cursor-pointer p-0.5"
                />
                <Input
                  id="c-secondary"
                  value={form.secondaryColor || ""}
                  onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))}
                  placeholder="#A8C4DD"
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
