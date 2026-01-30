"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// DIVIDER VARIANTS
// =============================================================================

const dividerVariants = cva("shrink-0", {
  variants: {
    orientation: {
      horizontal: "w-full h-px",
      vertical: "h-full w-px",
    },
    variant: {
      default: "bg-border",
      muted: "bg-muted",
      strong: "bg-foreground/20",
      gradient: "bg-gradient-to-r from-transparent via-border to-transparent",
      dashed: "border-dashed border-t border-border bg-transparent",
      dotted: "border-dotted border-t border-border bg-transparent",
    },
    spacing: {
      none: "",
      sm: "",
      default: "",
      lg: "",
    },
  },
  compoundVariants: [
    // Horizontal spacing
    { orientation: "horizontal", spacing: "sm", className: "my-2" },
    { orientation: "horizontal", spacing: "default", className: "my-4" },
    { orientation: "horizontal", spacing: "lg", className: "my-6" },
    // Vertical spacing
    { orientation: "vertical", spacing: "sm", className: "mx-2" },
    { orientation: "vertical", spacing: "default", className: "mx-4" },
    { orientation: "vertical", spacing: "lg", className: "mx-6" },
  ],
  defaultVariants: {
    orientation: "horizontal",
    variant: "default",
    spacing: "default",
  },
});

// =============================================================================
// DIVIDER COMPONENT
// =============================================================================

export interface DividerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dividerVariants> {
  /**
   * Text content in the center of the divider
   */
  text?: string;
  /**
   * Icon in the center of the divider
   */
  icon?: LucideIcon;
  /**
   * Position of text/icon content
   * @default "center"
   */
  contentPosition?: "start" | "center" | "end";
  /**
   * Decorative role (no semantic meaning)
   * @default true
   */
  decorative?: boolean;
}

/**
 * Divider - A flexible divider/separator component.
 * 
 * Features:
 * - Horizontal and vertical orientations
 * - Multiple visual variants (solid, dashed, dotted, gradient)
 * - Optional text or icon content
 * - Configurable spacing
 * - Accessible (decorative by default)
 * 
 * @example
 * ```tsx
 * // Simple divider
 * <Divider />
 * 
 * // With text
 * <Divider text="OR" />
 * 
 * // With icon
 * <Divider icon={Star} />
 * 
 * // Dashed variant
 * <Divider variant="dashed" spacing="lg" />
 * 
 * // Gradient decorative
 * <Divider variant="gradient" />
 * 
 * // Vertical (in flex container)
 * <div className="flex h-10">
 *   <span>Left</span>
 *   <Divider orientation="vertical" />
 *   <span>Right</span>
 * </div>
 * ```
 */
const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  (
    {
      className,
      orientation = "horizontal",
      variant,
      spacing,
      text,
      icon: Icon,
      contentPosition = "center",
      decorative = true,
      ...props
    },
    ref
  ) => {
    const hasContent = text || Icon;
    const resolvedOrientation = orientation ?? "horizontal";
    
    // Simple divider without content
    if (!hasContent) {
      return (
        <div
          ref={ref}
          role={decorative ? "none" : "separator"}
          aria-orientation={decorative ? undefined : resolvedOrientation}
          className={cn(dividerVariants({ orientation: resolvedOrientation, variant, spacing }), className)}
          {...props}
        />
      );
    }

    // Divider with content (text or icon) - only horizontal supported
    if (resolvedOrientation === "vertical") {
      console.warn("Divider: Content (text/icon) is only supported with horizontal orientation.");
      return (
        <div
          ref={ref}
          role={decorative ? "none" : "separator"}
          className={cn(dividerVariants({ orientation: resolvedOrientation, variant, spacing }), className)}
          {...props}
        />
      );
    }

    const positionClasses = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
    };

    const lineVariant = variant === "gradient" || variant === "dashed" || variant === "dotted" 
      ? "default" 
      : variant;

    return (
      <div
        ref={ref}
        role={decorative ? "none" : "separator"}
        className={cn(
          "flex items-center",
          positionClasses[contentPosition],
          spacing === "sm" && "my-2",
          spacing === "default" && "my-4",
          spacing === "lg" && "my-6",
          className
        )}
        {...props}
      >
        {contentPosition !== "start" && (
          <div className={cn(
            "flex-1 h-px",
            dividerVariants({ variant: lineVariant, spacing: "none" }).replace(/m[xy]-\d+/g, '')
          )} />
        )}
        
        <span className={cn(
          "flex items-center gap-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider",
          contentPosition === "start" && "pl-0",
          contentPosition === "end" && "pr-0"
        )}>
          {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
          {text}
        </span>
        
        {contentPosition !== "end" && (
          <div className={cn(
            "flex-1 h-px",
            dividerVariants({ variant: lineVariant, spacing: "none" }).replace(/m[xy]-\d+/g, '')
          )} />
        )}
      </div>
    );
  }
);

Divider.displayName = "Divider";

// =============================================================================
// PRESET DIVIDERS
// =============================================================================

/**
 * Pre-configured dividers for common use cases
 */
export const DividerPresets = {
  /** "OR" divider for form alternatives */
  Or: (props: Omit<DividerProps, "text">) => (
    <Divider text="or" {...props} />
  ),
  
  /** "AND" divider */
  And: (props: Omit<DividerProps, "text">) => (
    <Divider text="and" {...props} />
  ),
  
  /** Decorative section break */
  SectionBreak: (props: Omit<DividerProps, "variant" | "spacing">) => (
    <Divider variant="gradient" spacing="lg" {...props} />
  ),
  
  /** Content separator with date */
  DateDivider: ({ date, ...props }: Omit<DividerProps, "text"> & { date: string }) => (
    <Divider text={date} variant="muted" {...props} />
  ),
};

export { Divider };
