/**
 * Resend Client Setup
 * 
 * Configures the Resend client for sending transactional emails.
 * Requires RESEND_API_KEY environment variable.
 */

import { Resend } from "resend";

// Check if email sending is enabled
export function isEmailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}

// Warn if API key is missing (but don't throw - allows development without email)
if (!isEmailEnabled()) {
  console.warn(
    "[Email] RESEND_API_KEY not set - emails will not be sent. " +
    "Add RESEND_API_KEY to your .env.local file to enable email sending."
  );
}

// Create Resend client lazily to avoid throwing when API key is missing
let _resend: Resend | null = null;

export function getResend(): Resend | null {
  if (!isEmailEnabled()) {
    return null;
  }
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// Legacy export for compatibility (returns client or throws if not configured)
export const resend = {
  emails: {
    send: async (options: Parameters<Resend["emails"]["send"]>[0]) => {
      const client = getResend();
      if (!client) {
        return { data: null, error: { message: "Email not configured" } };
      }
      return client.emails.send(options);
    },
  },
};

// ============================================================================
// Tracked Email Sending (BIL-05 Integration)
// ============================================================================

/**
 * Send an email via Resend with billing usage tracking.
 * This is the preferred function for all email sends that should count toward
 * agency email quotas.
 *
 * @param options - Resend email send options
 * @param agencyId - The agency sending the email (required for tracking)
 * @param isSystemEmail - If true, don't count toward agency quota (alerts, platform notifications)
 * @param recipientCount - Number of recipients (for bulk sends, defaults to 1)
 */
export async function sendTrackedEmail(
  options: Parameters<Resend["emails"]["send"]>[0],
  agencyId?: string,
  isSystemEmail: boolean = false,
  recipientCount: number = 1,
): Promise<{ data: any; error: any }> {
  const client = getResend();
  if (!client) {
    return { data: null, error: { message: "Email not configured" } };
  }

  const result = await client.emails.send(options);

  // Track usage for non-system emails when agencyId is provided
  if (!result.error && agencyId && !isSystemEmail) {
    try {
      // Dynamic import to avoid circular dependencies
      const { trackEmailSend } = await import("@/lib/paddle/email-usage");
      await trackEmailSend(agencyId, recipientCount);
    } catch (trackError) {
      // Don't fail the email send if tracking fails
      console.error("[Email] Usage tracking error:", trackError);
    }
  }

  return result;
}

// Email configuration
export function getEmailFrom(): string {
  return process.env.EMAIL_FROM || "Dramac <noreply@app.dramacagency.com>";
}

export function getEmailReplyTo(): string {
  return process.env.EMAIL_REPLY_TO || "support@app.dramacagency.com";
}

// Legacy exports (deprecated - use get functions instead)
export const EMAIL_FROM = process.env.EMAIL_FROM || "Dramac <noreply@app.dramacagency.com>";
export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || "support@app.dramacagency.com";
