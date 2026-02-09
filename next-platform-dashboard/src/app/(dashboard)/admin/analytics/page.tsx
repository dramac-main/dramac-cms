import { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlatformOverviewComponent,
  SystemHealthComponent,
  PlatformActivityComponent,
} from "@/components/admin";
import { PageHeader } from "@/components/layout/page-header";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Analytics | Admin | ${PLATFORM.name}`,
  description: "Platform analytics and insights",
};

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

export default async function AdminAnalyticsPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Analytics"
        description="Comprehensive insights and metrics for the platform"
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Suspense fallback={<AnalyticsSkeleton />}>
            <PlatformOverviewComponent timeRange="30d" />
          </Suspense>
        </TabsContent>

        <TabsContent value="health">
          <Suspense fallback={<AnalyticsSkeleton />}>
            <SystemHealthComponent />
          </Suspense>
        </TabsContent>

        <TabsContent value="activity">
          <Suspense fallback={<AnalyticsSkeleton />}>
            <PlatformActivityComponent limit={30} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
