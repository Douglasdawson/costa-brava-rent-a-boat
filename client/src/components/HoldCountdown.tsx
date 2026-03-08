import { useState, useEffect, useCallback, useRef } from "react";
import { Clock, RefreshCw } from "lucide-react";
import { useTranslations } from "@/lib/translations";

interface HoldCountdownProps {
  expiresAt: string; // ISO timestamp
  onExpired: () => void;
  /** When true, show a softer expired message with a verify button instead of blocking */
  softExpiry?: boolean;
  /** Callback when user clicks "Verify" on soft expiry — navigates back to step 1 */
  onVerify?: () => void;
}

export default function HoldCountdown({ expiresAt, onExpired, softExpiry, onVerify }: HoldCountdownProps) {
  const t = useTranslations();
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      const clamped = Math.max(0, diff);
      setSecondsLeft(clamped);

      if (clamped <= 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        clearInterval(timer);
        onExpiredRef.current();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const formatTime = useCallback((total: number): string => {
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, []);

  const isExpired = secondsLeft <= 0;
  const isUrgent = secondsLeft > 0 && secondsLeft < 60;
  const isWarning = secondsLeft >= 60 && secondsLeft < 300;

  // Background color transitions: navy -> amber -> red
  const bgClass = isExpired
    ? "bg-amber-500"
    : isUrgent
    ? "bg-red-500"
    : isWarning
    ? "bg-amber-500"
    : "bg-[#0D0D2B]";

  const holdCountdownText = t.holdCountdown;

  if (isExpired) {
    // Soft expiry: show a gentler message with a verify button
    if (softExpiry) {
      return (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 w-full">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-amber-800 font-medium leading-snug">
                {holdCountdownText?.expiredSoft ?? "Tu seleccion puede haber cambiado. Puedes continuar, pero te recomendamos verificar la disponibilidad."}
              </p>
              {onVerify && (
                <button
                  type="button"
                  onClick={onVerify}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  {holdCountdownText?.verifyButton ?? "Verificar"}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Hard expiry (legacy behavior)
    return (
      <div
        className="bg-red-600 text-white rounded-lg h-10 flex items-center justify-center gap-2 px-4 w-full transition-colors duration-700"
      >
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium">
          {holdCountdownText?.expired ?? "Tu reserva ha expirado"}.{" "}
          {holdCountdownText?.selectAnother ?? "Selecciona otro horario"}.
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${bgClass} text-white rounded-lg h-10 flex items-center justify-center gap-2 px-4 w-full transition-colors duration-700`}
    >
      <Clock className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm font-medium">
        {isUrgent && (
          <span className="font-bold mr-1">
            {holdCountdownText?.hurry ?? "Date prisa"} --
          </span>
        )}
        {holdCountdownText?.reserved ?? "Tu barco esta reservado durante"}{" "}
        <span className="font-bold tabular-nums">{formatTime(secondsLeft)}</span>
      </span>
    </div>
  );
}
