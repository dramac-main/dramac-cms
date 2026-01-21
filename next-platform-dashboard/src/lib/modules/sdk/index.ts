/**
 * Module SDK Exports
 * 
 * Phase EM-11: Database Per Module (Multi-Tenant Data Isolation)
 * 
 * This module exports the SDK interfaces that module developers use
 * to interact with their module's resources.
 */

// Database SDK
export {
  ModuleDatabaseSDK,
  createDatabaseSDK,
  type ModuleDataContext,
  type WhereClause,
  type FilterOperators,
  type FindOptions,
  type BatchOperation
} from './database-sdk';
