"use client";

/**
 * Invisible component mounted on the portal layout.
 *
 * Detects when the portal is running as an installed PWA (standalone
 * display mode) and fires markAppInstalled() once so the onboarding
 * checklist step auto-completes without user intervention.
 */

import { useEffect } from "react";
import { markAppInstalled } from "@/lib/portal/onboarding-actions";

export function PwaInstallDetector() {
  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      ("standalone" in window.navigator &&
        (window.navigator as { standalone?: boolean }).standalone === true);

    if (isStandalone) {
      // Fire-and-forget — errors are non-critical
      markAppInstalled().catch(() => undefined);
    }
  }, []);

  return null;
}
