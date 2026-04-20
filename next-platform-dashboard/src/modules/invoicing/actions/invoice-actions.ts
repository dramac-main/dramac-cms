"use server";

import { createClient } from "@/lib/supabase/server";
import { mapRecord, mapRecords } from "@/lib/map-db-record";
import {
  INV_TABLES,
  VALID_INVOICE_TRANSITIONS,
} from "../lib/invoicing-constants";
import {
  calculateLineItemTotals,
  calculateInvoiceTotals,
  isValidInvoiceTransition,
} from "../lib/invoicing-utils";
import { generateNextDocumentNumber } from "../services/invoice-number-service";
import type {
  Invoice,
  InvoiceWithItems,
  InvoiceLineItem,
  InvoiceStatus,
  InvoiceSourceType,
  DiscountType,
  InvoiceActivity,
} from "../types";
import type { Payment } from "../types/payment-types";

async function getModuleClient() {
  const supabase = await createClient();
  return supabase as any;
}

// ─── Input Types ───────────────────────────────────────────────

export interface CreateInvoiceLineItemInput {
  itemId?: string | null;
  sortOrder?: number;
  name: string;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
  discountType?: DiscountType | null;
  discountValue?: number;
  taxRateId?: string | null;
  taxRate?: number;
}

export interface CreateInvoiceInput {
  contactId?: string | null;
  companyId?: string | null;
  storefrontCustomerId?: string | null;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientAddress?: string | null;
  clientTaxId?: string | null;
  currency?: string;
  issueDate?: string;
  dueDate?: string;
  paymentTerms?: string | null;
  discountType?: DiscountType | null;
  discountValue?: number;
  notes?: string | null;
  terms?: string | null;
  internalNotes?: string | null;
  footer?: string | null;
  reference?: string | null;
  sourceType?: InvoiceSourceType | null;
  sourceId?: string | null;
  tags?: string[];
  lineItems: CreateInvoiceLineItemInput[];
}

export interface UpdateInvoiceInput extends Partial<
  Omit<CreateInvoiceInput, "lineItems">
> {
  lineItems?: CreateInvoiceLineItemInput[];
}

export interface InvoiceFilters {
  status?: InvoiceStatus | InvoiceStatus[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  clientName?: string;
  amountMin?: number;
  amountMax?: number;
  tags?: string[];
}

export interface InvoicePagination {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface InvoiceStats {
  totalOutstanding: number;
  totalOverdue: number;
  totalPaidThisPeriod: number;
  totalDraftCount: number;
  totalSentCount: number;
  totalOverdueCount: number;
  totalPaidCount: number;
  totalInvoiceCount: number;
}

export interface SendEmailOptions {
  to?: string;
  cc?: string[];
  bcc?: string[];
  subject?: string;
  message?: string;
}

// ─── Helper: Log Activity ──────────────────────────────────────

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

// ─── Helper: Compute Line Item DB Fields ───────────────────────

function computeLineItem(item: CreateInvoiceLineItemInput, index: number) {
  const totals = calculateLineItemTotals(
    item.quantity,
    item.unitPrice,
    item.discountType || null,
    item.discountValue || 0,
    item.taxRate || 0,
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
    discount_amount: totals.discountAmount,
    tax_rate_id: item.taxRateId || null,
    tax_rate: item.taxRate || 0,
    tax_amount: totals.taxAmount,
    subtotal: totals.subtotal,
    total: totals.total,
  };
}

// ═══════════════════════════════════════════════════════════════
// GET INVOICES (paginated + filters)
// ═══════════════════════════════════════════════════════════════

export async function getInvoices(
  siteId: string,
  filters?: InvoiceFilters,
  pagination?: InvoicePagination,
): Promise<{ invoices: Invoice[]; total: number }> {
  const supabase = await getModuleClient();
  const page = pagination?.page || 1;
  const pageSize = pagination?.pageSize || 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sortBy = pagination?.sortBy || "created_at";
  const sortOrder = pagination?.sortOrder === "asc";

  let query = supabase
    .from(INV_TABLES.invoices)
    .select("*", { count: "exact" })
    .eq("site_id", siteId);

  // Apply filters
  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in("status", filters.status);
    } else {
      query = query.eq("status", filters.status);
    }
  }

  if (filters?.search) {
    query = query.or(
      `invoice_number.ilike.%${filters.search}%,client_name.ilike.%${filters.search}%,client_email.ilike.%${filters.search}%`,
    );
  }

  if (filters?.dateFrom) {
    query = query.gte("issue_date", filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte("issue_date", filters.dateTo);
  }

  if (filters?.clientName) {
    query = query.ilike("client_name", `%${filters.clientName}%`);
  }

  if (filters?.amountMin !== undefined) {
    query = query.gte("total", filters.amountMin);
  }
  if (filters?.amountMax !== undefined) {
    query = query.lte("total", filters.amountMax);
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps("tags", filters.tags);
  }

  query = query.order(sortBy, { ascending: sortOrder }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    invoices: mapRecords<Invoice>((data || []) as Record<string, unknown>[]),
    total: count || 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// GET SINGLE INVOICE (with line items, payments, activities)
// ═══════════════════════════════════════════════════════════════

export async function getInvoice(invoiceId: string): Promise<
  InvoiceWithItems & {
    payments: Payment[];
    activities: InvoiceActivity[];
  }
> {
  const supabase = await getModuleClient();

  // Fetch invoice
  const { data: invoice, error } = await supabase
    .from(INV_TABLES.invoices)
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (error) throw new Error(error.message);

  // Fetch line items
  const { data: lineItems } = await supabase
    .from(INV_TABLES.invoiceLineItems)
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("sort_order", { ascending: true });

  // Fetch payments
  const { data: payments } = await supabase
    .from(INV_TABLES.payments)
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("payment_date", { ascending: false });

  // Fetch activities
  const { data: activities } = await supabase
    .from(INV_TABLES.invoiceActivity)
    .select("*")
    .eq("entity_type", "invoice")
    .eq("entity_id", invoiceId)
    .order("created_at", { ascending: false });

  return {
    ...mapRecord<Invoice>(invoice as Record<string, unknown>),
    lineItems: mapRecords<InvoiceLineItem>(
      (lineItems || []) as Record<string, unknown>[],
    ),
    payments: mapRecords<Payment>(
      (payments || []) as Record<string, unknown>[],
    ),
    activities: mapRecords<InvoiceActivity>(
      (activities || []) as Record<string, unknown>[],
    ),
  } as InvoiceWithItems & {
    payments: Payment[];
    activities: InvoiceActivity[];
  };
}

// ═══════════════════════════════════════════════════════════════
// CREATE INVOICE
// ═══════════════════════════════════════════════════════════════

export async function createInvoice(
  siteId: string,
  input: CreateInvoiceInput,
): Promise<Invoice> {
  const supabase = await getModuleClient();

  // Validate
  if (!input.lineItems || input.lineItems.length === 0) {
    throw new Error("Invoice must have at least one line item");
  }
  if (input.dueDate && input.issueDate && input.dueDate < input.issueDate) {
    throw new Error("Due date must be on or after the issue date");
  }

  // Generate invoice number atomically
  const invoiceNumber = await generateNextDocumentNumber(siteId, "invoice");

  // Compute line item totals
  const computedItems = input.lineItems.map((item, idx) =>
    computeLineItem(item, idx),
  );
  const invoiceTotals = calculateInvoiceTotals(
    computedItems.map((i) => ({
      subtotal: i.subtotal,
      discountAmount: i.discount_amount,
      taxAmount: i.tax_amount,
      total: i.total,
    })),
    input.discountType || null,
    input.discountValue || 0,
  );

  const today = new Date().toISOString().split("T")[0];
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 30);

  // Generate secure tokens
  const viewToken = crypto.randomUUID();
  const paymentToken = crypto.randomUUID();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Insert invoice
  const { data: invoice, error } = await supabase
    .from(INV_TABLES.invoices)
    .insert({
      site_id: siteId,
      invoice_number: invoiceNumber,
      status: "draft" as InvoiceStatus,
      contact_id: input.contactId || null,
      company_id: input.companyId || null,
      storefront_customer_id: input.storefrontCustomerId || null,
      client_name: input.clientName,
      client_email: input.clientEmail || null,
      client_phone: input.clientPhone || null,
      client_address: input.clientAddress || null,
      client_tax_id: input.clientTaxId || null,
      currency: input.currency || "ZMW",
      exchange_rate: 1,
      issue_date: input.issueDate || today,
      due_date: input.dueDate || defaultDueDate.toISOString().split("T")[0],
      payment_terms: input.paymentTerms || "Net 30",
      subtotal: invoiceTotals.subtotal,
      discount_type: input.discountType || null,
      discount_value: input.discountValue || 0,
      discount_amount: invoiceTotals.discountAmount,
      tax_amount: invoiceTotals.taxAmount,
      total: invoiceTotals.total,
      amount_paid: 0,
      amount_due: invoiceTotals.total,
      credits_applied: 0,
      deposit_amount: 0,
      deposit_paid: false,
      notes: input.notes || null,
      terms: input.terms || null,
      internal_notes: input.internalNotes || null,
      footer: input.footer || null,
      reference: input.reference || null,
      source_type: input.sourceType || "manual",
      source_id: input.sourceId || null,
      view_token: viewToken,
      payment_token: paymentToken,
      tags: input.tags || [],
      created_by: user?.id || null,
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

  // Log activity
  await logActivity(
    supabase,
    siteId,
    invoice.id,
    "created",
    `Invoice ${invoiceNumber} created`,
    "user",
    user?.id,
    user?.email,
  );

  // Fire automation event (fire-and-forget)
  try {
    const { logAutomationEvent } =
      await import("@/modules/automation/services/event-processor");
    await logAutomationEvent(
      siteId,
      "accounting.invoice.created",
      {
        id: invoice.id,
        invoiceNumber,
        clientName: input.clientName,
        total: invoiceTotals.total,
        currency: input.currency || "ZMW",
        status: "draft",
      },
      {
        sourceModule: "invoicing",
        sourceEntityType: "invoice",
        sourceEntityId: invoice.id,
      },
    );
  } catch {
    // Automation module may not be installed
  }

  return mapRecord<Invoice>(invoice as Record<string, unknown>);
}

// ═══════════════════════════════════════════════════════════════
// UPDATE INVOICE
// ═══════════════════════════════════════════════════════════════

export async function updateInvoice(
  invoiceId: string,
  input: UpdateInvoiceInput,
): Promise<Invoice> {
  const supabase = await getModuleClient();

  // Fetch existing
  const { data: existing, error: fetchErr } = await supabase
    .from(INV_TABLES.invoices)
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);

  const status = existing.status as InvoiceStatus;
  if (status === "paid" || status === "void" || status === "cancelled") {
    throw new Error(`Cannot edit a ${status} invoice`);
  }

  const dbFields: Record<string, unknown> = {};
  const fieldMap: Record<string, string> = {
    contactId: "contact_id",
    companyId: "company_id",
    storefrontCustomerId: "storefront_customer_id",
    clientName: "client_name",
    clientEmail: "client_email",
    clientPhone: "client_phone",
    clientAddress: "client_address",
    clientTaxId: "client_tax_id",
    currency: "currency",
    issueDate: "issue_date",
    dueDate: "due_date",
    paymentTerms: "payment_terms",
    discountType: "discount_type",
    discountValue: "discount_value",
    notes: "notes",
    terms: "terms",
    internalNotes: "internal_notes",
    footer: "footer",
    reference: "reference",
    tags: "tags",
  };

  for (const [key, value] of Object.entries(input)) {
    if (key === "lineItems") continue;
    const dbKey = fieldMap[key];
    if (dbKey && value !== undefined) {
      dbFields[dbKey] = value;
    }
  }

  // If line items are provided, recompute totals
  if (input.lineItems) {
    if (input.lineItems.length === 0) {
      throw new Error("Invoice must have at least one line item");
    }

    const computedItems = input.lineItems.map((item, idx) =>
      computeLineItem(item, idx),
    );

    const invoiceTotals = calculateInvoiceTotals(
      computedItems.map((i) => ({
        subtotal: i.subtotal,
        discountAmount: i.discount_amount,
        taxAmount: i.tax_amount,
        total: i.total,
      })),
      input.discountType ?? existing.discount_type,
      input.discountValue ?? existing.discount_value ?? 0,
    );

    dbFields.subtotal = invoiceTotals.subtotal;
    dbFields.discount_amount = invoiceTotals.discountAmount;
    dbFields.tax_amount = invoiceTotals.taxAmount;
    dbFields.total = invoiceTotals.total;
    dbFields.amount_due =
      invoiceTotals.total -
      (existing.amount_paid || 0) -
      (existing.credits_applied || 0);

    // Delete existing line items and re-insert
    await supabase
      .from(INV_TABLES.invoiceLineItems)
      .delete()
      .eq("invoice_id", invoiceId);

    const { error: liError } = await supabase
      .from(INV_TABLES.invoiceLineItems)
      .insert(
        computedItems.map((item) => ({
          ...item,
          invoice_id: invoiceId,
        })),
      );
    if (liError) throw new Error(liError.message);
  }

  // Validate dates
  const issueDate = (dbFields.issue_date as string) || existing.issue_date;
  const dueDate = (dbFields.due_date as string) || existing.due_date;
  if (dueDate < issueDate) {
    throw new Error("Due date must be on or after the issue date");
  }

  dbFields.updated_at = new Date().toISOString();

  const { data: updated, error: updateErr } = await supabase
    .from(INV_TABLES.invoices)
    .update(dbFields)
    .eq("id", invoiceId)
    .select()
    .single();

  if (updateErr) throw new Error(updateErr.message);

  // Log activity
  await logActivity(
    supabase,
    existing.site_id,
    invoiceId,
    "updated",
    `Invoice ${existing.invoice_number} updated`,
  );

  return mapRecord<Invoice>(updated as Record<string, unknown>);
}

// ═══════════════════════════════════════════════════════════════
// DELETE INVOICE (draft only)
// ═══════════════════════════════════════════════════════════════

export async function deleteInvoice(invoiceId: string): Promise<void> {
  const supabase = await getModuleClient();

  const { data: existing, error: fetchErr } = await supabase
    .from(INV_TABLES.invoices)
    .select("status, site_id, invoice_number")
    .eq("id", invoiceId)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);
  if (existing.status !== "draft") {
    throw new Error("Only draft invoices can be deleted");
  }

  // Delete line items first
  await supabase
    .from(INV_TABLES.invoiceLineItems)
    .delete()
    .eq("invoice_id", invoiceId);

  // Delete activities
  await supabase
    .from(INV_TABLES.invoiceActivity)
    .delete()
    .eq("entity_type", "invoice")
    .eq("entity_id", invoiceId);

  // Delete the invoice
  const { error } = await supabase
    .from(INV_TABLES.invoices)
    .delete()
    .eq("id", invoiceId);

  if (error) throw new Error(error.message);
}

// ═══════════════════════════════════════════════════════════════
// DUPLICATE INVOICE
// ═══════════════════════════════════════════════════════════════

export async function duplicateInvoice(invoiceId: string): Promise<Invoice> {
  const supabase = await getModuleClient();

  // Fetch the original
  const { data: original, error } = await supabase
    .from(INV_TABLES.invoices)
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (error) throw new Error(error.message);

  // Fetch line items
  const { data: lineItems } = await supabase
    .from(INV_TABLES.invoiceLineItems)
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("sort_order", { ascending: true });

  // Build the input from the original
  const duplicateInput: CreateInvoiceInput = {
    contactId: original.contact_id,
    companyId: original.company_id,
    storefrontCustomerId: original.storefront_customer_id,
    clientName: original.client_name,
    clientEmail: original.client_email,
    clientPhone: original.client_phone,
    clientAddress: original.client_address,
    clientTaxId: original.client_tax_id,
    currency: original.currency,
    paymentTerms: original.payment_terms,
    discountType: original.discount_type,
    discountValue: original.discount_value,
    notes: original.notes,
    terms: original.terms,
    footer: original.footer,
    reference: original.reference,
    tags: original.tags || [],
    lineItems: (lineItems || []).map((li: any) => ({
      itemId: li.item_id,
      sortOrder: li.sort_order,
      name: li.name,
      description: li.description,
      quantity: li.quantity,
      unit: li.unit,
      unitPrice: li.unit_price,
      discountType: li.discount_type,
      discountValue: li.discount_value,
      taxRateId: li.tax_rate_id,
      taxRate: li.tax_rate,
    })),
  };

  return createInvoice(original.site_id, duplicateInput);
}

// ═══════════════════════════════════════════════════════════════
// SEND INVOICE
// ═══════════════════════════════════════════════════════════════

export async function sendInvoice(
  invoiceId: string,
  emailOptions?: SendEmailOptions,
): Promise<void> {
  const supabase = await getModuleClient();

  const { data: invoice, error } = await supabase
    .from(INV_TABLES.invoices)
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (error) throw new Error(error.message);

  // Validate
  const email = emailOptions?.to || invoice.client_email;
  if (!email) {
    throw new Error("Cannot send invoice without a client email address");
  }

  // Check line items exist
  const { count } = await supabase
    .from(INV_TABLES.invoiceLineItems)
    .select("id", { count: "exact", head: true })
    .eq("invoice_id", invoiceId);

  if (!count || count === 0) {
    throw new Error("Cannot send invoice without line items");
  }

  // Check valid transition
  if (
    !isValidInvoiceTransition(
      invoice.status,
      "sent",
      VALID_INVOICE_TRANSITIONS as Record<string, string[]>,
    )
  ) {
    throw new Error(`Cannot send an invoice with status "${invoice.status}"`);
  }

  // Send email via template system
  try {
    const { autoSendInvoiceSentEmail } = await import(
      "../services/email-autosend-service"
    );

    if (emailOptions?.cc?.length || emailOptions?.bcc?.length || emailOptions?.subject) {
      // Custom send with cc/bcc — use template system for rendering but send directly
      const { getResend, isEmailEnabled, getEmailFrom } =
        await import("@/lib/email/resend-client");
      if (isEmailEnabled()) {
        const resend = getResend();
        if (resend) {
          const { renderTemplate } = await import(
            "../services/email-template-service"
          );
          const { formatInvoiceAmount } = await import("../lib/invoicing-utils");
          const formattedAmount = formatInvoiceAmount(
            invoice.amount_due || invoice.total,
            invoice.currency,
          );
          const dueDate = new Date(invoice.due_date).toLocaleDateString("en-ZM", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          const rendered = await renderTemplate(invoice.site_id, "invoice_sent", {
            clientName: invoice.client_name || "Client",
            invoiceNumber: invoice.invoice_number || "",
            amount: formattedAmount,
            dueDate,
            currency: invoice.currency || "ZMW",
          });

          const body = emailOptions?.message
            ? `<p>${emailOptions.message}</p>\n${rendered.body}`
            : rendered.body;

          await resend.emails.send({
            from: getEmailFrom(),
            to: email,
            cc: emailOptions.cc || [],
            bcc: emailOptions.bcc || [],
            subject: emailOptions.subject || rendered.subject,
            html: body,
          });
        }
      }
    } else {
      // Standard send — use auto-send hook
      await autoSendInvoiceSentEmail(invoice.site_id, invoiceId);
    }
  } catch {
    // Email send failure should not block status update
  }

  // Update status to sent
  const now = new Date().toISOString();
  await supabase
    .from(INV_TABLES.invoices)
    .update({
      status: "sent",
      sent_at: now,
      updated_at: now,
    })
    .eq("id", invoiceId);

  // Log activity
  await logActivity(
    supabase,
    invoice.site_id,
    invoiceId,
    "sent",
    `Invoice sent to ${email}`,
  );

  // Fire automation event
  try {
    const { logAutomationEvent } =
      await import("@/modules/automation/services/event-processor");
    await logAutomationEvent(
      invoice.site_id,
      "accounting.invoice.sent",
      {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        clientName: invoice.client_name,
        clientEmail: email,
        total: invoice.total,
        currency: invoice.currency,
      },
      {
        sourceModule: "invoicing",
        sourceEntityType: "invoice",
        sourceEntityId: invoice.id,
      },
    );
  } catch {
    // Automation module may not be installed
  }
}

// ═══════════════════════════════════════════════════════════════
// MARK AS SENT (manual)
// ═══════════════════════════════════════════════════════════════

export async function markAsSent(invoiceId: string): Promise<void> {
  const supabase = await getModuleClient();

  const { data: invoice, error } = await supabase
    .from(INV_TABLES.invoices)
    .select("status, site_id, invoice_number")
    .eq("id", invoiceId)
    .single();

  if (error) throw new Error(error.message);

  if (
    !isValidInvoiceTransition(
      invoice.status,
      "sent",
      VALID_INVOICE_TRANSITIONS as Record<string, string[]>,
    )
  ) {
    throw new Error(`Cannot mark as sent from status "${invoice.status}"`);
  }

  const now = new Date().toISOString();
  await supabase
    .from(INV_TABLES.invoices)
    .update({ status: "sent", sent_at: now, updated_at: now })
    .eq("id", invoiceId);

  await logActivity(
    supabase,
    invoice.site_id,
    invoiceId,
    "marked_sent",
    `Invoice ${invoice.invoice_number} manually marked as sent`,
  );
}

// ═══════════════════════════════════════════════════════════════
// VOID INVOICE
// ═══════════════════════════════════════════════════════════════

export async function voidInvoice(
  invoiceId: string,
  reason: string,
): Promise<void> {
  const supabase = await getModuleClient();

  const { data: invoice, error } = await supabase
    .from(INV_TABLES.invoices)
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (error) throw new Error(error.message);

  if (invoice.status === "paid") {
    throw new Error("Cannot void a fully paid invoice — refund first");
  }

  if (
    !isValidInvoiceTransition(
      invoice.status,
      "void",
      VALID_INVOICE_TRANSITIONS as Record<string, string[]>,
    )
  ) {
    throw new Error(`Cannot void invoice with status "${invoice.status}"`);
  }

  const now = new Date().toISOString();
  await supabase
    .from(INV_TABLES.invoices)
    .update({
      status: "void",
      amount_due: 0,
      updated_at: now,
    })
    .eq("id", invoiceId);

  await logActivity(
    supabase,
    invoice.site_id,
    invoiceId,
    "voided",
    `Invoice ${invoice.invoice_number} voided. Reason: ${reason}`,
    "user",
    null,
    null,
    { status: invoice.status },
    { status: "void", reason },
  );
}

// ═══════════════════════════════════════════════════════════════
// GET INVOICE STATS
// ═══════════════════════════════════════════════════════════════

export async function getInvoiceStats(siteId: string): Promise<InvoiceStats> {
  const supabase = await getModuleClient();

  // Get all invoices for the site (non-void, non-cancelled)
  const { data: invoices } = await supabase
    .from(INV_TABLES.invoices)
    .select("status, total, amount_due, amount_paid, paid_date")
    .eq("site_id", siteId);

  const all = (invoices || []) as any[];

  // Current month period
  const now = new Date();
  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();

  let totalOutstanding = 0;
  let totalOverdue = 0;
  let totalPaidThisPeriod = 0;
  let totalDraftCount = 0;
  let totalSentCount = 0;
  let totalOverdueCount = 0;
  let totalPaidCount = 0;

  for (const inv of all) {
    switch (inv.status) {
      case "draft":
        totalDraftCount++;
        break;
      case "sent":
      case "viewed":
        totalSentCount++;
        totalOutstanding += inv.amount_due || 0;
        break;
      case "partial":
        totalSentCount++;
        totalOutstanding += inv.amount_due || 0;
        break;
      case "overdue":
        totalOverdueCount++;
        totalOverdue += inv.amount_due || 0;
        totalOutstanding += inv.amount_due || 0;
        break;
      case "paid":
        totalPaidCount++;
        if (inv.paid_date && inv.paid_date >= monthStart) {
          totalPaidThisPeriod += inv.total || 0;
        }
        break;
    }
  }

  return {
    totalOutstanding,
    totalOverdue,
    totalPaidThisPeriod,
    totalDraftCount,
    totalSentCount,
    totalOverdueCount,
    totalPaidCount,
    totalInvoiceCount: all.length,
  };
}

// ═══════════════════════════════════════════════════════════════
// GET INVOICE BY VIEW TOKEN (public, no auth)
// ═══════════════════════════════════════════════════════════════

export async function getInvoiceByViewToken(
  token: string,
): Promise<InvoiceWithItems | null> {
  const supabase = await getModuleClient();

  const { data: invoice, error } = await supabase
    .from(INV_TABLES.invoices)
    .select("*")
    .eq("view_token", token)
    .single();

  if (error) return null;

  const { data: lineItems } = await supabase
    .from(INV_TABLES.invoiceLineItems)
    .select("*")
    .eq("invoice_id", invoice.id)
    .order("sort_order", { ascending: true });

  return {
    ...mapRecord<Invoice>(invoice as Record<string, unknown>),
    lineItems: mapRecords<InvoiceLineItem>(
      (lineItems || []) as Record<string, unknown>[],
    ),
  } as InvoiceWithItems;
}

// ═══════════════════════════════════════════════════════════════
// RECORD INVOICE VIEW
// ═══════════════════════════════════════════════════════════════

export async function recordInvoiceView(
  invoiceId: string,
  ipAddress?: string,
): Promise<void> {
  const supabase = await getModuleClient();

  const { data: invoice } = await supabase
    .from(INV_TABLES.invoices)
    .select("status, site_id, invoice_number, viewed_at")
    .eq("id", invoiceId)
    .single();

  if (!invoice) return;

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updated_at: now };

  // Update status to "viewed" if currently "sent"
  if (invoice.status === "sent") {
    updates.status = "viewed";
    updates.viewed_at = now;
  } else if (!invoice.viewed_at) {
    updates.viewed_at = now;
  }

  await supabase.from(INV_TABLES.invoices).update(updates).eq("id", invoiceId);

  // Log activity
  await logActivity(
    supabase,
    invoice.site_id,
    invoiceId,
    "viewed",
    `Invoice ${invoice.invoice_number} viewed by client`,
    "client",
    null,
    null,
    null,
    ipAddress ? { ipAddress } : null,
  );

  // Fire automation event
  try {
    const { logAutomationEvent } =
      await import("@/modules/automation/services/event-processor");
    await logAutomationEvent(
      invoice.site_id,
      "accounting.invoice.viewed",
      {
        id: invoiceId,
        invoiceNumber: invoice.invoice_number,
        ipAddress,
      },
      {
        sourceModule: "invoicing",
        sourceEntityType: "invoice",
        sourceEntityId: invoiceId,
      },
    );
  } catch {
    // Automation module may not be installed
  }
}
