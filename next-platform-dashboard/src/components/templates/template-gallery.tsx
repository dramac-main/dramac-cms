"use client";

/**
 * Template Gallery Component
 * Phase 68: Industry Templates UI
 * 
 * Main gallery displaying templates with filtering, search, and selection.
 */

import { useState, useMemo } from "react";
import { TemplateCard } from "./template-card";
import { TemplateFilters } from "./template-filters";
import { TemplatePreview } from "./template-preview";
import { TEMPLATES, getTemplatesByIndustry } from "@/lib/templates/template-data";
import type { Template, IndustryCategory } from "@/lib/templates/template-types";
import { LayoutDashboard } from "lucide-react";

interface TemplateGalleryProps {
  onSelect?: (template: Template) => void;
  showSelectButton?: boolean;
  selectedTemplateId?: string;
  compact?: boolean;
}

export function TemplateGallery({
  onSelect,
  showSelectButton = false,
  selectedTemplateId,
  compact = false,
}: TemplateGalleryProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const templates = useMemo(() => {
    const filtered = getTemplatesByIndustry(selectedIndustry);
    if (!searchQuery) return filtered;
    
    const query = searchQuery.toLowerCase();
    return filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.features.some((f) => f.toLowerCase().includes(query))
    );
  }, [selectedIndustry, searchQuery]);

  const handleSelect = (template: Template) => {
    onSelect?.(template);
    setPreviewTemplate(null);
  };

  return (
    <div className="space-y-6">
      <TemplateFilters
        selectedIndustry={selectedIndustry}
        onIndustryChange={setSelectedIndustry}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {templates.length === 0 ? (
        <EmptyState searchQuery={searchQuery} />
      ) : viewMode === "grid" ? (
        <div
          className={`grid gap-6 ${
            compact
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          }`}
        >
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={() => setPreviewTemplate(template)}
              onSelect={showSelectButton ? () => handleSelect(template) : undefined}
              selected={selectedTemplateId === template.id}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <TemplateListItem
              key={template.id}
              template={template}
              onPreview={() => setPreviewTemplate(template)}
              onSelect={showSelectButton ? () => handleSelect(template) : undefined}
              selected={selectedTemplateId === template.id}
            />
          ))}
        </div>
      )}

      <TemplatePreview
        template={previewTemplate}
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
        onSelect={showSelectButton ? handleSelect : undefined}
      />
    </div>
  );
}

/**
 * Empty state when no templates match
 */
function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="text-center py-12 border-2 border-dashed rounded-lg">
      <LayoutDashboard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="font-semibold mb-1">No templates found</h3>
      <p className="text-muted-foreground">
        {searchQuery
          ? `No templates match "${searchQuery}". Try a different search.`
          : "Try selecting a different industry or clearing filters."}
      </p>
    </div>
  );
}

/**
 * List view item for templates
 */
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Check } from "lucide-react";
import { INDUSTRIES } from "@/lib/templates/template-types";

function TemplateListItem({
  template,
  onPreview,
  onSelect,
  selected,
}: {
  template: Template;
  onPreview?: () => void;
  onSelect?: () => void;
  selected?: boolean;
}) {
  const industry = INDUSTRIES.find((i) => i.id === template.industry);

  return (
    <div
      className={`flex items-center gap-4 p-4 border rounded-lg transition-colors hover:bg-muted/50 ${
        selected ? "ring-2 ring-primary bg-primary/5" : ""
      }`}
    >
      <div className="w-12 h-12 flex items-center justify-center text-3xl bg-muted rounded-lg shrink-0">
        {industry?.icon || "🌐"}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold truncate">{template.name}</h3>
          {selected && (
            <Badge variant="default" className="bg-green-600 shrink-0">
              <Check className="h-3 w-3 mr-1" />
              Selected
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{template.description}</p>
        <div className="flex gap-1 mt-1">
          <Badge variant="secondary" className="text-xs">
            {industry?.label}
          </Badge>
          {template.features.slice(0, 2).map((feature) => (
            <Badge key={feature} variant="outline" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        <Button size="sm" variant="outline" onClick={onPreview}>
          <Eye className="h-4 w-4" />
        </Button>
        {onSelect && (
          <Button size="sm" onClick={onSelect}>
            <Check className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
