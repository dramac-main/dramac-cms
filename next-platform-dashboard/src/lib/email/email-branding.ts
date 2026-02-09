/**
 * Email Branding System
 * 
 * Phase WL-02: Email System Overhaul
 * 
 * Provides branding types and utilities for agency-branded transactional emails.
 * Every email sent to customers shows the agency's brand, not "Dramac".
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
