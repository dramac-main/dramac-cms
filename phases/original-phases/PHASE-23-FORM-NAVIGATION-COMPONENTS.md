# Phase 23: Form & Navigation Components

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Build form components (contact form, newsletter), navigation menu, and footer sections.

---

## 📋 Prerequisites

- [ ] Phase 1-22 completed

---

## ✅ Tasks

### Task 23.1: Contact Form Component

**File: `src/components/editor/user-components/contact-form.tsx`**

```typescript
"use client";

import { useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";

export interface ContactFormProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  showName?: boolean;
  showPhone?: boolean;
  showSubject?: boolean;
  backgroundColor?: string;
  formBackgroundColor?: string;
}

export function ContactForm({
  title = "Get in Touch",
  subtitle = "We'd love to hear from you. Send us a message!",
  buttonText = "Send Message",
  showName = true,
  showPhone = false,
  showSubject = true,
  backgroundColor = "",
  formBackgroundColor = "#ffffff",
}: ContactFormProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <section
      ref={(ref) => connect(drag(ref!))}
      className="py-16 px-8"
      style={{ backgroundColor }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          {subtitle && <p className="text-lg opacity-80">{subtitle}</p>}
        </div>

        {/* Form */}
        <form
          className="space-y-6 p-8 rounded-xl shadow-sm"
          style={{ backgroundColor: formBackgroundColor }}
          onSubmit={(e) => e.preventDefault()}
        >
          {showName && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="john@example.com"
            />
          </div>

          {showPhone && (
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          )}

          {showSubject && (
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <input
                type="text"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="How can we help?"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea
              rows={5}
              className="w-full px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Your message..."
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            {buttonText}
          </button>
        </form>
      </div>
    </section>
  );
}

ContactForm.craft = {
  displayName: "Contact Form",
  props: {
    title: "Get in Touch",
    subtitle: "We'd love to hear from you. Send us a message!",
    buttonText: "Send Message",
    showName: true,
    showPhone: false,
    showSubject: true,
    backgroundColor: "",
    formBackgroundColor: "#ffffff",
  },
  related: {
    toolbar: () => import("../settings/contact-form-settings").then((m) => m.ContactFormSettings),
  },
  rules: {
    canDrag: () => true,
  },
};
```

### Task 23.2: Newsletter Component

**File: `src/components/editor/user-components/newsletter.tsx`**

```typescript
"use client";

import { useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";
import { Mail } from "lucide-react";

export interface NewsletterProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  placeholder?: string;
  layout?: "inline" | "stacked";
  backgroundColor?: string;
  textColor?: string;
}

export function Newsletter({
  title = "Subscribe to Our Newsletter",
  subtitle = "Get the latest updates delivered to your inbox",
  buttonText = "Subscribe",
  placeholder = "Enter your email",
  layout = "inline",
  backgroundColor = "#1a1a2e",
  textColor = "#ffffff",
}: NewsletterProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <section
      ref={(ref) => connect(drag(ref!))}
      className="py-12 px-8"
      style={{ backgroundColor, color: textColor }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <Mail className="w-10 h-10 mx-auto mb-4 opacity-80" />
        <h3 className="text-2xl md:text-3xl font-bold mb-2">{title}</h3>
        {subtitle && <p className="text-lg opacity-80 mb-6">{subtitle}</p>}

        <form
          onSubmit={(e) => e.preventDefault()}
          className={cn(
            "flex gap-4",
            layout === "stacked" ? "flex-col max-w-md mx-auto" : "flex-col sm:flex-row justify-center"
          )}
        >
          <input
            type="email"
            placeholder={placeholder}
            className={cn(
              "px-4 py-3 rounded-lg bg-white/10 border border-white/20 placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30",
              layout === "inline" && "sm:flex-1 sm:max-w-md"
            )}
          />
          <button
            type="submit"
            className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors whitespace-nowrap"
          >
            {buttonText}
          </button>
        </form>
      </div>
    </section>
  );
}

Newsletter.craft = {
  displayName: "Newsletter",
  props: {
    title: "Subscribe to Our Newsletter",
    subtitle: "Get the latest updates delivered to your inbox",
    buttonText: "Subscribe",
    placeholder: "Enter your email",
    layout: "inline",
    backgroundColor: "#1a1a2e",
    textColor: "#ffffff",
  },
  related: {
    toolbar: () => import("../settings/newsletter-settings").then((m) => m.NewsletterSettings),
  },
  rules: {
    canDrag: () => true,
  },
};
```

### Task 23.3: Navigation Header Component

**File: `src/components/editor/user-components/navigation.tsx`**

```typescript
"use client";

import { useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

export interface NavLink {
  label: string;
  href: string;
}

export interface NavigationProps {
  logo?: string;
  logoText?: string;
  links?: NavLink[];
  ctaText?: string;
  ctaHref?: string;
  backgroundColor?: string;
  textColor?: string;
  sticky?: boolean;
}

const defaultLinks: NavLink[] = [
  { label: "Home", href: "#" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export function Navigation({
  logo = "",
  logoText = "DRAMAC",
  links = defaultLinks,
  ctaText = "Get Started",
  ctaHref = "#",
  backgroundColor = "#ffffff",
  textColor = "",
  sticky = false,
}: NavigationProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <header
      ref={(ref) => connect(drag(ref!))}
      className={cn(
        "px-8 py-4",
        sticky && "sticky top-0 z-50"
      )}
      style={{ backgroundColor, color: textColor }}
    >
      <nav className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          {logo ? (
            <img src={logo} alt={logoText} className="h-8" />
          ) : (
            <span className="text-xl font-bold">{logoText}</span>
          )}
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="text-sm font-medium hover:opacity-80 transition-opacity"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA & Mobile Menu */}
        <div className="flex items-center gap-4">
          {ctaText && (
            <a
              href={ctaHref}
              className="hidden sm:inline-flex px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              {ctaText}
            </a>
          )}
          <button className="md:hidden p-2">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>
    </header>
  );
}

Navigation.craft = {
  displayName: "Navigation",
  props: {
    logo: "",
    logoText: "DRAMAC",
    links: defaultLinks,
    ctaText: "Get Started",
    ctaHref: "#",
    backgroundColor: "#ffffff",
    textColor: "",
    sticky: false,
  },
  related: {
    toolbar: () => import("../settings/navigation-settings").then((m) => m.NavigationSettings),
  },
  rules: {
    canDrag: () => true,
  },
};
```

### Task 23.4: Footer Component

**File: `src/components/editor/user-components/footer.tsx`**

```typescript
"use client";

import { useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface SocialLink {
  platform: string;
  href: string;
}

export interface FooterProps {
  logoText?: string;
  tagline?: string;
  columns?: FooterColumn[];
  socialLinks?: SocialLink[];
  copyright?: string;
  backgroundColor?: string;
  textColor?: string;
}

const defaultColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Integrations", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
];

const defaultSocials: SocialLink[] = [
  { platform: "twitter", href: "#" },
  { platform: "facebook", href: "#" },
  { platform: "linkedin", href: "#" },
];

export function Footer({
  logoText = "DRAMAC",
  tagline = "Build beautiful websites with ease",
  columns = defaultColumns,
  socialLinks = defaultSocials,
  copyright = `© ${new Date().getFullYear()} DRAMAC. All rights reserved.`,
  backgroundColor = "#1a1a2e",
  textColor = "#ffffff",
}: FooterProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <footer
      ref={(ref) => connect(drag(ref!))}
      className="px-8 py-12"
      style={{ backgroundColor, color: textColor }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Top Section */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <h4 className="text-xl font-bold mb-2">{logoText}</h4>
            <p className="opacity-70 mb-4">{tagline}</p>
            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <span className="text-xs uppercase">{social.platform[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {columns.map((column, index) => (
            <div key={index}>
              <h5 className="font-semibold mb-4">{column.title}</h5>
              <ul className="space-y-2">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-white/10 text-center text-sm opacity-70">
          {copyright}
        </div>
      </div>
    </footer>
  );
}

Footer.craft = {
  displayName: "Footer",
  props: {
    logoText: "DRAMAC",
    tagline: "Build beautiful websites with ease",
    columns: defaultColumns,
    socialLinks: defaultSocials,
    copyright: `© ${new Date().getFullYear()} DRAMAC. All rights reserved.`,
    backgroundColor: "#1a1a2e",
    textColor: "#ffffff",
  },
  related: {
    toolbar: () => import("../settings/footer-settings").then((m) => m.FooterSettings),
  },
  rules: {
    canDrag: () => true,
  },
};
```

### Task 23.5: Update Resolver with New Components

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
import { ContactForm } from "./user-components/contact-form";
import { Newsletter } from "./user-components/newsletter";
import { Navigation } from "./user-components/navigation";
import { Footer } from "./user-components/footer";

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
  ContactForm,
  Newsletter,
  Navigation,
  Footer,
};

// Component metadata for toolbox
export const componentRegistry = [
  // Navigation
  {
    name: "Navigation",
    displayName: "Navigation",
    description: "Site header with logo and links",
    category: "navigation" as const,
    icon: "Menu",
    component: Navigation,
  },
  // Layout
  {
    name: "Container",
    displayName: "Container",
    description: "A flexible container for other elements",
    category: "layout" as const,
    icon: "LayoutGrid",
    component: Container,
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
  // Forms
  {
    name: "ContactForm",
    displayName: "Contact Form",
    description: "Contact form with fields",
    category: "forms" as const,
    icon: "Mail",
    component: ContactForm,
  },
  {
    name: "Newsletter",
    displayName: "Newsletter",
    description: "Email subscription form",
    category: "forms" as const,
    icon: "Inbox",
    component: Newsletter,
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
  // Navigation (Footer)
  {
    name: "Footer",
    displayName: "Footer",
    description: "Site footer with links",
    category: "navigation" as const,
    icon: "PanelBottom",
    component: Footer,
  },
];
```

---

## 📐 Acceptance Criteria

- [ ] Contact form renders with configurable fields
- [ ] Newsletter component has inline/stacked layouts
- [ ] Navigation shows logo, links, and CTA
- [ ] Footer displays columns and social links
- [ ] All components draggable from toolbox
- [ ] Forms prevent actual submission in editor
- [ ] Mobile menu toggle displays (non-functional in editor)

---

## 📁 Files Created This Phase

```
src/components/editor/user-components/
├── contact-form.tsx
├── newsletter.tsx
├── navigation.tsx
└── footer.tsx

src/components/editor/
└── resolver.ts (updated)
```

---

## ➡️ Next Phase

**Phase 24: Form & Navigation Settings** - Settings for Contact Form, Newsletter, Navigation, Footer.
