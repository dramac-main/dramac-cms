/**
 * DRAMAC Studio State Test Button
 * 
 * Allows testing component states (hover, active, focus) interactively
 * by cycling through states and showing visual feedback.
 * 
 * @phase STUDIO-22 - Component States
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronDown,
  MousePointer,
  MousePointerClick,
  Focus,
  Square,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore, useSelectionStore } from "@/lib/studio/store";
import type { ComponentState } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface StateTestButtonProps {
  /** CSS class name */
  className?: string;
  /** Whether to show text labels */
  showLabels?: boolean;
  /** Callback when state changes */
  onStateChange?: (state: ComponentState) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STATES: ComponentState[] = ["default", "hover", "active", "focus"];

const STATE_CONFIG: Record<ComponentState, {
  label: string;
  icon: LucideIcon;
  color: string;
}> = {
  default: {
    label: "Default",
    icon: Square,
    color: "text-muted-foreground",
  },
  hover: {
    label: "Hover",
    icon: MousePointer,
    color: "text-blue-500",
  },
  active: {
    label: "Active",
    icon: MousePointerClick,
    color: "text-orange-500",
  },
  focus: {
    label: "Focus",
    icon: Focus,
    color: "text-purple-500",
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function StateTestButton({ 
  className,
  showLabels = false,
  onStateChange,
}: StateTestButtonProps) {
  // Store access
  const previewingState = useUIStore((s) => s.previewingState);
  const setPreviewingState = useUIStore((s) => s.setPreviewingState);
  const selectedId = useSelectionStore((s) => s.componentId);
  
  // Auto-cycle state
  const [isAutoCycling, setIsAutoCycling] = useState(false);
  const [cycleIndex, setCycleIndex] = useState(0);
  
  // Current display state
  const currentState = previewingState || "default";
  const currentConfig = STATE_CONFIG[currentState];
  const CurrentIcon = currentConfig.icon;
  
  // Handle state selection
  const handleStateSelect = useCallback((state: ComponentState | null) => {
    const newState = state === "default" ? null : state;
    setPreviewingState(newState);
    onStateChange?.(state || "default");
    setIsAutoCycling(false);
  }, [setPreviewingState, onStateChange]);
  
  // Reset to default state
  const handleReset = useCallback(() => {
    setPreviewingState(null);
    setIsAutoCycling(false);
    setCycleIndex(0);
    onStateChange?.("default");
  }, [setPreviewingState, onStateChange]);
  
  // Toggle auto-cycle
  const toggleAutoCycle = useCallback(() => {
    setIsAutoCycling((prev) => !prev);
    if (!isAutoCycling) {
      setCycleIndex(0);
    }
  }, [isAutoCycling]);
  
  // Auto-cycle effect
  useEffect(() => {
    if (!isAutoCycling || !selectedId) return;
    
    const interval = setInterval(() => {
      setCycleIndex((prev) => {
        const nextIndex = (prev + 1) % STATES.length;
        const nextState = STATES[nextIndex];
        setPreviewingState(nextState === "default" ? null : nextState);
        onStateChange?.(nextState);
        return nextIndex;
      });
    }, 1500); // Cycle every 1.5 seconds
    
    return () => clearInterval(interval);
  }, [isAutoCycling, selectedId, setPreviewingState, onStateChange]);
  
  // Track selected ID changes
  const prevSelectedIdRef = useRef(selectedId);
  
  // Stop auto-cycle if no component selected (using ref to avoid effect warning)
  useEffect(() => {
    if (!selectedId && prevSelectedIdRef.current && isAutoCycling) {
      setIsAutoCycling(false);
    }
    prevSelectedIdRef.current = selectedId;
  }, [selectedId, isAutoCycling]);
  
  // If no component selected, show disabled state
  if (!selectedId) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn("opacity-50 cursor-not-allowed", className)}
              disabled
            >
              <Square className="h-4 w-4" />
              {showLabels && <span className="ml-2">State</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Select a component to test states</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* State selector dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-1.5",
              currentState !== "default" && "bg-muted"
            )}
          >
            <CurrentIcon className={cn("h-4 w-4", currentConfig.color)} />
            {showLabels && (
              <span className={currentConfig.color}>
                {currentConfig.label}
              </span>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuLabel>Preview State</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STATES.map((state) => {
            const config = STATE_CONFIG[state];
            const Icon = config.icon;
            const isActive = currentState === state;
            
            return (
              <DropdownMenuItem
                key={state}
                onClick={() => handleStateSelect(state === "default" ? null : state)}
                className={cn(
                  "gap-2 cursor-pointer",
                  isActive && "bg-muted"
                )}
              >
                <Icon className={cn("h-4 w-4", config.color)} />
                <span>{config.label}</span>
                {isActive && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    Active
                  </span>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Auto-cycle button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                isAutoCycling && "bg-green-500/20 text-green-600"
              )}
              onClick={toggleAutoCycle}
            >
              {isAutoCycling ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isAutoCycling ? "Stop" : "Start"} state cycling</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Reset button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleReset}
              disabled={currentState === "default" && !isAutoCycling}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reset to default state</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// =============================================================================
// MINI STATE TESTER (for toolbar)
// =============================================================================

export function StateTestMini({ className }: { className?: string }) {
  const previewingState = useUIStore((s) => s.previewingState);
  const setPreviewingState = useUIStore((s) => s.setPreviewingState);
  const selectedId = useSelectionStore((s) => s.componentId);
  
  if (!selectedId) return null;
  
  const currentState = previewingState || "default";
  const currentIndex = STATES.indexOf(currentState);
  
  const cycleNext = () => {
    const nextIndex = (currentIndex + 1) % STATES.length;
    const nextState = STATES[nextIndex];
    setPreviewingState(nextState === "default" ? null : nextState);
  };
  
  const config = STATE_CONFIG[currentState];
  const Icon = config.icon;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", className)}
            onClick={cycleNext}
          >
            <Icon className={cn("h-4 w-4", config.color)} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>
            {currentState === "default" 
              ? "Click to preview hover state" 
              : `Previewing: ${config.label} (click for next)`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
