# PHASE-UI-01A: Create Global Layout Configuration Files

**Phase ID**: PHASE-UI-01A  
**Priority**: CRITICAL - Must run first  
**Estimated Time**: 30 minutes  
**Dependencies**: None  
**Commit After**: Yes (if zero TypeScript errors)

---

## 🎯 OBJECTIVE

Create the foundational configuration files that will be used by all subsequent phases. These files establish the single source of truth for layout constants and sidebar variant configurations.

---

## 📋 TASKS

### Task 1: Create Layout Constants File

**File**: `src/config/layout.ts`

**Action**: Create this new file with ALL layout constants.

```typescript
/**
 * Global Layout Constants
 * 
 * SINGLE SOURCE OF TRUTH for all spacing, dimensions, and layout values.
 * Change these values to update the entire platform globally.
 * 
 * @module config/layout
 * @example
 * import { LAYOUT } from '@/config/layout';
 * <div className={LAYOUT.PAGE_PADDING}>...</div>
 */

export const LAYOUT = {
  // ============================================
  // PAGE PADDING (Main Content Area)
  // ============================================
  
  /** Standard page padding: 16px mobile, 24px desktop */
  PAGE_PADDING: 'p-4 lg:p-6',
  
  /** Horizontal page padding only */
  PAGE_PADDING_X: 'px-4 lg:px-6',
  
  /** Vertical page padding only */
  PAGE_PADDING_Y: 'py-4 lg:py-6',
  
  /** No padding (for full-width layouts like editors) */
  PAGE_PADDING_NONE: 'p-0',
  
  /** Dense padding (for compact layouts) */
  PAGE_PADDING_DENSE: 'p-2 lg:p-4',
  
  // ============================================
  // CONTENT MAX WIDTH
  // ============================================
  
  /** Standard content width: 1536px */
  CONTENT_MAX_WIDTH: 'max-w-screen-2xl',
  
  /** Large content width: 1280px */
  CONTENT_MAX_WIDTH_LG: 'max-w-screen-xl',
  
  /** Medium content width: 1024px */
  CONTENT_MAX_WIDTH_MD: 'max-w-screen-lg',
  
  /** Small content width: 768px */
  CONTENT_MAX_WIDTH_SM: 'max-w-screen-md',
  
  /** Full width (no constraint) */
  CONTENT_MAX_WIDTH_FULL: 'max-w-full',
  
  // ============================================
  // SECTION SPACING (Vertical gaps between sections)
  // ============================================
  
  /** Standard section gap: 24px */
  SECTION_GAP: 'space-y-6',
  
  /** Large section gap: 32px */
  SECTION_GAP_LG: 'space-y-8',
  
  /** Small section gap: 16px */
  SECTION_GAP_SM: 'space-y-4',
  
  /** Extra small section gap: 8px */
  SECTION_GAP_XS: 'space-y-2',
  
  // ============================================
  // GRID GAPS (For card grids, form layouts)
  // ============================================
  
  /** Standard grid gap: 16px mobile, 24px desktop */
  GRID_GAP: 'gap-4 lg:gap-6',
  
  /** Small grid gap: 8px mobile, 16px desktop */
  GRID_GAP_SM: 'gap-2 lg:gap-4',
  
  /** Large grid gap: 24px mobile, 32px desktop */
  GRID_GAP_LG: 'gap-6 lg:gap-8',
  
  // ============================================
  // SIDEBAR DIMENSIONS
  // ============================================
  
  /** Expanded sidebar width: 256px (16rem) */
  SIDEBAR_WIDTH: 'w-64',
  
  /** Collapsed sidebar width: 64px (4rem) */
  SIDEBAR_COLLAPSED_WIDTH: 'w-16',
  
  /** Sidebar sticky positioning classes */
  SIDEBAR_POSITION: 'sticky top-0 h-screen',
  
  // ============================================
  // HEADER DIMENSIONS
  // ============================================
  
  /** Header height: 56px mobile, 64px desktop */
  HEADER_HEIGHT: 'h-14 md:h-16',
  
  /** Header sticky positioning */
  HEADER_POSITION: 'sticky top-0',
  
  // ============================================
  // CONTAINER WIDTHS
  // ============================================
  
  /** Full width container with auto margins */
  CONTAINER: 'container mx-auto',
  
  /** Container with standard padding */
  CONTAINER_PADDED: 'container mx-auto px-4 lg:px-6',
  
  // ============================================
  // CARD PADDING
  // ============================================
  
  /** Standard card padding: 24px */
  CARD_PADDING: 'p-6',
  
  /** Small card padding: 16px */
  CARD_PADDING_SM: 'p-4',
  
  /** Large card padding: 32px */
  CARD_PADDING_LG: 'p-8',
  
  // ============================================
  // FORM SPACING
  // ============================================
  
  /** Form field vertical gap: 16px */
  FORM_GAP: 'space-y-4',
  
  /** Form field vertical gap (large): 24px */
  FORM_GAP_LG: 'space-y-6',
  
  /** Form field vertical gap (small): 8px */
  FORM_GAP_SM: 'space-y-2',
  
  // ============================================
  // PAGE HEADER SPACING
  // ============================================
  
  /** Space below page header: 24px */
  PAGE_HEADER_MARGIN: 'pb-6',
  
  /** Space below page header (large): 32px */
  PAGE_HEADER_MARGIN_LG: 'pb-8',
  
} as const;

/**
 * Helper function to combine layout classes safely
 * @param classes - Layout class strings to combine
 * @returns Combined class string
 * @example
 * combineLayout(LAYOUT.PAGE_PADDING, LAYOUT.SECTION_GAP)
 * // Returns: "p-4 lg:p-6 space-y-6"
 */
export function combineLayout(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Type for layout constant keys (for type-safe usage)
 */
export type LayoutKey = keyof typeof LAYOUT;

/**
 * Type for the LAYOUT constant values
 */
export type LayoutValue = typeof LAYOUT[LayoutKey];
```

---

### Task 2: Create Admin Navigation Config

**File**: `src/config/admin-navigation.ts`

**Action**: Create navigation config for admin sidebar (extracted from admin-sidebar.tsx).

```typescript
/**
 * Admin Navigation Configuration
 * 
 * Navigation items for the admin panel sidebar.
 * Used by the unified Sidebar component with variant="admin"
 */

import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Activity,
  AlertTriangle,
  Package,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

export const adminNavigation: AdminNavItem[] = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Agencies", href: "/admin/agencies", icon: Building2 },
  { name: "Agency Analytics", href: "/admin/agencies/analytics", icon: BarChart3 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Modules", href: "/admin/modules", icon: Package },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { name: "Billing & Revenue", href: "/admin/billing/revenue", icon: CreditCard },
  { name: "Platform Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Activity Log", href: "/admin/activity", icon: Activity },
  { name: "System Health", href: "/admin/health", icon: AlertTriangle },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];
```

---

### Task 3: Create Settings Navigation Config

**File**: `src/config/settings-navigation.ts`

**Action**: Create navigation config for settings sidebar (extracted from settings-sidebar.tsx).

```typescript
/**
 * Settings Navigation Configuration
 * 
 * Navigation items for the settings sidebar.
 * Used by the unified Sidebar component with variant="settings"
 */

import {
  Building2,
  User,
  Users,
  Bell,
  CreditCard,
  Shield,
  Palette,
  Globe,
  type LucideIcon,
} from "lucide-react";

export interface SettingsNavSection {
  title: string;
  items: SettingsNavItem[];
}

export interface SettingsNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const settingsNavigation: SettingsNavSection[] = [
  {
    title: "Account",
    items: [
      { name: "Profile", href: "/settings/profile", icon: User },
      { name: "Security", href: "/settings/security", icon: Shield },
      { name: "Notifications", href: "/settings/notifications", icon: Bell },
    ],
  },
  {
    title: "Agency",
    items: [
      { name: "General", href: "/settings/agency", icon: Building2 },
      { name: "Team", href: "/settings/team", icon: Users },
      { name: "Branding", href: "/settings/branding", icon: Palette },
      { name: "Domains", href: "/settings/domains", icon: Globe },
    ],
  },
  {
    title: "Billing",
    items: [
      { name: "Subscription", href: "/settings/subscription", icon: CreditCard },
    ],
  },
];

/**
 * Flatten settings navigation for simple iteration
 */
export function getFlatSettingsNav(): SettingsNavItem[] {
  return settingsNavigation.flatMap(section => section.items);
}
```

---

### Task 4: Create Portal Navigation Helper

**File**: `src/config/portal-navigation.ts`

**Action**: Create navigation config generator for portal sidebar.

```typescript
/**
 * Portal Navigation Configuration
 * 
 * Dynamic navigation items for the client portal sidebar.
 * Navigation varies based on user permissions.
 */

import {
  LayoutDashboard,
  Globe,
  BarChart3,
  MessageCircle,
  FileText,
  Settings,
  Image,
  Inbox,
  BookOpen,
  Search,
  type LucideIcon,
} from "lucide-react";

export interface PortalNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export interface PortalUserPermissions {
  canViewAnalytics: boolean;
  canViewInvoices: boolean;
}

/**
 * Get portal navigation based on user permissions
 * @param permissions - User's portal permissions
 * @param openTicketCount - Number of open support tickets (for badge)
 * @returns Array of navigation items
 */
export function getPortalNavigation(
  permissions: PortalUserPermissions,
  openTicketCount: number = 0
): { main: PortalNavItem[]; features: PortalNavItem[]; support: PortalNavItem[] } {
  const mainLinks: PortalNavItem[] = [
    { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
    { href: "/portal/sites", label: "My Sites", icon: Globe },
  ];

  const featureLinks: PortalNavItem[] = [];

  // Analytics (conditional)
  if (permissions.canViewAnalytics) {
    featureLinks.push({
      href: "/portal/analytics",
      label: "Analytics",
      icon: BarChart3,
    });
  }

  // Always available features
  featureLinks.push(
    { href: "/portal/media", label: "Media", icon: Image },
    { href: "/portal/submissions", label: "Form Submissions", icon: Inbox },
    { href: "/portal/blog", label: "Blog Posts", icon: BookOpen },
    { href: "/portal/seo", label: "SEO", icon: Search }
  );

  const supportLinks: PortalNavItem[] = [
    {
      href: "/portal/support",
      label: "Support",
      icon: MessageCircle,
      badge: openTicketCount > 0 ? openTicketCount : undefined,
    },
  ];

  // Invoices (conditional)
  if (permissions.canViewInvoices) {
    supportLinks.push({
      href: "/portal/invoices",
      label: "Invoices",
      icon: FileText,
    });
  }

  supportLinks.push({
    href: "/portal/settings",
    label: "Settings",
    icon: Settings,
  });

  return { main: mainLinks, features: featureLinks, support: supportLinks };
}
```

---

### Task 5: Update Config Index (if exists, or create)

**File**: `src/config/index.ts`

**Action**: Create or update the config barrel export file.

```typescript
/**
 * Configuration Barrel Export
 * 
 * Central export point for all configuration files.
 * Import from '@/config' for cleaner imports.
 */

// Layout constants
export { LAYOUT, combineLayout, type LayoutKey, type LayoutValue } from './layout';

// Navigation configs
export { adminNavigation, type AdminNavItem } from './admin-navigation';
export { 
  settingsNavigation, 
  getFlatSettingsNav,
  type SettingsNavSection, 
  type SettingsNavItem 
} from './settings-navigation';
export { 
  getPortalNavigation,
  type PortalNavItem,
  type PortalUserPermissions 
} from './portal-navigation';

// Re-export existing navigation config
export * from './navigation';
```

---

## ✅ VERIFICATION STEPS

After creating all files, run these commands:

```bash
cd next-platform-dashboard

# 1. Check TypeScript compilation
npx tsc --noEmit --skipLibCheck

# 2. If zero errors, commit and push
cd ..
git add .
git commit -m "feat(ui): add global layout constants and navigation configs (PHASE-UI-01A)"
git push
```

---

## 📁 FILES CREATED

| File | Purpose | Lines |
|------|---------|-------|
| `src/config/layout.ts` | Global layout constants | ~150 |
| `src/config/admin-navigation.ts` | Admin nav config | ~50 |
| `src/config/settings-navigation.ts` | Settings nav config | ~70 |
| `src/config/portal-navigation.ts` | Portal nav helper | ~90 |
| `src/config/index.ts` | Barrel export | ~25 |

**Total**: ~385 lines

---

## 🎯 SUCCESS CRITERIA

- [ ] All 5 config files created
- [ ] TypeScript compiles with zero errors
- [ ] Files are properly typed
- [ ] Exports work correctly
- [ ] Git commit and push successful

---

## 🔗 NEXT PHASE

After this phase completes successfully, proceed to:
**PHASE-UI-01B: Unify Sidebar Component**

---

**End of Phase UI-01A**
