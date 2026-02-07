/**
 * PHASE AWD-07: Responsive & Mobile-First System
 * AI Responsive Configuration Generator
 *
 * Uses Claude AI to generate intelligent responsive configurations
 * based on component context and design requirements.
 */

import { z } from "zod";
import { generateObject } from "ai";
import { getAIModel } from "../config/ai-provider";

import type {
  ComponentResponsiveConfig,
  BreakpointConfig,
  Breakpoint,
  AIResponsiveInput,
  AIResponsiveOutput,
} from "./types";
import { defaultBreakpointConfig } from "./breakpoints";
import { defaultResponsiveRules } from "./rules-engine";

// =============================================================================
// ZOD SCHEMAS FOR AI GENERATION
// =============================================================================

const breakpointValuesSchema = z.object({
  mobile: z.number(),
  tablet: z.number(),
  desktop: z.number(),
  large: z.number(),
});

const breakpointStringValuesSchema = z.object({
  mobile: z.string(),
  tablet: z.string(),
  desktop: z.string(),
  large: z.string(),
});

const breakpointArrayValuesSchema = z.object({
  mobile: z.array(z.string()),
  tablet: z.array(z.string()),
  desktop: z.array(z.string()),
  large: z.array(z.string()),
});

const responsiveConfigSchema = z.object({
  // Layout recommendations
  layout: z.object({
    stackOnMobile: z.boolean(),
    columnsPerBreakpoint: breakpointValuesSchema,
    gapPerBreakpoint: breakpointStringValuesSchema,
    alignment: z.enum(["start", "center", "end", "between"]),
    maxWidth: z.string().describe("Maximum width constraint, e.g. '1200px' or 'none'"),
  }),

  // Typography recommendations
  typography: z.object({
    headingScale: breakpointValuesSchema.describe("Scale factor for heading sizes (0.5-1.5)"),
    bodyScale: breakpointValuesSchema.describe("Scale factor for body text (0.8-1.2)"),
    lineHeightScale: breakpointValuesSchema,
  }),

  // Visibility recommendations
  visibility: z.object({
    elementsToHide: breakpointArrayValuesSchema,
    elementsToSimplify: z.array(z.string()),
  }),

  // Mobile variant
  mobileVariant: z.string(),

  // Touch optimization
  touchOptimized: z.boolean(),

  // Priority for loading
  priority: z.enum(["critical", "high", "medium", "low"]),

  // Additional Tailwind classes
  additionalClasses: z.object({
    mobile: z.string(),
    tablet: z.string(),
    desktop: z.string(),
    large: z.string(),
  }),

  // Reasoning for decisions
  reasoning: z.string(),
});

// =============================================================================
// SYSTEM PROMPT
// =============================================================================

const RESPONSIVE_SYSTEM_PROMPT = `You are an expert responsive web design AI specializing in mobile-first design patterns.

Your task is to generate optimal responsive configurations for website components.

## Guidelines:

### Mobile-First Approach
- Always design for mobile first, then enhance for larger screens
- Stack elements vertically on mobile by default
- Use single-column layouts on mobile unless content requires otherwise
- Ensure touch targets are at least 48x48px

### Typography Scaling
- Mobile text should be 65-90% of desktop size for headings
- Body text should be 90-100% of desktop size for readability
- Never go below 14px for body text or 12px for small text
- Line heights should be slightly tighter on mobile (1.4-1.5 vs 1.6-1.8)

### Spacing Patterns
- Reduce padding by 30-50% on mobile
- Reduce gaps by 25-40% on mobile
- Section padding: mobile 3rem, tablet 4rem, desktop 5rem
- Container padding: mobile 1rem, tablet 1.5rem, desktop 2rem

### Visibility Decisions
- Hide decorative elements on mobile
- Hide secondary CTAs when space is limited
- Simplify complex components (navigation, pricing tables)
- Show mobile-specific elements (hamburger menus, scroll indicators)

### Component-Specific Patterns
- Navbar: Use hamburger menu on mobile, full nav on desktop
- Hero: Stack content/image vertically on mobile
- Features: Single column on mobile, 2-3 on tablet, 3-4 on desktop
- Pricing: Cards stack vertically, consider horizontal scroll for tables
- Testimonials: Single carousel on mobile, grid on desktop
- Gallery: 2 columns on mobile, 3-4 on tablet, 4-5 on desktop
- Footer: Accordion links on mobile, multi-column on desktop

### Priority Levels
- critical: Above the fold content (navbar, hero)
- high: Primary conversion elements (CTA, pricing, contact)
- medium: Supporting content (features, testimonials, about)
- low: Supplementary content (blog, timeline, additional sections)

Provide specific, actionable recommendations based on the component type and context.`;

// =============================================================================
// AI CONFIGURATION GENERATOR
// =============================================================================

/**
 * Generate responsive configuration using AI
 */
export async function generateResponsiveConfig(
  input: AIResponsiveInput
): Promise<AIResponsiveOutput> {
  const {
    componentType,
    componentPurpose,
    contentElements,
    designContext,
    targetDevices = ["mobile", "tablet", "desktop"],
  } = input;

  const prompt = buildResponsivePrompt(input);

  try {
    const { object } = await generateObject({
      model: getAIModel("responsive"),
      schema: responsiveConfigSchema,
      system: RESPONSIVE_SYSTEM_PROMPT,
      prompt,
    });

    return {
      success: true,
      config: transformAIResponse(componentType, object),
      tailwindClasses: generateTailwindClasses(object),
      recommendations: [object.reasoning],
    };
  } catch (error) {
    console.error("[AWD-07] Error generating responsive config:", error);
    
    // Return fallback configuration
    return {
      success: false,
      config: createFallbackConfig(componentType),
      tailwindClasses: generateFallbackClasses(),
      recommendations: [
        "Using fallback responsive configuration due to AI generation error.",
        "Consider reviewing and customizing the configuration manually.",
      ],
    };
  }
}

/**
 * Build the prompt for AI responsive generation
 */
function buildResponsivePrompt(input: AIResponsiveInput): string {
  const {
    componentType,
    componentPurpose,
    contentElements,
    designContext,
    targetDevices = ["mobile", "tablet", "desktop"],
    existingStyles,
  } = input;

  return `Generate an optimal responsive configuration for the following component:

## Component Details
- Type: ${componentType}
- Purpose: ${componentPurpose || "General purpose component"}
- Content Elements: ${contentElements?.join(", ") || "Standard content"}

## Design Context
${designContext ? `
- Industry: ${designContext.industry || "General"}
- Target Audience: ${designContext.targetAudience || "General"}
- Style: ${designContext.style || "Modern"}
- Primary Color: ${designContext.primaryColor || "Blue"}
` : "No specific design context provided."}

## Target Devices
${targetDevices.join(", ")}

## Existing Styles
${existingStyles || "No existing styles - starting fresh"}

## Requirements
1. Provide mobile-first responsive configuration
2. Specify columns, gaps, and alignment for each breakpoint
3. Identify elements to hide or simplify on smaller screens
4. Recommend the best mobile variant for this component
5. Set appropriate priority level for loading
6. Generate additional Tailwind classes for fine-tuning

Ensure your recommendations follow mobile-first best practices and enhance user experience across all devices.`;
}

/**
 * Transform AI response to ComponentResponsiveConfig
 */
function transformAIResponse(
  componentType: string,
  aiResponse: z.infer<typeof responsiveConfigSchema>
): ComponentResponsiveConfig {
  return {
    componentType,
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: aiResponse.layout.stackOnMobile,
      columnsPerBreakpoint: aiResponse.layout.columnsPerBreakpoint,
      gapPerBreakpoint: aiResponse.layout.gapPerBreakpoint,
      alignmentPerBreakpoint: {
        mobile: aiResponse.layout.alignment,
        tablet: aiResponse.layout.alignment,
        desktop: aiResponse.layout.alignment,
        large: aiResponse.layout.alignment,
      },
    },
    typographyRules: {
      fontSizeScale: aiResponse.typography.headingScale,
      lineHeightScale: aiResponse.typography.lineHeightScale,
    },
    visibilityRules: {
      elementsToHide: aiResponse.visibility.elementsToHide,
      elementsToShow: {
        mobile: [],
        tablet: [],
        desktop: [],
        large: [],
      },
    },
    mobileVariant: aiResponse.mobileVariant,
    touchOptimized: aiResponse.touchOptimized,
    priority: aiResponse.priority,
  };
}

/**
 * Generate Tailwind classes from AI response
 */
function generateTailwindClasses(
  aiResponse: z.infer<typeof responsiveConfigSchema>
): {
  mobile: string;
  tablet: string;
  desktop: string;
  large: string;
} {
  const { layout, additionalClasses } = aiResponse;

  // Build base classes
  const mobileClasses = [
    `grid-cols-${layout.columnsPerBreakpoint.mobile}`,
    `gap-${remToTailwind(layout.gapPerBreakpoint.mobile)}`,
    layout.stackOnMobile ? "flex-col" : "flex-row",
    additionalClasses.mobile,
  ].filter(Boolean).join(" ");

  const tabletClasses = [
    `sm:grid-cols-${layout.columnsPerBreakpoint.tablet}`,
    `sm:gap-${remToTailwind(layout.gapPerBreakpoint.tablet)}`,
    "sm:flex-row",
    additionalClasses.tablet ? `sm:${additionalClasses.tablet}` : "",
  ].filter(Boolean).join(" ");

  const desktopClasses = [
    `lg:grid-cols-${layout.columnsPerBreakpoint.desktop}`,
    `lg:gap-${remToTailwind(layout.gapPerBreakpoint.desktop)}`,
    additionalClasses.desktop ? `lg:${additionalClasses.desktop}` : "",
  ].filter(Boolean).join(" ");

  const largeClasses = [
    `xl:grid-cols-${layout.columnsPerBreakpoint.large}`,
    `xl:gap-${remToTailwind(layout.gapPerBreakpoint.large)}`,
    additionalClasses.large ? `xl:${additionalClasses.large}` : "",
  ].filter(Boolean).join(" ");

  return {
    mobile: mobileClasses,
    tablet: tabletClasses,
    desktop: desktopClasses,
    large: largeClasses,
  };
}

/**
 * Create fallback configuration for error cases
 */
function createFallbackConfig(componentType: string): ComponentResponsiveConfig {
  return {
    componentType,
    breakpointConfig: defaultBreakpointConfig,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 3, large: 4 },
      gapPerBreakpoint: {
        mobile: "1rem",
        tablet: "1.25rem",
        desktop: "1.5rem",
        large: "2rem",
      },
      alignmentPerBreakpoint: {
        mobile: "center",
        tablet: "start",
        desktop: "start",
        large: "start",
      },
    },
    typographyRules: {
      fontSizeScale: { mobile: 0.9, tablet: 0.95, desktop: 1, large: 1 },
      lineHeightScale: { mobile: 1.5, tablet: 1.5, desktop: 1.6, large: 1.6 },
    },
    visibilityRules: {
      elementsToHide: { mobile: [], tablet: [], desktop: [], large: [] },
      elementsToShow: { mobile: [], tablet: [], desktop: [], large: [] },
    },
    mobileVariant: "stacked",
    touchOptimized: true,
    priority: "medium",
  };
}

/**
 * Generate fallback Tailwind classes
 */
function generateFallbackClasses(): {
  mobile: string;
  tablet: string;
  desktop: string;
  large: string;
} {
  return {
    mobile: "grid-cols-1 gap-4 flex-col",
    tablet: "sm:grid-cols-2 sm:gap-5 sm:flex-row",
    desktop: "lg:grid-cols-3 lg:gap-6",
    large: "xl:grid-cols-4 xl:gap-8",
  };
}

/**
 * Convert rem value to Tailwind spacing number
 */
function remToTailwind(rem: string): number {
  const match = rem.match(/^([\d.]+)/);
  if (!match) return 4;
  
  const value = parseFloat(match[1]);
  return Math.round(value * 4);
}

// =============================================================================
// BATCH CONFIGURATION GENERATOR
// =============================================================================

/**
 * Generate responsive configs for multiple components
 */
export async function generateBatchResponsiveConfigs(
  inputs: AIResponsiveInput[]
): Promise<Map<string, AIResponsiveOutput>> {
  const results = new Map<string, AIResponsiveOutput>();

  // Process in parallel with concurrency limit
  const batchSize = 3;
  for (let i = 0; i < inputs.length; i += batchSize) {
    const batch = inputs.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((input) => generateResponsiveConfig(input))
    );

    batch.forEach((input, index) => {
      results.set(input.componentType, batchResults[index]);
    });
  }

  return results;
}

// =============================================================================
// CONFIGURATION VALIDATOR
// =============================================================================

/**
 * Validate responsive configuration
 */
export function validateResponsiveConfig(
  config: ComponentResponsiveConfig
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check column values
  const { columnsPerBreakpoint } = config.layoutRules;
  if (columnsPerBreakpoint.mobile > columnsPerBreakpoint.tablet) {
    errors.push("Mobile columns should not exceed tablet columns");
  }
  if (columnsPerBreakpoint.tablet > columnsPerBreakpoint.desktop) {
    errors.push("Tablet columns should not exceed desktop columns");
  }

  // Check typography scales
  const fontSizeScale = config.typographyRules.fontSizeScale;
  Object.entries(fontSizeScale).forEach(([breakpoint, scale]) => {
    if (typeof scale === "number" && (scale < 0.5 || scale > 1.5)) {
      errors.push(`Font size scale for ${breakpoint} should be between 0.5 and 1.5`);
    }
  });

  // Check line height scales
  const lineHeightScale = config.typographyRules.lineHeightScale;
  Object.entries(lineHeightScale).forEach(([breakpoint, scale]) => {
    if (typeof scale === "number" && (scale < 1 || scale > 2.5)) {
      errors.push(`Line height scale for ${breakpoint} should be between 1 and 2.5`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// CONFIGURATION OPTIMIZER
// =============================================================================

/**
 * Optimize responsive configuration
 */
export function optimizeResponsiveConfig(
  config: ComponentResponsiveConfig
): ComponentResponsiveConfig {
  const optimized = { ...config };

  // Ensure progressive column increase
  const columns = { ...optimized.layoutRules.columnsPerBreakpoint };
  columns.tablet = Math.max(columns.tablet, columns.mobile);
  columns.desktop = Math.max(columns.desktop, columns.tablet);
  columns.large = Math.max(columns.large, columns.desktop);
  optimized.layoutRules.columnsPerBreakpoint = columns;

  // Ensure progressive gap increase
  const gaps = { ...optimized.layoutRules.gapPerBreakpoint };
  const gapValues = {
    mobile: parseFloat(gaps.mobile),
    tablet: parseFloat(gaps.tablet),
    desktop: parseFloat(gaps.desktop),
    large: parseFloat(gaps.large),
  };
  
  gapValues.tablet = Math.max(gapValues.tablet, gapValues.mobile);
  gapValues.desktop = Math.max(gapValues.desktop, gapValues.tablet);
  gapValues.large = Math.max(gapValues.large, gapValues.desktop);

  optimized.layoutRules.gapPerBreakpoint = {
    mobile: `${gapValues.mobile}rem`,
    tablet: `${gapValues.tablet}rem`,
    desktop: `${gapValues.desktop}rem`,
    large: `${gapValues.large}rem`,
  };

  return optimized;
}
