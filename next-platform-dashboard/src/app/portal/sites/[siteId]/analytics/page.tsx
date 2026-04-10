import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { BarChart3, Users, Eye, Clock, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { getClientSite, getPortalAnalytics } from "@/lib/portal/portal-service";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Analytics | Client Portal",
  description: "View your website analytics",
};

interface Props {
  params: Promise<{ siteId: string }>;
}

export default async function PortalSiteAnalyticsPage({ params }: Props) {
  const { siteId } = await params;
  const user = await requirePortalAuth();

  if (!user.canViewAnalytics) {
    redirect(`/portal/sites/${siteId}`);
  }

  const site = await getClientSite(user.clientId, siteId);
  if (!site) {
    notFound();
  }

  const analytics = await getPortalAnalytics(user.clientId, siteId);

  const pagesPerVisit =
    analytics.totalVisits > 0
      ? (analytics.pageViews / analytics.totalVisits).toFixed(1)
      : "0";
  const avgSessionMinutes = Math.floor(analytics.avgSessionDuration / 60);
  const avgSessionSeconds = analytics.avgSessionDuration % 60;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description={`Performance overview for ${site.name}`}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Visits
                </p>
                <p className="text-3xl font-bold mt-1">
                  {analytics.totalVisits.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Eye className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Unique Visitors
                </p>
                <p className="text-3xl font-bold mt-1">
                  {analytics.uniqueVisitors.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Page Views
                </p>
                <p className="text-3xl font-bold mt-1">
                  {analytics.pageViews.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg. Session
                </p>
                <p className="text-3xl font-bold mt-1">
                  {avgSessionMinutes}:
                  {String(avgSessionSeconds).padStart(2, "0")}
                </p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages */}
      {analytics.topPages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topPages.map((page, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span className="text-sm font-medium truncate">
                    {page.page}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {page.views} views
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
