import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Ha ocurrido un error al cargar los datos", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertTriangle className="w-12 h-12 text-destructive/50 mb-4" />
      <p className="text-lg font-medium text-foreground mb-1">Error</p>
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
