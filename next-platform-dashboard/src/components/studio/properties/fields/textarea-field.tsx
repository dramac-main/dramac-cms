/**
 * DRAMAC Studio Textarea Field Editor
 * 
 * Multiline text input for longer content.
 */

"use client";

import React, { useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { FieldWrapper } from "../field-wrapper";
import type { FieldEditorProps } from "@/types/studio";

// =============================================================================
// COMPONENT
// =============================================================================

export function TextareaField({
  field,
  value,
  onChange,
  showResponsive,
  activeBreakpoint,
  onBreakpointChange,
  disabled,
}: FieldEditorProps<string>) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      <Textarea
        value={value || ""}
        onChange={handleChange}
        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
        disabled={disabled}
        rows={field.rows || 4}
        className="resize-y min-h-[80px]"
      />
    </FieldWrapper>
  );
}
