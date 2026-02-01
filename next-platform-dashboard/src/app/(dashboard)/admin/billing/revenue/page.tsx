/**
 * Admin Revenue Analytics Page
 * 
 * PHASE-DS-05: Billing & Revenue Dashboards
 * 
 * Comprehensive revenue analytics including:
 * - Revenue overview and trends
 * - Subscription metrics
 * - Billing activity feed
 */

import { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RevenueOverviewComponent,
  SubscriptionMetricsComponent,
  BillingActivityComponent,
} from "@/components/admin";

export const metadata: Metadata = {
  title: "Revenue Analytics | Admin | DRAMAC",
  description: "Revenue metrics and billing analytics",
};

async function verifyAccess() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    redirect("/dashboard");
  }
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  );
}

export default async function AdminRevenueAnalyticsPage() {
  await verifyAccess();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Revenue Analytics</h1>
        <p className="text-muted-foreground">
          Financial metrics, subscription analytics, and billing activity
        </p>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Suspense fallback={<AnalyticsSkeleton />}>
            <RevenueOverviewComponent timeRange="12m" />
          </Suspense>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Suspense fallback={<AnalyticsSkeleton />}>
            <SubscriptionMetricsComponent timeRange="12m" />
          </Suspense>
        </TabsContent>

        <TabsContent value="activity">
          <Suspense fallback={<AnalyticsSkeleton />}>
            <BillingActivityComponent timeRange="30d" />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
