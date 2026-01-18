"use client";

/**
 * Template Filters Component
 * Phase 68: Industry Templates UI
 * 
 * Search and industry filtering for template gallery.
 */

import { Search, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { INDUSTRIES, type IndustryCategory } from "@/lib/templates/template-types";
import { getTemplateCountByIndustry } from "@/lib/templates/template-data";
import { useMemo } from "react";

interface TemplateFiltersProps {
  selectedIndustry: IndustryCategory | "all";
  onIndustryChange: (industry: IndustryCategory | "all") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
}

export function TemplateFilters({
  selectedIndustry,
  onIndustryChange,
  searchQuery,
  onSearchChange,
  viewMode = "grid",
  onViewModeChange,
}: TemplateFiltersProps) {
  const templateCounts = useMemo(() => getTemplateCountByIndustry(), []);

  return (
    <div className="space-y-4">
      {/* Search and view mode */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {onViewModeChange && (
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewModeChange("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewModeChange("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Industry tabs */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          <Button
            variant={selectedIndustry === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => onIndustryChange("all")}
            className="shrink-0"
          >
            All Templates
          </Button>
          {INDUSTRIES.filter((industry) => templateCounts[industry.id]).map((industry) => (
            <Button
              key={industry.id}
              variant={selectedIndustry === industry.id ? "default" : "outline"}
              size="sm"
              onClick={() => onIndustryChange(industry.id)}
              className="shrink-0"
            >
              {industry.icon} {industry.label}
              <span className="ml-1 text-xs opacity-60">
                ({templateCounts[industry.id] || 0})
              </span>
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
