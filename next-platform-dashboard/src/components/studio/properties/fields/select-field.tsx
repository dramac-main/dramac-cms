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

  // Radix Select.Item does not allow empty string values.
  // Separate any "clear" option (value === "") from valid options
  // and expose it as a dedicated clear button instead.
  const clearOption = options.find((o) => o.value === "");
  const validOptions = options.filter((o) => o.value !== "");
  
  const handleChange = useCallback(
    (newValue: string) => {
      onChange(newValue === "__clear__" ? "" : newValue);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange("");
  }, [onChange]);
  
  return (
    <FieldWrapper
      field={field}
      showResponsiveToggle={showResponsive && field.responsive}
      activeBreakpoint={activeBreakpoint}
      onBreakpointChange={onBreakpointChange}
    >
      <div className="flex gap-1.5">
        <Select
          value={value || ""}
          onValueChange={handleChange}
          disabled={disabled}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder={clearOption?.label || field.placeholder || "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {validOptions.map((option) => (
              <SelectItem key={String(option.value)} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {clearOption && value && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="shrink-0 h-9 w-9 flex items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            title={clearOption.label}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        )}
      </div>
    </FieldWrapper>
  );
}
