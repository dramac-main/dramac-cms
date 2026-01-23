/**
 * Phase EM-41: Module Versioning Service
 * 
 * Provides comprehensive version management for modules including:
 * - Semantic versioning enforcement
 * - Version creation and publishing
 * - Dependency constraint validation
 * - Upgrade path calculation
 * - Breaking change detection
 */

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// =============================================================
// TYPES
// =============================================================

export interface ModuleVersion {
  id: string;
  module_source_id: string;
  version: string;
  version_major: number;
  version_minor: number;
  version_patch: number;
  prerelease: string | null;
  bundle_url: string | null;
  bundle_hash: string | null;
  source_url: string | null;
  changelog: string | null;
  release_notes: string | null;
  min_platform_version: string | null;
  is_breaking_change: boolean;
  breaking_description: string | null;
  dependencies: Record<string, string>;
  status: 'draft' | 'published' | 'deprecated' | 'yanked';
  download_count: number;
  active_installs: number;
  published_at: string | null;
  published_by: string | null;
  created_at: string;
  created_by: string | null;
  // Extended fields from module_source
  render_code?: string;
  settings_schema?: Record<string, unknown>;
  api_routes?: Array<{ path: string; method: string; handler: string }>;
  styles?: string;
  default_settings?: Record<string, unknown>;
}

export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
}

export interface VersionConstraint {
  moduleId: string;
  constraint: string; // "^1.0.0", ">=2.0.0 <3.0.0", etc.
}

export interface CreateVersionOptions {
  changelog?: string;
  releaseNotes?: string;
  minPlatformVersion?: string;
  breakingChanges?: boolean;
  breakingDescription?: string;
  dependencies?: Record<string, string>;
  bundleUrl?: string;
  bundleHash?: string;
  sourceUrl?: string;
}

export interface UpgradePath {
  versions: ModuleVersion[];
  hasBreakingChanges: boolean;
  breakingVersions: string[];
  estimatedDuration: number;
}

// =============================================================
// VERSION SERVICE CLASS
// =============================================================

export class VersionService {
  private db: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    // Client will be set on first use if not provided
    this.db = supabaseClient as SupabaseClient;
  }

  /**
   * Ensure we have a database client
   */
  private async getClient(): Promise<SupabaseClient> {
    if (!this.db) {
      this.db = await createClient();
    }
    return this.db;
  }

  // =============================================================
  // STATIC HELPERS
  // =============================================================

  /**
   * Parse and validate semver string
   */
  static parseVersion(version: string): ParsedVersion | null {
    // Match semver pattern: MAJOR.MINOR.PATCH[-PRERELEASE]
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.]+))?$/);
    if (!match) return null;

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4] || null
    };
  }

  /**
   * Compare two semver versions
   * Returns: 1 if a > b, -1 if a < b, 0 if equal
   */
  static compareVersions(a: string, b: string): number {
    const vA = VersionService.parseVersion(a);
    const vB = VersionService.parseVersion(b);

    if (!vA || !vB) return 0;

    if (vA.major !== vB.major) return vA.major > vB.major ? 1 : -1;
    if (vA.minor !== vB.minor) return vA.minor > vB.minor ? 1 : -1;
    if (vA.patch !== vB.patch) return vA.patch > vB.patch ? 1 : -1;

    // Prerelease comparison (null means release, which is > prerelease)
    if (vA.prerelease === null && vB.prerelease !== null) return 1;
    if (vA.prerelease !== null && vB.prerelease === null) return -1;
    if (vA.prerelease && vB.prerelease) {
      return vA.prerelease.localeCompare(vB.prerelease);
    }

    return 0;
  }

  /**
   * Check if version satisfies constraint
   */
  static satisfiesConstraint(version: string, constraint: string): boolean {
    const parsed = VersionService.parseVersion(version);
    if (!parsed) return false;

    // Handle exact match
    if (!constraint.match(/^[\^~<>=]/)) {
      return version === constraint;
    }

    // Extract version from constraint
    const constraintVersion = constraint.replace(/^[\^~<>=]+/, '');
    const cParsed = VersionService.parseVersion(constraintVersion);
    if (!cParsed) return false;

    const comparison = VersionService.compareVersions(version, constraintVersion);

    // Caret (^) - compatible with version (same major)
    if (constraint.startsWith('^')) {
      return parsed.major === cParsed.major && comparison >= 0;
    }

    // Tilde (~) - approximately equivalent (same major.minor)
    if (constraint.startsWith('~')) {
      return parsed.major === cParsed.major && 
             parsed.minor === cParsed.minor && 
             comparison >= 0;
    }

    // Comparison operators
    if (constraint.startsWith('>=')) return comparison >= 0;
    if (constraint.startsWith('<=')) return comparison <= 0;
    if (constraint.startsWith('>')) return comparison > 0;
    if (constraint.startsWith('<')) return comparison < 0;

    return false;
  }

  /**
   * Increment version based on type
   */
  static incrementVersion(
    currentVersion: string,
    type: 'major' | 'minor' | 'patch'
  ): string {
    const parsed = VersionService.parseVersion(currentVersion);
    if (!parsed) return '1.0.0';

    switch (type) {
      case 'major':
        return `${parsed.major + 1}.0.0`;
      case 'minor':
        return `${parsed.major}.${parsed.minor + 1}.0`;
      case 'patch':
        return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
      default:
        return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
    }
  }

  // =============================================================
  // VERSION CRUD OPERATIONS
  // =============================================================

  /**
   * Create new version for a module
   */
  async createVersion(
    moduleSourceId: string,
    version: string,
    options: CreateVersionOptions = {}
  ): Promise<ModuleVersion> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    // Validate version format
    const parsed = VersionService.parseVersion(version);
    if (!parsed) {
      throw new Error(`Invalid semver: ${version}`);
    }

    // Check version doesn't already exist
    const { data: existing } = await client
      .from('module_versions')
      .select('id')
      .eq('module_source_id', moduleSourceId)
      .eq('version', version)
      .single();

    if (existing) {
      throw new Error(`Version ${version} already exists`);
    }

    // Get current module and latest version
    const { data: module } = await client
      .from('module_source')
      .select('*')
      .eq('id', moduleSourceId)
      .single();

    if (!module) {
      throw new Error('Module not found');
    }

    // Check version is higher than current latest
    const latest = await this.getLatestVersion(moduleSourceId);
    if (latest && VersionService.compareVersions(version, latest.version) <= 0) {
      throw new Error(`Version ${version} must be greater than ${latest.version}`);
    }

    // Detect breaking changes
    let isBreaking = options.breakingChanges || false;
    if (latest && parsed.major > latest.version_major) {
      isBreaking = true;
    }

    // Create version record with code snapshot
    const { data, error } = await client
      .from('module_versions')
      .insert({
        module_source_id: moduleSourceId,
        version,
        version_major: parsed.major,
        version_minor: parsed.minor,
        version_patch: parsed.patch,
        prerelease: parsed.prerelease,
        bundle_url: options.bundleUrl || null,
        bundle_hash: options.bundleHash || null,
        source_url: options.sourceUrl || null,
        changelog: options.changelog || null,
        release_notes: options.releaseNotes || null,
        min_platform_version: options.minPlatformVersion || null,
        is_breaking_change: isBreaking,
        breaking_description: options.breakingDescription || null,
        dependencies: options.dependencies || {},
        status: 'draft',
        // Snapshot current code
        render_code: module.render_code,
        settings_schema: module.settings_schema,
        api_routes: module.api_routes,
        styles: module.styles,
        default_settings: module.default_settings
      })
      .select()
      .single();

    if (error) throw error;

    // Update latest_version on module_source
    await client
      .from('module_source')
      .update({ 
        latest_version: version,
        updated_at: new Date().toISOString()
      })
      .eq('id', moduleSourceId);

    return this.mapVersionRow(data);
  }

  /**
   * Publish a draft version
   */
  async publishVersion(versionId: string, userId: string): Promise<ModuleVersion> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    // Get version
    const { data: version, error: fetchError } = await client
      .from('module_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (fetchError || !version) {
      throw new Error('Version not found');
    }

    if (version.status !== 'draft') {
      throw new Error('Can only publish draft versions');
    }

    // Validate dependencies can be satisfied
    if (version.dependencies && Object.keys(version.dependencies).length > 0) {
      await this.validateDependencies(version.dependencies);
    }

    // Update version status
    const { data, error } = await client
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

    // Update published_version on module_source
    await client
      .from('module_source')
      .update({ 
        published_version: version.version,
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', version.module_source_id);

    return this.mapVersionRow(data);
  }

  /**
   * Deprecate a version
   */
  async deprecateVersion(versionId: string, reason?: string): Promise<void> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    await client
      .from('module_versions')
      .update({
        status: 'deprecated',
        release_notes: reason ? `DEPRECATED: ${reason}` : 'DEPRECATED'
      })
      .eq('id', versionId);
  }

  /**
   * Yank a version (security/critical issues)
   */
  async yankVersion(versionId: string, reason: string): Promise<void> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    await client
      .from('module_versions')
      .update({
        status: 'yanked',
        release_notes: `YANKED: ${reason}`
      })
      .eq('id', versionId);
  }

  // =============================================================
  // VERSION QUERIES
  // =============================================================

  /**
   * Get version by ID
   */
  async getVersion(versionId: string): Promise<ModuleVersion | null> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    const { data, error } = await client
      .from('module_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.mapVersionRow(data) : null;
  }

  /**
   * Get latest published version for a module
   */
  async getLatestVersion(
    moduleSourceId: string, 
    includePrerelease = false
  ): Promise<ModuleVersion | null> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    let query = client
      .from('module_versions')
      .select('*')
      .eq('module_source_id', moduleSourceId)
      .in('status', ['published', 'draft']) // Include drafts for latest check
      .order('version_major', { ascending: false })
      .order('version_minor', { ascending: false })
      .order('version_patch', { ascending: false });

    if (!includePrerelease) {
      query = query.is('prerelease', null);
    }

    const { data, error } = await query.limit(1).single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.mapVersionRow(data) : null;
  }

  /**
   * Get all versions for a module
   */
  async getVersions(moduleSourceId: string): Promise<ModuleVersion[]> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    const { data, error } = await client
      .from('module_versions')
      .select('*')
      .eq('module_source_id', moduleSourceId)
      .order('version_major', { ascending: false })
      .order('version_minor', { ascending: false })
      .order('version_patch', { ascending: false });

    if (error) throw error;
    return (data || []).map((row: Record<string, unknown>) => this.mapVersionRow(row));
  }

  /**
   * Get published versions only
   */
  async getPublishedVersions(moduleSourceId: string): Promise<ModuleVersion[]> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    const { data, error } = await client
      .from('module_versions')
      .select('*')
      .eq('module_source_id', moduleSourceId)
      .eq('status', 'published')
      .order('version_major', { ascending: false })
      .order('version_minor', { ascending: false })
      .order('version_patch', { ascending: false });

    if (error) throw error;
    return (data || []).map((row: Record<string, unknown>) => this.mapVersionRow(row));
  }

  /**
   * Find version matching constraint
   */
  async findMatchingVersion(
    moduleSourceId: string,
    constraint: string
  ): Promise<ModuleVersion | null> {
    const versions = await this.getPublishedVersions(moduleSourceId);

    for (const version of versions) {
      if (VersionService.satisfiesConstraint(version.version, constraint)) {
        return version;
      }
    }

    return null;
  }

  // =============================================================
  // UPGRADE PATH CALCULATION
  // =============================================================

  /**
   * Calculate upgrade path between versions
   */
  async getUpgradePath(
    moduleSourceId: string,
    currentVersion: string,
    targetVersion: string
  ): Promise<UpgradePath> {
    const versions = await this.getPublishedVersions(moduleSourceId);
    
    const path: ModuleVersion[] = [];
    const breakingVersions: string[] = [];
    
    // Sort versions in ascending order
    const sortedVersions = versions.sort((a, b) => 
      VersionService.compareVersions(a.version, b.version)
    );

    let current = currentVersion;

    for (const version of sortedVersions) {
      if (VersionService.compareVersions(version.version, current) > 0 &&
          VersionService.compareVersions(version.version, targetVersion) <= 0) {
        path.push(version);
        current = version.version;

        if (version.is_breaking_change) {
          breakingVersions.push(version.version);
        }
      }
    }

    // Estimate duration (30 seconds per version as default)
    const estimatedDuration = path.length * 30;

    return {
      versions: path,
      hasBreakingChanges: breakingVersions.length > 0,
      breakingVersions,
      estimatedDuration
    };
  }

  /**
   * Check if upgrade has breaking changes
   */
  hasBreakingChanges(versions: ModuleVersion[]): boolean {
    return versions.some(v => v.is_breaking_change);
  }

  // =============================================================
  // DEPENDENCY MANAGEMENT
  // =============================================================

  /**
   * Validate that all dependency constraints can be satisfied
   */
  async validateDependencies(
    dependencies: Record<string, string>
  ): Promise<void> {
    for (const [moduleSourceId, constraint] of Object.entries(dependencies)) {
      const match = await this.findMatchingVersion(moduleSourceId, constraint);
      if (!match) {
        throw new Error(
          `Cannot satisfy dependency: ${moduleSourceId}@${constraint}`
        );
      }
    }
  }

  /**
   * Resolve all dependencies for a version
   */
  async resolveDependencies(
    versionId: string
  ): Promise<Map<string, ModuleVersion>> {
    const version = await this.getVersion(versionId);
    if (!version) {
      throw new Error('Version not found');
    }

    const resolved = new Map<string, ModuleVersion>();

    for (const [moduleSourceId, constraint] of Object.entries(version.dependencies || {})) {
      const match = await this.findMatchingVersion(moduleSourceId, constraint);
      if (!match) {
        throw new Error(
          `Cannot resolve dependency: ${moduleSourceId}@${constraint}`
        );
      }
      resolved.set(moduleSourceId, match);
    }

    return resolved;
  }

  // =============================================================
  // STATS & METRICS
  // =============================================================

  /**
   * Increment download count
   */
  async incrementDownloads(versionId: string): Promise<void> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    await client.rpc('increment_version_downloads', { version_id: versionId });
  }

  /**
   * Update active installs count
   */
  async updateActiveInstalls(versionId: string, count: number): Promise<void> {
    const db = await this.getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = db as any;

    await client
      .from('module_versions')
      .update({ active_installs: count })
      .eq('id', versionId);
  }

  // =============================================================
  // HELPERS
  // =============================================================

  /**
   * Map database row to ModuleVersion type
   */
  private mapVersionRow(row: Record<string, unknown>): ModuleVersion {
    return {
      id: row.id as string,
      module_source_id: row.module_source_id as string,
      version: row.version as string,
      version_major: (row.version_major as number) || 0,
      version_minor: (row.version_minor as number) || 0,
      version_patch: (row.version_patch as number) || 0,
      prerelease: row.prerelease as string | null,
      bundle_url: row.bundle_url as string | null,
      bundle_hash: row.bundle_hash as string | null,
      source_url: row.source_url as string | null,
      changelog: row.changelog as string | null,
      release_notes: row.release_notes as string | null,
      min_platform_version: row.min_platform_version as string | null,
      is_breaking_change: (row.is_breaking_change as boolean) || false,
      breaking_description: row.breaking_description as string | null,
      dependencies: (row.dependencies as Record<string, string>) || {},
      status: (row.status as ModuleVersion['status']) || 'draft',
      download_count: (row.download_count as number) || 0,
      active_installs: (row.active_installs as number) || 0,
      published_at: row.published_at as string | null,
      published_by: row.published_by as string | null,
      created_at: row.created_at as string,
      created_by: row.created_by as string | null,
      render_code: row.render_code as string | undefined,
      settings_schema: row.settings_schema as Record<string, unknown> | undefined,
      api_routes: row.api_routes as ModuleVersion['api_routes'],
      styles: row.styles as string | undefined,
      default_settings: row.default_settings as Record<string, unknown> | undefined
    };
  }
}

// =============================================================
// SINGLETON EXPORT
// =============================================================

let versionServiceInstance: VersionService | null = null;

export function getVersionService(): VersionService {
  if (!versionServiceInstance) {
    versionServiceInstance = new VersionService();
  }
  return versionServiceInstance;
}

// Export static methods for convenience
export const parseVersion = VersionService.parseVersion;
export const compareVersions = VersionService.compareVersions;
export const satisfiesConstraint = VersionService.satisfiesConstraint;
export const incrementVersion = VersionService.incrementVersion;
