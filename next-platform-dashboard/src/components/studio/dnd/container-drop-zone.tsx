/**
 * DRAMAC Studio Container Drop Zone
 * 
 * A drop zone wrapper for container components that shows a visible
 * drop target when the container is empty or when dragging over it.
 * 
 * This enables dropping components INTO layout containers like Section,
 * Container, Grid, Row, Column, etc.
 */

"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/studio/store/ui-store";

// =============================================================================
// TYPES
// =============================================================================

interface ContainerDropZoneProps {
  /** Unique ID for this container (component ID) */
  containerId: string;
  /** Container type (for display purposes) */
  containerType: string;
  /** Child elements */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Minimum height when empty */
  minHeight?: string;
  /** Direction of content layout */
  direction?: "vertical" | "horizontal";
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ContainerDropZone({
  containerId,
  containerType,
  children,
  className,
  minHeight = "120px",
  direction = "vertical",
}: ContainerDropZoneProps) {
  const isDragging = useUIStore((s) => s.isDragging);
  
  const { setNodeRef, isOver, active } = useDroppable({
    id: `container-${containerId}`,
    data: {
      type: "container",
      containerId,
      containerType,
    },
  });
  
  // Check if we're dragging something that can be dropped
  const isDraggingFromLibrary = active?.data.current?.source === "library";
  const isDraggingFromCanvas = active?.data.current?.source === "canvas";
  const canDrop = isDraggingFromLibrary || isDraggingFromCanvas;
  
  // Check if we have actual children content
  const hasChildren = React.Children.count(children) > 0;
  const isEmpty = !hasChildren;
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative w-full",
        // Show drop indicator when dragging over this container
        canDrop && isOver && "ring-2 ring-primary ring-inset bg-primary/5",
        // Direction-based layout
        direction === "vertical" && "flex flex-col",
        direction === "horizontal" && "flex flex-row flex-wrap",
        className
      )}
      style={{
        minHeight: isEmpty ? minHeight : undefined,
      }}
    >
      {/* Children content */}
      {children}
      
      {/* Empty state placeholder - visible when empty and in editor */}
      {isEmpty && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "border-2 border-dashed rounded-lg transition-all duration-200",
            isDragging && canDrop
              ? "border-primary/50 bg-primary/5"
              : "border-muted-foreground/20 bg-muted/5",
            isOver && canDrop && "border-primary bg-primary/10"
          )}
        >
          <div className="flex flex-col items-center gap-2 text-center px-4">
            {isDragging && canDrop ? (
              <>
                <Target className="w-8 h-8 text-primary/60 animate-pulse" />
                <p className="text-sm font-medium text-primary/80">
                  Drop component here
                </p>
                <p className="text-xs text-muted-foreground">
                  {containerType} container
                </p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Empty {containerType.toLowerCase()}
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Drag components here
                </p>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Drop indicator overlay when hovering with content */}
      {!isEmpty && isOver && canDrop && (
        <div className="absolute inset-0 pointer-events-none bg-primary/5 border-2 border-primary border-dashed rounded-lg flex items-center justify-center z-10">
          <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
            Drop inside {containerType.toLowerCase()}
          </div>
        </div>
      )}
    </div>
  );
}
