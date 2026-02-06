/**
 * PHASE AWD-02: Data Context System
 * 
 * Provides comprehensive business data context for the AI Website Designer.
 * This module fetches, formats, and validates all business data needed
 * for intelligent content generation.
 * 
 * @module data-context
 * 
 * @example
 * ```typescript
 * import { buildDataContext, formatContextForAI, checkDataAvailability } from "@/lib/ai/website-designer/data-context";
 * 
 * // Build complete context
 * const context = await buildDataContext(siteId);
 * 
 * // Format for AI consumption
 * const formattedContext = formatContextForAI(context);
 * 
 * // Check what data is available/missing
 * const availability = checkDataAvailability(context);
 * 
 * // Get prompts for missing data
 * const prompts = getMissingDataPrompts(context);
 * ```
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Core data types
  SiteData,
  BrandingData,
  ClientData,
  ContactData,
  SocialLink,
  BusinessHours,
  Location,
  TeamMember,
  Service,
  PortfolioItem,
  Testimonial,
  BlogPost,
  FAQItem,
  EnabledModule,
  
  // Context type
  BusinessDataContext,
  
  // Availability types
  DataAvailability,
  DataAvailabilityCategory,
  DataAvailabilityScore,
  MissingDataPrompt,
  MissingDataPromptPriority,
  
  // Options
  DataContextBuilderOptions,
} from "./types";

// =============================================================================
// BUILDER EXPORTS
// =============================================================================

export {
  // Main builder
  buildDataContext,
  buildDataContextCached,
  clearContextCache,
  
  // Partial builders
  buildBrandingContext,
  buildContentContext,
  buildContactContext,
} from "./builder";

// =============================================================================
// FORMATTER EXPORTS
// =============================================================================

export {
  // Main formatter
  formatContextForAI,
  
  // Specialized formatters
  formatForComponentContent,
  formatCompactSummary,
} from "./formatter";

// =============================================================================
// CHECKER EXPORTS
// =============================================================================

export {
  // Availability checking
  checkDataAvailability,
  getMissingDataPrompts,
  
  // Quick checks
  hasEssentialData,
  hasContentData,
  getDataQualityScore,
} from "./checker";

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

import { buildDataContext } from "./builder";
import { formatContextForAI } from "./formatter";
import { checkDataAvailability, getMissingDataPrompts } from "./checker";
import type { BusinessDataContext, DataAvailability, MissingDataPrompt } from "./types";

/**
 * Build and format context in one call
 * Convenience function for quick AI context generation
 */
export async function getFormattedContext(siteId: string): Promise<string> {
  const context = await buildDataContext(siteId);
  return formatContextForAI(context);
}

/**
 * Build context and check availability in one call
 * Useful for dashboard/UI displays
 */
export async function getContextWithAvailability(siteId: string): Promise<{
  context: BusinessDataContext;
  formatted: string;
  availability: DataAvailability;
  missingPrompts: MissingDataPrompt[];
}> {
  const context = await buildDataContext(siteId);
  const formatted = formatContextForAI(context);
  const availability = checkDataAvailability(context);
  const missingPrompts = getMissingDataPrompts(context);

  return {
    context,
    formatted,
    availability,
    missingPrompts,
  };
}

/**
 * Quick context summary for logging/debugging
 */
export async function getContextSummary(siteId: string): Promise<{
  siteName: string;
  dataScore: number;
  categoryCounts: Record<string, number>;
}> {
  const context = await buildDataContext(siteId);
  const availability = checkDataAvailability(context);

  return {
    siteName: context.site.name || "Unknown",
    dataScore: availability.overallPercentage,
    categoryCounts: {
      services: context.services?.length || 0,
      team: context.team?.length || 0,
      testimonials: context.testimonials?.length || 0,
      portfolio: context.portfolio?.length || 0,
      faq: context.faq?.length || 0,
      blog: context.blog?.length || 0,
      social: context.social?.length || 0,
      locations: context.locations?.length || 0,
    },
  };
}
