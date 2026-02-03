/**
 * DRAMAC Studio Virtualized Component List
 * 
 * High-performance list rendering using @tanstack/react-virtual.
 * Only renders visible components for better performance with large component trees.
 * 
 * @phase STUDIO-21
 */

"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";
import { GripVertical, ChevronRight, ChevronDown, Eye, EyeOff, Lock, Unlock } from "lucide-react";
import type { StudioComponent } from "@/types/studio";
import { useSelectionStore } from "@/lib/studio/store";

// =============================================================================
// TYPES
// =============================================================================

export interface VirtualizedComponentListProps {
  /** Components to render */
  components: StudioComponent[];
  /** Threshold for enabling virtualization (default: 30) */
  virtualizationThreshold?: number;
  /** Height of each row (default: 36) */
  rowHeight?: number;
  /** Maximum height of the list container */
  maxHeight?: number;
  /** Called when a component is clicked */
  onSelect?: (id: string) => void;
  /** Called when a component's visibility is toggled */
  onToggleVisibility?: (id: string, visible: boolean) => void;
  /** Called when a component's lock is toggled */
  onToggleLock?: (id: string, locked: boolean) => void;
  /** Enable drag handle */
  showDragHandle?: boolean;
  /** Enable visibility toggle */
  showVisibilityToggle?: boolean;
  /** Enable lock toggle */
  showLockToggle?: boolean;
  /** Custom class name */
  className?: string;
}

interface FlattenedItem {
  component: StudioComponent;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Flatten component tree for virtualized rendering
 */
function flattenComponents(
  components: StudioComponent[],
  expandedIds: Set<string>,
  parentId: string | null = null,
  depth: number = 0
): FlattenedItem[] {
  const items: FlattenedItem[] = [];
  const children = components.filter((c) => c.parentId === parentId);

  for (const component of children) {
    const componentChildren = components.filter((c) => c.parentId === component.id);
    const hasChildren = componentChildren.length > 0;
    const isExpanded = expandedIds.has(component.id);

    items.push({
      component,
      depth,
      hasChildren,
      isExpanded,
    });

    if (hasChildren && isExpanded) {
      items.push(...flattenComponents(components, expandedIds, component.id, depth + 1));
    }
  }

  return items;
}

// =============================================================================
// ROW COMPONENT
// =============================================================================

interface ComponentRowProps {
  item: FlattenedItem;
  isSelected: boolean;
  isHovered: boolean;
  rowHeight: number;
  showDragHandle: boolean;
  showVisibilityToggle: boolean;
  showLockToggle: boolean;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onToggleVisibility?: (id: string, visible: boolean) => void;
  onToggleLock?: (id: string, locked: boolean) => void;
  onHover: (id: string | null) => void;
}

const ComponentRow = React.memo(function ComponentRow({
  item,
  isSelected,
  isHovered,
  rowHeight,
  showDragHandle,
  showVisibilityToggle,
  showLockToggle,
  onSelect,
  onToggleExpand,
  onToggleVisibility,
  onToggleLock,
  onHover,
}: ComponentRowProps) {
  const { component, depth, hasChildren, isExpanded } = item;
  const isVisible = component.props?.hidden !== true;
  const isLocked = component.props?.locked === true;

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 border-b border-border/50 cursor-pointer transition-colors",
        isSelected && "bg-primary/10 border-primary/30",
        isHovered && !isSelected && "bg-muted/50",
        !isVisible && "opacity-50"
      )}
      style={{ 
        height: rowHeight,
        paddingLeft: `${depth * 16 + 8}px`,
      }}
      onClick={() => onSelect(component.id)}
      onMouseEnter={() => onHover(component.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Drag Handle */}
      {showDragHandle && (
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 cursor-grab flex-shrink-0" />
      )}

      {/* Expand/Collapse Button */}
      {hasChildren ? (
        <button
          className="p-0.5 hover:bg-muted rounded flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(component.id);
          }}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      ) : (
        <div className="w-4" />
      )}

      {/* Component Label */}
      <span className="flex-1 truncate text-sm font-medium">
        {String(component.props?.label ?? component.type)}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {showVisibilityToggle && (
          <button
            className="p-1 hover:bg-muted rounded"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility?.(component.id, !isVisible);
            }}
          >
            {isVisible ? (
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        )}
        {showLockToggle && (
          <button
            className="p-1 hover:bg-muted rounded"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock?.(component.id, !isLocked);
            }}
          >
            {isLocked ? (
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        )}
      </div>
    </div>
  );
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function VirtualizedComponentList({
  components,
  virtualizationThreshold = 30,
  rowHeight = 36,
  maxHeight = 400,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  showDragHandle = true,
  showVisibilityToggle = false,
  showLockToggle = false,
  className,
}: VirtualizedComponentListProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  // Track hover state locally since store doesn't have hoveredId
  const [localHoveredId, setLocalHoveredId] = React.useState<string | null>(null);

  // Get selection state - use componentIds from store
  const componentIds = useSelectionStore((s) => s.componentIds);
  const select = useSelectionStore((s) => s.select);

  // Flatten the tree for display
  const flatItems = React.useMemo(
    () => flattenComponents(components, expandedIds),
    [components, expandedIds]
  );

  const shouldVirtualize = flatItems.length > virtualizationThreshold;

  // Setup virtualizer
  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  // Handlers
  const handleSelect = React.useCallback(
    (id: string) => {
      select(id);
      onSelect?.(id);
    },
    [select, onSelect]
  );

  const handleToggleExpand = React.useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleHover = React.useCallback(
    (id: string | null) => {
      setLocalHoveredId(id);
    },
    []
  );

  // Empty state
  if (flatItems.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-32 text-muted-foreground text-sm", className)}>
        No components
      </div>
    );
  }

  // Non-virtualized rendering for small lists
  if (!shouldVirtualize) {
    return (
      <div className={cn("overflow-auto group", className)} style={{ maxHeight }}>
        {flatItems.map((item) => (
          <ComponentRow
            key={item.component.id}
            item={item}
            isSelected={componentIds.includes(item.component.id)}
            isHovered={localHoveredId === item.component.id}
            rowHeight={rowHeight}
            showDragHandle={showDragHandle}
            showVisibilityToggle={showVisibilityToggle}
            showLockToggle={showLockToggle}
            onSelect={handleSelect}
            onToggleExpand={handleToggleExpand}
            onToggleVisibility={onToggleVisibility}
            onToggleLock={onToggleLock}
            onHover={handleHover}
          />
        ))}
      </div>
    );
  }

  // Virtualized rendering for large lists
  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto group", className)}
      style={{ maxHeight }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = flatItems[virtualRow.index];
          return (
            <div
              key={item.component.id}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <ComponentRow
                item={item}
                isSelected={componentIds.includes(item.component.id)}
                isHovered={localHoveredId === item.component.id}
                rowHeight={rowHeight}
                showDragHandle={showDragHandle}
                showVisibilityToggle={showVisibilityToggle}
                showLockToggle={showLockToggle}
                onSelect={handleSelect}
                onToggleExpand={handleToggleExpand}
                onToggleVisibility={onToggleVisibility}
                onToggleLock={onToggleLock}
                onHover={handleHover}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VirtualizedComponentList;
