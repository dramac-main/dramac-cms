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
