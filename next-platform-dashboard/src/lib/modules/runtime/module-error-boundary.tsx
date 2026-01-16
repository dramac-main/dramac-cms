"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Trash2, Bug, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// =============================================================
// TYPES
// =============================================================

interface ModuleErrorBoundaryProps {
  children: React.ReactNode;
  moduleId: string;
  moduleName: string;
  moduleSlug?: string;
  supportUrl?: string;
  onUninstall?: () => void;
  onDisable?: () => void;
  fallback?: React.ReactNode;
}

interface ModuleErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  isReporting: boolean;
  reported: boolean;
}

// =============================================================
// ERROR BOUNDARY COMPONENT
// =============================================================

export class ModuleErrorBoundary extends React.Component<
  ModuleErrorBoundaryProps,
  ModuleErrorBoundaryState
> {
  constructor(props: ModuleErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isReporting: false,
      reported: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ModuleErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log to console in development
    console.error(`[Module Error: ${this.props.moduleId}]`, error, errorInfo);

    // Report error to platform (non-blocking)
    this.reportError(error, errorInfo);
  }

  private async reportError(error: Error, errorInfo: React.ErrorInfo) {
    try {
      await fetch("/api/modules/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: this.props.moduleId,
          moduleName: this.props.moduleName,
          moduleSlug: this.props.moduleSlug,
          error: {
            message: error.message,
            name: error.name,
            stack: error.stack,
          },
          componentStack: errorInfo.componentStack,
          url: typeof window !== "undefined" ? window.location.href : undefined,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          timestamp: new Date().toISOString(),
        }),
      });
      this.setState({ reported: true });
    } catch (reportError) {
      console.error("Failed to report module error:", reportError);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      reported: false,
    });
  };

  private handleDisable = async () => {
    if (this.props.onDisable) {
      this.setState({ isReporting: true });
      try {
        await this.props.onDisable();
      } finally {
        this.setState({ isReporting: false });
      }
    }
  };

  private handleUninstall = async () => {
    if (this.props.onUninstall) {
      this.setState({ isReporting: true });
      try {
        await this.props.onUninstall();
      } finally {
        this.setState({ isReporting: false });
      }
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-lg">Module Error</CardTitle>
                <CardDescription>
                  The &quot;{this.props.moduleName}&quot; module encountered an error
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
              <Bug className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="text-muted-foreground">
                  This error only affects this module. The rest of the platform is working normally.
                </p>
                {this.state.reported && (
                  <p className="text-xs text-success mt-1">
                    ✓ Error has been reported to our team
                  </p>
                )}
              </div>
            </div>

            {/* Error details (development only or collapsible in production) */}
            {this.state.error && (
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <span>View error details</span>
                  <svg
                    className="h-4 w-4 transition-transform data-[state=open]:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-2">
                    <pre className="p-3 bg-muted rounded text-xs overflow-auto max-h-40 font-mono">
                      {this.state.error.message}
                    </pre>
                    {process.env.NODE_ENV === "development" && this.state.error.stack && (
                      <pre className="p-3 bg-muted rounded text-xs overflow-auto max-h-60 font-mono text-muted-foreground">
                        {this.state.error.stack}
                      </pre>
                    )}
                    {process.env.NODE_ENV === "development" && this.state.errorInfo?.componentStack && (
                      <pre className="p-3 bg-muted rounded text-xs overflow-auto max-h-40 font-mono text-muted-foreground">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>

          <CardFooter className="flex flex-wrap gap-2 pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleRetry}
              disabled={this.state.isReporting}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>

            {this.props.onDisable && (
              <Button
                variant="secondary"
                size="sm"
                onClick={this.handleDisable}
                disabled={this.state.isReporting}
              >
                Disable Module
              </Button>
            )}

            {this.props.onUninstall && (
              <Button
                variant="destructive"
                size="sm"
                onClick={this.handleUninstall}
                disabled={this.state.isReporting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Uninstall
              </Button>
            )}

            {this.props.supportUrl && (
              <Button
                variant="ghost"
                size="sm"
                asChild
              >
                <a href={this.props.supportUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Get Help
                </a>
              </Button>
            )}
          </CardFooter>
        </Card>
      );
    }

    return this.props.children;
  }
}

// =============================================================
// FUNCTIONAL WRAPPER (for hooks support)
// =============================================================

interface UseModuleErrorBoundaryOptions {
  moduleId: string;
  moduleName: string;
  moduleSlug?: string;
  supportUrl?: string;
  onUninstall?: () => void;
  onDisable?: () => void;
}

/**
 * Hook to create module error boundary props
 */
export function useModuleErrorBoundary(options: UseModuleErrorBoundaryOptions) {
  const handleUninstall = React.useCallback(async () => {
    if (options.onUninstall) {
      await options.onUninstall();
    }
  }, [options]);

  const handleDisable = React.useCallback(async () => {
    if (options.onDisable) {
      await options.onDisable();
    }
  }, [options]);

  return {
    moduleId: options.moduleId,
    moduleName: options.moduleName,
    moduleSlug: options.moduleSlug,
    supportUrl: options.supportUrl,
    onUninstall: options.onUninstall ? handleUninstall : undefined,
    onDisable: options.onDisable ? handleDisable : undefined,
  };
}

// =============================================================
// LIGHTWEIGHT INLINE ERROR DISPLAY
// =============================================================

interface ModuleInlineErrorProps {
  moduleName: string;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

export function ModuleInlineError({
  moduleName,
  error,
  onRetry,
  className = "",
}: ModuleInlineErrorProps) {
  return (
    <div
      className={`flex items-center justify-between p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm ${className}`}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
        <span className="text-destructive">
          {moduleName} failed to load
          {error && <span className="opacity-70">: {error}</span>}
        </span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-destructive hover:text-destructive/80 underline text-xs"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// =============================================================
// MODULE LOADING PLACEHOLDER
// =============================================================

interface ModuleLoadingProps {
  moduleName?: string;
  className?: string;
}

export function ModuleLoading({ moduleName, className = "" }: ModuleLoadingProps) {
  return (
    <div
      className={`flex items-center justify-center p-8 bg-muted/50 rounded-lg ${className}`}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        {moduleName && (
          <span className="text-xs text-muted-foreground">
            Loading {moduleName}...
          </span>
        )}
      </div>
    </div>
  );
}

// =============================================================
// MODULE DISABLED PLACEHOLDER
// =============================================================

interface ModuleDisabledProps {
  moduleName: string;
  reason?: string;
  onEnable?: () => void;
  className?: string;
}

export function ModuleDisabled({
  moduleName,
  reason,
  onEnable,
  className = "",
}: ModuleDisabledProps) {
  return (
    <div
      className={`flex items-center justify-between p-4 bg-muted border border-border rounded-lg ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-muted-foreground/10">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{moduleName} is disabled</p>
          {reason && (
            <p className="text-xs text-muted-foreground">{reason}</p>
          )}
        </div>
      </div>
      {onEnable && (
        <Button variant="outline" size="sm" onClick={onEnable}>
          Enable
        </Button>
      )}
    </div>
  );
}
