/**
 * LP Template Picker
 * Phase LPB-02 + LPB-09: Studio LP Editor + AI Generator
 *
 * Dialog for selecting a template when creating a new landing page.
 * Shows template thumbnails grouped by category, "Start from Scratch",
 * and AI-powered landing page generation.
 */
"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileText, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { LP_TEMPLATE_CATEGORIES } from "../../lib/lp-builder-constants";
import { getLPTemplates } from "../../actions/lp-builder-actions";
import type { LPTemplate } from "../../types/lp-builder-types";

// ─── Types ─────────────────────────────────────────────────────

interface LPTemplatePickerProps {
  open: boolean;
  siteId: string;
  onSelect: (template: LPTemplate) => void;
  onBlank: () => void;
  onCancel: () => void;
  /** Called when AI generates an LP — receives the processed output */
  onAIGenerated?: (result: {
    title: string;
    slug: string;
    description: string;
    contentStudio: unknown[];
    conversionGoal: string;
    showHeader: boolean;
    showFooter: boolean;
  }) => void;
}

// ─── AI Generation Categories ──────────────────────────────────

const AI_CATEGORIES = [
  { value: "saas", label: "SaaS / Software" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "agency", label: "Agency / Consulting" },
  { value: "education", label: "Education / Course" },
  { value: "event", label: "Event / Webinar" },
  { value: "real-estate", label: "Real Estate" },
  { value: "health", label: "Health & Wellness" },
  { value: "finance", label: "Finance / Fintech" },
  { value: "other", label: "Other" },
];

// ─── Component ─────────────────────────────────────────────────

export function LPTemplatePicker({
  open,
  siteId,
  onSelect,
  onBlank,
  onCancel,
  onAIGenerated,
}: LPTemplatePickerProps) {
  const [templates, setTemplates] = useState<LPTemplate[]>([]);
  const [isLoading, startTransition] = useTransition();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loaded, setLoaded] = useState(false);
  const [pickerTab, setPickerTab] = useState<"templates" | "ai">("templates");

  // AI generation state
  const [aiDescription, setAiDescription] = useState("");
  const [aiCategory, setAiCategory] = useState("other");
  const [aiPrefs, setAiPrefs] = useState({
    includeTestimonials: true,
    includePricing: false,
    includeCountdown: false,
    includeTrustBadges: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Load templates when dialog opens
  useEffect(() => {
    if (open && !loaded) {
      startTransition(async () => {
        try {
          const result = await getLPTemplates(siteId);
          setTemplates(result || []);
          setLoaded(true);
        } catch (err) {
          console.error("[LPTemplatePicker] Failed to load templates:", err);
          setLoaded(true);
        }
      });
    }
  }, [open, siteId, loaded]);

  const filteredTemplates =
    activeCategory === "all"
      ? templates
      : templates.filter((t) => t.category === activeCategory);

  // Categories that actually have templates
  const usedCategories = new Set(templates.map((t) => t.category));
  const availableCategories = LP_TEMPLATE_CATEGORIES.filter((c) =>
    usedCategories.has(c.id),
  );

  // AI generation handler
  const handleAIGenerate = useCallback(async () => {
    if (!aiDescription.trim()) {
      toast.error("Please describe your landing page");
      return;
    }
    if (!onAIGenerated) {
      toast.error("AI generation not configured");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/marketing/lp/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: aiDescription.trim(),
          category: aiCategory,
          preferences: aiPrefs,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Generation failed (${res.status})`);
      }

      const data = await res.json();
      if (!data.success || !data.landingPage) {
        throw new Error("Invalid response from AI");
      }

      toast.success("Landing page generated!");
      onAIGenerated(data.landingPage);
    } catch (error) {
      console.error("[AI Generate] Error:", error);
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }, [aiDescription, aiCategory, aiPrefs, onAIGenerated]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
          <DialogDescription>
            Start with a template, blank canvas, or generate with AI
          </DialogDescription>
        </DialogHeader>

        {/* Top-level picker tabs: Templates vs AI */}
        <Tabs
          value={pickerTab}
          onValueChange={(v) => setPickerTab(v as "templates" | "ai")}
          className="flex-1 min-h-0 flex flex-col"
        >
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="templates" className="text-sm">
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-sm">
              <Wand2 className="mr-1.5 h-3.5 w-3.5" />
              AI Generate
            </TabsTrigger>
          </TabsList>

          {/* ─── Templates Tab ─── */}
          <TabsContent
            value="templates"
            className="flex-1 min-h-0 mt-3 space-y-3"
          >
            {/* Start from Scratch */}
            <Card
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={onBlank}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Start from Scratch</p>
                  <p className="text-xs text-muted-foreground">
                    Blank canvas with a default hero section
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Create Blank
                </Button>
              </CardContent>
            </Card>

            {/* Template Categories & Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading templates...
                </span>
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No templates available yet. Start from scratch!
                </p>
              </div>
            ) : (
              <Tabs
                value={activeCategory}
                onValueChange={setActiveCategory}
                className="flex-1 min-h-0"
              >
                <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1">
                  <TabsTrigger value="all" className="text-xs">
                    All ({templates.length})
                  </TabsTrigger>
                  {availableCategories.map((cat) => (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="text-xs"
                    >
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <ScrollArea className="flex-1 mt-3">
                  <div className="grid grid-cols-2 gap-3 pb-4">
                    {filteredTemplates.map((template) => (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:border-primary/50 transition-colors group"
                        onClick={() => onSelect(template)}
                      >
                        <CardContent className="p-3">
                          <div className="aspect-[16/10] rounded-md bg-muted mb-2 flex items-center justify-center overflow-hidden">
                            {template.thumbnailUrl ? (
                              <img
                                src={template.thumbnailUrl}
                                alt={template.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FileText className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium truncate">
                              {template.name}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {template.description}
                            </p>
                            <div className="flex items-center justify-between pt-1">
                              <Badge variant="secondary" className="text-xs">
                                {LP_TEMPLATE_CATEGORIES.find(
                                  (c) => c.id === template.category,
                                )?.label || template.category}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Use Template
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </Tabs>
            )}
          </TabsContent>

          {/* ─── AI Generate Tab ─── */}
          <TabsContent value="ai" className="flex-1 min-h-0 mt-3">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-description">
                  Describe your landing page
                </Label>
                <Textarea
                  id="ai-description"
                  placeholder="e.g. A landing page for a SaaS project management tool targeting small businesses, with a free trial offer and customer testimonials..."
                  className="min-h-[100px] resize-none"
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  disabled={isGenerating}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground">
                  {aiDescription.length}/1000 — Be specific about your product,
                  audience, and offer.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Industry / Category</Label>
                <Select
                  value={aiCategory}
                  onValueChange={setAiCategory}
                  disabled={isGenerating}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Include Sections</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      key: "includeTestimonials" as const,
                      label: "Testimonials",
                    },
                    { key: "includePricing" as const, label: "Pricing Table" },
                    {
                      key: "includeCountdown" as const,
                      label: "Countdown Timer",
                    },
                    {
                      key: "includeTrustBadges" as const,
                      label: "Trust Badges",
                    },
                  ].map((opt) => (
                    <div key={opt.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`ai-pref-${opt.key}`}
                        checked={aiPrefs[opt.key]}
                        onCheckedChange={(checked) =>
                          setAiPrefs((p) => ({
                            ...p,
                            [opt.key]: !!checked,
                          }))
                        }
                        disabled={isGenerating}
                      />
                      <label
                        htmlFor={`ai-pref-${opt.key}`}
                        className="text-sm leading-none"
                      >
                        {opt.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleAIGenerate}
                disabled={isGenerating || !aiDescription.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Landing Page
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                AI will create a complete landing page with components, copy,
                and layout. You can customize everything afterwards.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
