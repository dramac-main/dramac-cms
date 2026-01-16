# Phase 76B: Module Marketplace & Management UI

> **AI Model**: Claude Opus 4.5 (2x) ⭐ CRITICAL PHASE
>
> **Priority**: 🔴 CRITICAL - CORE BUSINESS MODEL
>
> **Estimated Time**: 18-22 hours
>
> **Depends On**: Phase 76A (Module System Architecture)

---

## 🎯 Objective

Build the complete user interface for the module/plugin ecosystem:

1. **Super Admin**: Module Development Studio & Management
2. **Agency**: Module Marketplace, Subscriptions, Markup Pricing
3. **Client Portal**: Module Apps & Tools
4. **Site**: Module Integration Points

This is where the business model becomes **real and usable**.

---

## 📋 Prerequisites

- [ ] Phase 76A completed (Architecture & Database)
- [ ] New module tables created
- [ ] Module sandbox runtime working
- [ ] Stripe billing configured

---

## 🏗️ UI Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     SUPER ADMIN                                  │
│  /admin/modules                                                  │
│  ├── /admin/modules/studio      → Create/Edit modules           │
│  ├── /admin/modules/[id]        → Module details                │
│  ├── /admin/modules/pricing     → Wholesale pricing             │
│  ├── /admin/modules/requests    → Agency requests               │
│  └── /admin/modules/analytics   → Usage & revenue               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     AGENCY DASHBOARD                             │
│  /dashboard                                                      │
│  ├── /marketplace               → Browse & subscribe            │
│  │   ├── /marketplace/[slug]    → Module details               │
│  │   └── /marketplace/category  → Filter by category           │
│  ├── /dashboard/modules         → My subscriptions              │
│  │   ├── /dashboard/modules/pricing → Set client markup        │
│  │   └── /dashboard/modules/[id] → Module management           │
│  └── /dashboard/requests        → Request custom modules        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT MANAGEMENT                            │
│  /dashboard/clients/[clientId]                                   │
│  └── /modules                   → Client module installations   │
│      ├── Available modules (agency-subscribed)                  │
│      ├── Installed client-level modules                         │
│      └── Install to client flow                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     SITE MANAGEMENT                              │
│  /dashboard/sites/[siteId]                                       │
│  └── /modules                   → Site module installations     │
│      ├── Available modules (client or agency-subscribed)        │
│      ├── Installed site-level modules                           │
│      └── Module settings per site                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT PORTAL                                │
│  /portal                                                         │
│  ├── /portal/apps              → Client's module apps           │
│  │   └── /portal/apps/[slug]   → Use module app                 │
│  └── Module widgets on portal home                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Files to Create

```
src/app/(dashboard)/admin/modules/
├── page.tsx                        # Module management dashboard
├── studio/
│   ├── page.tsx                    # Create new module
│   └── [moduleId]/page.tsx         # Edit module
├── pricing/page.tsx                # Wholesale pricing management
├── requests/page.tsx               # Agency module requests
├── analytics/page.tsx              # Module analytics
└── [moduleId]/page.tsx             # Module detail (admin view)

src/app/(dashboard)/marketplace/
├── page.tsx                        # Marketplace home (UPDATE)
├── [slug]/page.tsx                 # Module detail page
├── category/[category]/page.tsx    # Category filter page
└── subscribed/page.tsx             # My subscriptions

src/app/(dashboard)/dashboard/modules/
├── page.tsx                        # Agency module management
├── pricing/page.tsx                # Set client markup
├── requests/
│   ├── page.tsx                    # View my requests
│   └── new/page.tsx                # Submit new request
└── [moduleId]/page.tsx             # Module detail (agency view)

src/app/(dashboard)/clients/[clientId]/
└── modules/page.tsx                # Client module management

src/app/(dashboard)/sites/[siteId]/
└── modules/page.tsx                # Site module management

src/app/portal/
├── apps/
│   ├── page.tsx                    # Client's apps/modules
│   └── [slug]/page.tsx             # Use specific module

src/components/modules/
├── admin/
│   ├── module-studio.tsx           # Full module editor
│   ├── code-editor.tsx             # Monaco code editor
│   ├── manifest-builder.tsx        # Build manifest visually
│   ├── module-preview.tsx          # Live preview
│   ├── wholesale-pricing-form.tsx  # Set prices
│   └── request-list.tsx            # View requests
├── marketplace/
│   ├── module-catalog.tsx          # Browse all modules
│   ├── module-card.tsx             # Module card (UPDATE)
│   ├── module-detail.tsx           # Full module page
│   ├── category-filter.tsx         # Category sidebar
│   ├── search-bar.tsx              # Search modules
│   ├── price-display.tsx           # Show prices
│   └── subscribe-button.tsx        # Subscribe to module
├── agency/
│   ├── subscription-list.tsx       # My subscriptions
│   ├── markup-pricing-form.tsx     # Set client prices
│   ├── module-request-form.tsx     # Request custom module
│   └── installation-manager.tsx    # Manage installations
├── client/
│   ├── client-modules-list.tsx     # Modules for client
│   ├── install-module-dialog.tsx   # Install to client
│   └── client-module-card.tsx      # Module card for clients
├── site/
│   ├── site-modules-list.tsx       # Modules for site
│   ├── site-module-settings.tsx    # Configure module
│   └── site-module-card.tsx        # Module card for sites
├── portal/
│   ├── portal-apps-grid.tsx        # Apps in portal
│   ├── portal-app-launcher.tsx     # Launch module app
│   └── portal-module-widget.tsx    # Dashboard widget
└── shared/
    ├── module-icon.tsx             # Display module icon
    ├── module-status-badge.tsx     # Active/Inactive badge
    ├── install-level-badge.tsx     # Agency/Client/Site badge
    └── revenue-calculator.tsx      # Show revenue breakdown
```

---

## ✅ Tasks

### Task 76B.1: Super Admin - Module Management Dashboard

**File: `src/app/(dashboard)/admin/modules/page.tsx`**

```tsx
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { 
  Package, 
  Plus, 
  DollarSign, 
  MessageSquare, 
  BarChart3,
  Settings 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { AdminModuleList } from "@/components/modules/admin/admin-module-list";
import { ModuleStats } from "@/components/modules/admin/module-stats";
import { PendingRequests } from "@/components/modules/admin/pending-requests";

export const metadata: Metadata = {
  title: "Module Management | Admin",
  description: "Manage platform modules and plugins",
};

export default async function AdminModulesPage() {
  const supabase = await createClient();
  
  // Verify super admin
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();
    
  if (profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  // Get module stats
  const { data: modules } = await supabase
    .from("modules")
    .select("*")
    .order("created_at", { ascending: false });

  const { count: totalSubscriptions } = await supabase
    .from("agency_module_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: pendingRequests } = await supabase
    .from("module_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "submitted");

  const stats = {
    totalModules: modules?.length || 0,
    activeModules: modules?.filter(m => m.status === "active").length || 0,
    totalSubscriptions: totalSubscriptions || 0,
    pendingRequests: pendingRequests || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Module Management</h1>
          <p className="text-muted-foreground">
            Create, manage, and monitor platform modules
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/modules/requests">
              <MessageSquare className="h-4 w-4 mr-2" />
              Requests ({stats.pendingRequests})
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/modules/studio">
              <Plus className="h-4 w-4 mr-2" />
              Create Module
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.totalModules}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{stats.activeModules}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.totalSubscriptions}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{stats.pendingRequests}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/modules/studio">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Module Studio
              </CardTitle>
              <CardDescription>
                Create new modules with the visual builder
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/admin/modules/pricing">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Wholesale Pricing
              </CardTitle>
              <CardDescription>
                Set platform pricing for all modules
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/admin/modules/analytics">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Module Analytics
              </CardTitle>
              <CardDescription>
                View usage, revenue, and performance
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Module List */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Modules</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="deprecated">Deprecated</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <AdminModuleList modules={modules || []} />
        </TabsContent>
        
        <TabsContent value="active" className="mt-4">
          <AdminModuleList modules={modules?.filter(m => m.status === "active") || []} />
        </TabsContent>
        
        <TabsContent value="draft" className="mt-4">
          <AdminModuleList modules={modules?.filter(m => m.status === "draft") || []} />
        </TabsContent>
        
        <TabsContent value="deprecated" className="mt-4">
          <AdminModuleList modules={modules?.filter(m => m.status === "deprecated") || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

### Task 76B.2: Admin Module List Component

**File: `src/components/modules/admin/admin-module-list.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Package, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  ToggleLeft, 
  ToggleRight,
  Building2,
  Users,
  Globe
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/modules/utils";

interface Module {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  install_level: string;
  status: string;
  wholesale_price_monthly: number;
  install_count: number;
  created_at: string;
}

interface AdminModuleListProps {
  modules: Module[];
}

export function AdminModuleList({ modules }: AdminModuleListProps) {
  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium mb-1">No modules found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create your first module in the Module Studio
        </p>
        <Button asChild>
          <Link href="/admin/modules/studio">Create Module</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Module</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Install Level</TableHead>
            <TableHead>Wholesale Price</TableHead>
            <TableHead>Installs</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modules.map((module) => (
            <TableRow key={module.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{module.icon}</span>
                  <div>
                    <Link 
                      href={`/admin/modules/${module.id}`}
                      className="font-medium hover:underline"
                    >
                      {module.name}
                    </Link>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {module.description}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{module.category}</Badge>
              </TableCell>
              <TableCell>
                <InstallLevelBadge level={module.install_level} />
              </TableCell>
              <TableCell>
                {module.wholesale_price_monthly === 0 
                  ? <span className="text-green-600 font-medium">Free</span>
                  : <span>${(module.wholesale_price_monthly / 100).toFixed(2)}/mo</span>
                }
              </TableCell>
              <TableCell>{module.install_count}</TableCell>
              <TableCell>
                <StatusBadge status={module.status} />
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
                      <Link href={`/admin/modules/${module.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/modules/studio/${module.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Module
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      {module.status === 'active' ? (
                        <>
                          <ToggleLeft className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleRight className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function InstallLevelBadge({ level }: { level: string }) {
  const config = {
    agency: { icon: Building2, label: "Agency", variant: "default" as const },
    client: { icon: Users, label: "Client", variant: "secondary" as const },
    site: { icon: Globe, label: "Site", variant: "outline" as const },
  };
  
  const { icon: Icon, label, variant } = config[level as keyof typeof config] || config.site;
  
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    active: { label: "Active", className: "bg-green-100 text-green-800" },
    draft: { label: "Draft", className: "bg-gray-100 text-gray-800" },
    review: { label: "In Review", className: "bg-yellow-100 text-yellow-800" },
    deprecated: { label: "Deprecated", className: "bg-red-100 text-red-800" },
  };
  
  const { label, className } = config[status as keyof typeof config] || config.draft;
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
```

---

### Task 76B.3: Module Request System

**File: `src/app/(dashboard)/dashboard/requests/new/page.tsx`**

```tsx
import { Metadata } from "next";
import { ModuleRequestForm } from "@/components/modules/agency/module-request-form";

export const metadata: Metadata = {
  title: "Request Module | DRAMAC",
  description: "Request a custom module to be built",
};

export default function NewModuleRequestPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Request a Module</h1>
        <p className="text-muted-foreground mt-1">
          Don't see a module you need? Request it and our team will review.
        </p>
      </div>

      <ModuleRequestForm />
    </div>
  );
}
```

**File: `src/components/modules/agency/module-request-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const requestSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(50, "Please provide more detail (50+ characters)"),
  useCase: z.string().min(20, "Explain the use case (20+ characters)"),
  targetAudience: z.string().min(10, "Who would use this?"),
  suggestedInstallLevel: z.enum(["agency", "client", "site"]),
  suggestedCategory: z.string(),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  budgetRange: z.string(),
  willingToFund: z.boolean(),
});

type RequestFormValues = z.infer<typeof requestSchema>;

export function ModuleRequestForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: "",
      description: "",
      useCase: "",
      targetAudience: "",
      suggestedInstallLevel: "client",
      suggestedCategory: "productivity",
      priority: "normal",
      budgetRange: "free",
      willingToFund: false,
    },
  });

  const onSubmit = async (data: RequestFormValues) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/modules/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to submit request");
      }

      toast.success("Module request submitted!", {
        description: "Our team will review your request soon.",
      });
      
      router.push("/dashboard/requests");
    } catch (error) {
      toast.error("Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Tips Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Tips for a Great Request
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>Be specific about what problem it solves</li>
              <li>Explain who would benefit from it</li>
              <li>Include any similar tools you've seen</li>
              <li>Higher priority requests get faster review</li>
            </ul>
          </CardContent>
        </Card>

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Module Name / Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Grant Proposal Writer" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                A short, descriptive name for the module
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Detailed Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe what this module should do, its features, and how it would work..."
                  rows={5}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Use Case */}
        <FormField
          control={form.control}
          name="useCase"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Use Case / Problem</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="What problem does this solve? Why do you or your clients need it?"
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Target Audience */}
        <FormField
          control={form.control}
          name="targetAudience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Audience</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Nonprofits, small businesses, marketing agencies"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Who would use this module?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Install Level */}
          <FormField
            control={form.control}
            name="suggestedInstallLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Suggested Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="agency">
                      Agency Tool (for your agency)
                    </SelectItem>
                    <SelectItem value="client">
                      Client App (standalone, no site needed)
                    </SelectItem>
                    <SelectItem value="site">
                      Site Module (website enhancement)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="suggestedCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="productivity">Productivity</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="crm">CRM</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="ecommerce">E-Commerce</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Priority */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low - Nice to have</SelectItem>
                    <SelectItem value="normal">Normal - Would be helpful</SelectItem>
                    <SelectItem value="high">High - Really need this</SelectItem>
                    <SelectItem value="urgent">Urgent - Critical for business</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Budget */}
          <FormField
            control={form.control}
            name="budgetRange"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Price Range</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="$1-25">$1-25/month</SelectItem>
                    <SelectItem value="$25-50">$25-50/month</SelectItem>
                    <SelectItem value="$50-100">$50-100/month</SelectItem>
                    <SelectItem value="$100+">$100+/month</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Willing to Fund */}
        <FormField
          control={form.control}
          name="willingToFund"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  I'm willing to help fund development
                </FormLabel>
                <FormDescription>
                  Funded requests are prioritized and may get exclusive early access
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Request
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
```

---

### Task 76B.4: Client Module Management Page

**File: `src/app/(dashboard)/clients/[clientId]/modules/page.tsx`**

```tsx
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Package, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientModulesList } from "@/components/modules/client/client-modules-list";
import { AvailableModulesGrid } from "@/components/modules/client/available-modules-grid";
import Link from "next/link";

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { clientId } = await params;
  const supabase = await createClient();
  
  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .single();

  return {
    title: `Modules - ${client?.name || "Client"} | DRAMAC`,
    description: "Manage modules for this client",
  };
}

export default async function ClientModulesPage({ params }: PageProps) {
  const { clientId } = await params;
  const supabase = await createClient();

  // Get client details
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select(`
      *,
      agency:agencies(id, name)
    `)
    .eq("id", clientId)
    .single();

  if (clientError || !client) {
    notFound();
  }

  // Get installed client-level modules
  const { data: installedModules } = await supabase
    .from("client_module_installations")
    .select(`
      *,
      module:modules(*)
    `)
    .eq("client_id", clientId);

  // Get available modules (agency subscribed, client-level)
  const { data: availableModules } = await supabase
    .from("agency_module_subscriptions")
    .select(`
      *,
      module:modules(*)
    `)
    .eq("agency_id", client.agency_id)
    .eq("status", "active");

  // Filter to client-level modules that aren't installed yet
  const clientLevelAvailable = availableModules?.filter(sub => {
    const isClientLevel = sub.module?.install_level === 'client';
    const alreadyInstalled = installedModules?.some(
      inst => inst.module_id === sub.module_id
    );
    return isClientLevel && !alreadyInstalled;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Link href="/dashboard/clients" className="hover:underline">
              Clients
            </Link>
            <span>/</span>
            <Link href={`/dashboard/clients/${clientId}`} className="hover:underline">
              {client.name}
            </Link>
            <span>/</span>
            <span>Modules</span>
          </div>
          <h1 className="text-3xl font-bold">Client Modules</h1>
          <p className="text-muted-foreground">
            Manage apps and tools for {client.name}
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="pt-4">
          <p className="text-sm">
            <strong>Client-level modules</strong> are standalone apps that don't require a website. 
            These are tools like grant writers, invoice generators, booking systems, etc. 
            that your client can access directly from their portal.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="installed">
        <TabsList>
          <TabsTrigger value="installed">
            Installed ({installedModules?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="available">
            Available ({clientLevelAvailable.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="installed" className="mt-4">
          <ClientModulesList 
            modules={installedModules || []} 
            clientId={clientId}
          />
        </TabsContent>

        <TabsContent value="available" className="mt-4">
          <AvailableModulesGrid 
            subscriptions={clientLevelAvailable}
            clientId={clientId}
            agencyId={client.agency_id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

### Task 76B.5: Client Modules List Component

**File: `src/components/modules/client/client-modules-list.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Package, Settings, Trash2, ToggleLeft, ToggleRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Link from "next/link";

interface ClientModule {
  id: string;
  client_id: string;
  module_id: string;
  is_enabled: boolean;
  price_paid: number;
  billing_status: string;
  installed_at: string;
  module: {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    category: string;
  };
}

interface ClientModulesListProps {
  modules: ClientModule[];
  clientId: string;
}

export function ClientModulesList({ modules, clientId }: ClientModulesListProps) {
  const [uninstallModule, setUninstallModule] = useState<ClientModule | null>(null);
  const [isUninstalling, setIsUninstalling] = useState(false);

  const handleToggle = async (moduleId: string, currentEnabled: boolean) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/modules/${moduleId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });

      if (!response.ok) throw new Error("Failed to toggle module");

      toast.success(currentEnabled ? "Module disabled" : "Module enabled");
      // Refresh page or update state
      window.location.reload();
    } catch (error) {
      toast.error("Failed to toggle module");
    }
  };

  const handleUninstall = async () => {
    if (!uninstallModule) return;
    setIsUninstalling(true);

    try {
      const response = await fetch(
        `/api/clients/${clientId}/modules/${uninstallModule.module_id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to uninstall module");

      toast.success("Module uninstalled");
      setUninstallModule(null);
      window.location.reload();
    } catch (error) {
      toast.error("Failed to uninstall module");
    } finally {
      setIsUninstalling(false);
    }
  };

  if (modules.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium mb-1">No modules installed</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Install modules from the "Available" tab to give this client access to apps and tools
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((item) => (
          <Card key={item.id} className={!item.is_enabled ? "opacity-60" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{item.module.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{item.module.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {item.module.category}
                    </Badge>
                  </div>
                </div>
                <Badge variant={item.is_enabled ? "default" : "outline"}>
                  {item.is_enabled ? "Active" : "Disabled"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {item.module.description}
              </p>

              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-muted-foreground">Monthly cost:</span>
                <span className="font-medium">
                  ${(item.price_paid / 100).toFixed(2)}/mo
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleToggle(item.module_id, item.is_enabled)}
                >
                  {item.is_enabled ? (
                    <>
                      <ToggleRight className="h-4 w-4 mr-1" />
                      Disable
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-4 w-4 mr-1" />
                      Enable
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/clients/${clientId}/modules/${item.module_id}/settings`}>
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUninstallModule(item)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Uninstall Confirmation Dialog */}
      <Dialog open={!!uninstallModule} onOpenChange={() => setUninstallModule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uninstall Module</DialogTitle>
            <DialogDescription>
              Are you sure you want to uninstall "{uninstallModule?.module.name}"? 
              This will remove access for this client and stop billing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUninstallModule(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleUninstall}
              disabled={isUninstalling}
            >
              {isUninstalling ? "Uninstalling..." : "Uninstall"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

### Task 76B.6: Client Portal Apps Page

**File: `src/app/portal/apps/page.tsx`**

```tsx
import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Package, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata: Metadata = {
  title: "My Apps | Client Portal",
  description: "Access your apps and tools",
};

export default async function PortalAppsPage() {
  const cookieStore = await cookies();
  const impersonatingClientId = cookieStore.get("impersonating_client_id")?.value;
  
  if (!impersonatingClientId) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Get client with their modules
  const { data: client, error } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", impersonatingClientId)
    .single();

  if (error || !client) {
    redirect("/dashboard");
  }

  // Get client's installed modules
  const { data: installedModules } = await supabase
    .from("client_module_installations")
    .select(`
      *,
      module:modules(*)
    `)
    .eq("client_id", impersonatingClientId)
    .eq("is_enabled", true);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Apps</h1>
        <p className="text-muted-foreground mt-1">
          Access your tools and applications
        </p>
      </div>

      {installedModules && installedModules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {installedModules.map((item) => (
            <Link key={item.id} href={`/portal/apps/${item.module.slug}`}>
              <Card className="h-full hover:border-primary transition-colors cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{item.module.icon}</span>
                    <div>
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {item.module.name}
                      </CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {item.module.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {item.module.description}
                  </p>
                  <Button variant="ghost" className="p-0 h-auto group-hover:text-primary">
                    Open App
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">No apps available</h3>
            <p className="text-sm text-muted-foreground">
              Your agency hasn't set up any apps for you yet. 
              Contact them to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

### Task 76B.7: Client Portal App Runner

**File: `src/app/portal/apps/[slug]/page.tsx`**

```tsx
import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ModuleSandbox } from "@/lib/modules/runtime/module-sandbox";
import { ModuleErrorBoundary } from "@/lib/modules/runtime/module-error-boundary";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: module } = await supabase
    .from("modules")
    .select("name, description")
    .eq("slug", slug)
    .single();

  return {
    title: `${module?.name || "App"} | Client Portal`,
    description: module?.description || "Use your app",
  };
}

export default async function PortalAppPage({ params }: PageProps) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const impersonatingClientId = cookieStore.get("impersonating_client_id")?.value;

  if (!impersonatingClientId) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Get the module
  const { data: module, error: moduleError } = await supabase
    .from("modules")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (moduleError || !module) {
    notFound();
  }

  // Verify client has access
  const { data: installation, error: installError } = await supabase
    .from("client_module_installations")
    .select("*, module:modules(*)")
    .eq("client_id", impersonatingClientId)
    .eq("module_id", module.id)
    .eq("is_enabled", true)
    .single();

  if (installError || !installation) {
    redirect("/portal/apps");
  }

  // Get client info for context
  const { data: client } = await supabase
    .from("clients")
    .select("id, name, agency_id")
    .eq("id", impersonatingClientId)
    .single();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/portal/apps">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Apps
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{module.icon}</span>
              <div>
                <h1 className="font-semibold">{module.name}</h1>
                <p className="text-sm text-muted-foreground">{module.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Content */}
      <div className="flex-1 container mx-auto px-4 py-6">
        <ModuleErrorBoundary
          moduleId={module.id}
          moduleName={module.name}
        >
          <ModuleSandbox
            module={{
              id: module.id,
              slug: module.slug,
              packageUrl: module.package_url,
              manifest: module.manifest as any,
            }}
            settings={installation.settings as Record<string, unknown>}
            context={{
              clientId: client?.id,
              agencyId: client?.agency_id,
            }}
            permissions={module.required_permissions || []}
          />
        </ModuleErrorBoundary>
      </div>
    </div>
  );
}
```

---

### Task 76B.8: Agency Markup Pricing Form

**File: `src/components/modules/agency/markup-pricing-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DollarSign, Percent, Calculator, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const markupSchema = z.object({
  markupType: z.enum(["percentage", "fixed", "custom"]),
  markupPercentage: z.number().min(0).max(500).optional(),
  markupFixedAmount: z.number().min(0).optional(),
  customPriceMonthly: z.number().min(0).optional(),
  customPriceYearly: z.number().min(0).optional(),
});

type MarkupFormValues = z.infer<typeof markupSchema>;

interface MarkupPricingFormProps {
  subscription: {
    id: string;
    module_id: string;
    markup_type: string;
    markup_percentage: number | null;
    markup_fixed_amount: number | null;
    custom_price_monthly: number | null;
    custom_price_yearly: number | null;
    module: {
      name: string;
      wholesale_price_monthly: number;
      wholesale_price_yearly: number | null;
    };
  };
}

export function MarkupPricingForm({ subscription }: MarkupPricingFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  const wholesaleMonthly = subscription.module.wholesale_price_monthly / 100;
  const wholesaleYearly = (subscription.module.wholesale_price_yearly || 0) / 100;

  const form = useForm<MarkupFormValues>({
    resolver: zodResolver(markupSchema),
    defaultValues: {
      markupType: subscription.markup_type as "percentage" | "fixed" | "custom",
      markupPercentage: subscription.markup_percentage || 50,
      markupFixedAmount: (subscription.markup_fixed_amount || 0) / 100,
      customPriceMonthly: (subscription.custom_price_monthly || 0) / 100,
      customPriceYearly: (subscription.custom_price_yearly || 0) / 100,
    },
  });

  const markupType = form.watch("markupType");
  const markupPercentage = form.watch("markupPercentage") || 0;
  const markupFixed = form.watch("markupFixedAmount") || 0;
  const customMonthly = form.watch("customPriceMonthly") || 0;

  // Calculate client price based on markup type
  const calculateClientPrice = () => {
    switch (markupType) {
      case "percentage":
        return wholesaleMonthly * (1 + markupPercentage / 100);
      case "fixed":
        return wholesaleMonthly + markupFixed;
      case "custom":
        return customMonthly;
      default:
        return wholesaleMonthly;
    }
  };

  const clientPrice = calculateClientPrice();
  const profit = clientPrice - wholesaleMonthly;

  const onSubmit = async (data: MarkupFormValues) => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/modules/subscriptions/${subscription.id}/pricing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markupType: data.markupType,
          markupPercentage: data.markupPercentage,
          markupFixedAmount: Math.round((data.markupFixedAmount || 0) * 100),
          customPriceMonthly: Math.round((data.customPriceMonthly || 0) * 100),
          customPriceYearly: Math.round((data.customPriceYearly || 0) * 100),
        }),
      });

      if (!response.ok) throw new Error("Failed to save pricing");

      toast.success("Pricing updated successfully");
    } catch (error) {
      toast.error("Failed to update pricing");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Current Pricing Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pricing Summary</CardTitle>
            <CardDescription>
              For: {subscription.module.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Wholesale (Your Cost)</p>
                <p className="text-2xl font-bold">${wholesaleMonthly.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">/month</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Client Pays</p>
                <p className="text-2xl font-bold text-primary">${clientPrice.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">/month</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Your Profit</p>
                <p className="text-2xl font-bold text-green-600">${profit.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">/month per client</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Markup Type Selection */}
        <FormField
          control={form.control}
          name="markupType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Markup Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select markup type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="percentage">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Percentage Markup
                    </div>
                  </SelectItem>
                  <SelectItem value="fixed">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Fixed Amount Markup
                    </div>
                  </SelectItem>
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Custom Price
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose how you want to calculate the price for clients
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Percentage Markup */}
        {markupType === "percentage" && (
          <FormField
            control={form.control}
            name="markupPercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Markup Percentage</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={500}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </FormControl>
                <FormDescription>
                  Common markups: 50% (1.5x), 100% (2x), 200% (3x)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Fixed Amount Markup */}
        {markupType === "fixed" && (
          <FormField
            control={form.control}
            name="markupFixedAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fixed Markup Amount</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Add this fixed amount on top of wholesale price
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Custom Price */}
        {markupType === "custom" && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="customPriceMonthly"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Monthly Price</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customPriceYearly"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Yearly Price (Optional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                      <span className="text-muted-foreground">/year</span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Leave empty to auto-calculate (monthly × 10)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <Separator />

        {/* Example Calculation */}
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Example: 10 Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Monthly Revenue</p>
                <p className="font-semibold">${(clientPrice * 10).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Monthly Profit</p>
                <p className="font-semibold text-green-600">${(profit * 10).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Yearly Revenue</p>
                <p className="font-semibold">${(clientPrice * 10 * 12).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Yearly Profit</p>
                <p className="font-semibold text-green-600">${(profit * 10 * 12).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Pricing
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
```

---

### Task 76B.9: Module Request API Route

**File: `src/app/api/modules/requests/route.ts`**

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

    // Get user's agency
    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", user.id)
      .single();

    if (!profile?.agency_id) {
      return NextResponse.json({ error: "No agency found" }, { status: 400 });
    }

    const body = await request.json();
    const {
      title,
      description,
      useCase,
      targetAudience,
      suggestedInstallLevel,
      suggestedCategory,
      priority,
      budgetRange,
      willingToFund,
    } = body;

    // Create request
    const { data, error } = await supabase
      .from("module_requests")
      .insert({
        agency_id: profile.agency_id,
        title,
        description,
        use_case: useCase,
        target_audience: targetAudience,
        suggested_install_level: suggestedInstallLevel,
        suggested_category: suggestedCategory,
        priority,
        budget_range: budgetRange,
        willing_to_fund: willingToFund,
        submitted_by: user.id,
        status: "submitted",
      })
      .select()
      .single();

    if (error) {
      console.error("Module request creation error:", error);
      return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
    }

    return NextResponse.json({ success: true, request: data });
  } catch (error) {
    console.error("Module request error:", error);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile to determine role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, agency_id")
      .eq("id", user.id)
      .single();

    let query = supabase
      .from("module_requests")
      .select(`
        *,
        agency:agencies(name),
        submitter:profiles!submitted_by(name, email)
      `)
      .order("submitted_at", { ascending: false });

    // Super admin sees all, others see only their agency's
    if (profile?.role !== "super_admin" && profile?.agency_id) {
      query = query.eq("agency_id", profile.agency_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Module requests fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
    }

    return NextResponse.json({ requests: data });
  } catch (error) {
    console.error("Module requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
```

---

## 📊 Verification Checklist

### Super Admin
- [ ] Module management dashboard loads
- [ ] Can view all modules with status
- [ ] Quick links to Studio, Pricing, Analytics work
- [ ] Module list filters by status
- [ ] Can see pending agency requests

### Agency
- [ ] Marketplace shows available modules
- [ ] Can subscribe to modules
- [ ] Can set markup pricing
- [ ] Pricing calculator shows profit
- [ ] Can install to clients
- [ ] Can request custom modules

### Client Portal
- [ ] Client sees their installed apps
- [ ] Can launch app in sandbox
- [ ] App loads and functions
- [ ] Errors are contained

### API Routes
- [ ] Module request submission works
- [ ] Markup pricing saves correctly
- [ ] Client module toggle works
- [ ] Proper authorization on all routes

---

## 📝 Notes

- All module rendering uses sandboxed iframes
- Error boundaries prevent cascade failures
- Markup pricing is agency-controlled
- Client billing goes through agency
- Module requests create feedback loop

---

## 🔗 Related Phases

- **Phase 76A**: Architecture (prerequisite)
- **Phase 79**: Billing Integration (next)
- **Phase 80**: Module Development Studio

---

**End of Phase 76B**
