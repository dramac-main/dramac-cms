/**
 * DRAMAC Studio DnD Provider
 * 
 * Wraps the editor with drag-and-drop context.
 * Handles drag start, drag end, and provides collision detection.
 */

"use client";

import React, { useCallback, useState } from "react";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCenter,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
  UniqueIdentifier,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useEditorStore, useUIStore, useSelectionStore } from "@/lib/studio/store";
import { componentRegistry } from "@/lib/studio/registry/component-registry";
import { DragOverlayContent } from "./drag-overlay";
import type { DragData, LibraryDragData, CanvasDragData } from "@/types/studio";

// =============================================================================
// COLLISION DETECTION
// =============================================================================

/**
 * Custom collision detection that prioritizes sortable items,
 * then falls back to canvas drop zone
 */
const customCollisionDetection: CollisionDetection = (args) => {
  // First, try closest center for sortable items
  const closestCenterCollisions = closestCenter(args);
  if (closestCenterCollisions.length > 0) {
    return closestCenterCollisions;
  }
  
  // Fall back to pointer within for the canvas container
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  
  // Last resort: rect intersection
  return rectIntersection(args);
};

// =============================================================================
// TYPES
// =============================================================================

interface DndProviderProps {
  children: React.ReactNode;
}

interface ActiveDragState {
  id: UniqueIdentifier;
  data: DragData;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DndProvider({ children }: DndProviderProps) {
  // Stores
  const addComponent = useEditorStore((s) => s.addComponent);
  const moveComponent = useEditorStore((s) => s.moveComponent);
  const data = useEditorStore((s) => s.data);
  const setDragging = useUIStore((s) => s.setDragging);
  const selectComponent = useSelectionStore((s) => s.select);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  
  // Local state
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);
  const [, setOverId] = useState<UniqueIdentifier | null>(null);
  
  // =============================================================================
  // SENSORS
  // =============================================================================
  
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require 8px movement before starting drag
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      // Require 8px movement and 250ms delay on touch
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // =============================================================================
  // HANDLERS
  // =============================================================================
  
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const dragData = active.data.current as DragData;
    
    setActiveDrag({
      id: active.id,
      data: dragData,
    });
    
    // Update UI store
    if (dragData.source === "library") {
      setDragging(true, dragData.componentType);
    } else {
      setDragging(true, dragData.componentType);
    }
    
    // Clear selection when starting to drag
    clearSelection();
  }, [setDragging, clearSelection]);
  
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id ?? null);
  }, []);
  
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    // Reset state
    setActiveDrag(null);
    setOverId(null);
    setDragging(false, null);
    
    // No drop target
    if (!over) return;
    
    const dragData = active.data.current as DragData;
    
    // ==========================================================================
    // HANDLE LIBRARY DROP (Add new component)
    // ==========================================================================
    
    if (dragData.source === "library") {
      const { componentType } = dragData as LibraryDragData;
      
      // Get component definition for default props
      const definition = componentRegistry.get(componentType);
      if (!definition) {
        console.error(`[DnD] Unknown component type: ${componentType}`);
        return;
      }
      
      // Get default props
      const defaultProps = componentRegistry.getDefaultProps(componentType);
      
      // Determine drop location
      let parentId = "root";
      let index = data.root.children.length; // Default to end
      
      // If dropped on a specific component, insert after it
      const overId = over.id.toString();
      if (overId !== "canvas-drop-zone" && overId !== "root") {
        // Check if over a container component
        const overComponent = data.components[overId];
        if (overComponent) {
          const overDefinition = componentRegistry.get(overComponent.type);
          
          if (overDefinition?.acceptsChildren || overDefinition?.isContainer) {
            // Drop inside the container
            parentId = overId;
            index = overComponent.children?.length ?? 0;
          } else {
            // Drop after this component
            parentId = overComponent.parentId ?? "root";
            const siblings = overComponent.parentId
              ? data.components[overComponent.parentId]?.children ?? []
              : data.root.children;
            index = siblings.indexOf(overId) + 1;
          }
        }
      }
      
      // Add the component
      const newId = addComponent(componentType, defaultProps, parentId, index);
      
      // Select the new component
      selectComponent(newId);
      
      // Emit custom event for recently used tracking
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("studio:component-dropped", {
          detail: { type: componentType }
        }));
      }
      
      console.debug(`[DnD] Added ${componentType} to ${parentId} at index ${index}`);
      return;
    }
    
    // ==========================================================================
    // HANDLE CANVAS REORDER (Move existing component)
    // ==========================================================================
    
    if (dragData.source === "canvas") {
      const { componentId, parentId: oldParentId } = dragData as CanvasDragData;
      
      // Same position - no change
      if (active.id === over.id) return;
      
      const overId = over.id.toString();
      
      // Determine new position
      let newParentId = "root";
      let newIndex = 0;
      
      if (overId === "canvas-drop-zone" || overId === "root") {
        // Dropped at end of canvas
        newParentId = "root";
        newIndex = data.root.children.length;
      } else {
        // Dropped on/near another component
        const overComponent = data.components[overId];
        if (overComponent) {
          const overDefinition = componentRegistry.get(overComponent.type);
          
          if (overDefinition?.acceptsChildren || overDefinition?.isContainer) {
            // Drop inside container
            newParentId = overId;
            newIndex = overComponent.children?.length ?? 0;
          } else {
            // Drop as sibling (after)
            newParentId = overComponent.parentId ?? "root";
            const siblings = overComponent.parentId
              ? data.components[overComponent.parentId]?.children ?? []
              : data.root.children;
            newIndex = siblings.indexOf(overId) + 1;
            
            // Adjust index if moving within same parent
            if (oldParentId === newParentId) {
              const oldIndex = siblings.indexOf(componentId);
              if (oldIndex < newIndex) {
                newIndex -= 1;
              }
            }
          }
        }
      }
      
      // Move the component
      moveComponent(componentId, newParentId, newIndex);
      
      // Select the moved component
      selectComponent(componentId);
      
      console.debug(`[DnD] Moved ${componentId} to ${newParentId} at index ${newIndex}`);
    }
  }, [data, addComponent, moveComponent, selectComponent, setDragging]);
  
  const handleDragCancel = useCallback(() => {
    setActiveDrag(null);
    setOverId(null);
    setDragging(false, null);
  }, [setDragging]);
  
  // =============================================================================
  // RENDER
  // =============================================================================
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      
      {/* Drag Overlay - shows preview while dragging */}
      <DragOverlay dropAnimation={null}>
        {activeDrag && (
          <DragOverlayContent data={activeDrag.data} />
        )}
      </DragOverlay>
    </DndContext>
  );
}
