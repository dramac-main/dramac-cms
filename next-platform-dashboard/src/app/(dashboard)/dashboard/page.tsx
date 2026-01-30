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
  DashboardHeader,
  DashboardGrid,
  GridItem,
  DashboardWidget,
  DashboardSection,
  SiteStatusWidget,
  ModuleUsageWidget,
  StorageWidget,
} from "@/components/dashboard";
import { getDashboardData } from "@/lib/actions/dashboard";
import { Plus, Globe, Users, Package, Activity, HardDrive } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard | DRAMAC",
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  // Compute site status data
  const siteStatusData = {
    published: data.stats.publishedSites,
    draft: data.stats.totalSites - data.stats.publishedSites,
    total: data.stats.totalSites,
    recentlyUpdated: data.recentSites.length,
    needsAttention: 0, // Could be computed from sites with issues
  };

  // Transform module subscriptions for the widget
  const moduleUsageData = data.moduleSubscriptions.map(sub => ({
    moduleId: sub.id,
    name: sub.moduleName,
    enabled: 1, // Active installation
    total: data.stats.totalSites,
    category: sub.moduleName.toLowerCase().replace(/\s+/g, '-'),
  }));

  // Mock storage data (could come from actual storage service)
  const storageData = {
    used: data.enhancedMetrics.totalAssets * 1024 * 100, // Estimate ~100KB per asset
    total: 1024 * 1024 * 1024 * 5, // 5 GB limit
    breakdown: {
      images: data.enhancedMetrics.totalAssets * 1024 * 70,
      documents: data.enhancedMetrics.totalAssets * 1024 * 15,
      videos: data.enhancedMetrics.totalAssets * 1024 * 10,
      other: data.enhancedMetrics.totalAssets * 1024 * 5,
    },
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Actions */}
      <DashboardHeader
        title="Dashboard"
        subtitle={`Welcome back${data.user?.name ? `, ${data.user.name}` : ''}! Here's your agency overview.`}
        primaryAction={{
          label: "New Site",
          icon: Plus,
          href: "/dashboard/sites/new",
        }}
      />

      {/* Welcome Card with Agency Info */}
      <WelcomeCard 
        userName={data.user?.name || data.user?.email?.split("@")[0]}
        agencyName={data.agencyName}
        subscriptionPlan={data.subscriptionPlan}
      />

      {/* Primary Stats Row */}
      <DashboardStats stats={data.stats} />

      {/* Main Content Grid */}
      <DashboardGrid cols={{ default: 1, lg: 3 }} gap="default">
        {/* Site Status Widget - Takes 1 column */}
        <DashboardWidget
          title="Site Status"
          description="Overview of your websites"
          icon={Globe}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
          action={{ label: "View All", href: "/dashboard/sites" }}
        >
          <SiteStatusWidget data={siteStatusData} />
        </DashboardWidget>

        {/* Module Usage Widget - Takes 1 column */}
        <DashboardWidget
          title="Module Usage"
          description="Active module installations"
          icon={Package}
          iconBg="bg-violet-100 dark:bg-violet-900/30"
          iconColor="text-violet-600 dark:text-violet-400"
          action={{ label: "Marketplace", href: "/marketplace/v2" }}
        >
          <ModuleUsageWidget modules={moduleUsageData} maxItems={4} />
        </DashboardWidget>

        {/* Storage Widget - Takes 1 column */}
        <DashboardWidget
          title="Media Storage"
          description="Storage usage overview"
          icon={HardDrive}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
          action={{ label: "Media Library", href: "/dashboard/media" }}
        >
          <StorageWidget
            used={storageData.used}
            total={storageData.total}
            breakdown={storageData.breakdown}
            showBreakdown
          />
        </DashboardWidget>
      </DashboardGrid>

      {/* Enhanced Metrics Row */}
      <DashboardSection
        title="Performance Metrics"
        description="Key metrics across your agency"
        icon={Activity}
        collapsible
        defaultCollapsed={false}
      >
        <EnhancedMetrics metrics={data.enhancedMetrics} />
      </DashboardSection>

      {/* Quick Actions */}
      <QuickActions hasClients={data.stats.totalClients > 0} />

      {/* Two Column Grid for Sites and Modules */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Sites - Takes 2 columns */}
        <GridItem span={{ lg: 2 }}>
          <DashboardWidget
            title="Recent Sites"
            description="Your recently updated websites"
            icon={Globe}
            iconBg="bg-blue-100 dark:bg-blue-900/30"
            iconColor="text-blue-600 dark:text-blue-400"
            action={{ label: "View All", href: "/dashboard/sites" }}
          >
            <RecentSites sites={data.recentSites} />
          </DashboardWidget>
        </GridItem>

        {/* Module Subscriptions */}
        <DashboardWidget
          title="Active Modules"
          description="Your subscribed modules"
          icon={Package}
          iconBg="bg-violet-100 dark:bg-violet-900/30"
          iconColor="text-violet-600 dark:text-violet-400"
          action={{ label: "Manage", href: "/dashboard/modules/subscriptions" }}
        >
          <ModuleSubscriptions subscriptions={data.moduleSubscriptions} />
        </DashboardWidget>
      </div>

      {/* Two Column Grid for Clients and Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Clients */}
        <DashboardWidget
          title="Recent Clients"
          description="Your newest client accounts"
          icon={Users}
          iconBg="bg-amber-100 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
          action={{ label: "View All", href: "/dashboard/clients" }}
        >
          <RecentClients clients={data.recentClients} />
        </DashboardWidget>

        {/* Recent Activity */}
        <DashboardWidget
          title="Recent Activity"
          description="Latest actions in your workspace"
          icon={Activity}
          iconBg="bg-pink-100 dark:bg-pink-900/30"
          iconColor="text-pink-600 dark:text-pink-400"
        >
          <RecentActivity activities={data.recentActivity} />
        </DashboardWidget>
      </div>
    </div>
  );
}
