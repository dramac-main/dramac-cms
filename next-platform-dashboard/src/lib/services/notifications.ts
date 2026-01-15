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

interface SendEmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

// Email sending function - can be implemented with Resend, SendGrid, etc.
async function sendEmail(options: SendEmailOptions): Promise<void> {
  // Check if Resend API key is configured
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.log("Email not sent - RESEND_API_KEY not configured:", options.subject);
    return;
  }

  try {
    // Using Resend for email delivery
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "DRAMAC <noreply@dramac.app>",
        to: options.to,
        subject: options.subject,
        html: generateEmailHtml(options.template, options.data),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error sending email:", errorData);
    }
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

function generateEmailHtml(
  template: string,
  data: Record<string, unknown>
): string {
  const name = String(data.name || "User");
  const title = String(data.title || "");
  const message = String(data.message || "");
  const link = data.link ? String(data.link) : null;

  // Simple notification email template
  if (template === "notification") {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">DRAMAC</h1>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="margin-top: 0;">Hi ${name},</p>
    <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 10px;">${title}</h2>
    <p style="color: #4b5563; margin-bottom: 20px;">${message}</p>
    ${
      link
        ? `<a href="${link}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">View Details</a>`
        : ""
    }
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="color: #9ca3af; font-size: 14px; margin-bottom: 0;">
      This is an automated notification from DRAMAC. You can manage your notification preferences in your account settings.
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  // Default fallback
  return `<p>${message}</p>`;
}

// Notification type to display info mapping
export const notificationTypeInfo: Record<
  NotificationType,
  { icon: string; color: string; label: string }
> = {
  site_published: { icon: "🚀", color: "text-green-500", label: "Site Published" },
  site_updated: { icon: "✏️", color: "text-blue-500", label: "Site Updated" },
  client_created: { icon: "👤", color: "text-purple-500", label: "New Client" },
  client_updated: { icon: "👤", color: "text-blue-500", label: "Client Updated" },
  team_invite: { icon: "📧", color: "text-indigo-500", label: "Team Invite" },
  team_joined: { icon: "🎉", color: "text-green-500", label: "Team Joined" },
  team_left: { icon: "👋", color: "text-yellow-500", label: "Team Left" },
  payment_success: { icon: "💳", color: "text-green-500", label: "Payment Success" },
  payment_failed: { icon: "⚠️", color: "text-red-500", label: "Payment Failed" },
  subscription_renewed: { icon: "🔄", color: "text-green-500", label: "Subscription Renewed" },
  subscription_cancelled: { icon: "❌", color: "text-red-500", label: "Subscription Cancelled" },
  comment_added: { icon: "💬", color: "text-blue-500", label: "Comment Added" },
  mention: { icon: "@", color: "text-purple-500", label: "Mention" },
  security_alert: { icon: "🔒", color: "text-red-500", label: "Security Alert" },
  system: { icon: "📢", color: "text-gray-500", label: "System" },
};
