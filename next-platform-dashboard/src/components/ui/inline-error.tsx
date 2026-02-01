// src/components/ui/inline-error.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  AlertCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  CheckCircle,
  type LucideIcon 
} from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

// =============================================================================
// VARIANTS
// =============================================================================

const inlineMessageVariants = cva(
  "flex items-center gap-1.5 text-xs font-medium animate-in fade-in-50 slide-in-from-top-1 duration-200",
  {
    variants: {
      variant: {
        error: "text-danger",
        warning: "text-warning",
        success: "text-success",
        info: "text-info",
      },
      size: {
        sm: "text-[11px]",
        default: "text-xs",
        lg: "text-sm",
      },
    },
    defaultVariants: {
      variant: "error",
      size: "default",
    },
  }
);

const iconMap: Record<string, LucideIcon> = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
};

// =============================================================================
// TYPES
// =============================================================================

export interface InlineMessageProps
  extends VariantProps<typeof inlineMessageVariants> {
  /** Message to display */
  message?: string | null;
  /** Array of messages - shows first one */
  messages?: string[] | null;
  /** Whether to show the icon */
  showIcon?: boolean;
  /** Custom icon */
  icon?: LucideIcon;
  /** Additional class names */
  className?: string;
  /** ID for accessibility */
  id?: string;
}

// =============================================================================
// INLINE MESSAGE COMPONENT
// =============================================================================

/**
 * InlineMessage - Displays inline validation or status messages
 *
 * Commonly used below form inputs for field-level validation feedback.
 * Supports error, warning, success, and info variants.
 *
 * @example
 * ```tsx
 * // Error message
 * <InlineMessage message={errors.email} variant="error" />
 *
 * // Success message
 * <InlineMessage message="Email is available" variant="success" />
 *
 * // Warning message
 * <InlineMessage message="Password is weak" variant="warning" />
 *
 * // Array of messages (shows first)
 * <InlineMessage messages={['Error 1', 'Error 2']} />
 * ```
 */
export function InlineMessage({
  message,
  messages,
  variant = "error",
  size,
  showIcon = true,
  icon,
  className,
  id,
}: InlineMessageProps) {
  // Get the message to display
  const displayMessage = message || (messages && messages[0]);

  // Don't render if no message
  if (!displayMessage) {
    return null;
  }

  const Icon = icon || iconMap[variant || "error"];
  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <p
      id={id}
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={cn(inlineMessageVariants({ variant, size }), className)}
    >
      {showIcon && <Icon className={cn(iconSize, "shrink-0")} />}
      <span>{displayMessage}</span>
    </p>
  );
}

// =============================================================================
// CONVENIENCE COMPONENTS
// =============================================================================

/**
 * InlineError - Error variant of InlineMessage
 */
export function InlineError({
  message,
  messages,
  ...props
}: Omit<InlineMessageProps, "variant">) {
  return (
    <InlineMessage
      message={message}
      messages={messages}
      variant="error"
      {...props}
    />
  );
}

/**
 * InlineWarning - Warning variant of InlineMessage
 */
export function InlineWarning({
  message,
  messages,
  ...props
}: Omit<InlineMessageProps, "variant">) {
  return (
    <InlineMessage
      message={message}
      messages={messages}
      variant="warning"
      {...props}
    />
  );
}

/**
 * InlineSuccess - Success variant of InlineMessage
 */
export function InlineSuccess({
  message,
  messages,
  ...props
}: Omit<InlineMessageProps, "variant">) {
  return (
    <InlineMessage
      message={message}
      messages={messages}
      variant="success"
      {...props}
    />
  );
}

/**
 * InlineInfo - Info variant of InlineMessage
 */
export function InlineInfo({
  message,
  messages,
  ...props
}: Omit<InlineMessageProps, "variant">) {
  return (
    <InlineMessage
      message={message}
      messages={messages}
      variant="info"
      {...props}
    />
  );
}

// =============================================================================
// FIELD ERROR (For form fields with react-hook-form)
// =============================================================================

export interface FieldErrorProps {
  /** Field error from react-hook-form */
  error?: { message?: string } | undefined;
  /** Additional class names */
  className?: string;
  /** ID for aria-describedby */
  id?: string;
}

/**
 * FieldError - Display react-hook-form field errors
 *
 * @example
 * ```tsx
 * <FieldError error={form.formState.errors.email} />
 * ```
 */
export function FieldError({ error, className, id }: FieldErrorProps) {
  if (!error?.message) {
    return null;
  }

  return (
    <InlineError
      id={id}
      message={error.message}
      className={className}
    />
  );
}

export default InlineMessage;
