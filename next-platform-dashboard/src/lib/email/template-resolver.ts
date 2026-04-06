/**
 * Email Template Resolver
 *
 * Phase MSG-TEMPLATES: Wires site-owner email template customizations to the
 * actual email sending pipeline.
 *
 * Resolution order:
 * 1. Check DB for site-owner customized template (notification_settings.templates[])
 * 2. If found and enabled → substitute merge variables ({{var}}) into subject/body
 * 3. If not found or disabled → fall back to the hardcoded branded template
 *
 * The "body" field from the DB templates is plain text with merge variables.
 * We wrap it in the same base email template used by branded-templates.ts so
 * styling remains consistent.
 */

import type { EmailBranding } from "./email-branding";
import type { EmailType } from "./email-types";
import type { NotificationTemplate } from "@/modules/ecommerce/types/ecommerce-types";
import { renderBrandedTemplate } from "./templates/branded-templates";
import { baseEmailTemplate, EMAIL_STYLES } from "./templates/base-template";

/**
 * Map from EmailType → NotificationTemplate.type.
 * Only types that have a NotificationTemplateType equivalent are listed.
 * EmailTypes not in this map (e.g. "welcome", "password_reset") are never
 * customizable and always use the hardcoded template.
 */
const EMAIL_TYPE_TO_TEMPLATE_TYPE: Partial<
  Record<EmailType, NotificationTemplate["type"]>
> = {
  // Booking
  booking_confirmation_customer: "booking_confirmation_customer",
  booking_confirmation_owner: "booking_confirmation_owner",
  booking_cancelled_customer: "booking_cancelled_customer",
  booking_cancelled_owner: "booking_cancelled_owner",
  booking_confirmed_customer: "booking_confirmed_customer",
  booking_confirmed_owner: "booking_confirmed_owner",
  booking_completed_customer: "booking_completed_customer",
  booking_completed_owner: "booking_completed_owner",
  booking_no_show_customer: "booking_no_show_customer",
  booking_payment_received_customer: "booking_payment_received_customer",
  booking_payment_received_owner: "booking_payment_received_owner",
  // E-Commerce Orders
  order_confirmation_customer: "order_confirmation_customer",
  order_confirmation_owner: "order_confirmation_owner",
  order_shipped_customer: "order_shipped_customer",
  order_delivered_customer: "order_delivered_customer",
  order_cancelled_customer: "order_cancelled_customer",
  order_cancelled_owner: "order_cancelled_owner",
  // Payments
  payment_received_customer: "payment_received_customer",
  payment_proof_uploaded_owner: "payment_proof_uploaded_owner",
  payment_proof_rejected_customer: "payment_proof_rejected_customer",
  refund_issued_customer: "refund_issued_customer",
  // Stock & Cart
  low_stock_admin: "low_stock_admin",
  back_in_stock_customer: "back_in_stock_customer",
  abandoned_cart_customer: "abandoned_cart_customer",
  // Quotes
  quote_sent_customer: "quote_sent_customer",
  quote_request_customer: "quote_request_customer",
  quote_reminder_customer: "quote_reminder_customer",
  quote_request_owner: "quote_request_owner",
  quote_accepted_owner: "quote_accepted_owner",
  quote_accepted_customer: "quote_accepted_customer",
  quote_rejected_owner: "quote_rejected_owner",
  // Forms
  form_submission_owner: "form_submission_owner",
  // Reviews
  review_request_customer: "review_request_customer",
  // Chat
  chat_transcript: "chat_transcript",
  chat_missed_notification: "chat_missed_notification",
};

// In-memory cache for notification settings. TTL = 2 minutes.
const settingsCache = new Map<
  string,
  { templates: NotificationTemplate[]; expiry: number }
>();
const SETTINGS_CACHE_TTL = 2 * 60 * 1000;

/**
 * Fetch the site's notification templates from the ecommerce settings.
 * Cached in-memory (2 min TTL) to avoid repeated DB hits on burst emails.
 */
async function fetchSiteTemplates(
  siteId: string,
): Promise<NotificationTemplate[]> {
  const cached = settingsCache.get(siteId);
  if (cached && cached.expiry > Date.now()) {
    return cached.templates;
  }

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("mod_ecommod01_settings")
      .select("notification_settings")
      .eq("site_id", siteId)
      .single();

    if (error || !data?.notification_settings?.templates) {
      settingsCache.set(siteId, {
        templates: [],
        expiry: Date.now() + SETTINGS_CACHE_TTL,
      });
      return [];
    }

    const templates: NotificationTemplate[] =
      data.notification_settings.templates;
    settingsCache.set(siteId, {
      templates,
      expiry: Date.now() + SETTINGS_CACHE_TTL,
    });
    return templates;
  } catch {
    return [];
  }
}

/**
 * Substitute {{variable}} placeholders in a string with data values.
 * Unmatched variables are left as-is (so broken templates show the placeholder
 * rather than blank text).
 */
function substituteMergeVars(
  template: string,
  data: Record<string, unknown>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = data[key];
    if (value === undefined || value === null) return match;
    return String(value);
  });
}

/**
 * Convert a plain text body (with line breaks) to simple branded HTML.
 * Each paragraph becomes a <p> tag. This keeps the same visual style as
 * the hardcoded templates while allowing site owners to write plain text.
 */
function textBodyToHtml(body: string, branding: EmailBranding): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const htmlParagraphs = paragraphs
    .map((p) => {
      // Convert single newlines within a paragraph to <br>
      const withBreaks = p.replace(/\n/g, "<br>");
      return `<p style="${EMAIL_STYLES.text}">${withBreaks}</p>`;
    })
    .join("\n      ");

  return baseEmailTemplate(
    branding,
    htmlParagraphs,
    body.substring(0, 150).replace(/\n/g, " "),
  );
}

/**
 * Resolve an email template for sending.
 *
 * If the site has a customized template for this email type (saved via the
 * notification settings UI), we use it — substituting merge variables and
 * wrapping the body in the branded base template.
 *
 * Otherwise, we fall back to the hardcoded branded template.
 *
 * @param emailType - The email type being sent
 * @param data - Template data (merge variables)
 * @param branding - Agency/site branding config
 * @param siteId - Site ID (optional — if not provided, always uses hardcoded)
 */
export async function resolveEmailTemplate(
  emailType: EmailType,
  data: Record<string, unknown>,
  branding: EmailBranding,
  siteId?: string,
): Promise<{ subject: string; html: string; text: string }> {
  // 1. Check if this email type is customizable
  const templateType = EMAIL_TYPE_TO_TEMPLATE_TYPE[emailType];

  if (siteId && templateType) {
    // 2. Fetch site's saved templates
    const templates = await fetchSiteTemplates(siteId);

    // 3. Find a matching template that's enabled
    const customTemplate = templates.find(
      (t) => t.type === templateType && t.enabled,
    );

    if (customTemplate && customTemplate.subject && customTemplate.body) {
      // 4. Build merge variable data with common fields
      const mergeData: Record<string, unknown> = {
        ...data,
        store_name: branding.agency_name,
        business_name: branding.agency_name,
        support_email: branding.support_email || "",
      };

      // 5. Substitute merge variables
      const subject = substituteMergeVars(customTemplate.subject, mergeData);
      const bodyText = substituteMergeVars(customTemplate.body, mergeData);
      const html = textBodyToHtml(bodyText, branding);

      console.log(
        `[TemplateResolver] Using custom template for ${emailType} (site: ${siteId})`,
      );
      return { subject, html, text: bodyText };
    }
  }

  // 5. Fall back to hardcoded branded template
  return renderBrandedTemplate(emailType, data, branding);
}

/**
 * Invalidate the settings cache for a site. Call this when notification
 * settings are updated so the next email uses the fresh templates.
 */
export function invalidateTemplateCache(siteId: string): void {
  settingsCache.delete(siteId);
}
