"use server";

import { createClient } from "@/lib/supabase/server";
import { INV_TABLES } from "../lib/invoicing-constants";
import {
  calculateLineItemTotals,
  calculateInvoiceTotals,
} from "../lib/invoicing-utils";
import { generateNextDocumentNumber } from "../services/invoice-number-service";
import { emitAutomationEvent } from "@/modules/automation/lib/automation-engine";
import type {
  RecurringInvoice,
  RecurringLineItem,
  RecurringFrequency,
  RecurringStatus,
  CreateRecurringInput,
  CreateRecurringLineItemInput,
} from "../types/recurring-types";
import type { Invoice, InvoiceLineItem } from "../types/invoice-types";

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
) {
  await supabase.from(INV_TABLES.invoiceActivity).insert({
    site_id: siteId,
    entity_type: "recurring_invoice",
    entity_id: entityId,
    action,
    description,
    actor_type: actorType,
    actor_id: actorId || null,
    actor_name: actorName || null,
    old_value: null,
    new_value: null,
  });
}

function computeRecurringLineItem(
  item: CreateRecurringLineItemInput,
  index: number,
) {
  const totals = calculateLineItemTotals(
    item.quantity,
    item.unitPrice,
    item.discountType || null,
    item.discountValue || 0,
    0, // tax_rate resolved at generation time if needed
  );
  return {
    item_id: item.itemId || null,
    sort_order: item.sortOrder ?? index,
    name: item.name,
    description: item.description || null,
    quantity: item.quantity,
    unit: item.unit || null,
    unit_price: item.unitPrice,
    discount_type: item.discountType || null,
    discount_value: item.discountValue || 0,
    tax_rate_id: item.taxRateId || null,
    tax_rate: 0,
  };
}

/**
 * Calculate the next generation date based on frequency.
 */
export function calculateNextDate(
  currentDate: string,
  frequency: RecurringFrequency,
  customIntervalDays?: number | null,
): string {
  const date = new Date(currentDate);

  switch (frequency) {
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "biweekly":
      date.setDate(date.getDate() + 14);
      break;
    case "monthly": {
      const day = date.getDate();
      date.setMonth(date.getMonth() + 1);
      // Handle months with fewer days (e.g., Jan 31 -> Feb 28)
      if (date.getDate() !== day) {
        date.setDate(0); // Last day of previous month
      }
      break;
    }
    case "quarterly": {
      const qDay = date.getDate();
      date.setMonth(date.getMonth() + 3);
      if (date.getDate() !== qDay) {
        date.setDate(0);
      }
      break;
    }
    case "semi_annually": {
      const sDay = date.getDate();
      date.setMonth(date.getMonth() + 6);
      if (date.getDate() !== sDay) {
        date.setDate(0);
      }
      break;
    }
    case "annually": {
      const aDay = date.getDate();
      date.setFullYear(date.getFullYear() + 1);
      if (date.getDate() !== aDay) {
        date.setDate(0);
      }
      break;
    }
    case "custom":
      date.setDate(date.getDate() + (customIntervalDays || 30));
      break;
  }

  return date.toISOString().split("T")[0];
}

// ─── Filter / Pagination Types ─────────────────────────────────

export interface RecurringFilters {
  status?: RecurringStatus | RecurringStatus[];
  search?: string;
  frequency?: RecurringFrequency;
}

export interface RecurringPagination {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ═══════════════════════════════════════════════════════════════
// GET RECURRING INVOICES (paginated + filters)
// ═══════════════════════════════════════════════════════════════

export async function getRecurringInvoices(
  siteId: string,
  filters?: RecurringFilters,
  pagination?: RecurringPagination,
): Promise<{ recurring: RecurringInvoice[]; total: number }> {
  const supabase = await getModuleClient();
  const page = pagination?.page || 1;
  const pageSize = pagination?.pageSize || 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sortBy = pagination?.sortBy || "created_at";
  const sortOrder = pagination?.sortOrder === "asc";

  let query = supabase
    .from(INV_TABLES.recurringInvoices)
    .select("*", { count: "exact" })
    .eq("site_id", siteId);

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in("status", filters.status);
    } else {
      query = query.eq("status", filters.status);
    }
  }

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,client_name.ilike.%${filters.search}%,client_email.ilike.%${filters.search}%`,
    );
  }

  if (filters?.frequency) {
    query = query.eq("frequency", filters.frequency);
  }

  query = query.order(sortBy, { ascending: sortOrder }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    recurring: (data || []) as RecurringInvoice[],
    total: count || 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// GET RECURRING INVOICE (single with line items + generated invoices)
// ═══════════════════════════════════════════════════════════════

export async function getRecurringInvoice(recurringId: string): Promise<
  RecurringInvoice & {
    lineItems: RecurringLineItem[];
    generatedInvoices: Invoice[];
  }
> {
  const supabase = await getModuleClient();

  const { data: recurring, error } = await supabase
    .from(INV_TABLES.recurringInvoices)
    .select("*")
    .eq("id", recurringId)
    .single();

  if (error) throw new Error(error.message);

  // Fetch line items
  const { data: lineItems } = await supabase
    .from(INV_TABLES.recurringLineItems)
    .select("*")
    .eq("recurring_invoice_id", recurringId)
    .order("sort_order", { ascending: true });

  // Fetch generated invoices (linked via source_type + source_id)
  const { data: generatedInvoices } = await supabase
    .from(INV_TABLES.invoices)
    .select("*")
    .eq("source_type", "recurring")
    .eq("source_id", recurringId)
    .order("created_at", { ascending: false });

  return {
    ...(recurring as RecurringInvoice),
    lineItems: (lineItems || []) as RecurringLineItem[],
    generatedInvoices: (generatedInvoices || []) as Invoice[],
  };
}

// ═══════════════════════════════════════════════════════════════
// CREATE RECURRING INVOICE
// ═══════════════════════════════════════════════════════════════

export async function createRecurringInvoice(
  siteId: string,
  input: CreateRecurringInput,
): Promise<RecurringInvoice> {
  const supabase = await getModuleClient();

  if (!input.lineItems || input.lineItems.length === 0) {
    throw new Error("Recurring invoice must have at least one line item");
  }

  if (input.frequency === "custom" && !input.customIntervalDays) {
    throw new Error("Custom frequency requires custom_interval_days");
  }

  // Compute line item totals for template
  const computedItems = input.lineItems.map((item, idx) =>
    computeRecurringLineItem(item, idx),
  );
  const invoiceTotals = calculateInvoiceTotals(
    computedItems.map((i) => {
      const t = calculateLineItemTotals(
        i.quantity,
        i.unit_price,
        i.discount_type,
        i.discount_value,
        i.tax_rate,
      );
      return {
        subtotal: t.subtotal,
        discountAmount: t.discountAmount,
        taxAmount: t.taxAmount,
        total: t.total,
      };
    }),
    null,
    0,
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: recurring, error } = await supabase
    .from(INV_TABLES.recurringInvoices)
    .insert({
      site_id: siteId,
      name: input.name,
      status: "active" as RecurringStatus,
      contact_id: input.contactId || null,
      company_id: input.companyId || null,
      storefront_customer_id: input.storefrontCustomerId || null,
      client_name: input.clientName,
      client_email: input.clientEmail || null,
      client_address: input.clientAddress || null,
      currency: input.currency || "ZMW",
      frequency: input.frequency,
      custom_interval_days: input.customIntervalDays || null,
      start_date: input.startDate,
      end_date: input.endDate || null,
      next_generate_date: input.startDate,
      max_occurrences: input.maxOccurrences || null,
      occurrences_generated: 0,
      auto_send: input.autoSend ?? true,
      payment_terms_days: input.paymentTermsDays || 30,
      notes: input.notes || null,
      terms: input.terms || null,
      subtotal: invoiceTotals.subtotal,
      tax_amount: invoiceTotals.taxAmount,
      total: invoiceTotals.total,
      tags: input.tags || [],
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Insert line items
  if (computedItems.length > 0) {
    const { error: liError } = await supabase
      .from(INV_TABLES.recurringLineItems)
      .insert(
        computedItems.map((item) => ({
          ...item,
          recurring_invoice_id: recurring.id,
        })),
      );
    if (liError) throw new Error(liError.message);
  }

  await logActivity(
    supabase,
    siteId,
    recurring.id,
    "created",
    `Recurring invoice "${input.name}" created (${input.frequency})`,
    "user",
    user?.id,
    user?.email,
  );

  try {
    await emitAutomationEvent(siteId, "accounting.recurring_invoice.created", {
      id: recurring.id,
      name: input.name,
      clientName: input.clientName,
      frequency: input.frequency,
      total: invoiceTotals.total,
      currency: input.currency || "ZMW",
    });
  } catch {
    // Automation module may not be installed
  }

  return recurring as RecurringInvoice;
}

// ═══════════════════════════════════════════════════════════════
// UPDATE RECURRING INVOICE
// ═══════════════════════════════════════════════════════════════

export async function updateRecurringInvoice(
  recurringId: string,
  input: Partial<CreateRecurringInput>,
): Promise<RecurringInvoice> {
  const supabase = await getModuleClient();

  const { data: existing, error: fetchErr } = await supabase
    .from(INV_TABLES.recurringInvoices)
    .select("*")
    .eq("id", recurringId)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);

  if (existing.status === "completed" || existing.status === "cancelled") {
    throw new Error(`Cannot edit a ${existing.status} recurring invoice`);
  }

  const dbFields: Record<string, unknown> = {};
  const fieldMap: Record<string, string> = {
    name: "name",
    contactId: "contact_id",
    companyId: "company_id",
    storefrontCustomerId: "storefront_customer_id",
    clientName: "client_name",
    clientEmail: "client_email",
    clientAddress: "client_address",
    currency: "currency",
    frequency: "frequency",
    customIntervalDays: "custom_interval_days",
    startDate: "start_date",
    endDate: "end_date",
    maxOccurrences: "max_occurrences",
    autoSend: "auto_send",
    paymentTermsDays: "payment_terms_days",
    notes: "notes",
    terms: "terms",
    tags: "tags",
  };

  for (const [key, value] of Object.entries(input)) {
    if (key === "lineItems") continue;
    const dbKey = fieldMap[key];
    if (dbKey && value !== undefined) {
      dbFields[dbKey] = value;
    }
  }

  // If line items updated, recalculate totals
  if (input.lineItems && input.lineItems.length > 0) {
    const computedItems = input.lineItems.map((item, idx) =>
      computeRecurringLineItem(item, idx),
    );
    const invoiceTotals = calculateInvoiceTotals(
      computedItems.map((i) => {
        const t = calculateLineItemTotals(
          i.quantity,
          i.unit_price,
          i.discount_type,
          i.discount_value,
          i.tax_rate,
        );
        return {
          subtotal: t.subtotal,
          discountAmount: t.discountAmount,
          taxAmount: t.taxAmount,
          total: t.total,
        };
      }),
      null,
      0,
    );

    dbFields.subtotal = invoiceTotals.subtotal;
    dbFields.tax_amount = invoiceTotals.taxAmount;
    dbFields.total = invoiceTotals.total;

    // Replace line items
    await supabase
      .from(INV_TABLES.recurringLineItems)
      .delete()
      .eq("recurring_invoice_id", recurringId);

    const { error: liError } = await supabase
      .from(INV_TABLES.recurringLineItems)
      .insert(
        computedItems.map((item) => ({
          ...item,
          recurring_invoice_id: recurringId,
        })),
      );
    if (liError) throw new Error(liError.message);
  }

  dbFields.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from(INV_TABLES.recurringInvoices)
    .update(dbFields)
    .eq("id", recurringId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logActivity(
    supabase,
    existing.site_id,
    recurringId,
    "updated",
    `Recurring invoice "${updated.name}" updated`,
  );

  return updated as RecurringInvoice;
}

// ═══════════════════════════════════════════════════════════════
// DELETE RECURRING INVOICE
// ═══════════════════════════════════════════════════════════════

export async function deleteRecurringInvoice(
  recurringId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  const { data: existing, error: fetchErr } = await supabase
    .from(INV_TABLES.recurringInvoices)
    .select("id, site_id, name")
    .eq("id", recurringId)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);

  // Line items cascade-delete via FK
  const { error } = await supabase
    .from(INV_TABLES.recurringInvoices)
    .delete()
    .eq("id", recurringId);

  if (error) throw new Error(error.message);

  await logActivity(
    supabase,
    existing.site_id,
    recurringId,
    "deleted",
    `Recurring invoice "${existing.name}" deleted`,
    "user",
  );
}

// ═══════════════════════════════════════════════════════════════
// PAUSE RECURRING INVOICE
// ═══════════════════════════════════════════════════════════════

export async function pauseRecurringInvoice(
  recurringId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  const { data: existing, error: fetchErr } = await supabase
    .from(INV_TABLES.recurringInvoices)
    .select("*")
    .eq("id", recurringId)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);

  if (existing.status !== "active") {
    throw new Error("Can only pause active recurring invoices");
  }

  const { error } = await supabase
    .from(INV_TABLES.recurringInvoices)
    .update({
      status: "paused",
      updated_at: new Date().toISOString(),
    })
    .eq("id", recurringId);

  if (error) throw new Error(error.message);

  await logActivity(
    supabase,
    existing.site_id,
    recurringId,
    "paused",
    `Recurring invoice "${existing.name}" paused`,
  );
}

// ═══════════════════════════════════════════════════════════════
// RESUME RECURRING INVOICE
// ═══════════════════════════════════════════════════════════════

export async function resumeRecurringInvoice(
  recurringId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  const { data: existing, error: fetchErr } = await supabase
    .from(INV_TABLES.recurringInvoices)
    .select("*")
    .eq("id", recurringId)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);

  if (existing.status !== "paused") {
    throw new Error("Can only resume paused recurring invoices");
  }

  // If next_generate_date is in the past, set to today
  const today = new Date().toISOString().split("T")[0];
  const nextDate =
    existing.next_generate_date < today ? today : existing.next_generate_date;

  const { error } = await supabase
    .from(INV_TABLES.recurringInvoices)
    .update({
      status: "active",
      next_generate_date: nextDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", recurringId);

  if (error) throw new Error(error.message);

  await logActivity(
    supabase,
    existing.site_id,
    recurringId,
    "resumed",
    `Recurring invoice "${existing.name}" resumed`,
  );
}

// ═══════════════════════════════════════════════════════════════
// GENERATE NOW (manual trigger)
// ═══════════════════════════════════════════════════════════════

export async function generateNow(recurringId: string): Promise<Invoice> {
  const supabase = await getModuleClient();

  const { data: recurring, error: fetchErr } = await supabase
    .from(INV_TABLES.recurringInvoices)
    .select("*")
    .eq("id", recurringId)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);

  if (recurring.status === "completed" || recurring.status === "cancelled") {
    throw new Error(
      `Cannot generate from a ${recurring.status} recurring invoice`,
    );
  }

  // Fetch template line items
  const { data: templateItems } = await supabase
    .from(INV_TABLES.recurringLineItems)
    .select("*")
    .eq("recurring_invoice_id", recurringId)
    .order("sort_order", { ascending: true });

  if (!templateItems || templateItems.length === 0) {
    throw new Error("Recurring invoice has no line items");
  }

  const invoice = await generateInvoiceFromTemplate(
    supabase,
    recurring,
    templateItems,
  );

  // Update recurring invoice state
  const nextDate = calculateNextDate(
    new Date().toISOString().split("T")[0],
    recurring.frequency,
    recurring.custom_interval_days,
  );
  const newOccurrences = (recurring.occurrences_generated || 0) + 1;
  const isCompleted =
    recurring.max_occurrences && newOccurrences >= recurring.max_occurrences;

  await supabase
    .from(INV_TABLES.recurringInvoices)
    .update({
      next_generate_date: nextDate,
      occurrences_generated: newOccurrences,
      last_generated_at: new Date().toISOString(),
      status: isCompleted ? "completed" : recurring.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", recurringId);

  await logActivity(
    supabase,
    recurring.site_id,
    recurringId,
    "generated",
    `Invoice ${invoice.invoiceNumber} generated manually from recurring "${recurring.name}"`,
  );

  return invoice as Invoice;
}

// ═══════════════════════════════════════════════════════════════
// GET UPCOMING GENERATIONS
// ═══════════════════════════════════════════════════════════════

export async function getUpcomingGenerations(
  recurringId: string,
  count: number = 10,
): Promise<string[]> {
  const supabase = await getModuleClient();

  const { data: recurring, error } = await supabase
    .from(INV_TABLES.recurringInvoices)
    .select(
      "next_generate_date, frequency, custom_interval_days, end_date, max_occurrences, occurrences_generated, status",
    )
    .eq("id", recurringId)
    .single();

  if (error) throw new Error(error.message);

  if (recurring.status === "completed" || recurring.status === "cancelled") {
    return [];
  }

  const dates: string[] = [];
  let currentDate = recurring.next_generate_date;
  let occurrences = recurring.occurrences_generated || 0;

  for (let i = 0; i < count; i++) {
    // Check end date
    if (recurring.end_date && currentDate > recurring.end_date) break;
    // Check max occurrences
    if (
      recurring.max_occurrences &&
      occurrences + i >= recurring.max_occurrences
    )
      break;

    dates.push(currentDate);
    currentDate = calculateNextDate(
      currentDate,
      recurring.frequency,
      recurring.custom_interval_days,
    );
  }

  return dates;
}

// ═══════════════════════════════════════════════════════════════
// INTERNAL: Generate Invoice from Recurring Template
// ═══════════════════════════════════════════════════════════════

async function generateInvoiceFromTemplate(
  supabase: any,
  recurring: any,
  templateItems: any[],
): Promise<Invoice> {
  // Generate invoice number
  const invoiceNumber = await generateNextDocumentNumber(
    recurring.site_id,
    "invoice",
  );

  // Compute line items
  const computedItems = templateItems.map((item: any, idx: number) => {
    const totals = calculateLineItemTotals(
      Number(item.quantity),
      item.unit_price,
      item.discount_type || null,
      item.discount_value || 0,
      item.tax_rate || 0,
    );
    return {
      item_id: item.item_id || null,
      sort_order: item.sort_order ?? idx,
      name: item.name,
      description: item.description || null,
      quantity: Number(item.quantity),
      unit: item.unit || null,
      unit_price: item.unit_price,
      discount_type: item.discount_type || null,
      discount_value: item.discount_value || 0,
      discount_amount: totals.discountAmount,
      tax_rate_id: item.tax_rate_id || null,
      tax_rate: item.tax_rate || 0,
      tax_amount: totals.taxAmount,
      subtotal: totals.subtotal,
      total: totals.total,
    };
  });

  const invoiceTotals = calculateInvoiceTotals(
    computedItems.map((i) => ({
      subtotal: i.subtotal,
      discountAmount: i.discount_amount,
      taxAmount: i.tax_amount,
      total: i.total,
    })),
    recurring.discount_type || null,
    recurring.discount_value || 0,
  );

  const today = new Date().toISOString().split("T")[0];
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (recurring.payment_terms_days || 30));

  const viewToken = crypto.randomUUID();
  const paymentToken = crypto.randomUUID();

  // Insert invoice
  const { data: invoice, error } = await supabase
    .from(INV_TABLES.invoices)
    .insert({
      site_id: recurring.site_id,
      invoice_number: invoiceNumber,
      status: "draft",
      contact_id: recurring.contact_id || null,
      company_id: recurring.company_id || null,
      storefront_customer_id: recurring.storefront_customer_id || null,
      client_name: recurring.client_name,
      client_email: recurring.client_email || null,
      client_address: recurring.client_address || null,
      currency: recurring.currency || "ZMW",
      exchange_rate: 1,
      issue_date: today,
      due_date: dueDate.toISOString().split("T")[0],
      payment_terms: `Net ${recurring.payment_terms_days || 30}`,
      subtotal: invoiceTotals.subtotal,
      discount_type: recurring.discount_type || null,
      discount_value: recurring.discount_value || 0,
      discount_amount: invoiceTotals.discountAmount,
      tax_amount: invoiceTotals.taxAmount,
      total: invoiceTotals.total,
      amount_paid: 0,
      amount_due: invoiceTotals.total,
      credits_applied: 0,
      deposit_amount: 0,
      deposit_paid: false,
      notes: recurring.notes || null,
      terms: recurring.terms || null,
      source_type: "recurring",
      source_id: recurring.id,
      view_token: viewToken,
      payment_token: paymentToken,
      tags: recurring.tags || [],
      created_by: recurring.created_by || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Insert line items
  if (computedItems.length > 0) {
    const { error: liError } = await supabase
      .from(INV_TABLES.invoiceLineItems)
      .insert(
        computedItems.map((item) => ({
          ...item,
          invoice_id: invoice.id,
        })),
      );
    if (liError) throw new Error(liError.message);
  }

  // Log activity on the generated invoice
  await supabase.from(INV_TABLES.invoiceActivity).insert({
    site_id: recurring.site_id,
    entity_type: "invoice",
    entity_id: invoice.id,
    action: "created",
    description: `Invoice ${invoiceNumber} auto-generated from recurring "${recurring.name}"`,
    actor_type: "system",
    actor_id: null,
    actor_name: "Recurring Engine",
    old_value: null,
    new_value: null,
  });

  // Auto-send if configured
  if (recurring.auto_send && recurring.client_email) {
    try {
      const { sendInvoice } = await import("./invoice-actions");
      await sendInvoice(invoice.id);
    } catch {
      // Email failure should not block generation
    }
  }

  // Fire automation event
  try {
    await emitAutomationEvent(recurring.site_id, "accounting.invoice.created", {
      id: invoice.id,
      invoiceNumber,
      clientName: recurring.client_name,
      total: invoiceTotals.total,
      currency: recurring.currency || "ZMW",
      status: recurring.auto_send ? "sent" : "draft",
      source: "recurring",
      recurringId: recurring.id,
      recurringName: recurring.name,
    });
  } catch {
    // Automation module may not be installed
  }

  return invoice as Invoice;
}

// ═══════════════════════════════════════════════════════════════
// EXPORT: generateInvoiceFromTemplate for use by engine service
// ═══════════════════════════════════════════════════════════════

export { generateInvoiceFromTemplate as _generateInvoiceFromTemplate };
