import {
  LayoutDashboard,
  Users,
  Globe,
  Puzzle,
  Package,
  CreditCard,
  Settings,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

export const mainNavigation: NavGroup[] = [
  {
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Clients",
        href: "/dashboard/clients",
        icon: Users,
      },
      {
        title: "Sites",
        href: "/dashboard/sites",
        icon: Globe,
      },
    ],
  },
  {
    title: "Marketplace",
    items: [
      {
        title: "Marketplace",
        href: "/marketplace",
        icon: Package,
      },
      {
        title: "My Modules",
        href: "/dashboard/settings/modules",
        icon: Puzzle,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "Billing",
        href: "/dashboard/billing",
        icon: CreditCard,
      },
      {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
      },
    ],
  },
];

export const bottomNavigation: NavItem[] = [
  {
    title: "Help & Support",
    href: "/dashboard/support",
    icon: HelpCircle,
  },
];
