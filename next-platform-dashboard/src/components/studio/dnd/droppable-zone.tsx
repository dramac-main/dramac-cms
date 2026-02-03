/**
 * DRAMAC Studio Droppable Zone
 * 
 * A drop zone within a component that accepts specific component types.
 * Used for nested component layouts (e.g., Section with header/content/footer zones).
 * 
 * Phase STUDIO-19: Nested Components & Zones
 */

"use client";

import React, { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Target, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/lib/studio/store/editor-store";
import { SortableComponent } from "./sortable-component";
import { createZoneId } from "@/types/studio";
import type { ZoneDefinition, StudioComponent } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface DroppableZoneProps {
  /** Parent component ID */
  parentId: string;
  /** Zone name */
  zoneName: string;
  /** Zone definition */
  zoneDef: ZoneDefinition;
  /** Optional className */
  className?: string;
  /** Render function for child components */
  renderComponent?: (component: StudioComponent) => React.ReactNode;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DroppableZone({
  parentId,
  zoneName,
  zoneDef,
  className,
  renderComponent,
}: DroppableZoneProps) {
  const zoneId = createZoneId(parentId, zoneName);
  const getZoneComponents = useEditorStore((state) => state.getZoneComponents);
  const canDropInZone = useEditorStore((state) => state.canDropInZone);
  
  const components = useMemo(
    () => getZoneComponents(zoneId),
    [getZoneComponents, zoneId]
  );
  
  const { setNodeRef, isOver, active } = useDroppable({
    id: zoneId,
    data: {
      type: "zone",
      zone: zoneId,
      parentId,
      zoneName,
      zoneDef,
      allowedComponents: zoneDef.allowedComponents,
    },
  });
  
  // Check if the dragged component can be dropped here
  const draggedType = active?.data?.current?.componentType 
    ?? active?.data?.current?.type;
  const canDrop = draggedType ? canDropInZone(draggedType, zoneId, zoneDef) : true;
  const isActive = isOver && active;
  
  const isEmpty = components.length === 0;
  const isAtMax = zoneDef.maxChildren 
    ? components.length >= zoneDef.maxChildren 
    : false;
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative transition-all duration-200",
        "min-h-[60px] rounded-md",
        // Base styles
        "border-2 border-dashed",
        isEmpty && !isActive && "border-muted-foreground/20 bg-muted/5",
        // Hover styles when dragging
        isActive && canDrop && "border-primary bg-primary/5",
        isActive && !canDrop && "border-destructive/50 bg-destructive/5",
        // At max capacity
        isAtMax && "opacity-50",
        zoneDef.className,
        className
      )}
      data-zone={zoneId}
      data-zone-name={zoneName}
    >
      {/* Zone header (visible when empty) */}
      {isEmpty && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded text-xs",
            isActive && !canDrop && "text-destructive"
          )}>
            {isActive && !canDrop ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Target className="h-3 w-3" />
            )}
            <span className="font-medium">{zoneDef.label}</span>
          </div>
          
          <p className="text-xs text-muted-foreground text-center px-4">
            {isActive && !canDrop 
              ? `${draggedType} not allowed here`
              : zoneDef.placeholder || `Drop ${zoneDef.allowedComponents?.join(", ") || "components"} here`
            }
          </p>
          
          {zoneDef.allowedComponents && (
            <p className="text-[10px] text-muted-foreground/70">
              Accepts: {zoneDef.allowedComponents.join(", ")}
            </p>
          )}
        </div>
      )}
      
      {/* Zone content */}
      {!isEmpty && (
        <SortableContext
          items={components.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="p-2 space-y-2">
            {components.map((component, index) => (
              <SortableComponent
                key={component.id}
                id={component.id}
                componentType={component.type}
                parentId={parentId}
                index={index}
              >
                {renderComponent ? (
                  renderComponent(component)
                ) : (
                  <div className="p-2 bg-muted/50 rounded text-sm">
                    {component.type}
                  </div>
                )}
              </SortableComponent>
            ))}
          </div>
        </SortableContext>
      )}
      
      {/* Zone label badge (always visible when has content) */}
      {!isEmpty && (
        <div className="absolute -top-2.5 left-2 px-1.5 py-0.5 bg-background border rounded text-[10px] text-muted-foreground font-medium">
          {zoneDef.label}
          {zoneDef.maxChildren && (
            <span className="ml-1 text-muted-foreground/70">
              ({components.length}/{zoneDef.maxChildren})
            </span>
          )}
        </div>
      )}
      
      {/* Drop indicator */}
      {isActive && canDrop && (
        <div className="absolute inset-0 border-2 border-primary rounded-md pointer-events-none animate-pulse" />
      )}
    </div>
  );
}
