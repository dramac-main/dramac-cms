"use client";

import { cn } from "@/lib/utils";
import { MODULE_CATEGORIES } from "@/lib/modules/module-categories";

interface ModuleIconContainerProps {
  icon: string | null | undefined;
  category?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  /** Whether to show the hover animation — typically set on card hover via group */
  animated?: boolean;
}

/**
 * Consistent, themed icon container for module cards.
 * 
 * Uses the module's category color as a subtle background tint.
 * On group-hover, the icon plays a gentle breathe animation.
 * 
 * Industry standard: Shopify App Store, WordPress Plugin Directory,
 * Figma Community — all use consistent themed icon containers.
 */
export function ModuleIconContainer({
  icon,
  category,
  size = "md",
  className,
  animated = true,
}: ModuleIconContainerProps) {
  // Get category color for tint, fall back to neutral
  const categoryInfo = category
    ? MODULE_CATEGORIES[category as keyof typeof MODULE_CATEGORIES]
    : null;
  const tintColor = categoryInfo?.color || null;

  const sizeClasses = {
    sm: "w-10 h-10 text-xl rounded-lg",
    md: "w-12 h-12 text-2xl rounded-xl",
    lg: "w-14 h-14 text-3xl rounded-xl",
    xl: "w-16 h-16 text-4xl rounded-2xl",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center shrink-0 transition-all duration-300",
        sizeClasses[size],
        animated && "group-hover:animate-iconBreathe",
        !tintColor && "bg-muted",
        className
      )}
      style={
        tintColor
          ? {
              backgroundColor: `${tintColor}14`, // 8% opacity
              boxShadow: `0 0 0 1px ${tintColor}1A`, // very subtle border
            }
          : undefined
      }
    >
      {icon || "📦"}
    </div>
  );
}
