# PHASE-STUDIO-09: Advanced Field Types

## Overview

| Property | Value |
|----------|-------|
| Phase | STUDIO-09 |
| Title | Advanced Field Types |
| Priority | High |
| Estimated Time | 12-16 hours |
| Dependencies | STUDIO-05, STUDIO-06, STUDIO-07, STUDIO-08 |
| Risk Level | Medium |

## Problem Statement

The current field system only supports basic field types (text, number, select, toggle). Premium website builders like Webflow and Wix Studio provide rich, visual field editors that make property editing intuitive and powerful. Without advanced field types, users cannot:

- Pick colors visually with a color picker
- Upload or select images with preview
- Link to internal pages or external URLs
- Edit spacing/padding visually with a box model diagram
- Control typography with visual sliders
- Manage lists of items (features, testimonials, etc.)
- Edit nested object properties

This phase implements 7 advanced field types that transform the properties panel from basic inputs into a professional-grade editing experience.

## Goals

- [ ] Implement ColorFieldEditor with visual picker and presets
- [ ] Implement ImageFieldEditor with upload, URL, and preview
- [ ] Implement LinkFieldEditor with page picker and URL tabs
- [ ] Implement SpacingFieldEditor with visual box model
- [ ] Implement TypographyFieldEditor with font controls
- [ ] Implement ArrayFieldEditor for managing item lists
- [ ] Implement ObjectFieldEditor for nested properties
- [ ] Update field registry to support all new types
- [ ] Create reusable field utilities

## Technical Approach

Each advanced field editor will be a self-contained React component that:
1. Receives value and onChange props
2. Renders appropriate UI for the field type
3. Uses Shadcn/ui components for consistency
4. Supports keyboard accessibility
5. Handles edge cases (empty values, invalid input)

The field types will be registered in the field registry and automatically rendered by the FieldRenderer component based on the field definition's `type` property.

---

## Implementation Tasks

### Task 1: Create Field Utilities and Types

**Description:** Create shared utilities and types for all field editors.

**Files:**
- CREATE: `src/lib/studio/fields/field-utils.ts`
- MODIFY: `src/types/studio.ts`

**Code for `src/lib/studio/fields/field-utils.ts`:**

```typescript
// src/lib/studio/fields/field-utils.ts
'use client';

/**
 * Field utilities for DRAMAC Studio advanced field editors
 */

// CSS unit regex pattern
export const CSS_UNIT_PATTERN = /^(-?\d*\.?\d+)(px|rem|em|%|vh|vw|auto)?$/;

// Parse CSS value into number and unit
export function parseCSSValue(value: string): { number: number; unit: string } {
  if (value === 'auto') {
    return { number: 0, unit: 'auto' };
  }
  
  const match = value.match(CSS_UNIT_PATTERN);
  if (match) {
    return {
      number: parseFloat(match[1]) || 0,
      unit: match[2] || 'px',
    };
  }
  
  return { number: 0, unit: 'px' };
}

// Format number and unit to CSS value
export function formatCSSValue(number: number, unit: string): string {
  if (unit === 'auto') return 'auto';
  return `${number}${unit}`;
}

// Design system colors for color picker presets
export const DESIGN_SYSTEM_COLORS = [
  { label: 'Background', value: 'hsl(var(--background))' },
  { label: 'Foreground', value: 'hsl(var(--foreground))' },
  { label: 'Primary', value: 'hsl(var(--primary))' },
  { label: 'Primary Foreground', value: 'hsl(var(--primary-foreground))' },
  { label: 'Secondary', value: 'hsl(var(--secondary))' },
  { label: 'Secondary Foreground', value: 'hsl(var(--secondary-foreground))' },
  { label: 'Muted', value: 'hsl(var(--muted))' },
  { label: 'Muted Foreground', value: 'hsl(var(--muted-foreground))' },
  { label: 'Accent', value: 'hsl(var(--accent))' },
  { label: 'Accent Foreground', value: 'hsl(var(--accent-foreground))' },
  { label: 'Destructive', value: 'hsl(var(--destructive))' },
  { label: 'Border', value: 'hsl(var(--border))' },
  { label: 'Ring', value: 'hsl(var(--ring))' },
  { label: 'Card', value: 'hsl(var(--card))' },
];

// Common hex colors for quick selection
export const COMMON_COLORS = [
  '#000000', '#FFFFFF', '#F8F9FA', '#E9ECEF', '#DEE2E6',
  '#CED4DA', '#ADB5BD', '#6C757D', '#495057', '#343A40',
  '#212529', '#FF0000', '#FF6B6B', '#F03E3E', '#C92A2A',
  '#00FF00', '#51CF66', '#40C057', '#2F9E44', '#0000FF',
  '#4C6EF5', '#3B5BDB', '#364FC7', '#FFFF00', '#FCC419',
  '#FAB005', '#F59F00', '#FF00FF', '#DA77F2', '#BE4BDB',
  '#9C36B5', '#00FFFF', '#3BC9DB', '#22B8CF', '#15AABF',
  '#FF8C00', '#FF922B', '#FD7E14', '#E8590C',
];

// Font families available in the editor
export const FONT_FAMILIES = [
  { label: 'System Default', value: 'system-ui, -apple-system, sans-serif' },
  { label: 'Geist Sans', value: 'var(--font-geist-sans), sans-serif' },
  { label: 'Geist Mono', value: 'var(--font-geist-mono), monospace' },
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Roboto', value: "'Roboto', sans-serif" },
  { label: 'Open Sans', value: "'Open Sans', sans-serif" },
  { label: 'Lato', value: "'Lato', sans-serif" },
  { label: 'Poppins', value: "'Poppins', sans-serif" },
  { label: 'Montserrat', value: "'Montserrat', sans-serif" },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'Merriweather', value: "'Merriweather', serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', serif" },
  { label: 'Courier New', value: "'Courier New', monospace" },
  { label: 'Monaco', value: 'Monaco, monospace' },
];

// Font weight options
export const FONT_WEIGHTS = [
  { label: 'Thin', value: 100 },
  { label: 'Extra Light', value: 200 },
  { label: 'Light', value: 300 },
  { label: 'Normal', value: 400 },
  { label: 'Medium', value: 500 },
  { label: 'Semi Bold', value: 600 },
  { label: 'Bold', value: 700 },
  { label: 'Extra Bold', value: 800 },
  { label: 'Black', value: 900 },
];

// CSS units for spacing/sizing
export const CSS_UNITS = ['px', 'rem', 'em', '%', 'vh', 'vw'];

// Validate hex color
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

// Validate CSS color (hex, rgb, rgba, hsl, hsla, named)
export function isValidCSSColor(color: string): boolean {
  if (!color) return false;
  if (isValidHexColor(color)) return true;
  if (color.startsWith('hsl(') || color.startsWith('hsla(')) return true;
  if (color.startsWith('rgb(') || color.startsWith('rgba(')) return true;
  if (color === 'transparent' || color === 'inherit' || color === 'currentColor') return true;
  return false;
}

// Convert HSL CSS variable to approximate hex for picker preview
export function hslVarToHex(hslVar: string): string | null {
  // For CSS variables, we can't directly convert - return null to use fallback
  if (hslVar.includes('var(')) {
    return null;
  }
  
  // Parse hsl(h, s%, l%) format
  const match = hslVar.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (match) {
    const h = parseInt(match[1]) / 360;
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;
    
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  
  return null;
}

// Generate unique field ID
export function generateFieldId(prefix: string = 'field'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

// Debounce helper for field updates
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
```

**Update `src/types/studio.ts` to add field types:**

```typescript
// Add to existing src/types/studio.ts

// Spacing value type (for margin/padding fields)
export interface SpacingValue {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

// Typography value type
export interface TypographyValue {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: number;
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

// Image value type
export interface ImageValue {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

// Link value type
export interface LinkValue {
  href: string;
  target?: '_blank' | '_self';
  pageId?: string;
  type?: 'page' | 'url' | 'email' | 'phone';
}

// Field editor props base
export interface BaseFieldEditorProps<T> {
  value: T;
  onChange: (value: T) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

// Color field props
export interface ColorFieldEditorProps extends BaseFieldEditorProps<string> {
  showAlpha?: boolean;
  presets?: string[];
}

// Image field props
export interface ImageFieldEditorProps extends BaseFieldEditorProps<ImageValue> {
  accepts?: string[];
  maxSize?: number;
}

// Link field props
export interface LinkFieldEditorProps extends BaseFieldEditorProps<LinkValue> {
  allowedTypes?: Array<'page' | 'url' | 'email' | 'phone'>;
  siteId?: string;
}

// Spacing field props
export interface SpacingFieldEditorProps extends BaseFieldEditorProps<SpacingValue> {
  allowNegative?: boolean;
  units?: string[];
}

// Typography field props
export interface TypographyFieldEditorProps extends BaseFieldEditorProps<TypographyValue> {
  showPreview?: boolean;
}

// Array field props
export interface ArrayFieldEditorProps extends BaseFieldEditorProps<unknown[]> {
  itemFields: Record<string, FieldDefinition>;
  itemLabel?: string;
  minItems?: number;
  maxItems?: number;
}

// Object field props
export interface ObjectFieldEditorProps extends BaseFieldEditorProps<Record<string, unknown>> {
  fields: Record<string, FieldDefinition>;
  collapsible?: boolean;
}
```

**Acceptance Criteria:**
- [ ] Field utilities compile without errors
- [ ] Types are exported and available
- [ ] CSS parsing functions work correctly
- [ ] Color conversion functions work correctly

---

### Task 2: Implement ColorFieldEditor

**Description:** Create a visual color picker field with hex input, design system presets, and recent colors.

**Files:**
- CREATE: `src/lib/studio/fields/color-field-editor.tsx`

**Code:**

```typescript
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
import { Pipette, Check } from 'lucide-react';

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
```

**Acceptance Criteria:**
- [ ] Color picker opens on swatch click
- [ ] Hex input accepts valid hex colors
- [ ] Design system presets show CSS variables
- [ ] Recent colors persist in localStorage
- [ ] Selected color shows checkmark
- [ ] Keyboard accessible (Tab, Enter, Escape)

---

### Task 3: Implement ImageFieldEditor

**Description:** Create an image field with URL input, upload button, preview, and alt text.

**Files:**
- CREATE: `src/lib/studio/fields/image-field-editor.tsx`

**Code:**

```typescript
// src/lib/studio/fields/image-field-editor.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ImageFieldEditorProps, ImageValue } from '@/types/studio';
import { 
  Image as ImageIcon, 
  Upload, 
  X, 
  Link2, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Default empty image value
const DEFAULT_IMAGE: ImageValue = {
  url: '',
  alt: '',
};

export function ImageFieldEditor({
  value = DEFAULT_IMAGE,
  onChange,
  label,
  description,
  disabled = false,
  accepts = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
}: ImageFieldEditorProps) {
  const [urlInput, setUrlInput] = React.useState(value?.url || '');
  const [isLoading, setIsLoading] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>('url');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Sync URL input with value
  React.useEffect(() => {
    setUrlInput(value?.url || '');
    setImageError(false);
  }, [value?.url]);
  
  // Handle URL input change
  const handleUrlChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrlInput(newUrl);
    setImageError(false);
  }, []);
  
  // Handle URL input blur - commit the change
  const handleUrlBlur = React.useCallback(() => {
    if (urlInput !== value?.url) {
      onChange({
        ...value,
        url: urlInput,
      });
    }
  }, [urlInput, value, onChange]);
  
  // Handle URL input Enter key
  const handleUrlKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUrlBlur();
    }
  }, [handleUrlBlur]);
  
  // Handle alt text change
  const handleAltChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      alt: e.target.value,
    });
  }, [value, onChange]);
  
  // Handle file upload
  const handleFileChange = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!accepts.includes(file.type)) {
      alert(`Invalid file type. Accepted: ${accepts.join(', ')}`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // TODO: Integrate with actual media library upload
      // For now, create a local object URL for preview
      // In production, this should upload to Supabase storage
      
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Attempt upload to media library API
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        onChange({
          url: data.url,
          alt: value?.alt || file.name.replace(/\.[^/.]+$/, ''),
          width: data.width,
          height: data.height,
        });
      } else {
        // Fallback: Use object URL for development
        const objectUrl = URL.createObjectURL(file);
        onChange({
          url: objectUrl,
          alt: value?.alt || file.name.replace(/\.[^/.]+$/, ''),
        });
      }
    } catch (error) {
      // Fallback: Use object URL for development
      const objectUrl = URL.createObjectURL(file);
      onChange({
        url: objectUrl,
        alt: value?.alt || file.name.replace(/\.[^/.]+$/, ''),
      });
    } finally {
      setIsLoading(false);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [accepts, value, onChange]);
  
  // Handle upload button click
  const handleUploadClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  
  // Handle clear image
  const handleClear = React.useCallback(() => {
    onChange(DEFAULT_IMAGE);
    setUrlInput('');
    setImageError(false);
  }, [onChange]);
  
  // Handle image load error
  const handleImageError = React.useCallback(() => {
    setImageError(true);
  }, []);
  
  // Handle image load success
  const handleImageLoad = React.useCallback(() => {
    setImageError(false);
  }, []);
  
  // Open media library dialog
  const handleMediaLibraryClick = React.useCallback(() => {
    // TODO: Open media library modal
    // This would integrate with the existing media library component
    alert('Media Library integration coming in future phase');
  }, []);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      {/* Image Preview */}
      <div 
        className={cn(
          "relative w-full aspect-video rounded-lg border-2 border-dashed",
          "flex items-center justify-center overflow-hidden",
          "bg-muted/50 transition-colors",
          !value?.url && "hover:bg-muted hover:border-muted-foreground/50",
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        {value?.url && !imageError ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.url}
              alt={value.alt || 'Preview'}
              className="w-full h-full object-contain"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
            {/* Clear button */}
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : imageError ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <span className="text-xs">Failed to load image</span>
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Clear URL
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-xs">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <span className="text-xs">No image selected</span>
          </div>
        )}
      </div>
      
      {/* Tabs: URL / Upload */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="url" className="text-xs gap-1">
            <Link2 className="h-3 w-3" />
            URL
          </TabsTrigger>
          <TabsTrigger value="upload" className="text-xs gap-1">
            <Upload className="h-3 w-3" />
            Upload
          </TabsTrigger>
        </TabsList>
        
        {/* URL Tab */}
        <TabsContent value="url" className="mt-2">
          <Input
            value={urlInput}
            onChange={handleUrlChange}
            onBlur={handleUrlBlur}
            onKeyDown={handleUrlKeyDown}
            placeholder="https://example.com/image.jpg"
            disabled={disabled}
            className="text-sm"
          />
        </TabsContent>
        
        {/* Upload Tab */}
        <TabsContent value="upload" className="mt-2 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={accepts.join(',')}
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUploadClick}
              disabled={disabled || isLoading}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMediaLibraryClick}
              disabled={disabled}
              className="flex-1"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Media Library
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Accepts: {accepts.map(t => t.replace('image/', '')).join(', ')}
          </p>
        </TabsContent>
      </Tabs>
      
      {/* Alt Text */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Alt Text</Label>
        <Input
          value={value?.alt || ''}
          onChange={handleAltChange}
          placeholder="Describe this image"
          disabled={disabled}
          className="text-sm"
        />
      </div>
    </div>
  );
}

export default ImageFieldEditor;
```

**Acceptance Criteria:**
- [ ] URL input updates image preview
- [ ] Upload button opens file picker
- [ ] Image preview shows with aspect ratio
- [ ] Clear button removes image
- [ ] Alt text field works
- [ ] Loading state shows during upload
- [ ] Error state shows for invalid URLs

---

### Task 4: Implement LinkFieldEditor

**Description:** Create a link field with tabs for page, URL, email, and phone.

**Files:**
- CREATE: `src/lib/studio/fields/link-field-editor.tsx`

**Code:**

```typescript
// src/lib/studio/fields/link-field-editor.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { LinkFieldEditorProps, LinkValue } from '@/types/studio';
import { 
  FileText, 
  Link2, 
  Mail, 
  Phone, 
  ExternalLink,
  Loader2 
} from 'lucide-react';

// Default empty link value
const DEFAULT_LINK: LinkValue = {
  href: '',
  target: '_self',
  type: 'url',
};

// Mock pages data - in production, fetch from API
const useSitePages = (siteId?: string) => {
  const [pages, setPages] = React.useState<Array<{ id: string; title: string; slug: string }>>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  
  React.useEffect(() => {
    if (!siteId) {
      // Default mock pages for development
      setPages([
        { id: 'home', title: 'Home', slug: '/' },
        { id: 'about', title: 'About', slug: '/about' },
        { id: 'services', title: 'Services', slug: '/services' },
        { id: 'contact', title: 'Contact', slug: '/contact' },
        { id: 'blog', title: 'Blog', slug: '/blog' },
      ]);
      return;
    }
    
    // Fetch actual pages
    const fetchPages = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/sites/${siteId}/pages`);
        if (response.ok) {
          const data = await response.json();
          setPages(data.pages || []);
        }
      } catch {
        // Use mock data on error
        setPages([
          { id: 'home', title: 'Home', slug: '/' },
          { id: 'about', title: 'About', slug: '/about' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPages();
  }, [siteId]);
  
  return { pages, isLoading };
};

export function LinkFieldEditor({
  value = DEFAULT_LINK,
  onChange,
  label,
  description,
  disabled = false,
  allowedTypes = ['page', 'url', 'email', 'phone'],
  siteId,
}: LinkFieldEditorProps) {
  const { pages, isLoading: pagesLoading } = useSitePages(siteId);
  const [activeTab, setActiveTab] = React.useState<string>(value?.type || 'url');
  
  // Sync active tab with value type
  React.useEffect(() => {
    if (value?.type && allowedTypes.includes(value.type)) {
      setActiveTab(value.type);
    }
  }, [value?.type, allowedTypes]);
  
  // Handle tab change
  const handleTabChange = React.useCallback((newTab: string) => {
    setActiveTab(newTab);
    onChange({
      ...value,
      href: '',
      type: newTab as LinkValue['type'],
      pageId: undefined,
    });
  }, [value, onChange]);
  
  // Handle page select
  const handlePageSelect = React.useCallback((pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    onChange({
      ...value,
      href: page?.slug || '/',
      pageId,
      type: 'page',
    });
  }, [pages, value, onChange]);
  
  // Handle URL input
  const handleUrlChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      href: e.target.value,
      type: 'url',
    });
  }, [value, onChange]);
  
  // Handle email input
  const handleEmailChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    onChange({
      ...value,
      href: email ? `mailto:${email.replace('mailto:', '')}` : '',
      type: 'email',
    });
  }, [value, onChange]);
  
  // Handle phone input
  const handlePhoneChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    onChange({
      ...value,
      href: phone ? `tel:${phone.replace('tel:', '')}` : '',
      type: 'phone',
    });
  }, [value, onChange]);
  
  // Handle target toggle
  const handleTargetToggle = React.useCallback((checked: boolean) => {
    onChange({
      ...value,
      target: checked ? '_blank' : '_self',
    });
  }, [value, onChange]);
  
  // Extract email from mailto:
  const getEmail = (): string => {
    if (!value?.href) return '';
    return value.href.replace('mailto:', '');
  };
  
  // Extract phone from tel:
  const getPhone = (): string => {
    if (!value?.href) return '';
    return value.href.replace('tel:', '');
  };

  // Filter allowed tabs
  const tabs = [
    { id: 'page', label: 'Page', icon: FileText },
    { id: 'url', label: 'URL', icon: Link2 },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'phone', label: 'Phone', icon: Phone },
  ].filter(tab => allowedTypes.includes(tab.id as LinkValue['type']));

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className={cn(
          "grid w-full h-8",
          `grid-cols-${tabs.length}`
        )} style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map(tab => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id} 
              className="text-xs gap-1"
              disabled={disabled}
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {/* Page Tab */}
        {allowedTypes.includes('page') && (
          <TabsContent value="page" className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Select Page</Label>
              <Select
                value={value?.pageId || ''}
                onValueChange={handlePageSelect}
                disabled={disabled || pagesLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={pagesLoading ? "Loading pages..." : "Choose a page"} />
                </SelectTrigger>
                <SelectContent>
                  {pages.map(page => (
                    <SelectItem key={page.id} value={page.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span>{page.title}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{page.slug}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {pagesLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading pages...
              </div>
            )}
          </TabsContent>
        )}
        
        {/* URL Tab */}
        {allowedTypes.includes('url') && (
          <TabsContent value="url" className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">URL</Label>
              <Input
                value={value?.type === 'url' ? value?.href || '' : ''}
                onChange={handleUrlChange}
                placeholder="https://example.com"
                disabled={disabled}
                className="text-sm"
              />
            </div>
          </TabsContent>
        )}
        
        {/* Email Tab */}
        {allowedTypes.includes('email') && (
          <TabsContent value="email" className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email Address</Label>
              <Input
                type="email"
                value={value?.type === 'email' ? getEmail() : ''}
                onChange={handleEmailChange}
                placeholder="hello@example.com"
                disabled={disabled}
                className="text-sm"
              />
            </div>
          </TabsContent>
        )}
        
        {/* Phone Tab */}
        {allowedTypes.includes('phone') && (
          <TabsContent value="phone" className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Phone Number</Label>
              <Input
                type="tel"
                value={value?.type === 'phone' ? getPhone() : ''}
                onChange={handlePhoneChange}
                placeholder="+1 (555) 000-0000"
                disabled={disabled}
                className="text-sm"
              />
            </div>
          </TabsContent>
        )}
      </Tabs>
      
      {/* Open in new tab toggle */}
      {(activeTab === 'url' || activeTab === 'page') && (
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm cursor-pointer" htmlFor="link-target">
              Open in new tab
            </Label>
          </div>
          <Switch
            id="link-target"
            checked={value?.target === '_blank'}
            onCheckedChange={handleTargetToggle}
            disabled={disabled}
          />
        </div>
      )}
      
      {/* Link preview */}
      {value?.href && (
        <div className="text-xs text-muted-foreground truncate p-2 bg-muted rounded">
          {value.href}
        </div>
      )}
    </div>
  );
}

export default LinkFieldEditor;
```

**Acceptance Criteria:**
- [ ] Page tab shows site pages dropdown
- [ ] URL tab accepts external links
- [ ] Email tab formats mailto: links
- [ ] Phone tab formats tel: links
- [ ] New tab toggle works
- [ ] Link preview shows current value

---

### Task 5: Implement SpacingFieldEditor

**Description:** Create a visual box model editor for margin and padding.

**Files:**
- CREATE: `src/lib/studio/fields/spacing-field-editor.tsx`

**Code:**

```typescript
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
import type { SpacingFieldEditorProps, SpacingValue } from '@/types/studio';
import { Link, Unlink } from 'lucide-react';

// Default spacing value
const DEFAULT_SPACING: SpacingValue = {
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
  }, []);
  
  // Handle individual side change
  const handleSideChange = React.useCallback((side: keyof SpacingValue, newValue: string) => {
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
```

**Acceptance Criteria:**
- [ ] Visual box model shows 4 input fields
- [ ] Link button syncs all sides
- [ ] Unit selector works for each side
- [ ] Quick presets apply to all sides
- [ ] Margin vs padding styling differs
- [ ] Auto value supported

---

### Task 6: Implement TypographyFieldEditor

**Description:** Create a comprehensive typography control panel.

**Files:**
- CREATE: `src/lib/studio/fields/typography-field-editor.tsx`

**Code:**

```typescript
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
```

**Acceptance Criteria:**
- [ ] Font family dropdown shows system + custom fonts
- [ ] Font size slider with manual input
- [ ] Font weight dropdown with preview
- [ ] Line height input works
- [ ] Letter spacing input works
- [ ] Text transform dropdown works
- [ ] Live preview updates

---

### Task 7: Implement ArrayFieldEditor

**Description:** Create an array field for managing lists of items.

**Files:**
- CREATE: `src/lib/studio/fields/array-field-editor.tsx`

**Code:**

```typescript
// src/lib/studio/fields/array-field-editor.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { ArrayFieldEditorProps, FieldDefinition } from '@/types/studio';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  GripVertical,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  List
} from 'lucide-react';
import { nanoid } from 'nanoid';

// Import field renderer (will be provided by parent)
// This creates a circular dependency that we handle via context
interface FieldRendererProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

type FieldRendererComponent = React.ComponentType<FieldRendererProps>;

// Context to receive field renderer from parent
const FieldRendererContext = React.createContext<FieldRendererComponent | null>(null);

export function ArrayFieldEditorProvider({ 
  children, 
  fieldRenderer 
}: { 
  children: React.ReactNode; 
  fieldRenderer: FieldRendererComponent;
}) {
  return (
    <FieldRendererContext.Provider value={fieldRenderer}>
      {children}
    </FieldRendererContext.Provider>
  );
}

interface ArrayItemProps {
  item: Record<string, unknown>;
  index: number;
  itemFields: Record<string, FieldDefinition>;
  onUpdate: (index: number, newItem: Record<string, unknown>) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
  disabled?: boolean;
  itemLabel?: string;
  FieldRenderer: FieldRendererComponent;
}

function ArrayItem({
  item,
  index,
  itemFields,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  disabled,
  itemLabel = 'Item',
  FieldRenderer,
}: ArrayItemProps) {
  const [isOpen, setIsOpen] = React.useState(index === 0);
  
  // Get display title from item (use first text field or index)
  const getItemTitle = (): string => {
    // Try to find a title/label/name field
    for (const key of ['title', 'label', 'name', 'text', 'heading']) {
      if (item[key] && typeof item[key] === 'string') {
        return String(item[key]).substring(0, 30);
      }
    }
    return `${itemLabel} ${index + 1}`;
  };
  
  // Handle field change within item
  const handleFieldChange = React.useCallback((fieldName: string, value: unknown) => {
    onUpdate(index, { ...item, [fieldName]: value });
  }, [index, item, onUpdate]);

  return (
    <div className={cn(
      "border rounded-lg",
      isOpen ? "border-border" : "border-transparent hover:border-border"
    )}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center gap-1 p-2">
          {/* Drag handle (visual only for now) */}
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
          
          {/* Expand/collapse trigger */}
          <CollapsibleTrigger className="flex-1 flex items-center justify-between text-left hover:bg-muted/50 rounded px-2 py-1">
            <span className="text-sm font-medium truncate">{getItemTitle()}</span>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform shrink-0",
              isOpen && "rotate-180"
            )} />
          </CollapsibleTrigger>
          
          {/* Move buttons */}
          <div className="flex gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onMoveUp(index)}
              disabled={disabled || isFirst}
              title="Move up"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onMoveDown(index)}
              disabled={disabled || isLast}
              title="Move down"
            >
              <ChevronDownIcon className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Delete button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                disabled={disabled}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {itemLabel}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove &quot;{getItemTitle()}&quot; from the list. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onRemove(index)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <CollapsibleContent className="px-4 pb-4 space-y-3">
          {Object.entries(itemFields).map(([fieldName, fieldDef]) => (
            <FieldRenderer
              key={fieldName}
              field={{ ...fieldDef, label: fieldDef.label || fieldName }}
              value={item[fieldName]}
              onChange={(val) => handleFieldChange(fieldName, val)}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function ArrayFieldEditor({
  value = [],
  onChange,
  itemFields,
  label,
  description,
  disabled = false,
  itemLabel = 'Item',
  minItems = 0,
  maxItems,
}: ArrayFieldEditorProps) {
  const FieldRenderer = React.useContext(FieldRendererContext);
  
  if (!FieldRenderer) {
    return (
      <div className="p-4 border rounded-lg bg-muted">
        <p className="text-sm text-muted-foreground">
          ArrayFieldEditor requires a FieldRenderer context. Wrap with ArrayFieldEditorProvider.
        </p>
      </div>
    );
  }
  
  // Ensure value is an array
  const items = Array.isArray(value) ? value as Record<string, unknown>[] : [];
  
  // Add new item
  const handleAdd = React.useCallback(() => {
    if (maxItems && items.length >= maxItems) return;
    
    // Create default item from field definitions
    const newItem: Record<string, unknown> = { _id: nanoid() };
    Object.entries(itemFields).forEach(([key, field]) => {
      newItem[key] = field.defaultValue ?? '';
    });
    
    onChange([...items, newItem]);
  }, [items, itemFields, onChange, maxItems]);
  
  // Update item at index
  const handleUpdate = React.useCallback((index: number, newItem: Record<string, unknown>) => {
    const newItems = [...items];
    newItems[index] = newItem;
    onChange(newItems);
  }, [items, onChange]);
  
  // Remove item at index
  const handleRemove = React.useCallback((index: number) => {
    if (items.length <= minItems) return;
    onChange(items.filter((_, i) => i !== index));
  }, [items, onChange, minItems]);
  
  // Move item up
  const handleMoveUp = React.useCallback((index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onChange(newItems);
  }, [items, onChange]);
  
  // Move item down
  const handleMoveDown = React.useCallback((index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    onChange(newItems);
  }, [items, onChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <List className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">{label}</Label>
          <span className="text-xs text-muted-foreground">
            ({items.length}{maxItems ? `/${maxItems}` : ''})
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled || (maxItems ? items.length >= maxItems : false)}
          className="h-7"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add {itemLabel}
        </Button>
      </div>
      
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      {/* Items list */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="p-4 border-2 border-dashed rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              No items yet. Click &quot;Add {itemLabel}&quot; to create one.
            </p>
          </div>
        ) : (
          items.map((item, index) => (
            <ArrayItem
              key={item._id as string || index}
              item={item}
              index={index}
              itemFields={itemFields}
              onUpdate={handleUpdate}
              onRemove={handleRemove}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              disabled={disabled || items.length <= minItems}
              itemLabel={itemLabel}
              FieldRenderer={FieldRenderer}
            />
          ))
        )}
      </div>
      
      {/* Min/Max info */}
      {(minItems > 0 || maxItems) && (
        <p className="text-xs text-muted-foreground">
          {minItems > 0 && `Minimum: ${minItems}`}
          {minItems > 0 && maxItems && ' | '}
          {maxItems && `Maximum: ${maxItems}`}
        </p>
      )}
    </div>
  );
}

export default ArrayFieldEditor;
```

**Acceptance Criteria:**
- [ ] Add button creates new item
- [ ] Each item renders its fields
- [ ] Remove button deletes item (with confirmation)
- [ ] Move up/down buttons reorder
- [ ] Collapsible items for space efficiency
- [ ] Min/max item constraints enforced

---

### Task 8: Implement ObjectFieldEditor

**Description:** Create an object field for nested properties.

**Files:**
- CREATE: `src/lib/studio/fields/object-field-editor.tsx`

**Code:**

```typescript
// src/lib/studio/fields/object-field-editor.tsx
'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ObjectFieldEditorProps, FieldDefinition } from '@/types/studio';
import { ChevronDown, Settings2 } from 'lucide-react';

// Context to receive field renderer from parent (shared with ArrayFieldEditor)
interface FieldRendererProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

type FieldRendererComponent = React.ComponentType<FieldRendererProps>;

const FieldRendererContext = React.createContext<FieldRendererComponent | null>(null);

export function ObjectFieldEditorProvider({ 
  children, 
  fieldRenderer 
}: { 
  children: React.ReactNode; 
  fieldRenderer: FieldRendererComponent;
}) {
  return (
    <FieldRendererContext.Provider value={fieldRenderer}>
      {children}
    </FieldRendererContext.Provider>
  );
}

export function ObjectFieldEditor({
  value = {},
  onChange,
  fields,
  label,
  description,
  disabled = false,
  collapsible = true,
}: ObjectFieldEditorProps) {
  const FieldRenderer = React.useContext(FieldRendererContext);
  const [isOpen, setIsOpen] = React.useState(true);
  
  // Handle nested field change
  const handleFieldChange = React.useCallback((fieldName: string, fieldValue: unknown) => {
    onChange({
      ...value,
      [fieldName]: fieldValue,
    });
  }, [value, onChange]);
  
  if (!FieldRenderer) {
    return (
      <div className="p-4 border rounded-lg bg-muted">
        <p className="text-sm text-muted-foreground">
          ObjectFieldEditor requires a FieldRenderer context. Wrap with ObjectFieldEditorProvider.
        </p>
      </div>
    );
  }
  
  // Non-collapsible rendering
  if (!collapsible) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">{label}</Label>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        <div className="pl-4 border-l-2 border-muted space-y-3">
          {Object.entries(fields).map(([fieldName, fieldDef]) => (
            <FieldRenderer
              key={fieldName}
              field={{ ...fieldDef, label: fieldDef.label || fieldName }}
              value={value[fieldName]}
              onChange={(val) => handleFieldChange(fieldName, val)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <CollapsibleTrigger 
        className={cn(
          "flex items-center justify-between w-full py-2 px-2 -mx-2 rounded",
          "hover:bg-muted/50 transition-colors"
        )}
        disabled={disabled}
      >
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium cursor-pointer">{label}</Label>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </CollapsibleTrigger>
      
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      <CollapsibleContent className="space-y-3">
        <div className="pl-4 border-l-2 border-muted space-y-3">
          {Object.entries(fields).map(([fieldName, fieldDef]) => (
            <FieldRenderer
              key={fieldName}
              field={{ ...fieldDef, label: fieldDef.label || fieldName }}
              value={value[fieldName]}
              onChange={(val) => handleFieldChange(fieldName, val)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default ObjectFieldEditor;
```

**Acceptance Criteria:**
- [ ] Nested fields render correctly
- [ ] Collapsible header works
- [ ] Visual indentation shows nesting
- [ ] Field changes propagate to parent object
- [ ] Non-collapsible mode available

---

### Task 9: Update Field Registry and Create Master FieldRenderer

**Description:** Register all field types and create the main FieldRenderer component.

**Files:**
- MODIFY: `src/lib/studio/registry/field-registry.ts`
- CREATE: `src/components/studio/fields/field-renderer.tsx`

**Code for `src/components/studio/fields/field-renderer.tsx`:**

```typescript
// src/components/studio/fields/field-renderer.tsx
'use client';

import * as React from 'react';
import type { FieldDefinition, FieldType } from '@/types/studio';

// Import all field editors
import { TextFieldEditor } from '@/lib/studio/fields/text-field-editor';
import { NumberFieldEditor } from '@/lib/studio/fields/number-field-editor';
import { SelectFieldEditor } from '@/lib/studio/fields/select-field-editor';
import { ToggleFieldEditor } from '@/lib/studio/fields/toggle-field-editor';
import { ColorFieldEditor } from '@/lib/studio/fields/color-field-editor';
import { ImageFieldEditor } from '@/lib/studio/fields/image-field-editor';
import { LinkFieldEditor } from '@/lib/studio/fields/link-field-editor';
import { SpacingFieldEditor } from '@/lib/studio/fields/spacing-field-editor';
import { TypographyFieldEditor } from '@/lib/studio/fields/typography-field-editor';
import { 
  ArrayFieldEditor, 
  ArrayFieldEditorProvider 
} from '@/lib/studio/fields/array-field-editor';
import { 
  ObjectFieldEditor,
  ObjectFieldEditorProvider 
} from '@/lib/studio/fields/object-field-editor';

export interface FieldRendererProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

// Map field types to their editors
const FIELD_EDITORS: Partial<Record<FieldType, React.ComponentType<any>>> = {
  text: TextFieldEditor,
  textarea: TextFieldEditor, // TextFieldEditor handles multiline
  number: NumberFieldEditor,
  select: SelectFieldEditor,
  toggle: ToggleFieldEditor,
  checkbox: ToggleFieldEditor,
  color: ColorFieldEditor,
  image: ImageFieldEditor,
  link: LinkFieldEditor,
  spacing: SpacingFieldEditor,
  typography: TypographyFieldEditor,
  array: ArrayFieldEditor,
  object: ObjectFieldEditor,
};

// Inner field renderer (used by array/object for recursion)
function InnerFieldRenderer({ field, value, onChange, disabled }: FieldRendererProps) {
  const Editor = FIELD_EDITORS[field.type];
  
  if (!Editor) {
    return (
      <div className="p-2 border rounded bg-muted text-xs text-muted-foreground">
        Unknown field type: {field.type}
      </div>
    );
  }
  
  // Pass appropriate props based on field type
  const commonProps = {
    value,
    onChange,
    label: field.label,
    description: field.description,
    disabled: disabled || false,
    required: field.required,
  };
  
  switch (field.type) {
    case 'textarea':
      return <Editor {...commonProps} multiline rows={field.rows || 3} />;
      
    case 'number':
      return (
        <Editor 
          {...commonProps} 
          min={field.min} 
          max={field.max} 
          step={field.step} 
        />
      );
      
    case 'select':
    case 'radio':
      return <Editor {...commonProps} options={field.options || []} />;
      
    case 'image':
      return <Editor {...commonProps} accepts={field.accepts} />;
      
    case 'array':
      return (
        <Editor 
          {...commonProps} 
          itemFields={field.itemFields || {}} 
          itemLabel={field.label?.replace(/s$/, '') || 'Item'}
          minItems={field.min}
          maxItems={field.max}
        />
      );
      
    case 'object':
      return <Editor {...commonProps} fields={field.fields || {}} />;
      
    default:
      return <Editor {...commonProps} />;
  }
}

// Main field renderer with provider for nested fields
export function FieldRenderer(props: FieldRendererProps) {
  // Wrap with providers for array/object fields
  return (
    <ArrayFieldEditorProvider fieldRenderer={InnerFieldRenderer}>
      <ObjectFieldEditorProvider fieldRenderer={InnerFieldRenderer}>
        <InnerFieldRenderer {...props} />
      </ObjectFieldEditorProvider>
    </ArrayFieldEditorProvider>
  );
}

// Export for external use
export { FIELD_EDITORS };
export default FieldRenderer;
```

**Code to add to `src/lib/studio/registry/field-registry.ts`:**

```typescript
// src/lib/studio/registry/field-registry.ts
// Add these field type definitions

import type { FieldType, FieldDefinition } from '@/types/studio';

// Field type metadata for UI
export interface FieldTypeMeta {
  type: FieldType;
  label: string;
  description: string;
  icon: string;
  supportsResponsive: boolean;
}

// Registry of all field types
export const FIELD_TYPE_REGISTRY: Record<FieldType, FieldTypeMeta> = {
  text: {
    type: 'text',
    label: 'Text',
    description: 'Single line text input',
    icon: 'type',
    supportsResponsive: false,
  },
  textarea: {
    type: 'textarea',
    label: 'Text Area',
    description: 'Multi-line text input',
    icon: 'align-left',
    supportsResponsive: false,
  },
  number: {
    type: 'number',
    label: 'Number',
    description: 'Numeric input with optional min/max',
    icon: 'hash',
    supportsResponsive: true,
  },
  select: {
    type: 'select',
    label: 'Select',
    description: 'Dropdown selection',
    icon: 'chevron-down',
    supportsResponsive: false,
  },
  radio: {
    type: 'radio',
    label: 'Radio',
    description: 'Radio button selection',
    icon: 'circle-dot',
    supportsResponsive: false,
  },
  checkbox: {
    type: 'checkbox',
    label: 'Checkbox',
    description: 'Boolean checkbox',
    icon: 'check-square',
    supportsResponsive: false,
  },
  toggle: {
    type: 'toggle',
    label: 'Toggle',
    description: 'Boolean switch',
    icon: 'toggle-right',
    supportsResponsive: false,
  },
  color: {
    type: 'color',
    label: 'Color',
    description: 'Color picker with presets',
    icon: 'palette',
    supportsResponsive: false,
  },
  image: {
    type: 'image',
    label: 'Image',
    description: 'Image upload or URL',
    icon: 'image',
    supportsResponsive: false,
  },
  link: {
    type: 'link',
    label: 'Link',
    description: 'URL or page link',
    icon: 'link',
    supportsResponsive: false,
  },
  spacing: {
    type: 'spacing',
    label: 'Spacing',
    description: 'Visual margin/padding editor',
    icon: 'square',
    supportsResponsive: true,
  },
  typography: {
    type: 'typography',
    label: 'Typography',
    description: 'Font and text settings',
    icon: 'type',
    supportsResponsive: true,
  },
  array: {
    type: 'array',
    label: 'Array',
    description: 'List of items',
    icon: 'list',
    supportsResponsive: false,
  },
  object: {
    type: 'object',
    label: 'Object',
    description: 'Nested object fields',
    icon: 'braces',
    supportsResponsive: false,
  },
  richtext: {
    type: 'richtext',
    label: 'Rich Text',
    description: 'Rich text editor (TipTap)',
    icon: 'file-text',
    supportsResponsive: false,
  },
  code: {
    type: 'code',
    label: 'Code',
    description: 'Code editor input',
    icon: 'code',
    supportsResponsive: false,
  },
  custom: {
    type: 'custom',
    label: 'Custom',
    description: 'Custom field renderer',
    icon: 'puzzle',
    supportsResponsive: false,
  },
};

// Helper to check if field supports responsive mode
export function fieldSupportsResponsive(type: FieldType): boolean {
  return FIELD_TYPE_REGISTRY[type]?.supportsResponsive ?? false;
}

// Create field definition helper
export function createField<T extends FieldType>(
  type: T,
  label: string,
  options?: Partial<FieldDefinition>
): FieldDefinition {
  return {
    type,
    label,
    ...options,
  };
}

// Commonly used field presets
export const FieldPresets = {
  // Text presets
  title: () => createField('text', 'Title', { required: true }),
  subtitle: () => createField('text', 'Subtitle'),
  description: () => createField('textarea', 'Description', { rows: 3 }),
  
  // Visual presets
  backgroundColor: () => createField('color', 'Background Color', { 
    defaultValue: 'transparent' 
  }),
  textColor: () => createField('color', 'Text Color', { 
    defaultValue: 'inherit' 
  }),
  
  // Spacing presets
  padding: () => createField('spacing', 'Padding', { 
    responsive: true,
    defaultValue: { top: '16px', right: '16px', bottom: '16px', left: '16px' },
  }),
  margin: () => createField('spacing', 'Margin', { 
    responsive: true,
    defaultValue: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
  }),
  
  // Typography preset
  typography: () => createField('typography', 'Typography', { 
    responsive: true 
  }),
  
  // Link preset
  link: () => createField('link', 'Link', {
    defaultValue: { href: '', target: '_self', type: 'url' },
  }),
  
  // Image preset
  image: () => createField('image', 'Image', {
    defaultValue: { url: '', alt: '' },
  }),
};

export default FIELD_TYPE_REGISTRY;
```

**Acceptance Criteria:**
- [ ] All field types registered
- [ ] FieldRenderer renders correct editor per type
- [ ] Nested array/object fields work recursively
- [ ] Unknown field types show error message
- [ ] Field presets simplify component definitions

---

### Task 10: Create Field Editor Index Export

**Description:** Create index file to export all field editors.

**Files:**
- CREATE: `src/lib/studio/fields/index.ts`

**Code:**

```typescript
// src/lib/studio/fields/index.ts
'use client';

// Field utilities
export * from './field-utils';

// Basic field editors (Wave 2)
export { TextFieldEditor, default as TextFieldEditorDefault } from './text-field-editor';
export { NumberFieldEditor, default as NumberFieldEditorDefault } from './number-field-editor';
export { SelectFieldEditor, default as SelectFieldEditorDefault } from './select-field-editor';
export { ToggleFieldEditor, default as ToggleFieldEditorDefault } from './toggle-field-editor';

// Advanced field editors (Wave 3)
export { ColorFieldEditor, default as ColorFieldEditorDefault } from './color-field-editor';
export { ImageFieldEditor, default as ImageFieldEditorDefault } from './image-field-editor';
export { LinkFieldEditor, default as LinkFieldEditorDefault } from './link-field-editor';
export { SpacingFieldEditor, default as SpacingFieldEditorDefault } from './spacing-field-editor';
export { TypographyFieldEditor, default as TypographyFieldEditorDefault } from './typography-field-editor';
export { 
  ArrayFieldEditor, 
  ArrayFieldEditorProvider,
  default as ArrayFieldEditorDefault 
} from './array-field-editor';
export { 
  ObjectFieldEditor, 
  ObjectFieldEditorProvider,
  default as ObjectFieldEditorDefault 
} from './object-field-editor';
```

**Acceptance Criteria:**
- [ ] All exports work without circular dependencies
- [ ] Can import individual or all fields

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| CREATE | `src/lib/studio/fields/field-utils.ts` | Shared utilities for fields |
| MODIFY | `src/types/studio.ts` | Add field value types |
| CREATE | `src/lib/studio/fields/color-field-editor.tsx` | Color picker field |
| CREATE | `src/lib/studio/fields/image-field-editor.tsx` | Image upload/URL field |
| CREATE | `src/lib/studio/fields/link-field-editor.tsx` | Link picker field |
| CREATE | `src/lib/studio/fields/spacing-field-editor.tsx` | Visual spacing field |
| CREATE | `src/lib/studio/fields/typography-field-editor.tsx` | Typography controls |
| CREATE | `src/lib/studio/fields/array-field-editor.tsx` | Array/list field |
| CREATE | `src/lib/studio/fields/object-field-editor.tsx` | Nested object field |
| CREATE | `src/components/studio/fields/field-renderer.tsx` | Master field renderer |
| MODIFY | `src/lib/studio/registry/field-registry.ts` | Register all field types |
| CREATE | `src/lib/studio/fields/index.ts` | Export all fields |

---

## Testing Requirements

### Unit Tests
- [ ] `field-utils.ts` - CSS parsing, color validation
- [ ] Each field editor handles empty/null values
- [ ] Each field editor calls onChange correctly

### Integration Tests
- [ ] FieldRenderer renders all field types
- [ ] Array field recursively renders child fields
- [ ] Object field recursively renders nested fields

### Manual Testing
- [ ] Open properties panel with each component type
- [ ] Test color picker (pick, presets, recent)
- [ ] Test image field (URL, upload, clear)
- [ ] Test link field (page, URL, email, phone)
- [ ] Test spacing field (all sides, linked mode)
- [ ] Test typography field (all controls)
- [ ] Test array field (add, edit, remove, reorder)
- [ ] Test object field (nested editing)

---

## Dependencies to Install

```bash
# No new dependencies required - all packages installed in Wave 1
# react-colorful, @radix-ui/*, etc. already available
```

---

## Environment Variables

```env
# No new environment variables needed
```

---

## Database Changes

```sql
-- No database changes needed
```

---

## Rollback Plan

1. Delete all new files in `src/lib/studio/fields/`
2. Revert changes to `src/types/studio.ts`
3. Revert changes to `src/lib/studio/registry/field-registry.ts`
4. Properties panel falls back to basic text inputs

---

## Success Criteria

- [ ] All 7 advanced field types implemented and functional
- [ ] Color picker shows visual picker with presets
- [ ] Image field shows preview and supports upload
- [ ] Link field has page picker with site pages
- [ ] Spacing field shows visual box model
- [ ] Typography field has all controls with preview
- [ ] Array field supports add/remove/reorder
- [ ] Object field renders nested fields
- [ ] FieldRenderer correctly routes to each editor
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] All fields are keyboard accessible
- [ ] Recent colors persist across sessions
