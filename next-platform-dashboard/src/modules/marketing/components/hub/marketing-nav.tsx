/**
 * Marketing Module Navigation
 *
 * Persistent horizontal sub-navigation for all marketing pages.
 * Responsive: scrollable on small screens, full display on large.
 * Active tab auto-scrolls into view on mount.
 */
"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mail,
  Zap,
  Users,
  FileText,
  FormInput,
  Palette,
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
  const scrollRef = useRef<HTMLElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

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
      label: "Pages",
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
      icon: Palette,
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

  // Auto-scroll active tab into view on mount/route change
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const nav = scrollRef.current;
      const active = activeRef.current;
      const navRect = nav.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      if (
        activeRect.left < navRect.left ||
        activeRect.right > navRect.right
      ) {
        active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [pathname]);

  return (
    <nav
      ref={scrollRef}
      className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-px"
      role="tablist"
      aria-label="Marketing navigation"
    >
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            ref={isActive ? activeRef : undefined}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? "page" : undefined}
          >
            <Button
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "gap-1.5 whitespace-nowrap shrink-0 transition-all",
                isActive && "bg-secondary font-medium shadow-sm",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{item.label}</span>
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}
