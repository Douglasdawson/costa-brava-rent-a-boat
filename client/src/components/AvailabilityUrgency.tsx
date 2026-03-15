import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, Flame } from "lucide-react";

interface AvailabilityUrgencyProps {
  boatId: string;
}

export default function AvailabilityUrgency({ boatId: _boatId }: AvailabilityUrgencyProps) {
  const urgency = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 5=Fri, 6=Sat
    const month = now.getMonth(); // 0-indexed: 6=Jul, 7=Aug
    const hour = now.getHours();

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    const isPeakSeason = month === 6 || month === 7; // Jul-Aug
    const isHighSeason = month >= 5 && month <= 8; // Jun-Sep

    // Peak season weekend: strongest urgency
    if (isPeakSeason && isWeekend) {
      return {
        text: "Alta demanda este fin de semana",
        icon: Flame,
        variant: "destructive" as const,
      };
    }

    // Peak season weekday
    if (isPeakSeason) {
      return {
        text: "Temporada alta - reserva con antelacion",
        icon: TrendingUp,
        variant: "secondary" as const,
      };
    }

    // High season weekend
    if (isHighSeason && isWeekend) {
      return {
        text: "Alta demanda este fin de semana",
        icon: TrendingUp,
        variant: "secondary" as const,
      };
    }

    // Any weekend during season with late browsing (afternoon = likely planning)
    if (isWeekend && hour >= 14 && month >= 3 && month <= 9) {
      return {
        text: "Pocas horas disponibles hoy",
        icon: Clock,
        variant: "secondary" as const,
      };
    }

    return null;
  }, []);

  if (!urgency) return null;

  const Icon = urgency.icon;

  return (
    <Badge
      variant={urgency.variant}
      className="text-xs font-medium px-2.5 py-1 gap-1.5"
    >
      <Icon className="w-3 h-3" />
      {urgency.text}
    </Badge>
  );
}
