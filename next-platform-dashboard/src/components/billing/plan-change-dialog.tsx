"use client";

import { useState, useTransition } from "react";
import {
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Check,
  Loader2,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  changeSubscriptionPlanPaddle,
  previewPlanChangePaddle,
  validateDowngradePaddle,
} from "@/lib/paddle/billing-actions";
import {
  PLAN_CONFIGS,
  formatPrice,
  getPlanLimits,
  type PlanType,
} from "@/lib/paddle/client";
import { PLATFORM } from "@/lib/constants/platform";

// ============================================================================
// Types
// ============================================================================

interface PlanChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: PlanType;
  currentBillingCycle: "monthly" | "yearly";
  agencyId: string;
}

interface DowngradeBlocker {
  resource: string;
  current: number;
  limit: number;
  message: string;
}

interface PlanPreview {
  currentAmount: number;
  newAmount: number;
  proratedCredit: number;
  amountDue: number;
  effectiveDate: string;
}

// ============================================================================
// Constants
// ============================================================================

const PLAN_ORDER: PlanType[] = ["starter", "growth", "agency"];

const PLAN_HIGHLIGHTS: Record<PlanType, string[]> = {
  starter: ["5 websites", "3 team members", "Basic analytics", "Email support"],
  growth: [
    "15 websites",
    "8 team members",
    "Advanced analytics",
    "Priority support",
    "Custom domains",
  ],
  agency: [
    "30 websites",
    "20 team members",
    `White-label (remove ${PLATFORM.name} branding)`,
    "Dedicated support",
    "API access",
    "Custom integrations",
  ],
};

// ============================================================================
// Component
// ============================================================================

export function PlanChangeDialog({
  open,
  onOpenChange,
  currentPlan,
  currentBillingCycle,
  agencyId,
}: PlanChangeDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [step, setStep] = useState<"select" | "confirm">("select");
  const [blockers, setBlockers] = useState<DowngradeBlocker[]>([]);
  const [preview, setPreview] = useState<PlanPreview | null>(null);
  const [isPending, startTransition] = useTransition();

  const isUpgrade = (target: PlanType) =>
    PLAN_ORDER.indexOf(target) > PLAN_ORDER.indexOf(currentPlan);

  const isDowngrade = (target: PlanType) =>
    PLAN_ORDER.indexOf(target) < PLAN_ORDER.indexOf(currentPlan);

  function handleClose() {
    setSelectedPlan(null);
    setStep("select");
    setBlockers([]);
    setPreview(null);
    onOpenChange(false);
  }

  function handleSelectPlan(plan: PlanType) {
    if (plan === currentPlan) return;
    setSelectedPlan(plan);

    startTransition(async () => {
      // For downgrades, validate first
      if (isDowngrade(plan)) {
        const result = await validateDowngradePaddle(agencyId, plan);
        if (!result.success) {
          toast.error(result.error || "Validation failed");
          return;
        }
        if (!result.allowed) {
          setBlockers(result.blockers || []);
          setStep("confirm");
          return;
        }
      }

      // Preview proration
      const previewResult = await previewPlanChangePaddle(
        agencyId,
        plan,
        currentBillingCycle,
      );
      if (previewResult.success && previewResult.preview) {
        setPreview(previewResult.preview);
      }
      setBlockers([]);
      setStep("confirm");
    });
  }

  function handleConfirmChange() {
    if (!selectedPlan) return;

    startTransition(async () => {
      const result = await changeSubscriptionPlanPaddle(
        agencyId,
        selectedPlan,
        currentBillingCycle,
        isUpgrade(selectedPlan),
      );

      if (result.success) {
        const action = isUpgrade(selectedPlan) ? "Upgraded" : "Downgraded";
        const planName =
          selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1);

        if (isUpgrade(selectedPlan)) {
          toast.success(
            `${action} to ${planName}! Changes are effective immediately.`,
          );
        } else {
          toast.success(
            `${action} to ${planName}. You'll keep your current features until the end of your billing period.`,
          );
        }
        handleClose();
      } else {
        toast.error(result.error || "Failed to change plan");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === "select" ? "Change Your Plan" : "Confirm Plan Change"}
          </DialogTitle>
          <DialogDescription>
            {step === "select"
              ? "Select a new plan. Upgrades take effect immediately. Downgrades apply at your next billing date."
              : selectedPlan && isUpgrade(selectedPlan)
                ? "Review your upgrade details below."
                : "Review the downgrade details below."}
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="grid gap-4 py-4">
            {PLAN_ORDER.map((plan) => {
              const key =
                `${plan}_${currentBillingCycle}` as keyof typeof PLAN_CONFIGS;
              const config = PLAN_CONFIGS[key];
              if (!config) return null;

              const isCurrent = plan === currentPlan;
              const upgrade = isUpgrade(plan);
              const downgrade = isDowngrade(plan);

              return (
                <Card
                  key={plan}
                  className={`cursor-pointer transition-colors ${
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  } ${selectedPlan === plan ? "ring-2 ring-primary" : ""}`}
                  onClick={() => !isCurrent && handleSelectPlan(plan)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{config.name}</h3>
                        {isCurrent && (
                          <Badge variant="secondary">Current Plan</Badge>
                        )}
                        {upgrade && (
                          <Badge
                            variant="default"
                            className="bg-green-600 text-white"
                          >
                            <ArrowUp className="mr-1 h-3 w-3" />
                            Upgrade
                          </Badge>
                        )}
                        {downgrade && (
                          <Badge variant="outline" className="text-orange-600">
                            <ArrowDown className="mr-1 h-3 w-3" />
                            Downgrade
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {PLAN_HIGHLIGHTS[plan].join(" · ")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {formatPrice(config.amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        /{config.interval}
                      </div>
                    </div>
                    {isPending && selectedPlan === plan && (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {step === "confirm" && selectedPlan && blockers.length > 0 && (
          <div className="py-4 space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <XCircle className="mt-0.5 h-5 w-5 text-destructive shrink-0" />
              <div>
                <h4 className="font-semibold text-destructive">
                  Cannot downgrade yet
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Your current usage exceeds the{" "}
                  {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}{" "}
                  plan limits. Please reduce usage before downgrading.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {blockers.map((blocker, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-md border p-3"
                >
                  <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">
                      {blocker.resource}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {blocker.current} / {blocker.limit}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {blocker.message}
                  </span>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "confirm" && selectedPlan && blockers.length === 0 && (
          <div className="py-4 space-y-4">
            {/* Plan comparison */}
            <div className="grid grid-cols-2 gap-4">
              <PlanSummary
                plan={currentPlan}
                billingCycle={currentBillingCycle}
                label="Current Plan"
              />
              <PlanSummary
                plan={selectedPlan}
                billingCycle={currentBillingCycle}
                label={isUpgrade(selectedPlan) ? "New Plan" : "Downgrading To"}
                highlighted
              />
            </div>

            <Separator />

            {/* Proration preview */}
            {preview && (
              <div className="rounded-lg border p-4 space-y-2">
                <h4 className="font-medium text-sm">Billing Summary</h4>
                {isUpgrade(selectedPlan) ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Prorated credit (remaining period)
                      </span>
                      <span>-{formatPrice(preview.proratedCredit)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        New plan charge
                      </span>
                      <span>{formatPrice(preview.newAmount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Due today</span>
                      <span>{formatPrice(preview.amountDue)}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Your plan will change to{" "}
                    <strong>
                      {selectedPlan.charAt(0).toUpperCase() +
                        selectedPlan.slice(1)}
                    </strong>{" "}
                    on{" "}
                    <strong>
                      {new Date(preview.effectiveDate).toLocaleDateString()}
                    </strong>
                    . You&apos;ll keep your current features until then.
                  </div>
                )}
              </div>
            )}

            {/* What changes */}
            {isUpgrade(selectedPlan) && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                <h4 className="font-medium text-sm text-green-700 dark:text-green-300 mb-2">
                  What you&apos;ll gain
                </h4>
                <GainsList
                  from={currentPlan}
                  to={selectedPlan}
                  billingCycle={currentBillingCycle}
                />
              </div>
            )}

            {isDowngrade(selectedPlan) && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
                <h4 className="font-medium text-sm text-orange-700 dark:text-orange-300 mb-2">
                  What you&apos;ll lose
                </h4>
                <LossesList
                  from={currentPlan}
                  to={selectedPlan}
                  billingCycle={currentBillingCycle}
                />
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("select");
                  setSelectedPlan(null);
                  setPreview(null);
                }}
              >
                Back
              </Button>
              <Button
                onClick={handleConfirmChange}
                disabled={isPending}
                variant={isUpgrade(selectedPlan) ? "default" : "outline"}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUpgrade(selectedPlan) ? "Upgrade Now" : "Confirm Downgrade"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function PlanSummary({
  plan,
  billingCycle,
  label,
  highlighted,
}: {
  plan: PlanType;
  billingCycle: "monthly" | "yearly";
  label: string;
  highlighted?: boolean;
}) {
  const key = `${plan}_${billingCycle}` as keyof typeof PLAN_CONFIGS;
  const config = PLAN_CONFIGS[key];
  if (!config) return null;

  return (
    <div
      className={`rounded-lg border p-3 ${highlighted ? "border-primary bg-primary/5" : ""}`}
    >
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-semibold">{config.name}</div>
      <div className="text-lg font-bold">
        {formatPrice(config.amount)}
        <span className="text-xs font-normal text-muted-foreground">
          /{config.interval}
        </span>
      </div>
    </div>
  );
}

function GainsList({
  from,
  to,
  billingCycle,
}: {
  from: PlanType;
  to: PlanType;
  billingCycle: "monthly" | "yearly";
}) {
  const fromLimits = getPlanLimits(from);
  const toLimits = getPlanLimits(to);

  const gains: string[] = [];
  if (toLimits.sites > fromLimits.sites) {
    gains.push(`${toLimits.sites - fromLimits.sites} more websites`);
  }
  if (toLimits.teamMembers > fromLimits.teamMembers) {
    gains.push(
      `${toLimits.teamMembers - fromLimits.teamMembers} more team members`,
    );
  }
  // Check plan-specific features
  if (to === "agency" && from !== "agency") {
    gains.push(`White-label (remove ${PLATFORM.name} branding)`);
  }

  return (
    <ul className="space-y-1">
      {gains.map((gain, i) => (
        <li
          key={i}
          className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300"
        >
          <Check className="h-3 w-3 shrink-0" />
          {gain}
        </li>
      ))}
    </ul>
  );
}

function LossesList({
  from,
  to,
  billingCycle,
}: {
  from: PlanType;
  to: PlanType;
  billingCycle: "monthly" | "yearly";
}) {
  const fromLimits = getPlanLimits(from);
  const toLimits = getPlanLimits(to);

  const losses: string[] = [];
  if (fromLimits.sites > toLimits.sites) {
    losses.push(
      `Website limit drops from ${fromLimits.sites} to ${toLimits.sites}`,
    );
  }
  if (fromLimits.teamMembers > toLimits.teamMembers) {
    losses.push(
      `Team limit drops from ${fromLimits.teamMembers} to ${toLimits.teamMembers}`,
    );
  }
  if (from === "agency" && to !== "agency") {
    losses.push(`White-label branding removed (${PLATFORM.name} branding restored)`);
  }

  return (
    <ul className="space-y-1">
      {losses.map((loss, i) => (
        <li
          key={i}
          className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300"
        >
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {loss}
        </li>
      ))}
    </ul>
  );
}
