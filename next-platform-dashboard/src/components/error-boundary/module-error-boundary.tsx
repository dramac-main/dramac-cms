// src/components/error-boundary/module-error-boundary.tsx
'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  moduleName: string;
  moduleSlug?: string;
  siteId?: string;
  fallback?: ReactNode;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ModuleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log module-specific error
    console.error(`[${this.props.moduleName}] Error:`, error, errorInfo);
    
    // Send to logging service
    if (typeof window !== 'undefined') {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          module: this.props.moduleName,
          moduleSlug: this.props.moduleSlug,
          siteId: this.props.siteId,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoToSettings = () => {
    if (this.props.siteId && this.props.moduleSlug) {
      window.location.href = `/dashboard/sites/${this.props.siteId}/${this.props.moduleSlug}/settings`;
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default module error UI
      return (
        <div className={cn(
          "p-6 border border-destructive/20 rounded-lg bg-destructive/5",
          this.props.className
        )}>
          <div className="flex items-start gap-4">
            {/* Error Icon */}
            <div className="shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>

            {/* Error Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">
                Error in {this.props.moduleName}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                This module encountered an error, but the rest of your dashboard is still working.
              </p>

              {/* Error message in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <p className="text-xs font-mono text-destructive mt-2 p-2 bg-destructive/10 rounded">
                  {this.state.error.message}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={this.handleRetry}
                  className="gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </Button>
                {this.props.siteId && this.props.moduleSlug && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={this.handleGoToSettings}
                    className="gap-1.5"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Module Settings
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
