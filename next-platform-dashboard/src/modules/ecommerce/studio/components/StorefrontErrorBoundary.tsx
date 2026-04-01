"use client";

import React from "react";
import { AlertTriangle, RefreshCw, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StorefrontErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  blockName?: string;
  silent?: boolean;
}

interface StorefrontErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class StorefrontErrorBoundary extends React.Component<
  StorefrontErrorBoundaryProps,
  StorefrontErrorBoundaryState
> {
  constructor(props: StorefrontErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): StorefrontErrorBoundaryState {
    // Log here because componentDidCatch does NOT fire during SSR.
    // getDerivedStateFromError runs in both SSR and CSR contexts.
    console.error(
      "[StorefrontErrorBoundary][getDerivedStateFromError]",
      error?.message,
      error?.stack,
    );
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Always log in all environments so we can diagnose storefront crashes
    console.error(
      `[StorefrontErrorBoundary] ${this.props.blockName || "Unknown block"} crashed:`,
      error,
      errorInfo,
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      if (this.props.silent) {
        return null;
      }

      return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-muted rounded-lg border">
          <AlertTriangle className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="font-medium text-foreground mb-1">
            Something went wrong
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {this.props.blockName
              ? `The ${this.props.blockName} section couldn't load.`
              : "This section couldn't load."}
            {this.state.error?.message
              ? ` Error: ${this.state.error.message}`
              : ""}
          </p>
          {this.state.error && (
            <p className="text-xs text-muted-foreground/60 mb-3 max-w-md break-all" data-error-detail>
              {this.state.error.message}
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={this.handleRetry}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Try Again
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="/shop">
                <ShoppingBag className="h-4 w-4 mr-1" />
                Continue Shopping
              </a>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
