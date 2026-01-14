"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBilling } from "@/lib/hooks/use-billing";
import { formatDate } from "@/lib/utils";
import { BILLING_CONFIG } from "@/lib/stripe/config";
import { CreditCard, Calendar, RefreshCw } from "lucide-react";
import { useState } from "react";

interface SubscriptionCardProps {
  agencyId: string;
}

export function SubscriptionCard({ agencyId }: SubscriptionCardProps) {
  const { data: billing, isLoading } = useBilling(agencyId);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubscribe = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId, billingCycle: "monthly" }),
      });
      const { url } = await response.json();
      window.location.href = url;
    } finally {
      setIsCreating(false);
    }
  };

  const handleManage = async () => {
    const response = await fetch("/api/billing/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agencyId }),
    });
    const { url } = await response.json();
    window.location.href = url;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-24 bg-muted rounded" />
            <div className="h-4 w-48 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const subscription = billing?.subscription;

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>No active subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Subscribe to start adding clients to your agency.
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">${BILLING_CONFIG.pricePerSeatMonthly}</span>
            <span className="text-muted-foreground">/ seat / month</span>
          </div>
          <Button onClick={handleSubscribe} disabled={isCreating} className="w-full">
            {isCreating ? "Loading..." : "Subscribe Now"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    trialing: "bg-blue-100 text-blue-800",
    past_due: "bg-red-100 text-red-800",
    canceled: "bg-gray-100 text-gray-800",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <Badge className={statusColors[subscription.status] || ""}>
            {subscription.status}
          </Badge>
        </div>
        <CardDescription>
          {subscription.billing_cycle === "yearly" ? "Annual" : "Monthly"} billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Client seats</span>
            <span className="font-semibold">{subscription.quantity}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Monthly cost</span>
            <span className="font-semibold">
              ${subscription.quantity * BILLING_CONFIG.pricePerSeatMonthly}
            </span>
          </div>
          {subscription.current_period_end && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Next billing
              </span>
              <span className="text-sm">
                {formatDate(subscription.current_period_end)}
              </span>
            </div>
          )}
          {subscription.trial_end && subscription.status === "trialing" && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Trial ends</span>
              <span className="text-sm">{formatDate(subscription.trial_end)}</span>
            </div>
          )}
        </div>

        {subscription.cancel_at_period_end && (
          <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
            Your subscription will be canceled at the end of the billing period.
          </div>
        )}

        <Button variant="outline" onClick={handleManage} className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Manage Subscription
        </Button>
      </CardContent>
    </Card>
  );
}
