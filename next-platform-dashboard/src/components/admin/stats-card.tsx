import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  trend,
  icon,
  className,
}: StatsCardProps) {
  const trendDirection = trend
    ? trend.value > 0
      ? "up"
      : trend.value < 0
      ? "down"
      : "neutral"
    : null;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div
            className={cn(
              "flex items-center text-xs mt-2",
              trendDirection === "up" && "text-green-600",
              trendDirection === "down" && "text-red-600",
              trendDirection === "neutral" && "text-muted-foreground"
            )}
          >
            {trendDirection === "up" && <TrendingUp className="h-3 w-3 mr-1" />}
            {trendDirection === "down" && <TrendingDown className="h-3 w-3 mr-1" />}
            {trendDirection === "neutral" && <Minus className="h-3 w-3 mr-1" />}
            <span>
              {trend.value > 0 && "+"}
              {trend.value}% {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
