import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex items-center mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">Pagina no encontrada</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            La pagina que buscas no existe o ha sido movida.
          </p>

          <Button asChild className="mt-6 w-full">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
