/**
 * DRAMAC Studio Template Utilities
 * 
 * Utilities for cloning templates, replacing tokens, and inserting templates.
 * 
 * Phase: STUDIO-24 Section Templates
 */

import { nanoid } from 'nanoid';
import type { StudioComponent } from '@/types/studio';
import type {
  SectionTemplate,
  SiteColorScheme,
  ColorTokenMap,
  TextTokenMap,
} from '@/types/studio-templates';

// =============================================================================
// ID GENERATION
// =============================================================================

/**
 * Generate a new component ID
 */
function generateId(): string {
  return `comp_${nanoid(10)}`;
}

// =============================================================================
// TOKEN REPLACEMENT
// =============================================================================

/**
 * Escape special regex characters in a string
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Deep replace tokens in an object
 */
function replaceTokensInValue(
  value: unknown,
  tokens: Record<string, string>,
  replacements: Record<string, string>
): unknown {
  if (typeof value === 'string') {
    let result = value;
    for (const [token, key] of Object.entries(tokens)) {
      if (result.includes(token) && replacements[key]) {
        result = result.replace(new RegExp(escapeRegex(token), 'g'), replacements[key]);
      }
    }
    return result;
  }
  
  if (Array.isArray(value)) {
    return value.map(item => replaceTokensInValue(item, tokens, replacements));
  }
  
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = replaceTokensInValue(v, tokens, replacements);
    }
    return result;
  }
  
  return value;
}

// =============================================================================
// CLONING
// =============================================================================

/**
 * Clone template components with new unique IDs
 */
export function cloneTemplateComponents(
  components: StudioComponent[]
): StudioComponent[] {
  const idMap = new Map<string, string>();
  
  // First pass: generate new IDs for all components
  components.forEach(comp => {
    idMap.set(comp.id, generateId());
  });
  
  // Second pass: update all ID references
  return components.map(comp => ({
    ...comp,
    id: idMap.get(comp.id)!,
    parentId: comp.parentId ? idMap.get(comp.parentId) : undefined,
    children: comp.children?.map(childId => idMap.get(childId) || childId),
  }));
}

/**
 * Replace color tokens in components with site colors
 */
export function replaceColorTokens(
  components: StudioComponent[],
  colorTokens: ColorTokenMap,
  siteColors: SiteColorScheme
): StudioComponent[] {
  return components.map(comp => ({
    ...comp,
    props: replaceTokensInValue(
      comp.props,
      colorTokens,
      siteColors as unknown as Record<string, string>
    ) as Record<string, unknown>,
  }));
}

/**
 * Replace text tokens in components with placeholder texts
 */
export function replaceTextTokens(
  components: StudioComponent[],
  textTokens: TextTokenMap
): StudioComponent[] {
  return components.map(comp => ({
    ...comp,
    props: replaceTokensInValue(
      comp.props,
      textTokens,
      textTokens
    ) as Record<string, unknown>,
  }));
}

/**
 * Prepare template for insertion
 * 1. Clone with new IDs
 * 2. Replace color tokens with site colors
 * 3. Replace text tokens with placeholders
 */
export function prepareTemplateForInsertion(
  template: SectionTemplate,
  siteColors: SiteColorScheme
): StudioComponent[] {
  // Step 1: Clone with new IDs
  let components = cloneTemplateComponents(template.components);
  
  // Step 2: Replace color tokens
  components = replaceColorTokens(components, template.colorTokens, siteColors);
  
  // Step 3: Replace text tokens (keep placeholder text for user to customize)
  components = replaceTextTokens(components, template.textTokens);
  
  return components;
}

// =============================================================================
// COMPONENT HELPERS
// =============================================================================

/**
 * Get the root component(s) from template components
 * Root components have no parentId
 */
export function getTemplateRootComponents(
  components: StudioComponent[]
): StudioComponent[] {
  return components.filter(c => !c.parentId);
}

/**
 * Get child components for a given parent ID
 */
export function getTemplateChildComponents(
  components: StudioComponent[],
  parentId: string
): StudioComponent[] {
  return components.filter(c => c.parentId === parentId);
}

/**
 * Convert components array to a record keyed by ID
 */
export function componentsToRecord(
  components: StudioComponent[]
): Record<string, StudioComponent> {
  return components.reduce((acc, comp) => {
    acc[comp.id] = comp;
    return acc;
  }, {} as Record<string, StudioComponent>);
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Default site colors (used if site doesn't have custom colors)
 */
export const DEFAULT_SITE_COLORS: SiteColorScheme = {
  primary: '#3B82F6',      // Blue
  secondary: '#8B5CF6',    // Purple
  accent: '#10B981',       // Green
  background: '#FFFFFF',
  foreground: '#0F172A',
  muted: '#F1F5F9',
  mutedForeground: '#64748B',
  border: '#E2E8F0',
};
