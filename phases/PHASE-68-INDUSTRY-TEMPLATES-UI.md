# Phase 68: Industry Templates UI - Visual Template Selection

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟢 MEDIUM
>
> **Estimated Time**: 3-4 hours

---

## 🎯 Objective

Implement a visual template selection interface that showcases industry-specific templates with live previews, filtering by industry category, and one-click selection during site creation.

---

## 📋 Prerequisites

- [ ] Phase 67 AI Regeneration completed
- [ ] AI Builder foundation working
- [ ] Site creation flow exists
- [ ] Template data structure defined

---

## 💼 Business Value

1. **Faster Onboarding** - Users start with relevant templates
2. **Higher Conversion** - Visual selection reduces friction
3. **Industry Focus** - Targeted templates for each niche
4. **Quality Perception** - Professional templates build trust
5. **Reduced Support** - Clear starting points need less help

---

## 📁 Files to Create

```
src/lib/templates/
├── template-data.ts             # Template definitions
├── template-categories.ts       # Industry categories
└── template-types.ts            # Type definitions

src/components/templates/
├── template-gallery.tsx         # Main gallery view
├── template-card.tsx            # Individual template card
├── template-preview.tsx         # Full preview modal
├── template-filters.tsx         # Industry filter tabs
├── template-search.tsx          # Search functionality
└── industry-badge.tsx           # Industry label badge

src/hooks/
├── use-templates.ts             # Template loading hook

src/app/(dashboard)/templates/
├── page.tsx                     # Templates browse page
```

---

## ✅ Tasks

### Task 68.1: Template Types

**File: `src/lib/templates/template-types.ts`**

```typescript
export type IndustryCategory =
  | "restaurant"
  | "ecommerce"
  | "portfolio"
  | "agency"
  | "healthcare"
  | "education"
  | "realestate"
  | "fitness"
  | "beauty"
  | "technology"
  | "nonprofit"
  | "legal"
  | "automotive"
  | "hospitality"
  | "construction"
  | "photography"
  | "music"
  | "events"
  | "other";

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  industry: IndustryCategory;
  tags: string[];
  preview: {
    thumbnail: string;
    desktop: string;
    mobile: string;
  };
  features: string[];
  pages: number;
  components: string[];
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  createdAt: Date;
  updatedAt: Date;
  popularity: number;
  isNew: boolean;
  isPremium: boolean;
}

export interface TemplateContent {
  id: string;
  pages: TemplatePage[];
  globalStyles: Record<string, any>;
  settings: TemplateSettings;
}

export interface TemplatePage {
  name: string;
  slug: string;
  content: string; // Craft.js JSON
  seo: {
    title: string;
    description: string;
  };
}

export interface TemplateSettings {
  fonts: {
    heading: string;
    body: string;
  };
  colors: Record<string, string>;
  spacing: "compact" | "normal" | "spacious";
}

export interface TemplateFilter {
  industry?: IndustryCategory;
  search?: string;
  isPremium?: boolean;
  sortBy?: "popularity" | "newest" | "name";
}
```

---

### Task 68.2: Industry Categories

**File: `src/lib/templates/template-categories.ts`**

```typescript
import {
  Utensils,
  ShoppingBag,
  Palette,
  Building2,
  Heart,
  GraduationCap,
  Home,
  Dumbbell,
  Scissors,
  Laptop,
  HandHeart,
  Scale,
  Car,
  Hotel,
  HardHat,
  Camera,
  Music,
  PartyPopper,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import type { IndustryCategory } from "./template-types";

export interface CategoryInfo {
  id: IndustryCategory;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export const INDUSTRY_CATEGORIES: CategoryInfo[] = [
  {
    id: "restaurant",
    label: "Restaurant & Food",
    description: "Restaurants, cafes, food delivery",
    icon: Utensils,
    color: "#ef4444",
  },
  {
    id: "ecommerce",
    label: "E-Commerce",
    description: "Online stores and retail",
    icon: ShoppingBag,
    color: "#f59e0b",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    description: "Personal and creative portfolios",
    icon: Palette,
    color: "#8b5cf6",
  },
  {
    id: "agency",
    label: "Agency & Business",
    description: "Marketing and creative agencies",
    icon: Building2,
    color: "#3b82f6",
  },
  {
    id: "healthcare",
    label: "Healthcare",
    description: "Medical practices and wellness",
    icon: Heart,
    color: "#ec4899",
  },
  {
    id: "education",
    label: "Education",
    description: "Schools, courses, tutoring",
    icon: GraduationCap,
    color: "#10b981",
  },
  {
    id: "realestate",
    label: "Real Estate",
    description: "Property listings and agents",
    icon: Home,
    color: "#6366f1",
  },
  {
    id: "fitness",
    label: "Fitness & Sports",
    description: "Gyms, trainers, sports clubs",
    icon: Dumbbell,
    color: "#f97316",
  },
  {
    id: "beauty",
    label: "Beauty & Spa",
    description: "Salons, spas, beauty services",
    icon: Scissors,
    color: "#d946ef",
  },
  {
    id: "technology",
    label: "Technology",
    description: "Tech startups and SaaS",
    icon: Laptop,
    color: "#0ea5e9",
  },
  {
    id: "nonprofit",
    label: "Non-Profit",
    description: "Charities and organizations",
    icon: HandHeart,
    color: "#84cc16",
  },
  {
    id: "legal",
    label: "Legal",
    description: "Law firms and attorneys",
    icon: Scale,
    color: "#64748b",
  },
  {
    id: "automotive",
    label: "Automotive",
    description: "Car dealers and repair shops",
    icon: Car,
    color: "#1e293b",
  },
  {
    id: "hospitality",
    label: "Hospitality",
    description: "Hotels and travel",
    icon: Hotel,
    color: "#0891b2",
  },
  {
    id: "construction",
    label: "Construction",
    description: "Contractors and builders",
    icon: HardHat,
    color: "#ca8a04",
  },
  {
    id: "photography",
    label: "Photography",
    description: "Photographers and studios",
    icon: Camera,
    color: "#7c3aed",
  },
  {
    id: "music",
    label: "Music & Entertainment",
    description: "Musicians and entertainment",
    icon: Music,
    color: "#e11d48",
  },
  {
    id: "events",
    label: "Events",
    description: "Event planning and venues",
    icon: PartyPopper,
    color: "#be185d",
  },
  {
    id: "other",
    label: "Other",
    description: "General purpose templates",
    icon: LayoutGrid,
    color: "#71717a",
  },
];

export function getCategoryInfo(industry: IndustryCategory): CategoryInfo {
  return INDUSTRY_CATEGORIES.find((c) => c.id === industry) || INDUSTRY_CATEGORIES[INDUSTRY_CATEGORIES.length - 1];
}
```

---

### Task 68.3: Template Data

**File: `src/lib/templates/template-data.ts`**

```typescript
import type { TemplateMetadata, IndustryCategory } from "./template-types";

// Sample template data - would be replaced by database in production
export const TEMPLATES: TemplateMetadata[] = [
  {
    id: "restaurant-modern",
    name: "Modern Bistro",
    description: "A sleek, modern restaurant template with menu showcase and reservation system.",
    industry: "restaurant",
    tags: ["modern", "menu", "reservations", "food"],
    preview: {
      thumbnail: "/templates/restaurant-modern/thumb.jpg",
      desktop: "/templates/restaurant-modern/desktop.jpg",
      mobile: "/templates/restaurant-modern/mobile.jpg",
    },
    features: ["Menu Display", "Reservation Form", "Photo Gallery", "Contact Info"],
    pages: 5,
    components: ["Hero", "Menu", "About", "Gallery", "Contact"],
    colorScheme: {
      primary: "#1a1a1a",
      secondary: "#d4a574",
      accent: "#e8e0d5",
    },
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-03-10"),
    popularity: 95,
    isNew: false,
    isPremium: false,
  },
  {
    id: "ecommerce-minimal",
    name: "Minimal Store",
    description: "Clean, minimalist e-commerce template focused on product presentation.",
    industry: "ecommerce",
    tags: ["minimal", "shop", "products", "clean"],
    preview: {
      thumbnail: "/templates/ecommerce-minimal/thumb.jpg",
      desktop: "/templates/ecommerce-minimal/desktop.jpg",
      mobile: "/templates/ecommerce-minimal/mobile.jpg",
    },
    features: ["Product Grid", "Shopping Cart", "Categories", "Search"],
    pages: 6,
    components: ["Hero", "Products", "Categories", "About", "FAQ", "Contact"],
    colorScheme: {
      primary: "#111827",
      secondary: "#f3f4f6",
      accent: "#3b82f6",
    },
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-03-15"),
    popularity: 88,
    isNew: true,
    isPremium: false,
  },
  {
    id: "portfolio-creative",
    name: "Creative Portfolio",
    description: "Bold, creative portfolio template for designers and artists.",
    industry: "portfolio",
    tags: ["creative", "bold", "gallery", "artistic"],
    preview: {
      thumbnail: "/templates/portfolio-creative/thumb.jpg",
      desktop: "/templates/portfolio-creative/desktop.jpg",
      mobile: "/templates/portfolio-creative/mobile.jpg",
    },
    features: ["Project Gallery", "About Section", "Skills", "Contact Form"],
    pages: 4,
    components: ["Hero", "Projects", "About", "Contact"],
    colorScheme: {
      primary: "#0f0f0f",
      secondary: "#ffffff",
      accent: "#ff5722",
    },
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-02-28"),
    popularity: 92,
    isNew: false,
    isPremium: false,
  },
  {
    id: "agency-corporate",
    name: "Corporate Agency",
    description: "Professional agency template with service showcases and team sections.",
    industry: "agency",
    tags: ["corporate", "professional", "services", "team"],
    preview: {
      thumbnail: "/templates/agency-corporate/thumb.jpg",
      desktop: "/templates/agency-corporate/desktop.jpg",
      mobile: "/templates/agency-corporate/mobile.jpg",
    },
    features: ["Service Showcase", "Team Section", "Case Studies", "Testimonials"],
    pages: 7,
    components: ["Hero", "Services", "About", "Team", "Portfolio", "Testimonials", "Contact"],
    colorScheme: {
      primary: "#1e40af",
      secondary: "#f8fafc",
      accent: "#fbbf24",
    },
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-03-20"),
    popularity: 85,
    isNew: false,
    isPremium: true,
  },
  {
    id: "healthcare-clinic",
    name: "Medical Clinic",
    description: "Trust-building healthcare template with appointment booking and doctor profiles.",
    industry: "healthcare",
    tags: ["medical", "clinic", "doctors", "appointments"],
    preview: {
      thumbnail: "/templates/healthcare-clinic/thumb.jpg",
      desktop: "/templates/healthcare-clinic/desktop.jpg",
      mobile: "/templates/healthcare-clinic/mobile.jpg",
    },
    features: ["Doctor Profiles", "Services", "Appointment Booking", "Location"],
    pages: 6,
    components: ["Hero", "Services", "Doctors", "About", "Appointments", "Contact"],
    colorScheme: {
      primary: "#0d9488",
      secondary: "#f0fdfa",
      accent: "#0891b2",
    },
    createdAt: new Date("2024-02-20"),
    updatedAt: new Date("2024-03-18"),
    popularity: 78,
    isNew: true,
    isPremium: false,
  },
  {
    id: "fitness-gym",
    name: "Power Gym",
    description: "Energetic gym template with class schedules and membership options.",
    industry: "fitness",
    tags: ["gym", "fitness", "classes", "membership"],
    preview: {
      thumbnail: "/templates/fitness-gym/thumb.jpg",
      desktop: "/templates/fitness-gym/desktop.jpg",
      mobile: "/templates/fitness-gym/mobile.jpg",
    },
    features: ["Class Schedule", "Trainers", "Membership Plans", "Gallery"],
    pages: 5,
    components: ["Hero", "Classes", "Trainers", "Pricing", "Contact"],
    colorScheme: {
      primary: "#dc2626",
      secondary: "#171717",
      accent: "#fbbf24",
    },
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-03-05"),
    popularity: 82,
    isNew: false,
    isPremium: false,
  },
];

// Filter and search templates
export function filterTemplates(
  templates: TemplateMetadata[],
  options: {
    industry?: IndustryCategory;
    search?: string;
    isPremium?: boolean;
    sortBy?: "popularity" | "newest" | "name";
  }
): TemplateMetadata[] {
  let filtered = [...templates];

  // Filter by industry
  if (options.industry && options.industry !== "other") {
    filtered = filtered.filter((t) => t.industry === options.industry);
  }

  // Filter by search
  if (options.search) {
    const search = options.search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        t.tags.some((tag) => tag.toLowerCase().includes(search))
    );
  }

  // Filter by premium status
  if (options.isPremium !== undefined) {
    filtered = filtered.filter((t) => t.isPremium === options.isPremium);
  }

  // Sort
  if (options.sortBy === "popularity") {
    filtered.sort((a, b) => b.popularity - a.popularity);
  } else if (options.sortBy === "newest") {
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } else if (options.sortBy === "name") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  return filtered;
}
```

---

### Task 68.4: Templates Hook

**File: `src/hooks/use-templates.ts`**

```typescript
"use client";

import { useState, useMemo, useCallback } from "react";
import { TEMPLATES, filterTemplates } from "@/lib/templates/template-data";
import type { TemplateMetadata, IndustryCategory, TemplateFilter } from "@/lib/templates/template-types";

export function useTemplates() {
  const [filter, setFilter] = useState<TemplateFilter>({
    industry: undefined,
    search: "",
    isPremium: undefined,
    sortBy: "popularity",
  });

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMetadata | null>(null);

  const templates = useMemo(() => {
    return filterTemplates(TEMPLATES, {
      industry: filter.industry,
      search: filter.search,
      isPremium: filter.isPremium,
      sortBy: filter.sortBy,
    });
  }, [filter]);

  const setIndustry = useCallback((industry: IndustryCategory | undefined) => {
    setFilter((prev) => ({ ...prev, industry }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setFilter((prev) => ({ ...prev, search }));
  }, []);

  const setSortBy = useCallback((sortBy: "popularity" | "newest" | "name") => {
    setFilter((prev) => ({ ...prev, sortBy }));
  }, []);

  const togglePremium = useCallback(() => {
    setFilter((prev) => ({
      ...prev,
      isPremium: prev.isPremium === undefined ? true : prev.isPremium === true ? false : undefined,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilter({
      industry: undefined,
      search: "",
      isPremium: undefined,
      sortBy: "popularity",
    });
  }, []);

  return {
    templates,
    filter,
    setIndustry,
    setSearch,
    setSortBy,
    togglePremium,
    clearFilters,
    selectedTemplate,
    setSelectedTemplate,
    totalCount: TEMPLATES.length,
    filteredCount: templates.length,
  };
}
```

---

### Task 68.5: Industry Badge Component

**File: `src/components/templates/industry-badge.tsx`**

```tsx
import { getCategoryInfo } from "@/lib/templates/template-categories";
import type { IndustryCategory } from "@/lib/templates/template-types";
import { Badge } from "@/components/ui/badge";

interface IndustryBadgeProps {
  industry: IndustryCategory;
  showIcon?: boolean;
  size?: "sm" | "md";
}

export function IndustryBadge({ industry, showIcon = true, size = "sm" }: IndustryBadgeProps) {
  const info = getCategoryInfo(industry);
  const Icon = info.icon;

  return (
    <Badge
      variant="secondary"
      className={`${size === "sm" ? "text-xs" : "text-sm"}`}
      style={{ backgroundColor: `${info.color}20`, color: info.color }}
    >
      {showIcon && <Icon className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} mr-1`} />}
      {info.label}
    </Badge>
  );
}
```

---

### Task 68.6: Template Card Component

**File: `src/components/templates/template-card.tsx`**

```tsx
"use client";

import Image from "next/image";
import { Eye, Star, Sparkles, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IndustryBadge } from "./industry-badge";
import type { TemplateMetadata } from "@/lib/templates/template-types";

interface TemplateCardProps {
  template: TemplateMetadata;
  onPreview: (template: TemplateMetadata) => void;
  onSelect: (template: TemplateMetadata) => void;
}

export function TemplateCard({ template, onPreview, onSelect }: TemplateCardProps) {
  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {/* Thumbnail */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
        
        {/* Placeholder for actual image */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
          <span className="text-4xl font-bold text-gray-400">{template.name.charAt(0)}</span>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {template.isNew && (
            <Badge className="bg-green-500 text-white">
              <Sparkles className="h-3 w-3 mr-1" />
              New
            </Badge>
          )}
          {template.isPremium && (
            <Badge className="bg-amber-500 text-white">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <Button size="sm" variant="secondary" onClick={() => onPreview(template)}>
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button size="sm" onClick={() => onSelect(template)}>
            Use Template
          </Button>
        </div>

        {/* Color scheme preview */}
        <div className="absolute bottom-3 right-3 flex gap-1">
          <div
            className="h-5 w-5 rounded-full border-2 border-white"
            style={{ backgroundColor: template.colorScheme.primary }}
          />
          <div
            className="h-5 w-5 rounded-full border-2 border-white"
            style={{ backgroundColor: template.colorScheme.secondary }}
          />
          <div
            className="h-5 w-5 rounded-full border-2 border-white"
            style={{ backgroundColor: template.colorScheme.accent }}
          />
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{template.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {template.description}
            </p>
          </div>
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium">{template.popularity}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <IndustryBadge industry={template.industry} />
          <span className="text-xs text-muted-foreground">
            {template.pages} pages
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Task 68.7: Template Filters Component

**File: `src/components/templates/template-filters.tsx`**

```tsx
"use client";

import { INDUSTRY_CATEGORIES } from "@/lib/templates/template-categories";
import type { IndustryCategory } from "@/lib/templates/template-types";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface TemplateFiltersProps {
  selectedIndustry?: IndustryCategory;
  onIndustryChange: (industry: IndustryCategory | undefined) => void;
}

export function TemplateFilters({ selectedIndustry, onIndustryChange }: TemplateFiltersProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        <Button
          variant={selectedIndustry === undefined ? "default" : "outline"}
          size="sm"
          onClick={() => onIndustryChange(undefined)}
        >
          All Templates
        </Button>
        
        {INDUSTRY_CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <Button
              key={category.id}
              variant={selectedIndustry === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => onIndustryChange(category.id)}
              className="flex items-center gap-1.5"
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </Button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
```

---

### Task 68.8: Template Search Component

**File: `src/components/templates/template-search.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TemplateSearchProps {
  search: string;
  onSearchChange: (search: string) => void;
  sortBy: "popularity" | "newest" | "name";
  onSortChange: (sort: "popularity" | "newest" | "name") => void;
  isPremiumFilter?: boolean;
  onTogglePremium: () => void;
  filteredCount: number;
  totalCount: number;
  onClearFilters: () => void;
}

export function TemplateSearch({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  isPremiumFilter,
  onTogglePremium,
  filteredCount,
  totalCount,
  onClearFilters,
}: TemplateSearchProps) {
  const [localSearch, setLocalSearch] = useState(search);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  const hasActiveFilters = search || isPremiumFilter !== undefined;

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Search input */}
      <div className="relative flex-1 w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {localSearch && (
          <button
            onClick={() => setLocalSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex gap-2 items-center">
        {/* Sort dropdown */}
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as any)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popularity">Most Popular</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
          </SelectContent>
        </Select>

        {/* Filters popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <SlidersHorizontal className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56">
            <div className="space-y-4">
              <div className="font-medium text-sm">Filters</div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="premium"
                  checked={isPremiumFilter === true}
                  onCheckedChange={onTogglePremium}
                />
                <Label htmlFor="premium" className="font-normal">
                  Premium only
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="free"
                  checked={isPremiumFilter === false}
                  onCheckedChange={onTogglePremium}
                />
                <Label htmlFor="free" className="font-normal">
                  Free only
                </Label>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={onClearFilters}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Results count */}
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {filteredCount} of {totalCount}
        </span>
      </div>
    </div>
  );
}
```

---

### Task 68.9: Template Preview Modal

**File: `src/components/templates/template-preview.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Monitor, Smartphone, X, ExternalLink, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IndustryBadge } from "./industry-badge";
import type { TemplateMetadata } from "@/lib/templates/template-types";

interface TemplatePreviewProps {
  template: TemplateMetadata | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: TemplateMetadata) => void;
}

export function TemplatePreview({
  template,
  open,
  onOpenChange,
  onSelect,
}: TemplatePreviewProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-3">
                {template.name}
                <IndustryBadge industry={template.industry} />
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {template.description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Device toggle */}
              <Tabs value={device} onValueChange={(v) => setDevice(v as any)}>
                <TabsList>
                  <TabsTrigger value="desktop">
                    <Monitor className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="mobile">
                    <Smartphone className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button onClick={() => onSelect(template)}>
                <Check className="h-4 w-4 mr-2" />
                Use This Template
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Preview area */}
        <div className="flex-1 overflow-hidden bg-muted/30 p-4">
          <div
            className={`mx-auto h-full bg-white rounded-lg shadow-lg overflow-hidden transition-all ${
              device === "mobile" ? "max-w-[375px]" : "max-w-full"
            }`}
          >
            {/* Placeholder for actual preview */}
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
              <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mb-4">
                <span className="text-6xl font-bold text-gray-400">
                  {template.name.charAt(0)}
                </span>
              </div>
              <p className="text-center">
                Preview for <strong>{template.name}</strong>
                <br />
                <span className="text-sm">
                  {device === "desktop" ? "Desktop" : "Mobile"} view
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Template info footer */}
        <div className="px-6 py-4 border-t bg-muted/50">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Pages:</span>
              <span className="ml-1 font-medium">{template.pages}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Features:</span>
              <span className="ml-1">
                {template.features.slice(0, 3).map((f, i) => (
                  <Badge key={i} variant="secondary" className="ml-1">
                    {f}
                  </Badge>
                ))}
                {template.features.length > 3 && (
                  <Badge variant="outline" className="ml-1">
                    +{template.features.length - 3} more
                  </Badge>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Colors:</span>
              <div
                className="ml-1 h-4 w-4 rounded-full border"
                style={{ backgroundColor: template.colorScheme.primary }}
              />
              <div
                className="h-4 w-4 rounded-full border"
                style={{ backgroundColor: template.colorScheme.secondary }}
              />
              <div
                className="h-4 w-4 rounded-full border"
                style={{ backgroundColor: template.colorScheme.accent }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Task 68.10: Template Gallery Component

**File: `src/components/templates/template-gallery.tsx`**

```tsx
"use client";

import { useTemplates } from "@/hooks/use-templates";
import { TemplateCard } from "./template-card";
import { TemplateFilters } from "./template-filters";
import { TemplateSearch } from "./template-search";
import { TemplatePreview } from "./template-preview";
import type { TemplateMetadata } from "@/lib/templates/template-types";

interface TemplateGalleryProps {
  onSelectTemplate?: (template: TemplateMetadata) => void;
}

export function TemplateGallery({ onSelectTemplate }: TemplateGalleryProps) {
  const {
    templates,
    filter,
    setIndustry,
    setSearch,
    setSortBy,
    togglePremium,
    clearFilters,
    selectedTemplate,
    setSelectedTemplate,
    totalCount,
    filteredCount,
  } = useTemplates();

  const handlePreview = (template: TemplateMetadata) => {
    setSelectedTemplate(template);
  };

  const handleSelect = (template: TemplateMetadata) => {
    onSelectTemplate?.(template);
    setSelectedTemplate(null);
  };

  return (
    <div className="space-y-6">
      {/* Search and sort */}
      <TemplateSearch
        search={filter.search || ""}
        onSearchChange={setSearch}
        sortBy={filter.sortBy || "popularity"}
        onSortChange={setSortBy}
        isPremiumFilter={filter.isPremium}
        onTogglePremium={togglePremium}
        filteredCount={filteredCount}
        totalCount={totalCount}
        onClearFilters={clearFilters}
      />

      {/* Industry filters */}
      <TemplateFilters
        selectedIndustry={filter.industry}
        onIndustryChange={setIndustry}
      />

      {/* Template grid */}
      {templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={handlePreview}
              onSelect={handleSelect}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No templates found matching your criteria.
          </p>
          <button
            onClick={clearFilters}
            className="text-primary hover:underline mt-2"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Preview modal */}
      <TemplatePreview
        template={selectedTemplate}
        open={!!selectedTemplate}
        onOpenChange={(open) => !open && setSelectedTemplate(null)}
        onSelect={handleSelect}
      />
    </div>
  );
}
```

---

### Task 68.11: Templates Page

**File: `src/app/(dashboard)/templates/page.tsx`**

```tsx
import { TemplateGallery } from "@/components/templates/template-gallery";

export const metadata = {
  title: "Templates | DRAMAC CMS",
  description: "Browse industry-specific website templates",
};

export default function TemplatesPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Website Templates</h1>
        <p className="text-muted-foreground mt-2">
          Choose from our collection of professionally designed templates for every industry.
        </p>
      </div>

      <TemplateGallery />
    </div>
  );
}
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Template filtering works correctly
- [ ] Search matches name, description, tags
- [ ] Sorting works for all options
- [ ] Category info retrieval works

### Integration Tests
- [ ] Gallery loads templates
- [ ] Filters update displayed templates
- [ ] Preview modal opens with correct data
- [ ] Template selection works

### E2E Tests
- [ ] User can browse all templates
- [ ] User can filter by industry
- [ ] User can search templates
- [ ] User can preview template
- [ ] User can select template

---

## ✅ Completion Checklist

- [ ] Template types defined
- [ ] Industry categories defined
- [ ] Template data created
- [ ] Templates hook working
- [ ] Industry badge component created
- [ ] Template card component created
- [ ] Template filters component created
- [ ] Template search component created
- [ ] Template preview modal created
- [ ] Template gallery component created
- [ ] Templates page created
- [ ] Tests passing

---

**Next Phase**: Phase 69 - Activity Logging
