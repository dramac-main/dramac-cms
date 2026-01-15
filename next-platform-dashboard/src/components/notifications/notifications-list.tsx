"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Check, Trash2, ExternalLink, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/lib/actions/notifications";
import type { Notification } from "@/types/notifications";

interface NotificationsListProps {
  notifications: Notification[];
}

const typeLabels: Record<string, string> = {
  site_published: "Site Published",
  site_updated: "Site Updated",
  client_created: "New Client",
  client_updated: "Client Updated",
  team_invite: "Team Invite",
  team_joined: "Team Member Joined",
  team_left: "Team Member Left",
  payment_success: "Payment",
  payment_failed: "Payment Failed",
  subscription_renewed: "Subscription Renewed",
  subscription_cancelled: "Subscription Cancelled",
  comment_added: "Comment",
  mention: "Mention",
  security_alert: "Security",
  system: "System",
};

const typeIcons: Record<string, string> = {
  site_published: "🚀",
  site_updated: "✏️",
  client_created: "👤",
  client_updated: "👤",
  team_invite: "📧",
  team_joined: "🎉",
  team_left: "👋",
  payment_success: "💳",
  payment_failed: "⚠️",
  subscription_renewed: "🔄",
  subscription_cancelled: "❌",
  comment_added: "💬",
  mention: "@",
  security_alert: "🔒",
  system: "📢",
};

export function NotificationsList({
  notifications: initialNotifications,
}: NotificationsListProps) {
  const router = useRouter();
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);

  const handleMarkRead = async (id: string) => {
    const result = await markNotificationRead(id);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    }
  };

  const handleMarkAllRead = async () => {
    const result = await markAllNotificationsRead();
    if (result.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } else {
      toast.error(result.error || "Failed to mark notifications as read");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteNotification(id);
    if (result.success) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    } else {
      toast.error(result.error || "Failed to delete notification");
    }
  };

  const handleNavigate = async (notification: Notification) => {
    if (!notification.read) {
      await handleMarkRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No notifications</h3>
          <p className="text-muted-foreground">
            You&apos;re all caught up! We&apos;ll notify you when something important happens.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark all as read ({unreadCount})
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={cn(
              "transition-colors cursor-pointer hover:bg-accent/50",
              !notification.read && "border-primary/50 bg-primary/5"
            )}
            onClick={() => handleNavigate(notification)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <span className="text-2xl shrink-0">
                  {typeIcons[notification.type] || "📌"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {typeLabels[notification.type] || notification.type}
                    </span>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <h3 className={cn("font-medium", !notification.read && "text-foreground")}>
                    {notification.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>

                <div className="flex gap-1 shrink-0">
                  {notification.link && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(notification.link!);
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(notification.id);
                      }}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
