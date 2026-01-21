# Phase 13: Site Management

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Build complete site management: sites list page, create site wizard with template selection, site settings, and site status management.

---

## 📋 Prerequisites

- [ ] Phase 1-12 completed

---

## ✅ Tasks

### Task 13.1: Site Types

**File: `src/types/site.ts`**

```typescript
import type { Database } from "./database";

export type Site = Database["public"]["Tables"]["sites"]["Row"];
export type SiteInsert = Database["public"]["Tables"]["sites"]["Insert"];
export type SiteUpdate = Database["public"]["Tables"]["sites"]["Update"];

export type SiteStatus = "draft" | "published" | "archived";

export interface SiteWithClient extends Site {
  client: {
    id: string;
    name: string;
    company: string | null;
  } | null;
}

export interface SiteWithPages extends Site {
  pages: {
    id: string;
    title: string;
    slug: string;
    is_homepage: boolean;
  }[];
}

export interface SiteFilters {
  search?: string;
  status?: SiteStatus | "all";
  clientId?: string;
  sortBy?: "name" | "created_at" | "updated_at";
  sortOrder?: "asc" | "desc";
}

export interface SiteTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: "business" | "portfolio" | "blog" | "ecommerce" | "blank";
  pages: string[];
}
```

### Task 13.2: Site Validation Schemas

**File: `src/lib/validations/site.ts`**

```typescript
import { z } from "zod";
import { subdomainSchema, domainSchema } from "./common";

export const createSiteSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  subdomain: subdomainSchema,
  client_id: z.string().uuid("Invalid client ID"),
  template_id: z.string().optional(),
  description: z.string().max(500).optional(),
});

export type CreateSiteFormData = z.infer<typeof createSiteSchema>;

export const updateSiteSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  subdomain: subdomainSchema.optional(),
  custom_domain: domainSchema.optional(),
  description: z.string().max(500).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  favicon_url: z.string().url().optional().or(z.literal("")),
  og_image_url: z.string().url().optional().or(z.literal("")),
  meta_title: z.string().max(60).optional(),
  meta_description: z.string().max(160).optional(),
});

export type UpdateSiteFormData = z.infer<typeof updateSiteSchema>;
```

### Task 13.3: Site Server Actions

**File: `src/lib/actions/sites.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createSiteSchema, updateSiteSchema } from "@/lib/validations/site";
import type { SiteFilters } from "@/types/site";

// Get all sites for the current organization
export async function getSites(filters?: SiteFilters) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) throw new Error("No organization found");

  let query = supabase
    .from("sites")
    .select(`
      *,
      client:clients(id, name, company)
    `)
    .eq("agency_id", profile.agency_id);

  // Apply filters
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,subdomain.ilike.%${filters.search}%`);
  }

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.clientId) {
    query = query.eq("client_id", filters.clientId);
  }

  // Apply sorting
  const sortBy = filters?.sortBy || "created_at";
  const sortOrder = filters?.sortOrder || "desc";
  query = query.order(sortBy, { ascending: sortOrder === "asc" });

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// Get single site by ID
export async function getSite(siteId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("sites")
    .select(`
      *,
      client:clients(id, name, company),
      pages(id, title, slug, is_homepage, created_at)
    `)
    .eq("id", siteId)
    .single();

  if (error) throw error;
  return data;
}

// Check if subdomain is available
export async function checkSubdomain(subdomain: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sites")
    .select("id")
    .eq("subdomain", subdomain.toLowerCase())
    .limit(1);

  if (error) throw error;
  return { available: !data || data.length === 0 };
}

// Create new site
export async function createSiteAction(formData: unknown) {
  const validated = createSiteSchema.safeParse(formData);

  if (!validated.success) {
    return { error: "Invalid form data", details: validated.error.flatten() };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) return { error: "No organization found" };

  // Check subdomain availability
  const { available } = await checkSubdomain(validated.data.subdomain);
  if (!available) {
    return { error: "Subdomain is already taken" };
  }

  // Create site
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .insert({
      name: validated.data.name,
      subdomain: validated.data.subdomain.toLowerCase(),
      client_id: validated.data.client_id,
      agency_id: profile.agency_id,
      description: validated.data.description,
      status: "draft",
    })
    .select()
    .single();

  if (siteError) {
    return { error: siteError.message };
  }

  // Create default homepage
  const { error: pageError } = await supabase.from("pages").insert({
    site_id: site.id,
    title: "Home",
    slug: "/",
    is_homepage: true,
    content: JSON.stringify({
      ROOT: {
        type: { resolvedName: "Container" },
        props: { className: "min-h-screen" },
        nodes: [],
      },
    }),
  });

  if (pageError) {
    // Cleanup site if page creation fails
    await supabase.from("sites").delete().eq("id", site.id);
    return { error: "Failed to create homepage" };
  }

  revalidatePath("/dashboard/sites");
  revalidatePath(`/dashboard/clients/${validated.data.client_id}`);
  return { success: true, data: site };
}

// Update site
export async function updateSiteAction(siteId: string, formData: unknown) {
  const validated = updateSiteSchema.safeParse(formData);

  if (!validated.success) {
    return { error: "Invalid form data", details: validated.error.flatten() };
  }

  const supabase = await createClient();

  // Check subdomain if being changed
  if (validated.data.subdomain) {
    const { data: existingSite } = await supabase
      .from("sites")
      .select("id, subdomain")
      .eq("id", siteId)
      .single();

    if (existingSite && existingSite.subdomain !== validated.data.subdomain) {
      const { available } = await checkSubdomain(validated.data.subdomain);
      if (!available) {
        return { error: "Subdomain is already taken" };
      }
    }
  }

  const { data, error } = await supabase
    .from("sites")
    .update({
      ...validated.data,
      subdomain: validated.data.subdomain?.toLowerCase(),
    })
    .eq("id", siteId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/sites");
  revalidatePath(`/dashboard/sites/${siteId}`);
  return { success: true, data };
}

// Delete site
export async function deleteSiteAction(siteId: string) {
  const supabase = await createClient();

  // Delete pages first (cascade should handle this but being explicit)
  await supabase.from("pages").delete().eq("site_id", siteId);

  const { error } = await supabase.from("sites").delete().eq("id", siteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/sites");
  return { success: true };
}

// Publish/unpublish site
export async function publishSiteAction(siteId: string, publish: boolean) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sites")
    .update({
      status: publish ? "published" : "draft",
      published_at: publish ? new Date().toISOString() : null,
    })
    .eq("id", siteId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/sites");
  revalidatePath(`/dashboard/sites/${siteId}`);
  return { success: true, data };
}
```

### Task 13.4: Sites List Page

**File: `src/app/(dashboard)/dashboard/sites/page.tsx`**

```typescript
import { Suspense } from "react";
import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SitesGrid } from "@/components/sites/sites-grid";
import { SitesGridSkeleton } from "@/components/sites/sites-grid-skeleton";
import { SiteFiltersBar } from "@/components/sites/site-filters-bar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sites | DRAMAC",
  description: "Manage your websites",
};

interface SitesPageProps {
  searchParams: {
    search?: string;
    status?: string;
    clientId?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

export default function SitesPage({ searchParams }: SitesPageProps) {
  return (
    <div>
      <PageHeader
        title="Sites"
        description="Manage all your client websites."
      >
        <Link href="/dashboard/sites/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Site
          </Button>
        </Link>
      </PageHeader>

      <div className="space-y-4">
        <SiteFiltersBar />

        <Suspense fallback={<SitesGridSkeleton />}>
          <SitesGrid filters={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
```

### Task 13.5: Sites Grid Component

**File: `src/components/sites/sites-grid.tsx`**

```typescript
import Link from "next/link";
import { getSites } from "@/lib/actions/sites";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ExternalLink,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Globe,
  User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { SiteFilters, SiteStatus } from "@/types/site";

interface SitesGridProps {
  filters?: SiteFilters;
}

const statusColors: Record<SiteStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-success text-success-foreground",
  archived: "bg-warning text-warning-foreground",
};

export async function SitesGrid({ filters }: SitesGridProps) {
  const sites = await getSites(filters);

  if (!sites || sites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <Globe className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No sites yet</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Get started by creating your first website.
        </p>
        <Link href="/dashboard/sites/new">
          <Button>Create Site</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sites.map((site) => (
        <Card key={site.id} className="group relative hover:shadow-md transition-shadow">
          {/* Site Preview/Thumbnail */}
          <div className="relative h-40 bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <Globe className="h-16 w-16 text-primary/20" />
            </div>
            {/* Overlay with actions on hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Link href={`/dashboard/sites/${site.id}`}>
                <Button size="sm" variant="secondary">
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </Link>
              {site.status === "published" && (
                <a
                  href={`https://${site.subdomain}.dramac.app`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" variant="secondary">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </a>
              )}
            </div>
          </div>

          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1 min-w-0">
                <CardTitle className="text-base font-medium truncate">
                  <Link
                    href={`/dashboard/sites/${site.id}`}
                    className="hover:underline"
                  >
                    {site.name}
                  </Link>
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="truncate">{site.subdomain}.dramac.app</span>
                  {site.status === "published" && (
                    <a
                      href={`https://${site.subdomain}.dramac.app`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/sites/${site.id}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Site
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/sites/${site.id}/editor`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Open Editor
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-danger">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[site.status as SiteStatus]}>
                  {site.status}
                </Badge>
              </div>
              {site.client && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span className="truncate max-w-[100px]">{site.client.name}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Updated {formatDistanceToNow(new Date(site.updated_at), { addSuffix: true })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### Task 13.6: Sites Grid Skeleton

**File: `src/components/sites/sites-grid-skeleton.tsx`**

```typescript
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function SitesGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <Skeleton className="h-40 rounded-t-lg rounded-b-none" />
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-28 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### Task 13.7: Site Filters Bar

**File: `src/components/sites/site-filters-bar.tsx`**

```typescript
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-callback";
import { getClients } from "@/lib/actions/clients";
import type { Client } from "@/types/client";

export function SiteFiltersBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [clients, setClients] = useState<Client[]>([]);

  const [search, setSearch] = useState(searchParams.get("search") || "");

  // Fetch clients for filter
  useEffect(() => {
    getClients().then((data) => setClients(data || []));
  }, []);

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, value);
        }
      });

      return newSearchParams.toString();
    },
    [searchParams]
  );

  const updateFilters = useCallback(
    (params: Record<string, string | null>) => {
      startTransition(() => {
        router.push(`?${createQueryString(params)}`);
      });
    },
    [router, createQueryString]
  );

  const debouncedSearch = useDebouncedCallback((value: string) => {
    updateFilters({ search: value || null });
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    debouncedSearch(e.target.value);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search sites..."
          value={search}
          onChange={handleSearchChange}
          className="pl-9"
        />
      </div>

      <div className="flex gap-2">
        <Select
          defaultValue={searchParams.get("status") || "all"}
          onValueChange={(value) => updateFilters({ status: value === "all" ? null : value })}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select
          defaultValue={searchParams.get("clientId") || "all"}
          onValueChange={(value) => updateFilters({ clientId: value === "all" ? null : value })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
```

### Task 13.8: Create Site Page

**File: `src/app/(dashboard)/dashboard/sites/new/page.tsx`**

```typescript
import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { CreateSiteForm } from "@/components/sites/create-site-form";
import { getClients } from "@/lib/actions/clients";

export const metadata: Metadata = {
  title: "Create Site | DRAMAC",
  description: "Create a new website",
};

interface CreateSitePageProps {
  searchParams: {
    clientId?: string;
  };
}

export default async function CreateSitePage({ searchParams }: CreateSitePageProps) {
  const clients = await getClients({ status: "active" });

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Create New Site"
        description="Set up a new website for your client."
      />

      <CreateSiteForm clients={clients || []} defaultClientId={searchParams.clientId} />
    </div>
  );
}
```

### Task 13.9: Create Site Form

**File: `src/components/sites/create-site-form.tsx`**

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { createSiteAction, checkSubdomain } from "@/lib/actions/sites";
import { createSiteSchema, type CreateSiteFormData } from "@/lib/validations/site";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, Button, Textarea } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-callback";
import type { Client } from "@/types/client";

interface CreateSiteFormProps {
  clients: Client[];
  defaultClientId?: string;
}

export function CreateSiteForm({ clients, defaultClientId }: CreateSiteFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [subdomainStatus, setSubdomainStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const form = useForm<CreateSiteFormData>({
    resolver: zodResolver(createSiteSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      client_id: defaultClientId || "",
      description: "",
    },
  });

  // Auto-generate subdomain from name
  const watchName = form.watch("name");
  useEffect(() => {
    if (watchName && !form.getValues("subdomain")) {
      const subdomain = watchName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 30);
      form.setValue("subdomain", subdomain);
    }
  }, [watchName, form]);

  // Check subdomain availability
  const checkSubdomainAvailability = useDebouncedCallback(async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainStatus("idle");
      return;
    }

    setSubdomainStatus("checking");
    try {
      const { available } = await checkSubdomain(subdomain);
      setSubdomainStatus(available ? "available" : "taken");
    } catch {
      setSubdomainStatus("idle");
    }
  }, 500);

  const watchSubdomain = form.watch("subdomain");
  useEffect(() => {
    checkSubdomainAvailability(watchSubdomain);
  }, [watchSubdomain, checkSubdomainAvailability]);

  const onSubmit = async (data: CreateSiteFormData) => {
    if (subdomainStatus === "taken") {
      toast.error("Please choose a different subdomain");
      return;
    }

    setIsPending(true);

    try {
      const result = await createSiteAction(data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Site created successfully");
        router.push(`/dashboard/sites/${result.data?.id}`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Site Details</CardTitle>
            <CardDescription>Basic information about the website.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                          {client.company && ` (${client.company})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Website" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subdomain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subdomain *</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          placeholder="my-awesome-site"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                            field.onChange(value);
                          }}
                        />
                        {subdomainStatus !== "idle" && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {subdomainStatus === "checking" && (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                            {subdomainStatus === "available" && (
                              <Check className="h-4 w-4 text-success" />
                            )}
                            {subdomainStatus === "taken" && (
                              <X className="h-4 w-4 text-danger" />
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">.dramac.app</span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    {subdomainStatus === "available" && (
                      <span className="text-success">This subdomain is available!</span>
                    )}
                    {subdomainStatus === "taken" && (
                      <span className="text-danger">This subdomain is already taken.</span>
                    )}
                    {subdomainStatus === "idle" && "Only lowercase letters, numbers, and hyphens."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the website..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {clients.length === 0 && (
          <div className="flex items-center gap-2 rounded-md bg-warning/10 p-4 text-warning">
            <AlertCircle className="h-5 w-5" />
            <span>You need to create a client before creating a site.</span>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending || clients.length === 0 || subdomainStatus === "taken"}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Site
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

---

## 📐 Acceptance Criteria

- [ ] Sites list shows all sites as cards with thumbnails
- [ ] Search filters sites by name/subdomain
- [ ] Status filter works (All/Draft/Published/Archived)
- [ ] Client filter works
- [ ] Create site form validates input
- [ ] Subdomain availability check works
- [ ] Subdomain auto-generates from name
- [ ] Site creation creates homepage automatically
- [ ] Empty state shows when no sites
- [ ] Loading skeleton shows while data loads

---

## 📁 Files Created This Phase

```
src/types/
└── site.ts

src/lib/validations/
└── site.ts

src/lib/actions/
└── sites.ts

src/components/sites/
├── sites-grid.tsx
├── sites-grid-skeleton.tsx
├── site-filters-bar.tsx
└── create-site-form.tsx

src/app/(dashboard)/dashboard/sites/
├── page.tsx
└── new/
    └── page.tsx
```

---

## ➡️ Next Phase

**Phase 14: Site Detail & Settings** - Individual site view, settings page, domain configuration, SEO settings.

