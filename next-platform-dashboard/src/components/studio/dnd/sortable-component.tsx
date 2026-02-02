/**
 * DRAMAC Studio Sortable Component
 * 
 * Wraps canvas components to make them sortable/reorderable.
 */

"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { CanvasDragData } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface SortableComponentProps {
  id: string;
  componentType: string;
  parentId: string | null;
  index: number;
  children: React.ReactNode;
  disabled?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SortableComponent({
  id,
  componentType,
  parentId,
  index,
  children,
  disabled = false,
}: SortableComponentProps) {
  const dragData: CanvasDragData = {
    source: "canvas",
    componentId: id,
    componentType,
    parentId,
    index,
  };
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id,
    data: dragData,
    disabled,
  });
  
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Maintain the element in flow but make it invisible when dragging
    opacity: isDragging ? 0.5 : 1,
    position: "relative",
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative",
        isOver && "ring-2 ring-primary ring-offset-2",
        disabled && "pointer-events-none"
      )}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
