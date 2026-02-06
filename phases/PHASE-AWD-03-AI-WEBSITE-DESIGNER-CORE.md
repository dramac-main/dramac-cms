# Phase AWD-03: AI Website Designer Core Engine

> **Priority**: 🔴 CRITICAL
> **Estimated Time**: 12-15 hours
> **Prerequisites**: AWD-01, AWD-02 Complete
> **Status**: 📋 READY TO IMPLEMENT

---

## ⚠️ BEFORE YOU BEGIN

**REQUIRED READING**: Before implementing this phase, you MUST read:

1. **[PHASE-AWD-CONTEXT.md](./PHASE-AWD-CONTEXT.md)** - Project structure, API patterns, Vercel AI SDK usage
2. **Memory Bank**: `/memory-bank/systemPatterns.md` - Architecture decisions
3. **AWD-01**: Understand the 53 components and their field structures
4. **AWD-02**: Understand the DataContextBuilder output format

**This phase DEPENDS ON AWD-01 and AWD-02** - it uses enhanced components and data context.

---

## 📁 Files To Create

| File | Purpose |
|------|--------|
| `next-platform-dashboard/src/lib/ai/website-designer/types.ts` | Core type definitions |
| `next-platform-dashboard/src/lib/ai/website-designer/engine.ts` | Main WebsiteDesignerEngine class |
| `next-platform-dashboard/src/lib/ai/website-designer/prompts.ts` | AI system prompts |
| `next-platform-dashboard/src/lib/ai/website-designer/schemas.ts` | Zod schemas for AI output |
| `next-platform-dashboard/src/app/api/ai/website-designer/route.ts` | API route for generation |
| `next-platform-dashboard/src/app/api/ai/website-designer/stream/route.ts` | Streaming API route |

---

## 🔧 Key Dependencies

```typescript
// Already installed - just import
import { generateObject, streamObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// From AWD-02
import { buildDataContext } from "@/lib/ai/website-designer/data-context";
```

---

## 🎯 Objective

Build the **core AI reasoning engine** that generates complete, multi-page websites from a single user prompt. This is the brain of the AI Website Designer - it orchestrates all other systems.

**Principle:** One prompt → Complete website ready to publish

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AI WEBSITE DESIGNER ENGINE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │   USER       │    │   DATA       │    │   DESIGN SYSTEM      │  │
│  │   PROMPT     │───▶│   CONTEXT    │───▶│   INTELLIGENCE       │  │
│  │              │    │   (AWD-02)   │    │   (AWD-05)           │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
│         │                   │                      │                │
│         ▼                   ▼                      ▼                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   PROMPT ANALYZER                            │   │
│  │  • Extract intent (portfolio, ecommerce, landing, etc)       │   │
│  │  • Identify tone (professional, playful, minimal, bold)      │   │
│  │  • Detect pages needed (home, about, services, contact)      │   │
│  │  • Note special requirements (blog, booking, store)          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   SITE ARCHITECT                             │   │
│  │  • Define page structure                                     │   │
│  │  • Plan component layout per page                            │   │
│  │  • Ensure cross-page consistency                             │   │
│  │  • Set shared elements (nav, footer)                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   PAGE GENERATOR (per page)                  │   │
│  │  • Select optimal components                                 │   │
│  │  • Configure component props                                 │   │
│  │  • Generate content                                          │   │
│  │  • Apply design system                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   OUTPUT GENERATOR                           │   │
│  │  • Generate page JSON structures                             │   │
│  │  • Create navigation structure                               │   │
│  │  • Set up SEO metadata                                       │   │
│  │  • Configure site settings                                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Core Types

```typescript
// src/lib/ai/website-designer/types.ts

export interface WebsiteDesignerInput {
  siteId: string;
  prompt: string;
  preferences?: {
    style?: "minimal" | "bold" | "elegant" | "playful" | "corporate" | "creative";
    colorPreference?: "brand" | "warm" | "cool" | "monochrome" | "vibrant";
    layoutDensity?: "spacious" | "balanced" | "compact";
    animationLevel?: "none" | "subtle" | "moderate" | "dynamic";
  };
  constraints?: {
    maxPages?: number;
    requiredPages?: string[];
    excludeComponents?: string[];
    mustIncludeComponents?: string[];
  };
}

export interface WebsiteDesignerOutput {
  success: boolean;
  site: {
    name: string;
    domain?: string;
    settings: SiteSettings;
    seo: SEOSettings;
  };
  pages: GeneratedPage[];
  navigation: NavigationStructure;
  designSystem: AppliedDesignSystem;
  contentSummary: ContentSummary;
  estimatedBuildTime: number;
}

export interface GeneratedPage {
  id: string;
  name: string;
  slug: string;
  title: string;
  description: string;
  isHomepage: boolean;
  components: GeneratedComponent[];
  seo: PageSEO;
  order: number;
}

export interface GeneratedComponent {
  id: string;
  type: string;           // Component type from registry
  props: Record<string, any>;  // All configured props
  aiNotes?: string;       // Why AI chose this configuration
}

export interface SiteArchitecture {
  intent: "portfolio" | "ecommerce" | "landing" | "corporate" | "blog" | "service" | "restaurant" | "real-estate" | "agency" | "saas";
  tone: "professional" | "playful" | "minimal" | "bold" | "elegant" | "friendly" | "authoritative";
  pages: PagePlan[];
  sharedElements: {
    navbar: NavbarPlan;
    footer: FooterPlan;
  };
  designTokens: DesignTokens;
}

export interface PagePlan {
  name: string;
  slug: string;
  purpose: string;
  sections: SectionPlan[];
  priority: number;
}

export interface SectionPlan {
  intent: string;
  suggestedComponent: string;
  alternativeComponents: string[];
  contentNeeds: string[];
  designNotes: string;
}
```

---

## 🧠 AI Prompts

### System Prompt - Site Architect

```typescript
export const SITE_ARCHITECT_PROMPT = `You are an expert website architect specializing in creating modern, responsive, award-winning websites.

Your role is to analyze the user's request and create a comprehensive site architecture plan.

## Your Capabilities
- You have access to 53 premium UI components with extensive customization
- You can create unlimited pages with any combination of components
- You understand modern web design principles, UX patterns, and conversion optimization

## Component Categories Available
1. **Layout**: Section, Container, Columns, Card, Spacer, Divider
2. **Typography**: Heading, Text
3. **Buttons**: Button (60+ customization options)
4. **Media**: Image, Video, Map
5. **Navigation**: Navbar, Footer (both premium with 80+ options)
6. **Sections**: Hero, Features, CTA, Testimonials, FAQ, Stats, Team, Gallery, Pricing
7. **Marketing**: LogoCloud, ComparisonTable, TrustBadges, SocialProof, AnnouncementBar
8. **Interactive**: Accordion, Tabs, Modal, Carousel, Countdown, Typewriter, Parallax
9. **Forms**: Form, FormField, ContactForm, Newsletter
10. **Content**: Quote, CodeBlock, RichText, Timeline, Process
11. **UI Elements**: Badge, Avatar, Alert, Progress, Tooltip
12. **3D Effects**: CardFlip3D, TiltCard, GlassCard, ParticleBackground, ScrollAnimate

## Output Format
Return a JSON object with this structure:
{
  "intent": "portfolio | ecommerce | landing | corporate | blog | service | restaurant | real-estate | agency | saas",
  "tone": "professional | playful | minimal | bold | elegant | friendly | authoritative",
  "pages": [
    {
      "name": "Home",
      "slug": "/",
      "purpose": "Main landing page to introduce the business and drive conversions",
      "sections": [
        {
          "intent": "Hero section to capture attention",
          "suggestedComponent": "Hero",
          "alternativeComponents": ["Features", "CTA"],
          "contentNeeds": ["headline", "subheadline", "cta_button", "hero_image"],
          "designNotes": "Full-width, bold typography, high-impact visual"
        }
      ],
      "priority": 1
    }
  ],
  "sharedElements": {
    "navbar": { "style": "sticky", "variant": "modern", "ctaButton": true },
    "footer": { "style": "comprehensive", "columns": 4, "newsletter": true }
  },
  "designTokens": {
    "primaryColor": "#3b82f6",
    "fontHeading": "Inter",
    "borderRadius": "lg",
    "shadowStyle": "soft"
  }
}`;

```

### System Prompt - Page Generator

```typescript
export const PAGE_GENERATOR_PROMPT = `You are an expert page designer creating individual page layouts.

Given a page plan and business context, generate the complete component configuration.

## Rules
1. Every component MUST have ALL its props fully configured
2. Use real content from business context when available
3. Generate high-quality placeholder content when data is missing
4. Maintain visual consistency across all components
5. Ensure mobile-first responsive design
6. Include proper animations for modern feel
7. Configure hover effects for interactivity

## Component Configuration Guidelines

### Hero Component
- Always include a compelling headline (5-10 words)
- Subheadline should be 15-25 words
- Include at least one CTA button
- Use background image or gradient
- Configure animations for entrance

### Features Component
- Use 3, 4, or 6 features (grid-friendly numbers)
- Each feature needs icon, title, description
- Keep feature titles under 5 words
- Descriptions: 15-25 words each

### Testimonials Component
- Use real testimonials if available
- Include name, company, role, image
- 3-5 testimonials is optimal

### CTA Component
- Clear, action-oriented headline
- Supporting text that creates urgency
- Primary CTA button with contrasting color
- Optional secondary button

## Output Format
Return a JSON array of component configurations:
[
  {
    "id": "unique-id",
    "type": "Hero",
    "props": {
      "variant": "centered",
      "headline": "Transform Your Business Today",
      "subheadline": "We help companies achieve...",
      "ctaText": "Get Started",
      "ctaLink": "/contact",
      "backgroundColor": "#1a1a2e",
      "backgroundGradient": true,
      "backgroundGradientFrom": "#1a1a2e",
      "backgroundGradientTo": "#16213e",
      "animationType": "fade-up",
      "animationDuration": 500,
      // ... ALL other props
    },
    "aiNotes": "Chose centered variant for maximum impact on homepage"
  }
]`;
```

---

## 🔧 Implementation

### 1. Main Designer Engine

```typescript
// src/lib/ai/website-designer/engine.ts

import { generateText, generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { buildDataContext } from "./data-context-builder";
import { formatContextForAI } from "./context-formatter";
import { checkDataAvailability } from "./data-checker";
import { getComponentRegistry } from "@/lib/studio/registry";
import { SITE_ARCHITECT_PROMPT, PAGE_GENERATOR_PROMPT } from "./prompts";
import type { WebsiteDesignerInput, WebsiteDesignerOutput, SiteArchitecture, GeneratedPage } from "./types";

export class WebsiteDesignerEngine {
  private siteId: string;
  private context: BusinessDataContext | null = null;
  private architecture: SiteArchitecture | null = null;
  
  constructor(siteId: string) {
    this.siteId = siteId;
  }
  
  async generateWebsite(input: WebsiteDesignerInput): Promise<WebsiteDesignerOutput> {
    const startTime = Date.now();
    
    // Step 1: Build data context
    this.context = await buildDataContext(this.siteId);
    const availability = checkDataAvailability(this.context);
    const formattedContext = formatContextForAI(this.context);
    
    // Step 2: Analyze prompt and create architecture
    this.architecture = await this.createArchitecture(input.prompt, formattedContext, input.preferences);
    
    // Step 3: Generate each page
    const pages: GeneratedPage[] = [];
    for (const pagePlan of this.architecture.pages) {
      const page = await this.generatePage(pagePlan, formattedContext);
      pages.push(page);
    }
    
    // Step 4: Generate shared elements (navbar, footer)
    const navbar = await this.generateNavbar(pages);
    const footer = await this.generateFooter();
    
    // Step 5: Apply navbar and footer to all pages
    const pagesWithNav = this.applySharedElements(pages, navbar, footer);
    
    // Step 6: Generate navigation structure
    const navigation = this.generateNavigation(pagesWithNav);
    
    // Step 7: Generate site settings
    const siteSettings = this.generateSiteSettings();
    
    const buildTime = Date.now() - startTime;
    
    return {
      success: true,
      site: {
        name: this.context.branding.business_name || this.context.client.company || "New Website",
        settings: siteSettings,
        seo: this.generateSEO(),
      },
      pages: pagesWithNav,
      navigation,
      designSystem: this.architecture.designTokens,
      contentSummary: this.generateContentSummary(pagesWithNav),
      estimatedBuildTime: buildTime,
    };
  }
  
  private async createArchitecture(
    prompt: string,
    context: string,
    preferences?: WebsiteDesignerInput["preferences"]
  ): Promise<SiteArchitecture> {
    const componentRegistry = getComponentRegistry();
    const componentSummary = this.summarizeComponents(componentRegistry);
    
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: SiteArchitectureSchema, // Zod schema
      system: SITE_ARCHITECT_PROMPT,
      prompt: `
## User Request
${prompt}

## Business Context
${context}

## User Preferences
${JSON.stringify(preferences || {}, null, 2)}

## Available Components Summary
${componentSummary}

Create a comprehensive site architecture plan.
      `,
    });
    
    return object as SiteArchitecture;
  }
  
  private async generatePage(
    pagePlan: PagePlan,
    context: string
  ): Promise<GeneratedPage> {
    const componentRegistry = getComponentRegistry();
    
    // Get detailed field info for suggested components
    const componentDetails = pagePlan.sections.map(section => {
      const component = componentRegistry.find(c => c.type === section.suggestedComponent);
      return {
        section: section.intent,
        component: section.suggestedComponent,
        fields: component?.fields || {},
        fieldGroups: component?.fieldGroups || [],
      };
    });
    
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: GeneratedPageSchema, // Zod schema
      system: PAGE_GENERATOR_PROMPT,
      prompt: `
## Page: ${pagePlan.name}
Purpose: ${pagePlan.purpose}

## Business Context
${context}

## Design Tokens
${JSON.stringify(this.architecture?.designTokens || {}, null, 2)}

## Sections to Generate
${JSON.stringify(pagePlan.sections, null, 2)}

## Component Field Details
${JSON.stringify(componentDetails, null, 2)}

Generate complete component configurations for this page.
Every prop must be fully specified - no undefined values.
      `,
    });
    
    return {
      id: crypto.randomUUID(),
      name: pagePlan.name,
      slug: pagePlan.slug,
      title: `${pagePlan.name} | ${this.context?.branding.business_name || "Website"}`,
      description: this.generatePageDescription(pagePlan),
      isHomepage: pagePlan.slug === "/",
      components: object.components,
      seo: this.generatePageSEO(pagePlan),
      order: pagePlan.priority,
    };
  }
  
  private async generateNavbar(pages: GeneratedPage[]): Promise<GeneratedComponent> {
    const navItems = pages.map(p => ({
      label: p.name,
      href: p.slug,
    }));
    
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: NavbarComponentSchema,
      prompt: `
Generate a premium navbar configuration.

Business: ${this.context?.branding.business_name}
Logo: ${this.context?.branding.logo_url || "Use text logo"}
Pages: ${JSON.stringify(navItems)}
Style: ${this.architecture?.sharedElements.navbar.style}
Design Tokens: ${JSON.stringify(this.architecture?.designTokens)}

Configure ALL navbar fields for a modern, responsive navigation.
      `,
    });
    
    return {
      id: crypto.randomUUID(),
      type: "Navbar",
      props: object,
    };
  }
  
  private async generateFooter(): Promise<GeneratedComponent> {
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: FooterComponentSchema,
      prompt: `
Generate a premium footer configuration.

Business: ${this.context?.branding.business_name}
Logo: ${this.context?.branding.logo_url}
Contact: ${JSON.stringify(this.context?.contact)}
Social Links: ${JSON.stringify(this.context?.social)}
Business Hours: ${JSON.stringify(this.context?.hours)}
Style: ${this.architecture?.sharedElements.footer.style}
Design Tokens: ${JSON.stringify(this.architecture?.designTokens)}

Configure ALL footer fields for a comprehensive, professional footer.
      `,
    });
    
    return {
      id: crypto.randomUUID(),
      type: "Footer",
      props: object,
    };
  }
  
  private applySharedElements(
    pages: GeneratedPage[],
    navbar: GeneratedComponent,
    footer: GeneratedComponent
  ): GeneratedPage[] {
    return pages.map(page => ({
      ...page,
      components: [navbar, ...page.components, footer],
    }));
  }
  
  private generateNavigation(pages: GeneratedPage[]): NavigationStructure {
    return {
      main: pages
        .filter(p => !p.isHomepage)
        .map(p => ({
          label: p.name,
          href: p.slug,
          order: p.order,
        })),
      footer: pages.map(p => ({
        label: p.name,
        href: p.slug,
      })),
    };
  }
  
  private summarizeComponents(registry: ComponentDefinition[]): string {
    return registry.map(c => 
      `- ${c.type} (${c.category}): ${c.description} [${Object.keys(c.fields).length} fields]`
    ).join("\n");
  }
  
  // ... additional helper methods
}
```

### 2. API Route

```typescript
// src/app/api/ai/website-designer/route.ts

import { NextRequest, NextResponse } from "next/server";
import { WebsiteDesignerEngine } from "@/lib/ai/website-designer/engine";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const RequestSchema = z.object({
  siteId: z.string().uuid(),
  prompt: z.string().min(10).max(2000),
  preferences: z.object({
    style: z.enum(["minimal", "bold", "elegant", "playful", "corporate", "creative"]).optional(),
    colorPreference: z.enum(["brand", "warm", "cool", "monochrome", "vibrant"]).optional(),
    layoutDensity: z.enum(["spacious", "balanced", "compact"]).optional(),
    animationLevel: z.enum(["none", "subtle", "moderate", "dynamic"]).optional(),
  }).optional(),
  constraints: z.object({
    maxPages: z.number().min(1).max(20).optional(),
    requiredPages: z.array(z.string()).optional(),
    excludeComponents: z.array(z.string()).optional(),
    mustIncludeComponents: z.array(z.string()).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const input = RequestSchema.parse(body);
    
    // Verify user has access to site
    const { data: site } = await supabase
      .from("sites")
      .select("id, agency_id")
      .eq("id", input.siteId)
      .single();
    
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }
    
    // Check agency access
    const { data: agencyUser } = await supabase
      .from("agency_users")
      .select("id")
      .eq("agency_id", site.agency_id)
      .eq("user_id", user.id)
      .single();
    
    if (!agencyUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    // Run the designer
    const engine = new WebsiteDesignerEngine(input.siteId);
    const result = await engine.generateWebsite(input);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error("Website Designer Error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Failed to generate website" }, { status: 500 });
  }
}
```

### 3. Streaming Support (Optional)

```typescript
// src/app/api/ai/website-designer/stream/route.ts

import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export async function POST(request: NextRequest) {
  // ... auth checks ...
  
  const stream = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: SITE_ARCHITECT_PROMPT,
    prompt: `...`,
    onFinish: async ({ text }) => {
      // Save to database when complete
    },
  });
  
  return stream.toTextStreamResponse();
}
```

---

## 📋 Implementation Tasks

### Task 1: Core Types & Schemas (2 hours)
- Create all TypeScript types
- Create Zod schemas for validation
- Set up type exports

### Task 2: AI Prompts (3 hours)
- Write site architect prompt
- Write page generator prompt
- Write component-specific prompts
- Test and refine prompts

### Task 3: Engine Core (4 hours)
- Implement `WebsiteDesignerEngine` class
- Implement architecture generation
- Implement page generation
- Implement shared elements

### Task 4: API Routes (2 hours)
- Create main API route
- Add authentication/authorization
- Add rate limiting
- Add error handling

### Task 5: Integration (2 hours)
- Connect to data context system
- Connect to component registry
- Test full pipeline

### Task 6: Testing & Refinement (2 hours)
- Test with various prompts
- Refine AI outputs
- Handle edge cases

---

## ✅ Completion Checklist

- [ ] Types and schemas defined
- [ ] AI prompts written and tested
- [ ] Engine class implemented
- [ ] Architecture generation working
- [ ] Page generation working
- [ ] Navbar generation working
- [ ] Footer generation working
- [ ] API route implemented
- [ ] Auth checks working
- [ ] Rate limiting added
- [ ] Error handling complete
- [ ] Integration tests passing

---

## 📁 Files Created

```
src/lib/ai/website-designer/
├── types.ts
├── schemas.ts
├── prompts.ts
├── engine.ts
└── index.ts

src/app/api/ai/website-designer/
├── route.ts
└── stream/
    └── route.ts
```

---

**READY TO IMPLEMENT! 🚀**
