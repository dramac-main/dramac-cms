"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Globe, 
  Package, 
  Settings,
  Menu,
  type LucideIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

/**
 * Mobile bottom navigation items.
 * Limited to 5 items for optimal mobile UX.
 */
interface MobileNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Match paths that start with this prefix */
  matchPrefix?: string;
}

const mobileNavItems: MobileNavItem[] = [
  {
    title: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Sites",
    href: "/dashboard/sites",
    icon: Globe,
    matchPrefix: "/dashboard/sites",
  },
  {
    title: "Modules",
    href: "/marketplace",
    icon: Package,
    matchPrefix: "/marketplace",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    matchPrefix: "/settings",
  },
];

interface MobileBottomNavProps {
  className?: string;
}

/**
 * Mobile bottom navigation bar.
 * Displays primary navigation items for easy thumb access on mobile devices.
 * 
 * Features:
 * - Fixed at bottom of screen
 * - Touch-optimized (44px+ tap targets)
 * - Active state indicator
 * - "More" menu to open full sidebar
 * 
 * @example
 * ```tsx
 * <MobileBottomNav className="md:hidden" />
 * ```
 */
export function MobileBottomNav({ className }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { toggleMobile } = useSidebar();

  const isActive = (item: MobileNavItem) => {
    if (item.matchPrefix) {
      return pathname.startsWith(item.matchPrefix);
    }
    return pathname === item.href;
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden",
        "safe-area-inset-bottom", // For devices with home indicator
        className
      )}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-2">
        {mobileNavItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center py-2 px-1",
                "min-h-[56px] min-w-[64px]", // Touch target
                "transition-colors duration-150",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {active && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className={cn(
                "mt-1 text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}>
                {item.title}
              </span>
            </Link>
          );
        })}

        {/* More menu button */}
        <button
          type="button"
          onClick={toggleMobile}
          className={cn(
            "relative flex flex-1 flex-col items-center justify-center py-2 px-1",
            "min-h-[56px] min-w-[64px]",
            "text-muted-foreground hover:text-foreground transition-colors duration-150"
          )}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
          <span className="mt-1 text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  );
}

/**
 * Spacer component to prevent content from being hidden behind the mobile bottom nav.
 * Add this at the bottom of your page content on mobile.
 */
export function MobileBottomNavSpacer() {
  return <div className="h-[72px] md:hidden" aria-hidden="true" />;
}
