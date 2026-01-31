/**
 * Puck Template Types
 * PHASE-ED-07A: Template System - Categories
 * 
 * Comprehensive TypeScript types for Puck-compatible templates
 * with categories, metadata, and component data structures.
 */

import type { Data as PuckData } from "@puckeditor/core";

// ============================================
// TEMPLATE CATEGORIES
// ============================================

export type TemplateCategory =
  | "landing"
  | "business"
  | "portfolio"
  | "ecommerce"
  | "blog"
  | "restaurant"
  | "fitness"
  | "healthcare"
  | "education"
  | "realestate"
  | "beauty"
  | "technology"
  | "nonprofit"
  | "legal"
  | "construction"
  | "events"
  | "photography"
  | "travel"
  | "hospitality"
  | "other";

export interface CategoryInfo {
  id: TemplateCategory;
  label: string;
  icon: string;
  description: string;
  color: string;
  gradient: string;
}

// ============================================
// TEMPLATE COLOR SCHEME
// ============================================

export interface TemplateColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground?: string;
  muted?: string;
}

// ============================================
// TEMPLATE METADATA
// ============================================

export interface TemplateMetadata {
  author: string;
  version: string;
  createdAt: string;
  lastUpdated: string;
  estimatedBuildTime: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  componentCount: number;
  responsive: boolean;
  darkModeReady: boolean;
}

// ============================================
// TEMPLATE DEFINITION
// ============================================

export interface PuckTemplate {
  // Core identification
  id: string;
  name: string;
  slug: string;
  description: string;
  
  // Categorization
  category: TemplateCategory;
  subcategory?: string;
  tags: string[];
  
  // Visual
  thumbnail: string;
  previewImages?: string[];
  colorScheme: TemplateColorScheme;
  
  // Status flags
  isPremium: boolean;
  isNew: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  
  // Ranking
  popularity: number; // 1-100
  rating?: number;    // 1-5
  usageCount?: number;
  
  // Features
  features: string[];
  sections: string[];
  componentsUsed: string[];
  
  // Puck Data
  puckData: PuckData;
  
  // Metadata
  metadata: TemplateMetadata;
}

// ============================================
// TEMPLATE COLLECTION
// ============================================

export interface TemplateCollection {
  id: string;
  name: string;
  description: string;
  icon: string;
  templates: string[]; // Template IDs
  isPremium: boolean;
}

// ============================================
// TEMPLATE FILTER STATE
// ============================================

export interface TemplateFilterState {
  category: TemplateCategory | "all";
  search: string;
  tags: string[];
  isPremium: boolean | null;
  isNew: boolean | null;
  sortBy: "popularity" | "newest" | "name" | "rating";
  difficulty: "beginner" | "intermediate" | "advanced" | "all";
}

// ============================================
// TEMPLATE LIBRARY STATE
// ============================================

export interface TemplateLibraryState {
  templates: PuckTemplate[];
  collections: TemplateCollection[];
  filters: TemplateFilterState;
  selectedTemplate: PuckTemplate | null;
  previewTemplate: PuckTemplate | null;
  isLoading: boolean;
  error: string | null;
}

// ============================================
// TEMPLATE UTILITY TYPES
// ============================================

export type TemplateSortOption = "popularity" | "newest" | "name" | "rating";

export interface TemplateSearchResult {
  template: PuckTemplate;
  matchScore: number;
  matchedFields: string[];
}

// ============================================
// COMPONENT SECTION TYPES
// ============================================

export type SectionType =
  | "hero"
  | "features"
  | "cta"
  | "testimonials"
  | "faq"
  | "stats"
  | "team"
  | "gallery"
  | "pricing"
  | "contact"
  | "about"
  | "services"
  | "portfolio"
  | "blog"
  | "newsletter"
  | "footer"
  | "navbar"
  | "products"
  | "benefits"
  | "process"
  | "clients"
  | "integrations"
  | "comparison"
  | "timeline"
  | "video"
  | "map"
  | "social"
  | "download"
  | "custom";

export interface SectionInfo {
  type: SectionType;
  label: string;
  description: string;
  icon: string;
  commonComponents: string[];
}

// ============================================
// TEMPLATE BUILDER HELPERS
// ============================================

export interface TemplateBuilderConfig {
  category: TemplateCategory;
  colorScheme: TemplateColorScheme;
  sections: SectionType[];
  style: "modern" | "classic" | "minimal" | "bold";
  industry?: string;
}

export interface GeneratedTemplateResult {
  success: boolean;
  template?: PuckTemplate;
  error?: string;
}

// ============================================
// EXPORT ALL
// ============================================

export type {
  PuckData,
};
