/**
 * DRAMAC Studio Text Field Editor
 * 
 * Text input for short string values.
 */

"use client";

import React, { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { FieldWrapper } from "../field-wrapper";
import type { FieldEditorProps } from "@/types/studio";

// =============================================================================
// COMPONENT
// =============================================================================

export function TextField({
  field,
  value,
  onChange,
  showResponsive,
  activeBreakpoint,
  onBreakpointChange,
  disabled,
}: FieldEditorProps<string>) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
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
      <Input
        type="text"
        value={value || ""}
        onChange={handleChange}
        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
        disabled={disabled}
        className="h-9"
      />
    </FieldWrapper>
  );
}
