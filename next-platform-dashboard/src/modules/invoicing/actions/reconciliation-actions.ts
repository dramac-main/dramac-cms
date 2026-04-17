"use server";

import { createClient } from "@/lib/supabase/server";
import { mapRecords } from "@/lib/map-db-record";
import { INV_TABLES } from "../lib/invoicing-constants";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import type { Payment } from "../types/payment-types";
import type { Invoice } from "../types/invoice-types";

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

// ─── Types ─────────────────────────────────────────────────────

export interface UnmatchedPayment {
  id: string;
  paymentNumber: string | null;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: string;
  transactionReference: string | null;
  notes: string | null;
  status: string;
  invoiceId: string;
  invoiceNumber: string | null;
}

export interface PartialInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  status: string;
  dueDate: string | null;
}

export interface ReconciliationSuggestion {
  paymentId: string;
  paymentNumber: string | null;
  paymentAmount: number;
  suggestedInvoiceId: string;
  suggestedInvoiceNumber: string;
  invoiceAmountDue: number;
  currency: string;
  confidence: "high" | "medium" | "low";
  reason: string;
}

// ─── Get Unmatched Payments ────────────────────────────────────

/**
 * Returns payments with status "pending" — these are submitted by clients
 * through the public form but not yet verified/matched.
 */
export async function getUnmatchedPayments(
  siteId: string,
): Promise<UnmatchedPayment[]> {
  const supabase = await getModuleClient();

  const { data: payments, error } = await supabase
    .from(INV_TABLES.payments)
    .select("*")
    .eq("site_id", siteId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  // Fetch related invoice numbers
  const invoiceIds = [
    ...new Set((payments || []).map((p: any) => p.invoice_id).filter(Boolean)),
  ];

  let invoiceMap: Record<string, string> = {};
  if (invoiceIds.length > 0) {
    const { data: invoices } = await supabase
      .from(INV_TABLES.invoices)
      .select("id, invoice_number")
      .in("id", invoiceIds);
    for (const inv of invoices || []) {
      invoiceMap[inv.id] = inv.invoice_number;
    }
  }

  const mapped = mapRecords<Payment>(payments || []);

  return mapped.map((p) => ({
    id: p.id,
    paymentNumber: p.paymentNumber,
    amount: p.amount,
    currency: p.currency,
    paymentDate: p.paymentDate,
    paymentMethod: p.paymentMethod,
    transactionReference: p.transactionReference,
    notes: p.notes,
    status: p.status,
    invoiceId: p.invoiceId,
    invoiceNumber: invoiceMap[p.invoiceId] || null,
  }));
}

// ─── Get Partially Paid Invoices ───────────────────────────────

export async function getPartialInvoices(
  siteId: string,
): Promise<PartialInvoice[]> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(INV_TABLES.invoices)
    .select("*")
    .eq("site_id", siteId)
    .in("status", ["partial", "sent", "viewed", "overdue"])
    .gt("amount_due", 0)
    .order("due_date", { ascending: true });

  if (error) throw new Error(error.message);

  const mapped = mapRecords<Invoice>(data || []);

  return mapped.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    clientName: inv.clientName,
    total: inv.total,
    amountPaid: inv.amountPaid || 0,
    amountDue: inv.amountDue,
    currency: inv.currency,
    status: inv.status,
    dueDate: inv.dueDate,
  }));
}

// ─── Match Payment to Invoice ──────────────────────────────────

/**
 * Verify a pending payment and mark it as completed.
 * Updates the invoice amounts accordingly.
 */
export async function matchPaymentToInvoice(
  siteId: string,
  paymentId: string,
  invoiceId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getModuleClient();

  // Fetch the pending payment
  const { data: payment, error: payErr } = await supabase
    .from(INV_TABLES.payments)
    .select("*")
    .eq("id", paymentId)
    .eq("site_id", siteId)
    .single();

  if (payErr || !payment) return { success: false, error: "Payment not found" };
  if (payment.status !== "pending")
    return { success: false, error: "Payment is not pending" };

  // Fetch the target invoice
  const { data: invoice, error: invErr } = await supabase
    .from(INV_TABLES.invoices)
    .select("*")
    .eq("id", invoiceId)
    .eq("site_id", siteId)
    .single();

  if (invErr || !invoice) return { success: false, error: "Invoice not found" };

  // Update the payment: link to invoice & mark completed
  const { error: updateErr } = await supabase
    .from(INV_TABLES.payments)
    .update({
      invoice_id: invoiceId,
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  if (updateErr) return { success: false, error: updateErr.message };

  // Update invoice amounts
  const newAmountPaid = (invoice.amount_paid || 0) + payment.amount;
  const newAmountDue =
    invoice.total - newAmountPaid - (invoice.credits_applied || 0);

  let newStatus = invoice.status;
  if (newAmountDue <= 0) {
    newStatus = "paid";
  } else if (newAmountPaid > 0) {
    newStatus = "partial";
  }

  await supabase
    .from(INV_TABLES.invoices)
    .update({
      amount_paid: newAmountPaid,
      amount_due: Math.max(0, newAmountDue),
      status: newStatus,
      paid_date:
        newStatus === "paid" ? new Date().toISOString().split("T")[0] : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  // Log activity
  const formattedAmount = formatInvoiceAmount(
    payment.amount,
    payment.currency || "ZMW",
  );
  await supabase.from(INV_TABLES.invoiceActivity).insert({
    site_id: siteId,
    entity_type: "invoice",
    entity_id: invoiceId,
    action: "payment_reconciled",
    description: `Payment ${payment.payment_number} of ${formattedAmount} reconciled and verified`,
    actor_type: "user",
  });

  return { success: true };
}

// ─── Reconciliation Suggestions ────────────────────────────────

/**
 * Smart matching: suggest which pending payments likely match which invoices
 * based on amount matching.
 */
export async function getReconciliationSuggestions(
  siteId: string,
): Promise<ReconciliationSuggestion[]> {
  const supabase = await getModuleClient();

  // Get pending payments
  const { data: pendingPayments } = await supabase
    .from(INV_TABLES.payments)
    .select("*")
    .eq("site_id", siteId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (!pendingPayments || pendingPayments.length === 0) return [];

  // Get unpaid invoices
  const { data: unpaidInvoices } = await supabase
    .from(INV_TABLES.invoices)
    .select("*")
    .eq("site_id", siteId)
    .in("status", ["sent", "viewed", "partial", "overdue"])
    .gt("amount_due", 0);

  if (!unpaidInvoices || unpaidInvoices.length === 0) return [];

  const suggestions: ReconciliationSuggestion[] = [];

  for (const payment of pendingPayments) {
    // Try exact amount match first
    const exactMatch = unpaidInvoices.find(
      (inv: any) => inv.amount_due === payment.amount,
    );

    if (exactMatch) {
      suggestions.push({
        paymentId: payment.id,
        paymentNumber: payment.payment_number,
        paymentAmount: payment.amount,
        suggestedInvoiceId: exactMatch.id,
        suggestedInvoiceNumber: exactMatch.invoice_number,
        invoiceAmountDue: exactMatch.amount_due,
        currency: payment.currency,
        confidence: "high",
        reason: "Exact amount match",
      });
      continue;
    }

    // Try total amount match
    const totalMatch = unpaidInvoices.find(
      (inv: any) => inv.total === payment.amount,
    );

    if (totalMatch) {
      suggestions.push({
        paymentId: payment.id,
        paymentNumber: payment.payment_number,
        paymentAmount: payment.amount,
        suggestedInvoiceId: totalMatch.id,
        suggestedInvoiceNumber: totalMatch.invoice_number,
        invoiceAmountDue: totalMatch.amount_due,
        currency: payment.currency,
        confidence: "medium",
        reason: "Matches invoice total",
      });
      continue;
    }

    // Try closest amount match (within 5%)
    let bestMatch: any = null;
    let bestDiff = Infinity;
    for (const inv of unpaidInvoices) {
      const diff = Math.abs(inv.amount_due - payment.amount);
      const threshold = inv.amount_due * 0.05;
      if (diff < threshold && diff < bestDiff) {
        bestDiff = diff;
        bestMatch = inv;
      }
    }

    if (bestMatch) {
      suggestions.push({
        paymentId: payment.id,
        paymentNumber: payment.payment_number,
        paymentAmount: payment.amount,
        suggestedInvoiceId: bestMatch.id,
        suggestedInvoiceNumber: bestMatch.invoice_number,
        invoiceAmountDue: bestMatch.amount_due,
        currency: payment.currency,
        confidence: "low",
        reason: "Approximate amount match (within 5%)",
      });
    }
  }

  return suggestions;
}
