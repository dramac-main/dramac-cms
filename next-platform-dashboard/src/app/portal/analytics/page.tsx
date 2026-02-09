import { Metadata } from "next";
import { redirect } from "next/navigation";
import { BarChart3, Users, Eye, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { getClientSites, getPortalAnalytics } from "@/lib/portal/portal-service";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Analytics | Client Portal",
  description: "View your website analytics",
};

export default async function PortalAnalyticsPage() {
  const user = await requirePortalAuth();
  
  // Check permission
  if (!user.canViewAnalytics) {
    redirect("/portal");
  }

  const [sites, analytics] = await Promise.all([
    getClientSites(user.clientId),
    getPortalAnalytics(user.clientId),
  ]);

  // Calculate some derived stats
  const pagesPerVisit = analytics.totalVisits > 0 
    ? (analytics.pageViews / analytics.totalVisits).toFixed(1) 
    : "0";
  
  const avgSessionMinutes = Math.floor(analytics.avgSessionDuration / 60);
  const avgSessionSeconds = analytics.avgSessionDuration % 60;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Performance overview for all your websites"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Visits</p>
                <p className="text-3xl font-bold mt-1">{analytics.totalVisits.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Eye className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Visitors</p>
                <p className="text-3xl font-bold mt-1">{analytics.uniqueVisitors.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Page Views</p>
                <p className="text-3xl font-bold mt-1">{analytics.pageViews.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Session</p>
                <p className="text-3xl font-bold mt-1">
                  {avgSessionMinutes}:{String(avgSessionSeconds).padStart(2, '0')}
                </p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visits Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Visits Over Time</CardTitle>
            <CardDescription>Daily visits for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-2">
              {analytics.visitsByDay.map((day) => {
                const maxVisits = Math.max(...analytics.visitsByDay.map(d => d.visits));
                const height = maxVisits > 0 ? (day.visits / maxVisits) * 100 : 0;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {day.visits.toLocaleString()}
                    </span>
                    <div 
                      className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary cursor-pointer"
                      style={{ height: `${height}%`, minHeight: '4px' }}
                      title={`${day.visits} visits on ${day.date}`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(day.date), 'EEE')}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
            <CardDescription>Important performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Bounce Rate</span>
                <span className="font-medium">{analytics.bounceRate}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    analytics.bounceRate > 50 ? "bg-orange-500" : "bg-green-500"
                  }`}
                  style={{ width: `${analytics.bounceRate}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.bounceRate > 50 
                  ? "Higher than average - consider improving engagement"
                  : "Good - visitors are exploring your site"}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Pages per Visit</span>
                <span className="font-medium">{pagesPerVisit}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.min(parseFloat(pagesPerVisit) * 20, 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Active Sites</span>
                <span className="font-medium">{sites.filter(s => s.isPublished).length} / {sites.length}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${sites.length > 0 ? (sites.filter(s => s.isPublished).length / sites.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Top Pages</CardTitle>
          <CardDescription>Most visited pages across all your sites</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topPages.map((page) => {
              const maxViews = Math.max(...analytics.topPages.map(p => p.views));
              const percentage = maxViews > 0 ? (page.views / maxViews) * 100 : 0;
              return (
                <div key={page.page} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{page.page}</span>
                    <span className="text-muted-foreground">{page.views.toLocaleString()} views</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary/70 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">About Your Analytics</h3>
              <p className="text-sm text-muted-foreground mt-1">
                These analytics represent aggregated data across all your websites. 
                For detailed analytics on a specific site, visit the site&apos;s detail page.
                Data is updated approximately every 24 hours.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
