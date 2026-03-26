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
import { getPaymentProofUrl } from "@/modules/ecommerce/actions/order-actions";

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
  proofUrl: string | null;
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

  const orderContext: ChatOrderContext = {
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
    proofUrl: null as string | null,
    trackingNumber: order.tracking_number,
    trackingUrl: order.tracking_url,
    shippedAt: order.shipped_at,
    deliveredAt: order.delivered_at,
  };

  // Fetch signed proof URL if a proof exists
  if (proof) {
    const proofResult = await getPaymentProofUrl(order.id, siteId);
    if (proofResult.url) {
      orderContext.proofUrl = proofResult.url;
    }
  }

  return orderContext;
}

// ============================================================================
// STORE INFO
// ============================================================================

export interface ChatStoreInfo {
  storeName: string;
  storeAddress: string;
  storeEmail: string;
  storePhone: string;
  storeLogo: string;
  storePrimaryColor: string;
  currency: string;
}

/**
 * Fetch store settings for rendering the OrderDetailDialog inside live chat.
 */
export async function getStoreInfoForChat(
  siteId: string,
): Promise<ChatStoreInfo | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const hasAccess = await verifyUserSiteAccess(user.id, siteId);
  if (!hasAccess) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: settings } = await db
    .from(`${ECOM_PREFIX}_settings`)
    .select(
      "store_name, store_email, store_phone, store_address, store_url, currency",
    )
    .eq("site_id", siteId)
    .single();

  if (!settings) return null;

  // Format address object to a single string
  const addr = settings.store_address as {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  } | null;

  const addressParts = addr
    ? [
        addr.street,
        addr.city,
        addr.state,
        addr.postal_code,
        addr.country,
      ].filter(Boolean)
    : [];

  // Fetch agency branding (logo + primary color) via sites → agencies
  let storeLogo = "";
  let storePrimaryColor = "";

  try {
    const { data: site } = await db
      .from("sites")
      .select("agency_id")
      .eq("id", siteId)
      .single();

    if (site?.agency_id) {
      const { data: agency } = await db
        .from("agencies")
        .select("custom_branding")
        .eq("id", site.agency_id)
        .single();

      if (agency?.custom_branding) {
        const branding = agency.custom_branding as Record<string, unknown>;
        storeLogo = (branding.logo_url as string) || "";
        storePrimaryColor = (branding.primary_color as string) || "";
      }
    }
  } catch (err) {
    console.error("[ChatOrderActions] Error fetching agency branding:", err);
  }

  return {
    storeName: settings.store_name || "",
    storeAddress: addressParts.join(", "),
    storeEmail: settings.store_email || "",
    storePhone: settings.store_phone || "",
    storeLogo,
    storePrimaryColor,
    currency: settings.currency || "ZMW",
  };
}
