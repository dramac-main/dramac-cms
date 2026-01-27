/**
 * Dashboard Billing Page
 * 
 * Phase EM-59B: Paddle Billing Integration
 * 
 * Billing overview page in the dashboard area.
 * Redirects to the main settings/billing page for unified experience.
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PaddleSubscriptionCard } from "@/components/billing/paddle-subscription-card";
import { UsageDashboard } from "@/components/billing/usage-dashboard";
import { PaddleInvoiceHistory } from "@/components/billing/paddle-invoice-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

export const metadata: Metadata = {
  title: "Billing | DRAMAC",
  description: "Manage your subscription and view billing history",
};

export default async function BillingPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const supabase = await createClient();
  
  // Get user's agency
  const { data: member } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", session.user.id)
    .single();

  if (!member) {
    redirect("/dashboard");
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and view billing history
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/pricing">
            <CreditCard className="w-4 h-4 mr-2" />
            View Plans
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Suspense fallback={<Skeleton className="h-[280px]" />}>
              <PaddleSubscriptionCard agencyId={member.agency_id} />
            </Suspense>

            <Suspense fallback={<Skeleton className="h-[280px]" />}>
              <UsageDashboard agencyId={member.agency_id} />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <Suspense fallback={<Skeleton className="h-[400px]" />}>
            <PaddleInvoiceHistory />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
