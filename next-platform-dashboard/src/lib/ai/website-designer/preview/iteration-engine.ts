/**
 * PHASE AWD-08: Preview & Iteration System
 * Iteration Engine
 *
 * Handles natural language refinement requests from users,
 * processes them through AI, and applies changes to the preview state.
 */

import { generateObject } from "ai";
import { getAIModel } from "../config/ai-provider";
import { z } from "zod";
import type {
  PreviewState,
  PreviewComponent,
  RefinementRequest,
  RefinementResult,
  RefinementScope,
  Change,
  Iteration,
} from "./types";

// =============================================================================
// SCHEMAS
// =============================================================================

const RefinementScopeSchema = z.object({
  type: z.enum(["component", "page", "style", "content", "general"]),
  targets: z.array(z.string()).describe("Component IDs or page slugs to modify"),
  requiresRegeneration: z.boolean().describe("Whether full page regeneration is needed"),
  confidence: z.number().min(0).max(1),
});

const ComponentChangeSchema = z.object({
  changes: z.array(
    z.object({
      field: z.string(),
      newValue: z.unknown(),
      reason: z.string(),
    })
  ),
});

const StyleChangeSchema = z.object({
  designSystemChanges: z.object({
    colors: z.record(z.string(), z.string()).optional(),
    typography: z.record(z.string(), z.string()).optional(),
    spacing: z.record(z.string(), z.string()).optional(),
    borders: z.record(z.string(), z.string()).optional(),
  }),
  componentStyleChanges: z.array(
    z.object({
      componentType: z.string(),
      props: z.record(z.string(), z.unknown()),
    })
  ),
});

// =============================================================================
// ITERATION ENGINE
// =============================================================================

export class IterationEngine {
  private previewState: PreviewState;

  constructor(previewState: PreviewState) {
    this.previewState = previewState;
  }

  /**
   * Process a refinement request from the user
   */
  async processRefinement(request: RefinementRequest): Promise<RefinementResult> {
    try {
      // Analyze the request to determine scope
      const scope = await this.analyzeRequestScope(request);

      // Generate changes based on scope
      let changes: Change[] = [];

      switch (scope.type) {
        case "component":
          changes = await this.refineComponent(request, scope.targets);
          break;
        case "page":
          changes = await this.refinePage(request, scope.targets);
          break;
        case "style":
          changes = await this.refineStyle(request);
          break;
        case "content":
          changes = await this.refineContent(request, scope.targets);
          break;
        case "general":
          changes = await this.refineGeneral(request);
          break;
      }

      return {
        success: changes.length > 0,
        changes,
        explanation: this.generateExplanation(changes),
        requiresRegeneration: scope.requiresRegeneration,
      };
    } catch (error) {
      console.error("[IterationEngine] Error processing refinement:", error);
      return {
        success: false,
        changes: [],
        explanation:
          error instanceof Error ? error.message : "Failed to process refinement",
        requiresRegeneration: false,
      };
    }
  }

  /**
   * Analyze the request to determine its scope
   */
  private async analyzeRequestScope(
    request: RefinementRequest
  ): Promise<RefinementScope> {
    const pagesInfo = this.previewState.pages
      .map((p) => `${p.name}: ${p.components.map((c) => c.type).join(", ")}`)
      .join("\n");

    const { object } = await generateObject({
      model: getAIModel("iteration"),
      schema: RefinementScopeSchema,
      prompt: `Analyze this refinement request and determine its scope.

Request: "${request.request}"

Current Preview State:
- Pages: ${this.previewState.pages.map((p) => p.name).join(", ")}
- Components per page:
${pagesInfo}

Determine:
1. Type: Is this about a specific component, page, styling, content, or general?
2. Targets: Which specific components or pages are affected?
3. Requires Regeneration: Can this be done with prop changes or does it need regeneration?

Examples:
- "Make the hero bigger" → component, target: Hero, no regen
- "Change all colors to blue" → style, no targets, no regen
- "Rewrite the about section" → content, target: About page, no regen
- "Add a testimonials section" → general, requires regen
`,
    });

    return object;
  }

  /**
   * Refine specific components
   */
  private async refineComponent(
    request: RefinementRequest,
    targetIds: string[]
  ): Promise<Change[]> {
    const changes: Change[] = [];

    for (const targetId of targetIds) {
      const component = this.findComponent(targetId);
      if (!component) continue;

      try {
        const { object } = await generateObject({
          model: getAIModel("iteration"),
          schema: ComponentChangeSchema,
          prompt: `Refine this component based on the user's request.

Component: ${component.type}
Current props: ${JSON.stringify(component.props, null, 2)}

User request: "${request.request}"

Return the specific prop changes needed. Only include props that need to change.
`,
        });

        for (const change of object.changes) {
          changes.push({
            type: "component",
            target: component.id,
            field: change.field,
            oldValue: component.props[change.field],
            newValue: change.newValue,
            description: change.reason,
          });
        }
      } catch (error) {
        console.error(
          `[IterationEngine] Error refining component ${targetId}:`,
          error
        );
      }
    }

    return changes;
  }

  /**
   * Refine page-level changes
   */
  private async refinePage(
    request: RefinementRequest,
    targetSlugs: string[]
  ): Promise<Change[]> {
    const changes: Change[] = [];

    for (const slug of targetSlugs) {
      const page = this.previewState.pages.find((p) => p.slug === slug);
      if (!page) continue;

      // Refine all components on the page
      for (const component of page.components) {
        const componentChanges = await this.refineComponent(request, [
          component.id,
        ]);
        changes.push(...componentChanges);
      }
    }

    return changes;
  }

  /**
   * Refine styling across the site
   */
  private async refineStyle(request: RefinementRequest): Promise<Change[]> {
    const changes: Change[] = [];

    try {
      const { object } = await generateObject({
        model: getAIModel("iteration"),
        schema: StyleChangeSchema,
        prompt: `Apply style changes based on the user's request.

User request: "${request.request}"

Current design system: ${JSON.stringify(this.previewState.designSystem, null, 2)}

Return:
1. Design system level changes (colors, typography, etc.)
2. Component-level style changes that should apply to all instances
`,
      });

      // Design system color changes
      if (object.designSystemChanges.colors) {
        changes.push({
          type: "style",
          target: "global",
          field: "colors",
          newValue: object.designSystemChanges.colors,
          description: "Updated color palette",
        });
      }

      // Design system typography changes
      if (object.designSystemChanges.typography) {
        changes.push({
          type: "style",
          target: "global",
          field: "typography",
          newValue: object.designSystemChanges.typography,
          description: "Updated typography",
        });
      }

      // Component style changes
      for (const componentChange of object.componentStyleChanges) {
        for (const page of this.previewState.pages) {
          for (const component of page.components) {
            if (component.type === componentChange.componentType) {
              for (const [field, value] of Object.entries(
                componentChange.props
              )) {
                changes.push({
                  type: "component",
                  target: component.id,
                  field,
                  oldValue: component.props[field],
                  newValue: value,
                  description: `Style update for ${component.type}`,
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("[IterationEngine] Error refining style:", error);
    }

    return changes;
  }

  /**
   * Refine content (text, copy, etc.)
   */
  private async refineContent(
    request: RefinementRequest,
    targetIds: string[]
  ): Promise<Change[]> {
    const changes: Change[] = [];
    const contentFields = [
      "headline",
      "subheadline",
      "title",
      "description",
      "text",
      "content",
      "ctaText",
      "buttonText",
      "label",
      "body",
      "paragraph",
    ];

    for (const targetId of targetIds) {
      const component = this.findComponent(targetId);
      if (!component) continue;

      // Only process content fields
      const contentProps = Object.fromEntries(
        Object.entries(component.props).filter(([k]) =>
          contentFields.some((f) => k.toLowerCase().includes(f.toLowerCase()))
        )
      );

      if (Object.keys(contentProps).length === 0) continue;

      try {
        const { object } = await generateObject({
          model: getAIModel("iteration"),
          schema: ComponentChangeSchema,
          prompt: `Rewrite content based on the user's request.

Component: ${component.type}
Current content fields: ${JSON.stringify(contentProps, null, 2)}

User request: "${request.request}"

Return only content field changes (headlines, descriptions, button text, etc.)
`,
        });

        for (const change of object.changes) {
          changes.push({
            type: "content",
            target: component.id,
            field: change.field,
            oldValue: component.props[change.field],
            newValue: change.newValue,
            description: change.reason,
          });
        }
      } catch (error) {
        console.error(
          `[IterationEngine] Error refining content ${targetId}:`,
          error
        );
      }
    }

    return changes;
  }

  /**
   * Handle general refinement requests
   */
  private async refineGeneral(request: RefinementRequest): Promise<Change[]> {
    // For general requests, try style first, then content
    const styleChanges = await this.refineStyle(request);

    if (styleChanges.length > 0) {
      return styleChanges;
    }

    // Try content refinement on all pages
    const allComponentIds = this.previewState.pages.flatMap((p) =>
      p.components.map((c) => c.id)
    );

    return this.refineContent(request, allComponentIds);
  }

  /**
   * Find a component by ID or type
   */
  private findComponent(idOrType: string): PreviewComponent | null {
    for (const page of this.previewState.pages) {
      const component = page.components.find(
        (c) => c.id === idOrType || c.type === idOrType
      );
      if (component) return component;
    }
    return null;
  }

  /**
   * Generate explanation text for changes
   */
  private generateExplanation(changes: Change[]): string {
    if (changes.length === 0) {
      return "No changes were made.";
    }

    const summary = changes.map((c) => c.description).join(". ");
    return `Made ${changes.length} change(s): ${summary}`;
  }

  /**
   * Apply changes to create new preview state
   */
  applyChanges(changes: Change[]): PreviewState {
    // Deep clone the state
    const newState = JSON.parse(JSON.stringify(this.previewState)) as PreviewState;
    newState.version += 1;
    newState.generatedAt = new Date();
    newState.status = "preview";

    for (const change of changes) {
      if (change.type === "component" || change.type === "content") {
        // Find and update component
        for (const page of newState.pages) {
          const component = page.components.find((c) => c.id === change.target);
          if (component && change.field) {
            component.props[change.field] = change.newValue;
            component.hasChanges = true;
            component.renderKey = `${component.id}-${Date.now()}`;
          }
        }
      } else if (change.type === "style" && change.target === "global") {
        // Update design system
        if (change.field === "colors" && typeof change.newValue === "object") {
          Object.assign(newState.designSystem.colors, change.newValue);
        }
        if (change.field === "typography" && typeof change.newValue === "object") {
          Object.assign(newState.designSystem.typography, change.newValue);
        }
      }
    }

    // Add iteration record
    const iteration: Iteration = {
      id: crypto.randomUUID(),
      version: newState.version,
      request: "User refinement",
      changes,
      timestamp: new Date(),
      approved: false,
    };

    newState.iterations.push(iteration);
    newState.currentIteration = newState.iterations.length - 1;

    return newState;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Quick refinement suggestions
 */
export const QUICK_REFINEMENTS = [
  "Make it more modern",
  "Use brighter colors",
  "Add more white space",
  "Make headlines bolder",
  "Simplify the design",
  "Add more animations",
  "Make it more professional",
  "Use warmer colors",
  "Make text larger",
  "Add more contrast",
];
