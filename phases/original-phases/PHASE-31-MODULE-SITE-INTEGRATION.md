# Phase 31: Module System - Site Integration

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Enable/disable modules per site and configure module-specific settings.

---

## 📋 Prerequisites

- [ ] Phase 30 completed (Marketplace UI)

---

## ✅ Tasks

### Task 31.1: Site Modules API

**File: `src/app/api/sites/[siteId]/modules/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ siteId: string }>;
}

// GET - List modules for a site
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { siteId } = await context.params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get site with client info to check agency
    const { data: site } = await supabase
      .from("sites")
      .select("client:clients(agency_id)")
      .eq("id", siteId)
      .single();

    if (!site?.client?.agency_id) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Get all modules subscribed by the agency
    const { data: agencyModules } = await supabase
      .from("module_subscriptions")
      .select(`
        module:modules(*)
      `)
      .eq("agency_id", site.client.agency_id)
      .eq("status", "active");

    // Get modules enabled for this site
    const { data: siteModules } = await supabase
      .from("site_modules")
      .select(`
        *,
        module:modules(*)
      `)
      .eq("site_id", siteId);

    // Create a map of enabled modules
    const enabledMap = new Map(siteModules?.map((sm) => [sm.module_id, sm]) || []);

    // Combine data
    const result = agencyModules?.map((sub) => ({
      module: sub.module,
      siteModule: enabledMap.get(sub.module?.id || ""),
      isEnabled: enabledMap.has(sub.module?.id || ""),
    })) || [];

    return NextResponse.json(result);
  } catch (error) {
    console.error("Site modules error:", error);
    return NextResponse.json(
      { error: "Failed to fetch site modules" },
      { status: 500 }
    );
  }
}

// POST - Enable a module for a site
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { siteId } = await context.params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { moduleId, settings = {} } = body;

    if (!moduleId) {
      return NextResponse.json(
        { error: "Module ID required" },
        { status: 400 }
      );
    }

    // Verify agency has this module subscribed
    const { data: site } = await supabase
      .from("sites")
      .select("client:clients(agency_id)")
      .eq("id", siteId)
      .single();

    if (!site?.client?.agency_id) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const { data: subscription } = await supabase
      .from("module_subscriptions")
      .select("id")
      .eq("agency_id", site.client.agency_id)
      .eq("module_id", moduleId)
      .eq("status", "active")
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: "Module not subscribed. Subscribe in the marketplace first." },
        { status: 400 }
      );
    }

    // Check if already enabled
    const { data: existing } = await supabase
      .from("site_modules")
      .select("id")
      .eq("site_id", siteId)
      .eq("module_id", moduleId)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from("site_modules")
        .update({
          is_enabled: true,
          settings,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    // Create new
    const { data, error } = await supabase
      .from("site_modules")
      .insert({
        site_id: siteId,
        module_id: moduleId,
        settings,
        is_enabled: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Enable module error:", error);
    return NextResponse.json(
      { error: "Failed to enable module" },
      { status: 500 }
    );
  }
}
```

**File: `src/app/api/sites/[siteId]/modules/[moduleId]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ siteId: string; moduleId: string }>;
}

// PATCH - Update module settings or disable
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { siteId, moduleId } = await context.params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { isEnabled, settings } = body;

    const updates: Record<string, unknown> = {};
    if (typeof isEnabled === "boolean") updates.is_enabled = isEnabled;
    if (settings) updates.settings = settings;

    const { data, error } = await supabase
      .from("site_modules")
      .update(updates)
      .eq("site_id", siteId)
      .eq("module_id", moduleId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update module error:", error);
    return NextResponse.json(
      { error: "Failed to update module" },
      { status: 500 }
    );
  }
}

// DELETE - Disable module for site
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { siteId, moduleId } = await context.params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("site_modules")
      .update({ is_enabled: false })
      .eq("site_id", siteId)
      .eq("module_id", moduleId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Disable module error:", error);
    return NextResponse.json(
      { error: "Failed to disable module" },
      { status: 500 }
    );
  }
}
```

### Task 31.2: Site Modules Hook

**File: `src/hooks/use-site-modules.ts`**

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Module, SiteModule } from "@/types/modules";

interface SiteModuleWithDetails {
  module: Module;
  siteModule: SiteModule | null;
  isEnabled: boolean;
}

export function useSiteModules(siteId: string) {
  return useQuery({
    queryKey: ["site-modules", siteId],
    queryFn: async (): Promise<SiteModuleWithDetails[]> => {
      const response = await fetch(`/api/sites/${siteId}/modules`);
      if (!response.ok) throw new Error("Failed to fetch site modules");
      return response.json();
    },
    enabled: !!siteId,
  });
}

export function useEnableSiteModule(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      moduleId,
      settings = {},
    }: {
      moduleId: string;
      settings?: Record<string, unknown>;
    }) => {
      const response = await fetch(`/api/sites/${siteId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, settings }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to enable module");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-modules", siteId] });
    },
  });
}

export function useUpdateSiteModule(siteId: string, moduleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: {
      isEnabled?: boolean;
      settings?: Record<string, unknown>;
    }) => {
      const response = await fetch(`/api/sites/${siteId}/modules/${moduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update module");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-modules", siteId] });
    },
  });
}

export function useDisableSiteModule(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (moduleId: string) => {
      const response = await fetch(`/api/sites/${siteId}/modules/${moduleId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to disable module");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-modules", siteId] });
    },
  });
}
```

### Task 31.3: Site Modules Tab Component

**File: `src/components/sites/site-modules-tab.tsx`**

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useSiteModules,
  useEnableSiteModule,
  useDisableSiteModule,
} from "@/hooks/use-site-modules";
import {
  Package,
  Settings,
  Loader2,
  ExternalLink,
  BarChart3,
  Search,
  FileText,
  ShoppingCart,
  Newspaper,
  Globe,
  Users,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3,
  Search,
  FileText,
  ShoppingCart,
  Newspaper,
  Globe,
  Users,
  Calendar,
  Package,
};

interface SiteModulesTabProps {
  siteId: string;
}

export function SiteModulesTab({ siteId }: SiteModulesTabProps) {
  const { data: modules, isLoading } = useSiteModules(siteId);
  const enableMutation = useEnableSiteModule(siteId);
  const disableMutation = useDisableSiteModule(siteId);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (moduleId: string, currentlyEnabled: boolean) => {
    setTogglingId(moduleId);
    
    try {
      if (currentlyEnabled) {
        await disableMutation.mutateAsync(moduleId);
        toast.success("Module disabled");
      } else {
        await enableMutation.mutateAsync({ moduleId });
        toast.success("Module enabled");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update module");
    } finally {
      setTogglingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!modules?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="font-medium mb-1">No modules available</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Subscribe to modules in the marketplace to enable them for this site
        </p>
        <Button asChild>
          <Link href="/marketplace">
            <ExternalLink className="w-4 h-4 mr-2" />
            Browse Marketplace
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Site Modules</h3>
          <p className="text-sm text-muted-foreground">
            Enable or disable modules for this site
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/marketplace">
            <Package className="w-4 h-4 mr-2" />
            Get More Modules
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {modules.map(({ module, siteModule, isEnabled }) => {
          const Icon = iconMap[module.icon] || Package;
          const isToggling = togglingId === module.id;

          return (
            <Card key={module.id}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{module.name}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isEnabled && (
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4 mr-1" />
                        Configure
                      </Button>
                    )}
                    <Switch
                      checked={isEnabled}
                      disabled={isToggling}
                      onCheckedChange={() => handleToggle(module.id, isEnabled)}
                    />
                  </div>
                </div>
              </CardHeader>
              {isEnabled && siteModule && (
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">Enabled</Badge>
                    <span>
                      Since {new Date(siteModule.enabled_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

### Task 31.4: Module Settings Dialog

**File: `src/components/modules/module-settings-dialog.tsx`**

```typescript
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUpdateSiteModule } from "@/hooks/use-site-modules";
import type { Module, SiteModule } from "@/types/modules";
import { toast } from "sonner";

interface ModuleSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  module: Module;
  siteModule: SiteModule | null;
}

// Module-specific settings schemas
const moduleSettingsSchemas: Record<string, Array<{
  key: string;
  label: string;
  type: "text" | "switch" | "number";
  default?: unknown;
  description?: string;
}>> = {
  analytics: [
    {
      key: "trackClicks",
      label: "Track Clicks",
      type: "switch",
      default: true,
      description: "Track user click events",
    },
    {
      key: "trackScrollDepth",
      label: "Track Scroll Depth",
      type: "switch",
      default: true,
      description: "Track how far users scroll",
    },
    {
      key: "excludedPaths",
      label: "Excluded Paths",
      type: "text",
      default: "/admin,/dashboard",
      description: "Comma-separated paths to exclude",
    },
  ],
  "seo-pro": [
    {
      key: "autoSitemap",
      label: "Auto-generate Sitemap",
      type: "switch",
      default: true,
    },
    {
      key: "addSchema",
      label: "Add Schema Markup",
      type: "switch",
      default: true,
    },
  ],
  "forms-pro": [
    {
      key: "saveSubmissions",
      label: "Save Submissions",
      type: "switch",
      default: true,
    },
    {
      key: "emailNotifications",
      label: "Email Notifications",
      type: "switch",
      default: true,
    },
    {
      key: "notificationEmail",
      label: "Notification Email",
      type: "text",
      default: "",
    },
  ],
  blog: [
    {
      key: "postsPerPage",
      label: "Posts Per Page",
      type: "number",
      default: 10,
    },
    {
      key: "enableComments",
      label: "Enable Comments",
      type: "switch",
      default: true,
    },
    {
      key: "moderateComments",
      label: "Moderate Comments",
      type: "switch",
      default: true,
    },
  ],
};

export function ModuleSettingsDialog({
  open,
  onOpenChange,
  siteId,
  module,
  siteModule,
}: ModuleSettingsDialogProps) {
  const updateMutation = useUpdateSiteModule(siteId, module.id);
  const [settings, setSettings] = useState<Record<string, unknown>>({});

  const schema = moduleSettingsSchemas[module.slug] || [];

  useEffect(() => {
    // Initialize settings with current values or defaults
    const initial: Record<string, unknown> = {};
    schema.forEach((field) => {
      initial[field.key] = siteModule?.settings?.[field.key] ?? field.default;
    });
    setSettings(initial);
  }, [module.slug, siteModule, open]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ settings });
      toast.success("Settings saved");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  const updateSetting = (key: string, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{module.name} Settings</DialogTitle>
          <DialogDescription>
            Configure how this module works on your site
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {schema.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No configurable settings for this module
            </p>
          ) : (
            schema.map((field) => (
              <div key={field.key} className="space-y-2">
                {field.type === "switch" ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{field.label}</Label>
                      {field.description && (
                        <p className="text-xs text-muted-foreground">
                          {field.description}
                        </p>
                      )}
                    </div>
                    <Switch
                      checked={settings[field.key] as boolean}
                      onCheckedChange={(checked) =>
                        updateSetting(field.key, checked)
                      }
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor={field.key}>{field.label}</Label>
                    {field.description && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {field.description}
                      </p>
                    )}
                    <Input
                      id={field.key}
                      type={field.type}
                      value={settings[field.key] as string}
                      onChange={(e) =>
                        updateSetting(
                          field.key,
                          field.type === "number"
                            ? parseInt(e.target.value)
                            : e.target.value
                        )
                      }
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || schema.length === 0}
          >
            {updateMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Task 31.5: Update Site Detail Page with Modules Tab

Update site detail page to include modules tab - reference from Phase 14.

Add tab to site settings:
```typescript
<TabsContent value="modules">
  <SiteModulesTab siteId={siteId} />
</TabsContent>
```

---

## 📐 Acceptance Criteria

- [ ] API lists available modules for site
- [ ] Modules can be enabled/disabled per site
- [ ] Toggle reflects current state
- [ ] Settings dialog shows module-specific options
- [ ] Settings persist on save
- [ ] Error states handled gracefully
- [ ] Empty state directs to marketplace
- [ ] Only subscribed modules appear

---

## 📁 Files Created This Phase

```
src/app/api/sites/[siteId]/modules/
├── route.ts
└── [moduleId]/
    └── route.ts

src/hooks/
└── use-site-modules.ts

src/components/sites/
└── site-modules-tab.tsx

src/components/modules/
└── module-settings-dialog.tsx
```

---

## ➡️ Next Phase

**Phase 32: Module System - Runtime Integration** - Module loading, hooks, and component injection.
