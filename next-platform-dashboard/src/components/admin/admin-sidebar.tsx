"use client";

import { Sidebar } from "@/components/layout/sidebar-modern";
import { adminNavigationItems } from "@/config/admin-navigation";
import type { NavGroup } from "@/config/navigation";

/**
 * AdminSidebar - Uses the unified Sidebar component with admin variant
 * 
 * The admin sidebar displays platform-level admin navigation.
 * It uses the variant="admin" which provides:
 * - Admin header with shield icon
 * - "Back to Dashboard" footer link
 * - Proper admin styling using CSS variables
 */

// Pre-compute admin navigation groups outside component to avoid re-creation
const adminNavGroups: NavGroup[] = [
  {
    title: "Administration",
    items: adminNavigationItems.map((item) => ({
      title: item.name,
      href: item.href,
      icon: item.icon,
      badge: item.badge,
    })),
  },
];

export function AdminSidebar() {
  return (
    <Sidebar
      key="admin-sidebar"
      variant="admin"
      customNavigation={adminNavGroups}
      showLogo={true}
      collapsible={false}
    />
  );
}

export default AdminSidebar;
