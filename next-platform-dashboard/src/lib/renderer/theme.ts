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

// Updated to use brand colors from design system
const DEFAULT_THEME: Required<ThemeSettings> = {
  primaryColor: "#8b5cf6", // Violet - brand primary
  secondaryColor: "#14b8a6", // Teal - brand secondary
  accentColor: "#ec4899", // Pink - brand accent
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
