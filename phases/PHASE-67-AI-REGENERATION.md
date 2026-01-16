# Phase 67: AI Regeneration - Section-by-Section Content Refresh

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟡 HIGH
>
> **Estimated Time**: 3-4 hours

---

## 🎯 Objective

Implement section-by-section AI regeneration that allows users to regenerate individual sections of a page without affecting the rest of the content. Provides fine-grained control over AI-generated content.

---

## 📋 Prerequisites

- [ ] Phase 66 Mobile Editor completed
- [ ] AI Builder foundation working
- [ ] Craft.js editor integration stable
- [ ] Anthropic Claude API configured

---

## 💼 Business Value

1. **Fine Control** - Regenerate only what needs changing
2. **Time Savings** - Don't rebuild entire pages
3. **Content Quality** - Iterate on specific sections
4. **User Satisfaction** - More control = happier users
5. **Cost Efficiency** - Smaller AI requests = lower costs

---

## 📁 Files to Create

```
src/lib/ai/
├── regenerate-section.ts        # Core regeneration logic
├── section-analyzer.ts          # Analyze section for context
├── prompt-builder.ts            # Build regeneration prompts
└── regeneration-types.ts        # Type definitions

src/actions/ai/
├── regenerate-section.ts        # Server action

src/components/editor/ai/
├── regenerate-button.tsx        # Section regenerate button
├── regenerate-dialog.tsx        # Regeneration options dialog
├── regenerate-preview.tsx       # Preview before applying
└── section-ai-toolbar.tsx       # AI toolbar for sections

src/hooks/
├── use-section-regeneration.ts  # Regeneration hook
```

---

## ✅ Tasks

### Task 67.1: Regeneration Types

**File: `src/lib/ai/regeneration-types.ts`**

```typescript
export type RegenerationMode = 
  | "rewrite"       // Complete rewrite with same structure
  | "improve"       // Improve existing content
  | "expand"        // Add more content
  | "simplify"      // Make content simpler
  | "professional"  // Make more professional
  | "casual"        // Make more casual
  | "seo"           // Optimize for SEO
  | "custom";       // Custom instructions

export interface RegenerationOptions {
  mode: RegenerationMode;
  customInstructions?: string;
  preserveStructure?: boolean;
  preserveImages?: boolean;
  targetLength?: "shorter" | "same" | "longer";
  tone?: "formal" | "neutral" | "casual" | "friendly";
  keywords?: string[];
}

export interface SectionContext {
  sectionId: string;
  sectionType: string;
  currentContent: SectionContent;
  surroundingContext: {
    previousSection?: SectionSummary;
    nextSection?: SectionSummary;
  };
  pageContext: PageContext;
  siteContext: SiteContext;
}

export interface SectionContent {
  type: string;
  props: Record<string, any>;
  children: SectionContent[];
  textContent: string;
  images: ImageReference[];
}

export interface SectionSummary {
  type: string;
  mainHeading?: string;
  summary: string;
}

export interface PageContext {
  pageName: string;
  pageSlug: string;
  pageType: string;
  otherSections: SectionSummary[];
}

export interface SiteContext {
  siteName: string;
  industry: string;
  description: string;
  targetAudience: string;
  brandVoice: string;
}

export interface ImageReference {
  src: string;
  alt: string;
  placeholder?: string;
}

export interface RegenerationResult {
  success: boolean;
  newContent?: SectionContent;
  originalContent?: SectionContent;
  changes: ContentChange[];
  tokensUsed: number;
  error?: string;
}

export interface ContentChange {
  type: "text" | "image" | "structure" | "style";
  path: string;
  oldValue: any;
  newValue: any;
}
```

---

### Task 67.2: Section Analyzer

**File: `src/lib/ai/section-analyzer.ts`**

```typescript
import type { 
  SectionContext, 
  SectionContent, 
  SectionSummary,
  PageContext,
  ImageReference,
} from "./regeneration-types";

// Extract text content from a node recursively
export function extractTextContent(node: any): string {
  if (!node) return "";
  
  let text = "";
  
  // Handle text in props
  if (node.props) {
    if (typeof node.props.text === "string") {
      text += node.props.text + " ";
    }
    if (typeof node.props.title === "string") {
      text += node.props.title + " ";
    }
    if (typeof node.props.description === "string") {
      text += node.props.description + " ";
    }
    if (typeof node.props.content === "string") {
      text += node.props.content + " ";
    }
    if (typeof node.props.buttonText === "string") {
      text += node.props.buttonText + " ";
    }
  }
  
  // Handle children
  if (node.nodes && Array.isArray(node.nodes)) {
    for (const childId of node.nodes) {
      // Children would be resolved from the full tree
    }
  }
  
  return text.trim();
}

// Extract image references from a node
export function extractImages(node: any): ImageReference[] {
  const images: ImageReference[] = [];
  
  if (!node) return images;
  
  // Check props for image sources
  if (node.props) {
    if (node.props.src) {
      images.push({
        src: node.props.src,
        alt: node.props.alt || "",
      });
    }
    if (node.props.image) {
      images.push({
        src: node.props.image,
        alt: node.props.imageAlt || "",
      });
    }
    if (node.props.backgroundImage) {
      images.push({
        src: node.props.backgroundImage,
        alt: "Background image",
      });
    }
  }
  
  return images;
}

// Analyze a section and extract context
export function analyzeSection(
  sectionId: string,
  sectionNode: any,
  fullTree: Record<string, any>
): SectionContent {
  const type = sectionNode.type?.resolvedName || sectionNode.displayName || "Unknown";
  
  // Extract all text content
  let textContent = extractTextContent(sectionNode);
  
  // Extract all images
  let images = extractImages(sectionNode);
  
  // Process child nodes
  const children: SectionContent[] = [];
  if (sectionNode.nodes && Array.isArray(sectionNode.nodes)) {
    for (const childId of sectionNode.nodes) {
      const childNode = fullTree[childId];
      if (childNode) {
        const childContent = analyzeSection(childId, childNode, fullTree);
        children.push(childContent);
        textContent += " " + childContent.textContent;
        images = [...images, ...childContent.images];
      }
    }
  }
  
  return {
    type,
    props: sectionNode.props || {},
    children,
    textContent: textContent.trim(),
    images,
  };
}

// Get summary of a section for context
export function getSectionSummary(content: SectionContent): SectionSummary {
  // Find main heading
  const mainHeading = content.props.title || 
    content.props.heading || 
    content.textContent.split(/[.!?]/)[0].slice(0, 50);
  
  // Create summary
  const summary = content.textContent.slice(0, 200) + 
    (content.textContent.length > 200 ? "..." : "");
  
  return {
    type: content.type,
    mainHeading,
    summary,
  };
}

// Build full section context
export function buildSectionContext(
  sectionId: string,
  fullTree: Record<string, any>,
  pageInfo: { name: string; slug: string; type: string },
  siteInfo: { name: string; industry: string; description: string }
): SectionContext {
  const sectionNode = fullTree[sectionId];
  if (!sectionNode) {
    throw new Error(`Section not found: ${sectionId}`);
  }
  
  // Analyze the target section
  const currentContent = analyzeSection(sectionId, sectionNode, fullTree);
  
  // Find surrounding sections
  const rootNode = fullTree["ROOT"];
  const sectionIndex = rootNode?.nodes?.indexOf(sectionId) ?? -1;
  
  let previousSection: SectionSummary | undefined;
  let nextSection: SectionSummary | undefined;
  
  if (sectionIndex > 0 && rootNode?.nodes) {
    const prevId = rootNode.nodes[sectionIndex - 1];
    const prevNode = fullTree[prevId];
    if (prevNode) {
      const prevContent = analyzeSection(prevId, prevNode, fullTree);
      previousSection = getSectionSummary(prevContent);
    }
  }
  
  if (rootNode?.nodes && sectionIndex < rootNode.nodes.length - 1) {
    const nextId = rootNode.nodes[sectionIndex + 1];
    const nextNode = fullTree[nextId];
    if (nextNode) {
      const nextContent = analyzeSection(nextId, nextNode, fullTree);
      nextSection = getSectionSummary(nextContent);
    }
  }
  
  // Build other sections summary
  const otherSections: SectionSummary[] = [];
  if (rootNode?.nodes) {
    for (const nodeId of rootNode.nodes) {
      if (nodeId !== sectionId) {
        const node = fullTree[nodeId];
        if (node) {
          const content = analyzeSection(nodeId, node, fullTree);
          otherSections.push(getSectionSummary(content));
        }
      }
    }
  }
  
  return {
    sectionId,
    sectionType: currentContent.type,
    currentContent,
    surroundingContext: {
      previousSection,
      nextSection,
    },
    pageContext: {
      pageName: pageInfo.name,
      pageSlug: pageInfo.slug,
      pageType: pageInfo.type,
      otherSections,
    },
    siteContext: {
      siteName: siteInfo.name,
      industry: siteInfo.industry,
      description: siteInfo.description,
      targetAudience: "",
      brandVoice: "",
    },
  };
}
```

---

### Task 67.3: Prompt Builder

**File: `src/lib/ai/prompt-builder.ts`**

```typescript
import type { 
  RegenerationOptions, 
  SectionContext,
  RegenerationMode,
} from "./regeneration-types";

const MODE_INSTRUCTIONS: Record<RegenerationMode, string> = {
  rewrite: "Completely rewrite the content while maintaining the same structure and purpose. Use fresh language and new phrasing.",
  improve: "Improve the existing content by making it clearer, more engaging, and more effective. Fix any issues and enhance quality.",
  expand: "Expand the content with more details, examples, and supporting information while maintaining the core message.",
  simplify: "Simplify the content by using clearer language, shorter sentences, and removing unnecessary complexity.",
  professional: "Rewrite in a more professional, formal tone suitable for business contexts.",
  casual: "Rewrite in a more casual, conversational tone that feels friendly and approachable.",
  seo: "Optimize the content for search engines by naturally incorporating relevant keywords and improving structure for SEO.",
  custom: "Follow the custom instructions provided by the user.",
};

const TONE_DESCRIPTIONS: Record<string, string> = {
  formal: "Use formal, professional language appropriate for business communication.",
  neutral: "Use clear, balanced language that's neither too formal nor too casual.",
  casual: "Use relaxed, conversational language that feels friendly.",
  friendly: "Use warm, approachable language that creates a personal connection.",
};

export function buildRegenerationPrompt(
  context: SectionContext,
  options: RegenerationOptions
): string {
  const parts: string[] = [];
  
  // System context
  parts.push(`You are an expert copywriter helping regenerate content for a website section.

WEBSITE CONTEXT:
- Site: ${context.siteContext.siteName}
- Industry: ${context.siteContext.industry}
- Description: ${context.siteContext.description}

PAGE CONTEXT:
- Page: ${context.pageContext.pageName} (${context.pageContext.pageSlug})
- This is a ${context.pageContext.pageType || "general"} page`);

  // Surrounding context
  if (context.surroundingContext.previousSection) {
    parts.push(`
PREVIOUS SECTION (for flow):
- Type: ${context.surroundingContext.previousSection.type}
- Content: ${context.surroundingContext.previousSection.summary}`);
  }
  
  if (context.surroundingContext.nextSection) {
    parts.push(`
NEXT SECTION (for flow):
- Type: ${context.surroundingContext.nextSection.type}
- Content: ${context.surroundingContext.nextSection.summary}`);
  }

  // Current section
  parts.push(`
SECTION TO REGENERATE:
- Type: ${context.sectionType}
- Current content: ${context.currentContent.textContent}`);

  // Current structure (if preserving)
  if (options.preserveStructure) {
    parts.push(`
STRUCTURE TO PRESERVE:
${JSON.stringify(context.currentContent.props, null, 2)}`);
  }

  // Instructions
  parts.push(`
TASK: ${MODE_INSTRUCTIONS[options.mode]}`);

  if (options.customInstructions) {
    parts.push(`
CUSTOM INSTRUCTIONS: ${options.customInstructions}`);
  }

  if (options.tone) {
    parts.push(`
TONE: ${TONE_DESCRIPTIONS[options.tone]}`);
  }

  if (options.keywords && options.keywords.length > 0) {
    parts.push(`
KEYWORDS TO INCLUDE: ${options.keywords.join(", ")}`);
  }

  if (options.targetLength) {
    const lengthInstructions = {
      shorter: "Make the content more concise, about 30% shorter.",
      same: "Keep approximately the same length.",
      longer: "Expand the content, about 30-50% longer.",
    };
    parts.push(`
LENGTH: ${lengthInstructions[options.targetLength]}`);
  }

  // Output format
  parts.push(`
OUTPUT FORMAT:
Return the regenerated content as a JSON object matching this structure:
{
  "title": "New title if applicable",
  "subtitle": "New subtitle if applicable", 
  "description": "New description/body text",
  "buttonText": "New button text if applicable",
  "items": [
    {
      "title": "Item title",
      "description": "Item description"
    }
  ]
}

Only include fields that exist in the original section. Do not add new fields.
If preserving images, keep the same image references.
Ensure the content flows naturally with surrounding sections.`);

  return parts.join("\n");
}

// Build a simpler prompt for quick regeneration
export function buildQuickRegeneratePrompt(
  currentText: string,
  mode: RegenerationMode,
  context?: { siteName?: string; industry?: string }
): string {
  return `${MODE_INSTRUCTIONS[mode]}

${context?.siteName ? `Website: ${context.siteName}` : ""}
${context?.industry ? `Industry: ${context.industry}` : ""}

Original text:
"${currentText}"

Regenerated text:`;
}
```

---

### Task 67.4: Core Regeneration Logic

**File: `src/lib/ai/regenerate-section.ts`**

```typescript
import Anthropic from "@anthropic-ai/sdk";
import type { 
  RegenerationOptions, 
  SectionContext, 
  RegenerationResult,
  SectionContent,
  ContentChange,
} from "./regeneration-types";
import { buildRegenerationPrompt } from "./prompt-builder";

const anthropic = new Anthropic();

interface ParsedResponse {
  [key: string]: any;
}

// Parse AI response to extract JSON
function parseAIResponse(response: string): ParsedResponse | null {
  try {
    // Try direct JSON parse
    return JSON.parse(response);
  } catch {
    // Try to extract JSON from markdown code block
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        return null;
      }
    }
    
    // Try to find JSON object in response
    const objectMatch = response.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        return null;
      }
    }
    
    return null;
  }
}

// Detect changes between old and new content
function detectChanges(
  oldContent: SectionContent,
  newProps: ParsedResponse
): ContentChange[] {
  const changes: ContentChange[] = [];
  
  for (const [key, newValue] of Object.entries(newProps)) {
    const oldValue = oldContent.props[key];
    
    if (oldValue !== newValue) {
      changes.push({
        type: key.includes("image") ? "image" : "text",
        path: key,
        oldValue,
        newValue,
      });
    }
  }
  
  return changes;
}

// Apply new props to section content
function applyChanges(
  originalContent: SectionContent,
  newProps: ParsedResponse
): SectionContent {
  return {
    ...originalContent,
    props: {
      ...originalContent.props,
      ...newProps,
    },
  };
}

export async function regenerateSection(
  context: SectionContext,
  options: RegenerationOptions
): Promise<RegenerationResult> {
  try {
    // Build the prompt
    const prompt = buildRegenerationPrompt(context, options);
    
    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    
    // Extract text response
    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return {
        success: false,
        error: "No text response from AI",
        changes: [],
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      };
    }
    
    // Parse the response
    const parsed = parseAIResponse(textBlock.text);
    if (!parsed) {
      return {
        success: false,
        error: "Failed to parse AI response",
        changes: [],
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      };
    }
    
    // Preserve images if requested
    if (options.preserveImages) {
      for (const image of context.currentContent.images) {
        if (context.currentContent.props.src) {
          parsed.src = context.currentContent.props.src;
        }
        if (context.currentContent.props.image) {
          parsed.image = context.currentContent.props.image;
        }
      }
    }
    
    // Detect changes
    const changes = detectChanges(context.currentContent, parsed);
    
    // Apply changes to create new content
    const newContent = applyChanges(context.currentContent, parsed);
    
    return {
      success: true,
      newContent,
      originalContent: context.currentContent,
      changes,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Regeneration failed",
      changes: [],
      tokensUsed: 0,
    };
  }
}

// Quick regenerate just the text content
export async function quickRegenerateText(
  text: string,
  mode: "rewrite" | "improve" | "simplify" | "professional" | "casual"
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `${mode === "rewrite" ? "Rewrite" : mode === "improve" ? "Improve" : mode === "simplify" ? "Simplify" : mode === "professional" ? "Make more professional" : "Make more casual"} the following text. Return ONLY the new text, no explanations:\n\n"${text}"`,
        },
      ],
    });
    
    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { success: false, error: "No response" };
    }
    
    // Clean up the response (remove quotes if present)
    let newText = textBlock.text.trim();
    if (newText.startsWith('"') && newText.endsWith('"')) {
      newText = newText.slice(1, -1);
    }
    
    return { success: true, text: newText };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}
```

---

### Task 67.5: Regenerate Section Server Action

**File: `src/actions/ai/regenerate-section.ts`**

```typescript
"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { regenerateSection, quickRegenerateText } from "@/lib/ai/regenerate-section";
import { buildSectionContext } from "@/lib/ai/section-analyzer";
import { logError } from "@/lib/errors";
import type { RegenerationMode, RegenerationResult } from "@/lib/ai/regeneration-types";

const regenerateSectionSchema = z.object({
  siteId: z.string().uuid(),
  pageId: z.string().uuid(),
  sectionId: z.string(),
  pageContent: z.string(), // Full page JSON
  mode: z.enum(["rewrite", "improve", "expand", "simplify", "professional", "casual", "seo", "custom"]),
  customInstructions: z.string().optional(),
  preserveStructure: z.boolean().default(true),
  preserveImages: z.boolean().default(true),
  targetLength: z.enum(["shorter", "same", "longer"]).optional(),
  tone: z.enum(["formal", "neutral", "casual", "friendly"]).optional(),
  keywords: z.array(z.string()).optional(),
});

export type RegenerateSectionInput = z.infer<typeof regenerateSectionSchema>;

export async function regenerateSectionAction(
  input: RegenerateSectionInput
): Promise<RegenerationResult> {
  try {
    const validated = regenerateSectionSchema.parse(input);
    
    // Get user and verify access
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Authentication required", changes: [], tokensUsed: 0 };
    }
    
    // Get site info
    const { data: site } = await supabase
      .from("sites")
      .select("name, settings")
      .eq("id", validated.siteId)
      .single();
    
    if (!site) {
      return { success: false, error: "Site not found", changes: [], tokensUsed: 0 };
    }
    
    // Get page info
    const { data: page } = await supabase
      .from("pages")
      .select("name, slug")
      .eq("id", validated.pageId)
      .single();
    
    if (!page) {
      return { success: false, error: "Page not found", changes: [], tokensUsed: 0 };
    }
    
    // Parse page content
    let pageTree: Record<string, any>;
    try {
      pageTree = JSON.parse(validated.pageContent);
    } catch {
      return { success: false, error: "Invalid page content", changes: [], tokensUsed: 0 };
    }
    
    // Build section context
    const context = buildSectionContext(
      validated.sectionId,
      pageTree,
      { name: page.name, slug: page.slug, type: "page" },
      {
        name: site.name,
        industry: site.settings?.industry || "general",
        description: site.settings?.description || "",
      }
    );
    
    // Regenerate
    const result = await regenerateSection(context, {
      mode: validated.mode as RegenerationMode,
      customInstructions: validated.customInstructions,
      preserveStructure: validated.preserveStructure,
      preserveImages: validated.preserveImages,
      targetLength: validated.targetLength,
      tone: validated.tone,
      keywords: validated.keywords,
    });
    
    // Log usage
    if (result.tokensUsed > 0) {
      // Could track token usage here for billing
      console.log(`Regeneration used ${result.tokensUsed} tokens`);
    }
    
    return result;
  } catch (error) {
    logError(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Regeneration failed",
      changes: [],
      tokensUsed: 0,
    };
  }
}

// Quick regenerate action for simple text
export async function quickRegenerateAction(
  text: string,
  mode: "rewrite" | "improve" | "simplify" | "professional" | "casual"
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    return await quickRegenerateText(text, mode);
  } catch (error) {
    logError(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed",
    };
  }
}
```

---

### Task 67.6: Regenerate Button Component

**File: `src/components/editor/ai/regenerate-button.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RegenerateDialog } from "./regenerate-dialog";

interface RegenerateButtonProps {
  sectionId: string;
  siteId: string;
  pageId: string;
  pageContent: string;
  onRegenerate: (newProps: Record<string, any>) => void;
  disabled?: boolean;
}

export function RegenerateButton({
  sectionId,
  siteId,
  pageId,
  pageContent,
  onRegenerate,
  disabled,
}: RegenerateButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setDialogOpen(true)}
            disabled={disabled}
          >
            <Sparkles className="h-4 w-4 text-purple-500" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Regenerate with AI</p>
        </TooltipContent>
      </Tooltip>

      <RegenerateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        sectionId={sectionId}
        siteId={siteId}
        pageId={pageId}
        pageContent={pageContent}
        onRegenerate={onRegenerate}
      />
    </>
  );
}
```

---

### Task 67.7: Regenerate Dialog

**File: `src/components/editor/ai/regenerate-dialog.tsx`**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { 
  Sparkles, 
  Loader2, 
  RefreshCw, 
  Wand2,
  ArrowUp,
  ArrowDown,
  Briefcase,
  MessageCircle,
  Search,
  Pencil,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { regenerateSectionAction } from "@/actions/ai/regenerate-section";
import type { RegenerationMode } from "@/lib/ai/regeneration-types";

interface RegenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  siteId: string;
  pageId: string;
  pageContent: string;
  onRegenerate: (newProps: Record<string, any>) => void;
}

const MODES: { value: RegenerationMode; label: string; icon: React.ElementType; description: string }[] = [
  { value: "rewrite", label: "Rewrite", icon: RefreshCw, description: "Complete rewrite with new language" },
  { value: "improve", label: "Improve", icon: Wand2, description: "Enhance clarity and quality" },
  { value: "expand", label: "Expand", icon: ArrowUp, description: "Add more details and content" },
  { value: "simplify", label: "Simplify", icon: ArrowDown, description: "Make it clearer and simpler" },
  { value: "professional", label: "Professional", icon: Briefcase, description: "Formal business tone" },
  { value: "casual", label: "Casual", icon: MessageCircle, description: "Friendly conversational tone" },
  { value: "seo", label: "SEO", icon: Search, description: "Optimize for search engines" },
  { value: "custom", label: "Custom", icon: Pencil, description: "Your own instructions" },
];

export function RegenerateDialog({
  open,
  onOpenChange,
  sectionId,
  siteId,
  pageId,
  pageContent,
  onRegenerate,
}: RegenerateDialogProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [mode, setMode] = useState<RegenerationMode>("improve");
  const [customInstructions, setCustomInstructions] = useState("");
  const [preserveStructure, setPreserveStructure] = useState(true);
  const [preserveImages, setPreserveImages] = useState(true);
  const [targetLength, setTargetLength] = useState<"shorter" | "same" | "longer">("same");

  const handleRegenerate = async () => {
    setIsRegenerating(true);

    try {
      const result = await regenerateSectionAction({
        siteId,
        pageId,
        sectionId,
        pageContent,
        mode,
        customInstructions: mode === "custom" ? customInstructions : undefined,
        preserveStructure,
        preserveImages,
        targetLength,
      });

      if (result.success && result.newContent) {
        onRegenerate(result.newContent.props);
        toast.success("Section regenerated!", {
          description: `${result.changes.length} changes applied.`,
        });
        onOpenChange(false);
      } else {
        toast.error("Regeneration failed", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Regenerate Section
          </DialogTitle>
          <DialogDescription>
            Use AI to regenerate the content of this section.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="mode" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mode">Mode</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>

          <TabsContent value="mode" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-2">
              {MODES.map(({ value, label, icon: Icon, description }) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    mode === value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </button>
              ))}
            </div>

            {mode === "custom" && (
              <div>
                <Label htmlFor="instructions">Custom Instructions</Label>
                <Textarea
                  id="instructions"
                  placeholder="Describe how you want the content changed..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  rows={3}
                  className="mt-1.5"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="options" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="preserveStructure"
                  checked={preserveStructure}
                  onCheckedChange={(c) => setPreserveStructure(!!c)}
                />
                <Label htmlFor="preserveStructure" className="font-normal">
                  Preserve section structure
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="preserveImages"
                  checked={preserveImages}
                  onCheckedChange={(c) => setPreserveImages(!!c)}
                />
                <Label htmlFor="preserveImages" className="font-normal">
                  Keep existing images
                </Label>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Target Length</Label>
              <RadioGroup value={targetLength} onValueChange={(v) => setTargetLength(v as any)}>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="shorter" id="shorter" />
                    <Label htmlFor="shorter" className="font-normal">Shorter</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="same" id="same" />
                    <Label htmlFor="same" className="font-normal">Same</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="longer" id="longer" />
                    <Label htmlFor="longer" className="font-normal">Longer</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRegenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRegenerate}
            disabled={isRegenerating || (mode === "custom" && !customInstructions)}
          >
            {isRegenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Regenerate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Task 67.8: Section AI Toolbar

**File: `src/components/editor/ai/section-ai-toolbar.tsx`**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { 
  Sparkles, 
  RefreshCw, 
  Wand2, 
  ArrowDown, 
  Briefcase,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { quickRegenerateAction } from "@/actions/ai/regenerate-section";

interface SectionAIToolbarProps {
  sectionId: string;
  currentText: string;
  onTextChange: (text: string) => void;
}

export function SectionAIToolbar({
  sectionId,
  currentText,
  onTextChange,
}: SectionAIToolbarProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeMode, setActiveMode] = useState<string | null>(null);

  const handleQuickRegenerate = async (mode: "rewrite" | "improve" | "simplify" | "professional" | "casual") => {
    if (!currentText) {
      toast.error("No text to regenerate");
      return;
    }

    setIsProcessing(true);
    setActiveMode(mode);

    try {
      const result = await quickRegenerateAction(currentText, mode);

      if (result.success && result.text) {
        onTextChange(result.text);
        toast.success("Text regenerated!");
      } else {
        toast.error("Failed to regenerate", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
      setActiveMode(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 text-purple-500" />
          )}
          <span className="ml-1.5 text-xs">AI</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => handleQuickRegenerate("rewrite")}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Rewrite
          {activeMode === "rewrite" && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleQuickRegenerate("improve")}>
          <Wand2 className="mr-2 h-4 w-4" />
          Improve
          {activeMode === "improve" && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleQuickRegenerate("simplify")}>
          <ArrowDown className="mr-2 h-4 w-4" />
          Simplify
          {activeMode === "simplify" && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleQuickRegenerate("professional")}>
          <Briefcase className="mr-2 h-4 w-4" />
          More Professional
          {activeMode === "professional" && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleQuickRegenerate("casual")}>
          <span className="mr-2">😊</span>
          More Casual
          {activeMode === "casual" && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

### Task 67.9: Regeneration Hook

**File: `src/hooks/use-section-regeneration.ts`**

```typescript
"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { regenerateSectionAction, type RegenerateSectionInput } from "@/actions/ai/regenerate-section";
import type { RegenerationResult, SectionContent } from "@/lib/ai/regeneration-types";

interface UseSectionRegenerationOptions {
  onSuccess?: (result: RegenerationResult) => void;
  onError?: (error: string) => void;
}

export function useSectionRegeneration(options: UseSectionRegenerationOptions = {}) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [lastResult, setLastResult] = useState<RegenerationResult | null>(null);
  const [history, setHistory] = useState<SectionContent[]>([]);

  const regenerate = useCallback(
    async (input: RegenerateSectionInput): Promise<RegenerationResult> => {
      setIsRegenerating(true);

      try {
        const result = await regenerateSectionAction(input);

        setLastResult(result);

        if (result.success) {
          // Add original to history for undo
          if (result.originalContent) {
            setHistory((prev) => [...prev, result.originalContent!]);
          }
          options.onSuccess?.(result);
        } else {
          options.onError?.(result.error || "Regeneration failed");
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        options.onError?.(errorMessage);
        return {
          success: false,
          error: errorMessage,
          changes: [],
          tokensUsed: 0,
        };
      } finally {
        setIsRegenerating(false);
      }
    },
    [options]
  );

  const undo = useCallback((): SectionContent | null => {
    if (history.length === 0) return null;

    const lastContent = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    return lastContent;
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setLastResult(null);
  }, []);

  return {
    regenerate,
    isRegenerating,
    lastResult,
    history,
    canUndo: history.length > 0,
    undo,
    clearHistory,
  };
}
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Section analyzer extracts content correctly
- [ ] Prompt builder creates valid prompts
- [ ] AI response parsing handles edge cases
- [ ] Change detection works correctly

### Integration Tests
- [ ] Regeneration action works end-to-end
- [ ] Quick regenerate works for text
- [ ] Preserving images works
- [ ] Preserving structure works

### E2E Tests
- [ ] Regenerate button opens dialog
- [ ] Mode selection works
- [ ] Regeneration completes successfully
- [ ] Changes are applied to editor
- [ ] Undo functionality works

---

## ✅ Completion Checklist

- [ ] Regeneration types defined
- [ ] Section analyzer working
- [ ] Prompt builder working
- [ ] Core regeneration logic working
- [ ] Server actions created
- [ ] Regenerate button component created
- [ ] Regenerate dialog component created
- [ ] Section AI toolbar created
- [ ] Regeneration hook created
- [ ] Integration with editor
- [ ] Tests passing

---

**Next Phase**: Phase 68 - Industry Templates UI
