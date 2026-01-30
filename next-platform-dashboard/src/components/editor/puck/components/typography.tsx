/**
 * Puck Typography Components
 * 
 * Typography components for text content.
 */

import type { HeadingProps, TextProps } from "@/types/puck";
import { cn } from "@/lib/utils";

// Font size utilities
const fontSizeMap: Record<string, string> = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

// Text alignment utilities
const alignmentMap: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
  justify: "text-justify",
};

// Heading size map
const headingSizeMap: Record<string, string> = {
  h1: "text-4xl md:text-5xl font-bold",
  h2: "text-3xl md:text-4xl font-bold",
  h3: "text-2xl md:text-3xl font-semibold",
  h4: "text-xl md:text-2xl font-semibold",
  h5: "text-lg md:text-xl font-medium",
  h6: "text-base md:text-lg font-medium",
};

/**
 * Heading Component
 * Display headings with configurable level and styling.
 */
export function HeadingRender({
  text = "Heading",
  level = "h2",
  alignment = "left",
  color,
}: HeadingProps) {
  const Tag = level as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  return (
    <Tag
      className={cn(
        headingSizeMap[level || "h2"],
        alignmentMap[alignment || "left"],
        "leading-tight"
      )}
      style={{
        color: color || undefined,
      }}
    >
      {text}
    </Tag>
  );
}

/**
 * Text Component
 * Display paragraph text with configurable styling.
 */
export function TextRender({
  text = "Enter your text here...",
  alignment = "left",
  color,
  fontSize = "base",
}: TextProps) {
  return (
    <p
      className={cn(
        fontSizeMap[fontSize || "base"],
        alignmentMap[alignment || "left"],
        "leading-relaxed"
      )}
      style={{
        color: color || undefined,
      }}
    >
      {text}
    </p>
  );
}
