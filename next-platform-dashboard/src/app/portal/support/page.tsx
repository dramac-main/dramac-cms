import { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Plus, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { getClientTickets, getTicketStats } from "@/lib/portal/support-service";
import { formatDistanceToNow } from "date-fns";

export const metadata: Metadata = {
  title: "Support | Client Portal",
  description: "Get help with your websites",
};

function getStatusIcon(status: string) {
  switch (status) {
    case "open":
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    case "in_progress":
      return <Clock className="h-4 w-4 text-blue-600" />;
    case "resolved":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "closed":
      return <XCircle className="h-4 w-4 text-gray-500" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
}

function getStatusBadge(status: string) {
  const variants: Record<string, { variant: "default" | "secondary" | "outline"; className: string }> = {
    open: { variant: "default", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
    in_progress: { variant: "default", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
    resolved: { variant: "default", className: "bg-green-100 text-green-800 hover:bg-green-100" },
    closed: { variant: "secondary", className: "" },
  };

  const config = variants[status] || variants.open;

  return (
    <Badge variant={config.variant} className={config.className}>
      {status.replace("_", " ")}
    </Badge>
  );
}

function getPriorityBadge(priority: string) {
  const colors: Record<string, string> = {
    low: "bg-gray-100 text-gray-700",
    normal: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
  };

  return (
    <Badge variant="outline" className={colors[priority] || colors.normal}>
      {priority}
    </Badge>
  );
}

export default async function PortalSupportPage() {
  const user = await requirePortalAuth();
  
  const [tickets, stats] = await Promise.all([
    getClientTickets(user.clientId),
    getTicketStats(user.clientId),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Support</h1>
          <p className="text-muted-foreground mt-1">
            Get help with your websites or request changes
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/support/new">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Tickets</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{stats.open}</p>
              <p className="text-sm text-muted-foreground">Open</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
              <p className="text-sm text-muted-foreground">Resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Tickets</CardTitle>
          <CardDescription>
            View and manage your support requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length > 0 ? (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/portal/support/${ticket.id}`}
                  className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      {getStatusIcon(ticket.status)}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{ticket.subject}</span>
                          <span className="text-sm text-muted-foreground">
                            {ticket.ticketNumber}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{ticket.category}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                          {ticket.siteName && (
                            <>
                              <span>•</span>
                              <span>{ticket.siteName}</span>
                            </>
                          )}
                          {ticket.messageCount > 0 && (
                            <>
                              <span>•</span>
                              <span>{ticket.messageCount} messages</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getPriorityBadge(ticket.priority)}
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No Support Tickets</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                Need help? Create your first support ticket.
              </p>
              <Button asChild>
                <Link href="/portal/support/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ticket
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
