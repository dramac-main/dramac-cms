/**
 * PHASE AWD-09: Module Integration Intelligence
 * Module Analyzer
 *
 * Detects module requirements from user prompts and business context,
 * using both industry defaults and AI analysis.
 */

import { generateObject } from "ai";
import { getAIModel } from "../config/ai-provider";
import { z } from "zod";
import type {
  ModuleRequirement,
  ModuleType,
  ModuleConfig,
  BusinessDataContext,
} from "./types";
import { INDUSTRY_MODULE_MAPPING, extractFeatureFlags } from "./types";
import { getDefaultModuleConfig } from "./default-configs";

// =============================================================================
// SCHEMAS
// =============================================================================

const DetectedModuleSchema = z.object({
  module: z.enum(["ecommerce", "booking", "crm", "automation", "social-media"]),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  features: z.array(z.string()),
});

const ModuleAnalysisSchema = z.object({
  detectedModules: z.array(DetectedModuleSchema),
});

// =============================================================================
// ANALYZER
// =============================================================================

/**
 * Analyze module requirements from user prompt and business context
 */
export async function analyzeModuleRequirements(
  userPrompt: string,
  industry: string,
  businessContext: BusinessDataContext
): Promise<ModuleRequirement[]> {
  // Get industry defaults
  const industryDefaults =
    INDUSTRY_MODULE_MAPPING[industry.toLowerCase()] ||
    INDUSTRY_MODULE_MAPPING.general;

  // Get feature flags from context
  const features = extractFeatureFlags(businessContext);

  // Use AI to analyze prompt for additional module needs
  const { object } = await generateObject({
    model: getAIModel("module-analysis"),
    schema: ModuleAnalysisSchema,
    prompt: `Analyze this website request and determine which modules are needed.

User prompt: "${userPrompt}"

Industry: ${industry}

Business context:
- Has products/services: ${features.hasServices || features.hasProducts}
- Has team: ${features.hasTeam}
- Has testimonials: ${features.hasTestimonials}
- Has social links: ${features.hasSocialLinks}
- Has business hours: ${features.hasBusinessHours}

Available modules:
1. **ecommerce**: Product catalog, shopping cart, checkout, payments, inventory
2. **booking**: Appointment scheduling, calendar, availability, confirmations
3. **crm**: Lead capture, contact management, pipeline, follow-ups
4. **automation**: Email sequences, abandoned cart, review requests, workflows
5. **social-media**: Social feeds, share buttons, auto-posting, Instagram display

Analyze the prompt and determine which modules would benefit this website.
Be conservative - only suggest modules that are clearly needed.

Consider these signals:
- "shop" or "store" or "buy" or "products" → ecommerce
- "book" or "appointment" or "schedule" or "reservation" → booking
- "contact" or "leads" or "newsletter" → crm
- "email sequences" or "automated" or "follow up" → automation
- "instagram" or "social feed" or "share" → social-media
`,
  });

  // Combine AI analysis with industry defaults
  const requirements: ModuleRequirement[] = [];

  // Add required modules from industry
  for (const module of industryDefaults.required) {
    const aiModule = object.detectedModules.find((m) => m.module === module);
    requirements.push({
      module,
      required: true,
      priority: "high",
      reason:
        aiModule?.reason || `Standard requirement for ${industry} websites`,
      suggestedConfig: getDefaultModuleConfig(module, aiModule?.features),
    });
  }

  // Add AI-detected modules not already in requirements
  for (const detected of object.detectedModules) {
    if (!requirements.find((r) => r.module === detected.module)) {
      const isRecommended = industryDefaults.recommended.includes(
        detected.module
      );

      requirements.push({
        module: detected.module,
        required: detected.confidence > 0.8,
        priority:
          detected.confidence > 0.7
            ? "high"
            : detected.confidence > 0.4
            ? "medium"
            : "low",
        reason: detected.reason,
        suggestedConfig: getDefaultModuleConfig(
          detected.module,
          detected.features
        ),
      });
    }
  }

  // Add recommended modules from industry (low priority if not AI-detected)
  for (const module of industryDefaults.recommended) {
    if (!requirements.find((r) => r.module === module)) {
      requirements.push({
        module,
        required: false,
        priority: "low",
        reason: `Recommended for ${industry} websites`,
        suggestedConfig: getDefaultModuleConfig(module),
      });
    }
  }

  // Sort by priority
  return requirements.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Get modules that should be enabled by default
 */
export function getRequiredModules(
  requirements: ModuleRequirement[]
): ModuleRequirement[] {
  return requirements.filter(
    (r) => r.required || r.priority === "high"
  );
}

/**
 * Get optional/recommended modules
 */
export function getOptionalModules(
  requirements: ModuleRequirement[]
): ModuleRequirement[] {
  return requirements.filter(
    (r) => !r.required && r.priority !== "high"
  );
}
