/**
 * Usage Dashboard Component
 *
 * Phase EM-59B: Paddle Billing Integration - UI, Portal & Operations
 *
 * Displays usage metrics for the current billing period:
 * - Automation runs
 * - AI actions
 * - API calls
 *
 * Shows progress, overage alerts, and projected usage.
 *
 * @see phases/enterprise-modules/PHASE-EM-59B-PADDLE-BILLING.md
 */

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Bot,
  Mail,
  HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface UsageData {
  automationRuns: number;
  aiActions: number;
  emailSends: number;
  fileStorageMb: number;
  includedAutomationRuns: number;
  includedAiActions: number;
  includedEmailSends: number;
  includedFileStorageMb: number;
  overageAutomationRuns: number;
  overageAiActions: number;
  overageEmailSends: number;
  overageFileStorageMb: number;
  overageCostCents: number;
  periodStart: string;
  periodEnd: string;
  percentUsed: {
    automationRuns: number;
    aiActions: number;
    emailSends: number;
    fileStorageMb: number;
  };
}

interface UsageDashboardProps {
  agencyId: string;
  className?: string;
}

function formatStorageSize(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
}

// ============================================================================
// Component
// ============================================================================

export function UsageDashboard({ agencyId, className }: UsageDashboardProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch(
          `/api/billing/paddle/usage?agencyId=${agencyId}`,
        );
        if (!res.ok) throw new Error("Failed to fetch usage");
        const response = await res.json();

        // API returns { success: true, data: { current: usage } }
        // Extract the current usage data from the response
        if (response.success && response.data?.current) {
          const currentUsage = response.data.current;
          // Ensure percentUsed exists with defaults
          setUsage({
            ...currentUsage,
            percentUsed: currentUsage.percentUsed || {
              automationRuns: 0,
              aiActions: 0,
              emailSends: 0,
              fileStorageMb: 0,
            },
          });
        } else if (response.data === null) {
          // No active subscription
          setError("No active subscription found");
        } else {
          setError(response.message || "Failed to fetch usage data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
    // Refresh every 5 minutes
    const interval = setInterval(fetchUsage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [agencyId]);

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="animate-pulse h-8 w-48 bg-muted rounded" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse h-40 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !usage) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error || "Failed to load usage data"}
        </AlertDescription>
      </Alert>
    );
  }

  const daysLeft = Math.ceil(
    (new Date(usage.periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  const hasOverage = usage.overageCostCents > 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Period Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Usage This Period</h2>
          <p className="text-muted-foreground">
            {new Date(usage.periodStart).toLocaleDateString()} -{" "}
            {new Date(usage.periodEnd).toLocaleDateString()}
          </p>
        </div>
        <Badge variant={daysLeft < 5 ? "destructive" : "secondary"}>
          {daysLeft} days left
        </Badge>
      </div>

      {/* Overage Warning */}
      {hasOverage && (
        <Alert className="bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800">
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            You&apos;ve exceeded your included limits. Current overage: $
            {(usage.overageCostCents / 100).toFixed(2)}
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UsageCard
          title="Automation Runs"
          icon={<Zap className="w-5 h-5" />}
          used={usage.automationRuns ?? 0}
          included={usage.includedAutomationRuns ?? 0}
          overage={usage.overageAutomationRuns ?? 0}
          percent={usage.percentUsed?.automationRuns ?? 0}
        />
        <UsageCard
          title="AI Actions"
          icon={<Bot className="w-5 h-5" />}
          used={usage.aiActions ?? 0}
          included={usage.includedAiActions ?? 0}
          overage={usage.overageAiActions ?? 0}
          percent={usage.percentUsed?.aiActions ?? 0}
        />
        <UsageCard
          title="Email Sends"
          icon={<Mail className="w-5 h-5" />}
          used={usage.emailSends ?? 0}
          included={usage.includedEmailSends ?? 0}
          overage={usage.overageEmailSends ?? 0}
          percent={usage.percentUsed?.emailSends ?? 0}
        />
        <UsageCard
          title="File Storage"
          icon={<HardDrive className="w-5 h-5" />}
          used={usage.fileStorageMb ?? 0}
          included={usage.includedFileStorageMb ?? 0}
          overage={usage.overageFileStorageMb ?? 0}
          percent={usage.percentUsed?.fileStorageMb ?? 0}
          formatValue={(v) => formatStorageSize(v)}
        />
      </div>

      {/* Projected Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Projected End-of-Period Usage</CardTitle>
          <CardDescription>Based on your current usage rate</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectedUsage currentUsage={usage} daysLeft={daysLeft} />
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Usage Card Sub-Component
// ============================================================================

interface UsageCardProps {
  title: string;
  icon: React.ReactNode;
  used: number;
  included: number;
  overage: number;
  percent: number;
  formatValue?: (v: number) => string;
}

function UsageCard({
  title,
  icon,
  used,
  included,
  overage,
  percent,
  formatValue,
}: UsageCardProps) {
  const isCritical = percent > 95;
  const isWarning = percent >= 80 && percent <= 95;
  const isCaution = percent >= 60 && percent < 80;
  const fmt = formatValue || ((v: number) => v.toLocaleString());

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">
          {fmt(used)}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            / {fmt(included)}
          </span>
        </div>

        <Progress
          value={Number.isFinite(percent) ? Math.min(percent, 100) : 0}
          className={cn(
            "h-2",
            isCritical && "[&>div]:bg-red-500",
            isWarning && "[&>div]:bg-orange-500",
            isCaution && "[&>div]:bg-yellow-500",
          )}
        />

        <div className="flex justify-between items-center mt-2 text-sm">
          <span
            className={cn(
              "font-medium",
              isCritical && "text-red-600",
              isWarning && "text-orange-600",
              isCaution && "text-yellow-600",
            )}
          >
            {Number.isFinite(percent) ? percent.toFixed(1) : "0.0"}% used
          </span>
          {overage > 0 && (
            <Badge variant="destructive" className="text-xs">
              +{fmt(overage)} overage
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Projected Usage Sub-Component
// ============================================================================

interface ProjectedUsageProps {
  currentUsage: UsageData;
  daysLeft: number;
}

function ProjectedUsage({ currentUsage, daysLeft }: ProjectedUsageProps) {
  const periodDays = Math.ceil(
    (new Date(currentUsage.periodEnd).getTime() -
      new Date(currentUsage.periodStart).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  const daysPassed = periodDays - daysLeft;

  const projectUsage = (
    current: number,
    included: number,
  ): { projected: number; willExceed: boolean } => {
    if (daysPassed === 0)
      return { projected: current, willExceed: current > included };
    const dailyRate = current / daysPassed;
    const projected = dailyRate * periodDays;
    return {
      projected: Math.round(projected),
      willExceed: projected > included,
    };
  };

  const projections = {
    automation: projectUsage(
      currentUsage.automationRuns,
      currentUsage.includedAutomationRuns,
    ),
    ai: projectUsage(currentUsage.aiActions, currentUsage.includedAiActions),
    email: projectUsage(
      currentUsage.emailSends,
      currentUsage.includedEmailSends,
    ),
    storage: projectUsage(
      currentUsage.fileStorageMb,
      currentUsage.includedFileStorageMb,
    ),
  };

  const items = [
    {
      name: "Automation Runs",
      ...projections.automation,
      included: currentUsage.includedAutomationRuns,
    },
    {
      name: "AI Actions",
      ...projections.ai,
      included: currentUsage.includedAiActions,
    },
    {
      name: "Email Sends",
      ...projections.email,
      included: currentUsage.includedEmailSends,
    },
    {
      name: "File Storage",
      ...projections.storage,
      included: currentUsage.includedFileStorageMb,
      formatValue: formatStorageSize,
    },
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.name}
          className="flex items-center gap-3 p-3 rounded-lg bg-muted"
        >
          {item.willExceed ? (
            <TrendingUp className="w-5 h-5 text-red-500" />
          ) : (
            <TrendingDown className="w-5 h-5 text-green-500" />
          )}
          <div>
            <p className="text-sm font-medium">{item.name}</p>
            <p
              className={cn(
                "text-lg font-bold",
                item.willExceed && "text-red-600",
              )}
            >
              {"formatValue" in item && item.formatValue
                ? item.formatValue(item.projected)
                : item.projected.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.willExceed
                ? `~${
                    "formatValue" in item && item.formatValue
                      ? item.formatValue(item.projected - item.included)
                      : (item.projected - item.included).toLocaleString()
                  } over`
                : "Within limit"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
