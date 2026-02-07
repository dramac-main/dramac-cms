/**
 * PHASE AWD-REFINEMENT: Multi-Pass Refinement Engine
 * 
 * Performs multiple AI passes to refine and improve generated websites.
 * Each pass focuses on different aspects:
 * - Pass 1: Content quality and specificity
 * - Pass 2: Visual consistency and design polish
 * - Pass 3: Conversion optimization and CTAs
 * - Pass 4: Accessibility and mobile experience
 * 
 * This ensures jaw-dropping, production-ready results.
 */

import { generateObject, generateText } from "ai";
import { getAIModel } from "../config/ai-provider";
import { z } from "zod";
import type { GeneratedPage, GeneratedComponent, SiteArchitecture } from "../types";

// =============================================================================
// REFINEMENT SCHEMAS
// =============================================================================

const ContentRefinementSchema = z.object({
  refinedComponents: z.array(z.object({
    componentId: z.string(),
    refinements: z.array(z.object({
      prop: z.string(),
      originalValue: z.string().describe("The original value before refinement"),
      refinedValue: z.string(),
      reason: z.string(),
    })),
  })),
  overallScore: z.number().describe("Overall quality score from 1 to 10"),
  improvements: z.array(z.string()),
});

const VisualConsistencySchema = z.object({
  colorAudit: z.object({
    isConsistent: z.boolean(),
    issues: z.array(z.string()),
    fixes: z.array(z.object({
      componentId: z.string(),
      prop: z.string(),
      currentValue: z.string(),
      suggestedValue: z.string(),
    })),
  }),
  spacingAudit: z.object({
    isConsistent: z.boolean(),
    issues: z.array(z.string()),
  }),
  typographyAudit: z.object({
    isConsistent: z.boolean(),
    issues: z.array(z.string()),
  }),
  overallScore: z.number().describe("Overall visual consistency score from 1 to 10"),
});

const ConversionOptimizationSchema = z.object({
  ctaAnalysis: z.array(z.object({
    componentId: z.string(),
    currentCta: z.string(),
    suggestedCta: z.string(),
    reason: z.string(),
    urgencyLevel: z.enum(["low", "medium", "high"]),
  })),
  missingCtas: z.array(z.object({
    page: z.string(),
    suggestedPlacement: z.string(),
    suggestedText: z.string(),
  })),
  conversionScore: z.number().describe("Conversion optimization score from 1 to 10"),
  recommendations: z.array(z.string()),
});

const AccessibilityAuditSchema = z.object({
  issues: z.array(z.object({
    severity: z.enum(["critical", "major", "minor"]),
    component: z.string(),
    issue: z.string(),
    fix: z.string(),
  })),
  mobileIssues: z.array(z.object({
    component: z.string(),
    issue: z.string(),
    fix: z.string(),
  })),
  score: z.number().describe("Accessibility score from 1 to 10"),
  wcagLevel: z.enum(["A", "AA", "AAA"]),
});

// =============================================================================
// REFINEMENT PROMPTS
// =============================================================================

const CONTENT_REFINEMENT_PROMPT = `You are a WORLD-CLASS copywriter and content strategist. Your copy converts at 3x industry average.

Analyze the website content and improve it to be:
1. MORE SPECIFIC - Use exact business details, not generic text
2. MORE COMPELLING - Headlines that grab attention
3. MORE BENEFIT-FOCUSED - What does the customer GET?
4. MORE ACTION-ORIENTED - Clear next steps

CRITICAL RULES:
- Remove ANY generic placeholder text
- Make every headline unique and memorable
- CTAs should be specific ("Reserve Your Table" not "Click Here")
- Features should highlight BENEFITS not just features
- Testimonials should feel REAL and SPECIFIC`;

const VISUAL_CONSISTENCY_PROMPT = `You are a SENIOR UI DESIGNER who has worked at Apple, Stripe, and Airbnb.

Audit the website for visual consistency:
1. COLOR - Is the same primary/secondary/accent used throughout?
2. SPACING - Is the 8px grid followed? Are margins consistent?
3. TYPOGRAPHY - Is the heading/body font hierarchy maintained?
4. BORDER RADIUS - Are corners consistent (all rounded or all sharp)?
5. SHADOWS - Is shadow intensity consistent?

CRITICAL: Visual inconsistency makes websites look amateur.`;

const CONVERSION_PROMPT = `You are a CONVERSION RATE OPTIMIZATION expert with a track record of 5x conversion improvements.

Analyze and optimize the website for conversions:
1. CTA PLACEMENT - Is there a clear CTA above the fold?
2. CTA TEXT - Is it action-oriented and specific?
3. URGENCY - Are there urgency elements where appropriate?
4. TRUST SIGNALS - Are there testimonials, badges, reviews?
5. FRICTION REDUCTION - Is the path to conversion clear?

For BOOKING businesses: "Reserve Now", "Book Your Table", "Schedule Consultation"
For ECOMMERCE: "Add to Cart", "Buy Now", "Shop Collection"
For SERVICES: "Get Free Quote", "Schedule Call", "Start Project"`;

const ACCESSIBILITY_PROMPT = `You are an ACCESSIBILITY SPECIALIST certified in WCAG 2.1 AA.

Audit the website for accessibility and mobile experience:
1. COLOR CONTRAST - Is text readable? (4.5:1 ratio minimum)
2. TEXT SIZE - Is body text at least 16px?
3. TOUCH TARGETS - Are buttons at least 44x44px?
4. ALT TEXT - Do all images have descriptive alt text?
5. HEADINGS - Is there a proper h1 > h2 > h3 hierarchy?
6. MOBILE - Does the layout work on 375px width?`;

// =============================================================================
// MULTI-PASS REFINEMENT ENGINE
// =============================================================================

export interface RefinementResult {
  pages: GeneratedPage[];
  passes: {
    content: z.infer<typeof ContentRefinementSchema>;
    visual: z.infer<typeof VisualConsistencySchema>;
    conversion: z.infer<typeof ConversionOptimizationSchema>;
    accessibility: z.infer<typeof AccessibilityAuditSchema>;
  };
  overallScore: number;
  totalImprovements: number;
  refinementTime: number;
}

export interface RefinementProgress {
  pass: 1 | 2 | 3 | 4;
  passName: string;
  status: "in-progress" | "complete";
  improvements: number;
}

export class MultiPassRefinementEngine {
  private pages: GeneratedPage[];
  private architecture: SiteArchitecture;
  private businessContext: string;
  private onProgress?: (progress: RefinementProgress) => void;

  constructor(
    pages: GeneratedPage[],
    architecture: SiteArchitecture,
    businessContext: string,
    onProgress?: (progress: RefinementProgress) => void
  ) {
    this.pages = pages;
    this.architecture = architecture;
    this.businessContext = businessContext;
    this.onProgress = onProgress;
  }

  /**
   * Run all refinement passes
   */
  async refine(): Promise<RefinementResult> {
    const startTime = Date.now();
    let refinedPages = [...this.pages];
    let totalImprovements = 0;

    // Pass 1: Content Quality
    this.onProgress?.({
      pass: 1,
      passName: "Content Quality & Specificity",
      status: "in-progress",
      improvements: 0,
    });

    const contentResult = await this.runContentPass(refinedPages);
    refinedPages = this.applyContentRefinements(refinedPages, contentResult);
    totalImprovements += contentResult.refinedComponents.length;

    this.onProgress?.({
      pass: 1,
      passName: "Content Quality & Specificity",
      status: "complete",
      improvements: contentResult.refinedComponents.length,
    });

    // Pass 2: Visual Consistency
    this.onProgress?.({
      pass: 2,
      passName: "Visual Consistency & Design Polish",
      status: "in-progress",
      improvements: 0,
    });

    const visualResult = await this.runVisualPass(refinedPages);
    refinedPages = this.applyVisualRefinements(refinedPages, visualResult);
    totalImprovements += visualResult.colorAudit.fixes.length;

    this.onProgress?.({
      pass: 2,
      passName: "Visual Consistency & Design Polish",
      status: "complete",
      improvements: visualResult.colorAudit.fixes.length,
    });

    // Pass 3: Conversion Optimization
    this.onProgress?.({
      pass: 3,
      passName: "Conversion Optimization",
      status: "in-progress",
      improvements: 0,
    });

    const conversionResult = await this.runConversionPass(refinedPages);
    refinedPages = this.applyConversionRefinements(refinedPages, conversionResult);
    totalImprovements += conversionResult.ctaAnalysis.length;

    this.onProgress?.({
      pass: 3,
      passName: "Conversion Optimization",
      status: "complete",
      improvements: conversionResult.ctaAnalysis.length,
    });

    // Pass 4: Accessibility & Mobile
    this.onProgress?.({
      pass: 4,
      passName: "Accessibility & Mobile Experience",
      status: "in-progress",
      improvements: 0,
    });

    const accessibilityResult = await this.runAccessibilityPass(refinedPages);
    refinedPages = this.applyAccessibilityRefinements(refinedPages, accessibilityResult);
    totalImprovements += accessibilityResult.issues.length;

    this.onProgress?.({
      pass: 4,
      passName: "Accessibility & Mobile Experience",
      status: "complete",
      improvements: accessibilityResult.issues.length,
    });

    // Calculate overall score
    const overallScore = Math.round(
      (contentResult.overallScore +
        visualResult.overallScore +
        conversionResult.conversionScore +
        accessibilityResult.score) /
        4
    );

    return {
      pages: refinedPages,
      passes: {
        content: contentResult,
        visual: visualResult,
        conversion: conversionResult,
        accessibility: accessibilityResult,
      },
      overallScore,
      totalImprovements,
      refinementTime: Date.now() - startTime,
    };
  }

  /**
   * Pass 1: Content Quality & Specificity
   */
  private async runContentPass(
    pages: GeneratedPage[]
  ): Promise<z.infer<typeof ContentRefinementSchema>> {
    const pagesJson = JSON.stringify(
      pages.map((p) => ({
        name: p.name,
        slug: p.slug,
        components: p.components.map((c) => ({
          id: c.id,
          type: c.type,
          props: c.props,
        })),
      })),
      null,
      2
    );

    const { object } = await generateObject({
      model: getAIModel("refinement"),
      schema: ContentRefinementSchema,
      system: CONTENT_REFINEMENT_PROMPT,
      prompt: `Analyze and refine this website content:

## Business Context:
${this.businessContext}

## Current Pages:
${pagesJson}

Identify components with generic or weak content and provide SPECIFIC refinements.
Focus on headlines, descriptions, and CTAs.`,
    });

    return object;
  }

  /**
   * Pass 2: Visual Consistency
   */
  private async runVisualPass(
    pages: GeneratedPage[]
  ): Promise<z.infer<typeof VisualConsistencySchema>> {
    const designTokens = this.architecture.designTokens;

    const componentsJson = JSON.stringify(
      pages.flatMap((p) =>
        p.components.map((c) => ({
          pageSlug: p.slug,
          id: c.id,
          type: c.type,
          colorProps: this.extractColorProps(c.props as Record<string, unknown>),
        }))
      ),
      null,
      2
    );

    const { object } = await generateObject({
      model: getAIModel("refinement"),
      schema: VisualConsistencySchema,
      system: VISUAL_CONSISTENCY_PROMPT,
      prompt: `Audit this website for visual consistency:

## Design Tokens (should be used consistently):
${JSON.stringify(designTokens, null, 2)}

## Components with color properties:
${componentsJson}

Check that colors, spacing, and typography are consistent across all components.`,
    });

    return object;
  }

  /**
   * Pass 3: Conversion Optimization
   */
  private async runConversionPass(
    pages: GeneratedPage[]
  ): Promise<z.infer<typeof ConversionOptimizationSchema>> {
    const ctaComponents = pages.flatMap((p) =>
      p.components
        .filter((c) =>
          ["Hero", "CTA", "Navbar", "Features"].includes(c.type)
        )
        .map((c) => ({
          pageSlug: p.slug,
          id: c.id,
          type: c.type,
          ctaText: (c.props as Record<string, unknown>)?.ctaText ||
            (c.props as Record<string, unknown>)?.primaryButtonText ||
            (c.props as Record<string, unknown>)?.buttonText,
          ctaLink: (c.props as Record<string, unknown>)?.ctaLink ||
            (c.props as Record<string, unknown>)?.primaryButtonLink,
        }))
    );

    const { object } = await generateObject({
      model: getAIModel("refinement"),
      schema: ConversionOptimizationSchema,
      system: CONVERSION_PROMPT,
      prompt: `Optimize this website for conversions:

## Business Context:
${this.businessContext}

## Industry: ${this.architecture.intent}

## Current CTAs:
${JSON.stringify(ctaComponents, null, 2)}

Analyze CTA effectiveness and suggest improvements.
Consider the industry and what action the user should take.`,
    });

    return object;
  }

  /**
   * Pass 4: Accessibility & Mobile
   */
  private async runAccessibilityPass(
    pages: GeneratedPage[]
  ): Promise<z.infer<typeof AccessibilityAuditSchema>> {
    const accessibilityRelevant = pages.flatMap((p) =>
      p.components.map((c) => ({
        pageSlug: p.slug,
        id: c.id,
        type: c.type,
        textProps: this.extractTextProps(c.props as Record<string, unknown>),
        colorProps: this.extractColorProps(c.props as Record<string, unknown>),
      }))
    );

    const { object } = await generateObject({
      model: getAIModel("refinement"),
      schema: AccessibilityAuditSchema,
      system: ACCESSIBILITY_PROMPT,
      prompt: `Audit this website for accessibility:

## Components:
${JSON.stringify(accessibilityRelevant, null, 2)}

Check for:
1. Color contrast issues
2. Missing alt text
3. Small touch targets
4. Mobile layout problems`,
    });

    return object;
  }

  // ===========================================================================
  // REFINEMENT APPLICATION METHODS
  // ===========================================================================

  private applyContentRefinements(
    pages: GeneratedPage[],
    result: z.infer<typeof ContentRefinementSchema>
  ): GeneratedPage[] {
    return pages.map((page) => ({
      ...page,
      components: page.components.map((component) => {
        const refinement = result.refinedComponents.find(
          (r) => r.componentId === component.id
        );

        if (!refinement) return component;

        const newProps = { ...(component.props as Record<string, unknown>) };
        for (const change of refinement.refinements) {
          newProps[change.prop] = change.refinedValue;
        }

        return { ...component, props: newProps };
      }),
    }));
  }

  private applyVisualRefinements(
    pages: GeneratedPage[],
    result: z.infer<typeof VisualConsistencySchema>
  ): GeneratedPage[] {
    return pages.map((page) => ({
      ...page,
      components: page.components.map((component) => {
        const fixes = result.colorAudit.fixes.filter(
          (f) => f.componentId === component.id
        );

        if (fixes.length === 0) return component;

        const newProps = { ...(component.props as Record<string, unknown>) };
        for (const fix of fixes) {
          newProps[fix.prop] = fix.suggestedValue;
        }

        return { ...component, props: newProps };
      }),
    }));
  }

  private applyConversionRefinements(
    pages: GeneratedPage[],
    result: z.infer<typeof ConversionOptimizationSchema>
  ): GeneratedPage[] {
    return pages.map((page) => ({
      ...page,
      components: page.components.map((component) => {
        const ctaChange = result.ctaAnalysis.find(
          (c) => c.componentId === component.id
        );

        if (!ctaChange) return component;

        const newProps = { ...(component.props as Record<string, unknown>) };
        
        // Update CTA text based on component type
        if (newProps.ctaText !== undefined) {
          newProps.ctaText = ctaChange.suggestedCta;
        }
        if (newProps.primaryButtonText !== undefined) {
          newProps.primaryButtonText = ctaChange.suggestedCta;
        }
        if (newProps.buttonText !== undefined) {
          newProps.buttonText = ctaChange.suggestedCta;
        }

        return { ...component, props: newProps };
      }),
    }));
  }

  private applyAccessibilityRefinements(
    pages: GeneratedPage[],
    result: z.infer<typeof AccessibilityAuditSchema>
  ): GeneratedPage[] {
    // Apply accessibility fixes
    return pages.map((page) => ({
      ...page,
      components: page.components.map((component) => {
        const issues = result.issues.filter((i) => i.component === component.id);
        
        if (issues.length === 0) return component;

        const newProps = { ...(component.props as Record<string, unknown>) };
        
        // Apply common accessibility fixes
        for (const issue of issues) {
          if (issue.issue.includes("alt text") && !newProps.alt) {
            newProps.alt = `Image for ${component.type}`;
          }
          if (issue.issue.includes("contrast")) {
            // Ensure text colors have good contrast
            if (newProps.textColor === "#ffffff" && newProps.backgroundColor === "#ffffff") {
              newProps.textColor = "#1f2937";
            }
          }
        }

        return { ...component, props: newProps };
      }),
    }));
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  private extractColorProps(props: Record<string, unknown>): Record<string, unknown> {
    const colorKeys = [
      "backgroundColor",
      "textColor",
      "primaryColor",
      "secondaryColor",
      "accentColor",
      "buttonColor",
      "ctaColor",
      "titleColor",
      "subtitleColor",
      "descriptionColor",
      "backgroundOverlayColor",
    ];

    const result: Record<string, unknown> = {};
    for (const key of colorKeys) {
      if (props[key] !== undefined) {
        result[key] = props[key];
      }
    }
    return result;
  }

  private extractTextProps(props: Record<string, unknown>): Record<string, unknown> {
    const textKeys = [
      "title",
      "headline",
      "subtitle",
      "subheadline",
      "description",
      "ctaText",
      "buttonText",
      "primaryButtonText",
      "secondaryButtonText",
      "alt",
    ];

    const result: Record<string, unknown> = {};
    for (const key of textKeys) {
      if (props[key] !== undefined) {
        result[key] = props[key];
      }
    }
    return result;
  }
}

// =============================================================================
// QUICK REFINEMENT (Single Pass)
// =============================================================================

/**
 * Quick single-pass refinement for faster results
 */
export async function quickRefine(
  pages: GeneratedPage[],
  businessContext: string
): Promise<GeneratedPage[]> {
  const { text } = await generateText({
    model: getAIModel("refinement"),
    system: `You are a senior web developer. Quickly review the website and suggest 3-5 critical improvements as JSON patches.`,
    prompt: `Review this website and suggest improvements:
    
${JSON.stringify(pages.slice(0, 2), null, 2)}

Business: ${businessContext}

Return a JSON array of patches: [{ componentId, prop, value }]`,
  });

  try {
    // Try to parse and apply quick fixes
    const patches = JSON.parse(text);
    if (Array.isArray(patches)) {
      return pages.map((page) => ({
        ...page,
        components: page.components.map((component) => {
          const patch = patches.find((p: { componentId: string }) => p.componentId === component.id);
          if (!patch) return component;
          
          return {
            ...component,
            props: {
              ...(component.props as Record<string, unknown>),
              [patch.prop]: patch.value,
            },
          };
        }),
      }));
    }
  } catch {
    // If parsing fails, return original pages
    console.warn("[QuickRefine] Failed to parse patches");
  }

  return pages;
}
