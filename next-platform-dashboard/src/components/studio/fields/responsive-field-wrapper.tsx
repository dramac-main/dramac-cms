/**
 * DRAMAC Studio Responsive Field Wrapper
 * 
 * Wraps field editors to enable per-breakpoint value editing.
 */

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/studio/store/ui-store";
import {
  type ResponsiveValue,
  isResponsiveValue,
  getBreakpointValue,
  setBreakpointValue,
  toResponsiveValue,
  fromResponsiveValue,
  getResponsiveSummary,
} from "@/lib/studio/utils/responsive-utils";
import type { Breakpoint, FieldDefinition } from "@/types/studio";
import { Smartphone, Tablet, Monitor, Link, Unlink } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface ResponsiveFieldWrapperProps<T> {
  /** Field definition with responsive flag */
  field: FieldDefinition;
  
  /** Current value (may be T or ResponsiveValue<T>) */
  value: T | ResponsiveValue<T> | undefined;
  
  /** Called when value changes */
  onChange: (value: T | ResponsiveValue<T>) => void;
  
  /** Default value if undefined */
  defaultValue?: T;
  
  /** Render the actual field editor */
  children: (props: {
    value: T;
    onChange: (value: T) => void;
    isResponsive: boolean;
    currentBreakpoint: Breakpoint;
  }) => React.ReactNode;
}

// =============================================================================
// BREAKPOINT INDICATOR BUTTON
// =============================================================================

interface BreakpointButtonProps {
  breakpoint: Breakpoint;
  isActive: boolean;
  hasValue: boolean;
  onClick: () => void;
}

const BREAKPOINT_ICONS: Record<Breakpoint, React.ComponentType<{ className?: string }>> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

function BreakpointButton({ 
  breakpoint, 
  isActive, 
  hasValue,
  onClick 
}: BreakpointButtonProps) {
  const Icon = BREAKPOINT_ICONS[breakpoint];
  
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            className={cn(
              "p-1 rounded transition-colors",
              isActive 
                ? "bg-primary text-primary-foreground" 
                : hasValue 
                  ? "bg-muted text-foreground hover:bg-muted/80" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {breakpoint.charAt(0).toUpperCase() + breakpoint.slice(1)}
          {isActive && " (editing)"}
          {!isActive && hasValue && " (has value)"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// =============================================================================
// MAIN WRAPPER COMPONENT
// =============================================================================

export function ResponsiveFieldWrapper<T>({
  field,
  value,
  onChange,
  defaultValue,
  children,
}: ResponsiveFieldWrapperProps<T>) {
  const breakpoint = useUIStore((s) => s.breakpoint);
  const setBreakpoint = useUIStore((s) => s.setBreakpoint);
  
  // Determine if field is currently in responsive mode
  // Check value is defined before passing to type guard
  const isResponsive = value !== undefined && isResponsiveValue<T>(value);
  
  // Get the value to edit (current breakpoint's value or plain value)
  const getCurrentValue = (): T => {
    if (value === undefined) {
      return defaultValue as T;
    }
    if (isResponsive) {
      return getBreakpointValue(value as ResponsiveValue<T>, breakpoint);
    }
    return value as T;
  };
  
  // Handle value change from child editor
  const handleChange = React.useCallback((newValue: T) => {
    if (isResponsive) {
      // Update only the current breakpoint
      const updated = setBreakpointValue(value as ResponsiveValue<T>, breakpoint, newValue);
      onChange(updated);
    } else {
      // Plain value, update directly
      onChange(newValue);
    }
  }, [value, breakpoint, isResponsive, onChange]);
  
  // Toggle responsive mode
  const toggleResponsive = React.useCallback(() => {
    if (isResponsive) {
      // Convert to plain value (use mobile value)
      onChange(fromResponsiveValue(value as ResponsiveValue<T>));
    } else {
      // Convert to responsive (same value for all breakpoints initially)
      const currentVal = value ?? defaultValue;
      onChange(toResponsiveValue(currentVal as T));
    }
  }, [value, defaultValue, isResponsive, onChange]);
  
  // Check if field supports responsive mode
  if (!field.responsive) {
    // Render without responsive controls
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{field.label}</Label>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
        {children({
          value: (value ?? defaultValue) as T,
          onChange: onChange as (value: T) => void,
          isResponsive: false,
          currentBreakpoint: breakpoint,
        })}
      </div>
    );
  }
  
  // Get values for each breakpoint (for indicators)
  const getBreakpointHasValue = (bp: Breakpoint): boolean => {
    if (!isResponsive) return false;
    const responsiveVal = value as ResponsiveValue<T>;
    if (bp === "mobile") return true; // Mobile always has value
    return responsiveVal[bp] !== undefined;
  };
  
  return (
    <div className="space-y-2">
      {/* Header with label and responsive toggle */}
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium">{field.label}</Label>
        
        <div className="flex items-center gap-1">
          {/* Responsive mode toggle */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={toggleResponsive}
                >
                  {isResponsive ? (
                    <Unlink className="h-3 w-3 text-primary" />
                  ) : (
                    <Link className="h-3 w-3 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isResponsive 
                  ? "Click to use same value for all breakpoints"
                  : "Click to set different values per breakpoint"
                }
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      
      {/* Breakpoint indicators when in responsive mode */}
      {isResponsive && (
        <div className="flex items-center gap-1 pb-1">
          {(["mobile", "tablet", "desktop"] as Breakpoint[]).map((bp) => (
            <BreakpointButton
              key={bp}
              breakpoint={bp}
              isActive={breakpoint === bp}
              hasValue={getBreakpointHasValue(bp)}
              onClick={() => setBreakpoint(bp)}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-2">
            Editing: {breakpoint}
          </span>
        </div>
      )}
      
      {/* Render the actual field */}
      {children({
        value: getCurrentValue(),
        onChange: handleChange,
        isResponsive,
        currentBreakpoint: breakpoint,
      })}
      
      {/* Summary of all breakpoint values when responsive */}
      {isResponsive && (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mt-2">
          {getResponsiveSummary(value as ResponsiveValue<T>, (v) => {
            if (typeof v === "string") return v;
            if (typeof v === "number") return String(v);
            if (typeof v === "object" && v !== null) return JSON.stringify(v);
            return String(v);
          })}
        </div>
      )}
    </div>
  );
}

export default ResponsiveFieldWrapper;
