/**
 * DRAMAC Studio Component Card
 * 
 * Displays a component in the library panel.
 * Wraps with DraggableComponent for drag functionality.
 * Shows module badge for components from installed modules.
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
  
  // Compact variant for recently used
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
            "flex flex-col items-center justify-center gap-1 rounded-md border bg-background p-2",
            "hover:border-primary hover:bg-primary/5 transition-colors",
            "cursor-grab active:cursor-grabbing",
            "w-16 h-16"
          )}
          onDoubleClick={onDoubleClick}
          title={definition.label}
        >
          <Icon className="h-5 w-5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground truncate max-w-full">
            {definition.label}
          </span>
        </div>
      </DraggableComponent>
    );
  }
  
  // Default variant - full card
  return (
    <DraggableComponent
      id={definition.type}
      type={definition.type}
      label={definition.label}
      icon={definition.icon}
    >
      <div
        className={cn(
          "flex items-start gap-3 rounded-md border bg-background p-3",
          "hover:border-primary hover:bg-primary/5 transition-colors",
          "cursor-grab active:cursor-grabbing"
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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium leading-none">
              {definition.label}
            </h4>
            {/* Module Badge */}
            {definition.module && (
              <Badge 
                variant="secondary" 
                className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0"
              >
                {definition.module.name}
              </Badge>
            )}
          </div>
          {definition.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {definition.description}
            </p>
          )}
        </div>
      </div>
    </DraggableComponent>
  );
}
