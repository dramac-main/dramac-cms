"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StepBusinessInfo } from "./steps/step-business-info";
import { StepIndustry } from "./steps/step-industry";
import { StepStyle } from "./steps/step-style";
import { StepSections } from "./steps/step-sections";
import { StepReview } from "./steps/step-review";
import { StepGenerating } from "./steps/step-generating";
import type { BuilderFormData } from "./types";

// Re-export for backwards compatibility
export type { BuilderFormData } from "./types";

interface SiteWithPages {
  id: string;
  name: string | null;
  pages?: {
    id: string;
    name: string;
    slug: string;
    is_homepage: boolean | null;
  }[];
}

interface AIBuilderWizardProps {
  site: SiteWithPages;
}

const steps = [
  { id: "business", title: "Business Info", description: "Tell us about your business" },
  { id: "industry", title: "Industry", description: "Select your industry" },
  { id: "style", title: "Style", description: "Choose your look and feel" },
  { id: "sections", title: "Sections", description: "Pick your page sections" },
  { id: "review", title: "Review", description: "Confirm your choices" },
  { id: "generating", title: "Generating", description: "Creating your website" },
];

export function AIBuilderWizard({ site }: AIBuilderWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState("");
  
  const [formData, setFormData] = useState<BuilderFormData>({
    businessName: site.name || "",
    businessDescription: "",
    targetAudience: "",
    industryId: "",
    tone: "professional",
    colorPreference: "",
    sections: ["hero", "navbar", "features", "about", "testimonials", "cta", "footer"],
    additionalInfo: "",
  });

  const updateFormData = (updates: Partial<BuilderFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Business Info
        return formData.businessDescription.length >= 20;
      case 1: // Industry
        return !!formData.industryId;
      case 2: // Style
        return !!formData.tone;
      case 3: // Sections
        return formData.sections.length >= 3;
      case 4: // Review
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 2) {
      setCurrentStep((prev) => prev + 1);
    } else if (currentStep === 4) {
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleGenerate = async () => {
    setCurrentStep(5); // Move to generating step
    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 500);

    const statusMessages = [
      "Analyzing your business...",
      "Selecting optimal layout...",
      "Generating content...",
      "Creating visual design...",
      "Polishing final touches...",
    ];

    let statusIndex = 0;
    const statusInterval = setInterval(() => {
      if (statusIndex < statusMessages.length) {
        setGenerationStatus(statusMessages[statusIndex]);
        statusIndex++;
      }
    }, 1500);

    try {
      // Find homepage ID
      const homepage = site.pages?.find((p) => p.is_homepage);
      const pageId = homepage?.id || site.pages?.[0]?.id;

      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessDescription: formData.businessDescription,
          industryId: formData.industryId,
          tone: formData.tone,
          targetAudience: formData.targetAudience,
          sections: formData.sections,
          colorPreference: formData.colorPreference,
          siteId: site.id,
          pageId,
        }),
      });

      clearInterval(progressInterval);
      clearInterval(statusInterval);

      if (!response.ok) {
        throw new Error("Generation failed");
      }

      await response.json();
      
      setGenerationProgress(100);
      setGenerationStatus("Website generated successfully!");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Your website has been generated!");
      router.push(`/dashboard/sites/${site.id}/editor`);
    } catch (error) {
      clearInterval(progressInterval);
      clearInterval(statusInterval);
      
      console.error("Generation error:", error);
      toast.error("Failed to generate website. Please try again.");
      setCurrentStep(4); // Go back to review
      setIsGenerating(false);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">AI Website Builder</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Create Your Website</h1>
        <p className="text-muted-foreground">
          Answer a few questions and let AI build your perfect website
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">{steps[currentStep].title}</span>
          <span className="text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps Indicator */}
      <div className="flex justify-between mb-8 overflow-x-auto">
        {steps.slice(0, -1).map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center ${index < steps.length - 2 ? "flex-1" : ""}`}
          >
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                index < currentStep
                  ? "bg-primary text-primary-foreground"
                  : index === currentStep
                  ? "bg-primary/20 text-primary border-2 border-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index < currentStep ? (
                <Check className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            {index < steps.length - 2 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  index < currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-card rounded-xl border shadow-sm p-6 mb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 0 && (
              <StepBusinessInfo
                data={formData}
                onUpdate={updateFormData}
              />
            )}
            {currentStep === 1 && (
              <StepIndustry
                data={formData}
                onUpdate={updateFormData}
              />
            )}
            {currentStep === 2 && (
              <StepStyle
                data={formData}
                onUpdate={updateFormData}
              />
            )}
            {currentStep === 3 && (
              <StepSections
                data={formData}
                onUpdate={updateFormData}
              />
            )}
            {currentStep === 4 && (
              <StepReview data={formData} />
            )}
            {currentStep === 5 && (
              <StepGenerating
                progress={generationProgress}
                status={generationStatus}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {currentStep < 5 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isGenerating}
          >
            {currentStep === 4 ? (
              <>
                Generate Website
                <Sparkles className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
