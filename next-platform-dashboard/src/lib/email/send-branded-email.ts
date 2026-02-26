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

import { resend, isEmailEnabled, getEmailFrom, getEmailReplyTo } from "./resend-client";
import { buildEmailBranding, applySiteBranding, type EmailBranding, type SiteBrandingData } from "./email-branding";
import { renderBrandedTemplate } from "./templates/branded-templates";
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
  options: SendBrandedEmailOptions
): Promise<EmailResult> {
  if (!isEmailEnabled()) {
    console.log("[Email] Skipping email send - RESEND_API_KEY not configured");
    return { success: true, messageId: "skipped-no-api-key" };
  }

  try {
    // 0. Check notification preferences (opt-out check)
    if (options.recipientUserId) {
      const allowed = await shouldSendEmail(options.recipientUserId, options.emailType);
      if (!allowed) {
        console.log(`[Email] User ${options.recipientUserId} opted out of ${options.emailType} emails`);
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
        console.warn("[Email] Failed to fetch site branding, using agency branding:", err);
      }
    }

    // 3. Render branded template
    const { subject, html, text } = renderBrandedTemplate(
      options.emailType,
      options.data,
      branding
    );

    // 4. Format recipients
    const toArray = Array.isArray(options.to) ? options.to : [options.to];
    const toEmails = toArray.map((r) =>
      r.name ? `${r.name} <${r.email}>` : r.email
    );

    // 5. Build from/replyTo with branding
    const from = branding.from_name
      ? `${branding.from_name} <noreply@${process.env.EMAIL_DOMAIN || "app.dramacagency.com"}>`
      : getEmailFrom();
    const replyTo = branding.reply_to || getEmailReplyTo();

    console.log(
      `[Email] Sending branded ${options.emailType} email to ${toEmails.join(", ")} (from: ${branding.from_name})`
    );

    // 6. Send via Resend
    const { data, error } = await resend.emails.send({
      from,
      to: toEmails,
      replyTo,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      return { success: false, error: error.message };
    }

    // 7. Log to email_logs (fire-and-forget)
    logEmailSent({
      agencyId: agencyId || undefined,
      recipientUserId: options.recipientUserId,
      resendId: data?.id,
      toEmail: toArray[0]?.email || "",
      fromName: branding.from_name,
      subject,
      emailType: options.emailType,
    }).catch((err) => console.error("[Email] Log error:", err));

    console.log(
      `[Email] Successfully sent branded ${options.emailType} email, ID: ${data?.id}`
    );
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("[Email] Send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending email",
    };
  }
}

/**
 * Log email send to email_logs table (fire-and-forget).
 */
async function logEmailSent(params: {
  agencyId?: string;
  recipientUserId?: string;
  resendId?: string;
  toEmail: string;
  fromName: string;
  subject: string;
  emailType: string;
}): Promise<void> {
  try {
    // Dynamic import to avoid circular deps
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("email_logs")
      .insert({
        agency_id: params.agencyId || null,
        recipient_user_id: params.recipientUserId || null,
        resend_id: params.resendId || null,
        to_email: params.toEmail,
        from_name: params.fromName,
        subject: params.subject,
        email_type: params.emailType,
        status: "sent",
        sent_at: new Date().toISOString(),
      });
  } catch {
    // Non-critical — don't let logging break email sending
  }
}

// ============================================================================
// Site Branding Fetcher
// ============================================================================

// In-memory cache for site branding (3 minute TTL)
const siteBrandingCache = new Map<string, { data: SiteBrandingData | null; expiry: number }>();
const SITE_CACHE_TTL = 3 * 60 * 1000;

/**
 * Fetch site name and branding settings from the database.
 * Cached in-memory for 3 minutes to avoid repeated DB calls.
 */
async function fetchSiteBranding(siteId: string): Promise<SiteBrandingData | null> {
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
      siteBrandingCache.set(siteId, { data: null, expiry: Date.now() + SITE_CACHE_TTL });
      return null;
    }

    const settings = (site.settings || {}) as Record<string, unknown>;
    const result: SiteBrandingData = {
      name: site.name || "",
      primary_color: (settings.primary_color as string) || null,
      accent_color: (settings.accent_color as string) || null,
      secondary_color: (settings.secondary_color as string) || null,
      // Sites don't have a logo_url column directly — check settings for one
      logo_url: (settings.logo_url as string) || (settings.site_logo_url as string) || null,
    };

    siteBrandingCache.set(siteId, { data: result, expiry: Date.now() + SITE_CACHE_TTL });
    return result;
  } catch (err) {
    console.error("[Email] Error fetching site branding:", err);
    return null;
  }
}
