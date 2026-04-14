"use client";

/**
 * MetricCard — Reusable dashboard metric card
 *
 * Phase INV-07: Financial Dashboard
 * Displays a KPI value with icon, label, sub-text, and optional trend arrow.
 */

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  subText?: string;
  icon: LucideIcon;
  trend?: number; // percentage change — positive = up, negative = down
  trendLabel?: string;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const VARIANT_STYLES = {
  default: "text-muted-foreground/30",
  success: "text-green-500/30",
  warning: "text-yellow-500/30",
  danger: "text-red-500/30",
};

export function MetricCard({
  label,
  value,
  subText,
  icon: Icon,
  trend,
  trendLabel,
  variant = "default",
  className,
}: MetricCardProps) {
  const TrendIcon =
    trend !== undefined
      ? trend > 0
        ? TrendingUp
        : trend < 0
          ? TrendingDown
          : Minus
      : null;

  const trendColor =
    trend !== undefined
      ? trend > 0
        ? "text-green-600"
        : trend < 0
          ? "text-red-600"
          : "text-muted-foreground"
      : "";

  return (
    <Card className={cn("", className)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {(subText || trend !== undefined) && (
              <div className="flex items-center gap-1.5">
                {TrendIcon && (
                  <span
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-medium",
                      trendColor,
                    )}
                  >
                    <TrendIcon className="h-3 w-3" />
                    {Math.abs(trend!)}%
                  </span>
                )}
                {(trendLabel || subText) && (
                  <span className="text-xs text-muted-foreground">
                    {trendLabel || subText}
                  </span>
                )}
              </div>
            )}
          </div>
          <Icon className={cn("h-8 w-8", VARIANT_STYLES[variant])} />
        </div>
      </CardContent>
    </Card>
  );
}
