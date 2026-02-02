/**
 * DRAMAC Studio Breakpoint Selector
 * 
 * Toolbar component for selecting responsive breakpoint.
 */

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/studio/store/ui-store";
import { 
  BREAKPOINT_LABELS, 
  BREAKPOINT_PIXELS,
} from "@/lib/studio/utils/responsive-utils";
import type { Breakpoint } from "@/types/studio";
import { Smartphone, Tablet, Monitor, ChevronDown } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface BreakpointOption {
  id: Breakpoint;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  width: string;
  pixels: number;
}

const BREAKPOINT_OPTIONS: BreakpointOption[] = [
  { 
    id: "mobile", 
    label: "Mobile", 
    icon: Smartphone, 
    width: "375px",
    pixels: BREAKPOINT_PIXELS.mobile,
  },
  { 
    id: "tablet", 
    label: "Tablet", 
    icon: Tablet, 
    width: "768px",
    pixels: BREAKPOINT_PIXELS.tablet,
  },
  { 
    id: "desktop", 
    label: "Desktop", 
    icon: Monitor, 
    width: "100%",
    pixels: BREAKPOINT_PIXELS.desktop,
  },
];

// =============================================================================
// BREAKPOINT ICONS MAP
// =============================================================================

export const BREAKPOINT_ICON_MAP: Record<Breakpoint, React.ComponentType<{ className?: string }>> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

// =============================================================================
// MAIN SELECTOR COMPONENT
// =============================================================================

interface BreakpointSelectorProps {
  variant?: "buttons" | "dropdown";
  showLabels?: boolean;
  showWidths?: boolean;
  className?: string;
}

export function BreakpointSelector({
  variant = "buttons",
  showLabels = false,
  showWidths = true,
  className,
}: BreakpointSelectorProps) {
  const breakpoint = useUIStore((s) => s.breakpoint);
  const setBreakpoint = useUIStore((s) => s.setBreakpoint);
  
  // Get current breakpoint details
  const currentOption = BREAKPOINT_OPTIONS.find(opt => opt.id === breakpoint)!;
  
  if (variant === "dropdown") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={cn("gap-2", className)}>
            <currentOption.icon className="h-4 w-4" />
            {showLabels && <span>{currentOption.label}</span>}
            {showWidths && (
              <span className="text-xs text-muted-foreground">
                {currentOption.width}
              </span>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          {BREAKPOINT_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.id}
              onClick={() => setBreakpoint(option.id)}
              className={cn(
                "gap-2",
                breakpoint === option.id && "bg-accent"
              )}
            >
              <option.icon className="h-4 w-4" />
              <span>{option.label}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {option.width}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  // Button group variant (default - already in toolbar)
  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("flex items-center bg-muted rounded-lg p-0.5", className)}>
        {BREAKPOINT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = breakpoint === option.id;
          
          return (
            <Tooltip key={option.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setBreakpoint(option.id)}
                  className={cn(
                    "h-8 px-3 gap-1.5",
                    isActive && "bg-background shadow-sm"
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                  {showLabels && (
                    <span className={cn(
                      "text-xs",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {option.label}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-center">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.width}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

// =============================================================================
// COMPACT VERSION (for tight spaces)
// =============================================================================

export function BreakpointSelectorCompact({ className }: { className?: string }) {
  const breakpoint = useUIStore((s) => s.breakpoint);
  const setBreakpoint = useUIStore((s) => s.setBreakpoint);
  
  const nextBreakpoint = (): Breakpoint => {
    const order: Breakpoint[] = ["mobile", "tablet", "desktop"];
    const currentIndex = order.indexOf(breakpoint);
    return order[(currentIndex + 1) % order.length];
  };
  
  const currentOption = BREAKPOINT_OPTIONS.find(opt => opt.id === breakpoint)!;
  const Icon = currentOption.icon;
  
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setBreakpoint(nextBreakpoint())}
            className={cn("h-8 w-8", className)}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>{currentOption.label}</span>
          <span className="text-xs text-muted-foreground ml-1">
            (click to cycle)
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// =============================================================================
// BREAKPOINT INDICATOR (for properties panel)
// =============================================================================

export function BreakpointIndicator({ className }: { className?: string }) {
  const breakpoint = useUIStore((s) => s.breakpoint);
  const option = BREAKPOINT_OPTIONS.find(opt => opt.id === breakpoint)!;
  const Icon = option.icon;
  
  return (
    <div className={cn(
      "flex items-center gap-1.5 text-xs text-muted-foreground",
      className
    )}>
      <Icon className="h-3.5 w-3.5" />
      <span>Editing for {option.label}</span>
    </div>
  );
}

export default BreakpointSelector;
