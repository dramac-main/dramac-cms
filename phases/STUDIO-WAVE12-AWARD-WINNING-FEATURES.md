# DRAMAC Studio Wave 12: Component Superpowers & Award-Winning Features

## 🎯 MISSION

After Wave 11 fixes the core functionality, Wave 12 transforms DRAMAC Studio into a truly award-winning website builder. This wave focuses on making components highly customizable for AI, adding 3D effects, advanced animations, and the power needed to create stunning websites.

**This is a 2-PHASE wave:**
- **Phase 30**: Component Superpowers (Enhanced props, AI integration, maximum customization)
- **Phase 31**: Award-Winning Features (3D effects, advanced animations, micro-interactions)

---

## 📊 CURRENT STATE ANALYSIS

### Component Inventory (from `core-components.ts`)
```
Category       | Count | Current State
---------------|-------|---------------
Layout         | 6     | Section, Container, Columns, Card, Spacer, Divider
Typography     | 2     | Heading, Text
Buttons        | 1     | Button
Media          | 3     | Image, Video, Map
Sections       | 8     | Hero, Features, CTA, Testimonials, FAQ, Stats, Team, Gallery
Navigation     | 3     | Navbar, Footer, SocialLinks
Forms          | 4     | Form, FormField, ContactForm, Newsletter
Content        | 3     | RichText, Quote, CodeBlock
Interactive    | 4     | Carousel, Countdown, Typewriter, Parallax
Marketing      | 5     | AnnouncementBar, SocialProof, TrustBadges, LogoCloud, ComparisonTable
E-commerce     | 6     | ProductGrid, ProductCard, ProductCategories, CartSummary, FeaturedProducts, CartIcon
---------------|-------|---------------
TOTAL          | 45    | Need enhancement for AI/customization
```

### What "Highly Customizable for AI" Means

The AI needs to be able to:
1. **Modify any visual property** - colors, spacing, sizes, fonts
2. **Change content intelligently** - text, images, links
3. **Apply style variations** - themes, moods, industries
4. **Create combinations** - layouts, component groups
5. **Understand context** - what looks good together

### Current AI Configuration in Components
```typescript
// Example from Hero component
ai: {
  description: "A hero section with title, subtitle, and call-to-action button",
  canModify: ["title", "subtitle", "buttonText", "backgroundColor", "alignment"],
  suggestions: ["Make title more impactful", "Add urgency to CTA", "Change color scheme"],
}
```

**Problems:**
- `canModify` lists are incomplete (missing animation, hover, responsive props)
- `suggestions` are generic
- No AI "personality" instructions
- No component relationship data

---

## 🔧 PHASE 30: Component Superpowers

### Estimated Time: 14-18 hours
### Files: core-components.ts, renders.tsx, 5+ new files

---

### Task 30.1: Enhanced AI Configuration System

**Create a comprehensive AI metadata system for components.**

```typescript
// src/lib/studio/ai/component-ai-config.ts

export interface ComponentAIConfig {
  /** Natural language description for AI context */
  description: string;
  
  /** What this component is used for */
  purpose: "structure" | "content" | "action" | "decoration" | "navigation" | "conversion";
  
  /** Industry/context suggestions */
  industries: string[];
  
  /** All modifiable properties (AI can change these) */
  modifiableProps: {
    prop: string;
    type: "text" | "color" | "number" | "select" | "toggle" | "image" | "array";
    aiInstructions?: string;
  }[];
  
  /** Properties that work well together */
  propCombinations: {
    name: string;
    props: Record<string, unknown>;
    description: string;
  }[];
  
  /** Suggested modifications with examples */
  suggestions: {
    prompt: string;
    changes: Record<string, unknown>;
    resultDescription: string;
  }[];
  
  /** Related components that pair well */
  relatedComponents: {
    type: string;
    relationship: "before" | "after" | "inside" | "alongside";
    description: string;
  }[];
  
  /** Style presets for quick AI application */
  stylePresets: {
    name: string;
    mood: string;
    props: Record<string, unknown>;
  }[];
  
  /** Accessibility considerations */
  accessibility: {
    requiredProps: string[];
    recommendations: string[];
  };
  
  /** SEO considerations */
  seo: {
    importantProps: string[];
    recommendations: string[];
  };
}

// Example: Enhanced Hero AI Config
export const HERO_AI_CONFIG: ComponentAIConfig = {
  description: "A hero section is the first thing visitors see. It should immediately communicate value and encourage action.",
  
  purpose: "conversion",
  
  industries: ["saas", "ecommerce", "agency", "startup", "portfolio", "restaurant", "fitness", "healthcare"],
  
  modifiableProps: [
    { prop: "title", type: "text", aiInstructions: "Make it punchy, benefit-focused, under 10 words" },
    { prop: "subtitle", type: "text", aiInstructions: "Expand on value proposition, 1-2 sentences" },
    { prop: "buttonText", type: "text", aiInstructions: "Action-oriented, creates urgency" },
    { prop: "buttonLink", type: "text", aiInstructions: "Primary conversion path" },
    { prop: "secondaryButtonText", type: "text", aiInstructions: "Lower commitment option" },
    { prop: "layout", type: "select", aiInstructions: "Match industry conventions" },
    { prop: "backgroundType", type: "select", aiInstructions: "Image for emotion, video for engagement, gradient for modern" },
    { prop: "backgroundColor", type: "color", aiInstructions: "Match brand, ensure contrast" },
    { prop: "backgroundImage", type: "image", aiInstructions: "High quality, relevant to industry" },
    { prop: "backgroundVideo", type: "text", aiInstructions: "Subtle, loops well, no audio" },
    { prop: "textColor", type: "color", aiInstructions: "MUST have 4.5:1 contrast ratio with background" },
    { prop: "overlay", type: "toggle", aiInstructions: "Enable when text is hard to read on background" },
    { prop: "overlayOpacity", type: "number", aiInstructions: "40-70 for most cases" },
    { prop: "minHeight", type: "number", aiInstructions: "600-800 for impact, 400-500 for compact" },
    { prop: "fullHeight", type: "toggle", aiInstructions: "Use for maximum impact landing pages" },
    { prop: "animation", type: "select", aiInstructions: "fade-up is professional, zoom-in is energetic" },
    { prop: "titleSize", type: "select", aiInstructions: "2xl for short titles, xl for longer" },
  ],
  
  propCombinations: [
    {
      name: "Dark & Bold",
      props: { backgroundColor: "#111827", textColor: "#ffffff", overlayOpacity: 70 },
      description: "High contrast, professional, modern tech feel",
    },
    {
      name: "Light & Airy",
      props: { backgroundColor: "#ffffff", textColor: "#1f2937", minHeight: 500 },
      description: "Clean, minimalist, approachable",
    },
    {
      name: "Video Impact",
      props: { backgroundType: "video", overlay: true, overlayOpacity: 60, fullHeight: true },
      description: "Maximum engagement, memorable first impression",
    },
    {
      name: "Split Professional",
      props: { layout: "split-right", minHeight: 600 },
      description: "Balance between text and visual, professional",
    },
  ],
  
  suggestions: [
    {
      prompt: "Make it more urgent",
      changes: { buttonText: "Get Started Now", subtitle: "Limited time offer - Start your free trial today" },
      resultDescription: "Added urgency language to drive immediate action",
    },
    {
      prompt: "Make it more professional",
      changes: { layout: "split-right", animation: "fade-up", backgroundType: "color", backgroundColor: "#1f2937" },
      resultDescription: "Clean split layout with subtle animation for corporate feel",
    },
    {
      prompt: "Add video background",
      changes: { backgroundType: "video", overlay: true, overlayOpacity: 50 },
      resultDescription: "Engaging video background with readable overlay",
    },
  ],
  
  relatedComponents: [
    { type: "Navbar", relationship: "before", description: "Navigation should precede hero" },
    { type: "Features", relationship: "after", description: "Features expand on hero value proposition" },
    { type: "TrustBadges", relationship: "after", description: "Build credibility after hero" },
    { type: "Stats", relationship: "after", description: "Quantify value proposition" },
  ],
  
  stylePresets: [
    { name: "SaaS Startup", mood: "modern", props: { backgroundType: "gradient", gradientFrom: "#667eea", gradientTo: "#764ba2", animation: "fade-up" } },
    { name: "E-commerce", mood: "energetic", props: { backgroundType: "image", overlay: true, buttonText: "Shop Now" } },
    { name: "Corporate", mood: "professional", props: { layout: "split-right", backgroundColor: "#1f2937", animation: "fade-in" } },
    { name: "Creative Agency", mood: "bold", props: { fullHeight: true, backgroundType: "video", titleSize: "3xl" } },
    { name: "Restaurant", mood: "warm", props: { backgroundImage: "food-hero.jpg", overlay: true, overlayOpacity: 40 } },
  ],
  
  accessibility: {
    requiredProps: ["textColor", "backgroundColor"],
    recommendations: [
      "Ensure 4.5:1 contrast ratio between text and background",
      "Use overlay when background image makes text hard to read",
      "Button text should be descriptive (not just 'Click Here')",
    ],
  },
  
  seo: {
    importantProps: ["title", "subtitle"],
    recommendations: [
      "Title should include primary keyword",
      "Subtitle should include secondary keywords naturally",
      "Use heading hierarchy (H1 for title)",
    ],
  },
};

// Export all component AI configs
export const COMPONENT_AI_CONFIGS: Record<string, ComponentAIConfig> = {
  Hero: HERO_AI_CONFIG,
  // ... add for all components
};
```

---

### Task 30.2: Universal Component Props

**Add these props to EVERY component for maximum customization.**

```typescript
// src/lib/studio/registry/universal-props.ts

export const universalVisualProps = {
  // Spacing
  marginTop: { type: "select", label: "Margin Top", options: presetOptions.margin },
  marginBottom: { type: "select", label: "Margin Bottom", options: presetOptions.margin },
  paddingTop: { type: "select", label: "Padding Top", options: presetOptions.padding },
  paddingBottom: { type: "select", label: "Padding Bottom", options: presetOptions.padding },
  paddingLeft: { type: "select", label: "Padding Left", options: presetOptions.padding },
  paddingRight: { type: "select", label: "Padding Right", options: presetOptions.padding },
  
  // Background
  backgroundColor: { type: "color", label: "Background Color" },
  backgroundGradient: { type: "gradient", label: "Background Gradient" },
  backgroundImage: { type: "image", label: "Background Image" },
  backgroundPosition: { 
    type: "select", 
    label: "Background Position",
    options: [
      { label: "Center", value: "center" },
      { label: "Top", value: "top" },
      { label: "Bottom", value: "bottom" },
      { label: "Left", value: "left" },
      { label: "Right", value: "right" },
    ],
  },
  backgroundSize: {
    type: "select",
    label: "Background Size",
    options: [
      { label: "Cover", value: "cover" },
      { label: "Contain", value: "contain" },
      { label: "Auto", value: "auto" },
    ],
  },
  
  // Border
  borderWidth: { type: "number", label: "Border Width", min: 0, max: 10 },
  borderColor: { type: "color", label: "Border Color" },
  borderRadius: { type: "select", label: "Border Radius", options: presetOptions.borderRadius },
  borderStyle: {
    type: "select",
    label: "Border Style",
    options: [
      { label: "None", value: "none" },
      { label: "Solid", value: "solid" },
      { label: "Dashed", value: "dashed" },
      { label: "Dotted", value: "dotted" },
    ],
  },
  
  // Shadow
  shadow: { type: "select", label: "Shadow", options: presetOptions.shadow },
  
  // Animation
  animation: { type: "select", label: "Animation", options: animationOptions },
  animationDelay: { type: "number", label: "Animation Delay (ms)", min: 0, max: 3000 },
  animationDuration: { type: "number", label: "Animation Duration (ms)", min: 100, max: 3000 },
  
  // Hover Effects
  hoverEffect: {
    type: "select",
    label: "Hover Effect",
    options: [
      { label: "None", value: "none" },
      { label: "Lift", value: "lift" },
      { label: "Scale", value: "scale" },
      { label: "Glow", value: "glow" },
      { label: "Darken", value: "darken" },
      { label: "Brighten", value: "brighten" },
    ],
  },
  
  // Visibility
  hideOnMobile: { type: "toggle", label: "Hide on Mobile" },
  hideOnTablet: { type: "toggle", label: "Hide on Tablet" },
  hideOnDesktop: { type: "toggle", label: "Hide on Desktop" },
  
  // Advanced
  customCSS: { type: "code", label: "Custom CSS" },
  customClasses: { type: "text", label: "Custom Classes" },
  dataAttributes: { type: "text", label: "Data Attributes (key=value, comma separated)" },
  ariaLabel: { type: "text", label: "ARIA Label" },
};

// Apply universal props to component definition
export function withUniversalProps(definition: ComponentDefinition): ComponentDefinition {
  return {
    ...definition,
    fields: {
      ...definition.fields,
      // Add collapsible "Advanced" section with universal props
      _advancedSection: {
        type: "section",
        label: "Advanced",
        collapsed: true,
        fields: universalVisualProps,
      },
    },
  };
}
```

---

### Task 30.3: Enhanced Render Wrapper

**Create a wrapper that applies universal props to all components.**

```typescript
// src/lib/studio/blocks/render-wrapper.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface UniversalProps {
  // Spacing
  marginTop?: string;
  marginBottom?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
  
  // Background
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundImage?: string;
  backgroundPosition?: string;
  backgroundSize?: string;
  
  // Border
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: string;
  borderStyle?: string;
  
  // Shadow
  shadow?: string;
  
  // Animation
  animation?: string;
  animationDelay?: number;
  animationDuration?: number;
  
  // Hover
  hoverEffect?: string;
  
  // Visibility
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  
  // Advanced
  customCSS?: string;
  customClasses?: string;
  dataAttributes?: string;
  ariaLabel?: string;
  
  // Component ID
  id?: string;
  
  // Children
  children: React.ReactNode;
}

const marginMap: Record<string, string> = {
  none: "", xs: "m-1", sm: "m-2", md: "m-4", lg: "m-6", xl: "m-8", "2xl": "m-12",
};

const paddingMap: Record<string, string> = {
  none: "", xs: "p-1", sm: "p-2", md: "p-4", lg: "p-6", xl: "p-8", "2xl": "p-12",
};

const shadowMap: Record<string, string> = {
  none: "", sm: "shadow-sm", md: "shadow-md", lg: "shadow-lg", xl: "shadow-xl", "2xl": "shadow-2xl",
};

const borderRadiusMap: Record<string, string> = {
  none: "", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl", full: "rounded-full",
};

const animationMap: Record<string, string> = {
  none: "",
  "fade-in": "animate-fade-in",
  "fade-up": "animate-fade-up",
  "fade-down": "animate-fade-down",
  "slide-left": "animate-slide-left",
  "slide-right": "animate-slide-right",
  "zoom-in": "animate-zoom-in",
  "bounce": "animate-bounce",
  "pulse": "animate-pulse",
};

const hoverMap: Record<string, string> = {
  none: "",
  lift: "transition-transform duration-300 hover:-translate-y-2",
  scale: "transition-transform duration-300 hover:scale-105",
  glow: "transition-shadow duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]",
  darken: "transition-opacity duration-300 hover:opacity-80",
  brighten: "transition-all duration-300 hover:brightness-110",
};

export function RenderWrapper({
  marginTop,
  marginBottom,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  backgroundColor,
  backgroundGradient,
  backgroundImage,
  backgroundPosition = "center",
  backgroundSize = "cover",
  borderWidth,
  borderColor,
  borderRadius,
  borderStyle = "solid",
  shadow,
  animation,
  animationDelay = 0,
  animationDuration,
  hoverEffect,
  hideOnMobile,
  hideOnTablet,
  hideOnDesktop,
  customCSS,
  customClasses,
  dataAttributes,
  ariaLabel,
  id,
  children,
}: UniversalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Scroll animation trigger
  useEffect(() => {
    if (!animation?.startsWith("scroll-")) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [animation]);
  
  // Build classes
  const classes = cn(
    // Margin
    marginTop && marginMap[marginTop]?.replace("m-", "mt-"),
    marginBottom && marginMap[marginBottom]?.replace("m-", "mb-"),
    // Padding
    paddingTop && paddingMap[paddingTop]?.replace("p-", "pt-"),
    paddingBottom && paddingMap[paddingBottom]?.replace("p-", "pb-"),
    paddingLeft && paddingMap[paddingLeft]?.replace("p-", "pl-"),
    paddingRight && paddingMap[paddingRight]?.replace("p-", "pr-"),
    // Shadow
    shadow && shadowMap[shadow],
    // Border radius
    borderRadius && borderRadiusMap[borderRadius],
    // Animation
    animation && !animation.startsWith("scroll-") && animationMap[animation],
    animation?.startsWith("scroll-") && isVisible && animationMap[animation.replace("scroll-", "")],
    // Hover
    hoverEffect && hoverMap[hoverEffect],
    // Visibility
    hideOnMobile && "hidden md:block",
    hideOnTablet && "block md:hidden lg:block",
    hideOnDesktop && "block lg:hidden",
    // Custom classes
    customClasses,
  );
  
  // Build styles
  const styles: React.CSSProperties = {
    backgroundColor,
    backgroundImage: backgroundGradient || (backgroundImage ? `url(${backgroundImage})` : undefined),
    backgroundPosition,
    backgroundSize,
    borderWidth: borderWidth ? `${borderWidth}px` : undefined,
    borderColor,
    borderStyle: borderWidth ? borderStyle : undefined,
    animationDelay: animationDelay ? `${animationDelay}ms` : undefined,
    animationDuration: animationDuration ? `${animationDuration}ms` : undefined,
  };
  
  // Parse data attributes
  const dataAttrs: Record<string, string> = {};
  if (dataAttributes) {
    dataAttributes.split(",").forEach((pair) => {
      const [key, value] = pair.trim().split("=");
      if (key && value) {
        dataAttrs[`data-${key.trim()}`] = value.trim();
      }
    });
  }
  
  return (
    <div
      ref={ref}
      id={id}
      className={classes}
      style={styles}
      aria-label={ariaLabel}
      {...dataAttrs}
    >
      {children}
      {customCSS && (
        <style dangerouslySetInnerHTML={{ __html: `#${id} { ${customCSS} }` }} />
      )}
    </div>
  );
}
```

---

### Task 30.4: AI Quick Actions Enhancement

**Enhance AI quick actions to work with any component.**

```typescript
// src/lib/studio/ai/quick-actions.ts

import { componentRegistry } from "../registry";
import { COMPONENT_AI_CONFIGS } from "./component-ai-config";

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  description: string;
  applicableTo: string[] | "all";
  execute: (componentId: string, componentType: string, currentProps: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "improve-text",
    label: "Improve Text",
    icon: "✨",
    description: "Make text more compelling and professional",
    applicableTo: ["Heading", "Text", "Hero", "CTA", "Features", "Button"],
    execute: async (componentId, componentType, currentProps) => {
      const textProps = ["text", "title", "subtitle", "buttonText", "description"];
      const updates: Record<string, unknown> = {};
      
      for (const prop of textProps) {
        if (currentProps[prop] && typeof currentProps[prop] === "string") {
          const improved = await callAI(`Improve this ${prop} for a ${componentType}: "${currentProps[prop]}". Make it more compelling, professional, and actionable. Return only the improved text.`);
          updates[prop] = improved;
        }
      }
      
      return updates;
    },
  },
  
  {
    id: "change-colors",
    label: "New Colors",
    icon: "🎨",
    description: "Apply a fresh color scheme",
    applicableTo: "all",
    execute: async (componentId, componentType, currentProps) => {
      const colorSchemes = [
        { bg: "#1f2937", text: "#ffffff", accent: "#3b82f6" },
        { bg: "#ffffff", text: "#1f2937", accent: "#8b5cf6" },
        { bg: "#0f172a", text: "#e2e8f0", accent: "#22c55e" },
        { bg: "#fef3c7", text: "#92400e", accent: "#f59e0b" },
        { bg: "#f0fdf4", text: "#166534", accent: "#22c55e" },
      ];
      
      const scheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
      
      return {
        backgroundColor: scheme.bg,
        textColor: scheme.text,
        color: scheme.text,
        buttonColor: scheme.accent,
      };
    },
  },
  
  {
    id: "add-animation",
    label: "Animate",
    icon: "🎬",
    description: "Add entrance animation",
    applicableTo: "all",
    execute: async (componentId, componentType, currentProps) => {
      const animations = ["fade-up", "fade-in", "slide-left", "zoom-in"];
      const animation = animations[Math.floor(Math.random() * animations.length)];
      
      return {
        animation,
        animationDelay: Math.floor(Math.random() * 300),
      };
    },
  },
  
  {
    id: "make-responsive",
    label: "Mobile Fix",
    icon: "📱",
    description: "Optimize for mobile devices",
    applicableTo: "all",
    execute: async (componentId, componentType, currentProps) => {
      return {
        // Reduce padding on mobile
        paddingTop: { mobile: "sm", tablet: "md", desktop: "lg" },
        paddingBottom: { mobile: "sm", tablet: "md", desktop: "lg" },
        // Reduce font sizes
        fontSize: { mobile: "base", tablet: "lg", desktop: "xl" },
        // Stack columns
        layout: { mobile: "stack", tablet: "grid", desktop: "grid" },
      };
    },
  },
  
  {
    id: "add-hover",
    label: "Hover Effect",
    icon: "👆",
    description: "Add interactive hover effect",
    applicableTo: ["Card", "Button", "Image", "ProductCard"],
    execute: async () => {
      const effects = ["lift", "scale", "glow"];
      return {
        hoverEffect: effects[Math.floor(Math.random() * effects.length)],
      };
    },
  },
  
  {
    id: "add-shadow",
    label: "Add Depth",
    icon: "🌑",
    description: "Add shadow for depth",
    applicableTo: ["Card", "Section", "Container", "Hero"],
    execute: async (componentId, componentType, currentProps) => {
      return {
        shadow: currentProps.shadow === "lg" ? "xl" : "lg",
      };
    },
  },
  
  {
    id: "make-bold",
    label: "Make Bold",
    icon: "💪",
    description: "Increase visual impact",
    applicableTo: ["Hero", "CTA", "Heading"],
    execute: async (componentId, componentType, currentProps) => {
      return {
        titleSize: "3xl",
        minHeight: 700,
        animation: "zoom-in",
        backgroundType: "gradient",
        gradientFrom: "#667eea",
        gradientTo: "#764ba2",
        textColor: "#ffffff",
      };
    },
  },
  
  {
    id: "simplify",
    label: "Simplify",
    icon: "🧹",
    description: "Remove visual clutter",
    applicableTo: "all",
    execute: async () => {
      return {
        backgroundColor: "#ffffff",
        shadow: "none",
        borderWidth: 0,
        animation: "none",
        hoverEffect: "none",
        backgroundImage: undefined,
        backgroundGradient: undefined,
      };
    },
  },
  
  {
    id: "make-dark",
    label: "Dark Mode",
    icon: "🌙",
    description: "Apply dark color scheme",
    applicableTo: "all",
    execute: async () => {
      return {
        backgroundColor: "#0f172a",
        textColor: "#e2e8f0",
        color: "#e2e8f0",
        borderColor: "#334155",
      };
    },
  },
  
  {
    id: "make-light",
    label: "Light Mode",
    icon: "☀️",
    description: "Apply light color scheme",
    applicableTo: "all",
    execute: async () => {
      return {
        backgroundColor: "#ffffff",
        textColor: "#1f2937",
        color: "#1f2937",
        borderColor: "#e5e7eb",
      };
    },
  },
];

// Get applicable actions for a component type
export function getActionsForComponent(componentType: string): QuickAction[] {
  return QUICK_ACTIONS.filter((action) => 
    action.applicableTo === "all" || action.applicableTo.includes(componentType)
  );
}
```

---

### Task 30.5: Module Component Building Instructions

**Create comprehensive documentation for module developers.**

```markdown
<!-- src/docs/MODULE-COMPONENT-GUIDE.md -->

# Building Components for DRAMAC Studio Modules

This guide explains how to create components that integrate seamlessly with DRAMAC Studio's AI-powered editor.

## Component Structure

Every module component needs:
1. **Definition** - Metadata for the editor
2. **Render** - React component for display
3. **AI Config** - Instructions for AI modification

### Step 1: Create the Render Component

```tsx
// src/components/my-component-render.tsx
"use client";

import { cn } from "@/lib/utils";

interface MyComponentProps {
  title: string;
  description?: string;
  backgroundColor?: string;
  textColor?: string;
  children?: React.ReactNode;
}

export const MyComponentRender: React.FC<MyComponentProps> = ({
  title,
  description,
  backgroundColor = "#ffffff",
  textColor = "#000000",
  children,
}) => {
  return (
    <div 
      className={cn("p-6 rounded-lg")}
      style={{ backgroundColor, color: textColor }}
    >
      <h3 className="text-xl font-bold">{title}</h3>
      {description && <p className="mt-2">{description}</p>}
      {children}
    </div>
  );
};
```

### Step 2: Define Component Metadata

```tsx
// src/components/my-component-definition.ts
import { defineComponent } from "@/lib/studio/registry";
import { MyComponentRender } from "./my-component-render";

export const myComponentDefinition = defineComponent({
  type: "MyComponent",
  label: "My Component",
  description: "A custom component for my module",
  category: "module",
  icon: "Box",
  
  render: MyComponentRender,
  
  // Can this accept child components?
  acceptsChildren: false,
  isContainer: false,
  
  // Field definitions for properties panel
  fields: {
    title: {
      type: "text",
      label: "Title",
      defaultValue: "My Title",
    },
    description: {
      type: "textarea",
      label: "Description",
      rows: 3,
    },
    backgroundColor: {
      type: "color",
      label: "Background Color",
      defaultValue: "#ffffff",
    },
    textColor: {
      type: "color",
      label: "Text Color",
      defaultValue: "#000000",
    },
  },
  
  // Default props when component is added
  defaultProps: {
    title: "My Title",
    backgroundColor: "#ffffff",
    textColor: "#000000",
  },
  
  // AI configuration
  ai: {
    description: "A custom component for displaying titled content",
    canModify: ["title", "description", "backgroundColor", "textColor"],
    suggestions: [
      "Change the title",
      "Update colors",
      "Add a description",
    ],
  },
});
```

### Step 3: Register Component

```tsx
// In your module's index.ts
import { componentRegistry } from "@/lib/studio/registry";
import { myComponentDefinition } from "./my-component-definition";

export function registerModuleComponents(moduleId: string) {
  componentRegistry.register(myComponentDefinition, "module", moduleId);
}
```

## AI Configuration Best Practices

### Comprehensive canModify List

Include ALL properties the AI should be able to change:

```tsx
ai: {
  canModify: [
    // Content
    "title", "description", "buttonText",
    // Colors
    "backgroundColor", "textColor", "accentColor",
    // Layout
    "alignment", "padding", "gap",
    // Animation
    "animation", "hoverEffect",
  ],
}
```

### Helpful Suggestions

Write suggestions as natural language prompts:

```tsx
suggestions: [
  "Make the title more compelling",
  "Use a dark color scheme",
  "Add animation",
  "Optimize for mobile",
  "Increase visual impact",
]
```

### Related Components

Help AI understand component relationships:

```tsx
ai: {
  relatedComponents: [
    { type: "Section", relationship: "inside", description: "Usually placed inside a section" },
    { type: "Button", relationship: "after", description: "Often followed by a CTA button" },
  ],
}
```

## Field Types Reference

| Type | Description | Example |
|------|-------------|---------|
| text | Single line text | `{ type: "text", label: "Title" }` |
| textarea | Multi-line text | `{ type: "textarea", label: "Description", rows: 3 }` |
| number | Numeric input | `{ type: "number", label: "Height", min: 0, max: 1000 }` |
| color | Color picker | `{ type: "color", label: "Background" }` |
| select | Dropdown | `{ type: "select", label: "Size", options: [...] }` |
| toggle | Boolean switch | `{ type: "toggle", label: "Show Border" }` |
| image | Image upload | `{ type: "image", label: "Background Image" }` |
| link | URL input | `{ type: "link", label: "Button Link" }` |
| array | Repeatable items | `{ type: "array", label: "Items", itemFields: {...} }` |
| richtext | Rich text editor | `{ type: "richtext", label: "Content" }` |
| code | Code editor | `{ type: "code", label: "Custom CSS" }` |

## Responsive Design

Use ResponsiveValue for mobile-first design:

```tsx
interface Props {
  padding: ResponsiveValue<"sm" | "md" | "lg">;
}

// In render:
const paddingClasses = getResponsiveClasses(padding, {
  sm: "p-2 md:p-2 lg:p-2",
  md: "p-4 md:p-6 lg:p-8",
  lg: "p-6 md:p-10 lg:p-12",
});
```

## Testing Your Component

1. Install your module in a test site
2. Open Studio and find your component in the left panel
3. Drag it to the canvas
4. Test all properties in the right panel
5. Test AI suggestions: "Make this [your component] more [adjective]"
6. Preview and publish to verify rendering
```

---

## 🎬 PHASE 31: Award-Winning Features

### Estimated Time: 12-16 hours
### Files: 10+ new files, renders.tsx enhancements

---

### Task 31.1: 3D Transform Components

**Add 3D rotation, perspective, and depth effects.**

```typescript
// src/lib/studio/effects/3d-transforms.ts

export const transform3DProps = {
  perspective: {
    type: "number",
    label: "3D Perspective",
    min: 100,
    max: 2000,
    defaultValue: 1000,
    description: "Distance from viewer in px (lower = more dramatic)",
  },
  rotateX: {
    type: "number",
    label: "Rotate X (deg)",
    min: -180,
    max: 180,
    defaultValue: 0,
  },
  rotateY: {
    type: "number",
    label: "Rotate Y (deg)",
    min: -180,
    max: 180,
    defaultValue: 0,
  },
  rotateZ: {
    type: "number",
    label: "Rotate Z (deg)",
    min: -180,
    max: 180,
    defaultValue: 0,
  },
  translateZ: {
    type: "number",
    label: "Translate Z (px)",
    min: -500,
    max: 500,
    defaultValue: 0,
    description: "Move toward/away from viewer",
  },
  preserveIn3D: {
    type: "toggle",
    label: "Preserve 3D for Children",
    defaultValue: false,
  },
  backfaceVisibility: {
    type: "toggle",
    label: "Show Backface",
    defaultValue: true,
  },
};

export function get3DStyles(props: Record<string, unknown>): React.CSSProperties {
  const {
    perspective,
    rotateX,
    rotateY,
    rotateZ,
    translateZ,
    preserveIn3D,
    backfaceVisibility,
  } = props;
  
  const transforms: string[] = [];
  
  if (rotateX) transforms.push(`rotateX(${rotateX}deg)`);
  if (rotateY) transforms.push(`rotateY(${rotateY}deg)`);
  if (rotateZ) transforms.push(`rotateZ(${rotateZ}deg)`);
  if (translateZ) transforms.push(`translateZ(${translateZ}px)`);
  
  return {
    perspective: perspective ? `${perspective}px` : undefined,
    transform: transforms.length > 0 ? transforms.join(" ") : undefined,
    transformStyle: preserveIn3D ? "preserve-3d" : "flat",
    backfaceVisibility: backfaceVisibility === false ? "hidden" : "visible",
  };
}

// 3D Card Component
export const Card3DRender: React.FC<Card3DProps> = ({
  children,
  perspective = 1000,
  maxTilt = 15,
  glare = true,
  glareMaxOpacity = 0.5,
  scale = 1.05,
  ...rest
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");
  const [glarePos, setGlarePos] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;
    
    setTransform(`perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`);
    setGlarePos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };
  
  const handleMouseLeave = () => {
    setTransform("");
  };
  
  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-xl transition-transform duration-300"
      style={{ transform, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {glare && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${glareMaxOpacity}), transparent 50%)`,
          }}
        />
      )}
    </div>
  );
};
```

---

### Task 31.2: Micro-Interactions System

**Add delightful micro-interactions to enhance UX.**

```typescript
// src/lib/studio/effects/micro-interactions.ts

export const MICRO_INTERACTIONS = {
  // Button interactions
  buttonPress: {
    css: `
      transition: transform 0.1s ease, box-shadow 0.1s ease;
      &:active {
        transform: scale(0.95);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
    `,
    tailwind: "transition-transform active:scale-95",
  },
  
  buttonRipple: {
    description: "Material Design ripple effect on click",
    component: RippleButton,
  },
  
  // Card interactions
  cardHover: {
    css: `
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 40px rgba(0,0,0,0.15);
      }
    `,
    tailwind: "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
  },
  
  cardFlip: {
    description: "Flip card on hover to reveal back content",
    component: FlipCard,
  },
  
  // Input interactions
  inputFocus: {
    css: `
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      &:focus {
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    `,
    tailwind: "transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary",
  },
  
  inputFloat: {
    description: "Floating label that moves up on focus",
    component: FloatingLabelInput,
  },
  
  // Link interactions
  linkUnderline: {
    css: `
      position: relative;
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 2px;
        background: currentColor;
        transition: width 0.3s ease;
      }
      &:hover::after {
        width: 100%;
      }
    `,
    tailwind: "relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-current after:transition-all hover:after:w-full",
  },
  
  // Image interactions
  imageZoom: {
    css: `
      overflow: hidden;
      img {
        transition: transform 0.5s ease;
      }
      &:hover img {
        transform: scale(1.1);
      }
    `,
    tailwind: "overflow-hidden [&>img]:transition-transform [&>img]:duration-500 hover:[&>img]:scale-110",
  },
  
  imageParallax: {
    description: "Subtle parallax movement on mouse move",
    component: ParallaxImage,
  },
  
  // Text interactions
  textHighlight: {
    css: `
      background: linear-gradient(120deg, var(--primary) 0%, var(--primary) 100%);
      background-repeat: no-repeat;
      background-size: 0% 100%;
      background-position: 0 88%;
      transition: background-size 0.3s ease;
      &:hover {
        background-size: 100% 100%;
        color: white;
      }
    `,
    tailwind: "bg-gradient-to-r from-primary to-primary bg-no-repeat bg-[length:0%_100%] bg-[position:0_88%] transition-all hover:bg-[length:100%_100%] hover:text-white",
  },
  
  // Counter interactions
  counterUp: {
    description: "Animate numbers counting up when visible",
    component: AnimatedCounter,
  },
  
  // Progress interactions
  progressFill: {
    description: "Animate progress bar filling on scroll",
    component: AnimatedProgress,
  },
};

// Ripple Button Component
function RippleButton({ children, className, onClick, ...props }: ButtonProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setRipples((prev) => [...prev, { x, y, id: Date.now() }]);
    onClick?.(e);
  };
  
  return (
    <button
      className={cn("relative overflow-hidden", className)}
      onClick={handleClick}
      {...props}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: "translate(-50%, -50%)",
          }}
          onAnimationEnd={() => {
            setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
          }}
        />
      ))}
    </button>
  );
}

// Animated Counter Component
function AnimatedCounter({ value, duration = 2000, className }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);
  
  return (
    <span ref={ref} className={className}>
      {count.toLocaleString()}
    </span>
  );
}
```

---

### Task 31.3: Scroll-Triggered Animations

**Create a comprehensive scroll animation system.**

```typescript
// src/lib/studio/effects/scroll-animations.ts

"use client";

import { useEffect, useRef, useState, createContext, useContext } from "react";

interface ScrollAnimationConfig {
  animation: string;
  threshold?: number;
  delay?: number;
  duration?: number;
  once?: boolean;
  stagger?: number; // For child elements
}

// Hook for scroll-triggered animations
export function useScrollAnimation(config: ScrollAnimationConfig) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  useEffect(() => {
    if (config.once && hasAnimated) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (config.delay) {
            setTimeout(() => setIsVisible(true), config.delay);
          } else {
            setIsVisible(true);
          }
          setHasAnimated(true);
          
          if (config.once) {
            observer.disconnect();
          }
        } else if (!config.once) {
          setIsVisible(false);
        }
      },
      { threshold: config.threshold || 0.1 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [config, hasAnimated]);
  
  const animationClass = isVisible ? config.animation : "opacity-0";
  const animationStyle: React.CSSProperties = {
    animationDuration: config.duration ? `${config.duration}ms` : undefined,
  };
  
  return { ref, isVisible, animationClass, animationStyle };
}

// Component wrapper for scroll animations
interface ScrollAnimateProps extends ScrollAnimationConfig {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function ScrollAnimate({
  children,
  className,
  as: Tag = "div",
  ...config
}: ScrollAnimateProps) {
  const { ref, animationClass, animationStyle } = useScrollAnimation(config);
  
  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(className, animationClass)}
      style={animationStyle}
    >
      {children}
    </Tag>
  );
}

// Stagger children animations
interface StaggerChildrenProps {
  children: React.ReactNode;
  staggerDelay?: number; // ms between each child
  animation?: string;
  className?: string;
}

export function StaggerChildren({
  children,
  staggerDelay = 100,
  animation = "animate-fade-up",
  className,
}: StaggerChildrenProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          className={isVisible ? animation : "opacity-0"}
          style={{
            animationDelay: isVisible ? `${index * staggerDelay}ms` : undefined,
            animationFillMode: "backwards",
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// Parallax scrolling
interface ParallaxProps {
  children: React.ReactNode;
  speed?: number; // 0.5 = slow, 1.5 = fast
  className?: string;
}

export function Parallax({ children, speed = 0.5, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      
      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.innerHeight - rect.top;
      const parallaxOffset = scrolled * (speed - 1) * 0.5;
      
      setOffset(parallaxOffset);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);
  
  return (
    <div ref={ref} className={className}>
      <div
        style={{
          transform: `translateY(${offset}px)`,
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Reveal on scroll with direction
interface RevealProps {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  duration?: number;
  delay?: number;
  className?: string;
}

export function Reveal({
  children,
  direction = "up",
  distance = 50,
  duration = 600,
  delay = 0,
  className,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  const transforms = {
    up: `translateY(${distance}px)`,
    down: `translateY(-${distance}px)`,
    left: `translateX(${distance}px)`,
    right: `translateX(-${distance}px)`,
  };
  
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "none" : transforms[direction],
        transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
```

---

### Task 31.4: Glassmorphism & Modern Effects

**Add trendy visual effects for award-winning design.**

```typescript
// src/lib/studio/effects/modern-effects.ts

export const modernEffectProps = {
  // Glassmorphism
  glassEffect: {
    type: "toggle",
    label: "Glass Effect",
    defaultValue: false,
  },
  glassBlur: {
    type: "number",
    label: "Glass Blur",
    min: 0,
    max: 30,
    defaultValue: 10,
    showIf: { glassEffect: true },
  },
  glassOpacity: {
    type: "number",
    label: "Glass Opacity",
    min: 0,
    max: 100,
    defaultValue: 20,
    showIf: { glassEffect: true },
  },
  
  // Neumorphism
  neumorphism: {
    type: "toggle",
    label: "Neumorphism",
    defaultValue: false,
  },
  neumorphismType: {
    type: "select",
    label: "Neumorphism Type",
    options: [
      { label: "Raised", value: "raised" },
      { label: "Pressed", value: "pressed" },
      { label: "Flat", value: "flat" },
    ],
    defaultValue: "raised",
    showIf: { neumorphism: true },
  },
  
  // Gradient borders
  gradientBorder: {
    type: "toggle",
    label: "Gradient Border",
    defaultValue: false,
  },
  gradientBorderColors: {
    type: "text",
    label: "Border Colors (comma-separated)",
    defaultValue: "#667eea, #764ba2",
    showIf: { gradientBorder: true },
  },
  gradientBorderWidth: {
    type: "number",
    label: "Border Width",
    min: 1,
    max: 10,
    defaultValue: 2,
    showIf: { gradientBorder: true },
  },
  
  // Glow effects
  glow: {
    type: "toggle",
    label: "Glow Effect",
    defaultValue: false,
  },
  glowColor: {
    type: "color",
    label: "Glow Color",
    defaultValue: "#3b82f6",
    showIf: { glow: true },
  },
  glowSize: {
    type: "number",
    label: "Glow Size",
    min: 0,
    max: 100,
    defaultValue: 20,
    showIf: { glow: true },
  },
  glowOpacity: {
    type: "number",
    label: "Glow Opacity",
    min: 0,
    max: 100,
    defaultValue: 50,
    showIf: { glow: true },
  },
  
  // Noise texture
  noiseTexture: {
    type: "toggle",
    label: "Noise Texture",
    defaultValue: false,
  },
  noiseOpacity: {
    type: "number",
    label: "Noise Opacity",
    min: 0,
    max: 50,
    defaultValue: 10,
    showIf: { noiseTexture: true },
  },
};

// Generate glass effect styles
export function getGlassStyles(props: {
  glassEffect?: boolean;
  glassBlur?: number;
  glassOpacity?: number;
}): React.CSSProperties {
  if (!props.glassEffect) return {};
  
  return {
    background: `rgba(255, 255, 255, ${(props.glassOpacity || 20) / 100})`,
    backdropFilter: `blur(${props.glassBlur || 10}px)`,
    WebkitBackdropFilter: `blur(${props.glassBlur || 10}px)`,
    border: "1px solid rgba(255, 255, 255, 0.2)",
  };
}

// Generate neumorphism styles
export function getNeumorphismStyles(props: {
  neumorphism?: boolean;
  neumorphismType?: "raised" | "pressed" | "flat";
  backgroundColor?: string;
}): React.CSSProperties {
  if (!props.neumorphism) return {};
  
  const bg = props.backgroundColor || "#e0e0e0";
  
  const styles = {
    raised: {
      boxShadow: "20px 20px 60px #bebebe, -20px -20px 60px #ffffff",
    },
    pressed: {
      boxShadow: "inset 20px 20px 60px #bebebe, inset -20px -20px 60px #ffffff",
    },
    flat: {
      boxShadow: "5px 5px 10px #bebebe, -5px -5px 10px #ffffff",
    },
  };
  
  return styles[props.neumorphismType || "raised"];
}

// Gradient border wrapper
export function GradientBorder({
  children,
  colors = ["#667eea", "#764ba2"],
  width = 2,
  borderRadius = 8,
  className,
}: {
  children: React.ReactNode;
  colors?: string[];
  width?: number;
  borderRadius?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("relative p-[2px]", className)}
      style={{
        background: `linear-gradient(135deg, ${colors.join(", ")})`,
        borderRadius,
        padding: width,
      }}
    >
      <div
        className="relative bg-white dark:bg-gray-900"
        style={{ borderRadius: borderRadius - width }}
      >
        {children}
      </div>
    </div>
  );
}

// Glow wrapper
export function GlowEffect({
  children,
  color = "#3b82f6",
  size = 20,
  opacity = 50,
  className,
}: {
  children: React.ReactNode;
  color?: string;
  size?: number;
  opacity?: number;
  className?: string;
}) {
  // Convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  return (
    <div
      className={cn("relative", className)}
      style={{
        boxShadow: `0 0 ${size}px ${hexToRgba(color, opacity / 100)}`,
      }}
    >
      {children}
    </div>
  );
}

// Noise texture overlay
export function NoiseTexture({
  children,
  opacity = 0.1,
  className,
}: {
  children: React.ReactNode;
  opacity?: number;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {children}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity,
        }}
      />
    </div>
  );
}
```

---

## ✅ DELIVERABLES CHECKLIST

### Phase 30 Deliverables:
- [ ] Comprehensive AI config for all 45+ components
- [ ] Universal visual props added to all components
- [ ] RenderWrapper applying universal props
- [ ] Enhanced AI quick actions system
- [ ] Module component building documentation
- [ ] Style presets for all major components

### Phase 31 Deliverables:
- [ ] 3D transform system with Card3D component
- [ ] Micro-interactions library
- [ ] Scroll-triggered animation system
- [ ] Glassmorphism component support
- [ ] Neumorphism component support
- [ ] Gradient borders
- [ ] Glow effects
- [ ] Noise texture overlay
- [ ] Parallax scrolling
- [ ] Stagger children animations

---

## 🔄 TESTING REQUIREMENTS

### After Phase 30:
```
1. Open AI chat on any component
2. Try "Make it more professional" - should work on all components
3. Try "Add animation" - all components should animate
4. Try "Use dark colors" - all components should update
5. Verify all components show Advanced section in properties
6. Test quick actions on different component types
```

### After Phase 31:
```
1. Add Card3D component - test mouse tilt effect
2. Add section with glass effect - verify blur works
3. Add gradient border to card
4. Test glow effect on button
5. Add parallax section - scroll to verify effect
6. Add stats section - verify numbers animate in
7. Add staggered feature grid - verify cascade animation
8. Test all effects on mobile preview
```

---

## 📝 NOTES

1. **Performance First**: All effects should be GPU-accelerated (transform, opacity)
2. **Fallbacks**: Provide CSS-only fallbacks for JavaScript animations
3. **Accessibility**: Respect `prefers-reduced-motion`
4. **Mobile**: Test all effects on mobile devices
5. **AI Integration**: Update AI configs as you add new props

---

**Ready for Implementation**: This wave transforms DRAMAC Studio into an award-winning website builder!
