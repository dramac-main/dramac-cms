/**
 * Platform Constants
 * 
 * Phase WL-01: White-Label Branding Foundation
 * 
 * Centralized platform identity constants.
 * These are used for platform-level infrastructure only (super admin, internal).
 * Agency-facing UI should use BrandingProvider/useBranding() instead.
 */

export const PLATFORM = {
  /** Platform brand name — only shown in super admin UI */
  name: "Dramac",
  /** Primary platform domain */
  domain: "dramacagency.com",
  /** Dashboard app domain */
  appDomain: "app.dramacagency.com",
  /** Default support email */
  supportEmail: "support@dramacagency.com",
  /** Legal entity name */
  legalName: "Dramac Agency Ltd",
  /** Default email sender domain */
  emailDomain: "app.dramacagency.com",
} as const;

export type Platform = typeof PLATFORM;
