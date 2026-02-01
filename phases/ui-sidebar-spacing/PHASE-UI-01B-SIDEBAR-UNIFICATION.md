# PHASE-UI-01B: Unify Sidebar Component with Variant Support

**Phase ID**: PHASE-UI-01B  
**Priority**: CRITICAL  
**Estimated Time**: 2 hours  
**Dependencies**: PHASE-UI-01A (config files must exist)  
**Commit After**: Yes (if zero TypeScript errors)

---

## 🎯 OBJECTIVE

Enhance the `sidebar-modern.tsx` component to support multiple variants (main, admin, portal, settings) while adding sticky positioning and proper theme colors. This creates ONE unified sidebar component for the entire platform.

---

## 📋 PRE-REQUISITES

Before starting, verify these files exist:
- `src/config/layout.ts`
- `src/config/admin-navigation.ts`
- `src/config/settings-navigation.ts`
- `src/config/portal-navigation.ts`

---

## 📋 TASKS

### Task 1: Update sidebar-modern.tsx with Variant Support

**File**: `src/components/layout/sidebar-modern.tsx`

**Action**: Completely update this file to support variants.

**Instructions**:
1. Read the current `sidebar-modern.tsx` file
2. Add variant prop and variant-specific rendering
3. Add sticky positioning
4. Ensure all colors use `--sidebar-*` CSS variables
5. Keep existing animation logic

**Key Changes**:
- Add `variant` prop: `'main' | 'admin' | 'portal' | 'settings'`
- Add `customNavigation` prop for passing dynamic navigation
- Add `headerComponent` and `footerComponent` props
- Update desktop sidebar to use `sticky top-0`
- Ensure mobile sidebar still works as overlay

**Updated Component Interface**:

```typescript
interface SidebarProps {
  className?: string;
  isSuperAdmin?: boolean;
  /** Sidebar variant determines styling and default navigation */
  variant?: 'main' | 'admin' | 'portal' | 'settings';
  /** Override default navigation with custom items */
  customNavigation?: NavGroup[];
  /** Custom header component (replaces logo for some variants) */
  headerComponent?: React.ReactNode;
  /** Custom footer component (e.g., "Back to Dashboard" link) */
  footerComponent?: React.ReactNode;
  /** Whether the sidebar can collapse (main variant only) */
  collapsible?: boolean;
  /** Whether to show the logo */
  showLogo?: boolean;
}
```

**Replace the entire file with this updated version**:

```typescript
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Menu, X, Shield, ArrowLeft } from "lucide-react";
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

  // Effective collapsed state (only for collapsible variants)
  const isCollapsed = collapsible ? collapsed : false;

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
      {(bottomNav.length > 0 || footer) && (
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

// ============================================
// NAV GROUP COMPONENT
// ============================================

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

// ============================================
// NAV ITEM COMPONENT
// ============================================

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
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
```

---

### Task 2: Remove Duplicate Hamburger Menu from Sidebar

**Note**: The updated sidebar above does NOT include a hamburger menu trigger button outside the sidebar. The header will be the single location for the mobile menu trigger.

The mobile menu button has been removed from the sidebar. It only exists in `header-modern.tsx`.

---

### Task 3: Delete Legacy Sidebar File

**File**: `src/components/layout/sidebar.tsx`

**Action**: Delete this file entirely. It's the legacy version that's been replaced.

```bash
# Command to run (or just delete the file manually)
rm src/components/layout/sidebar.tsx
```

---

### Task 4: Update Layout Index Exports

**File**: `src/components/layout/index.ts`

**Action**: Update exports to remove legacy sidebar and ensure correct exports.

**Find and replace the sidebar exports section**:

```typescript
// REMOVE these lines:
export { Sidebar as LegacySidebar } from "./sidebar";

// ENSURE these exports exist:
export { Sidebar, type SidebarProps, type SidebarVariant } from "./sidebar-modern";
```

**Full updated file**:

```typescript
/**
 * Layout Components Barrel Export
 * 
 * Provides centralized exports for all layout-related components.
 * Import from '@/components/layout' for cleaner imports.
 * 
 * @module components/layout
 */

// Context
export { SidebarProvider, useSidebar } from "./sidebar-context";

// Unified Sidebar Component (with variants)
export { Sidebar, type SidebarProps, type SidebarVariant } from "./sidebar-modern";

// Header
export { Header } from "./header-modern";

// Dashboard Layout
export { DashboardLayoutClient } from "./dashboard-layout-client";

// Shell Components
export { 
  DashboardShell, 
  DashboardSection, 
  DashboardGrid 
} from "./dashboard-shell";

// Navigation Components
export { Breadcrumbs } from "./breadcrumbs";
export { PageHeader } from "./page-header";

// Mobile Components
export { MobileBottomNav, MobileBottomNavSpacer } from "./mobile-bottom-nav";
export { SwipeHandler } from "./swipe-handler";
export { MobileCommandSheet } from "./mobile-command-sheet";
export { MobileActionSheet } from "./mobile-action-sheet";
export { MobileSearchTrigger } from "./mobile-search-trigger";
export { MobileFAB } from "./mobile-fab";

// Desktop Components
export { CommandPalette } from "./command-palette";
export { SidebarSearch } from "./sidebar-search";
export { QuickActions, SidebarQuickActions } from "./quick-actions";

// NOTE: Legacy sidebar removed - use Sidebar with variant prop instead
```

---

## ✅ VERIFICATION STEPS

After making all changes, run these commands:

```bash
cd next-platform-dashboard

# 1. Check TypeScript compilation
npx tsc --noEmit --skipLibCheck

# 2. If zero errors, commit and push
cd ..
git add .
git commit -m "feat(ui): unify sidebar component with variant support and sticky positioning (PHASE-UI-01B)"
git push
```

---

## 📁 FILES MODIFIED

| File | Action | Description |
|------|--------|-------------|
| `src/components/layout/sidebar-modern.tsx` | Modified | Added variant support, sticky positioning |
| `src/components/layout/sidebar.tsx` | Deleted | Legacy sidebar removed |
| `src/components/layout/index.ts` | Modified | Updated exports |

---

## 🎯 SUCCESS CRITERIA

- [ ] `sidebar-modern.tsx` supports `variant` prop
- [ ] Sidebar uses `sticky top-0 h-screen` positioning
- [ ] All colors use `--sidebar-*` CSS variables
- [ ] Legacy `sidebar.tsx` deleted
- [ ] Index exports updated
- [ ] TypeScript compiles with zero errors
- [ ] Git commit and push successful

---

## 🔗 NEXT PHASE

After this phase completes successfully, proceed to:
**PHASE-UI-01C: Fix Header Mobile Menu**

---

**End of Phase UI-01B**
