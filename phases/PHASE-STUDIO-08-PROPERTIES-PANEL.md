# PHASE-STUDIO-08: Properties Panel Foundation

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-08 |
| Title | Properties Panel Foundation |
| Priority | Critical |
| Estimated Time | 8-10 hours |
| Dependencies | STUDIO-01 through STUDIO-07 |
| Risk Level | Medium |

## Problem Statement

When a component is selected on the canvas, users need a way to edit its properties. The right panel currently shows a placeholder. We need to implement:

1. Display selected component info (type, label)
2. Create a field renderer system that maps field types to UI components
3. Implement basic field editors: text, number, select, toggle, color, spacing
4. Support responsive values (mobile/tablet/desktop)
5. Handle field onChange to update component props
6. Show empty state when nothing selected
7. Add delete button for selected component

## Goals

- [ ] Create PropertiesPanel component
- [ ] Create field renderer system
- [ ] Implement 10+ field editors
- [ ] Support ResponsiveValue editing
- [ ] Handle prop updates through store
- [ ] Show component info header
- [ ] Empty state UI
- [ ] Delete component button
- [ ] Proper TypeScript types

## Technical Approach

### Properties Panel Structure

```
┌─────────────────────────────────┐
│  PROPERTIES               [×]   │ ← Panel header
├─────────────────────────────────┤
│                                 │
│ ┌───────────────────────────┐  │
│ │ 📦 Heading                │  │ ← Component type
│ │    hero-heading-123       │  │   Component ID
│ └───────────────────────────┘  │
│                                 │
│ ▼ Content                      │ ← Field group (accordion)
│ ┌───────────────────────────┐  │
│ │ Text                      │  │
│ │ ┌─────────────────────┐  │  │
│ │ │ Hello World         │  │  │   Text input
│ │ └─────────────────────┘  │  │
│ └───────────────────────────┘  │
│                                 │
│ ▼ Style                        │
│ ┌───────────────────────────┐  │
│ │ Font Size       [📱][📟][🖥️] │   Responsive toggle
│ │ ┌───────┐                 │  │
│ │ │ 2xl ▼ │                 │  │   Select
│ │ └───────┘                 │  │
│ └───────────────────────────┘  │
│                                 │
│ ▼ Layout                       │
│ ┌───────────────────────────┐  │
│ │ Padding                   │  │
│ │  ┌──┬──┬──┬──┐           │  │   Spacing input
│ │  │ 4│ 4│ 4│ 4│           │  │
│ │  └──┴──┴──┴──┘           │  │
│ └───────────────────────────┘  │
│                                 │
├─────────────────────────────────┤
│ [🗑️ Delete Component]          │ ← Delete button
└─────────────────────────────────┘

Empty State:
┌─────────────────────────────────┐
│  PROPERTIES               [×]   │
├─────────────────────────────────┤
│                                 │
│         ◇                       │
│    Select a component           │
│    to edit its properties       │
│                                 │
└─────────────────────────────────┘
```

### Field Editor Types

| Field Type | UI Component | Use Case |
|------------|--------------|----------|
| text | Input | Short text content |
| textarea | Textarea | Long text/paragraphs |
| number | Number input + slider | Numeric values |
| select | Select dropdown | Predefined options |
| toggle | Switch | Boolean values |
| color | Color picker | Color values |
| spacing | 4-value input | Padding/margin |
| url | Input + preview | Links, images |
| rich-text | Rich text editor | Formatted content |
| array | Add/remove items | Lists |
| object | Nested fields | Complex data |

---

## Implementation Tasks

### Task 1: Create Field Types

**Description:** Define TypeScript types for field values and field editing

**Files:**
- MODIFY: `src/types/studio.ts`

**Code to add:**

```typescript
// =============================================================================
// FIELD VALUE TYPES
// =============================================================================

/**
 * Spacing value for padding/margin
 */
export type SpacingValue = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

/**
 * All possible field value types
 */
export type FieldValue =
  | string
  | number
  | boolean
  | SpacingValue
  | string[]
  | ResponsiveValue<string>
  | ResponsiveValue<number>
  | ResponsiveValue<SpacingValue>
  | Record<string, unknown>
  | null
  | undefined;

/**
 * Props for any field editor component
 */
export interface FieldEditorProps<T = FieldValue> {
  /** The field definition */
  field: FieldDefinition;
  /** Current field value */
  value: T;
  /** Called when value changes */
  onChange: (value: T) => void;
  /** Whether to show responsive controls */
  showResponsive?: boolean;
  /** Current breakpoint for responsive editing */
  activeBreakpoint?: Breakpoint;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Field editor component type
 */
export type FieldEditorComponent<T = FieldValue> = React.ComponentType<FieldEditorProps<T>>;

/**
 * Field group for organizing related fields
 */
export interface FieldGroup {
  id: string;
  label: string;
  fields: string[]; // Field keys
  defaultExpanded?: boolean;
}
```

---

### Task 2: Create Base Field Editor Wrapper

**Description:** Create a wrapper component that handles common field editor concerns

**Files:**
- CREATE: `src/components/studio/properties/field-wrapper.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio Field Wrapper
 * 
 * Wraps field editors with label, responsive controls, and error handling.
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Monitor, Tablet, Smartphone, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUIStore } from "@/lib/studio/store";
import type { FieldDefinition, Breakpoint } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface FieldWrapperProps {
  field: FieldDefinition;
  children: React.ReactNode;
  showResponsiveToggle?: boolean;
  activeBreakpoint?: Breakpoint;
  onBreakpointChange?: (breakpoint: Breakpoint) => void;
}

// =============================================================================
// BREAKPOINT ICONS
// =============================================================================

const BREAKPOINT_ICONS: Record<Breakpoint, React.ComponentType<{ className?: string }>> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

// =============================================================================
// COMPONENT
// =============================================================================

export function FieldWrapper({
  field,
  children,
  showResponsiveToggle = false,
  activeBreakpoint = "mobile",
  onBreakpointChange,
}: FieldWrapperProps) {
  const currentBreakpoint = useUIStore((s) => s.breakpoint);
  
  // Use the current editor breakpoint if no explicit one provided
  const effectiveBreakpoint = activeBreakpoint || currentBreakpoint;
  
  return (
    <div className="space-y-2">
      {/* Label Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Label className="text-sm font-medium">
            {field.label}
          </Label>
          {field.description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-sm">{field.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        {/* Responsive Toggle */}
        {showResponsiveToggle && field.responsive && (
          <div className="flex items-center rounded-md border bg-muted p-0.5">
            {(["mobile", "tablet", "desktop"] as Breakpoint[]).map((bp) => {
              const Icon = BREAKPOINT_ICONS[bp];
              const isActive = effectiveBreakpoint === bp;
              
              return (
                <Button
                  key={bp}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 rounded-sm",
                    isActive && "bg-background shadow-sm"
                  )}
                  onClick={() => onBreakpointChange?.(bp)}
                  title={`Edit ${bp} value`}
                >
                  <Icon className={cn(
                    "h-3.5 w-3.5",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )} />
                </Button>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Field Editor */}
      <div>
        {children}
      </div>
      
      {/* Validation Error (if any) */}
      {/* Error state will be added in a future phase */}
    </div>
  );
}
```

---

### Task 3: Create TextField Editor

**Description:** Create the text input field editor

**Files:**
- CREATE: `src/components/studio/properties/fields/text-field.tsx`

**Code:**

```tsx
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
```

---

### Task 4: Create TextareaField Editor

**Description:** Create the textarea field editor for longer text

**Files:**
- CREATE: `src/components/studio/properties/fields/textarea-field.tsx`

**Code:**

```tsx
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
    >
      <Textarea
        value={value || ""}
        onChange={handleChange}
        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
        disabled={disabled}
        rows={4}
        className="resize-y min-h-[80px]"
      />
    </FieldWrapper>
  );
}
```

---

### Task 5: Create NumberField Editor

**Description:** Create the number input with optional slider

**Files:**
- CREATE: `src/components/studio/properties/fields/number-field.tsx`

**Code:**

```tsx
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

interface NumberFieldDefinition extends FieldDefinition {
  min?: number;
  max?: number;
  step?: number;
  showSlider?: boolean;
}

interface NumberFieldProps extends FieldEditorProps<number> {
  field: NumberFieldDefinition;
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
  disabled,
}: NumberFieldProps) {
  const { min = 0, max = 100, step = 1, showSlider = false } = field;
  
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
```

---

### Task 6: Create SelectField Editor

**Description:** Create the select dropdown editor

**Files:**
- CREATE: `src/components/studio/properties/fields/select-field.tsx`

**Code:**

```tsx
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

interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldDefinition extends FieldDefinition {
  options: SelectOption[];
}

interface SelectFieldProps extends FieldEditorProps<string> {
  field: SelectFieldDefinition;
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
  disabled,
}: SelectFieldProps) {
  const { options = [] } = field;
  
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
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldWrapper>
  );
}
```

---

### Task 7: Create ToggleField Editor

**Description:** Create the boolean toggle/switch editor

**Files:**
- CREATE: `src/components/studio/properties/fields/toggle-field.tsx`

**Code:**

```tsx
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
  
  return (
    <div className="flex items-center justify-between py-1">
      <Label
        htmlFor={`toggle-${field.key}`}
        className="text-sm font-medium cursor-pointer"
      >
        {field.label}
      </Label>
      <Switch
        id={`toggle-${field.key}`}
        checked={value ?? false}
        onCheckedChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
}
```

---

### Task 8: Create ColorField Editor

**Description:** Create the color picker editor

**Files:**
- CREATE: `src/components/studio/properties/fields/color-field.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio Color Field Editor
 * 
 * Color picker with presets and custom input.
 */

"use client";

import React, { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Pipette, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FieldWrapper } from "../field-wrapper";
import type { FieldEditorProps, FieldDefinition } from "@/types/studio";

// =============================================================================
// PRESET COLORS
// =============================================================================

const PRESET_COLORS = [
  // Brand colors (CSS variables)
  { name: "Primary", value: "hsl(var(--primary))" },
  { name: "Secondary", value: "hsl(var(--secondary))" },
  { name: "Accent", value: "hsl(var(--accent))" },
  { name: "Muted", value: "hsl(var(--muted))" },
  { name: "Destructive", value: "hsl(var(--destructive))" },
  
  // Common colors
  { name: "Black", value: "#000000" },
  { name: "White", value: "#ffffff" },
  { name: "Gray", value: "#6b7280" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Green", value: "#22c55e" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  
  // Transparent
  { name: "Transparent", value: "transparent" },
];

// =============================================================================
// TYPES
// =============================================================================

interface ColorFieldDefinition extends FieldDefinition {
  presets?: { name: string; value: string }[];
  allowCustom?: boolean;
}

interface ColorFieldProps extends FieldEditorProps<string> {
  field: ColorFieldDefinition;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ColorField({
  field,
  value,
  onChange,
  showResponsive,
  activeBreakpoint,
  disabled,
}: ColorFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const presets = field.presets || PRESET_COLORS;
  const allowCustom = field.allowCustom !== false;
  
  const handlePresetClick = useCallback(
    (color: string) => {
      onChange(color);
      setIsOpen(false);
    },
    [onChange]
  );
  
  const handleCustomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );
  
  const handleClear = useCallback(() => {
    onChange("");
  }, [onChange]);
  
  // Get display color (handle CSS variables)
  const displayColor = value?.startsWith("hsl(var(") ? undefined : value;
  const isVariable = value?.startsWith("hsl(var(");
  
  return (
    <FieldWrapper
      field={field}
      showResponsiveToggle={showResponsive && field.responsive}
      activeBreakpoint={activeBreakpoint}
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-9 w-full justify-start gap-2 px-3"
            disabled={disabled}
          >
            {/* Color Preview */}
            <div
              className={cn(
                "h-5 w-5 rounded border shrink-0",
                !value && "bg-[repeating-linear-gradient(45deg,#ccc,#ccc_2px,#fff_2px,#fff_4px)]"
              )}
              style={{
                backgroundColor: displayColor || undefined,
                ...(isVariable && { backgroundColor: value }),
              }}
            />
            
            {/* Value */}
            <span className="flex-1 text-left truncate text-sm">
              {value || "Select color..."}
            </span>
            
            {/* Clear button */}
            {value && (
              <X
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-64 p-3" align="start">
          {/* Presets */}
          <div className="grid grid-cols-6 gap-1.5">
            {presets.map((preset) => {
              const isVariable = preset.value.startsWith("hsl(var(");
              return (
                <button
                  key={preset.value}
                  type="button"
                  className={cn(
                    "h-7 w-7 rounded border transition-all",
                    "hover:scale-110 hover:shadow-md",
                    "focus:outline-none focus:ring-2 focus:ring-ring",
                    value === preset.value && "ring-2 ring-primary"
                  )}
                  style={{
                    backgroundColor: isVariable ? preset.value : preset.value,
                  }}
                  onClick={() => handlePresetClick(preset.value)}
                  title={preset.name}
                />
              );
            })}
          </div>
          
          {/* Custom Color */}
          {allowCustom && (
            <div className="mt-3 flex items-center gap-2 pt-3 border-t">
              <Pipette className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                type="text"
                value={value || ""}
                onChange={handleCustomChange}
                placeholder="#000000 or rgba(...)"
                className="h-8 text-sm"
              />
              <input
                type="color"
                value={displayColor || "#000000"}
                onChange={(e) => onChange(e.target.value)}
                className="h-8 w-8 shrink-0 rounded border cursor-pointer"
              />
            </div>
          )}
        </PopoverContent>
      </Popover>
    </FieldWrapper>
  );
}
```

---

### Task 9: Create SpacingField Editor

**Description:** Create the 4-value spacing editor for padding/margin

**Files:**
- CREATE: `src/components/studio/properties/fields/spacing-field.tsx`

**Code:**

```tsx
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
// SPACING PRESETS (Tailwind scale)
// =============================================================================

const SPACING_SCALE = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64];

// =============================================================================
// COMPONENT
// =============================================================================

export function SpacingField({
  field,
  value,
  onChange,
  showResponsive,
  activeBreakpoint,
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
  
  const sides: { key: keyof SpacingValue; label: string }[] = [
    { key: "top", label: "T" },
    { key: "right", label: "R" },
    { key: "bottom", label: "B" },
    { key: "left", label: "L" },
  ];
  
  return (
    <FieldWrapper
      field={field}
      showResponsiveToggle={showResponsive && field.responsive}
      activeBreakpoint={activeBreakpoint}
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
```

---

### Task 10: Create UrlField Editor

**Description:** Create the URL input with validation

**Files:**
- CREATE: `src/components/studio/properties/fields/url-field.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio URL Field Editor
 * 
 * URL input with link preview option.
 */

"use client";

import React, { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Link, ExternalLink, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldWrapper } from "../field-wrapper";
import type { FieldEditorProps, FieldDefinition } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface UrlFieldDefinition extends FieldDefinition {
  allowExternal?: boolean;
  validateUrl?: boolean;
}

interface UrlFieldProps extends FieldEditorProps<string> {
  field: UrlFieldDefinition;
}

// =============================================================================
// URL VALIDATION
// =============================================================================

function isValidUrl(url: string): boolean {
  if (!url) return true; // Empty is valid
  if (url.startsWith("/")) return true; // Internal path
  if (url.startsWith("#")) return true; // Anchor
  if (url.startsWith("mailto:")) return true; // Email
  if (url.startsWith("tel:")) return true; // Phone
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function UrlField({
  field,
  value,
  onChange,
  showResponsive,
  activeBreakpoint,
  disabled,
}: UrlFieldProps) {
  const [touched, setTouched] = useState(false);
  const validateUrl = field.validateUrl !== false;
  
  const isValid = !validateUrl || isValidUrl(value || "");
  const showError = touched && !isValid;
  
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );
  
  const handleBlur = useCallback(() => {
    setTouched(true);
  }, []);
  
  const handleOpenLink = useCallback(() => {
    if (value && isValid) {
      window.open(value, "_blank", "noopener,noreferrer");
    }
  }, [value, isValid]);
  
  return (
    <FieldWrapper
      field={field}
      showResponsiveToggle={showResponsive && field.responsive}
      activeBreakpoint={activeBreakpoint}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <div className="relative flex-1">
            <Link className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="url"
              value={value || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={field.placeholder || "https://..."}
              disabled={disabled}
              className={cn(
                "h-9 pl-8 pr-8",
                showError && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {showError && (
              <AlertCircle className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" />
            )}
          </div>
          
          {/* Open link button */}
          {value && isValid && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleOpenLink}
              title="Open link in new tab"
              disabled={disabled}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {showError && (
          <p className="text-xs text-destructive">
            Please enter a valid URL
          </p>
        )}
      </div>
    </FieldWrapper>
  );
}
```

---

### Task 11: Create Field Renderer

**Description:** Create the field renderer that maps field types to editors

**Files:**
- CREATE: `src/components/studio/properties/field-renderer.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio Field Renderer
 * 
 * Maps field definitions to appropriate editor components.
 */

"use client";

import React, { useCallback, useMemo } from "react";
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

const FIELD_EDITORS: Record<string, React.ComponentType<any>> = {
  text: TextField,
  textarea: TextareaField,
  number: NumberField,
  select: SelectField,
  toggle: ToggleField,
  color: ColorField,
  spacing: SpacingField,
  url: UrlField,
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
```

---

### Task 12: Create Properties Panel

**Description:** Create the main properties panel component

**Files:**
- CREATE: `src/components/studio/properties/properties-panel.tsx`

**Code:**

```tsx
/**
 * DRAMAC Studio Properties Panel
 * 
 * Right panel for editing selected component properties.
 */

"use client";

import React, { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Settings, Trash2, Copy, ChevronDown, ChevronRight, MousePointer } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PanelHeader } from "@/components/studio/layout/panel-header";
import { FieldRenderer } from "./field-renderer";
import { componentRegistry } from "@/lib/studio/registry/component-registry";
import { useEditorStore, useSelectionStore, useUIStore } from "@/lib/studio/store";
import type { FieldValue, FieldGroup, ComponentDefinition } from "@/types/studio";

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <MousePointer className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium mb-1">No Component Selected</h3>
      <p className="text-xs text-muted-foreground max-w-[200px]">
        Select a component on the canvas to edit its properties
      </p>
    </div>
  );
}

// =============================================================================
// COMPONENT INFO HEADER
// =============================================================================

interface ComponentInfoProps {
  definition: ComponentDefinition;
  componentId: string;
}

function ComponentInfo({ definition, componentId }: ComponentInfoProps) {
  const Icon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[definition.icon] || LucideIcons.Box;
  
  return (
    <div className="flex items-center gap-3 p-3 border-b border-border bg-muted/30">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold">{definition.label}</h3>
        <p className="text-xs text-muted-foreground truncate">{componentId}</p>
      </div>
    </div>
  );
}

// =============================================================================
// FIELD GROUP ACCORDION
// =============================================================================

interface FieldGroupAccordionProps {
  group: FieldGroup;
  definition: ComponentDefinition;
  props: Record<string, FieldValue>;
  onFieldChange: (key: string, value: FieldValue) => void;
  disabled?: boolean;
}

function FieldGroupAccordion({
  group,
  definition,
  props,
  onFieldChange,
  disabled,
}: FieldGroupAccordionProps) {
  const [isOpen, setIsOpen] = React.useState(group.defaultExpanded !== false);
  
  // Get fields for this group
  const groupFields = useMemo(() => {
    return group.fields
      .map((key) => definition.fields.find((f) => f.key === key))
      .filter((f): f is NonNullable<typeof f> => f !== undefined);
  }, [group.fields, definition.fields]);
  
  if (groupFields.length === 0) return null;
  
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2.5 text-left",
          "hover:bg-muted/50 transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        )}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1 text-sm font-medium">{group.label}</span>
      </button>
      
      {isOpen && (
        <div className="space-y-4 px-3 pb-4">
          {groupFields.map((field) => (
            <FieldRenderer
              key={field.key}
              field={field}
              value={props[field.key]}
              onChange={(value) => onFieldChange(field.key, value)}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN PROPERTIES PANEL
// =============================================================================

export function PropertiesPanel() {
  // Stores
  const componentId = useSelectionStore((s) => s.componentId);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const togglePanel = useUIStore((s) => s.togglePanel);
  
  const data = useEditorStore((s) => s.data);
  const updateComponentProps = useEditorStore((s) => s.updateComponentProps);
  const deleteComponent = useEditorStore((s) => s.deleteComponent);
  const duplicateComponent = useEditorStore((s) => s.duplicateComponent);
  
  // Get selected component
  const component = useMemo(() => {
    if (!componentId || !data) return null;
    return data.components[componentId];
  }, [componentId, data]);
  
  // Get component definition
  const definition = useMemo(() => {
    if (!component) return null;
    return componentRegistry.get(component.type);
  }, [component]);
  
  // Handle field change
  const handleFieldChange = useCallback(
    (key: string, value: FieldValue) => {
      if (!componentId) return;
      updateComponentProps(componentId, { [key]: value });
    },
    [componentId, updateComponentProps]
  );
  
  // Handle delete
  const handleDelete = useCallback(() => {
    if (!componentId) return;
    deleteComponent(componentId);
    clearSelection();
  }, [componentId, deleteComponent, clearSelection]);
  
  // Handle duplicate
  const handleDuplicate = useCallback(() => {
    if (!componentId) return;
    duplicateComponent(componentId);
  }, [componentId, duplicateComponent]);
  
  // Group fields
  const fieldGroups = useMemo((): FieldGroup[] => {
    if (!definition) return [];
    
    // Check if definition has explicit groups
    if (definition.fieldGroups && definition.fieldGroups.length > 0) {
      return definition.fieldGroups;
    }
    
    // Auto-group by field categories or create default groups
    const contentFields: string[] = [];
    const styleFields: string[] = [];
    const layoutFields: string[] = [];
    const advancedFields: string[] = [];
    
    for (const field of definition.fields) {
      // Group by field key naming or type
      if (field.key.includes("content") || field.key === "text" || field.key === "children" || field.type === "textarea") {
        contentFields.push(field.key);
      } else if (field.key.includes("color") || field.key.includes("font") || field.type === "color") {
        styleFields.push(field.key);
      } else if (field.key.includes("padding") || field.key.includes("margin") || field.key.includes("gap") || field.type === "spacing") {
        layoutFields.push(field.key);
      } else if (field.key.includes("animation") || field.key.includes("hover") || field.key.includes("advanced")) {
        advancedFields.push(field.key);
      } else {
        // Default to content
        contentFields.push(field.key);
      }
    }
    
    const groups: FieldGroup[] = [];
    
    if (contentFields.length > 0) {
      groups.push({ id: "content", label: "Content", fields: contentFields, defaultExpanded: true });
    }
    if (styleFields.length > 0) {
      groups.push({ id: "style", label: "Style", fields: styleFields, defaultExpanded: true });
    }
    if (layoutFields.length > 0) {
      groups.push({ id: "layout", label: "Layout", fields: layoutFields, defaultExpanded: false });
    }
    if (advancedFields.length > 0) {
      groups.push({ id: "advanced", label: "Advanced", fields: advancedFields, defaultExpanded: false });
    }
    
    return groups;
  }, [definition]);
  
  // No selection
  if (!component || !definition) {
    return (
      <div className="flex h-full flex-col">
        <PanelHeader
          title="Properties"
          icon={Settings}
          position="right"
          onCollapse={() => togglePanel("right")}
        />
        <EmptyState />
      </div>
    );
  }
  
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <PanelHeader
        title="Properties"
        icon={Settings}
        position="right"
        onCollapse={() => togglePanel("right")}
      />
      
      {/* Component Info */}
      <ComponentInfo definition={definition} componentId={componentId!} />
      
      {/* Fields */}
      <ScrollArea className="flex-1">
        {fieldGroups.map((group) => (
          <FieldGroupAccordion
            key={group.id}
            group={group}
            definition={definition}
            props={component.props}
            onFieldChange={handleFieldChange}
          />
        ))}
      </ScrollArea>
      
      {/* Actions Footer */}
      <div className="border-t border-border p-3 space-y-2">
        {/* Duplicate */}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={handleDuplicate}
        >
          <Copy className="h-4 w-4" />
          Duplicate Component
        </Button>
        
        {/* Delete with Confirmation */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete Component
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Component</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this {definition.label} component?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
```

---

### Task 13: Create Properties Exports

**Description:** Export all properties components

**Files:**
- CREATE: `src/components/studio/properties/index.ts`

**Code:**

```typescript
/**
 * DRAMAC Studio Properties Components
 */

export { PropertiesPanel } from "./properties-panel";
export { FieldRenderer } from "./field-renderer";
export { FieldWrapper } from "./field-wrapper";

// Field Editors
export { TextField } from "./fields/text-field";
export { TextareaField } from "./fields/textarea-field";
export { NumberField } from "./fields/number-field";
export { SelectField } from "./fields/select-field";
export { ToggleField } from "./fields/toggle-field";
export { ColorField } from "./fields/color-field";
export { SpacingField } from "./fields/spacing-field";
export { UrlField } from "./fields/url-field";
```

---

### Task 14: Create Fields Directory Index

**Description:** Export field editors

**Files:**
- CREATE: `src/components/studio/properties/fields/index.ts`

**Code:**

```typescript
/**
 * DRAMAC Studio Field Editors
 */

export { TextField } from "./text-field";
export { TextareaField } from "./textarea-field";
export { NumberField } from "./number-field";
export { SelectField } from "./select-field";
export { ToggleField } from "./toggle-field";
export { ColorField } from "./color-field";
export { SpacingField } from "./spacing-field";
export { UrlField } from "./url-field";
```

---

### Task 15: Update StudioEditor to Use PropertiesPanel

**Description:** Replace the right panel placeholder with PropertiesPanel

**Files:**
- MODIFY: `src/components/studio/studio-editor.tsx`

**Code changes:**

Add import:
```tsx
import { PropertiesPanel } from "@/components/studio/properties";
```

Replace in return:
```tsx
// Replace:
rightPanel={<PropertiesPlaceholder />}

// With:
rightPanel={<PropertiesPanel />}
```

Also remove the `PropertiesPlaceholder` function.

---

### Task 16: Add FieldGroups to ComponentDefinition

**Description:** Update ComponentDefinition type to support field groups

**Files:**
- MODIFY: `src/types/studio.ts`

**Code changes:**

Add to ComponentDefinition interface:
```typescript
interface ComponentDefinition {
  // ... existing fields ...
  
  /**
   * Optional field groupings for the properties panel.
   * If not provided, fields are auto-grouped.
   */
  fieldGroups?: FieldGroup[];
}
```

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| MODIFY | src/types/studio.ts | Add field value types, FieldGroup |
| CREATE | src/components/studio/properties/field-wrapper.tsx | Field label & responsive toggle wrapper |
| CREATE | src/components/studio/properties/fields/text-field.tsx | Text input editor |
| CREATE | src/components/studio/properties/fields/textarea-field.tsx | Textarea editor |
| CREATE | src/components/studio/properties/fields/number-field.tsx | Number input + slider |
| CREATE | src/components/studio/properties/fields/select-field.tsx | Select dropdown |
| CREATE | src/components/studio/properties/fields/toggle-field.tsx | Boolean switch |
| CREATE | src/components/studio/properties/fields/color-field.tsx | Color picker |
| CREATE | src/components/studio/properties/fields/spacing-field.tsx | 4-value spacing |
| CREATE | src/components/studio/properties/fields/url-field.tsx | URL input |
| CREATE | src/components/studio/properties/fields/index.ts | Field exports |
| CREATE | src/components/studio/properties/field-renderer.tsx | Field type → editor mapping |
| CREATE | src/components/studio/properties/properties-panel.tsx | Main properties panel |
| CREATE | src/components/studio/properties/index.ts | Properties exports |
| MODIFY | src/components/studio/studio-editor.tsx | Use PropertiesPanel |

---

## Testing Requirements

### Manual Testing

1. **Empty State**
   - [ ] Shows "No Component Selected" when nothing selected
   - [ ] Shows icon and helpful text
   
2. **Component Info**
   - [ ] Shows component icon
   - [ ] Shows component label (e.g., "Heading")
   - [ ] Shows component ID
   
3. **Field Groups**
   - [ ] Groups expand/collapse on click
   - [ ] Default groups open on load
   - [ ] Fields render inside groups
   
4. **Field Editors**
   - [ ] TextField shows text input
   - [ ] TextareaField shows multiline
   - [ ] NumberField shows number input
   - [ ] SelectField shows dropdown
   - [ ] ToggleField shows switch
   - [ ] ColorField shows picker with presets
   - [ ] SpacingField shows 4-value visual editor
   - [ ] UrlField shows URL input with validation
   
5. **Responsive Editing**
   - [ ] Fields with responsive=true show breakpoint toggle
   - [ ] Changing breakpoint edits that breakpoint's value
   - [ ] Values cascade (mobile → tablet → desktop)
   
6. **Actions**
   - [ ] Duplicate button creates copy
   - [ ] Delete button shows confirmation
   - [ ] Delete removes component from canvas
   - [ ] Selection clears after delete
   
7. **Real-time Updates**
   - [ ] Changing field value updates canvas immediately
   - [ ] Canvas reflects prop changes in real-time

---

## Success Criteria

- [ ] Properties panel shows selected component
- [ ] Empty state when nothing selected
- [ ] All 8 field editors working
- [ ] Field groups expand/collapse
- [ ] Responsive editing works per breakpoint
- [ ] Delete with confirmation works
- [ ] Duplicate creates copy
- [ ] Props update in real-time on canvas
- [ ] TypeScript compiles with zero errors
- [ ] Panel scrolls with many fields

---

## Dependencies

This phase depends on:
- STUDIO-02: Editor state store (updateComponentProps, deleteComponent)
- STUDIO-03: Component registry (definitions, fields)
- STUDIO-04: Panel layout (right panel integration)
- STUDIO-06: Component rendering (to see changes)

---

## Next Steps (Wave 3)

After completing Wave 2 (Phases 05-08), the editor will have:
- ✅ Working drag-and-drop
- ✅ Canvas rendering with selection
- ✅ Component library panel
- ✅ Properties panel with field editors

Wave 3 will add:
- STUDIO-09: Toolbar & Formatting
- STUDIO-10: Layers/Structure Panel
- STUDIO-11: Page Settings
- STUDIO-12: Preview Mode
