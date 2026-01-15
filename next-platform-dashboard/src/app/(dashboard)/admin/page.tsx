import { Metadata } from "next";
import { getPlatformStats } from "@/lib/actions/admin";
import { StatCard } from "@/components/admin/stat-card";
import { RecentActivity } from "@/components/admin/recent-activity";
import { SystemAlerts } from "@/components/admin/system-alerts";
import {
  Building2,
  Users,
  Globe,
  CreditCard,
  TrendingUp,
  Activity,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Dashboard | DRAMAC",
  description: "Platform administration and monitoring",
};

export default async function AdminDashboardPage() {
  const stats = await getPlatformStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Overview</h1>
        <p className="text-muted-foreground">
          Monitor platform health and metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Agencies"
          value={stats.totalAgencies}
          change={stats.agencyGrowth}
          icon={Building2}
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          change={stats.userGrowth}
          icon={Users}
        />
        <StatCard
          title="Active Sites"
          value={stats.activeSites}
          change={stats.siteGrowth}
          icon={Globe}
        />
        <StatCard
          title="MRR"
          value={`$${stats.mrr.toLocaleString()}`}
          change={stats.revenueGrowth}
          icon={CreditCard}
          isCurrency
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          change={stats.conversionChange}
          icon={TrendingUp}
          description="Sites per agency"
        />
        <StatCard
          title="Active Sessions"
          value={stats.activeSessions}
          icon={Activity}
          description="Currently online"
        />
        <StatCard
          title="API Requests (24h)"
          value={stats.apiRequests.toLocaleString()}
          icon={Activity}
          description="Total requests"
        />
      </div>

      {/* Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <SystemAlerts />
      </div>
    </div>
  );
}
