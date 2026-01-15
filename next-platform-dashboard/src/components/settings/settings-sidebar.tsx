"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2,
  User,
  Users,
  Bell,
  CreditCard,
  Shield,
  Palette,
  Globe,
} from "lucide-react";

const settingsNav = [
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
      { name: "Domains", href: "/settings/domains", icon: Globe },
    ],
  },
  {
    title: "Billing",
    items: [
      { name: "Subscription", href: "/settings/subscription", icon: CreditCard },
    ],
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account and agency
        </p>
      </div>

      {settingsNav.map((section) => (
        <div key={section.title}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {section.title}
          </h3>
          <ul className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
