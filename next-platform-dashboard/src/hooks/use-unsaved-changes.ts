"use client";

import { useEffect, useRef, useCallback } from "react";

const MSG =
  "You have unsaved changes. Are you sure you want to leave this page?";

/**
 * Warns the user before navigating away from a page with unsaved changes.
 *
 * Covers:
 * - Browser refresh / close tab / URL bar navigation (beforeunload)
 * - Clicking any <a> or Next.js <Link> on the page (capture-phase click)
 * - Browser back/forward button (popstate with history sentinel)
 */
export function useUnsavedChanges(hasChanges: boolean) {
  const changesRef = useRef(hasChanges);
  changesRef.current = hasChanges;

  // --- beforeunload: always registered, checks ref dynamically ---
  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (!changesRef.current) return;
    e.preventDefault();
    // Chrome/Edge require returnValue to be set
    e.returnValue = MSG;
  }, []);

  // --- Intercept <a>/<Link> clicks (capture phase, before Next.js router) ---
  const handleClick = useCallback((e: MouseEvent) => {
    if (!changesRef.current) return;
    const anchor = (e.target as HTMLElement).closest("a[href]");
    if (!anchor || anchor.getAttribute("target") === "_blank") return;
    const href = anchor.getAttribute("href");
    if (!href || href === "#") return;
    if (!window.confirm(MSG)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  // Register beforeunload and click handlers once on mount
  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
    };
  }, [handleBeforeUnload, handleClick]);

  // --- Browser back / forward button ---
  // Only push history sentinel when there are actual changes
  useEffect(() => {
    if (!hasChanges) return;

    // Push a sentinel entry so popstate fires before real navigation
    history.pushState({ __unsavedGuard: true }, "");
    let bypassing = false;

    const handlePopState = () => {
      if (bypassing) {
        bypassing = false;
        return;
      }
      if (!changesRef.current) return;

      if (window.confirm(MSG)) {
        // User wants to leave — perform the real back navigation
        bypassing = true;
        history.back();
      } else {
        // User wants to stay — re-push sentinel
        history.pushState({ __unsavedGuard: true }, "");
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasChanges]);
}
