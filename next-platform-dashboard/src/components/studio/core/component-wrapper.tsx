/**
 * DRAMAC Studio Component Wrapper
 * 
 * Wraps each component on the canvas with:
 * - Click to select
 * - Hover highlight
 * - Selection outline
 * - Component label badge
 * - Module badge for module components
 * - Placeholder for missing module components
 * - State preview indicator (PHASE-STUDIO-22)
 * - Context menu with symbol creation (PHASE-STUDIO-25)
 */

"use client";

import React, { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useSelectionStore, useUIStore, useEditorStore } from "@/lib/studio/store";
import { componentRegistry } from "@/lib/studio/registry/component-registry";
import { ModulePlaceholder } from "./module-placeholder";
import { Badge } from "@/components/ui/badge";
import { StateBadge } from "@/components/studio/features/state-selector";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { CreateSymbolDialog } from "@/components/studio/features/create-symbol-dialog";
import {
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Package,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { ComponentState } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface ComponentWrapperProps {
  componentId: string;
  componentType: string;
  children: React.ReactNode;
  locked?: boolean;
  hidden?: boolean;
  /** Optional transition settings from the component */
  transition?: {
    property: string;
    duration: number;
    easing: string;
    delay?: number;
  };
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
  transition,
}: ComponentWrapperProps) {
  // Selection state
  const selectedId = useSelectionStore((s) => s.componentId);
  const select = useSelectionStore((s) => s.select);
  const isSelected = selectedId === componentId;
  
  // Editor store for context menu actions
  const { duplicateComponent, deleteComponent, updateComponent } = useEditorStore();
  
  // State editing (PHASE-STUDIO-22)
  const editingState = useUIStore((s) => s.editingState);
  const previewingState = useUIStore((s) => s.previewingState);
  
  // Symbol dialog state (PHASE-STUDIO-25)
  const [showCreateSymbolDialog, setShowCreateSymbolDialog] = useState(false);
  
  // Determine which state to show for this component
  const displayState: ComponentState = useMemo(() => {
    // Only show non-default state for the selected component
    if (isSelected) {
      return previewingState || editingState;
    }
    return 'default';
  }, [isSelected, editingState, previewingState]);
  
  // Generate transition style for state changes
  const transitionStyle = useMemo(() => {
    if (!transition || transition.property === 'none') {
      return {};
    }
    
    let propertyValue = transition.property;
    
    // Map custom property names to CSS
    if (propertyValue === 'colors') {
      propertyValue = 'background-color, color, border-color';
    } else if (propertyValue === 'shadow') {
      propertyValue = 'box-shadow, text-shadow';
    }
    
    const delay = transition.delay ? ` ${transition.delay}ms` : '';
    
    return {
      transition: `${propertyValue} ${transition.duration}ms ${transition.easing}${delay}`,
    };
  }, [transition]);
  
  // Get component definition from registry
  const definition = componentRegistry.get(componentType);
  const label = definition?.label ?? componentType;
  const isModuleComponent = !!definition?.module;
  const isMissingComponent = !definition;
  
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
  
  // Show state indicator for non-default states
  const showStateIndicator = isSelected && displayState !== 'default';
  
  // Handle missing component (from uninstalled module)
  if (isMissingComponent) {
    return (
      <div
        className={cn(
          "studio-component-wrapper",
          isSelected && "is-selected"
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Select missing ${componentType} component`}
        aria-pressed={isSelected}
        data-component-id={componentId}
        data-component-type={componentType}
      >
        <div className="studio-component-label text-yellow-600">
          {componentType} (missing)
        </div>
        <ModulePlaceholder componentType={componentType} />
      </div>
    );
  }
  
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "studio-component-wrapper",
              isSelected && "is-selected",
              locked && "cursor-not-allowed opacity-75",
              // State-specific ring colors (PHASE-STUDIO-22)
              showStateIndicator && displayState === 'hover' && "ring-blue-500",
              showStateIndicator && displayState === 'active' && "ring-orange-500",
              showStateIndicator && displayState === 'focus' && "ring-purple-500",
            )}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            tabIndex={locked ? -1 : 0}
            role="button"
            aria-label={`Select ${label} component`}
            aria-pressed={isSelected}
            data-component-id={componentId}
            data-component-type={componentType}
            data-state={displayState}
            style={transitionStyle}
          >
            {/* Component label badge with state indicator */}
            <div className="studio-component-label flex items-center gap-1.5">
              <span>{label}</span>
              {isModuleComponent && definition?.module && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">
                  {definition.module.name}
                </Badge>
              )}
              {locked && <span className="text-muted-foreground"> (locked)</span>}
            </div>
            
            {/* State indicator badge (PHASE-STUDIO-22) */}
            {showStateIndicator && (
              <div className="absolute -top-6 right-0">
                <StateBadge state={displayState} />
              </div>
            )}
            
            {/* Actual component content */}
            {children}
          </div>
        </ContextMenuTrigger>
        
        {/* Context menu (PHASE-STUDIO-25) */}
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => duplicateComponent(componentId)}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => setShowCreateSymbolDialog(true)}>
            <Package className="h-4 w-4 mr-2" />
            Save as Symbol
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem 
            onClick={() => updateComponent(componentId, { locked: !locked })}
          >
            {locked ? (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Unlock
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Lock
              </>
            )}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => updateComponent(componentId, { hidden: true })}
          >
            <EyeOff className="h-4 w-4 mr-2" />
            Hide
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => deleteComponent(componentId)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      
      {/* Create Symbol Dialog (PHASE-STUDIO-25) */}
      <CreateSymbolDialog
        open={showCreateSymbolDialog}
        onOpenChange={setShowCreateSymbolDialog}
        componentIds={[componentId]}
        onSymbolCreated={(symbolId) => {
          console.log('Symbol created:', symbolId);
        }}
      />
    </>
  );
}
