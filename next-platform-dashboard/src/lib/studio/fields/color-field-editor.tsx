// src/lib/studio/fields/color-field-editor.tsx
'use client';

import * as React from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  DESIGN_SYSTEM_COLORS, 
  COMMON_COLORS, 
  isValidHexColor,
  hslVarToHex 
} from './field-utils';
import type { ColorFieldEditorProps } from '@/types/studio';
import { Check } from 'lucide-react';

// Local storage key for recent colors
const RECENT_COLORS_KEY = 'dramac-studio-recent-colors';
const MAX_RECENT_COLORS = 12;

export function ColorFieldEditor({
  value,
  onChange,
  label,
  description,
  disabled = false,
  presets = COMMON_COLORS,
}: ColorFieldEditorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value || '');
  const [recentColors, setRecentColors] = React.useState<string[]>([]);
  
  // Load recent colors from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_COLORS_KEY);
      if (stored) {
        setRecentColors(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);
  
  // Sync input value with prop
  React.useEffect(() => {
    setInputValue(value || '');
  }, [value]);
  
  // Add color to recent colors
  const addToRecentColors = React.useCallback((color: string) => {
    if (!color || !isValidHexColor(color)) return;
    
    setRecentColors(prev => {
      const filtered = prev.filter(c => c.toLowerCase() !== color.toLowerCase());
      const updated = [color, ...filtered].slice(0, MAX_RECENT_COLORS);
      
      try {
        localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      
      return updated;
    });
  }, []);
  
  // Handle color change from picker
  const handlePickerChange = React.useCallback((color: string) => {
    setInputValue(color);
    onChange(color);
  }, [onChange]);
  
  // Handle input change
  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (isValidHexColor(newValue) || newValue.startsWith('hsl(') || newValue === '') {
      onChange(newValue);
    }
  }, [onChange]);
  
  // Handle input blur - add to recent if valid
  const handleInputBlur = React.useCallback(() => {
    if (isValidHexColor(inputValue)) {
      addToRecentColors(inputValue);
    }
  }, [inputValue, addToRecentColors]);
  
  // Handle preset click
  const handlePresetClick = React.useCallback((color: string) => {
    setInputValue(color);
    onChange(color);
    if (isValidHexColor(color)) {
      addToRecentColors(color);
    }
  }, [onChange, addToRecentColors]);
  
  // Handle popover close - add to recent
  const handleOpenChange = React.useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open && isValidHexColor(inputValue)) {
      addToRecentColors(inputValue);
    }
  }, [inputValue, addToRecentColors]);
  
  // Get display color for swatch (handle CSS variables)
  const getDisplayColor = (): string => {
    if (!value) return 'transparent';
    if (isValidHexColor(value)) return value;
    if (value.includes('var(')) {
      // For CSS variables, try to resolve or use a placeholder
      const hex = hslVarToHex(value);
      return hex || '#888888';
    }
    return value;
  };
  
  // Get picker-compatible hex (for react-colorful)
  const getPickerHex = (): string => {
    if (!value) return '#000000';
    if (isValidHexColor(value)) return value;
    const hex = hslVarToHex(value);
    return hex || '#000000';
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      <div className="flex gap-2">
        {/* Color Swatch + Popover */}
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              disabled={disabled}
              className="h-9 w-9 shrink-0 border-2"
              style={{ backgroundColor: getDisplayColor() }}
            >
              <span className="sr-only">Pick color</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <Tabs defaultValue="picker" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-3">
                <TabsTrigger value="picker" className="text-xs">Picker</TabsTrigger>
                <TabsTrigger value="presets" className="text-xs">Presets</TabsTrigger>
                <TabsTrigger value="system" className="text-xs">System</TabsTrigger>
              </TabsList>
              
              {/* Color Picker Tab */}
              <TabsContent value="picker" className="space-y-3">
                <HexColorPicker
                  color={getPickerHex()}
                  onChange={handlePickerChange}
                  className="!w-full"
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <HexColorInput
                      color={getPickerHex()}
                      onChange={handlePickerChange}
                      prefixed
                      className="w-full h-8 px-2 text-sm border rounded-md bg-background"
                    />
                  </div>
                </div>
                
                {/* Recent Colors */}
                {recentColors.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Recent</Label>
                    <div className="grid grid-cols-6 gap-1">
                      {recentColors.map((color, idx) => (
                        <button
                          key={`${color}-${idx}`}
                          onClick={() => handlePresetClick(color)}
                          className={cn(
                            "w-6 h-6 rounded border border-border hover:ring-2 hover:ring-ring",
                            "transition-all duration-150",
                            value?.toLowerCase() === color.toLowerCase() && "ring-2 ring-primary"
                          )}
                          style={{ backgroundColor: color }}
                          title={color}
                        >
                          {value?.toLowerCase() === color.toLowerCase() && (
                            <Check className="w-3 h-3 mx-auto text-white drop-shadow" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Common Color Presets Tab */}
              <TabsContent value="presets" className="space-y-2">
                <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                  {presets.map((color, idx) => (
                    <button
                      key={`${color}-${idx}`}
                      onClick={() => handlePresetClick(color)}
                      className={cn(
                        "w-6 h-6 rounded border border-border hover:ring-2 hover:ring-ring",
                        "transition-all duration-150",
                        value?.toLowerCase() === color.toLowerCase() && "ring-2 ring-primary"
                      )}
                      style={{ backgroundColor: color }}
                      title={color}
                    >
                      {value?.toLowerCase() === color.toLowerCase() && (
                        <Check className="w-3 h-3 mx-auto text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </TabsContent>
              
              {/* Design System Colors Tab */}
              <TabsContent value="system" className="space-y-2">
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {DESIGN_SYSTEM_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handlePresetClick(color.value)}
                      className={cn(
                        "w-full flex items-center gap-2 p-1.5 rounded hover:bg-muted",
                        "transition-colors duration-150",
                        value === color.value && "bg-muted"
                      )}
                    >
                      <div
                        className="w-5 h-5 rounded border border-border shrink-0"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-xs truncate">{color.label}</span>
                      {value === color.value && (
                        <Check className="w-3 h-3 ml-auto text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>
        
        {/* Text Input */}
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={disabled}
          placeholder="#000000"
          className="font-mono text-sm h-9"
        />
      </div>
    </div>
  );
}

export default ColorFieldEditor;
