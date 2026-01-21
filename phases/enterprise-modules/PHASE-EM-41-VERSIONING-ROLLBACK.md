# Phase EM-41: Module Versioning & Rollback

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 12-15 hours
> **Prerequisites**: EM-01, EM-05, EM-11
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Implement **version control and rollback capabilities** for modules:
1. Semantic versioning enforcement
2. Version history tracking
3. Safe rollback mechanism
4. Database migration versioning
5. Breaking change detection

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                    VERSION MANAGEMENT                             │
├───────────────┬────────────────┬──────────────────────────────────┤
│   VERSIONING  │   MIGRATIONS   │      ROLLBACK                    │
├───────────────┼────────────────┼──────────────────────────────────┤
│ Semver Parse  │ Forward Migr   │ State Snapshot                   │
│ Version Track │ Rollback Migr  │ Asset Restore                    │
│ Changelog     │ Schema Diff    │ Data Preservation                │
│ Breaking Chk  │ Auto-backup    │ Dependency Check                 │
└───────────────┴────────────────┴──────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Database Schema (1 hour)

```sql
-- migrations/em-41-versioning-schema.sql

-- Module Versions
CREATE TABLE module_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  
  -- Version info
  version TEXT NOT NULL,               -- "1.2.3"
  version_major INTEGER NOT NULL,
  version_minor INTEGER NOT NULL,
  version_patch INTEGER NOT NULL,
  prerelease TEXT,                     -- "beta.1", "rc.2"
  
  -- Content
  bundle_url TEXT NOT NULL,            -- URL to compiled bundle
  bundle_hash TEXT NOT NULL,           -- SHA256 of bundle
  source_url TEXT,                     -- URL to source (for debugging)
  
  -- Metadata
  changelog TEXT,
  release_notes TEXT,
  
  -- Compatibility
  min_platform_version TEXT,           -- Minimum Dramac version
  breaking_changes BOOLEAN DEFAULT false,
  breaking_description TEXT,
  
  -- Dependencies
  dependencies JSONB DEFAULT '{}',     -- {module_id: version_constraint}
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'published', 'deprecated', 'yanked'
  )),
  
  -- Stats
  download_count INTEGER DEFAULT 0,
  active_installs INTEGER DEFAULT 0,
  
  -- Publishing
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(module_id, version)
);

-- Migration History
CREATE TABLE module_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  
  -- Version range
  from_version TEXT,                   -- null for initial
  to_version TEXT NOT NULL,
  
  -- Migration content
  up_sql TEXT NOT NULL,                -- Forward migration
  down_sql TEXT,                       -- Rollback migration (optional)
  
  -- Metadata
  description TEXT,
  is_reversible BOOLEAN DEFAULT true,
  requires_maintenance BOOLEAN DEFAULT false,  -- Needs downtime
  estimated_duration_seconds INTEGER,
  
  -- Execution order
  sequence INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(module_id, sequence)
);

-- Site Module Version Installations
CREATE TABLE site_module_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_module_id UUID NOT NULL REFERENCES site_modules(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES module_versions(id) ON DELETE RESTRICT,
  
  -- Status
  status TEXT DEFAULT 'installing' CHECK (status IN (
    'installing', 'active', 'pending_rollback', 'rolled_back', 'failed'
  )),
  
  -- Timestamps
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  
  installed_by UUID REFERENCES users(id),
  
  UNIQUE(site_module_id, version_id)
);

-- Migration Execution Log
CREATE TABLE module_migration_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  module_id UUID NOT NULL,
  migration_id UUID NOT NULL REFERENCES module_migrations(id),
  
  -- Direction
  direction TEXT NOT NULL CHECK (direction IN ('up', 'down')),
  
  -- Execution
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Result
  status TEXT DEFAULT 'running' CHECK (status IN (
    'running', 'success', 'failed', 'rolled_back'
  )),
  error_message TEXT,
  
  -- Backup reference
  backup_id UUID REFERENCES module_data_backups(id),
  
  executed_by UUID REFERENCES users(id)
);

-- Data Backups (for rollback)
CREATE TABLE module_data_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  module_id UUID NOT NULL,
  version TEXT NOT NULL,
  
  -- Backup type
  type TEXT DEFAULT 'auto' CHECK (type IN ('auto', 'manual', 'pre_upgrade')),
  
  -- Storage
  backup_url TEXT NOT NULL,           -- S3/storage URL
  size_bytes BIGINT,
  
  -- Metadata
  table_counts JSONB DEFAULT '{}',    -- {table_name: row_count}
  
  -- Retention
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_module_versions_module ON module_versions(module_id);
CREATE INDEX idx_module_versions_status ON module_versions(module_id, status);
CREATE INDEX idx_site_module_versions_active ON site_module_versions(site_module_id, status)
  WHERE status = 'active';
CREATE INDEX idx_migration_runs_site ON module_migration_runs(site_id, module_id);

-- Get current active version for a site module
CREATE OR REPLACE FUNCTION get_active_module_version(p_site_module_id UUID)
RETURNS UUID AS $$
  SELECT version_id 
  FROM site_module_versions 
  WHERE site_module_id = p_site_module_id 
    AND status = 'active'
  LIMIT 1;
$$ LANGUAGE SQL STABLE;
```

---

### Task 2: Version Service (3 hours)

```typescript
// src/lib/modules/versioning/version-service.ts

import { createClient } from '@supabase/supabase-js';
import semver from 'semver';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ModuleVersion {
  id: string;
  module_id: string;
  version: string;
  version_major: number;
  version_minor: number;
  version_patch: number;
  prerelease: string | null;
  bundle_url: string;
  bundle_hash: string;
  changelog: string | null;
  release_notes: string | null;
  min_platform_version: string | null;
  breaking_changes: boolean;
  breaking_description: string | null;
  dependencies: Record<string, string>;
  status: 'draft' | 'published' | 'deprecated' | 'yanked';
  download_count: number;
  active_installs: number;
  published_at: string | null;
  created_at: string;
}

export interface VersionConstraint {
  moduleId: string;
  constraint: string; // "^1.0.0", ">=2.0.0 <3.0.0", etc.
}

export class VersionService {
  /**
   * Parse and validate semver
   */
  static parseVersion(version: string): {
    major: number;
    minor: number;
    patch: number;
    prerelease: string | null;
  } | null {
    const parsed = semver.parse(version);
    if (!parsed) return null;

    return {
      major: parsed.major,
      minor: parsed.minor,
      patch: parsed.patch,
      prerelease: parsed.prerelease.length > 0 
        ? parsed.prerelease.join('.') 
        : null
    };
  }

  /**
   * Create new version
   */
  async createVersion(
    moduleId: string,
    version: string,
    bundleUrl: string,
    bundleHash: string,
    options: {
      changelog?: string;
      releaseNotes?: string;
      minPlatformVersion?: string;
      breakingChanges?: boolean;
      breakingDescription?: string;
      dependencies?: Record<string, string>;
    } = {}
  ): Promise<ModuleVersion> {
    // Validate version format
    const parsed = VersionService.parseVersion(version);
    if (!parsed) {
      throw new Error(`Invalid semver: ${version}`);
    }

    // Check version doesn't already exist
    const { data: existing } = await supabase
      .from('module_versions')
      .select('id')
      .eq('module_id', moduleId)
      .eq('version', version)
      .single();

    if (existing) {
      throw new Error(`Version ${version} already exists`);
    }

    // Check version is higher than current latest
    const latest = await this.getLatestVersion(moduleId);
    if (latest && !semver.gt(version, latest.version)) {
      throw new Error(`Version ${version} must be greater than ${latest.version}`);
    }

    // Detect breaking changes
    let isBreaking = options.breakingChanges || false;
    if (latest && parsed.major > latest.version_major) {
      isBreaking = true;
    }

    const { data, error } = await supabase
      .from('module_versions')
      .insert({
        module_id: moduleId,
        version,
        version_major: parsed.major,
        version_minor: parsed.minor,
        version_patch: parsed.patch,
        prerelease: parsed.prerelease,
        bundle_url: bundleUrl,
        bundle_hash: bundleHash,
        changelog: options.changelog,
        release_notes: options.releaseNotes,
        min_platform_version: options.minPlatformVersion,
        breaking_changes: isBreaking,
        breaking_description: options.breakingDescription,
        dependencies: options.dependencies || {},
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Publish version
   */
  async publishVersion(versionId: string, userId: string): Promise<ModuleVersion> {
    const { data: version, error: fetchError } = await supabase
      .from('module_versions')
      .select('*, module:modules(*)')
      .eq('id', versionId)
      .single();

    if (fetchError || !version) {
      throw new Error('Version not found');
    }

    if (version.status !== 'draft') {
      throw new Error('Can only publish draft versions');
    }

    // Validate dependencies
    await this.validateDependencies(version.dependencies);

    const { data, error } = await supabase
      .from('module_versions')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        published_by: userId
      })
      .eq('id', versionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get latest published version
   */
  async getLatestVersion(moduleId: string, includePrerelease = false): Promise<ModuleVersion | null> {
    let query = supabase
      .from('module_versions')
      .select('*')
      .eq('module_id', moduleId)
      .eq('status', 'published')
      .order('version_major', { ascending: false })
      .order('version_minor', { ascending: false })
      .order('version_patch', { ascending: false });

    if (!includePrerelease) {
      query = query.is('prerelease', null);
    }

    const { data, error } = await query.limit(1).single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Get all versions for a module
   */
  async getVersions(moduleId: string): Promise<ModuleVersion[]> {
    const { data, error } = await supabase
      .from('module_versions')
      .select('*')
      .eq('module_id', moduleId)
      .order('version_major', { ascending: false })
      .order('version_minor', { ascending: false })
      .order('version_patch', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Find version matching constraint
   */
  async findMatchingVersion(
    moduleId: string,
    constraint: string
  ): Promise<ModuleVersion | null> {
    const versions = await this.getVersions(moduleId);
    const published = versions.filter(v => v.status === 'published');

    for (const version of published) {
      if (semver.satisfies(version.version, constraint)) {
        return version;
      }
    }

    return null;
  }

  /**
   * Validate dependency constraints can be satisfied
   */
  private async validateDependencies(
    dependencies: Record<string, string>
  ): Promise<void> {
    for (const [moduleId, constraint] of Object.entries(dependencies)) {
      const match = await this.findMatchingVersion(moduleId, constraint);
      if (!match) {
        throw new Error(
          `Cannot satisfy dependency: ${moduleId}@${constraint}`
        );
      }
    }
  }

  /**
   * Get version by ID
   */
  async getVersion(versionId: string): Promise<ModuleVersion | null> {
    const { data, error } = await supabase
      .from('module_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Deprecate version
   */
  async deprecateVersion(versionId: string, reason?: string): Promise<void> {
    await supabase
      .from('module_versions')
      .update({
        status: 'deprecated',
        release_notes: reason 
          ? `DEPRECATED: ${reason}` 
          : 'DEPRECATED'
      })
      .eq('id', versionId);
  }

  /**
   * Yank version (security/critical issues)
   */
  async yankVersion(versionId: string, reason: string): Promise<void> {
    await supabase
      .from('module_versions')
      .update({
        status: 'yanked',
        release_notes: `YANKED: ${reason}`
      })
      .eq('id', versionId);
  }

  /**
   * Compare versions and get upgrade path
   */
  getUpgradePath(
    currentVersion: string,
    targetVersion: string,
    availableVersions: ModuleVersion[]
  ): ModuleVersion[] {
    const path: ModuleVersion[] = [];
    const sortedVersions = availableVersions
      .filter(v => v.status === 'published')
      .sort((a, b) => semver.compare(a.version, b.version));

    let current = currentVersion;
    
    for (const version of sortedVersions) {
      if (semver.gt(version.version, current) && 
          semver.lte(version.version, targetVersion)) {
        path.push(version);
        current = version.version;
      }
    }

    return path;
  }

  /**
   * Check if upgrade has breaking changes
   */
  hasBreakingChanges(upgradePath: ModuleVersion[]): boolean {
    return upgradePath.some(v => v.breaking_changes);
  }
}
```

---

### Task 3: Migration Service (3 hours)

```typescript
// src/lib/modules/versioning/migration-service.ts

import { createClient } from '@supabase/supabase-js';
import { VersionService, ModuleVersion } from './version-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  estimated_duration_seconds: number | null;
  sequence: number;
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
}

export class MigrationService {
  private siteId: string;
  private moduleId: string;

  constructor(siteId: string, moduleId: string) {
    this.siteId = siteId;
    this.moduleId = moduleId;
  }

  /**
   * Get pending migrations for upgrade
   */
  async getPendingMigrations(
    fromVersion: string | null,
    toVersion: string
  ): Promise<Migration[]> {
    let query = supabase
      .from('module_migrations')
      .select('*')
      .eq('module_id', this.moduleId)
      .order('sequence');

    if (fromVersion) {
      // Get migrations between versions
      const { data: fromMigration } = await supabase
        .from('module_migrations')
        .select('sequence')
        .eq('module_id', this.moduleId)
        .eq('to_version', fromVersion)
        .single();

      if (fromMigration) {
        query = query.gt('sequence', fromMigration.sequence);
      }
    }

    // Get migrations up to target version
    const { data: toMigration } = await supabase
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
   * Run migrations
   */
  async runMigrations(
    migrations: Migration[],
    userId: string,
    createBackup = true
  ): Promise<MigrationRun[]> {
    const runs: MigrationRun[] = [];
    let backupId: string | null = null;

    // Create backup before migrations
    if (createBackup) {
      backupId = await this.createBackup(userId);
    }

    for (const migration of migrations) {
      const run = await this.runSingleMigration(migration, 'up', userId, backupId);
      runs.push(run);

      if (run.status === 'failed') {
        // Rollback previous migrations
        await this.rollbackMigrations(runs.filter(r => r.status === 'success'), userId);
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
    // Create run record
    const { data: run, error: createError } = await supabase
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

    const sql = direction === 'up' ? migration.up_sql : migration.down_sql;
    
    if (!sql) {
      throw new Error(`No ${direction} migration SQL available`);
    }

    try {
      // Execute migration within transaction
      await supabase.rpc('exec_module_migration', {
        p_site_id: this.siteId,
        p_module_id: this.moduleId,
        p_sql: sql
      });

      // Update run as success
      const { data: completed } = await supabase
        .from('module_migration_runs')
        .update({
          status: 'success',
          completed_at: new Date().toISOString()
        })
        .eq('id', run.id)
        .select()
        .single();

      return completed;
    } catch (error: any) {
      // Update run as failed
      const { data: failed } = await supabase
        .from('module_migration_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message
        })
        .eq('id', run.id)
        .select()
        .single();

      return failed;
    }
  }

  /**
   * Rollback migrations
   */
  async rollbackMigrations(
    runs: MigrationRun[],
    userId: string
  ): Promise<void> {
    // Rollback in reverse order
    const reversedRuns = [...runs].reverse();

    for (const run of reversedRuns) {
      const { data: migration } = await supabase
        .from('module_migrations')
        .select('*')
        .eq('id', run.migration_id)
        .single();

      if (!migration || !migration.is_reversible) {
        throw new Error(`Migration ${run.migration_id} is not reversible`);
      }

      await this.runSingleMigration(migration, 'down', userId, run.backup_id);

      // Update original run as rolled back
      await supabase
        .from('module_migration_runs')
        .update({ status: 'rolled_back' })
        .eq('id', run.id);
    }
  }

  /**
   * Create data backup before migration
   */
  private async createBackup(userId: string): Promise<string> {
    // Get module tables
    const { data: tables } = await supabase.rpc('get_module_tables', {
      p_module_id: this.moduleId
    });

    // Export table data
    const tableCounts: Record<string, number> = {};
    const backupData: Record<string, any[]> = {};

    for (const table of tables || []) {
      const { data, count } = await supabase
        .from(table.table_name)
        .select('*', { count: 'exact' })
        .eq('site_id', this.siteId);

      backupData[table.table_name] = data || [];
      tableCounts[table.table_name] = count || 0;
    }

    // Upload to storage
    const backupBlob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
    const backupPath = `backups/${this.siteId}/${this.moduleId}/${Date.now()}.json`;

    const { error: uploadError } = await supabase.storage
      .from('module-backups')
      .upload(backupPath, backupBlob);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('module-backups')
      .getPublicUrl(backupPath);

    // Create backup record
    const { data: backup, error } = await supabase
      .from('module_data_backups')
      .insert({
        site_id: this.siteId,
        module_id: this.moduleId,
        version: await this.getCurrentVersion(),
        type: 'pre_upgrade',
        backup_url: urlData.publicUrl,
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
   * Restore from backup
   */
  async restoreFromBackup(backupId: string): Promise<void> {
    const { data: backup, error } = await supabase
      .from('module_data_backups')
      .select('*')
      .eq('id', backupId)
      .single();

    if (error || !backup) {
      throw new Error('Backup not found');
    }

    // Download backup data
    const response = await fetch(backup.backup_url);
    const backupData = await response.json();

    // Restore each table
    for (const [tableName, rows] of Object.entries(backupData)) {
      // Clear existing data
      await supabase
        .from(tableName)
        .delete()
        .eq('site_id', this.siteId);

      // Insert backup data
      if ((rows as any[]).length > 0) {
        await supabase.from(tableName).insert(rows);
      }
    }
  }

  /**
   * Get current installed version
   */
  private async getCurrentVersion(): Promise<string> {
    const { data } = await supabase
      .from('site_modules')
      .select(`
        version:site_module_versions!inner(
          version:module_versions(version)
        )
      `)
      .eq('site_id', this.siteId)
      .eq('module_id', this.moduleId)
      .eq('site_module_versions.status', 'active')
      .single();

    return data?.version?.[0]?.version?.version || '0.0.0';
  }

  /**
   * Get migration history for site
   */
  async getMigrationHistory(): Promise<MigrationRun[]> {
    const { data, error } = await supabase
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
}
```

---

### Task 4: Rollback Service (2 hours)

```typescript
// src/lib/modules/versioning/rollback-service.ts

import { createClient } from '@supabase/supabase-js';
import { VersionService, ModuleVersion } from './version-service';
import { MigrationService } from './migration-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface RollbackPlan {
  currentVersion: ModuleVersion;
  targetVersion: ModuleVersion;
  migrations: any[];
  estimatedDuration: number;
  requiresMaintenance: boolean;
  canRollback: boolean;
  blockers: string[];
  warnings: string[];
}

export class RollbackService {
  private siteId: string;
  private moduleId: string;

  constructor(siteId: string, moduleId: string) {
    this.siteId = siteId;
    this.moduleId = moduleId;
  }

  /**
   * Create rollback plan
   */
  async createRollbackPlan(targetVersionId: string): Promise<RollbackPlan> {
    const versionService = new VersionService();
    const migrationService = new MigrationService(this.siteId, this.moduleId);

    // Get current and target versions
    const { data: siteModule } = await supabase
      .from('site_modules')
      .select(`
        id,
        activeVersion:site_module_versions!inner(
          version:module_versions(*)
        )
      `)
      .eq('site_id', this.siteId)
      .eq('module_id', this.moduleId)
      .eq('site_module_versions.status', 'active')
      .single();

    if (!siteModule) {
      throw new Error('Module not installed on this site');
    }

    const currentVersion = siteModule.activeVersion[0]?.version;
    const targetVersion = await versionService.getVersion(targetVersionId);

    if (!currentVersion || !targetVersion) {
      throw new Error('Version not found');
    }

    // Get migrations between versions (in reverse)
    const { data: migrations } = await supabase
      .from('module_migrations')
      .select('*')
      .eq('module_id', this.moduleId)
      .order('sequence', { ascending: false });

    const relevantMigrations = (migrations || []).filter(m => {
      // Migrations that need to be rolled back
      return m.sequence > this.getVersionSequence(targetVersion.version) &&
             m.sequence <= this.getVersionSequence(currentVersion.version);
    });

    // Check if all migrations are reversible
    const blockers: string[] = [];
    const warnings: string[] = [];

    for (const migration of relevantMigrations) {
      if (!migration.is_reversible) {
        blockers.push(`Migration to ${migration.to_version} is not reversible`);
      }
      if (!migration.down_sql) {
        blockers.push(`Migration to ${migration.to_version} has no rollback SQL`);
      }
    }

    // Check for data loss
    const dataWarnings = await this.checkDataLoss(relevantMigrations);
    warnings.push(...dataWarnings);

    // Calculate estimated duration
    const estimatedDuration = relevantMigrations.reduce(
      (sum, m) => sum + (m.estimated_duration_seconds || 30),
      0
    );

    const requiresMaintenance = relevantMigrations.some(m => m.requires_maintenance);

    return {
      currentVersion,
      targetVersion,
      migrations: relevantMigrations,
      estimatedDuration,
      requiresMaintenance,
      canRollback: blockers.length === 0,
      blockers,
      warnings
    };
  }

  /**
   * Execute rollback
   */
  async executeRollback(
    targetVersionId: string,
    userId: string,
    options: {
      createBackup?: boolean;
      force?: boolean;
    } = {}
  ): Promise<void> {
    const plan = await this.createRollbackPlan(targetVersionId);

    if (!plan.canRollback && !options.force) {
      throw new Error(`Cannot rollback: ${plan.blockers.join(', ')}`);
    }

    const migrationService = new MigrationService(this.siteId, this.moduleId);

    // Create backup before rollback
    if (options.createBackup !== false) {
      // Backup handled by migration service
    }

    // Update site module version status
    await supabase
      .from('site_module_versions')
      .update({ status: 'pending_rollback' })
      .eq('site_module_id', plan.currentVersion.id)
      .eq('status', 'active');

    try {
      // Run rollback migrations
      for (const migration of plan.migrations) {
        await supabase.rpc('exec_module_migration', {
          p_site_id: this.siteId,
          p_module_id: this.moduleId,
          p_sql: migration.down_sql
        });

        // Record migration run
        await supabase
          .from('module_migration_runs')
          .insert({
            site_id: this.siteId,
            module_id: this.moduleId,
            migration_id: migration.id,
            direction: 'down',
            status: 'success',
            completed_at: new Date().toISOString(),
            executed_by: userId
          });
      }

      // Update version statuses
      await supabase
        .from('site_module_versions')
        .update({ 
          status: 'rolled_back',
          deactivated_at: new Date().toISOString()
        })
        .eq('site_module_id', plan.currentVersion.id)
        .eq('status', 'pending_rollback');

      // Activate target version (or create if not exists)
      const { data: existingInstall } = await supabase
        .from('site_module_versions')
        .select('id')
        .eq('site_module_id', plan.currentVersion.id)
        .eq('version_id', targetVersionId)
        .single();

      if (existingInstall) {
        await supabase
          .from('site_module_versions')
          .update({ 
            status: 'active',
            activated_at: new Date().toISOString()
          })
          .eq('id', existingInstall.id);
      } else {
        await supabase
          .from('site_module_versions')
          .insert({
            site_module_id: plan.currentVersion.id,
            version_id: targetVersionId,
            status: 'active',
            activated_at: new Date().toISOString(),
            installed_by: userId
          });
      }

    } catch (error: any) {
      // Mark as failed
      await supabase
        .from('site_module_versions')
        .update({ status: 'failed' })
        .eq('site_module_id', plan.currentVersion.id)
        .eq('status', 'pending_rollback');

      throw error;
    }
  }

  /**
   * Get available rollback points
   */
  async getRollbackPoints(): Promise<{
    version: ModuleVersion;
    installedAt: string;
    hasBackup: boolean;
  }[]> {
    const { data: siteModule } = await supabase
      .from('site_modules')
      .select('id')
      .eq('site_id', this.siteId)
      .eq('module_id', this.moduleId)
      .single();

    if (!siteModule) return [];

    const { data: installations } = await supabase
      .from('site_module_versions')
      .select(`
        installed_at,
        version:module_versions(*)
      `)
      .eq('site_module_id', siteModule.id)
      .order('installed_at', { ascending: false });

    if (!installations) return [];

    // Check for backups
    const { data: backups } = await supabase
      .from('module_data_backups')
      .select('version')
      .eq('site_id', this.siteId)
      .eq('module_id', this.moduleId);

    const backupVersions = new Set((backups || []).map(b => b.version));

    return installations.map(inst => ({
      version: inst.version,
      installedAt: inst.installed_at,
      hasBackup: backupVersions.has(inst.version.version)
    }));
  }

  /**
   * Check for potential data loss
   */
  private async checkDataLoss(migrations: any[]): Promise<string[]> {
    const warnings: string[] = [];

    for (const migration of migrations) {
      // Check for DROP TABLE, TRUNCATE, etc.
      const downSql = migration.down_sql?.toLowerCase() || '';
      
      if (downSql.includes('drop table')) {
        warnings.push(`Rolling back ${migration.to_version} will DROP tables`);
      }
      if (downSql.includes('drop column')) {
        warnings.push(`Rolling back ${migration.to_version} will DROP columns`);
      }
      if (downSql.includes('truncate')) {
        warnings.push(`Rolling back ${migration.to_version} will TRUNCATE data`);
      }
    }

    return warnings;
  }

  private getVersionSequence(version: string): number {
    // Simple version to sequence conversion
    const [major, minor, patch] = version.split('.').map(Number);
    return major * 10000 + minor * 100 + patch;
  }
}
```

---

### Task 5: Upgrade Flow UI (2 hours)

```tsx
// src/components/modules/UpgradeFlow.tsx

'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Alert,
  AlertDescription,
  Progress
} from '@/components/ui';
import { AlertTriangle, CheckCircle, ArrowRight, RotateCcw } from 'lucide-react';

interface UpgradeFlowProps {
  siteId: string;
  moduleId: string;
  currentVersion: string;
  targetVersion: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function UpgradeFlow({
  siteId,
  moduleId,
  currentVersion,
  targetVersion,
  onComplete,
  onCancel
}: UpgradeFlowProps) {
  const [step, setStep] = useState<'plan' | 'backup' | 'migrate' | 'verify' | 'complete'>('plan');
  const [upgradePlan, setUpgradePlan] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [currentMigration, setCurrentMigration] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [backupId, setBackupId] = useState<string | null>(null);

  useEffect(() => {
    loadUpgradePlan();
  }, []);

  async function loadUpgradePlan() {
    try {
      const response = await fetch(`/api/modules/${moduleId}/upgrade/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          fromVersion: currentVersion,
          toVersion: targetVersion
        })
      });
      
      const plan = await response.json();
      setUpgradePlan(plan);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function startUpgrade() {
    if (!upgradePlan) return;

    try {
      // Step 1: Create backup
      setStep('backup');
      setProgress(10);
      
      const backupResponse = await fetch(`/api/modules/${moduleId}/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId })
      });
      
      const { backupId: newBackupId } = await backupResponse.json();
      setBackupId(newBackupId);
      setProgress(25);

      // Step 2: Run migrations
      setStep('migrate');
      
      for (let i = 0; i < upgradePlan.migrations.length; i++) {
        const migration = upgradePlan.migrations[i];
        setCurrentMigration(`Running migration: ${migration.description || migration.to_version}`);
        
        await fetch(`/api/modules/${moduleId}/migrate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteId,
            migrationId: migration.id,
            direction: 'up'
          })
        });
        
        setProgress(25 + ((i + 1) / upgradePlan.migrations.length) * 50);
      }

      // Step 3: Verify
      setStep('verify');
      setProgress(80);
      
      await fetch(`/api/modules/${moduleId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, version: targetVersion })
      });
      
      setProgress(100);

      // Complete
      setStep('complete');
      
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function rollback() {
    if (!backupId) return;

    try {
      await fetch(`/api/modules/${moduleId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, backupId })
      });
      
      onCancel();
    } catch (err: any) {
      setError(`Rollback failed: ${err.message}`);
    }
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-4 mt-4">
            {backupId && (
              <Button variant="outline" onClick={rollback}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Rollback to Previous Version
              </Button>
            )}
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Upgrade Module
          <Badge variant="outline">{currentVersion}</Badge>
          <ArrowRight className="h-4 w-4" />
          <Badge>{targetVersion}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progress} />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {step === 'plan' && 'Preparing upgrade...'}
              {step === 'backup' && 'Creating backup...'}
              {step === 'migrate' && currentMigration}
              {step === 'verify' && 'Verifying installation...'}
              {step === 'complete' && 'Upgrade complete!'}
            </span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Steps */}
        <div className="flex gap-2">
          {['plan', 'backup', 'migrate', 'verify', 'complete'].map((s, i) => (
            <div 
              key={s}
              className={`flex-1 h-2 rounded ${
                step === s ? 'bg-blue-500' :
                ['plan', 'backup', 'migrate', 'verify', 'complete'].indexOf(step) > i 
                  ? 'bg-green-500' 
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Plan Details */}
        {step === 'plan' && upgradePlan && (
          <div className="space-y-4">
            {/* Breaking Changes Warning */}
            {upgradePlan.hasBreakingChanges && (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This upgrade includes breaking changes. Please review the changelog.
                </AlertDescription>
              </Alert>
            )}

            {/* Migrations List */}
            <div>
              <h4 className="font-medium mb-2">Migrations to run:</h4>
              <ul className="space-y-1 text-sm">
                {upgradePlan.migrations.map((m: any, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-gray-200 text-xs flex items-center justify-center">
                      {i + 1}
                    </span>
                    {m.description || `Migrate to ${m.to_version}`}
                  </li>
                ))}
              </ul>
            </div>

            {/* Duration Estimate */}
            <p className="text-sm text-muted-foreground">
              Estimated time: {Math.ceil(upgradePlan.estimatedDuration / 60)} minutes
            </p>

            {/* Actions */}
            <div className="flex gap-4">
              <Button onClick={startUpgrade}>
                Start Upgrade
              </Button>
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Complete */}
        {step === 'complete' && (
          <div className="text-center py-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Upgrade Complete!</h3>
            <p className="text-muted-foreground mb-4">
              Module has been upgraded to version {targetVersion}
            </p>
            <Button onClick={onComplete}>
              Done
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## ✅ Verification Checklist

- [ ] Versions parse correctly
- [ ] Version history tracks properly
- [ ] Migrations run in order
- [ ] Backups create before upgrade
- [ ] Rollback restores correctly
- [ ] Breaking changes detected
- [ ] Dependency constraints validate
- [ ] Upgrade UI flows smoothly
- [ ] Error handling works
- [ ] Data preserved during rollback

---

## 📍 Dependencies

- **Requires**: EM-01, EM-05, EM-11 (database)
- **Required by**: Marketplace updates, safe deployments
