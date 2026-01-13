# Phase 29: Module System - Foundation

> **AI Model**: Claude Opus 4.5 (3x) ⭐ CRITICAL PHASE
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Create the module marketplace system - database schema, types, and core infrastructure.

---

## 📋 Prerequisites

- [ ] Phase 1-28 completed
- [ ] Supabase project configured

---

## ✅ Tasks

### Task 29.1: Module Database Schema

**File: `migrations/modules.sql`**

```sql
-- Modules table - available add-ons
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  icon TEXT NOT NULL DEFAULT 'Package',
  category TEXT NOT NULL,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  features JSONB DEFAULT '[]'::jsonb,
  screenshots JSONB DEFAULT '[]'::jsonb,
  requirements JSONB DEFAULT '[]'::jsonb,
  version TEXT DEFAULT '1.0.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Module subscriptions - which agencies have which modules
CREATE TABLE public.module_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, module_id)
);

-- Site modules - which modules are enabled for which sites
CREATE TABLE public.site_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN DEFAULT true,
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, module_id)
);

-- Module usage tracking
CREATE TABLE public.module_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_subscription_id UUID NOT NULL REFERENCES public.module_subscriptions(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_usage ENABLE ROW LEVEL SECURITY;

-- Modules are viewable by all authenticated users
CREATE POLICY "Modules are viewable by authenticated users"
  ON public.modules FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Agency members can view their subscriptions
CREATE POLICY "View own module subscriptions"
  ON public.module_subscriptions FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid()
    )
  );

-- Admins can manage subscriptions
CREATE POLICY "Admins manage module subscriptions"
  ON public.module_subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members 
      WHERE user_id = auth.uid() 
      AND agency_id = module_subscriptions.agency_id
      AND role IN ('owner', 'admin')
    )
  );

-- Site modules visible to site team
CREATE POLICY "View site modules"
  ON public.site_modules FOR SELECT
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      JOIN public.clients c ON s.client_id = c.id
      WHERE c.agency_id IN (
        SELECT agency_id FROM public.agency_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can manage site modules
CREATE POLICY "Admins manage site modules"
  ON public.site_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sites s
      JOIN public.clients c ON s.client_id = c.id
      JOIN public.agency_members am ON am.agency_id = c.agency_id
      WHERE s.id = site_modules.site_id
      AND am.user_id = auth.uid()
      AND am.role IN ('owner', 'admin')
    )
  );

-- Indexes
CREATE INDEX idx_module_subscriptions_agency ON public.module_subscriptions(agency_id);
CREATE INDEX idx_module_subscriptions_module ON public.module_subscriptions(module_id);
CREATE INDEX idx_site_modules_site ON public.site_modules(site_id);
CREATE INDEX idx_site_modules_module ON public.site_modules(module_id);
CREATE INDEX idx_modules_category ON public.modules(category);
CREATE INDEX idx_modules_featured ON public.modules(is_featured) WHERE is_featured = true;

-- Triggers for updated_at
CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_subscriptions_updated_at
  BEFORE UPDATE ON public.module_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Task 29.2: Seed Modules Data

**File: `migrations/seed-modules.sql`**

```sql
-- Insert initial modules
INSERT INTO public.modules (slug, name, description, long_description, icon, category, price_monthly, price_yearly, is_featured, features) VALUES
-- Analytics Module
(
  'analytics',
  'Advanced Analytics',
  'Detailed visitor analytics and insights',
  'Get deep insights into your website visitors with real-time analytics, conversion tracking, heatmaps, and detailed reports. Understand user behavior and optimize your site for better performance.',
  'BarChart3',
  'analytics',
  9.99,
  99.99,
  true,
  '["Real-time visitor tracking", "Conversion funnels", "Heatmaps", "A/B testing", "Custom reports", "Export to CSV"]'::jsonb
),
-- SEO Module
(
  'seo-pro',
  'SEO Pro',
  'Advanced SEO tools and optimization',
  'Boost your search engine rankings with our comprehensive SEO toolkit. Includes keyword research, on-page optimization, XML sitemaps, schema markup, and competitor analysis.',
  'Search',
  'seo',
  14.99,
  149.99,
  true,
  '["Keyword research", "On-page SEO analyzer", "XML sitemap generator", "Schema markup", "Meta tag optimization", "Competitor tracking"]'::jsonb
),
-- Forms Module
(
  'forms-pro',
  'Forms Pro',
  'Advanced form builder and submissions',
  'Create powerful forms with conditional logic, multi-step layouts, file uploads, and integrations. Manage submissions with a built-in CRM-like interface.',
  'FileText',
  'forms',
  7.99,
  79.99,
  false,
  '["Conditional logic", "Multi-step forms", "File uploads", "Payment integration", "Email notifications", "Submission management"]'::jsonb
),
-- E-commerce Module
(
  'ecommerce',
  'E-commerce',
  'Full online store capabilities',
  'Turn your website into a full-featured online store. Product management, shopping cart, checkout, inventory tracking, and order management included.',
  'ShoppingCart',
  'ecommerce',
  24.99,
  249.99,
  true,
  '["Product catalog", "Shopping cart", "Secure checkout", "Inventory management", "Order tracking", "Discount codes"]'::jsonb
),
-- Blog Module
(
  'blog',
  'Blog Engine',
  'Full-featured blog and content management',
  'Add a professional blog to your website with categories, tags, comments, RSS feeds, and SEO optimization built-in.',
  'Newspaper',
  'content',
  4.99,
  49.99,
  false,
  '["WYSIWYG editor", "Categories & tags", "Comment system", "RSS feeds", "Social sharing", "Scheduled posts"]'::jsonb
),
-- Multilingual Module
(
  'multilingual',
  'Multilingual',
  'Multi-language support for your site',
  'Reach a global audience with automatic and manual translations. Support for RTL languages, language switcher, and SEO-friendly URLs for each language.',
  'Globe',
  'localization',
  12.99,
  129.99,
  false,
  '["Unlimited languages", "Auto-translation (AI)", "RTL support", "Language switcher", "SEO-friendly URLs", "Translation management"]'::jsonb
),
-- Members Module
(
  'members',
  'Member Portal',
  'User accounts and member areas',
  'Create exclusive member-only content, user registration, login systems, and subscription-based access control.',
  'Users',
  'membership',
  19.99,
  199.99,
  false,
  '["User registration", "Member directories", "Gated content", "User profiles", "Email verification", "Social login"]'::jsonb
),
-- Booking Module
(
  'booking',
  'Booking System',
  'Appointment and reservation management',
  'Let visitors book appointments, classes, or services directly from your website. Calendar integration, reminders, and payment collection.',
  'Calendar',
  'scheduling',
  14.99,
  149.99,
  true,
  '["Online scheduling", "Calendar sync", "Email reminders", "Payment collection", "Staff management", "Buffer times"]'::jsonb
);
```

### Task 29.3: Module Types

**File: `src/types/modules.ts`**

```typescript
export interface Module {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  long_description: string | null;
  icon: string;
  category: ModuleCategory;
  price_monthly: number;
  price_yearly: number | null;
  is_active: boolean;
  is_featured: boolean;
  features: string[];
  screenshots: string[];
  requirements: string[];
  version: string;
  created_at: string;
  updated_at: string;
}

export type ModuleCategory = 
  | "analytics"
  | "seo"
  | "forms"
  | "ecommerce"
  | "content"
  | "localization"
  | "membership"
  | "scheduling";

export interface ModuleSubscription {
  id: string;
  agency_id: string;
  module_id: string;
  status: "active" | "canceled" | "past_due";
  billing_cycle: "monthly" | "yearly";
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  module?: Module;
}

export interface SiteModule {
  id: string;
  site_id: string;
  module_id: string;
  settings: Record<string, unknown>;
  is_enabled: boolean;
  enabled_at: string;
  // Joined
  module?: Module;
}

export const MODULE_CATEGORIES: Record<ModuleCategory, { label: string; icon: string }> = {
  analytics: { label: "Analytics", icon: "BarChart3" },
  seo: { label: "SEO", icon: "Search" },
  forms: { label: "Forms", icon: "FileText" },
  ecommerce: { label: "E-commerce", icon: "ShoppingCart" },
  content: { label: "Content", icon: "Newspaper" },
  localization: { label: "Localization", icon: "Globe" },
  membership: { label: "Membership", icon: "Users" },
  scheduling: { label: "Scheduling", icon: "Calendar" },
};
```

### Task 29.4: Modules API Routes

**File: `src/app/api/modules/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");

    let query = supabase
      .from("modules")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("name");

    if (category) {
      query = query.eq("category", category);
    }

    if (featured === "true") {
      query = query.eq("is_featured", true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Modules fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch modules" },
      { status: 500 }
    );
  }
}
```

**File: `src/app/api/modules/[moduleId]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ moduleId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { moduleId } = await context.params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .eq("id", moduleId)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Module fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch module" },
      { status: 500 }
    );
  }
}
```

### Task 29.5: Agency Subscriptions API

**File: `src/app/api/agencies/[agencyId]/modules/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ agencyId: string }>;
}

// GET - List subscribed modules
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { agencyId } = await context.params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("module_subscriptions")
      .select(`
        *,
        module:modules(*)
      `)
      .eq("agency_id", agencyId)
      .eq("status", "active");

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Module subscriptions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

// POST - Subscribe to a module
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { agencyId } = await context.params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: member } = await supabase
      .from("agency_members")
      .select("role")
      .eq("agency_id", agencyId)
      .eq("user_id", user.id)
      .single();

    if (!member || !["owner", "admin"].includes(member.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { moduleId, billingCycle = "monthly" } = body;

    if (!moduleId) {
      return NextResponse.json(
        { error: "Module ID required" },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const { data: existing } = await supabase
      .from("module_subscriptions")
      .select("id, status")
      .eq("agency_id", agencyId)
      .eq("module_id", moduleId)
      .single();

    if (existing?.status === "active") {
      return NextResponse.json(
        { error: "Already subscribed to this module" },
        { status: 400 }
      );
    }

    // Create or reactivate subscription
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (billingCycle === "yearly" ? 12 : 1));

    if (existing) {
      // Reactivate
      const { data, error } = await supabase
        .from("module_subscriptions")
        .update({
          status: "active",
          billing_cycle: billingCycle,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    // Create new subscription
    const { data, error } = await supabase
      .from("module_subscriptions")
      .insert({
        agency_id: agencyId,
        module_id: moduleId,
        billing_cycle: billingCycle,
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Module subscription error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}
```

### Task 29.6: Modules Hooks

**File: `src/hooks/use-modules.ts`**

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import type { Module } from "@/types/modules";

interface UseModulesOptions {
  category?: string;
  featured?: boolean;
}

export function useModules(options: UseModulesOptions = {}) {
  const { category, featured } = options;

  return useQuery({
    queryKey: ["modules", { category, featured }],
    queryFn: async (): Promise<Module[]> => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (featured) params.set("featured", "true");

      const response = await fetch(`/api/modules?${params}`);
      if (!response.ok) throw new Error("Failed to fetch modules");
      return response.json();
    },
  });
}

export function useModule(moduleId: string) {
  return useQuery({
    queryKey: ["module", moduleId],
    queryFn: async (): Promise<Module> => {
      const response = await fetch(`/api/modules/${moduleId}`);
      if (!response.ok) throw new Error("Failed to fetch module");
      return response.json();
    },
    enabled: !!moduleId,
  });
}
```

**File: `src/hooks/use-module-subscriptions.ts`**

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ModuleSubscription } from "@/types/modules";

export function useModuleSubscriptions(agencyId: string) {
  return useQuery({
    queryKey: ["module-subscriptions", agencyId],
    queryFn: async (): Promise<ModuleSubscription[]> => {
      const response = await fetch(`/api/agencies/${agencyId}/modules`);
      if (!response.ok) throw new Error("Failed to fetch subscriptions");
      return response.json();
    },
    enabled: !!agencyId,
  });
}

export function useSubscribeModule(agencyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      moduleId,
      billingCycle = "monthly",
    }: {
      moduleId: string;
      billingCycle?: "monthly" | "yearly";
    }) => {
      const response = await fetch(`/api/agencies/${agencyId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, billingCycle }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to subscribe");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-subscriptions", agencyId] });
    },
  });
}
```

---

## 📐 Acceptance Criteria

- [ ] Modules table created with proper schema
- [ ] 8 initial modules seeded
- [ ] Module subscriptions track agency purchases
- [ ] Site modules track which modules enabled per site
- [ ] RLS policies protect data appropriately
- [ ] API returns filtered modules list
- [ ] Subscriptions API allows subscribe/list
- [ ] Hooks provide easy data access
- [ ] TypeScript types match database schema

---

## 📁 Files Created This Phase

```
migrations/
├── modules.sql
└── seed-modules.sql

src/types/
└── modules.ts

src/app/api/modules/
├── route.ts
└── [moduleId]/
    └── route.ts

src/app/api/agencies/[agencyId]/modules/
└── route.ts

src/hooks/
├── use-modules.ts
└── use-module-subscriptions.ts
```

---

## ➡️ Next Phase

**Phase 30: Module System - Marketplace UI** - Browse, filter, and subscribe to modules.
