# Phase 50: AI Builder - Complete Integration

> **AI Model**: Claude Opus 4.5 (2x)
>
> **⚠️ FIRST**: Read `PHASE-46-REMEDIATION-MASTER-PLAN.md`

---

## 🎯 Objective

Create a complete AI-powered website builder flow that allows users to describe their business and generate a full website automatically.

---

## 📋 Prerequisites

- [ ] Phase 49 completed
- [ ] Visual Editor working
- [ ] AI API endpoint functional

---

## ✅ Tasks

### Task 50.1: AI Builder Page

**File: `src/app/(dashboard)/sites/[siteId]/builder/page.tsx`**

```tsx
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSite } from "@/lib/actions/sites";
import { AIBuilderWizard } from "@/components/ai-builder/ai-builder-wizard";

interface BuilderPageProps {
  params: Promise<{ siteId: string }>;
}

export const metadata: Metadata = {
  title: "AI Website Builder | DRAMAC",
  description: "Generate your website with AI",
};

export default async function BuilderPage({ params }: BuilderPageProps) {
  const { siteId } = await params;
  const site = await getSite(siteId);

  if (!site) {
    notFound();
  }

  // If site already has content, redirect to editor
  // User can regenerate from there if needed
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <AIBuilderWizard site={site} />
    </div>
  );
}
```

### Task 50.2: AI Builder Wizard Component

**File: `src/components/ai-builder/ai-builder-wizard.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StepBusinessInfo } from "./steps/step-business-info";
import { StepIndustry } from "./steps/step-industry";
import { StepStyle } from "./steps/step-style";
import { StepSections } from "./steps/step-sections";
import { StepReview } from "./steps/step-review";
import { StepGenerating } from "./steps/step-generating";
import type { Site } from "@/types/site";

interface AIBuilderWizardProps {
  site: Site;
}

export interface BuilderFormData {
  businessName: string;
  businessDescription: string;
  targetAudience: string;
  industryId: string;
  tone: "professional" | "friendly" | "luxury" | "playful";
  colorPreference: string;
  sections: string[];
  additionalInfo: string;
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
    sections: ["hero", "features", "about", "testimonials", "cta", "footer"],
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
          pageId: site.pages?.[0]?.id, // Homepage
        }),
      });

      clearInterval(progressInterval);
      clearInterval(statusInterval);

      if (!response.ok) {
        throw new Error("Generation failed");
      }

      const result = await response.json();
      
      setGenerationProgress(100);
      setGenerationStatus("Website generated successfully!");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Your website has been generated!");
      router.push(`/editor/${site.id}`);
    } catch (error) {
      clearInterval(progressInterval);
      clearInterval(statusInterval);
      
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
            disabled={!canProceed()}
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
```

### Task 50.3: Business Info Step

**File: `src/components/ai-builder/steps/step-business-info.tsx`**

```tsx
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BuilderFormData } from "../ai-builder-wizard";

interface StepBusinessInfoProps {
  data: BuilderFormData;
  onUpdate: (updates: Partial<BuilderFormData>) => void;
}

export function StepBusinessInfo({ data, onUpdate }: StepBusinessInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Tell us about your business</h2>
        <p className="text-muted-foreground">
          The more detail you provide, the better your website will match your vision.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name</Label>
          <Input
            id="businessName"
            value={data.businessName}
            onChange={(e) => onUpdate({ businessName: e.target.value })}
            placeholder="e.g., Acme Web Design"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessDescription">
            What does your business do? *
            <span className="text-muted-foreground font-normal ml-2">
              (minimum 20 characters)
            </span>
          </Label>
          <Textarea
            id="businessDescription"
            value={data.businessDescription}
            onChange={(e) => onUpdate({ businessDescription: e.target.value })}
            placeholder="Describe your business, products, or services. For example: We are a digital marketing agency that helps small businesses grow their online presence through social media management, SEO, and paid advertising campaigns."
            rows={5}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {data.businessDescription.length}/20 characters minimum
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAudience">Who is your target audience?</Label>
          <Input
            id="targetAudience"
            value={data.targetAudience}
            onChange={(e) => onUpdate({ targetAudience: e.target.value })}
            placeholder="e.g., Small business owners, tech startups, local restaurants"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalInfo">
            Any additional information? (optional)
          </Label>
          <Textarea
            id="additionalInfo"
            value={data.additionalInfo}
            onChange={(e) => onUpdate({ additionalInfo: e.target.value })}
            placeholder="Special features, unique selling points, specific requirements..."
            rows={3}
            className="resize-none"
          />
        </div>
      </div>
    </div>
  );
}
```

### Task 50.4: Industry Selection Step

**File: `src/components/ai-builder/steps/step-industry.tsx`**

```tsx
import { cn } from "@/lib/utils";
import {
  Building2,
  ShoppingBag,
  Utensils,
  Heart,
  GraduationCap,
  Briefcase,
  Camera,
  Palette,
  Hammer,
  Plane,
  Dumbbell,
  Music,
} from "lucide-react";
import type { BuilderFormData } from "../ai-builder-wizard";

interface StepIndustryProps {
  data: BuilderFormData;
  onUpdate: (updates: Partial<BuilderFormData>) => void;
}

const industries = [
  { id: "business-services", name: "Business Services", icon: Briefcase },
  { id: "ecommerce", name: "E-Commerce", icon: ShoppingBag },
  { id: "restaurant", name: "Restaurant & Food", icon: Utensils },
  { id: "healthcare", name: "Healthcare", icon: Heart },
  { id: "education", name: "Education", icon: GraduationCap },
  { id: "real-estate", name: "Real Estate", icon: Building2 },
  { id: "photography", name: "Photography", icon: Camera },
  { id: "creative", name: "Creative Agency", icon: Palette },
  { id: "construction", name: "Construction", icon: Hammer },
  { id: "travel", name: "Travel & Tourism", icon: Plane },
  { id: "fitness", name: "Fitness & Wellness", icon: Dumbbell },
  { id: "entertainment", name: "Entertainment", icon: Music },
];

export function StepIndustry({ data, onUpdate }: StepIndustryProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Select your industry</h2>
        <p className="text-muted-foreground">
          This helps us choose the right layout and content style for your business.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {industries.map((industry) => {
          const Icon = industry.icon;
          const isSelected = data.industryId === industry.id;

          return (
            <button
              key={industry.id}
              onClick={() => onUpdate({ industryId: industry.id })}
              className={cn(
                "flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-accent"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-center">
                {industry.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

### Task 50.5: Style Selection Step

**File: `src/components/ai-builder/steps/step-style.tsx`**

```tsx
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import type { BuilderFormData } from "../ai-builder-wizard";

interface StepStyleProps {
  data: BuilderFormData;
  onUpdate: (updates: Partial<BuilderFormData>) => void;
}

const tones = [
  {
    id: "professional",
    name: "Professional",
    description: "Clean, trustworthy, corporate feel",
    colors: ["#1e40af", "#3b82f6", "#f8fafc"],
  },
  {
    id: "friendly",
    name: "Friendly",
    description: "Warm, approachable, welcoming",
    colors: ["#059669", "#34d399", "#fef3c7"],
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Elegant, sophisticated, premium",
    colors: ["#1f2937", "#d4af37", "#fafaf9"],
  },
  {
    id: "playful",
    name: "Playful",
    description: "Fun, energetic, creative",
    colors: ["#7c3aed", "#f472b6", "#fef9c3"],
  },
];

const colorSchemes = [
  { id: "blue", colors: ["#1e40af", "#3b82f6", "#93c5fd"] },
  { id: "green", colors: ["#166534", "#22c55e", "#86efac"] },
  { id: "purple", colors: ["#6b21a8", "#a855f7", "#d8b4fe"] },
  { id: "orange", colors: ["#c2410c", "#f97316", "#fed7aa"] },
  { id: "pink", colors: ["#9d174d", "#ec4899", "#f9a8d4"] },
  { id: "teal", colors: ["#115e59", "#14b8a6", "#5eead4"] },
];

export function StepStyle({ data, onUpdate }: StepStyleProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-2">Choose your style</h2>
        <p className="text-muted-foreground">
          Select the tone and color scheme that best represents your brand.
        </p>
      </div>

      {/* Tone Selection */}
      <div className="space-y-4">
        <Label>Brand Tone</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tones.map((tone) => {
            const isSelected = data.tone === tone.id;

            return (
              <button
                key={tone.id}
                onClick={() => onUpdate({ tone: tone.id as BuilderFormData["tone"] })}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex gap-1 shrink-0">
                  {tone.colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div>
                  <p className="font-medium">{tone.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {tone.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Preference */}
      <div className="space-y-4">
        <Label>Color Preference (optional)</Label>
        <div className="flex flex-wrap gap-4">
          {colorSchemes.map((scheme) => {
            const isSelected = data.colorPreference === scheme.id;

            return (
              <button
                key={scheme.id}
                onClick={() =>
                  onUpdate({
                    colorPreference: isSelected ? "" : scheme.id,
                  })
                }
                className={cn(
                  "flex gap-1 p-2 rounded-lg border-2 transition-all",
                  isSelected
                    ? "border-primary"
                    : "border-transparent hover:border-primary/50"
                )}
              >
                {scheme.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Leave empty to let AI choose based on your industry and tone.
        </p>
      </div>
    </div>
  );
}
```

### Task 50.6: Sections Selection Step

**File: `src/components/ai-builder/steps/step-sections.tsx`**

```tsx
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Star,
  Layout,
  Users,
  MessageSquare,
  Megaphone,
  Menu,
  FileText,
  MapPin,
  Phone,
  Image,
  Video,
  Award,
} from "lucide-react";
import type { BuilderFormData } from "../ai-builder-wizard";

interface StepSectionsProps {
  data: BuilderFormData;
  onUpdate: (updates: Partial<BuilderFormData>) => void;
}

const availableSections = [
  { id: "hero", name: "Hero Section", icon: Star, required: true, description: "Main banner with headline and CTA" },
  { id: "navbar", name: "Navigation", icon: Menu, required: true, description: "Site navigation menu" },
  { id: "about", name: "About Us", icon: Users, description: "Tell your story" },
  { id: "features", name: "Features/Services", icon: Layout, description: "Highlight what you offer" },
  { id: "testimonials", name: "Testimonials", icon: MessageSquare, description: "Customer reviews and quotes" },
  { id: "cta", name: "Call to Action", icon: Megaphone, description: "Encourage user action" },
  { id: "gallery", name: "Image Gallery", icon: Image, description: "Showcase your work" },
  { id: "video", name: "Video Section", icon: Video, description: "Embed a video" },
  { id: "team", name: "Team Members", icon: Users, description: "Introduce your team" },
  { id: "pricing", name: "Pricing", icon: Award, description: "Display your pricing plans" },
  { id: "contact", name: "Contact Form", icon: Phone, description: "Let visitors reach you" },
  { id: "map", name: "Location Map", icon: MapPin, description: "Show your location" },
  { id: "footer", name: "Footer", icon: FileText, required: true, description: "Site footer with links" },
];

export function StepSections({ data, onUpdate }: StepSectionsProps) {
  const toggleSection = (sectionId: string) => {
    const section = availableSections.find((s) => s.id === sectionId);
    if (section?.required) return; // Can't toggle required sections

    const newSections = data.sections.includes(sectionId)
      ? data.sections.filter((id) => id !== sectionId)
      : [...data.sections, sectionId];
    
    onUpdate({ sections: newSections });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Choose your sections</h2>
        <p className="text-muted-foreground">
          Select the sections you want on your homepage. Required sections are pre-selected.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableSections.map((section) => {
          const Icon = section.icon;
          const isSelected = data.sections.includes(section.id);
          const isRequired = section.required;

          return (
            <button
              key={section.id}
              onClick={() => toggleSection(section.id)}
              disabled={isRequired}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
                isRequired && "opacity-80 cursor-not-allowed"
              )}
            >
              <Checkbox
                checked={isSelected}
                disabled={isRequired}
                className="mt-0.5"
              />
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  isSelected ? "bg-primary/20 text-primary" : "bg-muted"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Label className="font-medium cursor-pointer">
                    {section.name}
                  </Label>
                  {isRequired && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        Selected: {data.sections.length} sections (minimum 3 required)
      </p>
    </div>
  );
}
```

### Task 50.7: Review Step

**File: `src/components/ai-builder/steps/step-review.tsx`**

```tsx
import { Check } from "lucide-react";
import type { BuilderFormData } from "../ai-builder-wizard";

interface StepReviewProps {
  data: BuilderFormData;
}

export function StepReview({ data }: StepReviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Review your choices</h2>
        <p className="text-muted-foreground">
          Make sure everything looks correct before generating your website.
        </p>
      </div>

      <div className="space-y-4">
        <ReviewItem
          label="Business Name"
          value={data.businessName || "Not specified"}
        />
        <ReviewItem
          label="Business Description"
          value={data.businessDescription}
        />
        <ReviewItem
          label="Target Audience"
          value={data.targetAudience || "Not specified"}
        />
        <ReviewItem
          label="Industry"
          value={data.industryId.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
        />
        <ReviewItem
          label="Tone"
          value={data.tone.charAt(0).toUpperCase() + data.tone.slice(1)}
        />
        <ReviewItem
          label="Color Preference"
          value={data.colorPreference || "AI will choose"}
        />
        <ReviewItem
          label="Sections"
          value={`${data.sections.length} sections selected`}
        />
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-center gap-2 text-primary mb-2">
          <Check className="w-5 h-5" />
          <span className="font-medium">Ready to generate!</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Click "Generate Website" below to create your AI-powered website.
          This usually takes about 30-60 seconds.
        </p>
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start border-b pb-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium max-w-[60%]">{value}</span>
    </div>
  );
}
```

### Task 50.8: Generating Step

**File: `src/components/ai-builder/steps/step-generating.tsx`**

```tsx
import { Sparkles, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StepGeneratingProps {
  progress: number;
  status: string;
}

export function StepGenerating({ progress, status }: StepGeneratingProps) {
  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        {progress >= 100 ? (
          <Sparkles className="w-10 h-10 text-primary animate-pulse" />
        ) : (
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        )}
      </div>

      <h2 className="text-2xl font-semibold mb-2">
        {progress >= 100 ? "Website Generated!" : "Creating Your Website"}
      </h2>
      
      <p className="text-muted-foreground mb-8">{status}</p>

      <div className="max-w-md mx-auto">
        <Progress value={progress} className="h-2 mb-2" />
        <p className="text-sm text-muted-foreground">{Math.round(progress)}%</p>
      </div>

      {progress < 100 && (
        <p className="text-sm text-muted-foreground mt-8">
          This usually takes 30-60 seconds. Please don't close this page.
        </p>
      )}
    </div>
  );
}
```

### Task 50.9: Install Dependencies

```bash
pnpm add framer-motion
```

---

## 🧪 Testing Checklist

After implementing this phase, verify:

- [ ] Builder page loads for new sites
- [ ] Step 1 (Business Info) validates minimum text
- [ ] Step 2 (Industry) allows selection
- [ ] Step 3 (Style) allows tone and color selection
- [ ] Step 4 (Sections) allows toggling sections
- [ ] Step 5 (Review) shows all selections
- [ ] Generate button triggers API call
- [ ] Progress indicator updates during generation
- [ ] Successful generation redirects to editor
- [ ] Error during generation shows message and allows retry
- [ ] Generated content appears in editor

---

## 📝 Notes

- The wizard uses step-based navigation for clear UX
- framer-motion provides smooth step transitions
- Progress simulation keeps users engaged during API call
- All form data is collected before single API call
- Generated content is saved to page_content table
