"use client";

import { useNode } from "@craftjs/core";
import { ButtonSettingsNew } from "../settings/button-settings-new";

interface ButtonProps {
  text?: string;
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  fullWidth?: boolean;
  useThemeColors?: boolean;
}

// Default fallback colors (used when theme not available)
const DEFAULT_PRIMARY = "#8b5cf6"; // Violet from brand
const DEFAULT_SECONDARY = "#14b8a6"; // Teal from brand

const variantStyles = {
  primary: { backgroundColor: DEFAULT_PRIMARY, color: "#ffffff", border: "none" },
  secondary: { backgroundColor: "#f3f4f6", color: "#1f2937", border: "none" },
  outline: { backgroundColor: "transparent", color: "#1f2937", border: "1px solid #d1d5db" },
  ghost: { backgroundColor: "transparent", color: DEFAULT_PRIMARY, border: "none" },
};

const sizeStyles = {
  sm: { padding: "8px 16px", fontSize: "14px" },
  md: { padding: "12px 24px", fontSize: "16px" },
  lg: { padding: "16px 32px", fontSize: "18px" },
};

export function Button({
  text = "Click me",
  href: _href = "#",
  variant = "primary",
  size = "md",
  backgroundColor,
  textColor,
  borderRadius = 6,
  fullWidth = false,
  useThemeColors = true,
}: ButtonProps) {
  const { connectors: { connect, drag } } = useNode();

  const baseStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  // Determine colors - use theme CSS variables if useThemeColors is enabled
  const getBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;
    if (useThemeColors && variant === "primary") return "var(--primary, " + DEFAULT_PRIMARY + ")";
    if (useThemeColors && variant === "ghost") return "transparent";
    return baseStyle.backgroundColor;
  };

  const getTextColor = () => {
    if (textColor) return textColor;
    if (useThemeColors && variant === "primary") return "var(--primary-foreground, #ffffff)";
    if (useThemeColors && variant === "ghost") return "var(--primary, " + DEFAULT_PRIMARY + ")";
    return baseStyle.color;
  };

  return (
    <button
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      onClick={(e) => e.preventDefault()}
      style={{
        ...baseStyle,
        ...sizeStyle,
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
        borderRadius: `${borderRadius}px`,
        fontWeight: 600,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: fullWidth ? "100%" : "auto",
        transition: "opacity 0.2s, transform 0.2s",
      }}
    >
      {text}
    </button>
  );
}

Button.craft = {
  displayName: "Button",
  props: {
    text: "Click me",
    href: "#",
    variant: "primary",
    size: "md",
    backgroundColor: "",
    textColor: "",
    borderRadius: 6,
    fullWidth: false,
    useThemeColors: true,
  },
  related: {
    settings: ButtonSettingsNew,
  },
};
