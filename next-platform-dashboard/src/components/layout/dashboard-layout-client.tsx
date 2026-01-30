"use client";

import { ReactNode } from "react";
import { SidebarProvider } from "./sidebar-context";
import { Sidebar } from "./sidebar-modern";
import { Header } from "./header-modern";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { SwipeHandler } from "./swipe-handler";
import { CommandPalette } from "./command-palette";
import { QuickActions } from "./quick-actions";
import { MobileFAB } from "./mobile-fab";
import { cn } from "@/lib/utils";
import { useBreakpointDown } from "@/hooks/use-media-query";

interface DashboardLayoutClientProps {
  children: ReactNode;
  isSuperAdmin?: boolean;
  isImpersonating?: boolean;
  impersonationBanner?: ReactNode;
  /** Show bottom navigation on mobile */
  showBottomNav?: boolean;
  /** Enable swipe gestures for sidebar on mobile */
  enableSwipeGestures?: boolean;
  /** Sites for command palette search */
  sites?: Array<{ id: string; name: string; subdomain: string }>;
  /** Clients for command palette search */
  clients?: Array<{ id: string; name: string; email?: string }>;
}

/**
 * Client-side dashboard layout wrapper.
 * Provides sidebar context and handles the main layout structure.
 * 
 * This is a client component wrapper that enables:
 * - Sidebar state management with SidebarProvider
 * - Animated sidebar transitions
 * - Mobile sidebar with gesture support
 * - Mobile bottom navigation
 * - Persistent collapsed state via localStorage
 */
export function DashboardLayoutClient({
  children,
  isSuperAdmin = false,
  isImpersonating = false,
  impersonationBanner,
  showBottomNav = true,
  enableSwipeGestures = true,
  sites = [],
  clients = [],
}: DashboardLayoutClientProps) {
  return (
    <SidebarProvider>
      <DashboardLayoutInner
        isSuperAdmin={isSuperAdmin}
        isImpersonating={isImpersonating}
        impersonationBanner={impersonationBanner}
        showBottomNav={showBottomNav}
        enableSwipeGestures={enableSwipeGestures}
        sites={sites}
        clients={clients}
      >
        {children}
      </DashboardLayoutInner>
    </SidebarProvider>
  );
}

/**
 * Inner layout component that has access to sidebar context
 */
function DashboardLayoutInner({
  children,
  isSuperAdmin,
  isImpersonating,
  impersonationBanner,
  showBottomNav,
  enableSwipeGestures,
  sites,
  clients,
}: DashboardLayoutClientProps & { 
  showBottomNav: boolean;
  enableSwipeGestures: boolean;
  sites: Array<{ id: string; name: string; subdomain: string }>;
  clients: Array<{ id: string; name: string; email?: string }>;
}) {
  const isMobile = useBreakpointDown("md");

  // Content to render
  const content = (
    <div className="flex min-h-screen bg-background">
      {/* Global Command Palette - ⌘K / Ctrl+K */}
      <CommandPalette 
        sites={sites} 
        clients={clients} 
        isSuperAdmin={isSuperAdmin} 
      />
      
      {/* Impersonation banner - fixed at top */}
      {isImpersonating && impersonationBanner}
      
      {/* Sidebar */}
      <Sidebar isSuperAdmin={isSuperAdmin} />
      
      {/* Main content area */}
      <div 
        className={cn(
          "flex flex-1 flex-col min-w-0",
          isImpersonating && "pt-10"
        )}
      >
        <Header />
        <main className={cn(
          "flex-1 overflow-auto",
          // Add bottom padding on mobile when bottom nav is shown
          showBottomNav && "pb-16 md:pb-0"
        )}>
          {children}
        </main>
      </div>
      
      {/* Desktop Quick Actions FAB */}
      {!isMobile && <QuickActions />}
      
      {/* Mobile bottom navigation */}
      {showBottomNav && isMobile && (
        <>
          <MobileFAB />
          <MobileBottomNav />
        </>
      )}
    </div>
  );

  // Wrap with swipe handler on mobile if enabled
  if (enableSwipeGestures && isMobile) {
    return (
      <SwipeHandler enabled={true}>
        {content}
      </SwipeHandler>
    );
  }

  return content;
}
