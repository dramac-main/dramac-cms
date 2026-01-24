import type { ModuleDefinition, ModuleCategory, ModulePricing } from "./module-types";

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
  // INTEGRATIONS - 20th module
  {
    id: "mod_integration_zapier",
    slug: "zapier-integration",
    name: "Zapier Integration",
    description: "Connect your site to 5000+ apps with Zapier webhooks.",
    longDescription: `
Automate workflows by connecting your site to thousands of apps.
Trigger Zapier automations from form submissions, page views, and custom events.

## Features
- Webhook triggers for Zapier
- Custom event mapping
- Multiple Zap connections
- Real-time data sync
- Easy setup with Zapier templates
    `,
    version: "1.0.0",
    icon: "⚡",
    screenshots: ["/modules/zapier/screenshot-1.png"],
    category: "integrations",
    tags: ["zapier", "automation", "webhook", "integration"],
    author: {
      name: "DRAMAC",
      website: "https://dramac.app",
      verified: true,
    },
    pricing: {
      type: "monthly",
      amount: 999,
      currency: "USD",
    },
    features: [
      "Unlimited Zap connections",
      "Custom webhooks",
      "Event triggers",
      "Form submission hooks",
      "Real-time sync",
      "Zapier templates",
    ],
    status: "active",
    rating: 4.7,
    reviewCount: 156,
    installCount: 1890,
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-06-01"),
  },
  
  // BUSINESS & CRM - 21st module
  {
    id: "bookmod01",
    slug: "booking",
    name: "Booking & Scheduling",
    description: "Appointment scheduling, calendar management, and online booking system.",
    longDescription: `
Complete booking and appointment management system for service-based businesses.
Perfect for salons, spas, consultants, medical offices, and any business that takes appointments.

## Features
- Service management with pricing and duration
- Staff scheduling and availability
- Customer appointment booking
- Calendar views (week, day, month)
- Automated reminders (email/SMS)
- Payment integration ready
- Analytics and reporting
- Customer management

## Perfect For
- Salons & Spas
- Medical & Dental Offices
- Consultants & Coaches
- Fitness Studios
- Event Venues
- Professional Services
    `,
    version: "1.0.0",
    icon: "Calendar",
    screenshots: ["/modules/booking/screenshot-calendar.png", "/modules/booking/screenshot-appointments.png"],
    category: "content",
    tags: ["booking", "appointments", "calendar", "scheduling", "reservations", "services"],
    author: {
      name: "DRAMAC",
      website: "https://dramac.app",
      verified: true,
    },
    pricing: {
      type: "monthly",
      amount: 2999, // $29.99/month
      currency: "USD",
    },
    features: [
      "Service management",
      "Staff scheduling",
      "Calendar booking",
      "Appointment management",
      "Email/SMS reminders",
      "Customer portal",
      "Analytics dashboard",
      "Payment ready",
      "Availability rules",
      "Buffer time settings",
    ],
    status: "active",
    rating: 4.9,
    reviewCount: 45,
    installCount: 567,
    createdAt: new Date("2026-01-24"),
    updatedAt: new Date("2026-01-24"),
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
