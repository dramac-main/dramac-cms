/**
 * DRAMAC Studio Droppable Canvas
 * 
 * The main drop zone for the canvas.
 * Accepts drops from the library to add new components.
 */

"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface DroppableCanvasProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DroppableCanvas({
  id = "canvas-drop-zone",
  children,
  className,
}: DroppableCanvasProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id,
  });
  
  // Check if we're dragging from library
  const isDraggingFromLibrary = active?.data.current?.source === "library";
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative min-h-full transition-colors duration-200",
        // Show drop indicator when dragging from library
        isDraggingFromLibrary && "bg-primary/5",
        isDraggingFromLibrary && isOver && "bg-primary/10 ring-2 ring-inset ring-primary/30",
        className
      )}
    >
      {children}
      
      {/* Empty state indicator when dragging */}
      {isDraggingFromLibrary && !children && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg border-2 border-dashed border-primary/30 p-8 text-center">
            <p className="text-sm font-medium text-primary/60">
              Drop component here
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
