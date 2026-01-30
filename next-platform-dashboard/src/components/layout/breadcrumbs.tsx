"use client";

import { Fragment, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent?: boolean;
}

interface BreadcrumbsProps {
  /** Custom items to display instead of auto-generated */
  items?: BreadcrumbItem[];
  /** Whether to show home icon as first item */
  showHome?: boolean;
  /** Custom class name */
  className?: string;
  /** Maximum items to show before collapsing */
  maxItems?: number;
}

/**
 * Route-to-label mapping for known routes.
 * Add new routes here to customize breadcrumb labels.
 */
const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  sites: "Sites",
  clients: "Clients",
  media: "Media Library",
  crm: "CRM",
  billing: "Billing",
  settings: "Settings",
  marketplace: "Marketplace",
  admin: "Admin",
  support: "Support",
  modules: "Modules",
  subscriptions: "Subscriptions",
  profile: "Profile",
  security: "Security",
  team: "Team",
  branding: "Branding",
  notifications: "Notifications",
  // Site sub-routes
  editor: "Editor",
  pages: "Pages",
  blog: "Blog",
  seo: "SEO",
  submissions: "Submissions",
  // Module routes
  social: "Social Media",
  automation: "Automation",
  "ai-agents": "AI Agents",
  ecommerce: "E-Commerce",
  booking: "Booking",
  "crm-module": "CRM Module",
  // Social sub-routes
  accounts: "Accounts",
  calendar: "Calendar",
  compose: "Compose",
  inbox: "Inbox",
  analytics: "Analytics",
  campaigns: "Campaigns",
  approvals: "Approvals",
  // AI Agents sub-routes
  testing: "Testing",
  usage: "Usage",
  // Automation sub-routes
  workflows: "Workflows",
  templates: "Templates",
  executions: "Executions",
  // Admin routes
  agencies: "Agencies",
  users: "Users",
};

/**
 * Generate breadcrumb items from a pathname.
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Remove leading slash and split into segments
  const segments = pathname.split("/").filter(Boolean);
  
  if (segments.length === 0) {
    return [];
  }

  const items: BreadcrumbItem[] = [];
  let currentPath = "";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;
    
    // Skip dynamic segments that look like UUIDs
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
    
    if (isUUID) {
      // For UUIDs, we could try to fetch the actual name, but for now skip
      // The label would be fetched from context or a cache in production
      continue;
    }

    // Get label from mapping or capitalize the segment
    const label = routeLabels[segment] || 
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");

    items.push({
      label,
      href: currentPath,
      isCurrent: i === segments.length - 1,
    });
  }

  return items;
}

/**
 * Breadcrumbs component for navigation hierarchy.
 * Automatically generates breadcrumbs from the current route.
 * 
 * @example
 * ```tsx
 * <Breadcrumbs />
 * 
 * // With custom items
 * <Breadcrumbs items={[
 *   { label: "Dashboard", href: "/dashboard" },
 *   { label: "Site Name", href: "/dashboard/sites/123" },
 *   { label: "Editor", href: "/dashboard/sites/123/editor", isCurrent: true }
 * ]} />
 * ```
 */
export function Breadcrumbs({ 
  items: customItems, 
  showHome = true,
  className,
  maxItems = 4,
}: BreadcrumbsProps) {
  const pathname = usePathname();
  
  const items = useMemo(() => {
    return customItems || generateBreadcrumbs(pathname);
  }, [customItems, pathname]);

  // Don't render if no items or just dashboard
  if (items.length === 0 || (items.length === 1 && items[0].href === "/dashboard")) {
    return null;
  }

  // Collapse middle items if too many
  const shouldCollapse = items.length > maxItems;
  const displayItems = shouldCollapse
    ? [items[0], { label: "...", href: "#", isCollapsed: true } as BreadcrumbItem & { isCollapsed?: boolean }, ...items.slice(-2)]
    : items;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center text-sm", className)}
    >
      <ol className="flex items-center gap-1.5" role="list">
        {/* Home link */}
        {showHome && (
          <>
            <li>
              <Link
                href="/dashboard"
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Home"
              >
                <Home className="h-4 w-4" />
              </Link>
            </li>
            {items.length > 0 && (
              <li aria-hidden="true">
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              </li>
            )}
          </>
        )}

        {/* Breadcrumb items */}
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isCollapsed = (item as BreadcrumbItem & { isCollapsed?: boolean }).isCollapsed;

          return (
            <Fragment key={item.href + index}>
              <li>
                {isCollapsed ? (
                  <span className="text-muted-foreground px-1">...</span>
                ) : isLast || item.isCurrent ? (
                  <span 
                    className="font-medium text-foreground"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true">
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
