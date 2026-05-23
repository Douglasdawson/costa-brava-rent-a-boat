import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Users, Flame } from "lucide-react";
import { useBehaviorSignals, type IntentScore } from "@/hooks/useBehaviorSignals";
import { useTranslations } from "@/lib/translations";
import { trackEvent } from "@/utils/analytics";

interface AvailabilityUrgencyProps {
  boatId: string;
  selectedDate?: string;
}

interface ScarcityData {
  remainingSlots: number;
  totalSlots: number;
  bookedToday: number;
}

type UrgencyTier = "social" | "urgent";

function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateForDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${d}/${m}/${y}`;
}

function determineTier(
  scarcity: ScarcityData | undefined,
  intentScore: IntentScore
): { tier: UrgencyTier; remainingSlots: number } | null {
  // Only show urgency when backed by real scarcity data. PRODUCT.md: "no surprises, transparente".
  if (!scarcity) return null;
  const { remainingSlots } = scarcity;

  // Urgent: high scarcity + high/very_high intent
  if (remainingSlots <= 3 && (intentScore === "high" || intentScore === "very_high")) {
    return { tier: "urgent", remainingSlots };
  }

  // Social: medium scarcity, or low scarcity without high intent (downgrade urgent → social)
  if (remainingSlots <= 6) {
    return { tier: "social", remainingSlots };
  }

  // > 6 slots free: no real urgency. Don't fabricate a "popular boat" signal
  // when the boat is actually wide open. Stay silent — PRODUCT.md.
  return null;
}

export default function AvailabilityUrgency({ boatId, selectedDate }: AvailabilityUrgencyProps) {
  const dateStr = selectedDate || getTodayDateStr();
  const { intentScore } = useBehaviorSignals();
  const t = useTranslations();

  const { data: scarcity } = useQuery<ScarcityData>({
    queryKey: ["scarcity", boatId, dateStr],
    queryFn: async () => {
      const res = await fetch(
        `/api/availability/scarcity?boatId=${encodeURIComponent(boatId)}&date=${encodeURIComponent(dateStr)}`
      );
      if (!res.ok) throw new Error("Failed to fetch scarcity");
      return res.json();
    },
    staleTime: 120_000, // 2 minutes, matching server cache
    refetchOnWindowFocus: false,
  });

  const urgency = useMemo(() => {
    const result = determineTier(scarcity, intentScore);
    if (!result) return null;

    const { tier, remainingSlots } = result;
    const au = t.adaptiveUrgency;
    if (!au) return null;

    // Track urgency tier shown
    trackEvent("urgency_tier_shown", {
      tier,
      remaining_slots: remainingSlots,
      intent_score: intentScore,
      boat_id: boatId,
    });

    if (tier === "urgent") {
      return {
        text: au.onlyXSlots
          .replace("{count}", String(remainingSlots))
          .replace("{date}", formatDateForDisplay(dateStr)),
        icon: Flame,
        variant: "destructive" as const,
      };
    }

    // Social: only when there's a real bookedToday count.
    // Without real bookings we suppress the badge instead of fabricating signals.
    if (tier === "social" && scarcity && scarcity.bookedToday > 0) {
      return {
        text: au.bookingsToday.replace("{count}", String(scarcity.bookedToday)),
        icon: Users,
        variant: "secondary" as const,
      };
    }

    return null;
  }, [scarcity, intentScore, dateStr, boatId, t]);

  if (!urgency) return null;

  const Icon = urgency.icon;

  return (
    <Badge variant={urgency.variant} className="text-xs font-medium px-2.5 py-1 gap-1.5">
      <Icon className="w-3 h-3" />
      {urgency.text}
    </Badge>
  );
}
