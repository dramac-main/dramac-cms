/**
 * DRAMAC Studio Layers Panel
 * 
 * Main layers panel with tree view, search, and bulk actions.
 * Created in PHASE-STUDIO-16.
 */

'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Search, Eye, Unlock, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useEditorStore, useSelectionStore } from '@/lib/studio/store';
import { 
  buildLayerTree, 
  flattenLayerTree, 
  filterLayers,
  getAllLayerIds,
} from '@/lib/studio/utils/layer-utils';
import { LayerRow } from './layer-row';
import { LayerContextMenu } from './layer-context-menu';
import { toast } from 'sonner';

// =============================================================================
// COMPONENT
// =============================================================================

export function LayersPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  
  const data = useEditorStore((s) => s.data);
  const updateComponent = useEditorStore((s) => s.updateComponent);
  const moveComponent = useEditorStore((s) => s.moveComponent);
  
  const selectedId = useSelectionStore((s) => s.componentId);
  const select = useSelectionStore((s) => s.select);
  const clearSelection = useSelectionStore((s) => s.clearSelection);

  // Build tree structure
  const layerTree = useMemo(() => {
    return buildLayerTree(data, selectedId, expandedLayers);
  }, [data, selectedId, expandedLayers]);

  // Filter tree if searching
  const filteredTree = useMemo(() => {
    return filterLayers(layerTree, searchQuery);
  }, [layerTree, searchQuery]);

  // Flatten for rendering (respecting collapsed state)
  const flatLayers = useMemo(() => {
    const searchExpanded = searchQuery 
      ? new Set(getAllLayerIds(data)) // Expand all when searching
      : expandedLayers;
    return flattenLayerTree(filteredTree, searchExpanded);
  }, [filteredTree, expandedLayers, searchQuery, data]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null);
    
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    const activeComp = data.components[activeId];
    const overComp = data.components[overId];
    
    if (!activeComp || !overComp) return;
    if (activeComp.locked) {
      toast.error('Cannot move locked component');
      return;
    }
    
    // Get the target's parent and calculate new index
    const overParentId = overComp.parentId || 'root';
    const overSiblings = overParentId === 'root' 
      ? data.root.children 
      : data.components[overParentId]?.children || [];
    
    const overIndex = overSiblings.indexOf(overId);
    
    // Move after the target
    moveComponent(activeId, overParentId, overIndex + 1, overComp.zoneId);
  }, [data, moveComponent]);

  const handleSelect = useCallback((id: string) => {
    const component = data.components[id];
    if (component?.hidden) {
      toast.info('Component is hidden. Show it to select on canvas.');
    }
    select(id);
  }, [data.components, select]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedLayers(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleLock = useCallback((id: string, locked: boolean) => {
    updateComponent(id, { locked });
    toast.success(locked ? 'Component locked' : 'Component unlocked');
  }, [updateComponent]);

  const handleToggleVisibility = useCallback((id: string, hidden: boolean) => {
    updateComponent(id, { hidden });
    if (hidden && id === selectedId) {
      clearSelection();
    }
    toast.success(hidden ? 'Component hidden' : 'Component shown');
  }, [updateComponent, selectedId, clearSelection]);

  const handleContextMenu = useCallback((_e: React.MouseEvent, id: string) => {
    select(id);
  }, [select]);

  // Bulk actions
  const handleExpandAll = useCallback(() => {
    const allIds = getAllLayerIds(data);
    setExpandedLayers(new Set(allIds));
  }, [data]);

  const handleCollapseAll = useCallback(() => {
    setExpandedLayers(new Set());
  }, []);

  const handleShowAll = useCallback(() => {
    Object.keys(data.components).forEach(id => {
      const comp = data.components[id];
      if (comp?.hidden) {
        updateComponent(id, { hidden: false });
      }
    });
    toast.success('All components shown');
  }, [data.components, updateComponent]);

  const handleUnlockAll = useCallback(() => {
    Object.keys(data.components).forEach(id => {
      const comp = data.components[id];
      if (comp?.locked) {
        updateComponent(id, { locked: false });
      }
    });
    toast.success('All components unlocked');
  }, [data.components, updateComponent]);

  const componentCount = Object.keys(data.components).length;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Layers</span>
          <span className="text-xs text-muted-foreground">
            ({componentCount})
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={handleExpandAll}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Expand All</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={handleCollapseAll}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Collapse All</TooltipContent>
            </Tooltip>
            
            <Separator orientation="vertical" className="h-4 mx-1" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={handleShowAll}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Show All</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={handleUnlockAll}
                >
                  <Unlock className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Unlock All</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Search */}
      <div className="px-3 py-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            className="pl-8 h-8"
          />
        </div>
      </div>
      
      {/* Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {flatLayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              {searchQuery ? (
                <>
                  <Search className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No components match &quot;{searchQuery}&quot;</p>
                </>
              ) : (
                <>
                  <Layers className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No components on page</p>
                  <p className="text-xs mt-1">Drag components from the library</p>
                </>
              )}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={flatLayers.map(l => l.id)}
                strategy={verticalListSortingStrategy}
              >
                {flatLayers.map((item) => (
                  <LayerContextMenu
                    key={item.id}
                    componentId={item.id}
                    isLocked={item.isLocked}
                    isHidden={item.isHidden}
                  >
                    <div>
                      <LayerRow
                        item={item}
                        onSelect={handleSelect}
                        onToggleExpand={handleToggleExpand}
                        onToggleLock={handleToggleLock}
                        onToggleVisibility={handleToggleVisibility}
                        onContextMenu={handleContextMenu}
                      />
                    </div>
                  </LayerContextMenu>
                ))}
              </SortableContext>
              
              <DragOverlay>
                {activeDragId && (
                  <div className="bg-background border rounded-md shadow-lg px-3 py-2 text-sm">
                    {data.components[activeDragId]?.type || 'Component'}
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
