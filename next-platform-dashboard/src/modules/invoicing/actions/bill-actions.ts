"use server";

/**
 * Invoicing Module - Bill Actions
 *
 * Phase INV-14: Vendor Management, Purchase Orders & Bills
 *
 * 9 server actions for bill lifecycle management.
 * Bills represent money owed TO vendors (Accounts Payable).
 * ALL amounts in CENTS (integers).
 */

import { createClient } from "@/lib/supabase/server";
import { INV_TABLES } from "../lib/invoicing-constants";
import { mapRecord, mapRecords } from "@/lib/map-db-record";
import { generateNextDocumentNumber } from "../services/invoice-number-service";
import { emitAutomationEvent } from "@/modules/automation/lib/automation-engine";
import type {
  Bill,
  BillLineItem,
  BillStatus,
  CreateBillInput,
  CreateBillLineItemInput,
  Vendor,
  BillStats,
} from "../types";

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
) {
  await supabase.from(INV_TABLES.invoiceActivity).insert({
    site_id: siteId,
    entity_type: "bill",
    entity_id: entityId,
    action,
    description,
    actor_type: "user",
  });
}

function formatAmount(cents: number, currency = "ZMW"): string {
  const symbol = currency === "ZMW" ? "K" : currency;
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

// ─── Filter / Pagination Types ─────────────────────────────────

export interface BillFilters {
  search?: string;
  vendorId?: string;
  status?: BillStatus | BillStatus[];
  dateFrom?: string;
  dateTo?: string;
  overdue?: boolean;
}

export interface BillPagination {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ─── getBills ──────────────────────────────────────────────────

export async function getBills(
  siteId: string,
  filters?: BillFilters,
  pagination?: BillPagination,
): Promise<{ bills: Bill[]; total: number }> {
  const supabase = await getModuleClient();
  const page = pagination?.page || 1;
  const pageSize = pagination?.pageSize || 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(INV_TABLES.bills)
    .select("*, vendor:mod_invmod01_vendors!vendor_id(id, name, email)", {
      count: "exact",
    })
    .eq("site_id", siteId);

  if (filters?.search) {
    query = query.or(
      `bill_number.ilike.%${filters.search}%,vendor_bill_reference.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`,
    );
  }
  if (filters?.vendorId) {
    query = query.eq("vendor_id", filters.vendorId);
  }
  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in("status", filters.status);
    } else {
      query = query.eq("status", filters.status);
    }
  }
  if (filters?.dateFrom) {
    query = query.gte("issue_date", filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte("issue_date", filters.dateTo);
  }
  if (filters?.overdue) {
    const today = new Date().toISOString().split("T")[0];
    query = query.lt("due_date", today).not("status", "in", '("paid","void")');
  }

  const sortBy = pagination?.sortBy || "created_at";
  const sortOrder = pagination?.sortOrder === "asc";
  query = query.order(sortBy, { ascending: sortOrder }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch bills: ${error.message}`);
  }

  const bills = (data || []).map((row: any) => {
    const bill = mapRecord<Bill>(row);
    if (row.vendor) {
      bill.vendor = mapRecord<Vendor>(row.vendor);
    }
    return bill;
  });

  return { bills, total: count || 0 };
}

// ─── getBill ───────────────────────────────────────────────────

export async function getBill(
  billId: string,
): Promise<Bill & { vendor?: Vendor | null; lineItems: BillLineItem[] }> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(INV_TABLES.bills)
    .select("*, vendor:mod_invmod01_vendors!vendor_id(*)")
    .eq("id", billId)
    .single();

  if (error || !data) {
    throw new Error(`Bill not found: ${error?.message || "No data"}`);
  }

  const bill = mapRecord<Bill>(data);
  if (data.vendor) {
    bill.vendor = mapRecord<Vendor>(data.vendor);
  }

  // Fetch line items
  const { data: lineItemsData } = await supabase
    .from(INV_TABLES.billLineItems)
    .select("*")
    .eq("bill_id", billId)
    .order("sort_order", { ascending: true });

  return {
    ...bill,
    lineItems: mapRecords<BillLineItem>(lineItemsData || []),
  };
}

// ─── createBill ────────────────────────────────────────────────

export async function createBill(
  siteId: string,
  input: CreateBillInput,
  lineItems?: CreateBillLineItemInput[],
): Promise<Bill> {
  const supabase = await getModuleClient();

  if (!input.vendorId) {
    throw new Error("Vendor is required");
  }

  const billNumber = await generateNextDocumentNumber(siteId, "bill");

  // Calculate totals from line items
  const allLineItems = lineItems ?? input.lineItems ?? [];
  let subtotal = 0;
  let taxAmount = 0;
  let total = 0;

  if (allLineItems.length > 0) {
    for (const li of allLineItems) {
      const liSubtotal = li.quantity * li.unitPrice;
      const liTax = Math.round(liSubtotal * ((li.taxRate || 0) / 100));
      subtotal += liSubtotal;
      taxAmount += liTax;
    }
    total = subtotal + taxAmount;
  }

  const { data, error } = await supabase
    .from(INV_TABLES.bills)
    .insert({
      site_id: siteId,
      bill_number: billNumber,
      vendor_id: input.vendorId,
      vendor_bill_reference: input.vendorBillReference || null,
      status: "draft",
      currency: input.currency || "ZMW",
      exchange_rate: 1,
      issue_date: input.issueDate || new Date().toISOString().split("T")[0],
      due_date: input.dueDate || null,
      subtotal,
      tax_amount: taxAmount,
      total,
      amount_paid: 0,
      amount_due: total,
      notes: input.notes || null,
      internal_notes: input.internalNotes || null,
      purchase_order_id: input.purchaseOrderId || null,
      tags: input.tags || [],
      metadata: {},
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create bill: ${error?.message || "No data"}`);
  }

  const bill = mapRecord<Bill>(data);

  // Insert line items
  if (allLineItems.length > 0) {
    const items = allLineItems.map((li, idx) => {
      const liSubtotal = li.quantity * li.unitPrice;
      const liTax = Math.round(liSubtotal * ((li.taxRate || 0) / 100));
      return {
        bill_id: bill.id,
        sort_order: idx,
        name: li.name,
        description: li.description || null,
        quantity: li.quantity,
        unit: li.unit || null,
        unit_price: li.unitPrice,
        tax_rate_id: li.taxRateId || null,
        tax_rate: li.taxRate || 0,
        tax_amount: liTax,
        subtotal: liSubtotal,
        total: liSubtotal + liTax,
      };
    });

    await supabase.from(INV_TABLES.billLineItems).insert(items);
  }

  await logActivity(
    supabase,
    siteId,
    bill.id,
    "bill_created",
    `Bill ${billNumber} created`,
  );

  try {
    await emitAutomationEvent(siteId, "accounting.bill.created", {
      billNumber,
      vendorId: input.vendorId,
      totalAmountCents: total,
      currency: input.currency || "ZMW",
      billId: bill.id,
    });
  } catch {
    // non-critical
  }

  return bill;
}

// ─── updateBill ────────────────────────────────────────────────

export async function updateBill(
  billId: string,
  input: Partial<CreateBillInput>,
  lineItems?: CreateBillLineItemInput[],
): Promise<Bill> {
  const supabase = await getModuleClient();

  const { data: existing } = await supabase
    .from(INV_TABLES.bills)
    .select("site_id, status, bill_number")
    .eq("id", billId)
    .single();

  if (!existing) {
    throw new Error("Bill not found");
  }
  if (existing.status !== "draft") {
    throw new Error("Can only update draft bills");
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.vendorId !== undefined) updates.vendor_id = input.vendorId;
  if (input.vendorBillReference !== undefined)
    updates.vendor_bill_reference = input.vendorBillReference || null;
  if (input.currency !== undefined) updates.currency = input.currency;
  if (input.issueDate !== undefined) updates.issue_date = input.issueDate;
  if (input.dueDate !== undefined) updates.due_date = input.dueDate || null;
  if (input.notes !== undefined) updates.notes = input.notes || null;
  if (input.internalNotes !== undefined)
    updates.internal_notes = input.internalNotes || null;
  if (input.purchaseOrderId !== undefined)
    updates.purchase_order_id = input.purchaseOrderId || null;
  if (input.tags !== undefined) updates.tags = input.tags;

  // Recalculate totals if line items provided
  if (lineItems) {
    let subtotal = 0;
    let taxAmount = 0;
    for (const li of lineItems) {
      const liSubtotal = li.quantity * li.unitPrice;
      const liTax = Math.round(liSubtotal * ((li.taxRate || 0) / 100));
      subtotal += liSubtotal;
      taxAmount += liTax;
    }
    const total = subtotal + taxAmount;
    updates.subtotal = subtotal;
    updates.tax_amount = taxAmount;
    updates.total = total;
    updates.amount_due = total; // draft bills have 0 paid

    // Replace all line items
    await supabase
      .from(INV_TABLES.billLineItems)
      .delete()
      .eq("bill_id", billId);

    const items = lineItems.map((li, idx) => {
      const liSubtotal = li.quantity * li.unitPrice;
      const liTax = Math.round(liSubtotal * ((li.taxRate || 0) / 100));
      return {
        bill_id: billId,
        sort_order: idx,
        name: li.name,
        description: li.description || null,
        quantity: li.quantity,
        unit: li.unit || null,
        unit_price: li.unitPrice,
        tax_rate_id: li.taxRateId || null,
        tax_rate: li.taxRate || 0,
        tax_amount: liTax,
        subtotal: liSubtotal,
        total: liSubtotal + liTax,
      };
    });

    if (items.length > 0) {
      await supabase.from(INV_TABLES.billLineItems).insert(items);
    }
  }

  const { data, error } = await supabase
    .from(INV_TABLES.bills)
    .update(updates)
    .eq("id", billId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update bill: ${error?.message || "No data"}`);
  }

  await logActivity(
    supabase,
    existing.site_id,
    billId,
    "bill_updated",
    `Bill ${existing.bill_number} updated`,
  );

  return mapRecord<Bill>(data);
}

// ─── deleteBill ────────────────────────────────────────────────

export async function deleteBill(billId: string): Promise<void> {
  const supabase = await getModuleClient();

  const { data: existing } = await supabase
    .from(INV_TABLES.bills)
    .select("site_id, bill_number, status")
    .eq("id", billId)
    .single();

  if (!existing) {
    throw new Error("Bill not found");
  }
  if (existing.status !== "draft") {
    throw new Error("Can only delete draft bills");
  }

  // Delete line items first
  await supabase.from(INV_TABLES.billLineItems).delete().eq("bill_id", billId);

  const { error } = await supabase
    .from(INV_TABLES.bills)
    .delete()
    .eq("id", billId);

  if (error) {
    throw new Error(`Failed to delete bill: ${error.message}`);
  }

  await logActivity(
    supabase,
    existing.site_id,
    billId,
    "bill_deleted",
    `Bill ${existing.bill_number} deleted`,
  );
}

// ─── approveBill ───────────────────────────────────────────────

export async function approveBill(billId: string): Promise<void> {
  const supabase = await getModuleClient();

  const { data: bill } = await supabase
    .from(INV_TABLES.bills)
    .select("site_id, bill_number, status, total, currency, vendor_id")
    .eq("id", billId)
    .single();

  if (!bill) {
    throw new Error("Bill not found");
  }
  if (bill.status !== "draft") {
    throw new Error("Can only approve draft bills");
  }

  const { error } = await supabase
    .from(INV_TABLES.bills)
    .update({ status: "received", updated_at: new Date().toISOString() })
    .eq("id", billId);

  if (error) {
    throw new Error(`Failed to approve bill: ${error.message}`);
  }

  await logActivity(
    supabase,
    bill.site_id,
    billId,
    "bill_approved",
    `Bill ${bill.bill_number} approved`,
  );

  try {
    await emitAutomationEvent(bill.site_id, "accounting.bill.approved", {
      billNumber: bill.bill_number,
      vendorId: bill.vendor_id,
      totalAmountCents: bill.total,
      currency: bill.currency,
      billId,
    });
  } catch {
    // non-critical
  }
}

// ─── recordBillPayment ─────────────────────────────────────────

export interface BillPaymentInput {
  amount: number;
  paymentDate?: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}

export async function recordBillPayment(
  billId: string,
  input: BillPaymentInput,
): Promise<void> {
  const supabase = await getModuleClient();

  // Validate amount
  if (!input.amount || input.amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  // Fetch bill
  const { data: bill } = await supabase
    .from(INV_TABLES.bills)
    .select("*")
    .eq("id", billId)
    .single();

  if (!bill) {
    throw new Error("Bill not found");
  }

  const blockedStatuses: BillStatus[] = ["void", "draft"];
  if (blockedStatuses.includes(bill.status)) {
    throw new Error(`Cannot record payment for a ${bill.status} bill`);
  }

  const today = new Date().toISOString().split("T")[0];
  const newAmountPaid = (bill.amount_paid || 0) + input.amount;
  const newAmountDue = bill.total - newAmountPaid;

  // Determine new status
  let newStatus: BillStatus = bill.status;
  if (newAmountDue <= 0) {
    newStatus = "paid";
  } else if (newAmountPaid > 0 && newAmountDue > 0) {
    newStatus = "partial";
  }

  // Update bill
  const updatePayload: Record<string, unknown> = {
    amount_paid: newAmountPaid,
    amount_due: Math.max(0, newAmountDue),
    updated_at: new Date().toISOString(),
  };
  if (newStatus !== bill.status) {
    updatePayload.status = newStatus;
  }
  if (newStatus === "paid") {
    updatePayload.paid_date = input.paymentDate || today;
  }

  const { error: updateError } = await supabase
    .from(INV_TABLES.bills)
    .update(updatePayload)
    .eq("id", billId);

  if (updateError) {
    throw new Error(`Failed to record bill payment: ${updateError.message}`);
  }

  await logActivity(
    supabase,
    bill.site_id,
    billId,
    "bill_payment_recorded",
    `Payment of ${formatAmount(input.amount, bill.currency)} recorded via ${input.paymentMethod}`,
  );

  try {
    await emitAutomationEvent(
      bill.site_id,
      "accounting.bill.payment_recorded",
      {
        billNumber: bill.bill_number,
        vendorId: bill.vendor_id,
        paymentAmountCents: input.amount,
        totalAmountCents: bill.total,
        amountDueCents: Math.max(0, newAmountDue),
        currency: bill.currency,
        paymentMethod: input.paymentMethod,
        status: newStatus,
        billId,
      },
    );
  } catch {
    // non-critical
  }
}

// ─── voidBill ──────────────────────────────────────────────────

export async function voidBill(billId: string): Promise<void> {
  const supabase = await getModuleClient();

  const { data: bill } = await supabase
    .from(INV_TABLES.bills)
    .select("site_id, bill_number, status, amount_paid")
    .eq("id", billId)
    .single();

  if (!bill) {
    throw new Error("Bill not found");
  }
  if (bill.status === "void") {
    throw new Error("Bill is already void");
  }
  if ((bill.amount_paid || 0) > 0) {
    throw new Error("Cannot void a bill with recorded payments");
  }

  const { error } = await supabase
    .from(INV_TABLES.bills)
    .update({ status: "void", updated_at: new Date().toISOString() })
    .eq("id", billId);

  if (error) {
    throw new Error(`Failed to void bill: ${error.message}`);
  }

  await logActivity(
    supabase,
    bill.site_id,
    billId,
    "bill_voided",
    `Bill ${bill.bill_number} voided`,
  );
}

// ─── getBillStats ──────────────────────────────────────────────

export async function getBillStats(siteId: string): Promise<BillStats> {
  const supabase = await getModuleClient();

  const { data: bills } = await supabase
    .from(INV_TABLES.bills)
    .select("status, total, amount_due, due_date")
    .eq("site_id", siteId)
    .not("status", "in", '("void")');

  const allBills = bills || [];
  const today = new Date().toISOString().split("T")[0];

  let totalBilled = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;
  let totalOverdue = 0;
  let overdueCount = 0;
  let draftCount = 0;
  let approvedCount = 0;
  let partialCount = 0;
  let paidCount = 0;

  for (const b of allBills) {
    const bTotal = b.total || 0;
    const bPaid = b.amount_paid || 0;
    const due = b.amount_due || 0;
    totalBilled += bTotal;
    totalPaid += bPaid;
    if (due > 0) {
      totalOutstanding += due;
    }
    if (b.due_date && b.due_date < today && due > 0) {
      totalOverdue += due;
      overdueCount++;
    }
    switch (b.status) {
      case "draft":
        draftCount++;
        break;
      case "received":
        approvedCount++;
        break;
      case "partial":
        partialCount++;
        break;
      case "paid":
        paidCount++;
        break;
    }
  }

  return {
    totalBilled,
    totalPaid,
    totalOutstanding,
    totalOverdue,
    billCount: allBills.length,
    overdueCount,
    draftCount,
    approvedCount,
    partialCount,
    paidCount,
    totalCount: allBills.length,
  };
}
