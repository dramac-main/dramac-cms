import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { 
  getAgencySubscription, 
  getAgencyInvoices, 
  getAgencyUsage,
  ensureFreeSubscription 
} from "@/lib/actions/billing";
import { CurrentPlanCard } from "@/components/billing/current-plan-card";
import { PricingPlans } from "@/components/billing/pricing-plans";
import { LemonSqueezyInvoiceHistory } from "@/components/billing/lemonsqueezy-invoice-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Billing | DRAMAC",
  description: "Manage your subscription and view billing history",
};

export default async function BillingPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Ensure the agency has at least a free subscription
  await ensureFreeSubscription(session.user.id);

  const [subscription, invoices, usage] = await Promise.all([
    getAgencySubscription(session.user.id),
    getAgencyInvoices(session.user.id),
    getAgencyUsage(session.user.id),
  ]);

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and view billing history
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <CurrentPlanCard subscription={subscription} usage={usage} />
        </TabsContent>

        <TabsContent value="plans">
          <PricingPlans currentPlanId={subscription?.plan_id || "free"} />
        </TabsContent>

        <TabsContent value="invoices">
          <LemonSqueezyInvoiceHistory invoices={invoices} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
