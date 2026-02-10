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
        glow: "0 0 40px hsl(var(--color-primary) / 0.3)",
        "glow-light": "0 0 40px hsl(var(--color-primary) / 0.15)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, hsl(var(--color-primary)) 0%, hsl(var(--color-primary-400)) 50%, hsl(var(--color-primary-300)) 100%)",
        "gradient-premium": "linear-gradient(145deg, hsl(var(--color-primary-950)) 0%, hsl(var(--color-primary-900)) 50%, hsl(var(--color-primary-800)) 100%)",
        "gradient-stat": "linear-gradient(135deg, hsl(var(--color-primary-700)) 0%, hsl(var(--color-primary)) 100%)",
        "gradient-sidebar-active": "linear-gradient(90deg, hsl(var(--color-primary) / 0.2) 0%, transparent 100%)",
        "gradient-chart-purple": "linear-gradient(180deg, hsl(var(--color-primary) / 0.4) 0%, hsl(var(--color-primary) / 0.05) 100%)",
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
        // PHASE-STUDIO-29: Animation presets keyframes
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInLeft: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        fadeInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        scaleInUp: {
          "0%": { opacity: "0", transform: "scale(0.95) translateY(20px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        slideInUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        slideInDown: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        bounceIn: {
          "0%": { opacity: "0", transform: "scale(0.5)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        bounceInUp: {
          "0%": { opacity: "0", transform: "translateY(50px)" },
          "60%": { opacity: "1", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        flipIn: {
          "0%": { opacity: "0", transform: "perspective(400px) rotateX(90deg)" },
          "100%": { opacity: "1", transform: "perspective(400px) rotateX(0deg)" },
        },
        rotateIn: {
          "0%": { opacity: "0", transform: "rotate(-45deg)" },
          "100%": { opacity: "1", transform: "rotate(0)" },
        },
        zoomIn: {
          "0%": { opacity: "0", transform: "scale(0)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        blurIn: {
          "0%": { opacity: "0", filter: "blur(10px)" },
          "100%": { opacity: "1", filter: "blur(0)" },
        },
        expandIn: {
          "0%": { opacity: "0", transform: "scaleX(0)" },
          "100%": { opacity: "1", transform: "scaleX(1)" },
        },
        popIn: {
          "0%": { opacity: "0", transform: "scale(0)" },
          "80%": { opacity: "1", transform: "scale(1.1)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        // PHASE-STUDIO-31: 3D Effects & Advanced Animations
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        swing: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(10deg)" },
          "75%": { transform: "rotate(-10deg)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-5deg)" },
          "75%": { transform: "rotate(5deg)" },
        },
        heartbeat: {
          "0%, 100%": { transform: "scale(1)" },
          "14%": { transform: "scale(1.1)" },
          "28%": { transform: "scale(1)" },
          "42%": { transform: "scale(1.1)" },
          "70%": { transform: "scale(1)" },
        },
        jello: {
          "0%, 100%": { transform: "skewX(0deg) skewY(0deg)" },
          "25%": { transform: "skewX(-12deg) skewY(-12deg)" },
          "50%": { transform: "skewX(6deg) skewY(6deg)" },
          "75%": { transform: "skewX(-3deg) skewY(-3deg)" },
        },
        rubberBand: {
          "0%": { transform: "scaleX(1) scaleY(1)" },
          "30%": { transform: "scaleX(1.25) scaleY(0.75)" },
          "40%": { transform: "scaleX(0.75) scaleY(1.25)" },
          "50%": { transform: "scaleX(1.15) scaleY(0.85)" },
          "65%": { transform: "scaleX(0.95) scaleY(1.05)" },
          "75%": { transform: "scaleX(1.05) scaleY(0.95)" },
          "100%": { transform: "scaleX(1) scaleY(1)" },
        },
        tada: {
          "0%, 100%": { transform: "scale(1) rotate(0deg)" },
          "10%, 20%": { transform: "scale(0.9) rotate(-3deg)" },
          "30%, 50%, 70%, 90%": { transform: "scale(1.1) rotate(3deg)" },
          "40%, 60%, 80%": { transform: "scale(1.1) rotate(-3deg)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-5px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(5px)" },
        },
        flip3d: {
          "0%": { transform: "perspective(400px) rotateY(0deg)" },
          "100%": { transform: "perspective(400px) rotateY(180deg)" },
        },
        flipX3d: {
          "0%": { transform: "perspective(400px) rotateX(0deg)" },
          "100%": { transform: "perspective(400px) rotateX(180deg)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 5px hsl(var(--color-primary) / 0.4)" },
          "50%": { boxShadow: "0 0 20px hsl(var(--color-primary) / 0.8)" },
        },
        // Module card icon hover animation
        iconBreathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        // PHASE-STUDIO-29: Animation presets
        fadeIn: "fadeIn 0.5s ease-out forwards",
        fadeInUp: "fadeInUp 0.5s ease-out forwards",
        fadeInDown: "fadeInDown 0.5s ease-out forwards",
        fadeInLeft: "fadeInLeft 0.5s ease-out forwards",
        fadeInRight: "fadeInRight 0.5s ease-out forwards",
        scaleIn: "scaleIn 0.3s ease-out forwards",
        scaleInUp: "scaleInUp 0.4s ease-out forwards",
        slideInUp: "slideInUp 0.4s ease-out forwards",
        slideInDown: "slideInDown 0.4s ease-out forwards",
        slideInLeft: "slideInLeft 0.4s ease-out forwards",
        slideInRight: "slideInRight 0.4s ease-out forwards",
        bounceIn: "bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards",
        bounceInUp: "bounceInUp 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards",
        flipIn: "flipIn 0.5s ease-out forwards",
        rotateIn: "rotateIn 0.5s ease-out forwards",
        zoomIn: "zoomIn 0.4s ease-out forwards",
        blurIn: "blurIn 0.5s ease-out forwards",
        expandIn: "expandIn 0.4s ease-out forwards",
        popIn: "popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        // PHASE-STUDIO-31: 3D Effects animations
        float: "float 3s ease-in-out infinite",
        swing: "swing 1s ease-in-out infinite",
        wiggle: "wiggle 0.5s ease-in-out infinite",
        heartbeat: "heartbeat 1.5s ease-in-out infinite",
        jello: "jello 0.9s ease-in-out",
        rubberBand: "rubberBand 0.8s ease-in-out",
        tada: "tada 1s ease-in-out",
        shake: "shake 0.5s ease-in-out",
        flip3d: "flip3d 0.6s ease-in-out",
        flipX3d: "flipX3d 0.6s ease-in-out",
        glowPulse: "glowPulse 2s ease-in-out infinite",
        iconBreathe: "iconBreathe 2s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
