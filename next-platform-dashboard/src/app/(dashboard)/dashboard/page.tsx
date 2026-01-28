import { Metadata } from "next";
import { 
  DashboardStats,
  QuickActions,
  RecentActivity,
  RecentSites,
  EnhancedMetrics,
  RecentClients,
  ModuleSubscriptions,
  WelcomeCard,
} from "@/components/dashboard";
import { getDashboardData } from "@/lib/actions/dashboard";

export const metadata: Metadata = {
  title: "Dashboard | DRAMAC",
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* Welcome Card with Agency Info */}
      <WelcomeCard 
        userName={data.user?.name || data.user?.email?.split("@")[0]}
        agencyName={data.agencyName}
        subscriptionPlan={data.subscriptionPlan}
      />

      {/* Primary Stats */}
      <DashboardStats stats={data.stats} />

      {/* Enhanced Metrics - Additional Data Points */}
      <EnhancedMetrics metrics={data.enhancedMetrics} />

      {/* Quick Actions */}
      <QuickActions hasClients={data.stats.totalClients > 0} />

      {/* Three Column Grid for Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Sites - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <RecentSites sites={data.recentSites} />
        </div>

        {/* Module Subscriptions */}
        <div>
          <ModuleSubscriptions subscriptions={data.moduleSubscriptions} />
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Clients */}
        <RecentClients clients={data.recentClients} />

        {/* Recent Activity */}
        <RecentActivity activities={data.recentActivity} />
      </div>
    </div>
  );
}
