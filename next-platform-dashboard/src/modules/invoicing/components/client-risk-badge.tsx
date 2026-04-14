"use client";

/**
 * Client Risk Badge
 *
 * Phase INV-11: Small badge (green/yellow/red) on invoice/client views
 * showing AI-assessed risk level.
 */

import { useState, useEffect } from "react";
import { ShieldAlert, ShieldCheck, Shield, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getClientRiskScore } from "../actions/ai-actions";
import type { ClientRiskScore } from "../types/ai-types";

interface ClientRiskBadgeProps {
  siteId: string;
  contactId: string;
  /** If true, loads automatically on mount. Otherwise shows a clickable badge. */
  autoLoad?: boolean;
}

export function ClientRiskBadge({
  siteId,
  contactId,
  autoLoad = false,
}: ClientRiskBadgeProps) {
  const [risk, setRisk] = useState<ClientRiskScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRisk = () => {
    if (!siteId || !contactId) return;
    setLoading(true);
    setError(null);
    getClientRiskScore(siteId, contactId)
      .then((result) => {
        if (result.error) {
          setError(result.error);
        } else {
          setRisk(result.data);
        }
      })
      .catch(() => setError("Failed"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (autoLoad) loadRisk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, contactId, autoLoad]);

  if (loading) {
    return (
      <Badge variant="outline" className="gap-1 text-xs">
        <Loader2 className="h-3 w-3 animate-spin" />
        Scoring...
      </Badge>
    );
  }

  if (!risk && !error) {
    return (
      <Badge
        variant="outline"
        className="gap-1 text-xs cursor-pointer hover:bg-muted"
        onClick={loadRisk}
      >
        <Shield className="h-3 w-3" />
        Risk Score
      </Badge>
    );
  }

  if (error) {
    return (
      <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
        <Shield className="h-3 w-3" />
        N/A
      </Badge>
    );
  }

  const ratingConfig = {
    low: {
      variant: "default" as const,
      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
      icon: ShieldCheck,
      label: "Low Risk",
    },
    medium: {
      variant: "default" as const,
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
      icon: Shield,
      label: "Medium Risk",
    },
    high: {
      variant: "default" as const,
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
      icon: ShieldAlert,
      label: "High Risk",
    },
  };

  const config = ratingConfig[risk!.riskRating];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={config.variant}
            className={`gap-1 text-xs cursor-help ${config.className}`}
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <p className="font-medium">
              Risk Score: {risk!.score}/100
            </p>
            <p>On-time rate: {risk!.factors.onTimePaymentRate}%</p>
            <p>Avg days to pay: {risk!.factors.averageDaysToPay}</p>
            {risk!.factors.overdueCount > 0 && (
              <p>Overdue invoices: {risk!.factors.overdueCount}</p>
            )}
            <p className="text-muted-foreground italic">
              {risk!.recommendation}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
