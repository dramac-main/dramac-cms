# Phase 67: AI Section Regeneration - Content Refinement System

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟡 HIGH
>
> **Estimated Time**: 3-4 hours

---

## ⚠️ CHECK EXISTING AI IMPLEMENTATION FIRST!

**Files to review before starting:**
- `src/lib/ai/` - Check what AI utilities exist
- `src/lib/actions/ai/` - Check existing AI actions
- `src/components/editor/ai/` - Check AI editor components

**This phase adds:**
- ✅ Section-level content regeneration
- ✅ Multiple regeneration modes (rewrite, improve, expand, etc.)
- ✅ Regeneration preview before applying
- ✅ Context-aware prompting

---

## ⚠️ SCHEMA WARNING - USE CORRECT TABLE NAMES!

| ❌ DO NOT USE | ✅ USE INSTEAD |
|---------------|----------------|
| `site_modules` | `site_module_installations` |
| `modules` | `modules_v2` |

---

## 🎯 Objective

Implement AI-powered section regeneration that allows users to refine individual sections with different modes (rewrite, improve, expand, simplify, etc.) while preserving the overall page structure.

---

## 📋 Prerequisites

- [x] Claude API configured (check `.env` for `ANTHROPIC_API_KEY`)
- [x] AI builder foundation exists
- [x] Visual editor with section selection working

---

## ✅ Tasks

### Task 67.1: Regeneration Types

**File: `src/lib/ai/regeneration-types.ts`**

```typescript
export type RegenerationMode =
  | "rewrite"      // Complete rewrite, same structure
  | "improve"      // Improve existing content quality
  | "expand"       // Add more content/detail
  | "simplify"     // Make simpler/shorter
  | "professional" // More formal/professional tone
  | "casual"       // More friendly/casual tone
  | "seo"          // Optimize for search engines
  | "custom";      // User-provided instructions

export interface RegenerationOptions {
  mode: RegenerationMode;
  customInstructions?: string;
  preserveStructure?: boolean;
  preserveImages?: boolean;
  targetLength?: "shorter" | "same" | "longer";
  keywords?: string[];
}

export interface SectionContent {
  type: string;
  text?: string;
  heading?: string;
  items?: string[];
  props?: Record<string, unknown>;
}

export interface RegenerationResult {
  success: boolean;
  content?: SectionContent;
  error?: string;
  tokensUsed?: number;
}
```

---

### Task 67.2: Regeneration Service

**File: `src/lib/ai/regenerate-section.ts`**

```typescript
import Anthropic from "@anthropic-ai/sdk";
import type { RegenerationOptions, SectionContent, RegenerationResult } from "./regeneration-types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MODE_PROMPTS: Record<string, string> = {
  rewrite: "Completely rewrite this content while maintaining the same structure and key messages.",
  improve: "Improve the quality of this content - better word choice, clearer sentences, more engaging.",
  expand: "Expand this content with more detail, examples, or supporting information.",
  simplify: "Simplify this content - shorter sentences, clearer language, less jargon.",
  professional: "Make this content more professional and formal in tone.",
  casual: "Make this content more friendly, casual, and conversational.",
  seo: "Optimize this content for search engines while keeping it readable.",
};

export async function regenerateSection(
  sectionContent: SectionContent,
  options: RegenerationOptions,
  context?: { businessName?: string; industry?: string }
): Promise<RegenerationResult> {
  try {
    const modePrompt = options.mode === "custom" 
      ? options.customInstructions || "Improve this content."
      : MODE_PROMPTS[options.mode];

    const lengthInstruction = {
      shorter: "Make it about 30% shorter.",
      same: "Keep approximately the same length.",
      longer: "Expand it to be about 50% longer.",
    }[options.targetLength || "same"];

    const keywordsInstruction = options.keywords?.length
      ? `Try to naturally incorporate these keywords: ${options.keywords.join(", ")}.`
      : "";

    const prompt = `You are helping regenerate website content for a section.

CURRENT SECTION TYPE: ${sectionContent.type}
CURRENT CONTENT:
${JSON.stringify(sectionContent, null, 2)}

${context?.businessName ? `BUSINESS: ${context.businessName}` : ""}
${context?.industry ? `INDUSTRY: ${context.industry}` : ""}

INSTRUCTIONS:
${modePrompt}
${lengthInstruction}
${keywordsInstruction}
${options.preserveStructure ? "Maintain the exact same structure (headings, bullet points, etc.)." : ""}
${options.preserveImages ? "Keep any image references unchanged." : ""}

Return the regenerated content as a JSON object matching the input structure. Only return the JSON, no explanation.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: "Failed to parse AI response" };
    }

    const content = JSON.parse(jsonMatch[0]) as SectionContent;

    return {
      success: true,
      content,
      tokensUsed: response.usage?.output_tokens,
    };
  } catch (error) {
    console.error("Regeneration error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

---

### Task 67.3: Server Action

**File: `src/lib/actions/ai/regenerate-section.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { regenerateSection } from "@/lib/ai/regenerate-section";
import type { RegenerationOptions, SectionContent } from "@/lib/ai/regeneration-types";

export async function regenerateSectionAction(
  siteId: string,
  sectionContent: SectionContent,
  options: RegenerationOptions
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get site context
  const { data: site } = await supabase
    .from("sites")
    .select("name, clients(name, industry)")
    .eq("id", siteId)
    .single();

  const context = {
    businessName: site?.clients?.name || site?.name,
    industry: site?.clients?.industry,
  };

  const result = await regenerateSection(sectionContent, options, context);

  return result;
}
```

---

### Task 67.4: Regenerate Button Component

**File: `src/components/editor/ai/regenerate-button.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RegenerateDialog } from "./regenerate-dialog";
import type { RegenerationMode, SectionContent } from "@/lib/ai/regeneration-types";

interface RegenerateButtonProps {
  sectionContent: SectionContent;
  siteId: string;
  onRegenerate: (newContent: SectionContent) => void;
}

const QUICK_MODES: { mode: RegenerationMode; label: string }[] = [
  { mode: "improve", label: "✨ Improve" },
  { mode: "expand", label: "📝 Expand" },
  { mode: "simplify", label: "📉 Simplify" },
  { mode: "professional", label: "👔 Professional" },
  { mode: "casual", label: "💬 Casual" },
];

export function RegenerateButton({
  sectionContent,
  siteId,
  onRegenerate,
}: RegenerateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [quickLoading, setQuickLoading] = useState<RegenerationMode | null>(null);

  async function handleQuickRegenerate(mode: RegenerationMode) {
    setQuickLoading(mode);
    try {
      const { regenerateSectionAction } = await import("@/lib/actions/ai/regenerate-section");
      const result = await regenerateSectionAction(siteId, sectionContent, {
        mode,
        preserveStructure: true,
      });

      if (result.success && result.content) {
        onRegenerate(result.content);
      }
    } finally {
      setQuickLoading(null);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8">
            <Sparkles className="h-4 w-4 mr-1" />
            AI
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {QUICK_MODES.map(({ mode, label }) => (
            <DropdownMenuItem
              key={mode}
              onClick={() => handleQuickRegenerate(mode)}
              disabled={quickLoading !== null}
            >
              {quickLoading === mode && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsOpen(true)}>
            🎯 Custom Instructions...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RegenerateDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        sectionContent={sectionContent}
        siteId={siteId}
        onRegenerate={onRegenerate}
      />
    </>
  );
}
```

---

### Task 67.5: Custom Regenerate Dialog

**File: `src/components/editor/ai/regenerate-dialog.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { SectionContent, RegenerationOptions } from "@/lib/ai/regeneration-types";

interface RegenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionContent: SectionContent;
  siteId: string;
  onRegenerate: (newContent: SectionContent) => void;
}

export function RegenerateDialog({
  open,
  onOpenChange,
  sectionContent,
  siteId,
  onRegenerate,
}: RegenerateDialogProps) {
  const [instructions, setInstructions] = useState("");
  const [preserveStructure, setPreserveStructure] = useState(true);
  const [targetLength, setTargetLength] = useState<"shorter" | "same" | "longer">("same");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<SectionContent | null>(null);

  async function handleGenerate() {
    setLoading(true);
    try {
      const { regenerateSectionAction } = await import("@/lib/actions/ai/regenerate-section");
      
      const options: RegenerationOptions = {
        mode: "custom",
        customInstructions: instructions,
        preserveStructure,
        targetLength,
      };

      const result = await regenerateSectionAction(siteId, sectionContent, options);

      if (result.success && result.content) {
        setPreview(result.content);
      } else {
        toast.error("Generation failed", { description: result.error });
      }
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (preview) {
      onRegenerate(preview);
      onOpenChange(false);
      setPreview(null);
      setInstructions("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Custom AI Regeneration</DialogTitle>
          <DialogDescription>
            Provide custom instructions to regenerate this section.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., Make it more compelling, add a call to action, focus on benefits..."
              rows={4}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="preserve">Preserve Structure</Label>
            <Switch
              id="preserve"
              checked={preserveStructure}
              onCheckedChange={setPreserveStructure}
            />
          </div>

          <div className="space-y-2">
            <Label>Target Length</Label>
            <Select value={targetLength} onValueChange={(v) => setTargetLength(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shorter">Shorter</SelectItem>
                <SelectItem value="same">About the same</SelectItem>
                <SelectItem value="longer">Longer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {preview && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="p-4 rounded-lg border bg-muted/50 max-h-48 overflow-auto">
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(preview, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {preview ? (
            <Button onClick={handleApply}>Apply Changes</Button>
          ) : (
            <Button onClick={handleGenerate} disabled={loading || !instructions}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## ✅ Completion Checklist

- [x] Checked existing AI implementation
- [x] Regeneration types defined
- [x] Regeneration service created
- [x] Server action created
- [x] Regenerate button component
- [x] Custom regenerate dialog
- [x] Tested all regeneration modes
- [x] Verified context is used correctly

---

## 📝 Notes for AI Agent

1. **CHECK FIRST** - Review `src/lib/ai/` for existing utilities
2. **USE SONNET** - Claude Sonnet for cost efficiency
3. **PRESERVE STRUCTURE** - Default to keeping same structure
4. **CONTEXT AWARE** - Use site/client info for better results
5. **PREVIEW FIRST** - Let users see before applying
