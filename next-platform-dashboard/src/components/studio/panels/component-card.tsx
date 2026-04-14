/**
 * DRAMAC Studio Component Card
 * 
 * Compact, grid-friendly component card inspired by Webflow/Figma.
 * Two variants: "compact" (icon grid) and "default" (icon + label tile).
 * Both designed for a clean grid layout, not verbose list items.
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { DraggableComponent } from "@/components/studio/dnd";
import { Badge } from "@/components/ui/badge";
import type { ComponentDefinition } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface ComponentCardProps {
  definition: ComponentDefinition;
  variant?: "default" | "compact";
  onDoubleClick?: () => void;
}

// =============================================================================
// HELPER
// =============================================================================

function getIcon(iconName: string) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
  return Icon || LucideIcons.Box;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ComponentCard({
  definition,
  variant = "default",
  onDoubleClick,
}: ComponentCardProps) {
  const Icon = getIcon(definition.icon);
  
  // Compact variant — tiny icon pill for recently used row
  if (variant === "compact") {
    return (
      <DraggableComponent
        id={`compact-${definition.type}`}
        type={definition.type}
        label={definition.label}
        icon={definition.icon}
      >
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 rounded-lg border bg-background p-1.5",
            "hover:border-primary/50 hover:bg-primary/5 transition-all duration-150",
            "cursor-grab active:cursor-grabbing active:scale-95",
            "w-14 h-14"
          )}
          onDoubleClick={onDoubleClick}
          title={definition.label}
        >
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-[9px] leading-tight text-muted-foreground truncate max-w-full text-center">
            {definition.label}
          </span>
        </div>
      </DraggableComponent>
    );
  }
  
  // Default — clean tile card for the grid (Webflow-style)
  return (
    <DraggableComponent
      id={definition.type}
      type={definition.type}
      label={definition.label}
      icon={definition.icon}
    >
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-1 rounded-lg border bg-background",
          "p-2.5 min-h-16",
          "hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm transition-all duration-150",
          "cursor-grab active:cursor-grabbing active:scale-[0.97]",
          "group relative"
        )}
        onDoubleClick={onDoubleClick}
        role="button"
        tabIndex={0}
        aria-label={`Drag ${definition.label} to canvas`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onDoubleClick?.();
          }
        }}
      >
        {/* Icon */}
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/60 group-hover:bg-primary/10 transition-colors">
          <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary/80 transition-colors" />
        </div>
        
        {/* Label */}
        <span className="text-[11px] font-medium text-muted-foreground text-center leading-tight truncate max-w-full">
          {definition.label}
        </span>

        {/* Module badge — subtle top-right dot */}
        {definition.module && (
          <Badge 
            variant="secondary" 
            className="absolute -top-1 -right-1 text-[8px] px-1 py-0 h-3.5 border"
          >
            {definition.module.name}
          </Badge>
        )}
      </div>
    </DraggableComponent>
  );
}
