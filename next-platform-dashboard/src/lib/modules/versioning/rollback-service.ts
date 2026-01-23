/**
 * Phase EM-41: Module Rollback Service
 * 
 * Handles safe rollback of module versions including:
 * - Creating rollback plans
 * - Validating rollback feasibility
 * - Executing rollbacks with data preservation
 * - Managing rollback points
 * - Data loss detection and warnings
 */

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { VersionService, ModuleVersion } from './version-service';
import { MigrationService, Migration, DataBackup } from './migration-service';

// =============================================================
// TYPES
// =============================================================

export interface RollbackPlan {
  currentVersion: ModuleVersion;
  targetVersion: ModuleVersion;
  migrations: Migration[];
  estimatedDuration: number;
  requiresMaintenance: boolean;
  canRollback: boolean;
  blockers: string[];
  warnings: string[];
  hasBackup: boolean;
  backupId: string | null;
}

export interface RollbackPoint {
  version: ModuleVersion;
  installedAt: string;
  hasBackup: boolean;
  backupId: string | null;
  canRollback: boolean;
  blockers: string[];
}

export interface RollbackResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  migrationsRolledBack: number;
  dataRestored: boolean;
  error?: string;
}

export interface RollbackOptions {
  createBackup?: boolean;
  force?: boolean;
  restoreData?: boolean;
}

// =============================================================
// ROLLBACK SERVICE CLASS
// =============================================================

export class RollbackService {
  private siteId: string;
  private moduleId: string;
  private moduleSourceId: string;
  private db: SupabaseClient | null = null;
  private versionService: VersionService;
  private migrationService: MigrationService;

  constructor(siteId: string, moduleId: string, moduleSourceId: string) {
    this.siteId = siteId;
    this.moduleId = moduleId;
    this.moduleSourceId = moduleSourceId;
    this.versionService = new VersionService();
    this.migrationService = new MigrationService(siteId, moduleId);
  }

  /**
   * Get database client
   */
  private async getClient(): Promise<SupabaseClient> {
    if (!this.db) {
      this.db = await createClient();
    }
    return this.db;
  }

  // =============================================================
  // ROLLBACK PLANNING
  // =============================================================

  /**
   * Create a rollback plan to a target version
   */
  async createRollbackPlan(targetVersionId: string): Promise<RollbackPlan> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    // Get current active version
    const currentVersion = await this.getCurrentActiveVersion();
    if (!currentVersion) {
      throw new Error('No active version found for this module');
    }

    // Get target version
    const targetVersion = await this.versionService.getVersion(targetVersionId);
    if (!targetVersion) {
      throw new Error('Target version not found');
    }

    // Check that target is older than current
    const comparison = VersionService.compareVersions(
      targetVersion.version,
      currentVersion.version
    );
    
    if (comparison >= 0) {
      throw new Error('Target version must be older than current version');
    }

    // Get migrations that need to be rolled back (in reverse order)
    const { data: migrations } = await client
      .from('module_migrations')
      .select('*')
      .eq('module_id', this.moduleId)
      .order('sequence', { ascending: false });

    // Filter to migrations between target and current
    const targetSequence = this.getVersionSequence(targetVersion.version);
    const currentSequence = this.getVersionSequence(currentVersion.version);
    
    const relevantMigrations = (migrations || []).filter((m: Migration) => {
      return m.sequence > targetSequence && m.sequence <= currentSequence;
    });

    // Check for blockers and warnings
    const blockers: string[] = [];
    const warnings: string[] = [];
    let requiresMaintenance = false;
    let estimatedDuration = 0;

    for (const migration of relevantMigrations) {
      estimatedDuration += migration.estimated_duration_seconds || 30;

      if (!migration.is_reversible) {
        blockers.push(`Migration to ${migration.to_version} is not reversible`);
      }

      if (!migration.down_sql) {
        blockers.push(`Migration to ${migration.to_version} has no rollback SQL`);
      }

      if (migration.requires_maintenance) {
        requiresMaintenance = true;
      }
    }

    // Check for potential data loss
    const dataWarnings = await this.checkDataLoss(relevantMigrations);
    warnings.push(...dataWarnings);

    // Check for backup availability
    const backup = await this.findBackupForVersion(targetVersion.version);

    return {
      currentVersion,
      targetVersion,
      migrations: relevantMigrations,
      estimatedDuration,
      requiresMaintenance,
      canRollback: blockers.length === 0,
      blockers,
      warnings,
      hasBackup: backup !== null,
      backupId: backup?.id || null
    };
  }

  /**
   * Get available rollback points
   */
  async getRollbackPoints(): Promise<RollbackPoint[]> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    // Get site module installation
    const { data: siteModule } = await client
      .from('site_module_installations')
      .select('id')
      .eq('site_id', this.siteId)
      .eq('module_id', this.moduleId)
      .single();

    if (!siteModule) return [];

    // Get version installations
    const { data: installations } = await client
      .from('site_module_versions')
      .select(`
        installed_at,
        status,
        version:module_versions(*)
      `)
      .eq('site_module_id', siteModule.id)
      .order('installed_at', { ascending: false });

    if (!installations) return [];

    // Get available backups
    const { data: backups } = await client
      .from('module_data_backups')
      .select('id, version')
      .eq('site_id', this.siteId)
      .eq('module_id', this.moduleId);

    const backupMap = new Map<string, string>();
    for (const backup of backups || []) {
      backupMap.set(backup.version, backup.id);
    }

    // Build rollback points
    const rollbackPoints: RollbackPoint[] = [];
    const currentVersion = await this.getCurrentActiveVersion();

    for (const inst of installations) {
      if (!inst.version) continue;

      // Skip the current active version
      if (currentVersion && inst.version.id === currentVersion.id) {
        continue;
      }

      // Check if rollback is possible
      let canRollback = true;
      const blockers: string[] = [];

      // Check migrations between this version and current
      if (currentVersion) {
        const plan = await this.createRollbackPlan(inst.version.id);
        canRollback = plan.canRollback;
        blockers.push(...plan.blockers);
      }

      rollbackPoints.push({
        version: inst.version,
        installedAt: inst.installed_at,
        hasBackup: backupMap.has(inst.version.version),
        backupId: backupMap.get(inst.version.version) || null,
        canRollback,
        blockers
      });
    }

    return rollbackPoints;
  }

  // =============================================================
  // ROLLBACK EXECUTION
  // =============================================================

  /**
   * Execute rollback to a target version
   */
  async executeRollback(
    targetVersionId: string,
    userId: string,
    options: RollbackOptions = {}
  ): Promise<RollbackResult> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    // Get rollback plan
    const plan = await this.createRollbackPlan(targetVersionId);

    // Check if rollback is possible
    if (!plan.canRollback && !options.force) {
      return {
        success: false,
        fromVersion: plan.currentVersion.version,
        toVersion: plan.targetVersion.version,
        migrationsRolledBack: 0,
        dataRestored: false,
        error: `Cannot rollback: ${plan.blockers.join(', ')}`
      };
    }

    // Create backup before rollback if requested
    let preRollbackBackupId: string | null = null;
    if (options.createBackup !== false) {
      try {
        preRollbackBackupId = await this.migrationService.createBackup(userId, 'pre_upgrade');
      } catch (err) {
        console.warn('[Rollback] Pre-rollback backup failed:', err);
      }
    }

    // Get site module ID
    const { data: siteModule } = await client
      .from('site_module_installations')
      .select('id')
      .eq('site_id', this.siteId)
      .eq('module_id', this.moduleId)
      .single();

    if (!siteModule) {
      return {
        success: false,
        fromVersion: plan.currentVersion.version,
        toVersion: plan.targetVersion.version,
        migrationsRolledBack: 0,
        dataRestored: false,
        error: 'Module not installed on this site'
      };
    }

    try {
      // Mark current version as pending rollback
      await client
        .from('site_module_versions')
        .update({ status: 'pending_rollback' })
        .eq('site_module_id', siteModule.id)
        .eq('status', 'active');

      // Run rollback migrations
      let migrationsRolledBack = 0;
      for (const migration of plan.migrations) {
        if (!migration.down_sql) continue;

        // Record migration run
        await client
          .from('module_migration_runs')
          .insert({
            site_id: this.siteId,
            module_id: this.moduleId,
            migration_id: migration.id,
            direction: 'down',
            status: 'running',
            backup_id: preRollbackBackupId,
            executed_by: userId
          });

        try {
          // Execute rollback SQL
          // Note: In production, this would use a proper migration runner
          const { error: execError } = await client.rpc('exec_raw_sql', {
            sql_query: migration.down_sql
          });

          if (execError) throw execError;

          // Update migration run as success
          await client
            .from('module_migration_runs')
            .update({
              status: 'success',
              completed_at: new Date().toISOString()
            })
            .eq('migration_id', migration.id)
            .eq('site_id', this.siteId)
            .eq('direction', 'down')
            .eq('status', 'running');

          migrationsRolledBack++;
        } catch (err) {
          // Update migration run as failed
          await client
            .from('module_migration_runs')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: err instanceof Error ? err.message : String(err)
            })
            .eq('migration_id', migration.id)
            .eq('site_id', this.siteId)
            .eq('direction', 'down')
            .eq('status', 'running');

          throw err;
        }
      }

      // Restore data from backup if available and requested
      let dataRestored = false;
      if (options.restoreData && plan.hasBackup && plan.backupId) {
        try {
          await this.migrationService.restoreFromBackup(plan.backupId);
          dataRestored = true;
        } catch (err) {
          console.warn('[Rollback] Data restoration failed:', err);
        }
      }

      // Update version statuses
      await client
        .from('site_module_versions')
        .update({
          status: 'rolled_back',
          deactivated_at: new Date().toISOString()
        })
        .eq('site_module_id', siteModule.id)
        .eq('status', 'pending_rollback');

      // Activate target version
      const { data: existingInstall } = await client
        .from('site_module_versions')
        .select('id')
        .eq('site_module_id', siteModule.id)
        .eq('version_id', targetVersionId)
        .single();

      if (existingInstall) {
        await client
          .from('site_module_versions')
          .update({
            status: 'active',
            activated_at: new Date().toISOString()
          })
          .eq('id', existingInstall.id);
      } else {
        await client
          .from('site_module_versions')
          .insert({
            site_module_id: siteModule.id,
            version_id: targetVersionId,
            status: 'active',
            activated_at: new Date().toISOString(),
            installed_by: userId
          });
      }

      return {
        success: true,
        fromVersion: plan.currentVersion.version,
        toVersion: plan.targetVersion.version,
        migrationsRolledBack,
        dataRestored
      };

    } catch (error) {
      // Mark as failed
      await client
        .from('site_module_versions')
        .update({ status: 'failed' })
        .eq('site_module_id', siteModule.id)
        .eq('status', 'pending_rollback');

      return {
        success: false,
        fromVersion: plan.currentVersion.version,
        toVersion: plan.targetVersion.version,
        migrationsRolledBack: 0,
        dataRestored: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Quick rollback to previous version
   */
  async rollbackToPrevious(
    userId: string,
    options: RollbackOptions = {}
  ): Promise<RollbackResult> {
    const rollbackPoints = await this.getRollbackPoints();
    
    if (rollbackPoints.length === 0) {
      throw new Error('No previous versions available for rollback');
    }

    // Find the most recent rollback point that can be rolled back to
    const target = rollbackPoints.find(rp => rp.canRollback);
    
    if (!target) {
      throw new Error('No valid rollback point available');
    }

    return this.executeRollback(target.version.id, userId, options);
  }

  // =============================================================
  // HELPER METHODS
  // =============================================================

  /**
   * Get current active version
   */
  private async getCurrentActiveVersion(): Promise<ModuleVersion | null> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    const { data: siteModule } = await client
      .from('site_module_installations')
      .select('id')
      .eq('site_id', this.siteId)
      .eq('module_id', this.moduleId)
      .single();

    if (!siteModule) return null;

    const { data } = await client
      .from('site_module_versions')
      .select(`
        version:module_versions(*)
      `)
      .eq('site_module_id', siteModule.id)
      .eq('status', 'active')
      .single();

    return data?.version || null;
  }

  /**
   * Find backup for a specific version
   */
  private async findBackupForVersion(version: string): Promise<DataBackup | null> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    const { data } = await client
      .from('module_data_backups')
      .select('*')
      .eq('site_id', this.siteId)
      .eq('module_id', this.moduleId)
      .eq('version', version)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data;
  }

  /**
   * Check for potential data loss in migrations
   */
  private async checkDataLoss(migrations: Migration[]): Promise<string[]> {
    const warnings: string[] = [];

    for (const migration of migrations) {
      if (!migration.down_sql) continue;

      const downSql = migration.down_sql.toLowerCase();

      if (downSql.includes('drop table')) {
        warnings.push(`Rolling back ${migration.to_version} will DROP tables - data will be lost`);
      }
      if (downSql.includes('drop column')) {
        warnings.push(`Rolling back ${migration.to_version} will DROP columns - data will be lost`);
      }
      if (downSql.includes('truncate')) {
        warnings.push(`Rolling back ${migration.to_version} will TRUNCATE data`);
      }
      if (downSql.includes('delete from') && !downSql.includes('where')) {
        warnings.push(`Rolling back ${migration.to_version} may delete data`);
      }
    }

    return warnings;
  }

  /**
   * Convert version string to sequence number for comparison
   */
  private getVersionSequence(version: string): number {
    const parsed = VersionService.parseVersion(version);
    if (!parsed) return 0;
    return parsed.major * 10000 + parsed.minor * 100 + parsed.patch;
  }
}

// =============================================================
// FACTORY FUNCTION
// =============================================================

export function createRollbackService(
  siteId: string,
  moduleId: string,
  moduleSourceId: string
): RollbackService {
  return new RollbackService(siteId, moduleId, moduleSourceId);
}
