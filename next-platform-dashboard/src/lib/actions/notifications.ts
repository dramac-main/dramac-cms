"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Notification, NotificationPreferences } from "@/types/notifications";

const defaultPreferences: NotificationPreferences = {
  user_id: "",
  email_marketing: false,
  email_security: true,
  email_updates: true,
  email_team: true,
  email_billing: true,
  push_enabled: true,
  digest_frequency: "realtime",
};

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
    notifications: (notifications as Notification[]) || [],
    unreadCount: count || 0,
  };
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", user.id);

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
      ...defaultPreferences,
      user_id: userId,
    };
  }

  return data as NotificationPreferences;
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

export async function clearAllNotifications() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error("Error clearing notifications:", error);
    return { error: "Failed to clear notifications" };
  }

  revalidatePath("/notifications");
  return { success: true };
}
