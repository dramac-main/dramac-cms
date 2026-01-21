# Phase 47: Site Management - Complete Implementation

> **AI Model**: Claude Opus 4.5 (2x)
>
> **⚠️ FIRST**: Read `PHASE-46-REMEDIATION-MASTER-PLAN.md`

---

## 🎯 Objective

Create all missing site management pages and fix existing broken functionality so users can fully manage sites from creation to deletion.

---

## 📋 Prerequisites

- [ ] Phase 46 database fixes applied
- [ ] RLS properly configured
- [ ] User can authenticate

---

## ✅ Tasks

### Task 47.1: Create Sites List Page

**File: `src/app/(dashboard)/sites/page.tsx`**

```tsx
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
  searchParams: Promise<{
    search?: string;
    status?: string;
    clientId?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function SitesPage({ searchParams }: SitesPageProps) {
  const params = await searchParams;
  
  const filters = {
    search: params.search,
    status: params.status as "all" | "published" | "draft" | undefined,
    clientId: params.clientId,
    sortBy: params.sortBy as "name" | "created_at" | "updated_at" | undefined,
    sortOrder: params.sortOrder as "asc" | "desc" | undefined,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sites"
        description="Manage all your client websites"
      >
        <Link href="/dashboard/sites/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Site
          </Button>
        </Link>
      </PageHeader>

      <SiteFiltersBar />

      <Suspense fallback={<SitesGridSkeleton />}>
        <SitesGrid filters={filters} />
      </Suspense>
    </div>
  );
}
```

### Task 47.2: Create New Site Page

**File: `src/app/(dashboard)/sites/new/page.tsx`**

```tsx
import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { CreateSiteForm } from "@/components/sites/create-site-form";
import { getClients } from "@/lib/actions/clients";

export const metadata: Metadata = {
  title: "Create Site | DRAMAC",
  description: "Create a new website",
};

export default async function NewSitePage() {
  const clients = await getClients();
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Site"
        description="Set up a new website for a client"
        backHref="/dashboard/sites"
      />

      <div className="max-w-2xl">
        <CreateSiteForm clients={clients || []} />
      </div>
    </div>
  );
}
```

### Task 47.3: Refactored Create Site Form

**File: `src/components/sites/create-site-form.tsx`** (REPLACE EXISTING)

```tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles, PenTool, CheckCircle2, XCircle } from "lucide-react";
import { createSiteAction, checkSubdomain } from "@/lib/actions/sites";
import { toast } from "sonner";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/use-debounce";
import type { Client } from "@/types/client";

const createSiteFormSchema = z.object({
  name: z.string().min(1, "Site name is required").max(100),
  subdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(30, "Subdomain must be at most 30 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
  client_id: z.string().min(1, "Please select a client"),
  description: z.string().optional(),
  buildMode: z.enum(["ai", "manual"]),
});

type FormData = z.infer<typeof createSiteFormSchema>;

interface CreateSiteFormProps {
  clients: Client[];
}

export function CreateSiteForm({ clients }: CreateSiteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [subdomainStatus, setSubdomainStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  
  const form = useForm<FormData>({
    resolver: zodResolver(createSiteFormSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      client_id: "",
      description: "",
      buildMode: "ai",
    },
  });

  const watchName = form.watch("name");
  const watchSubdomain = form.watch("subdomain");
  const debouncedSubdomain = useDebounce(watchSubdomain, 500);

  // Auto-generate subdomain from name
  useEffect(() => {
    if (watchName && !form.getValues("subdomain")) {
      const generated = watchName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 30);
      form.setValue("subdomain", generated, { shouldValidate: true });
    }
  }, [watchName, form]);

  // Check subdomain availability
  useEffect(() => {
    if (debouncedSubdomain && debouncedSubdomain.length >= 3) {
      setSubdomainStatus("checking");
      checkSubdomain(debouncedSubdomain)
        .then((result) => {
          setSubdomainStatus(result.available ? "available" : "taken");
        })
        .catch(() => {
          setSubdomainStatus("idle");
        });
    } else {
      setSubdomainStatus("idle");
    }
  }, [debouncedSubdomain]);

  const onSubmit = (data: FormData) => {
    if (subdomainStatus === "taken") {
      toast.error("Please choose a different subdomain");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createSiteAction({
          name: data.name,
          subdomain: data.subdomain,
          client_id: data.client_id,
          description: data.description,
        });

        if (result.error) {
          toast.error(result.error);
          return;
        }

        toast.success("Site created successfully!");
        
        // Navigate based on build mode
        if (data.buildMode === "ai") {
          router.push(`/dashboard/sites/${result.data?.id}/builder`);
        } else {
          router.push(`/editor/${result.data?.id}`);
        }
      } catch (error) {
        toast.error("Failed to create site. Please try again.");
      }
    });
  };

  const getSubdomainIcon = () => {
    switch (subdomainStatus) {
      case "checking":
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case "available":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "taken":
        return <XCircle className="h-4 w-4 text-danger" />;
      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Site Details</CardTitle>
            <CardDescription>Basic information about your new site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} {client.company && `(${client.company})`}
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
                  <FormLabel>Site Name</FormLabel>
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
                  <FormLabel>Subdomain</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          placeholder="my-site"
                          {...field}
                          className="pr-10"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {getSubdomainIcon()}
                        </div>
                      </div>
                      <span className="text-muted-foreground">.dramac.app</span>
                    </div>
                  </FormControl>
                  {subdomainStatus === "taken" && (
                    <p className="text-sm text-danger">This subdomain is already taken</p>
                  )}
                  {subdomainStatus === "available" && (
                    <p className="text-sm text-success">This subdomain is available!</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of the site" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How do you want to build?</CardTitle>
            <CardDescription>Choose your preferred starting method</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="buildMode"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid gap-4 md:grid-cols-2"
                    >
                      <div>
                        <RadioGroupItem
                          value="ai"
                          id="ai"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="ai"
                          className="flex flex-col items-start gap-3 rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">Generate with AI</p>
                              <p className="text-sm text-muted-foreground">
                                Describe your business and let AI build it
                              </p>
                            </div>
                          </div>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem
                          value="manual"
                          id="manual"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="manual"
                          className="flex flex-col items-start gap-3 rounded-lg border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <PenTool className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium">Start from Scratch</p>
                              <p className="text-sm text-muted-foreground">
                                Build manually with the visual editor
                              </p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/sites")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || subdomainStatus === "taken"}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Site
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

### Task 47.4: Create Debounce Hook

**File: `src/hooks/use-debounce.ts`**

```typescript
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### Task 47.5: Site Detail Page

**File: `src/app/(dashboard)/sites/[siteId]/page.tsx`**

```tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSite } from "@/lib/actions/sites";
import { PageHeader } from "@/components/layout/page-header";
import { SiteDetailTabs } from "@/components/sites/site-detail-tabs";
import { Button } from "@/components/ui/button";
import { Edit, ExternalLink, Eye } from "lucide-react";
import Link from "next/link";

interface SiteDetailPageProps {
  params: Promise<{ siteId: string }>;
}

export async function generateMetadata({ params }: SiteDetailPageProps): Promise<Metadata> {
  const { siteId } = await params;
  const site = await getSite(siteId);
  
  return {
    title: site ? `${site.name} | DRAMAC` : "Site Not Found",
  };
}

export default async function SiteDetailPage({ params }: SiteDetailPageProps) {
  const { siteId } = await params;
  const site = await getSite(siteId);

  if (!site) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={site.name}
        description={`${site.subdomain}.dramac.app`}
        backHref="/dashboard/sites"
      >
        <div className="flex items-center gap-2">
          {site.published && (
            <a
              href={`https://${site.subdomain}.dramac.app`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Live
              </Button>
            </a>
          )}
          <Link href={`/editor/${site.id}`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Open Editor
            </Button>
          </Link>
        </div>
      </PageHeader>

      <SiteDetailTabs site={site} />
    </div>
  );
}
```

### Task 47.6: Site Detail Tabs Component

**File: `src/components/sites/site-detail-tabs.tsx`**

```tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteOverview } from "./site-overview";
import { SitePagesList } from "./site-pages-list";
import { SiteSettingsForm } from "./site-settings-form";
import { SiteModulesTab } from "./site-modules-tab";
import { SiteDangerZone } from "./site-danger-zone";
import type { Site } from "@/types/site";

interface SiteDetailTabsProps {
  site: Site & {
    pages?: Array<{
      id: string;
      name: string;
      slug: string;
      is_homepage: boolean;
      created_at: string;
    }>;
    client?: { id: string; name: string; company: string | null } | null;
  };
}

export function SiteDetailTabs({ site }: SiteDetailTabsProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="pages">Pages</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="modules">Modules</TabsTrigger>
        <TabsTrigger value="danger">Danger Zone</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <SiteOverview site={site} />
      </TabsContent>

      <TabsContent value="pages">
        <SitePagesList siteId={site.id} pages={site.pages || []} />
      </TabsContent>

      <TabsContent value="settings">
        <SiteSettingsForm site={site} />
      </TabsContent>

      <TabsContent value="modules">
        <SiteModulesTab siteId={site.id} />
      </TabsContent>

      <TabsContent value="danger">
        <SiteDangerZone site={site} />
      </TabsContent>
    </Tabs>
  );
}
```

### Task 47.7: Fix Sites Grid Dropdown Actions

**Update: `src/components/sites/sites-grid.tsx`**

Add delete functionality to the dropdown:

```tsx
// Add this import at the top
import { DeleteSiteButton } from "./delete-site-button";

// In the DropdownMenuContent, replace the Delete DropdownMenuItem:
<DropdownMenuItem
  className="text-danger"
  onSelect={(e) => e.preventDefault()}
>
  <DeleteSiteButton siteId={site.id} siteName={site.name} />
</DropdownMenuItem>
```

### Task 47.8: Delete Site Button Component

**File: `src/components/sites/delete-site-button.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteSiteAction } from "@/lib/actions/sites";
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
import { Input } from "@/components/ui/input";

interface DeleteSiteButtonProps {
  siteId: string;
  siteName: string;
  onSuccess?: () => void;
}

export function DeleteSiteButton({ siteId, siteName, onSuccess }: DeleteSiteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const canDelete = confirmText === siteName;

  const handleDelete = async () => {
    if (!canDelete) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteSiteAction(siteId);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Site deleted successfully");
        setOpen(false);
        onSuccess?.();
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to delete site");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button className="flex w-full items-center text-danger">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Site</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the site
            <strong className="text-foreground"> "{siteName}"</strong> and all its pages.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-2">
            Type <strong>{siteName}</strong> to confirm:
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={siteName}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmText("")}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Site
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Task 47.9: Update Navigation Config

**Update: `src/config/navigation.ts`**

```typescript
import {
  LayoutDashboard,
  Users,
  Globe,
  Puzzle,
  Package,
  CreditCard,
  Settings,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

export const mainNavigation: NavGroup[] = [
  {
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Clients",
        href: "/dashboard/clients",
        icon: Users,
      },
      {
        title: "Sites",
        href: "/dashboard/sites",
        icon: Globe,
      },
    ],
  },
  {
    title: "Marketplace",
    items: [
      {
        title: "Browse Modules",
        href: "/dashboard/marketplace",
        icon: Package,
      },
      {
        title: "My Modules",
        href: "/dashboard/modules",
        icon: Puzzle,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "Billing",
        href: "/dashboard/billing",
        icon: CreditCard,
      },
      {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
      },
    ],
  },
];

export const bottomNavigation: NavItem[] = [
  {
    title: "Help & Support",
    href: "/dashboard/support",
    icon: HelpCircle,
  },
];
```

---

## 🧪 Testing Checklist

After implementing this phase, verify:

- [ ] `/dashboard/sites` displays all sites for the agency
- [ ] "New Site" button navigates to create form
- [ ] Create site form validates all fields
- [ ] Subdomain availability check works in real-time
- [ ] Creating a site shows success and redirects
- [ ] Site detail page loads with all tabs
- [ ] Overview tab shows site information
- [ ] Pages tab lists all pages
- [ ] Settings tab allows editing site settings
- [ ] Modules tab shows available modules
- [ ] Danger zone tab allows site deletion
- [ ] Delete confirmation requires typing site name
- [ ] Sites grid dropdown actions all work
- [ ] Navigation sidebar links work correctly

---

## 📝 Notes

- The debounce hook is reusable for other forms
- Site detail tabs use client-side navigation for speed
- Delete requires confirmation to prevent accidents
- All actions use server actions for security
