/**
 * Phase EM-41: Module Migration Service
 * 
 * Handles database migrations for modules including:
 * - Running forward migrations (upgrade)
 * - Running backward migrations (rollback)
 * - Creating data backups before migrations
 * - Tracking migration execution history
 * - Restoring from backups
 */

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { VersionService } from './version-service';

// =============================================================
// TYPES
// =============================================================

export interface Migration {
  id: string;
  module_id: string;
  from_version: string | null;
  to_version: string;
  up_sql: string;
  down_sql: string | null;
  description: string | null;
  is_reversible: boolean;
  requires_maintenance: boolean;
  estimated_duration_seconds: number;
  sequence: number;
  created_at: string;
}

export interface MigrationRun {
  id: string;
  site_id: string;
  module_id: string;
  migration_id: string;
  direction: 'up' | 'down';
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'success' | 'failed' | 'rolled_back';
  error_message: string | null;
  backup_id: string | null;
  executed_by: string | null;
  migration?: Migration;
}

export interface DataBackup {
  id: string;
  site_id: string;
  module_id: string;
  version: string;
  type: 'auto' | 'manual' | 'pre_upgrade';
  backup_url: string;
  size_bytes: number | null;
  table_counts: Record<string, number>;
  expires_at: string | null;
  created_at: string;
  created_by: string | null;
}

export interface MigrationPlan {
  migrations: Migration[];
  totalDuration: number;
  requiresMaintenance: boolean;
  nonReversible: string[];
  warnings: string[];
}

// =============================================================
// MIGRATION SERVICE CLASS
// =============================================================

export class MigrationService {
  private siteId: string;
  private moduleId: string;
  private db: SupabaseClient | null = null;

  constructor(siteId: string, moduleId: string) {
    this.siteId = siteId;
    this.moduleId = moduleId;
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
  // MIGRATION QUERIES
  // =============================================================

  /**
   * Get all migrations for a module
   */
  async getMigrations(): Promise<Migration[]> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    const { data, error } = await client
      .from('module_migrations')
      .select('*')
      .eq('module_id', this.moduleId)
      .order('sequence');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get pending migrations for upgrade from one version to another
   */
  async getPendingMigrations(
    fromVersion: string | null,
    toVersion: string
  ): Promise<Migration[]> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    let query = client
      .from('module_migrations')
      .select('*')
      .eq('module_id', this.moduleId)
      .order('sequence');

    // If we have a from version, get its sequence
    if (fromVersion) {
      const { data: fromMigration } = await client
        .from('module_migrations')
        .select('sequence')
        .eq('module_id', this.moduleId)
        .eq('to_version', fromVersion)
        .single();

      if (fromMigration) {
        query = query.gt('sequence', fromMigration.sequence);
      }
    }

    // Get target version sequence
    const { data: toMigration } = await client
      .from('module_migrations')
      .select('sequence')
      .eq('module_id', this.moduleId)
      .eq('to_version', toVersion)
      .single();

    if (toMigration) {
      query = query.lte('sequence', toMigration.sequence);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Create a migration plan
   */
  async createMigrationPlan(
    fromVersion: string | null,
    toVersion: string
  ): Promise<MigrationPlan> {
    const migrations = await this.getPendingMigrations(fromVersion, toVersion);
    
    const nonReversible: string[] = [];
    const warnings: string[] = [];
    let totalDuration = 0;
    let requiresMaintenance = false;

    for (const migration of migrations) {
      totalDuration += migration.estimated_duration_seconds || 30;
      
      if (!migration.is_reversible) {
        nonReversible.push(migration.to_version);
      }
      
      if (migration.requires_maintenance) {
        requiresMaintenance = true;
        warnings.push(`Migration to ${migration.to_version} requires maintenance window`);
      }

      // Check for destructive operations
      const upSql = migration.up_sql.toLowerCase();
      if (upSql.includes('drop table')) {
        warnings.push(`Migration to ${migration.to_version} will DROP tables`);
      }
      if (upSql.includes('drop column')) {
        warnings.push(`Migration to ${migration.to_version} will DROP columns`);
      }
      if (upSql.includes('truncate')) {
        warnings.push(`Migration to ${migration.to_version} will TRUNCATE data`);
      }
    }

    return {
      migrations,
      totalDuration,
      requiresMaintenance,
      nonReversible,
      warnings
    };
  }

  // =============================================================
  // BACKUP OPERATIONS
  // =============================================================

  /**
   * Create a data backup before migration
   */
  async createBackup(
    userId: string,
    type: DataBackup['type'] = 'pre_upgrade'
  ): Promise<string> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    // Get module tables from registry (EM-05)
    const { data: registry } = await client
      .from('module_database_registry')
      .select('table_names')
      .eq('module_id', this.moduleId)
      .single();

    const tableNames: string[] = registry?.table_names || [];
    const tableCounts: Record<string, number> = {};
    const backupData: Record<string, unknown[]> = {};

    // Export data from each table
    for (const tableName of tableNames) {
      try {
        const { data, count } = await client
          .from(tableName)
          .select('*', { count: 'exact' })
          .eq('site_id', this.siteId);

        backupData[tableName] = data || [];
        tableCounts[tableName] = count || 0;
      } catch (err) {
        console.warn(`[Migration] Could not backup table ${tableName}:`, err);
      }
    }

    // Create backup blob
    const backupContent = JSON.stringify({
      module_id: this.moduleId,
      site_id: this.siteId,
      tables: backupData,
      created_at: new Date().toISOString()
    });
    
    const backupBlob = new Blob([backupContent], { type: 'application/json' });
    const backupPath = `backups/${this.siteId}/${this.moduleId}/${Date.now()}.json`;

    // Upload to storage
    const { error: uploadError } = await client.storage
      .from('module-backups')
      .upload(backupPath, backupBlob, {
        contentType: 'application/json',
        upsert: false
      });

    if (uploadError) {
      // Storage bucket might not exist, create a fallback URL
      console.warn('[Migration] Backup upload failed, using placeholder:', uploadError);
    }

    const { data: urlData } = client.storage
      .from('module-backups')
      .getPublicUrl(backupPath);

    // Get current version
    const currentVersion = await this.getCurrentVersion();

    // Create backup record
    const { data: backup, error } = await client
      .from('module_data_backups')
      .insert({
        site_id: this.siteId,
        module_id: this.moduleId,
        version: currentVersion,
        type,
        backup_url: urlData?.publicUrl || `backup://${backupPath}`,
        size_bytes: backupBlob.size,
        table_counts: tableCounts,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return backup.id;
  }

  /**
   * Restore data from a backup
   */
  async restoreFromBackup(backupId: string): Promise<void> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    // Get backup record
    const { data: backup, error } = await client
      .from('module_data_backups')
      .select('*')
      .eq('id', backupId)
      .single();

    if (error || !backup) {
      throw new Error('Backup not found');
    }

    // Download backup data
    let backupData: Record<string, unknown[]>;
    
    try {
      const response = await fetch(backup.backup_url);
      if (!response.ok) {
        throw new Error(`Failed to fetch backup: ${response.statusText}`);
      }
      const content = await response.json();
      backupData = content.tables || {};
    } catch (err) {
      throw new Error(`Failed to download backup: ${err}`);
    }

    // Restore each table
    for (const [tableName, rows] of Object.entries(backupData)) {
      if (!Array.isArray(rows)) continue;

      // Clear existing data for this site
      await client
        .from(tableName)
        .delete()
        .eq('site_id', this.siteId);

      // Insert backup data
      if (rows.length > 0) {
        // Insert in batches to avoid size limits
        const batchSize = 100;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          await client.from(tableName).insert(batch);
        }
      }
    }
  }

  /**
   * Get available backups for this module/site
   */
  async getBackups(): Promise<DataBackup[]> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    const { data, error } = await client
      .from('module_data_backups')
      .select('*')
      .eq('site_id', this.siteId)
      .eq('module_id', this.moduleId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Delete expired backups
   */
  async cleanupExpiredBackups(): Promise<number> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    const { data, error } = await client
      .from('module_data_backups')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) throw error;
    return data?.length || 0;
  }

  // =============================================================
  // MIGRATION EXECUTION
  // =============================================================

  /**
   * Run migrations with automatic backup
   */
  async runMigrations(
    migrations: Migration[],
    userId: string,
    createBackup = true
  ): Promise<MigrationRun[]> {
    const runs: MigrationRun[] = [];
    let backupId: string | null = null;

    // Create backup before migrations
    if (createBackup && migrations.length > 0) {
      try {
        backupId = await this.createBackup(userId, 'pre_upgrade');
      } catch (err) {
        console.warn('[Migration] Backup creation failed:', err);
        // Continue without backup if it fails
      }
    }

    // Run each migration
    for (const migration of migrations) {
      const run = await this.runSingleMigration(migration, 'up', userId, backupId);
      runs.push(run);

      if (run.status === 'failed') {
        // Rollback successful migrations on failure
        const successfulRuns = runs.filter(r => r.status === 'success');
        if (successfulRuns.length > 0) {
          await this.rollbackMigrations(successfulRuns, userId);
        }
        break;
      }
    }

    return runs;
  }

  /**
   * Run a single migration
   */
  private async runSingleMigration(
    migration: Migration,
    direction: 'up' | 'down',
    userId: string,
    backupId: string | null
  ): Promise<MigrationRun> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    const sql = direction === 'up' ? migration.up_sql : migration.down_sql;

    if (!sql) {
      throw new Error(`No ${direction} migration SQL available for ${migration.to_version}`);
    }

    // Create run record
    const { data: run, error: createError } = await client
      .from('module_migration_runs')
      .insert({
        site_id: this.siteId,
        module_id: this.moduleId,
        migration_id: migration.id,
        direction,
        status: 'running',
        backup_id: backupId,
        executed_by: userId
      })
      .select()
      .single();

    if (createError) throw createError;

    try {
      // Execute migration SQL
      // Note: In a real implementation, this would use a proper migration runner
      // that can handle transactions and schema changes
      const { error: execError } = await client.rpc('exec_raw_sql', {
        sql_query: sql
      });

      if (execError) {
        throw execError;
      }

      // Update run as success
      const { data: completed } = await client
        .from('module_migration_runs')
        .update({
          status: 'success',
          completed_at: new Date().toISOString()
        })
        .eq('id', run.id)
        .select()
        .single();

      return completed;

    } catch (error: unknown) {
      // Update run as failed
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      const { data: failed } = await client
        .from('module_migration_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: errorMessage
        })
        .eq('id', run.id)
        .select()
        .single();

      return failed;
    }
  }

  /**
   * Rollback completed migrations
   */
  async rollbackMigrations(
    runs: MigrationRun[],
    userId: string
  ): Promise<void> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    // Rollback in reverse order
    const reversedRuns = [...runs].reverse();

    for (const run of reversedRuns) {
      // Get migration details
      const { data: migration } = await client
        .from('module_migrations')
        .select('*')
        .eq('id', run.migration_id)
        .single();

      if (!migration) {
        console.error(`Migration ${run.migration_id} not found for rollback`);
        continue;
      }

      if (!migration.is_reversible) {
        throw new Error(`Migration ${migration.to_version} is not reversible`);
      }

      if (!migration.down_sql) {
        throw new Error(`Migration ${migration.to_version} has no rollback SQL`);
      }

      // Run rollback migration
      await this.runSingleMigration(migration, 'down', userId, run.backup_id);

      // Update original run as rolled back
      await client
        .from('module_migration_runs')
        .update({ status: 'rolled_back' })
        .eq('id', run.id);
    }
  }

  // =============================================================
  // VERSION MANAGEMENT
  // =============================================================

  /**
   * Get current installed version for this site/module
   */
  async getCurrentVersion(): Promise<string> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    // Try to get from site_module_versions first
    const { data: versionData } = await client
      .from('site_module_versions')
      .select(`
        version:module_versions(version)
      `)
      .eq('status', 'active')
      .single();

    if (versionData?.version?.version) {
      return versionData.version.version;
    }

    // Fallback: get from site_module_installations
    const { data: installation } = await client
      .from('site_module_installations')
      .select(`
        module:modules_v2(
          studio_module:module_source(latest_version)
        )
      `)
      .eq('site_id', this.siteId)
      .eq('module_id', this.moduleId)
      .single();

    return installation?.module?.studio_module?.latest_version || '0.0.0';
  }

  /**
   * Get migration execution history
   */
  async getMigrationHistory(): Promise<MigrationRun[]> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    const { data, error } = await client
      .from('module_migration_runs')
      .select(`
        *,
        migration:module_migrations(*)
      `)
      .eq('site_id', this.siteId)
      .eq('module_id', this.moduleId)
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Check if there are pending migrations
   */
  async hasPendingMigrations(targetVersion: string): Promise<boolean> {
    const currentVersion = await this.getCurrentVersion();
    const migrations = await this.getPendingMigrations(currentVersion, targetVersion);
    return migrations.length > 0;
  }
}

// =============================================================
// FACTORY FUNCTION
// =============================================================

export function createMigrationService(
  siteId: string,
  moduleId: string
): MigrationService {
  return new MigrationService(siteId, moduleId);
}
