"use client";

import { useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";
import { ButtonSettings } from "../settings/button-settings";

export interface ButtonComponentProps {
  text?: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
}

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

const variantClasses = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

export function ButtonComponent({
  text = "Click Me",
  variant = "default",
  size = "md",
  className = "",
  backgroundColor = "",
  textColor = "",
  borderRadius = "rounded-md",
}: ButtonComponentProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  const buttonClasses = cn(
    "inline-flex items-center justify-center font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    sizeClasses[size],
    !backgroundColor && variantClasses[variant],
    borderRadius,
    className
  );

  const style = {
    backgroundColor: backgroundColor || undefined,
    color: textColor || undefined,
  };

  // In editor mode, we don't navigate
  return (
    <button
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      className={buttonClasses}
      style={style}
      onClick={(e) => e.preventDefault()}
    >
      {text}
    </button>
  );
}

ButtonComponent.craft = {
  displayName: "Button",
  props: {
    text: "Click Me",
    variant: "default",
    size: "md",
    href: "",
    className: "",
    backgroundColor: "",
    textColor: "",
    borderRadius: "rounded-md",
  },
  related: {
    settings: ButtonSettings,
  },
  rules: {
    canDrag: () => true,
  },
};
