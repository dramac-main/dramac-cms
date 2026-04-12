"use client";

import { useEffect, useRef } from "react";

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
  const ref = useRef(hasChanges);
  ref.current = hasChanges;

  useEffect(() => {
    if (!hasChanges) return;

    // --- Browser refresh / close tab / URL bar ---
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    // --- Intercept <a>/<Link> clicks (capture phase, runs before Next.js) ---
    const handleClick = (e: MouseEvent) => {
      if (!ref.current) return;
      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor || anchor.getAttribute("target") === "_blank") return;
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      if (!window.confirm(MSG)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // --- Browser back / forward button ---
    // Push a sentinel entry so popstate fires before the real navigation
    history.pushState(null, "");
    let bypassing = false;

    const handlePopState = () => {
      if (bypassing) {
        bypassing = false;
        return;
      }
      if (!ref.current) return;

      if (window.confirm(MSG)) {
        // User wants to leave — perform the real back navigation
        bypassing = true;
        history.back();
      } else {
        // User wants to stay — re-push sentinel
        history.pushState(null, "");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasChanges]);
}
