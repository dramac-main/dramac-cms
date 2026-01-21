/**
 * Module Naming Utilities
 * 
 * Phase EM-05: Module Naming Conventions & Conflict Prevention
 * 
 * Establishes a bulletproof naming convention for module database objects that:
 * 1. Guarantees uniqueness across all modules (even duplicate concepts)
 * 2. Prevents conflicts when multiple developers build similar modules
 * 3. Allows easy identification of which module owns which tables
 * 4. Follows industry best practices from Salesforce, WordPress, and Shopify
 * 
 * @see phases/enterprise-modules/PHASE-EM-05-MODULE-NAMING-CONVENTIONS.md
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createHash } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

// Note: The RPC functions (check_table_exists, get_module_tables, etc.) are created by
// migrations/phase-em05-module-naming.sql. Until the migration is run and types are
// regenerated, we need to use 'any' casts for these calls.

// ============================================================================
// MODULE SHORT ID GENERATION
// ============================================================================

/**
 * Generate a unique, deterministic short ID for a module
 * This ensures the same module always gets the same prefix
 * 
 * Uses first 8 characters of UUID (after removing hyphens)
 * This gives us 16^8 = 4.29 billion unique combinations
 * 
 * @param moduleId - The full UUID of the module
 * @returns 8-character lowercase hex string
 * 
 * @example
 * generateModuleShortId('a1b2c3d4-e5f6-7890-abcd-ef1234567890')
 * // Returns: 'a1b2c3d4'
 */
export function generateModuleShortId(moduleId: string): string {
  // Use first 8 characters of UUID (after removing hyphens)
  const cleanId = moduleId.replace(/-/g, '');
  return cleanId.substring(0, 8).toLowerCase();
}

/**
 * Alternative: Hash-based short ID (if UUIDs aren't suitable)
 * Useful when module IDs might not be UUIDs
 * 
 * Combines publisher ID and module ID for additional uniqueness
 * 
 * @param moduleId - The module identifier
 * @param publisherId - The publisher/developer identifier
 * @returns 8-character lowercase hex string derived from SHA-256 hash
 * 
 * @example
 * generateModuleHashId('my-crm-module', 'publisher-123')
 * // Returns: 'f7a82b3c' (deterministic hash)
 */
export function generateModuleHashId(moduleId: string, publisherId: string): string {
  const combined = `${publisherId}:${moduleId}`;
  const hash = createHash('sha256').update(combined).digest('hex');
  return hash.substring(0, 8).toLowerCase();
}

/**
 * Validate that a short ID follows the expected format
 * 
 * @param shortId - The short ID to validate
 * @returns true if valid 8-character hex string
 */
export function isValidShortId(shortId: string): boolean {
  return /^[a-f0-9]{8}$/.test(shortId);
}

// ============================================================================
// TABLE NAMING
// ============================================================================

/**
 * Sanitize a table name to only contain valid PostgreSQL identifier characters
 * 
 * @param tableName - The raw table name
 * @returns Sanitized lowercase table name with only alphanumeric and underscore
 */
export function sanitizeTableName(tableName: string): string {
  return tableName.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
}

/**
 * Generate a safe, prefixed table name for a module
 * 
 * For schema-based isolation (System modules):
 *   Returns: mod_{short_id}.{table_name}
 * 
 * For table-based isolation (App modules):
 *   Returns: mod_{short_id}_{table_name}
 * 
 * @param moduleShortId - The 8-character module short ID
 * @param tableName - The table name (will be sanitized)
 * @param useSchema - Whether to use schema-based isolation
 * @returns Full qualified table name
 * 
 * @example
 * getModuleTableName('a1b2c3d4', 'contacts', true)
 * // Returns: 'mod_a1b2c3d4.contacts'
 * 
 * getModuleTableName('a1b2c3d4', 'contacts', false)
 * // Returns: 'mod_a1b2c3d4_contacts'
 */
export function getModuleTableName(
  moduleShortId: string,
  tableName: string,
  useSchema: boolean = false
): string {
  const safeTableName = sanitizeTableName(tableName);
  
  if (useSchema) {
    return `mod_${moduleShortId}.${safeTableName}`;
  }
  return `mod_${moduleShortId}_${safeTableName}`;
}

/**
 * Generate schema name for a module
 * 
 * @param moduleShortId - The 8-character module short ID
 * @returns Schema name in format 'mod_{short_id}'
 * 
 * @example
 * getModuleSchemaName('a1b2c3d4')
 * // Returns: 'mod_a1b2c3d4'
 */
export function getModuleSchemaName(moduleShortId: string): string {
  return `mod_${moduleShortId}`;
}

/**
 * Generate an index name for a module table
 * 
 * @param moduleShortId - The 8-character module short ID
 * @param tableName - The table name
 * @param indexName - The index identifier
 * @returns Index name in format 'idx_{short_id}_{table}_{name}'
 */
export function getModuleIndexName(
  moduleShortId: string,
  tableName: string,
  indexName: string
): string {
  return `idx_${moduleShortId}_${sanitizeTableName(tableName)}_${sanitizeTableName(indexName)}`;
}

/**
 * Parse a module table name to extract the short ID
 * 
 * @param fullTableName - The full table name (with or without schema)
 * @returns The extracted short ID or null if not a module table
 * 
 * @example
 * extractShortIdFromTableName('mod_a1b2c3d4_contacts')
 * // Returns: 'a1b2c3d4'
 * 
 * extractShortIdFromTableName('mod_a1b2c3d4.contacts')
 * // Returns: 'a1b2c3d4'
 */
export function extractShortIdFromTableName(fullTableName: string): string | null {
  // Match both schema-based and table-based patterns
  const schemaMatch = fullTableName.match(/^mod_([a-f0-9]{8})\./);
  if (schemaMatch) {
    return schemaMatch[1];
  }
  
  const tableMatch = fullTableName.match(/^mod_([a-f0-9]{8})_/);
  if (tableMatch) {
    return tableMatch[1];
  }
  
  return null;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Reserved table names that modules cannot use
 * These are platform tables that should never be created by modules
 */
export const RESERVED_TABLE_NAMES = [
  'users',
  'sites',
  'pages',
  'sections',
  'components',
  'agencies',
  'clients',
  'modules',
  'modules_v2',
  'module_source',
  'subscriptions',
  'invoices',
  'billing_customers',
  'profiles',
  'settings',
  'analytics',
  'sessions',
  'assets',
  'templates',
  'site_modules',
  'module_subscriptions',
  'blogs',
  'blog_posts',
  'forms',
  'form_submissions',
] as const;

export type ReservedTableName = typeof RESERVED_TABLE_NAMES[number];

/**
 * Check if a table name is reserved by the platform
 * 
 * @param tableName - The table name to check
 * @returns true if the name is reserved
 */
export function isReservedTableName(tableName: string): boolean {
  return RESERVED_TABLE_NAMES.includes(tableName.toLowerCase() as ReservedTableName);
}

/**
 * Validate that a module's proposed table names don't conflict
 * Checks against both reserved names and existing tables
 * 
 * @param moduleShortId - The module's short ID
 * @param proposedTables - Array of proposed table names (without prefix)
 * @returns Validation result with any conflicts found
 */
export async function validateModuleTableNames(
  moduleShortId: string,
  proposedTables: string[]
): Promise<{ 
  valid: boolean; 
  conflicts: string[]; 
  reservedConflicts: string[];
  errors: string[];
}> {
  const supabase = createAdminClient();
  const conflicts: string[] = [];
  const reservedConflicts: string[] = [];
  const errors: string[] = [];
  
  for (const tableName of proposedTables) {
    // Check reserved names first
    if (isReservedTableName(tableName)) {
      reservedConflicts.push(tableName);
      continue;
    }
    
    const fullName = `mod_${moduleShortId}_${sanitizeTableName(tableName)}`;
    
    try {
      // Check if table already exists using the helper function
      // Note: This RPC is created by phase-em05-module-naming.sql migration
      const { data, error } = await (supabase as any).rpc('check_table_exists', {
        table_name: fullName
      });
      
      if (error) {
        errors.push(`Error checking ${fullName}: ${error.message}`);
        continue;
      }
      
      if (data) {
        conflicts.push(fullName);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Exception checking ${fullName}: ${message}`);
    }
  }
  
  return {
    valid: conflicts.length === 0 && reservedConflicts.length === 0,
    conflicts,
    reservedConflicts,
    errors
  };
}

/**
 * Check if a short ID is already in use by another module
 * 
 * @param shortId - The short ID to check
 * @returns true if the short ID is already registered
 */
export async function isShortIdInUse(shortId: string): Promise<boolean> {
  const supabase = createAdminClient();
  
  // Note: module_database_registry table is created by phase-em05-module-naming.sql
  const { data, error } = await (supabase as any)
    .from('module_database_registry')
    .select('id')
    .eq('module_short_id', shortId)
    .maybeSingle();
  
  if (error) {
    console.error('Error checking short ID:', error);
    return true; // Fail safe - assume in use if we can't check
  }
  
  return data !== null;
}

// ============================================================================
// MODULE TIER HELPERS
// ============================================================================

/**
 * Module tier determines database isolation level
 */
export type ModuleTier = 'widget' | 'app' | 'system' | 'integration';

/**
 * Get the database isolation strategy for a module tier
 * 
 * @param tier - The module tier
 * @returns The isolation strategy description
 */
export function getIsolationStrategy(tier: ModuleTier): {
  approach: 'shared' | 'tables' | 'schema' | 'none';
  description: string;
  namingPattern: string;
} {
  switch (tier) {
    case 'widget':
      return {
        approach: 'shared',
        description: 'Shared module_data table',
        namingPattern: '{module_id}:{data_key}'
      };
    case 'app':
      return {
        approach: 'tables',
        description: 'Prefixed tables in public schema',
        namingPattern: 'mod_{short_id}_{table_name}'
      };
    case 'system':
      return {
        approach: 'schema',
        description: 'Dedicated PostgreSQL schema',
        namingPattern: 'mod_{short_id}.{table_name}'
      };
    case 'integration':
      return {
        approach: 'none',
        description: 'No database tables (external data)',
        namingPattern: 'N/A'
      };
  }
}

/**
 * Determine if a module tier should use schema isolation
 * 
 * @param tier - The module tier
 * @returns true if the tier uses dedicated schema
 */
export function shouldUseSchema(tier: ModuleTier): boolean {
  return tier === 'system';
}

/**
 * Determine if a module tier can create database tables
 * 
 * @param tier - The module tier
 * @returns true if the tier can create tables
 */
export function canCreateTables(tier: ModuleTier): boolean {
  return tier === 'app' || tier === 'system';
}
