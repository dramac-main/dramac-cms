/**
 * LP AI Post-Processing Utilities
 * Phase LPB-09: AI Landing Page Generator
 *
 * Converts raw AI output into valid Studio component trees.
 */

import { LP_COMPONENT_TYPES } from "../types/lp-builder-types";

// ─── Types ─────────────────────────────────────────────────────

export interface AIGeneratedComponent {
  type: string;
  props: Record<string, unknown>;
}

export interface AIGeneratedLP {
  title: string;
  slug: string;
  description: string;
  components: AIGeneratedComponent[];
  conversionGoal: string;
  showHeader: boolean;
  showFooter: boolean;
}

// ─── Allowed component types ───────────────────────────────────

const VALID_TYPES: Set<string> = new Set(Object.values(LP_COMPONENT_TYPES));

// ─── Utils ─────────────────────────────────────────────────────

/** Generate a unique component ID */
function generateId(): string {
  return `lp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Sanitize a generated slug */
function sanitizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/** Strip any HTML tags from text props to prevent XSS */
function stripHtml(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(/<[^>]*>/g, "");
  }
  return value;
}

// ─── Core Functions ────────────────────────────────────────────

/**
 * Assign unique IDs to every component in the tree.
 */
export function assignUniqueIds(
  components: AIGeneratedComponent[],
): (AIGeneratedComponent & { id: string })[] {
  return components.map((c) => ({
    ...c,
    id: generateId(),
  }));
}

/**
 * Filter out any component types the AI hallucinated.
 * Only allow known LP_COMPONENT_TYPES.
 */
export function filterValidComponents(
  components: AIGeneratedComponent[],
): AIGeneratedComponent[] {
  return components.filter((c) => VALID_TYPES.has(c.type));
}

/**
 * Inject default form fields into any LPForm components
 * that are missing a fields definition.
 */
export function injectFormFields(
  components: AIGeneratedComponent[],
): AIGeneratedComponent[] {
  return components.map((c) => {
    if (c.type !== LP_COMPONENT_TYPES.FORM) return c;

    const props = { ...c.props };
    // Ensure fields prop is set
    if (!props.fields) {
      props.fields = "name,email,phone,message";
    }
    // Ensure submit text
    if (!props.submitText) {
      props.submitText = "Submit";
    }
    return { ...c, props };
  });
}

/**
 * Sanitize all string props to prevent XSS injection.
 */
export function sanitizeProps(
  components: AIGeneratedComponent[],
): AIGeneratedComponent[] {
  return components.map((c) => {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(c.props)) {
      sanitized[key] = stripHtml(value);
    }
    return { ...c, props: sanitized };
  });
}

/**
 * Ensure the LP has at least a hero and a form component.
 * If missing, append defaults.
 */
export function ensureRequiredComponents(
  components: AIGeneratedComponent[],
): AIGeneratedComponent[] {
  const hasHero = components.some((c) => c.type === LP_COMPONENT_TYPES.HERO);
  const hasForm = components.some((c) => c.type === LP_COMPONENT_TYPES.FORM);

  const result = [...components];

  if (!hasHero) {
    result.unshift({
      type: LP_COMPONENT_TYPES.HERO,
      props: {
        variant: "centered",
        headline: "Welcome",
        subheadline: "Tell us about your needs",
        ctaText: "Get Started",
        ctaUrl: "#form",
        minHeight: "60vh",
        verticalAlign: "center",
        textAlign: "center",
      },
    });
  }

  if (!hasForm) {
    result.push({
      type: LP_COMPONENT_TYPES.FORM,
      props: {
        variant: "card",
        heading: "Get in Touch",
        submitText: "Submit",
        fields: "name,email,message",
        redirectUrl: "/thank-you",
      },
    });
  }

  return result;
}

/**
 * Full post-processing pipeline for AI-generated LP content.
 * Runs all validation, sanitation, and enrichment steps.
 */
export function postProcessGeneratedLP(raw: AIGeneratedLP): {
  title: string;
  slug: string;
  description: string;
  contentStudio: Array<AIGeneratedComponent & { id: string }>;
  conversionGoal: string;
  showHeader: boolean;
  showFooter: boolean;
} {
  let components = raw.components;

  // 1. Filter out hallucinated types
  components = filterValidComponents(components);

  // 2. Ensure required sections exist
  components = ensureRequiredComponents(components);

  // 3. Inject form field defaults
  components = injectFormFields(components);

  // 4. Sanitize all text props
  components = sanitizeProps(components);

  // 5. Assign unique IDs
  const withIds = assignUniqueIds(components);

  return {
    title: String(raw.title || "Untitled Landing Page").slice(0, 200),
    slug: sanitizeSlug(raw.slug || raw.title || "untitled"),
    description: String(raw.description || "").slice(0, 500),
    contentStudio: withIds,
    conversionGoal: raw.conversionGoal || "lead_gen",
    showHeader: raw.showHeader ?? false,
    showFooter: raw.showFooter ?? false,
  };
}
