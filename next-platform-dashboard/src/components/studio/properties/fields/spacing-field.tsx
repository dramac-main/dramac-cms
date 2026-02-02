/**
 * DRAMAC Studio Spacing Field Editor
 * 
 * 4-value input for padding/margin (top, right, bottom, left).
 */

"use client";

import React, { useCallback } from "react";
import { cn } from "@/lib/utils";
import { Link2, Link2Off } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldWrapper } from "../field-wrapper";
import type { FieldEditorProps, SpacingValue } from "@/types/studio";

// =============================================================================
// COMPONENT
// =============================================================================

export function SpacingField({
  field,
  value,
  onChange,
  showResponsive,
  activeBreakpoint,
  onBreakpointChange,
  disabled,
}: FieldEditorProps<SpacingValue>) {
  const [linked, setLinked] = React.useState(() => {
    if (!value) return true;
    return value.top === value.right && value.right === value.bottom && value.bottom === value.left;
  });
  
  const spacing = value || { top: 0, right: 0, bottom: 0, left: 0 };
  
  const handleSingleChange = useCallback(
    (side: keyof SpacingValue, num: number) => {
      if (linked) {
        // Apply to all sides
        onChange({ top: num, right: num, bottom: num, left: num });
      } else {
        // Apply to single side
        onChange({ ...spacing, [side]: num });
      }
    },
    [onChange, spacing, linked]
  );
  
  const toggleLinked = useCallback(() => {
    setLinked((prev) => !prev);
    if (!linked && value) {
      // When linking, set all to the top value
      onChange({ top: value.top, right: value.top, bottom: value.top, left: value.top });
    }
  }, [linked, onChange, value]);
  
  return (
    <FieldWrapper
      field={field}
      showResponsiveToggle={showResponsive && field.responsive}
      activeBreakpoint={activeBreakpoint}
      onBreakpointChange={onBreakpointChange}
    >
      <div className="space-y-2">
        {/* Visual representation */}
        <div className="relative flex items-center justify-center py-4">
          {/* Center box */}
          <div className="w-12 h-12 bg-muted rounded border-2 border-dashed border-muted-foreground/30" />
          
          {/* Top value */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2">
            <Input
              type="number"
              value={spacing.top}
              onChange={(e) => handleSingleChange("top", parseInt(e.target.value) || 0)}
              disabled={disabled}
              className="h-7 w-12 text-center text-xs px-1"
              min={0}
            />
          </div>
          
          {/* Right value */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <Input
              type="number"
              value={spacing.right}
              onChange={(e) => handleSingleChange("right", parseInt(e.target.value) || 0)}
              disabled={disabled}
              className="h-7 w-12 text-center text-xs px-1"
              min={0}
            />
          </div>
          
          {/* Bottom value */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            <Input
              type="number"
              value={spacing.bottom}
              onChange={(e) => handleSingleChange("bottom", parseInt(e.target.value) || 0)}
              disabled={disabled}
              className="h-7 w-12 text-center text-xs px-1"
              min={0}
            />
          </div>
          
          {/* Left value */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <Input
              type="number"
              value={spacing.left}
              onChange={(e) => handleSingleChange("left", parseInt(e.target.value) || 0)}
              disabled={disabled}
              className="h-7 w-12 text-center text-xs px-1"
              min={0}
            />
          </div>
        </div>
        
        {/* Link toggle */}
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLinked}
            disabled={disabled}
            className={cn(
              "h-7 px-2 gap-1.5 text-xs",
              linked && "text-primary"
            )}
          >
            {linked ? (
              <>
                <Link2 className="h-3.5 w-3.5" />
                Linked
              </>
            ) : (
              <>
                <Link2Off className="h-3.5 w-3.5" />
                Unlinked
              </>
            )}
          </Button>
        </div>
      </div>
    </FieldWrapper>
  );
}
