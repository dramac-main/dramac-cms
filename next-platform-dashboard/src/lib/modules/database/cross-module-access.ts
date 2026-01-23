/**
 * Cross-Module Data Access
 * 
 * Provides controlled access between modules while maintaining tenant isolation.
 * All cross-module access is governed by explicit permissions and logged for audit.
 * 
 * @module modules/database/cross-module-access
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createAdminClient } from '@/lib/supabase/admin';
import type { TenantContext } from '@/lib/multi-tenant/tenant-context';

// Helper type to bypass strict Supabase typing for dynamic tables
type AnySupabaseClient = any;

/**
 * Permission definition for cross-module access
 */
export interface CrossModulePermission {
  /** Source module requesting access */
  sourceModule: string;
  /** Target module being accessed ('*' for all) */
  targetModule: string;
  /** Allowed tables ('*' for all) */
  allowedTables: string[];
  /** Allowed operations */
  allowedOperations: ('read' | 'write')[];
  /** Optional description */
  description?: string;
}

/**
 * Registry of allowed cross-module access permissions
 * This can be extended via database configuration in production
 */
const CROSS_MODULE_PERMISSIONS: CrossModulePermission[] = [
  // CRM can read from Booking for customer appointments
  {
    sourceModule: 'crm',
    targetModule: 'booking',
    allowedTables: ['appointments', 'calendars'],
    allowedOperations: ['read'],
    description: 'CRM reads booking appointments for customer timeline'
  },
  // Booking can read CRM contacts
  {
    sourceModule: 'booking',
    targetModule: 'crm',
    allowedTables: ['contacts', 'companies'],
    allowedOperations: ['read'],
    description: 'Booking reads CRM contacts for appointment assignment'
  },
  // E-commerce can read CRM for customer data
  {
    sourceModule: 'ecommerce',
    targetModule: 'crm',
    allowedTables: ['contacts'],
    allowedOperations: ['read'],
    description: 'E-commerce reads CRM contacts for customer profiles'
  },
  // Analytics can read from all modules
  {
    sourceModule: 'analytics',
    targetModule: '*',
    allowedTables: ['*'],
    allowedOperations: ['read'],
    description: 'Analytics has read access to all modules for reporting'
  },
  // Forms can write to CRM (lead capture)
  {
    sourceModule: 'forms',
    targetModule: 'crm',
    allowedTables: ['contacts', 'leads'],
    allowedOperations: ['read', 'write'],
    description: 'Forms can create CRM contacts from submissions'
  },
  // Email marketing can read CRM contacts
  {
    sourceModule: 'email-marketing',
    targetModule: 'crm',
    allowedTables: ['contacts', 'segments'],
    allowedOperations: ['read'],
    description: 'Email marketing reads CRM contacts for campaigns'
  }
];

/**
 * Access log entry
 */
interface AccessLogEntry {
  sourceModule: string;
  targetModule: string;
  tableName: string;
  operation: 'read' | 'write';
  recordCount?: number;
  context: TenantContext;
  timestamp: Date;
}

/**
 * Cross-module query options
 */
export interface CrossModuleQueryOptions {
  /** Columns to select */
  select?: string;
  /** Filter conditions */
  filters?: Record<string, any>;
  /** Maximum records to return */
  limit?: number;
  /** Order by column */
  orderBy?: string;
  /** Order direction */
  orderDirection?: 'asc' | 'desc';
}

/**
 * Create cross-module data accessor
 */
export function createCrossModuleAccess(
  sourceModule: string,
  context: TenantContext
) {
  const supabase = createAdminClient() as AnySupabaseClient;
  
  /**
   * Check if access is permitted
   */
  function checkPermission(
    targetModule: string,
    tableName: string,
    operation: 'read' | 'write'
  ): CrossModulePermission | null {
    return CROSS_MODULE_PERMISSIONS.find(p =>
      p.sourceModule === sourceModule &&
      (p.targetModule === targetModule || p.targetModule === '*') &&
      (p.allowedTables.includes(tableName) || p.allowedTables.includes('*')) &&
      p.allowedOperations.includes(operation)
    ) || null;
  }
  
  /**
   * Log cross-module access for audit trail
   */
  async function logAccess(entry: AccessLogEntry): Promise<void> {
    try {
      await supabase.from('module_access_logs').insert({
        source_module: entry.sourceModule,
        target_module: entry.targetModule,
        table_name: entry.tableName,
        operation: entry.operation,
        site_id: entry.context.siteId,
        agency_id: entry.context.agencyId,
        user_id: entry.context.userId,
        metadata: {
          record_count: entry.recordCount,
          timestamp: entry.timestamp.toISOString()
        }
      });
    } catch (error) {
      // Don't fail on logging error, but log it
      console.error('Failed to log cross-module access:', error);
    }
  }
  
  /**
   * Find table name in module registry
   */
  async function findTableName(
    targetModule: string,
    tableName: string
  ): Promise<string | null> {
    // Try to find the table in the module registry
    const { data } = await supabase
      .from('module_database_registry')
      .select('table_name')
      .ilike('table_name', `mod_%_${tableName}`)
      .eq('status', 'active')
      .limit(1)
      .single();
    
    return data?.table_name || null;
  }
  
  return {
    /**
     * Get the source module name
     */
    getSourceModule(): string {
      return sourceModule;
    },
    
    /**
     * Check if read access is permitted to a target module/table
     */
    canRead(targetModule: string, tableName: string): boolean {
      return checkPermission(targetModule, tableName, 'read') !== null;
    },
    
    /**
     * Check if write access is permitted to a target module/table
     */
    canWrite(targetModule: string, tableName: string): boolean {
      return checkPermission(targetModule, tableName, 'write') !== null;
    },
    
    /**
     * Get list of accessible modules
     */
    getAccessibleModules(): string[] {
      const modules = new Set<string>();
      
      CROSS_MODULE_PERMISSIONS
        .filter(p => p.sourceModule === sourceModule)
        .forEach(p => {
          if (p.targetModule === '*') {
            modules.add('*'); // Has access to all
          } else {
            modules.add(p.targetModule);
          }
        });
      
      return Array.from(modules);
    },
    
    /**
     * Read from another module's table
     */
    async readFrom<T = any>(
      targetModule: string,
      tableName: string,
      options?: CrossModuleQueryOptions
    ): Promise<T[]> {
      // Check permission
      const permission = checkPermission(targetModule, tableName, 'read');
      if (!permission) {
        throw new CrossModuleAccessError(
          `Cross-module access denied: ${sourceModule} cannot read ${targetModule}.${tableName}`,
          'ACCESS_DENIED'
        );
      }
      
      // Find the actual table name
      const fullTableName = await findTableName(targetModule, tableName);
      if (!fullTableName) {
        throw new CrossModuleAccessError(
          `Table ${tableName} not found in ${targetModule}`,
          'TABLE_NOT_FOUND'
        );
      }
      
      // Build and execute query
      let query = supabase
        .from(fullTableName)
        .select(options?.select || '*')
        .eq('site_id', context.siteId!);
      
      // Apply filters
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options.orderDirection !== 'desc'
        });
      }
      
      // Apply limit
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new CrossModuleAccessError(
          `Failed to read from ${targetModule}.${tableName}: ${error.message}`,
          'QUERY_FAILED'
        );
      }
      
      // Log access
      await logAccess({
        sourceModule,
        targetModule,
        tableName,
        operation: 'read',
        recordCount: data?.length || 0,
        context,
        timestamp: new Date()
      });
      
      return (data || []) as T[];
    },
    
    /**
     * Read a single record from another module
     */
    async readOne<T = any>(
      targetModule: string,
      tableName: string,
      id: string
    ): Promise<T | null> {
      const results = await this.readFrom<T>(targetModule, tableName, {
        filters: { id },
        limit: 1
      });
      
      return results[0] || null;
    },
    
    /**
     * Write to another module's table (if permitted)
     */
    async writeTo<T = any>(
      targetModule: string,
      tableName: string,
      operation: 'insert' | 'update' | 'delete',
      data: Partial<T>,
      id?: string
    ): Promise<T | null> {
      // Check permission
      const permission = checkPermission(targetModule, tableName, 'write');
      if (!permission) {
        throw new CrossModuleAccessError(
          `Cross-module write denied: ${sourceModule} cannot write to ${targetModule}.${tableName}`,
          'WRITE_DENIED'
        );
      }
      
      // Find the actual table name
      const fullTableName = await findTableName(targetModule, tableName);
      if (!fullTableName) {
        throw new CrossModuleAccessError(
          `Table ${tableName} not found in ${targetModule}`,
          'TABLE_NOT_FOUND'
        );
      }
      
      let result: T | null = null;
      
      switch (operation) {
        case 'insert': {
          const insertData = {
            ...data,
            site_id: context.siteId,
            agency_id: context.agencyId,
            created_by: context.userId
          };
          
          const { data: inserted, error } = await supabase
            .from(fullTableName)
            .insert(insertData)
            .select()
            .single();
          
          if (error) {
            throw new CrossModuleAccessError(
              `Failed to insert into ${targetModule}.${tableName}: ${error.message}`,
              'INSERT_FAILED'
            );
          }
          
          result = inserted as T;
          break;
        }
        
        case 'update': {
          if (!id) {
            throw new CrossModuleAccessError(
              'ID required for update operation',
              'ID_REQUIRED'
            );
          }
          
          const { data: updated, error } = await supabase
            .from(fullTableName)
            .update({
              ...data,
              updated_by: context.userId,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('site_id', context.siteId!)
            .select()
            .single();
          
          if (error) {
            throw new CrossModuleAccessError(
              `Failed to update ${targetModule}.${tableName}: ${error.message}`,
              'UPDATE_FAILED'
            );
          }
          
          result = updated as T;
          break;
        }
        
        case 'delete': {
          if (!id) {
            throw new CrossModuleAccessError(
              'ID required for delete operation',
              'ID_REQUIRED'
            );
          }
          
          const { error } = await supabase
            .from(fullTableName)
            .delete()
            .eq('id', id)
            .eq('site_id', context.siteId!);
          
          if (error) {
            throw new CrossModuleAccessError(
              `Failed to delete from ${targetModule}.${tableName}: ${error.message}`,
              'DELETE_FAILED'
            );
          }
          
          result = null;
          break;
        }
      }
      
      // Log access
      await logAccess({
        sourceModule,
        targetModule,
        tableName,
        operation: 'write',
        recordCount: 1,
        context,
        timestamp: new Date()
      });
      
      return result;
    },
    
    /**
     * Count records in another module's table
     */
    async countIn(
      targetModule: string,
      tableName: string,
      filters?: Record<string, any>
    ): Promise<number> {
      // Check permission
      const permission = checkPermission(targetModule, tableName, 'read');
      if (!permission) {
        throw new CrossModuleAccessError(
          `Cross-module access denied: ${sourceModule} cannot read ${targetModule}.${tableName}`,
          'ACCESS_DENIED'
        );
      }
      
      const fullTableName = await findTableName(targetModule, tableName);
      if (!fullTableName) {
        throw new CrossModuleAccessError(
          `Table ${tableName} not found in ${targetModule}`,
          'TABLE_NOT_FOUND'
        );
      }
      
      let query = supabase
        .from(fullTableName)
        .select('id', { count: 'exact', head: true })
        .eq('site_id', context.siteId!);
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      const { count, error } = await query;
      
      if (error) {
        throw new CrossModuleAccessError(
          `Failed to count in ${targetModule}.${tableName}: ${error.message}`,
          'COUNT_FAILED'
        );
      }
      
      return count || 0;
    },
    
    /**
     * Get access logs for this module
     */
    async getAccessLogs(options?: {
      limit?: number;
      since?: Date;
    }): Promise<AccessLogEntry[]> {
      let query = supabase
        .from('module_access_logs')
        .select('*')
        .eq('source_module', sourceModule)
        .eq('site_id', context.siteId!)
        .order('created_at', { ascending: false });
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.since) {
        query = query.gte('created_at', options.since.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Failed to get access logs:', error);
        return [];
      }
      
      return (data || []).map((log: any) => ({
        sourceModule: log.source_module,
        targetModule: log.target_module,
        tableName: log.table_name,
        operation: log.operation,
        recordCount: log.metadata?.record_count,
        context: {
          agencyId: log.agency_id,
          siteId: log.site_id,
          userId: log.user_id
        },
        timestamp: new Date(log.created_at)
      }));
    }
  };
}

/**
 * Custom error class for cross-module access errors
 */
export class CrossModuleAccessError extends Error {
  code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'CrossModuleAccessError';
    this.code = code;
  }
}

/**
 * Type for the cross-module access client
 */
export type CrossModuleAccess = ReturnType<typeof createCrossModuleAccess>;

/**
 * Get list of all registered cross-module permissions
 */
export function getAllPermissions(): CrossModulePermission[] {
  return [...CROSS_MODULE_PERMISSIONS];
}

/**
 * Register a new cross-module permission (for runtime configuration)
 * Note: In production, this should be stored in the database
 */
export function registerPermission(permission: CrossModulePermission): void {
  // Check for duplicates
  const exists = CROSS_MODULE_PERMISSIONS.some(
    p =>
      p.sourceModule === permission.sourceModule &&
      p.targetModule === permission.targetModule
  );
  
  if (!exists) {
    CROSS_MODULE_PERMISSIONS.push(permission);
  }
}
