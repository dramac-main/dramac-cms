"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Package,
  Settings,
  DollarSign,
  Repeat,
  CreditCard,
  Receipt,
  BarChart3,
  Sparkles,
  Building2,
  FileStack,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InvoicingNavProps {
  siteId: string;
}

export function InvoicingNav({ siteId }: InvoicingNavProps) {
  const pathname = usePathname();
  const base = `/dashboard/sites/${siteId}/invoicing`;
  const scrollRef = useRef<HTMLElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  const navItems = [
    {
      href: base,
      label: "Dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: `${base}/reports`,
      label: "Reports",
      icon: BarChart3,
      exact: false,
    },
    {
      href: `${base}/invoices`,
      label: "Invoices",
      icon: FileText,
      exact: false,
    },
    {
      href: `${base}/payments`,
      label: "Payments",
      icon: DollarSign,
      exact: false,
    },
    {
      href: `${base}/recurring`,
      label: "Recurring",
      icon: Repeat,
      exact: false,
    },
    {
      href: `${base}/credits`,
      label: "Credits",
      icon: CreditCard,
      exact: false,
    },
    {
      href: `${base}/expenses`,
      label: "Expenses",
      icon: Receipt,
      exact: false,
    },
    { href: `${base}/items`, label: "Items", icon: Package, exact: true },
    {
      href: `${base}/insights`,
      label: "Insights",
      icon: Sparkles,
      exact: false,
    },
    {
      href: `${base}/vendors`,
      label: "Vendors",
      icon: Building2,
      exact: false,
    },
    {
      href: `${base}/bills`,
      label: "Bills",
      icon: FileStack,
      exact: false,
    },
    {
      href: `${base}/purchase-orders`,
      label: "Purchase Orders",
      icon: ClipboardList,
      exact: false,
    },
    {
      href: `${base}/settings`,
      label: "Settings",
      icon: Settings,
      exact: true,
    },
  ];

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const nav = scrollRef.current;
      const active = activeRef.current;
      const navRect = nav.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      if (activeRect.left < navRect.left || activeRect.right > navRect.right) {
        active.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [pathname]);

  return (
    <nav
      ref={scrollRef}
      className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-px"
      role="tablist"
      aria-label="Invoicing navigation"
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
