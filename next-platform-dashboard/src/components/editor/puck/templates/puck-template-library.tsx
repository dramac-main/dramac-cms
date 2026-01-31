/**
 * Puck Template Library Component
 * PHASE-ED-07A: Template System - Categories
 * 
 * Main template browser with category filtering, search, preview,
 * and template application to the Puck editor.
 */

"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Sparkles,
  Star,
  RefreshCw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { TemplateCard } from "./template-card";
import { TemplatePreviewModal } from "./template-preview-modal";

import type { PuckTemplate, TemplateCategory, TemplateFilterState } from "@/types/puck-templates";
import { TEMPLATE_CATEGORIES, getCategoriesGrouped } from "@/lib/templates/puck-template-categories";
import { STARTER_TEMPLATES } from "@/lib/templates/puck-templates";
import { PREMIUM_TEMPLATES } from "@/lib/templates/premium";

interface PuckTemplateLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (data: PuckTemplate["puckData"]) => void;
  agencyId?: string;
}

export function PuckTemplateLibrary({
  open,
  onOpenChange,
  onApply,
  agencyId,
}: PuckTemplateLibraryProps) {
  // State
  const [filters, setFilters] = useState<TemplateFilterState>({
    category: "all",
    search: "",
    tags: [],
    isPremium: null,
    isNew: null,
    sortBy: "popularity",
    difficulty: "all",
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewTemplate, setPreviewTemplate] = useState<PuckTemplate | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "starter" | "premium">("all");

  // Combine all templates
  const allTemplates = useMemo(() => {
    return [...STARTER_TEMPLATES, ...PREMIUM_TEMPLATES];
  }, []);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let templates = allTemplates;

    // Filter by tab
    if (activeTab === "starter") {
      templates = templates.filter((t) => !t.isPremium);
    } else if (activeTab === "premium") {
      templates = templates.filter((t) => t.isPremium);
    }

    // Filter by category
    if (filters.category !== "all") {
      templates = templates.filter((t) => t.category === filters.category);
    }

    // Filter by search
    if (filters.search) {
      const query = filters.search.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Filter by difficulty
    if (filters.difficulty !== "all") {
      templates = templates.filter((t) => t.metadata.difficulty === filters.difficulty);
    }

    // Filter by new
    if (filters.isNew !== null) {
      templates = templates.filter((t) => t.isNew === filters.isNew);
    }

    // Sort
    switch (filters.sortBy) {
      case "popularity":
        templates = [...templates].sort((a, b) => b.popularity - a.popularity);
        break;
      case "newest":
        templates = [...templates].sort(
          (a, b) =>
            new Date(b.metadata.lastUpdated).getTime() -
            new Date(a.metadata.lastUpdated).getTime()
        );
        break;
      case "name":
        templates = [...templates].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "rating":
        templates = [...templates].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    }

    return templates;
  }, [allTemplates, activeTab, filters]);

  // Featured templates
  const featuredTemplates = useMemo(() => {
    return allTemplates.filter((t) => t.isFeatured).slice(0, 4);
  }, [allTemplates]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allTemplates.length };
    allTemplates.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [allTemplates]);

  // Handle apply template
  const handleApply = useCallback(
    async (template: PuckTemplate) => {
      setApplyingId(template.id);
      try {
        // Small delay for UX feedback
        await new Promise((resolve) => setTimeout(resolve, 300));
        
        onApply(template.puckData);
        toast.success(`Applied template: ${template.name}`);
        onOpenChange(false);
        setPreviewTemplate(null);
      } catch (error) {
        toast.error("Failed to apply template");
        console.error("Template apply error:", error);
      } finally {
        setApplyingId(null);
      }
    },
    [onApply, onOpenChange]
  );

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      category: "all",
      search: "",
      tags: [],
      isPremium: null,
      isNew: null,
      sortBy: "popularity",
      difficulty: "all",
    });
  }, []);

  // Has active filters
  const hasActiveFilters =
    filters.category !== "all" ||
    filters.search ||
    filters.difficulty !== "all" ||
    filters.isNew !== null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" />
              Template Library
            </SheetTitle>
            <SheetDescription>
              Choose a template to start your design. All templates are fully customizable.
            </SheetDescription>
          </SheetHeader>

          {/* Filters Bar */}
          <div className="px-6 py-4 border-b space-y-4 shrink-0 bg-muted/30">
            {/* Search and View Toggle */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, search: e.target.value }))
                  }
                  className="pl-9"
                />
              </div>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={filters.category}
                onValueChange={(value) =>
                  setFilters((f) => ({ ...f, category: value as TemplateCategory | "all" }))
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories ({categoryCounts.all})</SelectItem>
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label} ({categoryCounts[cat.id] || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.sortBy}
                onValueChange={(value) =>
                  setFilters((f) => ({ ...f, sortBy: value as TemplateFilterState["sortBy"] }))
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Most Popular</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.difficulty}
                onValueChange={(value) =>
                  setFilters((f) => ({ ...f, difficulty: value as TemplateFilterState["difficulty"] }))
                }
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="mx-6 mt-4 shrink-0">
              <TabsTrigger value="all" className="flex-1">
                All ({allTemplates.length})
              </TabsTrigger>
              <TabsTrigger value="starter" className="flex-1">
                <Sparkles className="h-3 w-3 mr-1" />
                Free ({STARTER_TEMPLATES.length})
              </TabsTrigger>
              <TabsTrigger value="premium" className="flex-1">
                <Star className="h-3 w-3 mr-1" />
                Premium ({PREMIUM_TEMPLATES.length})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 px-6 py-4">
              <TabsContent value="all" className="mt-0">
                {/* Featured Section */}
                {!hasActiveFilters && featuredTemplates.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      Featured Templates
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {featuredTemplates.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          compact
                          onPreview={() => setPreviewTemplate(template)}
                          onApply={() => handleApply(template)}
                          isApplying={applyingId === template.id}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* All Templates */}
                <TemplateGrid
                  templates={filteredTemplates}
                  viewMode={viewMode}
                  onPreview={setPreviewTemplate}
                  onApply={handleApply}
                  applyingId={applyingId}
                />
              </TabsContent>

              <TabsContent value="starter" className="mt-0">
                <TemplateGrid
                  templates={filteredTemplates}
                  viewMode={viewMode}
                  onPreview={setPreviewTemplate}
                  onApply={handleApply}
                  applyingId={applyingId}
                />
              </TabsContent>

              <TabsContent value="premium" className="mt-0">
                {PREMIUM_TEMPLATES.length === 0 ? (
                  <div className="py-12 text-center">
                    <Star className="h-12 w-12 mx-auto text-amber-500/50 mb-4" />
                    <h3 className="font-semibold mb-2">Premium Templates Coming Soon</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Our collection of premium, professionally-designed templates will be available soon.
                    </p>
                  </div>
                ) : (
                  <TemplateGrid
                    templates={filteredTemplates}
                    viewMode={viewMode}
                    onPreview={setPreviewTemplate}
                    onApply={handleApply}
                    applyingId={applyingId}
                  />
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
        onApply={handleApply}
        isApplying={applyingId === previewTemplate?.id}
      />
    </>
  );
}

/**
 * Template Grid/List Component
 */
function TemplateGrid({
  templates,
  viewMode,
  onPreview,
  onApply,
  applyingId,
}: {
  templates: PuckTemplate[];
  viewMode: "grid" | "list";
  onPreview: (template: PuckTemplate) => void;
  onApply: (template: PuckTemplate) => void;
  applyingId: string | null;
}) {
  if (templates.length === 0) {
    return (
      <div className="py-12 text-center">
        <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="font-semibold mb-2">No templates found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or search query.
        </p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-3">
        {templates.map((template) => (
          <TemplateListItem
            key={template.id}
            template={template}
            onPreview={() => onPreview(template)}
            onApply={() => onApply(template)}
            isApplying={applyingId === template.id}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onPreview={() => onPreview(template)}
          onApply={() => onApply(template)}
          isApplying={applyingId === template.id}
        />
      ))}
    </div>
  );
}

/**
 * Template List Item Component
 */
import { getCategoryIcon, getCategoryLabel } from "@/lib/templates/puck-template-categories";
import { Eye, Download, Layers, Clock } from "lucide-react";

function TemplateListItem({
  template,
  onPreview,
  onApply,
  isApplying,
}: {
  template: PuckTemplate;
  onPreview: () => void;
  onApply: () => void;
  isApplying: boolean;
}) {
  return (
    <div className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      {/* Thumbnail */}
      <div className="w-20 h-14 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {template.thumbnail && template.thumbnail !== "/templates/blank.svg" ? (
          <img
            src={template.thumbnail}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl">{getCategoryIcon(template.category)}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">{template.name}</h4>
          {template.isPremium && (
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
              Premium
            </Badge>
          )}
          {template.isNew && (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
              New
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{template.description}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {template.metadata.componentCount}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {template.metadata.estimatedBuildTime}
          </span>
          <Badge variant="outline" className="text-xs">
            {getCategoryLabel(template.category)}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 shrink-0">
        <Button size="sm" variant="outline" onClick={onPreview}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={onApply} disabled={isApplying}>
          {isApplying ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default PuckTemplateLibrary;
