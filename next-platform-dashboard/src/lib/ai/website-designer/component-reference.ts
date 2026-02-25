/**
 * AI Website Designer — Dynamic Component Reference Cards
 * 
 * Reads the live component registry and generates reference cards
 * showing every field name, type, valid options, and defaults.
 * 
 * KEY INNOVATION: The AI now sees its full toolkit. When new components
 * are registered, the AI discovers them automatically — no prompt updates needed.
 * 
 * Two-tier strategy:
 * - Medium-detail for architecture (component SELECTION): name, category, description, key props
 * - Full-detail for page generation (component CONFIGURATION): every field, every option, every default
 */

import { componentRegistry, initializeRegistry, isRegistryInitialized } from "@/lib/studio/registry";
import type { ComponentDefinition, FieldDefinition } from "@/types/studio";

// Categories that AI should know about — covers all usable component types
const AI_RELEVANT_CATEGORIES = [
  "sections",
  "marketing",
  "content",
  "forms",
  "interactive",
  "media",
  "navigation",
  "ecommerce",
  "layout",
  "typography",
  "buttons",
  "3d",
];

/**
 * Format a single field definition into a concise reference string
 */
function formatField(key: string, field: FieldDefinition, includeDefaults: boolean): string {
  let desc = key;

  if (field.type === "select" && field.options && field.options.length > 0) {
    const values = field.options.map((o: { value: string | number }) => o.value).join(" | ");
    desc += `: ${values}`;
  } else if (field.type === "color") {
    desc += `: color (hex)`;
  } else if (field.type === "toggle" || field.type === "checkbox") {
    desc += `: boolean`;
  } else if (field.type === "number") {
    desc += `: number`;
    if (field.min !== undefined || field.max !== undefined) {
      desc += ` (${field.min ?? ""}–${field.max ?? ""})`;
    }
  } else if (field.type === "text" || field.type === "textarea" || field.type === "richtext") {
    desc += `: string`;
  } else if (field.type === "image") {
    desc += `: image URL`;
  } else if (field.type === "link") {
    desc += `: URL path`;
  } else if (field.type === "slider") {
    desc += `: number`;
    if (field.min !== undefined || field.max !== undefined) {
      desc += ` (${field.min ?? 0}–${field.max ?? 100})`;
    }
  } else if (field.type === "array") {
    desc += `: array`;
    if (field.itemFields) {
      const subFields = Object.keys(field.itemFields).join(", ");
      desc += ` of { ${subFields} }`;
    }
  } else if (field.type === "object") {
    desc += `: object`;
    if (field.fields) {
      const subFields = Object.keys(field.fields).join(", ");
      desc += ` { ${subFields} }`;
    }
  } else {
    desc += `: ${field.type}`;
  }

  if (includeDefaults && field.defaultValue !== undefined) {
    const defaultStr = typeof field.defaultValue === "string"
      ? `"${field.defaultValue}"`
      : JSON.stringify(field.defaultValue);
    desc += ` [default: ${defaultStr}]`;
  }

  return `  ${desc}`;
}

/**
 * Classify fields into "key props" (structural/layout) vs "cosmetic props" (colors/sizes)
 * Key props help the AI decide WHICH component to use (medium-detail tier)
 */
function isKeyProp(key: string, field: FieldDefinition): boolean {
  // Always include these structural props
  const keyPropNames = [
    "variant", "layout", "columns", "style", "align", "contentAlign",
    "minHeight", "maxWidth", "showScrollIndicator", "animateOnLoad",
    "position", "showOnScrollUp", "hideOnScroll",
    // Array fields are structural
  ];
  if (keyPropNames.some(k => key.toLowerCase().includes(k.toLowerCase()))) return true;
  if (field.type === "array") return true;
  if (field.type === "select" && key === "variant") return true;
  
  // Skip purely cosmetic fields for medium-detail
  const cosmeticPatterns = [
    "color", "Color", "background", "Background", "shadow", "Shadow",
    "border", "Border", "radius", "Radius", "opacity", "Opacity",
    "size", "Size", "weight", "Weight", "font", "Font",
    "padding", "Padding", "margin", "Margin", "gap", "Gap",
    "hover", "Hover", "animation", "Animation", "delay", "Delay",
    "gradient", "Gradient",
  ];
  
  if (cosmeticPatterns.some(p => key.includes(p))) return false;

  // Include content-related fields
  if (["text", "textarea", "image", "link"].includes(field.type)) return true;
  
  return false;
}

/**
 * Generate MEDIUM-DETAIL component reference for architecture prompt.
 * Shows component name, category, description, and key structural props.
 * Used for component SELECTION — "which components should this site use?"
 * 
 * ~50-80 words per component, ~2,000-3,000 words total
 */
export function generateArchitectureReference(): string {
  // Ensure registry is populated — critical for server-side (API routes, engine)
  // where no client-side component has called initializeRegistry() yet.
  if (!isRegistryInitialized()) {
    initializeRegistry();
  }

  const allComponents = componentRegistry.getAll();
  
  const filtered = allComponents.filter(
    (c: ComponentDefinition) => AI_RELEVANT_CATEGORIES.includes(c.category)
  );

  if (filtered.length === 0) return "No components available.";

  return filtered.map((comp: ComponentDefinition) => {
    const fields = comp.fields || {};
    const keyFields = Object.entries(fields)
      .filter(([key, field]) => isKeyProp(key, field as FieldDefinition))
      .map(([key, field]) => formatField(key, field as FieldDefinition, true));

    // For arrays, show the sub-field structure briefly
    const arrayFields = Object.entries(fields)
      .filter(([, field]) => (field as FieldDefinition).type === "array" && (field as FieldDefinition).itemFields);

    let arrayInfo = "";
    if (arrayFields.length > 0) {
      arrayInfo = arrayFields.map(([key, field]) => {
        const fd = field as FieldDefinition;
        if (fd.itemFields) {
          const subKeys = Object.keys(fd.itemFields).join(", ");
          return `  ${key}: array of { ${subKeys} }`;
        }
        return "";
      }).filter(Boolean).join("\n");
    }

    // Get variant options if they exist
    const variantField = fields["variant"] as FieldDefinition | undefined;
    let variantLine = "";
    if (variantField?.options && variantField.options.length > 0) {
      const variants = variantField.options.map((o: { value: string | number }) => o.value).join(", ");
      variantLine = `\nVariants: ${variants}`;
    }

    const totalFields = Object.keys(fields).length;
    const description = comp.description || comp.label;

    return `### ${comp.type} (${comp.category})
${description} [${totalFields} configurable props]${variantLine}${keyFields.length > 0 ? "\nKey props:\n" + keyFields.join("\n") : ""}${arrayInfo ? "\n" + arrayInfo : ""}`;
  }).join("\n\n");
}

/**
 * Generate FULL-DETAIL component reference for page generation.
 * Shows every field name, type, valid options, and defaults.
 * Used for component CONFIGURATION — "how exactly do I configure this component?"
 * 
 * @param componentTypes - Array of component type names to include. 
 *                         If empty/undefined, includes all AI-relevant components.
 * @param includeOtherBrief - If true, also includes brief cards for other available components
 */
export function generatePageReference(
  componentTypes?: string[],
  includeOtherBrief: boolean = true
): string {
  // Ensure registry is populated — critical for server-side (API routes, engine)
  if (!isRegistryInitialized()) {
    initializeRegistry();
  }

  const allComponents = componentRegistry.getAll();
  
  const aiRelevant = allComponents.filter(
    (c: ComponentDefinition) => AI_RELEVANT_CATEGORIES.includes(c.category)
  );

  let primary: ComponentDefinition[];
  let secondary: ComponentDefinition[] = [];

  if (componentTypes && componentTypes.length > 0) {
    // Full detail for specified components
    primary = aiRelevant.filter((c: ComponentDefinition) => 
      componentTypes.includes(c.type)
    );
    // Brief reference for other available components
    if (includeOtherBrief) {
      secondary = aiRelevant.filter((c: ComponentDefinition) => 
        !componentTypes.includes(c.type)
      );
    }
  } else {
    primary = aiRelevant;
  }

  let output = "";

  // Add essential color props guide at the top so AI knows what to set
  output += `## ESSENTIAL STYLING PROPS — Set these on EVERY section

Every section component accepts these color props. You MUST set them to avoid generic defaults.

**On every section (Hero, Features, CTA, Testimonials, Stats, FAQ, etc.):**
- backgroundColor: hex color — the section background. ALTERNATE between light/dark for rhythm.
- textColor: hex color — default text color. Must contrast with backgroundColor.
- titleColor: hex color — heading/title color.
- subtitleColor: hex color — subtitle text color.
- accentColor: hex color — accent for icons, decorations, highlights.

**On sections with buttons (Hero, CTA, Pricing):**
- buttonColor / primaryButtonColor: hex — button background.
- buttonTextColor / primaryButtonTextColor: hex — button text. MUST contrast with button bg.
- secondaryButtonColor / secondaryButtonTextColor: hex — for secondary buttons.

**On sections with cards (Features, Testimonials, Stats, Pricing):**
- cardBackgroundColor: hex — card fill (use white on colored section bg, or light tint on white bg).
- cardBorderColor: hex — card border.

**Decorative:**
- backgroundGradientFrom / backgroundGradientTo: hex — for gradient backgrounds.
- decoratorColor, badgeColor, badgeTextColor: hex — accent decorations.
- defaultIconColor / defaultIconBackgroundColor: hex — icon styling.

Apply your design tokens: use primaryColor, secondaryColor, accentColor from context.

`;

  if (primary.length > 0) {
    output += "## FULL COMPONENT REFERENCE (use these on this page)\n\n";
    output += primary.map((comp: ComponentDefinition) => {
      const fields = comp.fields || {};
      const fieldLines = Object.entries(fields)
        .map(([key, field]) => formatField(key, field as FieldDefinition, true));

      return `### ${comp.type} (${comp.category})
${comp.description || comp.label}
Props:
${fieldLines.join("\n")}`;
    }).join("\n\n");
  }

  if (secondary.length > 0) {
    output += "\n\n## OTHER AVAILABLE COMPONENTS (you can also use these)\n\n";
    output += secondary.map((comp: ComponentDefinition) => {
      const variantField = (comp.fields || {})["variant"] as FieldDefinition | undefined;
      let variantInfo = "";
      if (variantField?.options && variantField.options.length > 0) {
        variantInfo = ` — variants: ${variantField.options.map((o: { value: string | number }) => o.value).join(", ")}`;
      }
      return `- **${comp.type}** (${comp.category}): ${comp.description || comp.label}${variantInfo}`;
    }).join("\n");
  }

  return output;
}
