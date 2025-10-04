import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Anchor, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminLoginProps {
  onLoginSuccess: (token: string) => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pin || pin.length < 4) {
      toast({
        variant: "destructive",
        title: "PIN inválido",
        description: "Por favor ingresa un PIN válido de 4-6 dígitos",
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
      
      // Store token in sessionStorage
      sessionStorage.setItem("adminToken", data.token);
      
      toast({
        title: "Acceso concedido",
        description: "Bienvenido al panel de administración",
      });

      onLoginSuccess(data.token);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Anchor className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Costa Brava Rent a Boat
          </CardTitle>
          <p className="text-gray-600 mt-2">Panel de Administración</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Introduzca su código PIN para acceder al sistema
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="1234567890"
                  className="pl-10 h-12 text-center text-lg tracking-widest"
                  disabled={isLoading}
                  autoFocus
                  data-testid="input-admin-pin"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg"
              disabled={isLoading || !pin}
              data-testid="button-admin-login"
            >
              {isLoading ? "Verificando..." : "Acceder"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Acceso restringido solo para personal autorizado
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
