/**
 * Settings Navigation Configuration
 * 
 * Navigation items for the settings sidebar.
 * Used by the unified Sidebar component with variant="settings"
 */

import {
  Building2,
  User,
  Users,
  Bell,
  CreditCard,
  Shield,
  Palette,
  Globe,
  Globe2,
  Activity,
  Puzzle,
  type LucideIcon,
} from "lucide-react";

export interface SettingsNavSection {
  title: string;
  items: SettingsNavItem[];
}

export interface SettingsNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export const settingsNavigation: SettingsNavSection[] = [
  {
    title: "Account",
    items: [
      { name: "Profile", href: "/settings/profile", icon: User },
      { name: "Security", href: "/settings/security", icon: Shield },
      { name: "Notifications", href: "/settings/notifications", icon: Bell },
    ],
  },
  {
    title: "Agency",
    items: [
      { name: "General", href: "/settings/agency", icon: Building2 },
      { name: "Team", href: "/settings/team", icon: Users },
      { name: "Branding", href: "/settings/branding", icon: Palette },
      { name: "Regional", href: "/settings/regional", icon: Globe2 },
      { name: "Domains", href: "/settings/domains", icon: Globe },
      { name: "Activity Log", href: "/settings/activity", icon: Activity },
      { name: "Modules", href: "/settings/modules", icon: Puzzle },
    ],
  },
  {
    title: "Billing",
    items: [
      { name: "Subscription", href: "/settings/subscription", icon: CreditCard },
    ],
  },
];

/**
 * Flatten settings navigation for simple iteration
 */
export function getFlatSettingsNav(): SettingsNavItem[] {
  return settingsNavigation.flatMap(section => section.items);
}
