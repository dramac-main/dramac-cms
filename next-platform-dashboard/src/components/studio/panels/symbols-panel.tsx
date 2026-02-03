/**
 * Symbols Panel
 * 
 * Panel for browsing and managing reusable component symbols.
 * Displays symbols by category with search, drag-to-canvas, and management options.
 * 
 * Phase: STUDIO-25 Symbols & Reusable Components
 */

'use client';

import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  Package,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  Globe,
  GripVertical,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSymbolStore, useFilteredSymbols } from '@/lib/studio/store/symbol-store';
import { useEditorStore } from '@/lib/studio/store/editor-store';
import { DEFAULT_SYMBOL_CATEGORIES, type StudioSymbol } from '@/types/studio-symbols';

// =============================================================================
// TYPES
// =============================================================================

interface SymbolsPanelProps {
  className?: string;
}

// =============================================================================
// DRAGGABLE SYMBOL ITEM
// =============================================================================

interface DraggableSymbolItemProps {
  symbol: StudioSymbol;
  onEdit?: (symbolId: string) => void;
  onDuplicate?: (symbolId: string) => void;
  onDelete?: (symbolId: string) => void;
}

function DraggableSymbolItem({
  symbol,
  onEdit,
  onDuplicate,
  onDelete,
}: DraggableSymbolItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `symbol-${symbol.id}`,
    data: {
      type: 'symbol',
      symbolId: symbol.id,
      symbol,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'group flex items-center gap-2 rounded-md border bg-card p-2 transition-colors',
        isDragging ? 'opacity-50 border-primary' : 'hover:border-muted-foreground/30'
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Symbol info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate">{symbol.name}</span>
          {symbol.isGlobal && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Globe className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>Global symbol</TooltipContent>
            </Tooltip>
          )}
        </div>
        {symbol.description && (
          <p className="text-xs text-muted-foreground truncate">
            {symbol.description}
          </p>
        )}
        {symbol.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {symbol.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0">
                {tag}
              </Badge>
            ))}
            {symbol.tags.length > 2 && (
              <span className="text-[10px] text-muted-foreground">
                +{symbol.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit?.(symbol.id)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDuplicate?.(symbol.id)}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete?.(symbol.id)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SymbolsPanel({ className }: SymbolsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteSymbolId, setDeleteSymbolId] = useState<string | null>(null);

  // Store hooks
  const { symbols, deleteSymbol, duplicateSymbol, setSearchQuery: setStoreSearchQuery } = useSymbolStore();
  const { insertComponents } = useEditorStore();

  // Filter symbols by search
  const filteredSymbols = useMemo(() => {
    if (!searchQuery.trim()) return symbols;

    const query = searchQuery.toLowerCase();
    return symbols.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [symbols, searchQuery]);

  // Group symbols by category
  const symbolsByCategory = useMemo(() => {
    const grouped = new Map<string, StudioSymbol[]>();

    for (const symbol of filteredSymbols) {
      const category = symbol.category || 'custom';
      const existing = grouped.get(category) || [];
      grouped.set(category, [...existing, symbol]);
    }

    return grouped;
  }, [filteredSymbols]);

  // Get categories with symbols
  const categoriesWithSymbols = useMemo(() => {
    return DEFAULT_SYMBOL_CATEGORIES.filter(
      (cat) => symbolsByCategory.has(cat.id) && (symbolsByCategory.get(cat.id)?.length ?? 0) > 0
    );
  }, [symbolsByCategory]);

  // Handlers
  const handleEdit = useCallback((symbolId: string) => {
    // TODO: Open symbol editor
    console.log('Edit symbol:', symbolId);
  }, []);

  const handleDuplicate = useCallback(
    (symbolId: string) => {
      const symbol = symbols.find((s) => s.id === symbolId);
      if (symbol) {
        duplicateSymbol(symbolId, `${symbol.name} (Copy)`);
      }
    },
    [symbols, duplicateSymbol]
  );

  const handleDelete = useCallback((symbolId: string) => {
    setDeleteSymbolId(symbolId);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteSymbolId) {
      deleteSymbol(deleteSymbolId);
      setDeleteSymbolId(null);
    }
  }, [deleteSymbolId, deleteSymbol]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b">
        <Package className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">Symbols</span>
        <Badge variant="secondary" className="ml-auto">
          {symbols.length}
        </Badge>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search symbols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Symbol list */}
      <ScrollArea className="flex-1">
        <div className="px-3 pb-3">
          {filteredSymbols.length === 0 ? (
            <EmptyState hasSymbols={symbols.length > 0} searchQuery={searchQuery} />
          ) : (
            <Accordion type="multiple" defaultValue={categoriesWithSymbols.map((c) => c.id)}>
              {categoriesWithSymbols.map((category) => {
                const categorySymbols = symbolsByCategory.get(category.id) || [];
                return (
                  <AccordionItem key={category.id} value={category.id}>
                    <AccordionTrigger className="text-sm py-2">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        {category.label}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {categorySymbols.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-1">
                        {categorySymbols.map((symbol) => (
                          <DraggableSymbolItem
                            key={symbol.id}
                            symbol={symbol}
                            onEdit={handleEdit}
                            onDuplicate={handleDuplicate}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      </ScrollArea>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteSymbolId} onOpenChange={() => setDeleteSymbolId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Symbol</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this symbol? Existing instances on pages will not be affected, but they will become detached.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

interface EmptyStateProps {
  hasSymbols: boolean;
  searchQuery: string;
}

function EmptyState({ hasSymbols, searchQuery }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
      <h4 className="font-medium text-sm">
        {hasSymbols ? 'No matches found' : 'No symbols yet'}
      </h4>
      <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
        {hasSymbols
          ? `No symbols match "${searchQuery}"`
          : 'Right-click any component and select "Save as Symbol" to create reusable components.'}
      </p>
    </div>
  );
}

export default SymbolsPanel;
