"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard } from "lucide-react";
import { getClientCreditBalance } from "../actions/credit-actions";
import { formatInvoiceAmount } from "../lib/invoicing-utils";

interface ClientCreditBalanceProps {
  siteId: string;
  contactId: string;
  currency?: string;
}

export function ClientCreditBalance({
  siteId,
  contactId,
  currency = "ZMW",
}: ClientCreditBalanceProps) {
  const [balance, setBalance] = useState<{
    totalIssued: number;
    totalApplied: number;
    available: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClientCreditBalance(siteId, contactId)
      .then(setBalance)
      .catch(() => setBalance(null))
      .finally(() => setLoading(false));
  }, [siteId, contactId]);

  if (loading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (!balance || balance.totalIssued === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Credit Balance</CardTitle>
        <CreditCard className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatInvoiceAmount(balance.available, currency)}
        </div>
        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
          <div>
            Total issued: {formatInvoiceAmount(balance.totalIssued, currency)}
          </div>
          <div>
            Applied: {formatInvoiceAmount(balance.totalApplied, currency)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
