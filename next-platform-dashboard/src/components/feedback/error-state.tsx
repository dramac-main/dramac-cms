"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  RefreshCcw,
  ChevronDown,
  XCircle,
  WifiOff,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// =============================================================================
// ERROR BOUNDARY
// =============================================================================

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  /**
   * Custom fallback UI
   */
  fallback?: React.ReactNode;
  /**
   * Error handler callback
   */
  onError?: (error: Error, info: React.ErrorInfo) => void;
  /**
   * Keys that trigger a reset when changed
   */
  resetKeys?: unknown[];
  /**
   * Reset handler
   */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - React error boundary with fallback UI.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={<ErrorState title="Something went wrong" />}
 *   onError={(error) => logError(error)}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);
    
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, info);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && this.props.resetKeys) {
      const hasChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );
      if (hasChanged) {
        this.reset();
      }
    }
  }

  reset = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorState
          error={this.state.error || undefined}
          action={{
            label: "Try again",
            onClick: this.reset,
          }}
        />
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// ERROR STATE
// =============================================================================

export type ErrorSeverity = "error" | "warning" | "info";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Error object or message
   */
  error?: Error | string;
  /**
   * Title text
   */
  title?: string;
  /**
   * Description text
   */
  description?: string;
  /**
   * Action button
   */
  action?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Show technical details (dev mode)
   */
  showDetails?: boolean;
  /**
   * Severity level
   */
  severity?: ErrorSeverity;
  /**
   * Full page error
   */
  fullPage?: boolean;
}

const severityConfig = {
  error: {
    icon: XCircle,
    iconColor: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/20",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
};

/**
 * ErrorState - Configurable error display.
 * 
 * @example
 * ```tsx
 * <ErrorState
 *   error={error}
 *   title="Failed to load data"
 *   description="Please check your connection and try again."
 *   action={{ label: "Retry", onClick: refetch }}
 * />
 * ```
 */
const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(
  ({
    className,
    error,
    title = "Something went wrong",
    description,
    action,
    showDetails = process.env.NODE_ENV === "development",
    severity = "error",
    fullPage = false,
  }, ref) => {
    const [detailsOpen, setDetailsOpen] = React.useState(false);
    const config = severityConfig[severity];
    const Icon = config.icon;
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    const content = (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border p-6 text-center",
          config.bgColor,
          config.borderColor,
          fullPage && "min-h-[400px]",
          className
        )}
      >
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full",
          config.bgColor
        )}>
          <Icon className={cn("h-6 w-6", config.iconColor)} />
        </div>

        <h3 className="mt-4 font-semibold">{title}</h3>
        
        {(description || errorMessage) && (
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            {description || errorMessage}
          </p>
        )}

        {action && (
          <Button
            onClick={action.onClick}
            variant="outline"
            className="mt-4"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            {action.label}
          </Button>
        )}

        {showDetails && errorStack && (
          <Collapsible
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            className="mt-4 w-full max-w-lg"
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs">
                <ChevronDown className={cn(
                  "mr-1 h-3 w-3 transition-transform",
                  detailsOpen && "rotate-180"
                )} />
                Technical details
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 overflow-auto rounded-md bg-muted p-3 text-left text-xs">
                {errorStack}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )}
      </motion.div>
    );

    if (fullPage) {
      return (
        <div ref={ref} className="flex min-h-screen items-center justify-center p-4">
          {content}
        </div>
      );
    }

    return <div ref={ref}>{content}</div>;
  }
);

ErrorState.displayName = "ErrorState";

// =============================================================================
// INLINE ERROR
// =============================================================================

export interface InlineErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Error message
   */
  message: string;
  /**
   * Retry action
   */
  onRetry?: () => void;
  /**
   * Dismiss action
   */
  onDismiss?: () => void;
}

/**
 * InlineError - Compact inline error display.
 */
const InlineError = React.forwardRef<HTMLDivElement, InlineErrorProps>(
  ({ className, message, onRetry, onDismiss, ...props }, ref) => {
    return (
      <Alert ref={ref} variant="destructive" className={className} {...props}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{message}</span>
          <div className="flex gap-1 ml-4">
            {onRetry && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={onRetry}
              >
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={onDismiss}
              >
                Dismiss
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }
);

InlineError.displayName = "InlineError";

// =============================================================================
// OFFLINE INDICATOR
// =============================================================================

export interface OfflineIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Show as banner
   */
  showBanner?: boolean;
  /**
   * Retry handler
   */
  onRetry?: () => void;
  /**
   * Force offline state (for testing)
   */
  forceOffline?: boolean;
}

/**
 * OfflineIndicator - Network status indicator.
 * 
 * @example
 * ```tsx
 * <OfflineIndicator showBanner onRetry={() => refetch()} />
 * ```
 */
const OfflineIndicator = React.forwardRef<HTMLDivElement, OfflineIndicatorProps>(
  ({ className, showBanner = true, onRetry, forceOffline, ...props }, ref) => {
    const [isOnline, setIsOnline] = React.useState(
      forceOffline !== undefined ? !forceOffline : typeof navigator !== "undefined" ? navigator.onLine : true
    );

    React.useEffect(() => {
      if (forceOffline !== undefined) {
        setIsOnline(!forceOffline);
        return;
      }

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }, [forceOffline]);

    if (isOnline) return null;

    if (!showBanner) {
      return (
        <div
          ref={ref}
          className={cn(
            "flex items-center gap-2 text-sm text-amber-500",
            className
          )}
          {...props}
        >
          <WifiOff className="h-4 w-4" />
          <span>Offline</span>
        </div>
      );
    }

    return (
      <AnimatePresence>
        <motion.div
          ref={ref}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className={cn(
            "fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-amber-50 shadow-lg",
            className
          )}
        >
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">You are currently offline</span>
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-amber-50 hover:text-amber-100 hover:bg-amber-600"
              onClick={onRetry}
            >
              <RefreshCcw className="mr-1 h-3 w-3" />
              Retry
            </Button>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }
);

OfflineIndicator.displayName = "OfflineIndicator";

// =============================================================================
// CONNECTION STATUS
// =============================================================================

export interface ConnectionStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Current connection status
   */
  status: "connected" | "connecting" | "disconnected" | "error";
  /**
   * Status label
   */
  label?: string;
  /**
   * Show pulse animation
   */
  showPulse?: boolean;
}

const statusConfig = {
  connected: { color: "bg-emerald-500", label: "Connected", Icon: Wifi },
  connecting: { color: "bg-amber-500", label: "Connecting...", Icon: Wifi },
  disconnected: { color: "bg-gray-400", label: "Disconnected", Icon: WifiOff },
  error: { color: "bg-destructive", label: "Connection error", Icon: WifiOff },
};

/**
 * ConnectionStatus - Visual connection status indicator.
 */
const ConnectionStatus = React.forwardRef<HTMLDivElement, ConnectionStatusProps>(
  ({ className, status, label, showPulse = true, ...props }, ref) => {
    const config = statusConfig[status];
    const Icon = config.Icon;

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        <div className="relative">
          <div className={cn("h-2 w-2 rounded-full", config.color)} />
          {showPulse && status === "connected" && (
            <div className={cn(
              "absolute inset-0 animate-ping rounded-full opacity-75",
              config.color
            )} />
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {label || config.label}
        </span>
      </div>
    );
  }
);

ConnectionStatus.displayName = "ConnectionStatus";

export {
  ErrorBoundary,
  ErrorState,
  InlineError,
  OfflineIndicator,
  ConnectionStatus,
};
