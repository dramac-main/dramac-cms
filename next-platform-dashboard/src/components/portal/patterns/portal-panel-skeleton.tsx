"use client";

/**
 * PortalPanelSkeleton — loading placeholder for dashboard panels.
 *
 * Mobile-first sizes. Avoids layout thrash by matching the painted panel
 * height within a row.
 */

import { cn } from "@/lib/utils";

interface PortalPanelSkeletonProps {
  rows?: number;
  className?: string;
}

export function PortalPanelSkeleton({
  rows = 3,
  className,
}: PortalPanelSkeletonProps) {
  return (
    <div
      className={cn("space-y-3", className)}
      role="status"
      aria-live="polite"
      aria-busy
    >
      <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
      <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-3 w-full animate-pulse rounded bg-muted"
            style={{ opacity: 1 - i * 0.15 }}
          />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export default PortalPanelSkeleton;
