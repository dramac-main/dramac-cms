# Phase AWD-06: Content Generation Engine

> **Priority**: 🟡 HIGH
> **Estimated Time**: 10-12 hours
> **Prerequisites**: AWD-02, AWD-03 Complete
> **Status**: 📋 READY TO IMPLEMENT

---

## ⚠️ BEFORE YOU BEGIN

**REQUIRED READING**: Before implementing this phase, you MUST read:

1. **[PHASE-AWD-CONTEXT.md](./PHASE-AWD-CONTEXT.md)** - Vercel AI SDK patterns
2. **AWD-02**: Understand BusinessDataContext structure (services, testimonials, team, etc.)
3. **AWD-03**: How the engine requests content generation

**This phase DEPENDS ON AWD-02 and AWD-03** - uses data context and integrates with engine.

---

## 📁 Files To Create

| File | Purpose |
|------|--------|
| `next-platform-dashboard/src/lib/ai/website-designer/content/types.ts` | Content types |
| `next-platform-dashboard/src/lib/ai/website-designer/content/context-builder.ts` | Build content context |
| `next-platform-dashboard/src/lib/ai/website-designer/content/section-generators.ts` | Per-section content generators |
| `next-platform-dashboard/src/lib/ai/website-designer/content/optimizer.ts` | SEO and readability optimization |
| `next-platform-dashboard/src/lib/ai/website-designer/content/index.ts` | Public exports |

---

## 🔧 AI Content Generation Pattern

```typescript
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

// Example: Generate hero content
const { object } = await generateObject({
  model: anthropic("claude-sonnet-4-20250514"),
  schema: z.object({
    headline: z.string().describe("Main headline, 5-10 words"),
    subheadline: z.string().describe("Supporting text, 15-25 words"),
    ctaText: z.string().describe("Call to action button text"),
  }),
  prompt: `Generate hero section content for a ${industry} business...
    Business name: ${businessName}
    Services: ${services.join(", ")}
    Tone: ${tone}
  `,
});
```

---

## 🎯 Objective

Build an intelligent **Content Generation Engine** that creates high-quality, conversion-optimized copy for all website sections based on:
1. Business context and data
2. Industry best practices
3. Section purpose (hero, features, CTA, etc.)
4. Tone and brand voice

**Principle:** Every piece of content is tailored, not generic template text

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    CONTENT GENERATION ENGINE                       │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                   CONTENT CONTEXT BUILDER                     │ │
│  │  • Business identity                                          │ │
│  │  • Target audience                                            │ │
│  │  • Tone/voice guidelines                                      │ │
│  │  • Industry-specific terminology                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│                              ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                   SECTION CONTENT GENERATOR                   │ │
│  │  • Headlines & Subheadlines                                   │ │
│  │  • Body copy                                                  │ │
│  │  • CTAs                                                       │ │
│  │  • Lists & Features                                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│                              ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                   CONTENT OPTIMIZER                           │ │
│  │  • SEO optimization                                           │ │
│  │  • Readability scoring                                        │ │
│  │  • Conversion optimization                                    │ │
│  │  • Length validation                                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Core Types

```typescript
// src/lib/ai/website-designer/content/types.ts

export interface ContentGenerationContext {
  business: {
    name: string;
    industry: string;
    description?: string;
    uniqueValueProposition?: string;
    targetAudience?: string;
    competitors?: string[];
  };
  tone: ContentTone;
  style: ContentStyle;
  seoKeywords?: string[];
}

export type ContentTone = 
  | "professional" 
  | "friendly" 
  | "authoritative" 
  | "playful" 
  | "inspirational"
  | "urgent"
  | "conversational"
  | "technical";

export interface ContentStyle {
  formality: "formal" | "casual" | "neutral";
  length: "concise" | "moderate" | "detailed";
  complexity: "simple" | "moderate" | "sophisticated";
  persuasion: "soft" | "moderate" | "aggressive";
}

export interface SectionContent {
  headlines: string[];
  subheadlines: string[];
  bodyText: string[];
  bulletPoints: string[];
  ctaText: string[];
  supportingText: string[];
}

export interface GeneratedContent {
  hero: HeroContent;
  features: FeaturesContent;
  testimonials: TestimonialsContent;
  cta: CTAContent;
  about: AboutContent;
  contact: ContactContent;
  faq: FAQContent;
  pricing: PricingContent;
  team: TeamContent;
  services: ServicesContent;
}

export interface HeroContent {
  headline: string;
  subheadline: string;
  ctaPrimary: string;
  ctaSecondary?: string;
  badge?: string;
  socialProof?: string;
}

export interface FeaturesContent {
  sectionTitle: string;
  sectionSubtitle: string;
  features: {
    title: string;
    description: string;
    icon?: string;
  }[];
}

export interface CTAContent {
  headline: string;
  subheadline: string;
  ctaText: string;
  urgencyText?: string;
  trustIndicators?: string[];
}

export interface AboutContent {
  headline: string;
  story: string;
  mission?: string;
  vision?: string;
  values?: { title: string; description: string }[];
  stats?: { value: string; label: string }[];
}

export interface ContactContent {
  headline: string;
  subheadline: string;
  formTitle?: string;
  submitButtonText: string;
  contactMethods?: { method: string; value: string; icon: string }[];
}

export interface FAQContent {
  sectionTitle: string;
  sectionSubtitle: string;
  items: { question: string; answer: string }[];
}

export interface PricingContent {
  sectionTitle: string;
  sectionSubtitle: string;
  plans: {
    name: string;
    description: string;
    price: string;
    period: string;
    features: string[];
    ctaText: string;
    isPopular?: boolean;
  }[];
}

export interface TeamContent {
  sectionTitle: string;
  sectionSubtitle: string;
  memberBioTemplate?: string;
}

export interface ServicesContent {
  sectionTitle: string;
  sectionSubtitle: string;
  services: {
    title: string;
    description: string;
    features?: string[];
    ctaText?: string;
  }[];
}
```

---

## 🧠 AI Prompts

### System Prompt - Content Generator

```typescript
export const CONTENT_GENERATOR_SYSTEM_PROMPT = `You are an expert copywriter and conversion specialist who creates compelling website content.

## Your Expertise
- Writing headlines that grab attention and drive action
- Creating copy that converts visitors into customers
- Understanding industry-specific language and tone
- SEO-optimized content that ranks well
- Emotional triggers and psychological persuasion techniques

## Content Principles
1. **Clarity over cleverness** - Clear messaging beats clever wordplay
2. **Benefits over features** - Focus on what users gain
3. **Specificity builds trust** - Use specific numbers and outcomes
4. **Address objections** - Preemptively handle concerns
5. **Create urgency** - Motivate immediate action

## Headline Formulas
- [Outcome] + [Timeframe] + [Without pain point]
- How [Target audience] [Achieves outcome] [Without usual struggle]
- The [Secret/Strategy/System] that [Outcome]
- [Number] Ways to [Outcome] [Timeframe]
- Stop [Pain point]. Start [Desired outcome].

## CTA Best Practices
- Action-oriented verbs (Get, Start, Discover, Join, Unlock)
- Specific outcomes (Get Your Free Quote, Start Your Free Trial)
- Urgency when appropriate (Limited Time, Today Only)
- Risk reversal (No credit card required, Cancel anytime)`;
```

---

## 🔧 Implementation

### 1. Content Context Builder

```typescript
// src/lib/ai/website-designer/content/context-builder.ts

export function buildContentContext(
  businessContext: BusinessDataContext,
  industry: string,
  tone: ContentTone
): ContentGenerationContext {
  // Infer target audience from industry
  const targetAudience = inferTargetAudience(industry, businessContext);
  
  // Build unique value proposition if not provided
  const uvp = businessContext.client?.notes || 
    inferUVP(industry, businessContext);
  
  return {
    business: {
      name: businessContext.branding.business_name || businessContext.client?.company || "Business",
      industry,
      description: businessContext.client?.notes,
      uniqueValueProposition: uvp,
      targetAudience,
    },
    tone,
    style: getStyleFromTone(tone),
    seoKeywords: inferSEOKeywords(industry, businessContext),
  };
}

function inferTargetAudience(industry: string, context: BusinessDataContext): string {
  const audienceMap: Record<string, string> = {
    restaurant: "Food lovers and local diners seeking memorable dining experiences",
    "law-firm": "Individuals and businesses seeking expert legal representation",
    saas: "Businesses and teams looking to streamline their workflows",
    ecommerce: "Shoppers seeking quality products and excellent service",
    healthcare: "Patients seeking trusted, compassionate healthcare",
    "real-estate": "Home buyers, sellers, and investors",
    portfolio: "Clients seeking creative and professional services",
    construction: "Homeowners and businesses needing reliable contractors",
  };
  
  return audienceMap[industry] || "Customers seeking quality products and services";
}

function inferUVP(industry: string, context: BusinessDataContext): string {
  // Use services/features to build UVP
  const services = context.services;
  if (services && services.length > 0) {
    const topServices = services.slice(0, 3).map(s => s.name).join(", ");
    return `Providing ${topServices} with excellence and dedication`;
  }
  
  const uvpMap: Record<string, string> = {
    restaurant: "Exceptional cuisine and unforgettable dining experiences",
    "law-firm": "Dedicated legal representation with proven results",
    saas: "Powerful solutions that save time and boost productivity",
    healthcare: "Compassionate care focused on your well-being",
    "real-estate": "Expert guidance for every step of your journey",
  };
  
  return uvpMap[industry] || "Quality service and customer satisfaction";
}

function getStyleFromTone(tone: ContentTone): ContentStyle {
  const styleMap: Record<ContentTone, ContentStyle> = {
    professional: { formality: "formal", length: "moderate", complexity: "moderate", persuasion: "soft" },
    friendly: { formality: "casual", length: "concise", complexity: "simple", persuasion: "soft" },
    authoritative: { formality: "formal", length: "detailed", complexity: "sophisticated", persuasion: "moderate" },
    playful: { formality: "casual", length: "concise", complexity: "simple", persuasion: "soft" },
    inspirational: { formality: "neutral", length: "moderate", complexity: "moderate", persuasion: "moderate" },
    urgent: { formality: "neutral", length: "concise", complexity: "simple", persuasion: "aggressive" },
    conversational: { formality: "casual", length: "moderate", complexity: "simple", persuasion: "soft" },
    technical: { formality: "formal", length: "detailed", complexity: "sophisticated", persuasion: "soft" },
  };
  
  return styleMap[tone];
}

function inferSEOKeywords(industry: string, context: BusinessDataContext): string[] {
  const keywords: string[] = [];
  
  // Industry keywords
  const industryKeywords: Record<string, string[]> = {
    restaurant: ["restaurant", "dining", "food", "cuisine", "local restaurant"],
    "law-firm": ["attorney", "lawyer", "legal services", "law firm"],
    saas: ["software", "platform", "solution", "app", "productivity"],
    healthcare: ["healthcare", "medical", "doctor", "health", "clinic"],
    "real-estate": ["real estate", "homes", "property", "realtor", "houses"],
    construction: ["contractor", "construction", "builder", "renovation"],
  };
  
  keywords.push(...(industryKeywords[industry] || []));
  
  // Location keywords
  if (context.locations && context.locations.length > 0) {
    const loc = context.locations[0];
    if (loc.city) keywords.push(`${industry} ${loc.city}`);
    if (loc.state) keywords.push(`${industry} ${loc.state}`);
  }
  
  // Service keywords
  if (context.services) {
    keywords.push(...context.services.slice(0, 5).map(s => s.name.toLowerCase()));
  }
  
  return [...new Set(keywords)].slice(0, 10);
}
```

### 2. Section Content Generator

```typescript
// src/lib/ai/website-designer/content/section-generator.ts

import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { CONTENT_GENERATOR_SYSTEM_PROMPT } from "./prompts";
import type { ContentGenerationContext, HeroContent, FeaturesContent, CTAContent } from "./types";

export async function generateHeroContent(
  context: ContentGenerationContext,
  businessContext: BusinessDataContext
): Promise<HeroContent> {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-20250514"),
    schema: z.object({
      headline: z.string().describe("Compelling headline, 5-10 words"),
      subheadline: z.string().describe("Supporting subheadline, 15-25 words"),
      ctaPrimary: z.string().describe("Primary CTA text, 2-4 words"),
      ctaSecondary: z.string().optional().describe("Secondary CTA text, 2-4 words"),
      badge: z.string().optional().describe("Small badge/tagline text, 2-5 words"),
      socialProof: z.string().optional().describe("Social proof statement like '10,000+ customers'"),
    }),
    system: CONTENT_GENERATOR_SYSTEM_PROMPT,
    prompt: `Generate compelling hero section content.

## Business Information
- Name: ${context.business.name}
- Industry: ${context.business.industry}
- Value Proposition: ${context.business.uniqueValueProposition}
- Target Audience: ${context.business.targetAudience}

## Tone: ${context.tone}
## Style: ${JSON.stringify(context.style)}

## Available Data
- Services: ${businessContext.services?.map(s => s.name).join(", ") || "Not specified"}
- Testimonials count: ${businessContext.testimonials?.length || 0}
- Team size: ${businessContext.team?.length || 0}
- Years in business: Extract from context if available

Generate a hero that:
1. Immediately communicates the value proposition
2. Speaks directly to the target audience
3. Includes a compelling CTA that drives action
4. Uses ${context.tone} tone throughout
`,
  });
  
  return object as HeroContent;
}

export async function generateFeaturesContent(
  context: ContentGenerationContext,
  businessContext: BusinessDataContext,
  featureCount: number = 6
): Promise<FeaturesContent> {
  // Use actual services if available
  const existingServices = businessContext.services || [];
  
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-20250514"),
    schema: z.object({
      sectionTitle: z.string().describe("Section title, 2-5 words"),
      sectionSubtitle: z.string().describe("Section subtitle, 10-20 words"),
      features: z.array(z.object({
        title: z.string().describe("Feature title, 2-4 words"),
        description: z.string().describe("Feature description, 15-30 words"),
        icon: z.string().describe("Suggested icon name (Lucide icon)"),
      })).min(featureCount).max(featureCount),
    }),
    system: CONTENT_GENERATOR_SYSTEM_PROMPT,
    prompt: `Generate features/services section content.

## Business Information
- Name: ${context.business.name}
- Industry: ${context.business.industry}
- Target Audience: ${context.business.targetAudience}

## Existing Services (use these if available, enhance descriptions)
${existingServices.map(s => `- ${s.name}: ${s.description || "No description"}`).join("\n") || "None provided - create industry-appropriate features"}

## Tone: ${context.tone}

Generate ${featureCount} features that:
1. Highlight key benefits, not just features
2. Use specific outcomes where possible
3. Include appropriate Lucide icon names
4. Maintain consistent ${context.tone} tone
`,
  });
  
  return object as FeaturesContent;
}

export async function generateCTAContent(
  context: ContentGenerationContext,
  ctaPurpose: "primary" | "contact" | "newsletter" | "demo" | "quote"
): Promise<CTAContent> {
  const purposeContext: Record<string, string> = {
    primary: "Main conversion action - signing up, purchasing, or getting started",
    contact: "Encouraging visitors to reach out or schedule a consultation",
    newsletter: "Email list signup for updates and valuable content",
    demo: "Scheduling a product demo or free trial",
    quote: "Requesting a custom quote or estimate",
  };
  
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-20250514"),
    schema: z.object({
      headline: z.string().describe("Compelling CTA headline, 5-10 words"),
      subheadline: z.string().describe("Supporting text, 15-25 words"),
      ctaText: z.string().describe("Button text, 2-4 words"),
      urgencyText: z.string().optional().describe("Urgency element if appropriate, 5-10 words"),
      trustIndicators: z.array(z.string()).optional().describe("Trust indicators like 'No credit card required'"),
    }),
    system: CONTENT_GENERATOR_SYSTEM_PROMPT,
    prompt: `Generate CTA section content.

## Business Information
- Name: ${context.business.name}
- Industry: ${context.business.industry}

## CTA Purpose: ${ctaPurpose}
${purposeContext[ctaPurpose]}

## Tone: ${context.tone}

Generate CTA content that:
1. Creates clear motivation to act
2. Reduces friction with trust indicators
3. Matches the ${ctaPurpose} purpose
4. Uses ${context.tone} tone
`,
  });
  
  return object as CTAContent;
}

export async function generateAboutContent(
  context: ContentGenerationContext,
  businessContext: BusinessDataContext
): Promise<AboutContent> {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-20250514"),
    schema: z.object({
      headline: z.string().describe("About section headline"),
      story: z.string().describe("Company story, 50-100 words"),
      mission: z.string().optional().describe("Mission statement, 15-25 words"),
      vision: z.string().optional().describe("Vision statement, 15-25 words"),
      values: z.array(z.object({
        title: z.string(),
        description: z.string(),
      })).optional(),
      stats: z.array(z.object({
        value: z.string(),
        label: z.string(),
      })).optional(),
    }),
    system: CONTENT_GENERATOR_SYSTEM_PROMPT,
    prompt: `Generate About section content.

## Business Information
- Name: ${context.business.name}
- Industry: ${context.business.industry}
- Description: ${context.business.description || "Not provided"}

## Available Data
- Team size: ${businessContext.team?.length || "Unknown"}
- Services count: ${businessContext.services?.length || "Unknown"}
- Locations: ${businessContext.locations?.length || 1}

## Tone: ${context.tone}

Generate about content that:
1. Tells an authentic story
2. Highlights expertise and experience
3. Connects emotionally with visitors
4. Includes relevant stats/numbers
`,
  });
  
  return object as AboutContent;
}

export async function generateFAQContent(
  context: ContentGenerationContext,
  businessContext: BusinessDataContext,
  questionCount: number = 6
): Promise<FAQContent> {
  // Use existing FAQ if available
  const existingFAQ = businessContext.faq || [];
  
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-20250514"),
    schema: z.object({
      sectionTitle: z.string(),
      sectionSubtitle: z.string(),
      items: z.array(z.object({
        question: z.string(),
        answer: z.string().describe("Comprehensive answer, 30-60 words"),
      })).min(questionCount).max(questionCount),
    }),
    system: CONTENT_GENERATOR_SYSTEM_PROMPT,
    prompt: `Generate FAQ section content.

## Business Information
- Name: ${context.business.name}
- Industry: ${context.business.industry}
- Services: ${businessContext.services?.map(s => s.name).join(", ") || "General services"}

## Existing FAQ (use if available, enhance answers)
${existingFAQ.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n") || "None provided - create industry-appropriate FAQ"}

## Tone: ${context.tone}

Generate ${questionCount} FAQs that:
1. Address common customer concerns
2. Provide helpful, comprehensive answers
3. Build trust and reduce objections
4. Include both general and industry-specific questions
`,
  });
  
  return object as FAQContent;
}
```

### 3. Content Optimizer

```typescript
// src/lib/ai/website-designer/content/optimizer.ts

import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export interface ContentAnalysis {
  readabilityScore: number;      // 0-100
  seoScore: number;              // 0-100
  conversionScore: number;       // 0-100
  suggestions: string[];
}

export function analyzeContent(content: string, keywords: string[]): ContentAnalysis {
  // Simple readability analysis
  const words = content.split(/\s+/).length;
  const sentences = content.split(/[.!?]+/).length;
  const avgWordsPerSentence = words / sentences;
  
  // Readability score (Flesch-Kincaid inspired)
  const readabilityScore = Math.min(100, Math.max(0, 
    100 - (avgWordsPerSentence - 15) * 5
  ));
  
  // SEO score based on keyword presence
  const lowerContent = content.toLowerCase();
  const keywordMatches = keywords.filter(kw => lowerContent.includes(kw.toLowerCase()));
  const seoScore = Math.round((keywordMatches.length / Math.max(1, keywords.length)) * 100);
  
  // Conversion score based on action words
  const actionWords = ["get", "start", "discover", "join", "unlock", "try", "free", "now", "today"];
  const actionMatches = actionWords.filter(aw => lowerContent.includes(aw));
  const conversionScore = Math.min(100, actionMatches.length * 15);
  
  const suggestions: string[] = [];
  
  if (readabilityScore < 60) {
    suggestions.push("Shorten sentences for better readability");
  }
  if (seoScore < 50) {
    suggestions.push("Include more target keywords naturally");
  }
  if (conversionScore < 40) {
    suggestions.push("Add more action-oriented language");
  }
  if (words < 20) {
    suggestions.push("Content may be too brief - consider expanding");
  }
  
  return {
    readabilityScore,
    seoScore,
    conversionScore,
    suggestions,
  };
}

export async function optimizeHeadline(
  headline: string,
  context: ContentGenerationContext
): Promise<string[]> {
  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    prompt: `Given this headline: "${headline}"
    
For a ${context.business.industry} business with ${context.tone} tone.

Generate 3 alternative headlines that:
1. Are more compelling
2. Include power words
3. Create urgency or curiosity
4. Stay under 10 words

Return only the headlines, one per line.`,
  });
  
  return text.split("\n").filter(h => h.trim().length > 0).slice(0, 3);
}

export function validateContentLength(
  content: Record<string, any>,
  requirements: Record<string, { min: number; max: number }>
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  for (const [field, { min, max }] of Object.entries(requirements)) {
    const value = content[field];
    if (typeof value === "string") {
      const words = value.split(/\s+/).length;
      if (words < min) {
        issues.push(`${field} is too short (${words} words, minimum ${min})`);
      }
      if (words > max) {
        issues.push(`${field} is too long (${words} words, maximum ${max})`);
      }
    }
  }
  
  return { valid: issues.length === 0, issues };
}
```

---

## 📋 Industry Content Templates

```typescript
// src/lib/ai/website-designer/content/templates.ts

export const industryContentTemplates: Record<string, IndustryContentTemplate> = {
  restaurant: {
    heroHeadlines: [
      "Experience Culinary Excellence",
      "Where Every Meal Tells a Story",
      "Fresh Flavors, Unforgettable Moments",
    ],
    ctaTexts: ["View Menu", "Make a Reservation", "Order Online"],
    featureIcons: ["UtensilsCrossed", "Clock", "Award", "Heart", "Star", "MapPin"],
    faqTopics: ["reservations", "dietary options", "private events", "parking", "dress code"],
    valueProps: ["Fresh ingredients", "Expert chefs", "Warm ambiance", "Exceptional service"],
  },
  
  "law-firm": {
    heroHeadlines: [
      "Justice Served, Rights Protected",
      "Your Legal Advocate",
      "Fighting for What You Deserve",
    ],
    ctaTexts: ["Free Consultation", "Contact Us", "Get Legal Help"],
    featureIcons: ["Scale", "Shield", "Award", "Users", "FileText", "Clock"],
    faqTopics: ["consultation process", "fees", "case timeline", "communication", "experience"],
    valueProps: ["Proven track record", "Personal attention", "Aggressive representation", "No fee unless we win"],
  },
  
  saas: {
    heroHeadlines: [
      "Work Smarter, Not Harder",
      "The Platform That [Grows/Scales/Adapts] With You",
      "Transform How You [Work/Manage/Grow]",
    ],
    ctaTexts: ["Start Free Trial", "Get Started", "See Demo", "Try Free"],
    featureIcons: ["Zap", "BarChart", "Shield", "Users", "Clock", "Cog"],
    faqTopics: ["pricing", "integrations", "security", "support", "data migration"],
    valueProps: ["Easy to use", "Powerful features", "Secure & reliable", "World-class support"],
  },
  
  healthcare: {
    heroHeadlines: [
      "Your Health, Our Priority",
      "Compassionate Care You Deserve",
      "Expert Care, Personal Touch",
    ],
    ctaTexts: ["Book Appointment", "Schedule Visit", "Contact Us"],
    featureIcons: ["Heart", "UserCheck", "Clock", "Award", "Shield", "Stethoscope"],
    faqTopics: ["insurance", "appointments", "services", "emergencies", "patient portal"],
    valueProps: ["Board-certified doctors", "Comprehensive care", "Modern facilities", "Patient-centered"],
  },
  
  "real-estate": {
    heroHeadlines: [
      "Find Your Dream Home",
      "Your Journey Home Starts Here",
      "Expert Guidance, Every Step",
    ],
    ctaTexts: ["Search Homes", "Get Home Valuation", "Contact Agent"],
    featureIcons: ["Home", "MapPin", "TrendingUp", "Users", "Key", "Award"],
    faqTopics: ["buying process", "selling", "market conditions", "commission", "timeline"],
    valueProps: ["Local expertise", "Proven results", "Personal service", "Market knowledge"],
  },
  
  construction: {
    heroHeadlines: [
      "Building Dreams, Delivering Quality",
      "Your Vision, Our Expertise",
      "Quality Craftsmanship Guaranteed",
    ],
    ctaTexts: ["Get Free Quote", "Request Estimate", "Contact Us"],
    featureIcons: ["Hammer", "HardHat", "Award", "Shield", "Clock", "CheckCircle"],
    faqTopics: ["quotes", "timeline", "warranty", "permits", "materials"],
    valueProps: ["Licensed & insured", "Quality materials", "On-time completion", "Satisfaction guaranteed"],
  },
};
```

---

## 📋 Implementation Tasks

### Task 1: Content Context Builder (2 hours)
- Build context from business data
- Infer missing information
- Set tone and style parameters

### Task 2: Section Generators (4 hours)
- Hero content generator
- Features content generator
- CTA content generator
- About content generator
- FAQ content generator
- All other section generators

### Task 3: Content Optimizer (2 hours)
- Readability analysis
- SEO scoring
- Conversion optimization
- Length validation

### Task 4: Industry Templates (2 hours)
- Create templates for all industries
- Define headline formulas
- Set CTA patterns

### Task 5: Integration & Testing (2 hours)
- Connect to AWD-03 engine
- Test content quality
- Refine prompts

---

## ✅ Completion Checklist

- [ ] Content context builder working
- [ ] Hero content generator working
- [ ] Features content generator working
- [ ] CTA content generator working
- [ ] About content generator working
- [ ] FAQ content generator working
- [ ] Contact content generator working
- [ ] Pricing content generator working
- [ ] Content optimizer implemented
- [ ] Industry templates defined
- [ ] Integration complete
- [ ] Content quality validated

---

## 📁 Files Created

```
src/lib/ai/website-designer/content/
├── types.ts
├── context-builder.ts
├── section-generator.ts
├── optimizer.ts
├── templates.ts
├── prompts.ts
└── index.ts
```

---

**READY TO IMPLEMENT! 🚀**
