"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface SidebarContextValue {
  /** Whether the sidebar is collapsed */
  collapsed: boolean;
  /** Toggle sidebar collapsed state */
  toggle: () => void;
  /** Set sidebar collapsed state */
  setCollapsed: (collapsed: boolean) => void;
  /** Whether the mobile sidebar is open */
  mobileOpen: boolean;
  /** Toggle mobile sidebar */
  toggleMobile: () => void;
  /** Set mobile sidebar open state */
  setMobileOpen: (open: boolean) => void;
  /** Close mobile sidebar */
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = "dramac-sidebar-collapsed";

interface SidebarProviderProps {
  children: ReactNode;
  /** Default collapsed state (used if no stored preference) */
  defaultCollapsed?: boolean;
}

/**
 * Provider for sidebar state management.
 * Persists collapsed state to localStorage.
 * 
 * @example
 * ```tsx
 * <SidebarProvider>
 *   <Sidebar />
 *   <MainContent />
 * </SidebarProvider>
 * ```
 */
export function SidebarProvider({ 
  children, 
  defaultCollapsed = false 
}: SidebarProviderProps) {
  // Initialize with default, then hydrate from localStorage
  const [collapsed, setCollapsedState] = useState(defaultCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setCollapsedState(stored === "true");
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage when collapsed changes (after hydration)
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    }
  }, [collapsed, hydrated]);

  // Close mobile sidebar on route change or escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  const toggle = useCallback(() => {
    setCollapsedState(prev => !prev);
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen(prev => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  // Prevent hydration mismatch by not rendering until hydrated
  // Using a CSS approach instead to avoid layout shift
  const value: SidebarContextValue = {
    collapsed: hydrated ? collapsed : defaultCollapsed,
    toggle,
    setCollapsed,
    mobileOpen,
    toggleMobile,
    setMobileOpen,
    closeMobile,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

/**
 * Hook to access sidebar state and controls.
 * Must be used within a SidebarProvider.
 * 
 * @example
 * ```tsx
 * const { collapsed, toggle } = useSidebar();
 * ```
 */
export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
