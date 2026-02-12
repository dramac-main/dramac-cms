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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  cancelSubscriptionPaddle,
  pauseSubscriptionPaddle,
  resumeSubscriptionPaddle,
} from "@/lib/paddle/billing-actions";
import type { Subscription, SubscriptionStatus } from "@/types/payments";

// Paddle plan lookup (replaces LemonSqueezy plans.ts dependency)
function getPaddlePlanName(planId: string): { name: string; description: string; limits: { sites: number; clients: number; storage_gb: number; ai_generations: number; team_members: number } } {
  const plans: Record<string, { name: string; description: string; limits: { sites: number; clients: number; storage_gb: number; ai_generations: number; team_members: number } }> = {
    starter: { name: "Starter", description: "Perfect for small teams getting started", limits: { sites: 1, clients: 10, storage_gb: 5, ai_generations: 500, team_members: 3 } },
    pro: { name: "Pro", description: "For growing businesses that need more power", limits: { sites: 5, clients: 50, storage_gb: 25, ai_generations: 5000, team_members: 10 } },
    enterprise: { name: "Enterprise", description: "For large organizations with custom requirements", limits: { sites: -1, clients: -1, storage_gb: 100, ai_generations: -1, team_members: -1 } },
    free: { name: "Free", description: "Get started for free", limits: { sites: 1, clients: 3, storage_gb: 0.5, ai_generations: 5, team_members: 1 } },
  };
  return plans[planId] || plans.free;
}

interface CurrentPlanCardProps {
  subscription: Subscription | null;
  agencyId?: string;
  usage?: {
    sites: number;
    clients: number;
    storage_gb: number;
    ai_generations: number;
  };
}

const statusConfig: Record<SubscriptionStatus, { icon: typeof CircleCheck; color: string; bg: string; label: string }> = {
  active: { icon: CircleCheck, color: "text-green-500", bg: "bg-green-100", label: "Active" },
  on_trial: { icon: Crown, color: "text-blue-500", bg: "bg-blue-100", label: "Trial" },
  paused: { icon: Pause, color: "text-yellow-500", bg: "bg-yellow-100", label: "Paused" },
  past_due: { icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-100", label: "Past Due" },
  cancelled: { icon: CircleX, color: "text-red-500", bg: "bg-red-100", label: "Cancelled" },
  expired: { icon: CircleX, color: "text-gray-500", bg: "bg-gray-100", label: "Expired" },
  unpaid: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-100", label: "Unpaid" },
};

export function CurrentPlanCard({ subscription, agencyId, usage }: CurrentPlanCardProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  
  const planInfo = getPaddlePlanName(subscription?.plan_id || "free");
  const status: SubscriptionStatus = (subscription?.status as SubscriptionStatus) || "active";
  const statusInfo = statusConfig[status] || statusConfig.active;
  const StatusIcon = statusInfo.icon;

  const handleCancel = async () => {
    if (!agencyId) { toast.error("No agency found"); return; }
    setIsLoading("cancel");
    const result = await cancelSubscriptionPaddle(agencyId);
    if (!result.success) {
      toast.error(result.error || "Failed to cancel");
    } else {
      toast.success("Subscription cancelled. You'll have access until the end of the billing period.");
    }
    setIsLoading(null);
  };

  const handlePause = async () => {
    if (!agencyId) { toast.error("No agency found"); return; }
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
    if (!agencyId) { toast.error("No agency found"); return; }
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
      const res = await fetch("/api/billing/paddle/subscription/update-payment", {
        method: "POST",
      }).then(r => r.json()).catch(() => null);
      if (res?.url) {
        window.open(res.url, "_blank");
      } else {
        toast.error("Billing portal not available. Visit the billing settings page.");
      }
    } catch {
      toast.error("Failed to open billing portal");
    }
    setIsLoading(null);
  };

  // Use provided usage or defaults
  const currentUsage = usage || {
    sites: 0,
    clients: 0,
    storage_gb: 0,
    ai_generations: 0,
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
            <h3 className="text-2xl font-bold">{planInfo?.name || "Free"}</h3>
            <p className="text-muted-foreground">{planInfo?.description}</p>
          </div>

          {subscription && (
            <div className="space-y-2 text-sm">
              {subscription.current_period_end && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {subscription.cancelled_at ? "Access until" : "Renews on"}
                  </span>
                  <span>
                    {format(new Date(subscription.current_period_end), "MMMM d, yyyy")}
                  </span>
                </div>
              )}
              {subscription.trial_ends_at && status === "on_trial" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trial ends</span>
                  <span>
                    {format(new Date(subscription.trial_ends_at), "MMMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-4">
            {subscription && (subscription as any).paddle_subscription_id && status !== "cancelled" && status !== "expired" && (
              <>
                <Button
                  variant="outline"
                  onClick={handleManageBilling}
                  disabled={isLoading === "portal"}
                >
                  {isLoading === "portal" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage Billing
                </Button>

                {status === "paused" ? (
                  <Button onClick={handleResume} disabled={isLoading === "resume"}>
                    {isLoading === "resume" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
                      {isLoading === "pause" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Cancel</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                          <AlertDialogDescription>
                            You&apos;ll continue to have access until the end of your current
                            billing period. After that, you&apos;ll be downgraded to the Free
                            plan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleCancel}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isLoading === "cancel" && (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            Yes, Cancel
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </>
            )}

            {(!subscription || !(subscription as any).paddle_subscription_id || status === "cancelled" || status === "expired") && (
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
            limit={planInfo?.limits.sites || 1}
          />
          <UsageItem
            label="Clients"
            used={currentUsage.clients}
            limit={planInfo?.limits.clients || 1}
          />
          <UsageItem
            label="Storage"
            used={currentUsage.storage_gb}
            limit={planInfo?.limits.storage_gb || 0.5}
            unit="GB"
          />
          <UsageItem
            label="AI Generations"
            used={currentUsage.ai_generations}
            limit={planInfo?.limits.ai_generations || 5}
            unit="/month"
          />
        </CardContent>
      </Card>
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
