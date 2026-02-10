/**
 * ServerBrandingStyle
 * 
 * A SERVER component that injects brand CSS variables directly into the
 * server-rendered HTML. This eliminates the "purple flash" where default
 * CSS colors show before the client-side BrandingProvider hydrates.
 * 
 * Must be used as a sibling BEFORE <BrandingProvider> in the component tree.
 */

import type { AgencyBranding } from "@/types/branding";

interface ServerBrandingStyleProps {
  branding: AgencyBranding | null;
}

function hexToHSL(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function generateHSLScale(baseHSL: string): Record<string, string> {
  const parts = baseHSL.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!parts) return {};
  const h = parseInt(parts[1]);
  const s = parseInt(parts[2]);
  const shades: Record<string, number> = {
    '50': 97, '100': 94, '200': 86, '300': 77,
    '400': 66, '500': 55, '600': 47, '700': 39,
    '800': 32, '900': 24, '950': 14,
  };
  const result: Record<string, string> = {};
  for (const [shade, lightness] of Object.entries(shades)) {
    const adjS = lightness > 90 ? Math.round(s * 0.3) : lightness > 80 ? Math.round(s * 0.5) : lightness < 20 ? Math.round(s * 0.8) : s;
    result[shade] = `${h} ${adjS}% ${lightness}%`;
  }
  return result;
}

export function ServerBrandingStyle({ branding }: ServerBrandingStyleProps) {
  if (!branding) return null;

  const primaryHSL = hexToHSL(branding.primary_color);
  const accentHSL = hexToHSL(branding.accent_color);
  const primaryFgHSL = branding.primary_foreground ? hexToHSL(branding.primary_foreground) : '0 0% 100%';
  const accentFgHSL = branding.accent_foreground ? hexToHSL(branding.accent_foreground) : '0 0% 100%';

  const primaryScale = generateHSLScale(primaryHSL);
  const accentScale = generateHSLScale(accentHSL);

  const primaryScaleCSS = Object.entries(primaryScale)
    .map(([shade, val]) => `--color-primary-${shade}: ${val};`)
    .join('\n      ');
  const accentScaleCSS = Object.entries(accentScale)
    .map(([shade, val]) => `--color-accent-${shade}: ${val};`)
    .join('\n      ');

  const cssContent = `:root {
      --brand-primary: ${branding.primary_color};
      --brand-accent: ${branding.accent_color};
      --color-primary: ${primaryHSL};
      --color-primary-foreground: ${primaryFgHSL};
      --color-accent: ${accentHSL};
      --color-accent-foreground: ${accentFgHSL};
      --color-ring: ${primaryHSL};
      --color-secondary: ${accentHSL};
      --color-secondary-foreground: ${accentFgHSL};
      --sidebar-primary: hsl(${primaryHSL});
      --sidebar-primary-foreground: hsl(${primaryFgHSL});
      --sidebar-accent: hsl(${accentHSL});
      --sidebar-accent-foreground: hsl(${accentFgHSL});
      --sidebar-ring: hsl(${primaryHSL});
      --sidebar-border: hsl(${primaryHSL} / 0.15);
      ${primaryScaleCSS}
      ${accentScaleCSS}
    }
    .dark {
      --color-primary: ${primaryHSL};
      --color-primary-foreground: ${primaryFgHSL};
      --color-accent: ${accentHSL};
      --color-accent-foreground: ${accentFgHSL};
      --color-ring: ${primaryHSL};
      --color-secondary: ${accentHSL};
      --color-secondary-foreground: ${accentFgHSL};
      --sidebar-primary: hsl(${primaryHSL});
      --sidebar-primary-foreground: hsl(${primaryFgHSL});
      --sidebar-accent: hsl(${accentHSL});
      --sidebar-accent-foreground: hsl(${accentFgHSL});
      --sidebar-ring: hsl(${primaryHSL});
      --sidebar-border: hsl(${primaryHSL} / 0.15);
      ${primaryScaleCSS}
      ${accentScaleCSS}
    }`;

  return (
    <style
      id="server-branding-vars"
      dangerouslySetInnerHTML={{ __html: cssContent }}
    />
  );
}
