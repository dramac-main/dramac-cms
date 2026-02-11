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
  metadata?: Record<string, unknown>;
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

  // In-app notification only — email is handled by the caller
  // (business-notifications.ts, dunning-service.ts, etc.)
  // This prevents duplicate emails.

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

// Notification type to display info mapping (icon = Lucide component name)
export const notificationTypeInfo: Record<
  NotificationType,
  { icon: string; color: string; label: string }
> = {
  site_published: { icon: "Rocket", color: "text-green-500", label: "Site Published" },
  site_updated: { icon: "Pencil", color: "text-blue-500", label: "Site Updated" },
  client_created: { icon: "UserPlus", color: "text-purple-500", label: "New Client" },
  client_updated: { icon: "UserCog", color: "text-blue-500", label: "Client Updated" },
  team_invite: { icon: "Mail", color: "text-indigo-500", label: "Team Invite" },
  team_joined: { icon: "UserCheck", color: "text-green-500", label: "Team Joined" },
  team_left: { icon: "UserMinus", color: "text-yellow-500", label: "Team Left" },
  payment_success: { icon: "CreditCard", color: "text-green-500", label: "Payment Success" },
  payment_failed: { icon: "AlertTriangle", color: "text-red-500", label: "Payment Failed" },
  subscription_renewed: { icon: "RefreshCw", color: "text-green-500", label: "Subscription Renewed" },
  subscription_cancelled: { icon: "XCircle", color: "text-red-500", label: "Subscription Cancelled" },
  comment_added: { icon: "MessageSquare", color: "text-blue-500", label: "Comment Added" },
  mention: { icon: "AtSign", color: "text-purple-500", label: "Mention" },
  security_alert: { icon: "Shield", color: "text-red-500", label: "Security Alert" },
  system: { icon: "Bell", color: "text-gray-500", label: "System" },
  // Booking notifications
  new_booking: { icon: "CalendarPlus", color: "text-green-500", label: "New Booking" },
  booking_confirmed: { icon: "CalendarCheck", color: "text-blue-500", label: "Booking Confirmed" },
  booking_cancelled: { icon: "CalendarX", color: "text-red-500", label: "Booking Cancelled" },
  // E-Commerce notifications
  new_order: { icon: "ShoppingCart", color: "text-green-500", label: "New Order" },
  order_shipped: { icon: "Package", color: "text-blue-500", label: "Order Shipped" },
  order_delivered: { icon: "PackageCheck", color: "text-green-500", label: "Order Delivered" },
  // Form submissions
  form_submission: { icon: "FileText", color: "text-blue-500", label: "Form Submission" },
};
