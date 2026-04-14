"use server";

import { getResend, isEmailEnabled, getEmailFrom } from "@/lib/email/resend-client";
import { formatCurrency } from "../services/currency-service";

// ═══════════════════════════════════════════════════════════════
// INVOICING EMAIL SERVICE
// ═══════════════════════════════════════════════════════════════

export type InvoiceEmailType =
  | "invoice_sent"
  | "payment_received"
  | "overdue_reminder"
  | "late_fee_applied";

interface BaseEmailData {
  siteId: string;
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  currency: string;
  paymentToken?: string;
  companyName?: string | null;
}

interface InvoiceSentData extends BaseEmailData {
  amountDue: number;
  dueDate: string;
  lineItemsSummary?: string;
}

interface PaymentReceivedData extends BaseEmailData {
  amountPaid: number;
  paymentMethod?: string;
  remainingBalance: number;
}

interface OverdueReminderData extends BaseEmailData {
  amountDue: number;
  dueDate: string;
  daysOverdue: number;
  reminderTier?: number; // 1, 2, 3 for escalating urgency
}

interface LateFeeAppliedData extends BaseEmailData {
  lateFeeAmount: number;
  newTotal: number;
  amountDue: number;
}

type InvoiceEmailData =
  | InvoiceSentData
  | PaymentReceivedData
  | OverdueReminderData
  | LateFeeAppliedData;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com";

/**
 * Send an invoicing email via Resend.
 */
export async function sendInvoiceEmail(
  type: InvoiceEmailType,
  data: InvoiceEmailData
): Promise<{ success: boolean; error?: string }> {
  if (!isEmailEnabled()) {
    return { success: false, error: "Email not configured" };
  }

  const resend = getResend();
  if (!resend) {
    return { success: false, error: "Resend client not available" };
  }

  try {
    const { subject, html } = renderInvoiceEmail(type, data);

    await resend.emails.send({
      from: getEmailFrom(),
      to: data.clientEmail,
      subject,
      html,
    });

    return { success: true };
  } catch (err) {
    console.error(`[Invoicing Email] Failed to send ${type}:`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ─── Email Rendering ─────────────────────────────────────────

function renderInvoiceEmail(
  type: InvoiceEmailType,
  data: InvoiceEmailData
): { subject: string; html: string } {
  switch (type) {
    case "invoice_sent":
      return renderInvoiceSent(data as InvoiceSentData);
    case "payment_received":
      return renderPaymentReceived(data as PaymentReceivedData);
    case "overdue_reminder":
      return renderOverdueReminder(data as OverdueReminderData);
    case "late_fee_applied":
      return renderLateFeeApplied(data as LateFeeAppliedData);
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}

// ─── Email Wrapper ───────────────────────────────────────────

function emailWrapper(companyName: string | null | undefined, body: string): string {
  const company = companyName || "Dramac";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice Notification</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#1a1a2e;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">${escapeHtml(company)}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                Sent via ${escapeHtml(company)} — Powered by Dramac
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function payNowButton(paymentToken?: string): string {
  if (!paymentToken) return "";
  const payUrl = `${APP_URL}/api/invoicing/pay/${paymentToken}`;
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background-color:#1a1a2e;border-radius:6px;padding:12px 32px;">
          <a href="${payUrl}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">
            Pay Now
          </a>
        </td>
      </tr>
    </table>`;
}

function viewInvoiceButton(paymentToken?: string): string {
  if (!paymentToken) return "";
  const viewUrl = `${APP_URL}/api/invoicing/pay/${paymentToken}`;
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background-color:#1a1a2e;border-radius:6px;padding:12px 32px;">
          <a href="${viewUrl}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">
            View Invoice
          </a>
        </td>
      </tr>
    </table>`;
}

function fmtMoney(amountInCents: number, currency: string): string {
  return formatCurrency(amountInCents, currency);
}

function fmtDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-ZM", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Invoice Sent ────────────────────────────────────────────

function renderInvoiceSent(data: InvoiceSentData) {
  const subject = `Invoice ${data.invoiceNumber} from ${data.companyName || "Dramac"}`;
  const body = `
    <h2 style="margin:0 0 16px;color:#111827;font-size:18px;">Invoice ${escapeHtml(data.invoiceNumber)}</h2>
    <p style="margin:0 0 8px;color:#374151;font-size:14px;">Hi ${escapeHtml(data.clientName)},</p>
    <p style="margin:0 0 16px;color:#374151;font-size:14px;">
      A new invoice has been created for you. Please review the details below.
    </p>
    <table role="presentation" width="100%" cellpadding="8" cellspacing="0" style="background-color:#f9fafb;border-radius:6px;margin:16px 0;">
      <tr>
        <td style="color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;">Amount Due</td>
        <td style="color:#111827;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #e5e7eb;">${fmtMoney(data.amountDue, data.currency)}</td>
      </tr>
      <tr>
        <td style="color:#6b7280;font-size:13px;">Due Date</td>
        <td style="color:#111827;font-size:14px;font-weight:500;text-align:right;">${fmtDate(data.dueDate)}</td>
      </tr>
    </table>
    ${payNowButton(data.paymentToken)}
    <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">
      If you have any questions, please contact us.
    </p>`;
  return { subject, html: emailWrapper(data.companyName, body) };
}

// ─── Payment Received ────────────────────────────────────────

function renderPaymentReceived(data: PaymentReceivedData) {
  const subject = `Payment Received — ${data.invoiceNumber}`;
  const isFullyPaid = data.remainingBalance <= 0;
  const body = `
    <h2 style="margin:0 0 16px;color:#111827;font-size:18px;">Payment Confirmation</h2>
    <p style="margin:0 0 8px;color:#374151;font-size:14px;">Hi ${escapeHtml(data.clientName)},</p>
    <p style="margin:0 0 16px;color:#374151;font-size:14px;">
      We have received your payment for invoice ${escapeHtml(data.invoiceNumber)}. Thank you!
    </p>
    <table role="presentation" width="100%" cellpadding="8" cellspacing="0" style="background-color:#f0fdf4;border-radius:6px;margin:16px 0;">
      <tr>
        <td style="color:#166534;font-size:13px;border-bottom:1px solid #bbf7d0;">Amount Paid</td>
        <td style="color:#166534;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #bbf7d0;">${fmtMoney(data.amountPaid, data.currency)}</td>
      </tr>
      ${data.paymentMethod ? `<tr>
        <td style="color:#166534;font-size:13px;border-bottom:1px solid #bbf7d0;">Method</td>
        <td style="color:#166534;font-size:14px;text-align:right;border-bottom:1px solid #bbf7d0;">${escapeHtml(data.paymentMethod)}</td>
      </tr>` : ""}
      <tr>
        <td style="color:#166534;font-size:13px;">Status</td>
        <td style="color:#166534;font-size:14px;font-weight:600;text-align:right;">
          ${isFullyPaid ? "✅ Paid in Full" : `Remaining: ${fmtMoney(data.remainingBalance, data.currency)}`}
        </td>
      </tr>
    </table>
    ${!isFullyPaid ? payNowButton(data.paymentToken) : viewInvoiceButton(data.paymentToken)}`;
  return { subject, html: emailWrapper(data.companyName, body) };
}

// ─── Overdue Reminder ────────────────────────────────────────

function renderOverdueReminder(data: OverdueReminderData) {
  const tier = data.reminderTier || 1;
  const { subject, heading, message, urgencyColor } = getOverdueTierContent(
    data.invoiceNumber,
    data.daysOverdue,
    tier,
    data.companyName
  );
  const body = `
    <div style="background-color:${urgencyColor};padding:12px 16px;border-radius:6px;margin:0 0 16px;">
      <h2 style="margin:0;color:#ffffff;font-size:16px;">${heading}</h2>
    </div>
    <p style="margin:0 0 8px;color:#374151;font-size:14px;">Hi ${escapeHtml(data.clientName)},</p>
    <p style="margin:0 0 16px;color:#374151;font-size:14px;">${message}</p>
    <table role="presentation" width="100%" cellpadding="8" cellspacing="0" style="background-color:#fef2f2;border-radius:6px;margin:16px 0;">
      <tr>
        <td style="color:#991b1b;font-size:13px;border-bottom:1px solid #fecaca;">Invoice</td>
        <td style="color:#991b1b;font-size:14px;font-weight:500;text-align:right;border-bottom:1px solid #fecaca;">${escapeHtml(data.invoiceNumber)}</td>
      </tr>
      <tr>
        <td style="color:#991b1b;font-size:13px;border-bottom:1px solid #fecaca;">Amount Due</td>
        <td style="color:#991b1b;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #fecaca;">${fmtMoney(data.amountDue, data.currency)}</td>
      </tr>
      <tr>
        <td style="color:#991b1b;font-size:13px;border-bottom:1px solid #fecaca;">Original Due Date</td>
        <td style="color:#991b1b;font-size:14px;text-align:right;border-bottom:1px solid #fecaca;">${fmtDate(data.dueDate)}</td>
      </tr>
      <tr>
        <td style="color:#991b1b;font-size:13px;">Days Overdue</td>
        <td style="color:#991b1b;font-size:14px;font-weight:600;text-align:right;">${data.daysOverdue} days</td>
      </tr>
    </table>
    ${payNowButton(data.paymentToken)}
    <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">
      If you have already made this payment, please disregard this notice.
    </p>`;
  return { subject, html: emailWrapper(data.companyName, body) };
}

function getOverdueTierContent(
  invoiceNumber: string,
  daysOverdue: number,
  tier: number,
  companyName?: string | null
) {
  const company = companyName || "Dramac";

  if (tier >= 3 || daysOverdue >= 30) {
    return {
      subject: `URGENT: Immediate Payment Required — ${invoiceNumber}`,
      heading: "⚠️ Immediate Payment Required",
      message: `Your invoice ${invoiceNumber} is now ${daysOverdue} days overdue. Immediate payment is required to avoid further action. Please settle this outstanding balance as soon as possible.`,
      urgencyColor: "#991b1b",
    };
  }
  if (tier >= 2 || daysOverdue >= 14) {
    return {
      subject: `Payment Overdue — ${invoiceNumber} (${daysOverdue} days)`,
      heading: "Payment Overdue Notice",
      message: `This is a reminder that invoice ${invoiceNumber} is now ${daysOverdue} days past due. Please arrange payment at your earliest convenience to bring your account current.`,
      urgencyColor: "#c2410c",
    };
  }
  return {
    subject: `Friendly Reminder: Invoice ${invoiceNumber} is Past Due`,
    heading: "Payment Reminder",
    message: `Just a friendly reminder that invoice ${invoiceNumber} was due on its due date and is now ${daysOverdue} days past due. We'd appreciate your prompt attention to this matter.`,
    urgencyColor: "#d97706",
  };
}

// ─── Late Fee Applied ────────────────────────────────────────

function renderLateFeeApplied(data: LateFeeAppliedData) {
  const subject = `Late Fee Applied — ${data.invoiceNumber}`;
  const body = `
    <h2 style="margin:0 0 16px;color:#111827;font-size:18px;">Late Fee Notice</h2>
    <p style="margin:0 0 8px;color:#374151;font-size:14px;">Hi ${escapeHtml(data.clientName)},</p>
    <p style="margin:0 0 16px;color:#374151;font-size:14px;">
      A late fee has been applied to invoice ${escapeHtml(data.invoiceNumber)} due to overdue payment.
    </p>
    <table role="presentation" width="100%" cellpadding="8" cellspacing="0" style="background-color:#fef3c7;border-radius:6px;margin:16px 0;">
      <tr>
        <td style="color:#92400e;font-size:13px;border-bottom:1px solid #fde68a;">Late Fee</td>
        <td style="color:#92400e;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #fde68a;">${fmtMoney(data.lateFeeAmount, data.currency)}</td>
      </tr>
      <tr>
        <td style="color:#92400e;font-size:13px;border-bottom:1px solid #fde68a;">New Total</td>
        <td style="color:#92400e;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #fde68a;">${fmtMoney(data.newTotal, data.currency)}</td>
      </tr>
      <tr>
        <td style="color:#92400e;font-size:13px;">Amount Due</td>
        <td style="color:#92400e;font-size:14px;font-weight:600;text-align:right;">${fmtMoney(data.amountDue, data.currency)}</td>
      </tr>
    </table>
    ${payNowButton(data.paymentToken)}
    <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">
      To avoid additional charges, please make your payment promptly.
    </p>`;
  return { subject, html: emailWrapper(data.companyName, body) };
}
