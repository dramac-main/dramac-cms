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
export function AdminSidebar() {
  // Transform admin navigation to NavGroup format for the unified sidebar
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

  return (
    <Sidebar
      variant="admin"
      customNavigation={adminNavGroups}
      showLogo={true}
      collapsible={false}
    />
  );
}

export default AdminSidebar;
