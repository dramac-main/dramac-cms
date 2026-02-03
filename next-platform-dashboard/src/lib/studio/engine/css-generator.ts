/**
 * DRAMAC Studio CSS Generator
 * 
 * Generates optimized CSS from component styles including:
 * - State styles (hover, active, focus) as pseudo-classes
 * - Responsive styles with media queries
 * - Transition animations
 * - CSS minification
 * 
 * @phase STUDIO-22 - Component States
 * @phase STUDIO-23 - Export & Render Optimization
 */

import type { 
  StudioComponent, 
  ComponentState,
  TransitionSettings,
  ResponsiveValue 
} from "@/types/studio";
import { STATE_EDITABLE_PROPERTIES, StateEditableProperty } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

export interface CSSGeneratorOptions {
  /** Whether to minify the output CSS */
  minify?: boolean;
  /** Whether to include media query breakpoints */
  includeResponsive?: boolean;
  /** Whether to include state pseudo-classes */
  includeStates?: boolean;
  /** Custom class prefix for scoping */
  classPrefix?: string;
  /** Breakpoints for responsive styles */
  breakpoints?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
  };
}

interface CSSRule {
  selector: string;
  properties: Record<string, string>;
}

interface StylePropertyConfig {
  cssProperty: string;
  transform?: (value: string | number) => string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
};

// Map component prop names to CSS property names
const STYLE_PROPERTY_MAP: Record<string, StylePropertyConfig> = {
  // Layout
  width: { cssProperty: "width" },
  height: { cssProperty: "height" },
  minWidth: { cssProperty: "min-width" },
  maxWidth: { cssProperty: "max-width" },
  minHeight: { cssProperty: "min-height" },
  maxHeight: { cssProperty: "max-height" },
  
  // Spacing
  padding: { cssProperty: "padding" },
  paddingTop: { cssProperty: "padding-top" },
  paddingRight: { cssProperty: "padding-right" },
  paddingBottom: { cssProperty: "padding-bottom" },
  paddingLeft: { cssProperty: "padding-left" },
  margin: { cssProperty: "margin" },
  marginTop: { cssProperty: "margin-top" },
  marginRight: { cssProperty: "margin-right" },
  marginBottom: { cssProperty: "margin-bottom" },
  marginLeft: { cssProperty: "margin-left" },
  gap: { cssProperty: "gap" },
  
  // Colors
  backgroundColor: { cssProperty: "background-color" },
  color: { cssProperty: "color" },
  borderColor: { cssProperty: "border-color" },
  
  // Typography
  fontSize: { cssProperty: "font-size" },
  fontWeight: { cssProperty: "font-weight" },
  lineHeight: { cssProperty: "line-height" },
  letterSpacing: { cssProperty: "letter-spacing" },
  textAlign: { cssProperty: "text-align" },
  textDecoration: { cssProperty: "text-decoration" },
  textTransform: { cssProperty: "text-transform" },
  
  // Border
  borderWidth: { cssProperty: "border-width" },
  borderStyle: { cssProperty: "border-style" },
  borderRadius: { cssProperty: "border-radius" },
  
  // Effects
  opacity: { 
    cssProperty: "opacity",
    transform: (value) => String(Number(value) / 100),
  },
  boxShadow: { cssProperty: "box-shadow" },
  textShadow: { cssProperty: "text-shadow" },
  transform: { cssProperty: "transform" },
  
  // Cursor
  cursor: { cssProperty: "cursor" },
  
  // Display
  display: { cssProperty: "display" },
  flexDirection: { cssProperty: "flex-direction" },
  alignItems: { cssProperty: "align-items" },
  justifyContent: { cssProperty: "justify-content" },
  flexWrap: { cssProperty: "flex-wrap" },
};

// State to CSS pseudo-class mapping
const STATE_PSEUDO_CLASS: Record<ComponentState, string> = {
  default: "",
  hover: ":hover",
  active: ":active",
  focus: ":focus",
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Resolves a responsive value for a specific breakpoint
 */
function resolveResponsiveValue<T>(
  value: ResponsiveValue<T>,
  breakpoint: "base" | "mobile" | "tablet" | "desktop" | "sm" | "md" | "lg" | "xl" | "xxl"
): T | undefined {
  // Map breakpoint names to ResponsiveValue properties
  const bpMap: Record<string, keyof ResponsiveValue<T>> = {
    base: "mobile",
    mobile: "mobile",
    sm: "tablet",
    tablet: "tablet",
    md: "tablet",
    lg: "desktop",
    desktop: "desktop",
    xl: "desktop",
    xxl: "desktop",
  };
  
  const key = bpMap[breakpoint] || "mobile";
  return value[key];
}

/**
 * Generates a unique class name for a component
 */
export function generateClassName(
  componentId: string, 
  prefix = "dc"
): string {
  // Create a short hash from the component ID
  const hash = componentId.slice(-8).replace(/-/g, "");
  return `${prefix}-${hash}`;
}

/**
 * Converts a prop value to a CSS value
 */
function propToCSS(
  propName: string, 
  value: string | number | undefined | null
): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  
  const config = STYLE_PROPERTY_MAP[propName];
  if (!config) return null;
  
  let cssValue = String(value);
  
  // Apply transformation if defined
  if (config.transform) {
    cssValue = config.transform(value);
  }
  
  // Add px unit for numeric values that need it
  if (
    typeof value === "number" &&
    !["opacity", "fontWeight", "lineHeight", "flexGrow", "flexShrink"].includes(propName)
  ) {
    cssValue = `${value}px`;
  }
  
  return `${config.cssProperty}: ${cssValue};`;
}

/**
 * Generates transition CSS from settings
 */
function generateTransitionCSS(transition?: TransitionSettings): string {
  if (!transition || transition.property === "none") {
    return "";
  }
  
  let propertyCSS: string = transition.property;
  
  // Map custom names to CSS properties
  if (transition.property === "colors") {
    propertyCSS = "background-color, color, border-color";
  } else if (transition.property === "shadow") {
    propertyCSS = "box-shadow, text-shadow";
  }
  
  const delay = transition.delay ? ` ${transition.delay}ms` : "";
  return `transition: ${propertyCSS} ${transition.duration}ms ${transition.easing}${delay};`;
}

// =============================================================================
// CSS GENERATOR
// =============================================================================

/**
 * Generates CSS for a single component
 */
export function generateComponentCSS(
  component: StudioComponent,
  options: CSSGeneratorOptions = {}
): string {
  const {
    minify = false,
    includeResponsive = true,
    includeStates = true,
    classPrefix = "dc",
    breakpoints = DEFAULT_BREAKPOINTS,
  } = options;
  
  const rules: CSSRule[] = [];
  const className = generateClassName(component.id, classPrefix);
  
  // Extract style properties from component props
  const styleProps = extractStyleProps(component.props);
  
  // 1. Generate base styles (default state, mobile-first)
  const baseProperties: Record<string, string> = {};
  
  for (const [propName, value] of Object.entries(styleProps)) {
    // Handle responsive values
    if (isResponsiveValue(value)) {
      // Get base (mobile) value
      const baseValue = resolveResponsiveValue(value, "base");
      if (baseValue !== undefined && baseValue !== null && (typeof baseValue === "string" || typeof baseValue === "number")) {
        const css = propToCSS(propName, baseValue);
        if (css) {
          const [prop, val] = css.replace(";", "").split(": ");
          baseProperties[prop] = val;
        }
      }
    } else if (typeof value === "string" || typeof value === "number") {
      const css = propToCSS(propName, value);
      if (css) {
        const [prop, val] = css.replace(";", "").split(": ");
        baseProperties[prop] = val;
      }
    }
  }
  
  // Add transition CSS if defined
  if (component.transition) {
    const transitionCSS = generateTransitionCSS(component.transition);
    if (transitionCSS) {
      const [, val] = transitionCSS.replace(";", "").split(": ");
      baseProperties["transition"] = val;
    }
  }
  
  if (Object.keys(baseProperties).length > 0) {
    rules.push({
      selector: `.${className}`,
      properties: baseProperties,
    });
  }
  
  // 2. Generate state styles (hover, active, focus)
  if (includeStates && component.states) {
    const states = ["hover", "active", "focus"] as const;
    
    for (const state of states) {
      const stateProps = component.states[state];
      if (!stateProps) continue;
      
      const stateProperties: Record<string, string> = {};
      
      for (const [propName, value] of Object.entries(stateProps)) {
        if (!(STATE_EDITABLE_PROPERTIES as readonly string[]).includes(propName)) continue;
        
        // For states, just use direct values (not responsive for now)
        const css = propToCSS(propName, value as string | number);
        if (css) {
          const [prop, val] = css.replace(";", "").split(": ");
          stateProperties[prop] = val;
        }
      }
      
      if (Object.keys(stateProperties).length > 0) {
        rules.push({
          selector: `.${className}${STATE_PSEUDO_CLASS[state]}`,
          properties: stateProperties,
        });
      }
    }
  }
  
  // 3. Generate responsive styles (media queries)
  if (includeResponsive) {
    const breakpointOrder: (keyof typeof breakpoints)[] = ["sm", "md", "lg", "xl", "xxl"];
    
    for (const bp of breakpointOrder) {
      const bpWidth = breakpoints[bp];
      if (!bpWidth) continue;
      
      const bpProperties: Record<string, string> = {};
      
      for (const [propName, value] of Object.entries(styleProps)) {
        if (!isResponsiveValue(value)) continue;
        
        const bpValue = resolveResponsiveValue(value, bp);
        if (bpValue !== undefined && bpValue !== null && (typeof bpValue === "string" || typeof bpValue === "number")) {
          const css = propToCSS(propName, bpValue);
          if (css) {
            const [prop, val] = css.replace(";", "").split(": ");
            bpProperties[prop] = val;
          }
        }
      }
      
      if (Object.keys(bpProperties).length > 0) {
        rules.push({
          selector: `@media (min-width: ${bpWidth}px) { .${className}`,
          properties: bpProperties,
        });
      }
    }
  }
  
  return rulesToCSS(rules, minify);
}

/**
 * Generates CSS for an entire page
 */
export function generatePageCSS(
  components: StudioComponent[],
  options: CSSGeneratorOptions = {}
): string {
  const cssBlocks: string[] = [];
  
  // Add CSS reset/base styles
  cssBlocks.push(generateBaseStyles(options.minify));
  
  // Generate CSS for each component
  for (const component of components) {
    const componentCSS = generateComponentCSS(component, options);
    if (componentCSS) {
      cssBlocks.push(componentCSS);
    }
  }
  
  return cssBlocks.join(options.minify ? "" : "\n\n");
}

/**
 * Minifies CSS by removing whitespace and comments
 */
export function minifyCSS(css: string): string {
  return css
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Remove newlines
    .replace(/\n/g, "")
    // Remove extra spaces
    .replace(/\s+/g, " ")
    // Remove spaces around special characters
    .replace(/\s*([{};:,>~+])\s*/g, "$1")
    // Remove trailing semicolons before closing braces
    .replace(/;}/g, "}")
    // Trim
    .trim();
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extracts style-related properties from component props
 */
function extractStyleProps(
  props: Record<string, unknown>
): Record<string, unknown> {
  const styleProps: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(props)) {
    if (STYLE_PROPERTY_MAP[key] && value !== undefined) {
      styleProps[key] = value;
    }
  }
  
  return styleProps;
}

/**
 * Checks if a value is a responsive value object
 */
function isResponsiveValue(value: unknown): value is ResponsiveValue<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "base" in value
  );
}

/**
 * Converts CSS rules to a string
 */
function rulesToCSS(rules: CSSRule[], minify = false): string {
  const newline = minify ? "" : "\n";
  const indent = minify ? "" : "  ";
  const space = minify ? "" : " ";
  
  return rules
    .map((rule) => {
      const isMediaQuery = rule.selector.startsWith("@media");
      const props = Object.entries(rule.properties)
        .map(([prop, val]) => `${indent}${prop}:${space}${val};`)
        .join(newline);
      
      if (isMediaQuery) {
        return `${rule.selector}${space}{${newline}${props}${newline}${indent}} }`;
      }
      
      return `${rule.selector}${space}{${newline}${props}${newline}}`;
    })
    .join(newline);
}

/**
 * Generates base/reset styles
 */
function generateBaseStyles(minify = false): string {
  const styles = `
/* DRAMAC Studio Generated Styles */
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.5;
}

img,
video {
  max-width: 100%;
  height: auto;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font: inherit;
  cursor: pointer;
}
`.trim();

  return minify ? minifyCSS(styles) : styles;
}

// =============================================================================
// CSS CRITICAL PATH
// =============================================================================

/**
 * Extracts critical (above-the-fold) CSS
 * Currently returns all CSS, but can be optimized to return only critical styles
 */
export function extractCriticalCSS(
  fullCSS: string,
  _criticalComponents?: string[]
): string {
  // For now, return the full CSS
  // In a production implementation, this would analyze the DOM
  // and return only styles needed for above-the-fold content
  return fullCSS;
}

/**
 * Generates an inline style string for SSR
 */
export function generateInlineStyles(
  props: Record<string, unknown>
): React.CSSProperties {
  const styles: React.CSSProperties = {};
  
  for (const [propName, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue;
    
    const config = STYLE_PROPERTY_MAP[propName];
    if (!config) continue;
    
    // Convert kebab-case to camelCase for React
    const camelCaseProp = config.cssProperty.replace(/-([a-z])/g, (_, letter) =>
      letter.toUpperCase()
    ) as keyof React.CSSProperties;
    
    let finalValue: string | number = value as string | number;
    
    if (config.transform) {
      finalValue = config.transform(finalValue);
    }
    
    // @ts-expect-error - Dynamic property assignment
    styles[camelCaseProp] = finalValue;
  }
  
  return styles;
}
