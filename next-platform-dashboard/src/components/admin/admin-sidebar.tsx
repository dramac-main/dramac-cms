"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Shield,
  Activity,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";

const adminNav = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Agencies", href: "/admin/agencies", icon: Building2 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Activity Log", href: "/admin/activity", icon: Activity },
  { name: "System Health", href: "/admin/health", icon: AlertTriangle },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative w-64 bg-card border-r flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-destructive flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">Super Admin Access</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-destructive text-white"
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
      </nav>

      <div className="p-4 border-t">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </aside>
  );
}
