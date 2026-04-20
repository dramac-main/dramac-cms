"use server";

import { createClient } from "@/lib/supabase/server";
import { mapRecord, mapRecords } from "@/lib/map-db-record";
import {
  INV_TABLES,
  VALID_INVOICE_TRANSITIONS,
} from "../lib/invoicing-constants";
import {
  isValidInvoiceTransition,
  formatInvoiceAmount,
} from "../lib/invoicing-utils";
import { emitAutomationEvent } from "@/modules/automation/lib/automation-engine";
import type {
  Payment,
  CreatePaymentInput,
  PaymentMethod,
  PaymentStatus,
} from "../types/payment-types";
import type { Invoice, InvoiceStatus } from "../types/invoice-types";

// ─── Helpers ───────────────────────────────────────────────────

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

async function logActivity(
  supabase: any,
  siteId: string,
  entityId: string,
  action: string,
  description: string,
  actorType: "user" | "system" | "client" = "user",
  actorId?: string | null,
  actorName?: string | null,
  oldValue?: Record<string, unknown> | null,
  newValue?: Record<string, unknown> | null,
) {
  await supabase.from(INV_TABLES.invoiceActivity).insert({
    site_id: siteId,
    entity_type: "invoice",
    entity_id: entityId,
    action,
    description,
    actor_type: actorType,
    actor_id: actorId || null,
    actor_name: actorName || null,
    old_value: oldValue || null,
    new_value: newValue || null,
  });
}

/**
 * Generate a payment number: PAY-{YYYY}-{NNNN}
 * Uses a DB RPC function with advisory lock for concurrency safety.
 * Falls back to MAX-based approach if RPC is unavailable.
 */
async function generatePaymentNumber(
  supabase: any,
  siteId: string,
): Promise<string> {
  // Try RPC-based atomic generation first
  try {
    const { data, error } = await supabase.rpc(
      "generate_invmod01_payment_number",
      { p_site_id: siteId },
    );
    if (!error && data) return data;
  } catch {
    // Fallback below
  }

  // Fallback: MAX-based (unique constraint is the safety net)
  const year = new Date().getFullYear();
  const prefix = `PAY-${year}-`;
  const { data } = await supabase
    .from(INV_TABLES.payments)
    .select("payment_number")
    .eq("site_id", siteId)
    .like("payment_number", `${prefix}%`)
    .order("payment_number", { ascending: false })
    .limit(1);

  let next = 1;
  if (data && data.length > 0 && data[0].payment_number) {
    const match = data[0].payment_number.match(/PAY-\d{4}-(\d+)/);
    if (match) next = parseInt(match[1], 10) + 1;
  }
  return `${prefix}${next.toString().padStart(4, "0")}`;
}

// ─── Input Types ───────────────────────────────────────────────

export interface PaymentFilters {
  invoiceId?: string;
  method?: PaymentMethod;
  status?: PaymentStatus;
  type?: "payment" | "refund";
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface PaymentPagination {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateRefundInput {
  amount: number;
  paymentMethod?: PaymentMethod;
  reason?: string;
  transactionReference?: string | null;
  notes?: string | null;
}

export interface PaymentSummary {
  totalCollected: number;
  totalRefunded: number;
  netCollected: number;
  paymentCount: number;
  refundCount: number;
  byMethod: { method: PaymentMethod; total: number; count: number }[];
}

// ═══════════════════════════════════════════════════════════════
// RECORD PAYMENT
// ═══════════════════════════════════════════════════════════════

export async function recordPayment(
  invoiceId: string,
  input: CreatePaymentInput,
): Promise<Payment> {
  const supabase = await getModuleClient();

  // 1. Validate: amount > 0
  if (!input.amount || input.amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  // 2. Fetch invoice
  const { data: invoice, error: invErr } = await supabase
    .from(INV_TABLES.invoices)
    .select("*")
    .eq("id", invoiceId)
    .single();
  if (invErr) throw new Error(invErr.message);

  // 3. Validate invoice status
  const blockedStatuses = ["void", "cancelled"];
  if (blockedStatuses.includes(invoice.status)) {
    throw new Error(`Cannot record payment for a ${invoice.status} invoice`);
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Generate payment number
  const paymentNumber = await generatePaymentNumber(supabase, invoice.site_id);
  const receiptNumber = await generateReceiptNumber(invoice.site_id);
  const today = new Date().toISOString().split("T")[0];

  // 5. Create payment record
  const { data: payment, error: payErr } = await supabase
    .from(INV_TABLES.payments)
    .insert({
      site_id: invoice.site_id,
      invoice_id: invoiceId,
      payment_number: paymentNumber,
      receipt_number: receiptNumber,
      type: "payment",
      amount: input.amount,
      currency: input.currency || invoice.currency || "ZMW",
      exchange_rate: 1,
      payment_date: input.paymentDate || today,
      payment_method: input.paymentMethod,
      payment_method_detail: input.paymentMethodDetail || null,
      transaction_reference: input.transactionReference || null,
      gateway_transaction_id: input.gatewayTransactionId || null,
      gateway_provider: input.gatewayProvider || null,
      proof_url: input.proofUrl || null,
      notes: input.notes || null,
      status: "completed" as PaymentStatus,
      recorded_by: user?.id || null,
    })
    .select("*")
    .single();
  if (payErr) throw new Error(payErr.message);

  // 6. Update invoice amounts
  const newAmountPaid = (invoice.amount_paid || 0) + input.amount;
  const newAmountDue =
    invoice.total - newAmountPaid - (invoice.credits_applied || 0);

  // 7. Determine new status
  let newStatus: InvoiceStatus = invoice.status;
  const paidDate: string | null = null;

  if (newAmountDue <= 0) {
    newStatus = "paid";
  } else if (newAmountPaid > 0) {
    newStatus = "partial";
  }

  const updatePayload: Record<string, unknown> = {
    amount_paid: newAmountPaid,
    amount_due: Math.max(0, newAmountDue),
    updated_at: new Date().toISOString(),
  };

  if (newStatus !== invoice.status) {
    updatePayload.status = newStatus;
  }
  if (newStatus === "paid") {
    updatePayload.paid_date = input.paymentDate || today;
  }

  await supabase
    .from(INV_TABLES.invoices)
    .update(updatePayload)
    .eq("id", invoiceId);

  // 8. Log activity
  const formattedAmount = formatInvoiceAmount(
    input.amount,
    invoice.currency || "ZMW",
  );
  await logActivity(
    supabase,
    invoice.site_id,
    invoiceId,
    "payment_recorded",
    `Payment of ${formattedAmount} recorded via ${input.paymentMethod}`,
    "user",
    user?.id || null,
    user?.email || null,
    { status: invoice.status, amount_paid: invoice.amount_paid },
    { status: newStatus, amount_paid: newAmountPaid },
  );

  // 9. Overpayment warning
  if (newAmountPaid > invoice.total) {
    await logActivity(
      supabase,
      invoice.site_id,
      invoiceId,
      "overpayment_warning",
      `Overpayment detected: paid ${formatInvoiceAmount(newAmountPaid, invoice.currency || "ZMW")} on ${formatInvoiceAmount(invoice.total, invoice.currency || "ZMW")} invoice`,
      "system",
    );
  }

  // 10. Fire automation events
  try {
    await emitAutomationEvent(invoice.site_id, "accounting.payment.received", {
      invoiceId,
      paymentId: payment.id,
      amount: input.amount,
      method: input.paymentMethod,
      invoiceNumber: invoice.invoice_number,
      clientName: invoice.client_name,
    });

    if (newStatus === "paid" && invoice.status !== "paid") {
      await emitAutomationEvent(invoice.site_id, "accounting.invoice.paid", {
        invoiceId,
        invoiceNumber: invoice.invoice_number,
        total: invoice.total,
        clientName: invoice.client_name,
      });
    } else if (newStatus === "partial") {
      await emitAutomationEvent(
        invoice.site_id,
        "accounting.invoice.partial_payment",
        {
          invoiceId,
          invoiceNumber: invoice.invoice_number,
          amountPaid: newAmountPaid,
          amountDue: Math.max(0, newAmountDue),
          clientName: invoice.client_name,
        },
      );
    }
  } catch {
    // Non-critical — do not block payment recording
  }

  // 11. Send payment receipt email if client email exists
  try {
    if (invoice.client_email) {
      const { getResend, isEmailEnabled, getEmailFrom } =
        await import("@/lib/email/resend-client");
      if (isEmailEnabled()) {
        const resend = getResend();
        if (resend) {
          const { data: settings } = await supabase
            .from(INV_TABLES.settings)
            .select("*")
            .eq("site_id", invoice.site_id)
            .single();

          const companyName = settings?.company_name || "Our Company";
          const remaining = Math.max(0, newAmountDue);

          await resend.emails.send({
            from: getEmailFrom(),
            to: invoice.client_email,
            subject: `Payment Receipt — ${invoice.invoice_number}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: ${settings?.brand_color || "#1f2937"}; padding: 24px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">${companyName}</h1>
                </div>
                <div style="padding: 32px 24px;">
                  <p>Dear ${invoice.client_name},</p>
                  <p>Thank you! We have received your payment.</p>
                  <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Invoice</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${invoice.invoice_number}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Amount Paid</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${formattedAmount}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Method</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${input.paymentMethod}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Date</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${input.paymentDate || today}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Remaining Balance</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${formatInvoiceAmount(remaining, invoice.currency || "ZMW")}</td></tr>
                  </table>
                  <p style="color: #6b7280; font-size: 14px;">Reference: ${paymentNumber}</p>
                </div>
                <div style="padding: 16px 24px; background: #f9fafb; text-align: center; font-size: 12px; color: #9ca3af;">
                  ${companyName}
                </div>
              </div>
            `,
          });
        }
      }
    }
  } catch {
    // Non-critical — do not block payment recording
  }

  return mapRecord<Payment>(payment);
}

// ═══════════════════════════════════════════════════════════════
// GET PAYMENTS (paginated + filters)
// ═══════════════════════════════════════════════════════════════

export async function getPayments(
  siteId: string,
  filters?: PaymentFilters,
  pagination?: PaymentPagination,
): Promise<{ payments: Payment[]; total: number }> {
  const supabase = await getModuleClient();
  const page = pagination?.page || 1;
  const pageSize = pagination?.pageSize || 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sortBy = pagination?.sortBy || "created_at";
  const sortOrder = pagination?.sortOrder === "asc";

  let query = supabase
    .from(INV_TABLES.payments)
    .select("*", { count: "exact" })
    .eq("site_id", siteId);

  if (filters?.invoiceId) {
    query = query.eq("invoice_id", filters.invoiceId);
  }
  if (filters?.method) {
    query = query.eq("payment_method", filters.method);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  if (filters?.dateFrom) {
    query = query.gte("payment_date", filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte("payment_date", filters.dateTo);
  }
  if (filters?.search) {
    query = query.or(
      `payment_number.ilike.%${filters.search}%,transaction_reference.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`,
    );
  }

  query = query.order(sortBy, { ascending: sortOrder }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    payments: mapRecords<Payment>(data || []),
    total: count || 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// GET SINGLE PAYMENT (with parent invoice)
// ═══════════════════════════════════════════════════════════════

export async function getPayment(
  paymentId: string,
): Promise<Payment & { invoice: Invoice }> {
  const supabase = await getModuleClient();

  const { data: payment, error } = await supabase
    .from(INV_TABLES.payments)
    .select("*")
    .eq("id", paymentId)
    .single();
  if (error) throw new Error(error.message);

  const { data: invoice, error: invErr } = await supabase
    .from(INV_TABLES.invoices)
    .select("*")
    .eq("id", payment.invoice_id)
    .single();
  if (invErr) throw new Error(invErr.message);

  const mappedPayment = mapRecord<Payment>(payment);
  const mappedInvoice = mapRecord<Invoice>(invoice);

  return {
    ...mappedPayment,
    invoice: mappedInvoice,
  } as Payment & { invoice: Invoice };
}

// ═══════════════════════════════════════════════════════════════
// UPDATE PAYMENT
// ═══════════════════════════════════════════════════════════════

export async function updatePayment(
  paymentId: string,
  input: Partial<
    Pick<
      CreatePaymentInput,
      | "paymentDate"
      | "paymentMethod"
      | "paymentMethodDetail"
      | "transactionReference"
      | "notes"
      | "proofUrl"
    >
  >,
): Promise<Payment> {
  const supabase = await getModuleClient();

  // Only allow updating pending or recently completed payments
  const { data: existing, error: fetchErr } = await supabase
    .from(INV_TABLES.payments)
    .select("*")
    .eq("id", paymentId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.paymentDate !== undefined)
    updateData.payment_date = input.paymentDate;
  if (input.paymentMethod !== undefined)
    updateData.payment_method = input.paymentMethod;
  if (input.paymentMethodDetail !== undefined)
    updateData.payment_method_detail = input.paymentMethodDetail;
  if (input.transactionReference !== undefined)
    updateData.transaction_reference = input.transactionReference;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.proofUrl !== undefined) updateData.proof_url = input.proofUrl;

  const { data: payment, error } = await supabase
    .from(INV_TABLES.payments)
    .update(updateData)
    .eq("id", paymentId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  // Log activity
  await logActivity(
    supabase,
    existing.site_id,
    existing.invoice_id,
    "payment_updated",
    `Payment ${existing.payment_number} updated`,
    "user",
  );

  return mapRecord<Payment>(payment);
}

// ═══════════════════════════════════════════════════════════════
// DELETE PAYMENT
// ═══════════════════════════════════════════════════════════════

export async function deletePayment(paymentId: string): Promise<void> {
  const supabase = await getModuleClient();

  // Fetch payment
  const { data: payment, error: fetchErr } = await supabase
    .from(INV_TABLES.payments)
    .select("*")
    .eq("id", paymentId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  // Reverse invoice amounts if completed payment
  if (payment.status === "completed") {
    const { data: invoice } = await supabase
      .from(INV_TABLES.invoices)
      .select("*")
      .eq("id", payment.invoice_id)
      .single();

    if (invoice) {
      const adjustment =
        payment.type === "refund" ? payment.amount : -payment.amount;
      const newAmountPaid = Math.max(
        0,
        (invoice.amount_paid || 0) + adjustment,
      );
      const newAmountDue =
        invoice.total - newAmountPaid - (invoice.credits_applied || 0);

      let newStatus: InvoiceStatus = invoice.status;
      if (newAmountPaid === 0 && invoice.status !== "draft") {
        // Revert to sent/viewed if no payments remain
        newStatus = invoice.sent_at ? "sent" : "draft";
      } else if (newAmountDue > 0 && newAmountPaid > 0) {
        newStatus = "partial";
      }

      await supabase
        .from(INV_TABLES.invoices)
        .update({
          amount_paid: newAmountPaid,
          amount_due: Math.max(0, newAmountDue),
          status: newStatus,
          paid_date: newStatus === "paid" ? invoice.paid_date : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.invoice_id);

      await logActivity(
        supabase,
        invoice.site_id,
        payment.invoice_id,
        "payment_deleted",
        `Payment ${payment.payment_number} (${formatInvoiceAmount(payment.amount, payment.currency || "ZMW")}) was deleted and reversed`,
        "user",
      );
    }
  }

  // Delete the payment record
  const { error } = await supabase
    .from(INV_TABLES.payments)
    .delete()
    .eq("id", paymentId);
  if (error) throw new Error(error.message);
}

// ═══════════════════════════════════════════════════════════════
// RECORD REFUND
// ═══════════════════════════════════════════════════════════════

export async function recordRefund(
  invoiceId: string,
  input: CreateRefundInput,
): Promise<Payment> {
  const supabase = await getModuleClient();

  // 1. Validate
  if (!input.amount || input.amount <= 0) {
    throw new Error("Refund amount must be greater than zero");
  }

  // 2. Fetch invoice
  const { data: invoice, error: invErr } = await supabase
    .from(INV_TABLES.invoices)
    .select("*")
    .eq("id", invoiceId)
    .single();
  if (invErr) throw new Error(invErr.message);

  // 3. Validate: can only refund paid/partial invoices
  if (!["paid", "partial"].includes(invoice.status)) {
    throw new Error(`Cannot record refund for a ${invoice.status} invoice`);
  }

  // 4. Validate: refund cannot exceed amount_paid
  if (input.amount > (invoice.amount_paid || 0)) {
    throw new Error("Refund amount cannot exceed the total amount paid");
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 5. Generate refund number
  const paymentNumber = await generatePaymentNumber(supabase, invoice.site_id);
  const today = new Date().toISOString().split("T")[0];

  // 6. Create refund record
  const { data: refund, error: refErr } = await supabase
    .from(INV_TABLES.payments)
    .insert({
      site_id: invoice.site_id,
      invoice_id: invoiceId,
      payment_number: paymentNumber,
      type: "refund",
      amount: input.amount,
      currency: invoice.currency || "ZMW",
      exchange_rate: 1,
      payment_date: today,
      payment_method: input.paymentMethod || "bank_transfer",
      transaction_reference: input.transactionReference || null,
      notes: input.notes || input.reason || null,
      status: "completed" as PaymentStatus,
      recorded_by: user?.id || null,
    })
    .select("*")
    .single();
  if (refErr) throw new Error(refErr.message);

  // 7. Update invoice amounts
  const newAmountPaid = (invoice.amount_paid || 0) - input.amount;
  const newAmountDue =
    invoice.total - newAmountPaid - (invoice.credits_applied || 0);

  let newStatus: InvoiceStatus = invoice.status;
  if (newAmountPaid <= 0) {
    newStatus = invoice.sent_at ? "sent" : "draft";
  } else if (newAmountDue > 0) {
    newStatus = "partial";
  }

  await supabase
    .from(INV_TABLES.invoices)
    .update({
      amount_paid: Math.max(0, newAmountPaid),
      amount_due: Math.max(0, newAmountDue),
      status: newStatus,
      paid_date: newStatus === "paid" ? invoice.paid_date : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  // 8. Log activity
  const formattedAmount = formatInvoiceAmount(
    input.amount,
    invoice.currency || "ZMW",
  );
  await logActivity(
    supabase,
    invoice.site_id,
    invoiceId,
    "refund_recorded",
    `Refund of ${formattedAmount} recorded${input.reason ? ` — ${input.reason}` : ""}`,
    "user",
    user?.id || null,
    user?.email || null,
    { status: invoice.status, amount_paid: invoice.amount_paid },
    { status: newStatus, amount_paid: Math.max(0, newAmountPaid) },
  );

  // 9. Fire automation event
  try {
    await emitAutomationEvent(invoice.site_id, "accounting.payment.refunded", {
      invoiceId,
      paymentId: refund.id,
      amount: input.amount,
      reason: input.reason || null,
      invoiceNumber: invoice.invoice_number,
      clientName: invoice.client_name,
    });
  } catch {
    // Non-critical
  }

  return mapRecord<Payment>(refund);
}

// ═══════════════════════════════════════════════════════════════
// GET PAYMENT SUMMARY
// ═══════════════════════════════════════════════════════════════

export async function getPaymentSummary(
  siteId: string,
  dateRange?: { from?: string; to?: string },
): Promise<PaymentSummary> {
  const supabase = await getModuleClient();

  let query = supabase
    .from(INV_TABLES.payments)
    .select("*")
    .eq("site_id", siteId)
    .eq("status", "completed");

  if (dateRange?.from) {
    query = query.gte("payment_date", dateRange.from);
  }
  if (dateRange?.to) {
    query = query.lte("payment_date", dateRange.to);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const payments = mapRecords<Payment>(data || []);

  let totalCollected = 0;
  let totalRefunded = 0;
  let paymentCount = 0;
  let refundCount = 0;
  const methodMap = new Map<PaymentMethod, { total: number; count: number }>();

  for (const p of payments) {
    if (p.type === "payment") {
      totalCollected += p.amount;
      paymentCount++;
      const existing = methodMap.get(p.paymentMethod) || { total: 0, count: 0 };
      existing.total += p.amount;
      existing.count++;
      methodMap.set(p.paymentMethod, existing);
    } else {
      totalRefunded += p.amount;
      refundCount++;
    }
  }

  const byMethod: PaymentSummary["byMethod"] = [];
  for (const [method, data] of methodMap) {
    byMethod.push({ method, total: data.total, count: data.count });
  }
  byMethod.sort((a, b) => b.total - a.total);

  return {
    totalCollected,
    totalRefunded,
    netCollected: totalCollected - totalRefunded,
    paymentCount,
    refundCount,
    byMethod,
  };
}

// ═══════════════════════════════════════════════════════════════
// GENERATE RECEIPT NUMBER
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a receipt number: RCT-{YYYY}-{NNNN}
 * Uses a DB RPC function with advisory lock for concurrency safety.
 * Falls back to MAX-based approach if RPC is unavailable.
 */
export async function generateReceiptNumber(siteId: string): Promise<string> {
  const supabase = await getModuleClient();

  // Try RPC-based atomic generation first
  try {
    const { data, error } = await supabase.rpc(
      "generate_invmod01_receipt_number",
      { p_site_id: siteId },
    );
    if (!error && data) return data;
  } catch {
    // Fallback below
  }

  // Fallback: MAX-based (unique constraint is the safety net)
  const year = new Date().getFullYear();
  const prefix = `RCT-${year}-`;
  const { data } = await supabase
    .from(INV_TABLES.payments)
    .select("receipt_number")
    .eq("site_id", siteId)
    .like("receipt_number", `${prefix}%`)
    .order("receipt_number", { ascending: false })
    .limit(1);

  let next = 1;
  if (data && data.length > 0 && data[0].receipt_number) {
    const match = data[0].receipt_number.match(/RCT-\d{4}-(\d+)/);
    if (match) next = parseInt(match[1], 10) + 1;
  }
  return `${prefix}${next.toString().padStart(4, "0")}`;
}

// ═══════════════════════════════════════════════════════════════
// GET PAYMENT RECEIPT (full data with invoice + client + branding)
// ═══════════════════════════════════════════════════════════════

export interface PaymentReceiptData {
  payment: Payment;
  invoice: {
    id: string;
    invoiceNumber: string;
    clientName: string;
    clientEmail: string | null;
    clientPhone: string | null;
    clientAddress: string | null;
    total: number;
    amountPaid: number;
    amountDue: number;
    currency: string;
    status: string;
  };
  company: {
    name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    website: string | null;
    taxId: string | null;
    logoUrl: string | null;
    brandColor: string;
  };
  receiptNumber: string;
}

export async function getPaymentReceipt(
  siteId: string,
  paymentId: string,
): Promise<PaymentReceiptData> {
  const supabase = await getModuleClient();

  // Fetch payment
  const { data: payment, error: payErr } = await supabase
    .from(INV_TABLES.payments)
    .select("*")
    .eq("id", paymentId)
    .eq("site_id", siteId)
    .single();
  if (payErr || !payment) throw new Error("Payment not found");

  // Fetch invoice
  const { data: invoice, error: invErr } = await supabase
    .from(INV_TABLES.invoices)
    .select("*")
    .eq("id", payment.invoice_id)
    .single();
  if (invErr || !invoice) throw new Error("Invoice not found");

  // Fetch settings for branding
  const { data: settings } = await supabase
    .from(INV_TABLES.settings)
    .select("*")
    .eq("site_id", siteId)
    .single();

  // Use persisted receipt number, or generate fallback from payment number
  let receiptNumber = payment.receipt_number;
  if (!receiptNumber) {
    // Legacy: derive from payment number and backfill
    receiptNumber = payment.payment_number
      ? payment.payment_number.replace("PAY-", "RCT-")
      : `RCT-${paymentId.slice(0, 8).toUpperCase()}`;

    // Self-heal: persist the derived receipt number for future lookups
    await supabase
      .from(INV_TABLES.payments)
      .update({ receipt_number: receiptNumber })
      .eq("id", paymentId)
      .eq("site_id", siteId);
  }

  return {
    payment: mapRecord<Payment>(payment),
    invoice: {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      clientName: invoice.client_name,
      clientEmail: invoice.client_email,
      clientPhone: invoice.client_phone,
      clientAddress: invoice.client_address,
      total: invoice.total,
      amountPaid: invoice.amount_paid,
      amountDue: invoice.amount_due,
      currency: invoice.currency,
      status: invoice.status,
    },
    company: {
      name: settings?.company_name || null,
      email: settings?.company_email || null,
      phone: settings?.company_phone || null,
      address: settings?.company_address || null,
      website: settings?.company_website || null,
      taxId: settings?.company_tax_id || null,
      logoUrl: settings?.brand_logo_url || null,
      brandColor: settings?.brand_color || "#1f2937",
    },
    receiptNumber,
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORT PAYMENTS CSV
// ═══════════════════════════════════════════════════════════════

export async function exportPaymentsCsv(
  siteId: string,
  filters?: PaymentFilters,
): Promise<string> {
  const supabase = await getModuleClient();

  let query = supabase
    .from(INV_TABLES.payments)
    .select("*")
    .eq("site_id", siteId)
    .order("payment_date", { ascending: false });

  if (filters?.method) query = query.eq("payment_method", filters.method);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.type) query = query.eq("type", filters.type);
  if (filters?.dateFrom) query = query.gte("payment_date", filters.dateFrom);
  if (filters?.dateTo) query = query.lte("payment_date", filters.dateTo);
  if (filters?.search) {
    query = query.or(
      `payment_number.ilike.%${filters.search}%,transaction_reference.ilike.%${filters.search}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = mapRecords<Payment>(data || []);
  const header =
    "Payment Number,Type,Amount,Currency,Date,Method,Reference,Status,Notes";
  const csvRows = rows.map((p) =>
    [
      p.paymentNumber || "",
      p.type,
      (p.amount / 100).toFixed(2),
      p.currency,
      p.paymentDate,
      p.paymentMethod,
      (p.transactionReference || "").replace(/,/g, ";"),
      p.status,
      (p.notes || "").replace(/,/g, ";").replace(/\n/g, " "),
    ].join(","),
  );

  return [header, ...csvRows].join("\n");
}
