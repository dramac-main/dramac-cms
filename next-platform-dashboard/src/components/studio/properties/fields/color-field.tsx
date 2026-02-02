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

interface ColorFieldProps extends FieldEditorProps<string> {
  field: FieldDefinition;
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
  onBreakpointChange,
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
      onBreakpointChange={onBreakpointChange}
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
              const isPresetVariable = preset.value.startsWith("hsl(var(");
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
                    backgroundColor: isPresetVariable ? preset.value : preset.value,
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
