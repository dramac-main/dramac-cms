"use client";

import { useState, useEffect } from "react";
import type { PaymentSummary } from "../actions/payment-actions";
import { getPaymentSummary } from "../actions/payment-actions";
import { PaymentMethodIcon } from "./payment-method-icon";
import { AmountDisplay } from "./amount-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { PaymentMethod } from "../types/payment-types";

interface PaymentSummaryCardProps {
  siteId: string;
}

export function PaymentSummaryCard({ siteId }: PaymentSummaryCardProps) {
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPaymentSummary(siteId)
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [siteId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payment Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Collected</p>
            <p className="text-lg font-semibold text-green-600">
              <AmountDisplay amount={summary.totalCollected} />
            </p>
            <p className="text-xs text-muted-foreground">
              {summary.paymentCount} payments
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Refunded</p>
            <p className="text-lg font-semibold text-red-600">
              <AmountDisplay amount={summary.totalRefunded} />
            </p>
            <p className="text-xs text-muted-foreground">
              {summary.refundCount} refunds
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Net</p>
            <p className="text-lg font-semibold">
              <AmountDisplay amount={summary.netCollected} />
            </p>
          </div>
        </div>

        {summary.byMethod.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                By Method
              </p>
              {summary.byMethod.map((m) => (
                <div
                  key={m.method}
                  className="flex items-center justify-between text-sm"
                >
                  <PaymentMethodIcon method={m.method as PaymentMethod} />
                  <div className="text-right">
                    <AmountDisplay amount={m.total} className="font-medium" />
                    <span className="text-xs text-muted-foreground ml-1">
                      ({m.count})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
