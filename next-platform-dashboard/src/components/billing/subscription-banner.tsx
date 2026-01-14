"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSubscriptionStatus } from "@/lib/hooks/use-billing";
import { AlertTriangle, Clock, CreditCard } from "lucide-react";

interface SubscriptionBannerProps {
  agencyId: string;
  onUpgrade: () => void;
}

export function SubscriptionBanner({ agencyId, onUpgrade }: SubscriptionBannerProps) {
  const {
    isTrialing,
    isPastDue,
    trialDaysRemaining,
    needsPaymentMethod,
  } = useSubscriptionStatus(agencyId);

  if (isPastDue) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Payment Failed</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Your last payment failed. Please update your payment method to continue using the platform.</span>
          <Button variant="outline" size="sm" onClick={onUpgrade}>
            Update Payment
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (needsPaymentMethod) {
    return (
      <Alert className="mb-4 border-yellow-500 bg-yellow-50">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">Trial Ending Soon</AlertTitle>
        <AlertDescription className="flex items-center justify-between text-yellow-700">
          <span>Your trial ends in {trialDaysRemaining} days. Add a payment method to continue.</span>
          <Button variant="outline" size="sm" onClick={onUpgrade}>
            Add Payment Method
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isTrialing) {
    return (
      <Alert className="mb-4 border-blue-500 bg-blue-50">
        <CreditCard className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Free Trial</AlertTitle>
        <AlertDescription className="text-blue-700">
          You have {trialDaysRemaining} days remaining in your free trial.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
