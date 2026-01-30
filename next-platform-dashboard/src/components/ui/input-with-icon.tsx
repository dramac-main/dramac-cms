"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2, X, LucideIcon } from "lucide-react";

export interface InputWithIconProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  loading?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  error?: boolean;
  inputSize?: "sm" | "default" | "lg";
}

const sizeStyles = {
  sm: "h-8 text-xs px-2",
  default: "h-10 text-sm px-3",
  lg: "h-12 text-base px-4",
};

const iconSizeStyles = {
  sm: "h-3.5 w-3.5",
  default: "h-4 w-4",
  lg: "h-5 w-5",
};

const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(
  (
    {
      className,
      type,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      loading,
      clearable,
      onClear,
      error,
      inputSize = "default",
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const hasLeftIcon = !!LeftIcon;
    const hasRightContent = loading || clearable || !!RightIcon;
    const showClearButton = clearable && value && !disabled;

    return (
      <div className="relative">
        {/* Left Icon */}
        {LeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <LeftIcon className={iconSizeStyles[inputSize]} />
          </div>
        )}

        {/* Input */}
        <input
          type={type}
          className={cn(
            "flex w-full rounded-md border border-input bg-background ring-offset-background",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            sizeStyles[inputSize],
            hasLeftIcon && "pl-9",
            hasRightContent && "pr-9",
            error && "border-danger focus-visible:ring-danger",
            className
          )}
          ref={ref}
          disabled={disabled}
          value={value}
          {...props}
        />

        {/* Right Content */}
        {hasRightContent && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {loading && (
              <Loader2 className={cn("animate-spin text-muted-foreground", iconSizeStyles[inputSize])} />
            )}
            {showClearButton && !loading && (
              <button
                type="button"
                onClick={onClear}
                className="rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className={iconSizeStyles[inputSize]} />
                <span className="sr-only">Clear</span>
              </button>
            )}
            {RightIcon && !loading && !showClearButton && (
              <RightIcon className={cn("text-muted-foreground", iconSizeStyles[inputSize])} />
            )}
          </div>
        )}
      </div>
    );
  }
);
InputWithIcon.displayName = "InputWithIcon";

export { InputWithIcon };
