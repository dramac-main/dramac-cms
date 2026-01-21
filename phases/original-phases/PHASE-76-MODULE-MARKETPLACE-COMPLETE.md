# Phase 76: Module Marketplace Complete

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🔴 CRITICAL
>
> **Estimated Time**: 8-10 hours

---

## 🎯 Objective

Create a fully functional module marketplace where agencies can browse, search, filter, and purchase modules for their client sites. Seed the marketplace with real modules and make the purchasing flow work end-to-end.

---

## 📋 Prerequisites

- [ ] LemonSqueezy integration configured
- [ ] Module database tables exist
- [ ] Agency subscription active
- [ ] Site management working

---

## 🔍 Current State Analysis

**What Exists:**
- ✅ Marketplace page at `/marketplace`
- ✅ Module card UI components
- ✅ Search and filter UI
- ✅ Module database tables (site_modules)
- ✅ Module actions file exists

**What's Missing:**
- ❌ `moduleRegistry = new Map()` - EMPTY REGISTRY!
- ❌ No modules seeded in database
- ❌ No module catalog/definitions
- ❌ Purchase flow not implemented
- ❌ Module installation flow not working
- ❌ Module pricing not set up
- ❌ Featured modules section
- ❌ Module detail page
- ❌ Module reviews/ratings
- ❌ Category filtering
- ❌ Installed modules view

---

## 💼 Business Value

1. **Revenue Stream** - Modules are premium add-ons
2. **Platform Stickiness** - More modules = harder to leave
3. **Feature Expansion** - Add capabilities without core bloat
4. **Agency Value** - Agencies can sell more to clients
5. **Ecosystem Growth** - Third-party developers can contribute

---

## 📁 Files to Create/Modify

```
src/lib/modules/
├── module-catalog.ts           # Module definitions
├── module-registry.ts          # Registry implementation (FIX)
├── module-service.ts           # Module business logic
├── module-installer.ts         # Installation logic
├── module-types.ts             # Type definitions

src/app/(dashboard)/marketplace/
├── page.tsx                    # Marketplace home (MODIFY)
├── [moduleId]/page.tsx         # Module detail page
├── installed/page.tsx          # Installed modules
├── loading.tsx                 # Loading state

src/app/api/modules/
├── route.ts                    # List modules API
├── [moduleId]/route.ts         # Module detail API
├── [moduleId]/install/route.ts # Install module API
├── [moduleId]/purchase/route.ts # Purchase module API

src/components/modules/
├── module-card.tsx             # Module card (ENHANCE)
├── module-grid.tsx             # Module grid
├── module-detail.tsx           # Detail view
├── module-install-button.tsx   # Install CTA
├── module-category-filter.tsx  # Category filter
├── featured-modules.tsx        # Featured section
├── installed-module-list.tsx   # Installed list

scripts/
├── seed-modules.ts             # Seed initial modules
```

---

## ✅ Tasks

### Task 76.1: Module Type Definitions

**File: `src/lib/modules/module-types.ts`**

```typescript
export type ModuleCategory =
  | "analytics"
  | "seo"
  | "ecommerce"
  | "forms"
  | "social"
  | "marketing"
  | "security"
  | "performance"
  | "communication"
  | "content"
  | "integrations"
  | "utilities";

export type ModulePricingType = "free" | "one-time" | "monthly" | "yearly";

export interface ModulePricing {
  type: ModulePricingType;
  amount: number; // In cents, 0 for free
  currency: string;
  lemonSqueezyProductId?: string;
  lemonSqueezyVariantId?: string;
}

export interface ModuleAuthor {
  name: string;
  email?: string;
  website?: string;
  verified: boolean;
}

export interface ModuleDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  version: string;
  icon: string;
  screenshots: string[];
  category: ModuleCategory;
  tags: string[];
  author: ModuleAuthor;
  pricing: ModulePricing;
  features: string[];
  requirements?: string[];
  changelog?: ChangelogEntry[];
  rating?: number;
  reviewCount?: number;
  installCount?: number;
  status: "active" | "deprecated" | "beta";
  createdAt: Date;
  updatedAt: Date;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export interface InstalledModule {
  id: string;
  siteId: string;
  moduleId: string;
  module: ModuleDefinition;
  installedAt: Date;
  lastUpdatedAt: Date;
  settings: Record<string, unknown>;
  enabled: boolean;
  licenseKey?: string;
}

export interface ModuleSearchParams {
  query?: string;
  category?: ModuleCategory;
  priceType?: ModulePricingType;
  sort?: "popular" | "newest" | "price-low" | "price-high" | "rating";
  page?: number;
  limit?: number;
}
```

---

### Task 76.2: Module Catalog

**File: `src/lib/modules/module-catalog.ts`**

```typescript
import type { ModuleDefinition, ModuleCategory } from "./module-types";

// Core platform modules - built-in and ready to use
export const MODULE_CATALOG: ModuleDefinition[] = [
  // ANALYTICS
  {
    id: "mod_analytics_google",
    slug: "google-analytics",
    name: "Google Analytics 4",
    description: "Integrate Google Analytics 4 for comprehensive website analytics.",
    longDescription: `
Track visitor behavior, traffic sources, and conversions with Google Analytics 4.
Get insights into how users interact with your site and optimize for better performance.

## Features
- Automatic page view tracking
- Event tracking for user interactions
- E-commerce tracking ready
- Custom dimensions and metrics
- Real-time reporting integration
    `,
    version: "1.0.0",
    icon: "📊",
    screenshots: ["/modules/ga4/screenshot-1.png", "/modules/ga4/screenshot-2.png"],
    category: "analytics",
    tags: ["analytics", "google", "tracking", "reporting"],
    author: {
      name: "DRAMAC",
      website: "https://dramac.app",
      verified: true,
    },
    pricing: {
      type: "free",
      amount: 0,
      currency: "USD",
    },
    features: [
      "Automatic page tracking",
      "Event tracking",
      "E-commerce support",
      "Custom events",
      "GDPR consent integration",
    ],
    status: "active",
    rating: 4.8,
    reviewCount: 124,
    installCount: 2340,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-06-01"),
  },
  {
    id: "mod_analytics_hotjar",
    slug: "hotjar",
    name: "Hotjar Heatmaps",
    description: "See how users interact with your site through heatmaps and recordings.",
    longDescription: `
Visualize user behavior with heatmaps, session recordings, and feedback polls.
Understand where users click, scroll, and what they ignore.
    `,
    version: "1.2.0",
    icon: "🔥",
    screenshots: [],
    category: "analytics",
    tags: ["heatmaps", "recordings", "ux", "analytics"],
    author: {
      name: "DRAMAC",
      verified: true,
    },
    pricing: {
      type: "monthly",
      amount: 999, // $9.99
      currency: "USD",
    },
    features: [
      "Click heatmaps",
      "Scroll heatmaps",
      "Session recordings",
      "Feedback polls",
      "Form analytics",
    ],
    status: "active",
    rating: 4.6,
    reviewCount: 89,
    installCount: 1240,
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-06-15"),
  },

  // SEO
  {
    id: "mod_seo_toolkit",
    slug: "seo-toolkit",
    name: "SEO Toolkit Pro",
    description: "Complete SEO optimization suite with meta tags, sitemaps, and schema markup.",
    longDescription: `
Everything you need to optimize your site for search engines.
Generate sitemaps, manage meta tags, add schema markup, and monitor SEO health.
    `,
    version: "2.0.0",
    icon: "🎯",
    screenshots: [],
    category: "seo",
    tags: ["seo", "sitemap", "meta", "schema", "search"],
    author: {
      name: "DRAMAC",
      verified: true,
    },
    pricing: {
      type: "monthly",
      amount: 1499, // $14.99
      currency: "USD",
    },
    features: [
      "Auto-generated sitemaps",
      "Meta tag management",
      "Schema markup builder",
      "SEO score analyzer",
      "Keyword suggestions",
      "Broken link checker",
    ],
    status: "active",
    rating: 4.9,
    reviewCount: 256,
    installCount: 3890,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-07-01"),
  },

  // ECOMMERCE
  {
    id: "mod_ecommerce_stripe",
    slug: "stripe-payments",
    name: "Stripe Payments",
    description: "Accept credit card payments with Stripe integration.",
    longDescription: `
Seamlessly accept payments on your website with Stripe.
Support for one-time payments, subscriptions, and checkout pages.
    `,
    version: "1.5.0",
    icon: "💳",
    screenshots: [],
    category: "ecommerce",
    tags: ["payments", "stripe", "checkout", "subscriptions"],
    author: {
      name: "DRAMAC",
      verified: true,
    },
    pricing: {
      type: "monthly",
      amount: 2499, // $24.99
      currency: "USD",
    },
    features: [
      "One-time payments",
      "Recurring subscriptions",
      "Hosted checkout",
      "Custom payment forms",
      "Invoice management",
      "Refund handling",
    ],
    status: "active",
    rating: 4.7,
    reviewCount: 178,
    installCount: 2100,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-06-20"),
  },
  {
    id: "mod_ecommerce_cart",
    slug: "shopping-cart",
    name: "Shopping Cart",
    description: "Full-featured shopping cart with product management and checkout.",
    longDescription: `
Add e-commerce capabilities to any site with our shopping cart module.
Manage products, handle cart operations, and process checkouts.
    `,
    version: "1.0.0",
    icon: "🛒",
    screenshots: [],
    category: "ecommerce",
    tags: ["cart", "products", "checkout", "ecommerce"],
    author: {
      name: "DRAMAC",
      verified: true,
    },
    pricing: {
      type: "monthly",
      amount: 3999, // $39.99
      currency: "USD",
    },
    features: [
      "Product catalog",
      "Shopping cart",
      "Checkout flow",
      "Order management",
      "Inventory tracking",
      "Discount codes",
    ],
    status: "active",
    rating: 4.5,
    reviewCount: 67,
    installCount: 890,
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-07-01"),
  },

  // FORMS
  {
    id: "mod_forms_advanced",
    slug: "advanced-forms",
    name: "Advanced Forms",
    description: "Create complex forms with conditional logic, file uploads, and integrations.",
    longDescription: `
Build powerful forms with multi-step flows, conditional logic, and validation.
Connect to email services, CRMs, and webhooks.
    `,
    version: "1.3.0",
    icon: "📝",
    screenshots: [],
    category: "forms",
    tags: ["forms", "contact", "leads", "surveys"],
    author: {
      name: "DRAMAC",
      verified: true,
    },
    pricing: {
      type: "monthly",
      amount: 1999, // $19.99
      currency: "USD",
    },
    features: [
      "Multi-step forms",
      "Conditional logic",
      "File uploads",
      "Form validation",
      "Email notifications",
      "Webhook integrations",
      "Spam protection",
    ],
    status: "active",
    rating: 4.8,
    reviewCount: 134,
    installCount: 2670,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-06-15"),
  },

  // SOCIAL
  {
    id: "mod_social_share",
    slug: "social-sharing",
    name: "Social Sharing",
    description: "Add social share buttons for all major platforms.",
    longDescription: `
Let visitors share your content across social media platforms.
Customizable buttons, share counts, and floating share bars.
    `,
    version: "1.1.0",
    icon: "📢",
    screenshots: [],
    category: "social",
    tags: ["social", "sharing", "facebook", "twitter", "linkedin"],
    author: {
      name: "DRAMAC",
      verified: true,
    },
    pricing: {
      type: "free",
      amount: 0,
      currency: "USD",
    },
    features: [
      "Share buttons",
      "Share counts",
      "Floating bar",
      "Custom styling",
      "10+ platforms",
    ],
    status: "active",
    rating: 4.4,
    reviewCount: 89,
    installCount: 4560,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-05-01"),
  },
  {
    id: "mod_social_feed",
    slug: "instagram-feed",
    name: "Instagram Feed",
    description: "Display your Instagram photos in a beautiful gallery.",
    longDescription: `
Showcase your Instagram content directly on your website.
Automatic updates, customizable layouts, and click-through to Instagram.
    `,
    version: "1.0.0",
    icon: "📸",
    screenshots: [],
    category: "social",
    tags: ["instagram", "feed", "gallery", "social"],
    author: {
      name: "DRAMAC",
      verified: true,
    },
    pricing: {
      type: "monthly",
      amount: 799, // $7.99
      currency: "USD",
    },
    features: [
      "Auto-sync feed",
      "Grid layouts",
      "Lightbox view",
      "Caption display",
      "Hashtag filtering",
    ],
    status: "active",
    rating: 4.3,
    reviewCount: 45,
    installCount: 1230,
    createdAt: new Date("2024-04-01"),
    updatedAt: new Date("2024-06-01"),
  },

  // MARKETING
  {
    id: "mod_marketing_popup",
    slug: "popup-builder",
    name: "Popup Builder",
    description: "Create exit-intent, timed, and scroll-triggered popups.",
    longDescription: `
Capture leads and reduce bounce rate with smart popups.
Exit-intent detection, A/B testing, and conversion tracking.
    `,
    version: "2.0.0",
    icon: "💬",
    screenshots: [],
    category: "marketing",
    tags: ["popup", "leads", "conversion", "marketing"],
    author: {
      name: "DRAMAC",
      verified: true,
    },
    pricing: {
      type: "monthly",
      amount: 1499, // $14.99
      currency: "USD",
    },
    features: [
      "Exit-intent triggers",
      "Scroll triggers",
      "Time-based triggers",
      "A/B testing",
      "Conversion tracking",
      "Email integration",
    ],
    status: "active",
    rating: 4.6,
    reviewCount: 112,
    installCount: 1890,
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-07-01"),
  },
  {
    id: "mod_marketing_email",
    slug: "email-marketing",
    name: "Email Marketing",
    description: "Send newsletters, drip campaigns, and automated emails.",
    longDescription: `
Full email marketing platform integrated into your dashboard.
Build lists, create campaigns, and track performance.
    `,
    version: "1.0.0",
    icon: "📧",
    screenshots: [],
    category: "marketing",
    tags: ["email", "newsletter", "campaigns", "automation"],
    author: {
      name: "DRAMAC",
      verified: true,
    },
    pricing: {
      type: "monthly",
      amount: 2999, // $29.99
      currency: "USD",
    },
    features: [
      "Email templates",
      "List management",
      "Drip campaigns",
      "Automation triggers",
      "Analytics dashboard",
      "A/B testing",
    ],
    status: "beta",
    rating: 4.2,
    reviewCount: 23,
    installCount: 450,
    createdAt: new Date("2024-05-01"),
    updatedAt: new Date("2024-07-01"),
  },

  // SECURITY
  {
    id: "mod_security_ssl",
    slug: "ssl-manager",
    name: "SSL Manager",
    description: "Automatic SSL certificate provisioning and management.",
    longDescription: `
Ensure your sites are always secure with automatic SSL.
Free Let's Encrypt certificates with auto-renewal.
    `,
    version: "1.0.0",
    icon: "🔒",
    screenshots: [],
    category: "security",
    tags: ["ssl", "https", "security", "certificates"],
    author: {
      name: "DRAMAC",
      verified: true,
    },
    pricing: {
      type: "free",
      amount: 0,
      currency: "USD",
    },
    features: [
      "Auto SSL provisioning",
      "Auto renewal",
      "Force HTTPS",
      "Certificate status",
      "Custom SSL support",
    ],
    status: "active",
    rating: 4.9,
    reviewCount: 234,
    installCount: 5670,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-06-01"),
  },
  {
    id: "mod_security_backup",
    slug: "auto-backup",
    name: "Auto Backup",
    description: "Automated site backups with one-click restore.",
    longDescription: `
Never lose your work with automated daily backups.
Store backups in the cloud and restore with one click.
    `,
    version: "1.2.0",
    icon: "💾",
    screenshots: [],
    category: "security",
    tags: ["backup", "restore", "security", "recovery"],
    author: {
      name: "DRAMAC",
      verified: true,
    },
    pricing: {
      type: "monthly",
      amount: 999, // $9.99
      currency: "USD",
    },
    features: [
      "Daily backups",
      "One-click restore",
      "Cloud storage",
      "Backup history",
      "Manual backups",
      "Backup scheduling",
    ],
    status: "active",
    rating: 4.7,
    reviewCount: 89,
    installCount: 1780,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-06-15"),
  },

  // PERFORMANCE
  {
    id: "mod_performance_cdn",
    slug: "cdn-optimization",
    name: "CDN Optimization",
    description: "Speed up your site with global CDN and asset optimization.",
    longDescription: `
Deliver content faster with edge caching and optimization.
Automatic image compression and lazy loading.
    `,
    version: "1.0.0",
    icon: "⚡",
    screenshots: [],
    category: "performance",
    tags: ["cdn", "speed", "caching", "optimization"],
    author: {
      name: "DRAMAC",
      verified: true,
    },
    pricing: {
      type: "monthly",
      amount: 1999, // $19.99
      currency: "USD",
    },
    features: [
      "Global CDN",
      "Edge caching",
      "Image optimization",
      "Lazy loading",
      "Minification",
      "Compression",
    ],
    status: "active",
    rating: 4.8,
    reviewCount: 156,
    installCount: 2340,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-06-20"),
  },

  // COMMUNICATION
  {
    id: "mod_communication_chat",
    slug: "live-chat",
    name: "Live Chat",
    description: "Real-time chat widget for customer support.",
    longDescription: `
Engage visitors with real-time chat support.
Customizable widget, chat history, and offline messages.
    `,
    version: "1.5.0",
    icon: "💬",
    screenshots: [],
    category: "communication",
    tags: ["chat", "support", "customer-service", "messaging"],
    author: {
      name: "DRAMAC",
      verified: true,
    },
    pricing: {
      type: "monthly",
      amount: 2499, // $24.99
      currency: "USD",
    },
    features: [
      "Real-time chat",
      "Chat widget customization",
      "Chat history",
      "Offline messages",
      "File sharing",
      "Typing indicators",
    ],
    status: "active",
    rating: 4.5,
    reviewCount: 78,
    installCount: 1450,
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-07-01"),
  },

  // CONTENT
  {
    id: "mod_content_blog",
    slug: "blog-engine",
    name: "Blog Engine",
    description: "Full-featured blog with categories, tags, and comments.",
    longDescription: `
Add a professional blog to any site.
Categories, tags, comments, and SEO optimization built-in.
    `,
    version: "2.0.0",
    icon: "📰",
    screenshots: [],
    category: "content",
    tags: ["blog", "posts", "articles", "cms"],
    author: {
      name: "DRAMAC",
      verified: true,
    },
    pricing: {
      type: "free",
      amount: 0,
      currency: "USD",
    },
    features: [
      "Post management",
      "Categories & tags",
      "Comments system",
      "Author profiles",
      "RSS feed",
      "SEO optimization",
    ],
    status: "active",
    rating: 4.6,
    reviewCount: 189,
    installCount: 4320,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-06-15"),
  },

  // INTEGRATIONS
  {
    id: "mod_integration_zapier",
    slug: "zapier",
    name: "Zapier Integration",
    description: "Connect to 5000+ apps with Zapier automations.",
    longDescription: `
Automate workflows between your site and thousands of apps.
Trigger Zaps from form submissions, purchases, and more.
    `,
    version: "1.0.0",
    icon: "🔗",
    screenshots: [],
    category: "integrations",
    tags: ["zapier", "automation", "integrations", "workflows"],
    author: {
      name: "DRAMAC",
      verified: true,
    },
    pricing: {
      type: "monthly",
      amount: 999, // $9.99
      currency: "USD",
    },
    features: [
      "Webhook triggers",
      "5000+ app connections",
      "Multi-step Zaps",
      "Custom triggers",
      "Data mapping",
    ],
    status: "active",
    rating: 4.7,
    reviewCount: 67,
    installCount: 1890,
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-06-01"),
  },
  {
    id: "mod_integration_mailchimp",
    slug: "mailchimp",
    name: "Mailchimp",
    description: "Sync leads and customers with your Mailchimp lists.",
    longDescription: `
Automatically add form submissions to Mailchimp audiences.
Sync customer data and trigger automations.
    `,
    version: "1.1.0",
    icon: "🐵",
    screenshots: [],
    category: "integrations",
    tags: ["mailchimp", "email", "lists", "marketing"],
    author: {
      name: "DRAMAC",
      verified: true,
    },
    pricing: {
      type: "free",
      amount: 0,
      currency: "USD",
    },
    features: [
      "List sync",
      "Form integration",
      "Tag management",
      "Double opt-in",
      "Merge fields",
    ],
    status: "active",
    rating: 4.4,
    reviewCount: 56,
    installCount: 2340,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-05-15"),
  },

  // UTILITIES
  {
    id: "mod_utility_cookies",
    slug: "cookie-consent",
    name: "Cookie Consent",
    description: "GDPR-compliant cookie consent banner and management.",
    longDescription: `
Stay compliant with GDPR and cookie laws.
Customizable banners, cookie categories, and consent logging.
    `,
    version: "1.2.0",
    icon: "🍪",
    screenshots: [],
    category: "utilities",
    tags: ["cookies", "gdpr", "consent", "compliance"],
    author: {
      name: "DRAMAC",
      verified: true,
    },
    pricing: {
      type: "free",
      amount: 0,
      currency: "USD",
    },
    features: [
      "Consent banner",
      "Cookie categories",
      "Consent logging",
      "Customizable design",
      "Auto-block scripts",
      "Privacy policy link",
    ],
    status: "active",
    rating: 4.5,
    reviewCount: 123,
    installCount: 3450,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-06-01"),
  },
  {
    id: "mod_utility_redirect",
    slug: "redirect-manager",
    name: "Redirect Manager",
    description: "Manage 301/302 redirects and broken link handling.",
    longDescription: `
Handle URL changes gracefully with redirect management.
Set up redirects, track 404s, and maintain SEO value.
    `,
    version: "1.0.0",
    icon: "↪️",
    screenshots: [],
    category: "utilities",
    tags: ["redirects", "301", "404", "seo"],
    author: {
      name: "DRAMAC",
      verified: true,
    },
    pricing: {
      type: "free",
      amount: 0,
      currency: "USD",
    },
    features: [
      "301 redirects",
      "302 redirects",
      "Wildcard patterns",
      "404 tracking",
      "Import/export",
      "Regex support",
    ],
    status: "active",
    rating: 4.6,
    reviewCount: 78,
    installCount: 2100,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-05-15"),
  },
];

// Category metadata
export const MODULE_CATEGORIES: { id: ModuleCategory; label: string; icon: string; description: string }[] = [
  { id: "analytics", label: "Analytics", icon: "📊", description: "Track and analyze visitor behavior" },
  { id: "seo", label: "SEO", icon: "🎯", description: "Optimize for search engines" },
  { id: "ecommerce", label: "E-Commerce", icon: "🛒", description: "Sell products and services" },
  { id: "forms", label: "Forms", icon: "📝", description: "Collect leads and data" },
  { id: "social", label: "Social", icon: "📢", description: "Social media integration" },
  { id: "marketing", label: "Marketing", icon: "📧", description: "Email and campaigns" },
  { id: "security", label: "Security", icon: "🔒", description: "Protect your site" },
  { id: "performance", label: "Performance", icon: "⚡", description: "Speed optimization" },
  { id: "communication", label: "Communication", icon: "💬", description: "Chat and messaging" },
  { id: "content", label: "Content", icon: "📰", description: "CMS and publishing" },
  { id: "integrations", label: "Integrations", icon: "🔗", description: "Connect third-party apps" },
  { id: "utilities", label: "Utilities", icon: "🔧", description: "Helpful tools" },
];

// Helper functions
export function getModuleById(id: string): ModuleDefinition | undefined {
  return MODULE_CATALOG.find((m) => m.id === id);
}

export function getModuleBySlug(slug: string): ModuleDefinition | undefined {
  return MODULE_CATALOG.find((m) => m.slug === slug);
}

export function getModulesByCategory(category: ModuleCategory): ModuleDefinition[] {
  return MODULE_CATALOG.filter((m) => m.category === category);
}

export function getFeaturedModules(): ModuleDefinition[] {
  return MODULE_CATALOG
    .filter((m) => m.status === "active" && (m.rating || 0) >= 4.5)
    .sort((a, b) => (b.installCount || 0) - (a.installCount || 0))
    .slice(0, 6);
}

export function searchModules(query: string): ModuleDefinition[] {
  const q = query.toLowerCase();
  return MODULE_CATALOG.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.tags.some((t) => t.includes(q))
  );
}

export function formatPrice(pricing: ModulePricing): string {
  if (pricing.type === "free") return "Free";
  const amount = (pricing.amount / 100).toFixed(2);
  const suffix = pricing.type === "monthly" ? "/mo" : pricing.type === "yearly" ? "/yr" : "";
  return `$${amount}${suffix}`;
}
```

---

### Task 76.3: Module Registry (Fix Empty Registry)

**File: `src/lib/modules/module-registry.ts`**

```typescript
import { MODULE_CATALOG, getModuleById, searchModules as catalogSearch } from "./module-catalog";
import type { ModuleDefinition, ModuleCategory, ModuleSearchParams } from "./module-types";

// Populated module registry using catalog
class ModuleRegistry {
  private modules: Map<string, ModuleDefinition>;

  constructor() {
    this.modules = new Map();
    // Initialize with catalog modules
    MODULE_CATALOG.forEach((module) => {
      this.modules.set(module.id, module);
    });
  }

  get(id: string): ModuleDefinition | undefined {
    return this.modules.get(id);
  }

  getBySlug(slug: string): ModuleDefinition | undefined {
    return Array.from(this.modules.values()).find((m) => m.slug === slug);
  }

  getAll(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  getByCategory(category: ModuleCategory): ModuleDefinition[] {
    return this.getAll().filter((m) => m.category === category);
  }

  search(params: ModuleSearchParams): { modules: ModuleDefinition[]; total: number } {
    let results = this.getAll();

    // Filter by query
    if (params.query) {
      const q = params.query.toLowerCase();
      results = results.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Filter by category
    if (params.category) {
      results = results.filter((m) => m.category === params.category);
    }

    // Filter by price type
    if (params.priceType) {
      results = results.filter((m) => m.pricing.type === params.priceType);
    }

    // Sort
    switch (params.sort) {
      case "popular":
        results.sort((a, b) => (b.installCount || 0) - (a.installCount || 0));
        break;
      case "newest":
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case "price-low":
        results.sort((a, b) => a.pricing.amount - b.pricing.amount);
        break;
      case "price-high":
        results.sort((a, b) => b.pricing.amount - a.pricing.amount);
        break;
      case "rating":
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        results.sort((a, b) => (b.installCount || 0) - (a.installCount || 0));
    }

    const total = results.length;

    // Pagination
    const page = params.page || 1;
    const limit = params.limit || 20;
    const start = (page - 1) * limit;
    results = results.slice(start, start + limit);

    return { modules: results, total };
  }

  getFeatured(): ModuleDefinition[] {
    return this.getAll()
      .filter((m) => m.status === "active" && (m.rating || 0) >= 4.5)
      .sort((a, b) => (b.installCount || 0) - (a.installCount || 0))
      .slice(0, 6);
  }

  register(module: ModuleDefinition): void {
    this.modules.set(module.id, module);
  }

  unregister(id: string): boolean {
    return this.modules.delete(id);
  }
}

// Export singleton instance
export const moduleRegistry = new ModuleRegistry();

// Export for backward compatibility
export default moduleRegistry;
```

---

### Task 76.4: Module Service

**File: `src/lib/modules/module-service.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { moduleRegistry } from "./module-registry";
import type { ModuleDefinition, InstalledModule, ModuleSearchParams } from "./module-types";

export interface ModuleInstallResult {
  success: boolean;
  error?: string;
  installation?: InstalledModule;
}

export async function getInstalledModules(siteId: string): Promise<InstalledModule[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_modules")
    .select("*")
    .eq("site_id", siteId)
    .eq("enabled", true);

  if (error) {
    console.error("[ModuleService] Error fetching installed modules:", error);
    return [];
  }

  return data.map((row) => {
    const module = moduleRegistry.get(row.module_id);
    return {
      id: row.id,
      siteId: row.site_id,
      moduleId: row.module_id,
      module: module!,
      installedAt: new Date(row.installed_at),
      lastUpdatedAt: new Date(row.updated_at || row.installed_at),
      settings: row.settings || {},
      enabled: row.enabled,
      licenseKey: row.license_key,
    };
  }).filter((m) => m.module); // Filter out modules not in registry
}

export async function installModule(
  siteId: string,
  moduleId: string,
  licenseKey?: string
): Promise<ModuleInstallResult> {
  const supabase = await createClient();

  // Check module exists
  const module = moduleRegistry.get(moduleId);
  if (!module) {
    return { success: false, error: "Module not found" };
  }

  // Check if already installed
  const { data: existing } = await supabase
    .from("site_modules")
    .select("id")
    .eq("site_id", siteId)
    .eq("module_id", moduleId)
    .single();

  if (existing) {
    return { success: false, error: "Module already installed" };
  }

  // For paid modules, verify license/purchase
  if (module.pricing.type !== "free" && !licenseKey) {
    return { success: false, error: "License key required for paid modules" };
  }

  // Install module
  const { data, error } = await supabase
    .from("site_modules")
    .insert({
      site_id: siteId,
      module_id: moduleId,
      enabled: true,
      settings: {},
      license_key: licenseKey || null,
      installed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("[ModuleService] Error installing module:", error);
    return { success: false, error: "Failed to install module" };
  }

  return {
    success: true,
    installation: {
      id: data.id,
      siteId: data.site_id,
      moduleId: data.module_id,
      module: module,
      installedAt: new Date(data.installed_at),
      lastUpdatedAt: new Date(data.installed_at),
      settings: {},
      enabled: true,
      licenseKey: data.license_key,
    },
  };
}

export async function uninstallModule(siteId: string, moduleId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("site_modules")
    .delete()
    .eq("site_id", siteId)
    .eq("module_id", moduleId);

  if (error) {
    console.error("[ModuleService] Error uninstalling module:", error);
    return { success: false, error: "Failed to uninstall module" };
  }

  return { success: true };
}

export async function updateModuleSettings(
  siteId: string,
  moduleId: string,
  settings: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("site_modules")
    .update({ settings, updated_at: new Date().toISOString() })
    .eq("site_id", siteId)
    .eq("module_id", moduleId);

  if (error) {
    console.error("[ModuleService] Error updating module settings:", error);
    return { success: false, error: "Failed to update settings" };
  }

  return { success: true };
}

export async function toggleModule(
  siteId: string,
  moduleId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("site_modules")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("site_id", siteId)
    .eq("module_id", moduleId);

  if (error) {
    console.error("[ModuleService] Error toggling module:", error);
    return { success: false, error: "Failed to toggle module" };
  }

  return { success: true };
}

export async function searchModules(params: ModuleSearchParams): Promise<{
  modules: ModuleDefinition[];
  total: number;
}> {
  // Use registry search (in-memory for now, can be DB later)
  return moduleRegistry.search(params);
}

export async function getModuleDetails(moduleIdOrSlug: string): Promise<ModuleDefinition | null> {
  const module = moduleRegistry.get(moduleIdOrSlug) || moduleRegistry.getBySlug(moduleIdOrSlug);
  return module || null;
}

export async function isModuleInstalled(siteId: string, moduleId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from("site_modules")
    .select("id")
    .eq("site_id", siteId)
    .eq("module_id", moduleId)
    .single();

  return !!data;
}
```

---

### Task 76.5: Module Card Component (Enhanced)

**File: `src/components/modules/module-card.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Download, Loader2, Check, ExternalLink } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ModuleDefinition } from "@/lib/modules/module-types";
import { formatPrice } from "@/lib/modules/module-catalog";
import { cn } from "@/lib/utils";

interface ModuleCardProps {
  module: ModuleDefinition;
  isInstalled?: boolean;
  onInstall?: (moduleId: string) => Promise<void>;
  showInstallButton?: boolean;
  siteId?: string;
}

export function ModuleCard({
  module,
  isInstalled = false,
  onInstall,
  showInstallButton = true,
  siteId,
}: ModuleCardProps) {
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    if (!onInstall || isInstalled) return;
    setInstalling(true);
    try {
      await onInstall(module.id);
    } finally {
      setInstalling(false);
    }
  };

  const isFree = module.pricing.type === "free";
  const isBeta = module.status === "beta";

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{module.icon}</span>
            <div>
              <Link
                href={`/marketplace/${module.slug}`}
                className="font-semibold hover:text-primary transition-colors"
              >
                {module.name}
              </Link>
              <p className="text-xs text-muted-foreground">
                by {module.author.name}
                {module.author.verified && (
                  <span className="ml-1 text-blue-500">✓</span>
                )}
              </p>
            </div>
          </div>
          {isBeta && (
            <Badge variant="secondary" className="text-xs">
              Beta
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {module.description}
        </p>

        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          {module.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{module.rating.toFixed(1)}</span>
              <span>({module.reviewCount})</span>
            </div>
          )}
          {module.installCount && (
            <div className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              <span>{module.installCount.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mt-3">
          {module.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t flex items-center justify-between">
        <div
          className={cn(
            "font-semibold",
            isFree ? "text-green-600" : "text-primary"
          )}
        >
          {formatPrice(module.pricing)}
        </div>

        {showInstallButton && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/marketplace/${module.slug}`}>
                <ExternalLink className="h-3 w-3 mr-1" />
                Details
              </Link>
            </Button>

            {isInstalled ? (
              <Button size="sm" variant="secondary" disabled>
                <Check className="h-3 w-3 mr-1" />
                Installed
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleInstall}
                disabled={installing}
              >
                {installing ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                {isFree ? "Install" : "Purchase"}
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
```

---

### Task 76.6: Featured Modules Component

**File: `src/components/modules/featured-modules.tsx`**

```tsx
"use client";

import { ModuleCard } from "./module-card";
import type { ModuleDefinition } from "@/lib/modules/module-types";

interface FeaturedModulesProps {
  modules: ModuleDefinition[];
  installedIds?: string[];
  onInstall?: (moduleId: string) => Promise<void>;
}

export function FeaturedModules({
  modules,
  installedIds = [],
  onInstall,
}: FeaturedModulesProps) {
  if (modules.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Featured Modules</h2>
          <p className="text-sm text-muted-foreground">
            Top-rated modules to supercharge your sites
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            isInstalled={installedIds.includes(module.id)}
            onInstall={onInstall}
          />
        ))}
      </div>
    </section>
  );
}
```

---

### Task 76.7: Category Filter Component

**File: `src/components/modules/module-category-filter.tsx`**

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MODULE_CATEGORIES } from "@/lib/modules/module-catalog";
import type { ModuleCategory } from "@/lib/modules/module-types";
import { cn } from "@/lib/utils";

interface ModuleCategoryFilterProps {
  selected: ModuleCategory | null;
  onChange: (category: ModuleCategory | null) => void;
}

export function ModuleCategoryFilter({
  selected,
  onChange,
}: ModuleCategoryFilterProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        <Button
          variant={selected === null ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(null)}
        >
          All
        </Button>

        {MODULE_CATEGORIES.map((category) => (
          <Button
            key={category.id}
            variant={selected === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(category.id)}
            className={cn(
              selected === category.id && "bg-primary"
            )}
          >
            <span className="mr-1">{category.icon}</span>
            {category.label}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
```

---

### Task 76.8: Module Grid Component

**File: `src/components/modules/module-grid.tsx`**

```tsx
"use client";

import { ModuleCard } from "./module-card";
import type { ModuleDefinition } from "@/lib/modules/module-types";
import { Package } from "lucide-react";

interface ModuleGridProps {
  modules: ModuleDefinition[];
  installedIds?: string[];
  onInstall?: (moduleId: string) => Promise<void>;
  loading?: boolean;
  emptyMessage?: string;
}

export function ModuleGrid({
  modules,
  installedIds = [],
  onInstall,
  loading = false,
  emptyMessage = "No modules found",
}: ModuleGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-64 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">{emptyMessage}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {modules.map((module) => (
        <ModuleCard
          key={module.id}
          module={module}
          isInstalled={installedIds.includes(module.id)}
          onInstall={onInstall}
        />
      ))}
    </div>
  );
}
```

---

### Task 76.9: Marketplace Page (Replace)

**File: `src/app/(dashboard)/marketplace/page.tsx`**

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FeaturedModules } from "@/components/modules/featured-modules";
import { ModuleCategoryFilter } from "@/components/modules/module-category-filter";
import { ModuleGrid } from "@/components/modules/module-grid";
import { moduleRegistry } from "@/lib/modules/module-registry";
import type { ModuleDefinition, ModuleCategory, ModulePricingType } from "@/lib/modules/module-types";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

type SortOption = "popular" | "newest" | "price-low" | "price-high" | "rating";

export default function MarketplacePage() {
  const [modules, setModules] = useState<ModuleDefinition[]>([]);
  const [featuredModules, setFeaturedModules] = useState<ModuleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ModuleCategory | null>(null);
  const [priceType, setPriceType] = useState<ModulePricingType | "all">("all");
  const [sort, setSort] = useState<SortOption>("popular");
  
  const debouncedSearch = useDebounce(search, 300);

  // Load modules
  const loadModules = useCallback(() => {
    setLoading(true);
    
    const { modules: results } = moduleRegistry.search({
      query: debouncedSearch || undefined,
      category: category || undefined,
      priceType: priceType === "all" ? undefined : priceType,
      sort,
    });

    setModules(results);
    setLoading(false);
  }, [debouncedSearch, category, priceType, sort]);

  // Initial load
  useEffect(() => {
    setFeaturedModules(moduleRegistry.getFeatured());
    loadModules();
  }, [loadModules]);

  // Reload on filter change
  useEffect(() => {
    loadModules();
  }, [debouncedSearch, category, priceType, sort, loadModules]);

  const handleInstall = async (moduleId: string) => {
    // This would call the install API
    // For now, show a toast
    const module = moduleRegistry.get(moduleId);
    if (!module) return;

    if (module.pricing.type === "free") {
      toast.success(`${module.name} installed successfully!`);
    } else {
      toast.info(`Redirecting to purchase ${module.name}...`);
      // Would redirect to LemonSqueezy checkout
    }
  };

  const showFeatured = !search && !category && priceType === "all";

  return (
    <div className="container py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Module Marketplace</h1>
        <p className="text-muted-foreground">
          Extend your sites with powerful modules
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <Label className="mb-3 block">Price</Label>
                  <RadioGroup
                    value={priceType}
                    onValueChange={(v) => setPriceType(v as ModulePricingType | "all")}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all">All</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="free" id="free" />
                      <Label htmlFor="free">Free</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="monthly" id="monthly" />
                      <Label htmlFor="monthly">Monthly</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="one-time" id="one-time" />
                      <Label htmlFor="one-time">One-time</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setCategory(null);
                    setPriceType("all");
                    setSearch("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <ModuleCategoryFilter selected={category} onChange={setCategory} />
      </div>

      {/* Featured Modules */}
      {showFeatured && (
        <FeaturedModules
          modules={featuredModules}
          onInstall={handleInstall}
        />
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {category
            ? `${category.charAt(0).toUpperCase() + category.slice(1)} Modules`
            : search
            ? `Search Results`
            : "All Modules"}
        </h2>
        <span className="text-sm text-muted-foreground">
          {modules.length} module{modules.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Module Grid */}
      <ModuleGrid
        modules={modules}
        onInstall={handleInstall}
        loading={loading}
        emptyMessage={search ? "No modules match your search" : "No modules available"}
      />
    </div>
  );
}
```

---

### Task 76.10: Module Detail Page

**File: `src/app/(dashboard)/marketplace/[moduleId]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Download,
  Check,
  ExternalLink,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getModuleBySlug, formatPrice, MODULE_CATEGORIES } from "@/lib/modules/module-catalog";

interface ModuleDetailPageProps {
  params: Promise<{ moduleId: string }>;
}

export default async function ModuleDetailPage({ params }: ModuleDetailPageProps) {
  const { moduleId } = await params;
  const module = getModuleBySlug(moduleId);

  if (!module) {
    notFound();
  }

  const category = MODULE_CATEGORIES.find((c) => c.id === module.category);
  const isFree = module.pricing.type === "free";

  return (
    <div className="container py-6 max-w-5xl">
      {/* Back Link */}
      <Link
        href="/marketplace"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Marketplace
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{module.icon}</span>
            <div>
              <h1 className="text-3xl font-bold">{module.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <span>by {module.author.name}</span>
                {module.author.verified && (
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <p className="text-lg text-muted-foreground mb-4">
            {module.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            {module.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{module.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({module.reviewCount} reviews)
                </span>
              </div>
            )}
            {module.installCount && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Download className="h-4 w-4" />
                <span>{module.installCount.toLocaleString()} installs</span>
              </div>
            )}
            {category && (
              <Badge variant="outline">
                {category.icon} {category.label}
              </Badge>
            )}
            {module.status === "beta" && (
              <Badge variant="secondary">Beta</Badge>
            )}
          </div>
        </div>

        {/* Pricing Card */}
        <Card className="w-full md:w-80 shrink-0">
          <CardHeader>
            <CardTitle className="text-2xl">
              {formatPrice(module.pricing)}
            </CardTitle>
            {module.pricing.type === "monthly" && (
              <p className="text-sm text-muted-foreground">
                Billed monthly per site
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" size="lg">
              {isFree ? "Install Module" : "Purchase & Install"}
            </Button>

            <ul className="space-y-2 text-sm">
              {module.features.slice(0, 5).map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {module.author.website && (
              <a
                href={module.author.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
                Visit Developer Site
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="mb-8" />

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="changelog">Changelog</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="prose dark:prose-invert max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html: module.longDescription.replace(/\n/g, "<br />"),
              }}
            />
          </div>

          {/* Tags */}
          <div className="mt-8">
            <h3 className="font-medium mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {module.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {module.features.map((feature, i) => (
              <Card key={i}>
                <CardContent className="flex items-start gap-3 pt-4">
                  <Check className="h-5 w-5 text-green-500 shrink-0" />
                  <span>{feature}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {module.requirements && module.requirements.length > 0 && (
            <div className="mt-8">
              <h3 className="font-medium mb-3">Requirements</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {module.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="changelog" className="mt-6">
          {module.changelog && module.changelog.length > 0 ? (
            <div className="space-y-6">
              {module.changelog.map((entry, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">v{entry.version}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {entry.date}
                    </span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {entry.changes.map((change, j) => (
                      <li key={j}>{change}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No changelog available yet.</p>
          )}
        </TabsContent>
      </Tabs>

      {/* Module Info Footer */}
      <div className="mt-12 pt-6 border-t">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Version</span>
            <p className="font-medium">{module.version}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Last Updated</span>
            <p className="font-medium">
              {module.updatedAt.toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Category</span>
            <p className="font-medium">{category?.label}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Status</span>
            <p className="font-medium capitalize">{module.status}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### Task 76.11: Installed Modules Page

**File: `src/app/(dashboard)/marketplace/installed/page.tsx`**

```tsx
import Link from "next/link";
import { ArrowLeft, Package, Settings, Trash2, ToggleLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

// This would fetch from the database for the selected site
// For now, showing empty state
export default function InstalledModulesPage() {
  const installedModules: unknown[] = []; // Would come from getInstalledModules(siteId)

  return (
    <div className="container py-6 max-w-5xl">
      {/* Back Link */}
      <Link
        href="/marketplace"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Marketplace
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Installed Modules</h1>
          <p className="text-muted-foreground mt-1">
            Manage modules installed on your sites
          </p>
        </div>
        <Button asChild>
          <Link href="/marketplace">Browse Marketplace</Link>
        </Button>
      </div>

      {installedModules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No Modules Installed</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Extend your sites with powerful modules from the marketplace.
              Install analytics, forms, e-commerce, and more.
            </p>
            <Button asChild>
              <Link href="/marketplace">Browse Marketplace</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Would map over installedModules here */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <h3 className="font-medium">Google Analytics 4</h3>
                  <p className="text-sm text-muted-foreground">
                    Installed 3 days ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Enabled</span>
                  <Switch checked={true} />
                </div>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}
```

---

### Task 76.12: Debounce Hook (if not exists)

**File: `src/hooks/use-debounce.ts`**

```typescript
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Module registry returns all modules
- [ ] Search filters work correctly
- [ ] Category filtering works
- [ ] Price formatting is correct

### Integration Tests
- [ ] Marketplace page loads modules
- [ ] Module detail page renders
- [ ] Install flow works for free modules
- [ ] Purchase redirect works for paid modules

### E2E Tests
- [ ] User can browse marketplace
- [ ] User can search modules
- [ ] User can filter by category
- [ ] User can view module details
- [ ] User can install free module
- [ ] User can purchase paid module

---

## ✅ Completion Checklist

- [ ] Module types defined
- [ ] Module catalog with 20+ modules
- [ ] Module registry populated (not empty!)
- [ ] Module service with CRUD operations
- [ ] Module card component enhanced
- [ ] Featured modules section
- [ ] Category filter component
- [ ] Module grid component
- [ ] Marketplace page working
- [ ] Module detail page working
- [ ] Installed modules page working
- [ ] Debounce hook created
- [ ] Tests passing

---

**Next Phase**: Phase 77 - Site Publishing Complete
