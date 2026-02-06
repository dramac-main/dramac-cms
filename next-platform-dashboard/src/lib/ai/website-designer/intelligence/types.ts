/**
 * PHASE AWD-04: Component Selection Intelligence
 * Type Definitions
 *
 * Types for the intelligent component selection system.
 */

import type { WebsiteDesignerPreferences } from "../types";

// =============================================================================
// INDUSTRY TEMPLATE TYPES
// =============================================================================

/**
 * Page recommendation within an industry template
 */
export interface PageRecommendation {
  name: string;
  slug: string;
  priority: number;
  required: boolean;
}

/**
 * Component preference configuration
 */
export interface ComponentPreference {
  section: string;
  preferred: string[];
  variant?: string;
  config?: Record<string, unknown>;
}

/**
 * Design token recommendations for an industry
 */
export interface DesignTokenRecommendation {
  colorMood: "warm" | "cool" | "neutral" | "professional" | "vibrant" | "calm" | "bold" | "minimal";
  typography: "modern" | "elegant" | "clean" | "strong" | "serif-headings";
  spacing: "compact" | "balanced" | "spacious";
  borderRadius: "none" | "sm" | "md" | "lg" | "full";
  imagery: string;
}

/**
 * Content guideline for a section
 */
export interface ContentGuideline {
  section: string;
  tips: string[];
}

/**
 * Complete industry template
 */
export interface IndustryTemplate {
  id: string;
  name: string;
  industries: string[];
  recommendedPages: PageRecommendation[];
  componentPreferences: ComponentPreference[];
  designTokens: DesignTokenRecommendation;
  contentGuidelines: ContentGuideline[];
}

// =============================================================================
// COMPONENT SCORING TYPES
// =============================================================================

/**
 * Score for a component in a given context
 */
export interface ComponentScore {
  componentType: string;
  score: number; // 0-100
  reasons: string[];
  suggestedConfig: Record<string, unknown>;
}

/**
 * Data availability flags
 */
export interface DataAvailabilityFlags {
  hasTeam: boolean;
  hasTestimonials: boolean;
  hasFaq: boolean;
  hasPortfolio: boolean;
  hasLocations: boolean;
  hasLogo: boolean;
  hasServices: boolean;
  hasSocial: boolean;
  hasHours: boolean;
  hasBlog: boolean;
}

/**
 * Context for scoring components
 */
export interface ScoringContext {
  sectionIntent: string;
  industryTemplate: IndustryTemplate | null;
  dataAvailability: DataAvailabilityFlags;
  userPreferences?: WebsiteDesignerPreferences;
  existingComponents: string[];
}

// =============================================================================
// CONTENT REQUIREMENT TYPES
// =============================================================================

/**
 * Importance level for content
 */
export type ContentImportance = "critical" | "important" | "optional";

/**
 * Content requirement for a component
 */
export interface ContentRequirement {
  field: string;
  importance: ContentImportance;
  dataSource?: string;
  fallback?: string;
}

/**
 * Result of checking if a component can render
 */
export interface RenderabilityResult {
  canRender: boolean;
  missingCritical: string[];
  missingOptional: string[];
}

// =============================================================================
// PAGE PLANNING TYPES
// =============================================================================

/**
 * Recommended page structure
 */
export interface RecommendedPage {
  name: string;
  slug: string;
  purpose: string;
  priority: number;
  required: boolean;
  sections: RecommendedSection[];
}

/**
 * Recommended section within a page
 */
export interface RecommendedSection {
  intent: string;
  componentType: string;
  alternativeComponents: string[];
  contentNeeds: string[];
  designNotes: string;
}

/**
 * Complete page plan recommendation
 */
export interface PagePlanRecommendation {
  industry: string;
  pages: RecommendedPage[];
  sharedElements: {
    navbar: {
      style: string;
      variant: string;
      ctaButton: boolean;
    };
    footer: {
      style: string;
      columns: number;
      newsletter: boolean;
    };
  };
}
