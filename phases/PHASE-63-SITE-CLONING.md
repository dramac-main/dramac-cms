# Phase 63: Site Cloning - ADD UI Components

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟡 HIGH
>
> **Estimated Time**: 1-2 hours

---

## 🎯 Objective

ADD UI components for the existing site cloning functionality. The core cloning logic already exists.

---

## 📋 Prerequisites

- [ ] Phase 62 Error Handling completed
- [ ] Site and page management working
- [ ] Database schema understood

---

## 🔍 Current State Analysis

**What Exists:**
- ✅ `src/lib/sites/clone.ts` (365 lines) with:
  - `CloneOptions` interface
  - `CloneResult` interface
  - `cloneSite()` function - full implementation
  - Clones pages, settings, modules

**What's Missing:**
- Clone site dialog UI component
- Clone button component
- Server action wrapper
- API endpoint (optional)

---

## ⚠️ IMPORTANT: USE EXISTING CLONE FUNCTION

The core cloning logic is complete. We only need:
1. ✅ **USE** existing `cloneSite()` from `src/lib/sites/clone.ts`
2. ✅ **ADD** UI components (dialog, button)
3. ✅ **ADD** server action that calls `cloneSite()`

**DO NOT:**
- ❌ Recreate cloning logic
- ❌ Create new `clone-site.ts` or `clone-utils.ts`

---

## 💼 Business Value

1. **Template Usage** - Use any site as a template for new projects
2. **Client Onboarding** - Quickly spin up new client sites from starter templates
3. **A/B Testing** - Clone sites to test different designs
4. **Backup & Restore** - Clone before major changes
5. **Time Savings** - Hours of setup reduced to seconds

---

## 📁 Files to Create

```
src/actions/sites/
├── clone-site-action.ts        # Server action wrapping cloneSite()

src/components/sites/
├── clone-site-dialog.tsx       # Clone modal dialog
├── clone-site-button.tsx       # Trigger button
```

---

## ✅ Tasks

### Task 63.0: Verify Existing Implementation

**The clone function already exists in `src/lib/sites/clone.ts`:**

```typescript
// Already exists - USE THIS
import { cloneSite, CloneOptions, CloneResult } from "@/lib/sites/clone";

// Example usage:
const result = await cloneSite(sourceSiteId, {
  newName: "My Cloned Site",
  newSubdomain: "my-clone",
  clonePages: true,
  cloneSettings: true,
  cloneModules: true,
  clientId: "...",
  agencyId: "...",
});
```

---

### Task 63.1: Server Action (Wrapper)
  }
  
  return newSubdomain.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

// Deep clone an object while generating new IDs
export function deepCloneWithNewIds<T extends Record<string, any>>(
  obj: T,
  idMap: Map<string, string> = new Map()
): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => deepCloneWithNewIds(item, idMap)) as T;
  }
  
  if (obj !== null && typeof obj === "object") {
    const cloned: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (key === "id" && typeof value === "string") {
        // Generate new ID and track mapping
        const newId = uuidv4();
        idMap.set(value, newId);
        cloned[key] = newId;
      } else if (key.endsWith("_id") && typeof value === "string" && idMap.has(value)) {
        // Update references to use new IDs
        cloned[key] = idMap.get(value);
      } else if (typeof value === "object") {
        cloned[key] = deepCloneWithNewIds(value, idMap);
      } else {
        cloned[key] = value;
      }
    }
    
    return cloned as T;
  }
  
  return obj;
}

// Clone page content (Craft.js JSON) with new component IDs
export function clonePageContent(content: string | null): string | null {
  if (!content) return null;
  
  try {
    const parsed = JSON.parse(content);
    const idMap = new Map<string, string>();
    
    // Clone nodes with new IDs
    const clonedNodes: Record<string, any> = {};
    
    for (const [oldId, node] of Object.entries(parsed)) {
      const newId = oldId === "ROOT" ? "ROOT" : uuidv4();
      idMap.set(oldId, newId);
      clonedNodes[newId] = { ...node as object };
    }
    
    // Update node references (parent, children)
    for (const [nodeId, node] of Object.entries(clonedNodes)) {
      const n = node as Record<string, any>;
      
      if (n.parent && idMap.has(n.parent)) {
        n.parent = idMap.get(n.parent);
      }
      
      if (Array.isArray(n.nodes)) {
        n.nodes = n.nodes.map((id: string) => idMap.get(id) || id);
      }
      
      if (Array.isArray(n.linkedNodes)) {
        n.linkedNodes = Object.fromEntries(
          Object.entries(n.linkedNodes as Record<string, string>).map(
            ([key, val]) => [key, idMap.get(val) || val]
          )
        );
      }
    }
    
    return JSON.stringify(clonedNodes);
  } catch {
    return content;
  }
}

// Clone settings object
export function cloneSettings(settings: Record<string, any> | null): Record<string, any> {
  if (!settings) return {};
  
  const cloned = JSON.parse(JSON.stringify(settings));
  
  // Reset certain settings that shouldn't be cloned
  delete cloned.analytics_id;
  delete cloned.custom_domain;
  delete cloned.ssl_configured;
  delete cloned.published_at;
  
  return cloned;
}
```

---

### Task 63.2: Core Clone Site Logic

**File: `src/lib/sites/clone-site.ts`**

```typescript
import { createClient } from "@/lib/supabase/server";
import { 
  generateCloneName, 
  generateCloneSubdomain, 
  clonePageContent,
  cloneSettings,
} from "./clone-utils";
import { AppError, DatabaseError } from "@/lib/errors";

interface CloneSiteOptions {
  siteId: string;
  newName?: string;
  newSubdomain?: string;
  clientId?: string; // Clone to different client
  includeContent?: boolean;
  includeSettings?: boolean;
  includeMedia?: boolean;
}

interface CloneSiteResult {
  success: boolean;
  site: {
    id: string;
    name: string;
    subdomain: string;
  };
  pagesCloned: number;
}

export async function cloneSite(options: CloneSiteOptions): Promise<CloneSiteResult> {
  const {
    siteId,
    newName,
    newSubdomain,
    clientId,
    includeContent = true,
    includeSettings = true,
    includeMedia = true,
  } = options;

  const supabase = await createClient();

  // 1. Fetch the original site
  const { data: originalSite, error: siteError } = await supabase
    .from("sites")
    .select(`
      *,
      pages (*)
    `)
    .eq("id", siteId)
    .single();

  if (siteError || !originalSite) {
    throw new AppError("Site not found", {
      code: "SITE_NOT_FOUND",
      statusCode: 404,
    });
  }

  // 2. Get existing subdomains to ensure uniqueness
  const { data: existingSites } = await supabase
    .from("sites")
    .select("subdomain")
    .eq("client_id", clientId || originalSite.client_id);

  const existingSubdomains = existingSites?.map((s) => s.subdomain) || [];

  // 3. Generate new site data
  const clonedSiteName = newName || generateCloneName(originalSite.name);
  const clonedSubdomain = newSubdomain || generateCloneSubdomain(
    originalSite.subdomain,
    existingSubdomains
  );

  // 4. Create the cloned site
  const clonedSiteData = {
    name: clonedSiteName,
    subdomain: clonedSubdomain,
    client_id: clientId || originalSite.client_id,
    template_id: originalSite.template_id,
    status: "draft" as const,
    settings: includeSettings ? cloneSettings(originalSite.settings) : {},
    theme: originalSite.theme,
    favicon: includeMedia ? originalSite.favicon : null,
    og_image: includeMedia ? originalSite.og_image : null,
    // Don't clone these
    published_at: null,
    custom_domain: null,
    ssl_status: null,
  };

  const { data: clonedSite, error: createError } = await supabase
    .from("sites")
    .insert(clonedSiteData)
    .select()
    .single();

  if (createError || !clonedSite) {
    throw new DatabaseError("Failed to create cloned site", {
      cause: createError,
    });
  }

  // 5. Clone pages
  let pagesCloned = 0;

  if (originalSite.pages && originalSite.pages.length > 0) {
    const clonedPages = originalSite.pages.map((page: any) => ({
      site_id: clonedSite.id,
      name: page.name,
      slug: page.slug,
      content: includeContent ? clonePageContent(page.content) : null,
      settings: cloneSettings(page.settings),
      is_homepage: page.is_homepage,
      status: "draft" as const,
      meta_title: page.meta_title,
      meta_description: page.meta_description,
      order: page.order,
    }));

    const { error: pagesError, data: insertedPages } = await supabase
      .from("pages")
      .insert(clonedPages)
      .select();

    if (pagesError) {
      // Cleanup: delete the cloned site if pages fail
      await supabase.from("sites").delete().eq("id", clonedSite.id);
      throw new DatabaseError("Failed to clone pages", {
        cause: pagesError,
      });
    }

    pagesCloned = insertedPages?.length || 0;
  }

  // 6. Clone site modules (if applicable)
  const { data: originalModules } = await supabase
    .from("site_modules")
    .select("*")
    .eq("site_id", siteId);

  if (originalModules && originalModules.length > 0) {
    const clonedModules = originalModules.map((module: any) => ({
      site_id: clonedSite.id,
      module_id: module.module_id,
      settings: cloneSettings(module.settings),
      is_active: false, // Start disabled
    }));

    await supabase.from("site_modules").insert(clonedModules);
  }

  return {
    success: true,
    site: {
      id: clonedSite.id,
      name: clonedSite.name,
      subdomain: clonedSite.subdomain,
    },
    pagesCloned,
  };
}
```

---

### Task 63.3: Clone Site Server Action

**File: `src/actions/sites/clone-site-action.ts`**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { cloneSite } from "@/lib/sites/clone-site";
import { logError } from "@/lib/errors";

const cloneSiteSchema = z.object({
  siteId: z.string().uuid(),
  newName: z.string().min(1).max(100).optional(),
  newSubdomain: z
    .string()
    .min(3)
    .max(63)
    .regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens")
    .optional(),
  clientId: z.string().uuid().optional(),
  includeContent: z.boolean().default(true),
  includeSettings: z.boolean().default(true),
});

export type CloneSiteInput = z.infer<typeof cloneSiteSchema>;

export interface CloneSiteResult {
  success: boolean;
  data?: {
    siteId: string;
    siteName: string;
    subdomain: string;
    pagesCloned: number;
  };
  error?: string;
}

export async function cloneSiteAction(input: CloneSiteInput): Promise<CloneSiteResult> {
  try {
    // Validate input
    const validated = cloneSiteSchema.parse(input);

    // Verify user has access to original site
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Check site ownership
    const { data: site } = await supabase
      .from("sites")
      .select("id, client_id, clients!inner(agency_id)")
      .eq("id", validated.siteId)
      .single();

    if (!site) {
      return { success: false, error: "Site not found" };
    }

    // Verify agency access
    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", user.id)
      .single();

    if (profile?.agency_id !== (site.clients as any).agency_id) {
      return { success: false, error: "Access denied" };
    }

    // Clone the site
    const result = await cloneSite({
      siteId: validated.siteId,
      newName: validated.newName,
      newSubdomain: validated.newSubdomain,
      clientId: validated.clientId,
      includeContent: validated.includeContent,
      includeSettings: validated.includeSettings,
    });

    // Revalidate sites list
    revalidatePath("/sites");
    revalidatePath(`/clients/${site.client_id}/sites`);

    return {
      success: true,
      data: {
        siteId: result.site.id,
        siteName: result.site.name,
        subdomain: result.site.subdomain,
        pagesCloned: result.pagesCloned,
      },
    };
  } catch (error) {
    logError(error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to clone site",
    };
  }
}
```

---

### Task 63.4: Clone Site Dialog

**File: `src/components/sites/clone-site-dialog.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Copy, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cloneSiteAction } from "@/actions/sites/clone-site-action";

const formSchema = z.object({
  newName: z.string().min(1, "Name is required").max(100),
  newSubdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(63)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  includeContent: z.boolean(),
  includeSettings: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface CloneSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site: {
    id: string;
    name: string;
    subdomain: string;
  };
}

export function CloneSiteDialog({
  open,
  onOpenChange,
  site,
}: CloneSiteDialogProps) {
  const router = useRouter();
  const [isCloning, setIsCloning] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newName: `${site.name} (Copy)`,
      newSubdomain: `${site.subdomain}-copy`,
      includeContent: true,
      includeSettings: true,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsCloning(true);

    try {
      const result = await cloneSiteAction({
        siteId: site.id,
        newName: values.newName,
        newSubdomain: values.newSubdomain,
        includeContent: values.includeContent,
        includeSettings: values.includeSettings,
      });

      if (result.success && result.data) {
        toast.success("Site cloned successfully!", {
          description: `${result.data.pagesCloned} pages were cloned.`,
          action: {
            label: "View Site",
            onClick: () => router.push(`/sites/${result.data!.siteId}`),
          },
        });
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error("Failed to clone site", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Clone Site
          </DialogTitle>
          <DialogDescription>
            Create a copy of "{site.name}" with all its pages and settings.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My New Site" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newSubdomain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subdomain</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input placeholder="my-site" {...field} />
                      <span className="text-sm text-muted-foreground">
                        .dramac.io
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    The URL where the cloned site will be accessible.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3 pt-2">
              <Label>Clone Options</Label>
              
              <FormField
                control={form.control}
                name="includeContent"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Include page content
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="includeSettings"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Include site settings (SEO, theme, etc.)
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isCloning}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCloning}>
                {isCloning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cloning...
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Clone Site
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Task 63.5: Clone Site Button

**File: `src/components/sites/clone-site-button.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CloneSiteDialog } from "./clone-site-dialog";

interface CloneSiteButtonProps {
  site: {
    id: string;
    name: string;
    subdomain: string;
  };
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export function CloneSiteButton({
  site,
  variant = "outline",
  size = "sm",
  showLabel = true,
}: CloneSiteButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={() => setDialogOpen(true)}
          >
            <Copy className="h-4 w-4" />
            {showLabel && <span className="ml-2">Clone</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Create a copy of this site</p>
        </TooltipContent>
      </Tooltip>

      <CloneSiteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        site={site}
      />
    </>
  );
}
```

---

### Task 63.6: Clone API Endpoint

**File: `src/app/api/sites/[siteId]/clone/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { cloneSite } from "@/lib/sites/clone-site";
import { withErrorHandling, handleAPIError } from "@/lib/errors";
import { withRateLimit } from "@/app/api/_middleware/rate-limit";

const cloneSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  subdomain: z.string().min(3).max(63).optional(),
  clientId: z.string().uuid().optional(),
  includeContent: z.boolean().default(true),
  includeSettings: z.boolean().default(true),
});

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
): Promise<NextResponse> {
  const { siteId } = await params;

  // Authenticate
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  const body = await req.json();
  const validated = cloneSchema.parse(body);

  // Clone site
  const result = await cloneSite({
    siteId,
    newName: validated.name,
    newSubdomain: validated.subdomain,
    clientId: validated.clientId,
    includeContent: validated.includeContent,
    includeSettings: validated.includeSettings,
  });

  return NextResponse.json({
    success: true,
    site: result.site,
    pagesCloned: result.pagesCloned,
  });
}

export const POST = withRateLimit(withErrorHandling(handler));
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Clone name generation works
- [ ] Subdomain generation avoids conflicts
- [ ] Page content cloning preserves structure
- [ ] Settings cloning excludes sensitive data

### Integration Tests
- [ ] Full site clone creates new site
- [ ] All pages are cloned correctly
- [ ] Settings are copied properly
- [ ] Modules are cloned (disabled)
- [ ] Error handling on failure

### E2E Tests
- [ ] Clone dialog opens correctly
- [ ] Form validation works
- [ ] Clone process completes
- [ ] Success toast appears
- [ ] New site is accessible

---

## ✅ Completion Checklist

- [ ] Clone utilities created
- [ ] Core clone logic working
- [ ] Server action created
- [ ] Clone dialog component created
- [ ] Clone button component created
- [ ] API endpoint created
- [ ] Integration with site list/detail
- [ ] Tests passing

---

**Next Phase**: Phase 64 - Backup System
