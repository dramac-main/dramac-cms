"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Check, CreditCard, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SubscriptionDetailsProps {
  userId: string;
}

interface SubscriptionData {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
}

interface UsageData {
  sites: number;
  clients: number;
  storage_gb: number;
  ai_generations: number;
}

export function SubscriptionDetails({ userId }: SubscriptionDetailsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        // Fetch real subscription and usage data
        const [subRes, usageRes] = await Promise.all([
          fetch(`/api/billing/subscription?userId=${userId}`).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(`/api/billing/usage?userId=${userId}`).then(r => r.ok ? r.json() : null).catch(() => null),
        ]);

        if (subRes?.data) {
          setSubscription({
            plan: subRes.data.plan_id || subRes.data.subscription_plan || "starter",
            status: subRes.data.status || "active",
            currentPeriodEnd: subRes.data.current_period_end || null,
          });
        } else {
          // Default to free/starter plan if no subscription found
          setSubscription({ plan: "starter", status: "active", currentPeriodEnd: null });
        }

        if (usageRes) {
          setUsage(usageRes);
        }
      } catch {
        // Default to free plan on error
        setSubscription({ plan: "starter", status: "active", currentPeriodEnd: null });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingData();
  }, [userId]);

  const handleManageBilling = async () => {
    try {
      toast.info("Opening billing portal...");
      const res = await fetch("/api/billing/paddle/subscription/update-payment", {
        method: "POST",
      }).then(r => r.json()).catch(() => null);
      if (res?.url) {
        window.location.href = res.url;
      } else {
        toast.error("Billing portal not available yet. Contact support.");
      }
    } catch {
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

  const planName = subscription?.plan === "enterprise" ? "Enterprise"
    : subscription?.plan === "professional" ? "Professional"
    : "Starter";

  const isFreePlan = !subscription?.plan || subscription.plan === "starter";

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{planName}</h3>
            <Badge>Current Plan</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {isFreePlan ? "Free forever" : "Active subscription"}
          </p>
          {subscription?.currentPeriodEnd && (
            <p className="text-xs text-muted-foreground mt-1">
              Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-ZM")}
            </p>
          )}
        </div>
        {!isFreePlan && (
          <Button variant="outline" size="sm" onClick={handleManageBilling}>
            <CreditCard className="w-4 h-4 mr-2" />
            Manage Billing
            <ExternalLink className="w-3 h-3 ml-2" />
          </Button>
        )}
      </div>

      {/* Plan Features */}
      <div className="p-4 rounded-lg border">
        <h4 className="font-semibold mb-3">{planName} Plan Features</h4>
        <ul className="space-y-2">
          {isFreePlan ? (
            <>
              <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-600 shrink-0" />Up to 3 clients</li>
              <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-600 shrink-0" />Basic site builder</li>
              <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-600 shrink-0" />Community support</li>
            </>
          ) : (
            <>
              <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-600 shrink-0" />Unlimited clients</li>
              <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-600 shrink-0" />Advanced site builder</li>
              <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-600 shrink-0" />Priority support</li>
              <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-600 shrink-0" />White-label options</li>
            </>
          )}
        </ul>
      </div>

      {/* Real Usage Stats */}
      {usage && (
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-4">Current Usage</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{usage.clients}</p>
              <p className="text-xs text-muted-foreground">Active Clients</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{usage.sites}</p>
              <p className="text-xs text-muted-foreground">Total Sites</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{usage.storage_gb}</p>
              <p className="text-xs text-muted-foreground">Storage (GB)</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{usage.ai_generations}</p>
              <p className="text-xs text-muted-foreground">AI Generations</p>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade CTA for free plans */}
      {isFreePlan && (
        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
          <h4 className="font-semibold mb-1">Ready to grow?</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Upgrade to unlock more clients, advanced features, and priority support.
          </p>
          <Button onClick={handleManageBilling}>
            View Plans
          </Button>
        </div>
      )}
    </div>
  );
}
