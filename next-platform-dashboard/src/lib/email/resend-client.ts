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

// Email configuration
export function getEmailFrom(): string {
  return process.env.EMAIL_FROM || "Dramac <noreply@dramac.app>";
}

export function getEmailReplyTo(): string {
  return process.env.EMAIL_REPLY_TO || "support@dramac.app>";
}

// Legacy exports (deprecated - use get functions instead)
export const EMAIL_FROM = process.env.EMAIL_FROM || "Dramac <noreply@dramac.app>";
export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || "support@dramac.app>";
