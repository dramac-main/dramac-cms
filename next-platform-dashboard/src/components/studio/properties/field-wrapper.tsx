/**
 * DRAMAC Studio Field Wrapper
 * 
 * Wraps field editors with label, responsive controls, and error handling.
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Monitor, Tablet, Smartphone, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUIStore } from "@/lib/studio/store";
import type { FieldDefinition, Breakpoint } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface FieldWrapperProps {
  field: FieldDefinition;
  children: React.ReactNode;
  showResponsiveToggle?: boolean;
  activeBreakpoint?: Breakpoint;
  onBreakpointChange?: (breakpoint: Breakpoint) => void;
}

// =============================================================================
// BREAKPOINT ICONS
// =============================================================================

const BREAKPOINT_ICONS: Record<Breakpoint, React.ComponentType<{ className?: string }>> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

// =============================================================================
// COMPONENT
// =============================================================================

export function FieldWrapper({
  field,
  children,
  showResponsiveToggle = false,
  activeBreakpoint = "mobile",
  onBreakpointChange,
}: FieldWrapperProps) {
  const currentBreakpoint = useUIStore((s) => s.breakpoint);
  
  // Use the current editor breakpoint if no explicit one provided
  const effectiveBreakpoint = activeBreakpoint || currentBreakpoint;
  
  return (
    <div className="space-y-2">
      {/* Label Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Label className="text-sm font-medium">
            {field.label}
          </Label>
          {field.description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-sm">{field.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        {/* Responsive Toggle */}
        {showResponsiveToggle && field.responsive && (
          <div className="flex items-center rounded-md border bg-muted p-0.5">
            {(["mobile", "tablet", "desktop"] as Breakpoint[]).map((bp) => {
              const Icon = BREAKPOINT_ICONS[bp];
              const isActive = effectiveBreakpoint === bp;
              
              return (
                <Button
                  key={bp}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 rounded-sm",
                    isActive && "bg-background shadow-sm"
                  )}
                  onClick={() => onBreakpointChange?.(bp)}
                  title={`Edit ${bp} value`}
                >
                  <Icon className={cn(
                    "h-3.5 w-3.5",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )} />
                </Button>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Field Editor */}
      <div>
        {children}
      </div>
    </div>
  );
}
