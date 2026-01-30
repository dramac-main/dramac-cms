/**
 * AI Generation Wizard
 * 
 * Step-by-step wizard for AI-powered page generation.
 * Part of PHASE-ED-05B: AI Editor - Custom Generation
 */

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Building2,
  Palette,
  Layout,
  Users,
  FileText,
  Wand2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PAGE_TEMPLATES,
  STYLE_PRESETS,
  INDUSTRY_PRESETS,
  type PageTemplateType,
  type StylePresetType,
  type IndustryPresetType,
  type PageGenerationContext,
} from "@/lib/ai/puck-generation";
import type { Data as PuckData } from "@puckeditor/core";

// ============================================
// Types
// ============================================

interface AIGenerationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: PuckData) => void;
  className?: string;
}

interface WizardState {
  step: number;
  // Step 1: Business Info
  businessDescription: string;
  companyName: string;
  tagline: string;
  industry: IndustryPresetType | "";
  // Step 2: Style & Tone
  style: StylePresetType | "";
  tone: PageGenerationContext["tone"];
  primaryColor: string;
  // Step 3: Content & Sections
  template: PageTemplateType | "";
  customSections: string[];
  targetAudience: string;
  // Step 4: Review & Generate
  isGenerating: boolean;
  generatedData: PuckData | null;
  error: string | null;
}

const INITIAL_STATE: WizardState = {
  step: 1,
  businessDescription: "",
  companyName: "",
  tagline: "",
  industry: "",
  style: "",
  tone: "professional",
  primaryColor: "#3b82f6",
  template: "",
  customSections: [],
  targetAudience: "",
  isGenerating: false,
  generatedData: null,
  error: null,
};

const STEPS = [
  { number: 1, title: "Business", icon: Building2 },
  { number: 2, title: "Style", icon: Palette },
  { number: 3, title: "Content", icon: Layout },
  { number: 4, title: "Generate", icon: Wand2 },
];

// ============================================
// Available Sections
// ============================================

const AVAILABLE_SECTIONS = [
  "Hero",
  "Features",
  "Testimonials",
  "Pricing",
  "FAQ",
  "Stats",
  "Team",
  "Gallery",
  "ContactForm",
  "Newsletter",
  "LogoCloud",
  "Video",
  "CTA",
];

// ============================================
// Component
// ============================================

export function AIGenerationWizard({
  isOpen,
  onClose,
  onGenerate,
  className,
}: AIGenerationWizardProps) {
  const [state, setState] = useState<WizardState>(INITIAL_STATE);

  // Update state helper
  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Navigation
  const nextStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.min(prev.step + 1, 4) }));
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.max(prev.step - 1, 1) }));
  }, []);

  // Generate page
  const handleGenerate = useCallback(async () => {
    updateState({ isGenerating: true, error: null });

    try {
      const context: PageGenerationContext = {
        description: state.businessDescription,
        industry: state.industry || undefined,
        style: state.style || undefined,
        tone: state.tone,
        targetAudience: state.targetAudience || undefined,
        sections:
          state.customSections.length > 0
            ? state.customSections
            : state.template
            ? PAGE_TEMPLATES[state.template].sections
            : undefined,
        colorScheme: {
          primary: state.primaryColor,
        },
        existingBranding: {
          companyName: state.companyName || undefined,
          tagline: state.tagline || undefined,
        },
      };

      const response = await fetch("/api/editor/ai/generate-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(context),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Generation failed");
      }

      updateState({ generatedData: result.data, isGenerating: false });
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : "Generation failed",
        isGenerating: false,
      });
    }
  }, [state, updateState]);

  // Apply generated data
  const handleApply = useCallback(() => {
    if (state.generatedData) {
      onGenerate(state.generatedData);
      onClose();
      setState(INITIAL_STATE);
    }
  }, [state.generatedData, onGenerate, onClose]);

  // Reset wizard
  const handleReset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // Toggle section selection
  const toggleSection = useCallback((section: string) => {
    setState((prev) => ({
      ...prev,
      customSections: prev.customSections.includes(section)
        ? prev.customSections.filter((s) => s !== section)
        : [...prev.customSections, section],
    }));
  }, []);

  // Apply template sections
  const applyTemplate = useCallback((template: PageTemplateType) => {
    updateState({
      template,
      customSections: [...PAGE_TEMPLATES[template].sections],
    });
  }, [updateState]);

  // Close handler
  const handleClose = useCallback(() => {
    onClose();
    setState(INITIAL_STATE);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={cn("w-full max-w-2xl mx-4", className)}
        >
          <Card className="shadow-2xl">
            {/* Header */}
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>AI Page Generator</CardTitle>
                    <CardDescription>
                      Create a complete page with AI assistance
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-between mt-6">
                {STEPS.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors",
                        state.step === step.number
                          ? "bg-primary text-primary-foreground"
                          : state.step > step.number
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {state.step > step.number ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <step.icon className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium hidden sm:inline">
                        {step.title}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={cn(
                          "w-8 sm:w-12 h-0.5 mx-1",
                          state.step > step.number
                            ? "bg-primary"
                            : "bg-muted"
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <AnimatePresence mode="wait">
                {/* Step 1: Business Info */}
                {state.step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="businessDescription">
                        Describe your business *
                      </Label>
                      <Textarea
                        id="businessDescription"
                        placeholder="e.g., A modern fitness studio offering yoga, pilates, and strength training classes..."
                        value={state.businessDescription}
                        onChange={(e) =>
                          updateState({ businessDescription: e.target.value })
                        }
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          placeholder="Acme Inc."
                          value={state.companyName}
                          onChange={(e) =>
                            updateState({ companyName: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tagline">Tagline</Label>
                        <Input
                          id="tagline"
                          placeholder="Your success, our mission"
                          value={state.tagline}
                          onChange={(e) =>
                            updateState({ tagline: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(Object.keys(INDUSTRY_PRESETS) as IndustryPresetType[]).map(
                          (key) => (
                            <Button
                              key={key}
                              variant={state.industry === key ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateState({ industry: key })}
                              className="h-auto py-2 justify-start"
                            >
                              {INDUSTRY_PRESETS[key].name}
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Style & Tone */}
                {state.step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-3">
                      <Label>Design Style</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {(Object.keys(STYLE_PRESETS) as StylePresetType[]).map(
                          (key) => (
                            <Card
                              key={key}
                              className={cn(
                                "cursor-pointer transition-all hover:shadow-md",
                                state.style === key &&
                                  "ring-2 ring-primary"
                              )}
                              onClick={() => updateState({ style: key })}
                            >
                              <CardContent className="p-3">
                                <p className="font-medium text-sm">
                                  {STYLE_PRESETS[key].name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {STYLE_PRESETS[key].description}
                                </p>
                              </CardContent>
                            </Card>
                          )
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Tone of Voice</Label>
                      <RadioGroup
                        value={state.tone || ""}
                        onValueChange={(v) =>
                          updateState({ tone: v as WizardState["tone"] })
                        }
                        className="flex flex-wrap gap-3"
                      >
                        {["professional", "friendly", "casual", "luxury", "technical"].map(
                          (tone) => (
                            <div key={tone} className="flex items-center">
                              <RadioGroupItem value={tone} id={tone} className="peer sr-only" />
                              <Label
                                htmlFor={tone}
                                className="px-3 py-1.5 rounded-full border cursor-pointer transition-colors peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary capitalize"
                              >
                                {tone}
                              </Label>
                            </div>
                          )
                        )}
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={state.primaryColor}
                          onChange={(e) =>
                            updateState({ primaryColor: e.target.value })
                          }
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={state.primaryColor}
                          onChange={(e) =>
                            updateState({ primaryColor: e.target.value })
                          }
                          className="flex-1"
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Content & Sections */}
                {state.step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-3">
                      <Label>Page Template</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {(Object.keys(PAGE_TEMPLATES) as PageTemplateType[]).map(
                          (key) => (
                            <Card
                              key={key}
                              className={cn(
                                "cursor-pointer transition-all hover:shadow-md",
                                state.template === key &&
                                  "ring-2 ring-primary"
                              )}
                              onClick={() => applyTemplate(key)}
                            >
                              <CardContent className="p-3">
                                <p className="font-medium text-sm">
                                  {PAGE_TEMPLATES[key].name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {PAGE_TEMPLATES[key].description}
                                </p>
                              </CardContent>
                            </Card>
                          )
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Sections</Label>
                        {state.customSections.length > 0 && (
                          <Badge variant="secondary">
                            {state.customSections.length} selected
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_SECTIONS.map((section) => (
                          <div
                            key={section}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={section}
                              checked={state.customSections.includes(section)}
                              onCheckedChange={() => toggleSection(section)}
                            />
                            <Label
                              htmlFor={section}
                              className="text-sm cursor-pointer"
                            >
                              {section}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetAudience">Target Audience</Label>
                      <Input
                        id="targetAudience"
                        placeholder="e.g., Small business owners aged 30-50"
                        value={state.targetAudience}
                        onChange={(e) =>
                          updateState({ targetAudience: e.target.value })
                        }
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Review & Generate */}
                {state.step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {!state.isGenerating && !state.generatedData && !state.error && (
                      <>
                        <div className="rounded-lg border p-4 space-y-3">
                          <h4 className="font-medium">Summary</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Industry:</span>{" "}
                              {state.industry
                                ? INDUSTRY_PRESETS[state.industry].name
                                : "Not specified"}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Style:</span>{" "}
                              {state.style
                                ? STYLE_PRESETS[state.style].name
                                : "Not specified"}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Tone:</span>{" "}
                              <span className="capitalize">{state.tone || "Not specified"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Sections:</span>{" "}
                              {state.customSections.length || "Auto"}
                            </div>
                          </div>
                          {state.businessDescription && (
                            <div className="pt-2 border-t">
                              <span className="text-sm text-muted-foreground">Description:</span>
                              <p className="text-sm mt-1">{state.businessDescription}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-center">
                          <Button
                            size="lg"
                            onClick={handleGenerate}
                            disabled={!state.businessDescription.trim()}
                            className="gap-2"
                          >
                            <Wand2 className="h-5 w-5" />
                            Generate Page
                          </Button>
                        </div>
                      </>
                    )}

                    {state.isGenerating && (
                      <div className="text-center py-8">
                        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                        <p className="mt-4 font-medium">Generating your page...</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          This may take a moment
                        </p>
                      </div>
                    )}

                    {state.generatedData && !state.isGenerating && (
                      <div className="text-center py-4">
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                          <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <h4 className="font-medium mt-4">Page Generated!</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {state.generatedData.content?.length || 0} components created
                        </p>
                        <div className="flex gap-3 justify-center mt-6">
                          <Button
                            variant="outline"
                            onClick={() =>
                              updateState({ generatedData: null })
                            }
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate
                          </Button>
                          <Button onClick={handleApply}>
                            Apply to Page
                          </Button>
                        </div>
                      </div>
                    )}

                    {state.error && (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                          <X className="h-8 w-8 text-destructive" />
                        </div>
                        <h4 className="font-medium mt-4">Generation Failed</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {state.error}
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => updateState({ error: null })}
                          className="mt-4"
                        >
                          Try Again
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>

            {/* Footer Navigation */}
            {state.step < 4 || (!state.isGenerating && !state.generatedData) ? (
              <CardFooter className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={state.step === 1 ? handleClose : prevStep}
                >
                  {state.step === 1 ? "Cancel" : (
                    <>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </>
                  )}
                </Button>
                {state.step < 4 && (
                  <Button
                    onClick={nextStep}
                    disabled={state.step === 1 && !state.businessDescription.trim()}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </CardFooter>
            ) : null}
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
