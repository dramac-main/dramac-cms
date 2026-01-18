/**
 * Email Library Index
 * 
 * Exports all email-related utilities for transactional email sending.
 */

// Types
export type {
  EmailType,
  EmailRecipient,
  SendEmailOptions,
  EmailResult,
  WelcomeEmailData,
  PasswordResetEmailData,
  EmailChangedData,
  TeamInvitationData,
  TeamMemberJoinedData,
  SitePublishedData,
  DomainConnectedData,
  SubscriptionCreatedData,
  PaymentFailedData,
  TrialEndingData,
} from "./email-types";

export { isValidEmailType } from "./email-types";

// Client
export { resend, getResend, EMAIL_FROM, EMAIL_REPLY_TO, isEmailEnabled } from "./resend-client";

// Templates
export { EMAIL_TEMPLATES } from "./templates";

// Send functions
export { sendEmail, sendEmails, previewEmail } from "./send-email";
