export const APP_NAME = "DRAMAC";
export const APP_DESCRIPTION = "Build beautiful websites for your clients";

export const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "Perfect for new agencies",
    basePrice: 0,
    seatPrice: 29,
    maxClients: 5,
    features: [
      "Up to 5 client seats",
      "Visual editor",
      "Basic templates",
      "Community support",
    ],
  },
  professional: {
    id: "professional",
    name: "Professional",
    description: "For growing agencies",
    basePrice: 49,
    seatPrice: 19,
    maxClients: null, // unlimited
    features: [
      "Unlimited client seats",
      "All features",
      "White-label options",
      "Priority support",
      "API access",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "For large agencies",
    basePrice: 199,
    seatPrice: 9,
    maxClients: null,
    features: [
      "Unlimited everything",
      "Full white-label",
      "Custom modules",
      "Dedicated support",
      "SLA guarantee",
    ],
  },
} as const;

export const NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: "layout-dashboard" },
  { title: "Clients", href: "/clients", icon: "users" },
  { title: "Sites", href: "/sites", icon: "globe" },
  { title: "Modules", href: "/modules", icon: "puzzle" },
  { title: "Billing", href: "/billing", icon: "credit-card" },
  { title: "Settings", href: "/settings", icon: "settings" },
] as const;

export const CLIENT_STATUS = {
  active: { label: "Active", color: "success" },
  inactive: { label: "Inactive", color: "warning" },
  archived: { label: "Archived", color: "muted" },
} as const;

export const SITE_STATUS = {
  draft: { label: "Draft", color: "muted" },
  published: { label: "Published", color: "success" },
  archived: { label: "Archived", color: "warning" },
} as const;
