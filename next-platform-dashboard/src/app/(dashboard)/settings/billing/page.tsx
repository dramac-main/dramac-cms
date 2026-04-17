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
import { Pause, CheckCircle2 } from "lucide-react";

interface BillingPageProps {
  searchParams: Promise<{ success?: string }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;
  const showSuccess = params.success === "true";
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

  // Fetch Paddle subscription (authoritative source) for plan & payment method
  const { data: paddleSub } = (await supabase
    .from("paddle_subscriptions")
    .select(
      "id, paddle_subscription_id, plan_type, billing_cycle, status, current_period_start, current_period_end, trial_end, cancel_at_period_end, unit_price, currency, card_last4, card_brand, card_expiry",
    )
    .eq("agency_id", member.agency_id)
    .in("status", ["active", "trialing", "past_due", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()) as { data: any; error: any };

  // Map paddle_subscriptions data to the format CurrentPlanCard expects
  const subscription = paddleSub
    ? {
        id: paddleSub.id,
        plan_id: paddleSub.plan_type,
        billing_cycle: paddleSub.billing_cycle,
        status:
          paddleSub.status === "trialing"
            ? "on_trial"
            : paddleSub.status === "canceled"
              ? "cancelled"
              : paddleSub.status,
        current_period_start: paddleSub.current_period_start,
        current_period_end: paddleSub.current_period_end,
        trial_ends_at: paddleSub.trial_end,
        cancelled_at: paddleSub.cancel_at_period_end
          ? paddleSub.current_period_end
          : null,
        paddle_subscription_id: paddleSub.paddle_subscription_id,
      }
    : null;

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

      {/* Success Banner - shown after checkout redirect */}
      {showSuccess && (
        <Alert className="border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-300">
            Your subscription is now active! Welcome to DM Suite.
          </AlertDescription>
        </Alert>
      )}

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
