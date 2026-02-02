/**
 * AI Prompt Builders for DRAMAC Studio
 * 
 * Builds context-aware prompts for component editing.
 * Phase STUDIO-11: AI Component Chat
 */

import type { FieldDefinition, FieldType } from "@/types/studio";
import type { AIComponentContext, FieldTypeInfo } from "./types";

// =============================================================================
// FIELD TYPE DESCRIPTIONS
// =============================================================================

const FIELD_TYPE_INFO: Record<FieldType, FieldTypeInfo> = {
  text: {
    type: "text",
    description: "Single line text string",
    example: '"Hello World"',
  },
  textarea: {
    type: "textarea",
    description: "Multi-line text string",
    example: '"Line 1\\nLine 2\\nLine 3"',
  },
  number: {
    type: "number",
    description: "Numeric value",
    example: "42",
  },
  select: {
    type: "select",
    description: "One of predefined options",
    example: '"option1"',
  },
  radio: {
    type: "radio",
    description: "One of predefined options",
    example: '"option1"',
  },
  checkbox: {
    type: "checkbox",
    description: "Boolean true/false",
    example: "true",
  },
  toggle: {
    type: "toggle",
    description: "Boolean on/off",
    example: "true",
  },
  color: {
    type: "color",
    description: "CSS color value (hex preferred)",
    example: '"#3B82F6" or "rgb(59, 130, 246)" or "blue"',
  },
  image: {
    type: "image",
    description: "Image object with URL and optional alt text",
    example: '{ "url": "https://example.com/image.jpg", "alt": "Description" }',
  },
  link: {
    type: "link",
    description: "Link object with URL/href and optional target",
    example: '{ "href": "/page", "target": "_blank", "label": "Click here" }',
  },
  spacing: {
    type: "spacing",
    description: "Spacing object with top/right/bottom/left values",
    example: '{ "top": "16px", "right": "24px", "bottom": "16px", "left": "24px" }',
  },
  typography: {
    type: "typography",
    description: "Typography settings object",
    example: '{ "fontFamily": "Inter", "fontSize": "18px", "fontWeight": "600", "lineHeight": "1.5" }',
  },
  array: {
    type: "array",
    description: "Array of items with defined structure",
    example: '[{ "title": "Item 1" }, { "title": "Item 2" }]',
  },
  object: {
    type: "object",
    description: "Nested object with defined fields",
    example: '{ "title": "Hello", "description": "World" }',
  },
  richtext: {
    type: "richtext",
    description: "HTML content string",
    example: '"<p>Hello <strong>World</strong></p>"',
  },
  code: {
    type: "code",
    description: "Code string",
    example: '"const x = 1;"',
  },
  slider: {
    type: "slider",
    description: "Numeric value from range",
    example: "50",
  },
  custom: {
    type: "custom",
    description: "Custom field (check current value for format)",
    example: "(varies)",
  },
};

// =============================================================================
// PROMPT BUILDERS
// =============================================================================

/**
 * Format field definitions for AI prompt
 */
function formatFieldsForPrompt(fields: Record<string, FieldDefinition>): string {
  const lines: string[] = [];
  
  for (const [name, field] of Object.entries(fields)) {
    const typeInfo = FIELD_TYPE_INFO[field.type] || FIELD_TYPE_INFO.custom;
    let line = `- ${name} (${field.type}): ${field.label}`;
    
    if (field.description) {
      line += ` - ${field.description}`;
    }
    
    // Add constraints
    const constraints: string[] = [];
    if (field.options?.length) {
      constraints.push(`options: ${field.options.map(o => o.value).join(", ")}`);
    }
    if (field.min !== undefined) constraints.push(`min: ${field.min}`);
    if (field.max !== undefined) constraints.push(`max: ${field.max}`);
    if (field.responsive) constraints.push("RESPONSIVE (use { mobile, tablet?, desktop? })");
    
    if (constraints.length > 0) {
      line += ` [${constraints.join("; ")}]`;
    }
    
    lines.push(line);
  }
  
  return lines.join("\n");
}

/**
 * Build the system prompt for component editing
 */
export function buildComponentSystemPrompt(context: AIComponentContext): string {
  const {
    componentType,
    componentLabel,
    componentDescription,
    currentProps,
    fields,
    aiContext,
    pageContext,
  } = context;
  
  return `You are an AI assistant for DRAMAC Studio, a professional website builder similar to Webflow or Wix Studio. You help users edit component properties using natural language.

## COMPONENT CONTEXT

You are editing a **${componentLabel}** (type: ${componentType})${componentDescription ? `\n${componentDescription}` : ""}
${aiContext?.description ? `\nAI Context: ${aiContext.description}` : ""}

## CURRENT PROPERTIES

\`\`\`json
${JSON.stringify(currentProps, null, 2)}
\`\`\`

## AVAILABLE FIELDS

${formatFieldsForPrompt(fields)}

${aiContext?.canModify ? `\n## MODIFIABLE FIELDS (AI can change these)\n${aiContext.canModify.join(", ")}` : ""}

${pageContext ? `
## PAGE CONTEXT

- Page Title: ${pageContext.title || "(untitled)"}
- Page Description: ${pageContext.description || "(none)"}
- Other components on page: ${pageContext.otherComponentTypes?.join(", ") || "(none)"}
` : ""}

## FIELD TYPE REFERENCE

For RESPONSIVE fields, always provide an object with at least "mobile" key:
\`\`\`json
{
  "mobile": "value",      // REQUIRED - base/default value
  "tablet": "value",      // Optional - 768px+ override
  "desktop": "value"      // Optional - 1024px+ override
}
\`\`\`

For SPACING fields, provide all four sides:
\`\`\`json
{
  "top": "16px",
  "right": "24px",
  "bottom": "16px",
  "left": "24px"
}
\`\`\`

For COLOR fields, use hex codes: "#3B82F6"

For IMAGE fields:
\`\`\`json
{
  "url": "https://...",
  "alt": "Description"
}
\`\`\`

## RESPONSE FORMAT

Respond with a JSON object containing exactly two fields:
1. "changes" - An object with ONLY the props you want to change
2. "explanation" - A brief explanation of what you changed and why

Example response:
\`\`\`json
{
  "changes": {
    "text": "New exciting heading! 🚀",
    "color": "#3B82F6"
  },
  "explanation": "Made the heading more exciting by adding an emoji and changed the color to a vibrant blue to stand out more."
}
\`\`\`

## GUIDELINES

1. Only include props you want to change in "changes"
2. Respect field types exactly (colors as hex, spacing as objects, etc.)
3. For responsive fields, include the full responsive object
4. Keep text changes similar in length unless asked otherwise
5. Be creative but professional
6. Don't change props the user didn't ask about
7. If you can't fulfill a request, explain why in the explanation

## IMPORTANT

Return ONLY valid JSON. No markdown code blocks, no extra text, just the JSON object.`;
}

/**
 * Build a concise context summary for follow-up messages
 */
export function buildFollowUpContext(context: AIComponentContext): string {
  const textProp = context.currentProps.text || context.currentProps.content || context.currentProps.title || "(no text)";
  return `Editing ${context.componentLabel} component. Current text: "${textProp}". Respond with the same JSON format: { "changes": {...}, "explanation": "..." }`;
}

/**
 * Get field type info
 */
export function getFieldTypeInfo(type: FieldType): FieldTypeInfo {
  return FIELD_TYPE_INFO[type] || FIELD_TYPE_INFO.custom;
}
