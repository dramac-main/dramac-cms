# Phase 30: Module System - Marketplace UI

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Build the marketplace interface for browsing, filtering, and subscribing to modules.

---

## 📋 Prerequisites

- [ ] Phase 29 completed (Module Foundation)

---

## ✅ Tasks

### Task 30.1: Module Card Component

**File: `src/components/modules/module-card.tsx`**

```typescript
"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Module } from "@/types/modules";
import {
  BarChart3,
  Search,
  FileText,
  ShoppingCart,
  Newspaper,
  Globe,
  Users,
  Calendar,
  Package,
  Check,
  Star,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3,
  Search,
  FileText,
  ShoppingCart,
  Newspaper,
  Globe,
  Users,
  Calendar,
  Package,
};

interface ModuleCardProps {
  module: Module;
  isSubscribed?: boolean;
  onSubscribe?: () => void;
  onViewDetails?: () => void;
  isLoading?: boolean;
}

export function ModuleCard({
  module,
  isSubscribed,
  onSubscribe,
  onViewDetails,
  isLoading,
}: ModuleCardProps) {
  const Icon = iconMap[module.icon] || Package;

  return (
    <div className="bg-card border rounded-xl p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{module.name}</h3>
            <p className="text-sm text-muted-foreground">{module.category}</p>
          </div>
        </div>
        {module.is_featured && (
          <Badge variant="secondary" className="gap-1">
            <Star className="w-3 h-3" />
            Featured
          </Badge>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 flex-1">
        {module.description}
      </p>

      {/* Features preview */}
      {module.features.length > 0 && (
        <ul className="space-y-1 mb-4">
          {module.features.slice(0, 3).map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-primary" />
              {feature}
            </li>
          ))}
          {module.features.length > 3 && (
            <li className="text-xs text-muted-foreground">
              +{module.features.length - 3} more features
            </li>
          )}
        </ul>
      )}

      {/* Pricing */}
      <div className="mb-4 pt-4 border-t">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">${module.price_monthly}</span>
          <span className="text-sm text-muted-foreground">/month</span>
        </div>
        {module.price_yearly && (
          <p className="text-xs text-muted-foreground">
            or ${module.price_yearly}/year (save{" "}
            {Math.round((1 - module.price_yearly / (module.price_monthly * 12)) * 100)}%)
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onViewDetails}
        >
          Details
        </Button>
        {isSubscribed ? (
          <Button className="flex-1" disabled>
            <Check className="w-4 h-4 mr-2" />
            Subscribed
          </Button>
        ) : (
          <Button
            className="flex-1"
            onClick={onSubscribe}
            disabled={isLoading}
          >
            {isLoading ? "Subscribing..." : "Subscribe"}
          </Button>
        )}
      </div>
    </div>
  );
}
```

### Task 30.2: Module Detail Sheet

**File: `src/components/modules/module-detail-sheet.tsx`**

```typescript
"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Module } from "@/types/modules";
import {
  Check,
  Star,
  Package,
  BarChart3,
  Search,
  FileText,
  ShoppingCart,
  Newspaper,
  Globe,
  Users,
  Calendar,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3,
  Search,
  FileText,
  ShoppingCart,
  Newspaper,
  Globe,
  Users,
  Calendar,
  Package,
};

interface ModuleDetailSheetProps {
  module: Module | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubscribed?: boolean;
  onSubscribe?: (billingCycle: "monthly" | "yearly") => void;
  isLoading?: boolean;
}

export function ModuleDetailSheet({
  module,
  open,
  onOpenChange,
  isSubscribed,
  onSubscribe,
  isLoading,
}: ModuleDetailSheetProps) {
  if (!module) return null;

  const Icon = iconMap[module.icon] || Package;
  const yearlySavings = module.price_yearly
    ? Math.round((1 - module.price_yearly / (module.price_monthly * 12)) * 100)
    : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">{module.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{module.category}</Badge>
                {module.is_featured && (
                  <Badge variant="outline" className="gap-1">
                    <Star className="w-3 h-3" />
                    Featured
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  v{module.version}
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Description */}
          <p className="text-muted-foreground">
            {module.long_description || module.description}
          </p>

          {/* Pricing Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className="p-4 rounded-lg border-2 border-border cursor-pointer hover:border-primary transition-colors"
              onClick={() => onSubscribe?.("monthly")}
            >
              <p className="text-sm font-medium mb-1">Monthly</p>
              <p className="text-2xl font-bold">${module.price_monthly}</p>
              <p className="text-xs text-muted-foreground">/month</p>
            </div>
            {module.price_yearly && (
              <div
                className="p-4 rounded-lg border-2 border-primary bg-primary/5 cursor-pointer relative"
                onClick={() => onSubscribe?.("yearly")}
              >
                <Badge className="absolute -top-2 -right-2 text-xs">
                  Save {yearlySavings}%
                </Badge>
                <p className="text-sm font-medium mb-1">Yearly</p>
                <p className="text-2xl font-bold">${module.price_yearly}</p>
                <p className="text-xs text-muted-foreground">/year</p>
              </div>
            )}
          </div>

          {/* Subscribe Button */}
          {isSubscribed ? (
            <Button className="w-full" disabled>
              <Check className="w-4 h-4 mr-2" />
              Already Subscribed
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={() => onSubscribe?.("monthly")}
              disabled={isLoading}
            >
              {isLoading ? "Subscribing..." : "Subscribe Now"}
            </Button>
          )}

          {/* Features Tabs */}
          <Tabs defaultValue="features">
            <TabsList className="w-full">
              <TabsTrigger value="features" className="flex-1">
                Features
              </TabsTrigger>
              <TabsTrigger value="requirements" className="flex-1">
                Requirements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="features" className="mt-4">
              <ul className="space-y-3">
                {module.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="requirements" className="mt-4">
              {module.requirements.length > 0 ? (
                <ul className="space-y-2">
                  {module.requirements.map((req, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      • {req}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No special requirements. This module works with all sites.
                </p>
              )}
            </TabsContent>
          </Tabs>

          {/* Screenshots */}
          {module.screenshots.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Screenshots</h4>
              <div className="space-y-2">
                {module.screenshots.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`${module.name} screenshot ${index + 1}`}
                    className="rounded-lg border w-full"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

### Task 30.3: Category Filter Component

**File: `src/components/modules/category-filter.tsx`**

```typescript
"use client";

import { cn } from "@/lib/utils";
import { MODULE_CATEGORIES, ModuleCategory } from "@/types/modules";
import {
  BarChart3,
  Search,
  FileText,
  ShoppingCart,
  Newspaper,
  Globe,
  Users,
  Calendar,
  Grid,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3,
  Search,
  FileText,
  ShoppingCart,
  Newspaper,
  Globe,
  Users,
  Calendar,
};

interface CategoryFilterProps {
  selected: ModuleCategory | null;
  onSelect: (category: ModuleCategory | null) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  const categories = Object.entries(MODULE_CATEGORIES) as [ModuleCategory, typeof MODULE_CATEGORIES[ModuleCategory]][];

  return (
    <div className="flex flex-wrap gap-2">
      {/* All */}
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors",
          selected === null
            ? "bg-primary text-primary-foreground"
            : "bg-muted hover:bg-muted/80"
        )}
      >
        <Grid className="w-4 h-4" />
        All
      </button>

      {/* Category buttons */}
      {categories.map(([key, { label, icon }]) => {
        const Icon = iconMap[icon] || Grid;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors",
              selected === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
```

### Task 30.4: Marketplace Page

**File: `src/app/(dashboard)/marketplace/page.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ModuleCard } from "@/components/modules/module-card";
import { ModuleDetailSheet } from "@/components/modules/module-detail-sheet";
import { CategoryFilter } from "@/components/modules/category-filter";
import { useModules } from "@/hooks/use-modules";
import { useModuleSubscriptions, useSubscribeModule } from "@/hooks/use-module-subscriptions";
import { useCurrentAgency } from "@/hooks/use-current-agency";
import type { Module, ModuleCategory } from "@/types/modules";
import { Search, Loader2, Package } from "lucide-react";
import { toast } from "sonner";

export default function MarketplacePage() {
  const { agency } = useCurrentAgency();
  const agencyId = agency?.id || "";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ModuleCategory | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  const { data: modules, isLoading } = useModules({ category: category || undefined });
  const { data: subscriptions } = useModuleSubscriptions(agencyId);
  const subscribeMutation = useSubscribeModule(agencyId);

  const subscribedIds = new Set(subscriptions?.map((s) => s.module_id) || []);

  // Filter by search
  const filteredModules = modules?.filter((m) => {
    if (!search) return true;
    const lower = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(lower) ||
      m.description?.toLowerCase().includes(lower) ||
      m.category.toLowerCase().includes(lower)
    );
  });

  const handleSubscribe = async (moduleId: string, billingCycle: "monthly" | "yearly" = "monthly") => {
    try {
      await subscribeMutation.mutateAsync({ moduleId, billingCycle });
      toast.success("Successfully subscribed to module!");
      setSelectedModule(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to subscribe");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Module Marketplace</h1>
        <p className="text-muted-foreground">
          Extend your platform with powerful add-ons
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search modules..."
          className="pl-9"
        />
      </div>

      {/* Categories */}
      <CategoryFilter selected={category} onSelect={setCategory} />

      {/* Modules Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredModules?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-medium mb-1">No modules found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filter
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredModules?.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              isSubscribed={subscribedIds.has(module.id)}
              onSubscribe={() => handleSubscribe(module.id)}
              onViewDetails={() => setSelectedModule(module)}
              isLoading={subscribeMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      <ModuleDetailSheet
        module={selectedModule}
        open={!!selectedModule}
        onOpenChange={(open) => !open && setSelectedModule(null)}
        isSubscribed={selectedModule ? subscribedIds.has(selectedModule.id) : false}
        onSubscribe={(billingCycle) =>
          selectedModule && handleSubscribe(selectedModule.id, billingCycle)
        }
        isLoading={subscribeMutation.isPending}
      />
    </div>
  );
}
```

### Task 30.5: My Modules Page

**File: `src/app/(dashboard)/settings/modules/page.tsx`**

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useModuleSubscriptions } from "@/hooks/use-module-subscriptions";
import { useCurrentAgency } from "@/hooks/use-current-agency";
import {
  Package,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function MyModulesPage() {
  const { agency } = useCurrentAgency();
  const agencyId = agency?.id || "";

  const { data: subscriptions, isLoading } = useModuleSubscriptions(agencyId);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const handleCancel = async (subscriptionId: string) => {
    // TODO: Implement cancellation API
    toast.info("Cancellation will be available in the billing phase");
    setCancelingId(null);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Modules</h1>
          <p className="text-muted-foreground">
            Manage your subscribed modules
          </p>
        </div>
        <Button asChild>
          <Link href="/marketplace">
            <Package className="w-4 h-4 mr-2" />
            Browse Marketplace
          </Link>
        </Button>
      </div>

      {/* Subscriptions Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : subscriptions?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
          <Package className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-medium mb-1">No modules subscribed</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add modules to extend your platform's capabilities
          </p>
          <Button asChild>
            <Link href="/marketplace">Browse Marketplace</Link>
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Renews On</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions?.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{sub.module?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {sub.module?.category}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={sub.status === "active" ? "default" : "destructive"}
                    >
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        ${sub.billing_cycle === "yearly"
                          ? sub.module?.price_yearly
                          : sub.module?.price_monthly}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        per {sub.billing_cycle === "yearly" ? "year" : "month"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(sub.current_period_end)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setCancelingId(sub.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Cancel Subscription
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Cancel Dialog */}
      <AlertDialog open={!!cancelingId} onOpenChange={() => setCancelingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              You will lose access to this module at the end of your current
              billing period. You can resubscribe at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelingId && handleCancel(cancelingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

### Task 30.6: Navigation Update for Marketplace

**File: Update `src/components/dashboard/sidebar.tsx`**

Add to navigation items:
```typescript
{
  name: "Marketplace",
  href: "/marketplace",
  icon: Package,
},
```

---

## 📐 Acceptance Criteria

- [ ] Module cards display icon, name, price, features
- [ ] Featured modules show badge
- [ ] Category filter buttons work
- [ ] Search filters by name/description
- [ ] Detail sheet shows full info and pricing options
- [ ] Subscribe button adds subscription
- [ ] My Modules page lists active subscriptions
- [ ] Empty states show helpful messages
- [ ] Loading states display properly

---

## 📁 Files Created This Phase

```
src/components/modules/
├── module-card.tsx
├── module-detail-sheet.tsx
└── category-filter.tsx

src/app/(dashboard)/marketplace/
└── page.tsx

src/app/(dashboard)/settings/modules/
└── page.tsx
```

---

## ➡️ Next Phase

**Phase 31: Module System - Site Integration** - Enable/disable modules per site, module settings.
