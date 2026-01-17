# Phase 76B1: Module Admin Management UI

> **AI Model**: Claude Opus 4.5 (1x) ⭐ CRITICAL PHASE
>
> **Priority**: 🔴 CRITICAL - CORE BUSINESS MODEL
>
> **Estimated Time**: 6-8 hours
>
> **Depends On**: Phase 76A (Module System Architecture)
>
> **Part Of**: Phase 76B Series (Split for focused implementation)
> - **76B1**: Super Admin Module Management (THIS PHASE)
> - **76B2**: Agency Marketplace & Pricing
> - **76B3**: Client Portal Apps

---

## 🎯 Objective

Build the **Super Admin** interface for managing the module ecosystem:

1. **Module Management Dashboard** - Overview of all modules, stats, quick actions
2. **Wholesale Pricing Management** - Set platform pricing for all modules
3. **Agency Request Management** - Review and respond to module requests
4. **Module Analytics** - Usage, revenue, and performance metrics

This is where the **platform owner controls the module ecosystem**.

---

## 📋 Prerequisites

- [ ] Phase 76A completed (Architecture & Database)
- [ ] New module tables created (`modules`, `agency_module_subscriptions`, `module_requests`)
- [ ] Super Admin role exists in profiles
- [ ] LemonSqueezy billing configured

---

## 🏗️ UI Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SUPER ADMIN                                  │
│  /admin/modules                                                  │
│  ├── page.tsx                   → Module management dashboard   │
│  ├── /pricing/page.tsx          → Wholesale pricing management  │
│  ├── /requests/page.tsx         → Agency module requests        │
│  ├── /analytics/page.tsx        → Usage & revenue analytics     │
│  └── /[moduleId]/page.tsx       → Individual module details     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Files to Create

```
src/app/(dashboard)/admin/modules/
├── page.tsx                        # Module management dashboard
├── pricing/page.tsx                # Wholesale pricing management
├── requests/page.tsx               # Agency module requests
├── requests/[requestId]/page.tsx   # Individual request detail
├── analytics/page.tsx              # Module analytics
└── [moduleId]/page.tsx             # Module detail (admin view)

src/components/modules/admin/
├── admin-module-list.tsx           # List of all modules
├── module-stats-cards.tsx          # Stats overview cards
├── wholesale-pricing-form.tsx      # Set wholesale prices
├── wholesale-pricing-table.tsx     # All modules pricing table
├── request-list.tsx                # List of agency requests
├── request-detail-card.tsx         # Single request with actions
├── module-analytics-charts.tsx     # Analytics visualizations
├── module-revenue-breakdown.tsx    # Revenue by module
└── install-level-badge.tsx         # Agency/Client/Site badge

src/app/api/admin/modules/
├── route.ts                        # GET all modules, POST create
├── [moduleId]/route.ts             # GET/PATCH/DELETE individual
├── [moduleId]/pricing/route.ts     # PATCH wholesale pricing
├── requests/route.ts               # GET all requests
└── requests/[requestId]/route.ts   # PATCH request status
```

---

## ✅ Tasks

### Task 76B1.1: Module Management Dashboard

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
  Settings,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { AdminModuleList } from "@/components/modules/admin/admin-module-list";
import { ModuleStatsCards } from "@/components/modules/admin/module-stats-cards";

export const metadata: Metadata = {
  title: "Module Management | Super Admin",
  description: "Manage platform modules and plugins",
};

export default async function AdminModulesPage() {
  const supabase = await createClient();
  
  // Verify super admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
    
  if (profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  // Get all modules
  const { data: modules } = await supabase
    .from("modules")
    .select("*")
    .order("created_at", { ascending: false });

  // Get subscription stats
  const { count: totalSubscriptions } = await supabase
    .from("agency_module_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // Get pending requests count
  const { count: pendingRequests } = await supabase
    .from("module_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "submitted");

  // Calculate revenue (sum of wholesale prices * active subscriptions)
  const { data: revenueData } = await supabase
    .from("agency_module_subscriptions")
    .select(`
      module:modules(wholesale_price_monthly)
    `)
    .eq("status", "active");

  const monthlyRevenue = revenueData?.reduce((sum, sub) => {
    return sum + ((sub.module as any)?.wholesale_price_monthly || 0);
  }, 0) || 0;

  const stats = {
    totalModules: modules?.length || 0,
    activeModules: modules?.filter(m => m.status === "active").length || 0,
    draftModules: modules?.filter(m => m.status === "draft").length || 0,
    totalSubscriptions: totalSubscriptions || 0,
    pendingRequests: pendingRequests || 0,
    monthlyRevenue: monthlyRevenue / 100, // Convert cents to dollars
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
              Requests
              {stats.pendingRequests > 0 && (
                <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.pendingRequests}
                </span>
              )}
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
      <ModuleStatsCards stats={stats} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/modules/studio">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
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
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
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
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
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

      {/* Module List with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>All Modules</CardTitle>
          <CardDescription>
            Manage your module catalog
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">
                All ({stats.totalModules})
              </TabsTrigger>
              <TabsTrigger value="active">
                Active ({stats.activeModules})
              </TabsTrigger>
              <TabsTrigger value="draft">
                Drafts ({stats.draftModules})
              </TabsTrigger>
              <TabsTrigger value="deprecated">
                Deprecated
              </TabsTrigger>
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
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Task 76B1.2: Module Stats Cards Component

**File: `src/components/modules/admin/module-stats-cards.tsx`**

```tsx
import { Package, Settings, DollarSign, MessageSquare, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ModuleStats {
  totalModules: number;
  activeModules: number;
  draftModules: number;
  totalSubscriptions: number;
  pendingRequests: number;
  monthlyRevenue: number;
}

interface ModuleStatsCardsProps {
  stats: ModuleStats;
}

export function ModuleStatsCards({ stats }: ModuleStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
            Active
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
            Drafts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-yellow-500" />
            <span className="text-2xl font-bold">{stats.draftModules}</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
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
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Monthly Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span className="text-2xl font-bold">
              ${stats.monthlyRevenue.toFixed(0)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Task 76B1.3: Admin Module List Component

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
  Globe,
  ExternalLink
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
import { InstallLevelBadge } from "./install-level-badge";
import { toast } from "sonner";

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
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const handleToggleStatus = async (moduleId: string, currentStatus: string) => {
    setIsToggling(moduleId);
    const newStatus = currentStatus === "active" ? "draft" : "active";
    
    try {
      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast.success(`Module ${newStatus === "active" ? "activated" : "deactivated"}`);
      window.location.reload();
    } catch (error) {
      toast.error("Failed to update module status");
    } finally {
      setIsToggling(null);
    }
  };

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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      draft: "secondary",
      deprecated: "destructive",
      disabled: "outline",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}/mo`;
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Module</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Install Level</TableHead>
            <TableHead>Wholesale</TableHead>
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
                  <span className="text-2xl">{module.icon || "📦"}</span>
                  <div>
                    <Link 
                      href={`/admin/modules/${module.id}`}
                      className="font-medium hover:underline"
                    >
                      {module.name}
                    </Link>
                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {module.description}
                    </p>
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <Badge variant="outline">{module.category}</Badge>
              </TableCell>
              
              <TableCell>
                <InstallLevelBadge level={module.install_level} />
              </TableCell>
              
              <TableCell>
                <span className="font-medium">
                  {formatPrice(module.wholesale_price_monthly || 0)}
                </span>
              </TableCell>
              
              <TableCell>
                <span className="font-medium">{module.install_count || 0}</span>
              </TableCell>
              
              <TableCell>
                {getStatusBadge(module.status)}
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
                    <DropdownMenuItem asChild>
                      <Link href={`/marketplace/${module.slug}`} target="_blank">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View in Marketplace
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleToggleStatus(module.id, module.status)}
                      disabled={isToggling === module.id}
                    >
                      {module.status === "active" ? (
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Module
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
```

---

### Task 76B1.4: Install Level Badge Component

**File: `src/components/modules/admin/install-level-badge.tsx`**

```tsx
import { Building2, Users, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InstallLevelBadgeProps {
  level: string;
  showIcon?: boolean;
}

export function InstallLevelBadge({ level, showIcon = true }: InstallLevelBadgeProps) {
  const config: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
    agency: {
      icon: <Building2 className="h-3 w-3" />,
      label: "Agency",
      className: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-300",
    },
    client: {
      icon: <Users className="h-3 w-3" />,
      label: "Client",
      className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300",
    },
    site: {
      icon: <Globe className="h-3 w-3" />,
      label: "Site",
      className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300",
    },
  };

  const { icon, label, className } = config[level] || config.site;

  return (
    <Badge variant="outline" className={`${className} gap-1`}>
      {showIcon && icon}
      {label}
    </Badge>
  );
}
```

---

### Task 76B1.5: Wholesale Pricing Management Page

**File: `src/app/(dashboard)/admin/modules/pricing/page.tsx`**

```tsx
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DollarSign, Save, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { WholesalePricingTable } from "@/components/modules/admin/wholesale-pricing-table";

export const metadata: Metadata = {
  title: "Wholesale Pricing | Super Admin",
  description: "Set wholesale pricing for all modules",
};

export default async function WholesalePricingPage() {
  const supabase = await createClient();
  
  // Verify super admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
    
  if (profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  // Get all modules with their pricing
  const { data: modules } = await supabase
    .from("modules")
    .select(`
      id, slug, name, icon, category, install_level, status,
      pricing_type, wholesale_price_monthly, wholesale_price_yearly,
      wholesale_price_one_time, suggested_retail_monthly, suggested_retail_yearly,
      lemon_product_id, lemon_variant_monthly_id, lemon_variant_yearly_id
    `)
    .order("name");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Link href="/admin/modules" className="hover:underline">
              Module Management
            </Link>
            <span>/</span>
            <span>Wholesale Pricing</span>
          </div>
          <h1 className="text-3xl font-bold">Wholesale Pricing</h1>
          <p className="text-muted-foreground">
            Set the prices agencies pay for each module
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Wholesale prices</strong> are what agencies pay the platform. 
          Agencies then add their own <strong>markup</strong> when selling to clients.
          Example: You set $10/mo wholesale → Agency adds 100% markup → Client pays $20/mo
        </AlertDescription>
      </Alert>

      {/* Pricing Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Free Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {modules?.filter(m => (m.wholesale_price_monthly || 0) === 0).length || 0}
            </span>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Modules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {modules?.filter(m => (m.wholesale_price_monthly || 0) > 0).length || 0}
            </span>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Wholesale Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              ${(
                (modules?.reduce((sum, m) => sum + (m.wholesale_price_monthly || 0), 0) || 0) / 
                (modules?.filter(m => (m.wholesale_price_monthly || 0) > 0).length || 1) / 100
              ).toFixed(2)}/mo
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Table */}
      <Card>
        <CardHeader>
          <CardTitle>Module Pricing</CardTitle>
          <CardDescription>
            Click on a price to edit. Changes save automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WholesalePricingTable modules={modules || []} />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Task 76B1.6: Wholesale Pricing Table Component

**File: `src/components/modules/admin/wholesale-pricing-table.tsx`**

```tsx
"use client";

import { useState } from "react";
import { DollarSign, Check, X, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InstallLevelBadge } from "./install-level-badge";
import { toast } from "sonner";

interface Module {
  id: string;
  slug: string;
  name: string;
  icon: string;
  category: string;
  install_level: string;
  status: string;
  pricing_type: string;
  wholesale_price_monthly: number | null;
  wholesale_price_yearly: number | null;
  suggested_retail_monthly: number | null;
  suggested_retail_yearly: number | null;
  lemon_product_id: string | null;
}

interface WholesalePricingTableProps {
  modules: Module[];
}

export function WholesalePricingTable({ modules }: WholesalePricingTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    wholesale_monthly: string;
    wholesale_yearly: string;
    suggested_monthly: string;
    suggested_yearly: string;
  }>({
    wholesale_monthly: "",
    wholesale_yearly: "",
    suggested_monthly: "",
    suggested_yearly: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = (module: Module) => {
    setEditingId(module.id);
    setEditValues({
      wholesale_monthly: ((module.wholesale_price_monthly || 0) / 100).toFixed(2),
      wholesale_yearly: ((module.wholesale_price_yearly || 0) / 100).toFixed(2),
      suggested_monthly: ((module.suggested_retail_monthly || 0) / 100).toFixed(2),
      suggested_yearly: ((module.suggested_retail_yearly || 0) / 100).toFixed(2),
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({
      wholesale_monthly: "",
      wholesale_yearly: "",
      suggested_monthly: "",
      suggested_yearly: "",
    });
  };

  const savePrice = async (moduleId: string) => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/modules/${moduleId}/pricing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wholesale_price_monthly: Math.round(parseFloat(editValues.wholesale_monthly) * 100),
          wholesale_price_yearly: Math.round(parseFloat(editValues.wholesale_yearly) * 100),
          suggested_retail_monthly: Math.round(parseFloat(editValues.suggested_monthly) * 100),
          suggested_retail_yearly: Math.round(parseFloat(editValues.suggested_yearly) * 100),
        }),
      });

      if (!response.ok) throw new Error("Failed to update pricing");

      toast.success("Pricing updated successfully");
      cancelEditing();
      window.location.reload();
    } catch (error) {
      toast.error("Failed to update pricing");
    } finally {
      setIsSaving(false);
    }
  };

  const formatPrice = (cents: number | null) => {
    if (!cents || cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Module</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Wholesale Monthly</TableHead>
            <TableHead>Wholesale Yearly</TableHead>
            <TableHead>Suggested Retail</TableHead>
            <TableHead>LemonSqueezy</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modules.map((module) => (
            <TableRow key={module.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{module.icon || "📦"}</span>
                  <div>
                    <p className="font-medium">{module.name}</p>
                    <p className="text-xs text-muted-foreground">{module.category}</p>
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <InstallLevelBadge level={module.install_level} />
              </TableCell>
              
              <TableCell>
                {editingId === module.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editValues.wholesale_monthly}
                      onChange={(e) => setEditValues(v => ({ ...v, wholesale_monthly: e.target.value }))}
                      className="w-20 h-8"
                    />
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </div>
                ) : (
                  <span 
                    className="cursor-pointer hover:text-primary"
                    onClick={() => startEditing(module)}
                  >
                    {formatPrice(module.wholesale_price_monthly)}/mo
                  </span>
                )}
              </TableCell>
              
              <TableCell>
                {editingId === module.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editValues.wholesale_yearly}
                      onChange={(e) => setEditValues(v => ({ ...v, wholesale_yearly: e.target.value }))}
                      className="w-20 h-8"
                    />
                    <span className="text-xs text-muted-foreground">/yr</span>
                  </div>
                ) : (
                  <span 
                    className="cursor-pointer hover:text-primary text-muted-foreground"
                    onClick={() => startEditing(module)}
                  >
                    {formatPrice(module.wholesale_price_yearly)}/yr
                  </span>
                )}
              </TableCell>
              
              <TableCell>
                {editingId === module.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editValues.suggested_monthly}
                      onChange={(e) => setEditValues(v => ({ ...v, suggested_monthly: e.target.value }))}
                      className="w-20 h-8"
                    />
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    {formatPrice(module.suggested_retail_monthly)}
                  </span>
                )}
              </TableCell>
              
              <TableCell>
                {module.lemon_product_id ? (
                  <Badge variant="outline" className="text-green-600">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Not Set
                  </Badge>
                )}
              </TableCell>
              
              <TableCell>
                {editingId === module.id ? (
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => savePrice(module.id)}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={cancelEditing}
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditing(module)}
                  >
                    Edit
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

### Task 76B1.7: Agency Requests Management Page

**File: `src/app/(dashboard)/admin/modules/requests/page.tsx`**

```tsx
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MessageSquare, Filter, Clock, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { RequestList } from "@/components/modules/admin/request-list";

export const metadata: Metadata = {
  title: "Module Requests | Super Admin",
  description: "Review agency module requests",
};

export default async function ModuleRequestsPage() {
  const supabase = await createClient();
  
  // Verify super admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
    
  if (profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  // Get all requests with agency info
  const { data: requests } = await supabase
    .from("module_requests")
    .select(`
      *,
      agency:agencies(id, name),
      submitter:profiles!submitted_by(id, name, email)
    `)
    .order("submitted_at", { ascending: false });

  const stats = {
    total: requests?.length || 0,
    submitted: requests?.filter(r => r.status === "submitted").length || 0,
    reviewing: requests?.filter(r => r.status === "reviewing").length || 0,
    approved: requests?.filter(r => r.status === "approved").length || 0,
    inProgress: requests?.filter(r => r.status === "in_progress").length || 0,
    completed: requests?.filter(r => r.status === "completed").length || 0,
    rejected: requests?.filter(r => r.status === "rejected").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Link href="/admin/modules" className="hover:underline">
              Module Management
            </Link>
            <span>/</span>
            <span>Requests</span>
          </div>
          <h1 className="text-3xl font-bold">Module Requests</h1>
          <p className="text-muted-foreground">
            Review and manage module requests from agencies
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 dark:border-orange-800">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">{stats.submitted}</div>
            <p className="text-xs text-muted-foreground">New</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.reviewing}</div>
            <p className="text-xs text-muted-foreground">Reviewing</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Building</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Done</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>
            Click on a request to view details and take action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="new">
            <TabsList>
              <TabsTrigger value="new">
                New ({stats.submitted})
              </TabsTrigger>
              <TabsTrigger value="reviewing">
                Reviewing ({stats.reviewing})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({stats.approved + stats.inProgress})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({stats.completed})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({stats.rejected})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="new" className="mt-4">
              <RequestList requests={requests?.filter(r => r.status === "submitted") || []} />
            </TabsContent>
            
            <TabsContent value="reviewing" className="mt-4">
              <RequestList requests={requests?.filter(r => r.status === "reviewing") || []} />
            </TabsContent>
            
            <TabsContent value="approved" className="mt-4">
              <RequestList requests={requests?.filter(r => ["approved", "in_progress"].includes(r.status)) || []} />
            </TabsContent>
            
            <TabsContent value="completed" className="mt-4">
              <RequestList requests={requests?.filter(r => r.status === "completed") || []} />
            </TabsContent>
            
            <TabsContent value="rejected" className="mt-4">
              <RequestList requests={requests?.filter(r => r.status === "rejected") || []} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Task 76B1.8: Request List Component

**File: `src/components/modules/admin/request-list.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { 
  MessageSquare, 
  Building2, 
  User, 
  Clock, 
  ChevronRight,
  ThumbsUp,
  DollarSign,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InstallLevelBadge } from "./install-level-badge";

interface Request {
  id: string;
  title: string;
  description: string;
  use_case: string;
  target_audience: string;
  suggested_install_level: string;
  suggested_category: string;
  priority: string;
  budget_range: string;
  willing_to_fund: boolean;
  status: string;
  upvotes: number;
  submitted_at: string;
  agency: { id: string; name: string } | null;
  submitter: { id: string; name: string; email: string } | null;
}

interface RequestListProps {
  requests: Request[];
}

export function RequestList({ requests }: RequestListProps) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium mb-1">No requests in this category</h3>
        <p className="text-sm text-muted-foreground">
          Requests will appear here when agencies submit them
        </p>
      </div>
    );
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      low: { variant: "outline", className: "" },
      normal: { variant: "secondary", className: "" },
      high: { variant: "default", className: "bg-orange-500" },
      urgent: { variant: "destructive", className: "" },
    };
    const config = variants[priority] || variants.normal;
    return <Badge variant={config.variant} className={config.className}>{priority}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      submitted: { variant: "outline", label: "New" },
      reviewing: { variant: "secondary", label: "Reviewing" },
      approved: { variant: "default", label: "Approved" },
      in_progress: { variant: "default", label: "Building" },
      completed: { variant: "default", label: "Completed" },
      rejected: { variant: "destructive", label: "Rejected" },
    };
    const config = variants[status] || variants.submitted;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id} className="hover:border-primary/50 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{request.title}</CardTitle>
                  {getPriorityBadge(request.priority)}
                  {getStatusBadge(request.status)}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {request.agency?.name || "Unknown Agency"}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {request.submitter?.name || request.submitter?.email || "Unknown"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(request.submitted_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/admin/modules/requests/${request.id}`}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {request.description}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <InstallLevelBadge level={request.suggested_install_level} />
              <Badge variant="outline">{request.suggested_category}</Badge>
              {request.willing_to_fund && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Willing to Fund
                </Badge>
              )}
              {request.budget_range !== "free" && (
                <Badge variant="outline">
                  Budget: {request.budget_range}
                </Badge>
              )}
              {request.upvotes > 0 && (
                <Badge variant="outline">
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  {request.upvotes} upvotes
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

### Task 76B1.9: Admin Module API Routes

**File: `src/app/api/admin/modules/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET all modules (admin)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: modules, error } = await supabase
      .from("modules")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch modules error:", error);
      return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 });
    }

    return NextResponse.json({ modules });
  } catch (error) {
    console.error("Admin modules error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

**File: `src/app/api/admin/modules/[moduleId]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ moduleId: string }>;
}

// GET single module
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { moduleId } = await params;
    const supabase = await createClient();
    
    // Verify super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: module, error } = await supabase
      .from("modules")
      .select("*")
      .eq("id", moduleId)
      .single();

    if (error) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    return NextResponse.json({ module });
  } catch (error) {
    console.error("Get module error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PATCH update module
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { moduleId } = await params;
    const supabase = await createClient();
    
    // Verify super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const { data: module, error } = await supabase
      .from("modules")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", moduleId)
      .select()
      .single();

    if (error) {
      console.error("Update module error:", error);
      return NextResponse.json({ error: "Failed to update module" }, { status: 500 });
    }

    return NextResponse.json({ module });
  } catch (error) {
    console.error("Update module error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE module
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { moduleId } = await params;
    const supabase = await createClient();
    
    // Verify super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("modules")
      .delete()
      .eq("id", moduleId);

    if (error) {
      console.error("Delete module error:", error);
      return NextResponse.json({ error: "Failed to delete module" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete module error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

**File: `src/app/api/admin/modules/[moduleId]/pricing/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ moduleId: string }>;
}

// PATCH update wholesale pricing
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { moduleId } = await params;
    const supabase = await createClient();
    
    // Verify super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      wholesale_price_monthly,
      wholesale_price_yearly,
      wholesale_price_one_time,
      suggested_retail_monthly,
      suggested_retail_yearly,
      pricing_type,
      lemon_product_id,
      lemon_variant_monthly_id,
      lemon_variant_yearly_id,
    } = body;

    const { data: module, error } = await supabase
      .from("modules")
      .update({
        wholesale_price_monthly,
        wholesale_price_yearly,
        wholesale_price_one_time,
        suggested_retail_monthly,
        suggested_retail_yearly,
        pricing_type,
        lemon_product_id,
        lemon_variant_monthly_id,
        lemon_variant_yearly_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", moduleId)
      .select()
      .single();

    if (error) {
      console.error("Update pricing error:", error);
      return NextResponse.json({ error: "Failed to update pricing" }, { status: 500 });
    }

    return NextResponse.json({ module });
  } catch (error) {
    console.error("Update pricing error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

---

## 📊 Verification Checklist

### Super Admin Dashboard
- [ ] Module management dashboard loads at `/admin/modules`
- [ ] Stats cards show correct counts
- [ ] Quick action cards link correctly
- [ ] Module list displays all modules
- [ ] Tab filtering works (All/Active/Draft/Deprecated)
- [ ] Module actions dropdown works

### Wholesale Pricing
- [ ] Pricing page loads at `/admin/modules/pricing`
- [ ] Inline editing works for prices
- [ ] Save updates database correctly
- [ ] LemonSqueezy status shows correctly

### Agency Requests
- [ ] Requests page loads at `/admin/modules/requests`
- [ ] Stats show correct counts by status
- [ ] Request cards display properly
- [ ] Tab filtering works

### API Routes
- [ ] GET /api/admin/modules returns all modules
- [ ] PATCH /api/admin/modules/[id] updates module
- [ ] PATCH /api/admin/modules/[id]/pricing updates pricing
- [ ] All routes verify super_admin role

---

## 🔗 Related Phases

- **Phase 76A**: Architecture (prerequisite)
- **Phase 76B2**: Agency Marketplace & Pricing (next)
- **Phase 76B3**: Client Portal Apps
- **Phase 80**: Module Development Studio (builds Module Studio)

---

**Next Phase**: Phase 76B2 - Agency Marketplace & Pricing UI

---

**End of Phase 76B1**
