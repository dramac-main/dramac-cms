"use server";

/**
 * Section 5 — Send-test-email server action.
 *
 * Lets a portal user fire a real (or sandboxed) preview of any branded
 * email template against their own inbox so they can confirm the template
 * actually renders, the variables resolve, and the agency/site branding
 * shows up. Each attempt is recorded into `portal_test_email_history`.
 */

import { requirePortalAuth, getPortalSession } from "@/lib/portal/portal-auth";
import { sendBrandedEmail } from "@/lib/email/send-branded-email";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EmailType } from "@/lib/email/email-types";
import { revalidatePath } from "next/cache";
import { TEST_EMAIL_TEMPLATES } from "./test-email-templates";

/**
 * Build a credible sample data envelope per emailType. The data is
 * deliberately obvious ("TEST-12345", "Sample Customer") so the recipient
 * can never confuse a test with a real customer message.
 */
function buildSampleData(emailType: EmailType): Record<string, unknown> {
  const base = {
    customerName: "Sample Customer",
    customerEmail: "sample.customer@example.com",
    siteName: "Your Site",
    siteUrl: "https://example.com",
    supportEmail: "support@example.com",
  };

  switch (emailType) {
    case "welcome":
      return {
        ...base,
        loginUrl: "https://example.com/portal/login",
        userName: "Sample Customer",
      };
    case "password_reset":
      return {
        ...base,
        resetUrl: "https://example.com/reset?token=TEST",
        expiresIn: "1 hour",
      };
    case "order_confirmation_customer":
    case "order_shipped_customer":
      return {
        ...base,
        orderId: "TEST-12345",
        orderNumber: "TEST-12345",
        orderTotal: "$129.00",
        orderItems: [
          { name: "Sample Product A", qty: 1, price: "$99.00" },
          { name: "Sample Product B", qty: 2, price: "$15.00" },
        ],
        trackingNumber: "TRK-TEST-9999",
        trackingUrl: "https://example.com/track/TRK-TEST-9999",
        shippingAddress: "123 Sample St, Sampleville",
      };
    case "payment_received_customer":
      return {
        ...base,
        orderId: "TEST-12345",
        amount: "$129.00",
        paymentMethod: "Visa •••• 4242",
        paidAt: new Date().toISOString(),
      };
    case "booking_confirmation_customer":
    case "booking_confirmed_customer":
      return {
        ...base,
        bookingId: "BK-TEST-7777",
        serviceName: "Sample Consultation",
        bookingDate: new Date(Date.now() + 86_400_000).toISOString(),
        bookingTime: "14:00",
        durationMinutes: 60,
        location: "Sample Location",
        cancellationUrl: "https://example.com/bookings/BK-TEST-7777/cancel",
      };
    case "invoice_sent_customer":
    case "invoice_payment_received_customer":
      return {
        ...base,
        invoiceNumber: "INV-TEST-555",
        invoiceTotal: "$249.00",
        dueDate: new Date(Date.now() + 14 * 86_400_000).toISOString(),
        paymentUrl: "https://example.com/invoices/INV-TEST-555/pay",
        invoiceItems: [
          { description: "Consulting (Sample)", amount: "$249.00" },
        ],
      };
    case "quote_sent_customer":
    case "quote_accepted_customer":
      return {
        ...base,
        quoteNumber: "Q-TEST-321",
        quoteTotal: "$1,499.00",
        quoteUrl: "https://example.com/quotes/Q-TEST-321",
        validUntil: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      };
    case "form_submission_owner":
      return {
        ...base,
        formName: "Sample Contact Form",
        submissionFields: [
          { label: "Name", value: "Sample Customer" },
          { label: "Email", value: "sample.customer@example.com" },
          { label: "Message", value: "This is a test submission." },
        ],
        submittedAt: new Date().toISOString(),
      };
    default:
      return base;
  }
}

export interface SendTestEmailResult {
  ok: boolean;
  error?: string;
  messageId?: string | null;
}

/**
 * Fire a test send of `emailType`. Recipient defaults to the portal user's
 * own email address. Always logs the attempt to `portal_test_email_history`.
 */
export async function sendPortalTestEmail(
  emailType: EmailType,
  recipientOverride?: string,
): Promise<SendTestEmailResult> {
  let user;
  try {
    user = await requirePortalAuth();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Not authenticated",
    };
  }

  // Prevent privilege escalation: only let a user send to their own
  // address. If they typed something else, we ignore it and fall back to
  // their account email so this surface can never be abused as a sender.
  const recipient = (recipientOverride || "").trim().toLowerCase();
  const target =
    recipient && recipient === user.email.toLowerCase()
      ? recipient
      : user.email;

  // Confirm the template is on the allow-list — no arbitrary send.
  const allowed = TEST_EMAIL_TEMPLATES.some((t) => t.type === emailType);
  if (!allowed) {
    return { ok: false, error: "Template not available for testing." };
  }

  const session = await getPortalSession();
  const admin = createAdminClient() as any;

  // Pick a site to brand against (any site the client owns).
  const { data: anySite } = await admin
    .from("clients")
    .select("agency_id, sites:sites(id)")
    .eq("id", user.clientId)
    .maybeSingle();
  const siteId: string | null = anySite?.sites?.[0]?.id ?? null;

  let success = false;
  let errorText: string | null = null;
  let messageId: string | null = null;

  try {
    const result = await sendBrandedEmail(user.agencyId, {
      to: { email: target, name: user.fullName },
      emailType,
      data: {
        ...buildSampleData(emailType),
        // Hint that this is a test — templates that surface the variable
        // can flag it; templates that don't will simply ignore it.
        isTest: true,
      },
      recipientUserId: user.userId,
      siteId: siteId ?? undefined,
      subjectOverride: `[TEST] Sample ${emailType.replace(/_/g, " ")}`,
    });
    success = !!result?.success;
    errorText = result?.success ? null : (result?.error ?? "send_failed");
    messageId = (result as any)?.messageId ?? null;
  } catch (e) {
    errorText = e instanceof Error ? e.message : "Unknown error";
  }

  // Always record the attempt — even failures are useful diagnostics.
  await admin.from("portal_test_email_history").insert({
    user_id: user.userId,
    agency_id: user.agencyId,
    site_id: siteId,
    email_type: emailType,
    recipient: target,
    success,
    error: errorText,
    metadata: {
      isImpersonation: session.isImpersonating,
      impersonatorEmail: session.impersonatorEmail,
      messageId,
    },
  });

  revalidatePath("/portal/settings/notifications");

  if (!success) {
    return { ok: false, error: errorText ?? "Failed to send" };
  }
  return { ok: true, messageId };
}

export interface PortalTestEmailHistoryRow {
  id: string;
  emailType: string;
  recipient: string;
  success: boolean;
  error: string | null;
  sentAt: string;
}

export async function listPortalTestEmailHistory(
  limit = 20,
): Promise<PortalTestEmailHistoryRow[]> {
  const user = await requirePortalAuth();
  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from("portal_test_email_history")
    .select("id, email_type, recipient, success, error, sent_at")
    .eq("user_id", user.userId)
    .order("sent_at", { ascending: false })
    .limit(Math.min(limit, 100));
  if (error) return [];
  return (data ?? []).map((r: any) => ({
    id: String(r.id),
    emailType: String(r.email_type),
    recipient: String(r.recipient),
    success: !!r.success,
    error: r.error ?? null,
    sentAt: String(r.sent_at),
  }));
}
