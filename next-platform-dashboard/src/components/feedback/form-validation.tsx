"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";

// =============================================================================
// FORM FIELD ERROR
// =============================================================================

export interface FormFieldErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Error message
   */
  error?: string;
  /**
   * Field has been touched/interacted with
   */
  touched?: boolean;
  /**
   * Show error icon
   */
  showIcon?: boolean;
  /**
   * Animate error appearance
   */
  animated?: boolean;
}

/**
 * FormFieldError - Field-level error display.
 * 
 * @example
 * ```tsx
 * <FormFieldError
 *   error={errors.email?.message}
 *   touched={touchedFields.email}
 * />
 * ```
 */
const FormFieldError = React.forwardRef<HTMLDivElement, FormFieldErrorProps>(
  ({ className, error, touched = true, showIcon = true, animated = true, ...props }, ref) => {
    if (!error || !touched) return null;

    const content = (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-1.5 text-sm text-destructive mt-1",
          className
        )}
        role="alert"
        aria-live="polite"
        {...props}
      >
        {showIcon && <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
        <span>{error}</span>
      </div>
    );

    if (animated) {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {content}
          </motion.div>
        </AnimatePresence>
      );
    }

    return content;
  }
);

FormFieldError.displayName = "FormFieldError";

// =============================================================================
// FORM FIELD SUCCESS
// =============================================================================

export interface FormFieldSuccessProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Success message
   */
  message?: string;
  /**
   * Show only when field is valid and touched
   */
  show?: boolean;
}

/**
 * FormFieldSuccess - Field-level success indicator.
 */
const FormFieldSuccess = React.forwardRef<HTMLDivElement, FormFieldSuccessProps>(
  ({ className, message, show }, ref) => {
    if (!show) return null;

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 mt-1",
          className
        )}
      >
        <CheckCircle className="h-3.5 w-3.5" />
        {message && <span>{message}</span>}
      </motion.div>
    );
  }
);

FormFieldSuccess.displayName = "FormFieldSuccess";

// =============================================================================
// FORM SUMMARY ERROR
// =============================================================================

export interface FormSummaryErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Error map from form validation
   */
  errors: Record<string, string>;
  /**
   * Title text
   */
  title?: string;
  /**
   * Scroll to error on click
   */
  onErrorClick?: (fieldName: string) => void;
  /**
   * Dismissible
   */
  dismissible?: boolean;
  /**
   * Dismiss handler
   */
  onDismiss?: () => void;
}

/**
 * FormSummaryError - Form-level error summary.
 * 
 * @example
 * ```tsx
 * <FormSummaryError
 *   errors={Object.fromEntries(
 *     Object.entries(errors).map(([k, v]) => [k, v?.message || ''])
 *   )}
 *   onErrorClick={(field) => document.getElementById(field)?.focus()}
 * />
 * ```
 */
const FormSummaryError = React.forwardRef<HTMLDivElement, FormSummaryErrorProps>(
  ({
    className,
    errors,
    title = "Please fix the following errors:",
    onErrorClick,
    dismissible,
    onDismiss,
  }, ref) => {
    const errorEntries = Object.entries(errors).filter(([, v]) => v);
    
    if (errorEntries.length === 0) return null;

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-lg border border-destructive/50 bg-destructive/10 p-4",
          className
        )}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-destructive">{title}</h4>
            <ul className="mt-2 space-y-1 text-sm">
              {errorEntries.map(([field, message]) => (
                <li key={field}>
                  {onErrorClick ? (
                    <button
                      type="button"
                      className="text-destructive hover:underline text-left"
                      onClick={() => onErrorClick(field)}
                    >
                      • {message}
                    </button>
                  ) : (
                    <span className="text-destructive">• {message}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {dismissible && (
            <button
              type="button"
              className="text-destructive hover:text-destructive/80"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </button>
          )}
        </div>
      </motion.div>
    );
  }
);

FormSummaryError.displayName = "FormSummaryError";

// =============================================================================
// FORM STATUS
// =============================================================================

export type FormStatusType = "idle" | "submitting" | "success" | "error";

export interface FormStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Form status
   */
  status: FormStatusType;
  /**
   * Success message
   */
  successMessage?: string;
  /**
   * Error message
   */
  errorMessage?: string;
  /**
   * Auto hide after success (ms)
   */
  autoHideSuccess?: number;
  /**
   * On status change
   */
  onStatusReset?: () => void;
}

const statusConfig = {
  idle: null,
  submitting: {
    icon: null,
    bg: "bg-muted",
    text: "text-muted-foreground",
    message: "Submitting...",
  },
  success: {
    icon: CheckCircle,
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-300",
    message: "Saved successfully!",
  },
  error: {
    icon: AlertCircle,
    bg: "bg-destructive/10",
    text: "text-destructive",
    message: "Something went wrong",
  },
};

/**
 * FormStatus - Form submission status indicator.
 * 
 * @example
 * ```tsx
 * <FormStatus
 *   status={formStatus}
 *   successMessage="Contact saved!"
 *   errorMessage="Failed to save contact"
 *   autoHideSuccess={3000}
 * />
 * ```
 */
const FormStatus = React.forwardRef<HTMLDivElement, FormStatusProps>(
  ({
    className,
    status,
    successMessage,
    errorMessage,
    autoHideSuccess = 0,
    onStatusReset,
    ...props
  }, ref) => {
    React.useEffect(() => {
      if (status === "success" && autoHideSuccess > 0) {
        const timer = setTimeout(() => {
          onStatusReset?.();
        }, autoHideSuccess);
        return () => clearTimeout(timer);
      }
    }, [status, autoHideSuccess, onStatusReset]);

    if (status === "idle") return null;

    const config = statusConfig[status];
    if (!config) return null;

    const Icon = config.icon;
    const message = 
      status === "success" ? (successMessage || config.message) :
      status === "error" ? (errorMessage || config.message) :
      config.message;

    return (
      <AnimatePresence mode="wait">
        <motion.div
          ref={ref}
          key={status}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
            config.bg,
            config.text,
            className
          )}
        >
          {status === "submitting" ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : Icon ? (
            <Icon className="h-4 w-4" />
          ) : null}
          <span>{message}</span>
        </motion.div>
      </AnimatePresence>
    );
  }
);

FormStatus.displayName = "FormStatus";

// =============================================================================
// VALIDATION HINT
// =============================================================================

export interface ValidationHintProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Hint message
   */
  message: string;
  /**
   * Hint type
   */
  type?: "info" | "warning";
}

/**
 * ValidationHint - Helper text for form fields.
 */
const ValidationHint = React.forwardRef<HTMLDivElement, ValidationHintProps>(
  ({ className, message, type = "info", ...props }, ref) => {
    const Icon = type === "warning" ? AlertTriangle : Info;
    
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-1.5 text-xs mt-1",
          type === "warning" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
          className
        )}
        {...props}
      >
        <Icon className="h-3 w-3" />
        <span>{message}</span>
      </div>
    );
  }
);

ValidationHint.displayName = "ValidationHint";

export {
  FormFieldError,
  FormFieldSuccess,
  FormSummaryError,
  FormStatus,
  ValidationHint,
};
