# Phase 38: Site Renderer - Components

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-37-RENDERER-FOUNDATION.md` and `PHASE-17-VISUAL-EDITOR-FOUNDATION.md`

---

## 🎯 Objective

Convert Craft.js JSON structure into static React components for published site rendering without Craft.js runtime.

---

## 📋 Prerequisites

- [ ] Phase 37 completed (Renderer foundation)
- [ ] Visual editor components available
- [ ] Understanding of Craft.js JSON structure

---

## ✅ Tasks

### Task 38.1: JSON to Component Renderer

**File: `src/components/renderer/node-renderer.tsx`**

```typescript
import { createElement, ReactNode } from "react";
import { RenderContainer } from "./components/render-container";
import { RenderText } from "./components/render-text";
import { RenderButton } from "./components/render-button";
import { RenderImage } from "./components/render-image";
import { RenderHero } from "./components/render-hero";
import { RenderFeatureGrid } from "./components/render-feature-grid";
import { RenderTestimonials } from "./components/render-testimonials";
import { RenderCTA } from "./components/render-cta";
import { RenderContactForm } from "./components/render-contact-form";
import { RenderNavigation } from "./components/render-navigation";
import { RenderFooter } from "./components/render-footer";

// Map of component types to render functions
const componentMap: Record<string, React.FC<any>> = {
  Container: RenderContainer,
  Text: RenderText,
  Button: RenderButton,
  Image: RenderImage,
  Hero: RenderHero,
  FeatureGrid: RenderFeatureGrid,
  Testimonials: RenderTestimonials,
  CTA: RenderCTA,
  ContactForm: RenderContactForm,
  Navigation: RenderNavigation,
  Footer: RenderFooter,
};

interface CraftNode {
  type: { resolvedName: string } | string;
  props: Record<string, any>;
  nodes?: string[];
  linkedNodes?: Record<string, string>;
}

interface NodeRendererProps {
  node: CraftNode;
  nodes: Record<string, CraftNode>;
  resolveNode: (nodeId: string) => ReactNode;
}

export function NodeRenderer({ node, nodes, resolveNode }: NodeRendererProps) {
  // Get component name
  const componentName = typeof node.type === "string"
    ? node.type
    : node.type.resolvedName;

  // Skip ROOT nodes
  if (componentName === "ROOT" || componentName === "Canvas") {
    // Render children
    const childIds = node.nodes || [];
    return (
      <>
        {childIds.map((childId) => resolveNode(childId))}
      </>
    );
  }

  // Get render component
  const Component = componentMap[componentName];
  
  if (!Component) {
    console.warn(`Unknown component: ${componentName}`);
    return null;
  }

  // Get children
  const childIds = node.nodes || [];
  const children = childIds.map((childId) => resolveNode(childId));

  // Get linked nodes (for slots)
  const linkedContent: Record<string, ReactNode> = {};
  if (node.linkedNodes) {
    Object.entries(node.linkedNodes).forEach(([slot, nodeId]) => {
      linkedContent[slot] = resolveNode(nodeId);
    });
  }

  return (
    <Component
      {...node.props}
      linkedContent={linkedContent}
    >
      {children}
    </Component>
  );
}

// Main render function
export function renderCraftJSON(json: any): ReactNode {
  if (!json || !json.ROOT) {
    return null;
  }

  const nodes = json;

  function resolveNode(nodeId: string): ReactNode {
    const node = nodes[nodeId];
    if (!node) return null;

    return (
      <NodeRenderer
        key={nodeId}
        node={node}
        nodes={nodes}
        resolveNode={resolveNode}
      />
    );
  }

  return resolveNode("ROOT");
}
```

### Task 38.2: Render Container Component

**File: `src/components/renderer/components/render-container.tsx`**

```typescript
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RenderContainerProps {
  background?: string;
  padding?: number;
  margin?: number;
  borderRadius?: number;
  flexDirection?: "row" | "column";
  alignItems?: "start" | "center" | "end" | "stretch";
  justifyContent?: "start" | "center" | "end" | "between" | "around";
  gap?: number;
  width?: string;
  minHeight?: string;
  className?: string;
  children?: ReactNode;
}

export function RenderContainer({
  background = "transparent",
  padding = 0,
  margin = 0,
  borderRadius = 0,
  flexDirection = "column",
  alignItems = "stretch",
  justifyContent = "start",
  gap = 0,
  width = "100%",
  minHeight,
  className,
  children,
}: RenderContainerProps) {
  const justifyMap = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
  };

  const alignMap = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
  };

  return (
    <div
      className={cn(
        "flex",
        flexDirection === "row" ? "flex-row" : "flex-col",
        justifyMap[justifyContent],
        alignMap[alignItems],
        className
      )}
      style={{
        background,
        padding: `${padding}px`,
        margin: `${margin}px`,
        borderRadius: `${borderRadius}px`,
        gap: `${gap}px`,
        width,
        minHeight,
      }}
    >
      {children}
    </div>
  );
}
```

### Task 38.3: Render Text Component

**File: `src/components/renderer/components/render-text.tsx`**

```typescript
import { cn } from "@/lib/utils";

interface RenderTextProps {
  text: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  tagName?: "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span";
  className?: string;
}

export function RenderText({
  text,
  fontSize = 16,
  fontWeight = "normal",
  color = "inherit",
  textAlign = "left",
  tagName = "p",
  className,
}: RenderTextProps) {
  const Tag = tagName;

  const alignMap = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <Tag
      className={cn(alignMap[textAlign], className)}
      style={{
        fontSize: `${fontSize}px`,
        fontWeight,
        color,
      }}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
}
```

### Task 38.4: Render Button Component

**File: `src/components/renderer/components/render-button.tsx`**

```typescript
import { cn } from "@/lib/utils";

interface RenderButtonProps {
  text: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  fullWidth?: boolean;
  className?: string;
}

export function RenderButton({
  text,
  variant = "primary",
  size = "md",
  href,
  fullWidth = false,
  className,
}: RenderButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors rounded-lg";

  const variantStyles = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-input bg-background hover:bg-accent",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };

  const sizeStyles = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4",
    lg: "h-12 px-6 text-lg",
  };

  const Component = href ? "a" : "button";

  return (
    <Component
      href={href}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className
      )}
    >
      {text}
    </Component>
  );
}
```

### Task 38.5: Render Image Component

**File: `src/components/renderer/components/render-image.tsx`**

```typescript
import { cn } from "@/lib/utils";

interface RenderImageProps {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  objectFit?: "cover" | "contain" | "fill" | "none";
  borderRadius?: number;
  className?: string;
}

export function RenderImage({
  src,
  alt,
  width = "100%",
  height = "auto",
  objectFit = "cover",
  borderRadius = 0,
  className,
}: RenderImageProps) {
  // Handle placeholder images
  if (!src || src === "/placeholder.svg") {
    return (
      <div
        className={cn("bg-muted flex items-center justify-center", className)}
        style={{
          width: typeof width === "number" ? `${width}px` : width,
          height: typeof height === "number" ? `${height}px` : height,
          borderRadius: `${borderRadius}px`,
        }}
      >
        <span className="text-muted-foreground text-sm">No image</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        objectFit,
        borderRadius: `${borderRadius}px`,
      }}
    />
  );
}
```

### Task 38.6: Render Hero Component

**File: `src/components/renderer/components/render-hero.tsx`**

```typescript
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RenderHeroProps {
  title: string;
  subtitle: string;
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
  alignment?: "left" | "center" | "right";
  height?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  className?: string;
  children?: ReactNode;
}

export function RenderHero({
  title,
  subtitle,
  backgroundImage,
  backgroundColor = "#f8fafc",
  textColor = "inherit",
  alignment = "center",
  height = "500px",
  overlay = false,
  overlayOpacity = 50,
  primaryButtonText,
  primaryButtonHref,
  secondaryButtonText,
  secondaryButtonHref,
  className,
}: RenderHeroProps) {
  const alignMap = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  };

  return (
    <section
      className={cn(
        "relative flex flex-col justify-center px-6 py-20",
        alignMap[alignment],
        className
      )}
      style={{
        minHeight: height,
        backgroundColor: backgroundImage ? undefined : backgroundColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: textColor,
      }}
    >
      {overlay && backgroundImage && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity / 100 }}
        />
      )}

      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
          {title}
        </h1>
        <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-2xl">
          {subtitle}
        </p>

        {(primaryButtonText || secondaryButtonText) && (
          <div className="flex flex-wrap gap-4 justify-center">
            {primaryButtonText && (
              <a
                href={primaryButtonHref || "#"}
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                {primaryButtonText}
              </a>
            )}
            {secondaryButtonText && (
              <a
                href={secondaryButtonHref || "#"}
                className="inline-flex items-center justify-center px-6 py-3 border border-current rounded-lg font-medium hover:bg-white/10 transition-colors"
              >
                {secondaryButtonText}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
```

### Task 38.7: Render Feature Grid Component

**File: `src/components/renderer/components/render-feature-grid.tsx`**

```typescript
import { cn } from "@/lib/utils";

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface RenderFeatureGridProps {
  title?: string;
  subtitle?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
  backgroundColor?: string;
  className?: string;
}

export function RenderFeatureGrid({
  title,
  subtitle,
  features = [],
  columns = 3,
  backgroundColor = "transparent",
  className,
}: RenderFeatureGridProps) {
  const columnClasses = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <section
      className={cn("px-6 py-16", className)}
      style={{ backgroundColor }}
    >
      <div className="max-w-6xl mx-auto">
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="text-3xl font-bold mb-4">{title}</h2>
            )}
            {subtitle && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className={cn("grid gap-8", columnClasses[columns])}>
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-lg border bg-card text-card-foreground"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### Task 38.8: Render Testimonials Component

**File: `src/components/renderer/components/render-testimonials.tsx`**

```typescript
import { cn } from "@/lib/utils";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  avatar?: string;
}

interface RenderTestimonialsProps {
  title?: string;
  testimonials: Testimonial[];
  backgroundColor?: string;
  className?: string;
}

export function RenderTestimonials({
  title,
  testimonials = [],
  backgroundColor = "transparent",
  className,
}: RenderTestimonialsProps) {
  return (
    <section
      className={cn("px-6 py-16", className)}
      style={{ backgroundColor }}
    >
      <div className="max-w-6xl mx-auto">
        {title && (
          <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-6 rounded-lg border bg-card"
            >
              <blockquote className="text-lg mb-4">
                "{testimonial.quote}"
              </blockquote>
              <div className="flex items-center gap-3">
                {testimonial.avatar ? (
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-lg font-semibold">
                      {testimonial.author[0]}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### Task 38.9: Render CTA Component

**File: `src/components/renderer/components/render-cta.tsx`**

```typescript
import { cn } from "@/lib/utils";

interface RenderCTAProps {
  title: string;
  description: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  backgroundColor?: string;
  textColor?: string;
  className?: string;
}

export function RenderCTA({
  title,
  description,
  primaryButtonText,
  primaryButtonHref,
  secondaryButtonText,
  secondaryButtonHref,
  backgroundColor = "#3b82f6",
  textColor = "#ffffff",
  className,
}: RenderCTAProps) {
  return (
    <section
      className={cn("px-6 py-16", className)}
      style={{ backgroundColor, color: textColor }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
        <p className="text-xl opacity-90 mb-8">{description}</p>

        <div className="flex flex-wrap gap-4 justify-center">
          {primaryButtonText && (
            <a
              href={primaryButtonHref || "#"}
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              {primaryButtonText}
            </a>
          )}
          {secondaryButtonText && (
            <a
              href={secondaryButtonHref || "#"}
              className="inline-flex items-center justify-center px-6 py-3 border border-white/50 rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              {secondaryButtonText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
```

### Task 38.10: Render Contact Form Component

**File: `src/components/renderer/components/render-contact-form.tsx`**

```typescript
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface RenderContactFormProps {
  title?: string;
  description?: string;
  nameLabel?: string;
  emailLabel?: string;
  messageLabel?: string;
  submitText?: string;
  successMessage?: string;
  formEndpoint?: string;
  backgroundColor?: string;
  className?: string;
}

export function RenderContactForm({
  title = "Contact Us",
  description,
  nameLabel = "Name",
  emailLabel = "Email",
  messageLabel = "Message",
  submitText = "Send Message",
  successMessage = "Thank you! We'll be in touch soon.",
  formEndpoint,
  backgroundColor = "transparent",
  className,
}: RenderContactFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // If formEndpoint provided, submit to it
    if (formEndpoint) {
      try {
        const formData = new FormData(e.currentTarget);
        await fetch(formEndpoint, {
          method: "POST",
          body: formData,
        });
      } catch (error) {
        console.error("Form submission error:", error);
      }
    }

    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section
        className={cn("px-6 py-16", className)}
        style={{ backgroundColor }}
      >
        <div className="max-w-xl mx-auto text-center">
          <div className="text-4xl mb-4">✓</div>
          <p className="text-lg">{successMessage}</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn("px-6 py-16", className)}
      style={{ backgroundColor }}
    >
      <div className="max-w-xl mx-auto">
        {title && (
          <h2 className="text-3xl font-bold text-center mb-4">{title}</h2>
        )}
        {description && (
          <p className="text-center text-muted-foreground mb-8">{description}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{nameLabel}</label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{emailLabel}</label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{messageLabel}</label>
            <textarea
              name="message"
              rows={4}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : submitText}
          </button>
        </form>
      </div>
    </section>
  );
}
```

### Task 38.11: Render Navigation & Footer

**File: `src/components/renderer/components/render-navigation.tsx`**

```typescript
import { cn } from "@/lib/utils";

interface NavLink {
  label: string;
  href: string;
}

interface RenderNavigationProps {
  logo?: string;
  logoText?: string;
  links: NavLink[];
  ctaText?: string;
  ctaHref?: string;
  backgroundColor?: string;
  className?: string;
}

export function RenderNavigation({
  logo,
  logoText = "Logo",
  links = [],
  ctaText,
  ctaHref,
  backgroundColor = "#ffffff",
  className,
}: RenderNavigationProps) {
  return (
    <header
      className={cn("px-6 py-4 border-b", className)}
      style={{ backgroundColor }}
    >
      <nav className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          {logo ? (
            <img src={logo} alt={logoText} className="h-8" />
          ) : (
            <span className="text-xl font-bold">{logoText}</span>
          )}
        </div>

        <div className="hidden md:flex items-center gap-6">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {ctaText && (
          <a
            href={ctaHref || "#"}
            className="hidden md:inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {ctaText}
          </a>
        )}
      </nav>
    </header>
  );
}
```

**File: `src/components/renderer/components/render-footer.tsx`**

```typescript
import { cn } from "@/lib/utils";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface RenderFooterProps {
  logo?: string;
  logoText?: string;
  columns?: FooterColumn[];
  copyright?: string;
  backgroundColor?: string;
  className?: string;
}

export function RenderFooter({
  logo,
  logoText = "Logo",
  columns = [],
  copyright = `© ${new Date().getFullYear()} All rights reserved.`,
  backgroundColor = "#1f2937",
  className,
}: RenderFooterProps) {
  return (
    <footer
      className={cn("px-6 py-12 text-white", className)}
      style={{ backgroundColor }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid gap-8 md:grid-cols-4 mb-8">
          <div>
            {logo ? (
              <img src={logo} alt={logoText} className="h-8 mb-4" />
            ) : (
              <span className="text-xl font-bold">{logoText}</span>
            )}
          </div>

          {columns.map((column, index) => (
            <div key={index}>
              <h4 className="font-semibold mb-4">{column.title}</h4>
              <ul className="space-y-2">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-sm opacity-75 hover:opacity-100 transition-opacity"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/20 text-sm text-center opacity-75">
          {copyright}
        </div>
      </div>
    </footer>
  );
}
```

---

## 📐 Acceptance Criteria

- [ ] All basic components render correctly
- [ ] Section components (Hero, Features, CTA) work
- [ ] Navigation and Footer render
- [ ] Contact form submits correctly
- [ ] Styles match editor preview
- [ ] No Craft.js runtime required

---

## 📁 Files Created This Phase

```
src/components/renderer/
├── node-renderer.tsx
└── components/
    ├── render-container.tsx
    ├── render-text.tsx
    ├── render-button.tsx
    ├── render-image.tsx
    ├── render-hero.tsx
    ├── render-feature-grid.tsx
    ├── render-testimonials.tsx
    ├── render-cta.tsx
    ├── render-contact-form.tsx
    ├── render-navigation.tsx
    └── render-footer.tsx
```

---

## ➡️ Next Phase

**Phase 39: Site Renderer - Styling** - Custom CSS, fonts, and theme system for published sites.
