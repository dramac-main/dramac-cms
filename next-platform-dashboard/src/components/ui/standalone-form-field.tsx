// src/components/ui/standalone-form-field.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Label } from "./label";
import { Input } from "./input";
import { Textarea } from "./textarea";

// =============================================================================
// TYPES
// =============================================================================

export interface StandaloneFormFieldProps {
  /** Field name for id and accessibility */
  name: string;
  /** Field label */
  label: string;
  /** Error message to display */
  error?: string | string[];
  /** Success message (shown when valid) */
  success?: string;
  /** Help text shown below the field */
  description?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether to show valid state */
  showValidState?: boolean;
  /** Additional class names */
  className?: string;
  /** Children (the actual input element) */
  children: React.ReactNode;
}

export interface SimpleFormFieldProps
  extends Omit<StandaloneFormFieldProps, "children"> {
  /** Field type */
  type?: "text" | "email" | "password" | "number" | "url" | "tel" | "textarea";
  /** Field value */
  value?: string;
  /** Change handler */
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  /** Blur handler */
  onBlur?: (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Rows for textarea */
  rows?: number;
  /** Input props */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  /** Textarea props */
  textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
}

// =============================================================================
// STANDALONE FORM FIELD
// =============================================================================

/**
 * StandaloneFormField - A wrapper for form inputs with label, error, and description
 *
 * Use this when you need form field styling without react-hook-form integration.
 * For react-hook-form, use the FormField component from ui/form.tsx
 *
 * @example
 * ```tsx
 * <StandaloneFormField
 *   name="email"
 *   label="Email Address"
 *   error={errors.email}
 *   required
 * >
 *   <Input
 *     type="email"
 *     value={email}
 *     onChange={(e) => setEmail(e.target.value)}
 *   />
 * </StandaloneFormField>
 * ```
 */
export function StandaloneFormField({
  name,
  label,
  error,
  success,
  description,
  required,
  disabled,
  showValidState = false,
  className,
  children,
}: StandaloneFormFieldProps) {
  const errorMessage = Array.isArray(error) ? error[0] : error;
  const hasError = !!errorMessage;
  const showSuccess = showValidState && success && !hasError;

  const descriptionId = `${name}-description`;
  const errorId = `${name}-error`;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <Label
        htmlFor={name}
        className={cn(
          hasError && "text-danger",
          disabled && "text-muted-foreground cursor-not-allowed"
        )}
      >
        {label}
        {required && (
          <span className="text-danger ml-1" aria-hidden="true">
            *
          </span>
        )}
      </Label>

      {/* Input wrapper with cloned children */}
      <div className="relative">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
              id: name,
              name,
              disabled,
              "aria-invalid": hasError,
              "aria-describedby": cn(
                description && descriptionId,
                hasError && errorId
              ),
              className: cn(
                (child.props as { className?: string }).className,
                hasError &&
                  "border-danger focus-visible:ring-danger/30 focus-visible:border-danger",
                showSuccess &&
                  "border-success focus-visible:ring-success/30 focus-visible:border-success"
              ),
            });
          }
          return child;
        })}
      </div>

      {/* Description */}
      {description && !hasError && !showSuccess && (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}

      {/* Error message */}
      {hasError && (
        <p
          id={errorId}
          className="text-xs text-danger flex items-center gap-1.5"
          role="alert"
        >
          <AlertCircle className="h-3 w-3 shrink-0" />
          {errorMessage}
        </p>
      )}

      {/* Success message */}
      {showSuccess && (
        <p className="text-xs text-success flex items-center gap-1.5">
          <CheckCircle className="h-3 w-3 shrink-0" />
          {success}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// SIMPLE FORM FIELD (All-in-one)
// =============================================================================

/**
 * SimpleFormField - Complete form field with built-in input
 *
 * A convenience component that combines StandaloneFormField with Input/Textarea.
 * Useful for quick form building without separate input components.
 *
 * @example
 * ```tsx
 * <SimpleFormField
 *   name="email"
 *   label="Email Address"
 *   type="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   error={errors.email}
 *   required
 * />
 * ```
 */
export function SimpleFormField({
  name,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  rows = 3,
  inputProps,
  textareaProps,
  ...fieldProps
}: SimpleFormFieldProps) {
  const isTextarea = type === "textarea";

  return (
    <StandaloneFormField name={name} label={label} {...fieldProps}>
      {isTextarea ? (
        <Textarea
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={rows}
          {...textareaProps}
        />
      ) : (
        <Input
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          {...inputProps}
        />
      )}
    </StandaloneFormField>
  );
}

// Export both components
export default StandaloneFormField;
