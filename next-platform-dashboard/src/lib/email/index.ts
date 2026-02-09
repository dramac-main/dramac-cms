/**
 * Email Library Index
 * 
 * Exports all email-related utilities for transactional email sending.
 * Phase WL-02: Added branded email exports.
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
  BookingConfirmationCustomerData,
  BookingConfirmationOwnerData,
  OrderConfirmationCustomerData,
  OrderConfirmationOwnerData,
  OrderShippedCustomerData,
  FormSubmissionOwnerData,
} from "./email-types";

export { isValidEmailType } from "./email-types";

// Branding types (Phase WL-02)
export type { EmailBranding } from "./email-branding";
export { buildEmailBranding } from "./email-branding";

// Client
export { 
  resend, 
  getResend, 
  getEmailFrom, 
  getEmailReplyTo, 
  EMAIL_FROM, 
  EMAIL_REPLY_TO, 
  isEmailEnabled 
} from "./resend-client";

// Templates (legacy)
export { EMAIL_TEMPLATES } from "./templates";

// Send functions
export { sendEmail, sendEmails, previewEmail } from "./send-email";

// Branded email (Phase WL-02)
export { sendBrandedEmail } from "./send-branded-email";
export type { SendBrandedEmailOptions } from "./send-branded-email";
