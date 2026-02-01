"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, X, Shield, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "./sidebar-context";
import { mainNavigation, bottomNavigation, adminNavigation, type NavGroup, type NavItem } from "@/config/navigation";
import { LAYOUT } from "@/config/layout";

// ============================================
// TYPES
// ============================================

export type SidebarVariant = 'main' | 'admin' | 'portal' | 'settings';

interface SidebarProps {
  className?: string;
  isSuperAdmin?: boolean;
  /** Sidebar variant determines styling and default navigation */
  variant?: SidebarVariant;
  /** Override default navigation with custom items */
  customNavigation?: NavGroup[];
  /** Custom bottom navigation items */
  customBottomNavigation?: NavItem[];
  /** Custom header component (replaces logo for some variants) */
  headerComponent?: React.ReactNode;
  /** Custom footer component (e.g., "Back to Dashboard" link) */
  footerComponent?: React.ReactNode;
  /** Whether the sidebar can collapse (default: true for main, false for others) */
  collapsible?: boolean;
  /** Whether to show the logo (default: true for main/admin, false for others) */
  showLogo?: boolean;
}

// ============================================
// ANIMATION VARIANTS
// ============================================

const sidebarVariants = {
  expanded: { width: 256 },
  collapsed: { width: 64 },
};

const contentVariants = {
  visible: { opacity: 1, x: 0 },
  hidden: { opacity: 0, x: -10 },
};

const logoTextVariants = {
  visible: { opacity: 1, width: "auto" },
  hidden: { opacity: 0, width: 0 },
};

// ============================================
// VARIANT-SPECIFIC COMPONENTS
// ============================================

function AdminHeader() {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
        <Shield className="w-4 h-4 text-destructive" />
      </div>
      <div className="overflow-hidden">
        <h2 className="font-semibold text-sm text-sidebar-foreground">Admin Panel</h2>
        <p className="text-xs text-sidebar-foreground/60">Super Admin Access</p>
      </div>
    </div>
  );
}

function AdminFooter() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors px-3 py-2 mx-2 rounded-lg hover:bg-sidebar-accent"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Dashboard
    </Link>
  );
}

// ============================================
// MAIN SIDEBAR COMPONENT
// ============================================

export function Sidebar({
  className,
  isSuperAdmin = false,
  variant = 'main',
  customNavigation,
  customBottomNavigation,
  headerComponent,
  footerComponent,
  collapsible: collapsibleProp,
  showLogo: showLogoProp,
}: SidebarProps) {
  const { collapsed, toggle, mobileOpen, setMobileOpen, closeMobile } = useSidebar();
  const pathname = usePathname();

  // Determine variant-specific defaults
  const isMainVariant = variant === 'main';
  const isAdminVariant = variant === 'admin';
  const collapsible = collapsibleProp ?? isMainVariant;
  const showLogo = showLogoProp ?? (isMainVariant || isAdminVariant);

  // Get navigation based on variant
  const navigation = customNavigation ?? (isAdminVariant ? [] : mainNavigation);
  const bottomNav = customBottomNavigation ?? (isMainVariant ? bottomNavigation : []);

  // Get variant-specific header/footer
  const header = headerComponent ?? (isAdminVariant ? <AdminHeader /> : null);
  const footer = footerComponent ?? (isAdminVariant ? <AdminFooter /> : null);

  // Effective collapsed state (only for collapsible variants)
  const isCollapsed = collapsible ? collapsed : false;

  // Close mobile sidebar on route change
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarContent = (
    <TooltipProvider delayDuration={0}>
      {/* Header Section */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-3">
        {showLogo ? (
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 overflow-hidden"
            onClick={closeMobile}
          >
            <motion.div 
              className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-lg font-bold text-primary-foreground">D</span>
            </motion.div>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={logoTextVariants}
                  className="font-semibold text-lg whitespace-nowrap overflow-hidden text-sidebar-foreground"
                >
                  DRAMAC
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        ) : header ? (
          <div className="flex-1 overflow-hidden">{header}</div>
        ) : (
          <div />
        )}
        
        {/* Desktop collapse button - only for collapsible variants */}
        {collapsible && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className={cn(
              "hidden lg:flex h-8 w-8 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent",
              isCollapsed && "mx-auto"
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.div>
          </Button>
        )}

        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={closeMobile}
          className="lg:hidden h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Variant-specific header (below logo) */}
      {showLogo && header && (
        <div className="border-b border-sidebar-border">
          {header}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        {navigation.map((group, groupIndex) => (
          <NavGroupComponent
            key={groupIndex}
            group={group}
            collapsed={isCollapsed}
            pathname={pathname}
            onItemClick={closeMobile}
          />
        ))}
      </nav>

      {/* Bottom Navigation */}
      {(bottomNav.length > 0 || footer || (isSuperAdmin && isMainVariant)) && (
        <div className="border-t border-sidebar-border py-4">
          {/* Admin Panel link - only for super admins on main variant */}
          {isSuperAdmin && isMainVariant && (
            <NavItemComponent
              item={adminNavigation}
              collapsed={isCollapsed}
              pathname={pathname}
              onItemClick={closeMobile}
            />
          )}
          {bottomNav.map((item) => (
            <NavItemComponent
              key={item.href}
              item={item}
              collapsed={isCollapsed}
              pathname={pathname}
              onItemClick={closeMobile}
            />
          ))}
          {footer}
        </div>
      )}
    </TooltipProvider>
  );

  return (
    <>
      {/* Desktop Sidebar - STICKY POSITIONING */}
      <motion.aside
        data-tour="sidebar"
        data-variant={variant}
        initial={false}
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={collapsible ? sidebarVariants : undefined}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={cn(
          // Base styles
          "hidden lg:flex flex-col border-r",
          // CRITICAL: Sticky positioning to keep sidebar fixed
          LAYOUT.SIDEBAR_POSITION,
          // Theme colors using CSS variables
          "bg-sidebar text-sidebar-foreground border-sidebar-border",
          // Width (static for non-collapsible variants)
          !collapsible && LAYOUT.SIDEBAR_WIDTH,
          className
        )}
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={closeMobile}
              aria-hidden="true"
            />
            
            {/* Sidebar Panel */}
            <motion.aside
              data-variant={variant}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn(
                "lg:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col",
                "bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-xl"
              )}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function NavGroupComponent({
  group,
  collapsed,
  pathname,
  onItemClick,
}: {
  group: NavGroup;
  collapsed: boolean;
  pathname: string;
  onItemClick?: () => void;
}) {
  return (
    <div className="mb-4">
      <AnimatePresence mode="wait">
        {group.title && !collapsed && (
          <motion.h4
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={contentVariants}
            transition={{ duration: 0.15 }}
            className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50"
          >
            {group.title}
          </motion.h4>
        )}
      </AnimatePresence>
      {collapsed && group.title && (
        <div className="mx-2 my-2 h-px bg-sidebar-border" aria-hidden="true" />
      )}
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <NavItemComponent
            key={item.href}
            item={item}
            collapsed={collapsed}
            pathname={pathname}
            onItemClick={onItemClick}
          />
        ))}
      </div>
    </div>
  );
}

function NavItemComponent({
  item,
  collapsed,
  pathname,
  onItemClick,
}: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
  onItemClick?: () => void;
}) {
  // Improved active state logic:
  // - Exact match for items like /dashboard, /settings, /admin
  // - Child route match only for items that aren't top-level sections
  // This prevents /dashboard from being active when on /dashboard/crm
  const isExactMatch = pathname === item.href;
  const isChildRoute = pathname.startsWith(`${item.href}/`);
  
  // Only consider child routes as active if the item href has more than one segment
  // e.g., /dashboard/crm should match /dashboard/crm/contacts
  // but /dashboard should NOT match /dashboard/crm
  const isTopLevelItem = item.href === '/dashboard' || item.href === '/settings' || item.href === '/admin' || item.href === '/marketplace';
  const isActive = isExactMatch || (!isTopLevelItem && isChildRoute);
  const Icon = item.icon;

  const content = (
    <Link
      href={item.disabled ? "#" : item.href}
      data-tour={item.dataTour}
      onClick={(e) => {
        if (item.disabled) {
          e.preventDefault();
          return;
        }
        onItemClick?.();
      }}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
        collapsed ? "mx-2 justify-center" : "mx-2",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        item.disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <Icon 
        className={cn(
          "h-5 w-5 shrink-0 transition-transform duration-150",
          !isActive && "group-hover:scale-110"
        )} 
      />
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={contentVariants}
            transition={{ duration: 0.15 }}
            className="flex flex-1 items-center justify-between overflow-hidden"
          >
            <span className="truncate">{item.title}</span>
            {item.badge && (
              <span className="ml-auto rounded-full bg-sidebar-primary/10 px-2 py-0.5 text-xs font-medium text-sidebar-primary">
                {item.badge}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {item.title}
          {item.badge && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {item.badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

// ============================================
// EXPORTS
// ============================================

export type { SidebarProps };
