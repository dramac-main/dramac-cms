/**
 * Premium Templates Registry
 * PHASE-ED-07B: Template System - Premium Templates
 * 
 * Central registry for all premium templates across categories.
 * Provides unified access to 25+ professionally designed templates.
 */

import type { PuckTemplate, TemplateCategory } from "@/types/puck-templates";

// Import all premium template collections
import { LANDING_TEMPLATES } from "./landing-templates";
import { BUSINESS_TEMPLATES } from "./business-templates";
import { PORTFOLIO_TEMPLATES } from "./portfolio-templates";
import { ECOMMERCE_TEMPLATES } from "./ecommerce-templates";
import { BLOG_TEMPLATES } from "./blog-templates";
import { SPECIALIZED_TEMPLATES } from "./specialized-templates";

// ============================================
// PREMIUM TEMPLATES REGISTRY
// ============================================

/**
 * All premium templates combined into a single array
 */
export const PREMIUM_TEMPLATES: PuckTemplate[] = [
  ...LANDING_TEMPLATES,
  ...BUSINESS_TEMPLATES,
  ...PORTFOLIO_TEMPLATES,
  ...ECOMMERCE_TEMPLATES,
  ...BLOG_TEMPLATES,
  ...SPECIALIZED_TEMPLATES,
];

/**
 * Premium templates organized by category
 * Only includes categories defined in TemplateCategory type
 */
export const PREMIUM_TEMPLATES_BY_CATEGORY: Partial<Record<TemplateCategory, PuckTemplate[]>> = {
  // Landing Page Templates
  landing: LANDING_TEMPLATES,
  
  // Business Templates
  business: BUSINESS_TEMPLATES,
  
  // Portfolio Templates
  portfolio: PORTFOLIO_TEMPLATES,
  
  // E-commerce Templates
  ecommerce: ECOMMERCE_TEMPLATES,
  
  // Blog Templates
  blog: BLOG_TEMPLATES,
  
  // Specialized Industry Templates (by their proper category)
  restaurant: SPECIALIZED_TEMPLATES.filter(t => t.category === "restaurant"),
  fitness: SPECIALIZED_TEMPLATES.filter(t => t.category === "fitness"),
  realestate: SPECIALIZED_TEMPLATES.filter(t => t.category === "realestate"),
  healthcare: SPECIALIZED_TEMPLATES.filter(t => t.category === "healthcare"),
  education: SPECIALIZED_TEMPLATES.filter(t => t.category === "education"),
  
  // Empty categories (available for future templates)
  nonprofit: [],
  technology: [],
  legal: [],
  events: [],
  travel: [],
  hospitality: [],
  construction: [],
  photography: [],
  beauty: [],
  other: [],
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get all premium templates
 */
export function getAllPremiumTemplates(): PuckTemplate[] {
  return PREMIUM_TEMPLATES;
}

/**
 * Get a premium template by ID
 */
export function getPremiumTemplateById(id: string): PuckTemplate | undefined {
  return PREMIUM_TEMPLATES.find(template => template.id === id);
}

/**
 * Get a premium template by slug
 */
export function getPremiumTemplateBySlug(slug: string): PuckTemplate | undefined {
  return PREMIUM_TEMPLATES.find(template => template.slug === slug);
}

/**
 * Get premium templates by category
 */
export function getPremiumTemplatesByCategory(category: TemplateCategory): PuckTemplate[] {
  return PREMIUM_TEMPLATES_BY_CATEGORY[category] ?? [];
}

/**
 * Get featured premium templates
 */
export function getFeaturedPremiumTemplates(): PuckTemplate[] {
  return PREMIUM_TEMPLATES.filter(template => template.isFeatured);
}

/**
 * Get new premium templates
 */
export function getNewPremiumTemplates(): PuckTemplate[] {
  return PREMIUM_TEMPLATES.filter(template => template.isNew);
}

/**
 * Get popular premium templates
 */
export function getPopularPremiumTemplates(limit: number = 10): PuckTemplate[] {
  return [...PREMIUM_TEMPLATES]
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, limit);
}

/**
 * Search premium templates by tags
 */
export function searchPremiumTemplatesByTags(tags: string[]): PuckTemplate[] {
  const lowercaseTags = tags.map(t => t.toLowerCase());
  return PREMIUM_TEMPLATES.filter(template =>
    template.tags.some(tag => lowercaseTags.includes(tag.toLowerCase()))
  );
}

/**
 * Search premium templates by keyword
 */
export function searchPremiumTemplates(query: string): PuckTemplate[] {
  const lowercaseQuery = query.toLowerCase();
  return PREMIUM_TEMPLATES.filter(template =>
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}

/**
 * Get premium templates statistics
 */
export function getPremiumTemplatesStats() {
  return {
    total: PREMIUM_TEMPLATES.length,
    byCategory: Object.entries(PREMIUM_TEMPLATES_BY_CATEGORY).reduce(
      (acc, [category, templates]) => {
        if (templates.length > 0) {
          acc[category] = templates.length;
        }
        return acc;
      },
      {} as Record<string, number>
    ),
    featured: getFeaturedPremiumTemplates().length,
    new: getNewPremiumTemplates().length,
  };
}

// ============================================
// RE-EXPORTS
// ============================================

// Re-export individual template collections for direct access
export { LANDING_TEMPLATES } from "./landing-templates";
export { BUSINESS_TEMPLATES } from "./business-templates";
export { PORTFOLIO_TEMPLATES } from "./portfolio-templates";
export { ECOMMERCE_TEMPLATES } from "./ecommerce-templates";
export { BLOG_TEMPLATES } from "./blog-templates";
export { SPECIALIZED_TEMPLATES } from "./specialized-templates";

// Re-export individual templates
export * from "./landing-templates";
export * from "./business-templates";
export * from "./portfolio-templates";
export * from "./ecommerce-templates";
export * from "./blog-templates";
export * from "./specialized-templates";

// Default export
export default PREMIUM_TEMPLATES;
