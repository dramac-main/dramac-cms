"use server";

import { createClient } from "@/lib/supabase/server";

export interface ClientNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  metadata: Record<string, unknown>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
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
    isRead: n.is_read,
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
      metadata: notification.metadata || {},
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: "Failed to create notification" };
  }

  return { success: true, notificationId: data.id };
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string,
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("client_notifications")
    .delete()
    .eq("id", notificationId)
    .eq("client_id", clientId);

  if (error) {
    return { success: false, error: "Failed to delete notification" };
  }

  return { success: true };
}

/**
 * Clear all read notifications
 */
export async function clearReadNotifications(
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("client_notifications")
    .delete()
    .eq("client_id", clientId)
    .eq("is_read", true);

  if (error) {
    return { success: false, error: "Failed to clear notifications" };
  }

  return { success: true };
}

// Notification type helpers
export const NotificationTypes = {
  TICKET_UPDATE: "ticket_update",
  TICKET_RESOLVED: "ticket_resolved",
  SITE_PUBLISHED: "site_published",
  SITE_UPDATED: "site_updated",
  INVOICE: "invoice",
  SYSTEM: "system",
  WELCOME: "welcome",
} as const;

/**
 * Create common notification types
 */
export const NotificationTemplates = {
  ticketReply: (ticketNumber: string, ticketId: string) => ({
    type: NotificationTypes.TICKET_UPDATE,
    title: "New reply on your ticket",
    message: `Your support ticket ${ticketNumber} has a new reply.`,
    link: `/portal/support/${ticketId}`,
  }),
  
  ticketResolved: (ticketNumber: string, ticketId: string) => ({
    type: NotificationTypes.TICKET_RESOLVED,
    title: "Ticket resolved",
    message: `Your support ticket ${ticketNumber} has been marked as resolved.`,
    link: `/portal/support/${ticketId}`,
  }),
  
  sitePublished: (siteName: string, siteId: string) => ({
    type: NotificationTypes.SITE_PUBLISHED,
    title: "Site published",
    message: `Your website "${siteName}" has been published and is now live.`,
    link: `/portal/sites/${siteId}`,
  }),
  
  siteUpdated: (siteName: string, siteId: string) => ({
    type: NotificationTypes.SITE_UPDATED,
    title: "Site updated",
    message: `Your website "${siteName}" has been updated.`,
    link: `/portal/sites/${siteId}`,
  }),
  
  welcome: (agencyName: string) => ({
    type: NotificationTypes.WELCOME,
    title: "Welcome to your portal!",
    message: `Welcome to your client portal with ${agencyName}. Here you can view your sites, submit support requests, and more.`,
    link: "/portal",
  }),
};
