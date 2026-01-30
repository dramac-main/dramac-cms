/**
 * Custom Puck Fields
 * 
 * Extends Puck with custom field types not available by default.
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Custom Toggle Field for Puck
 * Puck doesn't have a native toggle type, so we use "custom" field type with this render.
 */
interface ToggleFieldProps {
  value: boolean;
  onChange: (value: boolean) => void;
  id?: string;
  name?: string;
  readOnly?: boolean;
}

export function ToggleField({ value, onChange, id, readOnly }: ToggleFieldProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      id={id}
      disabled={readOnly}
      onClick={() => onChange(!value)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        value ? "bg-primary" : "bg-muted"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
          value ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

/**
 * Color Picker Field
 */
interface ColorFieldProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  readOnly?: boolean;
}

export function ColorField({ value, onChange, id, readOnly }: ColorFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        id={id}
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        className="w-8 h-8 rounded border border-border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      />
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        disabled={readOnly}
        className="flex-1 px-2 py-1 text-sm border border-border rounded bg-background"
      />
    </div>
  );
}

/**
 * Reusable toggle field definition for puck config
 * Use this in field definitions: toggleField("Label")
 */
export function createToggleField(label: string) {
  return {
    type: "custom" as const,
    label,
    render: ({ value, onChange, readOnly }: { value: boolean; onChange: (v: boolean) => void; readOnly?: boolean }) => (
      <ToggleField value={value ?? false} onChange={onChange} readOnly={readOnly} />
    ),
  };
}

/**
 * Reusable color field definition for puck config
 */
export function createColorField(label: string) {
  return {
    type: "custom" as const,
    label,
    render: ({ value, onChange, readOnly }: { value: string; onChange: (v: string) => void; readOnly?: boolean }) => (
      <ColorField value={value ?? ""} onChange={onChange} readOnly={readOnly} />
    ),
  };
}
