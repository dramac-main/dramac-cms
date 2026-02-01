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
