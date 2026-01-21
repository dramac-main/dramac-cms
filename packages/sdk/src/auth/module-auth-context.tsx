/**
 * @dramac/sdk - Auth Context
 * 
 * React context and hooks for module authentication
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { ModuleRuntimeContext } from '../types/module';

/**
 * Module auth context value
 */
export interface ModuleAuthContextValue {
  user: { id: string; email: string } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  moduleId: string;
  siteId: string;
  roles: Array<{ slug: string; permissions: string[] }>;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (roleSlug: string) => boolean;
  isAtLeastRole: (roleSlug: string, hierarchy?: Record<string, number>) => boolean;
  refresh: () => Promise<void>;
}

const ModuleAuthContext = createContext<ModuleAuthContextValue | null>(null);

/**
 * Props for ModuleAuthProvider
 */
export interface ModuleAuthProviderProps {
  children: ReactNode;
  moduleId: string;
  siteId: string;
  apiBaseUrl?: string;
}

/**
 * Provider component for module authentication context
 */
export function ModuleAuthProvider({
  children,
  moduleId,
  siteId,
  apiBaseUrl = '/api',
}: ModuleAuthProviderProps) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [roles, setRoles] = useState<Array<{ slug: string; permissions: string[] }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const permissions = React.useMemo(() => {
    const allPermissions = new Set<string>();
    for (const role of roles) {
      for (const permission of role.permissions) {
        allPermissions.add(permission);
      }
    }
    return Array.from(allPermissions);
  }, [roles]);

  const hasPermission = React.useCallback((permission: string): boolean => {
    // Wildcard check
    if (permissions.includes('*')) return true;
    
    // Direct match
    if (permissions.includes(permission)) return true;
    
    // Wildcard pattern matching (e.g., "module.*" matches "module.read")
    const parts = permission.split('.');
    for (let i = parts.length - 1; i > 0; i--) {
      const wildcardPattern = [...parts.slice(0, i), '*'].join('.');
      if (permissions.includes(wildcardPattern)) return true;
    }
    
    return false;
  }, [permissions]);

  const hasAnyPermission = React.useCallback((perms: string[]): boolean => {
    return perms.some((p) => hasPermission(p));
  }, [hasPermission]);

  const hasAllPermissions = React.useCallback((perms: string[]): boolean => {
    return perms.every((p) => hasPermission(p));
  }, [hasPermission]);

  const hasRole = React.useCallback((roleSlug: string): boolean => {
    return roles.some((r) => r.slug === roleSlug);
  }, [roles]);

  const isAtLeastRole = React.useCallback((
    roleSlug: string,
    hierarchy: Record<string, number> = {}
  ): boolean => {
    const targetLevel = hierarchy[roleSlug] ?? 0;
    return roles.some((r) => (hierarchy[r.slug] ?? 0) >= targetLevel);
  }, [roles]);

  const refresh = React.useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/modules/${moduleId}/auth`);
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setRoles(data.roles || []);
      } else {
        setUser(null);
        setRoles([]);
      }
    } catch (error) {
      console.error('Failed to fetch auth context:', error);
      setUser(null);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, moduleId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value: ModuleAuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    moduleId,
    siteId,
    roles,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAtLeastRole,
    refresh,
  };

  return (
    <ModuleAuthContext.Provider value={value}>
      {children}
    </ModuleAuthContext.Provider>
  );
}

/**
 * Hook to access module auth context
 */
export function useModuleAuth(): ModuleAuthContextValue {
  const context = useContext(ModuleAuthContext);
  if (!context) {
    throw new Error('useModuleAuth must be used within a ModuleAuthProvider');
  }
  return context;
}

/**
 * Hook to check a specific permission
 */
export function usePermission(permission: string): boolean {
  const { hasPermission, isLoading } = useModuleAuth();
  return !isLoading && hasPermission(permission);
}
