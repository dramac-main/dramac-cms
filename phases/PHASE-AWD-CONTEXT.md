# AI Website Designer - Project Context Document

> **PURPOSE**: This document provides ALL context an AI agent needs to implement ANY phase of the AI Website Designer feature. Every phase document should reference this file.
> 
> **INSTRUCTION TO AGENTS**: Read this ENTIRE document before implementing ANY phase. Do NOT proceed until you understand the project structure, coding patterns, and constraints.

---

## 📁 Project Structure

```
f:\dramac-cms\
├── memory-bank/                    # Project documentation (READ FIRST)
│   ├── projectbrief.md             # Core requirements
│   ├── productContext.md           # Purpose and UX goals
│   ├── systemPatterns.md           # Architecture patterns
│   ├── techContext.md              # Tech stack details
│   ├── activeContext.md            # Current focus
│   └── progress.md                 # Status tracking
│
├── next-platform-dashboard/         # 🔴 MAIN APPLICATION (work here)
│   ├── src/
│   │   ├── app/                    # Next.js App Router pages
│   │   │   ├── (auth)/             # Authentication pages
│   │   │   ├── (dashboard)/        # Dashboard pages
│   │   │   │   └── sites/
│   │   │   │       └── [siteId]/
│   │   │   │           └── studio/ # 🔴 Studio Editor lives here
│   │   │   └── api/                # API routes
│   │   │       └── ai/             # 🔴 AI API routes go here
│   │   │
│   │   ├── components/             # React components
│   │   │   ├── ui/                 # Shadcn/UI components
│   │   │   └── studio/             # 🔴 Studio-specific components
│   │   │
│   │   └── lib/                    # Utilities and core logic
│   │       ├── studio/             # 🔴 STUDIO CORE (main focus)
│   │       │   ├── registry/
│   │       │   │   ├── core-components.ts    # 🔴 53 COMPONENTS (8,492 lines)
│   │       │   │   ├── component-registry.ts # Registry & defineComponent
│   │       │   │   └── field-registry.ts     # Field type definitions
│   │       │   ├── engine/                   # Rendering engine
│   │       │   ├── renderer/                 # Component renderers
│   │       │   └── types.ts                  # TypeScript types
│   │       │
│   │       ├── ai/                 # 🔴 AI FEATURES GO HERE
│   │       │   └── website-designer/         # NEW: AWD implementation
│   │       │       ├── types.ts
│   │       │       ├── engine.ts
│   │       │       ├── data-context/
│   │       │       ├── intelligence/
│   │       │       ├── content/
│   │       │       ├── design/
│   │       │       ├── responsive/
│   │       │       └── modules/
│   │       │
│   │       ├── supabase/           # Database client
│   │       │   ├── client.ts       # Browser client
│   │       │   └── server.ts       # Server client
│   │       │
│   │       └── utils/              # Shared utilities
│   │
│   ├── package.json                # Dependencies (see below)
│   └── tsconfig.json               # TypeScript config
│
├── packages/                       # Monorepo packages
│   ├── sdk/                        # DRAMAC SDK
│   ├── dramac-cli/                 # CLI tools
│   └── test-modules/               # Module testing
│
└── phases/                         # Phase documentation
    ├── PHASE-AWD-CONTEXT.md        # THIS FILE
    ├── PHASE-AWD-00-MASTER-PROMPT.md
    └── PHASE-AWD-01...09.md
```

---

## 🛠️ Tech Stack

### Core Technologies
```json
{
  "framework": "Next.js 16.x (App Router)",
  "react": "React 19.x",
  "typescript": "TypeScript 5.x",
  "database": "Supabase (PostgreSQL with RLS)",
  "styling": "Tailwind CSS 4.x",
  "ui": "Radix UI + shadcn/ui",
  "animations": "Framer Motion",
  "state-client": "Zustand",
  "state-server": "TanStack Query v5",
  "ai": "Vercel AI SDK (@ai-sdk/anthropic)",
  "drag-drop": "@dnd-kit/core",
  "forms": "React Hook Form + Zod",
  "icons": "Lucide React"
}
```

### Key Dependencies (already installed)
```json
{
  "@ai-sdk/anthropic": "^1.x",
  "ai": "^4.x",
  "zod": "^3.x",
  "@supabase/supabase-js": "^2.x",
  "@tanstack/react-query": "^5.x",
  "zustand": "^5.x",
  "framer-motion": "^11.x",
  "@dnd-kit/core": "^6.x",
  "lucide-react": "^0.x"
}
```

---

## 🗄️ Database Schema

### Sites Table
```sql
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  domain TEXT,
  client_id UUID REFERENCES clients(id),
  agency_id UUID REFERENCES agencies(id),
  settings JSONB DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  analytics_id TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Site Branding Table
```sql
CREATE TABLE site_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  business_name TEXT,
  tagline TEXT,
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#10B981',
  accent_color TEXT DEFAULT '#8B5CF6',
  font_heading TEXT DEFAULT 'Inter',
  font_body TEXT DEFAULT 'Inter',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Site Pages Table
```sql
CREATE TABLE site_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT,
  description TEXT,
  is_homepage BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  content JSONB DEFAULT '{"components": []}',
  seo JSONB DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(site_id, slug)
);
```

### Clients Table
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id),
  company TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  website TEXT,
  industry TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Site Social Links Table
```sql
CREATE TABLE site_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);
```

### Site Business Hours Table
```sql
CREATE TABLE site_business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false
);
```

### Site Testimonials Table
```sql
CREATE TABLE site_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  role TEXT,
  content TEXT NOT NULL,
  rating INTEGER DEFAULT 5,
  image_url TEXT,
  featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Site Team Members Table
```sql
CREATE TABLE site_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  bio TEXT,
  image_url TEXT,
  email TEXT,
  phone TEXT,
  social_links JSONB DEFAULT '{}',
  display_order INTEGER DEFAULT 0
);
```

### Site Services Table
```sql
CREATE TABLE site_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  features JSONB DEFAULT '[]',
  category TEXT,
  display_order INTEGER DEFAULT 0
);
```

---

## 🧩 Component Registry Pattern

### How Components Are Defined

All components are defined in `core-components.ts` using the `defineComponent` function:

```typescript
// Location: src/lib/studio/registry/core-components.ts

import { componentRegistry, defineComponent } from "./component-registry";

// Example: Simple component
defineComponent({
  type: "Spacer",
  name: "Spacer",
  category: "layout",
  icon: "Space",
  description: "Adds vertical spacing between sections",
  fields: {
    height: {
      type: "select",
      label: "Height",
      options: [
        { value: "sm", label: "Small (16px)" },
        { value: "md", label: "Medium (32px)" },
        { value: "lg", label: "Large (64px)" },
        { value: "xl", label: "Extra Large (96px)" },
      ],
      defaultValue: "md",
    },
    backgroundColor: { type: "color", label: "Background Color" },
  },
});

// Example: Complex component with nested arrays
defineComponent({
  type: "Hero",
  name: "Hero Section",
  category: "sections",
  icon: "Layout",
  description: "Main hero section with headline, subtext, and CTA",
  fields: {
    // Content Group
    headline: {
      type: "text",
      label: "Headline",
      placeholder: "Your main headline",
      group: "content",
    },
    subheadline: {
      type: "textarea",
      label: "Subheadline",
      placeholder: "Supporting text",
      group: "content",
    },
    
    // Buttons Group
    buttons: {
      type: "array",
      label: "Buttons",
      itemLabel: "Button",
      group: "buttons",
      fields: {
        text: { type: "text", label: "Button Text" },
        link: { type: "link", label: "Button Link" },
        variant: {
          type: "select",
          label: "Variant",
          options: [
            { value: "primary", label: "Primary" },
            { value: "secondary", label: "Secondary" },
            { value: "outline", label: "Outline" },
            { value: "ghost", label: "Ghost" },
          ],
        },
        size: {
          type: "select",
          label: "Size",
          options: [
            { value: "sm", label: "Small" },
            { value: "md", label: "Medium" },
            { value: "lg", label: "Large" },
          ],
        },
      },
    },
    
    // Style Group
    variant: {
      type: "select",
      label: "Layout Variant",
      group: "style",
      options: [
        { value: "centered", label: "Centered" },
        { value: "left-aligned", label: "Left Aligned" },
        { value: "split", label: "Split (Image Right)" },
        { value: "split-reverse", label: "Split (Image Left)" },
        { value: "video-background", label: "Video Background" },
      ],
    },
    
    // Background Group
    backgroundColor: {
      type: "color",
      label: "Background Color",
      group: "background",
    },
    backgroundImage: {
      type: "image",
      label: "Background Image",
      group: "background",
    },
    backgroundOverlay: {
      type: "toggle",
      label: "Show Overlay",
      group: "background",
    },
    backgroundOverlayColor: {
      type: "color",
      label: "Overlay Color",
      group: "background",
    },
    backgroundOverlayOpacity: {
      type: "slider",
      label: "Overlay Opacity",
      min: 0,
      max: 100,
      step: 5,
      group: "background",
    },
    
    // Spacing Group
    paddingTop: {
      type: "select",
      label: "Padding Top",
      group: "spacing",
      options: [
        { value: "none", label: "None" },
        { value: "sm", label: "Small (24px)" },
        { value: "md", label: "Medium (48px)" },
        { value: "lg", label: "Large (80px)" },
        { value: "xl", label: "Extra Large (120px)" },
      ],
    },
    paddingBottom: {
      type: "select",
      label: "Padding Bottom",
      group: "spacing",
      options: [
        { value: "none", label: "None" },
        { value: "sm", label: "Small (24px)" },
        { value: "md", label: "Medium (48px)" },
        { value: "lg", label: "Large (80px)" },
        { value: "xl", label: "Extra Large (120px)" },
      ],
    },
    
    // Animation Group
    animation: {
      type: "select",
      label: "Animation",
      group: "animation",
      options: [
        { value: "none", label: "None" },
        { value: "fade-in", label: "Fade In" },
        { value: "slide-up", label: "Slide Up" },
        { value: "slide-down", label: "Slide Down" },
        { value: "scale", label: "Scale" },
      ],
    },
    animationDelay: {
      type: "number",
      label: "Animation Delay (ms)",
      group: "animation",
    },
  },
});
```

### Field Types Available

```typescript
// Location: src/lib/studio/registry/field-registry.ts

export type FieldType =
  | "text"        // Single line text input
  | "textarea"    // Multi-line text input
  | "richtext"    // Rich text editor (Tiptap)
  | "number"      // Numeric input
  | "slider"      // Slider with min/max
  | "select"      // Dropdown select
  | "radio"       // Radio button group
  | "checkbox"    // Checkbox group
  | "toggle"      // Boolean toggle switch
  | "color"       // Color picker
  | "image"       // Image upload/URL
  | "link"        // URL/link input
  | "spacing"     // Spacing control (4 sides)
  | "typography"  // Font settings
  | "array"       // Repeatable items
  | "object"      // Nested object
  | "code"        // Code editor
  | "custom";     // Custom renderer

// Field Definition Structure
export interface FieldDefinition {
  type: FieldType;
  label: string;
  description?: string;
  placeholder?: string;
  defaultValue?: any;
  group?: string;           // For UI grouping
  condition?: {             // Conditional display
    field: string;
    value: any;
  };
  
  // For select/radio/checkbox
  options?: Array<{ value: string; label: string }>;
  
  // For number/slider
  min?: number;
  max?: number;
  step?: number;
  
  // For array type
  fields?: Record<string, FieldDefinition>;  // Nested fields
  itemLabel?: string;
  minItems?: number;
  maxItems?: number;
}
```

### Component Categories

```typescript
export type ComponentCategory =
  | "layout"      // Section, Container, Columns, Card, Spacer, Divider
  | "typography"  // Heading, Text, RichText, Quote, Badge
  | "buttons"     // Button, ButtonGroup
  | "media"       // Image, Video, Map, Gallery
  | "sections"    // Hero, Features, CTA, Testimonials, FAQ, Stats, Team, Pricing
  | "navigation"  // Navbar, Footer, Breadcrumbs, Tabs, Accordion
  | "marketing"   // LogoCloud, ComparisonTable, TrustBadges, SocialProof, AnnouncementBar
  | "forms"       // ContactForm, Newsletter, LeadCapture
  | "social"      // SocialIcons, ShareButtons, SocialFeed
  | "interactive" // Modal, Tooltip, Countdown, Progress
  | "effects"     // Parallax, ScrollAnimate, CardFlip3D, TiltCard, GlassCard
  | "ecommerce"   // ProductGrid, Cart, Checkout (from module)
  | "booking"     // BookingWidget, Calendar (from module)
  | "custom";     // HTML, Embed, CodeBlock
```

---

## 🔌 API Routes Pattern

### Creating AI API Routes

```typescript
// Location: src/app/api/ai/[feature]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { streamObject, generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// For streaming responses
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, prompt } = body;
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Verify user has access to site
    const { data: site, error } = await supabase
      .from("sites")
      .select("*, site_branding(*), clients(*)")
      .eq("id", siteId)
      .single();
    
    if (error || !site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }
    
    // Use streamObject for streaming
    const result = streamObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: z.object({
        // Define your schema
      }),
      prompt: `Your prompt here...`,
    });
    
    // Return streaming response
    return result.toTextStreamResponse();
    
  } catch (error) {
    console.error("AI API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// For non-streaming responses
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("siteId");
  
  // ... implementation
}
```

### Using AI in Client Components

```typescript
// Using Vercel AI SDK in client
"use client";

import { experimental_useObject as useObject } from "ai/react";
import { z } from "zod";

export function AIComponent() {
  const { object, submit, isLoading, error } = useObject({
    api: "/api/ai/feature-name",
    schema: z.object({
      // Schema matching API
    }),
  });
  
  return (
    <div>
      <button onClick={() => submit({ prompt: "..." })}>
        Generate
      </button>
      {isLoading && <div>Loading...</div>}
      {object && <div>{JSON.stringify(object)}</div>}
    </div>
  );
}
```

---

## ⚙️ Supabase Client Usage

### Server-Side (API Routes, Server Components)

```typescript
// Location: src/lib/supabase/server.ts

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

// Usage in API route or Server Component
const supabase = await createClient();
const { data, error } = await supabase
  .from("sites")
  .select("*")
  .eq("id", siteId)
  .single();
```

### Client-Side (Client Components)

```typescript
// Location: src/lib/supabase/client.ts

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Usage in Client Component
"use client";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const { data } = await supabase.from("sites").select("*");
```

---

## 📝 Coding Standards

### TypeScript

```typescript
// Always use explicit types
interface Props {
  siteId: string;
  onComplete: (result: GeneratedWebsite) => void;
}

// Use Zod for runtime validation
const schema = z.object({
  name: z.string().min(1),
  pages: z.array(pageSchema),
});

// Export types from schemas
export type GeneratedWebsite = z.infer<typeof schema>;
```

### React Components

```typescript
// Server Components (default) - no "use client"
export default async function Page({ params }: { params: { siteId: string } }) {
  const data = await fetchData(params.siteId);
  return <div>{/* ... */}</div>;
}

// Client Components - require "use client"
"use client";
export function InteractiveComponent() {
  const [state, setState] = useState();
  return <div>{/* ... */}</div>;
}
```

### File Naming

```
components/        → PascalCase.tsx (MyComponent.tsx)
lib/utilities/     → kebab-case.ts (my-utility.ts)
types/             → kebab-case.ts or index.ts
API routes/        → route.ts (always)
```

---

## 🚨 Critical Constraints

1. **NEVER modify core-components.ts structure** - Only ADD fields to existing defineComponent calls
2. **NEVER create new component definitions** - Use existing 53 components
3. **ALWAYS use TypeScript strict mode** - No `any` types unless absolutely necessary
4. **ALWAYS validate with Zod** - All AI outputs must be validated
5. **ALWAYS handle errors gracefully** - Use try/catch, show user-friendly messages
6. **ALWAYS respect RLS policies** - Never bypass Supabase security
7. **ALWAYS use server components by default** - Only "use client" when needed

---

## 📚 Quick Reference

### File Locations for AWD Implementation

| Feature | Location |
|---------|----------|
| Component definitions | `src/lib/studio/registry/core-components.ts` |
| Field type definitions | `src/lib/studio/registry/field-registry.ts` |
| AI Website Designer | `src/lib/ai/website-designer/` (CREATE) |
| API routes | `src/app/api/ai/website-designer/` (CREATE) |
| UI components | `src/components/studio/website-designer/` (CREATE) |
| Types | `src/lib/ai/website-designer/types.ts` (CREATE) |

### Import Aliases

```typescript
// tsconfig.json paths
import { something } from "@/lib/...";      // src/lib/...
import { Component } from "@/components/..."; // src/components/...
import { createClient } from "@/lib/supabase/server";
```

---

## ✅ Pre-Implementation Checklist

Before implementing ANY phase, verify:

- [ ] Read this entire context document
- [ ] Read the memory-bank files (especially systemPatterns.md)
- [ ] Understand the defineComponent pattern in core-components.ts
- [ ] Know the database schema for data you'll access
- [ ] Understand the API route pattern for AI features
- [ ] Know where to create new files

---

**This document is the source of truth for ALL AWD phases.**
