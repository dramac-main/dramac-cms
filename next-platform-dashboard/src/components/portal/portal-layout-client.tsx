"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { Sidebar } from "@/components/layout/sidebar-modern";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SwipeHandler } from "@/components/layout/swipe-handler";
import { MobileFAB } from "@/components/layout/mobile-fab";
import { PortalChikoFab } from "@/components/portal/portal-chiko-fab";
import { cn } from "@/lib/utils";
import { useBreakpointDown } from "@/hooks/use-media-query";
import {
  getPortalNavigationGroups,
  type PortalUserPermissions,
} from "@/config/portal-navigation";
import type { PortalUser } from "@/lib/portal/portal-auth";
import { useBrandingOptional } from "@/components/providers/branding-provider";
import { Globe } from "lucide-react";
import { LAYOUT } from "@/config/layout";
import Image from "next/image";

interface PortalLayoutClientProps {
  children: ReactNode;
  user: PortalUser;
  openTicketCount?: number;
  /** Show impersonation state */
  isImpersonating?: boolean;
  /** Installed module slugs across all client sites */
  installedModules?: string[];
  /** If client has exactly one site, nav links go directly to that site */
  singleSiteId?: string;
  /** Header component to render at top */
  headerComponent?: ReactNode;
  /** Show bottom navigation on mobile */
  showBottomNav?: boolean;
  /** Enable swipe gestures for sidebar on mobile */
  enableSwipeGestures?: boolean;
}

/**
 * PortalHeader - Sidebar header showing company and user info with branding
 */
function PortalSidebarHeader({ user }: { user: PortalUser }) {
  const branding = useBrandingOptional();
  const logoUrl = branding?.getLogoUrl();
  const displayName =
    branding?.getDisplayName() || user.companyName || "Client Portal";

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={displayName}
            width={32}
            height={32}
            className="w-full h-full object-contain"
          />
        ) : (
          <Globe className="w-4 h-4 text-primary" />
        )}
      </div>
      <div className="overflow-hidden">
        <h2 className="font-semibold text-sm text-sidebar-foreground truncate">
          {displayName}
        </h2>
        <p className="text-xs text-sidebar-foreground/60 truncate">
          {user.fullName}
        </p>
      </div>
    </div>
  );
}

/**
 * Client-side portal layout wrapper.
 * Provides sidebar context and handles the main layout structure.
 *
 * This mirrors the dashboard layout with portal-specific navigation.
 * Includes:
 * - Sidebar state management with SidebarProvider
 * - Unified sidebar with portal variant
 * - Mobile bottom navigation
 * - Swipe gestures for mobile sidebar
 * - Mobile FAB
 */
export function PortalLayoutClient({
  children,
  user,
  openTicketCount = 0,
  isImpersonating = false,
  installedModules = [],
  singleSiteId,
  headerComponent,
  showBottomNav = true,
  enableSwipeGestures = true,
}: PortalLayoutClientProps) {
  return (
    <SidebarProvider>
      <PortalLayoutInner
        user={user}
        openTicketCount={openTicketCount}
        isImpersonating={isImpersonating}
        installedModules={installedModules}
        singleSiteId={singleSiteId}
        headerComponent={headerComponent}
        showBottomNav={showBottomNav}
        enableSwipeGestures={enableSwipeGestures}
      >
        {children}
      </PortalLayoutInner>
    </SidebarProvider>
  );
}

/**
 * Inner layout component that has access to sidebar context
 */
/**
 * Extract siteId from the current URL path.
 * Matches /portal/sites/{uuid}/... pattern.
 */
const SITE_PATH_REGEX = /^\/portal\/sites\/([0-9a-f-]{36})/i;

function PortalLayoutInner({
  children,
  user,
  openTicketCount,
  isImpersonating,
  installedModules,
  singleSiteId,
  headerComponent,
  showBottomNav,
  enableSwipeGestures,
}: PortalLayoutClientProps & {
  showBottomNav: boolean;
  enableSwipeGestures: boolean;
}) {
  const isMobile = useBreakpointDown("md");
  const pathname = usePathname();

  // Resolve siteId: prefer URL context (multi-site aware), fallback to single-site shortcut
  const urlSiteId = pathname ? SITE_PATH_REGEX.exec(pathname)?.[1] : undefined;
  const activeSiteId = urlSiteId || singleSiteId;

  // Get permissions from user
  const permissions: PortalUserPermissions = {
    canViewAnalytics: user.canViewAnalytics,
    canEditContent: user.canEditContent,
    canViewInvoices: user.canViewInvoices,
    canManageLiveChat: user.canManageLiveChat,
    canManageOrders: user.canManageOrders,
    canManageProducts: user.canManageProducts,
    canManageBookings: user.canManageBookings,
    canManageCrm: user.canManageCrm,
    canManageAutomation: user.canManageAutomation,
    canManageQuotes: user.canManageQuotes,
    canManageAgents: user.canManageAgents,
    canManageCustomers: user.canManageCustomers,
    canManageMarketing: user.canManageMarketing,
    canManageInvoices: user.canManageInvoices,
    canManageSupport: user.canManageSupport,
  };

  // Get navigation groups based on permissions and installed modules
  // activeSiteId ensures correct site-scoped URLs for Operations links
  const portalNavGroups = getPortalNavigationGroups(
    permissions,
    installedModules || [],
    openTicketCount || 0,
    activeSiteId,
  );

  // Content to render
  const content = (
    <div className="flex min-h-screen bg-background">
      {/* Portal Sidebar - uses unified component with portal variant */}
      <Sidebar
        key="portal-sidebar"
        variant="portal"
        customNavigation={portalNavGroups}
        headerComponent={<PortalSidebarHeader user={user} />}
        showLogo={false}
        collapsible={false}
      />

      {/* Main content area */}
      <div
        className={cn(
          "flex flex-1 flex-col min-w-0",
          isImpersonating && "pt-0", // Header handles impersonation banner
        )}
      >
        {/* Portal Header */}
        {headerComponent}

        {/* Main content with consistent padding */}
        <main
          className={cn(
            "flex-1 overflow-auto",
            // Consistent responsive padding matching dashboard
            "p-4 md:p-6 lg:p-8",
            // Add bottom padding on mobile when bottom nav is shown
            showBottomNav && "pb-20 md:pb-8",
          )}
        >
          <div className={cn("mx-auto w-full", LAYOUT.CONTENT_MAX_WIDTH)}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile FAB for quick actions */}
      {isMobile && <MobileFAB />}

      {/* Floating Ask Chiko button — visible on every portal page */}
      <PortalChikoFab />

      {/* Mobile bottom navigation */}
      {showBottomNav && isMobile && <MobileBottomNav variant="portal" />}
    </div>
  );

  // Wrap with swipe handler on mobile if enabled
  if (enableSwipeGestures && isMobile) {
    return <SwipeHandler enabled={true}>{content}</SwipeHandler>;
  }

  return content;
}

export default PortalLayoutClient;
