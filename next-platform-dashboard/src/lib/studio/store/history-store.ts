/**
 * DRAMAC Studio History Store
 * 
 * Tracks history metadata alongside zundo for UI display.
 * Created in PHASE-STUDIO-17.
 */

'use client';

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { 
  HistoryEntry, 
  HistoryActionType, 
  HistoryMetadata 
} from '@/types/studio-history';
import type { StudioPageData } from '@/types/studio';

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_HISTORY_ENTRIES = 50;

// =============================================================================
// TYPES
// =============================================================================

interface HistoryStore extends HistoryMetadata {
  /** Record a new action */
  recordAction: (
    action: HistoryActionType,
    data: StudioPageData,
    componentId?: string,
    componentType?: string,
    customDescription?: string
  ) => void;
  
  /** Jump to a specific history entry */
  jumpToEntry: (entryId: string) => StudioPageData | null;
  
  /** Clear all history */
  clearHistory: () => void;
  
  /** Get description for undo action */
  getUndoDescription: () => string | null;
  
  /** Get description for redo action */
  getRedoDescription: () => string | null;
  
  /** Mark current index moved (after undo/redo) */
  markUndo: () => void;
  markRedo: () => void;
}

// =============================================================================
// DESCRIPTION GENERATOR
// =============================================================================

/**
 * Generate human-readable description for an action
 */
function generateDescription(
  action: HistoryActionType,
  componentType?: string,
  customDescription?: string
): string {
  if (customDescription) return customDescription;
  
  const typeLabel = componentType ? formatType(componentType) : 'component';
  
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

/**
 * Format component type for display
 */
function formatType(type: string): string {
  return type.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
}

// =============================================================================
// STORE
// =============================================================================

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  // Initial state
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
    return JSON.parse(JSON.stringify(entries[index].data));
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
  
  markUndo: () => {
    set((state) => ({
      currentIndex: Math.max(0, state.currentIndex - 1),
    }));
  },
  
  markRedo: () => {
    set((state) => ({
      currentIndex: Math.min(state.entries.length - 1, state.currentIndex + 1),
    }));
  },
}));
