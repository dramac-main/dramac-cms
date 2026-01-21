/**
 * @dramac/sdk - Migration Helpers
 * 
 * Utilities for managing database migrations
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { TableDefinition, ColumnDefinition, RLSPolicy, IndexDefinition } from '../types/module';
import type { MigrationDefinition, MigrationStatus } from '../types/database';

/**
 * Generate CREATE TABLE SQL from table definition
 */
export function generateCreateTableSQL(
  tablePrefix: string,
  table: TableDefinition
): string {
  const fullTableName = `${tablePrefix}_${table.name}`;
  
  const columnDefs = table.columns.map((col) => {
    let def = `"${col.name}" ${mapColumnType(col.type)}`;
    
    if (col.primaryKey) {
      def += ' PRIMARY KEY';
      if (col.type === 'uuid') {
        def += ' DEFAULT gen_random_uuid()';
      }
    }
    
    if (!col.nullable && !col.primaryKey) {
      def += ' NOT NULL';
    }
    
    if (col.unique) {
      def += ' UNIQUE';
    }
    
    if (col.default !== undefined && !col.primaryKey) {
      def += ` DEFAULT ${formatDefault(col.default)}`;
    }
    
    return def;
  });
  
  // Add foreign key constraints
  const fkConstraints = table.columns
    .filter((col) => col.references)
    .map((col) => {
      const ref = col.references!;
      let constraint = `FOREIGN KEY ("${col.name}") REFERENCES "${ref.table}"("${ref.column}")`;
      if (ref.onDelete) {
        constraint += ` ON DELETE ${ref.onDelete.toUpperCase()}`;
      }
      if (ref.onUpdate) {
        constraint += ` ON UPDATE ${ref.onUpdate.toUpperCase()}`;
      }
      return constraint;
    });
  
  const allDefs = [...columnDefs, ...fkConstraints];
  
  return `CREATE TABLE IF NOT EXISTS "${fullTableName}" (\n  ${allDefs.join(',\n  ')}\n);`;
}

/**
 * Generate RLS policies SQL
 */
export function generateRLSPoliciesSQL(
  tablePrefix: string,
  tableName: string,
  policies: RLSPolicy[]
): string {
  const fullTableName = `${tablePrefix}_${tableName}`;
  const statements: string[] = [];
  
  // Enable RLS
  statements.push(`ALTER TABLE "${fullTableName}" ENABLE ROW LEVEL SECURITY;`);
  
  for (const policy of policies) {
    const operations = policy.operation === 'ALL'
      ? ['SELECT', 'INSERT', 'UPDATE', 'DELETE']
      : [policy.operation];
    
    for (const op of operations) {
      const policyName = `${policy.name}_${op.toLowerCase()}`;
      let sql = `CREATE POLICY "${policyName}" ON "${fullTableName}" FOR ${op}`;
      
      if (policy.role) {
        sql += ` TO ${policy.role}`;
      }
      
      if (policy.using) {
        sql += ` USING (${policy.using})`;
      }
      
      if (policy.check && (op === 'INSERT' || op === 'UPDATE')) {
        sql += ` WITH CHECK (${policy.check})`;
      }
      
      statements.push(sql + ';');
    }
  }
  
  return statements.join('\n');
}

/**
 * Generate index SQL
 */
export function generateIndexSQL(
  tablePrefix: string,
  tableName: string,
  indexes: IndexDefinition[]
): string {
  const fullTableName = `${tablePrefix}_${tableName}`;
  
  return indexes.map((idx) => {
    const columns = idx.columns.map((c) => `"${c}"`).join(', ');
    const unique = idx.unique ? 'UNIQUE ' : '';
    const using = idx.using ? ` USING ${idx.using}` : '';
    const where = idx.where ? ` WHERE ${idx.where}` : '';
    
    return `CREATE ${unique}INDEX IF NOT EXISTS "${idx.name}" ON "${fullTableName}"${using} (${columns})${where};`;
  }).join('\n');
}

/**
 * Generate full migration SQL for a table
 */
export function generateTableMigration(
  tablePrefix: string,
  table: TableDefinition
): { up: string; down: string } {
  const fullTableName = `${tablePrefix}_${table.name}`;
  
  const upStatements: string[] = [];
  const downStatements: string[] = [];
  
  // Create table
  upStatements.push(generateCreateTableSQL(tablePrefix, table));
  
  // Add RLS policies
  if (table.rls?.length) {
    upStatements.push(generateRLSPoliciesSQL(tablePrefix, table.name, table.rls));
  }
  
  // Add indexes
  if (table.indexes?.length) {
    upStatements.push(generateIndexSQL(tablePrefix, table.name, table.indexes));
  }
  
  // Drop table for rollback
  downStatements.push(`DROP TABLE IF EXISTS "${fullTableName}" CASCADE;`);
  
  return {
    up: upStatements.join('\n\n'),
    down: downStatements.join('\n'),
  };
}

/**
 * Map SDK column types to PostgreSQL types
 */
function mapColumnType(type: ColumnDefinition['type']): string {
  const typeMap: Record<string, string> = {
    uuid: 'UUID',
    text: 'TEXT',
    varchar: 'VARCHAR(255)',
    integer: 'INTEGER',
    bigint: 'BIGINT',
    decimal: 'DECIMAL(10,2)',
    numeric: 'NUMERIC',
    real: 'REAL',
    boolean: 'BOOLEAN',
    timestamp: 'TIMESTAMP',
    timestamptz: 'TIMESTAMPTZ',
    date: 'DATE',
    time: 'TIME',
    jsonb: 'JSONB',
    json: 'JSON',
    array: 'TEXT[]',
    bytea: 'BYTEA',
  };
  
  return typeMap[type] || 'TEXT';
}

/**
 * Format default value for SQL
 */
function formatDefault(value: string | number | boolean | null): string {
  if (value === null) return 'NULL';
  if (typeof value === 'boolean') return value.toString().toUpperCase();
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') {
    // Check if it's a SQL expression
    if (value.includes('(') || value.toUpperCase() === 'NOW()' || value.toUpperCase() === 'CURRENT_TIMESTAMP') {
      return value;
    }
    return `'${value.replace(/'/g, "''")}'`;
  }
  return 'NULL';
}

/**
 * Migration runner class
 */
export class MigrationRunner {
  private client: SupabaseClient;
  private moduleId: string;
  
  constructor(client: SupabaseClient, moduleId: string) {
    this.client = client;
    this.moduleId = moduleId;
  }
  
  /**
   * Get migration status for all migrations
   */
  async getStatus(migrations: MigrationDefinition[]): Promise<MigrationStatus[]> {
    const { data: applied } = await this.client
      .from('module_migrations')
      .select('version, name, applied_at')
      .eq('module_id', this.moduleId);
    
    const appliedMap = new Map(
      (applied || []).map((m) => [m.version, m])
    );
    
    return migrations.map((m) => {
      const record = appliedMap.get(m.version);
      return {
        version: m.version,
        name: m.name,
        appliedAt: record ? new Date(record.applied_at) : null,
        status: record ? 'applied' : 'pending',
      };
    });
  }
  
  /**
   * Run pending migrations
   */
  async migrate(migrations: MigrationDefinition[]): Promise<{
    applied: string[];
    errors: Array<{ version: string; error: string }>;
  }> {
    const status = await this.getStatus(migrations);
    const pending = status.filter((s) => s.status === 'pending');
    
    const applied: string[] = [];
    const errors: Array<{ version: string; error: string }> = [];
    
    for (const migration of pending) {
      const def = migrations.find((m) => m.version === migration.version);
      if (!def) continue;
      
      try {
        // Run migration SQL
        await this.client.rpc('exec_ddl', { ddl_statement: def.up });
        
        // Record migration
        await this.client.from('module_migrations').insert({
          module_id: this.moduleId,
          version: def.version,
          name: def.name,
          applied_at: new Date().toISOString(),
        });
        
        applied.push(def.version);
      } catch (error) {
        errors.push({
          version: def.version,
          error: error instanceof Error ? error.message : String(error),
        });
        break; // Stop on first error
      }
    }
    
    return { applied, errors };
  }
  
  /**
   * Rollback last migration
   */
  async rollback(migrations: MigrationDefinition[]): Promise<{
    rolledBack: string | null;
    error: string | null;
  }> {
    const status = await this.getStatus(migrations);
    const appliedMigrations = status.filter((s) => s.status === 'applied');
    
    if (appliedMigrations.length === 0) {
      return { rolledBack: null, error: 'No migrations to rollback' };
    }
    
    // Get the last applied migration
    const last = appliedMigrations[appliedMigrations.length - 1];
    const def = migrations.find((m) => m.version === last.version);
    
    if (!def) {
      return { rolledBack: null, error: 'Migration definition not found' };
    }
    
    try {
      // Run rollback SQL
      await this.client.rpc('exec_ddl', { ddl_statement: def.down });
      
      // Remove migration record
      await this.client
        .from('module_migrations')
        .delete()
        .eq('module_id', this.moduleId)
        .eq('version', def.version);
      
      return { rolledBack: def.version, error: null };
    } catch (error) {
      return {
        rolledBack: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

/**
 * Create a migration runner
 */
export function createMigrationRunner(
  client: SupabaseClient,
  moduleId: string
): MigrationRunner {
  return new MigrationRunner(client, moduleId);
}
