/**
 * DRAMAC Studio Field Renderer
 * 
 * Maps field definitions to appropriate editor components.
 */

"use client";

import React, { useCallback } from "react";
import { TextField } from "./fields/text-field";
import { TextareaField } from "./fields/textarea-field";
import { NumberField } from "./fields/number-field";
import { SelectField } from "./fields/select-field";
import { ToggleField } from "./fields/toggle-field";
import { ColorField } from "./fields/color-field";
import { SpacingField } from "./fields/spacing-field";
import { UrlField } from "./fields/url-field";
import { useUIStore } from "@/lib/studio/store";
import type { FieldDefinition, FieldValue, Breakpoint, ResponsiveValue } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface FieldRendererProps {
  field: FieldDefinition;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  disabled?: boolean;
}

// =============================================================================
// FIELD TYPE MAPPING
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FIELD_EDITORS: Record<string, React.ComponentType<any>> = {
  text: TextField,
  textarea: TextareaField,
  number: NumberField,
  select: SelectField,
  toggle: ToggleField,
  color: ColorField,
  spacing: SpacingField,
  url: UrlField,
  link: UrlField, // Alias
  // More types added in future phases
};

// =============================================================================
// RESPONSIVE VALUE HELPERS
// =============================================================================

function isResponsiveValue<T>(value: unknown): value is ResponsiveValue<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "mobile" in value
  );
}

function getResponsiveValue<T>(
  value: T | ResponsiveValue<T>,
  breakpoint: Breakpoint
): T {
  if (isResponsiveValue<T>(value)) {
    // Try breakpoint, fall back to mobile
    if (breakpoint === "desktop" && value.desktop !== undefined) {
      return value.desktop;
    }
    if ((breakpoint === "tablet" || breakpoint === "desktop") && value.tablet !== undefined) {
      return value.tablet;
    }
    return value.mobile;
  }
  return value;
}

function setResponsiveValue<T>(
  currentValue: T | ResponsiveValue<T>,
  breakpoint: Breakpoint,
  newValue: T
): ResponsiveValue<T> {
  if (isResponsiveValue<T>(currentValue)) {
    return {
      ...currentValue,
      [breakpoint]: newValue,
    };
  }
  // Convert to responsive value
  return {
    mobile: breakpoint === "mobile" ? newValue : (currentValue as T),
    ...(breakpoint === "tablet" && { tablet: newValue }),
    ...(breakpoint === "desktop" && { desktop: newValue }),
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

export function FieldRenderer({
  field,
  value,
  onChange,
  disabled,
}: FieldRendererProps) {
  const currentBreakpoint = useUIStore((s) => s.breakpoint);
  const [editingBreakpoint, setEditingBreakpoint] = React.useState<Breakpoint>(currentBreakpoint);
  
  // Get the editor component
  const Editor = FIELD_EDITORS[field.type];
  
  if (!Editor) {
    // Unknown field type - show warning in dev
    if (process.env.NODE_ENV === "development") {
      return (
        <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
          Unknown field type: {field.type}
        </div>
      );
    }
    return null;
  }
  
  // Handle responsive values
  const isResponsive = field.responsive && isResponsiveValue(value);
  const displayValue = isResponsive
    ? getResponsiveValue(value, editingBreakpoint)
    : value;
  
  // Handle value change
  const handleChange = useCallback(
    (newValue: FieldValue) => {
      if (field.responsive && isResponsive) {
        // Update responsive value for current breakpoint
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onChange(setResponsiveValue(value as ResponsiveValue<any>, editingBreakpoint, newValue));
      } else {
        onChange(newValue);
      }
    },
    [onChange, field.responsive, isResponsive, value, editingBreakpoint]
  );
  
  // Handle breakpoint change for responsive editing
  const handleBreakpointChange = useCallback((bp: Breakpoint) => {
    setEditingBreakpoint(bp);
  }, []);
  
  return (
    <Editor
      field={field}
      value={displayValue}
      onChange={handleChange}
      disabled={disabled}
      showResponsive={field.responsive}
      activeBreakpoint={editingBreakpoint}
      onBreakpointChange={handleBreakpointChange}
    />
  );
}
