/**
 * Page Generation Prompt Builders
 * 
 * Builds comprehensive system prompts for full page generation with Claude.
 * Phase STUDIO-12: AI Page Generator
 */

import type { 
  AIPageGenerationRequest, 
  BusinessType,
  ColorScheme,
  ContentTone,
} from "./types";
import { COLOR_SCHEMES } from "./types";

/**
 * Minimal component interface for prompt generation
 * Compatible with both ComponentDefinition and ComponentMetadata
 */
interface PromptComponent {
  type: string;
  label: string;
  category?: string;
  description?: string;
  acceptsChildren?: boolean;
  ai?: {
    description?: string;
    usageGuidelines?: string;
    suggestedWith?: string[];
  };
}

/**
 * Format available components for the prompt
 */
function formatComponentsForPrompt(
  components: PromptComponent[]
): string {
  // Group by category
  const byCategory: Record<string, PromptComponent[]> = {};
  
  for (const comp of components) {
    const category = comp.category || "other";
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(comp);
  }
  
  const lines: string[] = [];
  
  for (const [category, comps] of Object.entries(byCategory)) {
    lines.push(`\n### ${category.charAt(0).toUpperCase() + category.slice(1)}`);
    for (const comp of comps) {
      const desc = comp.ai?.description || comp.description || comp.label;
      const acceptsChildren = comp.acceptsChildren ? " [container]" : "";
      lines.push(`- **${comp.type}**: ${desc}${acceptsChildren}`);
    }
  }
  
  return lines.join("\n");
}

/**
 * Get color instructions based on scheme
 */
function getColorInstructions(
  scheme: ColorScheme | undefined,
  customColors?: AIPageGenerationRequest["customColors"]
): string {
  if (!scheme) {
    return "Use a professional, modern color palette with good contrast.";
  }
  
  const colors = scheme === "custom" && customColors
    ? customColors
    : COLOR_SCHEMES[scheme]?.colors;
  
  if (!colors) {
    return "Use a professional, modern color palette with good contrast.";
  }
  
  return `Use this color scheme:
- Primary: ${colors.primary}
- Secondary: ${colors.secondary}
- Accent: ${colors.accent}
- Background: ${colors.background}
- Text: ${colors.text}`;
}

/**
 * Get tone instructions
 */
function getToneInstructions(tone: ContentTone | undefined): string {
  switch (tone) {
    case "professional":
      return "Use a professional, authoritative tone. Focus on credibility and expertise.";
    case "casual":
      return "Use a friendly, approachable tone. Be conversational but clear.";
    case "playful":
      return "Use a fun, energetic tone. Include emojis where appropriate and be creative.";
    case "formal":
      return "Use a formal, sophisticated tone. Avoid colloquialisms.";
    case "inspirational":
      return "Use an inspiring, motivational tone. Focus on emotions and aspirations.";
    default:
      return "Use a balanced, professional yet approachable tone.";
  }
}

/**
 * Get business context
 */
function getBusinessContext(businessType: BusinessType | undefined): string {
  if (!businessType || businessType === "other") {
    return "";
  }
  
  const contexts: Record<BusinessType, string> = {
    technology: "This is for a tech company. Emphasize innovation, speed, and reliability.",
    healthcare: "This is for healthcare. Emphasize trust, care, and professionalism.",
    finance: "This is for finance. Emphasize security, stability, and growth.",
    education: "This is for education. Emphasize learning, growth, and accessibility.",
    ecommerce: "This is for e-commerce. Emphasize products, value, and easy shopping.",
    restaurant: "This is for a restaurant. Emphasize food quality, atmosphere, and experience.",
    fitness: "This is for fitness. Emphasize energy, transformation, and community.",
    "real-estate": "This is for real estate. Emphasize trust, lifestyle, and investment.",
    agency: "This is for an agency. Emphasize creativity, results, and expertise.",
    nonprofit: "This is for nonprofit. Emphasize impact, community, and mission.",
    saas: "This is for SaaS. Emphasize features, benefits, and user success.",
    other: "",
  };
  
  return contexts[businessType];
}

/**
 * Build the main system prompt for page generation
 */
export function buildPageGenerationPrompt(
  availableComponents: PromptComponent[],
  request: AIPageGenerationRequest
): string {
  const { businessType, colorScheme, customColors, tone } = request;
  
  return `You are DRAMAC Studio AI - an expert website page generator. You create complete, professional website pages from user descriptions.

## YOUR TASK

Generate a complete StudioPageData JSON structure based on the user's description. Create a well-structured, visually appealing page using the available components.

## AVAILABLE COMPONENTS
${formatComponentsForPrompt(availableComponents)}

## STYLING GUIDELINES

${getColorInstructions(colorScheme, customColors)}

${getToneInstructions(tone)}

${getBusinessContext(businessType)}

## PAGE STRUCTURE GUIDELINES

1. **Always start with a Section component** as the outermost wrapper
2. **Sections contain Containers** which contain content components
3. **Use proper nesting:**
   - Section → Container → Content (Heading, Text, Button, etc.)
   - Columns can contain multiple child components
4. **Create a logical hierarchy** with clear visual sections
5. **Include 4-8 sections** typically:
   - Hero (first section, larger, impactful)
   - Feature/benefit sections
   - Social proof (testimonials, stats)
   - Call-to-action (clear next step)
6. **Use responsive values** for all sizing:
   \`\`\`json
   "fontSize": { "mobile": "24px", "tablet": "32px", "desktop": "48px" }
   "padding": { "mobile": { "top": "32px" }, "desktop": { "top": "64px" } }
   \`\`\`

## OUTPUT FORMAT

Return a valid StudioPageData JSON with this exact structure:

\`\`\`json
{
  "version": "1.0",
  "root": {
    "id": "root",
    "type": "Root",
    "props": {
      "title": "Page Title Here"
    },
    "children": ["section-1-id", "section-2-id"]
  },
  "components": {
    "section-1-id": {
      "id": "section-1-id",
      "type": "Section",
      "props": {
        "backgroundColor": "#color",
        "padding": "md"
      },
      "children": ["container-1-id"],
      "parentId": "root"
    },
    "container-1-id": {
      "id": "container-1-id",
      "type": "Container",
      "props": { "maxWidth": "xl" },
      "children": ["heading-1-id", "text-1-id"],
      "parentId": "section-1-id"
    },
    "heading-1-id": {
      "id": "heading-1-id",
      "type": "Heading",
      "props": {
        "text": "Your Compelling Headline",
        "level": "h1",
        "size": "4xl",
        "color": "#color"
      },
      "parentId": "container-1-id"
    }
  }
}
\`\`\`

## COMPONENT ID RULES

- Use descriptive IDs: "hero-section", "hero-heading", "features-section", etc.
- IDs must be unique
- Include parentId for all components (use "root" for top-level sections)

## CONTENT GUIDELINES

1. Write compelling, realistic content - not placeholder text
2. Use specific numbers and details ("Join 10,000+ users", "Save 20 hours/week")
3. Include relevant emojis where appropriate for the tone
4. Make CTAs action-oriented ("Start Free Trial", "Get Started Today")
5. Keep text lengths appropriate:
   - Headlines: 4-10 words
   - Subheadlines: 10-20 words
   - Body text: 2-4 sentences
   - Button text: 2-4 words

## IMPORTANT

1. Return ONLY valid JSON - no markdown code blocks, no explanations
2. All component IDs must be unique strings
3. All children arrays must reference valid component IDs
4. Ensure proper parent-child relationships
5. Generate at least 15-30 components for a complete page
6. Include all required props for each component type
7. Use actual component type names from the available components list`;
}

/**
 * Build the user prompt with the request details
 */
export function buildUserPrompt(request: AIPageGenerationRequest): string {
  const parts: string[] = [];
  
  // Main prompt
  parts.push(request.prompt);
  
  // Template hint
  if (request.template) {
    parts.push(`\nBase this on a ${request.template} page template structure.`);
  }
  
  // Page title
  if (request.pageTitle) {
    parts.push(`\nPage title should be: "${request.pageTitle}"`);
  }
  
  return parts.join("\n");
}
