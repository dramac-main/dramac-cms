/**
 * DRAMAC Studio History & Versioning Types
 * 
 * Types for history tracking and snapshot management.
 * Created in PHASE-STUDIO-17.
 */

import type { StudioPageData } from './studio';

// =============================================================================
// HISTORY ACTION TYPES
// =============================================================================

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

// =============================================================================
// HISTORY ENTRY
// =============================================================================

/**
 * A single history entry with metadata
 */
export interface HistoryEntry {
  /** Unique entry ID */
  id: string;
  
  /** When this action occurred */
  timestamp: number;
  
  /** Type of action */
  action: HistoryActionType;
  
  /** Related component ID (if applicable) */
  componentId?: string;
  
  /** Component type (if applicable) */
  componentType?: string;
  
  /** Human-readable description */
  description: string;
  
  /** Full page state at this point */
  data: StudioPageData;
}

// =============================================================================
// SNAPSHOT TYPES
// =============================================================================

/**
 * A named snapshot that can be saved/restored
 */
export interface Snapshot {
  /** Unique snapshot ID */
  id: string;
  
  /** User-given name */
  name: string;
  
  /** Optional description */
  description?: string;
  
  /** When snapshot was created */
  timestamp: number;
  
  /** Full page state */
  data: StudioPageData;
  
  /** Optional thumbnail (base64) */
  thumbnail?: string;
  
  /** Associated page ID */
  pageId: string;
  
  /** Associated site ID */
  siteId: string;
}

/**
 * Difference between two snapshots or states
 */
export interface SnapshotDiff {
  /** Components that were added */
  componentsAdded: Array<{
    id: string;
    type: string;
  }>;
  
  /** Components that were removed */
  componentsRemoved: Array<{
    id: string;
    type: string;
  }>;
  
  /** Components that were modified */
  componentsModified: Array<{
    id: string;
    type: string;
    changes: Record<string, { old: unknown; new: unknown }>;
  }>;
  
  /** Summary text */
  summary: string;
}

// =============================================================================
// STORE STATE TYPES
// =============================================================================

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

// =============================================================================
// LAYER TYPES (for PHASE-STUDIO-16)
// =============================================================================

/**
 * Layer item for tree rendering
 */
export interface LayerItem {
  /** Component ID or Zone ID */
  id: string;
  
  /** Component type or 'Zone' for zones */
  type: string;
  
  /** Display label (from props or type) */
  label: string;
  
  /** Icon name */
  icon: string;
  
  /** Child layers */
  children: LayerItem[];
  
  /** Is component locked? */
  isLocked: boolean;
  
  /** Is component hidden? */
  isHidden: boolean;
  
  /** Is this layer selected? */
  isSelected: boolean;
  
  /** Is this layer expanded in tree? */
  isExpanded: boolean;
  
  /** Nesting depth (0 = root level) */
  depth: number;
  
  /** Parent component ID */
  parentId?: string;
  
  /** Has children? */
  hasChildren: boolean;
  
  // Zone-specific properties (Phase STUDIO-19)
  
  /** Is this a zone entry? */
  isZone?: boolean;
  
  /** Zone name (only for zones) */
  zoneName?: string;
  
  /** Parent component ID that owns the zone */
  zoneParentId?: string;
}

/**
 * Layer actions for context menu
 */
export type LayerAction = 
  | 'rename'
  | 'duplicate'
  | 'delete'
  | 'lock'
  | 'unlock'
  | 'hide'
  | 'show'
  | 'moveUp'
  | 'moveDown'
  | 'copyId';
