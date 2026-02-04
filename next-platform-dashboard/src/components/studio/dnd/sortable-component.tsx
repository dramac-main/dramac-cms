/**
 * DRAMAC Studio Sortable Component
 * 
 * Wraps canvas components to make them sortable/reorderable.
 * Enhanced with visual drop indicators.
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
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

type DropPosition = "above" | "below" | null;

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
    active,
  } = useSortable({
    id,
    data: dragData,
    disabled,
  });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropPosition, setDropPosition] = useState<DropPosition>(null);
  
  // Track mouse position to determine drop position (above/below center)
  useEffect(() => {
    if (!isOver || !active) {
      setDropPosition(null);
      return;
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      
      setDropPosition(e.clientY < centerY ? "above" : "below");
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isOver, active]);
  
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Maintain the element in flow but make it invisible when dragging
    opacity: isDragging ? 0.5 : 1,
    position: "relative",
  };
  
  // Check if something is actively being dragged (not this component)
  const showIndicator = isOver && active && active.id !== id;
  
  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      style={style}
      className={cn(
        "group relative",
        disabled && "pointer-events-none"
      )}
      data-component-id={id}
      {...attributes}
      {...listeners}
    >
      {/* Drop indicator - above */}
      {showIndicator && dropPosition === "above" && (
        <div className="absolute -top-1 left-0 right-0 z-50 pointer-events-none">
          <div className="h-1 bg-primary rounded-full shadow-lg animate-pulse" />
          <div className="absolute -left-1 -top-1 w-3 h-3 bg-primary rounded-full" />
          <div className="absolute -right-1 -top-1 w-3 h-3 bg-primary rounded-full" />
        </div>
      )}
      
      {children}
      
      {/* Drop indicator - below */}
      {showIndicator && dropPosition === "below" && (
        <div className="absolute -bottom-1 left-0 right-0 z-50 pointer-events-none">
          <div className="h-1 bg-primary rounded-full shadow-lg animate-pulse" />
          <div className="absolute -left-1 -bottom-1 w-3 h-3 bg-primary rounded-full" />
          <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-primary rounded-full" />
        </div>
      )}
    </div>
  );
}
