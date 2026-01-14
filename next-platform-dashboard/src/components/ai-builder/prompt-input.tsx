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
