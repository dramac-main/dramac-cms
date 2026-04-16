/**
 * Settings Billing Page
 *
 * Phase EM-59B: Paddle Billing Integration
 * BIL-04: Billing Settings Dashboard
 * BIL-07: Payment Methods & Cancellation
 * BIL-08: Overage Billing Engine
 *
 * Primary billing management page with trial banner, plan overview,
 * usage metrics, payment method, overage summary, and invoice history.
 */

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CurrentPlanCard } from "@/components/billing/current-plan-card";
import { UsageDashboard } from "@/components/billing/usage-dashboard";
import { PaddleInvoiceHistory } from "@/components/billing/paddle-invoice-history";
import { ModuleSubscriptions } from "@/components/billing/module-subscriptions";
import { TrialBanner } from "@/components/billing/trial-banner";
import { PaymentMethod } from "@/components/billing/payment-method";
import { OverageSummary } from "@/components/billing/overage-summary";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pause } from "lucide-react";

export default async function BillingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  // Fetch subscription data for CurrentPlanCard
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("agency_id", member.agency_id)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch Paddle subscription for payment method & status
  const { data: paddleSub } = (await supabase
    .from("paddle_subscriptions")
    .select(
      "status, card_last4, card_brand, card_expiry, plan_type, billing_cycle, current_period_end",
    )
    .eq("agency_id", member.agency_id)
    .in("status", ["active", "trialing", "past_due", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()) as { data: any; error: any };

  // Fetch current period usage for overage summary
  const { data: usagePeriod } = (await supabase
    .from("usage_billing_period")
    .select(
      "overage_automation_runs, overage_ai_actions, overage_email_sends, overage_file_storage_mb, overage_cost",
    )
    .eq("agency_id", member.agency_id)
    .order("period_start", { ascending: false })
    .limit(1)
    .maybeSingle()) as { data: any; error: any };

  const isPaused = paddleSub?.status === "paused";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing & Subscription"
        description="Manage your subscription, payment methods, and view invoices."
      />

      {/* Pause Banner */}
      {isPaused && (
        <Alert className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <Pause className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-300">
            Your subscription is paused. Resume it to regain full access to all
            features.
          </AlertDescription>
        </Alert>
      )}

      {/* Trial Banner - shows only when on trial */}
      <TrialBanner agencyId={member.agency_id} />

      {/* Plan Overview + Usage */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Suspense fallback={<Skeleton className="h-[320px]" />}>
          <CurrentPlanCard
            subscription={subscription as any}
            agencyId={member.agency_id}
          />
        </Suspense>

        <div className="lg:col-span-2">
          <Suspense fallback={<Skeleton className="h-[320px]" />}>
            <UsageDashboard agencyId={member.agency_id} />
          </Suspense>
        </div>
      </div>

      {/* Payment Method (BIL-07) */}
      <PaymentMethod
        agencyId={member.agency_id}
        cardLast4={paddleSub?.card_last4}
        cardBrand={paddleSub?.card_brand}
        cardExpiry={paddleSub?.card_expiry}
        subscriptionStatus={paddleSub?.status}
      />

      {/* Overage Summary (BIL-08) */}
      <OverageSummary
        agencyId={member.agency_id}
        overageAutomationRuns={usagePeriod?.overage_automation_runs ?? 0}
        overageAiActions={usagePeriod?.overage_ai_actions ?? 0}
        overageEmailSends={usagePeriod?.overage_email_sends ?? 0}
        overageFileStorageMb={usagePeriod?.overage_file_storage_mb ?? 0}
        overageCostCents={usagePeriod?.overage_cost ?? 0}
        periodEnd={paddleSub?.current_period_end}
      />

      <Suspense fallback={<Skeleton className="h-[300px]" />}>
        <ModuleSubscriptions agencyId={member.agency_id} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[400px]" />}>
        <PaddleInvoiceHistory />
      </Suspense>
    </div>
  );
}
