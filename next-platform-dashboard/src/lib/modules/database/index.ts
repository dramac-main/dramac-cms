/**
 * Module Database Exports
 * 
 * Phase EM-11: Database Per Module (Multi-Tenant Data Isolation)
 * Phase EM-40: Multi-Tenant Architecture
 * 
 * Central exports for module database functionality including:
 * - Provisioning (creating/removing module databases)
 * - Data access (CRUD operations for module tables)
 * - Tenant-aware data access (site/agency isolation)
 * - Agency-level data access (admin cross-site access)
 * - Cross-module data access (controlled inter-module queries)
 * - Data export/import (tenant-isolated data transfer)
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

// Tenant-Aware Data Access (Phase EM-40)
export {
  createModuleDataAccess,
  createDataAccessFromRequest,
  type ModuleDataOptions,
  type DataResult,
  type PaginationOptions,
  type PaginatedResult,
  type FilterOperation,
  type Filter,
  type ModuleDataAccess
} from './tenant-data-access';

// Agency-Level Data Access (Phase EM-40)
export {
  createAgencyDataAccess,
  type SiteInfo,
  type SiteStats,
  type GroupedBySite,
  type AgencyDataAccess
} from './agency-data-access';

// Cross-Module Data Access (Phase EM-40)
export {
  createCrossModuleAccess,
  CrossModuleAccessError,
  getAllPermissions,
  registerPermission,
  type CrossModulePermission,
  type CrossModuleQueryOptions,
  type CrossModuleAccess
} from './cross-module-access';

// Data Export/Import (Phase EM-40)
export {
  exportModuleData,
  exportModuleDataAsJson,
  importModuleData,
  importModuleDataFromJson,
  cloneModuleData,
  validateImportData,
  getExportMetadata,
  type ExportOptions,
  type ImportOptions,
  type ImportResult,
  type ImportError,
  type CloneResult
} from './tenant-data-export';
