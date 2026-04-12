/**
 * Marketing Module Navigation
 *
 * Persistent horizontal sub-navigation for all marketing pages.
 * Modeled after the live-chat module's navigation pattern.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mail,
  Zap,
  Users,
  FileText,
  FormInput,
  BarChart3,
  Share2,
  CalendarDays,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MarketingNavProps {
  siteId: string;
  /** Override the base path (defaults to /dashboard/sites/{siteId}/marketing) */
  basePath?: string;
}

export function MarketingNav({ siteId, basePath }: MarketingNavProps) {
  const pathname = usePathname();
  const base = basePath || `/dashboard/sites/${siteId}/marketing`;

  const navItems = [
    {
      href: base,
      label: "Overview",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: `${base}/campaigns`,
      label: "Campaigns",
      icon: Mail,
    },
    {
      href: `${base}/sequences`,
      label: "Sequences",
      icon: Zap,
    },
    {
      href: `${base}/subscribers`,
      label: "Subscribers",
      icon: Users,
    },
    {
      href: `${base}/landing-pages`,
      label: "Landing Pages",
      icon: FileText,
    },
    {
      href: `${base}/forms`,
      label: "Forms",
      icon: FormInput,
    },
    {
      href: `${base}/templates`,
      label: "Templates",
      icon: BarChart3,
    },
    {
      href: `${base}/social`,
      label: "Social",
      icon: Share2,
    },
    {
      href: `${base}/calendar`,
      label: "Calendar",
      icon: CalendarDays,
    },
    {
      href: `${base}/sms`,
      label: "SMS",
      icon: MessageSquare,
    },
  ];

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              className={cn("gap-2", isActive && "bg-secondary")}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}
