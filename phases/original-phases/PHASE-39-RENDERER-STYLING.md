# Phase 39: Site Renderer - Styling

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-37-RENDERER-FOUNDATION.md` and `PHASE-38-RENDERER-COMPONENTS.md`

---

## 🎯 Objective

Implement custom CSS injection, Google Fonts loading, and theming system for published sites.

---

## 📋 Prerequisites

- [ ] Phase 37-38 completed
- [ ] Site settings structure defined
- [ ] Understanding of CSS injection

---

## ✅ Tasks

### Task 39.1: Site Renderer Wrapper

**File: `src/components/renderer/site-renderer.tsx`**

```typescript
import { SiteData, PageData } from "@/lib/renderer/site-data";
import { renderCraftJSON } from "./node-renderer";
import { SiteStyles } from "./site-styles";
import { SiteHead } from "./site-head";

interface SiteRendererProps {
  site: SiteData;
  page: PageData;
}

export function SiteRenderer({ site, page }: SiteRendererProps) {
  const content = renderCraftJSON(page.content);

  return (
    <>
      <SiteHead site={site} />
      <SiteStyles site={site} />
      
      <div className="site-content" data-site-id={site.id} data-page-id={page.id}>
        {content}
      </div>
    </>
  );
}
```

### Task 39.2: Site Head Component

**File: `src/components/renderer/site-head.tsx`**

```typescript
import Script from "next/script";
import { SiteData } from "@/lib/renderer/site-data";

interface SiteHeadProps {
  site: SiteData;
}

export function SiteHead({ site }: SiteHeadProps) {
  const { settings } = site;
  const fonts = settings.fonts || [];

  // Build Google Fonts URL
  const googleFontsUrl = fonts.length > 0
    ? `https://fonts.googleapis.com/css2?${fonts
        .map((font) => `family=${encodeURIComponent(font)}:wght@400;500;600;700`)
        .join("&")}&display=swap`
    : null;

  return (
    <>
      {/* Google Fonts */}
      {googleFontsUrl && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href={googleFontsUrl} rel="stylesheet" />
        </>
      )}

      {/* Custom Head HTML */}
      {settings.customHead && (
        <Script
          id="custom-head"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: settings.customHead,
          }}
        />
      )}
    </>
  );
}
```

### Task 39.3: Site Styles Component

**File: `src/components/renderer/site-styles.tsx`**

```typescript
import { SiteData } from "@/lib/renderer/site-data";
import { generateThemeCSS } from "@/lib/renderer/theme";

interface SiteStylesProps {
  site: SiteData;
}

export function SiteStyles({ site }: SiteStylesProps) {
  const { settings } = site;
  const themeCSS = generateThemeCSS(settings.theme || {});
  
  // Combine theme CSS with custom CSS
  const combinedCSS = `
/* Theme Variables */
${themeCSS}

/* Base Styles */
.site-content {
  min-height: 100vh;
  font-family: var(--font-family, system-ui, sans-serif);
}

/* Custom CSS */
${settings.customCss || ""}
  `.trim();

  return (
    <style dangerouslySetInnerHTML={{ __html: combinedCSS }} />
  );
}
```

### Task 39.4: Theme Generator

**File: `src/lib/renderer/theme.ts`**

```typescript
export interface ThemeSettings {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  fontFamily?: string;
  headingFontFamily?: string;
  borderRadius?: string;
  spacing?: string;
}

const DEFAULT_THEME: Required<ThemeSettings> = {
  primaryColor: "#3b82f6",
  secondaryColor: "#64748b",
  accentColor: "#f59e0b",
  backgroundColor: "#ffffff",
  foregroundColor: "#0f172a",
  fontFamily: "system-ui, -apple-system, sans-serif",
  headingFontFamily: "inherit",
  borderRadius: "0.5rem",
  spacing: "1rem",
};

export function generateThemeCSS(theme: ThemeSettings): string {
  const merged = { ...DEFAULT_THEME, ...theme };

  // Generate HSL values for color manipulation
  const primaryHSL = hexToHSL(merged.primaryColor);
  const secondaryHSL = hexToHSL(merged.secondaryColor);

  return `
:root {
  /* Colors */
  --primary: ${merged.primaryColor};
  --primary-foreground: ${getContrastColor(merged.primaryColor)};
  --secondary: ${merged.secondaryColor};
  --secondary-foreground: ${getContrastColor(merged.secondaryColor)};
  --accent: ${merged.accentColor};
  --accent-foreground: ${getContrastColor(merged.accentColor)};
  --background: ${merged.backgroundColor};
  --foreground: ${merged.foregroundColor};
  
  /* Muted colors */
  --muted: ${adjustLightness(merged.secondaryColor, 85)};
  --muted-foreground: ${adjustLightness(merged.foregroundColor, 40)};
  
  /* Card colors */
  --card: ${merged.backgroundColor};
  --card-foreground: ${merged.foregroundColor};
  
  /* Border and input */
  --border: ${adjustLightness(merged.secondaryColor, 80)};
  --input: ${adjustLightness(merged.secondaryColor, 80)};
  --ring: ${merged.primaryColor};
  
  /* Typography */
  --font-family: ${merged.fontFamily};
  --heading-font-family: ${merged.headingFontFamily};
  
  /* Spacing */
  --radius: ${merged.borderRadius};
  --spacing: ${merged.spacing};
}

/* Dark mode support (optional) */
@media (prefers-color-scheme: dark) {
  :root.auto-dark {
    --background: ${adjustLightness(merged.backgroundColor, 10)};
    --foreground: ${adjustLightness(merged.foregroundColor, 90)};
    --card: ${adjustLightness(merged.backgroundColor, 15)};
    --card-foreground: ${adjustLightness(merged.foregroundColor, 90)};
    --muted: ${adjustLightness(merged.secondaryColor, 20)};
    --muted-foreground: ${adjustLightness(merged.foregroundColor, 60)};
    --border: ${adjustLightness(merged.secondaryColor, 25)};
  }
}

/* Typography base */
body {
  font-family: var(--font-family);
  background: var(--background);
  color: var(--foreground);
  line-height: 1.6;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--heading-font-family);
  font-weight: 600;
  line-height: 1.2;
}
  `.trim();
}

// Color utility functions
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 50 };

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function adjustLightness(hex: string, newLightness: number): string {
  const { h, s } = hexToHSL(hex);
  return hslToHex(h, s, newLightness);
}

function getContrastColor(hex: string): string {
  const { l } = hexToHSL(hex);
  return l > 50 ? "#000000" : "#ffffff";
}

export { hexToHSL, hslToHex, adjustLightness, getContrastColor };
```

### Task 39.5: Font Loader Service

**File: `src/lib/renderer/fonts.ts`**

```typescript
export interface FontConfig {
  family: string;
  weights?: number[];
  styles?: ("normal" | "italic")[];
  display?: "auto" | "block" | "swap" | "fallback" | "optional";
}

const POPULAR_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Raleway",
  "Nunito",
  "Playfair Display",
  "Merriweather",
  "Source Sans Pro",
  "Ubuntu",
  "Oswald",
  "Rubik",
  "Work Sans",
];

export function buildGoogleFontsURL(fonts: FontConfig[]): string {
  if (fonts.length === 0) return "";

  const families = fonts.map((font) => {
    const weights = font.weights || [400, 500, 600, 700];
    const styles = font.styles || ["normal"];

    // Build axis string for variable fonts
    const axes: string[] = [];

    if (styles.includes("italic")) {
      axes.push(`ital,wght@${weights.map((w) => `0,${w};1,${w}`).join(";")}`);
    } else {
      axes.push(`wght@${weights.join(";")}`);
    }

    return `family=${encodeURIComponent(font.family)}:${axes.join("&")}`;
  });

  const display = fonts[0]?.display || "swap";

  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=${display}`;
}

export function getPopularFonts(): string[] {
  return POPULAR_FONTS;
}

export function getFontFamilyCSS(fontName: string, fallback = "sans-serif"): string {
  return `"${fontName}", ${fallback}`;
}

// Preload critical fonts
export function generateFontPreloadLinks(fonts: FontConfig[]): string {
  if (fonts.length === 0) return "";

  return `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${buildGoogleFontsURL(fonts)}" rel="stylesheet">
  `.trim();
}
```

### Task 39.6: CSS Sanitizer

**File: `src/lib/renderer/css-sanitizer.ts`**

```typescript
// Sanitize custom CSS to prevent XSS and dangerous properties
export function sanitizeCSS(css: string): string {
  if (!css) return "";

  // Remove any script tags or javascript
  let sanitized = css
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/behavior\s*:/gi, "")
    .replace(/-moz-binding/gi, "");

  // Remove @import to prevent loading external resources
  sanitized = sanitized.replace(/@import\s+[^;]+;/gi, "");

  // Remove url() with external resources (keep data: and relative paths)
  sanitized = sanitized.replace(
    /url\s*\(\s*['"]?(?!data:|\/|\.)/gi,
    "url(blocked-"
  );

  return sanitized;
}

// Validate CSS syntax
export function validateCSS(css: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for balanced braces
  let braceCount = 0;
  for (const char of css) {
    if (char === "{") braceCount++;
    if (char === "}") braceCount--;
    if (braceCount < 0) {
      errors.push("Unbalanced braces: extra closing brace");
      break;
    }
  }
  if (braceCount > 0) {
    errors.push(`Unbalanced braces: ${braceCount} unclosed brace(s)`);
  }

  // Check for dangerous patterns
  if (/expression\s*\(/i.test(css)) {
    errors.push("CSS expressions are not allowed");
  }
  if (/@import/i.test(css)) {
    errors.push("@import is not allowed");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### Task 39.7: Responsive Utilities

**File: `src/lib/renderer/responsive.ts`**

```typescript
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

export interface ResponsiveValue<T> {
  default: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  "2xl"?: T;
}

export function generateResponsiveCSS<T extends string | number>(
  property: string,
  values: ResponsiveValue<T>,
  selector: string = ""
): string {
  const css: string[] = [];
  const selectorPrefix = selector ? `${selector} ` : "";

  // Default value
  css.push(`${selectorPrefix}{ ${property}: ${values.default}; }`);

  // Responsive values
  const breakpointOrder: Breakpoint[] = ["sm", "md", "lg", "xl", "2xl"];
  
  for (const bp of breakpointOrder) {
    const value = values[bp];
    if (value !== undefined) {
      css.push(`
@media (min-width: ${BREAKPOINTS[bp]}px) {
  ${selectorPrefix}{ ${property}: ${value}; }
}
      `.trim());
    }
  }

  return css.join("\n");
}

// Generate container queries CSS
export function generateContainerCSS(): string {
  return `
/* Container query support */
.container-sm { container-type: inline-size; }
.container-md { container-type: inline-size; }
.container-lg { container-type: inline-size; }

@container (min-width: ${BREAKPOINTS.sm}px) {
  .cq-sm\\:hidden { display: none; }
  .cq-sm\\:block { display: block; }
}

@container (min-width: ${BREAKPOINTS.md}px) {
  .cq-md\\:hidden { display: none; }
  .cq-md\\:block { display: block; }
}

@container (min-width: ${BREAKPOINTS.lg}px) {
  .cq-lg\\:hidden { display: none; }
  .cq-lg\\:block { display: block; }
}
  `.trim();
}
```

### Task 39.8: Site Theme Settings UI

**File: `src/components/editor/theme-settings.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ThemeSettings } from "@/lib/renderer/theme";
import { getPopularFonts } from "@/lib/renderer/fonts";

interface ThemeSettingsEditorProps {
  theme: ThemeSettings;
  customCSS: string;
  fonts: string[];
  onChange: (update: {
    theme?: ThemeSettings;
    customCSS?: string;
    fonts?: string[];
  }) => void;
}

export function ThemeSettingsEditor({
  theme,
  customCSS,
  fonts,
  onChange,
}: ThemeSettingsEditorProps) {
  const popularFonts = getPopularFonts();

  const updateTheme = (key: keyof ThemeSettings, value: string) => {
    onChange({ theme: { ...theme, [key]: value } });
  };

  const addFont = (font: string) => {
    if (!fonts.includes(font)) {
      onChange({ fonts: [...fonts, font] });
    }
  };

  const removeFont = (font: string) => {
    onChange({ fonts: fonts.filter((f) => f !== font) });
  };

  return (
    <div className="space-y-6">
      {/* Colors */}
      <div>
        <h3 className="font-semibold mb-4">Colors</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Primary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={theme.primaryColor || "#3b82f6"}
                onChange={(e) => updateTheme("primaryColor", e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                type="text"
                value={theme.primaryColor || "#3b82f6"}
                onChange={(e) => updateTheme("primaryColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={theme.secondaryColor || "#64748b"}
                onChange={(e) => updateTheme("secondaryColor", e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                type="text"
                value={theme.secondaryColor || "#64748b"}
                onChange={(e) => updateTheme("secondaryColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Background Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={theme.backgroundColor || "#ffffff"}
                onChange={(e) => updateTheme("backgroundColor", e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                type="text"
                value={theme.backgroundColor || "#ffffff"}
                onChange={(e) => updateTheme("backgroundColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Text Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={theme.foregroundColor || "#0f172a"}
                onChange={(e) => updateTheme("foregroundColor", e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                type="text"
                value={theme.foregroundColor || "#0f172a"}
                onChange={(e) => updateTheme("foregroundColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div>
        <h3 className="font-semibold mb-4">Typography</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Body Font</Label>
            <Select
              value={fonts[0] || ""}
              onValueChange={(value) => {
                const newFonts = [...fonts];
                newFonts[0] = value;
                onChange({ fonts: newFonts, theme: { ...theme, fontFamily: `"${value}", sans-serif` } });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {popularFonts.map((font) => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Heading Font</Label>
            <Select
              value={fonts[1] || fonts[0] || ""}
              onValueChange={(value) => {
                const newFonts = [...fonts];
                if (newFonts.length < 2) newFonts.push(value);
                else newFonts[1] = value;
                onChange({ fonts: newFonts, theme: { ...theme, headingFontFamily: `"${value}", sans-serif` } });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Same as body" />
              </SelectTrigger>
              <SelectContent>
                {popularFonts.map((font) => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Border Radius */}
      <div>
        <h3 className="font-semibold mb-4">Styling</h3>
        <div className="space-y-2">
          <Label>Border Radius</Label>
          <Select
            value={theme.borderRadius || "0.5rem"}
            onValueChange={(value) => updateTheme("borderRadius", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">None</SelectItem>
              <SelectItem value="0.25rem">Small</SelectItem>
              <SelectItem value="0.5rem">Medium</SelectItem>
              <SelectItem value="0.75rem">Large</SelectItem>
              <SelectItem value="1rem">Extra Large</SelectItem>
              <SelectItem value="9999px">Full</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom CSS */}
      <div>
        <h3 className="font-semibold mb-4">Custom CSS</h3>
        <Textarea
          value={customCSS}
          onChange={(e) => onChange({ customCSS: e.target.value })}
          placeholder=".my-class { color: red; }"
          className="font-mono text-sm"
          rows={8}
        />
        <p className="text-xs text-muted-foreground mt-2">
          Add custom CSS to style your site. Changes apply to all pages.
        </p>
      </div>
    </div>
  );
}
```

---

## 📐 Acceptance Criteria

- [ ] Theme CSS generates correctly
- [ ] Google Fonts load properly
- [ ] Custom CSS injects and sanitizes
- [ ] Color utilities work (HSL conversion)
- [ ] Responsive utilities generate CSS
- [ ] Theme settings UI functional
- [ ] Dark mode support (optional)

---

## 📁 Files Created This Phase

```
src/components/renderer/
├── site-renderer.tsx
├── site-head.tsx
└── site-styles.tsx

src/lib/renderer/
├── theme.ts
├── fonts.ts
├── css-sanitizer.ts
└── responsive.ts

src/components/editor/
└── theme-settings.tsx
```

---

## ➡️ Next Phase

**Phase 40: Site Renderer - Publishing** - Publish flow, domain verification, and SSL setup.
