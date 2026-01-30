/**
 * Puck Button Components
 * 
 * Button components for interactive elements.
 */

import type { ButtonProps } from "@/types/puck";
import { cn } from "@/lib/utils";

// Button variant classes
const variantMap: Record<string, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border border-primary text-primary hover:bg-primary/10",
  ghost: "text-primary hover:bg-primary/10",
};

// Button size classes
const sizeMap: Record<string, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

/**
 * Button Component
 * Interactive button with configurable styling and link support.
 */
export function ButtonRender({
  text = "Click me",
  link = "#",
  variant = "primary",
  size = "md",
  fullWidth = false,
  openInNewTab = false,
}: ButtonProps) {
  const Component = link ? "a" : "button";

  const props = link
    ? {
        href: link,
        target: openInNewTab ? "_blank" : undefined,
        rel: openInNewTab ? "noopener noreferrer" : undefined,
      }
    : {};

  return (
    <Component
      {...props}
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        variantMap[variant || "primary"],
        sizeMap[size || "md"],
        fullWidth && "w-full"
      )}
    >
      {text}
    </Component>
  );
}
