/**
 * Send Email Function
 * 
 * Core function for sending transactional emails using Resend.
 * Handles template rendering, recipient formatting, and error handling.
 */

import { resend, getEmailFrom, getEmailReplyTo, isEmailEnabled } from "./resend-client";
import { EMAIL_TEMPLATES } from "./templates";
import type { SendEmailOptions, EmailResult, EmailRecipient } from "./email-types";

/**
 * Send a transactional email
 * 
 * @param options - Email options including recipient, type, and data
 * @returns Result with success status and message ID or error
 * 
 * @example
 * ```ts
 * const result = await sendEmail({
 *   to: { email: "user@example.com", name: "John" },
 *   type: "welcome",
 *   data: { name: "John", dashboardUrl: "https://app.dramacagency.com/dashboard" }
 * });
 * ```
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  // Check if email is enabled
  if (!isEmailEnabled()) {
    console.log("[Email] Skipping email send - RESEND_API_KEY not configured");
    return { 
      success: true, 
      messageId: "skipped-no-api-key",
    };
  }

  const template = EMAIL_TEMPLATES[options.type];
  
  if (!template) {
    console.error(`[Email] Unknown email type: ${options.type}`);
    return { success: false, error: `Unknown email type: ${options.type}` };
  }

  // Format recipients
  const toArray = Array.isArray(options.to) ? options.to : [options.to];
  const toEmails = toArray.map((r: EmailRecipient) =>
    r.name ? `${r.name} <${r.email}>` : r.email
  );

  // Generate email content
  const subject = template.subject(options.data);
  const html = template.html(options.data);
  const text = template.text(options.data);

  try {
    const emailFrom = getEmailFrom();
    const emailReplyTo = getEmailReplyTo();
    
    console.log(`[Email] Sending ${options.type} email to ${toEmails.join(", ")}`);
    
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: toEmails,
      replyTo: emailReplyTo,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Successfully sent ${options.type} email, ID: ${data?.id}`);
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
 * Send multiple emails in batch
 * 
 * @param emails - Array of email options to send
 * @returns Array of results for each email
 */
export async function sendEmails(emails: SendEmailOptions[]): Promise<EmailResult[]> {
  const results = await Promise.all(emails.map(sendEmail));
  return results;
}

/**
 * Preview an email template (for testing/development)
 * 
 * @param type - Email type to preview
 * @param data - Template data
 * @returns HTML and text versions of the email
 */
export function previewEmail(
  type: keyof typeof EMAIL_TEMPLATES,
  data: Record<string, unknown>
): { subject: string; html: string; text: string } | null {
  const template = EMAIL_TEMPLATES[type];
  
  if (!template) {
    return null;
  }

  return {
    subject: template.subject(data),
    html: template.html(data),
    text: template.text(data),
  };
}
