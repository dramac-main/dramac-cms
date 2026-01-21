# Phase 26: AI Builder - Interface

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Build the user interface for AI website generation - prompt input, industry selection, settings, and generation flow.

---

## 📋 Prerequisites

- [ ] Phase 25 completed (AI Builder Foundation)

---

## ✅ Tasks

### Task 26.1: Industry Selector Component

**File: `src/components/ai-builder/industry-selector.tsx`**

```typescript
"use client";

import { cn } from "@/lib/utils";
import { industryTemplates, IndustryTemplate } from "@/lib/ai/templates";
import {
  Palette,
  Rocket,
  ShoppingCart,
  UtensilsCrossed,
  User,
  HeartPulse,
  Home,
  Dumbbell,
  GraduationCap,
  Heart,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Palette,
  Rocket,
  ShoppingCart,
  UtensilsCrossed,
  User,
  HeartPulse,
  Home,
  Dumbbell,
  GraduationCap,
  Heart,
};

interface IndustrySelectorProps {
  selected: string | null;
  onSelect: (industry: IndustryTemplate) => void;
}

export function IndustrySelector({ selected, onSelect }: IndustrySelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-1">Choose Your Industry</h3>
        <p className="text-sm text-muted-foreground">
          Select an industry to get optimized templates and suggestions
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {industryTemplates.map((template) => {
          const Icon = iconMap[template.icon] || Palette;
          const isSelected = selected === template.id;

          return (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all text-left",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-center">{template.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

### Task 26.2: Generation Settings

**File: `src/components/ai-builder/generation-settings.tsx`**

```typescript
"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export interface GenerationSettingsData {
  tone: "professional" | "friendly" | "playful" | "luxurious" | "minimal";
  targetAudience: string;
  includeNavigation: boolean;
  includeFooter: boolean;
  includeCTA: boolean;
  includeTestimonials: boolean;
  includeContact: boolean;
  includeNewsletter: boolean;
}

interface GenerationSettingsProps {
  settings: GenerationSettingsData;
  onChange: (settings: GenerationSettingsData) => void;
}

export function GenerationSettings({ settings, onChange }: GenerationSettingsProps) {
  const updateSetting = <K extends keyof GenerationSettingsData>(
    key: K,
    value: GenerationSettingsData[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-1">Generation Settings</h3>
        <p className="text-sm text-muted-foreground">
          Customize how your website will be generated
        </p>
      </div>

      {/* Tone */}
      <div className="space-y-2">
        <Label>Tone of Voice</Label>
        <Select
          value={settings.tone}
          onValueChange={(value: GenerationSettingsData["tone"]) =>
            updateSetting("tone", value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select tone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="friendly">Friendly & Approachable</SelectItem>
            <SelectItem value="playful">Playful & Creative</SelectItem>
            <SelectItem value="luxurious">Luxurious & Premium</SelectItem>
            <SelectItem value="minimal">Minimal & Clean</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Target Audience */}
      <div className="space-y-2">
        <Label htmlFor="targetAudience">Target Audience (optional)</Label>
        <Input
          id="targetAudience"
          value={settings.targetAudience}
          onChange={(e) => updateSetting("targetAudience", e.target.value)}
          placeholder="e.g., Small business owners, Tech enthusiasts"
        />
      </div>

      {/* Sections to Include */}
      <div className="space-y-4">
        <Label>Sections to Include</Label>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Navigation</span>
            <Switch
              checked={settings.includeNavigation}
              onCheckedChange={(checked) => updateSetting("includeNavigation", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Footer</span>
            <Switch
              checked={settings.includeFooter}
              onCheckedChange={(checked) => updateSetting("includeFooter", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Call to Action</span>
            <Switch
              checked={settings.includeCTA}
              onCheckedChange={(checked) => updateSetting("includeCTA", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Testimonials</span>
            <Switch
              checked={settings.includeTestimonials}
              onCheckedChange={(checked) => updateSetting("includeTestimonials", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Contact Form</span>
            <Switch
              checked={settings.includeContact}
              onCheckedChange={(checked) => updateSetting("includeContact", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Newsletter</span>
            <Switch
              checked={settings.includeNewsletter}
              onCheckedChange={(checked) => updateSetting("includeNewsletter", checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const defaultGenerationSettings: GenerationSettingsData = {
  tone: "professional",
  targetAudience: "",
  includeNavigation: true,
  includeFooter: true,
  includeCTA: true,
  includeTestimonials: true,
  includeContact: true,
  includeNewsletter: false,
};
```

### Task 26.3: Prompt Input Component

**File: `src/components/ai-builder/prompt-input.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, Wand2 } from "lucide-react";
import { IndustryTemplate } from "@/lib/ai/templates";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  selectedIndustry: IndustryTemplate | null;
  isGenerating: boolean;
  onGenerate: () => void;
}

const examplePrompts = [
  "A modern tech startup building AI-powered productivity tools",
  "A cozy coffee shop in downtown with organic, locally sourced beans",
  "A freelance photographer specializing in wedding and portrait photography",
  "A digital marketing agency helping small businesses grow online",
  "A yoga studio offering classes for all skill levels",
];

export function PromptInput({
  value,
  onChange,
  selectedIndustry,
  isGenerating,
  onGenerate,
}: PromptInputProps) {
  const [showExamples, setShowExamples] = useState(false);

  const useSamplePrompt = () => {
    if (selectedIndustry) {
      onChange(selectedIndustry.samplePrompt);
    } else {
      const random = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
      onChange(random);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="prompt" className="text-base font-semibold">
            Describe Your Business
          </Label>
          <p className="text-sm text-muted-foreground">
            Tell us about your business and we&apos;ll create a website for you
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={useSamplePrompt}
          className="text-primary"
        >
          <Wand2 className="w-4 h-4 mr-1" />
          Try Example
        </Button>
      </div>

      <div className="relative">
        <textarea
          id="prompt"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe your business, products/services, and target audience. The more detail you provide, the better the result will be..."
          className="w-full min-h-[150px] p-4 text-base rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={isGenerating}
        />
        <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
          {value.length} characters
        </div>
      </div>

      {/* Quick examples */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Quick start:</span>
        {examplePrompts.slice(0, 3).map((prompt, index) => (
          <button
            key={index}
            onClick={() => onChange(prompt)}
            className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors truncate max-w-[150px]"
            disabled={isGenerating}
          >
            {prompt.slice(0, 30)}...
          </button>
        ))}
      </div>

      {/* Generate Button */}
      <Button
        onClick={onGenerate}
        disabled={isGenerating || value.length < 20}
        size="lg"
        className="w-full"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Generating your website...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Website with AI
          </>
        )}
      </Button>

      {value.length > 0 && value.length < 20 && (
        <p className="text-xs text-muted-foreground text-center">
          Please provide at least 20 characters for better results
        </p>
      )}
    </div>
  );
}
```

### Task 26.4: Generation Progress Component

**File: `src/components/ai-builder/generation-progress.tsx`**

```typescript
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

interface GenerationProgressProps {
  isGenerating: boolean;
}

const steps = [
  { id: 1, label: "Analyzing your description", duration: 2000 },
  { id: 2, label: "Selecting optimal layout", duration: 2500 },
  { id: 3, label: "Generating compelling copy", duration: 3000 },
  { id: 4, label: "Creating visual structure", duration: 2000 },
  { id: 5, label: "Finalizing your website", duration: 1500 },
];

export function GenerationProgress({ isGenerating }: GenerationProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (!isGenerating) {
      setCurrentStep(0);
      setCompletedSteps([]);
      return;
    }

    let stepIndex = 0;
    const runStep = () => {
      if (stepIndex >= steps.length) return;
      
      setCurrentStep(stepIndex + 1);
      
      setTimeout(() => {
        setCompletedSteps((prev) => [...prev, stepIndex + 1]);
        stepIndex++;
        runStep();
      }, steps[stepIndex].duration);
    };

    runStep();
  }, [isGenerating]);

  if (!isGenerating && completedSteps.length === 0) {
    return null;
  }

  return (
    <div className="p-6 rounded-xl bg-muted/50 border">
      <div className="space-y-4">
        {steps.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id && !isCompleted;

          return (
            <div key={step.id} className="flex items-center gap-3">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3" />
                ) : isCurrent ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <span className="text-xs">{step.id}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-sm transition-colors",
                  isCompleted
                    ? "text-foreground"
                    : isCurrent
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Task 26.5: AI Builder Page

**File: `src/app/(dashboard)/sites/[siteId]/builder/page.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IndustrySelector } from "@/components/ai-builder/industry-selector";
import { PromptInput } from "@/components/ai-builder/prompt-input";
import {
  GenerationSettings,
  GenerationSettingsData,
  defaultGenerationSettings,
} from "@/components/ai-builder/generation-settings";
import { GenerationProgress } from "@/components/ai-builder/generation-progress";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { IndustryTemplate } from "@/lib/ai/templates";
import { ArrowLeft, Settings, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function AIBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.siteId as string;

  const [prompt, setPrompt] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryTemplate | null>(null);
  const [settings, setSettings] = useState<GenerationSettingsData>(defaultGenerationSettings);
  const [showSettings, setShowSettings] = useState(false);

  const { generate, isGenerating, error, result } = useAIGeneration();

  const handleGenerate = async () => {
    if (prompt.length < 20) {
      toast.error("Please provide a more detailed description");
      return;
    }

    // Build sections array from settings
    const sections: string[] = ["hero", "features"];
    if (settings.includeNavigation) sections.unshift("navigation");
    if (settings.includeCTA) sections.push("cta");
    if (settings.includeTestimonials) sections.push("testimonials");
    if (settings.includeContact) sections.push("contact");
    if (settings.includeNewsletter) sections.push("newsletter");
    if (settings.includeFooter) sections.push("footer");

    try {
      const website = await generate({
        businessDescription: prompt,
        industryId: selectedIndustry?.id,
        tone: settings.tone,
        targetAudience: settings.targetAudience || undefined,
        sections,
        colorPreference: selectedIndustry?.colorScheme,
        siteId,
      });

      if (website) {
        toast.success("Website generated successfully!");
        // Navigate to editor with generated content
        router.push(`/sites/${siteId}/editor?generated=true`);
      }
    } catch (err) {
      toast.error(error || "Failed to generate website");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Website Builder
              </h1>
              <p className="text-sm text-muted-foreground">
                Generate a complete website in seconds
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4 mr-2" />
            {showSettings ? "Hide" : "Show"} Settings
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Industry Selection */}
        <IndustrySelector
          selected={selectedIndustry?.id ?? null}
          onSelect={setSelectedIndustry}
        />

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-6 rounded-xl border bg-card">
            <GenerationSettings
              settings={settings}
              onChange={setSettings}
            />
          </div>
        )}

        {/* Prompt Input */}
        <div className="p-6 rounded-xl border bg-card">
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            selectedIndustry={selectedIndustry}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
          />
        </div>

        {/* Generation Progress */}
        <GenerationProgress isGenerating={isGenerating} />

        {/* Error Display */}
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
```

### Task 26.6: New Site with AI Option

**File: `src/components/sites/create-site-dialog.tsx`** (Updated)

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Sparkles, PenTool } from "lucide-react";

interface CreateSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

type CreationMode = "select" | "ai" | "manual";

export function CreateSiteDialog({
  open,
  onOpenChange,
  clientId,
}: CreateSiteDialogProps) {
  const router = useRouter();
  const [mode, setMode] = useState<CreationMode>("select");
  const [isLoading, setIsLoading] = useState(false);
  const [siteName, setSiteName] = useState("");

  const handleCreateSite = async (useAI: boolean) => {
    if (!siteName.trim()) {
      toast.error("Please enter a site name");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      const { data: site, error } = await supabase
        .from("sites")
        .insert({
          name: siteName,
          client_id: clientId,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Site created!");
      onOpenChange(false);
      setSiteName("");
      setMode("select");

      if (useAI) {
        router.push(`/sites/${site.id}/builder`);
      } else {
        router.push(`/sites/${site.id}/editor`);
      }
    } catch (error) {
      toast.error("Failed to create site");
    } finally {
      setIsLoading(false);
    }
  };

  const resetDialog = () => {
    setMode("select");
    setSiteName("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        onOpenChange(newOpen);
        if (!newOpen) resetDialog();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Site</DialogTitle>
          <DialogDescription>
            {mode === "select"
              ? "Choose how you want to create your website"
              : "Enter a name for your new site"}
          </DialogDescription>
        </DialogHeader>

        {mode === "select" ? (
          <div className="grid gap-4 py-4">
            <button
              onClick={() => setMode("ai")}
              className="flex items-start gap-4 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Generate with AI</h3>
                <p className="text-sm text-muted-foreground">
                  Describe your business and let AI create a complete website for you
                </p>
              </div>
            </button>

            <button
              onClick={() => setMode("manual")}
              className="flex items-start gap-4 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <PenTool className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Start from Scratch</h3>
                <p className="text-sm text-muted-foreground">
                  Build your website manually using the visual editor
                </p>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="My Awesome Website"
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setMode("select")}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                onClick={() => handleCreateSite(mode === "ai")}
                disabled={isLoading || !siteName.trim()}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : mode === "ai" ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Continue to AI Builder
                  </>
                ) : (
                  "Create Site"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📐 Acceptance Criteria

- [ ] Industry selector displays 10 template options
- [ ] Industry selection updates sample prompt
- [ ] Settings panel toggles visibility
- [ ] Prompt input has character count and examples
- [ ] Generation progress shows animated steps
- [ ] Generate button validates minimum characters
- [ ] Create site dialog offers AI/manual choice
- [ ] AI path navigates to builder page
- [ ] Error states display properly

---

## 📁 Files Created This Phase

```
src/components/ai-builder/
├── industry-selector.tsx
├── generation-settings.tsx
├── prompt-input.tsx
└── generation-progress.tsx

src/app/(dashboard)/sites/[siteId]/builder/
└── page.tsx

src/components/sites/
└── create-site-dialog.tsx (updated)
```

---

## ➡️ Next Phase

**Phase 27: AI Builder - Content Converter** - Transform AI output to Craft.js node structure.
