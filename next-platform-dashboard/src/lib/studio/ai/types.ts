/**
 * AI Types for DRAMAC Studio
 * 
 * Type definitions for AI-powered component editing.
 * Phase STUDIO-11: AI Component Chat
 */

import type { ComponentDefinition, FieldDefinition } from "@/types/studio";

/**
 * Context provided to AI for component editing
 */
export interface AIComponentContext {
  /** Component type name */
  componentType: string;
  
  /** Current component props */
  currentProps: Record<string, unknown>;
  
  /** Component label for display */
  componentLabel: string;
  
  /** Component description */
  componentDescription?: string;
  
  /** Field definitions with types */
  fields: Record<string, FieldDefinition>;
  
  /** AI-specific context from component definition */
  aiContext?: ComponentDefinition["ai"];
  
  /** Page context for broader awareness */
  pageContext?: {
    title?: string;
    description?: string;
    otherComponentTypes?: string[];
  };
}

/**
 * AI response for component prop changes
 */
export interface AIComponentResponse {
  /** Proposed prop changes (only changed props) */
  changes: Record<string, unknown>;
  
  /** Explanation of what was changed and why */
  explanation: string;
}

/**
 * Request body for component AI API
 */
export interface AIComponentRequest {
  /** Component context */
  context: AIComponentContext;
  
  /** User's request message */
  userMessage: string;
  
  /** Previous conversation for context */
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

/**
 * Field type formatting info for AI
 */
export interface FieldTypeInfo {
  type: string;
  description: string;
  example: string;
}

/**
 * AI API error response
 */
export interface AIErrorResponse {
  error: string;
  details?: string;
  rawResponse?: string;
}

// =============================================================================
// PAGE GENERATION TYPES (Phase STUDIO-12)
// =============================================================================

/**
 * Business types for page generation context
 */
export type BusinessType =
  | "technology"
  | "healthcare"
  | "finance"
  | "education"
  | "ecommerce"
  | "restaurant"
  | "fitness"
  | "real-estate"
  | "agency"
  | "nonprofit"
  | "saas"
  | "other";

/**
 * Color scheme presets
 */
export type ColorScheme =
  | "modern-blue"
  | "vibrant-purple"
  | "professional-gray"
  | "nature-green"
  | "warm-orange"
  | "elegant-dark"
  | "minimal-light"
  | "bold-red"
  | "custom";

/**
 * Content tone options
 */
export type ContentTone =
  | "professional"
  | "casual"
  | "playful"
  | "formal"
  | "inspirational";

/**
 * Page template quick-start options
 */
export type PageTemplate =
  | "landing"
  | "about"
  | "services"
  | "contact"
  | "pricing"
  | "blog"
  | "portfolio"
  | "team";

/**
 * Page generation request
 */
export interface AIPageGenerationRequest {
  /** Main description of the page */
  prompt: string;
  
  /** Optional business type for context */
  businessType?: BusinessType;
  
  /** Optional color scheme preference */
  colorScheme?: ColorScheme;
  
  /** Custom colors if colorScheme is "custom" */
  customColors?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  
  /** Content tone preference */
  tone?: ContentTone;
  
  /** Quick template to base on */
  template?: PageTemplate;
  
  /** Site ID for module component lookup */
  siteId?: string;
  
  /** Page title */
  pageTitle?: string;
}

/**
 * Page generation response
 */
export interface AIPageGenerationResponse {
  /** Generated page data */
  data: import("@/types/studio").StudioPageData;
  
  /** Description of what was generated */
  explanation: string;
  
  /** Number of components created */
  componentCount: number;
  
  /** Section breakdown */
  sections: Array<{
    name: string;
    componentCount: number;
  }>;
}

/**
 * Color scheme definitions
 */
export const COLOR_SCHEMES: Record<ColorScheme, {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}> = {
  "modern-blue": {
    name: "Modern Blue",
    colors: {
      primary: "#3B82F6",
      secondary: "#1E40AF",
      accent: "#60A5FA",
      background: "#F8FAFC",
      text: "#1E293B",
    },
  },
  "vibrant-purple": {
    name: "Vibrant Purple",
    colors: {
      primary: "#8B5CF6",
      secondary: "#6D28D9",
      accent: "#A78BFA",
      background: "#FAF5FF",
      text: "#1F2937",
    },
  },
  "professional-gray": {
    name: "Professional Gray",
    colors: {
      primary: "#4B5563",
      secondary: "#1F2937",
      accent: "#6B7280",
      background: "#F9FAFB",
      text: "#111827",
    },
  },
  "nature-green": {
    name: "Nature Green",
    colors: {
      primary: "#10B981",
      secondary: "#047857",
      accent: "#34D399",
      background: "#F0FDF4",
      text: "#1F2937",
    },
  },
  "warm-orange": {
    name: "Warm Orange",
    colors: {
      primary: "#F97316",
      secondary: "#EA580C",
      accent: "#FB923C",
      background: "#FFFBEB",
      text: "#1F2937",
    },
  },
  "elegant-dark": {
    name: "Elegant Dark",
    colors: {
      primary: "#E5E7EB",
      secondary: "#9CA3AF",
      accent: "#F3F4F6",
      background: "#111827",
      text: "#F9FAFB",
    },
  },
  "minimal-light": {
    name: "Minimal Light",
    colors: {
      primary: "#18181B",
      secondary: "#3F3F46",
      accent: "#71717A",
      background: "#FFFFFF",
      text: "#18181B",
    },
  },
  "bold-red": {
    name: "Bold Red",
    colors: {
      primary: "#EF4444",
      secondary: "#DC2626",
      accent: "#F87171",
      background: "#FEF2F2",
      text: "#1F2937",
    },
  },
  custom: {
    name: "Custom",
    colors: {
      primary: "#3B82F6",
      secondary: "#1E40AF",
      accent: "#60A5FA",
      background: "#FFFFFF",
      text: "#1F2937",
    },
  },
};

/**
 * Business type display names
 */
export const BUSINESS_TYPES: Record<BusinessType, string> = {
  technology: "Technology",
  healthcare: "Healthcare",
  finance: "Finance",
  education: "Education",
  ecommerce: "E-Commerce",
  restaurant: "Restaurant",
  fitness: "Fitness",
  "real-estate": "Real Estate",
  agency: "Agency",
  nonprofit: "Nonprofit",
  saas: "SaaS",
  other: "Other",
};

/**
 * Template descriptions for quick-starts
 */
export const PAGE_TEMPLATES: Record<PageTemplate, {
  name: string;
  description: string;
  suggestedSections: string[];
}> = {
  landing: {
    name: "Landing Page",
    description: "A conversion-focused page with hero, features, and CTA",
    suggestedSections: ["Hero", "Features", "Testimonials", "CTA"],
  },
  about: {
    name: "About Us",
    description: "Company story, mission, and team showcase",
    suggestedSections: ["Hero", "Story", "Mission", "Team", "Values"],
  },
  services: {
    name: "Services",
    description: "Showcase your services or offerings",
    suggestedSections: ["Hero", "Services Grid", "Process", "CTA"],
  },
  contact: {
    name: "Contact",
    description: "Contact form and information",
    suggestedSections: ["Hero", "Contact Form", "Map", "FAQ"],
  },
  pricing: {
    name: "Pricing",
    description: "Pricing plans and comparison",
    suggestedSections: ["Hero", "Pricing Cards", "Features Table", "FAQ", "CTA"],
  },
  blog: {
    name: "Blog",
    description: "Blog listing or featured articles",
    suggestedSections: ["Hero", "Featured Posts", "Categories", "Newsletter"],
  },
  portfolio: {
    name: "Portfolio",
    description: "Showcase work and projects",
    suggestedSections: ["Hero", "Projects Grid", "Services", "CTA"],
  },
  team: {
    name: "Team",
    description: "Team members and leadership",
    suggestedSections: ["Hero", "Leadership", "Team Grid", "Culture"],
  },
};
