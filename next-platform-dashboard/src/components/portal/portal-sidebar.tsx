"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  BarChart3,
  MessageCircle,
  FileText,
  Settings,
  Image,
  Inbox,
  BookOpen,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PortalUser } from "@/lib/portal/portal-auth";

interface PortalSidebarProps {
  user: PortalUser;
  openTicketCount?: number;
}

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function PortalSidebar({ user, openTicketCount = 0 }: PortalSidebarProps) {
  const pathname = usePathname();

  const mainLinks: NavLink[] = [
    {
      href: "/portal",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/portal/sites",
      label: "My Sites",
      icon: Globe,
    },
  ];

  const featureLinks: NavLink[] = [];

  // Analytics (conditional)
  if (user.canViewAnalytics) {
    featureLinks.push({
      href: "/portal/analytics",
      label: "Analytics",
      icon: BarChart3,
    });
  }

  // Media library
  featureLinks.push({
    href: "/portal/media",
    label: "Media",
    icon: Image,
  });

  // Form submissions
  featureLinks.push({
    href: "/portal/submissions",
    label: "Form Submissions",
    icon: Inbox,
  });

  // Blog posts
  featureLinks.push({
    href: "/portal/blog",
    label: "Blog Posts",
    icon: BookOpen,
  });

  // SEO
  featureLinks.push({
    href: "/portal/seo",
    label: "SEO",
    icon: Search,
  });

  const supportLinks: NavLink[] = [
    {
      href: "/portal/support",
      label: "Support",
      icon: MessageCircle,
      badge: openTicketCount > 0 ? openTicketCount : undefined,
    },
  ];

  // Invoices (conditional)
  if (user.canViewInvoices) {
    supportLinks.push({
      href: "/portal/invoices",
      label: "Invoices",
      icon: FileText,
    });
  }

  supportLinks.push({
    href: "/portal/settings",
    label: "Settings",
    icon: Settings,
  });

  const renderLink = (link: NavLink) => {
    const Icon = link.icon;
    const isActive = 
      link.href === "/portal" 
        ? pathname === "/portal" 
        : pathname === link.href || pathname.startsWith(`${link.href}/`);

    return (
      <Link
        key={link.href}
        href={link.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="flex-1">{link.label}</span>
        {link.badge !== undefined && (
          <span className={cn(
            "px-2 py-0.5 text-xs rounded-full",
            isActive 
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-muted-foreground/20 text-muted-foreground"
          )}>
            {link.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="w-64 border-r bg-background min-h-[calc(100vh-64px)] p-4 hidden lg:block">
      <nav className="space-y-6">
        {/* Main Navigation */}
        <div className="space-y-1">
          {mainLinks.map(renderLink)}
        </div>

        {/* Features Section */}
        {featureLinks.length > 0 && (
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Features
            </p>
            {featureLinks.map(renderLink)}
          </div>
        )}

        {/* Support & Settings Section */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Support
          </p>
          {supportLinks.map(renderLink)}
        </div>
      </nav>

      {/* User Info */}
      {user.companyName && (
        <div className="mt-8 px-3 py-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">Logged in as</p>
          <p className="text-sm font-medium truncate">{user.fullName}</p>
          {user.companyName && (
            <p className="text-xs text-muted-foreground truncate">{user.companyName}</p>
          )}
        </div>
      )}
    </aside>
  );
}
