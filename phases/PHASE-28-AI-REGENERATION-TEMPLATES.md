# Phase 28: AI Builder - Regeneration & Templates

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Add section regeneration, template saving/loading, and import/export functionality.

---

## 📋 Prerequisites

- [ ] Phase 27 completed (AI Content Converter)

---

## ✅ Tasks

### Task 28.1: Section Regeneration API

**File: `src/app/api/ai/regenerate-section/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, DEFAULT_MODEL, GENERATION_CONFIG } from "@/lib/ai/config";

interface RegenerateRequest {
  sectionType: string;
  currentContent: Record<string, unknown>;
  instruction: string;
  businessContext?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: RegenerateRequest = await request.json();
    const { sectionType, currentContent, instruction, businessContext } = body;

    if (!sectionType || !instruction) {
      return NextResponse.json(
        { error: "Section type and instruction required" },
        { status: 400 }
      );
    }

    const prompt = `You are editing a ${sectionType} section of a website.

Current content:
${JSON.stringify(currentContent, null, 2)}

${businessContext ? `Business context: ${businessContext}` : ""}

User instruction: ${instruction}

Return ONLY valid JSON with the updated section props. Match the exact structure of the current content. Do not add new properties, only modify existing values based on the instruction.`;

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: GENERATION_CONFIG.maxTokens,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const updatedProps = JSON.parse(content.text);

    return NextResponse.json({
      success: true,
      props: updatedProps,
      tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens,
    });
  } catch (error) {
    console.error("Regeneration error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Regeneration failed" },
      { status: 500 }
    );
  }
}
```

### Task 28.2: Regeneration Hook

**File: `src/hooks/use-regenerate-section.ts`**

```typescript
"use client";

import { useState } from "react";

interface RegenerateOptions {
  sectionType: string;
  currentContent: Record<string, unknown>;
  instruction: string;
  businessContext?: string;
}

export function useRegenerateSection() {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function regenerate(options: RegenerateOptions) {
    setIsRegenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/regenerate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Regeneration failed");
      }

      return data.props;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to regenerate";
      setError(message);
      throw err;
    } finally {
      setIsRegenerating(false);
    }
  }

  return { regenerate, isRegenerating, error };
}
```

### Task 28.3: AI Regenerate Button Component

**File: `src/components/editor/ai-regenerate.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useNode, useEditor } from "@craftjs/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRegenerateSection } from "@/hooks/use-regenerate-section";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function AIRegenerate() {
  const { id, props, name } = useNode((node) => ({
    props: node.data.props,
    name: node.data.displayName || node.data.type,
  }));
  
  const { actions } = useEditor();
  const { regenerate, isRegenerating } = useRegenerateSection();
  
  const [instruction, setInstruction] = useState("");
  const [open, setOpen] = useState(false);

  const handleRegenerate = async () => {
    if (!instruction.trim()) {
      toast.error("Please provide an instruction");
      return;
    }

    try {
      const newProps = await regenerate({
        sectionType: name as string,
        currentContent: props as Record<string, unknown>,
        instruction,
      });

      // Update the node with new props
      actions.setProp(id, (nodeProps) => {
        Object.assign(nodeProps, newProps);
      });

      toast.success("Section regenerated!");
      setInstruction("");
      setOpen(false);
    } catch (err) {
      toast.error("Failed to regenerate section");
    }
  };

  // Quick regeneration presets
  const presets = [
    { label: "Make it shorter", value: "Make the text more concise" },
    { label: "Make it longer", value: "Expand the content with more details" },
    { label: "More professional", value: "Use more professional, formal language" },
    { label: "More casual", value: "Use friendlier, casual language" },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="w-4 h-4" />
          AI Edit
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-1">Regenerate with AI</h4>
            <p className="text-xs text-muted-foreground">
              Describe how you want to change this section
            </p>
          </div>

          <Input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g., Make the title more engaging"
            disabled={isRegenerating}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRegenerate();
            }}
          />

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setInstruction(preset.value)}
                className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80"
                disabled={isRegenerating}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <Button
            onClick={handleRegenerate}
            disabled={isRegenerating || !instruction.trim()}
            className="w-full"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate Section
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

### Task 28.4: Template Database Schema

Add to Supabase SQL:

```sql
-- Templates table for saving reusable designs
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  content JSONB NOT NULL,
  category TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Public templates visible to all
CREATE POLICY "Public templates are viewable by everyone"
  ON public.templates FOR SELECT
  USING (is_public = true);

-- Agency members can view their templates
CREATE POLICY "Agency members can view their templates"
  ON public.templates FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid()
    )
  );

-- Admins can create templates
CREATE POLICY "Admins can create templates"
  ON public.templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agency_members 
      WHERE user_id = auth.uid() 
      AND agency_id = templates.agency_id
      AND role IN ('owner', 'admin')
    )
  );

-- Admins can update their templates
CREATE POLICY "Admins can update their templates"
  ON public.templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members 
      WHERE user_id = auth.uid() 
      AND agency_id = templates.agency_id
      AND role IN ('owner', 'admin')
    )
  );

-- Admins can delete their templates
CREATE POLICY "Admins can delete their templates"
  ON public.templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members 
      WHERE user_id = auth.uid() 
      AND agency_id = templates.agency_id
      AND role IN ('owner', 'admin')
    )
  );

CREATE INDEX idx_templates_agency ON public.templates(agency_id);
CREATE INDEX idx_templates_category ON public.templates(category);
CREATE INDEX idx_templates_public ON public.templates(is_public) WHERE is_public = true;

-- Trigger for updated_at
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Task 28.5: Save as Template Dialog

**File: `src/components/editor/save-template-dialog.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useEditor } from "@craftjs/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyId: string;
}

const categories = [
  { value: "landing-page", label: "Landing Page" },
  { value: "portfolio", label: "Portfolio" },
  { value: "business", label: "Business" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "blog", label: "Blog" },
  { value: "other", label: "Other" },
];

export function SaveTemplateDialog({
  open,
  onOpenChange,
  agencyId,
}: SaveTemplateDialogProps) {
  const { query } = useEditor();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("landing-page");
  const [isPublic, setIsPublic] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      // Get current editor content
      const content = query.serialize();

      const { error } = await supabase.from("templates").insert({
        name,
        description,
        category,
        is_public: isPublic,
        agency_id: agencyId,
        content: JSON.parse(content),
      });

      if (error) throw error;

      toast.success("Template saved!");
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to save template");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("landing-page");
    setIsPublic(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save your current design as a reusable template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Template"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of this template..."
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Make Public</Label>
              <p className="text-xs text-muted-foreground">
                Allow other agencies to use this template
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !name.trim()}>
            {isLoading ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Task 28.6: Template Library Component

**File: `src/components/editor/template-library.tsx`**

```typescript
"use client";

import { useEffect, useState } from "react";
import { useEditor } from "@craftjs/core";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { Search, Layout, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  thumbnail_url: string | null;
  is_public: boolean;
  content: Record<string, unknown>;
}

interface TemplateLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyId: string;
}

export function TemplateLibrary({
  open,
  onOpenChange,
  agencyId,
}: TemplateLibraryProps) {
  const { actions } = useEditor();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [publicTemplates, setPublicTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open, agencyId]);

  const loadTemplates = async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      // Load agency templates
      const { data: agencyTemplates } = await supabase
        .from("templates")
        .select("*")
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false });

      // Load public templates
      const { data: pubTemplates } = await supabase
        .from("templates")
        .select("*")
        .eq("is_public", true)
        .neq("agency_id", agencyId)
        .order("created_at", { ascending: false });

      setTemplates(agencyTemplates || []);
      setPublicTemplates(pubTemplates || []);
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyTemplate = async (template: Template) => {
    setApplying(template.id);

    try {
      // Deserialize and apply template content
      actions.deserialize(JSON.stringify(template.content));
      toast.success(`Applied template: ${template.name}`);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to apply template");
    } finally {
      setApplying(null);
    }
  };

  const filterTemplates = (list: Template[]) => {
    if (!search) return list;
    const lower = search.toLowerCase();
    return list.filter(
      (t) =>
        t.name.toLowerCase().includes(lower) ||
        t.description?.toLowerCase().includes(lower) ||
        t.category.toLowerCase().includes(lower)
    );
  };

  const TemplateGrid = ({ templates }: { templates: Template[] }) => (
    <div className="grid grid-cols-2 gap-4">
      {templates.length === 0 ? (
        <div className="col-span-2 py-8 text-center text-muted-foreground">
          No templates found
        </div>
      ) : (
        templates.map((template) => (
          <div
            key={template.id}
            className="border rounded-lg overflow-hidden group cursor-pointer"
            onClick={() => applyTemplate(template)}
          >
            {/* Thumbnail */}
            <div className="aspect-video bg-muted flex items-center justify-center relative">
              {template.thumbnail_url ? (
                <img
                  src={template.thumbnail_url}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Layout className="w-8 h-8 text-muted-foreground" />
              )}
              {applying === template.id && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>
            {/* Info */}
            <div className="p-3">
              <h4 className="font-medium truncate">{template.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {template.category}
                </Badge>
                {template.is_public && (
                  <Badge variant="outline" className="text-xs">
                    Public
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle>Template Library</SheetTitle>
          <SheetDescription>
            Choose a template to start your design
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="pl-9"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="my-templates">
            <TabsList className="w-full">
              <TabsTrigger value="my-templates" className="flex-1">
                My Templates ({templates.length})
              </TabsTrigger>
              <TabsTrigger value="public" className="flex-1">
                Public ({publicTemplates.length})
              </TabsTrigger>
            </TabsList>

            {isLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              </div>
            ) : (
              <>
                <TabsContent value="my-templates" className="mt-4">
                  <TemplateGrid templates={filterTemplates(templates)} />
                </TabsContent>
                <TabsContent value="public" className="mt-4">
                  <TemplateGrid templates={filterTemplates(publicTemplates)} />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

### Task 28.7: Export/Import Functions

**File: `src/lib/editor/export-import.ts`**

```typescript
import { Editor } from "@craftjs/core";

// Export editor content as JSON file
export function exportAsJSON(content: string, filename: string = "template") {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import JSON file and return content
export function importFromJSON(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        // Validate JSON
        JSON.parse(content);
        resolve(content);
      } catch (error) {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

// Export as HTML (rendered output)
export function exportAsHTML(html: string, filename: string = "website") {
  const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Website</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  ${html}
</body>
</html>`;

  const blob = new Blob([fullHTML], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

---

## 📐 Acceptance Criteria

- [ ] Section regeneration API accepts instructions
- [ ] AI Edit button appears on selected components
- [ ] Quick presets provide common modifications
- [ ] Templates table in Supabase with RLS
- [ ] Save template captures current editor state
- [ ] Template library shows agency + public templates
- [ ] Templates can be filtered by search
- [ ] Applying template loads content into editor
- [ ] JSON export downloads valid file
- [ ] JSON import restores editor state

---

## 📁 Files Created This Phase

```
src/app/api/ai/regenerate-section/
└── route.ts

src/hooks/
└── use-regenerate-section.ts

src/components/editor/
├── ai-regenerate.tsx
├── save-template-dialog.tsx
└── template-library.tsx

src/lib/editor/
└── export-import.ts

migrations/
└── templates.sql
```

---

## ➡️ Next Phase

**Phase 29: Module System - Foundation** - Module database schema, types, marketplace structure.
