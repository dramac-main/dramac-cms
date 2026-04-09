/**
 * Portal Navigation Configuration
 *
 * Dynamic navigation items for the client portal sidebar.
 * Navigation varies based on user permissions and installed modules.
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
  Server,
  Mail,
  Bell,
  ShoppingCart,
  Package,
  CalendarDays,
  Users,
  Zap,
  UserCog,
  Receipt,
  Bot,
  type LucideIcon,
} from "lucide-react";
import type { NavGroup, NavItem } from "./navigation";

export interface PortalNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export interface PortalUserPermissions {
  canViewAnalytics: boolean;
  canViewInvoices: boolean;
  canManageLiveChat: boolean;
  canManageOrders: boolean;
  canManageProducts: boolean;
  canManageBookings: boolean;
  canManageCrm: boolean;
  canManageAutomation: boolean;
  canManageQuotes: boolean;
  canManageAgents: boolean;
  canManageCustomers: boolean;
}

/**
 * Get portal navigation based on user permissions and installed modules
 * @param permissions - User's portal permissions
 * @param installedModules - Array of module slugs installed on the client's site(s)
 * @param openTicketCount - Number of open support tickets (for badge)
 * @param siteId - If client has exactly one site, nav links go directly to that site
 * @returns Navigation groups compatible with the unified Sidebar component
 */
export function getPortalNavigationGroups(
  permissions: PortalUserPermissions,
  installedModules: string[],
  openTicketCount: number = 0,
  siteId?: string,
): NavGroup[] {
  const hasModule = (slug: string) => installedModules.includes(slug);

  // Helper to build site-scoped URLs
  const siteUrl = (path: string) =>
    siteId ? `/portal/sites/${siteId}/${path}` : `/portal/${path}`;

  // === Main Group ===
  const mainItems: NavItem[] = [
    { title: "Dashboard", href: "/portal", icon: LayoutDashboard },
    { title: "My Sites", href: "/portal/sites", icon: Globe },
    { title: "Domains", href: "/portal/domains", icon: Server },
    { title: "Email", href: "/portal/email", icon: Mail },
  ];

  // === Operations Group (only if any operational module is installed + permitted) ===
  const operationsItems: NavItem[] = [];

  if (hasModule("live-chat") && permissions.canManageLiveChat) {
    operationsItems.push({
      title: "Live Chat",
      href: siteUrl("live-chat"),
      icon: MessageCircle,
    });
  }

  if (hasModule("ecommerce") && permissions.canManageOrders) {
    operationsItems.push({
      title: "Orders",
      href: siteUrl("orders"),
      icon: ShoppingCart,
    });
  }

  if (hasModule("booking") && permissions.canManageBookings) {
    operationsItems.push({
      title: "Bookings",
      href: siteUrl("bookings"),
      icon: CalendarDays,
    });
  }

  if (hasModule("ecommerce") && permissions.canManageProducts) {
    operationsItems.push({
      title: "Products",
      href: siteUrl("products"),
      icon: Package,
    });
  }

  if (hasModule("ecommerce") && permissions.canManageQuotes) {
    operationsItems.push({
      title: "Quotes",
      href: siteUrl("quotes"),
      icon: Receipt,
    });
  }

  if (hasModule("crm") && permissions.canManageCrm) {
    operationsItems.push({
      title: "CRM",
      href: siteUrl("crm"),
      icon: Users,
    });
  }

  if (hasModule("ecommerce") && permissions.canManageCustomers) {
    operationsItems.push({
      title: "Customers",
      href: siteUrl("customers"),
      icon: UserCog,
    });
  }

  if (hasModule("automation") && permissions.canManageAutomation) {
    operationsItems.push({
      title: "Automation",
      href: siteUrl("automation"),
      icon: Zap,
    });
  }

  if (hasModule("live-chat") && permissions.canManageAgents) {
    operationsItems.push({
      title: "Chat Agents",
      href: siteUrl("chat-agents"),
      icon: Bot,
    });
  }

  // === Content Group ===
  const contentItems: NavItem[] = [];

  if (permissions.canViewAnalytics) {
    contentItems.push({
      title: "Analytics",
      href: "/portal/analytics",
      icon: BarChart3,
    });
  }

  contentItems.push(
    { title: "Media", href: "/portal/media", icon: Image },
    { title: "Form Submissions", href: "/portal/submissions", icon: Inbox },
    { title: "Blog Posts", href: "/portal/blog", icon: BookOpen },
    { title: "SEO", href: "/portal/seo", icon: Search },
  );

  // === Support Group ===
  const supportItems: NavItem[] = [
    {
      title: "Support",
      href: "/portal/support",
      icon: MessageCircle,
      badge: openTicketCount > 0 ? openTicketCount : undefined,
    },
    { title: "Notifications", href: "/portal/notifications", icon: Bell },
  ];

  if (permissions.canViewInvoices) {
    supportItems.push({
      title: "Invoices",
      href: "/portal/invoices",
      icon: FileText,
    });
  }

  supportItems.push({
    title: "Settings",
    href: "/portal/settings",
    icon: Settings,
  });

  // === Build Groups ===
  const groups: NavGroup[] = [{ items: mainItems }];

  if (operationsItems.length > 0) {
    groups.push({ title: "Operations", items: operationsItems });
  }

  groups.push({ title: "Content", items: contentItems });
  groups.push({ title: "Support", items: supportItems });

  return groups;
}
