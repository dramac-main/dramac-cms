"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface UseAutoSaveOptions {
  onSave: () => Promise<void>;
  hasChanges: boolean;
  delay?: number; // ms
  enabled?: boolean;
}

export function useAutoSave({
  onSave,
  hasChanges,
  delay = 30000, // 30 seconds default
  enabled = true,
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [lastSave, setLastSave] = useState<number>(() => Date.now());

  const save = useCallback(async () => {
    if (!hasChanges) return;

    try {
      await onSave();
      setLastSave(Date.now());
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  }, [hasChanges, onSave]);

  // Reset timer when changes are made
  useEffect(() => {
    if (!enabled || !hasChanges) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(save, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, hasChanges, delay, save]);

  // Save on visibility change (tab hidden)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden && hasChanges) {
        save();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [enabled, hasChanges, save]);

  return {
    lastSave,
    triggerSave: save,
  };
}
