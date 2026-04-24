/**
 * Portal Module Registry
 *
 * Future-proof registration pattern: each module declares its portal capabilities
 * (nav items, permissions, icons) so the portal framework discovers and renders
 * them dynamically. New modules register here — portal core code never changes.
 */

import {
  MessageCircle,
  ShoppingCart,
  Package,
  CalendarDays,
  Users,
  Zap,
  Receipt,
  UserCog,
  Bot,
  Mail,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import type { EffectivePortalPermissions } from "./portal-permissions";

// =============================================================================
// TYPES
// =============================================================================

export interface PortalModuleNavItem {
  label: string;
  /** Generates the URL given a siteId */
  href: (siteId: string) => string;
  icon: LucideIcon;
  /** Additional permission key required for this specific nav item (optional — defaults to module-level permission) */
  permissionKey?: keyof EffectivePortalPermissions;
}

export interface PortalModuleRegistration {
  /** Must match modules_v2.slug */
  moduleSlug: string;
  displayName: string;
  icon: LucideIcon;
  /** Which permission gates overall module access */
  permissionKey: keyof EffectivePortalPermissions;
  /** Nav items to add to the sidebar when this module is installed + permitted */
  navItems: PortalModuleNavItem[];
}

// =============================================================================
// REGISTRY
// =============================================================================

const registry: PortalModuleRegistration[] = [];

/**
 * Register a module for portal integration.
 * Call this at module init time (top-level side effect).
 */
export function registerPortalModule(
  registration: PortalModuleRegistration,
): void {
  // Prevent duplicate registrations
  if (registry.some((r) => r.moduleSlug === registration.moduleSlug)) return;
  registry.push(registration);
}

/**
 * Get all registered portal modules.
 */
export function getRegisteredPortalModules(): readonly PortalModuleRegistration[] {
  return registry;
}

/**
 * Get registered modules filtered by what is installed and permitted.
 */
export function getActivePortalModules(
  installedModuleSlugs: string[],
  permissions: EffectivePortalPermissions,
): PortalModuleRegistration[] {
  return registry.filter(
    (reg) =>
      installedModuleSlugs.includes(reg.moduleSlug) &&
      permissions[reg.permissionKey],
  );
}

// =============================================================================
// CORE MODULE REGISTRATIONS
// =============================================================================

// Live Chat
registerPortalModule({
  moduleSlug: "live-chat",
  displayName: "Live Chat",
  icon: MessageCircle,
  permissionKey: "canManageLiveChat",
  navItems: [
    {
      label: "Live Chat",
      href: (siteId) => `/portal/sites/${siteId}/live-chat`,
      icon: MessageCircle,
    },
    {
      label: "Chat Agents",
      href: (siteId) => `/portal/sites/${siteId}/chat-agents`,
      icon: Bot,
      permissionKey: "canManageAgents",
    },
  ],
});

// E-Commerce
registerPortalModule({
  moduleSlug: "ecommerce",
  displayName: "Store",
  icon: ShoppingCart,
  permissionKey: "canManageOrders",
  navItems: [
    {
      label: "Orders",
      href: (siteId) => `/portal/sites/${siteId}/orders`,
      icon: ShoppingCart,
      permissionKey: "canManageOrders",
    },
    {
      label: "Products",
      href: (siteId) => `/portal/sites/${siteId}/products`,
      icon: Package,
      permissionKey: "canManageProducts",
    },
    {
      label: "Quotes",
      href: (siteId) => `/portal/sites/${siteId}/quotes`,
      icon: Receipt,
      permissionKey: "canManageQuotes",
    },
    {
      label: "Customers",
      href: (siteId) => `/portal/sites/${siteId}/customers`,
      icon: UserCog,
      permissionKey: "canManageCustomers",
    },
    {
      label: "Payment Proofs",
      href: (siteId) => `/portal/sites/${siteId}/payment-proofs`,
      icon: CreditCard,
      permissionKey: "canManageOrders",
    },
  ],
});

// Booking
registerPortalModule({
  moduleSlug: "booking",
  displayName: "Bookings",
  icon: CalendarDays,
  permissionKey: "canManageBookings",
  navItems: [
    {
      label: "Bookings",
      href: (siteId) => `/portal/sites/${siteId}/bookings`,
      icon: CalendarDays,
    },
  ],
});

// CRM
registerPortalModule({
  moduleSlug: "crm",
  displayName: "CRM",
  icon: Users,
  permissionKey: "canManageCrm",
  navItems: [
    {
      label: "CRM",
      href: (siteId) => `/portal/sites/${siteId}/crm`,
      icon: Users,
    },
  ],
});

// Automation
registerPortalModule({
  moduleSlug: "automation",
  displayName: "Automation",
  icon: Zap,
  permissionKey: "canManageAutomation",
  navItems: [
    {
      label: "Automation",
      href: (siteId) => `/portal/sites/${siteId}/automation`,
      icon: Zap,
    },
  ],
});

// Marketing
registerPortalModule({
  moduleSlug: "marketing",
  displayName: "Marketing",
  icon: Mail,
  permissionKey: "canManageMarketing",
  navItems: [
    {
      label: "Marketing",
      href: (siteId) => `/portal/sites/${siteId}/marketing`,
      icon: Mail,
    },
  ],
});
