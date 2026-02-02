/**
 * DRAMAC Studio Number Field Editor
 * 
 * Numeric input with optional slider.
 */

"use client";

import React, { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { FieldWrapper } from "../field-wrapper";
import type { FieldEditorProps, FieldDefinition } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface NumberFieldProps extends FieldEditorProps<number> {
  field: FieldDefinition;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function NumberField({
  field,
  value,
  onChange,
  showResponsive,
  activeBreakpoint,
  onBreakpointChange,
  disabled,
}: NumberFieldProps) {
  const min = field.min ?? 0;
  const max = field.max ?? 100;
  const step = field.step ?? 1;
  const showSlider = field.showSlider ?? false;
  
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = parseFloat(e.target.value);
      if (!isNaN(num)) {
        onChange(Math.min(max, Math.max(min, num)));
      }
    },
    [onChange, min, max]
  );
  
  const handleSliderChange = useCallback(
    (values: number[]) => {
      onChange(values[0]);
    },
    [onChange]
  );
  
  return (
    <FieldWrapper
      field={field}
      showResponsiveToggle={showResponsive && field.responsive}
      activeBreakpoint={activeBreakpoint}
      onBreakpointChange={onBreakpointChange}
    >
      <div className="space-y-2">
        {showSlider ? (
          <div className="flex items-center gap-3">
            <Slider
              value={[value ?? min]}
              min={min}
              max={max}
              step={step}
              onValueChange={handleSliderChange}
              disabled={disabled}
              className="flex-1"
            />
            <Input
              type="number"
              value={value ?? ""}
              onChange={handleInputChange}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              className="h-9 w-20"
            />
          </div>
        ) : (
          <Input
            type="number"
            value={value ?? ""}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            placeholder={field.placeholder}
            disabled={disabled}
            className="h-9"
          />
        )}
      </div>
    </FieldWrapper>
  );
}
