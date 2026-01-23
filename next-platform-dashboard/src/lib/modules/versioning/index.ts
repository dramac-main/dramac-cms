/**
 * Phase EM-41: Module Versioning & Rollback
 * 
 * Central export for all versioning services.
 */

// Version Service
export {
  VersionService,
  getVersionService,
  parseVersion,
  compareVersions,
  satisfiesConstraint,
  incrementVersion,
  type ModuleVersion,
  type ParsedVersion,
  type VersionConstraint,
  type CreateVersionOptions,
  type UpgradePath
} from './version-service';

// Migration Service
export {
  MigrationService,
  createMigrationService,
  type Migration,
  type MigrationRun,
  type DataBackup,
  type MigrationPlan
} from './migration-service';

// Rollback Service
export {
  RollbackService,
  createRollbackService,
  type RollbackPlan,
  type RollbackPoint,
  type RollbackResult,
  type RollbackOptions
} from './rollback-service';
