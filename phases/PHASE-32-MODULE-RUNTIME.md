# Phase 32: Module System - Runtime Integration

> **AI Model**: Claude Opus 4.5 (3x) ⭐ CRITICAL PHASE
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Build the runtime module system for loading modules, providing hooks, and injecting components in rendered sites.

---

## 📋 Prerequisites

- [ ] Phase 31 completed (Site Integration)

---

## ✅ Tasks

### Task 32.1: Module Context Provider

**File: `src/lib/modules/module-context.tsx`**

```typescript
"use client";

import { createContext, useContext, ReactNode } from "react";
import type { Module, SiteModule } from "@/types/modules";

export interface EnabledModule {
  module: Module;
  settings: Record<string, unknown>;
}

interface ModuleContextValue {
  enabledModules: EnabledModule[];
  isModuleEnabled: (slug: string) => boolean;
  getModuleSettings: (slug: string) => Record<string, unknown> | null;
  getModule: (slug: string) => EnabledModule | null;
}

const ModuleContext = createContext<ModuleContextValue | null>(null);

interface ModuleProviderProps {
  modules: EnabledModule[];
  children: ReactNode;
}

export function ModuleProvider({ modules, children }: ModuleProviderProps) {
  const moduleMap = new Map(modules.map((m) => [m.module.slug, m]));

  const isModuleEnabled = (slug: string) => moduleMap.has(slug);

  const getModuleSettings = (slug: string) => {
    const mod = moduleMap.get(slug);
    return mod?.settings || null;
  };

  const getModule = (slug: string) => moduleMap.get(slug) || null;

  return (
    <ModuleContext.Provider
      value={{
        enabledModules: modules,
        isModuleEnabled,
        getModuleSettings,
        getModule,
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
}

export function useModules() {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error("useModules must be used within ModuleProvider");
  }
  return context;
}

export function useModule(slug: string) {
  const { getModule, isModuleEnabled, getModuleSettings } = useModules();
  return {
    module: getModule(slug),
    isEnabled: isModuleEnabled(slug),
    settings: getModuleSettings(slug),
  };
}
```

### Task 32.2: Module Loader

**File: `src/lib/modules/module-loader.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import type { EnabledModule } from "./module-context";

export async function loadSiteModules(siteId: string): Promise<EnabledModule[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_modules")
    .select(`
      settings,
      is_enabled,
      module:modules(*)
    `)
    .eq("site_id", siteId)
    .eq("is_enabled", true);

  if (error || !data) {
    console.error("Failed to load site modules:", error);
    return [];
  }

  return data
    .filter((sm) => sm.module && sm.is_enabled)
    .map((sm) => ({
      module: sm.module!,
      settings: (sm.settings as Record<string, unknown>) || {},
    }));
}

// Load modules for client-side (from API)
export async function fetchSiteModules(siteId: string): Promise<EnabledModule[]> {
  try {
    const response = await fetch(`/api/sites/${siteId}/modules/enabled`);
    if (!response.ok) throw new Error("Failed to fetch modules");
    return response.json();
  } catch (error) {
    console.error("Failed to fetch site modules:", error);
    return [];
  }
}
```

### Task 32.3: Module Components Registry

**File: `src/lib/modules/components.tsx`**

```typescript
"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

// Define where each module injects its components
export type InjectionPoint =
  | "head" // <head> scripts/styles
  | "body-start" // Start of <body>
  | "body-end" // End of <body>
  | "before-content" // Before main content
  | "after-content" // After main content
  | "footer"; // Footer area

// Module component definitions
interface ModuleComponent {
  slug: string;
  injectionPoint: InjectionPoint;
  component: ComponentType<{ settings: Record<string, unknown> }>;
}

// Analytics Module Components
const AnalyticsScript = dynamic(
  () => import("@/components/modules/analytics/analytics-script"),
  { ssr: false }
);

// SEO Module Components
const SEOHead = dynamic(
  () => import("@/components/modules/seo/seo-head"),
  { ssr: true }
);

// Forms Module Components
const FormsStyles = dynamic(
  () => import("@/components/modules/forms/forms-styles"),
  { ssr: true }
);

// Blog Module Components
const BlogWidget = dynamic(
  () => import("@/components/modules/blog/blog-widget"),
  { ssr: true }
);

// Registry of all module components
export const moduleComponents: ModuleComponent[] = [
  {
    slug: "analytics",
    injectionPoint: "body-end",
    component: AnalyticsScript,
  },
  {
    slug: "seo-pro",
    injectionPoint: "head",
    component: SEOHead,
  },
  {
    slug: "forms-pro",
    injectionPoint: "head",
    component: FormsStyles,
  },
  {
    slug: "blog",
    injectionPoint: "after-content",
    component: BlogWidget,
  },
];

// Get components for a specific injection point
export function getComponentsForInjectionPoint(
  point: InjectionPoint,
  enabledSlugs: Set<string>
): ModuleComponent[] {
  return moduleComponents.filter(
    (mc) => mc.injectionPoint === point && enabledSlugs.has(mc.slug)
  );
}
```

### Task 32.4: Module Injection Components

**File: `src/components/modules/module-injector.tsx`**

```typescript
"use client";

import { useModules } from "@/lib/modules/module-context";
import {
  InjectionPoint,
  getComponentsForInjectionPoint,
} from "@/lib/modules/components";

interface ModuleInjectorProps {
  point: InjectionPoint;
}

export function ModuleInjector({ point }: ModuleInjectorProps) {
  const { enabledModules, getModuleSettings } = useModules();
  
  const enabledSlugs = new Set(enabledModules.map((m) => m.module.slug));
  const components = getComponentsForInjectionPoint(point, enabledSlugs);

  if (components.length === 0) return null;

  return (
    <>
      {components.map((mc) => {
        const settings = getModuleSettings(mc.slug) || {};
        const Component = mc.component;
        return <Component key={mc.slug} settings={settings} />;
      })}
    </>
  );
}
```

### Task 32.5: Sample Module Components

**File: `src/components/modules/analytics/analytics-script.tsx`**

```typescript
"use client";

import { useEffect } from "react";
import Script from "next/script";

interface AnalyticsScriptProps {
  settings: Record<string, unknown>;
}

export default function AnalyticsScript({ settings }: AnalyticsScriptProps) {
  const trackClicks = settings.trackClicks ?? true;
  const trackScrollDepth = settings.trackScrollDepth ?? true;
  const excludedPaths = (settings.excludedPaths as string || "").split(",");

  useEffect(() => {
    // Check if current path is excluded
    const path = window.location.pathname;
    if (excludedPaths.some((ep) => path.startsWith(ep.trim()))) {
      return;
    }

    // Track page view
    console.log("[Analytics] Page view:", path);

    // Click tracking
    if (trackClicks) {
      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        console.log("[Analytics] Click:", target.tagName, target.textContent?.slice(0, 50));
      };
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [trackClicks, excludedPaths]);

  useEffect(() => {
    if (!trackScrollDepth) return;

    let maxScroll = 0;
    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        if (maxScroll % 25 === 0) {
          console.log("[Analytics] Scroll depth:", maxScroll + "%");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [trackScrollDepth]);

  return null;
}
```

**File: `src/components/modules/seo/seo-head.tsx`**

```typescript
"use client";

import Head from "next/head";

interface SEOHeadProps {
  settings: Record<string, unknown>;
}

export default function SEOHead({ settings }: SEOHeadProps) {
  const addSchema = settings.addSchema ?? true;

  // This would normally use metadata from the page
  // For now, it's a placeholder
  return null;
}
```

**File: `src/components/modules/forms/forms-styles.tsx`**

```typescript
"use client";

interface FormsStylesProps {
  settings: Record<string, unknown>;
}

export default function FormsStyles({ settings }: FormsStylesProps) {
  // Inject custom form styles
  return (
    <style jsx global>{`
      .dramac-form {
        --form-primary: var(--primary);
        --form-border: var(--border);
      }
      .dramac-form input,
      .dramac-form textarea {
        transition: border-color 0.2s;
      }
      .dramac-form input:focus,
      .dramac-form textarea:focus {
        border-color: var(--form-primary);
        outline: none;
        box-shadow: 0 0 0 2px rgb(var(--form-primary) / 0.1);
      }
    `}</style>
  );
}
```

**File: `src/components/modules/blog/blog-widget.tsx`**

```typescript
"use client";

interface BlogWidgetProps {
  settings: Record<string, unknown>;
}

export default function BlogWidget({ settings }: BlogWidgetProps) {
  const postsPerPage = (settings.postsPerPage as number) || 10;
  
  // This would fetch and display recent blog posts
  // Placeholder for now
  return null;
}
```

### Task 32.6: Module API for Enabled Modules

**File: `src/app/api/sites/[siteId]/modules/enabled/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ siteId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { siteId } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("site_modules")
      .select(`
        settings,
        module:modules(*)
      `)
      .eq("site_id", siteId)
      .eq("is_enabled", true);

    if (error) throw error;

    const enabledModules = data
      ?.filter((sm) => sm.module)
      .map((sm) => ({
        module: sm.module!,
        settings: sm.settings || {},
      })) || [];

    return NextResponse.json(enabledModules);
  } catch (error) {
    console.error("Error fetching enabled modules:", error);
    return NextResponse.json(
      { error: "Failed to fetch modules" },
      { status: 500 }
    );
  }
}
```

### Task 32.7: Module Hooks for Feature Detection

**File: `src/lib/modules/hooks.ts`**

```typescript
"use client";

import { useModule, useModules } from "./module-context";

// Hook to check if analytics is available
export function useAnalytics() {
  const { isEnabled, settings } = useModule("analytics");
  
  const trackEvent = (name: string, data?: Record<string, unknown>) => {
    if (!isEnabled) return;
    console.log("[Analytics] Event:", name, data);
    // Real implementation would send to analytics service
  };

  const trackPageView = (path: string) => {
    if (!isEnabled) return;
    console.log("[Analytics] Page view:", path);
  };

  return {
    isEnabled,
    trackEvent,
    trackPageView,
  };
}

// Hook to check if forms module is available
export function useForms() {
  const { isEnabled, settings } = useModule("forms-pro");
  
  const submitForm = async (formId: string, data: Record<string, unknown>) => {
    if (!isEnabled) {
      throw new Error("Forms module not enabled");
    }
    
    // Real implementation would submit to forms API
    console.log("[Forms] Submit:", formId, data);
    return { success: true };
  };

  return {
    isEnabled,
    submitForm,
    settings,
  };
}

// Hook to check if blog module is available
export function useBlog() {
  const { isEnabled, settings } = useModule("blog");
  
  return {
    isEnabled,
    postsPerPage: (settings?.postsPerPage as number) || 10,
    commentsEnabled: (settings?.enableComments as boolean) ?? true,
  };
}

// Hook to check if multilingual module is available
export function useMultilingual() {
  const { isEnabled, settings } = useModule("multilingual");
  
  return {
    isEnabled,
    languages: (settings?.languages as string[]) || ["en"],
    currentLanguage: (settings?.currentLanguage as string) || "en",
  };
}

// Generic hook to use any module's features
export function useModuleFeature<T = unknown>(
  slug: string,
  featureExtractor: (settings: Record<string, unknown>) => T
): { isEnabled: boolean; feature: T | null } {
  const { isEnabled, settings } = useModule(slug);
  
  return {
    isEnabled,
    feature: isEnabled && settings ? featureExtractor(settings) : null,
  };
}
```

---

## 📐 Acceptance Criteria

- [ ] ModuleProvider wraps rendered sites
- [ ] Modules load from database correctly
- [ ] useModule hook returns correct state
- [ ] Injection points work (head, body-start, body-end)
- [ ] Analytics module tracks events when enabled
- [ ] Module settings passed to components
- [ ] Disabled modules don't render anything
- [ ] Feature hooks return correct enabled state

---

## 📁 Files Created This Phase

```
src/lib/modules/
├── module-context.tsx
├── module-loader.ts
├── components.tsx
└── hooks.ts

src/components/modules/
├── module-injector.tsx
├── analytics/
│   └── analytics-script.tsx
├── seo/
│   └── seo-head.tsx
├── forms/
│   └── forms-styles.tsx
└── blog/
    └── blog-widget.tsx

src/app/api/sites/[siteId]/modules/enabled/
└── route.ts
```

---

## ➡️ Next Phase

**Phase 33: Billing & Payments - Foundation** - Stripe setup, customer creation, pricing tables.
