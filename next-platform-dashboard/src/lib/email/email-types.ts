/**
 * Email Types - Transactional Email System
 * 
 * Defines types for the email notification system using Resend.
 * Note: This is separate from client portal notifications (src/lib/portal/notification-service.ts)
 */

export type EmailType =
  // Auth
  | "welcome"
  | "password_reset"
  | "email_changed"
  // Team
  | "team_invitation"
  | "team_member_joined"
  // Sites
  | "site_published"
  | "domain_connected"
  // Billing (LemonSqueezy)
  | "subscription_created"
  | "payment_failed"
  | "trial_ending";

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailOptions {
  to: EmailRecipient | EmailRecipient[];
  type: EmailType;
  data: Record<string, unknown>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Type guards
export function isValidEmailType(type: string): type is EmailType {
  const validTypes: EmailType[] = [
    "welcome",
    "password_reset",
    "email_changed",
    "team_invitation",
    "team_member_joined",
    "site_published",
    "domain_connected",
    "subscription_created",
    "payment_failed",
    "trial_ending",
  ];
  return validTypes.includes(type as EmailType);
}

// Data interfaces for each email type
export interface WelcomeEmailData {
  name?: string;
  dashboardUrl: string;
}

export interface PasswordResetEmailData {
  resetUrl: string;
}

export interface EmailChangedData {
  newEmail: string;
}

export interface TeamInvitationData {
  inviterName: string;
  agencyName: string;
  inviteUrl: string;
}

export interface TeamMemberJoinedData {
  memberName: string;
  agencyName: string;
}

export interface SitePublishedData {
  siteName: string;
  siteUrl: string;
}

export interface DomainConnectedData {
  domain: string;
  siteName: string;
}

export interface SubscriptionCreatedData {
  planName: string;
}

export interface PaymentFailedData {
  updatePaymentUrl?: string;
}

export interface TrialEndingData {
  daysLeft: number;
  upgradeUrl?: string;
}
