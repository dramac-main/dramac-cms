"use client";

import { useMemo } from "react";
import { Sidebar } from "@/components/layout/sidebar-modern";
import { settingsNavigation } from "@/config/settings-navigation";
import type { NavGroup } from "@/config/navigation";
import { Settings } from "lucide-react";

/**
 * SettingsSidebar - Uses the unified Sidebar component with settings variant
 * 
 * The settings sidebar displays account and agency settings navigation.
 * It uses the variant="settings" which provides:
 * - Proper settings styling using CSS variables
 * - Sticky positioning
 * - Non-collapsible design
 */

const settingsHeader = (
  <div className="flex items-center gap-2 px-3 py-2">
    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
      <Settings className="w-4 h-4 text-primary" />
    </div>
    <div className="overflow-hidden">
      <h2 className="font-semibold text-sm text-sidebar-foreground">Settings</h2>
      <p className="text-xs text-sidebar-foreground/60">Manage your account</p>
    </div>
  </div>
);

// Pre-compute nav groups outside component to avoid re-creation on every render
const settingsNavGroups: NavGroup[] = settingsNavigation.map((section) => ({
  title: section.title,
  items: section.items.map((item) => ({
    title: item.name,
    href: item.href,
    icon: item.icon,
  })),
}));

export function SettingsSidebar() {
  return (
    <Sidebar
      key="settings-sidebar"
      variant="settings"
      customNavigation={settingsNavGroups}
      headerComponent={settingsHeader}
      showLogo={false}
      collapsible={false}
    />
  );
}

export default SettingsSidebar;
