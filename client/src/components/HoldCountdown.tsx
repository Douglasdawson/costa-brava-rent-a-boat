import { useState, useEffect, useCallback, useRef } from "react";
import { Clock } from "lucide-react";
import { useTranslations } from "@/lib/translations";

interface HoldCountdownProps {
  expiresAt: string; // ISO timestamp
  onExpired: () => void;
}

export default function HoldCountdown({ expiresAt, onExpired }: HoldCountdownProps) {
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
    ? "bg-red-600"
    : isUrgent
    ? "bg-red-500"
    : isWarning
    ? "bg-amber-500"
    : "bg-[#0D0D2B]";

  const holdCountdownText = t.holdCountdown;

  if (isExpired) {
    return (
      <div
        className={`${bgClass} text-white rounded-lg h-10 flex items-center justify-center gap-2 px-4 w-full transition-colors duration-700`}
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
