// src/lib/studio/fields/spacing-field-editor.tsx
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { parseCSSValue, formatCSSValue, CSS_UNITS } from './field-utils';
import type { SpacingFieldEditorProps, SpacingValueCSS } from '@/types/studio';
import { Link, Unlink } from 'lucide-react';

// Default spacing value
const DEFAULT_SPACING: SpacingValueCSS = {
  top: '0px',
  right: '0px',
  bottom: '0px',
  left: '0px',
};

interface SpacingInputProps {
  value: string;
  onChange: (value: string) => void;
  side: 'top' | 'right' | 'bottom' | 'left';
  disabled?: boolean;
  allowNegative?: boolean;
}

function SpacingInput({ value, onChange, side, disabled, allowNegative }: SpacingInputProps) {
  const parsed = parseCSSValue(value || '0px');
  const [number, setNumber] = React.useState(parsed.number.toString());
  const [unit, setUnit] = React.useState(parsed.unit);
  
  React.useEffect(() => {
    const p = parseCSSValue(value || '0px');
    setNumber(p.number.toString());
    setUnit(p.unit);
  }, [value]);
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNumber(val);
    
    const num = parseFloat(val);
    if (!isNaN(num) && (allowNegative || num >= 0)) {
      onChange(formatCSSValue(num, unit));
    }
  };
  
  const handleUnitChange = (newUnit: string) => {
    setUnit(newUnit);
    const num = parseFloat(number) || 0;
    onChange(formatCSSValue(num, newUnit));
  };
  
  return (
    <div className="flex gap-1">
      <Input
        type="number"
        value={number}
        onChange={handleNumberChange}
        disabled={disabled}
        className="w-14 h-7 text-xs text-center px-1"
        min={allowNegative ? undefined : 0}
        aria-label={`${side} spacing`}
      />
      <Select value={unit} onValueChange={handleUnitChange} disabled={disabled}>
        <SelectTrigger className="w-12 h-7 text-xs px-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CSS_UNITS.map(u => (
            <SelectItem key={u} value={u} className="text-xs">
              {u}
            </SelectItem>
          ))}
          <SelectItem value="auto" className="text-xs">
            auto
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function SpacingFieldEditor({
  value = DEFAULT_SPACING,
  onChange,
  label,
  description,
  disabled = false,
  allowNegative = false,
}: SpacingFieldEditorProps) {
  const [linked, setLinked] = React.useState(false);
  
  // Check if all values are the same (for linked mode)
  React.useEffect(() => {
    if (
      value.top === value.right &&
      value.right === value.bottom &&
      value.bottom === value.left
    ) {
      setLinked(true);
    }
  }, [value]);
  
  // Handle individual side change
  const handleSideChange = React.useCallback((side: keyof SpacingValueCSS, newValue: string) => {
    if (linked) {
      // Update all sides when linked
      onChange({
        top: newValue,
        right: newValue,
        bottom: newValue,
        left: newValue,
      });
    } else {
      onChange({
        ...value,
        [side]: newValue,
      });
    }
  }, [value, onChange, linked]);
  
  // Toggle linked mode
  const toggleLinked = React.useCallback(() => {
    if (!linked) {
      // When linking, set all to top value
      onChange({
        top: value.top,
        right: value.top,
        bottom: value.top,
        left: value.top,
      });
    }
    setLinked(!linked);
  }, [linked, value, onChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={toggleLinked}
          title={linked ? "Unlink sides" : "Link all sides"}
        >
          {linked ? (
            <Link className="h-3 w-3 text-primary" />
          ) : (
            <Unlink className="h-3 w-3 text-muted-foreground" />
          )}
        </Button>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      {/* Visual Box Model */}
      <div className="relative">
        {/* Outer box (margin representation) */}
        <div className={cn(
          "relative border-2 rounded-lg p-4",
          label.toLowerCase().includes('margin') 
            ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30" 
            : "border-blue-300 bg-blue-50 dark:bg-blue-950/30"
        )}>
          {/* Top */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2">
            <SpacingInput
              value={value.top}
              onChange={(v) => handleSideChange('top', v)}
              side="top"
              disabled={disabled}
              allowNegative={allowNegative}
            />
          </div>
          
          {/* Left */}
          <div className="absolute left-1 top-1/2 -translate-y-1/2">
            <SpacingInput
              value={value.left}
              onChange={(v) => handleSideChange('left', v)}
              side="left"
              disabled={disabled}
              allowNegative={allowNegative}
            />
          </div>
          
          {/* Right */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2">
            <SpacingInput
              value={value.right}
              onChange={(v) => handleSideChange('right', v)}
              side="right"
              disabled={disabled}
              allowNegative={allowNegative}
            />
          </div>
          
          {/* Bottom */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
            <SpacingInput
              value={value.bottom}
              onChange={(v) => handleSideChange('bottom', v)}
              side="bottom"
              disabled={disabled}
              allowNegative={allowNegative}
            />
          </div>
          
          {/* Inner content representation */}
          <div className="h-12 flex items-center justify-center">
            <div className={cn(
              "w-16 h-8 rounded border-2 border-dashed",
              "flex items-center justify-center text-xs text-muted-foreground",
              "bg-background"
            )}>
              Content
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick presets */}
      <div className="flex gap-1 flex-wrap">
        {['0px', '8px', '16px', '24px', '32px', '48px', '64px'].map(preset => (
          <Button
            key={preset}
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onChange({
              top: preset,
              right: preset,
              bottom: preset,
              left: preset,
            })}
            disabled={disabled}
          >
            {preset}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default SpacingFieldEditor;
