import { Metadata } from "next";
import Link from "next/link";
import { Globe, MessageCircle, ArrowRight, BarChart3, Users, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import { getClientSites, getPortalAnalytics, getClientInfo } from "@/lib/portal/portal-service";
import { getClientTickets, getTicketStats } from "@/lib/portal/support-service";
import { getSiteUrl, getSiteDomain } from "@/lib/utils/site-url";
import { formatDistanceToNow } from "date-fns";

export const metadata: Metadata = {
  title: "Dashboard | Client Portal",
  description: "View your websites and manage your account",
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

  // Get analytics only if user has permission
  const analytics = user.canViewAnalytics 
    ? await getPortalAnalytics(user.clientId) 
    : null;

  const openTickets = ticketStats.open + ticketStats.inProgress;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user.fullName.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {clientInfo?.companyName 
            ? `Here's an overview of ${clientInfo.companyName}'s sites with ${clientInfo.agencyName}`
            : `Here's an overview of your sites with ${clientInfo?.agencyName || "your agency"}`
          }
        </p>
      </div>

      {/* Quick Stats */}
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
                  <p className="text-sm text-muted-foreground">Unique Visitors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${openTickets > 0 ? "bg-orange-500/10" : "bg-muted"}`}>
                <MessageCircle className={`h-6 w-6 ${openTickets > 0 ? "text-orange-600" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-3xl font-bold">{openTickets}</p>
                <p className="text-sm text-muted-foreground">Open Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                          <Badge variant={site.isPublished ? "default" : "secondary"} className="shrink-0">
                            {site.isPublished ? "Live" : "Draft"}
                          </Badge>
                        </div>
                        {domain && (
                          <p className="text-sm text-muted-foreground truncate">
                            {domain}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {site.pageCount} pages {site.lastUpdatedAt && `• Updated ${formatDistanceToNow(new Date(site.lastUpdatedAt), { addSuffix: true })}`}
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
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
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
                Your websites will appear here once they're set up.
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
              <Link href="/portal/support/new">
                New Ticket
              </Link>
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
                      {ticket.ticketNumber} • {ticket.category || "general"} {ticket.createdAt && `• ${formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}`}
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
