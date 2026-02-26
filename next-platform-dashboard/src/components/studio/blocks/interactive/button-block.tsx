/**
 * DRAMAC Studio Premium Block: Button
 * 
 * A versatile button component with variants, sizes, icons,
 * loading states, and hover animations.
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  type ResponsiveValue,
  type Spacing,
  type AnimationConfig,
  getAnimationClass,
  getAnimationStyles,
  getVisibilityClass,
  DEFAULT_ANIMATION,
  uniformSpacing,
  spacingToCss,
} from "@/lib/studio/utils/responsive-utils";
import type { Breakpoint } from "@/types/studio";
import { Loader2 } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

export type ButtonVariant = 
  | "solid" 
  | "outline" 
  | "ghost" 
  | "link"
  | "gradient";

export type ButtonSize = "sm" | "md" | "lg" | "xl";

export interface ButtonBlockProps {
  // Content
  label: string;
  
  // Link
  href?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  
  // Style
  variant?: ButtonVariant;
  size?: ResponsiveValue<ButtonSize>;
  
  // Colors
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientDirection?: "to-r" | "to-l" | "to-t" | "to-b" | "to-tr" | "to-tl" | "to-br" | "to-bl";
  
  // Border
  borderRadius?: string;
  borderWidth?: string;
  
  // Typography
  fontWeight?: 400 | 500 | 600 | 700;
  
  // Icons
  iconLeft?: string;
  iconRight?: string;
  
  // States
  loading?: boolean;
  disabled?: boolean;
  
  // Effects
  hoverEffect?: "none" | "lift" | "glow" | "scale";
  shadow?: "none" | "sm" | "md" | "lg";
  
  // Spacing
  margin?: ResponsiveValue<Spacing>;
  
  // Layout
  fullWidth?: ResponsiveValue<boolean>;
  align?: ResponsiveValue<"left" | "center" | "right">;
  
  // Animation
  animation?: AnimationConfig;
  
  // Visibility
  hideOn?: Breakpoint[];
  
  // Advanced
  className?: string;
  id?: string;
}

// =============================================================================
// SIZE CLASSES
// =============================================================================

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
  xl: "px-8 py-4 text-xl",
};

const shadowClasses = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

const hoverEffectClasses = {
  none: "",
  lift: "hover:-translate-y-1 transition-transform",
  glow: "hover:shadow-lg hover:shadow-current/25 transition-shadow",
  scale: "hover:scale-105 transition-transform",
};

// =============================================================================
// COMPONENT
// =============================================================================

export function ButtonBlock({
  label,
  href,
  target = "_self",
  variant = "solid",
  size = { mobile: "md" },
  backgroundColor = "",
  textColor = "#ffffff",
  borderColor = "",
  gradientFrom = "",
  gradientTo = "",
  gradientDirection = "to-r",
  borderRadius = "8px",
  borderWidth = "2px",
  fontWeight = 600,
  iconLeft,
  iconRight,
  loading = false,
  disabled = false,
  hoverEffect = "lift",
  shadow = "none",
  margin = { mobile: uniformSpacing("0") },
  fullWidth = { mobile: false },
  align = { mobile: "left" },
  animation = DEFAULT_ANIMATION,
  hideOn,
  className,
  id,
}: ButtonBlockProps) {
  // Build button styles based on variant
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case "solid":
        return {
          backgroundColor,
          color: textColor,
          border: "none",
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          color: borderColor,
          border: `${borderWidth} solid ${borderColor}`,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          color: textColor,
          border: "none",
        };
      case "link":
        return {
          backgroundColor: "transparent",
          color: textColor,
          border: "none",
          textDecoration: "underline",
        };
      case "gradient":
        return {
          background: `linear-gradient(${gradientDirection.replace("to-", "to ")}, ${gradientFrom}, ${gradientTo})`,
          color: textColor,
          border: "none",
        };
      default:
        return {
          backgroundColor,
          color: textColor,
        };
    }
  };
  
  const variantStyles = getVariantStyles();
  
  // Responsive styles
  const responsiveStyles = {
    "--studio-margin-mobile": spacingToCss(margin.mobile),
    "--studio-margin-tablet": spacingToCss(margin.tablet ?? margin.mobile),
    "--studio-margin-desktop": spacingToCss(margin.desktop ?? margin.tablet ?? margin.mobile),
  } as React.CSSProperties;
  
  // Animation
  const animationClass = getAnimationClass(animation);
  const animationStyles = getAnimationStyles(animation);
  
  // Visibility
  const visibilityClass = getVisibilityClass(hideOn);
  
  // Wrapper alignment
  const alignClass = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }[align.mobile];
  
  const buttonContent = (
    <>
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {!loading && iconLeft && <span className="mr-2">{iconLeft}</span>}
      {label}
      {!loading && iconRight && <span className="ml-2">{iconRight}</span>}
    </>
  );
  
  const buttonClasses = cn(
    "inline-flex items-center justify-center font-semibold transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-primary,#3b82f6)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    sizeClasses[size.mobile],
    shadowClasses[shadow],
    hoverEffectClasses[hoverEffect],
    fullWidth.mobile && "w-full",
    animationClass,
    visibilityClass,
    className
  );
  
  const buttonStyle: React.CSSProperties = {
    ...variantStyles,
    ...responsiveStyles,
    ...animationStyles,
    borderRadius,
    fontWeight,
  };
  
  // Render as link or button
  const ButtonElement = href ? (
    <a
      id={id}
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      className={buttonClasses}
      style={buttonStyle}
    >
      {buttonContent}
    </a>
  ) : (
    <button
      id={id}
      type="button"
      disabled={disabled || loading}
      className={buttonClasses}
      style={buttonStyle}
    >
      {buttonContent}
    </button>
  );
  
  return (
    <div 
      className={cn("flex studio-responsive-margin", alignClass)}
      style={responsiveStyles}
    >
      {ButtonElement}
    </div>
  );
}

// =============================================================================
// FIELD DEFINITIONS
// =============================================================================

export const buttonBlockFields = {
  label: {
    type: "text" as const,
    label: "Button Label",
    defaultValue: "Click Me",
  },
  href: {
    type: "text" as const,
    label: "Link URL",
    placeholder: "https://example.com",
    group: "Link",
  },
  target: {
    type: "select" as const,
    label: "Open In",
    options: [
      { label: "Same Tab", value: "_self" },
      { label: "New Tab", value: "_blank" },
    ],
    defaultValue: "_self",
    group: "Link",
  },
  variant: {
    type: "select" as const,
    label: "Variant",
    options: [
      { label: "Solid", value: "solid" },
      { label: "Outline", value: "outline" },
      { label: "Ghost", value: "ghost" },
      { label: "Link", value: "link" },
      { label: "Gradient", value: "gradient" },
    ],
    defaultValue: "solid",
    group: "Style",
  },
  size: {
    type: "select" as const,
    label: "Size",
    options: [
      { label: "Small", value: "sm" },
      { label: "Medium", value: "md" },
      { label: "Large", value: "lg" },
      { label: "Extra Large", value: "xl" },
    ],
    defaultValue: "md",
    responsive: true,
    group: "Style",
  },
  backgroundColor: {
    type: "color" as const,
    label: "Background Color",
    defaultValue: "",
    group: "Colors",
  },
  textColor: {
    type: "color" as const,
    label: "Text Color",
    defaultValue: "#ffffff",
    group: "Colors",
  },
  borderColor: {
    type: "color" as const,
    label: "Border Color",
    defaultValue: "",
    group: "Colors",
  },
  gradientFrom: {
    type: "color" as const,
    label: "Gradient Start",
    defaultValue: "",
    showWhen: { variant: "gradient" },
    group: "Colors",
  },
  gradientTo: {
    type: "color" as const,
    label: "Gradient End",
    defaultValue: "",
    showWhen: { variant: "gradient" },
    group: "Colors",
  },
  borderRadius: {
    type: "text" as const,
    label: "Border Radius",
    defaultValue: "8px",
    group: "Border",
  },
  fullWidth: {
    type: "toggle" as const,
    label: "Full Width",
    defaultValue: false,
    responsive: true,
    group: "Layout",
  },
  align: {
    type: "select" as const,
    label: "Alignment",
    options: [
      { label: "Left", value: "left" },
      { label: "Center", value: "center" },
      { label: "Right", value: "right" },
    ],
    defaultValue: "left",
    responsive: true,
    group: "Layout",
  },
  hoverEffect: {
    type: "select" as const,
    label: "Hover Effect",
    options: [
      { label: "None", value: "none" },
      { label: "Lift", value: "lift" },
      { label: "Glow", value: "glow" },
      { label: "Scale", value: "scale" },
    ],
    defaultValue: "lift",
    group: "Effects",
  },
  shadow: {
    type: "select" as const,
    label: "Shadow",
    options: [
      { label: "None", value: "none" },
      { label: "Small", value: "sm" },
      { label: "Medium", value: "md" },
      { label: "Large", value: "lg" },
    ],
    defaultValue: "none",
    group: "Effects",
  },
};

export const buttonBlockDefaultProps: ButtonBlockProps = {
  label: "Click Me",
  variant: "solid",
  size: { mobile: "md" },
  backgroundColor: "",
  textColor: "#ffffff",
  borderColor: "",
  gradientFrom: "",
  gradientTo: "",
  gradientDirection: "to-r",
  borderRadius: "8px",
  borderWidth: "2px",
  fontWeight: 600,
  loading: false,
  disabled: false,
  hoverEffect: "lift",
  shadow: "none",
  margin: { mobile: uniformSpacing("0") },
  fullWidth: { mobile: false },
  align: { mobile: "left" },
  animation: DEFAULT_ANIMATION,
};
