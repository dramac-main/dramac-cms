"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { SUBSCRIPTION_PLANS, getPrice, getVariantId } from "@/config/plans";
import { createCheckout, changePlan } from "@/lib/actions/billing";
import type { BillingInterval } from "@/types/payments";

interface PricingPlansProps {
  currentPlanId: string;
}

export function PricingPlans({ currentPlanId }: PricingPlansProps) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    if (planId === "free" || planId === currentPlanId) return;

    setLoadingPlan(planId);
    try {
      const result = currentPlanId === "free"
        ? await createCheckout(planId, interval)
        : await changePlan(planId, interval);

      if ("error" in result && result.error) {
        toast.error(result.error);
      } else if ("checkoutUrl" in result && result.checkoutUrl) {
        // Redirect to LemonSqueezy checkout
        window.location.href = result.checkoutUrl;
      } else if ("success" in result && result.success) {
        toast.success("Plan updated successfully!");
      }
    } catch (error) {
      console.error("Plan selection error:", error);
      toast.error("Failed to process request");
    } finally {
      setLoadingPlan(null);
    }
  };

  const yearlySavings = Math.round((1 - 290 / (29 * 12)) * 100);

  return (
    <div className="space-y-6" id="plans">
      {/* Interval Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span
          className={cn(
            "text-sm transition-colors",
            interval === "monthly" ? "font-medium" : "text-muted-foreground"
          )}
        >
          Monthly
        </span>
        <Switch
          checked={interval === "yearly"}
          onCheckedChange={(checked) => setInterval(checked ? "yearly" : "monthly")}
        />
        <span
          className={cn(
            "text-sm transition-colors",
            interval === "yearly" ? "font-medium" : "text-muted-foreground"
          )}
        >
          Yearly
          <span className="ml-1.5 text-xs text-green-600 font-medium">
            (Save {yearlySavings}%)
          </span>
        </span>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const price = getPrice(plan, interval);
          const isCurrent = plan.id === currentPlanId;
          const isPopular = plan.popular;
          const hasVariant = !!getVariantId(plan, interval);

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col",
                isPopular && "border-primary shadow-lg scale-105",
                isCurrent && "border-green-500"
              )}
            >
              {isPopular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                  Current Plan
                </div>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <div className="mb-6">
                  <span className="text-4xl font-bold">${price}</span>
                  {price > 0 && (
                    <span className="text-muted-foreground">
                      /{interval === "yearly" ? "year" : "month"}
                    </span>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={isPopular ? "default" : "outline"}
                  disabled={isCurrent || loadingPlan === plan.id || (!hasVariant && plan.id !== "free")}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {loadingPlan === plan.id && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {isCurrent
                    ? "Current Plan"
                    : plan.id === "free"
                    ? "Free Forever"
                    : currentPlanId === "free"
                    ? "Get Started"
                    : "Switch Plan"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trust Indicators */}
      <div className="text-center space-y-2 pt-4">
        <p className="text-sm text-muted-foreground">
          🔒 Secure checkout powered by LemonSqueezy
        </p>
        <p className="text-xs text-muted-foreground">
          Cancel anytime • No hidden fees • Instant access
        </p>
      </div>
    </div>
  );
}
