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
  Server,
  Mail,
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
}

/**
 * Get portal navigation based on user permissions
 * @param permissions - User's portal permissions
 * @param openTicketCount - Number of open support tickets (for badge)
 * @returns Array of navigation items grouped by category
 */
export function getPortalNavigation(
  permissions: PortalUserPermissions,
  openTicketCount: number = 0
): { main: PortalNavItem[]; features: PortalNavItem[]; support: PortalNavItem[] } {
  const mainLinks: PortalNavItem[] = [
    { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
    { href: "/portal/sites", label: "My Sites", icon: Globe },
    { href: "/portal/domains", label: "Domains", icon: Server },
    { href: "/portal/email", label: "Email", icon: Mail },
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

/**
 * Convert portal navigation to NavGroup format for unified sidebar
 * @param permissions - User's portal permissions
 * @param openTicketCount - Number of open support tickets (for badge)
 * @returns Navigation groups compatible with the unified Sidebar component
 */
export function getPortalNavigationGroups(
  permissions: PortalUserPermissions,
  openTicketCount: number = 0
): NavGroup[] {
  const nav = getPortalNavigation(permissions, openTicketCount);
  
  const toNavItems = (items: PortalNavItem[]): NavItem[] =>
    items.map((item) => ({
      title: item.label,
      href: item.href,
      icon: item.icon,
      badge: item.badge,
    }));

  const groups: NavGroup[] = [
    {
      items: toNavItems(nav.main),
    },
  ];

  if (nav.features.length > 0) {
    groups.push({
      title: "Features",
      items: toNavItems(nav.features),
    });
  }

  groups.push({
    title: "Support",
    items: toNavItems(nav.support),
  });

  return groups;
}
