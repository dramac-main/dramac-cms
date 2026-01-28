import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

/**
 * DRAMAC CMS Tailwind Configuration
 * 
 * Colors are defined via CSS variables set in globals.css and
 * generated from the brand configuration in src/config/brand.
 * 
 * Color shades (50-950) are available for all brand colors:
 * - primary, secondary, accent (brand colors)
 * - success, warning, danger, info (status colors)
 * 
 * @see src/config/brand for the centralized color definitions
 */

/**
 * Generate color scale with all shades (50-950).
 * Maps CSS variables to Tailwind color utilities.
 */
function generateColorScale(name: string) {
  return {
    50: `hsl(var(--color-${name}-50))`,
    100: `hsl(var(--color-${name}-100))`,
    200: `hsl(var(--color-${name}-200))`,
    300: `hsl(var(--color-${name}-300))`,
    400: `hsl(var(--color-${name}-400))`,
    500: `hsl(var(--color-${name}-500))`,
    600: `hsl(var(--color-${name}-600))`,
    700: `hsl(var(--color-${name}-700))`,
    800: `hsl(var(--color-${name}-800))`,
    900: `hsl(var(--color-${name}-900))`,
    950: `hsl(var(--color-${name}-950))`,
    DEFAULT: `hsl(var(--color-${name}))`,
    foreground: `hsl(var(--color-${name}-foreground))`,
  };
}

const config: Config = {
  darkMode: ["class", "html"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Neutral colors (single value)
        border: "hsl(var(--color-border))",
        input: "hsl(var(--color-input))",
        ring: "hsl(var(--color-ring))",
        background: "hsl(var(--color-background))",
        foreground: "hsl(var(--color-foreground))",
        
        // Brand colors with full scale (50-950)
        primary: generateColorScale("primary"),
        secondary: generateColorScale("secondary"),
        accent: generateColorScale("accent"),
        
        // Status colors with full scale (50-950)
        success: generateColorScale("success"),
        warning: generateColorScale("warning"),
        danger: generateColorScale("danger"),
        info: generateColorScale("info"),
        
        // Component colors (card, popover, muted)
        muted: {
          DEFAULT: "hsl(var(--color-muted))",
          foreground: "hsl(var(--color-muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--color-card))",
          foreground: "hsl(var(--color-card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--color-popover))",
          foreground: "hsl(var(--color-popover-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
