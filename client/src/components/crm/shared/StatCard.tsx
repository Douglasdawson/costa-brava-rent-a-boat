import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type SemaphoreStatus = "good" | "warn" | "bad" | "neutral";

interface StatCardProps {
  /** Label shown above the value */
  title: string;
  /** Primary metric value */
  value: string | number;
  /** Optional secondary text below the value */
  description?: string;
  /** Icon rendered in muted-foreground, no wrapper */
  icon?: React.ReactNode;
  /** Change vs previous period. Shows TrendingUp/Down indicator */
  change?: number | null;
  /** Unit appended after the change number (default: "%") */
  changeUnit?: string;
  /** Subtitle shown next to the change indicator */
  changeLabel?: string;
  /** Semaphore dot: colored circle next to the title */
  status?: SemaphoreStatus;
  /** Makes the card clickable with cursor-pointer and hover shadow */
  onClick?: () => void;
  /** Highlights the card as the active/selected one */
  active?: boolean;
  /** Arbitrary children below the value row */
  children?: React.ReactNode;
}

const STATUS_DOT: Record<SemaphoreStatus, string> = {
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-red-500",
  neutral: "bg-muted-foreground/30",
};

export function StatCard({
  title,
  value,
  description,
  icon,
  change,
  changeUnit = "%",
  changeLabel,
  status,
  onClick,
  active,
  children,
}: StatCardProps) {
  const isClickable = !!onClick;
  const isPositive = change != null ? change > 0 : null;
  const isNeutral = change != null && change === 0;

  return (
    <Card
      className={[
        "transition-shadow",
        isClickable && "cursor-pointer hover:shadow-md",
        active && "ring-2 ring-primary/50 bg-accent/30",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {status && (
            <span
              className={`h-2 w-2 rounded-full flex-shrink-0 ${STATUS_DOT[status]}`}
            />
          )}
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </div>
        {icon && (
          <span className="text-muted-foreground flex-shrink-0">{icon}</span>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
          {value}
        </div>
        {(change != null || description || changeLabel) && (
          <div className="flex items-center gap-2 mt-1">
            {change != null && (
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                  isNeutral
                    ? "text-muted-foreground"
                    : isPositive
                      ? "text-primary"
                      : "text-destructive"
                }`}
              >
                {isNeutral ? (
                  <Minus className="h-3 w-3" />
                ) : isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {change > 0 ? "+" : ""}
                {change}
                {changeUnit}
              </span>
            )}
            {(changeLabel || description) && (
              <span className="text-xs text-muted-foreground">
                {changeLabel || description}
              </span>
            )}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
