/**
 * Module Manifest Types
 * 
 * Phase EM-05: Module Naming Conventions & Conflict Prevention
 * 
 * Defines the TypeScript types for module manifests, including:
 * - Module metadata (name, version, description)
 * - Database configuration (isolation level, tables, columns)
 * - Permission requirements
 * - UI configuration
 * 
 * These types are used for:
 * - Module Studio manifest validation
 * - Database provisioning
 * - Marketplace publishing
 * 
 * @see phases/enterprise-modules/PHASE-EM-05-MODULE-NAMING-CONVENTIONS.md
 */

// ============================================================================
// MODULE MANIFEST
// ============================================================================

/**
 * Complete module manifest definition
 * This is the main configuration file for a DRAMAC module
 */
export interface ModuleManifest {
  /** Unique identifier (usually matches folder name) */
  id: string;
  
  /** Human-readable module name */
  name: string;
  
  /** Semantic version (e.g., "1.0.0") */
  version: string;
  
  /** Short description (max 200 chars) */
  description: string;
  
  /** Long description with markdown support */
  longDescription?: string;
  
  /** Module type/tier determining capabilities and isolation */
  type: ModuleType;
  
  /** Category for marketplace organization */
  category: ModuleCategory;
  
  /** Module author/publisher information */
  author: ModuleAuthor;
  
  /** Module icon (URL or icon identifier) */
  icon?: string;
  
  /** Preview screenshots for marketplace */
  screenshots?: string[];
  
  /** Keywords for search */
  keywords?: string[];
  
  /** Minimum DRAMAC platform version required */
  minPlatformVersion?: string;
  
  /** Module dependencies */
  dependencies?: ModuleDependency[];
  
  /** Database configuration */
  database?: ModuleDatabaseManifest;
  
  /** API endpoints provided by this module */
  api?: ModuleAPIManifest;
  
  /** UI components and configuration */
  ui?: ModuleUIManifest;
  
  /** Required permissions */
  permissions?: ModulePermission[];
  
  /** Hooks into platform events */
  hooks?: ModuleHook[];
  
  /** License information */
  license?: string;
  
  /** Repository URL */
  repository?: string;
  
  /** Documentation URL */
  documentation?: string;
  
  /** Changelog URL or inline */
  changelog?: string;
}

// ============================================================================
// MODULE TYPES
// ============================================================================

/**
 * Module type determines capabilities and database isolation
 * 
 * - widget: Simple, no custom tables, uses shared module_data
 * - app: Medium complexity, prefixed tables in public schema
 * - system: Complex, dedicated PostgreSQL schema
 * - integration: External data only, no database
 */
export type ModuleType = 'widget' | 'app' | 'system' | 'integration';

/**
 * Module categories for marketplace organization
 */
export type ModuleCategory =
  | 'analytics'
  | 'seo'
  | 'forms'
  | 'ecommerce'
  | 'content'
  | 'localization'
  | 'membership'
  | 'scheduling'
  | 'communication'
  | 'marketing'
  | 'crm'
  | 'productivity'
  | 'security'
  | 'developer'
  | 'other';

/**
 * Module author/publisher information
 */
export interface ModuleAuthor {
  name: string;
  email?: string;
  url?: string;
  verified?: boolean;
}

/**
 * Module dependency configuration
 */
export interface ModuleDependency {
  /** Module ID of the dependency */
  moduleId: string;
  /** Minimum version required */
  minVersion?: string;
  /** Maximum version supported */
  maxVersion?: string;
  /** Whether this dependency is optional */
  optional?: boolean;
}

// ============================================================================
// DATABASE MANIFEST
// ============================================================================

/**
 * Database configuration for the module
 * This defines what database objects the module needs
 */
export interface ModuleDatabaseManifest {
  /**
   * Schema isolation level
   * - 'none': Uses shared module_data table only (for widgets)
   * - 'tables': Creates prefixed tables in public schema (for apps)
   * - 'schema': Creates dedicated PostgreSQL schema (for system modules)
   */
  isolation: 'none' | 'tables' | 'schema';
  
  /**
   * Table definitions
   * Table names should NOT include prefix - system adds it automatically
   */
  tables?: ModuleTableManifest[];
  
  /**
   * Required platform tables (for foreign keys)
   */
  platformDependencies?: PlatformTable[];
  
  /**
   * Database functions/procedures
   */
  functions?: ModuleFunctionManifest[];
  
  /**
   * Database views
   */
  views?: ModuleViewManifest[];
  
  /**
   * Triggers
   */
  triggers?: ModuleTriggerManifest[];
  
  /**
   * Seed data for initial setup
   */
  seedData?: ModuleSeedData[];
}

/**
 * Platform tables that can be referenced by foreign keys
 */
export type PlatformTable = 
  | 'sites' 
  | 'users' 
  | 'agencies' 
  | 'clients'
  | 'pages'
  | 'sections'
  | 'assets';

/**
 * Table definition in the module manifest
 */
export interface ModuleTableManifest {
  /**
   * Table name (without prefix)
   * System will create: mod_{short_id}_{name} or mod_{short_id}.{name}
   */
  name: string;
  
  /**
   * Human-readable description
   */
  description?: string;
  
  /**
   * Column definitions
   */
  columns: ModuleColumnManifest[];
  
  /**
   * Index definitions
   */
  indexes?: ModuleIndexManifest[];
  
  /**
   * Foreign key constraints
   */
  foreignKeys?: ModuleForeignKeyManifest[];
  
  /**
   * Whether this table is required for module to function
   */
  required?: boolean;
  
  /**
   * Row Level Security configuration
   */
  rls?: ModuleRLSManifest;
}

/**
 * Column types supported in module manifests
 */
export type ModuleColumnType = 
  | 'uuid' 
  | 'text' 
  | 'varchar'
  | 'integer' 
  | 'bigint' 
  | 'smallint'
  | 'decimal' 
  | 'numeric'
  | 'real'
  | 'double'
  | 'boolean' 
  | 'jsonb' 
  | 'json'
  | 'timestamp' 
  | 'timestamptz'
  | 'date' 
  | 'time'
  | 'interval'
  | 'text[]'
  | 'uuid[]'
  | 'integer[]'
  | 'bytea';

/**
 * Column definition in module manifest
 */
export interface ModuleColumnManifest {
  /** Column name */
  name: string;
  
  /** Data type */
  type: ModuleColumnType;
  
  /** Type modifier (e.g., varchar length) */
  typeModifier?: string;
  
  /** Whether NULL is allowed */
  nullable?: boolean;
  
  /** Default value expression */
  default?: string;
  
  /** Human-readable description */
  description?: string;
  
  /** Is this a primary key column? */
  primaryKey?: boolean;
  
  /** Is this column unique? */
  unique?: boolean;
  
  /** Check constraint expression */
  check?: string;
  
  /**
   * Reference to another table (can be within same module or platform)
   */
  references?: {
    /** 'self' = same module, 'platform' = platform table */
    module: 'self' | 'platform';
    /** Table name */
    table: string;
    /** Column name */
    column: string;
    /** ON DELETE action */
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
    /** ON UPDATE action */
    onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  };
}

/**
 * Index definition in module manifest
 */
export interface ModuleIndexManifest {
  /** Index name identifier (final name will be prefixed) */
  name?: string;
  
  /** Columns to include in index */
  columns: string[];
  
  /** Is this a unique index? */
  unique?: boolean;
  
  /** WHERE clause for partial index */
  where?: string;
  
  /** Index method (btree, hash, gin, gist, etc.) */
  method?: 'btree' | 'hash' | 'gin' | 'gist' | 'spgist' | 'brin';
  
  /** Include columns (for covering indexes) */
  include?: string[];
}

/**
 * Foreign key definition (alternative to column-level references)
 */
export interface ModuleForeignKeyManifest {
  /** Name for the constraint */
  name?: string;
  
  /** Column(s) in this table */
  columns: string[];
  
  /** Reference configuration */
  references: {
    /** 'self' = same module, 'platform' = platform table */
    module: 'self' | 'platform';
    /** Target table */
    table: string;
    /** Target column(s) */
    columns: string[];
  };
  
  /** ON DELETE action */
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  
  /** ON UPDATE action */
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

/**
 * Row Level Security configuration
 */
export interface ModuleRLSManifest {
  /** Enable RLS on this table */
  enabled: boolean;
  
  /** Force RLS even for table owner */
  force?: boolean;
  
  /** Use a pre-built policy template */
  template?: 'site_isolation' | 'agency_isolation' | 'user_isolation';
  
  /** Custom policies */
  policies?: ModuleRLSPolicyManifest[];
}

/**
 * Custom RLS policy definition
 */
export interface ModuleRLSPolicyManifest {
  /** Policy name */
  name: string;
  
  /** Operation(s) this policy applies to */
  for: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  
  /** Role this policy applies to */
  to?: string;
  
  /** USING clause expression */
  using?: string;
  
  /** WITH CHECK clause expression */
  withCheck?: string;
}

/**
 * Database function definition
 */
export interface ModuleFunctionManifest {
  name: string;
  language: 'sql' | 'plpgsql' | 'plv8';
  returns: string;
  arguments?: string;
  body: string;
  security?: 'DEFINER' | 'INVOKER';
  volatility?: 'VOLATILE' | 'STABLE' | 'IMMUTABLE';
}

/**
 * Database view definition
 */
export interface ModuleViewManifest {
  name: string;
  query: string;
  materialized?: boolean;
}

/**
 * Database trigger definition
 */
export interface ModuleTriggerManifest {
  name: string;
  table: string;
  timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF';
  events: ('INSERT' | 'UPDATE' | 'DELETE')[];
  forEach: 'ROW' | 'STATEMENT';
  function: string;
  when?: string;
}

/**
 * Seed data configuration
 */
export interface ModuleSeedData {
  table: string;
  data: Record<string, unknown>[];
}

// ============================================================================
// API MANIFEST
// ============================================================================

/**
 * API endpoints provided by the module
 */
export interface ModuleAPIManifest {
  /** Base path for API routes */
  basePath?: string;
  
  /** API endpoints */
  endpoints?: ModuleEndpoint[];
  
  /** Webhooks the module accepts */
  webhooks?: ModuleWebhook[];
}

export interface ModuleEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description?: string;
  auth?: boolean;
  rateLimit?: {
    requests: number;
    window: string;
  };
}

export interface ModuleWebhook {
  name: string;
  description?: string;
  payloadSchema?: Record<string, unknown>;
}

// ============================================================================
// UI MANIFEST
// ============================================================================

/**
 * UI components and configuration
 */
export interface ModuleUIManifest {
  /** Settings panel configuration */
  settingsPanel?: {
    component: string;
    title?: string;
    icon?: string;
  };
  
  /** Dashboard widgets */
  widgets?: ModuleWidget[];
  
  /** Page builder components */
  pageComponents?: ModulePageComponent[];
  
  /** Navigation menu items */
  navItems?: ModuleNavItem[];
  
  /** Custom routes/pages */
  routes?: ModuleRoute[];
}

export interface ModuleWidget {
  id: string;
  name: string;
  component: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  defaultPosition?: { x: number; y: number };
}

export interface ModulePageComponent {
  id: string;
  name: string;
  description?: string;
  component: string;
  icon?: string;
  category?: string;
  props?: ModuleComponentProp[];
}

export interface ModuleComponentProp {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'image' | 'richtext';
  label: string;
  default?: unknown;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export interface ModuleNavItem {
  id: string;
  label: string;
  icon?: string;
  path: string;
  position?: 'main' | 'settings' | 'footer';
  order?: number;
}

export interface ModuleRoute {
  path: string;
  component: string;
  layout?: string;
  auth?: boolean;
}

// ============================================================================
// PERMISSIONS & HOOKS
// ============================================================================

/**
 * Permission required by the module
 */
export interface ModulePermission {
  /** Permission identifier */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Description of what this permission grants */
  description: string;
  
  /** Whether this permission is required (vs optional) */
  required?: boolean;
  
  /** Scope of the permission */
  scope?: 'read' | 'write' | 'admin';
}

/**
 * Hook into platform events
 */
export interface ModuleHook {
  /** Event to hook into */
  event: ModuleHookEvent;
  
  /** Handler function name */
  handler: string;
  
  /** Priority (lower runs first) */
  priority?: number;
}

export type ModuleHookEvent =
  | 'site.created'
  | 'site.updated'
  | 'site.deleted'
  | 'page.created'
  | 'page.updated'
  | 'page.deleted'
  | 'page.published'
  | 'user.created'
  | 'user.updated'
  | 'module.installed'
  | 'module.uninstalled'
  | 'module.enabled'
  | 'module.disabled';

// ============================================================================
// MANIFEST VALIDATION
// ============================================================================

/**
 * Validate a module manifest
 * 
 * @param manifest - The manifest to validate
 * @returns Validation result with any errors
 */
export function validateManifest(manifest: Partial<ModuleManifest>): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields
  if (!manifest.id) errors.push('id is required');
  if (!manifest.name) errors.push('name is required');
  if (!manifest.version) errors.push('version is required');
  if (!manifest.description) errors.push('description is required');
  if (!manifest.type) errors.push('type is required');
  if (!manifest.category) errors.push('category is required');
  if (!manifest.author) errors.push('author is required');
  
  // Version format
  if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
    errors.push('version must be in semver format (e.g., 1.0.0)');
  }
  
  // Description length
  if (manifest.description && manifest.description.length > 200) {
    warnings.push('description should be under 200 characters');
  }
  
  // Database validation
  if (manifest.database) {
    const db = manifest.database;
    
    // Check isolation matches type
    if (manifest.type === 'widget' && db.isolation !== 'none') {
      errors.push('widget modules must use isolation: none');
    }
    if (manifest.type === 'system' && db.isolation !== 'schema') {
      warnings.push('system modules should typically use isolation: schema');
    }
    if (manifest.type === 'integration' && db.isolation !== 'none') {
      errors.push('integration modules should not have database tables');
    }
    
    // Validate tables
    if (db.tables) {
      for (const table of db.tables) {
        if (!table.name) {
          errors.push('table name is required');
        }
        if (!table.columns || table.columns.length === 0) {
          errors.push(`table ${table.name} must have at least one column`);
        }
        
        // Check for primary key
        const hasPK = table.columns.some(c => c.primaryKey);
        if (!hasPK) {
          warnings.push(`table ${table.name} has no primary key defined`);
        }
        
        // Check for site_id if using site isolation
        if (table.rls?.template === 'site_isolation') {
          const hasSiteId = table.columns.some(c => c.name === 'site_id');
          if (!hasSiteId) {
            errors.push(`table ${table.name} requires site_id column for site_isolation RLS`);
          }
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Parse and validate a YAML manifest string
 * 
 * Note: This function requires the 'yaml' package to be installed.
 * Install with: pnpm add yaml
 * 
 * @param yamlString - The YAML content
 * @returns Parsed manifest or errors
 */
export async function parseManifestYAML(yamlString: string): Promise<{
  manifest?: ModuleManifest;
  errors: string[];
}> {
  try {
    // Dynamic import for yaml parsing (to avoid bundling in client)
    // @ts-expect-error - yaml package may not be installed
    const yaml = await import('yaml').catch(() => null);
    
    if (!yaml) {
      return { errors: ['YAML parser not available. Install with: pnpm add yaml'] };
    }
    
    const parsed = yaml.parse(yamlString);
    
    const validation = validateManifest(parsed);
    
    if (!validation.valid) {
      return { errors: validation.errors };
    }
    
    return { 
      manifest: parsed as ModuleManifest,
      errors: [],
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { errors: [`YAML parsing error: ${message}`] };
  }
}
