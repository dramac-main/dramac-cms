/**
 * DRAMAC Studio Select Field Editor
 * 
 * Dropdown select for predefined options.
 */

"use client";

import React, { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldWrapper } from "../field-wrapper";
import type { FieldEditorProps, FieldDefinition } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface SelectFieldProps extends FieldEditorProps<string> {
  field: FieldDefinition;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SelectField({
  field,
  value,
  onChange,
  showResponsive,
  activeBreakpoint,
  onBreakpointChange,
  disabled,
}: SelectFieldProps) {
  const options = field.options || [];
  
  const handleChange = useCallback(
    (newValue: string) => {
      onChange(newValue);
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
      <Select
        value={value || ""}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger className="h-9">
          <SelectValue placeholder={field.placeholder || "Select..."} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={String(option.value)} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldWrapper>
  );
}
