"use client";

/**
 * PortalPanelBoundary
 *
 * Wraps a portal dashboard panel with an error boundary that renders
 * `PortalErrorState` on any render-time or data-fetch error. Retries by
 * re-invoking React's `reset()`.
 *
 * Use together with `<Suspense fallback={<PortalPanelSkeleton />}>` so
 * every panel has consistent loading / empty / error behavior.
 */

import { Component, type ReactNode } from "react";
import { PortalErrorState } from "./portal-error-state";

interface PortalPanelBoundaryProps {
  children: ReactNode;
  /** Optional friendly title override. */
  title?: string;
  /** Optional description override. */
  description?: string;
}

interface PortalPanelBoundaryState {
  error: Error | null;
}

export class PortalPanelBoundary extends Component<
  PortalPanelBoundaryProps,
  PortalPanelBoundaryState
> {
  state: PortalPanelBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): PortalPanelBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    // Structured errors also flow through the observability layer from the
    // DAL. This is only console visibility for dev.
    if (process.env.NODE_ENV !== "production") {
      console.error("[portal panel] render error:", error);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <PortalErrorState
          title={this.props.title}
          description={this.props.description}
          onRetry={this.reset}
        />
      );
    }
    return this.props.children;
  }
}

export default PortalPanelBoundary;
