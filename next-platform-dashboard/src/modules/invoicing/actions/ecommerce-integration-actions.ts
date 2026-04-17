"use server";

import { createClient } from "@/lib/supabase/server";
import { INV_TABLES } from "../lib/invoicing-constants";

type AnySupabase = ReturnType<
  typeof import("@supabase/supabase-js").createClient
>;

/**
 * Create an invoice from an e-commerce order.
 * Pulls order details + line items, creates a draft invoice with line items pre-populated.
 */
export async function createInvoiceFromOrder(
  orderId: string,
  siteId: string,
): Promise<{ invoiceId?: string; url?: string; error?: string }> {
  const supabase = (await createClient()) as AnySupabase;

  // Fetch the order
  const { data: order, error: orderErr } = await supabase
    .from("mod_ecommod01_orders")
    .select("*, mod_ecommod01_order_items(*)")
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    return { error: orderErr?.message || "Order not found" };
  }

  const o = order as Record<string, unknown>;

  // Build redirect URL to invoice creation with pre-filled data
  const params = new URLSearchParams({
    source: "ecommerce",
    source_id: orderId,
    source_type: "order",
    client_name: (o.customer_name as string) || "",
    client_email: (o.customer_email as string) || "",
    currency: (o.currency as string) || "ZMW",
    prefill: "true",
  });

  // Encode line items as JSON for the invoice form to parse
  const lineItems = (
    (o.mod_ecommod01_order_items || []) as Record<string, unknown>[]
  ).map((item) => ({
    description: (item.name as string) || "Product",
    quantity: (item.quantity as number) || 1,
    unit_price_cents: (item.unit_price as number) || 0,
    amount_cents: (item.total as number) || 0,
  }));

  if (lineItems.length > 0) {
    params.set("line_items", JSON.stringify(lineItems));
  }

  return {
    url: `/dashboard/sites/${siteId}/invoicing/invoices/new?${params.toString()}`,
  };
}

/**
 * Create a credit note from an e-commerce refund.
 * Links the credit note back to the original invoice (if one exists for the order).
 */
export async function createCreditNoteFromRefund(
  orderId: string,
  siteId: string,
  refundAmountCents: number,
  reason?: string,
): Promise<{ creditNoteId?: string; url?: string; error?: string }> {
  const supabase = (await createClient()) as AnySupabase;

  // Fetch the order to find customer info
  const { data: order, error: orderErr } = await supabase
    .from("mod_ecommod01_orders")
    .select("customer_name, customer_email, order_number, currency")
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    return { error: orderErr?.message || "Order not found" };
  }

  const o = order as Record<string, unknown>;

  // Try to find an existing invoice for this order
  const { data: existingInvoice } = await supabase
    .from(INV_TABLES.invoices)
    .select("id, invoice_number")
    .eq("site_id", siteId)
    .eq("source_id", orderId)
    .eq("source_type", "ecommerce_order")
    .maybeSingle();

  const inv = existingInvoice as { id: string; invoice_number?: string } | null;

  const params = new URLSearchParams({
    source: "ecommerce_refund",
    source_id: orderId,
    client_name: (o.customer_name as string) || "",
    client_email: (o.customer_email as string) || "",
    currency: (o.currency as string) || "ZMW",
    amount_cents: String(refundAmountCents),
    reason:
      reason || `Refund for order ${(o.order_number as string) || orderId}`,
  });

  if (inv) {
    params.set("invoice_id", inv.id);
    params.set("invoice_number", inv.invoice_number || "");
  }

  return {
    url: `/dashboard/sites/${siteId}/invoicing/credit-notes/new?${params.toString()}`,
  };
}
