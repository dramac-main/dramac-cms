# Phase 12: Client Detail Page

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Build the individual client detail page with overview, edit functionality, sites list, and client statistics.

---

## 📋 Prerequisites

- [ ] Phase 1-11 completed

---

## ✅ Tasks

### Task 12.1: Client Detail Page

**File: `src/app/(dashboard)/dashboard/clients/[clientId]/page.tsx`**

```typescript
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/actions/clients";
import { PageHeader } from "@/components/layout/page-header";
import { ClientOverview } from "@/components/clients/client-overview";
import { ClientSitesList } from "@/components/clients/client-sites-list";
import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Plus } from "lucide-react";
import Link from "next/link";

interface ClientDetailPageProps {
  params: { clientId: string };
}

export async function generateMetadata({
  params,
}: ClientDetailPageProps): Promise<Metadata> {
  const client = await getClient(params.clientId).catch(() => null);
  return {
    title: client ? `${client.name} | DRAMAC` : "Client Not Found",
  };
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const client = await getClient(params.clientId).catch(() => null);

  if (!client) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={client.name}
        description={client.company || "Client account"}
      >
        <Link href={`/dashboard/sites/new?clientId=${client.id}`}>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            New Site
          </Button>
        </Link>
        <EditClientDialog client={client}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Client
          </Button>
        </EditClientDialog>
      </PageHeader>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sites">
            Sites ({client.sites?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ClientOverview client={client} />
        </TabsContent>

        <TabsContent value="sites">
          <ClientSitesList clientId={client.id} sites={client.sites || []} />
        </TabsContent>

        <TabsContent value="activity">
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            Activity timeline coming in Phase 15
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Task 12.2: Client Overview Component

**File: `src/components/clients/client-overview.tsx`**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  Globe,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import type { Client } from "@/types/client";
import type { Database } from "@/types/database";

type Site = Database["public"]["Tables"]["sites"]["Row"];

interface ClientOverviewProps {
  client: Client & { sites?: Site[] };
}

const statusColors = {
  active: "bg-success text-success-foreground",
  inactive: "bg-muted text-muted-foreground",
  suspended: "bg-danger text-danger-foreground",
};

export function ClientOverview({ client }: ClientOverviewProps) {
  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const stats = [
    {
      label: "Total Sites",
      value: client.sites?.length || 0,
      icon: Globe,
    },
    {
      label: "Total Pages",
      value: client.sites?.reduce((acc, site) => acc + (site.page_count || 0), 0) || 0,
      icon: FileText,
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Profile Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">{client.name}</h3>
              {client.company && (
                <p className="text-muted-foreground">{client.company}</p>
              )}
              <Badge className={statusColors[client.status as keyof typeof statusColors]}>
                {client.status}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            {client.email && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${client.email}`}
                    className="font-medium hover:underline"
                  >
                    {client.email}
                  </a>
                </div>
              </div>
            )}

            {client.phone && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <a
                    href={`tel:${client.phone}`}
                    className="font-medium hover:underline"
                  >
                    {client.phone}
                  </a>
                </div>
              </div>
            )}

            {client.company && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{client.company}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {format(new Date(client.created_at), "MMM d, yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {format(new Date(client.updated_at), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>

          {client.notes && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {client.notes}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="space-y-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

### Task 12.3: Client Sites List Component

**File: `src/components/clients/client-sites-list.tsx`**

```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Plus, Settings } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/types/database";

type Site = Database["public"]["Tables"]["sites"]["Row"];

interface ClientSitesListProps {
  clientId: string;
  sites: Site[];
}

const statusColors = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-success text-success-foreground",
  archived: "bg-warning text-warning-foreground",
};

export function ClientSitesList({ clientId, sites }: ClientSitesListProps) {
  if (sites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <h3 className="text-lg font-semibold">No sites yet</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Create the first website for this client.
        </p>
        <Link href={`/dashboard/sites/new?clientId=${clientId}`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Site
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sites.map((site) => (
        <Card key={site.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base font-medium">
                <Link
                  href={`/dashboard/sites/${site.id}`}
                  className="hover:underline"
                >
                  {site.name}
                </Link>
              </CardTitle>
              <Badge className={statusColors[site.status as keyof typeof statusColors]}>
                {site.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {site.subdomain && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {site.subdomain}.dramac.app
                  </span>
                  {site.status === "published" && (
                    <a
                      href={`https://${site.subdomain}.dramac.app`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}

              {site.custom_domain && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{site.custom_domain}</span>
                  {site.status === "published" && (
                    <a
                      href={`https://${site.custom_domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  Updated {formatDistanceToNow(new Date(site.updated_at), { addSuffix: true })}
                </span>
                <div className="flex gap-1">
                  <Link href={`/dashboard/sites/${site.id}`}>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add New Site Card */}
      <Link href={`/dashboard/sites/new?clientId=${clientId}`}>
        <Card className="h-full min-h-[150px] cursor-pointer border-dashed hover:border-primary hover:bg-accent/50 transition-colors">
          <CardContent className="flex h-full flex-col items-center justify-center p-6">
            <Plus className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm font-medium">Add New Site</span>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
```

### Task 12.4: Edit Client Dialog

**File: `src/components/clients/edit-client-dialog.tsx`**

```typescript
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateClientAction } from "@/lib/actions/clients";
import { updateClientSchema, type UpdateClientFormData } from "@/lib/validations/client";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input, Button, Textarea } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Client } from "@/types/client";

interface EditClientDialogProps {
  client: Client;
  children: React.ReactNode;
}

export function EditClientDialog({ client, children }: EditClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<UpdateClientFormData>({
    resolver: zodResolver(updateClientSchema),
    defaultValues: {
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      company: client.company || "",
      notes: client.notes || "",
      status: client.status as "active" | "inactive" | "suspended",
    },
  });

  const onSubmit = async (data: UpdateClientFormData) => {
    setIsPending(true);

    try {
      const result = await updateClientAction(client.id, data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Client updated successfully");
        setOpen(false);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update client information.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 234 567 8900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about this client..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
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
      </DialogContent>
    </Dialog>
  );
}
```

### Task 12.5: Not Found Page for Clients

**File: `src/app/(dashboard)/dashboard/clients/[clientId]/not-found.tsx`**

```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserX } from "lucide-react";

export default function ClientNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
        <UserX className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold">Client Not Found</h2>
      <p className="text-muted-foreground mt-2 mb-6">
        The client you're looking for doesn't exist or has been deleted.
      </p>
      <Link href="/dashboard/clients">
        <Button>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
      </Link>
    </div>
  );
}
```

### Task 12.6: Loading State for Client Detail

**File: `src/app/(dashboard)/dashboard/clients/[clientId]/loading.tsx`**

```typescript
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ClientDetailLoading() {
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 pb-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 📐 Acceptance Criteria

- [ ] Client detail page shows all client information
- [ ] Edit dialog pre-fills current values
- [ ] Edit form validates and updates client
- [ ] Sites list shows all client sites
- [ ] Empty state shows when no sites
- [ ] "Add New Site" card links to site creation
- [ ] 404 page shows for non-existent clients
- [ ] Loading skeleton shows while data loads
- [ ] Tabs switch between overview, sites, and activity

---

## 📁 Files Created This Phase

```
src/components/clients/
├── client-overview.tsx
├── client-sites-list.tsx
└── edit-client-dialog.tsx

src/app/(dashboard)/dashboard/clients/[clientId]/
├── page.tsx
├── not-found.tsx
└── loading.tsx
```

---

## ➡️ Next Phase

**Phase 13: Site Management** - CRUD operations for sites, site creation wizard, site settings.
