/**
 * Quote Workflow Server Actions
 *
 * Phase ECOM-12: Quote Workflow & Customer Portal
 *
 * Handles quote sending, acceptance, rejection, and conversion to orders
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DOMAINS } from "@/lib/constants/domains";
import { sendBrandedEmail } from "@/lib/email/send-branded-email";
import {
  notifyQuoteAccepted,
  notifyQuoteRejected,
  notifyNewOrder,
} from "@/lib/services/business-notifications";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/locale-config";
import {
  notifyChatQuoteSent,
  notifyChatQuoteAccepted,
  notifyChatQuoteRejected,
} from "@/modules/live-chat/lib/chat-event-bridge";
import { requireQuoteAccess } from "./quote-portal-auth";
import { revalidatePath } from "next/cache";
import type {
  Quote,
  QuoteStatus,
  QuoteItem,
  Order,
  OrderItem,
  Address,
} from "../types/ecommerce-types";

const TABLE_PREFIX = "mod_ecommod01";

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

// Authenticated client for dashboard actions (requires logged-in user)
async function getModuleClient() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase as any;
}

// Admin client for public-facing actions (quote portal — no auth cookies)
// Used by getQuoteByToken, recordQuoteView, acceptQuote, rejectQuote
function getPublicModuleClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createAdminClient() as any;
}

/**
 * Build the public-facing site URL for a given site.
 * Uses custom_domain if set, otherwise falls back to subdomain + SITES_BASE,
 * and finally to NEXT_PUBLIC_APP_URL as last resort.
 */
async function getSitePublicUrl(siteId: string): Promise<string> {
  const supabase = await getModuleClient();
  const { data: site } = await supabase
    .from("sites")
    .select("subdomain, custom_domain")
    .eq("id", siteId)
    .single();

  if (site?.custom_domain) {
    return `https://${site.custom_domain}`;
  }
  if (site?.subdomain) {
    return `https://${site.subdomain}.${DOMAINS.SITES_BASE}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "";
}

// ============================================================================
// TYPES
// ============================================================================

interface SendQuoteInput {
  quote_id: string;
  site_id: string;
  subject?: string;
  message?: string;
  cc_emails?: string[];
  include_pdf?: boolean;
}

interface AcceptQuoteInput {
  token: string;
  accepted_by_name: string;
  accepted_by_email?: string;
  signature_data?: string;
  notes?: string;
  shipping_address?: Partial<Address>;
}

interface RejectQuoteInput {
  token: string;
  rejection_reason?: string;
  rejected_by_name?: string;
}

interface ConvertToOrderInput {
  quote_id: string;
  site_id: string;
  include_notes?: boolean;
  custom_order_notes?: string;
  user_id?: string;
  user_name?: string;
  shipping_address?: Partial<Address> | null;
  billing_address?: Partial<Address> | null;
}

interface WorkflowResult {
  success: boolean;
  error?: string;
  quote?: Quote;
  order?: Order;
}

// ============================================================================
// SEND QUOTE
// ============================================================================

/**
 * Send quote to customer via email
 */
export async function sendQuote(
  input: SendQuoteInput,
): Promise<WorkflowResult> {
  try {
    const supabase = await getModuleClient();

    // Get quote with full details
    const { data: quote, error: quoteError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select(
        `
        *,
        items:${TABLE_PREFIX}_quote_items(*)
      `,
      )
      .eq("id", input.quote_id)
      .eq("site_id", input.site_id)
      .single();

    if (quoteError || !quote) {
      return { success: false, error: "Quote not found" };
    }

    // Validate quote can be sent
    if (!["draft", "pending_approval"].includes(quote.status)) {
      return {
        success: false,
        error: "Quote cannot be sent in current status",
      };
    }

    // Validate quote has items and a customer email
    const items = quote.items as Array<{
      quantity: number;
      unit_price: number;
    }> | null;
    if (!items || items.length === 0) {
      return {
        success: false,
        error: "Cannot send a quote with no items. Please add items first.",
      };
    }

    if (!quote.customer_email) {
      return {
        success: false,
        error: "Cannot send a quote without a customer email address.",
      };
    }

    // Generate access token if not exists
    let accessToken = quote.access_token;
    if (!accessToken) {
      accessToken = crypto.randomUUID().replace(/-/g, "");
    }

    // Update quote status to sent
    const now = new Date().toISOString();
    const { data: updatedQuote, error: updateError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .update({
        status: "sent",
        access_token: accessToken,
        sent_at: now,
        updated_at: now,
      })
      .eq("id", input.quote_id)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log activity
    await supabase.from(`${TABLE_PREFIX}_quote_activities`).insert({
      quote_id: input.quote_id,
      activity_type: "sent",
      description: `Quote sent to ${quote.customer_email}`,
      metadata: {
        subject: input.subject,
        cc_emails: input.cc_emails,
      },
    });

    // Build portal URL using the site's public domain
    const siteBaseUrl = await getSitePublicUrl(input.site_id);
    const portalUrl = `${siteBaseUrl}/quote/${accessToken}`;
    // Use the pre-calculated total which includes discounts, taxes, and shipping
    const totalAmount = quote.total || 0;
    const formatted = formatCurrency(
      totalAmount,
      quote.currency || DEFAULT_CURRENCY,
    );

    // Get store name for email branding
    const { data: storeSettings } = await supabase
      .from(`${TABLE_PREFIX}_settings`)
      .select("store_name")
      .eq("site_id", input.site_id)
      .single();
    const businessName = storeSettings?.store_name || "";

    await sendBrandedEmail(quote.agency_id || null, {
      to: {
        email: quote.customer_email,
        name: quote.customer_name || undefined,
      },
      siteId: input.site_id,
      emailType: "quote_sent_customer",
      data: {
        customerName: quote.customer_name || "Customer",
        customerEmail: quote.customer_email,
        quoteNumber: quote.quote_number,
        subject: input.subject,
        message: input.message,
        totalAmount: formatted,
        expiryDate: quote.valid_until
          ? new Date(quote.valid_until).toLocaleDateString("en-US")
          : undefined,
        viewQuoteUrl: portalUrl,
        businessName,
      },
    });

    // Notify active chat conversation about the sent quote
    if (quote.customer_email) {
      try {
        await notifyChatQuoteSent(
          input.site_id,
          quote.customer_email,
          quote.quote_number,
          formatted,
          portalUrl,
        );
      } catch {
        // Chat notification is best-effort
      }
    }

    revalidatePath(`/sites/${input.site_id}/ecommerce`);

    return { success: true, quote: updatedQuote };
  } catch (error) {
    console.error("Error sending quote:", error);
    return { success: false, error: "Failed to send quote" };
  }
}

/**
 * Resend quote to customer
 */
export async function resendQuote(
  siteId: string,
  quoteId: string,
  subject?: string,
  message?: string,
): Promise<WorkflowResult> {
  try {
    const supabase = await getModuleClient();

    const { data: quote, error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select("*")
      .eq("id", quoteId)
      .eq("site_id", siteId)
      .single();

    if (error || !quote) {
      return { success: false, error: "Quote not found" };
    }

    // Only allow resend for sent/viewed quotes
    if (!["sent", "viewed"].includes(quote.status)) {
      return { success: false, error: "Quote must be sent first" };
    }

    // Update timestamp
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .update({ updated_at: now })
      .eq("id", quoteId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log activity
    await supabase.from(`${TABLE_PREFIX}_quote_activities`).insert({
      quote_id: quoteId,
      activity_type: "resent",
      description: `Quote resent to ${quote.customer_email}`,
      metadata: { subject, message },
    });

    // Send resend email
    const siteBaseUrl = await getSitePublicUrl(siteId);
    const portalUrl = `${siteBaseUrl}/quote/${quote.access_token}`;
    const totalAmount = quote.total || 0;
    // Quote totals are stored in main currency unit (not cents) — no /100 needed
    const formatted = formatCurrency(
      totalAmount,
      quote.currency || DEFAULT_CURRENCY,
    );

    // Get store name for email branding
    const { data: siteSettings } = await supabase
      .from(`${TABLE_PREFIX}_settings`)
      .select("store_name")
      .eq("site_id", siteId)
      .single();
    const storeName = siteSettings?.store_name || "";

    await sendBrandedEmail(quote.agency_id || null, {
      to: {
        email: quote.customer_email,
        name: quote.customer_name || undefined,
      },
      siteId: siteId,
      emailType: "quote_sent_customer",
      data: {
        customerName: quote.customer_name || "Customer",
        customerEmail: quote.customer_email,
        quoteNumber: quote.quote_number,
        subject,
        message,
        totalAmount: formatted,
        expiryDate: quote.valid_until
          ? new Date(quote.valid_until).toLocaleDateString("en-US")
          : undefined,
        viewQuoteUrl: portalUrl,
        businessName: storeName,
      },
    });

    revalidatePath(`/sites/${siteId}/ecommerce`);

    return { success: true };
  } catch (error) {
    console.error("Error resending quote:", error);
    return { success: false, error: "Failed to resend quote" };
  }
}

/**
 * Send quote reminder
 */
export async function sendQuoteReminder(
  siteId: string,
  quoteId: string,
  message?: string,
): Promise<WorkflowResult> {
  try {
    const supabase = await getModuleClient();

    const { data: quote, error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select("*")
      .eq("id", quoteId)
      .eq("site_id", siteId)
      .single();

    if (error || !quote) {
      return { success: false, error: "Quote not found" };
    }

    // Only for sent/viewed quotes that aren't expired
    if (!["sent", "viewed"].includes(quote.status)) {
      return { success: false, error: "Cannot send reminder for this quote" };
    }

    // Log activity
    await supabase.from(`${TABLE_PREFIX}_quote_activities`).insert({
      quote_id: quoteId,
      activity_type: "reminder_sent",
      description: `Reminder sent to ${quote.customer_email}`,
      metadata: { message },
    });

    // Send reminder email
    const siteBaseUrl = await getSitePublicUrl(siteId);
    const portalUrl = `${siteBaseUrl}/quote/${quote.access_token}`;
    const totalAmount = quote.total || 0;
    // Quote totals are stored in main currency unit (not cents) — no /100 needed
    const formatted = formatCurrency(
      totalAmount,
      quote.currency || DEFAULT_CURRENCY,
    );

    // Get store name for email branding
    const { data: reminderSettings } = await supabase
      .from(`${TABLE_PREFIX}_settings`)
      .select("store_name")
      .eq("site_id", siteId)
      .single();
    const reminderBusinessName = reminderSettings?.store_name || "";

    await sendBrandedEmail(quote.agency_id || null, {
      to: {
        email: quote.customer_email,
        name: quote.customer_name || undefined,
      },
      siteId: siteId,
      emailType: "quote_reminder_customer",
      data: {
        customerName: quote.customer_name || "Customer",
        quoteNumber: quote.quote_number,
        message,
        totalAmount: formatted,
        expiryDate: quote.valid_until
          ? new Date(quote.valid_until).toLocaleDateString("en-US")
          : undefined,
        viewQuoteUrl: portalUrl,
        businessName: reminderBusinessName,
      },
    });

    revalidatePath(`/sites/${siteId}/ecommerce`);

    return { success: true };
  } catch (error) {
    console.error("Error sending reminder:", error);
    return { success: false, error: "Failed to send reminder" };
  }
}

// ============================================================================
// CUSTOMER PORTAL ACTIONS
// ============================================================================

/**
 * Get quote by access token (for customer portal)
 */
export async function getQuoteByToken(token: string): Promise<Quote | null> {
  try {
    const supabase = getPublicModuleClient();

    const { data, error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select(
        `
        *,
        items:${TABLE_PREFIX}_quote_items(*)
      `,
      )
      .eq("access_token", token)
      .single();

    if (error || !data) {
      return null;
    }

    // If converted, look up the order number for the portal banner
    if (data.converted_to_order_id) {
      const { data: orderRow } = await supabase
        .from(`${TABLE_PREFIX}_orders`)
        .select("order_number")
        .eq("id", data.converted_to_order_id)
        .single();

      if (orderRow) {
        data.metadata = {
          ...(data.metadata || {}),
          converted_order_number: orderRow.order_number,
        };
      }
    }

    return data;
  } catch (error) {
    console.error("Error getting quote by token:", error);
    return null;
  }
}

/**
 * Record quote view (for analytics)
 */
export async function recordQuoteView(token: string): Promise<void> {
  try {
    const supabase = getPublicModuleClient();

    const { data: quote } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select("id, status, view_count, first_viewed_at")
      .eq("access_token", token)
      .single();

    if (!quote) return;

    // Update view count and first_viewed_at
    const updates: Record<string, unknown> = {
      view_count: (quote.view_count || 0) + 1,
      updated_at: new Date().toISOString(),
    };

    // Set status to viewed if this is first view
    if (quote.status === "sent") {
      updates.status = "viewed";
      updates.first_viewed_at = new Date().toISOString();
      updates.viewed_at = new Date().toISOString();
    }

    await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .update(updates)
      .eq("id", quote.id);

    // Log view activity
    if (quote.status === "sent") {
      await supabase.from(`${TABLE_PREFIX}_quote_activities`).insert({
        quote_id: quote.id,
        activity_type: "viewed",
        description: "Quote viewed by customer",
      });
    }
  } catch (error) {
    console.error("Error recording quote view:", error);
  }
}

/**
 * Accept quote (customer action — requires email verification)
 */
export async function acceptQuote(
  input: AcceptQuoteInput,
): Promise<WorkflowResult> {
  try {
    // Verify email gate cookie before allowing acceptance
    const access = await requireQuoteAccess(input.token);
    if (!access.verified) {
      return { success: false, error: access.error };
    }

    const supabase = getPublicModuleClient();

    // Get quote by token
    const { data: quote, error: quoteError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select("*")
      .eq("access_token", input.token)
      .single();

    if (quoteError || !quote) {
      return { success: false, error: "Quote not found" };
    }

    // Validate quote can be accepted
    if (!["sent", "viewed"].includes(quote.status)) {
      return {
        success: false,
        error: "Quote cannot be accepted in current status",
      };
    }

    // Check if expired
    if (quote.valid_until && new Date(quote.valid_until) < new Date()) {
      return { success: false, error: "Quote has expired" };
    }

    // Update quote to accepted
    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status: "accepted",
      responded_at: now,
      response_notes: input.notes,
      metadata: {
        ...quote.metadata,
        accepted_by_name: input.accepted_by_name,
        accepted_by_email: input.accepted_by_email,
        signature_data: input.signature_data,
      },
      updated_at: now,
    };

    // Store shipping address if customer provided one during acceptance
    if (input.shipping_address) {
      updatePayload.shipping_address = input.shipping_address;
      // Use same address for billing unless already set
      if (!quote.billing_address) {
        updatePayload.billing_address = input.shipping_address;
      }
    }

    const { data: updatedQuote, error: updateError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .update(updatePayload)
      .eq("id", quote.id)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log activity
    await supabase.from(`${TABLE_PREFIX}_quote_activities`).insert({
      quote_id: quote.id,
      activity_type: "accepted",
      description: `Quote accepted by ${input.accepted_by_name}`,
      metadata: {
        accepted_by_name: input.accepted_by_name,
        accepted_by_email: input.accepted_by_email,
      },
    });

    // Send acceptance notifications (in-app + emails to owner & customer)
    const totalAmount = quote.total || 0;
    // Quote totals are stored in main currency unit (not cents) — no /100 needed
    const formatted = formatCurrency(
      totalAmount,
      quote.currency || DEFAULT_CURRENCY,
    );

    if (quote.site_id) {
      notifyQuoteAccepted(
        quote.site_id,
        quote.quote_number,
        quote.customer_email || "",
        quote.customer_name || "Customer",
        formatted,
      );

      // Notify active chat conversation about the accepted quote
      if (quote.customer_email) {
        try {
          await notifyChatQuoteAccepted(
            quote.site_id,
            quote.customer_email,
            quote.quote_number,
            formatted,
          );
        } catch {
          // Chat notification is best-effort
        }
      }
    }

    return { success: true, quote: updatedQuote };
  } catch (error) {
    console.error("Error accepting quote:", error);
    return { success: false, error: "Failed to accept quote" };
  }
}

/**
 * Reject quote (customer action — requires email verification)
 */
export async function rejectQuote(
  input: RejectQuoteInput,
): Promise<WorkflowResult> {
  try {
    // Verify email gate cookie before allowing rejection
    const access = await requireQuoteAccess(input.token);
    if (!access.verified) {
      return { success: false, error: access.error };
    }

    const supabase = getPublicModuleClient();

    // Get quote by token
    const { data: quote, error: quoteError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select("*")
      .eq("access_token", input.token)
      .single();

    if (quoteError || !quote) {
      return { success: false, error: "Quote not found" };
    }

    // Validate quote can be rejected
    if (!["sent", "viewed"].includes(quote.status)) {
      return {
        success: false,
        error: "Quote cannot be rejected in current status",
      };
    }

    // Update quote to rejected
    const now = new Date().toISOString();
    const { data: updatedQuote, error: updateError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .update({
        status: "rejected",
        responded_at: now,
        response_notes: input.rejection_reason,
        metadata: {
          ...quote.metadata,
          rejection_reason: input.rejection_reason,
          rejected_by_name: input.rejected_by_name,
        },
        updated_at: now,
      })
      .eq("id", quote.id)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log activity
    await supabase.from(`${TABLE_PREFIX}_quote_activities`).insert({
      quote_id: quote.id,
      activity_type: "rejected",
      description: input.rejection_reason
        ? `Quote rejected: ${input.rejection_reason}`
        : "Quote rejected by customer",
      metadata: {
        rejection_reason: input.rejection_reason,
        rejected_by_name: input.rejected_by_name,
      },
    });

    // Send rejection notifications (in-app + email to owner)
    if (quote.site_id) {
      notifyQuoteRejected(
        quote.site_id,
        quote.quote_number,
        quote.customer_email || "",
        quote.customer_name || "Customer",
        input.rejection_reason,
      );
    }

    // Notify active chat conversation about the rejection
    if (quote.customer_email && quote.site_id) {
      try {
        await notifyChatQuoteRejected(
          quote.site_id,
          quote.customer_email,
          quote.quote_number,
          input.rejection_reason,
        );
      } catch {
        // Chat notification is best-effort
      }
    }

    return { success: true, quote: updatedQuote };
  } catch (error) {
    console.error("Error rejecting quote:", error);
    return { success: false, error: "Failed to reject quote" };
  }
}

// ============================================================================
// REQUEST AMENDMENT (CUSTOMER)
// ============================================================================

interface RequestAmendmentInput {
  token: string;
  amendment_notes: string;
  requested_by_name?: string;
}

/**
 * Customer requests changes to a quote (sends it back for revision)
/**
 * Customer requests changes to a quote (sends it back for revision).
 * Requires email verification.
 */
export async function requestQuoteAmendment(
  input: RequestAmendmentInput,
): Promise<WorkflowResult> {
  try {
    // Verify email gate cookie before allowing amendment request
    const access = await requireQuoteAccess(input.token);
    if (!access.verified) {
      return { success: false, error: access.error };
    }

    const supabase = getPublicModuleClient();

    // Get quote by token
    const { data: quote, error: quoteError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select("*")
      .eq("access_token", input.token)
      .single();

    if (quoteError || !quote) {
      return { success: false, error: "Quote not found" };
    }

    // Validate quote can receive amendment requests
    if (!["sent", "viewed"].includes(quote.status)) {
      return {
        success: false,
        error: "Quote cannot be amended in current status",
      };
    }

    // Update quote back to pending_approval so store owner can revise
    const now = new Date().toISOString();
    const amendmentCount = (quote.metadata?.amendment_count || 0) + 1;
    const { data: updatedQuote, error: updateError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .update({
        status: "pending_approval" as QuoteStatus,
        response_notes: input.amendment_notes,
        metadata: {
          ...quote.metadata,
          amendment_requested: true,
          amendment_notes: input.amendment_notes,
          amendment_requested_at: now,
          amendment_requested_by: input.requested_by_name,
          amendment_count: amendmentCount,
        },
        updated_at: now,
      })
      .eq("id", quote.id)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log activity
    await supabase.from(`${TABLE_PREFIX}_quote_activities`).insert({
      quote_id: quote.id,
      activity_type: "amendment_requested",
      description: `Customer requested changes: ${input.amendment_notes}`,
      metadata: {
        amendment_notes: input.amendment_notes,
        requested_by_name: input.requested_by_name,
        amendment_number: amendmentCount,
      },
    });

    // Notify active chat conversation (customer-facing confirmation)
    if (quote.customer_email && quote.site_id) {
      try {
        const { notifyChatQuoteAmendmentRequested } =
          await import("@/modules/live-chat/lib/chat-event-bridge");
        await notifyChatQuoteAmendmentRequested(
          quote.site_id,
          quote.customer_email,
          quote.quote_number,
          input.amendment_notes,
        );
      } catch {
        // Chat notification is best-effort
      }
    }

    // Notify store owner (in-app + email)
    if (quote.site_id) {
      try {
        const { notifyQuoteAmendmentRequested } =
          await import("@/lib/services/business-notifications");
        await notifyQuoteAmendmentRequested(
          quote.site_id,
          quote.quote_number,
          quote.customer_email || "",
          quote.customer_name || "Customer",
          input.amendment_notes,
        );
      } catch {
        // Business notification is best-effort
      }
    }

    revalidatePath("/ecommerce");

    return { success: true, quote: updatedQuote };
  } catch (error) {
    console.error("Error requesting quote amendment:", error);
    return { success: false, error: "Failed to request changes" };
  }
}

// ============================================================================
// CONVERT TO ORDER
// ============================================================================

/**
 * Convert accepted quote to order
 */
export async function convertQuoteToOrder(
  input: ConvertToOrderInput,
): Promise<WorkflowResult> {
  try {
    const supabase = await getModuleClient();

    // Get quote with items
    const { data: quote, error: quoteError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select(
        `
        *,
        items:${TABLE_PREFIX}_quote_items(*)
      `,
      )
      .eq("id", input.quote_id)
      .eq("site_id", input.site_id)
      .single();

    if (quoteError || !quote) {
      return { success: false, error: "Quote not found" };
    }

    // Validate quote can be converted
    if (quote.status !== "accepted") {
      return {
        success: false,
        error: "Only accepted quotes can be converted to orders",
      };
    }

    // Check if already converted
    if (quote.converted_to_order_id) {
      return {
        success: false,
        error: "Quote has already been converted to an order",
      };
    }

    // Generate order number using DB function (consistent with checkout flow)
    const { data: generatedNumber, error: rpcError } = await supabase.rpc(
      "mod_ecommod01_generate_order_number",
      { p_site_id: input.site_id },
    );

    if (rpcError || !generatedNumber) {
      console.error("Order number RPC error:", rpcError);
      return { success: false, error: "Failed to generate order number" };
    }
    const orderNumber = generatedNumber as string;

    // Create order — quotes default to manual payment
    // NOTE: Quote amounts are stored in cents (same as orders/products).
    // e.g. unit_price 7500.00 = ZMW 75.00. No conversion needed.

    // Resolve addresses: input > quote > customer default > placeholder
    let shippingAddr = input.shipping_address || quote.shipping_address || null;
    let billingAddr = input.billing_address || quote.billing_address || null;

    // If still missing, try the customer's saved default address
    if ((!shippingAddr || !billingAddr) && quote.customer_id) {
      const { data: custAddresses } = await supabase
        .from(`${TABLE_PREFIX}_customer_addresses`)
        .select("*")
        .eq("customer_id", quote.customer_id)
        .order("is_default_shipping", { ascending: false });

      if (custAddresses && custAddresses.length > 0) {
        if (!shippingAddr) {
          const defaultShip =
            custAddresses.find((a: any) => a.is_default_shipping) ||
            custAddresses[0];
          shippingAddr = {
            first_name: defaultShip.first_name,
            last_name: defaultShip.last_name,
            company: defaultShip.company || "",
            address_line_1: defaultShip.address_line_1,
            address_line_2: defaultShip.address_line_2 || "",
            city: defaultShip.city,
            state: defaultShip.state,
            postal_code: defaultShip.postal_code,
            country: defaultShip.country,
            phone: defaultShip.phone || quote.customer_phone || "",
          };
        }
        if (!billingAddr) {
          const defaultBill =
            custAddresses.find((a: any) => a.is_default_billing) ||
            custAddresses[0];
          billingAddr = {
            first_name: defaultBill.first_name,
            last_name: defaultBill.last_name,
            company: defaultBill.company || "",
            address_line_1: defaultBill.address_line_1,
            address_line_2: defaultBill.address_line_2 || "",
            city: defaultBill.city,
            state: defaultBill.state,
            postal_code: defaultBill.postal_code,
            country: defaultBill.country,
            phone: defaultBill.phone || quote.customer_phone || "",
          };
        }
      }
    }

    // Final fallback: construct from customer info on the quote
    const nameParts = (quote.customer_name || "").split(" ");
    const fallbackAddress: Partial<Address> = {
      first_name: nameParts[0] || "",
      last_name: nameParts.slice(1).join(" ") || "",
      address_line_1: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
      phone: quote.customer_phone || "",
    };

    const orderData = {
      site_id: input.site_id,
      agency_id: quote.agency_id,
      customer_id: quote.customer_id,
      order_number: orderNumber,
      status: "pending",
      payment_status: "pending",
      payment_provider: "manual",
      fulfillment_status: "unfulfilled",
      currency: quote.currency,
      subtotal: quote.subtotal || 0,
      discount_amount: quote.discount_amount || 0,
      tax_amount: quote.tax_amount || 0,
      shipping_amount: quote.shipping_amount || 0,
      total: quote.total || 0,
      customer_email: quote.customer_email,
      customer_name: quote.customer_name,
      customer_phone: quote.customer_phone,
      shipping_address: shippingAddr || fallbackAddress,
      billing_address: billingAddr || shippingAddr || fallbackAddress,
      internal_notes: input.include_notes
        ? `Converted from Quote ${quote.quote_number}\n${input.custom_order_notes || quote.internal_notes || ""}`
        : input.custom_order_notes || null,
      metadata: {
        source_quote_id: quote.id,
        source_quote_number: quote.quote_number,
        source: "quote",
      },
    };

    const { data: newOrder, error: orderError } = await supabase
      .from(`${TABLE_PREFIX}_orders`)
      .insert(orderData)
      .select()
      .single();

    if (orderError || !newOrder) {
      return {
        success: false,
        error: orderError?.message || "Failed to create order",
      };
    }

    // Create order items from quote items
    // Column mapping: order_items table uses product_name, product_sku, variant_options, image_url, total_price, fulfilled_quantity
    // Prices are already in cents in both quotes and orders — no conversion needed
    if (quote.items && quote.items.length > 0) {
      const orderItems = quote.items.map((item: QuoteItem) => ({
        order_id: newOrder.id,
        product_id: item.product_id || null,
        variant_id: item.variant_id || null,
        product_name: item.name || "Unknown Product",
        product_sku: item.sku || null,
        variant_options: item.options || {},
        image_url: null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.line_total || item.unit_price * item.quantity,
        fulfilled_quantity: 0,
      }));

      const { error: itemsError } = await supabase
        .from(`${TABLE_PREFIX}_order_items`)
        .insert(orderItems);

      if (itemsError) {
        console.error("Error creating order items from quote:", itemsError);
      }
    }

    // Update quote as converted
    const now = new Date().toISOString();
    await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .update({
        status: "converted",
        converted_to_order_id: newOrder.id,
        converted_at: now,
        updated_at: now,
      })
      .eq("id", quote.id);

    // Log activity on quote
    await supabase.from(`${TABLE_PREFIX}_quote_activities`).insert({
      quote_id: quote.id,
      activity_type: "converted",
      description: `Quote converted to Order ${orderNumber}`,
      performed_by: input.user_id,
      performed_by_name: input.user_name,
      metadata: { order_id: newOrder.id, order_number: orderNumber },
    });

    // Log activity on order
    await supabase.from(`${TABLE_PREFIX}_order_timeline`).insert({
      order_id: newOrder.id,
      event_type: "created",
      title: `Order created from Quote ${quote.quote_number}`,
      description: `Order created from Quote ${quote.quote_number}`,
      actor_id: input.user_id,
      actor_name: input.user_name,
      metadata: { quote_id: quote.id, quote_number: quote.quote_number },
    });

    // Notify business owner + customer about the new order
    // notifyNewOrder expects prices in cents (divides by 100 internally)
    // Quote prices are already in cents — pass directly
    const currency = quote.currency || DEFAULT_CURRENCY;
    await notifyNewOrder({
      siteId: input.site_id,
      orderId: newOrder.id,
      orderNumber: orderNumber,
      customerEmail: quote.customer_email,
      customerName: quote.customer_name || "Customer",
      items:
        quote.items?.map((item: QuoteItem) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
        })) || [],
      subtotal: quote.subtotal || 0,
      shipping: quote.shipping_amount || 0,
      tax: quote.tax_amount || 0,
      total: quote.total || 0,
      currency,
      paymentStatus: "pending",
      paymentProvider: "manual",
    });

    // Notify active chat conversation about quote → order conversion (async)
    if (quote.customer_email) {
      // Quote totals are in main currency unit (not cents) — no /100 needed
      const totalFormatted = formatCurrency(quote.total || 0, currency);
      import("@/modules/live-chat/lib/chat-event-bridge")
        .then(({ notifyChatQuoteConverted }) =>
          notifyChatQuoteConverted(
            input.site_id,
            quote.customer_email,
            quote.quote_number,
            orderNumber,
            totalFormatted,
          ),
        )
        .catch((err) =>
          console.error("[QuoteWorkflow] Chat notification error:", err),
        );
    }

    revalidatePath(`/sites/${input.site_id}/ecommerce`);

    return { success: true, order: newOrder };
  } catch (error) {
    console.error("Error converting quote to order:", error);
    return { success: false, error: "Failed to convert quote to order" };
  }
}

// ============================================================================
// STATUS MANAGEMENT
// ============================================================================

/**
 * Update quote status with validation
 */
export async function updateQuoteStatus(
  siteId: string,
  quoteId: string,
  newStatus: QuoteStatus,
  reason?: string,
  userId?: string,
  userName?: string,
): Promise<WorkflowResult> {
  try {
    const supabase = await getModuleClient();

    // Get current quote
    const { data: quote, error: quoteError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select("*")
      .eq("id", quoteId)
      .eq("site_id", siteId)
      .single();

    if (quoteError || !quote) {
      return { success: false, error: "Quote not found" };
    }

    // Validate status transition
    const validTransitions: Record<QuoteStatus, QuoteStatus[]> = {
      draft: ["pending_approval", "sent", "cancelled"],
      pending_approval: ["draft", "sent", "cancelled"],
      sent: ["viewed", "accepted", "rejected", "expired", "cancelled"],
      viewed: ["accepted", "rejected", "expired", "cancelled"],
      accepted: ["converted", "cancelled"],
      rejected: ["draft"],
      expired: ["draft"],
      converted: [],
      cancelled: ["draft"],
    };

    const allowed = validTransitions[quote.status as QuoteStatus] || [];
    if (!allowed.includes(newStatus)) {
      return {
        success: false,
        error: `Cannot transition from ${quote.status} to ${newStatus}`,
      };
    }

    // Build updates
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {
      status: newStatus,
      updated_at: now,
    };

    // Update quote
    const { data: updatedQuote, error: updateError } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .update(updates)
      .eq("id", quoteId)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log activity
    await supabase.from(`${TABLE_PREFIX}_quote_activities`).insert({
      quote_id: quoteId,
      activity_type: "status_changed",
      description:
        reason || `Status changed from ${quote.status} to ${newStatus}`,
      performed_by: userId,
      performed_by_name: userName,
      metadata: {
        old_status: quote.status,
        new_status: newStatus,
        reason,
      },
    });

    revalidatePath(`/sites/${siteId}/ecommerce`);

    return { success: true, quote: updatedQuote };
  } catch (error) {
    console.error("Error updating quote status:", error);
    return { success: false, error: "Failed to update status" };
  }
}

/**
 * Cancel quote
 */
export async function cancelQuote(
  siteId: string,
  quoteId: string,
  reason?: string,
  userId?: string,
  userName?: string,
): Promise<WorkflowResult> {
  return updateQuoteStatus(
    siteId,
    quoteId,
    "cancelled",
    reason,
    userId,
    userName,
  );
}

/**
 * Mark expired quotes (to be run by cron job)
 */
export async function markExpiredQuotes(
  siteId: string,
): Promise<{ count: number }> {
  try {
    const supabase = await getModuleClient();

    const now = new Date().toISOString();

    // Find quotes that should be expired
    const { data: expiredQuotes, error } = await supabase
      .from(`${TABLE_PREFIX}_quotes`)
      .select("id")
      .eq("site_id", siteId)
      .in("status", ["sent", "viewed"])
      .lt("valid_until", now);

    if (error || !expiredQuotes) {
      return { count: 0 };
    }

    // Update each to expired
    for (const quote of expiredQuotes) {
      await supabase
        .from(`${TABLE_PREFIX}_quotes`)
        .update({
          status: "expired",
          updated_at: now,
        })
        .eq("id", quote.id);

      await supabase.from(`${TABLE_PREFIX}_quote_activities`).insert({
        quote_id: quote.id,
        activity_type: "expired",
        description: "Quote expired automatically",
      });
    }

    revalidatePath(`/sites/${siteId}/ecommerce`);

    return { count: expiredQuotes.length };
  } catch (error) {
    console.error("Error marking expired quotes:", error);
    return { count: 0 };
  }
}
