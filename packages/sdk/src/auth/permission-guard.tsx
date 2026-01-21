/**
 * @dramac/sdk - Permission Guard Components
 * 
 * Components for permission-based rendering
 */

import React, { ReactNode, ComponentType } from 'react';
import { useModuleAuth, usePermission } from './module-auth-context';

/**
 * Props for PermissionGuard component
 */
export interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Render children only if user has the specified permission
 */
export function PermissionGuard({ 
  permission, 
  children, 
  fallback = null 
}: PermissionGuardProps) {
  const hasPermission = usePermission(permission);
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

/**
 * Props for RequireAuth component
 */
export interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

/**
 * Render children only if user is authenticated
 */
export function RequireAuth({ 
  children, 
  fallback = null,
  loadingFallback = null
}: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useModuleAuth();
  
  if (isLoading) {
    return <>{loadingFallback}</>;
  }
  
  return isAuthenticated ? <>{children}</> : <>{fallback}</>;
}

/**
 * Props for RequireRole component
 */
export interface RequireRoleProps {
  role: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Render children only if user has the specified role
 */
export function RequireRole({ 
  role, 
  children, 
  fallback = null 
}: RequireRoleProps) {
  const { hasRole, isLoading } = useModuleAuth();
  
  if (isLoading) return null;
  
  return hasRole(role) ? <>{children}</> : <>{fallback}</>;
}

/**
 * Props for RequireAnyPermission component
 */
export interface RequireAnyPermissionProps {
  permissions: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Render children if user has any of the specified permissions
 */
export function RequireAnyPermission({
  permissions,
  children,
  fallback = null
}: RequireAnyPermissionProps) {
  const { hasAnyPermission, isLoading } = useModuleAuth();
  
  if (isLoading) return null;
  
  return hasAnyPermission(permissions) ? <>{children}</> : <>{fallback}</>;
}

/**
 * Props for RequireAllPermissions component
 */
export interface RequireAllPermissionsProps {
  permissions: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Render children only if user has all specified permissions
 */
export function RequireAllPermissions({
  permissions,
  children,
  fallback = null
}: RequireAllPermissionsProps) {
  const { hasAllPermissions, isLoading } = useModuleAuth();
  
  if (isLoading) return null;
  
  return hasAllPermissions(permissions) ? <>{children}</> : <>{fallback}</>;
}

/**
 * HOC to wrap a component with permission check
 */
export function withPermission<P extends object>(
  WrappedComponent: ComponentType<P>,
  permission: string,
  FallbackComponent?: ComponentType<P>
) {
  return function PermissionWrapper(props: P) {
    const hasPermission = usePermission(permission);
    
    if (hasPermission) {
      return <WrappedComponent {...props} />;
    }
    
    if (FallbackComponent) {
      return <FallbackComponent {...props} />;
    }
    
    return null;
  };
}

/**
 * HOC to wrap a component with auth check
 */
export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  FallbackComponent?: ComponentType<P>
) {
  return function AuthWrapper(props: P) {
    const { isAuthenticated, isLoading } = useModuleAuth();
    
    if (isLoading) return null;
    
    if (isAuthenticated) {
      return <WrappedComponent {...props} />;
    }
    
    if (FallbackComponent) {
      return <FallbackComponent {...props} />;
    }
    
    return null;
  };
}

/**
 * Hook that returns a guard function for conditional rendering
 */
export function usePermissionGuard() {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = useModuleAuth();
  
  return {
    isLoading,
    guard: (permission: string, content: ReactNode, fallback: ReactNode = null): ReactNode => {
      return hasPermission(permission) ? content : fallback;
    },
    guardAny: (permissions: string[], content: ReactNode, fallback: ReactNode = null): ReactNode => {
      return hasAnyPermission(permissions) ? content : fallback;
    },
    guardAll: (permissions: string[], content: ReactNode, fallback: ReactNode = null): ReactNode => {
      return hasAllPermissions(permissions) ? content : fallback;
    },
  };
}
