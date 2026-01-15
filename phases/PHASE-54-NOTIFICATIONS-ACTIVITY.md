# Phase 54: Notifications & Activity System

> **AI Model**: Claude Opus 4.5 (2x)
>
> **⚠️ FIRST**: Read `PHASE-46-REMEDIATION-MASTER-PLAN.md`

---

## 🎯 Objective

Implement comprehensive notification system including in-app notifications, email notifications, activity feed, and real-time updates for team collaboration.

---

## 📋 Prerequisites

- [ ] Phase 53 completed
- [ ] Database tables exist
- [ ] Email provider configured

---

## ✅ Tasks

### Task 54.1: Notification Types

**File: `src/types/notifications.ts`**

```typescript
export type NotificationType =
  | "site_published"
  | "site_updated"
  | "client_created"
  | "client_updated"
  | "team_invite"
  | "team_joined"
  | "team_left"
  | "payment_success"
  | "payment_failed"
  | "subscription_renewed"
  | "subscription_cancelled"
  | "comment_added"
  | "mention"
  | "security_alert"
  | "system";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface ActivityLogEntry {
  id: string;
  agency_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  action: string;
  resource_type: "site" | "client" | "page" | "team" | "billing" | "settings";
  resource_id?: string;
  resource_name?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  email_marketing: boolean;
  email_security: boolean;
  email_updates: boolean;
  email_team: boolean;
  email_billing: boolean;
  push_enabled: boolean;
  digest_frequency: "realtime" | "daily" | "weekly" | "none";
}
```

### Task 54.2: Notifications Database Migration

**File: `migrations/notifications.sql`**

```sql
-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_type CHECK (type IN (
    'site_published', 'site_updated', 'client_created', 'client_updated',
    'team_invite', 'team_joined', 'team_left',
    'payment_success', 'payment_failed', 'subscription_renewed', 'subscription_cancelled',
    'comment_added', 'mention', 'security_alert', 'system'
  ))
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  resource_name VARCHAR(255),
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_marketing BOOLEAN DEFAULT FALSE,
  email_security BOOLEAN DEFAULT TRUE,
  email_updates BOOLEAN DEFAULT TRUE,
  email_team BOOLEAN DEFAULT TRUE,
  email_billing BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  digest_frequency VARCHAR(20) DEFAULT 'realtime',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_activity_log_agency ON activity_log(agency_id, created_at DESC);
CREATE INDEX idx_activity_log_user ON activity_log(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can see activity for their agency
CREATE POLICY "Users can view agency activity"
  ON activity_log FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can manage their own preferences
CREATE POLICY "Users can manage own preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);
```

### Task 54.3: Notification Service

**File: `src/lib/services/notifications.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";
import type { NotificationType, Notification } from "@/types/notifications";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

export async function createNotification(
  options: CreateNotificationOptions
): Promise<Notification | null> {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .insert({
      user_id: options.userId,
      type: options.type,
      title: options.title,
      message: options.message,
      link: options.link,
      metadata: options.metadata,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating notification:", error);
    return null;
  }

  // Optionally send email based on user preferences
  await sendEmailNotificationIfEnabled(options);

  return data;
}

export async function createBulkNotifications(
  userIds: string[],
  options: Omit<CreateNotificationOptions, "userId">
): Promise<void> {
  const notifications = userIds.map((userId) => ({
    user_id: userId,
    type: options.type,
    title: options.title,
    message: options.message,
    link: options.link,
    metadata: options.metadata,
  }));

  const { error } = await supabaseAdmin
    .from("notifications")
    .insert(notifications);

  if (error) {
    console.error("Error creating bulk notifications:", error);
  }
}

async function sendEmailNotificationIfEnabled(
  options: CreateNotificationOptions
): Promise<void> {
  // Get user preferences
  const { data: prefs } = await supabaseAdmin
    .from("notification_preferences")
    .select("*")
    .eq("user_id", options.userId)
    .single();

  if (!prefs) return;

  // Check if this notification type should trigger email
  const shouldEmail = shouldSendEmail(options.type, prefs);
  if (!shouldEmail) return;

  // Get user email
  const { data: user } = await supabaseAdmin
    .from("profiles")
    .select("email, full_name")
    .eq("id", options.userId)
    .single();

  if (!user?.email) return;

  // Send email (implement with your email provider)
  await sendEmail({
    to: user.email,
    subject: options.title,
    template: "notification",
    data: {
      name: user.full_name || "User",
      title: options.title,
      message: options.message,
      link: options.link,
    },
  });
}

function shouldSendEmail(
  type: NotificationType,
  prefs: Record<string, boolean>
): boolean {
  const emailMapping: Record<NotificationType, string> = {
    site_published: "email_updates",
    site_updated: "email_updates",
    client_created: "email_updates",
    client_updated: "email_updates",
    team_invite: "email_team",
    team_joined: "email_team",
    team_left: "email_team",
    payment_success: "email_billing",
    payment_failed: "email_billing",
    subscription_renewed: "email_billing",
    subscription_cancelled: "email_billing",
    comment_added: "email_updates",
    mention: "email_updates",
    security_alert: "email_security",
    system: "email_updates",
  };

  const prefKey = emailMapping[type];
  return prefs[prefKey] ?? true;
}

// Placeholder for actual email implementation
async function sendEmail(options: {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}): Promise<void> {
  // Implement with Resend, SendGrid, etc.
  console.log("Would send email:", options);
}
```

### Task 54.4: Activity Log Service

**File: `src/lib/services/activity.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";
import type { ActivityLogEntry } from "@/types/notifications";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface LogActivityOptions {
  agencyId: string;
  userId: string;
  action: string;
  resourceType: "site" | "client" | "page" | "team" | "billing" | "settings";
  resourceId?: string;
  resourceName?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export async function logActivity(
  options: LogActivityOptions
): Promise<ActivityLogEntry | null> {
  const { data, error } = await supabaseAdmin
    .from("activity_log")
    .insert({
      agency_id: options.agencyId,
      user_id: options.userId,
      action: options.action,
      resource_type: options.resourceType,
      resource_id: options.resourceId,
      resource_name: options.resourceName,
      details: options.details,
      ip_address: options.ipAddress,
    })
    .select()
    .single();

  if (error) {
    console.error("Error logging activity:", error);
    return null;
  }

  return data;
}

export async function getAgencyActivity(
  agencyId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<ActivityLogEntry[]> {
  const { limit = 50, offset = 0 } = options;

  const { data, error } = await supabaseAdmin
    .from("activity_log")
    .select(
      `
      *,
      user:profiles(full_name, avatar_url)
    `
    )
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching activity:", error);
    return [];
  }

  return data.map((entry) => ({
    ...entry,
    user_name: entry.user?.full_name || "Unknown",
    user_avatar: entry.user?.avatar_url,
  }));
}
```

### Task 54.5: Notifications Actions

**File: `src/lib/actions/notifications.ts`**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Notification, NotificationPreferences } from "@/types/notifications";

export async function getNotifications(options: {
  unreadOnly?: boolean;
  limit?: number;
} = {}): Promise<{ notifications: Notification[]; unreadCount: number }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { notifications: [], unreadCount: 0 };
  }

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (options.unreadOnly) {
    query = query.eq("read", false);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data: notifications, error } = await query;

  if (error) {
    console.error("Error fetching notifications:", error);
    return { notifications: [], unreadCount: 0 };
  }

  // Get unread count
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return {
    notifications: notifications || [],
    unreadCount: count || 0,
  };
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  if (error) {
    console.error("Error marking notification read:", error);
    return { error: "Failed to mark notification as read" };
  }

  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllNotificationsRead() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) {
    console.error("Error marking all notifications read:", error);
    return { error: "Failed to mark notifications as read" };
  }

  revalidatePath("/notifications");
  return { success: true };
}

export async function deleteNotification(notificationId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) {
    console.error("Error deleting notification:", error);
    return { error: "Failed to delete notification" };
  }

  revalidatePath("/notifications");
  return { success: true };
}

export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching preferences:", error);
    return null;
  }

  // Return defaults if no preferences exist
  if (!data) {
    return {
      user_id: userId,
      email_marketing: false,
      email_security: true,
      email_updates: true,
      email_team: true,
      email_billing: true,
      push_enabled: true,
      digest_frequency: "realtime",
    };
  }

  return data;
}

export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("notification_preferences")
    .upsert({
      user_id: user.id,
      ...preferences,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Error updating preferences:", error);
    return { error: "Failed to update preferences" };
  }

  revalidatePath("/settings/notifications");
  return { success: true };
}
```

### Task 54.6: Notification Bell Component

**File: `src/components/notifications/notification-bell.tsx`**

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from "lucide-react";
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
import type { Notification } from "@/types/notifications";

const notificationIcons: Record<string, string> = {
  site_published: "🚀",
  site_updated: "✏️",
  client_created: "👤",
  team_invite: "📧",
  team_joined: "🎉",
  payment_success: "💳",
  payment_failed: "⚠️",
  security_alert: "🔒",
  system: "📢",
};

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    const result = await getNotifications({ limit: 10 });
    setNotifications(result.notifications);
    setUnreadCount(result.unreadCount);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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
    await deleteNotification(id);
    const notification = notifications.find((n) => n.id === id);
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
          <Bell className="w-5 h-5" />
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
          {notifications.length === 0 ? (
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
                    <span className="text-xl">
                      {notificationIcons[notification.type] || "📌"}
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
                            className="h-6 w-6 p-0 text-destructive"
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
              router.push("/notifications");
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
```

### Task 54.7: All Notifications Page

**File: `src/app/(dashboard)/notifications/page.tsx`**

```tsx
import { Metadata } from "next";
import { getNotifications } from "@/lib/actions/notifications";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { NotificationsFilters } from "@/components/notifications/notifications-filters";

export const metadata: Metadata = {
  title: "Notifications | DRAMAC",
};

interface NotificationsPageProps {
  searchParams: Promise<{
    filter?: string;
  }>;
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const params = await searchParams;
  const unreadOnly = params.filter === "unread";

  const { notifications, unreadCount } = await getNotifications({
    unreadOnly,
    limit: 100,
  });

  return (
    <div className="container py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
        <NotificationsFilters currentFilter={params.filter} />
      </div>

      <NotificationsList notifications={notifications} />
    </div>
  );
}
```

### Task 54.8: Notifications List Component

**File: `src/components/notifications/notifications-list.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Check, Trash2, ExternalLink } from "lucide-react";
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
  team_invite: "Team Invite",
  team_joined: "Team Member Joined",
  payment_success: "Payment",
  payment_failed: "Payment Failed",
  security_alert: "Security",
  system: "System",
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
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteNotification(id);
    if (result.success) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No notifications to show.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={cn(
              "transition-colors",
              !notification.read && "border-primary/50 bg-primary/5"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {typeLabels[notification.type] || notification.type}
                    </span>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <h3 className="font-medium">{notification.title}</h3>
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
                      onClick={() => router.push(notification.link!)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMarkRead(notification.id)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDelete(notification.id)}
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
```

### Task 54.9: Activity Feed Component

**File: `src/components/activity/activity-feed.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAgencyActivity } from "@/lib/services/activity";
import type { ActivityLogEntry } from "@/types/notifications";

interface ActivityFeedProps {
  agencyId: string;
  limit?: number;
}

const actionLabels: Record<string, string> = {
  "site.created": "created a new site",
  "site.updated": "updated site",
  "site.deleted": "deleted site",
  "site.published": "published site",
  "client.created": "added a new client",
  "client.updated": "updated client",
  "client.deleted": "removed client",
  "team.invited": "invited a team member",
  "team.joined": "joined the team",
  "team.left": "left the team",
  "page.created": "created a new page",
  "page.updated": "updated page",
  "settings.updated": "updated settings",
};

export function ActivityFeed({ agencyId, limit = 20 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      const data = await getAgencyActivity(agencyId, { limit });
      setActivities(data);
      setIsLoading(false);
    }

    fetchActivity();
  }, [agencyId, limit]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No activity yet
            </p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={activity.user_avatar || undefined} />
                    <AvatarFallback>
                      {activity.user_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user_name}</span>{" "}
                      <span className="text-muted-foreground">
                        {actionLabels[activity.action] || activity.action}
                      </span>{" "}
                      {activity.resource_name && (
                        <span className="font-medium">
                          {activity.resource_name}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
```

### Task 54.10: Add Notification Bell to Header

**File: Update `src/components/layout/header.tsx`**

Add the NotificationBell to your header component:

```tsx
import { NotificationBell } from "@/components/notifications/notification-bell";

// In your header component, add:
<NotificationBell />
```

---

## 🧪 Testing Checklist

After implementing this phase, verify:

- [ ] Notification bell displays in header
- [ ] Unread count badge shows correctly
- [ ] Clicking bell opens popover
- [ ] Notifications display in popover
- [ ] Mark as read works (individual)
- [ ] Mark all as read works
- [ ] Delete notification works
- [ ] Clicking notification navigates to link
- [ ] All notifications page loads
- [ ] Filters work (unread/all)
- [ ] Activity feed shows team activity
- [ ] Notification preferences save correctly

---

## 📝 Notes

- Notifications use polling (30s) for updates
- Consider adding WebSocket for real-time updates later
- Activity log helps with audit trails
- Email notifications require email provider setup (Resend recommended)
- Consider adding push notifications for mobile support
