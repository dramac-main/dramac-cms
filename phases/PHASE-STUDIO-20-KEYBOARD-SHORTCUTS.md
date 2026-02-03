# PHASE-STUDIO-20: Keyboard Shortcuts & Command Palette

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-20 |
| Title | Keyboard Shortcuts & Command Palette |
| Priority | Medium |
| Estimated Time | 8-10 hours |
| Dependencies | STUDIO-02 (Store), STUDIO-06 (Canvas), STUDIO-16 (Layers) |
| Risk Level | Low |

## Problem Statement

Currently, DRAMAC Studio requires mouse interaction for every action. Professional editors like Figma, Webflow, and VS Code are keyboard-first, allowing power users to work at lightning speed.

Without keyboard shortcuts:
- Users must click buttons for common actions (save, undo, delete)
- No quick search/command palette for actions
- Copy/paste between components doesn't work
- No way to see available shortcuts

This phase implements a **full keyboard shortcut system**:
- All major actions mapped to shortcuts
- Command palette (Cmd/Ctrl+K) for searching actions
- Shortcuts help panel
- Clipboard system for copy/paste
- Smart shortcut detection (don't fire in text inputs)

## Goals

- [ ] Create `use-studio-shortcuts` hook with all shortcuts
- [ ] Implement command palette with shadcn/ui Command component
- [ ] Create shortcuts help panel accessible from toolbar
- [ ] Build clipboard system for copy/paste components
- [ ] Ensure shortcuts don't interfere with text inputs
- [ ] Support both Mac and Windows key conventions
- [ ] Add shortcuts for zoom, preview, and AI features

## Technical Approach

### Shortcut System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  STUDIO PROVIDER                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ useStudioShortcuts() ← Registers all keyboard listeners     ││
│  │ ┌───────────────────────────────────────────────────────┐   ││
│  │ │ react-hotkeys-hook                                     │   ││
│  │ │ ─────────────────                                      │   ││
│  │ │ mod+s → save()                                         │   ││
│  │ │ mod+z → undo()                                         │   ││
│  │ │ mod+shift+z → redo()                                   │   ││
│  │ │ delete/backspace → deleteComponent()                   │   ││
│  │ │ mod+d → duplicateComponent()                           │   ││
│  │ │ mod+c → copyToClipboard()                              │   ││
│  │ │ mod+v → pasteFromClipboard()                           │   ││
│  │ │ escape → deselect()                                    │   ││
│  │ │ mod+k → openCommandPalette()                           │   ││
│  │ └───────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ COMMAND PALETTE (Cmd+K)                                     ││
│  │ ┌───────────────────────────────────────────────────────┐   ││
│  │ │ 🔍 Type a command...                                   │   ││
│  │ ├───────────────────────────────────────────────────────┤   ││
│  │ │ File                                                   │   ││
│  │ │   💾 Save Page                           ⌘S            │   ││
│  │ │   👁️ Toggle Preview                      ⌘P            │   ││
│  │ ├───────────────────────────────────────────────────────┤   ││
│  │ │ Edit                                                   │   ││
│  │ │   ↶ Undo                                 ⌘Z            │   ││
│  │ │   ↷ Redo                                 ⌘⇧Z           │   ││
│  │ │   🗑️ Delete Component                    Del           │   ││
│  │ │   📋 Duplicate                           ⌘D            │   ││
│  │ ├───────────────────────────────────────────────────────┤   ││
│  │ │ Components                                             │   ││
│  │ │   📝 Add Heading                                       │   ││
│  │ │   📄 Add Text                                          │   ││
│  │ │   🔘 Add Button                                        │   ││
│  │ └───────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Key Bindings Map

| Action | Windows/Linux | Mac | Hook |
|--------|--------------|-----|------|
| Save | Ctrl+S | Cmd+S | `mod+s` |
| Undo | Ctrl+Z | Cmd+Z | `mod+z` |
| Redo | Ctrl+Shift+Z | Cmd+Shift+Z | `mod+shift+z` |
| Delete | Delete/Backspace | Delete/Backspace | `delete, backspace` |
| Duplicate | Ctrl+D | Cmd+D | `mod+d` |
| Copy | Ctrl+C | Cmd+C | `mod+c` |
| Paste | Ctrl+V | Cmd+V | `mod+v` |
| Deselect | Escape | Escape | `escape` |
| Command Palette | Ctrl+K | Cmd+K | `mod+k` |
| Zoom In | Ctrl+= | Cmd+= | `mod+=, mod+plus` |
| Zoom Out | Ctrl+- | Cmd+- | `mod+-` |
| Reset Zoom | Ctrl+0 | Cmd+0 | `mod+0` |
| Preview | Ctrl+P | Cmd+P | `mod+p` |
| AI Chat | Ctrl+/ | Cmd+/ | `mod+/` |
| Shortcuts Help | Ctrl+? | Cmd+? | `mod+shift+/` |

### Input Focus Detection

Critical: Don't fire shortcuts when user is typing in text fields.

```typescript
function isInputFocused(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;
  
  const tagName = activeElement.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea') return true;
  if (activeElement.getAttribute('contenteditable') === 'true') return true;
  if (activeElement.closest('[data-radix-focus-guard]')) return true;
  
  return false;
}
```

## Implementation Tasks

### Task 1: Create Clipboard Module

**Description:** Module for copying/pasting components with proper ID regeneration.

**Files:**
- CREATE: `src/lib/studio/clipboard.ts`

**Code:**
```typescript
// src/lib/studio/clipboard.ts

import { StudioComponent } from '@/types/studio';
import { generateId } from '@/lib/studio/utils/id-utils';
import { toast } from 'sonner';

interface ClipboardData {
  type: 'studio-component';
  component: StudioComponent;
  children?: StudioComponent[];
  timestamp: number;
}

// In-memory clipboard (survives page refreshes via sessionStorage backup)
let clipboardData: ClipboardData | null = null;

const STORAGE_KEY = 'studio-clipboard';

// Initialize from session storage
if (typeof window !== 'undefined') {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      clipboardData = JSON.parse(stored);
    }
  } catch (e) {
    // Ignore parse errors
  }
}

/**
 * Copy a component (and its children) to clipboard
 */
export function copyToClipboard(
  component: StudioComponent,
  allComponents: Record<string, StudioComponent>
): void {
  // Get all children recursively
  const children: StudioComponent[] = [];
  
  function collectChildren(comp: StudioComponent) {
    if (comp.children) {
      for (const childId of comp.children) {
        const child = allComponents[childId];
        if (child) {
          children.push(structuredClone(child));
          collectChildren(child);
        }
      }
    }
  }
  
  collectChildren(component);
  
  clipboardData = {
    type: 'studio-component',
    component: structuredClone(component),
    children,
    timestamp: Date.now(),
  };
  
  // Backup to session storage
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(clipboardData));
  } catch (e) {
    // Session storage might be full or disabled
  }
  
  toast.success('Component copied');
}

/**
 * Get clipboard contents with regenerated IDs
 */
export function getClipboardData(): {
  component: StudioComponent;
  children: StudioComponent[];
  idMap: Map<string, string>;
} | null {
  if (!clipboardData || clipboardData.type !== 'studio-component') {
    return null;
  }
  
  const idMap = new Map<string, string>();
  
  // Generate new ID for main component
  const oldId = clipboardData.component.id;
  const newId = generateId();
  idMap.set(oldId, newId);
  
  // Generate new IDs for all children
  for (const child of clipboardData.children || []) {
    const newChildId = generateId();
    idMap.set(child.id, newChildId);
  }
  
  // Clone and update main component
  const newComponent: StudioComponent = {
    ...structuredClone(clipboardData.component),
    id: newId,
    children: clipboardData.component.children?.map(childId => idMap.get(childId) || childId),
  };
  
  // Clone and update children
  const newChildren: StudioComponent[] = (clipboardData.children || []).map(child => ({
    ...structuredClone(child),
    id: idMap.get(child.id)!,
    parentId: child.parentId ? idMap.get(child.parentId) : undefined,
    children: child.children?.map(childId => idMap.get(childId) || childId),
  }));
  
  return {
    component: newComponent,
    children: newChildren,
    idMap,
  };
}

/**
 * Check if clipboard has data
 */
export function hasClipboardData(): boolean {
  return clipboardData !== null && clipboardData.type === 'studio-component';
}

/**
 * Clear clipboard
 */
export function clearClipboard(): void {
  clipboardData = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // Ignore
  }
}

/**
 * Get clipboard timestamp
 */
export function getClipboardTimestamp(): number | null {
  return clipboardData?.timestamp ?? null;
}
```

**Acceptance Criteria:**
- [ ] Components can be copied to clipboard
- [ ] Clipboard survives across in-page navigation
- [ ] IDs are regenerated on paste
- [ ] Children are copied with parent
- [ ] Toast notification on copy

---

### Task 2: Create Studio Shortcuts Hook

**Description:** Main hook that registers all keyboard shortcuts for the editor.

**Files:**
- CREATE: `src/lib/studio/hooks/use-studio-shortcuts.ts`

**Code:**
```typescript
// src/lib/studio/hooks/use-studio-shortcuts.ts

import { useCallback, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useEditorStore } from '@/lib/studio/store/editor-store';
import { useUIStore } from '@/lib/studio/store/ui-store';
import { useSelectionStore } from '@/lib/studio/store/selection-store';
import { copyToClipboard, getClipboardData, hasClipboardData } from '@/lib/studio/clipboard';
import { toast } from 'sonner';

/**
 * Check if an input or editable element is focused
 */
function isInputFocused(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;
  
  const tagName = activeElement.tagName.toLowerCase();
  
  // Check standard form elements
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }
  
  // Check contenteditable
  if (activeElement.getAttribute('contenteditable') === 'true') {
    return true;
  }
  
  // Check if inside a TipTap editor
  if (activeElement.closest('.ProseMirror')) {
    return true;
  }
  
  // Check Radix focus guards (modals, dialogs)
  if (activeElement.closest('[data-radix-focus-guard]')) {
    return true;
  }
  
  return false;
}

interface UseStudioShortcutsOptions {
  enabled?: boolean;
  onSave?: () => Promise<void>;
}

export function useStudioShortcuts(options: UseStudioShortcutsOptions = {}) {
  const { enabled = true, onSave } = options;
  
  // Editor store actions
  const components = useEditorStore(s => s.components);
  const deleteComponent = useEditorStore(s => s.deleteComponent);
  const duplicateComponent = useEditorStore(s => s.duplicateComponent);
  const addComponent = useEditorStore(s => s.addComponent);
  const undo = useEditorStore.temporal.getState().undo;
  const redo = useEditorStore.temporal.getState().redo;
  
  // Selection store
  const selectedId = useSelectionStore(s => s.selectedId);
  const deselectComponent = useSelectionStore(s => s.deselectComponent);
  
  // UI store actions
  const setCommandPaletteOpen = useUIStore(s => s.setCommandPaletteOpen);
  const setShortcutsPanelOpen = useUIStore(s => s.setShortcutsPanelOpen);
  const setPreviewMode = useUIStore(s => s.setPreviewMode);
  const previewMode = useUIStore(s => s.previewMode);
  const zoomIn = useUIStore(s => s.zoomIn);
  const zoomOut = useUIStore(s => s.zoomOut);
  const setZoom = useUIStore(s => s.setZoom);
  const setAIChatOpen = useUIStore(s => s.setAIChatOpen);
  
  // Save (Cmd+S / Ctrl+S)
  useHotkeys('mod+s', (e) => {
    e.preventDefault();
    if (onSave) {
      onSave().catch((err) => {
        toast.error('Failed to save');
        console.error(err);
      });
    }
  }, { enabled, enableOnFormTags: false });
  
  // Undo (Cmd+Z / Ctrl+Z)
  useHotkeys('mod+z', (e) => {
    if (isInputFocused()) return;
    e.preventDefault();
    undo();
    toast.success('Undo');
  }, { enabled });
  
  // Redo (Cmd+Shift+Z / Ctrl+Shift+Z or Cmd+Y / Ctrl+Y)
  useHotkeys('mod+shift+z, mod+y', (e) => {
    if (isInputFocused()) return;
    e.preventDefault();
    redo();
    toast.success('Redo');
  }, { enabled });
  
  // Delete (Delete / Backspace)
  useHotkeys('delete, backspace', (e) => {
    if (isInputFocused()) return;
    if (!selectedId) return;
    
    const component = components[selectedId];
    if (component?.locked) {
      toast.error('Component is locked');
      return;
    }
    
    e.preventDefault();
    deleteComponent(selectedId);
    toast.success('Component deleted');
  }, { enabled });
  
  // Duplicate (Cmd+D / Ctrl+D)
  useHotkeys('mod+d', (e) => {
    if (isInputFocused()) return;
    if (!selectedId) return;
    
    e.preventDefault();
    const newId = duplicateComponent(selectedId);
    if (newId) {
      toast.success('Component duplicated');
    }
  }, { enabled });
  
  // Copy (Cmd+C / Ctrl+C)
  useHotkeys('mod+c', (e) => {
    if (isInputFocused()) return;
    if (!selectedId) return;
    
    const component = components[selectedId];
    if (!component) return;
    
    e.preventDefault();
    copyToClipboard(component, components);
  }, { enabled });
  
  // Paste (Cmd+V / Ctrl+V)
  useHotkeys('mod+v', (e) => {
    if (isInputFocused()) return;
    if (!hasClipboardData()) return;
    
    e.preventDefault();
    
    const clipboardContent = getClipboardData();
    if (!clipboardContent) return;
    
    const { component, children } = clipboardContent;
    
    // Add main component
    addComponent(component, selectedId);
    
    // Add children
    for (const child of children) {
      // Children are added via their parent reference
      useEditorStore.getState().components[child.id] = child;
    }
    
    toast.success('Component pasted');
  }, { enabled });
  
  // Deselect (Escape)
  useHotkeys('escape', () => {
    // Close command palette if open
    if (useUIStore.getState().commandPaletteOpen) {
      setCommandPaletteOpen(false);
      return;
    }
    
    // Close shortcuts panel if open
    if (useUIStore.getState().shortcutsPanelOpen) {
      setShortcutsPanelOpen(false);
      return;
    }
    
    // Close AI chat if open
    if (useUIStore.getState().aiChatOpen) {
      setAIChatOpen(false);
      return;
    }
    
    // Exit preview mode
    if (previewMode) {
      setPreviewMode(false);
      return;
    }
    
    // Deselect component
    if (selectedId) {
      deselectComponent();
    }
  }, { enabled });
  
  // Command Palette (Cmd+K / Ctrl+K)
  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    setCommandPaletteOpen(true);
  }, { enabled, enableOnFormTags: true });
  
  // Shortcuts Help (Cmd+? / Ctrl+?)
  useHotkeys('mod+shift+/', (e) => {
    e.preventDefault();
    setShortcutsPanelOpen(true);
  }, { enabled });
  
  // Zoom In (Cmd++ / Ctrl++)
  useHotkeys('mod+=, mod+plus', (e) => {
    e.preventDefault();
    zoomIn();
  }, { enabled });
  
  // Zoom Out (Cmd+- / Ctrl+-)
  useHotkeys('mod+-', (e) => {
    e.preventDefault();
    zoomOut();
  }, { enabled });
  
  // Reset Zoom (Cmd+0 / Ctrl+0)
  useHotkeys('mod+0', (e) => {
    e.preventDefault();
    setZoom(100);
  }, { enabled });
  
  // Fit to Screen (Cmd+1 / Ctrl+1)
  useHotkeys('mod+1', (e) => {
    e.preventDefault();
    // Trigger fit calculation
    useUIStore.getState().fitToScreen();
  }, { enabled });
  
  // Toggle Preview (Cmd+P / Ctrl+P)
  useHotkeys('mod+p', (e) => {
    e.preventDefault();
    setPreviewMode(!previewMode);
    toast.success(previewMode ? 'Edit mode' : 'Preview mode');
  }, { enabled });
  
  // Open AI Chat for Selected (Cmd+/ / Ctrl+/)
  useHotkeys('mod+/', (e) => {
    if (!selectedId) {
      toast.error('Select a component first');
      return;
    }
    e.preventDefault();
    setAIChatOpen(true);
  }, { enabled });
  
  // Arrow keys for selection navigation
  useHotkeys('up', (e) => {
    if (isInputFocused()) return;
    e.preventDefault();
    // Navigate to previous sibling or parent
    const selection = useSelectionStore.getState();
    selection.selectPrevious();
  }, { enabled });
  
  useHotkeys('down', (e) => {
    if (isInputFocused()) return;
    e.preventDefault();
    // Navigate to next sibling or first child
    const selection = useSelectionStore.getState();
    selection.selectNext();
  }, { enabled });
}

// Export shortcut definitions for the help panel
export const SHORTCUT_DEFINITIONS = [
  {
    category: 'General',
    shortcuts: [
      { keys: ['⌘/Ctrl', 'S'], description: 'Save page' },
      { keys: ['⌘/Ctrl', 'Z'], description: 'Undo' },
      { keys: ['⌘/Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['⌘/Ctrl', 'K'], description: 'Open command palette' },
      { keys: ['⌘/Ctrl', '?'], description: 'Show keyboard shortcuts' },
      { keys: ['Esc'], description: 'Deselect / Close panel' },
    ],
  },
  {
    category: 'Components',
    shortcuts: [
      { keys: ['Delete'], description: 'Delete selected component' },
      { keys: ['⌘/Ctrl', 'D'], description: 'Duplicate selected' },
      { keys: ['⌘/Ctrl', 'C'], description: 'Copy component' },
      { keys: ['⌘/Ctrl', 'V'], description: 'Paste component' },
      { keys: ['↑'], description: 'Select previous component' },
      { keys: ['↓'], description: 'Select next component' },
    ],
  },
  {
    category: 'View',
    shortcuts: [
      { keys: ['⌘/Ctrl', 'P'], description: 'Toggle preview mode' },
      { keys: ['⌘/Ctrl', '+'], description: 'Zoom in' },
      { keys: ['⌘/Ctrl', '-'], description: 'Zoom out' },
      { keys: ['⌘/Ctrl', '0'], description: 'Reset zoom to 100%' },
      { keys: ['⌘/Ctrl', '1'], description: 'Fit to screen' },
    ],
  },
  {
    category: 'AI',
    shortcuts: [
      { keys: ['⌘/Ctrl', '/'], description: 'Open AI chat for selected' },
    ],
  },
];
```

**Acceptance Criteria:**
- [ ] All shortcuts registered with react-hotkeys-hook
- [ ] Shortcuts don't fire when typing in inputs
- [ ] Mac and Windows modifiers both work
- [ ] Toast notifications for actions
- [ ] Arrow key navigation works
- [ ] Escape closes panels/dialogs first

---

### Task 3: Update UI Store for Shortcut Features

**Description:** Add command palette and shortcuts panel state to UI store.

**Files:**
- MODIFY: `src/lib/studio/store/ui-store.ts`

**Code:**
```typescript
// Add to existing ui-store.ts interface

interface UIState {
  // ... existing state ...
  
  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  
  // Shortcuts panel
  shortcutsPanelOpen: boolean;
  setShortcutsPanelOpen: (open: boolean) => void;
  
  // AI Chat (if not already there)
  aiChatOpen: boolean;
  setAIChatOpen: (open: boolean) => void;
  
  // Preview mode
  previewMode: boolean;
  setPreviewMode: (mode: boolean) => void;
  
  // Zoom helpers
  zoomIn: () => void;
  zoomOut: () => void;
  fitToScreen: () => void;
}

// Add to store implementation:
commandPaletteOpen: false,
setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

shortcutsPanelOpen: false,
setShortcutsPanelOpen: (open) => set({ shortcutsPanelOpen: open }),

aiChatOpen: false,
setAIChatOpen: (open) => set({ aiChatOpen: open }),

previewMode: false,
setPreviewMode: (mode) => set({ previewMode: mode }),

zoomIn: () => set((state) => ({
  zoom: Math.min(state.zoom + 10, 400)
})),

zoomOut: () => set((state) => ({
  zoom: Math.max(state.zoom - 10, 25)
})),

fitToScreen: () => {
  // Calculate zoom to fit canvas in viewport
  const canvasElement = document.querySelector('[data-studio-canvas]');
  if (!canvasElement) return;
  
  const containerRect = canvasElement.parentElement?.getBoundingClientRect();
  if (!containerRect) return;
  
  const { viewportWidth, viewportHeight } = get();
  
  const scaleX = (containerRect.width - 40) / viewportWidth;
  const scaleY = (containerRect.height - 40) / viewportHeight;
  const fitZoom = Math.min(scaleX, scaleY) * 100;
  
  set({ zoom: Math.round(fitZoom) });
},
```

**Acceptance Criteria:**
- [ ] Command palette state in store
- [ ] Shortcuts panel state in store
- [ ] Zoom in/out methods work
- [ ] Fit to screen calculates correctly

---

### Task 4: Create Command Palette Component

**Description:** Searchable command palette using shadcn/ui Command component.

**Files:**
- CREATE: `src/components/studio/features/command-palette.tsx`

**Code:**
```typescript
// src/components/studio/features/command-palette.tsx

'use client';

import { useEffect, useMemo, useCallback } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useUIStore } from '@/lib/studio/store/ui-store';
import { useEditorStore } from '@/lib/studio/store/editor-store';
import { useSelectionStore } from '@/lib/studio/store/selection-store';
import { useComponentRegistry } from '@/lib/studio/registry/component-registry';
import {
  Save,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  ClipboardPaste,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Keyboard,
  Layers,
  Settings,
  Monitor,
  Smartphone,
  Tablet,
  Type,
  Image,
  Square,
  Layout,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'file' | 'edit' | 'view' | 'components' | 'ai' | 'settings';
  keywords?: string[];
}

interface CommandPaletteProps {
  onSave?: () => Promise<void>;
}

export function CommandPalette({ onSave }: CommandPaletteProps) {
  const open = useUIStore(s => s.commandPaletteOpen);
  const setOpen = useUIStore(s => s.setCommandPaletteOpen);
  const selectedId = useSelectionStore(s => s.selectedId);
  const registry = useComponentRegistry();
  
  // Actions
  const undo = useEditorStore.temporal.getState().undo;
  const redo = useEditorStore.temporal.getState().redo;
  const deleteComponent = useEditorStore(s => s.deleteComponent);
  const duplicateComponent = useEditorStore(s => s.duplicateComponent);
  const addComponentAtEnd = useEditorStore(s => s.addComponentAtEnd);
  
  const setPreviewMode = useUIStore(s => s.setPreviewMode);
  const previewMode = useUIStore(s => s.previewMode);
  const zoomIn = useUIStore(s => s.zoomIn);
  const zoomOut = useUIStore(s => s.zoomOut);
  const setZoom = useUIStore(s => s.setZoom);
  const fitToScreen = useUIStore(s => s.fitToScreen);
  const setShortcutsPanelOpen = useUIStore(s => s.setShortcutsPanelOpen);
  const setAIChatOpen = useUIStore(s => s.setAIChatOpen);
  const setDevicePreset = useUIStore(s => s.setDevicePreset);
  
  // Build command list
  const commands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [
      // File commands
      {
        id: 'save',
        label: 'Save Page',
        shortcut: '⌘S',
        icon: <Save className="h-4 w-4" />,
        action: () => {
          if (onSave) {
            onSave().then(() => toast.success('Page saved'));
          }
        },
        category: 'file',
        keywords: ['save', 'persist', 'commit'],
      },
      
      // Edit commands
      {
        id: 'undo',
        label: 'Undo',
        shortcut: '⌘Z',
        icon: <Undo2 className="h-4 w-4" />,
        action: () => {
          undo();
          toast.success('Undo');
        },
        category: 'edit',
      },
      {
        id: 'redo',
        label: 'Redo',
        shortcut: '⌘⇧Z',
        icon: <Redo2 className="h-4 w-4" />,
        action: () => {
          redo();
          toast.success('Redo');
        },
        category: 'edit',
      },
      {
        id: 'delete',
        label: 'Delete Component',
        shortcut: 'Del',
        icon: <Trash2 className="h-4 w-4" />,
        action: () => {
          if (selectedId) {
            deleteComponent(selectedId);
            toast.success('Component deleted');
          } else {
            toast.error('Select a component first');
          }
        },
        category: 'edit',
        keywords: ['remove', 'trash'],
      },
      {
        id: 'duplicate',
        label: 'Duplicate Component',
        shortcut: '⌘D',
        icon: <Copy className="h-4 w-4" />,
        action: () => {
          if (selectedId) {
            duplicateComponent(selectedId);
            toast.success('Component duplicated');
          } else {
            toast.error('Select a component first');
          }
        },
        category: 'edit',
        keywords: ['copy', 'clone'],
      },
      
      // View commands
      {
        id: 'preview',
        label: previewMode ? 'Exit Preview' : 'Enter Preview Mode',
        shortcut: '⌘P',
        icon: previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />,
        action: () => {
          setPreviewMode(!previewMode);
          toast.success(previewMode ? 'Edit mode' : 'Preview mode');
        },
        category: 'view',
      },
      {
        id: 'zoom-in',
        label: 'Zoom In',
        shortcut: '⌘+',
        icon: <ZoomIn className="h-4 w-4" />,
        action: zoomIn,
        category: 'view',
      },
      {
        id: 'zoom-out',
        label: 'Zoom Out',
        shortcut: '⌘-',
        icon: <ZoomOut className="h-4 w-4" />,
        action: zoomOut,
        category: 'view',
      },
      {
        id: 'zoom-reset',
        label: 'Reset Zoom to 100%',
        shortcut: '⌘0',
        icon: <RotateCcw className="h-4 w-4" />,
        action: () => setZoom(100),
        category: 'view',
      },
      {
        id: 'zoom-fit',
        label: 'Fit to Screen',
        shortcut: '⌘1',
        icon: <Layers className="h-4 w-4" />,
        action: fitToScreen,
        category: 'view',
      },
      {
        id: 'device-desktop',
        label: 'Switch to Desktop View',
        icon: <Monitor className="h-4 w-4" />,
        action: () => setDevicePreset('desktop-1920'),
        category: 'view',
      },
      {
        id: 'device-tablet',
        label: 'Switch to Tablet View',
        icon: <Tablet className="h-4 w-4" />,
        action: () => setDevicePreset('ipad-air'),
        category: 'view',
      },
      {
        id: 'device-mobile',
        label: 'Switch to Mobile View',
        icon: <Smartphone className="h-4 w-4" />,
        action: () => setDevicePreset('iphone-14'),
        category: 'view',
      },
      
      // AI commands
      {
        id: 'ai-chat',
        label: 'Open AI Chat',
        shortcut: '⌘/',
        icon: <MessageSquare className="h-4 w-4" />,
        action: () => {
          if (selectedId) {
            setAIChatOpen(true);
          } else {
            toast.error('Select a component first');
          }
        },
        category: 'ai',
        keywords: ['assistant', 'copilot', 'help'],
      },
      {
        id: 'ai-generate',
        label: 'Generate Page with AI',
        icon: <Sparkles className="h-4 w-4" />,
        action: () => {
          // Open AI page generator dialog
          useUIStore.getState().setAIGeneratorOpen(true);
        },
        category: 'ai',
        keywords: ['create', 'wizard', 'auto'],
      },
      
      // Settings commands
      {
        id: 'shortcuts',
        label: 'Keyboard Shortcuts',
        shortcut: '⌘?',
        icon: <Keyboard className="h-4 w-4" />,
        action: () => setShortcutsPanelOpen(true),
        category: 'settings',
        keywords: ['hotkeys', 'keys', 'help'],
      },
      {
        id: 'page-settings',
        label: 'Page Settings',
        icon: <Settings className="h-4 w-4" />,
        action: () => {
          // Open page settings panel
          useUIStore.getState().setSettingsPanelOpen(true);
        },
        category: 'settings',
      },
    ];
    
    // Add component shortcuts
    const componentTypes = Object.values(registry.getAllComponents());
    const commonComponents = componentTypes
      .filter(c => ['Heading', 'Text', 'Image', 'Button', 'Section', 'Container'].includes(c.type))
      .slice(0, 10);
    
    for (const comp of commonComponents) {
      items.push({
        id: `add-${comp.type.toLowerCase()}`,
        label: `Add ${comp.label}`,
        icon: getComponentIcon(comp.type),
        action: () => {
          const newComponent = registry.createComponent(comp.type);
          if (newComponent) {
            addComponentAtEnd(newComponent);
            toast.success(`${comp.label} added`);
          }
        },
        category: 'components',
        keywords: ['insert', 'new', comp.type.toLowerCase()],
      });
    }
    
    return items;
  }, [
    onSave, undo, redo, deleteComponent, duplicateComponent, selectedId,
    previewMode, setPreviewMode, zoomIn, zoomOut, setZoom, fitToScreen,
    setShortcutsPanelOpen, setAIChatOpen, setDevicePreset, registry, addComponentAtEnd
  ]);
  
  // Run command and close palette
  const runCommand = useCallback((command: CommandItem) => {
    setOpen(false);
    // Small delay to let dialog close animation start
    requestAnimationFrame(() => {
      command.action();
    });
  }, [setOpen]);
  
  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      file: [],
      edit: [],
      view: [],
      components: [],
      ai: [],
      settings: [],
    };
    
    for (const cmd of commands) {
      groups[cmd.category].push(cmd);
    }
    
    return groups;
  }, [commands]);
  
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {Object.entries(groupedCommands).map(([category, items]) => {
          if (items.length === 0) return null;
          
          return (
            <CommandGroup key={category} heading={getCategoryLabel(category)}>
              {items.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  value={`${cmd.label} ${cmd.keywords?.join(' ') ?? ''}`}
                  onSelect={() => runCommand(cmd)}
                >
                  <span className="mr-2">{cmd.icon}</span>
                  <span>{cmd.label}</span>
                  {cmd.shortcut && (
                    <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    file: 'File',
    edit: 'Edit',
    view: 'View',
    components: 'Add Component',
    ai: 'AI',
    settings: 'Settings',
  };
  return labels[category] || category;
}

function getComponentIcon(type: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    Heading: <Type className="h-4 w-4" />,
    Text: <Type className="h-4 w-4" />,
    Image: <Image className="h-4 w-4" />,
    Button: <Square className="h-4 w-4" />,
    Section: <Layout className="h-4 w-4" />,
    Container: <Layout className="h-4 w-4" />,
  };
  return icons[type] || <Layout className="h-4 w-4" />;
}
```

**Acceptance Criteria:**
- [ ] Command palette opens with Cmd/Ctrl+K
- [ ] Search filters commands
- [ ] Commands grouped by category
- [ ] Shortcuts shown on right
- [ ] Selecting command executes action
- [ ] Dialog closes after selection

---

### Task 5: Create Shortcuts Help Panel

**Description:** Modal showing all available keyboard shortcuts organized by category.

**Files:**
- CREATE: `src/components/studio/features/shortcuts-panel.tsx`

**Code:**
```typescript
// src/components/studio/features/shortcuts-panel.tsx

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUIStore } from '@/lib/studio/store/ui-store';
import { SHORTCUT_DEFINITIONS } from '@/lib/studio/hooks/use-studio-shortcuts';
import { cn } from '@/lib/utils';

export function ShortcutsPanel() {
  const open = useUIStore(s => s.shortcutsPanelOpen);
  const setOpen = useUIStore(s => s.setShortcutsPanelOpen);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>⌨️</span>
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to work faster in DRAMAC Studio
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {SHORTCUT_DEFINITIONS.map((group) => (
            <div key={group.category}>
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                {group.category}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex}>
                          <kbd
                            className={cn(
                              "inline-flex items-center justify-center",
                              "min-w-[24px] px-1.5 py-0.5",
                              "text-xs font-medium",
                              "bg-muted text-muted-foreground",
                              "border border-border rounded",
                              "shadow-sm"
                            )}
                          >
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="mx-0.5 text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          <p>Use <kbd className="px-1 py-0.5 bg-muted rounded">⌘/Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-muted rounded">K</kbd> to open the command palette</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Acceptance Criteria:**
- [ ] Panel opens when triggered
- [ ] All shortcuts displayed
- [ ] Organized by category
- [ ] Keys styled as keyboard keys
- [ ] Responsive layout

---

### Task 6: Add Shortcuts Button to Toolbar

**Description:** Add a keyboard icon button to the top toolbar that opens shortcuts panel.

**Files:**
- MODIFY: `src/components/studio/panels/top-toolbar.tsx`

**Code:**
```typescript
// Add to the toolbar buttons section

import { Keyboard } from 'lucide-react';
import { useUIStore } from '@/lib/studio/store/ui-store';

// In the component:
const setShortcutsPanelOpen = useUIStore(s => s.setShortcutsPanelOpen);

// Add button:
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShortcutsPanelOpen(true)}
        aria-label="Keyboard shortcuts"
      >
        <Keyboard className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Keyboard Shortcuts (⌘?)</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

**Acceptance Criteria:**
- [ ] Keyboard icon in toolbar
- [ ] Tooltip shows shortcut hint
- [ ] Click opens shortcuts panel

---

### Task 7: Integrate Shortcuts into Studio Provider

**Description:** Initialize shortcuts hook in the main studio provider.

**Files:**
- MODIFY: `src/components/studio/core/studio-provider.tsx`

**Code:**
```typescript
// src/components/studio/core/studio-provider.tsx

import { useStudioShortcuts } from '@/lib/studio/hooks/use-studio-shortcuts';
import { CommandPalette } from '@/components/studio/features/command-palette';
import { ShortcutsPanel } from '@/components/studio/features/shortcuts-panel';

interface StudioProviderProps {
  children: React.ReactNode;
  siteId: string;
  pageId: string;
  onSave?: () => Promise<void>;
}

export function StudioProvider({ 
  children, 
  siteId, 
  pageId, 
  onSave 
}: StudioProviderProps) {
  // Initialize shortcuts
  useStudioShortcuts({
    enabled: true,
    onSave,
  });
  
  return (
    <StudioContext.Provider value={{ siteId, pageId }}>
      {/* DnD Provider */}
      <DndContext>
        {children}
      </DndContext>
      
      {/* Global dialogs */}
      <CommandPalette onSave={onSave} />
      <ShortcutsPanel />
    </StudioContext.Provider>
  );
}
```

**Acceptance Criteria:**
- [ ] Shortcuts work throughout editor
- [ ] Command palette accessible
- [ ] Shortcuts panel accessible

---

### Task 8: Update Selection Store with Navigation

**Description:** Add selectNext/selectPrevious methods for keyboard navigation.

**Files:**
- MODIFY: `src/lib/studio/store/selection-store.ts`

**Code:**
```typescript
// Add to selection-store.ts

interface SelectionState {
  selectedId: string | null;
  hoveredId: string | null;
  
  selectComponent: (id: string | null) => void;
  deselectComponent: () => void;
  setHoveredId: (id: string | null) => void;
  
  // New navigation methods
  selectNext: () => void;
  selectPrevious: () => void;
}

// Implementation:
selectNext: () => {
  const { selectedId } = get();
  const editorState = useEditorStore.getState();
  const { components, root } = editorState;
  
  if (!selectedId) {
    // No selection, select first root child
    const firstChild = root.children[0];
    if (firstChild) {
      set({ selectedId: firstChild });
    }
    return;
  }
  
  const current = components[selectedId];
  if (!current) return;
  
  // If current has children, select first child
  if (current.children && current.children.length > 0) {
    set({ selectedId: current.children[0] });
    return;
  }
  
  // Otherwise, try next sibling
  const parentId = current.parentId;
  const siblings = parentId 
    ? components[parentId]?.children || []
    : root.children;
  
  const currentIndex = siblings.indexOf(selectedId);
  if (currentIndex < siblings.length - 1) {
    set({ selectedId: siblings[currentIndex + 1] });
    return;
  }
  
  // No next sibling, go to parent's next sibling (recurse up)
  // ... implement tree walking logic
},

selectPrevious: () => {
  const { selectedId } = get();
  const editorState = useEditorStore.getState();
  const { components, root } = editorState;
  
  if (!selectedId) {
    // No selection, select last root child
    const lastChild = root.children[root.children.length - 1];
    if (lastChild) {
      set({ selectedId: lastChild });
    }
    return;
  }
  
  const current = components[selectedId];
  if (!current) return;
  
  const parentId = current.parentId;
  const siblings = parentId 
    ? components[parentId]?.children || []
    : root.children;
  
  const currentIndex = siblings.indexOf(selectedId);
  
  if (currentIndex > 0) {
    // Go to previous sibling, then to its last descendant
    let target = siblings[currentIndex - 1];
    let targetComp = components[target];
    
    while (targetComp?.children && targetComp.children.length > 0) {
      target = targetComp.children[targetComp.children.length - 1];
      targetComp = components[target];
    }
    
    set({ selectedId: target });
    return;
  }
  
  // No previous sibling, go to parent
  if (parentId) {
    set({ selectedId: parentId });
  }
},
```

**Acceptance Criteria:**
- [ ] Arrow down selects next component
- [ ] Arrow up selects previous component
- [ ] Navigation follows visual order
- [ ] Works with nested components

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| CREATE | `src/lib/studio/clipboard.ts` | Clipboard copy/paste with ID regeneration |
| CREATE | `src/lib/studio/hooks/use-studio-shortcuts.ts` | Main shortcuts hook |
| CREATE | `src/components/studio/features/command-palette.tsx` | Searchable command palette |
| CREATE | `src/components/studio/features/shortcuts-panel.tsx` | Shortcuts help dialog |
| MODIFY | `src/lib/studio/store/ui-store.ts` | Add palette/panel state |
| MODIFY | `src/lib/studio/store/selection-store.ts` | Add navigation methods |
| MODIFY | `src/components/studio/panels/top-toolbar.tsx` | Add shortcuts button |
| MODIFY | `src/components/studio/core/studio-provider.tsx` | Initialize shortcuts |

## Testing Requirements

### Unit Tests
- [ ] Clipboard correctly copies component with children
- [ ] Clipboard regenerates IDs on paste
- [ ] Input focus detection works
- [ ] Shortcut definitions are complete

### Integration Tests
- [ ] Shortcuts execute correct actions
- [ ] Command palette search filters correctly
- [ ] Arrow navigation follows tree order

### Manual Testing
- [ ] Test all shortcuts on Mac
- [ ] Test all shortcuts on Windows
- [ ] Verify shortcuts don't fire when typing
- [ ] Test clipboard across page navigations
- [ ] Command palette closes on selection
- [ ] Escape key hierarchy works (close palette first, then panels, then deselect)

## Dependencies to Install

```bash
# react-hotkeys-hook should already be installed
# Verify shadcn/ui command component is available
pnpm add cmdk
```

## Rollback Plan

If shortcuts cause issues:
1. Set `enabled: false` in `useStudioShortcuts` call
2. Hide keyboard button from toolbar
3. Disable Command palette dialog

All functionality remains available via mouse clicks.

## Success Criteria

- [ ] All shortcuts from keyboard table work
- [ ] Cmd/Ctrl+K opens command palette
- [ ] Command palette searchable
- [ ] Shortcuts help panel shows all shortcuts
- [ ] Copy/paste works between components
- [ ] Shortcuts don't fire in text inputs
- [ ] Arrow keys navigate component tree
- [ ] Escape closes dialogs in order
- [ ] Works on both Mac and Windows
- [ ] Toast notifications for actions
