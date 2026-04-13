/**
 * Marketing Module - Landing Page & Form Types
 *
 * Phase MKT-06: Landing Pages & Opt-In Forms
 */

// ============================================================================
// LANDING PAGE TYPES
// ============================================================================

export type LandingPageStatus = "draft" | "published" | "archived";

export type LandingPageConversionGoal =
  | "form_submit"
  | "button_click"
  | "page_scroll";

export type LandingPageBlockType =
  | "hero"
  | "features"
  | "testimonials"
  | "pricing"
  | "faq"
  | "countdown"
  | "video"
  | "gallery"
  | "optin_form"
  | "cta"
  | "social_proof"
  | "text"
  | "image";

export interface LandingPageBlock {
  id: string;
  type: LandingPageBlockType;
  content: Record<string, unknown>;
  order: number;
}

export interface SeoConfig {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  noIndex?: boolean;
  canonicalUrl?: string;
}

// ============================================================================
// LANDING PAGE STYLE CONFIG
// ============================================================================

export interface StyleConfig {
  /** Primary brand color (hex) — used for buttons, accents, links */
  primaryColor?: string;
  /** Secondary color (hex) — used for gradients, backgrounds */
  secondaryColor?: string;
  /** Heading text color (hex) */
  headingColor?: string;
  /** Body text color (hex) */
  bodyColor?: string;
  /** Page background color (hex) */
  backgroundColor?: string;
  /** Font family for headings */
  headingFont?: string;
  /** Font family for body text */
  bodyFont?: string;
  /** Border radius token: 'none' | 'sm' | 'md' | 'lg' | 'full' */
  borderRadius?: string;
  /** Custom CSS (advanced users) */
  customCss?: string;
}

export const DEFAULT_STYLE_CONFIG: StyleConfig = {
  primaryColor: "#2563eb",
  secondaryColor: "#7c3aed",
  headingColor: "#111827",
  bodyColor: "#4b5563",
  backgroundColor: "#ffffff",
  headingFont: "system-ui, -apple-system, sans-serif",
  bodyFont: "system-ui, -apple-system, sans-serif",
  borderRadius: "md",
};

export const FONT_OPTIONS = [
  { value: "system-ui, -apple-system, sans-serif", label: "System Default" },
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "'DM Sans', sans-serif", label: "DM Sans" },
  { value: "'Plus Jakarta Sans', sans-serif", label: "Plus Jakarta Sans" },
  { value: "'Poppins', sans-serif", label: "Poppins" },
  { value: "'Montserrat', sans-serif", label: "Montserrat" },
  { value: "'Lato', sans-serif", label: "Lato" },
  { value: "'Roboto', sans-serif", label: "Roboto" },
  { value: "'Open Sans', sans-serif", label: "Open Sans" },
  { value: "'Playfair Display', serif", label: "Playfair Display" },
  { value: "'Merriweather', serif", label: "Merriweather" },
  { value: "'Georgia', serif", label: "Georgia" },
  { value: "'Fira Code', monospace", label: "Fira Code" },
];

export interface LandingPage {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  description?: string | null;
  status: LandingPageStatus;
  contentJson: LandingPageBlock[];
  styleConfig?: StyleConfig | null;
  formConfig?: Record<string, unknown> | null;
  seoConfig: SeoConfig;
  conversionGoal: LandingPageConversionGoal | string;
  templateId?: string | null;
  publishedAt?: string | null;
  totalVisits: number;
  totalConversions: number;
  conversionRate: number;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LandingPageVisit {
  id: string;
  landingPageId: string;
  visitorId: string;
  source?: string | null;
  utmParams?: UtmParamsData | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
  converted: boolean;
  visitedAt: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export type FormType =
  | "inline"
  | "popup"
  | "slide_in"
  | "top_bar"
  | "full_page"
  | "floating_bar"
  | "exit_intent";

export type FormStatus = "draft" | "active" | "paused" | "archived";

export type FormFieldType =
  | "email"
  | "text"
  | "phone"
  | "select"
  | "checkbox"
  | "hidden";

export type TriggerType =
  | "immediate"
  | "time_delay"
  | "scroll_percent"
  | "exit_intent"
  | "click";

export type SuccessActionType = "message" | "redirect" | "close";

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FormFieldType | string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  order?: number;
}

export interface FormTrigger {
  type: TriggerType;
  delaySeconds?: number;
  delay?: number;
  scrollPercent?: number;
  elementSelector?: string;
  showOncePerSession?: boolean;
  showOncePerVisitor?: boolean;
}

export interface SuccessAction {
  type: SuccessActionType;
  message?: string;
  redirectUrl?: string;
}

export interface MarketingForm {
  id: string;
  siteId: string;
  name: string;
  description?: string | null;
  formType: FormType;
  status: FormStatus;
  fields: FormField[];
  style: Record<string, unknown>;
  triggerConfig: FormTrigger | null;
  successAction: SuccessAction;
  tagsToAdd: string[];
  sequenceToEnroll?: string | null;
  listId?: string | null;
  doubleOptin: boolean;
  heading: string;
  bodyText?: string | null;
  buttonText: string;
  backgroundColor?: string | null;
  textColor?: string | null;
  buttonColor?: string | null;
  imageUrl?: string | null;
  totalViews: number;
  totalSubmissions: number;
  uniqueConversions: number;
  conversionRate: number;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FormSubmission {
  id: string;
  formId: string;
  siteId: string;
  subscriberId?: string | null;
  data: Record<string, unknown>;
  utmParams?: UtmParamsData | null;
  source?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
  landingPageId?: string | null;
  submittedAt: string;
}

// ============================================================================
// UTM TYPES
// ============================================================================

export interface UtmParamsData {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

// ============================================================================
// LANDING PAGE TEMPLATES
// ============================================================================

export type LandingPageTemplateId =
  | "lead-magnet"
  | "webinar"
  | "product-launch"
  | "coming-soon"
  | "sale-promo"
  | "ebook-download"
  | "free-trial"
  | "consultation"
  | "course-enrollment"
  | "app-download"
  | "agency-services"
  | "newsletter"
  | "fitness-health"
  | "real-estate"
  | "event-ticket";

export interface LandingPageTemplate {
  id: LandingPageTemplateId;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  blocks: LandingPageBlock[];
  defaultSeo: SeoConfig;
}
