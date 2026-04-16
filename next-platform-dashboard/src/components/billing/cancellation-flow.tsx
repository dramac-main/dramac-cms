/**
 * Cancellation Flow Component
 *
 * Phase BIL-07: Payment Methods & Cancellation
 *
 * Multi-step dialog for subscription cancellation:
 *   Step 1 — Save offer (offer downgrade if on Growth/Agency)
 *   Step 2 — Reason selection
 *   Step 3 — Confirmation (what they'll lose, effective date)
 *   Step 4 — Post-cancel acknowledgement
 */

"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowDown,
  Check,
  ChevronRight,
  Loader2,
  MessageSquare,
  Pause,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  cancelSubscriptionPaddle,
  pauseSubscriptionPaddle,
  saveCancellationFeedbackPaddle,
} from "@/lib/paddle/billing-actions";
import { type PlanType, PLAN_CONFIGS, formatPrice } from "@/lib/paddle/client";

type Step = "save-offer" | "reason" | "confirm" | "done";

const CANCEL_REASONS = [
  { value: "too_expensive", label: "Too expensive" },
  { value: "not_using", label: "Not using it enough" },
  { value: "missing_features", label: "Missing features I need" },
  { value: "better_alternative", label: "Found a better alternative" },
  { value: "temporary", label: "Temporary — I'll be back" },
  { value: "other", label: "Other" },
] as const;

interface CancellationFlowProps {
  agencyId: string;
  currentPlan: PlanType;
  billingCycle: "monthly" | "yearly";
  periodEndDate?: string;
  children: React.ReactNode;
}

export function CancellationFlow({
  agencyId,
  currentPlan,
  billingCycle,
  periodEndDate,
  children,
}: CancellationFlowProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("save-offer");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Determine if we can offer a downgrade
  const canOfferDowngrade =
    currentPlan === "agency" || currentPlan === "growth";
  const downgradePlan: PlanType | null =
    currentPlan === "agency"
      ? "growth"
      : currentPlan === "growth"
        ? "starter"
        : null;
  const downgradeConfig = downgradePlan
    ? PLAN_CONFIGS[`${downgradePlan}_${billingCycle}`]
    : null;

  const periodEnd = periodEndDate
    ? new Date(periodEndDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "the end of your billing period";

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset state when dialog closes
      setStep(canOfferDowngrade ? "save-offer" : "reason");
      setReason("");
      setDetails("");
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    setIsLoading(true);
    try {
      const result = await pauseSubscriptionPaddle(agencyId);
      if (result.success) {
        toast.success("Subscription paused. You can resume anytime.");
        setOpen(false);
      } else {
        toast.error(result.error || "Failed to pause subscription");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      // Save feedback first
      if (reason) {
        await saveCancellationFeedbackPaddle(agencyId, {
          reason,
          details: details || undefined,
        });
      }

      // Cancel at end of period (NOT immediately)
      const result = await cancelSubscriptionPaddle(agencyId, false);
      if (result.success) {
        setStep("done");
      } else {
        toast.error(result.error || "Failed to cancel subscription");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const currentConfig = PLAN_CONFIGS[`${currentPlan}_${billingCycle}`];
  const currentPlanFeatures = currentConfig?.features || [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        {/* Step 1: Save Offer */}
        {step === "save-offer" && (
          <>
            <DialogHeader>
              <DialogTitle>Before you go...</DialogTitle>
              <DialogDescription>
                We&apos;d hate to see you leave. Would any of these options work
                better for you?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {/* Pause option */}
              <button
                onClick={handlePause}
                disabled={isLoading}
                className="flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted"
              >
                <Pause className="mt-0.5 h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Pause instead</p>
                  <p className="text-sm text-muted-foreground">
                    Take a break. Your data stays safe and you can resume
                    anytime.
                  </p>
                </div>
              </button>

              {/* Downgrade option */}
              {downgradePlan && downgradeConfig && (
                <button
                  onClick={() => {
                    toast.info(
                      `To downgrade, use the "Change Plan" option on the billing page.`,
                    );
                    setOpen(false);
                  }}
                  className="flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted"
                >
                  <ArrowDown className="mt-0.5 h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium">
                      Downgrade to {downgradeConfig.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Save money at {formatPrice(downgradeConfig.amount, "USD")}
                      /{downgradeConfig.interval} instead.
                    </p>
                  </div>
                </button>
              )}
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                variant="ghost"
                onClick={() => setStep("reason")}
                className="text-muted-foreground"
              >
                Continue canceling
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Reason Selection */}
        {step === "reason" && (
          <>
            <DialogHeader>
              <DialogTitle>Why are you canceling?</DialogTitle>
              <DialogDescription>
                Your feedback helps us improve. Select the reason that best
                describes your situation.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <RadioGroup value={reason} onValueChange={setReason}>
                {CANCEL_REASONS.map((r) => (
                  <div key={r.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={r.value} id={r.value} />
                    <Label htmlFor={r.value} className="cursor-pointer">
                      {r.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {(reason === "other" || reason === "missing_features") && (
                <Textarea
                  className="mt-3"
                  placeholder="Tell us more..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                />
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setStep(canOfferDowngrade ? "save-offer" : "reason")
                }
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={() => setStep("confirm")}
                disabled={!reason}
              >
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3: Confirmation */}
        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Confirm cancellation
              </DialogTitle>
              <DialogDescription>
                Your subscription will remain active until {periodEnd}. After
                that, you&apos;ll lose access to:
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {currentPlanFeatures.slice(0, 6).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <X className="h-3.5 w-3.5 text-destructive" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Keep Subscription
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Canceling...
                  </>
                ) : (
                  "Cancel Subscription"
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 4: Post-Cancel */}
        {step === "done" && (
          <>
            <DialogHeader>
              <DialogTitle>Subscription canceled</DialogTitle>
              <DialogDescription>
                Sorry to see you go. Your access continues until {periodEnd}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                <p className="text-sm">
                  Changed your mind? You can resubscribe at any time from the
                  billing page.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="final-feedback">
                  Anything else you&apos;d like to share? (optional)
                </Label>
                <Textarea
                  id="final-feedback"
                  placeholder="What could we improve?"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                />
                {details && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await saveCancellationFeedbackPaddle(agencyId, {
                        reason: reason || "post_cancel_feedback",
                        details,
                      });
                      toast.success("Thank you for your feedback!");
                    }}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send Feedback
                  </Button>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setOpen(false)}>
                <Check className="mr-2 h-4 w-4" />
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
