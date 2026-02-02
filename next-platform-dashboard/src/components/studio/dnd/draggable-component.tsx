/**
 * DRAMAC Studio Draggable Component
 * 
 * Wraps component library items to make them draggable.
 */

"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { LibraryDragData } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface DraggableComponentProps {
  id: string;
  type: string;
  label: string;
  icon: string;
  children: React.ReactNode;
  disabled?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DraggableComponent({
  id,
  type,
  label,
  icon,
  children,
  disabled = false,
}: DraggableComponentProps) {
  const dragData: LibraryDragData = {
    source: "library",
    componentType: type,
    label,
    icon,
  };
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `library-${id}`,
    data: dragData,
    disabled,
  });
  
  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50",
        disabled && "cursor-not-allowed opacity-50"
      )}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
