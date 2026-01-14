"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus } from "lucide-react";
import { useState } from "react";

interface PaymentMethodsProps {
  agencyId: string;
}

export function PaymentMethods({ agencyId }: PaymentMethodsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleManagePayments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId }),
      });
      const { url } = await response.json();
      window.location.href = url;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Methods
        </CardTitle>
        <CardDescription>
          Manage your payment methods through the secure Stripe portal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 rounded-lg border border-dashed">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-md">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Manage payment methods</p>
              <p className="text-sm text-muted-foreground">
                Add, update, or remove cards securely via Stripe
              </p>
            </div>
          </div>
          <Button onClick={handleManagePayments} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            Manage
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
