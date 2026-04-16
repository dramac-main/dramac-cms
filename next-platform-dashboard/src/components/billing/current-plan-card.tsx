"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import {
  CircleCheck,
  AlertCircle,
  CircleX,
  Crown,
  Pause,
  Play,
  ExternalLink,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlanChangeDialog } from "./plan-change-dialog";
import { CancellationFlow } from "./cancellation-flow";
import {
  pauseSubscriptionPaddle,
  resumeSubscriptionPaddle,
} from "@/lib/paddle/billing-actions";
import { PLAN_CONFIGS, formatPrice, type PlanType } from "@/lib/paddle/client";
import type { Subscription, SubscriptionStatus } from "@/types/payments";

// v5 plan lookup using PLAN_CONFIGS
function getPaddlePlanInfo(planId: string, billingCycle: string = "monthly") {
  const key = `${planId}_${billingCycle}`;
  const config = PLAN_CONFIGS[key] || PLAN_CONFIGS[`${planId}_monthly`];
  if (config) {
    return {
      name: config.name,
      amount: config.amount,
      interval: config.interval,
      description: config.features[0] || "",
      limits: config.limits,
      usage: config.includedUsage,
    };
  }
  // Fallback for unknown plans
  return {
    name: planId ? planId.charAt(0).toUpperCase() + planId.slice(1) : "Free",
    amount: 0,
    interval: "month" as const,
    description: "No active plan",
    limits: { sites: 1, teamMembers: 1 },
    usage: { automationRuns: 0, aiActions: 0, emailSends: 0, fileStorageMb: 0 },
  };
}

interface CurrentPlanCardProps {
  subscription: Subscription | null;
  agencyId?: string;
  usage?: {
    sites: number;
    teamMembers: number;
    emailSends: number;
    automationRuns: number;
    aiActions: number;
    fileStorageMb: number;
  };
}

const statusConfig: Record<
  SubscriptionStatus,
  { icon: typeof CircleCheck; color: string; bg: string; label: string }
> = {
  active: {
    icon: CircleCheck,
    color: "text-green-500",
    bg: "bg-green-100",
    label: "Active",
  },
  on_trial: {
    icon: Crown,
    color: "text-blue-500",
    bg: "bg-blue-100",
    label: "Trial",
  },
  paused: {
    icon: Pause,
    color: "text-yellow-500",
    bg: "bg-yellow-100",
    label: "Paused",
  },
  past_due: {
    icon: AlertCircle,
    color: "text-orange-500",
    bg: "bg-orange-100",
    label: "Past Due",
  },
  cancelled: {
    icon: CircleX,
    color: "text-red-500",
    bg: "bg-red-100",
    label: "Cancelled",
  },
  expired: {
    icon: CircleX,
    color: "text-gray-500",
    bg: "bg-gray-100",
    label: "Expired",
  },
  unpaid: {
    icon: AlertCircle,
    color: "text-red-500",
    bg: "bg-red-100",
    label: "Unpaid",
  },
};

export function CurrentPlanCard({
  subscription,
  agencyId,
  usage,
}: CurrentPlanCardProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [planChangeOpen, setPlanChangeOpen] = useState(false);

  const billingCycle = (subscription as any)?.billing_cycle || "monthly";
  const planInfo = getPaddlePlanInfo(
    subscription?.plan_id || "free",
    billingCycle,
  );
  const status: SubscriptionStatus =
    (subscription?.status as SubscriptionStatus) || "active";
  const statusInfo = statusConfig[status] || statusConfig.active;
  const StatusIcon = statusInfo.icon;

  const handlePause = async () => {
    if (!agencyId) {
      toast.error("No agency found");
      return;
    }
    setIsLoading("pause");
    const result = await pauseSubscriptionPaddle(agencyId);
    if (!result.success) {
      toast.error(result.error || "Failed to pause");
    } else {
      toast.success("Subscription paused");
    }
    setIsLoading(null);
  };

  const handleResume = async () => {
    if (!agencyId) {
      toast.error("No agency found");
      return;
    }
    setIsLoading("resume");
    const result = await resumeSubscriptionPaddle(agencyId);
    if (!result.success) {
      toast.error(result.error || "Failed to resume");
    } else {
      toast.success("Subscription resumed");
    }
    setIsLoading(null);
  };

  const handleManageBilling = async () => {
    setIsLoading("portal");
    try {
      const res = await fetch(
        "/api/billing/paddle/subscription/update-payment",
        {
          method: "POST",
        },
      )
        .then((r) => r.json())
        .catch(() => null);
      if (res?.url) {
        window.open(res.url, "_blank");
      } else {
        toast.error(
          "Billing portal not available. Visit the billing settings page.",
        );
      }
    } catch {
      toast.error("Failed to open billing portal");
    }
    setIsLoading(null);
  };

  // Use provided usage or defaults
  const currentUsage = usage || {
    sites: 0,
    teamMembers: 0,
    emailSends: 0,
    automationRuns: 0,
    aiActions: 0,
    fileStorageMb: 0,
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Plan Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Plan</CardTitle>
            <Badge className={`${statusInfo.bg} ${statusInfo.color} border-0`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold">{planInfo.name || "Free"}</h3>
            {planInfo.amount > 0 && (
              <p className="text-muted-foreground">
                {formatPrice(planInfo.amount)}/
                {planInfo.interval === "year" ? "year" : "month"}
                {billingCycle === "yearly" && (
                  <span className="text-green-600 ml-2 text-xs font-medium">
                    Save 2 months
                  </span>
                )}
              </p>
            )}
            {planInfo.amount === 0 && (
              <p className="text-muted-foreground">{planInfo.description}</p>
            )}
          </div>

          {subscription && (
            <div className="space-y-2 text-sm">
              {subscription.current_period_end && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {subscription.cancelled_at ? "Access until" : "Renews on"}
                  </span>
                  <span>
                    {format(
                      new Date(subscription.current_period_end),
                      "MMMM d, yyyy",
                    )}
                  </span>
                </div>
              )}
              {subscription.trial_ends_at && status === "on_trial" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trial ends</span>
                  <span>
                    {format(
                      new Date(subscription.trial_ends_at),
                      "MMMM d, yyyy",
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-4">
            {subscription &&
              (subscription as any).paddle_subscription_id &&
              status !== "cancelled" &&
              status !== "expired" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setPlanChangeOpen(true)}
                  >
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Change Plan
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleManageBilling}
                    disabled={isLoading === "portal"}
                  >
                    {isLoading === "portal" && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Manage Billing
                  </Button>

                  {status === "paused" ? (
                    <Button
                      onClick={handleResume}
                      disabled={isLoading === "resume"}
                    >
                      {isLoading === "resume" && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={handlePause}
                        disabled={isLoading === "pause"}
                      >
                        {isLoading === "pause" && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>

                      <CancellationFlow
                        agencyId={agencyId!}
                        currentPlan={
                          (subscription!.plan_id || "starter") as PlanType
                        }
                        billingCycle={billingCycle}
                        periodEndDate={
                          subscription!.current_period_end || undefined
                        }
                      >
                        <Button variant="destructive">Cancel</Button>
                      </CancellationFlow>
                    </>
                  )}
                </>
              )}

            {(!subscription ||
              !(subscription as any).paddle_subscription_id ||
              status === "cancelled" ||
              status === "expired") && (
              <Link href="#plans">
                <Button>Upgrade Now</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsageItem
            label="Websites"
            used={currentUsage.sites}
            limit={planInfo.limits.sites || 1}
          />
          <UsageItem
            label="Team Members"
            used={currentUsage.teamMembers}
            limit={planInfo.limits.teamMembers || 1}
          />
          <UsageItem
            label="Email Sends"
            used={currentUsage.emailSends}
            limit={planInfo.usage.emailSends || 0}
            unit="/month"
          />
          <UsageItem
            label="AI Actions"
            used={currentUsage.aiActions}
            limit={planInfo.usage.aiActions || 0}
            unit="/month"
          />
          <UsageItem
            label="Automation Runs"
            used={currentUsage.automationRuns}
            limit={planInfo.usage.automationRuns || 0}
            unit="/month"
          />
          <UsageItem
            label="Storage"
            used={Math.round((currentUsage.fileStorageMb / 1024) * 10) / 10}
            limit={Math.round((planInfo.usage.fileStorageMb / 1024) * 10) / 10}
            unit="GB"
          />
        </CardContent>
      </Card>

      {/* Plan Change Dialog (BIL-06) */}
      {agencyId && subscription && (
        <PlanChangeDialog
          open={planChangeOpen}
          onOpenChange={setPlanChangeOpen}
          currentPlan={(subscription.plan_id || "starter") as PlanType}
          currentBillingCycle={billingCycle}
          agencyId={agencyId}
        />
      )}
    </div>
  );
}

function UsageItem({
  label,
  used,
  limit,
  unit = "",
}: {
  label: string;
  used: number;
  limit: number;
  unit?: string;
}) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span
          className={
            isAtLimit
              ? "text-destructive font-medium"
              : isNearLimit
                ? "text-orange-500 font-medium"
                : ""
          }
        >
          {used}
          {isUnlimited ? "" : ` / ${limit}`}
          {unit}
          {isUnlimited && " (Unlimited)"}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percentage}
          className={`h-2 ${
            isAtLimit
              ? "[&>div]:bg-destructive"
              : isNearLimit
                ? "[&>div]:bg-orange-500"
                : ""
          }`}
        />
      )}
    </div>
  );
}
