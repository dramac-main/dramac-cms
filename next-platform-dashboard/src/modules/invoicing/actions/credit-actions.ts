"use server";

import { createClient } from "@/lib/supabase/server";
import { INV_TABLES } from "../lib/invoicing-constants";
import {
  formatInvoiceAmount,
  calculateLineItemTotals,
} from "../lib/invoicing-utils";
import { generateNextDocumentNumber } from "../services/invoice-number-service";
import { emitAutomationEvent } from "@/modules/automation/lib/automation-engine";
import { mapRecord, mapRecords } from "@/lib/map-db-record";
import type {
  CreditNote,
  CreditNoteLineItem,
  CreditNoteStatus,
  CreditApplication,
  CreateCreditNoteInput,
  CreateCreditNoteLineItemInput,
} from "../types/credit-types";
import type { InvoiceActivity } from "../types/activity-types";
import type { InvoiceStatus } from "../types/invoice-types";

// ─── Helpers ───────────────────────────────────────────────────

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

async function logActivity(
  supabase: any,
  siteId: string,
  entityId: string,
  entityType: "credit_note" | "invoice",
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
    entity_type: entityType,
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

// ─── Filter / Pagination Types ─────────────────────────────────

export interface CreditNoteFilters {
  status?: CreditNoteStatus;
  contactId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreditNotePagination {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ═══════════════════════════════════════════════════════════════
// GET CREDIT NOTES (LIST)
// ═══════════════════════════════════════════════════════════════

export async function getCreditNotes(
  siteId: string,
  filters?: CreditNoteFilters,
  pagination?: CreditNotePagination,
): Promise<{ creditNotes: CreditNote[]; total: number }> {
  const supabase = await getModuleClient();
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;
  const sortBy = pagination?.sortBy ?? "created_at";
  const sortOrder = pagination?.sortOrder ?? "desc";

  let query = supabase
    .from(INV_TABLES.creditNotes)
    .select("*", { count: "exact" })
    .eq("site_id", siteId);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.contactId) {
    query = query.eq("contact_id", filters.contactId);
  }
  if (filters?.dateFrom) {
    query = query.gte("issue_date", filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte("issue_date", filters.dateTo);
  }
  if (filters?.search) {
    query = query.or(
      `credit_number.ilike.%${filters.search}%,client_name.ilike.%${filters.search}%`,
    );
  }

  query = query
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    creditNotes: mapRecords<CreditNote>(data || []),
    total: count || 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// GET CREDIT NOTE (DETAIL)
// ═══════════════════════════════════════════════════════════════

export async function getCreditNote(creditNoteId: string): Promise<
  | (CreditNote & {
      lineItems: CreditNoteLineItem[];
      applications: CreditApplication[];
      activity: InvoiceActivity[];
    })
  | null
> {
  const supabase = await getModuleClient();

  const { data: cn, error } = await supabase
    .from(INV_TABLES.creditNotes)
    .select("*")
    .eq("id", creditNoteId)
    .single();
  if (error) return null;

  // Fetch line items
  const { data: lineItems } = await supabase
    .from(INV_TABLES.creditNoteLineItems)
    .select("*")
    .eq("credit_note_id", creditNoteId)
    .order("sort_order", { ascending: true });

  // Fetch applications
  const { data: applications } = await supabase
    .from(INV_TABLES.creditApplications)
    .select("*")
    .eq("credit_note_id", creditNoteId)
    .order("applied_at", { ascending: false });

  // Fetch activity
  const { data: activity } = await supabase
    .from(INV_TABLES.invoiceActivity)
    .select("*")
    .eq("entity_type", "credit_note")
    .eq("entity_id", creditNoteId)
    .order("created_at", { ascending: false })
    .limit(50);

  const mapped = mapRecord<CreditNote>(cn);
  return {
    ...mapped,
    lineItems: mapRecords<CreditNoteLineItem>(lineItems || []),
    applications: mapRecords<CreditApplication>(applications || []),
    activity: mapRecords<InvoiceActivity>(activity || []),
  };
}

// ═══════════════════════════════════════════════════════════════
// CREATE CREDIT NOTE
// ═══════════════════════════════════════════════════════════════

export async function createCreditNote(
  siteId: string,
  input: CreateCreditNoteInput,
): Promise<CreditNote> {
  const supabase = await getModuleClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Generate credit note number
  const creditNumber = await generateNextDocumentNumber(siteId, "credit_note");

  // Compute line item totals
  const computedItems = input.lineItems.map((li, idx) => {
    const totals = calculateLineItemTotals(
      li.quantity,
      li.unitPrice,
      null,
      0,
      li.taxRateId ? 16 : 0, // default to 16% VAT if taxRateId provided
    );
    return { ...li, ...totals, sortOrder: li.sortOrder ?? idx };
  });

  const subtotal = computedItems.reduce((s, li) => s + li.subtotal, 0);
  const taxAmount = computedItems.reduce((s, li) => s + li.taxAmount, 0);
  const total = computedItems.reduce((s, li) => s + li.total, 0);

  // If taxRateId is provided on line items, resolve actual rate from DB
  // For now we compute from line items directly
  const today = new Date().toISOString().split("T")[0];

  const { data: cn, error } = await supabase
    .from(INV_TABLES.creditNotes)
    .insert({
      site_id: siteId,
      credit_number: creditNumber,
      status: "draft" as CreditNoteStatus,
      invoice_id: input.invoiceId || null,
      contact_id: input.contactId || null,
      company_id: input.companyId || null,
      client_name: input.clientName,
      client_email: input.clientEmail || null,
      currency: input.currency || "ZMW",
      issue_date: input.issueDate || today,
      reason: input.reason || null,
      subtotal,
      tax_amount: taxAmount,
      total,
      amount_applied: 0,
      amount_remaining: total,
      notes: input.notes || null,
      internal_notes: input.internalNotes || null,
      tags: input.tags || [],
      metadata: {},
      created_by: user?.id || null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  // Insert line items
  if (computedItems.length > 0) {
    const lineItemRows = computedItems.map((li) => ({
      credit_note_id: cn.id,
      item_id: li.itemId || null,
      sort_order: li.sortOrder,
      name: li.name,
      description: li.description || null,
      quantity: li.quantity,
      unit: li.unit || null,
      unit_price: li.unitPrice,
      tax_rate_id: li.taxRateId || null,
      tax_rate: li.taxRateId ? 16 : 0,
      tax_amount: li.taxAmount,
      subtotal: li.subtotal,
      total: li.total,
    }));

    await supabase.from(INV_TABLES.creditNoteLineItems).insert(lineItemRows);
  }

  // Log activity
  await logActivity(
    supabase,
    siteId,
    cn.id,
    "credit_note",
    "created",
    `Credit note ${creditNumber} created for ${input.clientName}`,
    "user",
    user?.id,
    user?.email,
  );

  return mapRecord<CreditNote>(cn);
}

// ═══════════════════════════════════════════════════════════════
// UPDATE CREDIT NOTE (DRAFT ONLY)
// ═══════════════════════════════════════════════════════════════

export async function updateCreditNote(
  creditNoteId: string,
  input: Partial<CreateCreditNoteInput>,
): Promise<CreditNote> {
  const supabase = await getModuleClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch existing
  const { data: existing, error: fetchErr } = await supabase
    .from(INV_TABLES.creditNotes)
    .select("*")
    .eq("id", creditNoteId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);
  if (existing.status !== "draft") {
    throw new Error("Only draft credit notes can be edited");
  }

  // Build update payload
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.invoiceId !== undefined)
    updatePayload.invoice_id = input.invoiceId || null;
  if (input.contactId !== undefined)
    updatePayload.contact_id = input.contactId || null;
  if (input.companyId !== undefined)
    updatePayload.company_id = input.companyId || null;
  if (input.clientName !== undefined)
    updatePayload.client_name = input.clientName;
  if (input.clientEmail !== undefined)
    updatePayload.client_email = input.clientEmail || null;
  if (input.currency !== undefined) updatePayload.currency = input.currency;
  if (input.issueDate !== undefined) updatePayload.issue_date = input.issueDate;
  if (input.reason !== undefined) updatePayload.reason = input.reason || null;
  if (input.notes !== undefined) updatePayload.notes = input.notes || null;
  if (input.internalNotes !== undefined)
    updatePayload.internal_notes = input.internalNotes || null;
  if (input.tags !== undefined) updatePayload.tags = input.tags;

  // Replace line items if provided
  if (input.lineItems && input.lineItems.length > 0) {
    // Delete existing line items
    await supabase
      .from(INV_TABLES.creditNoteLineItems)
      .delete()
      .eq("credit_note_id", creditNoteId);

    const computedItems = input.lineItems.map((li, idx) => {
      const totals = calculateLineItemTotals(
        li.quantity,
        li.unitPrice,
        null,
        0,
        li.taxRateId ? 16 : 0,
      );
      return { ...li, ...totals, sortOrder: li.sortOrder ?? idx };
    });

    const subtotal = computedItems.reduce((s, li) => s + li.subtotal, 0);
    const taxAmount = computedItems.reduce((s, li) => s + li.taxAmount, 0);
    const total = computedItems.reduce((s, li) => s + li.total, 0);

    updatePayload.subtotal = subtotal;
    updatePayload.tax_amount = taxAmount;
    updatePayload.total = total;
    updatePayload.amount_remaining = total;

    const lineItemRows = computedItems.map((li) => ({
      credit_note_id: creditNoteId,
      item_id: li.itemId || null,
      sort_order: li.sortOrder,
      name: li.name,
      description: li.description || null,
      quantity: li.quantity,
      unit: li.unit || null,
      unit_price: li.unitPrice,
      tax_rate_id: li.taxRateId || null,
      tax_rate: li.taxRateId ? 16 : 0,
      tax_amount: li.taxAmount,
      subtotal: li.subtotal,
      total: li.total,
    }));

    await supabase.from(INV_TABLES.creditNoteLineItems).insert(lineItemRows);
  }

  const { data: updated, error: updErr } = await supabase
    .from(INV_TABLES.creditNotes)
    .update(updatePayload)
    .eq("id", creditNoteId)
    .select("*")
    .single();
  if (updErr) throw new Error(updErr.message);

  await logActivity(
    supabase,
    existing.site_id,
    creditNoteId,
    "credit_note",
    "updated",
    `Credit note ${existing.credit_number} updated`,
    "user",
    user?.id,
    user?.email,
  );

  return mapRecord<CreditNote>(updated);
}

// ═══════════════════════════════════════════════════════════════
// DELETE CREDIT NOTE (DRAFT ONLY)
// ═══════════════════════════════════════════════════════════════

export async function deleteCreditNote(creditNoteId: string): Promise<void> {
  const supabase = await getModuleClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: existing, error: fetchErr } = await supabase
    .from(INV_TABLES.creditNotes)
    .select("*")
    .eq("id", creditNoteId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);
  if (existing.status !== "draft") {
    throw new Error("Only draft credit notes can be deleted");
  }

  // Delete line items first (FK cascade should handle this, but be explicit)
  await supabase
    .from(INV_TABLES.creditNoteLineItems)
    .delete()
    .eq("credit_note_id", creditNoteId);

  await supabase.from(INV_TABLES.creditNotes).delete().eq("id", creditNoteId);

  await logActivity(
    supabase,
    existing.site_id,
    creditNoteId,
    "credit_note",
    "deleted",
    `Credit note ${existing.credit_number} deleted`,
    "user",
    user?.id,
    user?.email,
  );
}

// ═══════════════════════════════════════════════════════════════
// ISSUE CREDIT NOTE (draft → issued)
// ═══════════════════════════════════════════════════════════════

export async function issueCreditNote(creditNoteId: string): Promise<void> {
  const supabase = await getModuleClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: cn, error: fetchErr } = await supabase
    .from(INV_TABLES.creditNotes)
    .select("*")
    .eq("id", creditNoteId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  if (cn.status !== "draft") {
    throw new Error("Only draft credit notes can be issued");
  }

  await supabase
    .from(INV_TABLES.creditNotes)
    .update({
      status: "issued",
      updated_at: new Date().toISOString(),
    })
    .eq("id", creditNoteId);

  await logActivity(
    supabase,
    cn.site_id,
    creditNoteId,
    "credit_note",
    "issued",
    `Credit note ${cn.credit_number} issued`,
    "user",
    user?.id,
    user?.email,
    { status: "draft" },
    { status: "issued" },
  );

  // Fire automation event
  try {
    await emitAutomationEvent(cn.site_id, "accounting.credit_note.issued", {
      creditNoteId,
      creditNumber: cn.credit_number,
      total: cn.total,
      clientName: cn.client_name,
    });
  } catch {
    // Non-blocking
  }

  // Auto-send credit note email
  try {
    const { autoSendCreditNoteEmail } =
      await import("../services/email-autosend-service");
    await autoSendCreditNoteEmail(cn.site_id, creditNoteId);
  } catch {
    // Non-blocking
  }
}

// ═══════════════════════════════════════════════════════════════
// APPLY CREDIT TO INVOICE
// ═══════════════════════════════════════════════════════════════

export async function applyCreditToInvoice(
  creditNoteId: string,
  invoiceId: string,
  amount: number,
): Promise<CreditApplication> {
  const supabase = await getModuleClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Validate credit note
  const { data: cn, error: cnErr } = await supabase
    .from(INV_TABLES.creditNotes)
    .select("*")
    .eq("id", creditNoteId)
    .single();
  if (cnErr) throw new Error(cnErr.message);

  if (cn.status !== "issued" && cn.status !== "partially_applied") {
    throw new Error("Credit note must be issued before applying");
  }

  // 2. Validate invoice
  const { data: invoice, error: invErr } = await supabase
    .from(INV_TABLES.invoices)
    .select("*")
    .eq("id", invoiceId)
    .single();
  if (invErr) throw new Error(invErr.message);

  const blockedStatuses: InvoiceStatus[] = ["void", "cancelled", "paid"];
  if (blockedStatuses.includes(invoice.status as InvoiceStatus)) {
    throw new Error(`Cannot apply credit to a ${invoice.status} invoice`);
  }

  // 3. Calculate actual amount
  const actualAmount = Math.min(
    amount,
    cn.amount_remaining,
    invoice.amount_due,
  );
  if (actualAmount <= 0) {
    throw new Error("No applicable credit amount");
  }

  // 4. Create credit application record
  const { data: application, error: appErr } = await supabase
    .from(INV_TABLES.creditApplications)
    .insert({
      credit_note_id: creditNoteId,
      invoice_id: invoiceId,
      amount: actualAmount,
      applied_at: new Date().toISOString(),
      applied_by: user?.id || null,
      notes: null,
    })
    .select("*")
    .single();
  if (appErr) throw new Error(appErr.message);

  // 5. Update credit note
  const newAmountApplied = (cn.amount_applied || 0) + actualAmount;
  const newAmountRemaining = (cn.amount_remaining || cn.total) - actualAmount;
  const newCNStatus: CreditNoteStatus =
    newAmountRemaining <= 0 ? "fully_applied" : "partially_applied";

  await supabase
    .from(INV_TABLES.creditNotes)
    .update({
      amount_applied: newAmountApplied,
      amount_remaining: Math.max(0, newAmountRemaining),
      status: newCNStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", creditNoteId);

  // 6. Update invoice
  const newCreditsApplied = (invoice.credits_applied || 0) + actualAmount;
  const newAmountDue = invoice.amount_due - actualAmount;

  let newInvoiceStatus: InvoiceStatus = invoice.status as InvoiceStatus;
  if (newAmountDue <= 0) {
    newInvoiceStatus = "paid";
  }

  const invoiceUpdate: Record<string, unknown> = {
    credits_applied: newCreditsApplied,
    amount_due: Math.max(0, newAmountDue),
    updated_at: new Date().toISOString(),
  };
  if (newInvoiceStatus !== invoice.status) {
    invoiceUpdate.status = newInvoiceStatus;
  }
  if (newInvoiceStatus === "paid") {
    invoiceUpdate.paid_date = new Date().toISOString().split("T")[0];
  }

  await supabase
    .from(INV_TABLES.invoices)
    .update(invoiceUpdate)
    .eq("id", invoiceId);

  // 7. Log activity on credit note
  const formattedAmt = formatInvoiceAmount(actualAmount, cn.currency || "ZMW");
  await logActivity(
    supabase,
    cn.site_id,
    creditNoteId,
    "credit_note",
    "applied",
    `${formattedAmt} applied to invoice ${invoice.invoice_number}`,
    "user",
    user?.id,
    user?.email,
    { status: cn.status, amount_applied: cn.amount_applied },
    { status: newCNStatus, amount_applied: newAmountApplied },
  );

  // 8. Log activity on invoice
  await logActivity(
    supabase,
    cn.site_id,
    invoiceId,
    "invoice",
    "credit_applied",
    `Credit note ${cn.credit_number} applied: ${formattedAmt}`,
    "user",
    user?.id,
    user?.email,
    {
      amount_due: invoice.amount_due,
      credits_applied: invoice.credits_applied,
    },
    {
      amount_due: Math.max(0, newAmountDue),
      credits_applied: newCreditsApplied,
    },
  );

  // 9. Fire automation event
  try {
    await emitAutomationEvent(cn.site_id, "accounting.credit_note.applied", {
      creditNoteId,
      invoiceId,
      amount: actualAmount,
      creditNumber: cn.credit_number,
      invoiceNumber: invoice.invoice_number,
      clientName: cn.client_name,
    });

    if (newInvoiceStatus === "paid" && invoice.status !== "paid") {
      await emitAutomationEvent(cn.site_id, "accounting.invoice.paid", {
        invoiceId,
        invoiceNumber: invoice.invoice_number,
        total: invoice.total,
        clientName: invoice.client_name,
      });
    }
  } catch {
    // Non-blocking
  }

  return mapRecord<CreditApplication>(application);
}

// ═══════════════════════════════════════════════════════════════
// VOID CREDIT NOTE (with reversal)
// ═══════════════════════════════════════════════════════════════

export async function voidCreditNote(
  creditNoteId: string,
  reason?: string,
): Promise<void> {
  const supabase = await getModuleClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: cn, error: fetchErr } = await supabase
    .from(INV_TABLES.creditNotes)
    .select("*")
    .eq("id", creditNoteId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  if (cn.status === "void") {
    throw new Error("Credit note is already void");
  }

  // Reverse all applications
  const { data: applications } = await supabase
    .from(INV_TABLES.creditApplications)
    .select("*")
    .eq("credit_note_id", creditNoteId);

  if (applications && applications.length > 0) {
    for (const app of applications) {
      // Reverse on invoices
      const { data: invoice } = await supabase
        .from(INV_TABLES.invoices)
        .select("*")
        .eq("id", app.invoice_id)
        .single();

      if (invoice) {
        const reversedCredits = Math.max(
          0,
          (invoice.credits_applied || 0) - app.amount,
        );
        const reversedAmountDue = invoice.amount_due + app.amount;

        // Recalculate status
        let reversedStatus: InvoiceStatus = invoice.status as InvoiceStatus;
        if (invoice.status === "paid") {
          if ((invoice.amount_paid || 0) > 0) {
            reversedStatus = "partial";
          } else {
            reversedStatus = "sent";
          }
        }

        await supabase
          .from(INV_TABLES.invoices)
          .update({
            credits_applied: reversedCredits,
            amount_due: reversedAmountDue,
            status: reversedStatus,
            paid_date: reversedStatus === "paid" ? invoice.paid_date : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", app.invoice_id);

        await logActivity(
          supabase,
          cn.site_id,
          app.invoice_id,
          "invoice",
          "credit_reversed",
          `Credit note ${cn.credit_number} voided — ${formatInvoiceAmount(app.amount, cn.currency || "ZMW")} reversed`,
          "system",
        );
      }
    }

    // Delete applications
    await supabase
      .from(INV_TABLES.creditApplications)
      .delete()
      .eq("credit_note_id", creditNoteId);
  }

  // Update credit note status
  await supabase
    .from(INV_TABLES.creditNotes)
    .update({
      status: "void" as CreditNoteStatus,
      amount_applied: 0,
      amount_remaining: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", creditNoteId);

  await logActivity(
    supabase,
    cn.site_id,
    creditNoteId,
    "credit_note",
    "voided",
    `Credit note ${cn.credit_number} voided${reason ? `: ${reason}` : ""}`,
    "user",
    user?.id,
    user?.email,
    { status: cn.status },
    { status: "void" },
  );

  // Fire automation event
  try {
    await emitAutomationEvent(cn.site_id, "accounting.credit_note.voided", {
      creditNoteId,
      creditNumber: cn.credit_number,
      total: cn.total,
      reason,
      clientName: cn.client_name,
    });
  } catch {
    // Non-blocking
  }
}

// ═══════════════════════════════════════════════════════════════
// GET CLIENT CREDIT BALANCE
// ═══════════════════════════════════════════════════════════════

export async function getClientCreditBalance(
  siteId: string,
  contactId: string,
): Promise<{
  totalIssued: number;
  totalApplied: number;
  available: number;
}> {
  const supabase = await getModuleClient();

  const { data: creditNotes } = await supabase
    .from(INV_TABLES.creditNotes)
    .select("total, amount_applied, amount_remaining, status")
    .eq("site_id", siteId)
    .eq("contact_id", contactId)
    .neq("status", "void")
    .neq("status", "draft");

  if (!creditNotes || creditNotes.length === 0) {
    return { totalIssued: 0, totalApplied: 0, available: 0 };
  }

  const totalIssued = creditNotes.reduce(
    (sum: number, cn: any) => sum + (cn.total || 0),
    0,
  );
  const totalApplied = creditNotes.reduce(
    (sum: number, cn: any) => sum + (cn.amount_applied || 0),
    0,
  );
  const available = creditNotes.reduce(
    (sum: number, cn: any) => sum + (cn.amount_remaining || 0),
    0,
  );

  return { totalIssued, totalApplied, available };
}
