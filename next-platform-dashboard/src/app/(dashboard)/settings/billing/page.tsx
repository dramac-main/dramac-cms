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
