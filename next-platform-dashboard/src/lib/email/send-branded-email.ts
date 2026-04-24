/**
 * Send Branded Email
 *
 * Phase WL-02: Email System Overhaul
 * Phase BRAND-AUDIT: Added site-level branding for customer-facing emails
 *
 * Wrapper around sendEmail() that automatically fetches agency branding
 * and renders branded templates. This is the primary email sending function
 * for all agency-context emails.
 *
 * When siteId is provided, customer-facing emails show the SITE's name and
 * colors instead of the agency's. This ensures booking/order confirmation
 * emails look like they come from "Jesto Spa" rather than the agency.
 */

import {
  resend,
  isEmailEnabled,
  getEmailFrom,
  getEmailReplyTo,
} from "./resend-client";
import {
  buildEmailBranding,
  applySiteBranding,
  type EmailBranding,
  type SiteBrandingData,
} from "./email-branding";
import { resolveEmailTemplate } from "./template-resolver";
import { shouldSendEmail } from "./notification-prefs";
import { getAgencyBranding } from "@/lib/queries/branding";
import type { EmailType, EmailRecipient, EmailResult } from "./email-types";

export interface SendBrandedEmailOptions {
  /** Recipient(s) */
  to: EmailRecipient | EmailRecipient[];
  /** Email template type */
  emailType: EmailType;
  /** Template data */
  data: Record<string, unknown>;
  /** Recipient user ID (for unsubscribe links) */
  recipientUserId?: string;
  /**
   * Site ID for site-level branding.
   * When provided, the email header/footer will show the site's name and colors
   * instead of the agency's. Use this for all CUSTOMER-FACING emails
   * (booking confirmations, order confirmations, etc.)
   */
  siteId?: string;
  /**
   * Custom subject line — overrides the template's default subject.
   * Supports merge variables like {{customerName}}.
   */
  subjectOverride?: string;
  /**
   * Custom body text to prepend to the branded template body.
   * HTML supported. Supports merge variables.
   */
  bodyOverride?: string;
  /**
   * Portal Session 2: link the email_logs row to a previously-created
   * portal_send_log row so the delivery webhook can correlate events.
   */
  sendLogId?: string | null;
}

/**
 * Send an agency-branded transactional email.
 *
 * 1. Fetches agency branding from DB (cached)
 * 2. Builds email branding config
 * 3. Renders branded HTML template
 * 4. Sends via Resend
 * 5. Logs to email_logs table
 *
 * @param agencyId - The agency whose branding to use
 * @param options - Email options
 */
export async function sendBrandedEmail(
  agencyId: string | null,
  options: SendBrandedEmailOptions,
): Promise<EmailResult> {
  if (!isEmailEnabled()) {
    console.log("[Email] Skipping email send - RESEND_API_KEY not configured");
    return { success: true, messageId: "skipped-no-api-key" };
  }

  try {
    // 0. Check notification preferences (opt-out check)
    if (options.recipientUserId) {
      const allowed = await shouldSendEmail(
        options.recipientUserId,
        options.emailType,
      );
      if (!allowed) {
        console.log(
          `[Email] User ${options.recipientUserId} opted out of ${options.emailType} emails`,
        );
        return { success: true, messageId: "skipped-user-opted-out" };
      }
    }

    // 1. Fetch agency branding (cached, returns null if not configured)
    const agencyBranding = agencyId ? await getAgencyBranding(agencyId) : null;

    // 2. Build email branding from agency data
    let branding = buildEmailBranding(agencyBranding, options.recipientUserId);

    // 2b. Apply site-level branding overlay for customer-facing emails
    // When siteId is provided, the email shows the site's name and colors
    // instead of the agency's. This is critical for booking/order emails
    // where customers expect to see the business they interacted with.
    if (options.siteId) {
      try {
        const siteBranding = await fetchSiteBranding(options.siteId);
        if (siteBranding) {
          branding = applySiteBranding(branding, siteBranding);
        }
      } catch (err) {
        // Non-critical — fall back to agency branding if site fetch fails
        console.warn(
          "[Email] Failed to fetch site branding, using agency branding:",
          err,
        );
      }
    }

    // 3. Render template (checks site-owner customizations first, falls back to hardcoded)
    let { subject, html, text } = await resolveEmailTemplate(
      options.emailType,
      options.data,
      branding,
      options.siteId,
    );

    // 3b. Apply user overrides from workflow step config (if provided)
    if (options.subjectOverride) {
      // Simple merge-variable substitution for the override
      subject = substituteMergeVarsSimple(options.subjectOverride, options.data);
    }
    if (options.bodyOverride) {
      const overrideHtml = substituteMergeVarsSimple(options.bodyOverride, options.data);
      // Prepend the custom body to the template content
      html = html.replace(
        /(<div[^>]*style="[^"]*padding:\s*24px[^"]*"[^>]*>)/i,
        `$1<div style="margin-bottom:16px">${overrideHtml}</div>`,
      );
      text = `${overrideHtml.replace(/<[^>]+>/g, "")}\n\n${text}`;
    }

    // 4. Format recipients
    const toArray = Array.isArray(options.to) ? options.to : [options.to];
    const toEmails = toArray.map((r) =>
      r.name ? `${r.name} <${r.email}>` : r.email,
    );

    // 5. Build from/replyTo with branding
    const from = branding.from_name
      ? `${branding.from_name} <noreply@${process.env.EMAIL_DOMAIN || "app.dramacagency.com"}>`
      : getEmailFrom();
    const replyTo = branding.reply_to || getEmailReplyTo();

    console.log(
      `[Email] Sending branded ${options.emailType} email to ${toEmails.join(", ")} (from: ${branding.from_name})`,
    );

    // 6. Send via Resend with bounded retry for transient failures.
    //    Retry budget: 3 attempts total, 200ms → 800ms → 3.2s.
    //    Non-transient errors (invalid recipient, auth, quota-exceeded) fail
    //    fast without retry.
    let lastError: { name?: string; message: string; statusCode?: number } | null = null;
    let data: { id?: string } | null = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 3;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      attempts = attempt;
      const resp = await resend.emails.send({
        from,
        to: toEmails,
        replyTo,
        subject,
        html,
        text,
      });
      if (!resp.error) {
        data = resp.data ?? null;
        lastError = null;
        break;
      }
      lastError = {
        name: (resp.error as { name?: string }).name,
        message: resp.error.message,
        statusCode: (resp.error as { statusCode?: number }).statusCode,
      };
      if (!isTransientResendError(lastError) || attempt === MAX_ATTEMPTS) {
        break;
      }
      const delayMs = 200 * Math.pow(4, attempt - 1);
      await new Promise((r) => setTimeout(r, delayMs));
    }

    if (lastError) {
      console.error(`[Email] Resend error after ${attempts} attempt(s):`, lastError);
      // Best-effort: log the failure to email_logs too so the outbox shows it.
      logEmailSent({
        agencyId: agencyId || undefined,
        siteId: options.siteId,
        recipientUserId: options.recipientUserId,
        resendId: null,
        toEmail: toArray[0]?.email || "",
        fromEmail: from,
        subject,
        emailType: options.emailType,
        status: "failed",
        errorMessage: lastError.message,
        attempt: attempts,
        sendLogId: options.sendLogId ?? null,
      }).catch(() => {});
      return { success: false, error: lastError.message };
    }

    // 7. Log to email_logs (fire-and-forget)
    logEmailSent({
      agencyId: agencyId || undefined,
      siteId: options.siteId,
      recipientUserId: options.recipientUserId,
      resendId: data?.id ?? null,
      toEmail: toArray[0]?.email || "",
      fromEmail: from,
      subject,
      emailType: options.emailType,
      status: "sent",
      errorMessage: null,
      attempt: attempts,
      sendLogId: options.sendLogId ?? null,
    }).catch((err) => console.error("[Email] Log error:", err));

    console.log(
      `[Email] Successfully sent branded ${options.emailType} email, ID: ${data?.id}`,
    );
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("[Email] Send error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error sending email",
    };
  }
}

/**
 * Simple merge-variable substitution for user-provided overrides.
 * Replaces {{key}} placeholders with values from the data object.
 */
function substituteMergeVarsSimple(
  template: string,
  data: Record<string, unknown>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    return data[key] !== undefined && data[key] !== null
      ? String(data[key])
      : "";
  });
}

/**
 * Log email send to email_logs table (fire-and-forget).
 * Columns match `migrations/portal-02-communication.sql`.
 */
async function logEmailSent(params: {
  agencyId?: string;
  siteId?: string;
  recipientUserId?: string;
  resendId?: string | null;
  toEmail: string;
  fromEmail: string;
  subject: string;
  emailType: string;
  status: "sent" | "failed" | "queued" | "skipped";
  errorMessage?: string | null;
  attempt?: number;
  sendLogId?: string | null;
}): Promise<void> {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("email_logs").insert({
      agency_id: params.agencyId ?? null,
      site_id: params.siteId ?? null,
      recipient_user_id: params.recipientUserId ?? null,
      resend_message_id: params.resendId ?? null,
      to_email: params.toEmail,
      from_email: params.fromEmail,
      subject: params.subject,
      email_type: params.emailType,
      status: params.status,
      error_message: params.errorMessage ?? null,
      attempt: params.attempt ?? 1,
      send_log_id: params.sendLogId ?? null,
    });
  } catch {
    // Non-critical — don't let logging break email sending
  }
}

/**
 * Classify a Resend error as transient (retry) vs permanent (fail fast).
 * Rate limit, 5xx, network/timeout → transient. Everything else → permanent.
 */
function isTransientResendError(err: {
  name?: string;
  message: string;
  statusCode?: number;
}): boolean {
  const status = err.statusCode ?? 0;
  if (status === 429) return true;
  if (status >= 500 && status < 600) return true;
  const msg = (err.message || "").toLowerCase();
  if (
    msg.includes("timeout") ||
    msg.includes("econnreset") ||
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("temporarily")
  ) {
    return true;
  }
  return false;
}

// ============================================================================
// Site Branding Fetcher
// ============================================================================

// In-memory cache for site branding (3 minute TTL)
const siteBrandingCache = new Map<
  string,
  { data: SiteBrandingData | null; expiry: number }
>();
const SITE_CACHE_TTL = 3 * 60 * 1000;

/**
 * Fetch site name and branding settings from the database.
 * Cached in-memory for 3 minutes to avoid repeated DB calls.
 */
async function fetchSiteBranding(
  siteId: string,
): Promise<SiteBrandingData | null> {
  // Check cache
  const cached = siteBrandingCache.get(siteId);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();

    const { data: site, error } = await supabase
      .from("sites")
      .select("name, settings")
      .eq("id", siteId)
      .single();

    if (error || !site) {
      siteBrandingCache.set(siteId, {
        data: null,
        expiry: Date.now() + SITE_CACHE_TTL,
      });
      return null;
    }

    const settings = (site.settings || {}) as Record<string, unknown>;

    // Also fetch the store's support email from ecommerce settings (if module is active)
    let storeEmail: string | null = null;
    try {
      const { data: ecomSettings } = await supabase
        .from("mod_ecommod01_settings")
        .select("store_email")
        .eq("site_id", siteId)
        .single();
      storeEmail = ecomSettings?.store_email || null;
    } catch {
      // Ecommerce module may not be active for this site — that's fine
    }

    const result: SiteBrandingData = {
      name: site.name || "",
      primary_color: (settings.primary_color as string) || null,
      accent_color: (settings.accent_color as string) || null,
      secondary_color: (settings.secondary_color as string) || null,
      // Sites don't have a logo_url column directly — check settings for one
      logo_url:
        (settings.logo_url as string) ||
        (settings.site_logo_url as string) ||
        null,
      // Store email for "Contact Support" links and reply-to in customer emails
      support_email: storeEmail,
    };

    siteBrandingCache.set(siteId, {
      data: result,
      expiry: Date.now() + SITE_CACHE_TTL,
    });
    return result;
  } catch (err) {
    console.error("[Email] Error fetching site branding:", err);
    return null;
  }
}
