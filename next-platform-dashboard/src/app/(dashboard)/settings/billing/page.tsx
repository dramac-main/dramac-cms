/**
 * Settings Billing Page
 * 
 * Phase EM-59B: Paddle Billing Integration
 * 
 * Primary billing management page for users.
 * Uses Paddle-powered components for subscription management.
 */

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PaddleSubscriptionCard } from "@/components/billing/paddle-subscription-card";
import { UsageDashboard } from "@/components/billing/usage-dashboard";
import { PaddleInvoiceHistory } from "@/components/billing/paddle-invoice-history";
import { ModuleSubscriptions } from "@/components/billing/module-subscriptions";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";

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
      <PageHeader
        title="Billing & Subscription"
        description="Manage your subscription, payment methods, and view invoices."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-[280px]" />}>
          <PaddleSubscriptionCard agencyId={member.agency_id} />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-[280px]" />}>
          <UsageDashboard agencyId={member.agency_id} />
        </Suspense>
      </div>

      <Suspense fallback={<Skeleton className="h-[300px]" />}>
        <ModuleSubscriptions agencyId={member.agency_id} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[400px]" />}>
        <PaddleInvoiceHistory />
      </Suspense>
    </div>
  );
}
