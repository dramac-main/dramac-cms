/**
 * DRAMAC Studio Draggable Component
 *
 * Wraps component library items to make them draggable.
 * Uses HTML5 native Drag and Drop API for cross-iframe compatibility.
 *
 * The library panel lives in the parent document while the canvas is inside
 * an iframe. HTML5 drag events naturally cross iframe boundaries, so library
 * items can be dragged directly into the canvas iframe.
 *
 * Data is transferred via dataTransfer.setData("application/studio-component", ...)
 * and caught by CanvasContent's HTML5 drop handler inside the iframe.
 */

"use client";

import React, { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/studio/store";

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
  const [isDragging, setIsDragging] = useState(false);
  const setDragging = useUIStore((s) => s.setDragging);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (disabled) {
        e.preventDefault();
        return;
      }

      // Set transfer data for the iframe's HTML5 drop handler
      const payload = JSON.stringify({
        componentType: type,
        label,
        icon,
      });
      e.dataTransfer.setData("application/studio-component", payload);
      e.dataTransfer.effectAllowed = "copy";

      setIsDragging(true);
      setDragging(true, type);
    },
    [type, label, icon, disabled, setDragging]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragging(false, null);
  }, [setDragging]);

  return (
    <div
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      {children}
    </div>
  );
}
