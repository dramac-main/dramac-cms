"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Bell, Check, CheckCheck, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/lib/actions/notifications";
import type { Notification } from "@/types/notifications";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface NotificationCenterProps {
  /** Initial unread count from server */
  initialUnreadCount?: number;
}

/**
 * Notification Bell & Dropdown
 * 
 * Phase UX-02: Notification Center
 * 
 * Shows a bell icon with unread badge. Opens a popover with recent
 * notifications. Supports mark as read, mark all read, and delete.
 */
export function NotificationCenter({ initialUnreadCount = 0 }: NotificationCenterProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Fetch notifications when popover opens
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getNotifications({ limit: 20 });
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  // Poll for updates every 30 seconds when visible
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await getNotifications({ unreadOnly: true, limit: 1 });
        setUnreadCount(result.unreadCount);
      } catch {
        // silently fail
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id: string) => {
    startTransition(async () => {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });
  };

  const handleMarkAllRead = async () => {
    startTransition(async () => {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    });
  };

  const handleDelete = async (id: string) => {
    const wasUnread = notifications.find((n) => n.id === id && !n.read);
    startTransition(async () => {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkRead(notification.id);
    }
    if (notification.link) {
      setOpen(false);
      router.push(notification.link);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 flex items-center justify-center text-[10px] font-bold"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleMarkAllRead}
                disabled={isPending}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground/70">
                You&apos;ll see updates about your bookings, orders, and team here.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onMarkRead={() => handleMarkRead(notification.id)}
                  onDelete={() => handleDelete(notification.id)}
                  isPending={isPending}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              asChild
              onClick={() => setOpen(false)}
            >
              <Link href="/notifications">View all notifications</Link>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Notification Item
// ============================================================================

const NOTIFICATION_TYPE_ICONS: Record<string, string> = {
  new_booking: "📅",
  booking_confirmed: "✅",
  booking_cancelled: "❌",
  new_order: "🛒",
  order_shipped: "📦",
  order_delivered: "✔️",
  payment_success: "💳",
  payment_failed: "⚠️",
  site_published: "🚀",
  site_updated: "🔄",
  team_invite: "👋",
  team_joined: "🤝",
  form_submission: "📝",
  comment_added: "💬",
  mention: "📢",
  security_alert: "🔒",
  system: "ℹ️",
};

function NotificationItem({
  notification,
  onClick,
  onMarkRead,
  onDelete,
  isPending,
}: {
  notification: Notification;
  onClick: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const icon = NOTIFICATION_TYPE_ICONS[notification.type] || "📌";
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
  });

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer group",
        !notification.read && "bg-primary/5"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* Unread indicator */}
      <div className="flex items-center pt-0.5">
        {!notification.read ? (
          <div className="w-2 h-2 rounded-full bg-primary" />
        ) : (
          <div className="w-2 h-2" />
        )}
      </div>

      {/* Icon */}
      <span className="text-lg flex-shrink-0 pt-0.5" role="img" aria-label={notification.type}>
        {icon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm leading-snug",
            !notification.read && "font-medium"
          )}
        >
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">{timeAgo}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead();
            }}
            disabled={isPending}
            title="Mark as read"
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={isPending}
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
