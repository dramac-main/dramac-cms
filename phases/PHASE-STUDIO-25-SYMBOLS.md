# PHASE-STUDIO-25: Symbols (Reusable Components)

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-25 |
| Title | Symbols (Reusable Components) |
| Priority | Medium |
| Estimated Time | 14-18 hours |
| Dependencies | STUDIO-01 through STUDIO-24 (Waves 1-7 + Templates) |
| Risk Level | Medium |

## Problem Statement

Users often create similar components across multiple pages (headers, footers, cards, etc.). Currently, they must:
1. Duplicate components manually (tedious)
2. Update each instance separately when changes are needed (error-prone)
3. Maintain consistency across pages manually (difficult)

A Symbol system solves this by allowing users to:
- Save any component as a reusable "Symbol"
- Insert Symbol instances anywhere
- Edit the source Symbol to update ALL instances automatically
- Override specific properties on individual instances when needed
- Unlink instances to make them fully independent

This mirrors the "Components" feature in Figma and "Symbols" in Sketch/Webflow.

## Goals

- [ ] Create Symbol data structure with source and instance types
- [ ] Build Symbol creation flow (right-click → "Save as Symbol")
- [ ] Implement Symbols panel for browsing and inserting
- [ ] Enable Symbol instance rendering with visual indicator
- [ ] Support property overrides on instances
- [ ] Enable unlinking instances from source
- [ ] Propagate source edits to all linked instances
- [ ] Store Symbols per-site in database

## Technical Approach

### Symbol Architecture

```
Symbol System
├── Data Layer
│   ├── StudioSymbol (source definition)
│   ├── SymbolInstance (extends StudioComponent)
│   └── Symbol overrides tracking
├── Store Layer (symbol-store.ts)
│   ├── CRUD operations for symbols
│   ├── Instance management
│   └── Update propagation
├── UI Layer
│   ├── Create Symbol dialog
│   ├── Symbols panel
│   ├── Instance wrapper with indicator
│   └── Override management in properties
└── Database
    └── studio_symbols table (per-site)
```

### Key Concepts

1. **Source Symbol**: The original component saved as a symbol
2. **Instance**: A reference to a symbol placed on a page
3. **Override**: Property values that differ from the source
4. **Linked**: Instance syncs with source changes
5. **Unlinked**: Instance is independent (no longer updates)

## Implementation Tasks

### Task 1: Symbol Type Definitions

**Description:** Create TypeScript types for symbols and instances.

**Files:**
- CREATE: `src/types/studio-symbols.ts`

**Code:**

```typescript
// src/types/studio-symbols.ts

import type { StudioComponent } from './studio';

/**
 * A reusable Symbol definition
 * Symbols are stored per-site and can be instantiated on any page
 */
export interface StudioSymbol {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  
  // Source component tree
  sourceComponent: StudioComponent;
  sourceChildren: StudioComponent[];
  
  // Metadata
  siteId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  
  // Usage tracking
  instanceCount: number;
}

/**
 * A Symbol instance placed on a page
 * Extends StudioComponent with symbol-specific properties
 */
export interface SymbolInstance extends StudioComponent {
  type: 'SymbolInstance';
  
  props: {
    symbolId: string;
    overrides?: Record<string, unknown>;
    isUnlinked?: boolean;
  };
}

/**
 * Check if a component is a symbol instance
 */
export function isSymbolInstance(component: StudioComponent): component is SymbolInstance {
  return component.type === 'SymbolInstance' && 'symbolId' in (component.props || {});
}

/**
 * Symbol store state
 */
export interface SymbolStoreState {
  symbols: StudioSymbol[];
  isLoading: boolean;
  error: string | null;
  currentSiteId: string | null;
}

/**
 * Symbol store actions
 */
export interface SymbolStoreActions {
  // Fetch symbols for a site
  fetchSymbols: (siteId: string) => Promise<void>;
  
  // CRUD operations
  createSymbol: (data: CreateSymbolInput) => Promise<StudioSymbol>;
  updateSymbol: (id: string, updates: UpdateSymbolInput) => Promise<void>;
  deleteSymbol: (id: string) => Promise<void>;
  
  // Instance operations
  createInstance: (symbolId: string) => SymbolInstance;
  updateInstanceOverrides: (instanceId: string, overrides: Record<string, unknown>) => void;
  unlinkInstance: (instanceId: string) => void;
  resetInstanceOverride: (instanceId: string, propKey: string) => void;
  
  // Propagation
  propagateSymbolUpdate: (symbolId: string) => Promise<void>;
  
  // Helpers
  getSymbolById: (id: string) => StudioSymbol | undefined;
  getInstancesForSymbol: (symbolId: string) => SymbolInstance[];
}

/**
 * Input for creating a new symbol
 */
export interface CreateSymbolInput {
  name: string;
  description?: string;
  sourceComponent: StudioComponent;
  sourceChildren: StudioComponent[];
  siteId: string;
}

/**
 * Input for updating a symbol
 */
export interface UpdateSymbolInput {
  name?: string;
  description?: string;
  sourceComponent?: StudioComponent;
  sourceChildren?: StudioComponent[];
  thumbnail?: string;
}

/**
 * Props for the Create Symbol dialog
 */
export interface CreateSymbolDialogProps {
  isOpen: boolean;
  onClose: () => void;
  component: StudioComponent;
  children: StudioComponent[];
}

/**
 * Props for the Symbols panel
 */
export interface SymbolsPanelProps {
  siteId: string;
}

/**
 * Merged props for a symbol instance (source + overrides)
 */
export function getMergedInstanceProps(
  symbol: StudioSymbol,
  instance: SymbolInstance
): Record<string, unknown> {
  const sourceProps = symbol.sourceComponent.props;
  const overrides = instance.props.overrides || {};
  
  return {
    ...sourceProps,
    ...overrides,
  };
}

/**
 * Get which fields have overrides
 */
export function getOverriddenFields(
  sourceProps: Record<string, unknown>,
  overrides?: Record<string, unknown>
): string[] {
  if (!overrides) return [];
  
  return Object.keys(overrides).filter(key => {
    return JSON.stringify(sourceProps[key]) !== JSON.stringify(overrides[key]);
  });
}

/**
 * Check if instance has any overrides
 */
export function hasOverrides(instance: SymbolInstance): boolean {
  return Object.keys(instance.props.overrides || {}).length > 0;
}
```

**Acceptance Criteria:**
- [ ] All symbol types defined
- [ ] Instance type extends StudioComponent
- [ ] Helper functions for checking symbols
- [ ] Types exported properly

---

### Task 2: Symbol Store

**Description:** Create Zustand store for symbol management.

**Files:**
- CREATE: `src/lib/studio/store/symbol-store.ts`

**Code:**

```typescript
// src/lib/studio/store/symbol-store.ts

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { createClient } from '@/lib/supabase/client';
import type {
  StudioSymbol,
  SymbolInstance,
  SymbolStoreState,
  SymbolStoreActions,
  CreateSymbolInput,
  UpdateSymbolInput,
} from '@/types/studio-symbols';
import type { StudioComponent } from '@/types/studio';
import { useEditorStore } from './editor-store';
import { toast } from 'sonner';

interface SymbolStore extends SymbolStoreState, SymbolStoreActions {}

export const useSymbolStore = create<SymbolStore>((set, get) => ({
  // State
  symbols: [],
  isLoading: false,
  error: null,
  currentSiteId: null,

  // Fetch symbols for a site
  fetchSymbols: async (siteId: string) => {
    set({ isLoading: true, error: null, currentSiteId: siteId });
    
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('studio_symbols')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform database records to StudioSymbol
      const symbols: StudioSymbol[] = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        thumbnail: row.thumbnail,
        sourceComponent: row.source_component,
        sourceChildren: row.source_children || [],
        siteId: row.site_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        instanceCount: row.instance_count || 0,
      }));
      
      set({ symbols, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch symbols:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch symbols',
        isLoading: false,
        symbols: [], // Use empty array as fallback
      });
    }
  },

  // Create a new symbol
  createSymbol: async (input: CreateSymbolInput) => {
    const supabase = createClient();
    
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id || 'anonymous';
    
    const newSymbol: StudioSymbol = {
      id: `sym_${nanoid(10)}`,
      name: input.name,
      description: input.description,
      sourceComponent: input.sourceComponent,
      sourceChildren: input.sourceChildren,
      siteId: input.siteId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
      instanceCount: 0,
    };
    
    try {
      const { error } = await supabase
        .from('studio_symbols')
        .insert({
          id: newSymbol.id,
          name: newSymbol.name,
          description: newSymbol.description,
          source_component: newSymbol.sourceComponent,
          source_children: newSymbol.sourceChildren,
          site_id: newSymbol.siteId,
          created_at: newSymbol.createdAt,
          updated_at: newSymbol.updatedAt,
          created_by: newSymbol.createdBy,
          instance_count: 0,
        });
      
      if (error) throw error;
      
      // Add to local state
      set((state) => ({
        symbols: [newSymbol, ...state.symbols],
      }));
      
      toast.success(`Symbol "${newSymbol.name}" created`);
      return newSymbol;
    } catch (error) {
      console.error('Failed to create symbol:', error);
      toast.error('Failed to create symbol');
      throw error;
    }
  },

  // Update symbol
  updateSymbol: async (id: string, updates: UpdateSymbolInput) => {
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('studio_symbols')
        .update({
          name: updates.name,
          description: updates.description,
          source_component: updates.sourceComponent,
          source_children: updates.sourceChildren,
          thumbnail: updates.thumbnail,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      set((state) => ({
        symbols: state.symbols.map(sym =>
          sym.id === id
            ? {
                ...sym,
                ...updates,
                updatedAt: new Date().toISOString(),
              }
            : sym
        ),
      }));
      
      // Propagate changes to instances
      await get().propagateSymbolUpdate(id);
      
    } catch (error) {
      console.error('Failed to update symbol:', error);
      toast.error('Failed to update symbol');
      throw error;
    }
  },

  // Delete symbol
  deleteSymbol: async (id: string) => {
    const symbol = get().getSymbolById(id);
    if (!symbol) return;
    
    // Check for instances
    if (symbol.instanceCount > 0) {
      const confirmed = window.confirm(
        `This symbol has ${symbol.instanceCount} instance(s). ` +
        `Deleting will unlink all instances. Continue?`
      );
      if (!confirmed) return;
    }
    
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('studio_symbols')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Remove from local state
      set((state) => ({
        symbols: state.symbols.filter(sym => sym.id !== id),
      }));
      
      // Unlink all instances in editor
      const editorStore = useEditorStore.getState();
      const components = Object.values(editorStore.data.components);
      
      components.forEach(comp => {
        if (comp.type === 'SymbolInstance' && (comp.props as any).symbolId === id) {
          // Convert to unlinked
          editorStore.updateComponent(comp.id, {
            props: {
              ...comp.props,
              isUnlinked: true,
            },
          });
        }
      });
      
      toast.success('Symbol deleted');
    } catch (error) {
      console.error('Failed to delete symbol:', error);
      toast.error('Failed to delete symbol');
      throw error;
    }
  },

  // Create a new instance
  createInstance: (symbolId: string) => {
    const symbol = get().getSymbolById(symbolId);
    if (!symbol) {
      throw new Error(`Symbol ${symbolId} not found`);
    }
    
    const instance: SymbolInstance = {
      id: `inst_${nanoid(10)}`,
      type: 'SymbolInstance',
      props: {
        symbolId,
        overrides: {},
        isUnlinked: false,
      },
    };
    
    // Increment instance count (async, don't wait)
    const supabase = createClient();
    supabase
      .from('studio_symbols')
      .update({ instance_count: symbol.instanceCount + 1 })
      .eq('id', symbolId)
      .then(() => {
        set((state) => ({
          symbols: state.symbols.map(sym =>
            sym.id === symbolId
              ? { ...sym, instanceCount: sym.instanceCount + 1 }
              : sym
          ),
        }));
      });
    
    return instance;
  },

  // Update instance overrides
  updateInstanceOverrides: (instanceId: string, overrides: Record<string, unknown>) => {
    const editorStore = useEditorStore.getState();
    const component = editorStore.data.components[instanceId];
    
    if (!component || component.type !== 'SymbolInstance') return;
    
    editorStore.updateComponent(instanceId, {
      props: {
        ...component.props,
        overrides: {
          ...(component.props as any).overrides,
          ...overrides,
        },
      },
    });
  },

  // Unlink instance from symbol
  unlinkInstance: (instanceId: string) => {
    const editorStore = useEditorStore.getState();
    const component = editorStore.data.components[instanceId];
    
    if (!component || component.type !== 'SymbolInstance') return;
    
    const symbolId = (component.props as any).symbolId;
    const symbol = get().getSymbolById(symbolId);
    
    if (!symbol) return;
    
    // Convert instance to regular component using symbol's source
    const mergedProps = {
      ...symbol.sourceComponent.props,
      ...(component.props as any).overrides,
    };
    
    editorStore.updateComponent(instanceId, {
      type: symbol.sourceComponent.type,
      props: mergedProps,
    });
    
    // Decrement instance count
    const supabase = createClient();
    supabase
      .from('studio_symbols')
      .update({ instance_count: Math.max(0, symbol.instanceCount - 1) })
      .eq('id', symbolId);
    
    set((state) => ({
      symbols: state.symbols.map(sym =>
        sym.id === symbolId
          ? { ...sym, instanceCount: Math.max(0, sym.instanceCount - 1) }
          : sym
      ),
    }));
    
    toast.success('Instance unlinked from symbol');
  },

  // Reset a single override
  resetInstanceOverride: (instanceId: string, propKey: string) => {
    const editorStore = useEditorStore.getState();
    const component = editorStore.data.components[instanceId];
    
    if (!component || component.type !== 'SymbolInstance') return;
    
    const currentOverrides = { ...(component.props as any).overrides };
    delete currentOverrides[propKey];
    
    editorStore.updateComponent(instanceId, {
      props: {
        ...component.props,
        overrides: currentOverrides,
      },
    });
  },

  // Propagate symbol update to all instances
  propagateSymbolUpdate: async (symbolId: string) => {
    const symbol = get().getSymbolById(symbolId);
    if (!symbol) return;
    
    // In a real implementation, you'd fetch all pages with instances
    // and update them. For now, we update the current editor state.
    const editorStore = useEditorStore.getState();
    const components = Object.values(editorStore.data.components);
    
    let updatedCount = 0;
    
    components.forEach(comp => {
      if (
        comp.type === 'SymbolInstance' &&
        (comp.props as any).symbolId === symbolId &&
        !(comp.props as any).isUnlinked
      ) {
        // Instance is linked - it will automatically get new props
        // when rendered since we fetch from symbol store
        updatedCount++;
      }
    });
    
    if (updatedCount > 0) {
      toast.success(`Updated ${updatedCount} instance${updatedCount > 1 ? 's' : ''}`);
    }
  },

  // Get symbol by ID
  getSymbolById: (id: string) => {
    return get().symbols.find(sym => sym.id === id);
  },

  // Get all instances for a symbol in current page
  getInstancesForSymbol: (symbolId: string) => {
    const editorStore = useEditorStore.getState();
    const components = Object.values(editorStore.data.components);
    
    return components.filter(
      (comp): comp is SymbolInstance =>
        comp.type === 'SymbolInstance' &&
        (comp.props as any).symbolId === symbolId
    );
  },
}));

// Hook to get a specific symbol
export function useSymbol(symbolId: string) {
  return useSymbolStore((state) => state.getSymbolById(symbolId));
}
```

**Acceptance Criteria:**
- [ ] Fetch symbols from database
- [ ] Create new symbols
- [ ] Update symbols
- [ ] Delete symbols with instance handling
- [ ] Create instances
- [ ] Update instance overrides
- [ ] Unlink instances
- [ ] Propagate updates

---

### Task 3: Create Symbol Dialog

**Description:** Dialog for saving a component as a symbol.

**Files:**
- CREATE: `src/components/studio/features/create-symbol-dialog.tsx`

**Code:**

```typescript
// src/components/studio/features/create-symbol-dialog.tsx

'use client';

import { useState } from 'react';
import { Puzzle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useSymbolStore } from '@/lib/studio/store/symbol-store';
import type { CreateSymbolDialogProps } from '@/types/studio-symbols';

export function CreateSymbolDialog({
  isOpen,
  onClose,
  component,
  children,
}: CreateSymbolDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const { createSymbol, currentSiteId } = useSymbolStore();

  const handleCreate = async () => {
    if (!name.trim() || !currentSiteId) return;
    
    setIsCreating(true);
    
    try {
      await createSymbol({
        name: name.trim(),
        description: description.trim() || undefined,
        sourceComponent: component,
        sourceChildren: children,
        siteId: currentSiteId,
      });
      
      // Reset and close
      setName('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Failed to create symbol:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setName('');
      setDescription('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Puzzle className="w-5 h-5" />
            Save as Symbol
          </DialogTitle>
          <DialogDescription>
            Create a reusable symbol from this component. Changes to the symbol
            will automatically update all instances.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Component Preview */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Component</p>
            <p className="font-medium">{component.type}</p>
            {children.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                + {children.length} child component{children.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="symbol-name">Symbol Name *</Label>
            <Input
              id="symbol-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Header Navigation"
              autoFocus
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="symbol-description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="symbol-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this symbol is used for..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Puzzle className="w-4 h-4 mr-2" />
                Create Symbol
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateSymbolDialog;
```

**Acceptance Criteria:**
- [ ] Dialog opens with component info
- [ ] Name is required
- [ ] Description is optional
- [ ] Shows child count
- [ ] Creates symbol on submit
- [ ] Closes and resets on success

---

### Task 4: Symbols Panel

**Description:** Panel for browsing and inserting symbols.

**Files:**
- CREATE: `src/components/studio/panels/symbols-panel.tsx`

**Code:**

```typescript
// src/components/studio/panels/symbols-panel.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  Puzzle,
  MoreVertical,
  Plus,
  Trash2,
  Edit,
  Copy,
  Loader2,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useSymbolStore } from '@/lib/studio/store/symbol-store';
import { useEditorStore } from '@/lib/studio/store/editor-store';
import type { StudioSymbol, SymbolsPanelProps } from '@/types/studio-symbols';
import { useDraggable } from '@dnd-kit/core';

export function SymbolsPanel({ siteId }: SymbolsPanelProps) {
  const { symbols, isLoading, error, fetchSymbols, deleteSymbol, createInstance } = useSymbolStore();
  const { addComponent } = useEditorStore();

  // Fetch symbols on mount
  useEffect(() => {
    fetchSymbols(siteId);
  }, [siteId, fetchSymbols]);

  const handleInsertSymbol = (symbolId: string) => {
    const instance = createInstance(symbolId);
    addComponent(instance, 'bottom');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchSymbols(siteId)}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Puzzle className="w-4 h-4" />
          <h3 className="font-semibold text-sm">Symbols</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {symbols.length} symbol{symbols.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {symbols.length === 0 ? (
          <EmptySymbolsState />
        ) : (
          <div className="p-2 space-y-2">
            {symbols.map((symbol) => (
              <SymbolCard
                key={symbol.id}
                symbol={symbol}
                onInsert={() => handleInsertSymbol(symbol.id)}
                onDelete={() => deleteSymbol(symbol.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// Empty State
function EmptySymbolsState() {
  return (
    <div className="p-6 text-center">
      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <Puzzle className="w-6 h-6 text-muted-foreground" />
      </div>
      <h4 className="font-medium mb-2">No symbols yet</h4>
      <p className="text-sm text-muted-foreground">
        Right-click any component and select "Save as Symbol" to create
        reusable components.
      </p>
    </div>
  );
}

// Symbol Card
interface SymbolCardProps {
  symbol: StudioSymbol;
  onInsert: () => void;
  onDelete: () => void;
}

function SymbolCard({ symbol, onInsert, onDelete }: SymbolCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        'border rounded-lg p-3 transition-colors group',
        isHovered && 'border-primary bg-accent/50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        <DraggableSymbol symbol={symbol}>
          <div className="cursor-grab p-1 -ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
        </DraggableSymbol>

        {/* Symbol Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Puzzle className="w-4 h-4 text-primary flex-shrink-0" />
            <h4 className="font-medium text-sm truncate">{symbol.name}</h4>
          </div>
          
          {symbol.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {symbol.description}
            </p>
          )}
          
          <p className="text-xs text-muted-foreground mt-2">
            {symbol.instanceCount} instance{symbol.instanceCount !== 1 ? 's' : ''}
            <span className="mx-1">•</span>
            {symbol.sourceComponent.type}
          </p>
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onInsert}>
              <Plus className="w-4 h-4 mr-2" />
              Insert on Page
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate Symbol
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="w-4 h-4 mr-2" />
              Edit Symbol
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Symbol
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Insert Button (visible on hover) */}
      <Button
        variant="secondary"
        size="sm"
        className={cn(
          'w-full mt-3 transition-opacity',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onInsert}
      >
        <Plus className="w-4 h-4 mr-2" />
        Insert
      </Button>
    </div>
  );
}

// Draggable Symbol Wrapper
interface DraggableSymbolProps {
  symbol: StudioSymbol;
  children: React.ReactNode;
}

function DraggableSymbol({ symbol, children }: DraggableSymbolProps) {
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
      {...listeners}
      {...attributes}
      className={cn(isDragging && 'opacity-50')}
    >
      {children}
    </div>
  );
}

export default SymbolsPanel;
```

**Acceptance Criteria:**
- [ ] Shows loading state
- [ ] Shows empty state with instructions
- [ ] Lists all symbols with info
- [ ] Shows instance count
- [ ] Insert button works
- [ ] Delete with confirmation
- [ ] Draggable to canvas

---

### Task 5: Symbol Instance Renderer

**Description:** Render symbol instances with visual indicator and override support.

**Files:**
- CREATE: `src/components/studio/core/symbol-instance-renderer.tsx`

**Code:**

```typescript
// src/components/studio/core/symbol-instance-renderer.tsx

'use client';

import { useMemo } from 'react';
import { Puzzle, Link, Unlink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSymbol } from '@/lib/studio/store/symbol-store';
import { ComponentRenderer } from './component-renderer';
import type { SymbolInstance, StudioSymbol } from '@/types/studio-symbols';
import { getMergedInstanceProps, hasOverrides } from '@/types/studio-symbols';

interface SymbolInstanceRendererProps {
  instance: SymbolInstance;
  isSelected?: boolean;
  isEditing?: boolean;
}

export function SymbolInstanceRenderer({
  instance,
  isSelected,
  isEditing,
}: SymbolInstanceRendererProps) {
  const symbolId = instance.props.symbolId;
  const isUnlinked = instance.props.isUnlinked;
  const symbol = useSymbol(symbolId);

  // If symbol not found, show placeholder
  if (!symbol) {
    return (
      <MissingSymbolPlaceholder
        instanceId={instance.id}
        symbolId={symbolId}
      />
    );
  }

  // Merge source props with overrides
  const mergedProps = useMemo(() => {
    return getMergedInstanceProps(symbol, instance);
  }, [symbol, instance]);

  const hasInstanceOverrides = hasOverrides(instance);

  return (
    <div className="relative">
      {/* Symbol Indicator Badge */}
      {(isSelected || isEditing) && (
        <SymbolIndicator
          symbol={symbol}
          isUnlinked={isUnlinked}
          hasOverrides={hasInstanceOverrides}
        />
      )}

      {/* Render the actual component */}
      <ComponentRenderer
        component={{
          ...symbol.sourceComponent,
          id: instance.id,
          props: mergedProps,
        }}
      />
    </div>
  );
}

// Symbol Indicator Badge
interface SymbolIndicatorProps {
  symbol: StudioSymbol;
  isUnlinked?: boolean;
  hasOverrides?: boolean;
}

function SymbolIndicator({ symbol, isUnlinked, hasOverrides }: SymbolIndicatorProps) {
  return (
    <div
      className={cn(
        'absolute -top-6 left-0 z-50',
        'flex items-center gap-1.5 px-2 py-1 rounded-t-md',
        'text-xs font-medium',
        isUnlinked
          ? 'bg-orange-500/20 text-orange-600 border border-orange-500/30'
          : 'bg-purple-500/20 text-purple-600 border border-purple-500/30'
      )}
    >
      <Puzzle className="w-3 h-3" />
      <span>{symbol.name}</span>
      
      {/* Link Status */}
      {isUnlinked ? (
        <Unlink className="w-3 h-3 ml-1" title="Unlinked from symbol" />
      ) : (
        <Link className="w-3 h-3 ml-1" title="Linked to symbol" />
      )}
      
      {/* Override Indicator */}
      {hasOverrides && !isUnlinked && (
        <span
          className="w-2 h-2 rounded-full bg-amber-500"
          title="Has overrides"
        />
      )}
    </div>
  );
}

// Missing Symbol Placeholder
interface MissingSymbolPlaceholderProps {
  instanceId: string;
  symbolId: string;
}

function MissingSymbolPlaceholder({ instanceId, symbolId }: MissingSymbolPlaceholderProps) {
  return (
    <div className="p-4 border-2 border-dashed border-destructive/50 rounded-lg bg-destructive/10">
      <div className="flex items-center gap-2 text-destructive">
        <Puzzle className="w-5 h-5" />
        <div>
          <p className="font-medium text-sm">Missing Symbol</p>
          <p className="text-xs opacity-75">
            The symbol "{symbolId}" was not found. It may have been deleted.
          </p>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-muted-foreground">
        Instance ID: {instanceId}
      </div>
    </div>
  );
}

export default SymbolInstanceRenderer;
```

**Acceptance Criteria:**
- [ ] Renders symbol content correctly
- [ ] Shows indicator badge when selected
- [ ] Shows linked/unlinked status
- [ ] Shows override indicator
- [ ] Handles missing symbols gracefully

---

### Task 6: Symbol Instance Properties Panel

**Description:** Properties panel extensions for symbol instances.

**Files:**
- CREATE: `src/components/studio/properties/symbol-instance-properties.tsx`

**Code:**

```typescript
// src/components/studio/properties/symbol-instance-properties.tsx

'use client';

import { useMemo } from 'react';
import { Puzzle, Link, Unlink, Edit, RotateCcw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSymbol, useSymbolStore } from '@/lib/studio/store/symbol-store';
import { FieldRenderer } from './field-renderer';
import { getComponentDefinition } from '@/lib/studio/registry/component-registry';
import type { SymbolInstance } from '@/types/studio-symbols';
import { getOverriddenFields } from '@/types/studio-symbols';

interface SymbolInstancePropertiesProps {
  instance: SymbolInstance;
}

export function SymbolInstanceProperties({ instance }: SymbolInstancePropertiesProps) {
  const symbolId = instance.props.symbolId;
  const isUnlinked = instance.props.isUnlinked;
  const symbol = useSymbol(symbolId);
  const { unlinkInstance, updateInstanceOverrides, resetInstanceOverride } = useSymbolStore();

  // Get overridden fields
  const overriddenFields = useMemo(() => {
    if (!symbol) return [];
    return getOverriddenFields(
      symbol.sourceComponent.props,
      instance.props.overrides
    );
  }, [symbol, instance.props.overrides]);

  // Get component definition for field types
  const definition = useMemo(() => {
    if (!symbol) return null;
    return getComponentDefinition(symbol.sourceComponent.type);
  }, [symbol]);

  if (!symbol) {
    return (
      <div className="p-4">
        <p className="text-sm text-destructive">Symbol not found</p>
      </div>
    );
  }

  const handleUnlink = () => {
    const confirmed = window.confirm(
      'Unlink this instance? It will no longer receive updates from the symbol.'
    );
    if (confirmed) {
      unlinkInstance(instance.id);
    }
  };

  const handleResetOverride = (fieldKey: string) => {
    resetInstanceOverride(instance.id, fieldKey);
  };

  const handleFieldChange = (fieldKey: string, value: unknown) => {
    updateInstanceOverrides(instance.id, { [fieldKey]: value });
  };

  // Merged props for display
  const mergedProps = {
    ...symbol.sourceComponent.props,
    ...instance.props.overrides,
  };

  return (
    <div className="space-y-4">
      {/* Symbol Header */}
      <div className={cn(
        'p-3 rounded-lg',
        isUnlinked
          ? 'bg-orange-500/10 border border-orange-500/30'
          : 'bg-purple-500/10 border border-purple-500/30'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Puzzle className={cn(
              'w-4 h-4',
              isUnlinked ? 'text-orange-500' : 'text-purple-500'
            )} />
            <span className="font-medium text-sm">{symbol.name}</span>
          </div>
          
          <div className="flex items-center gap-1">
            {isUnlinked ? (
              <Badge variant="outline" className="text-orange-500 border-orange-500">
                <Unlink className="w-3 h-3 mr-1" />
                Unlinked
              </Badge>
            ) : (
              <Badge variant="outline" className="text-purple-500 border-purple-500">
                <Link className="w-3 h-3 mr-1" />
                Linked
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="sm" className="flex-1">
                <Edit className="w-3 h-3 mr-1" />
                Edit Symbol
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Opens symbol for editing (updates all instances)
            </TooltipContent>
          </Tooltip>

          {!isUnlinked && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={handleUnlink}
                >
                  <Unlink className="w-3 h-3 mr-1" />
                  Unlink
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Disconnect from symbol (no more sync)
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Override Summary */}
        {overriddenFields.length > 0 && !isUnlinked && (
          <div className="mt-3 text-xs text-muted-foreground">
            {overriddenFields.length} field{overriddenFields.length > 1 ? 's' : ''} overridden
          </div>
        )}
      </div>

      <Separator />

      {/* Fields */}
      {definition && (
        <div className="space-y-4">
          {Object.entries(definition.fields || {}).map(([fieldKey, fieldDef]) => {
            const isOverridden = overriddenFields.includes(fieldKey);
            const currentValue = mergedProps[fieldKey];

            return (
              <div key={fieldKey} className="relative">
                {/* Override indicator and reset button */}
                {isOverridden && !isUnlinked && (
                  <div className="absolute -left-4 top-0 flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full bg-amber-500"
                      title="Overridden"
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleResetOverride(fieldKey)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <RotateCcw className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Reset to symbol value</TooltipContent>
                    </Tooltip>
                  </div>
                )}

                <FieldRenderer
                  field={fieldDef}
                  value={currentValue}
                  onChange={(value) => handleFieldChange(fieldKey, value)}
                  label={fieldDef.label}
                  className={cn(isOverridden && !isUnlinked && 'pl-2 border-l-2 border-amber-500')}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SymbolInstanceProperties;
```

**Acceptance Criteria:**
- [ ] Shows symbol name and status
- [ ] Shows linked/unlinked badge
- [ ] Edit Symbol button present
- [ ] Unlink button works
- [ ] Override indicator shows on changed fields
- [ ] Reset override button works
- [ ] Fields are editable

---

### Task 7: Integration with Context Menu

**Description:** Add "Save as Symbol" to component context menu.

**Files:**
- MODIFY: `src/components/studio/core/component-wrapper.tsx`

**Code:**

```typescript
// Add to component-wrapper.tsx context menu

import { useState } from 'react';
import { Puzzle } from 'lucide-react';
import { CreateSymbolDialog } from '../features/create-symbol-dialog';
import { useEditorStore } from '@/lib/studio/store/editor-store';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

// Inside ComponentWrapper component:
export function ComponentWrapper({ component, children }: Props) {
  const [isCreateSymbolOpen, setCreateSymbolOpen] = useState(false);
  const { getComponentChildren } = useEditorStore();
  
  // Get children for symbol creation
  const componentChildren = getComponentChildren(component.id);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {/* ... existing wrapper content ... */}
        </ContextMenuTrigger>
        
        <ContextMenuContent>
          {/* ... existing menu items (copy, paste, duplicate, delete) ... */}
          
          <ContextMenuSeparator />
          
          <ContextMenuItem onClick={() => setCreateSymbolOpen(true)}>
            <Puzzle className="w-4 h-4 mr-2" />
            Save as Symbol...
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Create Symbol Dialog */}
      <CreateSymbolDialog
        isOpen={isCreateSymbolOpen}
        onClose={() => setCreateSymbolOpen(false)}
        component={component}
        children={componentChildren}
      />
    </>
  );
}
```

**Acceptance Criteria:**
- [ ] Context menu shows "Save as Symbol" option
- [ ] Clicking opens Create Symbol dialog
- [ ] Dialog receives component and children

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| CREATE | src/types/studio-symbols.ts | Symbol and instance type definitions |
| CREATE | src/lib/studio/store/symbol-store.ts | Zustand store for symbols |
| CREATE | src/components/studio/features/create-symbol-dialog.tsx | Dialog for creating symbols |
| CREATE | src/components/studio/panels/symbols-panel.tsx | Panel for browsing symbols |
| CREATE | src/components/studio/core/symbol-instance-renderer.tsx | Render symbol instances |
| CREATE | src/components/studio/properties/symbol-instance-properties.tsx | Properties for instances |
| MODIFY | src/components/studio/core/component-wrapper.tsx | Add context menu option |
| MODIFY | src/lib/studio/store/editor-store.ts | Add getComponentChildren helper |

## Testing Requirements

### Unit Tests
- [ ] Symbol creation stores correct data
- [ ] Instance creation generates unique IDs
- [ ] Override merging works correctly
- [ ] Unlink converts to regular component
- [ ] Instance count updates correctly

### Integration Tests
- [ ] Context menu → Create Symbol flow
- [ ] Symbol appears in panel after creation
- [ ] Inserting symbol creates instance
- [ ] Editing symbol updates instances
- [ ] Overriding instance props works
- [ ] Reset override restores source value

### Manual Testing
- [ ] Right-click component shows "Save as Symbol"
- [ ] Create Symbol dialog works
- [ ] Symbol appears in Symbols panel
- [ ] Drag symbol to canvas creates instance
- [ ] Instance shows purple indicator when selected
- [ ] Editing field on instance creates override
- [ ] Override indicator (amber dot) shows
- [ ] Reset button clears override
- [ ] Unlink button disconnects instance
- [ ] Unlinked instance shows orange indicator
- [ ] Delete symbol warns about instances

## Dependencies to Install

```bash
# No new dependencies required
# Using existing: zustand, @dnd-kit/core, nanoid
```

## Database Changes

```sql
-- Create symbols table
CREATE TABLE IF NOT EXISTS studio_symbols (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  source_component JSONB NOT NULL,
  source_children JSONB DEFAULT '[]',
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  instance_count INTEGER DEFAULT 0
);

-- Index for site filtering
CREATE INDEX idx_studio_symbols_site_id ON studio_symbols(site_id);

-- Enable RLS
ALTER TABLE studio_symbols ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read symbols for sites they have access to
CREATE POLICY "Users can view symbols for their sites"
  ON studio_symbols FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
      UNION
      SELECT site_id FROM site_team_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create symbols for their sites
CREATE POLICY "Users can create symbols for their sites"
  ON studio_symbols FOR INSERT
  WITH CHECK (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
      UNION
      SELECT site_id FROM site_team_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update/delete their symbols
CREATE POLICY "Users can modify symbols for their sites"
  ON studio_symbols FOR UPDATE
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
      UNION
      SELECT site_id FROM site_team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete symbols for their sites"
  ON studio_symbols FOR DELETE
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
      UNION
      SELECT site_id FROM site_team_members WHERE user_id = auth.uid()
    )
  );

-- Function to update instance count
CREATE OR REPLACE FUNCTION update_symbol_instance_count()
RETURNS TRIGGER AS $$
BEGIN
  -- This would be called when pages are updated
  -- For now, instance_count is updated manually in the application
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Rollback Plan

1. Remove "Save as Symbol" from context menu
2. Remove Symbols tab from left panel
3. Delete new files:
   - `src/types/studio-symbols.ts`
   - `src/lib/studio/store/symbol-store.ts`
   - `src/components/studio/features/create-symbol-dialog.tsx`
   - `src/components/studio/panels/symbols-panel.tsx`
   - `src/components/studio/core/symbol-instance-renderer.tsx`
   - `src/components/studio/properties/symbol-instance-properties.tsx`
4. Drop database table: `DROP TABLE studio_symbols;`
5. Existing pages with symbol instances will need instance conversion to regular components

## Success Criteria

- [ ] Can right-click any component and select "Save as Symbol"
- [ ] Create Symbol dialog captures name and description
- [ ] Symbols panel shows all site symbols
- [ ] Symbol panel shows instance count
- [ ] Can drag symbol from panel to canvas
- [ ] Can click to insert symbol instance
- [ ] Symbol instance renders correctly
- [ ] Instance shows visual indicator (purple border/badge)
- [ ] Properties panel shows symbol info for instances
- [ ] Can edit instance properties (creates override)
- [ ] Override indicator shows on changed fields
- [ ] Can reset individual overrides
- [ ] Can unlink instance (becomes regular component)
- [ ] Unlinked instance shows different indicator (orange)
- [ ] Editing symbol source updates all linked instances
- [ ] Delete symbol warns if instances exist
- [ ] Missing symbol shows placeholder with error
- [ ] No TypeScript errors
- [ ] Symbols persist to database
