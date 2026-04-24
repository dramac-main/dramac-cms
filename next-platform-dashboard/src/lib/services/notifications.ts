import { createClient } from "@supabase/supabase-js";
import type { NotificationType, Notification } from "@/types/notifications";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  // Portal Session 2: tenant scoping + recipient class + dedupe.
  // All optional; legacy callers continue to work unchanged.
  agencyId?: string | null;
  clientId?: string | null;
  siteId?: string | null;
  recipientClass?:
    | "agency_owner"
    | "portal_user"
    | "agent"
    | "customer"
    | "system";
  /** Idempotency key. If a row with this dedupe_key already exists, the
   *  insert is a no-op and the existing row is returned (UPSERT semantics). */
  dedupeKey?: string | null;
}

export async function createNotification(
  options: CreateNotificationOptions,
): Promise<Notification | null> {
  const payload: Record<string, unknown> = {
    user_id: options.userId,
    type: options.type,
    title: options.title,
    message: options.message,
    link: options.link,
    metadata: options.metadata,
  };
  if (options.agencyId !== undefined) payload.agency_id = options.agencyId;
  if (options.clientId !== undefined) payload.client_id = options.clientId;
  if (options.siteId !== undefined) payload.site_id = options.siteId;
  if (options.recipientClass) payload.recipient_class = options.recipientClass;
  if (options.dedupeKey !== undefined) payload.dedupe_key = options.dedupeKey;

  // If a dedupe key is set, use UPSERT so a retry becomes a no-op rather
  // than a unique-constraint violation.
  if (options.dedupeKey) {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .upsert(payload, { onConflict: "dedupe_key", ignoreDuplicates: false })
      .select()
      .single();
    if (error) {
      console.error("Error upserting notification:", error);
      return null;
    }
    return data as Notification;
  }

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Error creating notification:", error);
    return null;
  }

  // In-app notification only — email is handled by the caller
  // (business-notifications.ts, dunning-service.ts, etc.)
  // This prevents duplicate emails.

  return data;
}

export async function createBulkNotifications(
  userIds: string[],
  options: Omit<CreateNotificationOptions, "userId">,
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

// Notification type to display info mapping (icon = Lucide component name)
export const notificationTypeInfo: Record<
  NotificationType,
  { icon: string; color: string; label: string }
> = {
  welcome: {
    icon: "PartyPopper",
    color: "text-primary",
    label: "Welcome",
  },
  site_published: {
    icon: "Rocket",
    color: "text-green-500",
    label: "Site Published",
  },
  site_updated: {
    icon: "Pencil",
    color: "text-blue-500",
    label: "Site Updated",
  },
  client_created: {
    icon: "UserPlus",
    color: "text-purple-500",
    label: "New Client",
  },
  client_updated: {
    icon: "UserCog",
    color: "text-blue-500",
    label: "Client Updated",
  },
  team_invite: { icon: "Mail", color: "text-indigo-500", label: "Team Invite" },
  team_joined: {
    icon: "UserCheck",
    color: "text-green-500",
    label: "Team Joined",
  },
  team_left: {
    icon: "UserMinus",
    color: "text-yellow-500",
    label: "Team Left",
  },
  payment_success: {
    icon: "CreditCard",
    color: "text-green-500",
    label: "Payment Success",
  },
  payment_failed: {
    icon: "AlertTriangle",
    color: "text-red-500",
    label: "Payment Failed",
  },
  subscription_renewed: {
    icon: "RefreshCw",
    color: "text-green-500",
    label: "Subscription Renewed",
  },
  subscription_cancelled: {
    icon: "CircleX",
    color: "text-red-500",
    label: "Subscription Cancelled",
  },
  comment_added: {
    icon: "MessageSquare",
    color: "text-blue-500",
    label: "Comment Added",
  },
  mention: { icon: "AtSign", color: "text-purple-500", label: "Mention" },
  security_alert: {
    icon: "Shield",
    color: "text-red-500",
    label: "Security Alert",
  },
  system: { icon: "Bell", color: "text-gray-500", label: "System" },
  // Booking notifications
  new_booking: {
    icon: "CalendarPlus",
    color: "text-green-500",
    label: "New Booking",
  },
  booking_confirmed: {
    icon: "CalendarCheck",
    color: "text-blue-500",
    label: "Booking Confirmed",
  },
  booking_cancelled: {
    icon: "CalendarX",
    color: "text-red-500",
    label: "Booking Cancelled",
  },
  // E-Commerce notifications
  new_order: {
    icon: "ShoppingCart",
    color: "text-green-500",
    label: "New Order",
  },
  order_shipped: {
    icon: "Package",
    color: "text-blue-500",
    label: "Order Shipped",
  },
  order_delivered: {
    icon: "PackageCheck",
    color: "text-green-500",
    label: "Order Delivered",
  },
  order_cancelled: {
    icon: "CircleX",
    color: "text-red-500",
    label: "Order Cancelled",
  },
  refund_issued: {
    icon: "RotateCcw",
    color: "text-orange-500",
    label: "Refund Issued",
  },
  low_stock: {
    icon: "AlertTriangle",
    color: "text-yellow-500",
    label: "Low Stock",
  },
  payment_received: {
    icon: "Banknote",
    color: "text-green-500",
    label: "Payment Received",
  },
  // Quote notifications
  new_quote_request: {
    icon: "FileQuestion",
    color: "text-blue-500",
    label: "New Quote Request",
  },
  quote_accepted: {
    icon: "FileCheck",
    color: "text-green-500",
    label: "Quote Accepted",
  },
  quote_rejected: {
    icon: "FileX",
    color: "text-red-500",
    label: "Quote Rejected",
  },
  quote_amendment_requested: {
    icon: "FilePen",
    color: "text-orange-500",
    label: "Quote Amendment Requested",
  },
  // Form submissions
  form_submission: {
    icon: "FileText",
    color: "text-blue-500",
    label: "Form Submission",
  },
  // Live Chat
  chat_message: {
    icon: "MessageCircle",
    color: "text-blue-500",
    label: "Chat Message",
  },
  chat_assigned: {
    icon: "UserCheck",
    color: "text-indigo-500",
    label: "Chat Assigned",
  },
  chat_missed: {
    icon: "PhoneMissed",
    color: "text-orange-500",
    label: "Missed Chat",
  },
  chat_rating: { icon: "Star", color: "text-yellow-500", label: "Chat Rating" },
  // Domain & Email provisioning notifications
  email_provisioned: {
    icon: "Mail",
    color: "text-green-500",
    label: "Email Provisioned",
  },
  email_provisioning_failed: {
    icon: "MailX",
    color: "text-red-500",
    label: "Email Provisioning Failed",
  },
  domain_provisioned: {
    icon: "Globe",
    color: "text-green-500",
    label: "Domain Provisioned",
  },
  domain_provisioning_failed: {
    icon: "Globe",
    color: "text-red-500",
    label: "Domain Provisioning Failed",
  },
  dns_configured: {
    icon: "Server",
    color: "text-blue-500",
    label: "DNS Configured",
  },
  // Email renewal & expiry notifications
  email_auto_renewed: {
    icon: "RefreshCw",
    color: "text-green-500",
    label: "Email Auto-Renewed",
  },
  email_auto_renew_failed: {
    icon: "AlertTriangle",
    color: "text-red-500",
    label: "Email Auto-Renew Failed",
  },
  email_expiry_60d: {
    icon: "Clock",
    color: "text-yellow-400",
    label: "Email Expiry (60 Days)",
  },
  email_expiry_30d: {
    icon: "Clock",
    color: "text-yellow-500",
    label: "Email Expiry (30 Days)",
  },
  email_expiry_14d: {
    icon: "Clock",
    color: "text-orange-400",
    label: "Email Expiry (14 Days)",
  },
  email_expiry_7d: {
    icon: "Clock",
    color: "text-orange-500",
    label: "Email Expiry (7 Days)",
  },
  email_expiry_1d: {
    icon: "Clock",
    color: "text-red-500",
    label: "Email Expiry (Tomorrow)",
  },
};
