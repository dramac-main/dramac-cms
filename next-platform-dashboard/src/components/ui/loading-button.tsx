"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button, ButtonProps, buttonVariants } from "./button";
import { cn } from "@/lib/utils";

export interface LoadingButtonProps extends ButtonProps {
  /**
   * Loading state. When true, shows spinner and disables the button.
   */
  loading?: boolean;
  /**
   * Text to display when loading. Defaults to children.
   */
  loadingText?: React.ReactNode;
  /**
   * Position of the spinner relative to the text.
   * @default "left"
   */
  spinnerPosition?: "left" | "right";
}

/**
 * LoadingButton - A button with built-in loading state.
 * 
 * Features:
 * - Accessible loading state with aria-busy
 * - Configurable loading text
 * - Spinner position (left/right)
 * - Inherits all Button props and variants
 * 
 * @example
 * ```tsx
 * <LoadingButton loading={isSubmitting} loadingText="Saving...">
 *   Save Changes
 * </LoadingButton>
 * 
 * <LoadingButton loading={isDeleting} variant="destructive" spinnerPosition="right">
 *   Delete
 * </LoadingButton>
 * ```
 */
const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      children,
      loading = false,
      loadingText,
      spinnerPosition = "left",
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const displayContent = loading && loadingText ? loadingText : children;

    const spinner = (
      <Loader2 
        className={cn(
          "h-4 w-4 animate-spin",
          spinnerPosition === "left" ? "mr-2" : "ml-2"
        )} 
        aria-hidden="true"
      />
    );

    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        className={cn(
          loading && "cursor-not-allowed",
          className
        )}
        {...props}
      >
        {loading && spinnerPosition === "left" && spinner}
        {displayContent}
        {loading && spinnerPosition === "right" && spinner}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

export { LoadingButton };
