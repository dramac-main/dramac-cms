/**
 * Trial Banner Component
 *
 * Phase BIL-03: Subscription Checkout & Trial
 *
 * Displays a banner for agencies on a Growth trial:
 * - Shows "Growth Trial — X days remaining"
 * - Yellow warning at 3 days, red at 1 day
 * - "Upgrade Now" CTA
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Sparkles, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TrialBannerProps {
  agencyId: string;
  className?: string;
}

interface TrialInfo {
  isOnTrial: boolean;
  daysRemaining: number;
  isExpiringSoon: boolean;
  isLastDay: boolean;
  trialRecord: {
    planType: string;
    expiresAt: string;
  } | null;
}

export function TrialBanner({ agencyId, className }: TrialBannerProps) {
  const [trial, setTrial] = useState<TrialInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrialStatus() {
      try {
        const res = await fetch(
          `/api/billing/paddle/trial-status?agencyId=${encodeURIComponent(agencyId)}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          setTrial(data.data);
        }
      } catch {
        // Silently fail — banner is non-critical
      } finally {
        setLoading(false);
      }
    }

    fetchTrialStatus();
  }, [agencyId]);

  if (loading || !trial?.isOnTrial) return null;

  const urgency = trial.isLastDay
    ? "critical"
    : trial.isExpiringSoon
      ? "warning"
      : "info";

  const expiresDate = trial.trialRecord?.expiresAt
    ? new Date(trial.trialRecord.expiresAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <Alert
      className={cn(
        "flex items-center justify-between",
        urgency === "critical" &&
          "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
        urgency === "warning" &&
          "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
        urgency === "info" &&
          "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {urgency === "critical" ? (
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
        ) : urgency === "warning" ? (
          <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
        ) : (
          <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
        )}
        <AlertDescription
          className={cn(
            "font-medium",
            urgency === "critical" && "text-red-800 dark:text-red-200",
            urgency === "warning" && "text-yellow-800 dark:text-yellow-200",
            urgency === "info" && "text-blue-800 dark:text-blue-200",
          )}
        >
          Growth Trial — {trial.daysRemaining} day
          {trial.daysRemaining !== 1 ? "s" : ""} remaining
          {expiresDate && (
            <span className="hidden sm:inline"> (expires {expiresDate})</span>
          )}
        </AlertDescription>
      </div>
      <Button
        asChild
        size="sm"
        variant={urgency === "critical" ? "destructive" : "default"}
      >
        <Link href="/settings/billing">Upgrade Now</Link>
      </Button>
    </Alert>
  );
}
