// src/lib/studio/fields/typography-field-editor.tsx
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { FONT_FAMILIES, FONT_WEIGHTS, parseCSSValue, formatCSSValue } from './field-utils';
import type { TypographyFieldEditorProps, TypographyValue } from '@/types/studio';
import { ChevronDown, Type } from 'lucide-react';

// Default typography value
const DEFAULT_TYPOGRAPHY: TypographyValue = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '16px',
  fontWeight: 400,
  lineHeight: '1.5',
  letterSpacing: '0em',
  textTransform: 'none',
};

export function TypographyFieldEditor({
  value = DEFAULT_TYPOGRAPHY,
  onChange,
  label,
  description,
  disabled = false,
  showPreview = true,
}: TypographyFieldEditorProps) {
  const [isOpen, setIsOpen] = React.useState(true);
  
  // Parse font size for slider
  const fontSizeParsed = parseCSSValue(value.fontSize || '16px');
  const fontSizeNum = fontSizeParsed.number;
  
  // Handle font family change
  const handleFontFamilyChange = React.useCallback((fontFamily: string) => {
    onChange({ ...value, fontFamily });
  }, [value, onChange]);
  
  // Handle font size change from slider
  const handleFontSizeSlider = React.useCallback((values: number[]) => {
    const newSize = formatCSSValue(values[0], fontSizeParsed.unit || 'px');
    onChange({ ...value, fontSize: newSize });
  }, [value, onChange, fontSizeParsed.unit]);
  
  // Handle font size change from input
  const handleFontSizeInput = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === '' || /^\d*\.?\d*(px|rem|em)?$/.test(newValue)) {
      onChange({ ...value, fontSize: newValue || '16px' });
    }
  }, [value, onChange]);
  
  // Handle font weight change
  const handleFontWeightChange = React.useCallback((weight: string) => {
    onChange({ ...value, fontWeight: parseInt(weight) });
  }, [value, onChange]);
  
  // Handle line height change
  const handleLineHeightChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, lineHeight: e.target.value || '1.5' });
  }, [value, onChange]);
  
  // Handle letter spacing change
  const handleLetterSpacingChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, letterSpacing: e.target.value || '0em' });
  }, [value, onChange]);
  
  // Handle text transform change
  const handleTextTransformChange = React.useCallback((transform: string) => {
    onChange({ ...value, textTransform: transform as TypographyValue['textTransform'] });
  }, [value, onChange]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-muted/50 rounded px-2 -mx-2">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium cursor-pointer">{label}</Label>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-4 pt-2">
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        
        {/* Preview */}
        {showPreview && (
          <div 
            className="p-3 border rounded-lg bg-background"
            style={{
              fontFamily: value.fontFamily,
              fontSize: value.fontSize,
              fontWeight: value.fontWeight,
              lineHeight: value.lineHeight,
              letterSpacing: value.letterSpacing,
              textTransform: value.textTransform,
            }}
          >
            The quick brown fox jumps over the lazy dog
          </div>
        )}
        
        {/* Font Family */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Font Family</Label>
          <Select
            value={value.fontFamily || ''}
            onValueChange={handleFontFamilyChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map(font => (
                <SelectItem 
                  key={font.value} 
                  value={font.value}
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Font Size */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Font Size</Label>
            <Input
              value={value.fontSize || '16px'}
              onChange={handleFontSizeInput}
              disabled={disabled}
              className="w-20 h-6 text-xs text-right"
            />
          </div>
          <Slider
            value={[fontSizeNum]}
            onValueChange={handleFontSizeSlider}
            min={8}
            max={96}
            step={1}
            disabled={disabled}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>8px</span>
            <span>96px</span>
          </div>
        </div>
        
        {/* Font Weight */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Font Weight</Label>
          <Select
            value={String(value.fontWeight || 400)}
            onValueChange={handleFontWeightChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_WEIGHTS.map(weight => (
                <SelectItem 
                  key={weight.value} 
                  value={String(weight.value)}
                  style={{ fontWeight: weight.value }}
                >
                  {weight.label} ({weight.value})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Line Height & Letter Spacing Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Line Height</Label>
            <Input
              value={value.lineHeight || '1.5'}
              onChange={handleLineHeightChange}
              placeholder="1.5"
              disabled={disabled}
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Letter Spacing</Label>
            <Input
              value={value.letterSpacing || '0em'}
              onChange={handleLetterSpacingChange}
              placeholder="0em"
              disabled={disabled}
              className="text-sm"
            />
          </div>
        </div>
        
        {/* Text Transform */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Text Transform</Label>
          <Select
            value={value.textTransform || 'none'}
            onValueChange={handleTextTransformChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="uppercase" className="uppercase">UPPERCASE</SelectItem>
              <SelectItem value="lowercase" className="lowercase">lowercase</SelectItem>
              <SelectItem value="capitalize" className="capitalize">Capitalize</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default TypographyFieldEditor;
