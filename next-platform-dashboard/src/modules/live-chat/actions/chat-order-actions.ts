"use server";

/**
 * Chat Order Actions
 *
 * Lightweight server actions for managing orders directly from the
 * live chat conversation view. Fetches order context and proxies
 * order management operations to the e-commerce module.
 */

import { createClient } from "@/lib/supabase/server";
import { verifyUserSiteAccess } from "@/lib/multi-tenant/tenant-context";

const ECOM_PREFIX = "mod_ecommod01";

export interface ChatOrderContext {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentProvider: string | null;
  total: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  paymentProof: {
    hasProof: boolean;
    status: string | null;
    fileName: string | null;
    uploadedAt: string | null;
  } | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
}

/**
 * Fetch a lightweight order context by order number for the chat sidebar.
 * Returns null if not found or user not authenticated.
 */
export async function getOrderContextForChat(
  siteId: string,
  orderNumber: string,
): Promise<ChatOrderContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Verify the authenticated user has access to this site
  const hasAccess = await verifyUserSiteAccess(user.id, siteId);
  if (!hasAccess) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: order } = await db
    .from(`${ECOM_PREFIX}_orders`)
    .select(
      "id, order_number, status, payment_status, payment_method, payment_provider, total, currency, customer_name, customer_email, created_at, metadata, tracking_number, tracking_url, shipped_at, delivered_at",
    )
    .eq("site_id", siteId)
    .eq("order_number", orderNumber)
    .single();

  if (!order) return null;

  // Get order items
  const { data: items } = await db
    .from(`${ECOM_PREFIX}_order_items`)
    .select("product_name, quantity, unit_price, total_price")
    .eq("order_id", order.id);

  // Extract payment proof from metadata
  const meta = (order.metadata || {}) as Record<string, unknown>;
  const proof = meta.payment_proof as
    | { status?: string; file_name?: string; uploaded_at?: string }
    | undefined;

  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    paymentProvider: order.payment_provider,
    total: order.total,
    currency: order.currency,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    createdAt: order.created_at,
    items: (items || []).map(
      (i: {
        product_name: string;
        quantity: number;
        unit_price: number;
        total_price: number;
      }) => ({
        productName: i.product_name,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        totalPrice: i.total_price,
      }),
    ),
    paymentProof: proof
      ? {
          hasProof: true,
          status: proof.status || null,
          fileName: proof.file_name || null,
          uploadedAt: proof.uploaded_at || null,
        }
      : null,
    trackingNumber: order.tracking_number,
    trackingUrl: order.tracking_url,
    shippedAt: order.shipped_at,
    deliveredAt: order.delivered_at,
  };
}
