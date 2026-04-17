"use server";

/**
 * Invoicing Module — CRM Integration Actions (INV-13)
 *
 * Cross-module integration between Invoicing and CRM.
 * Contact financial profiles and deal-to-invoice conversion.
 * All monetary amounts in CENTS (integers).
 */

import { createClient } from "@/lib/supabase/server";
import { INV_TABLES } from "../lib/invoicing-constants";
import type { Invoice } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as AnySupabase;
}

// ─── Types ─────────────────────────────────────────────────────

export interface ContactFinancialProfile {
  contactId: string;
  totalInvoiced: number; // CENTS
  totalPaid: number; // CENTS
  totalOutstanding: number; // CENTS
  totalCredits: number; // CENTS
  invoiceCount: number;
  averageDaysToPay: number;
  lastInvoiceDate: string | null;
  lastPaymentDate: string | null;
  recentInvoices: Pick<
    Invoice,
    "id" | "invoiceNumber" | "status" | "total" | "amountDue" | "dueDate"
  >[];
  recentPayments: {
    id: string;
    amount: number;
    method: string;
    paymentDate: string;
    invoiceNumber: string;
  }[];
  riskRating: "low" | "medium" | "high";
}

// ─── Contact Financial Profile ─────────────────────────────────

export async function getContactFinancialProfile(
  contactId: string,
): Promise<ContactFinancialProfile> {
  const supabase = await getModuleClient();

  // Get all invoices for this contact
  const { data: invoices } = await supabase
    .from(INV_TABLES.invoices)
    .select(
      "id, invoice_number, status, total, amount_paid, amount_due, due_date, issue_date, created_at",
    )
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });

  const allInvoices = invoices || [];

  const totalInvoiced = allInvoices.reduce(
    (sum: number, i: { total: number }) => sum + (i.total || 0),
    0,
  );
  const totalPaid = allInvoices.reduce(
    (sum: number, i: { amount_paid: number }) => sum + (i.amount_paid || 0),
    0,
  );
  const totalOutstanding = allInvoices.reduce(
    (sum: number, i: { amount_due: number }) => sum + (i.amount_due || 0),
    0,
  );

  // Get credit notes total
  const { data: credits } = await supabase
    .from(INV_TABLES.creditNotes)
    .select("total")
    .eq("contact_id", contactId);

  const totalCredits = (credits || []).reduce(
    (sum: number, c: { total: number }) => sum + (c.total || 0),
    0,
  );

  // Get payments for recent list
  const invoiceIds = allInvoices.slice(0, 20).map((i: { id: string }) => i.id);

  let recentPayments: ContactFinancialProfile["recentPayments"] = [];
  if (invoiceIds.length > 0) {
    const { data: payments } = await supabase
      .from(INV_TABLES.payments)
      .select("id, amount, method, payment_date, invoice_id")
      .in("invoice_id", invoiceIds)
      .order("payment_date", { ascending: false })
      .limit(5);

    const invoiceMap = new Map(
      allInvoices.map((i: { id: string; invoice_number: string }) => [
        i.id,
        i.invoice_number,
      ]),
    );

    recentPayments = (payments || []).map(
      (p: {
        id: string;
        amount: number;
        method: string;
        payment_date: string;
        invoice_id: string;
      }) => ({
        id: p.id,
        amount: p.amount,
        method: p.method || "unknown",
        paymentDate: p.payment_date,
        invoiceNumber: invoiceMap.get(p.invoice_id) || "",
      }),
    );
  }

  // Calculate average days to pay
  const paidInvoices = allInvoices.filter(
    (i: { status: string; amount_paid: number }) =>
      i.status === "paid" && i.amount_paid > 0,
  );

  let averageDaysToPay = 0;
  if (paidInvoices.length > 0) {
    // Use all payments to compute average days from issue to payment
    const { data: allPayments } = await supabase
      .from(INV_TABLES.payments)
      .select("payment_date, invoice_id")
      .in(
        "invoice_id",
        paidInvoices.map((i: { id: string }) => i.id),
      );

    if (allPayments && allPayments.length > 0) {
      const invoiceIssueMap = new Map<string, number>(
        paidInvoices.map(
          (i: { id: string; issue_date: string }) =>
            [i.id, new Date(i.issue_date).getTime()] as [string, number],
        ),
      );

      let totalDays = 0;
      let count = 0;
      for (const p of allPayments) {
        const pmt = p as { payment_date: string; invoice_id: string };
        const issueTime = invoiceIssueMap.get(pmt.invoice_id);
        if (issueTime) {
          const days =
            (new Date(pmt.payment_date).getTime() - issueTime) /
            (1000 * 60 * 60 * 24);
          if (days >= 0) {
            totalDays += days;
            count += 1;
          }
        }
      }
      averageDaysToPay = count > 0 ? Math.round(totalDays / count) : 0;
    }
  }

  // Risk rating
  const overdueInvoices = allInvoices.filter(
    (i: { status: string }) => i.status === "overdue",
  );
  const overdueCount = overdueInvoices.length;
  const overdueAmount = overdueInvoices.reduce(
    (sum: number, i: { amount_due: number }) => sum + (i.amount_due || 0),
    0,
  );

  let riskRating: "low" | "medium" | "high" = "low";
  if (overdueCount >= 3 || overdueAmount > 500000) {
    // > K5,000 outstanding
    riskRating = "high";
  } else if (overdueCount >= 1 || averageDaysToPay > 45) {
    riskRating = "medium";
  }

  // Recent invoices (last 5)
  const recentInvoices = allInvoices
    .slice(0, 5)
    .map(
      (i: {
        id: string;
        invoice_number: string;
        status: string;
        total: number;
        amount_due: number;
        due_date: string;
      }) => ({
        id: i.id,
        invoiceNumber: i.invoice_number,
        status: i.status,
        total: i.total,
        amountDue: i.amount_due,
        dueDate: i.due_date,
      }),
    );

  // Last dates
  const lastInvoiceDate =
    allInvoices.length > 0
      ? (allInvoices[0] as { created_at: string }).created_at
      : null;
  const lastPaymentDate =
    recentPayments.length > 0 ? recentPayments[0].paymentDate : null;

  return {
    contactId,
    totalInvoiced,
    totalPaid,
    totalOutstanding,
    totalCredits,
    invoiceCount: allInvoices.length,
    averageDaysToPay,
    lastInvoiceDate,
    lastPaymentDate,
    recentInvoices,
    recentPayments,
    riskRating,
  };
}

// ─── Create Invoice from Contact ───────────────────────────────

export async function createInvoiceFromContact(
  contactId: string,
  siteId: string,
): Promise<{ redirectUrl: string }> {
  // Redirect to invoice create page with contact pre-filled
  return {
    redirectUrl: `/dashboard/sites/${siteId}/invoicing/invoices/new?contactId=${contactId}`,
  };
}

// ─── Create Invoice from Deal ──────────────────────────────────

export async function createInvoiceFromDeal(
  dealId: string,
  siteId: string,
): Promise<{ redirectUrl: string }> {
  const supabase = await getModuleClient();

  // Get deal details
  const { data: deal } = await supabase
    .from("mod_crmmod01_deals")
    .select("id, name, value, contact_id, company_id, metadata")
    .eq("id", dealId)
    .single();

  if (!deal) {
    return { redirectUrl: `/dashboard/sites/${siteId}/invoicing/invoices/new` };
  }

  // Get contact details if available
  let contactName = "";
  let contactEmail = "";
  if (deal.contact_id) {
    const { data: contact } = await supabase
      .from("mod_crmmod01_contacts")
      .select("first_name, last_name, email")
      .eq("id", deal.contact_id)
      .single();

    if (contact) {
      contactName =
        `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
      contactEmail = contact.email || "";
    }
  }

  // Build redirect URL with pre-filled data
  const params = new URLSearchParams({
    sourceType: "crm_deal",
    sourceId: dealId,
  });

  if (deal.contact_id) params.set("contactId", deal.contact_id);
  if (deal.company_id) params.set("companyId", deal.company_id);
  if (contactName) params.set("clientName", contactName);
  if (contactEmail) params.set("clientEmail", contactEmail);
  if (deal.value) params.set("amount", String(deal.value));
  if (deal.name) params.set("reference", `Deal: ${deal.name}`);

  return {
    redirectUrl: `/dashboard/sites/${siteId}/invoicing/invoices/new?${params.toString()}`,
  };
}
