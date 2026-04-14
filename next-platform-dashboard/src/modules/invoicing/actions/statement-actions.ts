"use server";

/**
 * Invoicing Module - Statement & Portal Actions
 *
 * Phase INV-09: Client Portal — Invoice Viewing, Online Payment & Statements
 *
 * Server actions for generating client statements, portal data queries.
 * All amounts in CENTS.
 */

import { createClient } from "@/lib/supabase/server";
import { INV_TABLES } from "../lib/invoicing-constants";
import type { Invoice, Payment, CreditNote } from "../types";

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

// ─── Types ─────────────────────────────────────────────────────

export interface ClientBalance {
  totalInvoiced: number;
  totalPaid: number;
  totalCredits: number;
  outstanding: number;
  overdueAmount: number;
  overdueCount: number;
}

export interface StatementTransaction {
  date: string;
  type: "invoice" | "payment" | "credit";
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface ClientStatement {
  client: { name: string; email: string; address: string };
  period: { start: string; end: string };
  openingBalance: number;
  transactions: StatementTransaction[];
  closingBalance: number;
  totalInvoiced: number;
  totalPaid: number;
  totalCredits: number;
}

// ─── Statement Generation ──────────────────────────────────────

/**
 * Get a client statement of account for a period.
 * Computes running balance across invoices, payments, and credits.
 */
export async function getClientStatement(
  siteId: string,
  contactId: string,
  dateRange?: { start: string; end: string },
): Promise<ClientStatement> {
  const supabase = await getModuleClient();

  // Determine date range (default: last 12 months)
  const end = dateRange?.end || new Date().toISOString().split("T")[0];
  const startDefault = new Date();
  startDefault.setFullYear(startDefault.getFullYear() - 1);
  const start = dateRange?.start || startDefault.toISOString().split("T")[0];

  // Get client info from first invoice
  const { data: clientInvoice } = await supabase
    .from(INV_TABLES.invoices)
    .select("client_name, client_email, client_address")
    .eq("site_id", siteId)
    .eq("contact_id", contactId)
    .limit(1)
    .single();

  const client = {
    name: clientInvoice?.client_name || "Unknown",
    email: clientInvoice?.client_email || "",
    address: clientInvoice?.client_address || "",
  };

  // Get invoices before the period start for opening balance
  const { data: priorInvoices } = await supabase
    .from(INV_TABLES.invoices)
    .select("total, amount_paid, credits_applied")
    .eq("site_id", siteId)
    .eq("contact_id", contactId)
    .lt("issue_date", start)
    .not("status", "in", '("void","cancelled","draft")');

  let openingBalance = 0;
  for (const inv of priorInvoices || []) {
    openingBalance +=
      (inv.total || 0) - (inv.amount_paid || 0) - (inv.credits_applied || 0);
  }

  // Get invoices in period
  const { data: invoices } = await supabase
    .from(INV_TABLES.invoices)
    .select("id, invoice_number, issue_date, total, status, client_name")
    .eq("site_id", siteId)
    .eq("contact_id", contactId)
    .gte("issue_date", start)
    .lte("issue_date", end)
    .not("status", "in", '("void","cancelled","draft")')
    .order("issue_date", { ascending: true });

  const invoiceIds = (invoices || []).map((i: any) => i.id);

  // Get payments in period
  let payments: any[] = [];
  if (invoiceIds.length > 0) {
    const { data: paymentData } = await supabase
      .from(INV_TABLES.payments)
      .select("id, payment_number, payment_date, amount, invoice_id, status")
      .eq("site_id", siteId)
      .in("invoice_id", invoiceIds)
      .eq("status", "completed")
      .order("payment_date", { ascending: true });
    payments = paymentData || [];
  }

  // Get credits applied in period
  const { data: creditNotes } = await supabase
    .from(INV_TABLES.creditNotes)
    .select("id, credit_number, issue_date, total, status")
    .eq("site_id", siteId)
    .eq("contact_id", contactId)
    .gte("issue_date", start)
    .lte("issue_date", end)
    .not("status", "eq", "void")
    .order("issue_date", { ascending: true });

  // Build transaction list
  const transactions: StatementTransaction[] = [];

  for (const inv of invoices || []) {
    transactions.push({
      date: inv.issue_date,
      type: "invoice",
      reference: inv.invoice_number,
      description: `Invoice ${inv.invoice_number}`,
      debit: inv.total || 0,
      credit: 0,
      balance: 0,
    });
  }

  for (const pmt of payments) {
    transactions.push({
      date: pmt.payment_date,
      type: "payment",
      reference: pmt.payment_number || pmt.id.slice(0, 8),
      description: `Payment received`,
      debit: 0,
      credit: pmt.amount || 0,
      balance: 0,
    });
  }

  for (const cn of creditNotes || []) {
    transactions.push({
      date: cn.issue_date,
      type: "credit",
      reference: cn.credit_number,
      description: `Credit note ${cn.credit_number}`,
      debit: 0,
      credit: cn.total || 0,
      balance: 0,
    });
  }

  // Sort by date, then compute running balance
  transactions.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  let runningBalance = openingBalance;
  let totalInvoiced = 0;
  let totalPaid = 0;
  let totalCredits = 0;

  for (const tx of transactions) {
    runningBalance += tx.debit - tx.credit;
    tx.balance = runningBalance;
    if (tx.type === "invoice") totalInvoiced += tx.debit;
    if (tx.type === "payment") totalPaid += tx.credit;
    if (tx.type === "credit") totalCredits += tx.credit;
  }

  return {
    client,
    period: { start, end },
    openingBalance,
    transactions,
    closingBalance: runningBalance,
    totalInvoiced,
    totalPaid,
    totalCredits,
  };
}

/**
 * Get total balance for a client (outstanding, overdue, etc.)
 */
export async function getClientBalance(
  siteId: string,
  contactId: string,
): Promise<ClientBalance> {
  const supabase = await getModuleClient();

  const { data: invoices } = await supabase
    .from(INV_TABLES.invoices)
    .select("total, amount_paid, credits_applied, status, due_date")
    .eq("site_id", siteId)
    .eq("contact_id", contactId)
    .not("status", "in", '("void","cancelled","draft")');

  const { data: creditNotes } = await supabase
    .from(INV_TABLES.creditNotes)
    .select("amount_remaining")
    .eq("site_id", siteId)
    .eq("contact_id", contactId)
    .not("status", "eq", "void");

  let totalInvoiced = 0;
  let totalPaid = 0;
  let outstanding = 0;
  let overdueAmount = 0;
  let overdueCount = 0;
  const today = new Date().toISOString().split("T")[0];

  for (const inv of invoices || []) {
    const total = inv.total || 0;
    const paid = inv.amount_paid || 0;
    const credits = inv.credits_applied || 0;
    const due = total - paid - credits;
    totalInvoiced += total;
    totalPaid += paid;
    outstanding += due;
    if (due > 0 && inv.due_date && inv.due_date < today) {
      overdueAmount += due;
      overdueCount++;
    }
  }

  let totalCredits = 0;
  for (const cn of creditNotes || []) {
    totalCredits += cn.amount_remaining || 0;
  }

  return {
    totalInvoiced,
    totalPaid,
    totalCredits,
    outstanding,
    overdueAmount,
    overdueCount,
  };
}

// ─── Portal Queries ────────────────────────────────────────────

/**
 * Get invoices for a client's portal view.
 */
export async function getPortalInvoices(
  siteId: string,
  clientId: string,
  filters?: { status?: string; search?: string },
  pagination?: { page?: number; perPage?: number },
): Promise<{ invoices: any[]; total: number }> {
  const supabase = await getModuleClient();
  const page = pagination?.page || 1;
  const perPage = pagination?.perPage || 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from(INV_TABLES.invoices)
    .select("*", { count: "exact" })
    .eq("site_id", siteId)
    .eq("contact_id", clientId)
    .not("status", "in", '("draft","void","cancelled")')
    .order("issue_date", { ascending: false })
    .range(from, to);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    query = query.or(
      `invoice_number.ilike.%${filters.search}%,client_name.ilike.%${filters.search}%`,
    );
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return { invoices: data || [], total: count || 0 };
}

/**
 * Get payments for a client's portal view.
 */
export async function getPortalPayments(
  siteId: string,
  clientId: string,
  pagination?: { page?: number; perPage?: number },
): Promise<{ payments: any[]; total: number }> {
  const supabase = await getModuleClient();
  const page = pagination?.page || 1;
  const perPage = pagination?.perPage || 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  // Get invoice IDs for this client first
  const { data: invoices } = await supabase
    .from(INV_TABLES.invoices)
    .select("id")
    .eq("site_id", siteId)
    .eq("contact_id", clientId);

  const invoiceIds = (invoices || []).map((i: any) => i.id);
  if (invoiceIds.length === 0) return { payments: [], total: 0 };

  const { data, count, error } = await supabase
    .from(INV_TABLES.payments)
    .select("*", { count: "exact" })
    .in("invoice_id", invoiceIds)
    .eq("status", "completed")
    .order("payment_date", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return { payments: data || [], total: count || 0 };
}

/**
 * Get credit notes for a client's portal view.
 */
export async function getPortalCreditNotes(
  siteId: string,
  clientId: string,
  pagination?: { page?: number; perPage?: number },
): Promise<{ creditNotes: any[]; total: number }> {
  const supabase = await getModuleClient();
  const page = pagination?.page || 1;
  const perPage = pagination?.perPage || 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, count, error } = await supabase
    .from(INV_TABLES.creditNotes)
    .select("*", { count: "exact" })
    .eq("site_id", siteId)
    .eq("contact_id", clientId)
    .not("status", "eq", "void")
    .order("issue_date", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return { creditNotes: data || [], total: count || 0 };
}
