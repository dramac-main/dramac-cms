# Phase 76B3: Client Portal Apps UI

> **AI Model**: Claude Opus 4.5 (1x) ⭐ CRITICAL PHASE
>
> **Priority**: 🔴 CRITICAL - CORE BUSINESS MODEL
>
> **Estimated Time**: 6-8 hours
>
> **Depends On**: Phase 76A (Architecture), Phase 76B1 (Admin UI), Phase 76B2 (Agency UI)
>
> **Part Of**: Phase 76B Series (Split for focused implementation)
> - **76B1**: Super Admin Module Management ✅
> - **76B2**: Agency Marketplace & Pricing ✅
> - **76B3**: Client Portal Apps (THIS PHASE)

---

## 🎯 Objective

Build the **Client Portal** interface for modules:

1. **Apps Grid** - Client's installed modules displayed as app icons
2. **Module Launcher** - Open modules in dedicated interface
3. **Sandbox Execution** - Secure module runtime environment
4. **Module Widgets** - Dashboard widgets from modules
5. **Module Activation** - Request new modules from agency

This is where **clients use their apps/modules** - like an App Store on their phone.

---

## 📋 Prerequisites

- [ ] Phase 76A completed (Architecture & Database)
- [ ] Phase 76B1 completed (Admin UI)
- [ ] Phase 76B2 completed (Agency Marketplace)
- [ ] Client portal exists at `/portal`
- [ ] `client_module_installations` table created
- [ ] `site_module_installations` table created

---

## 🏗️ UI Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT PORTAL                                │
│  /portal                                                         │
│  ├── page.tsx                   → Dashboard with widgets        │
│  │                                                               │
│  /portal/apps                                                    │
│  ├── page.tsx                   → Apps grid (installed modules) │
│  ├── /[moduleId]/page.tsx       → Module launcher/runner        │
│  └── /browse/page.tsx           → Request new modules           │
│                                                                  │
│  /portal/sites/[siteId]/apps                                     │
│  ├── page.tsx                   → Site-specific apps            │
│  └── /[moduleId]/page.tsx       → Site module runner            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Files to Create

```
src/components/portal/
├── portal-header.tsx                  # UPDATE - Add Apps navigation link

src/app/(portal)/portal/
├── page.tsx                           # Portal dashboard (updated with widgets)

src/app/(portal)/portal/apps/
├── page.tsx                           # Apps grid
├── [moduleId]/page.tsx                # Module launcher
└── browse/page.tsx                    # Browse available modules

src/app/(portal)/portal/sites/[siteId]/apps/
├── page.tsx                           # Site-specific apps
└── [moduleId]/page.tsx                # Site module runner

src/components/portal/apps/
├── apps-grid.tsx                      # Grid of app icons
├── app-card.tsx                       # Individual app card
├── app-launcher.tsx                   # Module launch interface
├── available-apps-grid.tsx            # Modules client can request
├── request-app-dialog.tsx             # Request from agency
├── app-iframe-sandbox.tsx             # Secure iframe container
├── module-widgets-grid.tsx            # Dashboard widgets from modules

src/lib/modules/
├── runtime.ts                         # Module runtime utilities
├── sandbox.ts                         # Sandbox security
├── permissions.ts                     # Module permissions

src/app/api/portal/
├── modules/route.ts                   # GET client's modules
├── modules/[id]/route.ts              # GET module details
├── modules/request/route.ts           # POST request module
└── widgets/route.ts                   # GET widgets for dashboard
```

---

## ✅ Tasks

### Task 76B3.0: Update Portal Navigation (CRITICAL)

**File: `src/components/portal/portal-header.tsx`** (UPDATE)

Add "Apps" link to the portal navigation so clients can access the apps section.

```tsx
<nav className="flex items-center gap-4">
  <Link href="/portal" className="text-sm font-medium hover:underline">
    Dashboard
  </Link>
  <Link href="/portal/apps" className="text-sm font-medium hover:underline">
    Apps
  </Link>
  <Link href="/portal" className="text-sm font-medium hover:underline">
    My Sites
  </Link>
  <Link href="/portal/support" className="text-sm font-medium hover:underline">
    Support
  </Link>
</nav>
```

---

### Task 76B3.1: Client Apps Grid Page

**File: `src/app/(portal)/portal/apps/page.tsx`**

```tsx
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Grid3x3, Package, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AppsGrid } from "@/components/portal/apps/apps-grid";
import { EmptyAppsState } from "@/components/portal/apps/empty-apps-state";

export const metadata: Metadata = {
  title: "My Apps | Client Portal",
  description: "Access your installed apps and modules",
};

export default async function PortalAppsPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user's client_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("client_id")
    .eq("id", user.id)
    .single();

  if (!profile?.client_id) {
    redirect("/portal");
  }

  // Get installed client-level modules
  const { data: installations } = await supabase
    .from("client_module_installations")
    .select(`
      *,
      module:modules(*),
      installed_by_profile:profiles!installed_by(full_name)
    `)
    .eq("client_id", profile.client_id)
    .eq("is_active", true)
    .order("installed_at", { ascending: false });

  const installedModules = installations?.map(i => ({
    ...i.module,
    installation_id: i.id,
    installed_at: i.installed_at,
    settings: i.settings,
    custom_name: i.custom_name,
    custom_icon: i.custom_icon,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Grid3x3 className="h-8 w-8" />
            My Apps
          </h1>
          <p className="text-muted-foreground">
            Access your business tools and applications
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/apps/browse">
            <Plus className="h-4 w-4 mr-2" />
            Browse Apps
          </Link>
        </Button>
      </div>

      {/* Search */}
      {installedModules.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your apps..."
            className="pl-10"
          />
        </div>
      )}

      {/* Apps Grid */}
      {installedModules.length === 0 ? (
        <EmptyAppsState />
      ) : (
        <AppsGrid modules={installedModules} />
      )}
    </div>
  );
}
```

---

### Task 76B3.2: Apps Grid Component

**File: `src/components/portal/apps/apps-grid.tsx`**

```tsx
import Link from "next/link";
import { AppCard } from "./app-card";

interface Module {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  slug: string;
  category: string;
  installation_id: string;
  installed_at: string;
  settings: Record<string, any>;
  custom_name: string | null;
  custom_icon: string | null;
}

interface AppsGridProps {
  modules: Module[];
}

export function AppsGrid({ modules }: AppsGridProps) {
  // Group by category
  const categories = modules.reduce((acc, module) => {
    const cat = module.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  return (
    <div className="space-y-8">
      {Object.entries(categories).map(([category, categoryModules]) => (
        <section key={category}>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground capitalize">
            {category}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {categoryModules.map((module) => (
              <Link 
                key={module.installation_id} 
                href={`/portal/apps/${module.id}`}
              >
                <AppCard module={module} />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
```

---

### Task 76B3.3: App Card Component

**File: `src/components/portal/apps/app-card.tsx`**

```tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Module {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  custom_name: string | null;
  custom_icon: string | null;
}

interface AppCardProps {
  module: Module;
  className?: string;
}

export function AppCard({ module, className }: AppCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  
  const displayName = module.custom_name || module.name;
  const displayIcon = module.custom_icon || module.icon || "📦";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-xl",
        "bg-card border hover:border-primary/50 transition-all cursor-pointer",
        "hover:shadow-lg hover:-translate-y-0.5",
        isPressed && "scale-95",
        className
      )}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      {/* App Icon */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-4xl mb-3 shadow-sm">
        {displayIcon}
      </div>
      
      {/* App Name */}
      <span className="text-sm font-medium text-center line-clamp-2">
        {displayName}
      </span>
    </div>
  );
}
```

---

### Task 76B3.4: Empty Apps State

**File: `src/components/portal/apps/empty-apps-state.tsx`**

```tsx
import Link from "next/link";
import { Package, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyAppsState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
          <Package className="h-10 w-10 text-primary" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">No Apps Yet</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          Your agency can set up powerful tools and applications for your business. 
          Browse available apps to get started!
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild>
            <Link href="/portal/apps/browse">
              <Sparkles className="h-4 w-4 mr-2" />
              Browse Available Apps
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/portal/help">
              Learn More
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Task 76B3.5: Module Launcher Page

**File: `src/app/(portal)/portal/apps/[moduleId]/page.tsx`**

```tsx
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Settings, Maximize2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AppLauncher } from "@/components/portal/apps/app-launcher";

interface PageProps {
  params: Promise<{ moduleId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { moduleId } = await params;
  const supabase = await createClient();
  
  const { data: module } = await supabase
    .from("modules")
    .select("name, description")
    .eq("id", moduleId)
    .single();

  return {
    title: `${module?.name || "App"} | Client Portal`,
    description: module?.description || "Use your installed app",
  };
}

export default async function ModuleLauncherPage({ params }: PageProps) {
  const { moduleId } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user's client_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("client_id")
    .eq("id", user.id)
    .single();

  if (!profile?.client_id) {
    redirect("/portal");
  }

  // Verify module is installed for this client
  const { data: installation } = await supabase
    .from("client_module_installations")
    .select(`
      *,
      module:modules(*)
    `)
    .eq("client_id", profile.client_id)
    .eq("module_id", moduleId)
    .eq("is_active", true)
    .single();

  if (!installation) {
    notFound();
  }

  const module = installation.module as any;

  return (
    <div className="h-screen flex flex-col">
      {/* App Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/portal/apps">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-2xl">{module.icon || "📦"}</span>
            <div>
              <h1 className="font-semibold">{module.name}</h1>
              <p className="text-xs text-muted-foreground">{module.category}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {module.settings_schema && (
            <Button variant="ghost" size="icon" title="App Settings">
              <Settings className="h-4 w-4" />
            </Button>
          )}
          {module.external_url && (
            <Button variant="ghost" size="icon" asChild title="Open in New Window">
              <a href={module.external_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
          <Button variant="ghost" size="icon" title="Fullscreen">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* App Content */}
      <div className="flex-1 overflow-hidden">
        <AppLauncher 
          module={module}
          installation={installation}
          clientId={profile.client_id}
        />
      </div>
    </div>
  );
}
```

---

### Task 76B3.6: App Launcher Component

**File: `src/components/portal/apps/app-launcher.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppIframeSandbox } from "./app-iframe-sandbox";

interface Module {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  slug: string;
  runtime_type: "iframe" | "embedded" | "external" | "native";
  app_url: string | null;
  external_url: string | null;
  entry_component: string | null;
}

interface Installation {
  id: string;
  settings: Record<string, any>;
  custom_name: string | null;
}

interface AppLauncherProps {
  module: Module;
  installation: Installation;
  clientId: string;
}

export function AppLauncher({ module, installation, clientId }: AppLauncherProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine how to render the module
  const runtimeType = module.runtime_type || "iframe";

  useEffect(() => {
    // Simulate initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading {module.name}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load app</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Iframe-based module
  if (runtimeType === "iframe" && module.app_url) {
    return (
      <AppIframeSandbox
        moduleId={module.id}
        appUrl={module.app_url}
        clientId={clientId}
        settings={installation.settings}
      />
    );
  }

  // External URL module (opens in iframe or redirects)
  if (runtimeType === "external" && module.external_url) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <span className="text-6xl mb-4 block">{module.icon || "🔗"}</span>
          <h2 className="text-xl font-semibold mb-2">{module.name}</h2>
          <p className="text-muted-foreground mb-4">
            This app opens in a new window
          </p>
          <a
            href={module.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Open {module.name}
          </a>
        </div>
      </div>
    );
  }

  // Native embedded component
  if (runtimeType === "native" || runtimeType === "embedded") {
    // Dynamic component loading would go here
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">{module.icon || "📦"}</span>
          <h2 className="text-xl font-semibold mb-2">{module.name}</h2>
          <p className="text-muted-foreground">
            Native component: {module.entry_component}
          </p>
        </div>
      </div>
    );
  }

  // Fallback - no runtime configured
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md">
        <span className="text-6xl mb-4 block">{module.icon || "📦"}</span>
        <h2 className="text-xl font-semibold mb-2">{module.name}</h2>
        <p className="text-muted-foreground">{module.description}</p>
        <p className="text-sm text-muted-foreground mt-4">
          This module is being configured by your agency.
        </p>
      </div>
    </div>
  );
}
```

---

### Task 76B3.7: Iframe Sandbox Component

**File: `src/components/portal/apps/app-iframe-sandbox.tsx`**

```tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AppIframeSandboxProps {
  moduleId: string;
  appUrl: string;
  clientId: string;
  settings?: Record<string, any>;
  className?: string;
}

export function AppIframeSandbox({
  moduleId,
  appUrl,
  clientId,
  settings,
  className,
}: AppIframeSandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Build URL with context parameters
  const buildUrl = () => {
    const url = new URL(appUrl);
    url.searchParams.set("clientId", clientId);
    url.searchParams.set("moduleId", moduleId);
    url.searchParams.set("context", "portal");
    
    // Add any settings as URL params (limited)
    if (settings) {
      Object.entries(settings).forEach(([key, value]) => {
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          url.searchParams.set(`s_${key}`, String(value));
        }
      });
    }
    
    return url.toString();
  };

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin
      if (!appUrl.startsWith(event.origin)) return;

      const { type, payload } = event.data || {};

      switch (type) {
        case "module:ready":
          console.log("Module ready:", moduleId);
          break;
        case "module:resize":
          // Handle dynamic resize if needed
          break;
        case "module:navigate":
          // Handle navigation requests
          break;
        case "module:error":
          console.error("Module error:", payload);
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [appUrl, moduleId]);

  // Send context to iframe when loaded
  const handleLoad = () => {
    setIsLoaded(true);
    
    // Send initial context to iframe
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: "portal:context",
        payload: {
          clientId,
          moduleId,
          settings,
        },
      }, "*");
    }
  };

  return (
    <div className={cn("relative w-full h-full", className)}>
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={buildUrl()}
        onLoad={handleLoad}
        className={cn(
          "w-full h-full border-0 transition-opacity",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        allow="clipboard-write; clipboard-read"
        title={`Module: ${moduleId}`}
      />
    </div>
  );
}
```

---

### Task 76B3.8: Browse Available Apps Page

**File: `src/app/(portal)/portal/apps/browse/page.tsx`**

```tsx
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Package, ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AvailableAppsGrid } from "@/components/portal/apps/available-apps-grid";

export const metadata: Metadata = {
  title: "Browse Apps | Client Portal",
  description: "Discover available apps for your business",
};

export default async function BrowseAppsPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user's client with agency
  const { data: profile } = await supabase
    .from("profiles")
    .select("client_id")
    .eq("id", user.id)
    .single();

  if (!profile?.client_id) {
    redirect("/portal");
  }

  // Get client's agency
  const { data: client } = await supabase
    .from("clients")
    .select("agency_id")
    .eq("id", profile.client_id)
    .single();

  if (!client?.agency_id) {
    redirect("/portal");
  }

  // Get already installed modules
  const { data: installations } = await supabase
    .from("client_module_installations")
    .select("module_id")
    .eq("client_id", profile.client_id);

  const installedModuleIds = new Set(installations?.map(i => i.module_id) || []);

  // Get available modules (agency has subscribed to + client level)
  const { data: availableSubscriptions } = await supabase
    .from("agency_module_subscriptions")
    .select(`
      *,
      module:modules(*)
    `)
    .eq("agency_id", client.agency_id)
    .eq("status", "active");

  // Filter to client-level modules that aren't already installed
  const availableModules = availableSubscriptions
    ?.filter(sub => {
      const module = sub.module as any;
      return module?.install_level === "client" && !installedModuleIds.has(module.id);
    })
    .map(sub => ({
      ...(sub.module as any),
      agencyPrice: calculateRetailPrice(sub),
    })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link 
          href="/portal/apps" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Apps
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Package className="h-8 w-8" />
          Browse Available Apps
        </h1>
        <p className="text-muted-foreground">
          Discover powerful apps to enhance your business operations
        </p>
      </div>

      {/* Available Apps */}
      <AvailableAppsGrid 
        modules={availableModules}
        clientId={profile.client_id}
      />
    </div>
  );
}

function calculateRetailPrice(subscription: any): number {
  const wholesale = subscription.module?.wholesale_price_monthly || 0;
  
  switch (subscription.markup_type) {
    case "percentage":
      return wholesale + (wholesale * (subscription.markup_percentage || 100) / 100);
    case "fixed":
      return wholesale + (subscription.markup_fixed_amount || 0);
    case "custom":
      return subscription.custom_price_monthly || wholesale;
    case "passthrough":
      return wholesale;
    default:
      return wholesale * 2; // Default 100% markup
  }
}
```

---

### Task 76B3.9: Available Apps Grid Component

**File: `src/components/portal/apps/available-apps-grid.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Package, Star, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RequestAppDialog } from "./request-app-dialog";

interface Module {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  agencyPrice: number; // in cents
  is_featured: boolean;
}

interface AvailableAppsGridProps {
  modules: Module[];
  clientId: string;
}

export function AvailableAppsGrid({ modules, clientId }: AvailableAppsGridProps) {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [requestedModules, setRequestedModules] = useState<Set<string>>(new Set());

  const formatPrice = (cents: number) => {
    if (!cents || cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}/mo`;
  };

  if (modules.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No Additional Apps Available</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            You have access to all available apps! Check back later for new additions 
            or contact your agency about specific needs.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module) => {
          const isRequested = requestedModules.has(module.id);
          
          return (
            <Card key={module.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-3xl">
                    {module.icon || "📦"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{module.name}</CardTitle>
                      {module.is_featured && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <Badge variant="outline" className="mt-1">{module.category}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {module.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary">
                    {formatPrice(module.agencyPrice)}
                  </span>
                  
                  {isRequested ? (
                    <Button variant="outline" disabled>
                      <Check className="h-4 w-4 mr-2" />
                      Requested
                    </Button>
                  ) : (
                    <Button onClick={() => setSelectedModule(module)}>
                      Request App
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Request Dialog */}
      {selectedModule && (
        <RequestAppDialog
          module={selectedModule}
          clientId={clientId}
          open={!!selectedModule}
          onOpenChange={(open) => !open && setSelectedModule(null)}
          onSuccess={() => {
            setRequestedModules(prev => new Set([...prev, selectedModule.id]));
            setSelectedModule(null);
          }}
        />
      )}
    </>
  );
}
```

---

### Task 76B3.10: Request App Dialog

**File: `src/components/portal/apps/request-app-dialog.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Module {
  id: string;
  name: string;
  icon: string;
  agencyPrice: number;
}

interface RequestAppDialogProps {
  module: Module;
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RequestAppDialog({
  module,
  clientId,
  open,
  onOpenChange,
  onSuccess,
}: RequestAppDialogProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPrice = (cents: number) => {
    if (!cents || cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}/mo`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/portal/modules/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: module.id,
          clientId,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send request");
      }

      toast.success("Request sent!", {
        description: "Your agency will review your request and get back to you.",
      });
      onSuccess();
    } catch (error) {
      toast.error("Failed to send request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-3xl">{module.icon || "📦"}</span>
            Request {module.name}
          </DialogTitle>
          <DialogDescription>
            Send a request to your agency to add this app to your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Price Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Price</span>
              <span className="font-semibold">{formatPrice(module.agencyPrice)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Pricing is set by your agency. Final pricing may vary.
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Message to Agency (optional)
            </label>
            <Textarea
              placeholder="Tell your agency why you need this app..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Task 76B3.11: Portal Dashboard with Widgets

**File: `src/components/portal/apps/module-widgets-grid.tsx`**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ModuleWidget {
  moduleId: string;
  moduleName: string;
  moduleIcon: string;
  widgetType: "stats" | "chart" | "list" | "custom";
  widgetSize: "small" | "medium" | "large";
  data: any;
}

interface ModuleWidgetsGridProps {
  widgets: ModuleWidget[];
}

export function ModuleWidgetsGrid({ widgets }: ModuleWidgetsGridProps) {
  if (widgets.length === 0) {
    return null;
  }

  const getWidgetCols = (size: string) => {
    switch (size) {
      case "small": return "col-span-1";
      case "medium": return "col-span-2";
      case "large": return "col-span-3";
      default: return "col-span-1";
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Quick Stats from Your Apps</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {widgets.map((widget, index) => (
          <Card key={`${widget.moduleId}-${index}`} className={getWidgetCols(widget.widgetSize)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span>{widget.moduleIcon}</span>
                {widget.moduleName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {widget.widgetType === "stats" && (
                <div className="text-2xl font-bold">
                  {widget.data?.value || "—"}
                </div>
              )}
              {widget.widgetType === "list" && (
                <ul className="space-y-1 text-sm">
                  {(widget.data?.items || []).slice(0, 3).map((item: any, i: number) => (
                    <li key={i} className="text-muted-foreground">
                      • {item.label}
                    </li>
                  ))}
                </ul>
              )}
              {widget.widgetType === "custom" && (
                <div className="text-sm text-muted-foreground">
                  Custom widget content
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
```

---

### Task 76B3.12: Site-Level Apps Page

**File: `src/app/(portal)/portal/sites/[siteId]/apps/page.tsx`**

```tsx
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Globe, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AppsGrid } from "@/components/portal/apps/apps-grid";
import { EmptyAppsState } from "@/components/portal/apps/empty-apps-state";

interface PageProps {
  params: Promise<{ siteId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { siteId } = await params;
  const supabase = await createClient();
  
  const { data: site } = await supabase
    .from("sites")
    .select("name")
    .eq("id", siteId)
    .single();

  return {
    title: `${site?.name || "Site"} Apps | Client Portal`,
    description: "Manage apps for this website",
  };
}

export default async function SiteAppsPage({ params }: PageProps) {
  const { siteId } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user's client_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("client_id")
    .eq("id", user.id)
    .single();

  if (!profile?.client_id) {
    redirect("/portal");
  }

  // Verify site belongs to client
  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .eq("client_id", profile.client_id)
    .single();

  if (!site) {
    notFound();
  }

  // Get site-level module installations
  const { data: installations } = await supabase
    .from("site_module_installations")
    .select(`
      *,
      module:modules(*)
    `)
    .eq("site_id", siteId)
    .eq("is_active", true)
    .order("installed_at", { ascending: false });

  const installedModules = installations?.map(i => ({
    ...i.module,
    installation_id: i.id,
    installed_at: i.installed_at,
    settings: i.settings,
    custom_name: i.custom_name,
    custom_icon: i.custom_icon,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link 
          href={`/portal/sites/${siteId}`} 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {site.name}
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Globe className="h-8 w-8" />
              Site Apps
            </h1>
            <p className="text-muted-foreground">
              Apps installed on {site.name}
            </p>
          </div>
        </div>
      </div>

      {/* Apps Grid */}
      {installedModules.length === 0 ? (
        <EmptyAppsState />
      ) : (
        <AppsGrid modules={installedModules} />
      )}
    </div>
  );
}
```

---

### Task 76B3.13: Portal API Routes

**File: `src/app/api/portal/modules/route.ts`**

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

    // Get user's client_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("client_id")
      .eq("id", user.id)
      .single();

    if (!profile?.client_id) {
      return NextResponse.json({ error: "No client found" }, { status: 400 });
    }

    // Get installed modules
    const { data: installations, error } = await supabase
      .from("client_module_installations")
      .select(`
        *,
        module:modules(*)
      `)
      .eq("client_id", profile.client_id)
      .eq("is_active", true)
      .order("installed_at", { ascending: false });

    if (error) {
      console.error("Fetch modules error:", error);
      return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 });
    }

    return NextResponse.json({ modules: installations });
  } catch (error) {
    console.error("Fetch modules error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

**File: `src/app/api/portal/modules/request/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { moduleId, clientId, message } = await request.json();

    // Verify user belongs to this client
    const { data: profile } = await supabase
      .from("profiles")
      .select("client_id")
      .eq("id", user.id)
      .single();

    if (profile?.client_id !== clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get client's agency
    const { data: client } = await supabase
      .from("clients")
      .select("agency_id")
      .eq("id", clientId)
      .single();

    // Create app request notification/record
    // This could be a notifications table, activity log, or direct message
    const { data, error } = await supabase
      .from("activity_log")
      .insert({
        agency_id: client?.agency_id,
        client_id: clientId,
        user_id: user.id,
        action: "module_request",
        entity_type: "module",
        entity_id: moduleId,
        metadata: {
          message,
          status: "pending",
        },
      })
      .select()
      .single();

    if (error) {
      console.error("Create request error:", error);
      return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
    }

    return NextResponse.json({ success: true, request: data });
  } catch (error) {
    console.error("Module request error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

**File: `src/app/api/portal/widgets/route.ts`**

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

    // Get user's client_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("client_id")
      .eq("id", user.id)
      .single();

    if (!profile?.client_id) {
      return NextResponse.json({ widgets: [] });
    }

    // Get installed modules that have widgets
    const { data: installations } = await supabase
      .from("client_module_installations")
      .select(`
        settings,
        module:modules(id, name, icon, widget_config)
      `)
      .eq("client_id", profile.client_id)
      .eq("is_active", true);

    // Build widget data
    const widgets = installations
      ?.filter(i => (i.module as any)?.widget_config)
      .map(i => {
        const mod = i.module as any;
        const config = mod.widget_config;
        
        return {
          moduleId: mod.id,
          moduleName: mod.name,
          moduleIcon: mod.icon,
          widgetType: config.type || "stats",
          widgetSize: config.size || "small",
          data: config.defaultData || {},
        };
      }) || [];

    return NextResponse.json({ widgets });
  } catch (error) {
    console.error("Fetch widgets error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

---

## 📊 Verification Checklist

### Apps Grid
- [ ] Apps page loads at `/portal/apps`
- [ ] Apps display in grid format
- [ ] Categories group correctly
- [ ] Empty state shows when no apps

### Module Launcher
- [ ] Module opens at `/portal/apps/[moduleId]`
- [ ] Header shows module info
- [ ] Iframe sandbox loads correctly
- [ ] External URL modules work

### Browse Apps
- [ ] Browse page loads at `/portal/apps/browse`
- [ ] Available modules display
- [ ] Request dialog works
- [ ] Already-installed modules excluded

### Site Apps
- [ ] Site apps page loads at `/portal/sites/[siteId]/apps`
- [ ] Only site-level modules show
- [ ] Proper access control

### Widgets
- [ ] Widgets load on dashboard
- [ ] Different widget types render

---

## 🔗 Related Phases

- **Phase 76A**: Architecture (prerequisite)
- **Phase 76B1**: Admin UI (prerequisite)
- **Phase 76B2**: Agency UI (prerequisite)
- **Phase 80**: Module Development Studio (next)

---

**End of Phase 76B Series**

**IMPORTANT**: After completing 76B3, mark original Phase 76B as DEPRECATED.

---

**End of Phase 76B3**
