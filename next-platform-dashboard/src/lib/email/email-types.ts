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
  | "trial_ending"
  // Booking
  | "booking_confirmation_customer"
  | "booking_confirmation_owner"
  | "booking_cancelled_customer"
  | "booking_cancelled_owner"
  // E-Commerce
  | "order_confirmation_customer"
  | "order_confirmation_owner"
  | "order_shipped_customer"
  // Quotes
  | "quote_sent_customer"
  | "quote_reminder_customer"
  | "quote_accepted_owner"
  | "quote_rejected_owner"
  // Forms
  | "form_submission_owner";

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
    "booking_confirmation_customer",
    "booking_confirmation_owner",
    "booking_cancelled_customer",
    "booking_cancelled_owner",
    "order_confirmation_customer",
    "order_confirmation_owner",
    "order_shipped_customer",
    "quote_sent_customer",
    "quote_reminder_customer",
    "quote_accepted_owner",
    "quote_rejected_owner",
    "form_submission_owner",
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

// Booking email data
export interface BookingConfirmationCustomerData {
  customerName: string;
  serviceName: string;
  staffName?: string;
  date: string;
  time: string;
  duration: string;
  price: string;
  status: string;
  businessName: string;
  bookingId: string;
}

export interface BookingConfirmationOwnerData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceName: string;
  staffName?: string;
  date: string;
  time: string;
  duration: string;
  price: string;
  status: string;
  dashboardUrl: string;
  bookingId: string;
}

export interface BookingCancelledCustomerData {
  customerName: string;
  serviceName: string;
  staffName?: string;
  date: string;
  time: string;
  duration: string;
  price: string;
  businessName: string;
  bookingId: string;
}

export interface BookingCancelledOwnerData {
  customerName: string;
  customerEmail: string;
  serviceName: string;
  staffName?: string;
  date: string;
  time: string;
  duration: string;
  price: string;
  cancelledBy: string;
  reason?: string;
  dashboardUrl: string;
  bookingId: string;
}

// E-Commerce email data
export interface OrderConfirmationCustomerData {
  customerName: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  shippingAddress?: string;
  businessName: string;
}

export interface OrderConfirmationOwnerData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  total: string;
  paymentStatus: string;
  dashboardUrl: string;
}

export interface OrderShippedCustomerData {
  customerName: string;
  orderNumber: string;
  trackingNumber?: string;
  trackingUrl?: string;
  businessName: string;
}

// Form submission email data
export interface FormSubmissionOwnerData {
  formName: string;
  siteName?: string;
  submittedAt: string;
  fields: Array<{ label: string; value: string }>;
  dashboardUrl?: string;
}

// Quote email data
export interface QuoteSentCustomerData {
  customerName: string;
  quoteNumber: string;
  subject?: string;
  message?: string;
  totalAmount: string;
  expiryDate?: string;
  viewQuoteUrl: string;
  businessName: string;
}

export interface QuoteReminderCustomerData {
  customerName: string;
  quoteNumber: string;
  message?: string;
  totalAmount: string;
  expiryDate?: string;
  viewQuoteUrl: string;
  businessName: string;
}

export interface QuoteAcceptedOwnerData {
  customerName: string;
  customerEmail: string;
  quoteNumber: string;
  totalAmount: string;
  acceptedByName: string;
  dashboardUrl: string;
}

export interface QuoteRejectedOwnerData {
  customerName: string;
  customerEmail: string;
  quoteNumber: string;
  totalAmount: string;
  rejectedByName?: string;
  rejectionReason?: string;
  dashboardUrl: string;
}
