/**
 * AI Page Generator Wizard
 * 
 * Multi-step wizard for generating complete pages from prompts.
 * Phase STUDIO-12: AI Page Generator
 * Phase STUDIO-28: Enhanced error handling and debugging
 */

"use client";

import { useState, useEffect } from "react";
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
  CheckCircle2,
  Circle,
} from "lucide-react";
import { toast } from "sonner";
import { useEditorStore } from "@/lib/studio/store/editor-store";
import { PagePreview } from "./page-preview";
import type { 
  AIPageGenerationRequest, 
  AIPageGenerationResponse,
  BusinessType,
  ColorScheme,
  ContentTone,
  PageTemplate,
} from "@/lib/studio/ai/types";

interface AIPageGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep = "prompt" | "options" | "generating" | "preview";

// Business type options
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

// Color scheme options
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

// Tone options
const TONE_OPTIONS: Array<{ value: ContentTone; label: string }> = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "playful", label: "Playful" },
  { value: "formal", label: "Formal" },
  { value: "inspirational", label: "Inspirational" },
];

// Template options
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
        prev ? prev : `Create a ${templateInfo.label.toLowerCase()} with ${templateInfo.description.toLowerCase()}.`
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
  
  // Apply generated page with validation and debugging
  const applyPage = () => {
    if (!result?.data) {
      console.error("[AI Generator] No data to apply");
      toast.error("No generated page data available");
      return;
    }
    
    console.log("[AI Generator] Applying data:", {
      hasRoot: !!result.data.root,
      rootChildren: result.data.root?.children?.length || 0,
      componentsCount: Object.keys(result.data.components || {}).length,
      componentTypes: Object.values(result.data.components || {}).map((c: unknown) => (c as { type: string }).type),
    });
    
    // Validate the generated data structure
    if (!result.data.root) {
      console.error("[AI Generator] Missing root in generated data");
      toast.error("Invalid generated page structure: missing root");
      return;
    }
    
    if (!result.data.components) {
      console.error("[AI Generator] Missing components in generated data");
      toast.error("Invalid generated page structure: missing components");
      return;
    }
    
    // Ensure root.children array exists
    if (!result.data.root.children) {
      result.data.root.children = [];
    }
    
    // Ensure zones object exists
    if (!result.data.zones) {
      result.data.zones = {};
    }
    
    // Apply the data
    try {
      console.log("[AI Generator] Calling setData...");
      setData(result.data);
      console.log("[AI Generator] setData complete");
      
      toast.success("Page generated successfully!", {
        description: `Added ${Object.keys(result.data.components).length} components`,
      });
      
      handleClose();
    } catch (error) {
      console.error("[AI Generator] Apply error:", error);
      toast.error("Failed to apply generated page");
    }
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
              <p className="font-medium mb-1">{result.explanation}</p>
              <p className="text-muted-foreground">
                Review the structure above. Click &quot;Apply&quot; to add this to your canvas,
                or &quot;Regenerate&quot; to try again.
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
