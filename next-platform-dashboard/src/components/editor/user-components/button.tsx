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
}

const variantStyles = {
  primary: { backgroundColor: "#6366f1", color: "#ffffff", border: "none" },
  secondary: { backgroundColor: "#f3f4f6", color: "#1f2937", border: "none" },
  outline: { backgroundColor: "transparent", color: "#1f2937", border: "1px solid #d1d5db" },
  ghost: { backgroundColor: "transparent", color: "#6366f1", border: "none" },
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
}: ButtonProps) {
  const { connectors: { connect, drag } } = useNode();

  const baseStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <button
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      onClick={(e) => e.preventDefault()}
      style={{
        ...baseStyle,
        ...sizeStyle,
        backgroundColor: backgroundColor || baseStyle.backgroundColor,
        color: textColor || baseStyle.color,
        borderRadius: `${borderRadius}px`,
        fontWeight: 600,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: fullWidth ? "100%" : "auto",
        transition: "opacity 0.2s",
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
  },
  related: {
    settings: ButtonSettingsNew,
  },
};
