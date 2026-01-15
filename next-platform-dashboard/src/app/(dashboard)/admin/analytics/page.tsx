import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { StatCard } from "@/components/admin/stat-card";
import {
  Users,
  Globe,
  Building2,
  TrendingUp,
  Eye,
  MousePointer,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Analytics | Admin | DRAMAC",
  description: "Platform analytics and insights",
};

async function getAnalyticsData() {
  await requireSuperAdmin();
  const supabase = await createClient();

  // Get current counts
  const [agencies, users, sites, publishedSites] = await Promise.all([
    supabase.from("agencies").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("sites").select("*", { count: "exact", head: true }),
    supabase
      .from("sites")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
  ]);

  // Get counts from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [newAgencies, newUsers, newSites] = await Promise.all([
    supabase
      .from("agencies")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString()),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString()),
    supabase
      .from("sites")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString()),
  ]);

  return {
    totalAgencies: agencies.count || 0,
    totalUsers: users.count || 0,
    totalSites: sites.count || 0,
    publishedSites: publishedSites.count || 0,
    newAgencies30d: newAgencies.count || 0,
    newUsers30d: newUsers.count || 0,
    newSites30d: newSites.count || 0,
    // Mock page view data
    pageViews: Math.floor(Math.random() * 50000) + 10000,
    uniqueVisitors: Math.floor(Math.random() * 10000) + 2000,
    avgSessionDuration: "4m 32s",
    bounceRate: 42.5,
  };
}

export default async function AdminAnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Platform Analytics</h1>
          <p className="text-muted-foreground">
            Insights and metrics for the platform
          </p>
        </div>
        <Select defaultValue="30d">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Agencies"
          value={data.totalAgencies}
          icon={Building2}
          description={`+${data.newAgencies30d} in last 30 days`}
        />
        <StatCard
          title="Total Users"
          value={data.totalUsers}
          icon={Users}
          description={`+${data.newUsers30d} in last 30 days`}
        />
        <StatCard
          title="Total Sites"
          value={data.totalSites}
          icon={Globe}
          description={`+${data.newSites30d} in last 30 days`}
        />
        <StatCard
          title="Published Sites"
          value={data.publishedSites}
          icon={TrendingUp}
          description={`${data.totalSites > 0 ? Math.round((data.publishedSites / data.totalSites) * 100) : 0}% of total`}
        />
      </div>

      {/* Traffic Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Page Views"
          value={data.pageViews.toLocaleString()}
          icon={Eye}
        />
        <StatCard
          title="Unique Visitors"
          value={data.uniqueVisitors.toLocaleString()}
          icon={Users}
        />
        <StatCard
          title="Avg Session Duration"
          value={data.avgSessionDuration}
          icon={MousePointer}
        />
        <StatCard
          title="Bounce Rate"
          value={`${data.bounceRate}%`}
          icon={TrendingUp}
        />
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <p className="text-sm">
                Chart visualization would go here.
                <br />
                Consider integrating Recharts or Chart.js for visualizations.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Site Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <p className="text-sm">
                Chart visualization would go here.
                <br />
                Shows site creation and publishing trends.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Agencies */}
      <Card>
        <CardHeader>
          <CardTitle>Top Agencies by Sites</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Top performing agencies will be displayed here once more data is
            available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
