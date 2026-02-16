import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Anchor, Lock, UserCircle, X, User, Mail, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // SaaS login
  const [saasEmail, setSaasEmail] = useState("");
  const [saasPassword, setSaasPassword] = useState("");
  // SaaS register
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regCompanyName, setRegCompanyName] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleClientLogin = () => {
    window.location.href = "/api/login";
  };

  // SaaS email+password login
  const handleSaasLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!saasEmail || !saasPassword) {
      toast({
        variant: "destructive",
        title: "Campos requeridos",
        description: "Ingresa tu email y contraseña",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: saasEmail, password: saasPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Credenciales incorrectas");
      }

      const data = await response.json();

      // Store tokens
      sessionStorage.setItem("adminToken", data.accessToken);
      sessionStorage.setItem("refreshToken", data.refreshToken);
      sessionStorage.setItem("adminRole", data.user.role);
      sessionStorage.setItem("adminUsername", `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim() || data.user.email);
      if (data.tenant) {
        sessionStorage.setItem("tenantName", data.tenant.name);
        sessionStorage.setItem("tenantSlug", data.tenant.slug);
      }

      toast({
        title: "Acceso concedido",
        description: `Bienvenido, ${data.user.firstName || data.user.email}`,
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

  // SaaS register
  const handleSaasRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regEmail || !regPassword || !regFirstName || !regLastName || !regCompanyName) {
      toast({
        variant: "destructive",
        title: "Campos requeridos",
        description: "Completa todos los campos",
      });
      return;
    }

    if (regPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Contraseña muy corta",
        description: "La contraseña debe tener al menos 8 caracteres",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          firstName: regFirstName,
          lastName: regLastName,
          companyName: regCompanyName,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error al registrar");
      }

      const data = await response.json();

      // Store tokens
      sessionStorage.setItem("adminToken", data.accessToken);
      sessionStorage.setItem("refreshToken", data.refreshToken);
      sessionStorage.setItem("adminRole", data.user.role);
      sessionStorage.setItem("adminUsername", `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim());
      if (data.tenant) {
        sessionStorage.setItem("tenantName", data.tenant.name);
        sessionStorage.setItem("tenantSlug", data.tenant.slug);
      }

      toast({
        title: "Cuenta creada",
        description: `Bienvenido a NauticFlow, ${data.user.firstName}! Tu periodo de prueba de 14 dias ha comenzado.`,
      });

      setLocation("/crm");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast({
        variant: "destructive",
        title: "Error al registrar",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pin || pin.length < 4) {
      toast({
        variant: "destructive",
        title: "PIN invalido",
        description: "Por favor ingresa un PIN valido de 4-6 digitos",
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

  const handleUserLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast({
        variant: "destructive",
        title: "Campos requeridos",
        description: "Ingresa tu usuario y contraseña",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Credenciales incorrectas");
      }

      const data = await response.json();

      sessionStorage.setItem("adminToken", data.token);
      sessionStorage.setItem("adminRole", data.role);
      sessionStorage.setItem("adminUsername", data.displayName || data.username);

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
          aria-label="Volver a la pagina de inicio"
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
            NauticFlow
          </CardTitle>
          <CardDescription className="mt-2">
            Plataforma de gestion nautica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="email" data-testid="tab-email">
                <Mail className="w-4 h-4 mr-1 hidden sm:block" />
                Email
              </TabsTrigger>
              <TabsTrigger value="user" data-testid="tab-user">
                <User className="w-4 h-4 mr-1 hidden sm:block" />
                Equipo
              </TabsTrigger>
              <TabsTrigger value="admin" data-testid="tab-admin">
                <Lock className="w-4 h-4 mr-1 hidden sm:block" />
                PIN
              </TabsTrigger>
              <TabsTrigger value="cliente" data-testid="tab-cliente">
                <UserCircle className="w-4 h-4 mr-1 hidden sm:block" />
                Cliente
              </TabsTrigger>
            </TabsList>

            {/* SaaS Email + Password login */}
            <TabsContent value="email" className="space-y-4">
              {!showRegister ? (
                <form onSubmit={handleSaasLogin} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="saas-email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="saas-email"
                      type="email"
                      placeholder="tu@empresa.com"
                      value={saasEmail}
                      onChange={(e) => setSaasEmail(e.target.value)}
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="saas-password" className="text-sm font-medium">
                      Contraseña
                    </label>
                    <Input
                      id="saas-password"
                      type="password"
                      placeholder="Tu contraseña"
                      value={saasPassword}
                      onChange={(e) => setSaasPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    size="lg"
                    data-testid="button-saas-login"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    {isLoading ? "Verificando..." : "Iniciar Sesion"}
                  </Button>
                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      className="text-primary hover:underline bg-transparent border-none cursor-pointer p-0"
                      onClick={() => {
                        // TODO: Navigate to forgot password
                        toast({ title: "Funcion disponible pronto", description: "El restablecimiento de contraseña estara disponible pronto" });
                      }}
                    >
                      Olvidaste tu contraseña?
                    </button>
                    <button
                      type="button"
                      className="text-primary hover:underline bg-transparent border-none cursor-pointer p-0"
                      onClick={() => setShowRegister(true)}
                    >
                      Crear cuenta
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSaasRegister} className="space-y-3 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="reg-first-name" className="text-sm font-medium">
                        Nombre
                      </label>
                      <Input
                        id="reg-first-name"
                        type="text"
                        placeholder="Juan"
                        value={regFirstName}
                        onChange={(e) => setRegFirstName(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="reg-last-name" className="text-sm font-medium">
                        Apellido
                      </label>
                      <Input
                        id="reg-last-name"
                        type="text"
                        placeholder="Garcia"
                        value={regLastName}
                        onChange={(e) => setRegLastName(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="reg-company" className="text-sm font-medium">
                      Nombre de empresa
                    </label>
                    <Input
                      id="reg-company"
                      type="text"
                      placeholder="Mi Empresa Nautica"
                      value={regCompanyName}
                      onChange={(e) => setRegCompanyName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="reg-email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="tu@empresa.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="reg-password" className="text-sm font-medium">
                      Contraseña
                    </label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Minimo 8 caracteres"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    size="lg"
                    data-testid="button-saas-register"
                  >
                    <Building2 className="w-5 h-5 mr-2" />
                    {isLoading ? "Creando cuenta..." : "Crear Cuenta (14 dias gratis)"}
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline bg-transparent border-none cursor-pointer p-0"
                      onClick={() => setShowRegister(false)}
                    >
                      Ya tienes cuenta? Inicia sesion
                    </button>
                  </div>
                </form>
              )}
            </TabsContent>

            {/* Username + Password login (legacy team) */}
            <TabsContent value="user" className="space-y-4">
              <form onSubmit={handleUserLoginSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="login-username" className="text-sm font-medium">
                    Usuario
                  </label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="Tu nombre de usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="login-password" className="text-sm font-medium">
                    Contraseña
                  </label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  size="lg"
                  data-testid="button-user-login"
                >
                  <User className="w-5 h-5 mr-2" />
                  {isLoading ? "Verificando..." : "Iniciar Sesion"}
                </Button>
              </form>
            </TabsContent>

            {/* PIN Admin login */}
            <TabsContent value="admin" className="space-y-4">
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

            {/* Client login */}
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
