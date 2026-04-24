"use client";

/**
 * PortalErrorState — recoverable error card with a retry affordance.
 *
 * Use inside Suspense + ErrorBoundary pairs. The `reset` prop must call the
 * boundary's `reset()` so React re-renders the failing subtree.
 */

import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PortalErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function PortalErrorState({
  title = "Something went wrong",
  description = "We couldn't load this panel. You can retry, or check back in a moment.",
  onRetry,
  className,
}: PortalErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 px-6 py-10 text-center",
        className,
      )}
      role="alert"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCcw className="mr-2 h-4 w-4" aria-hidden />
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export default PortalErrorState;
