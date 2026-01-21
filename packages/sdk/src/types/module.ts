/**
 * @dramac/sdk - Types Module
 * 
 * Core TypeScript definitions for Dramac modules
 */

/**
 * Module definition file (dramac.config.ts)
 */
export interface DramacModuleConfig {
  // Identity
  id: string;
  name: string;
  version: string;
  description: string;
  
  // Display
  icon: string;
  category: ModuleCategory;
  tags?: string[];
  
  // Type (determines isolation level)
  type: 'app' | 'custom' | 'system';
  
  // Requirements
  requires?: {
    platform?: string;  // Min platform version
    modules?: string[]; // Required modules
  };
  
  // Pricing (for marketplace)
  pricing?: {
    type: 'free' | 'paid' | 'subscription';
    price?: number;
    currency?: string;
    interval?: 'monthly' | 'yearly';
  };
  
  // Entry points
  entry: {
    dashboard?: string;    // Dashboard component
    settings?: string;     // Settings component
    embed?: string;        // Embed component
    api?: string;          // API routes
  };
  
  // Database
  database?: {
    tables: TableDefinition[];
    migrations?: string;  // Path to migrations
  };
  
  // Permissions
  permissions?: PermissionDefinition[];
  
  // Roles
  roles?: RoleDefinition[];
  
  // API routes
  routes?: RouteDefinition[];
  
  // Webhooks
  webhooks?: WebhookDefinition[];
  
  // Settings schema
  settings?: SettingsSchema;
}

/**
 * Module categories for marketplace organization
 */
export type ModuleCategory =
  | 'crm'
  | 'booking'
  | 'ecommerce'
  | 'analytics'
  | 'marketing'
  | 'communication'
  | 'payments'
  | 'social'
  | 'content'
  | 'automation'
  | 'integration'
  | 'utility';

/**
 * Database table definition
 */
export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  indexes?: IndexDefinition[];
  rls?: RLSPolicy[];
}

/**
 * Column definition for database tables
 */
export interface ColumnDefinition {
  name: string;
  type: ColumnType;
  primaryKey?: boolean;
  nullable?: boolean;
  default?: string | number | boolean | null;
  unique?: boolean;
  references?: {
    table: string;
    column: string;
    onDelete?: 'cascade' | 'set null' | 'restrict' | 'no action';
    onUpdate?: 'cascade' | 'set null' | 'restrict' | 'no action';
  };
}

/**
 * Supported column types
 */
export type ColumnType =
  | 'uuid'
  | 'text'
  | 'varchar'
  | 'integer'
  | 'bigint'
  | 'decimal'
  | 'numeric'
  | 'real'
  | 'boolean'
  | 'timestamp'
  | 'timestamptz'
  | 'date'
  | 'time'
  | 'jsonb'
  | 'json'
  | 'array'
  | 'bytea';

/**
 * Index definition for database tables
 */
export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
  where?: string;
  using?: 'btree' | 'hash' | 'gin' | 'gist';
}

/**
 * Row Level Security policy definition
 */
export interface RLSPolicy {
  name: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  check?: string;
  using?: string;
  role?: string;
}

/**
 * Permission definition for RBAC
 */
export interface PermissionDefinition {
  key: string;
  name: string;
  description?: string;
  category?: string;
}

/**
 * Role definition for RBAC
 */
export interface RoleDefinition {
  slug: string;
  name: string;
  description?: string;
  permissions: string[];
  hierarchyLevel: number;
  isDefault?: boolean;
}

/**
 * API route definition
 */
export interface RouteDefinition {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  handler: string;  // Path to handler function
  auth?: boolean;
  scopes?: string[];
  rateLimit?: number;
  description?: string;
}

/**
 * Webhook definition
 */
export interface WebhookDefinition {
  event: string;
  handler: string;
  description?: string;
}

/**
 * Settings schema for module configuration
 */
export interface SettingsSchema {
  sections: SettingsSection[];
}

/**
 * Settings section grouping
 */
export interface SettingsSection {
  id: string;
  title: string;
  description?: string;
  fields: SettingsField[];
}

/**
 * Settings field definition
 */
export interface SettingsField {
  id: string;
  type: SettingsFieldType;
  label: string;
  description?: string;
  default?: unknown;
  placeholder?: string;
  options?: { label: string; value: unknown }[];
  validation?: SettingsValidation;
  dependsOn?: {
    field: string;
    value: unknown;
  };
}

/**
 * Settings field types
 */
export type SettingsFieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'color'
  | 'json'
  | 'textarea'
  | 'url'
  | 'email'
  | 'password'
  | 'date'
  | 'datetime'
  | 'file'
  | 'image';

/**
 * Settings field validation rules
 */
export interface SettingsValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
}

/**
 * Module runtime context
 */
export interface ModuleRuntimeContext {
  moduleId: string;
  siteId: string;
  userId?: string;
  permissions: string[];
  settings: Record<string, unknown>;
}

/**
 * Module lifecycle events
 */
export type ModuleLifecycleEvent =
  | 'install'
  | 'uninstall'
  | 'enable'
  | 'disable'
  | 'upgrade'
  | 'configure';

/**
 * Module lifecycle handler
 */
export interface ModuleLifecycleHandler {
  onInstall?: (context: ModuleRuntimeContext) => Promise<void>;
  onUninstall?: (context: ModuleRuntimeContext) => Promise<void>;
  onEnable?: (context: ModuleRuntimeContext) => Promise<void>;
  onDisable?: (context: ModuleRuntimeContext) => Promise<void>;
  onUpgrade?: (context: ModuleRuntimeContext, fromVersion: string) => Promise<void>;
  onConfigure?: (context: ModuleRuntimeContext, settings: Record<string, unknown>) => Promise<void>;
}
