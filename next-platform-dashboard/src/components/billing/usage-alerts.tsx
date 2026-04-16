/**
 * Usage Alerts Component
 *
 * Phase BIL-04: Billing Settings Dashboard
 *
 * Inline threshold alerts for usage metrics:
 * - 80% yellow warning
 * - 95% orange alert
 * - 100%+ red overage with cost info
 */

"use client";

import { AlertTriangle, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { OVERAGE_RATES, type PlanType } from "@/lib/paddle/client";

interface UsageAlert {
  metric: string;
  percent: number;
  used: number;
  included: number;
  overage: number;
}

interface UsageAlertsProps {
  planType: PlanType;
  alerts: UsageAlert[];
  className?: string;
}

export function UsageAlerts({ planType, alerts, className }: UsageAlertsProps) {
  const activeAlerts = alerts.filter((a) => a.percent >= 80);

  if (activeAlerts.length === 0) return null;

  const rates = OVERAGE_RATES[planType];

  return (
    <div className={cn("space-y-2", className)}>
      {activeAlerts.map((alert) => {
        const level =
          alert.percent >= 100
            ? "red"
            : alert.percent >= 95
              ? "orange"
              : "yellow";

        const overageRate = getOverageRate(alert.metric, rates);

        return (
          <Alert
            key={alert.metric}
            className={cn(
              level === "red" &&
                "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
              level === "orange" &&
                "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800",
              level === "yellow" &&
                "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
            )}
          >
            {level === "red" ? (
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            ) : (
              <TrendingUp
                className={cn(
                  "h-4 w-4",
                  level === "orange"
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-yellow-600 dark:text-yellow-400",
                )}
              />
            )}
            <AlertDescription
              className={cn(
                level === "red" && "text-red-800 dark:text-red-200",
                level === "orange" && "text-orange-800 dark:text-orange-200",
                level === "yellow" && "text-yellow-800 dark:text-yellow-200",
              )}
            >
              <strong>{alert.metric}</strong>: {alert.used.toLocaleString()} /{" "}
              {alert.included.toLocaleString()} ({alert.percent.toFixed(0)}%)
              {alert.overage > 0 && overageRate && (
                <span className="ml-1">
                  — {alert.overage.toLocaleString()} overage at{" "}
                  {formatOverageRate(overageRate)} each
                </span>
              )}
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}

function getOverageRate(
  metric: string,
  rates: (typeof OVERAGE_RATES)[PlanType],
): number | null {
  const metricMap: Record<string, keyof typeof rates> = {
    "Automation Runs": "automationRuns",
    "AI Actions": "aiActions",
    "Email Sends": "emailSends",
    "File Storage": "fileStorageMb",
  };
  const key = metricMap[metric];
  return key ? rates[key] : null;
}

function formatOverageRate(rate: number): string {
  if (rate >= 0.01) return `$${rate.toFixed(2)}`;
  if (rate >= 0.001) return `$${rate.toFixed(3)}`;
  return `$${rate.toFixed(4)}`;
}
