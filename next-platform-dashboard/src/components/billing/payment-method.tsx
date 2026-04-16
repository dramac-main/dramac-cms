/**
 * Payment Method Component
 *
 * Phase BIL-07: Payment Methods & Cancellation
 *
 * Displays current payment method info and provides an "Update Payment Method"
 * button that opens Paddle.js overlay for secure payment method updates.
 */

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPaymentUpdateTransactionPaddle } from "@/lib/paddle/billing-actions";

interface PaymentMethodProps {
  agencyId: string;
  /** If known, the last 4 digits of the card */
  cardLast4?: string;
  /** If known, the card brand (visa, mastercard, etc.) */
  cardBrand?: string;
  /** If known, the expiry date (MM/YY) */
  cardExpiry?: string;
  /** The subscription status */
  subscriptionStatus?: string;
}

export function PaymentMethod({
  agencyId,
  cardLast4,
  cardBrand,
  cardExpiry,
  subscriptionStatus,
}: PaymentMethodProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdatePaymentMethod = async () => {
    setIsUpdating(true);
    try {
      const result = await getPaymentUpdateTransactionPaddle(agencyId);

      if (!result.success || !result.data?.transactionId) {
        toast.error(
          result.error || "Unable to update payment method right now",
        );
        return;
      }

      // Open Paddle.js checkout with the transaction ID for payment update
      if (typeof window !== "undefined" && (window as any).Paddle) {
        (window as any).Paddle.Checkout.open({
          transactionId: result.data.transactionId,
        });
      } else {
        toast.error("Payment system not loaded. Please refresh and try again.");
      }
    } catch {
      toast.error("Failed to update payment method");
    } finally {
      setIsUpdating(false);
    }
  };

  // Don't show for canceled/free subscriptions
  if (
    !subscriptionStatus ||
    subscriptionStatus === "canceled" ||
    subscriptionStatus === "free"
  ) {
    return null;
  }

  const brandDisplay = cardBrand
    ? cardBrand.charAt(0).toUpperCase() + cardBrand.slice(1)
    : "Card";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4" />
          Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {cardLast4 ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-14 items-center justify-center rounded border bg-muted text-xs font-medium">
                {brandDisplay}
              </div>
              <div>
                <p className="text-sm font-medium">
                  •••• •••• •••• {cardLast4}
                </p>
                {cardExpiry && (
                  <p className="text-xs text-muted-foreground">
                    Expires {cardExpiry}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Payment method on file with Paddle
          </p>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleUpdatePaymentMethod}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Update Payment Method
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
