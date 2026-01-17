import { StatsCard } from "./stats-card";
import type { PlatformStats } from "@/lib/admin/stats-service";
import { Users, Building2, Globe, DollarSign, Package, Activity } from "lucide-react";

interface StatsGridProps {
  stats: PlatformStats;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="space-y-6">
      {/* Primary Metrics */}
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
    </div>
  );
}
