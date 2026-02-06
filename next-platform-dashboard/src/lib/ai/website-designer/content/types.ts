/**
 * PHASE AWD-06: Content Generation Engine
 * Type Definitions for Content Generation
 *
 * These types define the structure of AI-generated content for all website sections.
 * The Content Generation Engine uses these to create conversion-optimized copy.
 */

// =============================================================================
// CONTENT TONE & STYLE TYPES
// =============================================================================

/**
 * Content tone options that affect voice and messaging
 */
export type ContentTone =
  | "professional"
  | "friendly"
  | "authoritative"
  | "playful"
  | "inspirational"
  | "urgent"
  | "conversational"
  | "technical";

/**
 * Content style configuration
 */
export interface ContentStyle {
  /** Level of formality in the writing */
  formality: "formal" | "casual" | "neutral";
  /** Preferred content length */
  length: "concise" | "moderate" | "detailed";
  /** Language complexity */
  complexity: "simple" | "moderate" | "sophisticated";
  /** Persuasion intensity */
  persuasion: "soft" | "moderate" | "aggressive";
}

// =============================================================================
// CONTENT CONTEXT TYPES
// =============================================================================

/**
 * Business information for content generation context
 */
export interface BusinessIdentity {
  name: string;
  industry: string;
  description?: string;
  uniqueValueProposition?: string;
  targetAudience?: string;
  competitors?: string[];
}

/**
 * Complete context for content generation
 */
export interface ContentGenerationContext {
  business: BusinessIdentity;
  tone: ContentTone;
  style: ContentStyle;
  seoKeywords?: string[];
}

// =============================================================================
// GENERIC SECTION CONTENT
// =============================================================================

/**
 * Generic content elements that can be generated for any section
 */
export interface SectionContent {
  headlines: string[];
  subheadlines: string[];
  bodyText: string[];
  bulletPoints: string[];
  ctaText: string[];
  supportingText: string[];
}

// =============================================================================
// SPECIFIC SECTION CONTENT TYPES
// =============================================================================

/**
 * Hero section content
 */
export interface HeroContent {
  headline: string;
  subheadline: string;
  ctaPrimary: string;
  ctaSecondary?: string;
  badge?: string;
  socialProof?: string;
}

/**
 * Features/services section content
 */
export interface FeaturesContent {
  sectionTitle: string;
  sectionSubtitle: string;
  features: {
    title: string;
    description: string;
    icon?: string;
  }[];
}

/**
 * Testimonials section content
 */
export interface TestimonialsContent {
  sectionTitle: string;
  sectionSubtitle: string;
  ctaText?: string;
}

/**
 * Call-to-action section content
 */
export interface CTAContent {
  headline: string;
  subheadline: string;
  ctaText: string;
  urgencyText?: string;
  trustIndicators?: string[];
}

/**
 * About section content
 */
export interface AboutContent {
  headline: string;
  story: string;
  mission?: string;
  vision?: string;
  values?: { title: string; description: string }[];
  stats?: { value: string; label: string }[];
}

/**
 * Contact section content
 */
export interface ContactContent {
  headline: string;
  subheadline: string;
  formTitle?: string;
  submitButtonText: string;
  contactMethods?: { method: string; value: string; icon: string }[];
}

/**
 * FAQ section content
 */
export interface FAQContent {
  sectionTitle: string;
  sectionSubtitle: string;
  items: { question: string; answer: string }[];
}

/**
 * Pricing section content
 */
export interface PricingContent {
  sectionTitle: string;
  sectionSubtitle: string;
  plans: {
    name: string;
    description: string;
    price: string;
    period: string;
    features: string[];
    ctaText: string;
    isPopular?: boolean;
  }[];
}

/**
 * Team section content
 */
export interface TeamContent {
  sectionTitle: string;
  sectionSubtitle: string;
  memberBioTemplate?: string;
}

/**
 * Services section content
 */
export interface ServicesContent {
  sectionTitle: string;
  sectionSubtitle: string;
  services: {
    title: string;
    description: string;
    features?: string[];
    ctaText?: string;
  }[];
}

/**
 * Gallery/Portfolio section content
 */
export interface GalleryContent {
  sectionTitle: string;
  sectionSubtitle: string;
  ctaText?: string;
}

/**
 * Blog/News section content
 */
export interface BlogContent {
  sectionTitle: string;
  sectionSubtitle: string;
  ctaText?: string;
}

/**
 * Stats/Numbers section content
 */
export interface StatsContent {
  sectionTitle?: string;
  stats: {
    value: string;
    label: string;
    description?: string;
  }[];
}

// =============================================================================
// AGGREGATED CONTENT TYPES
// =============================================================================

/**
 * Complete generated content for a website
 */
export interface GeneratedContent {
  hero?: HeroContent;
  features?: FeaturesContent;
  testimonials?: TestimonialsContent;
  cta?: CTAContent;
  about?: AboutContent;
  contact?: ContactContent;
  faq?: FAQContent;
  pricing?: PricingContent;
  team?: TeamContent;
  services?: ServicesContent;
  gallery?: GalleryContent;
  blog?: BlogContent;
  stats?: StatsContent;
}

// =============================================================================
// CTA PURPOSE TYPES
// =============================================================================

/**
 * CTA purpose types for different conversion goals
 */
export type CTAPurpose =
  | "primary"
  | "contact"
  | "newsletter"
  | "demo"
  | "quote"
  | "booking"
  | "signup"
  | "download";

// =============================================================================
// INDUSTRY TEMPLATE TYPES
// =============================================================================

/**
 * Industry-specific content template
 */
export interface IndustryContentTemplate {
  heroHeadlines: string[];
  ctaTexts: string[];
  featureIcons: string[];
  faqTopics: string[];
  valueProps: string[];
  testimonialPrompts?: string[];
  pricingModels?: string[];
}

// =============================================================================
// CONTENT ANALYSIS TYPES
// =============================================================================

/**
 * Content analysis results
 */
export interface ContentAnalysis {
  readabilityScore: number;
  seoScore: number;
  conversionScore: number;
  suggestions: string[];
}

/**
 * Content length requirements
 */
export interface ContentLengthRequirements {
  [field: string]: { min: number; max: number };
}

/**
 * Content validation result
 */
export interface ContentValidation {
  valid: boolean;
  issues: string[];
}
