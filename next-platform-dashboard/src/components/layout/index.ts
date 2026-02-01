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

// NOTE: Legacy sidebar and header removed - use modern components instead

