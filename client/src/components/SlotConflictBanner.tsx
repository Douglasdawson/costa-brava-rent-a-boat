import { AlertTriangle, Loader2 } from "lucide-react";
import type { Translations } from "@/lib/translations";

export interface SlotAlternative {
  time: string;
  maxDuration: number;
}

interface SlotConflictBannerProps {
  preferredTime: string;
  alternatives: SlotAlternative[];
  isChecking: boolean;
  onPickAlternative: (time: string) => void;
  onChangeDate: () => void;
  t: Translations;
}

export default function SlotConflictBanner({
  preferredTime,
  alternatives,
  isChecking,
  onPickAlternative,
  onChangeDate,
  t,
}: SlotConflictBannerProps) {
  const copy = t.bookingWizard?.slotConflict;
  const timeSuffix = t.booking.timeSuffix || "h";

  if (isChecking) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl border border-border bg-muted/40 px-4 py-2.5 flex items-center gap-2 text-xs text-muted-foreground"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
        <span>{copy?.checking ?? "Comprobando disponibilidad…"}</span>
      </div>
    );
  }

  return (
    <div
      id="slot-conflict-banner"
      role="alert"
      className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 space-y-3"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle
          className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="text-sm">
          <p className="font-semibold text-foreground">
            {(copy?.title ?? "Las {time}h ya no están libres").replace(
              "{time}",
              `${preferredTime}${timeSuffix}`,
            )}
          </p>
          <p className="text-muted-foreground mt-0.5">
            {alternatives.length > 0
              ? (copy?.subtitle ?? "Te proponemos estas horas cercanas:")
              : (copy?.noAlternatives ??
                "No quedan horas libres ese día. Cambia la fecha o escríbenos por WhatsApp.")}
          </p>
        </div>
      </div>
      {alternatives.length > 0 ? (
        <div className="flex flex-wrap gap-2 pl-6">
          {alternatives.map((alt) => (
            <button
              key={alt.time}
              type="button"
              onClick={() => onPickAlternative(alt.time)}
              className="rounded-lg border border-primary/40 bg-background px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/10 active:scale-95 transition-all min-h-9"
            >
              {alt.time}
              {timeSuffix}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={onChangeDate}
          className="ml-6 text-sm font-medium text-primary underline underline-offset-2 hover:text-primary/80"
        >
          {copy?.changeDate ?? "Cambiar fecha"}
        </button>
      )}
    </div>
  );
}
