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
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
