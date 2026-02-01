"use client";

import { Sidebar } from "@/components/layout/sidebar-modern";
import { getPortalNavigationGroups, type PortalUserPermissions } from "@/config/portal-navigation";
import type { PortalUser } from "@/lib/portal/portal-auth";
import { Globe } from "lucide-react";

interface PortalSidebarProps {
  user: PortalUser;
  openTicketCount?: number;
}

/**
 * PortalSidebar - Uses the unified Sidebar component with portal variant
 * 
 * The portal sidebar displays client portal navigation.
 * Navigation is dynamically generated based on user permissions.
 * It uses the variant="portal" which provides:
 * - Proper portal styling using CSS variables
 * - Sticky positioning
 * - Non-collapsible design
 */

function PortalHeader({ user }: { user: PortalUser }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Globe className="w-4 h-4 text-primary" />
      </div>
      <div className="overflow-hidden">
        <h2 className="font-semibold text-sm text-sidebar-foreground truncate">
          {user.companyName || "Client Portal"}
        </h2>
        <p className="text-xs text-sidebar-foreground/60 truncate">{user.fullName}</p>
      </div>
    </div>
  );
}

export function PortalSidebar({ user, openTicketCount = 0 }: PortalSidebarProps) {
  // Get permissions from user
  const permissions: PortalUserPermissions = {
    canViewAnalytics: user.canViewAnalytics,
    canViewInvoices: user.canViewInvoices,
  };

  // Get navigation groups based on permissions
  const portalNavGroups = getPortalNavigationGroups(permissions, openTicketCount);

  return (
    <Sidebar
      variant="portal"
      customNavigation={portalNavGroups}
      headerComponent={<PortalHeader user={user} />}
      showLogo={false}
      collapsible={false}
    />
  );
}

export default PortalSidebar;
