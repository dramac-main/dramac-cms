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
  | "system"
  // Booking notifications
  | "new_booking"
  | "booking_confirmed"
  | "booking_cancelled"
  // E-Commerce notifications
  | "new_order"
  | "order_shipped"
  | "order_delivered"
  // Form submissions
  | "form_submission";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
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
  details?: Record<string, unknown>;
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

export interface NotificationWithUser extends Notification {
  user?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface ActivityLogEntryWithUser extends Omit<ActivityLogEntry, "user_name" | "user_avatar"> {
  user?: {
    full_name?: string;
    avatar_url?: string;
  } | null;
}
