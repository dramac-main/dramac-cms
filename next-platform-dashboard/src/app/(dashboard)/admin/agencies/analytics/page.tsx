/**
 * Admin Agency Analytics Page
 * 
 * PHASE-DS-04B: Admin Dashboard - Agency Metrics
 * 
 * Comprehensive agency analytics including:
 * - Agency leaderboard
 * - Growth trends
 * - Segmentation analysis
 */

import { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AgencyLeaderboardComponent,
  AgencyGrowthComponent,
  AgencySegmentationComponent,
} from "@/components/admin";

export const metadata: Metadata = {
  title: "Agency Analytics | Admin | DRAMAC",
  description: "Agency performance metrics and insights",
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
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  );
}

export default async function AdminAgencyAnalyticsPage() {
  await verifyAccess();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agency Analytics</h1>
        <p className="text-muted-foreground">
          Performance metrics and insights for platform agencies
        </p>
      </div>

      <Tabs defaultValue="leaderboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="segments">Segmentation</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard">
          <Suspense fallback={<AnalyticsSkeleton />}>
            <AgencyLeaderboardComponent timeRange="12m" />
          </Suspense>
        </TabsContent>

        <TabsContent value="growth">
          <Suspense fallback={<AnalyticsSkeleton />}>
            <AgencyGrowthComponent timeRange="12m" />
          </Suspense>
        </TabsContent>

        <TabsContent value="segments">
          <Suspense fallback={<AnalyticsSkeleton />}>
            <AgencySegmentationComponent timeRange="12m" />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
