"use server";

/**
 * Email Auto-Send Integration
 *
 * Phase INVFIX-09: Bridges the template service with Resend.
 * Provides a single function to send templated emails for all invoice events,
 * checking if the template type is enabled and applying per-site overrides.
 */

import {
  getResend,
  isEmailEnabled,
  getEmailFrom,
} from "@/lib/email/resend-client";
import {
  renderTemplate,
  isEmailTypeEnabled,
  type EmailTemplateType,
} from "./email-template-service";
import { createClient } from "@/lib/supabase/server";
import { INV_TABLES } from "@/modules/invoicing/lib/invoicing-constants";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface SendTemplatedEmailInput {
  siteId: string;
  type: EmailTemplateType;
  to: string;
  variables: Record<string, string>;
}

interface SendResult {
  success: boolean;
  error?: string;
  skipped?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// CORE: Send a Templated Email
// ═══════════════════════════════════════════════════════════════

/**
 * Send an email using the template system.
 * Checks if email is enabled globally + per template type.
 * Applies per-site subject/body overrides from settings.
 */
export async function sendTemplatedEmail(
  input: SendTemplatedEmailInput,
): Promise<SendResult> {
  // 1. Global email check
  if (!isEmailEnabled()) {
    return { success: false, skipped: true, error: "Email not configured" };
  }

  const resend = getResend();
  if (!resend) {
    return { success: false, error: "Resend client not available" };
  }

  // 2. Check if this template type is enabled for the site
  const enabled = await isEmailTypeEnabled(input.siteId, input.type);
  if (!enabled) {
    return {
      success: false,
      skipped: true,
      error: `Template type "${input.type}" is disabled`,
    };
  }

  // 3. Render template with overrides
  try {
    const rendered = await renderTemplate(
      input.siteId,
      input.type,
      input.variables,
    );

    await resend.emails.send({
      from: getEmailFrom(),
      to: input.to,
      subject: rendered.subject,
      html: wrapInEmailLayout(rendered.body, input.variables),
    });

    return { success: true };
  } catch (err) {
    console.error(`[Email Auto-Send] Failed ${input.type}:`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Send failed",
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// AUTO-SEND HOOKS — Call from invoice actions
// ═══════════════════════════════════════════════════════════════

/**
 * Auto-send credit note email when a credit note is issued.
 */
export async function autoSendCreditNoteEmail(
  siteId: string,
  creditNoteId: string,
): Promise<SendResult> {
  const supabase = (await createClient()) as any;

  const { data: cn } = await supabase
    .from(INV_TABLES.creditNotes)
    .select("credit_number, client_name, client_email, total, currency, reason")
    .eq("id", creditNoteId)
    .single();

  if (!cn?.client_email) {
    return { success: false, skipped: true, error: "No client email" };
  }

  const { formatCurrency } = await import("./currency-service");
  const formatted = formatCurrency(cn.total || 0, cn.currency || "ZMW");

  return sendTemplatedEmail({
    siteId,
    type: "credit_note_issued",
    to: cn.client_email,
    variables: {
      clientName: cn.client_name || "Client",
      creditNumber: cn.credit_number || "",
      amount: formatted,
      reason: cn.reason || "Adjustment",
      currency: cn.currency || "ZMW",
    },
  });
}

/**
 * Auto-send recurring invoice notification.
 */
export async function autoSendRecurringInvoiceEmail(
  siteId: string,
  invoiceId: string,
  recurringLabel?: string,
): Promise<SendResult> {
  const supabase = (await createClient()) as any;

  const { data: inv } = await supabase
    .from(INV_TABLES.invoices)
    .select(
      "invoice_number, client_name, client_email, total, amount_due, currency, due_date",
    )
    .eq("id", invoiceId)
    .single();

  if (!inv?.client_email) {
    return { success: false, skipped: true, error: "No client email" };
  }

  const { formatCurrency } = await import("./currency-service");
  const formatted = formatCurrency(
    inv.amount_due || inv.total || 0,
    inv.currency || "ZMW",
  );
  const dueDate = inv.due_date
    ? new Date(inv.due_date).toLocaleDateString("en-ZM", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return sendTemplatedEmail({
    siteId,
    type: "recurring_invoice",
    to: inv.client_email,
    variables: {
      clientName: inv.client_name || "Client",
      invoiceNumber: inv.invoice_number || "",
      amount: formatted,
      dueDate,
      frequency: recurringLabel || "recurring",
      currency: inv.currency || "ZMW",
    },
  });
}

/**
 * Auto-send dunning escalation emails.
 * Called from the enhanced overdue service for staged dunning.
 */
export async function autoSendDunningEmail(
  siteId: string,
  invoiceId: string,
  stage: "warning" | "final" | "writeoff",
): Promise<SendResult> {
  const supabase = (await createClient()) as any;

  const { data: inv } = await supabase
    .from(INV_TABLES.invoices)
    .select(
      "invoice_number, client_name, client_email, total, amount_due, currency, due_date",
    )
    .eq("id", invoiceId)
    .single();

  if (!inv?.client_email) {
    return { success: false, skipped: true, error: "No client email" };
  }

  const { formatCurrency } = await import("./currency-service");
  const formatted = formatCurrency(
    inv.amount_due || inv.total || 0,
    inv.currency || "ZMW",
  );
  const dueDate = inv.due_date
    ? new Date(inv.due_date).toLocaleDateString("en-ZM", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";
  const daysOverdue = inv.due_date
    ? Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86400000)
    : 0;

  const typeMap: Record<string, EmailTemplateType> = {
    warning: "dunning_warning",
    final: "dunning_final",
    writeoff: "dunning_writeoff",
  };

  return sendTemplatedEmail({
    siteId,
    type: typeMap[stage],
    to: inv.client_email,
    variables: {
      clientName: inv.client_name || "Client",
      invoiceNumber: inv.invoice_number || "",
      amount: formatted,
      dueDate,
      daysOverdue: String(daysOverdue),
      currency: inv.currency || "ZMW",
    },
  });
}

/**
 * Auto-send invoice email when manually sent to client.
 */
export async function autoSendInvoiceSentEmail(
  siteId: string,
  invoiceId: string,
): Promise<SendResult> {
  const supabase = (await createClient()) as any;

  const { data: inv } = await supabase
    .from(INV_TABLES.invoices)
    .select(
      "invoice_number, client_name, client_email, total, amount_due, currency, due_date",
    )
    .eq("id", invoiceId)
    .single();

  if (!inv?.client_email) {
    return { success: false, skipped: true, error: "No client email" };
  }

  const { formatCurrency } = await import("./currency-service");
  const formatted = formatCurrency(
    inv.amount_due || inv.total || 0,
    inv.currency || "ZMW",
  );
  const dueDate = inv.due_date
    ? new Date(inv.due_date).toLocaleDateString("en-ZM", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return sendTemplatedEmail({
    siteId,
    type: "invoice_sent",
    to: inv.client_email,
    variables: {
      clientName: inv.client_name || "Client",
      invoiceNumber: inv.invoice_number || "",
      amount: formatted,
      dueDate,
      currency: inv.currency || "ZMW",
    },
  });
}

/**
 * Auto-send payment received email when a payment is recorded.
 */
export async function autoSendPaymentReceivedEmail(
  siteId: string,
  invoiceId: string,
  paymentAmount: number,
  paymentMethod?: string,
): Promise<SendResult> {
  const supabase = (await createClient()) as any;

  const { data: inv } = await supabase
    .from(INV_TABLES.invoices)
    .select(
      "invoice_number, client_name, client_email, total, amount_due, currency",
    )
    .eq("id", invoiceId)
    .single();

  if (!inv?.client_email) {
    return { success: false, skipped: true, error: "No client email" };
  }

  const { formatCurrency } = await import("./currency-service");
  const formattedPayment = formatCurrency(
    paymentAmount,
    inv.currency || "ZMW",
  );
  const formattedBalance = formatCurrency(
    Math.max(0, (inv.amount_due || 0) - paymentAmount),
    inv.currency || "ZMW",
  );

  return sendTemplatedEmail({
    siteId,
    type: "payment_received",
    to: inv.client_email,
    variables: {
      clientName: inv.client_name || "Client",
      invoiceNumber: inv.invoice_number || "",
      paymentAmount: formattedPayment,
      balanceDue: formattedBalance,
      paymentMethod: paymentMethod || "Bank Transfer",
      currency: inv.currency || "ZMW",
    },
  });
}

/**
 * Auto-send overdue reminder email.
 */
export async function autoSendOverdueReminderEmail(
  siteId: string,
  invoiceId: string,
): Promise<SendResult> {
  const supabase = (await createClient()) as any;

  const { data: inv } = await supabase
    .from(INV_TABLES.invoices)
    .select(
      "invoice_number, client_name, client_email, total, amount_due, currency, due_date",
    )
    .eq("id", invoiceId)
    .single();

  if (!inv?.client_email) {
    return { success: false, skipped: true, error: "No client email" };
  }

  const { formatCurrency } = await import("./currency-service");
  const formatted = formatCurrency(
    inv.amount_due || inv.total || 0,
    inv.currency || "ZMW",
  );
  const daysOverdue = inv.due_date
    ? Math.floor((Date.now() - new Date(inv.due_date).getTime()) / 86400000)
    : 0;
  const dueDate = inv.due_date
    ? new Date(inv.due_date).toLocaleDateString("en-ZM", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return sendTemplatedEmail({
    siteId,
    type: "overdue_reminder",
    to: inv.client_email,
    variables: {
      clientName: inv.client_name || "Client",
      invoiceNumber: inv.invoice_number || "",
      amount: formatted,
      dueDate,
      daysOverdue: String(daysOverdue),
      currency: inv.currency || "ZMW",
    },
  });
}

/**
 * Auto-send late fee applied notification.
 */
export async function autoSendLateFeeEmail(
  siteId: string,
  invoiceId: string,
  feeAmount: number,
): Promise<SendResult> {
  const supabase = (await createClient()) as any;

  const { data: inv } = await supabase
    .from(INV_TABLES.invoices)
    .select(
      "invoice_number, client_name, client_email, amount_due, currency",
    )
    .eq("id", invoiceId)
    .single();

  if (!inv?.client_email) {
    return { success: false, skipped: true, error: "No client email" };
  }

  const { formatCurrency } = await import("./currency-service");
  const formattedFee = formatCurrency(feeAmount, inv.currency || "ZMW");
  const formattedTotal = formatCurrency(
    inv.amount_due || 0,
    inv.currency || "ZMW",
  );

  return sendTemplatedEmail({
    siteId,
    type: "late_fee_applied",
    to: inv.client_email,
    variables: {
      clientName: inv.client_name || "Client",
      invoiceNumber: inv.invoice_number || "",
      feeAmount: formattedFee,
      newTotal: formattedTotal,
      currency: inv.currency || "ZMW",
    },
  });
}

/**
 * Auto-send account statement email.
 */
export async function autoSendAccountStatementEmail(
  siteId: string,
  clientId: string,
  statementHtml: string,
  periodLabel: string,
): Promise<SendResult> {
  const supabase = (await createClient()) as any;

  const { data: client } = await supabase
    .from(INV_TABLES.invoices)
    .select("client_name, client_email")
    .eq("contact_id", clientId)
    .eq("site_id", siteId)
    .limit(1)
    .maybeSingle();

  if (!client?.client_email) {
    return { success: false, skipped: true, error: "No client email" };
  }

  return sendTemplatedEmail({
    siteId,
    type: "account_statement",
    to: client.client_email,
    variables: {
      clientName: client.client_name || "Client",
      statementPeriod: periodLabel,
      statementDate: new Date().toLocaleDateString("en-ZM", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// HTML Email Layout Wrapper
// ═══════════════════════════════════════════════════════════════

function wrapInEmailLayout(
  body: string,
  variables: Record<string, string>,
): string {
  const company = variables.companyName || "Dramac";
  // Convert line breaks to <br> for plain-text template bodies
  const htmlBody = body.includes("<") ? body : body.replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <div style="background: #1f2937; padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 22px;">${escapeHtml(company)}</h1>
    </div>
    <div style="padding: 32px 24px; line-height: 1.6;">
      ${htmlBody}
    </div>
    <div style="padding: 16px 24px; background: #f9fafb; text-align: center; font-size: 12px; color: #9ca3af;">
      ${escapeHtml(company)}
    </div>
  </div>
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
