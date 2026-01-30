/**
 * usePuckEditor Hook
 * 
 * Custom hook for managing Puck editor state and operations.
 * Provides a clean interface for working with Puck data.
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { PuckData, ComponentData } from "@/types/puck";

export interface UsePuckEditorOptions {
  /** Initial data to load */
  initialData?: PuckData | null;
  /** Auto-save interval in milliseconds (0 to disable) */
  autoSaveInterval?: number;
  /** Callback when auto-save triggers */
  onAutoSave?: (data: PuckData) => Promise<void>;
  /** Enable undo/redo history */
  enableHistory?: boolean;
  /** Maximum history size */
  maxHistorySize?: number;
}

export interface UsePuckEditorReturn {
  /** Current editor data */
  data: PuckData;
  /** Update the editor data */
  setData: (data: PuckData | ((prev: PuckData) => PuckData)) => void;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Mark content as saved */
  markAsSaved: () => void;
  /** Reset to initial data */
  reset: () => void;
  /** Undo last change */
  undo: () => void;
  /** Redo last undone change */
  redo: () => void;
  /** Can undo? */
  canUndo: boolean;
  /** Can redo? */
  canRedo: boolean;
  /** Add a component to the content */
  addComponent: (component: ComponentData, index?: number) => void;
  /** Remove a component by ID */
  removeComponent: (id: string) => void;
  /** Update a component's props */
  updateComponentProps: (id: string, props: Record<string, unknown>) => void;
  /** Move a component to a new index */
  moveComponent: (id: string, newIndex: number) => void;
  /** Duplicate a component */
  duplicateComponent: (id: string) => void;
  /** Get a component by ID */
  getComponent: (id: string) => ComponentData | undefined;
  /** Get all components of a specific type */
  getComponentsByType: (type: string) => ComponentData[];
  /** Export data as JSON string */
  exportJson: () => string;
  /** Import from JSON string */
  importJson: (json: string) => boolean;
}

// Default empty data
const emptyData: PuckData = {
  content: [],
  root: { props: { title: "" } },
};

/**
 * Custom hook for managing Puck editor state
 */
export function usePuckEditor(
  options: UsePuckEditorOptions = {}
): UsePuckEditorReturn {
  const {
    initialData,
    autoSaveInterval = 0,
    onAutoSave,
    enableHistory = true,
    maxHistorySize = 50,
  } = options;

  // State
  const [data, setDataInternal] = useState<PuckData>(initialData || emptyData);
  const [savedData, setSavedData] = useState<PuckData>(initialData || emptyData);
  const [history, setHistory] = useState<PuckData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Compute hasUnsavedChanges
  const hasUnsavedChanges = JSON.stringify(data) !== JSON.stringify(savedData);

  // Update saved data when initial data changes
  useEffect(() => {
    if (initialData) {
      setDataInternal(initialData);
      setSavedData(initialData);
      setHistory([initialData]);
      setHistoryIndex(0);
    }
  }, [initialData]);

  // Set data with history tracking
  const setData = useCallback(
    (newDataOrFn: PuckData | ((prev: PuckData) => PuckData)) => {
      setDataInternal((prev) => {
        const newData =
          typeof newDataOrFn === "function" ? newDataOrFn(prev) : newDataOrFn;

        // Add to history
        if (enableHistory) {
          setHistory((h) => {
            const newHistory = h.slice(0, historyIndex + 1);
            newHistory.push(newData);
            if (newHistory.length > maxHistorySize) {
              newHistory.shift();
            }
            return newHistory;
          });
          setHistoryIndex((i) => Math.min(i + 1, maxHistorySize - 1));
        }

        return newData;
      });
    },
    [enableHistory, historyIndex, maxHistorySize]
  );

  // Mark as saved
  const markAsSaved = useCallback(() => {
    setSavedData(data);
  }, [data]);

  // Reset to initial
  const reset = useCallback(() => {
    setDataInternal(initialData || emptyData);
    setSavedData(initialData || emptyData);
    setHistory([initialData || emptyData]);
    setHistoryIndex(0);
  }, [initialData]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setDataInternal(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setDataInternal(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Can undo/redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Add component
  const addComponent = useCallback(
    (component: ComponentData, index?: number) => {
      setData((prev) => {
        const newContent = [...prev.content];
        if (index !== undefined && index >= 0 && index <= newContent.length) {
          newContent.splice(index, 0, component);
        } else {
          newContent.push(component);
        }
        return { ...prev, content: newContent };
      });
    },
    [setData]
  );

  // Remove component
  const removeComponent = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        content: prev.content.filter((c) => c.props?.id !== id),
      }));
    },
    [setData]
  );

  // Update component props
  const updateComponentProps = useCallback(
    (id: string, props: Record<string, unknown>) => {
      setData((prev) => ({
        ...prev,
        content: prev.content.map((c) =>
          c.props?.id === id ? { ...c, props: { ...c.props, ...props } } : c
        ),
      }));
    },
    [setData]
  );

  // Move component
  const moveComponent = useCallback(
    (id: string, newIndex: number) => {
      setData((prev) => {
        const content = [...prev.content];
        const currentIndex = content.findIndex((c) => c.props?.id === id);
        if (currentIndex === -1 || newIndex < 0 || newIndex >= content.length) {
          return prev;
        }
        const [component] = content.splice(currentIndex, 1);
        content.splice(newIndex, 0, component);
        return { ...prev, content };
      });
    },
    [setData]
  );

  // Duplicate component
  const duplicateComponent = useCallback(
    (id: string) => {
      setData((prev) => {
        const index = prev.content.findIndex((c) => c.props?.id === id);
        if (index === -1) return prev;

        const component = prev.content[index];
        const newComponent: ComponentData = {
          ...component,
          props: {
            ...component.props,
            id: `${component.type}-${Date.now()}`,
          },
        };

        const newContent = [...prev.content];
        newContent.splice(index + 1, 0, newComponent);
        return { ...prev, content: newContent };
      });
    },
    [setData]
  );

  // Get component by ID
  const getComponent = useCallback(
    (id: string) => data.content.find((c) => c.props?.id === id),
    [data]
  );

  // Get components by type
  const getComponentsByType = useCallback(
    (type: string) => data.content.filter((c) => c.type === type),
    [data]
  );

  // Export JSON
  const exportJson = useCallback(() => JSON.stringify(data, null, 2), [data]);

  // Import JSON
  const importJson = useCallback(
    (json: string): boolean => {
      try {
        const parsed = JSON.parse(json) as PuckData;
        if (!Array.isArray(parsed.content)) {
          throw new Error("Invalid Puck data: content must be an array");
        }
        setData(parsed);
        return true;
      } catch (err) {
        console.error("Failed to import JSON:", err);
        return false;
      }
    },
    [setData]
  );

  // Auto-save effect
  useEffect(() => {
    if (autoSaveInterval <= 0 || !hasUnsavedChanges || !onAutoSave) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await onAutoSave(data);
        markAsSaved();
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSaveInterval, data, hasUnsavedChanges, markAsSaved, onAutoSave]);

  return {
    data,
    setData,
    hasUnsavedChanges,
    markAsSaved,
    reset,
    undo,
    redo,
    canUndo,
    canRedo,
    addComponent,
    removeComponent,
    updateComponentProps,
    moveComponent,
    duplicateComponent,
    getComponent,
    getComponentsByType,
    exportJson,
    importJson,
  };
}

export default usePuckEditor;
