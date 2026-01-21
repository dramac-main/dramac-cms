# Phase 15: Page Management

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Build page CRUD operations, page settings, homepage management, and create page wizard.

---

## 📋 Prerequisites

- [ ] Phase 1-14 completed

---

## ✅ Tasks

### Task 15.1: Page Types & Validation

**File: `src/types/page.ts`**

```typescript
export interface Page {
  id: string;
  site_id: string;
  title: string;
  slug: string;
  content: PageContent | null;
  is_homepage: boolean;
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface PageContent {
  ROOT: {
    type: { resolvedName: string };
    isCanvas: boolean;
    props: Record<string, unknown>;
    displayName: string;
    custom: Record<string, unknown>;
    nodes: string[];
    linkedNodes: Record<string, string>;
  };
  [nodeId: string]: {
    type: { resolvedName: string };
    isCanvas?: boolean;
    props: Record<string, unknown>;
    displayName?: string;
    custom?: Record<string, unknown>;
    nodes?: string[];
    linkedNodes?: Record<string, string>;
    parent?: string;
  };
}

export interface PageWithSite extends Page {
  site: {
    id: string;
    name: string;
    subdomain: string;
  };
}
```

**File: `src/lib/validations/page.ts`**

```typescript
import { z } from "zod";

export const createPageSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be less than 100 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
  is_homepage: z.boolean().default(false),
});

export const updatePageSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters")
    .optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be less than 100 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    )
    .optional(),
  meta_title: z
    .string()
    .max(60, "Meta title must be less than 60 characters")
    .optional()
    .nullable(),
  meta_description: z
    .string()
    .max(160, "Meta description must be less than 160 characters")
    .optional()
    .nullable(),
  is_homepage: z.boolean().optional(),
  is_published: z.boolean().optional(),
});

export type CreatePageFormData = z.infer<typeof createPageSchema>;
export type UpdatePageFormData = z.infer<typeof updatePageSchema>;
```

### Task 15.2: Page Server Actions

**File: `src/lib/actions/pages.ts`**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganization } from "@/lib/actions/organizations";
import {
  createPageSchema,
  updatePageSchema,
  type CreatePageFormData,
  type UpdatePageFormData,
} from "@/lib/validations/page";
import type { Page, PageContent } from "@/types/page";

// Default empty page content for Craft.js
const getEmptyPageContent = (): PageContent => ({
  ROOT: {
    type: { resolvedName: "Container" },
    isCanvas: true,
    props: {
      className: "min-h-screen p-4",
    },
    displayName: "Container",
    custom: {},
    nodes: [],
    linkedNodes: {},
  },
});

export async function getPages(siteId: string): Promise<Page[]> {
  const supabase = createClient();
  const organization = await getOrganization();

  if (!organization) {
    throw new Error("Organization not found");
  }

  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("site_id", siteId)
    .order("is_homepage", { ascending: false })
    .order("title", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getPage(pageId: string): Promise<Page | null> {
  const supabase = createClient();
  const organization = await getOrganization();

  if (!organization) {
    throw new Error("Organization not found");
  }

  const { data, error } = await supabase
    .from("pages")
    .select(
      `
      *,
      site:sites(id, name, subdomain, organization_id)
    `
    )
    .eq("id", pageId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(error.message);
  }

  // Verify organization access
  if (data.site?.organization_id !== organization.id) {
    throw new Error("Unauthorized");
  }

  return data;
}

export async function createPageAction(
  siteId: string,
  formData: CreatePageFormData
): Promise<{ data?: Page; error?: string }> {
  const supabase = createClient();

  try {
    const validatedFields = createPageSchema.parse(formData);
    const organization = await getOrganization();

    if (!organization) {
      return { error: "Organization not found" };
    }

    // Verify site belongs to organization
    const { data: site } = await supabase
      .from("sites")
      .select("id, organization_id")
      .eq("id", siteId)
      .single();

    if (!site || site.organization_id !== organization.id) {
      return { error: "Site not found" };
    }

    // Check for duplicate slug
    const { data: existingPage } = await supabase
      .from("pages")
      .select("id")
      .eq("site_id", siteId)
      .eq("slug", validatedFields.slug)
      .single();

    if (existingPage) {
      return { error: "A page with this slug already exists" };
    }

    // If this is set as homepage, unset other homepages
    if (validatedFields.is_homepage) {
      await supabase
        .from("pages")
        .update({ is_homepage: false })
        .eq("site_id", siteId)
        .eq("is_homepage", true);
    }

    const { data, error } = await supabase
      .from("pages")
      .insert({
        site_id: siteId,
        title: validatedFields.title,
        slug: validatedFields.slug,
        is_homepage: validatedFields.is_homepage,
        content: getEmptyPageContent(),
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath(`/dashboard/sites/${siteId}`);
    return { data };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to create page" };
  }
}

export async function updatePageAction(
  pageId: string,
  formData: UpdatePageFormData
): Promise<{ data?: Page; error?: string }> {
  const supabase = createClient();

  try {
    const validatedFields = updatePageSchema.parse(formData);
    const organization = await getOrganization();

    if (!organization) {
      return { error: "Organization not found" };
    }

    // Get page and verify ownership
    const { data: existingPage } = await supabase
      .from("pages")
      .select("*, site:sites(organization_id)")
      .eq("id", pageId)
      .single();

    if (!existingPage || existingPage.site?.organization_id !== organization.id) {
      return { error: "Page not found" };
    }

    // If setting as homepage, unset other homepages
    if (validatedFields.is_homepage) {
      await supabase
        .from("pages")
        .update({ is_homepage: false })
        .eq("site_id", existingPage.site_id)
        .eq("is_homepage", true)
        .neq("id", pageId);
    }

    const { data, error } = await supabase
      .from("pages")
      .update(validatedFields)
      .eq("id", pageId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath(`/dashboard/sites/${existingPage.site_id}`);
    return { data };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to update page" };
  }
}

export async function deletePageAction(
  pageId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const organization = await getOrganization();

    if (!organization) {
      return { error: "Organization not found" };
    }

    // Get page and verify ownership + not homepage
    const { data: page } = await supabase
      .from("pages")
      .select("*, site:sites(organization_id)")
      .eq("id", pageId)
      .single();

    if (!page || page.site?.organization_id !== organization.id) {
      return { error: "Page not found" };
    }

    if (page.is_homepage) {
      return { error: "Cannot delete the homepage. Set another page as homepage first." };
    }

    const { error } = await supabase.from("pages").delete().eq("id", pageId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath(`/dashboard/sites/${page.site_id}`);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to delete page" };
  }
}

export async function savePageContentAction(
  pageId: string,
  content: PageContent
): Promise<{ success?: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const organization = await getOrganization();

    if (!organization) {
      return { error: "Organization not found" };
    }

    // Verify ownership
    const { data: page } = await supabase
      .from("pages")
      .select("site:sites(organization_id)")
      .eq("id", pageId)
      .single();

    if (!page || page.site?.organization_id !== organization.id) {
      return { error: "Page not found" };
    }

    const { error } = await supabase
      .from("pages")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", pageId);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to save page content" };
  }
}

export async function setHomepageAction(
  pageId: string
): Promise<{ success?: boolean; error?: string }> {
  return updatePageAction(pageId, { is_homepage: true });
}
```

### Task 15.3: Create Page Form

**File: `src/components/pages/create-page-form.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createPageAction } from "@/lib/actions/pages";
import {
  createPageSchema,
  type CreatePageFormData,
} from "@/lib/validations/page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface CreatePageFormProps {
  siteId: string;
  isFirstPage?: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CreatePageForm({ siteId, isFirstPage }: CreatePageFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<CreatePageFormData>({
    resolver: zodResolver(createPageSchema),
    defaultValues: {
      title: isFirstPage ? "Home" : "",
      slug: isFirstPage ? "home" : "",
      is_homepage: isFirstPage || false,
    },
  });

  const title = form.watch("title");

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    form.setValue("title", value);
    if (!form.getFieldState("slug").isDirty || !form.getValues("slug")) {
      form.setValue("slug", slugify(value));
    }
  };

  const onSubmit = async (data: CreatePageFormData) => {
    setIsPending(true);

    try {
      const result = await createPageAction(siteId, data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Page created successfully");
        router.push(`/dashboard/sites/${siteId}/editor?page=${result.data?.id}`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>
          {isFirstPage ? "Create Homepage" : "Create New Page"}
        </CardTitle>
        <CardDescription>
          {isFirstPage
            ? "Set up the main landing page for your site."
            : "Add a new page to your site."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Page Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="About Us"
                      {...field}
                      onChange={(e) => handleTitleChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="about-us" {...field} />
                  </FormControl>
                  <FormDescription>
                    The URL path for this page (e.g., /about-us)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isFirstPage && (
              <FormField
                control={form.control}
                name="is_homepage"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Set as Homepage</FormLabel>
                      <FormDescription>
                        Make this the main page visitors see first
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Page
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

### Task 15.4: Page Settings Dialog

**File: `src/components/pages/page-settings-dialog.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import { updatePageAction, setHomepageAction } from "@/lib/actions/pages";
import { updatePageSchema, type UpdatePageFormData } from "@/lib/validations/page";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Page } from "@/types/page";

interface PageSettingsDialogProps {
  page: Page;
  trigger?: React.ReactNode;
}

export function PageSettingsDialog({ page, trigger }: PageSettingsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<UpdatePageFormData>({
    resolver: zodResolver(updatePageSchema),
    defaultValues: {
      title: page.title,
      slug: page.slug,
      meta_title: page.meta_title || "",
      meta_description: page.meta_description || "",
    },
  });

  const onSubmit = async (data: UpdatePageFormData) => {
    setIsPending(true);

    try {
      const result = await updatePageAction(page.id, data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Page settings saved");
        setOpen(false);
        router.refresh();
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  const handleSetHomepage = async () => {
    setIsPending(true);

    try {
      const result = await setHomepageAction(page.id);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Homepage updated");
        setOpen(false);
        router.refresh();
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Page Settings</DialogTitle>
          <DialogDescription>
            Configure settings for "{page.title}"
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <TabsContent value="general" className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={page.is_homepage} />
                      </FormControl>
                      <FormDescription>
                        {page.is_homepage
                          ? "Homepage slug cannot be changed"
                          : "The URL path for this page"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!page.is_homepage && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Homepage</p>
                        <p className="text-sm text-muted-foreground">
                          Make this the main landing page
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSetHomepage}
                        disabled={isPending}
                      >
                        Set as Homepage
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="seo" className="space-y-4">
                <FormField
                  control={form.control}
                  name="meta_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={page.title}
                          maxLength={60}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/60 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the page..."
                          maxLength={160}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/160 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

### Task 15.5: Delete Page Dialog

**File: `src/components/pages/delete-page-dialog.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePageAction } from "@/lib/actions/pages";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Page } from "@/types/page";

interface DeletePageDialogProps {
  page: Page;
  siteId: string;
  onDeleted?: () => void;
}

export function DeletePageDialog({ page, siteId, onDeleted }: DeletePageDialogProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleDelete = async () => {
    setIsPending(true);

    try {
      const result = await deletePageAction(page.id);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Page deleted successfully");
        onDeleted?.();
        router.push(`/dashboard/sites/${siteId}`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  if (page.is_homepage) {
    return (
      <Button variant="ghost" size="icon" disabled title="Cannot delete homepage">
        <Trash2 className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-danger hover:text-danger">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Page</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{page.title}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-danger hover:bg-danger/90"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Task 15.6: New Page Route

**File: `src/app/(dashboard)/dashboard/sites/[siteId]/pages/new/page.tsx`**

```typescript
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSite } from "@/lib/actions/sites";
import { getPages } from "@/lib/actions/pages";
import { CreatePageForm } from "@/components/pages/create-page-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface NewPagePageProps {
  params: { siteId: string };
}

export async function generateMetadata({ params }: NewPagePageProps): Promise<Metadata> {
  const site = await getSite(params.siteId).catch(() => null);
  return {
    title: site ? `New Page - ${site.name} | DRAMAC` : "New Page",
  };
}

export default async function NewPagePage({ params }: NewPagePageProps) {
  const site = await getSite(params.siteId).catch(() => null);

  if (!site) {
    notFound();
  }

  const pages = await getPages(params.siteId);
  const isFirstPage = pages.length === 0;

  return (
    <div>
      <div className="mb-6">
        <Link href={`/dashboard/sites/${site.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {site.name}
          </Button>
        </Link>
      </div>

      <CreatePageForm siteId={site.id} isFirstPage={isFirstPage} />
    </div>
  );
}
```

### Task 15.7: Export Page Components

**File: `src/components/pages/index.ts`**

```typescript
export * from "./create-page-form";
export * from "./page-settings-dialog";
export * from "./delete-page-dialog";
```

---

## 📐 Acceptance Criteria

- [ ] Page types and validation schemas defined
- [ ] CRUD server actions work correctly
- [ ] Create page form with auto-slug generation
- [ ] Page settings dialog with General/SEO tabs
- [ ] Delete page with confirmation
- [ ] Homepage cannot be deleted
- [ ] Set page as homepage works
- [ ] Page content saved in Craft.js format

---

## 📁 Files Created This Phase

```
src/types/
└── page.ts

src/lib/validations/
└── page.ts

src/lib/actions/
└── pages.ts

src/components/pages/
├── index.ts
├── create-page-form.tsx
├── page-settings-dialog.tsx
└── delete-page-dialog.tsx

src/app/(dashboard)/dashboard/sites/[siteId]/pages/new/
└── page.tsx
```

---

## ➡️ Next Phase

**Phase 16: Dashboard Analytics** - Dashboard overview, site statistics, activity feed.
