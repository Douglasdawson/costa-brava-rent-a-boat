import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Anchor, Lock, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleAdminPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pin || pin.length !== 6) {
      toast({
        variant: "destructive",
        title: "PIN invalido",
        description: "Por favor ingresa un PIN de 6 digitos",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "PIN incorrecto");
      }

      const data = await response.json();

      sessionStorage.setItem("adminToken", data.token);
      sessionStorage.setItem("adminRole", data.role || "admin");
      sessionStorage.setItem("adminUsername", data.displayName || data.username || "admin");

      toast({
        title: "Acceso concedido",
        description: `Bienvenido, ${data.displayName || data.username}`,
      });

      setLocation("/crm");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast({
        variant: "destructive",
        title: "Error de autenticacion",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md relative">
        <Button
          variant="ghost"
          size="icon"
          className="!absolute !top-3 !right-3 !z-10"
          onClick={() => setLocation("/")}
          data-testid="button-close-login"
        >
          <X className="w-5 h-5" />
        </Button>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Anchor className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Costa Brava Rent a Boat
          </CardTitle>
          <CardDescription className="mt-2">
            Panel de administracion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdminPinSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="pin" className="text-sm font-medium">
                PIN de Administrador
              </label>
              <Input
                id="pin"
                type="password"
                placeholder="Ingresa tu PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                disabled={isLoading}
                data-testid="input-admin-pin"
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              size="lg"
              data-testid="button-admin-login"
            >
              <Lock className="w-5 h-5 mr-2" />
              {isLoading ? "Verificando..." : "Acceder al Panel"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
