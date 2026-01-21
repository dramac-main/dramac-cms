# Phase 76B2: Agency Marketplace & Pricing UI

> **AI Model**: Claude Opus 4.5 (1x) ⭐ CRITICAL PHASE
>
> **Priority**: 🔴 CRITICAL - CORE BUSINESS MODEL
>
> **Estimated Time**: 6-8 hours
>
> **Depends On**: Phase 76A (Architecture), Phase 76B1 (Admin UI)
>
> **Part Of**: Phase 76B Series (Split for focused implementation)
> - **76B1**: Super Admin Module Management ✅
> - **76B2**: Agency Marketplace & Pricing (THIS PHASE)
> - **76B3**: Client Portal Apps

---

## 🎯 Objective

Build the **Agency** interface for the module ecosystem:

1. **Module Marketplace** - Browse, search, and subscribe to modules
2. **Subscription Management** - View and manage subscribed modules
3. **Markup Pricing** - Set client prices with profit calculations
4. **Client Module Installation** - Install modules for clients
5. **Module Request Submission** - Request custom modules

This is where **agencies make money** by reselling modules to clients.

---

## 📋 Prerequisites

- [ ] Phase 76A completed (Architecture & Database)
- [ ] Phase 76B1 completed (Admin UI exists)
- [ ] New module tables created
- [ ] LemonSqueezy billing configured
- [ ] Agency dashboard exists

---

## 🏗️ UI Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AGENCY DASHBOARD                             │
│  /marketplace                                                    │
│  ├── page.tsx                   → Browse all modules            │
│  ├── /[slug]/page.tsx           → Module detail & subscribe     │
│  └── /category/[cat]/page.tsx   → Filter by category            │
│                                                                  │
│  /dashboard/modules                                              │
│  ├── page.tsx                   → My subscriptions              │
│  ├── /pricing/page.tsx          → Set client markup             │
│  └── /[moduleId]/page.tsx       → Module management             │
│                                                                  │
│  /dashboard/requests                                             │
│  ├── page.tsx                   → My requests                   │
│  └── /new/page.tsx              → Submit new request            │
│                                                                  │
│  /dashboard/clients/[clientId]/modules                           │
│  └── page.tsx                   → Install modules for client    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Files to Create

```
src/app/(dashboard)/marketplace/
├── page.tsx                        # Marketplace home (browsing)
├── [slug]/page.tsx                 # Module detail page
└── category/[category]/page.tsx    # Category filter page

src/app/(dashboard)/dashboard/modules/
├── page.tsx                        # My subscriptions
├── pricing/page.tsx                # Set client markup
└── [moduleId]/page.tsx             # Module management

src/app/(dashboard)/dashboard/requests/
├── page.tsx                        # View my requests
└── new/page.tsx                    # Submit new request

src/app/(dashboard)/clients/[clientId]/modules/
└── page.tsx                        # Client module management

src/components/modules/marketplace/
├── marketplace-header.tsx          # Hero + search
├── marketplace-grid.tsx            # Module cards grid
├── marketplace-sidebar.tsx         # Categories + filters
├── module-detail-card.tsx          # Full module info
├── subscribe-button.tsx            # Subscribe CTA
├── price-display.tsx               # Show wholesale price

src/components/modules/agency/
├── subscription-list.tsx           # My subscriptions list
├── markup-pricing-form.tsx         # Set client prices
├── markup-calculator.tsx           # Profit calculator
├── module-request-form.tsx         # Request custom module
├── installation-manager.tsx        # Install to clients/sites

src/components/modules/client/
├── client-modules-list.tsx         # Client's installed modules
├── available-modules-grid.tsx      # Available to install
├── install-module-dialog.tsx       # Install confirmation

src/app/api/modules/
├── subscriptions/route.ts          # GET subscriptions
├── subscriptions/[id]/route.ts     # PATCH subscription
├── subscriptions/[id]/pricing/route.ts # PATCH markup
├── requests/route.ts               # GET/POST requests
└── install/route.ts                # POST install module
```

---

## ✅ Tasks

### Task 76B2.1: Marketplace Home Page

**File: `src/app/(dashboard)/marketplace/page.tsx`**

```tsx
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Package, Search, Star, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketplaceGrid } from "@/components/modules/marketplace/marketplace-grid";
import { MarketplaceSidebar } from "@/components/modules/marketplace/marketplace-sidebar";
import { MarketplaceHeader } from "@/components/modules/marketplace/marketplace-header";

export const metadata: Metadata = {
  title: "Module Marketplace | DRAMAC",
  description: "Browse and subscribe to modules for your agency",
};

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function MarketplacePage({ searchParams }: PageProps) {
  const { q, category } = await searchParams;
  const supabase = await createClient();

  // Get current user's agency
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user?.id)
    .single();

  // Build query for modules
  let query = supabase
    .from("modules")
    .select("*")
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("install_count", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  }

  if (category) {
    query = query.eq("category", category);
  }

  const { data: modules } = await query;

  // Get agency's existing subscriptions
  const { data: subscriptions } = await supabase
    .from("agency_module_subscriptions")
    .select("module_id, status")
    .eq("agency_id", profile?.agency_id)
    .eq("status", "active");

  const subscribedModuleIds = new Set(subscriptions?.map(s => s.module_id) || []);

  // Get categories for sidebar
  const { data: categories } = await supabase
    .from("modules")
    .select("category")
    .eq("status", "active");

  const uniqueCategories = [...new Set(categories?.map(c => c.category) || [])];

  // Get featured modules
  const featuredModules = modules?.filter(m => m.is_featured).slice(0, 3) || [];

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <MarketplaceHeader searchQuery={q} />

      <div className="flex gap-6">
        {/* Sidebar */}
        <MarketplaceSidebar 
          categories={uniqueCategories} 
          selectedCategory={category}
        />

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          {/* Featured Modules (only on home, no search/filter) */}
          {!q && !category && featuredModules.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Featured Modules
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featuredModules.map((module) => (
                  <FeaturedModuleCard 
                    key={module.id} 
                    module={module}
                    isSubscribed={subscribedModuleIds.has(module.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* All Modules */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {category ? `${category} Modules` : q ? `Search Results` : "All Modules"}
              </h2>
              <span className="text-muted-foreground">
                {modules?.length || 0} modules
              </span>
            </div>
            <MarketplaceGrid 
              modules={modules || []} 
              subscribedModuleIds={subscribedModuleIds}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

// Featured module card component
function FeaturedModuleCard({ 
  module, 
  isSubscribed 
}: { 
  module: any; 
  isSubscribed: boolean;
}) {
  const formatPrice = (cents: number) => {
    if (!cents || cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}/mo`;
  };

  return (
    <Card className="border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{module.icon || "📦"}</span>
          <div>
            <CardTitle className="text-lg">{module.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium text-primary">
                {formatPrice(module.wholesale_price_monthly)}
              </span>
              {isSubscribed && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Subscribed
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {module.description}
        </p>
      </CardContent>
    </Card>
  );
}
```

---

### Task 76B2.2: Marketplace Header Component

**File: `src/components/modules/marketplace/marketplace-header.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MarketplaceHeaderProps {
  searchQuery?: string;
}

export function MarketplaceHeader({ searchQuery }: MarketplaceHeaderProps) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/marketplace?q=${encodeURIComponent(search.trim())}`);
    } else {
      router.push("/marketplace");
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-xl p-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Package className="h-8 w-8" />
          Module Marketplace
        </h1>
        <p className="text-muted-foreground mb-6">
          Discover powerful modules to enhance your clients' experience. 
          Subscribe at wholesale prices and set your own markup.
        </p>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search modules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            Set your own markup
          </span>
          <span>•</span>
          <span>Client-level & Site-level modules</span>
          <span>•</span>
          <span>Instant activation</span>
        </div>
      </div>
    </div>
  );
}
```

---

### Task 76B2.3: Marketplace Sidebar Component

**File: `src/components/modules/marketplace/marketplace-sidebar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Package, 
  BarChart3, 
  FileText, 
  Megaphone, 
  Briefcase,
  ShoppingCart,
  Users,
  Settings,
  Zap,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MarketplaceSidebarProps {
  categories: string[];
  selectedCategory?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  analytics: <BarChart3 className="h-4 w-4" />,
  forms: <FileText className="h-4 w-4" />,
  marketing: <Megaphone className="h-4 w-4" />,
  crm: <Users className="h-4 w-4" />,
  productivity: <Briefcase className="h-4 w-4" />,
  ecommerce: <ShoppingCart className="h-4 w-4" />,
  seo: <Globe className="h-4 w-4" />,
  automation: <Zap className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
};

export function MarketplaceSidebar({ categories, selectedCategory }: MarketplaceSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="w-64 shrink-0 space-y-4">
      {/* Quick Links */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <Link
            href="/dashboard/modules"
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
          >
            <Package className="h-4 w-4" />
            My Subscriptions
          </Link>
          <Link
            href="/dashboard/modules/pricing"
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
          >
            <Settings className="h-4 w-4" />
            Pricing Settings
          </Link>
          <Link
            href="/dashboard/requests/new"
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
          >
            <Zap className="h-4 w-4" />
            Request Module
          </Link>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <Link
            href="/marketplace"
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
              !selectedCategory 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-muted"
            )}
          >
            <Package className="h-4 w-4" />
            All Modules
          </Link>
          
          {categories.map((category) => (
            <Link
              key={category}
              href={`/marketplace?category=${encodeURIComponent(category)}`}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors capitalize",
                selectedCategory === category 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted"
              )}
            >
              {categoryIcons[category.toLowerCase()] || <Package className="h-4 w-4" />}
              {category}
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Install Levels Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Module Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="shrink-0 text-purple-600">Agency</Badge>
            <span>Tools for running your agency</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="shrink-0 text-blue-600">Client</Badge>
            <span>Apps for clients (no site needed)</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="shrink-0 text-green-600">Site</Badge>
            <span>Website enhancements</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Task 76B2.4: Marketplace Grid Component

**File: `src/components/modules/marketplace/marketplace-grid.tsx`**

```tsx
import Link from "next/link";
import { Package, Users, Building2, Globe, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Module {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  install_level: string;
  wholesale_price_monthly: number | null;
  install_count: number;
  rating_average: number | null;
  is_featured: boolean;
}

interface MarketplaceGridProps {
  modules: Module[];
  subscribedModuleIds: Set<string>;
}

export function MarketplaceGrid({ modules, subscribedModuleIds }: MarketplaceGridProps) {
  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium mb-1">No modules found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  const formatPrice = (cents: number | null) => {
    if (!cents || cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}/mo`;
  };

  const getInstallLevelIcon = (level: string) => {
    switch (level) {
      case "agency": return <Building2 className="h-3 w-3" />;
      case "client": return <Users className="h-3 w-3" />;
      case "site": return <Globe className="h-3 w-3" />;
      default: return <Package className="h-3 w-3" />;
    }
  };

  const getInstallLevelColor = (level: string) => {
    switch (level) {
      case "agency": return "text-purple-600 bg-purple-100 dark:bg-purple-900";
      case "client": return "text-blue-600 bg-blue-100 dark:bg-blue-900";
      case "site": return "text-green-600 bg-green-100 dark:bg-green-900";
      default: return "";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {modules.map((module) => {
        const isSubscribed = subscribedModuleIds.has(module.id);
        
        return (
          <Link key={module.id} href={`/marketplace/${module.slug}`}>
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{module.icon || "📦"}</span>
                    <div>
                      <CardTitle className="text-lg line-clamp-1">{module.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getInstallLevelColor(module.install_level)}`}
                        >
                          {getInstallLevelIcon(module.install_level)}
                          <span className="ml-1 capitalize">{module.install_level}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {isSubscribed && (
                    <Badge className="bg-green-500 hover:bg-green-600">
                      <Check className="h-3 w-3 mr-1" />
                      Subscribed
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {module.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-semibold text-primary">
                      {formatPrice(module.wholesale_price_monthly)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">wholesale</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {module.install_count || 0} installs
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
```

---

### Task 76B2.5: Module Detail Page

**File: `src/app/(dashboard)/marketplace/[slug]/page.tsx`**

```tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { 
  Package, 
  Check, 
  Star, 
  Users, 
  Building2, 
  Globe,
  ArrowLeft,
  Calculator,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { SubscribeButton } from "@/components/modules/marketplace/subscribe-button";
import { ProfitCalculator } from "@/components/modules/marketplace/profit-calculator";

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
    title: `${module?.name || "Module"} | Marketplace`,
    description: module?.description || "View module details",
  };
}

export default async function ModuleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get current user's agency
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user?.id)
    .single();

  // Get module details
  const { data: module, error } = await supabase
    .from("modules")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !module) {
    notFound();
  }

  // Check if already subscribed
  const { data: subscription } = await supabase
    .from("agency_module_subscriptions")
    .select("*")
    .eq("agency_id", profile?.agency_id)
    .eq("module_id", module.id)
    .eq("status", "active")
    .maybeSingle();

  const isSubscribed = !!subscription;

  const formatPrice = (cents: number | null) => {
    if (!cents || cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getInstallLevelInfo = (level: string) => {
    switch (level) {
      case "agency":
        return {
          icon: <Building2 className="h-5 w-5" />,
          label: "Agency Level",
          description: "Tools for running your agency",
          color: "text-purple-600 bg-purple-100",
        };
      case "client":
        return {
          icon: <Users className="h-5 w-5" />,
          label: "Client Level",
          description: "Apps for your clients (no website needed)",
          color: "text-blue-600 bg-blue-100",
        };
      case "site":
        return {
          icon: <Globe className="h-5 w-5" />,
          label: "Site Level",
          description: "Website enhancements and features",
          color: "text-green-600 bg-green-100",
        };
      default:
        return {
          icon: <Package className="h-5 w-5" />,
          label: "Module",
          description: "",
          color: "",
        };
    }
  };

  const installLevelInfo = getInstallLevelInfo(module.install_level);

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link 
        href="/marketplace" 
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <span className="text-5xl">{module.icon || "📦"}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{module.name}</h1>
                    {module.is_featured && (
                      <Badge className="bg-yellow-500">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-4">{module.description}</p>
                  
                  <div className="flex items-center gap-4 flex-wrap">
                    <Badge variant="outline">{module.category}</Badge>
                    <Badge 
                      variant="outline" 
                      className={installLevelInfo.color}
                    >
                      {installLevelInfo.icon}
                      <span className="ml-1">{installLevelInfo.label}</span>
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {module.install_count || 0} agencies using this
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Long Description */}
          {module.long_description && (
            <Card>
              <CardHeader>
                <CardTitle>About this Module</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {module.long_description}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features */}
          {module.features && module.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(module.features as string[]).map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Install Level Explanation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {installLevelInfo.icon}
                {installLevelInfo.label}
              </CardTitle>
              <CardDescription>{installLevelInfo.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {module.install_level === "agency" && (
                <p className="text-sm text-muted-foreground">
                  This module is for your agency's internal use. Once subscribed, 
                  it will be available in your agency dashboard.
                </p>
              )}
              {module.install_level === "client" && (
                <p className="text-sm text-muted-foreground">
                  This module can be installed for individual clients. 
                  They can access it through their client portal without needing a website.
                  You set your own price and keep the profit.
                </p>
              )}
              {module.install_level === "site" && (
                <p className="text-sm text-muted-foreground">
                  This module enhances client websites. Install it on any site 
                  to add features like forms, analytics, or SEO tools.
                  You set your own price and keep the profit.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Pricing & Subscribe */}
        <div className="space-y-4">
          {/* Pricing Card */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Wholesale Price</p>
                <p className="text-3xl font-bold text-primary">
                  {formatPrice(module.wholesale_price_monthly)}
                  <span className="text-lg font-normal text-muted-foreground">/mo</span>
                </p>
              </div>

              {module.suggested_retail_monthly && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Suggested Retail</p>
                  <p className="text-lg font-semibold">
                    {formatPrice(module.suggested_retail_monthly)}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                </div>
              )}

              <Separator />

              {isSubscribed ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">You're subscribed!</span>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/dashboard/modules/${module.id}`}>
                      Manage Module
                    </Link>
                  </Button>
                </div>
              ) : (
                <SubscribeButton 
                  moduleId={module.id}
                  moduleName={module.name}
                  price={module.wholesale_price_monthly || 0}
                  agencyId={profile?.agency_id || ""}
                />
              )}
            </CardContent>
          </Card>

          {/* Profit Calculator */}
          {(module.install_level === "client" || module.install_level === "site") && (
            <ProfitCalculator 
              wholesalePrice={module.wholesale_price_monthly || 0}
              suggestedRetail={module.suggested_retail_monthly || (module.wholesale_price_monthly || 0) * 2}
            />
          )}

          {/* Requirements */}
          {module.requirements && (module.requirements as string[]).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {(module.requirements as string[]).map((req, index) => (
                    <li key={index} className="text-muted-foreground">
                      • {req}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### Task 76B2.6: Subscribe Button Component

**File: `src/components/modules/marketplace/subscribe-button.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface SubscribeButtonProps {
  moduleId: string;
  moduleName: string;
  price: number;
  agencyId: string;
}

export function SubscribeButton({ 
  moduleId, 
  moduleName, 
  price, 
  agencyId 
}: SubscribeButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}/mo`;
  };

  const handleSubscribe = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/modules/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId,
          agencyId,
          billingCycle: "monthly",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      // If there's a checkout URL (paid module), redirect
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // Free module - instant subscription
      toast.success(`Successfully subscribed to ${moduleName}!`);
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Subscribe error:", error);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        className="w-full" 
        size="lg"
        onClick={() => setIsOpen(true)}
      >
        <CreditCard className="h-4 w-4 mr-2" />
        Subscribe - {formatPrice(price)}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscribe to {moduleName}</DialogTitle>
            <DialogDescription>
              {price === 0 ? (
                "This is a free module. Subscribe to start using it immediately."
              ) : (
                <>
                  You will be charged <strong>{formatPrice(price)}</strong> per month.
                  You can cancel anytime.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Module</span>
              <span className="font-medium">{moduleName}</span>
            </div>
            <div className="flex justify-between">
              <span>Billing</span>
              <span className="font-medium">Monthly</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="font-medium">Total</span>
              <span className="font-bold text-primary">{formatPrice(price)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubscribe} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Subscribe${price > 0 ? " & Pay" : ""}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

### Task 76B2.7: Profit Calculator Component

**File: `src/components/modules/marketplace/profit-calculator.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Calculator, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfitCalculatorProps {
  wholesalePrice: number; // in cents
  suggestedRetail: number; // in cents
}

export function ProfitCalculator({ wholesalePrice, suggestedRetail }: ProfitCalculatorProps) {
  const [markup, setMarkup] = useState(100); // 100% markup default
  const [numClients, setNumClients] = useState(10);

  const wholesale = wholesalePrice / 100;
  const retailPrice = wholesale + (wholesale * markup / 100);
  const profit = retailPrice - wholesale;
  
  const monthlyRevenue = retailPrice * numClients;
  const monthlyProfit = profit * numClients;
  const yearlyProfit = monthlyProfit * 12;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Profit Calculator
        </CardTitle>
        <CardDescription>
          See how much you can earn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Markup Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Label>Markup Percentage</Label>
            <span className="font-medium">{markup}%</span>
          </div>
          <Slider
            value={[markup]}
            onValueChange={(value) => setMarkup(value[0])}
            min={0}
            max={300}
            step={10}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>150%</span>
            <span>300%</span>
          </div>
        </div>

        {/* Number of Clients */}
        <div className="space-y-2">
          <Label>Number of Clients</Label>
          <Input
            type="number"
            min={1}
            max={1000}
            value={numClients}
            onChange={(e) => setNumClients(parseInt(e.target.value) || 1)}
          />
        </div>

        {/* Price Breakdown */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Your Cost (wholesale)</span>
            <span>${wholesale.toFixed(2)}/mo</span>
          </div>
          <div className="flex justify-between">
            <span>Your Price to Clients</span>
            <span className="font-medium">${retailPrice.toFixed(2)}/mo</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Profit per Client</span>
            <span className="font-medium">${profit.toFixed(2)}/mo</span>
          </div>
        </div>

        {/* Projections */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            With {numClients} Clients
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Monthly Profit</p>
              <p className="text-lg font-bold text-green-600">
                ${monthlyProfit.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Yearly Profit</p>
              <p className="text-lg font-bold text-green-600">
                ${yearlyProfit.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Task 76B2.8: Agency Subscriptions Page

**File: `src/app/(dashboard)/dashboard/modules/page.tsx`**

```tsx
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Package, Settings, DollarSign, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { SubscriptionList } from "@/components/modules/agency/subscription-list";

export const metadata: Metadata = {
  title: "My Modules | DRAMAC",
  description: "Manage your module subscriptions",
};

export default async function AgencyModulesPage() {
  const supabase = await createClient();

  // Get current user's agency
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) {
    redirect("/dashboard");
  }

  // Get agency's subscriptions with module details
  const { data: subscriptions } = await supabase
    .from("agency_module_subscriptions")
    .select(`
      *,
      module:modules(*)
    `)
    .eq("agency_id", profile.agency_id)
    .order("created_at", { ascending: false });

  // Calculate stats
  const activeSubscriptions = subscriptions?.filter(s => s.status === "active") || [];
  const totalMonthlyCost = activeSubscriptions.reduce((sum, sub) => {
    return sum + ((sub.module as any)?.wholesale_price_monthly || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Modules</h1>
          <p className="text-muted-foreground">
            Manage your module subscriptions and pricing
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/modules/pricing">
              <DollarSign className="h-4 w-4 mr-2" />
              Pricing Settings
            </Link>
          </Button>
          <Button asChild>
            <Link href="/marketplace">
              <Plus className="h-4 w-4 mr-2" />
              Browse Marketplace
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{activeSubscriptions.length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                ${(totalMonthlyCost / 100).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Configure Markup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link 
              href="/dashboard/modules/pricing"
              className="flex items-center gap-2 text-green-700 dark:text-green-300 hover:underline"
            >
              <span>Set prices for clients</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions List */}
      {activeSubscriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">No subscriptions yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Browse the marketplace to find modules for your agency and clients
            </p>
            <Button asChild>
              <Link href="/marketplace">Browse Marketplace</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <SubscriptionList subscriptions={subscriptions || []} />
      )}
    </div>
  );
}
```

---

### Task 76B2.9: Markup Pricing Page

**File: `src/app/(dashboard)/dashboard/modules/pricing/page.tsx`**

```tsx
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DollarSign, Info, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { MarkupPricingList } from "@/components/modules/agency/markup-pricing-list";

export const metadata: Metadata = {
  title: "Module Pricing | DRAMAC",
  description: "Set your markup pricing for clients",
};

export default async function ModulePricingPage() {
  const supabase = await createClient();

  // Get current user's agency
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) {
    redirect("/dashboard");
  }

  // Get agency's subscriptions with module details
  const { data: subscriptions } = await supabase
    .from("agency_module_subscriptions")
    .select(`
      *,
      module:modules(*)
    `)
    .eq("agency_id", profile.agency_id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Filter to client/site level modules only (agency modules don't need markup)
  const resellableModules = subscriptions?.filter(sub => {
    const level = (sub.module as any)?.install_level;
    return level === "client" || level === "site";
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link 
          href="/dashboard/modules" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Modules
        </Link>
        <h1 className="text-3xl font-bold">Pricing Settings</h1>
        <p className="text-muted-foreground">
          Set your markup to determine what clients pay
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>How markup works:</strong> You pay the wholesale price, add your markup, 
          and clients pay your retail price. You keep 100% of the markup as profit!
        </AlertDescription>
      </Alert>

      {resellableModules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">No resellable modules</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe to client-level or site-level modules to configure pricing
            </p>
            <Link href="/marketplace" className="text-primary hover:underline">
              Browse Marketplace
            </Link>
          </CardContent>
        </Card>
      ) : (
        <MarkupPricingList subscriptions={resellableModules} />
      )}
    </div>
  );
}
```

---

### Task 76B2.10: Markup Pricing List Component

**File: `src/components/modules/agency/markup-pricing-list.tsx`**

```tsx
"use client";

import { useState } from "react";
import { DollarSign, Percent, Edit2, Check, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Subscription {
  id: string;
  module_id: string;
  markup_type: string;
  markup_percentage: number | null;
  markup_fixed_amount: number | null;
  custom_price_monthly: number | null;
  retail_price_monthly_cached: number | null;
  module: {
    id: string;
    name: string;
    icon: string;
    install_level: string;
    wholesale_price_monthly: number;
  };
}

interface MarkupPricingListProps {
  subscriptions: Subscription[];
}

export function MarkupPricingList({ subscriptions }: MarkupPricingListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    markupType: "percentage",
    markupPercentage: "100",
    markupFixed: "0",
    customPrice: "0",
  });
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = (sub: Subscription) => {
    setEditingId(sub.id);
    setEditValues({
      markupType: sub.markup_type || "percentage",
      markupPercentage: String(sub.markup_percentage || 100),
      markupFixed: String((sub.markup_fixed_amount || 0) / 100),
      customPrice: String((sub.custom_price_monthly || 0) / 100),
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveMarkup = async (subscriptionId: string) => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/modules/subscriptions/${subscriptionId}/pricing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markup_type: editValues.markupType,
          markup_percentage: parseInt(editValues.markupPercentage) || 100,
          markup_fixed_amount: Math.round(parseFloat(editValues.markupFixed) * 100) || 0,
          custom_price_monthly: Math.round(parseFloat(editValues.customPrice) * 100) || null,
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

  const calculateRetailPrice = (sub: Subscription): number => {
    const wholesale = sub.module.wholesale_price_monthly / 100;
    
    if (editingId === sub.id) {
      switch (editValues.markupType) {
        case "percentage":
          return wholesale + (wholesale * parseInt(editValues.markupPercentage) / 100);
        case "fixed":
          return wholesale + parseFloat(editValues.markupFixed);
        case "custom":
          return parseFloat(editValues.customPrice) || wholesale;
        case "passthrough":
          return wholesale;
        default:
          return wholesale;
      }
    }

    // Use cached value or calculate from stored values
    if (sub.retail_price_monthly_cached) {
      return sub.retail_price_monthly_cached / 100;
    }

    switch (sub.markup_type) {
      case "percentage":
        return wholesale + (wholesale * (sub.markup_percentage || 100) / 100);
      case "fixed":
        return wholesale + ((sub.markup_fixed_amount || 0) / 100);
      case "custom":
        return (sub.custom_price_monthly || 0) / 100;
      case "passthrough":
        return wholesale;
      default:
        return wholesale * 2;
    }
  };

  return (
    <div className="space-y-4">
      {subscriptions.map((sub) => {
        const wholesale = sub.module.wholesale_price_monthly / 100;
        const retail = calculateRetailPrice(sub);
        const profit = retail - wholesale;
        const isEditing = editingId === sub.id;

        return (
          <Card key={sub.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sub.module.icon || "📦"}</span>
                  <div>
                    <CardTitle className="text-lg">{sub.module.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {sub.module.install_level}
                    </Badge>
                  </div>
                </div>
                {!isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => startEditing(sub)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Pricing
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  {/* Markup Type */}
                  <div className="flex items-center gap-4">
                    <Select
                      value={editValues.markupType}
                      onValueChange={(value) => setEditValues(v => ({ ...v, markupType: value }))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Markup type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="custom">Custom Price</SelectItem>
                        <SelectItem value="passthrough">Passthrough (no markup)</SelectItem>
                      </SelectContent>
                    </Select>

                    {editValues.markupType === "percentage" && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="500"
                          value={editValues.markupPercentage}
                          onChange={(e) => setEditValues(v => ({ ...v, markupPercentage: e.target.value }))}
                          className="w-24"
                        />
                        <span className="text-muted-foreground">% markup</span>
                      </div>
                    )}

                    {editValues.markupType === "fixed" && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editValues.markupFixed}
                          onChange={(e) => setEditValues(v => ({ ...v, markupFixed: e.target.value }))}
                          className="w-24"
                        />
                        <span className="text-muted-foreground">added</span>
                      </div>
                    )}

                    {editValues.markupType === "custom" && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editValues.customPrice}
                          onChange={(e) => setEditValues(v => ({ ...v, customPrice: e.target.value }))}
                          className="w-24"
                        />
                        <span className="text-muted-foreground">/mo</span>
                      </div>
                    )}
                  </div>

                  {/* Preview & Actions */}
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">Wholesale: </span>
                        <span>${wholesale.toFixed(2)}/mo</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Client pays: </span>
                        <span className="font-medium">${retail.toFixed(2)}/mo</span>
                      </div>
                      <div className="text-green-600">
                        <span>Your profit: </span>
                        <span className="font-medium">${profit.toFixed(2)}/mo</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEditing}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => saveMarkup(sub.id)}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-1" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Your Cost</p>
                    <p className="font-medium">${wholesale.toFixed(2)}/mo</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Markup</p>
                    <p className="font-medium">
                      {sub.markup_type === "percentage" && `${sub.markup_percentage || 100}%`}
                      {sub.markup_type === "fixed" && `+$${((sub.markup_fixed_amount || 0) / 100).toFixed(2)}`}
                      {sub.markup_type === "custom" && "Custom"}
                      {sub.markup_type === "passthrough" && "None"}
                      {!sub.markup_type && "100%"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Client Pays</p>
                    <p className="font-medium text-primary">${retail.toFixed(2)}/mo</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Your Profit</p>
                    <p className="font-medium text-green-600">${profit.toFixed(2)}/mo</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

---

### Task 76B2.11: Module Request Form

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
                <Input placeholder="e.g., Grant Proposal Writer" {...field} />
              </FormControl>
              <FormDescription>A short, descriptive name</FormDescription>
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
                  placeholder="Describe what this module should do..."
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
                  placeholder="What problem does this solve?"
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
                <Input placeholder="Who would use this module?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Row of selects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="suggestedInstallLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Install Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="agency">Agency - For running my agency</SelectItem>
                    <SelectItem value="client">Client - For client use (no site)</SelectItem>
                    <SelectItem value="site">Site - Website enhancement</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    <SelectItem value="forms">Forms</SelectItem>
                    <SelectItem value="crm">CRM</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="seo">SEO</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    <SelectItem value="urgent">Urgent - Critical</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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
                <FormLabel>I'm willing to help fund development</FormLabel>
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

### Task 76B2.12: API Routes for Agency Functions

**File: `src/app/api/modules/subscribe/route.ts`**

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

    const { moduleId, agencyId, billingCycle } = await request.json();

    // Get module details
    const { data: module, error: moduleError } = await supabase
      .from("modules")
      .select("*")
      .eq("id", moduleId)
      .single();

    if (moduleError || !module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Check if already subscribed
    const { data: existing } = await supabase
      .from("agency_module_subscriptions")
      .select("id")
      .eq("agency_id", agencyId)
      .eq("module_id", moduleId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
    }

    // For free modules, create subscription directly
    if (!module.wholesale_price_monthly || module.wholesale_price_monthly === 0) {
      const { data: subscription, error } = await supabase
        .from("agency_module_subscriptions")
        .insert({
          agency_id: agencyId,
          module_id: moduleId,
          status: "active",
          billing_cycle: billingCycle || "monthly",
          markup_type: "percentage",
          markup_percentage: 100, // Default 100% markup
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Subscription creation error:", error);
        return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
      }

      // Increment install count
      await supabase.rpc("increment_module_install_count", { mod_id: moduleId });

      return NextResponse.json({ success: true, subscription });
    }

    // For paid modules, create LemonSqueezy checkout
    // TODO: Implement LemonSqueezy checkout integration
    // For now, return placeholder
    return NextResponse.json({
      success: true,
      checkoutUrl: `/api/checkout/lemonsqueezy?module=${moduleId}&agency=${agencyId}`,
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

**File: `src/app/api/modules/subscriptions/[id]/pricing/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user belongs to the subscription's agency
    const { data: subscription } = await supabase
      .from("agency_module_subscriptions")
      .select("agency_id")
      .eq("id", id)
      .single();

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id, role")
      .eq("id", user.id)
      .single();

    if (profile?.agency_id !== subscription.agency_id && profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { markup_type, markup_percentage, markup_fixed_amount, custom_price_monthly, custom_price_yearly } = body;

    const { data, error } = await supabase
      .from("agency_module_subscriptions")
      .update({
        markup_type,
        markup_percentage,
        markup_fixed_amount,
        custom_price_monthly,
        custom_price_yearly,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update pricing error:", error);
      return NextResponse.json({ error: "Failed to update pricing" }, { status: 500 });
    }

    return NextResponse.json({ success: true, subscription: data });
  } catch (error) {
    console.error("Update pricing error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

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

    const { data, error } = await supabase
      .from("module_requests")
      .insert({
        agency_id: profile.agency_id,
        title: body.title,
        description: body.description,
        use_case: body.useCase,
        target_audience: body.targetAudience,
        suggested_install_level: body.suggestedInstallLevel,
        suggested_category: body.suggestedCategory,
        priority: body.priority,
        budget_range: body.budgetRange,
        willing_to_fund: body.willingToFund,
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
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, agency_id")
      .eq("id", user.id)
      .single();

    let query = supabase
      .from("module_requests")
      .select("*, agency:agencies(name)")
      .order("submitted_at", { ascending: false });

    // Non-super-admin only sees their agency's requests
    if (profile?.role !== "super_admin" && profile?.agency_id) {
      query = query.eq("agency_id", profile.agency_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Fetch requests error:", error);
      return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
    }

    return NextResponse.json({ requests: data });
  } catch (error) {
    console.error("Fetch requests error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

---

## 📊 Verification Checklist

### Marketplace
- [ ] Marketplace page loads at `/marketplace`
- [ ] Search works
- [ ] Category filtering works
- [ ] Module cards display correctly
- [ ] Featured modules show prominently
- [ ] Subscribed badge shows for subscribed modules

### Module Detail
- [ ] Detail page loads at `/marketplace/[slug]`
- [ ] All module info displays correctly
- [ ] Subscribe button works
- [ ] Profit calculator works
- [ ] Shows "subscribed" state when applicable

### Subscriptions
- [ ] My Modules page loads at `/dashboard/modules`
- [ ] Subscriptions list correctly
- [ ] Stats display correctly

### Markup Pricing
- [ ] Pricing page loads at `/dashboard/modules/pricing`
- [ ] Edit markup works
- [ ] Save updates database
- [ ] Profit calculations are correct

### Module Requests
- [ ] Request form works at `/dashboard/requests/new`
- [ ] Validation works
- [ ] Submission creates database record
- [ ] My requests page shows submissions

---

## 🔗 Related Phases

- **Phase 76A**: Architecture (prerequisite)
- **Phase 76B1**: Admin UI (prerequisite)
- **Phase 76B3**: Client Portal Apps (next)

---

**Next Phase**: Phase 76B3 - Client Portal Apps UI

---

**End of Phase 76B2**
