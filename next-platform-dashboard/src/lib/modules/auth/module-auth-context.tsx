'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export interface ModuleRole {
  id: string;
  name: string;
  slug: string;
  permissions: string[];
  hierarchyLevel: number | null;
}

export interface ModuleAuthState {
  // User
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Module context
  moduleId: string;
  siteId: string;
  
  // Roles & permissions
  roles: ModuleRole[];
  permissions: string[];
  highestRoleLevel: number;
  
  // Helper methods
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (roleSlug: string) => boolean;
  hasAnyRole: (roleSlugs: string[]) => boolean;
  isAtLeastRole: (roleSlug: string) => boolean;
  isAtLeastLevel: (level: number) => boolean;
  
  // Actions
  refreshRoles: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const ModuleAuthContext = createContext<ModuleAuthState | null>(null);

/**
 * Hook to access module authentication state
 * @throws Error if used outside ModuleAuthProvider
 */
export function useModuleAuth(): ModuleAuthState {
  const context = useContext(ModuleAuthContext);
  if (!context) {
    throw new Error('useModuleAuth must be used within ModuleAuthProvider');
  }
  return context;
}

/**
 * Optional hook that returns null if outside provider (useful for optional auth)
 */
export function useModuleAuthOptional(): ModuleAuthState | null {
  return useContext(ModuleAuthContext);
}

// ============================================================================
// Provider
// ============================================================================

interface ModuleAuthProviderProps {
  children: React.ReactNode;
  moduleId: string;
  siteId: string;
  /** Optional initial roles to hydrate from SSR */
  initialRoles?: ModuleRole[];
}

export function ModuleAuthProvider({
  children,
  moduleId,
  siteId,
  initialRoles = []
}: ModuleAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<ModuleRole[]>(initialRoles);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load user roles from database
  const loadUserRoles = useCallback(async (userId: string) => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('module_user_roles')
        .select(`
          role:module_roles(
            id,
            name,
            slug,
            permissions,
            hierarchy_level
          )
        `)
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .eq('site_id', siteId)
        .eq('is_active', true);
      
      if (error) {
        console.error('Failed to load module roles:', error);
        return;
      }
      
      const userRoles = (data || [])
        .filter((d): d is { role: NonNullable<typeof d.role> } => d.role !== null)
        .map(d => ({
          id: d.role.id,
          name: d.role.name,
          slug: d.role.slug,
          permissions: d.role.permissions || [],
          hierarchyLevel: d.role.hierarchy_level
        }));
      
      setRoles(userRoles);
    } catch (error) {
      console.error('Failed to load module roles:', error);
    } finally {
      setIsLoading(false);
    }
  }, [moduleId, siteId]);
  
  // Refresh roles action
  const refreshRoles = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      await loadUserRoles(user.id);
    }
  }, [user, loadUserRoles]);
  
  // Initialize auth state
  useEffect(() => {
    const supabase = createClient();
    
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        loadUserRoles(user.id);
      } else {
        setIsLoading(false);
      }
    });
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const newUser = session?.user ?? null;
        setUser(newUser);
        
        if (newUser) {
          await loadUserRoles(newUser.id);
        } else {
          setRoles([]);
          setIsLoading(false);
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, [moduleId, siteId, loadUserRoles]);
  
  // Aggregate all permissions from all roles
  const permissions = useMemo(() => {
    const allPerms = new Set<string>();
    roles.forEach(role => {
      role.permissions.forEach(p => allPerms.add(p));
    });
    return Array.from(allPerms);
  }, [roles]);
  
  // Get highest role level
  const highestRoleLevel = useMemo(() => {
    if (roles.length === 0) return 0;
    const levels = roles.map(r => r.hierarchyLevel).filter((level): level is number => level !== null);
    if (levels.length === 0) return 0;
    return Math.max(...levels);
  }, [roles]);
  
  // Check single permission (supports wildcards)
  const hasPermission = useCallback((permission: string): boolean => {
    // Superuser check
    if (permissions.includes('*')) return true;
    
    // Exact match
    if (permissions.includes(permission)) return true;
    
    // Category wildcard check (e.g., 'contacts.*' matches 'contacts.view')
    const [category] = permission.split('.');
    if (permissions.includes(`${category}.*`)) return true;
    
    return false;
  }, [permissions]);
  
  // Check if user has any of the listed permissions
  const hasAnyPermission = useCallback((perms: string[]): boolean => {
    return perms.some(p => hasPermission(p));
  }, [hasPermission]);
  
  // Check if user has all of the listed permissions
  const hasAllPermissions = useCallback((perms: string[]): boolean => {
    return perms.every(p => hasPermission(p));
  }, [hasPermission]);
  
  // Check if user has a specific role
  const hasRole = useCallback((roleSlug: string): boolean => {
    return roles.some(r => r.slug === roleSlug);
  }, [roles]);
  
  // Check if user has any of the listed roles
  const hasAnyRole = useCallback((roleSlugs: string[]): boolean => {
    return roleSlugs.some(slug => hasRole(slug));
  }, [hasRole]);
  
  // Check if user's role is at least as high as the specified role
  const isAtLeastRole = useCallback((roleSlug: string): boolean => {
    const targetRole = roles.find(r => r.slug === roleSlug);
    if (!targetRole || targetRole.hierarchyLevel === null) {
      // If user doesn't have the target role, check if they have a higher one
      // This requires knowing the target role's level, which we don't have
      return false;
    }
    return highestRoleLevel >= targetRole.hierarchyLevel;
  }, [roles, highestRoleLevel]);
  
  // Check if user's role level is at least the specified level
  const isAtLeastLevel = useCallback((level: number): boolean => {
    return highestRoleLevel >= level;
  }, [highestRoleLevel]);
  
  const value: ModuleAuthState = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    moduleId,
    siteId,
    roles,
    permissions,
    highestRoleLevel,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAtLeastRole,
    isAtLeastLevel,
    refreshRoles
  }), [
    user,
    isLoading,
    moduleId,
    siteId,
    roles,
    permissions,
    highestRoleLevel,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAtLeastRole,
    isAtLeastLevel,
    refreshRoles
  ]);
  
  return (
    <ModuleAuthContext.Provider value={value}>
      {children}
    </ModuleAuthContext.Provider>
  );
}

// ============================================================================
// Server-side helpers
// ============================================================================

/**
 * Get module roles for a user (for SSR)
 */
export async function getModuleRolesServer(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  moduleId: string,
  siteId: string
): Promise<ModuleRole[]> {
  const { data, error } = await supabase
    .from('module_user_roles')
    .select(`
      role:module_roles(
        id,
        name,
        slug,
        permissions,
        hierarchy_level
      )
    `)
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .eq('site_id', siteId)
    .eq('is_active', true);
  
  if (error) {
    console.error('Failed to load module roles:', error);
    return [];
  }
  
  return (data || [])
    .filter((d): d is { role: NonNullable<typeof d.role> } => d.role !== null)
    .map(d => ({
      id: d.role.id,
      name: d.role.name,
      slug: d.role.slug,
      permissions: d.role.permissions || [],
      hierarchyLevel: d.role.hierarchy_level
    }));
}

/**
 * Check permission server-side
 */
export function checkPermissionServer(
  permissions: string[],
  permission: string
): boolean {
  if (permissions.includes('*')) return true;
  if (permissions.includes(permission)) return true;
  
  const [category] = permission.split('.');
  if (permissions.includes(`${category}.*`)) return true;
  
  return false;
}
