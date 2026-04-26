/**
 * Portal Navigation Configuration
 *
 * Dynamic navigation items for the client portal sidebar.
 * Navigation varies based on user permissions and installed modules.
 *
 * Architecture: one top-level entry per module — no duplication.
 * Each module entry links to the full module dashboard (same as agency).
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
  CalendarDays,
  Users,
  Zap,
  Receipt,
  Bot,
  Send,
  Blocks,
  Sparkles,
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
  canEditContent: boolean;
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
  canManageMarketing: boolean;
  canManageInvoices: boolean;
  canManageSupport: boolean;
}

/**
 * Get portal navigation based on user permissions and installed modules.
 *
 * Design principles:
 * - ONE entry per module — no duplicate links across groups.
 * - Each module entry links to the full module dashboard (mirrors agency dashboard).
 * - Operations group is removed; CRM/Automation/Invoicing each get their own group.
 *
 * @param permissions - User's portal permissions
 * @param installedModules - Array of module slugs installed on the site
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

  // Helper to build site-scoped URLs (returns null when no site context)
  const siteUrl = (path: string): string | null =>
    siteId ? `/portal/sites/${siteId}/${path}` : null;

  // === Main Group ===
  const mainItems: NavItem[] = [
    { title: "Dashboard", href: "/portal", icon: LayoutDashboard },
    { title: "Ask Chiko", href: "/portal/ask-chiko", icon: Sparkles },
    { title: "My Sites", href: "/portal/sites", icon: Globe },
    { title: "Team", href: "/portal/team", icon: Users },
    { title: "Domains", href: "/portal/domains", icon: Server },
    { title: "Email", href: "/portal/email", icon: Mail },
  ];

  // === Content Group (site-scoped) ===
  const contentItems: NavItem[] = [];

  if (siteId) {
    if (permissions.canViewAnalytics) {
      contentItems.push({
        title: "Analytics",
        href: siteUrl("analytics")!,
        icon: BarChart3,
      });
    }

    if (permissions.canEditContent) {
      contentItems.push(
        { title: "Pages", href: siteUrl("pages")!, icon: FileText },
        { title: "Blog Posts", href: siteUrl("blog")!, icon: BookOpen },
        { title: "Media", href: siteUrl("media")!, icon: Image },
      );
    }

    contentItems.push(
      { title: "Form Submissions", href: siteUrl("submissions")!, icon: Inbox },
      { title: "SEO", href: siteUrl("seo")!, icon: Search },
    );

    if (permissions.canEditContent) {
      contentItems.push({ title: "Apps", href: siteUrl("apps")!, icon: Blocks });
    }

    if (permissions.canViewAnalytics) {
      contentItems.push({
        title: "Communications",
        href: siteUrl("communications")!,
        icon: Send,
      });
    }
  }

  // === Module Groups — one entry each (site-scoped) ===

  // ── Store (Ecommerce) ────────────────────────────────────────────────────
  // Single entry → full EcommerceDashboard (tabs: Products, Orders, Customers,
  // Quotes, Discounts, Inventory, Analytics, Settings…)
  const storeItems: NavItem[] = [];
  if (siteId && hasModule("ecommerce") && (
    permissions.canManageProducts ||
    permissions.canManageOrders ||
    permissions.canManageQuotes ||
    permissions.canManageCustomers
  )) {
    storeItems.push({
      title: "Store",
      href: siteUrl("ecommerce")!,
      icon: ShoppingCart,
    });
  }

  // ── Bookings ─────────────────────────────────────────────────────────────
  // Single entry → full BookingDashboard (tabs: Calendar, Appointments,
  // Services, Staff, Analytics, Settings…)
  const bookingItems: NavItem[] = [];
  if (siteId && hasModule("booking") && permissions.canManageBookings) {
    bookingItems.push({
      title: "Bookings",
      href: siteUrl("bookings")!,
      icon: CalendarDays,
    });
  }

  // ── Live Chat ─────────────────────────────────────────────────────────────
  // Sub-items are separate pages within the live-chat module.
  const liveChatItems: NavItem[] = [];
  if (siteId && hasModule("live-chat") && permissions.canManageLiveChat) {
    liveChatItems.push(
      {
        title: "Live Chat",
        href: siteUrl("live-chat")!,
        icon: MessageCircle,
      },
      {
        title: "Conversations",
        href: siteUrl("live-chat/conversations")!,
        icon: MessageCircle,
      },
      {
        title: "Scripted Flows",
        href: siteUrl("live-chat/scripted-flows")!,
        icon: Zap,
      },
      {
        title: "Chiko AI",
        href: siteUrl("live-chat/ai-settings")!,
        icon: Sparkles,
      },
    );
    if (permissions.canManageAgents) {
      liveChatItems.push({
        title: "Chat Agents",
        href: siteUrl("chat-agents")!,
        icon: Bot,
      });
    }
  }

  // ── Marketing ─────────────────────────────────────────────────────────────
  // Single entry → full MarketingHubDashboard
  const marketingItems: NavItem[] = [];
  if (siteId && hasModule("marketing") && permissions.canManageMarketing) {
    marketingItems.push({
      title: "Marketing",
      href: siteUrl("marketing")!,
      icon: Send,
    });
  }

  // ── CRM ───────────────────────────────────────────────────────────────────
  const crmItems: NavItem[] = [];
  if (siteId && hasModule("crm") && permissions.canManageCrm) {
    crmItems.push({ title: "CRM", href: siteUrl("crm")!, icon: Users });
  }

  // ── Automation ───────────────────────────────────────────────────────────
  const automationItems: NavItem[] = [];
  if (siteId && hasModule("automation") && permissions.canManageAutomation) {
    automationItems.push({
      title: "Automation",
      href: siteUrl("automation")!,
      icon: Zap,
    });
  }

  // ── Invoicing ─────────────────────────────────────────────────────────────
  const invoicingItems: NavItem[] = [];
  if (siteId && hasModule("invoicing") && permissions.canManageInvoices) {
    invoicingItems.push({
      title: "Invoicing",
      href: siteUrl("invoicing")!,
      icon: Receipt,
    });
  }

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

  // === Build Groups — module groups only appear when non-empty ===
  const groups: NavGroup[] = [{ items: mainItems }];

  if (contentItems.length > 0) {
    groups.push({ title: "Content", items: contentItems });
  }
  if (storeItems.length > 0) {
    groups.push({ title: "Store", items: storeItems });
  }
  if (bookingItems.length > 0) {
    groups.push({ title: "Bookings", items: bookingItems });
  }
  if (liveChatItems.length > 0) {
    groups.push({ title: "Live Chat", items: liveChatItems });
  }
  if (marketingItems.length > 0) {
    groups.push({ title: "Marketing", items: marketingItems });
  }
  if (crmItems.length > 0) {
    groups.push({ title: "CRM", items: crmItems });
  }
  if (automationItems.length > 0) {
    groups.push({ title: "Automation", items: automationItems });
  }
  if (invoicingItems.length > 0) {
    groups.push({ title: "Invoicing", items: invoicingItems });
  }
  groups.push({ title: "Support", items: supportItems });

  return groups;
}
