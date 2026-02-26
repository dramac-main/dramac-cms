/**
 * Agency Branding Types
 * 
 * Phase WL-01: White-Label Branding Foundation
 * Types for per-agency branding configuration stored in agency_branding table.
 */

export interface AgencyBranding {
  id: string;
  agency_id: string;

  // Core Identity
  agency_display_name: string;
  tagline: string | null;

  // Logos (Supabase Storage paths)
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  apple_touch_icon_url: string | null;

  // Colors (hex values)
  primary_color: string;
  primary_foreground: string;
  accent_color: string;
  accent_foreground: string;

  // Email Branding
  email_from_name: string | null;
  email_reply_to: string | null;
  email_footer_text: string | null;
  email_footer_address: string | null;
  email_logo_url: string | null;
  email_social_links: Record<string, string>;

  // Portal Branding
  portal_welcome_title: string | null;
  portal_welcome_subtitle: string | null;
  portal_login_background_url: string | null;
  portal_custom_css: string | null;

  // Legal / Footer
  support_email: string | null;
  support_url: string | null;
  privacy_policy_url: string | null;
  terms_of_service_url: string | null;

  // White-Label Level
  white_label_level: "basic" | "full" | "custom";

  created_at: string;
  updated_at: string;
}

/** Default branding fallback when agency hasn't configured branding */
export const DEFAULT_BRANDING: Omit<AgencyBranding, "id" | "agency_id" | "created_at" | "updated_at"> = {
  agency_display_name: "Your Agency",
  tagline: null,
  logo_url: null,
  logo_dark_url: null,
  favicon_url: null,
  apple_touch_icon_url: null,
  primary_color: "#0F172A",
  primary_foreground: "#FFFFFF",
  accent_color: "#0F172A",
  accent_foreground: "#FFFFFF",
  email_from_name: null,
  email_reply_to: null,
  email_footer_text: null,
  email_footer_address: null,
  email_logo_url: null,
  email_social_links: {},
  portal_welcome_title: null,
  portal_welcome_subtitle: null,
  portal_login_background_url: null,
  portal_custom_css: null,
  support_email: null,
  support_url: null,
  privacy_policy_url: null,
  terms_of_service_url: null,
  white_label_level: "basic",
};

/** Branding form data for the settings page */
export type BrandingFormData = Omit<AgencyBranding, "id" | "agency_id" | "created_at" | "updated_at">;
