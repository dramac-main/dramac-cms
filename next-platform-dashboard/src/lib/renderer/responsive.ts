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
