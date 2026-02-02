/**
 * DRAMAC Studio Toggle Field Editor
 * 
 * Boolean switch for true/false values.
 */

"use client";

import React, { useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { FieldEditorProps } from "@/types/studio";

// =============================================================================
// COMPONENT
// =============================================================================

export function ToggleField({
  field,
  value,
  onChange,
  disabled,
}: FieldEditorProps<boolean>) {
  const handleChange = useCallback(
    (checked: boolean) => {
      onChange(checked);
    },
    [onChange]
  );
  
  const fieldKey = field.key || field.label.toLowerCase().replace(/\s+/g, "-");
  
  return (
    <div className="flex items-center justify-between py-1">
      <Label
        htmlFor={`toggle-${fieldKey}`}
        className="text-sm font-medium cursor-pointer"
      >
        {field.label}
      </Label>
      <Switch
        id={`toggle-${fieldKey}`}
        checked={value ?? false}
        onCheckedChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
}
