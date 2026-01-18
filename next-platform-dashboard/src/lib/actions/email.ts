"use server";

/**
 * Email Server Actions
 * 
 * Server actions for sending transactional emails.
 * Use these actions from client components or other server code.
 */

import { sendEmail, sendEmails } from "@/lib/email/send-email";
import type { EmailType, EmailRecipient, EmailResult } from "@/lib/email/email-types";

/**
 * Generic email send action
 * 
 * @param to - Recipient email or object with email and name
 * @param type - Type of email to send
 * @param data - Template data
 */
export async function sendEmailAction(
  to: string | EmailRecipient,
  type: EmailType,
  data: Record<string, unknown>
): Promise<EmailResult> {
  const recipient: EmailRecipient = typeof to === "string" ? { email: to } : to;
  
  return sendEmail({
    to: recipient,
    type,
    data,
  });
}

/**
 * Send multiple emails
 */
export async function sendBatchEmailsAction(
  emails: Array<{
    to: string | EmailRecipient;
    type: EmailType;
    data: Record<string, unknown>;
  }>
): Promise<EmailResult[]> {
  return sendEmails(
    emails.map((email) => ({
      to: typeof email.to === "string" ? { email: email.to } : email.to,
      type: email.type,
      data: email.data,
    }))
  );
}

// ============================================
// SPECIFIC EMAIL HELPERS
// ============================================

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  email: string, 
  name?: string
): Promise<EmailResult> {
  return sendEmail({
    to: { email, name },
    type: "welcome",
    data: {
      name,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    },
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<EmailResult> {
  return sendEmail({
    to: { email },
    type: "password_reset",
    data: { resetUrl },
  });
}

/**
 * Send email changed notification
 */
export async function sendEmailChangedNotification(
  oldEmail: string,
  newEmail: string
): Promise<EmailResult> {
  // Send to both old and new email for security
  const results = await sendEmails([
    {
      to: { email: oldEmail },
      type: "email_changed",
      data: { newEmail },
    },
    {
      to: { email: newEmail },
      type: "email_changed",
      data: { newEmail },
    },
  ]);
  
  // Return success if at least one email was sent
  return results.some((r) => r.success)
    ? { success: true }
    : { success: false, error: "Failed to send email change notifications" };
}

/**
 * Send team invitation email
 */
export async function sendTeamInvitationEmail(
  email: string,
  inviterName: string,
  agencyName: string,
  inviteToken: string
): Promise<EmailResult> {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${inviteToken}`;
  
  return sendEmail({
    to: { email },
    type: "team_invitation",
    data: { inviterName, agencyName, inviteUrl },
  });
}

/**
 * Send team member joined notification
 */
export async function sendTeamMemberJoinedEmail(
  teamEmails: string[],
  memberName: string,
  agencyName: string
): Promise<EmailResult[]> {
  return sendEmails(
    teamEmails.map((email) => ({
      to: { email },
      type: "team_member_joined" as EmailType,
      data: { memberName, agencyName },
    }))
  );
}

/**
 * Send site published notification
 */
export async function sendSitePublishedEmail(
  email: string,
  siteName: string,
  siteUrl: string
): Promise<EmailResult> {
  return sendEmail({
    to: { email },
    type: "site_published",
    data: { siteName, siteUrl },
  });
}

/**
 * Send domain connected notification
 */
export async function sendDomainConnectedEmail(
  email: string,
  domain: string,
  siteName: string
): Promise<EmailResult> {
  return sendEmail({
    to: { email },
    type: "domain_connected",
    data: { domain, siteName },
  });
}

/**
 * Send subscription created notification
 */
export async function sendSubscriptionCreatedEmail(
  email: string,
  planName: string
): Promise<EmailResult> {
  return sendEmail({
    to: { email },
    type: "subscription_created",
    data: { planName },
  });
}

/**
 * Send payment failed notification
 */
export async function sendPaymentFailedEmail(
  email: string,
  updatePaymentUrl?: string
): Promise<EmailResult> {
  return sendEmail({
    to: { email },
    type: "payment_failed",
    data: { 
      updatePaymentUrl: updatePaymentUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    },
  });
}

/**
 * Send trial ending notification
 */
export async function sendTrialEndingEmail(
  email: string,
  daysLeft: number
): Promise<EmailResult> {
  return sendEmail({
    to: { email },
    type: "trial_ending",
    data: { 
      daysLeft,
      upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    },
  });
}
