/**
 * Email Branding System
 * 
 * Phase WL-02: Email System Overhaul
 * Phase BRAND-AUDIT: Added site-level branding for customer-facing emails
 * 
 * Provides branding types and utilities for branded transactional emails.
 * 
 * TWO LEVELS OF BRANDING:
 * - Agency branding: Used for owner/internal emails (dashboard context)
 * - Site branding: Used for customer-facing emails (booking confirmations,
 *   order confirmations, etc.) — shows the site name, colors, and logo
 *   so customers see the business they interacted with, not the agency.
 */

import type { AgencyBranding } from "@/types/branding";
import { PLATFORM } from "@/lib/constants/platform";

/**
 * Branding configuration for email rendering.
 * Built from AgencyBranding database record.
 */
export interface EmailBranding {
  // Sender
  from_name: string;
  reply_to: string;

  // Visual
  logo_url: string | null;
  primary_color: string;
  accent_color: string;

  // Footer
  agency_name: string;
  footer_text: string | null;
  footer_address: string | null;
  support_email: string | null;
  support_url: string | null;
  privacy_policy_url: string | null;
  unsubscribe_url: string | null;

  // Social
  social_links: Record<string, string>;
}

/** Default branding when no agency branding is configured */
const DEFAULT_EMAIL_BRANDING: EmailBranding = {
  from_name: PLATFORM.name,
  reply_to: `support@${PLATFORM.emailDomain}`,
  logo_url: null,
  primary_color: "#0F172A",
  accent_color: "#3B82F6",
  agency_name: PLATFORM.name,
  footer_text: null,
  footer_address: null,
  support_email: PLATFORM.supportEmail,
  support_url: null,
  privacy_policy_url: null,
  unsubscribe_url: null,
  social_links: {},
};

/**
 * Build EmailBranding from an AgencyBranding database record.
 * Falls back to platform defaults when fields are not configured.
 */
export function buildEmailBranding(
  agencyBranding: AgencyBranding | null,
  recipientId?: string
): EmailBranding {
  if (!agencyBranding) {
    return {
      ...DEFAULT_EMAIL_BRANDING,
      unsubscribe_url: recipientId
        ? `${process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com"}/unsubscribe?uid=${recipientId}`
        : null,
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.dramacagency.com";

  return {
    from_name:
      agencyBranding.email_from_name ??
      agencyBranding.agency_display_name ??
      PLATFORM.name,
    reply_to:
      agencyBranding.email_reply_to ??
      agencyBranding.support_email ??
      DEFAULT_EMAIL_BRANDING.reply_to,
    logo_url:
      agencyBranding.email_logo_url ?? agencyBranding.logo_url ?? null,
    primary_color: agencyBranding.primary_color ?? DEFAULT_EMAIL_BRANDING.primary_color,
    accent_color: agencyBranding.accent_color ?? DEFAULT_EMAIL_BRANDING.accent_color,
    agency_name:
      agencyBranding.agency_display_name ?? PLATFORM.name,
    footer_text: agencyBranding.email_footer_text ?? null,
    footer_address: agencyBranding.email_footer_address ?? null,
    support_email: agencyBranding.support_email ?? DEFAULT_EMAIL_BRANDING.support_email,
    support_url: agencyBranding.support_url ?? null,
    privacy_policy_url: agencyBranding.privacy_policy_url ?? null,
    unsubscribe_url: recipientId
      ? `${appUrl}/unsubscribe?uid=${recipientId}`
      : null,
    social_links: agencyBranding.email_social_links ?? {},
  };
}

// ============================================================================
// Site-Level Branding Overlay
// ============================================================================

/**
 * Site branding data used to override agency branding in customer-facing emails.
 * Fetched from sites.name + sites.settings JSONB column.
 */
export interface SiteBrandingData {
  name: string;
  primary_color?: string | null;
  accent_color?: string | null;
  secondary_color?: string | null;
  logo_url?: string | null;
}

/**
 * Apply site-level branding on top of agency branding.
 * 
 * For customer-facing emails (booking confirmations, order confirmations, etc.),
 * the customer should see the SITE's name and colors — not the agency's.
 * A customer who booked at "Jesto Spa" should receive an email from "Jesto Spa",
 * not from the agency that manages it.
 * 
 * This overlays site-specific data onto the base agency branding:
 * - Site name replaces agency_name in header/footer
 * - Site colors replace primary/accent colors
 * - Site logo replaces header logo (if available)
 * - Other fields (social links, footer address, etc.) fall through from agency
 * 
 * @param baseBranding - The agency-level email branding (base layer)
 * @param site - The site's name and settings
 * @returns EmailBranding with site-level overrides applied
 */
export function applySiteBranding(
  baseBranding: EmailBranding,
  site: SiteBrandingData
): EmailBranding {
  return {
    ...baseBranding,
    // Site name replaces agency name in the email header, footer, and copyright
    agency_name: site.name || baseBranding.agency_name,
    // "From: Jesto Spa" instead of "From: Agency Name"
    from_name: site.name || baseBranding.from_name,
    // Footer says "Sent by Jesto Spa" (unless agency has custom footer text)
    footer_text: baseBranding.footer_text ?? `Sent by ${site.name}`,
    // Use site's primary color for the email header background
    primary_color: site.primary_color || baseBranding.primary_color,
    // Use site's accent color for buttons
    accent_color: site.accent_color || site.secondary_color || baseBranding.accent_color,
    // Use site logo if available, otherwise fall through to agency logo
    logo_url: site.logo_url || baseBranding.logo_url,
  };
}
