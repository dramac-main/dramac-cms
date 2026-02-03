/**
 * DRAMAC Studio Layer Context Menu
 * 
 * Right-click menu for layer actions.
 * Created in PHASE-STUDIO-16.
 */

'use client';

import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Clipboard,
} from 'lucide-react';
import { useEditorStore, useSelectionStore } from '@/lib/studio/store';
import { toast } from 'sonner';

// =============================================================================
// PROPS
// =============================================================================

interface LayerContextMenuProps {
  componentId: string;
  isLocked: boolean;
  isHidden: boolean;
  children: React.ReactNode;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function LayerContextMenu({
  componentId,
  isLocked,
  isHidden,
  children,
}: LayerContextMenuProps) {
  const data = useEditorStore((s) => s.data);
  const duplicateComponent = useEditorStore((s) => s.duplicateComponent);
  const deleteComponent = useEditorStore((s) => s.deleteComponent);
  const updateComponent = useEditorStore((s) => s.updateComponent);
  const moveComponent = useEditorStore((s) => s.moveComponent);
  const select = useSelectionStore((s) => s.select);

  const component = data.components[componentId];
  if (!component) return <>{children}</>;

  // Get siblings for move up/down
  const getSiblings = (): string[] => {
    if (component.parentId) {
      const parent = data.components[component.parentId];
      return parent?.children || [];
    }
    return data.root.children;
  };

  const handleDuplicate = () => {
    if (isLocked) {
      toast.error('Cannot duplicate locked component');
      return;
    }
    const newId = duplicateComponent(componentId);
    if (newId) {
      select(newId);
      toast.success('Component duplicated');
    }
  };

  const handleDelete = () => {
    if (isLocked) {
      toast.error('Cannot delete locked component');
      return;
    }
    deleteComponent(componentId);
    toast.success('Component deleted');
  };

  const handleToggleLock = () => {
    updateComponent(componentId, { locked: !isLocked });
    toast.success(isLocked ? 'Component unlocked' : 'Component locked');
  };

  const handleToggleVisibility = () => {
    updateComponent(componentId, { hidden: !isHidden });
    toast.success(isHidden ? 'Component shown' : 'Component hidden');
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(componentId);
    toast.success('Component ID copied');
  };

  const handleMoveUp = () => {
    if (isLocked) {
      toast.error('Cannot move locked component');
      return;
    }
    
    const siblings = getSiblings();
    const currentIndex = siblings.indexOf(componentId);
    
    if (currentIndex > 0) {
      const parentId = component.parentId || 'root';
      moveComponent(componentId, parentId, currentIndex - 1, component.zoneId);
    }
  };

  const handleMoveDown = () => {
    if (isLocked) {
      toast.error('Cannot move locked component');
      return;
    }
    
    const siblings = getSiblings();
    const currentIndex = siblings.indexOf(componentId);
    
    if (currentIndex < siblings.length - 1) {
      const parentId = component.parentId || 'root';
      // Move to index + 2 because after removal, indices shift
      moveComponent(componentId, parentId, currentIndex + 1, component.zoneId);
    }
  };

  const siblings = getSiblings();
  const currentIndex = siblings.indexOf(componentId);
  const canMoveUp = currentIndex > 0;
  const canMoveDown = currentIndex < siblings.length - 1;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={handleDuplicate} disabled={isLocked}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={handleDelete} 
          disabled={isLocked}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={handleToggleLock}>
          {isLocked ? (
            <>
              <Unlock className="mr-2 h-4 w-4" />
              Unlock
              <ContextMenuShortcut>⌘L</ContextMenuShortcut>
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Lock
              <ContextMenuShortcut>⌘L</ContextMenuShortcut>
            </>
          )}
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleToggleVisibility}>
          {isHidden ? (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Show
              <ContextMenuShortcut>⌘H</ContextMenuShortcut>
            </>
          ) : (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Hide
              <ContextMenuShortcut>⌘H</ContextMenuShortcut>
            </>
          )}
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={handleMoveUp} disabled={isLocked || !canMoveUp}>
          <ArrowUp className="mr-2 h-4 w-4" />
          Move Up
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleMoveDown} disabled={isLocked || !canMoveDown}>
          <ArrowDown className="mr-2 h-4 w-4" />
          Move Down
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={handleCopyId}>
          <Clipboard className="mr-2 h-4 w-4" />
          Copy ID
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
