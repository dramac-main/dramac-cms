"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bell, BellRing, Check, CheckCheck, Trash2, ExternalLink } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Notification } from "@/types/notifications";
import { NotificationIcon } from "./notification-icon";

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1hZGVnaGhnaWlqa2xtbm9wcXJzdHV2d3h5ent8fX5/gIGCg4SFhoeIiYqLjI2Oj5CRkpOUlZaXmJmam5ydnp+goaKjpKWmp6ipqqusra6vsLGys7S1tre4ubq7vL2+v8A=');
    audioRef.current.volume = 0.3;
  }, []);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getNotifications({ limit: 10 });
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Supabase Realtime subscription for instant notification updates
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('notification-bell')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          // Add to top of list
          setNotifications((prev) => {
            if (prev.some((n) => n.id === newNotification.id)) return prev;
            return [newNotification, ...prev].slice(0, 10);
          });
          setUnreadCount((prev) => prev + 1);

          // Animate the bell
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 1000);

          // Play sound
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
          }

          // Show toast
          toast.info(newNotification.title, {
            description: newNotification.message,
            action: newNotification.link
              ? {
                  label: 'View',
                  onClick: () => router.push(newNotification.link!),
                }
              : undefined,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
          // Recalculate unread count
          setNotifications((prev) => {
            const newUnread = prev.filter((n) => !n.read).length;
            setUnreadCount(newUnread);
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setNotifications((prev) => {
            const filtered = prev.filter((n) => n.id !== deletedId);
            setUnreadCount(filtered.filter((n) => !n.read).length);
            return filtered;
          });
        }
      )
      .subscribe();

    // Fallback polling every 60 seconds (in case realtime misses something)
    const interval = setInterval(fetchNotifications, 60000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [fetchNotifications, router]);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleClick = async (notification: Notification) => {
    if (!notification.read) {
      await handleMarkRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {isAnimating ? (
            <BellRing className="w-5 h-5 animate-bounce text-primary" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {isLoading && notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-accent transition-colors cursor-pointer",
                    !notification.read && "bg-primary/5"
                  )}
                  onClick={() => handleClick(notification)}
                >
                  <div className="flex gap-3">
                    <span className="text-xl shrink-0">
                      <NotificationIcon type={notification.type} size="sm" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm",
                            !notification.read && "font-medium"
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(notification.created_at),
                            { addSuffix: true }
                          )}
                        </span>
                        <div className="flex gap-1">
                          {notification.link && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(notification.link, "_blank");
                              }}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkRead(notification.id);
                              }}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-2 border-t">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              router.push("/dashboard/notifications");
              setIsOpen(false);
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
