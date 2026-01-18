import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  Globe, 
  ExternalLink, 
  Calendar, 
  FileText, 
  ArrowLeft,
  BarChart3,
  Eye,
  Clock,
  TrendingUp
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { getClientSite, getPortalAnalytics, getSitePermissions } from "@/lib/portal/portal-service";
import { getSiteUrl, getSiteDomain } from "@/lib/utils/site-url";
import { formatDistanceToNow, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PortalSiteDetailPageProps {
  params: Promise<{ siteId: string }>;
}

export async function generateMetadata({ params }: PortalSiteDetailPageProps): Promise<Metadata> {
  const { siteId } = await params;
  const supabase = await createClient();
  
  const { data: site } = await supabase
    .from("sites")
    .select("name")
    .eq("id", siteId)
    .single();

  return {
    title: site ? `${site.name} | Client Portal` : "Site Not Found",
  };
}

export default async function PortalSiteDetailPage({ params }: PortalSiteDetailPageProps) {
  const { siteId } = await params;
  const user = await requirePortalAuth();
  
  // Get site details
  const site = await getClientSite(user.clientId, siteId);
  
  if (!site) {
    notFound();
  }

  // Get permissions and analytics
  const [permissions, analytics] = await Promise.all([
    getSitePermissions(user.clientId, siteId),
    user.canViewAnalytics ? getPortalAnalytics(user.clientId, siteId) : null,
  ]);

  const url = site.subdomain 
    ? getSiteUrl(site.subdomain, site.customDomain)
    : null;
  const domain = site.subdomain
    ? getSiteDomain(site.subdomain, site.customDomain)
    : null;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/portal/sites">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sites
          </Link>
        </Button>
      </div>

      {/* Site Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
            <Globe className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{site.name}</h1>
              <Badge variant={site.isPublished ? "default" : "secondary"}>
                {site.isPublished ? "Live" : "Draft"}
              </Badge>
            </div>
            {domain && (
              <p className="text-muted-foreground mt-1">{domain}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {site.pageCount} pages • Last updated {site.lastUpdatedAt ? formatDistanceToNow(new Date(site.lastUpdatedAt), { addSuffix: true }) : "recently"}
            </p>
          </div>
        </div>

        {url && site.isPublished && (
          <Button asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit Site
            </a>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          {analytics && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{site.pageCount}</p>
                    <p className="text-sm text-muted-foreground">Pages</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {analytics && (
              <>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-500/10 rounded-full">
                        <Eye className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{analytics.totalVisits.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Total Visits</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-full">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{analytics.pageViews.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Page Views</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-500/10 rounded-full">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {Math.floor(analytics.avgSessionDuration / 60)}:{String(analytics.avgSessionDuration % 60).padStart(2, '0')}
                        </p>
                        <p className="text-sm text-muted-foreground">Avg. Session</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Site Info */}
          <Card>
            <CardHeader>
              <CardTitle>Site Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Domain</p>
                  <p className="mt-1">
                    {site.customDomain || `${site.subdomain}.dramac.app`}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="mt-1">
                    {site.isPublished ? "Published and live" : "Draft (not published)"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="mt-1">
                    {site.lastUpdatedAt ? format(new Date(site.lastUpdatedAt), "PPP 'at' p") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Your Permissions</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge variant="outline">View</Badge>
                    {permissions?.canViewAnalytics && <Badge variant="outline">Analytics</Badge>}
                    {permissions?.canEditContent && <Badge variant="outline">Edit</Badge>}
                    {permissions?.canPublish && <Badge variant="outline">Publish</Badge>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Site Pages</CardTitle>
              <CardDescription>
                All pages on this website
              </CardDescription>
            </CardHeader>
            <CardContent>
              {site.pages.length > 0 ? (
                <div className="space-y-2">
                  {site.pages.map((page) => (
                    <div
                      key={page.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {page.title}
                            {page.isHomepage && (
                              <Badge variant="secondary" className="ml-2">Homepage</Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            /{page.slug}
                          </p>
                        </div>
                      </div>
                      {url && site.isPublished && (
                        <Button variant="ghost" size="sm" asChild>
                          <a 
                            href={`${url}${page.isHomepage ? '' : `/${page.slug}`}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No pages found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        {analytics && (
          <TabsContent value="analytics" className="space-y-6">
            {/* Visits Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Visits Over Time</CardTitle>
                <CardDescription>
                  Daily visits for the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end gap-2">
                  {analytics.visitsByDay.map((day, i) => {
                    const maxVisits = Math.max(...analytics.visitsByDay.map(d => d.visits));
                    const height = (day.visits / maxVisits) * 100;
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                          style={{ height: `${height}%`, minHeight: '4px' }}
                          title={`${day.visits} visits`}
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

            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>
                  Most visited pages on your site
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topPages.map((page, i) => {
                    const maxViews = Math.max(...analytics.topPages.map(p => p.views));
                    const percentage = (page.views / maxViews) * 100;
                    return (
                      <div key={page.page} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{page.page}</span>
                          <span className="text-muted-foreground">{page.views.toLocaleString()} views</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold">{analytics.uniqueVisitors.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-1">Unique Visitors</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold">{analytics.bounceRate}%</p>
                  <p className="text-sm text-muted-foreground mt-1">Bounce Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold">
                    {(analytics.pageViews / analytics.totalVisits).toFixed(1)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Pages per Visit</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
