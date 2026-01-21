# Phase 25: AI Builder - Foundation

> **AI Model**: Claude Opus 4.5 (3x) ⭐ CRITICAL PHASE
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Build the AI-powered website generation system with prompt input, industry templates, and generation flow.

---

## 📋 Prerequisites

- [ ] Phase 1-24 completed
- [ ] Claude API key available
- [ ] Vercel AI SDK installed

---

## 📦 Install Dependencies

```bash
npm install ai @ai-sdk/anthropic
```

---

## ✅ Tasks

### Task 25.1: AI Configuration

**File: `src/lib/ai/config.ts`**

```typescript
import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Available models
export const AI_MODELS = {
  opus: "claude-sonnet-4-20250514",
  sonnet: "claude-sonnet-4-20250514",
  haiku: "claude-3-haiku-20240307",
} as const;

// Default model for site generation
export const DEFAULT_MODEL = AI_MODELS.sonnet;

// Generation settings
export const GENERATION_CONFIG = {
  maxTokens: 8192,
  temperature: 0.7,
};
```

### Task 25.2: Industry Templates

**File: `src/lib/ai/templates.ts`**

```typescript
export interface IndustryTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  suggestedSections: string[];
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  samplePrompt: string;
}

export const industryTemplates: IndustryTemplate[] = [
  {
    id: "agency",
    name: "Creative Agency",
    description: "Marketing, design, and creative agencies",
    icon: "Palette",
    suggestedSections: ["hero", "services", "portfolio", "team", "testimonials", "contact"],
    colorScheme: {
      primary: "#6366f1",
      secondary: "#0f172a",
      accent: "#f97316",
    },
    samplePrompt: "A modern creative agency specializing in brand identity and digital marketing",
  },
  {
    id: "saas",
    name: "SaaS Product",
    description: "Software as a service landing pages",
    icon: "Rocket",
    suggestedSections: ["hero", "features", "pricing", "testimonials", "faq", "cta"],
    colorScheme: {
      primary: "#0ea5e9",
      secondary: "#1e293b",
      accent: "#22c55e",
    },
    samplePrompt: "A project management tool that helps teams collaborate efficiently",
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Online stores and product showcases",
    icon: "ShoppingCart",
    suggestedSections: ["hero", "products", "features", "testimonials", "newsletter", "contact"],
    colorScheme: {
      primary: "#ec4899",
      secondary: "#0f172a",
      accent: "#eab308",
    },
    samplePrompt: "An online boutique selling handcrafted jewelry and accessories",
  },
  {
    id: "restaurant",
    name: "Restaurant",
    description: "Restaurants, cafes, and food businesses",
    icon: "UtensilsCrossed",
    suggestedSections: ["hero", "menu", "about", "gallery", "testimonials", "contact"],
    colorScheme: {
      primary: "#dc2626",
      secondary: "#1c1917",
      accent: "#fbbf24",
    },
    samplePrompt: "An Italian restaurant known for authentic pasta and cozy atmosphere",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description: "Personal portfolios and freelancers",
    icon: "User",
    suggestedSections: ["hero", "about", "skills", "projects", "testimonials", "contact"],
    colorScheme: {
      primary: "#8b5cf6",
      secondary: "#0f172a",
      accent: "#06b6d4",
    },
    samplePrompt: "A UI/UX designer showcasing mobile and web design projects",
  },
  {
    id: "healthcare",
    name: "Healthcare",
    description: "Medical practices and health services",
    icon: "HeartPulse",
    suggestedSections: ["hero", "services", "team", "testimonials", "faq", "contact"],
    colorScheme: {
      primary: "#14b8a6",
      secondary: "#0f172a",
      accent: "#3b82f6",
    },
    samplePrompt: "A family dental practice offering comprehensive dental care",
  },
  {
    id: "realestate",
    name: "Real Estate",
    description: "Property listings and real estate agencies",
    icon: "Home",
    suggestedSections: ["hero", "listings", "services", "team", "testimonials", "contact"],
    colorScheme: {
      primary: "#059669",
      secondary: "#1e293b",
      accent: "#f59e0b",
    },
    samplePrompt: "A luxury real estate agency specializing in waterfront properties",
  },
  {
    id: "fitness",
    name: "Fitness",
    description: "Gyms, trainers, and fitness centers",
    icon: "Dumbbell",
    suggestedSections: ["hero", "programs", "trainers", "pricing", "testimonials", "contact"],
    colorScheme: {
      primary: "#ef4444",
      secondary: "#0a0a0a",
      accent: "#fbbf24",
    },
    samplePrompt: "A high-intensity fitness studio offering personalized training",
  },
  {
    id: "education",
    name: "Education",
    description: "Schools, courses, and educational platforms",
    icon: "GraduationCap",
    suggestedSections: ["hero", "courses", "instructors", "testimonials", "faq", "contact"],
    colorScheme: {
      primary: "#2563eb",
      secondary: "#0f172a",
      accent: "#10b981",
    },
    samplePrompt: "An online coding bootcamp teaching full-stack development",
  },
  {
    id: "nonprofit",
    name: "Non-profit",
    description: "Charities and non-profit organizations",
    icon: "Heart",
    suggestedSections: ["hero", "mission", "impact", "team", "events", "donate"],
    colorScheme: {
      primary: "#7c3aed",
      secondary: "#0f172a",
      accent: "#f97316",
    },
    samplePrompt: "A wildlife conservation organization protecting endangered species",
  },
];

export function getTemplateById(id: string): IndustryTemplate | undefined {
  return industryTemplates.find((t) => t.id === id);
}
```

### Task 25.3: System Prompt Builder

**File: `src/lib/ai/prompts.ts`**

```typescript
import { IndustryTemplate } from "./templates";

export interface GenerationContext {
  businessDescription: string;
  industry?: IndustryTemplate;
  tone?: "professional" | "friendly" | "playful" | "luxurious" | "minimal";
  targetAudience?: string;
  sections?: string[];
  colorPreference?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
}

export function buildSystemPrompt(): string {
  return `You are an expert website designer and developer. Your task is to generate website content and structure based on user descriptions.

IMPORTANT RULES:
1. Generate valid JSON that matches the exact schema provided
2. Create compelling, professional copy for all text content
3. Use placeholder image URLs from picsum.photos with appropriate dimensions
4. Ensure color schemes are accessible and visually cohesive
5. Keep text concise but impactful - avoid generic filler content
6. Generate realistic business information (names, descriptions, etc.)

OUTPUT FORMAT:
Return ONLY valid JSON - no markdown, no explanations, no code blocks.
The JSON must match the WebsiteSchema exactly.`;
}

export function buildUserPrompt(context: GenerationContext): string {
  const parts: string[] = [];
  
  parts.push(`Create a website for the following business:`);
  parts.push(`Description: ${context.businessDescription}`);
  
  if (context.industry) {
    parts.push(`Industry: ${context.industry.name}`);
    parts.push(`Suggested sections: ${context.industry.suggestedSections.join(", ")}`);
  }
  
  if (context.tone) {
    parts.push(`Tone: ${context.tone}`);
  }
  
  if (context.targetAudience) {
    parts.push(`Target Audience: ${context.targetAudience}`);
  }
  
  if (context.sections?.length) {
    parts.push(`Required sections: ${context.sections.join(", ")}`);
  }
  
  if (context.colorPreference) {
    parts.push(`Color preferences: ${JSON.stringify(context.colorPreference)}`);
  }
  
  parts.push(`
Generate a complete website structure with the following JSON schema:

{
  "metadata": {
    "title": "string - SEO title",
    "description": "string - SEO description",
    "colors": {
      "primary": "string - hex color",
      "secondary": "string - hex color",
      "accent": "string - hex color"
    }
  },
  "sections": [
    {
      "type": "navigation" | "hero" | "features" | "testimonials" | "cta" | "contact" | "newsletter" | "footer",
      "props": { ... section-specific properties }
    }
  ]
}

Section types and their props:

NAVIGATION:
{
  "type": "navigation",
  "props": {
    "logoText": "string",
    "links": [{ "label": "string", "href": "string" }],
    "ctaText": "string",
    "ctaHref": "string"
  }
}

HERO:
{
  "type": "hero",
  "props": {
    "title": "string",
    "subtitle": "string",
    "primaryButtonText": "string",
    "secondaryButtonText": "string",
    "backgroundImage": "string - URL",
    "layout": "centered" | "left"
  }
}

FEATURES:
{
  "type": "features",
  "props": {
    "title": "string",
    "subtitle": "string",
    "features": [
      {
        "icon": "string - lucide icon name",
        "title": "string",
        "description": "string"
      }
    ]
  }
}

TESTIMONIALS:
{
  "type": "testimonials",
  "props": {
    "title": "string",
    "testimonials": [
      {
        "quote": "string",
        "author": "string",
        "role": "string",
        "avatar": "string - URL"
      }
    ]
  }
}

CTA:
{
  "type": "cta",
  "props": {
    "title": "string",
    "subtitle": "string",
    "primaryButtonText": "string",
    "secondaryButtonText": "string"
  }
}

CONTACT:
{
  "type": "contact",
  "props": {
    "title": "string",
    "subtitle": "string",
    "showName": true,
    "showPhone": false,
    "showSubject": true,
    "buttonText": "string"
  }
}

NEWSLETTER:
{
  "type": "newsletter",
  "props": {
    "title": "string",
    "subtitle": "string",
    "buttonText": "string",
    "placeholder": "string"
  }
}

FOOTER:
{
  "type": "footer",
  "props": {
    "logoText": "string",
    "tagline": "string",
    "columns": [
      {
        "title": "string",
        "links": [{ "label": "string", "href": "string" }]
      }
    ],
    "copyright": "string"
  }
}

Return ONLY the JSON object, nothing else.`);
  
  return parts.join("\n\n");
}
```

### Task 25.4: AI Generation Service

**File: `src/lib/ai/generate.ts`**

```typescript
import { anthropic, DEFAULT_MODEL, GENERATION_CONFIG } from "./config";
import { buildSystemPrompt, buildUserPrompt, GenerationContext } from "./prompts";

export interface GeneratedWebsite {
  metadata: {
    title: string;
    description: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
  sections: Array<{
    type: string;
    props: Record<string, unknown>;
  }>;
}

export interface GenerationResult {
  success: boolean;
  website?: GeneratedWebsite;
  error?: string;
  tokensUsed?: number;
}

export async function generateWebsite(
  context: GenerationContext
): Promise<GenerationResult> {
  try {
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(context);

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: GENERATION_CONFIG.maxTokens,
      temperature: GENERATION_CONFIG.temperature,
      messages: [
        {
          role: "user",
          content: `${systemPrompt}\n\n${userPrompt}`,
        },
      ],
    });

    // Extract text content
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // Parse JSON
    const website = JSON.parse(content.text) as GeneratedWebsite;

    // Validate structure
    if (!website.metadata || !website.sections) {
      throw new Error("Invalid website structure");
    }

    return {
      success: true,
      website,
      tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens,
    };
  } catch (error) {
    console.error("Generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Generation failed",
    };
  }
}
```

### Task 25.5: Generation API Route

**File: `src/app/api/ai/generate/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWebsite } from "@/lib/ai/generate";
import { getTemplateById } from "@/lib/ai/templates";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessDescription,
      industryId,
      tone,
      targetAudience,
      sections,
      colorPreference,
      siteId,
    } = body;

    if (!businessDescription) {
      return NextResponse.json(
        { error: "Business description is required" },
        { status: 400 }
      );
    }

    // Get industry template if provided
    const industry = industryId ? getTemplateById(industryId) : undefined;

    // Generate website
    const result = await generateWebsite({
      businessDescription,
      industry,
      tone,
      targetAudience,
      sections,
      colorPreference: colorPreference || industry?.colorScheme,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // If siteId provided, save to database
    if (siteId && result.website) {
      // Update site with generated content
      const { error: updateError } = await supabase
        .from("sites")
        .update({
          ai_generated_content: result.website,
          updated_at: new Date().toISOString(),
        })
        .eq("id", siteId);

      if (updateError) {
        console.error("Failed to save generated content:", updateError);
      }
    }

    return NextResponse.json({
      success: true,
      website: result.website,
      tokensUsed: result.tokensUsed,
    });
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Task 25.6: AI Generation Hook

**File: `src/hooks/use-ai-generation.ts`**

```typescript
"use client";

import { useState } from "react";
import type { GeneratedWebsite } from "@/lib/ai/generate";

export interface GenerationOptions {
  businessDescription: string;
  industryId?: string;
  tone?: "professional" | "friendly" | "playful" | "luxurious" | "minimal";
  targetAudience?: string;
  sections?: string[];
  colorPreference?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  siteId?: string;
}

export function useAIGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedWebsite | null>(null);
  const [tokensUsed, setTokensUsed] = useState<number | undefined>();

  async function generate(options: GenerationOptions) {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setResult(data.website);
      setTokensUsed(data.tokensUsed);
      return data.website;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }

  function reset() {
    setIsGenerating(false);
    setError(null);
    setResult(null);
    setTokensUsed(undefined);
  }

  return {
    generate,
    reset,
    isGenerating,
    error,
    result,
    tokensUsed,
  };
}
```

---

## 📐 Acceptance Criteria

- [ ] Anthropic client configured correctly
- [ ] 10 industry templates available
- [ ] System prompts generate valid website JSON
- [ ] API route handles generation with auth
- [ ] Hook provides loading states and error handling
- [ ] Generated websites match schema structure
- [ ] Results can be saved to database

---

## 🔐 Environment Variables

Add to `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 📁 Files Created This Phase

```
src/lib/ai/
├── config.ts
├── templates.ts
├── prompts.ts
└── generate.ts

src/app/api/ai/generate/
└── route.ts

src/hooks/
└── use-ai-generation.ts
```

---

## ➡️ Next Phase

**Phase 26: AI Builder - Interface** - Prompt input UI, industry selector, generation progress, preview.
