"use client";

import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  /** The key combination (e.g., "k", "n", "b") */
  key: string;
  /** Whether Ctrl (Windows) or Cmd (Mac) is required */
  ctrlOrCmd?: boolean;
  /** Whether Shift is required */
  shift?: boolean;
  /** Whether Alt is required */
  alt?: boolean;
  /** Description of the shortcut */
  description: string;
  /** Callback when shortcut is triggered */
  handler: () => void;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
}

/**
 * Check if the user is on macOS
 */
export function isMac(): boolean {
  if (typeof window === "undefined") return false;
  return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}

/**
 * Format a shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  const mac = isMac();
  
  if (shortcut.ctrlOrCmd) {
    parts.push(mac ? "⌘" : "Ctrl");
  }
  if (shortcut.alt) {
    parts.push(mac ? "⌥" : "Alt");
  }
  if (shortcut.shift) {
    parts.push(mac ? "⇧" : "Shift");
  }
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(mac ? "" : "+");
}

/**
 * Hook to register global keyboard shortcuts
 * 
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   { key: "k", ctrlOrCmd: true, handler: openCommandPalette, description: "Open command palette" },
 *   { key: "n", ctrlOrCmd: true, handler: createNewSite, description: "Create new site" },
 * ]);
 * ```
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        const ctrlOrCmdPressed = isMac() ? event.metaKey : event.ctrlKey;
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlOrCmdMatches = shortcut.ctrlOrCmd ? ctrlOrCmdPressed : !ctrlOrCmdPressed;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;

        if (keyMatches && ctrlOrCmdMatches && shiftMatches && altMatches) {
          // Allow closing shortcuts even in inputs
          if (isInput && shortcut.key !== "Escape" && shortcut.key !== "k") {
            continue;
          }

          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.handler();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Hook to get all registered shortcuts for display
 */
export function useShortcutsList(shortcuts: KeyboardShortcut[]) {
  return shortcuts.map((shortcut) => ({
    ...shortcut,
    formatted: formatShortcut(shortcut),
  }));
}
