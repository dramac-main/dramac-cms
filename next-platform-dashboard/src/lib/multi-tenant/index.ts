/**
 * Multi-Tenant Architecture Module
 * 
 * Provides complete data isolation across all modules ensuring:
 * - Agency → Client → Site hierarchy respected
 * - Row-Level Security (RLS) enforced everywhere
 * - Module data never leaks between tenants
 * - Cross-module data access controlled
 * 
 * @module multi-tenant
 */

// Server-side tenant context
export {
  getTenantContext,
  getFullTenantContext,
  setDatabaseContext,
  createTenantClient,
  verifyUserSiteAccess,
  verifyUserIsAdmin,
  getAccessibleSites,
  setCurrentSite,
  clearCurrentSite,
  validateTenantContext,
  type TenantContext,
  type FullTenantContext,
  type ContextValidation
} from './tenant-context';

// API middleware
export {
  tenantMiddleware,
  getTenantFromRequest,
  requireTenantContext,
  TenantContextError,
  handleTenantError,
  requireAdminRole,
  requireOwnerRole,
  hasRole,
  type RequestTenantContext,
  type ValidatedTenantContext
} from './middleware';

// Client-side hooks (re-exported for convenience)
// Note: These should be imported from './hooks' in client components
export type {
  Site,
  TenantContextValue,
  TenantProviderProps
} from './hooks';
