/**
 * DRAMAC Studio Layer Row Component
 * 
 * Individual layer row with icons, toggles, and drag handle.
 * Created in PHASE-STUDIO-16.
 */

'use client';

import React, { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  ChevronRight, 
  ChevronDown,
  Eye, 
  EyeOff, 
  Lock, 
  Unlock,
  GripVertical,
  // Layout icons
  LayoutGrid,
  Square,
  Columns3,
  Grid3X3,
  MoveVertical,
  Minus,
  // Typography icons
  Heading,
  Type,
  FileText,
  AlignLeft,
  // Media icons
  Image,
  Video,
  Star,
  Images,
  // Interactive icons
  MousePointerClick,
  Link,
  ChevronsDownUp,
  PanelTop,
  Maximize2,
  // Marketing icons
  Sparkles,
  Megaphone,
  Quote,
  CreditCard,
  HelpCircle,
  // E-Commerce icons
  ShoppingBag,
  ShoppingCart,
  // Form icons
  FormInput,
  TextCursor,
  ChevronDown as ChevronDownIcon,
  CheckSquare,
  // Navigation icons
  Menu,
  Footprints,
  // Default
  Component,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { LayerItem } from '@/types/studio-history';

// =============================================================================
// ICON MAPPING
// =============================================================================

const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  // Layout
  LayoutGrid,
  Square,
  Columns3,
  Grid3X3,
  MoveVertical,
  Minus,
  // Typography
  Heading,
  Type,
  FileText,
  AlignLeft,
  // Media
  Image,
  Video,
  Star,
  Images,
  // Interactive
  MousePointerClick,
  Link,
  ChevronsDownUp,
  PanelTop,
  Maximize2,
  // Marketing
  Sparkles,
  Megaphone,
  Quote,
  CreditCard,
  HelpCircle,
  // E-Commerce
  ShoppingBag,
  ShoppingCart,
  // Forms
  FormInput,
  TextCursor,
  ChevronDown: ChevronDownIcon,
  CheckSquare,
  // Navigation
  Menu,
  Footprints,
  // Default
  Component,
};

// =============================================================================
// PROPS
// =============================================================================

interface LayerRowProps {
  item: LayerItem;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onToggleLock: (id: string, locked: boolean) => void;
  onToggleVisibility: (id: string, hidden: boolean) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const LayerRow = memo(function LayerRow({
  item,
  onSelect,
  onToggleExpand,
  onToggleLock,
  onToggleVisibility,
  onContextMenu,
}: LayerRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: item.isLocked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Get icon component
  const IconComponent = iconComponents[item.icon] || Component;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(item.id);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(item.id);
  };

  const handleLockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLock(item.id, !item.isLocked);
  };

  const handleVisibilityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleVisibility(item.id, !item.isHidden);
  };

  const handleContextMenuEvent = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(e, item.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center h-8 px-2 gap-1 rounded-md cursor-pointer',
        'hover:bg-accent/50 transition-colors',
        item.isSelected && 'bg-primary/10 hover:bg-primary/15 ring-1 ring-primary/30',
        item.isHidden && 'opacity-50',
        isDragging && 'opacity-50 bg-accent shadow-lg'
      )}
      onClick={handleClick}
      onContextMenu={handleContextMenuEvent}
    >
      {/* Indent based on depth */}
      <div style={{ width: item.depth * 16 }} className="shrink-0" />
      
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'shrink-0 cursor-grab active:cursor-grabbing',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          item.isLocked && 'cursor-not-allowed opacity-30'
        )}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      
      {/* Expand/Collapse button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-5 w-5 shrink-0 p-0',
          !item.hasChildren && 'invisible'
        )}
        onClick={handleExpandClick}
      >
        {item.isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </Button>
      
      {/* Component icon */}
      <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground" />
      
      {/* Label */}
      <span className={cn(
        'flex-1 text-sm truncate',
        item.isSelected && 'font-medium'
      )}>
        {item.label}
      </span>
      
      {/* Type badge (subtle) */}
      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider hidden group-hover:inline">
        {item.type}
      </span>
      
      {/* Lock toggle */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-5 w-5 shrink-0 p-0',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          item.isLocked && 'opacity-100'
        )}
        onClick={handleLockClick}
        title={item.isLocked ? 'Unlock' : 'Lock'}
      >
        {item.isLocked ? (
          <Lock className="h-3 w-3 text-amber-500" />
        ) : (
          <Unlock className="h-3 w-3 text-muted-foreground" />
        )}
      </Button>
      
      {/* Visibility toggle */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-5 w-5 shrink-0 p-0',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          item.isHidden && 'opacity-100'
        )}
        onClick={handleVisibilityClick}
        title={item.isHidden ? 'Show' : 'Hide'}
      >
        {item.isHidden ? (
          <EyeOff className="h-3 w-3 text-muted-foreground" />
        ) : (
          <Eye className="h-3 w-3 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
});
