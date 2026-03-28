import { useMemo } from "react";
import { useTranslations } from "@/lib/translations";
import { trackEvent } from "@/utils/analytics";

interface SensoryHeroCopyProps {
  className?: string;
}

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
type SeasonKey = "low" | "mid" | "high" | "off";

function getTimeOfDay(): TimeOfDay {
  // Use Madrid timezone
  const madridHour = new Date().toLocaleString("en-US", {
    timeZone: "Europe/Madrid",
    hour: "numeric",
    hour12: false,
  });
  const hour = parseInt(madridHour, 10);

  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 23) return "evening";
  return "night";
}

function getSeasonKey(): SeasonKey {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed

  // Apr(3), May(4), Jun(5) = low; Sep(8), Oct(9) = low
  if (month >= 3 && month <= 5) return "low";
  if (month === 8 || month === 9) return "low";
  // Jul(6) = mid
  if (month === 6) return "mid";
  // Aug(7) = high
  if (month === 7) return "high";
  // Nov-Mar = off
  return "off";
}

export function SensoryHeroCopy({ className }: SensoryHeroCopyProps) {
  const t = useTranslations();

  const { timeOfDay, seasonKey } = useMemo(() => {
    const tod = getTimeOfDay();
    const sk = getSeasonKey();

    trackEvent("hero_sensory_impression", {
      timeOfDay: tod,
      season: sk,
    });

    return { timeOfDay: tod, seasonKey: sk };
  }, []);

  const mainLineMap: Record<TimeOfDay, string> = {
    morning: t.sensoryHero?.morningLine || "Siente la brisa mediterranea en tu piel",
    afternoon: t.sensoryHero?.afternoonLine || "Manana, este podria ser tu atardecer",
    evening: t.sensoryHero?.eveningLine || "Despierta manana en el agua",
    night: t.sensoryHero?.nightLine || "Manana, el mar te espera",
  };

  const seasonLineMap: Record<SeasonKey, string> = {
    low: t.sensoryHero?.seasonLow || "Temporada tranquila -- calas solo para ti",
    mid: t.sensoryHero?.seasonMid || "El mejor momento del verano empieza ahora",
    high: t.sensoryHero?.seasonHigh || "Ultimas plazas de agosto -- no esperes mas",
    off: t.sensoryHero?.seasonOff || "La temporada abre en abril",
  };

  const mainLine = mainLineMap[timeOfDay];
  const secondaryLine = seasonLineMap[seasonKey];

  return (
    <div className={`bg-black/20 backdrop-blur-sm rounded-lg px-4 py-2 inline-block ${className || ""}`}>
      <p className="text-base sm:text-lg font-medium text-white/90">
        {mainLine}
      </p>
      <p className="text-sm text-white/70 mt-1">
        {secondaryLine}
      </p>
    </div>
  );
}
