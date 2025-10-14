import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Anchor, Lock, UserCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleClientLogin = () => {
    window.location.href = "/api/login";
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
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
      
      sessionStorage.setItem("adminToken", data.token);
      
      toast({
        title: "Acceso concedido",
        description: "Bienvenido al panel de administración",
      });

      setLocation("/crm");
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
      <Card className="w-full max-w-md relative">
        <Button
          variant="ghost"
          size="icon"
          className="!absolute !top-3 !right-3 !z-10"
          onClick={() => setLocation("/")}
          data-testid="button-close-login"
          aria-label="Volver a la página de inicio"
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
            Inicia sesión para acceder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cliente" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cliente" data-testid="tab-cliente">
                <UserCircle className="w-4 h-4 mr-2" />
                Cliente
              </TabsTrigger>
              <TabsTrigger value="admin" data-testid="tab-admin">
                <Lock className="w-4 h-4 mr-2" />
                Administrador
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cliente" className="space-y-4">
              <div className="text-center space-y-4 py-6">
                <p className="text-gray-600">
                  Accede con tu cuenta de Google para gestionar tus reservas y perfil
                </p>
                <Button 
                  onClick={handleClientLogin}
                  className="w-full"
                  size="lg"
                  data-testid="button-client-login"
                >
                  <UserCircle className="w-5 h-5 mr-2" />
                  Continuar con Google
                </Button>
                <p className="text-sm text-gray-500">
                  Utilizamos Replit Auth para un acceso seguro
                </p>
              </div>
            </TabsContent>

            <TabsContent value="admin" className="space-y-4">
              <form onSubmit={handleAdminSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="pin" className="text-sm font-medium">
                    PIN de Administrador
                  </label>
                  <Input
                    id="pin"
                    type="password"
                    placeholder="Ingresa tu PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
