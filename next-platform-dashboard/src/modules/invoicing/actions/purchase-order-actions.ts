"use server";

/**
 * Invoicing Module - Purchase Order Actions
 *
 * Phase INV-14: Vendor Management, Purchase Orders & Bills
 *
 * 10 server actions for PO lifecycle management.
 * PO line items stored in metadata.lineItems (JSON).
 * ALL amounts in CENTS (integers).
 */

import { createClient } from "@/lib/supabase/server";
import { INV_TABLES } from "../lib/invoicing-constants";
import { mapRecord, mapRecords } from "@/lib/map-db-record";
import { generateNextDocumentNumber } from "../services/invoice-number-service";
import { emitAutomationEvent } from "@/modules/automation/lib/automation-engine";
import type {
  PurchaseOrder,
  PurchaseOrderLineItem,
  CreatePurchaseOrderInput,
  Vendor,
  Bill,
  POStatus,
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
    entity_type: "purchase_order",
    entity_id: entityId,
    action,
    description,
    actor_type: "user",
  });
}

function calculatePOTotals(lineItems: PurchaseOrderLineItem[]) {
  let subtotal = 0;
  let taxAmount = 0;
  for (const li of lineItems) {
    subtotal += li.subtotal;
    taxAmount += li.taxAmount || 0;
  }
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}

// ─── Filter / Pagination Types ─────────────────────────────────

export interface POFilters {
  search?: string;
  vendorId?: string;
  status?: POStatus | POStatus[];
  dateFrom?: string;
  dateTo?: string;
}

export interface POPagination {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ─── getPurchaseOrders ─────────────────────────────────────────

export async function getPurchaseOrders(
  siteId: string,
  filters?: POFilters,
  pagination?: POPagination,
): Promise<{ purchaseOrders: PurchaseOrder[]; total: number }> {
  const supabase = await getModuleClient();
  const page = pagination?.page || 1;
  const pageSize = pagination?.pageSize || 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(INV_TABLES.purchaseOrders)
    .select("*, vendor:mod_invmod01_vendors!vendor_id(id, name, email)", {
      count: "exact",
    })
    .eq("site_id", siteId);

  if (filters?.search) {
    query = query.or(
      `po_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`,
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

  const sortBy = pagination?.sortBy || "created_at";
  const sortOrder = pagination?.sortOrder === "asc";
  query = query.order(sortBy, { ascending: sortOrder }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch purchase orders: ${error.message}`);
  }

  const purchaseOrders = (data || []).map((row: any) => {
    const po = mapRecord<PurchaseOrder>(row);
    if (row.vendor) {
      po.vendor = mapRecord<Vendor>(row.vendor);
    }
    return po;
  });

  return { purchaseOrders, total: count || 0 };
}

// ─── getPurchaseOrder ──────────────────────────────────────────

export async function getPurchaseOrder(
  purchaseOrderId: string,
): Promise<PurchaseOrder & { vendor?: Vendor | null; linkedBills: Bill[] }> {
  const supabase = await getModuleClient();

  const { data, error } = await supabase
    .from(INV_TABLES.purchaseOrders)
    .select("*, vendor:mod_invmod01_vendors!vendor_id(*)")
    .eq("id", purchaseOrderId)
    .single();

  if (error || !data) {
    throw new Error(`Purchase order not found: ${error?.message || "No data"}`);
  }

  const po = mapRecord<PurchaseOrder>(data);
  if (data.vendor) {
    po.vendor = mapRecord<Vendor>(data.vendor);
  }

  // Fetch linked bills
  const { data: billsData } = await supabase
    .from(INV_TABLES.bills)
    .select("*")
    .eq("purchase_order_id", purchaseOrderId)
    .order("created_at", { ascending: false });

  return {
    ...po,
    linkedBills: mapRecords<Bill>(billsData || []),
  };
}

// ─── createPurchaseOrder ───────────────────────────────────────

export async function createPurchaseOrder(
  siteId: string,
  input: CreatePurchaseOrderInput,
): Promise<PurchaseOrder> {
  const supabase = await getModuleClient();

  if (!input.vendorId) {
    throw new Error("Vendor is required");
  }

  const lineItems = input.lineItems || [];
  const totals = calculatePOTotals(lineItems);

  const poNumber = await generateNextDocumentNumber(siteId, "po");

  const { data, error } = await supabase
    .from(INV_TABLES.purchaseOrders)
    .insert({
      site_id: siteId,
      po_number: poNumber,
      vendor_id: input.vendorId,
      status: "draft",
      currency: input.currency || "ZMW",
      issue_date: input.issueDate || new Date().toISOString().split("T")[0],
      expected_date: input.expectedDate || null,
      subtotal: totals.subtotal,
      tax_amount: totals.taxAmount,
      total: totals.total,
      shipping_address: input.shippingAddress || null,
      notes: input.notes || null,
      internal_notes: input.internalNotes || null,
      tags: input.tags || [],
      metadata: { lineItems },
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create purchase order: ${error?.message || "No data"}`,
    );
  }

  const po = mapRecord<PurchaseOrder>(data);

  await logActivity(
    supabase,
    siteId,
    po.id,
    "purchase_order_created",
    `PO ${poNumber} created`,
  );

  try {
    await emitAutomationEvent(siteId, "accounting.purchase_order.created", {
      poNumber,
      vendorId: input.vendorId,
      totalAmountCents: totals.total,
      currency: input.currency || "ZMW",
      purchaseOrderId: po.id,
    });
  } catch {
    // non-critical
  }

  return po;
}

// ─── updatePurchaseOrder ───────────────────────────────────────

export async function updatePurchaseOrder(
  purchaseOrderId: string,
  input: Partial<CreatePurchaseOrderInput>,
): Promise<PurchaseOrder> {
  const supabase = await getModuleClient();

  const { data: existing } = await supabase
    .from(INV_TABLES.purchaseOrders)
    .select("site_id, status, metadata")
    .eq("id", purchaseOrderId)
    .single();

  if (!existing) {
    throw new Error("Purchase order not found");
  }
  if (existing.status !== "draft") {
    throw new Error("Can only update draft purchase orders");
  }

  const lineItems = input.lineItems ?? existing.metadata?.lineItems ?? [];
  const totals = calculatePOTotals(lineItems);

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    subtotal: totals.subtotal,
    tax_amount: totals.taxAmount,
    total: totals.total,
    metadata: { ...existing.metadata, lineItems },
  };

  if (input.vendorId !== undefined) updates.vendor_id = input.vendorId;
  if (input.currency !== undefined) updates.currency = input.currency;
  if (input.issueDate !== undefined) updates.issue_date = input.issueDate;
  if (input.expectedDate !== undefined)
    updates.expected_date = input.expectedDate || null;
  if (input.shippingAddress !== undefined)
    updates.shipping_address = input.shippingAddress || null;
  if (input.notes !== undefined) updates.notes = input.notes || null;
  if (input.internalNotes !== undefined)
    updates.internal_notes = input.internalNotes || null;
  if (input.tags !== undefined) updates.tags = input.tags;

  const { data, error } = await supabase
    .from(INV_TABLES.purchaseOrders)
    .update(updates)
    .eq("id", purchaseOrderId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to update purchase order: ${error?.message || "No data"}`,
    );
  }

  const po = mapRecord<PurchaseOrder>(data);

  await logActivity(
    supabase,
    existing.site_id,
    purchaseOrderId,
    "purchase_order_updated",
    `PO ${po.poNumber} updated`,
  );

  return po;
}

// ─── deletePurchaseOrder ───────────────────────────────────────

export async function deletePurchaseOrder(
  purchaseOrderId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  const { data: existing } = await supabase
    .from(INV_TABLES.purchaseOrders)
    .select("site_id, po_number, status")
    .eq("id", purchaseOrderId)
    .single();

  if (!existing) {
    throw new Error("Purchase order not found");
  }
  if (existing.status !== "draft") {
    throw new Error("Can only delete draft purchase orders");
  }

  const { error } = await supabase
    .from(INV_TABLES.purchaseOrders)
    .delete()
    .eq("id", purchaseOrderId);

  if (error) {
    throw new Error(`Failed to delete purchase order: ${error.message}`);
  }

  await logActivity(
    supabase,
    existing.site_id,
    purchaseOrderId,
    "purchase_order_deleted",
    `PO ${existing.po_number} deleted`,
  );
}

// ─── sendPurchaseOrder ─────────────────────────────────────────

export async function sendPurchaseOrder(
  purchaseOrderId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  const { data: po } = await supabase
    .from(INV_TABLES.purchaseOrders)
    .select("*, vendor:mod_invmod01_vendors!vendor_id(name, email)")
    .eq("id", purchaseOrderId)
    .single();

  if (!po) {
    throw new Error("Purchase order not found");
  }
  if (po.status !== "draft" && po.status !== "sent") {
    throw new Error("Can only send draft or previously sent purchase orders");
  }

  // Update status to sent
  const { error: updateError } = await supabase
    .from(INV_TABLES.purchaseOrders)
    .update({ status: "sent", updated_at: new Date().toISOString() })
    .eq("id", purchaseOrderId);

  if (updateError) {
    throw new Error(`Failed to update PO status: ${updateError.message}`);
  }

  // Send email to vendor if email exists
  if (po.vendor?.email) {
    try {
      const { getResend, isEmailEnabled, getEmailFrom } =
        await import("@/lib/email/resend-client");
      if (isEmailEnabled()) {
        const resend = getResend();
        if (!resend) return;

        // Get company settings for branding
        const { data: settings } = await supabase
          .from(INV_TABLES.settings)
          .select("company_name")
          .eq("site_id", po.site_id)
          .single();

        const companyName = settings?.company_name || "Our Company";
        const lineItems = po.metadata?.lineItems || [];
        const itemsHtml = lineItems
          .map(
            (li: PurchaseOrderLineItem) =>
              `<tr>
                <td style="padding:8px;border-bottom:1px solid #eee">${li.name}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${li.quantity}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">K${(li.unitPrice / 100).toFixed(2)}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">K${(li.total / 100).toFixed(2)}</td>
              </tr>`,
          )
          .join("");

        await resend.emails.send({
          from: getEmailFrom(),
          to: po.vendor.email,
          subject: `Purchase Order ${po.po_number} from ${companyName}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <h2>Purchase Order ${po.po_number}</h2>
              <p>Dear ${po.vendor.name},</p>
              <p>Please find the purchase order details below:</p>
              <table style="width:100%;border-collapse:collapse;margin:20px 0">
                <thead>
                  <tr style="background:#f5f5f5">
                    <th style="padding:8px;text-align:left">Item</th>
                    <th style="padding:8px;text-align:center">Qty</th>
                    <th style="padding:8px;text-align:right">Unit Price</th>
                    <th style="padding:8px;text-align:right">Total</th>
                  </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
                <tfoot>
                  <tr style="font-weight:bold">
                    <td colspan="3" style="padding:8px;text-align:right">Subtotal:</td>
                    <td style="padding:8px;text-align:right">K${(po.subtotal / 100).toFixed(2)}</td>
                  </tr>
                  ${po.tax_amount > 0 ? `<tr><td colspan="3" style="padding:8px;text-align:right">Tax:</td><td style="padding:8px;text-align:right">K${(po.tax_amount / 100).toFixed(2)}</td></tr>` : ""}
                  <tr style="font-weight:bold;font-size:1.1em">
                    <td colspan="3" style="padding:8px;text-align:right">Total:</td>
                    <td style="padding:8px;text-align:right">K${(po.total / 100).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              ${po.expected_date ? `<p><strong>Expected Delivery:</strong> ${po.expected_date}</p>` : ""}
              ${po.notes ? `<p><strong>Notes:</strong> ${po.notes}</p>` : ""}
              <p style="color:#666;font-size:12px;margin-top:30px">
                This purchase order was sent from ${companyName} via Dramac.
              </p>
            </div>
          `,
        });
      }
    } catch {
      // Email sending is non-critical
    }
  }

  await logActivity(
    supabase,
    po.site_id,
    purchaseOrderId,
    "purchase_order_sent",
    `PO ${po.po_number} sent to vendor${po.vendor?.name ? ` "${po.vendor.name}"` : ""}`,
  );

  try {
    await emitAutomationEvent(po.site_id, "accounting.purchase_order.sent", {
      poNumber: po.po_number,
      vendorName: po.vendor?.name || "",
      vendorEmail: po.vendor?.email || "",
      totalAmountCents: po.total,
      currency: po.currency,
      purchaseOrderId,
    });
  } catch {
    // non-critical
  }
}

// ─── approvePurchaseOrder ──────────────────────────────────────

export async function approvePurchaseOrder(
  purchaseOrderId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  const { data: po } = await supabase
    .from(INV_TABLES.purchaseOrders)
    .select("site_id, po_number, status")
    .eq("id", purchaseOrderId)
    .single();

  if (!po) {
    throw new Error("Purchase order not found");
  }
  if (po.status !== "sent") {
    throw new Error("Can only acknowledge sent purchase orders");
  }

  const { error } = await supabase
    .from(INV_TABLES.purchaseOrders)
    .update({ status: "acknowledged", updated_at: new Date().toISOString() })
    .eq("id", purchaseOrderId);

  if (error) {
    throw new Error(`Failed to acknowledge PO: ${error.message}`);
  }

  await logActivity(
    supabase,
    po.site_id,
    purchaseOrderId,
    "purchase_order_acknowledged",
    `PO ${po.po_number} acknowledged`,
  );
}

// ─── markAsReceived ────────────────────────────────────────────

export async function markAsReceived(purchaseOrderId: string): Promise<void> {
  const supabase = await getModuleClient();

  const { data: po } = await supabase
    .from(INV_TABLES.purchaseOrders)
    .select("site_id, po_number, status, vendor_id, total, currency")
    .eq("id", purchaseOrderId)
    .single();

  if (!po) {
    throw new Error("Purchase order not found");
  }
  if (!["sent", "acknowledged", "partially_received"].includes(po.status)) {
    throw new Error("PO must be sent, acknowledged, or partially received");
  }

  const { error } = await supabase
    .from(INV_TABLES.purchaseOrders)
    .update({ status: "received", updated_at: new Date().toISOString() })
    .eq("id", purchaseOrderId);

  if (error) {
    throw new Error(`Failed to mark PO as received: ${error.message}`);
  }

  await logActivity(
    supabase,
    po.site_id,
    purchaseOrderId,
    "purchase_order_received",
    `PO ${po.po_number} marked as received`,
  );

  try {
    await emitAutomationEvent(
      po.site_id,
      "accounting.purchase_order.received",
      {
        poNumber: po.po_number,
        vendorId: po.vendor_id,
        totalAmountCents: po.total,
        currency: po.currency,
        purchaseOrderId,
      },
    );
  } catch {
    // non-critical
  }
}

// ─── convertToBill ─────────────────────────────────────────────

export async function convertToBill(purchaseOrderId: string): Promise<Bill> {
  const supabase = await getModuleClient();

  const { data: po } = await supabase
    .from(INV_TABLES.purchaseOrders)
    .select("*")
    .eq("id", purchaseOrderId)
    .single();

  if (!po) {
    throw new Error("Purchase order not found");
  }
  if (po.status !== "received" && po.status !== "acknowledged") {
    throw new Error("PO must be received or acknowledged to convert to bill");
  }

  // Check if already converted
  const { data: existingBills } = await supabase
    .from(INV_TABLES.bills)
    .select("id")
    .eq("purchase_order_id", purchaseOrderId);

  if (existingBills && existingBills.length > 0) {
    throw new Error("This PO has already been converted to a bill");
  }

  // Generate bill number
  const { generateNextDocumentNumber: genBillNum } =
    await import("../services/invoice-number-service");
  const billNumber = await genBillNum(po.site_id, "bill");

  // Copy PO line items to bill line items
  const poLineItems: PurchaseOrderLineItem[] = po.metadata?.lineItems || [];

  // Create the bill
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const { data: bill, error: billError } = await supabase
    .from(INV_TABLES.bills)
    .insert({
      site_id: po.site_id,
      bill_number: billNumber,
      vendor_id: po.vendor_id,
      vendor_bill_reference: null,
      status: "draft",
      currency: po.currency,
      exchange_rate: 1,
      issue_date: new Date().toISOString().split("T")[0],
      due_date: dueDate.toISOString().split("T")[0],
      subtotal: po.subtotal,
      tax_amount: po.tax_amount,
      total: po.total,
      amount_paid: 0,
      amount_due: po.total,
      notes: po.notes,
      internal_notes: `Converted from PO ${po.po_number}`,
      purchase_order_id: purchaseOrderId,
      tags: po.tags || [],
      metadata: {},
    })
    .select()
    .single();

  if (billError || !bill) {
    throw new Error(
      `Failed to create bill from PO: ${billError?.message || "No data"}`,
    );
  }

  // Insert bill line items
  if (poLineItems.length > 0) {
    const billLineItems = poLineItems.map(
      (li: PurchaseOrderLineItem, idx: number) => ({
        bill_id: bill.id,
        sort_order: idx,
        name: li.name,
        description: li.description || null,
        quantity: li.quantity,
        unit: li.unit || null,
        unit_price: li.unitPrice,
        tax_rate_id: li.taxRateId || null,
        tax_rate: li.taxRate || 0,
        tax_amount: li.taxAmount || 0,
        subtotal: li.subtotal,
        total: li.total,
      }),
    );

    await supabase.from(INV_TABLES.billLineItems).insert(billLineItems);
  }

  await logActivity(
    supabase,
    po.site_id,
    bill.id,
    "bill_created_from_po",
    `Bill ${billNumber} created from PO ${po.po_number}`,
  );

  await logActivity(
    supabase,
    po.site_id,
    purchaseOrderId,
    "purchase_order_converted",
    `PO ${po.po_number} converted to bill ${billNumber}`,
  );

  return mapRecord<Bill>(bill);
}

// ─── cancelPurchaseOrder ───────────────────────────────────────

export async function cancelPurchaseOrder(
  purchaseOrderId: string,
): Promise<void> {
  const supabase = await getModuleClient();

  const { data: po } = await supabase
    .from(INV_TABLES.purchaseOrders)
    .select("site_id, po_number, status")
    .eq("id", purchaseOrderId)
    .single();

  if (!po) {
    throw new Error("Purchase order not found");
  }
  if (po.status === "cancelled") {
    throw new Error("PO is already cancelled");
  }
  if (po.status === "received") {
    throw new Error("Cannot cancel a received PO");
  }

  const { error } = await supabase
    .from(INV_TABLES.purchaseOrders)
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", purchaseOrderId);

  if (error) {
    throw new Error(`Failed to cancel PO: ${error.message}`);
  }

  await logActivity(
    supabase,
    po.site_id,
    purchaseOrderId,
    "purchase_order_cancelled",
    `PO ${po.po_number} cancelled`,
  );
}
