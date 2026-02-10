"use client";

import { cn } from "@/lib/utils";
import { MODULE_CATEGORIES } from "@/lib/modules/module-categories";
import { resolveIconName } from "@/lib/utils/icon-map";
import { icons } from "lucide-react";

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
 * Renders proper Lucide line icons instead of emoji.
 * On group-hover, the icon lines animate with a stroke-draw effect.
 * 
 * Supports emoji input from legacy DB records — auto-maps them
 * to Lucide equivalents via resolveIconName().
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

  // Resolve any input (emoji, Lucide name, kebab-case, null) to a Lucide component
  const iconName = resolveIconName(icon);
  const LucideIcon = icons[iconName as keyof typeof icons] || icons.Package;

  const sizeClasses = {
    sm: "w-10 h-10 rounded-lg",
    md: "w-12 h-12 rounded-xl",
    lg: "w-14 h-14 rounded-xl",
    xl: "w-16 h-16 rounded-2xl",
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
    xl: "w-8 h-8",
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
      <LucideIcon
        className={cn(
          iconSizes[size],
          "transition-all duration-500",
          tintColor ? "" : "text-muted-foreground",
          animated && "group-hover:icon-stroke-draw"
        )}
        style={tintColor ? { color: tintColor } : undefined}
        strokeWidth={1.5}
      />
    </div>
  );
}

