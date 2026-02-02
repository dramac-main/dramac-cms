/**
 * DRAMAC Studio Component Wrapper
 * 
 * Wraps each component on the canvas with:
 * - Click to select
 * - Hover highlight
 * - Selection outline
 * - Component label badge
 */

"use client";

import React, { useCallback } from "react";
import { cn } from "@/lib/utils";
import { useSelectionStore } from "@/lib/studio/store";
import { componentRegistry } from "@/lib/studio/registry/component-registry";

// =============================================================================
// TYPES
// =============================================================================

interface ComponentWrapperProps {
  componentId: string;
  componentType: string;
  children: React.ReactNode;
  locked?: boolean;
  hidden?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ComponentWrapper({
  componentId,
  componentType,
  children,
  locked = false,
  hidden = false,
}: ComponentWrapperProps) {
  // Selection state
  const selectedId = useSelectionStore((s) => s.componentId);
  const select = useSelectionStore((s) => s.select);
  const isSelected = selectedId === componentId;
  
  // Get component label from registry
  const definition = componentRegistry.get(componentType);
  const label = definition?.label ?? componentType;
  
  // Handle click to select
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't select if locked
      if (locked) return;
      
      // Stop propagation to prevent parent selection
      e.stopPropagation();
      
      // Select this component
      select(componentId);
    },
    [componentId, locked, select]
  );
  
  // Handle keyboard selection
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (locked) return;
      
      // Select on Enter or Space
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        select(componentId);
      }
    },
    [componentId, locked, select]
  );
  
  // Don't render if hidden
  if (hidden) {
    return null;
  }
  
  return (
    <div
      className={cn(
        "studio-component-wrapper",
        isSelected && "is-selected",
        locked && "cursor-not-allowed opacity-75"
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={locked ? -1 : 0}
      role="button"
      aria-label={`Select ${label} component`}
      aria-pressed={isSelected}
      data-component-id={componentId}
      data-component-type={componentType}
    >
      {/* Component label badge */}
      <div className="studio-component-label">
        {label}
        {locked && " (locked)"}
      </div>
      
      {/* Actual component content */}
      {children}
    </div>
  );
}
