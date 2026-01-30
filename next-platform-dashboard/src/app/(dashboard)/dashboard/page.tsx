import { Metadata } from "next";
import { getDashboardData } from "@/lib/actions/dashboard";
import { DashboardClient } from "./dashboard-client";

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
    <DashboardClient
      data={data}
      siteStatusData={siteStatusData}
      moduleUsageData={moduleUsageData}
      storageData={storageData}
    />
  );
}
