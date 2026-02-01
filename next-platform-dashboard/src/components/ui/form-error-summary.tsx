// src/components/ui/form-error-summary.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./button";
import { ActionError } from "@/lib/types/result";

// =============================================================================
// TYPES
// =============================================================================

export interface FormErrorSummaryProps {
  /** Object of field errors { fieldName: ['error1', 'error2'] } */
  errors?: Record<string, string[]>;
  /** ActionError from server action */
  actionError?: ActionError | null;
  /** General error message (non-field specific) */
  generalError?: string | null;
  /** Callback when dismiss is clicked */
  onDismiss?: () => void;
  /** Whether to show dismiss button */
  dismissible?: boolean;
  /** Whether errors are collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Callback when a field error is clicked (for focusing) */
  onFieldClick?: (fieldName: string) => void;
  /** Additional class names */
  className?: string;
  /** Title override */
  title?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function countErrors(errors: Record<string, string[]>): number {
  return Object.values(errors).reduce((sum, arr) => sum + arr.length, 0);
}

function formatFieldName(name: string): string {
  // Convert camelCase or snake_case to Title Case
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

// =============================================================================
// FORM ERROR SUMMARY COMPONENT
// =============================================================================

/**
 * FormErrorSummary - Displays a summary of form validation errors
 *
 * Features:
 * - Supports field-level errors (Record<string, string[]>)
 * - Supports ActionError from server actions
 * - Supports general error messages
 * - Clickable field names for focusing
 * - Dismissible and collapsible variants
 * - Accessible with proper ARIA attributes
 *
 * @example
 * ```tsx
 * // With field errors
 * <FormErrorSummary
 *   errors={{
 *     email: ['Invalid email format'],
 *     password: ['Must be at least 8 characters', 'Must contain a number'],
 *   }}
 *   onFieldClick={(field) => document.getElementById(field)?.focus()}
 *   dismissible
 * />
 *
 * // With ActionError
 * const result = await createUser(data);
 * if (!result.success) {
 *   <FormErrorSummary actionError={result.error} />
 * }
 * ```
 */
export function FormErrorSummary({
  errors = {},
  actionError,
  generalError,
  onDismiss,
  dismissible = true,
  collapsible = false,
  defaultCollapsed = false,
  onFieldClick,
  className,
  title,
}: FormErrorSummaryProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  // Merge errors from different sources
  const fieldErrors: Record<string, string[]> = {
    ...errors,
    ...(actionError?.details || {}),
  };

  const errorCount = countErrors(fieldErrors);
  const hasFieldErrors = errorCount > 0;
  const hasGeneralError = !!generalError || (actionError && !actionError.details);
  const hasAnyError = hasFieldErrors || hasGeneralError;

  // Don't render if no errors
  if (!hasAnyError) {
    return null;
  }

  const displayTitle =
    title ||
    (hasFieldErrors
      ? `Please fix ${errorCount} error${errorCount > 1 ? "s" : ""} below`
      : "Error");

  const generalErrorMessage =
    generalError || (actionError && !actionError.details ? actionError.message : null);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "rounded-lg border border-danger/30 bg-danger/5 p-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-danger text-sm">{displayTitle}</h3>
            
            <div className="flex items-center gap-1">
              {/* Collapse toggle */}
              {collapsible && hasFieldErrors && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-danger hover:text-danger hover:bg-danger/10"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  aria-expanded={!isCollapsed}
                  aria-label={isCollapsed ? "Expand errors" : "Collapse errors"}
                >
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              )}
              
              {/* Dismiss button */}
              {dismissible && onDismiss && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-danger hover:text-danger hover:bg-danger/10"
                  onClick={onDismiss}
                  aria-label="Dismiss errors"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* General error message */}
          {generalErrorMessage && (
            <p className="text-sm text-danger/90 mt-1">{generalErrorMessage}</p>
          )}

          {/* Field errors list */}
          {hasFieldErrors && !isCollapsed && (
            <ul className="mt-2 text-sm text-danger/90 space-y-1">
              {Object.entries(fieldErrors).map(([field, messages]) =>
                messages.map((message, index) => (
                  <li key={`${field}-${index}`} className="flex items-start gap-1">
                    <span className="shrink-0">•</span>
                    {onFieldClick ? (
                      <button
                        type="button"
                        onClick={() => onFieldClick(field)}
                        className="text-left hover:underline focus:outline-none focus:underline"
                      >
                        <span className="font-medium">
                          {formatFieldName(field)}:
                        </span>{" "}
                        {message}
                      </button>
                    ) : (
                      <span>
                        <span className="font-medium">
                          {formatFieldName(field)}:
                        </span>{" "}
                        {message}
                      </span>
                    )}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// COMPACT ERROR SUMMARY (Single line)
// =============================================================================

export interface CompactErrorSummaryProps {
  /** Error message to display */
  message?: string | null;
  /** ActionError from server action */
  actionError?: ActionError | null;
  /** Callback when dismiss is clicked */
  onDismiss?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * CompactErrorSummary - Single-line error display
 *
 * Use when you need a minimal error indicator, such as above a submit button.
 *
 * @example
 * ```tsx
 * <CompactErrorSummary
 *   message={submitError}
 *   onDismiss={() => setSubmitError(null)}
 * />
 * <Button type="submit">Save</Button>
 * ```
 */
export function CompactErrorSummary({
  message,
  actionError,
  onDismiss,
  className,
}: CompactErrorSummaryProps) {
  const errorMessage = message || actionError?.message;

  if (!errorMessage) {
    return null;
  }

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-2 text-sm text-danger py-2",
        className
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span className="flex-1">{errorMessage}</span>
      {onDismiss && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-danger hover:text-danger hover:bg-danger/10"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export default FormErrorSummary;
