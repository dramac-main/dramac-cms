import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { RecentSites } from "@/components/dashboard/recent-sites";
import { getDashboardData } from "@/lib/actions/dashboard";

export const metadata: Metadata = {
  title: "Dashboard | DRAMAC",
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back${data.user?.email ? `, ${data.user.email.split("@")[0]}` : ""}!`}
        description="Here's an overview of your platform."
      />

      {/* Stats */}
      <DashboardStats stats={data.stats} />

      {/* Quick Actions */}
      <QuickActions hasClients={data.stats.totalClients > 0} />

      {/* Two Column Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sites */}
        <RecentSites sites={data.recentSites} />

        {/* Recent Activity */}
        <RecentActivity activities={data.recentActivity} />
      </div>
    </div>
  );
}
