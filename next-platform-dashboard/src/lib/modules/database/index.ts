/**
 * Module Database Exports
 * 
 * Phase EM-11: Database Per Module (Multi-Tenant Data Isolation)
 * 
 * Central exports for module database functionality including:
 * - Provisioning (creating/removing module databases)
 * - Data access (CRUD operations for module tables)
 */

// Provisioner
export {
  provisionModuleDatabase,
  deprovisionModuleDatabase,
  isModuleDatabaseProvisioned,
  getModuleDatabaseInfo,
  validateTableSchema,
  validateModuleResources,
  type ProvisionResult,
  type DeprovisionResult
} from './module-database-provisioner';

// Data Access
export {
  createModuleDataClient,
  createModuleAdminClient,
  type ModuleDataContext,
  type QueryOptions,
  type WhereClause,
  type FilterOperators,
  type ModuleDataClient,
  type ModuleAdminClient
} from './module-data-access';
