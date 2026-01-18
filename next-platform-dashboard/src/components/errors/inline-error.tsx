"use client";

import { AlertCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatErrorForDisplay } from "@/lib/errors";

type ErrorVariant = "error" | "warning" | "info" | "destructive";

interface InlineErrorProps {
  error?: unknown;
  message?: string;
  variant?: ErrorVariant;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  onDismiss?: () => void;
}

const variantStyles: Record<ErrorVariant, string> = {
  error: "text-destructive bg-destructive/10 border-destructive/20",
  destructive: "text-destructive bg-destructive/10 border-destructive/20",
  warning: "text-warning bg-warning/10 border-warning/20",
  info: "text-info bg-info/10 border-info/20",
};

const sizeStyles = {
  sm: "text-xs py-1.5 px-2",
  md: "text-sm py-2 px-3",
  lg: "text-base py-3 px-4",
};

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

/**
 * Icon component that renders based on variant
 */
function VariantIcon({ variant, className }: { variant: ErrorVariant; className?: string }) {
  switch (variant) {
    case "warning":
      return <AlertTriangle className={className} aria-hidden="true" />;
    case "info":
      return <Info className={className} aria-hidden="true" />;
    case "error":
    case "destructive":
    default:
      return <AlertCircle className={className} aria-hidden="true" />;
  }
}

/**
 * Inline error message component
 * Use this for showing errors inline within forms or content areas
 */
export function InlineError({
  error,
  message,
  variant = "error",
  className,
  showIcon = true,
  size = "md",
  onDismiss,
}: InlineErrorProps) {
  // Determine the message to display
  let displayMessage = message;
  
  if (!displayMessage && error) {
    const formatted = formatErrorForDisplay(error);
    displayMessage = formatted.message;
  }

  if (!displayMessage) {
    return null;
  }

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-md border",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {showIcon && (
        <VariantIcon variant={variant} className={cn("shrink-0 mt-0.5", iconSizes[size])} />
      )}
      <span className="flex-1">{displayMessage}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss error"
        >
          <XCircle className={iconSizes[size]} />
        </button>
      )}
    </div>
  );
}

/**
 * Field-level error for form inputs
 */
interface FieldErrorProps {
  error?: string | string[];
  className?: string;
}

export function FieldError({ error, className }: FieldErrorProps) {
  if (!error) {
    return null;
  }

  const message = Array.isArray(error) ? error[0] : error;

  return (
    <p
      role="alert"
      className={cn("text-xs text-destructive mt-1", className)}
    >
      {message}
    </p>
  );
}

/**
 * Error list for displaying multiple errors
 */
interface ErrorListProps {
  errors: (string | Error | unknown)[];
  variant?: ErrorVariant;
  className?: string;
  title?: string;
}

export function ErrorList({ 
  errors, 
  variant = "error", 
  className,
  title = "The following errors occurred:"
}: ErrorListProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border p-4",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-center gap-2 font-medium mb-2">
        <VariantIcon variant={variant} className="h-4 w-4" />
        <span>{title}</span>
      </div>
      <ul className="list-disc list-inside space-y-1 text-sm">
        {errors.map((error, index) => {
          let message: string;
          if (typeof error === "string") {
            message = error;
          } else if (error instanceof Error) {
            message = error.message;
          } else {
            const formatted = formatErrorForDisplay(error);
            message = formatted.message;
          }
          return <li key={index}>{message}</li>;
        })}
      </ul>
    </div>
  );
}

/**
 * Empty state with error styling
 * Use when a section has no data due to an error
 */
interface ErrorEmptyStateProps {
  title?: string;
  message?: string;
  error?: unknown;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function ErrorEmptyState({
  title = "Something went wrong",
  message,
  error,
  action,
  className,
}: ErrorEmptyStateProps) {
  let displayMessage = message;
  
  if (!displayMessage && error) {
    const formatted = formatErrorForDisplay(error);
    displayMessage = formatted.message;
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-lg border border-dashed",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      {displayMessage && (
        <p className="text-muted-foreground mt-1 max-w-sm">{displayMessage}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 text-sm text-primary hover:underline"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default InlineError;
