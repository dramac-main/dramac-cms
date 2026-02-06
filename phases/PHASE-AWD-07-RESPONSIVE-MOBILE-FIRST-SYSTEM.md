# Phase AWD-07: Responsive & Mobile-First System

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 6-8 hours
> **Prerequisites**: AWD-01 Complete
> **Status**: 📋 READY TO IMPLEMENT

---
## ⚠️ BEFORE YOU BEGIN

**REQUIRED READING**: Before implementing this phase, you MUST read:

1. **[PHASE-AWD-CONTEXT.md](./PHASE-AWD-CONTEXT.md)** - Tailwind CSS configuration
2. **AWD-01**: Responsive fields in component definitions (hideOnMobile, mobileColumns, etc.)
3. **AWD-03**: How the engine applies responsive configs

**This phase DEPENDS ON AWD-01 and AWD-03** - uses responsive fields and integrates with engine.

---

## 📁 Files To Create

| File | Purpose |
|------|--------|
| `next-platform-dashboard/src/lib/ai/website-designer/responsive/types.ts` | Responsive types |
| `next-platform-dashboard/src/lib/ai/website-designer/responsive/breakpoints.ts` | Breakpoint definitions |
| `next-platform-dashboard/src/lib/ai/website-designer/responsive/rules-engine.ts` | Auto-responsive rules |
| `next-platform-dashboard/src/lib/ai/website-designer/responsive/component-configs.ts` | Per-component responsive defaults |
| `next-platform-dashboard/src/lib/ai/website-designer/responsive/index.ts` | Public exports |

---

## 📱 Tailwind Breakpoints Reference

```typescript
// Tailwind CSS 4.x breakpoints (used throughout project)
const breakpoints = {
  sm: "640px",   // Mobile landscape
  md: "768px",   // Tablet
  lg: "1024px",  // Desktop
  xl: "1280px",  // Large desktop
  "2xl": "1536px" // Extra large
};

// Mobile-first approach: base styles for mobile, then add breakpoints
// Example: "text-sm md:text-base lg:text-lg"
```

---
## 🎯 Objective

Ensure every generated website is **fully responsive** and **mobile-first** by default, with AI-powered responsive configurations that adapt layouts, typography, and interactions for all screen sizes.

**Principle:** Every website looks award-winning on every device

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    RESPONSIVE SYSTEM                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                   BREAKPOINT SYSTEM                           │ │
│  │  • Mobile: < 640px                                            │ │
│  │  • Tablet: 640px - 1024px                                     │ │
│  │  • Desktop: 1024px - 1280px                                   │ │
│  │  • Large: > 1280px                                            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│                              ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                   RESPONSIVE RULES ENGINE                     │ │
│  │  • Layout transformations                                     │ │
│  │  • Typography scaling                                         │ │
│  │  • Spacing adjustments                                        │ │
│  │  • Component visibility                                       │ │
│  │  • Interaction patterns                                       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│                              ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                   COMPONENT RESPONSIVE CONFIG                 │ │
│  │  • Per-component responsive rules                             │ │
│  │  • Mobile-specific variants                                   │ │
│  │  • Touch-friendly interactions                                │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Core Types

```typescript
// src/lib/ai/website-designer/responsive/types.ts

export interface ResponsiveConfig {
  breakpoints: BreakpointConfig;
  rules: ResponsiveRules;
  componentConfigs: Record<string, ComponentResponsiveConfig>;
}

export interface BreakpointConfig {
  mobile: { max: number };       // < 640px
  tablet: { min: number; max: number };  // 640-1024px
  desktop: { min: number; max: number }; // 1024-1280px
  large: { min: number };        // > 1280px
}

export interface ResponsiveRules {
  // Layout transformations
  layout: {
    stackColumnsOnMobile: boolean;
    reverseStackOrder: boolean;
    singleColumnBreakpoint: "mobile" | "tablet";
    maxColumnsPerBreakpoint: Record<Breakpoint, number>;
  };
  
  // Typography scaling
  typography: {
    scaleRatios: Record<Breakpoint, number>;  // e.g., mobile: 0.8
    minFontSizes: Record<string, string>;     // Minimum readable sizes
    lineHeightAdjustments: Record<Breakpoint, number>;
  };
  
  // Spacing
  spacing: {
    paddingScale: Record<Breakpoint, number>;
    gapScale: Record<Breakpoint, number>;
    sectionPadding: Record<Breakpoint, string>;
    containerPadding: Record<Breakpoint, string>;
  };
  
  // Visibility
  visibility: {
    hideOnMobile: string[];      // Component types to hide
    showOnlyOnMobile: string[];  // Mobile-specific components
    simplifyOnMobile: string[];  // Components to simplify
  };
  
  // Interactions
  interactions: {
    touchTargetMinSize: string;  // Minimum touch target (48px)
    hoverToTapConversion: boolean;
    swipeEnabled: boolean;
    pullToRefresh: boolean;
  };
}

export interface ComponentResponsiveConfig {
  componentType: string;
  mobileVariant?: string;
  tabletVariant?: string;
  layoutRules: {
    stackOnMobile: boolean;
    columnsPerBreakpoint: Record<Breakpoint, number>;
    hideElements?: string[];
    showElements?: string[];
  };
  typographyOverrides?: Record<Breakpoint, TypographyOverride>;
  spacingOverrides?: Record<Breakpoint, SpacingOverride>;
  interactionOverrides?: {
    mobileInteraction: string;
    desktopInteraction: string;
  };
}

export type Breakpoint = "mobile" | "tablet" | "desktop" | "large";

export interface TypographyOverride {
  headingSize?: string;
  bodySize?: string;
  lineHeight?: string;
}

export interface SpacingOverride {
  padding?: string;
  gap?: string;
  margin?: string;
}
```

---

## 🔧 Implementation

### 1. Responsive Rules Engine

```typescript
// src/lib/ai/website-designer/responsive/rules-engine.ts

export const defaultResponsiveRules: ResponsiveRules = {
  layout: {
    stackColumnsOnMobile: true,
    reverseStackOrder: false,
    singleColumnBreakpoint: "mobile",
    maxColumnsPerBreakpoint: {
      mobile: 1,
      tablet: 2,
      desktop: 4,
      large: 6,
    },
  },
  
  typography: {
    scaleRatios: {
      mobile: 0.875,    // 87.5% of desktop
      tablet: 0.9375,   // 93.75% of desktop
      desktop: 1,
      large: 1.0625,    // 106.25% of desktop
    },
    minFontSizes: {
      body: "14px",
      small: "12px",
      heading: "18px",
    },
    lineHeightAdjustments: {
      mobile: 1.1,      // Slightly tighter on mobile
      tablet: 1.05,
      desktop: 1,
      large: 1,
    },
  },
  
  spacing: {
    paddingScale: {
      mobile: 0.5,
      tablet: 0.75,
      desktop: 1,
      large: 1.25,
    },
    gapScale: {
      mobile: 0.75,
      tablet: 0.875,
      desktop: 1,
      large: 1.125,
    },
    sectionPadding: {
      mobile: "3rem 1rem",
      tablet: "4rem 1.5rem",
      desktop: "5rem 2rem",
      large: "6rem 2rem",
    },
    containerPadding: {
      mobile: "1rem",
      tablet: "1.5rem",
      desktop: "2rem",
      large: "2rem",
    },
  },
  
  visibility: {
    hideOnMobile: [],
    showOnlyOnMobile: [],
    simplifyOnMobile: ["Navbar", "Footer", "Gallery"],
  },
  
  interactions: {
    touchTargetMinSize: "48px",
    hoverToTapConversion: true,
    swipeEnabled: true,
    pullToRefresh: false,
  },
};

export function applyResponsiveRules(
  componentProps: Record<string, any>,
  componentType: string,
  rules: ResponsiveRules
): Record<string, any> {
  const config = getComponentResponsiveConfig(componentType);
  
  return {
    ...componentProps,
    
    // Add responsive classes
    responsive: {
      // Mobile layout
      mobileLayout: config.layoutRules.stackOnMobile ? "stack" : "grid",
      mobileColumns: config.layoutRules.columnsPerBreakpoint.mobile,
      tabletColumns: config.layoutRules.columnsPerBreakpoint.tablet,
      desktopColumns: config.layoutRules.columnsPerBreakpoint.desktop,
      
      // Mobile visibility
      hideOnMobile: componentProps.hideOnMobile ?? false,
      hideOnTablet: componentProps.hideOnTablet ?? false,
      hideOnDesktop: componentProps.hideOnDesktop ?? false,
      
      // Mobile-specific variant
      mobileVariant: config.mobileVariant,
      
      // Typography scaling
      mobileTypographyScale: rules.typography.scaleRatios.mobile,
      
      // Spacing scaling
      mobilePaddingScale: rules.spacing.paddingScale.mobile,
      
      // Touch-friendly
      touchFriendly: true,
      minTouchTarget: rules.interactions.touchTargetMinSize,
    },
  };
}
```

### 2. Component Responsive Configs

```typescript
// src/lib/ai/website-designer/responsive/component-configs.ts

export const componentResponsiveConfigs: Record<string, ComponentResponsiveConfig> = {
  // === HERO ===
  Hero: {
    componentType: "Hero",
    mobileVariant: "stacked",
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 2, large: 2 },
      hideElements: ["decorativeShapes"],
    },
    typographyOverrides: {
      mobile: { headingSize: "3xl", bodySize: "base" },
      tablet: { headingSize: "4xl", bodySize: "lg" },
      desktop: { headingSize: "5xl", bodySize: "xl" },
    },
    spacingOverrides: {
      mobile: { padding: "3rem 1rem" },
      tablet: { padding: "4rem 1.5rem" },
      desktop: { padding: "5rem 2rem" },
    },
  },
  
  // === NAVBAR ===
  Navbar: {
    componentType: "Navbar",
    mobileVariant: "hamburger",
    layoutRules: {
      stackOnMobile: false,
      columnsPerBreakpoint: { mobile: 2, tablet: 2, desktop: 3, large: 3 },
      hideElements: ["desktopMenu"],
      showElements: ["hamburgerButton"],
    },
    interactionOverrides: {
      mobileInteraction: "drawer",
      desktopInteraction: "dropdown",
    },
  },
  
  // === FEATURES ===
  Features: {
    componentType: "Features",
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 3, large: 4 },
    },
    typographyOverrides: {
      mobile: { headingSize: "lg", bodySize: "sm" },
    },
  },
  
  // === TESTIMONIALS ===
  Testimonials: {
    componentType: "Testimonials",
    mobileVariant: "carousel",
    layoutRules: {
      stackOnMobile: false, // Use carousel instead
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 3, large: 4 },
    },
    interactionOverrides: {
      mobileInteraction: "swipe",
      desktopInteraction: "grid",
    },
  },
  
  // === GALLERY ===
  Gallery: {
    componentType: "Gallery",
    mobileVariant: "carousel",
    layoutRules: {
      stackOnMobile: false,
      columnsPerBreakpoint: { mobile: 2, tablet: 3, desktop: 4, large: 5 },
    },
    interactionOverrides: {
      mobileInteraction: "swipe-lightbox",
      desktopInteraction: "hover-lightbox",
    },
  },
  
  // === TEAM ===
  Team: {
    componentType: "Team",
    layoutRules: {
      stackOnMobile: false,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 3, large: 4 },
    },
    typographyOverrides: {
      mobile: { headingSize: "md", bodySize: "xs" },
    },
  },
  
  // === PRICING ===
  Pricing: {
    componentType: "Pricing",
    mobileVariant: "stacked",
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 3, large: 3 },
    },
    spacingOverrides: {
      mobile: { gap: "1rem" },
      desktop: { gap: "2rem" },
    },
  },
  
  // === FOOTER ===
  Footer: {
    componentType: "Footer",
    mobileVariant: "stacked",
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 4, large: 5 },
    },
  },
  
  // === FAQ ===
  FAQ: {
    componentType: "FAQ",
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 2, large: 2 },
    },
  },
  
  // === CTA ===
  CTA: {
    componentType: "CTA",
    mobileVariant: "centered",
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 2, large: 2 },
    },
    typographyOverrides: {
      mobile: { headingSize: "2xl" },
      desktop: { headingSize: "4xl" },
    },
  },
  
  // === STATS ===
  Stats: {
    componentType: "Stats",
    layoutRules: {
      stackOnMobile: false,
      columnsPerBreakpoint: { mobile: 2, tablet: 4, desktop: 4, large: 4 },
    },
    typographyOverrides: {
      mobile: { headingSize: "2xl" },
      desktop: { headingSize: "4xl" },
    },
  },
  
  // === COLUMNS ===
  Columns: {
    componentType: "Columns",
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 4, large: 6 },
    },
  },
  
  // === CARD ===
  Card: {
    componentType: "Card",
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 3, large: 4 },
    },
  },
  
  // === CAROUSEL ===
  Carousel: {
    componentType: "Carousel",
    layoutRules: {
      stackOnMobile: false,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 3, large: 4 },
    },
    interactionOverrides: {
      mobileInteraction: "swipe",
      desktopInteraction: "arrows",
    },
  },
  
  // === TABS ===
  Tabs: {
    componentType: "Tabs",
    mobileVariant: "accordion",
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 1, desktop: 1, large: 1 },
    },
    interactionOverrides: {
      mobileInteraction: "accordion",
      desktopInteraction: "tabs",
    },
  },
};

export function getComponentResponsiveConfig(componentType: string): ComponentResponsiveConfig {
  return componentResponsiveConfigs[componentType] || {
    componentType,
    layoutRules: {
      stackOnMobile: true,
      columnsPerBreakpoint: { mobile: 1, tablet: 2, desktop: 3, large: 4 },
    },
  };
}
```

### 3. Mobile-First Utility Classes

```typescript
// src/lib/ai/website-designer/responsive/utilities.ts

export const responsiveUtilities = {
  // Grid system
  grid: {
    mobile: "grid-cols-1",
    tablet: "sm:grid-cols-2",
    desktop: "lg:grid-cols-3",
    large: "xl:grid-cols-4",
  },
  
  // Flex direction
  flex: {
    mobileStack: "flex-col",
    tabletRow: "sm:flex-row",
  },
  
  // Text sizes
  text: {
    heroHeadline: {
      mobile: "text-3xl",
      tablet: "sm:text-4xl",
      desktop: "lg:text-5xl",
      large: "xl:text-6xl",
    },
    sectionHeadline: {
      mobile: "text-2xl",
      tablet: "sm:text-3xl",
      desktop: "lg:text-4xl",
    },
    body: {
      mobile: "text-base",
      tablet: "sm:text-lg",
    },
  },
  
  // Padding
  padding: {
    section: {
      mobile: "py-12 px-4",
      tablet: "sm:py-16 sm:px-6",
      desktop: "lg:py-20 lg:px-8",
      large: "xl:py-24",
    },
    container: {
      mobile: "px-4",
      tablet: "sm:px-6",
      desktop: "lg:px-8",
    },
  },
  
  // Gap
  gap: {
    small: {
      mobile: "gap-4",
      tablet: "sm:gap-6",
      desktop: "lg:gap-8",
    },
    medium: {
      mobile: "gap-6",
      tablet: "sm:gap-8",
      desktop: "lg:gap-10",
    },
    large: {
      mobile: "gap-8",
      tablet: "sm:gap-12",
      desktop: "lg:gap-16",
    },
  },
  
  // Display
  display: {
    hideOnMobile: "hidden sm:block",
    showOnMobileOnly: "block sm:hidden",
    hideOnTablet: "sm:hidden lg:block",
    hideOnDesktop: "lg:hidden",
  },
  
  // Touch targets
  touch: {
    button: "min-h-[48px] min-w-[48px]",
    link: "py-3 px-4",  // Increased tap area
    icon: "p-3",        // Padded icons
  },
};

export function generateResponsiveClasses(
  componentType: string,
  variant: string
): string {
  const config = getComponentResponsiveConfig(componentType);
  const classes: string[] = [];
  
  // Grid classes based on columns
  const { columnsPerBreakpoint } = config.layoutRules;
  
  if (columnsPerBreakpoint.mobile === 1) {
    classes.push("grid-cols-1");
  } else {
    classes.push(`grid-cols-${columnsPerBreakpoint.mobile}`);
  }
  
  if (columnsPerBreakpoint.tablet !== columnsPerBreakpoint.mobile) {
    classes.push(`sm:grid-cols-${columnsPerBreakpoint.tablet}`);
  }
  
  if (columnsPerBreakpoint.desktop !== columnsPerBreakpoint.tablet) {
    classes.push(`lg:grid-cols-${columnsPerBreakpoint.desktop}`);
  }
  
  if (columnsPerBreakpoint.large !== columnsPerBreakpoint.desktop) {
    classes.push(`xl:grid-cols-${columnsPerBreakpoint.large}`);
  }
  
  // Stack on mobile
  if (config.layoutRules.stackOnMobile) {
    classes.push("flex flex-col sm:grid");
  }
  
  return classes.join(" ");
}
```

### 4. AI Responsive Configuration

```typescript
// src/lib/ai/website-designer/responsive/ai-config.ts

import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

export async function generateResponsiveConfig(
  componentType: string,
  componentProps: Record<string, any>,
  industryType: string
): Promise<ComponentResponsiveConfig> {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-20250514"),
    schema: z.object({
      mobileVariant: z.string().optional(),
      mobileColumns: z.number().min(1).max(2),
      tabletColumns: z.number().min(1).max(4),
      desktopColumns: z.number().min(1).max(6),
      stackOnMobile: z.boolean(),
      mobileInteraction: z.enum(["tap", "swipe", "accordion", "drawer", "none"]),
      hideElementsOnMobile: z.array(z.string()),
      mobileTypographyScale: z.number().min(0.7).max(1),
    }),
    prompt: `Generate optimal responsive configuration for a ${componentType} component.

Industry: ${industryType}
Current props: ${JSON.stringify(componentProps, null, 2)}

Consider:
1. Mobile usability (touch targets, readability)
2. Information hierarchy on small screens
3. Industry conventions for mobile layouts
4. Performance (hide unnecessary elements)
5. User expectations for ${industryType} websites

Return the optimal responsive configuration.
`,
  });
  
  return {
    componentType,
    mobileVariant: object.mobileVariant,
    layoutRules: {
      stackOnMobile: object.stackOnMobile,
      columnsPerBreakpoint: {
        mobile: object.mobileColumns,
        tablet: object.tabletColumns,
        desktop: object.desktopColumns,
        large: object.desktopColumns,
      },
      hideElements: object.hideElementsOnMobile,
    },
    interactionOverrides: {
      mobileInteraction: object.mobileInteraction,
      desktopInteraction: "default",
    },
  };
}
```

---

## 📋 Implementation Tasks

### Task 1: Breakpoint System (1 hour)
- Define breakpoints
- Create utility functions
- Test across devices

### Task 2: Responsive Rules Engine (2 hours)
- Implement layout transformations
- Add typography scaling
- Configure spacing adjustments

### Task 3: Component Configs (2 hours)
- Create configs for all 53 components
- Define mobile variants
- Set interaction overrides

### Task 4: Utility Classes (1 hour)
- Generate responsive utility classes
- Create class generator functions
- Test output

### Task 5: Integration (2 hours)
- Connect to component generator
- Apply responsive configs
- Test full pipeline

---

## ✅ Completion Checklist

- [ ] Breakpoint system defined
- [ ] Responsive rules engine working
- [ ] All component configs created
- [ ] Mobile variants defined
- [ ] Touch interactions configured
- [ ] Typography scaling working
- [ ] Spacing adjustments working
- [ ] Visibility rules working
- [ ] Utility class generator working
- [ ] Integration complete
- [ ] Tested on all device sizes

---

## 📁 Files Created

```
src/lib/ai/website-designer/responsive/
├── types.ts
├── rules-engine.ts
├── component-configs.ts
├── utilities.ts
├── ai-config.ts
└── index.ts
```

---

**READY TO IMPLEMENT! 🚀**
