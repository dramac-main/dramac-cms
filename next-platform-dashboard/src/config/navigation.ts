import {
  LayoutDashboard,
  Users,
  Globe,
  Puzzle,
  Package,
  CreditCard,
  Settings,
  HelpCircle,
  Shield,
  ImageIcon,
  Building2,
  Bot,
  BarChart3,
  Mail,
  ArrowRightLeft,
  Server,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
  dataTour?: string; // For product tour targeting
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
        dataTour: "clients",
      },
      {
        title: "Sites",
        href: "/dashboard/sites",
        icon: Globe,
        dataTour: "sites",
      },
      {
        title: "CRM",
        href: "/dashboard/crm",
        icon: Building2,
        dataTour: "crm",
      },
      {
        title: "Media Library",
        href: "/dashboard/media",
        icon: ImageIcon,
        dataTour: "media",
      },
    ],
  },
  {
    title: "Domains & Email",
    items: [
      {
        title: "Domains",
        href: "/dashboard/domains",
        icon: Server,
        dataTour: "domains",
      },
      {
        title: "Business Email",
        href: "/dashboard/email",
        icon: Mail,
        dataTour: "email",
      },
      {
        title: "Transfers",
        href: "/dashboard/domains/transfer",
        icon: ArrowRightLeft,
        dataTour: "transfers",
      },
    ],
  },
  {
    title: "Marketplace",
    items: [
      {
        title: "Browse Modules",
        href: "/marketplace",
        icon: Package,
        dataTour: "modules",
      },
      {
        title: "My Subscriptions",
        href: "/dashboard/modules/subscriptions",
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
        href: "/settings",
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

// Admin navigation - only shown to super_admin users
export const adminNavigation: NavItem = {
  title: "Admin Panel",
  href: "/admin",
  icon: Shield,
};
