import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, ChevronRight, Ship, Settings, Building2, Rocket } from "lucide-react";

const STEPS = [
  { id: 1, label: "Tu empresa",    icon: Building2 },
  { id: 2, label: "Configuración", icon: Settings },
  { id: 3, label: "Primera flota", icon: Ship },
  { id: 4, label: "Listo",         icon: Rocket },
];

interface TenantSetupData {
  phone: string;
  address: string;
  description: string;
  location: string;
  language: string;
}

interface BoatData {
  name: string;
  capacity: string;
  requiresLicense: boolean;
  price: string;
}

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const companyName = sessionStorage.getItem("tenantName") || "tu empresa";
  const firstName = sessionStorage.getItem("adminUsername")?.split(" ")[0] || "usuario";

  const [tenantData, setTenantData] = useState<TenantSetupData>({
    phone: "",
    address: "",
    description: "",
    location: "Blanes, Costa Brava",
    language: "es",
  });

  const [boatData, setBoatData] = useState<BoatData>({
    name: "",
    capacity: "6",
    requiresLicense: false,
    price: "70",
  });

  const [skipBoat, setSkipBoat] = useState(false);

  const goToNext = () => setStep((s) => Math.min(s + 1, 4));

  const handleSaveTenant = async () => {
    if (!tenantData.phone && !tenantData.address) {
      goToNext();
      return;
    }
    setIsSaving(true);
    try {
      const token = sessionStorage.getItem("adminToken");
      await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: tenantData.phone }),
      });
    } catch {
      // non-critical, continue
    } finally {
      setIsSaving(false);
      goToNext();
    }
  };

  const handleSaveBoat = async () => {
    if (skipBoat || !boatData.name) {
      goToNext();
      return;
    }
    setIsSaving(true);
    try {
      const token = sessionStorage.getItem("adminToken");
      await fetch("/api/admin/boats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: boatData.name,
          capacity: parseInt(boatData.capacity) || 6,
          requiresLicense: boatData.requiresLicense,
          description: "",
          isActive: true,
        }),
      });
    } catch {
      // non-critical
    } finally {
      setIsSaving(false);
      goToNext();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4 shadow-lg">
            <Ship className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Configura tu cuenta</h1>
          <p className="text-gray-500 mt-1 text-sm">Solo te llevará 2 minutos</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8 px-2">
          {STEPS.map(({ id, label, icon: Icon }, idx) => {
            const done = step > id;
            const active = step === id;
            return (
              <div key={id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    done ? "bg-green-500 shadow-sm" : active ? "bg-blue-600 ring-4 ring-blue-100 shadow-sm" : "bg-gray-200"
                  }`}>
                    {done
                      ? <CheckCircle className="w-5 h-5 text-white" />
                      : <Icon className={`w-4 h-4 ${active ? "text-white" : "text-gray-400"}`} />
                    }
                  </div>
                  <span className={`text-[10px] mt-1 font-medium ${active ? "text-blue-600" : done ? "text-green-600" : "text-gray-400"}`}>
                    {label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 w-10 mx-1 mb-4 transition-colors ${done ? "bg-green-400" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">

          {/* Step 1: Datos empresa */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Hola, {firstName}</h2>
                <p className="text-sm text-gray-500 mt-1">Cuéntanos un poco sobre <strong>{companyName}</strong></p>
              </div>
              <div>
                <Label htmlFor="ob-phone" className="text-sm font-medium">Teléfono de contacto</Label>
                <Input
                  id="ob-phone"
                  type="tel"
                  placeholder="+34 611 000 000"
                  value={tenantData.phone}
                  onChange={(e) => setTenantData((d) => ({ ...d, phone: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="ob-address" className="text-sm font-medium">Ubicación del puerto</Label>
                <Input
                  id="ob-address"
                  placeholder="Puerto de Blanes, Girona"
                  value={tenantData.address}
                  onChange={(e) => setTenantData((d) => ({ ...d, address: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="ob-desc" className="text-sm font-medium">Descripción breve <span className="text-gray-400 font-normal">(opcional)</span></Label>
                <textarea
                  id="ob-desc"
                  placeholder="Empresa de alquiler de barcos en la Costa Brava..."
                  value={tenantData.description}
                  onChange={(e) => setTenantData((d) => ({ ...d, description: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>
              <Button onClick={handleSaveTenant} disabled={isSaving} className="w-full">
                {isSaving ? "Guardando..." : "Continuar"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 2: Configuración */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Configuración básica</h2>
                <p className="text-sm text-gray-500 mt-1">Puedes ajustar esto más tarde desde el panel</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Idioma principal</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { value: "es", label: "Español" },
                    { value: "en", label: "English" },
                    { value: "ca", label: "Català" },
                    { value: "fr", label: "Français" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTenantData((d) => ({ ...d, language: value }))}
                      className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                        tenantData.language === value
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Temporada de operación</Label>
                <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                  <p className="font-medium mb-1">Temporada estándar Costa Brava</p>
                  <p className="text-blue-600 text-xs">Baja: Abr–Jun, Sep–Oct · Media: Jul · Alta: Ago</p>
                </div>
                <p className="text-xs text-gray-400 mt-2">Personaliza las temporadas y precios desde el CRM una vez configurado.</p>
              </div>
              <Button onClick={goToNext} className="w-full">
                Continuar
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Step 3: Primera flota */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Añade tu primer barco</h2>
                <p className="text-sm text-gray-500 mt-1">Opcional — puedes añadirlos desde el CRM</p>
              </div>

              {!skipBoat ? (
                <>
                  <div>
                    <Label htmlFor="ob-boat-name" className="text-sm font-medium">Nombre del barco</Label>
                    <Input
                      id="ob-boat-name"
                      placeholder="Solar 450, Remus 500..."
                      value={boatData.name}
                      onChange={(e) => setBoatData((d) => ({ ...d, name: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="ob-capacity" className="text-sm font-medium">Capacidad (personas)</Label>
                      <Input
                        id="ob-capacity"
                        type="number"
                        min={1}
                        max={20}
                        value={boatData.capacity}
                        onChange={(e) => setBoatData((d) => ({ ...d, capacity: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ob-price" className="text-sm font-medium">Precio desde (€/h)</Label>
                      <Input
                        id="ob-price"
                        type="number"
                        min={0}
                        value={boatData.price}
                        onChange={(e) => setBoatData((d) => ({ ...d, price: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Licencia náutica</Label>
                    <div className="flex gap-2">
                      {[
                        { value: false, label: "Sin licencia" },
                        { value: true,  label: "Con licencia" },
                      ].map(({ value, label }) => (
                        <button
                          key={String(value)}
                          type="button"
                          onClick={() => setBoatData((d) => ({ ...d, requiresLicense: value }))}
                          className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                            boatData.requiresLicense === value
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 text-gray-600"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveBoat} disabled={isSaving || !boatData.name} className="flex-1">
                      {isSaving ? "Guardando..." : "Añadir barco"}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSkipBoat(true); goToNext(); }}
                    className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors"
                  >
                    Saltar por ahora →
                  </button>
                </>
              ) : null}
            </div>
          )}

          {/* Step 4: Listo */}
          {step === 4 && (
            <div className="text-center space-y-5 py-2">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">¡Todo listo!</h2>
                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                  Tu cuenta de <strong>{companyName}</strong> está configurada.<br />
                  Tienes <strong>14 días de prueba gratuita</strong> con acceso completo.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2">
                {[
                  "Gestión de flota y reservas",
                  "Calendario de disponibilidad",
                  "CRM con clientes y pagos",
                  "Emails automáticos",
                  "Chatbot WhatsApp con IA",
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {feat}
                  </div>
                ))}
              </div>
              <Button
                onClick={() => setLocation("/crm")}
                className="w-full py-6 text-base font-semibold"
              >
                Ir a mi panel
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          NauticFlow · Plataforma de gestión náutica
        </p>
      </div>
    </div>
  );
}
