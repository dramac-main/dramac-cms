import { Metadata } from "next";
import Link from "next/link";
import { Bell, Clock, ExternalLink, MessageSquare, Globe, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// Button import removed - using NotificationMarkAllReadButton
import { Badge } from "@/components/ui/badge";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { getClientNotifications } from "@/lib/portal/notification-service";
import { NotificationMarkReadButton, NotificationMarkAllReadButton } from "@/components/portal/notification-actions";
import { formatDistanceToNow } from "date-fns";

export const metadata: Metadata = {
  title: "Notifications | Client Portal",
  description: "View your notifications",
};

const notificationIcons: Record<string, React.ReactNode> = {
  ticket_update: <MessageSquare className="h-5 w-5 text-blue-600" />,
  ticket_reply: <MessageSquare className="h-5 w-5 text-green-600" />,
  site_published: <Globe className="h-5 w-5 text-green-600" />,
  site_update: <Globe className="h-5 w-5 text-blue-600" />,
  system: <AlertCircle className="h-5 w-5 text-orange-600" />,
  info: <Bell className="h-5 w-5 text-primary" />,
};

export default async function PortalNotificationsPage() {
  const user = await requirePortalAuth();
  const notifications = await getClientNotifications(user.clientId);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <NotificationMarkAllReadButton clientId={user.clientId} />
        )}
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>Your recent activity and updates</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">No notifications yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                We&apos;ll let you know when there&apos;s something new
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${
                    !notification.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${
                      !notification.isRead ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      {notificationIcons[notification.type] || notificationIcons.info}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-medium ${
                            !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!notification.isRead && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>

                        {notification.link && (
                          <Link 
                            href={notification.link}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            View Details
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}

                        {!notification.isRead && (
                          <NotificationMarkReadButton 
                            notificationId={notification.id} 
                            clientId={user.clientId}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Types Legend */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Notification Types</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="p-1.5 bg-blue-500/10 rounded-full">
                <MessageSquare className="h-4 w-4 text-blue-600" />
              </div>
              <span>Support Updates</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="p-1.5 bg-green-500/10 rounded-full">
                <Globe className="h-4 w-4 text-green-600" />
              </div>
              <span>Site Activity</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="p-1.5 bg-orange-500/10 rounded-full">
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </div>
              <span>System Alerts</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
