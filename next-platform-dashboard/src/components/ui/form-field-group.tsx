"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

export interface FormFieldGroupProps {
  label?: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  layout?: "vertical" | "horizontal" | "inline";
  required?: boolean;
  htmlFor?: string;
}

export function FormFieldGroup({
  label,
  description,
  error,
  children,
  className,
  layout = "vertical",
  required = false,
  htmlFor,
}: FormFieldGroupProps) {
  const layoutStyles = {
    vertical: "space-y-2",
    horizontal: "grid grid-cols-1 md:grid-cols-3 gap-4 items-start",
    inline: "flex flex-wrap items-center gap-4",
  };

  const labelStyles = {
    vertical: "",
    horizontal: "md:col-span-1",
    inline: "",
  };

  const contentStyles = {
    vertical: "space-y-2",
    horizontal: "md:col-span-2 space-y-2",
    inline: "flex-1",
  };

  return (
    <div className={cn(layoutStyles[layout], className)}>
      {label && (
        <div className={cn("space-y-1", labelStyles[layout])}>
          <Label
            htmlFor={htmlFor}
            className={cn(error && "text-danger")}
          >
            {label}
            {required && (
              <span className="text-danger ml-0.5">*</span>
            )}
          </Label>
          {description && layout !== "inline" && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className={contentStyles[layout]}>
        {children}
        
        {error && (
          <p className="text-xs text-danger flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

// Group multiple form fields with a shared label
export interface FormFieldRowProps {
  children: React.ReactNode;
  className?: string;
  gap?: "sm" | "default" | "lg";
}

export function FormFieldRow({
  children,
  className,
  gap = "default",
}: FormFieldRowProps) {
  const gapStyles = {
    sm: "gap-2",
    default: "gap-4",
    lg: "gap-6",
  };

  return (
    <div className={cn("flex flex-col sm:flex-row", gapStyles[gap], className)}>
      {children}
    </div>
  );
}

// Wrapper for optional fields with visual distinction
export interface OptionalFieldWrapperProps {
  children: React.ReactNode;
  showOptionalBadge?: boolean;
  className?: string;
}

export function OptionalFieldWrapper({
  children,
  showOptionalBadge = true,
  className,
}: OptionalFieldWrapperProps) {
  return (
    <div className={cn("relative", className)}>
      {showOptionalBadge && (
        <span className="absolute -top-2 right-0 text-[10px] text-muted-foreground bg-background px-1">
          Optional
        </span>
      )}
      {children}
    </div>
  );
}

// Field hint component for additional context
export interface FieldHintProps {
  children: React.ReactNode;
  type?: "info" | "warning" | "success";
  className?: string;
}

export function FieldHint({
  children,
  type = "info",
  className,
}: FieldHintProps) {
  const typeStyles = {
    info: "text-muted-foreground",
    warning: "text-warning",
    success: "text-success",
  };

  return (
    <p className={cn("text-xs mt-1", typeStyles[type], className)}>
      {children}
    </p>
  );
}
