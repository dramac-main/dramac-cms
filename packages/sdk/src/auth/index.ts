/**
 * @dramac/sdk - Auth Module Index
 * 
 * Export all auth utilities
 */

export {
  ModuleAuthProvider,
  useModuleAuth,
  usePermission,
  type ModuleAuthContextValue,
  type ModuleAuthProviderProps,
} from './module-auth-context';

export {
  PermissionGuard,
  RequireAuth,
  RequireRole,
  RequireAnyPermission,
  RequireAllPermissions,
  withPermission,
  withAuth,
  usePermissionGuard,
  type PermissionGuardProps,
  type RequireAuthProps,
  type RequireRoleProps,
  type RequireAnyPermissionProps,
  type RequireAllPermissionsProps,
} from './permission-guard';
