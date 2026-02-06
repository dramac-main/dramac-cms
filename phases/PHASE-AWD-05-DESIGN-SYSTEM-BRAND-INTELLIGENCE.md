# Phase AWD-05: Design System & Brand Intelligence

> **Priority**: 🟡 HIGH
> **Estimated Time**: 8-10 hours
> **Prerequisites**: AWD-02 Complete
> **Status**: 📋 READY TO IMPLEMENT

---

## ⚠️ BEFORE YOU BEGIN

**REQUIRED READING**: Before implementing this phase, you MUST read:

1. **[PHASE-AWD-CONTEXT.md](./PHASE-AWD-CONTEXT.md)** - Tech stack, database schema (especially site_branding table)
2. **AWD-02**: Understand how branding data is fetched

**This phase DEPENDS ON AWD-02** - it uses branding data to generate design systems.

---

## 📁 Files To Create

| File | Purpose |
|------|--------|
| `next-platform-dashboard/src/lib/ai/website-designer/design/types.ts` | Design system types |
| `next-platform-dashboard/src/lib/ai/website-designer/design/color-intelligence.ts` | Color extraction and palette generation |
| `next-platform-dashboard/src/lib/ai/website-designer/design/typography-intelligence.ts` | Font pairing and type scale |
| `next-platform-dashboard/src/lib/ai/website-designer/design/spacing-system.ts` | Spacing scale generation |
| `next-platform-dashboard/src/lib/ai/website-designer/design/generator.ts` | Main DesignSystemGenerator class |
| `next-platform-dashboard/src/lib/ai/website-designer/design/index.ts` | Public exports |

---

## 🗄️ Database Reference (from PHASE-AWD-CONTEXT.md)

```sql
-- site_branding table fields used by this phase
CREATE TABLE site_branding (
  site_id UUID,
  logo_url TEXT,           -- Extract colors from this
  primary_color TEXT,      -- Use as base for palette
  secondary_color TEXT,
  accent_color TEXT,
  font_heading TEXT,       -- Use or enhance
  font_body TEXT
);
```

---

## 🎯 Objective

Build an intelligent **Design System Engine** that:
1. Extracts brand identity from existing assets (logo, colors)
2. Generates cohesive design tokens
3. Applies consistent styling across all components
4. Ensures professional, award-winning visual design

**Principle:** Every website looks custom-designed, not template-based

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    DESIGN SYSTEM ENGINE                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────┐    ┌──────────────────┐                     │
│  │   BRAND ASSETS   │    │   USER PROMPT    │                     │
│  │   (Logo, Colors) │    │   (Style hints)  │                     │
│  └────────┬─────────┘    └────────┬─────────┘                     │
│           │                        │                               │
│           ▼                        ▼                               │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                  COLOR INTELLIGENCE                         │   │
│  │  • Extract colors from logo (if provided)                   │   │
│  │  • Generate complementary palette                           │   │
│  │  • Create color variations (light/dark modes)               │   │
│  │  • Ensure accessibility (WCAG contrast)                     │   │
│  └────────────────────────────────────────────────────────────┘   │
│                              │                                     │
│                              ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                  TYPOGRAPHY INTELLIGENCE                    │   │
│  │  • Select font pairing based on industry/tone               │   │
│  │  • Define type scale                                        │   │
│  │  • Set font weights and styles                              │   │
│  │  • Configure responsive typography                          │   │
│  └────────────────────────────────────────────────────────────┘   │
│                              │                                     │
│                              ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                  SPACING & LAYOUT SYSTEM                    │   │
│  │  • Define spacing scale                                     │   │
│  │  • Set max-widths and containers                            │   │
│  │  • Configure grid system                                    │   │
│  │  • Define section padding                                   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                              │                                     │
│                              ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                  STYLE TOKENS GENERATOR                     │   │
│  │  • Border radius scale                                      │   │
│  │  • Shadow styles                                            │   │
│  │  • Animation presets                                        │   │
│  │  • Transition timings                                       │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Core Types

```typescript
// src/lib/ai/website-designer/design-system/types.ts

export interface DesignSystem {
  colors: ColorSystem;
  typography: TypographySystem;
  spacing: SpacingSystem;
  borders: BorderSystem;
  shadows: ShadowSystem;
  animations: AnimationSystem;
  breakpoints: BreakpointSystem;
}

export interface ColorSystem {
  // Primary palette
  primary: ColorScale;
  secondary: ColorScale;
  accent: ColorScale;
  
  // Neutrals
  neutral: ColorScale;
  
  // Semantic colors
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  info: ColorScale;
  
  // Background colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
    link: string;
    linkHover: string;
  };
  
  // Border colors
  border: {
    default: string;
    subtle: string;
    strong: string;
  };
}

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;  // Primary shade
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface TypographySystem {
  // Font families
  fontFamily: {
    heading: string;
    body: string;
    mono: string;
  };
  
  // Font sizes
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    "2xl": string;
    "3xl": string;
    "4xl": string;
    "5xl": string;
    "6xl": string;
  };
  
  // Font weights
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
  };
  
  // Line heights
  lineHeight: {
    none: number;
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
  
  // Letter spacing
  letterSpacing: {
    tighter: string;
    tight: string;
    normal: string;
    wide: string;
    wider: string;
  };
}

export interface SpacingSystem {
  // Spacing scale (rem values)
  scale: {
    0: string;
    px: string;
    0.5: string;
    1: string;
    1.5: string;
    2: string;
    2.5: string;
    3: string;
    3.5: string;
    4: string;
    5: string;
    6: string;
    7: string;
    8: string;
    9: string;
    10: string;
    11: string;
    12: string;
    14: string;
    16: string;
    20: string;
    24: string;
    28: string;
    32: string;
    36: string;
    40: string;
    44: string;
    48: string;
    52: string;
    56: string;
    60: string;
    64: string;
    72: string;
    80: string;
    96: string;
  };
  
  // Section spacing
  section: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  // Container max-widths
  container: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
    full: string;
  };
}

export interface BorderSystem {
  // Border radius
  radius: {
    none: string;
    sm: string;
    DEFAULT: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
    "3xl": string;
    full: string;
  };
  
  // Border widths
  width: {
    0: string;
    DEFAULT: string;
    2: string;
    4: string;
    8: string;
  };
}

export interface ShadowSystem {
  shadows: {
    none: string;
    sm: string;
    DEFAULT: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
    inner: string;
  };
  
  // Colored shadows for glow effects
  colored: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface AnimationSystem {
  // Durations
  duration: {
    instant: string;
    fast: string;
    normal: string;
    slow: string;
    slower: string;
  };
  
  // Easings
  easing: {
    linear: string;
    ease: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    bounce: string;
    spring: string;
  };
  
  // Animation presets
  presets: {
    fadeIn: AnimationPreset;
    fadeUp: AnimationPreset;
    fadeDown: AnimationPreset;
    scaleIn: AnimationPreset;
    slideLeft: AnimationPreset;
    slideRight: AnimationPreset;
    bounce: AnimationPreset;
    pulse: AnimationPreset;
  };
}

export interface AnimationPreset {
  keyframes: Record<string, Record<string, string>>;
  duration: string;
  easing: string;
}
```

---

## 🎨 Color Intelligence

```typescript
// src/lib/ai/website-designer/design-system/color-intelligence.ts

import ColorThief from "colorthief";
import chroma from "chroma-js";

export interface ExtractedColors {
  dominant: string;
  palette: string[];
}

export async function extractColorsFromLogo(logoUrl: string): Promise<ExtractedColors | null> {
  try {
    const colorThief = new ColorThief();
    
    // Load image
    const img = new Image();
    img.crossOrigin = "Anonymous";
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        const dominant = colorThief.getColor(img);
        const palette = colorThief.getPalette(img, 5);
        
        resolve({
          dominant: `rgb(${dominant.join(",")})`,
          palette: palette.map((c: number[]) => `rgb(${c.join(",")})`),
        });
      };
      img.onerror = () => resolve(null);
      img.src = logoUrl;
    });
  } catch {
    return null;
  }
}

export function generateColorScale(baseColor: string): ColorScale {
  const base = chroma(baseColor);
  
  return {
    50: base.brighten(2.5).hex(),
    100: base.brighten(2).hex(),
    200: base.brighten(1.5).hex(),
    300: base.brighten(1).hex(),
    400: base.brighten(0.5).hex(),
    500: base.hex(),
    600: base.darken(0.5).hex(),
    700: base.darken(1).hex(),
    800: base.darken(1.5).hex(),
    900: base.darken(2).hex(),
    950: base.darken(2.5).hex(),
  };
}

export function generateComplementaryColor(baseColor: string): string {
  return chroma(baseColor).set("hsl.h", "+180").hex();
}

export function generateAnalogousColors(baseColor: string): string[] {
  const base = chroma(baseColor);
  return [
    base.set("hsl.h", "-30").hex(),
    base.hex(),
    base.set("hsl.h", "+30").hex(),
  ];
}

export function generateTriadicColors(baseColor: string): string[] {
  const base = chroma(baseColor);
  return [
    base.hex(),
    base.set("hsl.h", "+120").hex(),
    base.set("hsl.h", "+240").hex(),
  ];
}

export function ensureAccessibleContrast(
  foreground: string,
  background: string,
  minRatio: number = 4.5
): string {
  let fg = chroma(foreground);
  const bg = chroma(background);
  let contrast = chroma.contrast(fg, bg);
  
  // Lighten or darken foreground until contrast is met
  let attempts = 0;
  while (contrast < minRatio && attempts < 20) {
    if (bg.luminance() > 0.5) {
      fg = fg.darken(0.2);
    } else {
      fg = fg.brighten(0.2);
    }
    contrast = chroma.contrast(fg, bg);
    attempts++;
  }
  
  return fg.hex();
}

export function generateSemanticColors(primaryColor: string): {
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  info: ColorScale;
} {
  // Use standard semantic colors that harmonize with primary
  return {
    success: generateColorScale("#10b981"),  // Green
    warning: generateColorScale("#f59e0b"),  // Amber
    error: generateColorScale("#ef4444"),    // Red
    info: generateColorScale("#3b82f6"),     // Blue
  };
}

export function generateColorSystem(
  primaryColor: string,
  secondaryColor?: string,
  accentColor?: string
): ColorSystem {
  const primary = generateColorScale(primaryColor);
  const secondary = secondaryColor 
    ? generateColorScale(secondaryColor)
    : generateColorScale(generateComplementaryColor(primaryColor));
  const accent = accentColor
    ? generateColorScale(accentColor)
    : generateColorScale(chroma(primaryColor).set("hsl.h", "+60").hex());
  
  const semanticColors = generateSemanticColors(primaryColor);
  
  return {
    primary,
    secondary,
    accent,
    neutral: generateColorScale("#6b7280"),
    ...semanticColors,
    background: {
      primary: "#ffffff",
      secondary: "#f9fafb",
      tertiary: "#f3f4f6",
      inverse: "#111827",
    },
    text: {
      primary: ensureAccessibleContrast("#111827", "#ffffff"),
      secondary: ensureAccessibleContrast("#4b5563", "#ffffff"),
      muted: ensureAccessibleContrast("#9ca3af", "#ffffff"),
      inverse: "#ffffff",
      link: primary[600],
      linkHover: primary[700],
    },
    border: {
      default: "#e5e7eb",
      subtle: "#f3f4f6",
      strong: "#d1d5db",
    },
  };
}
```

---

## ✏️ Typography Intelligence

```typescript
// src/lib/ai/website-designer/design-system/typography-intelligence.ts

export interface FontPairing {
  heading: string;
  body: string;
  mono: string;
  description: string;
  industries: string[];
  tone: string[];
}

export const fontPairings: FontPairing[] = [
  {
    heading: "Inter",
    body: "Inter",
    mono: "JetBrains Mono",
    description: "Clean and modern, great for tech and SaaS",
    industries: ["saas", "tech", "startup", "fintech"],
    tone: ["modern", "clean", "professional"],
  },
  {
    heading: "Playfair Display",
    body: "Lato",
    mono: "Fira Code",
    description: "Elegant and sophisticated, great for luxury and creative",
    industries: ["restaurant", "hotel", "luxury", "fashion", "real-estate"],
    tone: ["elegant", "sophisticated", "luxury"],
  },
  {
    heading: "Poppins",
    body: "Open Sans",
    mono: "Source Code Pro",
    description: "Friendly and approachable, great for services",
    industries: ["healthcare", "education", "nonprofit", "consulting"],
    tone: ["friendly", "approachable", "warm"],
  },
  {
    heading: "Montserrat",
    body: "Roboto",
    mono: "Roboto Mono",
    description: "Bold and confident, great for agencies and portfolios",
    industries: ["agency", "portfolio", "creative", "marketing"],
    tone: ["bold", "confident", "creative"],
  },
  {
    heading: "Merriweather",
    body: "Source Sans Pro",
    mono: "Source Code Pro",
    description: "Traditional and trustworthy, great for professional services",
    industries: ["law-firm", "finance", "accounting", "insurance"],
    tone: ["traditional", "trustworthy", "authoritative"],
  },
  {
    heading: "Oswald",
    body: "Quattrocento Sans",
    mono: "Fira Code",
    description: "Strong and impactful, great for construction and sports",
    industries: ["construction", "fitness", "sports", "automotive"],
    tone: ["strong", "bold", "impactful"],
  },
  {
    heading: "DM Sans",
    body: "DM Sans",
    mono: "DM Mono",
    description: "Minimal and refined, great for portfolios and tech",
    industries: ["portfolio", "designer", "photographer", "minimal"],
    tone: ["minimal", "refined", "clean"],
  },
  {
    heading: "Space Grotesk",
    body: "Work Sans",
    mono: "Space Mono",
    description: "Geometric and futuristic, great for tech startups",
    industries: ["blockchain", "ai", "robotics", "gaming"],
    tone: ["futuristic", "innovative", "tech-forward"],
  },
];

export function selectFontPairing(industry: string, tone: string): FontPairing {
  // Find best match by industry
  const industryMatch = fontPairings.find(fp => 
    fp.industries.some(i => i.toLowerCase() === industry.toLowerCase())
  );
  if (industryMatch) return industryMatch;
  
  // Find by tone
  const toneMatch = fontPairings.find(fp =>
    fp.tone.some(t => t.toLowerCase() === tone.toLowerCase())
  );
  if (toneMatch) return toneMatch;
  
  // Default to Inter (most versatile)
  return fontPairings[0];
}

export function generateTypographySystem(pairing: FontPairing): TypographySystem {
  return {
    fontFamily: {
      heading: `"${pairing.heading}", ui-sans-serif, system-ui, sans-serif`,
      body: `"${pairing.body}", ui-sans-serif, system-ui, sans-serif`,
      mono: `"${pairing.mono}", ui-monospace, monospace`,
    },
    fontSize: {
      xs: "0.75rem",      // 12px
      sm: "0.875rem",     // 14px
      base: "1rem",       // 16px
      lg: "1.125rem",     // 18px
      xl: "1.25rem",      // 20px
      "2xl": "1.5rem",    // 24px
      "3xl": "1.875rem",  // 30px
      "4xl": "2.25rem",   // 36px
      "5xl": "3rem",      // 48px
      "6xl": "3.75rem",   // 60px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
    letterSpacing: {
      tighter: "-0.05em",
      tight: "-0.025em",
      normal: "0",
      wide: "0.025em",
      wider: "0.05em",
    },
  };
}
```

---

## 🔧 Design System Generator

```typescript
// src/lib/ai/website-designer/design-system/generator.ts

import { extractColorsFromLogo, generateColorSystem } from "./color-intelligence";
import { selectFontPairing, generateTypographySystem } from "./typography-intelligence";
import type { DesignSystem, BusinessDataContext } from "./types";

export interface DesignSystemInput {
  context: BusinessDataContext;
  industry: string;
  tone: string;
  preferences?: {
    colorMood?: "warm" | "cool" | "neutral" | "vibrant";
    borderRadius?: "none" | "sm" | "md" | "lg" | "full";
    spacing?: "compact" | "balanced" | "spacious";
    shadowStyle?: "none" | "subtle" | "soft" | "dramatic";
  };
}

export async function generateDesignSystem(input: DesignSystemInput): Promise<DesignSystem> {
  const { context, industry, tone, preferences } = input;
  
  // Step 1: Determine primary color
  let primaryColor = context.branding.primary_color;
  let secondaryColor = context.branding.secondary_color;
  let accentColor = context.branding.accent_color;
  
  // If no colors but has logo, extract from logo
  if (!primaryColor && context.branding.logo_url) {
    const extracted = await extractColorsFromLogo(context.branding.logo_url);
    if (extracted) {
      primaryColor = extracted.dominant;
      secondaryColor = extracted.palette[1];
      accentColor = extracted.palette[2];
    }
  }
  
  // Fallback to industry-appropriate default
  if (!primaryColor) {
    primaryColor = getIndustryDefaultColor(industry);
  }
  
  // Step 2: Generate color system
  const colors = generateColorSystem(primaryColor, secondaryColor, accentColor);
  
  // Step 3: Select and generate typography
  const fontPairing = selectFontPairing(industry, tone);
  const typography = generateTypographySystem(fontPairing);
  
  // Step 4: Generate spacing system based on preferences
  const spacing = generateSpacingSystem(preferences?.spacing || "balanced");
  
  // Step 5: Generate border system
  const borders = generateBorderSystem(preferences?.borderRadius || "md");
  
  // Step 6: Generate shadow system
  const shadows = generateShadowSystem(primaryColor, preferences?.shadowStyle || "soft");
  
  // Step 7: Generate animation system
  const animations = generateAnimationSystem();
  
  // Step 8: Define breakpoints
  const breakpoints = generateBreakpointSystem();
  
  return {
    colors,
    typography,
    spacing,
    borders,
    shadows,
    animations,
    breakpoints,
  };
}

function getIndustryDefaultColor(industry: string): string {
  const defaults: Record<string, string> = {
    saas: "#3b82f6",        // Blue
    restaurant: "#dc2626",   // Red
    healthcare: "#10b981",   // Teal
    "law-firm": "#1e3a5f",   // Navy
    "real-estate": "#0d9488", // Teal
    construction: "#f97316", // Orange
    portfolio: "#000000",    // Black
    ecommerce: "#8b5cf6",    // Purple
  };
  
  return defaults[industry] || "#3b82f6";
}

function generateSpacingSystem(density: "compact" | "balanced" | "spacious"): SpacingSystem {
  const multipliers = {
    compact: 0.8,
    balanced: 1,
    spacious: 1.2,
  };
  
  const m = multipliers[density];
  
  return {
    scale: {
      0: "0",
      px: "1px",
      0.5: `${0.125 * m}rem`,
      1: `${0.25 * m}rem`,
      1.5: `${0.375 * m}rem`,
      2: `${0.5 * m}rem`,
      2.5: `${0.625 * m}rem`,
      3: `${0.75 * m}rem`,
      3.5: `${0.875 * m}rem`,
      4: `${1 * m}rem`,
      5: `${1.25 * m}rem`,
      6: `${1.5 * m}rem`,
      7: `${1.75 * m}rem`,
      8: `${2 * m}rem`,
      9: `${2.25 * m}rem`,
      10: `${2.5 * m}rem`,
      11: `${2.75 * m}rem`,
      12: `${3 * m}rem`,
      14: `${3.5 * m}rem`,
      16: `${4 * m}rem`,
      20: `${5 * m}rem`,
      24: `${6 * m}rem`,
      28: `${7 * m}rem`,
      32: `${8 * m}rem`,
      36: `${9 * m}rem`,
      40: `${10 * m}rem`,
      44: `${11 * m}rem`,
      48: `${12 * m}rem`,
      52: `${13 * m}rem`,
      56: `${14 * m}rem`,
      60: `${15 * m}rem`,
      64: `${16 * m}rem`,
      72: `${18 * m}rem`,
      80: `${20 * m}rem`,
      96: `${24 * m}rem`,
    },
    section: {
      sm: `${3 * m}rem`,
      md: `${5 * m}rem`,
      lg: `${7 * m}rem`,
      xl: `${9 * m}rem`,
    },
    container: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      full: "100%",
    },
  };
}

function generateBorderSystem(radius: "none" | "sm" | "md" | "lg" | "full"): BorderSystem {
  const radiusValues = {
    none: { DEFAULT: "0", sm: "0", md: "0", lg: "0", xl: "0", "2xl": "0", "3xl": "0" },
    sm: { DEFAULT: "0.125rem", sm: "0.0625rem", md: "0.1875rem", lg: "0.25rem", xl: "0.375rem", "2xl": "0.5rem", "3xl": "0.75rem" },
    md: { DEFAULT: "0.375rem", sm: "0.125rem", md: "0.375rem", lg: "0.5rem", xl: "0.75rem", "2xl": "1rem", "3xl": "1.5rem" },
    lg: { DEFAULT: "0.5rem", sm: "0.25rem", md: "0.5rem", lg: "0.75rem", xl: "1rem", "2xl": "1.5rem", "3xl": "2rem" },
    full: { DEFAULT: "9999px", sm: "9999px", md: "9999px", lg: "9999px", xl: "9999px", "2xl": "9999px", "3xl": "9999px" },
  };
  
  return {
    radius: {
      none: "0",
      ...radiusValues[radius],
      full: "9999px",
    },
    width: {
      0: "0px",
      DEFAULT: "1px",
      2: "2px",
      4: "4px",
      8: "8px",
    },
  };
}

function generateShadowSystem(
  primaryColor: string,
  style: "none" | "subtle" | "soft" | "dramatic"
): ShadowSystem {
  const shadows = {
    none: {
      none: "none",
      sm: "none",
      DEFAULT: "none",
      md: "none",
      lg: "none",
      xl: "none",
      "2xl": "none",
      inner: "none",
    },
    subtle: {
      none: "none",
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.03)",
      DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)",
      "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.15)",
      inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.03)",
    },
    soft: {
      none: "none",
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
      inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
    },
    dramatic: {
      none: "none",
      sm: "0 1px 3px 0 rgb(0 0 0 / 0.12)",
      DEFAULT: "0 2px 6px 0 rgb(0 0 0 / 0.15)",
      md: "0 6px 12px -2px rgb(0 0 0 / 0.2)",
      lg: "0 15px 25px -5px rgb(0 0 0 / 0.2)",
      xl: "0 25px 40px -10px rgb(0 0 0 / 0.25)",
      "2xl": "0 35px 60px -15px rgb(0 0 0 / 0.35)",
      inner: "inset 0 4px 8px 0 rgb(0 0 0 / 0.1)",
    },
  };
  
  // Generate colored shadows for glow effects
  const chroma = require("chroma-js");
  const primary = chroma(primaryColor);
  
  return {
    shadows: shadows[style],
    colored: {
      primary: `0 0 20px ${primary.alpha(0.3).css()}`,
      secondary: `0 0 20px ${primary.set("hsl.h", "+180").alpha(0.3).css()}`,
      accent: `0 0 20px ${primary.set("hsl.h", "+60").alpha(0.3).css()}`,
    },
  };
}

function generateAnimationSystem(): AnimationSystem {
  return {
    duration: {
      instant: "0ms",
      fast: "150ms",
      normal: "300ms",
      slow: "500ms",
      slower: "700ms",
    },
    easing: {
      linear: "linear",
      ease: "ease",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      easeOut: "cubic-bezier(0, 0, 0.2, 1)",
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    },
    presets: {
      fadeIn: {
        keyframes: { from: { opacity: "0" }, to: { opacity: "1" } },
        duration: "300ms",
        easing: "ease-out",
      },
      fadeUp: {
        keyframes: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        duration: "500ms",
        easing: "ease-out",
      },
      fadeDown: {
        keyframes: {
          from: { opacity: "0", transform: "translateY(-20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        duration: "500ms",
        easing: "ease-out",
      },
      scaleIn: {
        keyframes: {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        duration: "300ms",
        easing: "ease-out",
      },
      slideLeft: {
        keyframes: {
          from: { opacity: "0", transform: "translateX(30px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        duration: "500ms",
        easing: "ease-out",
      },
      slideRight: {
        keyframes: {
          from: { opacity: "0", transform: "translateX(-30px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        duration: "500ms",
        easing: "ease-out",
      },
      bounce: {
        keyframes: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        duration: "600ms",
        easing: "ease-in-out",
      },
      pulse: {
        keyframes: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        duration: "2000ms",
        easing: "ease-in-out",
      },
    },
  };
}

function generateBreakpointSystem(): BreakpointSystem {
  return {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  };
}
```

---

## 📋 Implementation Tasks

### Task 1: Color Intelligence (3 hours)
- Implement logo color extraction
- Build color scale generator
- Add accessibility contrast checker
- Create color palette generator

### Task 2: Typography Intelligence (2 hours)
- Define font pairings
- Build font selection logic
- Create typography scale generator

### Task 3: Spacing & Layout (1 hour)
- Define spacing scale
- Build spacing system generator
- Create container system

### Task 4: Style Tokens (1 hour)
- Build border system
- Build shadow system
- Build animation system

### Task 5: Integration (2 hours)
- Connect to AWD-03 engine
- Apply to component configurations
- Test full pipeline

---

## ✅ Completion Checklist

- [ ] Color extraction from logo working
- [ ] Color scale generation working
- [ ] Accessibility contrast checking working
- [ ] Font pairing selection working
- [ ] Typography system generation working
- [ ] Spacing system generation working
- [ ] Border system generation working
- [ ] Shadow system generation working
- [ ] Animation presets defined
- [ ] Full design system generation working
- [ ] Integration with engine complete

---

## 📁 Files Created

```
src/lib/ai/website-designer/design-system/
├── types.ts
├── color-intelligence.ts
├── typography-intelligence.ts
├── generator.ts
└── index.ts
```

---

**READY TO IMPLEMENT! 🚀**
