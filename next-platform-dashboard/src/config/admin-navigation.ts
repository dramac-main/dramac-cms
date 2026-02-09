/**
 * Admin Navigation Configuration
 * 
 * Navigation items for the admin panel sidebar.
 * Used by the unified Sidebar component with variant="admin"
 * Grouped for clarity: Overview, Management, Revenue, System
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
  PieChart,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  group?: string;
}

export const adminNavigationItems: AdminNavItem[] = [
  // Overview
  { name: "Overview", href: "/admin", icon: LayoutDashboard, group: "Overview" },
  
  // Management
  { name: "Agencies", href: "/admin/agencies", icon: Building2, group: "Management" },
  { name: "Users", href: "/admin/users", icon: Users, group: "Management" },
  { name: "Modules", href: "/admin/modules", icon: Package, group: "Management" },
  
  // Revenue & Analytics
  { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard, group: "Revenue" },
  { name: "Billing & Revenue", href: "/admin/billing/revenue", icon: TrendingUp, group: "Revenue" },
  { name: "Agency Analytics", href: "/admin/agencies/analytics", icon: BarChart3, group: "Revenue" },
  { name: "Platform Analytics", href: "/admin/analytics", icon: PieChart, group: "Revenue" },
  
  // System
  { name: "Activity Log", href: "/admin/activity", icon: Activity, group: "System" },
  { name: "System Health", href: "/admin/health", icon: AlertTriangle, group: "System" },
  { name: "Settings", href: "/admin/settings", icon: Settings, group: "System" },
];
