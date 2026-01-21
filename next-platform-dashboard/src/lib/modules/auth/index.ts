/**
 * Module Authentication & Authorization
 * 
 * Provides comprehensive RBAC (Role-Based Access Control) for modules including:
 * - Authentication context provider
 * - Permission-based guards and HOCs
 * - Role management service
 * - Invitation system
 * 
 * @example
 * ```tsx
 * // Wrap your module with the auth provider
 * <ModuleAuthProvider moduleId={moduleId} siteId={siteId}>
 *   <MyModuleContent />
 * </ModuleAuthProvider>
 * 
 * // Use permission guards in your components
 * <PermissionGuard permission="contacts.create">
 *   <CreateButton />
 * </PermissionGuard>
 * 
 * // Or use the hook
 * const { hasPermission } = useModuleAuth();
 * if (hasPermission('contacts.delete')) {
 *   // show delete button
 * }
 * ```
 */

// Context & Provider
export {
  ModuleAuthProvider,
  useModuleAuth,
  useModuleAuthOptional,
  getModuleRolesServer,
  checkPermissionServer,
  type ModuleRole,
  type ModuleAuthState,
} from './module-auth-context';

// Guards & HOCs
export {
  PermissionGuard,
  RequireAuth,
  RequireGuest,
  AccessDenied,
  usePermission,
  usePermissions,
  useRole,
  useMinRole,
  useIsAuthenticated,
  withPermission,
  withRole,
  withAuth,
  createPermissionChecker,
} from './permission-guard';

// Role Management
export {
  createModuleRole,
  getModuleRole,
  getModuleRoles,
  updateModuleRole,
  deleteModuleRole,
  assignRole,
  assignRoles,
  removeRole,
  removeAllUserRoles,
  deactivateRole,
  reactivateRole,
  getModuleUsers,
  getUserModuleRoles,
  userHasRole,
  setupDefaultRoles,
  assignDefaultRole,
  getUserPermissions,
  userHasPermission,
  cloneRoles,
  type CreateRoleInput,
  type UpdateRoleInput,
  type AssignRoleInput,
  type ModuleRoleRecord,
  type ModuleUserRoleRecord,
  type ModuleUserWithRoles,
  type RoleDefinition,
} from './role-management';

// Invitation Service
export {
  createInvitation,
  getInvitation,
  getInvitationByToken,
  listInvitations,
  listPendingInvitationsForEmail,
  acceptInvitation,
  revokeInvitation,
  resendInvitation,
  deleteInvitation,
  createBulkInvitations,
  cleanupExpiredInvitations,
  getInvitationAcceptUrl,
  prepareInvitationEmail,
  type CreateInvitationInput,
  type ModuleInvitationRecord,
  type InvitationWithRole,
  type AcceptedInvitation,
  type InvitationEmailData,
} from './invitation-service';

// Session Management
export {
  createModuleSession,
  getSessionByToken,
  validateSession,
  touchSession,
  extendSession,
  deactivateSession,
  deactivateUserSessions,
  deleteSession,
  getUserSessions,
  getActiveSessionCount,
  cleanupExpiredSessions,
  createEmbedSession,
  validateEmbedSession,
  createApiSession,
  validateApiSession,
  type ModuleSessionRecord,
  type CreateSessionInput,
  type SessionValidationResult,
} from './session-management';

// Permission Definitions & Templates
export {
  generateCrudPermissions,
  generateExtendedPermissions,
  generateAdminPermissions,
  generateStandardRoles,
  getModulePermissionSet,
  CRM_PERMISSIONS,
  CRM_DEFAULT_ROLES,
  CRM_MODULE_PERMISSIONS,
  BOOKING_PERMISSIONS,
  BOOKING_DEFAULT_ROLES,
  BOOKING_MODULE_PERMISSIONS,
  ECOMMERCE_PERMISSIONS,
  ECOMMERCE_DEFAULT_ROLES,
  ECOMMERCE_MODULE_PERMISSIONS,
  MODULE_PERMISSION_REGISTRY,
  type PermissionDefinition,
  type ModulePermissionSet,
} from './permission-definitions';
