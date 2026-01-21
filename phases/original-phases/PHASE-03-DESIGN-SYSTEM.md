# Phase 3: Design System & Tokens

> **AI Model**: Claude Sonnet 4.5 (1x) - Implementation phase
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Create a comprehensive design system with CSS custom properties (tokens) that ensure visual consistency across the entire application.

---

## 📋 Prerequisites

- [ ] Phase 1 completed
- [ ] Phase 2 completed

---

## ✅ Tasks

### Task 3.1: Create Global CSS with Design Tokens

**File: `src/app/globals.css`**

```css
@import "tailwindcss";

/* =============================================
   DESIGN TOKENS
   ============================================= */

:root {
  /* ---------------------------------------------
     COLORS - Brand
     --------------------------------------------- */
  --color-primary: 238 76% 68%;
  --color-primary-foreground: 0 0% 100%;
  
  --color-secondary: 258 90% 66%;
  --color-secondary-foreground: 0 0% 100%;
  
  --color-accent: 330 81% 60%;
  --color-accent-foreground: 0 0% 100%;
  
  /* ---------------------------------------------
     COLORS - Semantic
     --------------------------------------------- */
  --color-success: 142 71% 45%;
  --color-success-foreground: 0 0% 100%;
  
  --color-warning: 38 92% 50%;
  --color-warning-foreground: 0 0% 100%;
  
  --color-danger: 0 84% 60%;
  --color-danger-foreground: 0 0% 100%;
  
  --color-info: 199 89% 48%;
  --color-info-foreground: 0 0% 100%;
  
  /* ---------------------------------------------
     COLORS - Neutral (Light Mode)
     --------------------------------------------- */
  --color-background: 0 0% 100%;
  --color-foreground: 222.2 84% 4.9%;
  
  --color-card: 0 0% 100%;
  --color-card-foreground: 222.2 84% 4.9%;
  
  --color-popover: 0 0% 100%;
  --color-popover-foreground: 222.2 84% 4.9%;
  
  --color-muted: 210 40% 96.1%;
  --color-muted-foreground: 215.4 16.3% 46.9%;
  
  --color-border: 214.3 31.8% 91.4%;
  --color-input: 214.3 31.8% 91.4%;
  --color-ring: 238 76% 68%;
  
  /* ---------------------------------------------
     SPACING SCALE
     --------------------------------------------- */
  --spacing-0: 0;
  --spacing-px: 1px;
  --spacing-0-5: 0.125rem;   /* 2px */
  --spacing-1: 0.25rem;      /* 4px */
  --spacing-1-5: 0.375rem;   /* 6px */
  --spacing-2: 0.5rem;       /* 8px */
  --spacing-2-5: 0.625rem;   /* 10px */
  --spacing-3: 0.75rem;      /* 12px */
  --spacing-3-5: 0.875rem;   /* 14px */
  --spacing-4: 1rem;         /* 16px */
  --spacing-5: 1.25rem;      /* 20px */
  --spacing-6: 1.5rem;       /* 24px */
  --spacing-7: 1.75rem;      /* 28px */
  --spacing-8: 2rem;         /* 32px */
  --spacing-9: 2.25rem;      /* 36px */
  --spacing-10: 2.5rem;      /* 40px */
  --spacing-11: 2.75rem;     /* 44px */
  --spacing-12: 3rem;        /* 48px */
  --spacing-14: 3.5rem;      /* 56px */
  --spacing-16: 4rem;        /* 64px */
  --spacing-20: 5rem;        /* 80px */
  --spacing-24: 6rem;        /* 96px */
  --spacing-28: 7rem;        /* 112px */
  --spacing-32: 8rem;        /* 128px */
  
  /* ---------------------------------------------
     TYPOGRAPHY - Font Family
     --------------------------------------------- */
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
  
  /* ---------------------------------------------
     TYPOGRAPHY - Font Size
     --------------------------------------------- */
  --font-size-xs: 0.75rem;     /* 12px */
  --font-size-sm: 0.875rem;    /* 14px */
  --font-size-base: 1rem;      /* 16px */
  --font-size-lg: 1.125rem;    /* 18px */
  --font-size-xl: 1.25rem;     /* 20px */
  --font-size-2xl: 1.5rem;     /* 24px */
  --font-size-3xl: 1.875rem;   /* 30px */
  --font-size-4xl: 2.25rem;    /* 36px */
  --font-size-5xl: 3rem;       /* 48px */
  --font-size-6xl: 3.75rem;    /* 60px */
  
  /* ---------------------------------------------
     TYPOGRAPHY - Line Height
     --------------------------------------------- */
  --line-height-none: 1;
  --line-height-tight: 1.25;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  --line-height-loose: 2;
  
  /* ---------------------------------------------
     TYPOGRAPHY - Font Weight
     --------------------------------------------- */
  --font-weight-thin: 100;
  --font-weight-extralight: 200;
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;
  --font-weight-black: 900;
  
  /* ---------------------------------------------
     BORDER RADIUS
     --------------------------------------------- */
  --radius-none: 0;
  --radius-sm: 0.125rem;       /* 2px */
  --radius-DEFAULT: 0.25rem;   /* 4px */
  --radius-md: 0.375rem;       /* 6px */
  --radius-lg: 0.5rem;         /* 8px */
  --radius-xl: 0.75rem;        /* 12px */
  --radius-2xl: 1rem;          /* 16px */
  --radius-3xl: 1.5rem;        /* 24px */
  --radius-full: 9999px;
  
  /* Component-specific radius */
  --radius: 0.5rem;
  
  /* ---------------------------------------------
     SHADOWS
     --------------------------------------------- */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-DEFAULT: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
  --shadow-none: 0 0 #0000;
  
  /* ---------------------------------------------
     TRANSITIONS
     --------------------------------------------- */
  --transition-none: none;
  --transition-all: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-DEFAULT: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-colors: color, background-color, border-color, text-decoration-color, fill, stroke 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-opacity: opacity 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-shadow: box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-transform: transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Duration */
  --duration-75: 75ms;
  --duration-100: 100ms;
  --duration-150: 150ms;
  --duration-200: 200ms;
  --duration-300: 300ms;
  --duration-500: 500ms;
  --duration-700: 700ms;
  --duration-1000: 1000ms;
  
  /* ---------------------------------------------
     Z-INDEX SCALE
     --------------------------------------------- */
  --z-0: 0;
  --z-10: 10;
  --z-20: 20;
  --z-30: 30;
  --z-40: 40;
  --z-50: 50;
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
  
  /* ---------------------------------------------
     LAYOUT
     --------------------------------------------- */
  --sidebar-width: 16rem;        /* 256px */
  --sidebar-collapsed-width: 4rem; /* 64px */
  --header-height: 4rem;         /* 64px */
  --container-max-width: 80rem;  /* 1280px */
}

/* =============================================
   DARK MODE OVERRIDES
   ============================================= */

.dark {
  --color-background: 222.2 84% 4.9%;
  --color-foreground: 210 40% 98%;
  
  --color-card: 222.2 84% 4.9%;
  --color-card-foreground: 210 40% 98%;
  
  --color-popover: 222.2 84% 4.9%;
  --color-popover-foreground: 210 40% 98%;
  
  --color-muted: 217.2 32.6% 17.5%;
  --color-muted-foreground: 215 20.2% 65.1%;
  
  --color-border: 217.2 32.6% 17.5%;
  --color-input: 217.2 32.6% 17.5%;
  --color-ring: 238 76% 68%;
}

/* =============================================
   TAILWIND THEME EXTENSION
   ============================================= */

@theme inline {
  /* Colors */
  --color-background: hsl(var(--color-background));
  --color-foreground: hsl(var(--color-foreground));
  
  --color-card: hsl(var(--color-card));
  --color-card-foreground: hsl(var(--color-card-foreground));
  
  --color-popover: hsl(var(--color-popover));
  --color-popover-foreground: hsl(var(--color-popover-foreground));
  
  --color-primary: hsl(var(--color-primary));
  --color-primary-foreground: hsl(var(--color-primary-foreground));
  
  --color-secondary: hsl(var(--color-secondary));
  --color-secondary-foreground: hsl(var(--color-secondary-foreground));
  
  --color-accent: hsl(var(--color-accent));
  --color-accent-foreground: hsl(var(--color-accent-foreground));
  
  --color-muted: hsl(var(--color-muted));
  --color-muted-foreground: hsl(var(--color-muted-foreground));
  
  --color-success: hsl(var(--color-success));
  --color-success-foreground: hsl(var(--color-success-foreground));
  
  --color-warning: hsl(var(--color-warning));
  --color-warning-foreground: hsl(var(--color-warning-foreground));
  
  --color-danger: hsl(var(--color-danger));
  --color-danger-foreground: hsl(var(--color-danger-foreground));
  
  --color-info: hsl(var(--color-info));
  --color-info-foreground: hsl(var(--color-info-foreground));
  
  --color-border: hsl(var(--color-border));
  --color-input: hsl(var(--color-input));
  --color-ring: hsl(var(--color-ring));
  
  /* Fonts */
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  
  /* Border Radius */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

/* =============================================
   BASE STYLES
   ============================================= */

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
  
  /* Focus styles */
  *:focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
  }
  
  /* Selection */
  ::selection {
    @apply bg-primary/20 text-foreground;
  }
  
  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    @apply bg-muted;
  }
  
  ::-webkit-scrollbar-thumb {
    @apply bg-muted-foreground/30 rounded-full;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-muted-foreground/50;
  }
}

/* =============================================
   TYPOGRAPHY UTILITIES
   ============================================= */

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  
  .text-pretty {
    text-wrap: pretty;
  }
  
  /* Gradient text */
  .text-gradient {
    @apply bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent;
  }
  
  /* Truncate multiline */
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

/* =============================================
   ANIMATION UTILITIES
   ============================================= */

@layer utilities {
  /* Fade in */
  .animate-in {
    animation: animate-in 200ms ease-out;
  }
  
  @keyframes animate-in {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Fade out */
  .animate-out {
    animation: animate-out 200ms ease-in;
  }
  
  @keyframes animate-out {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(4px);
    }
  }
  
  /* Slide in from right */
  .slide-in-from-right {
    animation: slide-in-from-right 200ms ease-out;
  }
  
  @keyframes slide-in-from-right {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  /* Pulse subtle */
  .animate-pulse-subtle {
    animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes pulse-subtle {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }
  
  /* Spin slow */
  .animate-spin-slow {
    animation: spin 3s linear infinite;
  }
}

/* =============================================
   COMPONENT UTILITIES
   ============================================= */

@layer utilities {
  /* Glass effect */
  .glass {
    @apply bg-background/80 backdrop-blur-md;
  }
  
  /* Gradient border */
  .border-gradient {
    border: 2px solid transparent;
    background: linear-gradient(var(--color-background), var(--color-background)) padding-box,
                linear-gradient(to right, hsl(var(--color-primary)), hsl(var(--color-secondary))) border-box;
  }
  
  /* No scrollbar */
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
}
```

### Task 3.2: Configure Tailwind

**File: `tailwind.config.ts`**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
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
        border: "hsl(var(--color-border))",
        input: "hsl(var(--color-input))",
        ring: "hsl(var(--color-ring))",
        background: "hsl(var(--color-background))",
        foreground: "hsl(var(--color-foreground))",
        primary: {
          DEFAULT: "hsl(var(--color-primary))",
          foreground: "hsl(var(--color-primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--color-secondary))",
          foreground: "hsl(var(--color-secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--color-accent))",
          foreground: "hsl(var(--color-accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--color-success))",
          foreground: "hsl(var(--color-success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--color-warning))",
          foreground: "hsl(var(--color-warning-foreground))",
        },
        danger: {
          DEFAULT: "hsl(var(--color-danger))",
          foreground: "hsl(var(--color-danger-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--color-info))",
          foreground: "hsl(var(--color-info-foreground))",
        },
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
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### Task 3.3: Install Animation Plugin

```bash
pnpm add tailwindcss-animate
```

### Task 3.4: Create Theme Provider (for dark mode)

**File: `src/components/providers/theme-provider.tsx`**

```typescript
"use client";

import * as React from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "dramac-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(defaultTheme);

  React.useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme | null;
    if (stored) {
      setTheme(stored);
    }
  }, [storageKey]);

  React.useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
```

### Task 3.5: Create Root Providers Wrapper

**File: `src/components/providers/index.tsx`**

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./theme-provider";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="dramac-theme">
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

### Task 3.6: Update Root Layout

**File: `src/app/layout.tsx`** (update)

```typescript
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { APP_NAME, APP_DESCRIPTION } from "@/config/constants";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Task 3.7: Install Geist Font

```bash
pnpm add geist
```

---

## 📐 Acceptance Criteria

- [ ] All CSS variables defined in globals.css
- [ ] Light and dark mode tokens defined
- [ ] Tailwind config extends theme with CSS variables
- [ ] Theme provider working with system/light/dark modes
- [ ] Animations defined and working
- [ ] No hardcoded colors in any component
- [ ] Custom scrollbar styled
- [ ] Focus states properly styled

---

## 🧪 Verification

Create a test page to verify all tokens:

**File: `src/app/test-tokens/page.tsx`** (temporary)

```typescript
export default function TokensTestPage() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-4xl font-bold">Design Tokens Test</h1>
      
      {/* Colors */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Colors</h2>
        <div className="flex gap-4 flex-wrap">
          <div className="w-24 h-24 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">Primary</div>
          <div className="w-24 h-24 bg-secondary rounded-lg flex items-center justify-center text-secondary-foreground">Secondary</div>
          <div className="w-24 h-24 bg-accent rounded-lg flex items-center justify-center text-accent-foreground">Accent</div>
          <div className="w-24 h-24 bg-success rounded-lg flex items-center justify-center text-success-foreground">Success</div>
          <div className="w-24 h-24 bg-warning rounded-lg flex items-center justify-center text-warning-foreground">Warning</div>
          <div className="w-24 h-24 bg-danger rounded-lg flex items-center justify-center text-danger-foreground">Danger</div>
          <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">Muted</div>
        </div>
      </section>
      
      {/* Typography */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Typography</h2>
        <p className="text-xs">Extra Small (12px)</p>
        <p className="text-sm">Small (14px)</p>
        <p className="text-base">Base (16px)</p>
        <p className="text-lg">Large (18px)</p>
        <p className="text-xl">XL (20px)</p>
        <p className="text-2xl">2XL (24px)</p>
        <p className="text-3xl">3XL (30px)</p>
        <p className="text-4xl">4XL (36px)</p>
      </section>
      
      {/* Spacing */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Spacing</h2>
        <div className="flex gap-2 items-end">
          <div className="w-4 h-4 bg-primary"></div>
          <div className="w-8 h-8 bg-primary"></div>
          <div className="w-12 h-12 bg-primary"></div>
          <div className="w-16 h-16 bg-primary"></div>
          <div className="w-20 h-20 bg-primary"></div>
        </div>
      </section>
      
      {/* Border Radius */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Border Radius</h2>
        <div className="flex gap-4">
          <div className="w-16 h-16 bg-muted rounded-sm"></div>
          <div className="w-16 h-16 bg-muted rounded-md"></div>
          <div className="w-16 h-16 bg-muted rounded-lg"></div>
          <div className="w-16 h-16 bg-muted rounded-xl"></div>
          <div className="w-16 h-16 bg-muted rounded-full"></div>
        </div>
      </section>
      
      {/* Shadows */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Shadows</h2>
        <div className="flex gap-8">
          <div className="w-24 h-24 bg-card shadow-sm rounded-lg"></div>
          <div className="w-24 h-24 bg-card shadow-md rounded-lg"></div>
          <div className="w-24 h-24 bg-card shadow-lg rounded-lg"></div>
          <div className="w-24 h-24 bg-card shadow-xl rounded-lg"></div>
        </div>
      </section>
    </div>
  );
}
```

Delete this test page after verification.

---

## 📁 Files Created/Modified This Phase

```
src/
├── app/
│   ├── globals.css (completely rewritten)
│   ├── layout.tsx (updated)
│   └── test-tokens/page.tsx (temporary)
├── components/
│   └── providers/
│       ├── index.tsx
│       └── theme-provider.tsx
tailwind.config.ts (updated)
```

---

## ➡️ Next Phase

**Phase 4: Core UI Components (Part 1)** - Create Button, Input, Card, Badge, Avatar components.
