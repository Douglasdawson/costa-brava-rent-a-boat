import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  message?: string;
}

export function ErrorState({ message = "Ha ocurrido un error al cargar los datos" }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertTriangle className="w-12 h-12 text-destructive/50 mb-4" />
      <p className="text-lg font-medium text-foreground mb-1">Error</p>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
