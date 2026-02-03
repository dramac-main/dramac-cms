/**
 * DRAMAC Studio Snapshot Store
 * 
 * Manages named snapshots with IndexedDB persistence.
 * Created in PHASE-STUDIO-17.
 */

'use client';

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Snapshot, SnapshotState, SnapshotDiff } from '@/types/studio-history';
import type { StudioPageData } from '@/types/studio';

// =============================================================================
// INDEXEDDB CONFIGURATION
// =============================================================================

const DB_NAME = 'dramac-studio';
const STORE_NAME = 'snapshots';
const DB_VERSION = 1;

// =============================================================================
// INDEXEDDB HELPERS
// =============================================================================

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

// =============================================================================
// COMPARISON UTILITY
// =============================================================================

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

// =============================================================================
// STORE
// =============================================================================

interface SnapshotStore extends SnapshotState {
  /** Current page context */
  pageId: string | null;
  siteId: string | null;
  
  /** Set page context */
  setContext: (pageId: string, siteId: string) => void;
  
  /** Load snapshots for current page */
  loadSnapshots: () => Promise<void>;
  
  /** Save a new snapshot */
  saveSnapshot: (
    name: string, 
    data: StudioPageData, 
    description?: string,
    thumbnail?: string
  ) => Promise<Snapshot>;
  
  /** Restore a snapshot (returns the data) */
  restoreSnapshot: (id: string) => StudioPageData | null;
  
  /** Delete a snapshot */
  deleteSnapshot: (id: string) => Promise<void>;
  
  /** Compare two snapshots */
  compareSnapshots: (id1: string, id2: string) => SnapshotDiff | null;
  
  /** Compare snapshot to current page data */
  compareToCurrent: (id: string, currentData: StudioPageData) => SnapshotDiff | null;
}

export const useSnapshotStore = create<SnapshotStore>((set, get) => ({
  // Initial state
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
    if (!snapshot) return null;
    return JSON.parse(JSON.stringify(snapshot.data));
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
