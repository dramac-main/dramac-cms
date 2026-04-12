"use client";

import { createContext, useContext, type ReactNode } from "react";

// =============================================================================
// TYPES
// =============================================================================

export interface PortalContextValue {
  isPortalView: true;
  portalUser: {
    clientId: string;
    fullName: string;
    email: string;
    agencyId: string;
  };
  permissions: {
    canManageLiveChat: boolean;
    canManageOrders: boolean;
    canManageProducts: boolean;
    canManageBookings: boolean;
    canManageCrm: boolean;
    canManageAutomation: boolean;
    canManageQuotes: boolean;
    canManageAgents: boolean;
    canManageCustomers: boolean;
    canManageMarketing: boolean;
  };
  siteId: string;
}

// =============================================================================
// CONTEXT
// =============================================================================

const PortalContext = createContext<PortalContextValue | null>(null);

export function PortalProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: PortalContextValue;
}) {
  return (
    <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
  );
}

/**
 * Get portal context. Returns null if not in portal mode.
 */
export function usePortal(): PortalContextValue | null {
  return useContext(PortalContext);
}

/**
 * Check if running inside the portal. Use this in module components
 * to conditionally hide agency-only features.
 */
export function useIsPortalView(): boolean {
  const ctx = useContext(PortalContext);
  return ctx?.isPortalView ?? false;
}
