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
}

export interface LandingPage {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  description?: string | null;
  status: LandingPageStatus;
  contentJson: LandingPageBlock[];
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
  | "consultation";

export interface LandingPageTemplate {
  id: LandingPageTemplateId;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  blocks: LandingPageBlock[];
  defaultSeo: SeoConfig;
}
