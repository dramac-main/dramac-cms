/**
 * React Hooks for Tenant Context
 * 
 * Client-side hooks and provider for accessing tenant context in React components.
 * Provides site switching, role checking, and tenant-aware data fetching.
 * 
 * @module multi-tenant/hooks
 */

'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode
} from 'react';
import { createClient } from '@/lib/supabase/client';

// Helper type to bypass strict Supabase typing for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;

/**
 * Site information
 */
export interface Site {
  id: string;
  name: string;
  domain?: string;
}

/**
 * Tenant context value exposed by the provider
 */
export interface TenantContextValue {
  /** The current agency ID */
  agencyId: string | null;
  /** The currently selected site ID */
  siteId: string | null;
  /** The authenticated user ID */
  userId: string | null;
  /** The user's role in the agency */
  role: 'owner' | 'admin' | 'member' | 'viewer' | null;
  /** Whether the context is still loading */
  isLoading: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** List of available sites */
  sites: Site[];
  /** Current site details */
  currentSite: Site | null;
  /** Switch to a different site */
  switchSite: (siteId: string) => void;
  /** Refresh the tenant context */
  refresh: () => Promise<void>;
  /** Check if user has at least the specified role */
  hasRole: (role: 'owner' | 'admin' | 'member' | 'viewer') => boolean;
  /** Check if user is admin (owner or admin) */
  isAdmin: boolean;
  /** Check if user is owner */
  isOwner: boolean;
}

/**
 * React context for tenant data
 */
const TenantContext = createContext<TenantContextValue | null>(null);

/**
 * Hook to access tenant context
 * Must be used within a TenantProvider
 */
export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}

/**
 * Props for TenantProvider
 */
export interface TenantProviderProps {
  children: ReactNode;
  /** Initial site ID (optional, will use cookie or first site) */
  initialSiteId?: string;
}

/**
 * Provider component for tenant context
 */
export function TenantProvider({ children, initialSiteId }: TenantProviderProps) {
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [siteId, setSiteId] = useState<string | null>(initialSiteId || null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<TenantContextValue['role']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  
  const loadTenantContext = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const supabase = createClient() as AnySupabaseClient;
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setUserId(user.id);
      
      // Get agency membership
      const { data: membership, error: membershipError } = await supabase
        .from('agency_members')
        .select('agency_id, role')
        .eq('user_id', user.id)
        .single();
      
      if (membershipError) {
        if (membershipError.code !== 'PGRST116') {
          console.error('Failed to get membership:', membershipError);
        }
        setError('No agency membership found');
        setIsLoading(false);
        return;
      }
      
      if (membership) {
        setAgencyId(membership.agency_id);
        setRole(membership.role as TenantContextValue['role']);
        
        // Get available sites
        const { data: siteList, error: sitesError } = await supabase
          .from('sites')
          .select('id, name, domain')
          .eq('agency_id', membership.agency_id)
          .order('name');
        
        if (sitesError) {
          console.error('Failed to get sites:', sitesError);
        }
        
        setSites(siteList || []);
        
        // Determine current site
        let currentSiteId = initialSiteId;
        
        if (!currentSiteId) {
          // Try to get from cookie
          currentSiteId = document.cookie
            .split('; ')
            .find(row => row.startsWith('current_site_id='))
            ?.split('=')[1];
        }
        
        // Validate site belongs to agency
        if (currentSiteId && siteList?.some((s: Site) => s.id === currentSiteId)) {
          setSiteId(currentSiteId);
        } else if (siteList?.length) {
          // Use first site as default
          setSiteId(siteList[0].id);
          document.cookie = `current_site_id=${siteList[0].id}; path=/; max-age=${365 * 24 * 60 * 60}`;
        }
      }
      
    } catch (err) {
      console.error('Failed to load tenant context:', err);
      setError('Failed to load tenant context');
    } finally {
      setIsLoading(false);
    }
  }, [initialSiteId]);
  
  useEffect(() => {
    loadTenantContext();
    
    // Subscribe to auth changes
    const supabase = createClient() as AnySupabaseClient;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        loadTenantContext();
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [loadTenantContext]);
  
  const switchSite = useCallback((newSiteId: string) => {
    if (sites.some(s => s.id === newSiteId)) {
      setSiteId(newSiteId);
      document.cookie = `current_site_id=${newSiteId}; path=/; max-age=${365 * 24 * 60 * 60}`;
      
      // Trigger custom event for components that need to refresh
      window.dispatchEvent(new CustomEvent('tenant-site-changed', {
        detail: { siteId: newSiteId }
      }));
    }
  }, [sites]);
  
  const hasRole = useCallback((requiredRole: 'owner' | 'admin' | 'member' | 'viewer'): boolean => {
    const roleHierarchy = { owner: 4, admin: 3, member: 2, viewer: 1 };
    const userLevel = role ? roleHierarchy[role] : 0;
    const requiredLevel = roleHierarchy[requiredRole];
    return userLevel >= requiredLevel;
  }, [role]);
  
  const currentSite = sites.find(s => s.id === siteId) || null;
  const isAdmin = role === 'owner' || role === 'admin';
  const isOwner = role === 'owner';
  
  return (
    <TenantContext.Provider value={{
      agencyId,
      siteId,
      userId,
      role,
      isLoading,
      error,
      sites,
      currentSite,
      switchSite,
      refresh: loadTenantContext,
      hasRole,
      isAdmin,
      isOwner
    }}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook that requires a site to be selected
 * Throws an error if no site is selected (useful for pages that require site context)
 */
export function useRequireSite(): TenantContextValue & { siteId: string } {
  const tenant = useTenant();
  
  if (!tenant.isLoading && !tenant.siteId) {
    throw new Error('No site selected');
  }
  
  return tenant as TenantContextValue & { siteId: string };
}

/**
 * Hook to check if current user is an admin
 */
export function useIsAdmin(): boolean {
  const tenant = useTenant();
  return tenant.isAdmin;
}

/**
 * Hook to check if current user is the owner
 */
export function useIsOwner(): boolean {
  const tenant = useTenant();
  return tenant.isOwner;
}

/**
 * Hook to get the current site
 */
export function useCurrentSite(): Site | null {
  const tenant = useTenant();
  return tenant.currentSite;
}

/**
 * Hook to listen for site changes
 */
export function useSiteChangeListener(callback: (siteId: string) => void): void {
  useEffect(() => {
    const handler = (event: CustomEvent<{ siteId: string }>) => {
      callback(event.detail.siteId);
    };
    
    window.addEventListener('tenant-site-changed', handler as EventListener);
    
    return () => {
      window.removeEventListener('tenant-site-changed', handler as EventListener);
    };
  }, [callback]);
}

/**
 * Hook for tenant-aware data fetching
 * Automatically refetches when site changes
 */
export function useTenantQuery<T>(
  queryKey: string,
  fetcher: (siteId: string) => Promise<T>,
  options?: {
    enabled?: boolean;
    refetchOnSiteChange?: boolean;
  }
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const tenant = useTenant();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const enabled = options?.enabled !== false && !tenant.isLoading && !!tenant.siteId;
  const refetchOnSiteChange = options?.refetchOnSiteChange !== false;
  
  const fetchData = useCallback(async () => {
    if (!tenant.siteId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetcher(tenant.siteId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [tenant.siteId, fetcher]);
  
  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData, queryKey]);
  
  // Refetch on site change
  useSiteChangeListener(useCallback(() => {
    if (refetchOnSiteChange && enabled) {
      fetchData();
    }
  }, [refetchOnSiteChange, enabled, fetchData]));
  
  return {
    data,
    isLoading: isLoading || tenant.isLoading,
    error,
    refetch: fetchData
  };
}
