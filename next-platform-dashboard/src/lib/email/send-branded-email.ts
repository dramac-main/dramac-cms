/**
 * Send Branded Email
 * 
 * Phase WL-02: Email System Overhaul
 * 
 * Wrapper around sendEmail() that automatically fetches agency branding
 * and renders branded templates. This is the primary email sending function
 * for all agency-context emails.
 */

import { resend, isEmailEnabled, getEmailFrom, getEmailReplyTo } from "./resend-client";
import { buildEmailBranding, type EmailBranding } from "./email-branding";
import { renderBrandedTemplate } from "./templates/branded-templates";
import { shouldSendEmail } from "./notification-prefs";
import { getAgencyBranding } from "@/lib/queries/branding";
import type { EmailType, EmailRecipient, EmailResult } from "./email-types";

export interface SendBrandedEmailOptions {
  /** Recipient(s) */
  to: EmailRecipient | EmailRecipient[];
  /** Email template type */
  emailType: EmailType;
  /** Template data */
  data: Record<string, unknown>;
  /** Recipient user ID (for unsubscribe links) */
  recipientUserId?: string;
}

/**
 * Send an agency-branded transactional email.
 * 
 * 1. Fetches agency branding from DB (cached)
 * 2. Builds email branding config
 * 3. Renders branded HTML template
 * 4. Sends via Resend
 * 5. Logs to email_logs table
 * 
 * @param agencyId - The agency whose branding to use
 * @param options - Email options
 */
export async function sendBrandedEmail(
  agencyId: string | null,
  options: SendBrandedEmailOptions
): Promise<EmailResult> {
  if (!isEmailEnabled()) {
    console.log("[Email] Skipping email send - RESEND_API_KEY not configured");
    return { success: true, messageId: "skipped-no-api-key" };
  }

  try {
    // 0. Check notification preferences (opt-out check)
    if (options.recipientUserId) {
      const allowed = await shouldSendEmail(options.recipientUserId, options.emailType);
      if (!allowed) {
        console.log(`[Email] User ${options.recipientUserId} opted out of ${options.emailType} emails`);
        return { success: true, messageId: "skipped-user-opted-out" };
      }
    }

    // 1. Fetch agency branding (cached, returns null if not configured)
    const agencyBranding = agencyId ? await getAgencyBranding(agencyId) : null;

    // 2. Build email branding from agency data
    const branding = buildEmailBranding(agencyBranding, options.recipientUserId);

    // 3. Render branded template
    const { subject, html, text } = renderBrandedTemplate(
      options.emailType,
      options.data,
      branding
    );

    // 4. Format recipients
    const toArray = Array.isArray(options.to) ? options.to : [options.to];
    const toEmails = toArray.map((r) =>
      r.name ? `${r.name} <${r.email}>` : r.email
    );

    // 5. Build from/replyTo with branding
    const from = branding.from_name
      ? `${branding.from_name} <noreply@${process.env.EMAIL_DOMAIN || "app.dramacagency.com"}>`
      : getEmailFrom();
    const replyTo = branding.reply_to || getEmailReplyTo();

    console.log(
      `[Email] Sending branded ${options.emailType} email to ${toEmails.join(", ")} (from: ${branding.from_name})`
    );

    // 6. Send via Resend
    const { data, error } = await resend.emails.send({
      from,
      to: toEmails,
      replyTo,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      return { success: false, error: error.message };
    }

    // 7. Log to email_logs (fire-and-forget)
    logEmailSent({
      agencyId: agencyId || undefined,
      recipientUserId: options.recipientUserId,
      resendId: data?.id,
      toEmail: toArray[0]?.email || "",
      fromName: branding.from_name,
      subject,
      emailType: options.emailType,
    }).catch((err) => console.error("[Email] Log error:", err));

    console.log(
      `[Email] Successfully sent branded ${options.emailType} email, ID: ${data?.id}`
    );
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("[Email] Send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending email",
    };
  }
}

/**
 * Log email send to email_logs table (fire-and-forget).
 */
async function logEmailSent(params: {
  agencyId?: string;
  recipientUserId?: string;
  resendId?: string;
  toEmail: string;
  fromName: string;
  subject: string;
  emailType: string;
}): Promise<void> {
  try {
    // Dynamic import to avoid circular deps
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("email_logs")
      .insert({
        agency_id: params.agencyId || null,
        recipient_user_id: params.recipientUserId || null,
        resend_id: params.resendId || null,
        to_email: params.toEmail,
        from_name: params.fromName,
        subject: params.subject,
        email_type: params.emailType,
        status: "sent",
        sent_at: new Date().toISOString(),
      });
  } catch {
    // Non-critical — don't let logging break email sending
  }
}
