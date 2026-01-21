# Phase 14: Site Detail & Settings

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Build the site detail page with overview, pages list, site settings (general, domains, SEO), and publish/unpublish functionality.

---

## 📋 Prerequisites

- [ ] Phase 1-13 completed

---

## ✅ Tasks

### Task 14.1: Site Detail Page

**File: `src/app/(dashboard)/dashboard/sites/[siteId]/page.tsx`**

```typescript
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSite } from "@/lib/actions/sites";
import { PageHeader } from "@/components/layout/page-header";
import { SiteOverview } from "@/components/sites/site-overview";
import { SitePagesList } from "@/components/sites/site-pages-list";
import { SitePublishButton } from "@/components/sites/site-publish-button";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Settings, ExternalLink } from "lucide-react";

interface SiteDetailPageProps {
  params: { siteId: string };
}

export async function generateMetadata({
  params,
}: SiteDetailPageProps): Promise<Metadata> {
  const site = await getSite(params.siteId).catch(() => null);
  return {
    title: site ? `${site.name} | DRAMAC` : "Site Not Found",
  };
}

export default async function SiteDetailPage({ params }: SiteDetailPageProps) {
  const site = await getSite(params.siteId).catch(() => null);

  if (!site) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={site.name}
        description={
          <div className="flex items-center gap-2">
            <span>{site.subdomain}.dramac.app</span>
            {site.status === "published" && (
              <a
                href={`https://${site.subdomain}.dramac.app`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        }
      >
        <Link href={`/dashboard/sites/${site.id}/settings`}>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
        <Link href={`/dashboard/sites/${site.id}/editor`}>
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            Open Editor
          </Button>
        </Link>
        <SitePublishButton site={site} />
      </PageHeader>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pages">Pages ({site.pages?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SiteOverview site={site} />
        </TabsContent>

        <TabsContent value="pages">
          <SitePagesList siteId={site.id} pages={site.pages || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Task 14.2: Site Overview Component

**File: `src/components/sites/site-overview.tsx`**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Globe,
  Calendar,
  Clock,
  FileText,
  User,
  ExternalLink,
  Link as LinkIcon,
} from "lucide-react";
import { format } from "date-fns";
import type { Site } from "@/types/site";

interface SiteOverviewProps {
  site: Site & {
    client?: { id: string; name: string; company: string | null } | null;
    pages?: { id: string }[];
  };
}

const statusColors = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-success text-success-foreground",
  archived: "bg-warning text-warning-foreground",
};

export function SiteOverview({ site }: SiteOverviewProps) {
  const stats = [
    {
      label: "Total Pages",
      value: site.pages?.length || 0,
      icon: FileText,
    },
    {
      label: "Status",
      value: site.status,
      icon: Globe,
      isBadge: true,
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Site Info Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Site Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Subdomain */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Globe className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subdomain</p>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{site.subdomain}.dramac.app</span>
                  {site.status === "published" && (
                    <a
                      href={`https://${site.subdomain}.dramac.app`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Domain */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <LinkIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Custom Domain</p>
                <p className="font-medium">
                  {site.custom_domain || (
                    <span className="text-muted-foreground">Not configured</span>
                  )}
                </p>
              </div>
            </div>

            {/* Client */}
            {site.client && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{site.client.name}</p>
                </div>
              </div>
            )}

            {/* Created */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {format(new Date(site.created_at), "MMM d, yyyy")}
                </p>
              </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {format(new Date(site.updated_at), "MMM d, yyyy")}
                </p>
              </div>
            </div>

            {/* Published At */}
            {site.published_at && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Published</p>
                  <p className="font-medium">
                    {format(new Date(site.published_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {site.description && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">{site.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pages</p>
                <p className="text-2xl font-bold">{site.pages?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={statusColors[site.status as keyof typeof statusColors]}>
                  {site.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### Task 14.3: Site Pages List Component

**File: `src/components/sites/site-pages-list.tsx`**

```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, MoreVertical, Pencil, Trash2, Home, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Page {
  id: string;
  title: string;
  slug: string;
  is_homepage: boolean;
  created_at: string;
}

interface SitePagesListProps {
  siteId: string;
  pages: Page[];
}

export function SitePagesList({ siteId, pages }: SitePagesListProps) {
  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No pages yet</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Create the first page for this site.
        </p>
        <Link href={`/dashboard/sites/${siteId}/pages/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Page
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Pages</h3>
          <Link href={`/dashboard/sites/${siteId}/pages/new`}>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Page
            </Button>
          </Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => (
              <TableRow key={page.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {page.is_homepage ? (
                      <Home className="h-4 w-4 text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Link
                      href={`/dashboard/sites/${siteId}/editor?page=${page.id}`}
                      className="font-medium hover:underline"
                    >
                      {page.title}
                    </Link>
                    {page.is_homepage && (
                      <Badge variant="outline" className="text-xs">
                        Homepage
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">
                  {page.slug}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(page.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/sites/${siteId}/editor?page=${page.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      {!page.is_homepage && (
                        <DropdownMenuItem className="text-danger">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

### Task 14.4: Site Publish Button

**File: `src/components/sites/site-publish-button.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Globe, GlobeLock } from "lucide-react";
import { toast } from "sonner";
import { publishSiteAction } from "@/lib/actions/sites";
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
import type { Site } from "@/types/site";

interface SitePublishButtonProps {
  site: Site;
}

export function SitePublishButton({ site }: SitePublishButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const isPublished = site.status === "published";

  const handlePublish = async () => {
    setIsPending(true);

    try {
      const result = await publishSiteAction(site.id, !isPublished);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isPublished ? "Site unpublished" : "Site published successfully!");
        router.refresh();
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  if (isPublished) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <GlobeLock className="mr-2 h-4 w-4" />
            Unpublish
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpublish Site</AlertDialogTitle>
            <AlertDialogDescription>
              This will make the site inaccessible to visitors. You can publish it again at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish}>Unpublish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Button onClick={handlePublish} disabled={isPending}>
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      <Globe className="mr-2 h-4 w-4" />
      Publish Site
    </Button>
  );
}
```

### Task 14.5: Site Settings Page

**File: `src/app/(dashboard)/dashboard/sites/[siteId]/settings/page.tsx`**

```typescript
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSite } from "@/lib/actions/sites";
import { PageHeader } from "@/components/layout/page-header";
import { SiteSettingsForm } from "@/components/sites/site-settings-form";
import { SiteDangerZone } from "@/components/sites/site-danger-zone";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";

interface SiteSettingsPageProps {
  params: { siteId: string };
}

export async function generateMetadata({
  params,
}: SiteSettingsPageProps): Promise<Metadata> {
  const site = await getSite(params.siteId).catch(() => null);
  return {
    title: site ? `Settings - ${site.name} | DRAMAC` : "Site Not Found",
  };
}

export default async function SiteSettingsPage({ params }: SiteSettingsPageProps) {
  const site = await getSite(params.siteId).catch(() => null);

  if (!site) {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href={`/dashboard/sites/${site.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Site
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Site Settings"
        description={`Configure settings for ${site.name}`}
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <SiteSettingsForm site={site} section="general" />
        </TabsContent>

        <TabsContent value="domains">
          <SiteSettingsForm site={site} section="domains" />
        </TabsContent>

        <TabsContent value="seo">
          <SiteSettingsForm site={site} section="seo" />
        </TabsContent>

        <TabsContent value="danger">
          <SiteDangerZone site={site} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Task 14.6: Site Settings Form

**File: `src/components/sites/site-settings-form.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateSiteAction } from "@/lib/actions/sites";
import { updateSiteSchema, type UpdateSiteFormData } from "@/lib/validations/site";
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
import { Input, Button, Textarea } from "@/components/ui";
import type { Site } from "@/types/site";

interface SiteSettingsFormProps {
  site: Site;
  section: "general" | "domains" | "seo";
}

export function SiteSettingsForm({ site, section }: SiteSettingsFormProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<UpdateSiteFormData>({
    resolver: zodResolver(updateSiteSchema),
    defaultValues: {
      name: site.name,
      description: site.description || "",
      subdomain: site.subdomain,
      custom_domain: site.custom_domain || "",
      meta_title: site.meta_title || "",
      meta_description: site.meta_description || "",
      favicon_url: site.favicon_url || "",
      og_image_url: site.og_image_url || "",
    },
  });

  const onSubmit = async (data: UpdateSiteFormData) => {
    setIsPending(true);

    try {
      const result = await updateSiteAction(site.id, data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Settings saved successfully");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  if (section === "general") {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic site information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
                        placeholder="Brief description of the site..."
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

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  if (section === "domains") {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Domain Settings</CardTitle>
              <CardDescription>Configure your site's URLs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="subdomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subdomain</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input {...field} />
                        <span className="text-sm text-muted-foreground">.dramac.app</span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Your free subdomain on dramac.app
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="custom_domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Domain</FormLabel>
                    <FormControl>
                      <Input placeholder="example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Point your domain's DNS to our servers to use a custom domain.
                      Configuration instructions will appear after saving.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  if (section === "seo") {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Optimize your site for search engines.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="meta_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Title</FormLabel>
                    <FormControl>
                      <Input placeholder="My Awesome Website" maxLength={60} {...field} />
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
                        placeholder="A brief description of your website..."
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

              <FormField
                control={form.control}
                name="favicon_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favicon URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/favicon.ico" {...field} />
                    </FormControl>
                    <FormDescription>
                      URL to your site's favicon image
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="og_image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Social Share Image (OG Image)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/og-image.jpg" {...field} />
                    </FormControl>
                    <FormDescription>
                      Image shown when sharing on social media (recommended: 1200x630px)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return null;
}
```

### Task 14.7: Site Danger Zone

**File: `src/components/sites/site-danger-zone.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { deleteSiteAction } from "@/lib/actions/sites";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import type { Site } from "@/types/site";

interface SiteDangerZoneProps {
  site: Site;
}

export function SiteDangerZone({ site }: SiteDangerZoneProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const canDelete = confirmText === site.name;

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteSiteAction(site.id);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Site deleted successfully");
        router.push("/dashboard/sites");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-danger">
      <CardHeader>
        <CardTitle className="text-danger flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>
          Irreversible and destructive actions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Delete this site</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete this site and all its pages.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Site
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Site</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the site
                  <strong> "{site.name}"</strong> and all its pages.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Type <strong>{site.name}</strong> to confirm:
                </p>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={site.name}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText("")}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={!canDelete || isDeleting}
                  className="bg-danger hover:bg-danger/90"
                >
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete Site
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 📐 Acceptance Criteria

- [ ] Site detail page shows overview and pages
- [ ] Pages list shows all pages with homepage indicator
- [ ] Publish/Unpublish button works with confirmation
- [ ] Settings page has tabs for General, Domains, SEO
- [ ] General settings save correctly
- [ ] Domain settings save correctly
- [ ] SEO settings save with character counters
- [ ] Danger zone requires typing site name to delete
- [ ] Site deletion redirects to sites list

---

## 📁 Files Created This Phase

```
src/components/sites/
├── site-overview.tsx
├── site-pages-list.tsx
├── site-publish-button.tsx
├── site-settings-form.tsx
└── site-danger-zone.tsx

src/app/(dashboard)/dashboard/sites/[siteId]/
├── page.tsx
└── settings/
    └── page.tsx
```

---

## ➡️ Next Phase

**Phase 15: Page Management** - Create, edit, delete pages, page settings, set homepage.
