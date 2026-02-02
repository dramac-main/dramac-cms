/**
 * DRAMAC Studio Drag Overlay
 * 
 * Shows a preview of the component being dragged.
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { componentRegistry } from "@/lib/studio/registry/component-registry";
import { Box, type LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { DragData, LibraryDragData, CanvasDragData } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface DragOverlayContentProps {
  data: DragData;
}

// =============================================================================
// HELPER
// =============================================================================

function getIcon(iconName: string): LucideIcon {
  const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName];
  return Icon || Box;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DragOverlayContent({ data }: DragOverlayContentProps) {
  if (data.source === "library") {
    return <LibraryDragOverlay data={data as LibraryDragData} />;
  }
  
  return <CanvasDragOverlay data={data as CanvasDragData} />;
}

// =============================================================================
// LIBRARY DRAG OVERLAY
// =============================================================================

function LibraryDragOverlay({ data }: { data: LibraryDragData }) {
  const Icon = getIcon(data.icon);
  
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border bg-background px-3 py-2 shadow-lg",
        "border-primary/50 bg-primary/5"
      )}
    >
      <Icon className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium">{data.label}</span>
    </div>
  );
}

// =============================================================================
// CANVAS DRAG OVERLAY
// =============================================================================

function CanvasDragOverlay({ data }: { data: CanvasDragData }) {
  const definition = componentRegistry.get(data.componentType);
  const Icon = getIcon(definition?.icon ?? "Box");
  const label = definition?.label ?? data.componentType;
  
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border bg-background px-3 py-2 shadow-lg",
        "border-blue-500/50 bg-blue-500/5"
      )}
    >
      <Icon className="h-4 w-4 text-blue-500" />
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">(moving)</span>
    </div>
  );
}
