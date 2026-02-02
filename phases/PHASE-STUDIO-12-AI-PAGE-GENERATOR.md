# PHASE-STUDIO-12: AI Page Generator

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-12 |
| Title | AI Page Generator |
| Priority | High |
| Estimated Time | 10-12 hours |
| Dependencies | STUDIO-11 (AI Component Chat) |
| Risk Level | Medium |

## Problem Statement

Creating a website page from scratch requires significant time and design expertise. Users need to manually add components one by one, configure each property, and structure the layout correctly. This is especially daunting for new users or those without design experience.

This phase adds an AI Page Generator that allows users to describe what they want in natural language ("Create a landing page for a fitness app") and receive a fully structured page with appropriate components, content, and styling - ready to customize.

## Goals

- [ ] Create page generation wizard with prompt input
- [ ] Build comprehensive system prompt for page structure
- [ ] Generate valid StudioPageData with proper component hierarchy
- [ ] Support business type and color scheme options
- [ ] Preview generated page before applying
- [ ] Allow regeneration with modified prompt
- [ ] Handle empty canvas and replace existing page scenarios
- [ ] Integrate available components (core + installed modules)
- [ ] Generate responsive values for all components

## Technical Approach

### User Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AI Page Generator Wizard                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Step 1: Describe Your Page                                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  What kind of page would you like to create?                          │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │ Create a modern landing page for a fitness app. Include a       │  │  │
│  │  │ hero section with a bold headline, features section with       │  │  │
│  │  │ 3 key benefits, testimonials, and a call-to-action.            │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  │  Quick Templates:                                                     │  │
│  │  [Landing Page] [About Us] [Services] [Contact] [Pricing]             │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Step 2: Customize (Optional)                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  Business Type:    [Technology ▼]                                     │  │
│  │  Color Scheme:     [Modern Blue ▼]   [Preview Palette]               │  │
│  │  Tone:             [Professional ○] [Casual ●] [Playful ○]           │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                                        [Back]  [Generate Page →]            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

After Generation:
┌─────────────────────────────────────────────────────────────────────────────┐
│  Preview Generated Page                                         [×] Close   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  [Preview of generated page in mini-canvas]                          │  │
│  │                                                                       │  │
│  │  - Hero Section                                                       │  │
│  │  - Features (3 items)                                                 │  │
│  │  - Testimonials                                                       │  │
│  │  - CTA Section                                                        │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Generated 8 components in 4 sections.                                      │
│                                                                             │
│  [Regenerate]  [Modify Prompt]          [Cancel]  [Apply to Canvas →]       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Architecture

```
User Input                   API Route                      Claude
    │                           │                             │
    │  prompt, options          │                             │
    ├──────────────────────────►│                             │
    │                           │   buildPageSystemPrompt()   │
    │                           ├────────────────────────────►│
    │                           │                             │
    │                           │   StudioPageData JSON       │
    │                           │◄────────────────────────────┤
    │                           │                             │
    │   preview data            │   validate + sanitize       │
    │◄──────────────────────────┤                             │
    │                           │                             │
    │   user confirms           │                             │
    ├──────────────────────────►│                             │
    │                           │                             │
    │   setData(pageData)       │                             │
    │                           │                             │
```

## Implementation Tasks

### Task 1: Create Page Generation Types

**Description:** Type definitions for page generation requests and responses.

**Files:**
- MODIFY: `src/lib/studio/ai/types.ts`

**Code to add:**

```typescript
// Add to src/lib/studio/ai/types.ts

/**
 * Business types for page generation context
 */
export type BusinessType =
  | "technology"
  | "healthcare"
  | "finance"
  | "education"
  | "ecommerce"
  | "restaurant"
  | "fitness"
  | "real-estate"
  | "agency"
  | "nonprofit"
  | "saas"
  | "other";

/**
 * Color scheme presets
 */
export type ColorScheme =
  | "modern-blue"
  | "vibrant-purple"
  | "professional-gray"
  | "nature-green"
  | "warm-orange"
  | "elegant-dark"
  | "minimal-light"
  | "bold-red"
  | "custom";

/**
 * Content tone options
 */
export type ContentTone =
  | "professional"
  | "casual"
  | "playful"
  | "formal"
  | "inspirational";

/**
 * Page template quick-start options
 */
export type PageTemplate =
  | "landing"
  | "about"
  | "services"
  | "contact"
  | "pricing"
  | "blog"
  | "portfolio"
  | "team";

/**
 * Page generation request
 */
export interface AIPageGenerationRequest {
  /** Main description of the page */
  prompt: string;
  
  /** Optional business type for context */
  businessType?: BusinessType;
  
  /** Optional color scheme preference */
  colorScheme?: ColorScheme;
  
  /** Custom colors if colorScheme is "custom" */
  customColors?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  
  /** Content tone preference */
  tone?: ContentTone;
  
  /** Quick template to base on */
  template?: PageTemplate;
  
  /** Site ID for module component lookup */
  siteId?: string;
  
  /** Page title */
  pageTitle?: string;
}

/**
 * Page generation response
 */
export interface AIPageGenerationResponse {
  /** Generated page data */
  data: import("@/types/studio").StudioPageData;
  
  /** Description of what was generated */
  explanation: string;
  
  /** Number of components created */
  componentCount: number;
  
  /** Section breakdown */
  sections: Array<{
    name: string;
    componentCount: number;
  }>;
}

/**
 * Color scheme definitions
 */
export const COLOR_SCHEMES: Record<ColorScheme, {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}> = {
  "modern-blue": {
    name: "Modern Blue",
    colors: {
      primary: "#3B82F6",
      secondary: "#1E40AF",
      accent: "#60A5FA",
      background: "#F8FAFC",
      text: "#1E293B",
    },
  },
  "vibrant-purple": {
    name: "Vibrant Purple",
    colors: {
      primary: "#8B5CF6",
      secondary: "#6D28D9",
      accent: "#A78BFA",
      background: "#FAF5FF",
      text: "#1F2937",
    },
  },
  "professional-gray": {
    name: "Professional Gray",
    colors: {
      primary: "#4B5563",
      secondary: "#1F2937",
      accent: "#6B7280",
      background: "#F9FAFB",
      text: "#111827",
    },
  },
  "nature-green": {
    name: "Nature Green",
    colors: {
      primary: "#10B981",
      secondary: "#047857",
      accent: "#34D399",
      background: "#F0FDF4",
      text: "#1F2937",
    },
  },
  "warm-orange": {
    name: "Warm Orange",
    colors: {
      primary: "#F97316",
      secondary: "#EA580C",
      accent: "#FB923C",
      background: "#FFFBEB",
      text: "#1F2937",
    },
  },
  "elegant-dark": {
    name: "Elegant Dark",
    colors: {
      primary: "#E5E7EB",
      secondary: "#9CA3AF",
      accent: "#F3F4F6",
      background: "#111827",
      text: "#F9FAFB",
    },
  },
  "minimal-light": {
    name: "Minimal Light",
    colors: {
      primary: "#18181B",
      secondary: "#3F3F46",
      accent: "#71717A",
      background: "#FFFFFF",
      text: "#18181B",
    },
  },
  "bold-red": {
    name: "Bold Red",
    colors: {
      primary: "#EF4444",
      secondary: "#DC2626",
      accent: "#F87171",
      background: "#FEF2F2",
      text: "#1F2937",
    },
  },
  custom: {
    name: "Custom",
    colors: {
      primary: "#3B82F6",
      secondary: "#1E40AF",
      accent: "#60A5FA",
      background: "#FFFFFF",
      text: "#1F2937",
    },
  },
};

/**
 * Business type display names
 */
export const BUSINESS_TYPES: Record<BusinessType, string> = {
  technology: "Technology",
  healthcare: "Healthcare",
  finance: "Finance",
  education: "Education",
  ecommerce: "E-Commerce",
  restaurant: "Restaurant",
  fitness: "Fitness",
  "real-estate": "Real Estate",
  agency: "Agency",
  nonprofit: "Nonprofit",
  saas: "SaaS",
  other: "Other",
};

/**
 * Template descriptions for quick-starts
 */
export const PAGE_TEMPLATES: Record<PageTemplate, {
  name: string;
  description: string;
  suggestedSections: string[];
}> = {
  landing: {
    name: "Landing Page",
    description: "A conversion-focused page with hero, features, and CTA",
    suggestedSections: ["Hero", "Features", "Testimonials", "CTA"],
  },
  about: {
    name: "About Us",
    description: "Company story, mission, and team showcase",
    suggestedSections: ["Hero", "Story", "Mission", "Team", "Values"],
  },
  services: {
    name: "Services",
    description: "Showcase your services or offerings",
    suggestedSections: ["Hero", "Services Grid", "Process", "CTA"],
  },
  contact: {
    name: "Contact",
    description: "Contact form and information",
    suggestedSections: ["Hero", "Contact Form", "Map", "FAQ"],
  },
  pricing: {
    name: "Pricing",
    description: "Pricing plans and comparison",
    suggestedSections: ["Hero", "Pricing Cards", "Features Table", "FAQ", "CTA"],
  },
  blog: {
    name: "Blog",
    description: "Blog listing or featured articles",
    suggestedSections: ["Hero", "Featured Posts", "Categories", "Newsletter"],
  },
  portfolio: {
    name: "Portfolio",
    description: "Showcase work and projects",
    suggestedSections: ["Hero", "Projects Grid", "Services", "CTA"],
  },
  team: {
    name: "Team",
    description: "Team members and leadership",
    suggestedSections: ["Hero", "Leadership", "Team Grid", "Culture"],
  },
};
```

**Acceptance Criteria:**
- [ ] All types exported
- [ ] Color scheme presets defined
- [ ] Business type options complete
- [ ] Template suggestions defined

---

### Task 2: Create Page Generation Prompt Builder

**Description:** Build comprehensive prompts for full page generation.

**Files:**
- CREATE: `src/lib/studio/ai/page-prompts.ts`

**Code:**

```typescript
// src/lib/studio/ai/page-prompts.ts
/**
 * Page Generation Prompt Builders
 * 
 * Builds system prompts for full page generation with Claude.
 */

import type { ComponentDefinition } from "@/types/studio";
import type { 
  AIPageGenerationRequest, 
  BusinessType,
  ColorScheme,
  ContentTone,
  COLOR_SCHEMES,
} from "./types";

/**
 * Format available components for the prompt
 */
function formatComponentsForPrompt(
  components: ComponentDefinition[]
): string {
  // Group by category
  const byCategory: Record<string, ComponentDefinition[]> = {};
  
  for (const comp of components) {
    const category = comp.category || "Other";
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(comp);
  }
  
  const lines: string[] = [];
  
  for (const [category, comps] of Object.entries(byCategory)) {
    lines.push(`\n### ${category}`);
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
  availableComponents: ComponentDefinition[],
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
   "padding": { "mobile": { "top": "32px", ... }, "desktop": { "top": "64px", ... } }
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
        "padding": { "mobile": {...}, "desktop": {...} }
      },
      "children": ["container-1-id"],
      "parentId": "root"
    },
    "container-1-id": {
      "id": "container-1-id",
      "type": "Container",
      "props": { "maxWidth": "1200px" },
      "children": ["heading-1-id", "text-1-id"],
      "parentId": "section-1-id"
    },
    "heading-1-id": {
      "id": "heading-1-id",
      "type": "Heading",
      "props": {
        "text": "Your Compelling Headline",
        "level": "h1",
        "fontSize": { "mobile": "32px", "desktop": "56px" },
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
- Include parentId for all components (except root children which have parentId: "root")

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
4. Use proper responsive objects for all visual props
5. Ensure proper parent-child relationships
6. Generate at least 15-30 components for a complete page
7. Include all required props for each component type`;
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
```

**Acceptance Criteria:**
- [ ] Component formatting groups by category
- [ ] Color scheme instructions included
- [ ] Tone guidance provided
- [ ] Business context added
- [ ] Clear JSON structure specified
- [ ] Responsive value examples provided
- [ ] Content guidelines included

---

### Task 3: Create Page Generation API Route

**Description:** Server-side API for page generation.

**Files:**
- CREATE: `src/app/api/studio/ai/generate-page/route.ts`

**Code:**

```typescript
// src/app/api/studio/ai/generate-page/route.ts
/**
 * AI Page Generation API Route
 * 
 * Generates complete page structures from natural language descriptions.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { buildPageGenerationPrompt, buildUserPrompt } from "@/lib/studio/ai/page-prompts";
import { getCoreComponents } from "@/lib/studio/registry/core-components";
import type { AIPageGenerationRequest, AIPageGenerationResponse } from "@/lib/studio/ai/types";
import type { StudioPageData, StudioComponent } from "@/types/studio";

// Initialize Anthropic
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * Validate and sanitize generated page data
 */
function validatePageData(data: unknown): StudioPageData {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid page data: not an object");
  }
  
  const pageData = data as Record<string, unknown>;
  
  // Check version
  if (pageData.version !== "1.0") {
    (pageData as { version: string }).version = "1.0";
  }
  
  // Check root
  if (!pageData.root || typeof pageData.root !== "object") {
    throw new Error("Invalid page data: missing root");
  }
  
  const root = pageData.root as Record<string, unknown>;
  if (!root.id) root.id = "root";
  if (!root.type) root.type = "Root";
  if (!root.props) root.props = {};
  if (!Array.isArray(root.children)) root.children = [];
  
  // Check components
  if (!pageData.components || typeof pageData.components !== "object") {
    throw new Error("Invalid page data: missing components");
  }
  
  const components = pageData.components as Record<string, unknown>;
  const validComponents: Record<string, StudioComponent> = {};
  const usedIds = new Set<string>();
  
  // Validate each component
  for (const [id, comp] of Object.entries(components)) {
    if (!comp || typeof comp !== "object") continue;
    
    const component = comp as Record<string, unknown>;
    
    // Ensure required fields
    const validId = typeof component.id === "string" ? component.id : id;
    
    // Skip duplicates
    if (usedIds.has(validId)) continue;
    usedIds.add(validId);
    
    validComponents[validId] = {
      id: validId,
      type: typeof component.type === "string" ? component.type : "Section",
      props: typeof component.props === "object" && component.props ? component.props as Record<string, unknown> : {},
      children: Array.isArray(component.children) ? component.children.filter((c): c is string => typeof c === "string") : undefined,
      parentId: typeof component.parentId === "string" ? component.parentId : undefined,
    };
  }
  
  // Ensure all referenced children exist
  const allIds = new Set(Object.keys(validComponents));
  const validRootChildren = (root.children as string[]).filter(id => allIds.has(id));
  
  for (const comp of Object.values(validComponents)) {
    if (comp.children) {
      comp.children = comp.children.filter(id => allIds.has(id));
    }
  }
  
  return {
    version: "1.0",
    root: {
      id: "root",
      type: "Root",
      props: root.props as Record<string, unknown>,
      children: validRootChildren,
    },
    components: validComponents,
  };
}

/**
 * Count components and sections for response
 */
function analyzePageData(data: StudioPageData): {
  componentCount: number;
  sections: Array<{ name: string; componentCount: number }>;
} {
  const components = Object.values(data.components);
  const sections = components
    .filter(c => c.type === "Section")
    .map(section => {
      // Count children recursively
      const countChildren = (id: string): number => {
        const comp = data.components[id];
        if (!comp) return 0;
        const childCount = comp.children?.length || 0;
        const grandchildCount = comp.children?.reduce(
          (sum, childId) => sum + countChildren(childId),
          0
        ) || 0;
        return 1 + childCount + grandchildCount;
      };
      
      const name = section.props.title as string || 
                   section.props.label as string ||
                   section.id.replace(/-/g, " ").replace(/section/i, "").trim() ||
                   "Section";
      
      return {
        name: name.charAt(0).toUpperCase() + name.slice(1),
        componentCount: countChildren(section.id),
      };
    });
  
  return {
    componentCount: components.length,
    sections,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AIPageGenerationRequest;
    const { prompt, siteId } = body;
    
    if (!prompt || prompt.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a more detailed description (at least 10 characters)" },
        { status: 400 }
      );
    }
    
    // Get available components
    // In future: also load module components based on siteId
    const coreComponents = getCoreComponents();
    const availableComponents = Object.values(coreComponents);
    
    // Build prompts
    const systemPrompt = buildPageGenerationPrompt(availableComponents, body);
    const userPrompt = buildUserPrompt(body);
    
    // Call Claude
    const result = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 8192,
      temperature: 0.7,
    });
    
    // Parse response
    let pageData: StudioPageData;
    try {
      // Clean response
      let responseText = result.text.trim();
      
      // Remove markdown if present
      if (responseText.startsWith("```")) {
        responseText = responseText
          .replace(/^```(?:json)?\n?/, "")
          .replace(/\n?```$/, "");
      }
      
      const parsed = JSON.parse(responseText);
      pageData = validatePageData(parsed);
      
    } catch (parseError) {
      console.error("Failed to parse page generation response:", result.text.substring(0, 1000));
      return NextResponse.json(
        { 
          error: "Failed to generate valid page structure",
          details: parseError instanceof Error ? parseError.message : "Parse error",
        },
        { status: 500 }
      );
    }
    
    // Analyze for response
    const analysis = analyzePageData(pageData);
    
    const response: AIPageGenerationResponse = {
      data: pageData,
      explanation: `Generated a ${analysis.sections.length}-section page with ${analysis.componentCount} components.`,
      componentCount: analysis.componentCount,
      sections: analysis.sections,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Page generation error:", error);
    
    if (error instanceof Error && error.message.includes("rate")) {
      return NextResponse.json(
        { error: "AI service rate limited. Please try again shortly." },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to generate page" },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria:**
- [ ] API route created
- [ ] Validates input prompt
- [ ] Calls Claude with proper prompts
- [ ] Validates and sanitizes response
- [ ] Returns structured response with analysis
- [ ] Handles errors gracefully

---

### Task 4: Create Page Generator UI Component

**Description:** Multi-step wizard for page generation.

**Files:**
- CREATE: `src/components/studio/ai/ai-page-generator.tsx`
- CREATE: `src/components/studio/ai/page-preview.tsx`

**Code:**

```typescript
// src/components/studio/ai/page-preview.tsx
/**
 * Page Preview Component
 * 
 * Previews generated page structure before applying.
 */

"use client";

import { cn } from "@/lib/utils";
import type { StudioPageData } from "@/types/studio";
import { 
  Layers, 
  LayoutTemplate, 
  Type, 
  Image, 
  MousePointer,
  ChevronRight,
} from "lucide-react";

interface PagePreviewProps {
  data: StudioPageData;
  sections: Array<{ name: string; componentCount: number }>;
}

const COMPONENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Section: LayoutTemplate,
  Container: Layers,
  Heading: Type,
  Text: Type,
  Image: Image,
  Button: MousePointer,
};

export function PagePreview({ data, sections }: PagePreviewProps) {
  return (
    <div className="space-y-4">
      {/* Section list */}
      <div className="space-y-2">
        {sections.map((section, index) => {
          const sectionId = data.root.children[index];
          const sectionData = sectionId ? data.components[sectionId] : null;
          
          return (
            <div
              key={section.name + index}
              className={cn(
                "p-3 rounded-lg border bg-card",
                "hover:border-primary/50 transition-colors"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{section.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {section.componentCount} components
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              
              {/* Section preview - show first-level children */}
              {sectionData?.children && sectionData.children.length > 0 && (
                <div className="mt-2 pt-2 border-t flex flex-wrap gap-1">
                  {sectionData.children.slice(0, 5).map(childId => {
                    const child = data.components[childId];
                    if (!child) return null;
                    
                    const Icon = COMPONENT_ICONS[child.type] || Layers;
                    
                    return (
                      <span
                        key={childId}
                        className="text-xs px-2 py-0.5 bg-muted rounded flex items-center gap-1"
                      >
                        <Icon className="w-3 h-3" />
                        {child.type}
                      </span>
                    );
                  })}
                  {sectionData.children.length > 5 && (
                    <span className="text-xs text-muted-foreground">
                      +{sectionData.children.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Stats */}
      <div className="flex items-center justify-center gap-6 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {sections.length}
          </div>
          <div className="text-xs text-muted-foreground">Sections</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {Object.keys(data.components).length}
          </div>
          <div className="text-xs text-muted-foreground">Components</div>
        </div>
      </div>
    </div>
  );
}
```

```typescript
// src/components/studio/ai/ai-page-generator.tsx
/**
 * AI Page Generator Wizard
 * 
 * Multi-step wizard for generating complete pages from prompts.
 */

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Loader2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Check,
  Palette,
  Building2,
  FileText,
} from "lucide-react";
import { useEditorStore } from "@/lib/studio/store/editor-store";
import { PagePreview } from "./page-preview";
import type { 
  AIPageGenerationRequest, 
  AIPageGenerationResponse,
  BusinessType,
  ColorScheme,
  ContentTone,
  PageTemplate,
  BUSINESS_TYPES,
  COLOR_SCHEMES,
  PAGE_TEMPLATES,
} from "@/lib/studio/ai/types";
import type { StudioPageData } from "@/types/studio";

interface AIPageGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep = "prompt" | "options" | "generating" | "preview";

// Import constants from types (these are defined in types.ts)
const BUSINESS_TYPE_OPTIONS: Array<{ value: BusinessType; label: string }> = [
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "education", label: "Education" },
  { value: "ecommerce", label: "E-Commerce" },
  { value: "restaurant", label: "Restaurant" },
  { value: "fitness", label: "Fitness" },
  { value: "real-estate", label: "Real Estate" },
  { value: "agency", label: "Agency" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "saas", label: "SaaS" },
  { value: "other", label: "Other" },
];

const COLOR_SCHEME_OPTIONS: Array<{ value: ColorScheme; label: string; colors: string[] }> = [
  { value: "modern-blue", label: "Modern Blue", colors: ["#3B82F6", "#1E40AF", "#60A5FA"] },
  { value: "vibrant-purple", label: "Vibrant Purple", colors: ["#8B5CF6", "#6D28D9", "#A78BFA"] },
  { value: "professional-gray", label: "Professional Gray", colors: ["#4B5563", "#1F2937", "#6B7280"] },
  { value: "nature-green", label: "Nature Green", colors: ["#10B981", "#047857", "#34D399"] },
  { value: "warm-orange", label: "Warm Orange", colors: ["#F97316", "#EA580C", "#FB923C"] },
  { value: "elegant-dark", label: "Elegant Dark", colors: ["#111827", "#1F2937", "#374151"] },
  { value: "minimal-light", label: "Minimal Light", colors: ["#18181B", "#FFFFFF", "#F4F4F5"] },
  { value: "bold-red", label: "Bold Red", colors: ["#EF4444", "#DC2626", "#F87171"] },
];

const TONE_OPTIONS: Array<{ value: ContentTone; label: string }> = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "playful", label: "Playful" },
  { value: "formal", label: "Formal" },
  { value: "inspirational", label: "Inspirational" },
];

const TEMPLATE_OPTIONS: Array<{ value: PageTemplate; label: string; description: string }> = [
  { value: "landing", label: "Landing Page", description: "Hero, features, CTA" },
  { value: "about", label: "About Us", description: "Story, mission, team" },
  { value: "services", label: "Services", description: "Offerings showcase" },
  { value: "contact", label: "Contact", description: "Form and info" },
  { value: "pricing", label: "Pricing", description: "Plans comparison" },
  { value: "portfolio", label: "Portfolio", description: "Work showcase" },
];

export function AIPageGenerator({ isOpen, onClose }: AIPageGeneratorProps) {
  const [step, setStep] = useState<WizardStep>("prompt");
  const [prompt, setPrompt] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType | undefined>();
  const [colorScheme, setColorScheme] = useState<ColorScheme>("modern-blue");
  const [tone, setTone] = useState<ContentTone>("professional");
  const [template, setTemplate] = useState<PageTemplate | undefined>();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIPageGenerationResponse | null>(null);
  
  const { setData, siteId } = useEditorStore();
  
  // Reset wizard
  const resetWizard = () => {
    setStep("prompt");
    setPrompt("");
    setBusinessType(undefined);
    setColorScheme("modern-blue");
    setTone("professional");
    setTemplate(undefined);
    setResult(null);
    setError(null);
  };
  
  // Handle close
  const handleClose = () => {
    resetWizard();
    onClose();
  };
  
  // Apply template prompt
  const applyTemplate = (t: PageTemplate) => {
    setTemplate(t);
    const templateInfo = TEMPLATE_OPTIONS.find(opt => opt.value === t);
    if (templateInfo) {
      setPrompt(prev => 
        prev ? prev : `Create a ${templateInfo.label.toLowerCase()} page with ${templateInfo.description.toLowerCase()}.`
      );
    }
  };
  
  // Generate page
  const generatePage = async () => {
    if (!prompt.trim()) return;
    
    setStep("generating");
    setIsLoading(true);
    setError(null);
    
    try {
      const request: AIPageGenerationRequest = {
        prompt: prompt.trim(),
        businessType,
        colorScheme,
        tone,
        template,
        siteId: siteId || undefined,
      };
      
      const response = await fetch("/api/studio/ai/generate-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate page");
      }
      
      setResult(data as AIPageGenerationResponse);
      setStep("preview");
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("options"); // Go back to options on error
    } finally {
      setIsLoading(false);
    }
  };
  
  // Apply generated page
  const applyPage = () => {
    if (!result?.data) return;
    
    setData(result.data);
    handleClose();
  };
  
  // Regenerate with same settings
  const regenerate = () => {
    setResult(null);
    generatePage();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Page Generator
          </DialogTitle>
          <DialogDescription>
            {step === "prompt" && "Describe the page you want to create"}
            {step === "options" && "Customize your page options"}
            {step === "generating" && "Generating your page..."}
            {step === "preview" && "Review your generated page"}
          </DialogDescription>
        </DialogHeader>
        
        {/* Step 1: Prompt */}
        {step === "prompt" && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">What kind of page would you like?</Label>
              <Textarea
                id="prompt"
                placeholder="Create a modern landing page for a fitness app. Include a bold hero section with a call-to-action, features section showing 3 key benefits, testimonials from users, and a final CTA section..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Be as detailed as you like. Include specific sections, content ideas, or style preferences.
              </p>
            </div>
            
            {/* Quick templates */}
            <div className="space-y-2">
              <Label className="text-sm">Quick Templates</Label>
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_OPTIONS.map((t) => (
                  <Button
                    key={t.value}
                    variant={template === t.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyTemplate(t.value)}
                    className="gap-2"
                  >
                    <FileText className="w-3 h-3" />
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep("options")}
                disabled={!prompt.trim()}
                className="gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Step 2: Options */}
        {step === "options" && (
          <div className="space-y-6 py-4">
            {/* Business Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Business Type
              </Label>
              <Select
                value={businessType}
                onValueChange={(v) => setBusinessType(v as BusinessType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Color Scheme */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Color Scheme
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COLOR_SCHEME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setColorScheme(opt.value)}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all",
                      colorScheme === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex gap-1 mb-2">
                      {opt.colors.map((color, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-medium text-left">{opt.label}</p>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Tone */}
            <div className="space-y-2">
              <Label>Content Tone</Label>
              <div className="flex flex-wrap gap-2">
                {TONE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={tone === opt.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTone(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            
            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep("prompt")} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button onClick={generatePage} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Page
              </Button>
            </div>
          </div>
        )}
        
        {/* Step 3: Generating */}
        {step === "generating" && (
          <div className="py-12 text-center space-y-4">
            <div className="relative mx-auto w-16 h-16">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Generating Your Page</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This may take 10-20 seconds...
              </p>
            </div>
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Step 4: Preview */}
        {step === "preview" && result && (
          <div className="space-y-6 py-4">
            <PagePreview
              data={result.data}
              sections={result.sections}
            />
            
            <div className="p-3 rounded-lg bg-muted text-sm">
              <p className="font-medium mb-1">✨ {result.explanation}</p>
              <p className="text-muted-foreground">
                Review the structure above. Click "Apply" to add this to your canvas,
                or "Regenerate" to try again.
              </p>
            </div>
            
            <div className="flex justify-between gap-2 pt-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={regenerate} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Regenerate
                </Button>
              </div>
              <Button onClick={applyPage} className="gap-2">
                <Check className="w-4 h-4" />
                Apply to Canvas
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

**Update index.ts:**

```typescript
// Add to src/components/studio/ai/index.ts
export { AIPageGenerator } from "./ai-page-generator";
export { PagePreview } from "./page-preview";
```

**Acceptance Criteria:**
- [ ] Multi-step wizard works correctly
- [ ] Prompt step has templates and textarea
- [ ] Options step has all configuration
- [ ] Loading state shows during generation
- [ ] Preview shows section breakdown
- [ ] Apply button updates canvas
- [ ] Regenerate button works
- [ ] Error handling shows messages

---

### Task 5: Integrate into Toolbar

**Description:** Add "Generate Page" button to studio toolbar.

**Files:**
- MODIFY: `src/components/studio/layout/studio-toolbar.tsx` (or wherever toolbar is)

**Code to add:**

```typescript
// In toolbar component
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIPageGenerator } from "@/components/studio/ai";

// Inside component:
const [showGenerator, setShowGenerator] = useState(false);

// In render:
<Button
  variant="outline"
  size="sm"
  onClick={() => setShowGenerator(true)}
  className="gap-2"
>
  <Sparkles className="h-4 w-4" />
  Generate Page
</Button>

<AIPageGenerator
  isOpen={showGenerator}
  onClose={() => setShowGenerator(false)}
/>
```

**Acceptance Criteria:**
- [ ] Button visible in toolbar
- [ ] Clicking opens generator wizard
- [ ] Closing wizard resets state

---

### Task 6: Add Empty Canvas Prompt

**Description:** Show AI generator option when canvas is empty.

**Files:**
- MODIFY: `src/components/studio/canvas/editor-canvas.tsx`

**Code to add when canvas is empty:**

```typescript
// In canvas component, when no components exist
const hasComponents = data.root.children.length > 0;

{!hasComponents && (
  <div className="absolute inset-0 flex items-center justify-center bg-background/50">
    <div className="text-center space-y-4 p-8 max-w-md">
      <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold">Start Building</h2>
      <p className="text-muted-foreground">
        Drag components from the left panel, or let AI generate a page for you.
      </p>
      <div className="flex gap-2 justify-center">
        <Button variant="outline" onClick={() => {/* focus left panel */}}>
          Browse Components
        </Button>
        <Button onClick={() => setShowGenerator(true)} className="gap-2">
          <Sparkles className="w-4 h-4" />
          Generate with AI
        </Button>
      </div>
    </div>
  </div>
)}
```

**Acceptance Criteria:**
- [ ] Empty state shows when no components
- [ ] AI generator button prominent
- [ ] Can also browse components manually

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| MODIFY | src/lib/studio/ai/types.ts | Add page generation types |
| CREATE | src/lib/studio/ai/page-prompts.ts | Page generation prompts |
| CREATE | src/app/api/studio/ai/generate-page/route.ts | Page generation API |
| CREATE | src/components/studio/ai/page-preview.tsx | Page preview component |
| CREATE | src/components/studio/ai/ai-page-generator.tsx | Generator wizard |
| MODIFY | src/components/studio/ai/index.ts | Export new components |
| MODIFY | src/components/studio/layout/studio-toolbar.tsx | Add generator button |
| MODIFY | src/components/studio/canvas/editor-canvas.tsx | Empty state prompt |

## Testing Requirements

### Unit Tests
- [ ] Page generation prompt includes all components
- [ ] Validation handles malformed JSON
- [ ] Color scheme colors are valid

### Integration Tests
- [ ] API returns valid StudioPageData
- [ ] Generated components have proper hierarchy
- [ ] Responsive values are included

### Manual Testing
- [ ] Generate landing page with "fitness app" prompt
- [ ] Generate about page with "tech company" prompt
- [ ] Verify all sections render correctly
- [ ] Test with different color schemes
- [ ] Test regeneration
- [ ] Test applying to empty canvas
- [ ] Test replacing existing content (with confirmation)
- [ ] Test error states (disconnect network)
- [ ] Verify undo works after applying generated page

## Dependencies to Install

No new dependencies required.

## Environment Variables

Already configured:
```env
ANTHROPIC_API_KEY=sk-ant-...  # Already exists
```

## Database Changes

None required.

## Rollback Plan

1. Remove page generation API route
2. Remove generator wizard components
3. Remove toolbar button
4. Remove empty canvas prompt

## Success Criteria

- [ ] "Generate Page" button in toolbar
- [ ] Wizard opens with prompt step
- [ ] Templates provide starting prompts
- [ ] Business type and color options work
- [ ] Loading animation shows during generation
- [ ] Preview shows all sections clearly
- [ ] Apply button replaces canvas content
- [ ] Regenerate creates new page
- [ ] Generated page has 4-8 sections
- [ ] All components render without errors
- [ ] Responsive values included
- [ ] Proper component hierarchy (Section → Container → Content)
- [ ] Content is meaningful, not placeholder
- [ ] Empty canvas shows AI prompt option
- [ ] Generation takes 10-20 seconds (reasonable)
- [ ] Errors handled gracefully

---

## Example Generated Page Structure

For prompt: "Create a landing page for a fitness app"

```json
{
  "version": "1.0",
  "root": {
    "id": "root",
    "type": "Root",
    "props": {
      "title": "FitPro - Your Fitness Journey Starts Here"
    },
    "children": ["hero-section", "features-section", "testimonials-section", "cta-section"]
  },
  "components": {
    "hero-section": {
      "id": "hero-section",
      "type": "Section",
      "props": {
        "backgroundColor": "#1E40AF",
        "padding": {
          "mobile": { "top": "64px", "right": "16px", "bottom": "64px", "left": "16px" },
          "desktop": { "top": "96px", "right": "24px", "bottom": "96px", "left": "24px" }
        }
      },
      "children": ["hero-container"],
      "parentId": "root"
    },
    "hero-container": {
      "id": "hero-container",
      "type": "Container",
      "props": { "maxWidth": "1200px" },
      "children": ["hero-heading", "hero-subheading", "hero-cta"],
      "parentId": "hero-section"
    },
    "hero-heading": {
      "id": "hero-heading",
      "type": "Heading",
      "props": {
        "text": "🏋️ Transform Your Body in 30 Days",
        "level": "h1",
        "fontSize": { "mobile": "36px", "tablet": "48px", "desktop": "64px" },
        "color": "#FFFFFF",
        "textAlign": { "mobile": "center" }
      },
      "parentId": "hero-container"
    }
    // ... more components
  }
}
```
