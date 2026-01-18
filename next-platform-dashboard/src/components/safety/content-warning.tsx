"use client";

import { AlertTriangle, Shield, ShieldAlert, ShieldX, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SafetyViolation, SeverityLevel } from "@/lib/safety/types";
import { cn } from "@/lib/utils";

interface ContentWarningProps {
  violations: SafetyViolation[];
  onDismiss?: () => void;
  showDetails?: boolean;
  className?: string;
}

const severityConfig: Record<
  SeverityLevel,
  { icon: typeof ShieldAlert; color: string; bgColor: string }
> = {
  low: {
    icon: Shield,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
  },
  medium: {
    icon: ShieldAlert,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
  },
  high: {
    icon: ShieldAlert,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/20",
  },
  critical: {
    icon: ShieldX,
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-100 dark:bg-red-950/30",
  },
};

const severityOrder: SeverityLevel[] = ["low", "medium", "high", "critical"];

export function ContentWarning({
  violations,
  onDismiss,
  showDetails = true,
  className,
}: ContentWarningProps) {
  if (violations.length === 0) return null;

  // Get highest severity
  const highestSeverity = violations.reduce((highest, v) => {
    const currentIndex = severityOrder.indexOf(v.severity);
    const highestIndex = severityOrder.indexOf(highest);
    return currentIndex > highestIndex ? v.severity : highest;
  }, "low" as SeverityLevel);

  const config = severityConfig[highestSeverity];
  const Icon = config.icon;

  // Group violations by category
  const groupedViolations = violations.reduce(
    (acc, v) => {
      const key = v.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(v);
      return acc;
    },
    {} as Record<string, SafetyViolation[]>
  );

  const isDestructive = highestSeverity === "critical" || highestSeverity === "high";

  return (
    <Alert
      variant={isDestructive ? "destructive" : "default"}
      className={cn(
        "relative",
        !isDestructive && config.bgColor,
        className
      )}
    >
      <Icon className={cn("h-4 w-4", isDestructive ? "" : config.color)} />
      <AlertTitle className="flex items-center gap-2">
        Content Warning
        <Badge
          variant={isDestructive ? "destructive" : "secondary"}
          className="text-xs uppercase"
        >
          {highestSeverity}
        </Badge>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm">
          This content has been flagged for potential safety concerns.
        </p>

        {showDetails && (
          <div className="mt-3 space-y-2">
            {Object.entries(groupedViolations).map(([category, categoryViolations]) => (
              <div key={category} className="text-sm">
                <span className="font-medium capitalize">
                  {category.replace(/_/g, " ")}:
                </span>
                <ul className="mt-1 list-inside list-disc pl-2 text-muted-foreground">
                  {categoryViolations.map((v, i) => (
                    <li key={i} className="text-xs">
                      {v.description}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          {violations.length} issue{violations.length > 1 ? "s" : ""} detected
        </p>
      </AlertDescription>

      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6"
          onClick={onDismiss}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Dismiss</span>
        </Button>
      )}
    </Alert>
  );
}

// Minimal version for inline use
interface ContentWarningBadgeProps {
  severity: SeverityLevel;
  count?: number;
  className?: string;
}

export function ContentWarningBadge({
  severity,
  count,
  className,
}: ContentWarningBadgeProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <Badge
      variant={severity === "critical" ? "destructive" : "secondary"}
      className={cn("gap-1", className)}
    >
      <Icon className="h-3 w-3" />
      <span className="capitalize">{severity}</span>
      {count !== undefined && count > 0 && (
        <span className="ml-1">({count})</span>
      )}
    </Badge>
  );
}

// Safety status indicator
interface SafetyStatusProps {
  safe: boolean;
  confidence?: number;
  className?: string;
}

export function SafetyStatus({ safe, confidence, className }: SafetyStatusProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {safe ? (
        <>
          <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-sm text-green-600 dark:text-green-400">
            Content is safe
          </span>
        </>
      ) : (
        <>
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm text-yellow-600 dark:text-yellow-400">
            Content flagged for review
          </span>
        </>
      )}
      {confidence !== undefined && (
        <span className="text-xs text-muted-foreground">
          ({Math.round(confidence * 100)}% confidence)
        </span>
      )}
    </div>
  );
}
