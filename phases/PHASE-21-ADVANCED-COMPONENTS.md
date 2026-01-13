# Phase 21: Advanced Editor Components

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Build advanced section components: Hero sections, feature grids, testimonials, and call-to-action blocks.

---

## 📋 Prerequisites

- [ ] Phase 1-20 completed

---

## ✅ Tasks

### Task 21.1: Hero Section Component

**File: `src/components/editor/user-components/hero-section.tsx`**

```typescript
"use client";

import { useNode, Element } from "@craftjs/core";
import { Container } from "./container";
import { Text } from "./text";
import { ButtonComponent } from "./button-component";
import { cn } from "@/lib/utils";

export interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonHref?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
  alignment?: "left" | "center" | "right";
  height?: string;
  overlay?: boolean;
  overlayOpacity?: number;
}

export function HeroSection({
  title = "Welcome to Our Platform",
  subtitle = "Build beautiful websites with our drag-and-drop editor",
  buttonText = "Get Started",
  buttonHref = "#",
  backgroundImage = "",
  backgroundColor = "#1a1a2e",
  textColor = "#ffffff",
  alignment = "center",
  height = "min-h-[500px]",
  overlay = true,
  overlayOpacity = 50,
}: HeroSectionProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  const alignmentClasses = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  };

  return (
    <section
      ref={(ref) => connect(drag(ref!))}
      className={cn(
        "relative flex flex-col justify-center px-8 py-16",
        height,
        alignmentClasses[alignment]
      )}
      style={{
        backgroundColor: backgroundImage ? "transparent" : backgroundColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: textColor,
      }}
    >
      {/* Overlay */}
      {overlay && backgroundImage && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity / 100 }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
          {title}
        </h1>
        <p className="text-lg md:text-xl opacity-90">
          {subtitle}
        </p>
        {buttonText && (
          <button
            className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
          >
            {buttonText}
          </button>
        )}
      </div>
    </section>
  );
}

HeroSection.craft = {
  displayName: "Hero Section",
  props: {
    title: "Welcome to Our Platform",
    subtitle: "Build beautiful websites with our drag-and-drop editor",
    buttonText: "Get Started",
    buttonHref: "#",
    backgroundImage: "",
    backgroundColor: "#1a1a2e",
    textColor: "#ffffff",
    alignment: "center",
    height: "min-h-[500px]",
    overlay: true,
    overlayOpacity: 50,
  },
  related: {
    toolbar: () => import("../settings/hero-settings").then((m) => m.HeroSettings),
  },
  rules: {
    canDrag: () => true,
  },
};
```

### Task 21.2: Feature Grid Component

**File: `src/components/editor/user-components/feature-grid.tsx`**

```typescript
"use client";

import { useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";
import { 
  Zap, 
  Shield, 
  Sparkles, 
  Layers, 
  Globe, 
  Code,
  LucideIcon,
} from "lucide-react";

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

export interface FeatureGridProps {
  title?: string;
  subtitle?: string;
  columns?: 2 | 3 | 4;
  features?: FeatureItem[];
  backgroundColor?: string;
  textColor?: string;
}

const iconMap: Record<string, LucideIcon> = {
  Zap,
  Shield,
  Sparkles,
  Layers,
  Globe,
  Code,
};

const defaultFeatures: FeatureItem[] = [
  {
    icon: "Zap",
    title: "Lightning Fast",
    description: "Built for speed with optimized performance",
  },
  {
    icon: "Shield",
    title: "Secure by Default",
    description: "Enterprise-grade security built in",
  },
  {
    icon: "Sparkles",
    title: "AI Powered",
    description: "Intelligent features that learn from you",
  },
  {
    icon: "Layers",
    title: "Modular Design",
    description: "Flexible components that work together",
  },
  {
    icon: "Globe",
    title: "Global CDN",
    description: "Fast delivery worldwide",
  },
  {
    icon: "Code",
    title: "Developer Friendly",
    description: "Clean code and great documentation",
  },
];

export function FeatureGrid({
  title = "Why Choose Us",
  subtitle = "Everything you need to build amazing websites",
  columns = 3,
  features = defaultFeatures,
  backgroundColor = "",
  textColor = "",
}: FeatureGridProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <section
      ref={(ref) => connect(drag(ref!))}
      className="py-16 px-8"
      style={{ backgroundColor, color: textColor }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          <p className="text-lg opacity-80 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Grid */}
        <div className={cn("grid gap-8", gridCols[columns])}>
          {features.map((feature, index) => {
            const Icon = iconMap[feature.icon] || Zap;

            return (
              <div
                key={index}
                className="flex flex-col items-center text-center p-6 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="opacity-80">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

FeatureGrid.craft = {
  displayName: "Feature Grid",
  props: {
    title: "Why Choose Us",
    subtitle: "Everything you need to build amazing websites",
    columns: 3,
    features: defaultFeatures,
    backgroundColor: "",
    textColor: "",
  },
  related: {
    toolbar: () => import("../settings/feature-grid-settings").then((m) => m.FeatureGridSettings),
  },
  rules: {
    canDrag: () => true,
  },
};
```

### Task 21.3: Testimonials Component

**File: `src/components/editor/user-components/testimonials.tsx`**

```typescript
"use client";

import { useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";
import { Quote } from "lucide-react";

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar?: string;
}

export interface TestimonialsProps {
  title?: string;
  layout?: "grid" | "carousel";
  testimonials?: Testimonial[];
  backgroundColor?: string;
  textColor?: string;
}

const defaultTestimonials: Testimonial[] = [
  {
    quote: "This platform transformed how we build websites. Absolutely incredible!",
    author: "Sarah Johnson",
    role: "CEO",
    company: "TechCorp",
  },
  {
    quote: "The AI features saved us countless hours. Best investment we made.",
    author: "Mike Chen",
    role: "Marketing Director",
    company: "GrowthLabs",
  },
  {
    quote: "Simple, powerful, and beautiful. Everything we needed in one place.",
    author: "Emily Davis",
    role: "Designer",
    company: "Creative Studio",
  },
];

export function Testimonials({
  title = "What Our Clients Say",
  layout = "grid",
  testimonials = defaultTestimonials,
  backgroundColor = "#f8fafc",
  textColor = "",
}: TestimonialsProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <section
      ref={(ref) => connect(drag(ref!))}
      className="py-16 px-8"
      style={{ backgroundColor, color: textColor }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
        </div>

        {/* Testimonials Grid */}
        <div className={cn("grid gap-8 md:grid-cols-3")}>
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <Quote className="w-8 h-8 text-primary/30 mb-4" />
              <p className="text-lg mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-medium">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm opacity-60">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

Testimonials.craft = {
  displayName: "Testimonials",
  props: {
    title: "What Our Clients Say",
    layout: "grid",
    testimonials: defaultTestimonials,
    backgroundColor: "#f8fafc",
    textColor: "",
  },
  related: {
    toolbar: () => import("../settings/testimonials-settings").then((m) => m.TestimonialsSettings),
  },
  rules: {
    canDrag: () => true,
  },
};
```

### Task 21.4: CTA Section Component

**File: `src/components/editor/user-components/cta-section.tsx`**

```typescript
"use client";

import { useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";

export interface CTASectionProps {
  title?: string;
  subtitle?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  backgroundColor?: string;
  textColor?: string;
  layout?: "centered" | "split";
}

export function CTASection({
  title = "Ready to Get Started?",
  subtitle = "Join thousands of satisfied customers building amazing websites.",
  primaryButtonText = "Start Free Trial",
  primaryButtonHref = "#",
  secondaryButtonText = "Learn More",
  secondaryButtonHref = "#",
  backgroundColor = "#4f46e5",
  textColor = "#ffffff",
  layout = "centered",
}: CTASectionProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  if (layout === "split") {
    return (
      <section
        ref={(ref) => connect(drag(ref!))}
        className="py-16 px-8"
        style={{ backgroundColor, color: textColor }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
            <p className="text-lg opacity-90">{subtitle}</p>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors">
              {primaryButtonText}
            </button>
            {secondaryButtonText && (
              <button className="px-6 py-3 border border-white/30 font-medium rounded-lg hover:bg-white/10 transition-colors">
                {secondaryButtonText}
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={(ref) => connect(drag(ref!))}
      className="py-16 px-8"
      style={{ backgroundColor, color: textColor }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
        <p className="text-lg opacity-90 mb-8">{subtitle}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors">
            {primaryButtonText}
          </button>
          {secondaryButtonText && (
            <button className="px-6 py-3 border border-white/30 font-medium rounded-lg hover:bg-white/10 transition-colors">
              {secondaryButtonText}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

CTASection.craft = {
  displayName: "CTA Section",
  props: {
    title: "Ready to Get Started?",
    subtitle: "Join thousands of satisfied customers building amazing websites.",
    primaryButtonText: "Start Free Trial",
    primaryButtonHref: "#",
    secondaryButtonText: "Learn More",
    secondaryButtonHref: "#",
    backgroundColor: "#4f46e5",
    textColor: "#ffffff",
    layout: "centered",
  },
  related: {
    toolbar: () => import("../settings/cta-settings").then((m) => m.CTASettings),
  },
  rules: {
    canDrag: () => true,
  },
};
```

### Task 21.5: Update Component Resolver

**File: `src/components/editor/resolver.ts`** (Updated)

```typescript
import { Container } from "./user-components/container";
import { Text } from "./user-components/text";
import { ButtonComponent } from "./user-components/button-component";
import { ImageComponent } from "./user-components/image-component";
import { HeroSection } from "./user-components/hero-section";
import { FeatureGrid } from "./user-components/feature-grid";
import { Testimonials } from "./user-components/testimonials";
import { CTASection } from "./user-components/cta-section";

// Map of all user components for Craft.js resolver
export const componentResolver = {
  Container,
  Text,
  Button: ButtonComponent,
  Image: ImageComponent,
  HeroSection,
  FeatureGrid,
  Testimonials,
  CTASection,
};

// Component metadata for toolbox
export const componentRegistry = [
  // Layout
  {
    name: "Container",
    displayName: "Container",
    description: "A flexible container for other elements",
    category: "layout" as const,
    icon: "LayoutGrid",
    component: Container,
  },
  // Typography
  {
    name: "Text",
    displayName: "Text",
    description: "Text content with various styles",
    category: "typography" as const,
    icon: "Type",
    component: Text,
  },
  // Buttons
  {
    name: "Button",
    displayName: "Button",
    description: "Interactive button element",
    category: "buttons" as const,
    icon: "MousePointer",
    component: ButtonComponent,
  },
  // Media
  {
    name: "Image",
    displayName: "Image",
    description: "Display images",
    category: "media" as const,
    icon: "Image",
    component: ImageComponent,
  },
  // Sections
  {
    name: "HeroSection",
    displayName: "Hero Section",
    description: "Full-width hero with title and CTA",
    category: "sections" as const,
    icon: "LayoutTemplate",
    component: HeroSection,
  },
  {
    name: "FeatureGrid",
    displayName: "Feature Grid",
    description: "Grid of features with icons",
    category: "sections" as const,
    icon: "Grid3X3",
    component: FeatureGrid,
  },
  {
    name: "Testimonials",
    displayName: "Testimonials",
    description: "Customer testimonials section",
    category: "sections" as const,
    icon: "Quote",
    component: Testimonials,
  },
  {
    name: "CTASection",
    displayName: "Call to Action",
    description: "CTA section with buttons",
    category: "sections" as const,
    icon: "Megaphone",
    component: CTASection,
  },
];
```

### Task 21.6: Update Toolbox with Sections

**File: `src/components/editor/toolbox.tsx`** (Updated)

```typescript
"use client";

import { useEditor, Element } from "@craftjs/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { componentRegistry } from "./resolver";
import { Container } from "./user-components/container";
import { Text } from "./user-components/text";
import { ButtonComponent } from "./user-components/button-component";
import { ImageComponent } from "./user-components/image-component";
import { HeroSection } from "./user-components/hero-section";
import { FeatureGrid } from "./user-components/feature-grid";
import { Testimonials } from "./user-components/testimonials";
import { CTASection } from "./user-components/cta-section";
import {
  LayoutGrid,
  Type,
  MousePointer,
  Image as ImageIcon,
  GripVertical,
  LayoutTemplate,
  Grid3X3,
  Quote,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  LayoutGrid,
  Type,
  MousePointer,
  Image: ImageIcon,
  LayoutTemplate,
  Grid3X3,
  Quote,
  Megaphone,
};

const componentMap: Record<string, React.ComponentType<any>> = {
  Container,
  Text,
  Button: ButtonComponent,
  Image: ImageComponent,
  HeroSection,
  FeatureGrid,
  Testimonials,
  CTASection,
};

// Group components by category
const categories = ["layout", "sections", "typography", "buttons", "media"];

const categoryLabels: Record<string, string> = {
  layout: "Layout",
  sections: "Sections",
  typography: "Typography",
  buttons: "Buttons",
  media: "Media",
};

export function EditorToolbox() {
  const { connectors } = useEditor();

  return (
    <div className="w-64 border-r bg-background">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Components</h2>
        <p className="text-sm text-muted-foreground">Drag to add</p>
      </div>
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-4 space-y-6">
          {categories.map((category) => {
            const items = componentRegistry.filter((c) => c.category === category);
            if (items.length === 0) return null;

            return (
              <div key={category}>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  {categoryLabels[category] || category}
                </h3>
                <div className="space-y-2">
                  {items.map((item) => {
                    const Icon = iconMap[item.icon] || LayoutGrid;
                    const Component = componentMap[item.name];

                    return (
                      <div
                        key={item.name}
                        ref={(ref) =>
                          ref &&
                          connectors.create(
                            ref,
                            item.name === "Container" ? (
                              <Element is={Container} canvas />
                            ) : (
                              <Component />
                            )
                          )
                        }
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border",
                          "cursor-move hover:bg-muted transition-colors",
                          "select-none"
                        )}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{item.displayName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
```

---

## 📐 Acceptance Criteria

- [ ] Hero section renders with customizable props
- [ ] Feature grid displays icons and text in columns
- [ ] Testimonials show quotes with author info
- [ ] CTA section has centered and split layouts
- [ ] All components appear in toolbox under "Sections"
- [ ] Components can be dragged onto canvas
- [ ] Components are selectable and editable
- [ ] Default props create meaningful previews

---

## 📁 Files Created This Phase

```
src/components/editor/user-components/
├── hero-section.tsx
├── feature-grid.tsx
├── testimonials.tsx
└── cta-section.tsx

src/components/editor/
├── resolver.ts (updated)
└── toolbox.tsx (updated)
```

---

## ➡️ Next Phase

**Phase 22: Section Settings** - Settings panels for Hero, Features, Testimonials, CTA.
