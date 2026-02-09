import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Users, Building2, Globe, DollarSign, Package, Activity } from "lucide-react";
import { StatsCard } from "@/components/admin/stats-card";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { QuickActions } from "@/components/admin/quick-actions";
import { getPlatformStats, getRecentActivity } from "@/lib/admin/stats-service";
import { PageHeader } from "@/components/layout/page-header";
import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from "@/lib/locale-config";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Admin Dashboard | ${PLATFORM.name}`,
  description: "Platform administration and monitoring",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  
  // Verify super admin access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  // Get real stats
  const stats = await getPlatformStats();
  const activities = await getRecentActivity();

  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: "currency",
      currency: DEFAULT_CURRENCY,
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        description="Platform overview and management"
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={stats.users.total.toLocaleString()}
          description={`${stats.users.activeThisMonth} active this month`}
          trend={{ value: stats.users.growthPercent, label: "from last month" }}
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Total Agencies"
          value={stats.agencies.total.toLocaleString()}
          description={`${stats.agencies.active} active`}
          trend={{ value: stats.agencies.newThisMonth, label: "new this month" }}
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatsCard
          title="Published Sites"
          value={stats.sites.published.toLocaleString()}
          description={`${stats.sites.total} total sites`}
          icon={<Globe className="h-4 w-4" />}
        />
        <StatsCard
          title="Monthly Revenue"
          value={formatCurrency(stats.revenue.mrr)}
          description={`${formatCurrency(stats.revenue.arr)} ARR`}
          trend={{ value: stats.revenue.growthPercent, label: "from last month" }}
          icon={<DollarSign className="h-4 w-4" />}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Module Installations"
          value={stats.modules.installations.toLocaleString()}
          description={`${stats.modules.total} modules available`}
          icon={<Package className="h-4 w-4" />}
        />
        <StatsCard
          title="Active Sessions"
          value={stats.system.activeSessions.toLocaleString()}
          description={`${stats.system.requestsToday.toLocaleString()} requests today`}
          icon={<Activity className="h-4 w-4" />}
        />
        <StatsCard
          title="System Health"
          value={`${(100 - stats.system.errorRate).toFixed(1)}%`}
          description={`${stats.system.avgResponseTime}ms avg response`}
          trend={
            stats.system.errorRate < 1
              ? { value: 0, label: "healthy" }
              : { value: -stats.system.errorRate, label: "issues detected" }
          }
        />
      </div>

      {/* Quick Actions + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        <ActivityFeed activities={activities} />
      </div>
    </div>
  );
}
