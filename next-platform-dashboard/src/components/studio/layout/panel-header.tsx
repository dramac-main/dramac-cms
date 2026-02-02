/**
 * Studio Panel Header
 * 
 * Reusable header for studio panels with title and collapse functionality.
 */

"use client";

import { memo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface PanelHeaderProps {
  title: string;
  icon?: LucideIcon;
  position: "left" | "right" | "bottom";
  onCollapse?: () => void;
  collapsed?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

// =============================================================================
// COLLAPSE ICONS
// =============================================================================

const collapseIcons = {
  left: { expand: ChevronRight, collapse: ChevronLeft },
  right: { expand: ChevronLeft, collapse: ChevronRight },
  bottom: { expand: ChevronUp, collapse: ChevronDown },
};

// =============================================================================
// COMPONENT
// =============================================================================

export const PanelHeader = memo(function PanelHeader({
  title,
  icon: Icon,
  position,
  onCollapse,
  collapsed = false,
  actions,
  className,
}: PanelHeaderProps) {
  const CollapseIcon = collapsed
    ? collapseIcons[position].expand
    : collapseIcons[position].collapse;

  return (
    <div
      className={cn(
        "flex h-10 shrink-0 items-center justify-between border-b border-border bg-background px-3",
        className
      )}
    >
      {/* Left side: Icon and Title */}
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
        <h3 className="text-sm font-medium">{title}</h3>
      </div>

      {/* Right side: Actions and Collapse */}
      <div className="flex items-center gap-1">
        {actions}
        
        {onCollapse && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onCollapse}
            title={collapsed ? "Expand panel" : "Collapse panel"}
          >
            <CollapseIcon className="h-4 w-4" />
            <span className="sr-only">
              {collapsed ? "Expand" : "Collapse"} {title}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
});
