# Phase 63: Site Cloning - ADD UI Components Only

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟢 LOW (Core cloning exists!)
>
> **Estimated Time**: 30 minutes - 1 hour

---

## ⚠️ CRITICAL: SITE CLONING ALREADY EXISTS!

**The core cloning logic is fully implemented in `src/lib/sites/clone.ts` (365 lines)!**

**What Already Exists:**
- ✅ `CloneOptions` interface
- ✅ `CloneResult` interface
- ✅ `cloneSite(sourceSiteId, options)` function
- ✅ Clones site settings, pages, and content
- ✅ Handles subdomain generation
- ✅ Updates page references

---

## ⚠️ SCHEMA WARNING - USE CORRECT TABLE NAMES!

| ❌ DO NOT USE | ✅ USE INSTEAD |
|---------------|----------------|
| `site_modules` | `site_module_installations` |

---

## 🎯 Objective

ADD UI components to use the existing `cloneSite()` function. DO NOT recreate cloning logic!

---

## 📋 Prerequisites

- [ ] `src/lib/sites/clone.ts` exists (it does!)
- [ ] Site detail page exists

---

## ✅ Tasks

### Task 63.1: Verify Existing Implementation

**Check `src/lib/sites/clone.ts` exists with:**

```typescript
// Already exists - USE THIS, don't recreate!
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

### Task 63.2: Create Clone Site Server Action

**File: `src/lib/actions/clone.ts`** (if not exists)

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { cloneSite, type CloneOptions } from "@/lib/sites/clone";
import { revalidatePath } from "next/cache";

export async function cloneSiteAction(
  siteId: string,
  options: Omit<CloneOptions, "agencyId">
) {
  const supabase = await createClient();

  // Get current user's agency
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) {
    return { success: false, error: "No agency found" };
  }

  // Call existing clone function
  const result = await cloneSite(siteId, {
    ...options,
    agencyId: profile.agency_id,
  });

  if (result.success) {
    revalidatePath("/dashboard/sites");
  }

  return result;
}
```

---

### Task 63.3: Clone Site Dialog

**File: `src/components/sites/clone-site-dialog.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cloneSiteAction } from "@/lib/actions/clone";

const cloneSchema = z.object({
  newName: z.string().min(1, "Name is required"),
  newSubdomain: z.string().min(1, "Subdomain is required")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  clonePages: z.boolean().default(true),
  cloneSettings: z.boolean().default(true),
  cloneModules: z.boolean().default(true),
});

type CloneFormData = z.infer<typeof cloneSchema>;

interface CloneSiteDialogProps {
  siteId: string;
  siteName: string;
  clientId: string;
  trigger?: React.ReactNode;
}

export function CloneSiteDialog({
  siteId,
  siteName,
  clientId,
  trigger,
}: CloneSiteDialogProps) {
  const [open, setOpen] = useState(false);
  const [isCloning, setIsCloning] = useState(false);

  const form = useForm<CloneFormData>({
    resolver: zodResolver(cloneSchema),
    defaultValues: {
      newName: `${siteName} (Copy)`,
      newSubdomain: "",
      clonePages: true,
      cloneSettings: true,
      cloneModules: true,
    },
  });

  async function onSubmit(data: CloneFormData) {
    setIsCloning(true);
    try {
      const result = await cloneSiteAction(siteId, {
        ...data,
        clientId,
      });

      if (result.success) {
        toast.success("Site cloned successfully!", {
          description: `Created: ${data.newName}`,
        });
        setOpen(false);
        form.reset();
      } else {
        toast.error("Failed to clone site", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Clone failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsCloning(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Copy className="mr-2 h-4 w-4" />
            Clone Site
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone Site</DialogTitle>
          <DialogDescription>
            Create a copy of "{siteName}" with all its content.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Site Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Input {...field} placeholder="my-cloned-site" />
                  </FormControl>
                  <FormDescription>
                    {field.value}.yourdomain.com
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormLabel>Clone Options</FormLabel>
              <FormField
                control={form.control}
                name="clonePages"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Clone all pages</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cloneSettings"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Clone site settings</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cloneModules"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Clone installed modules</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCloning}>
                {isCloning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Clone Site
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

## ✅ Completion Checklist

- [ ] Verified `src/lib/sites/clone.ts` exists
- [ ] Server action wrapper created (if needed)
- [ ] Clone dialog component created
- [ ] Integrated into site detail page
- [ ] Tested cloning a site
- [ ] Verified cloned site has all pages
- [ ] Verified cloned site has new subdomain

---

## 📝 Notes for AI Agent

1. **DON'T RECREATE** - Use existing `cloneSite()` function!
2. **UI ONLY** - Just add the dialog and trigger button
3. **CORRECT TABLES** - Use `site_module_installations`
4. **TEST THOROUGHLY** - Verify clone has all content
5. **MINIMAL CHANGES** - The hard work is done!
