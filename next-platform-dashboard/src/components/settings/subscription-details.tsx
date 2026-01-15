"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Check, CreditCard, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  isCurrent: boolean;
}

interface SubscriptionDetailsProps {
  userId: string;
}

// Format currency in Zambian Kwacha
function formatZMW(amount: number): string {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency: "ZMW",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    features: [
      "Up to 3 clients",
      "Basic site builder",
      "Community support",
      "Dramac branding",
    ],
    isCurrent: true,
  },
  {
    id: "professional",
    name: "Professional",
    price: 1250, // ~$49 USD in ZMW
    features: [
      "Up to 25 clients",
      "Advanced site builder",
      "Priority support",
      "White-label options",
      "Custom domains",
    ],
    isCurrent: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 3800, // ~$149 USD in ZMW
    features: [
      "Unlimited clients",
      "Full feature access",
      "Dedicated support",
      "Full white-label",
      "API access",
      "Custom integrations",
    ],
    isCurrent: false,
  },
];

export function SubscriptionDetails({ userId }: SubscriptionDetailsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [billingDate, setBillingDate] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching subscription data
    const fetchSubscription = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setCurrentPlan(plans[0]);
      setBillingDate(null); // Free plan has no billing date
      setIsLoading(false);
    };

    fetchSubscription();
  }, [userId]);

  const handleUpgrade = async (planId: string) => {
    try {
      // In production, this would redirect to Stripe checkout
      toast.info("Redirecting to checkout...");
      // window.location.href = `/api/stripe/checkout?plan=${planId}`;
    } catch (error) {
      toast.error("Failed to start checkout");
    }
  };

  const handleManageBilling = async () => {
    try {
      // In production, this would redirect to Stripe customer portal
      toast.info("Redirecting to billing portal...");
      // window.location.href = "/api/stripe/portal";
    } catch (error) {
      toast.error("Failed to open billing portal");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      {currentPlan && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{currentPlan.name}</h3>
              <Badge>Current Plan</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentPlan.price === 0
                ? "Free forever"
                : `${formatZMW(currentPlan.price)}/month`}
            </p>
            {billingDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Next billing date: {billingDate}
              </p>
            )}
          </div>
          {currentPlan.price > 0 && (
            <Button variant="outline" size="sm" onClick={handleManageBilling}>
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Billing
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
          )}
        </div>
      )}

      {/* Plan Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`p-4 rounded-lg border ${
              plan.isCurrent
                ? "border-primary bg-primary/5"
                : "border-border"
            }`}
          >
            <h4 className="font-semibold">{plan.name}</h4>
            <p className="text-2xl font-bold mt-2">
              {plan.price === 0 ? "Free" : formatZMW(plan.price)}
              {plan.price > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  /month
                </span>
              )}
            </p>

            <ul className="mt-4 space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-4">
              {plan.isCurrent ? (
                <Button className="w-full" variant="outline" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={plan.price > (currentPlan?.price || 0) ? "default" : "outline"}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {plan.price > (currentPlan?.price || 0) ? "Upgrade" : "Downgrade"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Usage Stats */}
      <div className="pt-4 border-t">
        <h4 className="font-medium mb-4">Current Usage</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">2</p>
            <p className="text-xs text-muted-foreground">Active Clients</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">5</p>
            <p className="text-xs text-muted-foreground">Total Sites</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">1</p>
            <p className="text-xs text-muted-foreground">Team Members</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">500MB</p>
            <p className="text-xs text-muted-foreground">Storage Used</p>
          </div>
        </div>
      </div>
    </div>
  );
}
