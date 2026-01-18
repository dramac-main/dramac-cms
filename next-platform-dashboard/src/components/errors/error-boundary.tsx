"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw, Home, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * React Error Boundary component for catching and displaying errors
 * Use this to wrap components that might throw errors
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error boundary caught:", error, errorInfo);
    
    // Store error info for potential display
    this.setState({ errorInfo });
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo } = this.state;
      const { showDetails = false } = this.props;

      return (
        <div className="flex items-center justify-center p-4">
          <Card className="mx-auto max-w-lg w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Something went wrong
              </CardTitle>
              <CardDescription>
                An error occurred while rendering this component.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {error?.message || "An unexpected error occurred."}
              </p>
              
              {showDetails && errorInfo?.componentStack && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    <Bug className="h-3 w-3 inline mr-1" />
                    Technical details
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded-md overflow-auto max-h-32 text-[10px]">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                onClick={this.handleReset}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
              <Button asChild size="sm">
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Go home
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional component wrapper for ErrorBoundary
 * Easier to use in JSX
 */
interface WithErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function WithErrorBoundary({ children, fallback, onError }: WithErrorBoundaryProps) {
  return (
    <ErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error boundary specifically for async components/Suspense boundaries
 */
interface AsyncErrorBoundaryProps {
  children: ReactNode;
  loadingFallback?: ReactNode;
  errorFallback?: ReactNode;
}

export function AsyncErrorBoundary({ 
  children, 
  loadingFallback: _loadingFallback,
  errorFallback 
}: AsyncErrorBoundaryProps) {
  return (
    <ErrorBoundary fallback={errorFallback}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Minimal error boundary for small components
 * Shows a simple error message without full card UI
 */
export class MinimalErrorBoundary extends Component<
  { children: ReactNode; message?: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; message?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Minimal error boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{this.props.message || this.state.error?.message || "Something went wrong"}</span>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="ml-auto text-xs underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
