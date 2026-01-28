/**
 * DRAMAC CMS CSS Variable Generator
 * 
 * Generates CSS custom properties from the brand configuration.
 * This enables runtime theme switching and white-label customization.
 * 
 * @module config/brand/css-generator
 * @version 1.0.0
 */

import type { ThemeColors, ColorScale, ColorValue } from './types';
import { colorConfig, colors } from './colors';
import { 
  spacing, 
  borderRadius, 
  componentRadius, 
  shadows, 
  fontFamilies, 
  fontSizes,
  fontWeights,
  breakpoints,
} from './tokens';

// =============================================================================
// CSS VARIABLE GENERATION
// =============================================================================

/**
 * Generate CSS variables for a color scale.
 */
function generateColorScaleVars(
  prefix: string,
  scale: ColorScale
): Record<string, string> {
  const vars: Record<string, string> = {};
  const shades: (keyof ColorScale)[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  
  for (const shade of shades) {
    vars[`--color-${prefix}-${shade}`] = scale[shade].hsl;
  }
  
  // Add DEFAULT (500 shade) for convenience
  vars[`--color-${prefix}`] = scale[500].hsl;
  
  return vars;
}

/**
 * Generate CSS variables for a single color value.
 */
function generateColorVar(name: string, color: ColorValue): Record<string, string> {
  return { [`--color-${name}`]: color.hsl };
}

/**
 * Generate all brand color CSS variables.
 */
export function generateBrandColorVars(): Record<string, string> {
  const vars: Record<string, string> = {};
  
  // Generate scales for each color
  Object.assign(vars, generateColorScaleVars('primary', colors.primary));
  Object.assign(vars, generateColorScaleVars('secondary', colors.secondary));
  Object.assign(vars, generateColorScaleVars('accent', colors.accent));
  Object.assign(vars, generateColorScaleVars('success', colors.success));
  Object.assign(vars, generateColorScaleVars('warning', colors.warning));
  Object.assign(vars, generateColorScaleVars('danger', colors.danger));
  Object.assign(vars, generateColorScaleVars('info', colors.info));
  
  return vars;
}

/**
 * Generate theme-specific CSS variables.
 */
export function generateThemeVars(theme: ThemeColors): Record<string, string> {
  const vars: Record<string, string> = {};
  
  // Brand colors (main shades for semantic use)
  vars['--color-primary'] = theme.brand.primary.scale[theme.brand.primary.DEFAULT].hsl;
  vars['--color-primary-foreground'] = theme.brand.primary.foreground.hsl;
  
  vars['--color-secondary'] = theme.brand.secondary.scale[theme.brand.secondary.DEFAULT].hsl;
  vars['--color-secondary-foreground'] = theme.brand.secondary.foreground.hsl;
  
  vars['--color-accent'] = theme.brand.accent.scale[theme.brand.accent.DEFAULT].hsl;
  vars['--color-accent-foreground'] = theme.brand.accent.foreground.hsl;
  
  // Status colors
  vars['--color-success'] = theme.status.success.scale[theme.status.success.DEFAULT].hsl;
  vars['--color-success-foreground'] = theme.status.success.foreground.hsl;
  
  vars['--color-warning'] = theme.status.warning.scale[theme.status.warning.DEFAULT].hsl;
  vars['--color-warning-foreground'] = theme.status.warning.foreground.hsl;
  
  vars['--color-danger'] = theme.status.danger.scale[theme.status.danger.DEFAULT].hsl;
  vars['--color-danger-foreground'] = theme.status.danger.foreground.hsl;
  
  vars['--color-info'] = theme.status.info.scale[theme.status.info.DEFAULT].hsl;
  vars['--color-info-foreground'] = theme.status.info.foreground.hsl;
  
  // Neutral colors
  vars['--color-background'] = theme.neutral.background.hsl;
  vars['--color-foreground'] = theme.neutral.foreground.hsl;
  
  vars['--color-card'] = theme.neutral.card.DEFAULT.hsl;
  vars['--color-card-foreground'] = theme.neutral.card.foreground.hsl;
  
  vars['--color-popover'] = theme.neutral.popover.DEFAULT.hsl;
  vars['--color-popover-foreground'] = theme.neutral.popover.foreground.hsl;
  
  vars['--color-muted'] = theme.neutral.muted.DEFAULT.hsl;
  vars['--color-muted-foreground'] = theme.neutral.muted.foreground.hsl;
  
  vars['--color-border'] = theme.neutral.border.hsl;
  vars['--color-input'] = theme.neutral.input.hsl;
  vars['--color-ring'] = theme.neutral.ring.hsl;
  
  return vars;
}

/**
 * Generate spacing CSS variables.
 */
export function generateSpacingVars(): Record<string, string> {
  const vars: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(spacing)) {
    const varName = key.toString().replace('.', '-');
    vars[`--spacing-${varName}`] = value;
  }
  
  return vars;
}

/**
 * Generate border radius CSS variables.
 */
export function generateRadiusVars(): Record<string, string> {
  const vars: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(borderRadius)) {
    vars[`--radius-${key}`] = value;
  }
  
  // Component radius for shadcn/ui
  vars['--radius'] = componentRadius;
  
  return vars;
}

/**
 * Generate shadow CSS variables.
 */
export function generateShadowVars(): Record<string, string> {
  const vars: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(shadows)) {
    vars[`--shadow-${key}`] = value;
  }
  
  return vars;
}

/**
 * Generate typography CSS variables.
 */
export function generateTypographyVars(): Record<string, string> {
  const vars: Record<string, string> = {};
  
  // Font families
  vars['--font-sans'] = fontFamilies.sans;
  vars['--font-mono'] = fontFamilies.mono;
  if (fontFamilies.display) {
    vars['--font-display'] = fontFamilies.display;
  }
  
  // Font sizes
  for (const [key, value] of Object.entries(fontSizes)) {
    vars[`--font-size-${key}`] = value.size;
    vars[`--line-height-${key}`] = value.lineHeight;
  }
  
  // Font weights
  for (const [key, value] of Object.entries(fontWeights)) {
    vars[`--font-weight-${key}`] = String(value);
  }
  
  return vars;
}

/**
 * Generate all CSS variables for the light theme.
 */
export function generateLightThemeVars(): Record<string, string> {
  return {
    ...generateBrandColorVars(),
    ...generateThemeVars(colorConfig.light),
    ...generateSpacingVars(),
    ...generateRadiusVars(),
    ...generateShadowVars(),
    ...generateTypographyVars(),
  };
}

/**
 * Generate all CSS variables for the dark theme.
 */
export function generateDarkThemeVars(): Record<string, string> {
  return generateThemeVars(colorConfig.dark);
}

/**
 * Convert variables object to CSS string.
 */
export function varsToCss(vars: Record<string, string>, indent: string = '  '): string {
  return Object.entries(vars)
    .map(([key, value]) => `${indent}${key}: ${value};`)
    .join('\n');
}

/**
 * Generate complete CSS for the brand system.
 */
export function generateBrandCss(): string {
  const lightVars = generateLightThemeVars();
  const darkVars = generateDarkThemeVars();
  
  return `/* =============================================================================
   DRAMAC CMS BRAND DESIGN TOKENS
   Generated from src/config/brand
   DO NOT EDIT DIRECTLY - Modify brand config files instead
   ============================================================================= */

:root {
${varsToCss(lightVars)}
}

.dark {
${varsToCss(darkVars)}
}`;
}

/**
 * Generate Tailwind-compatible color config from scales.
 */
export function generateTailwindColorConfig(): Record<string, Record<string | number, string>> {
  const config: Record<string, Record<string | number, string>> = {};
  
  const colorNames = ['primary', 'secondary', 'accent', 'success', 'warning', 'danger', 'info'] as const;
  const shades: (keyof ColorScale)[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  
  for (const name of colorNames) {
    config[name] = {
      DEFAULT: `hsl(var(--color-${name}))`,
      foreground: `hsl(var(--color-${name}-foreground))`,
    };
    
    for (const shade of shades) {
      config[name][shade] = `hsl(var(--color-${name}-${shade}))`;
    }
  }
  
  // Add neutral colors
  config.background = { DEFAULT: 'hsl(var(--color-background))' };
  config.foreground = { DEFAULT: 'hsl(var(--color-foreground))' };
  config.card = { 
    DEFAULT: 'hsl(var(--color-card))',
    foreground: 'hsl(var(--color-card-foreground))',
  };
  config.popover = { 
    DEFAULT: 'hsl(var(--color-popover))',
    foreground: 'hsl(var(--color-popover-foreground))',
  };
  config.muted = { 
    DEFAULT: 'hsl(var(--color-muted))',
    foreground: 'hsl(var(--color-muted-foreground))',
  };
  config.border = { DEFAULT: 'hsl(var(--color-border))' };
  config.input = { DEFAULT: 'hsl(var(--color-input))' };
  config.ring = { DEFAULT: 'hsl(var(--color-ring))' };
  
  return config;
}
