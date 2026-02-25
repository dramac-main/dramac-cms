/**
 * Smart Navigation System
 *
 * Runtime assembly of navigation items from:
 * 1. Static links baked into page JSON by the AI/Studio editor (base nav)
 * 2. Module-contributed items stored in site.settings.navigation (dynamic)
 *
 * When a module is installed (e.g., Booking or E-commerce) it writes
 * navigation items to `site.settings.navigation`. At render time the
 * renderer reads that data and merges it into the Navbar/Footer props,
 * so enabling/disabling a module instantly updates navigation.
 *
 * @phase Smart Navigation — module-aware headers & footers
 */

// ============================================================================
// Types (aligned with ecommerce setup-types.NavigationItem)
// ============================================================================

/** A single navigation item contributed by a module */
export interface SmartNavItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  /** Where this item appears */
  position: "main" | "utility" | "footer";
  /** Sort order within its position group (lower = earlier) */
  sortOrder: number;
  /** Dynamic badge template, e.g. "{{cartCount}}" — resolved at render time */
  badge?: string;
  /** Which module contributed this item */
  moduleId?: string;
}

/** The full site.settings.navigation structure written by module install hooks */
export interface SiteNavigation {
  main: SmartNavItem[];
  utility: SmartNavItem[];
  footer: SmartNavItem[];
}

/** Utility item rendered in the Navbar's utility area (e.g. cart icon) */
export interface NavUtilityItem {
  id: string;
  label: string;
  href: string;
  /** Lucide icon name, e.g. "ShoppingCart" */
  icon: string;
  /** Optional badge count — numeric or template string */
  badge?: string;
  /** Aria label for screen readers */
  ariaLabel?: string;
}

// ============================================================================
// Constants — Booking module nav items
// ============================================================================

export const BOOKING_NAV_ITEMS: SmartNavItem[] = [
  {
    id: "booking-book",
    label: "Book Now",
    href: "/book",
    icon: "calendar",
    position: "main",
    sortOrder: 90, // After Services, before Contact
    moduleId: "booking",
  },
];

export const BOOKING_UTILITY_ITEMS: SmartNavItem[] = [
  {
    id: "booking-utility",
    label: "Book Now",
    href: "/book",
    icon: "calendar",
    position: "utility",
    sortOrder: 20,
    moduleId: "booking",
  },
];

export const BOOKING_FOOTER_ITEMS: SmartNavItem[] = [
  {
    id: "booking-footer-book",
    label: "Book Appointment",
    href: "/book",
    position: "footer",
    sortOrder: 1,
    moduleId: "booking",
  },
];

// ============================================================================
// Constants — E-commerce module nav items (mirrors auto-setup-actions.ts)
// These are used as runtime fallback for sites installed BEFORE PHASE-ECOM-50
// deployed the install hook that writes to site.settings.navigation.
// ============================================================================

export const ECOMMERCE_NAV_ITEMS: SmartNavItem[] = [
  {
    id: "ecom-shop",
    label: "Shop",
    href: "/shop",
    icon: "cart",
    position: "main",
    sortOrder: 100,
    moduleId: "ecommerce",
  },
];

export const ECOMMERCE_UTILITY_ITEMS: SmartNavItem[] = [
  {
    id: "ecom-cart",
    label: "Cart",
    href: "/cart",
    icon: "cart",
    position: "utility",
    sortOrder: 10,
    badge: "{{cartCount}}",
    moduleId: "ecommerce",
  },
];

export const ECOMMERCE_FOOTER_ITEMS: SmartNavItem[] = [
  {
    id: "ecom-footer-shop",
    label: "Shop All",
    href: "/shop",
    position: "footer",
    sortOrder: 1,
    moduleId: "ecommerce",
  },
  {
    id: "ecom-footer-cart",
    label: "My Cart",
    href: "/cart",
    position: "footer",
    sortOrder: 2,
    moduleId: "ecommerce",
  },
];

// ============================================================================
// Navigation Assembly — merge static links + module-contributed items
// ============================================================================

/**
 * Read module-contributed navigation from site.settings.navigation
 * AND detect installed modules that declare built-in nav items.
 *
 * Two-layer strategy ensures EVERY site gets module nav:
 *   Layer 1: Read settings.navigation (populated by install hooks for new installs)
 *   Layer 2: Runtime detection from modules array (catches existing sites that
 *            were installed before the hook system, or modules without hooks)
 *
 * The `modules` param is the installed modules array from page.tsx.
 */
export function getModuleNavigation(
  siteSettings: Record<string, unknown> | null | undefined,
  modules?: Array<{ slug: string; status: string }> | null
): SiteNavigation {
  const result: SiteNavigation = { main: [], utility: [], footer: [] };

  // 1. Read items already stored in site.settings.navigation (e.g. from ecommerce hook)
  if (siteSettings) {
    const nav = siteSettings.navigation as SiteNavigation | undefined;
    if (nav && typeof nav === "object") {
      if (Array.isArray(nav.main)) result.main.push(...nav.main);
      if (Array.isArray(nav.utility)) result.utility.push(...nav.utility);
      if (Array.isArray(nav.footer)) result.footer.push(...nav.footer);
    }
  }

  // 2. Runtime detection — inject built-in items for active modules that
  //    are missing from settings.navigation (covers pre-existing sites)
  if (modules) {
    const activeModules = new Set(
      modules.filter(m => m.status === "active").map(m => m.slug)
    );

    // Booking module: inject if not already present from settings
    if (activeModules.has("booking")) {
      const hasBookingMain = result.main.some(i => i.moduleId === "booking");
      if (!hasBookingMain) {
        result.main.push(...BOOKING_NAV_ITEMS);
        result.utility.push(...BOOKING_UTILITY_ITEMS);
        result.footer.push(...BOOKING_FOOTER_ITEMS);
      }
    }

    // E-commerce module: inject if not already present from settings
    // This is the safety net for sites installed before PHASE-ECOM-50
    // deployed the install hook that writes to site.settings.navigation.
    if (activeModules.has("ecommerce")) {
      const hasEcomMain = result.main.some(i => i.moduleId === "ecommerce");
      if (!hasEcomMain) {
        result.main.push(...ECOMMERCE_NAV_ITEMS);
        result.utility.push(...ECOMMERCE_UTILITY_ITEMS);
        result.footer.push(...ECOMMERCE_FOOTER_ITEMS);
      }
    }
  }

  // Sort each group by sortOrder
  result.main.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  result.utility.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  result.footer.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return result;
}

/**
 * Merge module main-nav items into an existing links array.
 *
 * Rules:
 * - Module items are inserted at the end by default, before "Contact" if present
 * - Deduplication by href — if a static link already points to the same URL, skip
 * - Sorted by sortOrder within the injected group
 */
export function mergeMainNavLinks(
  staticLinks: Array<{ label?: string; text?: string; href?: string; [k: string]: unknown }>,
  moduleItems: SmartNavItem[]
): Array<{ label?: string; text?: string; href?: string; [k: string]: unknown }> {
  if (!moduleItems.length) return staticLinks;

  // Build a set of existing hrefs for dedup
  const existingHrefs = new Set(
    staticLinks.map((l) => normalizeHref(l.href || ""))
  );

  // Filter out module items whose href already exists in static links
  const newItems = moduleItems
    .filter((item) => !existingHrefs.has(normalizeHref(item.href)))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      label: item.label,
      href: item.href,
    }));

  if (!newItems.length) return staticLinks;

  // Insert before "Contact" link if it exists, otherwise append
  const contactIdx = staticLinks.findIndex(
    (l) => (l.label || l.text || "").toLowerCase() === "contact"
  );

  const result = [...staticLinks];
  if (contactIdx >= 0) {
    result.splice(contactIdx, 0, ...newItems);
  } else {
    result.push(...newItems);
  }

  return result;
}

/**
 * Build utility items array from module-contributed utility nav items.
 * These render as icon buttons (e.g. cart icon with badge) in the navbar.
 *
 * Icon names are normalized to lowercase keys that match the UtilityIcon
 * component in premium-components.tsx (e.g. "ShoppingCart" → "cart").
 */
export function buildUtilityItems(
  moduleUtilityItems: SmartNavItem[]
): NavUtilityItem[] {
  return moduleUtilityItems
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      id: item.id,
      label: item.label,
      href: item.href,
      icon: normalizeIconName(item.icon || "cart"),
      badge: item.badge,
      ariaLabel: item.label,
    }));
}

/**
 * Merge module footer items into existing footer link columns.
 *
 * Strategy: If a column title matches a module keyword (e.g. "Shop", "Booking"),
 * add links there. Otherwise create or append to a "Quick Links" column.
 */
export function mergeFooterLinks(
  existingColumns: Array<{
    title?: string;
    links?: Array<{ label?: string; href?: string; [k: string]: unknown }>;
  }>,
  moduleFooterItems: SmartNavItem[]
): Array<{
  title?: string;
  links?: Array<{ label?: string; href?: string; [k: string]: unknown }>;
}> {
  if (!moduleFooterItems.length) return existingColumns;

  const result = existingColumns.map((col) => ({ ...col, links: [...(col.links || [])] }));

  // Collect all existing footer hrefs for dedup
  const existingFooterHrefs = new Set<string>();
  for (const col of result) {
    for (const link of col.links || []) {
      existingFooterHrefs.add(normalizeHref(link.href || ""));
    }
  }

  // Filter new items
  const newItems = moduleFooterItems
    .filter((item) => !existingFooterHrefs.has(normalizeHref(item.href)))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (!newItems.length) return result;

  // Try to find a "Quick Links" or "Navigation" column to inject into
  let targetCol = result.find((col) => {
    const title = (col.title || "").toLowerCase();
    return title.includes("quick") || title.includes("links") || title.includes("navigation") || title.includes("pages");
  });

  if (!targetCol) {
    // Use the first column as fallback
    targetCol = result[0];
  }

  if (targetCol) {
    for (const item of newItems) {
      targetCol.links!.push({ label: item.label, href: item.href });
    }
  }

  return result;
}

// ============================================================================
// Helpers
// ============================================================================

/** Map PascalCase icon names from ecommerce/other modules to our lowercase keys */
const ICON_MAP: Record<string, string> = {
  shoppingcart: "cart",
  shoppingbag: "cart",
  cart: "cart",
  calendar: "calendar",
  calendardays: "calendar",
  user: "user",
  usercircle: "user",
  search: "search",
  magnifyingglass: "search",
  heart: "heart",
};

function normalizeIconName(icon: string): string {
  const lower = icon.toLowerCase().replace(/[-_\s]/g, "");
  return ICON_MAP[lower] || lower;
}

function normalizeHref(href: string): string {
  return href.replace(/\/+$/, "").toLowerCase() || "/";
}
