import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  Globe,
  MessageCircle,
  ArrowRight,
  BarChart3,
  Users,
  ExternalLink,
  ShoppingCart,
  CalendarDays,
  Contact,
  Zap,
  Clock,
  Package,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import {
  getClientSites,
  getPortalAnalytics,
  getClientInfo,
} from "@/lib/portal/portal-service";
import { getClientTickets, getTicketStats } from "@/lib/portal/support-service";
import { getEffectivePermissions } from "@/lib/portal/portal-permissions";
import { getPortalDashboardData } from "@/lib/portal/portal-dashboard-service";
import { createPortalDAL } from "@/lib/portal/data-access";
import { resolveActiveSiteId } from "@/lib/portal/active-site";
import { PortalSitesPanel } from "@/components/portal/dashboard/portal-sites-panel";
import { PortalOrdersPanel } from "@/components/portal/dashboard/portal-orders-panel";
import { PortalLiveChatPanel } from "@/components/portal/dashboard/portal-live-chat-panel";
import {
  PortalPanelBoundary,
  PortalPanelSkeleton,
} from "@/components/portal/patterns";
import { getSiteUrl, getSiteDomain } from "@/lib/utils/site-url";
import { formatDistanceToNow } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Dashboard | Client Portal",
  description: "Manage your business operations",
};

export default async function PortalDashboard() {
  const user = await requirePortalAuth();
  const session = await getPortalSession();

  const [clientInfo, sites, tickets, ticketStats] = await Promise.all([
    getClientInfo(user.clientId),
    getClientSites(user.clientId),
    getClientTickets(user.clientId, { limit: 3 }),
    getTicketStats(user.clientId),
  ]);

  const siteIds = sites.map((s) => s.id);
  const primarySiteId = siteIds[0];

  // Active site (cookie-persisted; falls back to primary)
  const activeSiteId = await resolveActiveSiteId(user.clientId, primarySiteId);

  // Portal DAL — the single typed entry point for Session 1 reads.
  const dal = createPortalDAL({
    user,
    isImpersonation: session.isImpersonating,
    impersonatorEmail: session.impersonatorEmail,
  });

  // Get effective permissions for the primary site (used for dashboard KPI visibility)
  const permissions = primarySiteId
    ? await getEffectivePermissions(user.clientId, primarySiteId)
    : null;

  // Fetch module KPIs and analytics in parallel
  const [dashboardData, analytics] = await Promise.all([
    permissions
      ? getPortalDashboardData(siteIds, permissions, user.agencyId)
      : Promise.resolve(null),
    user.canViewAnalytics ? getPortalAnalytics(user.clientId) : null,
  ]);

  const openTickets = ticketStats.open + ticketStats.inProgress;

  // Check if any module data is available
  const hasModuleData =
    dashboardData?.liveChat ||
    dashboardData?.ecommerce ||
    dashboardData?.bookings ||
    dashboardData?.crm ||
    dashboardData?.automation ||
    dashboardData?.marketing;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <PageHeader
        title={`Welcome back, ${user.fullName.split(" ")[0]}!`}
        description={
          clientInfo?.companyName
            ? `Here's an overview of ${clientInfo.companyName}'s operations`
            : `Here's your business operations overview`
        }
      />

      {/*
        Session 1 foundation panels. Each panel is rendered through the
        Portal DAL so permission resolution, per-request caching, and audit
        logging are exercised end-to-end. Panels are wrapped in a shared
        Suspense + ErrorBoundary pair so a single failing domain never
        takes the whole dashboard down.
      */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <PortalPanelBoundary
          title="Couldn't load sites"
          description="We'll try again in a moment."
        >
          <Suspense fallback={<PortalPanelSkeleton />}>
            <PortalSitesPanel dal={dal} />
          </Suspense>
        </PortalPanelBoundary>

        {activeSiteId && user.canManageOrders ? (
          <PortalPanelBoundary
            title="Couldn't load orders"
            description="Your permissions may have changed. Refresh to retry."
          >
            <Suspense fallback={<PortalPanelSkeleton />}>
              <PortalOrdersPanel dal={dal} siteId={activeSiteId} />
            </Suspense>
          </PortalPanelBoundary>
        ) : null}

        {activeSiteId && user.canManageLiveChat ? (
          <PortalPanelBoundary
            title="Couldn't load conversations"
            description="Your permissions may have changed. Refresh to retry."
          >
            <Suspense fallback={<PortalPanelSkeleton />}>
              <PortalLiveChatPanel dal={dal} siteId={activeSiteId} />
            </Suspense>
          </PortalPanelBoundary>
        ) : null}
      </div>

      {/* Primary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{sites.length}</p>
                <p className="text-sm text-muted-foreground">Active Sites</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {analytics && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-full">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {analytics.totalVisits.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Visits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {analytics && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {analytics.uniqueVisitors.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Unique Visitors
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-full ${openTickets > 0 ? "bg-orange-500/10" : "bg-muted"}`}
              >
                <MessageCircle
                  className={`h-6 w-6 ${openTickets > 0 ? "text-orange-600" : "text-muted-foreground"}`}
                />
              </div>
              <div>
                <p className="text-3xl font-bold">{openTickets}</p>
                <p className="text-sm text-muted-foreground">Open Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module KPI Cards */}
      {hasModuleData && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Operations Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Live Chat Card */}
            {dashboardData?.liveChat && primarySiteId && (
              <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Live Chat
                  </CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">
                      {dashboardData.liveChat.activeConversations}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      active chats
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pending</span>
                      <span className="font-medium">
                        {dashboardData.liveChat.pendingConversations}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Today</span>
                      <span className="font-medium">
                        {dashboardData.liveChat.todayConversations}
                      </span>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <span className="text-muted-foreground">
                        Avg Response
                      </span>
                      <span className="font-medium">
                        {dashboardData.liveChat.avgResponseTime < 60
                          ? `${dashboardData.liveChat.avgResponseTime}s`
                          : `${Math.floor(dashboardData.liveChat.avgResponseTime / 60)}m ${dashboardData.liveChat.avgResponseTime % 60}s`}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href={`/portal/sites/${primarySiteId}/live-chat`}>
                      View Open Chats
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* E-Commerce Card */}
            {dashboardData?.ecommerce && primarySiteId && (
              <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Orders
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">
                      {dashboardData.ecommerce.totalOrders}
                    </p>
                    <p className="text-sm text-muted-foreground">this month</p>
                    {dashboardData.ecommerce.revenueChange !== 0 && (
                      <div
                        className={`flex items-center text-xs ${dashboardData.ecommerce.revenueChange > 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {dashboardData.ecommerce.revenueChange > 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {Math.abs(
                          dashboardData.ecommerce.revenueChange,
                        ).toFixed(0)}
                        %
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pending</span>
                      <span className="font-medium">
                        {dashboardData.ecommerce.pendingOrders}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-medium">
                        K
                        {dashboardData.ecommerce.totalRevenue.toLocaleString(
                          "en-ZM",
                          {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          },
                        )}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href={`/portal/sites/${primarySiteId}/orders`}>
                      Pending Orders
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Bookings Card */}
            {dashboardData?.bookings && primarySiteId && (
              <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Bookings
                  </CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">
                      {dashboardData.bookings.todayAppointments}
                    </p>
                    <p className="text-sm text-muted-foreground">today</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">This Week</span>
                      <span className="font-medium">
                        {dashboardData.bookings.upcomingThisWeek}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pending</span>
                      <span className="font-medium">
                        {dashboardData.bookings.pendingAppointments}
                      </span>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <span className="text-muted-foreground">Confirmed</span>
                      <span className="font-medium">
                        {dashboardData.bookings.confirmedAppointments}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href={`/portal/sites/${primarySiteId}/bookings`}>
                      Today&apos;s Bookings
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* CRM Card */}
            {dashboardData?.crm && primarySiteId && (
              <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    CRM
                  </CardTitle>
                  <Contact className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">
                      {dashboardData.crm.totalContacts}
                    </p>
                    <p className="text-sm text-muted-foreground">contacts</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Open Deals</span>
                      <span className="font-medium">
                        {dashboardData.crm.totalDeals}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Won (Month)</span>
                      <span className="font-medium">
                        {dashboardData.crm.dealsWonThisMonth}
                      </span>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <span className="text-muted-foreground">
                        Pipeline Value
                      </span>
                      <span className="font-medium">
                        K
                        {dashboardData.crm.pipelineValue.toLocaleString(
                          "en-ZM",
                          {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          },
                        )}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href={`/portal/sites/${primarySiteId}/crm`}>
                      View Contacts
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Automation Card */}
            {dashboardData?.automation && primarySiteId && (
              <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Automation
                  </CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">
                      {dashboardData.automation.activeWorkflows}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      active workflows
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Runs Today</span>
                      <span className="font-medium">
                        {dashboardData.automation.executionsToday}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Runs</span>
                      <span className="font-medium">
                        {dashboardData.automation.totalExecutions}
                      </span>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <span className="text-muted-foreground">
                        Success Rate
                      </span>
                      <span className="font-medium">
                        {dashboardData.automation.totalExecutions > 0
                          ? `${Math.round((dashboardData.automation.successfulExecutions / dashboardData.automation.totalExecutions) * 100)}%`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href={`/portal/sites/${primarySiteId}/automation`}>
                      View Workflows
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Marketing Card */}
            {dashboardData?.marketing && primarySiteId && (
              <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Marketing
                  </CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">
                      {dashboardData.marketing.activeSubscribers}
                    </p>
                    <p className="text-sm text-muted-foreground">subscribers</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div className="flex justify-between col-span-2">
                      <span className="text-muted-foreground">Campaigns</span>
                      <span className="font-medium">
                        {dashboardData.marketing.totalCampaigns}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href={`/portal/sites/${primarySiteId}/marketing`}>
                      View Marketing
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Sites */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Sites</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/portal/sites">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {sites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sites.slice(0, 4).map((site) => {
                const url = site.subdomain
                  ? getSiteUrl(site.subdomain, site.customDomain)
                  : null;
                const domain = site.subdomain
                  ? getSiteDomain(site.subdomain, site.customDomain)
                  : null;

                return (
                  <div
                    key={site.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Link
                      href={`/portal/sites/${site.id}`}
                      className="flex items-center gap-4 flex-1 min-w-0"
                    >
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        <Globe className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{site.name}</p>
                          <Badge
                            variant={site.isPublished ? "default" : "secondary"}
                            className="shrink-0"
                          >
                            {site.isPublished ? "Live" : "Draft"}
                          </Badge>
                        </div>
                        {domain && (
                          <p className="text-sm text-muted-foreground truncate">
                            {domain}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {site.pageCount} pages{" "}
                          {site.lastUpdatedAt &&
                            `• Updated ${formatDistanceToNow(new Date(site.lastUpdatedAt), { addSuffix: true })}`}
                        </p>
                      </div>
                    </Link>
                    {url && site.isPublished && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        asChild
                      >
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </a>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Sites Yet</h3>
              <p className="text-muted-foreground mt-1">
                Your websites will appear here once they&apos;re set up.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Tickets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Support Tickets</CardTitle>
          <div className="flex gap-2">
            <Button variant="default" size="sm" asChild>
              <Link href="/portal/support/new">New Ticket</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/portal/support">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tickets.length > 0 ? (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/portal/support/${ticket.id}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{ticket.subject}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {ticket.ticketNumber} • {ticket.category || "general"}{" "}
                      {ticket.createdAt &&
                        `• ${formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}`}
                    </p>
                  </div>
                  <Badge
                    variant={
                      ticket.status === "open"
                        ? "default"
                        : ticket.status === "in_progress"
                          ? "secondary"
                          : ticket.status === "resolved"
                            ? "outline"
                            : "secondary"
                    }
                    className={
                      ticket.status === "open"
                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                        : ticket.status === "resolved"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : ""
                    }
                  >
                    {(ticket.status || "open").replace("_", " ")}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Support Tickets</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                Need help? Create a support ticket.
              </p>
              <Button asChild>
                <Link href="/portal/support/new">Create Ticket</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
