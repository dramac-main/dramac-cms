/**
 * DRAMAC Studio Category Accordion
 * 
 * Collapsible category section for the component library.
 */

"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { ComponentCard } from "./component-card";
import type { ComponentDefinition } from "@/types/studio";
import type { CategoryInfo } from "@/lib/studio/registry/component-registry";

// =============================================================================
// TYPES
// =============================================================================

interface CategoryAccordionProps {
  category: CategoryInfo;
  components: ComponentDefinition[];
  defaultOpen?: boolean;
  onComponentDoubleClick?: (type: string) => void;
}

// =============================================================================
// HELPER
// =============================================================================

function getCategoryIcon(iconName: string) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
  return Icon || LucideIcons.Folder;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CategoryAccordion({
  category,
  components,
  defaultOpen = false,
  onComponentDoubleClick,
}: CategoryAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const CategoryIcon = getCategoryIcon(category.icon);
  
  if (components.length === 0) {
    return null;
  }
  
  return (
    <div className="border-b border-border last:border-b-0">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2.5 text-left",
          "hover:bg-muted/50 transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        )}
        aria-expanded={isOpen}
        aria-controls={`category-${category.id}`}
      >
        {/* Expand/Collapse Icon */}
        {isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        
        {/* Category Icon */}
        <CategoryIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        
        {/* Category Name */}
        <span className="flex-1 text-sm font-medium">
          {category.label}
        </span>
        
        {/* Count Badge */}
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {components.length}
        </span>
      </button>
      
      {/* Content */}
      {isOpen && (
        <div
          id={`category-${category.id}`}
          className="space-y-2 px-3 pb-3"
        >
          {components.map((definition) => (
            <ComponentCard
              key={definition.type}
              definition={definition}
              onDoubleClick={() => onComponentDoubleClick?.(definition.type)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
