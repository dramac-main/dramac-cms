"use client";

/**
 * PortalEmptyState — shared zero-state card for portal surfaces.
 *
 * Use when a query succeeded but returned no rows. Hand users a clear
 * next action whenever possible; if not, stay neutral.
 */

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortalEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PortalEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: PortalEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 px-6 py-10 text-center",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {Icon ? (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" aria-hidden />
        </div>
      ) : null}
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export default PortalEmptyState;
