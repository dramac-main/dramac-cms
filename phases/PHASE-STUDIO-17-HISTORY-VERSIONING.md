# PHASE-STUDIO-17: History & Versioning

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-17 |
| Title | History & Versioning |
| Priority | Medium |
| Estimated Time | 10-12 hours |
| Dependencies | STUDIO-02 (Editor Store with zundo), STUDIO-16 (Layers Panel) |
| Risk Level | Medium |

## Problem Statement

Currently, users can undo/redo via keyboard shortcuts (Cmd+Z / Cmd+Shift+Z), but there's no visual way to:
- See what changes have been made
- Jump to a specific point in history
- Save named snapshots for important states
- Compare different versions of the page

This phase adds a **History Panel** with:
- Visual timeline of all changes
- Click to jump to any point
- Named snapshots for saving states
- Version comparison to see what changed

## Goals

- [ ] Create history panel UI showing undo/redo timeline
- [ ] Implement click-to-jump to any history point
- [ ] Add named snapshot functionality (save/restore)
- [ ] Create snapshot comparison UI
- [ ] Persist snapshots to IndexedDB and database
- [ ] Display human-readable action descriptions

## Technical Approach

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  HISTORY PANEL (in right panel, tab or separate section)       │
├─────────────────────────────────────────────────────────────────┤
│  📷 Snapshots                                    [+ Save]       │
│  ├─ "Initial Design" (2 hours ago)         [Restore] [Delete]  │
│  └─ "After client feedback" (30 min ago)   [Restore] [Delete]  │
├─────────────────────────────────────────────────────────────────┤
│  🕐 History                                       [Clear]       │
│  ├─ ● Added Heading "Welcome"                    (just now)    │
│  ├─ ○ Changed text to "Hello World"              (1 min ago)   │
│  ├─ ○ Moved Button to Section                    (2 min ago)   │
│  ├─ ○ Deleted Image                              (3 min ago)   │
│  └─ ○ Added Section "Hero"                       (5 min ago)   │
│                                                                 │
│  ● = Current position                                           │
│  Click any entry to jump to that state                          │
└─────────────────────────────────────────────────────────────────┘
```

### Zundo Integration

The editor store already uses `zundo` middleware for undo/redo. This phase:
1. Exposes history metadata for UI display
2. Tracks action descriptions for each change
3. Allows jumping to specific history points

### Snapshot Storage

Snapshots are stored in:
1. **IndexedDB** - for quick local access
2. **Database** - for persistence across devices/sessions

## Implementation Tasks

### Task 1: Create History Types

**Description:** Define types for history entries and snapshots.

**Files:**
- CREATE: `src/types/studio-history.ts`

**Code:**

```typescript
// src/types/studio-history.ts

import type { StudioPageData } from './studio';

/**
 * Types of actions that can be recorded in history
 */
export type HistoryActionType =
  | 'component.add'
  | 'component.delete'
  | 'component.move'
  | 'component.edit'
  | 'component.duplicate'
  | 'component.lock'
  | 'component.unlock'
  | 'component.hide'
  | 'component.show'
  | 'page.load'
  | 'page.generate'
  | 'snapshot.restore'
  | 'bulk.action';

/**
 * A single history entry with metadata
 */
export interface HistoryEntry {
  id: string;
  timestamp: number;
  action: HistoryActionType;
  componentId?: string;
  componentType?: string;
  description: string;
  data: StudioPageData; // Full state at this point
}

/**
 * A named snapshot that can be saved/restored
 */
export interface Snapshot {
  id: string;
  name: string;
  description?: string;
  timestamp: number;
  data: StudioPageData;
  thumbnail?: string; // Base64 canvas screenshot
  pageId: string;
  siteId: string;
}

/**
 * Difference between two snapshots or states
 */
export interface SnapshotDiff {
  componentsAdded: Array<{
    id: string;
    type: string;
  }>;
  componentsRemoved: Array<{
    id: string;
    type: string;
  }>;
  componentsModified: Array<{
    id: string;
    type: string;
    changes: Record<string, { old: unknown; new: unknown }>;
  }>;
  summary: string;
}

/**
 * Snapshot store state
 */
export interface SnapshotState {
  snapshots: Snapshot[];
  isLoading: boolean;
  error: string | null;
}

/**
 * History metadata tracked alongside zundo
 */
export interface HistoryMetadata {
  entries: HistoryEntry[];
  currentIndex: number;
  maxEntries: number;
}
```

**Acceptance Criteria:**
- [ ] All history types defined
- [ ] HistoryActionType covers all actions
- [ ] Snapshot type includes all needed fields
- [ ] SnapshotDiff type for comparison

---

### Task 2: Create History Metadata Store

**Description:** Create a store to track history metadata alongside zundo.

**Files:**
- CREATE: `src/lib/studio/store/history-store.ts`

**Code:**

```typescript
// src/lib/studio/store/history-store.ts
'use client';

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { 
  HistoryEntry, 
  HistoryActionType, 
  HistoryMetadata 
} from '@/types/studio-history';
import type { StudioPageData } from '@/types/studio';

const MAX_HISTORY_ENTRIES = 50;

interface HistoryStore extends HistoryMetadata {
  // Actions
  recordAction: (
    action: HistoryActionType,
    data: StudioPageData,
    componentId?: string,
    componentType?: string,
    customDescription?: string
  ) => void;
  jumpToEntry: (entryId: string) => StudioPageData | null;
  clearHistory: () => void;
  getUndoDescription: () => string | null;
  getRedoDescription: () => string | null;
}

/**
 * Generate human-readable description for an action
 */
function generateDescription(
  action: HistoryActionType,
  componentType?: string,
  customDescription?: string
): string {
  if (customDescription) return customDescription;
  
  const typeLabel = componentType || 'component';
  
  switch (action) {
    case 'component.add':
      return `Added ${typeLabel}`;
    case 'component.delete':
      return `Deleted ${typeLabel}`;
    case 'component.move':
      return `Moved ${typeLabel}`;
    case 'component.edit':
      return `Edited ${typeLabel}`;
    case 'component.duplicate':
      return `Duplicated ${typeLabel}`;
    case 'component.lock':
      return `Locked ${typeLabel}`;
    case 'component.unlock':
      return `Unlocked ${typeLabel}`;
    case 'component.hide':
      return `Hid ${typeLabel}`;
    case 'component.show':
      return `Showed ${typeLabel}`;
    case 'page.load':
      return 'Page loaded';
    case 'page.generate':
      return 'Generated page with AI';
    case 'snapshot.restore':
      return 'Restored snapshot';
    case 'bulk.action':
      return 'Bulk action';
    default:
      return 'Changed page';
  }
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  entries: [],
  currentIndex: -1,
  maxEntries: MAX_HISTORY_ENTRIES,
  
  recordAction: (action, data, componentId, componentType, customDescription) => {
    const entry: HistoryEntry = {
      id: nanoid(),
      timestamp: Date.now(),
      action,
      componentId,
      componentType,
      description: generateDescription(action, componentType, customDescription),
      data: JSON.parse(JSON.stringify(data)), // Deep clone
    };
    
    set((state) => {
      // Remove any "future" entries if we're not at the end
      const newEntries = state.entries.slice(0, state.currentIndex + 1);
      
      // Add new entry
      newEntries.push(entry);
      
      // Trim to max size
      while (newEntries.length > state.maxEntries) {
        newEntries.shift();
      }
      
      return {
        entries: newEntries,
        currentIndex: newEntries.length - 1,
      };
    });
  },
  
  jumpToEntry: (entryId) => {
    const { entries } = get();
    const index = entries.findIndex(e => e.id === entryId);
    
    if (index === -1) return null;
    
    set({ currentIndex: index });
    return entries[index].data;
  },
  
  clearHistory: () => {
    set({
      entries: [],
      currentIndex: -1,
    });
  },
  
  getUndoDescription: () => {
    const { entries, currentIndex } = get();
    if (currentIndex <= 0) return null;
    return entries[currentIndex]?.description || null;
  },
  
  getRedoDescription: () => {
    const { entries, currentIndex } = get();
    if (currentIndex >= entries.length - 1) return null;
    return entries[currentIndex + 1]?.description || null;
  },
}));
```

**Acceptance Criteria:**
- [ ] recordAction adds entries with descriptions
- [ ] jumpToEntry returns state for that point
- [ ] History limited to MAX_HISTORY_ENTRIES
- [ ] Undo/redo descriptions available

---

### Task 3: Create Snapshot Store with IndexedDB

**Description:** Create a store for managing snapshots with IndexedDB persistence.

**Files:**
- CREATE: `src/lib/studio/store/snapshot-store.ts`

**Code:**

```typescript
// src/lib/studio/store/snapshot-store.ts
'use client';

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Snapshot, SnapshotState, SnapshotDiff } from '@/types/studio-history';
import type { StudioPageData } from '@/types/studio';

// IndexedDB configuration
const DB_NAME = 'dramac-studio';
const STORE_NAME = 'snapshots';
const DB_VERSION = 1;

/**
 * Initialize IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('pageId', 'pageId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Save snapshot to IndexedDB
 */
async function saveToIndexedDB(snapshot: Snapshot): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(snapshot);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Load snapshots from IndexedDB for a page
 */
async function loadFromIndexedDB(pageId: string): Promise<Snapshot[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('pageId');
    const request = index.getAll(pageId);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

/**
 * Delete snapshot from IndexedDB
 */
async function deleteFromIndexedDB(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

interface SnapshotStore extends SnapshotState {
  // Context
  pageId: string | null;
  siteId: string | null;
  
  // Actions
  setContext: (pageId: string, siteId: string) => void;
  loadSnapshots: () => Promise<void>;
  saveSnapshot: (
    name: string, 
    data: StudioPageData, 
    description?: string,
    thumbnail?: string
  ) => Promise<Snapshot>;
  restoreSnapshot: (id: string) => StudioPageData | null;
  deleteSnapshot: (id: string) => Promise<void>;
  compareSnapshots: (id1: string, id2: string) => SnapshotDiff | null;
  compareToCurrent: (id: string, currentData: StudioPageData) => SnapshotDiff | null;
}

/**
 * Compare two page data states and return differences
 */
function comparePageData(
  oldData: StudioPageData,
  newData: StudioPageData
): SnapshotDiff {
  const oldIds = new Set(Object.keys(oldData.components));
  const newIds = new Set(Object.keys(newData.components));
  
  const added: SnapshotDiff['componentsAdded'] = [];
  const removed: SnapshotDiff['componentsRemoved'] = [];
  const modified: SnapshotDiff['componentsModified'] = [];
  
  // Find added components
  for (const id of newIds) {
    if (!oldIds.has(id)) {
      added.push({
        id,
        type: newData.components[id].type,
      });
    }
  }
  
  // Find removed components
  for (const id of oldIds) {
    if (!newIds.has(id)) {
      removed.push({
        id,
        type: oldData.components[id].type,
      });
    }
  }
  
  // Find modified components
  for (const id of oldIds) {
    if (newIds.has(id)) {
      const oldComp = oldData.components[id];
      const newComp = newData.components[id];
      const changes: Record<string, { old: unknown; new: unknown }> = {};
      
      // Compare props
      const allProps = new Set([
        ...Object.keys(oldComp.props),
        ...Object.keys(newComp.props),
      ]);
      
      for (const prop of allProps) {
        const oldVal = JSON.stringify(oldComp.props[prop]);
        const newVal = JSON.stringify(newComp.props[prop]);
        
        if (oldVal !== newVal) {
          changes[prop] = {
            old: oldComp.props[prop],
            new: newComp.props[prop],
          };
        }
      }
      
      if (Object.keys(changes).length > 0) {
        modified.push({
          id,
          type: newComp.type,
          changes,
        });
      }
    }
  }
  
  // Generate summary
  const parts: string[] = [];
  if (added.length > 0) parts.push(`${added.length} added`);
  if (removed.length > 0) parts.push(`${removed.length} removed`);
  if (modified.length > 0) parts.push(`${modified.length} modified`);
  
  return {
    componentsAdded: added,
    componentsRemoved: removed,
    componentsModified: modified,
    summary: parts.length > 0 ? parts.join(', ') : 'No changes',
  };
}

export const useSnapshotStore = create<SnapshotStore>((set, get) => ({
  snapshots: [],
  isLoading: false,
  error: null,
  pageId: null,
  siteId: null,
  
  setContext: (pageId, siteId) => {
    set({ pageId, siteId });
  },
  
  loadSnapshots: async () => {
    const { pageId } = get();
    if (!pageId) return;
    
    set({ isLoading: true, error: null });
    
    try {
      const snapshots = await loadFromIndexedDB(pageId);
      // Sort by timestamp, newest first
      snapshots.sort((a, b) => b.timestamp - a.timestamp);
      set({ snapshots, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load snapshots',
        isLoading: false,
      });
    }
  },
  
  saveSnapshot: async (name, data, description, thumbnail) => {
    const { pageId, siteId, snapshots } = get();
    if (!pageId || !siteId) {
      throw new Error('Page context not set');
    }
    
    const snapshot: Snapshot = {
      id: nanoid(),
      name,
      description,
      timestamp: Date.now(),
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      thumbnail,
      pageId,
      siteId,
    };
    
    try {
      await saveToIndexedDB(snapshot);
      set({ snapshots: [snapshot, ...snapshots] });
      return snapshot;
    } catch (error) {
      throw new Error('Failed to save snapshot');
    }
  },
  
  restoreSnapshot: (id) => {
    const { snapshots } = get();
    const snapshot = snapshots.find(s => s.id === id);
    return snapshot?.data || null;
  },
  
  deleteSnapshot: async (id) => {
    const { snapshots } = get();
    
    try {
      await deleteFromIndexedDB(id);
      set({ snapshots: snapshots.filter(s => s.id !== id) });
    } catch (error) {
      throw new Error('Failed to delete snapshot');
    }
  },
  
  compareSnapshots: (id1, id2) => {
    const { snapshots } = get();
    const snap1 = snapshots.find(s => s.id === id1);
    const snap2 = snapshots.find(s => s.id === id2);
    
    if (!snap1 || !snap2) return null;
    
    return comparePageData(snap1.data, snap2.data);
  },
  
  compareToCurrent: (id, currentData) => {
    const { snapshots } = get();
    const snapshot = snapshots.find(s => s.id === id);
    
    if (!snapshot) return null;
    
    return comparePageData(snapshot.data, currentData);
  },
}));
```

**Acceptance Criteria:**
- [ ] Snapshots saved to IndexedDB
- [ ] Snapshots loaded for specific page
- [ ] Restore returns snapshot data
- [ ] Delete removes from IndexedDB
- [ ] Compare returns diff between states

---

### Task 4: Create History Entry Component

**Description:** Create the UI component for individual history entries.

**Files:**
- CREATE: `src/components/studio/features/history-entry.tsx`

**Code:**

```typescript
// src/components/studio/features/history-entry.tsx
'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Plus, 
  Trash2, 
  Move, 
  Edit3, 
  Copy, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff,
  Sparkles,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HistoryEntry, HistoryActionType } from '@/types/studio-history';

const actionIcons: Record<HistoryActionType, React.ComponentType<{ className?: string }>> = {
  'component.add': Plus,
  'component.delete': Trash2,
  'component.move': Move,
  'component.edit': Edit3,
  'component.duplicate': Copy,
  'component.lock': Lock,
  'component.unlock': Unlock,
  'component.hide': EyeOff,
  'component.show': Eye,
  'page.load': Layers,
  'page.generate': Sparkles,
  'snapshot.restore': RotateCcw,
  'bulk.action': Layers,
};

const actionColors: Record<HistoryActionType, string> = {
  'component.add': 'text-green-500',
  'component.delete': 'text-red-500',
  'component.move': 'text-blue-500',
  'component.edit': 'text-yellow-500',
  'component.duplicate': 'text-purple-500',
  'component.lock': 'text-amber-500',
  'component.unlock': 'text-amber-500',
  'component.hide': 'text-gray-500',
  'component.show': 'text-gray-500',
  'page.load': 'text-muted-foreground',
  'page.generate': 'text-primary',
  'snapshot.restore': 'text-primary',
  'bulk.action': 'text-muted-foreground',
};

interface HistoryEntryProps {
  entry: HistoryEntry;
  isCurrent: boolean;
  onClick: () => void;
}

export function HistoryEntryRow({ entry, isCurrent, onClick }: HistoryEntryProps) {
  const IconComponent = actionIcons[entry.action] || Edit3;
  const iconColor = actionColors[entry.action] || 'text-muted-foreground';
  
  const timeAgo = formatDistanceToNow(entry.timestamp, { addSuffix: true });
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left',
        'hover:bg-accent/50 transition-colors',
        isCurrent && 'bg-primary/10'
      )}
    >
      {/* Current indicator */}
      <div
        className={cn(
          'w-2 h-2 rounded-full shrink-0',
          isCurrent ? 'bg-primary' : 'bg-border'
        )}
      />
      
      {/* Action icon */}
      <IconComponent className={cn('h-4 w-4 shrink-0', iconColor)} />
      
      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm truncate',
          isCurrent && 'font-medium'
        )}>
          {entry.description}
        </p>
      </div>
      
      {/* Timestamp */}
      <span className="text-xs text-muted-foreground shrink-0">
        {timeAgo}
      </span>
    </button>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows action icon with color
- [ ] Displays description and time
- [ ] Current entry highlighted
- [ ] Clickable for navigation

---

### Task 5: Create Snapshot Row Component

**Description:** Create the UI component for snapshot entries.

**Files:**
- CREATE: `src/components/studio/features/snapshot-row.tsx`

**Code:**

```typescript
// src/components/studio/features/snapshot-row.tsx
'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Camera, RotateCcw, Trash2, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Snapshot } from '@/types/studio-history';

interface SnapshotRowProps {
  snapshot: Snapshot;
  onRestore: () => void;
  onDelete: () => void;
  onCompare: () => void;
}

export function SnapshotRow({ 
  snapshot, 
  onRestore, 
  onDelete,
  onCompare,
}: SnapshotRowProps) {
  const timeAgo = formatDistanceToNow(snapshot.timestamp, { addSuffix: true });
  const componentCount = Object.keys(snapshot.data.components).length;
  
  return (
    <div className="group flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
      {/* Thumbnail or icon */}
      <div className="shrink-0 w-12 h-12 rounded-md bg-muted flex items-center justify-center overflow-hidden">
        {snapshot.thumbnail ? (
          <img 
            src={snapshot.thumbnail} 
            alt={snapshot.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Camera className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{snapshot.name}</p>
        {snapshot.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {snapshot.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{timeAgo}</span>
          <span>•</span>
          <span>{componentCount} components</span>
        </div>
      </div>
      
      {/* Actions */}
      <div className={cn(
        'flex items-center gap-1 shrink-0',
        'opacity-0 group-hover:opacity-100 transition-opacity'
      )}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onCompare}
              >
                <GitCompare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Compare to current</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onRestore}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Restore snapshot</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete snapshot</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows snapshot name and description
- [ ] Displays thumbnail or icon
- [ ] Shows time and component count
- [ ] Restore, compare, delete buttons

---

### Task 6: Create Save Snapshot Dialog

**Description:** Create a dialog for saving named snapshots.

**Files:**
- CREATE: `src/components/studio/features/save-snapshot-dialog.tsx`

**Code:**

```typescript
// src/components/studio/features/save-snapshot-dialog.tsx
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Loader2 } from 'lucide-react';

interface SaveSnapshotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, description?: string) => Promise<void>;
}

export function SaveSnapshotDialog({
  open,
  onOpenChange,
  onSave,
}: SaveSnapshotDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && name.trim()) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Save Snapshot
          </DialogTitle>
          <DialogDescription>
            Save the current page state as a named snapshot. You can restore it later.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="snapshot-name">Name *</Label>
            <Input
              id="snapshot-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Before client feedback"
              autoFocus
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="snapshot-description">Description (optional)</Label>
            <Textarea
              id="snapshot-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes about this version..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Snapshot'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Acceptance Criteria:**
- [ ] Dialog with name and description fields
- [ ] Name is required
- [ ] Enter key submits
- [ ] Loading state while saving

---

### Task 7: Create Comparison Dialog

**Description:** Create a dialog showing differences between snapshots.

**Files:**
- CREATE: `src/components/studio/features/comparison-dialog.tsx`

**Code:**

```typescript
// src/components/studio/features/comparison-dialog.tsx
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Minus, Edit3, GitCompare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SnapshotDiff } from '@/types/studio-history';

interface ComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diff: SnapshotDiff | null;
  title?: string;
}

export function ComparisonDialog({
  open,
  onOpenChange,
  diff,
  title = 'Version Comparison',
}: ComparisonDialogProps) {
  if (!diff) return null;
  
  const hasChanges = 
    diff.componentsAdded.length > 0 || 
    diff.componentsRemoved.length > 0 || 
    diff.componentsModified.length > 0;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 p-1">
            {/* Summary */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Summary:</span>
              <span className="font-medium">{diff.summary}</span>
            </div>
            
            {!hasChanges && (
              <div className="text-center py-8 text-muted-foreground">
                No differences found
              </div>
            )}
            
            {/* Added components */}
            {diff.componentsAdded.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">
                    Added ({diff.componentsAdded.length})
                  </span>
                </div>
                <div className="grid gap-1 pl-6">
                  {diff.componentsAdded.map((comp) => (
                    <div
                      key={comp.id}
                      className="flex items-center gap-2 text-sm py-1 px-2 rounded bg-green-500/10 text-green-600"
                    >
                      <Badge variant="outline" className="text-xs">
                        {comp.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        {comp.id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Removed components */}
            {diff.componentsRemoved.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">
                    Removed ({diff.componentsRemoved.length})
                  </span>
                </div>
                <div className="grid gap-1 pl-6">
                  {diff.componentsRemoved.map((comp) => (
                    <div
                      key={comp.id}
                      className="flex items-center gap-2 text-sm py-1 px-2 rounded bg-red-500/10 text-red-600"
                    >
                      <Badge variant="outline" className="text-xs">
                        {comp.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        {comp.id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Modified components */}
            {diff.componentsModified.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">
                    Modified ({diff.componentsModified.length})
                  </span>
                </div>
                <div className="grid gap-2 pl-6">
                  {diff.componentsModified.map((comp) => (
                    <div
                      key={comp.id}
                      className="text-sm py-2 px-3 rounded border bg-card"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {comp.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          {comp.id}
                        </span>
                      </div>
                      <div className="grid gap-1">
                        {Object.entries(comp.changes).map(([prop, { old, new: newVal }]) => (
                          <div key={prop} className="text-xs grid grid-cols-[100px_1fr] gap-2">
                            <span className="font-medium text-muted-foreground">
                              {prop}:
                            </span>
                            <div className="grid gap-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-red-500">-</span>
                                <span className="text-red-600 truncate">
                                  {JSON.stringify(old)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-green-500">+</span>
                                <span className="text-green-600 truncate">
                                  {JSON.stringify(newVal)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows added/removed/modified components
- [ ] Color-coded changes
- [ ] Shows property-level diffs
- [ ] Scrollable for long diffs

---

### Task 8: Create History Panel Component

**Description:** Create the main history panel combining history timeline and snapshots.

**Files:**
- CREATE: `src/components/studio/features/history-panel.tsx`

**Code:**

```typescript
// src/components/studio/features/history-panel.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  History, 
  Camera, 
  RotateCcw, 
  RotateCw, 
  Trash2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/lib/studio/store/editor-store';
import { useHistoryStore } from '@/lib/studio/store/history-store';
import { useSnapshotStore } from '@/lib/studio/store/snapshot-store';
import { HistoryEntryRow } from './history-entry';
import { SnapshotRow } from './snapshot-row';
import { SaveSnapshotDialog } from './save-snapshot-dialog';
import { ComparisonDialog } from './comparison-dialog';
import type { SnapshotDiff } from '@/types/studio-history';

interface HistoryPanelProps {
  className?: string;
}

export function HistoryPanel({ className }: HistoryPanelProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [comparisonDiff, setComparisonDiff] = useState<SnapshotDiff | null>(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  
  const { pageData, setPageData, pageId, siteId } = useEditorStore();
  const { 
    entries, 
    currentIndex, 
    jumpToEntry, 
    clearHistory,
    getUndoDescription,
    getRedoDescription,
  } = useHistoryStore();
  const {
    snapshots,
    isLoading,
    setContext,
    loadSnapshots,
    saveSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    compareToCurrent,
  } = useSnapshotStore();
  
  // Set snapshot context and load on mount
  useEffect(() => {
    if (pageId && siteId) {
      setContext(pageId, siteId);
      loadSnapshots();
    }
  }, [pageId, siteId, setContext, loadSnapshots]);
  
  // Handlers
  const handleUndo = useCallback(() => {
    const { undo } = useEditorStore.temporal.getState();
    undo();
  }, []);
  
  const handleRedo = useCallback(() => {
    const { redo } = useEditorStore.temporal.getState();
    redo();
  }, []);
  
  const handleJumpToEntry = useCallback((entryId: string) => {
    const data = jumpToEntry(entryId);
    if (data) {
      setPageData(data);
      toast.success('Jumped to history point');
    }
  }, [jumpToEntry, setPageData]);
  
  const handleSaveSnapshot = useCallback(async (name: string, description?: string) => {
    try {
      await saveSnapshot(name, pageData, description);
      toast.success('Snapshot saved');
    } catch (error) {
      toast.error('Failed to save snapshot');
    }
  }, [saveSnapshot, pageData]);
  
  const handleRestoreSnapshot = useCallback((id: string) => {
    const data = restoreSnapshot(id);
    if (data) {
      setPageData(data);
      toast.success('Snapshot restored');
    }
  }, [restoreSnapshot, setPageData]);
  
  const handleDeleteSnapshot = useCallback(async () => {
    if (!deleteConfirmId) return;
    
    try {
      await deleteSnapshot(deleteConfirmId);
      toast.success('Snapshot deleted');
    } catch (error) {
      toast.error('Failed to delete snapshot');
    } finally {
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, deleteSnapshot]);
  
  const handleCompareSnapshot = useCallback((id: string) => {
    const diff = compareToCurrent(id, pageData);
    if (diff) {
      setComparisonDiff(diff);
      setComparisonOpen(true);
    }
  }, [compareToCurrent, pageData]);
  
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < entries.length - 1;
  
  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      <Tabs defaultValue="history" className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <TabsList className="h-8">
            <TabsTrigger value="history" className="text-xs px-3">
              <History className="h-3.5 w-3.5 mr-1.5" />
              History
            </TabsTrigger>
            <TabsTrigger value="snapshots" className="text-xs px-3">
              <Camera className="h-3.5 w-3.5 mr-1.5" />
              Snapshots
            </TabsTrigger>
          </TabsList>
          
          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleUndo}
                    disabled={!canUndo}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {canUndo ? `Undo: ${getUndoDescription()}` : 'Nothing to undo'}
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleRedo}
                    disabled={!canRedo}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {canRedo ? `Redo: ${getRedoDescription()}` : 'Nothing to redo'}
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
        
        <TabsContent value="history" className="flex-1 mt-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No history yet</p>
                  <p className="text-xs mt-1">Changes will appear here</p>
                </div>
              ) : (
                <>
                  {entries.slice().reverse().map((entry, reverseIndex) => {
                    const actualIndex = entries.length - 1 - reverseIndex;
                    return (
                      <HistoryEntryRow
                        key={entry.id}
                        entry={entry}
                        isCurrent={actualIndex === currentIndex}
                        onClick={() => handleJumpToEntry(entry.id)}
                      />
                    );
                  })}
                  
                  <div className="pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground"
                      onClick={clearHistory}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear History
                    </Button>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="snapshots" className="flex-1 mt-0 data-[state=inactive]:hidden">
          <div className="p-2 border-b">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setSaveDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Save Current State
            </Button>
          </div>
          
          <ScrollArea className="h-[calc(100%-52px)]">
            <div className="p-2 space-y-2">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading snapshots...
                </div>
              ) : snapshots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Camera className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No snapshots yet</p>
                  <p className="text-xs mt-1">Save important states to restore later</p>
                </div>
              ) : (
                snapshots.map((snapshot) => (
                  <SnapshotRow
                    key={snapshot.id}
                    snapshot={snapshot}
                    onRestore={() => handleRestoreSnapshot(snapshot.id)}
                    onDelete={() => setDeleteConfirmId(snapshot.id)}
                    onCompare={() => handleCompareSnapshot(snapshot.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      
      {/* Save Snapshot Dialog */}
      <SaveSnapshotDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveSnapshot}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!deleteConfirmId} 
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Snapshot?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The snapshot will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSnapshot}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Comparison Dialog */}
      <ComparisonDialog
        open={comparisonOpen}
        onOpenChange={setComparisonOpen}
        diff={comparisonDiff}
        title="Compare to Current"
      />
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Tabs for history and snapshots
- [ ] History shows timeline with current indicator
- [ ] Click entry to jump
- [ ] Undo/redo buttons with descriptions
- [ ] Save snapshot button opens dialog
- [ ] Snapshot list with restore/delete/compare
- [ ] Delete confirmation
- [ ] Comparison dialog shows diffs

---

### Task 9: Integrate History Panel into Right Panel

**Description:** Add a History tab or section to the right panel.

**Files:**
- MODIFY: `src/components/studio/panels/right-panel.tsx`

**Code:**

```typescript
// Add to right-panel.tsx - add History tab alongside Properties

import { HistoryPanel } from '@/components/studio/features/history-panel';

// In the panel, add tabs:
<Tabs defaultValue="properties" className="flex-1 flex flex-col">
  <TabsList className="mx-3 mt-2">
    <TabsTrigger value="properties">Properties</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
  </TabsList>
  
  <TabsContent value="properties" className="flex-1">
    {/* Existing properties panel content */}
  </TabsContent>
  
  <TabsContent value="history" className="flex-1">
    <HistoryPanel />
  </TabsContent>
</Tabs>
```

**Acceptance Criteria:**
- [ ] History tab in right panel
- [ ] Switches between Properties and History
- [ ] HistoryPanel renders correctly

---

### Task 10: Connect History Recording to Editor Actions

**Description:** Record history entries when editor actions occur.

**Files:**
- MODIFY: `src/lib/studio/store/editor-store.ts`

**Code:**

```typescript
// In editor-store.ts, add history recording to actions

import { useHistoryStore } from './history-store';

// In addComponent action:
addComponent: (componentType, parentId) => {
  set((state) => {
    // ... existing logic to add component
    const newId = nanoid();
    // ...
  });
  
  // Record to history
  const { pageData } = get();
  useHistoryStore.getState().recordAction(
    'component.add',
    pageData,
    undefined,
    componentType
  );
},

// In deleteComponent action:
deleteComponent: (id) => {
  const { pageData } = get();
  const component = pageData.components[id];
  
  set((state) => {
    // ... existing delete logic
  });
  
  useHistoryStore.getState().recordAction(
    'component.delete',
    get().pageData,
    id,
    component?.type
  );
},

// In setComponentProps action:
setComponentProps: (id, props) => {
  const { pageData } = get();
  const component = pageData.components[id];
  
  set((state) => {
    // ... existing update logic
  });
  
  useHistoryStore.getState().recordAction(
    'component.edit',
    get().pageData,
    id,
    component?.type
  );
},

// Similarly for: moveComponent, duplicateComponent, lockComponent, hideComponent, etc.
```

**Acceptance Criteria:**
- [ ] Adding component records history
- [ ] Deleting component records history
- [ ] Editing props records history
- [ ] Moving component records history
- [ ] Lock/hide actions record history

---

### Task 11: Export History Components

**Description:** Export all history-related components.

**Files:**
- MODIFY: `src/components/studio/features/index.ts`

**Code:**

```typescript
// Add to src/components/studio/features/index.ts
export { HistoryPanel } from './history-panel';
export { HistoryEntryRow } from './history-entry';
export { SnapshotRow } from './snapshot-row';
export { SaveSnapshotDialog } from './save-snapshot-dialog';
export { ComparisonDialog } from './comparison-dialog';

// Add to src/lib/studio/store/index.ts
export { useHistoryStore } from './history-store';
export { useSnapshotStore } from './snapshot-store';
```

**Acceptance Criteria:**
- [ ] All components exported
- [ ] All stores exported

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| CREATE | `src/types/studio-history.ts` | History and snapshot types |
| CREATE | `src/lib/studio/store/history-store.ts` | History metadata store |
| CREATE | `src/lib/studio/store/snapshot-store.ts` | Snapshot store with IndexedDB |
| CREATE | `src/components/studio/features/history-entry.tsx` | History entry row |
| CREATE | `src/components/studio/features/snapshot-row.tsx` | Snapshot row |
| CREATE | `src/components/studio/features/save-snapshot-dialog.tsx` | Save dialog |
| CREATE | `src/components/studio/features/comparison-dialog.tsx` | Comparison dialog |
| CREATE | `src/components/studio/features/history-panel.tsx` | Main history panel |
| MODIFY | `src/components/studio/panels/right-panel.tsx` | Add History tab |
| MODIFY | `src/lib/studio/store/editor-store.ts` | Connect history recording |
| MODIFY | `src/components/studio/features/index.ts` | Export components |
| MODIFY | `src/lib/studio/store/index.ts` | Export stores |

## Testing Requirements

### Unit Tests
- [ ] History store records actions correctly
- [ ] jumpToEntry returns correct data
- [ ] Snapshot store saves/loads from IndexedDB
- [ ] comparePageData detects differences correctly

### Integration Tests
- [ ] History entries appear when editing
- [ ] Click entry jumps to that state
- [ ] Undo/redo buttons work
- [ ] Snapshot saves and restores

### Manual Testing
- [ ] Make several edits and verify history
- [ ] Click history entry to jump back
- [ ] Save a snapshot with name
- [ ] Restore snapshot and verify state
- [ ] Compare snapshot to current
- [ ] Delete snapshot with confirmation
- [ ] Clear history

## Dependencies to Install

```bash
pnpm add date-fns  # For time formatting (if not already installed)
```

## Rollback Plan

1. Remove new files in `src/components/studio/features/`
2. Remove store files
3. Remove `src/types/studio-history.ts`
4. Revert changes to right-panel.tsx
5. Revert changes to editor-store.ts

## Success Criteria

- [ ] History panel shows in right panel with tab
- [ ] All editor actions recorded with descriptions
- [ ] Click history entry to jump to that state
- [ ] Undo/redo buttons work with tooltips
- [ ] Named snapshots can be saved
- [ ] Snapshots persist in IndexedDB
- [ ] Snapshots can be restored
- [ ] Snapshots can be deleted with confirmation
- [ ] Comparison shows added/removed/modified
- [ ] History limited to 50 entries
- [ ] Clear history button works
