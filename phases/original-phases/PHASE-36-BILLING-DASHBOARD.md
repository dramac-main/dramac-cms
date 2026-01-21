# Phase 36: Billing & Payments - Dashboard

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-33-BILLING-FOUNDATION.md` and `PHASE-34-BILLING-WEBHOOKS.md`

---

## 🎯 Objective

Build billing settings page with subscription management, invoice history, and payment method controls.

---

## 📋 Prerequisites

- [ ] Phase 33-35 completed (Billing system)
- [ ] Stripe portal configured
- [ ] Test subscription data available

---

## ✅ Tasks

### Task 36.1: Billing Page Layout

**File: `src/app/(dashboard)/settings/billing/page.tsx`**

```typescript
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubscriptionCard } from "@/components/billing/subscription-card";
import { UsageCard } from "@/components/billing/usage-card";
import { InvoiceHistory } from "@/components/billing/invoice-history";
import { ModuleSubscriptions } from "@/components/billing/module-subscriptions";
import { PaymentMethods } from "@/components/billing/payment-methods";
import { Skeleton } from "@/components/ui/skeleton";

export default async function BillingPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user's agency
  const { data: member } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", user.id)
    .single();

  if (!member || member.role !== "owner") {
    redirect("/settings");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription, payment methods, and view invoices.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-[280px]" />}>
          <SubscriptionCard agencyId={member.agency_id} />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-[280px]" />}>
          <UsageCard agencyId={member.agency_id} />
        </Suspense>
      </div>

      <Suspense fallback={<Skeleton className="h-[200px]" />}>
        <PaymentMethods agencyId={member.agency_id} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[300px]" />}>
        <ModuleSubscriptions agencyId={member.agency_id} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[400px]" />}>
        <InvoiceHistory agencyId={member.agency_id} />
      </Suspense>
    </div>
  );
}
```

### Task 36.2: Subscription Card

**File: `src/components/billing/subscription-card.tsx`**

```typescript
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
```

### Task 36.3: Usage Card

**File: `src/components/billing/usage-card.tsx`**

```typescript
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useBilling } from "@/lib/hooks/use-billing";
import { Users, Globe, Layers } from "lucide-react";

interface UsageCardProps {
  agencyId: string;
}

export function UsageCard({ agencyId }: UsageCardProps) {
  const { data: billing, isLoading } = useBilling(agencyId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const subscription = billing?.subscription;
  const totalClients = billing?.totalClients || 0;
  const currentSeats = subscription?.quantity || 0;
  const usagePercent = currentSeats > 0 ? (totalClients / currentSeats) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Usage
        </CardTitle>
        <CardDescription>Current resource usage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Client seats used</span>
            <span className="font-medium">{totalClients} / {currentSeats}</span>
          </div>
          <Progress value={usagePercent} className="h-2" />
          {usagePercent >= 90 && (
            <p className="text-xs text-yellow-600">
              You're approaching your seat limit. Adding more clients will increase your subscription.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-3 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{totalClients}</div>
            <div className="text-xs text-muted-foreground">Active Clients</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <Globe className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{currentSeats}</div>
            <div className="text-xs text-muted-foreground">Seats Included</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Your subscription automatically adjusts based on the number of active clients.
        </p>
      </CardContent>
    </Card>
  );
}
```

### Task 36.4: Invoice History

**File: `src/components/billing/invoice-history.tsx`**

```typescript
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBilling } from "@/lib/hooks/use-billing";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Download, ExternalLink, Receipt } from "lucide-react";

interface InvoiceHistoryProps {
  agencyId: string;
}

export function InvoiceHistory({ agencyId }: InvoiceHistoryProps) {
  const { data: billing, isLoading } = useBilling(agencyId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const invoices = billing?.invoices || [];

  const statusColors: Record<string, string> = {
    paid: "bg-green-100 text-green-800",
    open: "bg-blue-100 text-blue-800",
    draft: "bg-gray-100 text-gray-800",
    uncollectible: "bg-red-100 text-red-800",
    void: "bg-gray-100 text-gray-800",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Invoice History
        </CardTitle>
        <CardDescription>View and download your past invoices</CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No invoices yet. Your first invoice will appear after your trial ends.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{formatDate(invoice.created_at)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {invoice.period_start && invoice.period_end
                      ? `${formatDate(invoice.period_start)} - ${formatDate(invoice.period_end)}`
                      : "-"}
                  </TableCell>
                  <TableCell>{formatCurrency(invoice.amount_due / 100)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[invoice.status] || ""}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {invoice.invoice_pdf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {invoice.hosted_invoice_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={invoice.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
```

### Task 36.5: Payment Methods Component

**File: `src/components/billing/payment-methods.tsx`**

```typescript
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
```

### Task 36.6: Module Subscriptions Component

**File: `src/components/billing/module-subscriptions.tsx`**

```typescript
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useModuleSubscriptions, useCancelModuleSubscription } from "@/lib/hooks/use-module-subscription";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Layers, Trash2, ExternalLink } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

interface ModuleSubscriptionsProps {
  agencyId: string;
}

export function ModuleSubscriptions({ agencyId }: ModuleSubscriptionsProps) {
  const { data: subscriptions, isLoading } = useModuleSubscriptions(agencyId);
  const cancelMutation = useCancelModuleSubscription();

  const handleCancel = (moduleId: string) => {
    cancelMutation.mutate({ agencyId, moduleId });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Module Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeSubscriptions = subscriptions?.filter(
    (s) => s.status === "active" && !s.cancel_at_period_end
  ) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Module Subscriptions
            </CardTitle>
            <CardDescription>Modules you've subscribed to</CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link href="/marketplace">
              <ExternalLink className="h-4 w-4 mr-2" />
              Browse Modules
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeSubscriptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No module subscriptions yet.</p>
            <p className="text-sm">Visit the marketplace to add powerful features to your sites.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeSubscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-md">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{sub.module?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {sub.billing_cycle === "yearly" ? "Annual" : "Monthly"} •
                      Renews {formatDate(sub.current_period_end)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{sub.module?.category}</Badge>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Module Subscription</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel {sub.module?.name}? You'll still have access until{" "}
                          {formatDate(sub.current_period_end)}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCancel(sub.module_id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Cancel Subscription
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Task 36.7: Utility Formatters

**File: `src/lib/utils.ts` (add these functions)**

```typescript
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDateRange(start: string | Date, end: string | Date): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  
  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}
```

---

## 📐 Acceptance Criteria

- [ ] Billing page loads with all sections
- [ ] Subscription card shows correct status
- [ ] Usage card displays seat counts
- [ ] Invoice history table populated
- [ ] Payment methods link to Stripe portal
- [ ] Module subscriptions display correctly
- [ ] Cancel module dialog works
- [ ] All amounts formatted correctly

---

## 📁 Files Created This Phase

```
src/app/(dashboard)/settings/billing/
└── page.tsx

src/components/billing/
├── subscription-card.tsx
├── usage-card.tsx
├── invoice-history.tsx
├── payment-methods.tsx
└── module-subscriptions.tsx

src/lib/
└── utils.ts (updated)
```

---

## ➡️ Next Phase

**Phase 37: Site Renderer - Foundation** - Set up the published site rendering system.
