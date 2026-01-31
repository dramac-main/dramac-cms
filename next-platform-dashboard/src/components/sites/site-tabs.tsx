"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Settings,
  FileText,
  Boxes,
  PenTool,
  Search,
  MessageSquare,
} from "lucide-react";

interface SiteTabsProps {
  siteId: string;
  siteName?: string;
}

const tabs = [
  {
    label: "Overview",
    href: (siteId: string) => `/sites/${siteId}`,
    icon: FileText,
  },
  {
    label: "Builder",
    href: (siteId: string) => `/sites/${siteId}/builder`,
    icon: PenTool,
  },
  {
    label: "Analytics",
    href: (siteId: string) => `/sites/${siteId}/analytics`,
    icon: BarChart3,
  },
  {
    label: "Blog",
    href: (siteId: string) => `/sites/${siteId}/blog`,
    icon: MessageSquare,
  },
  {
    label: "Modules",
    href: (siteId: string) => `/sites/${siteId}/modules`,
    icon: Boxes,
  },
  {
    label: "SEO",
    href: (siteId: string) => `/sites/${siteId}/seo`,
    icon: Search,
  },
  {
    label: "Submissions",
    href: (siteId: string) => `/sites/${siteId}/submissions`,
    icon: MessageSquare,
  },
  {
    label: "Settings",
    href: (siteId: string) => `/sites/${siteId}/settings`,
    icon: Settings,
  },
];

export function SiteTabs({ siteId, siteName }: SiteTabsProps) {
  const pathname = usePathname();

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        {siteName && (
          <div className="py-3 border-b">
            <h2 className="text-lg font-semibold">{siteName}</h2>
          </div>
        )}
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const href = tab.href(siteId);
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.label}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
