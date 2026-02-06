/**
 * PHASE AWD-08: Preview & Iteration System
 * Preview State Hook
 *
 * Custom hook that combines store state with iteration engine
 * for a complete preview and refinement experience.
 */

"use client";

import { useCallback } from "react";
import { usePreviewStore, usePreviewHistory } from "./store";
import { IterationEngine } from "./iteration-engine";
import type { PreviewState, RefinementResult } from "./types";

/**
 * Hook for managing preview state with refinement capabilities
 */
export function usePreviewState(initialState?: PreviewState) {
  const previewState = usePreviewStore((s) => s.previewState);
  const isRefining = usePreviewStore((s) => s.isRefining);
  const setPreviewState = usePreviewStore((s) => s.setPreviewState);
  const pushState = usePreviewStore((s) => s.pushState);
  const setRefining = usePreviewStore((s) => s.setRefining);
  const approveState = usePreviewStore((s) => s.approve);
  const { canUndo, canRedo, undo, redo } = usePreviewHistory();

  // Initialize with provided state if store is empty
  if (initialState && !previewState) {
    setPreviewState(initialState);
  }

  const currentState = previewState ?? initialState;

  /**
   * Process a refinement request
   */
  const refine = useCallback(
    async (request: string): Promise<RefinementResult | null> => {
      if (!currentState) return null;

      setRefining(true);

      try {
        const engine = new IterationEngine(currentState);
        const result = await engine.processRefinement({
          type: "general",
          request,
        });

        if (result.success) {
          const newState = engine.applyChanges(result.changes);
          pushState(newState);
        }

        return result;
      } catch (error) {
        console.error("[usePreviewState] Error refining:", error);
        return {
          success: false,
          changes: [],
          explanation:
            error instanceof Error ? error.message : "Failed to refine",
          requiresRegeneration: false,
        };
      } finally {
        setRefining(false);
      }
    },
    [currentState, pushState, setRefining]
  );

  /**
   * Approve the current state
   */
  const approve = useCallback(() => {
    return approveState();
  }, [approveState]);

  return {
    state: currentState,
    isRefining,
    canUndo,
    canRedo,
    undo,
    redo,
    refine,
    approve,
    iterationCount: currentState?.iterations.length ?? 0,
  };
}
