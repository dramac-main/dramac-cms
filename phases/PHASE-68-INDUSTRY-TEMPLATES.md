# Phase 68: Industry Templates UI - Visual Template Gallery

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟢 MEDIUM
>
> **Estimated Time**: 2-3 hours

---

## ⚠️ CHECK EXISTING TEMPLATE SYSTEM FIRST!

**Files to review:**
- `src/lib/templates/` - Check if template data exists
- `src/app/(dashboard)/templates/` - Check if templates page exists
- `src/components/templates/` - Check existing template components

**This phase adds:**
- Template gallery with industry filtering
- Template preview modal
- One-click template selection in site creation

---

## ⚠️ SCHEMA WARNING - USE CORRECT TABLE NAMES!

| ❌ DO NOT USE | ✅ USE INSTEAD |
|---------------|----------------|
| `site_modules` | `site_module_installations` |
| `modules` | `modules_v2` |

---

## 🎯 Objective

Create a visual template selection interface with industry filtering, previews, and easy selection during site creation workflow.

---

## 📋 Prerequisites

- [ ] Phase 67 AI Regeneration completed
- [ ] Site creation flow exists
- [ ] AI Builder can generate from templates

---

## ✅ Tasks

### Task 68.1: Template Types

**File: `src/lib/templates/template-types.ts`**

```typescript
export type IndustryCategory =
  | "restaurant"
  | "retail"
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
  | "construction"
  | "photography"
  | "events"
  | "general";

export interface Template {
  id: string;
  name: string;
  description: string;
  industry: IndustryCategory;
  thumbnail: string;
  sections: string[];
  features: string[];
  popularity: number;
}

export interface IndustryInfo {
  id: IndustryCategory;
  label: string;
  icon: string;
  description: string;
}

export const INDUSTRIES: IndustryInfo[] = [
  { id: "general", label: "General", icon: "🏢", description: "Multi-purpose websites" },
  { id: "restaurant", label: "Restaurant", icon: "🍽️", description: "Restaurants & cafes" },
  { id: "retail", label: "Retail", icon: "🛍️", description: "Shops & e-commerce" },
  { id: "portfolio", label: "Portfolio", icon: "🎨", description: "Creative portfolios" },
  { id: "agency", label: "Agency", icon: "💼", description: "Marketing & design agencies" },
  { id: "healthcare", label: "Healthcare", icon: "🏥", description: "Medical & health services" },
  { id: "education", label: "Education", icon: "📚", description: "Schools & courses" },
  { id: "realestate", label: "Real Estate", icon: "🏠", description: "Property & listings" },
  { id: "fitness", label: "Fitness", icon: "💪", description: "Gyms & trainers" },
  { id: "beauty", label: "Beauty", icon: "💄", description: "Salons & spas" },
  { id: "technology", label: "Technology", icon: "💻", description: "Tech & SaaS" },
  { id: "nonprofit", label: "Nonprofit", icon: "❤️", description: "Charities & NGOs" },
  { id: "legal", label: "Legal", icon: "⚖️", description: "Law firms" },
  { id: "construction", label: "Construction", icon: "🔨", description: "Builders & contractors" },
  { id: "photography", label: "Photography", icon: "📷", description: "Photo studios" },
  { id: "events", label: "Events", icon: "🎉", description: "Event planning" },
];
```

---

### Task 68.2: Template Data

**File: `src/lib/templates/template-data.ts`**

```typescript
import type { Template } from "./template-types";

export const TEMPLATES: Template[] = [
  {
    id: "modern-restaurant",
    name: "Modern Restaurant",
    description: "Elegant restaurant website with menu showcase and reservations",
    industry: "restaurant",
    thumbnail: "/templates/restaurant-1.png",
    sections: ["hero", "menu", "about", "gallery", "reservations", "contact"],
    features: ["Menu display", "Online reservations", "Photo gallery", "Location map"],
    popularity: 95,
  },
  {
    id: "creative-portfolio",
    name: "Creative Portfolio",
    description: "Minimalist portfolio for designers and artists",
    industry: "portfolio",
    thumbnail: "/templates/portfolio-1.png",
    sections: ["hero", "work", "about", "services", "testimonials", "contact"],
    features: ["Project showcase", "Filterable gallery", "Case studies", "Contact form"],
    popularity: 92,
  },
  {
    id: "tech-startup",
    name: "Tech Startup",
    description: "Modern SaaS landing page with features and pricing",
    industry: "technology",
    thumbnail: "/templates/tech-1.png",
    sections: ["hero", "features", "howItWorks", "pricing", "testimonials", "cta"],
    features: ["Feature grid", "Pricing table", "Testimonials", "Newsletter signup"],
    popularity: 90,
  },
  {
    id: "fitness-studio",
    name: "Fitness Studio",
    description: "Dynamic gym and fitness center website",
    industry: "fitness",
    thumbnail: "/templates/fitness-1.png",
    sections: ["hero", "classes", "trainers", "schedule", "pricing", "contact"],
    features: ["Class schedule", "Trainer profiles", "Membership plans", "Class booking"],
    popularity: 88,
  },
  {
    id: "healthcare-clinic",
    name: "Healthcare Clinic",
    description: "Professional medical practice website",
    industry: "healthcare",
    thumbnail: "/templates/healthcare-1.png",
    sections: ["hero", "services", "doctors", "testimonials", "faq", "contact"],
    features: ["Service list", "Doctor profiles", "Appointment booking", "FAQ section"],
    popularity: 85,
  },
  {
    id: "real-estate",
    name: "Real Estate Agency",
    description: "Property listing and real estate agency site",
    industry: "realestate",
    thumbnail: "/templates/realestate-1.png",
    sections: ["hero", "properties", "services", "agents", "testimonials", "contact"],
    features: ["Property grid", "Agent profiles", "Search functionality", "Inquiry form"],
    popularity: 87,
  },
  // Add more templates as needed
];

export function getTemplatesByIndustry(industry: string): Template[] {
  if (industry === "all") return TEMPLATES;
  return TEMPLATES.filter(t => t.industry === industry);
}

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find(t => t.id === id);
}

export function getPopularTemplates(limit: number = 6): Template[] {
  return [...TEMPLATES].sort((a, b) => b.popularity - a.popularity).slice(0, limit);
}
```

---

### Task 68.3: Template Gallery Component

**File: `src/components/templates/template-gallery.tsx`**

```typescript
"use client";

import { useState } from "react";
import { TemplateCard } from "./template-card";
import { TemplateFilters } from "./template-filters";
import { TemplatePreview } from "./template-preview";
import { TEMPLATES, getTemplatesByIndustry } from "@/lib/templates/template-data";
import type { Template, IndustryCategory } from "@/lib/templates/template-types";

interface TemplateGalleryProps {
  onSelect?: (template: Template) => void;
  showSelectButton?: boolean;
}

export function TemplateGallery({ onSelect, showSelectButton = false }: TemplateGalleryProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const templates = getTemplatesByIndustry(selectedIndustry).filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <TemplateFilters
        selectedIndustry={selectedIndustry}
        onIndustryChange={setSelectedIndustry}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {templates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No templates found. Try a different filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={() => setPreviewTemplate(template)}
              onSelect={showSelectButton ? () => onSelect?.(template) : undefined}
            />
          ))}
        </div>
      )}

      <TemplatePreview
        template={previewTemplate}
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
        onSelect={onSelect}
      />
    </div>
  );
}
```

---

### Task 68.4: Template Card

**File: `src/components/templates/template-card.tsx`**

```typescript
"use client";

import Image from "next/image";
import { Eye, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { INDUSTRIES } from "@/lib/templates/template-types";
import type { Template } from "@/lib/templates/template-types";

interface TemplateCardProps {
  template: Template;
  onPreview?: () => void;
  onSelect?: () => void;
}

export function TemplateCard({ template, onPreview, onSelect }: TemplateCardProps) {
  const industry = INDUSTRIES.find(i => i.id === template.industry);

  return (
    <Card className="overflow-hidden group">
      <div className="relative aspect-[4/3] bg-muted">
        {template.thumbnail ? (
          <Image
            src={template.thumbnail}
            alt={template.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {industry?.icon || "🌐"}
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="sm" variant="secondary" onClick={onPreview}>
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          {onSelect && (
            <Button size="sm" onClick={onSelect}>
              <Check className="h-4 w-4 mr-1" />
              Select
            </Button>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold">{template.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {template.description}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-wrap gap-1">
        <Badge variant="secondary">
          {industry?.icon} {industry?.label}
        </Badge>
        {template.features.slice(0, 2).map((feature) => (
          <Badge key={feature} variant="outline" className="text-xs">
            {feature}
          </Badge>
        ))}
      </CardFooter>
    </Card>
  );
}
```

---

### Task 68.5: Template Filters

**File: `src/components/templates/template-filters.tsx`**

```typescript
"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { INDUSTRIES, type IndustryCategory } from "@/lib/templates/template-types";
import { cn } from "@/lib/utils";

interface TemplateFiltersProps {
  selectedIndustry: IndustryCategory | "all";
  onIndustryChange: (industry: IndustryCategory | "all") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function TemplateFilters({
  selectedIndustry,
  onIndustryChange,
  searchQuery,
  onSearchChange,
}: TemplateFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Industry tabs */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          <Button
            variant={selectedIndustry === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => onIndustryChange("all")}
          >
            All Templates
          </Button>
          {INDUSTRIES.map((industry) => (
            <Button
              key={industry.id}
              variant={selectedIndustry === industry.id ? "default" : "outline"}
              size="sm"
              onClick={() => onIndustryChange(industry.id)}
            >
              {industry.icon} {industry.label}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
```

---

### Task 68.6: Template Preview Modal

**File: `src/components/templates/template-preview.tsx`**

```typescript
"use client";

import Image from "next/image";
import { Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { INDUSTRIES } from "@/lib/templates/template-types";
import type { Template } from "@/lib/templates/template-types";

interface TemplatePreviewProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (template: Template) => void;
}

export function TemplatePreview({
  template,
  open,
  onOpenChange,
  onSelect,
}: TemplatePreviewProps) {
  if (!template) return null;

  const industry = INDUSTRIES.find(i => i.id === template.industry);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview image */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {template.thumbnail ? (
              <Image
                src={template.thumbnail}
                alt={template.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">
                {industry?.icon || "🌐"}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-muted-foreground">{template.description}</p>
              
              <h3 className="font-medium mt-4 mb-2">Industry</h3>
              <Badge variant="secondary" className="text-sm">
                {industry?.icon} {industry?.label}
              </Badge>
            </div>

            <div>
              <h3 className="font-medium mb-2">Features</h3>
              <ul className="space-y-1">
                {template.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              <h3 className="font-medium mt-4 mb-2">Sections</h3>
              <div className="flex flex-wrap gap-1">
                {template.sections.map((section) => (
                  <Badge key={section} variant="outline">
                    {section}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {onSelect && (
              <Button onClick={() => onSelect(template)}>
                <Check className="h-4 w-4 mr-2" />
                Use This Template
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## ✅ Completion Checklist

- [ ] Template types defined
- [ ] Template data populated (at least 6 templates)
- [ ] Gallery component with filtering
- [ ] Template card component
- [ ] Filter tabs working
- [ ] Preview modal functional
- [ ] Select button works in site creation
- [ ] Placeholder thumbnails created

---

## 📝 Notes for AI Agent

1. **PLACEHOLDER IMAGES** - Create `/public/templates/` folder with placeholder images
2. **INDUSTRY COVERAGE** - Start with 6-10 diverse industries
3. **EXTENSIBLE** - Design for easy template additions
4. **INTEGRATE** - Hook into site creation wizard
5. **NO DATABASE** - Templates are static data for now
