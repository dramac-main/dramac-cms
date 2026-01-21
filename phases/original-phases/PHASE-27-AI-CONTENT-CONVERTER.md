# Phase 27: AI Builder - Content Converter

> **AI Model**: Claude Opus 4.5 (3x) ⭐ CRITICAL PHASE
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Transform AI-generated website JSON into Craft.js node structure for the visual editor.

---

## 📋 Prerequisites

- [ ] Phase 26 completed (AI Builder Interface)
- [ ] All editor components from Phases 17-24

---

## ✅ Tasks

### Task 27.1: Craft.js Node Types

**File: `src/lib/ai/types.ts`**

```typescript
// Craft.js node structure types
export interface CraftNode {
  type: {
    resolvedName: string;
  };
  isCanvas?: boolean;
  props: Record<string, unknown>;
  displayName?: string;
  custom?: Record<string, unknown>;
  parent?: string;
  nodes?: string[];
  linkedNodes?: Record<string, string>;
}

export interface CraftState {
  ROOT: CraftNode;
  [nodeId: string]: CraftNode;
}

// AI Generated types
export interface AISection {
  type: string;
  props: Record<string, unknown>;
}

export interface AIWebsiteContent {
  metadata: {
    title: string;
    description: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
  sections: AISection[];
}
```

### Task 27.2: ID Generator

**File: `src/lib/ai/id-generator.ts`**

```typescript
// Generate unique IDs for Craft.js nodes
let counter = 0;

export function generateNodeId(): string {
  counter++;
  return `node_${Date.now()}_${counter}_${Math.random().toString(36).substr(2, 9)}`;
}

export function resetIdGenerator(): void {
  counter = 0;
}
```

### Task 27.3: Section to Node Converters

**File: `src/lib/ai/converters/navigation-converter.ts`**

```typescript
import { CraftNode, AISection } from "../types";
import { generateNodeId } from "../id-generator";

export function convertNavigation(section: AISection): { nodeId: string; node: CraftNode } {
  const nodeId = generateNodeId();
  
  return {
    nodeId,
    node: {
      type: { resolvedName: "Navigation" },
      props: {
        logoText: section.props.logoText || "Logo",
        logo: section.props.logo || "",
        links: section.props.links || [
          { label: "Home", href: "#" },
          { label: "Features", href: "#features" },
          { label: "Pricing", href: "#pricing" },
          { label: "Contact", href: "#contact" },
        ],
        ctaText: section.props.ctaText || "Get Started",
        ctaHref: section.props.ctaHref || "#",
        backgroundColor: section.props.backgroundColor || "#ffffff",
        textColor: section.props.textColor || "",
        sticky: section.props.sticky || false,
      },
      displayName: "Navigation",
    },
  };
}
```

**File: `src/lib/ai/converters/hero-converter.ts`**

```typescript
import { CraftNode, AISection } from "../types";
import { generateNodeId } from "../id-generator";

export function convertHero(section: AISection): { nodeId: string; node: CraftNode } {
  const nodeId = generateNodeId();
  
  return {
    nodeId,
    node: {
      type: { resolvedName: "HeroSection" },
      props: {
        title: section.props.title || "Welcome to Our Site",
        subtitle: section.props.subtitle || "The best solution for your needs",
        primaryButtonText: section.props.primaryButtonText || "Get Started",
        primaryButtonHref: section.props.primaryButtonHref || "#",
        secondaryButtonText: section.props.secondaryButtonText || "Learn More",
        secondaryButtonHref: section.props.secondaryButtonHref || "#",
        showSecondaryButton: !!section.props.secondaryButtonText,
        backgroundImage: section.props.backgroundImage || "",
        backgroundColor: section.props.backgroundColor || "#0f172a",
        textColor: section.props.textColor || "#ffffff",
        layout: section.props.layout || "centered",
        overlayOpacity: section.props.overlayOpacity ?? 50,
      },
      displayName: "Hero Section",
    },
  };
}
```

**File: `src/lib/ai/converters/features-converter.ts`**

```typescript
import { CraftNode, AISection } from "../types";
import { generateNodeId } from "../id-generator";

interface Feature {
  icon: string;
  title: string;
  description: string;
}

export function convertFeatures(section: AISection): { nodeId: string; node: CraftNode } {
  const nodeId = generateNodeId();
  
  // Ensure features have required fields
  const features = (section.props.features as Feature[] || []).map((f) => ({
    icon: f.icon || "Star",
    title: f.title || "Feature",
    description: f.description || "Feature description",
  }));
  
  // Ensure we have at least 3 features
  while (features.length < 3) {
    features.push({
      icon: "Star",
      title: `Feature ${features.length + 1}`,
      description: "Description of this amazing feature",
    });
  }
  
  return {
    nodeId,
    node: {
      type: { resolvedName: "FeatureGrid" },
      props: {
        title: section.props.title || "Our Features",
        subtitle: section.props.subtitle || "Everything you need to succeed",
        features,
        columns: section.props.columns || 3,
        backgroundColor: section.props.backgroundColor || "#ffffff",
        textColor: section.props.textColor || "",
      },
      displayName: "Feature Grid",
    },
  };
}
```

**File: `src/lib/ai/converters/testimonials-converter.ts`**

```typescript
import { CraftNode, AISection } from "../types";
import { generateNodeId } from "../id-generator";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  avatar: string;
}

export function convertTestimonials(section: AISection): { nodeId: string; node: CraftNode } {
  const nodeId = generateNodeId();
  
  // Ensure testimonials have required fields
  const testimonials = (section.props.testimonials as Testimonial[] || []).map((t, index) => ({
    quote: t.quote || "This is an amazing product!",
    author: t.author || `Customer ${index + 1}`,
    role: t.role || "Happy Customer",
    avatar: t.avatar || `https://picsum.photos/seed/${index}/100/100`,
  }));
  
  // Ensure we have at least 3 testimonials
  while (testimonials.length < 3) {
    const index = testimonials.length;
    testimonials.push({
      quote: "This product exceeded all my expectations. Highly recommended!",
      author: `Customer ${index + 1}`,
      role: "Satisfied Client",
      avatar: `https://picsum.photos/seed/testimonial${index}/100/100`,
    });
  }
  
  return {
    nodeId,
    node: {
      type: { resolvedName: "Testimonials" },
      props: {
        title: section.props.title || "What Our Customers Say",
        testimonials,
        backgroundColor: section.props.backgroundColor || "#f8fafc",
        textColor: section.props.textColor || "",
      },
      displayName: "Testimonials",
    },
  };
}
```

**File: `src/lib/ai/converters/cta-converter.ts`**

```typescript
import { CraftNode, AISection } from "../types";
import { generateNodeId } from "../id-generator";

export function convertCTA(section: AISection): { nodeId: string; node: CraftNode } {
  const nodeId = generateNodeId();
  
  return {
    nodeId,
    node: {
      type: { resolvedName: "CTASection" },
      props: {
        title: section.props.title || "Ready to Get Started?",
        subtitle: section.props.subtitle || "Join thousands of satisfied customers today",
        primaryButtonText: section.props.primaryButtonText || "Start Free Trial",
        primaryButtonHref: section.props.primaryButtonHref || "#",
        secondaryButtonText: section.props.secondaryButtonText || "Contact Sales",
        secondaryButtonHref: section.props.secondaryButtonHref || "#",
        showSecondaryButton: !!section.props.secondaryButtonText,
        backgroundColor: section.props.backgroundColor || "#0f172a",
        textColor: section.props.textColor || "#ffffff",
        layout: section.props.layout || "centered",
      },
      displayName: "CTA Section",
    },
  };
}
```

**File: `src/lib/ai/converters/contact-converter.ts`**

```typescript
import { CraftNode, AISection } from "../types";
import { generateNodeId } from "../id-generator";

export function convertContact(section: AISection): { nodeId: string; node: CraftNode } {
  const nodeId = generateNodeId();
  
  return {
    nodeId,
    node: {
      type: { resolvedName: "ContactForm" },
      props: {
        title: section.props.title || "Get in Touch",
        subtitle: section.props.subtitle || "We'd love to hear from you",
        buttonText: section.props.buttonText || "Send Message",
        showName: section.props.showName ?? true,
        showPhone: section.props.showPhone ?? false,
        showSubject: section.props.showSubject ?? true,
        backgroundColor: section.props.backgroundColor || "#ffffff",
        formBackgroundColor: section.props.formBackgroundColor || "#f8fafc",
      },
      displayName: "Contact Form",
    },
  };
}
```

**File: `src/lib/ai/converters/newsletter-converter.ts`**

```typescript
import { CraftNode, AISection } from "../types";
import { generateNodeId } from "../id-generator";

export function convertNewsletter(section: AISection): { nodeId: string; node: CraftNode } {
  const nodeId = generateNodeId();
  
  return {
    nodeId,
    node: {
      type: { resolvedName: "Newsletter" },
      props: {
        title: section.props.title || "Subscribe to Our Newsletter",
        subtitle: section.props.subtitle || "Stay updated with our latest news",
        buttonText: section.props.buttonText || "Subscribe",
        placeholder: section.props.placeholder || "Enter your email",
        layout: section.props.layout || "inline",
        backgroundColor: section.props.backgroundColor || "#1a1a2e",
        textColor: section.props.textColor || "#ffffff",
      },
      displayName: "Newsletter",
    },
  };
}
```

**File: `src/lib/ai/converters/footer-converter.ts`**

```typescript
import { CraftNode, AISection } from "../types";
import { generateNodeId } from "../id-generator";

export function convertFooter(section: AISection): { nodeId: string; node: CraftNode } {
  const nodeId = generateNodeId();
  
  return {
    nodeId,
    node: {
      type: { resolvedName: "Footer" },
      props: {
        logoText: section.props.logoText || "DRAMAC",
        tagline: section.props.tagline || "Building the web of tomorrow",
        columns: section.props.columns || [
          {
            title: "Product",
            links: [
              { label: "Features", href: "#" },
              { label: "Pricing", href: "#" },
              { label: "Integrations", href: "#" },
            ],
          },
          {
            title: "Company",
            links: [
              { label: "About", href: "#" },
              { label: "Blog", href: "#" },
              { label: "Careers", href: "#" },
            ],
          },
          {
            title: "Support",
            links: [
              { label: "Help Center", href: "#" },
              { label: "Contact", href: "#" },
              { label: "Status", href: "#" },
            ],
          },
        ],
        socialLinks: section.props.socialLinks || [
          { platform: "twitter", href: "#" },
          { platform: "facebook", href: "#" },
          { platform: "linkedin", href: "#" },
        ],
        copyright: section.props.copyright || `© ${new Date().getFullYear()} All rights reserved.`,
        backgroundColor: section.props.backgroundColor || "#0f172a",
        textColor: section.props.textColor || "#ffffff",
      },
      displayName: "Footer",
    },
  };
}
```

### Task 27.4: Main Converter

**File: `src/lib/ai/converter.ts`**

```typescript
import { CraftState, AIWebsiteContent, AISection, CraftNode } from "./types";
import { generateNodeId, resetIdGenerator } from "./id-generator";
import { convertNavigation } from "./converters/navigation-converter";
import { convertHero } from "./converters/hero-converter";
import { convertFeatures } from "./converters/features-converter";
import { convertTestimonials } from "./converters/testimonials-converter";
import { convertCTA } from "./converters/cta-converter";
import { convertContact } from "./converters/contact-converter";
import { convertNewsletter } from "./converters/newsletter-converter";
import { convertFooter } from "./converters/footer-converter";

type SectionConverter = (section: AISection) => { nodeId: string; node: CraftNode };

const converters: Record<string, SectionConverter> = {
  navigation: convertNavigation,
  hero: convertHero,
  features: convertFeatures,
  testimonials: convertTestimonials,
  cta: convertCTA,
  contact: convertContact,
  newsletter: convertNewsletter,
  footer: convertFooter,
};

export function convertAItocraft(content: AIWebsiteContent): CraftState {
  // Reset ID generator for consistent results
  resetIdGenerator();
  
  const state: CraftState = {
    ROOT: {
      type: { resolvedName: "Container" },
      isCanvas: true,
      props: {
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        fillSpace: "yes",
        padding: ["0", "0", "0", "0"],
        margin: ["0", "0", "0", "0"],
        backgroundColor: "#ffffff",
        width: "100%",
        height: "auto",
      },
      displayName: "Page",
      nodes: [],
    },
  };
  
  // Convert each section
  for (const section of content.sections) {
    const sectionType = section.type.toLowerCase();
    const converter = converters[sectionType];
    
    if (converter) {
      const { nodeId, node } = converter(section);
      
      // Add node to state
      state[nodeId] = {
        ...node,
        parent: "ROOT",
      };
      
      // Add node ID to ROOT's children
      state.ROOT.nodes!.push(nodeId);
    } else {
      console.warn(`Unknown section type: ${section.type}`);
    }
  }
  
  return state;
}

// Serialize to JSON string for storage
export function serializeCraftState(state: CraftState): string {
  return JSON.stringify(state);
}

// Parse from JSON string
export function deserializeCraftState(json: string): CraftState {
  return JSON.parse(json);
}

// Convert to Craft.js Editor state format
export function toCraftEditorState(state: CraftState): string {
  // Craft.js expects a slightly different format with type as a reference
  const editorState: Record<string, unknown> = {};
  
  for (const [nodeId, node] of Object.entries(state)) {
    editorState[nodeId] = {
      type: node.type,
      isCanvas: node.isCanvas,
      props: node.props,
      displayName: node.displayName,
      custom: node.custom,
      parent: node.parent,
      nodes: node.nodes || [],
      linkedNodes: node.linkedNodes || {},
    };
  }
  
  return JSON.stringify(editorState);
}
```

### Task 27.5: Update API Route to Convert Content

**File: `src/app/api/ai/generate/route.ts`** (Updated)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWebsite } from "@/lib/ai/generate";
import { getTemplateById } from "@/lib/ai/templates";
import { convertAItocraft, serializeCraftState } from "@/lib/ai/converter";

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
      pageId,
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

    if (!result.success || !result.website) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Convert to Craft.js format
    const craftState = convertAItocraft(result.website);
    const craftJson = serializeCraftState(craftState);

    // If pageId provided, save to page
    if (pageId) {
      const { error: pageError } = await supabase
        .from("pages")
        .update({
          content: craftJson,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pageId);

      if (pageError) {
        console.error("Failed to save page content:", pageError);
      }
    }

    // If siteId provided, update site metadata
    if (siteId && result.website.metadata) {
      const { error: siteError } = await supabase
        .from("sites")
        .update({
          seo_title: result.website.metadata.title,
          seo_description: result.website.metadata.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", siteId);

      if (siteError) {
        console.error("Failed to update site metadata:", siteError);
      }
    }

    return NextResponse.json({
      success: true,
      website: result.website,
      craftState,
      craftJson,
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

### Task 27.6: Load Generated Content in Editor

**File: `src/hooks/use-load-generated.ts`**

```typescript
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useLoadGenerated(siteId: string, pageId: string | null) {
  const searchParams = useSearchParams();
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const isGenerated = searchParams.get("generated") === "true";

  useEffect(() => {
    if (!isGenerated || !pageId) return;

    async function loadContent() {
      setIsLoading(true);
      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from("pages")
          .select("content")
          .eq("id", pageId)
          .single();

        if (error) throw error;
        setContent(data?.content || null);
      } catch (error) {
        console.error("Failed to load generated content:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadContent();
  }, [isGenerated, pageId]);

  return { content, isLoading, isGenerated };
}
```

---

## 📐 Acceptance Criteria

- [ ] All section types have converters
- [ ] Generated JSON converts to valid Craft.js state
- [ ] ROOT node is a Container canvas
- [ ] Each section gets unique node IDs
- [ ] Parent-child relationships correct
- [ ] Craft state serializes/deserializes properly
- [ ] API saves converted content to database
- [ ] Editor loads generated content from URL param

---

## 📁 Files Created This Phase

```
src/lib/ai/
├── types.ts
├── id-generator.ts
├── converter.ts
└── converters/
    ├── navigation-converter.ts
    ├── hero-converter.ts
    ├── features-converter.ts
    ├── testimonials-converter.ts
    ├── cta-converter.ts
    ├── contact-converter.ts
    ├── newsletter-converter.ts
    └── footer-converter.ts

src/hooks/
└── use-load-generated.ts

src/app/api/ai/generate/
└── route.ts (updated)
```

---

## ➡️ Next Phase

**Phase 28: AI Builder - Regeneration & Templates** - Section regeneration, template library, import/export.
