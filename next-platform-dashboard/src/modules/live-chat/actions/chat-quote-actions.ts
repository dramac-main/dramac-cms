"use server";

/**
 * Chat Quote Actions
 *
 * Server actions for managing quotes directly from the live chat
 * conversation view. Fetches quote context and proxies quote
 * management operations to the e-commerce module.
 */

import { createClient } from "@/lib/supabase/server";
import { verifyUserSiteAccess } from "@/lib/multi-tenant/tenant-context";

const ECOM_PREFIX = "mod_ecommod01";

export interface ChatQuoteContext {
  id: string;
  quoteNumber: string;
  status: string;
  total: number;
  subtotal: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string | null;
  customerPhone: string | null;
  createdAt: string;
  validUntil: string | null;
  viewCount: number;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    imageUrl: string | null;
  }>;
  convertedOrderNumber: string | null;
  accessToken: string | null;
}

/**
 * Fetch a lightweight quote context by quote number for the chat sidebar.
 * Returns null if not found or user not authenticated.
 */
export async function getQuoteContextForChat(
  siteId: string,
  quoteNumber: string,
): Promise<ChatQuoteContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const hasAccess = await verifyUserSiteAccess(user.id, siteId);
  if (!hasAccess) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: quote } = await db
    .from(`${ECOM_PREFIX}_quotes`)
    .select(
      "id, quote_number, status, total, subtotal, currency, customer_name, customer_email, customer_company, customer_phone, created_at, valid_until, view_count, converted_to_order_id, access_token",
    )
    .eq("site_id", siteId)
    .eq("quote_number", quoteNumber)
    .single();

  if (!quote) return null;

  // Get quote items
  const { data: items } = await db
    .from(`${ECOM_PREFIX}_quote_items`)
    .select("name, quantity, unit_price, line_total, image_url")
    .eq("quote_id", quote.id)
    .order("sort_order", { ascending: true });

  // Get converted order number if applicable
  let convertedOrderNumber: string | null = null;
  if (quote.converted_to_order_id) {
    const { data: order } = await db
      .from(`${ECOM_PREFIX}_orders`)
      .select("order_number")
      .eq("id", quote.converted_to_order_id)
      .single();
    convertedOrderNumber = order?.order_number || null;
  }

  return {
    id: quote.id,
    quoteNumber: quote.quote_number,
    status: quote.status,
    total: quote.total,
    subtotal: quote.subtotal,
    currency: quote.currency,
    customerName: quote.customer_name,
    customerEmail: quote.customer_email,
    customerCompany: quote.customer_company,
    customerPhone: quote.customer_phone,
    createdAt: quote.created_at,
    validUntil: quote.valid_until,
    viewCount: quote.view_count,
    items: (items || []).map(
      (i: {
        name: string;
        quantity: number;
        unit_price: number;
        line_total: number;
        image_url: string | null;
      }) => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        lineTotal: i.line_total,
        imageUrl: i.image_url,
      }),
    ),
    convertedOrderNumber,
    accessToken: quote.access_token,
  };
}
