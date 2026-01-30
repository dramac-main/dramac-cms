"use client";

import { 
  DashboardStats,
  QuickActions,
  RecentActivity,
  RecentSites,
  EnhancedMetrics,
  RecentClients,
  ModuleSubscriptions,
  WelcomeCard,
  DashboardGrid,
  GridItem,
  DashboardWidget,
  DashboardSection,
} from "@/components/dashboard";
import { Globe, Users, Package, Activity, BarChart3 } from "lucide-react";
import type { DashboardData } from "@/lib/actions/dashboard";

interface DashboardClientProps {
  data: DashboardData;
}

export function DashboardClient({ data }: DashboardClientProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Card with Agency Info */}
      <WelcomeCard 
        userName={data.user?.name || data.user?.email?.split("@")[0]}
        agencyName={data.agencyName}
        subscriptionPlan={data.subscriptionPlan}
      />

      {/* Primary Stats Row */}
      <DashboardStats stats={data.stats} />

      {/* Enhanced Metrics Row */}
      <DashboardSection
        title="Performance Metrics"
        description="Key metrics across your agency"
        icon={BarChart3}
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
