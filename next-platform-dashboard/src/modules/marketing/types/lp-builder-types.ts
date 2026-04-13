/**
 * Landing Page Builder Pro — Type Definitions
 *
 * Types for the Studio-powered LP builder, extending the existing
 * landing page types with Studio format support.
 *
 * @phase LPB-01 — Database Migration, Type System & Component Registry Foundation
 */

// ============================================================================
// BRANDING
// ============================================================================

/** LP branding override — when null, inherits site branding */
export interface LPBrandingOverride {
  /** Override primary color (hex) */
  primaryColor?: string;
  /** Override secondary color (hex) */
  secondaryColor?: string;
  /** Override accent color (hex) */
  accentColor?: string;
  /** Override background color (hex) */
  backgroundColor?: string;
  /** Override text color (hex) */
  textColor?: string;
  /** Override heading font family */
  fontHeading?: string;
  /** Override body font family */
  fontBody?: string;
  /** Override border radius token */
  borderRadius?: "none" | "sm" | "md" | "lg" | "full";
  /** Custom logo URL for this LP */
  logoUrl?: string;
}

// ============================================================================
// SETTINGS
// ============================================================================

/** LP display settings */
export interface LPSettings {
  showHeader: boolean;
  showFooter: boolean;
  brandingOverride: LPBrandingOverride | null;
  customScripts: string;
  redirectUrl: string;
  conversionValue: number;
  maxConversions: number | null;
  isEvergreen: boolean;
  startsAt: string | null;
  endsAt: string | null;
  expiredRedirectUrl: string;
}

/** Default LP settings */
export const DEFAULT_LP_SETTINGS: LPSettings = {
  showHeader: false,
  showFooter: false,
  brandingOverride: null,
  customScripts: "",
  redirectUrl: "",
  conversionValue: 0,
  maxConversions: null,
  isEvergreen: true,
  startsAt: null,
  endsAt: null,
  expiredRedirectUrl: "",
};

// ============================================================================
// A/B TESTING
// ============================================================================

/** A/B test variant */
export interface LPVariant {
  id: string;
  name: string;
  weight: number;
}

/** A/B test configuration */
export interface LPABTestConfig {
  variants: LPVariant[];
  startedAt: string | null;
  endsAt: string | null;
  winningMetric: "conversion_rate" | "form_submissions" | "time_on_page";
  minSampleSize: number;
  confidenceThreshold: number;
}

// ============================================================================
// UTM
// ============================================================================

/** UTM tracking configuration */
export interface LPUtmConfig {
  autoAppendUtm: boolean;
  defaultSource: string;
  defaultMedium: string;
  defaultCampaign: string;
}

// ============================================================================
// ENHANCED LANDING PAGE
// ============================================================================

/** Enhanced landing page with Studio support */
export interface LandingPageStudio {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  description?: string;
  status: "draft" | "published" | "archived";

  /** Legacy block-based content (for backward compatibility) */
  contentJson?: unknown;
  /** Studio component tree content (new format) */
  contentStudio?: unknown;
  /** Whether this LP uses Studio format */
  useStudioFormat: boolean;

  /** LP display settings */
  showHeader: boolean;
  showFooter: boolean;
  brandingOverride?: LPBrandingOverride | null;
  customScripts?: string;

  /** SEO */
  seoConfig?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
    noIndex?: boolean;
    canonicalUrl?: string;
  };

  /** Conversion */
  conversionGoal: "form_submit" | "button_click" | "page_scroll";
  conversionValue: number;
  redirectUrl?: string;
  maxConversions?: number | null;

  /** Time constraints */
  isEvergreen: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  expiredRedirectUrl?: string;

  /** A/B Testing */
  abTestEnabled: boolean;
  abTestConfig?: LPABTestConfig | null;
  primaryVariantId?: string | null;

  /** Analytics */
  totalVisits: number;
  totalConversions: number;
  conversionRate: number;
  analyticsSnapshot?: unknown;

  /** UTM */
  utmTracking?: LPUtmConfig | null;

  /** Legacy style config (for non-studio LPs) */
  styleConfig?: unknown;
  formConfig?: unknown;
  templateId?: string | null;

  /** Audit */
  createdBy?: string;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// FORMS
// ============================================================================

/** LP form field definition */
export interface LPFormField {
  id: string;
  type:
    | "text"
    | "email"
    | "phone"
    | "number"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio"
    | "date"
    | "file"
    | "hidden";
  label: string;
  placeholder?: string;
  required: boolean;
  pattern?: string;
  errorMessage?: string;
  options?: { label: string; value: string }[];
  defaultValue?: string;
  width?: number;
  showWhen?: {
    fieldId: string;
    operator: "equals" | "not_equals" | "contains" | "not_empty";
    value?: string;
  };
  crmMapping?:
    | "first_name"
    | "last_name"
    | "email"
    | "phone"
    | "company"
    | "custom";
  crmCustomField?: string;
}

/** LP form component settings */
export interface LPFormSettings {
  fields: LPFormField[];
  submitButtonText: string;
  submitButtonColor?: string;
  successMessage: string;
  successAction: "message" | "redirect" | "close";
  successRedirectUrl?: string;
  createSubscriber: boolean;
  subscriberTags: string[];
  mailingListId?: string;
  sequenceId?: string;
  createCrmContact: boolean;
  doubleOptIn: boolean;
  gdprConsentText?: string;
  enableHoneypot: boolean;
  rateLimitPerHour: number;
  notifyOnSubmission: boolean;
  notificationEmails: string[];
}

/** Default form settings */
export const DEFAULT_LP_FORM_SETTINGS: LPFormSettings = {
  fields: [
    {
      id: "email",
      type: "email",
      label: "Email",
      placeholder: "Enter your email",
      required: true,
      crmMapping: "email",
    },
  ],
  submitButtonText: "Get Started",
  successMessage: "Thank you! We'll be in touch soon.",
  successAction: "message",
  createSubscriber: true,
  subscriberTags: [],
  createCrmContact: true,
  doubleOptIn: false,
  enableHoneypot: true,
  rateLimitPerHour: 10,
  notifyOnSubmission: false,
  notificationEmails: [],
};

// ============================================================================
// TEMPLATES
// ============================================================================

/** LP template categories */
export type LPTemplateCategory =
  | "lead-gen"
  | "webinar"
  | "product-launch"
  | "coming-soon"
  | "sale-promo"
  | "ebook-download"
  | "free-trial"
  | "consultation"
  | "saas-signup"
  | "app-download"
  | "agency-services"
  | "newsletter"
  | "event-registration"
  | "course-enrollment"
  | "real-estate"
  | "fitness-health";

/** LP template definition */
export interface LPTemplate {
  id: string;
  name: string;
  description: string;
  category: LPTemplateCategory;
  thumbnailUrl?: string;
  contentStudio: unknown;
  settings: Partial<LPSettings>;
  isSystem: boolean;
  usageCount?: number;
}

// ============================================================================
// ANALYTICS
// ============================================================================

/** LP analytics summary */
export interface LPAnalyticsSummary {
  totalVisits: number;
  uniqueVisitors: number;
  totalSubmissions: number;
  conversionRate: number;
  avgTimeOnPage: number;
  avgScrollDepth: number;
  bounceRate: number;
  revenueAttributed: number;
  dailyStats: {
    date: string;
    visits: number;
    conversions: number;
    conversionRate: number;
  }[];
  trafficSources: {
    source: string;
    visits: number;
    conversions: number;
  }[];
  deviceBreakdown: {
    device: string;
    visits: number;
    conversions: number;
  }[];
}

// ============================================================================
// LP FORM SUBMISSION (DB record)
// ============================================================================

export interface LPFormSubmission {
  id: string;
  siteId: string;
  landingPageId: string;
  formComponentId: string;
  data: Record<string, unknown>;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  subscriberId?: string | null;
  crmContactId?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  referrer?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceType?: "desktop" | "tablet" | "mobile" | null;
  pageVariant?: string | null;
  timeOnPage?: number | null;
  scrollDepth?: number | null;
  isDuplicate: boolean;
  createdAt: string;
}

// ============================================================================
// LP VISIT (DB record)
// ============================================================================

export interface LPVisit {
  id: string;
  siteId: string;
  landingPageId: string;
  visitorId?: string | null;
  sessionId?: string | null;
  isUnique: boolean;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  deviceType?: "desktop" | "tablet" | "mobile" | null;
  country?: string | null;
  pageVariant?: string | null;
  converted: boolean;
  timeOnPage?: number | null;
  scrollDepth?: number | null;
  createdAt: string;
}

// ============================================================================
// COMPONENT CONSTANTS
// ============================================================================

/** LP hero variant types */
export type LPHeroVariant =
  | "split-left"
  | "split-right"
  | "full-bleed"
  | "video-bg"
  | "gradient-overlay"
  | "minimal";

/** LP component type identifiers (for Studio registry) */
export const LP_COMPONENT_TYPES = {
  HERO: "LPHero",
  FORM: "LPForm",
  LOGO_BAR: "LPLogoBar",
  TRUST_BADGES: "LPTrustBadges",
  COUNTDOWN: "LPCountdown",
  TESTIMONIAL_WALL: "LPTestimonialWall",
  PRICING_TABLE: "LPPricingTable",
  FLOATING_CTA: "LPFloatingCTA",
} as const;

/** LP component category for the Studio component library */
export const LP_COMPONENT_CATEGORY = "landing-page" as const;
export const LP_COMPONENT_CATEGORY_LABEL = "Landing Page";

// ============================================================================
// LPB-10: ADMIN & PORTAL TYPES
// ============================================================================

/** Admin-level stats aggregation per site */
export interface LPAdminSiteStats {
  siteId: string;
  siteName: string;
  agencyId: string;
  agencyName: string;
  totalLps: number;
  publishedLps: number;
  draftLps: number;
  archivedLps: number;
  studioLps: number;
  legacyLps: number;
  totalVisits: number;
  totalConversions: number;
  avgConversionRate: number;
  lastLpCreatedAt: string | null;
  lastLpUpdatedAt: string | null;
}

/** Platform-wide aggregation for admin dashboard header */
export interface LPPlatformStats {
  totalLps: number;
  totalPublished: number;
  totalDraft: number;
  totalArchived: number;
  totalStudio: number;
  totalLegacy: number;
  totalVisits: number;
  totalConversions: number;
  platformConversionRate: number;
  activeSites: number;
  topPerformers: LPAdminSiteStats[];
}

/** Portal landing page view — limited fields for client access */
export interface PortalLandingPage {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  totalVisits: number;
  totalConversions: number;
  conversionRate: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  publicUrl: string;
}

// ============================================================================
// LPB-11: MIGRATION TYPES
// ============================================================================

/** Block-to-Studio migration result for a single LP */
export interface BlockMigrationResult {
  success: boolean;
  lpId: string;
  lpTitle: string;
  originalBlockCount: number;
  convertedComponentCount: number;
  warnings: string[];
  error?: string;
}

/** Batch migration progress */
export interface MigrationProgress {
  total: number;
  migrated: number;
  failed: number;
  inProgress: boolean;
  results: BlockMigrationResult[];
}

/** Migration status summary for a site */
export interface MigrationStatus {
  total: number;
  migrated: number;
  legacy: number;
  percentage: number;
}
