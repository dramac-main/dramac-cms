'use client';

import React, { useEffect } from 'react';
import { useModuleAuth, useModuleAuthOptional } from './module-auth-context';

// ============================================================================
// Types
// ============================================================================

interface PermissionGuardProps {
  children: React.ReactNode;
  
  /** Single permission to check */
  permission?: string;
  /** Multiple permissions to check */
  permissions?: string[];
  /** If true, require all permissions; otherwise require any */
  requireAll?: boolean;
  
  /** Required role slug */
  role?: string;
  /** Any of these roles */
  roles?: string[];
  /** Minimum role level required */
  minRole?: string;
  /** Minimum hierarchy level required */
  minLevel?: number;
  
  /** Content to show if access denied */
  fallback?: React.ReactNode;
  /** Content to show while loading */
  loading?: React.ReactNode;
}

interface RequireAuthProps {
  children: React.ReactNode;
  /** Content to show if not authenticated */
  fallback?: React.ReactNode;
  /** URL to redirect to if not authenticated */
  redirectTo?: string;
}

// ============================================================================
// Components
// ============================================================================

/**
 * Guard component that only renders children if user has required permission(s)
 * 
 * @example
 * ```tsx
 * <PermissionGuard permission="contacts.create">
 *   <CreateButton />
 * </PermissionGuard>
 * 
 * <PermissionGuard permissions={['contacts.edit', 'contacts.delete']} requireAll>
 *   <BulkActions />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  role,
  roles,
  minRole,
  minLevel,
  fallback = null,
  loading = null
}: PermissionGuardProps) {
  const auth = useModuleAuth();
  
  // Show loading state
  if (auth.isLoading) {
    return <>{loading}</>;
  }
  
  // Check single role requirement
  if (role && !auth.hasRole(role)) {
    return <>{fallback}</>;
  }
  
  // Check multiple roles requirement (any)
  if (roles?.length && !auth.hasAnyRole(roles)) {
    return <>{fallback}</>;
  }
  
  // Check minimum role requirement
  if (minRole && !auth.isAtLeastRole(minRole)) {
    return <>{fallback}</>;
  }
  
  // Check minimum level requirement
  if (minLevel !== undefined && !auth.isAtLeastLevel(minLevel)) {
    return <>{fallback}</>;
  }
  
  // Check single permission requirement
  if (permission && !auth.hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  // Check multiple permissions requirement
  if (permissions?.length) {
    const hasAccess = requireAll
      ? auth.hasAllPermissions(permissions)
      : auth.hasAnyPermission(permissions);
    
    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }
  
  return <>{children}</>;
}

/**
 * Guard that shows children only to authenticated users
 */
export function RequireAuth({ 
  children, 
  fallback,
  redirectTo 
}: RequireAuthProps) {
  const auth = useModuleAuth();
  
  useEffect(() => {
    if (!auth.isLoading && !auth.user && redirectTo) {
      window.location.href = redirectTo;
    }
  }, [auth.isLoading, auth.user, redirectTo]);
  
  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  
  if (!auth.user) {
    if (redirectTo) {
      // Redirect is handled in useEffect
      return null;
    }
    return <>{fallback || <DefaultLoginPrompt />}</>;
  }
  
  return <>{children}</>;
}

/**
 * Guard that shows children only to guests (unauthenticated users)
 */
export function RequireGuest({ 
  children, 
  fallback = null,
  redirectTo 
}: RequireAuthProps) {
  const auth = useModuleAuth();
  
  useEffect(() => {
    if (!auth.isLoading && auth.user && redirectTo) {
      window.location.href = redirectTo;
    }
  }, [auth.isLoading, auth.user, redirectTo]);
  
  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  
  if (auth.user) {
    if (redirectTo) {
      // Redirect is handled in useEffect
      return null;
    }
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Default login prompt shown when authentication is required
 */
function DefaultLoginPrompt() {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="rounded-full bg-muted p-4">
        <svg 
          className="w-8 h-8 text-muted-foreground" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold">Authentication Required</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Please log in to access this module.
      </p>
    </div>
  );
}

/**
 * Access denied component
 */
export function AccessDenied({ 
  message = 'You do not have permission to access this content.' 
}: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="rounded-full bg-destructive/10 p-4">
        <svg 
          className="w-8 h-8 text-destructive" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" 
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold">Access Denied</h2>
      <p className="text-muted-foreground text-center max-w-md">
        {message}
      </p>
    </div>
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for checking a single permission
 * 
 * @example
 * ```tsx
 * const canCreate = usePermission('contacts.create');
 * if (canCreate) {
 *   // show create button
 * }
 * ```
 */
export function usePermission(permission: string): boolean {
  const auth = useModuleAuth();
  return auth.hasPermission(permission);
}

/**
 * Hook for checking multiple permissions
 */
export function usePermissions(
  permissions: string[], 
  requireAll = false
): boolean {
  const auth = useModuleAuth();
  return requireAll 
    ? auth.hasAllPermissions(permissions)
    : auth.hasAnyPermission(permissions);
}

/**
 * Hook for checking a role
 */
export function useRole(roleSlug: string): boolean {
  const auth = useModuleAuth();
  return auth.hasRole(roleSlug);
}

/**
 * Hook for checking minimum role level
 */
export function useMinRole(roleSlug: string): boolean {
  const auth = useModuleAuth();
  return auth.isAtLeastRole(roleSlug);
}

/**
 * Hook for checking authentication status
 */
export function useIsAuthenticated(): boolean {
  const auth = useModuleAuthOptional();
  return auth?.isAuthenticated ?? false;
}

// ============================================================================
// Higher-Order Components
// ============================================================================

/**
 * HOC that wraps a component with permission protection
 * 
 * @example
 * ```tsx
 * const ProtectedComponent = withPermission(
 *   MyComponent, 
 *   'contacts.manage',
 *   AccessDeniedFallback
 * );
 * ```
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: string,
  Fallback?: React.ComponentType
): React.FC<P> {
  const WithPermissionComponent: React.FC<P> = (props) => {
    const hasPermission = usePermission(permission);
    
    if (!hasPermission) {
      return Fallback ? <Fallback /> : null;
    }
    
    return <WrappedComponent {...props} />;
  };
  
  WithPermissionComponent.displayName = 
    `withPermission(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return WithPermissionComponent;
}

/**
 * HOC that wraps a component with role protection
 */
export function withRole<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  roleSlug: string,
  Fallback?: React.ComponentType
): React.FC<P> {
  const WithRoleComponent: React.FC<P> = (props) => {
    const hasRole = useRole(roleSlug);
    
    if (!hasRole) {
      return Fallback ? <Fallback /> : null;
    }
    
    return <WrappedComponent {...props} />;
  };
  
  WithRoleComponent.displayName = 
    `withRole(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return WithRoleComponent;
}

/**
 * HOC that wraps a component with authentication protection
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  Fallback?: React.ComponentType
): React.FC<P> {
  const WithAuthComponent: React.FC<P> = (props) => {
    const auth = useModuleAuth();
    
    if (auth.isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }
    
    if (!auth.user) {
      return Fallback ? <Fallback /> : <DefaultLoginPrompt />;
    }
    
    return <WrappedComponent {...props} />;
  };
  
  WithAuthComponent.displayName = 
    `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return WithAuthComponent;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a permission check function for a specific category
 * 
 * @example
 * ```tsx
 * const contactsPermission = createPermissionChecker('contacts');
 * contactsPermission('view'); // 'contacts.view'
 * ```
 */
export function createPermissionChecker(category: string) {
  return (action: string) => `${category}.${action}`;
}
