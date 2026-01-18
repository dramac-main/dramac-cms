"use server";

import { createClient } from "@/lib/supabase/server";
import { Json } from "@/types/database";

export interface ClientNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  metadata: Record<string, unknown>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string | null;
}

/**
 * Get notifications for a client
 */
export async function getClientNotifications(
  clientId: string,
  options?: {
    unreadOnly?: boolean;
    limit?: number;
  }
): Promise<ClientNotification[]> {
  const supabase = await createClient();

  let query = supabase
    .from("client_notifications")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (options?.unreadOnly) {
    query = query.eq("is_read", false);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map(n => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
    metadata: (n.metadata as Record<string, unknown>) || {},
    isRead: n.is_read ?? false,
    readAt: n.read_at,
    createdAt: n.created_at,
  }));
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(clientId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("client_notifications")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("is_read", false);

  if (error) {
    return 0;
  }

  return count || 0;
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(
  notificationId: string,
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("client_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("client_id", clientId);

  if (error) {
    return { success: false, error: "Failed to mark notification as read" };
  }

  return { success: true };
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("client_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("client_id", clientId)
    .eq("is_read", false);

  if (error) {
    return { success: false, error: "Failed to mark notifications as read" };
  }

  return { success: true };
}

/**
 * Create a notification for a client (called by server/agency actions)
 */
export async function createNotification(
  clientId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("client_notifications")
    .insert({
      client_id: clientId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link || null,
      metadata: (notification.metadata || {}) as unknown as Json,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Error creating notification:", error);
    return { success: false, error: "Failed to create notification" };
  }

  return { success: true, notificationId: data.id };
}

/**
 * Delete old notifications (cleanup utility)
 */
export async function cleanupOldNotifications(
  clientId: string,
  olderThanDays: number = 90
): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  const supabase = await createClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const { data, error } = await supabase
    .from("client_notifications")
    .delete()
    .eq("client_id", clientId)
    .eq("is_read", true)
    .lt("created_at", cutoffDate.toISOString())
    .select("id");

  if (error) {
    return { success: false, error: "Failed to cleanup notifications" };
  }

  return { success: true, deletedCount: data?.length || 0 };
}
