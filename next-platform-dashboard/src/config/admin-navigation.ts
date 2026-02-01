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

export const adminNavigationItems: AdminNavItem[] = [
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
