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
 * - gray (neutral grays with purple undertone for dark mode)
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
        
        // Gray scale with purple undertone for dark mode harmony
        gray: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
          950: "#09090b",
        },
        
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
        
        // Semantic surface colors for analytics dashboard
        surface: {
          DEFAULT: "hsl(var(--color-card))",
          elevated: "hsl(var(--color-popover))",
          hover: "hsl(var(--color-muted))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
        display: ["var(--font-display)", "var(--font-sans)"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(139, 92, 246, 0.3)",
        "glow-light": "0 0 40px rgba(139, 92, 246, 0.15)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #c4b5fd 100%)",
        "gradient-premium": "linear-gradient(145deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)",
        "gradient-stat": "linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)",
        "gradient-sidebar-active": "linear-gradient(90deg, rgba(139,92,246,0.2) 0%, transparent 100%)",
        "gradient-chart-purple": "linear-gradient(180deg, rgba(139,92,246,0.4) 0%, rgba(139,92,246,0.05) 100%)",
        "gradient-chart-teal": "linear-gradient(180deg, rgba(20,184,166,0.3) 0%, rgba(20,184,166,0.02) 100%)",
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
